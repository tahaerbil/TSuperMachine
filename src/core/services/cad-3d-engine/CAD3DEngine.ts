/**
 * CAD3D Engine TypeScript Service
 * Bridge between React UI and Native C++ CAD Engine
 */

// Mesh data structure matching C++ MeshData
export interface MeshData {
    vertices: Float32Array;
    normals: Float32Array;
    indices: Uint32Array;
}

// Native CAD3D API interface (exposed by preload.ts)
export interface NativeCAD3D {
    createEngine(): boolean;
    destroyEngine(): boolean;

    // Feature Modeling (Phase 2)
    createDatumPlane(ox: number, oy: number, oz: number, nx: number, ny: number, nz: number): number;
    createSketch(planeId: number): number;
    addSketchLine(sketchId: number, x1: number, y1: number, x2: number, y2: number): void;
    addSketchCircle(sketchId: number, cx: number, cy: number, radius: number): void;
    createExtrude(sketchId: number, height: number): number;
    createRevolve(sketchId: number, px: number, py: number, pz: number, dx: number, dy: number, dz: number, angle: number): number;

    // Primitives
    createBox(dx: number, dy: number, dz: number): number;
    createCylinder(radius: number, height: number): number;
    createSphere(radius: number): number;
    createCone(bottomRadius: number, topRadius: number, height: number): number;
    createTorus(majorRadius: number, minorRadius: number): number;

    // Boolean
    booleanFuse(shapeA: number, shapeB: number): number;
    booleanCut(shapeA: number, shapeB: number): number;
    booleanCommon(shapeA: number, shapeB: number): number;

    // Modifications
    translateShape(id: number, dx: number, dy: number, dz: number): boolean;
    rotateShape(id: number, axisX: number, axisY: number, axisZ: number, angleDeg: number): boolean;
    filletEdges(id: number, radius: number): boolean;
    chamferEdges(id: number, distance: number): boolean;

    // Rendering
    getMeshData(id: number, deflection?: number): MeshData | null;

    // File I/O
    exportSTEP(id: number, filePath: string): boolean;
    exportIGES(id: number, filePath: string): boolean;
    importSTEP(filePath: string): number;
    importIGES(filePath: string): number;

    // Management
    deleteShape(id: number): boolean;
    clear(): void;
    getAllShapeIds(): number[];
}

// Note: Window.nativeCAD3D is typed in src/types/electron.d.ts

// Shape types for Feature Tree
// Shape types for Feature Tree
export type ShapeType = 'box' | 'cylinder' | 'sphere' | 'cone' | 'torus' | 'imported' | 'boolean' | 'datum' | 'sketch' | 'extrude' | 'revolve';

// Shape metadata for UI
export interface Shape3DInfo {
    id: number;
    type: ShapeType;
    name: string;
    visible: boolean;
    selected: boolean;
    parameters?: Record<string, unknown>;
}

/**
 * CAD3DEngine Singleton Service
 * Provides a clean API for 3D CAD operations
 */
class CAD3DEngineService {
    private isReady = false;
    private shapes: Map<number, Shape3DInfo> = new Map();
    private listeners: Set<() => void> = new Set();

    async init(): Promise<boolean> {
        if (this.isReady) return true;

        // Check for native addon
        if (window.nativeCAD3D && (window.electronAPI as { hasNativeCAD3D?: boolean })?.hasNativeCAD3D) {
            try {
                window.nativeCAD3D.createEngine();
                this.isReady = true;
                console.log('✅ CAD3D Engine Initialized (Native C++ with OpenCASCADE)');
                return true;
            } catch (error) {
                console.error('CAD3D initialization failed:', error);
                return false;
            }
        }

        console.warn('⚠️ CAD3D Native addon not available');
        return false;
    }

    // Subscribe to shape changes
    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify(): void {
        this.listeners.forEach(fn => fn());
    }

    // ========================================================================
    // Feature Modeling (Phase 2)
    // ========================================================================

    createDatumPlane(origin: { x: number, y: number, z: number }, normal: { x: number, y: number, z: number }, name?: string): number {
        if (!this.isReady) return 0;
        const id = window.nativeCAD3D!.createDatumPlane(origin.x, origin.y, origin.z, normal.x, normal.y, normal.z);
        if (id > 0) {
            this.shapes.set(id, {
                id, type: 'datum', name: name || `Datum ${id}`,
                visible: true, selected: false,
                parameters: { origin, normal }
            });
            this.notify();
        }
        return id;
    }

    createSketch(planeId: number, name?: string): number {
        if (!this.isReady) return 0;
        const id = window.nativeCAD3D!.createSketch(planeId);
        if (id > 0) {
            this.shapes.set(id, {
                id, type: 'sketch', name: name || `Sketch ${id}`,
                visible: true, selected: false,
                parameters: { planeId }
            });
            this.notify();
        }
        return id;
    }

