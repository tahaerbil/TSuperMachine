import React, { useCallback, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { ToolbarButton } from './ToolbarButton';
import { ToolbarDivider } from './ToolbarDivider';
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
    ListTodo,
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
    Type,
    Image,
    Table,
    TableProperties,
    Trash2,
    Plus,
    ArrowUp,
    ArrowDown
} from 'lucide-react';

interface ToolbarProps {
    editor: Editor;
}

export const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Add link handler
    const setLink = useCallback(() => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    // Add image handler
    const addImage = useCallback(() => {
        const url = window.prompt('Image URL');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    }, [editor]);

    // Handle image upload from file
    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result as string;
                editor.chain().focus().setImage({ src: base64 }).run();
            };
            reader.readAsDataURL(file);
        }
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [editor]);

    // Insert table
    const insertTable = useCallback(() => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }, [editor]);

    return (
        <div
            className="flex items-center gap-0.5 p-2 border-b flex-wrap"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            role="toolbar"
            aria-label="Text formatting"
        >
            {/* Undo/Redo */}
            <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                title="Undo (Ctrl+Z)"
            >
                <Undo size={16} />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                title="Redo (Ctrl+Y)"
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
                onClick={() => editor.chain().focus().insertTodoBlock().run()}
                isActive={editor.isActive('todoBlock')}
                title="Todo Block"
            >
                <ListTodo size={16} />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                title="Horizontal Rule"
            >
                <Minus size={16} />
            </ToolbarButton>

            <ToolbarDivider />

            {/* Image */}
            <ToolbarButton
                onClick={() => fileInputRef.current?.click()}
                title="Upload Image"
            >
                <Image size={16} />
            </ToolbarButton>
            <ToolbarButton
                onClick={addImage}
                title="Image from URL"
            >
                <LinkIcon size={16} />
            </ToolbarButton>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
            />

            {/* Table */}
            <ToolbarButton
                onClick={insertTable}
                isActive={editor.isActive('table')}
                title="Insert Table (3x3)"
            >
                <Table size={16} />
            </ToolbarButton>

            {/* Table controls - only show when inside a table */}
            {editor.isActive('table') && (
                <>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().addColumnAfter().run()}
                        title="Add Column"
                    >
                        <Plus size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().addRowAfter().run()}
                        title="Add Row"
                    >
                        <ArrowDown size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().deleteColumn().run()}
                        title="Delete Column"
                    >
                        <TableProperties size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().deleteRow().run()}
                        title="Delete Row"
                    >
                        <ArrowUp size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().deleteTable().run()}
                        title="Delete Table"
                    >
                        <Trash2 size={16} />
                    </ToolbarButton>
                </>
            )}

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
    );
};
