import type { AIProvider, ChatMessage } from './types';
import { toolRegistry } from './ToolRegistry';
import { OllamaProvider } from './providers/OllamaProvider';
import { SimpleProvider } from './providers/SimpleProvider';
import { EmbeddedProvider } from './providers/EmbeddedProvider';
import { useAISettingsStore } from '../../store/aiSettingsStore';

export class AIService {
    private providers: Map<string, AIProvider> = new Map();
    private systemPrompt: string = "You are T-Brain, an intelligent assistant for TSuperMachine. You can help with engineering calculations, analyzing files, and general questions. Be concise and helpful.";

    constructor() {
        // Register built-in providers
        this.providers.set('simple', new SimpleProvider());
        this.providers.set('qwen-embedded', new EmbeddedProvider());
    }

    private getActiveProvider(): AIProvider {
        const settings = useAISettingsStore.getState();
        const activeConfig = settings.getActiveProvider();

        if (!activeConfig) {
            // Fallback to simple provider
            return this.providers.get('simple')!;
        }

        // Check if we already have this provider instance
        if (this.providers.has(activeConfig.id)) {
            return this.providers.get(activeConfig.id)!;
        }

        // Create provider based on type and id
        if (activeConfig.id === 'simple-embedded') {
            return this.providers.get('simple')!;
        } else if (activeConfig.id === 'qwen-embedded') {
            return this.providers.get('qwen-embedded')!;
        } else if (activeConfig.type === 'local') {
            const ollamaProvider = new OllamaProvider({
                model: activeConfig.model || 'qwen2.5:3b',
                baseUrl: activeConfig.endpoint || 'http://localhost:11434'
            });
            this.providers.set(activeConfig.id, ollamaProvider);
            return ollamaProvider;
        } else {
            // API providers - for now, fallback to simple
            // TODO: Implement OpenAI-compatible API provider
            return this.providers.get('simple')!;
        }
    }

    async sendMessage(
        history: ChatMessage[],
        newMessage: string,
        onStream?: (chunk: string) => void
    ): Promise<ChatMessage> {

        const provider = this.getActiveProvider();

        // 1. Prepare messages
        const messages: ChatMessage[] = [
            { id: 'system', role: 'system', content: this.systemPrompt, timestamp: Date.now() },
            ...history,
            { id: crypto.randomUUID(), role: 'user', content: newMessage, timestamp: Date.now() }
        ];

        // 2. Get Tools
        const tools = toolRegistry.getDefinitions();

        // 3. Call Provider
        let response = await provider.generateResponse(messages, tools, onStream);

        // 4. Handle Tool Calls (Recursive Loop)
        // If the AI wants to call a tool, we execute it and feed the result back
        while (response.toolCalls && response.toolCalls.length > 0) {

            // Add the assistant's message (with tool calls) to history
            const assistantMsg: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: response.content || '', // Might be empty if just calling tools
                toolCalls: response.toolCalls,
                timestamp: Date.now()
            };
            messages.push(assistantMsg);

            // Execute each tool
            for (const toolCall of response.toolCalls) {
                console.log(`Executing tool: ${toolCall.function.name}`);
                try {
                    const args = JSON.parse(toolCall.function.arguments);
                    const result = await toolRegistry.executeTool(toolCall.function.name, args);

                    // Add result to history
                    messages.push({
                        id: crypto.randomUUID(),
                        role: 'tool',
                        content: JSON.stringify(result),
                        toolCallId: toolCall.id,
                        timestamp: Date.now()
                    });
                } catch (error) {
                    const errorMessage = (error instanceof Error) ? error.message : String(error);
                    messages.push({
                        id: crypto.randomUUID(),
                        role: 'tool',
                        content: `Error: ${errorMessage}`,
                        toolCallId: toolCall.id,
                        timestamp: Date.now()
                    });
                }
            }

            // Call provider again with the tool results
            response = await provider.generateResponse(messages, tools, onStream);
        }

        // 5. Final Response
        return {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response.content,
            timestamp: Date.now()
        };
    }
}

export const aiService = new AIService();

