# Subdirectory Routing Strategy
**Single Repo, Multiple Custom Domains**

---

## How It Works

### Single GitHub Pages Repo
```
soulfra.github.io/
├── index.html              → soulfra.com
├── qr-scanner.html         → soulfra.com/qr-scanner.html
├── email-friends-signup.html
├── cringeproof/
│   └── index.html          → cringeproof.com
├── calriven/
│   └── index.html          → calriven.com
├── cringeproof-sports/
│   └── index.html          → cringeproof.com/sports (or sports.cringeproof.com)
└── test-all-sites.sh       → Local testing script
```

### Custom Domain Routing (via CNAME)
GitHub Pages automatically routes custom domains to subdirectories:

1. **soulfra.com** → CNAME → soulfra.github.io → serves `/`
2. **cringeproof.com** → CNAME → soulfra.github.io → serves `/cringeproof/`
3. **calriven.com** → CNAME → soulfra.github.io → serves `/calriven/`

### How GitHub Determines Subdirectory
- If CNAME file exists in subdirectory: Uses that mapping
- If not: GitHub uses hostname matching to find subdirectory

---

## Advantages Over Separate Repos

### ✅ Single Repo Strategy
1. **One git push** → All sites deploy
2. **Single GitHub Actions workflow** → Test all sites at once
3. **Shared assets** → CSS, JS, images can be shared
4. **Easier management** → Edit all locally, push once
5. **Version control** → All sites in same commit history

### ❌ Separate Repos (Overcomplicated)
1. Need to create 3+ repos
2. Push to each separately
3. Manage 3 GitHub Actions workflows
4. Duplicate shared assets
5. Harder to keep in sync

---

## Local Testing

### Start Local Server
```bash
cd ~/Desktop/soulfra.github.io
python3 -m http.server 8000
```

### Run Test Script
```bash
./test-all-sites.sh
```

Output:
```
🧪 Testing All Sites on localhost:8000

Testing soulfra.com (root)... ✅
Testing cringeproof.com (/cringeproof/)... ✅
Testing calriven.com (/calriven/)... ✅

Cringeproof Variants:
  /cringeproof-sports/... ✅
  /cringeproof-crypto/... ✅
  /cringeproof-purple/... ✅
  /cringeproof-qr/... ✅

Individual Files:
  /mobile.html... ✅
  /cringeproof-live.html... ✅
  /qr-scanner.html... ✅
  /email-friends-signup.html... ✅

✨ Testing complete!
```

### Manual Testing
```bash
# Test root site
curl http://localhost:8000/

# Test subdirectories
curl http://localhost:8000/cringeproof/
curl http://localhost:8000/calriven/

# Test individual files
curl http://localhost:8000/mobile.html
curl http://localhost:8000/qr-scanner.html
```

---

## DNS Configuration (GoDaddy)

### soulfra.com
```
Type: CNAME
Name: @
Value: soulfra.github.io
TTL: 1 hour
```

### cringeproof.com
```
Type: CNAME
Name: @
Value: soulfra.github.io
TTL: 1 hour
```

### calriven.com
```
Type: CNAME
Name: @
Value: soulfra.github.io
TTL: 1 hour
```

**GitHub automatically routes based on domain name to subdirectory.**

---

## GitHub Pages Settings

### Enable GitHub Pages
1. Go to: https://github.com/Soulfra/soulfra.github.io/settings/pages
2. Source: `main` branch
3. Custom domain: `soulfra.com`
4. Enforce HTTPS: ✅

### Add CNAME Files (Optional)
If GitHub doesn't auto-route, add CNAME files:

```bash
# In cringeproof/ subdirectory
echo "cringeproof.com" > cringeproof/CNAME

# In calriven/ subdirectory
echo "calriven.com" > calriven/CNAME
```

---

## API Server (Localhost Only)

All 3 domains hit the same API:
```
soulfra.com → http://192.168.1.87:3001
cringeproof.com → http://192.168.1.87:3001
calriven.com → http://192.168.1.87:3001
```

### Start API
```bash
cd ~/Desktop/cringeproof-vertical
npm start
```

### Test API
```bash
curl http://192.168.1.87:3001/health
curl http://192.168.1.87:3001/api/blog/posts
```

---

## Deployment Workflow

### Make Changes Locally
```bash
cd ~/Desktop/soulfra.github.io

# Edit any files in any subdirectory
code cringeproof/index.html
code calriven/index.html
code index.html
```

### Test Locally
```bash
# Start server
python3 -m http.server 8000

# Run tests
./test-all-sites.sh
```

### Push to GitHub
```bash
git add -A
git commit -m "Update sites"
git push origin main
```

**All 3 domains auto-deploy in 2-5 minutes.**

---

## Why This Is "Ossified"

### Like Bitcoin
- Deploy once
- Never touch infrastructure
- Just works forever
- No servers to maintain

### Architecture Principles
1. **Static files only** (no server-side rendering)
2. **Single repo** (no complex multi-repo coordination)
3. **GitHub Pages** (free, reliable, unfuckwithable)
4. **HTTPS by default** (security built-in)
5. **Git-based deployment** (just push to update)

---

## Troubleshooting

### Domain Not Routing to Subdirectory
1. Check DNS propagation: https://dnschecker.org
2. Add CNAME file to subdirectory
3. Wait 10-60 minutes for DNS

### 404 on Subdirectory
1. Ensure `index.html` exists in subdirectory
2. Check GitHub Pages settings
3. Test locally first: `curl http://localhost:8000/subdirectory/`

### API Not Responding
1. Check API server running: `curl http://192.168.1.87:3001/health`
2. Restart: `cd ~/Desktop/cringeproof-vertical && npm start`
3. Check network: Must be on same local network

---

## Advanced: GitHub Actions Workflow

### Auto-test on Every Push
Create `.github/workflows/test.yml`:

```yaml
name: Test All Sites

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Start HTTP Server
        run: |
          python3 -m http.server 8000 &
          sleep 2

      - name: Test All Sites
        run: |
          chmod +x test-all-sites.sh
          ./test-all-sites.sh
```

This runs your test script on every commit automatically.

---

## Next Steps

1. ✅ Created calriven/ subdirectory
2. ✅ Moved mobile.html → calriven/index.html
3. ✅ Created test-all-sites.sh
4. ⏭️ Push to GitHub
5. ⏭️ Configure DNS for calriven.com
6. ⏭️ Wait for deployment (2-5 min)
7. ⏭️ Done forever

**This is the way.**