    addSketchLine(sketchId: number, p1: { x: number, y: number }, p2: { x: number, y: number }) {
        if (!this.isReady) return;
        window.nativeCAD3D!.addSketchLine(sketchId, p1.x, p1.y, p2.x, p2.y);
    }

    addSketchCircle(sketchId: number, center: { x: number, y: number }, radius: number) {
        if (!this.isReady) return;
        window.nativeCAD3D!.addSketchCircle(sketchId, center.x, center.y, radius);
    }

    createExtrude(sketchId: number, height: number, name?: string): number {
        if (!this.isReady) return 0;
        const id = window.nativeCAD3D!.createExtrude(sketchId, height);
        if (id > 0) {
            this.shapes.set(id, {
                id, type: 'extrude', name: name || `Extrude ${id}`,
                visible: true, selected: false,
                parameters: { sketchId, height }
            });
            this.notify();
        }
        return id;
    }

    createRevolve(sketchId: number, axis: { origin: { x: number, y: number, z: number }, dir: { x: number, y: number, z: number } }, angle: number, name?: string): number {
        if (!this.isReady) return 0;
        const id = window.nativeCAD3D!.createRevolve(
            sketchId,
            axis.origin.x, axis.origin.y, axis.origin.z,
            axis.dir.x, axis.dir.y, axis.dir.z,
            angle
        );
        if (id > 0) {
            this.shapes.set(id, {
                id, type: 'revolve', name: name || `Revolve ${id}`,
                visible: true, selected: false,
                parameters: { sketchId, axis, angle }
            });
            this.notify();
        }
        return id;
    }

    // ========================================================================
    // Primitive Creation
    // ========================================================================
    createBox(dx: number, dy: number, dz: number, name?: string): number {
        if (!this.isReady || !window.nativeCAD3D) return 0;

        const id = window.nativeCAD3D.createBox(dx, dy, dz);
        if (id > 0) {
            this.shapes.set(id, {
                id,
                type: 'box',
                name: name || `Box ${id}`,
                visible: true,
                selected: false,
                parameters: { width: dx, depth: dy, height: dz }
            });
            this.notify();
        }
        return id;
    }

    createCylinder(radius: number, height: number, name?: string): number {
        if (!this.isReady || !window.nativeCAD3D) return 0;

        const id = window.nativeCAD3D.createCylinder(radius, height);
        if (id > 0) {
            this.shapes.set(id, {
                id,
                type: 'cylinder',
                name: name || `Cylinder ${id}`,
                visible: true,
                selected: false,
                parameters: { radius, height }
            });
            this.notify();
        }
        return id;
    }

    createSphere(radius: number, name?: string): number {
        if (!this.isReady || !window.nativeCAD3D) return 0;

        const id = window.nativeCAD3D.createSphere(radius);
        if (id > 0) {
            this.shapes.set(id, {
                id,
                type: 'sphere',
                name: name || `Sphere ${id}`,
                visible: true,
                selected: false,
                parameters: { radius }
            });
            this.notify();
        }
        return id;
    }

    createCone(bottomRadius: number, topRadius: number, height: number, name?: string): number {
        if (!this.isReady || !window.nativeCAD3D) return 0;

        const id = window.nativeCAD3D.createCone(bottomRadius, topRadius, height);
        if (id > 0) {
            this.shapes.set(id, {
                id,
                type: 'cone',
                name: name || `Cone ${id}`,
                visible: true,
                selected: false,
                parameters: { bottomRadius, topRadius, height }
            });
            this.notify();
        }
        return id;
    }

    createTorus(majorRadius: number, minorRadius: number, name?: string): number {
        if (!this.isReady || !window.nativeCAD3D) return 0;

        const id = window.nativeCAD3D.createTorus(majorRadius, minorRadius);
        if (id > 0) {
            this.shapes.set(id, {
                id,
                type: 'torus',
                name: name || `Torus ${id}`,
                visible: true,
                selected: false,
                parameters: { majorRadius, minorRadius }
            });
            this.notify();
        }
        return id;
    }

    // ========================================================================
    // Boolean Operations
    // ========================================================================
    booleanFuse(shapeA: number, shapeB: number, name?: string): number {
        if (!this.isReady || !window.nativeCAD3D) return 0;

        const id = window.nativeCAD3D.booleanFuse(shapeA, shapeB);
        if (id > 0) {
            this.shapes.set(id, {
                id,
                type: 'boolean',
                name: name || `Fuse ${id}`,
                visible: true,
                selected: false,
                parameters: { operation: 'fuse', shapeA, shapeB }
            });
            this.notify();
        }
        return id;
    }

    booleanCut(shapeA: number, shapeB: number, name?: string): number {
        if (!this.isReady || !window.nativeCAD3D) return 0;

        const id = window.nativeCAD3D.booleanCut(shapeA, shapeB);
        if (id > 0) {
            this.shapes.set(id, {
                id,
                type: 'boolean',
                name: name || `Cut ${id}`,
                visible: true,
                selected: false,
                parameters: { operation: 'cut', shapeA, shapeB }
            });
            this.notify();
        }
        return id;
    }

