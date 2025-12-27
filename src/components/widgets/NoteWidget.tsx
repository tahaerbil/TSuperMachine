import React, { useCallback } from 'react';
import { useStore } from '../../store/store';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Code,
    Highlighter,
    List,
    ListOrdered,
    CheckSquare,
    Quote,
    Heading1,
    Heading2,
    Heading3,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Link as LinkIcon,
    Minus,
    Undo,
    Redo,
    Type
} from 'lucide-react';

// Create lowlight instance
const lowlight = createLowlight(common);

interface NoteWidgetProps {
    id: string;
    initialContent?: string | object;
    isMaximized?: boolean;
}

// Toolbar button component
const ToolbarButton: React.FC<{
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
}> = ({ onClick, isActive, disabled, title, children }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`p-1.5 rounded transition-colors ${isActive
            ? 'bg-blue-500 text-white'
            : 'hover:bg-gray-200 text-gray-700'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        {children}
    </button>
);

// Toolbar divider
const ToolbarDivider: React.FC = () => (
    <div className="w-px h-6 bg-gray-300 mx-1" />
);

export const NoteWidget: React.FC<NoteWidgetProps> = ({ id, initialContent = '', isMaximized = false }) => {
    const { updateWidget } = useStore();
    const { t } = useTranslation();

    // Parse initial content
    const getInitialContent = () => {
        if (typeof initialContent === 'object' && initialContent !== null) {
            return initialContent;
        }
        if (typeof initialContent === 'string' && initialContent.trim()) {
            // Convert plain text to TipTap format
            return {
                type: 'doc',
                content: initialContent.split('\n').map(line => ({
                    type: 'paragraph',
                    content: line ? [{ type: 'text', text: line }] : []
                }))
            };
        }
        return undefined;
    };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false, // We'll use CodeBlockLowlight instead
            }),
            Placeholder.configure({
                placeholder: t('app.widgets.note.placeholder') || 'Start writing...',
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Highlight.configure({
                multicolor: true,
            }),
            Typography,
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Link.configure({
                openOnClick: true,
                HTMLAttributes: {
                    class: 'text-blue-500 underline cursor-pointer',
                },
            }),
            CodeBlockLowlight.configure({
                lowlight,
            }),
        ],
        content: getInitialContent(),
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-full p-4',
            },
        },
        onUpdate: ({ editor }) => {
            // Save content as JSON
            const json = editor.getJSON();
            updateWidget(id, { data: { content: json } });
        },
    });

    // Stop propagation to prevent widget drag
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
    }, []);

    // Add link handler
    const setLink = useCallback(() => {
        if (!editor) return;

        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    if (!editor) {
        return <div className="w-full h-full flex items-center justify-center text-gray-400">Loading editor...</div>;
    }

    return (
        <div
            className="w-full h-full flex flex-col overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface)' }}
            onMouseDown={handleMouseDown}
        >
            {/* Toolbar - Only show when maximized */}
            {isMaximized && (
                <div
                    className="flex items-center gap-0.5 p-2 border-b flex-wrap"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                >
                    {/* Undo/Redo */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        title="Undo"
                    >
                        <Undo size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        title="Redo"
                    >
                        <Redo size={16} />
                    </ToolbarButton>

                    <ToolbarDivider />

                    {/* Text formatting */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        isActive={editor.isActive('bold')}
                        title="Bold (Ctrl+B)"
                    >
                        <Bold size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        isActive={editor.isActive('italic')}
                        title="Italic (Ctrl+I)"
                    >
                        <Italic size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        isActive={editor.isActive('underline')}
                        title="Underline (Ctrl+U)"
                    >
                        <UnderlineIcon size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        isActive={editor.isActive('strike')}
                        title="Strikethrough"
                    >
                        <Strikethrough size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                        isActive={editor.isActive('highlight')}
                        title="Highlight"
                    >
                        <Highlighter size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleCode().run()}
                        isActive={editor.isActive('code')}
                        title="Inline Code"
                    >
                        <Code size={16} />
                    </ToolbarButton>

                    <ToolbarDivider />

                    {/* Headings */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().setParagraph().run()}
                        isActive={editor.isActive('paragraph')}
                        title="Paragraph"
                    >
                        <Type size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        isActive={editor.isActive('heading', { level: 1 })}
                        title="Heading 1"
                    >
                        <Heading1 size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        isActive={editor.isActive('heading', { level: 2 })}
                        title="Heading 2"
                    >
                        <Heading2 size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        isActive={editor.isActive('heading', { level: 3 })}
                        title="Heading 3"
                    >
                        <Heading3 size={16} />
                    </ToolbarButton>

                    <ToolbarDivider />

                    {/* Lists */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        isActive={editor.isActive('bulletList')}
                        title="Bullet List"
                    >
                        <List size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        isActive={editor.isActive('orderedList')}
                        title="Numbered List"
                    >
                        <ListOrdered size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleTaskList().run()}
                        isActive={editor.isActive('taskList')}
                        title="Task List"
                    >
                        <CheckSquare size={16} />
                    </ToolbarButton>

                    <ToolbarDivider />

                    {/* Block elements */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        isActive={editor.isActive('blockquote')}
                        title="Quote"
                    >
                        <Quote size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        isActive={editor.isActive('codeBlock')}
                        title="Code Block"
                    >
                        <Code size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                        title="Horizontal Rule"
                    >
                        <Minus size={16} />
                    </ToolbarButton>

                    <ToolbarDivider />

                    {/* Alignment */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        isActive={editor.isActive({ textAlign: 'left' })}
                        title="Align Left"
                    >
                        <AlignLeft size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        isActive={editor.isActive({ textAlign: 'center' })}
                        title="Align Center"
                    >
                        <AlignCenter size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        isActive={editor.isActive({ textAlign: 'right' })}
                        title="Align Right"
                    >
                        <AlignRight size={16} />
                    </ToolbarButton>

                    <ToolbarDivider />

                    {/* Link */}
                    <ToolbarButton
                        onClick={setLink}
                        isActive={editor.isActive('link')}
                        title="Add Link"
                    >
                        <LinkIcon size={16} />
                    </ToolbarButton>
                </div>
            )}

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto">
                <EditorContent
                    editor={editor}
                    className="h-full"
                />
            </div>


            {/* Styles for TipTap editor */}
            <style>{`
                .ProseMirror {
                    min-height: 100%;
                    padding: 1rem;
                    color: var(--color-text);
                }
                
                .ProseMirror:focus {
                    outline: none;
                }
                
                .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: var(--color-text-secondary);
                    opacity: 0.5;
                    pointer-events: none;
                    height: 0;
                }
                
                .ProseMirror h1 {
                    font-size: 1.75rem;
                    font-weight: 700;
                    line-height: 1.2;
                    margin: 1rem 0 0.5rem 0;
                }
                
                .ProseMirror h2 {
                    font-size: 1.4rem;
                    font-weight: 600;
                    line-height: 1.3;
                    margin: 0.8rem 0 0.4rem 0;
                }
                
                .ProseMirror h3 {
                    font-size: 1.15rem;
                    font-weight: 600;
                    line-height: 1.4;
                    margin: 0.6rem 0 0.3rem 0;
                }
                
                .ProseMirror p {
                    margin: 0.5rem 0;
                    line-height: 1.6;
                }
                
                .ProseMirror ul,
                .ProseMirror ol {
                    padding-left: 1.5rem;
                    margin: 0.5rem 0;
                }
                
                .ProseMirror li {
                    margin: 0.25rem 0;
                }
                
                .ProseMirror ul[data-type="taskList"] {
                    list-style: none;
                    padding-left: 0;
                }
                
                .ProseMirror ul[data-type="taskList"] li {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5rem;
                }
                
                .ProseMirror ul[data-type="taskList"] li > label {
                    flex: 0 0 auto;
                    margin-top: 0.25rem;
                }
                
                .ProseMirror ul[data-type="taskList"] li > label input[type="checkbox"] {
                    cursor: pointer;
                    width: 1rem;
                    height: 1rem;
                    accent-color: #3b82f6;
                }
                
                .ProseMirror ul[data-type="taskList"] li > div {
                    flex: 1 1 auto;
                }
                
                .ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div {
                    text-decoration: line-through;
                    opacity: 0.6;
                }
                
                .ProseMirror blockquote {
                    border-left: 3px solid #3b82f6;
                    padding-left: 1rem;
                    margin: 0.5rem 0;
                    color: var(--color-text-secondary);
                    font-style: italic;
                }
                
                .ProseMirror code {
                    background: rgba(0, 0, 0, 0.1);
                    padding: 0.15rem 0.3rem;
                    border-radius: 0.25rem;
                    font-family: 'Fira Code', 'Monaco', monospace;
                    font-size: 0.9em;
                }
                
                .ProseMirror pre {
                    background: #1e1e1e;
                    color: #d4d4d4;
                    padding: 1rem;
                    border-radius: 0.5rem;
                    margin: 0.5rem 0;
                    overflow-x: auto;
                    font-family: 'Fira Code', 'Monaco', monospace;
                    font-size: 0.875rem;
                }
                
                .ProseMirror pre code {
                    background: none;
                    padding: 0;
                    color: inherit;
                }
                
                .ProseMirror hr {
                    border: none;
                    border-top: 2px solid var(--color-border);
                    margin: 1rem 0;
                }
                
                .ProseMirror mark {
                    background-color: #fef08a;
                    padding: 0.1rem 0.2rem;
                    border-radius: 0.15rem;
                }
                
                .ProseMirror a {
                    color: #3b82f6;
                    text-decoration: underline;
                    cursor: pointer;
                }
                
                .ProseMirror a:hover {
                    color: #2563eb;
                }
            `}</style>
        </div>
    );
};
