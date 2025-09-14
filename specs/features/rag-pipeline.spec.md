# RAG Pipeline Specification

## Overview
Retrieval-Augmented Generation pipeline using Supabase pgvector for semantic search, enabling AI responses to be grounded in custom knowledge bases and documents.

## Requirements

### Functional Requirements
- **Document Ingestion**: Process and embed various document types
- **Vector Storage**: Store embeddings in Supabase pgvector
- **Semantic Search**: Find relevant context using vector similarity
- **Context Integration**: Seamlessly integrate retrieved context into AI responses
- **Real-time Updates**: Stream results with retrieved context
- **Multi-format Support**: Handle PDF, Word, text, markdown, code files

### Non-functional Requirements
- **Performance**: Retrieval < 200ms, embedding < 500ms per document
- **Accuracy**: Semantic search precision > 85%
- **Scalability**: Support 10,000+ documents on free tier
- **Reliability**: 99.9% availability for retrieval operations
- **Security**: Document access control with user permissions

## Architecture

### RAG Pipeline Flow
```
Document Upload → Text Extraction → Chunking → Embedding Generation → Vector Storage
       ↓              ↓             ↓            ↓                  ↓
User Query → Query Embedding → Similarity Search → Context Retrieval → AI Response
     ↑            ↓                ↓                    ↓              ↓
Context ← Result Ranking ← Metadata Filtering ← Permission Check ← Enhanced Response
```

### Core Components
- **Document Processor**: Extract and clean text from various formats
- **Text Chunker**: Split documents into searchable segments
- **Embedding Service**: Generate vector embeddings using AI models
- **Vector Database**: Supabase pgvector for similarity search
- **Retrieval Engine**: Find and rank relevant context
- **Context Integrator**: Combine retrieved context with AI responses

## Document Processing

### Supported Formats
- **Text Files**: .txt, .md, .rtf
- **Documents**: .pdf, .docx, .doc
- **Code Files**: .js, .ts, .py, .java, .cpp, etc.
- **Structured Data**: .json, .xml, .csv
- **Web Content**: HTML pages and articles

### Text Extraction
```typescript
interface DocumentProcessor {
  extractText(file: File): Promise<ExtractedContent>;
  getMetadata(file: File): Promise<DocumentMetadata>;
  validateFormat(file: File): boolean;
}

interface ExtractedContent {
  text: string;
  metadata: DocumentMetadata;
  structure: DocumentStructure[];
}

interface DocumentMetadata {
  title: string;
  author?: string;
  createdAt: Date;
  modifiedAt: Date;
  fileType: string;
  size: number;
  language?: string;
  tags?: string[];
}
```

### Text Chunking
```typescript
interface TextChunker {
  chunkBySize(text: string, maxSize: number, overlap: number): TextChunk[];
  chunkBySentence(text: string, maxSentences: number): TextChunk[];
  chunkBySection(text: string, structure: DocumentStructure[]): TextChunk[];
  chunkByTokens(text: string, maxTokens: number, overlap: number): TextChunk[];
}

interface TextChunk {
  id: string;
  content: string;
  metadata: ChunkMetadata;
  position: ChunkPosition;
}

interface ChunkMetadata {
  documentId: string;
  chunkIndex: number;
  tokenCount: number;
  wordCount: number;
  startOffset: number;
  endOffset: number;
}
```

## Vector Storage

### Database Schema
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table
CREATE TABLE rag_documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Document chunks with embeddings
CREATE TABLE rag_chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT REFERENCES rag_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI embedding dimension
  metadata JSONB NOT NULL,
  token_count INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX idx_rag_chunks_embedding ON rag_chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create index for user-scoped queries
CREATE INDEX idx_rag_documents_user_id ON rag_documents(user_id);
CREATE INDEX idx_rag_chunks_document_id ON rag_chunks(document_id);
```

### Embedding Generation
```typescript
interface EmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
  getDimensions(): number;
}

class OpenAIEmbeddingService implements EmbeddingService {
  private model = 'text-embedding-3-small'; // Free tier compatible
  
  async generateEmbedding(text: string): Promise<number[]> {
    // Use OpenAI API to generate embeddings
    // Handle rate limiting and errors
  }
  
  getDimensions(): number {
    return 1536; // text-embedding-3-small dimension
  }
}
```

## Semantic Search

### Similarity Search
```typescript
interface VectorSearchEngine {
  search(query: string, options: SearchOptions): Promise<SearchResult[]>;
  searchWithFilters(query: string, filters: SearchFilters): Promise<SearchResult[]>;
  rerank(results: SearchResult[], query: string): Promise<SearchResult[]>;
}

