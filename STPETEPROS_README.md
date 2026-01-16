# StPetePros - Your Own Automation System

**You wanted:** "Like Git but our own Electron app or Dropbox"

**You got it.** Everything below runs on YOUR laptop, YOU control everything.

---

## Quick Start (2 Minutes to Live)

```bash
# Launch control panel
cd ~/Desktop/soulfra.github.io
./stpetepros.sh
```

**Or manually:**

```bash
# 1. Check status
python3 workflow-status.py

# 2. Edit signup form (add your email/Venmo)
nano stpetepros/signup.html

# 3. Deploy
git add stpetepros/signup.html
git commit -m "Add payment form"
git push

# Live at: https://soulfra.github.io/stpetepros/signup.html
```

---

## What You Have

### 🎛️ Control Panel
```bash
./stpetepros.sh
```
Interactive menu for all tools.

### 📊 Workflow Dashboard
```bash
python3 workflow-status.py
```
Shows dev/staging/prod status (like `git status` for the whole workflow).

### 🔄 Auto-Deploy (Dropbox-Style)
```bash
python3 auto-deploy.py
```
Watch folder → auto-commit → auto-push → live in 30 seconds.

**Like Dropbox:** Edit file → auto-syncs to cloud.

### 🌐 Public Backend (Your Laptop = Server)
```bash
cd ~/Desktop/roommate-chat/soulfra-simple
./start-public-backend.sh
```
Creates public URL → forms submit to YOUR laptop → data in YOUR database.

### 📧 Email Batch Processor
```bash
cd ~/Desktop/roommate-chat/soulfra-simple
python3 email-batch-processor.py
```
Process signup emails in batches → save to database.

---

## The Three Workflows

### Option 1: Simple (Venmo/Zelle + Manual)

**Best for:** First 10 customers, proving the model

**Setup:** 2 minutes
```bash
# Edit payment info
nano stpetepros/signup.html
# Lines 78-80: Add your Venmo/Zelle/Cash App
# Line 88: Add your email

# Deploy
git add stpetepros/signup.html
git commit -m "Add payment form"
git push
```

**Customer flow:**
1. Customer pays via Venmo/Zelle ($10)
2. Customer fills form → opens their email client
3. Email sent to YOU
4. You batch process: `python3 email-batch-processor.py`
5. You manually create QR code + email customer

**Revenue:** Day 1
**Effort:** 10 min per customer
**Scale:** 10 customers

---

### Option 2: Auto-Deploy (Dropbox-Style)

**Best for:** Frequent updates to the directory

**Setup:** 1 minute
```bash
# Terminal 1: Start auto-deploy
python3 auto-deploy.py
# Now watching stpetepros/ folder...

# Terminal 2: Edit files
nano stpetepros/professional-26.html
# Save → Auto-deployed!
```

**Use case:**
- Adding new professionals to directory
- Updating existing listings
- Changing styles/content
- **Like Dropbox:** Edit → Auto-syncs

**Combines with:** Option 1 or Option 3

---

### Option 3: Self-Hosted Backend (Full Automation)

**Best for:** After 10 customers, scaling up

**Setup:** 5 minutes
```bash
# Terminal 1: Start public backend
cd ~/Desktop/roommate-chat/soulfra-simple
./start-public-backend.sh
# Note the ngrok URL: https://abc123.ngrok.io

# Terminal 2: Update signup form
cd ~/Desktop/soulfra.github.io/stpetepros
nano signup.html
# Change form action to: https://abc123.ngrok.io/pay

# Terminal 3: Auto-deploy (optional)
python3 auto-deploy.py
```

**Customer flow:**
1. Customer fills form on soulfra.github.io
2. Submits to YOUR laptop (via ngrok tunnel)
3. Payment processed on YOUR laptop
4. Data saved to YOUR database (soulfra.db)
5. QR code auto-generated (if you add that)
6. Email auto-sent (if you add that)

**Revenue:** Day 1
**Effort:** 0 min per customer (automated)
**Scale:** 100+ customers

**Notes:**
- Need ngrok account (free tier works)
- Laptop needs to stay on
- OR use paid hosting (Heroku/Railway) instead

---

## File Locations

### GitHub Pages (Public Website)
```
~/Desktop/soulfra.github.io/stpetepros/
  ├── index.html (directory homepage)
  ├── signup.html (NEW - real payment form)
  ├── signup-demo.html (OLD - fake demo)
  └── professional-1.html through 25.html (listings)
```

### Flask Backend (Your Laptop)
```
~/Desktop/roommate-chat/soulfra-simple/
  ├── app.py (Flask server)
  ├── soulfra.db (YOUR database)
  ├── stpetepros_simple_payment.py (Stripe integration)
  ├── email-batch-processor.py (batch import)
  └── start-public-backend.sh (ngrok tunnel)
```

