// Type definitions for the Emscripten module
interface CADModule {
    Engine: {
        new(): CppEngine;
    };
}

interface CppEngine {
    addLine(x1: number, y1: number, x2: number, y2: number): number;
    addCircle(cx: number, cy: number, radius: number): number;
    clear(): void;
    deleteEntity(id: number): void;
    getRenderBuffer(): Float32Array;
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
