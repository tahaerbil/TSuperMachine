import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { Search, X, ChevronUp, ChevronDown, Replace } from 'lucide-react';

interface SearchBarProps {
    editor: Editor;
    isOpen: boolean;
    onClose: () => void;
}

interface SearchResult {
    from: number;
    to: number;
    text: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ editor, isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [replaceQuery, setReplaceQuery] = useState('');
    const [showReplace, setShowReplace] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [caseSensitive, setCaseSensitive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Clear highlights function (defined first to be used in effects)
    const clearHighlights = useCallback(() => {
        // Clear any visual highlights if needed
    }, []);

    // Get document position helper
    const getDocumentPosition = useCallback((textIndex: number, length: number): { from: number; to: number } | null => {
        if (!editor) return null;

        const doc = editor.state.doc;
        let currentTextIndex = 0;
        let result: { from: number; to: number } | null = null;

        doc.descendants((node, pos) => {
            if (result) return false; // Already found

            if (node.isText && node.text) {
                const nodeText = node.text;
                const nodeEnd = currentTextIndex + nodeText.length;

                if (textIndex >= currentTextIndex && textIndex < nodeEnd) {
                    const offset = textIndex - currentTextIndex;
                    const from = pos + offset;
                    const to = Math.min(pos + offset + length, pos + nodeText.length);
                    result = { from, to };
                    return false;
                }

                currentTextIndex = nodeEnd;
            }
            return true;
        });

        return result;
    }, [editor]);

    // Find all matches function
    const findAllMatches = useCallback((query: string): SearchResult[] => {
        if (!editor || !query) return [];

        const text = editor.getText();
        const searchText = caseSensitive ? text : text.toLowerCase();
        const searchFor = caseSensitive ? query : query.toLowerCase();

        const matches: SearchResult[] = [];
        let pos = 0;
        let index = searchText.indexOf(searchFor, pos);

        while (index !== -1) {
            const docPos = getDocumentPosition(index, query.length);
            if (docPos) {
                matches.push({
                    from: docPos.from,
                    to: docPos.to,
                    text: text.substring(index, index + query.length)
                });
            }
            pos = index + 1;
            index = searchText.indexOf(searchFor, pos);
        }

        return matches;
    }, [editor, caseSensitive, getDocumentPosition]);

    // Highlight and scroll to result
    const highlightAndScrollTo = useCallback((result: SearchResult) => {
        if (!editor) return;

        editor
            .chain()
            .focus()
            .setTextSelection({ from: result.from, to: result.to })
            .scrollIntoView()
            .run();
    }, [editor]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isOpen]);

    // Perform search - called from event handlers, not effects
    const performSearch = useCallback((query: string) => {
        if (!query.trim()) {
            clearHighlights();
            setResults([]);
            setCurrentIndex(-1);
            return;
        }

        const searchResults = findAllMatches(query);
        setResults(searchResults);
        setCurrentIndex(searchResults.length > 0 ? 0 : -1);

        if (searchResults.length > 0) {
            highlightAndScrollTo(searchResults[0]);
        }
    }, [findAllMatches, highlightAndScrollTo, clearHighlights]);

