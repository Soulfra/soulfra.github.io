# Simplified Deployment Guide

## What Changed

We removed all the complex bullshit (cron jobs, PM2, etc.) and created simple, clear deployment options.

---

## Option 1: Local Laptop (FREE, No VPS Needed)

**Best for:** Testing, DIY, full privacy

### Start DeathToData

```bash
./start-deathtodata-simple.sh
```

That's it. One command. It:
1. Starts backend on localhost:5051
2. Creates public tunnel (ngrok or localtunnel)
3. Shows you the URL

**Stop:** Press Ctrl+C

**Cost:** $0/month

---

## Option 2: VPS with Ollama ($50-90/mo)

**Best for:** 24/7 uptime, AI-powered search

### Deploy

```bash
./templates/deploy-vps-ollama.sh <vps-ip> api.deathtodata.com
```

**What you get:**
- Backend + Ollama on GPU VPS
- Always online
- Full AI capabilities
- SSL auto-configured

**Cost:** $50-90/month (GPU VPS)

**Recommended VPS:**
- DigitalOcean GPU Droplet ($50/mo)
- Linode GPU ($90/mo)
- Paperspace ($45/mo)

---

## Option 3: Hybrid (BEST OPTION)

**Best for:** Cheap VPS + local privacy

### Deploy

```bash
# 1. Deploy cheap VPS (search API only)
./templates/deploy-vps-hybrid.sh <vps-ip> api.deathtodata.com https://your-laptop.ngrok.io

# 2. Start Ollama tunnel on your laptop
ngrok http 11434  # Ollama port
```

**Architecture:**
```
User → api.deathtodata.com (VPS $5/mo)
       ├── Search API (always online)
       └── Analytics aggregation

       ↓ (when you want AI)

       Your laptop
       ├── Ollama (privacy!)
       └── Metrics collection (local SQLite)
```

**Pros:**
- VPS always online ($5/mo)
- Ollama stays local (FREE + privacy)
- Metrics stored on your machine (privacy)

**Cons:**
- AI only works when laptop is on
- Need to keep tunnel running

**Cost:** $5/month VPS

---

## iOS PWA Support (NEW!)

DeathToData now works as an iOS app!

### How to Install

**On iPhone/iPad:**
1. Open Safari
2. Go to https://deathtodata.com
3. Tap Share (📤) button
4. Tap "Add to Home Screen"
5. Tap "Add"

**Result:**
- App on your home screen
- No Safari UI (standalone mode)
- Works offline (cached search)
- Fast loading

### Files Added

- `deathtodata/manifest.json` - PWA config
- `deathtodata/sw.js` - Service worker (offline support)
- `deathtodata/icon-*.png` - App icons
- iOS meta tags in all HTML files

### PWA Template

Want to make other iOS webapps?

```bash
# Copy template
cp -r templates/pwa-ios/ my-app/

# Customize
# Edit: index.html, manifest.json, sw.js
# Add icons: icon-192.png, icon-512.png, apple-touch-icon.png

# Deploy
./templates/deploy-static.sh my-app myapp
```

See `templates/pwa-ios/README.md` for full guide.

---

## Comparison

| Option | Cost | Uptime | Privacy | Complexity |
|--------|------|--------|---------|------------|
| **Local** | $0 | When laptop on | 100% | Dead simple |
| **VPS + Ollama** | $50-90/mo | 24/7 | Medium | Medium |
| **Hybrid** | $5/mo | 24/7 (API only) | High | Simple |

---

## What We Removed

### Old (Complex)
```bash
# Install PM2
npm install -g pm2

# Setup systemd
pm2 startup

# Configure cron
crontab -e

# Add cron jobs for:
# - ngrok restart
# - database backups
# - health checks
# - log rotation
```

### New (Simple)
```bash
./start-deathtodata-simple.sh
```

**Why?**
- Cron jobs are overkill for most users
- PM2 adds complexity
- Most people just want it to work

**When you DO need cron/PM2:**
- You want auto-restart on crash → Use VPS deployment (systemd handles it)
- You want daily backups → Add one cron job manually if needed
- You want 24/7 local hosting → Use VPS instead

---

## VPS Metrics to Local

The hybrid deployment includes metrics forwarding.

**How it works:**
```
VPS receives search request
  ↓
Processes search (DuckDuckGo)
  ↓
Sends metrics to your laptop via tunnel
  ↓
Your laptop stores in local SQLite
```

**Privacy win:** Search happens on VPS (always online), but analytics stay local (your machine, your data).

**Start local metrics collector:**
```bash
node templates/local-metrics-collector.js

# In another terminal, create tunnel
ngrok http 5052

# Give tunnel URL to VPS deployment script
```

---

## Deployment Checklist

### For Local/Laptop
- [ ] Run `./start-deathtodata-simple.sh`
- [ ] Copy ngrok URL
- [ ] Update `deathtodata/search.html` line 279 with URL
- [ ] Push to GitHub

### For VPS
- [ ] Get VPS (DigitalOcean, Linode, etc.)
- [ ] Add SSH key to VPS
- [ ] Run deployment script
- [ ] Point DNS to VPS IP
- [ ] SSL auto-configures

### For Hybrid
- [ ] Get cheap VPS ($5/mo)
- [ ] Start Ollama tunnel on laptop
- [ ] Run hybrid deployment script
- [ ] Start local metrics collector (optional)
- [ ] Point DNS to VPS IP

### For iOS PWA
- [ ] Already done! DeathToData is iOS-ready
- [ ] Just visit on iPhone and "Add to Home Screen"

---

## Troubleshooting

### Backend won't start
```bash
# Check if port is in use
lsof -ti:5051

# Kill it
lsof -ti:5051 | xargs kill -9

# Try again
./start-deathtodata-simple.sh
```

### Tunnel not working
```bash
# ngrok
pkill ngrok
ngrok http 5051

# localtunnel
pkill lt
lt --port 5051
```

### PWA not installing on iOS
- Must be HTTPS (GitHub Pages ✅)
- Check `manifest.json` exists
- Clear Safari cache
- Try again

---

## Next Steps

1. **Test local deployment**
   ```bash
   ./start-deathtodata-simple.sh
   ```

2. **Try iOS PWA**
   - Open Safari on iPhone
   - Visit deathtodata.com
   - Add to home screen

3. **Deploy to VPS** (optional)
   - If you want 24/7 uptime
   - Choose hybrid for cheapest option

4. **Build more iOS webapps**
   - Use `templates/pwa-ios/` template
   - Copy, customize, deploy

---

## Philosophy

**Before:** Complex deployment, cron jobs, PM2, systemd, docker-compose, kubernetes, microservices, service mesh...

**Now:** One script. It works. Move on with your life.

**When to use complex stuff:**
- You have 10,000+ users → Then worry about scaling
- You're deploying to production with SLA → Use proper DevOps
- You just want to build cool shit → Use the simple scripts

---

## Summary

✅ Simple startup script (no cron bullshit)
✅ VPS deployment templates (Ollama + hybrid)
✅ iOS PWA support (add to home screen)
✅ PWA template for other apps
✅ Metrics forwarding (VPS → local)

**Cost range:** $0 (local) → $5 (hybrid VPS) → $50-90 (full VPS with Ollama)

**Complexity:** Dead simple → Simple → Medium

**Your move.**