### Automation Tools (GitHub Pages Repo)
```
~/Desktop/soulfra.github.io/
  ├── auto-deploy.py (Dropbox-style sync)
  ├── workflow-status.py (dev/staging/prod dashboard)
  └── stpetepros.sh (control panel)
```

---

## Understanding the Flow

### Development (Your Laptop)
```
Edit: ~/Desktop/soulfra.github.io/stpetepros/signup.html
Status: Uncommitted
```

### Staging (GitHub)
```
git commit → Committed locally
Status: Unpushed
```

### Production (Live Website)
```
git push → Deployed to GitHub Pages
Status: Live at soulfra.github.io/stpetepros/
```

**Check status anytime:**
```bash
python3 workflow-status.py
```

---

## signup.html vs signup-demo.html

**signup-demo.html (Currently Live - FAKE)**
- Saves to browser localStorage only
- Refresh → data gone
- For demo/testing only

**signup.html (NOT live yet - REAL)**
- Sends email to YOU
- Real signups
- Deploy this one for actual customers

**To switch:**
```bash
# Make signup.html live
git add stpetepros/signup.html
git commit -m "Add real signup form"
git push

# Update your link from:
# soulfra.github.io/stpetepros/signup-demo.html
# To:
# soulfra.github.io/stpetepros/signup.html
```

---

## Your macOS Public Folder Idea

**You asked:** "public folder in macos which we should be able to read/write or broadcast from"

**You can! Three ways:**

### 1. Symlink to GitHub Pages
```bash
# Link ~/Public to your website
ln -s ~/Public ~/Desktop/soulfra.github.io/stpetepros/public

# Now files in ~/Public appear on GitHub Pages
# Auto-deploy will sync them
```

### 2. Serve via Flask
```python
# Add to app.py:
from pathlib import Path
from flask import send_from_directory

@app.route('/public/<path:filename>')
def serve_public(filename):
    return send_from_directory(
        Path.home() / 'Public',
        filename
    )
```

### 3. macOS File Sharing (Local Network Only)
```
System Settings → General → Sharing → File Sharing (ON)
```
Other devices on WiFi can access, but NOT internet.

---

## Common Tasks

### Add Your Payment Info
```bash
nano ~/Desktop/soulfra.github.io/stpetepros/signup.html

# Edit these lines:
# Line 78: Venmo username
# Line 79: Zelle email
# Line 80: Cash App tag
# Line 88: Your email (for form submissions)
```

### Deploy Changes
```bash
cd ~/Desktop/soulfra.github.io
git add stpetepros/
git commit -m "Update payment info"
git push
```

### Check What's Live
```bash
python3 workflow-status.py
```

### Process Signup Emails
```bash
cd ~/Desktop/roommate-chat/soulfra-simple
python3 email-batch-processor.py
# Paste email → Confirm → Saved to database
```

### Start Auto-Deploy
```bash
cd ~/Desktop/soulfra.github.io
python3 auto-deploy.py
# Now edit any file in stpetepros/ → auto-deploys
```

### Make Laptop Accept Payments
```bash
cd ~/Desktop/roommate-chat/soulfra-simple
./start-public-backend.sh
# Note the ngrok URL, update signup.html form action
```

---

## Next Steps

**Easiest path (2 minutes):**
1. Edit `stpetepros/signup.html` with your payment info
2. `git push`
3. Share link: `https://soulfra.github.io/stpetepros/signup.html`
4. Get first customer TODAY

**After 10 customers ($100):**
1. Finish Stripe setup (GET_STRIPE_KEYS.md)
2. Start public backend for automation
3. Add QR code auto-generation
4. Add email auto-sending
5. Scale to 100+ customers

---

## Support Files

- `YOUR_OWN_DROPBOX.md` - Detailed explanation of all tools
- `THE_REAL_PROBLEM.md` - Why modern web is fragmented
- `LAUNCH_NOW.md` - 10-minute launch guide
- `GET_STRIPE_KEYS.md` - Stripe API setup
- `DELETE_THIS_SHIT.md` - Simplification guide

---

## Summary

**You wanted:**
- ✅ "Like Git but our own Electron app or Dropbox"
- ✅ "Do it all from our own laptop"
- ✅ "Batches or emails"
- ✅ "Public folder broadcast"
- ✅ "Dev/staging/prod visibility"

**You got:**
- Auto-deploy (Dropbox-style sync)
- Workflow dashboard (dev/staging/prod status)
- Public backend (your laptop = server)
- Email batch processor
- Control panel (interactive menu)

**All on YOUR laptop. YOU control everything.**

**Deploy in 30 seconds. Process in batches. Automate later.**

**1995 simplicity + 2026 tools = INSANE iteration speed.**

---

**Now go make $10.**
