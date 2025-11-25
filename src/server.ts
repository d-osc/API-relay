import express from "express";
import bodyParser from "body-parser";
import http from "http";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import RelayWSServer from "./ws";
import RequestQueue from "./queue";
import { OpenAIChatRequestBody, RelayJob } from "./types.d";
import settingsModule from "./settings";

const app = express();
app.use(cors({ origin: "*" }));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(cors({
  origin: "*",
  credentials: true
}));

let settings = settingsModule.readSettings();

const server = http.createServer(app);
const wsServer = new RelayWSServer(server, {
  heartbeatInterval: settings.heartbeatIntervalMs || 30000,
  connectionTimeout: settings.connectionTimeoutMs || 45000,
});
const queue = new RequestQueue(settings.maxQueueSize || 1000);

// --- Anthropic input normalization ---
function normalizeAnthropicRequest(body: any) {
  const out: any = { model: body.model || body.model_id || body.modelName || 'claude', messages: [] };
  const msgs = Array.isArray(body.messages)
    ? body.messages
    : Array.isArray(body.content)
      ? body.content
      : body.input
        ? [body.input]
        : [];
  for (const m of msgs) {
    if (!m) continue;
    const role = m.role || m.author || m.from || (m.type === 'human' ? 'user' : undefined) || 'user';
    let content = '';
    if (typeof m.content === 'string') content = m.content;
    else if (typeof m.text === 'string') content = m.text;
    else if (Array.isArray(m.content)) {
      for (const c of m.content) {
        if (!c) continue;
        if (typeof c === 'string') { content = c; break; }
        if (typeof c.text === 'string') { content = c.text; break; }
        if (typeof c.message === 'string') { content = c.message; break; }
      }
    } else if (m.message && typeof m.message === 'string') content = m.message;
    else if (m.body && typeof m.body === 'string') content = m.body;
    else if (typeof m === 'string') content = m;
    out.messages.push({ role: role || 'user', content: content || '' });
  }
  if (typeof body.temperature === 'number') out.temperature = body.temperature;
  if (typeof body.max_tokens === 'number') out.max_tokens = body.max_tokens;
  return out;
}

// == Streaming relay helper ==
async function v1ChatCompletionSendJobToClientStreaming(clientId: string, ws: any, job: RelayJob, onChunk: (chunk: { delta?: string; done?: boolean }) => void) {
  const id = job.id;
  const payload = { type: "relay_request_v1_chat_completions_stream", id, body: job.body, stream: true };
  wsServer.setClientBusy(clientId, true);
  return new Promise<void>((resolve, reject) => {
    let isDone = false;
    function cleanup() {
      isDone = true;
      try { ws.off("message", onMessage); } catch { }
      try { ws.off("close", onClose); } catch { }
      wsServer.setClientBusy(clientId, false);
    }
    const onMessage = (data: any) => {
      try {
        const msg = typeof data === "string" ? JSON.parse(data) : JSON.parse(data.toString());
        if (msg.type === "relay_response_v1_chat_completions_stream" && msg.id === id) {
          if (msg.data.includes("[DONE]")) {
           console.log('SERVER: received relay_response_v1_chat_completions_stream done, will close stream');
            cleanup();
            onChunk?.({ done: true });
            resolve();
          } else if (msg.data) {
            onChunk?.({ delta: msg.data });
          }
        }
      } catch { }
    };
    const onClose = () => {
      if (!isDone) reject(new Error("WS client disconnect"));
      cleanup();
    };
    ws.on("message", onMessage);
    ws.on("close", onClose);
    ws.send(JSON.stringify(payload));
  });
}
async function v1ChatCompletionSendJobToClient(clientId: string, ws: any, job: RelayJob): Promise<any> {
  const id = job.id;
  const payload = { type: "relay_request_v1_chat_completions", id, body: job.body };
  wsServer.setClientBusy(clientId, true);
  const timeoutMs = settings.requestTimeoutMs || 180000;
  return new Promise((resolve, reject) => {
    let isResolved = false;
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    function cleanup() {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timer);
        try { ws.off("message", onMessage); } catch { }
        try { ws.off("close", onClose); } catch { }
        wsServer.setClientBusy(clientId, false);
      }
    }
    const onMessage = (data: any) => {
      try {
        const msg = typeof data === "string" ? JSON.parse(data) : JSON.parse(data.toString());
        if (msg.type === "relay_response_v1_chat_completions" && msg.id === id) {
          cleanup();
          if (msg.error) reject(new Error(msg.error));
          else resolve(msg.data);
        }
      } catch { }
    };
    const onClose = () => { cleanup(); reject(new Error("WS client disconnected")); };
    ws.on("message", onMessage);
    ws.on("close", onClose);
    ws.send(JSON.stringify(payload));
  });
}

