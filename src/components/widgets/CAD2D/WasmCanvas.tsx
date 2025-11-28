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
    movePreview?: { dx: number, dy: number } | null;
    copyPreview?: { dx: number, dy: number } | null;
    selectionBox?: { start: { x: number, y: number }, end: { x: number, y: number }, type: 'window' | 'crossing' } | null;
    rotatePreview?: { cx: number, cy: number, angle: number } | null;
    activeSnap?: SnapPoint | null;
}

export const WasmCanvas: React.FC<WasmCanvasProps> = ({ width, height, scale, offset, version, previewLine, previewCircle, previewPolyline, previewRectangle, previewArc, movePreview, copyPreview, selectionBox, rotatePreview, activeSnap }) => {
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

                // Determine if selected (position depends on entity type)
                let isSelected = false;

                if (type === 0) { // LINE
                    stride = 7;
                    isSelected = buffer[i + 6] > 0.5;

                    if (isSelected) {
                        // During MOVE, render original position faded
                        if (movePreview) {
                            ctx.strokeStyle = '#666666';
                            ctx.lineWidth = 1 / scale;
                            ctx.setLineDash([]);
                            ctx.globalAlpha = 0.3;
                        } else {
                            ctx.strokeStyle = '#00FFFF';
                            ctx.lineWidth = 2 / scale;
                            ctx.setLineDash([4 / scale, 4 / scale]);
                            ctx.globalAlpha = 1.0;
                        }
                    } else {
                        ctx.strokeStyle = '#FFFFFF';
                        ctx.lineWidth = 1 / scale;
                        ctx.setLineDash([]);
                        ctx.globalAlpha = 1.0;
                    }

                    ctx.beginPath();
                    ctx.moveTo(buffer[i + 1], buffer[i + 2]);
                    ctx.lineTo(buffer[i + 3], buffer[i + 4]);
                    ctx.stroke();
                    ctx.globalAlpha = 1.0; // Reset alpha
                } else if (type === 1) { // CIRCLE
                    stride = 7;
                    isSelected = buffer[i + 6] > 0.5;

                    if (isSelected) {
                        if (movePreview) {
                            ctx.strokeStyle = '#666666';
                            ctx.lineWidth = 1 / scale;
                            ctx.setLineDash([]);
                            ctx.globalAlpha = 0.3;
                        } else {
                            ctx.strokeStyle = '#00FFFF';
                            ctx.lineWidth = 2 / scale;
                            ctx.setLineDash([4 / scale, 4 / scale]);
                            ctx.globalAlpha = 1.0;
                        }
                    } else {
                        ctx.strokeStyle = '#FFFFFF';
                        ctx.lineWidth = 1 / scale;
                        ctx.setLineDash([]);
                        ctx.globalAlpha = 1.0;
                    }

                    ctx.beginPath();
                    ctx.arc(buffer[i + 1], buffer[i + 2], buffer[i + 3], 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = 1.0; // Reset alpha
                } else if (type === 2) { // ARC
                    // Stride: type(1) + center(2) + radius(1) + start(1) + end(1) + color(1) + selected(1) = 8
                    stride = 8;
                    isSelected = buffer[i + 7] > 0.5;

                    if (isSelected) {
                        if (movePreview) {
                            ctx.strokeStyle = '#666666';
                            ctx.lineWidth = 1 / scale;
                            ctx.setLineDash([]);
                            ctx.globalAlpha = 0.3;
                        } else {
                            ctx.strokeStyle = '#00FFFF';
                            ctx.lineWidth = 2 / scale;
                            ctx.setLineDash([4 / scale, 4 / scale]);
                            ctx.globalAlpha = 1.0;
                        }
                    } else {
                        ctx.strokeStyle = '#FFFFFF';
                        ctx.lineWidth = 1 / scale;
                        ctx.setLineDash([]);
                        ctx.globalAlpha = 1.0;
                    }

                    ctx.beginPath();
                    // Note: Canvas arc angles are clockwise? No, default is clockwise=false (counter-clockwise)
                    // But C++ might be using standard math (CCW).
                    // Let's assume CCW for now.
                    ctx.arc(buffer[i + 1], buffer[i + 2], buffer[i + 3], buffer[i + 4], buffer[i + 5], true);
                    ctx.stroke();
                    ctx.globalAlpha = 1.0; // Reset alpha
                } else if (type === 3) { // POLYLINE
                    const numPoints = buffer[i + 1];
                    const closed = buffer[i + 2] > 0.5;
                    const pointsStart = i + 3;
                    const pointsEnd = pointsStart + numPoints * 2;

                    // Selected flag is after all points
                    isSelected = buffer[pointsEnd + 1] > 0.5;

                    if (isSelected) {
                        if (movePreview) {
                            ctx.strokeStyle = '#666666';
                            ctx.lineWidth = 1 / scale;
                            ctx.setLineDash([]);
                            ctx.globalAlpha = 0.3;
                        } else {
                            ctx.strokeStyle = '#00FFFF';
                            ctx.lineWidth = 2 / scale;
                            ctx.setLineDash([4 / scale, 4 / scale]);
                            ctx.globalAlpha = 1.0;
                        }
                    } else {
                        ctx.strokeStyle = '#FFFFFF';
                        ctx.lineWidth = 1 / scale;
                        ctx.setLineDash([]);
                        ctx.globalAlpha = 1.0;
                    }

                    // Draw polyline segments
                    ctx.beginPath();
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
                    ctx.globalAlpha = 1.0; // Reset alpha

                    // Calculate stride: type(1) + numPoints(1) + closed(1) + points(numPoints*2) + color(1) + selected(1)
                    stride = 3 + numPoints * 2 + 2;
                } else if (type === 5) { // RECTANGLE
                    // Stride: type(1) + p1(2) + p2(2) + color(1) + selected(1) = 7
                    stride = 7;
                    isSelected = buffer[i + 6] > 0.5;

                    if (isSelected) {
                        if (movePreview) {
                            ctx.strokeStyle = '#666666';
                            ctx.lineWidth = 1 / scale;
                            ctx.setLineDash([]);
                            ctx.globalAlpha = 0.3;
                        } else {
                            ctx.strokeStyle = '#00FFFF';
                            ctx.lineWidth = 2 / scale;
                            ctx.setLineDash([4 / scale, 4 / scale]);
                            ctx.globalAlpha = 1.0;
                        }
                    } else {
                        ctx.strokeStyle = '#FFFFFF';
                        ctx.lineWidth = 1 / scale;
                        ctx.setLineDash([]);
                        ctx.globalAlpha = 1.0;
                    }

                    ctx.beginPath();
                    const x1 = buffer[i + 1];
                    const y1 = buffer[i + 2];
                    const x2 = buffer[i + 3];
                    const y2 = buffer[i + 4];
                    ctx.rect(x1, y1, x2 - x1, y2 - y1);
                    ctx.stroke();
                    ctx.globalAlpha = 1.0; // Reset alpha
                }

                i += stride;
            }
            ctx.setLineDash([]); // Reset
        }

        // Draw MOVE Preview (Ghost entities at new position)
        if (movePreview) {
            const { dx, dy } = movePreview;

            // Re-render all selected entities with offset
            let i = 0;
            while (i < buffer.length) {
                const type = buffer[i];
                let stride = 7;
                let isSelected = false;

                ctx.beginPath();
                ctx.strokeStyle = '#FFFFFF'; // Solid white for new position
                ctx.lineWidth = 2 / scale;
                ctx.setLineDash([]); // Solid line
                ctx.globalAlpha = 1.0; // Fully opaque

                if (type === 0) { // LINE
                    isSelected = buffer[i + 6] > 0.5;
                    if (isSelected) {
                        ctx.moveTo(buffer[i + 1] + dx, buffer[i + 2] + dy);
                        ctx.lineTo(buffer[i + 3] + dx, buffer[i + 4] + dy);
                        ctx.stroke();
                    }
                } else if (type === 1) { // CIRCLE
                    isSelected = buffer[i + 6] > 0.5;
                    if (isSelected) {
                        const cx = buffer[i + 1] + dx;
                        const cy = buffer[i + 2] + dy;
                        const r = buffer[i + 3];
                        ctx.arc(cx, cy, r, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                } else if (type === 2) { // ARC
                    stride = 8;
                    isSelected = buffer[i + 7] > 0.5;
                    if (isSelected) {
                        const cx = buffer[i + 1] + dx;
                        const cy = buffer[i + 2] + dy;
                        const r = buffer[i + 3];
                        ctx.arc(cx, cy, r, buffer[i + 4], buffer[i + 5], true);
                        ctx.stroke();
                    }
                } else if (type === 3) { // POLYLINE
                    const numPoints = buffer[i + 1];
                    const closed = buffer[i + 2] > 0.5;
                    const pointsStart = i + 3;
                    isSelected = buffer[pointsStart + numPoints * 2 + 1] > 0.5;

                    if (isSelected) {
                        for (let j = 0; j < numPoints; j++) {
                            const px = buffer[pointsStart + j * 2] + dx;
                            const py = buffer[pointsStart + j * 2 + 1] + dy;
                            if (j === 0) {
                                ctx.moveTo(px, py);
                            } else {
                                ctx.lineTo(px, py);
                            }
                        }
                        if (closed && numPoints > 0) {
                            ctx.closePath();
                        }
                        ctx.stroke();
                    }
                    stride = 3 + numPoints * 2 + 2;
                } else if (type === 5) { // RECTANGLE
                    isSelected = buffer[i + 6] > 0.5;
                    if (isSelected) {
                        const x1 = buffer[i + 1] + dx;
                        const y1 = buffer[i + 2] + dy;
                        const x2 = buffer[i + 3] + dx;
                        const y2 = buffer[i + 4] + dy;
                        ctx.rect(x1, y1, x2 - x1, y2 - y1);
                        ctx.stroke();
                    }
                }

                i += stride;
            }

            ctx.globalAlpha = 1.0; // Reset
            ctx.setLineDash([]); // Reset
        }

        // Draw COPY Preview (Ghost entities at new position, originals stay normal)
        if (copyPreview) {
            const { dx, dy } = copyPreview;

            // Re-render all selected entities with offset (as copies)
            let i = 0;
            while (i < buffer.length) {
                const type = buffer[i];
                let stride = 7;
                let isSelected = false;

                ctx.beginPath();
                ctx.strokeStyle = '#FFFFFF'; // Solid white for copies
                ctx.lineWidth = 2 / scale;
                ctx.setLineDash([]); // Solid line
                ctx.globalAlpha = 1.0; // Fully opaque

                if (type === 0) { // LINE
                    isSelected = buffer[i + 6] > 0.5;
                    if (isSelected) {
                        ctx.moveTo(buffer[i + 1] + dx, buffer[i + 2] + dy);
                        ctx.lineTo(buffer[i + 3] + dx, buffer[i + 4] + dy);
                        ctx.stroke();
                    }
                } else if (type === 1) { // CIRCLE
                    isSelected = buffer[i + 6] > 0.5;
                    if (isSelected) {
                        const cx = buffer[i + 1] + dx;
                        const cy = buffer[i + 2] + dy;
                        const r = buffer[i + 3];
                        ctx.arc(cx, cy, r, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                } else if (type === 2) { // ARC
                    stride = 8;
                    isSelected = buffer[i + 7] > 0.5;
                    if (isSelected) {
                        const cx = buffer[i + 1] + dx;
                        const cy = buffer[i + 2] + dy;
                        const r = buffer[i + 3];
                        ctx.arc(cx, cy, r, buffer[i + 4], buffer[i + 5], true);
                        ctx.stroke();
                    }
                } else if (type === 3) { // POLYLINE
                    const numPoints = buffer[i + 1];
                    const closed = buffer[i + 2] > 0.5;
                    const pointsStart = i + 3;
                    isSelected = buffer[pointsStart + numPoints * 2 + 1] > 0.5;

                    if (isSelected) {
                        for (let j = 0; j < numPoints; j++) {
                            const px = buffer[pointsStart + j * 2] + dx;
                            const py = buffer[pointsStart + j * 2 + 1] + dy;
                            if (j === 0) {
                                ctx.moveTo(px, py);
                            } else {
                                ctx.lineTo(px, py);
                            }
                        }
                        if (closed && numPoints > 0) {
                            ctx.closePath();
                        }
                        ctx.stroke();
                    }
                    stride = 3 + numPoints * 2 + 2;
                } else if (type === 5) { // RECTANGLE
                    isSelected = buffer[i + 6] > 0.5;
                    if (isSelected) {
                        const x1 = buffer[i + 1] + dx;
                        const y1 = buffer[i + 2] + dy;
                        const x2 = buffer[i + 3] + dx;
                        const y2 = buffer[i + 4] + dy;
                        ctx.rect(x1, y1, x2 - x1, y2 - y1);
                        ctx.stroke();
                    }
                }

                i += stride;
            }

            ctx.globalAlpha = 1.0; // Reset
            ctx.setLineDash([]); // Reset
        }

        // Draw ROTATE Preview (Rotated entities at new angle)
        if (rotatePreview) {
            const { cx, cy, angle } = rotatePreview;

            // First, draw original selected entities faded (like MOVE)
            let i = 0;
            while (i < buffer.length) {
                const type = buffer[i];
                let stride = 7;
                let isSelected = false;

                ctx.beginPath();
                ctx.strokeStyle = '#808080'; // Grey for original
                ctx.lineWidth = 1 / scale;
                ctx.setLineDash([]);
                ctx.globalAlpha = 0.3; // Faded

                if (type === 0) { // LINE
                    isSelected = buffer[i + 6] > 0.5;
                    if (isSelected) {
                        const x1 = buffer[i + 1];
                        const y1 = buffer[i + 2];
                        const x2 = buffer[i + 3];
                        const y2 = buffer[i + 4];
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();
                    }
                } else if (type === 1) { // CIRCLE
                    isSelected = buffer[i + 6] > 0.5;
                    if (isSelected) {
                        const centerX = buffer[i + 1];
                        const centerY = buffer[i + 2];
                        const r = buffer[i + 3];
                        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                } else if (type === 2) { // ARC
                    stride = 8;
                    isSelected = buffer[i + 7] > 0.5;
                    if (isSelected) {
                        const centerX = buffer[i + 1];
                        const centerY = buffer[i + 2];
                        const r = buffer[i + 3];
                        const startAngle = buffer[i + 4];
                        const endAngle = buffer[i + 5];
                        ctx.arc(centerX, centerY, r, startAngle, endAngle, true);
                        ctx.stroke();
                    }
                } else if (type === 3) { // POLYLINE
                    const numPoints = buffer[i + 1];
                    const closed = buffer[i + 2] > 0.5;
                    const pointsStart = i + 3;
                    isSelected = buffer[pointsStart + numPoints * 2 + 1] > 0.5;

                    if (isSelected) {
                        for (let j = 0; j < numPoints; j++) {
                            const px = buffer[pointsStart + j * 2];
                            const py = buffer[pointsStart + j * 2 + 1];
                            if (j === 0) {
                                ctx.moveTo(px, py);
                            } else {
                                ctx.lineTo(px, py);
                            }
                        }
                        if (closed && numPoints > 0) {
                            ctx.closePath();
                        }
                        ctx.stroke();
                    }
                    stride = 3 + numPoints * 2 + 2;
                } else if (type === 5) { // RECTANGLE
                    isSelected = buffer[i + 6] > 0.5;
                    if (isSelected) {
                        const x1 = buffer[i + 1];
                        const y1 = buffer[i + 2];
                        const x2 = buffer[i + 3];
                        const y2 = buffer[i + 4];
                        const w = x2 - x1;
                        const h = y2 - y1;
                        ctx.rect(x1, y1, w, h);
                        ctx.stroke();
                    }
                }

                i += stride;
            }

            ctx.globalAlpha = 1.0;

            // Then, draw rotated entities in white
            i = 0;
            while (i < buffer.length) {
                const type = buffer[i];
                let stride = 7;
                let isSelected = false;

                ctx.beginPath();
                ctx.strokeStyle = '#FFFFFF'; // Solid white for rotated preview
                ctx.lineWidth = 2 / scale;
                ctx.setLineDash([]);
                ctx.globalAlpha = 1.0;

                if (type === 0) { // LINE
                    isSelected = buffer[i + 6] > 0.5;
                    if (isSelected) {
                        // Rotate line endpoints
                        const x1 = buffer[i + 1];
                        const y1 = buffer[i + 2];
                        const x2 = buffer[i + 3];
                        const y2 = buffer[i + 4];

                        const dx1 = x1 - cx;
                        const dy1 = y1 - cy;
                        const rx1 = cx + dx1 * Math.cos(angle) - dy1 * Math.sin(angle);
                        const ry1 = cy + dx1 * Math.sin(angle) + dy1 * Math.cos(angle);

                        const dx2 = x2 - cx;
                        const dy2 = y2 - cy;
                        const rx2 = cx + dx2 * Math.cos(angle) - dy2 * Math.sin(angle);
                        const ry2 = cy + dx2 * Math.sin(angle) + dy2 * Math.cos(angle);

                        ctx.moveTo(rx1, ry1);
                        ctx.lineTo(rx2, ry2);
                        ctx.stroke();
                    }
                } else if (type === 1) { // CIRCLE
                    isSelected = buffer[i + 6] > 0.5;
                    if (isSelected) {
                        const centerX = buffer[i + 1];
                        const centerY = buffer[i + 2];
                        const r = buffer[i + 3];

                        const dx = centerX - cx;
                        const dy = centerY - cy;
                        const rcx = cx + dx * Math.cos(angle) - dy * Math.sin(angle);
                        const rcy = cy + dx * Math.sin(angle) + dy * Math.cos(angle);

                        ctx.arc(rcx, rcy, r, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                } else if (type === 2) { // ARC
                    stride = 8;
                    isSelected = buffer[i + 7] > 0.5;
                    if (isSelected) {
                        const centerX = buffer[i + 1];
                        const centerY = buffer[i + 2];
                        const r = buffer[i + 3];
                        const startAngle = buffer[i + 4];
                        const endAngle = buffer[i + 5];

                        const dx = centerX - cx;
                        const dy = centerY - cy;
                        const rcx = cx + dx * Math.cos(angle) - dy * Math.sin(angle);
                        const rcy = cy + dx * Math.sin(angle) + dy * Math.cos(angle);

                        ctx.arc(rcx, rcy, r, startAngle + angle, endAngle + angle, true);
                        ctx.stroke();
                    }
                } else if (type === 3) { // POLYLINE
                    const numPoints = buffer[i + 1];
                    const closed = buffer[i + 2] > 0.5;
                    const pointsStart = i + 3;
                    isSelected = buffer[pointsStart + numPoints * 2 + 1] > 0.5;

                    if (isSelected) {
                        for (let j = 0; j < numPoints; j++) {
                            const px = buffer[pointsStart + j * 2];
                            const py = buffer[pointsStart + j * 2 + 1];

                            const dx = px - cx;
                            const dy = py - cy;
                            const rpx = cx + dx * Math.cos(angle) - dy * Math.sin(angle);
                            const rpy = cy + dx * Math.sin(angle) + dy * Math.cos(angle);

                            if (j === 0) {
                                ctx.moveTo(rpx, rpy);
                            } else {
                                ctx.lineTo(rpx, rpy);
                            }
                        }
                        if (closed && numPoints > 0) {
                            ctx.closePath();
                        }
                        ctx.stroke();
                    }
                    stride = 3 + numPoints * 2 + 2;
                } else if (type === 5) { // RECTANGLE
                    isSelected = buffer[i + 6] > 0.5;
                    if (isSelected) {
                        const x1 = buffer[i + 1];
                        const y1 = buffer[i + 2];
                        const x2 = buffer[i + 3];
                        const y2 = buffer[i + 4];

                        // Rotate all 4 corners
                        const corners = [
                            { x: x1, y: y1 },
                            { x: x2, y: y1 },
                            { x: x2, y: y2 },
                            { x: x1, y: y2 }
                        ];

                        corners.forEach((corner, idx) => {
                            const dx = corner.x - cx;
                            const dy = corner.y - cy;
                            const rx = cx + dx * Math.cos(angle) - dy * Math.sin(angle);
                            const ry = cy + dx * Math.sin(angle) + dy * Math.cos(angle);

                            if (idx === 0) {
                                ctx.moveTo(rx, ry);
                            } else {
                                ctx.lineTo(rx, ry);
                            }
                        });
                        ctx.closePath();
                        ctx.stroke();
                    }
                }

                i += stride;
            }

            ctx.globalAlpha = 1.0;
            ctx.setLineDash([]);
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

        // Draw Selection Box (Window/Crossing)
        if (selectionBox) {
            const { start, end, type } = selectionBox;
            const x = Math.min(start.x, end.x);
            const y = Math.min(start.y, end.y);
            const w = Math.abs(end.x - start.x);
            const h = Math.abs(end.y - start.y);

            ctx.beginPath();

            if (type === 'window') {
                // Window Selection: Blue solid box
                ctx.strokeStyle = '#0066FF';
                ctx.fillStyle = 'rgba(0, 102, 255, 0.1)';
                ctx.lineWidth = 1 / scale;
                ctx.setLineDash([]);
            } else {
                // Crossing Selection: Green dashed box
                ctx.strokeStyle = '#00FF00';
                ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
                ctx.lineWidth = 1 / scale;
                ctx.setLineDash([4 / scale, 4 / scale]);
            }

            ctx.rect(x, y, w, h);
            ctx.fill();
            ctx.stroke();
            ctx.setLineDash([]);
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

    }, [width, height, scale, offset, version, previewLine, previewCircle, previewPolyline, previewRectangle, previewArc, movePreview, copyPreview, selectionBox, rotatePreview, activeSnap]);

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
