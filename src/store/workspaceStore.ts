import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { useStore, type Widget, type GridStyle } from './store';
import type { Connection } from '../core/services/automation/types';

// =============================================================================
// Types
// =============================================================================

export interface CanvasTab {
    id: string;
    name: string;

    // Canvas State (snapshot when tab is inactive)
    widgets: Widget[];
    canvas: { scale: number; offset: { x: number; y: number } };
    connections: Connection[];
    gridStyle: GridStyle;

    // Project Info
    projectName: string;
    projectMetadata: {
        created: string;
        modified: string;
        author: string;
    } | null;
    filePath: string | null;
    isDirty: boolean;

    // Tab Metadata
    createdAt: string;
    lastActiveAt: string;
}

interface WorkspaceState {
    tabs: CanvasTab[];
    activeTabId: string | null;
    tabOrder: string[]; // Ordered list of tab IDs for drag-reorder

    // Actions
    createTab: (name?: string) => string;
    closeTab: (tabId: string) => boolean;
    switchTab: (tabId: string) => void;
    renameTab: (tabId: string, name: string) => void;
    duplicateTab: (tabId: string) => string | null;
    reorderTabs: (fromIndex: number, toIndex: number) => void;
    updateActiveTabState: () => void;
    setTabDirty: (tabId: string, dirty: boolean) => void;
    setTabFilePath: (tabId: string, filePath: string | null) => void;
    getActiveTab: () => CanvasTab | null;
}

// =============================================================================
// Helpers
// =============================================================================

const generateTabId = (): string => crypto.randomUUID();

const createEmptyTab = (name?: string): CanvasTab => {
    const now = new Date().toISOString();
    return {
        id: generateTabId(),
        name: name || 'Untitled',
        widgets: [],
        canvas: { scale: 1, offset: { x: 0, y: 0 } },
        connections: [],
        gridStyle: 'lines',
        projectName: name || 'Untitled Project',
        projectMetadata: {
            created: now,
            modified: now,
            author: 'User'
        },
        filePath: null,
        isDirty: false,
        createdAt: now,
        lastActiveAt: now
    };
};

/**
 * Captures the current main store state into a CanvasTab snapshot
 */
const captureCurrentState = (existingTab: CanvasTab): CanvasTab => {
    const mainStore = useStore.getState();
    return {
        ...existingTab,
        widgets: [...mainStore.widgets],
        canvas: { ...mainStore.canvas },
        connections: [...mainStore.connections],
        gridStyle: mainStore.gridStyle,
        projectName: mainStore.projectName,
        projectMetadata: mainStore.projectMetadata ? { ...mainStore.projectMetadata } : null,
        lastActiveAt: new Date().toISOString()
    };
};

/**
 * Restores a tab's state to the main store
 */
const restoreTabState = (tab: CanvasTab): void => {
    const mainStore = useStore.getState();

    // Load all state into main store
    mainStore.loadProjectState(tab.widgets, tab.canvas);
    mainStore.setProjectName(tab.projectName);
    if (tab.projectMetadata) {
        mainStore.setProjectMetadata(tab.projectMetadata);
    }
    mainStore.setGridStyle(tab.gridStyle);

    // Restore connections
    // First clear existing, then add from tab
    const currentConnections = mainStore.connections;
    currentConnections.forEach(c => mainStore.removeConnection(c.id));

    // Re-add connections from tab (we need to use internal state setter)
    useStore.setState({ connections: tab.connections });
};

// =============================================================================
// Electron Storage Adapter
// =============================================================================

const createElectronStorage = (): StateStorage => {
    let cachedPath: string | null = null;

    const getStoragePath = async (): Promise<string> => {
        if (cachedPath) return cachedPath;

        const config = await window.electronAPI?.loadConfig();
        const workspacePath = config?.workspacePath || '';
        cachedPath = `${workspacePath}/System/workspace_state.json`;
        return cachedPath;
    };

    return {
        getItem: async (name: string): Promise<string | null> => {
            try {
                const filePath = await getStoragePath();
                const result = await window.electronAPI?.readFile(filePath);
                if (result?.success && result.content) {
                    const data = JSON.parse(result.content);
                    return JSON.stringify(data[name] || null);
                }
                return null;
            } catch {
                return null;
            }
        },
        setItem: async (name: string, value: string): Promise<void> => {
            try {
                const filePath = await getStoragePath();

                let existingData: Record<string, unknown> = {};
                try {
                    const result = await window.electronAPI?.readFile(filePath);
                    if (result?.success && result.content) {
                        existingData = JSON.parse(result.content);
                    }
                } catch {
                    // File doesn't exist yet
                }

                existingData[name] = JSON.parse(value);
                await window.electronAPI?.writeFile({
                    filePath,
                    content: JSON.stringify(existingData, null, 2)
                });
            } catch (error) {
                console.error('Failed to save workspace state:', error);
            }
        },
        removeItem: async (name: string): Promise<void> => {
            try {
                const filePath = await getStoragePath();
                const result = await window.electronAPI?.readFile(filePath);
                if (result?.success && result.content) {
                    const data = JSON.parse(result.content);
                    delete data[name];
                    await window.electronAPI?.writeFile({
                        filePath,
                        content: JSON.stringify(data, null, 2)
                    });
                }
            } catch {
                // Ignore
            }
        }
    };
};

