import React, { useRef, useEffect } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { X, Plus } from 'lucide-react';
import { AnimatePresence, Reorder } from 'framer-motion';

export const TabBar: React.FC = () => {
    const {
        tabs,
        activeTabId,
        tabOrder,
        switchTab,
        closeTab,
        createTab,
        reorderTabs
    } = useWorkspaceStore();

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Scroll active tab into view when it changes
    useEffect(() => {
        if (activeTabId && scrollContainerRef.current) {
            const activeElement = scrollContainerRef.current.querySelector(`[data-tab-id="${activeTabId}"]`);
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
        }
    }, [activeTabId]);

    const handleWheel = (e: React.WheelEvent) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft += e.deltaY;
        }
    };

    const orderedTabs = tabOrder
        .map(id => tabs.find(t => t.id === id))
        .filter((t): t is NonNullable<typeof t> => !!t);

    const handleReorder = (newOrder: typeof orderedTabs) => {
        reorderTabs(newOrder.map(t => t.id));
    };

    return (
        <div className="flex items-center w-full h-9 bg-[#18181b] border-b border-[#27272a] select-none z-10 relative">
            {/* Tabs Container */}
            <div
                ref={scrollContainerRef}
                className="flex items-center gap-1 flex-1 overflow-x-auto no-scrollbar h-full px-1"
                onWheel={handleWheel}
            >
                <Reorder.Group
                    axis="x"
                    values={orderedTabs}
                    onReorder={handleReorder}
                    className="flex items-end h-full gap-[1px]"
                >
                    <AnimatePresence initial={false}>
                        {orderedTabs.map(tab => (
                            <Reorder.Item
                                key={tab.id}
                                value={tab}
                                data-tab-id={tab.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, width: 0 }}
                                whileDrag={{ scale: 1.05, zIndex: 50 }}
                                className={`
                                    group relative flex items-center h-8 min-w-[120px] max-w-[200px] px-3 
                                    cursor-default
                                    border-t-2 transition-colors
                                    rounded-t-sm
                                    ${tab.id === activeTabId
                                        ? 'bg-[#1e1e1e] border-blue-500 text-gray-100'
                                        : 'bg-[#27272a] border-transparent text-gray-400 hover:bg-[#323236] hover:text-gray-200'
                                    }
                                `}
                                onPointerDown={(e) => {
                                    // Allow Middle Click to Close
                                    if (e.button === 1) {
                                        e.preventDefault();
                                        closeTab(tab.id);
                                    } else {
                                        switchTab(tab.id);
                                    }
                                }}
                            >
                                {/* Content */}
                                <div className="flex-1 truncate text-xs font-medium mr-2 pointer-events-none">
                                    {tab.name}
                                    {tab.isDirty && <span className="ml-1 text-blue-400">*</span>}
                                </div>

                                {/* Close Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        closeTab(tab.id);
                                    }}
                                    // Prevents drag from starting on close button
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className={`
                                        p-0.5 rounded-sm hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity
                                        ${tab.id === activeTabId ? 'opacity-100' : ''}
                                    `}
                                >
                                    <X size={12} />
                                </button>
                            </Reorder.Item>
                        ))}
                    </AnimatePresence>
                </Reorder.Group>
            </div>

            {/* Add Tab Button */}
            <button
                onClick={() => createTab()}
                className="w-9 h-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#27272a] transition-colors border-l border-[#27272a]"
                title="New Tab (Ctrl+T)"
            >
                <Plus size={16} />
            </button>
        </div>
    );
};
