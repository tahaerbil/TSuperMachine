/**
 * useContextMenu Hook
 * 
 * Handles widget context menu (right-click toolbar):
 * - Toggle visibility on right-click
 * - Close when clicking outside
 * - Menu ref for click detection
 */

import { useState, useRef, useEffect, useCallback } from 'react';

interface UseContextMenuReturn {
    /** Whether context menu is currently visible */
    showContextMenu: boolean;
    /** Ref to attach to context menu element */
    contextMenuRef: React.RefObject<HTMLDivElement | null>;
    /** Handle right-click to toggle menu */
    handleContextMenu: (e: React.MouseEvent) => void;
    /** Close the context menu */
    closeContextMenu: () => void;
}

export function useContextMenu(): UseContextMenuReturn {
    const [showContextMenu, setShowContextMenu] = useState(false);
    const contextMenuRef = useRef<HTMLDivElement>(null);

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
                setShowContextMenu(false);
            }
        };

        if (showContextMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showContextMenu]);

    /**
     * Handle right-click to show/toggle context menu
     */
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowContextMenu(prev => !prev);
    }, []);

    /**
     * Close the context menu
     */
    const closeContextMenu = useCallback(() => {
        setShowContextMenu(false);
    }, []);

    return {
        showContextMenu,
        contextMenuRef,
        handleContextMenu,
        closeContextMenu,
    };
}

export default useContextMenu;
