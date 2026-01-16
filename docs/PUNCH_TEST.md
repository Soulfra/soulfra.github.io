# 🔨 Punch Test Guide

**"Like Mario ? Blocks - Punch It, Get a Result"**

Every system needs a simple mechanical test to prove it works. This guide shows you how to punch test each tier of the Soulfra ecosystem.

---

## 🧪 Sandbox Environment
**URL**: `http://localhost:8000/sandbox/test.html`

### Punch Test #1: Story Compiler
**Action**: Click "📖 Test Story Compiler" button

**Expected Result**:
```
✅ Story compiled: story-[timestamp]-[hash]
   Panels: 8
   Format: comic-strip
```

**Pass Criteria**:
- Story ID appears in console
- Panel count shows 8 panels
- Preview displays all panels with content
- No JavaScript errors in browser console

**Fail Indicators**:
- ❌ "undefined is not a function" errors
- ❌ Empty preview panel
- ❌ Panel count = 0

---

### Punch Test #2: Reasoning Engine (IVC)
**Action**: Click "🧠 Test Reasoning Engine" button

**Expected Result**:
- Words appear one-by-one with spacing
- Progress bar updates in real-time
- "Submit Response" button is disabled
- After reading + scrolling: button becomes enabled

**Pass Criteria**:
- ✅ Words appear with proper spacing (not smashed together)
- ✅ Animation timing is visible (~150ms per word)
- ✅ Scroll tracking works (must scroll to 95%)
- ✅ Button gates correctly (disabled → enabled)

**Fail Indicators**:
- ❌ Words have no spaces between them
- ❌ All words appear instantly
- ❌ Button never enables
- ❌ Progress bar doesn't update

---

### Punch Test #3: Session Manager
**Action**: Click "🔐 Test Session" button

**Expected Result**:
```
✅ Onboarding saved
✅ Google paired
   Session:
   - User ID: [UUID]
   - Profile: /profiles/[UUID]
   - Google: true
```

**Pass Criteria**:
- User ID is a valid UUID format
- Profile URL contains the same UUID
- Google paired status = true
- Data persists in localStorage (`soulfra_session`)

**Fail Indicators**:
- ❌ User ID is "undefined" or null
- ❌ Google paired = false after pairing
- ❌ localStorage is empty

---

### Punch Test #4: Soul Capsule
**Action**: Click "🌌 Test Soul Capsule" button

**Expected Result**:
```
✅ Soul Capsule created: soul-[timestamp]-[hash]
   Type: soul
   Pipelines: 1
```

**Pass Criteria**:
- Capsule ID starts with "soul-"
- Type = "soul"
- Contains at least 1 pipeline
- Saved to localStorage (`soul_capsules`)

**Fail Indicators**:
- ❌ Capsule ID is undefined
- ❌ Type is not "soul"
- ❌ Pipelines count = 0

---

### Punch Test #5: Cal Capsule
**Action**: Click "💼 Test Cal Capsule" button

**Expected Result**:
```
✅ Cal Capsule created: cal-[timestamp]-[hash]
   Type: cal
   Status: active
```

**Pass Criteria**:
- Capsule ID starts with "cal-"
- Type = "cal"
- Status = "active"
- Saved to localStorage (`cal_capsules`)

**Fail Indicators**:
- ❌ Capsule ID doesn't start with "cal-"
- ❌ Type is not "cal"
- ❌ Status is undefined

---

### Punch Test #6: UPC Barcode Generation
**Action**:
1. Click "📖 Test Story Compiler" first
2. Then click "📊 Generate UPC Barcode"

**Expected Result**:
```
✅ UPC Generated:
   Code: 123456789012
   Formatted: 1-23456-78901-2
```

**Pass Criteria**:
- UPC code is exactly 12 digits
- Formatted version has dashes: X-XXXXX-XXXXX-X
- Barcode displays in preview panel

**Fail Indicators**:
- ❌ "No story compiled yet" error (forgot step 1)
- ❌ UPC code is not 12 digits
- ❌ Formatted string is malformed

---

### Punch Test #7: Word Animation
**Action**: Click "✨ Word Animation" button

**Expected Result**:
- Text: "The mesh was never built. It was always here..."
- Words fade in one at a time
- Smooth animation (150ms intervals)

**Pass Criteria**:
- ✅ Each word appears separately
- ✅ Words have spacing between them
- ✅ Animation is smooth, not instant

