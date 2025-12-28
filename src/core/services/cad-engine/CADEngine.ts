// CAD Engine - Supports both Native Addon (Electron) and WASM (Web)
// Native addon has priority for better performance, falls back to WASM

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

// Native CAD API type (exposed by Electron preload)
interface NativeCADAPI {
    createEngine: () => boolean;
    destroyEngine: () => boolean;
    addLine: (x1: number, y1: number, x2: number, y2: number) => number;
    addCircle: (cx: number, cy: number, radius: number) => number;
    addRectangle: (x1: number, y1: number, x2: number, y2: number) => number;
    addArc: (cx: number, cy: number, radius: number, startAngle: number, endAngle: number) => number;
    addRegularPolygon: (cx: number, cy: number, sides: number, radius: number) => number;
    addPolyline: (points: { x: number; y: number }[], closed: boolean) => number;
    clear: () => void;
    deleteEntity: (id: number) => void;
    hitTest: (x: number, y: number, threshold: number) => number;
    selectEntity: (id: number) => void;
    deselectAll: () => void;
    deleteSelected: () => void;
    moveSelected: (dx: number, dy: number) => void;
    copySelected: (dx: number, dy: number) => void;
    selectByWindow: (x1: number, y1: number, x2: number, y2: number) => void;
    selectByCrossing: (x1: number, y1: number, x2: number, y2: number) => void;
    rotateSelected: (cx: number, cy: number, angle: number) => void;
    offsetEntity: (id: number, distance: number, clickX: number, clickY: number) => number;
    exportDatabase: () => string;
    importDatabase: (json: string) => void;
    findClosestSnapPoint: (x: number, y: number, threshold: number) => { x: number; y: number; type: number };
    getRenderBuffer: () => Float32Array;
}

interface ElectronAPI {
    platform: string;
    isElectron: boolean;
    hasNativeCAD: boolean;
}

// WASM types
interface VectorPoint {
    push_back(point: Point): void;
    delete(): void;
}

interface CADModule {
    Engine: { new(): CppEngine };
    VectorPoint: { new(): VectorPoint };
}

interface EmbindSnapPoint {
    p: Point;
    type: { value: number };
}

interface CppEngine {
    addLine(x1: number, y1: number, x2: number, y2: number): number;
    addCircle(cx: number, cy: number, radius: number): number;
    addPolyline(points: VectorPoint, closed: boolean): number;
    addRectangle(x1: number, y1: number, x2: number, y2: number): number;
    addArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): number;
    addRegularPolygon(cx: number, cy: number, sides: number, radius: number): number;
    clear(): void;
    deleteEntity(id: number): void;
    getRenderBuffer(): Float32Array;
    findClosestSnapPoint(x: number, y: number, threshold: number): EmbindSnapPoint;
    hitTest(x: number, y: number, threshold: number): number;
    selectEntity(id: number): void;
    deselectAll(): void;
    deleteSelected(): void;
    moveSelected(dx: number, dy: number): void;
    copySelected(dx: number, dy: number): void;
    selectByWindow(x1: number, y1: number, x2: number, y2: number): void;
    selectByCrossing(x1: number, y1: number, x2: number, y2: number): void;
    rotateSelected(cx: number, cy: number, angle: number): void;
    offsetEntity(id: number, distance: number, clickX: number, clickY: number): number;
    delete(): void;
}

declare global {
    interface Window {
        createCADEngine?: () => Promise<CADModule>;
        electronAPI?: ElectronAPI;
        nativeCAD?: NativeCADAPI;
    }
}

type EngineType = 'native' | 'wasm' | 'none';

export class CADEngine {
    private module: CADModule | null = null;
    private wasmEngine: CppEngine | null = null;
    private isReady: boolean = false;
    private engineType: EngineType = 'none';

    constructor() { }

    getEngineType(): EngineType {
        return this.engineType;
    }

