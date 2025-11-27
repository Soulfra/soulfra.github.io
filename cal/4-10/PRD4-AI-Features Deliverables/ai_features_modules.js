// ==========================================
// AI FEATURES MODULAR IMPLEMENTATION
// Break into independent modules that can be scripted together
// ==========================================

// ==========================================
// MODULE 1: Core AI Infrastructure
// ==========================================

// ai-core.js - Foundation module
class AICoreModule {
  constructor(db, providerManager) {
    this.db = db;
    this.providers = providerManager;
    this.cache = new Map(); // Simple in-memory cache
    this.init();
  }
  
  init() {
    // Extend existing schema without breaking anything
    this.setupSchema();
  }
  
  setupSchema() {
    try {
      // Add AI columns to existing documents table
      this.db.exec(`
        ALTER TABLE documents ADD COLUMN ai_category TEXT;
        ALTER TABLE documents ADD COLUMN ai_summary TEXT;
        ALTER TABLE documents ADD COLUMN ai_tags TEXT; -- JSON string
        ALTER TABLE documents ADD COLUMN ai_processed_at TIMESTAMP;
      `);
    } catch (e) {
      // Columns might already exist - that's fine
    }
    
    // Simple embeddings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS document_embeddings (
        document_id TEXT PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
        embedding BLOB,
        model TEXT DEFAULT 'text-embedding-ada-002',
        dimension INTEGER DEFAULT 1536,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_embeddings_created ON document_embeddings(created_at);
    `);
  }
  
  // Core embedding functionality
  async embed(text, model = 'text-embedding-ada-002') {
    const cacheKey = `embed:${model}:${text.substring(0, 100)}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      // Use existing provider routing
      const response = await this.providers.route({
        type: 'embedding',
        input: text,
        model: model,
        trustLevel: 50 // Standard tier
      });
      
      this.cache.set(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Embedding failed:', error);
      throw error;
    }
  }
  
  // Vector similarity calculation
  cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
  
  // Serialize vector for SQLite storage
  serializeVector(vector) {
    const buffer = Buffer.allocUnsafe(vector.length * 4);
    for (let i = 0; i < vector.length; i++) {
      buffer.writeFloatLE(vector[i], i * 4);
    }
    return buffer;
  }
  
  // Deserialize vector from SQLite
  deserializeVector(buffer) {
    const vector = [];
    for (let i = 0; i < buffer.length; i += 4) {
      vector.push(buffer.readFloatLE(i));
    }
    return vector;
  }
}

// ==========================================
// MODULE 2: Document Embedding Manager
// ==========================================

// ai-embeddings.js - Handles document embeddings
class DocumentEmbeddingModule {
  constructor(aiCore) {
    this.core = aiCore;
    this.db = aiCore.db;
  }
  
  // Embed a single document
  async embedDocument(documentId, forceRefresh = false) {
    console.log(`🔮 Embedding document ${documentId}...`);
    
    // Check if already embedded and fresh
    if (!forceRefresh) {
      const existing = await this.getEmbedding(documentId);
      if (existing) {
        console.log(`✅ Using cached embedding for ${documentId}`);
        return existing;
      }
    }
    
    // Get document content
    const doc = await this.db.get(
      'SELECT id, title, content FROM documents WHERE id = ?',
      documentId
    );
    
    if (!doc || !doc.content) {
      throw new Error(`Document ${documentId} not found or empty`);
    }
    
    // Create text for embedding (title + content)
    const textToEmbed = `${doc.title}\n\n${doc.content}`.substring(0, 8000); // Limit length
    
    // Get embedding
    const embeddingResult = await this.core.embed(textToEmbed);
    
    // Store embedding
    await this.storeEmbedding(documentId, embeddingResult.data[0].embedding);
    
    console.log(`✅ Embedded document ${documentId}`);
    return embeddingResult.data[0].embedding;
  }
  
  // Store embedding in database
  async storeEmbedding(documentId, vector) {
    const serialized = this.core.serializeVector(vector);
    
    await this.db.run(`
      INSERT OR REPLACE INTO document_embeddings 
      (document_id, embedding, dimension, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `, [documentId, serialized, vector.length]);
  }
  
  // Get embedding from database
  async getEmbedding(documentId) {
    const row = await this.db.get(
      'SELECT embedding FROM document_embeddings WHERE document_id = ?',
      documentId
    );
    
    if (!row) return null;
    
    return this.core.deserializeVector(row.embedding);
  }
  
