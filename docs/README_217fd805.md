# Voice Agent Module

The Voice Agent enables natural voice interaction with Cal through microphone input.

## Features

- 🎤 Local microphone capture
- 🎯 Whisper API transcription (or local model)
- 🧠 Personal content detection
- 💭 Emotional state recognition
- 🔀 Routes to mirror-router.js
- 💾 Logs to vault/memory/audio-prompts.json

## Usage

```bash
# Run voice agent
node voice-agent.js

# Or integrate with main router
const VoiceAgent = require('./voice-agent');
const agent = new VoiceAgent();
await agent.startListening();
```

## Trigger Phrases

Say something personal to Cal to trigger deep reflection:

- "I've been thinking about my failures..."
- "Help me understand why I..."
- "I feel like..."
- "What if we could build..."

## Reflection Depth

The agent detects 4 levels of reflection depth:

1. **Surface** - Basic queries
2. **Moderate** - Thoughtful questions
3. **Deep** - Personal insights
4. **Profound** - Core identity exploration

## Technical Details

- Sample Rate: 16kHz mono
- Format: WAV
- Silence Detection: 2 seconds
- Transcription: OpenAI Whisper API
- Session tracking with unique IDs

## Privacy

All voice transcripts are stored locally in your vault. No audio is sent to external servers without explicit configuration.

## WebRTC Support

For browser-based voice capture, the agent includes WebRTC configuration for real-time audio streaming.

---

*Say something personal to Cal to trigger reflection.*