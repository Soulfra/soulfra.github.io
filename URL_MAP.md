# 🗺️ Soulfra URL Map

Complete guide to all URLs in the Soulfra network.

---

## 🌐 External Domains (Game Redirect Targets)

These are **SEPARATE domains** you own. When you win the domain game, it redirects to these:

| Domain | Status | Description |
|--------|--------|-------------|
| **https://soulfra.com** | ✅ Active | Main site (points to this GitHub repo) |
| **https://cringeproof.com** | ✅ Active | Separate domain (external) |
| **https://calriven.com** | ✅ Active | Separate domain (external) |
| **https://deathtodata.com** | ✅ Active | Separate domain (external) |
| **https://stpetepros.com** | ✅ Active | Separate domain (external) |
| **https://blamechain.com** | ✅ Active | Separate domain (external) |

---

## 📁 Content Folders (In This Repo)

These are **FOLDERS** in the soulfra.github.io repo. They're accessed via soulfra.com/[folder]/:

### Main Brand Folders

| URL | Purpose | Notes |
|-----|---------|-------|
| **/soulfra/** | Soulfra content | Different from soulfra.com root |
| **/cringeproof/** | CringeProof site | Has wall.html, full site |
| **/calriven/** | CalRiven blog posts | Ch1-Ch7, not same as calriven.com |
| **/deathtodata/** | DeathToData content | Privacy-focused |
| **/stpetepros/** | StPete Pros directory | 25 professionals with QR codes |
| **/blamechain/** | BlameChain content | Crypto/blockchain related |

### Feature Pages

| URL | Purpose | Notes |
|-----|---------|-------|
| **/chat/** | Chat interface | Real-time chat app |
| **/tv/** | TV interface | Video/streaming interface |
| **/qr/** | QR code generator | Generate QR codes |
| **/waitlist/** | Waitlist pages | Signup forms |
| **/domains/** | Domain manager | Email web domain tool |
| **/debates/** | Debates platform | Discussion/debate interface |
| **/learn/** | Learning platform | Educational content |
| **/launcher/** | App launcher | Launch pad for apps |
| **/ritual-ui/** | Ritual UI | UI components |
| **/frontend/** | Frontend app | Generic frontend |
| **/d2d-frontend/** | DeathToData frontend | D2D specific frontend |

### Variant Folders

| URL | Purpose | Notes |
|-----|---------|-------|
| **/cringeproof-sports/** | Sports variant | CringeProof sports theme |
| **/cringeproof-crypto/** | Crypto variant | CringeProof crypto theme |
| **/cringeproof-purple/** | Purple variant | CringeProof purple theme |
| **/cringeproof-qr/** | QR variant | CringeProof with QR |

### Tool Folders

| URL | Purpose | Notes |
|-----|---------|-------|
| **/calriven-search/** | CalRiven search | Search interface |
| **/soulfra-directory/** | Soulfra directory | Directory of sites |
| **/howtocookathome/** | Cooking site | Recipe/cooking content |
| **/public/** | Public folder | Old dashboard location |

---

## 🎮 Game & Core Pages

| URL | Purpose | Status |
|-----|---------|--------|
| **/** (root) | Homepage | ✅ Master dashboard with 3 products |
| **/game.html** | Domain guessing game | ✅ Working, daily puzzle |
| **/game-debug.html** | Debug version | ✅ With diagnostics panel |
| **/index.html** | Same as root | ✅ Homepage |

---

## 📄 Documentation

