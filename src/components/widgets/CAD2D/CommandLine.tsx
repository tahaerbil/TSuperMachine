import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

interface CommandLineProps {
    onCommand: (command: string) => void;
    history: string[];
    prompt?: string;
}

export interface CommandLineRef {
    focus: () => void;
}

export const CommandLine = forwardRef<CommandLineRef, CommandLineProps>(({ onCommand, history, prompt = "Command" }, ref) => {
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const historyRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
        focus: () => {
            inputRef.current?.focus();
        }
    }));

    // Auto-scroll history
    useEffect(() => {
        if (historyRef.current) {
            historyRef.current.scrollTop = historyRef.current.scrollHeight;
        }
    }, [history]);

    // Keep focus on input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onCommand(input);
            setInput("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onCommand('CANCEL');
            setInput("");
        }
    };

    return (
        <div
            className="absolute bottom-0 left-0 right-0 h-32 bg-[#1e1e1e]/90 border-t border-gray-600 flex flex-col text-white font-mono text-sm shadow-lg z-20"
            onClick={() => inputRef.current?.focus()}
        >
            {/* History Area */}
            <div
                ref={historyRef}
                className="flex-1 overflow-y-auto p-2 space-y-1 select-text scrollbar-thin scrollbar-thumb-gray-600"
            >
                {history.map((line, i) => (
                    <div key={i} className="opacity-80 hover:opacity-100">{line}</div>
                ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="flex items-center p-2 bg-[#2d2d2d] border-t border-gray-700">
                <span className="text-gray-400 mr-2">{prompt}:</span>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-600"
                    autoFocus
                    spellCheck={false}
                    autoComplete="off"
                />
            </form>
        </div>
    );
});

CommandLine.displayName = 'CommandLine';
