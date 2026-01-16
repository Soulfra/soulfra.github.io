# $1 Voice Memo System

**Same pattern as `/reviews/` but for voice memos.**

---

## The Pattern (Works for ANYTHING)

```
QR Code → Unique ID → Custom Page → $1 Payment → Verified Result
```

**Reviews:** QR → business-id → review form → pay $1 → verified badge
**Voice:** QR → topic-id → voice recorder → pay $1 → memo saved

**Same code. Different content.**

---

## Quick Test

```
http://localhost:8000/voice/
```

1. Enter topic: "Podcast Episode 5"
2. Generate QR
3. Click record URL
4. Record voice memo
5. Pay $1 (card: 4242 4242 4242 4242)
6. See verified memo

---

## Files

```
/voice/
├── index.html       ← Generate QR for topic
├── record.html      ← Record voice memo
├── verified.html    ← Confirmation after payment
└── wordlist.js      ← Reused from /reviews/
```

---

## How to Build Your Own (Copy This Pattern)

### 1. Pick What You're Building
- Photo submissions? → `/photos/`
- Video testimonials? → `/videos/`
- Document uploads? → `/docs/`
- Token purchases? → `/tokens/`

### 2. Copy the 3 Files
```bash
cp -r voice/ mynewfeature/
```

### 3. Change 3 Things
- index.html: "topic" → "your-thing"
- record.html: voice recorder → your input
- verified.html: "memo saved" → "your result"

### 4. Done
```
http://localhost:8000/mynewfeature/
```

---

## The "QR Wrapper" Concept You Discovered

**You said:** "QRcode wrapper that sends a ping to our website on how to format everything"

**Exactly. Here's how:**

```javascript
// In index.html (QR generator)
const uniqueID = generateUniqueID("Podcast Episode 5");
// Result: "podcast-episode-5-abc123"

const qrURL = `${window.location.origin}/voice/record.html?topic=${uniqueID}`;
// QR code contains this URL

// User scans → Browser opens URL with topic ID
```

```javascript
// In record.html (receives the ID)
const urlParams = new URLSearchParams(window.location.search);
const topicID = urlParams.get('topic');
// topicID = "podcast-episode-5-abc123"

// Now the page KNOWS what topic this is
document.getElementById('topicDisplay').textContent = topicID;

// User records voice memo
// On submit: Store voice file + topicID together
```

```javascript
// After payment
sessionStorage.setItem('voiceMemo', JSON.stringify({
    topicID: topicID,
    audioFile: recordedAudio,
    timestamp: new Date().toISOString(),
    paid: true
}));

// Redirect to verification
window.location.href = `/voice/verified.html?topic=${topicID}`;
```

**The "ping to website" = URL parameter (?topic=xyz)**

Website reads that parameter → knows what to show.

---

## Why This Works

**No backend needed** (for now):
- QR code = just a URL with ID
- ID passed via URL parameter
- Payment handled by Stripe
- Data stored in sessionStorage/localStorage

**Later (with backend):**
- Store voice files in cloud storage
- Link payment to file upload
- Retrieve by topic ID

---

## Deploy It

```bash
git add voice/
git commit -m "Add $1 voice memo system using review pattern"
git push origin main

# Live at: https://soulfra.com/voice/
```

---

## The Realization You Had

**"we're basically creating a QRcode wrapper that sends a ping to our website on how to format everything and from there you're connected and it doesnt matter"**

**YES. That's the entire system:**

1. QR code contains unique ID
2. Website receives ID via URL
3. Website formats page based on ID
4. User interacts (review/voice/photo/etc)
5. Payment links action to ID
6. Result stored with that ID

**This pattern works for:**
- Reviews (business ID)
- Voice memos (topic ID)
- Photos (event ID)
- Videos (campaign ID)
- Tokens (wallet ID)
- Anything with an ID

---

## Test It Now

```
http://localhost:8000/voice/
```

Generate QR → Record memo → Pay $1 → See it work.

**Same pattern. Different feature. 5 minutes to build.**
