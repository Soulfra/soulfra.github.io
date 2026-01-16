# 💻 Localhost Setup - Use Your Local PostgreSQL + Ollama

**Connect soulfra.com directly to your laptop** without any external services.

---

## 🎯 What This Does

```
You visit soulfra.com
    ↓
Browser loads JavaScript from GitHub Pages
    ↓
JavaScript calls http://localhost:5050/api/*
    ↓
Backend (running on YOUR laptop) responds
    ↓
Backend queries YOUR local PostgreSQL database
    ↓
Backend talks to YOUR local Ollama
    ↓
Data returns to browser
```

**No Vercel. No ngrok. No cloud. Just your laptop.**

---

## ✅ What You Already Have

- ✅ PostgreSQL installed and running
- ✅ `soulfra` database with 10 tables:
  - users
  - user_sessions
  - oauth_providers
  - agent_logs
  - ai_usage_history
  - ai_ab_experiments
  - ai_cost_alerts
  - etc.
- ✅ Ollama installed
- ✅ soulfra.com live on GitHub Pages
- ✅ Backend code (api/unified-backend-v2.js)

**You have EVERYTHING. Just need to connect it.**

---

## 🔧 How Browser-to-localhost Works

### The Security Model

Normally, browsers block:
```
https://soulfra.com → http://other-site.com  ❌ CORS error
```

But browsers ALLOW:
```
https://soulfra.com → http://localhost:5050  ✅ Works!
```

**Why?** Localhost is treated as a "secure context" for development.

Modern browsers (Chrome, Firefox, Safari) all allow https sites to call localhost APIs.

---

## 📋 Setup Steps

### Step 1: Update Backend to Use PostgreSQL

Your backend currently uses JSON files:
```javascript
// Current (data-store.js with JSON files)
const emailStore = new DataStore(path.join(__dirname, '../data/email-captures.json'));
```

Update to use PostgreSQL:
```javascript
// New (direct PostgreSQL queries)
const { Pool } = require('pg');
const db = new Pool({ database: 'soulfra' });
```

**I can create this for you** - see `migrate-to-postgres.js` script.

### Step 2: Configure CORS Headers

Backend needs to allow requests from `soulfra.com`:

```javascript
// api/unified-backend-v2.js
function sendCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://soulfra.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}
```

**Also allow localhost for testing:**
```javascript
const allowedOrigins = [
  'https://soulfra.com',
  'https://soulfra.github.io',
  'http://localhost:8000'
];
```

### Step 3: Keep Backend Running

```bash
# Start backend
npm run backend

# Or make it auto-start on laptop boot (see below)
```

### Step 4: Visit soulfra.com from Your Laptop

```bash
# Open browser
open https://soulfra.com

# Or test locally first
open http://localhost:8000
```

Browser will call `http://localhost:5050/api/*` automatically.

---

## 🚀 Auto-Start Backend on Boot

### macOS (launchd)

Create `~/Library/LaunchAgents/com.soulfra.backend.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.soulfra.backend</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/node</string>
        <string>/Users/matthewmauer/Desktop/soulfra.github.io/api/unified-backend-v2.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>/Users/matthewmauer/Desktop/soulfra.github.io</string>
    <key>StandardOutPath</key>
    <string>/tmp/soulfra-backend.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/soulfra-backend-error.log</string>
</dict>
</plist>
```

Load it:
```bash
launchctl load ~/Library/LaunchAgents/com.soulfra.backend.plist
```

Now backend starts automatically when you log in.

---

## 🗄️ PostgreSQL Schema (What You Have)

Your existing tables:

### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### user_sessions
```sql
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  session_token TEXT UNIQUE,
  expires_at TIMESTAMP
);
```

### agent_logs
```sql
CREATE TABLE agent_logs (
  id SERIAL PRIMARY KEY,
  agent_name TEXT,
  action TEXT,
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**(Check actual schema with `psql -d soulfra -c "\d users"`)**

---

## 🔌 Connecting to Ollama

Ollama runs on `localhost:11434`:

```javascript
// In your backend
async function queryOllama(prompt) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2:3b',
      prompt: prompt,
      stream: false
    })
  });

  const data = await response.json();
  return data.response;
}
```

**Your backend already has OllamaProvider** - just needs to use it.

---

## 📊 The Full Flow

### Example: User Logs In

1. **User visits `https://soulfra.com`**
   - GitHub Pages serves index.html
   - Browser loads JavaScript

2. **User clicks "Login"**
   - JavaScript calls `http://localhost:5050/api/auth/login`
   - Browser allows this (localhost exception)

3. **Backend receives request**
   - Queries `SELECT * FROM users WHERE username = $1`
   - PostgreSQL returns user data

4. **Backend creates session**
   - `INSERT INTO user_sessions ...`
   - Returns session token to browser

5. **Browser stores session**
   - Saves token in localStorage
   - User is logged in

---

## 🎨 Dashboard with Forms

### Example Dashboard UI

