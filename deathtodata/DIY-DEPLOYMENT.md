# DeathToData - DIY Decentralized Deployment

**Status:** ✅ **LIVE** at https://deathtodata.com

---

## Architecture: The Anti-Cloud Approach

Unlike traditional cloud deployments (AWS, Vercel, Netlify), DeathToData uses a **DIY decentralized** approach that aligns with our privacy-first philosophy:

```
┌─────────────────┐          ┌──────────────┐          ┌────────────────┐
│  GitHub Pages   │  ←───→   │    ngrok     │  ←───→   │   localhost    │
│  (Frontend)     │          │   (Tunnel)   │          │   :5051        │
│  deathtodata.com│          │   Public     │          │   (Backend)    │
└─────────────────┘          └──────────────┘          └────────────────┘
      FREE                        FREE                    YOUR MACHINE
```

### Why This Matters

- ✅ **No VPS costs** - Backend runs on your machine
- ✅ **No DNS complexity** - ngrok provides instant public URL
- ✅ **Full control** - You own the data and infrastructure
- ✅ **Privacy-aligned** - No third-party cloud providers
- ✅ **Instant updates** - Change code, restart backend, done

---

## Current Deployment

### Frontend (GitHub Pages)
- **URL:** https://deathtodata.com
- **Repo:** https://github.com/Soulfra/deathtodata.github.io
- **Deploy:** Automatic on push to main
- **SSL:** Auto-provisioned by GitHub Pages
- **Cost:** $0/month

### Backend (localhost + ngrok)
- **Local:** http://localhost:5051
- **Public:** https://kylie-lilylike-lowly.ngrok-free.dev
- **Database:** SQLite (`/Users/matthewmauer/Desktop/soulfra.github.io/deathtodata.db`)
- **Search:** DuckDuckGo Instant Answer API
- **Cost:** $0/month (free ngrok tier)

---

## How It Works

### 1. Frontend (Static HTML/CSS/JS)
Deployed to GitHub Pages, hosted on GitHub's CDN:
- `/deathtodata/` - Contains all frontend code
- `dashboard.html` - Main UI
- Auto-detects environment (localhost vs production)

### 2. Backend (Node.js + Express)
Runs on your local machine:
- `api/deathtodata-backend.js` - API server
- Endpoints:
  - `GET /api/search?q=query` - Privacy-focused search
  - `POST /api/signup` - User registration
  - `GET /api/feed` - Activity feed
  - `GET /api/messages/:email` - User messages
  - `POST /api/analytics` - Track usage

### 3. ngrok Tunnel
Exposes localhost to the internet:
- Free tier: Works but shows warning page on first visit
- Paid tier ($8/mo): Custom subdomain + no warning

---

## Starting the System

### 1. Start Backend
```bash
cd /Users/matthewmauer/Desktop/soulfra.github.io
node api/deathtodata-backend.js
```

Output:
```
✅ Search engine initialized (DuckDuckGo Instant Answer API)
🚀 DeathToData API running on http://localhost:5051
📊 Database: SQLite
✅ Connected to SQLite database
```

### 2. Start ngrok Tunnel
```bash
cd /Users/matthewmauer/Desktop/soulfra.github.io
ngrok http 5051 --log /tmp/ngrok.log --log-format json > /dev/null 2>&1 &
```

### 3. Get ngrok URL
```bash
curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url'
```

Example: `https://kylie-lilylike-lowly.ngrok-free.dev`

### 4. Update Frontend (if ngrok URL changed)
Edit `deathtodata/dashboard.html` line 257:
```javascript
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5051'
  : 'https://YOUR-NEW-NGROK-URL-HERE.ngrok-free.dev';
```

Then commit and push:
```bash
git add deathtodata/dashboard.html
git commit -m "Update ngrok URL"
git push
```

GitHub Pages auto-deploys in ~1-2 minutes.

---

## Testing

### Test Local Backend
```bash
curl -s 'http://localhost:5051/api/search?q=privacy' | jq .
```

### Test ngrok Tunnel
```bash
curl -s 'https://kylie-lilylike-lowly.ngrok-free.dev/api/search?q=privacy'
```

### Test Deployment
```bash
python3 templates/test-deployment.py deathtodata.com
```

---

## Current Status

✅ **Frontend:** Live at https://deathtodata.com
✅ **Backend:** Running on localhost:5051
✅ **Tunnel:** Active at https://kylie-lilylike-lowly.ngrok-free.dev
✅ **Database:** SQLite (local file)
✅ **Search:** DuckDuckGo API integrated

---

## Advantages of This Approach

