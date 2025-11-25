import { useCallback } from 'react';
import DxfParser from 'dxf-parser';
import Drawing from 'dxf-writer';
import type { Shape, LayerData } from '../types';
import { useStore } from '../../../../store/store';

export const useDXF = (
    id: string,
    shapes: Shape[],
    layers: LayerData[],
    setShapes: (shapes: Shape[]) => void,
    setLayers: (layers: LayerData[]) => void,
    setActiveLayerId: (id: string) => void,
    setStagePos: (pos: { x: number, y: number }) => void,
    setStageScale: (scale: number) => void
) => {
    const { updateWidget } = useStore();

    const handleImportDXF = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) return;

            try {
                const parser = new DxfParser();
                const dxf = parser.parseSync(text);

                if (!dxf) {
                    alert('Failed to parse DXF file');
                    return;
                }

                // Import Layers
                const newLayers: LayerData[] = [];
                const layerMap = new Map<string, string>(); // DXF Layer Name -> Internal Layer ID

                if (dxf.tables && dxf.tables.layer && dxf.tables.layer.layers) {
                    Object.values(dxf.tables.layer.layers).forEach((layer: any) => {
                        const newId = crypto.randomUUID();
                        layerMap.set(layer.name, newId);
                        newLayers.push({
                            id: newId,
                            name: layer.name,
                            color: '#000000', // DXF colors are complex (ACI), defaulting to black for now
                            visible: layer.visible !== false,
                            locked: layer.frozen === true
                        });
                    });
                }

                if (newLayers.length === 0) {
                    const defaultId = crypto.randomUUID();
                    newLayers.push({ id: defaultId, name: '0', color: '#000000', visible: true, locked: false });
                    layerMap.set('0', defaultId);
                }

                // Import Entities
                const newShapes: Shape[] = [];
                if (dxf.entities) {
                    dxf.entities.forEach((entity: any) => {
                        const layerId = layerMap.get(entity.layer) || newLayers[0].id;
                        const common = {
                            id: crypto.randomUUID(),
                            layerId: layerId,
                            stroke: '#000000',
                            strokeWidth: 1,
                        };

                        if (entity.type === 'LINE') {
                            newShapes.push({
                                ...common,
                                type: 'line',
                                points: [entity.vertices[0].x, -entity.vertices[0].y, entity.vertices[1].x, -entity.vertices[1].y] // Flip Y for canvas
                            });
                        } else if (entity.type === 'CIRCLE') {
                            newShapes.push({
                                ...common,
                                type: 'circle',
                                x: entity.center.x,
                                y: -entity.center.y,
                                radius: entity.radius
                            });
                        } else if (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
                            if (entity.vertices && entity.vertices.length > 1) {
                                for (let i = 0; i < entity.vertices.length - 1; i++) {
                                    newShapes.push({
                                        ...common,
                                        id: crypto.randomUUID(),
                                        type: 'line',
                                        points: [entity.vertices[i].x, -entity.vertices[i].y, entity.vertices[i + 1].x, -entity.vertices[i + 1].y]
                                    });
                                }
                                if (entity.shape) { // Closed
                                    newShapes.push({
                                        ...common,
                                        id: crypto.randomUUID(),
                                        type: 'line',
                                        points: [entity.vertices[entity.vertices.length - 1].x, -entity.vertices[entity.vertices.length - 1].y, entity.vertices[0].x, -entity.vertices[0].y]
                                    });
                                }
                            }
                        } else if (entity.type === 'TEXT' || entity.type === 'MTEXT') {
                            newShapes.push({
                                ...common,
                                type: 'text',
                                x: entity.startPoint.x,
                                y: -entity.startPoint.y,
                                text: entity.text,
                                fontSize: entity.height || 12
                            });
                        }
                    });
                }

                setLayers(newLayers);
                setShapes(newShapes);
                setActiveLayerId(newLayers[0].id);
                updateWidget(id, { data: { shapes: newShapes, layers: newLayers } });

                // Reset view
                setStagePos({ x: 0, y: 0 });
                setStageScale(1);

            } catch (err) {
                console.error('DXF Import Error:', err);
                alert('Error importing DXF file');
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    }, [id, updateWidget, setShapes, setLayers, setActiveLayerId, setStagePos, setStageScale]);

    const handleExportDXF = useCallback(() => {
        try {
            const d = new Drawing() as any;

            // Add Layers
            layers.forEach(l => {
                d.addLayer(l.name, (Drawing as any).ACI.BLACK, 'CONTINUOUS');
            });

            // Add Entities
            shapes.forEach(s => {
                const layerName = layers.find(l => l.id === s.layerId)?.name || '0';

                if (s.type === 'line' && s.points) {
                    d.drawLine(s.points[0], -s.points[1], s.points[2], -s.points[3])
                        .setLayer(layerName);
                } else if (s.type === 'circle') {
                    d.drawCircle(s.x || 0, -(s.y || 0), s.radius || 0)
                        .setLayer(layerName);
                } else if (s.type === 'rectangle') {
                    // Draw as Polyline
                    const x = s.x || 0;
                    const y = -(s.y || 0); // Invert Y
                    const w = s.width || 0;
                    const h = -(s.height || 0); // Invert Height because Y is inverted

                    d.drawPolyline([
                        [x, y],
                        [x + w, y],
                        [x + w, y + h],
                        [x, y + h],
                        [x, y] // Close it
                    ]).setLayer(layerName);

                } else if (s.type === 'text') {
                    d.drawText(s.x || 0, -(s.y || 0), s.fontSize || 12, 0, s.text || '')
                        .setLayer(layerName);
                }
            });

            const dxfString = d.toDxfString();
            const blob = new Blob([dxfString], { type: 'application/dxf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'drawing.dxf';
            link.click();
            URL.revokeObjectURL(url);

        } catch (err) {
            console.error('DXF Export Error:', err);
            alert('Error exporting DXF file');
        }
    }, [shapes, layers]);

    return { handleImportDXF, handleExportDXF };
};
