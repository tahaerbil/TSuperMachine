import type { AIProvider, ChatMessage, AIResponse, ToolDefinition } from '../types';

export class OllamaProvider implements AIProvider {
    id: string;
    type: 'local' = 'local' as const;
    private baseUrl: string;
    private model: string;

    constructor(config: { baseUrl?: string; model: string; id?: string }) {
        this.baseUrl = config.baseUrl || 'http://localhost:11434';
        this.model = config.model;
        this.id = config.id || 'ollama-local';
    }

    async generateResponse(
        messages: ChatMessage[],
        tools?: ToolDefinition[],
        onStream?: (chunk: string) => void
    ): Promise<AIResponse> {
        try {
            // Convert messages to Ollama format
            const ollamaMessages = messages.map(m => ({
                role: m.role,
                content: m.content
            }));

            // TODO: Add tool support when Ollama supports it comfortably via standard API
            // For now, we will handle tools in the Service layer or use a specific format if needed.
            // Note: Newer Ollama versions support tool calling via 'tools' param.

            const requestBody: {
                model: string;
                messages: unknown[];
                stream: boolean;
                tools?: unknown[];
            } = {
                model: this.model,
                messages: ollamaMessages,
                stream: !!onStream,
            };

            if (tools && tools.length > 0) {
                requestBody.tools = tools;
                requestBody.stream = false; // Streaming with tools is often complex, disabling for MVP stability
            }

            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`Ollama API Error: ${response.statusText}`);
            }

            if (onStream && !requestBody.tools) {
                // Handle streaming
                const reader = response.body?.getReader();
                if (!reader) throw new Error('Response body is null');

                let accumulatedContent = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = new TextDecoder().decode(value);
                    const lines = chunk.split('\n').filter(line => line.trim() !== '');

                    for (const line of lines) {
                        try {
                            const json = JSON.parse(line);
                            if (json.done) break;
                            if (json.message?.content) {
                                const content = json.message.content;
                                accumulatedContent += content;
                                onStream(content);
                            }
                        } catch (e) {
                            console.error('Error parsing JSON chunk from Ollama', e);
                        }
                    }
                }

                return { content: accumulatedContent };

            } else {
                // Non-streaming (or Tools)
                const data = await response.json();

                // Map Ollama tool calls to our format if present
                let toolCalls = undefined;
                if (data.message.tool_calls) {
                    toolCalls = data.message.tool_calls.map((tc: { function: { name: string; arguments: unknown } }) => ({
                        id: crypto.randomUUID(), // Ollama might not give IDs, so we generate
                        type: 'function',
                        function: {
                            name: tc.function.name,
                            arguments: JSON.stringify(tc.function.arguments) // Ensure it's a string
                        }
                    }));
                }

                return {
                    content: data.message.content || '',
                    toolCalls: toolCalls,
                    usage: {
                        promptTokens: data.prompt_eval_count || 0,
                        completionTokens: data.eval_count || 0
                    }
                };
            }

        } catch (error) {
            console.error('Ollama Provider Error:', error);
            throw error;
        }
    }
}
