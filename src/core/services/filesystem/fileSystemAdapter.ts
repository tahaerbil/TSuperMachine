
// File System Access API types
interface FileSystemFileHandle {
    createWritable(): Promise<FileSystemWritableFileStream>;
    getFile(): Promise<File>;
}

interface FileSystemWritableFileStream {
    write(data: Blob | BufferSource | string): Promise<void>;
    close(): Promise<void>;
}

declare global {
    interface Window {
        showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
        showOpenFilePicker(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>;
    }
}

interface SaveFilePickerOptions {
    suggestedName?: string;
    types?: FilePickerAcceptType[];
    excludeAcceptAllOption?: boolean;
    startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
}

interface OpenFilePickerOptions {
    multiple?: boolean;
    types?: FilePickerAcceptType[];
    excludeAcceptAllOption?: boolean;
    startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
}

interface FilePickerAcceptType {
    description?: string;
    accept: Record<string, string[]>;
}

// File System Adapter Interface
export interface IFileSystemAdapter {
    saveProject(data: Blob | Record<string, string>, projectName: string, isNewProject: boolean, asFolder?: boolean): Promise<void>;
    saveTempProject(data: unknown): Promise<void>;
    loadProject(fromFolder?: boolean): Promise<{ file?: File; files?: Record<string, string>; path?: string; isFolder?: boolean }>;
    hasFileSystemAccess(): boolean;
    getCurrentFilePath(): string | null;
    clearCurrentFile(): void;
}

// Electron Adapter Implementation
class ElectronAdapter implements IFileSystemAdapter {
    private currentPath: string | null = null;

    hasFileSystemAccess(): boolean {
        return true;
    }

    async saveProject(data: Blob | Record<string, string>, projectName: string, isNewProject: boolean, asFolder: boolean = false): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let payload: any = data;

        // If blob (ZIP), convert to Uint8Array
        if (data instanceof Blob) {
            const buffer = await data.arrayBuffer();
            payload = new Uint8Array(buffer);
        }

        if (!window.electronAPI) throw new Error('Electron API not available');
        const result = await window.electronAPI.saveProject(payload, this.currentPath, isNewProject, asFolder, projectName);

        if (result.success && result.filePath) {
            this.currentPath = result.filePath;
        } else if (result.canceled) {
            throw new Error('Save cancelled');
        } else {
            throw new Error(result.error || 'Unknown save error');
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async saveTempProject(data: any): Promise<void> {
        try {
            if (window.electronAPI) {
                await window.electronAPI.saveTempProject(data);
                console.log('[Adapter] Temp project saved to recovery.');
            }
        } catch (e) {
            console.error('[Adapter] Failed to save temp project:', e);
        }
    }

    async loadProject(fromFolder: boolean = false): Promise<{ file?: File; files?: Record<string, string>; path?: string; isFolder?: boolean }> {
        const result = await window.electronAPI!.openProjectDialog(fromFolder);

        if (result.canceled) throw new Error('Open cancelled');
        if (!result.success || !result.data) throw new Error(result.error || 'Failed to open file');

        this.currentPath = result.filePath!;

        if (result.isFolder) {
            // Return map of files
            return {
                files: result.data as Record<string, string>,
                path: result.filePath,
                isFolder: true
            };
        } else {
            // Return single file (TSM Zip)
            const filePath = result.filePath!;
            const fileName = filePath.split(/[\\/]/).pop() || 'project.tsm';

            const blob = new Blob([result.data as unknown as BlobPart]);
            const file = new File([blob], fileName);

            return { file, path: filePath, isFolder: false };
        }
    }

    getCurrentFilePath(): string | null {
        return this.currentPath;
    }

    clearCurrentFile(): void {
        this.currentPath = null;
    }
}

// File System Access API Implementation
class FileSystemAccessAdapter implements IFileSystemAdapter {
    private fileHandle: FileSystemFileHandle | null = null;
    private currentPath: string | null = null;

    hasFileSystemAccess(): boolean {
        return 'showSaveFilePicker' in window;
    }

    async saveProject(data: Blob | Record<string, string>, projectName: string, isNewProject: boolean, asFolder: boolean = false): Promise<void> {
        if (asFolder) throw new Error("Folder save not supported in Web mode yet.");
        if (!(data instanceof Blob)) throw new Error("Folder save logic failed.");

        try {
            // If new project or no handle, show save dialog
            if (isNewProject || !this.fileHandle) {
                this.fileHandle = await window.showSaveFilePicker({
                    suggestedName: `${projectName}.tsm`,
                    startIn: 'documents',
                    types: [
                        {
                            description: 'TSuperMachine Project',
                            accept: { 'application/tsm': ['.tsm'] },
                        },
                    ],
                    excludeAcceptAllOption: true,
                });

                // Store the file name as path
                const file = await this.fileHandle.getFile();
                this.currentPath = file.name;
            }

            // Write to file
            const writable = await this.fileHandle.createWritable();
            await writable.write(data);
            await writable.close();
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                // User cancelled
                throw new Error('Save cancelled');
            }
            throw error;
        }
    }

    async saveTempProject(data: unknown): Promise<void> {
        // Fallback for Web: LocalStorage (might be too small, but better than nothing)
        // Ideally should use IndexedDB, but keeping it simple for now as requested for "Industry Standard logic"
        try {
            localStorage.setItem('tsm_recovery', JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save recovery to localStorage (quota exceeded?)', e);
        }
    }

    async loadProject(): Promise<{ file: File; path?: string }> {
        try {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [
                    {
                        description: 'TSuperMachine Project',
                        accept: { 'application/tsm': ['.tsm'] },
                    },
                ],
                excludeAcceptAllOption: true,
                multiple: false,
            });

            this.fileHandle = fileHandle;
            const file = await fileHandle.getFile();
            this.currentPath = file.name;

            return { file, path: file.name };
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                throw new Error('Open cancelled');
            }
            throw error;
        }
    }

    getCurrentFilePath(): string | null {
        return this.currentPath;
    }

    clearCurrentFile(): void {
        this.fileHandle = null;
        this.currentPath = null;
    }
}

