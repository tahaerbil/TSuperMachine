
import { useState, useCallback } from 'react';
import { cadEngine } from '../../../core/services/cad-engine/CADEngine';

export interface CADTab {
    id: string;
    name: string;
    // We store the DXF or Database JSON here. 
    // Ideally, for performance with large files, we might want to offload this or just keep reference.
    // For now, JSON string of the database is fine for "Context Switching".
    data: string | null;
    isUnsaved: boolean;
}

interface UseCADTabsProps {
    onEngineUpdate: () => void; // Callback to force re-render widget when context changes
    onExit?: () => void; // Callback when the last tab is closed
}

export function useCADTabs({ onEngineUpdate, onExit }: UseCADTabsProps) {
    const [tabs, setTabs] = useState<CADTab[]>([
        { id: 'default', name: 'Drawing 1', data: null, isUnsaved: false }
    ]);
    const [activeTabId, setActiveTabId] = useState<string>('default');

    // Generate a unique ID
    const generateId = () => Math.random().toString(36).substr(2, 9);

    /**
     * Switch context to another tab.
     * 1. Save current engine state to current tab.
     * 2. Clear engine.
     * 3. Load target tab data.
     */
    const switchToTab = useCallback((targetId: string) => {
        if (targetId === activeTabId) return;

        console.log(`[CADTabs] Switching from ${activeTabId} to ${targetId}`);

        setTabs(prevTabs => {
            // 1. Snapshot current state
            // We need to use 'activeTabId' from the enclosure closure, but inside setState 
            // we should be careful. Actually, we can just look up the current tab in the prevTabs.
            // CAUTION: 'activeTabId' state might be stale if called rapidly, but typically UI blocks this.

            // However, we need to capture the ENGINE state right now.
            // The engine is a singleton, so it represents the 'activeTabId' state.

            // NOTE: If the engine is empty, exportDatabase might return "[]" or similar.
            let currentData = "[]";
            try {
                currentData = cadEngine.exportDatabase();
            } catch (e) {
                console.error("Failed to export database during tab switch:", e);
            }

            // Update the tab list with the saved data for the OLD active tab
            return prevTabs.map(tab => {
                if (tab.id === activeTabId) {
                    return { ...tab, data: currentData };
                }
                return tab;
            });
        });

        // 2 & 3. Load new state
        // We need to wait for the state update or just do it imperatively?
        // Since React state updates are async, we can't get the *target* tab data from state immediately
        // if we just updated it (though we didn't update target tab, only source).
        // Let's find the target tab data from current state (or prevTabs).

        // Actually, we must be careful. We are inside a functional update above? 
        // No, let's do the engine operations safely OUTSIDE the setState, 
        // but we need the 'snapshot' logic to happen before we wipe the engine.
        // Let's refactor slightly to be safer/synchronous where it matters.

        // Re-approach:
        // 1. Get current data from Engine.
        // 2. Update Tabs State (Save current, Set Active).
        // 3. Clear & Load Engine (using the data from the target tab).

        let currentDbData = "[]";
        try {
            currentDbData = cadEngine.exportDatabase() || "[]";
        } catch (e) { console.warn("Engine export failed", e); }

        // We need to find the target data. Since state update hasn't happened yet,
        // we look in 'tabs' (current state).
        const targetTab = tabs.find(t => t.id === targetId);
        const targetData = targetTab ? targetTab.data : "[]";

        // Perform Engine Context Switch
        try {
            cadEngine.clear();
            if (targetData && targetData !== "[]") {
                cadEngine.importDatabase(targetData);
            }
        } catch (e) {
            console.error("Engine context switch failed", e);
        }

        // Commit State Changes
        setTabs(prev => prev.map(t =>
            t.id === activeTabId ? { ...t, data: currentDbData } : t
        ));
        setActiveTabId(targetId);

        // Notify parent to re-render canvas/grid
        onEngineUpdate();

    }, [tabs, activeTabId, onEngineUpdate]);


    const addTab = useCallback(() => {
        // 1. Save current tab state before switching focus to new one
        let currentDbData = "[]";
        try {
            currentDbData = cadEngine.exportDatabase() || "[]";
        } catch (e) { console.warn("Engine export failed", e); }

        // 2. Update current tab data in storage
        setTabs(prev => prev.map(t =>
            t.id === activeTabId ? { ...t, data: currentDbData } : t
        ));

        // 3. Create new tab
        const newId = generateId();
        const newTabNumber = tabs.length + 1;
        const newTab: CADTab = {
            id: newId,
            name: `Drawing ${newTabNumber}`,
            data: "[]", // Empty
            isUnsaved: false
        };

        setTabs(prev => [...prev, newTab]);

        // 4. Switch context to new tab (Clear engine)
        cadEngine.clear();
        setActiveTabId(newId);
        onEngineUpdate();

    }, [tabs, activeTabId, onEngineUpdate]);


    const closeTab = useCallback((tabId: string, e?: React.MouseEvent) => {
        e?.stopPropagation(); // Prevent tab click

        if (tabs.length === 1) {
            // If it's the last tab, trigger exit callback
            onExit?.();
            return;
        }

        // If closing active tab, we need to switch to another
        if (tabId === activeTabId) {
            const currentIndex = tabs.findIndex(t => t.id === tabId);
            // Try go left, else right
            const nextIndex = currentIndex > 0 ? currentIndex - 1 : 1;
            const nextTab = tabs[nextIndex];

            // We don't need to save current engine state since we are destroying it.
            // But we do need to load the next tab's state.

            if (nextTab) {
                // Load next tab data
                cadEngine.clear();
                if (nextTab.data && nextTab.data !== "[]") {
                    try {
                        cadEngine.importDatabase(nextTab.data);
                    } catch (e) { console.error(e); }
                }
                setActiveTabId(nextTab.id);
                onEngineUpdate();
            }
        }

        setTabs(prev => prev.filter(t => t.id !== tabId));

    }, [tabs, activeTabId, onEngineUpdate, onExit]);

    // Explicit update name if needed (e.g. "Save As")
    const updateTabName = useCallback((id: string, name: string) => {
        setTabs(prev => prev.map(t => t.id === id ? { ...t, name } : t));
    }, []);

    const reorderTabs = useCallback((newTabs: CADTab[]) => {
        setTabs(newTabs);
    }, []);

    return {
        tabs,
        activeTabId,
        addTab,
        closeTab,
        switchToTab,
        updateTabName,
        reorderTabs
    };
}