    // Handle search input change
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setSearchQuery(newQuery);
        performSearch(newQuery);
    }, [performSearch]);

    // Handle case sensitivity toggle
    const handleCaseSensitiveChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setCaseSensitive(e.target.checked);
        // Re-run search with current query after state update
        setTimeout(() => performSearch(searchQuery), 0);
    }, [performSearch, searchQuery]);

    const goToNext = useCallback(() => {
        if (results.length === 0) return;
        const nextIndex = (currentIndex + 1) % results.length;
        setCurrentIndex(nextIndex);
        highlightAndScrollTo(results[nextIndex]);
    }, [results, currentIndex, highlightAndScrollTo]);

    const goToPrevious = useCallback(() => {
        if (results.length === 0) return;
        const prevIndex = (currentIndex - 1 + results.length) % results.length;
        setCurrentIndex(prevIndex);
        highlightAndScrollTo(results[prevIndex]);
    }, [results, currentIndex, highlightAndScrollTo]);

    const replaceOne = useCallback(() => {
        if (!editor || results.length === 0 || currentIndex < 0) return;

        const result = results[currentIndex];
        editor
            .chain()
            .focus()
            .setTextSelection({ from: result.from, to: result.to })
            .insertContent(replaceQuery)
            .run();

        // Re-search after replacement
        setTimeout(() => {
            const newResults = findAllMatches(searchQuery);
            setResults(newResults);
            if (newResults.length > 0) {
                const newIndex = Math.min(currentIndex, newResults.length - 1);
                setCurrentIndex(newIndex);
                highlightAndScrollTo(newResults[newIndex]);
            } else {
                setCurrentIndex(-1);
            }
        }, 50);
    }, [editor, results, currentIndex, replaceQuery, searchQuery, findAllMatches, highlightAndScrollTo]);

    const replaceAll = useCallback(() => {
        if (!editor || results.length === 0) return;

        // Replace all occurrences from end to start to avoid position shifts
        const sortedResults = [...results].sort((a, b) => b.from - a.from);

        editor.chain().focus();

        for (const result of sortedResults) {
            editor
                .chain()
                .setTextSelection({ from: result.from, to: result.to })
                .insertContent(replaceQuery)
                .run();
        }

        setResults([]);
        setCurrentIndex(-1);
    }, [editor, results, replaceQuery]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'Enter') {
            if (e.shiftKey) {
                goToPrevious();
            } else {
                goToNext();
            }
        } else if (e.key === 'F3') {
            e.preventDefault();
            if (e.shiftKey) {
                goToPrevious();
            } else {
                goToNext();
            }
        }
    }, [onClose, goToNext, goToPrevious]);

    if (!isOpen) return null;

    return (
        <div
            className="absolute top-2 right-2 z-20 rounded-lg shadow-xl border overflow-hidden"
            style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                width: '360px'
            }}
            onKeyDown={handleKeyDown}
        >
            {/* Search Row */}
            <div className="flex items-center gap-2 p-2">
                <Search size={16} style={{ color: 'var(--color-text)', opacity: 0.5 }} />
                <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Find in note..."
                    className="flex-1 bg-transparent border-none outline-none text-sm"
                    style={{ color: 'var(--color-text)' }}
                />
                <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                        backgroundColor: results.length > 0 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0,0,0,0.05)',
                        color: 'var(--color-text)'
                    }}
                >
                    {results.length > 0 ? `${currentIndex + 1}/${results.length}` : '0/0'}
                </span>
                <button
                    onClick={goToPrevious}
                    disabled={results.length === 0}
                    className="p-1 rounded hover:bg-black/5 disabled:opacity-30"
                    title="Previous (Shift+Enter)"
                >
                    <ChevronUp size={16} style={{ color: 'var(--color-text)' }} />
                </button>
                <button
                    onClick={goToNext}
                    disabled={results.length === 0}
                    className="p-1 rounded hover:bg-black/5 disabled:opacity-30"
                    title="Next (Enter)"
                >
                    <ChevronDown size={16} style={{ color: 'var(--color-text)' }} />
                </button>
                <button
                    onClick={() => setShowReplace(!showReplace)}
                    className={`p-1 rounded transition-colors ${showReplace ? 'bg-blue-500/10' : 'hover:bg-black/5'}`}
                    title="Toggle Replace"
                >
                    <Replace size={16} style={{ color: showReplace ? '#3b82f6' : 'var(--color-text)' }} />
                </button>
                <button
                    onClick={onClose}
                    className="p-1 rounded hover:bg-black/5"
                    title="Close (Esc)"
                >
                    <X size={16} style={{ color: 'var(--color-text)' }} />
                </button>
            </div>

            {/* Replace Row */}
            {showReplace && (
                <div
                    className="flex items-center gap-2 p-2 border-t"
                    style={{ borderColor: 'var(--color-border)' }}
                >
                    <Replace size={16} style={{ color: 'var(--color-text)', opacity: 0.5 }} />
                    <input
                        type="text"
                        value={replaceQuery}
                        onChange={e => setReplaceQuery(e.target.value)}
                        placeholder="Replace with..."
                        className="flex-1 bg-transparent border-none outline-none text-sm"
                        style={{ color: 'var(--color-text)' }}
                    />
                    <button
                        onClick={replaceOne}
                        disabled={results.length === 0}
                        className="px-2 py-1 text-xs rounded bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 disabled:opacity-30"
                    >
                        Replace
                    </button>
                    <button
                        onClick={replaceAll}
                        disabled={results.length === 0}
                        className="px-2 py-1 text-xs rounded bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 disabled:opacity-30"
                    >
                        All
                    </button>
                </div>
            )}

            {/* Options Row */}
            <div
                className="flex items-center gap-4 px-4 py-2 border-t text-xs"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', opacity: 0.7 }}
            >
                <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={caseSensitive}
                        onChange={handleCaseSensitiveChange}
                        className="w-3.5 h-3.5 rounded border accent-blue-500"
                    />
                    Case sensitive
                </label>
                <span className="flex-1" />
                <kbd className="px-1 py-0.5 rounded bg-black/5 font-mono">Ctrl+F</kbd>
            </div>
        </div>
    );
};
