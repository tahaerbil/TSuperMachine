import type { Tool, ToolDefinition } from '../../types';

export const DocumentReaderTool: Tool = {
    definition: {
        name: 'read_document',
        description: 'Reads the content of a document file from T-Workspace. Use this to analyze PDFs, text files, markdown, JSON, and other text-based documents. Returns the text content of the file.',
        parameters: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Relative path to the file within T-Workspace. Example: "Library/Datasheets/motor_specs.pdf" or "Projects/Project1/notes.txt"'
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
        const cleanPath = path.replace(/^\//, '');
        const fullPath = `${workspacePath}/${cleanPath}`;
        const ext = path.split('.').pop()?.toLowerCase();

        try {
            let content: string;
            let numPages: number | undefined;

            if (ext === 'pdf') {
                // Use PDF reader
                const result = await window.electronAPI?.readPdf(fullPath);
                if (!result?.success) {
                    return {
                        success: false,
                        error: result?.error || 'Failed to read PDF',
                        requestedPath: path
                    };
                }
                content = result.content || '';
                numPages = result.numPages;
            } else {
                // Use text file reader
                const result = await window.electronAPI?.readFile(fullPath);
                if (!result?.success) {
                    return {
                        success: false,
                        error: result?.error || 'Failed to read file',
                        requestedPath: path
                    };
                }
                content = result.content || '';
            }

            // Truncate if too long (AI context limit)
            const maxLength = 8000;
            let truncated = false;
            if (content.length > maxLength) {
                content = content.substring(0, maxLength);
                truncated = true;
            }

            return {
                success: true,
                path: path,
                fileName: path.split('/').pop(),
                fileType: ext,
                numPages: numPages,
                contentLength: content.length,
                truncated: truncated,
                content: content
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to read document',
                requestedPath: path
            };
        }
    }
};

