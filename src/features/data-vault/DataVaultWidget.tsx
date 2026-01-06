import React, { useState, useEffect, useCallback } from 'react';
import {
    Folder,
    FileText,
    Image,
    File,
    ArrowLeft,
    Home,
    RefreshCw,
    ChevronRight,
    Upload,
    Filter
} from 'lucide-react';

interface FileItem {
    name: string;
    isDirectory: boolean;
    path: string;
    size: number;
}

interface DataVaultWidgetProps {
    id: string;
}

// File type icon mapping
const getFileIcon = (name: string, isDirectory: boolean) => {
    if (isDirectory) return <Folder className="w-5 h-5 text-yellow-400" />;

    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'pdf':
            return <FileText className="w-5 h-5 text-red-400" />;
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'svg':
        case 'webp':
            return <Image className="w-5 h-5 text-purple-400" />;
        case 'dxf':
        case 'dwg':
            return <FileText className="w-5 h-5 text-blue-400" />;
        case 'json':
        case 'tsm':
            return <FileText className="w-5 h-5 text-green-400" />;
        default:
            return <File className="w-5 h-5 text-gray-400" />;
    }
};

// Format file size
const formatSize = (bytes: number): string => {
    if (bytes === 0) return '—';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const DataVaultWidget: React.FC<DataVaultWidgetProps> = () => {
    const [items, setItems] = useState<FileItem[]>([]);
    const [currentPath, setCurrentPath] = useState<string>('');
    const [rootPath, setRootPath] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [filter, setFilter] = useState<string | null>(null);

    // Initialize with workspace path from config
    useEffect(() => {
        const initPath = async () => {
            try {
                const config = await window.electronAPI?.loadConfig();
                const workspacePath = config?.workspacePath || '';
                setRootPath(workspacePath);
                setCurrentPath(workspacePath);
            } catch (err) {
                console.error('Failed to load config:', err);
            }
        };
        initPath();
    }, []);

    // Load directory contents
    const loadDirectory = useCallback(async (dirPath: string) => {
        if (!dirPath || !window.electronAPI?.listDirectory) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await window.electronAPI.listDirectory(dirPath);
            if (result.success) {
                let filteredItems = result.items || [];

                // Apply filter if set
                if (filter) {
                    filteredItems = filteredItems.filter((item: FileItem) => {
                        if (item.isDirectory) return true;
                        const ext = item.name.split('.').pop()?.toLowerCase();
                        switch (filter) {
                            case 'pdf':
                                return ext === 'pdf';
                            case 'image':
                                return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '');
                            case 'cad':
                                return ['dxf', 'dwg'].includes(ext || '');
                            default:
                                return true;
                        }
                    });
                }

                setItems(filteredItems);
            } else {
                setError(result.error || 'Failed to load directory');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    // Reload when path changes
    useEffect(() => {
        if (currentPath) {
            loadDirectory(currentPath);
        }
    }, [currentPath, loadDirectory]);

    // Navigate to folder
    const handleItemClick = (item: FileItem) => {
        if (item.isDirectory) {
            setCurrentPath(item.path);
        } else {
            // TODO: Open file in appropriate widget
            console.log('Open file:', item.path);
        }
    };

    // Go back one level
    const handleGoBack = () => {
        if (currentPath === rootPath) return;
        const parentPath = currentPath.split('/').slice(0, -1).join('/');
        setCurrentPath(parentPath || rootPath);
    };

    // Go to root
    const handleGoHome = () => {
        setCurrentPath(rootPath);
    };

    // Get breadcrumb parts
    const getBreadcrumbs = () => {
        if (!currentPath || !rootPath) return [];
        const relativePath = currentPath.replace(rootPath, '');
        if (!relativePath) return ['T-Workspace'];
        return ['T-Workspace', ...relativePath.split('/').filter(Boolean)];
    };

    // Handle drag over
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    // Handle file drop
    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        for (const file of files) {
            const sourcePath = (file as unknown as { path: string }).path;
            if (!sourcePath) continue;

            const targetPath = `${currentPath}/${file.name}`;

            try {
                await window.electronAPI?.copyFile({ sourcePath, targetPath });
            } catch (err) {
                console.error('Failed to copy file:', err);
            }
        }

        // Refresh directory
        loadDirectory(currentPath);
    };

    // Filter options
    const filterOptions = [
        { key: null, label: 'All' },
        { key: 'pdf', label: 'PDF' },
        { key: 'image', label: 'Images' },
        { key: 'cad', label: 'CAD' },
    ];

    return (
        <div
            className="flex flex-col h-full bg-gray-900/95 text-white select-none"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-gray-700/50 bg-gray-800/50">
                <button
                    onClick={handleGoBack}
                    disabled={currentPath === rootPath}
                    className="p-1.5 rounded hover:bg-gray-700/50 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Go Back"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                    onClick={handleGoHome}
                    className="p-1.5 rounded hover:bg-gray-700/50"
                    title="Go to Root"
                >
                    <Home className="w-4 h-4" />
                </button>
                <button
                    onClick={() => loadDirectory(currentPath)}
                    className="p-1.5 rounded hover:bg-gray-700/50"
                    title="Refresh"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>

                {/* Breadcrumb */}
                <div className="flex-1 flex items-center gap-1 mx-2 text-xs text-gray-400 overflow-hidden">
                    {getBreadcrumbs().map((part, i, arr) => (
                        <React.Fragment key={i}>
                            <span className={i === arr.length - 1 ? 'text-white truncate' : 'truncate'}>
                                {part}
                            </span>
                            {i < arr.length - 1 && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
                        </React.Fragment>
                    ))}
                </div>

                {/* Filter Dropdown */}
                <div className="relative group">
                    <button
                        className={`p-1.5 rounded hover:bg-gray-700/50 ${filter ? 'text-cyan-400' : ''}`}
                        title="Filter"
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        {filterOptions.map(opt => (
                            <button
                                key={opt.key || 'all'}
                                onClick={() => setFilter(opt.key)}
                                className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-gray-700 ${filter === opt.key ? 'text-cyan-400' : 'text-gray-300'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* File List */}
            <div
                className={`flex-1 overflow-auto p-2 ${isDragOver ? 'bg-cyan-500/10 ring-2 ring-cyan-500/50 ring-inset' : ''}`}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <RefreshCw className="w-6 h-6 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full text-red-400 text-sm">
                        <span>{error}</span>
                        <button
                            onClick={() => loadDirectory(currentPath)}
                            className="mt-2 text-xs underline"
                        >
                            Retry
                        </button>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
                        <Upload className="w-8 h-8 mb-2 opacity-50" />
                        <span>Empty folder</span>
                        <span className="text-xs mt-1">Drop files here to add</span>
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {items.map((item) => (
                            <div
                                key={item.path}
                                onDoubleClick={() => handleItemClick(item)}
                                className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-700/50 group"
                                draggable={!item.isDirectory}
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', item.path);
                                    e.dataTransfer.setData('application/x-tsm-file', JSON.stringify(item));
                                }}
                            >
                                {getFileIcon(item.name, item.isDirectory)}
                                <span className="flex-1 truncate text-sm">{item.name}</span>
                                <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100">
                                    {formatSize(item.size)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Drop Overlay */}
            {isDragOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-cyan-500/20 pointer-events-none">
                    <div className="text-cyan-400 text-lg font-medium">
                        Drop to add files
                    </div>
                </div>
            )}
        </div>
    );
};
