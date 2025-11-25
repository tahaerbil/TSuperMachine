import React, { useRef, useEffect } from 'react';
import { cadEngine, SnapType, type SnapPoint } from './CADEngine';

interface WasmCanvasProps {
    width: number;
    height: number;
    scale: number;
    offset: { x: number; y: number };
    version: number; // Increment to force re-render
    previewLine?: { x1: number, y1: number, x2: number, y2: number } | null;
    previewCircle?: { cx: number, cy: number, r: number } | null;
    activeSnap?: SnapPoint | null;
}

export const WasmCanvas: React.FC<WasmCanvasProps> = ({ width, height, scale, offset, version, previewLine, previewCircle, activeSnap }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Transform Context
        ctx.save();
        ctx.translate(offset.x, offset.y);
        ctx.scale(scale, scale);

        // Draw Grid (AutoCAD Style)
        ctx.strokeStyle = '#333333'; // Darker grid lines
        ctx.lineWidth = 1 / scale;
        ctx.beginPath();
        // Optimize grid drawing: only draw visible area
        // (Simplified for now, drawing large range)
        for (let x = -10000; x <= 10000; x += 50) {
            ctx.moveTo(x, -10000);
            ctx.lineTo(x, 10000);
        }
        for (let y = -10000; y <= 10000; y += 50) {
            ctx.moveTo(-10000, y);
            ctx.lineTo(10000, y);
        }
        ctx.stroke();

        // Draw Axes
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 2 / scale;
        ctx.beginPath();
        ctx.moveTo(-10000, 0); ctx.lineTo(10000, 0); // X Axis
        ctx.moveTo(0, -10000); ctx.lineTo(0, 10000); // Y Axis
        ctx.stroke();

        // Draw C++ Buffer
        const buffer = cadEngine.getRenderBuffer();
        if (buffer.length > 0) {
            // Render loop
            const STRIDE = 7; // [Type, Data..., Color, Selected]

            for (let i = 0; i < buffer.length; i += STRIDE) {
                const type = buffer[i];
                const isSelected = buffer[i + 6] > 0.5;

                ctx.beginPath();

                if (isSelected) {
                    ctx.strokeStyle = '#00FFFF'; // Cyan for selection
                    ctx.lineWidth = 2 / scale;
                    ctx.setLineDash([4 / scale, 4 / scale]);
                } else {
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 1 / scale;
                    ctx.setLineDash([]);
                }

                if (type === 0) { // LINE
                    ctx.moveTo(buffer[i + 1], buffer[i + 2]);
                    ctx.lineTo(buffer[i + 3], buffer[i + 4]);
                } else if (type === 1) { // CIRCLE
                    const cx = buffer[i + 1];
                    const cy = buffer[i + 2];
                    const r = buffer[i + 3];
                    ctx.moveTo(cx + r, cy);
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                }
                ctx.stroke();
            }
            ctx.setLineDash([]); // Reset
        }

        // Draw Preview Line (Rubber Band)
        if (previewLine) {
            ctx.beginPath();
            ctx.moveTo(previewLine.x1, previewLine.y1);
            ctx.lineTo(previewLine.x2, previewLine.y2);
            ctx.strokeStyle = '#FFFF00'; // Yellow
            ctx.lineWidth = 1 / scale;
            ctx.setLineDash([5 / scale, 5 / scale]); // Dashed line
            ctx.stroke();
            ctx.setLineDash([]); // Reset dash
        }

        // Draw Preview Circle
        if (previewCircle) {
            ctx.beginPath();
            ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 1 / scale;
            ctx.setLineDash([5 / scale, 5 / scale]);
            ctx.arc(previewCircle.cx, previewCircle.cy, previewCircle.r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw radius line for visual aid
            ctx.beginPath();
            ctx.moveTo(previewCircle.cx, previewCircle.cy);
            ctx.lineTo(previewCircle.cx + previewCircle.r, previewCircle.cy); // Just a horizontal line for now, or to mouse pos if we had it
            ctx.strokeStyle = '#FFFF00';
            ctx.globalAlpha = 0.3;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }

        // Draw Snap Marker
        if (activeSnap && activeSnap.type !== SnapType.NONE) {
            const size = 10 / scale; // Constant screen size
            const x = activeSnap.p.x;
            const y = activeSnap.p.y;

            ctx.strokeStyle = '#00FF00'; // Green
            ctx.lineWidth = 2 / scale;
            ctx.beginPath();

            switch (activeSnap.type) {
                case SnapType.ENDPOINT: // Square
                    ctx.rect(x - size / 2, y - size / 2, size, size);
                    break;
                case SnapType.MIDPOINT: // Triangle
                    ctx.moveTo(x, y - size / 2);
                    ctx.lineTo(x - size / 2, y + size / 2);
                    ctx.lineTo(x + size / 2, y + size / 2);
                    ctx.closePath();
                    break;
                case SnapType.CENTER: // Circle
                    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
                    break;
                case SnapType.QUADRANT: // Diamond
                    ctx.moveTo(x, y - size / 2);
                    ctx.lineTo(x + size / 2, y);
                    ctx.lineTo(x, y + size / 2);
                    ctx.lineTo(x - size / 2, y);
                    ctx.closePath();
                    break;
            }
            ctx.stroke();
        }

        ctx.restore();

    }, [width, height, scale, offset, version, previewLine, previewCircle, activeSnap]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none'
            }}
        />
    );
};
