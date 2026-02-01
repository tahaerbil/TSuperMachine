/**
 * Feature System for Parametric CAD
 * Manages the history tree, dependencies, and feature parameters.
 * Modeled after Siemens NX / SolidWorks feature trees.
 */

import { cad3DEngine } from './CAD3DEngine';

export type FeatureType =
    | 'DATUM_PLANE'
    | 'SKETCH'
    | 'EXTRUDE'
    | 'REVOLVE'
    | 'BOOLEAN'
    | 'FILLET'
    | 'CHAMFER';

export type FeatureStatus = 'VALID' | 'ERROR' | 'SUPPRESSED' | 'NEEDS_REBUILD';

export interface FeatureBase {
    id: string;
    name: string;
    type: FeatureType;
    timestamp: number;
    status: FeatureStatus;
    isVisible: boolean;
    dependencies: string[]; // IDs of features this depends on
    children: string[];     // IDs of features that depend on this
}

// ----------------------------------------------------------------------------
// Specific Feature Definitions
// ----------------------------------------------------------------------------

export interface DatumPlaneFeature extends FeatureBase {
    type: 'DATUM_PLANE';
    parameters: {
        origin: { x: number; y: number; z: number };
        normal: { x: number; y: number; z: number };
        refersTo?: { featureId: string; faceIndex: number }; // If built on existing face
    };
}

export interface SketchFeature extends FeatureBase {
    type: 'SKETCH';
    parameters: {
        planeId: string; // DatumPlane or planar face
        elements: SketchElement[];
    };
}

export interface ExtrudeFeature extends FeatureBase {
    type: 'EXTRUDE';
    parameters: {
        sketchId: string;
        distance: number;
        symmetric: boolean;
        operation: 'NEW' | 'ADD' | 'SUBTRACT' | 'INTERSECT';
        targetBodyId?: string; // For boolean ops
    };
}

export interface RevolveFeature extends FeatureBase {
    type: 'REVOLVE';
    parameters: {
        sketchId: string;
        axis: { origin: { x: num, y: num, z: num }, dir: { x: num, y: num, z: num } };
        angle: number;
    };
}

export type Feature = DatumPlaneFeature | SketchFeature | ExtrudeFeature | RevolveFeature;

// ----------------------------------------------------------------------------
// Sketch Types
// ----------------------------------------------------------------------------
type num = number;

export type SketchElementType = 'LINE' | 'CIRCLE' | 'ARC' | 'RECTANGLE';

export interface SketchElement {
    id: string;
    type: SketchElementType;
    geo: Record<string, unknown>; // Line {p1, p2}, Circle {center, r}, etc.
}

/**
 * Feature Manager Singleton
 * Responsible for maintaining the feature history and rebuilding the model.
 */
class FeatureManagerService {
    private features: Feature[] = [];
    private featureMap: Map<string, Feature> = new Map();
    private listeners: Set<() => void> = new Set();

    constructor() {
        // Create default Datum Planes (XY, YZ, ZX)
        this.addSystemDatums();
    }

    private addSystemDatums() {
        this.createDatumPlane({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, "XY Plane");
        this.createDatumPlane({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, "YZ Plane");
        this.createDatumPlane({ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, "ZX Plane");
    }

    // ------------------------------------------------------------------------
    // Feature Creation
    // ------------------------------------------------------------------------

    createDatumPlane(origin: { x: num, y: num, z: num }, normal: { x: num, y: num, z: num }, name?: string): string {
        const id = crypto.randomUUID();
        const feature: DatumPlaneFeature = {
            id,
            name: name || `Plane ${this.features.length + 1}`,
            type: 'DATUM_PLANE',
            timestamp: Date.now(),
            status: 'VALID',
            isVisible: true,
            dependencies: [],
            children: [],
            parameters: { origin, normal }
        };
        this.addFeature(feature);
        return id;
    }

    createSketch(planeId: string, name?: string): string {
        const id = crypto.randomUUID();
        const feature: SketchFeature = {
            id,
            name: name || `Sketch ${this.features.length + 1}`,
            type: 'SKETCH',
            timestamp: Date.now(),
            status: 'VALID', // Initially empty but valid
            isVisible: true,
            dependencies: [planeId],
            children: [],
            parameters: { planeId, elements: [] }
        };
        this.addFeature(feature);
        return id;
    }

    // ------------------------------------------------------------------------
    // Tree Management
    // ------------------------------------------------------------------------

    addFeature(feature: Feature) {
        this.features.push(feature);
        this.featureMap.set(feature.id, feature);

        // Update dependencies
        feature.dependencies.forEach(depId => {
            const dep = this.featureMap.get(depId);
            if (dep) dep.children.push(feature.id);
        });

        this.notify();
    }

    getFeatures(): Feature[] {
        return this.features;
    }

    getFeature(id: string): Feature | undefined {
        return this.featureMap.get(id);
    }

    // ------------------------------------------------------------------------
    // Rebuild System (The Core Logic)
    // ------------------------------------------------------------------------

    async rebuild() {
        console.log('[FeatureManager] Rebuilding model from history...');

        // Clear current native engine state
        cad3DEngine.clear();

        // Process each feature in order
        for (const feature of this.features) {
            if (feature.status === 'SUPPRESSED') continue;

            try {
                await this.buildFeature(feature);
                feature.status = 'VALID';
            } catch (error) {
                console.error(`Error building feature ${feature.name}:`, error);
                feature.status = 'ERROR';
                // In a robust system, we might break or continue heavily
            }
        }

        this.notify();
    }

    private async buildFeature(feature: Feature) {
        switch (feature.type) {
            case 'DATUM_PLANE':
                // Visual only, no physical body
                break;
            case 'SKETCH':
                // In future: Send sketch info to native engine to create wire objects
                break;
            case 'EXTRUDE':
                // Use native engine Extrude
                // await cad3DEngine.extrude(...)
                break;
            // ... handle others
        }
    }

    // ------------------------------------------------------------------------
    // Observability
    // ------------------------------------------------------------------------

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify() {
        this.listeners.forEach(l => l());
    }
}

export const featureManager = new FeatureManagerService();
