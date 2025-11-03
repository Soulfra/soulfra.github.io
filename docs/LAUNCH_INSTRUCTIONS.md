# 🚀 SOULFRA LAUNCH INSTRUCTIONS

## Current Situation
You're in tier-minus10 (10 folders deep!) with 60+ SOULFRA implementations. Here's how to launch:

## Option 1: SOULFRA Ultimate (RECOMMENDED)
This has ALL features including blockchain ledger!

```bash
# Make executable
chmod +x launch-soulfra-ultimate.sh

# Run it
./launch-soulfra-ultimate.sh
```

OR directly:
```bash
python3 SOULFRA_ULTIMATE_UNIFIED.py
```

## Option 2: Original SOULFRA ONE
```bash
chmod +x launch_soulfra.sh
./launch_soulfra.sh
```

OR:
```bash
python3 SOULFRA_ONE.py
```

## Option 3: Quick Launch Any Version
```bash
chmod +x soulfra-now.sh
./soulfra-now.sh
```

## If You Get "Permission Denied"
```bash
# Fix all permissions at once
chmod +x *.sh

# Or run with bash directly
bash launch-soulfra-ultimate.sh
```

## Features in SOULFRA Ultimate:
- ✅ Blockchain ledger (like BlockDiff!)
- ✅ Hash chains for immutable history
- ✅ VIBE token economy
- ✅ Soul signatures for viral tracking
- ✅ AI vs AI debates
- ✅ Mobile PWA support
- ✅ Auto-restart (no more timeouts!)
- ✅ 60+ features from all implementations

## Ports:
- SOULFRA Ultimate: http://localhost:9999
- SOULFRA ONE: http://localhost:7777
- Mobile QR: http://localhost:9999/qr

## Required:
- Python 3
- Flask libraries (auto-installed)

## Quick Debug:
```bash
# Kill all Python processes
killall -9 python3

# Check what's running
lsof -i :9999
lsof -i :7777

# See available implementations
ls SOULFRA*.py
```

## The Blockchain Feature:
SOULFRA_ULTIMATE_UNIFIED.py includes the blockchain ledger from SOULFRA_TEST_LEDGER.py:
- Each action creates a new block
- Blocks are hash-linked (previous_hash)
- Immutable history of all platform events
- Similar to BlockDiff's incremental VM snapshots!

Just run: `python3 SOULFRA_ULTIMATE_UNIFIED.py`