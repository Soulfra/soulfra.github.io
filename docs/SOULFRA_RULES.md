# 🚀 SOULFRA Platform Rules
## The Master Guide for Building & Maintaining SOULFRA

### 🎯 Core Principles

1. **NO DUPLICATES** - Every feature exists in exactly ONE place
2. **WORKS FIRST TIME** - No "try this, then that" - it just works
3. **MOBILE FIRST** - If it doesn't work on mobile, it doesn't ship
4. **$1 TO START** - Keep the barrier to entry minimal
5. **AI FOR EVERYONE** - Not just tech people, everyone

### 📁 File Organization

Follow the structure in `file_organization_rules.md`:
- Maximum 3 levels deep
- Feature-first organization
- Clear, descriptive names
- One responsibility per file

### 🔧 Development Rules

#### Imports
```python
# ✅ GOOD: All imports at the top
import os
import sys
import json
import requests  # ALWAYS import requests if using it
from flask import Flask
from flask_socketio import SocketIO

# ❌ BAD: Importing inside functions
def check_ollama():
    import requests  # NO!
```

#### Dependencies
- Use `soulfra_requirements.txt` for Python deps
- Use `package.json` for Node deps
- NO installing on the fly
- NO "try to import, then install"

#### Ports
```python
# Standard SOULFRA ports
MAIN_PORT = 9999      # Main platform
OLLAMA_PORT = 11434   # Ollama AI
REDIS_PORT = 6379     # Redis cache
GAME_PORTS = range(10000, 10010)  # Game servers
```

### 🚀 Launch Scripts

ONE launch script to rule them all:
```bash
./soulfra.sh         # Main launcher
./soulfra.sh test    # Run tests
./soulfra.sh docker  # Docker mode
```

NO more:
- launch_soulfra.sh
- LAUNCH_SOULFRA.sh
- start_soulfra.sh
- START_REAL_SOULFRA.sh
- etc...

### 🐳 Docker Rules

1. **Ollama Integration**
   ```yaml
   ollama:
     image: ollama/ollama:latest
     ports:
       - "11434:11434"
   ```

2. **Environment Variables**
   ```yaml
   environment:
     - OLLAMA_URL=http://ollama:11434  # Use service name in Docker
     - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
   ```

### 🔌 Socket.IO Rules

1. **Use CDN in Production**
   ```html
   <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
   ```

2. **Proper Initialization**
   ```python
   socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')
   ```

### 🤖 AI Integration Rules

1. **Ollama Check**
   ```python
   # Check multiple URLs
   ollama_urls = [
       os.environ.get('OLLAMA_URL', 'http://localhost:11434'),
       'http://ollama:11434',  # Docker
       'http://localhost:11434'  # Local
   ]
   ```

2. **Fallback Handling**
   - Always have fallback responses
   - Log when using fallbacks
   - Make it clear to users

### 💰 Payment Integration

1. **Stripe Setup**
   - Use environment variables
   - Test mode for development
   - Clear pricing: $1 = 10 VIBE default

2. **VIBE Economy**
   - Configurable exchange rate
   - Stored in database
   - Real-time updates via WebSocket

### 📱 Mobile PWA Rules

1. **Manifest Required**
   ```json
   {
     "name": "SOULFRA",
     "short_name": "SOULFRA",
     "start_url": "/",
     "display": "standalone"
   }
   ```

2. **Responsive Design**
   - Mobile-first CSS
   - Touch-friendly controls
   - Offline capability

### 🔒 Security Rules

1. **Environment Variables**
   - NEVER commit secrets
   - Use `.env` files locally
   - Use proper secret management in production

2. **Trust Chain** (from cal-rules.md)
   - Verify `.bound-to` for trust
   - Check signatures for agents
   - Log all operations

### 🧪 Testing Rules

1. **Test Script Required**
   ```bash
   python3 test_soulfra_ultimate.py
   ```

2. **Health Checks**
   - `/api/health` endpoint required
   - Check all services
   - Return proper status codes

### 📝 Documentation Rules

1. **CLAUDE.md Structure**
   ```markdown
   # System Overview
   # Architecture
   # Common Commands
   # Critical Files
   # Development Workflow
   ```

2. **Comments**
   - Only when necessary
   - Explain WHY, not WHAT
   - No emoji unless requested

### 🚫 Anti-Patterns to Avoid

1. **No Duplicate Implementations**
   - ONE payment system
   - ONE auth system
   - ONE database schema

2. **No Hidden Dependencies**
   - All deps in requirements.txt
   - No runtime installs
   - No "pip install" in code

3. **No Abandoned Code**
   - Remove old implementations
   - Clean up test files
   - Delete unused scripts

### ✅ Checklist Before Committing

- [ ] Runs locally without errors
- [ ] All imports at the top
- [ ] Requirements file updated
- [ ] No duplicate functionality
- [ ] Mobile responsive
- [ ] Tests pass
- [ ] Documentation updated

### 🎯 The Goal

**Make SOULFRA so simple that any solo founder can:**
1. Clone the repo
2. Run `./soulfra.sh`
3. Have a working AI platform in 60 seconds
4. Start making money

No complexity. No confusion. Just results.