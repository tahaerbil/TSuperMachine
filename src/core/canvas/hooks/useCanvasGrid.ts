/**
 * useCanvasGrid Hook
 * 
 * Handles dot grid rendering on canvas:
 * - Uses HTML canvas for pixel-perfect dot rendering
 * - Responsive to zoom and pan
 * - Optimized with requestAnimationFrame throttling
 */

import { useEffect, useRef } from 'react';
import { useStore } from '../../../store/store';
import {
    GRID_SPACING,
    GRID_DOT_RADIUS,
    GRID_DOT_COLOR,
} from '../constants';

interface UseCanvasGridProps {
    /** Reference to the grid canvas element */
    gridCanvasRef: React.RefObject<HTMLCanvasElement | null>;
    /** Reference to the container element for size calculations */
    containerRef: React.RefObject<HTMLDivElement | null>;
}

export function useCanvasGrid({
    gridCanvasRef,
    containerRef,
}: UseCanvasGridProps): void {
    const { canvas, gridStyle } = useStore();

    // RAF frame ID for cleanup
    const frameIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (gridStyle !== 'dots' || !gridCanvasRef.current || !containerRef.current) {
            return;
        }

        // Cancel any pending animation frame
        if (frameIdRef.current !== null) {
            cancelAnimationFrame(frameIdRef.current);
        }

        // Schedule render on next animation frame for throttling
        frameIdRef.current = requestAnimationFrame(() => {
            const gridCanvas = gridCanvasRef.current;
            const container = containerRef.current;
            if (!gridCanvas || !container) return;

            const ctx = gridCanvas.getContext('2d');
            if (!ctx) return;

            // Set canvas size to match container
            const rect = container.getBoundingClientRect();
            gridCanvas.width = rect.width;
            gridCanvas.height = rect.height;

            // Clear canvas
            ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

            // Calculate visible area in world coordinates
            const startWorldX = -canvas.offset.x / canvas.scale;
            const startWorldY = -canvas.offset.y / canvas.scale;
            const endWorldX = (gridCanvas.width - canvas.offset.x) / canvas.scale;
            const endWorldY = (gridCanvas.height - canvas.offset.y) / canvas.scale;

            // Snap to grid
            const startGridX = Math.floor(startWorldX / GRID_SPACING) * GRID_SPACING;
            const startGridY = Math.floor(startWorldY / GRID_SPACING) * GRID_SPACING;

            // Draw dots
            ctx.fillStyle = GRID_DOT_COLOR;

            for (let worldX = startGridX; worldX <= endWorldX; worldX += GRID_SPACING) {
                for (let worldY = startGridY; worldY <= endWorldY; worldY += GRID_SPACING) {
                    // Convert world coordinates to screen coordinates
                    const screenX = worldX * canvas.scale + canvas.offset.x;
                    const screenY = worldY * canvas.scale + canvas.offset.y;

                    // Draw dot at fixed screen size
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, GRID_DOT_RADIUS, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            frameIdRef.current = null;
        });

        return () => {
            if (frameIdRef.current !== null) {
                cancelAnimationFrame(frameIdRef.current);
                frameIdRef.current = null;
            }
        };
    }, [gridStyle, canvas.scale, canvas.offset.x, canvas.offset.y, gridCanvasRef, containerRef]);
}

export default useCanvasGrid;
