/**
 * Wire Layer Component
 * 
 * Renders SVG bezier curves between connected widgets.
 * Overlays on top of canvas content but below widgets.
 */

import React, { useMemo, useCallback } from 'react';
import { useStore } from '../../store/store';

interface Point {
    x: number;
    y: number;
}

type HandlePlacement = 'top' | 'right' | 'bottom' | 'left';

interface WireProps {
    start: Point;
    end: Point;
    isActive: boolean;
    isPreview?: boolean;
    onClick?: () => void;
    sourcePlacement?: HandlePlacement;
    targetPlacement?: HandlePlacement;
}

/**
 * Calculates control points for a smooth bezier curve based on handle placement.
 */
const getBezierPath = (
    start: Point,
    end: Point,
    sourcePlacement: HandlePlacement = 'right',
    targetPlacement: HandlePlacement = 'left'
): string => {
    const deltaX = Math.abs(end.x - start.x);
    const deltaY = Math.abs(end.y - start.y);
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Control point distance factor (adjust for curve tightness)
    const factor = Math.min(dist * 0.5, 150);

    const cp1 = { x: start.x, y: start.y };
    const cp2 = { x: end.x, y: end.y };

    // Adjust control point 1 based on source handle direction
    switch (sourcePlacement) {
        case 'top': cp1.y -= factor; break;
        case 'bottom': cp1.y += factor; break;
        case 'left': cp1.x -= factor; break;
        case 'right': cp1.x += factor; break;
    }

    // Adjust control point 2 based on target handle direction
    // (Opposite direction because it enters the handle)
    switch (targetPlacement) {
        case 'top': cp2.y -= factor; break;
        case 'bottom': cp2.y += factor; break;
        case 'left': cp2.x -= factor; break;
        case 'right': cp2.x += factor; break;
    }

    return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
};

/**
 * Single wire (bezier curve) between two points.
 */
const Wire: React.FC<WireProps> = ({
    start,
    end,
    isActive,
    isPreview = false,
    onClick,
    sourcePlacement = 'right',
    targetPlacement = 'left'
}) => {
    const path = getBezierPath(start, end, sourcePlacement, targetPlacement);

    // Wire colors - Theme compatible
    const strokeColor = isPreview || isActive
        ? 'var(--color-primary)'
        : 'var(--color-border)';

    const strokeOpacity = isPreview
        ? 0.6
        : isActive
            ? 0.8
            : 0.5;

    const strokeWidth = isPreview ? 2 : 3;

    return (
        <g className="wire-group" style={{ cursor: onClick ? 'pointer' : 'default' }}>
            {/* Hit area (wider invisible stroke for easier clicking) */}
            {onClick && (
                <path
                    d={path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={12}
                    onClick={onClick}
                />
            )}
            {/* Visible stroke */}
            <path
                d={path}
                fill="none"
                stroke={strokeColor}
                strokeOpacity={strokeOpacity}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                style={{
                    transition: 'stroke 0.2s ease, stroke-opacity 0.2s ease',
                    pointerEvents: 'none'
                }}
            />
            {/* Animated flow indicator (only for active wires) */}
            {isActive && !isPreview && (
                <circle r="4" fill="var(--color-primary)" fillOpacity={0.9}>
                    <animateMotion
                        dur="1.5s"
                        repeatCount="indefinite"
                        path={path}
                        keyPoints="0;1"
                        keyTimes="0;1"
                        calcMode="linear"
                    />
                </circle>
            )}
            {/* End point indicators */}
            <circle cx={start.x} cy={start.y} r={isPreview ? 3 : 4} fill={strokeColor} fillOpacity={strokeOpacity} />
            <circle cx={end.x} cy={end.y} r={isPreview ? 3 : 4} fill={strokeColor} fillOpacity={strokeOpacity} />
        </g>
    );
};

/**
 * Calculate absolute position of a connection point on a widget.
 */
function getWidgetConnectionPoint(
    widget: { position: { x: number; y: number }; size: { width: number; height: number } },
    side: HandlePlacement
): Point {
    const { position, size } = widget;
    switch (side) {
        case 'top': return { x: position.x + size.width / 2, y: position.y };
        case 'bottom': return { x: position.x + size.width / 2, y: position.y + size.height };
        case 'left': return { x: position.x, y: position.y + size.height / 2 };
        case 'right': return { x: position.x + size.width, y: position.y + size.height / 2 };
    }
}

/**
 * Find the optimal source and target handles based on widget relative positions.
 * This is used when connection data doesn't specify handles (legacy) or for smart defaults.
 */
function getOptimalHandles(
    sourceWidget: { position: Point; size: { width: number; height: number } },
    targetWidget: { position: Point; size: { width: number; height: number } }
): { source: HandlePlacement; target: HandlePlacement } {
    const sourceCenter = {
        x: sourceWidget.position.x + sourceWidget.size.width / 2,
        y: sourceWidget.position.y + sourceWidget.size.height / 2
    };
    const targetCenter = {
        x: targetWidget.position.x + targetWidget.size.width / 2,
        y: targetWidget.position.y + targetWidget.size.height / 2
    };

    const dx = targetCenter.x - sourceCenter.x;
    const dy = targetCenter.y - sourceCenter.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > absDy) {
        // Horizontal relationship
        return {
            source: dx > 0 ? 'right' : 'left',
            target: dx > 0 ? 'left' : 'right'
        };
    } else {
        // Vertical relationship
        return {
            source: dy > 0 ? 'bottom' : 'top',
            target: dy > 0 ? 'top' : 'bottom'
        };
    }
}