| URL | Purpose | Status |
|-----|---------|--------|
| **/STRUCTURE.md** | Repo structure guide | ✅ Complete |
| **/TESTING.md** | Testing guide | ✅ Complete |
| **/URL_MAP.md** | This file | ✅ You're reading it |
| **/LAUNCH_CHECKLIST.md** | Launch plan | ✅ 95% complete |
| **/build.js** | Build/compiler script | ✅ Working |
| **/docs/** | ⚠️ 2000+ markdown files | ❌ No index, messy |

---

## 🔧 Backend/API (Don't Work on GitHub Pages)

These require a Node.js server and WON'T work on static GitHub Pages:

| File | Purpose | Status |
|------|---------|--------|
| **/api/workflow-router.js** | Workflow routing | ❌ Needs backend |
| **/api/unified-backend.js** | Unified backend | ❌ Needs backend |
| **/api/domain-portfolio.js** | Domain management | ❌ Needs backend |
| **/api/** (other files) | Various APIs | ❌ All need backend |

---

## 🗂️ Archive

| URL | Purpose | Notes |
|-----|---------|-------|
| **/archive/** | Old files | Zip files, deprecated projects |
| **/archive/misc-old/** | CalRiven zips | Old CalRiven projects |

---

## Key Confusion Points (EXPLAINED)

### 1. "Why do I see both soulfra.com/calriven/ and calriven.com?"

**Answer:** They're DIFFERENT things:
- **soulfra.com/calriven/** → Folder in this repo with blog posts ABOUT CalRiven
- **calriven.com** → External domain you own (separate site)

When the game redirects, it goes to **calriven.com** (external), NOT /calriven/ (folder).

### 2. "Which URLs actually work?"

**Work:**
- All external domains (soulfra.com, cringeproof.com, etc.)
- All folder URLs (soulfra.com/chat/, soulfra.com/cringeproof/, etc.)
- Game pages (game.html, game-debug.html)

**Don't work:**
- /api/ scripts (need backend server)
- /docs (no index.html)
- Some placeholder links on homepage

### 3. "What's the difference between folders and domains?"

| Type | Example | Where | Purpose |
|------|---------|-------|---------|
| **External Domain** | calriven.com | Separate site | Independent website you own |
| **Folder** | soulfra.com/calriven/ | This repo | Content/blog in THIS repo |

---

## How the Game Works

1. **Daily Puzzle:** Game picks one of 6 domains each day
2. **Show Emoji:** Displays emoji clue
3. **User Guesses:** Player guesses domain name
4. **Redirect on Win:** Sends browser to **external domain** (e.g., calriven.com)

**The game does NOT redirect to folders** - it redirects to external domains!

---

## Navigation Tips

### To browse all sites:
1. Check this URL_MAP.md (comprehensive list)
2. Visit /domains/ (domain manager interface)
3. Visit /soulfra-directory/ (directory page)
4. Wait for /directory.html (wall-style page, coming soon)

### To find specific content:
- CalRiven blog posts → /calriven/post/
- CringeProof wall → /cringeproof/wall.html
- StPete pros → /stpetepros/pros/[name].html
- Waitlist data → /waitlist/api/[brand].json

---

## What's Missing / Broken

❌ **No unified navigation** - Have to know URLs
❌ **/docs has no index** - 2000+ files, no homepage
❌ **/api scripts don't run** - GitHub Pages is static only
❌ **No user accounts** - No backend/database
❌ **No newsletter** - Need email service
❌ **Some homepage links broken** - Point to non-existent pages

---

## What's Next

### Immediate Fixes:
1. ✅ Fix timezone bug in game (DONE)
2. 🔄 Create /directory.html (wall-style nav page)
3. 🔄 Test game with corrected dates

### Future Enhancements:
- Add user accounts (needs backend)
- Create /docs index page
- Newsletter signup (Mailchimp)
- Unified navigation header
- Clean up unused folders

---

## Quick Reference

**Play the game:** https://soulfra.com/game.html
**Debug version:** https://soulfra.com/game-debug.html
**CringeProof wall:** https://cringeproof.com/wall.html
**StPete directory:** https://soulfra.com/stpetepros/
**Domain manager:** https://soulfra.com/domains/

**Today's puzzle (Jan 10):** Should be Calriven (🎹)
**Tomorrow's puzzle (Jan 11):** Should be StPete Pros (🏖️)

---

## Summary

- **6 external domains** (game redirects here)
- **24+ folders** in this repo (content pages)
- **1 working game** (game.html)
- **No backend** (static site only)
- **No unified nav** (need directory page)

Hope this clears up the confusion!
