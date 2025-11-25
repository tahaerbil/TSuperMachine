import React, { useState, useRef, useEffect } from 'react';
import type { CAD2DWidgetProps, Shape } from './types';
import { useCADState } from './hooks/useCADState';
import { useSnapping } from './hooks/useSnapping';
import { useDXF } from './hooks/useDXF';
import { Toolbar } from './Toolbar';
import { CAD2DCanvas } from './CAD2DCanvas';
import { LayersPanel } from './LayersPanel';
import { PropertiesPanel } from './PropertiesPanel';

export const CAD2DWidget: React.FC<CAD2DWidgetProps> = ({ id, initialShapes = [], initialLayers, isMaximized = false }) => {
    // State Management
    const {
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
    } = useCADState(id, initialShapes, initialLayers);

    // Drawing State
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentShape, setCurrentShape] = useState<Shape | null>(null);
    const [inputValue, setInputValue] = useState('');

    // View State
    const [stageScale, setStageScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

    // Refs
    const stageRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const transformerRef = useRef<any>(null);

    // Snapping
    const {
        snapToGrid, setSnapToGrid,
        snapToObjects, setSnapToObjects,
        snapIndicator,
        getSnappedPos,
        snapValue
    } = useSnapping(shapes, layers);

    // DXF Import/Export
    const { handleImportDXF, handleExportDXF } = useDXF(
        id, shapes, layers,
        setShapes, setLayers, setActiveLayerId,
        setStagePos, setStageScale
    );

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

    // Handle Precision Input
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isDrawing) return;

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
        e.cancelBubble = true;
        setSelectedId(shapeId);
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
        node.position({ x: snapValue(node.x()), y: snapValue(node.y()) });
        saveShapes(newShapes);
    };

    const handleShapeTransformEnd = (e: any, shapeId: string) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

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

    const exportAsImage = () => {
        if (!stageRef.current) return;
        const uri = stageRef.current.toDataURL();
        const link = document.createElement('a');
        link.download = 'drawing.png';
        link.href = uri;
        link.click();
    };

    const selectedShape = shapes.find(s => s.id === selectedId) || null;

    const getCursorScreenPos = () => {
        if (!stageRef.current) return { x: 0, y: 0 };
        const stage = stageRef.current;
        const ptr = stage.getPointerPosition();
        if (!ptr) return { x: 0, y: 0 };
        return ptr;
    };

    const cursor = getCursorScreenPos();

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

    return (
        <div className="w-full h-full flex flex-col bg-white relative">
            {/* Toolbar - Only visible when maximized */}
            {isMaximized && (
                <Toolbar
                    tool={tool}
                    setTool={setTool}
                    snapToGrid={snapToGrid}
                    setSnapToGrid={setSnapToGrid}
                    snapToObjects={snapToObjects}
                    setSnapToObjects={setSnapToObjects}
                    stageScale={stageScale}
                    setStageScale={setStageScale}
                    fileInputRef={fileInputRef}
                    handleImportDXF={handleImportDXF}
                    handleExportDXF={handleExportDXF}
                    clearAll={clearAll}
                    exportAsImage={exportAsImage}
                />
            )}

            <div className="flex-1 flex overflow-hidden relative">
                {/* Canvas Container */}
                <div className="flex-1 bg-gray-100 relative overflow-hidden" ref={containerRef}>
                    <CAD2DCanvas
                        containerRef={containerRef}
                        stageRef={stageRef}
                        transformerRef={transformerRef}
                        shapes={shapes}
                        layers={layers}
                        tool={tool}
                        currentShape={currentShape}
                        stageScale={stageScale}
                        stagePos={stagePos}
                        setStagePos={setStagePos}
                        snapIndicator={snapIndicator}
                        handleMouseDown={handleMouseDown}
                        handleMouseMove={handleMouseMove}
                        handleMouseUp={handleMouseUp}
                        handleWheel={handleWheel}
                        handleShapeClick={handleShapeClick}
                        handleShapeDragEnd={handleShapeDragEnd}
                        handleShapeTransformEnd={handleShapeTransformEnd}
                    />

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

                {/* Right Panel: Layers + Properties - Only visible when maximized */}
                {isMaximized && (
                    <div className="flex flex-col border-l border-gray-200">
                        <LayersPanel
                            layers={layers}
                            activeLayerId={activeLayerId}
                            onUpdateLayer={handleUpdateLayer}
                            onSetActiveLayer={setActiveLayerId}
                            onAddLayer={handleAddLayer}
                            onDeleteLayer={handleDeleteLayer}
                        />
                        <PropertiesPanel selectedShape={selectedShape} onUpdate={handleUpdateShape} />
                    </div>
                )}
            </div>
        </div>
    );
};
