# Soulfra Working Setup Guide

## What Actually Works Right Now

### ✅ Working Components

1. **Minimal Backend Server** (`unified-server-minimal.js`)
   - Health endpoint: http://localhost:7777/health
   - Recent loops: http://localhost:7777/api/loops/recent
   - Memory state: http://localhost:7777/api/memory/state
   - Create whisper: POST to http://localhost:7777/api/whisper

2. **Mirror Shell Frontend** 
   - Main interface: http://localhost:9999
   - Debug console: http://localhost:9999/debug.html
   - Logs viewer: http://localhost:9999/logs.html
   - Status monitor: http://localhost:9999/status.html

### 🚀 Quick Start (That Actually Works)

```bash
# Simple start script
./start-simple.sh

# Or manually:
node unified-server-minimal.js &
cd mirror-shell && python3 -m http.server 9999 &
```

### 🛠️ Test Everything

```bash
# Test backend
curl http://localhost:7777/health

# Create a whisper
curl -X POST http://localhost:7777/api/whisper \
  -H "Content-Type: application/json" \
  -d '{"content":"Test whisper","tone":"curious"}'

# Open frontend
open http://localhost:9999
open http://localhost:9999/debug.html
```

## ❌ What's NOT Working

1. **Full unified-soulfra-server.js** - Has daemon integration issues
2. **Production launch script** - Too complex, services crash
3. **API Router** - Missing dependencies
4. **Advanced features** - Most PRD features not implemented

## 📁 Key Files That Work

- `unified-server-minimal.js` - Simple backend that stays running
- `mirror-shell/index.html` - Main frontend interface
- `mirror-shell/debug.html` - JSON debugging tool
- `mirror-shell/logs.html` - Log viewer (needs backend support)
- `mirror-shell/status.html` - Service status monitor

## 🔧 Common Issues & Fixes

### Port Already in Use
```bash
# Find what's using the port
lsof -i :7777
lsof -i :9999

# Kill specific process
kill -9 <PID>

# Or kill all
pkill -f "node.*unified"
pkill -f "python3.*9999"
```

### Services Won't Start
- Check if ports are free
- Look at console output for errors
- Use minimal versions instead of full ones

### Frontend Can't Connect to Backend
- Make sure backend is running first
- Check CORS is enabled
- Use http://localhost:7777 not 127.0.0.1

## 📊 Architecture That Works

```
┌─────────────────┐     ┌──────────────────┐
│  Mirror Shell   │────▶│ Minimal Backend  │
│  (Port 9999)    │     │  (Port 7777)     │
└─────────────────┘     └──────────────────┘
        │                        │
        ▼                        ▼
   Static Files             Simple APIs
   - index.html            - /health
   - debug.html            - /api/loops/recent  
   - logs.html             - /api/memory/state
   - status.html           - /api/whisper
```

## 🎯 Next Steps to Fix Everything

1. **Stabilize Core**
   - Fix daemon initialization in unified-soulfra-server.js
   - Add proper error handling
   - Implement graceful shutdown

2. **Incremental Features**
   - Add features one by one to minimal server
   - Test each addition thoroughly
   - Keep fallback to minimal version

3. **Better Logging**
   - Add winston or similar logging
   - Separate log files per service
   - Implement log rotation

4. **Process Management**
   - Use PM2 or similar for production
   - Implement health checks
   - Auto-restart on crash

## 💡 Development Tips

1. **Always test minimal first** - If minimal works but full doesn't, the issue is in the added complexity

2. **Check logs immediately** - Don't wait for timeouts, check logs in another terminal

3. **Use the debug console** - http://localhost:9999/debug.html shows real API responses

4. **Keep it simple** - The minimal version proves the concept works

## 🚨 Emergency Recovery

If everything is broken:

```bash
# Kill everything
pkill -f node
pkill -f python3

# Clear any locks/pids
rm -rf pids/*

# Start minimal only
node unified-server-minimal.js
```

Then in another terminal:
```bash
cd mirror-shell && python3 -m http.server 9999
```

This WILL work and give you a baseline to build from.