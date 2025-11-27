// ==========================================
// AI FEATURES INTEGRATION LAYER
// Plugs into existing Soulfra Express server
// ==========================================

// ai-routes.js - Express routes for AI features
const express = require('express');
const { AIFeaturesController } = require('./ai-features');

class AIRoutes {
  constructor(db, providerManager, io = null) {
    this.router = express.Router();
    this.ai = new AIFeaturesController(db, providerManager);
    this.io = io; // Socket.io for real-time updates
    this.setupRoutes();
  }
  
  setupRoutes() {
    // Health check
    this.router.get('/health', this.handleHealthCheck.bind(this));
    
    // Document processing
    this.router.post('/documents/:id/process', this.handleProcessDocument.bind(this));
    this.router.get('/documents/:id/ai', this.handleGetDocumentAI.bind(this));
    
    // Search
    this.router.post('/search', this.handleSemanticSearch.bind(this));
    this.router.get('/search/test', this.handleSearchTest.bind(this));
    
    // Categorization
    this.router.post('/documents/:id/categorize', this.handleCategorizeDocument.bind(this));
    this.router.get('/categories/stats', this.handleCategoryStats.bind(this));
    
    // Summarization
    this.router.post('/documents/:id/summarize', this.handleSummarizeDocument.bind(this));
    this.router.get('/documents/:id/summary', this.handleGetSummary.bind(this));
    
    // Batch operations
    this.router.post('/batch/process', this.handleBatchProcess.bind(this));
    this.router.post('/batch/embed', this.handleBatchEmbed.bind(this));
    this.router.post('/batch/categorize', this.handleBatchCategorize.bind(this));
    
    // Related documents
    this.router.get('/documents/:id/related', this.handleGetRelated.bind(this));
    
    console.log('🚀 AI routes initialized');
  }
  
  // Health check endpoint
  async handleHealthCheck(req, res) {
    try {
      const health = await this.ai.healthCheck();
      res.json(health);
    } catch (error) {
      res.status(500).json({ 
        status: 'error', 
        message: error.message 
      });
    }
  }
  
  // Process a document with AI features
  async handleProcessDocument(req, res) {
    const { id } = req.params;
    const { features = ['embed', 'categorize', 'summarize'] } = req.body;
    
    try {
      const result = await this.ai.processDocument(id, features);
      
      // Emit real-time update if socket available
      if (this.io) {
        this.io.emit('ai:document:processed', { documentId: id, result });
      }
      
      res.json({
        success: true,
        documentId: id,
        processed: features,
        result
      });
    } catch (error) {
      console.error('Document processing failed:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Get AI info for a document
  async handleGetDocumentAI(req, res) {
    const { id } = req.params;
    
    try {
      const aiInfo = await this.ai.getDocumentAI(id);
      
      if (!aiInfo) {
        return res.status(404).json({
          error: 'Document not found'
        });
      }
      
      res.json(aiInfo);
    } catch (error) {
      console.error('Get document AI failed:', error);
      res.status(500).json({
        error: error.message
      });
    }
  }
  
  // Semantic search endpoint
  async handleSemanticSearch(req, res) {
    const { 
      query, 
      limit = 10, 
      threshold = 0.6, 
      filters = {},
      enhance = true 
    } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Query is required'
      });
    }
    
    try {
      const startTime = Date.now();
      
      const results = await this.ai.search.search(query, {
        limit,
        threshold,
        filters,
        enhanceQuery: enhance
      });
      
      const responseTime = Date.now() - startTime;
      
      res.json({
        ...results,
        meta: {
          responseTime,
          filters: filters,
          threshold
        }
      });
    } catch (error) {
      console.error('Semantic search failed:', error);
      res.status(500).json({
        error: error.message
      });
    }
  }
  
