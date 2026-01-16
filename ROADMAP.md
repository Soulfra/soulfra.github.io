# Feature Roadmap

## Current Status: Phase 0 Complete ✅

You have a working $1 verified review system:
- QR generation with word-based IDs
- Review form
- Stripe payment integration
- Verification badge

---

## Phase 1: Payment Receipts & Apple Pay (NEXT)

**Time:** 15 minutes
**Difficulty:** Easy (just Stripe dashboard toggles + HTML updates)

### Features:
1. ✅ Show payment receipt on verified.html
2. ✅ Enable Apple Pay / Google Pay in Stripe
3. ✅ Display payment confirmation details

### Steps:
1. Update verified.html to show receipt details
2. In Stripe dashboard: Settings → Payment methods → Enable Apple Pay / Google Pay
3. Test payment with Apple Pay (if on iPhone/Mac)

**File Changes:**
- `verified.html` - Add receipt section
- Stripe dashboard - Enable wallet payments

---

## Phase 2: Deploy to Production

**Time:** 30 minutes
**Difficulty:** Medium (domain setup, git, Stripe live mode)

### Features:
1. Deploy to soulfra.github.io (or soulfra.com)
2. Switch Stripe to live mode
3. Real $1 payments

### Steps:
1. Git push to GitHub
2. Enable GitHub Pages in repo settings
3. Update Stripe payment link redirect URL to production domain
4. Create LIVE Stripe payment link (not test)
5. Update review.html with live link
6. Test with real card

**File Changes:**
- `review.html` - Update Stripe link (live not test)
- Stripe dashboard - Create live payment link with prod URL

---

## Phase 3: User Accounts & Backend

**Time:** 2-3 days
**Difficulty:** Hard (requires backend coding)

### Features:
1. User signup/login
2. Email verification
3. User dashboard
4. Backend database (PostgreSQL or SQLite)

### What You Need:
- Backend server (Node.js + Express, or Python + Flask)
- Database (Supabase, PostgreSQL, or SQLite)
- Email service (SendGrid or Resend)
- Session management (JWT or cookies)

### Architecture:
```
Frontend (GitHub Pages)
    ↓
Backend (Vercel/Railway/Heroku)
    ↓
Database (Supabase/PostgreSQL)
```

### New Files:
- `/api/auth.js` - Login/signup endpoints
- `/api/users.js` - User management
- `/api/db.js` - Database connection
- `/dashboard.html` - User dashboard
- `.env` - Secrets (database URL, JWT key)

### Steps:
1. Choose backend platform (Vercel/Railway recommended)
2. Set up PostgreSQL database
3. Create auth endpoints
4. Build dashboard UI
5. Connect frontend to backend

---

## Phase 4: Device-Specific Features

**Time:** 1-2 days
**Difficulty:** Hard (device fingerprinting, unique IDs)

### Features:
1. Device fingerprinting (browser + device info)
2. Unique QR code per user (not per business)
3. IMEI tracking (mobile only, limited access)
4. Device-linked accounts

### How It Works:
```
User signs up on iPhone
    ↓
Generate fingerprint: {
    userAgent,
    screenSize,
    timezone,
    language,
    deviceMemory,
    hardwareConcurrency
}
    ↓
Hash fingerprint → Device ID
    ↓
Link Device ID to user account
    ↓
Generate QR code for this device
```

### Tech Stack:
- FingerprintJS (library for device detection)
- Crypto (hash device info)
- Database (store device → user mapping)

### Limitations:
- IMEI: Only accessible in native apps (not web)
- Fingerprints can change (browser updates, VPN)
- Privacy concerns (GDPR compliance)

**Alternative:** Use Stripe Customer ID as unique identifier (simpler, more reliable)

---

## Phase 5: Recovery Phrases (BIP39)

**Time:** 1 day
**Difficulty:** Medium (crypto concepts, secure storage)

### Features:
1. Generate 12-word recovery phrase on signup
2. Encrypt user data with phrase
3. Account recovery without email
4. Backup/restore functionality

### How It Works:
```
User signs up
    ↓
Generate 12 words from BIP39 wordlist
Example: "purple mountain tiger defend couch..."
    ↓
Derive encryption key from phrase
    ↓
Encrypt user data (email, settings)
    ↓
Store encrypted data in database
    ↓
User writes down 12 words (like crypto wallet)
    ↓
If forgot password: Enter 12 words → Decrypt data → Restore access
```

### Tech:
- `bip39` library (npm package)
- `crypto` for encryption (AES-256)
- Secure storage (never store plain phrase)

### Files:
- `/api/recovery.js` - Generate/verify phrases
- `/recovery.html` - Account recovery page
- `wordlist.js` (already exists!)

---

## Phase 6: AI Features ("Ask Random Questions")

**Time:** 3-5 days
**Difficulty:** Very Hard (NLP, AI integration, dynamic forms)

### Features:
1. AI-generated security questions
2. Natural language review processing
3. Sentiment analysis
4. Dynamic form generation based on context

### Example Flow:
```
User: "I want to leave a review for a coffee shop"
    ↓
AI: Generates custom questions:
  - "How was the coffee quality? ☕"
  - "Was the atmosphere cozy? 🛋️"
  - "Would you recommend the pastries? 🥐"
    ↓
User answers in natural language
    ↓
AI: Extracts rating, sentiment, key points
    ↓
Generates structured review automatically
```

### Tech Stack:
- OpenAI API or Anthropic Claude API (for NLP)
- Ollama (local AI, free but slower)
- Sentiment analysis library
- Dynamic form builder (React or Vue)

### Cost:
- OpenAI: ~$0.01 per review (100 reviews = $1)
- Claude: ~$0.015 per review
- Ollama: Free but need powerful server

---

## Recommended Order

### Week 1:
- ✅ Phase 0: Test current system ← YOU ARE HERE
- [ ] Phase 1: Payment receipts + Apple Pay
- [ ] Phase 2: Deploy to production

### Week 2:
- [ ] Phase 3: User accounts + backend

### Week 3:
- [ ] Phase 4: Device-specific features
- [ ] Phase 5: Recovery phrases

### Week 4+:
- [ ] Phase 6: AI features
- [ ] Analytics dashboard
- [ ] Business subscription tiers
- [ ] API for integrations

---

## Quick Wins (Add Anytime)

These are small features you can add without breaking existing stuff:

### Email Notifications (1 hour)
- Use Resend.com (free 100 emails/day)
- Send email after verification
- Include proof QR in email

### Custom Branding (30 min)
- Let businesses upload logo
- Show logo on review form
- Include in QR code design

### Review Analytics (2 hours)
- Average rating per business
- Total reviews
- Chart of ratings over time

### Export Reviews (30 min)
- Download as CSV
- PDF report
- Share link

---

## What NOT to Build (Yet)

❌ Complex admin dashboard (until you have 100+ reviews)
❌ Mobile app (web works fine for now)
❌ Real-time chat (overkill)
❌ Video reviews (storage expensive)
❌ Multi-language support (English first)
❌ White label (until you have paying customers)

---

## Next Immediate Step

**Did you complete the test payment and see the verified badge?**

If YES → Start Phase 1 (payment receipts)
If NO → Go back and complete Phase 0 test

**Phase 1 files I'll create:**
1. Update verified.html with receipt section
2. APPLE_PAY_SETUP.md (how to enable in Stripe)
3. receipt-example.html (what it looks like)

Let me know when you've tested the full flow and I'll build Phase 1.
