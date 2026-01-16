# Make DeathToData Live RIGHT NOW

## What You Already Have

✅ **deathtodata.com** - Owned domain
✅ **CloudFlare DNS** - Already configured
✅ **GitHub Pages** - soulfra.github.io deployed
✅ **ngrok** - Installed on your laptop
✅ **Backend running** - localhost:5051
✅ **Frontend running** - localhost:8000

**You're like 2 commands away from live.**

## Option A: Quick & Dirty (2 minutes)

### 1. Expose Backend with ngrok

```bash
ngrok http 5051
```

Copy the URL (e.g., `https://abc123.ngrok-free.app`)

### 2. Update Frontend

Edit `deathtodata/index.html` and `deathtodata/search.html`:

```javascript
// Change this line:
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5051'
  : 'https://api.deathtodata.com';

// To this:
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5051'
  : 'https://YOUR-NGROK-URL.ngrok-free.app';
```

### 3. Push to GitHub

```bash
git add .
git commit -m "Connect to ngrok backend"
git push origin main
```

### 4. Visit

`https://soulfra.github.io/deathtodata/` or `https://deathtodata.com` (if DNS is set up)

**DONE!** DeathToData is live.

## Option B: Professional Setup (10 minutes)

Use your existing CloudFlare subdomain system.

### 1. Create API Subdomain

Create file: `domains/deathtodata-api.json`

```json
{
  "owner": "matthewmauer",
  "email": "your@email.com",
  "subdomain": "api",
  "domain": "deathtodata",
  "letter": "A",
  "target": "YOUR-NGROK-URL.ngrok-free.app",
  "record_type": "CNAME"
}
```

### 2. Update Frontend

```javascript
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5051'
  : 'https://api.deathtodata.com';
```

### 3. Commit & Push

```bash
git add domains/deathtodata-api.json
git add deathtodata/
git commit -m "Add api.deathtodata.com subdomain"
git push origin main
```

**Result:**
- Frontend: `https://deathtodata.com`
- Backend: `https://api.deathtodata.com`
- Ollama: stays local (privacy!)

## Option C: Permanent (Cloudflare Tunnel)

Better than ngrok - doesn't change URLs on restart.

### 1. Login to Cloudflare

```bash
cloudflared tunnel login
```

### 2. Create Tunnel

```bash
cloudflared tunnel create deathtodata-api
```

### 3. Configure Tunnel

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: deathtodata-api
credentials-file: ~/.cloudflared/<TUNNEL-ID>.json

ingress:
  - hostname: api.deathtodata.com
    service: http://localhost:5051
  - service: http_status:404
```

### 4. Route DNS

```bash
cloudflared tunnel route dns deathtodata-api api.deathtodata.com
```

### 5. Run Tunnel

```bash
cloudflared tunnel run deathtodata-api
```

**Benefits:**
- Permanent URL (api.deathtodata.com)
- Survives restarts
- Free HTTPS
- No ngrok randomness

## Current Status Check

What's actually deployed right now?

```bash
# Check if GitHub Pages is live
curl -I https://soulfra.github.io/deathtodata/

# Check if custom domain works
curl -I https://deathtodata.com

# Test search
curl -I http://localhost:5051/api/search?q=test
```

## The Confusion Explained

**GitHub Pages:**
- ✅ Can serve static files (HTML/CSS/JS)
- ❌ **Cannot** run Node.js backends
- ✅ You're using this for `soulfra.github.io`

**Your Backend:**
- ✅ Running on your laptop (port 5051)
- ❌ Not accessible from internet (yet)
- Need: ngrok/cloudflared to expose it

**So the flow is:**
1. User visits `deathtodata.com` (GitHub Pages serves HTML)
2. HTML calls `api.deathtodata.com` (your laptop via tunnel)
3. Backend queries DuckDuckGo + Ollama
4. Returns results

## Recommended Right Now

**Use ngrok for testing:**
```bash
ngrok http 5051
# Update frontend with URL
# Push to GitHub
# Test at deathtodata.com
```

**Later upgrade to Cloudflare Tunnel for permanent URL.**

## Why This Works

Your laptop is already on the internet. The issue is:
- Router blocks incoming connections
- ISP gives dynamic IP
- No HTTPS certificate

ngrok/cloudflared solves ALL of this by creating a secure tunnel.

**You're not deploying to a server. You're just opening a door.**