    async init(): Promise<void> {
        if (this.isReady) return;

        // Try Native CAD first (Electron with native addon)
        if (window.nativeCAD && window.electronAPI?.hasNativeCAD) {
            try {
                window.nativeCAD.createEngine();
                this.engineType = 'native';
                this.isReady = true;
                console.log('✅ CAD Engine Initialized (Native C++ Addon)');
                return;
            } catch (error) {
                console.warn('Native CAD initialization failed:', error);
            }
        }

        // Fallback to WASM
        if (!window.createCADEngine) {
            await new Promise<void>((resolve, reject) => {
                const script = document.createElement('script');
                script.src = '/wasm/cad_engine.js';
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Failed to load CAD engine script'));
                document.body.appendChild(script);
            });
        }

        this.module = await window.createCADEngine!();
        this.wasmEngine = new this.module.Engine();
        this.engineType = 'wasm';
        this.isReady = true;
        console.log('✅ CAD Engine Initialized (C++/WASM)');
    }

    // =========================================================================
    // Drawing Commands
    // =========================================================================

    addLine(x1: number, y1: number, x2: number, y2: number): number {
        if (!this.isReady) throw new Error('Engine not initialized');
        if (this.engineType === 'native') {
            return window.nativeCAD!.addLine(x1, y1, x2, y2);
        }
        return this.wasmEngine!.addLine(x1, y1, x2, y2);
    }

    addCircle(cx: number, cy: number, radius: number): number {
        if (!this.isReady) throw new Error('Engine not initialized');
        if (this.engineType === 'native') {
            return window.nativeCAD!.addCircle(cx, cy, radius);
        }
        return this.wasmEngine!.addCircle(cx, cy, radius);
    }

    addPolyline(points: Point[], closed: boolean): number {
        if (!this.isReady) throw new Error('Engine not initialized');

        if (this.engineType === 'native') {
            return window.nativeCAD!.addPolyline(points, closed);
        }

        const VectorPoint = this.module!.VectorPoint;
        const vec = new VectorPoint();
        for (const pt of points) {
            vec.push_back({ x: pt.x, y: pt.y });
        }
        const id = this.wasmEngine!.addPolyline(vec, closed);
        vec.delete();
        return id;
    }

    addRectangle(x1: number, y1: number, x2: number, y2: number): number {
        if (!this.isReady) throw new Error('Engine not initialized');
        if (this.engineType === 'native') {
            return window.nativeCAD!.addRectangle(x1, y1, x2, y2);
        }
        return this.wasmEngine!.addRectangle(x1, y1, x2, y2);
    }

    addArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): number {
        if (!this.isReady) throw new Error('Engine not initialized');
        if (this.engineType === 'native') {
            return window.nativeCAD!.addArc(cx, cy, radius, startAngle, endAngle);
        }
        return this.wasmEngine!.addArc(cx, cy, radius, startAngle, endAngle);
    }

    addRegularPolygon(cx: number, cy: number, sides: number, radius: number): number {
        if (!this.isReady) throw new Error('Engine not initialized');
        if (this.engineType === 'native') {
            return window.nativeCAD!.addRegularPolygon(cx, cy, sides, radius);
        }
        return this.wasmEngine!.addRegularPolygon(cx, cy, sides, radius);
    }

    // =========================================================================
    // Modification Commands
    // =========================================================================

    clear(): void {
        if (!this.isReady) throw new Error('Engine not initialized');
        if (this.engineType === 'native') {
            window.nativeCAD!.clear();
        } else {
            this.wasmEngine!.clear();
        }
    }

    deleteEntity(id: number): void {
        if (!this.isReady) throw new Error('Engine not initialized');
        if (this.engineType === 'native') {
            window.nativeCAD!.deleteEntity(id);
        } else {
            this.wasmEngine!.deleteEntity(id);
        }
    }

    // =========================================================================
    // Rendering
    // =========================================================================

    getRenderBuffer(): Float32Array {
        if (!this.isReady) throw new Error('Engine not initialized');
        if (this.engineType === 'native') {
            return window.nativeCAD!.getRenderBuffer();
        }
        return this.wasmEngine!.getRenderBuffer();
    }

    // =========================================================================
    // Snapping
    // =========================================================================

    findClosestSnapPoint(x: number, y: number, threshold: number): SnapPoint {
        if (!this.isReady) throw new Error('Engine not initialized');

        if (this.engineType === 'native') {
            const snap = window.nativeCAD!.findClosestSnapPoint(x, y, threshold);
            return {
                p: { x: snap.x, y: snap.y },
                type: snap.type as SnapType
            };
        }

        const rawSnap = this.wasmEngine!.findClosestSnapPoint(x, y, threshold);
        return {
            p: rawSnap.p,
            type: rawSnap.type.value as SnapType
        };
    }

    // =========================================================================
    // Selection
    // =========================================================================

    hitTest(x: number, y: number, threshold: number): number {
        if (!this.isReady) throw new Error('Engine not initialized');
        if (this.engineType === 'native') {
            return window.nativeCAD!.hitTest(x, y, threshold);
        }
        return this.wasmEngine!.hitTest(x, y, threshold);
    }

    selectEntity(id: number): void {
        if (!this.isReady) throw new Error('Engine not initialized');
        if (this.engineType === 'native') {
            window.nativeCAD!.selectEntity(id);
        } else {
            this.wasmEngine!.selectEntity(id);
        }
    }

    deselectAll(): void {
        if (!this.isReady) throw new Error('Engine not initialized');
        if (this.engineType === 'native') {
            window.nativeCAD!.deselectAll();
        } else {
            this.wasmEngine!.deselectAll();
        }
    }

    deleteSelected(): void {
        if (!this.isReady) throw new Error('Engine not initialized');
        if (this.engineType === 'native') {
            window.nativeCAD!.deleteSelected();
        } else {
            this.wasmEngine!.deleteSelected();
        }
    }

    moveSelected(dx: number, dy: number): void {
        if (!this.isReady) throw new Error('Engine not initialized');
        if (this.engineType === 'native') {
            window.nativeCAD!.moveSelected(dx, dy);
        } else {
            this.wasmEngine!.moveSelected(dx, dy);
        }
    }

    copySelected(dx: number, dy: number): void {
        if (!this.isReady) throw new Error('Engine not initialized');
        if (this.engineType === 'native') {
            window.nativeCAD!.copySelected(dx, dy);
        } else {
            this.wasmEngine!.copySelected(dx, dy);
        }
    }

    selectByWindow(x1: number, y1: number, x2: number, y2: number): void {
        if (!this.isReady) throw new Error('Engine not initialized');
        if (this.engineType === 'native') {
            window.nativeCAD!.selectByWindow(x1, y1, x2, y2);
        } else {
            this.wasmEngine!.selectByWindow(x1, y1, x2, y2);
        }
    }

    selectByCrossing(x1: number, y1: number, x2: number, y2: number): void {
        if (!this.isReady) throw new Error('Engine not initialized');
        if (this.engineType === 'native') {
            window.nativeCAD!.selectByCrossing(x1, y1, x2, y2);
        } else {
            this.wasmEngine!.selectByCrossing(x1, y1, x2, y2);
        }
    }

    rotateSelected(cx: number, cy: number, angle: number): void {
        if (!this.isReady) throw new Error('Engine not initialized');
        if (this.engineType === 'native') {
            window.nativeCAD!.rotateSelected(cx, cy, angle);
        } else {
            this.wasmEngine!.rotateSelected(cx, cy, angle);
        }
    }

    offsetEntity(id: number, distance: number, clickX: number, clickY: number): number {
        if (!this.isReady) throw new Error('Engine not initialized');
        if (this.engineType === 'native') {
            return window.nativeCAD!.offsetEntity(id, distance, clickX, clickY);
        }
        return this.wasmEngine!.offsetEntity(id, distance, clickX, clickY);
    }

    exportDatabase(): string {
        if (!this.isReady) throw new Error('Engine not initialized');
        if (this.engineType === 'native') {
            return window.nativeCAD!.exportDatabase();
        }
        console.warn('Export not supported in WASM mode yet');
        return "[]";
    }

    importDatabase(json: string): void {
        if (!this.isReady) throw new Error('Engine not initialized');
        if (this.engineType === 'native') {
            window.nativeCAD!.importDatabase(json);
            return;
        }
        console.warn('Import not supported in WASM mode yet');
    }

    // =========================================================================
    // Lifecycle
    // =========================================================================

    destroy(): void {
        if (this.engineType === 'native') {
            window.nativeCAD?.destroyEngine();
        } else if (this.wasmEngine) {
            this.wasmEngine.delete();
            this.wasmEngine = null;
        }
        this.isReady = false;
        this.engineType = 'none';
    }
}

// Singleton instance
export const cadEngine = new CADEngine();