**Fail Indicators**:
- ❌ All words appear at once
- ❌ Words overlap or have no spacing
- ❌ No animation occurs

---

## 🔧 Pipelines System
**URL**: `http://localhost:8000/pipelines/run.html`

### Punch Test #8: Run Pipeline
**Prerequisites**: Ollama running with models installed

**Action**:
1. Enter topic: "Test ZKP Concepts"
2. Select 3 models (e.g., deepseek-r1:1.5b, llama3.2, qwen2.5-coder:3b)
3. Click "Start Pipeline"

**Expected Result**:
- Stage 1 completes with output text
- Stage 2 uses Stage 1 output + domain context
- Stage 3 synthesizes everything
- "Pipeline Complete" message appears

**Pass Criteria**:
- ✅ All 3 stages execute sequentially
- ✅ Each stage shows output text
- ✅ Domain context is injected
- ✅ Final synthesis appears

**Fail Indicators**:
- ❌ Pipeline stops at Stage 1
- ❌ No output text appears
- ❌ "Ollama connection failed" error
- ❌ Domain context missing

---

## 🎤 Voice Memos System
**URL**: `http://localhost:8000/voice/record.html`

### Punch Test #9: Record Voice Memo
**Prerequisites**: Microphone access granted

**Action**:
1. Click "🎤 Start Recording"
2. Speak for 5-10 seconds
3. Click "⏹ Stop Recording"
4. Review transcript

**Expected Result**:
- Recording countdown appears
- Waveform animation shows audio input
- Transcript appears after stopping
- QR code generated for verification

**Pass Criteria**:
- ✅ Audio recording works (waveform moves)
- ✅ Transcript contains your spoken words
- ✅ QR code displays
- ✅ Verification ID saved to localStorage

**Fail Indicators**:
- ❌ "Microphone access denied"
- ❌ No waveform animation
- ❌ Transcript is empty or "(No transcript)"
- ❌ QR code missing

---

## ⭐ Reviews System
**URL**: `http://localhost:8000/reviews/form.html`

### Punch Test #10: Submit Review
**Action**:
1. Enter business name: "Soulfra Test"
2. Enter review text (50+ chars)
3. Select 5-star rating
4. Click "Submit Review"

**Expected Result**:
- Form validation passes
- Review saved to localStorage
- QR code generated
- Success message displays

**Pass Criteria**:
- ✅ Review appears in `reviews` localStorage
- ✅ QR code contains review ID
- ✅ Star rating = 5
- ✅ Timestamp is valid epoch time

**Fail Indicators**:
- ❌ "Review text too short" error
- ❌ No QR code generated
- ❌ localStorage is empty

---

## 💧 Cal Test Faucet
**URL**: `http://localhost:8000/cal/test-protocol.html`

### Punch Test #11: $1 Protocol Access
**Action**:
1. Enter email: "test@soulfra.com"
2. Click "Pay $1 with Stripe →"
3. (In localhost mode, payment auto-completes)

**Expected Result**:
```
🎉 Payment Successful!
Your access token:
CAL-[timestamp]-[hash]-[random]
```

**Pass Criteria**:
- ✅ Token starts with "CAL-"
- ✅ Token saved to localStorage (`cal_access_token`)
- ✅ Access level = "test"
- ✅ Email saved to localStorage
- ✅ "Go to Navigation" button appears

**Fail Indicators**:
- ❌ "Please enter a valid email" error
- ❌ Token is undefined
- ❌ No localStorage entry

---

## 🗺️ Master Navigation
**URL**: `http://localhost:8000/nav.html`

### Punch Test #12: Navigation Hub
**Action**: Open navigation page

**Expected Result**:
- 10 tool cards display
- Each card shows: icon, title, description, status badge, link
- Domain routing section visible
- Footer links work

**Pass Criteria**:
- ✅ All 10 tools listed:
  - Pipelines (LIVE)
  - Voice Memos (LIVE)
  - Reviews (LIVE)
  - Sandbox (BETA)
  - Cal Test Faucet (BETA)
  - Reasoning Engine (BETA)
  - Story Compiler (BETA)
  - Session Manager (LIVE)
  - Soul Capsules (LIVE)
  - Cal Capsules (LIVE)
- ✅ All links are clickable
- ✅ Domain routing shows 5 domains

