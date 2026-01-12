/**
 * GeometryHelpers.ts
 * Pure functions for geometric calculations used in CAD drawing operations.
 */

export interface Point {
    x: number;
    y: number;
}

/**
 * Calculates vertices for a chamfered rectangle.
 */
export const calculateChamferedRectangle = (
    p1: Point,
    p2: Point,
    chamfer: number
): Point[] => {
    const xMin = Math.min(p1.x, p2.x);
    const xMax = Math.max(p1.x, p2.x);
    const yMin = Math.min(p1.y, p2.y);
    const yMax = Math.max(p1.y, p2.y);

    // Clamp chamfer to half dimensions to avoid self-intersection
    const w = xMax - xMin;
    const h = yMax - yMin;
    const d = Math.min(chamfer, w / 2, h / 2);

    return [
        { x: xMin + d, y: yMin },
        { x: xMax - d, y: yMin },
        { x: xMax, y: yMin + d },
        { x: xMax, y: yMax - d },
        { x: xMax - d, y: yMax },
        { x: xMin + d, y: yMax },
        { x: xMin, y: yMax - d },
        { x: xMin, y: yMin + d }
    ];
};

/**
 * Calculates parameters for a filleted rectangle's lines and arcs.
 * Returns a sequence of operations to draw the shape.
 */
export const calculateFilletedRectangle = (
    p1: Point,
    p2: Point,
    fillet: number
) => {
    const xMin = Math.min(p1.x, p2.x);
    const xMax = Math.max(p1.x, p2.x);
    const yMin = Math.min(p1.y, p2.y);
    const yMax = Math.max(p1.y, p2.y);

    const w = xMax - xMin;
    const h = yMax - yMin;
    const r = Math.min(fillet, w / 2, h / 2);

    return {
        topLine: { x1: xMin + r, y1: yMin, x2: xMax - r, y2: yMin },
        topRightArc: { cx: xMax - r, cy: yMin + r, r, start: -Math.PI / 2, end: 0 },
        rightLine: { x1: xMax, y1: yMin + r, x2: xMax, y2: yMax - r },
        bottomRightArc: { cx: xMax - r, cy: yMax - r, r, start: 0, end: Math.PI / 2 },
        bottomLine: { x1: xMax - r, y2: yMax, x2: xMin + r, y1: yMax }, // y1/y2 consistent
        bottomLeftArc: { cx: xMin + r, cy: yMax - r, r, start: Math.PI / 2, end: Math.PI },
        leftLine: { x1: xMin, y1: yMax - r, x2: xMin, y2: yMin + r },
        topLeftArc: { cx: xMin + r, cy: yMin + r, r, start: Math.PI, end: 3 * Math.PI / 2 },
        rawRect: { xMin, yMin, xMax, yMax } // For non-filleted fallback if needed
    };
};

/**
 * Calculates the circumcircle (center and radius) of three points.
 * Returns null if points are collinear.
 */
export const calculateCircumcircle = (p1: Point, p2: Point, p3: Point): { center: Point, radius: number } | null => {
    const ax = p1.x, ay = p1.y;
    const bx = p2.x, by = p2.y;
    const cx = p3.x, cy = p3.y;

    const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));

    if (Math.abs(d) < 0.0001) {
        return null; // Collinear
    }

    const ax2ay2 = ax * ax + ay * ay;
    const bx2by2 = bx * bx + by * by;
    const cx2cy2 = cx * cx + cy * cy;

    const centerX = (ax2ay2 * (by - cy) + bx2by2 * (cy - ay) + cx2cy2 * (ay - by)) / d;
    const centerY = (ax2ay2 * (cx - bx) + bx2by2 * (ax - cx) + cx2cy2 * (bx - ax)) / d;
    const radius = Math.sqrt((ax - centerX) ** 2 + (ay - centerY) ** 2);

    return { center: { x: centerX, y: centerY }, radius };
};

export const calculateRectangleFromArea = (
    p1: Point,
    area: number,
    knownDimension: number,
    dimensionType: 'length' | 'width'
): Point => {
    const otherDim = area / knownDimension;
    // Assuming drawing in positive quadrant for simplicity, or matching user input direction
    // Logic in hook was: p1 + length, p1 + width
    // We'll preserve that simple assumption for now
    const length = dimensionType === 'length' ? knownDimension : otherDim;
    const width = dimensionType === 'width' ? knownDimension : otherDim;

    return { x: p1.x + length, y: p1.y + width };
};
