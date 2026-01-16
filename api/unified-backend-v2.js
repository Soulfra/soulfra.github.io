#!/usr/bin/env node
/**
 * Unified API Backend v2
 *
 * Fixes from ensemble research:
 * ✅ GitHub pagination (uses github-fetcher.js - gets ALL repos)
 * ✅ Safe file operations (uses data-store.js with locking)
 * ✅ Proper CORS preflight (204 No Content)
 * ✅ Error handling everywhere
 * ✅ Adapter fallbacks (graceful degradation)
 * ✅ Standardized response format
 *
 * Usage:
 *   node api/unified-backend-v2.js
 *
 * Serves on port 5050
 */

const http = require('http');
const url = require('url');
const path = require('path');

const PORT = process.env.PORT || 5050;

// Import our new components
const GitHubFetcher = require('./github-fetcher.js');
const DataStore = require('./data-store.js');
const TwinIDGenerator = require('./twin-id-generator.js');

// Import AI providers
const OpenAIProvider = require('./providers/openai-provider.js');
const ClaudeProvider = require('./providers/claude-provider.js');
const OllamaProvider = require('./providers/ollama-provider.js');

// Import learning router
const LearningRouter = require('./learning-router.js');

// Import payment modules
const PaymentsEngine = require('./payments-engine.js');
const SubscriptionsManager = require('./subscriptions-manager.js');
const InvoiceGenerator = require('./invoice-generator.js');
const MultiCurrency = require('./multi-currency.js');

// Import content generation modules
const ContentGenerator = require('./content-generator.js');

// Import assistant modules
const IdentityKeyring = require('./identity-keyring.js');
const CodeAnalyzer = require('./code-analyzer.js');

// Initialize data stores
const emailStore = new DataStore(path.join(__dirname, '../data/email-captures.json'));
const commentStore = new DataStore(path.join(__dirname, '../data/comments.json'));
const twinGenerator = new TwinIDGenerator('./data/twins.json');

// Load adapters with fallback handling
let qrAdapter, agentAdapter, orchestratorAdapter;

try {
  const QRAdapter = require('./adapters/qr-adapter.js');
  qrAdapter = new QRAdapter();
  console.log('✅ QR Adapter loaded');
} catch (error) {
  console.warn('⚠️ QR Adapter unavailable:', error.message);
  qrAdapter = null;
}

try {
  const AgentAdapter = require('./adapters/agent-adapter.js');
  agentAdapter = new AgentAdapter();
  console.log('✅ Agent Adapter loaded');
} catch (error) {
  console.warn('⚠️ Agent Adapter unavailable:', error.message);
  agentAdapter = null;
}

try {
  const OrchestratorAdapter = require('./adapters/orchestrator-adapter.js');
  orchestratorAdapter = new OrchestratorAdapter();
  console.log('✅ Orchestrator Adapter loaded');
} catch (error) {
  console.warn('⚠️ Orchestrator Adapter unavailable:', error.message);
  orchestratorAdapter = null;
}

// Initialize AI providers
const aiProviders = new Map();

try {
  const openai = new OpenAIProvider();
  if (openai.isReady()) {
    aiProviders.set('openai', openai);
    console.log('✅ OpenAI provider ready');
  } else {
    console.warn('⚠️ OpenAI API key not found (set OPENAI_API_KEY)');
  }
} catch (error) {
  console.warn('⚠️ OpenAI provider failed:', error.message);
}

try {
  const claude = new ClaudeProvider();
  if (claude.isReady()) {
    aiProviders.set('claude', claude);
    console.log('✅ Claude provider ready');
  } else {
    console.warn('⚠️ Claude API key not found (set ANTHROPIC_API_KEY)');
  }
} catch (error) {
  console.warn('⚠️ Claude provider failed:', error.message);
}

try {
  const ollama = new OllamaProvider();
  if (ollama.isReady()) {
    aiProviders.set('ollama', ollama);
    console.log('✅ Ollama provider ready (local AI)');
  }
} catch (error) {
  console.warn('⚠️ Ollama provider failed:', error.message);
}

// Initialize learning router
const learningRouter = new LearningRouter(aiProviders);
console.log(`✅ Learning Router initialized with ${aiProviders.size} provider(s)`);

// Initialize payment modules
const paymentsEngine = new PaymentsEngine();
const subscriptionsManager = new SubscriptionsManager(paymentsEngine);
const invoiceGenerator = new InvoiceGenerator();
const multiCurrency = new MultiCurrency();

// Initialize content generation
const contentGenerator = new ContentGenerator();

// Initialize assistant modules
const identityKeyring = new IdentityKeyring();
const codeAnalyzer = new CodeAnalyzer(identityKeyring);

// Initialize payment modules asynchronously
(async () => {
  try {
    await paymentsEngine.initialize();
    await subscriptionsManager.initialize();
    await multiCurrency.initialize();
  } catch (error) {
    console.warn('⚠️ Payment modules initialization warning:', error.message);
  }
})();

// Initialize content generator asynchronously
(async () => {
  try {
    await contentGenerator.initialize();
  } catch (error) {
    console.warn('⚠️ Content generator initialization warning:', error.message);
  }
})();

// Initialize assistant modules asynchronously
(async () => {
  try {
    await identityKeyring.initialize();
    console.log('✅ Identity Keyring initialized');
  } catch (error) {
    console.warn('⚠️ Identity Keyring initialization warning:', error.message);
  }
})();

/**
 * Auto-select best provider based on task
 */
function selectProvider(preferredProvider) {
  // If specific provider requested and available, use it
  if (preferredProvider && preferredProvider !== 'auto') {
    const provider = aiProviders.get(preferredProvider);
    if (provider) return provider;
  }

  // Auto-select: prefer Claude for complex tasks, OpenAI for speed
  if (aiProviders.has('claude')) return aiProviders.get('claude');
  if (aiProviders.has('openai')) return aiProviders.get('openai');

  return null;
}

/**
 * Parse JSON body from request
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error(`Invalid JSON: ${e.message}`));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Parse multipart/form-data body
 */
function parseFormData(req) {
  return new Promise((resolve, reject) => {
    const boundary = req.headers['content-type']?.split('boundary=')[1];
    if (!boundary) {
      return reject(new Error('No boundary found in multipart/form-data'));
    }

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const parts = buffer.toString('binary').split('--' + boundary);
        const files = {};
        const fields = {};

        parts.forEach(part => {
          if (!part || part === '--\r\n' || part === '--') return;

          const [headers, ...bodyParts] = part.split('\r\n\r\n');
          const body = bodyParts.join('\r\n\r\n').replace(/\r\n$/, '');

          const nameMatch = headers.match(/name="([^"]+)"/);
          const filenameMatch = headers.match(/filename="([^"]+)"/);

          if (nameMatch) {
            const name = nameMatch[1];
            if (filenameMatch) {
              files[name] = {
                filename: filenameMatch[1],
                data: Buffer.from(body, 'binary')
              };
            } else {
              fields[name] = body;
            }
          }
        });

        resolve({ files, fields });
      } catch (e) {
        reject(new Error(`Form data parse error: ${e.message}`));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Send JSON response with proper CORS
 */
function sendJSON(res, data, statusCode = 200) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data, null, 2));
}

