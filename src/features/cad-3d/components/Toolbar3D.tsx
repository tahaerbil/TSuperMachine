/**
 * Toolbar3D - Professional CAD Ribbon-style Toolbar
 */
import React, { useState } from 'react';
import {
    Box, Circle, Cylinder, // Primitives
    Plus, Minus, // Boolean
    Move, Maximize2, // Modify
    Pencil, LayoutTemplate, // Sketch
    Hammer, RefreshCw, // Features
    Download, Upload, Trash2, Eye,
    MousePointer2, Grid
} from 'lucide-react';

export type ToolType =
    | 'select'
    // Primitives
    | 'box' | 'cylinder' | 'sphere' | 'cone' | 'torus'
    // Boolean
    | 'fuse' | 'cut' | 'common'
    // Modify
    | 'move' | 'rotate' | 'fillet' | 'chamfer'
    // Sketch
    | 'sketch_line' | 'sketch_circle' | 'sketch_rect' | 'create_sketch'
    // Features
    | 'extrude' | 'revolve';

interface Toolbar3DProps {
    activeTool: ToolType;
    onToolChange: (tool: ToolType) => void;
    onImport: () => void;
    onExport: () => void;
    onClear: () => void;
    hasSelection: boolean;
    isSketchMode: boolean;
    onFinishSketch?: () => void;
}

interface ToolButtonProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    disabled?: boolean;
    danger?: boolean;
    onClick: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({
    icon, label, active, disabled, danger, onClick
}) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`
            flex flex-col items-center justify-center p-1.5 rounded-lg transition-all min-w-[50px]
            ${active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : danger
                    ? 'text-red-400 hover:bg-red-900/50'
                    : 'text-gray-300 hover:bg-gray-700'
            }
            ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={label}
    >
        {icon}
        <span className="text-[9px] mt-1 font-medium">{label}</span>
    </button>
);

const Divider: React.FC = () => (
    <div className="w-px h-10 bg-gray-700 mx-1" />
);

const TabButton: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1 text-xs font-semibold rounded-t-lg transition-colors ${active
            ? 'bg-gray-800 text-blue-400 border-t-2 border-blue-500'
            : 'bg-gray-900 text-gray-500 hover:text-gray-300'
            }`}
    >
        {label}
    </button>
);

export const Toolbar3D: React.FC<Toolbar3DProps> = ({
    activeTool,
    onToolChange,
    onImport,
    onExport,
    onClear,
    hasSelection,
    isSketchMode,
    onFinishSketch
}) => {
    const [activeTab, setActiveTab] = useState<'model' | 'sketch' | 'view'>('model');

    // Force Sketch tab if in sketch mode
    const currentTab = isSketchMode ? 'sketch' : activeTab;

    return (
        <div className="flex flex-col bg-gray-900 border-b border-gray-700">
            {/* Tabs */}
            <div className="flex px-2 pt-1 gap-1 bg-gray-950">
                <TabButton label="Modeling" active={currentTab === 'model'} onClick={() => setActiveTab('model')} />
                <TabButton label="Sketch" active={currentTab === 'sketch'} onClick={() => setActiveTab('sketch')} />
                <TabButton label="View" active={currentTab === 'view'} onClick={() => setActiveTab('view')} />
            </div>

            {/* Toolbar Content */}
            <div className="flex items-center px-2 py-2 bg-gray-800 gap-1 overflow-x-auto">

                {/* MODELING TAB */}
                {currentTab === 'model' && (
                    <>
                        {/* Features */}
                        <div className="flex gap-1">
                            <ToolButton icon={<Pencil size={18} />} label="Sketch" onClick={() => onToolChange('create_sketch')} />
                            <ToolButton icon={<Hammer size={18} />} label="Extrude" disabled={!hasSelection} onClick={() => onToolChange('extrude')} />
                            <ToolButton icon={<RefreshCw size={18} />} label="Revolve" disabled={!hasSelection} onClick={() => onToolChange('revolve')} />
                        </div>
                        <Divider />
                        {/* Primitives */}
                        <div className="flex gap-1">
                            <ToolButton icon={<Box size={18} />} label="Box" active={activeTool === 'box'} onClick={() => onToolChange('box')} />
                            <ToolButton icon={<Cylinder size={18} />} label="Cyl" active={activeTool === 'cylinder'} onClick={() => onToolChange('cylinder')} />
                            <ToolButton icon={<Circle size={18} />} label="Sph" active={activeTool === 'sphere'} onClick={() => onToolChange('sphere')} />
                        </div>
                        <Divider />
                        {/* Boolean */}
                        <div className="flex gap-1">
                            <ToolButton icon={<Plus size={18} />} label="Fuse" active={activeTool === 'fuse'} disabled={!hasSelection} onClick={() => onToolChange('fuse')} />
                            <ToolButton icon={<Minus size={18} />} label="Cut" active={activeTool === 'cut'} disabled={!hasSelection} onClick={() => onToolChange('cut')} />
                        </div>
                        <Divider />
                        {/* Modify */}
                        <div className="flex gap-1">
                            <ToolButton icon={<Maximize2 size={18} />} label="Fillet" active={activeTool === 'fillet'} disabled={!hasSelection} onClick={() => onToolChange('fillet')} />
                            <ToolButton icon={<Move size={18} />} label="Move" active={activeTool === 'move'} disabled={!hasSelection} onClick={() => onToolChange('move')} />
                        </div>
                    </>
                )}

                {/* SKETCH TAB */}
                {currentTab === 'sketch' && (
                    <>
                        <div className="flex gap-1">
                            <ToolButton icon={<MousePointer2 size={18} />} label="Select" active={activeTool === 'select'} onClick={() => onToolChange('select')} />
                            <Divider />
                            <ToolButton icon={<Pencil size={18} />} label="Line" active={activeTool === 'sketch_line'} onClick={() => onToolChange('sketch_line')} />
                            <ToolButton icon={<Circle size={18} />} label="Circle" active={activeTool === 'sketch_circle'} onClick={() => onToolChange('sketch_circle')} />
                            <ToolButton icon={<LayoutTemplate size={18} />} label="Rect" active={activeTool === 'sketch_rect'} onClick={() => onToolChange('sketch_rect')} />
                        </div>

                        <div className="flex-1" />

                        {isSketchMode && (
                            <button
                                onClick={onFinishSketch}
                                className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded flex items-center gap-2 text-xs font-bold shadow-lg"
                            >
                                <Pencil size={14} /> Finish Sketch
                            </button>
                        )}
                    </>
                )}

                {/* VIEW TAB */}
                {currentTab === 'view' && (
                    <div className="flex gap-1">
                        <ToolButton icon={<Grid size={18} />} label="Grid" onClick={() => { }} />
                        <ToolButton icon={<Eye size={18} />} label="Wireframe" onClick={() => { }} />
                    </div>
                )}

                <div className="flex-1" />

                {/* Common Tools */}
                <Divider />
                <div className="flex gap-1">
                    <ToolButton icon={<Upload size={18} />} label="Import" onClick={onImport} />
                    <ToolButton icon={<Download size={18} />} label="Export" disabled={!hasSelection} onClick={onExport} />
                    <ToolButton icon={<Trash2 size={18} />} label="Clear" danger onClick={onClear} />
                </div>
            </div>
        </div>
    );
};

export default Toolbar3D;
