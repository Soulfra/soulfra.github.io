# Verify Server vs Browser (curl vs browser)

**Your question:** "i know you're suppose to be able to curl -s the localhost and it should give you it all but how can you scrape the json and html from there"

**Answer:** You're not "scraping" - you're **verifying what the server actually returns** vs what your browser shows (which might be cached).

---

## The Problem You Were Having

### What Server Returns (Fresh)
```bash
curl -s http://localhost:5051/search.html | grep "voiceBtn"
# Result: <button class="voice-btn" id="voiceBtn" ...>
```
✅ Server HAS the voice button

### What Browser Shows (Cached)
```
Open: http://localhost:5051/search.html
View source: No voiceBtn found
```
❌ Browser shows OLD version (service worker cached it)

**This is how you diagnose cache issues!**

---

## Method 1: curl (Bypasses ALL Cache)

### Basic Usage

```bash
# Get entire HTML file
curl -s http://localhost:5051/search.html

# Search for specific element
curl -s http://localhost:5051/search.html | grep "voiceBtn"

# Count how many times it appears
curl -s http://localhost:5051/search.html | grep -c "voiceBtn"
```

### Check Voice Button

```bash
curl -s http://localhost:5051/search.html | grep -o '<button[^>]*id="voiceBtn"[^>]*>'
```

**Expected output:**
```html
<button class="voice-btn" id="voiceBtn" title="Voice search (speak your query)">
```

**If you see it:** ✅ Server has voice button
**If you don't:** ❌ File wasn't saved or backend not serving it

### Check JavaScript Files

```bash
# Check if voice-search.js is loaded
curl -s http://localhost:5051/search.html | grep "voice-search.js"

# Get the actual voice-search.js file
curl -s http://localhost:5051/voice-search.js | head -20
```

### Check API Responses

```bash
# Get search results (JSON)
curl -s "http://localhost:5051/api/search?q=privacy"

# Pretty print JSON
curl -s "http://localhost:5051/api/search?q=privacy" | python3 -m json.tool

# Test voice search endpoint
curl -X POST http://localhost:5051/api/voice-search \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "test",
    "ambientScore": 0.85,
    "fingerprint": {"spectrum": [1,2,3]}
  }'
```

---

## Method 2: Browser View Source (May Be Cached)

### View Source

```
Mac: Cmd + Option + U
Windows: Ctrl + U
```

**Shows:** What the browser THINKS it has (might be cached)

### View in DevTools

```
F12 → Network tab → search.html → Preview
```

**Shows:** Actual response from server (if "Disable cache" is checked)

---

## Method 3: DevTools Network Tab

### Setup

1. **Open DevTools:** F12
2. **Network tab**
3. **Check "Disable cache"**
4. **Reload page**

### What to Look For

```
Name: search.html
Status: 200 OK
Type: document
Size: 25.3 KB
Time: 5ms
```

**Click on search.html → Response tab**

Search for "voiceBtn" in the response.

**If you see it:** Server returned new version
**If you don't:** Server is still serving old version

### Headers to Check

```
Request Headers:
  Cache-Control: no-cache (good)

Response Headers:
  Cache-Control: no-store, no-cache, must-revalidate (good)
  ETag: "abc123" (changes when file changes)
```

---

## Method 4: Incognito/Private Mode

### Why It Works

- No cache
- No cookies
- No extensions
- No service workers
- Fresh browser state

### How to Use

```
Mac: Cmd + Shift + N (Chrome) or Cmd + Shift + P (Firefox)
Windows: Ctrl + Shift + N (Chrome) or Ctrl + Shift + P (Firefox)
```

Open: http://localhost:5051/search.html

**If voice button shows:** Cache was the issue
**If it still doesn't show:** Server doesn't have it

---

## Your "Scraping" Question Explained

### What You Actually Meant

You wanted to know:
1. **How to verify server output** (curl)
2. **How to extract specific elements** (grep)
3. **How to compare server vs browser** (debugging cache)

**This isn't web scraping!** It's **debugging/verification**.

### Real Web Scraping (Different Thing)

```bash
# Scraping = Extracting data from external websites
curl -s https://example.com | grep -o '<h1>.*</h1>'

# Your use case = Verifying your own server
curl -s http://localhost:5051/search.html | grep "voiceBtn"
```

**You own the server!** You're just checking what it's serving.

---

## Common Commands

### Get Full HTML

```bash
curl -s http://localhost:5051/search.html
```

### Search for Specific Text

```bash
curl -s http://localhost:5051/search.html | grep "voiceBtn"
```

### Extract Specific Element