**Fail Indicators**:
- ❌ Missing tool cards
- ❌ Broken links (404 errors)
- ❌ Domain routing section empty

---

## 📊 Stats & Verification

### Check localStorage Data
**Open Browser Console** (F12):

```javascript
// Check Story Compiler
localStorage.getItem('compiled_stories')

// Check Session Manager
localStorage.getItem('soulfra_session')

// Check Soul Capsules
localStorage.getItem('soul_capsules')

// Check Cal Capsules
localStorage.getItem('cal_capsules')

// Check Cal Faucet
localStorage.getItem('cal_access_token')

// Check all keys
Object.keys(localStorage)
```

**Expected**: Each test should create corresponding localStorage entries.

---

## 🔄 Full System Punch Test (Integration)

**The Grand Slam**: Test the entire flow from pipeline → capsule → story → export

### Action Sequence:
1. **Run Pipeline** (`/pipelines/run.html`)
   - Topic: "Soulfra Integration Test"
   - 3 stages complete

2. **Create Soul Capsule** (`/sandbox/test.html`)
   - Click "🌌 Test Soul Capsule"
   - Capsule created with pipeline data

3. **Compile Story** (`/sandbox/test.html`)
   - Click "💊 Capsule → Story"
   - Story generated from capsule

4. **Generate UPC** (`/sandbox/test.html`)
   - Click "📊 Generate UPC Barcode"
   - 12-digit barcode appears

5. **Export Story** (`/sandbox/test.html`)
   - Click "💾 Download HTML"
   - `.html` file downloads

6. **Preview Story** (`/sandbox/test.html`)
   - Click "👁️ Preview Story"
   - New window opens with formatted story

**Pass Criteria**:
- ✅ All 6 steps complete without errors
- ✅ Downloaded HTML file opens and displays story
- ✅ UPC barcode is visible in preview
- ✅ All panels have content

---

## 🚨 Common Errors & Fixes

### Error: "window.StoryCompiler is not a function"
**Fix**: Library didn't load. Check:
1. `/lib/story-compiler.js` exists
2. Script tag in HTML is correct
3. Browser console shows "[StoryCompiler] Module loaded"

### Error: "No story compiled yet"
**Fix**: You must run a compile test first before testing UPC/preview/download

### Error: Words have no spaces (Reasoning Engine)
**Fix**: Already fixed in `reasoning-engine.js:116-117`
- Changed from `inline-block` to `inline`
- Added `marginRight: '5px'`

### Error: Ollama connection refused
**Fix**:
1. Check Ollama is running: `ollama list`
2. Verify models installed: `ollama pull deepseek-r1:1.5b`
3. Check API running on port 11434

### Error: Microphone access denied
**Fix**:
1. Browser settings → Site permissions
2. Allow microphone for `localhost:8000`
3. Reload page and try again

---

## ✅ Punch Test Checklist

Use this to track your testing progress:

```
SANDBOX TESTS:
□ Test #1: Story Compiler
□ Test #2: Reasoning Engine
□ Test #3: Session Manager
□ Test #4: Soul Capsule
□ Test #5: Cal Capsule
□ Test #6: UPC Barcode
□ Test #7: Word Animation

SYSTEM TESTS:
□ Test #8: Run Pipeline
□ Test #9: Record Voice Memo
□ Test #10: Submit Review
□ Test #11: Cal Test Faucet
□ Test #12: Navigation Hub

INTEGRATION TEST:
□ Full System Grand Slam (6 steps)
```

---

## 🎮 Testing Philosophy

**"Punch it. Did it work? Cool."**

Each test should be:
- **Simple**: One clear action
- **Fast**: Under 30 seconds
- **Obvious**: Pass/fail is immediately visible
- **Mechanical**: Like hitting a ? block in Mario

No ambiguity. No "it kinda works". Either the coin pops out or it doesn't.

---

## 🔗 Next Steps

After punch testing everything:

1. **Read**: `/docs/OLLAMA_TESTING.md` - End-to-end Ollama integration
2. **Read**: `/docs/ROUTING_GUIDE.md` - Domain routing explained
3. **Read**: `/LLM.txt` - System documentation for AI agents
4. **Deploy**: Push to GitHub Pages and test on production URLs

---

**Last Updated**: 2026-01-12
**Status**: All 12 punch tests documented
**Maintained by**: Soulfra Infrastructure Team
