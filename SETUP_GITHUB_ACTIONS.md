# GitHub Actions Setup - Automated Domain Stats

This repo uses GitHub Actions to automatically update domain stats, breadcrumbs, and leaderboards every hour.

## What Gets Updated

Every hour, three scripts run automatically:

1. **`github_domain_scraper.py`** - Scrapes GitHub API for:
   - Stars, commits, contributors, issues for each domain's 2 repos
   - Calculates activity scores
   - Ranks domains by priority (1-4)
   - Outputs: `domain-stats.json`, `*/stats.json`

2. **`breadcrumb_router.py`** - Generates cross-domain navigation:
   - Routes users from hot domains to cold domains
   - Priority-based link recommendations
   - Outputs: `breadcrumb-map.json`, `*/breadcrumbs.json`, `*/breadcrumb-nav.html`

3. **`oss_leaderboard.py`** - Ranks OSS contributors:
   - Tracks commits, PRs, issues per domain
   - Global leaderboard across all domains
   - Tier system (Champion → Newcomer)
   - Outputs: `global-leaderboard.json`, `*/leaderboard.json`

## Workflow Schedule

The workflow runs:
- **Every hour** (at :00 minutes) via cron schedule
- **On push** to `main` branch (when scripts change)
- **Manually** via workflow_dispatch (Actions tab → "Run workflow")

## Files Structure

```
soulfra.github.io/
├── .github/
│   └── workflows/
│       └── update-domain-stats.yml   # GitHub Actions workflow
├── scripts/
│   ├── github_domain_scraper.py      # Domain stats scraper
│   ├── breadcrumb_router.py          # Cross-domain routing
│   └── oss_leaderboard.py            # Contributor leaderboard
├── domain-stats.json                 # Master domain rankings (auto-generated)
├── breadcrumb-map.json               # Master breadcrumb routes (auto-generated)
├── global-leaderboard.json           # Global contributor rankings (auto-generated)
├── calriven/
│   ├── stats.json                    # CalRiven stats (auto-generated)
│   ├── breadcrumbs.json              # CalRiven breadcrumbs (auto-generated)
│   ├── breadcrumb-nav.html           # CalRiven navigation HTML (auto-generated)
│   └── leaderboard.json              # CalRiven leaderboard (auto-generated)
├── cringeproof/
│   └── ...                           # Same structure
├── deathtodata/
│   └── ...                           # Same structure
└── soulfra/
    └── ...                           # Same structure
```

## How It Works

### 1. Workflow Triggers

```yaml
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:      # Manual trigger
  push:
    branches: [main]
    paths: ['scripts/**']
```

### 2. Workflow Steps

1. **Checkout repo** - Gets latest code
2. **Setup Python** - Installs Python 3.11
3. **Install dependencies** - `pip install requests`
4. **Run scrapers** - Executes all 3 Python scripts
5. **Check for changes** - Compares git diff
6. **Commit & push** - If stats changed, auto-commits with timestamp
7. **Summary** - Displays updated domain rankings in Actions tab

### 3. Auto-Commit Messages

```
🤖 Update domain stats [automated] 2026-01-06 18:30:00
```

### 4. GitHub Token

The workflow uses `${{ secrets.GITHUB_TOKEN }}` which is automatically provided by GitHub Actions. This gives:
- **5000 requests/hour** to GitHub API (vs 60 without auth)
- **Write access** to commit updated stats back to the repo

## How to Enable

### 1. Push to GitHub

```bash
cd soulfra.github.io
git add .
git commit -m "Add GitHub Actions automation"
git push origin main
```

### 2. Enable GitHub Actions

- Go to your repo on GitHub
- Click **Actions** tab
- If prompted, click **"I understand my workflows, go ahead and enable them"**

### 3. Verify Workflow

- Click on **"Update Domain Stats"** workflow
- You should see it scheduled to run every hour
- Click **"Run workflow"** to test manually

### 4. Check Workflow Runs

- Go to **Actions** tab
- Click on latest workflow run
- View logs and summary

## Manual Testing

To test the scripts locally before pushing:

```bash
# From soulfra.github.io directory
cd scripts

# Run domain scraper
python3 github_domain_scraper.py

# Run breadcrumb router (requires domain-stats.json)
python3 breadcrumb_router.py

# Run OSS leaderboard
python3 oss_leaderboard.py

# Check generated files
cd ..
ls -lh domain-stats.json breadcrumb-map.json global-leaderboard.json
ls -lh calriven/*.json cringeproof/*.json deathtodata/*.json soulfra/*.json
```

## Monitoring

### View Latest Stats

```bash
# Check domain rankings
cat domain-stats.json | jq '.domains[] | {domain, priority: .allocation_priority, allocation: .allocation_percent, score: .activity_score}'

# Check breadcrumb routes
cat breadcrumb-map.json | jq '.breadcrumbs.calriven.breadcrumb_links[] | {domain, cta}'

# Check global leaderboard
cat global-leaderboard.json | jq '.contributors[:5] | .[] | {username, score, tier}'
```

### View Workflow Logs

1. Go to repo on GitHub
2. Click **Actions** tab
3. Click on a workflow run
4. Click on **"update-stats"** job
5. Expand steps to view logs

## Troubleshooting

### Workflow Not Running

- Check **Actions** tab is enabled in repo settings
- Verify cron syntax in `.github/workflows/update-domain-stats.yml`
- Check if workflow file is on `main` branch

### API Rate Limits

- Without GITHUB_TOKEN: 60 requests/hour
- With GITHUB_TOKEN: 5000 requests/hour
- Set `GITHUB_TOKEN` env var for local testing

### Commit Errors

- If "nothing to commit", workflow skips push step
- If "permission denied", check repo permissions
- If "branch protected", allow Actions to push in branch protection rules

## Next Steps

1. **Create the 8 GitHub repos** (calriven-content, calriven-data, etc.)
2. **Add initial content** to repos (README, lore, data files)
3. **Invite contributors** to repos
4. **Watch stats update** hourly as activity grows
5. **Display stats on frontpage** (already implemented in index.html)

## Summary

GitHub Actions now automatically:
- ✅ Scrapes GitHub stats every hour
- ✅ Ranks domains by activity
- ✅ Generates breadcrumb routes
- ✅ Builds OSS contributor leaderboards
- ✅ Commits changes back to repo
- ✅ Updates static site with fresh data

**The resource allocation game is now fully automated!** 🎮
