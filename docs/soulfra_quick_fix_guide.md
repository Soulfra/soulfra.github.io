# Soulfra Quick Fix Guide
## From Silent Errors to Working Platform in 15 Minutes

---

## **The Problem: Silent Errors**

You're getting silent errors because of missing dependencies, configuration issues, or services not connecting properly. This is totally normal with complex platforms - let's fix it step by step.

---

## **Step 1: Run the Diagnostic Tool (2 minutes)**

Save the diagnostic tool I created as `diagnostic.js` in your project root, then:

```bash
# Run the diagnostic
node diagnostic.js

# If you get "Cannot find module" errors:
node diagnostic.js --minimal
```

This will tell you exactly what's missing.

---

## **Step 2: Quick Setup (5 minutes)**

If the diagnostic creates a fix script, run it:

```bash
# The diagnostic will create this automatically
chmod +x fix-soulfra.sh
./fix-soulfra.sh
```

If no fix script, manually create the basics:

```bash
# Create basic project structure
mkdir -p src/{orchestrator,analysis,trust,routing,mobile} public uploads temp

# Create package.json
cat > package.json << 'EOF'
{
  "name": "soulfra-platform",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "redis": "^4.6.0",
    "uuid": "^9.0.0",
    "papaparse": "^5.4.1"
  }
}
EOF

# Install dependencies
npm install
```

---

## **Step 3: Start Redis (2 minutes)**

Most silent errors come from Redis not running:

```bash
# Option 1: Docker (recommended)
docker run -d --name redis -p 6379:6379 redis:alpine

# Option 2: Local Redis
redis-server --daemonize yes

# Test Redis is working
redis-cli ping
# Should return: PONG
```

---

## **Step 4: Create Minimal Working Server (3 minutes)**

Create a basic `server.js` to test everything works:

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'Soulfra Platform API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.post('/api/test', (req, res) => {
  res.json({ 
    message: 'API working',
    received: req.body 
  });
});

app.listen(port, () => {
  console.log(`🚀 Soulfra Platform running on http://localhost:${port}`);
  console.log(`✅ Test: curl http://localhost:${port}/health`);
});
```

---

## **Step 5: Test Basic Functionality (2 minutes)**

```bash
# Start the server
npm start

# In another terminal, test it works:
curl http://localhost:3001/health
curl -X POST http://localhost:3001/api/test -H "Content-Type: application/json" -d '{"test": "data"}'

# You should see JSON responses
```

---

## **Step 6: Add One Service at a Time (1 minute per service)**

Once the basic server works, add services incrementally:

### **6a: Add Chat Log Analyzer**
```javascript
// src/analysis/simple-analyzer.js
class SimpleChatAnalyzer {
  async analyze(text) {
    return {
      messageCount: text.split('\n').length,
      themes: ['general'],
      insights: ['Basic analysis complete']
    };
  }
}

module.exports = { SimpleChatAnalyzer };
```

### **6b: Update server.js to use it**
```javascript
// Add to server.js
const { SimpleChatAnalyzer } = require('./src/analysis/simple-analyzer');
const analyzer = new SimpleChatAnalyzer();

app.post('/api/analyze', async (req, res) => {
  try {
    const result = await analyzer.analyze(req.body.text || '');
    res.json({ success: true, analysis: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### **6c: Test the service**
```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello\nWorld\nTest"}'
```

---

## **Common Silent Error Fixes**

### **Redis Connection Issues**
```bash
# Error: Redis connection failed
# Fix: Make sure Redis is running
docker ps | grep redis
# If not running:
docker start redis
```

### **Port Already in Use**
```bash
# Error: EADDRINUSE
# Fix: Kill the process or change port
pkill -f node
# Or:
PORT=3002 npm start
```

### **Module Not Found**
```bash
# Error: Cannot find module 'express'
# Fix: Install dependencies
npm install
```

### **Permission Denied**
```bash
# Error: EACCES
# Fix: Check file permissions
chmod +x server.js
# Or run with sudo (not recommended for development)
```

---

## **Debug Mode**

If you're still getting silent errors, run with debug output:

```bash
# Enable all debug output
DEBUG=* npm start

# Or just Node.js debugging
node --inspect server.js
```

---

## **Validation Checklist**

Once everything is working, you should be able to:

- [ ] `curl http://localhost:3001/health` returns `{"status":"healthy"}`
- [ ] `redis-cli ping` returns `PONG`
- [ ] `npm start` shows no error messages
- [ ] Server logs show "🚀 Soulfra Platform running on..."
- [ ] POST requests to `/api/test` return JSON responses

---

## **Next Steps After Basic Platform Works**

1. **Add file upload**: Use multer for chat log uploads
2. **Add orchestration**: Integrate the orchestration layer from my first artifact
3. **Add trust engine**: Connect user state management
4. **Add mobile export**: Generate mobile-friendly reports
5. **Add AI routing**: Connect to OpenAI/Anthropic APIs

---

## **Emergency Fallback**

If nothing works, use the minimal diagnostic server:

```bash
node diagnostic.js --minimal
```

This creates a basic HTTP server that will at least respond to requests while you debug.

---

## **Get Help**

If you're still stuck, run the diagnostic and share the output:

```bash
node diagnostic.js --verbose > debug-output.txt
```

The diagnostic will show exactly what's missing or misconfigured.

---

**Bottom Line**: Start with the minimal working server, then add one feature at a time. Don't try to run the full orchestration platform until the basic HTTP server is responding to requests.