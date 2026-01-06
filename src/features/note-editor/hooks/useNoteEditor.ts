import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { SlashCommands } from '../extensions/slashCommands';
import { ProgressBar } from '../extensions/progressBar.tsx';
import { TodoBlock } from '../extensions/todoBlock.tsx';

// Create lowlight instance for syntax highlighting
const lowlight = createLowlight(common);

interface UseNoteEditorOptions {
    initialContent?: string | object;
    placeholder?: string;
    onUpdate?: (json: object) => void;
}

/**
 * Custom hook for TipTap editor configuration
 * Encapsulates all editor extensions and settings
 */
export const useNoteEditor = ({
    initialContent,
    placeholder = 'Start writing... (type "/" for commands)',
    onUpdate
}: UseNoteEditorOptions) => {
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
                codeBlock: false, // We use CodeBlockLowlight instead
            }),
            Placeholder.configure({
                placeholder,
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
            // Image support
            Image.configure({
                inline: false,
                allowBase64: true,
                HTMLAttributes: {
                    class: 'max-w-full h-auto rounded-lg my-4',
                },
            }),
            // Table support
            Table.configure({
                resizable: true,
                HTMLAttributes: {
                    class: 'border-collapse table-auto w-full my-4',
                },
            }),
            TableRow,
            TableHeader.configure({
                HTMLAttributes: {
                    class: 'border border-gray-300 bg-gray-100 px-4 py-2 text-left font-semibold',
                },
            }),
            TableCell.configure({
                HTMLAttributes: {
                    class: 'border border-gray-300 px-4 py-2',
                },
            }),
            CodeBlockLowlight.configure({
                lowlight,
            }),
            // Slash Commands
            SlashCommands,
            // Progress Bar for task tracking
            ProgressBar,
            // Todo Block for self-contained todo lists
            TodoBlock,
        ],
        content: getInitialContent(),
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-full p-4',
            },
            // Handle image drop
            handleDrop(view, event, _slice, moved) {
                if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
                    const file = event.dataTransfer.files[0];
                    if (file.type.startsWith('image/')) {
                        event.preventDefault();

                        const reader = new FileReader();
                        reader.onload = () => {
                            const base64 = reader.result as string;
                            const { schema } = view.state;
                            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });

                            if (coordinates) {
                                const imageNode = schema.nodes.image.create({ src: base64 });
                                const transaction = view.state.tr.insert(coordinates.pos, imageNode);
                                view.dispatch(transaction);
                            }
                        };
                        reader.readAsDataURL(file);
                        return true;
                    }
                }
                return false;
            },
            // Handle image paste
            handlePaste(view, event) {
                const items = event.clipboardData?.items;
                if (!items) return false;

                for (const item of items) {
                    if (item.type.startsWith('image/')) {
                        event.preventDefault();

                        const file = item.getAsFile();
                        if (!file) continue;

                        const reader = new FileReader();
                        reader.onload = () => {
                            const base64 = reader.result as string;
                            const { schema } = view.state;
                            const imageNode = schema.nodes.image.create({ src: base64 });
                            const transaction = view.state.tr.replaceSelectionWith(imageNode);
                            view.dispatch(transaction);
                        };
                        reader.readAsDataURL(file);
                        return true;
                    }
                }
                return false;
            },
        },
        onUpdate: ({ editor }) => {
            const json = editor.getJSON();
            onUpdate?.(json);
        },
    });

    return editor;
};
