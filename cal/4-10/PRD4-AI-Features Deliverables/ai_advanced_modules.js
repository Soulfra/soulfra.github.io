// ==========================================
// ADVANCED AI FEATURES - FULL PRD IMPLEMENTATION
// The "overengineered" stuff that we're shipping anyway
// ==========================================

// ==========================================
// MODULE 6: Knowledge Graph Builder
// ==========================================

// ai-knowledge-graph.js - Build document relationships and insights
class KnowledgeGraphModule {
  constructor(aiCore, embeddingModule) {
    this.core = aiCore;
    this.embeddings = embeddingModule;
    this.db = aiCore.db;
    this.setupSchema();
  }
  
  setupSchema() {
    // Extended schema for knowledge graph
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS knowledge_entities (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL, -- 'person', 'technology', 'concept', 'product'
        entity_value TEXT NOT NULL,
        frequency INTEGER DEFAULT 1,
        importance_score REAL DEFAULT 0.5,
        document_ids TEXT, -- JSON array of document IDs
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(entity_type, entity_value)
      );
      
      CREATE TABLE IF NOT EXISTS knowledge_relationships (
        id TEXT PRIMARY KEY,
        source_entity_id TEXT REFERENCES knowledge_entities(id),
        target_entity_id TEXT REFERENCES knowledge_entities(id),
        relationship_type TEXT, -- 'uses', 'mentions', 'requires', 'implements'
        strength REAL DEFAULT 0.5,
        evidence_documents TEXT, -- JSON array
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS document_insights (
        document_id TEXT PRIMARY KEY REFERENCES documents(id),
        complexity_score REAL,
        tech_stack TEXT, -- JSON array
        key_concepts TEXT, -- JSON array
        readability_score REAL,
        estimated_effort TEXT, -- 'low', 'medium', 'high'
        similar_documents TEXT, -- JSON array of similar doc IDs
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_entities_type ON knowledge_entities(entity_type);
      CREATE INDEX IF NOT EXISTS idx_relationships_source ON knowledge_relationships(source_entity_id);
    `);
  }
  
  // Extract entities from document using advanced prompting
  async extractEntities(documentId) {
    console.log(`🧠 Extracting entities from document ${documentId}...`);
    
    const doc = await this.db.get(
      'SELECT title, content, type FROM documents WHERE id = ?',
      documentId
    );
    
    if (!doc) throw new Error(`Document ${documentId} not found`);
    
    // Advanced entity extraction prompt
    const prompt = `Extract important entities from this ${doc.type} document. Be precise and comprehensive.

DOCUMENT: ${doc.title}
CONTENT: ${doc.content.substring(0, 2000)}...

Extract entities in these categories:
- PEOPLE: Names of people, roles, teams
- TECHNOLOGIES: Programming languages, frameworks, tools, platforms
- CONCEPTS: Business concepts, methodologies, processes
- PRODUCTS: Product names, features, components
- ORGANIZATIONS: Companies, departments, external services

Respond in JSON format:
{
  "entities": [
    {
      "type": "TECHNOLOGY",
      "value": "React",
      "context": "Frontend framework mentioned in requirements",
      "importance": 0.9
    },
    {
      "type": "PERSON", 
      "value": "Product Manager",
      "context": "Stakeholder role",
      "importance": 0.7
    }
  ]
}`;

    try {
      const response = await this.core.providers.route({
        type: 'completion',
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 800,
        temperature: 0.2,
        trustLevel: 60 // Higher quality for entity extraction
      });
      
      const result = JSON.parse(response.choices[0].message.content);
      const extractedEntities = [];
      
      // Store entities
      for (const entity of result.entities) {
        const entityId = await this.storeEntity(entity, documentId);
        extractedEntities.push({ ...entity, id: entityId });
      }
      
      console.log(`✅ Extracted ${extractedEntities.length} entities from ${documentId}`);
      return extractedEntities;
      
    } catch (error) {
      console.error(`❌ Entity extraction failed for ${documentId}:`, error.message);
      return [];
    }
  }
  
  // Store entity in knowledge graph
  async storeEntity(entity, documentId) {
    const entityId = `${entity.type.toLowerCase()}_${entity.value.toLowerCase().replace(/\s+/g, '_')}`;
    
    // Check if entity exists
    const existing = await this.db.get(
      'SELECT id, document_ids, frequency FROM knowledge_entities WHERE id = ?',
      entityId
    );
    
    if (existing) {
      // Update existing entity
      const docIds = JSON.parse(existing.document_ids || '[]');
      if (!docIds.includes(documentId)) {
        docIds.push(documentId);
      }
      
      await this.db.run(`
        UPDATE knowledge_entities 
        SET frequency = frequency + 1,
            document_ids = ?,
            importance_score = MAX(importance_score, ?)
        WHERE id = ?
      `, [JSON.stringify(docIds), entity.importance, entityId]);
      
    } else {
      // Create new entity
      await this.db.run(`
        INSERT INTO knowledge_entities 
        (id, entity_type, entity_value, importance_score, document_ids, frequency)
        VALUES (?, ?, ?, ?, ?, 1)
      `, [
        entityId,
        entity.type,
        entity.value,
        entity.importance,
        JSON.stringify([documentId])
      ]);
    }
    
    return entityId;
  }
  
  // Find relationships between entities
  async findRelationships(documentId) {
    console.log(`🔗 Finding relationships in document ${documentId}...`);
    
    // Get entities for this document
    const entities = await this.db.all(`
      SELECT * FROM knowledge_entities 
      WHERE json_extract(document_ids, '$') LIKE '%"' || ? || '"%'
    `, documentId);
    
    if (entities.length < 2) return [];
    
    // Use AI to identify relationships
    const entityList = entities.map(e => `${e.entity_value} (${e.entity_type})`).join(', ');
    
    const prompt = `Identify relationships between these entities found in the same document:

ENTITIES: ${entityList}

DOCUMENT CONTEXT: Brief context about how these entities relate

Identify relationships using these types:
- USES: Entity A uses Entity B (e.g., "React uses JavaScript")
- REQUIRES: Entity A requires Entity B (e.g., "Backend requires Database")
- IMPLEMENTS: Entity A implements Entity B (e.g., "Component implements Feature")
- MENTIONS: Entity A mentions Entity B (e.g., "Document mentions Technology")
- COLLABORATES: Entity A collaborates with Entity B (e.g., "Team collaborates with Team")

Respond in JSON format:
{
  "relationships": [
    {
      "source": "React",
      "target": "JavaScript", 
      "type": "USES",
      "strength": 0.8,
      "evidence": "React is built on JavaScript"
    }
  ]
}`;

    try {
      const response = await this.core.providers.route({
        type: 'completion',
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 400,
        temperature: 0.3,
        trustLevel: 60
      });
      
      const result = JSON.parse(response.choices[0].message.content);
      const relationships = [];
      
      // Store relationships
      for (const rel of result.relationships) {
        const sourceEntity = entities.find(e => e.entity_value === rel.source);
        const targetEntity = entities.find(e => e.entity_value === rel.target);
        
        if (sourceEntity && targetEntity) {
          const relId = await this.storeRelationship(
            sourceEntity.id,
            targetEntity.id,
            rel.type,
            rel.strength,
            documentId
          );
          relationships.push({ ...rel, id: relId });
        }
      }
      
      console.log(`✅ Found ${relationships.length} relationships in ${documentId}`);
      return relationships;
      
    } catch (error) {
      console.error(`❌ Relationship finding failed for ${documentId}:`, error.message);
      return [];
    }
  }
  
  // Store relationship
  async storeRelationship(sourceId, targetId, type, strength, documentId) {
    const relId = `${sourceId}_${type.toLowerCase()}_${targetId}`;
    
    // Check if relationship exists
    const existing = await this.db.get(
      'SELECT evidence_documents FROM knowledge_relationships WHERE id = ?',
      relId
    );
    
    if (existing) {
      // Update evidence
      const evidence = JSON.parse(existing.evidence_documents || '[]');
      if (!evidence.includes(documentId)) {
        evidence.push(documentId);
      }
      
      await this.db.run(
        'UPDATE knowledge_relationships SET evidence_documents = ?, strength = MAX(strength, ?) WHERE id = ?',
        [JSON.stringify(evidence), strength, relId]
      );
    } else {
      // Create new relationship
      await this.db.run(`
        INSERT INTO knowledge_relationships
        (id, source_entity_id, target_entity_id, relationship_type, strength, evidence_documents)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [relId, sourceId, targetId, type, strength, JSON.stringify([documentId])]);
    }
    
    return relId;
  }
  
