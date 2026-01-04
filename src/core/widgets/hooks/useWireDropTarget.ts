/**
 * useWireDropTarget Hook
 * 
 * Handles wire drop connection on widgets:
 * - Detects when a wire is dropped on this widget
 * - Calculates which edge (handle) is closest to drop point
 * - Creates connection between source and target widgets
 */

import { useCallback } from 'react';
import { useStore } from '../../../store/store';

interface Position {
    x: number;
    y: number;
}

interface Size {
    width: number;
    height: number;
}

type HandlePlacement = 'left' | 'right' | 'top' | 'bottom';

interface UseWireDropTargetProps {
    widgetId: string;
    widgetPosition: Position;
    widgetSize: Size;
}

interface UseWireDropTargetReturn {
    /** Handle mouse up event to detect wire drop */
    handleWireDrop: (e: React.MouseEvent) => void;
}

export function useWireDropTarget({
    widgetId,
    widgetPosition,
    widgetSize,
}: UseWireDropTargetProps): UseWireDropTargetReturn {

    /**
     * Handle wire drop - creates connection when wire is dropped on this widget
     */
    const handleWireDrop = useCallback((e: React.MouseEvent) => {
        const state = useStore.getState();
        const { wireDragState, addConnection, clearWireDragState, canvas } = state;

        if (wireDragState.isDragging && wireDragState.sourceWidgetId && wireDragState.sourceWidgetId !== widgetId) {
            e.stopPropagation();

            // Calculate widget screen coordinates
            const screenX = widgetPosition.x * canvas.scale + canvas.offset.x;
            const screenY = widgetPosition.y * canvas.scale + canvas.offset.y;
            const screenW = widgetSize.width * canvas.scale;
            const screenH = widgetSize.height * canvas.scale;

            const mouseX = e.clientX;
            const mouseY = e.clientY;

            // Calculate distance to each edge
            const distLeft = Math.abs(mouseX - screenX);
            const distRight = Math.abs(mouseX - (screenX + screenW));
            const distTop = Math.abs(mouseY - screenY);
            const distBottom = Math.abs(mouseY - (screenY + screenH));

            const min = Math.min(distLeft, distRight, distTop, distBottom);

            // Determine closest edge
            let targetHandle: HandlePlacement = 'left';
            if (min === distRight) targetHandle = 'right';
            else if (min === distTop) targetHandle = 'top';
            else if (min === distBottom) targetHandle = 'bottom';

            // Create connection
            addConnection(
                wireDragState.sourceWidgetId,
                widgetId,
                'manual',
                wireDragState.sourceHandle,
                targetHandle
            );

            clearWireDragState();
        }
    }, [widgetId, widgetPosition, widgetSize]);

    return {
        handleWireDrop,
    };
}

export default useWireDropTarget;
