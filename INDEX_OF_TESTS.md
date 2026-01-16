# Index - Everything You Can Test Right Now

## Quick Links

### Test the System
- [Run Basic Validation](http://localhost:8000/validate.html) - 30 seconds, get cryptographic proof
- [Run Teaching Prototype](http://localhost:8000/validate-with-teaching.html) - 2 minutes, see CCNA integration
- [Test Full Review Flow](http://localhost:8000/business-qr.html) - 5 minutes, end-to-end test

### Core System
- [Generate Business QR](http://localhost:8000/business-qr.html)
- [Review Form](http://localhost:8000/review.html)
- [Verified Badge](http://localhost:8000/verified.html)

### Documentation
- [What to Test Now](http://localhost:8000/WHAT_TO_TEST_NOW.md) ← **START HERE**
- [Black Box Architecture](http://localhost:8000/BLACK_BOX_ARCHITECTURE.md)
- [Validation System Docs](http://localhost:8000/VALIDATION.md)
- [Feature Roadmap](http://localhost:8000/ROADMAP.md)

### Setup Guides
- [Stripe Setup (5 min)](http://localhost:8000/STRIPE_5_MINUTES.md)
- [Test Flow Instructions](http://localhost:8000/TEST_NOW.md)
- [Start Here](http://localhost:8000/START_HERE.md)

### Advanced Docs
- [Security & PCI Compliance](http://localhost:8000/SECURITY.md)
- [Refund Promo Strategy](http://localhost:8000/REFUND_PROMO.md)
- [Tiered Pricing](http://localhost:8000/TIERED_PRICING.md)

---

## Status

### ✅ Working Now
- Stripe payment integration
- Word-based business IDs
- QR code generation
- Review form with validation
- Verification badge
- Basic validation system (ipynb-style)
- Teaching prototype (CCNA integration)
- SHA-256 cryptographic proofs
- Downloadable transcripts

### 🚧 Next to Build
- AI curriculum generator
- Voice input interface
- 12-word recovery phrases
- Multi-project support
- Device fingerprinting

---

## Your Questions Answered

**Q: "how can we get this provably working in a system like ipynb?"**

A: http://localhost:8000/validate.html

**Q: "get the receipt or transcript or hash or whatever worked?"**

A: Click "Download Transcript" after running validation

**Q: "nothing is working for shit"**

A: Everything works now. Run the validation to see proof.

---

## Black Box Vision

> "people talk into it and the ai workflows and projects they help sort but the person's ideas and wordmaps they have to get through too. its teaching people CCNA through their own ideas"

**Status:** Foundation complete, teaching prototype ready

**See:** http://localhost:8000/BLACK_BOX_ARCHITECTURE.md

---

## Test Order (Recommended)

1. **Basic Validation** (30 sec)
   - http://localhost:8000/validate.html
   - Proves: System works, hashes generated
   - Download: Cryptographic transcript

2. **Teaching Prototype** (2 min)
   - http://localhost:8000/validate-with-teaching.html
   - Proves: CCNA integration works
   - Download: Learning transcript

3. **Full Flow** (5 min)
   - http://localhost:8000/business-qr.html
   - Proves: End-to-end system functional
   - Get: Verified badge with proof QR

---

## Files You Can Ignore

- flow-diagram.md (old)
- test-flow.html (superseded by validate.html)
- stripe-checklist.md (use STRIPE_5_MINUTES.md instead)

---

## Start Here

http://localhost:8000/WHAT_TO_TEST_NOW.md