  // Find similar documents
  async findSimilar(documentId, limit = 5, threshold = 0.7) {
    const queryEmbedding = await this.getEmbedding(documentId);
    if (!queryEmbedding) {
      throw new Error(`No embedding found for document ${documentId}`);
    }
    
    return this.findSimilarToVector(queryEmbedding, { 
      limit, 
      threshold,
      excludeId: documentId 
    });
  }
  
  // Find documents similar to a vector
  async findSimilarToVector(queryVector, options = {}) {
    const { limit = 5, threshold = 0.7, excludeId = null } = options;
    
    // Get all embeddings
    let query = `
      SELECT de.document_id, de.embedding, d.title, d.type, d.category, d.created_at
      FROM document_embeddings de
      JOIN documents d ON de.document_id = d.id
    `;
    
    const params = [];
    if (excludeId) {
      query += ' WHERE de.document_id != ?';
      params.push(excludeId);
    }
    
    const rows = await this.db.all(query, params);
    
    // Calculate similarities
    const similarities = [];
    
    for (const row of rows) {
      const docVector = this.core.deserializeVector(row.embedding);
      const similarity = this.core.cosineSimilarity(queryVector, docVector);
      
      if (similarity >= threshold) {
        similarities.push({
          documentId: row.document_id,
          title: row.title,
          type: row.type,
          category: row.category,
          similarity: similarity,
          createdAt: row.created_at
        });
      }
    }
    
    // Sort by similarity and return top results
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, limit);
  }
  
  // Batch embed all documents
  async embedAllDocuments() {
    const documents = await this.db.all('SELECT id FROM documents');
    console.log(`🚀 Embedding ${documents.length} documents...`);
    
    let processed = 0;
    for (const doc of documents) {
      try {
        await this.embedDocument(doc.id);
        processed++;
        
        if (processed % 10 === 0) {
          console.log(`📊 Processed ${processed}/${documents.length} documents`);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Failed to embed ${doc.id}:`, error.message);
      }
    }
    
    console.log(`✅ Embedded ${processed}/${documents.length} documents`);
    return processed;
  }
}

// ==========================================
// MODULE 3: Semantic Search
// ==========================================

// ai-search.js - Semantic search functionality
class SemanticSearchModule {
  constructor(aiCore, embeddingModule) {
    this.core = aiCore;
    this.embeddings = embeddingModule;
    this.db = aiCore.db;
  }
  
  // Main search function
  async search(query, options = {}) {
    const {
      limit = 10,
      threshold = 0.6,
      filters = {},
      enhanceQuery = true
    } = options;
    
    console.log(`🔍 Searching for: "${query}"`);
    
    // Enhance query with AI if requested
    let searchQuery = query;
    if (enhanceQuery) {
      searchQuery = await this.enhanceQuery(query);
      if (searchQuery !== query) {
        console.log(`🔮 Enhanced query: "${searchQuery}"`);
      }
    }
    
    // Get query embedding
    const queryEmbedding = await this.core.embed(searchQuery);
    
    // Find similar documents
    const results = await this.embeddings.findSimilarToVector(
      queryEmbedding.data[0].embedding,
      { limit, threshold }
    );
    
    // Apply additional filters
    const filteredResults = this.applyFilters(results, filters);
    
    // Get document content for results
    const enrichedResults = await this.enrichResults(filteredResults);
    
    return {
      query: query,
      enhancedQuery: searchQuery,
      results: enrichedResults,
      total: enrichedResults.length
    };
  }
  
  // Enhance search query with AI
  async enhanceQuery(query) {
    try {
      const response = await this.core.providers.route({
        type: 'completion',
        messages: [{
          role: 'user',
          content: `Expand this search query with relevant synonyms and related terms. Keep it concise.
                   Original: "${query}"
                   Enhanced:`
        }],
        maxTokens: 50,
        temperature: 0.3,
        trustLevel: 30 // Cheap model is fine
      });
      
      return response.choices[0].message.content.trim();
    } catch (error) {
      console.warn('Query enhancement failed, using original query:', error.message);
      return query;
    }
  }
  
  // Apply additional filters
  applyFilters(results, filters) {
    if (!filters || Object.keys(filters).length === 0) {
      return results;
    }
    
    return results.filter(result => {
      if (filters.type && result.type !== filters.type) return false;
      if (filters.category && result.category !== filters.category) return false;
      if (filters.minSimilarity && result.similarity < filters.minSimilarity) return false;
      
      return true;
    });
  }
  
  // Enrich results with full document data
  async enrichResults(results) {
    const enriched = [];
    
    for (const result of results) {
      const doc = await this.db.get(`
        SELECT id, title, content, type, category, created_at, updated_at
        FROM documents 
        WHERE id = ?
      `, result.documentId);
      
      if (doc) {
        enriched.push({
          ...result,
          content: doc.content,
          preview: this.createPreview(doc.content),
          updatedAt: doc.updated_at
        });
      }
    }
    
    return enriched;
  }
  
  // Create content preview
  createPreview(content, maxLength = 200) {
    if (!content) return '';
    
    const cleaned = content
      .replace(/#{1,6}\s/g, '') // Remove markdown headers
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.+?)\*/g, '$1') // Remove italic markdown
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
    
    if (cleaned.length <= maxLength) return cleaned;
    
    return cleaned.substring(0, maxLength).trim() + '...';
  }
}

// ==========================================
// MODULE 4: Auto Categorization
// ==========================================

// ai-categorizer.js - Document categorization
class AutoCategorizerModule {
  constructor(aiCore) {
    this.core = aiCore;
    this.db = aiCore.db;
    this.categories = ['PRD', 'Config', 'Script', 'Documentation', 'Template', 'Analytics'];
  }
  
  // Categorize a single document
  async categorizeDocument(documentId) {
    console.log(`🏷️ Categorizing document ${documentId}...`);
    
    // Get document
    const doc = await this.db.get(
      'SELECT id, title, content, type FROM documents WHERE id = ?',
      documentId
    );
    
    if (!doc) {
      throw new Error(`Document ${documentId} not found`);
    }
    
    // Create categorization prompt
    const prompt = `Analyze this document and categorize it as one of: ${this.categories.join(', ')}.
    
Document Title: ${doc.title}
Document Type: ${doc.type || 'unknown'}
Content: ${doc.content.substring(0, 1000)}...

Respond with just the category name and a confidence score (0-100):
Format: CATEGORY|CONFIDENCE`;
    
    try {
      const response = await this.core.providers.route({
        type: 'completion',
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 20,
        temperature: 0.1,
        trustLevel: 30 // Cheap model is fine
      });
      
      const result = response.choices[0].message.content.trim();
      const [category, confidence] = result.split('|');
      
      // Validate category
      const validCategory = this.categories.includes(category) ? category : 'Documentation';
      const validConfidence = parseInt(confidence) || 50;
      
      // Store result
      await this.storeCategorization(documentId, validCategory, validConfidence);
      
      console.log(`✅ Categorized ${documentId} as ${validCategory} (${validConfidence}% confidence)`);
      
      return {
        category: validCategory,
        confidence: validConfidence,
        documentId
      };
      
    } catch (error) {
      console.error(`❌ Categorization failed for ${documentId}:`, error.message);
      
      // Fallback categorization based on content
      const fallbackCategory = this.fallbackCategorize(doc);
      await this.storeCategorization(documentId, fallbackCategory, 30);
      
      return {
        category: fallbackCategory,
        confidence: 30,
        documentId
      };
    }
  }
  
  // Store categorization result
  async storeCategorization(documentId, category, confidence) {
    await this.db.run(`
      UPDATE documents 
      SET ai_category = ?, ai_processed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [category, documentId]);
  }
  
  // Fallback categorization using simple heuristics
  fallbackCategorize(doc) {
    const content = (doc.title + ' ' + doc.content).toLowerCase();
    
    if (content.includes('prd') || content.includes('requirements')) return 'PRD';
    if (content.includes('config') || content.includes('setting')) return 'Config';
    if (content.includes('script') || content.includes('#!/bin')) return 'Script';
    if (content.includes('template')) return 'Template';
    if (content.includes('analytics') || content.includes('metrics')) return 'Analytics';
    
    return 'Documentation';
  }
  
  // Batch categorize all documents
  async categorizeAllDocuments() {
    const documents = await this.db.all(`
      SELECT id FROM documents 
      WHERE ai_category IS NULL OR ai_processed_at IS NULL
    `);
    
    console.log(`🚀 Categorizing ${documents.length} documents...`);
    
    let processed = 0;
    const results = [];
    
    for (const doc of documents) {
      try {
        const result = await this.categorizeDocument(doc.id);
        results.push(result);
        processed++;
        
        if (processed % 5 === 0) {
          console.log(`📊 Processed ${processed}/${documents.length} documents`);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`❌ Failed to categorize ${doc.id}:`, error.message);
      }
    }
    
    console.log(`✅ Categorized ${processed}/${documents.length} documents`);
    return results;
  }
  
  // Get category statistics
  async getCategoryStats() {
    const stats = await this.db.all(`
      SELECT ai_category, COUNT(*) as count
      FROM documents 
      WHERE ai_category IS NOT NULL
      GROUP BY ai_category
      ORDER BY count DESC
    `);
    
    return stats;
  }
}

// ==========================================
// MODULE 5: Document Summarization
// ==========================================

// ai-summarizer.js - Document summarization
class DocumentSummarizerModule {
  constructor(aiCore) {
    this.core = aiCore;
    this.db = aiCore.db;
    this.summaryTypes = {
      brief: { maxTokens: 100, style: 'concise overview' },
      detailed: { maxTokens: 300, style: 'comprehensive summary' },
      bullets: { maxTokens: 200, style: 'bullet points' }
    };
  }
  
  // Summarize a document
  async summarizeDocument(documentId, type = 'brief') {
    console.log(`📝 Summarizing document ${documentId} (${type})...`);
    
    const doc = await this.db.get(
      'SELECT id, title, content FROM documents WHERE id = ?',
      documentId
    );
    
    if (!doc) {
      throw new Error(`Document ${documentId} not found`);
    }
    
    const config = this.summaryTypes[type] || this.summaryTypes.brief;
    
    // Build prompt based on type
    let prompt;
    if (type === 'bullets') {
      prompt = `Create a bullet-point summary of this document:

Title: ${doc.title}
Content: ${doc.content}

Summary (bullet points):
•`;
    } else {
      prompt = `Create a ${config.style} of this document:

Title: ${doc.title}  
Content: ${doc.content}

Summary:`;
    }
    
    try {
      const response = await this.core.providers.route({
        type: 'completion',
        messages: [{ role: 'user', content: prompt }],
        maxTokens: config.maxTokens,
        temperature: 0.3,
        trustLevel: 50 // Standard quality
      });
      
      const summary = response.choices[0].message.content.trim();
      
      // Store summary
      await this.storeSummary(documentId, summary);
      
      console.log(`✅ Summarized document ${documentId}`);
      
      return {
        documentId,
        type,
        summary,
        generatedAt: new Date()
      };
      
    } catch (error) {
      console.error(`❌ Summarization failed for ${documentId}:`, error.message);
      throw error;
    }
  }
  
  // Store summary in database
  async storeSummary(documentId, summary) {
    await this.db.run(`
      UPDATE documents 
      SET ai_summary = ?, ai_processed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [summary, documentId]);
  }
  
  // Get existing summary
  async getSummary(documentId) {
    const row = await this.db.get(
      'SELECT ai_summary FROM documents WHERE id = ?',
      documentId
    );
    
    return row ? row.ai_summary : null;
  }
  
  // Batch summarize documents
  async summarizeAllDocuments(type = 'brief') {
    const documents = await this.db.all(`
      SELECT id FROM documents 
      WHERE ai_summary IS NULL
    `);
    
    console.log(`🚀 Summarizing ${documents.length} documents...`);
    
    let processed = 0;
    const results = [];
    
    for (const doc of documents) {
      try {
        const result = await this.summarizeDocument(doc.id, type);
        results.push(result);
        processed++;
        
        if (processed % 3 === 0) {
          console.log(`📊 Processed ${processed}/${documents.length} documents`);
        }
        
        // Rate limiting for summarization (more expensive)
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Failed to summarize ${doc.id}:`, error.message);
      }
    }
    
    console.log(`✅ Summarized ${processed}/${documents.length} documents`);
    return results;
  }
}

