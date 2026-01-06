import type { Tool, ToolDefinition } from '../../types';
import { ragService } from '../../rag';

export const KnowledgeBaseTool: Tool = {
    definition: {
        name: 'search_knowledge',
        description: 'Searches the knowledge base for relevant information. Use this when the user asks questions that might be answered by previously indexed documents. The knowledge base contains chunks of text from PDFs and other documents that have been indexed.',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'The search query to find relevant information. Be specific and include key terms.'
                },
                topK: {
                    type: 'number',
                    description: 'Number of results to return (default: 5, max: 10)'
                }
            },
            required: ['query']
        }
    } as ToolDefinition,

    async execute(args: unknown): Promise<unknown> {
        const { query, topK = 5 } = args as { query: string; topK?: number };

        try {
            const results = await ragService.search(query, Math.min(topK, 10));

            if (results.length === 0) {
                return {
                    success: true,
                    message: 'No relevant information found in the knowledge base. Consider indexing more documents.',
                    results: []
                };
            }

            return {
                success: true,
                message: `Found ${results.length} relevant chunks`,
                results: results.map(chunk => ({
                    documentName: chunk.documentName,
                    documentPath: chunk.documentPath,
                    content: chunk.content,
                    chunkIndex: chunk.chunkIndex
                }))
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to search knowledge base'
            };
        }
    }
};

export const IndexDocumentTool: Tool = {
    definition: {
        name: 'index_document',
        description: 'Indexes a document into the knowledge base for future retrieval. Use this when the user wants to add a document to the AI\'s memory. The document will be split into chunks and stored for semantic search.',
        parameters: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Relative path to the document within T-Workspace. Example: "Library/Datasheets/motor_specs.pdf"'
                }
            },
            required: ['path']
        }
    } as ToolDefinition,

    async execute(args: unknown): Promise<unknown> {
        const { path } = args as { path: string };

        // Get workspace path
        const config = await window.electronAPI?.loadConfig();
        const workspacePath = config?.workspacePath;

        if (!workspacePath) {
            return {
                success: false,
                error: 'Workspace path not configured'
            };
        }

        const cleanPath = path.replace(/^\//, '');
        const fullPath = `${workspacePath}/${cleanPath}`;
        const ext = path.split('.').pop()?.toLowerCase();

        try {
            let content: string;

            // Read document content
            if (ext === 'pdf') {
                const result = await window.electronAPI?.readPdf(fullPath);
                if (!result?.success) {
                    return {
                        success: false,
                        error: result?.error || 'Failed to read PDF'
                    };
                }
                content = result.content || '';
            } else {
                const result = await window.electronAPI?.readFile(fullPath);
                if (!result?.success) {
                    return {
                        success: false,
                        error: result?.error || 'Failed to read file'
                    };
                }
                content = result.content || '';
            }

            // Index the document
            const chunksCount = await ragService.indexDocument(cleanPath, content);

            return {
                success: true,
                message: `Document indexed successfully`,
                path: cleanPath,
                chunksCreated: chunksCount
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to index document'
            };
        }
    }
};

export const ListIndexedDocumentsTool: Tool = {
    definition: {
        name: 'list_indexed_documents',
        description: 'Lists all documents that have been indexed in the knowledge base.',
        parameters: {
            type: 'object',
            properties: {},
            required: []
        }
    } as ToolDefinition,

    async execute(): Promise<unknown> {
        try {
            const documents = await ragService.getIndexedDocuments();

            if (documents.length === 0) {
                return {
                    success: true,
                    message: 'No documents have been indexed yet. Use index_document to add documents to the knowledge base.',
                    documents: []
                };
            }

            return {
                success: true,
                message: `${documents.length} documents indexed`,
                documents: documents.map(doc => ({
                    name: doc.name,
                    path: doc.path,
                    chunks: doc.chunksCount
                }))
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to list indexed documents'
            };
        }
    }
};
