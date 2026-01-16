# Digital Twin System

Terminal-style digital twin creation (no emojis, Lynx aesthetic).

## What This Is

Create talking avatar videos from:
- 1 face photo
- 1 voice sample (30+ seconds)

Result: Digital twin that talks like you

## Workflow

```
Step 1: Test with fake avatar
  ./test-twin.sh
  → Uses art_0.png (not your face)
  → Proves it works

Step 2: Create YOUR twin
  Upload YOUR photo
  Record YOUR voice
  → Your digital twin

Step 3: Get QR code
  Twin gets unique ID
  → soulfra.github.io/twin/:id
  → Scannable QR code

Step 4: Deploy
  Business card with QR
  Voice review system
  AI customer service
```

## Quick Start

```bash
# Test it works (fake avatar)
./test-twin.sh

# Or manually:
python3 test-video-simple.py \
  api/vision/SadTalker/examples/source_image/art_0.png \
  api/vision/SadTalker/examples/driven_audio/RD_Radio31_000.wav

# Check result
open api/vision/SadTalker/results/*/art_0*.mp4
```

## Files

```
digital-twin-notebook.html  - Web interface (terminal aesthetic)
test-twin.sh                - Test runner
test-video-simple.py        - Python wrapper for SadTalker
api/unified-backend-v2.js   - Backend API
api/vision/SadTalker/       - Video generation engine
```

## API Endpoints

```
POST /api/vision/identify    - Object recognition (llava)
POST /api/video/generate     - Generate talking video
GET  /api/video/status/:id   - Check generation progress
POST /api/qr/generate        - Generate QR code
```

## Architecture

```
Image + Audio
   ↓
SadTalker (3DMM + Face Renderer)
   ↓
MP4 Video (1-3MB)
   ↓
Account ID → QR Code
   ↓
soulfra.github.io/twin/:id
```

## Test vs Production

**Test (fake avatar):**
- Image: `art_0.png` (example)
- Audio: `RD_Radio31_000.wav` (example)
- Privacy: No real face/voice

**Production (your twin):**
- Image: YOUR photo
- Audio: YOUR voice (30+ sec)
- Result: Looks/sounds like YOU

## QR Code System

Each twin → unique ID → QR code

```
soulfra.github.io/twin/abc123
                         ↓
                   [QR Code]
                         ↓
              Scan → Load twin profile
```

Use cases:
- Digital business cards
- Voice reviews (businesses)
- AI customer service
- Personal branding

## Voice Review Platform (Original Goal)

```
Business gets QR code
   ↓
Customer scans
   ↓
Records voice review
   ↓
Business twin responds
   ↓
Automated customer engagement
```

## Terminal Aesthetic (Lynx-style)

- No emojis
- ASCII only
- Monospace font
- Green on black (optional)
- Text-based navigation
- Like gopher/Lynx browsers

## Next Steps

1. Run `./test-twin.sh` (proves it works)
2. Create your twin (your photo + voice)
3. Add account/ID system
4. Generate QR codes
5. Deploy to soulfra.github.io
6. Build voice review platform

## Dependencies

- Python 3.9 (SadTalker venv)
- Node.js (backend API)
- Ollama + llava (object recognition)
- QR code generator (already exists)

## Deployment

```bash
# Servers
http://localhost:8000  - Static files
http://localhost:5050  - Backend API

# Production
soulfra.github.io - GitHub Pages
```

## Architecture Notes

Like image filters, but for AI:
- Image filter: Change how photo looks
- AI twin filter: Your face → talking avatar

Like text-based web (Lynx/gopher):
- Terminal interface
- No fancy UI
- Just what works
- Compile to QR codes/UPCs

## Status

**Working:**
- SadTalker video generation (1.5MB MP4)
- llava object recognition (Ollama)
- QR code infrastructure

**Not Yet:**
- Account/ID system
- Twin profile pages
- Voice review platform

**FIRST:** Run ./test-twin.sh to prove it works
