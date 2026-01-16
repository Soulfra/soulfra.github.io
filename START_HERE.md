# START HERE

## You Have a $1 Verified Review System

**What it does:**
- Business gets QR code
- Customer scans → leaves review → pays $1
- Review is verified with proof QR

**What you need to do:**
1. Configure Stripe payment link (5 minutes)
2. Test it works
3. Deploy to production

---

## Step 1: Configure Stripe

**Read this file:** `STRIPE_5_MINUTES.md`

**TLDR:**
1. Go to https://dashboard.stripe.com/test/payment-links
2. Click "+ New"
3. Fill: Name = "Verified Review", Price = $1
4. After payment → Success URL = `http://localhost:8000/verified.html`
5. Create link, copy URL
6. Open `review.html`, line 290
7. Replace `REPLACE_WITH_YOUR_LINK` with your Stripe URL
8. Save

---

## Step 2: Test It Works

1. Open http://localhost:8000/business-qr.html
2. Enter business name: "Signal Stack LLC"
3. Click "Generate QR Code"
4. Click the review URL (or scan QR)
5. Fill review form
6. Click "Pay $1 to Verify Review"
7. Should redirect to Stripe
8. Enter test card: `4242 4242 4242 4242`, exp: `12/34`, CVC: `123`
9. Click "Pay"
10. Should redirect to verified.html with green badge

**If step 6 shows error alert** → Stripe link not configured, go back to step 1

---

## Step 3: Deploy (When Ready)

1. Push to GitHub
2. Enable GitHub Pages
3. Update Stripe payment link success URL to: `https://soulfra.github.io/verified.html`
4. Switch Stripe to Live mode
5. Create NEW live payment link
6. Update review.html with live link

---

## Files You Need

```
business-qr.html     ← Generate QR codes for businesses
review.html          ← Customer leaves review (CONFIGURE THIS)
verified.html        ← Verification proof page
wordlist.js          ← Makes memorable IDs (purple-mountain-tiger)
```

---

## Files You Can Ignore (For Now)

```
STRIPE_SETUP.md         ← Too detailed, use STRIPE_5_MINUTES.md instead
STRIPE_CHECKLIST.md     ← Too detailed
TIERED_PRICING.md       ← Add later (after basic works)
REFUND_PROMO.md         ← Add later
SECURITY.md             ← Read if curious, not critical
FLOW_DIAGRAM.md         ← Detailed flow map (optional)
test-flow.html          ← Automated tests (optional)
image-merge.html        ← Avatar blending (different feature)
twin.html               ← Digital twin profiles (different feature)
README_SIMPLIFIED.md    ← Old approach
README_DIGITAL_TWIN.md  ← Old approach
api/                    ← Backend stuff (not needed yet)
```

---

## What NOT to Read

- ❌ Stripe PHP/dotnet SDK docs (don't need)
- ❌ Subscription import guides (not relevant)
- ❌ Pricing table docs (do later)
- ❌ Webhook tutorials (not needed for basic flow)

---

## Summary

**ONE task:** Get Stripe payment link URL and paste into review.html

**ONE test:** Generate QR → Leave review → Pay with test card → See verified badge

**Time:** 5 minutes to configure, 2 minutes to test

Read `STRIPE_5_MINUTES.md`. Do the 9 steps. Test it works. Done.