interface SearchOptions {
  userId: string;
  limit: number;
  threshold: number;
  includeMetadata: boolean;
  documentTypes?: string[];
  dateRange?: DateRange;
}

interface SearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  similarity: number;
  metadata: ChunkMetadata;
  document: DocumentMetadata;
}
```

### Query Processing
```typescript
class QueryProcessor {
  async processQuery(query: string): Promise<ProcessedQuery> {
    return {
      originalQuery: query,
      cleanedQuery: this.cleanQuery(query),
      expandedQuery: await this.expandQuery(query),
      embedding: await this.embeddingService.generateEmbedding(query),
      intent: await this.detectIntent(query),
      entities: await this.extractEntities(query)
    };
  }
  
  private cleanQuery(query: string): string {
    // Remove stop words, normalize text
  }
  
  private async expandQuery(query: string): Promise<string> {
    // Use AI to expand query with synonyms and related terms
  }
}
```

## Context Integration

### AI Integration
```typescript
interface RAGIntegration {
  enhancePrompt(query: string, context: SearchResult[]): Promise<EnhancedPrompt>;
  formatContext(results: SearchResult[]): string;
  generateResponse(prompt: EnhancedPrompt): Promise<RAGResponse>;
}

interface EnhancedPrompt {
  originalQuery: string;
  context: string;
  systemPrompt: string;
  userPrompt: string;
  metadata: {
    sourceCount: number;
    relevanceScore: number;
    contextTokens: number;
  };
}

interface RAGResponse {
  response: string;
  sources: SourceReference[];
  confidence: number;
  metadata: ResponseMetadata;
}

interface SourceReference {
  documentId: string;
  chunkId: string;
  title: string;
  excerpt: string;
  relevance: number;
}
```

### Context Formatting
```typescript
class ContextFormatter {
  formatForPrompt(results: SearchResult[]): string {
    const contextParts = results.map((result, index) => `
## Source ${index + 1}: ${result.document.title}
${result.content}

---`);
    
    return `
# Retrieved Context

The following information is relevant to the user's query:

${contextParts.join('\n')}

Please use this context to provide accurate, well-sourced responses. Always cite the sources when using information from the context.
`;
  }
  
  formatCitations(sources: SourceReference[]): string {
    return sources.map((source, index) => 
      `[${index + 1}] ${source.title} - ${source.excerpt}`
    ).join('\n');
  }
}
```

## Document Management

### Upload Pipeline
```typescript
class DocumentManager {
  async uploadDocument(file: File, userId: string): Promise<DocumentUploadResult> {
    // 1. Validate file format and size
    this.validateDocument(file);
    
    // 2. Extract text content
    const extracted = await this.processor.extractText(file);
    
    // 3. Create document record
    const document = await this.createDocument(extracted, userId);
    
    // 4. Chunk the content
    const chunks = this.chunker.chunkBySize(extracted.text, 1000, 100);
    
    // 5. Generate embeddings for each chunk
    const embeddings = await this.embeddingService.generateBatchEmbeddings(
      chunks.map(chunk => chunk.content)
    );
    
    // 6. Store chunks with embeddings
    await this.storeChunks(chunks, embeddings, document.id);
    
    return {
      documentId: document.id,
      chunkCount: chunks.length,
      tokenCount: chunks.reduce((sum, chunk) => sum + chunk.metadata.tokenCount, 0)
    };
  }
}
```

### Document Updates
```typescript
interface DocumentUpdateStrategy {
  incremental: 'replace-chunks' | 'merge-chunks' | 'version-control';
  reindexing: 'immediate' | 'batch' | 'scheduled';
  embedding: 'regenerate-all' | 'update-changed' | 'smart-diff';
}

class DocumentUpdater {
  async updateDocument(
    documentId: string, 
    newContent: ExtractedContent,
    strategy: DocumentUpdateStrategy
  ): Promise<UpdateResult> {
    switch (strategy.incremental) {
      case 'replace-chunks':
        return this.replaceAllChunks(documentId, newContent);
      case 'merge-chunks':
        return this.mergeWithExisting(documentId, newContent);
      case 'version-control':
        return this.createNewVersion(documentId, newContent);
    }
  }
}
```

## Query Expansion

### Semantic Enhancement
```typescript
class QueryExpansion {
  async expandQuery(query: string): Promise<ExpandedQuery> {
    const expansions = await Promise.all([
      this.getSynonyms(query),
      this.getRelatedTerms(query),
      this.getEntityExpansions(query),
      this.getContextualExpansions(query)
    ]);
    
    return {
      original: query,
      synonyms: expansions[0],
      relatedTerms: expansions[1],
      entities: expansions[2],
      contextual: expansions[3],
      expandedQuery: this.combineExpansions(query, expansions)
    };
  }
  
