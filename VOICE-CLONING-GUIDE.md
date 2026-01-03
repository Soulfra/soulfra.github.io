# Voice Cloning Guide - CringeProof

**Date:** January 3, 2026
**Status:** Ready to Record

---

## Quick Start (5 Minutes)

### Step 1: Record Voice Samples

```bash
# Open voice recorder
open /Users/matthewmauer/Desktop/soulfra.github.io/voice-recorder.html

# Or visit live:
# https://soulfra.github.io/voice-recorder.html
```

**Recording Tips:**
1. **Record 2-5 minutes total** (more = better quality)
2. **Speak naturally** - don't over-enunciate
3. **Vary your content:**
   - Read news articles
   - Casual conversation
   - Questions and statements
   - Different emotions (excited, serious, neutral)
4. **Good audio quality:**
   - Quiet room
   - Close to microphone (6-12 inches)
   - No background music
5. **Download as .webm files** when done

### Step 2: Convert WebM to WAV (Required for most cloners)

```bash
# Install ffmpeg if you don't have it
brew install ffmpeg

# Convert recordings
cd ~/Downloads
ffmpeg -i voice-sample-1234567890.webm -ar 22050 -ac 1 voice-sample-1.wav
ffmpeg -i voice-sample-9876543210.webm -ar 22050 -ac 1 voice-sample-2.wav

# Combine multiple samples into one file
ffmpeg -i "concat:voice-sample-1.wav|voice-sample-2.wav" -acodec copy combined-voice.wav
```

### Step 3: Choose Your Voice Cloning Tool

---

## Option A: F5-TTS (Browser-Based, Easiest)

**Pros:**
- ✅ No installation
- ✅ Runs in browser
- ✅ Free
- ✅ Open source

**Cons:**
- ❌ Requires internet
- ❌ Limited control
- ❌ May not work with all browsers

**How to Use:**

1. **Access F5-TTS:**
   ```
   https://huggingface.co/spaces/mrfakename/E2-F5-TTS
   ```

2. **Upload voice sample:**
   - Click "Upload Reference Audio"
   - Select your .wav file (converted from .webm)
   - Or drag and drop

3. **Enter reference text:**
   - Type what you said in the recording
   - Example: "This is a voice sample for cloning my voice using F5-TTS"

4. **Enter target text:**
   - Type what you want your voice to say
   - Example: "Bitcoin will hit $100,000 by the end of 2026"

5. **Generate:**
   - Click "Generate Speech"
   - Wait 10-30 seconds
   - Download generated audio

**Best For:**
- Quick tests
- One-off speech generation
- No technical setup needed

---

## Option B: OpenVoice (Local, Best Quality)

**Pros:**
- ✅ Runs locally (no internet after setup)
- ✅ High quality
- ✅ MIT licensed (commercial use OK)
- ✅ Fast generation

**Cons:**
- ❌ Requires Python setup
- ❌ ~2GB download
- ❌ Needs some technical knowledge

**Installation:**

```bash
# Create project directory
cd ~/Desktop
mkdir voice-cloning
cd voice-cloning

# Clone OpenVoice
git clone https://github.com/myshell-ai/OpenVoice.git
cd OpenVoice

# Create Python environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download checkpoints (~2GB)
mkdir checkpoints
cd checkpoints
# Follow instructions at: https://github.com/myshell-ai/OpenVoice#checkpoints
```

**Usage:**

```python
# demo.py
import os
from openvoice import se_extractor
from openvoice.api import ToneColorConverter

# Extract tone color from your voice
ckpt_converter = 'checkpoints/converter'
device = 'cpu'  # or 'cuda' if you have GPU

tone_color_converter = ToneColorConverter(f'{ckpt_converter}/config.json', device=device)
tone_color_converter.load_ckpt(f'{ckpt_converter}/checkpoint.pth')

# Your voice sample
source_se = torch.load('path/to/your/voice-sample.wav')

# Generate speech
target_text = "Bitcoin will hit $100,000 by the end of 2026"
# ... (full code in OpenVoice repo README)
```