// =============================================================================
// Store
// =============================================================================

const storage = window.electronAPI
    ? createElectronStorage()
    : localStorage;

export const useWorkspaceStore = create<WorkspaceState>()(
    persist(
        (set, get) => {
            // Create initial tab
            const initialTab = createEmptyTab();

            return {
                tabs: [initialTab],
                activeTabId: initialTab.id,
                tabOrder: [initialTab.id],

                // =============================================================
                // CREATE TAB
                // =============================================================
                createTab: (name?: string) => {
                    const state = get();

                    // First, save current tab's state
                    if (state.activeTabId) {
                        const currentTab = state.tabs.find(t => t.id === state.activeTabId);
                        if (currentTab) {
                            const updatedTab = captureCurrentState(currentTab);
                            set({
                                tabs: state.tabs.map(t =>
                                    t.id === state.activeTabId ? updatedTab : t
                                )
                            });
                        }
                    }

                    // Create new tab
                    const newTab = createEmptyTab(name);

                    // Add to tabs and switch to it
                    set({
                        tabs: [...get().tabs, newTab],
                        tabOrder: [...get().tabOrder, newTab.id],
                        activeTabId: newTab.id
                    });

                    // Restore new tab's empty state to main store
                    restoreTabState(newTab);

                    return newTab.id;
                },

                // =============================================================
                // CLOSE TAB
                // =============================================================
                closeTab: (tabId: string) => {
                    const state = get();
                    const tabIndex = state.tabs.findIndex(t => t.id === tabId);

                    if (tabIndex === -1) return false;

                    const tab = state.tabs[tabIndex];

                    // Warn if dirty
                    if (tab.isDirty) {
                        const confirmed = window.confirm(
                            `"${tab.name}" has unsaved changes. Close anyway?`
                        );
                        if (!confirmed) return false;
                    }

                    // If this is the last tab, create a new empty one
                    if (state.tabs.length === 1) {
                        const newTab = createEmptyTab();
                        set({
                            tabs: [newTab],
                            tabOrder: [newTab.id],
                            activeTabId: newTab.id
                        });
                        restoreTabState(newTab);
                        return true;
                    }

                    // Remove tab
                    const newTabs = state.tabs.filter(t => t.id !== tabId);
                    const newOrder = state.tabOrder.filter(id => id !== tabId);

                    // If closing active tab, switch to adjacent
                    let newActiveId = state.activeTabId;
                    if (state.activeTabId === tabId) {
                        const orderIndex = state.tabOrder.indexOf(tabId);
                        // Prefer the tab to the right, otherwise left
                        const newActiveIndex = orderIndex >= newOrder.length
                            ? newOrder.length - 1
                            : orderIndex;
                        newActiveId = newOrder[newActiveIndex];
                    }

                    set({
                        tabs: newTabs,
                        tabOrder: newOrder,
                        activeTabId: newActiveId
                    });

                    // Restore new active tab's state
                    const activeTab = newTabs.find(t => t.id === newActiveId);
                    if (activeTab) {
                        restoreTabState(activeTab);
                    }

                    return true;
                },

                // =============================================================
                // SWITCH TAB
                // =============================================================
                switchTab: (tabId: string) => {
                    const state = get();

                    if (tabId === state.activeTabId) return;

                    const targetTab = state.tabs.find(t => t.id === tabId);
                    if (!targetTab) return;

                    // Save current tab's state
                    if (state.activeTabId) {
                        const currentTab = state.tabs.find(t => t.id === state.activeTabId);
                        if (currentTab) {
                            const updatedTab = captureCurrentState(currentTab);
                            set({
                                tabs: state.tabs.map(t =>
                                    t.id === state.activeTabId ? updatedTab : t
                                )
                            });
                        }
                    }

                    // Switch active tab
                    set({ activeTabId: tabId });

                    // Restore target tab's state
                    restoreTabState(targetTab);
                },

                // =============================================================
                // RENAME TAB
                // =============================================================
                renameTab: (tabId: string, name: string) => {
                    const state = get();
                    set({
                        tabs: state.tabs.map(t =>
                            t.id === tabId
                                ? { ...t, name, projectName: name }
                                : t
                        )
                    });

                    // If active tab, also update main store
                    if (tabId === state.activeTabId) {
                        useStore.getState().setProjectName(name);
                    }
                },

                // =============================================================
                // DUPLICATE TAB
                // =============================================================
                duplicateTab: (tabId: string) => {
                    const state = get();
                    const sourceTab = state.tabs.find(t => t.id === tabId);

                    if (!sourceTab) return null;

                    // If duplicating active tab, capture latest state first
                    let tabToDuplicate = sourceTab;
                    if (tabId === state.activeTabId) {
                        tabToDuplicate = captureCurrentState(sourceTab);
                    }

                    const now = new Date().toISOString();
                    const newTab: CanvasTab = {
                        ...tabToDuplicate,
                        id: generateTabId(),
                        name: `${tabToDuplicate.name} (Copy)`,
                        projectName: `${tabToDuplicate.projectName} (Copy)`,
                        filePath: null, // Duplicates don't inherit file path
                        isDirty: true,
                        createdAt: now,
                        lastActiveAt: now,
                        widgets: tabToDuplicate.widgets.map(w => ({
                            ...w,
                            id: crypto.randomUUID() // New IDs for widgets
                        })),
                        connections: [] // Connections would be invalid with new widget IDs
                    };

                    // Insert after source tab
                    const sourceOrderIndex = state.tabOrder.indexOf(tabId);
                    const newOrder = [...state.tabOrder];
                    newOrder.splice(sourceOrderIndex + 1, 0, newTab.id);

                    set({
                        tabs: [...state.tabs, newTab],
                        tabOrder: newOrder
                    });

                    return newTab.id;
                },

                // =============================================================
                // REORDER TABS
                // =============================================================
                reorderTabs: (fromIndex: number, toIndex: number) => {
                    const state = get();
                    const newOrder = [...state.tabOrder];
                    const [removed] = newOrder.splice(fromIndex, 1);
                    newOrder.splice(toIndex, 0, removed);
                    set({ tabOrder: newOrder });
                },

                // =============================================================
                // UPDATE ACTIVE TAB STATE
                // =============================================================
                updateActiveTabState: () => {
                    const state = get();
                    if (!state.activeTabId) return;

                    const currentTab = state.tabs.find(t => t.id === state.activeTabId);
                    if (currentTab) {
                        const updatedTab = captureCurrentState(currentTab);
                        set({
                            tabs: state.tabs.map(t =>
                                t.id === state.activeTabId ? updatedTab : t
                            )
                        });
                    }
                },

                // =============================================================
                // SET TAB DIRTY
                // =============================================================
                setTabDirty: (tabId: string, dirty: boolean) => {
                    const state = get();
                    set({
                        tabs: state.tabs.map(t =>
                            t.id === tabId ? { ...t, isDirty: dirty } : t
                        )
                    });
                },

                // =============================================================
                // SET TAB FILE PATH
                // =============================================================
                setTabFilePath: (tabId: string, filePath: string | null) => {
                    const state = get();
                    set({
                        tabs: state.tabs.map(t =>
                            t.id === tabId ? { ...t, filePath } : t
                        )
                    });
                },

                // =============================================================
                // GET ACTIVE TAB
                // =============================================================
                getActiveTab: () => {
                    const state = get();
                    return state.tabs.find(t => t.id === state.activeTabId) || null;
                }
            };
        },
        {
            name: 'tsuper-workspace-store',
            storage: createJSONStorage(() => storage),
            // Don't persist workspace tabs - always start fresh
            // Each project/tab manages its own persistence
            partialize: () => ({}),
            // Skip hydration - we always start with a fresh empty tab
            skipHydration: true
        }
    )
);

