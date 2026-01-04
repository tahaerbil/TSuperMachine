/**
 * useLassoSelection Hook
 * 
 * Handles lasso (marquee) selection on the canvas:
 * - Left-click drag to create selection rectangle
 * - World coordinate transformation for zoom support
 * - Widget intersection detection
 */

import { useState, useCallback } from 'react';
import { useStore } from '../../../store/store';

interface LassoPoint {
    x: number;
    y: number;
}

interface UseLassoSelectionReturn {
    /** Start point of lasso in screen coordinates */
    lassoStart: LassoPoint | null;
    /** End point of lasso in screen coordinates */
    lassoEnd: LassoPoint | null;
    /** Whether lasso selection is currently active */
    isLassoing: boolean;
    /** Handle mouse down to start lasso */
    handleLassoStart: (e: React.MouseEvent) => void;
    /** Handle mouse move to update lasso */
    handleLassoMove: (e: React.MouseEvent) => void;
    /** Handle mouse up to complete lasso selection */
    handleLassoEnd: () => void;
}

export function useLassoSelection(): UseLassoSelectionReturn {
    const { selectMultiple, exitEditMode } = useStore();

    const [lassoStart, setLassoStart] = useState<LassoPoint | null>(null);
    const [lassoEnd, setLassoEnd] = useState<LassoPoint | null>(null);
    const [isLassoing, setIsLassoing] = useState(false);

    /**
     * Handle mouse down to potentially start lasso selection
     */
    const handleLassoStart = useCallback((e: React.MouseEvent) => {
        // Exit edit mode when clicking on canvas background
        exitEditMode();

        // Only start lasso if:
        // - Left click (button 0)
        // - Clicking on canvas background (not on a widget)
        // - No modifier keys (Ctrl, Alt, Shift)
        if (
            e.button === 0 &&
            e.target === e.currentTarget &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.altKey &&
            !e.shiftKey
        ) {
            setLassoStart({ x: e.clientX, y: e.clientY });
            setLassoEnd({ x: e.clientX, y: e.clientY });
            setIsLassoing(true);
        }
    }, [exitEditMode]);

    /**
     * Handle mouse move to update lasso rectangle
     */
    const handleLassoMove = useCallback((e: React.MouseEvent) => {
        if (isLassoing && lassoStart) {
            setLassoEnd({ x: e.clientX, y: e.clientY });
        }
    }, [isLassoing, lassoStart]);

    /**
     * Handle mouse up to complete lasso selection
     */
    const handleLassoEnd = useCallback(() => {
        if (isLassoing && lassoStart && lassoEnd) {
            const { canvas: currentCanvas, widgets: currentWidgets } = useStore.getState();

            // Convert screen coordinates to world (canvas) coordinates
            // This fixes the bug where lasso selection fails at zoom != 1
            const worldLassoStart = {
                x: (lassoStart.x - currentCanvas.offset.x) / currentCanvas.scale,
                y: (lassoStart.y - currentCanvas.offset.y) / currentCanvas.scale
            };
            const worldLassoEnd = {
                x: (lassoEnd.x - currentCanvas.offset.x) / currentCanvas.scale,
                y: (lassoEnd.y - currentCanvas.offset.y) / currentCanvas.scale
            };

            // Create selection rectangle in world coordinates
            const rect = {
                x1: Math.min(worldLassoStart.x, worldLassoEnd.x),
                y1: Math.min(worldLassoStart.y, worldLassoEnd.y),
                x2: Math.max(worldLassoStart.x, worldLassoEnd.x),
                y2: Math.max(worldLassoStart.y, worldLassoEnd.y)
            };

            const selectedIds = currentWidgets.filter(widget => {
                const widgetRect = {
                    x1: widget.position.x,
                    y1: widget.position.y,
                    x2: widget.position.x + widget.size.width,
                    y2: widget.position.y + widget.size.height
                };

                // Check if widget intersects with lasso rectangle (both in world coords now)
                return !(
                    widgetRect.x2 < rect.x1 ||
                    widgetRect.x1 > rect.x2 ||
                    widgetRect.y2 < rect.y1 ||
                    widgetRect.y1 > rect.y2
                );
            }).map(w => w.id);

            if (selectedIds.length > 0) {
                selectMultiple(selectedIds);
            }
        }

        // Reset lasso state
        setIsLassoing(false);
        setLassoStart(null);
        setLassoEnd(null);
    }, [isLassoing, lassoStart, lassoEnd, selectMultiple]);

    return {
        lassoStart,
        lassoEnd,
        isLassoing,
        handleLassoStart,
        handleLassoMove,
        handleLassoEnd,
    };
}

export default useLassoSelection;
