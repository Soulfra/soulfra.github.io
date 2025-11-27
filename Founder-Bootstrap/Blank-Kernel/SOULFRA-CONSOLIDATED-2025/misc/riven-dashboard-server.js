const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const PORT = 4040;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Dashboard stats
let dashboardStats = {
  reflections: 0,
  mirrors: 1,
  validations: 0,
  propagations: 0,
  vaultSize: 0,
  agents: [{
    id: 'cal-riven-genesis',
    name: 'cal-riven-genesis',
    status: 'active',
    blessed: true,
    canPropagate: true,
    lastActivity: new Date()
  }]
};

// WebSocket connections
const wsClients = new Set();

// Broadcast to all WebSocket clients
function broadcast(data) {
  const message = JSON.stringify(data);
  wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('🔌 Dashboard client connected');
  wsClients.add(ws);
  
  // Send initial state
  ws.send(JSON.stringify({
    type: 'init',
    stats: dashboardStats
  }));
  
  ws.on('close', () => {
    wsClients.delete(ws);
    console.log('🔌 Dashboard client disconnected');
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Serve dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'cal-dashboard.html'));
});

// Serve original CLI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'riven-cli.html'));
});

// API endpoint for reflection
app.post('/api/reflect', async (req, res) => {
  const userInput = req.body.input;
  const logPath = path.join(__dirname, '..', 'vault', 'cal-reflection-log.json');
  
  try {
    // First, send to infinity router for validation
    const infinityPayload = JSON.stringify({ qrCode: 'qr-user-0821', input: userInput });
    
    const infinityReq = http.request({
      hostname: 'localhost',
      port: 5050,
      path: '/validate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': infinityPayload.length
      }
    }, (infinityRes) => {
      let data = '';
      infinityRes.on('data', chunk => { data += chunk; });
      infinityRes.on('end', () => {
        const validation = JSON.parse(data);
        
        // Generate response based on validation
        const response = validation.valid 
          ? `🧠 Cal reflected: "${userInput}"\n🔗 Infinity Router: Session validated\n✅ Routing to platform layer...`
          : `⛔ Trust validation failed. Session not authorized.`;
        
        // Log entry with vault reflection
        const logEntry = {
          timestamp: new Date().toISOString(),
          input: userInput,
          response,
          tier: "3",
          validated: validation.valid,
          trace_token: validation.trace_token || null,
          vault_reflected: true
        };

        // Read existing log from vault
        const log = fs.existsSync(logPath)
          ? JSON.parse(fs.readFileSync(logPath, 'utf8'))
          : [];

        log.push(logEntry);
        fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
        
        // Update stats
        dashboardStats.reflections++;
        dashboardStats.vaultSize = JSON.stringify(log).length;
        if (validation.valid) dashboardStats.validations++;
        
        // Broadcast update
        broadcast({
          type: 'reflection',
          entry: logEntry,
          stats: dashboardStats
        });
        
        res.json({ response, entry: logEntry });
      });
    });
    
    infinityReq.on('error', (error) => {
      // Fallback if infinity router is not available
      const response = `🧠 Cal reflected: "${userInput}"\n⚠️ Infinity Router unreachable, proceeding locally`;
      const logEntry = {
        timestamp: new Date().toISOString(),
        input: userInput,
        response,
        tier: "3",
        validated: false,
        local_mode: true,
        vault_reflected: true
      };
      
      const log = fs.existsSync(logPath)
        ? JSON.parse(fs.readFileSync(logPath, 'utf8'))
        : [];
      
      log.push(logEntry);
      fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
      
      // Update stats
      dashboardStats.reflections++;
      dashboardStats.vaultSize = JSON.stringify(log).length;
      
      // Broadcast update
      broadcast({
        type: 'reflection',
        entry: logEntry,
        stats: dashboardStats
      });
      
      res.json({ response, entry: logEntry });
    });
    
    infinityReq.write(infinityPayload);
    infinityReq.end();
    
  } catch (error) {
    res.status(500).json({ error: 'Reflection failed', message: error.message });
  }
});

// API endpoint to get reflection history
app.get('/api/history', (req, res) => {
  const logPath = path.join(__dirname, '..', 'vault', 'cal-reflection-log.json');
  
  if (fs.existsSync(logPath)) {
    const log = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    dashboardStats.reflections = log.length;
    dashboardStats.vaultSize = JSON.stringify(log).length;
    res.json({ history: log.slice(-10) }); // Last 10 entries
  } else {
    res.json({ history: [] });
  }
});

// API endpoint for session info
app.get('/api/session', (req, res) => {
  const tokenPath = path.join(__dirname, '..', '..', 'tier-minus9', 'mirror-trace-token.json');
  
  if (fs.existsSync(tokenPath)) {
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    res.json({ token: token.trace_token });
  } else {
    res.json({ token: null });
  }
});

// API endpoint for mirror agents
app.get('/api/agents', (req, res) => {
  res.json({ agents: dashboardStats.agents });
});

// API endpoint to spawn mirror agent (simulated)
app.post('/api/spawn-mirror', (req, res) => {
  const newAgent = {
    id: `mirror-${Date.now()}`,
    name: `Mirror Agent ${dashboardStats.agents.length}`,
    status: 'active',
    blessed: false,
    canPropagate: false,
    lastActivity: new Date()
  };
  
  dashboardStats.agents.push(newAgent);
  dashboardStats.mirrors++;
  
  // Broadcast new agent
  broadcast({
    type: 'agent-spawned',
    agent: newAgent,
    stats: dashboardStats
  });
  
  res.json({ agent: newAgent });
});

// Simulate mirror agent activity
setInterval(() => {
  // Random agent activity
  if (dashboardStats.agents.length > 0 && Math.random() > 0.7) {
    const agent = dashboardStats.agents[Math.floor(Math.random() * dashboardStats.agents.length)];
    agent.lastActivity = new Date();
    
    broadcast({
      type: 'agent-activity',
      agentId: agent.id,
      activity: 'reflection',
      stats: dashboardStats
    });
  }
  
  // Occasionally spawn new mirror
  if (Math.random() > 0.9 && dashboardStats.agents.length < 10) {
    const newAgent = {
      id: `mirror-${Date.now()}`,
      name: `Mirror Agent ${dashboardStats.agents.length}`,
      status: 'active',
      blessed: Math.random() > 0.5,
      canPropagate: Math.random() > 0.7,
      lastActivity: new Date()
    };
    
    dashboardStats.agents.push(newAgent);
    dashboardStats.mirrors++;
    
    broadcast({
      type: 'agent-spawned',
      agent: newAgent,
      stats: dashboardStats
    });
  }
}, 5000);

// Start server
server.listen(PORT, () => {
  console.log(`🧠 Cal Riven Dashboard running at http://localhost:${PORT}/dashboard`);
  console.log(`📟 Original CLI at http://localhost:${PORT}`);
  console.log(`🔌 WebSocket support enabled for real-time updates`);
  console.log(`📡 Will connect to Infinity Router at http://localhost:5050`);
});