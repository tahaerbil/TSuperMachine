import React, { useState, useRef } from 'react';
import { Stage, Layer, Line, Rect, Circle } from 'react-konva';
import { useStore } from '../../store/store';
import { Square, Circle as CircleIcon, Minus, Trash2, Download } from 'lucide-react';

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
    stroke: string;
    strokeWidth: number;
}

interface CAD2DWidgetProps {
    id: string;
    initialShapes?: Shape[];
}

export const CAD2DWidget: React.FC<CAD2DWidgetProps> = ({ id, initialShapes = [] }) => {
    const [tool, setTool] = useState<Tool>('select');
    const [shapes, setShapes] = useState<Shape[]>(initialShapes);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentShape, setCurrentShape] = useState<Shape | null>(null);
    const { updateWidget } = useStore();

    const stageRef = useRef<any>(null);

    const saveShapes = (newShapes: Shape[]) => {
        setShapes(newShapes);
        updateWidget(id, { data: { shapes: newShapes } });
    };

    const handleMouseDown = (e: any) => {
        if (tool === 'select') return;

        const pos = e.target.getStage().getPointerPosition();
        const newShape: Shape = {
            id: crypto.randomUUID(),
            type: tool as any,
            stroke: '#000000',
            strokeWidth: 2,
        };

        if (tool === 'line') {
            newShape.points = [pos.x, pos.y, pos.x, pos.y];
        } else if (tool === 'rectangle') {
            newShape.x = pos.x;
            newShape.y = pos.y;
            newShape.width = 0;
            newShape.height = 0;
        } else if (tool === 'circle') {
            newShape.x = pos.x;
            newShape.y = pos.y;
            newShape.radius = 0;
        }

        setCurrentShape(newShape);
        setIsDrawing(true);
    };

    const handleMouseMove = (e: any) => {
        if (!isDrawing || !currentShape) return;

        const pos = e.target.getStage().getPointerPosition();
        const updatedShape = { ...currentShape };

        if (tool === 'line' && updatedShape.points) {
            updatedShape.points = [updatedShape.points[0], updatedShape.points[1], pos.x, pos.y];
        } else if (tool === 'rectangle') {
            updatedShape.width = pos.x - (updatedShape.x || 0);
            updatedShape.height = pos.y - (updatedShape.y || 0);
        } else if (tool === 'circle') {
            const dx = pos.x - (updatedShape.x || 0);
            const dy = pos.y - (updatedShape.y || 0);
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

    return (
        <div className="w-full h-full flex flex-col bg-white">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50">
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
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-hidden bg-white">
                <Stage
                    ref={stageRef}
                    width={window.innerWidth}
                    height={window.innerHeight}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                >
                    <Layer>
                        {allShapes.map((shape) => {
                            if (shape.type === 'line' && shape.points) {
                                return (
                                    <Line
                                        key={shape.id}
                                        points={shape.points}
                                        stroke={shape.stroke}
                                        strokeWidth={shape.strokeWidth}
                                    />
                                );
                            } else if (shape.type === 'rectangle') {
                                return (
                                    <Rect
                                        key={shape.id}
                                        x={shape.x}
                                        y={shape.y}
                                        width={shape.width}
                                        height={shape.height}
                                        stroke={shape.stroke}
                                        strokeWidth={shape.strokeWidth}
                                    />
                                );
                            } else if (shape.type === 'circle') {
                                return (
                                    <Circle
                                        key={shape.id}
                                        x={shape.x}
                                        y={shape.y}
                                        radius={shape.radius}
                                        stroke={shape.stroke}
                                        strokeWidth={shape.strokeWidth}
                                    />
                                );
                            }
                            return null;
                        })}
                    </Layer>
                </Stage>
            </div>
        </div>
    );
};
