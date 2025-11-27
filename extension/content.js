
// extension/content.js
(function () {
    'use strict';

    const CONFIG = {
        REQUEST_TIMEOUT: 180000,
        COMM_TIMEOUT: 200000
    };

    let isProcessing = false;
    let messageHandlers = new Map();
    let currentRelayRequestId = null;
    let doneSent = false; // ป้องกัน DONE ซ้ำ
    let streamTimeoutId = null; // Timeout for streaming requests
    let streamActivityTimer = null; // Timer to detect stream inactivity

    function log(level, ...args) {
        const prefix = `[ChatRelay Content][${location.hostname}]`;
        try { console[level](prefix, ...args); }
        catch { console.log(prefix, ...args); }
    }

    function sendToMainWorld(type, data = {}) {
        return new Promise((resolve, reject) => {
            const id = Date.now().toString() + Math.random().toString(36).slice(2);
            messageHandlers.set(id, { resolve, reject, timestamp: Date.now() });
            log("info", `Sending to main world: ${type} (id: ${id})`, data);
            window.postMessage({ type, id, ...data }, '*');
            const timeout = type === 'RELAY_CAPTURE_RESPONSE_V1_CHAT_COMPLETIONS' || type === 'RELAY_CAPTURE_RESPONSE_V1_MESSAGES' || type === 'RELAY_CAPTURE_RESPONSE_V1_MODELS' ? CONFIG.COMM_TIMEOUT : 18000;
            setTimeout(() => {
                if (messageHandlers.has(id)) {
                    messageHandlers.delete(id);
                    log('error', `Main world communication timeout for ${type}`);
                    // Allow fallback for insert/click so the request can still proceed
                    if (type === 'RELAY_INSERT_TEXT' || type === 'RELAY_CLICK_SEND' || type === 'RELAY_MODEL') {
                        log('warn', `Falling back for ${type} due to communication timeout`);
                        resolve({ fallback: true, reason: 'Main world communication timeout' });
                        return;
                    }
                    reject(new Error('Main world communication timeout'));
                }
            }, timeout);
        });
    }

    // Receive chunk + done (stop immediately on done)
    window.addEventListener('message', (event) => {
        if (event.source !== window) return;
        if (!event.data.type) return;
        const { type, id, result, error } = event.data;

        if (event.data.type === 'RELAY_RESPONSE_V1_CHAT_COMPLETIONS_STREAM') {
            if (currentRelayRequestId && isProcessing) {
                // Reset activity timer when we receive data
                resetStreamActivityTimer();
                
                chrome.runtime.sendMessage({
                    type: 'relay_response_v1_chat_completions_stream',
                    id: currentRelayRequestId,
                    data: event.data.data
                });
                
                // Check if stream is done and reset processing state
                if (event.data.data && event.data.data.includes('[DONE]')) {
                    log('info', 'Stream completed, resetting processing state');
                    resetProcessingState();
                }
            }
        } else if (event.data.type === 'RELAY_RESPONSE_V1_MESSAGES_STREAM') {
            if (currentRelayRequestId && isProcessing) {
                // Reset activity timer when we receive data
                resetStreamActivityTimer();
                
                chrome.runtime.sendMessage({
                    type: 'relay_response_v1_messages_stream',
                    id: currentRelayRequestId,
                    data: event.data.data
                });
                
                // Check if stream is done and reset processing state
                if (event.data.data && event.data.data.includes('[DONE]')) {
                    log('info', 'Stream completed, resetting processing state');
                    resetProcessingState();
                }
            }
        } else if (event.data.type === 'RELAY_RESPONSE_V1_CHAT_COMPLETIONS') {
            if (currentRelayRequestId && isProcessing) {
                log('info', `Sending done to background for request: ${currentRelayRequestId}`);
                chrome.runtime.sendMessage({
                    type: 'relay_response_v1_chat_completions',
                    id: currentRelayRequestId,
                    data: event.data.data
                });
            }
        } else if (event.data.type === 'RELAY_RESPONSE_V1_MESSAGES') {
            if (currentRelayRequestId && isProcessing) {
                log('info', `Sending done to background for request: ${currentRelayRequestId}`);
                chrome.runtime.sendMessage({
                    type: 'relay_response_v1_messages',
                    id: currentRelayRequestId,
                    data: event.data.data
                });
            }
        } else if (event.data.type === 'RELAY_RESPONSE_V1_MODELS') {
            if (currentRelayRequestId && isProcessing) {
                log('info', `Sending done to background for request: ${currentRelayRequestId}`);
                chrome.runtime.sendMessage({
                    type: 'relay_response_v1_models',
                    id: currentRelayRequestId,
                    data: event.data.data
                });
            }
        }

        const responseTypes = [
            'RELAY_INSERT_TEXT_DONE',
            'RELAY_CLICK_SEND_DONE',
            'RELAY_RESPONSE_CAPTURED',
            'RELAY_RESPONSE_CAPTURED_STREAM',
            'RELAY_ERROR',
            'RELAY_MODEL_SET_DONE'
        ];
        if (!responseTypes.includes(type)) return;

        if (messageHandlers.has(id)) {
            const { resolve, reject } = messageHandlers.get(id);
            messageHandlers.delete(id);
            if (error) {
                log('error', `Main world error: ${error}`);
                reject(new Error(error));
                // window.location.reload();
                return;
            } else {
                resolve(result);
            }
        }
    });

    // Function to reset processing state
    function resetProcessingState() {
        isProcessing = false;
        currentRelayRequestId = null;
        doneSent = false;
        if (streamTimeoutId) {
            clearTimeout(streamTimeoutId);
            streamTimeoutId = null;
        }
        if (streamActivityTimer) {
            clearTimeout(streamActivityTimer);
            streamActivityTimer = null;
        }
        log('info', 'Processing state reset');
    }

    // Function to reset stream activity timer (5 second inactivity timeout)
    function resetStreamActivityTimer() {
        if (streamActivityTimer) {
            clearTimeout(streamActivityTimer);
        }
        
        streamActivityTimer = setTimeout(() => {
            if (isProcessing) {
                log('warn', 'Stream inactive for 5 seconds, resetting processing state');
                resetProcessingState();
            }
        }, 15000); // 15 seconds
    }

    // --- Main Task Handler ---
    async function handleRelayRequest(msg) {
        log('info', 'Handling relay msg:', msg);
        // if (isProcessing) throw new Error('Provider is currently processing another request');
        isProcessing = true;
        doneSent = false;
        currentRelayRequestId = msg.id;
        log('info', 'Processing relay request:', msg.id);
        
        // For streaming requests, set up inactivity detection
        if (msg.stream) {
            resetStreamActivityTimer();
        }

        try {


            log('info', 'Waiting for response...');
            log('info', 'Stream mode:', msg.stream);
            if (msg.stream) {
                log('info', 'Capturing response (streaming)...');
                if (msg.type === 'relay_request_v1_chat_completions_stream') {
                    let messages = msg.body?.messages || [];
                    let lastMessage = messages[messages.length - 1];
                    let text = lastMessage?.content || '';
                    if (!text.trim()) throw new Error('Empty message content');
                    log('info', 'Input text:', text);
                    await sendToMainWorld('RELAY_MODEL', { model: msg.body.model });
                    await sendToMainWorld('RELAY_INSERT_TEXT', { text });
                    log('info', 'Clicking send button...');
                    await sendToMainWorld('RELAY_CLICK_SEND');
                    log('info', 'Starting relay_request_v1_chat_completions_stream mode for chat completions');

                    await sendToMainWorld('RELAY_CAPTURE_RESPONSE_V1_CHAT_COMPLETIONS_STREAM', { timeout: CONFIG.REQUEST_TIMEOUT });
                    log('info', 'Streaming relay started - will stop when received done');
                    return { success: true, stream: true };
                } else if (msg.type === 'relay_request_v1_messages_stream') {
                    let messages = msg.body?.messages || [];
                    let lastMessage = messages[messages.length - 1];
                    let text = lastMessage?.content || '';
                    if (!text.trim()) throw new Error('Empty message content');
                    log('info', 'Input text:', text);
                    await sendToMainWorld('RELAY_MODEL', { model: msg.body.model });
                    await sendToMainWorld('RELAY_INSERT_TEXT', { text });
                    log('info', 'Clicking send button...');
                    await sendToMainWorld('RELAY_CLICK_SEND');
                    log('info', 'Starting relay_request_v1_messages_stream mode for messages');
                    await sendToMainWorld('RELAY_CAPTURE_RESPONSE_V1_MESSAGES_STREAM', { timeout: CONFIG.REQUEST_TIMEOUT });
                    log('info', 'Streaming relay started - will stop when received done');
                    return { success: true, stream: true };
                }


            } else {
                if (msg.type === 'relay_request_v1_chat_completions') {
                    let messages = msg.body?.messages || [];
                    let lastMessage = messages[messages.length - 1];
                    let text = lastMessage?.content || '';
                    if (!text.trim()) throw new Error('Empty message content');
                    log('info', 'Input text:', text);
                    await sendToMainWorld('RELAY_MODEL', { model: msg.body.model });
                    await sendToMainWorld('RELAY_INSERT_TEXT', { text });
                    log('info', 'Clicking send button...');
                    await sendToMainWorld('RELAY_CLICK_SEND');
                    log('info', 'Starting relay_request_v1_chat_completions mode for chat completions');
                    const result = await sendToMainWorld('RELAY_CAPTURE_RESPONSE_V1_CHAT_COMPLETIONS');
                    log('info', 'Response captured:', result?.text?.substring(0, 100));
                    if (!result || !result.text) throw new Error('Empty response from ChatGPT');
                    return { success: true, stream: false, result };
                } else if (msg.type === 'relay_request_v1_messages') {
                    let messages = msg.body?.messages || [];
                    let lastMessage = messages[messages.length - 1];
                    let text = lastMessage?.content || '';
                    if (!text.trim()) throw new Error('Empty message content');
                    log('info', 'Input text:', text);
                    await sendToMainWorld('RELAY_MODEL', { model: msg.body.model });
                    await sendToMainWorld('RELAY_INSERT_TEXT', { text });
                    log('info', 'Clicking send button...');
                    await sendToMainWorld('RELAY_CLICK_SEND');
                    log('info', 'Starting relay_request_v1_messages mode for messages');
                    const result = await sendToMainWorld('RELAY_CAPTURE_RESPONSE_V1_MESSAGES');
                    log('info', 'Response captured:', result?.text?.substring(0, 100));
                    if (!result || !result.text) throw new Error('Empty response from provider');
                    return { success: true, stream: false, result };
                } else if (msg.type === 'relay_request_v1_models') {
                    log('info', 'Starting relay_request_v1_models mode for models');
                    const result = await sendToMainWorld('RELAY_CAPTURE_RESPONSE_V1_MODELS');
                    log('info', 'Response captured:', result?.text?.substring(0, 100));
                    if (!result || !result.text) throw new Error('Empty response from provider');
                    return { success: true, stream: false, result };
                }

            }
        } catch (error) {
            log('error', 'Request handling failed:', error);
            throw error;
        } finally {
            // Reset processing state for non-stream requests
            if (!msg.stream) {
                resetProcessingState();
            }
            log('info', 'Request processing completed');
        }
    }

    // --- Bridge with background.js ---
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg?.type === 'relay_request_v1_chat_completions') {
            log('info', 'Received relay_request_v1_chat_completions:', msg.id);
            handleRelayRequest(msg)
                .then(({ result }) => {
                    chrome.runtime.sendMessage({
                        type: 'relay_response_v1_chat_completions',
                        id: msg.id,
                        result
                    });
                    sendResponse({ ok: true });
                })
                .catch((error) => {
                    const errorMsg = error.message || String(error);
                    chrome.runtime.sendMessage({ type: 'relay_response_v1_chat_completions', id: msg.id, error: errorMsg });
                    sendResponse({ ok: false, error: errorMsg });
                });
            return true;
        }
        if (msg?.type === 'relay_request_v1_chat_completions_stream') {
            log('info', 'Received relay_request:', msg.id);
            msg.body.stream = true;
            handleRelayRequest(msg)
                .then(({ result }) => {
                    chrome.runtime.sendMessage({
                        type: 'relay_request_v1_chat_completions_stream',
                        id: msg.id,
                        result
                    });
                    sendResponse({ ok: true });
                })
                .catch((error) => {
                    const errorMsg = error.message || String(error);
                    chrome.runtime.sendMessage({ type: 'relay_request_v1_chat_completions_stream', id: msg.id, error: errorMsg });
                    sendResponse({ ok: false, error: errorMsg });
                });
            return true;
        }
        if (msg?.type === 'relay_request_v1_messages') {
            log('info', 'Received relay_request_v1_messages:', msg.id);
            handleRelayRequest(msg)
                .then(({ result }) => {
                    chrome.runtime.sendMessage({
                        type: 'relay_response_v1_messages',
                        id: msg.id,
                        result
                    });
                    sendResponse({ ok: true });
                })
                .catch((error) => {
                    const errorMsg = error.message || String(error);
                    chrome.runtime.sendMessage({ type: 'relay_response_v1_messages', id: msg.id, error: errorMsg });
                    sendResponse({ ok: false, error: errorMsg });
                });
            return true;
        }
        if (msg?.type === 'relay_request_v1_messages_stream') {
            log('info', 'Received relay_request:', msg.id);
            msg.body.stream = true;
            handleRelayRequest(msg)
                .then(({ result }) => {
                    chrome.runtime.sendMessage({
                        type: 'relay_request_v1_messages_stream',
                        id: msg.id,
                        result
                    });
                    sendResponse({ ok: true });
                })
                .catch((error) => {
                    const errorMsg = error.message || String(error);
                    chrome.runtime.sendMessage({ type: 'relay_request_v1_messages_stream', id: msg.id, error: errorMsg });
                    sendResponse({ ok: false, error: errorMsg });
                });
            return true;
        }
        if (msg?.type === 'relay_request_v1_models') {
            log('info', 'Received relay_request_v1_models:', msg.id);
            handleRelayRequest(msg)
                .then(({ result }) => {
                    chrome.runtime.sendMessage({
                        type: 'relay_response_v1_models',
                        id: msg.id,
                        result
                    });
                    sendResponse({ ok: true });
                })
                .catch((error) => {
                    const errorMsg = error.message || String(error);
                    chrome.runtime.sendMessage({ type: 'relay_response_v1_models', id: msg.id, error: errorMsg });
                    sendResponse({ ok: false, error: errorMsg });
                });
            return true;
        }
        if (msg?.type === 'ping') {
            sendResponse({
                ok: true,
                processing: isProcessing,
                host: location.hostname
            });
            return false;
        }
        return false;
    });

    function registerTab() {
        try {
            chrome.runtime.sendMessage({
                type: 'setActiveTab',
                host: location.hostname
            });
            log('info', 'Tab registered with background');
        } catch (e) {
            log('error', 'Failed to register tab:', e);
        }
    }
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            log('info', 'Tab became visible, re-registering...');
            registerTab();
        }
    });

    log('info', 'Content script initializing...');
    registerTab();
    log('info', 'Content script ready (streaming mode)');

    chrome.runtime.sendMessage({
        type: "relay_detected_host",
        host: location.hostname
    });
})();
