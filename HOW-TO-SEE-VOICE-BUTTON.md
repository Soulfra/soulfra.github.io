# How to See the Voice Search Button 🎤

**Problem:** You can't see the microphone button even though it's in the code.

**Cause:** Browser cache is showing you an old version of the page.

---

## Solution 1: Hard Refresh (Fastest)

### Mac
```
Cmd + Shift + R
```

### Windows/Linux
```
Ctrl + Shift + R
```

**This forces the browser to reload everything from the server, ignoring cache.**

---

## Solution 2: Empty Cache and Hard Reload

1. **Open the page** in your browser
2. **Right-click the refresh button** (⟳ next to URL bar)
3. **Select:** "Empty Cache and Hard Reload"

---

## Solution 3: Disable Cache (Permanent Fix for Development)

1. **Open DevTools**
   - Mac: `Cmd + Option + I`
   - Windows: `F12` or `Ctrl + Shift + I`

2. **Go to Network tab**

3. **Check the box:** "Disable cache"

4. **Keep DevTools open** while developing

**This prevents all caching while DevTools is open.**

---

## Solution 4: Clear Browser Cache Completely

### Chrome
1. Go to: `chrome://settings/clearBrowserData`
2. Select: "Cached images and files"
3. Click: "Clear data"

### Firefox
1. Go to: `about:preferences#privacy`
2. Click: "Clear Data"
3. Select: "Cached Web Content"
4. Click: "Clear"

### Safari
1. Safari menu → Preferences → Advanced
2. Check: "Show Develop menu in menu bar"
3. Develop menu → Empty Caches
4. Or: `Cmd + Option + E`

---

## After Clearing Cache

**Reload the page:** http://localhost:5051/search.html

**You should now see:**

```
┌────────────────────────────────────────────────────────┐
│  [Search input box...]             🎤  [SEARCH]        │
│                                    ^                    │
│                                    │                    │
│                              This button!               │
└────────────────────────────────────────────────────────┘
```

**The 🎤 button will be:**
- Pink/red themed (matches DeathToData style)
- Positioned between search box and SEARCH button
- Shows tooltip: "Voice search (speak your query)"

---

## How to Test It Works

1. **Click the 🎤 button**
   - Browser asks for microphone permission
   - Click "Allow"

2. **Button changes to ⏹️**
   - Starts pulsing (recording animation)
   - Status text: "Recording... speak your search query"

3. **Speak clearly:**
   - "privacy tools"
   - "secure search engines"
   - "how to protect privacy"

4. **Click ⏹️ to stop**
   - Processing begins
   - Ambient audio analyzed
   - Transcript extracted

5. **Check result:**
   - **If ambient score >= 0.7:** Search executes ✅
   - **If ambient score < 0.7:** Alert shows "Anti-bot check failed!" ❌

---

## Troubleshooting

### Still don't see the button?

**Check browser console:**
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors

**Common errors:**
```javascript
// Error: Failed to load voice-search.js
// Solution: Check file exists in deathtodata/ folder

// Error: Uncaught ReferenceError: VoiceSearch is not defined
// Solution: Script loading order is wrong
```

**Verify file exists:**
```bash
ls -la deathtodata/voice-search.js
```

**Should see:**
```
-rw-r--r--  1 user  staff  8379 Jan 19 16:53 deathtodata/voice-search.js
```

### Button shows but nothing happens when clicked?

**Check console for errors:**
- `NotAllowedError`: You denied microphone permission
  - Fix: Click lock icon in URL bar → Allow microphone

- `NotFoundError`: No microphone detected
  - Fix: Connect a microphone

- `NotSupportedError`: Browser doesn't support Web Speech API
  - Fix: Use Chrome (best support) or update browser

### Microphone permission keeps asking?

**Browser security:**
- Localhost is treated as insecure context
- Permission won't persist between sessions
- This is normal for development

**To fix (production):**
- Use HTTPS (required for persistent permissions)
- Deploy with SSL certificate
- Or use localtunnel/ngrok for HTTPS localhost

---

## What You Should See (Step by Step)

### 1. Before clicking 🎤
```
Status: Ready
Button: 🎤 (pink, not pulsing)
Search box: Empty or has query
```

### 2. After clicking 🎤
```
Browser popup: "localhost:5051 wants to use your microphone"
Click: Allow
Status: Recording... speak your search query
Button: ⏹️ (red, pulsing animation)
```

### 3. While recording
```
Voice Search class working:
- Capturing audio from microphone
- Sampling ambient audio every 100ms
- Building frequency spectrum
- Recording WebM blob
```

### 4. After clicking ⏹️
```
Status: Processing voice...
Actions:
- Stop recording
- Analyze ambient (FFT, entropy, room tone)
- Calculate score (0.0 - 1.0)
- Transcribe speech
- Check threshold (>= 0.7)
```

### 5. If human (score >= 0.7)
```
Status: Searching...
Actions:
- Sign transcript + fingerprint (if authenticated)
- POST /api/voice-search
- Execute search with transcript
- Show results
Notification: "+0.3 VIBES - Verified human (85% score)"
```

### 6. If bot (score < 0.7)
```
Alert: "Anti-bot check failed!
        Ambient score: 0.45

        You might be in too quiet environment,
        or using synthetic voice.

        Try speaking in a normal room with
        some background noise."
```

---

## Cache Busting Added

I added version parameters to script tags:

```html
<script src="soulfra-universal-auth.js?v=2"></script>
<script src="voice-search.js?v=2"></script>
<script src="assets/deathtodata.js?v=2"></script>
```

**This forces browsers to treat these as new files.**

Next time cache is an issue, I can just increment the version:
- `?v=2` → `?v=3` → `?v=4` etc.

---

## Summary

**Just do this:**
```
1. Press Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. Look for 🎤 button next to search box
3. Click it and allow microphone
4. Speak your query
5. Click ⏹️ to stop
6. Watch the magic happen
```

**That's it!** The button is already there, your browser just needs to reload the page.
