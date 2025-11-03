# Cal Auto-Fix System

## What This Does

Automatically applies code fixes to your HTML files using minimal patch files. No more copy/pasting from 200-line guides.

## Usage

### Simple Command

```bash
cd projects/soulfra.github.io
cal apply fixes
```

Or directly:

```bash
../../bin/cal-apply-fixes
```

## What Gets Fixed

### 1. QRCode Race Condition (`index.html`)
- **Problem**: "QRCode is not defined" error
- **Fix**: Adds `waitForQRCode()` helper function (minimized to 1 line)
- **Size**: +385 bytes

### 2. File Upload Button (`auth.html`)
- **Problem**: Upload button not clickable
- **Fix**: Adds `pointer-events: none` + CSS tweaks
- **Size**: +197 bytes

### 3. One Tap Auto-Login (`auth-google.html`)
- **Problem**: Manual login required (no auto-login from Chrome accounts)
- **Fix**: Enables Google One Tap with `auto_select: true`
- **Size**: +774 bytes

**Total added**: ~1.4KB across 3 files

## How It Works

### Minimized Patch Files

Instead of verbose fix guides:
- `fixes/qrcode.patch` - 10 lines (was 144 lines in FIX-QRCODE-ERROR.md)
- `fixes/upload.patch` - 8 lines (was 172 lines in FIX-FILE-UPLOAD.md)
- `fixes/autologin.patch` - 15 lines (was 227 lines in FIX-AUTO-LOGIN.md)

### Smart Application

The `cal-apply-fixes` script:
1. Checks if fixes already applied (idempotent)
2. Creates timestamped backups (`backups/`)
3. Applies patches surgically (finds exact locations)
4. Reports size changes
5. Exits with error code if something fails

### Backup System

All originals saved to:
```
backups/
  index.html.2025-10-27T12-44-23.bak
  auth.html.2025-10-27T12-44-23.bak
  auth-google.html.2025-10-27T12-44-23.bak
```

## Integration with Cal System

### Cal Command

Now supports:
```bash
cal apply fixes    # Apply all fixes
cal fix all        # Same thing
```

### CALOS Agent Router

Works from parent directory:
```bash
cd ~/Desktop/CALOS_ROOT/agent-router
./bin/cal-apply-fixes
```

### Future Extensions

Easy to add new fixes:
1. Create `fixes/newfix.patch`
2. Add fix function to `bin/cal-apply-fixes`
3. Add to `fixes` array
4. Done

## Verification

### Test Fixes Applied

```bash
# Check if waitForQRCode exists
grep -n "waitForQRCode" index.html

# Check if pointer-events added
grep -n "pointer-events: none" auth.html

# Check if One Tap enabled
grep -n "auto_select: true" auth-google.html
```

### Restore from Backup

If something breaks:
```bash
cp backups/index.html.*.bak index.html
cp backups/auth.html.*.bak auth.html
cp backups/auth-google.html.*.bak auth-google.html
```

## Next Steps

### 1. Test in Browser

```bash
open index.html
# Should NOT see "QRCode is not defined" error
# QR code should generate successfully
```

### 2. Test File Upload

```bash
open auth.html
# Click "Import" tab
# Click upload area
# File picker should open
```

### 3. Get Google Client ID

Follow `SETUP-GOOGLE-OAUTH.md`:
1. Go to console.cloud.google.com
2. Create OAuth Client ID
3. Replace `YOUR_GOOGLE_CLIENT_ID` in auth-google.html
4. Test One Tap auto-login

### 4. Test One Tap

```bash
open auth-google.html
# If logged in to Chrome:
# - One Tap popup should appear in top-right
# - Click your account
# - Should auto-login without button click
```

## Philosophy

### Minimalist Approach

- **Old way**: 200-line markdown guides, manual copy/paste
- **New way**: 10-line patch files, automatic application
- **Result**: Same fixes, 95% less code to read

### Cal's "Death to Data" Philosophy

From `lib/cal-death-to-data.js`:
- Kill bad ideas early
- Find problems before customers do
- Stress-test assumptions

Applied here:
- Kill manual fixes (error-prone)
- Find code locations automatically
- Stress-test with backups

### Zero Trust

- Creates backups (don't trust patches)
- Checks if already applied (don't trust state)
- Reports exact changes (don't trust "it worked")
- Exits with error code (don't trust success)

## Technical Details

### How Patches Work

Each patch is parsed and applied surgically:

**QRCode Fix:**
1. Find `async function generateQRCode()`
2. Insert helper function before it
3. Find `sessionId = crypto.randomUUID()`
4. Insert `await waitForQRCode()` after it

**Upload Fix:**
1. Find `.file-upload {` style block
2. Add properties before closing brace
3. Find `.file-upload:hover` block end
4. Insert new rules after it

**Auto-Login Fix:**
1. Find `googleAuth.renderButton('g_id_signin')`
2. Insert One Tap initialization code after it

### Error Handling

Script checks:
- ✓ Running from correct directory
- ✓ Target files exist
- ✓ Can create backups
- ✓ Can find insertion points
- ✓ Changes actually applied

If any check fails:
- Prints clear error message
- Exits with code 1
- Doesn't touch other files

## Comparison

### Before (Manual)

```bash
# Read 200-line guide
cat FIX-QRCODE-ERROR.md

# Find code in 700-line file
grep -n "generateQRCode" index.html

# Copy helper function
# Paste at line 737
# Copy await line
# Paste at line 749
# Hope you got it right
```

### After (Automatic)

```bash
cal apply fixes
# Done in 0.5 seconds
```

## Files Created

```
projects/soulfra.github.io/
  fixes/
    qrcode.patch           ← 10 lines (was 144)
    upload.patch           ← 8 lines (was 172)
    autologin.patch        ← 15 lines (was 227)

  backups/
    *.bak                  ← Safety backups

  CAL-AUTO-FIX-SYSTEM.md   ← This file

../../bin/
  cal-apply-fixes          ← Auto-apply script (250 lines)
  cal                      ← Updated with "apply fixes" command
```

## Benefits

1. **Speed**: 0.5 seconds vs 10 minutes
2. **Accuracy**: Surgical insertion vs manual copy/paste
3. **Reversible**: Timestamped backups
4. **Idempotent**: Safe to run multiple times
5. **Minimal**: 33 lines of patches vs 543 lines of guides
6. **Integrated**: Works with Cal + CALOS Agent Router

## Future

### Planned Additions

- `cal revert fixes` - Restore from backups
- `cal check fixes` - Verify all fixes applied
- `fixes/cleanup.patch` - Auto-delete 7 QR pages (from CLEANUP.md)
- Git integration - Auto-commit after applying

### AI Integration

Could connect to:
- Cal's Wake Word Router
- Multi-LLM Router
- Agent Selector

Allow:
```bash
cal "fix the upload button"
# Routes to cal-apply-fixes automatically
```

---

**Built by Cal to minimize code and maximize speed.**
