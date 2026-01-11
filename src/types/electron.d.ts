/**
 * Electron API Type Definitions
 * 
 * Global type declarations for Electron preload APIs.
 * This file is the single source of truth for Window interface extensions.
 */

// ============================================================================
// Electron API (IPC communication via preload)
// ============================================================================
interface ElectronAPI {
    platform: string;
    isElectron: boolean;
    hasNativeCAD: boolean;
    onMenuAction: (callback: (action: string) => void) => void;
    onLoadProjectData: (callback: (payload: { data: unknown; filePath: string }) => void) => void;
    saveProject: (data: unknown | Uint8Array, filePath: string | null, saveAs: boolean, asFolder: boolean, projectName?: string) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>;
    saveTempProject: (data: unknown) => Promise<{ success: boolean; filePath?: string; error?: string }>;
    openProjectDialog: (asFolder: boolean) => Promise<{ success: boolean; data?: Uint8Array | Record<string, string>; filePath?: string; error?: string; canceled?: boolean; isFolder?: boolean }>;
    saveDXF: (params: { content: string; suggestedName?: string }) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>;
    removeListeners: () => void;

    // Config Operations
    saveConfig: (config: unknown) => Promise<{ success: boolean; error?: string }>;
    loadConfig: () => Promise<{ workspacePath?: string;[key: string]: unknown } | null>;

    // Directory Operations (Data Vault)
    listDirectory: (dirPath: string) => Promise<{ success: boolean; items?: { name: string; isDirectory: boolean; path: string; size: number }[]; error?: string }>;
    createDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
    copyFile: (params: { sourcePath: string; targetPath: string }) => Promise<{ success: boolean; error?: string }>;
    copyFileToProject: (params: { filePath: string; projectPath: string }) => Promise<{ success: boolean; targetPath?: string; relativePath?: string; subFolder?: string; fileName?: string; error?: string }>;

    // Document Reading (AI Support)
    readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
    readPdf: (filePath: string) => Promise<{ success: boolean; content?: string; numPages?: number; info?: unknown; error?: string }>;
    writeFile: (params: { filePath: string; content: string }) => Promise<{ success: boolean; error?: string }>;


    // LLM (Embedded Qwen2.5-3B)
    llmCheckModel: () => Promise<{ exists: boolean; path: string; filename: string }>;
    llmLoad: () => Promise<{ success: boolean; message?: string; error?: string; needsDownload?: boolean }>;
    llmGenerate: (params: { prompt: string; maxTokens?: number; temperature?: number }) => Promise<{ success: boolean; response?: string; error?: string }>;
    llmUnload: () => Promise<{ success: boolean; error?: string }>;
}

// ============================================================================
// Global Window Interface Extension
// Note: nativeCAD and createCADEngine types are defined in CADEngine.ts
// since they depend on complex internal types (NativeCADAPI, CppEngine)
// ============================================================================
interface Window {
    electronAPI?: ElectronAPI;
    // NativeCAD and createCADEngine are typed as 'any' here to avoid circular
    // dependencies. The actual types are enforced in CADEngine.ts at usage site.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nativeCAD?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createCADEngine?: () => Promise<any>;
}
