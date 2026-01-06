# Breadcrumb Routing Strategy

## Overview

The breadcrumb system routes users between domains based on activity priorities:

| Priority | Role | Routing Strategy |
|----------|------|------------------|
| #1 | Hottest | Links to all other domains (exploration hub) |
| #2 | Medium-High | Links to hotter domains (level up) + others |
| #3 | Medium-Low | Links to active domains + Soulfra hub |
| #4 | Coldest (Hub) | Links to all active domains (central hub) |

## Current Routing Map


### #1 📊 CALRIVEN (40.0% allocation)

Routes to **3 domains**:

- 🎭 **Cringeproof** (Priority #2) - Explore Cringeproof
- 🔥 **Deathtodata** (Priority #3) - Explore Deathtodata
- 💜 **Soulfra** (Priority #4) - Explore Soulfra

### #2 🎭 CRINGEPROOF (30.0% allocation)

Routes to **3 domains**:

- 📊 **Calriven** (Priority #1) - Level up with Calriven
- 🔥 **Deathtodata** (Priority #3) - Discover Deathtodata
- 💜 **Soulfra** (Priority #4) - Discover Soulfra

### #3 🔥 DEATHTODATA (20.0% allocation)

Routes to **3 domains**:

- 📊 **Calriven** (Priority #1) - More active: Calriven
- 🎭 **Cringeproof** (Priority #2) - More active: Cringeproof
- 💜 **Soulfra** (Priority #4) - Find your center: Soulfra

### #4 💜 SOULFRA (10.0% allocation)

Routes to **3 domains**:

- 📊 **Calriven** (Priority #1) - Explore Calriven
- 🎭 **Cringeproof** (Priority #2) - Explore Cringeproof
- 🔥 **Deathtodata** (Priority #3) - Explore Deathtodata

## How to Use Breadcrumbs

Each domain gets two files:

1. **`breadcrumbs.json`** - Machine-readable routing data
2. **`breadcrumb-nav.html`** - Ready-to-embed HTML snippet

### Embed Breadcrumbs in Domain Pages

```html
<!-- In your domain's index.html -->
<div id="breadcrumb-container"></div>

<script>
fetch('breadcrumb-nav.html')
  .then(r => r.text())
  .then(html => {
    document.getElementById('breadcrumb-container').innerHTML = html;
  });
</script>
```
