import { create } from 'zustand';

export type WidgetType = 'NOTE' | 'CALCULATOR' | 'CAD_3D' | 'CAD_2D' | 'SPREADSHEET' | 'TODO' | 'SETTINGS' | 'IMAGE' | 'PDF' | 'PRESENTATION' | 'PROJECT';

export interface Widget {
    id: string;
    type: WidgetType;
    position: { x: number; y: number };
    size: { width: number; height: number };
    title: string;
    data?: any;
    zIndex: number;
    isMaximized?: boolean;
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
    projectName: string;
    projectMetadata: {
        created: string;
        modified: string;
        author: string;
    } | null;
    zoomSensitivity: number; // 1.0 = normal, higher = faster, lower = slower

    // Actions
    addWidget: (type: WidgetType, position?: { x: number; y: number }) => void;
    removeWidget: (id: string) => void;
    updateWidget: (id: string, updates: Partial<Widget>) => void;
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
}

export const useStore = create<AppState>((set) => ({
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
    zoomSensitivity: 1.0, // Default: normal speed

    addWidget: (type, position = { x: 100, y: 100 }) => set((state) => {
        const id = crypto.randomUUID();
        const maxZ = state.widgets.length > 0 ? Math.max(...state.widgets.map(w => w.zIndex)) : 0;

        let defaultSize = { width: 300, height: 200 };
        if (type === 'CAD_2D' || type === 'CAD_3D' || type === 'SPREADSHEET') {
            defaultSize = { width: 800, height: 600 };
        }

        const newWidget: Widget = {
            id,
            type,
            position,
            size: defaultSize,
            title: type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' '),
            zIndex: maxZ + 1,
            isMaximized: false,
        };

        return {
            widgets: [...state.widgets, newWidget],
            activeWidgetId: id
        };
    }),

    removeWidget: (id) => set((state) => ({
        widgets: state.widgets.filter((w) => w.id !== id),
        activeWidgetId: state.activeWidgetId === id ? null : state.activeWidgetId
    })),

    updateWidget: (id, updates) => set((state) => ({
        widgets: state.widgets.map((w) => w.id === id ? { ...w, ...updates } : w)
    })),

    setCanvasOffset: (offset) => set((state) => ({
        canvas: { ...state.canvas, offset }
    })),

    setCanvasScale: (scale) => set((state) => ({
        canvas: { ...state.canvas, scale }
    })),

    setActiveWidget: (id) => set({ activeWidgetId: id }),

    bringToFront: (id) => set((state) => {
        const maxZ = state.widgets.length > 0 ? Math.max(...state.widgets.map(w => w.zIndex)) : 0;
        return {
            widgets: state.widgets.map(w => w.id === id ? { ...w, zIndex: maxZ + 1 } : w),
            activeWidgetId: id
        };
    }),

    clearAllWidgets: () => set({
        widgets: [],
        activeWidgetId: null
    }),

    loadProjectState: (widgets, canvas) => set({
        widgets,
        canvas,
        activeWidgetId: null
    }),

    setProjectName: (name) => set({ projectName: name }),

    setProjectMetadata: (metadata) => set({ projectMetadata: metadata }),

    selectWidget: (id, mode) => set((state) => {
        if (mode === 'single') {
            return {
                selectedWidgetIds: [id],
                lastSelectedId: id,
                activeWidgetId: id
            };
        } else if (mode === 'add') {
            const isSelected = state.selectedWidgetIds.includes(id);
            return {
                selectedWidgetIds: isSelected
                    ? state.selectedWidgetIds.filter(wid => wid !== id)
                    : [...state.selectedWidgetIds, id],
                lastSelectedId: id
            };
        } else if (mode === 'range') {
            if (!state.lastSelectedId) {
                return { selectedWidgetIds: [id], lastSelectedId: id };
            }
            const lastIndex = state.widgets.findIndex(w => w.id === state.lastSelectedId);
            const currentIndex = state.widgets.findIndex(w => w.id === id);
            const start = Math.min(lastIndex, currentIndex);
            const end = Math.max(lastIndex, currentIndex);
            const rangeIds = state.widgets.slice(start, end + 1).map(w => w.id);
            return { selectedWidgetIds: rangeIds };
        }
        return state;
    }),

    selectMultiple: (ids) => set({
        selectedWidgetIds: ids,
        lastSelectedId: ids[ids.length - 1] || null
    }),

    clearSelection: () => set({
        selectedWidgetIds: [],
        lastSelectedId: null
    }),

    toggleWidgetSelection: (id) => set((state) => {
        const isSelected = state.selectedWidgetIds.includes(id);
        return {
            selectedWidgetIds: isSelected
                ? state.selectedWidgetIds.filter(wid => wid !== id)
                : [...state.selectedWidgetIds, id],
            lastSelectedId: id
        };
    }),

    selectAll: () => set((state) => ({
        selectedWidgetIds: state.widgets.map(w => w.id),
        lastSelectedId: state.widgets[state.widgets.length - 1]?.id || null
    })),

    setZoomSensitivity: (sensitivity) => set({ zoomSensitivity: sensitivity }),
}));


