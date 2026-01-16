# Ollama Internet Testing Guide

## Problem Solved

You were frustrated because:
- **localhost:8000/deathtodata** looked great
- **soulfra.com/deathtodata** looked like shit
- You couldn't figure out why they were different
- Neither you nor I could easily test what's actually deployed

## The Solution: LLM Router

I built an API that lets Ollama fetch and test internet URLs.

**LLM Router is running on:** `http://localhost:5052`

## How Ollama Can Use It

### 1. Test Any URL

```bash
curl -X POST http://localhost:5052/llm/test \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://soulfra.com/deathtodata/search.html",
    "tests": ["all"]
  }'
```

**What you get back:**
```json
{
  "url": "https://soulfra.com/deathtodata/search.html",
  "timestamp": "2026-01-16T15:54:21.842Z",
  "html_length": 10121,
  "html_preview": "<!DOCTYPE html>\n<html lang=\"en\">...",
  "tests": {
    "basic": {
      "has_html": true,
      "has_head": true,
      "has_body": true,
      "url_accessible": true,
      "size_kb": "9.88"
    },
    "search": {
      "has_search_input": true,
      "has_search_button": true,
      "has_results_container": true,
      "has_api_call": true,
      "api_url_found": "https://api.deathtodata.com"
    },
    "ui": {
      "has_nav": true,
      "has_search_box": true,
      "has_privacy_note": true,
      "script_count": 1,
      "style_count": 1
    }
  }
}
```

### 2. Compare Local vs Deployed

```bash
curl -X POST http://localhost:5052/llm/compare \
  -H "Content-Type: application/json" \
  -d '{
    "local": "http://localhost:8000/deathtodata/search.html",
    "deployed": "https://soulfra.com/deathtodata/search.html"
  }'
```

**What you get back:**
```json
{
  "local_size": 10119,
  "deployed_size": 10121,
  "size_match": false,
  "content_match": false,
  "differences": [
    {
      "type": "api_url",
      "local": "http://localhost:5051",
      "deployed": "https://api.deathtodata.com"
    }
  ]
}
```

### 3. Health Check

```bash
curl http://localhost:5052/llm/health
```

## Available Tests

Use the `tests` parameter to control what gets tested:

- **`"basic"`** - Page structure (HTML, head, body, title)
- **`"search_results"`** - Search functionality (input box, results, API calls)
- **`"api_connection"`** - API configuration (localhost vs production URLs)
- **`"ui_elements"`** - UI components (nav, header, footer, scripts)
- **`"all"`** - Run everything

## Example: Full Workflow

**Ollama can now do this autonomously:**

1. **Fetch what's deployed:**
   ```bash
   curl -X POST http://localhost:5052/llm/test \
     -H "Content-Type: application/json" \
     -d '{"url":"https://soulfra.com/deathtodata/search.html","tests":["all"]}'
   ```

2. **Compare to local:**
   ```bash
   curl -X POST http://localhost:5052/llm/compare \
     -H "Content-Type: application/json" \
     -d '{"local":"http://localhost:8000/deathtodata/search.html","deployed":"https://soulfra.com/deathtodata/search.html"}'
   ```

3. **Report findings:**
   - If sizes match: "Deployment is synced ✅"
   - If sizes differ: "Deployed is out of date, differences: [list]"
   - If 404: "Not deployed yet, need to push to GitHub"

## What Was Fixed

**The Issue:**
- DeathToData wasn't in `_config.yml` include list
- GitHub Pages was ignoring the directory
- Result: 404 on search.html

**The Fix:**
- Added `deathtodata` to `_config.yml` (commit 3768401)
- Pushed to GitHub
- GitHub Pages will rebuild in 1-3 minutes

## Current Status

✅ **Local (localhost:8000):**
- Frontend: Working perfectly
- Backend: http://localhost:5051 (DuckDuckGo + Ollama)
- Search: Functional with AI filtering

🔄 **Deployed (soulfra.com):**
- Frontend: Rebuilding now (GitHub Pages processing commit 3768401)
- Backend: NOT exposed yet (need ngrok/cloudflared)
- Search: Will work once backend is exposed

🤖 **LLM Router (localhost:5052):**
- Status: Running ✅
- Purpose: Let Ollama test the internet
- Endpoints: /llm/test, /llm/compare, /llm/health

## Next Steps for Full Deployment

To make the search engine actually work on soulfra.com:

### Option 1: Quick Test with ngrok
```bash
ngrok http 5051
# Get URL like: https://abc123.ngrok-free.app
# Update deathtodata/search.html API_URL to that URL
# Commit and push
```

### Option 2: Permanent with Cloudflare Tunnel
```bash
cloudflared tunnel --url http://localhost:5051
# Or create persistent tunnel:
cloudflared tunnel create deathtodata-api
cloudflared tunnel route dns deathtodata-api api.deathtodata.com
cloudflared tunnel run deathtodata-api
```

## Why This Matters

Before:
- You: "Is it live?"
- Me: "I can't check URLs"
- You: "WTF it looks different!"
- Frustration loop

After:
- Ollama: "Let me check..."
- *Calls LLM Router*
- Ollama: "Deployed version is missing search.html, GitHub Pages config issue"
- Problem identified in 2 seconds

**You now have the internet OCR/context tool you asked for.**

## How to Keep LLM Router Running

The router is currently running in the background. To restart:

```bash
# Check if running
lsof -ti:5052

# Kill if needed
lsof -ti:5052 | xargs kill -9

# Start fresh
node api/llm-router.js &
```

Or add to your startup scripts so Ollama always has it available.