  // Generate document insights
  async analyzeDocument(documentId) {
    console.log(`📊 Analyzing document ${documentId}...`);
    
    const doc = await this.db.get(
      'SELECT title, content, type FROM documents WHERE id = ?',
      documentId
    );
    
    const prompt = `Analyze this ${doc.type} document and provide insights:

TITLE: ${doc.title}
CONTENT: ${doc.content.substring(0, 1500)}...

Provide analysis in JSON format:
{
  "complexity_score": 0.7,
  "tech_stack": ["React", "Node.js", "PostgreSQL"],
  "key_concepts": ["Authentication", "API Design", "Database Schema"],
  "readability_score": 0.8,
  "estimated_effort": "medium",
  "main_topics": ["Backend Development", "Database Design"],
  "quality_score": 0.75,
  "completeness": 0.85
}

Scoring guidelines:
- complexity_score: 0.0 (simple) to 1.0 (very complex)
- readability_score: 0.0 (hard to read) to 1.0 (very clear)
- estimated_effort: "low", "medium", "high", "very_high"`;

    try {
      const response = await this.core.providers.route({
        type: 'completion',
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 300,
        temperature: 0.2,
        trustLevel: 60
      });
      
      const insights = JSON.parse(response.choices[0].message.content);
      
      // Get similar documents using embeddings
      const similar = await this.embeddings.findSimilar(documentId, 5, 0.6);
      insights.similar_documents = similar.map(s => ({
        id: s.documentId,
        title: s.title,
        similarity: s.similarity
      }));
      
      // Store insights
      await this.db.run(`
        INSERT OR REPLACE INTO document_insights
        (document_id, complexity_score, tech_stack, key_concepts, 
         readability_score, estimated_effort, similar_documents, generated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        documentId,
        insights.complexity_score,
        JSON.stringify(insights.tech_stack),
        JSON.stringify(insights.key_concepts),
        insights.readability_score,
        insights.estimated_effort,
        JSON.stringify(insights.similar_documents)
      ]);
      
      console.log(`✅ Generated insights for ${documentId}`);
      return insights;
      
    } catch (error) {
      console.error(`❌ Document analysis failed for ${documentId}:`, error.message);
      throw error;
    }
  }
  
  // Get knowledge graph data for visualization
  async getGraphData(limit = 100) {
    const entities = await this.db.all(`
      SELECT * FROM knowledge_entities 
      ORDER BY importance_score DESC, frequency DESC 
      LIMIT ?
    `, limit);
    
    const relationships = await this.db.all(`
      SELECT kr.*, se.entity_value as source_name, te.entity_value as target_name
      FROM knowledge_relationships kr
      JOIN knowledge_entities se ON kr.source_entity_id = se.id
      JOIN knowledge_entities te ON kr.target_entity_id = te.id
      ORDER BY kr.strength DESC
      LIMIT ?
    `, limit);
    
    return {
      nodes: entities.map(e => ({
        id: e.id,
        label: e.entity_value,
        type: e.entity_type.toLowerCase(),
        size: Math.max(10, e.frequency * 2),
        color: this.getNodeColor(e.entity_type),
        documents: JSON.parse(e.document_ids || '[]').length
      })),
      edges: relationships.map(r => ({
        source: r.source_entity_id,
        target: r.target_entity_id,
        label: r.relationship_type,
        weight: r.strength,
        color: this.getEdgeColor(r.relationship_type)
      }))
    };
  }
  
  getNodeColor(type) {
    const colors = {
      'TECHNOLOGY': '#00bcd4',
      'PERSON': '#4caf50',
      'CONCEPT': '#ff9800',
      'PRODUCT': '#9c27b0',
      'ORGANIZATION': '#f44336'
    };
    return colors[type] || '#757575';
  }
  
  getEdgeColor(type) {
    const colors = {
      'USES': '#2196f3',
      'REQUIRES': '#f44336',
      'IMPLEMENTS': '#4caf50',
      'MENTIONS': '#ff9800',
      'COLLABORATES': '#9c27b0'
    };
    return colors[type] || '#757575';
  }
}

// ==========================================
// MODULE 7: Real-time Writing Assistant
// ==========================================

// ai-writing-assistant.js - Real-time writing help
class WritingAssistantModule {
  constructor(aiCore) {
    this.core = aiCore;
    this.db = aiCore.db;
    this.activeUsers = new Map(); // Track active writing sessions
    this.setupSchema();
  }
  
  setupSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS writing_sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER,
        document_id TEXT REFERENCES documents(id),
        cursor_position INTEGER,
        context_before TEXT,
        context_after TEXT,
        suggestions TEXT, -- JSON array
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS writing_suggestions (
        id TEXT PRIMARY KEY,
        session_id TEXT REFERENCES writing_sessions(id),
        suggestion_type TEXT, -- 'completion', 'improvement', 'grammar', 'style'
        original_text TEXT,
        suggested_text TEXT,
        explanation TEXT,
        confidence REAL,
        accepted BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_sessions_document ON writing_sessions(document_id);
      CREATE INDEX IF NOT EXISTS idx_suggestions_session ON writing_suggestions(session_id);
    `);
  }
  
  // Start a writing session
  async startSession(userId, documentId, initialCursor = 0) {
    const sessionId = `session_${userId}_${documentId}_${Date.now()}`;
    
    await this.db.run(`
      INSERT INTO writing_sessions 
      (id, user_id, document_id, cursor_position)
      VALUES (?, ?, ?, ?)
    `, [sessionId, userId, documentId, initialCursor]);
    
    this.activeUsers.set(sessionId, {
      userId,
      documentId,
      lastActivity: Date.now(),
      suggestionCache: new Map()
    });
    
    console.log(`✍️ Started writing session ${sessionId}`);
    return sessionId;
  }
  
  // Get writing suggestions based on current context
  async getSuggestions(sessionId, context) {
    const session = this.activeUsers.get(sessionId);
    if (!session) throw new Error('Invalid session');
    
    const { textBefore, textAfter, cursorPosition } = context;
    
    // Update session context
    await this.db.run(`
      UPDATE writing_sessions 
      SET cursor_position = ?, context_before = ?, context_after = ?, last_activity = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [cursorPosition, textBefore, textAfter, sessionId]);
    
    // Generate suggestions
    const suggestions = await Promise.all([
      this.getCompletion(textBefore, textAfter),
      this.getGrammarSuggestions(textBefore),
      this.getStyleSuggestions(textBefore),
      this.getImprovementSuggestions(textBefore)
    ]);
    
    const allSuggestions = suggestions.flat().filter(s => s);
    
    // Store suggestions
    for (const suggestion of allSuggestions) {
      await this.storeSuggestion(sessionId, suggestion);
    }
    
    session.lastActivity = Date.now();
    
    return allSuggestions;
  }
  
  // Text completion suggestion
  async getCompletion(textBefore, textAfter) {
    // Only suggest completion if user paused at end of sentence/line
    const lastChar = textBefore.trim().slice(-1);
    if (!['.', ':', '\n', '-'].includes(lastChar) && textBefore.length < 50) {
      return [];
    }
    
    const prompt = `Continue writing this text naturally. Provide 1-2 sentence completion:

TEXT SO FAR:
${textBefore.substring(Math.max(0, textBefore.length - 500))}

CONTINUATION:`;

    try {
      const response = await this.core.providers.route({
        type: 'completion',
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 50,
        temperature: 0.7,
        trustLevel: 50
      });
      
      const completion = response.choices[0].message.content.trim();
      
      if (completion.length > 10 && completion.length < 200) {
        return [{
          type: 'completion',
          suggestedText: completion,
          confidence: 0.8,
          explanation: 'Continue writing...'
        }];
      }
      
    } catch (error) {
      console.warn('Completion failed:', error.message);
    }
    
    return [];
  }
  
  // Grammar and spelling suggestions
  async getGrammarSuggestions(textBefore) {
    const lastSentence = this.extractLastSentence(textBefore);
    if (!lastSentence || lastSentence.length < 10) return [];
    
    const prompt = `Check this sentence for grammar, spelling, and punctuation errors:

SENTENCE: "${lastSentence}"

If there are errors, provide the corrected version.
If correct, respond with "CORRECT".

RESPONSE:`;

    try {
      const response = await this.core.providers.route({
        type: 'completion',
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 100,
        temperature: 0.1,
        trustLevel: 40 // Cheap model fine for grammar
      });
      
      const correction = response.choices[0].message.content.trim();
      
      if (correction !== 'CORRECT' && correction !== lastSentence) {
        return [{
          type: 'grammar',
          originalText: lastSentence,
          suggestedText: correction,
          confidence: 0.9,
          explanation: 'Grammar correction'
        }];
      }
      
    } catch (error) {
      console.warn('Grammar check failed:', error.message);
    }
    
    return [];
  }
  
  // Style improvement suggestions
  async getStyleSuggestions(textBefore) {
    const lastParagraph = this.extractLastParagraph(textBefore);
    if (!lastParagraph || lastParagraph.length < 50) return [];
    
    const prompt = `Improve the clarity and style of this text while keeping the meaning:

ORIGINAL: "${lastParagraph}"

IMPROVED:`;

    try {
      const response = await this.core.providers.route({
        type: 'completion',
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 150,
        temperature: 0.4,
        trustLevel: 60
      });
      
      const improved = response.choices[0].message.content.trim();
      
      // Only suggest if meaningfully different
      if (improved !== lastParagraph && this.calculateSimilarity(improved, lastParagraph) < 0.8) {
        return [{
          type: 'style',
          originalText: lastParagraph,
          suggestedText: improved,
          confidence: 0.7,
          explanation: 'Style improvement'
        }];
      }
      
    } catch (error) {
      console.warn('Style suggestion failed:', error.message);
    }
    
    return [];
  }
  
  // Content improvement suggestions
  async getImprovementSuggestions(textBefore) {
    // Look for common improvement opportunities
    const improvements = [];
    
    // Check for passive voice
    if (this.hasPassiveVoice(textBefore)) {
      improvements.push({
        type: 'improvement',
        suggestedText: 'Consider using active voice for clarity',
        confidence: 0.6,
        explanation: 'Active voice is usually clearer'
      });
    }
    
    // Check for word repetition
    const repeatedWords = this.findRepeatedWords(textBefore);
    if (repeatedWords.length > 0) {
      improvements.push({
        type: 'improvement',
        suggestedText: `Consider varying these repeated words: ${repeatedWords.join(', ')}`,
        confidence: 0.5,
        explanation: 'Avoid repetition for better flow'
      });
    }
    
    return improvements;
  }
  
  // Store suggestion in database
  async storeSuggestion(sessionId, suggestion) {
    const suggestionId = `sugg_${sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    await this.db.run(`
      INSERT INTO writing_suggestions
      (id, session_id, suggestion_type, original_text, suggested_text, explanation, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      suggestionId,
      sessionId,
      suggestion.type,
      suggestion.originalText || '',
      suggestion.suggestedText,
      suggestion.explanation,
      suggestion.confidence
    ]);
    
    suggestion.id = suggestionId;
    return suggestion;
  }
  
  // Handle user feedback on suggestions
  async handleFeedback(suggestionId, accepted, modifiedText = null) {
    await this.db.run(`
      UPDATE writing_suggestions 
      SET accepted = ? 
      WHERE id = ?
    `, [accepted, suggestionId]);
    
    // Learn from feedback (simple approach)
    if (accepted) {
      console.log(`✅ Suggestion ${suggestionId} accepted`);
    } else {
      console.log(`❌ Suggestion ${suggestionId} rejected`);
    }
    
    return { success: true };
  }
  
  // Utility functions
  extractLastSentence(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g);
    return sentences ? sentences[sentences.length - 1].trim() : '';
  }
  
  extractLastParagraph(text) {
    const paragraphs = text.split(/\n\s*\n/);
    return paragraphs[paragraphs.length - 1].trim();
  }
  
  calculateSimilarity(text1, text2) {
    // Simple Jaccard similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
  
  hasPassiveVoice(text) {
    // Simple passive voice detection
    const passivePatterns = /\b(was|were|is|are|been|being)\s+\w+ed\b/gi;
    return passivePatterns.test(text);
  }
  
  findRepeatedWords(text) {
    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const wordCount = {};
    
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    return Object.keys(wordCount).filter(word => wordCount[word] > 2);
  }
  
  // Cleanup inactive sessions
  cleanupSessions() {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 minutes
    
    for (const [sessionId, session] of this.activeUsers.entries()) {
      if (now - session.lastActivity > timeout) {
        this.activeUsers.delete(sessionId);
        console.log(`🧹 Cleaned up inactive session ${sessionId}`);
      }
    }
  }
}

// ==========================================
// MODULE 8: Background Job Queue System
// ==========================================

// ai-job-queue.js - Background processing for expensive operations
class BackgroundJobQueue {
  constructor(aiCore) {
    this.core = aiCore;
    this.db = aiCore.db;
    this.processing = false;
    this.maxConcurrent = 3;
    this.currentJobs = new Map();
    this.setupSchema();
    this.startProcessor();
  }
  
  setupSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ai_job_queue (
        id TEXT PRIMARY KEY,
        job_type TEXT NOT NULL,
        payload TEXT NOT NULL, -- JSON
        priority INTEGER DEFAULT 50,
        status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 3,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP,
        completed_at TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_jobs_status ON ai_job_queue(status);
      CREATE INDEX IF NOT EXISTS idx_jobs_priority ON ai_job_queue(priority DESC, created_at ASC);
    `);
  }
  
  // Queue a job for background processing
  async queueJob(jobType, payload, priority = 50) {
    const jobId = `job_${jobType}_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    await this.db.run(`
      INSERT INTO ai_job_queue (id, job_type, payload, priority)
      VALUES (?, ?, ?, ?)
    `, [jobId, jobType, JSON.stringify(payload), priority]);
    
    console.log(`📋 Queued ${jobType} job: ${jobId}`);
    
    // Wake up processor if sleeping
    if (!this.processing) {
      this.startProcessor();
    }
    
    return jobId;
  }
  
  // Queue document processing
  async queueDocumentProcessing(documentId, features = ['embed', 'categorize', 'summarize']) {
    const jobs = [];
    
    for (const feature of features) {
      const jobId = await this.queueJob(`process_${feature}`, {
        documentId,
        feature
      }, this.getJobPriority(feature));
      
      jobs.push(jobId);
    }
    
    return jobs;
  }
  
  // Queue knowledge graph processing
  async queueKnowledgeGraphUpdate(documentId) {
    return this.queueJob('knowledge_graph', {
      documentId,
      tasks: ['extract_entities', 'find_relationships', 'analyze_document']
    }, 30); // Lower priority
  }
  
  // Start background processor
  async startProcessor() {
    if (this.processing) return;
    
    this.processing = true;
    console.log('🚀 Starting background job processor...');
    
    while (this.processing) {
      try {
        // Check if we can take more jobs
        if (this.currentJobs.size >= this.maxConcurrent) {
          await this.sleep(1000);
          continue;
        }
        
        // Get next job
        const job = await this.getNextJob();
        if (!job) {
          await this.sleep(2000);
          continue;
        }
        
        // Process job
        this.processJobAsync(job);
        
      } catch (error) {
        console.error('Job processor error:', error);
        await this.sleep(5000);
      }
    }
  }
  
  // Get next job to process
  async getNextJob() {
    return this.db.get(`
      SELECT * FROM ai_job_queue 
      WHERE status = 'pending' AND attempts < max_attempts
      ORDER BY priority DESC, created_at ASC
      LIMIT 1
    `);
  }
  
  // Process job asynchronously
  async processJobAsync(job) {
    const startTime = Date.now();
    this.currentJobs.set(job.id, job);
    
    try {
      // Mark as processing
      await this.db.run(`
        UPDATE ai_job_queue 
        SET status = 'processing', started_at = CURRENT_TIMESTAMP, attempts = attempts + 1
        WHERE id = ?
      `, job.id);
      
      console.log(`⚙️ Processing job ${job.id} (${job.job_type})`);
      
      // Process based on job type
      const result = await this.executeJob(job);
      
      // Mark as completed
      await this.db.run(`
        UPDATE ai_job_queue 
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, job.id);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Completed job ${job.id} in ${duration}ms`);
      
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error.message);
      
      // Mark as failed
      await this.db.run(`
        UPDATE ai_job_queue 
        SET status = ?, error_message = ?
        WHERE id = ?
      `, [
        job.attempts >= job.max_attempts ? 'failed' : 'pending',
        error.message,
        job.id
      ]);
      
    } finally {
      this.currentJobs.delete(job.id);
    }
  }
  
  // Execute specific job types
  async executeJob(job) {
    const payload = JSON.parse(job.payload);
    
    switch (job.job_type) {
      case 'process_embed':
        const { AIFeaturesController } = require('./ai-features');
        const ai = new AIFeaturesController(this.db, this.core.providers);
        return ai.embeddings.embedDocument(payload.documentId);
        
      case 'process_categorize':
        const ai2 = new AIFeaturesController(this.db, this.core.providers);
        return ai2.categorizer.categorizeDocument(payload.documentId);
        
      case 'process_summarize':
        const ai3 = new AIFeaturesController(this.db, this.core.providers);
        return ai3.summarizer.summarizeDocument(payload.documentId);
        
      case 'knowledge_graph':
        const knowledgeGraph = new KnowledgeGraphModule(this.core, null);
        const results = {};
        
        if (payload.tasks.includes('extract_entities')) {
          results.entities = await knowledgeGraph.extractEntities(payload.documentId);
        }
        if (payload.tasks.includes('find_relationships')) {
          results.relationships = await knowledgeGraph.findRelationships(payload.documentId);
        }
        if (payload.tasks.includes('analyze_document')) {
          results.insights = await knowledgeGraph.analyzeDocument(payload.documentId);
        }
        
        return results;
        
      default:
        throw new Error(`Unknown job type: ${job.job_type}`);
    }
  }
  
  // Get job priority
  getJobPriority(feature) {
    const priorities = {
      categorize: 90, // High priority for immediate user feedback
      embed: 80,      // High priority for search
      summarize: 60,  // Medium priority
      knowledge: 30   // Low priority background task
    };
    return priorities[feature] || 50;
  }
  
  // Get queue statistics
  async getQueueStats() {
    const stats = await this.db.all(`
      SELECT status, COUNT(*) as count 
      FROM ai_job_queue 
      GROUP BY status
    `);
    
    const result = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      active_jobs: this.currentJobs.size
    };
    
    stats.forEach(stat => {
      result[stat.status] = stat.count;
    });
    
    return result;
  }
  
  // Cleanup old completed jobs
  async cleanupOldJobs(daysOld = 7) {
    const result = await this.db.run(`
      DELETE FROM ai_job_queue 
      WHERE status IN ('completed', 'failed') 
      AND created_at < datetime('now', '-${daysOld} days')
    `);
    
    console.log(`🧹 Cleaned up ${result.changes} old jobs`);
    return result.changes;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Stop processor
  stop() {
    this.processing = false;
    console.log('⏹️ Background job processor stopped');
  }
}

module.exports = {
  KnowledgeGraphModule,
  WritingAssistantModule,
  BackgroundJobQueue
};