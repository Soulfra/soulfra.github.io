#!/usr/bin/env node
/**
 * Unified API Backend
 *
 * Single Node.js server that implements ALL API endpoints
 * used across soulfra.github.io
 *
 * Routes through adapter layer to existing infrastructure.
 * Provides fallbacks when backends aren't running.
 *
 * Usage:
 *   node api/unified-backend.js
 *
 * Serves on port 5000
 */

const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = 5050;

// Load adapters (in Node.js mode, they'll use existing infrastructure)
const QRAdapter = require('./adapters/qr-adapter.js');
const AgentAdapter = require('./adapters/agent-adapter.js');
const OrchestratorAdapter = require('./adapters/orchestrator-adapter.js');

// Initialize adapters
const qrAdapter = new QRAdapter();
const agentAdapter = new AgentAdapter();
const orchestratorAdapter = new OrchestratorAdapter();

// Data storage (simple JSON files)
const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
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
        reject(e);
      }
    });
  });
}

/**
 * Send JSON response
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
 * GitHub API: Fetch user's repositories
 */
async function getGitHubRepos() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: '/users/soulfra/repos?per_page=100',
      method: 'GET',
      headers: {
        'User-Agent': 'Soulfra-Backend',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    https.get(options, (response) => {
      let data = '';
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => {
        try {
          const repos = JSON.parse(data);

          // Categorize repos
          const now = new Date();
          const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

          const active = [];
          const experiments = [];
          const archived = [];

          repos.forEach(repo => {
            const pushedAt = new Date(repo.pushed_at);
            const repoData = {
              name: repo.name,
              description: repo.description,
              url: repo.html_url,
              language: repo.language,
              stars: repo.stargazers_count,
              is_fork: repo.fork,
              is_private: repo.private,
              pushed_at: repo.pushed_at
            };

            if (repo.archived) {
              archived.push(repoData);
            } else if (pushedAt > thirtyDaysAgo) {
              active.push(repoData);
            } else {
              experiments.push(repoData);
            }
          });

          resolve({
            success: true,
            total_repos: repos.length,
            active,
            experiments,
            archived
          });
        } catch (error) {
          resolve({
            success: false,
            error: error.message
          });
        }
      });
    }).on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });
  });
}

/**
 * Save email capture to JSON file
 */
function saveEmailCapture(email, source = 'unknown') {
  const emailsFile = path.join(DATA_DIR, 'email-captures.json');
  let emails = [];

  if (fs.existsSync(emailsFile)) {
    emails = JSON.parse(fs.readFileSync(emailsFile, 'utf8'));
  }

  emails.push({
    email,
    source,
    timestamp: new Date().toISOString()
  });

  fs.writeFileSync(emailsFile, JSON.stringify(emails, null, 2));

  return { success: true, count: emails.length };
}

/**
 * Save comment to JSON file
 */
function saveComment(comment, author = 'Anonymous', source = 'unknown') {
  const commentsFile = path.join(DATA_DIR, 'comments.json');
  let comments = [];

  if (fs.existsSync(commentsFile)) {
    comments = JSON.parse(fs.readFileSync(commentsFile, 'utf8'));
  }

  comments.push({
    id: `comment-${Date.now()}`,
    comment,
    author,
    source,
    timestamp: new Date().toISOString()
  });

  fs.writeFileSync(commentsFile, JSON.stringify(comments, null, 2));

  return { success: true, id: comments[comments.length - 1].id };
}

/**
 * Main request handler
 */
