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
    previewPolyline?: { x: number, y: number }[] | null;
    previewRectangle?: { x1: number, y1: number, x2: number, y2: number } | null;
    previewArc?: { cx: number, cy: number, r: number, start: number, end: number } | null;
    activeSnap?: SnapPoint | null;
}

export const WasmCanvas: React.FC<WasmCanvasProps> = ({ width, height, scale, offset, version, previewLine, previewCircle, previewPolyline, previewRectangle, previewArc, activeSnap }) => {
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

        // Draw Origin Marker (AutoCAD style crosshair)
        const originSize = 20 / scale; // Size in world units
        ctx.strokeStyle = '#FF0000'; // Red for origin
        ctx.lineWidth = 2 / scale;
        ctx.beginPath();
        // Horizontal line
        ctx.moveTo(-originSize, 0);
        ctx.lineTo(originSize, 0);
        // Vertical line
        ctx.moveTo(0, -originSize);
        ctx.lineTo(0, originSize);
        ctx.stroke();

        // Draw small circle at origin
        ctx.beginPath();
        ctx.arc(0, 0, 3 / scale, 0, Math.PI * 2);
        ctx.stroke();

        // Draw C++ Buffer
        const buffer = cadEngine.getRenderBuffer();
        if (buffer.length > 0) {
            // Render loop with variable stride
            let i = 0;
            while (i < buffer.length) {
                const type = buffer[i];
                let stride = 7; // Default for LINE and CIRCLE

                ctx.beginPath();

                // Determine if selected (position depends on entity type)
                let isSelected = false;

                if (type === 0) { // LINE
                    isSelected = buffer[i + 6] > 0.5;
                    if (isSelected) {
                        ctx.strokeStyle = '#00FFFF';
                        ctx.lineWidth = 2 / scale;
                        ctx.setLineDash([4 / scale, 4 / scale]);
                    } else {
                        ctx.strokeStyle = '#FFFFFF';
                        ctx.lineWidth = 1 / scale;
                        ctx.setLineDash([]);
                    }
                    ctx.moveTo(buffer[i + 1], buffer[i + 2]);
                    ctx.lineTo(buffer[i + 3], buffer[i + 4]);
                    ctx.stroke();
                } else if (type === 1) { // CIRCLE
                    isSelected = buffer[i + 6] > 0.5;
                    if (isSelected) {
                        ctx.strokeStyle = '#00FFFF';
                        ctx.lineWidth = 2 / scale;
                        ctx.setLineDash([4 / scale, 4 / scale]);
                    } else {
                        ctx.strokeStyle = '#FFFFFF';
                        ctx.lineWidth = 1 / scale;
                        ctx.setLineDash([]);
                    }
                    const cx = buffer[i + 1];
                    const cy = buffer[i + 2];
                    const r = buffer[i + 3];
                    ctx.moveTo(cx + r, cy);
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.stroke();
                } else if (type === 2) { // ARC
                    // Stride: type(1) + center(2) + radius(1) + start(1) + end(1) + color(1) + selected(1) = 8
                    stride = 8;
                    isSelected = buffer[i + 7] > 0.5;

                    if (isSelected) {
                        ctx.strokeStyle = '#00FFFF';
                        ctx.lineWidth = 2 / scale;
                        ctx.setLineDash([4 / scale, 4 / scale]);
                    } else {
                        ctx.strokeStyle = '#FFFFFF';
                        ctx.lineWidth = 1 / scale;
                        ctx.setLineDash([]);
                    }

                    ctx.beginPath();
                    // Note: Canvas arc angles are clockwise? No, default is clockwise=false (counter-clockwise)
                    // But C++ might be using standard math (CCW).
                    // Let's assume CCW for now.
                    ctx.beginPath();
                    // Draw Counter-Clockwise (Standard CAD)
                    ctx.arc(buffer[i + 1], buffer[i + 2], buffer[i + 3], buffer[i + 4], buffer[i + 5], true);
                    ctx.stroke();
                } else if (type === 3) { // POLYLINE
                    const numPoints = buffer[i + 1];
                    const closed = buffer[i + 2] > 0.5;
                    const pointsStart = i + 3;
                    const pointsEnd = pointsStart + numPoints * 2;

                    // Selected flag is after all points
                    isSelected = buffer[pointsEnd + 1] > 0.5;

                    if (isSelected) {
                        ctx.strokeStyle = '#00FFFF';
                        ctx.lineWidth = 2 / scale;
                        ctx.setLineDash([4 / scale, 4 / scale]);
                    } else {
                        ctx.strokeStyle = '#FFFFFF';
                        ctx.lineWidth = 1 / scale;
                        ctx.setLineDash([]);
                    }

                    // Draw polyline segments
                    for (let j = 0; j < numPoints; j++) {
                        const px = buffer[pointsStart + j * 2];
                        const py = buffer[pointsStart + j * 2 + 1];
                        if (j === 0) {
                            ctx.moveTo(px, py);
                        } else {
                            ctx.lineTo(px, py);
                        }
                    }

                    // Close if needed
                    if (closed && numPoints > 0) {
                        ctx.closePath();
                    }

                    ctx.stroke();

                    // Calculate stride: type(1) + numPoints(1) + closed(1) + points(numPoints*2) + color(1) + selected(1)
                    stride = 3 + numPoints * 2 + 2;
                } else if (type === 5) { // RECTANGLE
                    // Stride: type(1) + p1(2) + p2(2) + color(1) + selected(1) = 7
                    stride = 7;
                    isSelected = buffer[i + 6] > 0.5;

                    if (isSelected) {
                        ctx.strokeStyle = '#00FFFF';
                        ctx.lineWidth = 2 / scale;
                        ctx.setLineDash([4 / scale, 4 / scale]);
                    } else {
                        ctx.strokeStyle = '#FFFFFF';
                        ctx.lineWidth = 1 / scale;
                        ctx.setLineDash([]);
                    }

                    ctx.beginPath();
                    const x1 = buffer[i + 1];
                    const y1 = buffer[i + 2];
                    const x2 = buffer[i + 3];
                    const y2 = buffer[i + 4];
                    ctx.rect(x1, y1, x2 - x1, y2 - y1);
                    ctx.stroke();
                }

                i += stride;
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

        // Draw Preview Polyline
        if (previewPolyline && previewPolyline.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = '#FFFF00'; // Yellow
            ctx.lineWidth = 1 / scale;
            ctx.setLineDash([5 / scale, 5 / scale]); // Dashed line

            for (let i = 0; i < previewPolyline.length; i++) {
                const pt = previewPolyline[i];
                if (i === 0) {
                    ctx.moveTo(pt.x, pt.y);
                } else {
                    ctx.lineTo(pt.x, pt.y);
                }
            }

            ctx.stroke();
            ctx.setLineDash([]); // Reset dash
        }

        // Draw Preview Rectangle
        if (previewRectangle) {
            ctx.beginPath();
            ctx.strokeStyle = '#FFFF00'; // Yellow
            ctx.lineWidth = 1 / scale;
            ctx.setLineDash([5 / scale, 5 / scale]); // Dashed line

            const { x1, y1, x2, y2 } = previewRectangle;
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x1, y2);
            ctx.closePath();

            ctx.stroke();
            ctx.setLineDash([]); // Reset dash
        }

        // Preview Arc
        if (previewArc) {
            ctx.strokeStyle = '#FFFF00'; // Yellow for preview
            ctx.lineWidth = 1 / scale;
            ctx.setLineDash([4 / scale, 4 / scale]); // Dashed line
            ctx.beginPath();
            // Draw Counter-Clockwise (Standard CAD)
            ctx.arc(previewArc.cx, previewArc.cy, previewArc.r, previewArc.start, previewArc.end, true);
            ctx.stroke();

            // Draw line from center to start and end for visual aid
            ctx.setLineDash([2 / scale, 4 / scale]);
            ctx.beginPath();
            ctx.moveTo(previewArc.cx, previewArc.cy);
            ctx.lineTo(previewArc.cx + previewArc.r * Math.cos(previewArc.start), previewArc.cy + previewArc.r * Math.sin(previewArc.start));
            ctx.moveTo(previewArc.cx, previewArc.cy);
            ctx.lineTo(previewArc.cx + previewArc.r * Math.cos(previewArc.end), previewArc.cy + previewArc.r * Math.sin(previewArc.end));
            ctx.stroke();
            ctx.setLineDash([]); // Reset dash
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

    }, [width, height, scale, offset, version, previewLine, previewCircle, previewPolyline, previewRectangle, previewArc, activeSnap]);

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
