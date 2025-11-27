export interface OpenAIChatRequestBody {
    model?: string;
    messages: Array<{ role: string; content: string; name?: string }>;
    temperature?: number;
    top_p?: number;
    n?: number;
    stream?: boolean;
    stop?: string | Array<string>;
    max_tokens?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    logit_bias?: { [key: string]: number };
    user?: string;
    response_format?: { type: "text" | "json_object" };
    seed?: number;
    tools?: Array<{ type: "function"; function: any }>;
    tool_choice?: "none" | "auto" | { type: "function"; function: any };
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
