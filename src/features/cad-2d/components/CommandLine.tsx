import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';

// ============================================================================
// Command Definitions for AutoComplete
// ============================================================================

interface CommandDefinition {
    command: string;
    alias: string;
    description: string;
    category: 'draw' | 'edit' | 'view' | 'modify' | 'utility';
}

// Category icons for visual distinction
const CATEGORY_ICONS: Record<CommandDefinition['category'], string> = {
    draw: '✏️',
    edit: '✂️',
    modify: '🔧',
    view: '👁️',
    utility: '⚙️'
};

const COMMANDS: CommandDefinition[] = [
    // Drawing Commands
    { command: 'LINE', alias: 'L', description: 'Create a line segment', category: 'draw' },
    { command: 'CIRCLE', alias: 'C', description: 'Create a circle', category: 'draw' },
    { command: 'POLYLINE', alias: 'PL', description: 'Create connected line segments', category: 'draw' },
    { command: 'RECTANGLE', alias: 'REC', description: 'Create a rectangle', category: 'draw' },
    { command: 'ARC', alias: 'A', description: 'Create an arc', category: 'draw' },
    { command: 'POLYGON', alias: 'POL', description: 'Create a regular polygon', category: 'draw' },
    // Future drawing commands (placeholders for autocomplete)
    { command: 'ELLIPSE', alias: 'EL', description: 'Create an ellipse (coming soon)', category: 'draw' },
    { command: 'POINT', alias: 'PO', description: 'Create a point (coming soon)', category: 'draw' },

    // Editing Commands
    { command: 'MOVE', alias: 'M', description: 'Move selected objects', category: 'edit' },
    { command: 'COPY', alias: 'CO', description: 'Copy selected objects', category: 'edit' },
    { command: 'ROTATE', alias: 'RO', description: 'Rotate around a point', category: 'edit' },
    { command: 'OFFSET', alias: 'O', description: 'Create parallel copies', category: 'edit' },
    { command: 'ERASE', alias: 'E', description: 'Delete selected objects', category: 'edit' },
    { command: 'DELETE', alias: 'DEL', description: 'Delete selected objects', category: 'edit' },
    // Future editing commands
    { command: 'SCALE', alias: 'SC', description: 'Scale objects (coming soon)', category: 'edit' },
    { command: 'MIRROR', alias: 'MI', description: 'Mirror objects (coming soon)', category: 'edit' },
    { command: 'TRIM', alias: 'TR', description: 'Trim objects (coming soon)', category: 'edit' },
    { command: 'EXTEND', alias: 'EX', description: 'Extend objects (coming soon)', category: 'edit' },

    // View Commands
    { command: 'ZOOM', alias: 'Z', description: 'Zoom in/out', category: 'view' },
    { command: 'PAN', alias: 'P', description: 'Pan the view', category: 'view' },

    // Utility Commands
    { command: 'CLOSE', alias: 'CL', description: 'Close to first point', category: 'utility' },
    { command: 'UNDO', alias: 'U', description: 'Undo last action', category: 'utility' },
    { command: 'REDO', alias: 'RE', description: 'Redo last action', category: 'utility' },
    { command: 'CANCEL', alias: 'ESC', description: 'Cancel current command', category: 'utility' },
];

export { COMMANDS, CATEGORY_ICONS };
export type { CommandDefinition };


// ============================================================================
// Prompt Formatter - Highlights option shortcuts [C]lose style
// ============================================================================

function formatPromptWithHighlights(prompt: string): React.ReactNode {
    // Pattern: [Option] → [O]ption with highlighted O
    const regex = /\[([A-Za-z])([A-Za-z]*)\]/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(prompt)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
            parts.push(prompt.slice(lastIndex, match.index));
        }

        // Add formatted option: [C]lose
        const shortcut = match[1];
        const rest = match[2];
        parts.push(
            <span key={key++} className="text-gray-300">
                [<span className="text-cyan-400 font-bold">{shortcut}</span>]{rest}
            </span>
        );

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < prompt.length) {
        parts.push(prompt.slice(lastIndex));
    }

    return parts.length > 0 ? <>{parts}</> : prompt;
}

