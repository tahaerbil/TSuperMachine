import React, { useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Code,
    Highlighter,
    Link
} from 'lucide-react';

interface BubbleMenuProps {
    editor: Editor;
}

/**
 * Simple Bubble Menu component - appears on text selection
 * Uses a simpler approach without TipTap's BubbleMenu for compatibility
 */
export const BubbleMenu: React.FC<BubbleMenuProps> = ({ editor }) => {
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

    // Check if there's a text selection
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;

    if (!hasSelection) {
        return null;
    }

    // Get selection coordinates for positioning
    const { view } = editor;
    const { node: domNode } = view.domAtPos(from);
    const rect = (domNode as Element)?.getBoundingClientRect?.();

    if (!rect) {
        return null;
    }

    return (
        <div
            className="bubble-menu"
            style={{
                position: 'fixed',
                top: rect.top - 45,
                left: rect.left,
                zIndex: 1000,
            }}
        >
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'is-active' : ''}
                title="Bold"
            >
                <Bold size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'is-active' : ''}
                title="Italic"
            >
                <Italic size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={editor.isActive('underline') ? 'is-active' : ''}
                title="Underline"
            >
                <Underline size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={editor.isActive('strike') ? 'is-active' : ''}
                title="Strikethrough"
            >
                <Strikethrough size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={editor.isActive('code') ? 'is-active' : ''}
                title="Code"
            >
                <Code size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                className={editor.isActive('highlight') ? 'is-active' : ''}
                title="Highlight"
            >
                <Highlighter size={16} />
            </button>
            <button
                onClick={setLink}
                className={editor.isActive('link') ? 'is-active' : ''}
                title="Link"
            >
                <Link size={16} />
            </button>
        </div>
    );
};
