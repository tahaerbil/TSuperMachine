/**
 * Sketch Protocol & Coordinate System
 * Handles mapping between 2D Sketch Space (u, v) and 3D World Space (x, y, z).
 */

import * as THREE from 'three';

export interface Point2D { x: number; y: number; }
export interface Point3D { x: number; y: number; z: number; }

/**
 * Represents a local 2D coordinate system in 3D space.
 * Defined by Origin, X-Axis, and Y-Axis (Normal is computed).
 */
export class SketchPlane {
    origin: THREE.Vector3;
    xAxis: THREE.Vector3;
    yAxis: THREE.Vector3;
    normal: THREE.Vector3;

    constructor(origin: Point3D, normal: Point3D, references?: { xAxis?: Point3D }) {
        this.origin = new THREE.Vector3(origin.x, origin.y, origin.z);
        this.normal = new THREE.Vector3(normal.x, normal.y, normal.z).normalize();

        // Calculate axes
        if (references?.xAxis) {
            this.xAxis = new THREE.Vector3(references.xAxis.x, references.xAxis.y, references.xAxis.z).normalize();
            // Ensure orthogonality
            this.xAxis.projectOnPlane(this.normal).normalize();
        } else {
            // Auto-calculate X axis (arbitrary but consistent)
            if (Math.abs(this.normal.x) < 0.9) {
                this.xAxis = new THREE.Vector3(1, 0, 0).cross(this.normal).normalize();
            } else {
                this.xAxis = new THREE.Vector3(0, 1, 0).cross(this.normal).normalize();
            }
        }

        this.yAxis = new THREE.Vector3().crossVectors(this.normal, this.xAxis).normalize();
    }

    /**
     * Map a 2D point on sketch to 3D world space
     */
    toWorld(local: Point2D): Point3D {
        const p = this.origin.clone()
            .addScaledVector(this.xAxis, local.x)
            .addScaledVector(this.yAxis, local.y);
        return { x: p.x, y: p.y, z: p.z };
    }

    /**
     * Map a 3D world point to the 2D sketch plane
     * (Projects onto the plane)
     */
    toLocal(world: Point3D): Point2D {
        const p = new THREE.Vector3(world.x, world.y, world.z).sub(this.origin);
        return {
            x: p.dot(this.xAxis),
            y: p.dot(this.yAxis)
        };
    }

    /**
     * Get the transformation matrix for this plane
     */
    getMatrix(): THREE.Matrix4 {
        const mat = new THREE.Matrix4();
        mat.makeBasis(this.xAxis, this.yAxis, this.normal);
        mat.setPosition(this.origin);
        return mat;
    }
}

// ----------------------------------------------------------------------------
// Sketch Element Definitions (2D)
// ----------------------------------------------------------------------------

export type SketchGeometryType = 'LINE' | 'CIRCLE' | 'ARC';

export interface SketchLine {
    type: 'LINE';
    start: Point2D;
    end: Point2D;
}

export interface SketchCircle {
    type: 'CIRCLE';
    center: Point2D;
    radius: number;
}

export interface SketchArc {
    type: 'ARC';
    center: Point2D;
    radius: number;
    startAngle: number;
    endAngle: number;
    clockwise: boolean;
}

export type SketchGeometry = SketchLine | SketchCircle | SketchArc;
