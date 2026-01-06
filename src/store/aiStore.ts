import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { aiService } from '../core/ai';
import type { ChatMessage } from '../core/ai';

// Custom storage adapter for Electron (saves to T-Workspace/System/)
const createElectronStorage = (): StateStorage => {
    let cachedPath: string | null = null;

    const getStoragePath = async (): Promise<string> => {
        if (cachedPath) return cachedPath;

        const config = await window.electronAPI?.loadConfig();
        const workspacePath = config?.workspacePath || '';
        cachedPath = `${workspacePath}/System/chat_history.json`;
        return cachedPath;
    };

    return {
        getItem: async (name: string): Promise<string | null> => {
            try {
                const filePath = await getStoragePath();
                const result = await window.electronAPI?.readFile(filePath);
                if (result?.success && result.content) {
                    const data = JSON.parse(result.content);
                    return JSON.stringify(data[name] || null);
                }
                return null;
            } catch {
                return null;
            }
        },
        setItem: async (name: string, value: string): Promise<void> => {
            try {
                const filePath = await getStoragePath();

                // Read existing data
                let existingData: Record<string, unknown> = {};
                try {
                    const result = await window.electronAPI?.readFile(filePath);
                    if (result?.success && result.content) {
                        existingData = JSON.parse(result.content);
                    }
                } catch {
                    // File doesn't exist yet, start fresh
                }

                // Update with new value
                existingData[name] = JSON.parse(value);

                // Save back
                await window.electronAPI?.writeFile({
                    filePath,
                    content: JSON.stringify(existingData, null, 2)
                });
            } catch (error) {
                console.error('Failed to save AI chat history:', error);
            }
        },
        removeItem: async (name: string): Promise<void> => {
            try {
                const filePath = await getStoragePath();
                const result = await window.electronAPI?.readFile(filePath);
                if (result?.success && result.content) {
                    const data = JSON.parse(result.content);
                    delete data[name];
                    await window.electronAPI?.writeFile({
                        filePath,
                        content: JSON.stringify(data, null, 2)
                    });
                }
            } catch {
                // Ignore errors on remove
            }
        }
    };
};

interface AIState {
    messages: ChatMessage[];
    status: 'idle' | 'thinking' | 'streaming' | 'error';
    activeProviderId: string; // 'local' or 'cloud'
    isChatOpen: boolean;

    // Actions
    sendMessage: (content: string) => Promise<void>;
    clearHistory: () => void;
    toggleChat: () => void;
    setProviderId: (id: string) => void;
}

// Use Electron storage if available, fallback to localStorage
const storage = window.electronAPI
    ? createElectronStorage()
    : localStorage;

export const useAIStore = create<AIState>()(
    persist(
        (set, get) => ({
            messages: [],
            status: 'idle',
            activeProviderId: 'local',
            isChatOpen: false,

            sendMessage: async (content: string) => {
                const { messages } = get();

                // 1. Add User Message
                const userMsg: ChatMessage = {
                    id: crypto.randomUUID(),
                    role: 'user',
                    content,
                    timestamp: Date.now()
                };

                set({ messages: [...messages, userMsg], status: 'thinking' });

                try {
                    // 2. Call Service
                    // We'll update the last message in streaming mode
                    const assistantMsgId = crypto.randomUUID();
                    let currentContent = '';
                    let didStream = false;

                    const finalResponse = await aiService.sendMessage(
                        messages,
                        content,
                        (chunk: string) => {
                            // Streaming callback
                            didStream = true;
                            currentContent += chunk;
                            set((state) => {
                                // Check if we already have the assistant message in state
                                const msgs = [...state.messages];
                                const existingIdx = msgs.findIndex(m => m.id === assistantMsgId);

                                if (existingIdx >= 0) {
                                    msgs[existingIdx] = {
                                        ...msgs[existingIdx],
                                        content: currentContent
                                    };
                                } else {
                                    msgs.push({
                                        id: assistantMsgId,
                                        role: 'assistant',
                                        content: currentContent,
                                        timestamp: Date.now()
                                    });
                                }
                                return { messages: msgs, status: 'streaming' };
                            });
                        }
                    );

                    // Finalize: Only add if we didn't stream, otherwise just update status
                    set((state) => {
                        const msgs = [...state.messages];
                        const existingIdx = msgs.findIndex(m => m.id === assistantMsgId);

                        if (didStream && existingIdx >= 0) {
                            // Already streamed, just finalize content and status
                            msgs[existingIdx] = {
                                ...msgs[existingIdx],
                                content: finalResponse.content
                            };
                        } else if (!didStream) {
                            // Didn't stream, add the final message
                            msgs.push({
                                id: assistantMsgId,
                                role: 'assistant',
                                content: finalResponse.content,
                                timestamp: Date.now()
                            });
                        }
                        return { messages: msgs, status: 'idle' };
                    });

                } catch (error) {
                    console.error('AI Error:', error);
                    set({ status: 'error' });
                    // Optionally add error message to chat
                }
            },

            clearHistory: () => set({ messages: [] }),
            toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
            setProviderId: (id) => set({ activeProviderId: id }),
        }),
        {
            name: 'tsuper-ai-store',
            storage: createJSONStorage(() => storage),
            partialize: (state) => ({
                messages: state.messages,
                activeProviderId: state.activeProviderId
            }),
        }
    )
);

