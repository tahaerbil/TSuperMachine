import React, { useCallback, useRef, useState, useEffect } from 'react';
import { EditorContent } from '@tiptap/react';
import { useStore, getOutgoingConnections } from '../../store/store';
import { useTranslation } from 'react-i18next';
import { useNoteEditor } from './hooks/useNoteEditor';
import { Toolbar } from './components/Toolbar';
import { BubbleMenu } from './components/BubbleMenu';
import { TemplatePicker } from './components/TemplatePicker';
import { SearchBar } from './components/SearchBar';
import { exportToMarkdown, exportToPDF, downloadAsFile } from './utils/export';
import { Download, FileText, FileType, Search, LayoutTemplate } from 'lucide-react';
import { eventBus } from '../../core/services/automation';
import type { AutomationEvent, TriggerEvent } from '../../core/services/automation';
import type { NoteTemplate } from './templates';

// Import editor styles
import './styles/editor.css';

interface NoteWidgetProps {
    id: string;
    initialContent?: string | object;
    isMaximized?: boolean;
}

export const NoteWidget: React.FC<NoteWidgetProps> = ({
    id,
    initialContent = '',
    isMaximized = false
}) => {
    const { updateWidget } = useStore();
    const { t } = useTranslation();

    // UI State
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);
    const [showSearchBar, setShowSearchBar] = useState(false);

    // Debounce ref for onChange events
    const changeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Emit automation event to connected widgets
    const emitAutomationEvent = useCallback((type: TriggerEvent, payload: unknown) => {
        const connections = getOutgoingConnections(id);
        if (connections.length === 0) return;

        const event: AutomationEvent = {
            type,
            sourceWidgetId: id,
            sourceWidgetType: 'NOTE',
            timestamp: new Date().toISOString(),
            payload
        };

        // Send to all active connections (PDF_EXPORT accepts all event types)
        const targetIds = connections
            .filter(c => c.isActive)
            .map(c => c.targetWidgetId);

        if (targetIds.length > 0) {
            console.log('[NoteWidget] Emitting event:', type, 'to', targetIds.length, 'targets');
            eventBus.emit(event, targetIds);
        }
    }, [id]);

    // Handle content updates
    const handleUpdate = useCallback((json: object) => {
        updateWidget(id, { data: { content: json } });

        // Debounced onChange emission (to avoid spamming on every keystroke)
        if (changeDebounceRef.current) {
            clearTimeout(changeDebounceRef.current);
        }
        changeDebounceRef.current = setTimeout(() => {
            emitAutomationEvent('onChange', {
                content: json,
                wordCount: 0 // Will be calculated by receiver if needed
            });
        }, 1000); // 1 second debounce
    }, [id, updateWidget, emitAutomationEvent]);

    // Initialize editor with custom hook
    const editor = useNoteEditor({
        initialContent,
        placeholder: t('app.widgets.note.placeholder') || 'Start writing... (type "/" for commands)',
        onUpdate: handleUpdate
    });

    // Task progress tracking
    const [taskProgress, setTaskProgress] = useState({ total: 0, completed: 0 });

    // Calculate task progress from editor content
    useEffect(() => {
        if (!editor) return;

        const calculateProgress = () => {
            const json = editor.getJSON();
            let total = 0;
            let completed = 0;

            const traverse = (node: { type?: string; attrs?: { checked?: boolean }; content?: unknown[] }) => {
                if (node.type === 'taskItem') {
                    total++;
                    if (node.attrs?.checked) {
                        completed++;
                    }
                }
                if (node.content) {
                    node.content.forEach((child) => traverse(child as typeof node));
                }
            };

            if (json.content) {
                json.content.forEach((node) => traverse(node as Parameters<typeof traverse>[0]));
            }

            setTaskProgress({ total, completed });
        };

        // Calculate on mount and on every update
        calculateProgress();
        editor.on('update', calculateProgress);

        return () => {
            editor.off('update', calculateProgress);
        };
    }, [editor]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+F for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                setShowSearchBar(true);
            }
            // Escape to close search
            if (e.key === 'Escape' && showSearchBar) {
                setShowSearchBar(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showSearchBar]);

    // Stop propagation to prevent widget drag
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
    }, []);

    // Template selection handler
    const handleSelectTemplate = useCallback((template: NoteTemplate) => {
        if (!editor) return;

        // Set the editor content to the template
        editor.commands.setContent(template.content);

        // Update store
        updateWidget(id, { data: { content: template.content } });
    }, [editor, id, updateWidget]);

    // Export handlers
    const handleExportMarkdown = useCallback(() => {
        if (!editor) return;
        const markdown = exportToMarkdown(editor);
        downloadAsFile(markdown, 'note.md', 'text/markdown');

        // Emit onSave event with markdown content
        emitAutomationEvent('onSave', {
            format: 'markdown',
            content: markdown,
            filename: 'note.md'
        });
    }, [editor, emitAutomationEvent]);

    const handleExportText = useCallback(() => {
        if (!editor) return;
        const text = editor.getText();
        downloadAsFile(text, 'note.txt', 'text/plain');

        // Emit onSave event with text content
        emitAutomationEvent('onSave', {
            format: 'text',
            content: text,
            filename: 'note.txt'
        });
    }, [editor, emitAutomationEvent]);

    // PDF Export handler
    const handleExportPDF = useCallback(async () => {
        if (!editor) return;
        await exportToPDF(editor, 'note.pdf', {
            title: 'Note Export',
            author: 'TSuperMachine'
        });

        // Emit onSave event
        emitAutomationEvent('onSave', {
            format: 'pdf',
            filename: 'note.pdf'
        });
    }, [editor, emitAutomationEvent]);

    if (!editor) {
        return (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
                Loading editor...
            </div>
        );
    }

    return (
        <div
            className="w-full h-full flex flex-col overflow-hidden relative"
            style={{ backgroundColor: 'var(--color-surface)' }}
            onMouseDown={handleMouseDown}
        >
            {/* Toolbar - Only show when maximized */}
            {isMaximized && (
                <div className="flex items-center justify-between border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <Toolbar editor={editor} />

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 px-2">
                        {/* Task Progress - Only show when there are tasks */}
                        {taskProgress.total > 0 && (
                            <div
                                className="flex items-center gap-2 px-3 py-1 rounded-full mr-2"
                                style={{ backgroundColor: 'var(--color-bg-secondary, rgba(0,0,0,0.05))' }}
                                title={`${taskProgress.completed} of ${taskProgress.total} tasks completed`}
                            >
                                <div
                                    className="w-24 h-2 rounded-full overflow-hidden"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
                                >
                                    <div
                                        className="h-full rounded-full transition-all duration-300"
                                        style={{
                                            width: `${(taskProgress.completed / taskProgress.total) * 100}%`,
                                            backgroundColor: taskProgress.completed === taskProgress.total
                                                ? '#22c55e' // Green when complete
                                                : '#3b82f6' // Blue otherwise
                                        }}
                                    />
                                </div>
                                <span
                                    className="text-xs font-medium"
                                    style={{
                                        color: taskProgress.completed === taskProgress.total
                                            ? '#22c55e'
                                            : 'var(--color-text)'
                                    }}
                                >
                                    {taskProgress.completed}/{taskProgress.total}
                                </span>
                            </div>
                        )}

                        {/* Template button */}
                        <button
                            onClick={() => setShowTemplatePicker(true)}
                            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition-colors font-medium"
                            title="Choose Template"
                        >
                            <LayoutTemplate size={14} />
                            <span>Template</span>
                        </button>

                        {/* Search button */}
                        <button
                            onClick={() => setShowSearchBar(true)}
                            className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-gray-200 transition-colors"
                            title="Search (Ctrl+F)"
                        >
                            <Search size={14} />
                        </button>

                        {/* Divider */}
                        <div className="w-px h-4 bg-gray-300 mx-1" />

                        {/* Export buttons */}
                        <button
                            onClick={handleExportMarkdown}
                            className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-gray-200 transition-colors"
                            title="Export as Markdown"
                        >
                            <Download size={14} />
                            <span>MD</span>
                        </button>
                        <button
                            onClick={handleExportText}
                            className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-gray-200 transition-colors"
                            title="Export as Text"
                        >
                            <FileText size={14} />
                            <span>TXT</span>
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors font-medium"
                            title="Export as PDF"
                        >
                            <FileType size={14} />
                            <span>PDF</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Bubble Menu - Always available */}
            <BubbleMenu editor={editor} />

            {/* Search Bar - Floating */}
            {editor && (
                <SearchBar
                    editor={editor}
                    isOpen={showSearchBar}
                    onClose={() => setShowSearchBar(false)}
                />
            )}

            {/* Editor Content */}
            <div
                className={`flex-1 overflow-y-auto note-paper-container ${isMaximized ? 'flex justify-center items-start py-8 px-4' : ''}`}
                style={isMaximized ? {
                    backgroundColor: 'var(--color-bg-secondary, rgba(0,0,0,0.02))'
                } : {}}
            >
                <div
                    className={`${isMaximized ? 'note-paper' : 'h-full'}`}
                    style={isMaximized ? {
                        // A4 ratio: 1:1.414 - sized to fit most screens
                        width: 'min(600px, 90vw)',
                        minHeight: 'min(849px, calc(90vw * 1.414))', // 600 * 1.414 = 849
                        backgroundColor: 'var(--color-surface)',
                        boxShadow: '0 4px 40px rgba(0, 0, 0, 0.12)',
                        borderRadius: '12px',
                        border: '1px solid var(--color-border)',
                        marginBottom: '2rem',
                    } : {}}
                >
                    <EditorContent editor={editor} className="h-full" />
                </div>
            </div>

            {/* Word count footer - Only show when maximized */}
            {isMaximized && (
                <div
                    className="px-4 py-1 text-xs border-t flex justify-between"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', opacity: 0.6 }}
                >
                    <span>
                        {editor.storage.characterCount?.words?.() || 0} words
                    </span>
                    <span>
                        {editor.storage.characterCount?.characters?.() || editor.getText().length} characters
                    </span>
                </div>
            )}

            {/* Template Picker Modal */}
            <TemplatePicker
                isOpen={showTemplatePicker}
                onClose={() => setShowTemplatePicker(false)}
                onSelectTemplate={handleSelectTemplate}
            />
        </div>
    );
};
