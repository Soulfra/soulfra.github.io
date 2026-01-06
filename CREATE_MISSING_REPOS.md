# Create Missing GitHub Repos

## Why This Is Needed

The Flask API at `https://192.168.1.87:5002/api/debug/github-repos` currently returns `null` because these repos don't exist yet. Once created, the GitHub Actions workflow will scrape real data hourly.

## Required Repos (8 total)

Each domain needs 2 repos:
- `{domain}-content` - Blog posts, articles, documentation
- `{domain}-data` - Datasets, examples, code samples

### CalRiven (AI-powered technical writing)
1. **calriven-content** - Blog posts generated from voice memos
2. **calriven-data** - Voice transcripts, AI prompts, examples

### CringeProof (Authentic conversation)
3. **cringeproof-content** - Anti-performative guides, conversation analysis
4. **cringeproof-data** - Cringe detection datasets, examples

### DeathToData (Privacy-first search)
5. **deathtodata-content** - Privacy guides, search alternatives
6. **deathtodata-data** - Privacy metrics, search quality datasets

### Soulfra (Non-typing internet)
7. **soulfra-content** - QR code guides, voice navigation docs
8. **soulfra-data** - QR authentication examples, device fingerprints

## How to Create Each Repo

### Step 1: Create on GitHub

For each repo above:

```bash
# Using GitHub CLI (recommended)
gh repo create Soulfra/{repo-name} --public --description "{description}"

# Or manually:
# 1. Go to https://github.com/new
# 2. Owner: Soulfra
# 3. Repository name: {repo-name}
# 4. Description: {description}
# 5. Public
# 6. Add README
# 7. Create repository
```

### Step 2: Clone Locally

```bash
cd ~/Desktop/roommate-chat/soulfra-simple
git clone https://github.com/Soulfra/{repo-name}.git
cd {repo-name}
```

### Step 3: Add Initial Content

For `-content` repos:
```bash
# Create blog structure
mkdir -p posts
echo "# {Domain} Content" > README.md
echo "Published articles and documentation" >> README.md

# Add .gitkeep to preserve structure
touch posts/.gitkeep

git add .
git commit -m "🎬 Initialize {repo-name} - content repository"
git push origin main
```

For `-data` repos:
```bash
# Create data structure
mkdir -p datasets examples
echo "# {Domain} Data" > README.md
echo "Datasets, examples, and code samples" >> README.md

# Add .gitkeep files
touch datasets/.gitkeep examples/.gitkeep

git add .
git commit -m "📊 Initialize {repo-name} - data repository"
git push origin main
```

## Quick Creation Script

```bash
#!/bin/bash
# save as: create_repos.sh

DOMAINS=("calriven" "cringeproof" "deathtodata" "soulfra")
TYPES=("content" "data")

for domain in "${DOMAINS[@]}"; do
  for type in "${TYPES[@]}"; do
    repo="${domain}-${type}"

    echo "Creating ${repo}..."
    gh repo create Soulfra/${repo} --public --description "${domain} ${type} repository"

    # Clone and setup
    git clone https://github.com/Soulfra/${repo}.git
    cd ${repo}

    if [ "$type" == "content" ]; then
      mkdir -p posts
      echo "# ${domain} Content" > README.md
      touch posts/.gitkeep
    else
      mkdir -p datasets examples
      echo "# ${domain} Data" > README.md
      touch datasets/.gitkeep examples/.gitkeep
    fi

    git add .
    git commit -m "🎬 Initialize ${repo}"
    git push origin main
    cd ..
  done
done

echo "✅ All 8 repos created!"
```

## After Creation

1. **Verify repos exist:**
   ```bash
   gh repo list Soulfra
   ```

2. **Test Flask API:**
   ```bash
   curl https://192.168.1.87:5002/api/debug/github-repos | jq
   ```

   Should now return real data instead of null!

3. **Check GitHub Actions:**
   - Go to https://github.com/Soulfra/soulfra.github.io/actions
   - Workflow "Update Domain Stats" should be scheduled
   - Will run hourly and update stats automatically

4. **Verify live site:**
   ```bash
   curl https://soulfra.github.io/domain-stats.json | jq
   ```

   Should show real activity scores instead of all zeros!

## Voice Publishing Flow

Once repos exist, the full workflow works:

1. **Record voice memo** → Drop into import_voice_memo.py
2. **Whisper transcribes** → Stored in soulfra.db
3. **Ollama enhances** → Routes to appropriate domain
4. **publish_voice.py** → Creates markdown, commits to {domain}-content
5. **Auto git push** → Lives at https://github.com/Soulfra/{domain}-content
6. **GitHub Actions** → Updates stats hourly
7. **Resource allocation** → Adjusts dev time based on activity

## Troubleshooting

**Q: Flask API still returns null after creating repos?**
- Check repo names match exactly: `{domain}-content` and `{domain}-data`
- Ensure repos are public (not private)
- Wait ~1 hour for GitHub Actions to run first time

**Q: How do I manually trigger stats update?**
```bash
cd soulfra.github.io
python3 scripts/github_domain_scraper.py
python3 scripts/breadcrumb_router.py
python3 scripts/oss_leaderboard.py
git add .
git commit -m "📊 Manual stats update"
git push origin main
```

**Q: Voice publishing fails?**
- Check soulfra.db exists: `ls -la soulfra.db`
- Verify Ollama is running: `curl http://localhost:11434/api/tags`
- Ensure publish_voice.py has git credentials configured
