import React from 'react';
import type { ChatMessage } from '../../../core/ai/types';
import ReactMarkdown from 'react-markdown';

interface ChatMessageBubbleProps {
    message: ChatMessage;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message }) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    const isTool = message.role === 'tool';

    if (isSystem) return null; // Don't show system messages
    if (isTool) {
        // Optionally show tool outputs in a collapsed view
        return (
            <div className="flex justify-start mb-2 opacity-70">
                <div className="bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 p-2 rounded border border-gray-200 dark:border-gray-700 font-mono max-w-[80%] overflow-x-auto">
                    🛠️ Tool Output: {message.content.substring(0, 100)}...
                </div>
            </div>
        );
    }

    return (
        <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${isUser
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-none'
                    }`}
            >
                <div className="prose dark:prose-invert prose-sm max-w-none break-words">
                    {/* Render Markdown for AI responses */}
                    {isUser ? (
                        <p className="whitespace-pre-wrap m-0">{message.content}</p>
                    ) : (
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                    )}
                </div>

                {/* Timestamp */}
                <div className={`text-[10px] mt-1 opacity-60 ${isUser ? 'text-blue-100' : 'text-gray-400'} text-right`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
    );
};
