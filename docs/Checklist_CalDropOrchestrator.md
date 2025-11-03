
# ✅ Cal Drop Reflection Layer — Implementation Checklist

## Core Routing

- [ ] File watcher running
- [ ] Router classifies files (.md, .js, .json)
- [ ] Claude daemon formats prompt correctly
- [ ] Claude CLI responses parsed + stored

## Git Integration

- [ ] Git enabled locally
- [ ] Pushes logged to Git with commit messages
- [ ] Remote sync (optional)
- [ ] Git diffs logged to loop bundle

## Reflection Logging

- [ ] `/ledger/loop_reflections.json` writes correctly
- [ ] All processed files logged with tone + timestamp
- [ ] Reflected code saved in `/docs/reflections/`

## Extras

- [ ] Claude prompt splitter works
- [ ] Claude job can route `.md` to `/docgen/`
- [ ] Public loop visibility connected (QR / portal)
- [ ] Error handling clean in `/drop/errors/`

## Final Check

- [ ] All routed files build clean
- [ ] Runtime doesn’t hang or timeout
- [ ] Git + Claude sync with no divergence
