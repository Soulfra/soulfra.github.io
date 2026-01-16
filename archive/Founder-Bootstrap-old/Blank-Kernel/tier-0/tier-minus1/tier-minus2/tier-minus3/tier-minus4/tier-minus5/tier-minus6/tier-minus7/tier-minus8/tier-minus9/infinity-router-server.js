// infinity-router-server.js - HTTP server for Infinity Router on port 5050

const http = require('http');
const fs = require('fs');
const path = require('path');
const { validateQR } = require('./qr-validator');
const { injectTraceToken } = require('./infinity-router');

const PORT = 5050;

// Create HTTP server
const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Handle status endpoint
  if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'online', 
      tier: '-9',
      service: 'infinity-router',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // Handle validate endpoint
  if (req.method === 'POST' && req.url === '/validate') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { qrCode, input } = data;
        
        // Validate QR code
        const isValid = validateQR(qrCode);
        
        if (isValid) {
          // Generate or retrieve trace token
          const tokenPath = path.join(__dirname, 'mirror-trace-token.json');
          let token;
          
          if (fs.existsSync(tokenPath)) {
            token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
          } else {
            token = injectTraceToken(qrCode);
          }
          
          // Log the validation
          console.log(`✅ Validated: ${qrCode} - Input: "${input}"`);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            valid: true,
            qrCode,
            trace_token: token.trace_token,
            message: 'Session validated',
            tier: '-9'
          }));
        } else {
          console.log(`⛔ Invalid QR: ${qrCode}`);
          
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            valid: false,
            qrCode,
            message: 'Invalid QR code',
            tier: '-9'
          }));
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Invalid request',
          message: error.message
        }));
      }
    });
    return;
  }
  
  // Handle root endpoint
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('🔗 Infinity Router (Tier -9) - Trust Validation Service\n');
    return;
  }
  
  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Start server
server.listen(PORT, () => {
  console.log(`🔗 Infinity Router running at http://localhost:${PORT}`);
  console.log('📡 Endpoints:');
  console.log('  GET  /status   - Check service status');
  console.log('  POST /validate - Validate QR code and get trace token');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down Infinity Router...');
  server.close(() => {
    console.log('Infinity Router stopped.');
  });
});