// Fallback: Download-based Implementation
class DownloadAdapter implements IFileSystemAdapter {
    private currentPath: string | null = null;

    hasFileSystemAccess(): boolean {
        return false;
    }

    async saveProject(data: Blob | Record<string, string>, projectName: string): Promise<void> {
        if (!(data instanceof Blob)) throw new Error("Folder save not supported in Download mode.");
        // Use FileSaver.js
        const { saveAs } = await import('file-saver');
        const fileName = `${projectName.replace(/[^a-z0-9]/gi, '_')}.tsm`;
        saveAs(data, fileName);
        this.currentPath = fileName;
    }

    async saveTempProject(data: unknown): Promise<void> {
        try {
            localStorage.setItem('tsm_recovery', JSON.stringify(data));
        } catch {
            // Ignore
        }
    }

    async loadProject(): Promise<{ file: File; path?: string }> {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.tsm';

            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    this.currentPath = file.name;
                    resolve({ file, path: file.name });
                } else {
                    reject(new Error('No file selected'));
                }
            };

            input.click();
        });
    }

    getCurrentFilePath(): string | null {
        return this.currentPath;
    }

    clearCurrentFile(): void {
        this.currentPath = null;
    }
}

// Factory: Auto-select best adapter
export function createFileSystemAdapter(): IFileSystemAdapter {
    if (window.electronAPI) {
        console.log('Using Electron File System Adapter');
        return new ElectronAdapter();
    } else if ('showSaveFilePicker' in window) {
        console.log('Using File System Access API');
        return new FileSystemAccessAdapter();
    } else {
        console.log('Using Download fallback');
        return new DownloadAdapter();
    }
}

// Singleton instance
export const fileSystemAdapter = createFileSystemAdapter();
