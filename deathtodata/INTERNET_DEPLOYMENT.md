# DeathToData - Make It Internet-Accessible

## Quick Start (2 minutes)

Your laptop is running:
- Frontend: `http://localhost:8000/deathtodata/`
- Backend API: `http://localhost:5051`
- Ollama: `http://localhost:11434`

### Option 1: Quick Tunnel (No Setup)

Run this ONE command to get a public URL:

```bash
cloudflared tunnel --url http://localhost:8000
```

You'll get output like:
```
2026-01-16 | https://abc-def-ghi.trycloudflare.com | Registered tunnel
```

**That's it!** Share that URL with anyone. They can access DeathToData.

**To expose the backend too:**

```bash
cloudflared tunnel --url http://localhost:5051
```

Now you have two URLs:
- Frontend: `https://abc-def-ghi.trycloudflare.com/deathtodata/`
- Backend: `https://xyz-123-456.trycloudflare.com/api/search?q=test`

### Option 2: Persistent Tunnel (Better)

Create a permanent tunnel with custom subdomain:

```bash
# 1. Login to Cloudflare
cloudflared tunnel login

# 2. Create tunnel named "deathtodata"
cloudflared tunnel create deathtodata

# 3. Route traffic
cloudflared tunnel route dns deathtodata deathtodata.yourdomain.com

# 4. Run tunnel
cloudflared tunnel run deathtodata
```

## Update Frontend to Use Public API

When you get your public backend URL, update the frontend:

**File: `deathtodata/index.html` and `deathtodata/search.html`**

Change:
```javascript
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5051'
  : 'https://api.deathtodata.com';
```

To:
```javascript
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5051'
  : 'https://YOUR-BACKEND-TUNNEL-URL.trycloudflare.com';
```

## Test It

1. Start tunnel: `cloudflared tunnel --url http://localhost:8000`
2. Get URL (e.g., `https://abc.trycloudflare.com`)
3. Visit: `https://abc.trycloudflare.com/deathtodata/search.html?q=python`
4. Share with friends!

## Why This Works

- **No port forwarding needed** - Cloudflare handles it
- **Free HTTPS** - Automatic SSL certificate
- **Works from anywhere** - Coffee shop, library, wherever
- **No ISP issues** - Bypasses router/firewall
- **Privacy maintained** - Ollama stays on your laptop

## For Production (Custom Domain)

If you want `https://deathtodata.com` instead of random URL:

1. Buy domain (if you don't have one)
2. Point DNS to Cloudflare
3. Create persistent tunnel (see Option 2 above)
4. Done!

## Docker Compose for Self-Hosting

Want to let users run their own DeathToData? See `docker-compose.yml`

```bash
# Users just run:
git clone https://github.com/yourusername/deathtodata
cd deathtodata
docker-compose up
```

Gets them:
- Full search engine
- Privacy-first
- AI filtering (if they have Ollama)
- Zero tracking
- 100% self-sovereign
