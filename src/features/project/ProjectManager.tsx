import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '../../store/store';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from 'react-i18next';
import { saveProject, saveProjectAs, loadProject, type CanvasState, getCurrentFilePath } from '../../core/services/project/projectManager';


export const ProjectManager = () => {
    const store = useStore();
    const { mode, customTheme } = useThemeStore();
    const { i18n } = useTranslation();
    const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
    const isProcessing = useRef(false);

    // Sync path with core service on mount/updates
    useEffect(() => {
        const path = getCurrentFilePath();
        if (path !== currentFilePath) {
            setCurrentFilePath(path);
        }
    }, [currentFilePath]); // Re-check when local state changes

    const getCanvasState = useCallback((): CanvasState => {
        const { widgets, canvas } = useStore.getState();
        return {
            canvas,
            widgets,
            theme: { mode, customTheme },
            language: i18n.language
        };
    }, [i18n.language, mode, customTheme]);

    const handleNewProject = useCallback(() => {
        if (confirm('Are you sure you want to create a new project? Unsaved changes will be lost.')) {
            store.clearAllWidgets();
            store.setProjectName('New Project');
            store.setProjectMetadata({
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                author: 'User'
            });
            setCurrentFilePath(null);
            // Core service state clearing handled internally if needed, or we explicitly clear:
            // clearCurrentFile(); // Import if needed
        }
    }, [store]);

    const saveProjectInternal = useCallback(async (saveAs: boolean) => {
        if (isProcessing.current) return;
        isProcessing.current = true;

        try {
            const { projectName, projectMetadata } = useStore.getState();
            const canvasState = getCanvasState();
            const author = projectMetadata?.author || 'User';

            if (saveAs) {
                await saveProjectAs(projectName, canvasState, author);
            } else {
                await saveProject(projectName, canvasState, author);
            }

            const newPath = getCurrentFilePath();
            if (newPath) {
                setCurrentFilePath(newPath);
                store.setProjectName(newPath.split(/[\\/]/).pop()?.replace('.tsm', '') || projectName);
                console.log('Project saved to:', newPath);
            }
        } catch (e: unknown) {
            if (e instanceof Error && e.message !== 'Save cancelled') {
                console.error('Save failed:', e);
                alert('Failed to save project: ' + e.message);
            }
        } finally {
            isProcessing.current = false;
        }
    }, [getCanvasState, store]);

    // Handle Open Project
    const handleOpenProject = useCallback(async () => {
        if (isProcessing.current) return;
        isProcessing.current = true;

        try {
            // loadProject triggers the dialog via adapter
            const { metadata, canvasState } = await loadProject();

            // Apply state
            store.loadProjectState(canvasState.widgets, canvasState.canvas);
            store.setProjectName(metadata.name);
            store.setProjectMetadata({
                created: metadata.created,
                modified: metadata.modified,
                author: metadata.author
            });


            // Theme restoration (optional, user might prefer their own settings)
            // if (canvasState.theme) { ... }

            const newPath = getCurrentFilePath();
            setCurrentFilePath(newPath);
            console.log('Project loaded:', newPath);

        } catch (e: unknown) {
            if (e instanceof Error && e.message !== 'Open cancelled') {
                console.error('Open failed:', e);
                alert('Failed to load project: ' + e.message);
            }
        } finally {
            isProcessing.current = false;
        }
    }, [store]);

    useEffect(() => {
        if (!window.electronAPI) return;

        const handleMenuAction = (action: string) => {
            console.log('Menu Action:', action);
            if (action === 'new') handleNewProject();
            if (action === 'save') saveProjectInternal(false);
            if (action === 'save-as') saveProjectInternal(true);
            if (action === 'open') handleOpenProject(); // Add 'open' action to menu handler in Main?
            // Actually main process handles 'open' via dialog, but we changed logic.
            // Main process 'open' menu should send 'menu-action: open' instead of doing it itself.
        };

        // Note: We removed 'onLoadProjectData' listener because we pull data via loadProject() now.
        // But we need to tell Main process to send 'open' action when Open menu is clicked.

        window.electronAPI.onMenuAction(handleMenuAction);

        return () => {
            window.electronAPI?.removeListeners();
        };
    }, [handleNewProject, saveProjectInternal, handleOpenProject]);

    return null;
};
