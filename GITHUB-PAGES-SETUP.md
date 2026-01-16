# GitHub Pages + Custom Domain Setup

## ✅ All Links Work Locally!

Test results show all navigation links return 200 OK. The navigation is working correctly at `http://localhost:8000/deathtodata/`.

If you're seeing broken links in the browser:
1. **Hard refresh**: Cmd+Shift+R (clears browser cache)
2. **Check browser console**: Look for 404 errors
3. **Verify URL**: Check what URL shows in address bar when you click links

## The Real Issue: GitHub Pages Custom Domains

### Current Setup (Won't Work for Custom Domains)
```
soulfra.github.io/
├── deathtodata/     ← Can't have deathtodata.com point here
├── calriven/        ← Can't have calriven.com point here
└── cringeproof/     ← Can't have cringeproof.com point here
```

**Problem**: GitHub Pages custom domains are **per-repository**, not per-subdirectory.

### Solution: Separate Repos for Each Domain

#### Option 1: Dedicated Repos (Recommended)

**Create separate repos:**
1. `deathtodata-site` (enable Pages) → deathtodata.com
2. `calriven-site` (enable Pages) → calriven.com
3. `cringeproof-site` (enable Pages) → cringeproof.com

**In each repo:**
- Add `CNAME` file in root with domain name
- All files at root level (no `/deathtodata/` subdirectory)
- Navigation uses root-relative paths: `/`, `/blog/`, `/pitch-deck.html`

#### Option 2: User Site (One Domain Only)

Use `soulfra.github.io` repo for one main domain:
- Add `CNAME` with `soulfra.com`
- Serves entire repo at soulfra.com
- Other projects can't have custom domains

## DNS Configuration for deathtodata.com

**Add these DNS records at your domain registrar:**

### A Records (for apex domain)
```
Type: A
Name: @ (or leave blank)
Value: 185.199.108.153
Value: 185.199.109.153
Value: 185.199.110.153
Value: 185.199.111.153
```

### CNAME Record (for www subdomain)
```
Type: CNAME
Name: www
Value: yourusername.github.io
```

Wait 24-48 hours for DNS propagation.

## Updating Template Generator for Root Paths

If you move to separate repos, update `api/template-generator.js`:

```javascript
// Remove pathPrefix parameter, use root-relative paths
getHeader(domain) {
  return `
  <nav>
      <a href="/">Home</a>
      <a href="/blog/">Blog</a>
      <a href="/pitch-deck.html">Pitch Deck</a>
      <a href="/business-plan.html">Business Plan</a>
  </nav>
  `;
}
```

Root-relative paths (starting with `/`) work both:
- Locally: `http://localhost:8000/blog/`
- GitHub Pages: `https://deathtodata.com/blog/`

## Quick Migration Script

```bash
# Create new repo for deathtodata
cd ~/Desktop
git clone https://github.com/yourusername/deathtodata-site.git
cd deathtodata-site

# Copy files from current location
cp -r ~/Desktop/soulfra.github.io/deathtodata/* .

# The CNAME file is already there
cat CNAME  # Should show: deathtodata.com

# Commit and push
git add .
git commit -m "Initial deathtodata.com site"
git push

# Enable GitHub Pages in repo settings → Pages → Source: main branch
```

## References

- [GitHub Pages custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [Sites like arxiv.org](https://arxiv.org/html/2308.12950v3) use root-relative paths
- [Ollama blog](https://ollama.com/blog/how-to-prompt-code-llama) - same pattern
