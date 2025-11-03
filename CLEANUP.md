# Cleanup: Remove Duplicate Auth Pages

## Problem
You have **9 auth pages** doing basically the same thing. This creates confusion and maintenance hell.

## Solution
Keep 2 pages, delete 7.

---

## Pages to KEEP

### 1. `auth-google.html` ✅
**Why:** Simple Google OAuth with One Tap auto-login
- Primary login method
- Best UX
- Works for 99% of users

### 2. `auth.html` ✅
**Why:** Advanced options for power users
- Ed25519 key generation (for crypto nerds)
- Import/export identity
- Fallback if Google is blocked

---

## Pages to DELETE

### QR Login Variants (Delete all 7):

1. ❌ `qr-gis-login.html`
2. ❌ `qr-fedcm-login.html`
3. ❌ `qr-google-login.html`
4. ❌ `qr-scanner-gist.html`
5. ❌ `qr-login-gist.html`
6. ❌ `qr-scanner.html`
7. ❌ `qr-login.html`

**Why delete:**
- QR login is built into `index.html` already
- Having 7 different QR implementations is insane
- Nobody uses cross-device QR login anyway
- Causes "QRCode is not defined" errors because of duplicate scripts

### Also consider deleting:

8. ❌ `login.html` (replaced by auth-google.html)

---

## How to Delete

### Option 1: Move to Archive (Recommended)

```bash
# Create archive folder
mkdir archive

# Move old auth pages
mv qr-*.html archive/
mv login.html archive/

# Keep in git history but out of the way
```

### Option 2: Delete Permanently

```bash
# Delete QR login variants
rm qr-gis-login.html
rm qr-fedcm-login.html
rm qr-google-login.html
rm qr-scanner-gist.html
rm qr-login-gist.html
rm qr-scanner.html
rm qr-login.html

# Delete old login page
rm login.html

# Commit
git add -A
git commit -m "Cleanup: Remove duplicate auth pages"
```

---

## After Cleanup

You'll have:

```
auth-google.html   ← Primary (Google OAuth + One Tap)
auth.html          ← Advanced (Ed25519 + Import/Export)
index.html         ← Has built-in QR login
```

**That's it. 3 pages instead of 10.**

---

## Update Links

Find any pages that link to deleted auth pages and update them:

### Find references:
```bash
grep -r "qr-login" *.html
grep -r "login.html" *.html
```

### Update to:
```html
<!-- Old -->
<a href="login.html">Login</a>
<a href="qr-login.html">QR Login</a>

<!-- New -->
<a href="auth-google.html">Login</a>
<a href="index.html">QR Login</a>  <!-- QR is built into index.html -->
```

---

## Benefits of Cleanup

**Before:**
- 10 auth pages
- User confused which one to use
- "QRCode is not defined" errors
- Duplicate code everywhere
- Maintenance nightmare

**After:**
- 2 auth pages (+ index.html for QR)
- Clear: Google OAuth or Advanced
- No QR library conflicts
- One source of truth
- Easy to maintain

---

## If You Need QR Login Later

Don't create a new page. QR login is already built into `index.html`:

**index.html already has:**
- QR code generation
- Session management
- Cross-device sync
- Phone verification

**To use it:**
1. Open `index.html`
2. It shows QR code automatically
3. Scan with phone
4. Phone opens `soulfra-auth.html?session=XXX`
5. Done

**Don't create qr-login-v8.html.** Use what's already there.

---

## Summary

| File | Action | Reason |
|------|--------|--------|
| auth-google.html | ✅ KEEP | Primary login |
| auth.html | ✅ KEEP | Advanced options |
| index.html | ✅ KEEP | Has QR already |
| qr-*.html (7 files) | ❌ DELETE | Duplicates |
| login.html | ❌ DELETE | Replaced by auth-google.html |

**After cleanup: 3 pages total.**

---

**This fixes the "QRCode is not defined" error by removing duplicate script loading.**
