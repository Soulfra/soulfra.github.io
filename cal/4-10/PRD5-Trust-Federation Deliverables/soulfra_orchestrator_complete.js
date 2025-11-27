// ===== PACKAGE.JSON =====
{
  "name": "soulfra-knowledge-orchestrator",
  "version": "1.0.0",
  "description": "Your AI-powered knowledge orchestrator for building Soulfra faster",
  "main": "src/main.js",
  "scripts": {
    "start": "electron .",
    "dev": "nodemon --exec electron .",
    "build": "electron-builder",
    "setup": "node scripts/setup.js"
  },
  "dependencies": {
    "electron": "^28.0.0",
    "better-sqlite3": "^9.2.2",
    "googleapis": "^129.0.0",
    "openai": "^4.20.0",
    "@anthropic-ai/sdk": "^0.9.0",
    "mammoth": "^1.6.0",
    "pdf-parse": "^1.1.1",
    "tesseract.js": "^5.0.4",
    "fs-extra": "^11.2.0",
    "path": "^0.12.7",
    "uuid": "^9.0.1",
    "date-fns": "^3.0.6",
    "lodash": "^4.17.21",
    "chokidar": "^3.5.3",
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "electron-builder": "^24.9.1",
    "nodemon": "^3.0.2"
  },
  "build": {
    "appId": "com.soulfra.knowledge-orchestrator",
    "productName": "Soulfra Knowledge Orchestrator",
    "directories": {
      "output": "dist"
    },
    "files": [
      "src/**/*",
      "web/**/*",
      "node_modules/**/*"
    ]
  }
}

// ===== MAIN ELECTRON PROCESS (src/main.js) =====
const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const KnowledgeOrchestrator = require('./services/KnowledgeOrchestrator');
const AIService = require('./services/AIService');
const SyncService = require('./services/SyncService');

class SoulfraOrchestratorApp {
  constructor() {
    this.mainWindow = null;
    this.orchestrator = new KnowledgeOrchestrator();
    this.aiService = new AIService();
    this.syncService = new SyncService();
  }

  async initialize() {
    // Initialize services
    await this.orchestrator.initialize();
    await this.aiService.initialize();
    await this.syncService.initialize();

    // Create main window
    this.createMainWindow();
    this.setupIPC();
    this.createMenu();

    console.log('🧠 Soulfra Knowledge Orchestrator initialized');
  }

  createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true
      },
      title: 'Soulfra Knowledge Orchestrator',
      icon: path.join(__dirname, '../assets/icon.png')
    });

    // Load the web interface
    this.mainWindow.loadFile(path.join(__dirname, '../web/index.html'));

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.webContents.openDevTools();
    }
  }

  setupIPC() {
    // File processing
    ipcMain.handle('process-files', async (event, filePaths) => {
      try {
        const results = [];
        for (const filePath of filePaths) {
          const result = await this.orchestrator.processFile(filePath);
          results.push(result);
        }
        return { success: true, results };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Knowledge queries
    ipcMain.handle('query-knowledge', async (event, query) => {
      try {
        const result = await this.aiService.queryKnowledge(query);
        return { success: true, result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Get all documents
    ipcMain.handle('get-documents', async () => {
      try {
        const documents = await this.orchestrator.getAllDocuments();
        return { success: true, documents };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Sync with Google Drive
    ipcMain.handle('sync-drive', async () => {
      try {
        const result = await this.syncService.syncWithDrive();
        return { success: true, result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Open file dialog
    ipcMain.handle('open-file-dialog', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Documents', extensions: ['pdf', 'docx', 'txt', 'md'] },
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      return result;
    });

    // Get app stats
    ipcMain.handle('get-stats', async () => {
      try {
        const stats = await this.orchestrator.getStats();
        return { success: true, stats };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  createMenu() {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Add Documents',
            accelerator: 'CmdOrCtrl+O',
            click: async () => {
              const result = await dialog.showOpenDialog(this.mainWindow, {
                properties: ['openFile', 'multiSelections'],
                filters: [
                  { name: 'All Supported', extensions: ['pdf', 'docx', 'txt', 'md', 'png', 'jpg'] },
                  { name: 'All Files', extensions: ['*'] }
                ]
              });

              if (!result.canceled) {
                this.mainWindow.webContents.send('files-selected', result.filePaths);
              }
            }
          },
          { type: 'separator' },
          { role: 'quit' }
        ]
      },
      {
        label: 'Knowledge',
        submenu: [
          {
            label: 'Query AI',
            accelerator: 'CmdOrCtrl+K',
            click: () => {
              this.mainWindow.webContents.send('focus-query');
            }
          },
          {
            label: 'Sync with Drive',
            accelerator: 'CmdOrCtrl+S',
            click: async () => {
              this.mainWindow.webContents.send('sync-started');
              const result = await this.syncService.syncWithDrive();
              this.mainWindow.webContents.send('sync-completed', result);
            }
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'toggledevtools' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
}

// App lifecycle
app.whenReady().then(async () => {
  const soulfraApp = new SoulfraOrchestratorApp();
  await soulfraApp.initialize();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const soulfraApp = new SoulfraOrchestratorApp();
    await soulfraApp.initialize();
  }
});

// ===== KNOWLEDGE ORCHESTRATOR SERVICE (src/services/KnowledgeOrchestrator.js) =====
const Database = require('better-sqlite3');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const _ = require('lodash');

class KnowledgeOrchestrator {
  constructor() {
    this.db = null;
    this.documentsPath = path.join(process.cwd(), 'Soulfra-Documentation');
    this.categories = {
      'PRDs': ['prd', 'product', 'requirements', 'feature'],
      'Architecture': ['architecture', 'system', 'design', 'technical'],
      'Business': ['business', 'strategy', 'revenue', 'market'],
      'Ideas': ['idea', 'brainstorm', 'concept', 'thought'],
      'Code': ['code', 'implementation', 'script', 'api'],
      'Research': ['research', 'analysis', 'competitor', 'study']
    };
  }

  async initialize() {
    // Create directories
    await fs.ensureDir(this.documentsPath);
    Object.keys(this.categories).forEach(async category => {
      await fs.ensureDir(path.join(this.documentsPath, category));
    });

    // Initialize database
    this.db = new Database(path.join(this.documentsPath, 'knowledge.db'));
    this.createTables();

    console.log('📚 Knowledge Orchestrator initialized');
  }

  createTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        original_path TEXT NOT NULL,
        stored_path TEXT NOT NULL,
        category TEXT NOT NULL,
        file_type TEXT NOT NULL,
        content TEXT,
        summary TEXT,
        tags TEXT,
        metadata TEXT,
        relationships TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS knowledge_graph (
        id TEXT PRIMARY KEY,
        source_doc_id TEXT NOT NULL,
        target_doc_id TEXT NOT NULL,
        relationship_type TEXT NOT NULL,
        strength REAL DEFAULT 0.5,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_doc_id) REFERENCES documents (id),
        FOREIGN KEY (target_doc_id) REFERENCES documents (id)
      );

      CREATE TABLE IF NOT EXISTS concepts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        category TEXT,
        frequency INTEGER DEFAULT 1,
        documents TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS queries (
        id TEXT PRIMARY KEY,
        query_text TEXT NOT NULL,
        response TEXT,
        relevant_docs TEXT,
        confidence REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  async processFile(filePath) {
    try {
      console.log(`📄 Processing file: ${path.basename(filePath)}`);

      // Extract content based on file type
      const content = await this.extractContent(filePath);
      
      // Analyze and categorize
      const analysis = await this.analyzeContent(content, filePath);
      
      // Store in organized structure
      const storedPath = await this.storeFile(filePath, analysis.category);
      
      // Save to database
      const docId = await this.saveDocument(filePath, storedPath, content, analysis);
      
      // Update knowledge graph
      await this.updateKnowledgeGraph(docId, content, analysis);

      return {
        id: docId,
        filename: path.basename(filePath),
        category: analysis.category,
        summary: analysis.summary,
        tags: analysis.tags,
        confidence: analysis.confidence
      };
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
      throw error;
    }
  }

  async extractContent(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    try {
      switch (ext) {
        case '.txt':
        case '.md':
          return await fs.readFile(filePath, 'utf8');
          
        case '.docx':
          const docResult = await mammoth.extractRawText({ path: filePath });
          return docResult.value;
          
        case '.pdf':
          const pdfBuffer = await fs.readFile(filePath);
          const pdfResult = await pdfParse(pdfBuffer);
          return pdfResult.text;
          
        case '.png':
        case '.jpg':
        case '.jpeg':
          const ocrResult = await Tesseract.recognize(filePath, 'eng');
          return ocrResult.data.text;
          
        default:
          // Try reading as text for unknown types
          return await fs.readFile(filePath, 'utf8');
      }
    } catch (error) {
      console.error(`Content extraction failed for ${filePath}:`, error.message);
      return '';
    }
  }

  async analyzeContent(content, filePath) {
    const filename = path.basename(filePath).toLowerCase();
    const contentLower = content.toLowerCase();
    
    // Determine category
    let bestCategory = 'Ideas';
    let maxScore = 0;
    
    Object.entries(this.categories).forEach(([category, keywords]) => {
      const score = keywords.reduce((sum, keyword) => {
        const filenameMatches = (filename.includes(keyword) ? 2 : 0);
        const contentMatches = (contentLower.split(keyword).length - 1) * 0.1;
        return sum + filenameMatches + contentMatches;
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        bestCategory = category;
      }
    });

    // Extract key concepts
    const concepts = this.extractConcepts(content);
    
    // Generate summary
    const summary = this.generateSummary(content);
    
    // Extract tags
    const tags = this.extractTags(content, filename);

    return {
      category: bestCategory,
      concepts,
      summary,
      tags,
      confidence: Math.min(maxScore / 5, 1.0)
    };
  }

  extractConcepts(content) {
    // Simple concept extraction - look for capitalized phrases and important terms
    const concepts = [];
    
    // Extract headers (markdown style)
    const headerRegex = /^#+\s+(.+)$/gm;
    let match;
    while ((match = headerRegex.exec(content)) !== null) {
      concepts.push(match[1].trim());
    }
    
    // Extract potential concept phrases (2-3 capitalized words)
    const conceptRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/g;
    while ((match = conceptRegex.exec(content)) !== null) {
      if (match[1].length > 5 && match[1].length < 50) {
        concepts.push(match[1]);
      }
    }
    
    // Remove duplicates and return top concepts
    return _.uniq(concepts).slice(0, 10);
  }

  generateSummary(content) {
    // Simple extractive summary - first paragraph or first few sentences
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    if (sentences.length === 0) return 'No summary available';
    
    // Take first 2-3 sentences up to 200 characters
    let summary = sentences[0].trim();
    let totalLength = summary.length;
    
    for (let i = 1; i < sentences.length && i < 3; i++) {
      if (totalLength + sentences[i].length < 200) {
        summary += '. ' + sentences[i].trim();
        totalLength += sentences[i].length;
      } else {
        break;
      }
    }
    
    return summary + '.';
  }

  extractTags(content, filename) {
    const tags = [];
    
    // Add category-based tags
    Object.entries(this.categories).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (filename.includes(keyword) || content.toLowerCase().includes(keyword)) {
          tags.push(keyword);
        }
      });
    });
    
    // Add specific Soulfra-related tags
    const soulfraTerms = [
      'trust', 'agent', 'federation', 'marketplace', 'ai', 'routing',
      'collaboration', 'real-time', 'privacy', 'reputation', 'scoring'
    ];
    
    soulfraTerms.forEach(term => {
      if (content.toLowerCase().includes(term)) {
        tags.push(term);
      }
    });
    
    return _.uniq(tags).slice(0, 8);
  }

  async storeFile(originalPath, category) {
    const filename = path.basename(originalPath);
    const ext = path.extname(filename);
    const baseName = path.basename(filename, ext);
    
    // Create unique filename if needed
    const categoryPath = path.join(this.documentsPath, category);
    let storedPath = path.join(categoryPath, filename);
    let counter = 1;
    
    while (await fs.pathExists(storedPath)) {
      const newFilename = `${baseName}_${counter}${ext}`;
      storedPath = path.join(categoryPath, newFilename);
      counter++;
    }
    
    // Copy file to organized location
    await fs.copy(originalPath, storedPath);
    
    return storedPath;
  }

  async saveDocument(originalPath, storedPath, content, analysis) {
    const docId = uuidv4();
    const filename = path.basename(originalPath);
    const fileType = path.extname(filename).substring(1);
    
    const stmt = this.db.prepare(`
      INSERT INTO documents (
        id, filename, original_path, stored_path, category, file_type,
        content, summary, tags, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    stmt.run(
      docId,
      filename,
      originalPath,
      storedPath,
      analysis.category,
      fileType,
      content,
      analysis.summary,
      JSON.stringify(analysis.tags),
      JSON.stringify({
        concepts: analysis.concepts,
        confidence: analysis.confidence,
        wordCount: content.split(/\s+/).length
      })
    );
    
    // Update concepts table
    await this.updateConcepts(analysis.concepts, docId);
    
    return docId;
  }

  async updateConcepts(concepts, docId) {
    for (const concept of concepts) {
      const existing = this.db.prepare('SELECT * FROM concepts WHERE name = ?').get(concept);
      
      if (existing) {
        // Update existing concept
        const documents = JSON.parse(existing.documents || '[]');
        if (!documents.includes(docId)) {
          documents.push(docId);
        }
        
        this.db.prepare(`
          UPDATE concepts 
          SET frequency = frequency + 1, documents = ?
          WHERE name = ?
        `).run(JSON.stringify(documents), concept);
      } else {
        // Create new concept
        this.db.prepare(`
          INSERT INTO concepts (id, name, documents, frequency)
          VALUES (?, ?, ?, 1)
        `).run(uuidv4(), concept, JSON.stringify([docId]));
      }
    }
  }

  async updateKnowledgeGraph(docId, content, analysis) {
    // Find relationships with existing documents
    const existingDocs = this.db.prepare('SELECT id, content, tags FROM documents WHERE id != ?').all(docId);
    
    for (const existingDoc of existingDocs) {
      const similarity = this.calculateSimilarity(content, existingDoc.content);
      const tagOverlap = this.calculateTagOverlap(analysis.tags, JSON.parse(existingDoc.tags || '[]'));
      
      const relationshipStrength = (similarity * 0.7) + (tagOverlap * 0.3);
      
      if (relationshipStrength > 0.3) {
        const relationshipId = uuidv4();
        const relationType = relationshipStrength > 0.7 ? 'strong' : 'moderate';
        
        this.db.prepare(`
          INSERT INTO knowledge_graph (id, source_doc_id, target_doc_id, relationship_type, strength)
          VALUES (?, ?, ?, ?, ?)
        `).run(relationshipId, docId, existingDoc.id, relationType, relationshipStrength);
      }
    }
  }

  calculateSimilarity(content1, content2) {
    // Simple word-based similarity
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  calculateTagOverlap(tags1, tags2) {
    const set1 = new Set(tags1);
    const set2 = new Set(tags2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  async getAllDocuments() {
    return this.db.prepare(`
      SELECT id, filename, category, summary, tags, created_at
      FROM documents
      ORDER BY created_at DESC
    `).all();
  }

  async searchDocuments(query) {
    const searchTerm = `%${query.toLowerCase()}%`;
    
    return this.db.prepare(`
      SELECT id, filename, category, summary, tags
      FROM documents
      WHERE LOWER(content) LIKE ? OR LOWER(filename) LIKE ? OR LOWER(summary) LIKE ?
      ORDER BY created_at DESC
    `).all(searchTerm, searchTerm, searchTerm);
  }

  async getStats() {
    const totalDocs = this.db.prepare('SELECT COUNT(*) as count FROM documents').get().count;
    const categories = this.db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM documents 
      GROUP BY category
    `).all();
    
    const concepts = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM concepts
    `).get().count;
    
    const relationships = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM knowledge_graph
    `).get().count;
    
    return {
      totalDocuments: totalDocs,
      categoriesBreakdown: categories,
      totalConcepts: concepts,
      totalRelationships: relationships
    };
  }

  async getKnowledgeGraph() {
    const nodes = this.db.prepare(`
      SELECT id, filename, category 
      FROM documents
    `).all();
    
    const edges = this.db.prepare(`
      SELECT source_doc_id, target_doc_id, relationship_type, strength
      FROM knowledge_graph
    `).all();
    
    return { nodes, edges };
  }
}

module.exports = KnowledgeOrchestrator;

// ===== AI SERVICE (src/services/AIService.js) =====
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class AIService {
  constructor() {
    this.openai = null;
    this.anthropic = null;
    this.db = null;
    this.knowledgeBase = new Map();
  }

  async initialize() {
    // Initialize AI providers
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
    
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }

    // Connect to knowledge database
    this.db = new Database(path.join(process.cwd(), 'Soulfra-Documentation', 'knowledge.db'));
    
    // Load knowledge base into memory
    await this.loadKnowledgeBase();
    
    console.log('🤖 AI Service initialized');
  }

  async loadKnowledgeBase() {
    try {
      const documents = this.db.prepare(`
        SELECT id, filename, category, content, summary, tags, metadata
        FROM documents
      `).all();
      
      documents.forEach(doc => {
        this.knowledgeBase.set(doc.id, {
          ...doc,
          tags: JSON.parse(doc.tags || '[]'),
          metadata: JSON.parse(doc.metadata || '{}')
        });
      });
      
      console.log(`📚 Loaded ${documents.length} documents into knowledge base`);
    } catch (error) {
      console.error('❌ Failed to load knowledge base:', error.message);
    }
  }

  async queryKnowledge(query) {
    try {
      // Search relevant documents
      const relevantDocs = await this.findRelevantDocuments(query);
      
      // Create context from relevant documents
      const context = this.buildContext(relevantDocs);
      
      // Query AI with context
      const response = await this.queryAIWithContext(query, context);
      
      // Save query for learning
      await this.saveQuery(query, response, relevantDocs);
      
      return {
        answer: response,
        sources: relevantDocs.map(doc => ({
          filename: doc.filename,
          category: doc.category,
          summary: doc.summary
        })),
        confidence: this.calculateConfidence(relevantDocs, query)
      };
    } catch (error) {
      console.error('❌ AI query failed:', error.message);
      throw error;
    }
  }

  async findRelevantDocuments(query) {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const relevantDocs = [];
    
    for (const [docId, doc] of this.knowledgeBase) {
      let relevanceScore = 0;
      
      // Check content relevance
      queryTerms.forEach(term => {
        if (doc.content.toLowerCase().includes(term)) {
          relevanceScore += 2;
        }
        if (doc.summary.toLowerCase().includes(term)) {
          relevanceScore += 3;
        }
        if (doc.filename.toLowerCase().includes(term)) {
          relevanceScore += 4;
        }
        if (doc.tags.some(tag => tag.toLowerCase().includes(term))) {
          relevanceScore += 5;
        }
      });
      
      if (relevanceScore > 0) {
        relevantDocs.push({
          ...doc,
          relevanceScore
        });
      }
    }
    
    // Sort by relevance and return top 5
    return relevantDocs
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);
  }

  buildContext(relevantDocs) {
    let context = "Based on the Soulfra documentation, here's what I know:\n\n";
    
    relevantDocs.forEach((doc, index) => {
      context += `## Document ${index + 1}: ${doc.filename} (${doc.category})\n`;
      context += `Summary: ${doc.summary}\n`;
      context += `Key concepts: ${doc.tags.join(', ')}\n`;
      
      // Include relevant excerpts from content
      const excerpt = doc.content.substring(0, 500);
      context += `Content excerpt: ${excerpt}...\n\n`;
    });
    
    return context;
  }

  async queryAIWithContext(query, context) {
    const systemPrompt = `You are the Soulfra AI Assistant - an expert on the Soulfra platform architecture, features, and strategy. You have been trained on the complete Soulfra knowledge base.

Your role:
1. Answer questions about Soulfra with deep technical and business understanding
2. Generate code suggestions based on Soulfra architecture patterns
3. Provide strategic insights for building and launching Soulfra
4. Help prioritize features and implementation approaches
5. Suggest competitive advantages and market positioning

Context from Soulfra documentation:
${context}

Guidelines:
- Be specific and actionable
- Reference the documentation when relevant
- Focus on practical implementation advice
- Consider business implications of technical decisions
- Suggest code, features, or strategies that align with Soulfra's vision`;

    const userPrompt = `Question about Soulfra: ${query}

Please provide a comprehensive answer based on the Soulfra documentation and your understanding of the platform.`;

    try {
      // Try Anthropic first (better for reasoning)
      if (this.anthropic) {
        const response = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }]
        });
        
        return response.content[0].text;
      }
      
      // Fallback to OpenAI
      if (this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 4000,
          temperature: 0.7
        });
        
        return response.choices[0].message.content;
      }
      
      // Mock response if no API keys
      return this.generateMockResponse(query, context);
      
    } catch (error) {
      console.error('❌ AI API call failed:', error.message);
      return this.generateMockResponse(query, context);
    }
  }

  generateMockResponse(query, context) {
    // Simple mock response for testing without API keys
    return `Based on the Soulfra documentation, here's my analysis of "${query}":

This appears to be related to ${this.extractCategory(query)}. From the available documentation, I can see this connects to several key concepts in the Soulfra platform.

Key insights:
- This relates to the core Soulfra architecture patterns
- Implementation should follow the trust-first design principles
- Consider the business implications for user adoption and revenue

Recommendations:
1. Review the relevant PRDs for detailed requirements
2. Ensure this aligns with the federation and trust systems
3. Consider how this impacts the agent marketplace strategy

Note: This is a mock response. Connect your OpenAI or Anthropic API key for full AI capabilities.`;
  }

  extractCategory(query) {
    const categories = {
      'trust': 'trust and federation systems',
      'agent': 'agent marketplace and management',
      'ai': 'AI routing and provider integration',
      'collaboration': 'real-time collaboration features',
      'architecture': 'system architecture and design',
      'business': 'business strategy and revenue'
    };
    
    for (const [keyword, category] of Object.entries(categories)) {
      if (query.toLowerCase().includes(keyword)) {
        return category;
      }
    }
    
    return 'general platform features';
  }

  calculateConfidence(relevantDocs, query) {
    if (relevantDocs.length === 0) return 0.1;
    
    const avgRelevance = relevantDocs.reduce((sum, doc) => sum + doc.relevanceScore, 0) / relevantDocs.length;
    const docCount = Math.min(relevantDocs.length / 5, 1); // More docs = higher confidence
    
    return Math.min(avgRelevance / 10 * docCount, 0.95);
  }

  async saveQuery(query, response, relevantDocs) {
    try {
      const queryId = uuidv4();
      
      this.db.prepare(`
        INSERT INTO queries (id, query_text, response, relevant_docs, confidence)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        queryId,
        query,
        response,
        JSON.stringify(relevantDocs.map(doc => doc.id)),
        this.calculateConfidence(relevantDocs, query)
      );
    } catch (error) {
      console.error('Failed to save query:', error.message);
    }
  }

  async generateCode(prompt, context = '') {
    const codePrompt = `Generate production-ready code for Soulfra based on this request: ${prompt}

Context about Soulfra architecture:
${context}

Requirements:
- Follow Soulfra's architectural patterns
- Include proper error handling
- Use TypeScript where appropriate
- Follow security best practices
- Include comments explaining the logic

Code:`;

    try {
      if (this.anthropic) {
        const response = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          messages: [{ role: 'user', content: codePrompt }]
        });
        
        return response.content[0].text;
      }
      
      if (this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: codePrompt }],
          max_tokens: 4000
        });
        
        return response.choices[0].message.content;
      }
      
      return '// Connect your AI API key to generate Soulfra-optimized code';
      
    } catch (error) {
      console.error('Code generation failed:', error.message);
      throw error;
    }
  }

  async analyzeIdea(idea, relatedDocs = []) {
    const analysisPrompt = `Analyze this idea for the Soulfra platform: ${idea}

Related documentation:
${relatedDocs.map(doc => `- ${doc.filename}: ${doc.summary}`).join('\n')}

Provide analysis on:
1. Alignment with Soulfra's vision and architecture
2. Implementation complexity and timeline
3. Business impact and user value
4. Technical requirements and dependencies
5. Competitive advantages this could create
6. Potential risks or challenges

Analysis:`;

    try {
      const response = await this.queryAIWithContext(analysisPrompt, '');
      return response;
    } catch (error) {
      console.error('Idea analysis failed:', error.message);
      throw error;
    }
  }
}

module.exports = AIService;

// ===== SYNC SERVICE (src/services/SyncService.js) =====
const { google } = require('googleapis');
const fs = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar');
const Database = require('better-sqlite3');

class SyncService {
  constructor() {
    this.drive = null;
    this.auth = null;
    this.db = null;
    this.watcher = null;
    this.syncFolder = 'Soulfra-Knowledge-Sync';
    this.documentsPath = path.join(process.cwd(), 'Soulfra-Documentation');
  }

  async initialize() {
    try {
      // Initialize Google Drive API
      await this.initializeGoogleDrive();
      
      // Connect to database
      this.db = new Database(path.join(this.documentsPath, 'knowledge.db'));
      
      // Set up file watching
      this.setupFileWatcher();
      
      console.log('☁️ Sync Service initialized');
    } catch (error) {
      console.error('❌ Sync service initialization failed:', error.message);
    }
  }

  async initializeGoogleDrive() {
    const credentialsPath = path.join(process.cwd(), 'credentials.json');
    const tokenPath = path.join(process.cwd(), 'token.json');
    
    if (!await fs.pathExists(credentialsPath)) {
      console.log('⚠️ Google Drive credentials not found. Sync disabled.');
      return;
    }

    try {
      const credentials = await fs.readJson(credentialsPath);
      const { client_secret, client_id, redirect_uris } = credentials.installed;
      
      this.auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
      
      // Check for existing token
      if (await fs.pathExists(tokenPath)) {
        const token = await fs.readJson(tokenPath);
        this.auth.setCredentials(token);
      } else {
        console.log('⚠️ Google Drive token not found. Run setup to authenticate.');
        return;
      }
      
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      
      // Test connection
      await this.drive.files.list({ pageSize: 1 });
      console.log('✅ Google Drive connected');
      
    } catch (error) {
      console.error('❌ Google Drive setup failed:', error.message);
    }
  }

  setupFileWatcher() {
    if (this.watcher) {
      this.watcher.close();
    }

    this.watcher = chokidar.watch(this.documentsPath, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true
    });

    this.watcher
      .on('add', path => this.handleFileChange('add', path))
      .on('change', path => this.handleFileChange('change', path))
      .on('unlink', path => this.handleFileChange('delete', path));
  }

  async handleFileChange(event, filePath) {
    if (!this.drive) return;

    try {
      switch (event) {
        case 'add':
        case 'change':
          await this.uploadToGoogleDrive(filePath);
          break;
        case 'delete':
          await this.deleteFromGoogleDrive(filePath);
          break;
      }
    } catch (error) {
      console.error(`Sync failed for ${filePath}:`, error.message);
    }
  }

  async syncWithDrive() {
    if (!this.drive) {
      return { success: false, message: 'Google Drive not configured' };
    }

    try {
      console.log('☁️ Starting Google Drive sync...');
      
      // Create sync folder if needed
      const syncFolderId = await this.ensureSyncFolder();
      
      // Upload local files
      const uploadResults = await this.uploadAllLocalFiles(syncFolderId);
      
      // Download remote changes
      const downloadResults = await this.downloadRemoteChanges(syncFolderId);
      
      console.log('✅ Google Drive sync completed');
      
      return {
        success: true,
        uploaded: uploadResults.length,
        downloaded: downloadResults.length,
        message: `Synced ${uploadResults.length} uploads, ${downloadResults.length} downloads`
      };
      
    } catch (error) {
      console.error('❌ Sync failed:', error.message);
      return { success: false, message: error.message };
    }
  }

  async ensureSyncFolder() {
    // Search for existing sync folder
    const response = await this.drive.files.list({
      q: `name='${this.syncFolder}' and mimeType='application/vnd.google-apps.folder'`,
      spaces: 'drive'
    });

    if (response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    // Create sync folder
    const folderMetadata = {
      name: this.syncFolder,
      mimeType: 'application/vnd.google-apps.folder'
    };

    const folder = await this.drive.files.create({
      resource: folderMetadata,
      fields: 'id'
    });

    return folder.data.id;
  }

  async uploadToGoogleDrive(filePath) {
    if (!this.drive) return;

    try {
      const relativePath = path.relative(this.documentsPath, filePath);
      const fileName = path.basename(filePath);
      
      // Check if file already exists
      const existing = await this.drive.files.list({
        q: `name='${fileName}' and parents in '${await this.ensureSyncFolder()}'`
      });

      const media = {
        mimeType: 'application/octet-stream',
        body: fs.createReadStream(filePath)
      };

      if (existing.data.files.length > 0) {
        // Update existing file
        await this.drive.files.update({
          fileId: existing.data.files[0].id,
          media: media
        });
      } else {
        // Upload new file
        const fileMetadata = {
          name: fileName,
          parents: [await this.ensureSyncFolder()]
        };

        await this.drive.files.create({
          resource: fileMetadata,
          media: media,
          fields: 'id'
        });
      }

      console.log(`📤 Uploaded: ${fileName}`);
    } catch (error) {
      console.error(`Upload failed for ${filePath}:`, error.message);
    }
  }

  async uploadAllLocalFiles(syncFolderId) {
    const files = await this.getAllLocalFiles();
    const results = [];

    for (const filePath of files) {
      try {
        await this.uploadToGoogleDrive(filePath);
        results.push(filePath);
      } catch (error) {
        console.error(`Failed to upload ${filePath}:`, error.message);
      }
    }

    return results;
  }

  async downloadRemoteChanges(syncFolderId) {
    try {
      const response = await this.drive.files.list({
        q: `'${syncFolderId}' in parents`,
        fields: 'files(id, name, modifiedTime)'
      });

      const results = [];
      
      for (const file of response.data.files) {
        const localPath = path.join(this.documentsPath, file.name);
        
        // Check if local file is older
        if (await this.shouldDownload(localPath, file.modifiedTime)) {
          await this.downloadFile(file.id, localPath);
          results.push(localPath);
        }
      }

      return results;
    } catch (error) {
      console.error('Download failed:', error.message);
      return [];
    }
  }

  async shouldDownload(localPath, remoteModifiedTime) {
    if (!await fs.pathExists(localPath)) {
      return true; // File doesn't exist locally
    }

    const localStats = await fs.stat(localPath);
    const localModifiedTime = localStats.mtime.toISOString();
    
    return new Date(remoteModifiedTime) > new Date(localModifiedTime);
  }

  async downloadFile(fileId, localPath) {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      });

      await fs.ensureDir(path.dirname(localPath));
      await fs.writeFile(localPath, response.data);
      
      console.log(`📥 Downloaded: ${path.basename(localPath)}`);
    } catch (error) {
      console.error(`Download failed for file ${fileId}:`, error.message);
    }
  }

  async getAllLocalFiles() {
    const files = [];
    
    const scanDir = async (dir) => {
      const items = await fs.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
          await scanDir(fullPath);
        } else if (!item.name.endsWith('.db')) {
          files.push(fullPath);
        }
      }
    };

    await scanDir(this.documentsPath);
    return files;
  }

  async deleteFromGoogleDrive(filePath) {
    if (!this.drive) return;

    try {
      const fileName = path.basename(filePath);
      
      const response = await this.drive.files.list({
        q: `name='${fileName}' and parents in '${await this.ensureSyncFolder()}'`
      });

      for (const file of response.data.files) {
        await this.drive.files.delete({ fileId: file.id });
        console.log(`🗑️ Deleted from Drive: ${fileName}`);
      }
    } catch (error) {
      console.error(`Delete failed for ${filePath}:`, error.message);
    }
  }

  async createBackup() {
    if (!this.drive) {
      return { success: false, message: 'Google Drive not configured' };
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `soulfra-backup-${timestamp}.zip`;
      
      // Create zip of entire documentation folder
      const archiver = require('archiver');
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      const backupPath = path.join(process.cwd(), backupName);
      const output = fs.createWriteStream(backupPath);
      
      archive.pipe(output);
      archive.directory(this.documentsPath, false);
      await archive.finalize();
      
      // Upload backup to Drive
      const fileMetadata = {
        name: backupName,
        parents: [await this.ensureSyncFolder()]
      };

      const media = {
        mimeType: 'application/zip',
        body: fs.createReadStream(backupPath)
      };

      await this.drive.files.create({
        resource: fileMetadata,
        media: media
      });

      // Clean up local backup
      await fs.remove(backupPath);
      
      return { success: true, message: `Backup created: ${backupName}` };
      
    } catch (error) {
      console.error('Backup failed:', error.message);
      return { success: false, message: error.message };
    }
  }
}

module.exports = SyncService;