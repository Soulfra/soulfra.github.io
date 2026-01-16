# Signal Stack - $1 Verified Review System

**Organized review system with cryptographic validation**

---

## Quick Start

### Local Testing
```
http://localhost:8000/reviews/
```

### Live Demo (After Deployment)
```
https://soulfra.com/reviews/
```

---

## How It Works

1. **Generate QR Code** (`/reviews/`) - Business creates QR code with unique ID
2. **Customer Scans** → Opens review form (`/reviews/form.html`)
3. **Customer Pays $1** → Stripe payment verification
4. **Verified Badge** (`/reviews/verified.html`) - Cryptographic proof of payment

---

## Files

### Core System
- **index.html** - Generate business QR codes
- **form.html** - Customer review form
- **verified.html** - Verified badge page
- **wordlist.js** - BIP39 word-based ID generator

### Validation & Testing
- **validate.html** - Automated validation suite (Jupyter-style)
- **validate-teaching.html** - Validation + CCNA teaching integration

### Documentation
- **docs/STRIPE_SETUP.md** - Stripe configuration (5 min setup)
- **docs/VALIDATION.md** - How validation system works
- **docs/ROADMAP.md** - Feature roadmap (Phases 1-6)
- **docs/BLACK_BOX_ARCHITECTURE.md** - Teaching system vision

### Admin (Coming Soon)
- **admin/** - Admin dashboard (gated access)

---

## Test Flow

### 1. Generate QR Code
```
Open: http://localhost:8000/reviews/
Enter: "Signal Stack LLC"
Click: Generate QR Code
Result: QR code + review URL
```

### 2. Leave Review
```
Click: Review URL (or scan QR)
Fill: Name, rating (1-5 stars), review text
Click: Pay $1 to Verify Review
```

### 3. Stripe Payment
```
Card: 4242 4242 4242 4242
Expiry: 12/34
CVC: 123
ZIP: 12345
```

### 4. See Verified Badge
```
Result: Verified badge with proof QR
Download: Proof image
Share: Verified review URL
```

---

## Run Validation

Prove the system works with cryptographic hashes:

```
http://localhost:8000/reviews/validate.html
```

Click "▶ Run Full Validation" → All 6 cells should pass → Download transcript

---

## Directory Structure

```
/reviews/
├── README.md               (this file)
├── index.html             (QR generator)
├── form.html              (review form)
├── verified.html          (verification page)
├── validate.html          (validation suite)
├── validate-teaching.html (teaching prototype)
├── wordlist.js            (BIP39 words)
├── /admin/                (admin dashboard)
│   └── index.html
└── /docs/
    ├── STRIPE_SETUP.md
    ├── VALIDATION.md
    ├── ROADMAP.md
    └── BLACK_BOX_ARCHITECTURE.md
```

---

## URLs

### Local Development
- Entry point: `http://localhost:8000/reviews/`
- Review form: `http://localhost:8000/reviews/form.html?business=ID`
- Verified: `http://localhost:8000/reviews/verified.html?business=ID`
- Validation: `http://localhost:8000/reviews/validate.html`

### Production (After Deployment)
- Entry point: `https://soulfra.com/reviews/`
- Review form: `https://soulfra.com/reviews/form.html?business=ID`
- Verified: `https://soulfra.com/reviews/verified.html?business=ID`
- Validation: `https://soulfra.com/reviews/validate.html`

---

## Features

### Current (Phase 0)
✅ QR code generation with word-based IDs
✅ Review form with validation
✅ Stripe payment integration ($1 test mode)
✅ Verification badge with proof QR
✅ Cryptographic validation (SHA-256 hashes)
✅ Downloadable transcripts

### Next (Phase 1)
🚧 Payment receipts on verified page
🚧 Apple Pay / Google Pay support
🚧 Email receipts (optional)

### Future (Phase 2-6)
📋 Deploy to production (soulfra.com/reviews)
📋 User accounts & backend
📋 Device-specific QR codes
📋 12-word recovery phrases
📋 AI teaching system (CCNA integration)

---

## Stripe Configuration

**Current Status:** Test mode configured

**Payment Link:** `https://buy.stripe.com/test_cNieVd5Vjb6N2ZY6Fq4wM00`

**Redirect URL:** `https://soulfra.com/reviews/verified.html` (update when deploying)

**Full Setup Guide:** See `docs/STRIPE_SETUP.md`

---

## Deploy to Production

### Step 1: Update Stripe Redirect URL
1. Go to Stripe Dashboard → Payment Links
2. Edit payment link
3. Change success URL to: `https://soulfra.com/reviews/verified.html`

### Step 2: Push to GitHub
```bash
git add reviews/
git commit -m "Add organized review system in /reviews/ directory"
git push origin main
```

### Step 3: Verify Live
```
https://soulfra.com/reviews/
```

---

## Troubleshooting

### QR Code Not Generating
- Check browser console (F12) for errors
- Ensure `wordlist.js` is loading
- Verify `nameToWordId()` function exists

### Payment Not Redirecting
- Check Stripe payment link is configured (not `REPLACE_WITH_YOUR_LINK`)
- Verify redirect URL matches deployment (localhost vs soulfra.com)
- Check browser allows popups/redirects

### Verified Page Shows "No Data"
- Don't close browser tab between review → payment → verified
- SessionStorage clears if tab closes
- Avoid private/incognito mode (storage clears faster)

### Validation Fails
- Run validation suite: `http://localhost:8000/reviews/validate.html`
- Check which cell fails
- See error details in browser console
- Refer to `docs/VALIDATION.md` for debugging

---

## Contact & Support

**Project:** Signal Stack Review System
**Domain:** soulfra.com/reviews
**GitHub:** soulfra.github.io/reviews
**Documentation:** reviews/docs/

---

## Status

**Local:** ✅ Working
**Validation:** ✅ All tests pass
**Stripe:** ✅ Test mode configured
**Production:** 🚧 Ready to deploy

**Next Step:** Test locally, then deploy to soulfra.com/reviews/
