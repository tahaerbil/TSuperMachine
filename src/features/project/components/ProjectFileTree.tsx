import React, { useState, useEffect } from 'react';
import {
    ChevronRight,
    ChevronDown,
    Folder,
    FileJson,
    FileCode,
    File,
} from 'lucide-react';

export interface FileNode {
    id: string;
    name: string;
    type: 'folder' | 'file';
    isOpen?: boolean;
    children?: FileNode[];
    meta?: string; // size or details
    extension?: string;
}

interface FileTreeItemProps {
    node: FileNode;
    depth?: number;
    onToggle: (id: string) => void;
    onSelect: (node: FileNode) => void;
    selectedId?: string;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
    node,
    depth = 0,
    onToggle,
    onSelect,
    selectedId
}) => {
    const isSelected = selectedId === node.id;

    const getIcon = () => {
        if (node.type === 'folder') {
            return node.isOpen ? <Folder size={16} className="text-yellow-500" /> : <Folder size={16} className="text-yellow-500 opacity-80" />;
        }
        if (node.name.endsWith('.json')) return <FileJson size={16} className="text-blue-400" />;
        if (node.name.endsWith('.dxf')) return <FileCode size={16} className="text-orange-400" />;
        return <File size={16} className="text-gray-400" />;
    };

    return (
        <div>
            <div
                className={`
                    flex items-center gap-1.5 py-1.5 px-2 cursor-pointer transition-all duration-200 group
                    ${isSelected ? 'bg-blue-500/20 text-blue-200' : 'hover:bg-white/5 text-gray-300'}
                `}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                onClick={() => {
                    if (node.type === 'folder') onToggle(node.id);
                    onSelect(node);
                }}
                draggable={node.type === 'file'} // Only files are draggable for now
                onDragStart={(e) => {
                    e.dataTransfer.setData('application/tsm-project-file', JSON.stringify({
                        id: node.id,
                        name: node.name,
                        type: node.type
                    }));
                    e.dataTransfer.effectAllowed = 'copy';
                }}
            >
                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    {node.type === 'folder' && (
                        node.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                    )}
                </div>

                {getIcon()}

                <span className="text-sm truncate select-none flex-1 font-medium">{node.name}</span>

                {node.meta && (
                    <span className="text-[10px] text-gray-500 font-mono hidden group-hover:block opacity-60">{node.meta}</span>
                )}
            </div>

            {node.isOpen && node.children && (
                <div>
                    {node.children.map(child => (
                        <FileTreeItem
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            onToggle={onToggle}
                            onSelect={onSelect}
                            selectedId={selectedId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const ProjectFileTree: React.FC<{
    structure: FileNode[];
}> = ({ structure }) => {
    const [data, setData] = useState<FileNode[]>(structure);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Sync external props updates to internal state if they change drastically
    useEffect(() => {
        // Only update if we have a completely new structure reference
        // Ideally we merge state, but for now simple sync
        setData(structure);
    }, [structure]);

    const toggleNode = (nodes: FileNode[], id: string): FileNode[] => {
        return nodes.map(node => {
            if (node.id === id) {
                return { ...node, isOpen: !node.isOpen };
            }
            if (node.children) {
                return { ...node, children: toggleNode(node.children, id) };
            }
            return node;
        });
    };

    const handleToggle = (id: string) => {
        console.log("Toggling", id);
        setData(prev => toggleNode(prev, id));
    };

    return (
        <div className="w-full h-full overflow-y-auto select-none custom-scrollbar">
            {data.map(node => (
                <FileTreeItem
                    key={node.id}
                    node={node}
                    onToggle={handleToggle}
                    onSelect={(n) => setSelectedId(n.id)}
                    selectedId={selectedId || ''}
                />
            ))}
        </div>
    );
};
