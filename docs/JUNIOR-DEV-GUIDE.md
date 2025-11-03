# 🚀 Junior Developer Guide

## Welcome!

This guide helps you understand and work with the Soulfra ecosystem.

## Understanding the Codebase

### Start Simple
Begin with these files in order:
1. **auth-handler.js** - Understand authentication
2. **stream-whisper-handler.js** - See how input flows
3. **command-mirror-router.js** - Learn routing
4. **soul-mirror-system.js** - Explore core features

### Key Concepts

**Whispers**: User messages that flow through the system
**Mirrors**: Digital agents that process whispers
**Blessings**: Economic credits for participation
**Clones**: Copies of mirrors that evolve

### Running Your First System

```bash
# 1. Install dependencies
cd tier-minus20
npm install

# 2. Run a simple handler
node stream-whisper-handler.js

# 3. In another terminal, test it
curl -X POST http://localhost:7777/whisper \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello mirror!"}'
```

### Making Changes

1. **Find the file** you want to modify
2. **Read its PRD** in SOULFRA-DOCS/PRDs/
3. **Make small changes** and test
4. **Run tests** with `npm test`
5. **Commit with clear message**

### Common Patterns

**Event-driven**: Most systems emit and listen to events
**Async/await**: Used throughout for async operations
**Error handling**: Always wrap in try/catch
**Logging**: Use console.log for debugging

### Getting Help

- Read the PRDs in SOULFRA-DOCS/PRDs/
- Check inline code comments
- Ask in Discord #junior-devs
- Look at test files for examples

## Your First Task

1. Pick a simple bug from the issue tracker
2. Find the relevant file
3. Read its PRD
4. Make the fix
5. Test it works
6. Submit a PR

Remember: Every expert was once a beginner!