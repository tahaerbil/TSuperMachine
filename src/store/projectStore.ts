import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { useStore } from './store';
import { useThemeStore } from './themeStore';
import i18n from '../i18n';
import { projectService, type ProjectMetadata, type CanvasState } from '../core/services/project/projectService';
import { fileSystemAdapter } from '../core/services/filesystem/fileSystemAdapter';

// =============================================================================
// Types
// =============================================================================

export interface ProjectState {
    // State
    status: 'idle' | 'saving' | 'loading' | 'error';
    currentFilePath: string | null;
    recentProjects: ProjectMetadata[];
    lastError: string | null;
    isDirty: boolean; // Has unsaved changes

    // Auto-save configuration
    autoSaveEnabled: boolean;
    autoSaveIntervalMs: number;

    // Actions
    save: (options?: { forceSaveAs?: boolean }) => Promise<boolean>;
    exportAsZip: () => Promise<boolean>;
    load: (file?: File, fromFolder?: boolean) => Promise<boolean>;
    createNew: () => boolean;
    setDirty: (dirty: boolean) => void;
    refreshPath: () => void;
    refreshRecent: () => void;
    setAutoSave: (enabled: boolean) => void;
    clearError: () => void;
}

// =============================================================================
// Electron Storage Adapter
// =============================================================================

const createElectronStorage = (): StateStorage => {
    let cachedPath: string | null = null;

    const getStoragePath = async (): Promise<string> => {
        if (cachedPath) return cachedPath;

        const config = await window.electronAPI?.loadConfig();
        const workspacePath = config?.workspacePath || '';
        cachedPath = `${workspacePath}/System/project_settings.json`;
        return cachedPath;
    };

    return {
        getItem: async (name: string): Promise<string | null> => {
            try {
                const filePath = await getStoragePath();
                const result = await window.electronAPI?.readFile(filePath);
                if (result?.success && result.content) {
                    const data = JSON.parse(result.content);
                    return JSON.stringify(data[name] || null);
                }
                return null;
            } catch {
                return null;
            }
        },
        setItem: async (name: string, value: string): Promise<void> => {
            try {
                const filePath = await getStoragePath();

                let existingData: Record<string, unknown> = {};
                try {
                    const result = await window.electronAPI?.readFile(filePath);
                    if (result?.success && result.content) {
                        existingData = JSON.parse(result.content);
                    }
                } catch {
                    // File doesn't exist yet
                }

                existingData[name] = JSON.parse(value);
                await window.electronAPI?.writeFile({
                    filePath,
                    content: JSON.stringify(existingData, null, 2)
                });
            } catch (error) {
                console.error('Failed to save project settings:', error);
            }
        },
        removeItem: async (name: string): Promise<void> => {
            try {
                const filePath = await getStoragePath();
                const result = await window.electronAPI?.readFile(filePath);
                if (result?.success && result.content) {
                    const data = JSON.parse(result.content);
                    delete data[name];
                    await window.electronAPI?.writeFile({
                        filePath,
                        content: JSON.stringify(data, null, 2)
                    });
                }
            } catch {
                // Ignore
            }
        }
    };
};

// =============================================================================
// Helper: Build CanvasState from current app state
// =============================================================================

const getCanvasState = (): CanvasState => {
    const { widgets, canvas } = useStore.getState();
    const { mode, customTheme } = useThemeStore.getState();
    return {
        canvas,
        widgets,
        theme: { mode, customTheme },
        language: i18n.language
    };
};

// =============================================================================
// Store
// =============================================================================

const storage = window.electronAPI
    ? createElectronStorage()
    : localStorage;

