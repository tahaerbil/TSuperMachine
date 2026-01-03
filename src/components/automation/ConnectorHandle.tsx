/**
 * Connector Handle Component
 * 
 * A draggable handle that appears on widget hover.
 * Allows users to create connections by dragging to other widgets or canvas.
 */

import React, { useCallback, useRef, useState } from 'react';
import { Workflow } from 'lucide-react';
import { useStore } from '../../store/store';
import type { WidgetType } from '../../store/store';
import { connectionManager } from '../../core/services/automation';

interface ConnectorHandleProps {
    widgetId: string;
    widgetType: WidgetType;
    widgetPosition: { x: number; y: number };
    widgetSize: { width: number; height: number };
    isVisible: boolean;
    placement?: 'top' | 'right' | 'bottom' | 'left';
}

export const ConnectorHandle: React.FC<ConnectorHandleProps> = ({
    widgetId,
    widgetType,
    widgetPosition,
    widgetSize,
    isVisible,
    placement = 'right'
}) => {
    const setWireDragState = useStore(state => state.setWireDragState);
    const canvas = useStore(state => state.canvas);

    const [isDragging, setIsDragging] = useState(false);
    const handleRef = useRef<HTMLButtonElement>(null);

    // Check if this widget type can emit events (has automation capabilities)
    const emittableEvents = connectionManager.getEmittableEvents(widgetType);
    const canConnect = emittableEvents.length > 0;

    // Transform widget position to screen coordinates based on placement
    const getScreenPosition = useCallback(() => {
        let x = widgetPosition.x;
        let y = widgetPosition.y;

        switch (placement) {
            case 'right':
                x += widgetSize.width;
                y += widgetSize.height / 2;
                break;
            case 'left':
                y += widgetSize.height / 2;
                break;
            case 'top':
                x += widgetSize.width / 2;
                break;
            case 'bottom':
                x += widgetSize.width / 2;
                y += widgetSize.height;
                break;
        }

        return {
            x: x * canvas.scale + canvas.offset.x,
            y: y * canvas.scale + canvas.offset.y
        };
    }, [widgetPosition, widgetSize, canvas, placement]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!canConnect) return;

        e.preventDefault();
        e.stopPropagation();

        const startPos = getScreenPosition();

        setIsDragging(true);
        setWireDragState({
            isDragging: true,
            sourceWidgetId: widgetId,
            startPosition: startPos,
            currentPosition: startPos,
            sourceHandle: placement // Save which handle started the drag
        });

        // Add global listeners for drag
        const handleMouseMove = (moveEvent: MouseEvent) => {
            setWireDragState({
                currentPosition: { x: moveEvent.clientX, y: moveEvent.clientY }
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);

            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [canConnect, widgetId, getScreenPosition, setWireDragState, placement]);

    if (!canConnect) {
        return null; // Don't show handle for widgets that can't connect
    }

    // Determine position classes based on placement
    const getPositionClasses = () => {
        switch (placement) {
            case 'right': return '-right-3 top-1/2 -translate-y-1/2';
            case 'left': return '-left-3 top-1/2 -translate-y-1/2';
            case 'top': return '-top-3 left-1/2 -translate-x-1/2';
            case 'bottom': return '-bottom-3 left-1/2 -translate-x-1/2';
            default: return '-right-3 top-1/2 -translate-y-1/2';
        }
    };

    return (
        <button
            ref={handleRef}
            className={`
                connector-handle
                absolute ${getPositionClasses()}
                w-6 h-6 rounded-full
                flex items-center justify-center
                transition-all duration-200
                cursor-grab active:cursor-grabbing
                ${isVisible || isDragging ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
                ${isDragging ? 'ring-2 ring-indigo-400' : ''}
            `}
            style={{
                backgroundColor: isDragging ? '#818cf8' : '#6366f1', // indigo-400 : indigo-500
                color: 'white',
                border: '2px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                zIndex: 100,
                pointerEvents: isVisible || isDragging ? 'auto' : 'none'
            }}
            onMouseDown={handleMouseDown}
            title={`Drag to create automation connection (${placement})`}
        >
            <Workflow size={12} />
        </button>
    );
};

export default ConnectorHandle;