/**
 * Wire Layer - renders all connections between widgets.
 */
export const WireLayer: React.FC = () => {
    const widgets = useStore(state => state.widgets);
    const connections = useStore(state => state.connections);
    const canvas = useStore(state => state.canvas);
    const wireDragState = useStore(state => state.wireDragState);
    const removeConnection = useStore(state => state.removeConnection);

    // Transform widget world positions to screen positions
    const transformToScreen = useCallback((point: Point): Point => ({
        x: point.x * canvas.scale + canvas.offset.x,
        y: point.y * canvas.scale + canvas.offset.y
    }), [canvas.scale, canvas.offset.x, canvas.offset.y]);

    // Build wire data from connections
    const wires = useMemo(() => {
        return connections.map(connection => {
            const sourceWidget = widgets.find(w => w.id === connection.sourceWidgetId);
            const targetWidget = widgets.find(w => w.id === connection.targetWidgetId);

            if (!sourceWidget || !targetWidget) {
                return null;
            }

            // Get handles from connection data OR calculate optimal default
            let sourceHandle = connection.sourceHandle;
            let targetHandle = connection.targetHandle;

            if (!sourceHandle || !targetHandle) {
                const optimal = getOptimalHandles(sourceWidget, targetWidget);
                sourceHandle = sourceHandle || optimal.source;
                targetHandle = targetHandle || optimal.target;
            }

            const start = transformToScreen(getWidgetConnectionPoint(sourceWidget, sourceHandle));
            const end = transformToScreen(getWidgetConnectionPoint(targetWidget, targetHandle));

            return {
                id: connection.id,
                start,
                end,
                isActive: connection.isActive,
                sourceHandle,
                targetHandle
            };
        }).filter(Boolean) as {
            id: string;
            start: Point;
            end: Point;
            isActive: boolean;
            sourceHandle: HandlePlacement;
            targetHandle: HandlePlacement;
        }[];
    }, [connections, widgets, transformToScreen]);

    // Handle wire right-click to remove
    const handleWireClick = (connectionId: string) => {
        if (confirm('Remove this connection?')) {
            removeConnection(connectionId);
        }
    };

    return (
        <svg
            className="wire-layer"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0, // Behind widgets (which usually start at 1+)
                overflow: 'visible'
            }}
        >
            {/* Existing connections */}
            {wires.map(wire => (
                <Wire
                    key={wire.id}
                    start={wire.start}
                    end={wire.end}
                    isActive={wire.isActive}
                    sourcePlacement={wire.sourceHandle}
                    targetPlacement={wire.targetHandle}
                    onClick={() => handleWireClick(wire.id)}
                />
            ))}

            {/* Preview wire while dragging */}
            {wireDragState.isDragging && wireDragState.startPosition && wireDragState.currentPosition && (
                <Wire
                    start={wireDragState.startPosition}
                    end={wireDragState.currentPosition}
                    isActive={false}
                    isPreview={true}
                    sourcePlacement={wireDragState.sourceHandle}
                    // For preview, target placement is just opposite of source for natural look
                    targetPlacement={
                        wireDragState.sourceHandle === 'left' ? 'right' :
                            wireDragState.sourceHandle === 'right' ? 'left' :
                                wireDragState.sourceHandle === 'top' ? 'bottom' : 'top'
                    }
                />
            )}
        </svg>
    );
};

export default WireLayer;
