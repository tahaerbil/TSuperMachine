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
async function createProjectBlob(
    projectName: string,
    canvasState: CanvasState,
    author: string = 'User'
): Promise<Blob> {
    const zip = new JSZip();

    // Create project metadata
    const metadata: ProjectMetadata = {
        name: projectName,
        version: '1.0.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        author: author,
        description: `TSuperMachine project: ${projectName}`,
    };

    // Add files to ZIP
    zip.file('project.json', JSON.stringify(metadata, null, 2));
    zip.file('canvas.json', JSON.stringify(canvasState, null, 2));

    // Add CAD Data (if available and native)
    try {
        if (cadEngine.getEngineType() === 'native') {
            const cadData = cadEngine.exportDatabase();
            zip.file('cadData.json', cadData);
        }
    } catch (e) {
        console.warn("Failed to export CAD data:", e);
    }

    // Create folder structure
    zip.folder('parts');
    zip.folder('assemblies');
    zip.folder('drawings');
    zip.folder('resources');
    zip.folder('calculations');

    // Generate ZIP blob
    return await zip.generateAsync({ type: 'blob' });
}

// Save project (uses File System Access API if available)
export async function saveProject(
    projectName: string,
    canvasState: CanvasState,
    author: string = 'User',
    isNewProject: boolean = false
): Promise<void> {
    try {
        const blob = await createProjectBlob(projectName, canvasState, author);
        await fileSystemAdapter.saveProject(blob, projectName, isNewProject);
    } catch (error) {
        console.error('Error saving project:', error);
        if ((error as Error).message === 'Save cancelled') {
            throw error; // User cancelled, don't show error
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

// Load project from .tsm file
export async function loadProject(file?: File): Promise<{
    metadata: ProjectMetadata;
    canvasState: CanvasState;
}> {
    try {
        // If no file provided, use file system adapter to pick one
        const fileToLoad = file || (await fileSystemAdapter.loadProject()).file;

        const zip = new JSZip();
        const contents = await zip.loadAsync(fileToLoad);

        // Read project.json
        const projectFile = contents.file('project.json');
        if (!projectFile) {
            throw new Error('Invalid project file: missing project.json');
        }
        const metadataText = await projectFile.async('text');
        const metadata: ProjectMetadata = JSON.parse(metadataText);

        // Read canvas.json
        const canvasFile = contents.file('canvas.json');
        if (!canvasFile) {
            throw new Error('Invalid project file: missing canvas.json');
        }
        const canvasText = await canvasFile.async('text');
        const canvasState: CanvasState = JSON.parse(canvasText);

        // Read and import CAD Data
        const cadFile = contents.file('cadData.json');
        if (cadFile) {
            const cadData = await cadFile.async('text');
            try {
                if (cadEngine.getEngineType() === 'native') {
                    cadEngine.importDatabase(cadData);
                }
            } catch (e) {
                console.warn("Failed to import CAD data:", e);
            }
        } else {
            // If no CAD data found, clear the engine
            if (cadEngine.getEngineType() === 'native') {
                cadEngine.clear();
            }
        }

        // Validate data
        if (!metadata.name || !metadata.version) {
            throw new Error('Invalid project metadata');
        }

        if (!canvasState.canvas || !canvasState.widgets) {
            throw new Error('Invalid canvas state');
        }

        return { metadata, canvasState };
    } catch (error) {
        console.error('Error loading project:', error);
        if ((error as Error).message === 'Open cancelled') {
            throw error; // User cancelled
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
