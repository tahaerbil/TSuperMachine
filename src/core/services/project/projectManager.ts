import JSZip from 'jszip';
import { fileSystemAdapter } from '../filesystem/fileSystemAdapter';
import { cadEngine } from '../cad-engine/CADEngine';

// Project metadata interface
export interface ProjectMetadata {
    name: string;
    version: string;
    created: string;
    modified: string;
    author: string;
    description?: string;
}

// Canvas state interface
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

// Create project ZIP blob
// Prepare project data map (file name -> content)
async function prepareProjectFiles(
    projectName: string,
    canvasState: CanvasState,
    author: string = 'User'
): Promise<Record<string, string>> {
    // Create project metadata
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

    // Create empty folder markers if needed, or just skip them for now as folders are implicit
    return files;
}

// Create project ZIP blob from pre-prepared files
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

// Save project (uses File System Access API if available)
// Save project
export async function saveProject(
    projectName: string,
    canvasState: CanvasState,
    author: string = 'User',
    isNewProject: boolean = false,
    asFolder: boolean = false
): Promise<void> {
    try {
        const files = await prepareProjectFiles(projectName, canvasState, author);

        if (asFolder) {
            // Pass raw files map to adapter
            await fileSystemAdapter.saveProject(files, projectName, isNewProject, true);
        } else {
            // Create ZIP blob
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
}

// Save As (always shows save dialog)
export async function saveProjectAs(
    projectName: string,
    canvasState: CanvasState,
    author: string = 'User'
): Promise<void> {
    return saveProject(projectName, canvasState, author, true);
}

// Load project from .tsm file or Folder
export async function loadProject(file?: File, fromFolder: boolean = false): Promise<{
    metadata: ProjectMetadata;
    canvasState: CanvasState;
}> {
    try {
        let filesMap: Record<string, string> = {};

        if (file) {
            // Loading from provided file (ZIP)
            const zip = new JSZip();
            const contents = await zip.loadAsync(file);

            // Extract to map
            const pText = await contents.file('project.json')?.async('text');
            if (pText) filesMap['project.json'] = pText;

            const cText = await contents.file('canvas.json')?.async('text');
            if (cText) filesMap['canvas.json'] = cText;

            const cadText = await contents.file('cadData.json')?.async('text');
            if (cadText) filesMap['cadData.json'] = cadText;

        } else {
            // Let adapter pick
            const result = await fileSystemAdapter.loadProject(fromFolder);

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
        }

        // Validate and Parse
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

        // Validate data
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
}

// Validate project file
export function validateProjectFile(file: File): boolean {
    // Check file extension
    if (!file.name.endsWith('.tsm')) {
        return false;
    }

    // Check file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
        return false;
    }

    return true;
}

// Get recent projects from localStorage
export function getRecentProjects(): ProjectMetadata[] {
    try {
        const recent = localStorage.getItem('recent-projects');
        if (!recent) return [];
        return JSON.parse(recent);
    } catch {
        return [];
    }
}

// Add project to recent list
export function addToRecentProjects(metadata: ProjectMetadata): void {
    try {
        const recent = getRecentProjects();

        // Remove if already exists
        const filtered = recent.filter((p) => p.name !== metadata.name);

        // Add to beginning
        filtered.unshift(metadata);

        // Keep only last 5
        const limited = filtered.slice(0, 5);

        localStorage.setItem('recent-projects', JSON.stringify(limited));
    } catch (error) {
        console.error('Error saving to recent projects:', error);
    }
}

// Check if File System Access API is available
export function hasFileSystemAccess(): boolean {
    return fileSystemAdapter.hasFileSystemAccess();
}

// Get current file path
export function getCurrentFilePath(): string | null {
    return fileSystemAdapter.getCurrentFilePath();
}

// Clear current file (for new project)
export function clearCurrentFile(): void {
    fileSystemAdapter.clearCurrentFile();
}