// ==========================================
// MODULE 6: Master Controller
// ==========================================

// ai-features.js - Main controller that orchestrates all modules
class AIFeaturesController {
  constructor(db, providerManager) {
    // Initialize core
    this.core = new AICoreModule(db, providerManager);
    
    // Initialize modules
    this.embeddings = new DocumentEmbeddingModule(this.core);
    this.search = new SemanticSearchModule(this.core, this.embeddings);
    this.categorizer = new AutoCategorizerModule(this.core);
    this.summarizer = new DocumentSummarizerModule(this.core);
    
    this.db = db;
    console.log('🤖 AI Features initialized with all modules');
  }
  
  // Process a new document with all AI features
  async processDocument(documentId, features = ['embed', 'categorize', 'summarize']) {
    console.log(`🚀 Processing document ${documentId} with features: ${features.join(', ')}`);
    
    const results = {};
    
    try {
      // Process features in order
      if (features.includes('embed')) {
        await this.embeddings.embedDocument(documentId);
        results.embedded = true;
      }
      
      if (features.includes('categorize')) {
        results.categorization = await this.categorizer.categorizeDocument(documentId);
      }
      
      if (features.includes('summarize')) {
        results.summary = await this.summarizer.summarizeDocument(documentId);
      }
      
      console.log(`✅ Processed document ${documentId} successfully`);
      return results;
      
    } catch (error) {
      console.error(`❌ Failed to process document ${documentId}:`, error.message);
      throw error;
    }
  }
  
