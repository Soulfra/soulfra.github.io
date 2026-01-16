# 💻 Local Development Guide - No Cloud Needed

**Run Soulfra entirely on your laptop** without Vercel, AWS, or any cloud service.

---

## 🎯 TL;DR - Quick Start

**Already set up and working!** Just visit:

```bash
http://localhost:8000
```

Both servers are running:
- ✅ Frontend: `localhost:8000` (Python)
- ✅ Backend: `localhost:5050` (Node.js API)

Everything connects automatically. No setup needed.

---

## 📦 What's Running

You have **two servers** running locally:

### Frontend Server (Port 8000)
- **What:** Static files (HTML, CSS, JS)
- **Serves:** index.html, game.html, directory.html, etc.
- **Access:** http://localhost:8000

### Backend Server (Port 5050)
- **What:** Node.js API with all features
- **Endpoints:** /api/health, /api/chat, /api/auth/qr/generate, etc.
- **Access:** http://localhost:5050/api/health

---

## 🚀 Starting the Servers

### Option 1: npm Scripts (Easiest)

Start both servers with one command:

```bash
npm start
```

Or individually:

```bash
# Backend only
npm run backend

# Frontend only
npm run frontend

# Both together
npm run dev
```

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
node api/unified-backend-v2.js
```

**Terminal 2 - Frontend:**
```bash
python3 -m http.server 8000
```

---

## 🌐 Making It Public with ngrok

Want to access your local backend from `soulfra.com` (or share with others)?

### Quick Start

```bash
# Start ngrok (easiest way)
npm run ngrok

# OR use the helper script
./start-ngrok.sh
```

### Step-by-Step

1. **Start your backend:**
   ```bash
   npm run backend
   ```

2. **Start ngrok:**
   ```bash
   ngrok http 5050
   ```

3. **Copy the URL** (looks like `https://abc123.ngrok.app`)

4. **Update api-config.js:**
   ```javascript
   // js/api-config.js line 10
   BASE_URL: 'https://abc123.ngrok.app'  // Change from localhost
   ```

5. **Push to GitHub:**
   ```bash
   git add js/api-config.js
   git commit -m "Update API URL for ngrok"
   git push
   ```

6. **Visit soulfra.com** - Now it works publicly!

### What ngrok Does

```
Internet → soulfra.com → GitHub Pages → loads index.html
                                      → calls api-config.js
                                      → fetches https://abc123.ngrok.app/api/*
                                            ↓
                                      ngrok tunnel
                                            ↓
                                      localhost:5050 (your laptop)
```

**Your laptop becomes the server** but is accessible from anywhere.

---

## 🔄 Development Workflow

### Localhost-Only Development (Default)

**When:** Building features, testing locally
**Setup:** None - already working

```bash
# Start servers
npm run dev

# Visit in browser
open http://localhost:8000

# Code, test, repeat
# No need to push to GitHub
```

### Public Testing with ngrok

**When:** Testing on phone, sharing with others, testing soulfra.com live

```bash
# Terminal 1: Start backend
npm run backend

# Terminal 2: Start ngrok
npm run ngrok

# Copy the ngrok URL

# Update js/api-config.js with ngrok URL
# Push to GitHub

# Visit soulfra.com - now it works!
```

### Switching Between Modes

**Go public:**
```javascript
// js/api-config.js
BASE_URL: 'https://your-ngrok-url.ngrok.app'
```

**Go back to local:**
```javascript
// js/api-config.js
BASE_URL: 'http://localhost:5050'
```

---

## 📊 Comparison: localhost vs ngrok vs Vercel

| Feature | localhost | ngrok (free) | Vercel (free) |
|---------|-----------|--------------|---------------|
| **Setup** | ✅ Done | 2 min | 5 min |
| **Laptop runs backend** | Yes | Yes | No (cloud) |
| **Public access** | No | Yes | Yes |
| **Works when laptop sleeps** | No | No | Yes |
| **URL changes** | Never | Each restart | Never |
| **Cost** | Free | Free* | Free |
| **Best for** | Dev/testing | Sharing/testing | Production |

*ngrok free tier: Random URL each restart. $8/mo for static domain.

---

## 🧪 Testing

### Test Backend Directly

```bash
# Health check
curl http://localhost:5050/api/health

# Email capture
curl -X POST http://localhost:5050/api/email-capture \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","brand":"soulfra"}'

# AI chat
curl -X POST http://localhost:5050/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","provider":"ollama"}'
```

### Test Frontend → Backend Connection

1. Visit http://localhost:8000
2. Open browser console (F12)
3. Should see: `✅ Backend is healthy`
4. Stats should load (domain count, etc.)

---

## 🔧 Configuration

### Current Setup

**`js/api-config.js` (line 10):**
```javascript
BASE_URL: 'http://localhost:5050'  // Default
```

**This works when:**
- Visiting `localhost:8000`
- Both servers running locally
- No external access needed

### For Public Access

**Change to:**
```javascript
BASE_URL: 'https://your-ngrok-url.ngrok.app'  // ngrok URL
```

