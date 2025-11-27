// ==========================================
// COMPREHENSIVE TEST SUITE
// Full test coverage for all AI features
// ==========================================

// ai-test-suite.js - Complete testing framework
class AIFeatureTestSuite {
  constructor() {
    this.tests = [];
    this.results = [];
    this.mockDb = this.setupMockDatabase();
    this.mockProviders = this.setupMockProviders();
  }
  
  setupMockDatabase() {
    // In-memory SQLite for testing
    const Database = require('better-sqlite3');
    const db = new Database(':memory:');
    
    // Setup test schema
    db.exec(`
      CREATE TABLE documents (
        id TEXT PRIMARY KEY,
        title TEXT,
        content TEXT,
        type TEXT,
        category TEXT,
        ai_category TEXT,
        ai_summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE document_embeddings (
        document_id TEXT PRIMARY KEY,
        embedding BLOB,
        model TEXT DEFAULT 'test-model',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE knowledge_entities (
        id TEXT PRIMARY KEY,
        entity_type TEXT,
        entity_value TEXT,
        frequency INTEGER DEFAULT 1,
        importance_score REAL DEFAULT 0.5,
        document_ids TEXT
      );
    `);
    
    // Insert test data
    this.insertTestData(db);
    
    return db;
  }
  
  insertTestData(db) {
    // Test documents
    const testDocs = [
      {
        id: 'doc_1',
        title: 'User Authentication PRD',
        content: 'This PRD covers user authentication using JWT tokens and OAuth2. We need secure login, password reset, and session management.',
        type: 'prd',
        category: 'PRD'
      },
      {
        id: 'doc_2', 
        title: 'Database Configuration',
        content: 'PostgreSQL configuration for production. Settings include connection pooling, SSL, and backup strategies.',
        type: 'config',
        category: 'Config'
      },
      {
        id: 'doc_3',
        title: 'Deployment Script',
        content: '#!/bin/bash\necho "Deploying application..."\ndocker build -t myapp .\ndocker run -p 3000:3000 myapp',
        type: 'script',
        category: 'Script'
      }
    ];
    
    testDocs.forEach(doc => {
      db.run(`
        INSERT INTO documents (id, title, content, type, category)
        VALUES (?, ?, ?, ?, ?)
      `, [doc.id, doc.title, doc.content, doc.type, doc.category]);
    });
  }
  
  setupMockProviders() {
    return {
      route: async (request) => {
        // Mock different AI provider responses
        switch (request.type) {
          case 'embedding':
            return {
              data: [{
                embedding: Array(1536).fill(0).map(() => Math.random() - 0.5)
              }]
            };
            
          case 'completion':
            if (request.messages[0].content.includes('Categorize')) {
              return { choices: [{ message: { content: 'PRD|85' } }] };
            } else if (request.messages[0].content.includes('Summarize')) {
              return { choices: [{ message: { content: 'This document covers authentication requirements including JWT and OAuth2 implementation.' } }] };
            } else if (request.messages[0].content.includes('Extract entities')) {
              return { choices: [{ message: { content: JSON.stringify({
                entities: [
                  { type: 'TECHNOLOGY', value: 'JWT', importance: 0.9 },
                  { type: 'TECHNOLOGY', value: 'OAuth2', importance: 0.8 },
                  { type: 'CONCEPT', value: 'Authentication', importance: 0.95 }
                ]
              }) } }] };
            }
            return { choices: [{ message: { content: 'Test response' } }] };
            
          default:
            throw new Error(`Unknown request type: ${request.type}`);
        }
      }
    };
  }
  
  // Test runner
  async runAllTests() {
    console.log('🧪 Starting comprehensive AI features test suite...\n');
    
    const testGroups = [
      'Core Infrastructure',
      'Embedding System',
      'Semantic Search', 
      'Auto-Categorization',
      'Document Summarization',
      'Knowledge Graph',
      'Writing Assistant',
      'Background Jobs',
      'Complete System Integration',
      'Performance Tests'
    ];
    
    for (const group of testGroups) {
      console.log(`📋 Testing: ${group}`);
      await this.runTestGroup(group);
      console.log('');
    }
    
    this.printResults();
  }
  
  async runTestGroup(group) {
    switch (group) {
      case 'Core Infrastructure':
        await this.testCoreInfrastructure();
        break;
      case 'Embedding System':
        await this.testEmbeddingSystem();
        break;
      case 'Semantic Search':
        await this.testSemanticSearch();
        break;
      case 'Auto-Categorization':
        await this.testAutoCategorization();
        break;
      case 'Document Summarization':
        await this.testDocumentSummarization();
        break;
      case 'Knowledge Graph':
        await this.testKnowledgeGraph();
        break;
      case 'Writing Assistant':
        await this.testWritingAssistant();
        break;
      case 'Background Jobs':
        await this.testBackgroundJobs();
        break;
      case 'Complete System Integration':
        await this.testCompleteSystem();
        break;
      case 'Performance Tests':
        await this.testPerformance();
        break;
    }
  }
  
