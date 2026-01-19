# Voice Recording & Transcription Explained

**Your question:** "i didn't actually record anything although it would have came from a webm transcript or something"

**Answer:** Let me clarify how voice recording actually works!

---

## Two Separate Things

### 1. Audio Recording (WebM)
**What:** Captures your voice as audio data
**Format:** WebM (browser default)
**Purpose:** Ambient audio analysis
**Where:** Stays in your browser (never uploaded)

### 2. Speech Transcription (Text)
**What:** Converts speech to text
**Format:** Plain text string
**Purpose:** Search query
**Where:** Sent to backend for search

**They're SEPARATE processes!**

---

## How It Actually Works

### Step-by-Step Audio Recording

```javascript
// 1. Request microphone access
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

// 2. Create MediaRecorder (records to WebM)
const mediaRecorder = new MediaRecorder(stream);

// 3. Start recording
mediaRecorder.start();

// 4. Collect audio chunks
mediaRecorder.ondataavailable = (event) => {
  audioChunks.push(event.data); // Raw audio data
};

// 5. Stop recording
mediaRecorder.stop();

// 6. Create audio blob (WebM file)
const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
```

**Result:** WebM audio blob containing your voice + ambient noise

---

### Step-by-Step Transcription

**Option A: Web Speech API (Current Implementation)**

```javascript
// 1. Create speech recognizer
const recognition = new webkitSpeechRecognition();
recognition.lang = 'en-US';

// 2. Start listening (SEPARATE from MediaRecorder)
recognition.start();

// 3. As you speak, it transcribes in REAL-TIME
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  console.log('You said:', transcript);
  // Output: "privacy tools"
};
```

**Important:** Web Speech API transcribes DIRECTLY from microphone stream. It doesn't use the WebM blob at all!

---

**Option B: Whisper API (Future Enhancement)**

```javascript
// 1. You already have WebM blob from MediaRecorder
const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

// 2. Send WebM to Whisper API
const formData = new FormData();
formData.append('audio', audioBlob);

const response = await fetch('/api/whisper/transcribe', {
  method: 'POST',
  body: formData
});

// 3. Get transcript back
const data = await response.json();
const transcript = data.transcript;
console.log('You said:', transcript);
// Output: "privacy tools"
```

**With Whisper:** The WebM blob IS used for transcription.

---

## What We're Doing Now

### Current Implementation (Web Speech API)

```
User clicks 🎤
  ↓
TWO things start:
  ├─ MediaRecorder: Records WebM audio blob
  └─ Web Speech API: Listens and transcribes live

User speaks: "privacy tools"
  ↓
MediaRecorder captures:
  ├─ Your voice
  └─ Ambient noise (fan, keyboard, room tone)

Web Speech API hears:
  └─ "privacy tools" (real-time transcription)

User clicks ⏹️
  ↓
MediaRecorder stops:
  └─ Creates WebM blob

Web Speech API stops:
  └─ Returns final transcript: "privacy tools"

Processing:
  ├─ Analyze WebM blob for ambient audio (FFT, entropy)
  ├─ Calculate ambient score (0.0 - 1.0)
  └─ Use transcript for search query

Result:
  ├─ Transcript: "privacy tools"
  ├─ Ambient score: 0.85
  └─ Fingerprint: { spectrum: [...], low_freq: 350, ... }
```

**The WebM blob is for ambient analysis, NOT transcription!**

---

## Why Two Separate Processes?

### MediaRecorder (WebM)
**Purpose:** Capture everything (voice + ambient)
**What we analyze:**
- Frequency spectrum (FFT)
- Room tone (60Hz hum, HVAC)
- Entropy (randomness)
- Noise floor
- Environmental markers