**Best For:**
- Production use
- Batch processing
- Privacy (runs locally)
- Commercial projects

---

## Option C: Chatterbox (Lightweight, MIT Licensed)

**Pros:**
- ✅ Lightweight (~100MB)
- ✅ MIT licensed
- ✅ Simple API
- ✅ Good quality

**Cons:**
- ❌ Less maintained
- ❌ Python setup needed

**Installation:**

```bash
cd ~/Desktop/voice-cloning
git clone https://github.com/resemble-ai/Resemblyzer.git
cd Resemblyzer

pip install -r requirements.txt
```

**Usage:**

```python
from resemblyzer import VoiceEncoder, preprocess_wav
from pathlib import Path

# Load your voice samples
wav_fpaths = list(Path("voice-samples").glob("*.wav"))
encoder = VoiceEncoder()

# Extract speaker embedding
embeds = [encoder.embed_utterance(preprocess_wav(fpath)) for fpath in wav_fpaths]

# Use embedding for synthesis (requires TTS engine)
# ... (combine with Tacotron2 or FastSpeech2)
```

**Best For:**
- Voice verification
- Speaker embedding extraction
- Research projects

---

## Recommended Workflow for CringeProof

### Phase 1: Recording (NOW)

```bash
# Open voice recorder
open https://soulfra.github.io/voice-recorder.html

# Record 2-5 minutes of varied speech
# Download .webm files
```

### Phase 2: Conversion

```bash
# Convert to WAV
cd ~/Downloads
ffmpeg -i voice-sample-*.webm -ar 22050 -ac 1 voice-sample.wav

# Save to voice samples folder
mkdir -p ~/Desktop/voice-samples
mv voice-sample*.wav ~/Desktop/voice-samples/
```

### Phase 3: Quick Test (F5-TTS)

```
1. Visit: https://huggingface.co/spaces/mrfakename/E2-F5-TTS
2. Upload: ~/Desktop/voice-samples/voice-sample.wav
3. Reference text: (what you said)
4. Target text: "This is a test of my cloned voice"
5. Generate and listen
```

### Phase 4: Production Setup (OpenVoice)

```bash
# Install OpenVoice (see Option B above)
cd ~/Desktop/voice-cloning/OpenVoice

# Run demo with your voice
python demo.py --reference ~/Desktop/voice-samples/voice-sample.wav \
               --text "Bitcoin will hit $100,000 by the end of 2026"

# Output: output.wav (your voice saying the text)
```

---

## Integration with CringeProof

### Use Case 1: Voice Predictions

**User flow:**
1. User records prediction: "I predict GME will hit $500 by March"
2. System saves audio + transcript
3. Later: Generate speech recap in user's voice

**Implementation:**

```javascript
// frontend/prediction-voice.html
async function recordPrediction() {
  // Use voice-recorder.html code
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);

  // Record user's prediction
  recorder.start();

  // Stop after user clicks "Stop"
  recorder.addEventListener('stop', () => {
    const audioBlob = new Blob(chunks, { type: 'audio/webm' });

    // Upload to server
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('email', userEmail);

    fetch('/api/prediction/voice', {
      method: 'POST',
      body: formData
    });
  });
}
```

**Backend (server/api/prediction.js):**

```javascript
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

router.post('/api/prediction/voice', upload.single('audio'), async (req, res) => {
  const { email } = req.body;
  const audioFile = req.file;

  // Save WebM
  const webmPath = `voice-predictions/${email}-${Date.now()}.webm`;
  fs.writeFileSync(webmPath, audioFile.buffer);

  // Convert to WAV for cloning
  const wavPath = webmPath.replace('.webm', '.wav');
  exec(`ffmpeg -i ${webmPath} -ar 22050 -ac 1 ${wavPath}`, (error) => {
    if (error) {
      return res.status(500).json({ error: 'Conversion failed' });
    }

    res.json({
      success: true,
      audioPath: wavPath,
      message: 'Voice prediction saved'
    });
  });
});
```

### Use Case 2: Debate Recap

