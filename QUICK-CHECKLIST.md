# Quick Checklist (Is Everything Working?)

Run through these checks in order. Takes 3 minutes total.

---

## ✅ Check 1: Backend Running

```bash
curl -s http://localhost:5051/api/search?q=test | head -5
```

**Expected:** JSON response starting with `{"query":"test"`

**If you see it:** Backend is running ✅

**If you don't:**
```bash
# Start backend
node api/deathtodata-backend.js

# Should see:
# ✅ Search engine initialized
# 🚀 DeathToData API running on http://localhost:5051
```

---

## ✅ Check 2: Auth Script Accessible

```bash
curl -s http://localhost:5051/soulfra-universal-auth.js | head -3
```

**Expected:**
```
/**
 * Soulfra Universal Auth System
 *
```

**If you see it:** Auth script is being served ✅

**If you don't:** File missing from deathtodata/ directory

---

## ✅ Check 3: Database Has Data

```bash
sqlite3 deathtodata.db "SELECT COUNT(*) FROM analytics_events;"
```

**Expected:** Number > 0 (like `55`)

**If you see it:** Database has data ✅

**If you see 0:** Database is empty (search a few times to populate)

---

## ✅ Check 4: Public Key Column Exists

```bash
sqlite3 deathtodata.db "PRAGMA table_info(users);" | grep public_key
```

**Expected:** `6|public_key|TEXT|0||0`

**If you see it:** Database schema updated ✅

**If you don't:** Column not added (shouldn't happen, but run: `sqlite3 deathtodata.db "ALTER TABLE users ADD COLUMN public_key TEXT;"`)

---

## ✅ Check 5: Frontend Has Auth Button

```bash
curl -s http://localhost:5051/search.html | grep -o "authBtn"
```

**Expected:** `authBtn` (appears 3-4 times)

**If you see it:** HTML has auth button ✅

**If you don't:** File not updated (shouldn't happen, check deathtodata/search.html)

---

## ✅ Check 6: Browser Shows Auth Button

1. Open http://localhost:5051/search.html
2. Press **Cmd+Shift+R** (hard refresh)
3. Look at top-right header

**Expected:** Button that says "🔐 Authenticate"

**If you see it:** Browser loaded fresh HTML ✅

**If you don't:**
- Try "Empty Cache and Hard Reload"
- Or use incognito window
- See `FIX-BROWSER-CACHE.md`

---

## ✅ Check 7: Auth Script Loads in Browser

1. Open http://localhost:5051/search.html
2. Press Cmd+Option+I (open DevTools)
3. Go to Console tab

**Expected:**
```
[SoulfraAuth] Module loaded
[SoulfraAuth] Initialized
```

**If you see it:** Auth script loaded ✅

**If you don't:**
- Check Network tab for soulfra-universal-auth.js
- Should be 200 OK, not 404

---

## ✅ Check 8: Auth Button Clickable

1. Click "🔐 Authenticate" button
2. Wait 1-2 seconds

**Expected:** Popup saying:
```
✅ Authenticated!

Your User ID: 302a300506032b6570

This works across all Soulfra sites.

Your keys are stored locally and never sent to the server.
```

**If you see it:** Key generation working ✅

**If you don't:**
- Check console for errors
- Look for red error messages

---

## ✅ Check 9: User ID Appears

After clicking auth button:

**Expected:** Button changes to "🔐 302a300506032b6570"
(Your User ID will be different)

**If you see it:** Auth state persisted ✅

**If you don't:** Check localStorage in DevTools → Application tab

---

## ✅ Check 10: Auth Persists on Reload

1. Reload page (Cmd+R)
2. Look at auth button

**Expected:** Still shows your User ID (not "Authenticate")

**If you see it:** localStorage working ✅

**If you don't:** localStorage not persisting (check browser settings)

---

## ✅ Check 11: Backend Registered User

```bash
sqlite3 deathtodata.db "SELECT id, substr(public_key, 1, 20), created_at FROM users;"
```

**Expected:**
```
1|302a300506032b657003|2026-01-19 15:30:00
```

**If you see it:** Backend registration working ✅

**If you don't:**
- Check backend logs: `tail /tmp/deathtodata-backend.log`
- Look for "[Auth] New user registered"

---

## ✅ Check 12: Cross-Page Auth

1. Visit http://localhost:5051/knowledge.html
2. Look at auth button

**Expected:** Shows same User ID as search.html

**If you see it:** Cross-page auth working ✅

**If you don't:** localStorage not shared (shouldn't happen on same domain)

---

## ✅ Check 13: Search Still Works

