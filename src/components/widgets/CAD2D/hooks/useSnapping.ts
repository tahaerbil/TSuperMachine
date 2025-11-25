import { useState, useCallback } from 'react';
import type { Shape, LayerData } from '../types';

export const useSnapping = (shapes: Shape[], layers: LayerData[]) => {
    const [snapToGrid, setSnapToGrid] = useState(false);
    const [snapToObjects, setSnapToObjects] = useState(true);
    const [snapIndicator, setSnapIndicator] = useState<{ x: number, y: number, type: 'endpoint' | 'midpoint' | 'center' } | null>(null);

    const getSnapPoints = useCallback((currentShapes: Shape[]) => {
        // Only snap to visible layers
        const visibleLayerIds = new Set(layers.filter(l => l.visible).map(l => l.id));
        const visibleShapes = currentShapes.filter(s => !s.layerId || visibleLayerIds.has(s.layerId));

        const points: { x: number, y: number, type: 'endpoint' | 'midpoint' | 'center' }[] = [];
        visibleShapes.forEach(shape => {
            if (shape.type === 'line' && shape.points) {
                // Endpoints
                points.push({ x: shape.points[0], y: shape.points[1], type: 'endpoint' });
                points.push({ x: shape.points[2], y: shape.points[3], type: 'endpoint' });
                // Midpoint
                points.push({
                    x: (shape.points[0] + shape.points[2]) / 2,
                    y: (shape.points[1] + shape.points[3]) / 2,
                    type: 'midpoint'
                });
            } else if (shape.type === 'rectangle') {
                const x = shape.x || 0;
                const _y = shape.y || 0;
                const _w = shape.width || 0;
                const _h = shape.height || 0;
                // Corners (Endpoints)
                points.push({ x: x, y: _y, type: 'endpoint' });
                points.push({ x: x + _w, y: _y, type: 'endpoint' });
                points.push({ x: x + _w, y: _y + _h, type: 'endpoint' });
                points.push({ x: x, y: _y + _h, type: 'endpoint' });
                // Midpoints
                points.push({ x: x + _w / 2, y: _y, type: 'midpoint' });
                points.push({ x: x + _w, y: _y + _h / 2, type: 'midpoint' });
                points.push({ x: x + _w / 2, y: _y + _h, type: 'midpoint' });
                points.push({ x: x, y: _y + _h / 2, type: 'midpoint' });
                // Center
                points.push({ x: x + _w / 2, y: _y + _h / 2, type: 'center' });
            } else if (shape.type === 'circle') {
                const x = shape.x || 0;
                const y = shape.y || 0;
                const r = shape.radius || 0;
                // Center
                points.push({ x: x, y: y, type: 'center' });
                // Quadrants (treated as endpoints/midpoints)
                points.push({ x: x + r, y: y, type: 'endpoint' });
                points.push({ x: x - r, y: y, type: 'endpoint' });
                points.push({ x: x, y: y + r, type: 'endpoint' });
                points.push({ x: x, y: y - r, type: 'endpoint' });
            }
        });
        return points;
    }, [layers]);

    const getSnappedPos = useCallback((pos: { x: number, y: number }, scale: number) => {
        let snappedPos = { ...pos };
        let indicator = null;

        // 1. Object Snap (Priority)
        if (snapToObjects) {
            const snapPoints = getSnapPoints(shapes);
            const threshold = 10 / scale; // 10px screen distance
            let closestDist = threshold;

            for (const point of snapPoints) {
                const dx = point.x - pos.x;
                const dy = point.y - pos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < closestDist) {
                    closestDist = dist;
                    snappedPos = { x: point.x, y: point.y };
                    indicator = point;
                }
            }
        }

        // 2. Grid Snap (Secondary)
        if (!indicator && snapToGrid) {
            const gridSize = 10;
            snappedPos = {
                x: Math.round(snappedPos.x / gridSize) * gridSize,
                y: Math.round(snappedPos.y / gridSize) * gridSize
            };
        }

        setSnapIndicator(indicator);
        return snappedPos;
    }, [snapToObjects, snapToGrid, shapes, getSnapPoints]);

    const snapValue = useCallback((val: number) => {
        if (!snapToGrid) return val;
        const gridSize = 10; // Snap precision
        return Math.round(val / gridSize) * gridSize;
    }, [snapToGrid]);

    return {
        snapToGrid, setSnapToGrid,
        snapToObjects, setSnapToObjects,
        snapIndicator, setSnapIndicator,
        getSnappedPos,
        snapValue
    };
};
