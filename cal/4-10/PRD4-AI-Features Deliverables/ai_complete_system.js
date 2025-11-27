// ==========================================
// COMPLETE AI SYSTEM - ALL MODULES INTEGRATED
// This is the "nuclear option" - full PRD + advanced features
// ==========================================

// ai-complete-system.js - Master orchestrator for all AI features
class CompleteAISystem {
  constructor(db, providerManager, io = null) {
    this.db = db;
    this.providers = providerManager;
    this.io = io;
    
    // Initialize all modules
    this.initializeModules();
    this.setupAdvancedRoutes();
    this.startBackgroundServices();
    
    console.log('🤖 Complete AI System initialized with ALL features');
  }
  
  initializeModules() {
    // Core modules (from previous artifacts)
    const { AIFeaturesController } = require('./ai-features');
    this.core = new AIFeaturesController(this.db, this.providers);
    
    // Advanced modules
    const { KnowledgeGraphModule, WritingAssistantModule, BackgroundJobQueue } = require('./ai-advanced-modules');
    
    this.knowledgeGraph = new KnowledgeGraphModule(this.core.core, this.core.embeddings);
    this.writingAssistant = new WritingAssistantModule(this.core.core);
    this.jobQueue = new BackgroundJobQueue(this.core.core);
    
    // Advanced features
    this.analytics = new DocumentAnalyticsModule(this.core.core);
    this.recommendations = new SmartRecommendationModule(this.core.core, this.core.embeddings);
    this.collaboration = new AICollaborationModule(this.core.core, this.io);
  }
  
  // Process document with ALL AI features
  async processDocumentComplete(documentId, options = {}) {
    const {
      features = ['embed', 'categorize', 'summarize', 'entities', 'insights'],
      priority = 'normal',
      background = true
    } = options;
    
    console.log(`🚀 Complete processing for document ${documentId}`);
    
    if (background) {
      // Queue for background processing
      const jobs = [];
      
      // Core features
      if (features.includes('embed')) {
        jobs.push(await this.jobQueue.queueJob('process_embed', { documentId }, 90));
      }
      if (features.includes('categorize')) {
        jobs.push(await this.jobQueue.queueJob('process_categorize', { documentId }, 85));
      }
      if (features.includes('summarize')) {
        jobs.push(await this.jobQueue.queueJob('process_summarize', { documentId }, 80));
      }
      
      // Advanced features
      if (features.includes('entities') || features.includes('insights')) {
        jobs.push(await this.jobQueue.queueKnowledgeGraphUpdate(documentId));
      }
      
      return { jobIds: jobs, status: 'queued' };
      
    } else {
      // Process immediately
      const results = {};
      
      // Core processing
      if (features.includes('embed')) {
        results.embedding = await this.core.embeddings.embedDocument(documentId);
      }
      if (features.includes('categorize')) {
        results.categorization = await this.core.categorizer.categorizeDocument(documentId);
      }
      if (features.includes('summarize')) {
        results.summary = await this.core.summarizer.summarizeDocument(documentId);
      }
      
      // Advanced processing
      if (features.includes('entities')) {
        results.entities = await this.knowledgeGraph.extractEntities(documentId);
        results.relationships = await this.knowledgeGraph.findRelationships(documentId);
      }
      if (features.includes('insights')) {
        results.insights = await this.knowledgeGraph.analyzeDocument(documentId);
      }
      
      return results;
    }
  }
  
  // Advanced search with multiple techniques
  async advancedSearch(query, options = {}) {
    const {
      methods = ['semantic', 'keyword', 'entity'],
      limit = 15,
      threshold = 0.6,
      boost = {},
      filters = {}
    } = options;
    
    const results = [];
    const seenDocs = new Set();
    
    // 1. Semantic search
    if (methods.includes('semantic')) {
      const semanticResults = await this.core.search.search(query, {
        limit: limit * 2,
        threshold,
        filters
      });
      
      semanticResults.results.forEach(result => {
        if (!seenDocs.has(result.documentId)) {
          results.push({
            ...result,
            searchMethod: 'semantic',
            score: result.similarity,
            boostedScore: result.similarity * (boost.semantic || 1.0)
          });
          seenDocs.add(result.documentId);
        }
      });
    }
    
    // 2. Entity-based search
    if (methods.includes('entity')) {
      const entityResults = await this.searchByEntities(query, filters, limit);
      
      entityResults.forEach(result => {
        if (!seenDocs.has(result.documentId)) {
          results.push({
            ...result,
            searchMethod: 'entity',
            boostedScore: result.score * (boost.entity || 0.8)
          });
          seenDocs.add(result.documentId);
        }
      });
    }
    
    // 3. Traditional keyword search
    if (methods.includes('keyword')) {
      const keywordResults = await this.keywordSearch(query, filters, limit);
      
      keywordResults.forEach(result => {
        if (!seenDocs.has(result.id)) {
          results.push({
            documentId: result.id,
            title: result.title,
            content: result.content,
            searchMethod: 'keyword',
            score: 1.0,
            boostedScore: 1.0 * (boost.keyword || 0.9)
          });
          seenDocs.add(result.id);
        }
      });
    }
    
    // Sort by boosted score and apply final limit
    results.sort((a, b) => b.boostedScore - a.boostedScore);
    
    return {
      query,
      results: results.slice(0, limit),
      meta: {
        totalFound: results.length,
        methods: methods,
        searchTime: Date.now()
      }
    };
  }
  
