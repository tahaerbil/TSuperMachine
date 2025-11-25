import React, { useRef, useEffect } from 'react';
import { cadEngine } from './CADEngine';

interface WasmCanvasProps {
    width: number;
    height: number;
    scale: number;
    offset: { x: number; y: number };
    version: number; // Increment to force re-render
    previewLine?: { x1: number, y1: number, x2: number, y2: number } | null;
    previewCircle?: { cx: number, cy: number, r: number } | null;
}

export const WasmCanvas: React.FC<WasmCanvasProps> = ({ width, height, scale, offset, version, previewLine, previewCircle }) => {
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
            const STRIDE = 6;

            ctx.lineWidth = 1 / scale;
            ctx.strokeStyle = '#FFFFFF'; // White lines for entities
            ctx.beginPath();

            for (let i = 0; i < buffer.length; i += STRIDE) {
                const type = buffer[i];

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
            }
            ctx.stroke();
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

        ctx.restore();

    }, [width, height, scale, offset, version, previewLine, previewCircle]);

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
