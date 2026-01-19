# Icon Requirements

You need 3 icon files for the PWA to work properly on iOS:

## Required Icons

1. **icon-192.png** (192x192 pixels)
   - For Android and general PWA support

2. **icon-512.png** (512x512 pixels)
   - High-resolution version for Android

3. **apple-touch-icon.png** (180x180 pixels)
   - iOS home screen icon

## Quick Icon Generation

### Option 1: Online Generator (Easiest)

Visit https://realfavicongenerator.net
- Upload a square image (PNG, at least 512x512)
- Download the package
- Copy `icon-192.png`, `icon-512.png`, and `apple-touch-icon.png` to this directory

### Option 2: Manual Creation

Using any image editor (Photoshop, Figma, Canva, etc.):

1. Create a 512x512 square image with your logo/icon
2. Save as `icon-512.png`
3. Resize to 192x192, save as `icon-192.png`
4. Resize to 180x180, save as `apple-touch-icon.png`

### Option 3: Command Line (ImageMagick)

If you have ImageMagick installed:

```bash
# Start with a 512x512 icon
convert your-icon.png -resize 512x512 icon-512.png
convert your-icon.png -resize 192x192 icon-192.png
convert your-icon.png -resize 180x180 apple-touch-icon.png
```

## Icon Design Tips

- **Simple** - Works at small sizes
- **High contrast** - Stands out on home screen
- **Square** - iOS will round the corners automatically
- **No text** - Unless it's large and readable at 60x60
- **Padding** - Leave ~10% margin around edges

## Placeholder Icons

You can copy the existing icons from `/chat/`:

```bash
cp /Users/matthewmauer/Desktop/soulfra.github.io/chat/icon-192.png .
cp /Users/matthewmauer/Desktop/soulfra.github.io/chat/icon-512.png .
```

## Testing

After adding icons:
1. Open your PWA in Safari on iOS
2. Tap Share → Add to Home Screen
3. Check that your icon appears correctly
4. Launch from home screen to verify

## Advanced: Splash Screens (Optional)

For a polished iOS experience, add splash screens for different devices.

Generate at: https://appsco.pe/developer/splash-screens

Add to `index.html`:
```html
<link rel="apple-touch-startup-image"
      media="(device-width: 390px) and (device-height: 844px)"
      href="splash-iphone13.png">
```