  // Search by knowledge graph entities
  async searchByEntities(query, filters, limit) {
    // Find entities that match the query
    const entities = await this.db.all(`
      SELECT * FROM knowledge_entities 
      WHERE entity_value LIKE ? OR entity_value LIKE ?
      ORDER BY importance_score DESC, frequency DESC
      LIMIT 10
    `, [`%${query}%`, `%${query.toLowerCase()}%`]);
    
    const results = [];
    
    for (const entity of entities) {
      const docIds = JSON.parse(entity.document_ids || '[]');
      
      for (const docId of docIds) {
        const doc = await this.db.get(
          'SELECT id, title, content, type, category FROM documents WHERE id = ?',
          docId
        );
        
        if (doc) {
          results.push({
            documentId: doc.id,
            title: doc.title,
            content: doc.content,
            type: doc.type,
            category: doc.category,
            score: entity.importance_score,
            entityMatch: entity.entity_value
          });
        }
      }
    }
    
    return results.slice(0, limit);
  }
  
  // Traditional keyword search
  async keywordSearch(query, filters, limit) {
    let sql = `
      SELECT id, title, content, type, category 
      FROM documents 
      WHERE (title LIKE ? OR content LIKE ?)
    `;
    const params = [`%${query}%`, `%${query}%`];
    
    if (filters.type) {
      sql += ' AND type = ?';
      params.push(filters.type);
    }
    if (filters.category) {
      sql += ' AND category = ?';
      params.push(filters.category);
    }
    
    sql += ' ORDER BY (CASE WHEN title LIKE ? THEN 1 ELSE 0 END) DESC, id LIMIT ?';
    params.push(`%${query}%`, limit);
    
    return this.db.all(sql, params);
  }
  
  // Get comprehensive document info
  async getCompleteDocumentInfo(documentId) {
    // Base document info
    const doc = await this.db.get(
      'SELECT * FROM documents WHERE id = ?',
      documentId
    );
    
    if (!doc) return null;
    
    // AI info
    const aiInfo = await this.core.getDocumentAI(documentId);
    
    // Knowledge graph info
    const entities = await this.db.all(`
      SELECT * FROM knowledge_entities 
      WHERE json_extract(document_ids, '$') LIKE '%"' || ? || '"%'
    `, documentId);
    
    const insights = await this.db.get(
      'SELECT * FROM document_insights WHERE document_id = ?',
      documentId
    );
    
    // Analytics
    const analytics = await this.analytics.getDocumentAnalytics(documentId);
    
    // Recommendations
    const recommendations = await this.recommendations.getRecommendations(documentId);
    
    return {
      ...doc,
      ai: aiInfo,
      entities: entities,
      insights: insights ? {
        complexity: insights.complexity_score,
        readability: insights.readability_score,
        effort: insights.estimated_effort,
        techStack: JSON.parse(insights.tech_stack || '[]'),
        concepts: JSON.parse(insights.key_concepts || '[]')
      } : null,
      analytics: analytics,
      recommendations: recommendations
    };
  }
  
