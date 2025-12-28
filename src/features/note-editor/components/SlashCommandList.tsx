import React, { useState, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import {
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    CheckSquare,
    Quote,
    Code,
    Table,
    Minus,
    Image
} from 'lucide-react';

// Command props type - matches slashCommands.ts
export interface SlashCommandItem {
    title: string;
    description: string;
    icon: string;
    command: (props: { editor: unknown; range: unknown }) => void;
}

interface SlashCommandListProps {
    items: SlashCommandItem[];
    command: (item: SlashCommandItem) => void;
}

interface SlashCommandListRef {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const iconMap: Record<string, React.ReactNode> = {
    heading1: <Heading1 size={18} />,
    heading2: <Heading2 size={18} />,
    heading3: <Heading3 size={18} />,
    list: <List size={18} />,
    listOrdered: <ListOrdered size={18} />,
    checkSquare: <CheckSquare size={18} />,
    quote: <Quote size={18} />,
    code: <Code size={18} />,
    table: <Table size={18} />,
    minus: <Minus size={18} />,
    image: <Image size={18} />,
};

export const SlashCommandList = forwardRef<SlashCommandListRef, SlashCommandListProps>(
    ({ items, command }, ref) => {
        const [selectedIndex, setSelectedIndex] = useState(0);

        // Track previous items length to reset selection without useEffect
        const prevItemsLengthRef = useRef(items.length);

        // Reset selection when items change (without useEffect)
        if (prevItemsLengthRef.current !== items.length) {
            prevItemsLengthRef.current = items.length;
            // Only reset if selectedIndex is out of bounds
            if (selectedIndex >= items.length) {
                setSelectedIndex(0);
            }
        }

        const selectItem = useCallback((index: number) => {
            const item = items[index];
            if (item) {
                command(item);
            }
        }, [items, command]);

        // Expose keyboard handler to parent
        useImperativeHandle(ref, () => ({
            onKeyDown: ({ event }: { event: KeyboardEvent }) => {
                if (event.key === 'ArrowUp') {
                    setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
                    return true;
                }
                if (event.key === 'ArrowDown') {
                    setSelectedIndex((prev) => (prev + 1) % items.length);
                    return true;
                }
                if (event.key === 'Enter') {
                    selectItem(selectedIndex);
                    return true;
                }
                return false;
            },
        }), [items.length, selectedIndex, selectItem]);

        if (items.length === 0) {
            return (
                <div className="slash-command-menu">
                    <div className="slash-command-item">
                        <span className="slash-command-item-content">
                            <span className="slash-command-item-title">No results</span>
                        </span>
                    </div>
                </div>
            );
        }

        // Ensure selectedIndex is within bounds
        const safeSelectedIndex = Math.min(selectedIndex, items.length - 1);

        return (
            <div className="slash-command-menu">
                {items.map((item, index) => (
                    <div
                        key={item.title}
                        className={`slash-command-item ${index === safeSelectedIndex ? 'is-selected' : ''}`}
                        onClick={() => selectItem(index)}
                        onMouseEnter={() => setSelectedIndex(index)}
                    >
                        <div className="slash-command-item-icon">
                            {iconMap[item.icon] || <Code size={18} />}
                        </div>
                        <div className="slash-command-item-content">
                            <div className="slash-command-item-title">{item.title}</div>
                            <div className="slash-command-item-description">{item.description}</div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }
);

SlashCommandList.displayName = 'SlashCommandList';
