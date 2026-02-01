import * as THREE from 'three';

/**
 * RaycasterService
 * Handles conversion of 2D mouse coordinates to 3D world coordinates
 * and hit testing against the scene geometry.
 */
export class RaycasterService {
    private raycaster: THREE.Raycaster;
    private mouse: THREE.Vector2;
    private camera: THREE.Camera | null = null;
    private scene: THREE.Scene | null = null;
    private canvas: HTMLCanvasElement | null = null;

    constructor() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Optimize raycasting for CAD
        this.raycaster.params.Line.threshold = 0.5;
        this.raycaster.params.Points.threshold = 0.5;
    }

    public attach(camera: THREE.Camera, scene: THREE.Scene, canvas: HTMLCanvasElement) {
        this.camera = camera;
        this.scene = scene;
        this.canvas = canvas;
    }

    public updateMouseCoordinates(event: MouseEvent) {
        if (!this.canvas) return;

        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    /**
     * Casts a ray and returns intersections with scene objects.
     * @param filterTypes Optional list of object types to filter (e.g., 'Mesh', 'Line')
     */
    public intersectObjects(objects?: THREE.Object3D[]) {
        if (!this.camera || !this.scene) return [];

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const target = objects || this.scene.children;
        return this.raycaster.intersectObjects(target, true);
    }

    /**
     * Projects the mouse position onto a specific 3D plane.
     * Useful for sketching on a datum plane or face.
     */
    public intersectPlane(planeOrigin: THREE.Vector3, planeNormal: THREE.Vector3): THREE.Vector3 | null {
        if (!this.camera) return null;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, planeOrigin);
        const target = new THREE.Vector3();

        const intersection = this.raycaster.ray.intersectPlane(plane, target);
        return intersection ? target.clone() : null;
    }
}

export const raycasterService = new RaycasterService();
