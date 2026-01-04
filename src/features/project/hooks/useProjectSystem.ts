import { useCallback, useState } from 'react';
import { useStore } from '../../../store/store';
import { useThemeStore } from '../../../store/themeStore';
import { useTranslation } from 'react-i18next';
import {
    saveProject,
    loadProject,
    validateProjectFile,
    getRecentProjects,
    addToRecentProjects,
    getCurrentFilePath,
    clearCurrentFile,
    type CanvasState
} from '../../../core/services/project/projectManager';

export interface ProjectSystemState {
    isSaving: boolean;
    isLoading: boolean;
    currentFilePath: string | null;
    recentProjects: ReturnType<typeof getRecentProjects>;
    lastError: string | null;
}

export const useProjectSystem = () => {
    const store = useStore();
    const { mode, customTheme } = useThemeStore();
    const { i18n } = useTranslation();

    const [state, setState] = useState<ProjectSystemState>({
        isSaving: false,
        isLoading: false,
        currentFilePath: getCurrentFilePath(),
        recentProjects: getRecentProjects(),
        lastError: null
    });

    const refreshRecent = useCallback(() => {
        setState(prev => ({ ...prev, recentProjects: getRecentProjects() }));
    }, []);

    const refreshPath = useCallback(() => {
        setState(prev => ({ ...prev, currentFilePath: getCurrentFilePath() }));
    }, []);

    const getCanvasState = useCallback((): CanvasState => {
        const { widgets, canvas } = useStore.getState();
        return {
            canvas,
            widgets,
            theme: { mode, customTheme },
            language: i18n.language
        };
    }, [i18n.language, mode, customTheme]);

    const save = useCallback(async (options: { forceSaveAs?: boolean; asFolder?: boolean } = {}) => {
        setState(prev => ({ ...prev, isSaving: true, lastError: null }));
        try {
            const { forceSaveAs = false, asFolder = false } = options;
            const { projectName, projectMetadata } = useStore.getState();
            const canvasState = getCanvasState();
            const author = projectMetadata?.author || 'User';

            // If we are already working on a folder or file, default to that unless "Save As" is requested
            // But if 'asFolder' is explicitly requested, we force a new save dialog if we are not already in a folder structure. 
            // For simplicity, 'Save As Folder' will always trigger the dialog via saveProjectAs logic in adapter if needed,
            // but our manager 'saveProject' handles this logic based on arguments.

            // Note: saveProject in manager now handles the distinction.
            // If forcing Save As, we pass true for isNewProject
            // If saving as folder, we pass true for last arg.

            await saveProject(projectName, canvasState, author, forceSaveAs, asFolder);

            // Sync metadata
            const metadata = {
                name: projectName,
                version: '1.0.0',
                created: projectMetadata?.created || new Date().toISOString(),
                modified: new Date().toISOString(),
                author
            };
            addToRecentProjects(metadata);
            refreshRecent();
            refreshPath();
            return true;
        } catch (error) {
            if ((error as Error).message !== 'Save cancelled') {
                setState(prev => ({ ...prev, lastError: (error as Error).message }));
                console.error("Save failed:", error);
            }
            return false;
        } finally {
            setState(prev => ({ ...prev, isSaving: false }));
        }
    }, [getCanvasState, refreshRecent, refreshPath]);

    const load = useCallback(async (file?: File, fromFolder: boolean = false) => {
        setState(prev => ({ ...prev, isLoading: true, lastError: null }));
        try {
            if (file && !validateProjectFile(file)) {
                throw new Error('Invalid project file');
            }

            const { metadata, canvasState } = await loadProject(file, fromFolder);

            store.loadProjectState(canvasState.widgets, canvasState.canvas);
            store.setProjectName(metadata.name);
            store.setProjectMetadata({
                created: metadata.created,
                modified: metadata.modified,
                author: metadata.author,
            });

            if (canvasState.language) {
                i18n.changeLanguage(canvasState.language);
            }

            addToRecentProjects(metadata);
            refreshRecent();
            refreshPath();
            return true;
        } catch (error) {
            if ((error as Error).message !== 'Open cancelled') {
                setState(prev => ({ ...prev, lastError: (error as Error).message }));
            }
            return false;
        } finally {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, [i18n, store, refreshRecent, refreshPath]);

    const createNew = useCallback(() => {
        if (store.widgets.length > 0) {
            if (!window.confirm('Are you sure? All unsaved changes will be lost.')) {
                return false;
            }
        }

        store.clearAllWidgets();
        store.setProjectName('Untitled Project');
        store.setProjectMetadata({
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            author: 'User'
        });
        clearCurrentFile();
        refreshPath();
        return true;
    }, [store, refreshPath]);

    return {
        ...state,
        save,
        load,
        createNew,
        refreshRecent,
        refreshPath
    };
};
