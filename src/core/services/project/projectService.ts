/**
 * Project Service
 * 
 * Pure functions for project file operations.
 * NO state management here - that's handled by projectStore.
 */

import JSZip from 'jszip';
import { fileSystemAdapter } from '../filesystem/fileSystemAdapter';
import { cadEngine } from '../cad-engine/CADEngine';

// =============================================================================
// Types
// =============================================================================

export interface ProjectMetadata {
    name: string;
    version: string;
    created: string;
    modified: string;
    author: string;
    description?: string;
}

export interface CanvasState {
    canvas: {
        offset: { x: number; y: number };
        scale: number;
    };
    widgets: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    theme: {
        mode: string;
        customTheme: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    };
    language: string;
}

// =============================================================================
// File Operations (Pure Functions)
// =============================================================================

/**
 * Prepare project files map from canvas state
 */
async function prepareProjectFiles(
    projectName: string,
    canvasState: CanvasState,
    author: string = 'User'
): Promise<Record<string, string>> {
    const metadata: ProjectMetadata = {
        name: projectName,
        version: '1.0.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        author: author,
        description: `TSuperMachine project: ${projectName}`,
    };

    const files: Record<string, string> = {};
    files['project.json'] = JSON.stringify(metadata, null, 2);
    files['canvas.json'] = JSON.stringify(canvasState, null, 2);

    // Add CAD Data
    try {
        if (cadEngine.getEngineType() === 'native') {
            const cadData = cadEngine.exportDatabase();
            if (cadData) files['cadData.json'] = cadData;
        }
    } catch (e) {
        console.warn("Failed to export CAD data:", e);
    }

    return files;
}

/**
 * Create project ZIP blob from files map
 */
async function createProjectBlob(files: Record<string, string>): Promise<Blob> {
    const zip = new JSZip();

    for (const [name, content] of Object.entries(files)) {
        zip.file(name, content);
    }

    // Create standard folder structure (empty)
    zip.folder('parts');
    zip.folder('assemblies');
    zip.folder('drawings');
    zip.folder('resources');
    zip.folder('calculations');

    return await zip.generateAsync({ type: 'blob' });
}

/**
 * Parse files map from ZIP or folder load result
 */
async function parseProjectFiles(
    result: { file?: File; files?: Record<string, string>; isFolder?: boolean }
): Promise<Record<string, string>> {
    let filesMap: Record<string, string> = {};

    if (result.isFolder && result.files) {
        filesMap = result.files;
    } else if (result.file) {
        const zip = new JSZip();
        const contents = await zip.loadAsync(result.file);

        const pText = await contents.file('project.json')?.async('text');
        if (pText) filesMap['project.json'] = pText;

        const cText = await contents.file('canvas.json')?.async('text');
        if (cText) filesMap['canvas.json'] = cText;

        const cadText = await contents.file('cadData.json')?.async('text');
        if (cadText) filesMap['cadData.json'] = cadText;
    }

    return filesMap;
}

// =============================================================================
// Exported Service Functions
// =============================================================================

export const projectService = {
    /**
     * Save project to file system
     */
    async saveProject(
        projectName: string,
        canvasState: CanvasState,
        author: string = 'User',
        isNewProject: boolean = false,
        asFolder: boolean = false
    ): Promise<void> {
        try {
            const files = await prepareProjectFiles(projectName, canvasState, author);

            if (asFolder) {
                await fileSystemAdapter.saveProject(files, projectName, isNewProject, true);
            } else {
                const blob = await createProjectBlob(files);
                await fileSystemAdapter.saveProject(blob, projectName, isNewProject, false);
            }
        } catch (error) {
            console.error('Error saving project:', error);
            if ((error as Error).message === 'Save cancelled') {
                throw error;
            }
            throw new Error('Failed to save project');
        }
    },

    /**
     * Load project from file or folder
     */
    async loadProject(file?: File, fromFolder: boolean = false): Promise<{
        metadata: ProjectMetadata;
        canvasState: CanvasState;
    }> {
        try {
            let filesMap: Record<string, string> = {};

            if (file) {
                // Loading from provided file (ZIP)
                const zip = new JSZip();
                const contents = await zip.loadAsync(file);

                const pText = await contents.file('project.json')?.async('text');
                if (pText) filesMap['project.json'] = pText;

                const cText = await contents.file('canvas.json')?.async('text');
                if (cText) filesMap['canvas.json'] = cText;

                const cadText = await contents.file('cadData.json')?.async('text');
                if (cadText) filesMap['cadData.json'] = cadText;
            } else {
                // Let adapter pick file/folder
                const result = await fileSystemAdapter.loadProject(fromFolder);
                filesMap = await parseProjectFiles(result);
            }

            // Validate
            if (!filesMap['project.json']) throw new Error('Missing project.json');
            if (!filesMap['canvas.json']) throw new Error('Missing canvas.json');

            const metadata: ProjectMetadata = JSON.parse(filesMap['project.json']);
            const canvasState: CanvasState = JSON.parse(filesMap['canvas.json']);

            // Import CAD Data
            if (filesMap['cadData.json']) {
                try {
                    if (cadEngine.getEngineType() === 'native') {
                        cadEngine.importDatabase(filesMap['cadData.json']);
                    }
                } catch (e) {
                    console.warn("Failed to import CAD data:", e);
                }
            } else {
                if (cadEngine.getEngineType() === 'native') {
                    cadEngine.clear();
                }
            }

            // Validate structure
            if (!metadata.name || !metadata.version) throw new Error('Invalid project metadata');
            if (!canvasState.canvas || !canvasState.widgets) throw new Error('Invalid canvas state');

            return { metadata, canvasState };
        } catch (error) {
            console.error('Error loading project:', error);
            if ((error as Error).message === 'Open cancelled') {
                throw error;
            }
            throw new Error('Failed to load project: ' + (error as Error).message);
        }
    },

    /**
     * Validate project file
     */
    validateProjectFile(file: File): boolean {
        if (!file.name.endsWith('.tsm')) return false;
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) return false;
        return true;
    },

    /**
     * Get recent projects from localStorage
     */
    getRecentProjects(): ProjectMetadata[] {
        try {
            const recent = localStorage.getItem('recent-projects');
            if (!recent) return [];
            return JSON.parse(recent);
        } catch {
            return [];
        }
    },

    /**
     * Add project to recent list
     */
    addToRecentProjects(metadata: ProjectMetadata): void {
        try {
            const recent = this.getRecentProjects();
            const filtered = recent.filter((p) => p.name !== metadata.name);
            filtered.unshift(metadata);
            const limited = filtered.slice(0, 5);
            localStorage.setItem('recent-projects', JSON.stringify(limited));
        } catch (error) {
            console.error('Error saving to recent projects:', error);
        }
    }
};

// =============================================================================
// Backward Compatibility Exports (for gradual migration)
// =============================================================================

export const saveProject = projectService.saveProject.bind(projectService);
export const loadProject = projectService.loadProject.bind(projectService);
export const validateProjectFile = projectService.validateProjectFile.bind(projectService);
export const getRecentProjects = projectService.getRecentProjects.bind(projectService);
export const addToRecentProjects = projectService.addToRecentProjects.bind(projectService);
export const hasFileSystemAccess = () => fileSystemAdapter.hasFileSystemAccess();
export const getCurrentFilePath = () => fileSystemAdapter.getCurrentFilePath();
export const clearCurrentFile = () => fileSystemAdapter.clearCurrentFile();
