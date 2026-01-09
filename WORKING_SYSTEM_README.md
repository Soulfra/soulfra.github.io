# ONE Actually Working System

Your simple, working Soulfra setup - no bullshit, just YOUR devices talking to each other.

## What We Built

A **simple UUID-based session system** that connects:
- **YOUR iPhone** (scans QR codes)
- **YOUR laptop** (runs Ollama locally)
- **YOUR WiFi** (connects them on local network)

NO complex OAuth, NO databases, NO backend servers.

---

## How To Use It

### Step 1: Start Ollama on Laptop

```bash
# Terminal 1 - Start Ollama
ollama serve

# Terminal 2 - Pull a model if you haven't
ollama pull mistral
```

### Step 2: Start Local Web Server

```bash
cd ~/Desktop/soulfra.github.io
python3 -m http.server 8000
```

### Step 3: Get Your Laptop's Local IP

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

You'll see something like: `inet 192.168.1.100`

### Step 4: Generate QR Code

Open in browser on laptop:
```
http://localhost:8000/qr/generate.html
```

Enter:
- **Server IP**: `192.168.1.100` (your laptop's IP)
- **Domain**: `soulfra` (or calriven, cringeproof, deathtodata)
- **Action**: `chat` (or ollama, record, etc.)

Click "Generate QR Code" - it creates a QR code with URL like:
```
http://192.168.1.100:8000/qr/?session=abc123-uuid&domain=soulfra&action=chat
```

### Step 5: Scan QR on iPhone

1. Open Camera app on iPhone
2. Point at QR code on laptop screen
3. Tap the notification banner
4. Safari opens → QR router creates session → Routes to chatbox
5. Start chatting!

---

## The Flow

```
┌─────────────┐
│   iPhone    │  Scan QR Code
│  (Camera)   │────────┐
└─────────────┘        │
                       ▼
┌────────────────────────────────┐
│  QR Router (/qr/index.html)    │
│  - Parse URL params            │
│  - Create UUID session         │
│  - Store in localStorage       │
│  - Route to destination        │
└───────────┬────────────────────┘
            │
            ▼
┌────────────────────────────────┐
│  Chatbox (pages/chat/)         │
│  - Load session from localStorage
│  - User types/speaks           │
│  - Send to Ollama              │
└───────────┬────────────────────┘
            │
            ▼
┌────────────────────────────────┐
│  Ollama (localhost:11434)      │
│  - Running on laptop           │
│  - Process conversation        │
│  - Return response             │
└───────────┬────────────────────┘
            │
            ▼
┌────────────────────────────────┐
│  Conversation Parser           │
│  - Extract sentiment           │
│  - Extract key points          │
│  - Extract action items        │
│  - Display results             │
└────────────────────────────────┘
```

---

## Files Created

### Session System
- `/session/auth.js` - UUID-based sessions (no backend)

### QR Router
- `/qr/index.html` - Scans QR, creates session, routes
- `/qr/generate.html` - (TO BE CREATED) - Generate QR codes

### Conversation API
- `/api/conversation/parser.js` - Parse conversations through Ollama
- `/api/conversation/endpoints.js` - REST-style API

### Chat Interface
- `/pages/chat/chatbox.html` - ✅ Chat UI fully wired to Ollama
- `/pages/demos/ollama-demo.html` - Standalone Ollama demo

---

## Domain Routing

QR codes can route to different domains/actions:

### Calriven
```
?domain=calriven&action=chat     → Chatbox
?domain=calriven&action=blog     → Calriven blog
?domain=calriven&action=record   → Voice recording
```

### CringeProof
```
?domain=cringeproof&action=record  → Voice recording
?domain=cringeproof&action=ideas   → Ideas page
?domain=cringeproof&action=feed    → Main feed
```

### DeathToData
```
?domain=deathtodata&action=search   → Search interface
?domain=deathtodata&action=privacy  → Privacy dashboard
```

### Soulfra
```
?domain=soulfra&action=chat      → Chatbox
?domain=soulfra&action=ollama    → Ollama demo
?domain=soulfra&action=projects  → Projects page
```

---

## Testing

### Test 1: Session Creation

1. Open: `http://localhost:8000/qr/`
2. Check console: Should see "Session created: uuid..."
3. Check localStorage: `soulfra_session_id` should exist
4. Refresh page: Session persists

✅ **Expected**: Session ID saved, persists across refreshes

### Test 2: QR Routing

1. Generate QR with URL: `http://192.168.1.100:8000/qr/?session=test123&domain=soulfra&action=chat`
2. Scan on iPhone
3. Should redirect to chatbox
4. Check localStorage on iPhone: `soulfra_session_id = test123`

✅ **Expected**: QR scan → Session created → Routed to chatbox

### Test 3: Ollama Integration

1. Make sure Ollama is running: `ollama serve`
2. Open: `http://localhost:8000/pages/demos/ollama-demo.html`
3. Check status: Should show "✅ Ollama is running"
4. Type a message: "Hello!"
5. Send → Should get response from Ollama

✅ **Expected**: Ollama processes message, returns response

### Test 4: Chatbox + Ollama Integration

1. Make sure Ollama is running: `ollama serve`
2. Start web server: `python3 -m http.server 8000`
3. Get laptop IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
4. Open on laptop: `http://localhost:8000/pages/chat/chatbox.html`
5. Should see:
   - Session ID in header
   - "✅ Connected to Ollama!" (if Ollama running)
   - OR "⚠️ Using local fallback mode" (if Ollama not running)
6. Type: "I need to fix the auth bug and deploy by Friday. The team is frustrated."
7. Click send
8. Should see:
   - Your message displayed as "user" bubble
   - Typing indicator
   - Parsed response with sentiment, key points, action items

✅ **Expected Output**:
```
Message: I need to fix the auth bug...

😟 Sentiment: negative

📌 Key Points:
• Fix authentication bug
• Deploy by Friday
• Team frustrated

✅ Action Items:
• Fix authentication bug
• Deploy by Friday
```

---

## Troubleshooting

### "Ollama not available"
- Check Ollama is running: `ollama serve`
- Check port 11434: `curl http://localhost:11434/api/tags`
- Pull a model: `ollama pull mistral`

### "Cannot connect from iPhone"
- Make sure laptop and iPhone on same WiFi
- Check firewall isn't blocking port 8000
- Try laptop's IP directly: `http://192.168.1.100:8000`

### "QR code doesn't work"
- Make sure using laptop's local IP (not localhost)
- Check QR URL format: `http://192.168.1.100:8000/qr/?session=...`
- Try scanning with QR scanner app instead of camera

### "Session not persisting"
- Check browser localStorage is enabled
- Try clearing cache and reloading
- Check console for errors

---

## What's Next

### TO DO:
1. ✅ Simple UUID sessions
2. ✅ QR router
3. ✅ Conversation parser API
4. ✅ Wire chatbox to Ollama
5. ⏳ Add voice input (Web Speech API)
6. ⏳ Generate QR codes page
7. 🔄 Test end-to-end flow (IN PROGRESS)

### NOT DOING (Too Complex):
- ❌ Complex OAuth systems
- ❌ Backend databases
- ❌ Compilation to C (???)
- ❌ 9 different auth systems

---

## Key Insight

You don't need a complex backend or auth system. For YOUR devices on YOUR network:
- **Sessions** = UUIDs in localStorage
- **Auth** = Scanning QR codes
- **Backend** = Ollama running locally
- **Storage** = Browser localStorage
- **Communication** = Local network (WiFi)

Simple. Effective. Works.

---

## Files To Delete

These are redundant and confusing:

```bash
# Delete 8 extra QR auth systems
rm pages/auth/qr-fedcm-login.html
rm pages/auth/qr-gis-login.html
rm pages/auth/qr-google-login.html
rm pages/auth/qr-login-gist.html
rm pages/auth/qr-config-wizard.html
rm pages/auth/qr-scanner-gist.html
rm pages/auth/qr-scanner.html
rm pages/auth/qr-scan.html

# Keep only: pages/auth/qr-login.html (reference)
```

---

**Status**: Session system ✅ | QR router ✅ | API ✅ | Chatbox ✅

**Next**: Test chatbox → Ollama flow, add voice input, generate QR codes!
