export interface Ai {
    modelId: number;
    modelName: string;
    activeStatus: string;
}

export interface AiUsage {
    AiUsageId: number;
    userNo: number;
    modelId: number;
    createdAt: Date;
    lastUsedAt: Date;
    tokensUsed: number;
}

export interface AiChatSession {
    sessionId: number;
    userNo: number;
    modelId: number;
    title: string;
    createdAt: Date;
    lastUsedAt: Date;
}

export interface AiChatHistory {
    historyId: number;
    userNo: number;
    sessionId: number;
    role: string;
    content: string;
    createdAt: Date;
}

export interface message {
    role: string;
    content: string;
}