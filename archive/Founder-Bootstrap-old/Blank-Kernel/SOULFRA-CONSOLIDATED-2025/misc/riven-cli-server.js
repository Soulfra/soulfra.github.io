const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const app = express();
const PORT = 4040;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'riven-cli.html'));
});

// API endpoint for reflection
app.post('/api/reflect', async (req, res) => {
  const userInput = req.body.input;
  const logPath = path.join(__dirname, '..', 'cal-reflection-log.json');
  
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
  const logPath = path.join(__dirname, '..', 'cal-reflection-log.json');
  
  if (fs.existsSync(logPath)) {
    const log = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    res.json({ history: log.slice(-10) }); // Last 10 entries
  } else {
    res.json({ history: [] });
  }
});

app.listen(PORT, () => {
  console.log(`🧠 Cal Riven CLI running at http://localhost:${PORT}`);
  console.log(`📡 Will connect to Infinity Router at http://localhost:5050`);
});
