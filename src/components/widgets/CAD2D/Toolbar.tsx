import React from 'react';
import { MousePointer2, Minus, Square, Circle as CircleIcon, Type, Grid as GridIcon, Magnet, Plus, FileUp, Upload, Trash2, Download } from 'lucide-react';
import type { Tool } from './types';

interface ToolbarProps {
    tool: Tool;
    setTool: (tool: Tool) => void;
    snapToGrid: boolean;
    setSnapToGrid: (snap: boolean) => void;
    snapToObjects: boolean;
    setSnapToObjects: (snap: boolean) => void;
    stageScale: number;
    setStageScale: (scale: React.SetStateAction<number>) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleImportDXF: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleExportDXF: () => void;
    clearAll: () => void;
    exportAsImage: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
    tool, setTool,
    snapToGrid, setSnapToGrid,
    snapToObjects, setSnapToObjects,
    stageScale, setStageScale,
    fileInputRef, handleImportDXF, handleExportDXF,
    clearAll, exportAsImage
}) => {
    return (
        <div className="h-12 border-b border-gray-200 bg-gray-50 flex items-center px-4 gap-2">
            <button
                onClick={() => setTool('select')}
                className={`p-1.5 rounded ${tool === 'select' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-600'}`}
                title="Select Tool"
            >
                <MousePointer2 size={16} />
            </button>
            <div className="h-6 w-px bg-gray-300 mx-1" />
            <button
                onClick={() => setTool('line')}
                className={`p-1.5 rounded ${tool === 'line' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-600'}`}
                title="Line Tool"
            >
                <Minus size={16} className="rotate-45" />
            </button>
            <button
                onClick={() => setTool('rectangle')}
                className={`p-1.5 rounded ${tool === 'rectangle' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-600'}`}
                title="Rectangle Tool"
            >
                <Square size={16} />
            </button>
            <button
                onClick={() => setTool('circle')}
                className={`p-1.5 rounded ${tool === 'circle' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-600'}`}
                title="Circle Tool"
            >
                <CircleIcon size={16} />
            </button>
            <button
                onClick={() => setTool('text')}
                className={`p-1.5 rounded ${tool === 'text' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-600'}`}
                title="Text Tool"
            >
                <Type size={16} />
            </button>

            <div className="h-6 w-px bg-gray-300 mx-1" />

            <button
                onClick={() => setSnapToGrid(!snapToGrid)}
                className={`p-1.5 rounded ${snapToGrid ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-600'}`}
                title="Snap to Grid"
            >
                <GridIcon size={16} />
            </button>
            <button
                onClick={() => setSnapToObjects(!snapToObjects)}
                className={`p-1.5 rounded ${snapToObjects ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-600'}`}
                title="Object Snap (OSNAP)"
            >
                <Magnet size={16} />
            </button>

            <div className="h-6 w-px bg-gray-300 mx-1" />

            <button
                onClick={() => setStageScale(s => Math.max(0.1, s - 0.1))}
                className="p-2 rounded hover:bg-gray-200 text-gray-600"
                title="Zoom Out"
            >
                <Minus size={16} />
            </button>
            <span className="text-xs w-12 text-center">{Math.round(stageScale * 100)}%</span>
            <button
                onClick={() => setStageScale(s => Math.min(5, s + 0.1))}
                className="p-2 rounded hover:bg-gray-200 text-gray-600"
                title="Zoom In"
            >
                <Plus size={16} />
            </button>

            <div className="flex-1" />

            {/* DXF Import/Export */}
            <input
                type="file"
                accept=".dxf"
                ref={fileInputRef}
                onChange={handleImportDXF}
                className="hidden"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded hover:bg-gray-200 text-gray-600"
                title="Import DXF"
            >
                <FileUp size={16} />
            </button>
            <button
                onClick={handleExportDXF}
                className="p-2 rounded hover:bg-gray-200 text-gray-600"
                title="Export DXF"
            >
                <Upload size={16} className="rotate-180" />
            </button>

            <div className="h-6 w-px bg-gray-300 mx-1" />

            <button
                onClick={clearAll}
                className="p-2 rounded hover:bg-red-100 text-red-600"
                title="Clear All"
            >
                <Trash2 size={16} />
            </button>
            <button
                onClick={exportAsImage}
                className="p-2 rounded hover:bg-gray-200 text-gray-600"
                title="Export Image"
            >
                <Download size={16} />
            </button>
        </div>
    );
};
