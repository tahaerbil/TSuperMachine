import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Connection, TriggerEvent, WireDragState } from '../core/services/automation/types';
import { connectionManager } from '../core/services/automation/connectionManager';

// Regular widget types + automation widget types
export type WidgetType =
    | 'NOTE' | 'CALCULATOR' | 'CAD_3D' | 'CAD_2D' | 'SPREADSHEET'
    | 'TODO' | 'SETTINGS' | 'IMAGE' | 'PDF' | 'PRESENTATION' | 'PROJECT'
    // Automation widgets
    | 'PDF_EXPORT' | 'CHART_GENERATOR' | 'DATA_LOGGER' | 'SCHEDULER'
    // AI Assistant
    | 'AI_ASSISTANT'
    // Data Vault (File Manager)
    | 'DATA_VAULT';

export type GridStyle = 'none' | 'lines' | 'dots';

export const DEFAULT_WIDGET_SIZES = {
    PORTRAIT: { width: 450, height: 636 },  // A4 Ratio (450 * 1.414)
    LANDSCAPE: { width: 636, height: 450 }, // A4 Ratio Transposed
    COMPACT: { width: 450, height: 500 }    // Compact size for automation widgets
};

export const getWidgetSize = (type: WidgetType) => {
    // Content-based orientation assignment
    switch (type) {
        case 'NOTE':
        case 'TODO':
        case 'PDF':
        case 'SETTINGS':
        case 'PROJECT':
        case 'AI_ASSISTANT':
        case 'DATA_VAULT':
            return DEFAULT_WIDGET_SIZES.PORTRAIT;

        // Automation widgets - compact size
        case 'PDF_EXPORT':
        case 'CHART_GENERATOR':
        case 'DATA_LOGGER':
        case 'SCHEDULER':
            return DEFAULT_WIDGET_SIZES.COMPACT;

        case 'CALCULATOR':
        case 'CAD_2D':
        case 'CAD_3D':
        case 'SPREADSHEET':
        case 'IMAGE':
        case 'PRESENTATION':
        default:
            return DEFAULT_WIDGET_SIZES.LANDSCAPE;
    }
};

export interface Widget {
    id: string;
    type: WidgetType;
    position: { x: number; y: number };
    size: { width: number; height: number };
    title: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
    zIndex: number;
    isMaximized?: boolean;
    isAutomation?: boolean; // True for automation widgets (different styling)
    attachedToId?: string | null; // ID of the widget this widget is attached to (parent)
}

interface AppState {
    widgets: Widget[];
    canvas: {
        scale: number;
        offset: { x: number; y: number };
    };
    activeWidgetId: string | null;
    selectedWidgetIds: string[];
    lastSelectedId: string | null;
    // Mode State
    appMode: 'intro' | 'workspace' | 'cad-standalone' | 'single-widget';
    activeSingleWidgetType: WidgetType | null;

    // Project Metadata
    projectName: string;
    projectMetadata: {
        created: string;
        modified: string;
        author: string;
    } | null;
    zoomSensitivity: number; // 1.0 = normal, higher = faster, lower = slower
    gridStyle: GridStyle; // Grid display style: none, lines, or dots

    // Widget Edit Mode - only one widget can be in edit mode at a time
    editingWidgetId: string | null;

    // Widget Focus Mode - for double-click to focus interaction
    focusedWidgetId: string | null;
    preFocusCanvasState: {
        scale: number;
        offset: { x: number; y: number };
    } | null;
    isAnimatingFocus: boolean; // Manual animation control flag

    // Automation System
    connections: Connection[];
    wireDragState: WireDragState;

    // Actions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addWidget: (type: WidgetType, position?: { x: number; y: number }, data?: any) => void;
    removeWidget: (id: string) => void;
    updateWidget: (id: string, updates: Partial<Widget>) => void;
    updateWidgets: (updates: { id: string; updates: Partial<Widget> }[]) => void;
    setCanvasOffset: (offset: { x: number; y: number }) => void;
    setCanvasScale: (scale: number) => void;
    setActiveWidget: (id: string | null) => void;
    bringToFront: (id: string) => void;
    clearAllWidgets: () => void;
    loadProjectState: (widgets: Widget[], canvas: { scale: number; offset: { x: number; y: number } }) => void;
    setProjectName: (name: string) => void;
    setProjectMetadata: (metadata: { created: string; modified: string; author: string }) => void;
    selectWidget: (id: string, mode: 'single' | 'add' | 'range') => void;
    selectMultiple: (ids: string[]) => void;
    clearSelection: () => void;
    toggleWidgetSelection: (id: string) => void;
    selectAll: () => void;
    setZoomSensitivity: (sensitivity: number) => void;
    setGridStyle: (style: GridStyle) => void;

