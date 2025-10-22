# SoulFra GitHub Pages - CalOS Platform Portal

**Privacy-first automation platform** - Zero-dependency SDK for receipts, email, payments, and dev tools.

## Quick Start

This is a **GitHub Pages site** that serves as the public portal for CalOS Platform.

### Deploy to GitHub Pages

```bash
# 1. Create new repo: soulfra.github.io
gh repo create soulfra.github.io --public

# 2. Initialize git
cd ~/Desktop/CALOS_ROOT/agent-router/projects/soulfra.github.io
git init
git add .
git commit -m "Initial commit: CalOS Platform Portal"

# 3. Push to GitHub
git remote add origin https://github.com/soulfra/soulfra.github.io.git
git branch -M main
git push -u origin main

# 4. Enable GitHub Pages
# Go to repo Settings → Pages → Source: main branch → Save

# 5. Visit your site
# https://soulfra.github.io
```

## Files

```
soulfra.github.io/
├─ index.html              ← Landing page
├─ calos-sdk-browser.js    ← Zero-dependency SDK (copy-paste ready)
├─ privacy-dashboard.html  ← Live privacy transparency demo
└─ README.md               ← This file
```

## Features

### 1. Zero-Dependency SDK
- **No npm install** - Just `<script src="calos-sdk-browser.js"></script>`
- **Browser native** - Uses `fetch()`, `FileReader`, `crypto.subtle`
- **~500 lines** - Single file, fully documented

### 2. Privacy Dashboard
- **Live demo** - See telemetry obfuscation in action
- **Before/after** - Compare raw vs obfuscated data
- **Trust through transparency** - 0 PII leaks, local vs external API tracking

### 3. Copy-Paste Gist
- **GitHub Gist** - https://gist.github.com/soulfra/calos-sdk-browser
- **Instant use** - No build step, no dependencies
- **Self-contained** - Works offline after first load

## API Endpoints

The SDK connects to:

- **Production**: `https://api.calos.dev` (managed hosting - $9/mo)
- **Self-hosted**: `http://localhost:5001` (free, run your own)

## Tech Stack

- **Pure HTML/CSS/JS** - No frameworks
- **Zero build step** - No webpack, no babel
- **Zero dependencies** - No npm packages
- **GitHub Pages** - Free hosting
- **MIT Licensed** - Fully open source

## Local Development

```bash
# Serve locally
python3 -m http.server 8000

# Or use any static server
npx serve .

# Visit
open http://localhost:8000
```

## Deployment Checklist

- [ ] Create `soulfra.github.io` repo on GitHub
- [ ] Push this folder as repo root
- [ ] Enable GitHub Pages in repo settings
- [ ] Verify site loads at https://soulfra.github.io
- [ ] Test SDK demo page
- [ ] Test privacy dashboard
- [ ] Share on Twitter/HN

## Revenue Model

1. **GitHub Pages** - Free (marketing funnel)
2. **Managed API** - $9/mo at calos.dev
3. **Enterprise** - Custom pricing (B-corp/C-corp)

## License

MIT - Free forever, even for commercial use

## Links

- **Main repo**: https://github.com/soulfra/calos-platform
- **Docs**: https://soulfra.github.io/docs
- **Discord**: https://discord.gg/calos
- **Twitter**: https://twitter.com/calos

---

**Built with ❤️ by SoulFra** - Privacy-first automation for developers
