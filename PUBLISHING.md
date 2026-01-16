# Publishing Workflow: Getting Your Sites Live

## Overview

Your domains (soulfra.com, calriven.com, etc.) are served by **GitHub Pages**.

**The flow:**
1. Generate content locally
2. Review in browser
3. Commit to git
4. Push to GitHub
5. Site updates automatically (usually within 1-2 minutes)

## Setup (One-Time)

### 1. Check Your Git Repos

Each domain folder should be its own git repository:

```bash
# Check soulfra
cd soulfra
git remote -v
# Should show: origin  https://github.com/YOUR_USERNAME/soulfra.git

# Check calriven
cd ../calriven
git remote -v
# Should show: origin  https://github.com/YOUR_USERNAME/calriven.git

# Repeat for deathtodata and cringeproof
```

### 2. Verify CNAME Files

Each domain should have a CNAME file pointing to your custom domain:

```bash
cat soulfra/CNAME
# Should contain: soulfra.com

cat calriven/CNAME
# Should contain: calriven.com
```

### 3. GitHub Pages Settings

For each repo on GitHub:
1. Go to Settings → Pages
2. Source: Deploy from `main` branch, `/ (root)` folder
3. Custom domain: Enter your domain (soulfra.com, etc.)
4. Enforce HTTPS: ✓ (check this)

### 4. DNS Configuration

Point your domains to GitHub Pages:

```
Type: CNAME
Name: www
Value: YOUR_USERNAME.github.io

Type: A (4 records)
Name: @
Values:
  185.199.108.153
  185.199.109.153
  185.199.110.153
  185.199.111.153
```

## Daily Workflow

### Option 1: Single Domain

```bash
# 1. Generate content
node launch-domains.js soulfra

# 2. Review locally
open http://localhost:8000/soulfra

# 3. Publish
cd soulfra
git add .
git commit -m "Updated content"
git push origin main

# 4. Wait 1-2 minutes, then visit soulfra.com
```

### Option 2: All Domains

```bash
# 1. Generate all sites
node launch-domains.js

# 2. Publish each one
for domain in soulfra calriven deathtodata cringeproof; do
  cd $domain
  git add .
  git commit -m "Auto-generated content update"
  git push origin main
  cd ..
done

# 3. All sites update within 2 minutes
```

## Git Best Practices

### Commit Messages

Good examples:
```bash
git commit -m "Add new blog posts about self-sovereign identity"
git commit -m "Update landing page with new features"
git commit -m "Fix typos in pitch deck"
git commit -m "Regenerate all content with improved prompts"
```

Bad examples:
```bash
git commit -m "stuff"
git commit -m "asdf"
git commit -m "update"
```

### Before Pushing

Always review what you're committing:

```bash
# See what changed
git status

# See the actual changes
git diff

# See which files will be committed
git diff --cached

# If you need to undo
git reset HEAD <file>
```

### Typical Session

```bash
cd soulfra

# Make your changes (or run generator)
node ../launch-domains.js soulfra

# Review
git status
git diff

# Stage and commit
git add .
git commit -m "Updated blog posts and landing page"

# Push
git push origin main
```

## Troubleshooting

### "remote: Permission denied"

You need to authenticate with GitHub:

```bash
# Use GitHub CLI (recommended)
gh auth login

# Or set up SSH keys
ssh-keygen -t ed25519 -C "your_email@example.com"
# Then add ~/.ssh/id_ed25519.pub to GitHub Settings → SSH Keys
```

### "fatal: not a git repository"

The folder isn't initialized as a git repo:

```bash
cd soulfra
git init
git remote add origin https://github.com/YOUR_USERNAME/soulfra.git
git branch -M main
git push -u origin main
```

### "Site not updating"

1. Check GitHub Actions: Go to repo → Actions tab
2. Look for failed builds
3. Common issues:
   - CNAME file deleted (re-add it)
   - Invalid HTML (check browser console)
   - File too large (> 100MB)

### "404 on custom domain"

1. Check CNAME file exists in repo
2. Check GitHub Pages settings (Settings → Pages)
3. Wait 5-10 minutes for DNS propagation
4. Check DNS with: `dig soulfra.com`

## Advanced: Automated Publishing

Create a script to publish all domains:

```bash
#!/bin/bash
# File: publish-all.sh

for domain in soulfra calriven deathtodata cringeproof; do
  echo "Publishing $domain..."
  cd $domain

  if [ -n "$(git status --porcelain)" ]; then
    git add .
    git commit -m "Auto-update: $(date '+%Y-%m-%d %H:%M')"
    git push origin main
    echo "✅ $domain pushed"
  else
    echo "ℹ️  $domain - no changes"
  fi

  cd ..
done

echo "🎉 All domains published!"
```

Make it executable:
```bash
chmod +x publish-all.sh
```

Run it:
```bash
./publish-all.sh
```

## Content Update Cycle

### Weekly Updates

```bash
# 1. Regenerate all content
node launch-domains.js

# 2. Review one domain
open http://localhost:8000/soulfra

# 3. If good, publish all
./publish-all.sh
```

### Quick Fix

```bash
# 1. Edit manually
vim soulfra/index.html

# 2. Commit and push
cd soulfra
git add index.html
git commit -m "Fix typo on homepage"
git push origin main
```

### Major Redesign

```bash
# 1. Create a branch
cd soulfra
git checkout -b redesign

# 2. Make changes
node ../launch-domains.js soulfra

# 3. Test thoroughly
open http://localhost:8000/soulfra

# 4. Merge and deploy
git checkout main
git merge redesign
git push origin main
```

## Monitoring

### Check Live Status

```bash
# Check if sites are up
curl -I https://soulfra.com
curl -I https://calriven.com
curl -I https://deathtodata.com
curl -I https://cringeproof.com
```

### Check Build Status

Visit:
- https://github.com/YOUR_USERNAME/soulfra/actions
- https://github.com/YOUR_USERNAME/calriven/actions
- https://github.com/YOUR_USERNAME/deathtodata/actions
- https://github.com/YOUR_USERNAME/cringeproof/actions

## That's It!

**The loop:**
1. `node launch-domains.js` → Generate
2. `git add . && git commit && git push` → Publish
3. Wait 1-2 minutes → Live

No FTP. No login. No complex deployment. Just git.
