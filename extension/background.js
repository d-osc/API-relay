// extension/background.js
(function () {
  'use strict';

  // ========================
  // Configuration
  // ========================
  const CONFIG = {
    WS_URL: 'ws://localhost:8647/ws',
    INITIAL_BACKOFF: 1000,
    MAX_BACKOFF: 60000,
    BACKOFF_MULTIPLIER: 1.5,
    PING_INTERVAL: 30000,
    REGISTER_INTERVAL: 30000,
    REQUEST_TIMEOUT: 180000
  };

  // ========================
  // State Management
  // ========================
  let ws = null;
  let reconnectBackoff = CONFIG.INITIAL_BACKOFF;
  let connected = false;
  let activeTabId = null;
  let activeTabHost = null;
  let reconnectTimer = null;
  let pingTimer = null;
  let registerTimer = null;
  let pendingRequests = new Map();
  let currentHost = null; // Default fallback, update via message from content script


  // ========================
  // Logging
  // ========================
  function log(level, ...args) {
    const prefix = '[ChatRelay Background]';
    const timestamp = new Date().toISOString();
    try { console[level](`${prefix} [${timestamp}]`, ...args); }
    catch { console.log(`${prefix} [${timestamp}]`, ...args); }
  }



  // ========================
  // Status Management
  // ========================
  function setStatus(status) {
    try {
      chrome.storage.local.set({
        relayStatus: {
          ...status,
          activeTabId,
          activeTabHost,
          pendingCount: pendingRequests.size,
          timestamp: Date.now()
        }
      });
    } catch (e) {
      log('error', 'Failed to set status:', e);
    }
  }

  function updateBadge() {
    if (typeof chrome === 'undefined' || !chrome.action) return;
    try {
      const text = connected ? '✓' : '✗';
      const color = connected ? '#00AA00' : '#AA0000';
      if (pendingRequests.size > 0) {
        chrome.action.setBadgeText({ text: String(pendingRequests.size) });
        chrome.action.setBadgeBackgroundColor({ color: '#FF8800' });
      } else {
        chrome.action.setBadgeText({ text });
        chrome.action.setBadgeBackgroundColor({ color });
      }
    } catch (e) { }
  }

  // ========================
  // WebSocket Management
  // ========================
  function connectWebSocket() {
    cleanup();
    log('info', `Connecting to ${CONFIG.WS_URL}...`);
    try {
      ws = new WebSocket(CONFIG.WS_URL);
      ws.onopen = handleOpen;
      ws.onmessage = handleMessage;
      ws.onclose = handleClose;
      ws.onerror = handleError;
    } catch (e) {
      log('error', 'Failed to create WebSocket:', e);
      scheduleReconnect();
    }
  }
  function handleOpen() {
    reconnectBackoff = CONFIG.INITIAL_BACKOFF;
    connected = true;
    log('info', `WebSocket connected to ${CONFIG.WS_URL}`);
    startRegisterTimer();
    setStatus({ connected: true });
    updateBadge();
    startPingTimer();
  }
  function handleMessage(event) {
    try {
      log('debug', 'WebSocket message received:', event.data);
      const msg = JSON.parse(event.data);
      log('info', 'Received message:', msg.type, msg.id || '');
      switch (msg.type) {
        case 'welcome':
          log('info', 'Server welcome, id:', msg.id);
          break;
        case 'relay_request_v1_chat_completions_stream':
          handleRelayRequest(msg);
          break;
        case 'relay_request_v1_chat_completions':
          handleRelayRequest(msg);
          break;
        case 'relay_request_v1_messages_stream':
          handleRelayRequest(msg);
          break;
        case 'relay_request_v1_messages':
          handleRelayRequest(msg);
          break;
        case 'relay_request_v1_models':
          handleRelayRequest(msg);
          break;
        case 'pong':
          log('debug', 'Received pong');
          break;
        default:
          log('warn', 'Unknown message type:', msg.type);
      }
    } catch (e) {
      log('error', 'Failed to parse message:', e);
    }
  }
  function handleClose(event) {
    connected = false;
    log('warn', 'WebSocket closed:', event.code, event.reason);
    setStatus({ connected: false, closeCode: event.code });
    updateBadge();
    stopPingTimer();
    stopRegisterTimer();
    scheduleReconnect();
  }
  function handleError(error) {
    log('error', 'WebSocket error:', error);
  }
  function cleanup() {
    if (ws) {
      try {
        ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null;
        ws.close();
      } catch (e) {
        log('error', 'Error closing WebSocket:', e);
      }
      ws = null;
    }
    stopPingTimer();
    stopRegisterTimer();
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }
  function scheduleReconnect() {
    if (reconnectTimer) return;
    log('info', `Reconnecting in ${reconnectBackoff}ms...`);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      reconnectBackoff = Math.min(reconnectBackoff * CONFIG.BACKOFF_MULTIPLIER, CONFIG.MAX_BACKOFF);
      connectWebSocket();
    }, reconnectBackoff);
  }
  function sendToServer(msg) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
      return true;
    } else {
      log('warn', 'Cannot send, WebSocket not connected');
      return false;
    }
  }

  // Ping/Pong for health
  function startPingTimer() {
    stopPingTimer();
    pingTimer = setInterval(() => {
      if (sendToServer({ type: 'ping', timestamp: Date.now() })) {
        log('debug', 'Sent ping');
      }
    }, CONFIG.PING_INTERVAL);
  }
  function stopPingTimer() {
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
  }

  // Register models timer
  function startRegisterTimer() {
    if (registerTimer) clearInterval(registerTimer);
  }
  function stopRegisterTimer() {
    if (registerTimer) clearInterval(registerTimer);
    registerTimer = null;
  }
  function registerOrReconnectWS() {
    if (!ws || ws.readyState >= 2) { // CLOSED, CLOSING
      connectWebSocket();
    }
  }

  // Request/Response handling
  function handleRelayRequest(msg) {
    const requestId = msg.id;
    log('info', `Handling relay request: ${requestId}`);
    const timeoutTimer = setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        log('error', `Request timeout: ${requestId}`);
        pendingRequests.delete(requestId);
        if ([
          'relay_response_v1_chat_completions_stream',
          'relay_response_v1_chat_completions',
          'relay_response_v1_messages_stream',
          'relay_response_v1_messages',
          'relay_response_v1_models'
        ].includes(msg.type)) {
          sendToServer({
            type: msg.type,
            id: requestId,
            error: 'Request timeout - no response from content script'
          });
        }
        updateBadge();
      }
    }, CONFIG.REQUEST_TIMEOUT);

    pendingRequests.set(requestId, {
      timer: timeoutTimer,
      timestamp: Date.now(),
      originalMsg: msg
    });

    updateBadge();
    routeToActiveTab(msg);
  }
  function handleRelayResponse(msg) {
    // const requestId = msg.id;
    log('info', 'Forward relay_response to server:', JSON.stringify(msg));
    sendToServer(msg);

  }

  // Retry handling: per-request retry counters and next-tab routing
  const retryCounters = new Map(); // requestId -> attempts
  const MAX_RETRIES_PER_REQUEST = 2;

  function retryOrFail(requestId, originalMsg) {
    const attempts = (retryCounters.get(requestId) || 0) + 1;
    retryCounters.set(requestId, attempts);
    if (attempts > MAX_RETRIES_PER_REQUEST) {
      log('error', `Max retries exceeded for ${requestId}, sending failure to server`);
      sendToServer({ type: 'relay_response', id: requestId, error: 'Max retries exceeded' });
      retryCounters.delete(requestId);
      return;
    }
    log('info', `Retrying request ${requestId} (attempt ${attempts}/${MAX_RETRIES_PER_REQUEST})`);
    // Reset timer and re‑queue by routing to active tab
    const timeoutMs = CONFIG.REQUEST_TIMEOUT;
    const timeoutTimer = setTimeout(() => {
      log('error', `Retry timeout: ${requestId}`);
      sendToServer({ type: 'relay_response', id: requestId, error: 'Retry timeout - no response from content script' });
      retryCounters.delete(requestId);
    }, timeoutMs);
    pendingRequests.set(requestId, { timer: timeoutTimer, timestamp: Date.now() });
    routeToActiveTab({ ...originalMsg, isRetry: true });
  }

  // --- Tab Management & Routing ---
  async function validateActiveTab(tabId) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (!tab.url) return false;
      const url = new URL(tab.url);
      const supportedHosts = [
        'chatgpt.com',
        'chat.openai.com',
        'gemini.google.com',
        'aistudio.google.com',
        'claude.ai',
        'www.perplexity.ai',
        'perplexity.ai'
      ];
      return supportedHosts.some(host => url.hostname.includes(host));
    } catch (e) { return false; }
  }
  async function updateActiveTab(tabId) {
    if (await validateActiveTab(tabId)) {
      activeTabId = tabId;
      try {
        const tab = await chrome.tabs.get(tabId);
        const url = new URL(tab.url);
        activeTabHost = url.hostname;
        log('info', `Active tab updated: ${tabId} (${activeTabHost})`);
        setStatus({ connected, activeTabId, activeTabHost });
        chrome.tabs.sendMessage(tabId, { type: 'ping' }, (response) => {
          if (chrome.runtime.lastError) {
            log('warn', 'Active tab not responding:', chrome.runtime.lastError.message);
          } else {
            log('info', 'Active tab confirmed:', response);
            currentHost = response.host;
          }
        });
      } catch (e) {
        log('error', 'Failed to get tab info:', e);
      }
    } else {
      log('warn', `Tab ${tabId} is not a supported provider page`);
    }
  }
  function routeToActiveTab(msg) {
    if (activeTabId !== null) {
      log('info', `Routing to active tab: ${activeTabId}`);
      chrome.tabs.sendMessage(activeTabId, msg, (response) => {
        if (chrome.runtime.lastError) {
          log('warn', 'Active tab failed, broadcasting:', chrome.runtime.lastError.message);
          broadcastToAll(msg);
        } else {
          log('info', 'Message delivered to active tab:', response);
        }
      });
    } else {
      log('info', 'No active tab, broadcasting...');
      broadcastToAll(msg);
    }
  }
  function broadcastToAll(msg) {
    log('info', 'Broadcasting to all tabs...');
    chrome.tabs.query({}, (tabs) => {
      let sentCount = 0;
      for (const tab of tabs) {
        if (tab.url && (
          tab.url.includes('chatgpt.com') ||
          tab.url.includes('gemini.google.com') ||
          tab.url.includes('claude.ai') ||
          tab.url.includes('aistudio.google.com')
        )) {
          chrome.tabs.sendMessage(tab.id, msg, (response) => {
            if (!chrome.runtime.lastError) {
              sentCount++;
              log('info', `Broadcast successful to tab ${tab.id}`);
            }
          });
        }
      }
      if (sentCount === 0) {
        log('warn', 'No suitable tabs found for broadcast');
      }
    });
  }

  // ========================
  // MESSAGE HANDLING (Content script → Background)
  // ========================
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    try {
      switch (msg?.type) {
        case 'relay_response_v1_chat_completions':
          handleRelayResponse(msg);
          sendResponse && sendResponse({ ok: true });
          break;
        case 'relay_response_v1_chat_completions_stream':
          handleRelayResponse(msg);
          sendResponse && sendResponse({ ok: true });
          break;
        case 'relay_response_v1_messages':
          handleRelayResponse(msg);
          sendResponse && sendResponse({ ok: true });
          break;
        case 'relay_response_v1_messages_stream':
          handleRelayResponse(msg);
          sendResponse && sendResponse({ ok: true });
          break;
        case 'relay_response_v1_models':
          handleRelayResponse(msg);
          sendResponse && sendResponse({ ok: true });
          break;
        case 'relay_error':
          // On explicit error from content script, trigger retry handling unless it's a retry itself
          const pending = pendingRequests.get(msg.id);
          if (pending && !msg.isRetry) {
            const originalMsg = pending.originalMsg || {};
            retryOrFail(msg.id, originalMsg);
          } else {
            // No retry left or retry failed; forward failure to server
            sendToServer({ type: msg.type, id: msg.id, error: msg.error || 'Request failed' });
          }
          sendResponse && sendResponse({ ok: true });
          break;
        case 'relay_detected_host':
          if (typeof msg.host === "string") {
            currentHost = msg.host.toLowerCase();
            log('info', '[Host] Updated to:', currentHost);
            registerOrReconnectWS();
          }
          sendResponse && sendResponse({ ok: true });
          break;
        case 'setActiveTab':
          const tabId = msg.tabId || sender.tab?.id || null;
          if (tabId)
            updateActiveTab(tabId);
          sendResponse && sendResponse({ ok: true });
          break;
        case 'getStatus':
          sendResponse && sendResponse({
            ok: true,
            connected,
            activeTabId,
            activeTabHost,
            pendingCount: pendingRequests.size
          });
          break;
        default:
          sendResponse && sendResponse({ ok: false, error: 'Unknown message type' });
      }
    } catch (e) {
      log('error', 'Message handler error:', e);
      sendResponse && sendResponse({ ok: false, error: e.message });
    }
    return true; // keep channel alive for async
  });

  // ========================
  // Tab Event Listeners
  // ========================
  chrome.tabs.onActivated.addListener((activeInfo) => {
    log('info', 'Tab activated:', activeInfo.tabId);
    updateActiveTab(activeInfo.tabId);
  });
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === activeTabId && changeInfo.status === 'complete') {
      log('info', 'Active tab updated/reloaded');
      updateActiveTab(tabId);
    }
  });
  chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId === activeTabId) {
      log('info', 'Active tab closed');
      activeTabId = null;
      activeTabHost = null;
      setStatus({ connected });
    }
  });

  // ========================
  // Extension Lifecycle
  // ========================
  chrome.runtime.onInstalled.addListener(() => {
    log('info', 'Extension installed/updated');
    setStatus({ connected: false, installed: true });
  });
  chrome.runtime.onStartup.addListener(() => {
    log('info', 'Browser started');
  });

  // ========================
  // Initialization
  // ========================
  log('info', 'Background service worker starting...');
  connectWebSocket();
  updateBadge();

})();
