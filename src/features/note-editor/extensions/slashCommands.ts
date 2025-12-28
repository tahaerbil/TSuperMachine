import { Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import type { SuggestionOptions } from '@tiptap/suggestion';
import tippy from 'tippy.js';
import type { Instance as TippyInstance } from 'tippy.js';
import type { Editor } from '@tiptap/core';
import type { Range } from '@tiptap/core';

// Import the UI component
import { SlashCommandList } from '../components/SlashCommandList';

// Command props type
interface CommandProps {
    editor: Editor;
    range: Range;
}

// Slash command item type
export interface SlashCommandItem {
    title: string;
    description: string;
    icon: string;
    command: (props: CommandProps) => void;
}

// Define available slash commands
export const slashCommands: SlashCommandItem[] = [
    {
        title: 'Heading 1',
        description: 'Large section heading',
        icon: 'heading1',
        command: ({ editor, range }: CommandProps) => {
            editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
        },
    },
    {
        title: 'Heading 2',
        description: 'Medium section heading',
        icon: 'heading2',
        command: ({ editor, range }: CommandProps) => {
            editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
        },
    },
    {
        title: 'Heading 3',
        description: 'Small section heading',
        icon: 'heading3',
        command: ({ editor, range }: CommandProps) => {
            editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
        },
    },
    {
        title: 'Bullet List',
        description: 'Create a simple bullet list',
        icon: 'list',
        command: ({ editor, range }: CommandProps) => {
            editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
    },
    {
        title: 'Numbered List',
        description: 'Create a numbered list',
        icon: 'listOrdered',
        command: ({ editor, range }: CommandProps) => {
            editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
    },
    {
        title: 'Task List',
        description: 'Track tasks with checkboxes',
        icon: 'checkSquare',
        command: ({ editor, range }: CommandProps) => {
            editor.chain().focus().deleteRange(range).toggleTaskList().run();
        },
    },
    {
        title: 'Quote',
        description: 'Capture a quote',
        icon: 'quote',
        command: ({ editor, range }: CommandProps) => {
            editor.chain().focus().deleteRange(range).toggleBlockquote().run();
        },
    },
    {
        title: 'Code Block',
        description: 'Add a code snippet',
        icon: 'code',
        command: ({ editor, range }: CommandProps) => {
            editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
        },
    },
    {
        title: 'Table',
        description: 'Insert a table',
        icon: 'table',
        command: ({ editor, range }: CommandProps) => {
            editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        },
    },
    {
        title: 'Horizontal Rule',
        description: 'Add a divider line',
        icon: 'minus',
        command: ({ editor, range }: CommandProps) => {
            editor.chain().focus().deleteRange(range).setHorizontalRule().run();
        },
    },
    {
        title: 'Image',
        description: 'Embed an image from URL',
        icon: 'image',
        command: ({ editor, range }: CommandProps) => {
            const url = window.prompt('Image URL');
            if (url) {
                editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
            }
        },
    },
];

// Slash Commands Extension
export const SlashCommands = Extension.create({
    name: 'slashCommands',

    addOptions() {
        return {
            suggestion: {
                char: '/',
                command: ({ editor, range, props }: { editor: Editor; range: Range; props: SlashCommandItem }) => {
                    props.command({ editor, range });
                },
            } as Partial<SuggestionOptions>,
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
                items: ({ query }: { query: string }) => {
                    return slashCommands.filter(item =>
                        item.title.toLowerCase().includes(query.toLowerCase()) ||
                        item.description.toLowerCase().includes(query.toLowerCase())
                    );
                },
                render: () => {
                    let component: ReactRenderer | null = null;
                    let popup: TippyInstance[] | null = null;

                    return {
                        onStart: (props) => {
                            component = new ReactRenderer(SlashCommandList, {
                                props,
                                editor: props.editor,
                            });

                            if (!props.clientRect) return;

                            popup = tippy('body', {
                                getReferenceClientRect: props.clientRect as () => DOMRect,
                                appendTo: () => document.body,
                                content: component.element,
                                showOnCreate: true,
                                interactive: true,
                                trigger: 'manual',
                                placement: 'bottom-start',
                            });
                        },
                        onUpdate: (props) => {
                            component?.updateProps(props);

                            if (!props.clientRect || !popup) return;

                            popup[0].setProps({
                                getReferenceClientRect: props.clientRect as () => DOMRect,
                            });
                        },
                        onKeyDown: (props) => {
                            if (props.event.key === 'Escape') {
                                popup?.[0].hide();
                                return true;
                            }

                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            return (component?.ref as any)?.onKeyDown?.(props) ?? false;
                        },
                        onExit: () => {
                            popup?.[0].destroy();
                            component?.destroy();
                        },
                    };
                },
            }),
        ];
    },
});