**This works when:**
- Visiting `soulfra.com` or `localhost:8000`
- Sharing with others
- Testing on phone
- Backend must be running on laptop
- ngrok must be running

---

## 🎮 Common Tasks

### Start Everything

```bash
npm run dev
```

### Stop Everything

Press `Ctrl+C` in each terminal window

Or kill by port:
```bash
# Kill frontend
lsof -ti:8000 | xargs kill -9

# Kill backend
lsof -ti:5050 | xargs kill -9
```

### Restart Backend (after code changes)

```bash
# Kill it
lsof -ti:5050 | xargs kill -9

# Start it
npm run backend
```

### Check What's Running

```bash
# Check port 8000 (frontend)
lsof -i :8000

# Check port 5050 (backend)
lsof -i :5050

# Check both
lsof -i :8000 -i :5050
```

---

## 🐛 Troubleshooting

### "Address already in use"

**Problem:** Port 8000 or 5050 is already running

**Fix:**
```bash
# Kill the process on that port
lsof -ti:8000 | xargs kill -9
lsof -ti:5050 | xargs kill -9

# Then restart
npm run dev
```

### "Cannot GET /api/health"

**Problem:** Backend isn't running

**Fix:**
```bash
npm run backend
```

### "CORS error" in browser console

**Problem:** Frontend can't reach backend

**Diagnosis:**
```bash
# Check if backend is running
curl http://localhost:5050/api/health

# If that works, check api-config.js BASE_URL
```

**Fix:** Ensure `BASE_URL` matches where backend is running:
- Local: `http://localhost:5050`
- ngrok: `https://your-url.ngrok.app`

### Stats not loading on homepage

**Problem:** Backend endpoints returning errors

**Diagnosis:**
1. Open browser console (F12)
2. Look for red errors
3. Check Network tab for failed requests

**Common fixes:**
- Backend not running: `npm run backend`
- Wrong URL in api-config.js
- Backend crashed: Check terminal for errors

### ngrok "Session Expired"

**Problem:** Free ngrok sessions timeout after ~2 hours

**Fix:**
- Just restart: `npm run ngrok`
- Copy new URL
- Update `js/api-config.js`
- Push to GitHub

---

## 📝 Files You'll Edit

### js/api-config.js
**When:** Switching between localhost and ngrok
**Line 10:** `BASE_URL: '...'`

### api/unified-backend-v2.js
**When:** Adding new backend features
**Restart:** Required after changes

### index.html, game.html, etc.
**When:** Frontend changes
**Restart:** Not required (just refresh browser)

---

## 💡 Pro Tips

### 1. Use Multiple Terminal Windows

```
Terminal 1: Backend (npm run backend)
Terminal 2: Frontend (npm run frontend)
Terminal 3: ngrok (npm run ngrok) - optional
Terminal 4: Free for git commands
```

### 2. Auto-restart Backend on Changes

Install `nodemon`:
```bash
npm install -g nodemon
```

Update package.json:
```json
"backend": "nodemon api/unified-backend-v2.js"
```

Now backend auto-restarts when you edit code.

### 3. Keep Two api-config.js Versions

**Local version:**
```javascript
BASE_URL: 'http://localhost:5050'
```

**Public version:**
```javascript
BASE_URL: 'https://your-static-ngrok-url.ngrok.app'
```

Switch between them with git:
```bash
# Save current changes
git stash

# Switch to public version
git checkout main -- js/api-config.js
git pull

# Switch back to local
git stash pop
```

### 4. Use ngrok Static Subdomain

Upgrade to ngrok paid ($8/mo) for:
- Static URL that doesn't change
- Longer session timeouts
- Custom domain (api.yourdomain.com)

```bash
ngrok http 5050 --subdomain=soulfra-api
# Always: https://soulfra-api.ngrok.app
```

---

## 🎯 When to Use What

### Use localhost (Current Setup)
- ✅ Learning/experimenting
- ✅ Building features
- ✅ Testing locally
- ✅ Quick iterations
- ❌ Sharing with others
- ❌ Testing on phone

### Use ngrok
- ✅ Share with friends
- ✅ Test on phone/tablet
- ✅ Demo to client
- ✅ Test soulfra.com live
- ❌ 24/7 availability
- ❌ Static URL (free tier)

### Use Vercel/Cloud
- ✅ Production deployment
- ✅ Always-on availability
- ✅ No laptop required
- ✅ Professional setup
- ❌ Requires config
- ❌ Deployment step

---

## 📚 Related Docs

- **DEPLOYMENT.md** - Cloud deployment with Vercel
- **URL_MAP.md** - All URLs explained
- **STRUCTURE.md** - Repo structure
- **DEPLOYMENT_STATUS.md** - What's tested and ready

---

## ✅ You're All Set!

Your local setup is **already working perfectly**:

```bash
# Start servers
npm run dev

# Visit site
open http://localhost:8000

# Everything works!
```

**Want public access?**
```bash
# Start ngrok
npm run ngrok

# Update js/api-config.js
# Push to GitHub
# Visit soulfra.com
```

**That's it!** No cloud needed. Your laptop is the server.
