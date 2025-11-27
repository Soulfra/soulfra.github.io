/**
 * Billion Dollar Game - Main Server
 * Production-ready game server with WebSocket support
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Import game components
const GameEngine = require('./core/game-engine');
const AuthManager = require('./auth/auth-manager');
const AgentFramework = require('./agents/agent-framework');

// WebSocket implementation
class SimpleWebSocket {
  constructor(server) {
    this.server = server;
    this.clients = new Map();
    this.setupWebSocket();
  }
  
  setupWebSocket() {
    this.server.on('upgrade', (request, socket, head) => {
      this.handleUpgrade(request, socket, head);
    });
  }
  
  handleUpgrade(request, socket, head) {
    const key = request.headers['sec-websocket-key'];
    const accept = this.generateAcceptKey(key);
    
    const responseHeaders = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${accept}`,
      '', ''
    ].join('\r\n');
    
    socket.write(responseHeaders);
    
    const clientId = crypto.randomBytes(16).toString('hex');
    const client = {
      id: clientId,
      socket,
      authenticated: false,
      playerId: null
    };
    
    this.clients.set(clientId, client);
    
    socket.on('data', (data) => this.handleMessage(clientId, data));
    socket.on('close', () => this.handleClose(clientId));
    socket.on('error', (err) => console.error('WebSocket error:', err));
  }
  
  generateAcceptKey(key) {
    return crypto
      .createHash('sha1')
      .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
      .digest('base64');
  }
  
  handleMessage(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    try {
      const message = this.parseWebSocketFrame(data);
      const parsed = JSON.parse(message);
      
      this.emit('message', {
        clientId,
        client,
        type: parsed.type,
        data: parsed.data
      });
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  }
  
  parseWebSocketFrame(buffer) {
    const firstByte = buffer[0];
    const secondByte = buffer[1];
    
    const isMasked = (secondByte & 0x80) === 0x80;
    let payloadLength = secondByte & 0x7F;
    let offset = 2;
    
    if (payloadLength === 126) {
      payloadLength = buffer.readUInt16BE(offset);
      offset += 2;
    } else if (payloadLength === 127) {
      offset += 8;
      payloadLength = buffer.readUInt32BE(offset - 4);
    }
    
    const maskKey = isMasked ? buffer.slice(offset, offset + 4) : null;
    offset += isMasked ? 4 : 0;
    
    const payload = buffer.slice(offset, offset + payloadLength);
    
    if (isMasked) {
      for (let i = 0; i < payload.length; i++) {
        payload[i] ^= maskKey[i % 4];
      }
    }
    
    return payload.toString('utf8');
  }
  
  send(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || !client.socket.writable) return;
    
    const message = JSON.stringify(data);
    const frame = this.createWebSocketFrame(message);
    client.socket.write(frame);
  }
  
  broadcast(data, filter) {
    this.clients.forEach((client, clientId) => {
      if (!filter || filter(client)) {
        this.send(clientId, data);
      }
    });
  }
  
  createWebSocketFrame(message) {
    const messageBuffer = Buffer.from(message);
    const messageLength = messageBuffer.length;
    
    let frame;
    
    if (messageLength < 126) {
      frame = Buffer.allocUnsafe(2);
      frame[0] = 0x81;
      frame[1] = messageLength;
    } else if (messageLength < 65536) {
      frame = Buffer.allocUnsafe(4);
      frame[0] = 0x81;
      frame[1] = 126;
      frame.writeUInt16BE(messageLength, 2);
    } else {
      frame = Buffer.allocUnsafe(10);
      frame[0] = 0x81;
      frame[1] = 127;
      frame.writeUInt32BE(0, 2);
      frame.writeUInt32BE(messageLength, 6);
    }
    
    return Buffer.concat([frame, messageBuffer]);
  }
  
  handleClose(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      this.emit('disconnect', { clientId, client });
      this.clients.delete(clientId);
    }
  }
  
  emit(event, data) {
    // Simple event emitter functionality
    if (this.handlers && this.handlers[event]) {
      this.handlers[event].forEach(handler => handler(data));
    }
  }
  
  on(event, handler) {
    if (!this.handlers) this.handlers = {};
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(handler);
  }
}

// Main Game Server
class BillionDollarGameServer {
  constructor() {
    this.port = process.env.PORT || 8080;
    this.gameEngine = new GameEngine();
    this.authManager = new AuthManager();
    this.agentFramework = new AgentFramework(this.gameEngine);
    this.server = null;
    this.websocket = null;
  }
  
  async start() {
    console.log('=== Billion Dollar Game Server ===');
    console.log('Starting server...');
    
    // Initialize components
    await this.gameEngine.initialize();
    await this.authManager.initialize();
    await this.agentFramework.initialize();
    
    // Create HTTP server
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });
    
    // Setup WebSocket
    this.websocket = new SimpleWebSocket(this.server);
    this.setupWebSocketHandlers();
    
    // Start listening
    this.server.listen(this.port, () => {
      console.log(`Server running at http://localhost:${this.port}`);
      console.log('WebSocket endpoint: ws://localhost:' + this.port);
      console.log('\nGame is ready! Players can now join.\n');
      
      // Create some AI agents
      this.createInitialAgents();
    });
    
    // Handle shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }
  
  handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    // Route requests
    if (pathname === '/' && method === 'GET') {
      this.serveHomePage(req, res);
    } else if (pathname.startsWith('/api/')) {
      this.handleAPI(req, res, pathname, method, parsedUrl.query);
    } else if (pathname.startsWith('/static/')) {
      this.serveStatic(req, res, pathname);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }
  
  serveHomePage(req, res) {
    const indexPath = path.join(__dirname, 'frontend', 'index.html');
    
    fs.readFile(indexPath, (err, data) => {
      if (err) {
        // Serve a simple default page if index.html doesn't exist
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(this.getDefaultHTML());
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
  }
  
  async handleAPI(req, res, pathname, method, query) {
    const path = pathname.replace('/api/', '');
    
    try {
      let result;
      
      // Parse request body if needed
      let body = '';
      if (method === 'POST' || method === 'PUT') {
        body = await this.getRequestBody(req);
      }
      
      // Authentication endpoints
      if (path === 'v1/auth/qr' && method === 'POST') {
        const data = JSON.parse(body);
        result = await this.authManager.authenticateQR(data.qrCode, {
          ipAddress: req.connection.remoteAddress,
          userAgent: req.headers['user-agent']
        });
        
      } else if (path === 'v1/auth/agent' && method === 'POST') {
        const data = JSON.parse(body);
        result = await this.authManager.authenticateAgent(data.agentId, data.credentials);
        
      } else if (path === 'v1/auth/verify' && method === 'GET') {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const session = this.authManager.verifyToken(token);
        result = { valid: !!session, session };
        
      // Game endpoints
      } else if (path === 'v1/game/state' && method === 'GET') {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const session = this.authManager.verifyToken(token);
        if (!session) throw new Error('Unauthorized');
        
        result = this.gameEngine.getPlayerState(session.playerId);
        
      } else if (path === 'v1/game/action' && method === 'POST') {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const session = this.authManager.verifyToken(token);
        if (!session) throw new Error('Unauthorized');
        
        const action = JSON.parse(body);
        result = await this.gameEngine.executeAction(session.playerId, action);
        
      } else if (path === 'v1/game/leaderboard' && method === 'GET') {
        result = this.gameEngine.getLeaderboard();
        
      // Company endpoints
      } else if (path === 'v1/company/create' && method === 'POST') {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const session = this.authManager.verifyToken(token);
        if (!session) throw new Error('Unauthorized');
        
        const data = JSON.parse(body);
        result = this.gameEngine.createCompany(session.playerId, data);
        
      // Market endpoints
      } else if (path === 'v1/market/prices' && method === 'GET') {
        result = this.gameEngine.state.market.resources;
        
      // Agent endpoints
      } else if (path === 'v1/agents' && method === 'GET') {
        result = this.agentFramework.getAllAgentStats();
        
      } else if (path === 'v1/agents/spawn' && method === 'POST') {
        const data = JSON.parse(body);
        result = await this.agentFramework.createAgent(data.agentId, data.config);
        
      // Stats endpoints
      } else if (path === 'v1/stats' && method === 'GET') {
        result = {
          game: {
            players: this.gameEngine.state.players.size,
            companies: this.gameEngine.state.companies.size,
            gameTime: this.gameEngine.state.gameTime
          },
          auth: this.authManager.getStats(),
          agents: this.agentFramework.agents.size
        };
        
      } else {
        throw new Error('Endpoint not found');
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: result }));
      
    } catch (error) {
      console.error('API Error:', error);
      res.writeHead(error.message === 'Unauthorized' ? 401 : 400, { 
        'Content-Type': 'application/json' 
      });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
  }
  
  getRequestBody(req) {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => resolve(body));
    });
  }
  
  setupWebSocketHandlers() {
    this.websocket.on('message', async ({ clientId, client, type, data }) => {
      try {
        switch (type) {
          case 'auth':
            const session = this.authManager.verifyToken(data.token);
            if (session) {
              client.authenticated = true;
              client.playerId = session.playerId;
              this.websocket.send(clientId, {
                type: 'auth_success',
                playerId: session.playerId
              });
              
              // Send initial state
              const state = this.gameEngine.getPlayerState(session.playerId);
              this.websocket.send(clientId, {
                type: 'game_state',
                data: state
              });
            } else {
              this.websocket.send(clientId, {
                type: 'auth_failed',
                error: 'Invalid token'
              });
            }
            break;
            
          case 'action':
            if (!client.authenticated) {
              this.websocket.send(clientId, {
                type: 'error',
                error: 'Not authenticated'
              });
              return;
            }
            
            const result = await this.gameEngine.executeAction(client.playerId, data);
            this.websocket.send(clientId, {
              type: 'action_result',
              data: result
            });
            break;
            
          case 'ping':
            this.websocket.send(clientId, { type: 'pong' });
            break;
        }
      } catch (error) {
        this.websocket.send(clientId, {
          type: 'error',
          error: error.message
        });
      }
    });
    
    this.websocket.on('disconnect', ({ client }) => {
      console.log(`Client disconnected: ${client.id}`);
    });
    
    // Game event broadcasting
    this.gameEngine.on('tick', (data) => {
      this.websocket.broadcast({
        type: 'game_tick',
        data
      }, client => client.authenticated);
    });
    
    this.gameEngine.on('marketEvent', (event) => {
      this.websocket.broadcast({
        type: 'market_event',
        data: event
      }, client => client.authenticated);
    });
    
    this.gameEngine.on('gameWon', (data) => {
      this.websocket.broadcast({
        type: 'game_won',
        data
      }, client => client.authenticated);
    });
  }
  
  async createInitialAgents() {
    console.log('Creating initial AI agents...');
    
    const strategies = ['entrepreneur', 'industrialist', 'trader', 'strategist'];
    
    for (let i = 0; i < 4; i++) {
      const agentId = `ai_agent_${i}`;
      await this.agentFramework.createAgent(agentId, {
        strategy: strategies[i]
      });
    }
    
    // Create Cal-inspired agent if available
    if (this.agentFramework.strategies.has('cal-mirror')) {
      await this.agentFramework.createAgent('cal_mirror_agent', {
        strategy: 'cal-mirror'
      });
    }
    
    console.log('AI agents created and active');
  }
  
  getDefaultHTML() {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Billion Dollar Game</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f0f0f0;
    }
    .container {
      background: white;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      text-align: center;
    }
    .info {
      background: #e8f4f8;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .endpoint {
      background: #f8f8f8;
      padding: 10px;
      margin: 10px 0;
      border-left: 4px solid #4CAF50;
      font-family: monospace;
    }
    .button {
      background: #4CAF50;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
    }
    .button:hover {
      background: #45a049;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎮 Billion Dollar Game</h1>
    
    <div class="info">
      <h2>Welcome to the Billion Dollar Game!</h2>
      <p>Build your empire and be the first to reach $1 billion!</p>
      
      <h3>Game Features:</h3>
      <ul>
        <li>Real-time economic simulation</li>
        <li>AI agents competing alongside human players</li>
        <li>Dynamic market conditions</li>
        <li>Company creation and management</li>
        <li>Resource trading and arbitrage</li>
        <li>Strategic alliances and competition</li>
      </ul>
    </div>
    
    <div class="info">
      <h3>How to Play:</h3>
      <ol>
        <li>Authenticate using a valid QR code (qr-founder-0000, qr-riven-001, qr-user-0821)</li>
        <li>Start with $100,000 in seed capital</li>
        <li>Create companies in various industries</li>
        <li>Buy and sell resources based on market conditions</li>
        <li>Grow your companies through hiring and product development</li>
        <li>First to reach $1 billion valuation wins!</li>
      </ol>
    </div>
    
    <div class="info">
      <h3>API Endpoints:</h3>
      <div class="endpoint">POST /api/v1/auth/qr - Authenticate with QR code</div>
      <div class="endpoint">GET /api/v1/game/state - Get current game state</div>
      <div class="endpoint">POST /api/v1/game/action - Execute game action</div>
      <div class="endpoint">GET /api/v1/game/leaderboard - View leaderboard</div>
      <div class="endpoint">POST /api/v1/company/create - Create a company</div>
      <div class="endpoint">GET /api/v1/market/prices - Get resource prices</div>
      <div class="endpoint">WebSocket ws://localhost:${this.port} - Real-time updates</div>
    </div>
    
    <div class="info">
      <h3>Quick Start:</h3>
      <p>Use this curl command to authenticate:</p>
      <pre style="background: #f0f0f0; padding: 10px; overflow-x: auto;">
curl -X POST http://localhost:${this.port}/api/v1/auth/qr \\
  -H "Content-Type: application/json" \\
  -d '{"qrCode": "qr-founder-0000"}'
      </pre>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <button class="button" onclick="window.location.href='/game'">
        Launch Game Interface
      </button>
    </div>
  </div>
</body>
</html>
    `;
  }
  
  async shutdown() {
    console.log('\nShutting down server...');
    
    await this.gameEngine.shutdown();
    this.agentFramework.shutdown();
    
    if (this.server) {
      this.server.close();
    }
    
    console.log('Server shutdown complete');
    process.exit(0);
  }
}

// Start the server
const server = new BillionDollarGameServer();
server.start().catch(console.error);