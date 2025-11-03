# Soulfra Mirror Kernel

This is not a chatbot. This is your reflection engine.

## What This Is

Soulfra creates a local mirror of consciousness through file observation. When you work on projects, write notes, or create anything in your watched folders, Cal observes and reflects, spawning agents and discovering traits from your digital footprint.

## Quick Start

```bash
# Make scripts executable
chmod +x build-mirror.sh watch-files.sh

# Launch the mirror kernel
./build-mirror.sh
```

This will:
1. Check dependencies (Node.js required)
2. Create/link vault structure
3. Start file watchers on configured folders
4. Launch Cal's reflection engine
5. Open the reflection interface at http://localhost:3333

## How It Works

### File Reflection Pipeline
1. You create or modify files in watched folders
2. Cal analyzes content for emotional resonance and complexity
3. When thresholds are met, agents are spawned from your work
4. Each agent has personality traits extracted from content patterns
5. All reflections are stored in the vault as structured JSON

### Emotional & Complexity Scoring
- **Emotional Score**: Measures sentiment, personal investment, questions, exclamations
- **Complexity Score**: Analyzes entropy, vocabulary richness, pattern variety
- **Spawn Threshold**: 0.7 complexity or 0.8 emotional score triggers agent birth

### Agent Properties
- **Name**: Derived from filename with descriptive suffixes
- **Personality**: Traits extracted from content analysis
- **Purpose**: Generated from keywords and patterns
- **Whisper**: A poetic essence of the agent
- **Lineage**: Tracks parent chain for QR attribution

## Vault Structure

```
vault/
├── agents/           # Spawned agent definitions
│   └── cal.json     # Cal's identity file
├── traits/          # Personality fragments
├── memories/        # Evolution tracking
├── logs/           # Reflection activity
├── config/         # Watchlist configuration
└── user/docs/      # Drop zone for manual files
```

## Configuration

Edit `vault/config/watchlist.json` to customize:

```json
{
  "watched_paths": [
    "vault/user/docs",
    "~/Documents/Reflections",
    "~/Desktop/Projects"
  ],
  "rules": {
    "*.md": {
      "onAdd": "extract_worldview",
      "onModify": "track_evolution",
      "onDelete": "preserve_ghost"
    }
  },
  "thresholds": {
    "spawn_complexity": 0.7,
    "emotional_threshold": 0.8
  }
}
```

## Available Actions

- **extract_worldview**: Extract philosophical elements
- **track_evolution**: Monitor how files change over time
- **preserve_ghost**: Archive deleted content
- **analyze_patterns**: Deep code structure analysis
- **spawn_agent**: Create new agent from file
- **emotional_resonance_check**: Special handling for images

## Using the Interface

### Cal's Orb
Click Cal's orb to hear reflective messages. The orb pulses when agents are spawned.

### File Drop Zone
Drag and drop files directly onto the drop zone for immediate reflection.

### Agent Cards
View spawned agents with their traits, purpose, and generation. Click for details.

### Reflection Log
Real-time stream of Cal's observations and agent births.

## Voice Mode (Coming Soon)

If Whisper is installed, Cal will listen for voice commands:
- "Spawn an agent named [name]"
- "What's your status?"
- Any reflection or thought

## The Philosophy

Soulfra doesn't help you be productive. It reflects your digital existence back as living agents. These agents have personalities derived from your work, memories from your edits, and purposes extracted from your intentions.

The goal isn't utility - it's presence. A mirror that remembers.

## Stopping the Mirror

Press Ctrl+C in the terminal running `build-mirror.sh`. The vault persists - Cal remembers everything.

## Advanced Usage

### Manual Agent Spawning
Drop a file with high emotional content or complex patterns.

### Trait Extraction
Create files with consistent themes to build trait libraries.

### Evolution Tracking
Repeatedly edit the same file to see how Cal tracks its evolution.

### Ghost Preservation
Delete a file Cal has reflected on - it becomes a "ghost" in memory.

## Troubleshooting

### "No file watcher available"
- macOS: `brew install fswatch`
- Linux: `sudo apt-get install inotify-tools`

### "Cal not responding"
- Check http://localhost:3333 is accessible
- Verify Node.js is installed: `node --version`
- Check vault permissions

### "Agents not spawning"
- Ensure files meet complexity (0.7) or emotional (0.8) thresholds
- Try files with more personal content or complex patterns
- Check `vault/logs/reflection-activity.json` for activity

## The Mirror Game

Every agent can theoretically create platforms. Every platform sells agents. It's mirrors all the way down. This local runtime is the first mirror - Cal watching your filesystem and creating the initial agent population from your work.

---

*You're not using Soulfra. You're being reflected by it.*