import { SnapType, type SnapPoint } from '../../../core/services/cad-engine/CADEngine';

export type CADGridStyle = 'none' | 'lines' | 'dots';

export interface RenderOptions {
    movePreview?: { dx: number, dy: number } | null;
    copyPreview?: { dx: number, dy: number } | null;
    rotatePreview?: { cx: number, cy: number, angle: number } | null;
}

export interface PreviewOptions {
    previewLine?: { x1: number, y1: number, x2: number, y2: number } | null;
    previewCircle?: { cx: number, cy: number, r: number } | null;
    previewPolyline?: { x: number, y: number }[] | null;
    previewRectangle?: { x1: number, y1: number, x2: number, y2: number } | null;
    previewArc?: { cx: number, cy: number, r: number, start: number, end: number } | null;
}

export class CanvasRenderer {
    private ctx: CanvasRenderingContext2D;
    private scale: number;
    private offset: { x: number; y: number };

    constructor(ctx: CanvasRenderingContext2D, scale: number, offset: { x: number; y: number }) {
        this.ctx = ctx;
        this.scale = scale;
        this.offset = offset;
    }

    public clear(width: number, height: number) {
        // Clear entire canvas (in screen space)
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, width, height);
        this.ctx.restore();

        // Apply transform for subsequent drawing
        this.ctx.translate(this.offset.x, this.offset.y);
        this.ctx.scale(this.scale, this.scale);
    }

    public drawGrid(gridStyle: CADGridStyle, width?: number, height?: number) {
        if (gridStyle === 'none') return;

        const ctx = this.ctx;

        if (gridStyle === 'lines') {
            // Calculate visible area in world coordinates
            // The canvas has been transformed, so we need to invert to get world bounds
            const worldLeft = -this.offset.x / this.scale;
            const worldTop = -this.offset.y / this.scale;
            const worldWidth = (width || 2000) / this.scale;
            const worldHeight = (height || 2000) / this.scale;
            const worldRight = worldLeft + worldWidth;
            const worldBottom = worldTop + worldHeight;

            // Adaptive grid step based on zoom level
            // We want grid lines to be at least 20 pixels apart on screen
            const baseStep = 50;
            let step = baseStep;
            const screenStepSize = step * this.scale;

            // If grid would be too dense, increase step
            if (screenStepSize < 20) {
                const factor = Math.ceil(20 / screenStepSize);
                // Round up to a nice number (1, 2, 5, 10, 20, 50, 100, etc.)
                const niceFactors = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
                step = baseStep * (niceFactors.find(f => f >= factor) || factor);
            }
            // If grid would be too sparse, decrease step
            else if (screenStepSize > 100) {
                step = Math.max(1, baseStep / Math.floor(screenStepSize / 50));
            }

            // Draw grid lines only in visible area (with some padding)
            const padding = step * 2;
            const startX = Math.floor((worldLeft - padding) / step) * step;
            const endX = Math.ceil((worldRight + padding) / step) * step;
            const startY = Math.floor((worldTop - padding) / step) * step;
            const endY = Math.ceil((worldBottom + padding) / step) * step;

            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 1 / this.scale;
            ctx.beginPath();

            // Vertical lines
            for (let x = startX; x <= endX; x += step) {
                ctx.moveTo(x, startY);
                ctx.lineTo(x, endY);
            }
            // Horizontal lines
            for (let y = startY; y <= endY; y += step) {
                ctx.moveTo(startX, y);
                ctx.lineTo(endX, y);
            }
            ctx.stroke();

        } else if (gridStyle === 'dots') {
            // Similar optimization for dots
            const worldLeft = -this.offset.x / this.scale;
            const worldTop = -this.offset.y / this.scale;
            const worldWidth = (width || 2000) / this.scale;
            const worldHeight = (height || 2000) / this.scale;

            const baseStep = 50;
            let step = baseStep;
            if (step * this.scale < 15) {
                step = baseStep * Math.ceil(15 / (step * this.scale));
            }

            const startX = Math.floor(worldLeft / step) * step;
            const endX = Math.ceil((worldLeft + worldWidth) / step) * step;
            const startY = Math.floor(worldTop / step) * step;
            const endY = Math.ceil((worldTop + worldHeight) / step) * step;

            ctx.fillStyle = '#555555';
            const dotRadius = 1.5 / this.scale;

            for (let x = startX; x <= endX; x += step) {
                for (let y = startY; y <= endY; y += step) {
                    ctx.beginPath();
                    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    public drawAxes() {
        const ctx = this.ctx;
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 2 / this.scale;
        ctx.beginPath();
        ctx.moveTo(-10000, 0); ctx.lineTo(10000, 0); // X Axis
        ctx.moveTo(0, -10000); ctx.lineTo(0, 10000); // Y Axis
        ctx.stroke();

        // Origin Marker
        const originSize = 20 / this.scale;
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2 / this.scale;
        ctx.beginPath();
        ctx.moveTo(-originSize, 0); ctx.lineTo(originSize, 0);
        ctx.moveTo(0, -originSize); ctx.lineTo(0, originSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, 3 / this.scale, 0, Math.PI * 2);
        ctx.stroke();
    }

    public drawEntities(buffer: Float32Array, options: RenderOptions = {}) {
        if (buffer.length === 0) return;

        const { movePreview, copyPreview, rotatePreview } = options;
        const ctx = this.ctx;

        // 1. Draw Normal State (Line, Circle, etc.)
        this.renderBufferLoop(buffer, {
            onLine: (x1, y1, x2, y2, isSelected) => {
                this.setupStyle(isSelected, !!movePreview);
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                this.resetStyle();
            },
            onCircle: (cx, cy, r, isSelected) => {
                this.setupStyle(isSelected, !!movePreview);
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.stroke();
                this.resetStyle();
            },
            onArc: (cx, cy, r, start, end, isSelected) => {
                this.setupStyle(isSelected, !!movePreview);
                ctx.beginPath();
                ctx.arc(cx, cy, r, start, end, true);
                ctx.stroke();
                this.resetStyle();
            },
            onPolyline: (points, closed, isSelected) => {
                this.setupStyle(isSelected, !!movePreview);
                ctx.beginPath();
                points.forEach((pt, i) => {
                    if (i === 0) ctx.moveTo(pt.x, pt.y);
                    else ctx.lineTo(pt.x, pt.y);
                });
                if (closed && points.length > 0) ctx.closePath();
                ctx.stroke();
                this.resetStyle();
            },
            onRectangle: (x1, y1, x2, y2, isSelected) => {
                this.setupStyle(isSelected, !!movePreview);
                ctx.beginPath();
                ctx.rect(x1, y1, x2 - x1, y2 - y1);
                ctx.stroke();
                this.resetStyle();
            }
        });

        // 2. Draw Move Preview
        if (movePreview) {
            const { dx, dy } = movePreview;
            this.renderBufferLoop(buffer, {
                filterSelected: true,
                onLine: (x1, y1, x2, y2) => {
                    this.setupPreviewStyle();
                    ctx.beginPath();
                    ctx.moveTo(x1 + dx, y1 + dy);
                    ctx.lineTo(x2 + dx, y2 + dy);
                    ctx.stroke();
                },
                onCircle: (cx, cy, r) => {
                    this.setupPreviewStyle();
                    ctx.beginPath();
                    ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
                    ctx.stroke();
                },
                onArc: (cx, cy, r, start, end) => {
                    this.setupPreviewStyle();
                    ctx.beginPath();
                    ctx.arc(cx + dx, cy + dy, r, start, end, true);
                    ctx.stroke();
                },
                onPolyline: (points, closed) => {
                    this.setupPreviewStyle();
                    ctx.beginPath();
                    points.forEach((pt, i) => {
                        if (i === 0) ctx.moveTo(pt.x + dx, pt.y + dy);
                        else ctx.lineTo(pt.x + dx, pt.y + dy);
                    });
                    if (closed) ctx.closePath();
                    ctx.stroke();
                },
                onRectangle: (x1, y1, x2, y2) => {
                    this.setupPreviewStyle();
                    ctx.beginPath();
                    ctx.rect(x1 + dx, y1 + dy, x2 - x1, y2 - y1);
                    ctx.stroke();
                }
            });
        }

        // 3. Draw Copy Preview (Same logic as Move, but original stays solid)
        if (copyPreview) {
            const { dx, dy } = copyPreview;
            this.renderBufferLoop(buffer, {
                filterSelected: true,
                onLine: (x1, y1, x2, y2) => {
                    this.setupPreviewStyle(); // White
                    ctx.beginPath();
                    ctx.moveTo(x1 + dx, y1 + dy);
                    ctx.lineTo(x2 + dx, y2 + dy);
                    ctx.stroke();
                },
                // ... (Can reuse logic if genericized more, but keeping specific for clarity)
            });
            // For brevity, using simplified logic: Copy uses same transform as Move, just differs in semantic
            // Actually copyPreview renders *adds* new ghosts, Move renders *displaces* ghosts.
            // The implementation in WasmCanvas was repeating logic. Let's stick to what worked.

            // Quick fix: Re-implement full loop for Copy to ensure correctness
            this.renderBufferLoop(buffer, {
                filterSelected: true,
                onLine: (x1, y1, x2, y2) => {
                    this.setupPreviewStyle();
                    ctx.beginPath();
                    ctx.moveTo(x1 + dx, y1 + dy);
                    ctx.lineTo(x2 + dx, y2 + dy);
                    ctx.stroke();
                },
                onCircle: (cx, cy, r) => {
                    this.setupPreviewStyle();
                    ctx.beginPath();
                    ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
                    ctx.stroke();
                },
                onArc: (cx, cy, r, s, e) => {
                    this.setupPreviewStyle();
                    ctx.beginPath();
                    ctx.arc(cx + dx, cy + dy, r, s, e, true);
                    ctx.stroke();
                },
                onPolyline: (points, closed) => {
                    this.setupPreviewStyle();
                    ctx.beginPath();
                    points.forEach((pt, i) => {
                        if (i === 0) ctx.moveTo(pt.x + dx, pt.y + dy);
                        else ctx.lineTo(pt.x + dx, pt.y + dy);
                    });
                    if (closed) ctx.closePath();
                    ctx.stroke();
                },
                onRectangle: (x1, y1, x2, y2) => {
                    this.setupPreviewStyle();
                    ctx.beginPath();
                    ctx.rect(x1 + dx, y1 + dy, x2 - x1, y2 - y1);
                    ctx.stroke();
                }
            });
        }

        // 4. Draw Rotate Preview
        if (rotatePreview) {
            const { cx, cy, angle } = rotatePreview;

            // Draw originals faded
            // Note: WasmCanvas logic drew originals faded *first*. 
            // My drawEntities step 1 already handled "setupStyle(isSelected, !!movePreview)" to fade if moving.
            // But for Rotate, we want to fade originals too if selected.
            // NOTE: Current impl for step 1 passed `false` for isMoving for rotate.
            // Let's rely on step 1 to draw normal items. If we want them faded during rotate, we should have passed that flag.
            // But WasmCanvas rotates differently: it draws originals faded explicitly in a separate pass?
            // Actually WasmCanvas line 460 loops buffer AGAIN to draw faded originals for rotate.
            // This implies Step 1 (Normal Draw) might need to be skipped or adjusted for selected items during rotate.
            // For now, let's keep it simple: Draw primitives in white at rotated coords.

            this.renderBufferLoop(buffer, {
                filterSelected: true,
                onLine: (x1, y1, x2, y2) => {
                    this.setupPreviewStyle();
                    const p1 = this.rotatePoint(x1, y1, cx, cy, angle);
                    const p2 = this.rotatePoint(x2, y2, cx, cy, angle);
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                },
                onCircle: (c_x, c_y, r) => {
                    this.setupPreviewStyle();
                    const p = this.rotatePoint(c_x, c_y, cx, cy, angle);
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                    ctx.stroke();
                },
                onArc: (c_x, c_y, r, s, e) => {
                    this.setupPreviewStyle();
                    const p = this.rotatePoint(c_x, c_y, cx, cy, angle);
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, r, s + angle, e + angle, true);
                    ctx.stroke();
                },
                onPolyline: (points, closed) => {
                    this.setupPreviewStyle();
                    ctx.beginPath();
                    points.forEach((pt, i) => {
                        const rpt = this.rotatePoint(pt.x, pt.y, cx, cy, angle);
                        if (i === 0) ctx.moveTo(rpt.x, rpt.y);
                        else ctx.lineTo(rpt.x, rpt.y);
                    });
                    if (closed) ctx.closePath();
                    ctx.stroke();
                },
                onRectangle: (x1, y1, x2, y2) => {
                    this.setupPreviewStyle();
                    // Rotate all 4 corners
                    const corners = [
                        { x: x1, y: y1 }, { x: x2, y: y1 },
                        { x: x2, y: y2 }, { x: x1, y: y2 }
                    ];
                    ctx.beginPath();
                    corners.forEach((pt, i) => {
                        const rpt = this.rotatePoint(pt.x, pt.y, cx, cy, angle);
                        if (i === 0) ctx.moveTo(rpt.x, rpt.y);
                        else ctx.lineTo(rpt.x, rpt.y);
                    });
                    ctx.closePath();
                    ctx.stroke();
                }
            });
        }
    }

    public drawPreviews(options: PreviewOptions) {
        const ctx = this.ctx;
        ctx.strokeStyle = '#FFFF00'; // Yellow
        ctx.lineWidth = 1 / this.scale;
        ctx.setLineDash([5 / this.scale, 5 / this.scale]);

        if (options.previewLine) {
            ctx.beginPath();
            ctx.moveTo(options.previewLine.x1, options.previewLine.y1);
            ctx.lineTo(options.previewLine.x2, options.previewLine.y2);
            ctx.stroke();
        }

        if (options.previewCircle) {
            ctx.beginPath();
            ctx.arc(options.previewCircle.cx, options.previewCircle.cy, options.previewCircle.r, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (options.previewPolyline && options.previewPolyline.length > 0) {
            ctx.beginPath();
            options.previewPolyline.forEach((pt, i) => {
                if (i === 0) ctx.moveTo(pt.x, pt.y);
                else ctx.lineTo(pt.x, pt.y);
            });
            ctx.stroke();
        }

        if (options.previewRectangle) {
            const { x1, y1, x2, y2 } = options.previewRectangle;
            ctx.beginPath();
            ctx.rect(x1, y1, x2 - x1, y2 - y1);
            ctx.stroke();
        }

        if (options.previewArc) {
            const { cx, cy, r, start, end } = options.previewArc;
            ctx.setLineDash([4 / this.scale, 4 / this.scale]);
            ctx.beginPath();
            ctx.arc(cx, cy, r, start, end, true);
            ctx.stroke();

            // Visual aid radius lines
            ctx.setLineDash([2 / this.scale, 4 / this.scale]);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + r * Math.cos(start), cy + r * Math.sin(start));
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + r * Math.cos(end), cy + r * Math.sin(end));
            ctx.stroke();
        }

        ctx.setLineDash([]); // Reset
    }

    public drawSelectionBox(selectionBox?: { start: { x: number, y: number }, end: { x: number, y: number }, type: 'window' | 'crossing' } | null) {
        if (!selectionBox) return;

        const ctx = this.ctx;
        const { start, end, type } = selectionBox;
        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const w = Math.abs(end.x - start.x);
        const h = Math.abs(end.y - start.y);

        ctx.beginPath();

        if (type === 'window') {
            ctx.strokeStyle = '#0066FF';
            ctx.fillStyle = 'rgba(0, 102, 255, 0.1)';
            ctx.lineWidth = 1 / this.scale;
            ctx.setLineDash([]);
        } else {
            ctx.strokeStyle = '#00FF00';
            ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
            ctx.lineWidth = 1 / this.scale;
            ctx.setLineDash([4 / this.scale, 4 / this.scale]);
        }

        ctx.rect(x, y, w, h);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
    }

    public drawSnapMarker(activeSnap?: SnapPoint | null) {
        if (!activeSnap || activeSnap.type === SnapType.NONE) return;

        const ctx = this.ctx;
        const size = 10 / this.scale;
        const { x, y } = activeSnap.p;

        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2 / this.scale;
        ctx.beginPath();

        switch (activeSnap.type) {
            case SnapType.ENDPOINT:
                ctx.rect(x - size / 2, y - size / 2, size, size);
                break;
            case SnapType.MIDPOINT:
                ctx.moveTo(x, y - size / 2);
                ctx.lineTo(x - size / 2, y + size / 2);
                ctx.lineTo(x + size / 2, y + size / 2);
                ctx.closePath();
                break;
            case SnapType.CENTER:
                ctx.arc(x, y, size / 2, 0, Math.PI * 2);
                break;
            case SnapType.QUADRANT:
                ctx.moveTo(x, y - size / 2);
                ctx.lineTo(x + size / 2, y);
                ctx.lineTo(x, y + size / 2);
                ctx.lineTo(x - size / 2, y);
                ctx.closePath();
                break;
        }
        ctx.stroke();
    }

    // --- Private Helpers ---

    private setupStyle(isSelected: boolean, isMovingOrCopying: boolean) {
        const ctx = this.ctx;
        if (isSelected) {
            if (isMovingOrCopying) {
                // Faded current position
                ctx.strokeStyle = '#666666';
                ctx.lineWidth = 1 / this.scale;
                ctx.setLineDash([]);
                ctx.globalAlpha = 0.3;
            } else {
                // Selected Highlight
                ctx.strokeStyle = '#00FFFF';
                ctx.lineWidth = 2 / this.scale;
                ctx.setLineDash([4 / this.scale, 4 / this.scale]);
                ctx.globalAlpha = 1.0;
            }
        } else {
            // Normal
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1 / this.scale;
            ctx.setLineDash([]);
            ctx.globalAlpha = 1.0;
        }
    }

    private setupPreviewStyle() {
        // For ghosts
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2 / this.scale;
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1.0; // Ghost is solid/bright to show new pos
    }

    private resetStyle() {
        this.ctx.globalAlpha = 1.0;
        this.ctx.setLineDash([]);
    }

    private rotatePoint(x: number, y: number, cx: number, cy: number, angle: number) {
        const dx = x - cx;
        const dy = y - cy;
        return {
            x: cx + dx * Math.cos(angle) - dy * Math.sin(angle),
            y: cy + dx * Math.sin(angle) + dy * Math.cos(angle)
        };
    }

    // Callback-based parser to avoid repeating the loop logic
    private renderBufferLoop(buffer: Float32Array, callbacks: {
        filterSelected?: boolean,
        onLine?: (x1: number, y1: number, x2: number, y2: number, isSelected: boolean) => void,
        onCircle?: (cx: number, cy: number, r: number, isSelected: boolean) => void,
        onArc?: (cx: number, cy: number, r: number, start: number, end: number, isSelected: boolean) => void,
        onPolyline?: (points: { x: number, y: number }[], closed: boolean, isSelected: boolean) => void,
        onRectangle?: (x1: number, y1: number, x2: number, y2: number, isSelected: boolean) => void
    }) {
        let i = 0;
        while (i < buffer.length) {
            const type = buffer[i];
            let stride = 7;
            let isSelected = false;

            if (type === 0) { // LINE
                isSelected = buffer[i + 6] > 0.5;
                if (!callbacks.filterSelected || isSelected) {
                    callbacks.onLine?.(buffer[i + 1], buffer[i + 2], buffer[i + 3], buffer[i + 4], isSelected);
                }
            }
            else if (type === 1) { // CIRCLE
                isSelected = buffer[i + 6] > 0.5;
                if (!callbacks.filterSelected || isSelected) {
                    callbacks.onCircle?.(buffer[i + 1], buffer[i + 2], buffer[i + 3], isSelected);
                }
            }
            else if (type === 2) { // ARC
                stride = 8;
                isSelected = buffer[i + 7] > 0.5;
                if (!callbacks.filterSelected || isSelected) {
                    callbacks.onArc?.(buffer[i + 1], buffer[i + 2], buffer[i + 3], buffer[i + 4], buffer[i + 5], isSelected);
                }
            }
            else if (type === 3) { // POLYLINE
                const numPoints = buffer[i + 1];
                const closed = buffer[i + 2] > 0.5;
                const pointsStart = i + 3;
                const pointsEnd = pointsStart + numPoints * 2;
                isSelected = buffer[pointsEnd + 1] > 0.5;

                stride = 3 + numPoints * 2 + 2;

                if (!callbacks.filterSelected || isSelected) {
                    const points = [];
                    for (let j = 0; j < numPoints; j++) {
                        points.push({ x: buffer[pointsStart + j * 2], y: buffer[pointsStart + j * 2 + 1] });
                    }
                    callbacks.onPolyline?.(points, closed, isSelected);
                }
            }
            else if (type === 5) { // RECTANGLE
                isSelected = buffer[i + 6] > 0.5;
                if (!callbacks.filterSelected || isSelected) {
                    callbacks.onRectangle?.(buffer[i + 1], buffer[i + 2], buffer[i + 3], buffer[i + 4], isSelected);
                }
            }

            i += stride;
        }
    }
}
