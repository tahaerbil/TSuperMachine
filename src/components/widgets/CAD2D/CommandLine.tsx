import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

interface CommandLineProps {
    onCommand: (command: string) => void;
    history: string[];
    prompt?: string;
}

export interface CommandLineRef {
    focus: () => void;
    getInputElement: () => HTMLInputElement | null;
    setLastCommand: (command: string) => void;
}

export const CommandLine = forwardRef<CommandLineRef, CommandLineProps>(({ onCommand, history, prompt = "Command" }, ref) => {
    const [input, setInput] = useState("");
    const [historyIndex, setHistoryIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const historyRef = useRef<HTMLDivElement>(null);
    const commandHistoryRef = useRef<string[]>([]);
    const lastCommandRef = useRef<string>(""); // Track last executed command for Space key repeat

    useImperativeHandle(ref, () => ({
        focus: () => {
            inputRef.current?.focus();
        },
        getInputElement: () => inputRef.current,
        setLastCommand: (command: string) => {
            lastCommandRef.current = command;
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
            // Add to command history (not display history)
            commandHistoryRef.current.push(input);
            lastCommandRef.current = input; // Track last command
            setInput("");
            setHistoryIndex(-1);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onCommand('CANCEL');
            setInput("");
            setHistoryIndex(-1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const cmdHistory = commandHistoryRef.current;
            if (cmdHistory.length > 0) {
                const newIndex = historyIndex === -1 ? cmdHistory.length - 1 : Math.max(0, historyIndex - 1);
                setHistoryIndex(newIndex);
                setInput(cmdHistory[newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const cmdHistory = commandHistoryRef.current;
            if (historyIndex !== -1) {
                const newIndex = historyIndex + 1;
                if (newIndex >= cmdHistory.length) {
                    setHistoryIndex(-1);
                    setInput("");
                } else {
                    setHistoryIndex(newIndex);
                    setInput(cmdHistory[newIndex]);
                }
            }
        } else if (e.key === ' ') {
            // Space key behavior (AutoCAD style)
            if (input.trim()) {
                // If there's text in input, execute it
                e.preventDefault();
                onCommand(input);
                commandHistoryRef.current.push(input);
                lastCommandRef.current = input;
                setInput("");
                setHistoryIndex(-1);
            } else if (lastCommandRef.current) {
                // If input is empty, repeat last command
                e.preventDefault();
                onCommand(lastCommandRef.current);
                commandHistoryRef.current.push(lastCommandRef.current);
                // lastCommandRef stays the same
            }
        }
    };

    return (
        <div
            className="command-line-container absolute bottom-0 left-0 right-0 h-32 bg-[#1e1e1e]/90 border-t border-gray-600 flex flex-col text-white font-mono text-sm shadow-lg z-20"
            onClick={() => inputRef.current?.focus()}
        >
            {/* History Area */}
            <div
                ref={historyRef}
                className="flex-1 overflow-y-auto p-2 space-y-1 select-text scrollbar-thin scrollbar-thumb-gray-600"
                onWheel={(e) => {
                    // Prevent scroll from propagating to parent (canvas zoom)
                    e.stopPropagation();
                }}
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