  // Get AI info for a document
  async getDocumentAI(documentId) {
    const doc = await this.db.get(`
      SELECT id, title, ai_category, ai_summary, ai_tags, ai_processed_at
      FROM documents WHERE id = ?
    `, documentId);
    
    if (!doc) return null;
    
    // Get related documents
    const related = await this.embeddings.findSimilar(documentId, 3, 0.7);
    
    return {
      documentId: doc.id,
      title: doc.title,
      category: doc.ai_category,
      summary: doc.ai_summary,
      tags: doc.ai_tags ? JSON.parse(doc.ai_tags) : [],
      processedAt: doc.ai_processed_at,
      related: related
    };
  }
  
  // Batch process all documents
  async processAllDocuments() {
    console.log('🚀 Starting batch processing of all documents...');
    
    const results = {
      embedded: 0,
      categorized: 0,
      summarized: 0,
      errors: []
    };
    
    try {
      // Step 1: Embed all documents
      console.log('📊 Step 1: Embedding documents...');
      results.embedded = await this.embeddings.embedAllDocuments();
      
      // Step 2: Categorize all documents
      console.log('🏷️ Step 2: Categorizing documents...');
      const categories = await this.categorizer.categorizeAllDocuments();
      results.categorized = categories.length;
      
      // Step 3: Summarize all documents
      console.log('📝 Step 3: Summarizing documents...');
      const summaries = await this.summarizer.summarizeAllDocuments();
      results.summarized = summaries.length;
      
      console.log('✅ Batch processing complete!', results);
      return results;
      
    } catch (error) {
      console.error('❌ Batch processing failed:', error);
      results.errors.push(error.message);
      return results;
    }
  }
  
