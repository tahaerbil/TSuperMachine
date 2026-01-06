import { toolRegistry } from './ToolRegistry';
import { CalculatorTool } from './tools/std/CalculatorTool';
import { FileSystemTool } from './tools/std/FileSystemTool';
import { DocumentReaderTool } from './tools/std/DocumentReaderTool';
import { KnowledgeBaseTool, IndexDocumentTool, ListIndexedDocumentsTool } from './tools/rag';

// Register standard tools
toolRegistry.register(CalculatorTool);
toolRegistry.register(FileSystemTool);
toolRegistry.register(DocumentReaderTool);

// Register RAG (Knowledge Base) tools
toolRegistry.register(KnowledgeBaseTool);
toolRegistry.register(IndexDocumentTool);
toolRegistry.register(ListIndexedDocumentsTool);

export * from './types';
export * from './AIService';
export * from './ToolRegistry';
export * from './providers/OllamaProvider';
export * from './rag';
