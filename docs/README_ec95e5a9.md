# 🪞 Soulfra Mirror Shell

A unified frontend shell for the Soulfra platform with a single theme and clean routing.

## Features

✅ **Single Page Application** with hash-based routing
✅ **Unified CSS Theme** - One consistent dark theme across all components
✅ **Component System**:
- WhisperUI - Create and submit whispers
- StreamViewer - Live consciousness stream visualization
- MarketplaceGrid - Browse and purchase loops
- LoopNarrator - Mythic narration overlays
- MaskRenderer - Choose your mythic mask
- LoopForkUI - Fork loops with QR export

✅ **Clean Routes**:
- `/` → Home page with "Choose a Loop or Whisper"
- `#/stream` → Live stream overlay
- `#/drop/:id` → QR summon + loop info
- `#/marketplace` → Loop marketplace
- `#/whisper` → Whisper creation interface

## Quick Start

1. **Make sure backend is running on port 7777:**
   ```bash
   # Check if something is running
   lsof -i :7777
   ```

2. **Start the Mirror Shell:**
   ```bash
   cd mirror-shell
   ./start.sh
   ```
   
   Or manually:
   ```bash
   cd mirror-shell
   python3 -m http.server 9999
   ```

3. **Open in browser:**
   ```
   http://localhost:9999
   ```

## Architecture

```
mirror-shell/
├── index.html          # Main app with routing
├── style.css           # Unified theme (single CSS file)
├── components/         # Modular UI components
│   ├── WhisperUI.js
│   ├── StreamViewer.js
│   ├── MarketplaceGrid.js
│   ├── LoopNarrator.js
│   ├── MaskRenderer.js
│   └── LoopForkUI.js
├── assets/             # Icons and images
├── manifest.json       # PWA manifest
└── start.sh           # Quick start script
```

## How It Works

1. **Single Entry Point**: `index.html` loads all components and handles routing
2. **Hash-Based Routing**: No server-side routing needed, works with any static host
3. **API Proxy**: All data requests go to `http://localhost:7777`
4. **Component Loading**: Each component is self-contained with its own styles
5. **Stream Updates**: Polls `/radio/stream.txt` for live updates

## Customization

### Change API Endpoint
Edit `index.html` and update:
```javascript
apiBase: 'http://localhost:7777'
```

### Modify Theme Colors
Edit `style.css` root variables:
```css
:root {
    --primary-purple: #8B43F7;
    --cyan-accent: #4ECDC4;
    /* etc... */
}
```

### Add New Routes
In `index.html`, add to the switch statement:
```javascript
case 'newroute':
    this.loadNewRoute();
    break;
```

## Features in Action

### Whisper Creation
- Voice input support (if browser allows)
- Emotional tone selection
- Real-time preview

### Live Stream
- Canvas visualization of consciousness data
- Real-time message updates
- Statistics display

### Marketplace
- Filter by category, price, blessed status
- Detailed loop information
- Multiple license options

### Loop Narration
- Cal and Arty provide ambient narration
- Event-based announcements
- Mythic atmosphere

### Mask System
- Choose from 6 mythic masks
- Each mask provides unique abilities
- Visual filters applied to entire app

### Fork Interface
- Create experimental or public forks
- QR code generation
- Export fork seeds

## Troubleshooting

**Backend not responding?**
- Make sure port 7777 is running
- Check CORS settings on backend

**Components not loading?**
- Open browser console for errors
- Ensure all JS files are present

**Stream not updating?**
- Check `/radio/stream.txt` endpoint
- Verify backend is generating stream data

## Development

To add a new component:

1. Create `components/NewComponent.js`
2. Include in `index.html`:
   ```html
   <script src="components/NewComponent.js"></script>
   ```
3. Add initialization in routing logic

The mirror shell is designed to be simple, unified, and easy to extend!