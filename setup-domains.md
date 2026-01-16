# 🌐 Domain Setup Guide

## Add Your Actual Domains to the Game

The emoji domain game needs your **real, owned domains** to work properly.

### Quick Start

**Add a domain:**
```bash
node api/domain-portfolio.js add soulfra.com creative
node api/domain-portfolio.js add cringeproof.com tech
```

**List all domains:**
```bash
node api/domain-portfolio.js list
```

**View today's puzzle:**
```bash
node api/daily-puzzle.js today
```

---

## Which Domains Should You Add?

### ✅ Add These:
- Domains you **actually own**
- Domains that are **live and working**
- Domains you want **traffic to**

### ❌ Don't Add:
- Example domains (ritual.com, playground.com)
- Domains you don't own
- Broken/expired domains

---

## Domain Categories

Choose from:
- `creative` - Art, design, creative projects
- `tech` - Technology, coding, SaaS
- `lifestyle` - Personal, wellness, lifestyle
- `business` - Professional, B2B
- `entertainment` - Games, fun, social
- `education` - Learning, teaching
- `other` - Everything else

---

## Example Setup

```bash
# Add soulfra.com (your main brand)
node api/domain-portfolio.js add soulfra.com creative

# Add cringeproof.com (your product)
node api/domain-portfolio.js add cringeproof.com tech

# Check what emojis they got
node api/domain-portfolio.js list

# See upcoming puzzles
node api/daily-puzzle.js upcoming 7
```

---

## What Happens After Adding?

Each domain gets:
- **Emoji Fingerprint** - Unique visual signature
- **Difficulty Rating** - Based on length/complexity
- **Category** - For hints and grouping
- **Puzzle Rotation** - Appears in daily puzzles

---

## Need Help?

**View domain details:**
```bash
node api/domain-portfolio.js show soulfra.com
```

**Remove a domain:**
```bash
node api/domain-portfolio.js delete ritual.com  # Remove example
```

**Check portfolio stats:**
```bash
node api/domain-portfolio.js summary
```

---

## Ready to Start?

1. List domains you actually own
2. Add them one by one
3. Check today's puzzle
4. Share with friends!

**The game will only use domains you add here.**
