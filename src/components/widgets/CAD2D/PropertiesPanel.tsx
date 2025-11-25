import React from 'react';
import type { Shape } from './types';

interface PropertiesPanelProps {
    selectedShape: Shape | null;
    onUpdate: (updates: Partial<Shape>) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedShape, onUpdate }) => {
    if (!selectedShape) {
        return (
            <div className="w-64 bg-gray-50 border-l border-gray-200 p-4 h-1/2 flex items-center justify-center text-gray-400 text-sm">
                Select an object to view properties
            </div>
        );
    }

    return (
        <div className="w-64 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto h-1/2">
            <h3 className="font-medium text-gray-700 mb-4">Properties</h3>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">X</label>
                        <input
                            type="number"
                            value={Math.round(selectedShape.x || 0)}
                            onChange={(e) => onUpdate({ x: Number(e.target.value) })}
                            className="w-full px-2 py-1 text-sm border rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Y</label>
                        <input
                            type="number"
                            value={Math.round(selectedShape.y || 0)}
                            onChange={(e) => onUpdate({ y: Number(e.target.value) })}
                            className="w-full px-2 py-1 text-sm border rounded"
                        />
                    </div>
                </div>

                {(selectedShape.type === 'rectangle' || selectedShape.type === 'circle') && (
                    <div className="grid grid-cols-2 gap-2">
                        {selectedShape.type === 'rectangle' ? (
                            <>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Width</label>
                                    <input
                                        type="number"
                                        value={Math.round(selectedShape.width || 0)}
                                        onChange={(e) => onUpdate({ width: Number(e.target.value) })}
                                        className="w-full px-2 py-1 text-sm border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Height</label>
                                    <input
                                        type="number"
                                        value={Math.round(selectedShape.height || 0)}
                                        onChange={(e) => onUpdate({ height: Number(e.target.value) })}
                                        className="w-full px-2 py-1 text-sm border rounded"
                                    />
                                </div>
                            </>
                        ) : (
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Radius</label>
                                <input
                                    type="number"
                                    value={Math.round(selectedShape.radius || 0)}
                                    onChange={(e) => onUpdate({ radius: Number(e.target.value) })}
                                    className="w-full px-2 py-1 text-sm border rounded"
                                />
                            </div>
                        )}
                    </div>
                )}

                {selectedShape.type === 'text' && (
                    <>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Text Content</label>
                            <input
                                type="text"
                                value={selectedShape.text || ''}
                                onChange={(e) => onUpdate({ text: e.target.value })}
                                className="w-full px-2 py-1 text-sm border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Font Size</label>
                            <input
                                type="number"
                                value={selectedShape.fontSize || 20}
                                onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
                                className="w-full px-2 py-1 text-sm border rounded"
                            />
                        </div>
                    </>
                )}

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Stroke Color</label>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={selectedShape.stroke}
                            onChange={(e) => onUpdate({ stroke: e.target.value })}
                            className="h-8 w-8 rounded cursor-pointer"
                        />
                        <input
                            type="text"
                            value={selectedShape.stroke}
                            onChange={(e) => onUpdate({ stroke: e.target.value })}
                            className="flex-1 px-2 py-1 text-sm border rounded"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Stroke Width</label>
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={selectedShape.strokeWidth}
                        onChange={(e) => onUpdate({ strokeWidth: Number(e.target.value) })}
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Fill Color</label>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={selectedShape.fill || '#ffffff'}
                            onChange={(e) => onUpdate({ fill: e.target.value })}
                            className="h-8 w-8 rounded cursor-pointer"
                        />
                        <button
                            onClick={() => onUpdate({ fill: undefined })}
                            className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                        >
                            None
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
