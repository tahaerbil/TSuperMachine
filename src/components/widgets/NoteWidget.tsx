import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/store';

interface NoteWidgetProps {
    id: string;
    initialContent?: string;
}

export const NoteWidget: React.FC<NoteWidgetProps> = ({ id, initialContent = '' }) => {
    const [content, setContent] = useState(initialContent);
    const { updateWidget } = useStore();

    // Debounce save to store
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            updateWidget(id, { data: { content } });
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [content, id, updateWidget]);

    return (
        <div className="w-full h-full flex flex-col">
            <textarea
                className="w-full h-full p-3 resize-none outline-none font-sans text-sm leading-relaxed"
                style={{
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)'
                }}
                placeholder="Type your notes here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when clicking text area
            />
        </div>
    );
};
