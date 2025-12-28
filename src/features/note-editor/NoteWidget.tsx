import React, { useCallback } from 'react';
import { EditorContent } from '@tiptap/react';
import { useStore } from '../../store/store';
import { useTranslation } from 'react-i18next';
import { useNoteEditor } from './hooks/useNoteEditor';
import { Toolbar } from './components/Toolbar';
import { BubbleMenu } from './components/BubbleMenu';
import { exportToMarkdown, downloadAsFile } from './utils/export';
import { Download, FileText } from 'lucide-react';

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

    // Handle content updates
    const handleUpdate = useCallback((json: object) => {
        updateWidget(id, { data: { content: json } });
    }, [id, updateWidget]);

    // Initialize editor with custom hook
    const editor = useNoteEditor({
        initialContent,
        placeholder: t('app.widgets.note.placeholder') || 'Start writing... (type "/" for commands)',
        onUpdate: handleUpdate
    });

    // Stop propagation to prevent widget drag
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
    }, []);

    // Export handlers
    const handleExportMarkdown = useCallback(() => {
        if (!editor) return;
        const markdown = exportToMarkdown(editor);
        downloadAsFile(markdown, 'note.md', 'text/markdown');
    }, [editor]);

    const handleExportText = useCallback(() => {
        if (!editor) return;
        const text = editor.getText();
        downloadAsFile(text, 'note.txt', 'text/plain');
    }, [editor]);

    if (!editor) {
        return (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
                Loading editor...
            </div>
        );
    }

    return (
        <div
            className="w-full h-full flex flex-col overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface)' }}
            onMouseDown={handleMouseDown}
        >
            {/* Toolbar - Only show when maximized */}
            {isMaximized && (
                <div className="flex items-center justify-between border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <Toolbar editor={editor} />

                    {/* Export buttons */}
                    <div className="flex items-center gap-1 px-2">
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
                    </div>
                </div>
            )}

            {/* Bubble Menu - Always available */}
            <BubbleMenu editor={editor} />

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor} className="h-full" />
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
        </div>
    );
};
