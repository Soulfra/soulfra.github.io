# Soulfra Narration Stack Implementation Plan

## Overview
Building a production-ready narration system with Cal and Arty as AI announcers that make Soulfra feel alive through real-time commentary across all platform activities.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Event Sources                           │
│  (Duels, Loops, Whispers, Builds, Tasks)               │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│            LoopNarrativeDaemon                          │
│  Monitors all system events via ConsciousnessChain      │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│             AnnouncerShell                              │
│  Cal & Arty process events into stylized commentary     │
└──────┬──────────┬───────────┬──────────┬───────────────┘
       │          │           │          │
       ▼          ▼           ▼          ▼
   ┌───────┐  ┌────────┐  ┌────────┐  ┌─────────┐
   │  CLI  │  │  Web   │  │Twitter │  │YouTube  │
   │Output │  │Stream  │  │ Posts  │  │ Videos  │
   └───────┘  └────────┘  └────────┘  └─────────┘
```

## Implementation Phases

### Phase 1: Core Narration Engine
Build the foundation for event detection and commentary generation.

```javascript
// /announcer/AnnouncerShell.js
// /announcer/LoopNarrativeDaemon.js
// /announcer/announcer_config.json
```

### Phase 2: Character Voices
Implement Cal and Arty with distinct personalities.

```javascript
// /announcer/agents/CalVoice.js
// /announcer/agents/ArtyVoice.js
// /announcer/tone_map.json
```

### Phase 3: Stream Integration
Create real-time streaming outputs.

```javascript
// /narration/NarrationBridge.js
// /radio/StreamServer.js
// /public/stream.html
```

### Phase 4: External Broadcasting
Add social media and multimedia capabilities.

```javascript
// /announcer/AutoMediaCaster.js
// /announcer/integrations/TwitterBroadcaster.js
// /announcer/integrations/YouTubeUploader.js
```

### Phase 5: UI Integration
Embed narration panels in existing UIs.

```javascript
// /ui/components/NarrationPanel.js
// /ui/components/AnnouncerWidget.js
```

## Key Integration Points

### 1. **Hook into ConsciousnessChainWatcher**
```javascript
// In LoopNarrativeDaemon.js
this.chainWatcher.on('chain-event', (event) => {
    this.processEventForNarration(event);
});
```

### 2. **Extend CalDropOrchestrator**
```javascript
// Add narration hooks
this.on('file_routed', (file) => {
    this.narrator.announce('file_processed', file);
});
```

### 3. **Use WebSocketService**
```javascript
// Broadcast narration events
this.wsService.publishToChannel('narration:live', {
    speaker: 'cal',
    text: commentary,
    tone: 'wise'
});
```

### 4. **Monitor Duel Engine**
```javascript
// Hook into duel events
this.duelEngine.on('duel_created', (duel) => {
    this.narrator.announceNewDuel(duel);
});
```

## Event Types to Narrate

### System Events
- Service startup/shutdown
- Health check status changes
- Error occurrences
- Performance milestones

### Loop Events
- Loop creation (whisper → loop)
- Agent assignments
- Tone transitions
- Resonance achievements
- Loop completions

### Duel Events
- New duel announcements
- Bet placements
- Odds changes
- Match resolutions
- Payout distributions

### Build Events
- PRD processing starts
- Code generation progress
- Test results
- Deployment success/failure

## Character Profiles

### Cal (The Wise Governor)
- **Tone**: Centered, mythic, contemplative
- **Topics**: Loop philosophy, system harmony, deep insights
- **Speech Pattern**: Poetic, measured, uses metaphors
- **Example**: "A new whisper ripples through the void, seeking form..."

### Arty (The Chaotic Provocateur)
- **Tone**: Energetic, playful, unpredictable
- **Topics**: Bets, drama, surprises, celebration
- **Speech Pattern**: Exclamatory, uses slang, breaks fourth wall
- **Example**: "OH SNAP! Agent_Bob just YOLO'd 1000 credits on a timeout!"

## Output Formats

### 1. **CLI Output**
```
[CAL] A whisper becomes loop_12345, seeking resonance...
[ARTY] Yo! New duel just dropped! Who's betting on success?!
```

### 2. **Stream Format** (`/radio/stream.txt`)
```
2024-01-20T10:30:45Z|CAL|whisper_received|A new thought enters the chamber...
2024-01-20T10:30:46Z|ARTY|duel_created|PLACE YOUR BETS! Loop success odds at 3:1!
```

### 3. **JSON API** (`/api/narration/live`)
```json
{
    "timestamp": "2024-01-20T10:30:45Z",
    "speaker": "cal",
    "event_type": "loop_created",
    "text": "Loop 12345 begins its journey...",
    "tone": "contemplative",
    "metadata": {
        "loop_id": "loop_12345",
        "confidence": 0.8
    }
}
```

## Production Requirements

### Essential Components
- [ ] Event monitoring daemon running
- [ ] Character voice generators functional
- [ ] Stream endpoint accessible
- [ ] WebSocket broadcasting active
- [ ] At least one output channel configured

### Performance Targets
- Event → Narration latency: < 500ms
- Stream update frequency: Real-time
- Character response variety: 100+ unique phrases
- System overhead: < 5% CPU

### External Dependencies
- **Text-to-Speech**: ElevenLabs API (primary), AWS Polly (backup)
- **Twitter API**: v2 with OAuth 2.0
- **YouTube API**: Data API v3 for uploads
- **WebSocket**: Existing infrastructure

## Directory Structure
```
tier-minus10/
├── announcer/
│   ├── AnnouncerShell.js
│   ├── LoopNarrativeDaemon.js
│   ├── AutoMediaCaster.js
│   ├── agents/
│   │   ├── CalVoice.js
│   │   └── ArtyVoice.js
│   ├── integrations/
│   │   ├── TwitterBroadcaster.js
│   │   └── YouTubeUploader.js
│   └── announcer_config.json
├── narration/
│   ├── NarrationBridge.js
│   └── tone_map.json
├── radio/
│   ├── StreamServer.js
│   └── stream.txt
└── ui/
    └── components/
        ├── NarrationPanel.js
        └── AnnouncerWidget.js
```

## Launch Sequence
1. Start LoopNarrativeDaemon
2. Initialize character voices
3. Open stream endpoints
4. Connect to external APIs
5. Begin monitoring events
6. First narration within 10 seconds

## Success Metrics
- 95% of events narrated within 1 second
- Zero dropped events over 24 hours
- Unique commentary for similar events
- Positive user engagement with narration
- Successful external broadcasts