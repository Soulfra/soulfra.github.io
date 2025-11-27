// ==========================================
// SOULFRA SERVER.JS INTEGRATION CODE
// Add this to your existing server.js file
// ==========================================

// Add these imports at the top of your existing server.js
// (after existing imports)

// AI Features integration (optional - only loads if enabled)
let AIFeaturesPlugin = null;
try {
  if (process.env.ENABLE_AI_FEATURES !== 'false') {
    const aiFeatures = require('./ai-features');
    AIFeaturesPlugin = aiFeatures.AIFeaturesPlugin;
  }
} catch (error) {
  console.log('ℹ️ AI Features not available:', error.message);
}

// ==========================================
// Add this AFTER your existing route definitions
// but BEFORE app.listen()
// ==========================================

// AI Features Plugin Initialization
if (AIFeaturesPlugin && db && providerManager) {
  try {
    console.log('🤖 Initializing AI Features...');
    
    // Initialize the AI plugin with existing infrastructure
    const aiPlugin = new AIFeaturesPlugin(app, db, providerManager, io);
    
    // Add AI health check to existing health endpoint
    const originalHealthHandler = app._router.stack.find(
      layer => layer.route?.path === '/health'
    );
    
    // Extend health check with AI status
    app.get('/health/ai', async (req, res) => {
      try {
        const health = await aiPlugin.ai.healthCheck();
        res.json(health);
      } catch (error) {
        res.status(500).json({
          status: 'error',
          error: error.message
        });
      }
    });
    
    console.log('✅ AI Features initialized successfully');
    console.log('📊 AI Dashboard: http://localhost:' + (process.env.PORT || 3001) + '/ai/dashboard.html');
    console.log('🔍 AI Search: http://localhost:' + (process.env.PORT || 3001) + '/ai/search.html');
    
  } catch (error) {
    console.error('❌ AI Features initialization failed:', error);
    console.log('🔄 Server continuing without AI features...');
  }
} else {
  console.log('⏭️ AI Features disabled or dependencies missing');
}

// ==========================================
// OPTIONAL: Auto-process documents on creation
// Add this middleware BEFORE your existing document routes
// ==========================================

// Auto-process new documents with AI (if enabled)
if (process.env.AI_AUTO_PROCESS === 'true' && AIFeaturesPlugin) {
  app.use('/api/documents', (req, res, next) => {
    if (req.method === 'POST') {
      // Hook into response to process document after creation
      const originalJson = res.json;
      res.json = function(data) {
        // Send response first
        originalJson.call(this, data);
        
        // Then process with AI asynchronously
        if (data && data.id) {
          setTimeout(async () => {
            try {
              console.log(`🤖 Auto-processing document: ${data.id}`);
              
              // Get AI instance from the plugin
              const aiRoutes = new (require('./ai-features').AIRoutes)(db, providerManager, io);
              await aiRoutes.ai.processDocument(data.id, ['categorize']);
              
              console.log(`✅ Auto-processed: ${data.id}`);
              
              // Emit real-time update
              if (io) {
                io.emit('ai:document:auto-processed', {
                  documentId: data.id,
                  timestamp: new Date()
                });
              }
              
            } catch (error) {
              console.error(`❌ Auto-processing failed for ${data.id}:`, error.message);
            }
          }, 1000); // Process after 1 second delay
        }
      };
    }
    next();
  });
}

// ==========================================
// OPTIONAL: Enhanced document GET with AI info
// Extends existing document endpoint with AI data
// ==========================================

// Middleware to add AI info to document responses
app.use('/api/documents/:id', async (req, res, next) => {
  if (req.method === 'GET' && AIFeaturesPlugin) {
    const originalJson = res.json;
    res.json = async function(data) {
      try {
        // Get AI info for this document
        const aiRoutes = new (require('./ai-features').AIRoutes)(db, providerManager);
        const aiInfo = await aiRoutes.ai.getDocumentAI(req.params.id);
        
        // Add AI info to response
        if (aiInfo && data) {
          data.ai = {
            category: aiInfo.category,
            summary: aiInfo.summary,
            hasEmbedding: !!aiInfo.processedAt,
            related: aiInfo.related?.slice(0, 3) // Top 3 related docs
          };
        }
      } catch (error) {
        console.warn('⚠️ Failed to add AI info to document response:', error.message);
      }
      
      originalJson.call(this, data);
    };
  }
  next();
});

// ==========================================
// EXAMPLE: How to use AI features in existing routes
// ==========================================

