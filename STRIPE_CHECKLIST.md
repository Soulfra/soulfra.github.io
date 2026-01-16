# Stripe Setup Checklist

Use this as you go through the Stripe dashboard.

---

## Before You Start

- [ ] Have localhost server running: `python3 -m http.server 8000`
- [ ] Have `review.html` file ready to edit

---

## In Your Browser

### 1. Go to Payment Links

- [ ] Open: https://dashboard.stripe.com/payment-links
- [ ] You should see "Payment links" at the top
- [ ] Click "+ New" button (top right)

**If you see:**
- "Download Stripe CLI" → ❌ Wrong page, go back
- "Event destinations" → ❌ Wrong page, go back
- "Webhooks" → ❌ Wrong page, go back
- "Create payment link" form → ✅ Correct!

---

### 2. Fill Out the Form

**Product section:**

Do you already have a $1 product?
- [ ] YES → Select "Use existing product" → Choose from dropdown
- [ ] NO → Fill out new product:
  - [ ] Name: `Verified Review`
  - [ ] Price: `1.00` USD
  - [ ] One-time payment (not subscription)

**After payment section:**

- [ ] Find "After payment" dropdown
- [ ] Select "Redirect to a page"
- [ ] Enter URL: `http://localhost:8000/verified.html?business={CHECKOUT_SESSION_ID}`

  **Important:** Type `{CHECKOUT_SESSION_ID}` exactly like that (Stripe replaces it)

**Customer information:**

- [ ] Uncheck "Email required" (make it optional)
- [ ] Uncheck "Name required" (make it optional)

**Bottom of form:**

- [ ] Click "Create link" button

---

### 3. Copy Your Link

After clicking create, you'll see:

```
Payment link created!
https://buy.stripe.com/test_XXXXXXXXX
```

- [ ] Click the copy button (📋 icon)
- [ ] OR highlight the URL and copy manually

**Your link starts with:**
- Test mode: `https://buy.stripe.com/test_`
- Live mode: `https://buy.stripe.com/` (no "test")

---

## In Your Code Editor

### 4. Update review.html

- [ ] Open `/Users/matthewmauer/Desktop/soulfra.github.io/review.html`
- [ ] Find line 144 (or search for "REPLACE_WITH_YOUR_LINK")
- [ ] You'll see:
  ```javascript
  const stripePaymentLink = 'https://buy.stripe.com/test_REPLACE_WITH_YOUR_LINK';
  ```
- [ ] Replace with your copied link:
  ```javascript
  const stripePaymentLink = 'https://buy.stripe.com/test_XXXXXXXXX';
  ```
- [ ] Save the file

---

## Test It Works

### 5. Generate Business QR

- [ ] Open: http://localhost:8000/business-qr.html
- [ ] Enter business name: "Test Coffee Shop"
- [ ] Click "Generate QR Code"
- [ ] Copy the review URL shown

---

### 6. Submit a Review

- [ ] Open the review URL (from step 5)
- [ ] Fill out form:
  - [ ] Name: "John Doe"
  - [ ] Rating: 5 stars
  - [ ] Review: "Great service!" (minimum 10 characters)
- [ ] Click "Pay $1 to Verify Review"

---

### 7. Complete Test Payment

You should be redirected to Stripe payment page.

Use test card details:
- [ ] Card number: `4242 4242 4242 4242`
- [ ] Expiry: Any future date (e.g., `12/34`)
- [ ] CVC: Any 3 digits (e.g., `123`)
- [ ] ZIP: Any 5 digits (e.g., `12345`)
- [ ] Click "Pay"

**If you see real card form with your actual card → YOU'RE IN LIVE MODE (stop and switch to test mode)**

---

### 8. Verify It Worked

After payment, you should be redirected to:
`http://localhost:8000/verified.html?business=test-coffee-shop-XXXX`

Check that page shows:
- [ ] Green verified badge (✓)
- [ ] Your review text
- [ ] 5 star rating
- [ ] QR code proof
- [ ] Download button works

---

## Deploy to Production

### 9. Update for Live Site

When ready to accept real payments:

**In Stripe:**
- [ ] Toggle to Live mode (switch at top left)
- [ ] Create NEW payment link (same steps as before)
- [ ] Update redirect URL to: `https://soulfra.github.io/verified.html?business={CHECKOUT_SESSION_ID}`
- [ ] Copy live payment link

**In review.html:**
- [ ] Replace test link with live link
- [ ] Remove "test_" from URL
- [ ] Save and deploy

---

## Common Issues

**Stuck on Stripe page after payment**
- Go back to Payment Link settings
- Check "After payment" URL is set correctly
- Make sure it includes `?business={CHECKOUT_SESSION_ID}`

**Review data not showing on verified page**
- Don't close browser between steps
- Check browser console for errors (F12)
- Make sure sessionStorage is enabled

**Can't find payment link**
- Check you're in correct mode (Test vs Live)
- Test links only show when in Test mode
- Live links only show when in Live mode

---

## Done!

If all checks passed, you have a working $1 verified review system:

✅ QR code generator
✅ Review form
✅ Stripe payment
✅ Verification proof

Ready to deploy to GitHub Pages or your domain.
