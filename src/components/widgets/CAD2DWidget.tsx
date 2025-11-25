import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, Transformer, Text } from 'react-konva';
import { useStore } from '../../store/store';
import { Square, Circle as CircleIcon, Minus, Trash2, Download, MousePointer2, Grid as GridIcon, Type, Magnet } from 'lucide-react';

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
}

interface CAD2DWidgetProps {
    id: string;
    initialShapes?: Shape[];
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
                    points={[lineX, -y / scale, lineX, (-y + height) / scale]} // Optimize length
                    stroke="#ddd"
                    strokeWidth={1 / scale}
                    listening={false}
                />
            ))}
            {lines.horizontalLines.map((lineY, i) => (
                <Line
                    key={`h-${i}`}
                    points={[-x / scale, lineY, (-x + width) / scale, lineY]} // Optimize length
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

const PropertiesPanel: React.FC<{
    selectedShape: Shape | null;
    onUpdate: (updates: Partial<Shape>) => void;
}> = ({ selectedShape, onUpdate }) => {
    if (!selectedShape) {
        return (
            <div className="w-64 bg-gray-50 border-l border-gray-200 p-4 text-sm text-gray-500">
                Select a shape to view properties
            </div>
        );
    }

    return (
        <div className="w-64 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
            <h3 className="font-medium mb-4 text-gray-700">Properties</h3>

            <div className="space-y-4">
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

export const CAD2DWidget: React.FC<CAD2DWidgetProps> = ({ id, initialShapes = [] }) => {
    const [tool, setTool] = useState<Tool>('select');
    const [shapes, setShapes] = useState<Shape[]>(initialShapes);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentShape, setCurrentShape] = useState<Shape | null>(null);
    const [snapToGrid, setSnapToGrid] = useState(false); // Snap state
    const [snapToObjects, setSnapToObjects] = useState(true); // OSNAP state
    const [snapIndicator, setSnapIndicator] = useState<{ x: number, y: number, type: 'endpoint' | 'midpoint' | 'center' } | null>(null);
    const { updateWidget } = useStore();

    const getSnapPoints = (shapes: Shape[]) => {
        const points: { x: number, y: number, type: 'endpoint' | 'midpoint' | 'center' }[] = [];
        shapes.forEach(shape => {
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
                const y = shape.y || 0;
                const w = shape.width || 0;
                const h = shape.height || 0;
                // Corners (Endpoints)
                points.push({ x: x, y: y, type: 'endpoint' });
                points.push({ x: x + w, y: y, type: 'endpoint' });
                points.push({ x: x + w, y: y + h, type: 'endpoint' });
                points.push({ x: x, y: y + h, type: 'endpoint' });
                // Midpoints
                points.push({ x: x + w / 2, y: y, type: 'midpoint' });
                points.push({ x: x + w, y: y + h / 2, type: 'midpoint' });
                points.push({ x: x + w / 2, y: y + h, type: 'midpoint' });
                points.push({ x: x, y: y + h / 2, type: 'midpoint' });
                // Center
                points.push({ x: x + w / 2, y: y + h / 2, type: 'center' });
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

    const stageRef = useRef<any>(null);

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

    const saveShapes = (newShapes: Shape[]) => {
        setShapes(newShapes);
        updateWidget(id, { data: { shapes: newShapes } });
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
                    updatedShape.fontSize = Math.max(5, (shape.fontSize || 20) * scaleX); // Scale font size
                }
                // For lines, we might need more complex logic or just scale points
                // For now, let's skip line scaling logic or implement it later

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

        const clickedOnEmpty = e.target === e.target.getStage();
        if (!clickedOnEmpty) return;

        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();

        // Calculate raw local position
        const rawLocalPos = {
            x: (pos.x - stage.x()) / stage.scaleX(),
            y: (pos.y - stage.y()) / stage.scaleX(),
        };

        // Apply snapping
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
                    strokeWidth: 1, // Text usually doesn't have stroke width in the same way, but keeping for consistency
                    fill: '#000000'
                };
                saveShapes([...shapes, newShape]);
                setTool('select'); // Switch back to select after placing text
            }
            return;
        }

        const newShape: Shape = {
            id: crypto.randomUUID(),
            type: tool as any,
            stroke: '#000000',
            strokeWidth: 2 / stageScale,
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

        // Always calculate snap for indicator, even if not drawing
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
    };

    const clearAll = () => {
        saveShapes([]);
        setSelectedId(null); // Clear selection when clearing all
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

    return (
        <div className="w-full h-full flex flex-col bg-white">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50">
                <button
                    onClick={() => setTool('select')}
                    className={`p-2 rounded ${tool === 'select' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
                    title="Select (Pan/Zoom)"
                >
                    <MousePointer2 size={16} />
                </button>
                <div className="h-6 w-px bg-gray-300 mx-1" />
                <button
                    onClick={() => setTool('line')}
                    className={`p-2 rounded ${tool === 'line' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
                    title="Line"
                >
                    <Minus size={16} />
                </button>
                <button
                    onClick={() => setTool('rectangle')}
                    className={`p-2 rounded ${tool === 'rectangle' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
                    title="Rectangle"
                >
                    <Square size={16} />
                </button>
                <button
                    onClick={() => setTool('circle')}
                    className={`p-2 rounded ${tool === 'circle' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
                    title="Circle"
                >
                    <CircleIcon size={16} />
                </button>
                <button
                    onClick={() => setTool('text')}
                    className={`p-2 rounded ${tool === 'text' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
                    title="Text"
                >
                    <Type size={16} />
                </button>

                <div className="h-6 w-px bg-gray-300 mx-1" />

                <button
                    onClick={() => setSnapToGrid(!snapToGrid)}
                    className={`p-2 rounded ${snapToGrid ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-600'}`}
                    title="Snap to Grid"
                >
                    <GridIcon size={16} />
                </button>
                <button
                    onClick={() => setSnapToObjects(!snapToObjects)}
                    className={`p-2 rounded ${snapToObjects ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-600'}`}
                    title="Object Snap (OSNAP)"
                >
                    <Magnet size={16} />
                </button>

                <div className="h-6 w-px bg-gray-300 mx-1" />

                <button
                    onClick={clearAll}
                    className="p-2 hover:bg-red-50 text-red-600 rounded"
                    title="Clear All"
                >
                    <Trash2 size={16} />
                </button>
                <button
                    onClick={exportAsImage}
                    className="p-2 hover:bg-gray-200 rounded"
                    title="Export as Image"
                >
                    <Download size={16} />
                </button>

                <div className="ml-auto text-xs text-gray-500">
                    {Math.round(stageScale * 100)}%
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Canvas Container */}
                <div className="flex-1 bg-gray-100 relative overflow-hidden">
                    <Stage
                        ref={stageRef}
                        width={window.innerWidth}
                        height={window.innerHeight}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onWheel={handleWheel}
                        scaleX={stageScale}
                        scaleY={stageScale}
                        x={stagePos.x}
                        y={stagePos.y}
                        draggable={tool === 'select' && !selectedId} // Only pan if nothing selected (or maybe always pan with middle click?)
                        // Better interaction: Pan with middle click or spacebar. For now, let's say pan if clicking on empty space.
                        onDragEnd={(e) => {
                            if (e.target === stageRef.current) {
                                setStagePos({ x: e.target.x(), y: e.target.y() });
                            }
                        }}
                    >
                        <Grid
                            width={window.innerWidth}
                            height={window.innerHeight}
                            scale={stageScale}
                            x={stagePos.x}
                            y={stagePos.y}
                        />
                        <Layer>
                            {allShapes.map((shape) => {
                                const commonProps = {
                                    key: shape.id,
                                    id: shape.id,
                                    stroke: shape.stroke,
                                    strokeWidth: shape.strokeWidth,
                                    fill: shape.fill, // Add fill
                                    draggable: tool === 'select',
                                    onClick: (e: any) => handleShapeClick(e, shape.id),
                                    onTap: (e: any) => handleShapeClick(e, shape.id),
                                    onDragEnd: (e: any) => handleShapeDragEnd(e, shape.id),
                                    onTransformEnd: (e: any) => handleShapeTransformEnd(e, shape.id),
                                };

                                if (shape.type === 'line' && shape.points) {
                                    return (
                                        <Line
                                            {...commonProps}
                                            points={shape.points}
                                        />
                                    );
                                } else if (shape.type === 'rectangle') {
                                    return (
                                        <Rect
                                            {...commonProps}
                                            x={shape.x}
                                            y={shape.y}
                                            width={shape.width}
                                            height={shape.height}
                                        />
                                    );
                                } else if (shape.type === 'circle') {
                                    return (
                                        <Circle
                                            {...commonProps}
                                            x={shape.x}
                                            y={shape.y}
                                            radius={shape.radius}
                                        />
                                    );
                                } else if (shape.type === 'text') {
                                    return (
                                        <Text
                                            {...commonProps}
                                            x={shape.x}
                                            y={shape.y}
                                            text={shape.text}
                                            fontSize={shape.fontSize}
                                            fill={shape.fill || shape.stroke} // Text usually uses fill
                                        />
                                    );
                                }
                                return null;
                            })}

                            {selectedId && (
                                <Transformer
                                    ref={transformerRef}
                                    boundBoxFunc={(oldBox, newBox) => {
                                        // Limit resize
                                        if (newBox.width < 5 || newBox.height < 5) {
                                            return oldBox;
                                        }
                                        return newBox;
                                    }}
                                />
                            )}
                        </Layer>

                        {/* OSNAP Indicators Layer */}
                        <Layer>
                            {snapIndicator && (
                                <>
                                    {snapIndicator.type === 'endpoint' && (
                                        <Rect
                                            x={snapIndicator.x - 5 / stageScale}
                                            y={snapIndicator.y - 5 / stageScale}
                                            width={10 / stageScale}
                                            height={10 / stageScale}
                                            stroke="#ff0000"
                                            strokeWidth={2 / stageScale}
                                            listening={false}
                                        />
                                    )}
                                    {snapIndicator.type === 'midpoint' && (
                                        <Line
                                            points={[
                                                snapIndicator.x, snapIndicator.y - 6 / stageScale,
                                                snapIndicator.x - 5 / stageScale, snapIndicator.y + 4 / stageScale,
                                                snapIndicator.x + 5 / stageScale, snapIndicator.y + 4 / stageScale,
                                                snapIndicator.x, snapIndicator.y - 6 / stageScale
                                            ]}
                                            stroke="#00ff00"
                                            strokeWidth={2 / stageScale}
                                            closed
                                            listening={false}
                                        />
                                    )}
                                    {snapIndicator.type === 'center' && (
                                        <Circle
                                            x={snapIndicator.x}
                                            y={snapIndicator.y}
                                            radius={5 / stageScale}
                                            stroke="#0000ff"
                                            strokeWidth={2 / stageScale}
                                            listening={false}
                                        />
                                    )}
                                </>
                            )}
                        </Layer>
                    </Stage>
                </div>

                {/* Properties Panel */}
                <PropertiesPanel selectedShape={selectedShape} onUpdate={handleUpdateShape} />
            </div>
        </div>
    );
};