  private async getSynonyms(query: string): Promise<string[]> {
    // Use AI or external API to find synonyms
  }
  
  private async getRelatedTerms(query: string): Promise<string[]> {
    // Find semantically related terms
  }
}
```

## Performance Optimization

### Caching Strategy
```typescript
interface RAGCache {
  embeddings: Map<string, number[]>; // Cache query embeddings
  results: Map<string, SearchResult[]>; // Cache search results
  documents: Map<string, ExtractedContent>; // Cache processed documents
}

class CacheManager {
  private embeddingCache = new Map<string, number[]>();
  private resultCache = new Map<string, CachedResult>();
  
  async getCachedEmbedding(text: string): Promise<number[] | null> {
    return this.embeddingCache.get(this.hashText(text)) || null;
  }
  
  setCachedEmbedding(text: string, embedding: number[]): void {
    this.embeddingCache.set(this.hashText(text), embedding);
  }
}
```

### Index Optimization
```sql
-- Optimize vector index for query performance
CREATE INDEX CONCURRENTLY idx_rag_chunks_embedding_hnsw 
ON rag_chunks USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

-- Partial index for active documents
CREATE INDEX idx_rag_documents_active 
ON rag_documents(user_id, created_at) 
WHERE deleted_at IS NULL;

-- Composite index for filtered searches
CREATE INDEX idx_rag_chunks_metadata 
ON rag_chunks USING gin (metadata);
```

## Monitoring and Analytics

### RAG Metrics
```typescript
interface RAGMetrics {
  searchLatency: number[];
  embeddingLatency: number[];
  retrievalAccuracy: number[];
  contextRelevance: number[];
  userSatisfaction: number[];
  documentCoverage: number;
}

class RAGAnalytics {
  async trackSearch(query: string, results: SearchResult[], userFeedback?: number): Promise<void> {
    // Track search performance and relevance
  }
  
  async analyzeDocumentUsage(): Promise<DocumentUsageStats> {
    // Analyze which documents are most/least used
  }
  
  async optimizeIndex(): Promise<IndexOptimization> {
    // Suggest index improvements based on query patterns
  }
}
```

## Acceptance Criteria

### Core Functionality
- [ ] Document upload and processing works for all supported formats
- [ ] Text chunking produces appropriate segment sizes
- [ ] Embeddings are generated and stored correctly
- [ ] Semantic search returns relevant results within 200ms
- [ ] AI responses integrate retrieved context seamlessly
- [ ] Source citations are accurate and properly formatted

### Performance
- [ ] Document processing completes within 500ms per document
- [ ] Vector search returns results within 200ms
- [ ] Embedding generation under 100ms per chunk
- [ ] Index operations don't block search queries
- [ ] Cache hit rate > 80% for repeated queries

### Accuracy
- [ ] Semantic search precision > 85% for relevant queries
- [ ] Chunk overlap prevents information loss
- [ ] Context ranking improves response quality
- [ ] Source attribution is accurate and complete

### Scalability
- [ ] System handles 10,000+ documents efficiently
- [ ] Concurrent searches don't degrade performance
- [ ] Memory usage remains stable during bulk operations
- [ ] Database queries scale with document growth

## Dependencies

### Core Libraries
```json
{
  "@supabase/supabase-js": "^2.39.0",
  "drizzle-orm": "^0.33.0",
  "postgres": "^3.4.3",
  "ai": "^3.4.0",
  "@ai-sdk/openai": "^1.0.0"
}
```

### Document Processing
```json
{
  "pdf-parse": "^1.1.1",
  "mammoth": "^1.6.0",
  "cheerio": "^1.0.0-rc.12",
  "turndown": "^7.1.2"
}
```

### Text Processing
```json
{
  "natural": "^6.0.0",
  "stopwords": "^2.0.0",
  "compromise": "^14.0.0"
}
```

## Security Considerations

### Access Control
- Document-level permissions per user
- Row-level security in Supabase
- API key protection for embedding services
- Input validation and sanitization

### Data Privacy
- User data isolation in vector database
- Secure embedding generation
- No sensitive data in embeddings
- GDPR compliance for document deletion