```html
<!-- soulfra.com/dashboard.html -->
<div class="dashboard">
  <h1>Query Your Data</h1>

  <!-- Query PostgreSQL -->
  <div class="query-box">
    <h2>SQL Query</h2>
    <textarea id="sql-query">SELECT * FROM users LIMIT 10</textarea>
    <button onclick="runQuery()">Run Query</button>
    <pre id="results"></pre>
  </div>

  <!-- Talk to Ollama -->
  <div class="ollama-box">
    <h2>Ask Ollama</h2>
    <input type="text" id="prompt" placeholder="Ask anything...">
    <button onclick="askOllama()">Send</button>
    <div id="response"></div>
  </div>
</div>

<script>
async function runQuery() {
  const sql = document.getElementById('sql-query').value;

  const res = await fetch('http://localhost:5050/api/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql })
  });

  const data = await res.json();
  document.getElementById('results').textContent = JSON.stringify(data, null, 2);
}

async function askOllama() {
  const prompt = document.getElementById('prompt').value;

  const res = await fetch('http://localhost:5050/api/ollama', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });

  const data = await res.json();
  document.getElementById('response').textContent = data.response;
}
</script>
```

---

## ⚠️ Limitations

### Only Works on Your Laptop

When YOU visit soulfra.com from YOUR laptop:
- ✅ Works perfectly
- ✅ Connects to localhost:5050
- ✅ Queries your PostgreSQL
- ✅ Talks to your Ollama

When SOMEONE ELSE visits soulfra.com:
- ❌ Their browser tries to call THEIR localhost:5050
- ❌ Nothing running there
- ❌ API calls fail

**This is a single-user setup.** Only you can use it (from your laptop).

### Laptop Must Be On

- Backend must be running
- PostgreSQL must be running
- Ollama must be running

If laptop sleeps/shuts down = site stops working.

---

## 🌍 Making It Work for Others

If you want OTHERS to use soulfra.com with these features:

### Option 1: Share on Local Network

Run backend with:
```bash
# Bind to all interfaces (not just localhost)
PORT=5050 HOST=0.0.0.0 node api/unified-backend-v2.js
```

Update frontend to use:
```javascript
BASE_URL: 'http://192.168.1.87:5050'  // Your laptop's IP
```

Now anyone on your WiFi can access it.

### Option 2: Use ngrok (Temporary Public Access)

```bash
ngrok http 5050
```

Get URL like `https://abc123.ngrok.app`, update api-config.js.

Now anyone on internet can access it (while ngrok running).

### Option 3: Deploy Backend (Back to Vercel/VPS)

If you want it to work for everyone 24/7:
- Deploy backend to Vercel/VPS
- Backend connects to... wait, PostgreSQL is only on your laptop

You'd need:
- Cloud PostgreSQL (Supabase, Neon, etc.) OR
- Expose local PostgreSQL (not recommended) OR
- Sync local → cloud database

---

## 🎯 What This Gives You

**Full control, zero external dependencies:**

- ✅ Your data stays on your laptop
- ✅ Your AI runs on your laptop
- ✅ No cloud bills
- ✅ No external services
- ✅ Full privacy
- ✅ Works offline (when on your laptop)

**Perfect for:**
- Personal use
- Development
- Testing
- Learning
- Full control freaks (in a good way)

**Not suitable for:**
- Multiple users
- Public access
- 24/7 availability
- Access from other devices

---

## 🚀 Quick Start

```bash
# 1. Start PostgreSQL (if not running)
brew services start postgresql

# 2. Verify database
psql -d soulfra -c "SELECT COUNT(*) FROM users;"

# 3. Start Ollama (if not running)
brew services start ollama

# 4. Start backend
npm run backend

# 5. Visit site
open https://soulfra.com

# 6. Open browser console (F12)
# Should see: "✅ Backend is healthy"
```

---

## 🐛 Troubleshooting

### "Failed to fetch" error

**Problem:** Browser can't reach localhost:5050

**Check:**
```bash
# Is backend running?
lsof -i :5050

# Test directly
curl http://localhost:5050/api/health
```

### CORS error

**Problem:** Backend rejecting requests from soulfra.com

**Fix:** Check CORS headers in backend:
```javascript
res.setHeader('Access-Control-Allow-Origin', 'https://soulfra.com');
```

### PostgreSQL connection error

**Problem:** Backend can't connect to database

**Check:**
```bash
# Is PostgreSQL running?
brew services list | grep postgresql

# Can you connect?
psql -d soulfra

# Check connection settings
echo $DATABASE_URL
```

### Ollama not responding

**Problem:** Backend can't reach Ollama

**Check:**
```bash
# Is Ollama running?
ollama list

# Test directly
curl http://localhost:11434/api/generate -d '{"model":"llama3.2:3b","prompt":"test","stream":false}'
```

---

## 📚 Related Docs

- **GITHUB_BACKEND.md** - Use GitHub as backend (no localhost needed)
- **LOCAL_DEVELOPMENT.md** - General local development guide
- **migrate-to-postgres.js** - Script to migrate from JSON to PostgreSQL

---

## ✅ Summary

You have everything you need running locally:
- PostgreSQL with soulfra database
- Ollama for AI
- soulfra.com on GitHub Pages

Just connect them:
1. Update backend to use PostgreSQL (not JSON)
2. Set CORS headers for soulfra.com
3. Keep backend running
4. Visit soulfra.com from your laptop
5. Works without external services

**Your laptop becomes the server.** Simple as that.
