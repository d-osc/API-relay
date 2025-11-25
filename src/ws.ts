import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';

interface Client {
    id: string;
    ws: WebSocket;
    busy: boolean;
    lastPing: number;
    supportedModels: string[];
}

export default class RelayWSServer extends EventEmitter {
    private wss: WebSocketServer;
    private clients = new Map<string, Client>();
    private heartbeatInterval: number;
    private heartbeatTimer?: NodeJS.Timeout;

    constructor(server: HTTPServer, options: any) {
        super();
        this.heartbeatInterval = options.heartbeatInterval || 30000;

        this.wss = new WebSocketServer({ server, path: '/ws' });
        this.wss.on('connection', (ws) => this.handleConnection(ws));

        this.startHeartbeat();
    }

    private handleConnection(ws: WebSocket) {
        const id = `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const client: Client = { id, ws, busy: false, lastPing: Date.now(), supportedModels: [] };

        this.clients.set(id, client);
        this.emit('connect', id);

        ws.send(JSON.stringify({ type: 'welcome', id }));

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                if (msg.type === 'ping') {
                    client.lastPing = Date.now();
                    ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                }
                console.log(msg);
                // === รับ models ที่ extension แจ้งมา
                if (msg.type === 'register_models' && Array.isArray(msg.models)) {


                    client.supportedModels = msg.models;
                    this.emit("register_models", id, msg.models);
                }

                this.emit('message', { clientId: id, msg });
            } catch (e) { }
        });

        ws.on('close', () => {
            this.clients.delete(id);
            this.emit('disconnect', id);
        });
    }

    // method สำหรับ API
    getAllSupportedModels(): string[] {
        const all = [...this.clients.values()].flatMap(c => c.supportedModels || []);
        return [...new Set(all)];
    }

    private startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            const now = Date.now();
            for (const [id, client] of this.clients.entries()) {
                if (now - client.lastPing > this.heartbeatInterval * 2) {
                    console.log(`Client ${id} timeout, closing...`);
                    client.ws.close();
                    this.clients.delete(id);
                }
            }
        }, this.heartbeatInterval);
    }

    pickClient(idleOnly = true): Client | null {
        for (const client of this.clients.values()) {
            if (!idleOnly || !client.busy) return client;
        }
        return null;
    }

    setClientBusy(id: string, busy: boolean) {
        const client = this.clients.get(id);
        if (client) client.busy = busy;
    }

    getStatus() {
        return {
            clientCount: this.clients.size,
            clients: Array.from(this.clients.values()).map(c => ({
                id: c.id,
                busy: c.busy,
                lastPing: c.lastPing
            }))
        };
    }
}