/**
 * Send CORS preflight response (proper 204 No Content)
 */
function sendCORSPreflight(res) {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400' // 24 hours
  });
  res.end();
}

/**
 * Standardized success response
 */
function successResponse(data, metadata = {}) {
  return {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata
    }
  };
}

/**
 * Standardized error response
 */
function errorResponse(message, code = 'UNKNOWN_ERROR', details = {}) {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Main request handler
 */
async function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  console.log(`${method} ${pathname}`);

  // CORS preflight - proper 204 response
  if (method === 'OPTIONS') {
    sendCORSPreflight(res);
    return;
  }

  try {
    // ==========================================
    // GitHub Repos API (uses GitHubFetcher with pagination)
    // ==========================================
    if (pathname === '/api/debug/github-repos' && method === 'GET') {
      try {
        const result = await GitHubFetcher.getReposSummary('soulfra', {
          includePrivate: true // Include private repos if token available
        });

        if (!result.success) {
          throw new Error(result.error.message);
        }

        // Transform to match projects.html expected format
        const data = result.data;
        sendJSON(res, successResponse({
          success: true,
          total_repos: data.total_repos,
          active: data.categories.active,
          experiments: data.categories.experiments,
          archived: data.categories.archived,
          counts: data.counts
        }, {
          authenticated: result.metadata.authenticated,
          cached: result.metadata.cached
        }));
      } catch (error) {
        sendJSON(res, errorResponse(
          `Failed to fetch GitHub repos: ${error.message}`,
          'GITHUB_API_ERROR'
        ), 500);
      }
      return;
    }

    // ==========================================
    // Email Capture API (uses DataStore)
    // ==========================================
    if (pathname === '/api/email-capture' && method === 'POST') {
      try {
        const body = await parseBody(req);

        if (!body.email) {
          sendJSON(res, errorResponse(
            'Email is required',
            'VALIDATION_ERROR',
            { field: 'email' }
          ), 400);
          return;
        }

        const result = await emailStore.append({
          email: body.email,
          source: body.source || 'unknown',
          timestamp: new Date().toISOString(),
          metadata: body.metadata || {}
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        sendJSON(res, successResponse({
          saved: true,
          email: body.email,
          total_count: result.count
        }));
      } catch (error) {
        sendJSON(res, errorResponse(
          `Failed to save email: ${error.message}`,
          'EMAIL_SAVE_ERROR'
        ), 500);
      }
      return;
    }

    // ==========================================
    // Comments API (uses DataStore)
    // ==========================================
    if (pathname === '/api/comments' && method === 'POST') {
      try {
        const body = await parseBody(req);

        if (!body.comment) {
          sendJSON(res, errorResponse(
            'Comment is required',
            'VALIDATION_ERROR',
            { field: 'comment' }
          ), 400);
          return;
        }

        const commentId = `comment-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

        const result = await commentStore.append({
          id: commentId,
          comment: body.comment,
          author: body.author || 'Anonymous',
          source: body.source || 'unknown',
          timestamp: new Date().toISOString(),
          metadata: body.metadata || {}
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        sendJSON(res, successResponse({
          saved: true,
          id: commentId,
          total_count: result.count
        }));
      } catch (error) {
        sendJSON(res, errorResponse(
          `Failed to save comment: ${error.message}`,
          'COMMENT_SAVE_ERROR'
        ), 500);
      }
      return;
    }

    // ==========================================
    // QR Generation API (uses QRAdapter with fallback)
    // ==========================================
    if (pathname === '/api/qr/generate' && method === 'POST') {
      try {
        const body = await parseBody(req);

        if (!qrAdapter || !qrAdapter.isReady()) {
          // Fallback: return mock QR data
          sendJSON(res, successResponse({
            qr: {
              type: body.type || 'bootstrap',
              data: body.data || {},
              svg: '<svg><!-- QR code placeholder --></svg>',
              fallback: true
            }
          }, {
            warning: 'QR adapter unavailable, returning mock data'
          }));
          return;
        }

        const qr = await qrAdapter.generateQR(body.type || 'bootstrap', body.data || {});
        sendJSON(res, successResponse({ qr }));
      } catch (error) {
        sendJSON(res, errorResponse(
          `Failed to generate QR: ${error.message}`,
          'QR_GENERATION_ERROR'
        ), 500);
      }
      return;
    }

    // ==========================================
    // Chat API (uses AI providers with auto-routing)
    // ==========================================
    if (pathname === '/api/chat' && method === 'POST') {
      try {
        const body = await parseBody(req);

        if (!body.message) {
          sendJSON(res, errorResponse(
            'Message is required',
            'VALIDATION_ERROR',
            { field: 'message' }
          ), 400);
          return;
        }

        const provider = selectProvider(body.provider || 'auto');

        if (!provider) {
          sendJSON(res, errorResponse(
            'No AI providers available. Set OPENAI_API_KEY or ANTHROPIC_API_KEY',
            'NO_PROVIDERS_AVAILABLE'
          ), 503);
          return;
        }

        // Build message history
        const messages = [];
        if (body.system) {
          messages.push({ role: 'system', content: body.system });
        }
        if (body.history && Array.isArray(body.history)) {
          messages.push(...body.history);
        }
        messages.push({ role: 'user', content: body.message });

        // Call provider
        const response = await provider.chat(messages, {
          model: body.model,
          maxTokens: body.maxTokens,
          temperature: body.temperature
        });

        sendJSON(res, successResponse({
          content: response.content,
          provider: response.provider,
          model: response.model,
          usage: response.usage
        }));
      } catch (error) {
        sendJSON(res, errorResponse(
          `Failed to process chat: ${error.message}`,
          'CHAT_ERROR'
        ), 500);
      }
      return;
    }

    // ==========================================
    // Chat Streaming API
    // ==========================================
    if (pathname === '/api/chat/stream' && method === 'POST') {
      try {
        const body = await parseBody(req);

        if (!body.message) {
          sendJSON(res, errorResponse(
            'Message is required',
            'VALIDATION_ERROR',
            { field: 'message' }
          ), 400);
          return;
        }

        const provider = selectProvider(body.provider || 'auto');

        if (!provider) {
          sendJSON(res, errorResponse(
            'No AI providers available',
            'NO_PROVIDERS_AVAILABLE'
          ), 503);
          return;
        }

        // Build message history
        const messages = [];
        if (body.system) {
          messages.push({ role: 'system', content: body.system });
        }
        if (body.history && Array.isArray(body.history)) {
          messages.push(...body.history);
        }
        messages.push({ role: 'user', content: body.message });

        // Set up streaming response
        res.writeHead(200, {
          'Content-Type': 'text/plain',
          'Transfer-Encoding': 'chunked',
          'Access-Control-Allow-Origin': '*'
        });

        // Stream response
        const stream = await provider.stream(messages, {
          model: body.model,
          maxTokens: body.maxTokens,
          temperature: body.temperature
        });

        for await (const chunk of stream) {
          res.write(chunk);
        }

        res.end();
      } catch (error) {
        console.error('Streaming error:', error);
        if (!res.headersSent) {
          sendJSON(res, errorResponse(
            `Failed to stream chat: ${error.message}`,
            'STREAM_ERROR'
          ), 500);
        }
      }
      return;
    }

    // ==========================================
    // Adaptive Chat API (Learning Router)
    // ==========================================
    if (pathname === '/api/chat/adaptive' && method === 'POST') {
      try {
        const body = await parseBody(req);

        if (!body.message) {
          sendJSON(res, errorResponse(
            'Message is required',
            'VALIDATION_ERROR',
            { field: 'message' }
          ), 400);
          return;
        }

        // Use learning router for adaptive response
        const response = await learningRouter.chat(body.message, {
          userId: body.userId,
          history: body.history || [],
          adaptive: body.adaptive !== false, // Default true
          provider: body.provider,
          model: body.model,
          temperature: body.temperature,
          maxTokens: body.maxTokens
        });

        sendJSON(res, successResponse({
          content: response.content,
          provider: response.provider,
          model: response.model,
          usage: response.usage,
          expertise: response.expertise,
          recommendation: response.recommendation,
          routing: response.routing
        }));
      } catch (error) {
        sendJSON(res, errorResponse(
          `Failed to process adaptive chat: ${error.message}`,
          'ADAPTIVE_CHAT_ERROR'
        ), 500);
      }
      return;
    }

    // ==========================================
    // Adaptive Chat Streaming API
    // ==========================================
    if (pathname === '/api/chat/adaptive/stream' && method === 'POST') {
      try {
        const body = await parseBody(req);

        if (!body.message) {
          sendJSON(res, errorResponse(
            'Message is required',
            'VALIDATION_ERROR',
            { field: 'message' }
          ), 400);
          return;
        }

        // Set up streaming response
        res.writeHead(200, {
          'Content-Type': 'text/plain',
          'Transfer-Encoding': 'chunked',
          'Access-Control-Allow-Origin': '*'
        });

        // Stream with learning router
        const stream = await learningRouter.streamChat(body.message, {
          userId: body.userId,
          history: body.history || [],
          adaptive: body.adaptive !== false,
          provider: body.provider,
          model: body.model,
          temperature: body.temperature,
          maxTokens: body.maxTokens
        });

        for await (const chunk of stream) {
          res.write(chunk);
        }

        res.end();
      } catch (error) {
        console.error('Adaptive streaming error:', error);
        if (!res.headersSent) {
          sendJSON(res, errorResponse(
            `Failed to stream adaptive chat: ${error.message}`,
            'ADAPTIVE_STREAM_ERROR'
          ), 500);
        }
      }
      return;
    }

    // ==========================================
    // Expertise Detection API (for testing/debugging)
    // ==========================================
    if (pathname === '/api/expertise/detect' && method === 'POST') {
      try {
        const body = await parseBody(req);

        if (!body.message) {
          sendJSON(res, errorResponse(
            'Message is required',
            'VALIDATION_ERROR',
            { field: 'message' }
          ), 400);
          return;
        }

        const ExpertiseDetector = require('./expertise-detector.js');
        const detector = new ExpertiseDetector();
        const result = detector.detect(body.message, body.history || []);
        const recommendation = detector.recommend(result.level);

        sendJSON(res, successResponse({
          expertise: result,
          recommendation
        }));
      } catch (error) {
        sendJSON(res, errorResponse(
          `Failed to detect expertise: ${error.message}`,
          'EXPERTISE_ERROR'
        ), 500);
      }
      return;
    }

    // ==========================================
    // Learning Stats API
    // ==========================================
    if (pathname === '/api/learning/stats' && method === 'GET') {
      try {
        const stats = learningRouter.getStats();
        sendJSON(res, successResponse(stats));
      } catch (error) {
        sendJSON(res, errorResponse(
          `Failed to get stats: ${error.message}`,
          'STATS_ERROR'
        ), 500);
      }
      return;
    }

    // ==========================================
    // Agent Building API (uses AgentAdapter with fallback)
    // ==========================================
    if (pathname === '/api/agent/build' && method === 'POST') {
      try {
        const body = await parseBody(req);

        if (!body.conversation) {
          sendJSON(res, errorResponse(
            'Conversation is required',
            'VALIDATION_ERROR',
            { field: 'conversation' }
          ), 400);
          return;
        }

        if (!agentAdapter || !agentAdapter.isReady()) {
          // Fallback: return mock agent
          sendJSON(res, successResponse({
            agent: {
              name: 'MockAgent',
              category: body.category || 'ui',
              vaultIntegration: body.vaultIntegration !== false,
              fallback: true
            }
          }, {
            warning: 'Agent adapter unavailable, returning mock agent'
          }));
          return;
        }

        const agent = await agentAdapter.buildAgent(body.conversation, {
          vaultIntegration: body.vaultIntegration !== false,
          category: body.category || 'ui'
        });

        sendJSON(res, successResponse({ agent }));
      } catch (error) {
        sendJSON(res, errorResponse(
          `Failed to build agent: ${error.message}`,
          'AGENT_BUILD_ERROR'
        ), 500);
      }
      return;
    }

    // ==========================================
    // Avatar Vision API (analyze image with LLaVA)
    // ==========================================
    if (pathname === '/api/avatar/analyze' && method === 'POST') {
      try {
        const body = await parseBody(req);

        if (!body.imageData) {
          sendJSON(res, errorResponse(
            'Image data (base64) is required',
            'VALIDATION_ERROR',
            { field: 'imageData' }
          ), 400);
          return;
        }

        const ollama = aiProviders.get('ollama');

        if (!ollama) {
          sendJSON(res, errorResponse(
            'Ollama not available. Is it running? Try: ollama serve',
            'OLLAMA_UNAVAILABLE'
          ), 503);
          return;
        }

        // Default prompt for avatar generation
        const prompt = body.prompt || 'Describe this person in detail as an avatar character. Include: physical appearance, clothing style, colors, mood/expression, setting/background. Be specific and descriptive for AI image generation.';

        const response = await ollama.vision(body.imageData, prompt, {
          model: body.model || 'llava',
          temperature: body.temperature,
          maxTokens: body.maxTokens
        });

        sendJSON(res, successResponse({
          prompt: response.content,
          model: response.model,
          usage: response.usage
        }));
      } catch (error) {
        sendJSON(res, errorResponse(
          `Failed to analyze image: ${error.message}`,
          'VISION_ERROR'
        ), 500);
      }
      return;
    }

    // ==========================================
    // Avatar Color Extraction (real hex codes from pixels)
    // ==========================================
    if (pathname === '/api/avatar/extract-colors' && method === 'POST') {
      try {
        const body = await parseBody(req);

        if (!body.imageData) {
          sendJSON(res, errorResponse(
            'Image data (base64) is required',
            'VALIDATION_ERROR',
            { field: 'imageData' }
          ), 400);
          return;
        }

        // Save temp file
        const fs = require('fs');
        const tempFile = path.join(__dirname, '../data', `temp-${Date.now()}.png`);
        // Strip data URL prefix if present
        let base64Data = body.imageData;
        if (base64Data.startsWith('data:')) {
          base64Data = base64Data.split(',')[1];
        }
        const imageBuffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(tempFile, imageBuffer);

        // Run Python color extractor
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        const { stdout, stderr } = await execAsync(
          `python3 api/vision/color-extractor.py "${tempFile}"`
        );

        // Read JSON output
        const colorData = JSON.parse(fs.readFileSync('color-extraction.json', 'utf8'));

        // Cleanup
        fs.unlinkSync(tempFile);
        fs.unlinkSync('color-extraction.json');

        sendJSON(res, successResponse(colorData));
      } catch (error) {
        sendJSON(res, errorResponse(
          `Failed to extract colors: ${error.message}`,
          'COLOR_EXTRACTION_ERROR'
        ), 500);
      }
      return;
    }

    // ==========================================
    // Avatar Depth Map Generation (pseudo-depth for rigging)
    // ==========================================
    if (pathname === '/api/avatar/depth-map' && method === 'POST') {
      try {
        const body = await parseBody(req);

        if (!body.imageData) {
          sendJSON(res, errorResponse(
            'Image data (base64) is required',
            'VALIDATION_ERROR',
            { field: 'imageData' }
          ), 400);
          return;
        }

        // Save temp file
        const fs = require('fs');
        const tempFile = path.join(__dirname, '../data', `temp-depth-${Date.now()}.png`);
        // Strip data URL prefix if present
        let base64Data = body.imageData;
        if (base64Data.startsWith('data:')) {
          base64Data = base64Data.split(',')[1];
        }
        const imageBuffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(tempFile, imageBuffer);

        // Run Python depth map generator
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        const { stdout, stderr } = await execAsync(
          `python3 api/vision/depth-simple.py "${tempFile}"`
        );

        // Read JSON output
        const depthData = JSON.parse(fs.readFileSync('depth-map.json', 'utf8'));

        // Cleanup
        fs.unlinkSync(tempFile);
        fs.unlinkSync('depth-map.json');
        // Clean up generated image files
        try { fs.unlinkSync('depth-colored.png'); } catch (e) {}
        try { fs.unlinkSync('depth-grid.png'); } catch (e) {}

        sendJSON(res, successResponse(depthData));
      } catch (error) {
        sendJSON(res, errorResponse(
          `Failed to generate depth map: ${error.message}`,
          'DEPTH_MAP_ERROR'
        ), 500);
      }
      return;
    }

    // ==========================================
    // Auth: QR Login Session Create
    // ==========================================
    if (pathname === '/api/auth/qr/generate' && method === 'POST') {
      try {
        const sessionId = `qr-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const sessionStore = new DataStore(path.join(__dirname, '../data', `qr-session-${sessionId}.json`));

        const session = {
          sessionId,
          status: 'pending',
          created: new Date().toISOString(),
          expires: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 min
        };

        await sessionStore.write(session);

        sendJSON(res, successResponse({
          sessionId,
          qrData: `soulfra://auth?session=${sessionId}`,
          expiresIn: 300 // seconds
        }));
      } catch (error) {
        sendJSON(res, errorResponse(
          `Failed to create QR session: ${error.message}`,
          'QR_SESSION_ERROR'
        ), 500);
      }
      return;
    }

    // ==========================================
    // Auth: QR Login Status Check
    // ==========================================
    if (pathname.startsWith('/api/auth/qr/status/') && method === 'GET') {
      try {
        const sessionId = pathname.split('/').pop();
        const sessionStore = new DataStore(path.join(__dirname, '../data', `qr-session-${sessionId}.json`));

        if (!sessionStore.exists()) {
          sendJSON(res, errorResponse(
            'Session not found',
            'SESSION_NOT_FOUND',
            { sessionId }
          ), 404);
          return;
        }

        const session = await sessionStore.read();
        sendJSON(res, successResponse({ session }));
      } catch (error) {
        sendJSON(res, errorResponse(
          `Failed to check session: ${error.message}`,
          'SESSION_CHECK_ERROR'
        ), 500);
      }
      return;
    }

    // ==========================================
    // Health Check
    // ==========================================
    if (pathname === '/api/health' && method === 'GET') {
      const adapters = {
        qr: qrAdapter ? qrAdapter.isReady() : false,
        agent: agentAdapter ? agentAdapter.isReady() : false,
        orchestrator: orchestratorAdapter ? orchestratorAdapter.isReady() : false
      };

      const aiProviderStatus = {};
      for (const [name, provider] of aiProviders) {
        aiProviderStatus[name] = provider.getInfo();
      }

      const emailStats = await emailStore.stats();
      const commentStats = await commentStore.stats();

      sendJSON(res, successResponse({
        status: 'ok',
        version: '2.0.0',
        adapters,
        aiProviders: aiProviderStatus,
        storage: {
          emails: emailStats.success ? {
            count: emailStats.itemCount,
            size: emailStats.size,
            hasBackup: emailStats.hasBackup
          } : { error: emailStats.error },
          comments: commentStats.success ? {
            count: commentStats.itemCount,
            size: commentStats.size,
            hasBackup: commentStats.hasBackup
          } : { error: commentStats.error }
        }
      }));
      return;
    }

    // ==========================================
    // Vision Object Identification (llava)
    // ==========================================
    if (pathname === '/api/vision/identify' && method === 'POST') {
      try {
        const body = await parseBody(req);

        if (!body.imageData) {
          return sendJSON(res, errorResponse('IMAGE_REQUIRED', 'imageData field is required'), 400);
        }

        const ollamaProvider = aiProviders.get('ollama');
        if (!ollamaProvider) {
          return sendJSON(res, errorResponse('OLLAMA_NOT_AVAILABLE', 'Ollama provider not configured'), 500);
        }

        const response = await ollamaProvider.vision(
          body.imageData,
          'Identify and describe all objects in this image. Be specific and concise.',
          { model: 'llava' }
        );

        sendJSON(res, successResponse({ description: response }));
      } catch (error) {
        sendJSON(res, errorResponse('VISION_IDENTIFY_ERROR', error.message), 500);
      }
      return;
    }

    // ==========================================
    // Video Generation (SadTalker)
    // ==========================================
    if (pathname === '/api/video/generate' && method === 'POST') {
      try {
        const fs = require('fs');
        const { spawn } = require('child_process');

        const formData = await parseFormData(req);
        const imageFile = formData.files.image;
        const audioFile = formData.files.audio;

        if (!imageFile || !audioFile) {
          return sendJSON(res, errorResponse('FILES_REQUIRED', 'Both image and audio files required'), 400);
        }

        // Generate unique job ID
        const jobId = Date.now().toString();
        const resultsDir = path.join(__dirname, 'vision', 'SadTalker', 'results', jobId);
        fs.mkdirSync(resultsDir, { recursive: true });

        // Save uploaded files
        const imagePath = path.join(resultsDir, 'input.png');
        const audioPath = path.join(resultsDir, 'input.wav');
        fs.writeFileSync(imagePath, imageFile.data);
        fs.writeFileSync(audioPath, audioFile.data);

        // Start video generation in background
        const sadtalkerDir = path.join(__dirname, 'vision', 'SadTalker');
        const pythonPath = path.join(sadtalkerDir, 'venv', 'bin', 'python');
        const inferencePath = path.join(sadtalkerDir, 'inference.py');

        const proc = spawn(pythonPath, [
          inferencePath,
          '--source_image', imagePath,
          '--driven_audio', audioPath,
          '--result_dir', resultsDir,
          '--preprocess', 'full'
        ]);

        // Store job status (in production, use Redis or database)
        global.videoJobs = global.videoJobs || {};
        global.videoJobs[jobId] = {
          status: 'processing',
          progress: 0,
          started: Date.now()
        };

        proc.stdout.on('data', (data) => {
          const output = data.toString();
          // Parse progress from SadTalker output
          const match = output.match(/(\d+)%/);
          if (match && global.videoJobs[jobId]) {
            global.videoJobs[jobId].progress = parseInt(match[1]);
          }
        });

        proc.on('close', (code) => {
          if (code === 0 && global.videoJobs[jobId]) {
            // Find generated video
            const videoFiles = fs.readdirSync(resultsDir).filter(f => f.endsWith('.mp4'));
            if (videoFiles.length > 0) {
              global.videoJobs[jobId].status = 'completed';
              global.videoJobs[jobId].progress = 100;
              global.videoJobs[jobId].videoUrl = `/api/vision/SadTalker/results/${jobId}/${videoFiles[0]}`;
            } else {
              global.videoJobs[jobId].status = 'failed';
              global.videoJobs[jobId].error = 'No video file generated';
            }
          } else if (global.videoJobs[jobId]) {
            global.videoJobs[jobId].status = 'failed';
            global.videoJobs[jobId].error = `Process exited with code ${code}`;
          }
        });

        sendJSON(res, successResponse({ jobId }));
      } catch (error) {
        sendJSON(res, errorResponse('VIDEO_GENERATE_ERROR', error.message), 500);
      }
      return;
    }

    // ==========================================
    // Video Generation Status
    // ==========================================
    if (pathname.startsWith('/api/video/status/') && method === 'GET') {
      const jobId = pathname.split('/').pop();
      const job = global.videoJobs?.[jobId];

      if (!job) {
        return sendJSON(res, errorResponse('JOB_NOT_FOUND', 'Job ID not found'), 404);
      }

      sendJSON(res, successResponse(job));
      return;
    }

    // ==========================================
    // User Signup API
    // ==========================================
    if (pathname === '/api/signup' && method === 'POST') {
      try {
        const body = await parseBody(req);

        // Validation
        if (!body.name || !body.email) {
          sendJSON(res, errorResponse(
            'Name and email are required',
            'VALIDATION_ERROR',
            { fields: ['name', 'email'] }
          ), 400);
          return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
          sendJSON(res, errorResponse(
            'Invalid email address',
            'VALIDATION_ERROR',
            { field: 'email' }
          ), 400);
          return;
        }

        // Generate unique user ID and API key
        const crypto = require('crypto');
        const userId = crypto.randomBytes(16).toString('hex');
        const apiKey = crypto.randomBytes(32).toString('hex');

        // Create username from email
        const username = body.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

        // Create user object
        const user = {
          id: userId,
          username,
          email: body.email,
          name: body.name,
          plan: body.plan || 'free',
          use_case: body.use_case || '',
          createdAt: new Date().toISOString(),
          settings: {
            customDomain: `${username}.soulfra.com`,
            defaultTheme: 'default',
            allowPublicView: true,
            enableNotifications: true
          },
          usage: {
            uploads: 0,
            deployments: 0,
            storageUsed: 0,
            tokensRemaining: body.plan === 'managed' ? 1000 : 100
          },
          projects: [],
          security: {
            accessToken: apiKey,
            lastLogin: null,
            loginCount: 0
          }
        };

        // Load users database
        const userStore = new DataStore(path.join(__dirname, '../data/users.json'));
        let usersData = {};

        try {
          const existingData = await userStore.read();
          if (existingData && typeof existingData === 'object') {
            usersData = existingData;
          }
        } catch (error) {
          console.warn('[Signup] Creating new users database');
        }

        // Check if email already exists
        const existingUser = Object.values(usersData).find(u => u.email === body.email);
        if (existingUser) {
          sendJSON(res, errorResponse(
            'Email already registered',
            'EMAIL_EXISTS',
            { email: body.email }
          ), 409);
          return;
        }

        // Add new user
        usersData[username] = user;

        // Save to database
        await userStore.write(usersData);

        console.log(`[Signup] New user created: ${username} (${body.email})`);

        // Send welcome email (non-blocking - don't wait for it)
        const emailService = require('./email-service.js');
        emailService.sendWelcomeEmail(user, apiKey).then(result => {
          console.log(`[Signup] Welcome email sent to ${user.email}:`, result.provider);
        }).catch(error => {
          console.warn(`[Signup] Email send failed (non-critical):`, error.message);
        });

        // Return success (don't wait for email)
        sendJSON(res, successResponse({
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            plan: user.plan,
            createdAt: user.createdAt
          },
          apiKey,
          dashboardUrl: '/dashboard.html'
        }, {
          emailQueued: true
        }));

      } catch (error) {
        sendJSON(res, errorResponse(
          `Signup failed: ${error.message}`,
          'SIGNUP_ERROR'
        ), 500);
      }
      return;
    }

    // ==========================================
    // PAYMENTS API
    // ==========================================

    // Create Payment
    if (pathname === '/api/payments/create' && method === 'POST') {
      try {
        const body = await parseBody(req);

        const payment = await paymentsEngine.createPayment({
          amount: body.amount,
          currency: body.currency,
          customerId: body.customerId,
          description: body.description,
          metadata: body.metadata,
          paymentMethod: body.paymentMethod
        });

        sendJSON(res, successResponse(payment));
      } catch (error) {
        sendJSON(res, errorResponse(
          `Payment creation failed: ${error.message}`,
          'PAYMENT_CREATE_ERROR'
        ), 500);
      }
      return;
    }

    // Confirm Payment
    if (pathname === '/api/payments/confirm' && method === 'POST') {
      try {
        const body = await parseBody(req);

        if (!body.paymentId) {
          sendJSON(res, errorResponse('Payment ID is required', 'VALIDATION_ERROR'), 400);
          return;
        }

        const result = await paymentsEngine.confirmPayment(body.paymentId, body.paymentMethod);
        sendJSON(res, successResponse(result));
      } catch (error) {
        sendJSON(res, errorResponse(
          `Payment confirmation failed: ${error.message}`,
          'PAYMENT_CONFIRM_ERROR'
        ), 500);
      }
      return;
    }

    // Process Refund
    if (pathname === '/api/payments/refund' && method === 'POST') {
      try {
        const body = await parseBody(req);

        if (!body.paymentId) {
          sendJSON(res, errorResponse('Payment ID is required', 'VALIDATION_ERROR'), 400);
          return;
        }

        const refund = await paymentsEngine.refund(body.paymentId, body.amount, body.reason);
        sendJSON(res, successResponse(refund));
      } catch (error) {
        sendJSON(res, errorResponse(
          `Refund failed: ${error.message}`,
          'REFUND_ERROR'
        ), 500);
      }
      return;
    }

    // Get Payment Status
    if (pathname.startsWith('/api/payments/') && method === 'GET') {
      const paymentId = pathname.split('/').pop();
      try {
        const payment = await paymentsEngine.getPayment(paymentId);
        sendJSON(res, successResponse({ payment }));
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'PAYMENT_NOT_FOUND'), 404);
      }
      return;
    }

    // List Payments
    if (pathname === '/api/payments' && method === 'GET') {
      try {
        const filters = parsedUrl.query;
        const payments = await paymentsEngine.listPayments(filters);
        sendJSON(res, successResponse({ payments, count: payments.length }));
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'PAYMENTS_LIST_ERROR'), 500);
      }
      return;
    }

    // Payment Statistics
    if (pathname === '/api/payments/stats' && method === 'GET') {
      try {
        const stats = await paymentsEngine.getStats();
        sendJSON(res, successResponse(stats));
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'STATS_ERROR'), 500);
      }
      return;
    }

    // ==========================================
    // SUBSCRIPTIONS API
    // ==========================================

    // Create Plan
    if (pathname === '/api/subscriptions/plans' && method === 'POST') {
      try {
        const body = await parseBody(req);
        const plan = await subscriptionsManager.createPlan(body);
        sendJSON(res, successResponse(plan));
      } catch (error) {
        sendJSON(res, errorResponse(
          `Plan creation failed: ${error.message}`,
          'PLAN_CREATE_ERROR'
        ), 500);
      }
      return;
    }

    // List Plans
    if (pathname === '/api/subscriptions/plans' && method === 'GET') {
      try {
        const plans = await subscriptionsManager.listPlans();
        sendJSON(res, successResponse({ plans, count: plans.length }));
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'PLANS_LIST_ERROR'), 500);
      }
      return;
    }

    // Subscribe Customer
    if (pathname === '/api/subscriptions/subscribe' && method === 'POST') {
      try {
        const body = await parseBody(req);
        const subscription = await subscriptionsManager.subscribe(body);
        sendJSON(res, successResponse(subscription));
      } catch (error) {
        sendJSON(res, errorResponse(
          `Subscription failed: ${error.message}`,
          'SUBSCRIPTION_ERROR'
        ), 500);
      }
      return;
    }

    // Cancel Subscription
    if (pathname.startsWith('/api/subscriptions/') && pathname.endsWith('/cancel') && method === 'POST') {
      const subscriptionId = pathname.split('/')[3];
      try {
        const body = await parseBody(req);
        const result = await subscriptionsManager.cancelSubscription(subscriptionId, body);
        sendJSON(res, successResponse(result));
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'CANCEL_ERROR'), 500);
      }
      return;
    }

    // Get Subscription
    if (pathname.startsWith('/api/subscriptions/') && method === 'GET' && !pathname.endsWith('/stats')) {
      const subscriptionId = pathname.split('/').pop();
      try {
        const subscription = await subscriptionsManager.getSubscription(subscriptionId);
        sendJSON(res, successResponse({ subscription }));
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'SUBSCRIPTION_NOT_FOUND'), 404);
      }
      return;
    }

    // List Subscriptions for Customer
    if (pathname === '/api/subscriptions' && method === 'GET') {
      try {
        const customerId = parsedUrl.query.customerId;
        const subscriptions = customerId
          ? await subscriptionsManager.listSubscriptions(customerId)
          : await subscriptionsManager.subscriptionsStore.read();
        sendJSON(res, successResponse({ subscriptions, count: subscriptions.length }));
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'SUBSCRIPTIONS_LIST_ERROR'), 500);
      }
      return;
    }

    // Subscription Statistics
    if (pathname === '/api/subscriptions/stats' && method === 'GET') {
      try {
        const stats = await subscriptionsManager.getStats();
        sendJSON(res, successResponse(stats));
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'STATS_ERROR'), 500);
      }
      return;
    }

    // ==========================================
    // INVOICES API
    // ==========================================

    // Generate Invoice
    if (pathname === '/api/invoices/generate' && method === 'POST') {
      try {
        const body = await parseBody(req);
        const invoice = await invoiceGenerator.generateInvoice(body);
        sendJSON(res, successResponse(invoice));
      } catch (error) {
        sendJSON(res, errorResponse(
          `Invoice generation failed: ${error.message}`,
          'INVOICE_ERROR'
        ), 500);
      }
      return;
    }

    // Get Invoice
    if (pathname.startsWith('/api/invoices/') && method === 'GET') {
      const invoiceId = pathname.split('/').pop();
      try {
        const invoice = await invoiceGenerator.getInvoice(invoiceId);
        sendJSON(res, successResponse({ invoice }));
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'INVOICE_NOT_FOUND'), 404);
      }
      return;
    }

    // List Invoices
    if (pathname === '/api/invoices' && method === 'GET') {
      try {
        const customerId = parsedUrl.query.customerId;
        const invoices = await invoiceGenerator.listInvoices(customerId);
        sendJSON(res, successResponse({ invoices, count: invoices.length }));
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'INVOICES_LIST_ERROR'), 500);
      }
      return;
    }

    // Mark Invoice as Paid
    if (pathname.startsWith('/api/invoices/') && pathname.endsWith('/paid') && method === 'POST') {
      const invoiceId = pathname.split('/')[3];
      try {
        const body = await parseBody(req);
        const result = await invoiceGenerator.markPaid(invoiceId, body.paymentId);
        sendJSON(res, successResponse(result));
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'MARK_PAID_ERROR'), 500);
      }
      return;
    }

    // Invoice Statistics
    if (pathname === '/api/invoices/stats' && method === 'GET') {
      try {
        const stats = await invoiceGenerator.getStats();
        sendJSON(res, successResponse(stats));
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'STATS_ERROR'), 500);
      }
      return;
    }

    // ==========================================
    // MULTI-CURRENCY API
    // ==========================================

    // Convert Currency
    if (pathname === '/api/currency/convert' && method === 'POST') {
      try {
        const body = await parseBody(req);
        const { amount, from, to } = body;

        if (!amount || !from || !to) {
          sendJSON(res, errorResponse('Amount, from, and to currencies are required', 'VALIDATION_ERROR'), 400);
          return;
        }

        const converted = multiCurrency.convert(amount, from, to);
        sendJSON(res, successResponse({
          amount,
          from: from.toUpperCase(),
          to: to.toUpperCase(),
          converted,
          rate: multiCurrency.getRate(to) / multiCurrency.getRate(from),
          formatted: {
            original: multiCurrency.format(amount, from),
            converted: multiCurrency.format(converted, to)
          }
        }));
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'CONVERSION_ERROR'), 500);
      }
      return;
    }

    // Get Exchange Rates
    if (pathname === '/api/currency/rates' && method === 'GET') {
      try {
        const currency = parsedUrl.query.currency;
        if (currency) {
          const rate = multiCurrency.getRate(currency);
          sendJSON(res, successResponse({
            currency: currency.toUpperCase(),
            rate,
            base: multiCurrency.config.baseCurrency
          }));
        } else {
          sendJSON(res, successResponse({
            rates: multiCurrency.ratesCache.rates,
            base: multiCurrency.ratesCache.baseCurrency,
            timestamp: multiCurrency.ratesCache.timestamp
          }));
        }
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'RATES_ERROR'), 500);
      }
      return;
    }

    // List Supported Currencies
    if (pathname === '/api/currency/supported' && method === 'GET') {
      try {
        const currencies = multiCurrency.getSupportedCurrencies();
        sendJSON(res, successResponse({ currencies, count: currencies.length }));
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'CURRENCIES_ERROR'), 500);
      }
      return;
    }

    // Refresh Exchange Rates
    if (pathname === '/api/currency/refresh' && method === 'POST') {
      try {
        await multiCurrency.refreshRates();
        const cacheInfo = multiCurrency.getCacheInfo();
        sendJSON(res, successResponse({ refreshed: true, cache: cacheInfo }));
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'REFRESH_ERROR'), 500);
      }
      return;
    }

    // ==========================================
    // CONTENT GENERATION ENDPOINTS
    // ==========================================

    // Generate Content
    if (pathname === '/api/content/generate' && method === 'POST') {
      try {
        const body = await parseBody(req);
        const result = await contentGenerator.generate(body);
        sendJSON(res, successResponse(result));
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'CONTENT_GENERATE_ERROR'), 500);
      }
      return;
    }

    // Generate Content for All Domains
    if (pathname === '/api/content/generate-all' && method === 'POST') {
      try {
        const body = await parseBody(req);
        const result = await contentGenerator.generateForAllDomains(
          body.type,
          body.topic,
          {
            keywords: body.keywords,
            urls: body.urls,
            metadata: body.metadata
          }
        );
        sendJSON(res, successResponse(result));
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'BATCH_GENERATE_ERROR'), 500);
      }
      return;
    }

    // Get Content Generator Stats
    if (pathname === '/api/content/stats' && method === 'GET') {
      try {
        const stats = contentGenerator.getStats();
        sendJSON(res, successResponse(stats));
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'STATS_ERROR'), 500);
      }
      return;
    }

    // Get Content Generator Info
    if (pathname === '/api/content/info' && method === 'GET') {
      try {
        const info = contentGenerator.getInfo();
        sendJSON(res, successResponse(info));
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'INFO_ERROR'), 500);
      }
      return;
    }

    // List Content Types
    if (pathname === '/api/content/types' && method === 'GET') {
      try {
        const types = contentGenerator.getContentTypes();
        sendJSON(res, successResponse(types));
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'TYPES_ERROR'), 500);
      }
      return;
    }

    // List Available Domains
    if (pathname === '/api/content/domains' && method === 'GET') {
      try {
        const domains = contentGenerator.getDomains();
        sendJSON(res, successResponse(domains));
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'DOMAINS_ERROR'), 500);
      }
      return;
    }

    // ==========================================
    // ASSISTANT ENDPOINTS
    // ==========================================

    // Assistant Chat (integrates identity, learning router, domain context)
    if (pathname === '/api/assistant/chat' && method === 'POST') {
      try {
        const body = await parseBody(req);
        const { message, domain = 'soulfra', history = [] } = body;

        if (!message) {
          return sendJSON(res, errorResponse('Message required', 'INVALID_REQUEST'), 400);
        }

        // Switch to domain identity if needed
        const currentIdentity = identityKeyring.activeIdentity;
        if (!currentIdentity || currentIdentity.profile.domain !== domain) {
          const identities = await identityKeyring.listIdentities();
          const domainIdentity = identities.find(i => i.domain === domain);

          if (domainIdentity) {
            await identityKeyring.switchIdentity(domainIdentity.id);
          } else {
            // Create new identity for this domain
            await identityKeyring.createIdentity(domain);
          }
        }

        // Build domain-specific system prompt
        const DomainContext = require('./llm/domain-context.js');
        const domainContext = new DomainContext();
        const systemPrompt = domainContext.getSystemPrompt(domain);

        // Prepare messages for learning router
        const messages = [
          { role: 'system', content: systemPrompt },
          ...history.map(h => ({ role: h.role, content: h.content })),
          { role: 'user', content: message }
        ];

        // Use learning router for adaptive response
        const result = await learningRouter.chat(message, {
          history: history,
          provider: 'ollama', // Prefer local Ollama
          systemPrompt: systemPrompt
        });

        // Save conversation to identity memory
        await identityKeyring.addConversation(message, result.content, {
          domain,
          expertise: result.expertise
        });

        sendJSON(res, successResponse({
          response: result.content,
          domain,
          identity: identityKeyring.activeIdentity.id,
          expertise: result.expertise
        }));
      } catch (error) {
        console.error('Assistant chat error:', error);
        sendJSON(res, errorResponse(error.message, 'CHAT_ERROR'), 500);
      }
      return;
    }

    // Analyze Code
    if (pathname === '/api/assistant/analyze-code' && method === 'POST') {
      try {
        const body = await parseBody(req);
        const { code, language, task = 'analyze', domain = 'soulfra' } = body;

        if (!code) {
          return sendJSON(res, errorResponse('Code required', 'INVALID_REQUEST'), 400);
        }

        const result = await codeAnalyzer.analyzeCode(code, language, { task });

        sendJSON(res, successResponse(result));
      } catch (error) {
        console.error('Code analysis error:', error);
        sendJSON(res, errorResponse(error.message, 'ANALYSIS_ERROR'), 500);
      }
      return;
    }

    // Get Active Identity
    if (pathname === '/api/assistant/identity' && method === 'GET') {
      try {
        const identity = identityKeyring.getActiveIdentity();
        sendJSON(res, successResponse(identity));
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'IDENTITY_ERROR'), 500);
      }
      return;
    }

    // Switch Identity
    if (pathname === '/api/assistant/switch-identity' && method === 'POST') {
      try {
        const body = await parseBody(req);
        const { identityId, domain } = body;

        if (identityId) {
          await identityKeyring.switchIdentity(identityId);
        } else if (domain) {
          // Find or create identity for domain
          const identities = await identityKeyring.listIdentities();
          const domainIdentity = identities.find(i => i.domain === domain);

          if (domainIdentity) {
            await identityKeyring.switchIdentity(domainIdentity.id);
          } else {
            await identityKeyring.createIdentity(domain);
          }
        } else {
          return sendJSON(res, errorResponse('identityId or domain required', 'INVALID_REQUEST'), 400);
        }

        const identity = identityKeyring.getActiveIdentity();
        sendJSON(res, successResponse(identity));
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'SWITCH_ERROR'), 500);
      }
      return;
    }

    // List Identities
    if (pathname === '/api/assistant/identities' && method === 'GET') {
      try {
        const identities = await identityKeyring.listIdentities();
        sendJSON(res, successResponse({ identities }));
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'LIST_ERROR'), 500);
      }
      return;
    }

    // Get Assistant Info
    if (pathname === '/api/assistant/info' && method === 'GET') {
      try {
        const identityInfo = identityKeyring.getInfo();
        const codeAnalyzerInfo = codeAnalyzer.getInfo();

        sendJSON(res, successResponse({
          identity: identityInfo,
          codeAnalyzer: codeAnalyzerInfo,
          learningRouter: learningRouter.getStats()
        }));
      } catch (error) {
        sendJSON(res, errorResponse(error.message, 'INFO_ERROR'), 500);
      }
      return;
    }

    // ==========================================
    // Create Digital Twin Account
    // ==========================================
    if (pathname === '/api/twin/create' && method === 'POST') {
      try {
        const body = await parseBody(req);
        const twin = twinGenerator.createTwin(body);
        const twinUrl = twinGenerator.getTwinURL(twin.id);

        sendJSON(res, successResponse({
          twin,
          url: twinUrl,
          qrCodeUrl: `/api/qr/generate?text=${encodeURIComponent(twinUrl)}`
        }));
      } catch (error) {
        sendJSON(res, errorResponse('TWIN_CREATE_ERROR', error.message), 500);
      }
      return;
    }

    // ==========================================
    // Get Digital Twin by ID
    // ==========================================
    if (pathname.startsWith('/api/twin/') && method === 'GET') {
      const twinId = pathname.split('/').pop();
      const twin = twinGenerator.getTwin(twinId);

      if (!twin) {
        return sendJSON(res, errorResponse('TWIN_NOT_FOUND', `Twin ${twinId} not found`), 404);
      }

      sendJSON(res, successResponse(twin));
      return;
    }

    // ==========================================
    // List All Twins
    // ==========================================
    if (pathname === '/api/twin' && method === 'GET') {
      const twins = twinGenerator.getAllTwins();
      sendJSON(res, successResponse({ twins, count: twins.length }));
      return;
    }

    // ==========================================
    // SadTalker Log Streaming (for progress visualization)
    // ==========================================
    if (pathname === '/api/logs/sadtalker' && method === 'GET') {
      try {
        const fs = require('fs');
        const logPath = '/tmp/sadtalker_test.log';

        if (!fs.existsSync(logPath)) {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Log file not found');
          return;
        }

        const logContent = fs.readFileSync(logPath, 'utf8');
        res.writeHead(200, {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(logContent);
      } catch (error) {
        sendJSON(res, errorResponse('LOG_READ_ERROR', error.message), 500);
      }
      return;
    }

    // ==========================================
    // API Documentation
    // ==========================================
    if (pathname === '/api' && method === 'GET') {
      const aiProviderStatus = {};
      for (const [name, provider] of aiProviders) {
        aiProviderStatus[name] = provider.getInfo();
      }

      sendJSON(res, successResponse({
        name: 'Soulfra Unified API',
        version: '2.0.0',
        improvements: [
          'GitHub pagination - gets ALL repos',
          'Safe file operations with locking',
          'Proper CORS preflight (204)',
          'Error handling everywhere',
          'Adapter fallbacks (graceful degradation)',
          'Standardized response format',
          'AI provider abstraction (OpenAI, Claude)',
          'Auto-routing to best AI model'
        ],
        endpoints: {
          'GET /api/health': 'Health check with adapter, AI provider, and storage status',
          'GET /api/debug/github-repos': 'Get ALL GitHub repositories (with pagination)',
          'POST /api/email-capture': 'Save email capture (atomic operation)',
          'POST /api/comments': 'Save comment (atomic operation)',
          'POST /api/qr/generate': 'Generate QR code (via QRAdapter or fallback)',
          'POST /api/chat': 'Chat with AI (auto-routes to OpenAI/Claude)',
          'POST /api/chat/stream': 'Stream chat response (real-time tokens)',
          'POST /api/agent/build': 'Build agent (via AgentAdapter or fallback)',
          'POST /api/auth/qr/generate': 'Generate QR login session',
          'GET /api/auth/qr/status/:id': 'Check QR login status'
        },
        adapters: {
          qr: qrAdapter ? qrAdapter.getBackendInfo() : { available: false },
          agent: agentAdapter ? agentAdapter.getBackendInfo() : { available: false },
          orchestrator: orchestratorAdapter ? orchestratorAdapter.getBackendInfo() : { available: false }
        },
        aiProviders: aiProviderStatus
      }));
      return;
    }

    // ==========================================
    // 404 Not Found
    // ==========================================
    sendJSON(res, errorResponse(
      'Endpoint not found',
      'NOT_FOUND',
      {
        path: pathname,
        method,
        availableEndpoints: [
          'GET /api',
          'GET /api/health',
          'GET /api/debug/github-repos',
          'POST /api/email-capture',
          'POST /api/comments',
          'POST /api/qr/generate',
          'POST /api/chat',
          'POST /api/chat/stream',
          'POST /api/agent/build',
          'POST /api/auth/qr/generate',
          'GET /api/auth/qr/status/:id'
        ]
      }
    ), 404);

  } catch (error) {
    console.error('❌ Unhandled error:', error);
    sendJSON(res, errorResponse(
      'Internal server error',
      'INTERNAL_ERROR',
      {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    ), 500);
  }
}

// Create server
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  const hasOpenAI = aiProviders.has('openai');
  const hasClaude = aiProviders.has('claude');

  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║       🚀 Soulfra Unified API Backend v2.0                 ║
║                                                            ║
║  Server running on http://localhost:${PORT}                 ║
║                                                            ║
║  ✅ GitHub pagination - gets ALL repos                    ║
║  ✅ Safe file operations with locking                     ║
║  ✅ Proper CORS preflight (204)                           ║
║  ✅ Error handling everywhere                             ║
║  ✅ Adapter fallbacks (graceful degradation)              ║
║  ✅ Standardized response format                          ║
║  ✅ AI provider abstraction & auto-routing                ║
║                                                            ║
║  AI Providers:                                             ║
║    - OpenAI: ${hasOpenAI ? '✅ Ready' : '⚠️ Not configured'}                             ║
║    - Claude: ${hasClaude ? '✅ Ready' : '⚠️ Not configured'}                             ║
║                                                            ║
║  Adapters:                                                 ║
║    - QR: ${qrAdapter && qrAdapter.isReady() ? '✅ Ready' : '⚠️ Fallback Mode'}                             ║
║    - Agent: ${agentAdapter && agentAdapter.isReady() ? '✅ Ready' : '⚠️ Fallback Mode'}                        ║
║                                                            ║
║  API Docs: http://localhost:${PORT}/api                     ║
║  Health Check: http://localhost:${PORT}/api/health          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

  console.log('📋 Available endpoints:');
  console.log('  GET  /api');
  console.log('  GET  /api/health');
  console.log('  GET  /api/debug/github-repos');
  console.log('  POST /api/email-capture');
  console.log('  POST /api/comments');
  console.log('  POST /api/qr/generate');
  console.log('  POST /api/chat');
  console.log('  POST /api/chat/stream');
  console.log('  POST /api/agent/build');
  console.log('  POST /api/auth/qr/generate');
  console.log('  GET  /api/auth/qr/status/:id');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = server;
