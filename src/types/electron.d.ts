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
    saveProject: (data: unknown | Uint8Array, filePath: string | null, saveAs: boolean, asFolder: boolean) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>;
    openProjectDialog: (asFolder: boolean) => Promise<{ success: boolean; data?: Uint8Array | Record<string, string>; filePath?: string; error?: string; canceled?: boolean; isFolder?: boolean }>;
    removeListeners: () => void;
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
