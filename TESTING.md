# 🧪 Soulfra Testing Guide

## Quick Start: What Actually Works Right Now

**✅ WORKING:** Domain guessing game
**❌ NOT BUILT YET:** Everything else (voice-to-emoji, gallery, drops, etc.)

---

## Test #1: The Domain Game (Main Feature)

### Step-by-Step

1. **Open the game:**
   - Go to: https://soulfra.com/game.html
   - Or click "Play Today's Puzzle" button on homepage

2. **What you should see:**
   - Puzzle number (should be #10 for Jan 10, 2026)
   - An emoji clue (🎹 for today)
   - Text input box
   - "Submit Guess" button
   - 6 empty attempt boxes at bottom

3. **How to play:**
   - Type the domain name that matches the emoji
   - For 🎹 emoji → type "calriven"
   - Click Submit (or press Enter)

4. **What happens when you WIN:**
   - Attempt box turns GREEN with ✓
   - Success message appears
   - Share text shows (Wordle-style)
   - Redirects to the domain in 3 seconds

5. **How to test share feature:**
   - Click "Copy Share Text" button
   - Paste somewhere to verify it copied
   - Should look like:
     ```
     Soulfra #10
     🎹
     ✅⬜⬜⬜⬜⬜

     Play at: https://soulfra.com/game.html
     ```

### All 6 Domains in the Game

| Emoji | Domain | Category |
|-------|--------|----------|
| 🌐 | soulfra.com | platform |
| 🎪 | cringeproof.com | social |
| 🌳 | deathtodata.com | privacy |
| 🎹 | calriven.com | writing |
| 🏖️ | stpetepros.com | local |
| ⛓️ | blamechain.com | crypto |

Game rotates through these 6 domains every day, deterministically.

---

## Test #2: Homepage "Coming Soon" Links

### Step-by-Step

1. **Go to homepage:**
   - https://soulfra.com/

2. **Scroll down to footer**
   - Look for links: GitHub, Documentation, About, Dashboard

3. **Click each link:**
   - "Documentation" → Should show alert: "Coming soon! Full platform documentation."
   - "About" → Should show alert: "Coming soon! Learn about the Soulfra platform."
   - "Dashboard" → Should go to /pages/dashboard/dashboard.html

4. **Test product buttons:**
   - Under "Creative Publishing" card:
     - "Create Art" → Alert: "Coming soon! Voice-to-emoji publishing will launch soon."
     - "View Gallery" → Alert: "Coming soon! Gallery will showcase all verified emoji artworks."

   - Under "Auto-Deploy" card:
     - "View Drops" → Alert: "Coming soon! View all auto-deployed projects here."
     - "How It Works" → Alert: "Coming soon! Deployment documentation will explain the full process."

   - Under "Domain Game" card:
     - "Play Today's Puzzle" → Goes to /game.html ✅
     - "View Schedule" → Alert: "Coming soon! Daily puzzle schedule will show upcoming domains."

---

## Test #3: Local vs Live

### Local Testing (http://localhost:8000/)

```bash
# Make sure local server is running:
python3 -m http.server 8000

# Then visit:
# http://localhost:8000/game.html
# http://localhost:8000/index.html
```

**Should match live site exactly** after GitHub Pages deploys.

### Live Testing (https://soulfra.com/)

After pushing changes, GitHub Pages takes **2-5 minutes** to deploy.

**To check if deployment is done:**
1. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. Check puzzle number - should be #10 (not #0)
3. Check emoji - should be 🎹 (not 🎨)

---

## Troubleshooting

### Problem: Site still shows old content

**Solution:**
1. Wait 2-3 more minutes
2. Hard refresh browser (Cmd+Shift+R)
3. Check GitHub Actions: https://github.com/Soulfra/soulfra.github.io/actions
4. Look for green checkmark on latest deployment

### Problem: Game shows wrong puzzle number

**Calculation:**
- Start date: Jan 1, 2026
- Today: Jan 10, 2026
- Days since start: 9
- Puzzle number: 9 + 1 = **#10**
- Domain index: 9 % 6 = 3
- Domain: DOMAINS[3] = **calriven** (🎹)

If it shows #0 or wrong emoji, **GitHub Pages hasn't deployed your latest changes yet.**

### Problem: Redirect doesn't work after winning

Check console (F12 → Console tab) for errors. The redirect happens 3 seconds after winning:

```javascript
setTimeout(() => {
    window.location.href = `https://${currentDomain.full}`;
}, 3000);
```

### Problem: "Coming soon" alerts don't show

Old homepage is still live. Wait for deployment or check if changes were pushed:

```bash
git log -1 --oneline
# Should show: "Fix broken links in homepage"
```

---

## What Doesn't Exist Yet (Don't Bother Testing)

❌ Voice-to-emoji publishing
❌ QR code scanning
❌ Artwork gallery
❌ Auto-deploy system
❌ Drop box watcher
❌ Token economy backend
❌ User accounts
❌ Stripe payments
❌ Admin panel
❌ Chat system

**These are all future features.** The homepage shows them as a roadmap, not current functionality.

---

## Summary: What to Test Right Now

1. **Play the game** - Guess today's domain from emoji clue
2. **Test share feature** - Copy the Wordle-style share text
3. **Verify redirects** - Win the game and get redirected to the domain
4. **Check "Coming soon" alerts** - Make sure broken links show friendly messages

**That's it!** Everything else is placeholder/future work.

---

## Quick Commands

```bash
# Check what's live
git log -1 --oneline

# View local site
python3 -m http.server 8000

# Push changes
git add .
git commit -m "Description"
git push origin main

# Wait 2-5 minutes for GitHub Pages to deploy
# Then hard refresh: Cmd+Shift+R
```
