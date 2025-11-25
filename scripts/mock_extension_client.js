const WebSocket = require('ws');
const url = process.env.RELAY_WS || 'ws://localhost:3000/ws';

console.log('Starting mock extension WS client ->', url);
const ws = new WebSocket(url);

ws.on('open', () => {
  console.log('mock client connected to', url);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    console.log('received:', msg);
    if (msg && msg.type === 'relay_request') {
      const last = (msg.body && msg.body.messages && msg.body.messages.slice(-1)[0]) || {};
      const result = { text: last.content || 'no content', echoed: true };
      const resp = { type: 'relay_response', id: msg.id, result };
      try {
        ws.send(JSON.stringify(resp));
        console.log('sent response for id', msg.id);
      } catch (e) {
        console.error('failed to send response', e);
      }
    }
  } catch (e) {
    console.error('error parsing message', e);
  }
});

ws.on('close', () => console.log('mock client disconnected'));
ws.on('error', (e) => console.error('mock client error', e));

// respond to pings
ws.on('ping', () => { try { ws.pong(); } catch (e) {} });

process.on('SIGINT', () => { console.log('shutting down mock client'); try{ ws.close(); }catch(e){} process.exit(0); });
