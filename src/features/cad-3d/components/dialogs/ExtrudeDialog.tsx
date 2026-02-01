import React, { useState } from 'react';
import { ToolDialog } from './ToolDialog';

interface ExtrudeDialogProps {
    onClose: () => void;
    onApply: (params: ExtrudeParams) => void;
    selectionCount: number;
}

export interface ExtrudeParams {
    distance: number;
    symmetric: boolean;
    booleanType: 'create' | 'fuse' | 'cut' | 'intersect';
}

export const ExtrudeDialog: React.FC<ExtrudeDialogProps> = ({ onClose, onApply, selectionCount }) => {
    const [distance, setDistance] = useState(50);
    const [symmetric, setSymmetric] = useState(false);
    const [booleanType, setBooleanType] = useState<ExtrudeParams['booleanType']>('create');

    // Validation: Needs a selection (usually a sketch or face)
    const isValid = selectionCount > 0 && distance !== 0;

    const handleApply = () => {
        if (isValid) {
            onApply({ distance, symmetric, booleanType });
        }
    };

    return (
        <ToolDialog title="Extrude" onClose={onClose} onApply={handleApply} isValid={isValid}>
            <div className="space-y-4">
                {/* Selection Status */}
                <div className={`text-xs p-2 rounded ${selectionCount > 0 ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                    {selectionCount > 0 ? `${selectionCount} Profile(s) Selected` : 'Select a Sketch or Face'}
                </div>

                {/* Distance Input */}
                <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-medium">Distance (mm)</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={distance}
                            onChange={(e) => setDistance(parseFloat(e.target.value))}
                            className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                    <input
                        type="range"
                        min="-200" max="200"
                        value={distance}
                        onChange={(e) => setDistance(parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                {/* Options */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={symmetric}
                            onChange={(e) => setSymmetric(e.target.checked)}
                            className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-0"
                        />
                        <span className="text-xs text-gray-300">Symmetric Value</span>
                    </label>
                </div>

                <div className="w-full h-px bg-gray-700 my-2" />

                {/* Boolean Operation */}
                <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-medium">Boolean</label>
                    <select
                        value={booleanType}
                        onChange={(e) => setBooleanType(e.target.value as ExtrudeParams['booleanType'])}
                        className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1 text-sm text-white outline-none"
                    >
                        <option value="create">None (New Body)</option>
                        <option value="fuse">Unite</option>
                        <option value="cut">Subtract</option>
                        <option value="intersect">Intersect</option>
                    </select>
                </div>
            </div>
        </ToolDialog>
    );
};
