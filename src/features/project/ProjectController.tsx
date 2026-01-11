/**
 * Project Controller
 * 
 * Headless component that manages:
 * - Auto-save lifecycle
 * - Keyboard shortcuts (Ctrl+S, Ctrl+Shift+S)
 * - Electron menu integration
 * - Workspace tab synchronization
 */

import { useEffect, useCallback } from 'react';
import { useProjectStore, startAutoSave, stopAutoSave } from '../../store/projectStore';
import { useWorkspaceStore, initDirtyTracking } from '../../store/workspaceStore';
import { fileSystemAdapter } from '../../core/services/filesystem/fileSystemAdapter';

export const ProjectController = () => {
    const { save, createNew, load, refreshPath, autoSaveEnabled } = useProjectStore();
    const {
        activeTabId,
        setTabDirty,
        setTabFilePath,
        updateActiveTabState,
        renameTab
    } = useWorkspaceStore();

    // =========================================================================
    // Sync Tab State After Save
    // =========================================================================

    const handleSave = useCallback(async (options: { forceSaveAs?: boolean } = {}) => {
        const success = await save(options);

        if (success && activeTabId) {
            // Update tab with new file path
            const currentPath = fileSystemAdapter.getCurrentFilePath();
            setTabFilePath(activeTabId, currentPath);
            setTabDirty(activeTabId, false);

            // Update tab name from file path if available
            if (currentPath) {
                const projectName = currentPath.split(/[\\/]/).pop();
                if (projectName) {
                    renameTab(activeTabId, projectName);
                }
            }

            // Sync tab state
            updateActiveTabState();
        }

        return success;
    }, [save, activeTabId, setTabFilePath, setTabDirty, renameTab, updateActiveTabState]);

    // =========================================================================
    // Sync Tab State After Load
    // =========================================================================

    const handleLoad = useCallback(async (file?: File, fromFolder?: boolean) => {
        const success = await load(file, fromFolder);

        if (success && activeTabId) {
            // Update tab with loaded file path
            const currentPath = fileSystemAdapter.getCurrentFilePath();
            setTabFilePath(activeTabId, currentPath);
            setTabDirty(activeTabId, false);

            // Update tab name from loaded project
            if (currentPath) {
                const projectName = currentPath.split(/[\\/]/).pop();
                if (projectName) {
                    renameTab(activeTabId, projectName);
                }
            }

            // Sync tab state
            updateActiveTabState();
        }

        return success;
    }, [load, activeTabId, setTabFilePath, setTabDirty, renameTab, updateActiveTabState]);

    // =========================================================================
    // Create New in Current Tab
    // =========================================================================

    const handleCreateNew = useCallback(() => {
        const success = createNew();

        if (success && activeTabId) {
            setTabFilePath(activeTabId, null);
            setTabDirty(activeTabId, false);
            renameTab(activeTabId, 'Untitled');
            updateActiveTabState();
        }

        return success;
    }, [createNew, activeTabId, setTabFilePath, setTabDirty, renameTab, updateActiveTabState]);

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
                    handleSave({ forceSaveAs: true });
                } else {
                    handleSave({ forceSaveAs: false });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

    // =========================================================================
    // Electron Menu Integration
    // =========================================================================

    useEffect(() => {
        if (!window.electronAPI) return;

        const handleMenuAction = (action: string) => {
            console.log('[ProjectController] Menu Action:', action);
            if (action === 'new') handleCreateNew();
            if (action === 'save') handleSave({ forceSaveAs: false });
            if (action === 'save-as') handleSave({ forceSaveAs: true });
            if (action === 'open') handleLoad();
        };

        window.electronAPI.onMenuAction(handleMenuAction);

        return () => {
            window.electronAPI?.removeListeners?.();
        };
    }, [handleCreateNew, handleSave, handleLoad]);

    // =========================================================================
    // Dirty Tracking Initialization
    // =========================================================================

    useEffect(() => {
        const unsubscribe = initDirtyTracking();
        return () => unsubscribe();
    }, []);

    return null; // Headless component
};

