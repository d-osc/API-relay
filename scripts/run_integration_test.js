#!/usr/bin/env node
const { spawn } = require('child_process');
const fetch = require('node-fetch');

async function waitForClient(timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch('http://localhost:8637/admin/status');
      const j = await r.json();
      if (j.ws && j.ws.clientCount && j.ws.clientCount > 0) return true;
    } catch (e) {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

(async () => {
  console.log('Starting mock extension client...');
  const child = spawn(process.execPath, ['scripts/mock_extension_client.js'], {
    env: Object.assign({}, process.env, { RELAY_WS: process.env.RELAY_WS || 'ws://localhost:3000/ws' }),
    stdio: ['ignore', 'inherit', 'inherit'],
  });

  try {
    const connected = await waitForClient(10000);
    if (!connected) throw new Error('mock client did not connect within timeout');

    console.log('Mock client connected — sending test request to /v1/messages');

    const resp = await fetch('http://localhost:8637/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-2', messages: [{ author: 'user', content: 'Hello from automated test' }] }),
    });

    const json = await resp.json();
    console.log('Server response (status=' + resp.status + '):');
    console.log(JSON.stringify(json, null, 2));

    if (resp.status >= 200 && resp.status < 300) {
      console.log('Integration test succeeded');
      process.exitCode = 0;
    } else {
      console.error('Integration test failed (non-2xx status)');
      process.exitCode = 2;
    }
  } catch (err) {
    console.error('Integration test error:', err && err.stack ? err.stack : err);
    process.exitCode = 1;
  } finally {
    try { child.kill(); } catch (e) {}
  }
})();
