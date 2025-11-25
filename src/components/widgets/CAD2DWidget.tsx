import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, Transformer, Text, RegularPolygon } from 'react-konva';
import { useStore } from '../../store/store';
import { Square, Circle as CircleIcon, Minus, Plus, Trash2, Download, MousePointer2, Grid as GridIcon, Type, Magnet, Eye, EyeOff, Lock, Unlock, Layers, Upload, FileUp } from 'lucide-react';
import DxfParser from 'dxf-parser';
import Drawing from 'dxf-writer';

type Tool = 'line' | 'rectangle' | 'circle' | 'text' | 'select';

interface Shape {
    id: string;
    type: 'line' | 'rectangle' | 'circle' | 'text';
    points?: number[];
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    radius?: number;
    text?: string;
    fontSize?: number;
    stroke: string;
    strokeWidth: number;
    fill?: string;
    layerId?: string;
}

interface LayerData {
    id: string;
    name: string;
    color: string;
    visible: boolean;
    locked: boolean;
}

interface CAD2DWidgetProps {
    id: string;
    initialShapes?: Shape[];
    initialLayers?: LayerData[];
}

const Grid: React.FC<{ width: number; height: number; scale: number; x: number; y: number }> = ({ width, height, scale, x, y }) => {
    const gridSize = 50;
    const lines = useMemo(() => {
        const startX = Math.floor((-x / scale) / gridSize) * gridSize;
        const endX = Math.floor((-x / scale + width / scale) / gridSize) * gridSize;
        const startY = Math.floor((-y / scale) / gridSize) * gridSize;
        const endY = Math.floor((-y / scale + height / scale) / gridSize) * gridSize;

        const verticalLines = [];
        for (let i = startX; i <= endX; i += gridSize) {
            verticalLines.push(i);
        }

        const horizontalLines = [];
        for (let i = startY; i <= endY; i += gridSize) {
            horizontalLines.push(i);
        }

        return { verticalLines, horizontalLines };
    }, [width, height, scale, x, y]);

    return (
        <Layer>
            {lines.verticalLines.map((lineX, i) => (
                <Line
                    key={`v-${i}`}
                    points={[lineX, -y / scale, lineX, (-y + height) / scale]}
                    stroke="#ddd"
                    strokeWidth={1 / scale}
                    listening={false}
                />
            ))}
            {lines.horizontalLines.map((lineY, i) => (
                <Line
                    key={`h-${i}`}
                    points={[-x / scale, lineY, (-x + width) / scale, lineY]}
                    stroke="#ddd"
                    strokeWidth={1 / scale}
                    listening={false}
                />
            ))}
            {/* Origin Lines */}
            <Line points={[0, -10000, 0, 10000]} stroke="#bbb" strokeWidth={2 / scale} listening={false} />
            <Line points={[-10000, 0, 10000, 0]} stroke="#bbb" strokeWidth={2 / scale} listening={false} />
        </Layer>
    );
};