// ============================================================================
// Types
// ============================================================================

interface CommandLineProps {
    onCommand: (command: string) => void;
    history: string[];
    prompt?: string;
    activeCommand?: boolean;
    allowEmptyInput?: boolean;
    onDelete?: () => void;
}

export interface CommandLineRef {
    focus: () => void;
    getInputElement: () => HTMLInputElement | null;
    setLastCommand: (command: string) => void;
}

interface Suggestion {
    command: string;
    alias: string;
    description: string;
    category: CommandDefinition['category'];
    matchType: 'exact-alias' | 'start' | 'mid';
}

// ============================================================================
// CommandLine Component
// ============================================================================

export const CommandLine = forwardRef<CommandLineRef, CommandLineProps>(({
    onCommand,
    history,
    prompt = "Command",
    activeCommand = false,
    allowEmptyInput = false,
    onDelete
}, ref) => {
    const [input, setInput] = useState("");
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);
    const historyRef = useRef<HTMLDivElement>(null);
    const commandHistoryRef = useRef<string[]>([]);
    const lastCommandRef = useRef<string>("");
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // ========================================================================
    // Refs & Imperative Handle
    // ========================================================================

    useImperativeHandle(ref, () => ({
        focus: () => inputRef.current?.focus(),
        getInputElement: () => inputRef.current,
        setLastCommand: (command: string) => {
            lastCommandRef.current = command;
        }
    }));

    // ========================================================================
    // AutoComplete Logic
    // ========================================================================

    const filteredSuggestions = useMemo(() => {
        if (!input || input.length < 1 || activeCommand) {
            return [];
        }

        const upper = input.toUpperCase();
        const results: Suggestion[] = [];

        // Priority 1: Exact alias match
        for (const cmd of COMMANDS) {
            if (cmd.alias === upper) {
                results.push({ ...cmd, matchType: 'exact-alias' });
            }
        }

        // Priority 2: Starts with input
        for (const cmd of COMMANDS) {
            if (cmd.command.startsWith(upper) && !results.find(r => r.command === cmd.command)) {
                results.push({ ...cmd, matchType: 'start' });
            }
        }

        // Priority 3: Mid-string match (contains)
        for (const cmd of COMMANDS) {
            if (cmd.command.includes(upper) && !cmd.command.startsWith(upper) && !results.find(r => r.command === cmd.command)) {
                results.push({ ...cmd, matchType: 'mid' });
            }
        }

        return results.slice(0, 8); // Max 8 suggestions
    }, [input, activeCommand]);

    const suggestions = filteredSuggestions;
    const showSuggestions = suggestions.length > 0;

    // ========================================================================
    // Auto-scroll history
    // ========================================================================

    useEffect(() => {
        if (historyRef.current) {
            historyRef.current.scrollTop = historyRef.current.scrollHeight;
        }
    }, [history]);

    // Keep focus on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // ========================================================================
    // Command Execution
    // ========================================================================

    const executeCommand = (command: string) => {
        const trimmed = command.trim();

        if (trimmed) {
            onCommand(trimmed);
            commandHistoryRef.current.push(trimmed);
            lastCommandRef.current = trimmed;
        } else if (allowEmptyInput) {
            onCommand("");
        } else if (lastCommandRef.current) {
            onCommand(lastCommandRef.current);
            commandHistoryRef.current.push(lastCommandRef.current);
        }

        setInput("");
        setHistoryIndex(-1);
    };

    // ========================================================================
    // Event Handlers
    // ========================================================================

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // If suggestion is shown and selected, use it
        if (showSuggestions && suggestions.length > 0) {
            const selected = suggestions[selectedSuggestionIndex];
            executeCommand(selected.command);
        } else {
            executeCommand(input);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // ESC - Cancel
        if (e.key === 'Escape') {
            if (showSuggestions) {
                setInput(""); // Clear input to hide suggestions
            } else {
                onCommand('CANCEL');
                setInput("");
                setHistoryIndex(-1);
            }
            return;
        }

        // Tab - Accept suggestion
        if (e.key === 'Tab' && showSuggestions && suggestions.length > 0) {
            e.preventDefault();
            const selected = suggestions[selectedSuggestionIndex];
            setInput(selected.command);
            return;
        }

        // Arrow Up
        if (e.key === 'ArrowUp') {
            e.preventDefault();

            if (showSuggestions && suggestions.length > 0) {
                // Navigate suggestions
                setSelectedSuggestionIndex(prev =>
                    prev > 0 ? prev - 1 : suggestions.length - 1
                );
            } else {
                // Navigate command history
                const cmdHistory = commandHistoryRef.current;
                if (cmdHistory.length > 0) {
                    const newIndex = historyIndex === -1
                        ? cmdHistory.length - 1
                        : Math.max(0, historyIndex - 1);
                    setHistoryIndex(newIndex);
                    setInput(cmdHistory[newIndex]);
                }
            }
            return;
        }

        // Arrow Down
        if (e.key === 'ArrowDown') {
            e.preventDefault();

            if (showSuggestions && suggestions.length > 0) {
                // Navigate suggestions
                setSelectedSuggestionIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : 0
                );
            } else {
                // Navigate command history
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
            }
            return;
        }

        // Space - AutoCAD style (Enter equivalent)
        if (e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();

            if (input.trim()) {
                // If suggestion shown, use selected
                if (showSuggestions && suggestions.length > 0) {
                    const selected = suggestions[selectedSuggestionIndex];
                    executeCommand(selected.command);
                } else {
                    executeCommand(input);
                }
            } else if (activeCommand) {
                onCommand("");
            } else if (lastCommandRef.current) {
                executeCommand(lastCommandRef.current);
            }
            return;
        }

        // Delete - Delete selected objects
        if (e.key === 'Delete') {
            if (!input && onDelete) {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
            }
            return;
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        setHistoryIndex(-1);
    };

    // ========================================================================
    // Resize functionality
    // ========================================================================

    const [height, setHeight] = useState(140);
    const isResizingRef = useRef(false);
    const startYRef = useRef(0);
    const startHeightRef = useRef(0);

    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isResizingRef.current = true;
        startYRef.current = e.clientY;
        startHeightRef.current = height;

        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingRef.current) return;
            const delta = startYRef.current - e.clientY;
            const newHeight = Math.min(Math.max(100, startHeightRef.current + delta), 400);
            setHeight(newHeight);
        };

        const handleMouseUp = () => {
            isResizingRef.current = false;
            document.removeEventListener('mousemove', handleMouseMove, true);
            document.removeEventListener('mouseup', handleMouseUp, true);
        };

        // Use capture phase (true) to receive events before stopPropagation blocks them
        document.addEventListener('mousemove', handleMouseMove, true);
        document.addEventListener('mouseup', handleMouseUp, true);
    };

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <div
            className="command-line-container absolute bottom-8 left-1/2 -translate-x-1/2 w-[95%] max-w-[700px] flex flex-col text-white font-mono text-sm z-20"
            style={{ height: `${height}px` }}
            onClick={(e) => {
                e.stopPropagation(); // Prevent bubbling to canvas
                inputRef.current?.focus();
            }}
            onMouseDown={(e) => {
                e.stopPropagation(); // Prevent canvas from receiving mouse events
            }}
            onMouseUp={(e) => e.stopPropagation()}
            onMouseMove={(e) => e.stopPropagation()}
            onAuxClick={(e) => {
                // Stop propagation but don't prevent default!
                // This allows middle-click paste in console while blocking it on canvas
                e.stopPropagation();
            }}
        >
            {/* Main Console Panel */}
            <div className="flex-1 flex flex-col bg-[#1a1a1a]/60 backdrop-blur-sm rounded-lg border border-gray-600/30 shadow-2xl overflow-hidden">

                {/* Resize Handle */}
                <div
                    className="h-1.5 bg-gray-700/50 hover:bg-cyan-500/50 cursor-ns-resize flex items-center justify-center group transition-colors"
                    onMouseDown={handleResizeStart}
                >
                    <div className="w-12 h-0.5 bg-gray-500 group-hover:bg-cyan-400 rounded-full transition-colors" />
                </div>

                {/* History Area */}
                <div
                    ref={historyRef}
                    className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 select-text"
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#444 transparent'
                    }}
                    onWheel={(e) => e.stopPropagation()}
                    onMouseDown={(e) => {
                        // Middle-click: focus input so paste works (Linux primary selection)
                        if (e.button === 1) {
                            inputRef.current?.focus();
                        }
                    }}
                >
                    {history.map((line, i) => (
                        <div key={i} className={`
                            ${line.startsWith('>') ? 'text-cyan-400' : ''}
                            ${line.startsWith('*') ? 'text-red-400' : ''}
                            ${line.includes('created') || line.includes('Entities') ? 'text-green-400' : ''}
                            ${line.includes('Unknown') ? 'text-orange-400' : ''}
                            ${line.includes('Did you mean') ? 'text-yellow-400' : ''}
                            opacity-90 hover:opacity-100 leading-tight text-[13px]
                        `}>
                            {line}
                        </div>
                    ))}
                </div>

                {/* Input Area with Suggestions */}
                <div className="relative">
                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div
                            ref={suggestionsRef}
                            className="absolute bottom-full left-0 right-0 mb-0 bg-[#252526] border border-gray-600 rounded-t-md shadow-xl max-h-48 overflow-y-auto z-30"
                        >
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={suggestion.command}
                                    className={`
                                        flex items-center justify-between px-3 py-1.5 cursor-pointer
                                        ${index === selectedSuggestionIndex
                                            ? 'bg-cyan-600 text-white'
                                            : 'hover:bg-gray-700'
                                        }
                                    `}
                                    onClick={() => {
                                        setInput(suggestion.command);
                                        executeCommand(suggestion.command);
                                    }}
                                    onMouseEnter={() => setSelectedSuggestionIndex(index)}
                                >
                                    <div className="flex items-center gap-2">
                                        {/* Category Icon */}
                                        <span className="text-xs opacity-60">
                                            {CATEGORY_ICONS[suggestion.category]}
                                        </span>
                                        {/* Command Name with Match Highlight */}
                                        <span className="font-medium">
                                            {suggestion.matchType === 'mid' ? (
                                                highlightMatch(suggestion.command, input.toUpperCase())
                                            ) : (
                                                suggestion.command
                                            )}
                                        </span>
                                        {/* Alias Badge */}
                                        {suggestion.alias && (
                                            <span className={`
                                                text-xs px-1.5 py-0.5 rounded
                                                ${index === selectedSuggestionIndex
                                                    ? 'bg-cyan-500 text-cyan-100'
                                                    : 'bg-gray-600 text-gray-300'
                                                }
                                            `}>
                                                {suggestion.alias}
                                            </span>
                                        )}
                                    </div>
                                    {/* Description */}
                                    <span className={`
                                        text-xs
                                        ${index === selectedSuggestionIndex
                                            ? 'text-cyan-200'
                                            : 'text-gray-500'
                                        }
                                    `}>
                                        {suggestion.description}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Input Form */}
                    <form
                        onSubmit={handleSubmit}
                        className="flex items-center px-3 py-2.5 bg-[#252526] border-t border-gray-700/50"
                    >
                        <span className="text-cyan-400/80 mr-2 select-none font-medium">
                            {formatPromptWithHighlights(prompt + ":")}
                        </span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 caret-cyan-400"
                            autoFocus
                            spellCheck={false}
                            autoComplete="off"
                            placeholder={activeCommand ? "" : "Type command or click to draw..."}
                        />
                        {/* Visual hint */}
                        {!activeCommand && !input && (
                            <span className="text-gray-500 text-xs ml-2 select-none hidden md:block">
                                ↑↓ History • Tab Complete
                            </span>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
});

// ============================================================================
// Helper: Highlight matching substring
// ============================================================================

function highlightMatch(text: string, query: string): React.ReactNode {
    const index = text.toUpperCase().indexOf(query);
    if (index === -1) return text;

    return (
        <>
            {text.slice(0, index)}
            <span className="text-cyan-400 font-bold">{text.slice(index, index + query.length)}</span>
            {text.slice(index + query.length)}
        </>
    );
}

CommandLine.displayName = 'CommandLine';
