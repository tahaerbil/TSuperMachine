/**
 * Viewport3D - Professional 3D CAD Viewport using React Three Fiber
 * Renders meshes from the native CAD3D engine
 */
import React, { useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { cad3DEngine, type Shape3DInfo } from '../../../core/services/cad-3d-engine/CAD3DEngine';

interface MeshObjectProps {
    shapeId: number;
    selected?: boolean;
    onSelect?: (id: number) => void;
}

/**
 * Individual mesh component rendered from native engine data
 */
const MeshObject: React.FC<MeshObjectProps> = ({ shapeId, selected, onSelect }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    // Get mesh data from native engine
    const geometry = useMemo(() => {
        const meshData = cad3DEngine.getMeshData(shapeId);
        if (!meshData) return null;

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(meshData.vertices, 3));
        geo.setAttribute('normal', new THREE.BufferAttribute(meshData.normals, 3));
        geo.setIndex(new THREE.BufferAttribute(meshData.indices, 1));
        geo.computeVertexNormals(); // Ensure smooth normals

        return geo;
    }, [shapeId]);

    if (!geometry) return null;

    return (
        <mesh
            ref={meshRef}
            geometry={geometry}
            onClick={(e) => {
                e.stopPropagation();
                onSelect?.(shapeId);
            }}
        >
            <meshStandardMaterial
                color={selected ? '#4FC3F7' : '#B0BEC5'}
                metalness={0.3}
                roughness={0.6}
                side={THREE.DoubleSide}
            />
            {/* Selection outline */}
            {selected && (
                <lineSegments>
                    <edgesGeometry args={[geometry]} />
                    <lineBasicMaterial color="#00E5FF" linewidth={2} />
                </lineSegments>
            )}
        </mesh>
    );
};

/**
 * Professional CAD Grid with metric units
 */
const CADGrid: React.FC = () => {
    return (
        <>
            {/* Major grid */}
            <Grid
                args={[1000, 1000]}
                cellSize={10}
                cellThickness={0.5}
                cellColor="#455A64"
                sectionSize={100}
                sectionThickness={1}
                sectionColor="#546E7A"
                fadeDistance={500}
                fadeStrength={1}
                followCamera={false}
                infiniteGrid={true}
            />
            {/* Origin axes */}
            <axesHelper args={[50]} />
        </>
    );
};

/**
 * Scene content - contains all 3D objects
 */
interface SceneContentProps {
    shapes: Shape3DInfo[];
    selectedId: number | null;
    onSelectShape: (id: number | null) => void;
}

const SceneContent: React.FC<SceneContentProps> = ({ shapes, selectedId, onSelectShape }) => {
    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.4} />
            <directionalLight
                position={[100, 100, 100]}
                intensity={1}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
            />
            <directionalLight position={[-100, 50, -100]} intensity={0.3} />

            {/* Environment for reflections */}
            <Environment preset="studio" />

            {/* Grid */}
            <CADGrid />

            {/* Render all visible shapes */}
            {shapes
                .filter(shape => shape.visible)
                .map(shape => (
                    <MeshObject
                        key={shape.id}
                        shapeId={shape.id}
                        selected={shape.id === selectedId}
                        onSelect={onSelectShape}
                    />
                ))
            }

            {/* Camera controls */}
            <OrbitControls
                makeDefault
                enableDamping
                dampingFactor={0.05}
                minDistance={10}
                maxDistance={5000}
            />

            {/* Gizmo helper (NX-style view cube) */}
            <GizmoHelper alignment="top-right" margin={[80, 80]}>
                <GizmoViewport
                    axisColors={['#EF5350', '#66BB6A', '#42A5F5']}
                    labelColor="white"
                />
            </GizmoHelper>
        </>
    );
};

/**
 * Main Viewport3D Component
 */
export interface Viewport3DProps {
    shapes: Shape3DInfo[];
    selectedId: number | null;
    onSelectShape: (id: number | null) => void;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({ shapes, selectedId, onSelectShape }) => {
    return (
        <Canvas
            shadows
            camera={{
                position: [200, 150, 200],
                fov: 45,
                near: 0.1,
                far: 10000
            }}
            gl={{
                antialias: true,
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.0
            }}
            style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)' }}
            onClick={() => onSelectShape(null)} // Click on empty space deselects
        >
            <SceneContent
                shapes={shapes}
                selectedId={selectedId}
                onSelectShape={onSelectShape}
            />
        </Canvas>
    );
};

export default Viewport3D;
