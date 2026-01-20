import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Plus, X, File } from 'lucide-react';
import type { CADTab } from '../hooks/useCADTabs';

interface CADTabsBarProps {
    tabs: CADTab[];
    activeTabId: string;
    onSwitch: (id: string) => void;
    onClose: (id: string, e: React.MouseEvent) => void;
    onAdd: () => void;
    onReorder: (newOrder: CADTab[]) => void;
}

export function CADTabsBar({ tabs, activeTabId, onSwitch, onClose, onAdd, onReorder }: CADTabsBarProps) {
    return (
        <div className="flex items-center w-full h-10 bg-[#1e1e1e] border-b border-white/10 px-2 select-none z-10 relative">
            <div className="flex items-center gap-1 flex-1 overflow-x-auto no-scrollbar">
                <Reorder.Group
                    axis="x"
                    values={tabs}
                    onReorder={onReorder}
                    className="flex items-end gap-1 h-full"
                >
                    <AnimatePresence initial={false}>
                        {tabs.map((tab) => {
                            const isActive = tab.id === activeTabId;
                            return (
                                <Reorder.Item
                                    key={tab.id}
                                    value={tab}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    // Prevent drag when clicking close or content
                                    dragListener={true}
                                    onClick={() => onSwitch(tab.id)}
                                    className={`
                                        group relative flex items-center gap-2 px-3 py-1.5 min-w-[140px] max-w-[200px] h-8 rounded-t-md cursor-pointer transition-colors border-r border-white/5
                                        ${isActive
                                            ? 'bg-[#252526] text-white shadow-inner'
                                            : 'bg-transparent text-zinc-500 hover:bg-[#2d2d2d] hover:text-zinc-300'}
                                    `}
                                    style={{ y: 0 }} // Force y to 0 to prevent vertical movement if any
                                >
                                    {/* Active Indicator Top Line */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTabIndicator"
                                            className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500"
                                        />
                                    )}

                                    <File size={12} className={isActive ? 'text-blue-400' : 'text-zinc-600'} />

                                    {/* Tab Name - Non-draggable? No, usually drag by grabbing tab. */}
                                    <span className="text-xs truncate flex-1 pointer-events-none">{tab.name}</span>

                                    {tab.isUnsaved && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                                    )}

                                    <button
                                        onClick={(e) => onClose(tab.id, e)}
                                        // Key fix: Stop propagation to prevent triggering drag or switch
                                        onPointerDown={(e) => e.stopPropagation()}
                                        className={`
                                            opacity-0 group-hover:opacity-100 p-0.5 rounded-sm hover:bg-white/10 transition-all z-10
                                            ${isActive ? 'opacity-100' : ''}
                                        `}
                                    >
                                        <X size={12} />
                                    </button>
                                </Reorder.Item>
                            );
                        })}
                    </AnimatePresence>
                </Reorder.Group>
            </div>

            {/* Add Button */}
            <button
                onClick={onAdd}
                className="ml-2 p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                title="New Drawing"
            >
                <Plus size={16} />
            </button>
        </div>
    );
}