const LayersPanel: React.FC<{
    layers: LayerData[];
    activeLayerId: string;
    onUpdateLayer: (id: string, updates: Partial<LayerData>) => void;
    onSetActiveLayer: (id: string) => void;
    onAddLayer: () => void;
    onDeleteLayer: (id: string) => void;
}> = ({ layers, activeLayerId, onUpdateLayer, onSetActiveLayer, onAddLayer, onDeleteLayer }) => {
    return (
        <div className="w-64 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto flex flex-col h-1/2 border-b">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                    <Layers size={16} /> Layers
                </h3>
                <button onClick={onAddLayer} className="p-1 hover:bg-gray-200 rounded" title="Add Layer">
                    <Plus size={16} />
                </button>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto">
                {layers.map(layer => (
                    <div
                        key={layer.id}
                        className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${activeLayerId === layer.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}
                        onClick={() => onSetActiveLayer(layer.id)}
                    >
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: layer.color }} />
                        <input
                            value={layer.name}
                            onChange={(e) => onUpdateLayer(layer.id, { name: e.target.value })}
                            className="flex-1 bg-transparent text-sm focus:outline-none min-w-0"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            onClick={(e) => { e.stopPropagation(); onUpdateLayer(layer.id, { visible: !layer.visible }); }}
                            className={`p-1 rounded ${layer.visible ? 'text-gray-600' : 'text-gray-400'}`}
                            title={layer.visible ? "Hide Layer" : "Show Layer"}
                        >
                            {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onUpdateLayer(layer.id, { locked: !layer.locked }); }}
                            className={`p-1 rounded ${layer.locked ? 'text-red-500' : 'text-gray-400'}`}
                            title={layer.locked ? "Unlock Layer" : "Lock Layer"}
                        >
                            {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
                        </button>
                        {layers.length > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDeleteLayer(layer.id); }}
                                className="p-1 rounded text-gray-400 hover:text-red-500"
                                title="Delete Layer"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const PropertiesPanel: React.FC<{
    selectedShape: Shape | null;
    onUpdate: (updates: Partial<Shape>) => void;
    layers: LayerData[];
}> = ({ selectedShape, onUpdate, layers }) => {
    if (!selectedShape) {
        return (
            <div className="w-64 bg-gray-50 border-l border-gray-200 p-4 text-sm text-gray-500 h-1/2">
                Select a shape to view properties
            </div>
        );
    }

    return (
        <div className="w-64 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto h-1/2">
            <h3 className="font-medium mb-4 text-gray-700">Properties</h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Layer</label>
                    <select
                        value={selectedShape.layerId || layers[0]?.id}
                        onChange={(e) => onUpdate({ layerId: e.target.value })}
                        className="w-full px-2 py-1 text-sm border rounded"
                    >
                        {layers.map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                    <div className="text-sm capitalize">{selectedShape.type}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">X</label>
                        <input
                            type="number"
                            value={Math.round(selectedShape.x || 0)}
                            onChange={(e) => onUpdate({ x: Number(e.target.value) })}
                            className="w-full px-2 py-1 text-sm border rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Y</label>
                        <input
                            type="number"
                            value={Math.round(selectedShape.y || 0)}
                            onChange={(e) => onUpdate({ y: Number(e.target.value) })}
                            className="w-full px-2 py-1 text-sm border rounded"
                        />
                    </div>
                </div>

                {(selectedShape.type === 'rectangle' || selectedShape.type === 'circle') && (
                    <div className="grid grid-cols-2 gap-2">
                        {selectedShape.type === 'rectangle' ? (
                            <>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Width</label>
                                    <input
                                        type="number"
                                        value={Math.round(selectedShape.width || 0)}
                                        onChange={(e) => onUpdate({ width: Number(e.target.value) })}
                                        className="w-full px-2 py-1 text-sm border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Height</label>
                                    <input
                                        type="number"
                                        value={Math.round(selectedShape.height || 0)}
                                        onChange={(e) => onUpdate({ height: Number(e.target.value) })}
                                        className="w-full px-2 py-1 text-sm border rounded"
                                    />
                                </div>
                            </>
                        ) : (
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Radius</label>
                                <input
                                    type="number"
                                    value={Math.round(selectedShape.radius || 0)}
                                    onChange={(e) => onUpdate({ radius: Number(e.target.value) })}
                                    className="w-full px-2 py-1 text-sm border rounded"
                                />
                            </div>
                        )}
                    </div>
                )}

                {selectedShape.type === 'text' && (
                    <>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Text Content</label>
                            <input
                                type="text"
                                value={selectedShape.text || ''}
                                onChange={(e) => onUpdate({ text: e.target.value })}
                                className="w-full px-2 py-1 text-sm border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Font Size</label>
                            <input
                                type="number"
                                value={selectedShape.fontSize || 20}
                                onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
                                className="w-full px-2 py-1 text-sm border rounded"
                            />
                        </div>
                    </>
                )}

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Stroke Color</label>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={selectedShape.stroke}
                            onChange={(e) => onUpdate({ stroke: e.target.value })}
                            className="h-8 w-8 rounded cursor-pointer"
                        />
                        <input
                            type="text"
                            value={selectedShape.stroke}
                            onChange={(e) => onUpdate({ stroke: e.target.value })}
                            className="flex-1 px-2 py-1 text-sm border rounded"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Stroke Width</label>
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={selectedShape.strokeWidth}
                        onChange={(e) => onUpdate({ strokeWidth: Number(e.target.value) })}
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Fill Color</label>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={selectedShape.fill || '#ffffff'}
                            onChange={(e) => onUpdate({ fill: e.target.value })}
                            className="h-8 w-8 rounded cursor-pointer"
                        />
                        <button
                            onClick={() => onUpdate({ fill: undefined })}
                            className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                        >
                            None
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const CAD2DWidget: React.FC<CAD2DWidgetProps> = ({ id, initialShapes = [], initialLayers }) => {
    const [tool, setTool] = useState<Tool>('select');
    const [shapes, setShapes] = useState<Shape[]>(initialShapes);
    const [layers, setLayers] = useState<LayerData[]>(initialLayers || [
        { id: 'layer-0', name: 'Layer 0', color: '#000000', visible: true, locked: false }
    ]);
    const [activeLayerId, setActiveLayerId] = useState<string>(layers[0]?.id || 'layer-0');

    const [isDrawing, setIsDrawing] = useState(false);
    const [currentShape, setCurrentShape] = useState<Shape | null>(null);
    const [snapToGrid, setSnapToGrid] = useState(false);
    const [snapToObjects, setSnapToObjects] = useState(true);
    const [snapIndicator, setSnapIndicator] = useState<{ x: number, y: number, type: 'endpoint' | 'midpoint' | 'center' } | null>(null);
    const [inputValue, setInputValue] = useState('');
    const { updateWidget } = useStore();

    const stageRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [stageScale, setStageScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const transformerRef = useRef<any>(null);

    // Update transformer when selection changes
    useEffect(() => {
        if (selectedId && transformerRef.current && stageRef.current) {
            const node = stageRef.current.findOne('#' + selectedId);
            if (node) {
                transformerRef.current.nodes([node]);
                transformerRef.current.getLayer().batchDraw();
            }
        } else if (!selectedId && transformerRef.current) {
            transformerRef.current.nodes([]);
            transformerRef.current.getLayer().batchDraw();
        }
    }, [selectedId]);

    // Layer Management Functions
    const handleAddLayer = () => {
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
    };

    const handleUpdateLayer = (layerId: string, updates: Partial<LayerData>) => {
        const newLayers = layers.map(l => l.id === layerId ? { ...l, ...updates } : l);
        setLayers(newLayers);
        updateWidget(id, { data: { shapes, layers: newLayers } });
    };

    const handleDeleteLayer = (layerId: string) => {
        if (layers.length <= 1) return;
        const newLayers = layers.filter(l => l.id !== layerId);
        setLayers(newLayers);
        if (activeLayerId === layerId) {
            setActiveLayerId(newLayers[0].id);
        }
        const newActiveId = activeLayerId === layerId ? newLayers[0].id : activeLayerId;
        const newShapes = shapes.map(s => s.layerId === layerId ? { ...s, layerId: newActiveId } : s);
        setShapes(newShapes);

        updateWidget(id, { data: { shapes: newShapes, layers: newLayers } });
    };

    // DXF Import/Export
    const handleImportDXF = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) return;

            try {
                const parser = new DxfParser();
                const dxf = parser.parseSync(text);

                if (!dxf) {
                    alert('Failed to parse DXF file');
                    return;
                }

                // Import Layers
                const newLayers: LayerData[] = [];
                const layerMap = new Map<string, string>(); // DXF Layer Name -> Internal Layer ID

                if (dxf.tables && dxf.tables.layer && dxf.tables.layer.layers) {
                    Object.values(dxf.tables.layer.layers).forEach((layer: any) => {
                        const newId = crypto.randomUUID();
                        layerMap.set(layer.name, newId);
                        newLayers.push({
                            id: newId,
                            name: layer.name,
                            color: '#000000', // DXF colors are complex (ACI), defaulting to black for now
                            visible: layer.visible !== false,
                            locked: layer.frozen === true
                        });
                    });
                }

                if (newLayers.length === 0) {
                    const defaultId = crypto.randomUUID();
                    newLayers.push({ id: defaultId, name: '0', color: '#000000', visible: true, locked: false });
                    layerMap.set('0', defaultId);
                }

                // Import Entities
                const newShapes: Shape[] = [];
                if (dxf.entities) {
                    dxf.entities.forEach((entity: any) => {
                        const layerId = layerMap.get(entity.layer) || newLayers[0].id;
                        const common = {
                            id: crypto.randomUUID(),
                            layerId: layerId,
                            stroke: '#000000',
                            strokeWidth: 1,
                        };

                        if (entity.type === 'LINE') {
                            newShapes.push({
                                ...common,
                                type: 'line',
                                points: [entity.vertices[0].x, -entity.vertices[0].y, entity.vertices[1].x, -entity.vertices[1].y] // Flip Y for canvas
                            });
                        } else if (entity.type === 'CIRCLE') {
                            newShapes.push({
                                ...common,
                                type: 'circle',
                                x: entity.center.x,
                                y: -entity.center.y,
                                radius: entity.radius
                            });
                        } else if (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
                            // Treat as multiple lines for now, or implement Polyline shape
                            // For simplicity, let's just ignore or try to convert closed rects
                            // Ideally we need a Polyline shape. For now, let's skip complex polylines or break into lines.
                            if (entity.vertices && entity.vertices.length > 1) {
                                for (let i = 0; i < entity.vertices.length - 1; i++) {
                                    newShapes.push({
                                        ...common,
                                        id: crypto.randomUUID(),
                                        type: 'line',
                                        points: [entity.vertices[i].x, -entity.vertices[i].y, entity.vertices[i + 1].x, -entity.vertices[i + 1].y]
                                    });
                                }
                                if (entity.shape) { // Closed
                                    newShapes.push({
                                        ...common,
                                        id: crypto.randomUUID(),
                                        type: 'line',
                                        points: [entity.vertices[entity.vertices.length - 1].x, -entity.vertices[entity.vertices.length - 1].y, entity.vertices[0].x, -entity.vertices[0].y]
                                    });
                                }
                            }
                        } else if (entity.type === 'TEXT' || entity.type === 'MTEXT') {
                            newShapes.push({
                                ...common,
                                type: 'text',
                                x: entity.startPoint.x,
                                y: -entity.startPoint.y,
                                text: entity.text,
                                fontSize: entity.height || 12
                            });
                        }
                    });
                }

                setLayers(newLayers);
                setShapes(newShapes);
                setActiveLayerId(newLayers[0].id);
                updateWidget(id, { data: { shapes: newShapes, layers: newLayers } });

                // Reset view
                setStagePos({ x: 0, y: 0 });
                setStageScale(1);

            } catch (err) {
                console.error('DXF Import Error:', err);
                alert('Error importing DXF file');
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    const handleExportDXF = () => {
        try {
            const d = new Drawing() as any;

            // Define colors (unused for now but kept for reference if needed later)
            // const colors = { ... }; 

            // Add Layers
            layers.forEach(l => {
                d.addLayer(l.name, (Drawing as any).ACI.BLACK, 'CONTINUOUS');
            });

            // Add Entities
            shapes.forEach(s => {
                const layerName = layers.find(l => l.id === s.layerId)?.name || '0';

                if (s.type === 'line' && s.points) {
                    d.drawLine(s.points[0], -s.points[1], s.points[2], -s.points[3])
                        .setLayer(layerName);
                } else if (s.type === 'circle') {
                    d.drawCircle(s.x || 0, -(s.y || 0), s.radius || 0)
                        .setLayer(layerName);
                } else if (s.type === 'rectangle') {
                    // Draw as Polyline
                    const x = s.x || 0;
                    const y = -(s.y || 0); // Invert Y
                    const w = s.width || 0;
                    const h = -(s.height || 0); // Invert Height because Y is inverted

                    // Rect points in Canvas: (x,y) -> (x+w, y) -> (x+w, y+h) -> (x, y+h)
                    // Inverted Y: (x,-y) -> (x+w, -y) -> (x+w, -(y+h)) -> (x, -(y+h))
                    // Using local vars: (x, y) -> (x+w, y) -> (x+w, y+h) -> (x, y+h) 
                    // Wait, y is already inverted. h is inverted.
                    // So: (x, y) -> (x+w, y) -> (x+w, y+h) -> (x, y+h) is correct logic for inverted space?
                    // Let's trace:
                    // Top-Left: x, -s.y  => x, y
                    // Top-Right: x+s.w, -s.y => x+w, y
                    // Bottom-Right: x+s.w, -(s.y+s.h) => x+w, -(s.y) - s.h => x+w, y+h
                    // Bottom-Left: x, -(s.y+s.h) => x, y+h

                    d.drawPolyline([
                        [x, y],
                        [x + w, y],
                        [x + w, y + h],
                        [x, y + h],
                        [x, y] // Close it
                    ]).setLayer(layerName);

                } else if (s.type === 'text') {
                    d.drawText(s.x || 0, -(s.y || 0), s.fontSize || 12, 0, s.text || '')
                        .setLayer(layerName);
                }
            });

            const dxfString = d.toDxfString();
            const blob = new Blob([dxfString], { type: 'application/dxf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'drawing.dxf';
            link.click();
            URL.revokeObjectURL(url);

        } catch (err) {
            console.error('DXF Export Error:', err);
            alert('Error exporting DXF file');
        }
    };

    const getSnapPoints = (shapes: Shape[]) => {
        // Only snap to visible layers
        const visibleLayerIds = new Set(layers.filter(l => l.visible).map(l => l.id));
        const visibleShapes = shapes.filter(s => !s.layerId || visibleLayerIds.has(s.layerId));

        const points: { x: number, y: number, type: 'endpoint' | 'midpoint' | 'center' }[] = [];
        visibleShapes.forEach(shape => {
            if (shape.type === 'line' && shape.points) {
                // Endpoints
                points.push({ x: shape.points[0], y: shape.points[1], type: 'endpoint' });
                points.push({ x: shape.points[2], y: shape.points[3], type: 'endpoint' });
                // Midpoint
                points.push({
                    x: (shape.points[0] + shape.points[2]) / 2,
                    y: (shape.points[1] + shape.points[3]) / 2,
                    type: 'midpoint'
                });
            } else if (shape.type === 'rectangle') {
                const x = shape.x || 0;
                const _y = shape.y || 0;
                const _w = shape.width || 0;
                const _h = shape.height || 0;
                // Corners (Endpoints)
                points.push({ x: x, y: _y, type: 'endpoint' });
                points.push({ x: x + _w, y: _y, type: 'endpoint' });
                points.push({ x: x + _w, y: _y + _h, type: 'endpoint' });
                points.push({ x: x, y: _y + _h, type: 'endpoint' });
                // Midpoints
                points.push({ x: x + _w / 2, y: _y, type: 'midpoint' });
                points.push({ x: x + _w, y: _y + _h / 2, type: 'midpoint' });
                points.push({ x: x + _w / 2, y: _y + _h, type: 'midpoint' });
                points.push({ x: x, y: _y + _h / 2, type: 'midpoint' });
                // Center
                points.push({ x: x + _w / 2, y: _y + _h / 2, type: 'center' });
            } else if (shape.type === 'circle') {
                const x = shape.x || 0;
                const y = shape.y || 0;
                const r = shape.radius || 0;
                // Center
                points.push({ x: x, y: y, type: 'center' });
                // Quadrants (treated as endpoints/midpoints)
                points.push({ x: x + r, y: y, type: 'endpoint' });
                points.push({ x: x - r, y: y, type: 'endpoint' });
                points.push({ x: x, y: y + r, type: 'endpoint' });
                points.push({ x: x, y: y - r, type: 'endpoint' });
            }
        });
        return points;
    };

    const getSnappedPos = (pos: { x: number, y: number }, scale: number) => {
        let snappedPos = { ...pos };
        let indicator = null;

        // 1. Object Snap (Priority)
        if (snapToObjects) {
            const snapPoints = getSnapPoints(shapes);
            const threshold = 10 / scale; // 10px screen distance
            let closestDist = threshold;

            for (const point of snapPoints) {
                const dx = point.x - pos.x;
                const dy = point.y - pos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < closestDist) {
                    closestDist = dist;
                    snappedPos = { x: point.x, y: point.y };
                    indicator = point;
                }
            }
        }

        // 2. Grid Snap (Secondary)
        if (!indicator && snapToGrid) {
            const gridSize = 10;
            snappedPos = {
                x: Math.round(snappedPos.x / gridSize) * gridSize,
                y: Math.round(snappedPos.y / gridSize) * gridSize
            };
        }

        setSnapIndicator(indicator);
        return snappedPos;
    };

    // Handle Precision Input
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isDrawing) return;

            // Allow numbers, decimal point, and Backspace
            if (/^[0-9.]$/.test(e.key)) {
                setInputValue(prev => prev + e.key);
            } else if (e.key === 'Backspace') {
                setInputValue(prev => prev.slice(0, -1));
            } else if (e.key === 'Enter' && inputValue) {
                applyPrecisionInput();
            } else if (e.key === 'Escape') {
                setInputValue('');
                setIsDrawing(false);
                setCurrentShape(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDrawing, inputValue, currentShape]);

    const applyPrecisionInput = () => {
        if (!currentShape || !inputValue) return;
        const val = parseFloat(inputValue);
        if (isNaN(val)) return;

        const updatedShape = { ...currentShape };

        if (currentShape.type === 'line' && currentShape.points) {
            const [x1, y1, x2, y2] = currentShape.points;
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const newX = x1 + Math.cos(angle) * val;
            const newY = y1 + Math.sin(angle) * val;
            updatedShape.points = [x1, y1, newX, newY];
        } else if (currentShape.type === 'circle') {
            updatedShape.radius = val;
        } else if (currentShape.type === 'rectangle') {
            const wSign = Math.sign(currentShape.width || 1);
            const hSign = Math.sign(currentShape.height || 1);
            updatedShape.width = val * wSign;
            updatedShape.height = val * hSign;
        }

        saveShapes([...shapes, updatedShape]);
        setCurrentShape(null);
        setIsDrawing(false);
        setInputValue('');
    };

    const saveShapes = (newShapes: Shape[]) => {
        setShapes(newShapes);
        updateWidget(id, { data: { shapes: newShapes, layers } });
    };

    const handleUpdateShape = (updates: Partial<Shape>) => {
        if (!selectedId) return;
        const newShapes = shapes.map((shape) => {
            if (shape.id === selectedId) {
                return { ...shape, ...updates };
            }
            return shape;
        });
        saveShapes(newShapes);
    };

    const handleWheel = (e: any) => {
        e.evt.preventDefault();
        const scaleBy = 1.1;
        const stage = e.target.getStage();
        const oldScale = stage.scaleX();
        const mousePointTo = {
            x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
            y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
        };

        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

        setStageScale(newScale);
        setStagePos({
            x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
            y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale,
        });
    };

    const handleShapeClick = (e: any, shapeId: string) => {
        if (tool !== 'select') return;
        e.cancelBubble = true; // Prevent stage click
        setSelectedId(shapeId);
    };

    const snapValue = (val: number) => {
        if (!snapToGrid) return val;
        const gridSize = 10; // Snap precision
        return Math.round(val / gridSize) * gridSize;
    };

    const handleShapeDragEnd = (e: any, shapeId: string) => {
        const node = e.target;
        const newShapes = shapes.map((shape) => {
            if (shape.id === shapeId) {
                return {
                    ...shape,
                    x: snapValue(node.x()),
                    y: snapValue(node.y()),
                };
            }
            return shape;
        });
        // Update node position visually to snapped value
        node.position({ x: snapValue(node.x()), y: snapValue(node.y()) });
        saveShapes(newShapes);
    };

    const handleShapeTransformEnd = (e: any, shapeId: string) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // Reset scale to 1 and adjust dimensions/points
        node.scaleX(1);
        node.scaleY(1);

        const newShapes = shapes.map((shape) => {
            if (shape.id === shapeId) {
                const updatedShape = { ...shape, x: node.x(), y: node.y() };

                if (shape.type === 'rectangle') {
                    updatedShape.width = Math.max(5, (shape.width || 0) * scaleX);
                    updatedShape.height = Math.max(5, (shape.height || 0) * scaleY);
                } else if (shape.type === 'circle') {
                    updatedShape.radius = Math.max(5, (shape.radius || 0) * scaleX);
                } else if (shape.type === 'text') {
                    updatedShape.fontSize = Math.max(5, (shape.fontSize || 20) * scaleX);
                }

                return updatedShape;
            }
            return shape;
        });
        saveShapes(newShapes);
    };

    const handleMouseDown = (e: any) => {
        if (tool === 'select') {
            // Deselect if clicked on empty stage
            const clickedOnEmpty = e.target === e.target.getStage();
            if (clickedOnEmpty) {
                setSelectedId(null);
                if (transformerRef.current) {
                    transformerRef.current.nodes([]);
                }
            }
            return;
        }

        const activeLayer = layers.find(l => l.id === activeLayerId);
        if (activeLayer && activeLayer.locked) {
            alert('Active layer is locked. Cannot draw.');
            return;
        }

        const clickedOnEmpty = e.target === e.target.getStage();
        if (!clickedOnEmpty) return;

        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();

        const rawLocalPos = {
            x: (pos.x - stage.x()) / stage.scaleX(),
            y: (pos.y - stage.y()) / stage.scaleX(),
        };

        const localPos = getSnappedPos(rawLocalPos, stage.scaleX());

        if (tool === 'text') {
            const text = window.prompt('Enter text:', 'Text');
            if (text) {
                const newShape: Shape = {
                    id: crypto.randomUUID(),
                    type: 'text',
                    x: localPos.x,
                    y: localPos.y,
                    text: text,
                    fontSize: 20 / stageScale,
                    stroke: '#000000',
                    strokeWidth: 1,
                    fill: '#000000',
                    layerId: activeLayerId
                };
                saveShapes([...shapes, newShape]);
                setTool('select');
            }
            return;
        }

        const newShape: Shape = {
            id: crypto.randomUUID(),
            type: tool as any,
            stroke: '#000000',
            strokeWidth: 2 / stageScale,
            layerId: activeLayerId
        };

        if (tool === 'line') {
            newShape.points = [localPos.x, localPos.y, localPos.x, localPos.y];
        } else if (tool === 'rectangle') {
            newShape.x = localPos.x;
            newShape.y = localPos.y;
            newShape.width = 0;
            newShape.height = 0;
        } else if (tool === 'circle') {
            newShape.x = localPos.x;
            newShape.y = localPos.y;
            newShape.radius = 0;
        }

        setCurrentShape(newShape);
        setIsDrawing(true);
    };

    const handleMouseMove = (e: any) => {
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();

        const rawLocalPos = {
            x: (pos.x - stage.x()) / stage.scaleX(),
            y: (pos.y - stage.y()) / stage.scaleX(),
        };

        const localPos = getSnappedPos(rawLocalPos, stage.scaleX());

        if (!isDrawing || !currentShape) return;

        const updatedShape = { ...currentShape };

        if (tool === 'line' && updatedShape.points) {
            updatedShape.points = [updatedShape.points[0], updatedShape.points[1], localPos.x, localPos.y];
        } else if (tool === 'rectangle') {
            updatedShape.width = localPos.x - (updatedShape.x || 0);
            updatedShape.height = localPos.y - (updatedShape.y || 0);
        } else if (tool === 'circle') {
            const dx = localPos.x - (updatedShape.x || 0);
            const dy = localPos.y - (updatedShape.y || 0);
            updatedShape.radius = Math.sqrt(dx * dx + dy * dy);
        }

        setCurrentShape(updatedShape);
    };

    const handleMouseUp = () => {
        if (!isDrawing || !currentShape) return;

        saveShapes([...shapes, currentShape]);
        setCurrentShape(null);
        setIsDrawing(false);
        setInputValue('');
    };

    const clearAll = () => {
        saveShapes([]);
        setSelectedId(null);
    };

    const exportAsImage = () => {
        if (!stageRef.current) return;
        const uri = stageRef.current.toDataURL();
        const link = document.createElement('a');
        link.download = 'drawing.png';
        link.href = uri;
        link.click();
    };

    const allShapes = currentShape ? [...shapes, currentShape] : shapes;
    const selectedShape = shapes.find(s => s.id === selectedId) || null;

    const getCursorScreenPos = () => {
        if (!stageRef.current) return { x: 0, y: 0 };
        const stage = stageRef.current;
        const ptr = stage.getPointerPosition();
        if (!ptr) return { x: 0, y: 0 };
        return ptr;
    };

    const cursor = getCursorScreenPos();

    // Filter shapes for rendering
    const visibleLayerIds = new Set(layers.filter(l => l.visible).map(l => l.id));
    const visibleShapes = allShapes.filter(s => !s.layerId || visibleLayerIds.has(s.layerId));

    return (
        <div className="w-full h-full flex flex-col bg-white relative">
            {/* Toolbar */}
            <div className="h-12 border-b border-gray-200 bg-gray-50 flex items-center px-4 gap-2">
                <button
                    onClick={() => setTool('select')}
                    className={`p-1.5 rounded ${tool === 'select' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-600'}`}
                    title="Select Tool"
                >
                    <MousePointer2 size={16} />
                </button>
                <div className="h-6 w-px bg-gray-300 mx-1" />
                <button
                    onClick={() => setTool('line')}
                    className={`p-1.5 rounded ${tool === 'line' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-600'}`}
                    title="Line Tool"
                >
                    <Minus size={16} className="rotate-45" />
                </button>
                <button
                    onClick={() => setTool('rectangle')}
                    className={`p-1.5 rounded ${tool === 'rectangle' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-600'}`}
                    title="Rectangle Tool"
                >
                    <Square size={16} />
                </button>
                <button
                    onClick={() => setTool('circle')}
                    className={`p-1.5 rounded ${tool === 'circle' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-600'}`}
                    title="Circle Tool"
                >
                    <CircleIcon size={16} />
                </button>
                <button
                    onClick={() => setTool('text')}
                    className={`p-1.5 rounded ${tool === 'text' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-600'}`}
                    title="Text Tool"
                >
                    <Type size={16} />
                </button>

                <div className="h-6 w-px bg-gray-300 mx-1" />

                <button
                    onClick={() => setSnapToGrid(!snapToGrid)}
                    className={`p-1.5 rounded ${snapToGrid ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-600'}`}
                    title="Snap to Grid"
                >
                    <GridIcon size={16} />
                </button>
                <button
                    onClick={() => setSnapToObjects(!snapToObjects)}
                    className={`p-1.5 rounded ${snapToObjects ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-600'}`}
                    title="Object Snap (OSNAP)"
                >
                    <Magnet size={16} />
                </button>

                <div className="h-6 w-px bg-gray-300 mx-1" />

                <button
                    onClick={() => setStageScale(s => Math.max(0.1, s - 0.1))}
                    className="p-2 rounded hover:bg-gray-200 text-gray-600"
                    title="Zoom Out"
                >
                    <Minus size={16} />
                </button>
                <span className="text-xs w-12 text-center">{Math.round(stageScale * 100)}%</span>
                <button
                    onClick={() => setStageScale(s => Math.min(5, s + 0.1))}
                    className="p-2 rounded hover:bg-gray-200 text-gray-600"
                    title="Zoom In"
                >
                    <Plus size={16} />
                </button>

                <div className="flex-1" />

                {/* DXF Import/Export */}
                <input
                    type="file"
                    accept=".dxf"
                    ref={fileInputRef}
                    onChange={handleImportDXF}
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded hover:bg-gray-200 text-gray-600"
                    title="Import DXF"
                >
                    <FileUp size={16} />
                </button>
                <button
                    onClick={handleExportDXF}
                    className="p-2 rounded hover:bg-gray-200 text-gray-600"
                    title="Export DXF"
                >
                    <Upload size={16} className="rotate-180" />
                </button>

                <div className="h-6 w-px bg-gray-300 mx-1" />

                <button
                    onClick={clearAll}
                    className="p-2 rounded hover:bg-red-100 text-red-600"
                    title="Clear All"
                >
                    <Trash2 size={16} />
                </button>
                <button
                    onClick={exportAsImage}
                    className="p-2 rounded hover:bg-gray-200 text-gray-600"
                    title="Export Image"
                >
                    <Download size={16} />
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Canvas Container */}
                <div className="flex-1 bg-gray-100 relative overflow-hidden" ref={containerRef}>
                    <Stage
                        width={containerRef.current?.clientWidth || 800}
                        height={containerRef.current?.clientHeight || 600}
                        scaleX={stageScale}
                        scaleY={stageScale}
                        x={stagePos.x}
                        y={stagePos.y}
                        draggable={tool === 'select'}
                        onDragEnd={(e) => {
                            setStagePos({ x: e.target.x(), y: e.target.y() });
                        }}
                        onWheel={handleWheel}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        ref={stageRef}
                    >
                        <Grid width={2000} height={2000} scale={stageScale} x={stagePos.x} y={stagePos.y} />

                        <Layer>
                            {visibleShapes.map((shape) => {
                                const commonProps = {
                                    key: shape.id,
                                    id: shape.id,
                                    x: shape.x,
                                    y: shape.y,
                                    stroke: shape.stroke,
                                    strokeWidth: shape.strokeWidth,
                                    fill: shape.fill,
                                    draggable: tool === 'select' && !layers.find(l => l.id === shape.layerId)?.locked,
                                    onClick: (e: any) => handleShapeClick(e, shape.id),
                                    onDragEnd: (e: any) => handleShapeDragEnd(e, shape.id),
                                    onTransformEnd: (e: any) => handleShapeTransformEnd(e, shape.id),
                                };

                                if (shape.type === 'line' && shape.points) {
                                    return <Line {...commonProps} points={shape.points} />;
                                } else if (shape.type === 'rectangle') {
                                    return <Rect {...commonProps} width={shape.width} height={shape.height} />;
                                } else if (shape.type === 'circle') {
                                    return <Circle {...commonProps} radius={shape.radius} />;
                                } else if (shape.type === 'text') {
                                    return <Text {...commonProps} text={shape.text} fontSize={shape.fontSize} />;
                                }
                                return null;
                            })}
                        </Layer>

                        <Layer>
                            {selectedId && (
                                <Transformer
                                    ref={transformerRef}
                                    boundBoxFunc={(oldBox, newBox) => {
                                        if (newBox.width < 5 || newBox.height < 5) {
                                            return oldBox;
                                        }
                                        return newBox;
                                    }}
                                />
                            )}
                        </Layer>

                        <Layer>
                            {snapIndicator && (
                                <>
                                    {snapIndicator.type === 'endpoint' && (
                                        <Rect
                                            x={snapIndicator.x - 5 / stageScale}
                                            y={snapIndicator.y - 5 / stageScale}
                                            width={10 / stageScale}
                                            height={10 / stageScale}
                                            stroke="red"
                                            strokeWidth={2 / stageScale}
                                        />
                                    )}
                                    {snapIndicator.type === 'midpoint' && (
                                        <RegularPolygon
                                            x={snapIndicator.x}
                                            y={snapIndicator.y}
                                            sides={3}
                                            radius={8 / stageScale}
                                            stroke="green"
                                            strokeWidth={2 / stageScale}
                                        />
                                    )}
                                    {snapIndicator.type === 'center' && (
                                        <Circle
                                            x={snapIndicator.x}
                                            y={snapIndicator.y}
                                            radius={5 / stageScale}
                                            stroke="blue"
                                            strokeWidth={2 / stageScale}
                                        />
                                    )}
                                </>
                            )}
                        </Layer>
                    </Stage>

                    {/* Dynamic Input Overlay */}
                    {isDrawing && (
                        <div
                            style={{
                                position: 'absolute',
                                left: cursor.x + 20,
                                top: cursor.y + 20,
                                pointerEvents: 'none'
                            }}
                            className="bg-gray-800 text-white px-2 py-1 rounded text-xs shadow-lg flex items-center gap-2 z-50"
                        >
                            <span className="text-gray-400">Length:</span>
                            <span className="font-mono">{inputValue || (currentShape ? getCurrentLength(currentShape) : '0')}</span>
                        </div>
                    )}
                </div>

                {/* Right Panel: Layers + Properties */}
                <div className="flex flex-col border-l border-gray-200">
                    <LayersPanel
                        layers={layers}
                        activeLayerId={activeLayerId}
                        onUpdateLayer={handleUpdateLayer}
                        onSetActiveLayer={setActiveLayerId}
                        onAddLayer={handleAddLayer}
                        onDeleteLayer={handleDeleteLayer}
                    />
                    <PropertiesPanel selectedShape={selectedShape} onUpdate={handleUpdateShape} layers={layers} />
                </div>
            </div>
        </div>
    );
};

// Helper to display current length while drawing
const getCurrentLength = (shape: Shape) => {
    if (shape.type === 'line' && shape.points) {
        const [x1, y1, x2, y2] = shape.points;
        return Math.round(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))).toString();
    } else if (shape.type === 'circle') {
        return Math.round(shape.radius || 0).toString();
    } else if (shape.type === 'rectangle') {
        return `${Math.round(Math.abs(shape.width || 0))} x ${Math.round(Math.abs(shape.height || 0))} `;
    }
    return '';
};
