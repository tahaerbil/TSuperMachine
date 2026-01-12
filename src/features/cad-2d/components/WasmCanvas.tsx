import React, { useRef, useEffect } from 'react';
import { cadEngine, type SnapPoint } from '../../../core/services/cad-engine/CADEngine';
import { CanvasRenderer, type CADGridStyle } from '../utils/CanvasRenderer';

interface WasmCanvasProps {
    width: number;
    height: number;
    scale: number;
    offset: { x: number; y: number };
    version: number;
    previewLine?: { x1: number, y1: number, x2: number, y2: number } | null;
    previewCircle?: { cx: number, cy: number, r: number } | null;
    previewPolyline?: { x: number, y: number }[] | null;
    previewRectangle?: { x1: number, y1: number, x2: number, y2: number } | null;
    previewArc?: { cx: number, cy: number, r: number, start: number, end: number } | null;
    movePreview?: { dx: number, dy: number } | null;
    copyPreview?: { dx: number, dy: number } | null;
    selectionBox?: { start: { x: number, y: number }, end: { x: number, y: number }, type: 'window' | 'crossing' } | null;
    rotatePreview?: { cx: number, cy: number, angle: number } | null;
    activeSnap?: SnapPoint | null;
    gridStyle?: CADGridStyle;
}

export const WasmCanvas: React.FC<WasmCanvasProps> = ({
    width, height, scale, offset, version,
    previewLine, previewCircle, previewPolyline, previewRectangle, previewArc,
    movePreview, copyPreview, selectionBox, rotatePreview,
    activeSnap, gridStyle = 'lines'
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // High-DPI support: scale canvas buffer for sharp rendering
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // Instantiate Renderer
        const renderer = new CanvasRenderer(ctx, scale, offset);

        // 1. Clear Canvas
        renderer.clear(width, height);

        // 2. Draw Grid & Axes
        renderer.drawGrid(gridStyle, width, height);
        renderer.drawAxes();

        // 3. Draw Entities (using C++ buffer)
        const buffer = cadEngine.getRenderBuffer();
        renderer.drawEntities(buffer, {
            movePreview,
            copyPreview,
            rotatePreview
        });

        // 4. Draw Command Previews (Line, Circle etc.)
        renderer.drawPreviews({
            previewLine,
            previewCircle,
            previewPolyline,
            previewRectangle,
            previewArc
        });

        // 5. Draw Selection Box
        renderer.drawSelectionBox(selectionBox);

        // 6. Draw Snap Marker
        renderer.drawSnapMarker(activeSnap);

    }, [
        width, height, scale, offset, version,
        previewLine, previewCircle, previewPolyline, previewRectangle, previewArc,
        movePreview, copyPreview, selectionBox, rotatePreview,
        activeSnap, gridStyle
    ]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${width}px`,
                height: `${height}px`,
                pointerEvents: 'none' // Clicks are handled by parent/overlay
            }}
        />
    );
};
