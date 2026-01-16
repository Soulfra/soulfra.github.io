# 🌐 Domain Routing Guide

**How Soulfra Ecosystem URLs Work**

Understanding the routing between localhost, GitHub Pages, and custom domains.

---

## 📋 Quick Reference

| Domain | Points To | Purpose |
|--------|-----------|---------|
| `soulfra.com` | GitHub Pages root | Main entry point |
| `cringeproof.com` | `/cringeproof/` | CringeProof onboarding |
| `calriven.com` | `/cal/` | Calriven business tools |
| `deathtodata.com` | `/deathtodata/` | DeathToData manifesto |
| `localhost:8000` | Local testing | Development |

---

## 🏗️ Current Setup

### GitHub Pages Configuration

**Repository**: `soulfra/soulfra.github.io`

**CNAME File**: `/CNAME`
```
soulfra.com
```

This makes:
- ✅ `soulfra.com` → GitHub Pages
- ✅ `www.soulfra.com` → GitHub Pages
- ✅ `soulfra.github.io` → Redirects to `soulfra.com`

### File Structure on GitHub

```
soulfra.github.io/
├── CNAME                    # Points to soulfra.com
├── index.html               # Root page
├── nav.html                 # Master navigation
├── pipelines/
│   └── run.html            # Pipelines tool
├── voice/
│   └── record.html         # Voice memos
├── reviews/
│   └── form.html           # Reviews system
├── sandbox/
│   └── test.html           # Sandbox environment
├── cal/
│   ├── test-protocol.html  # $1 faucet
│   └── (other cal tools)
├── cringeproof/
│   └── (onboarding pages)
├── deathtodata/
│   └── (manifesto pages)
└── lib/
    └── *.js                # Shared libraries
```

---

## 🔀 How Routing Works

### Root Domain: soulfra.com

When you visit `soulfra.com`:

1. DNS lookup → GitHub Pages servers
2. GitHub checks `/CNAME` file
3. Serves `/index.html` from root

**Current Behavior**:
```
soulfra.com              → /index.html
soulfra.com/nav.html     → /nav.html
soulfra.com/pipelines/   → /pipelines/run.html
```

**NOT**:
```
❌ soulfra.com/soulfra/  (this path doesn't exist)
```

### The Confusion: soulfra.com/soulfra

**Why this seems confusing**:

In some multi-brand GitHub Pages setups, people do:
```
example.github.io/
├── brand-a/
├── brand-b/
└── brand-c/
```

And route like:
- `brand-a.com` → `/brand-a/`
- `brand-b.com` → `/brand-b/`

**BUT we're not doing that.**

We're using:
- `soulfra.com` → Root `/`
- `cringeproof.com` → `/cringeproof/` (will be subdomain eventually)
- `calriven.com` → `/cal/` (will be subdomain eventually)

### Why No /soulfra/ Folder?

Because `soulfra.com` IS the main site. It serves from root `/`.

Only the OTHER brands have folders:
- `/cringeproof/` → for CringeProof branding
- `/cal/` → for Calriven branding
- `/deathtodata/` → for DeathToData branding

---

## 🎯 URL Mapping Examples

### Localhost vs Production

| Feature | Localhost | Production |
|---------|-----------|------------|
| Pipelines | `http://localhost:8000/pipelines/run.html` | `https://soulfra.com/pipelines/run.html` |
| Voice Memos | `http://localhost:8000/voice/record.html` | `https://soulfra.com/voice/record.html` |
| Sandbox | `http://localhost:8000/sandbox/test.html` | `https://soulfra.com/sandbox/test.html` |
| Cal Faucet | `http://localhost:8000/cal/test-protocol.html` | `https://soulfra.com/cal/test-protocol.html` |
| Navigation | `http://localhost:8000/nav.html` | `https://soulfra.com/nav.html` |

**Key Point**: Paths are identical. Only the domain changes.

