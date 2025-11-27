// Type definitions for the Emscripten module
export const SnapType = {
    NONE: 0,
    ENDPOINT: 1,
    MIDPOINT: 2,
    CENTER: 3,
    QUADRANT: 4,
    INTERSECTION: 5
} as const;

export type SnapType = typeof SnapType[keyof typeof SnapType];

export interface Point {
    x: number;
    y: number;
}

export interface SnapPoint {
    p: Point;
    type: SnapType;
}

interface CADModule {
    Engine: {
        new(): CppEngine;
    };
}

interface CppEngine {
    addLine(x1: number, y1: number, x2: number, y2: number): number;
    addCircle(cx: number, cy: number, radius: number): number;
    addPolyline(points: any, closed: boolean): number; // points is VectorPoint from Embind
    addRectangle(x1: number, y1: number, x2: number, y2: number): number;
    clear(): void;
    deleteEntity(id: number): void;
    getRenderBuffer(): Float32Array;
    findClosestSnapPoint(x: number, y: number, threshold: number): SnapPoint;
    hitTest(x: number, y: number, threshold: number): number;
    selectEntity(id: number): void;
    deselectAll(): void;
    deleteSelected(): void;
    delete(): void; // C++ destructor
}

declare global {
    interface Window {
        createCADEngine: () => Promise<CADModule>;
    }
}

export class CADEngine {
    private module: CADModule | null = null;
    private engine: CppEngine | null = null;
    private isReady: boolean = false;

    constructor() { }

    async init(): Promise<void> {
        if (this.isReady) return;

        // Load the script dynamically if not already loaded
        if (!window.createCADEngine) {
            await new Promise<void>((resolve, reject) => {
                const script = document.createElement('script');
                script.src = '/wasm/cad_engine.js';
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Failed to load CAD engine script'));
                document.body.appendChild(script);
            });
        }

        // Initialize the module
        this.module = await window.createCADEngine();
        this.engine = new this.module.Engine();
        this.isReady = true;
        console.log('CAD Engine Initialized (C++/Wasm)');
    }

    addLine(x1: number, y1: number, x2: number, y2: number): number {
        if (!this.engine) throw new Error('Engine not initialized');
        return this.engine.addLine(x1, y1, x2, y2);
    }

    addCircle(cx: number, cy: number, radius: number): number {
        if (!this.engine) throw new Error('Engine not initialized');
        return this.engine.addCircle(cx, cy, radius);
    }

    addPolyline(points: Point[], closed: boolean): number {
        if (!this.engine) throw new Error('Engine not initialized');

        // Create a VectorPoint from the module
        const VectorPoint = (this.module as any).VectorPoint;
        const vec = new VectorPoint();

        // Add all points to the vector
        for (const pt of points) {
            vec.push_back({ x: pt.x, y: pt.y });
        }

        const id = this.engine.addPolyline(vec, closed);

        // Clean up the vector
        vec.delete();

        return id;
    }

    addRectangle(x1: number, y1: number, x2: number, y2: number): number {
        if (!this.engine) throw new Error('Engine not initialized');
        return this.engine.addRectangle(x1, y1, x2, y2);
    }

    clear(): void {
        if (!this.engine) throw new Error('Engine not initialized');
        this.engine.clear();
    }

    deleteEntity(id: number): void {
        if (!this.engine) throw new Error('Engine not initialized');
        this.engine.deleteEntity(id);
    }

    getRenderBuffer(): Float32Array {
        if (!this.engine) throw new Error('Engine not initialized');
        return this.engine.getRenderBuffer();
    }

    findClosestSnapPoint(x: number, y: number, threshold: number): SnapPoint {
        if (!this.engine) throw new Error('Engine not initialized');
        const rawSnap = this.engine.findClosestSnapPoint(x, y, threshold);

        // Embind returns an enum object (with a .value property) for the type field
        // We need to convert it to a simple number to match our TS definition
        return {
            p: rawSnap.p,
            type: (rawSnap.type as any).value
        };
    }

    hitTest(x: number, y: number, threshold: number): number {
        if (!this.engine) throw new Error('Engine not initialized');
        return this.engine.hitTest(x, y, threshold);
    }

    selectEntity(id: number): void {
        if (!this.engine) throw new Error('Engine not initialized');
        this.engine.selectEntity(id);
    }

    deselectAll(): void {
        if (!this.engine) throw new Error('Engine not initialized');
        this.engine.deselectAll();
    }

    deleteSelected(): void {
        if (!this.engine) throw new Error('Engine not initialized');
        this.engine.deleteSelected();
    }

    destroy(): void {
        if (this.engine) {
            this.engine.delete();
            this.engine = null;
        }
        this.isReady = false;
    }
}

// Singleton instance
export const cadEngine = new CADEngine();
