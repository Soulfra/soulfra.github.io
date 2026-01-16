# Get Stripe Working in 5 Minutes

## Stop Reading Documentation. Do This.

Forget:
- ❌ Pricing tables
- ❌ Subscriptions
- ❌ SDKs (stripe-php, stripe-dotnet)
- ❌ Import tools
- ❌ Webhooks

Do:
- ✅ Create ONE payment link
- ✅ Copy URL
- ✅ Paste into review.html
- ✅ Test

---

## Step 1: Open Stripe Dashboard

Go to: **https://dashboard.stripe.com/test/payment-links**

(Note the `/test/` in URL - you're in TEST mode, no real money)

You should see:
```
Payment links
───────────────────────────
[+ New]    Search...
```

If you see "Developers" or "API keys" or "Webhooks" → **WRONG PAGE**. Go back to the link above.

---

## Step 2: Click "+ New"

Big button, top right.

You'll see a form. **IGNORE most fields.**

---

## Step 3: Fill ONLY These Fields

### Product Information

**Name:**
```
Verified Review
```

**Price:**
```
1.00 USD
```

**Billing period:**
```
One time
```

That's it for product. **Scroll down.**

---

## Step 4: After Payment Settings

Find section called **"After payment"**

Click dropdown, select:
```
Don't show confirmation page
```

Then it shows **"Success URL"** field.

Paste this EXACTLY:
```
http://localhost:8000/verified.html
```

(When you deploy to GitHub Pages, change to `https://soulfra.github.io/verified.html`)

---

## Step 5: Customer Information

Find **"Collect customer information"**

**Email address:** Optional (uncheck "Required")
**Name:** Optional (uncheck "Required")

You want customers to leave reviews WITHOUT having to give email/name to Stripe.

---

## Step 6: Create Link

Scroll to bottom, click:
```
[Create link]
```

---

## Step 7: Copy the URL

After clicking create, Stripe shows:

```
Payment link created
─────────────────────────────
Link URL
https://buy.stripe.com/test_14k00000000000000000000
                              ↑ THIS PART IS RANDOM

[Copy]  [View]  [Edit]
```

Click **[Copy]** button.

The URL starts with `https://buy.stripe.com/test_` (test mode)

---

## Step 8: Paste into review.html

Open `/Users/matthewmauer/Desktop/soulfra.github.io/review.html`

Find line 290 (or search for "REPLACE_WITH_YOUR_LINK"):

**BEFORE:**
```javascript
const stripePaymentLink = 'https://buy.stripe.com/test_REPLACE_WITH_YOUR_LINK';
```

**AFTER:**
```javascript
const stripePaymentLink = 'https://buy.stripe.com/test_14k00000000000000000000';
```
(Use YOUR actual link from step 7)

**Save the file.**

---

## Step 9: Test It

### 9a. Generate QR Code

Open: http://localhost:8000/business-qr.html

Enter business name:
```
Signal Stack LLC
```

Click "Generate QR Code"

You'll see QR code + URL like:
```
http://localhost:8000/review.html?business=abandon-ability-able-472
```

### 9b. Leave Review

Click the review URL (or scan QR with phone).

Fill out form:
- Name: `Test User`
- Rating: 5 stars
- Review: `This is a test review to verify the system works.`

Click **"Pay $1 to Verify Review"**

### 9c. Pay with Test Card

You should be redirected to Stripe's payment page.

**If you see error or stay on same page** → Stripe link not configured correctly, go back to step 8.

**If you see Stripe payment form**, enter test card:

```
Card number: 4242 4242 4242 4242
Expiry: 12/34
CVC: 123
ZIP: 12345
```

Click **"Pay"**

### 9d. Verify Badge

After payment, Stripe redirects to:
```
http://localhost:8000/verified.html?business=abandon-ability-able-472
```

You should see:
- ✓ Green verified badge
- Your review text
- 5 star rating
- QR code proof
- Download button

**If you see "No Review Data Found"** → sessionStorage was cleared, try again without closing browser tab.

---

## Troubleshooting

### "Invalid redirect URL" in Stripe

**Problem:** Stripe won't accept `localhost:8000`

**Fix:** Use `http://127.0.0.1:8000/verified.html` instead of `localhost`

OR

Create payment link WITHOUT redirect URL for now, manually test by:
1. Complete payment
2. Manually go to: `http://localhost:8000/verified.html?business=abandon-ability-able-472`

### Button doesn't redirect to Stripe

**Problem:** Still has placeholder link

**Check:**
1. Did you save review.html after editing?
2. Refresh the review page (Ctrl+F5 / Cmd+Shift+R)
3. Check browser console (F12) for errors

### Stripe page shows but payment fails

**Problem:** Real card entered in test mode, or test card in live mode

**Fix:** Make sure you're in TEST mode (URL has `/test/` in it), use test card `4242 4242 4242 4242`

### After payment, verified page is blank

**Problem:** Review data not in sessionStorage

**Cause:** Closed browser tab or cleared storage

**Fix:** Do NOT close browser between review → payment → verified. Keep same tab open.

---

## What You Just Did

```
Created: Stripe Payment Link
Configured: review.html with link
Tested: Full flow QR → Review → Pay → Verified
Result: Working $1 verified review system
```

**Time:** 5 minutes
**Cost:** $0 (test mode)
**Complexity:** None (just copy/paste)

---

## What NOT to Do

❌ Don't create Stripe API keys (not needed for Payment Links)
❌ Don't install stripe-php or stripe-dotnet (not needed)
❌ Don't set up webhooks (not needed for basic flow)
❌ Don't import subscriptions (not relevant)
❌ Don't create pricing tables (do this AFTER basic link works)

---

## When You're Ready for Production

1. Toggle Stripe to **Live mode** (top left switch)
2. Create NEW payment link (live version)
3. Copy live URL (starts with `https://buy.stripe.com/` WITHOUT `test_`)
4. Update review.html with live link
5. Change success URL to `https://soulfra.github.io/verified.html`
6. Deploy to GitHub Pages
7. Real payments will work

---

## Next Steps (After This Works)

ONLY do these AFTER the basic flow works:

1. ✅ Test works with ONE $1 payment link
2. Add promo codes (FIRST28FREE) for free trials
3. Create pricing tables for tiers
4. Add backend to save reviews
5. Deploy to production

---

## Summary

**What you need:**
- ONE Stripe Payment Link URL

**Where it goes:**
- review.html line 290

**How to test:**
- QR gen → Review form → Stripe page → Verified badge

**If it works:**
- You're done with Stripe setup

**If it doesn't work:**
- Check: Did you paste the actual Stripe URL (not the placeholder)?
- Check: Does URL start with `https://buy.stripe.com/test_`?
- Check: Did you save the file?

Stop reading. Just do the 9 steps above. It works.
