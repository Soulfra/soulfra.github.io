# DeathToData

Search without surveillance. Deal with it, Google.

**Category**: Privacy Search

## Deployment

This site is deployed to GitHub Pages.

Domain: https://deathtodata.com

## Architecture

- **Static Site**: GitHub Pages (free)
- **API Server**: api.soulfra.com (shared)
- **Database**: SQLite on API server

## Build

Generated from Soulfra multi-site generator:
```bash
python3 export_static.py --brand deathtodata
```
