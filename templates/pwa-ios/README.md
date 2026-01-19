# iOS PWA Template

This template creates a Progressive Web App that works perfectly on iOS devices (iPhone/iPad) and can be added to the home screen like a native app.

## Features

✅ **iOS Home Screen Install** - Add to home screen, works like native app
✅ **Standalone Mode** - Hides Safari UI, looks like real app
✅ **Offline Support** - Service worker caching
✅ **iOS Status Bar** - Proper status bar styling
✅ **Splash Screens** - Custom launch screens for all iOS devices
✅ **Touch Icons** - App icons for home screen
✅ **No Address Bar** - Full-screen experience

## Quick Start

### 1. Copy Template Files

```bash
cp -r templates/pwa-ios/* your-app/
```

### 2. Customize

Edit these files:
- `index.html` - Your app UI
- `manifest.json` - App name, colors, icons
- `sw.js` - Files to cache offline

### 3. Add Icons

Generate icons at https://realfavicongenerator.net

Required sizes:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)
- `apple-touch-icon.png` (180x180)

### 4. Test on iOS

1. Open Safari on iPhone/iPad
2. Navigate to your site
3. Tap Share → Add to Home Screen
4. Open from home screen → It's an app!

## Files Included

```
pwa-ios/
├── index.html          # Main app (customize this)
├── manifest.json       # PWA configuration
├── sw.js              # Service worker (offline support)
├── apple-touch-icon.png  # iOS home screen icon
├── icon-192.png       # Android icon
├── icon-512.png       # High-res icon
└── README.md          # This file
```

## Customization Guide

### App Name & Theme

Edit `manifest.json`:

```json
{
  "name": "Your App Name",
  "short_name": "App",
  "theme_color": "#667eea",
  "background_color": "#1a1a2e"
}
```

### Offline Files

Edit `sw.js` to cache your files:

```javascript
const urlsToCache = [
  './index.html',
  './styles.css',
  './app.js',
  './icon-192.png'
];
```

### iOS Status Bar

Edit `index.html` meta tags:

```html
<!-- black, black-translucent, or default -->
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

## iOS-Specific Features

### Splash Screens

For perfect iOS integration, add splash screens for each device:

```html
<!-- iPhone X/11/12/13 -->
<link rel="apple-touch-startup-image"
      media="(device-width: 375px) and (device-height: 812px)"
      href="splash-iphonex.png">

<!-- iPhone 8 Plus -->
<link rel="apple-touch-startup-image"
      media="(device-width: 414px) and (device-height: 736px)"
      href="splash-iphone8plus.png">
```

Generate at: https://appsco.pe/developer/splash-screens

### Disable Zoom (Optional)

```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
```

### Hide Address Bar on Scroll

Already included in template CSS.

## Testing Checklist

- [ ] App installs to home screen
- [ ] Icon displays correctly
- [ ] Opens in standalone mode (no Safari UI)
- [ ] Status bar styled correctly
- [ ] Works offline
- [ ] Splash screen shows (iOS 13+)
- [ ] No zoom on form inputs
- [ ] Smooth animations

## Common Issues

### Icon Not Showing
- Make sure `apple-touch-icon.png` is 180x180
- Clear Safari cache, try again

### Not Opening in Standalone
- Check `manifest.json` has `"display": "standalone"`
- Verify `apple-mobile-web-app-capable` is `yes`

### Service Worker Not Working
- Must be served over HTTPS (or localhost)
- Check browser console for errors

### Address Bar Still Visible
- Only hides in standalone mode (after adding to home screen)
- Regular Safari will always show address bar

## Deployment

Deploy like any static site:

```bash
# GitHub Pages
./templates/deploy-static.sh templates/pwa-ios yourapp

# Or manual
cd templates/pwa-ios
python3 -m http.server 8000
# Then use ngrok for public URL
```

## Examples

This template powers:
- `/chat/` - CALOS Chat PWA
- `/launcher/` - App launcher
- `/deathtodata/` - Search engine (after our update!)

## Resources

- [PWA on iOS](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Workers](https://developers.google.com/web/fundamentals/primers/service-workers)
- [iOS Safe Areas](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)

## License

MIT - Do whatever you want with it
