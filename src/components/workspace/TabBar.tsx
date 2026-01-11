import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useWorkspaceStore, type CanvasTab } from '../../store/workspaceStore';
import { useTranslation } from 'react-i18next';
import './TabBar.css';

// =============================================================================
// Icons
// =============================================================================

const PlusIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M5 12h14" />
    </svg>
);

const CloseIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 6L6 18M6 6l12 12" />
    </svg>
);

const ChevronLeftIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 18l-6-6 6-6" />
    </svg>
);

const ChevronRightIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18l6-6-6-6" />
    </svg>
);

// =============================================================================
// Tab Item Component
// =============================================================================

interface TabItemProps {
    tab: CanvasTab;
    isActive: boolean;
    index: number;
    onClose: (id: string) => void;
    onSwitch: (id: string) => void;
    onRename: (id: string, name: string) => void;
    onDragStart: (e: React.DragEvent, index: number) => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDragEnd: () => void;
    isDragTarget: boolean;
}

const TabItem: React.FC<TabItemProps> = ({
    tab,
    isActive,
    index,
    onClose,
    onSwitch,
    onRename,
    onDragStart,
    onDragOver,
    onDragEnd,
    isDragTarget
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(tab.name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleDoubleClick = () => {
        setEditValue(tab.name);
        setIsEditing(true);
    };

    const handleBlur = () => {
        if (editValue.trim() && editValue !== tab.name) {
            onRename(tab.id, editValue.trim());
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        } else if (e.key === 'Escape') {
            setEditValue(tab.name);
            setIsEditing(false);
        }
    };

    const handleMiddleClick = (e: React.MouseEvent) => {
        if (e.button === 1) {
            e.preventDefault();
            e.stopPropagation();
            onClose(tab.id);
        }
    };

    const handleCloseClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent tab switching
        onClose(tab.id);
    };

    const blockMiddleClick = (e: React.MouseEvent) => {
        if (e.button === 1) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    return (
        <div
            className={`tab-item ${isActive ? 'active' : ''} ${isDragTarget ? 'drag-target' : ''}`}
            onClick={() => onSwitch(tab.id)}
            onMouseDown={handleMiddleClick}
            onMouseUp={blockMiddleClick}
            onAuxClick={blockMiddleClick}
            onDoubleClick={handleDoubleClick}
            draggable={!isEditing}
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDragEnd={onDragEnd}
        >
            {/* Dirty indicator */}
            {tab.isDirty && <span className="dirty-indicator">●</span>}

            {/* Tab name */}
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    className="tab-name-input"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <span className="tab-name">{tab.name}</span>
            )}

            {/* Close button */}
            <button
                className="tab-close-btn"
                onClick={handleCloseClick}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label="Close tab"
            >
                <CloseIcon />
            </button>
        </div>
    );
};

// =============================================================================
// Tab Bar Component
// =============================================================================

export const TabBar: React.FC = () => {
    const { t } = useTranslation();
    const {
        tabs,
        tabOrder,
        activeTabId,
        createTab,
        closeTab,
        switchTab,
        renameTab,
        reorderTabs
    } = useWorkspaceStore();

    const containerRef = useRef<HTMLDivElement>(null);
    const tabsRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Check scroll overflow
    const checkOverflow = useCallback(() => {
        if (tabsRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 1);
        }
    }, []);

    useEffect(() => {
        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [checkOverflow, tabs.length]);

    // Scroll handlers
    const scrollLeft = () => {
        if (tabsRef.current) {
            tabsRef.current.scrollBy({ left: -150, behavior: 'smooth' });
            setTimeout(checkOverflow, 300);
        }
    };

    const scrollRight = () => {
        if (tabsRef.current) {
            tabsRef.current.scrollBy({ left: 150, behavior: 'smooth' });
            setTimeout(checkOverflow, 300);
        }
    };

    // Drag handlers
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDragIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        // Required for Firefox
        e.dataTransfer.setData('text/plain', String(index));
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (dragIndex !== null && dragIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragEnd = () => {
        if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
            reorderTabs(dragIndex, dragOverIndex);
        }
        setDragIndex(null);
        setDragOverIndex(null);
    };

    // Get ordered tabs
    const orderedTabs = tabOrder
        .map(id => tabs.find(t => t.id === id))
        .filter((t): t is CanvasTab => t !== undefined);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+T: New tab
            if (e.ctrlKey && e.key.toLowerCase() === 't') {
                e.preventDefault();
                createTab();
            }
            // Ctrl+W: Close tab
            else if (e.ctrlKey && e.key.toLowerCase() === 'w') {
                e.preventDefault();
                if (activeTabId) {
                    closeTab(activeTabId);
                }
            }
            // Ctrl+Tab: Next tab
            else if (e.ctrlKey && e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                const currentIndex = tabOrder.indexOf(activeTabId || '');
                const nextIndex = (currentIndex + 1) % tabOrder.length;
                switchTab(tabOrder[nextIndex]);
            }
            // Ctrl+Shift+Tab: Previous tab
            else if (e.ctrlKey && e.shiftKey && e.key === 'Tab') {
                e.preventDefault();
                const currentIndex = tabOrder.indexOf(activeTabId || '');
                const prevIndex = currentIndex === 0 ? tabOrder.length - 1 : currentIndex - 1;
                switchTab(tabOrder[prevIndex]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTabId, tabOrder, createTab, closeTab, switchTab]);

    return (
        <div
            className="tab-bar"
            ref={containerRef}
            onMouseDown={(e) => {
                if (e.button === 1) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }}
            onMouseUp={(e) => {
                if (e.button === 1) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }}
            onClick={(e) => {
                if (e.button === 1) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }}
        >
            {/* Left scroll arrow */}
            {showLeftArrow && (
                <button className="tab-scroll-btn left" onClick={scrollLeft}>
                    <ChevronLeftIcon />
                </button>
            )}

            {/* Tabs container */}
            <div
                className="tabs-container"
                ref={tabsRef}
                onScroll={checkOverflow}
            >
                {orderedTabs.map((tab, index) => (
                    <TabItem
                        key={tab.id}
                        tab={tab}
                        isActive={tab.id === activeTabId}
                        index={index}
                        onClose={closeTab}
                        onSwitch={switchTab}
                        onRename={renameTab}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        isDragTarget={dragOverIndex === index}
                    />
                ))}
            </div>

            {/* Right scroll arrow */}
            {showRightArrow && (
                <button className="tab-scroll-btn right" onClick={scrollRight}>
                    <ChevronRightIcon />
                </button>
            )}

            {/* New tab button */}
            <button
                className="new-tab-btn"
                onClick={() => createTab()}
                title={t('workspace.newTab', 'New Tab (Ctrl+T)')}
            >
                <PlusIcon />
            </button>
        </div>
    );
};

export default TabBar;