// Example: Enhanced search endpoint that combines keyword + semantic search
app.get('/api/search/enhanced', async (req, res) => {
  const { query, type, category } = req.query;
  
  try {
    let results = [];
    
    // 1. Traditional keyword search (your existing logic)
    const keywordResults = await db.all(`
      SELECT * FROM documents 
      WHERE content LIKE ? OR title LIKE ?
      ${type ? 'AND type = ?' : ''}
      ${category ? 'AND category = ?' : ''}
      LIMIT 10
    `, [`%${query}%`, `%${query}%`, type, category].filter(Boolean));
    
    // 2. Semantic search (if AI features available)
    let semanticResults = [];
    if (AIFeaturesPlugin && query) {
      try {
        const aiRoutes = new (require('./ai-features').AIRoutes)(db, providerManager);
        const aiSearch = await aiRoutes.ai.search.search(query, {
          limit: 10,
          filters: { type, category }
        });
        semanticResults = aiSearch.results;
      } catch (error) {
        console.warn('Semantic search failed, using keyword only:', error.message);
      }
    }
    
    // 3. Combine and rank results
    const combinedResults = [];
    const seenIds = new Set();
    
    // Add keyword results first (exact matches)
    keywordResults.forEach(doc => {
      if (!seenIds.has(doc.id)) {
        combinedResults.push({ ...doc, searchType: 'keyword', score: 1.0 });
        seenIds.add(doc.id);
      }
    });
    
    // Add semantic results with similarity scores
    semanticResults.forEach(doc => {
      if (!seenIds.has(doc.documentId)) {
        combinedResults.push({
          ...doc,
          id: doc.documentId,
          searchType: 'semantic',
          score: doc.similarity
        });
        seenIds.add(doc.documentId);
      }
    });
    
    // Sort by score (keyword results first, then by similarity)
    combinedResults.sort((a, b) => {
      if (a.searchType === 'keyword' && b.searchType === 'semantic') return -1;
      if (a.searchType === 'semantic' && b.searchType === 'keyword') return 1;
      return b.score - a.score;
    });
    
    res.json({
      query,
      results: combinedResults.slice(0, 15),
      meta: {
        keywordCount: keywordResults.length,
        semanticCount: semanticResults.length,
        totalUnique: combinedResults.length,
        aiEnabled: !!AIFeaturesPlugin
      }
    });
    
  } catch (error) {
    console.error('Enhanced search failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// WEBSOCKET EVENTS FOR AI FEATURES
// Add to your existing Socket.IO setup
// ==========================================

// Add these event handlers to your existing io.on('connection') block
if (io && AIFeaturesPlugin) {
  io.on('connection', (socket) => {
    
    // AI-specific events
    socket.on('ai:search', async (data) => {
      try {
        const aiRoutes = new (require('./ai-features').AIRoutes)(db, providerManager);
        const results = await aiRoutes.ai.search.search(data.query, data.options);
        socket.emit('ai:search:results', results);
      } catch (error) {
        socket.emit('ai:search:error', { error: error.message });
      }
    });
    
    socket.on('ai:process:document', async (data) => {
      try {
        const aiRoutes = new (require('./ai-features').AIRoutes)(db, providerManager);
        const result = await aiRoutes.ai.processDocument(data.documentId, data.features);
        
        // Emit to all clients
        io.emit('ai:document:processed', {
          documentId: data.documentId,
          result,
          processedBy: socket.userId || 'anonymous'
        });
        
      } catch (error) {
        socket.emit('ai:process:error', { error: error.message });
      }
    });
    
    socket.on('ai:get:related', async (data) => {
      try {
        const aiRoutes = new (require('./ai-features').AIRoutes)(db, providerManager);
        const related = await aiRoutes.ai.embeddings.findSimilar(data.documentId, 5);
        socket.emit('ai:related:results', { documentId: data.documentId, related });
      } catch (error) {
        socket.emit('ai:related:error', { error: error.message });
      }
    });
    
  });
}

// ==========================================
// STARTUP TASKS (Optional)
// Add after server starts listening
// ==========================================

// Add this after your app.listen() call
if (AIFeaturesPlugin && process.env.AI_PROCESS_EXISTING_ON_STARTUP === 'true') {
  // Process existing documents in background after server starts
  setTimeout(async () => {
    try {
      console.log('🚀 Processing existing documents with AI...');
      
      const aiRoutes = new (require('./ai-features').AIRoutes)(db, providerManager);
      
      // Check how many documents need processing
      const unprocessed = await db.get(`
        SELECT COUNT(*) as count 
        FROM documents 
        WHERE ai_category IS NULL OR ai_processed_at IS NULL
      `);
      
      if (unprocessed.count > 0) {
        console.log(`📊 Found ${unprocessed.count} unprocessed documents`);
        
        // Start background processing
        aiRoutes.ai.processAllDocuments()
          .then(result => {
            console.log('✅ Background AI processing completed:', result);
          })
          .catch(error => {
            console.error('❌ Background AI processing failed:', error);
          });
      } else {
        console.log('✅ All documents already processed');
      }
      
    } catch (error) {
      console.error('❌ Startup AI processing failed:', error);
    }
  }, 10000); // Wait 10 seconds after server start
}

// ==========================================
// ENVIRONMENT VARIABLES TO ADD
// ==========================================

/*
Add these to your .env file:

# AI Features Configuration
ENABLE_AI_FEATURES=true
AI_AUTO_PROCESS=true
AI_PROCESS_EXISTING_ON_STARTUP=false

# AI Provider Settings (use your existing keys)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# AI Feature Flags
ENABLE_SEMANTIC_SEARCH=true
ENABLE_AUTO_CATEGORIZATION=true
ENABLE_SUMMARIZATION=true
ENABLE_WRITING_ASSISTANT=false

# Performance Settings
AI_BATCH_SIZE=10
AI_RATE_LIMIT_MS=200
AI_CACHE_TTL=3600
*/

// ==========================================
// PACKAGE.JSON UPDATES
// ==========================================

/*
Add these dependencies to your package.json:

{
  "dependencies": {
    "openai": "^4.20.0",
    "@anthropic-ai/sdk": "^0.9.0"
  }
}

Then run: npm install
*/

// ==========================================
// VERIFICATION COMMANDS
// ==========================================

/*
After adding this code and restarting your server:

1. Check AI health:
   curl http://localhost:3001/api/ai/health

2. Test semantic search:
   curl -X POST http://localhost:3001/api/ai/search \
     -H "Content-Type: application/json" \
     -d '{"query":"product requirements"}'

3. Process a document:
   curl -X POST http://localhost:3001/api/ai/documents/your_doc_id/process

4. View AI dashboard:
   Open http://localhost:3001/ai/dashboard.html

5. Test enhanced search:
   curl "http://localhost:3001/api/search/enhanced?query=requirements"
*/