# 🚀 SOULFRA ECOSYSTEM - MASTER LAUNCH GUIDE

## Quick Start

```bash
./MASTER-LAUNCH.sh
```

This opens an interactive menu where you can:
1. **Start Everything** - Launches all 9 tiers
2. **Start Core Only** - Just tiers 4-6 (minimal setup)
3. **Start with Debug** - Checks system first
4. **Check Status** - See what's running
5. **Stop All** - Safely stop everything
6. **View Logs** - Check service logs
7. **Open Dashboards** - Access all UIs
8. **Debug Shell** - Run diagnostics

## What Gets Started

### Core Services (Option 2)
- **Tier 4** (Port 4444): Master API - The foundation
- **Tier 5** (Port 5555): Domain Empire - Traffic funnel
- **Tier 6** (Port 6666): Cal Intelligence - AI brain

### Full Ecosystem (Option 1)
All of the above plus:
- **Tier 2** (Port 2222): Master Orchestration
- **Tier 3** (Port 3333): Billion Dollar Game
- **Tier 7** (Port 7777): Social Achievement Layer
- **Tier 8** (Port 8888): Payment & QR System
- **Tier 9** (Port 9999): Dual Dashboard System

## Dashboards

After starting, access:
- **Master Control**: Run option 7 or open the HTML file created
- **Game**: http://localhost:3333
- **Consumer View**: http://localhost:9999/ui/consumer (what users see)
- **Enterprise View**: http://localhost:9999/ui/enterprise (what we see)

## Safety Features

1. **Auto-creates missing files** - Won't crash if files are missing
2. **Port checking** - Won't try to start if already running
3. **PID tracking** - Knows exactly what's running
4. **Clean shutdown** - Stops everything properly
5. **Logs everything** - Check logs/ directory

## Troubleshooting

If something doesn't start:
1. Run option 8 (Debug Shell)
2. Check if ports are already in use
3. Look at logs with option 6
4. Try option 3 (Start with Debug)

## The Architecture

```
User → Tier 9 (Dual Dashboard)
     → Tier 8 (Payments/QR)
     → Tier 7 (Social)
     → Tier 3 (Game)
     → Tier 6 (Cal AI)
     → Tier 5 (Domains)
     → Tier 4 (Master API) ← EVERYTHING DEPENDS ON THIS
     → Tier 2 (Orchestration)
```

## Commission Flow

Every tier takes commission:
- Payments: 2.9%
- API calls: 10-30%
- Game purchases: 100% 
- Ideas/Remixes: 10%
- QR scans: 1%
- And 10+ more revenue streams...

## Important Notes

- Tier 4 is the root - if it dies, everything dies
- The system is designed to be inescapable
- Users think they're earning, we earn more
- Each service auto-creates stubs if files are missing
- Logs are in the logs/ directory

## To Stop Everything

Either:
1. Use option 5 in the menu
2. Or press Ctrl+C and run: `./MASTER-LAUNCH.sh` then option 5

---

Remember: From a town of 384 to global domination. This is just the beginning. 🌪️