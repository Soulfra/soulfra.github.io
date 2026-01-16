# Verified Reviews - Quickstart Guide

## What This Is

A simple $1 verified review system.

```
Business gets QR code
  ↓
Customer scans QR
  ↓
Leaves review
  ↓
Pays $1 via Stripe
  ↓
Gets verified badge + proof QR
```

**No login. No complex auth. Just QR → Review → Pay → Verified.**

---

## Files Created

```
review.html           - Review submission form
business-qr.html      - QR code generator for businesses
verified.html         - Verification proof page
STRIPE_SETUP.md       - Step-by-step Stripe instructions
```

---

## Quick Setup (5 minutes)

### 1. Start Local Server

```bash
cd /Users/matthewmauer/Desktop/soulfra.github.io
python3 -m http.server 8000
```

Open browser to: http://localhost:8000

### 2. Setup Stripe

Follow: `STRIPE_SETUP.md`

**TLDR:**
1. Go to https://dashboard.stripe.com/payment-links
2. Create new payment link ($1)
3. Copy URL
4. Paste into `review.html` line 144

### 3. Test the Flow

**Step 1: Generate Business QR**
- Open: http://localhost:8000/business-qr.html
- Enter: "Test Coffee Shop"
- Click "Generate QR Code"
- Copy the review URL (or scan QR with phone)

**Step 2: Leave Review**
- Open the review URL (or scan QR)
- Fill out review form:
  - Name: "John Doe"
  - Rating: 5 stars
  - Review: "Amazing coffee! Best in town."
- Click "Pay $1 to Verify Review"

**Step 3: Pay (Test Mode)**
- Card: `4242 4242 4242 4242`
- Expiry: `12/34`
- CVC: `123`
- Click "Pay"

**Step 4: Get Verified**
- Redirects to `verified.html`
- Shows verified badge
- Shows review
- QR code proof
- Download/share options

---

## The Flow Explained

### For Businesses:

1. Open `business-qr.html`
2. Enter business name
3. Download QR code sticker
4. Print and display in store

### For Customers:

1. Scan QR code on phone
2. Opens `review.html?business=xxx`
3. Leave review (name, rating, text)
4. Click "Pay $1 to Verify"
5. Redirects to Stripe payment
6. After payment, redirects to `verified.html`
7. Download proof QR

### What Makes It Verified:

- **Payment = Proof**: $1 payment proves real customer
- **QR Proof**: Downloadable QR with verification ID
- **No Fraud**: Can't spam fake reviews (costs $1 each)
- **No Login**: Customer doesn't need account
- **Instant**: Everything happens in real-time

---

## Revenue Model

```
Small coffee shop: 10 reviews/month = $10
Restaurant: 50 reviews/month = $50
Retail store: 100 reviews/month = $100

If you charge business $0.50 per verified review:
- Customer pays $1 to Stripe
- Stripe takes ~$0.30 fee
- You keep $0.70
- Business pays you $0.50
- You profit: $0.20 per review

OR

Business pays nothing, you keep full $0.70 per review
(minus Stripe fees = ~$0.40 profit per review)

100 businesses × 20 reviews/month = 2000 reviews
2000 × $0.40 = $800/month passive income
```

---

## File Structure

```
/review.html              - Customer review form
/business-qr.html         - Business QR generator
/verified.html            - Verification proof page

/STRIPE_SETUP.md          - Stripe instructions
/QUICKSTART.md            - This file

/image-merge.html         - (Optional) Avatar blending
/twin.html                - (Optional) Digital twin profiles
/api/                     - (Optional) Backend APIs
```

---

## Data Storage

Currently uses browser storage:

- **sessionStorage**: Holds review during payment flow
- **localStorage**: Saves verified reviews locally

### For Production:

Add backend to save reviews:
- POST to `/api/reviews` after payment
- Store in database (SQLite, PostgreSQL, etc.)
- Query by businessId
- Display on business profile page

---

## Deployment to GitHub Pages

### 1. Initialize Git (if not already)

```bash
cd /Users/matthewmauer/Desktop/soulfra.github.io
git init
git add .
git commit -m "Verified review system"
```

### 2. Push to GitHub

```bash
git remote add origin https://github.com/soulfra/soulfra.github.io.git
git branch -M main
git push -u origin main
```

### 3. Enable GitHub Pages

1. Go to repo settings
2. Pages → Source: "main branch"
3. Save

### 4. Update Stripe Redirect

In Stripe Payment Link settings:
- Change redirect URL from `localhost:8000` to `https://soulfra.github.io`
- Example: `https://soulfra.github.io/verified.html?business={CHECKOUT_SESSION_ID}`

### 5. Switch to Live Mode

1. Toggle Stripe to Live mode
2. Create NEW payment link (live version)
3. Update `review.html` with live URL

---

## Testing Checklist

- [ ] Local server running
- [ ] Stripe test payment link configured
- [ ] Generate business QR code
- [ ] Submit review form
- [ ] Complete test payment (4242 card)
- [ ] Verify redirect to verified.html
- [ ] Check verified badge displays
- [ ] Download proof QR code
- [ ] Test QR scan on phone
- [ ] Verify review stored in localStorage

---

## Next Steps (Optional Enhancements)

### 1. Add Backend Storage
- Save reviews to database
- Display on business profile pages
- Public review feed

### 2. Business Dashboard
- Show all reviews for business
- Download CSV export
- Analytics (rating average, review count)

### 3. Review Moderation
- Flag inappropriate reviews
- Business can respond to reviews
- Report system

### 4. Email Notifications
- Send receipt to customer
- Notify business of new review
- Weekly summary emails

### 5. QR Code Stickers
- Partner with print shop
- Sell QR stickers to businesses
- Physical product revenue

---

## Troubleshooting

### Review data not showing on verified page

**Cause:** sessionStorage cleared or page refreshed

**Fix:** Don't close browser between review → payment → verified

**Long-term:** Save to backend before payment redirect

### Stripe redirect not working

**Cause:** Redirect URL not configured

**Fix:** Set in Payment Link settings (see STRIPE_SETUP.md)

### QR code not generating

**Cause:** CDN script blocked or slow to load

**Fix:** Check browser console, reload page, or self-host qrcode.min.js

---

## Support

Read the docs:
- STRIPE_SETUP.md - Stripe configuration
- README_SIMPLIFIED.md - Original simplified approach
- README_DIGITAL_TWIN.md - Advanced features

---

## Summary

You have built a complete $1 verified review system:

✓ QR code generator for businesses
✓ Review submission form
✓ Stripe payment integration (no SDK)
✓ Verification proof with QR code
✓ No login required
✓ Deployable to GitHub Pages

**Total setup: 5 minutes**
**Total code: 3 HTML files**
**No backend required (yet)**

Start from pixel 1, scale to infinity.
