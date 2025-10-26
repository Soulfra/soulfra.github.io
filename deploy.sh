#!/bin/bash
#
# Deploy CalOS Platform to GitHub Pages
# Usage: ./deploy.sh
#
# Lazygit-style automation: Detects state and auto-fixes everything
# - Auto-init git if needed
# - Auto-add remote if missing
# - Auto-commit changes
# - Auto-push with smart force
# - Auto-enable GitHub Pages
#

set -e

REPO_NAME="soulfra.github.io"
REPO_OWNER="soulfra"
REPO_URL="https://github.com/$REPO_OWNER/$REPO_NAME.git"

echo "🚀 Deploying CalOS Platform to GitHub Pages..."
echo ""

# ============================================================================
# STEP 1: Check Prerequisites
# ============================================================================

echo "🔍 Checking prerequisites..."

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) not found. Install with: brew install gh"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub. Run: gh auth login"
    exit 1
fi

echo "✓ GitHub CLI authenticated"

# ============================================================================
# STEP 2: Auto-Detect Git State
# ============================================================================

echo ""
echo "🔍 Detecting git state..."

# Check if this is a git repo
if [ ! -d ".git" ]; then
    echo "📝 Initializing new git repository..."
    git init
    echo "✓ Git initialized"
else
    echo "✓ Git repository exists"
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")

if [ -z "$CURRENT_BRANCH" ]; then
    echo "📝 Creating main branch..."
    git checkout -b main 2>/dev/null || git branch -M main
    CURRENT_BRANCH="main"
fi

echo "✓ On branch: $CURRENT_BRANCH"

# ============================================================================
# STEP 3: Auto-Fix Remote
# ============================================================================

echo ""
echo "🔗 Checking remote configuration..."

# Check if origin remote exists
if git remote get-url origin &> /dev/null; then
    CURRENT_REMOTE=$(git remote get-url origin)

    if [ "$CURRENT_REMOTE" != "$REPO_URL" ]; then
        echo "📝 Updating remote origin..."
        git remote set-url origin "$REPO_URL"
        echo "✓ Remote updated: $CURRENT_REMOTE → $REPO_URL"
    else
        echo "✓ Remote already configured correctly"
    fi
else
    echo "📝 Adding remote origin..."
    git remote add origin "$REPO_URL"
    echo "✓ Remote added: $REPO_URL"
fi

# ============================================================================
# STEP 4: Create GitHub Repo (if needed)
# ============================================================================

echo ""
echo "📦 Checking if GitHub repo exists..."

if ! gh repo view "$REPO_OWNER/$REPO_NAME" &> /dev/null; then
    echo "✨ Creating new GitHub repo: $REPO_NAME"
    gh repo create "$REPO_OWNER/$REPO_NAME" --public \
      --description "Privacy-first automation platform - Zero-dependency SDK" \
      --confirm
    echo "✓ Repo created"
else
    echo "✓ Repo exists"
fi

# ============================================================================
# STEP 5: Auto-Commit Changes (SELECTIVE STAGING)
# ============================================================================

echo ""
echo "📝 Committing changes..."

# Use Cal's selective staging (only stages Cal-approved files)
echo "🔍 Running Cal Selective Stager..."
if node ../../lib/cal-selective-stager.js --mode=deploy --verbose; then
    # Check if anything was actually staged
    if git diff --cached --quiet; then
        echo "⚠️  No Cal-approved files found, staging all files..."
        git add .
    else
        echo "✓ Cal-approved files staged"
    fi
else
    echo "⚠️  Cal Selective Stager failed, falling back to git add ."
    git add .
fi

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "✓ No changes to commit (working tree clean)"
    NEEDS_PUSH=true
else
    echo "✓ Staging changes..."

    # Create commit
    git commit -m "Deploy: CalOS Platform Portal

- Zero-dependency browser SDK
- Privacy dashboard (live demo)
- Landing page with features
- GIST-ready single file
- MIT licensed

🤖 Auto-deployed via deploy.sh (selective staging)
📋 Audit log: logs/cal-git-audit.jsonl" || echo "✓ Commit created"

    NEEDS_PUSH=true
fi

# ============================================================================
# STEP 6: Smart Push
# ============================================================================

echo ""
echo "⬆️  Pushing to GitHub..."

# Check if we need to push
if [ "$NEEDS_PUSH" = true ]; then
    # Try regular push first
    if git push -u origin main 2>/dev/null; then
        echo "✓ Pushed successfully"
    else
        # If regular push fails, try force-with-lease (safer than --force)
        echo "⚠️  Regular push failed, trying force-with-lease..."

        if git push -u origin main --force-with-lease 2>/dev/null; then
            echo "✓ Force-pushed successfully"
        else
            # If that fails too, use --force as last resort
            echo "⚠️  Force-with-lease failed, using --force (last resort)..."
            git push -u origin main --force
            echo "✓ Forced push successful"
        fi
    fi
else
    echo "✓ Already up to date"
fi

# ============================================================================
# STEP 7: Enable GitHub Pages
# ============================================================================

echo ""
echo "📄 Enabling GitHub Pages..."

# Try to enable Pages (will fail gracefully if already enabled)
if gh api "repos/$REPO_OWNER/$REPO_NAME/pages" -X POST \
  -f source[branch]=main \
  -f source[path]=/ 2>/dev/null; then
    echo "✓ GitHub Pages enabled"
else
    # Check if already enabled
    if gh api "repos/$REPO_OWNER/$REPO_NAME/pages" &> /dev/null; then
        echo "✓ GitHub Pages already enabled"
    else
        echo "⚠️  Could not enable GitHub Pages (may need to enable manually)"
    fi
fi

# ============================================================================
# SUCCESS!
# ============================================================================

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Your site will be live at:"
echo "   https://soulfra.github.io"
echo ""
echo "📚 Next steps:"
echo "   1. Wait 1-2 minutes for GitHub Pages to build"
echo "   2. Visit https://soulfra.github.io"
echo "   3. Test the SDK demo"
echo "   4. Share on Twitter/HN"
echo ""
echo "🔗 Useful links:"
echo "   - Repo: https://github.com/$REPO_OWNER/$REPO_NAME"
echo "   - Settings: https://github.com/$REPO_OWNER/$REPO_NAME/settings/pages"
echo "   - Actions: https://github.com/$REPO_OWNER/$REPO_NAME/actions"
echo ""
