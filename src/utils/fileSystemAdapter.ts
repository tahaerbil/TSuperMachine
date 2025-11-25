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
    saveProject(data: Blob, projectName: string, isNewProject: boolean): Promise<void>;
    loadProject(): Promise<{ file: File; path?: string }>;
    hasFileSystemAccess(): boolean;
    getCurrentFilePath(): string | null;
    clearCurrentFile(): void;
}

// File System Access API Implementation
class FileSystemAccessAdapter implements IFileSystemAdapter {
    private fileHandle: FileSystemFileHandle | null = null;
    private currentPath: string | null = null;

    hasFileSystemAccess(): boolean {
        return 'showSaveFilePicker' in window;
    }

    async saveProject(data: Blob, projectName: string, isNewProject: boolean): Promise<void> {
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

    async saveProject(data: Blob, projectName: string): Promise<void> {
        // Use FileSaver.js
        const { saveAs } = await import('file-saver');
        const fileName = `${projectName.replace(/[^a-z0-9]/gi, '_')}.tsm`;
        saveAs(data, fileName);
        this.currentPath = fileName;
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
    if ('showSaveFilePicker' in window) {
        console.log('Using File System Access API');
        return new FileSystemAccessAdapter();
    } else {
        console.log('Using Download fallback');
        return new DownloadAdapter();
    }
}

// Singleton instance
export const fileSystemAdapter = createFileSystemAdapter();