  setupAdvancedRoutes() {
    const express = require('express');
    this.router = express.Router();
    
    // Advanced search
    this.router.post('/search/advanced', async (req, res) => {
      try {
        const results = await this.advancedSearch(req.body.query, req.body.options);
        res.json(results);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Complete document processing
    this.router.post('/documents/:id/process/complete', async (req, res) => {
      try {
        const result = await this.processDocumentComplete(req.params.id, req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Complete document info
    this.router.get('/documents/:id/complete', async (req, res) => {
      try {
        const info = await this.getCompleteDocumentInfo(req.params.id);
        if (!info) return res.status(404).json({ error: 'Document not found' });
        res.json(info);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Knowledge graph
    this.router.get('/knowledge/graph', async (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 100;
        const graph = await this.knowledgeGraph.getGraphData(limit);
        res.json(graph);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Writing assistant
    this.router.post('/writing/session', async (req, res) => {
      try {
        const sessionId = await this.writingAssistant.startSession(
          req.body.userId,
          req.body.documentId
        );
        res.json({ sessionId });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    this.router.post('/writing/:sessionId/suggestions', async (req, res) => {
      try {
        const suggestions = await this.writingAssistant.getSuggestions(
          req.params.sessionId,
          req.body.context
        );
        res.json(suggestions);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Job queue management
    this.router.get('/jobs/stats', async (req, res) => {
      try {
        const stats = await this.jobQueue.getQueueStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // System overview
    this.router.get('/system/overview', async (req, res) => {
      try {
        const overview = await this.getSystemOverview();
        res.json(overview);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }
  
  async getSystemOverview() {
    const health = await this.core.healthCheck();
    const queueStats = await this.jobQueue.getQueueStats();
    
    // Knowledge graph stats
    const entityCount = await this.db.get('SELECT COUNT(*) as count FROM knowledge_entities');
    const relationshipCount = await this.db.get('SELECT COUNT(*) as count FROM knowledge_relationships');
    
    // Writing sessions
    const activeWritingSessions = this.writingAssistant.activeUsers.size;
    
    return {
      ...health,
      queue: queueStats,
      knowledgeGraph: {
        entities: entityCount.count,
        relationships: relationshipCount.count
      },
      writingAssistant: {
        activeSessions: activeWritingSessions
      },
      features: {
        semanticSearch: true,
        categorization: true,
        summarization: true,
        knowledgeGraph: true,
        writingAssistant: true,
        backgroundProcessing: true,
        advancedAnalytics: true
      }
    };
  }
  
  startBackgroundServices() {
    // Cleanup old jobs every hour
    setInterval(() => {
      this.jobQueue.cleanupOldJobs();
    }, 60 * 60 * 1000);
    
    // Cleanup writing sessions every 10 minutes
    setInterval(() => {
      this.writingAssistant.cleanupSessions();
    }, 10 * 60 * 1000);
    
    console.log('🔄 Background services started');
  }
  
  getRouter() {
    return this.router;
  }
}

// ==========================================
// DOCUMENT ANALYTICS MODULE
// ==========================================

class DocumentAnalyticsModule {
  constructor(aiCore) {
    this.core = aiCore;
    this.db = aiCore.db;
    this.setupSchema();
  }
  
  setupSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS document_analytics (
        document_id TEXT PRIMARY KEY REFERENCES documents(id),
        view_count INTEGER DEFAULT 0,
        edit_count INTEGER DEFAULT 0,
        search_mentions INTEGER DEFAULT 0,
        collaboration_score REAL DEFAULT 0,
        quality_trend REAL DEFAULT 0,
        last_viewed TIMESTAMP,
        last_edited TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS document_events (
        id TEXT PRIMARY KEY,
        document_id TEXT REFERENCES documents(id),
        event_type TEXT, -- 'view', 'edit', 'search', 'share'
        user_id INTEGER,
        metadata TEXT, -- JSON
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_events_document ON document_events(document_id);
      CREATE INDEX IF NOT EXISTS idx_events_type ON document_events(event_type);
    `);
  }
  
  async trackEvent(documentId, eventType, userId = null, metadata = {}) {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    // Store event
    await this.db.run(`
      INSERT INTO document_events (id, document_id, event_type, user_id, metadata)
      VALUES (?, ?, ?, ?, ?)
    `, [eventId, documentId, eventType, userId, JSON.stringify(metadata)]);
    
    // Update analytics
    await this.updateAnalytics(documentId, eventType);
    
    return eventId;
  }
  
  async updateAnalytics(documentId, eventType) {
    // Initialize analytics if needed
    await this.db.run(`
      INSERT OR IGNORE INTO document_analytics (document_id) VALUES (?)
    `, documentId);
    
    // Update counters
    switch (eventType) {
      case 'view':
        await this.db.run(`
          UPDATE document_analytics 
          SET view_count = view_count + 1, last_viewed = CURRENT_TIMESTAMP 
          WHERE document_id = ?
        `, documentId);
        break;
        
      case 'edit':
        await this.db.run(`
          UPDATE document_analytics 
          SET edit_count = edit_count + 1, last_edited = CURRENT_TIMESTAMP 
          WHERE document_id = ?
        `, documentId);
        break;
        
      case 'search':
        await this.db.run(`
          UPDATE document_analytics 
          SET search_mentions = search_mentions + 1 
          WHERE document_id = ?
        `, documentId);
        break;
    }
  }
  
  async getDocumentAnalytics(documentId) {
    const analytics = await this.db.get(
      'SELECT * FROM document_analytics WHERE document_id = ?',
      documentId
    );
    
    if (!analytics) return null;
    
    // Get recent events
    const recentEvents = await this.db.all(`
      SELECT event_type, COUNT(*) as count 
      FROM document_events 
      WHERE document_id = ? AND timestamp > datetime('now', '-7 days')
      GROUP BY event_type
    `, documentId);
    
    return {
      ...analytics,
      recentActivity: recentEvents,
      popularityScore: this.calculatePopularityScore(analytics),
      engagementScore: this.calculateEngagementScore(analytics)
    };
  }
  
  calculatePopularityScore(analytics) {
    // Simple popularity algorithm
    const viewWeight = 1;
    const editWeight = 3;
    const searchWeight = 2;
    
    return Math.min(1.0, (
      analytics.view_count * viewWeight +
      analytics.edit_count * editWeight +
      analytics.search_mentions * searchWeight
    ) / 100);
  }
  
  calculateEngagementScore(analytics) {
    // Engagement = edits / views ratio
    if (analytics.view_count === 0) return 0;
    return Math.min(1.0, analytics.edit_count / analytics.view_count);
  }
}

// ==========================================
// SMART RECOMMENDATION MODULE
// ==========================================

class SmartRecommendationModule {
  constructor(aiCore, embeddingModule) {
    this.core = aiCore;
    this.embeddings = embeddingModule;
    this.db = aiCore.db;
  }
  
  async getRecommendations(documentId, userId = null) {
    const recommendations = [];
    
    // 1. Similar documents
    const similar = await this.embeddings.findSimilar(documentId, 3, 0.7);
    if (similar.length > 0) {
      recommendations.push({
        type: 'similar_documents',
        title: 'Similar Documents',
        items: similar.map(s => ({
          id: s.documentId,
          title: s.title,
          similarity: s.similarity,
          reason: `${Math.round(s.similarity * 100)}% similar content`
        }))
      });
    }
    
    // 2. Missing categories
    const missingCategories = await this.findMissingCategories(documentId);
    if (missingCategories.length > 0) {
      recommendations.push({
        type: 'missing_categories',
        title: 'Consider Creating',
        items: missingCategories.map(cat => ({
          category: cat,
          reason: 'Related documents suggest this might be useful'
        }))
      });
    }
    
    // 3. Knowledge gaps
    const knowledgeGaps = await this.findKnowledgeGaps(documentId);
    if (knowledgeGaps.length > 0) {
      recommendations.push({
        type: 'knowledge_gaps',
        title: 'Knowledge Gaps',
        items: knowledgeGaps
      });
    }
    
    // 4. Update suggestions
    const updateSuggestions = await this.getUpdateSuggestions(documentId);
    if (updateSuggestions.length > 0) {
      recommendations.push({
        type: 'updates',
        title: 'Suggested Updates',
        items: updateSuggestions
      });
    }
    
    return recommendations;
  }
  
  async findMissingCategories(documentId) {
    // Find what categories are missing based on entities
    const entities = await this.db.all(`
      SELECT entity_type, entity_value FROM knowledge_entities 
      WHERE json_extract(document_ids, '$') LIKE '%"' || ? || '"%'
    `, documentId);
    
    const suggestions = [];
    
    // If we see technologies but no config, suggest config
    const hasTech = entities.some(e => e.entity_type === 'TECHNOLOGY');
    const hasConfig = await this.db.get(`
      SELECT COUNT(*) as count FROM documents 
      WHERE category = 'Config' AND id IN (
        SELECT json_extract(document_ids, '$[*]') FROM knowledge_entities 
        WHERE entity_type = 'TECHNOLOGY'
      )
    `);
    
    if (hasTech && hasConfig.count === 0) {
      suggestions.push('Configuration Documentation');
    }
    
    return suggestions;
  }
  
  async findKnowledgeGaps(documentId) {
    // Find entities mentioned but not well documented
    const entities = await this.db.all(`
      SELECT ke.entity_value, ke.frequency, ke.importance_score
      FROM knowledge_entities ke
      WHERE json_extract(ke.document_ids, '$') LIKE '%"' || ? || '"%'
      AND ke.frequency < 3
      ORDER BY ke.importance_score DESC
      LIMIT 5
    `, documentId);
    
    return entities.map(e => ({
      entity: e.entity_value,
      reason: `Only mentioned ${e.frequency} time(s) - might need more documentation`,
      importance: e.importance_score
    }));
  }
  
  async getUpdateSuggestions(documentId) {
    const doc = await this.db.get(
      'SELECT created_at, updated_at FROM documents WHERE id = ?',
      documentId
    );
    
    if (!doc) return [];
    
    const suggestions = [];
    const daysSinceUpdate = (Date.now() - new Date(doc.updated_at)) / (1000 * 60 * 60 * 24);
    
    // Suggest updates for old documents
    if (daysSinceUpdate > 30) {
      suggestions.push({
        type: 'content_refresh',
        reason: `Document hasn't been updated in ${Math.round(daysSinceUpdate)} days`,
        urgency: daysSinceUpdate > 90 ? 'high' : 'medium'
      });
    }
    
    return suggestions;
  }
}

// ==========================================
// AI COLLABORATION MODULE
// ==========================================

class AICollaborationModule {
  constructor(aiCore, io) {
    this.core = aiCore;
    this.db = aiCore.db;
    this.io = io;
    this.setupCollaborationFeatures();
  }
  
  setupCollaborationFeatures() {
    if (!this.io) return;
    
    this.io.on('connection', (socket) => {
      // Real-time AI suggestions during collaboration
      socket.on('ai:request_suggestions', async (data) => {
        try {
          const suggestions = await this.getCollaborationSuggestions(data);
          socket.emit('ai:suggestions', suggestions);
        } catch (error) {
          socket.emit('ai:error', { error: error.message });
        }
      });
      
      // Conflict resolution assistance
      socket.on('ai:resolve_conflict', async (data) => {
        try {
          const resolution = await this.suggestConflictResolution(data);
          socket.emit('ai:conflict_resolution', resolution);
        } catch (error) {
          socket.emit('ai:error', { error: error.message });
        }
      });
    });
  }
  
  async getCollaborationSuggestions(data) {
    const { documentId, currentUsers, recentChanges } = data;
    
    const suggestions = [];
    
    // Suggest who might be interested in this document
    const interestedUsers = await this.findInterestedUsers(documentId);
    if (interestedUsers.length > 0) {
      suggestions.push({
        type: 'invite_users',
        title: 'Might be interested',
        users: interestedUsers
      });
    }
    
    // Suggest related documents to reference
    const relatedDocs = await this.core.embeddings.findSimilar(documentId, 3);
    if (relatedDocs.length > 0) {
      suggestions.push({
        type: 'reference_docs',
        title: 'Related documents to reference',
        documents: relatedDocs
      });
    }
    
    return suggestions;
  }
  
  async findInterestedUsers(documentId) {
    // Find users who have worked on similar documents
    const similar = await this.core.embeddings.findSimilar(documentId, 10, 0.6);
    const userCounts = {};
    
    for (const doc of similar) {
      // This would need actual user tracking - simplified for demo
      const mockUsers = ['user1', 'user2', 'user3'];
      mockUsers.forEach(user => {
        userCounts[user] = (userCounts[user] || 0) + 1;
      });
    }
    
    return Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([user, count]) => ({ user, relevance: count }));
  }
  
  async suggestConflictResolution(conflictData) {
    const { version1, version2, conflictType } = conflictData;
    
    const prompt = `Help resolve this document conflict:

VERSION 1:
${version1}

VERSION 2:
${version2}

CONFLICT TYPE: ${conflictType}

Suggest a merged version that combines the best of both:`;

    try {
      const response = await this.core.providers.route({
        type: 'completion',
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 500,
        temperature: 0.3,
        trustLevel: 70
      });
      
      return {
        suggestedResolution: response.choices[0].message.content.trim(),
        confidence: 0.8,
        reasoning: 'AI analyzed both versions and suggested this merge'
      };
      
    } catch (error) {
      throw new Error('Failed to generate conflict resolution');
    }
  }
}

module.exports = {
  CompleteAISystem,
  DocumentAnalyticsModule,
  SmartRecommendationModule,
  AICollaborationModule
};