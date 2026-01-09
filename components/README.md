# Soulfra Component System

Reusable components for consistent UI across all Soulfra Network domains.

## Components

### Header.html
Universal navigation header with:
- Brand logo and name (auto-detects domain)
- Network navigation links
- Brands dropdown menu
- Mobile responsive menu
- Domain-specific theming

### Footer.html
Standard footer with:
- Network links (all 4 domains)
- Platform links (domains, waitlist, projects)
- Resources (GitHub, docs, privacy, terms)
- Auto-updating copyright year
- Backend info display (optional)
- Domain-specific theming

### Breadcrumb.html
Cross-domain navigation breadcrumbs:
- Loads brand-specific breadcrumb-nav.html
- Auto-detects current domain
- Fallback to local breadcrumb file

## Usage

### Method 1: Auto-load with data attributes (Recommended)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Page</title>
  <script src="/components/component-loader.js"></script>
</head>
<body>
  <!-- Components will be auto-loaded -->
  <div data-component="header"></div>

  <main>
    <div data-component="breadcrumb"></div>
    <!-- Your content here -->
  </main>

  <div data-component="footer"></div>
</body>
</html>
```

### Method 2: Programmatic loading

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Page</title>
  <script src="/components/component-loader.js"></script>
</head>
<body>
  <div id="header"></div>
  <main id="content"></main>
  <div id="footer"></div>

  <script>
    // Load components programmatically
    SoulfraComponents.load('header', '#header');
    SoulfraComponents.load('footer', '#footer');
  </script>
</body>
</html>
```

### Method 3: Direct HTML include (for simple pages)

```html
<!-- Include directly via iframe or server-side include -->
<iframe src="/components/Header.html" frameborder="0" style="width:100%"></iframe>
```

## Theming

Components automatically detect the current domain and apply appropriate theming:

```javascript
// Automatically set by component loader
document.body.setAttribute('data-brand', 'calriven'); // or cringeproof, deathtodata, soulfra
```

### Brand Colors

- **Calriven**: Blue (#3b82f6) 📊
- **CringeProof**: Pink/Purple (#FF006E) 🎭
- **DeathToData**: Red (#ef4444) 🔥
- **Soulfra**: Purple (#667eea) 💜

## Configuration

### Backend Info (Optional)

Set backend configuration in your page for display in footer:

```html
<script>
window.SOULFRA_CONFIG = {
  backend: 'https://192.168.1.87:5001',
  prefix: 'cp_'
};
</script>
```

## Component API

### SoulfraComponents.load(name, target, options)

Load a specific component.

```javascript
// Load header into #header-container
await SoulfraComponents.load('header', '#header-container');

// Load with options
await SoulfraComponents.load('footer', '#footer', {
  noCache: true  // Skip cache, always fetch fresh
});
```

### SoulfraComponents.loadAll()

Load all components with `data-component` attribute.

```javascript
await SoulfraComponents.loadAll();
```

### SoulfraComponents.preload(names)

Preload components for faster subsequent loads.

```javascript
// Preload header and footer
await SoulfraComponents.preload(['header', 'footer']);
```

### SoulfraComponents.isLoaded(name)

Check if a component is loaded.

```javascript
if (SoulfraComponents.isLoaded('header')) {
  console.log('Header is loaded!');
}
```

### SoulfraComponents.clearCache(name)

Clear cache for a component.

```javascript
SoulfraComponents.clearCache('header'); // Clear specific component
SoulfraComponents.clearCache('all');    // Clear all cache
```

## Events

Components emit custom events when loaded:

```javascript
window.addEventListener('soulfra:component:loaded', (event) => {
  const { name, target } = event.detail;
  console.log(`Component "${name}" loaded into:`, target);
});
```

## Mobile Responsiveness

All components are fully responsive:
- Header: Collapsible hamburger menu on mobile
- Footer: Stacked sections on mobile
- Breadcrumb: Grid layout adapts to screen size

## Browser Support

- Chrome/Edge: ✅ Latest
- Firefox: ✅ Latest
- Safari: ✅ Latest
- Mobile browsers: ✅ iOS Safari, Chrome Mobile

## Files

- `Header.html` - Navigation header component
- `Footer.html` - Footer component
- `Breadcrumb.html` - Breadcrumb navigation component
- `component-loader.js` - Component loading system
- `README.md` - This file

## Examples

See example usage in:
- `/index.html` - Main landing page
- `/cringeproof/index.html` - CringeProof domain
- `/calriven/index.html` - Calriven domain
- `/deathtodata/index.html` - DeathToData domain
- `/soulfra/index.html` - Soulfra domain

## Development

To modify components:

1. Edit the component HTML file
2. Clear cache: `SoulfraComponents.clearCache('all')`
3. Reload page to see changes

For production, components are cached for performance.
