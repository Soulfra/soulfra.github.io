# TEST NOW

Stripe is configured. Let's test the full flow.

---

## Step 1: Generate QR Code

Open: http://localhost:8000/business-qr.html

Enter business name:
```
Signal Stack LLC
```

Click: **"Generate QR Code"**

You'll see:
- QR code image
- Business ID: `abandon-ability-able-472` (or similar word-based ID)
- Review URL: `http://localhost:8000/review.html?business=abandon-ability-able-472`

---

## Step 2: Leave Review

**Option A:** Click the review URL directly

**Option B:** Scan QR code with phone (if testing mobile)

You'll see the review form with:
- "Reviewing: ABANDON ABILITY ABLE 472" at top
- Name field
- Star rating (click stars)
- Review text field

Fill it out:
- **Name:** `Test User`
- **Rating:** Click 5 stars
- **Review:** `This is a test review for Signal Stack LLC. Great company!`

Click: **"Pay $1 to Verify Review"**

---

## Step 3: Stripe Payment Page

You should be redirected to Stripe's checkout page.

**URL will change to:** `checkout.stripe.com/c/pay/cs_test_...`

**If you see an alert instead** → Something's wrong, check browser console (F12)

On Stripe's page, enter test card:
```
Card number: 4242 4242 4242 4242
Expiry: 12/34
CVC: 123
ZIP: 12345
```

Click: **"Pay"**

---

## Step 4: Verification Page

After payment, Stripe redirects to:
```
http://localhost:8000/verified.html?business=abandon-ability-able-472
```

You should see:
```
┌──────────────────────┐
│   ✓ VERIFIED         │
│ VER-1736611234-X7K2  │
└──────────────────────┘

Name: Test User
Rating: ⭐⭐⭐⭐⭐
Review: This is a test review for Signal Stack LLC. Great company!
Business: ABANDON ABILITY ABLE 472
```

Below that:
- **Proof QR code** (scannable verification)
- **Download** button
- **Share** button
- **Copy URL** button

---

## Expected Results

✅ **Step 1:** QR code generated with word-based ID
✅ **Step 2:** Review form loads, all fields work
✅ **Step 3:** Redirects to Stripe, test card accepted
✅ **Step 4:** Verified badge shows, proof QR generated

---

## If Something Fails

### Alert: "Stripe Payment Link Not Configured"

**Problem:** review.html wasn't saved after editing

**Fix:**
1. Check review.html line 290
2. Should say: `https://buy.stripe.com/test_cNieVd5Vjb6N2ZY6Fq4wM00`
3. Not: `REPLACE_WITH_YOUR_LINK`

### Stays on review page, doesn't redirect

**Problem:** JavaScript error

**Fix:**
1. Open browser console (F12)
2. Look for red error messages
3. Share error message for debugging

### Stripe page shows "Invalid link"

**Problem:** Payment link was deleted or expired

**Fix:**
1. Go back to Stripe dashboard
2. Check payment link still exists
3. If not, create new one
4. Update review.html with new URL

### Verified page shows "No Review Data Found"

**Problem:** sessionStorage was cleared

**Cause:** Closed browser tab, or privacy mode

**Fix:**
- Don't close browser between review → payment → verified
- Keep same tab open during entire flow
- If using private/incognito, sessionStorage clears faster

---

## After Test Passes

If all 4 steps work, you have a functioning $1 verified review system.

**What works:**
- QR code generation with memorable IDs
- Review form with validation
- Stripe payment integration
- Verification with proof QR

**What's next:**
1. Test on phone (scan QR with camera)
2. Test with different business names
3. When ready, deploy to GitHub Pages
4. Switch to Stripe live mode for real payments

---

## Quick Test (30 seconds)

```bash
# 1. Open QR generator
open http://localhost:8000/business-qr.html

# 2. Enter "Signal Stack LLC", generate QR

# 3. Click review URL

# 4. Fill form: Name + 5 stars + review text

# 5. Click "Pay $1"

# 6. Use card 4242 4242 4242 4242

# 7. Check verified badge appears
```

If this works, **you're done with Stripe setup**.
