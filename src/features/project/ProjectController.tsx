/**
 * Project Controller
 * 
 * Headless component that manages:
 * - Auto-save lifecycle
 * - Keyboard shortcuts (Ctrl+S, Ctrl+Shift+S)
 * - Electron menu integration
 */

import { useEffect } from 'react';
import { useProjectStore, startAutoSave, stopAutoSave } from '../../store/projectStore';

export const ProjectController = () => {
    const { save, createNew, load, refreshPath, autoSaveEnabled } = useProjectStore();

    // =========================================================================
    // Auto-Save Lifecycle
    // =========================================================================

    useEffect(() => {
        if (autoSaveEnabled) {
            startAutoSave();
        }
        return () => stopAutoSave();
    }, [autoSaveEnabled]);

    // =========================================================================
    // Initial Path Sync
    // =========================================================================

    useEffect(() => {
        refreshPath();
    }, [refreshPath]);

    // =========================================================================
    // Keyboard Shortcuts
    // =========================================================================

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                if (e.shiftKey) {
                    save({ forceSaveAs: true });
                } else {
                    save({ forceSaveAs: false });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [save]);

    // =========================================================================
    // Electron Menu Integration
    // =========================================================================

    useEffect(() => {
        if (!window.electronAPI) return;

        const handleMenuAction = (action: string) => {
            console.log('[ProjectController] Menu Action:', action);
            if (action === 'new') createNew();
            if (action === 'save') save({ forceSaveAs: false });
            if (action === 'save-as') save({ forceSaveAs: true });
            if (action === 'open') load();
        };

        window.electronAPI.onMenuAction(handleMenuAction);

        return () => {
            window.electronAPI?.removeListeners?.();
        };
    }, [createNew, save, load]);

    return null; // Headless component
};
