import type { Tool, ToolDefinition } from '../../types';

export const FileSystemTool: Tool = {
    definition: {
        name: 'list_files',
        description: 'Lists files and folders in the T-Workspace directory. Use this to explore the user\'s document library, including Standards, Datasheets, and project files. Returns file names, types (file/folder), and sizes.',
        parameters: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Relative path within T-Workspace. Use "/" for root, "Library/Datasheets" for datasheets folder, "Projects" for projects folder, etc.'
                }
            },
            required: ['path']
        }
    } as ToolDefinition,

    async execute(args: unknown): Promise<unknown> {
        const { path } = args as { path: string };

        // Get workspace path from config
        const config = await window.electronAPI?.loadConfig();
        const workspacePath = config?.workspacePath;

        if (!workspacePath) {
            return {
                success: false,
                error: 'Workspace path not configured. Please check settings.'
            };
        }

        // Build full path
        const cleanPath = path === '/' ? '' : path.replace(/^\//, '');
        const fullPath = cleanPath ? `${workspacePath}/${cleanPath}` : workspacePath;

        // List directory
        const result = await window.electronAPI?.listDirectory(fullPath);

        if (!result?.success) {
            return {
                success: false,
                error: result?.error || 'Failed to list directory',
                requestedPath: path
            };
        }

        // Format response for AI
        const items = result.items || [];
        const folders = items.filter((item: { isDirectory: boolean }) => item.isDirectory);
        const files = items.filter((item: { isDirectory: boolean }) => !item.isDirectory);

        return {
            success: true,
            path: path,
            summary: `Found ${folders.length} folders and ${files.length} files`,
            folders: folders.map((f: { name: string }) => f.name),
            files: files.map((f: { name: string; size: number }) => ({
                name: f.name,
                size: f.size > 1024 * 1024
                    ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
                    : f.size > 1024
                        ? `${(f.size / 1024).toFixed(1)} KB`
                        : `${f.size} B`
            }))
        };
    }
};