### vs. Traditional VPS ($5-10/mo)
- ❌ **VPS:** Need to maintain server, SSH access, security updates
- ✅ **DIY:** Just restart the backend script

### vs. Cloud (AWS/Vercel) ($20-100/mo)
- ❌ **Cloud:** Vendor lock-in, complex config, usage limits
- ✅ **DIY:** Full control, unlimited usage (on your machine)

### vs. "Proper" DNS/API Setup
- ❌ **DNS:** Need to buy domain, configure A records, wait for propagation
- ✅ **ngrok:** Instant public URL in 1 command

---

## Limitations & Tradeoffs

### ngrok Free Tier
- ⚠️ Shows warning page on first visit (users must click "Visit Site")
- ⚠️ URL changes when ngrok restarts (need to update frontend)
- ⚠️ Rate limits (40 connections/min)

**Fix:** Upgrade to ngrok Pro ($8/mo) for custom subdomain + no warning

### Backend Reliability
- ⚠️ Backend goes down if your machine sleeps/restarts
- ⚠️ No auto-restart on crash (yet)

**Fix:** Use PM2 process manager:
```bash
npm install -g pm2
pm2 start api/deathtodata-backend.js --name deathtodata
pm2 startup  # Auto-restart on machine reboot
```

### Database
- ⚠️ SQLite file-based (no remote access)
- ⚠️ No automatic backups

**Fix:** Add cron job to backup deathtodata.db daily

---

## Scaling This Approach

### Phase 1: Local DIY (Current)
- ngrok + localhost
- $0/month

### Phase 2: Persistent Backend
- PM2 process manager
- Daily SQLite backups
- Still $0/month

### Phase 3: Paid ngrok
- Custom subdomain (api.deathtodata.com)
- No warning page
- $8/month

### Phase 4: VPS Migration (Optional)
- Move backend to DigitalOcean/Linode
- Use templates/deploy-express.sh
- $5-10/month

### Phase 5: Multi-Node P2P (Future)
- Use existing CALOS infrastructure
- WebSocket sync between peers
- Fully decentralized search

---

## Philosophy: Why DIY?

From the CALOS agent-router CLAUDE.md:

> "The goal is to build a **local-first**, **privacy-first** infrastructure that doesn't rely on cloud services. Think Expo for React Native, but for full-stack web apps."

DeathToData embodies this:
- **Local-first:** Backend runs on your machine
- **Privacy-first:** No tracking, no cloud, no surveillance
- **DIY-first:** You control everything
- **Cost-first:** $0/month vs $20-100/month for cloud

This isn't just about saving money—it's about **sovereignty over your infrastructure**.

---

## Next Steps

### Immediate
- [x] Frontend deployed (GitHub Pages)
- [x] Backend running (localhost:5051)
- [x] ngrok tunnel active
- [x] End-to-end tested

### Short-term
- [ ] Add PM2 for auto-restart
- [ ] Set up daily SQLite backups
- [ ] Configure ngrok custom subdomain (api.deathtodata.com)

### Long-term
- [ ] P2P data sync (WebSocket between peers)
- [ ] Docker Compose deployment (CALOS Foundation Runtime)
- [ ] Offline PWA support (service workers)

---

## Troubleshooting

### Backend not responding
```bash
# Check if running
lsof -ti:5051

# Restart
lsof -ti:5051 | xargs kill -9
node api/deathtodata-backend.js
```

### ngrok tunnel expired
```bash
# Restart ngrok
pkill ngrok
ngrok http 5051 --log /tmp/ngrok.log --log-format json > /dev/null 2>&1 &

# Get new URL
curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url'

# Update dashboard.html and push to GitHub
```

### Frontend not loading
```bash
# Test GitHub Pages deployment
python3 templates/test-deployment.py deathtodata.com

# Check build status
# Visit: https://github.com/Soulfra/soulfra.github.io/actions
```

---

## Resources

- **Frontend Code:** `/Users/matthewmauer/Desktop/soulfra.github.io/deathtodata/`
- **Backend Code:** `/Users/matthewmauer/Desktop/soulfra.github.io/api/deathtodata-backend.js`
- **Database:** `/Users/matthewmauer/Desktop/soulfra.github.io/deathtodata.db`
- **Deployment Templates:** `/Users/matthewmauer/Desktop/soulfra.github.io/templates/`
- **CALOS Infrastructure:** `/Users/matthewmauer/Desktop/CALOS_ROOT/agent-router/CLAUDE.md`

---

**DeathToData is live. Zero cloud, zero tracking, zero bullshit. 🚀**
