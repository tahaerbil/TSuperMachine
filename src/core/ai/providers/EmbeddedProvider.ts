/**
 * EmbeddedProvider - Runs Qwen2.5-3B locally via IPC to main process
 * Uses node-llama-cpp in Electron main process for native LLM inference
 */

import type { AIProvider, ChatMessage, ToolDefinition, AIResponse, ToolCall } from '../types';

export class EmbeddedProvider implements AIProvider {
    id = 'embedded-qwen';
    type: 'local' | 'cloud' = 'local';

    private isLoaded = false;
    private isLoading = false;

    async ensureLoaded(): Promise<boolean> {
        if (this.isLoaded) return true;
        if (this.isLoading) {
            // Wait for loading
            while (this.isLoading) {
                await new Promise(r => setTimeout(r, 100));
            }
            return this.isLoaded;
        }

        if (!window.electronAPI) {
            console.error('[EmbeddedProvider] Not in Electron environment');
            return false;
        }

        this.isLoading = true;

        try {
            // Check if model exists
            const checkResult = await window.electronAPI.llmCheckModel();
            if (!checkResult.exists) {
                console.error('[EmbeddedProvider] Model not found:', checkResult.path);
                this.isLoading = false;
                return false;
            }

            // Load the model
            console.log('[EmbeddedProvider] Loading model...');
            const loadResult = await window.electronAPI.llmLoad();

            if (loadResult.success) {
                console.log('[EmbeddedProvider] Model loaded successfully');
                this.isLoaded = true;
            } else {
                console.error('[EmbeddedProvider] Failed to load:', loadResult.error);
            }

            this.isLoading = false;
            return this.isLoaded;

        } catch (error) {
            console.error('[EmbeddedProvider] Load error:', error);
            this.isLoading = false;
            return false;
        }
    }

    async generateResponse(
        messages: ChatMessage[],
        tools?: ToolDefinition[],
        onStream?: (chunk: string) => void
    ): Promise<AIResponse> {
        const loaded = await this.ensureLoaded();

        if (!loaded || !window.electronAPI) {
            return {
                content: '❌ Model yüklenemedi. Lütfen model dosyasının `models/` klasöründe mevcut olduğunu kontrol edin.\n\nModel indirmek için: Settings → AI → Model İndir'
            };
        }

        try {
            // Format messages for Qwen
            const formattedPrompt = this.formatMessages(messages, tools);

            // Generate response via IPC
            const result = await window.electronAPI.llmGenerate({
                prompt: formattedPrompt,
                maxTokens: 1024,
                temperature: 0.7
            });

            if (!result.success) {
                return {
                    content: `❌ Yanıt oluşturulurken hata: ${result.error}`
                };
            }

            const response = result.response || '';

            // Simulate streaming if callback provided
            if (onStream && response) {
                const words = response.split(' ');
                for (let i = 0; i < words.length; i++) {
                    await new Promise(r => setTimeout(r, 20));
                    onStream(words[i] + (i < words.length - 1 ? ' ' : ''));
                }
            }

            // Parse for tool calls if tools were provided
            const toolCalls = tools?.length ? this.parseToolCalls(response) : undefined;

            return {
                content: toolCalls?.length ? '' : response,
                toolCalls
            };

        } catch (error) {
            console.error('[EmbeddedProvider] Generation error:', error);
            return {
                content: `❌ Yanıt oluşturulurken hata: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    private formatMessages(messages: ChatMessage[], tools?: ToolDefinition[]): string {
        let prompt = '';

        // Add tool definitions if available
        if (tools?.length) {
            prompt += `You have access to the following tools:\n\n`;
            for (const tool of tools) {
                prompt += `### ${tool.name}\n`;
                prompt += `${tool.description}\n`;
                prompt += `Parameters: ${JSON.stringify(tool.parameters, null, 2)}\n\n`;
            }
            prompt += `To use a tool, respond with:\n<tool_call>{"name": "tool_name", "arguments": {...}}</tool_call>\n\n`;
        }

        // Format chat messages using Qwen's format
        for (const msg of messages) {
            if (msg.role === 'system') {
                prompt += `<|im_start|>system\n${msg.content}<|im_end|>\n`;
            } else if (msg.role === 'user') {
                prompt += `<|im_start|>user\n${msg.content}<|im_end|>\n`;
            } else if (msg.role === 'assistant') {
                prompt += `<|im_start|>assistant\n${msg.content}<|im_end|>\n`;
            } else if (msg.role === 'tool') {
                prompt += `<|im_start|>tool\nResult: ${msg.content}<|im_end|>\n`;
            }
        }

        prompt += `<|im_start|>assistant\n`;
        return prompt;
    }

    private parseToolCalls(response: string): ToolCall[] | undefined {
        const toolCalls: ToolCall[] = [];

        // Look for <tool_call>...</tool_call> patterns
        const toolCallRegex = /<tool_call>([\s\S]*?)<\/tool_call>/g;
        let match;

        while ((match = toolCallRegex.exec(response)) !== null) {
            try {
                const parsed = JSON.parse(match[1].trim());
                if (parsed.name) {
                    toolCalls.push({
                        id: crypto.randomUUID(),
                        type: 'function',
                        function: {
                            name: parsed.name,
                            arguments: JSON.stringify(parsed.arguments || {})
                        }
                    });
                }
            } catch {
                // Invalid JSON, skip
            }
        }

        return toolCalls.length > 0 ? toolCalls : undefined;
    }
}

export const embeddedProvider = new EmbeddedProvider();
