import React, { useRef, useMemo } from 'react';
import { useStore } from '../../../store/store';
import { useTranslation } from 'react-i18next';
import { useProjectSystem } from '../hooks/useProjectSystem';
import { hasFileSystemAccess } from '../../../core/services/project/projectManager';
import {
    Save,
    FolderPlus,
    FolderOpen,
    FilePlus,
    Trash2,
    RefreshCw,
    Folder,
    HardDrive
} from 'lucide-react';
import { ProjectFileTree, type FileNode } from './ProjectFileTree';

export const ProjectWidget: React.FC = () => {
    const { widgets, projectName, setProjectName, clearAllWidgets } = useStore();
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        save,
        load,
        createNew,
        isSaving,
        currentFilePath,
        refreshRecent
    } = useProjectSystem();

    const hasFSAPI = hasFileSystemAccess();

    // Generate Virtual File System based on State
    const fileStructure = useMemo((): FileNode[] => {
        const rootId = 'root';
        const projectNode: FileNode = {
            id: rootId,
            name: projectName || 'Untitled Project',
            type: 'folder',
            isOpen: true,
            children: [
                {
                    id: 'folder-parts',
                    name: 'parts',
                    type: 'folder',
                    isOpen: true,
                    children: []
                },
                {
                    id: 'folder-assemblies',
                    name: 'assemblies',
                    type: 'folder',
                    isOpen: false,
                    children: []
                },
                {
                    id: 'folder-drawings',
                    name: 'drawings',
                    type: 'folder',
                    isOpen: false,
                    children: [
                        { id: 'sample-dxf-1', name: 'bracket_v2.dxf', type: 'file', meta: '24KB' },
                        { id: 'sample-pdf-1', name: 'manual.pdf', type: 'file', meta: '1.2MB' },
                    ]
                },
                {
                    id: 'file-project',
                    name: 'project.json',
                    type: 'file',
                    meta: 'metadata'
                },
                {
                    id: 'file-canvas',
                    name: 'canvas.json',
                    type: 'file',
                    meta: `${widgets.length} widgets`
                }
            ]
        };

        // If specific widgets imply specialized files, we can add them here recursively
        // For now, simple standard structure.

        return [projectNode];
    }, [projectName, widgets.length]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) load(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleClearAll = () => {
        if (window.confirm(t('app.project.confirmClear') || 'Are you sure?')) {
            clearAllWidgets();
        }
    };

    return (
        <div
            className="w-full h-full flex flex-col bg-[#1e1e1e] text-gray-200"
            onDragOver={(e) => e.stopPropagation()}
            onDrop={(e) => e.stopPropagation()}
        >
            {/* 1. Top Toolbar (Actions) */}
            <div className="flex items-center gap-1 p-2 border-b border-[#333]">
                {/* File Operations Group */}
                <div className="flex gap-0.5">
                    <button
                        onClick={createNew}
                        title="New Project"
                        className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors"
                    >
                        <FilePlus size={18} />
                    </button>
                    <button
                        onClick={() => save({ forceSaveAs: false })}
                        title="Save Project"
                        className={`p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-blue-400 transition-colors ${isSaving ? 'animate-pulse text-blue-500' : ''}`}
                    >
                        <Save size={18} />
                    </button>
                    {hasFSAPI && (
                        <button
                            onClick={() => save({ forceSaveAs: true, asFolder: true })}
                            title="Save as Folder"
                            className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-purple-400 transition-colors"
                        >
                            <FolderPlus size={18} />
                        </button>
                    )}
                </div>

                <div className="w-px h-4 bg-[#444] mx-1"></div>

                <div className="flex gap-0.5">
                    <button
                        onClick={() => hasFSAPI ? load() : fileInputRef.current?.click()}
                        title="Open Project File (.tsm)"
                        className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-green-400 transition-colors"
                    >
                        <FolderOpen size={18} />
                    </button>
                    {hasFSAPI && (
                        <button
                            onClick={() => load(undefined, true)}
                            title="Open Project Folder"
                            className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-teal-400 transition-colors"
                        >
                            <Folder size={18} />
                        </button>
                    )}
                </div>

                <div className="flex-1"></div>

                <button
                    onClick={refreshRecent}
                    title="Refresh"
                    className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors"
                >
                    <RefreshCw size={14} />
                </button>
            </div>

            {/* 2. Project Name Input Area */}
            <div className="px-3 py-2 bg-[#252526] border-b border-[#333]">
                <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-sm font-semibold text-white placeholder-gray-500 focus:ring-0"
                    placeholder="Project Name..."
                />
                <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                    <HardDrive size={10} />
                    {currentFilePath || 'Not saved yet'}
                </div>
            </div>

            {/* 3. Main Tree View */}
            <div className="flex-1 overflow-hidden bg-[#1e1e1e]">
                <ProjectFileTree structure={fileStructure} />
            </div>

            {/* 4. Bottom Actions (Danger Zone) */}
            <div className="p-2 border-t border-[#333] bg-[#252526]">
                <button
                    onClick={handleClearAll}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded border border-red-900/30 text-red-500/70 hover:bg-red-900/20 hover:text-red-400 transition-all text-xs"
                >
                    <Trash2 size={12} />
                    <span>Clear Workspace</span>
                </button>
            </div>

            {/* Hidden Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".tsm"
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
    );
};
