export interface OpenAIChatRequestBody {
    model?: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
}

export interface RelayJob {
    id: string;
    body: OpenAIChatRequestBody;
    createdAt: number;
}

export interface Settings {
    heartbeatIntervalMs: number;
    connectionTimeoutMs: number;
    requestTimeoutMs: number;
    maxQueueSize: number;
    queueBehavior: 'queue' | 'drop';
}
