// infinity-router.js - HTTP server for Infinity Router on port 5050

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5050;

// Valid QR codes (legacy support)
const validQRCodes = ["qr-founder-0000", "qr-riven-001", "qr-user-0821"];

// Validate QR function - now integrates with Genesis QR system
function validateQR(qrCode) {
  // Check Genesis QR format first
  if (qrCode && qrCode.startsWith('cal-riven://')) {
    const qrSeedPath = path.join(__dirname, '..', 'vault', 'qr-seed.sig');
    const verifiedUsersPath = path.join(__dirname, '..', 'vault', 'verified-users.json');
    
    if (fs.existsSync(qrSeedPath)) {
      const qrSeed = JSON.parse(fs.readFileSync(qrSeedPath, 'utf8'));
      const token = qrCode.replace('cal-riven://', '');
      
      if (token === qrSeed.token) {
        console.log("✅ Genesis QR validated:", token.substring(0, 8) + '...');
        
        // Update verified users
        let verifiedUsers = {};
        if (fs.existsSync(verifiedUsersPath)) {
          verifiedUsers = JSON.parse(fs.readFileSync(verifiedUsersPath, 'utf8'));
        }
        
        const userId = `qr_${qrSeed.payload.device.substring(0, 8)}`;
        verifiedUsers[userId] = {
          device: qrSeed.payload.device,
          qrToken: token,
          lastVerified: new Date().toISOString(),
          operator: qrSeed.payload.operator || 'cal-riven-root'
        };
        
        fs.writeFileSync(verifiedUsersPath, JSON.stringify(verifiedUsers, null, 2));
        return true;
      }
    }
  }
  
  // Fall back to legacy QR codes
  if (validQRCodes.includes(qrCode)) {
    console.log("✅ Legacy QR validated:", qrCode);
    return true;
  }
  
  console.error("⛔ Invalid QR code. Session denied.");
  return false;
}

// Generate trace token
function injectTraceToken(qrCode) {
  const timestamp = new Date().toISOString();
  const token = {
    uuid: qrCode,
    trace_token: "token_" + Math.random().toString(36).substring(2, 12),
    issued_at: timestamp,
    tier: "-9"
  };
  
  const tokenPath = path.join(__dirname, '..', 'vault', 'mirror-trace-token.json');
  fs.writeFileSync(tokenPath, JSON.stringify(token, null, 2));
  console.log("🔗 Mirror trace token issued.");
  return token;
}

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
          const tokenPath = path.join(__dirname, '..', 'vault', 'mirror-trace-token.json');
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