```bash
# Get just the button element
curl -s http://localhost:5051/search.html | grep -o '<button[^>]*voiceBtn[^>]*>.*</button>'
```

### Count Occurrences

```bash
# How many times does "voiceBtn" appear?
curl -s http://localhost:5051/search.html | grep -c "voiceBtn"
```

### Save Output to File

```bash
curl -s http://localhost:5051/search.html > /tmp/search-output.html
cat /tmp/search-output.html | grep "voiceBtn"
```

### Compare Two Versions

```bash
# Save current version
curl -s http://localhost:5051/search.html > /tmp/version-new.html

# Make changes to code
# ...

# Restart server
# ...

# Get updated version
curl -s http://localhost:5051/search.html > /tmp/version-updated.html

# Compare
diff /tmp/version-new.html /tmp/version-updated.html
```

---

## Debugging Workflow

### Step 1: Check Server

```bash
curl -s http://localhost:5051/search.html | grep "voiceBtn"
```

**Has it?**
- ✅ YES → Server has new code
- ❌ NO → Server doesn't have new code (file not saved, backend not restarted)

### Step 2: Check Browser

Open: http://localhost:5051/search.html

**See voice button?**
- ✅ YES → All good!
- ❌ NO → Browser cache issue

### Step 3: Clear Browser Cache

```
Hard refresh: Cmd+Shift+R
OR
Incognito mode
OR
DevTools → "Disable cache"
```

### Step 4: Still Not Working?

**Check browser console for errors:**
```
F12 → Console tab
Look for:
- Failed to load voice-search.js
- VoiceSearch is not defined
- JavaScript errors
```

**Check DevTools Network tab:**
```
F12 → Network tab → Reload
Look for:
- search.html: 200 OK (good) or 304 Not Modified (cached)
- voice-search.js: 200 OK or 404 Not Found (bad)
```

---

## Real-World Use Cases

### 1. Verify Deployment

```bash
# After deploying to production
curl -s https://soulfra.github.io/deathtodata/search.html | grep "voiceBtn"

# If you see it: Deployment successful
# If not: GitHub Pages hasn't deployed yet (wait 1-2 minutes)
```

### 2. Test API Endpoints

```bash
# Test search API
curl -s "http://localhost:5051/api/search?q=test" | python3 -m json.tool

# Test voice search API
curl -X POST http://localhost:5051/api/voice-search \
  -H "Content-Type: application/json" \
  -d '{"transcript":"test","ambientScore":0.9,"fingerprint":{}}'
```

### 3. Monitor Server Health

```bash
# Check if server is running
curl -s http://localhost:5051/ > /dev/null && echo "Server is up" || echo "Server is down"

# Check response time
time curl -s http://localhost:5051/search.html > /dev/null
```

### 4. Extract Data for Testing

```bash
# Get all script tags
curl -s http://localhost:5051/search.html | grep -o '<script[^>]*>'

# Get all links
curl -s http://localhost:5051/search.html | grep -o 'href="[^"]*"'

# Get page title
curl -s http://localhost:5051/search.html | grep -o '<title>.*</title>'
```

---

## Your Actual Workflow

### Local Development

```bash
# 1. Make changes to code
# Edit search.html, add voice button

# 2. Verify server has changes
curl -s http://localhost:5051/search.html | grep "voiceBtn"

# 3. Open in browser
# http://localhost:5051/search.html

# 4. If you don't see changes
# Hard refresh: Cmd+Shift+R
```

### Deploy to Production

```bash
# 1. Commit changes
git add .
git commit -m "Add voice search"
git push origin main

# 2. Wait for GitHub Pages deploy (~1-2 minutes)

# 3. Verify production
curl -s https://soulfra.github.io/deathtodata/search.html | grep "voiceBtn"

# 4. Open in browser
# https://soulfra.github.io/deathtodata/search.html
# Hard refresh: Cmd+Shift+R
```

---

## Summary

**curl vs Browser:**

| Tool | Purpose | Cache | Use Case |
|------|---------|-------|----------|
| curl | See server output | NO cache | Verify server has changes |
| Browser | User experience | Has cache | Test real user experience |
| Incognito | Fresh browser | NO cache | Test without cache |
| DevTools | Debug | Can disable | Development debugging |

**Your question "how can you scrape the json and html":**
- You're not scraping (that's for external sites)
- You're **verifying your own server's output**
- curl = See what server returns
- Browser = See what user sees (might be cached)
- Difference = Cache issue

**Workflow:**
1. Make code changes
2. `curl` to verify server has them
3. Open browser to test
4. If different → cache issue
5. Hard refresh or disable cache
6. Deploy to production
7. `curl` production URL to verify
