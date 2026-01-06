import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useEffect, useState } from 'react';

// Progress Bar React Component
const ProgressBarComponent: React.FC<{ editor: ReturnType<typeof import('@tiptap/react').useEditor> }> = ({ editor }) => {
    const [progress, setProgress] = useState({ total: 0, completed: 0 });

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

            setProgress({ total, completed });
        };

        calculateProgress();
        editor.on('update', calculateProgress);

        return () => {
            editor.off('update', calculateProgress);
        };
    }, [editor]);

    const percentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
    const isComplete = progress.total > 0 && progress.completed === progress.total;

    return (
        <NodeViewWrapper className= "progress-bar-wrapper" contentEditable = { false} >
            <div 
                className="progress-bar-container"
    style = {{
        display: 'flex',
            alignItems: 'center',
                gap: '12px',
                    padding: '12px 16px',
                        margin: '8px 0',
                            borderRadius: '8px',
                                backgroundColor: 'var(--color-bg-secondary, rgba(0,0,0,0.03))',
                                    border: '1px solid var(--color-border, rgba(0,0,0,0.1))',
                                        userSelect: 'none',
                }
}
            >
    {/* Icon */ }
    < div style = {{
    fontSize: '20px',
        opacity: isComplete ? 1 : 0.6
}}>
    { isComplete? '🎉': '📋' }
    </div>

{/* Progress bar */ }
<div style={ { flex: 1 } }>
    <div style={
        {
            display: 'flex',
                justifyContent: 'space-between',
                    marginBottom: '4px',
                        fontSize: '12px',
                            fontWeight: 500,
                                color: 'var(--color-text, #333)',
                    }
}>
    <span>
    { isComplete? 'All tasks completed!': 'Task Progress' }
    </span>
    < span style = {{
    color: isComplete ? '#22c55e' : 'var(--color-text, #333)',
        opacity: isComplete ? 1 : 0.6
}}>
    { progress.completed } / { progress.total }
    </span>
    </div>
    < div style = {{
    width: '100%',
        height: '8px',
            borderRadius: '4px',
                backgroundColor: 'rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    }}>
    <div style={
        {
            width: `${percentage}%`,
                height: '100%',
                    borderRadius: '4px',
                        backgroundColor: isComplete ? '#22c55e' : '#3b82f6',
                            transition: 'width 0.3s ease, background-color 0.3s ease',
                        }
} />
    </div>
    </div>

{/* Percentage */ }
<div style={
    {
        fontSize: '14px',
            fontWeight: 600,
                color: isComplete ? '#22c55e' : '#3b82f6',
                    minWidth: '45px',
                        textAlign: 'right',
                }
}>
    { Math.round(percentage) } %
    </div>
    </div>
    </NodeViewWrapper>
    );
};

// TipTap Extension
export const ProgressBar = Node.create({
    name: 'progressBar',

    group: 'block',

    atom: true, // Cannot have content inside

    parseHTML() {
        return [
            {
                tag: 'div[data-type="progress-bar"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'progress-bar' })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ProgressBarComponent);
    },

    addCommands() {
        return {
            insertProgressBar: () => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                });
            },
        };
    },
});

// Type declaration for commands
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        progressBar: {
            insertProgressBar: () => ReturnType;
        };
    }
}