  async testCoreInfrastructure() {
    await this.test('Database schema setup', async () => {
      const tables = this.mockDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      const tableNames = tables.map(t => t.name);
      
      this.assert(tableNames.includes('documents'), 'Documents table exists');
      this.assert(tableNames.includes('document_embeddings'), 'Embeddings table exists');
      this.assert(tableNames.includes('knowledge_entities'), 'Entities table exists');
    });
    
    await this.test('Provider routing', async () => {
      const response = await this.mockProviders.route({
        type: 'completion',
        messages: [{ role: 'user', content: 'Test' }]
      });
      
      this.assert(response.choices, 'Provider returns choices');
      this.assert(response.choices[0].message.content, 'Provider returns content');
    });
    
    await this.test('Vector serialization', async () => {
      const { AICoreModule } = require('./ai-features');
      const core = new AICoreModule(this.mockDb, this.mockProviders);
      
      const testVector = [0.1, 0.2, 0.3, 0.4, 0.5];
      const serialized = core.serializeVector(testVector);
      const deserialized = core.deserializeVector(serialized);
      
      this.assert(Math.abs(deserialized[0] - 0.1) < 0.001, 'Vector serialization works');
      this.assert(deserialized.length === testVector.length, 'Vector length preserved');
    });
  }
  
  async testEmbeddingSystem() {
    const { DocumentEmbeddingModule, AICoreModule } = require('./ai-features');
    const core = new AICoreModule(this.mockDb, this.mockProviders);
    const embeddings = new DocumentEmbeddingModule(core);
    
    await this.test('Document embedding', async () => {
      const result = await embeddings.embedDocument('doc_1');
      this.assert(Array.isArray(result), 'Returns embedding array');
      this.assert(result.length === 1536, 'Correct embedding dimension');
    });
    
    await this.test('Embedding storage', async () => {
      await embeddings.embedDocument('doc_1');
      const stored = await embeddings.getEmbedding('doc_1');
      this.assert(stored !== null, 'Embedding stored successfully');
      this.assert(Array.isArray(stored), 'Stored embedding is array');
    });
    
    await this.test('Similarity calculation', async () => {
      await embeddings.embedDocument('doc_1');
      await embeddings.embedDocument('doc_2');
      
      const similar = await embeddings.findSimilar('doc_1', 5, 0.1);
      this.assert(Array.isArray(similar), 'Returns similarity results');
      this.assert(similar.every(s => s.similarity >= 0 && s.similarity <= 1), 'Valid similarity scores');
    });
    
    await this.test('Batch embedding', async () => {
      const processed = await embeddings.embedAllDocuments();
      this.assert(processed >= 3, 'Processed all test documents');
    });
  }
  
  async testSemanticSearch() {
    const { SemanticSearchModule, DocumentEmbeddingModule, AICoreModule } = require('./ai-features');
    const core = new AICoreModule(this.mockDb, this.mockProviders);
    const embeddings = new DocumentEmbeddingModule(core);
    const search = new SemanticSearchModule(core, embeddings);
    
    // Setup embeddings
    await embeddings.embedAllDocuments();
    
    await this.test('Basic search', async () => {
      const results = await search.search('authentication', { limit: 5 });
      
      this.assert(results.results, 'Returns search results');
      this.assert(results.query === 'authentication', 'Query preserved');
      this.assert(Array.isArray(results.results), 'Results is array');
    });
    
    await this.test('Search filtering', async () => {
      const results = await search.search('authentication', {
        filters: { type: 'prd' },
        limit: 5
      });
      
      this.assert(results.results.every(r => r.type === 'prd'), 'Filtering works');
    });
    
    await this.test('Query enhancement', async () => {
      const enhanced = await search.enhanceQuery('login');
      this.assert(typeof enhanced === 'string', 'Returns enhanced query');
      this.assert(enhanced.length > 0, 'Enhanced query not empty');
    });
  }
  
  async testAutoCategorization() {
    const { AutoCategorizerModule, AICoreModule } = require('./ai-features');
    const core = new AICoreModule(this.mockDb, this.mockProviders);
    const categorizer = new AutoCategorizerModule(core);
    
    await this.test('Document categorization', async () => {
      const result = await categorizer.categorizeDocument('doc_1');
      
      this.assert(result.category, 'Returns category');
      this.assert(result.confidence >= 0 && result.confidence <= 100, 'Valid confidence score');
      this.assert(result.documentId === 'doc_1', 'Document ID preserved');
    });
    
    await this.test('Fallback categorization', async () => {
      // Test with document that has no content
      this.mockDb.run("INSERT INTO documents (id, title, content) VALUES ('test_empty', 'Test', '')");
      
      const result = await categorizer.categorizeDocument('test_empty');
      this.assert(result.category, 'Fallback categorization works');
      this.assert(result.confidence === 30, 'Fallback confidence is 30');
    });
    
    await this.test('Batch categorization', async () => {
      const results = await categorizer.categorizeAllDocuments();
      this.assert(Array.isArray(results), 'Returns results array');
      this.assert(results.length > 0, 'Processed documents');
    });
    
    await this.test('Category statistics', async () => {
      await categorizer.categorizeAllDocuments();
      const stats = await categorizer.getCategoryStats();
      
      this.assert(Array.isArray(stats), 'Returns stats array');
      this.assert(stats.every(s => s.ai_category && s.count), 'Valid stats format');
    });
  }
  
