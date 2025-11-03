
# 📁 PRD: mkdirpBootstrapPatch.js

## Purpose:
Ensure every script or daemon auto-creates required folders before file access. Prevents `ENOENT` errors due to missing directories.

---

## Logic:
```js
const mkdirp = require('mkdirp');
const fs = require('fs');

['./loop/', './agents/', './logs/', './config/', './memory/'].forEach(dir => {
  mkdirp.sync(dir);
});
```

## Integrate With:
- All entry daemons
- `install-soulfra-kit.sh`
- `SoulfraSelfLaunchController.js`
