import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Trash2, CheckSquare } from 'lucide-react';

interface TodoItem {
    id: string;
    text: string;
    checked: boolean;
}

// Empty array constant to avoid recreating on each render
const EMPTY_ITEMS: TodoItem[] = [];

// Todo Block React Component
const TodoBlockComponent: React.FC<NodeViewProps> = ({ node, updateAttributes }) => {
    // Get items and title from node attrs - memoized to prevent unnecessary re-renders
    const items = useMemo(() => {
        return (node.attrs.items as TodoItem[]) || EMPTY_ITEMS;
    }, [node.attrs.items]);
    const title = (node.attrs.title as string) || 'Todo';

    const [newItemText, setNewItemText] = useState('');

    const completed = items.filter(i => i.checked).length;
    const total = items.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    const isComplete = total > 0 && completed === total;

    const updateItems = useCallback((newItems: TodoItem[]) => {
        updateAttributes({ items: newItems });
    }, [updateAttributes]);

    const toggleItem = useCallback((id: string) => {
        const newItems = items.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        );
        updateItems(newItems);
    }, [items, updateItems]);

    const deleteItem = useCallback((id: string) => {
        const newItems = items.filter(item => item.id !== id);
        updateItems(newItems);
    }, [items, updateItems]);

    const addItem = useCallback(() => {
        if (!newItemText.trim()) return;
        const newItems = [...items, {
            id: `todo-${Date.now()}`,
            text: newItemText.trim(),
            checked: false
        }];
        updateItems(newItems);
        setNewItemText('');
    }, [items, newItemText, updateItems]);

    const updateItemText = useCallback((id: string, text: string) => {
        const newItems = items.map(item =>
            item.id === id ? { ...item, text } : item
        );
        updateItems(newItems);
    }, [items, updateItems]);

    const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        updateAttributes({ title: e.target.value });
    }, [updateAttributes]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addItem();
        }
    }, [addItem]);

    return (
        <NodeViewWrapper className="todo-block-wrapper">
            <div
                className="todo-block-container"
                style={{
                    margin: '12px 0',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border, rgba(0,0,0,0.1))',
                    backgroundColor: 'var(--color-surface, #fff)',
                    overflow: 'hidden',
                }}
                contentEditable={false}
            >
                {/* Header with title and progress */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        backgroundColor: 'var(--color-bg-secondary, rgba(0,0,0,0.02))',
                        borderBottom: '1px solid var(--color-border, rgba(0,0,0,0.1))',
                    }}
                >
                    <CheckSquare size={18} style={{ color: isComplete ? '#22c55e' : '#3b82f6' }} />
                    <input
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        className="todo-block-title"
                        style={{
                            flex: 1,
                            border: 'none',
                            background: 'transparent',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--color-text, #333)',
                            outline: 'none',
                        }}
                        placeholder="Todo title..."
                    />
                    {/* Progress bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '80px',
                            height: '6px',
                            borderRadius: '3px',
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                width: `${percentage}%`,
                                height: '100%',
                                borderRadius: '3px',
                                backgroundColor: isComplete ? '#22c55e' : '#3b82f6',
                                transition: 'width 0.3s ease',
                            }} />
                        </div>
                        <span style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: isComplete ? '#22c55e' : 'var(--color-text, #333)',
                            opacity: isComplete ? 1 : 0.6,
                            minWidth: '35px',
                        }}>
                            {completed}/{total}
                        </span>
                    </div>
                </div>

                {/* Todo items */}
                <div style={{ padding: '8px 0' }}>
                    {items.map((item) => (
                        <div
                            key={item.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 16px',
                                transition: 'background-color 0.15s',
                            }}
                            className="todo-block-item"
                        >
                            <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={() => toggleItem(item.id)}
                                style={{
                                    width: '16px',
                                    height: '16px',
                                    accentColor: '#3b82f6',
                                    cursor: 'pointer',
                                }}
                            />
                            <input
                                type="text"
                                value={item.text}
                                onChange={(e) => updateItemText(item.id, e.target.value)}
                                style={{
                                    flex: 1,
                                    border: 'none',
                                    background: 'transparent',
                                    fontSize: '14px',
                                    color: 'var(--color-text, #333)',
                                    textDecoration: item.checked ? 'line-through' : 'none',
                                    opacity: item.checked ? 0.5 : 1,
                                    outline: 'none',
                                }}
                            />
                            <button
                                onClick={() => deleteItem(item.id)}
                                style={{
                                    padding: '4px',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    opacity: 0.3,
                                    transition: 'opacity 0.15s',
                                }}
                                className="todo-block-delete"
                            >
                                <Trash2 size={14} style={{ color: '#ef4444' }} />
                            </button>
                        </div>
                    ))}

                    {/* Add new item */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            borderTop: items.length > 0 ? '1px dashed var(--color-border, rgba(0,0,0,0.1))' : 'none',
                            marginTop: items.length > 0 ? '4px' : 0,
                        }}
                    >
                        <Plus size={16} style={{ color: '#3b82f6', opacity: 0.6 }} />
                        <input
                            type="text"
                            value={newItemText}
                            onChange={(e) => setNewItemText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Add a task..."
                            style={{
                                flex: 1,
                                border: 'none',
                                background: 'transparent',
                                fontSize: '14px',
                                color: 'var(--color-text, #333)',
                                outline: 'none',
                            }}
                        />
                        <button
                            onClick={addItem}
                            disabled={!newItemText.trim()}
                            style={{
                                padding: '4px 12px',
                                border: 'none',
                                borderRadius: '4px',
                                backgroundColor: newItemText.trim() ? '#3b82f6' : 'rgba(0,0,0,0.05)',
                                color: newItemText.trim() ? '#fff' : 'var(--color-text, #333)',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: newItemText.trim() ? 'pointer' : 'default',
                                opacity: newItemText.trim() ? 1 : 0.5,
                            }}
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>
            <NodeViewContent className="todo-block-content" style={{ display: 'none' }} />
        </NodeViewWrapper>
    );
};

// TipTap Extension
export const TodoBlock = Node.create({
    name: 'todoBlock',

    group: 'block',

    atom: true,

    addAttributes() {
        return {
            items: {
                default: [],
            },
            title: {
                default: 'Todo',
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="todo-block"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'todo-block' })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(TodoBlockComponent);
    },

    addCommands() {
        return {
            insertTodoBlock: () => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: {
                        items: [
                            { id: `todo-${Date.now()}`, text: 'Task 1', checked: false },
                        ],
                        title: 'Todo',
                    },
                });
            },
        };
    },
});

// Type declaration for commands
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        todoBlock: {
            insertTodoBlock: () => ReturnType;
        };
    }
}
