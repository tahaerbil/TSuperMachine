export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
    id: string;
    role: Role;
    content: string;
    timestamp: number;
    toolCallId?: string; // If this message is a response to a tool call
    toolCalls?: ToolCall[]; // If the assistant wants to call tools
}

export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string; // JSON string
    };
}

export interface AIProviderConfig {
    id: string;
    name: string;
    type: 'local' | 'cloud';
    baseUrl?: string;
    apiKey?: string;
    model: string;
}

export interface AIProvider {
    id: string;
    type: 'local' | 'cloud';
    generateResponse(
        messages: ChatMessage[],
        tools?: ToolDefinition[],
        onStream?: (chunk: string) => void
    ): Promise<AIResponse>;
}

export interface AIResponse {
    content: string;
    toolCalls?: ToolCall[];
    usage?: {
        promptTokens: number;
        completionTokens: number;
    };
}

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
    };
}

export interface Tool {
    definition: ToolDefinition;
    execute(args: unknown): Promise<unknown>;
}