---

## 🔧 Testing Both Environments

### Local Testing (localhost:8000)

**Start server**:
```bash
cd /Users/matthewmauer/Desktop/soulfra.github.io
python3 -m http.server 8000
```

**Access**:
```
http://localhost:8000/nav.html
http://localhost:8000/pipelines/run.html
http://localhost:8000/cal/test-protocol.html
```

**Benefits**:
- ✅ Instant changes (no git push)
- ✅ Ollama integration works
- ✅ Fast iteration
- ✅ Test before deploy

**Limitations**:
- ❌ No HTTPS (Stripe won't work)
- ❌ No custom domains
- ❌ Only accessible on your machine

### Production Testing (soulfra.com)

**After pushing to GitHub**:
```bash
git add .
git commit -m "Update feature"
git push origin main
```

**Wait 1-2 minutes for GitHub Pages to rebuild**

**Access**:
```
https://soulfra.com/nav.html
https://soulfra.com/pipelines/run.html
https://soulfra.com/cal/test-protocol.html
```

**Benefits**:
- ✅ HTTPS enabled (Stripe works)
- ✅ Custom domain active
- ✅ Publicly accessible
- ✅ Real production environment

**Limitations**:
- ❌ Slower iteration (git push + rebuild)
- ❌ Ollama won't work (local-only)
- ❌ Changes are public immediately

---

## 🌍 Multi-Domain Strategy

### Current State: Path-Based Routing

**All domains point to same repo, different paths**:

```
soulfra.com → /index.html (root)
[Future: cringeproof.com] → /cringeproof/index.html
[Future: calriven.com] → /cal/index.html
[Future: deathtodata.com] → /deathtodata/index.html
```

**How to set this up**:

1. **Buy domains**: cringeproof.com, calriven.com, deathtodata.com

2. **Configure DNS** (for each domain):
   ```
   Type: CNAME
   Name: @
   Value: soulfra.github.io
   ```

3. **Add to GitHub Pages settings**:
   - Repo → Settings → Pages → Custom domain
   - Add each domain
   - GitHub will create CNAME files in branches

4. **Add subdomain detection** in each brand's index:

```javascript
// In /cringeproof/index.html
if (window.location.hostname === 'cringeproof.com') {
  console.log('Branded CringeProof experience');
  document.body.classList.add('cringeproof-brand');
}
```

### Future State: Subdomain-Based Routing

**Better approach** (when ready):

```
soulfra.com          → Main site
cringeproof.com      → Separate GitHub repo
calriven.com         → Separate GitHub repo
deathtodata.com      → Separate GitHub repo
```

**Benefits**:
- ✅ True brand separation
- ✅ Independent deployment
- ✅ Cleaner URLs
- ✅ Separate analytics

**Trade-offs**:
- ❌ Code duplication (shared libs)
- ❌ More repos to manage
- ❌ Harder to share data between brands

---

## 📍 Path Resolution

### How Browsers Resolve Paths

**Absolute paths** (start with `/`):
```javascript
// Always resolves from domain root
<script src="/lib/story-compiler.js"></script>

// Works on:
// localhost:8000/lib/story-compiler.js
// soulfra.com/lib/story-compiler.js
```

**Relative paths** (no leading `/`):
```javascript
// Resolves relative to current page
<script src="lib/story-compiler.js"></script>

// If you're at /sandbox/test.html:
// Looks for /sandbox/lib/story-compiler.js (WRONG!)

// Should use absolute: /lib/story-compiler.js
```

**Best Practice**: Always use absolute paths for shared resources.

### Library Loading

All pages should load libraries like this:

```html
<script src="/lib/session-manager.js"></script>
<script src="/lib/soul-capsule.js"></script>
<script src="/lib/cal-capsule.js"></script>
<script src="/lib/story-compiler.js"></script>
<script src="/lib/reasoning-engine.js"></script>
```

This works on both:
- `localhost:8000/sandbox/test.html`
- `soulfra.com/sandbox/test.html`

---

## 🔐 HTTPS & Security

### Localhost: HTTP Only

```
http://localhost:8000/
```

- No SSL/TLS
- Browser allows: localStorage, microphone, etc.
- Stripe: Won't work (requires HTTPS)

### GitHub Pages: HTTPS Enforced

```
https://soulfra.com/
```

- Automatic SSL via Let's Encrypt
- Browser allows: localStorage, microphone, etc.
- Stripe: Works
- Payment links: Functional

### Testing Payment Flows

**Development**:
```javascript
// In /cal/test-protocol.html
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // Skip Stripe, simulate payment
  completePayment(email);
} else {
  // Redirect to real Stripe
  window.location.href = STRIPE_PAYMENT_LINK;
}
```

This lets you test locally without Stripe, but use real payments in production.

---

## 🧭 Navigation Best Practices

### Internal Links

**Use absolute paths**:
```html
<!-- Good -->
<a href="/nav.html">Navigation</a>
<a href="/pipelines/run.html">Pipelines</a>
<a href="/cal/test-protocol.html">Cal Faucet</a>

<!-- Bad -->
<a href="nav.html">Navigation</a>
<a href="../pipelines/run.html">Pipelines</a>
```

**Why**: Works consistently across all pages and domains.

### External Links

**Always use full URLs**:
```html
<a href="https://github.com/soulfra">GitHub</a>
<a href="https://ollama.com">Ollama</a>
```

### Cross-Brand Links

**Link between brands**:
```html
<!-- From Soulfra to CringeProof -->
<a href="/cringeproof/index.html">Try CringeProof</a>

<!-- From CringeProof to Calriven -->
<a href="/cal/test-protocol.html">Test Calriven</a>

<!-- Back to main nav -->
<a href="/nav.html">All Tools</a>
```

---

## 🚀 Deployment Workflow

### 1. Develop Locally

```bash
# Start local server
python3 -m http.server 8000

# Test in browser
open http://localhost:8000/nav.html

# Make changes to files
# Refresh browser to see updates
```

### 2. Test Features

```bash
# Run punch tests
open http://localhost:8000/sandbox/test.html

# Check console for errors (F12)
# Verify all buttons work
# Test Ollama integration
```

### 3. Commit Changes

```bash
cd /Users/matthewmauer/Desktop/soulfra.github.io

git add .
git commit -m "Add: [feature description]"
git status  # Verify
```

### 4. Push to GitHub

```bash
git push origin main
```

### 5. Wait for Build

**GitHub Actions will**:
1. Receive push
2. Build static site
3. Deploy to GitHub Pages
4. Usually takes 1-2 minutes

**Check build status**:
- GitHub repo → Actions tab
- Watch for green checkmark

### 6. Test Production

```bash
# Wait 2 minutes, then test
open https://soulfra.com/nav.html

# Verify changes live
# Test on mobile devices
# Check HTTPS works
```

---

## 🔍 Debugging Routes

### Problem: 404 Not Found

**Symptoms**:
```
soulfra.com/pipelines/run.html → 404
```

**Check**:
1. **File exists?**
   ```bash
   ls /Users/matthewmauer/Desktop/soulfra.github.io/pipelines/run.html
   ```

2. **Committed to git?**
   ```bash
   git status
   git log --oneline -5
   ```

3. **Pushed to GitHub?**
   ```bash
   git log origin/main..HEAD
   # Should be empty (nothing unpushed)
   ```

4. **GitHub Pages deployed?**
   - Check GitHub → Actions
   - Look for latest workflow run

---

### Problem: Links Don't Work

**Symptoms**:
- Click link → nothing happens
- Or → goes to wrong page

**Debug**:

1. **Check link path**:
   ```html
   <!-- Inspect element, verify href -->
   <a href="/nav.html">Should work</a>
   <a href="nav.html">Might break if not at root</a>
   ```

2. **Test in browser console**:
   ```javascript
   // Check current page
   console.log(window.location.href);

   // Check link resolution
   const link = document.querySelector('a');
   console.log(link.href); // Shows absolute URL
   ```

---

### Problem: JavaScript Not Loading

**Symptoms**:
```
Uncaught ReferenceError: StoryCompiler is not defined
```

**Debug**:

1. **Check Network tab** (F12 → Network):
   - Is `/lib/story-compiler.js` loading?
   - Status code 200 or 404?

2. **Check Console** (F12 → Console):
   - Look for "[StoryCompiler] Module loaded"
   - If missing, script didn't execute

3. **Verify script tag**:
   ```html
   <!-- Must be absolute path -->
   <script src="/lib/story-compiler.js"></script>

   <!-- Not relative -->
   <script src="lib/story-compiler.js"></script>
   ```

4. **Check export**:
   ```javascript
   // In browser console after page loads
   console.log(window.StoryCompiler);
   // Should show object, not undefined
   ```

---

## 📊 Domain Routing Checklist

```
SETUP:
□ CNAME file exists with `soulfra.com`
□ GitHub Pages enabled on repo
□ Custom domain configured in repo settings
□ DNS propagated (use dig soulfra.com)

PATHS:
□ All internal links use absolute paths (/nav.html)
□ All script tags use absolute paths (/lib/*.js)
□ No links to /soulfra/ (doesn't exist)

TESTING:
□ Localhost works (http://localhost:8000)
□ Production works (https://soulfra.com)
□ HTTPS enforced (http redirects to https)
□ All pages load without 404s

BRANDS:
□ /cringeproof/ folder exists
□ /cal/ folder exists
□ /deathtodata/ folder exists
□ Each brand has index page
```

---

## 🎯 Common Patterns

### Pattern 1: Navigation Hub

**Every brand should link back to nav**:

```html
<!-- In /cringeproof/index.html -->
<footer>
  <a href="/nav.html">← All Soulfra Tools</a>
</footer>

<!-- In /cal/test-protocol.html -->
<button onclick="window.location.href='/nav.html'">
  → Go to Navigation
</button>
```

### Pattern 2: Brand Detection

**Customize experience based on path**:

```javascript
const pathname = window.location.pathname;

if (pathname.startsWith('/cringeproof/')) {
  document.body.classList.add('cringeproof-theme');
  console.log('CringeProof branding active');
} else if (pathname.startsWith('/cal/')) {
  document.body.classList.add('calriven-theme');
  console.log('Calriven branding active');
} else {
  document.body.classList.add('soulfra-theme');
  console.log('Soulfra branding active');
}
```

### Pattern 3: Cross-Brand Data Sharing

**Share data via localStorage**:

```javascript
// In CringeProof onboarding
localStorage.setItem('soulfra_user_id', userId);

// In Calriven tool
const userId = localStorage.getItem('soulfra_user_id');
// Now you know it's the same user
```

**Benefits**:
- Same domain = same localStorage
- Users authenticated once, works everywhere
- No complex session management

---

## 🔗 Next Steps

1. **Test current routing**:
   - Run punch tests: `/docs/PUNCH_TEST.md`
   - Verify all links work

2. **Plan multi-domain**:
   - Decide: Subdirectories vs separate repos
   - Configure DNS for new domains
   - Set up brand-specific landing pages

3. **Monitor deployment**:
   - Watch GitHub Actions
   - Test production after each push
   - Keep localhost/production in sync

---

## 📚 Reference Links

- **GitHub Pages Docs**: https://docs.github.com/en/pages
- **Custom Domain Setup**: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site
- **DNS Configuration**: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

---

**Last Updated**: 2026-01-12
**Current Setup**: Single repo, path-based routing
**Maintained by**: Soulfra Infrastructure Team