// =============================================================================
// Keyboard Shortcuts Hook Helper
// =============================================================================

export const WORKSPACE_SHORTCUTS = {
    NEW_TAB: { key: 't', ctrlKey: true },
    CLOSE_TAB: { key: 'w', ctrlKey: true },
    NEXT_TAB: { key: 'Tab', ctrlKey: true },
    PREV_TAB: { key: 'Tab', ctrlKey: true, shiftKey: true }
};

// =============================================================================
// Dirty State Tracking
// Subscribe to main store changes and mark active tab as dirty
// =============================================================================

let lastWidgetHash = '';

const computeWidgetHash = (): string => {
    const { widgets, canvas } = useStore.getState();
    return JSON.stringify({
        widgetCount: widgets.length,
        positions: widgets.map(w => ({ id: w.id, x: w.position.x, y: w.position.y })),
        sizes: widgets.map(w => ({ id: w.id, w: w.size.width, h: w.size.height })),
        data: widgets.map(w => ({ id: w.id, data: w.data })),
        canvas
    });
};

// Initialize dirty tracking
export const initDirtyTracking = (): (() => void) => {
    // Capture initial hash
    lastWidgetHash = computeWidgetHash();

    // Subscribe to main store changes
    const unsubscribe = useStore.subscribe(() => {
        const currentHash = computeWidgetHash();

        if (currentHash !== lastWidgetHash) {
            lastWidgetHash = currentHash;

            const { activeTabId, setTabDirty } = useWorkspaceStore.getState();
            if (activeTabId) {
                setTabDirty(activeTabId, true);
            }
        }
    });

    return unsubscribe;
};
