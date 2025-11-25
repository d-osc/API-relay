
// extension/providers/chatgpt.js
(async function () {
  'use strict';
  if (window.location.hostname === 'chatgpt.com') {
    function createState(initialValue) {
      let value = initialValue;
      const listeners = new Set();

      function get() {
        return value;
      }

      function set(newValue) {
        // ถ้าไม่เปลี่ยนจริงๆ ก็ไม่แจ้งเตือน
        if (Object.is(newValue, value)) return;
        value = newValue;
        // แจ้งทุก listener ให้รีเรนเดอร์ใหม่
        listeners.forEach(fn => fn(value));
      }

      function subscribe(listener) {
        listeners.add(listener);
        // ให้ยิงครั้งแรกด้วยค่าเริ่มต้น
        listener(value);
        // คืนฟังก์ชัน unsubscribe
        return () => listeners.delete(listener);
      }

      return { get, set, subscribe };
    }

    const modelState = createState("gpt-5-1");
    const allModelState = createState([]);

    async function getChatGPTModels() {
      try {
        const cacheKey = '["models","{\\"IIM\\":false,\\"isGizmo\\":false}"]';
        const cacheItem = window.__REACT_QUERY_CACHE__[cacheKey];

        if (!cacheItem) {
          console.error('Models cache not found');
          return [];
        }

        // รอให้ promise resolve (ถ้าจำเป็น)
        let data;
        if (cacheItem.promise) {
          data = await cacheItem.promise;
        } else {
          data = cacheItem.state?.data;
        }

        if (!data || !data.models) {
          console.error('Models data not available');
          return [];
        }

        // แปลง Map เป็น array
        const models = Array.from(data.models.entries());
        return models.map(([id, info]) => ({
          id,
          title: info.title,
          description: info.description,
          maxTokens: info.maxTokens,
          tags: info.tags,
          reasoningType: info.reasoningType,
          enabledTools: info.enabledTools,
          ...info
        }));
      } catch (error) {
        console.error('Error getting ChatGPT models:', error);
        return [];
      }
    }

    function getTextAreaSelector() {
      return [
        'div.ProseMirror[contenteditable="true"]',
        'textarea[name="prompt-textarea"]',
        '[contenteditable="true"]',
        'form textarea',
        'textarea'
      ].join(',');
    }

    function getSendButtonSelector() {
      return [
        'button[data-testid="send-button"]',
        'button[aria-label="Send"]',
        'form button[data-testid="send-button"]',
        'form button[aria-label="Send"]',
        'form button[type="submit"]',
        'form button svg[data-testid="SendIcon"]',
        'footer button',
        'form button',
        'button'
      ].join(', ');
    }

    const log = (level, ...args) => {
      try {
        if (typeof console !== 'undefined' && console[level]) {
          console[level]('[ChatGPT Intercept]', ...args);
        }
      } catch { }
    };

    // ========== Network Interceptor ==========
    let capturedResponseQueue = [];
    let isCapturing = false;

    async function* iterSSELines(response) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let index;
        while ((index = buffer.indexOf('\n\n')) !== -1) {
          const rawEvent = buffer.slice(0, index);
          buffer = buffer.slice(index + 2); // ข้าม \n\n
          yield rawEvent;
        }
      }
    }

    function interceptNetworkRequests() {

      // Intercept Fetch API
      // log('info', 'interceptors with model:', modelState.get());
      const originalFetch = window.fetch;
      window.fetch = async function (...args) {
        const url = args[0]?.toString() || '';

        if (url.includes('/backend-api/f/conversation')) {
          let bodyObj = JSON.parse(args[1].body);
          bodyObj.model = modelState.get() || "gpt-5-1";
          console.log("[Injected fetch] PATCHED payload!", bodyObj);
          args[1].body = JSON.stringify(bodyObj);
        }

        const response = await originalFetch.apply(this, args);

        // // log('info', 'Fetch intercepted:', args);
        // ตรวจสอบว่าเป็น ChatGPT API หรือไม่
        // // log('info', 'Fetch URL:', url);
        // log('info', 'isCapturing:', isCapturing);
        if (isCapturing && (url.includes('/backend-api/conversation') || url.includes('/backend-api/f/conversation'))) {


          // log('info', 'Intercepted ChatGPT API request:', url);

          // Clone response เพื่ออ่านข้อมูล (เพราะ response body สามารถอ่านได้ครั้งเดียว)
          const clonedResponse = response.clone();
          // log('info', 'Cloned response :', clonedResponse);
          // log('info', 'Reading response body...');
          try {
            let model_slug = 'unknown';
            let role = 'unknown';
            let id = 'unknown';
            let message_content = '';
            let create_time = 0;
            let input_message = '';
            const cached_tokens = []
            for await (const rawEvent of iterSSELines(clonedResponse)) {
              // rawEvent จะคล้ายๆ:
              // "event: delta\ndata: {...}"
              const lines = rawEvent.split('\n').map(l => l.trim());
              const eventName = lines
                .find(l => l.startsWith('event:'))
                ?.slice('event:'.length)
                ?.trim() || 'message';

              const dataLines = lines
                .filter(l => l.startsWith('data:'))
                .map(l => l.slice('data:'.length).trim());

              if (!dataLines.length) continue;

              const dataStr = dataLines.join('\n'); // เผื่อมีหลาย data: ต่อกัน [web:33]
              if (dataStr === '[DONE]') {
                // console.log('stream done');
                window.postMessage({
                  type: 'V1_CHAT_COMPLETIONS_STREAM',
                  data: `data: [DONE]`
                }, '*');

                window.postMessage({
                  type: 'V1_MESSAGES_STREAM',
                  data: `data: [DONE]`
                }, '*');
                window.postMessage({
                  type: 'V1_CHAT_COMPLETIONS',
                  stream: false,
                  data: {
                    choices: [{
                      finish_reason: 'stop',
                      content: message_content,
                      role: role
                    }],
                    created: create_time,
                    id: id,
                    model: model_slug,
                    request_id: id,
                    usage: {
                      completion_tokens: message_content.length,
                      prompt_tokens: input_message.length,
                      prompt_tokens_details: {
                        cached_tokens: cached_tokens.length,
                      },
                      total_tokens: input_message.length + message_content.length
                    }
                  }
                }, '*');
                window.postMessage({
                  type: 'V1_MESSAGES',
                  stream: false,
                  data: {
                    id: id,
                    type: "message",
                    role: role,
                    model: model_slug,
                    content: [{
                      type: 'text',
                      text: message_content,
                    }],
                    stop_reason: "end_turn",
                    stop_sequence: null,
                    usage: {
                      input_tokens: input_message.length,
                      output_tokens: message_content.length,
                      cache_read_input_tokens: cached_tokens.length,
                    }
                  }
                }, '*');

                // log('info', 'Stream done');
                break;
              }

              try {
                if (eventName === 'delta') {
                  const payload = JSON.parse(dataStr);
                  // log('info', `Parsed event: ${eventName}`, payload);
                  if (payload['v'] && payload['v']['message']) {
                    model_slug = payload['v']['message']['metadata']['model_slug'] || model_slug;
                    role = payload['v']['message']['author']['role'] || role;
                    id = payload['v']['message']['id'] || id;
                    create_time = payload['v']['message']['create_time'] || create_time;
                  } else if (payload['v'] && Array.isArray(payload['v'])) {
                    let message_created = payload['v'].find(item => item['p'] && item['p'] === '/message/create_time');
                    let content = payload['v'].find(item => item['p'] && item['p'] === '/message/content/parts/0');
                    const V1_CHAT_COMPLETIONS = {
                      id: id,
                      created: message_created && message_created.v || 0,
                      model: model_slug,
                      choices: [{
                        index: 0,
                        delta: {
                          role: role,
                          content: content && content.v || '',
                        }
                      }]
                    }

                    const V1_MESSAGES = {
                      type: "text_delta",
                      text: content && content.v || ''
                    }
                    message_content += V1_CHAT_COMPLETIONS.choices[0].delta.content || '';
                    // log('info', `Parsed event: ${eventName}`, `data: ${JSON.stringify(V1_CHAT_COMPLETIONS)}`);
                    window.postMessage({
                      type: 'V1_CHAT_COMPLETIONS_STREAM',
                      data: JSON.stringify(V1_CHAT_COMPLETIONS)
                    }, '*');

                    window.postMessage({
                      type: 'V1_MESSAGES_STREAM',
                      data: JSON.stringify(V1_MESSAGES)
                    }, '*');
                  }



                } else if (eventName === 'message') {
                  const payload = JSON.parse(dataStr);
                  // log('info', `Parsed event: ${eventName}`, payload);
                  if (payload['input_message']) {
                    input_message = payload['input_message']['content']['parts'][0] || '';
                    cached_tokens.push(input_message.length);
                  }
                }
              } catch (e) {
                log('error', 'JSON parse error:', dataStr, e);
              }
            }
          } catch (error) {
            log('error', 'Error reading response:', error);
          }
        }
        return response;

      };


      // log('info', 'Network interceptors installed');
    }

    // ========== Provider Class ==========
    window.__API_RELAY_PROVIDERS = window.__API_RELAY_PROVIDERS || {};

    function ChatGPTInterceptProvider() {
      this.setupMessageHandler();
      interceptNetworkRequests(this.model);

    }

    ChatGPTInterceptProvider.prototype.setupMessageHandler = function () {
      const self = this;
      window.addEventListener('message', async (event) => {
        if (event.source !== window) return;
        if (!event.data.type || !event.data.type.startsWith('RELAY_')) return;

        const { type, id, text, timeout, stream, model } = event.data;

        try {
          switch (type) {
            case 'RELAY_MODEL':
              const { model } = event.data;
              // log('info', `Model set to: ${model}`);
              modelState.set(model);
              // interceptNetworkRequests(self.model);
              window.postMessage({ type: 'RELAY_MODEL_SET_DONE', id }, '*');
              break;
            case 'RELAY_INSERT_TEXT':
              await self.insertText(text);
              // log('info', `Text inserted: ${text}`);
              window.postMessage({ type: 'RELAY_INSERT_TEXT_DONE', id }, '*');
              break;

            case 'RELAY_CLICK_SEND':
              await self.clickSend();
              // log('info', `Send button clicked`);
              window.postMessage({ type: 'RELAY_CLICK_SEND_DONE', id }, '*');
              break;

            case 'RELAY_CAPTURE_RESPONSE_V1_CHAT_COMPLETIONS_STREAM':
              // log('info', `Capturing response from network (stream=${!!stream})...`);

              // เริ่มการจับ network requests
              isCapturing = true;
              capturedResponseQueue = [];

              await self.captureResponseFromNetwork({ id, timeout: timeout || 180000, stream: true });
              window.postMessage({ type: 'RELAY_CAPTURE_RESPONSE_V1_CHAT_COMPLETIONS_STREAM', id }, '*');
              isCapturing = false;
              break;
            case 'RELAY_CAPTURE_RESPONSE_V1_MESSAGES_STREAM':
              // log('info', `Capturing response from network (stream=${!!stream})...`);

              // เริ่มการจับ network requests
              isCapturing = true;
              capturedResponseQueue = [];

              await self.captureResponseFromNetwork({ id, timeout: timeout || 180000, stream: true });
              window.postMessage({ type: 'RELAY_CAPTURE_RESPONSE_V1_MESSAGES_STREAM', id }, '*');
              isCapturing = false;
              break;

            case 'RELAY_CAPTURE_RESPONSE_V1_CHAT_COMPLETIONS':
              isCapturing = true;
              capturedResponseQueue = [];
              let v1_chat_completions = await self.captureResponseFromNetwork({ id, timeout: timeout || 180000, stream: false });
              // log('info', `Response captured from network:`, v1_chat_completions?.text?.length, 'bytes');
              window.postMessage({ type: 'RELAY_CAPTURE_RESPONSE_V1_CHAT_COMPLETIONS', id, result: v1_chat_completions }, '*');
              isCapturing = false;
              break;
            case 'RELAY_CAPTURE_RESPONSE_V1_MESSAGES':
              isCapturing = true;
              capturedResponseQueue = [];
              let v1_messages = await self.captureResponseFromNetwork({ id, timeout: timeout || 180000, stream: false });
              // log('info', `Response captured from network:`, v1_messages?.text?.length, 'bytes');
              window.postMessage({ type: 'RELAY_CAPTURE_RESPONSE_V1_MESSAGES', id, result: v1_messages }, '*');
              isCapturing = false;
              break;
            case 'RELAY_CAPTURE_RESPONSE_V1_MODELS':
              isCapturing = true;
              capturedResponseQueue = [];
              window.postMessage({
                type: 'V1_MODELS',
                data: allModelState.get()
              }, '*');
              let v1_models = await self.captureResponseFromNetwork({ id, timeout: timeout || 180000, stream: false });
              // log('info', `Response captured from network:`, v1_models?.text?.length, 'bytes');
              window.postMessage({ type: 'RELAY_CAPTURE_RESPONSE_V1_MODELS', id, result: v1_models }, '*');
              isCapturing = false;
              break;
          }
        } catch (error) {
          log('error', `Provider error (${type}):`, error.message);
          window.postMessage({ type: 'RELAY_ERROR', id, error: error.message }, '*');
        }
      });

      console.log('[ChatGPT Intercept] Message handler installed (network interception mode)');
    };

    ChatGPTInterceptProvider.prototype.insertText = async function (text) {
      const selectors = getTextAreaSelector().split(',');
      let ta = null;
      for (let sel of selectors) {
        ta = document.querySelector(sel.trim());
        if (ta) break;
      }
      if (!ta) throw new Error('ChatGPT textarea not found');

      ta.focus();

      if (ta.isContentEditable) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(ta);
        range.deleteContents();
        ta.innerHTML = '';
        ta.textContent = text;
        try {
          selection.removeAllRanges();
          selection.addRange(range);
        } catch { }
      }

      ta.value = text;
      ta.textContent = text;

      if (ta.dispatchEvent) {
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        ta.dispatchEvent(new Event('change', { bubbles: true }));
      }

      await new Promise(r => setTimeout(r, 400));
    };

    ChatGPTInterceptProvider.prototype.clickSend = async function () {
      const selectors = getSendButtonSelector().split(',');
      let btn = null;
      for (let sel of selectors) {
        btn = document.querySelector(sel.trim());
        if (btn && btn.offsetParent !== null) break;
      }
      if (!btn) throw new Error('ChatGPT send button not found');

      if (btn.disabled) {
        await new Promise(r => setTimeout(r, 1200));
        if (btn.disabled) throw new Error('Send button still disabled');
      }

      btn.focus();
      btn.click();
      await new Promise(r => setTimeout(r, 500));
    };

    ChatGPTInterceptProvider.prototype.captureResponseFromNetwork = async function (opts) {
      opts = opts || {};
      const timeout = opts.timeout || 180000;
      const id = opts.id;
      const stream = opts.stream || false;

      return new Promise((resolve, reject) => {
        // log('info', `Waiting for network response (timeout: ${timeout}ms)...`);

        let timeoutTimer = setTimeout(() => {
          log('warn', `Capture timeout after ${timeout}ms`);

          if (capturedResponseQueue.length > 0) {
            const fullText = capturedResponseQueue.join('\n');
            resolve({ text: fullText });
          } else {
            reject(new Error('Network capture timeout - no response received'));
          }
        }, timeout);

        let lastChunkTime = Date.now();
        let fullResponse = '';

        // ฟังข้อความที่ส่งมาจาก network interceptor
        const networkListener = (event) => {
          if (event.source !== window) return;
          // log('info', 'Network stream:', stream);
          if (stream) {
            if (event.data.type === 'V1_CHAT_COMPLETIONS_STREAM') {
              window.postMessage({
                type: 'RELAY_RESPONSE_V1_CHAT_COMPLETIONS_STREAM',
                id: id,
                data: event.data.data
              }, '*');
            }

            if (event.data.type === 'V1_MESSAGES_STREAM') {
              window.postMessage({
                type: 'RELAY_RESPONSE_V1_MESSAGES_STREAM',
                id: id,
                data: event.data.data
              }, '*');
            }
          } else {
            if (event.data.type === 'V1_CHAT_COMPLETIONS') {
              window.postMessage({
                type: 'RELAY_RESPONSE_V1_CHAT_COMPLETIONS',
                id: id,
                data: event.data.data
              }, '*');
            }

            if (event.data.type === 'V1_MESSAGES') {
              window.postMessage({
                type: 'RELAY_RESPONSE_V1_MESSAGES',
                id: id,
                data: event.data.data
              }, '*');
            }

            if (event.data.type === 'V1_MODELS') {
              window.postMessage({
                type: 'RELAY_RESPONSE_V1_MODELS',
                id: id,
                data: event.data.data
              }, '*');
            }
          }
        };

        window.addEventListener('message', networkListener);

        // ตรวจสอบว่า response เสร็จแล้วหรือยัง (ไม่มี chunk ใหม่มา 2 วินาที)
        const checkInterval = setInterval(() => {
          const timeSinceLastChunk = Date.now() - lastChunkTime;

          if (fullResponse.length > 0 && timeSinceLastChunk > 2000) {
            clearInterval(checkInterval);
            clearTimeout(timeoutTimer);
            window.removeEventListener('message', networkListener);

            // log('info', 'Network capture complete:', fullResponse.length, 'bytes');
            resolve({ text: fullResponse });
          }
        }, 500);
      });
    };

    // ========== Initialize ==========
    window.__CHATGPT_PROVIDER__ = new ChatGPTInterceptProvider();
    setTimeout(() => {

      getChatGPTModels().then(models => {
        allModelState.set(models.map(m => ({
          id: m.id,
          title: m.title,
          description: m.description,
          maxTokens: m.maxTokens,
          tags: m.tags,
          reasoningType: m.reasoningType,
          enabledTools: m.enabledTools,
          owned_by: 'openai',
        })));
      });
    }, 1000);


    console.log('[ChatGPT Intercept] Provider initialized (network interception mode - reads from DevTools network)');
  }
})();