**User flow:**
1. User debates topic, submits text arguments
2. At end of debate, generate audio recap in their voice
3. "Here's what you argued: [cloned voice reads their arguments]"

**Implementation:**

```javascript
// After debate ends
router.post('/api/debate/recap-audio', async (req, res) => {
  const { sessionId, email } = req.body;
  const session = debateStore.sessions.get(sessionId);
  const participant = session.participants.get(email);

  // Get user's voice sample (from previous recordings)
  const voiceSample = `voice-samples/${email}.wav`;

  if (!fs.existsSync(voiceSample)) {
    return res.status(400).json({
      error: 'No voice sample found. Please record your voice first.'
    });
  }

  // Combine all arguments into one text
  const recapText = participant.arguments.join('. ');

  // Generate speech using OpenVoice (or F5-TTS via API)
  // ... (call voice cloning service)

  res.json({
    success: true,
    audioURL: `/audio/debate-recap-${sessionId}.wav`,
    transcript: recapText
  });
});
```

### Use Case 3: Referral Pitch

**User flow:**
1. User records elevator pitch once
2. System clones voice
3. Generate custom pitches: "Hey [friend], check out CringeProof..."

**Implementation:**

```javascript
// Generate personalized referral pitch
router.post('/api/referral/voice-pitch', async (req, res) => {
  const { email, friendName, vertical } = req.body;

  const pitchTemplates = {
    crypto: `Hey ${friendName}, I'm using CringeProof to make crypto predictions. You should check it out!`,
    purple: `Hey ${friendName}, want to bet on GME? I'm using CringeProof, it's pretty cool.`,
    sports: `Hey ${friendName}, I'm making NFL predictions on CringeProof. Join me!`
  };

  const pitchText = pitchTemplates[vertical];

  // Generate speech in user's voice
  // ... (call voice cloning)

  res.json({
    success: true,
    pitchAudioURL: `/audio/pitch-${email}-${Date.now()}.wav`,
    pitchText: pitchText
  });
});
```

---

## Privacy Considerations

### Voice Data Storage

**What we store:**
- ✅ Voice samples (user provides for cloning)
- ✅ Generated speech (user's predictions/debates)
- ✅ Voice embeddings (speaker characteristics)

**Retention policy:**
- User voice samples: Kept until user deletes account
- Generated speech: 90 days (same as IP addresses)
- Voice embeddings: Kept for active accounts only

**User controls:**
- Delete voice data: `DELETE /api/user/voice`
- Download voice data: `GET /api/user/voice/export`
- Disable voice features: Account settings

**GDPR compliance:**
- ✅ Explicit consent before recording
- ✅ Clear purpose (voice cloning for predictions)
- ✅ User can delete all voice data
- ✅ No third-party sharing

**Not PII:**
- Voice embeddings are NOT raw audio
- Similar to semantic wordmaps (characteristics, not content)
- Used for matching/clustering, not identification

---

## Recording Best Practices

### Content Variety (What to Say)

**Good sample content:**

1. **News articles** (neutral tone):
   ```
   "Bitcoin reached a new all-time high today, surpassing $100,000 for the first time in history. Analysts attribute the surge to institutional adoption and favorable regulatory developments."
   ```

2. **Casual speech** (natural tone):
   ```
   "Hey, so I've been thinking about this GME situation, and honestly, I think it's going to hit $500 by March. The fundamentals are solid, and the short interest is still crazy high."
   ```

3. **Questions** (varied intonation):
   ```
   "What do you think about cryptocurrency? Do you believe Bitcoin will continue to rise? How confident are you in your predictions?"
   ```

4. **Emotional variety**:
   - Excited: "This is amazing! I can't believe it worked!"
   - Serious: "We need to carefully consider the implications."
   - Neutral: "The data shows a clear upward trend."

### Recording Environment

**Good:**
- ✅ Quiet room
- ✅ Close to microphone (6-12 inches)
- ✅ Consistent volume
- ✅ No background noise

**Bad:**
- ❌ Outdoors (wind noise)
- ❌ Music playing
- ❌ Echo-y room
- ❌ Too far from mic

### Sample Length

| Duration | Quality | Use Case |
|----------|---------|----------|
| 30s      | Low     | Quick test only |
| 1-2 min  | Medium  | Simple sentences |
| 2-5 min  | High    | Natural speech |
| 5-10 min | Best    | Professional cloning |

**Recommendation:** 2-5 minutes for CringeProof

---

## Troubleshooting

### "Voice sounds robotic"

**Problem:** Not enough training data or poor quality samples

**Solution:**
1. Record more samples (aim for 5+ minutes)
2. Use varied content (different topics, emotions)
3. Check audio quality (quiet room, good mic)

### "Voice doesn't sound like me"

**Problem:** Reference text doesn't match reference audio

**Solution:**
1. Make sure reference text matches exactly what you said
2. Use punctuation correctly (affects prosody)
3. Try different voice cloning tools (F5-TTS vs OpenVoice)

### "Generated speech is choppy"

**Problem:** Poor audio input or conversion issues

**Solution:**
```bash
# Re-convert with better settings
ffmpeg -i voice-sample.webm -ar 44100 -ac 1 -b:a 192k voice-sample.wav
```

### "Can't install OpenVoice"

**Problem:** Python dependency conflicts

**Solution:**
```bash
# Use fresh virtual environment
python3 -m venv ~/voice-env
source ~/voice-env/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

