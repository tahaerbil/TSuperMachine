import React, { useState, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';
import {
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    CheckSquare,
    ListTodo,
    Quote,
    Code,
    Table,
    Minus,
    Image,
    BarChart
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
    listTodo: <ListTodo size={18} />,
    quote: <Quote size={18} />,
    code: <Code size={18} />,
    table: <Table size={18} />,
    minus: <Minus size={18} />,
    image: <Image size={18} />,
    barChart: <BarChart size={18} />,
};

export const SlashCommandList = forwardRef<SlashCommandListRef, SlashCommandListProps>(
    ({ items, command }, ref) => {
        const [selectedIndex, setSelectedIndex] = useState(0);

        // Compute safe selected index - always within bounds
        // This is a derived value, not state mutation during render
        const safeSelectedIndex = useMemo(() => {
            if (items.length === 0) return 0;
            return Math.min(selectedIndex, items.length - 1);
        }, [selectedIndex, items.length]);

        const selectItem = useCallback((index: number) => {
            const item = items[index];
            if (item) {
                command(item);
            }
        }, [items, command]);

        const upHandler = useCallback(() => {
            setSelectedIndex((prev) => {
                const maxIndex = Math.max(0, items.length - 1);
                return prev <= 0 ? maxIndex : prev - 1;
            });
        }, [items.length]);

        const downHandler = useCallback(() => {
            setSelectedIndex((prev) => {
                const maxIndex = Math.max(0, items.length - 1);
                return prev >= maxIndex ? 0 : prev + 1;
            });
        }, [items.length]);

        const enterHandler = useCallback(() => {
            selectItem(safeSelectedIndex);
        }, [selectItem, safeSelectedIndex]);

        // Expose keyboard handler to parent
        useImperativeHandle(ref, () => ({
            onKeyDown: ({ event }: { event: KeyboardEvent }) => {
                if (event.key === 'ArrowUp') {
                    upHandler();
                    return true;
                }
                if (event.key === 'ArrowDown') {
                    downHandler();
                    return true;
                }
                if (event.key === 'Enter') {
                    enterHandler();
                    return true;
                }
                return false;
            },
        }), [upHandler, downHandler, enterHandler]);

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
