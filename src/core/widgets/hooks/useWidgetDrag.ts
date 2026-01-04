/**
 * useWidgetDrag Hook
 * 
 * Handles widget drag, snap, and group movement:
 * - Drag with position tracking
 * - Snap to other widgets
 * - Group dragging (parent-child attachments)
 * - Batch position updates for performance
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { useStore } from '../../../store/store';
import type { Widget } from '../../../store/store';
import { WIDGET_SNAP_DISTANCE } from '../../canvas/constants';

interface Position {
    x: number;
    y: number;
}

interface UseWidgetDragProps {
    widget: Widget;
}

interface UseWidgetDragReturn {
    /** Local position for smooth dragging */
    localPos: Position;
    /** Whether widget is currently being dragged */
    isDragging: React.MutableRefObject<boolean>;
    /** Handle drag start event */
    onDragStart: (e: MouseEvent | TouchEvent | React.MouseEvent) => void;
    /** Handle drag event */
    onDrag: (e: MouseEvent | TouchEvent | React.MouseEvent) => void;
    /** Handle drag stop event */
    onDragStop: () => void;
}

/**
 * Find all descendants (recursive children) of a widget
 */
function findDescendants(rootId: string, allWidgets: Widget[]): string[] {
    const descendants: string[] = [];
    const queue = [rootId];

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        const children = allWidgets.filter(w => w.attachedToId === currentId);
        children.forEach(child => {
            descendants.push(child.id);
            queue.push(child.id);
        });
    }
    return descendants;
}

export function useWidgetDrag({ widget }: UseWidgetDragProps): UseWidgetDragReturn {
    const { updateWidget, updateWidgets, widgets, canvas } = useStore();

    // Local state for smooth dragging
    const [localPos, setLocalPos] = useState(widget.position);
    const isDragging = useRef(false);

    // Drag state for ghost position tracking
    const dragStartPos = useRef<Position | null>(null);
    const dragStartMouse = useRef<Position | null>(null);

    // Group dragging state
    const draggingGroup = useRef<string[]>([]);
    const potentialParentId = useRef<string | null>(null);

    // Sync local state with store when not dragging
    // This pattern is intentional - we need to sync external position changes
    // when the widget is moved by other means (e.g., group drag from parent)
    useEffect(() => {
        if (!isDragging.current) {
            setLocalPos(widget.position);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [widget.position.x, widget.position.y]);

    /**
     * Handle drag start
     */
    const onDragStart = useCallback((e: MouseEvent | TouchEvent | React.MouseEvent) => {
        isDragging.current = true;
        const me = e as MouseEvent;

        // Capture start state for "Ghost Position" tracking
        dragStartPos.current = { x: localPos.x, y: localPos.y };
        dragStartMouse.current = { x: me.clientX, y: me.clientY };

        // 1. Detach Self
        if (widget.attachedToId) {
            updateWidget(widget.id, { attachedToId: null });
        }

        // 2. Find Descendants
        draggingGroup.current = findDescendants(widget.id, widgets);
    }, [localPos, widget.id, widget.attachedToId, widgets, updateWidget]);

    /**
     * Handle drag (called on every mouse move during drag)
     */
    const onDrag = useCallback((e: MouseEvent | TouchEvent | React.MouseEvent) => {
        if (widget.isMaximized) return;

        const me = e as MouseEvent;

        // Calculate TRUE position based on mouse delta
        if (!dragStartPos.current || !dragStartMouse.current) return;

        const deltaX = (me.clientX - dragStartMouse.current.x) / canvas.scale;
        const deltaY = (me.clientY - dragStartMouse.current.y) / canvas.scale;

        let newX = dragStartPos.current.x + deltaX;
        let newY = dragStartPos.current.y + deltaY;

        let snappedToId: string | null = null;

        // Candidates for snapping (exclude self and descendants)
        const descendantsSet = new Set(draggingGroup.current);
        const candidates = widgets.filter(w => w.id !== widget.id && !descendantsSet.has(w.id));

        for (const other of candidates) {
            // Check for overlaps (Cross-Axis)
            const vertOverlap = (newY < other.position.y + other.size.height + WIDGET_SNAP_DISTANCE) &&
                (newY + widget.size.height > other.position.y - WIDGET_SNAP_DISTANCE);
            const horzOverlap = (newX < other.position.x + other.size.width + WIDGET_SNAP_DISTANCE) &&
                (newX + widget.size.width > other.position.x - WIDGET_SNAP_DISTANCE);

            let snapped = false;

            // Snap Left/Right
            if (vertOverlap) {
                if (Math.abs(newX - (other.position.x + other.size.width)) < WIDGET_SNAP_DISTANCE) {
                    newX = other.position.x + other.size.width;
                    snapped = true;
                } else if (Math.abs((newX + widget.size.width) - other.position.x) < WIDGET_SNAP_DISTANCE) {
                    newX = other.position.x - widget.size.width;
                    snapped = true;
                }
            }

            // Snap Top/Bottom
            if (horzOverlap) {
                if (Math.abs(newY - (other.position.y + other.size.height)) < WIDGET_SNAP_DISTANCE) {
                    newY = other.position.y + other.size.height;
                    snapped = true;
                } else if (Math.abs((newY + widget.size.height) - other.position.y) < WIDGET_SNAP_DISTANCE) {
                    newY = other.position.y - widget.size.height;
                    snapped = true;
                }
            }

            if (snapped) {
                snappedToId = other.id;
                break;
            }
        }

        potentialParentId.current = snappedToId;

        // Update Visual Position
        const newPos = { x: newX, y: newY };
        setLocalPos(newPos);

        // Move Group (Batch Update)
        const moveDeltaX = newPos.x - widget.position.x;
        const moveDeltaY = newPos.y - widget.position.y;

        const updates: { id: string; updates: { position: Position } }[] = [];
        updates.push({ id: widget.id, updates: { position: newPos } });

        draggingGroup.current.forEach(descendantId => {
            const child = widgets.find(w => w.id === descendantId);
            if (child) {
                updates.push({
                    id: descendantId,
                    updates: {
                        position: {
                            x: child.position.x + moveDeltaX,
                            y: child.position.y + moveDeltaY
                        }
                    }
                });
            }
        });

        if (updates.length > 0) updateWidgets(updates);
    }, [widget, widgets, canvas.scale, updateWidgets]);

    /**
     * Handle drag stop
     */
    const onDragStop = useCallback(() => {
        isDragging.current = false;
        dragStartPos.current = null;
        dragStartMouse.current = null;

        // Apply Attachment if Snapped
        if (potentialParentId.current) {
            const isSafe = !draggingGroup.current.includes(potentialParentId.current);
            if (isSafe) {
                updateWidget(widget.id, { attachedToId: potentialParentId.current });
            }
        }

        potentialParentId.current = null;
        draggingGroup.current = [];
    }, [widget.id, updateWidget]);

    return {
        localPos,
        isDragging,
        onDragStart,
        onDrag,
        onDragStop,
    };
}

export default useWidgetDrag;
