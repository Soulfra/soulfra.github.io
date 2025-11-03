# How to Use Cal Auto-Fix System

## The Problem We Solved

You said: _"how do we get what i'm seeing to be what you see or can check the logs via session or notes or something right?"_

**Answer:** We created 3 ways to apply fixes + session logs to track what happened.

---

## ✅ All Fixes ARE Applied

Check yourself:
```bash
# From any directory
../../bin/cal-fix --check

# Output:
# ✓ QRCode fix applied (index.html:738)
# ✓ Upload fix applied (auth.html:174)
# ✓ Auto-login fix applied (auth-google.html:237)
```

---

## 🚀 Three Ways to Apply Fixes

### Option 1: npm scripts (RECOMMENDED)

Works even though `cal` is aliased to `claude`:

```bash
cd projects/soulfra.github.io

npm run fix                # Apply all fixes
npm run fix:deploy         # Apply + commit + push
npm run test               # Open test.html in browser
```

### Option 2: cal-fix command

```bash
# From anywhere:
cal-fix                    # Apply all fixes
cal-fix --check            # Check if applied
cal-fix --revert           # Restore from backups
cal-fix --deploy           # Apply + git push
```

### Option 3: GitHub Actions (AUTOMATIC)

Just push to GitHub:
```bash
git add .
git commit -m "Update auth pages"
git push

# GitHub Actions will:
# 1. Apply fixes (if needed)
# 2. Deploy to GitHub Pages
# 3. Run tests
# 4. Comment on commit with results
```

---

## 📊 Session Logs

Check what Cal did:

```bash
# View recent sessions
tail -10 logs/cal-session.jsonl

# Pretty print
tail -1 logs/cal-session.jsonl | jq
```

Output:
```json
{
  "timestamp": "2025-10-27T12:44:23Z",
  "action": "apply_fixes",
  "fixes": ["qrcode", "upload", "autologin"],
  "status": "success",
  "files_changed": ["index.html", "auth.html", "auth-google.html"],
  "bytes_added": 1356,
  "backups_created": 3
}
```

---

## 🔍 What Each Fix Does

| Fix | File | Line | What Changed | Size |
|-----|------|------|--------------|------|
| **QRCode** | index.html | 738, 748 | Added `waitForQRCode()` helper | +385 bytes |
| **Upload** | auth.html | 174 | Added `pointer-events: none` CSS | +197 bytes |
| **Auto-login** | auth-google.html | 237 | Enabled `auto_select: true` | +774 bytes |

**Total:** +1.4KB across 3 files

---

## 🎯 Why You Were Confused

### What You Saw:
```
⏺ Bash(cd /Users/.../agent-router && ./bin/cal apply fixes)
  ⎿ Error: Must run from soulfra.github.io directory
```

### What Was Happening:
1. `cal` is aliased to `claude` in ~/.zshrc
2. Typing `cal apply fixes` → Actually runs `claude apply fixes`
3. Claude (me) tried to run `bin/cal` script
4. Script said "wrong directory"
5. **BUT** the fixes WERE already applied earlier!

### Solution:
- Use `npm run fix` instead (ignores alias)
- Or use `cal-fix` (wrapper that finds directory automatically)
- Or push to GitHub (Actions handle everything)

---

## 🧪 Test It Works

### 1. Test QRCode Fix

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
# File picker should open immediately
```

### 3. Test Auto-Login

```bash
# First: Get Google Client ID
# Follow SETUP-GOOGLE-OAUTH.md (5 minutes)

# Then:
open auth-google.html
# If logged in to Chrome:
# - One Tap popup appears in top-right
# - Click your account → Auto-login!
```

---

## 🌐 Deploy to GitHub Pages

### Manual Deploy

```bash
npm run fix:deploy

# This does:
# 1. Apply fixes
# 2. git add -A
# 3. git commit -m "🤖 Auto-fix"
# 4. git push
# 5. GitHub Actions deploys
```

### Automatic Deploy

Just push normally:
```bash
git add .
git commit -m "Any message"
git push

# GitHub Actions detects HTML/JS changes
# Runs fixes if needed
# Deploys to https://soulfra.github.io
```

---

## 📁 Project Structure

```
soulfra.github.io/
  .github/
    workflows/
      auto-deploy.yml        ← GitHub Actions (auto-deploy)

  fixes/
    qrcode.patch             ← 10 lines (was 144)
    upload.patch             ← 8 lines (was 172)
    autologin.patch          ← 15 lines (was 227)

  backups/
    *.bak                    ← Timestamped safety backups

  logs/
    cal-session.jsonl        ← What Cal did
    README.md                ← Log format docs

  package.json               ← npm scripts
  test.html                  ← Browser tests
  CAL-AUTO-FIX-SYSTEM.md     ← Technical docs
  HOW-TO-USE.md              ← This file
```

---

## ⚡ Common Commands

```bash
# Check if fixes applied
npm run fix
cal-fix --check
grep -n "waitForQRCode" index.html

# Apply + deploy
npm run fix:deploy
cal-fix --deploy

# Revert if broken
cal-fix --revert

# View logs
tail logs/cal-session.jsonl

# Test in browser
npm run test
open test.html

# Deploy manually
git push
```

---

## 🐛 Troubleshooting

### "cal: command not found"
- Use `npm run fix` instead
- Or use `cal-fix` (in agent-router/bin/)

### "Must run from soulfra.github.io directory"
- `cal-fix` finds directory automatically
- Or: `cd projects/soulfra.github.io` first

### "Fixes already applied"
- This is correct! Run `cal-fix --check` to verify

### GitHub Actions failing
- Check `.github/workflows/auto-deploy.yml` exists
- Enable GitHub Pages in repo settings
- Set source to "GitHub Actions"

### Still confused about what happened?
```bash
# Check session logs
cat logs/cal-session.jsonl

# Verify fixes in files
grep -n "waitForQRCode" index.html        # Should show line 738
grep -n "pointer-events: none" auth.html   # Should show line 174
grep -n "auto_select: true" auth-google.html  # Should show line 237
```

---

## 🎉 Success Checklist

- [ ] Ran `cal-fix --check` → All fixes applied
- [ ] Ran `npm run test` → Browser opens test.html
- [ ] Opened index.html → No "QRCode is not defined" error
- [ ] Opened auth.html Import tab → Upload button works
- [ ] Got Google Client ID from console.cloud.google.com
- [ ] Updated auth-google.html with Client ID
- [ ] Tested One Tap auto-login
- [ ] Pushed to GitHub → Auto-deployed
- [ ] Visited https://soulfra.github.io → Everything works

---

**🤖 Built by Cal to solve the "what I'm seeing vs what you're seeing" problem.**

**💡 Key insight:** The fixes WERE applied. The confusion was about the `cal` alias and shell session output.