  async testDocumentSummarization() {
    const { DocumentSummarizerModule, AICoreModule } = require('./ai-features');
    const core = new AICoreModule(this.mockDb, this.mockProviders);
    const summarizer = new DocumentSummarizerModule(core);
    
    await this.test('Document summarization', async () => {
      const result = await summarizer.summarizeDocument('doc_1', 'brief');
      
      this.assert(result.summary, 'Returns summary');
      this.assert(result.type === 'brief', 'Summary type preserved');
      this.assert(result.documentId === 'doc_1', 'Document ID preserved');
    });
    
    await this.test('Summary storage', async () => {
      await summarizer.summarizeDocument('doc_1', 'brief');
      const stored = await summarizer.getSummary('doc_1');
      
      this.assert(stored !== null, 'Summary stored');
      this.assert(typeof stored === 'string', 'Summary is string');
    });
    
    await this.test('Batch summarization', async () => {
      const results = await summarizer.summarizeAllDocuments('brief');
      
      this.assert(Array.isArray(results), 'Returns results array');
      this.assert(results.length > 0, 'Processed documents');
    });
  }
  
  async testKnowledgeGraph() {
    const { KnowledgeGraphModule, AICoreModule, DocumentEmbeddingModule } = require('./ai-advanced-modules');
    const core = new AICoreModule(this.mockDb, this.mockProviders);
    const embeddings = new DocumentEmbeddingModule(core);
    const kg = new KnowledgeGraphModule(core, embeddings);
    
    await this.test('Entity extraction', async () => {
      const entities = await kg.extractEntities('doc_1');
      
      this.assert(Array.isArray(entities), 'Returns entities array');
      this.assert(entities.length > 0, 'Extracted entities');
      this.assert(entities.every(e => e.type && e.value), 'Valid entity format');
    });
    
    await this.test('Relationship finding', async () => {
      await kg.extractEntities('doc_1'); // Setup entities first
      const relationships = await kg.findRelationships('doc_1');
      
      this.assert(Array.isArray(relationships), 'Returns relationships array');
    });
    
    await this.test('Document analysis', async () => {
      const insights = await kg.analyzeDocument('doc_1');
      
      this.assert(insights.complexity_score >= 0 && insights.complexity_score <= 1, 'Valid complexity score');
      this.assert(insights.readability_score >= 0 && insights.readability_score <= 1, 'Valid readability score');
      this.assert(['low', 'medium', 'high', 'very_high'].includes(insights.estimated_effort), 'Valid effort estimate');
    });
    
    await this.test('Graph data generation', async () => {
      await kg.extractEntities('doc_1');
      const graph = await kg.getGraphData(10);
      
      this.assert(graph.nodes && graph.edges, 'Returns nodes and edges');
      this.assert(Array.isArray(graph.nodes), 'Nodes is array');
      this.assert(Array.isArray(graph.edges), 'Edges is array');
    });
  }
  
  async testWritingAssistant() {
    const { WritingAssistantModule, AICoreModule } = require('./ai-advanced-modules');
    const core = new AICoreModule(this.mockDb, this.mockProviders);
    const writer = new WritingAssistantModule(core);
    
    await this.test('Writing session creation', async () => {
      const sessionId = await writer.startSession(1, 'doc_1', 0);
      
      this.assert(typeof sessionId === 'string', 'Returns session ID');
      this.assert(sessionId.includes('session_'), 'Valid session ID format');
    });
    
    await this.test('Writing suggestions', async () => {
      const sessionId = await writer.startSession(1, 'doc_1', 0);
      const suggestions = await writer.getSuggestions(sessionId, {
        textBefore: 'This is a test document about authentication.',
        textAfter: '',
        cursorPosition: 45
      });
      
      this.assert(Array.isArray(suggestions), 'Returns suggestions array');
    });
    
    await this.test('Suggestion feedback', async () => {
      const sessionId = await writer.startSession(1, 'doc_1', 0);
      const suggestions = await writer.getSuggestions(sessionId, {
        textBefore: 'Test',
        textAfter: '',
        cursorPosition: 4
      });
      
      if (suggestions.length > 0) {
        const result = await writer.handleFeedback(suggestions[0].id, true);
        this.assert(result.success === true, 'Feedback handling works');
      }
    });
  }
  
