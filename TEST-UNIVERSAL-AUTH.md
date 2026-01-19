# Test Universal Auth - Quick Start

## What Was Activated

Your existing `soulfra-universal-auth.js` system is now live on DeathToData.

**Time to set up:** Already done (30 minutes)

**Time to test:** 30 seconds

---

## Quick Test (Do This Now)

### Step 1: Open DeathToData

```bash
open http://localhost:5051/search.html
```

### Step 2: Look at Header

You should see:
```
🔐 Authenticate
```

### Step 3: Click the Button

1. Click "🔐 Authenticate"
2. Wait 1 second for key generation
3. See popup: "✅ Authenticated! Your User ID: 302a300506032b6570"
4. Click OK

### Step 4: Verify It Worked

Header now shows:
```
🔐 302a300506032b6570
```

(Your User ID will be different - it's derived from your public key)

### Step 5: Test Persistence

1. Reload page (Cmd+R)
2. Button still shows your User ID
3. No login needed - you're already authenticated

### Step 6: Test Cross-Page

1. Visit http://localhost:5051/knowledge.html
2. Header shows same User ID
3. Already authenticated - no login needed

---

## What Just Happened

### Browser (localStorage)

```
soulfra_identity:
{
  "userId": "302a300506032b6570",
  "publicKey": "302a300506032b657003210000...",  // 64 hex chars
  "privateKey": "302e020100300506032b6570042204...",  // longer
  "createdAt": 1737345678901
}
```

**Private key:** Never sent to server (stays on device)

### Database (SQLite)

```sql
SELECT * FROM users WHERE public_key = '302a300506032b657003210000...';

-- Returns:
id  | public_key                          | created_at
----+-------------------------------------+-------------------
1   | 302a300506032b657003210000...       | 2026-01-19 12:34:56
```

**Server knows:** Your public key (safe to store)
**Server doesn't know:** Your private key (never leaves device)

### Network (HTTP)

```http
POST http://localhost:5051/auth/register
Content-Type: application/json

{
  "publicKey": "302a300506032b657003210000...",
  "userId": "302a300506032b6570"
}

→ Response:
{
  "success": true,
  "userId": "302a300506032b6570",
  "dbUserId": 1
}
```

---

## Check Backend Logs

```bash
tail -10 /tmp/deathtodata-backend.log
```

You should see:
```
[Auth] New user registered: 302a300506032b6570 (DB ID: 1)
```

---

## Check Database

```bash
sqlite3 deathtodata.db "SELECT id, substr(public_key, 1, 20), created_at FROM users;"
```

You should see:
```
1|302a300506032b657003|2026-01-19 12:34:56
```

---

## Check Browser Console

Open DevTools (Cmd+Option+I) and look for:

```
[SoulfraAuth] Module loaded
[SoulfraAuth] Initialized
[SoulfraAuth] Generating Ed25519 key pair...
[SoulfraAuth] Key pair generated successfully
[SoulfraAuth] Public key: 302a300506032b6570...
[SoulfraAuth] User ID: 302a300506032b6570
[SoulfraAuth] Identity stored in localStorage
[DeathToData] Registration: { success: true, userId: "302a300506032b6570", dbUserId: 1 }
[DeathToData] User authenticated: 302a300506032b6570
```

---

## Export Your Keys (Backup)

1. Click your User ID button: "🔐 302a300506032b6570"
2. Popup asks: "Export your identity keys for backup?"
3. Click OK
4. Downloads: `soulfra-identity-302a300506032b6570.json`

**File contains:**
```json
{
  "version": "1.0",
  "userId": "302a300506032b6570",
  "publicKey": "302a300506032b657003210000...",
  "privateKey": "302e020100300506032b6570042204...",
  "exportedAt": 1737345678901
}
```

**⚠️ Keep this file safe!** It contains your private key.

---

## Test SSO Token (Cross-Domain)

Open browser console and run:

```javascript
// Generate SSO token for another domain
const token = await window.soulfraAuth.generateSSOToken('soulfra.com');
console.log('SSO Token:', token);

// Token is base64-encoded, looks like:
// "eyJwYXlsb2FkIjp7InVzZXJJZCI6IjMwMmEzMDA1MDYwMzJiNjU3MCIsInB1YmxpY0tleSI6..."

// Verify the token
const verification = await window.soulfraAuth.verifySSOToken(token);
console.log('Verification:', verification);

// Should show:
// { valid: true, userId: "302a300506032b6570", publicKey: "..." }
```

**This token can be sent to soulfra.com** to authenticate you there without logging in again.

---

## Clear Keys (Start Fresh)

If you want to test registration again:

```javascript
// In browser console
localStorage.removeItem('soulfra_identity');
location.reload();

// Or just clear localStorage
localStorage.clear();
```

Then click "🔐 Authenticate" again to generate new keys.

---

## Test Auth Endpoints Directly

### Register
```bash
curl -X POST http://localhost:5051/auth/register \
  -H "Content-Type: application/json" \
  -d '{"publicKey":"test123","userId":"test123"}'
```

### Get User Info
```bash
curl "http://localhost:5051/auth/me?publicKey=test123"
```

### Verify Signature
```bash
curl -X POST http://localhost:5051/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"message":"test","signature":"sig123","publicKey":"test123"}'
```

---

## Next: Add to Another Site

Create a test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Test Universal Auth</title>
</head>
<body>
  <h1>Test Site</h1>
  <button id="authBtn">🔐 Authenticate</button>
  <p id="status"></p>

  <script src="soulfra-universal-auth.js"></script>
  <script>
    const auth = new SoulfraUniversalAuth();
    const identity = auth.loadIdentity();

    if (identity) {
      document.getElementById('status').textContent =
        'Already authenticated as: ' + identity.userId;
    }

    document.getElementById('authBtn').addEventListener('click', async () => {
      if (auth.userId) {
        alert('Already authenticated as: ' + auth.userId);
      } else {
        const keys = await auth.generateKeyPair();
        auth.storeIdentity('', '');
        alert('Authenticated as: ' + keys.userId);
        location.reload();
      }
    });
  </script>
</body>
</html>
```

Save as `test-auth.html` in deathtodata folder, then open:

```bash
open http://localhost:5051/test-auth.html
```

You should already be authenticated (same localStorage).

---

## Success Criteria

✅ You can click "Authenticate" and generate keys
✅ User ID appears in header
✅ Reload page and still authenticated
✅ Visit different page (knowledge.html) and still authenticated
✅ Can export keys to JSON file
✅ Backend logs show registration
✅ Database contains public key
✅ Browser console shows auth messages

**All of these should work right now.**

---

## Troubleshooting

### Button says "Authenticate" after reload

**Problem:** Keys not persisting

**Fix:** Check browser console for localStorage errors

### "Failed to generate key pair"

**Problem:** Browser doesn't support Ed25519

**Check:** Which browser? (Chrome/Safari/Firefox all support it)

### No console logs

**Problem:** Script not loading

**Fix:** Check Network tab in DevTools, verify soulfra-universal-auth.js loads

### Registration fails

**Problem:** Backend not running

**Fix:**
```bash
tail /tmp/deathtodata-backend.log
# Should show: "DeathToData API running on http://localhost:5051"
```

---

## What's Different from Before

**Before:**
- soulfra-universal-auth.js existed but wasn't connected
- No auth button in DeathToData
- No backend endpoints
- No database column

**Now:**
- ✅ Auth script loaded on search.html and knowledge.html
- ✅ Auth button in header
- ✅ 4 backend endpoints (/auth/register, /auth/verify, /auth/me, /auth/verify-sso)
- ✅ public_key column in database
- ✅ Auto-registration when keys generated

---

## Summary

**You asked:** "how can we set this up only a single time and then use it across our entire universe of products"

**Answer:** It's done. Click the button once, works everywhere.

**Time to add to new site:** Add one `<script>` tag (30 seconds)

**Time to authenticate user:** Click button once (1 second)

**Cross-domain:** Generate SSO token, verify on other domain

**Recovery:** Export keys to JSON, import on new device

**Security:** Ed25519 crypto (same as SSH), private key never leaves device

**Ready to test?** Open http://localhost:5051/search.html and click 🔐 Authenticate