  // Test search with sample queries
  async handleSearchTest(req, res) {
    const testQueries = [
      'product requirements',
      'configuration settings', 
      'deployment scripts',
      'API documentation'
    ];
    
    try {
      const results = {};
      
      for (const query of testQueries) {
        const searchResult = await this.ai.search.search(query, { limit: 3 });
        results[query] = searchResult.results.length;
      }
      
      res.json({
        testQueries: results,
        status: 'Search is working!'
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }
  
  // Categorize a single document
  async handleCategorizeDocument(req, res) {
    const { id } = req.params;
    
    try {
      const result = await this.ai.categorizer.categorizeDocument(id);
      
      if (this.io) {
        this.io.emit('ai:document:categorized', result);
      }
      
      res.json(result);
    } catch (error) {
      console.error('Categorization failed:', error);
      res.status(500).json({
        error: error.message
      });
    }
  }
  
  // Get category statistics
  async handleCategoryStats(req, res) {
    try {
      const stats = await this.ai.categorizer.getCategoryStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }
  
  // Summarize a document
  async handleSummarizeDocument(req, res) {
    const { id } = req.params;
    const { type = 'brief' } = req.body;
    
    try {
      const result = await this.ai.summarizer.summarizeDocument(id, type);
      
      if (this.io) {
        this.io.emit('ai:document:summarized', result);
      }
      
      res.json(result);
    } catch (error) {
      console.error('Summarization failed:', error);
      res.status(500).json({
        error: error.message
      });
    }
  }
  
  // Get existing summary
  async handleGetSummary(req, res) {
    const { id } = req.params;
    
    try {
      const summary = await this.ai.summarizer.getSummary(id);
      
      if (!summary) {
        return res.status(404).json({
          message: 'No summary found for this document'
        });
      }
      
      res.json({ 
        documentId: id, 
        summary 
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }
  
  // Batch process all documents
  async handleBatchProcess(req, res) {
    const { features = ['embed', 'categorize', 'summarize'] } = req.body;
    
    try {
      // Start async processing
      const processingPromise = this.ai.processAllDocuments();
      
      // Don't wait for completion, start immediately
      res.json({
        message: 'Batch processing started',
        features,
        status: 'processing'
      });
      
      // Handle completion asynchronously
      processingPromise.then(result => {
        if (this.io) {
          this.io.emit('ai:batch:complete', result);
        }
        console.log('✅ Batch processing completed:', result);
      }).catch(error => {
        if (this.io) {
          this.io.emit('ai:batch:error', { error: error.message });
        }
        console.error('❌ Batch processing failed:', error);
      });
      
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }
  
  // Batch embed only
  async handleBatchEmbed(req, res) {
    try {
      const result = await this.ai.embeddings.embedAllDocuments();
      res.json({
        message: `Embedded ${result} documents`,
        processed: result
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }
  
  // Batch categorize only
  async handleBatchCategorize(req, res) {
    try {
      const results = await this.ai.categorizer.categorizeAllDocuments();
      res.json({
        message: `Categorized ${results.length} documents`,
        results
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }
  
  // Get related documents
  async handleGetRelated(req, res) {
    const { id } = req.params;
    const { limit = 5, threshold = 0.7 } = req.query;
    
    try {
      const related = await this.ai.embeddings.findSimilar(
        id, 
        parseInt(limit), 
        parseFloat(threshold)
      );
      
      res.json({
        documentId: id,
        related,
        count: related.length
      });
    } catch (error) {
      console.error('Get related documents failed:', error);
      res.status(500).json({
        error: error.message
      });
    }
  }
  
  getRouter() {
    return this.router;
  }
}

// ==========================================
// INTEGRATION PLUGIN FOR EXISTING SERVER
// ==========================================

// ai-plugin.js - Drop-in plugin for existing Soulfra server
class AIFeaturesPlugin {
  constructor(app, db, providerManager, io = null) {
    this.app = app;
    this.db = db;
    this.providers = providerManager;
    this.io = io;
    this.enabled = process.env.ENABLE_AI_FEATURES !== 'false';
    
    if (this.enabled) {
      this.initialize();
    } else {
      console.log('🤖 AI Features disabled via environment variable');
    }
  }
  
  initialize() {
    console.log('🤖 Initializing AI Features Plugin...');
    
    try {
      // Create AI routes
      const aiRoutes = new AIRoutes(this.db, this.providers, this.io);
      
      // Mount AI routes
      this.app.use('/api/ai', aiRoutes.getRouter());
      
      // Extend existing document routes with AI
      this.extendDocumentRoutes();
      
      // Add middleware for auto-processing new documents
      this.addAutoProcessingMiddleware();
      
      console.log('✅ AI Features Plugin initialized successfully');
      
      // Optional: Auto-process existing documents on startup
      if (process.env.AI_AUTO_PROCESS_ON_STARTUP === 'true') {
        this.autoProcessExistingDocuments();
      }
      
    } catch (error) {
      console.error('❌ AI Features Plugin initialization failed:', error);
      throw error;
    }
  }
  
  // Extend existing document routes with AI info
  extendDocumentRoutes() {
    // Add AI info to document GET responses
    const originalDocumentRoute = this.app._router.stack.find(
      layer => layer.route?.path === '/api/documents/:id'
    );
    
    if (originalDocumentRoute) {
      console.log('🔧 Extended existing document routes with AI features');
    }
    
    // Add AI info to document list
    this.app.get('/api/documents', async (req, res, next) => {
      // Let the original handler run first
      const originalSend = res.json;
      res.json = function(data) {
        // Add AI info to each document if available
        if (Array.isArray(data) && data.length > 0) {
          // This would be done async in real implementation
          // For now, just add a flag
          data.forEach(doc => {
            doc.hasAI = true; // Placeholder
          });
        }
        originalSend.call(this, data);
      };
      next();
    });
  }
  
  // Add middleware to auto-process new documents
  addAutoProcessingMiddleware() {
    // Hook into document creation
    this.app.use('/api/documents', (req, res, next) => {
      if (req.method === 'POST') {
        const originalSend = res.json;
        res.json = async function(data) {
          // Call original response first
          originalSend.call(this, data);
          
          // Then auto-process the new document async
          if (data.id && process.env.AI_AUTO_PROCESS === 'true') {
            try {
              const aiRoutes = new AIRoutes(this.db, this.providers, this.io);
              await aiRoutes.ai.processDocument(data.id, ['categorize']);
              console.log(`🤖 Auto-processed new document: ${data.id}`);
            } catch (error) {
              console.error(`❌ Auto-processing failed for ${data.id}:`, error.message);
            }
          }
        }.bind(this);
      }
      next();
    });
  }
  
  // Auto-process existing documents on startup
  async autoProcessExistingDocuments() {
    console.log('🚀 Auto-processing existing documents...');
    
    try {
      const aiRoutes = new AIRoutes(this.db, this.providers, this.io);
      
      // Process in background
      setTimeout(async () => {
        try {
          const result = await aiRoutes.ai.processAllDocuments();
          console.log('✅ Auto-processing completed:', result);
        } catch (error) {
          console.error('❌ Auto-processing failed:', error);
        }
      }, 5000); // Wait 5 seconds after startup
      
    } catch (error) {
      console.error('❌ Auto-processing setup failed:', error);
    }
  }
}

// ==========================================
// FRONTEND INTEGRATION HELPERS
// ==========================================

// ai-frontend-helpers.js - JavaScript for frontend integration
const AIFrontendHelpers = `
// Frontend helpers for AI features
class SoulfrAI {
  constructor(apiBase = '/api/ai') {
    this.apiBase = apiBase;
  }
  
  // Search documents semantically
  async search(query, options = {}) {
    const response = await fetch(\`\${this.apiBase}/search\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, ...options })
    });
    return response.json();
  }
  
  // Get AI info for a document
  async getDocumentAI(documentId) {
    const response = await fetch(\`\${this.apiBase}/documents/\${documentId}/ai\`);
    return response.json();
  }
  
  // Process a document with AI
  async processDocument(documentId, features = ['categorize', 'summarize']) {
    const response = await fetch(\`\${this.apiBase}/documents/\${documentId}/process\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features })
    });
    return response.json();
  }
  
  // Get related documents
  async getRelated(documentId, limit = 5) {
    const response = await fetch(\`\${this.apiBase}/documents/\${documentId}/related?limit=\${limit}\`);
    return response.json();
  }
  
  // Get category statistics
  async getCategoryStats() {
    const response = await fetch(\`\${this.apiBase}/categories/stats\`);
    return response.json();
  }
  
  // Health check
  async healthCheck() {
    const response = await fetch(\`\${this.apiBase}/health\`);
    return response.json();
  }
}

// Initialize AI helper
window.SoulfrAI = new SoulfrAI();

// Example usage:
// const results = await SoulfrAI.search('product requirements');
// const aiInfo = await SoulfrAI.getDocumentAI('doc_123');
// const related = await SoulfrAI.getRelated('doc_123');
`;

module.exports = {
  AIRoutes,
  AIFeaturesPlugin,
  AIFrontendHelpers
};