  async testBackgroundJobs() {
    const { BackgroundJobQueue, AICoreModule } = require('./ai-advanced-modules');
    const core = new AICoreModule(this.mockDb, this.mockProviders);
    const queue = new BackgroundJobQueue(core);
    
    await this.test('Job queuing', async () => {
      const jobId = await queue.queueJob('test_job', { test: 'data' }, 50);
      
      this.assert(typeof jobId === 'string', 'Returns job ID');
      this.assert(jobId.includes('job_'), 'Valid job ID format');
    });
    
    await this.test('Document processing queue', async () => {
      const jobIds = await queue.queueDocumentProcessing('doc_1', ['categorize']);
      
      this.assert(Array.isArray(jobIds), 'Returns job IDs array');
      this.assert(jobIds.length === 1, 'Queued one job');
    });
    
    await this.test('Queue statistics', async () => {
      const stats = await queue.getQueueStats();
      
      this.assert(typeof stats === 'object', 'Returns stats object');
      this.assert(stats.hasOwnProperty('pending'), 'Has pending count');
      this.assert(stats.hasOwnProperty('processing'), 'Has processing count');
    });
    
    // Stop queue for testing
    queue.stop();
  }
  
  async testCompleteSystem() {
    const { CompleteAISystem } = require('./ai-complete-system');
    const system = new CompleteAISystem(this.mockDb, this.mockProviders);
    
    await this.test('System initialization', async () => {
      this.assert(system.core, 'Core module initialized');
      this.assert(system.knowledgeGraph, 'Knowledge graph initialized');
      this.assert(system.writingAssistant, 'Writing assistant initialized');
      this.assert(system.jobQueue, 'Job queue initialized');
    });
    
    await this.test('Complete document processing', async () => {
      const result = await system.processDocumentComplete('doc_1', {
        features: ['embed', 'categorize'],
        background: false
      });
      
      this.assert(result.embedding, 'Embedding completed');
      this.assert(result.categorization, 'Categorization completed');
    });
    
    await this.test('Advanced search', async () => {
      await system.processDocumentComplete('doc_1', { background: false });
      
      const results = await system.advancedSearch('authentication', {
        methods: ['semantic', 'keyword']
      });
      
      this.assert(results.results, 'Returns search results');
      this.assert(results.meta, 'Returns search metadata');
    });
    
    await this.test('System overview', async () => {
      const overview = await system.getSystemOverview();
      
      this.assert(overview.features, 'Returns feature status');
      this.assert(overview.stats, 'Returns system stats');
      this.assert(overview.queue, 'Returns queue stats');
    });
    
    // Cleanup
    system.jobQueue.stop();
  }
  
  async testPerformance() {
    const { AIFeaturesController } = require('./ai-features');
    const ai = new AIFeaturesController(this.mockDb, this.mockProviders);
    
    await this.test('Embedding performance', async () => {
      const start = Date.now();
      await ai.embeddings.embedDocument('doc_1');
      const duration = Date.now() - start;
      
      this.assert(duration < 5000, `Embedding completed in ${duration}ms (under 5s)`);
    });
    
    await this.test('Search performance', async () => {
      await ai.embeddings.embedAllDocuments();
      
      const start = Date.now();
      await ai.search.search('authentication', { limit: 10 });
      const duration = Date.now() - start;
      
      this.assert(duration < 3000, `Search completed in ${duration}ms (under 3s)`);
    });
    
    await this.test('Batch processing performance', async () => {
      const start = Date.now();
      await ai.processAllDocuments();
      const duration = Date.now() - start;
      
      this.assert(duration < 30000, `Batch processing completed in ${duration}ms (under 30s)`);
    });
  }
  
  // Test utilities
  async test(name, testFunction) {
    try {
      await testFunction();
      this.results.push({ name, status: 'PASS', error: null });
      console.log(`  ✅ ${name}`);
    } catch (error) {
      this.results.push({ name, status: 'FAIL', error: error.message });
      console.log(`  ❌ ${name}: ${error.message}`);
    }
  }
  
  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }
  
  printResults() {
    console.log('\n==========================================');
    console.log('🧪 TEST RESULTS SUMMARY');
    console.log('==========================================\n');
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Success Rate: ${Math.round((passed / total) * 100)}%\n`);
    
    if (failed > 0) {
      console.log('Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  ❌ ${r.name}: ${r.error}`));
    }
    
    console.log('\n==========================================');
    
    // Cleanup
    this.mockDb.close();
  }
}

// ==========================================
// ADVANCED UI COMPONENTS
// Next-level frontend interfaces
// ==========================================

