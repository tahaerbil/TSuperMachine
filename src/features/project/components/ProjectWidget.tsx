/**
 * Project Widget
 * 
 * UI-only component for project management.
 * All business logic is handled by projectStore.
 */

import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useStore } from '../../../store/store';
import { useProjectStore, hasFileSystemAccess } from '../../../store/projectStore';
import { useTranslation } from 'react-i18next';
import {
    Save,
    FolderOpen,
    FilePlus,
    Trash2,
    RefreshCw,
    Folder,
    HardDrive,
    Package
} from 'lucide-react';
import { ProjectFileTree, type FileNode } from './ProjectFileTree';

// =============================================================================
// Helpers
// =============================================================================

const formatSize = (bytes: number): string => {
    if (bytes === 0) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

// =============================================================================
// Component
// =============================================================================

export const ProjectWidget: React.FC = () => {
    // App Store (widgets, project name)
    const { widgets, projectName, setProjectName, clearAllWidgets } = useStore();

    // Project Store (save/load actions, status)
    const {
        save,
        exportAsZip,
        load,
        createNew,
        status,
        currentFilePath,
        refreshRecent
    } = useProjectStore();

    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [projectFiles, setProjectFiles] = useState<FileNode[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);

    const hasFSAPI = hasFileSystemAccess();
    const isSaving = status === 'saving';
    const isLoading = status === 'loading';

    // =========================================================================
    // Load project files from disk
    // =========================================================================

    const loadProjectFiles = useCallback(async () => {
        if (!currentFilePath || !window.electronAPI) {
            setProjectFiles([]);
            return;
        }

        setIsLoadingFiles(true);
        try {
            const result = await window.electronAPI.listDirectory(currentFilePath);
            if (result.success && result.items) {
                const children: FileNode[] = [];

                for (const item of result.items) {
                    if (item.isDirectory) {
                        const subResult = await window.electronAPI.listDirectory(item.path);
                        const subChildren: FileNode[] = [];

                        if (subResult.success && subResult.items) {
                            for (const subItem of subResult.items) {
                                if (!subItem.isDirectory) {
                                    subChildren.push({
                                        id: `file-${subItem.path}`,
                                        name: subItem.name,
                                        type: 'file',
                                        meta: formatSize(subItem.size),
                                        extension: subItem.name.split('.').pop()
                                    });
                                }
                            }
                        }

                        children.push({
                            id: `folder-${item.name}`,
                            name: item.name,
                            type: 'folder',
                            isOpen: subChildren.length > 0,
                            children: subChildren
                        });
                    } else {
                        children.push({
                            id: `file-${item.path}`,
                            name: item.name,
                            type: 'file',
                            meta: formatSize(item.size),
                            extension: item.name.split('.').pop()
                        });
                    }
                }

                setProjectFiles(children);
            }
        } catch (error) {
            console.error('Failed to load project files:', error);
        } finally {
            setIsLoadingFiles(false);
        }
    }, [currentFilePath]);

    // Load files when project path changes
    useEffect(() => {
        loadProjectFiles();
    }, [loadProjectFiles]);

    // Listen for file drop events from Canvas
    useEffect(() => {
        const handleFileDropped = () => {
            setTimeout(loadProjectFiles, 500);
        };

        window.addEventListener('project-file-added', handleFileDropped);
        return () => window.removeEventListener('project-file-added', handleFileDropped);
    }, [loadProjectFiles]);

    // =========================================================================
    // File Structure (Real or Virtual)
    // =========================================================================

    const fileStructure = useMemo((): FileNode[] => {
        const rootId = 'root';

        // Real project files
        if (projectFiles.length > 0) {
            return [{
                id: rootId,
                name: projectName || 'Untitled Project',
                type: 'folder',
                isOpen: true,
                children: projectFiles
            }];
        }

        // Virtual/default structure for unsaved projects
        return [{
            id: rootId,
            name: projectName || 'Untitled Project',
            type: 'folder',
            isOpen: true,
            children: [
                { id: 'folder-parts', name: 'parts', type: 'folder', isOpen: false, children: [] },
                { id: 'folder-assemblies', name: 'assemblies', type: 'folder', isOpen: false, children: [] },
                { id: 'folder-documents', name: 'documents', type: 'folder', isOpen: false, children: [] },
                { id: 'folder-images', name: 'images', type: 'folder', isOpen: false, children: [] },
                { id: 'folder-drawings', name: 'drawings', type: 'folder', isOpen: false, children: [] },
                {
                    id: 'folder-data',
                    name: 'data',
                    type: 'folder',
                    isOpen: false,
                    children: [
                        { id: 'file-canvas', name: 'canvas.json', type: 'file', meta: `${widgets.length} widgets` }
                    ]
                },
                { id: 'file-project', name: 'project.json', type: 'file', meta: 'metadata' }
            ]
        }];
    }, [projectName, widgets.length, projectFiles]);

    // =========================================================================
    // Handlers
    // =========================================================================

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

    const handleRefresh = () => {
        refreshRecent();
        loadProjectFiles();
    };

    // =========================================================================
    // Render
    // =========================================================================

    return (
        <div
            className="w-full h-full flex flex-col bg-[#1e1e1e] text-gray-200"
            onDragOver={(e) => e.stopPropagation()}
            onDrop={(e) => e.stopPropagation()}
        >
            {/* 1. Top Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-[#333]">
                {/* File Operations */}
                <div className="flex gap-0.5">
                    <button
                        onClick={createNew}
                        disabled={isLoading}
                        title="New Project"
                        className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <FilePlus size={18} />
                    </button>
                    <button
                        onClick={() => save()}
                        disabled={isSaving || isLoading}
                        title="Save Project (Folder)"
                        className={`p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50 ${isSaving ? 'animate-pulse text-blue-500' : ''}`}
                    >
                        <Save size={18} />
                    </button>
                    <button
                        onClick={exportAsZip}
                        disabled={isSaving || isLoading}
                        title="Export as .tsm (ZIP archive)"
                        className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-purple-400 transition-colors disabled:opacity-50"
                    >
                        <Package size={18} />
                    </button>
                </div>

                <div className="w-px h-4 bg-[#444] mx-1"></div>

                <div className="flex gap-0.5">
                    <button
                        onClick={() => load()}
                        disabled={isLoading}
                        title="Open Project"
                        className={`p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-green-400 transition-colors disabled:opacity-50 ${isLoading ? 'animate-pulse' : ''}`}
                    >
                        <FolderOpen size={18} />
                    </button>
                    {hasFSAPI && (
                        <button
                            onClick={() => load(undefined, true)}
                            disabled={isLoading}
                            title="Open Project Folder"
                            className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-teal-400 transition-colors disabled:opacity-50"
                        >
                            <Folder size={18} />
                        </button>
                    )}
                </div>

                <div className="flex-1"></div>

                <button
                    onClick={handleRefresh}
                    title="Refresh Files"
                    className={`p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors ${isLoadingFiles ? 'animate-spin' : ''}`}
                >
                    <RefreshCw size={14} />
                </button>
            </div>

            {/* 2. Project Name Input */}
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
            <div className="flex-1 overflow-hidden bg-[#1e1e1e] relative">
                {isLoadingFiles && (
                    <div className="absolute inset-0 bg-[#1e1e1e]/50 flex items-center justify-center z-10">
                        <RefreshCw size={20} className="animate-spin text-blue-400" />
                    </div>
                )}
                <ProjectFileTree structure={fileStructure} />
            </div>

            {/* 4. Bottom Actions */}
            <div className="p-2 border-t border-[#333] bg-[#252526]">
                <button
                    onClick={handleClearAll}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded border border-red-900/30 text-red-500/70 hover:bg-red-900/20 hover:text-red-400 transition-all text-xs"
                >
                    <Trash2 size={12} />
                    <span>Clear Workspace</span>
                </button>
            </div>

            {/* Hidden Input for fallback */}
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
