import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Box, Sphere, Cylinder } from '@react-three/drei';
import { useStore } from '../../store/store';
import { Box as BoxIcon, Circle, Cylinder as CylinderIcon, Trash2 } from 'lucide-react';

type ShapeType = 'box' | 'sphere' | 'cylinder';

interface Shape3D {
    id: string;
    type: ShapeType;
    position: [number, number, number];
    color: string;
}

interface CAD3DWidgetProps {
    id: string;
    initialShapes?: Shape3D[];
}

export const CAD3DWidget: React.FC<CAD3DWidgetProps> = ({ id, initialShapes = [] }) => {
    const [shapes, setShapes] = useState<Shape3D[]>(initialShapes);
    const [selectedTool, setSelectedTool] = useState<ShapeType>('box');
    const { updateWidget } = useStore();

    const saveShapes = (newShapes: Shape3D[]) => {
        setShapes(newShapes);
        updateWidget(id, { data: { shapes3d: newShapes } });
    };

    const addShape = () => {
        const newShape: Shape3D = {
            id: crypto.randomUUID(),
            type: selectedTool,
            position: [
                (Math.random() - 0.5) * 5,
                Math.random() * 3,
                (Math.random() - 0.5) * 5
            ],
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
        };
        saveShapes([...shapes, newShape]);
    };

    const clearAll = () => {
        saveShapes([]);
    };

    return (
        <div className="w-full h-full flex flex-col bg-gray-900">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700 bg-gray-800">
                <button
                    onClick={() => setSelectedTool('box')}
                    className={`p-2 rounded ${selectedTool === 'box' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                    title="Box"
                >
                    <BoxIcon size={16} />
                </button>
                <button
                    onClick={() => setSelectedTool('sphere')}
                    className={`p-2 rounded ${selectedTool === 'sphere' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                    title="Sphere"
                >
                    <Circle size={16} />
                </button>
                <button
                    onClick={() => setSelectedTool('cylinder')}
                    className={`p-2 rounded ${selectedTool === 'cylinder' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                    title="Cylinder"
                >
                    <CylinderIcon size={16} />
                </button>

                <button
                    onClick={addShape}
                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                    Add Shape
                </button>

                <div className="h-6 w-px bg-gray-600 mx-1" />

                <button
                    onClick={clearAll}
                    className="p-2 hover:bg-red-900 text-red-400 rounded"
                    title="Clear All"
                >
                    <Trash2 size={16} />
                </button>

                <div className="flex-1" />
                <span className="text-xs text-gray-400">
                    {shapes.length} objects
                </span>
            </div>

            {/* 3D Canvas */}
            <div className="flex-1">
                <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={1} />
                    <Grid args={[20, 20]} />
                    <OrbitControls />

                    {shapes.map((shape) => {
                        if (shape.type === 'box') {
                            return (
                                <Box key={shape.id} position={shape.position} args={[1, 1, 1]}>
                                    <meshStandardMaterial color={shape.color} />
                                </Box>
                            );
                        } else if (shape.type === 'sphere') {
                            return (
                                <Sphere key={shape.id} position={shape.position} args={[0.5, 32, 32]}>
                                    <meshStandardMaterial color={shape.color} />
                                </Sphere>
                            );
                        } else if (shape.type === 'cylinder') {
                            return (
                                <Cylinder key={shape.id} position={shape.position} args={[0.5, 0.5, 1, 32]}>
                                    <meshStandardMaterial color={shape.color} />
                                </Cylinder>
                            );
                        }
                        return null;
                    })}
                </Canvas>
            </div>
        </div>
    );
};