// Advanced Knowledge Graph Visualization
const KnowledgeGraphVisualization = `
<!DOCTYPE html>
<html>
<head>
    <title>Soulfra AI Knowledge Graph</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"></script>
    <style>
        body { margin: 0; font-family: 'Segoe UI', sans-serif; background: #0a0a0a; color: #fff; }
        .graph-container { width: 100vw; height: 100vh; position: relative; }
        .controls { position: absolute; top: 20px; left: 20px; z-index: 100; }
        .control-panel { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; backdrop-filter: blur(10px); }
        .node { cursor: pointer; }
        .node:hover { stroke: #fff; stroke-width: 3px; }
        .link { stroke: #666; stroke-opacity: 0.6; }
        .link:hover { stroke: #fff; stroke-width: 3px; }
        .tooltip { position: absolute; background: rgba(0,0,0,0.9); color: #fff; padding: 10px; border-radius: 8px; pointer-events: none; font-size: 14px; }
        .legend { position: absolute; bottom: 20px; left: 20px; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; }
        .search-box { width: 300px; padding: 10px; border: none; border-radius: 8px; background: rgba(255,255,255,0.2); color: #fff; }
        .search-box::placeholder { color: #ccc; }
        .filter-btn { background: #007bff; border: none; color: #fff; padding: 8px 16px; margin: 5px; border-radius: 6px; cursor: pointer; }
        .filter-btn.active { background: #0056b3; }
    </style>
</head>
<body>
    <div class="graph-container">
        <div class="controls">
            <div class="control-panel">
                <h3>🧠 Knowledge Graph</h3>
                <input type="text" class="search-box" placeholder="Search entities..." id="searchInput">
                <div style="margin-top: 10px;">
                    <button class="filter-btn active" data-type="all">All</button>
                    <button class="filter-btn" data-type="TECHNOLOGY">Tech</button>
                    <button class="filter-btn" data-type="PERSON">People</button>
                    <button class="filter-btn" data-type="CONCEPT">Concepts</button>
                    <button class="filter-btn" data-type="PRODUCT">Products</button>
                </div>
                <div style="margin-top: 10px;">
                    <label><input type="range" id="strengthSlider" min="0" max="1" step="0.1" value="0.3"> Relationship Strength</label>
                </div>
                <div style="margin-top: 10px; font-size: 12px;">
                    <div id="stats">Loading...</div>
                </div>
            </div>
        </div>
        
        <div class="legend">
            <div><span style="color: #00bcd4;">●</span> Technology</div>
            <div><span style="color: #4caf50;">●</span> Person</div>
            <div><span style="color: #ff9800;">●</span> Concept</div>
            <div><span style="color: #9c27b0;">●</span> Product</div>
            <div><span style="color: #f44336;">●</span> Organization</div>
        </div>
        
        <svg id="graph"></svg>
        <div class="tooltip" id="tooltip" style="display: none;"></div>
    </div>

    <script>
        class KnowledgeGraphViz {
            constructor() {
                this.width = window.innerWidth;
                this.height = window.innerHeight;
                this.selectedType = 'all';
                this.minStrength = 0.3;
                
                this.svg = d3.select('#graph')
                    .attr('width', this.width)
                    .attr('height', this.height);
                
                this.simulation = d3.forceSimulation()
                    .force('link', d3.forceLink().id(d => d.id).distance(80))
                    .force('charge', d3.forceManyBody().strength(-300))
                    .force('center', d3.forceCenter(this.width / 2, this.height / 2))
                    .force('collision', d3.forceCollide().radius(d => d.size + 5));
                
                this.setupEventListeners();
                this.loadData();
            }
            
            async loadData() {
                try {
                    const response = await fetch('/api/ai/knowledge/graph?limit=50');
                    const data = await response.json();
                    this.renderGraph(data);
                    this.updateStats(data);
                } catch (error) {
                    console.error('Failed to load graph data:', error);
                }
            }
            
            renderGraph(data) {
                // Filter data
                const filteredNodes = this.selectedType === 'all' 
                    ? data.nodes 
                    : data.nodes.filter(n => n.type === this.selectedType.toLowerCase());
                
                const nodeIds = new Set(filteredNodes.map(n => n.id));
                const filteredEdges = data.edges.filter(e => 
                    nodeIds.has(e.source) && nodeIds.has(e.target) && e.weight >= this.minStrength
                );
                
                // Clear previous graph
                this.svg.selectAll('*').remove();
                
                // Create links
                const link = this.svg.append('g')
                    .selectAll('line')
                    .data(filteredEdges)
                    .enter().append('line')
                    .attr('class', 'link')
                    .style('stroke', d => d.color)
                    .style('stroke-width', d => Math.sqrt(d.weight * 10));
                
                // Create nodes
                const node = this.svg.append('g')
                    .selectAll('circle')
                    .data(filteredNodes)
                    .enter().append('circle')
                    .attr('class', 'node')
                    .attr('r', d => d.size)
                    .style('fill', d => d.color)
                    .call(d3.drag()
                        .on('start', this.dragstarted.bind(this))
                        .on('drag', this.dragged.bind(this))
                        .on('end', this.dragended.bind(this)));
                
                // Add labels
                const label = this.svg.append('g')
                    .selectAll('text')
                    .data(filteredNodes)
                    .enter().append('text')
                    .text(d => d.label)
                    .style('font-size', '12px')
                    .style('fill', '#fff')
                    .style('text-anchor', 'middle')
                    .style('pointer-events', 'none');
                
                // Tooltips
                node.on('mouseover', (event, d) => {
                    const tooltip = d3.select('#tooltip');
                    tooltip.style('display', 'block')
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 10) + 'px')
                        .html(\`
                            <strong>\${d.label}</strong><br>
                            Type: \${d.type}<br>
                            Documents: \${d.documents}<br>
                            Connections: \${filteredEdges.filter(e => e.source.id === d.id || e.target.id === d.id).length}
                        \`);
                })
                .on('mouseout', () => {
                    d3.select('#tooltip').style('display', 'none');
                });
                
                // Update simulation
                this.simulation.nodes(filteredNodes);
                this.simulation.force('link').links(filteredEdges);
                this.simulation.alpha(1).restart();
                
                this.simulation.on('tick', () => {
                    link.attr('x1', d => d.source.x)
                        .attr('y1', d => d.source.y)
                        .attr('x2', d => d.target.x)
                        .attr('y2', d => d.target.y);
                    
                    node.attr('cx', d => d.x)
                        .attr('cy', d => d.y);
                    
                    label.attr('x', d => d.x)
                         .attr('y', d => d.y + 4);
                });
            }
            
            setupEventListeners() {
                // Filter buttons
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                        e.target.classList.add('active');
                        this.selectedType = e.target.dataset.type;
                        this.loadData();
                    });
                });
                
                // Strength slider
                document.getElementById('strengthSlider').addEventListener('input', (e) => {
                    this.minStrength = parseFloat(e.target.value);
                    this.loadData();
                });
                
                // Search
                document.getElementById('searchInput').addEventListener('input', (e) => {
                    this.searchNodes(e.target.value);
                });
                
                // Window resize
                window.addEventListener('resize', () => {
                    this.width = window.innerWidth;
                    this.height = window.innerHeight;
                    this.svg.attr('width', this.width).attr('height', this.height);
                    this.simulation.force('center', d3.forceCenter(this.width / 2, this.height / 2));
                });
            }
            
            searchNodes(query) {
                if (!query) {
                    this.svg.selectAll('.node').style('opacity', 1);
                    return;
                }
                
                this.svg.selectAll('.node')
                    .style('opacity', d => 
                        d.label.toLowerCase().includes(query.toLowerCase()) ? 1 : 0.2
                    );
            }
            
            updateStats(data) {
                const stats = document.getElementById('stats');
                stats.innerHTML = \`
                    Entities: \${data.nodes.length}<br>
                    Relationships: \${data.edges.length}<br>
                    Avg Connections: \${(data.edges.length * 2 / data.nodes.length).toFixed(1)}
                \`;
            }
            
            dragstarted(event, d) {
                if (!event.active) this.simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }
            
            dragged(event, d) {
                d.fx = event.x;
                d.fy = event.y;
            }
            
            dragended(event, d) {
                if (!event.active) this.simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }
        }
        
        // Initialize
        new KnowledgeGraphViz();
    </script>
</body>
</html>
`;

