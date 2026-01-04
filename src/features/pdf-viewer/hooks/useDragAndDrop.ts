import { useState, useCallback } from 'react';
import type { UseDragAndDropReturn } from '../types';

/**
 * Hook for handling drag and drop file uploads
 */
export function useDragAndDrop(onFileLoad: (file: File) => void): UseDragAndDropReturn {
    const [isDragOver, setIsDragOver] = useState<boolean>(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const file = e.dataTransfer.files[0];
        if (file) onFileLoad(file);
    }, [onFileLoad]);

    return {
        isDragOver,
        handleDragOver,
        handleDragLeave,
        handleDrop,
    };
}