// == OpenAI-Compatible Streaming Endpoint ==
app.post("/openai/v1/chat/completions", async (req, res) => {
  const body = req.body as OpenAIChatRequestBody;
  const id = uuidv4();
  const job: RelayJob = { id, body, createdAt: Date.now() } as any;
  const streamMode = !!body.stream;
  const client = wsServer.pickClient(true);
  if (!client) {
    return res.status(503).json({ error: { message: "No browser extension connected", type: "service_unavailable", code: "no_clients" } });
  }
  if (streamMode) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    let finished = false;
    const timeout = setTimeout(() => {
      if (!finished) {
        res.write('data: {"error":"timeout"}\n\n');
        res.end();
      }
    }, 180000);
    try {
      await v1ChatCompletionSendJobToClientStreaming(client.id, (client as any).ws, job, (chunk) => {
        if (chunk && chunk.delta) {
          res.write(`data: ${chunk.delta}\n\n`);
        }
        if (chunk && chunk.done) {
          finished = true;
          res.write('data: [DONE]\n\n');
          res.end();
        }
      });
    } catch (e) {
      res.write('data: {"error":"error"}\n\n');
      res.end();
    } finally {
      clearTimeout(timeout);
    }
    return;
  }
  try {
    const result = await v1ChatCompletionSendJobToClient(client.id, (client as any).ws, job);
    res.json(result);
  } catch (err: any) {
    res.status(504).json({ error: "timeout or relay error", details: String(err) });
  }
});

// == Anthropic-compatible Streaming Endpoint ==
async function v1MessageSendJobToClientStreaming(clientId: string, ws: any, job: RelayJob, onChunk: (chunk: { delta?: string; done?: boolean }) => void) {
  const id = job.id;
  const payload = { type: "relay_request_v1_messages_stream", id, body: job.body, stream: true };
  wsServer.setClientBusy(clientId, true);
  return new Promise<void>((resolve, reject) => {
    let isDone = false;
    function cleanup() {
      isDone = true;
      try { ws.off("message", onMessage); } catch { }
      try { ws.off("close", onClose); } catch { }
      wsServer.setClientBusy(clientId, false);
    }
    const onMessage = (data: any) => {
      try {
        const msg = typeof data === "string" ? JSON.parse(data) : JSON.parse(data.toString());
        if (msg.type === "relay_response_v1_messages_stream" && msg.id === id) {
         console.log('SERVER: received relay_response_v1_messages_stream message data:', msg.data);
          if (msg.data.includes("[DONE]")) {
           console.log('SERVER: received relay_response_v1_messages_stream done, will close stream');
            cleanup();
            onChunk?.({ done: true });
            resolve();
          } else if (msg.data) {
           console.log('SERVER: received relay_response_v1_messages_stream delta:', msg.data);
            onChunk?.({ delta: msg.data });
          }
        }
      } catch { }
    };
    const onClose = () => {
      if (!isDone) reject(new Error("WS client disconnect"));
      cleanup();
    };
    ws.on("message", onMessage);
    ws.on("close", onClose);
    ws.send(JSON.stringify(payload));
  });
}