// Real-time AI Dashboard
const RealTimeAIDashboard = `
<!DOCTYPE html>
<html>
<head>
    <title>Soulfra AI Command Center</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script src="/socket.io/socket.io.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'SF Pro Display', -apple-system, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff; 
            min-height: 100vh;
            overflow-x: hidden;
        }
        .dashboard { padding: 20px; max-width: 1400px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 2.5em; font-weight: 300; margin-bottom: 10px; }
        .header .subtitle { opacity: 0.8; font-size: 1.1em; }
        
        .metrics-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px; 
        }
        
        .metric-card { 
            background: rgba(255,255,255,0.1); 
            backdrop-filter: blur(10px); 
            border-radius: 16px; 
            padding: 24px; 
            border: 1px solid rgba(255,255,255,0.2);
            transition: transform 0.3s ease;
        }
        
        .metric-card:hover { transform: translateY(-4px); }
        
        .metric-value { 
            font-size: 2.8em; 
            font-weight: 600; 
            margin-bottom: 8px;
            background: linear-gradient(45deg, #fff, #e0e0e0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .metric-label { opacity: 0.9; font-size: 0.95em; margin-bottom: 12px; }
        .metric-change { font-size: 0.85em; opacity: 0.8; }
        .metric-change.positive { color: #4ade80; }
        .metric-change.negative { color: #f87171; }
        
        .activity-section { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin-bottom: 30px; 
        }
        
        .activity-card { 
            background: rgba(255,255,255,0.1); 
            backdrop-filter: blur(10px); 
            border-radius: 16px; 
            padding: 24px; 
            border: 1px solid rgba(255,255,255,0.2);
            max-height: 400px;
            overflow-y: auto;
        }
        
        .activity-header { 
            font-size: 1.2em; 
            margin-bottom: 20px; 
            display: flex; 
            align-items: center; 
            gap: 10px; 
        }
        
        .activity-item { 
            display: flex; 
            align-items: center; 
            gap: 12px; 
            padding: 12px 0; 
            border-bottom: 1px solid rgba(255,255,255,0.1); 
        }
        
        .activity-icon { 
            width: 32px; 
            height: 32px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 14px; 
        }
        
        .activity-content { flex: 1; }
        .activity-title { font-weight: 500; margin-bottom: 4px; }
        .activity-meta { font-size: 0.85em; opacity: 0.7; }
        
        .status-indicators { 
            display: flex; 
            gap: 16px; 
            margin-bottom: 30px; 
            flex-wrap: wrap; 
        }
        
        .status-indicator { 
            display: flex; 
            align-items: center; 
            gap: 8px; 
            background: rgba(255,255,255,0.1); 
            padding: 12px 16px; 
            border-radius: 12px; 
        }
        
        .status-dot { 
            width: 8px; 
            height: 8px; 
            border-radius: 50%; 
        }
        
        .status-dot.healthy { background: #4ade80; }
        .status-dot.warning { background: #fbbf24; }
        .status-dot.error { background: #f87171; }
        
        .controls { 
            display: flex; 
            gap: 12px; 
            margin-bottom: 20px; 
            flex-wrap: wrap; 
        }
        
        .btn { 
            background: rgba(255,255,255,0.2); 
            border: none; 
            color: #fff; 
            padding: 12px 20px; 
            border-radius: 12px; 
            cursor: pointer; 
            font-size: 14px; 
            transition: all 0.3s ease; 
        }
        
        .btn:hover { background: rgba(255,255,255,0.3); transform: translateY(-2px); }
        .btn.primary { background: linear-gradient(45deg, #667eea, #764ba2); }
        
        .progress-bar { 
            width: 100%; 
            height: 8px; 
            background: rgba(255,255,255,0.2); 
            border-radius: 4px; 
            overflow: hidden; 
            margin-top: 8px; 
        }
        
        .progress-fill { 
            height: 100%; 
            background: linear-gradient(45deg, #4ade80, #22c55e); 
            transition: width 0.3s ease; 
        }
        
        @keyframes pulse { 
            0% { opacity: 1; } 
            50% { opacity: 0.5; } 
            100% { opacity: 1; } 
        }
        
        .pulse { animation: pulse 2s infinite; }
        
        @media (max-width: 768px) { 
            .activity-section { grid-template-columns: 1fr; }
            .metrics-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>🤖 Soulfra AI Command Center</h1>
            <div class="subtitle">Real-time AI operations monitoring and control</div>
        </div>
        
        <div class="status-indicators" id="statusIndicators">
            <div class="status-indicator">
                <div class="status-dot healthy"></div>
                <span>AI Services</span>
            </div>
            <div class="status-indicator">
                <div class="status-dot healthy"></div>
                <span>Knowledge Graph</span>
            </div>
            <div class="status-indicator">
                <div class="status-dot healthy"></div>
                <span>Background Jobs</span>
            </div>
            <div class="status-indicator">
                <div class="status-dot warning"></div>
                <span>Writing Assistant</span>
            </div>
        </div>
        
        <div class="metrics-grid" id="metricsGrid">
            <div class="metric-card">
                <div class="metric-value" id="totalDocs">0</div>
                <div class="metric-label">Total Documents</div>
                <div class="metric-change positive" id="docsChange">+0 today</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-value" id="embeddedDocs">0</div>
                <div class="metric-label">AI Processed</div>
                <div class="progress-bar">
                    <div class="progress-fill" id="embeddedProgress" style="width: 0%"></div>
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-value" id="searchQueries">0</div>
                <div class="metric-label">Search Queries</div>
                <div class="metric-change positive" id="searchChange">+0 this hour</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-value" id="queuedJobs">0</div>
                <div class="metric-label">Queued Jobs</div>
                <div class="metric-change" id="jobsChange">0 processing</div>
            </div>
        </div>
        
        <div class="controls">
            <button class="btn primary" onclick="processAllDocuments()">🚀 Process All Documents</button>
            <button class="btn" onclick="refreshData()">🔄 Refresh</button>
            <button class="btn" onclick="exportData()">📊 Export Data</button>
            <button class="btn" onclick="toggleRealTime()">📡 Real-time: ON</button>
        </div>
        
        <div class="activity-section">
            <div class="activity-card">
                <div class="activity-header">
                    <span>🔥</span>
                    <span>Recent AI Activity</span>
                </div>
                <div id="recentActivity"></div>
            </div>
            
            <div class="activity-card">
                <div class="activity-header">
                    <span>📈</span>
                    <span>Performance Metrics</span>
                </div>
                <div id="performanceMetrics"></div>
            </div>
        </div>
    </div>

    <script>
        class AICommandCenter {
            constructor() {
                this.socket = io();
                this.realTimeEnabled = true;
                this.activityLog = [];
                this.setupSocketListeners();
                this.refreshData();
                this.startRealTimeUpdates();
            }
            
            setupSocketListeners() {
                this.socket.on('ai:document:processed', (data) => {
                    this.addActivity('Document Processed', \`\${data.documentId} processed with AI\`, 'success');
                    this.refreshData();
                });
                
                this.socket.on('ai:batch:complete', (data) => {
                    this.addActivity('Batch Complete', \`Processed \${data.processed} documents\`, 'success');
                    this.refreshData();
                });
                
                this.socket.on('ai:search:performed', (data) => {
                    this.addActivity('Search Query', \`"\${data.query}" - \${data.results} results\`, 'info');
                });
            }
            
            async refreshData() {
                try {
                    const [health, jobStats] = await Promise.all([
                        fetch('/api/ai/health').then(r => r.json()),
                        fetch('/api/ai/jobs/stats').then(r => r.json())
                    ]);
                    
                    this.updateMetrics(health, jobStats);
                    this.updatePerformanceMetrics(health);
                } catch (error) {
                    console.error('Failed to refresh data:', error);
                }
            }
            
            updateMetrics(health, jobStats) {
                document.getElementById('totalDocs').textContent = health.stats.totalDocuments || 0;
                document.getElementById('embeddedDocs').textContent = health.stats.embeddedDocuments || 0;
                document.getElementById('queuedJobs').textContent = jobStats.pending || 0;
                
                // Update progress bar
                const totalDocs = health.stats.totalDocuments || 1;
                const embeddedDocs = health.stats.embeddedDocuments || 0;
                const progress = (embeddedDocs / totalDocs) * 100;
                document.getElementById('embeddedProgress').style.width = progress + '%';
                
                // Update change indicators
                document.getElementById('jobsChange').textContent = \`\${jobStats.processing || 0} processing\`;
            }
            
            updatePerformanceMetrics(health) {
                const metricsDiv = document.getElementById('performanceMetrics');
                metricsDiv.innerHTML = \`
                    <div class="activity-item">
                        <div class="activity-icon" style="background: #4ade80;">📊</div>
                        <div class="activity-content">
                            <div class="activity-title">Embedding Coverage</div>
                            <div class="activity-meta">\${health.stats.embeddingCoverage || 0}% of documents</div>
                        </div>
                    </div>
                    <div class="activity-item">
                        <div class="activity-icon" style="background: #3b82f6;">🎯</div>
                        <div class="activity-content">
                            <div class="activity-title">Categorization Coverage</div>
                            <div class="activity-meta">\${health.stats.categorizationCoverage || 0}% of documents</div>
                        </div>
                    </div>
                    <div class="activity-item">
                        <div class="activity-icon" style="background: #8b5cf6;">📝</div>
                        <div class="activity-content">
                            <div class="activity-title">Summary Coverage</div>
                            <div class="activity-meta">\${health.stats.summarizationCoverage || 0}% of documents</div>
                        </div>
                    </div>
                    <div class="activity-item">
                        <div class="activity-icon" style="background: #f59e0b;">⚡</div>
                        <div class="activity-content">
                            <div class="activity-title">System Health</div>
                            <div class="activity-meta">\${health.status === 'healthy' ? 'All systems operational' : 'Issues detected'}</div>
                        </div>
                    </div>
                \`;
            }
            
            addActivity(title, description, type) {
                const activity = {
                    title,
                    description,
                    type,
                    timestamp: new Date().toLocaleTimeString()
                };
                
                this.activityLog.unshift(activity);
                this.activityLog = this.activityLog.slice(0, 10); // Keep last 10
                
                this.renderActivity();
            }
            
            renderActivity() {
                const activityDiv = document.getElementById('recentActivity');
                activityDiv.innerHTML = this.activityLog.map(activity => \`
                    <div class="activity-item">
                        <div class="activity-icon" style="background: \${this.getActivityColor(activity.type)};">
                            \${this.getActivityIcon(activity.type)}
                        </div>
                        <div class="activity-content">
                            <div class="activity-title">\${activity.title}</div>
                            <div class="activity-meta">\${activity.description} • \${activity.timestamp}</div>
                        </div>
                    </div>
                \`).join('');
            }
            
            getActivityColor(type) {
                return {
                    success: '#4ade80',
                    info: '#3b82f6',
                    warning: '#fbbf24',
                    error: '#f87171'
                }[type] || '#6b7280';
            }
            
            getActivityIcon(type) {
                return {
                    success: '✅',
                    info: 'ℹ️',
                    warning: '⚠️',
                    error: '❌'
                }[type] || '📝';
            }
            
            startRealTimeUpdates() {
                setInterval(() => {
                    if (this.realTimeEnabled) {
                        this.refreshData();
                    }
                }, 5000); // Update every 5 seconds
            }
        }
        
        // Global functions
        async function processAllDocuments() {
            try {
                document.querySelector('.btn.primary').innerHTML = '⏳ Processing...';
                const response = await fetch('/api/ai/batch/process', { method: 'POST' });
                const result = await response.json();
                
                setTimeout(() => {
                    document.querySelector('.btn.primary').innerHTML = '🚀 Process All Documents';
                }, 2000);
                
                dashboard.addActivity('Batch Processing', result.message, 'info');
            } catch (error) {
                dashboard.addActivity('Error', 'Failed to start batch processing', 'error');
            }
        }
        
        function refreshData() {
            dashboard.refreshData();
        }
        
        function exportData() {
            // Implement data export
            dashboard.addActivity('Export', 'Data export started', 'info');
        }
        
        function toggleRealTime() {
            dashboard.realTimeEnabled = !dashboard.realTimeEnabled;
            const btn = event.target;
            btn.textContent = \`📡 Real-time: \${dashboard.realTimeEnabled ? 'ON' : 'OFF'}\`;
        }
        
        // Initialize dashboard
        const dashboard = new AICommandCenter();
    </script>
</body>
</html>
`;

// Export test runner
module.exports = {
  AIFeatureTestSuite,
  KnowledgeGraphVisualization,
  RealTimeAIDashboard
};