/**
 * RAG (Retrieval-Augmented Generation) Service
 * 
 * This service provides document chunking, embedding, and semantic search
 * capabilities for the T-Brain AI assistant.
 * 
 * Architecture:
 * - Documents are split into chunks (~500 chars each)
 * - Each chunk is embedded using keyword extraction (upgradeable to Ollama embeddings)
 * - Vectors are stored in a JSON file in T-Workspace/System/vector_db/
 * - Similarity search finds relevant chunks for AI context
 */

export interface DocumentChunk {
    id: string;
    documentPath: string;
    documentName: string;
    chunkIndex: number;
    content: string;
    keywords: string[];
    timestamp: number;
}

export interface VectorIndex {
    version: string;
    documents: Record<string, {
        path: string;
        name: string;
        chunksCount: number;
        indexedAt: number;
    }>;
    chunks: DocumentChunk[];
}

// Simple keyword extraction (can be upgraded to embeddings later)
function extractKeywords(text: string): string[] {
    // Remove punctuation and convert to lowercase
    const cleaned = text.toLowerCase().replace(/[^\w\sığüşöçİĞÜŞÖÇ]/g, ' ');

    // Split into words
    const words = cleaned.split(/\s+/).filter(w => w.length > 2);

    // Remove common stop words (English + Turkish)
    const stopWords = new Set([
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
        'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
        'and', 'but', 'or', 'nor', 'for', 'yet', 'so', 'in', 'on', 'at', 'to',
        'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during',
        'before', 'after', 'above', 'below', 'from', 'up', 'down', 'out', 'off',
        'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there',
        'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most',
        'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same', 'than',
        'too', 'very', 'just', 'this', 'that', 'these', 'those',
        // Turkish
        've', 'veya', 'ile', 'için', 'bir', 'bu', 'şu', 'o', 'de', 'da',
        'den', 'dan', 'ne', 'ki', 'mi', 'mı', 'mu', 'mü', 'ama', 'fakat',
        'ancak', 'çünkü', 'eğer', 'gibi', 'kadar', 'daha', 'en', 'çok',
        'az', 'her', 'hiç', 'bazı', 'bütün', 'tüm', 'olan', 'olarak'
    ]);

    const keywords = words.filter(w => !stopWords.has(w));

    // Return unique keywords
    return [...new Set(keywords)];
}

// Split text into chunks
function chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
        let end = start + chunkSize;

        // Try to break at sentence boundary
        if (end < text.length) {
            const lastPeriod = text.lastIndexOf('.', end);
            const lastNewline = text.lastIndexOf('\n', end);
            const breakPoint = Math.max(lastPeriod, lastNewline);

            if (breakPoint > start + chunkSize / 2) {
                end = breakPoint + 1;
            }
        }

        chunks.push(text.slice(start, end).trim());
        start = end - overlap;
    }

    return chunks.filter(c => c.length > 20);
}

// Calculate similarity between two keyword sets (Jaccard similarity)
function calculateSimilarity(keywords1: string[], keywords2: string[]): number {
    const set2 = new Set(keywords2);

    const intersection = keywords1.filter(k => set2.has(k)).length;
    const union = new Set([...keywords1, ...keywords2]).size;

    return union > 0 ? intersection / union : 0;
}

export class RAGService {
    private index: VectorIndex | null = null;
    private indexPath: string = '';

    async initialize(): Promise<void> {
        // Get workspace path
        const config = await window.electronAPI?.loadConfig();
        const workspacePath = config?.workspacePath;

        if (!workspacePath) {
            throw new Error('Workspace path not configured');
        }

        // Ensure vector_db directory exists
        const vectorDbPath = `${workspacePath}/System/vector_db`;
        await window.electronAPI?.createDirectory(vectorDbPath);

        this.indexPath = `${vectorDbPath}/index.json`;

        // Load existing index or create new
        try {
            const result = await window.electronAPI?.readFile(this.indexPath);
            if (result?.success && result.content) {
                this.index = JSON.parse(result.content);
            } else {
                this.index = this.createEmptyIndex();
            }
        } catch {
            this.index = this.createEmptyIndex();
        }
    }

    private createEmptyIndex(): VectorIndex {
        return {
            version: '1.0',
            documents: {},
            chunks: []
        };
    }

    async indexDocument(path: string, content: string): Promise<number> {
        if (!this.index) {
            await this.initialize();
        }

        const docId = path.replace(/[^a-zA-Z0-9]/g, '_');
        const docName = path.split('/').pop() || path;

        // Remove existing chunks for this document
        this.index!.chunks = this.index!.chunks.filter(c => c.documentPath !== path);

        // Chunk the content
        const textChunks = chunkText(content);

        // Create chunk objects
        const chunks: DocumentChunk[] = textChunks.map((text, index) => ({
            id: `${docId}_${index}`,
            documentPath: path,
            documentName: docName,
            chunkIndex: index,
            content: text,
            keywords: extractKeywords(text),
            timestamp: Date.now()
        }));

        // Add to index
        this.index!.chunks.push(...chunks);
        this.index!.documents[docId] = {
            path,
            name: docName,
            chunksCount: chunks.length,
            indexedAt: Date.now()
        };

        // Save index
        await this.saveIndex();

        return chunks.length;
    }

    async search(query: string, topK: number = 5): Promise<DocumentChunk[]> {
        if (!this.index) {
            await this.initialize();
        }

        if (!this.index || this.index.chunks.length === 0) {
            return [];
        }

        const queryKeywords = extractKeywords(query);

        // Calculate similarity for each chunk
        const scored = this.index.chunks.map(chunk => ({
            chunk,
            score: calculateSimilarity(queryKeywords, chunk.keywords)
        }));

        // Sort by score and return top K
        scored.sort((a, b) => b.score - a.score);

        return scored
            .slice(0, topK)
            .filter(s => s.score > 0.05) // Minimum threshold
            .map(s => s.chunk);
    }

    async getIndexedDocuments(): Promise<{ path: string; name: string; chunksCount: number }[]> {
        if (!this.index) {
            await this.initialize();
        }

        return Object.values(this.index?.documents || {});
    }

    async removeDocument(path: string): Promise<boolean> {
        if (!this.index) {
            await this.initialize();
        }

        const docId = path.replace(/[^a-zA-Z0-9]/g, '_');

        if (!this.index!.documents[docId]) {
            return false;
        }

        this.index!.chunks = this.index!.chunks.filter(c => c.documentPath !== path);
        delete this.index!.documents[docId];

        await this.saveIndex();
        return true;
    }

    private async saveIndex(): Promise<void> {
        if (!this.index || !this.indexPath) return;

        const indexContent = JSON.stringify(this.index, null, 2);

        try {
            await window.electronAPI?.writeFile({
                filePath: this.indexPath,
                content: indexContent
            });
            console.log('RAG Index saved:', Object.keys(this.index.documents).length, 'documents,', this.index.chunks.length, 'chunks');
        } catch (error) {
            console.error('Failed to save RAG index:', error);
        }
    }
}

// Singleton instance
export const ragService = new RAGService();