async function v1MessageSendJobToClient(clientId: string, ws: any, job: RelayJob): Promise<any> {
  const id = job.id;
  const payload = { type: "relay_request_v1_messages", id, body: job.body };
  wsServer.setClientBusy(clientId, true);
  const timeoutMs = settings.requestTimeoutMs || 180000;
  return new Promise((resolve, reject) => {
    let isResolved = false;
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    function cleanup() {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timer);
        try { ws.off("message", onMessage); } catch { }
        try { ws.off("close", onClose); } catch { }
        wsServer.setClientBusy(clientId, false);
      }
    }
    const onMessage = (data: any) => {
      try {
        const msg = typeof data === "string" ? JSON.parse(data) : JSON.parse(data.toString());
        if (msg.type === "relay_response_v1_messages" && msg.id === id) {
          cleanup();
          if (msg.error) reject(new Error(msg.error));
          else resolve(msg.data);
        }
      } catch { }
    };
    const onClose = () => { cleanup(); reject(new Error("WS client disconnected")); };
    ws.on("message", onMessage);
    ws.on("close", onClose);
    ws.send(JSON.stringify(payload));
  });
}

app.post("/anthropic/v1/messages", async (req, res) => {
  const anthropicBody = req.body;
  const normalized = normalizeAnthropicRequest(anthropicBody);
  const id = uuidv4();
  const job: RelayJob = { id, body: normalized, createdAt: Date.now() } as any;
  const streamMode = !!anthropicBody.stream;
  const client = wsServer.pickClient(true);
  if (!client) {
    return res.status(503).json({ error: { message: "No browser extension connected", type: "service_unavailable", code: "no_clients" } });
  }
  if (streamMode) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    let finished = false;
    const timeout = setTimeout(() => {
      if (!finished) {
        res.write('data: {"error":"timeout"}\n\n');
        res.end();
      }
    }, 180000);
    try {
      await v1MessageSendJobToClientStreaming(client.id, (client as any).ws, job, (chunk) => {
        if (chunk && chunk.delta) {
         console.log('SERVER: sending chunk delta:', chunk.delta);
          res.write(`event: content_block_delta\ndata: ${JSON.stringify({
            type: "content_block_delta",
            index: 0,
            delta: chunk.delta
          })}\n\n`);
        }
        if (chunk && chunk.done) {
          finished = true;
          res.write(`event: message_stop\ndata: ${JSON.stringify({ type: "message_stop" })}\n\n`);
          res.end();
        }
      });
    } catch (e) {
      res.write('data: {"error":"error"}\n\n');
      res.end();
    } finally {
      clearTimeout(timeout);
    }
    return;
  }

  try {
    const result = await v1MessageSendJobToClient(client.id, (client as any).ws, job);
    res.json(result);
  } catch (err: any) {
    res.status(504).json({ error: { message: err.message || "Relay error", type: "timeout", code: "request_timeout" } });
  }
});

// == Health, Models, and Admin Endpoints ==
app.get("/ping", (_req, res) => {
  res.json({
    ok: true,
    timestamp: Date.now(),
    uptime: process.uptime(),
    clients: wsServer.getStatus().clientCount
  });
});
app.get("/health", (_req, res) => {
  const status = wsServer.getStatus();
  const healthy = status.clientCount > 0;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "healthy" : "unhealthy",
    clients: status.clientCount,
    queue: queue.size(),
    uptime: process.uptime()
  });
});

async function getModelFromClient(clientId: string, ws: any, job: RelayJob): Promise<any> {
  const id = job.id;
  const payload = { type: "relay_request_v1_models", id, body: job.body };
 console.log('Sending payload to client:', payload);
  wsServer.setClientBusy(clientId, true);
  const timeoutMs = settings.requestTimeoutMs || 180000;
  return new Promise((resolve, reject) => {
    let isResolved = false;
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    function cleanup() {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timer);
        try { ws.off("message", onMessage); } catch { }
        try { ws.off("close", onClose); } catch { }
        wsServer.setClientBusy(clientId, false);
      }
    }
    const onMessage = (data: any) => {
      try {
        const msg = typeof data === "string" ? JSON.parse(data) : JSON.parse(data.toString());
        if (msg.type === "relay_response_v1_models" && msg.id === id) {
          cleanup();
          if (msg.error) reject(new Error(msg.error));
          else resolve(msg.data);
        }
      } catch { }
    };
    const onClose = () => { cleanup(); reject(new Error("WS client disconnected")); };
    ws.on("message", onMessage);
    ws.on("close", onClose);
    ws.send(JSON.stringify(payload));
  });
}