**Used for:** Anti-bot detection (proves you're in a real environment)

### Web Speech API
**Purpose:** Convert speech to text
**What it gives us:**
- "privacy tools" (the words you said)

**Used for:** Search query

---

## WebM File Breakdown

### What's in the WebM Blob?

```
WebM Audio Container
├─ Header (metadata)
├─ Audio Codec: Opus (usually)
├─ Sample Rate: 48kHz
├─ Channels: 1 (mono)
└─ Audio Data:
    ├─ Your voice (speech signal)
    └─ Ambient noise:
        ├─ Computer fan hum (~200-400Hz)
        ├─ 60Hz electrical hum
        ├─ Keyboard clicks
        ├─ Breathing sounds
        ├─ Room tone
        └─ Environmental randomness
```

### What We Extract from WebM

```javascript
// 1. Connect audio to analyser
const audioContext = new AudioContext();
const source = audioContext.createMediaStreamSource(stream);
const analyser = audioContext.createAnalyser();
source.connect(analyser);

// 2. Get frequency data (FFT)
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);
analyser.getByteFrequencyData(dataArray);

// dataArray now contains:
// Index 0: 0 Hz (DC)
// Index 1: ~20 Hz
// Index 2: ~40 Hz
// Index 3: 60 Hz (mains hum) ← Look for this!
// Index 4: ~80 Hz
// ...
// Index 100: ~2000 Hz (human voice range)
// ...
// Index 1024: ~22 kHz (upper limit)
```

**We analyze this spectrum to detect natural environment markers.**

---

## You Don't Need to Record Anything Manually!

### The Confusion

You said: "i didn't actually record anything"

**You're right!** You don't record anything manually. The code does it automatically when you click 🎤.

### What Happens Automatically

```
Click 🎤
  ↓
Browser requests microphone permission
  ↓
You click "Allow"
  ↓
Recording starts AUTOMATICALLY:
  ├─ MediaRecorder.start() → WebM recording
  └─ recognition.start() → Live transcription

You speak (naturally)
  ↓
Click ⏹️
  ↓
Recording stops AUTOMATICALLY:
  ├─ MediaRecorder.stop() → WebM blob ready
  └─ recognition.stop() → Transcript ready

Processing happens AUTOMATICALLY:
  ├─ Ambient analysis on WebM blob
  ├─ Score calculation
  └─ Search execution with transcript
```

**You just click 🎤, speak, and click ⏹️. Everything else is automatic!**

---

## WebM vs Transcript Summary

| Aspect | MediaRecorder (WebM) | Web Speech API (Transcript) |
|--------|----------------------|------------------------------|
| **Purpose** | Ambient audio analysis | Speech to text |
| **Format** | WebM audio blob | Plain text string |
| **Contains** | Voice + ambient noise | Just the words you said |
| **Used for** | Anti-bot detection | Search query |
| **Uploaded?** | NO (stays local) | YES (sent to backend) |
| **Size** | ~100KB for 5 sec | ~20 bytes ("privacy tools") |
| **Privacy** | Processed locally | Only text sent to server |

---

## Code Location

### Where Recording Happens

**File:** `deathtodata/voice-search.js`

**MediaRecorder setup:**
```javascript
// Line 46: Start recording
this.mediaRecorder = new MediaRecorder(this.stream);

// Line 49: Collect audio chunks
this.mediaRecorder.ondataavailable = (event) => {
  this.audioChunks.push(event.data);
};

// Line 53: Start
this.mediaRecorder.start();

// Line 83: Create WebM blob
const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
```

**Transcription:**
```javascript
// Line 219: Transcribe audio
async transcribeAudio(audioBlob) {
  // Try Web Speech API first
  if ('webkitSpeechRecognition' in window) {
    const transcript = await this.transcribeWithWebSpeech(audioBlob);
    return transcript;
  }

  // Fallback: Whisper API
  // (not implemented yet)
}
```

---

## What Gets Sent to Backend

**Only these 3 things:**

```javascript
POST /api/voice-search
{
  "transcript": "privacy tools",           // The words you said
  "ambientScore": 0.85,                    // Anti-bot score (0.0-1.0)
  "fingerprint": {                         // Compact audio signature
    "spectrum": [10, 15, 8, 12, ...],     // Every 10th frequency bin
    "low_freq": 350,                       // Room tone energy
    "mid_freq": 520,                       // Human activity energy
    "high_freq": 120,                      // Upper frequency energy
    "variance": 85,                        // Randomness measure
    "sample_count": 50                     // How many samples taken
  },
  "signature": "a1b2c3...",               // Cryptographic proof
  "publicKey": "302a300..."               // Your public key
}
```

**The WebM blob NEVER leaves your browser!**

---

## Privacy Guarantee

### What Stays Local (In Your Browser)

✅ Raw audio recording (WebM blob)
✅ Your actual voice
✅ Detailed frequency spectrum
✅ All audio samples
✅ Microphone stream

### What Gets Sent to Server

✅ Transcript text only ("privacy tools")
✅ Ambient score (single number: 0.85)
✅ Fingerprint (compact mathematical summary)
✅ Cryptographic signature

### What Can Be Reconstructed from Server Data

❌ Cannot reconstruct your voice
❌ Cannot identify you by voice
❌ Cannot replay your audio
❌ Cannot get raw audio data

**The fingerprint is like a hash - one-way only!**

---

## Testing: See It In Action

### Browser Console Logs

```javascript
// Click 🎤
[VoiceSearch] Recording started

// While recording (every 100ms)
[VoiceSearch] Ambient sample 1: [10, 15, 8, 12, ...]
[VoiceSearch] Ambient sample 2: [11, 14, 9, 13, ...]
[VoiceSearch] Ambient sample 3: [9, 16, 7, 11, ...]
...

// Click ⏹️
[VoiceSearch] Recording stopped, processing...
[VoiceSearch] Ambient score: 0.85
[VoiceSearch] Scoring factors: ['60Hz hum detected', 'Room tone present', 'Spectrum width: 72.3%', 'Random variation detected', 'Human activity detected']
[VoiceSearch] Fingerprint: {spectrum: Array(102), low_freq: 350, mid_freq: 520, high_freq: 120, variance: 85, …}
[VoiceSearch] Transcript: "privacy tools"

// Backend response
[Voice] Signed voice search sent to backend
Backend response: {success: true, transcript: "privacy tools", ambientScore: 0.85, vibesAwarded: 0.3, ...}
```

---

## Summary

**Q:** "i didn't actually record anything although it would have came from a webm transcript"

**A:**

1. **You don't manually record** - clicking 🎤 automatically starts recording

2. **WebM is NOT a transcript** - WebM is the audio file, transcript is the text

3. **Two separate things happen:**
   - MediaRecorder → Creates WebM blob (for ambient analysis)
   - Web Speech API → Creates transcript (for search query)

4. **WebM stays local** - Only transcript + fingerprint sent to server

5. **It's all automatic** - You just click, speak, and stop. Code handles everything.

**You were probably confused because:**
- "WebM" and "transcript" sound like they go together
- But they're actually separate outputs from two different APIs
- WebM = audio recording (MediaRecorder API)
- Transcript = text output (Web Speech API)

**Now you know!** 🎤