    booleanCommon(shapeA: number, shapeB: number, name?: string): number {
        if (!this.isReady || !window.nativeCAD3D) return 0;

        const id = window.nativeCAD3D.booleanCommon(shapeA, shapeB);
        if (id > 0) {
            this.shapes.set(id, {
                id,
                type: 'boolean',
                name: name || `Intersect ${id}`,
                visible: true,
                selected: false,
                parameters: { operation: 'common', shapeA, shapeB }
            });
            this.notify();
        }
        return id;
    }

    // ========================================================================
    // Modifications
    // ========================================================================
    translateShape(id: number, dx: number, dy: number, dz: number): boolean {
        if (!this.isReady || !window.nativeCAD3D) return false;
        const result = window.nativeCAD3D.translateShape(id, dx, dy, dz);
        if (result) this.notify();
        return result;
    }

    rotateShape(id: number, axisX: number, axisY: number, axisZ: number, angleDeg: number): boolean {
        if (!this.isReady || !window.nativeCAD3D) return false;
        const result = window.nativeCAD3D.rotateShape(id, axisX, axisY, axisZ, angleDeg);
        if (result) this.notify();
        return result;
    }

    filletEdges(id: number, radius: number): boolean {
        if (!this.isReady || !window.nativeCAD3D) return false;
        const result = window.nativeCAD3D.filletEdges(id, radius);
        if (result) this.notify();
        return result;
    }

    chamferEdges(id: number, distance: number): boolean {
        if (!this.isReady || !window.nativeCAD3D) return false;
        const result = window.nativeCAD3D.chamferEdges(id, distance);
        if (result) this.notify();
        return result;
    }

    // ========================================================================
    // Rendering
    // ========================================================================
    getMeshData(id: number, deflection = 0.1): MeshData | null {
        if (!this.isReady || !window.nativeCAD3D) return null;
        return window.nativeCAD3D.getMeshData(id, deflection);
    }

    // ========================================================================
    // File Operations
    // ========================================================================
    exportSTEP(id: number, filePath: string): boolean {
        if (!this.isReady || !window.nativeCAD3D) return false;
        return window.nativeCAD3D.exportSTEP(id, filePath);
    }

    exportIGES(id: number, filePath: string): boolean {
        if (!this.isReady || !window.nativeCAD3D) return false;
        return window.nativeCAD3D.exportIGES(id, filePath);
    }

    importSTEP(filePath: string): number {
        if (!this.isReady || !window.nativeCAD3D) return 0;

        const id = window.nativeCAD3D.importSTEP(filePath);
        if (id > 0) {
            const fileName = filePath.split('/').pop() || 'Imported';
            this.shapes.set(id, {
                id,
                type: 'imported',
                name: fileName,
                visible: true,
                selected: false,
                parameters: { source: filePath }
            });
            this.notify();
        }
        return id;
    }

    importIGES(filePath: string): number {
        if (!this.isReady || !window.nativeCAD3D) return 0;

        const id = window.nativeCAD3D.importIGES(filePath);
        if (id > 0) {
            const fileName = filePath.split('/').pop() || 'Imported';
            this.shapes.set(id, {
                id,
                type: 'imported',
                name: fileName,
                visible: true,
                selected: false,
                parameters: { source: filePath }
            });
            this.notify();
        }
        return id;
    }

    // ========================================================================
    // Management
    // ========================================================================
    deleteShape(id: number): boolean {
        if (!this.isReady || !window.nativeCAD3D) return false;

        const result = window.nativeCAD3D.deleteShape(id);
        if (result) {
            this.shapes.delete(id);
            this.notify();
        }
        return result;
    }

    clear(): void {
        if (!this.isReady || !window.nativeCAD3D) return;

        window.nativeCAD3D.clear();
        this.shapes.clear();
        this.notify();
    }

    getAllShapes(): Shape3DInfo[] {
        return Array.from(this.shapes.values());
    }

    getShape(id: number): Shape3DInfo | undefined {
        return this.shapes.get(id);
    }

    selectShape(id: number): void {
        // Deselect all first
        this.shapes.forEach(shape => { shape.selected = false; });

        const shape = this.shapes.get(id);
        if (shape) {
            shape.selected = true;
        }
        this.notify();
    }

    // ========================================================================
    // Lifecycle
    // ========================================================================
    destroy(): void {
        if (window.nativeCAD3D) {
            window.nativeCAD3D.destroyEngine();
        }
        this.shapes.clear();
        this.isReady = false;
    }

    get ready(): boolean {
        return this.isReady;
    }
}

// Singleton export
export const cad3DEngine = new CAD3DEngineService();