async function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  console.log(`${method} ${pathname}`);

  // CORS preflight
  if (method === 'OPTIONS') {
    sendJSON(res, { ok: true });
    return;
  }

  try {
    // GitHub repos API
    if (pathname === '/api/debug/github-repos' && method === 'GET') {
      const repos = await getGitHubRepos();
      sendJSON(res, repos);
      return;
    }

    // Email capture API
    if (pathname === '/api/email-capture' && method === 'POST') {
      const body = await parseBody(req);
      const result = saveEmailCapture(body.email, body.source);
      sendJSON(res, result);
      return;
    }

    // Comments API
    if (pathname === '/api/comments' && method === 'POST') {
      const body = await parseBody(req);
      const result = saveComment(body.comment, body.author, body.source);
      sendJSON(res, result);
      return;
    }

    // QR Generation API (uses QRAdapter)
    if (pathname === '/api/qr/generate' && method === 'POST') {
      const body = await parseBody(req);
      const qr = await qrAdapter.generateQR(body.type || 'bootstrap', body.data || {});
      sendJSON(res, { success: true, qr });
      return;
    }

    // Chat API (uses OrchestratorAdapter)
    if (pathname === '/api/chat' && method === 'POST') {
      const body = await parseBody(req);
      const result = await orchestratorAdapter.route(body.message, {
        domain: body.domain || 'calriven',
        preferredModel: body.model
      });
      sendJSON(res, { success: true, result });
      return;
    }

    // Agent building API (uses AgentAdapter)
    if (pathname === '/api/agent/build' && method === 'POST') {
      const body = await parseBody(req);
      const agent = await agentAdapter.buildAgent(body.conversation, {
        vaultIntegration: body.vaultIntegration !== false,
        category: body.category || 'ui'
      });
      sendJSON(res, { success: true, agent });
      return;
    }

    // Auth: QR login session create
    if (pathname === '/api/auth/qr/generate' && method === 'POST') {
      const sessionId = `qr-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const sessionFile = path.join(DATA_DIR, `qr-session-${sessionId}.json`);

      const session = {
        sessionId,
        status: 'pending',
        created: new Date().toISOString(),
        expires: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 min
      };

      fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));

      sendJSON(res, { success: true, sessionId, qrData: `soulfra://auth?session=${sessionId}` });
      return;
    }

    // Auth: QR login status check
    if (pathname.startsWith('/api/auth/qr/status/') && method === 'GET') {
      const sessionId = pathname.split('/').pop();
      const sessionFile = path.join(DATA_DIR, `qr-session-${sessionId}.json`);

      if (fs.existsSync(sessionFile)) {
        const session = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
        sendJSON(res, { success: true, session });
      } else {
        sendJSON(res, { success: false, error: 'Session not found' }, 404);
      }
      return;
    }

    // Health check
    if (pathname === '/api/health' && method === 'GET') {
      sendJSON(res, {
        status: 'ok',
        adapters: {
          qr: qrAdapter.isReady(),
          agent: agentAdapter.isReady(),
          orchestrator: orchestratorAdapter.isReady()
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // API documentation
    if (pathname === '/api' && method === 'GET') {
      sendJSON(res, {
        name: 'Soulfra Unified API',
        version: '1.0.0',
        endpoints: {
          'GET /api/health': 'Health check',
          'GET /api/debug/github-repos': 'Get GitHub repositories',
          'POST /api/email-capture': 'Save email capture',
          'POST /api/comments': 'Save comment',
          'POST /api/qr/generate': 'Generate QR code (via QRAdapter)',
          'POST /api/chat': 'Chat with ensemble (via OrchestratorAdapter)',
          'POST /api/agent/build': 'Build agent from conversation (via AgentAdapter)',
          'POST /api/auth/qr/generate': 'Generate QR login session',
          'GET /api/auth/qr/status/:id': 'Check QR login status'
        },
        adapters: {
          qr: qrAdapter.getBackendInfo(),
          agent: agentAdapter.getBackendInfo(),
          orchestrator: orchestratorAdapter.getBackendInfo()
        }
      });
      return;
    }

    // 404
    sendJSON(res, {
      error: 'Not Found',
      path: pathname,
      availableEndpoints: [
        '/api',
        '/api/health',
        '/api/debug/github-repos',
        '/api/email-capture',
        '/api/comments',
        '/api/qr/generate',
        '/api/chat',
        '/api/agent/build',
        '/api/auth/qr/generate',
        '/api/auth/qr/status/:id'
      ]
    }, 404);

  } catch (error) {
    console.error('Error handling request:', error);
    sendJSON(res, {
      error: 'Internal Server Error',
      message: error.message
    }, 500);
  }
}

// Create server
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║       🚀 Soulfra Unified API Backend                      ║
║                                                            ║
║  Server running on http://localhost:${PORT}                 ║
║                                                            ║
║  ✅ Implements ALL missing API endpoints                  ║
║  ✅ Routes through adapter layer                          ║
║  ✅ Fallbacks when backends unavailable                   ║
║                                                            ║
║  Adapters:                                                 ║
║    - QR: ${qrAdapter.isReady() ? '✅ Ready' : '❌ Not Ready'}                                  ║
║    - Agent: ${agentAdapter.isReady() ? '✅ Ready' : '❌ Not Ready'}                             ║
║    - Orchestrator: ${orchestratorAdapter.isReady() ? '✅ Ready' : '❌ Not Ready'}                      ║
║                                                            ║
║  API Docs: http://localhost:${PORT}/api                     ║
║  Health Check: http://localhost:${PORT}/api/health          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

  console.log('Available endpoints:');
  console.log('  GET  /api');
  console.log('  GET  /api/health');
  console.log('  GET  /api/debug/github-repos');
  console.log('  POST /api/email-capture');
  console.log('  POST /api/comments');
  console.log('  POST /api/qr/generate');
  console.log('  POST /api/chat');
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
