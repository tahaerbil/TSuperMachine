import React from 'react';
import { Layers, Eye, EyeOff, Lock, Unlock, Plus, Trash2 } from 'lucide-react';
import type { LayerData } from './types';

interface LayersPanelProps {
    layers: LayerData[];
    activeLayerId: string;
    onUpdateLayer: (id: string, updates: Partial<LayerData>) => void;
    onSetActiveLayer: (id: string) => void;
    onAddLayer: () => void;
    onDeleteLayer: (id: string) => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
    layers,
    activeLayerId,
    onUpdateLayer,
    onSetActiveLayer,
    onAddLayer,
    onDeleteLayer
}) => {
    return (
        <div className="w-64 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto flex flex-col h-1/2 border-b">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                    <Layers size={16} />
                    Layers
                </h3>
                <button
                    onClick={onAddLayer}
                    className="p-1 hover:bg-gray-200 rounded text-gray-600"
                    title="Add Layer"
                >
                    <Plus size={16} />
                </button>
            </div>
            <div className="space-y-2">
                {layers.map(layer => (
                    <div
                        key={layer.id}
                        className={`flex items-center gap-2 p-2 rounded border ${activeLayerId === layer.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}
                        onClick={() => onSetActiveLayer(layer.id)}
                    >
                        <div className="flex-1 min-w-0">
                            <input
                                type="text"
                                value={layer.name}
                                onChange={(e) => onUpdateLayer(layer.id, { name: e.target.value })}
                                className="w-full text-sm bg-transparent border-none focus:ring-0 p-0"
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <input
                                type="color"
                                value={layer.color}
                                onChange={(e) => onUpdateLayer(layer.id, { color: e.target.value })}
                                className="w-4 h-4 rounded cursor-pointer border-none p-0"
                                title="Layer Color"
                            />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateLayer(layer.id, { visible: !layer.visible });
                                }}
                                className={`p-1 rounded hover:bg-gray-100 ${!layer.visible ? 'text-gray-400' : 'text-gray-600'}`}
                                title={layer.visible ? "Hide Layer" : "Show Layer"}
                            >
                                {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateLayer(layer.id, { locked: !layer.locked });
                                }}
                                className={`p-1 rounded hover:bg-gray-100 ${layer.locked ? 'text-red-500' : 'text-gray-400'}`}
                                title={layer.locked ? "Unlock Layer" : "Lock Layer"}
                            >
                                {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteLayer(layer.id);
                                }}
                                className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500"
                                title="Delete Layer"
                                disabled={layers.length <= 1}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