---

## Next Steps

### Immediate (Do Now)

1. **Record voice samples:**
   ```bash
   open https://soulfra.github.io/voice-recorder.html
   # Record 2-5 minutes
   # Download .webm files
   ```

2. **Convert to WAV:**
   ```bash
   cd ~/Downloads
   ffmpeg -i voice-sample-*.webm -ar 22050 -ac 1 ~/Desktop/voice-samples/my-voice.wav
   ```

3. **Test with F5-TTS:**
   ```
   https://huggingface.co/spaces/mrfakename/E2-F5-TTS
   ```

### Short Term (This Week)

1. **Install OpenVoice for local cloning**
2. **Create voice prediction prototype**
3. **Test debate recap audio generation**

### Medium Term (Next 2 Weeks)

1. **Integrate voice into CringeProof frontend**
2. **Add speech-to-text for easier prediction input**
3. **Build referral pitch generator**

---

## Resources

**Voice Cloning Tools:**
- F5-TTS: https://huggingface.co/spaces/mrfakename/E2-F5-TTS
- OpenVoice: https://github.com/myshell-ai/OpenVoice
- Resemblyzer: https://github.com/resemble-ai/Resemblyzer

**Audio Tools:**
- ffmpeg: https://ffmpeg.org/
- Audacity: https://www.audacityteam.org/ (audio editing)

**Tutorials:**
- OpenVoice docs: https://github.com/myshell-ai/OpenVoice/blob/main/README.md
- Voice cloning guide: https://huggingface.co/blog/voice-cloning

**CringeProof Docs:**
- SIMPLE-QR-GUIDE.md - QR code workflow
- PHONE-TESTING-READY.md - Phone testing guide
- QR-PRIVACY-GUIDE.md - Privacy/PII breakdown

---

## Summary

✅ **Voice recorder ready** - Record samples at https://soulfra.github.io/voice-recorder.html
✅ **Conversion guide** - Convert WebM → WAV with ffmpeg
✅ **Three cloning options** - F5-TTS (browser), OpenVoice (local), Chatterbox (lightweight)
✅ **Integration plan** - Voice predictions, debate recaps, referral pitches
✅ **Privacy explained** - GDPR-compliant voice data handling

**Quick start:**
```bash
# 1. Record voice (2-5 minutes)
open https://soulfra.github.io/voice-recorder.html

# 2. Convert
ffmpeg -i ~/Downloads/voice-sample-*.webm -ar 22050 -ac 1 ~/Desktop/my-voice.wav

# 3. Test
# Visit: https://huggingface.co/spaces/mrfakename/E2-F5-TTS
# Upload my-voice.wav and generate test speech
```

🎤 **Ready to clone your voice!**
