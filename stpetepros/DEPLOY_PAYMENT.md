# Deploy Payment Page (5 Minutes)

## What Just Happened

✅ Created `signup.html` - Simple payment page (Venmo/Zelle/Cash App)
✅ Copied to GitHub Pages repo
⚠️  NOT deployed yet (need to customize payment info first)

## Step 1: Add YOUR Payment Info (2 min)

**Edit the file:**
```bash
cd ~/Desktop/soulfra.github.io/stpetepros
nano signup.html
```

**Find lines 58-62 and replace with YOUR info:**

BEFORE:
```html
<li><strong>Venmo:</strong> @StPetePros (or YOUR_VENMO_HERE)</li>
<li><strong>Zelle:</strong> stpetepros@gmail.com (or YOUR_EMAIL_HERE)</li>
<li><strong>Cash App:</strong> $StPetePros (or YOUR_CASHTAG_HERE)</li>
```

AFTER (YOUR actual info):
```html
<li><strong>Venmo:</strong> @YourActualVenmo</li>
<li><strong>Zelle:</strong> youremail@gmail.com</li>
<li><strong>Cash App:</strong> $YourActualCashApp</li>
```

**Find lines 70 and 91 and replace email:**

BEFORE:
```html
action="mailto:your-email@gmail.com?subject=..."
```

AFTER:
```html
action="mailto:YOUREMAIL@gmail.com?subject=..."
```

**Save:** Ctrl+O, Enter, Ctrl+X

## Step 2: Deploy (1 min)

```bash
cd ~/Desktop/soulfra.github.io
git add stpetepros/signup.html
git commit -m "Add real payment signup"
git push
```

**Wait 30 seconds for GitHub Pages to deploy...**

## Step 3: Test It (1 minute)

**Open this URL:**
```bash
open https://soulfra.github.io/stpetepros/signup.html
```

**You should see:**
- Payment instructions (Venmo/Zelle/Cash App)
- Form with business info
- Submit button that opens email

**Test the form:**
1. Fill it out
2. Click "Submit (Opens Email)"
3. Your email opens with the data
4. Send it to yourself
5. You receive it

**If that works, you're live.**

## Step 4: Share It (2 minutes)

**Post on Facebook:**
```
New Tampa business directory - get listed for $10!

✅ QR code business card
✅ Online listing
✅ Found by local customers
✅ One-time fee (no subscription)

Pay via Venmo/Zelle, get your QR code in 24 hours.

https://soulfra.github.io/stpetepros/signup.html

#TampaBay #StPete #SmallBusiness
```

**Post on Reddit r/tampabay:**
```
Just launched StPetePros - simple local business directory

$10 one-time fee to get listed. No subscriptions, no BS.

You get:
- QR code business card
- Online listing
- Found by local customers

https://soulfra.github.io/stpetepros/signup.html
```

## What Happens When Someone Pays?

1. **They pay you via Venmo/Zelle/Cash App** (you get notification)
2. **They fill out the form** (you get email)
3. **You manually fulfill:**
   - Create QR code at https://www.qr-code-generator.com
   - Email them the PNG file
   - Add them to directory (create professional-X.html)
   - Git push

**Time:** 10 minutes per customer

**After 10 customers:** Automate this (Stripe + Python script)

## Current Structure

```
/stpetepros/
  ├── index.html (directory listing - already live)
  ├── signup-demo.html (demo that saves to localStorage)
  └── signup.html (NEW - real payments via Venmo/Zelle)
```

**Live URLs:**
- Directory: https://soulfra.github.io/stpetepros/
- Demo signup: https://soulfra.github.io/stpetepros/signup-demo.html
- REAL signup: https://soulfra.github.io/stpetepros/signup.html ← Share this one

## Update Homepage Link (Optional)

Want "Join as Pro" button on homepage to go to REAL signup?

**Edit index.html:**
```bash
nano ~/Desktop/soulfra.github.io/stpetepros/index.html
```

**Find:**
```html
<a href="signup-demo.html"
```

**Replace with:**
```html
<a href="signup.html"
```

**Deploy:**
```bash
cd ~/Desktop/soulfra.github.io && git add . && git commit -m "Link to real signup" && git push
```

## FAQ

### "Do I need Stripe?"

**Not yet.** Venmo/Zelle work fine for first 10 customers.

**After 10 customers:** Yes, add Stripe for automation.

### "How do I track payments?"

**Venmo/Zelle transaction history.**

Check who paid → Match with email submission → Fulfill manually.

### "This seems manual"

**It is.** That's the point.

10 minutes × 10 customers = 100 minutes = 2 hours total

**That's faster than:**
- Setting up Stripe (hours of debugging)
- Learning API keys (hours of confusion)
- Writing automation (hours of coding)

**After 10 customers:** You've made $100. NOW spend 2 hours automating.

### "What if they don't pay?"

**Don't fulfill.** Simple.

You check Venmo/Zelle FIRST. If no payment, no QR code.

## Next Steps

1. **Customize payment info** (nano signup.html)
2. **Deploy** (git push)
3. **Test** (open the URL)
4. **Share** (Facebook/Reddit post)
5. **Get first customer** (TODAY)
6. **Manual fulfillment** (10 min)
7. **Repeat 9x** (this weekend)
8. **Automate** (next week, after you have revenue)

**You're 5 minutes away from accepting payments.**

**Go do it.**