export const useProjectStore = create<ProjectState>()(
    persist(
        (set) => ({
            // Initial State
            status: 'idle',
            currentFilePath: fileSystemAdapter.getCurrentFilePath(),
            recentProjects: projectService.getRecentProjects(),
            lastError: null,
            isDirty: false,
            autoSaveEnabled: true,
            autoSaveIntervalMs: 60000, // 60 seconds

            // =================================================================
            // SAVE (Folder-first approach - default saves as folder)
            // =================================================================
            save: async (options = {}) => {
                const { forceSaveAs = false } = options;

                set({ status: 'saving', lastError: null });

                try {
                    const { projectName, projectMetadata } = useStore.getState();
                    const canvasState = getCanvasState();
                    const author = projectMetadata?.author || 'User';

                    // Always save as folder (default behavior)
                    await projectService.saveProject(
                        projectName,
                        canvasState,
                        author,
                        forceSaveAs,
                        true // asFolder = true (folder-first)
                    );

                    // Update project name from folder path
                    const currentPath = fileSystemAdapter.getCurrentFilePath();
                    if (currentPath) {
                        const newName = currentPath.split(/[\\/]/).pop();
                        if (newName) {
                            const { projectName: oldName, setProjectName } = useStore.getState();
                            if (newName !== oldName) {
                                setProjectName(newName);
                            }
                        }
                    }

                    // Update recent projects
                    const finalName = useStore.getState().projectName;
                    const metadata: ProjectMetadata = {
                        name: finalName,
                        version: '1.0.0',
                        created: projectMetadata?.created || new Date().toISOString(),
                        modified: new Date().toISOString(),
                        author
                    };
                    projectService.addToRecentProjects(metadata);

                    set({
                        status: 'idle',
                        isDirty: false,
                        currentFilePath: fileSystemAdapter.getCurrentFilePath(),
                        recentProjects: projectService.getRecentProjects()
                    });

                    return true;
                } catch (error) {
                    const message = (error as Error).message;
                    if (message !== 'Save cancelled') {
                        set({ status: 'error', lastError: message });
                        console.error('Save failed:', error);
                    } else {
                        set({ status: 'idle' });
                    }
                    return false;
                }
            },

            // =================================================================
            // EXPORT AS ZIP (.tsm archive for distribution)
            // =================================================================
            exportAsZip: async () => {
                set({ status: 'saving', lastError: null });

                try {
                    const { projectName, projectMetadata } = useStore.getState();
                    const canvasState = getCanvasState();
                    const author = projectMetadata?.author || 'User';

                    // Export as ZIP (forceSaveAs = true to show dialog)
                    await projectService.saveProject(
                        projectName,
                        canvasState,
                        author,
                        true,  // forceSaveAs = true (always show dialog)
                        false  // asFolder = false (ZIP mode)
                    );

                    set({ status: 'idle' });
                    return true;
                } catch (error) {
                    const message = (error as Error).message;
                    if (message !== 'Save cancelled') {
                        set({ status: 'error', lastError: message });
                        console.error('Export failed:', error);
                    } else {
                        set({ status: 'idle' });
                    }
                    return false;
                }
            },

            // =================================================================
            // LOAD
            // =================================================================
            load: async (file?: File, fromFolder = false) => {
                set({ status: 'loading', lastError: null });

                try {
                    if (file && !projectService.validateProjectFile(file)) {
                        throw new Error('Invalid project file');
                    }

                    const { metadata, canvasState } = await projectService.loadProject(file, fromFolder);

                    // Apply to main store
                    const appStore = useStore.getState();
                    appStore.loadProjectState(canvasState.widgets, canvasState.canvas);
                    appStore.setProjectName(metadata.name);
                    appStore.setProjectMetadata({
                        created: metadata.created,
                        modified: metadata.modified,
                        author: metadata.author,
                    });

                    // Apply language if present
                    if (canvasState.language) {
                        i18n.changeLanguage(canvasState.language);
                    }

                    // Update recent
                    projectService.addToRecentProjects(metadata);

                    set({
                        status: 'idle',
                        isDirty: false,
                        currentFilePath: fileSystemAdapter.getCurrentFilePath(),
                        recentProjects: projectService.getRecentProjects()
                    });

                    return true;
                } catch (error) {
                    const message = (error as Error).message;
                    if (message !== 'Open cancelled') {
                        set({ status: 'error', lastError: message });
                        console.error('Load failed:', error);
                    } else {
                        set({ status: 'idle' });
                    }
                    return false;
                }
            },

            // =================================================================
            // CREATE NEW
            // =================================================================
            createNew: () => {
                const { widgets } = useStore.getState();

                if (widgets.length > 0) {
                    if (!window.confirm('Are you sure? All unsaved changes will be lost.')) {
                        return false;
                    }
                }

                const appStore = useStore.getState();
                appStore.clearAllWidgets();
                appStore.setProjectName('Untitled Project');
                appStore.setProjectMetadata({
                    created: new Date().toISOString(),
                    modified: new Date().toISOString(),
                    author: 'User'
                });

                fileSystemAdapter.clearCurrentFile();

                set({
                    currentFilePath: null,
                    isDirty: false,
                    lastError: null
                });

                return true;
            },

            // =================================================================
            // Utility Actions
            // =================================================================
            setDirty: (dirty) => set({ isDirty: dirty }),

            refreshPath: () => set({
                currentFilePath: fileSystemAdapter.getCurrentFilePath()
            }),

            refreshRecent: () => set({
                recentProjects: projectService.getRecentProjects()
            }),

            setAutoSave: (enabled) => set({ autoSaveEnabled: enabled }),

            clearError: () => set({ lastError: null, status: 'idle' })
        }),
        {
            name: 'tsuper-project-store',
            storage: createJSONStorage(() => storage),
            partialize: (state) => ({
                recentProjects: state.recentProjects,
                autoSaveEnabled: state.autoSaveEnabled,
                autoSaveIntervalMs: state.autoSaveIntervalMs
            })
        }
    )
);

// =============================================================================
// Auto-Save Effect (to be called from a React component)
// =============================================================================

let autoSaveTimer: NodeJS.Timeout | null = null;
let lastHash = '';

const computeHash = (): string => {
    const { widgets, canvas } = useStore.getState();
    return JSON.stringify({
        w: widgets.length,
        p: widgets.map(w => ({ i: w.id, p: w.position, s: w.size })),
        c: canvas
    });
};

export const startAutoSave = () => {
    const { autoSaveEnabled, autoSaveIntervalMs } = useProjectStore.getState();

    if (!autoSaveEnabled) return;

    // Clear existing timer
    if (autoSaveTimer) clearInterval(autoSaveTimer);

    autoSaveTimer = setInterval(async () => {
        const state = useProjectStore.getState();
        if (!state.autoSaveEnabled) return;

        const currentHash = computeHash();
        if (currentHash !== lastHash) {
            console.log('[AutoSave] Changes detected...');

            try {
                // Recovery save (temp)
                await fileSystemAdapter.saveTempProject({
                    widgets: useStore.getState().widgets,
                    canvas: useStore.getState().canvas,
                    metadata: {
                        savedAt: new Date().toISOString(),
                        originalPath: state.currentFilePath
                    }
                });
                console.log('[AutoSave] Recovery snapshot created.');

                // If we have a file, do regular save
                if (state.currentFilePath) {
                    const success = await state.save({ forceSaveAs: false });
                    if (success) {
                        console.log('[AutoSave] File updated.');
                    }
                }

                lastHash = currentHash;
            } catch (e) {
                console.error('[AutoSave] Failed', e);
            }
        }
    }, autoSaveIntervalMs);
};

export const stopAutoSave = () => {
    if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
        autoSaveTimer = null;
    }
};

// =============================================================================
// Convenience Exports
// =============================================================================

export const hasFileSystemAccess = (): boolean => fileSystemAdapter.hasFileSystemAccess();
