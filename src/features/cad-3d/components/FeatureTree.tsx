/**
 * Feature Tree Panel
 * Displays history of CAD operations (Sketch, Feature, Primitive)
 */
import React from 'react';
import { ChevronRight, Box, Pencil, Hammer, Eye, EyeOff } from 'lucide-react';
import type { Shape3DInfo } from '../../../core/services/cad-3d-engine/CAD3DEngine';

interface FeatureTreeProps {
    shapes: Shape3DInfo[];
    selectedId: number | null;
    onSelect: (id: number) => void;
}

const FeatureIcon: React.FC<{ type: string }> = ({ type }) => {
    switch (type) {
        case 'sketch': return <Pencil size={14} className="text-yellow-400" />;
        case 'extrude':
        case 'revolve': return <Hammer size={14} className="text-blue-400" />;
        case 'datum': return <Box size={14} className="text-orange-400" />; // TODO: Plane icon
        default: return <Box size={14} className="text-gray-400" />;
    }
};

export const FeatureTree: React.FC<FeatureTreeProps> = ({ shapes, selectedId, onSelect }) => {
    return (
        <div className="w-64 bg-gray-900 border-r border-gray-700 flex flex-col h-full">
            <div className="p-2 bg-gray-800 border-b border-gray-700 text-xs font-bold text-gray-300 uppercase tracking-wider">
                Feature Manager
            </div>

            <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
                {/* System Origin */}
                <div className="flex items-center px-2 py-1 text-gray-500 text-xs opacity-70">
                    <ChevronRight size={12} className="mr-1" />
                    <span>Origin (XYZ)</span>
                </div>

                {/* Feature List */}
                {shapes.map(shape => (
                    <div
                        key={shape.id}
                        onClick={() => onSelect(shape.id)}
                        className={`
                            flex items-center px-2 py-1.5 rounded cursor-pointer text-sm mb-0.5 transition-colors
                            ${shape.id === selectedId
                                ? 'bg-blue-600/30 text-blue-200 border border-blue-500/50'
                                : 'text-gray-300 hover:bg-gray-800'
                            }
                        `}
                    >
                        {/* Expand Icon (Placeholder) */}
                        <div className="w-4 flex justify-center">
                            {shape.type === 'extrude' && <ChevronRight size={12} className="opacity-50" />}
                        </div>

                        {/* Icon */}
                        <div className="mr-2 opacity-80">
                            <FeatureIcon type={shape.type} />
                        </div>

                        {/* Name */}
                        <span className="flex-1 truncate select-none">{shape.name}</span>

                        {/* Visibility Toggle */}
                        <button className="p-1 hover:text-white text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            {shape.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
