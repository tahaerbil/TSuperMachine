import React, { useRef, useEffect, useState } from 'react';
import { useAIStore } from '../../store/aiStore';
import { useAISettingsStore } from '../../store/aiSettingsStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { ChatMessageBubble } from './components/ChatMessageBubble';
import { Send, Bot, Cpu, Cloud, Trash2, StopCircle, ChevronDown, Check, Sparkles } from 'lucide-react';

interface AIWidgetProps {
    id: string; // Widget ID
}

export const AIWidget: React.FC<AIWidgetProps> = () => {
    const { activeTabId } = useWorkspaceStore();
    const {
        histories,
        sendMessage,
        status,
        clearHistory
    } = useAIStore();

    // specific messages for this project
    const messages = React.useMemo(() =>
        activeTabId ? (histories[activeTabId] || []) : [],
        [activeTabId, histories]);

    const { providers, activeProviderId, setActiveProvider } = useAISettingsStore();
    const activeProvider = providers.find(p => p.id === activeProviderId);

    const [input, setInput] = useState('');
    const [showProviderMenu, setShowProviderMenu] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom within the messages container only
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }, [messages, status]);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowProviderMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSend = () => {
        if (!input.trim() || status === 'thinking' || status === 'streaming' || !activeTabId) return;
        sendMessage(input, activeTabId);
        setInput('');

        // Reset height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSelectProvider = (providerId: string) => {
        setActiveProvider(providerId);
        setShowProviderMenu(false);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-100">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#252525] shrink-0">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${status === 'thinking' || status === 'streaming' ? 'animate-pulse bg-blue-500/20 text-blue-500' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                        <Bot size={18} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold leading-none">T-Brain</span>
                        <span className="text-[10px] opacity-60 mt-0.5">
                            {status === 'thinking' ? 'Thinking...' : status === 'streaming' ? 'Replying...' : 'Ready'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {/* Provider Dropdown */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowProviderMenu(!showProviderMenu)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            title={activeProvider?.name || 'Select Provider'}
                        >
                            {activeProvider?.type === 'embedded' ? (
                                <Sparkles size={12} className="text-purple-500" />
                            ) : activeProvider?.type === 'local' ? (
                                <Cpu size={12} className="text-green-500" />
                            ) : (
                                <Cloud size={12} className="text-blue-500" />
                            )}
                            <span className="max-w-[80px] truncate">{activeProvider?.name || 'Select'}</span>
                            <ChevronDown size={12} className={`transition-transform ${showProviderMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {showProviderMenu && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1 overflow-hidden">
                                {providers.length === 0 ? (
                                    <div className="px-3 py-2 text-xs text-gray-500 text-center">
                                        No providers configured.<br />
                                        Add in Settings → AI
                                    </div>
                                ) : (
                                    providers.map((provider) => (
                                        <button
                                            key={provider.id}
                                            onClick={() => handleSelectProvider(provider.id)}
                                            className={`w-full px-3 py-2 flex items-center gap-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${activeProviderId === provider.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                                                }`}
                                        >
                                            {provider.type === 'embedded' ? (
                                                <Sparkles size={14} className="text-purple-500 shrink-0" />
                                            ) : provider.type === 'local' ? (
                                                <Cpu size={14} className="text-green-500 shrink-0" />
                                            ) : (
                                                <Cloud size={14} className="text-blue-500 shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{provider.name}</div>
                                                <div className="text-[10px] text-gray-500 truncate">
                                                    {provider.type === 'embedded'
                                                        ? 'Yerleşik'
                                                        : provider.type === 'local'
                                                            ? provider.model
                                                            : provider.apiEndpoint?.split('/')[2]}
                                                </div>
                                            </div>
                                            {activeProviderId === provider.id && (
                                                <Check size={14} className="text-blue-500 shrink-0" />
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => activeTabId && clearHistory(activeTabId)}
                        disabled={!activeTabId || messages.length === 0}
                        className={`p-1.5 rounded transition-colors ${!activeTabId || messages.length === 0
                            ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                            : 'text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        title="Clear History"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-40 px-6 select-none">
                        <Bot size={48} className="mb-4 text-blue-500" />
                        <h3 className="font-semibold text-lg mb-1">How can I help you?</h3>
                        <p className="text-sm">I can answer questions, perform calculations, and analyze your project.</p>
                        <div className="mt-6 flex flex-wrap gap-2 justify-center">
                            {['Calculate sin(45)', 'Standard M10 bolt pitch?', 'Summarize my notes'].map(hint => (
                                <button
                                    key={hint}
                                    onClick={() => activeTabId && sendMessage(hint, activeTabId)}
                                    disabled={!activeTabId}
                                    className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                                >
                                    {hint}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg) => (
                    <ChatMessageBubble key={msg.id} message={msg} />
                ))}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#252525] shrink-0">
                <div className="relative flex items-end gap-2 bg-gray-50 dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-600 focus-within:border-blue-500 dark:focus-within:border-blue-500 rounded-xl p-2 transition-colors shadow-sm">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask T-Brain..."
                        rows={1}
                        className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none py-2 max-h-[120px] scrollbar-hide"
                        style={{ height: 'auto' }}
                        disabled={status === 'thinking' || status === 'streaming'}
                    />

                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || status === 'thinking' || status === 'streaming'}
                        className={`p-2 rounded-lg mb-0.5 transition-all ${input.trim() && status === 'idle'
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {status === 'thinking' || status === 'streaming' ? (
                            <StopCircle size={18} className="animate-pulse" />
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                </div>
                <div className="text-[10px] text-center mt-2 opacity-40">
                    T-Brain can make mistakes. Please verify important engineering data.
                </div>
            </div>
        </div>
    );
};

