# Stripe Payment Link Setup

## What You Need

A Stripe Payment Link - a simple URL that charges $1 and redirects back to your site.

**NO SDK. NO API KEYS. NO WEBHOOKS. NO CLI. JUST COPY/PASTE.**

---

## IMPORTANT: Don't Get Lost in Stripe

Stripe has TWO sections:

```
❌ DEVELOPERS SECTION (ignore this):
   - Event destinations
   - Webhooks
   - Stripe CLI
   - API keys
   - Code samples
   - localhost listeners
   → TOO COMPLEX, WE DON'T NEED THIS

✅ PAYMENT LINKS (use this):
   - Simple dashboard
   - Click buttons
   - Copy URL
   - Done
   → THIS IS WHAT WE WANT
```

If you see "stripe listen --forward-to localhost:4242" or "Download Stripe CLI" → **YOU'RE IN THE WRONG PLACE**

---

## Step 1: Create Stripe Account

1. Go to: https://stripe.com
2. Click "Start now" (or "Sign in" if you have one)
3. Complete signup
4. Skip all complex setup - we only need Payment Links

---

## Step 2: Go Directly to Payment Links

**Option A: Direct URL**
https://dashboard.stripe.com/payment-links

**Option B: From Dashboard**
1. Go to Stripe Dashboard: https://dashboard.stripe.com
2. Look at left sidebar
3. **IGNORE** "Developers" section at bottom
4. Click **"Payment links"** in main menu
5. Click **"+ New"** button (top right)

**If you don't see "Payment links" in sidebar:**
- Click "More +" in sidebar
- Find "Payment links" in the list

---

## Step 3: Create Payment Link

You'll see a form. Fill it out like this:

### Product Details:

**If you already have a $1 product:**
- Click "Select existing product"
- Choose your $1 product from dropdown
- Skip to "After Payment" section below

**If creating new product:**
- Name: `Verified Review`
- Description: `$1 payment to verify your review`
- Price: `1.00` USD
- Type: One-time payment

**After Payment:**
- Select: "Redirect to a page"
- URL: `https://soulfra.github.io/verified.html?business={CHECKOUT_SESSION_ID}`

  **Note:** If testing locally first, use:
  `http://localhost:8000/verified.html?business={CHECKOUT_SESSION_ID}`

**Customer Information:**
- Email: Optional (uncheck "Required")
- Name: Optional (uncheck "Required")

**Click "Create link"**

---

## Step 4: Copy Your Payment Link

After creating, Stripe shows you the payment link:

```
https://buy.stripe.com/XXXXXXXXX
```

**COPY THIS URL**

---

## Step 5: Add to review.html

1. Open `review.html` in a text editor
2. Find line ~144 (search for "REPLACE_WITH_YOUR_LINK"):

```javascript
const stripePaymentLink = 'https://buy.stripe.com/test_REPLACE_WITH_YOUR_LINK';
```

3. Replace with your actual link:

```javascript
const stripePaymentLink = 'https://buy.stripe.com/XXXXXXXXX';
```

4. Save the file

---

## Step 6: Test Mode vs Live Mode

### Test Mode (Free Testing)

When you first create a Stripe account, you're in **Test Mode**.

- Payment links start with: `https://buy.stripe.com/test_`
- Use test card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**NO REAL MONEY IS CHARGED**

### Live Mode (Real Payments)

When ready for real customers:

1. Toggle switch in Stripe Dashboard (top left)
2. Switch from "Test mode" to "Live mode"
3. Create a NEW payment link (live version)
4. Replace the URL in review.html

**REAL MONEY WILL BE CHARGED**

---

## Testing the Flow

### Local Testing (Before Deploying)

1. Make sure localhost server is running:
   ```bash
   python3 -m http.server 8000
   ```

2. Create a QR code:
   - Open: http://localhost:8000/business-qr.html
   - Enter business name: "Test Business"
   - Click "Generate QR Code"

3. Scan QR or click the review URL

4. Leave a review:
   - Name: "Test User"
   - Rating: 5 stars
   - Review: "Great service, highly recommend!"
   - Click "Pay $1 to Verify Review"

5. Use test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`

6. After payment, should redirect to `verified.html`

7. Check verified badge and QR proof

---

## Troubleshooting

### I'm seeing "Download Stripe CLI" or "webhooks"

**Problem:** You're in the Developers section (too complex)

**Fix:**
- Close that page
- Go directly to: https://dashboard.stripe.com/payment-links
- Ignore anything that mentions "CLI", "localhost listener", or "event destinations"

### Payment doesn't redirect back

**Problem:** After paying, stuck on Stripe page

**Fix:** Make sure you set the redirect URL in Payment Link settings:
- Dashboard → Payment links → Click your link → Edit
- Set "After payment" URL to your verified.html page

### Can't find Payment Links

**Problem:** No "Payment links" option in sidebar

**Fix:**
- You might be in old Stripe dashboard
- Go to: https://dashboard.stripe.com/payment-links directly
- Or click "More +" in sidebar → Payment links

### "Invalid redirect URL" error

**Problem:** Stripe won't save redirect URL

**Fix:**
- For local testing, Stripe needs ngrok or similar tunnel
- OR just test redirect manually:
  1. Complete payment
  2. Manually go to: http://localhost:8000/verified.html?business=test-business
  3. (This simulates the redirect)

### Review data not showing on verified.html

**Problem:** Verified page says "No Review Data Found"

**Fix:**
- Review data is stored in sessionStorage (temporary)
- Don't close/refresh browser between review.html and verified.html
- For real deployment, data should be saved to backend/database

---

## Deployment Notes

Once tested locally, deploy to GitHub Pages:

1. Push all files to your repo
2. Update payment link redirect URL to:
   `https://soulfra.github.io/verified.html?business={CHECKOUT_SESSION_ID}`

3. Switch Stripe to Live mode
4. Create new Live payment link
5. Update review.html with live URL

---

## File Locations

- Review form: `/review.html` (line 144 - payment link)
- QR generator: `/business-qr.html`
- Verification: `/verified.html`

---

## Summary

```
1. Sign up at stripe.com
2. Create Payment Link ($1, redirect to verified.html)
3. Copy payment link URL
4. Paste into review.html (line 144)
5. Test with card 4242 4242 4242 4242
6. Deploy and switch to Live mode
```

**Total setup time: 5 minutes**
