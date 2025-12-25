import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../store/store';
import { useTranslation } from 'react-i18next';
import { GripVertical } from 'lucide-react';

interface NoteWidgetProps {
    id: string;
    initialContent?: string;
}

export const NoteWidget: React.FC<NoteWidgetProps> = ({ id, initialContent = '' }) => {
    const [content, setContent] = useState(initialContent);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [linePositions, setLinePositions] = useState<{ top: number; height: number }[]>([]);
    const [hoveredLine, setHoveredLine] = useState<number | null>(null);
    const [draggedText, setDraggedText] = useState<string>('');

    const { updateWidget } = useStore();
    const { t } = useTranslation();
    const editorRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Debounce save to store
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            updateWidget(id, { data: { content } });
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [content, id, updateWidget]);

    // Calculate line positions for drag handles
    const updateLinePositions = useCallback(() => {
        if (!editorRef.current) return;

        const lines = editorRef.current.querySelectorAll('.note-line');
        const positions: { top: number; height: number }[] = [];

        lines.forEach((line) => {
            const rect = line.getBoundingClientRect();
            const containerRect = editorRef.current!.getBoundingClientRect();
            positions.push({
                top: rect.top - containerRect.top,
                height: rect.height
            });
        });

        setLinePositions(positions);
    }, []);

    // Update positions on content change
    useEffect(() => {
        // Small delay to ensure DOM is updated
        const timeoutId = setTimeout(updateLinePositions, 50);
        return () => clearTimeout(timeoutId);
    }, [content, updateLinePositions]);

    // Also update on window resize
    useEffect(() => {
        window.addEventListener('resize', updateLinePositions);
        return () => window.removeEventListener('resize', updateLinePositions);
    }, [updateLinePositions]);

    // Initialize content with line divs
    useEffect(() => {
        if (editorRef.current && !editorRef.current.innerHTML) {
            const lines = content ? content.split('\n') : [''];
            editorRef.current.innerHTML = lines
                .map(line => `<div class="note-line">${line || '<br>'}</div>`)
                .join('');
            // Schedule position update after initial render
            setTimeout(updateLinePositions, 50);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle content changes
    const handleInput = useCallback(() => {
        if (!editorRef.current) return;

        // Ensure all content is wrapped in note-line divs
        const children = Array.from(editorRef.current.childNodes);
        let needsNormalization = false;

        children.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
                needsNormalization = true;
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                const el = child as HTMLElement;
                if (!el.classList.contains('note-line')) {
                    needsNormalization = true;
                }
            }
        });

        if (needsNormalization) {
            // Normalize content
            const html = editorRef.current.innerHTML;
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            const extractText = (node: Node): string => {
                if (node.nodeType === Node.TEXT_NODE) {
                    return node.textContent || '';
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    const el = node as HTMLElement;
                    if (el.tagName === 'BR') {
                        return '\n';
                    } else if (el.tagName === 'DIV' || el.tagName === 'P') {
                        return Array.from(el.childNodes).map(extractText).join('') + '\n';
                    }
                    return Array.from(el.childNodes).map(extractText).join('');
                }
                return '';
            };

            const fullText = Array.from(tempDiv.childNodes).map(extractText).join('').replace(/\n+$/, '');
            const lines = fullText.split('\n');

            editorRef.current.innerHTML = lines
                .map(line => `<div class="note-line">${line || '<br>'}</div>`)
                .join('');
        }

        // Extract text content
        const lines = editorRef.current.querySelectorAll('.note-line');
        const textLines: string[] = [];
        lines.forEach(line => {
            const text = line.textContent || '';
            textLines.push(text);
        });

        setContent(textLines.join('\n'));
        updateLinePositions();
    }, [updateLinePositions]);

    // Handle mouse move to detect which line is hovered
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDragging || !containerRef.current || !editorRef.current) return;

        const editorRect = editorRef.current.getBoundingClientRect();
        const relativeY = e.clientY - editorRect.top;

        let foundLine = null;
        for (let i = 0; i < linePositions.length; i++) {
            const pos = linePositions[i];
            if (relativeY >= pos.top && relativeY < pos.top + pos.height) {
                foundLine = i;
                break;
            }
        }

        setHoveredLine(foundLine);
    }, [isDragging, linePositions]);

    // Drag handle mouse down - start drag
    const handleDragStart = useCallback((e: React.MouseEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();

        // Capture the text of the dragged line
        const lines = editorRef.current?.querySelectorAll('.note-line');
        if (lines && lines[index]) {
            setDraggedText(lines[index].textContent || '');
        }

        setDraggedIndex(index);
        setIsDragging(true);
    }, []);

    // Handle mouse move during drag
    useEffect(() => {
        if (!isDragging || draggedIndex === null) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!editorRef.current) return;

            const editorRect = editorRef.current.getBoundingClientRect();
            const relativeY = e.clientY - editorRect.top;

            // Find which line we're over
            let targetIndex = linePositions.length - 1;
            for (let i = 0; i < linePositions.length; i++) {
                const pos = linePositions[i];
                const midPoint = pos.top + pos.height / 2;
                if (relativeY < midPoint) {
                    targetIndex = i;
                    break;
                }
            }

            setDragOverIndex(targetIndex);
        };

        const handleMouseUp = () => {
            if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex && editorRef.current) {
                // Reorder lines in DOM
                const lines = Array.from(editorRef.current.querySelectorAll('.note-line'));
                const draggedElement = lines[draggedIndex];

                if (draggedElement) {
                    // Remove dragged element
                    draggedElement.remove();

                    // Get updated lines list
                    const remainingLines = Array.from(editorRef.current.querySelectorAll('.note-line'));

                    // Insert at new position
                    const actualInsertIndex = dragOverIndex > draggedIndex ? dragOverIndex - 1 : dragOverIndex;

                    if (actualInsertIndex >= remainingLines.length) {
                        editorRef.current.appendChild(draggedElement);
                    } else {
                        editorRef.current.insertBefore(draggedElement, remainingLines[actualInsertIndex]);
                    }

                    // Update content from DOM
                    const updatedLines = editorRef.current.querySelectorAll('.note-line');
                    const textLines: string[] = [];
                    updatedLines.forEach(line => {
                        textLines.push(line.textContent || '');
                    });
                    setContent(textLines.join('\n'));
                    updateLinePositions();
                }
            }

            setDraggedIndex(null);
            setDragOverIndex(null);
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, draggedIndex, dragOverIndex, linePositions, updateLinePositions]);

    // Handle paste to ensure proper formatting
    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    }, []);

    // Handle key down for special keys
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            // Insert new line div
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;

            const range = selection.getRangeAt(0);

            // Find current line
            let currentLine = range.startContainer as Node;
            while (currentLine && currentLine.parentNode !== editorRef.current) {
                currentLine = currentLine.parentNode as Node;
            }

            if (currentLine && currentLine.nodeType === Node.ELEMENT_NODE) {
                const lineEl = currentLine as HTMLElement;
                const newLine = document.createElement('div');
                newLine.className = 'note-line';

                // Split content at cursor
                const cursorOffset = range.startOffset;
                const textContent = lineEl.textContent || '';
                const beforeCursor = textContent.substring(0, cursorOffset);
                const afterCursor = textContent.substring(cursorOffset);

                lineEl.innerHTML = beforeCursor || '<br>';
                newLine.innerHTML = afterCursor || '<br>';

                // Insert new line after current
                if (lineEl.nextSibling) {
                    editorRef.current?.insertBefore(newLine, lineEl.nextSibling);
                } else {
                    editorRef.current?.appendChild(newLine);
                }

                // Move cursor to new line
                const newRange = document.createRange();
                newRange.setStart(newLine, 0);
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);

                handleInput();
            }
        }
    }, [handleInput]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full flex flex-col overflow-hidden relative"
            style={{ backgroundColor: 'var(--color-surface)' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredLine(null)}
        >
            {/* Drag Handles Overlay */}
            <div
                className="absolute left-0 top-0 bottom-0 w-6 pointer-events-none pt-2"
                style={{ zIndex: 10 }}
            >
                {linePositions.map((pos, index) => {
                    const isBeingDragged = draggedIndex === index;
                    const isHovered = hoveredLine === index || isBeingDragged;

                    return (
                        <div
                            key={index}
                            className="absolute pointer-events-auto cursor-grab active:cursor-grabbing flex items-center justify-center transition-opacity duration-150"
                            style={{
                                top: `${pos.top + (pos.height / 2) - 10}px`,
                                left: '4px',
                                width: '20px',
                                height: '20px',
                                opacity: isHovered ? 0.8 : 0,
                                color: 'var(--color-text-secondary)',
                            }}
                            onMouseDown={(e) => handleDragStart(e, index)}
                        >
                            <GripVertical size={14} />
                        </div>
                    );
                })}
            </div>

            {/* Ghost preview of dragged line at target position */}
            {isDragging && dragOverIndex !== null && draggedIndex !== null && dragOverIndex !== draggedIndex && (
                <div
                    className="absolute left-7 right-2 pointer-events-none font-sans text-sm"
                    style={{
                        top: `${(linePositions[dragOverIndex]?.top || 0) + 8 + (draggedIndex > dragOverIndex ? 0 : linePositions[dragOverIndex]?.height || 0)}px`,
                        opacity: 0.4,
                        color: 'var(--color-text)',
                        zIndex: 20,
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap'
                    }}
                >
                    {draggedText}
                </div>
            )}

            {/* Editable Content Area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="flex-1 overflow-y-auto p-2 pl-7 outline-none font-sans text-sm"
                style={{
                    color: 'var(--color-text)',
                    userSelect: isDragging ? 'none' : 'auto',
                    minHeight: '100%'
                }}
                onInput={handleInput}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                onMouseDown={(e) => e.stopPropagation()}
                data-placeholder={t('app.widgets.note.placeholder')}
            />

            {/* Placeholder Styling */}
            <style>{`
                .note-line {
                    min-height: 1.5em;
                    line-height: 1.5;
                }
                [contenteditable]:empty::before {
                    content: attr(data-placeholder);
                    color: var(--color-text-secondary);
                    opacity: 0.6;
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
};
