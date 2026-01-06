import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';

// AI Provider configuration types
export interface AIProviderConfig {
    id: string;
    name: string;
    type: 'local' | 'api' | 'embedded';
    // For local (Ollama)
    model?: string;
    endpoint?: string;
    // For API
    apiKey?: string;
    apiEndpoint?: string;
    // Status
    isDefault?: boolean;
}

interface AISettingsState {
    providers: AIProviderConfig[];
    activeProviderId: string;

    // Actions
    addProvider: (provider: AIProviderConfig) => void;
    updateProvider: (id: string, updates: Partial<AIProviderConfig>) => void;
    removeProvider: (id: string) => void;
    setActiveProvider: (id: string) => void;
    getActiveProvider: () => AIProviderConfig | undefined;
}

// Default providers
const DEFAULT_PROVIDERS: AIProviderConfig[] = [
    {
        id: 'simple-embedded',
        name: 'T-Brain Mini',
        type: 'embedded',
        isDefault: true
    },
    {
        id: 'qwen-embedded',
        name: 'Qwen2.5-3B (Gömülü)',
        type: 'embedded',
        model: 'qwen2.5-3b-instruct-q4_k_m.gguf',
        isDefault: false
    },
    {
        id: 'ollama-default',
        name: 'Ollama (Local)',
        type: 'local',
        model: 'qwen2.5:3b',
        endpoint: 'http://localhost:11434',
        isDefault: false
    }
];

// Custom storage for Electron
const createElectronStorage = (): StateStorage => {
    let cachedPath: string | null = null;

    const getStoragePath = async (): Promise<string> => {
        if (cachedPath) return cachedPath;
        const config = await window.electronAPI?.loadConfig();
        const workspacePath = config?.workspacePath || '';
        cachedPath = `${workspacePath}/System/ai_settings.json`;
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
                let existingData: Record<string, unknown> = {};
                try {
                    const result = await window.electronAPI?.readFile(filePath);
                    if (result?.success && result.content) {
                        existingData = JSON.parse(result.content);
                    }
                } catch { /* ignore */ }
                existingData[name] = JSON.parse(value);
                await window.electronAPI?.writeFile({
                    filePath,
                    content: JSON.stringify(existingData, null, 2)
                });
            } catch (error) {
                console.error('Failed to save AI settings:', error);
            }
        },
        removeItem: async (): Promise<void> => { /* not needed */ }
    };
};

const storage = window.electronAPI ? createElectronStorage() : localStorage;

export const useAISettingsStore = create<AISettingsState>()(
    persist(
        (set, get) => ({
            providers: DEFAULT_PROVIDERS,
            activeProviderId: 'simple-embedded',

            addProvider: (provider) => set((state) => ({
                providers: [...state.providers, provider]
            })),

            updateProvider: (id, updates) => set((state) => ({
                providers: state.providers.map(p =>
                    p.id === id ? { ...p, ...updates } : p
                )
            })),

            removeProvider: (id) => set((state) => ({
                providers: state.providers.filter(p => p.id !== id),
                activeProviderId: state.activeProviderId === id
                    ? state.providers[0]?.id || ''
                    : state.activeProviderId
            })),

            setActiveProvider: (id) => set({ activeProviderId: id }),

            getActiveProvider: () => {
                const state = get();
                return state.providers.find(p => p.id === state.activeProviderId);
            }
        }),
        {
            name: 'tsuper-ai-settings',
            storage: createJSONStorage(() => storage),
            partialize: (state) => ({
                providers: state.providers,
                activeProviderId: state.activeProviderId
            })
        }
    )
);