1. Go to http://localhost:5051/search.html
2. Search for "privacy tools"
3. Click "SEARCH"

**Expected:** See search results (DuckDuckGo results)

**If you see it:** Search engine working ✅

**If you don't:**
- Check Network tab for /api/search call
- Check backend logs for errors

---

## ✅ Check 14: Ollama Analysis Works

1. After searching, click "Ask Ollama to Explain"
2. Wait 5-10 seconds

**Expected:** AI analysis appears below results

**If you see it:** Ollama integration working ✅

**If you don't:**
- Check if Ollama is running: `curl http://localhost:11434`
- Start Ollama: `ollama serve`

---

## ✅ Check 15: Knowledge Base Displays

1. Go to http://localhost:5051/knowledge.html
2. Look for "Total Learnings" stat

**Expected:** Number matches database count (like "3")

**If you see it:** Knowledge base working ✅

**If you don't:**
- Check Network tab for /api/knowledge call
- Check backend logs

---

## Score Your Results

### 15/15 ✅ Perfect

**Everything working!**

You can:
- Search and get results
- Authenticate with crypto keys
- Get Ollama analyses
- View knowledge base
- Auth works across pages

**Next:** Deploy to production VPS

---

### 12-14/15 ⚠️ Almost There

**Most things working, minor issues.**

Common issues:
- Ollama not running (start: `ollama serve`)
- Browser cache (hard refresh)
- Backend not running (start: `node api/deathtodata-backend.js`)

**Fix the failing checks, then re-run.**

---

### 8-11/15 ❌ Some Issues

**Core working, but auth or features broken.**

Focus on:
- Backend running?
- Database updated?
- Browser cache cleared?

**Read:** `FIX-BROWSER-CACHE.md`, `DATA-FLOW-EXPLAINED.md`

---

### 0-7/15 ❌ Major Issues

**System not working.**

Start over:
1. Kill backend: `lsof -ti:5051 | xargs kill -9`
2. Start backend: `node api/deathtodata-backend.js`
3. Hard refresh browser: Cmd+Shift+R
4. Re-run checklist

**If still failing:** Check system requirements:
- Node.js installed?
- SQLite installed?
- Ollama installed?

---

## Quick Status Check (1 command)

```bash
echo "=== Backend ===" && \
curl -s http://localhost:5051/api/search?q=test > /dev/null && echo "✅ Running" || echo "❌ Not running" && \
echo "" && \
echo "=== Database ===" && \
sqlite3 deathtodata.db "SELECT COUNT(*) as searches FROM analytics_events WHERE event_type='search';" && \
echo "" && \
echo "=== Auth Script ===" && \
ls -lh deathtodata/soulfra-universal-auth.js 2>/dev/null || echo "❌ Not found"
```

**Expected output:**
```
=== Backend ===
✅ Running

=== Database ===
55

=== Auth Script ===
-rw-r--r--  1 you  staff   10K Jan 19 15:30 deathtodata/soulfra-universal-auth.js
```

---

## Common Issues & Fixes

### Issue: "No auth button visible"

**Fix:** Hard refresh (Cmd+Shift+R) or read `FIX-BROWSER-CACHE.md`

---

### Issue: "Auth button does nothing when clicked"

**Fix:**
1. Check console for errors
2. Verify soulfra-universal-auth.js loaded (Network tab)
3. Hard refresh

---

### Issue: "Backend registration error"

**Fix:** Check backend logs:
```bash
tail -20 /tmp/deathtodata-backend.log
```

Look for "[Auth] Registration error"

---

### Issue: "Search returns no results"

**Fix:**
1. Check DuckDuckGo API is accessible: `curl https://api.duckduckgo.com/?q=test&format=json`
2. Check backend logs for search errors
3. Try different query

---

### Issue: "Ollama analysis fails"

**Fix:**
1. Check if Ollama running: `curl http://localhost:11434`
2. Start Ollama: `ollama serve`
3. Pull model: `ollama pull llama2`

---

### Issue: "Knowledge base empty"

**Fix:**
1. Search for something
2. Click "Ask Ollama to Explain"
3. Wait for analysis to save
4. Refresh knowledge.html

---

## Summary

**Run through all 15 checks** → Note which fail → Fix those → Re-run

**Most common issue:** Browser cache (hard refresh fixes it)

**Second most common:** Ollama not running (start with `ollama serve`)

**Everything else:** Backend logs will show the issue (`tail /tmp/deathtodata-backend.log`)

**Target:** 15/15 ✅ all checks passing

**Then:** You're ready to deploy or build new features