app.get("/:org/v1/models/:modelId", async (req, res) => {
  const { org, modelId } = req.params;

  const id = uuidv4();
  const job: RelayJob = { id, createdAt: Date.now() } as any;
  const client = wsServer.pickClient(true);
  if (!client) {
    return res.status(503).json({ error: { message: "No browser extension connected", type: "service_unavailable", code: "no_clients" } });
  }
  try {
    const result = await getModelFromClient(client.id, (client as any).ws, job);

    const m = result.find((item: any) => item.id === modelId);
    if (!m || Object.keys(m).length === 0) {
      return res.status(404).json({ error: { message: `Model ${modelId} not found`, type: "not_found", code: "model_not_found" } });
    }

    switch (org) {
      case 'openai':
        return res.json({
          "id": m.id,
          "created": new Date().getTime(),
          "owned_by": m.owned_by,
          "object": "model"
        });
      case 'anthropic':
        return res.json({
          "id": m.id,
          "created_at": new Date().getTime(),
          "display_name": m.title,
          "type": "model"
        });

      default:
        return res.status(403).json({ error: { message: `Organization ${org} not found`, type: "forbidden", code: "org_not_found" } });
    }


  } catch (err: any) {
    if (!res.headersSent) {
      res.status(504).json({ error: { message: err.message || "Relay error", type: "timeout", code: "request_timeout" } });
    }
  }
});

app.get("/:org/v1/models", async (req, res) => {
  const { org } = req.params;

  const id = uuidv4();
  const job: RelayJob = { id, createdAt: Date.now() } as any;
  const client = wsServer.pickClient(true);
  if (!client) {
    return res.status(503).json({ error: { message: "No browser extension connected", type: "service_unavailable", code: "no_clients" } });
  }
  try {
    const result = await getModelFromClient(client.id, (client as any).ws, job);

    switch (org) {
      case "openai":
        return res.json({
          "object": "list",
          "data": result.map((item: any) => ({
            "id": item.id,
            "created": new Date().getTime(),
            "owned_by": item.owned_by,
            "object": "model"
          }))
        });
      case "anthropic":
        return res.json({
          "data": result.map((item: any) => ({
            "id": item.id,
            "created_at": new Date().getTime(),
            "display_name": item.title,
            "type": 'model'
          })),
          "first_id": "first_id",
          "has_more": true,
          "last_id": "last_id"
        });
      case "google":
        return res.status(501).json({ error: { message: "Google API not yet implemented", type: "not_implemented", code: "not_implemented" } });
      default:
        return res.status(403).json({ error: { message: `Organization ${org} not found`, type: "forbidden", code: "org_not_found" } });
    }

  } catch (err: any) {
    if (!res.headersSent) {
      res.status(504).json({ error: { message: err.message || "Relay error", type: "timeout", code: "request_timeout" } });
    }
  }
});

// == Start server ==
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
server.listen(PORT, () => {
  console.log("═".repeat(60));
  console.log(`🚀 Chat Relay API Server`);
  console.log("═".repeat(60));
  console.log(`📡 HTTP API:       http://localhost:${PORT}`);
  console.log(`🔌 WebSocket:      ws://localhost:${PORT}/ws`);
  console.log(`⚙️  Admin UI:      http://localhost:${PORT}/admin`);
  console.log(`❤️  Health Check:  http://localhost:${PORT}/health`);
  console.log("═".repeat(60));
});

export default app;
