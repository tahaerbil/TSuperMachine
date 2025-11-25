import { useState, useCallback } from 'react';
import { useStore } from '../../../../store/store';
import type { Shape, LayerData, Tool } from '../types';

export const useCADState = (id: string, initialShapes: Shape[] = [], initialLayers?: LayerData[]) => {
    const [tool, setTool] = useState<Tool>('select');
    const [shapes, setShapes] = useState<Shape[]>(initialShapes);
    const [layers, setLayers] = useState<LayerData[]>(initialLayers || [
        { id: 'layer-0', name: 'Layer 0', color: '#000000', visible: true, locked: false }
    ]);
    const [activeLayerId, setActiveLayerId] = useState<string>(layers[0]?.id || 'layer-0');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const { updateWidget } = useStore();

    const saveShapes = useCallback((newShapes: Shape[]) => {
        setShapes(newShapes);
        updateWidget(id, { data: { shapes: newShapes, layers } });
    }, [id, layers, updateWidget]);

    const handleAddLayer = useCallback(() => {
        const newLayer: LayerData = {
            id: crypto.randomUUID(),
            name: `Layer ${layers.length}`,
            color: '#000000',
            visible: true,
            locked: false
        };
        const newLayers = [...layers, newLayer];
        setLayers(newLayers);
        setActiveLayerId(newLayer.id);
        updateWidget(id, { data: { shapes, layers: newLayers } });
    }, [id, layers, shapes, updateWidget]);

    const handleUpdateLayer = useCallback((layerId: string, updates: Partial<LayerData>) => {
        const newLayers = layers.map(l => l.id === layerId ? { ...l, ...updates } : l);
        setLayers(newLayers);
        updateWidget(id, { data: { shapes, layers: newLayers } });
    }, [id, layers, shapes, updateWidget]);

    const handleDeleteLayer = useCallback((layerId: string) => {
        if (layers.length <= 1) return;
        const newLayers = layers.filter(l => l.id !== layerId);
        setLayers(newLayers);

        let newActiveId = activeLayerId;
        if (activeLayerId === layerId) {
            newActiveId = newLayers[0].id;
            setActiveLayerId(newActiveId);
        }

        const newShapes = shapes.map(s => s.layerId === layerId ? { ...s, layerId: newActiveId } : s);
        setShapes(newShapes);

        updateWidget(id, { data: { shapes: newShapes, layers: newLayers } });
    }, [id, layers, activeLayerId, shapes, updateWidget]);

    const handleUpdateShape = useCallback((updates: Partial<Shape>) => {
        if (!selectedId) return;
        const newShapes = shapes.map((shape) => {
            if (shape.id === selectedId) {
                return { ...shape, ...updates };
            }
            return shape;
        });
        saveShapes(newShapes);
    }, [selectedId, shapes, saveShapes]);

    const clearAll = useCallback(() => {
        saveShapes([]);
        setSelectedId(null);
    }, [saveShapes]);

    return {
        tool, setTool,
        shapes, setShapes,
        layers, setLayers,
        activeLayerId, setActiveLayerId,
        selectedId, setSelectedId,
        saveShapes,
        handleAddLayer,
        handleUpdateLayer,
        handleDeleteLayer,
        handleUpdateShape,
        clearAll
    };
};
