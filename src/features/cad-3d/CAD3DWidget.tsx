/**
 * CAD3DWidget - Professional 3D CAD Application Widget
 * Integrates native OpenCASCADE engine with React Three Fiber viewport
 */
import React, { useState, useEffect, useCallback } from 'react';
import { cad3DEngine, type Shape3DInfo } from '../../core/services/cad-3d-engine/CAD3DEngine';
import { Viewport3D } from './components/Viewport3D';
import { Toolbar3D, type ToolType } from './components/Toolbar3D';
import { FeatureTree } from './components/FeatureTree';
import { ExtrudeDialog, type ExtrudeParams } from './components/dialogs/ExtrudeDialog';
import { useStore } from '../../store/store';

interface CAD3DWidgetProps {
    id: string;
    isMaximized?: boolean;
}

export const CAD3DWidget: React.FC<CAD3DWidgetProps> = ({ id, isMaximized }) => {
    const [isEngineReady, setIsEngineReady] = useState(false);
    const [shapes, setShapes] = useState<Shape3DInfo[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [activeTool, setActiveTool] = useState<ToolType>('select');
    const [isSketchMode, setIsSketchMode] = useState(false); // Track Sketch Mode
    const [activeSketchId, setActiveSketchId] = useState<number | null>(null);
    const [activeDialog, setActiveDialog] = useState<'none' | 'extrude'>('none');
    const { updateWidget } = useStore();

    // Initialize engine
    useEffect(() => {
        const init = async () => {
            const success = await cad3DEngine.init();
            setIsEngineReady(success);

            if (success) {
                // Sync shapes from engine
                setShapes(cad3DEngine.getAllShapes());
            }
        };
        init();

        // Subscribe to shape changes
        const unsubscribe = cad3DEngine.subscribe(() => {
            setShapes(cad3DEngine.getAllShapes());
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // Handle tool actions
    const handleToolChange = useCallback((tool: ToolType) => {
        setActiveTool(tool);

        // Feature Modeling: Start Sketch
        if (tool === 'create_sketch') {
            if (!activeSketchId) {
                // Step 1: Create Plane (Default XY)
                const planeId = cad3DEngine.createDatumPlane({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, "Top Plane");
                // Step 2: Create Sketch
                const sketchId = cad3DEngine.createSketch(planeId, "Sketch 1");
                setActiveSketchId(sketchId);
                setSelectedId(sketchId);
                setIsSketchMode(true);
            }
        }

        // Feature Modeling: Extrude
        if (tool === 'extrude') {
            setActiveDialog('extrude');
            return;
        }

        // Sketching Tools (MVP: Add fixed elements for demo)
        if (isSketchMode && activeSketchId) {
            if (tool === 'sketch_rect') {
                cad3DEngine.addSketchLine(activeSketchId, { x: 0, y: 0 }, { x: 50, y: 0 });
                cad3DEngine.addSketchLine(activeSketchId, { x: 50, y: 0 }, { x: 50, y: 50 });
                cad3DEngine.addSketchLine(activeSketchId, { x: 50, y: 50 }, { x: 0, y: 50 });
                cad3DEngine.addSketchLine(activeSketchId, { x: 0, y: 50 }, { x: 0, y: 0 });
                console.log("Added rectangle to sketch");
                setActiveTool('select');
            }
            if (tool === 'sketch_circle') {
                cad3DEngine.addSketchCircle(activeSketchId, { x: 25, y: 25 }, 20);
                console.log("Added circle to sketch");
                setActiveTool('select');
            }
        }

        // Immediate actions for primitive creation
        const primitiveActions: Record<string, () => number> = {
            'box': () => cad3DEngine.createBox(100, 100, 100),
            'cylinder': () => cad3DEngine.createCylinder(50, 100),
            'sphere': () => cad3DEngine.createSphere(50),
            'cone': () => cad3DEngine.createCone(50, 25, 100),
            'torus': () => cad3DEngine.createTorus(50, 15),
        };

        if (primitiveActions[tool]) {
            const newId = primitiveActions[tool]();
            if (newId > 0) {
                setSelectedId(newId);
            }
            setActiveTool('select');
        }

        // Modification operations
        if (tool === 'fillet' && selectedId) {
            cad3DEngine.filletEdges(selectedId, 5); // 5mm radius
            setActiveTool('select');
        }

        if (tool === 'chamfer' && selectedId) {
            cad3DEngine.chamferEdges(selectedId, 3); // 3mm chamfer
            setActiveTool('select');
        }
    }, [selectedId, activeSketchId, isSketchMode]);

    const handleExtrudeApply = useCallback((params: ExtrudeParams) => {
        if (selectedId) {
            cad3DEngine.createExtrude(selectedId, params.distance);

            // Clean up
            setActiveDialog('none');
            setActiveTool('select');
            setIsSketchMode(false);
            setActiveSketchId(null);
        }
    }, [selectedId]);

    const handleFinishSketch = useCallback(() => {
        setIsSketchMode(false);
        setActiveSketchId(null);
        setActiveTool('select');
    }, []);

    // Shape selection
    const handleSelectShape = useCallback((shapeId: number | null) => {
        setSelectedId(shapeId);
        if (shapeId !== null) {
            cad3DEngine.selectShape(shapeId);
        }
    }, []);

    // File operations
    const handleImport = useCallback(async () => {
        console.log('[CAD3D] Import dialog - requires electronAPI.showOpenDialog');
    }, []);

    const handleExport = useCallback(async () => {
        if (!selectedId) return;
        console.log('[CAD3D] Export dialog - requires electronAPI.showSaveDialog');
    }, [selectedId]);

    // Clear all
    const handleClear = useCallback(() => {
        cad3DEngine.clear();
        setSelectedId(null);
        setIsSketchMode(false);
        setActiveSketchId(null);
    }, []);

    // Save state to widget store
    useEffect(() => {
        updateWidget(id, {
            data: {
                shapes3d: shapes.map(s => ({ id: s.id, type: s.type, name: s.name }))
            }
        });
    }, [shapes, id, updateWidget]);

    if (!isEngineReady) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-400">Initializing CAD3D Engine...</p>
                    <p className="text-gray-600 text-sm mt-2">Loading OpenCASCADE Kernel</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-gray-900">
            {/* Toolbar */}
            <Toolbar3D
                activeTool={activeTool}
                onToolChange={handleToolChange}
                onImport={handleImport}
                onExport={handleExport}
                onClear={handleClear}
                hasSelection={selectedId !== null}
                isSketchMode={isSketchMode}
                onFinishSketch={handleFinishSketch}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Dialogs Layer */}
                {activeDialog === 'extrude' && (
                    <ExtrudeDialog
                        onClose={() => setActiveDialog('none')}
                        onApply={handleExtrudeApply}
                        selectionCount={selectedId ? 1 : 0}
                    />
                )}

                {/* Left: Feature Tree */}
                <FeatureTree
                    shapes={shapes}
                    selectedId={selectedId}
                    onSelect={handleSelectShape}
                />

                {/* Center: Viewport */}
                <div className="flex-1 relative">
                    {/* Sketch Mode Indicator */}
                    {isSketchMode && (
                        <div className="absolute top-4 left-4 bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded border border-yellow-500/50 backdrop-blur z-10 text-xs font-bold pointer-events-none">
                            ✎ SKETCH MODE ACTIVE
                        </div>
                    )}

                    <Viewport3D
                        shapes={shapes}
                        selectedId={selectedId}
                        onSelectShape={handleSelectShape}
                    />
                </div>

                {/* Right: Properties Panel */}
                {isMaximized && selectedId && (
                    <div className="w-64 bg-gray-800 border-l border-gray-700 p-4">
                        <h3 className="text-sm font-semibold text-gray-300 mb-4">Properties</h3>
                        {(() => {
                            const shape = shapes.find(s => s.id === selectedId);
                            if (!shape) return null;

                            return (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-gray-500">Name</label>
                                        <p className="text-sm text-white">{shape.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Type</label>
                                        <p className="text-sm text-white capitalize">{shape.type}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">ID</label>
                                        <p className="text-sm text-gray-400">#{shape.id}</p>
                                    </div>
                                    {shape.parameters && (
                                        <div>
                                            <label className="text-xs text-gray-500">Parameters</label>
                                            <div className="mt-1 space-y-1">
                                                {Object.entries(shape.parameters).map(([key, value]) => (
                                                    <div key={key} className="flex justify-between text-xs">
                                                        <span className="text-gray-400 capitalize">{key}</span>
                                                        <span className="text-white">
                                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* Status Bar */}
            <div className="h-6 px-4 flex items-center justify-between bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
                <span>{shapes.length} object{shapes.length !== 1 ? 's' : ''}</span>
                <span>
                    {selectedId ? `Selected: ${String(shapes.find(s => s.id === selectedId)?.name || 'Unknown')}` : 'Ready'}
                </span>
                <span className="text-green-400">● Engine Active</span>
            </div>
        </div>
    );
};

export default CAD3DWidget;