  // Health check for all modules
  async healthCheck() {
    const health = {
      status: 'healthy',
      modules: {},
      stats: {}
    };
    
    try {
      // Check database
      const docCount = await this.db.get('SELECT COUNT(*) as count FROM documents');
      health.stats.totalDocuments = docCount.count;
      
      // Check embeddings
      const embeddedCount = await this.db.get('SELECT COUNT(*) as count FROM document_embeddings');
      health.stats.embeddedDocuments = embeddedCount.count;
      health.modules.embeddings = 'healthy';
      
      // Check categorizations
      const categorizedCount = await this.db.get('SELECT COUNT(*) as count FROM documents WHERE ai_category IS NOT NULL');
      health.stats.categorizedDocuments = categorizedCount.count;
      health.modules.categorizer = 'healthy';
      
      // Check summaries
      const summarizedCount = await this.db.get('SELECT COUNT(*) as count FROM documents WHERE ai_summary IS NOT NULL');
      health.stats.summarizedDocuments = summarizedCount.count;
      health.modules.summarizer = 'healthy';
      
      // Calculate coverage
      health.stats.embeddingCoverage = docCount.count > 0 ? Math.round((embeddedCount.count / docCount.count) * 100) : 0;
      health.stats.categorizationCoverage = docCount.count > 0 ? Math.round((categorizedCount.count / docCount.count) * 100) : 0;
      health.stats.summarizationCoverage = docCount.count > 0 ? Math.round((summarizedCount.count / docCount.count) * 100) : 0;
      
    } catch (error) {
      health.status = 'unhealthy';
      health.error = error.message;
    }
    
    return health;
  }
}

module.exports = {
  AICoreModule,
  DocumentEmbeddingModule,
  SemanticSearchModule,
  AutoCategorizerModule,
  DocumentSummarizerModule,
  AIFeaturesController
};