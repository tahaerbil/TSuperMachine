/**
 * CAD Editor Type Definitions
 */

export interface Point2D {
    x: number;
    y: number;
}

export type CommandState =
    | { type: 'IDLE' }
    | { type: 'LINE', step: 'START' }
    | { type: 'LINE', step: 'END', p1: { x: number, y: number }, firstPoint: { x: number, y: number }, allPoints: { x: number, y: number }[] }
    | { type: 'CIRCLE', step: 'CENTER' }
    | { type: 'CIRCLE', step: 'RADIUS', center: { x: number, y: number } }
    | { type: 'CIRCLE', step: 'DIAMETER', center: { x: number, y: number } }
    | { type: 'CIRCLE', step: '2P_FIRST' }
    | { type: 'CIRCLE', step: '2P_SECOND', p1: { x: number, y: number } }
    | { type: 'CIRCLE', step: '3P_FIRST' }
    | { type: 'CIRCLE', step: '3P_SECOND', p1: { x: number, y: number } }
    | { type: 'CIRCLE', step: '3P_THIRD', p1: { x: number, y: number }, p2: { x: number, y: number } }
    | { type: 'POLYLINE', points: { x: number, y: number }[] }
    | { type: 'RECTANGLE', step: 'START', options?: { fillet?: number, chamfer?: number } }
    | { type: 'RECTANGLE', step: 'END', p1: { x: number, y: number }, options?: { fillet?: number, chamfer?: number } }
    | { type: 'RECTANGLE', step: 'DIMENSIONS_LENGTH', p1: { x: number, y: number }, options?: { fillet?: number, chamfer?: number } }
    | { type: 'RECTANGLE', step: 'DIMENSIONS_WIDTH', p1: { x: number, y: number }, length: number, options?: { fillet?: number, chamfer?: number } }
    | { type: 'RECTANGLE', step: 'DIMENSIONS_CORNER', p1: { x: number, y: number }, length: number, width: number, options?: { fillet?: number, chamfer?: number } }
    | { type: 'RECTANGLE', step: 'AREA_INPUT', p1: { x: number, y: number }, options?: { fillet?: number, chamfer?: number } }
    | { type: 'RECTANGLE', step: 'AREA_DIMENSION_SELECT', p1: { x: number, y: number }, area: number, options?: { fillet?: number, chamfer?: number } }
    | { type: 'RECTANGLE', step: 'AREA_LENGTH_INPUT', p1: { x: number, y: number }, area: number, calculateFor: 'length' | 'width', options?: { fillet?: number, chamfer?: number } }
    | { type: 'RECTANGLE', step: 'SET_FILLET', p1?: { x: number, y: number }, previousStep: 'START' | 'END' }
    | { type: 'RECTANGLE', step: 'SET_CHAMFER', p1?: { x: number, y: number }, previousStep: 'START' | 'END' }
    | { type: 'ARC', step: 'CENTER' }
    | { type: 'ARC', step: 'START', center: { x: number, y: number } }
    | { type: 'ARC', step: 'END', center: { x: number, y: number }, radius: number, startAngle: number }
    | { type: 'POLYGON', step: 'SIDES', sides: number }
    | { type: 'POLYGON', step: 'CENTER', sides: number }
    | { type: 'POLYGON', step: 'RADIUS', sides: number, center: { x: number, y: number } }
    | { type: 'MOVE', step: 'BASE' }
    | { type: 'MOVE', step: 'DESTINATION', basePoint: { x: number, y: number } }
    | { type: 'COPY', step: 'BASE' }
    | { type: 'COPY', step: 'DESTINATION', basePoint: { x: number, y: number } }
    | { type: 'ROTATE', step: 'BASE' }
    | { type: 'ROTATE', step: 'ANGLE', basePoint: { x: number, y: number } }
    | { type: 'OFFSET', step: 'DISTANCE' }
    | { type: 'OFFSET', step: 'SELECT', distance: number }
    | { type: 'OFFSET', step: 'SIDE', distance: number, entityId: number }
    | { type: 'ERASE' };

export interface PreviewState {
    line: { x1: number, y1: number, x2: number, y2: number } | null;
    circle: { cx: number, cy: number, r: number } | null;
    polyline: { x: number, y: number }[] | null;
    rectangle: { x1: number, y1: number, x2: number, y2: number } | null;
    arc: { cx: number, cy: number, r: number, start: number, end: number } | null;
    move: { dx: number, dy: number } | null;
    copy: { dx: number, dy: number } | null;
    rotate: { cx: number, cy: number, angle: number } | null;
    selectionBox: { start: { x: number, y: number }, end: { x: number, y: number }, type: 'window' | 'crossing' } | null;
}
