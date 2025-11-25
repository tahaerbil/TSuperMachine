import React from 'react';
import { Stage, Layer, Line, Rect, Circle, Transformer, Text } from 'react-konva';
import { Grid } from './Grid';
import type { Shape, Tool, LayerData } from './types';

interface CAD2DCanvasProps {
    containerRef: React.RefObject<HTMLDivElement | null>;
    stageRef: React.RefObject<any>;
    transformerRef: React.RefObject<any>;
    shapes: Shape[];
    layers: LayerData[];
    tool: Tool;
    currentShape: Shape | null;
    stageScale: number;
    stagePos: { x: number, y: number };
    setStagePos: (pos: { x: number, y: number }) => void;
    snapIndicator: { x: number, y: number, type: 'endpoint' | 'midpoint' | 'center' } | null;
    handleMouseDown: (e: any) => void;
    handleMouseMove: (e: any) => void;
    handleMouseUp: () => void;
    handleWheel: (e: any) => void;
    handleShapeClick: (e: any, shapeId: string) => void;
    handleShapeDragEnd: (e: any, shapeId: string) => void;
    handleShapeTransformEnd: (e: any, shapeId: string) => void;
}

export const CAD2DCanvas: React.FC<CAD2DCanvasProps> = ({
    containerRef, stageRef, transformerRef,
    shapes, layers, tool,
    currentShape,
    stageScale, stagePos, setStagePos,
    snapIndicator,
    handleMouseDown, handleMouseMove, handleMouseUp, handleWheel,
    handleShapeClick, handleShapeDragEnd, handleShapeTransformEnd
}) => {

    // Filter visible shapes
    const visibleLayerIds = new Set(layers.filter(l => l.visible).map(l => l.id));
    const allShapes = currentShape ? [...shapes, currentShape] : shapes;
    const visibleShapes = allShapes.filter(s => !s.layerId || visibleLayerIds.has(s.layerId));

    return (
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
                                hitStrokeWidth={10}
                            />
                        );
                    } else if (shape.type === 'rectangle') {
                        return (
                            <Rect
                                {...commonProps}
                                width={shape.width}
                                height={shape.height}
                            />
                        );
                    } else if (shape.type === 'circle') {
                        return (
                            <Circle
                                {...commonProps}
                                radius={shape.radius}
                            />
                        );
                    } else if (shape.type === 'text') {
                        return (
                            <Text
                                {...commonProps}
                                text={shape.text}
                                fontSize={shape.fontSize}
                            />
                        );
                    }
                    return null;
                })}

                {/* Snap Indicator */}
                {snapIndicator && (
                    <Circle
                        x={snapIndicator.x}
                        y={snapIndicator.y}
                        radius={5 / stageScale}
                        stroke="orange"
                        strokeWidth={2 / stageScale}
                        listening={false}
                    />
                )}

                <Transformer ref={transformerRef} />
            </Layer>
        </Stage>
    );
};