    // Mode State Actions
    setAppMode: (mode: 'intro' | 'workspace' | 'cad-standalone' | 'single-widget') => void;
    setSingleWidgetMode: (type: WidgetType | null) => void;

    // Widget Edit Mode Actions
    enterEditMode: (widgetId: string) => void;
    exitEditMode: () => void;

    // Widget Focus Mode Actions
    enterFocusMode: (widgetId: string) => void;
    exitFocusMode: () => void;
    updateFocusView: () => void;

    // Automation Actions
    addConnection: (sourceWidgetId: string, targetWidgetId: string, triggerEvent: TriggerEvent, sourceHandle?: 'top' | 'right' | 'bottom' | 'left', targetHandle?: 'top' | 'right' | 'bottom' | 'left') => void;
    removeConnection: (connectionId: string) => void;
    toggleConnectionActive: (connectionId: string) => void;
    removeConnectionsForWidget: (widgetId: string) => void;
    setWireDragState: (state: Partial<WireDragState>) => void;
    clearWireDragState: () => void;
}

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            // Mode State
            appMode: 'intro',
            activeSingleWidgetType: null,
            setAppMode: (mode) => set({ appMode: mode }),
            setSingleWidgetMode: (type) => set({
                appMode: type ? 'single-widget' : 'intro',
                activeSingleWidgetType: type
            }),

            // Widget State
            widgets: [],
            canvas: {
                scale: 1,
                offset: { x: 0, y: 0 },
            },
            activeWidgetId: null,
            selectedWidgetIds: [],
            lastSelectedId: null,
            projectName: 'Untitled Project',
            projectMetadata: null,
            zoomSensitivity: 1.0,
            gridStyle: 'lines',
            editingWidgetId: null,
            focusedWidgetId: null,
            preFocusCanvasState: null,
            isAnimatingFocus: false,

            addWidget: (type, position = { x: 100, y: 100 }, data = {}) => set((state) => {
                const id = crypto.randomUUID();
                const maxZ = state.widgets.length > 0 ? Math.max(...state.widgets.map(w => w.zIndex)) : 0;
                const defaultSize = getWidgetSize(type);
                const newWidget: Widget = {
                    id, type, position, size: defaultSize,
                    title: type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' '),
                    zIndex: maxZ + 1, isMaximized: false, data
                };
                return { widgets: [...state.widgets, newWidget], activeWidgetId: id };
            }),

            removeWidget: (id) => set((state) => ({
                widgets: state.widgets.filter((w) => w.id !== id),
                activeWidgetId: state.activeWidgetId === id ? null : state.activeWidgetId
            })),

            updateWidget: (id, updates) => set((state) => ({
                widgets: state.widgets.map((w) => w.id === id ? { ...w, ...updates } : w)
            })),

            updateWidgets: (updatesList) => set((state) => {
                const updateMap = new Map(updatesList.map(u => [u.id, u.updates]));
                return {
                    widgets: state.widgets.map(w => {
                        const updates = updateMap.get(w.id);
                        return updates ? { ...w, ...updates } : w;
                    })
                };
            }),

            setCanvasOffset: (offset) => set((state) => ({ canvas: { ...state.canvas, offset } })),
            setCanvasScale: (scale) => set((state) => ({ canvas: { ...state.canvas, scale } })),
            setActiveWidget: (id) => set({ activeWidgetId: id }),

            bringToFront: (id) => set((state) => {
                const maxZ = state.widgets.length > 0 ? Math.max(...state.widgets.map(w => w.zIndex)) : 0;
                return { widgets: state.widgets.map(w => w.id === id ? { ...w, zIndex: maxZ + 1 } : w), activeWidgetId: id };
            }),

            clearAllWidgets: () => set({ widgets: [], activeWidgetId: null }),

            loadProjectState: (widgets, canvas) => set({ widgets, canvas, activeWidgetId: null }),

            setProjectName: (name) => set({ projectName: name }),
            setProjectMetadata: (metadata) => set({ projectMetadata: metadata }),

            selectWidget: (id, mode) => set((state) => {
                if (mode === 'single') return { selectedWidgetIds: [id], lastSelectedId: id, activeWidgetId: id };
                if (mode === 'add') {
                    const isSelected = state.selectedWidgetIds.includes(id);
                    return { selectedWidgetIds: isSelected ? state.selectedWidgetIds.filter(wid => wid !== id) : [...state.selectedWidgetIds, id], lastSelectedId: id };
                }
                if (mode === 'range') {
                    if (!state.lastSelectedId) return { selectedWidgetIds: [id], lastSelectedId: id };
                    const lastIndex = state.widgets.findIndex(w => w.id === state.lastSelectedId);
                    const currentIndex = state.widgets.findIndex(w => w.id === id);
                    if (lastIndex === -1 || currentIndex === -1) return state; // Safety check
                    const start = Math.min(lastIndex, currentIndex);
                    const end = Math.max(lastIndex, currentIndex);
                    const rangeIds = state.widgets.slice(start, end + 1).map(w => w.id);
                    return { selectedWidgetIds: rangeIds };
                }
                return state;
            }),

            selectMultiple: (ids) => set({ selectedWidgetIds: ids, lastSelectedId: ids[ids.length - 1] || null }),
            clearSelection: () => set({ selectedWidgetIds: [], lastSelectedId: null }),

            toggleWidgetSelection: (id) => set((state) => {
                const isSelected = state.selectedWidgetIds.includes(id);
                return { selectedWidgetIds: isSelected ? state.selectedWidgetIds.filter(wid => wid !== id) : [...state.selectedWidgetIds, id], lastSelectedId: id };
            }),

            selectAll: () => set((state) => ({ selectedWidgetIds: state.widgets.map(w => w.id), lastSelectedId: state.widgets[state.widgets.length - 1]?.id || null })),

            setZoomSensitivity: (sensitivity) => set({ zoomSensitivity: sensitivity }),
            setGridStyle: (style) => set({ gridStyle: style }),

            // Widget Edit Mode Actions
            enterEditMode: (widgetId) => set({ editingWidgetId: widgetId, activeWidgetId: widgetId }),
            exitEditMode: () => set({ editingWidgetId: null }),

            // Widget Focus Mode Actions
            enterFocusMode: (widgetId) => {
                // Find the widget to focus on
                const state = get();
                const widget = state.widgets.find(w => w.id === widgetId);
                if (!widget) return;

                // Save current canvas state for restoration
                const preFocusCanvasState = {
                    scale: state.canvas.scale,
                    offset: { ...state.canvas.offset }
                };

                // Calculate new canvas state to center and zoom on the widget
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                const targetScale = Math.min(
                    (viewportWidth * 0.7) / widget.size.width,
                    (viewportHeight * 0.7) / widget.size.height,
                    2
                );

                const widgetCenterX = widget.position.x + widget.size.width / 2;
                const widgetCenterY = widget.position.y + widget.size.height / 2;
                const newOffset = {
                    x: viewportWidth / 2 - widgetCenterX * targetScale,
                    y: viewportHeight / 2 - widgetCenterY * targetScale
                };

                // Phase 1: Set focus state and enable animation
                set({
                    focusedWidgetId: widgetId,
                    preFocusCanvasState,
                    activeWidgetId: widgetId,
                    isAnimatingFocus: true,
                });

                // Phase 2: Update canvas after a frame (so transition is applied first)
                requestAnimationFrame(() => {
                    set({
                        canvas: {
                            scale: targetScale,
                            offset: newOffset
                        }
                    });

                    // Disable animation after it completes
                    setTimeout(() => {
                        set({ isAnimatingFocus: false });
                    }, 450);
                });
            },

            exitFocusMode: () => {
                const state = get();
                if (!state.preFocusCanvasState) {
                    set({ focusedWidgetId: null, preFocusCanvasState: null, isAnimatingFocus: false });
                    return;
                }

                const savedCanvas = state.preFocusCanvasState;

                // Phase 1: Enable animation FIRST
                set({ isAnimatingFocus: true });

                // Phase 2: Restore canvas after a frame (transition is now active)
                requestAnimationFrame(() => {
                    set({
                        canvas: {
                            scale: savedCanvas.scale,
                            offset: savedCanvas.offset
                        }
                    });

                    // Phase 3: Clear focus state and animation flag after animation completes
                    setTimeout(() => {
                        set({ focusedWidgetId: null, preFocusCanvasState: null, isAnimatingFocus: false });
                    }, 450);
                });
            },

            // Update focus view when widget size changes
            updateFocusView: () => set((state) => {
                if (!state.focusedWidgetId) return state;

                const widget = state.widgets.find(w => w.id === state.focusedWidgetId);
                if (!widget) return state;

                // Recalculate canvas view to fit the updated widget
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                const targetScale = Math.min(
                    (viewportWidth * 0.7) / widget.size.width,
                    (viewportHeight * 0.7) / widget.size.height,
                    2
                );

                const widgetCenterX = widget.position.x + widget.size.width / 2;
                const widgetCenterY = widget.position.y + widget.size.height / 2;
                const newOffset = {
                    x: viewportWidth / 2 - widgetCenterX * targetScale,
                    y: viewportHeight / 2 - widgetCenterY * targetScale
                };

                return {
                    canvas: {
                        scale: targetScale,
                        offset: newOffset
                    }
                };
            }),

            // Automation State
            connections: [],
            wireDragState: {
                isDragging: false,
                sourceWidgetId: null,
                startPosition: null,
                currentPosition: null
            },

            // Automation Actions
            addConnection: (sourceWidgetId, targetWidgetId, triggerEvent, sourceHandle, targetHandle) => set((state) => {
                const newConnection = connectionManager.createConnection(
                    sourceWidgetId,
                    targetWidgetId,
                    triggerEvent,
                );
                // Manually add handle info as connectionManager might not support it yet (or update it next)
                const connectionWithHandles = {
                    ...newConnection,
                    sourceHandle,
                    targetHandle
                };
                return { connections: [...state.connections, connectionWithHandles] };
            }),

            removeConnection: (connectionId) => set((state) => ({
                connections: state.connections.filter(c => c.id !== connectionId)
            })),

            toggleConnectionActive: (connectionId) => set((state) => ({
                connections: state.connections.map(c =>
                    c.id === connectionId ? { ...c, isActive: !c.isActive } : c
                )
            })),

            removeConnectionsForWidget: (widgetId) => set((state) => ({
                connections: state.connections.filter(
                    c => c.sourceWidgetId !== widgetId && c.targetWidgetId !== widgetId
                )
            })),

            setWireDragState: (newState) => set((state) => ({
                wireDragState: { ...state.wireDragState, ...newState }
            })),

            clearWireDragState: () => set({
                wireDragState: {
                    isDragging: false,
                    sourceWidgetId: null,
                    startPosition: null,
                    currentPosition: null
                }
            }),
        }),
        {
            name: 'tsuper-storage',
            storage: createJSONStorage(() => ({
                getItem: async (name) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    if ((window as any).electronAPI) {
                        try {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const data = await (window as any).electronAPI.loadConfig();
                            if (data) return JSON.stringify(data);
                        } catch (e) {
                            console.error("Failed to load config from file", e);
                        }
                    }
                    return localStorage.getItem(name);
                },
                setItem: async (name, value) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    if ((window as any).electronAPI) {
                        try {
                            const parsed = JSON.parse(value);
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            await (window as any).electronAPI.saveConfig(parsed);
                        } catch (e) {
                            console.error("Failed to save config to file", e);
                        }
                    }
                    localStorage.setItem(name, value);
                },
                removeItem: async (name) => { localStorage.removeItem(name); },
            })),
            partialize: (state) => ({
                widgets: state.widgets,
                canvas: state.canvas,
                projectName: state.projectName,
                gridStyle: state.gridStyle,
                zoomSensitivity: state.zoomSensitivity,
                connections: state.connections // Persist connections too
            }),
        }
    )
);

// =============================================================================
// Utility Functions (called outside of store to avoid circular references)
// =============================================================================

/**
 * Get all connections for a specific widget (as source or target).
 */
export function getConnectionsForWidget(widgetId: string): Connection[] {
    const { connections } = useStore.getState();
    return connections.filter(
        c => c.sourceWidgetId === widgetId || c.targetWidgetId === widgetId
    );
}

/**
 * Get outgoing connections from a widget.
 */
export function getOutgoingConnections(widgetId: string): Connection[] {
    const { connections } = useStore.getState();
    return connections.filter(c => c.sourceWidgetId === widgetId);
}

/**
 * Get incoming connections to a widget.
 */
export function getIncomingConnections(widgetId: string): Connection[] {
    const { connections } = useStore.getState();
    return connections.filter(c => c.targetWidgetId === widgetId);
}
