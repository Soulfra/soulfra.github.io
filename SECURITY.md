# Security Checklist

## Your Current Approach is SECURE

You're using **Stripe Payment Links** - the simplest, safest method.

---

## What You're Doing RIGHT

### ✅ No Secrets in Frontend

**Your code:**
```javascript
const stripePaymentLink = 'https://buy.stripe.com/test_XXXXXXXXX';
```

**This is safe because:**
- It's a public URL (not a secret key)
- Anyone can see it (that's the point)
- Can be committed to git
- Can be in client-side JavaScript

### ✅ Stripe Handles Card Data

**Flow:**
```
Customer clicks "Pay $1"
   ↓
Redirects to stripe.com
   ↓
Customer enters card on Stripe's servers
   ↓
Stripe processes payment
   ↓
Redirects back to your site
```

**You never:**
- See card numbers
- Store card data
- Touch sensitive information
- Need SSL certificate for payment processing

### ✅ PCI Compliance Level 4 (Simplest)

**What this means:**
- Fill out simple questionnaire once a year
- No security scans required
- No onsite audit required
- Stripe does the heavy lifting

**SAQ-A (Self Assessment Questionnaire):**
- 22 yes/no questions
- Takes 10 minutes
- Found at: https://dashboard.stripe.com/settings/compliance

---

## What NOT to Do

### ❌ Never Commit API Keys

**If you ever use Stripe API (webhooks, refunds), you'll have:**
- **Secret key** (starts with `sk_live_` or `sk_test_`)
- **Publishable key** (starts with `pk_live_` or `pk_test_`)

**Secret key = password** → NEVER put in frontend or commit to git

**How to handle:**
```bash
# Create .env file (local only)
STRIPE_SECRET_KEY=sk_test_XXXXXXXXX

# Add to .gitignore
echo ".env" >> .gitignore

# Use in backend only
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
```

### ❌ Don't Store Customer Data Without Encryption

**If you add backend database:**
- Don't store card numbers (use Stripe customer IDs)
- Encrypt email addresses
- Hash passwords (bcrypt)
- Use HTTPS for all traffic

### ❌ Don't Skip HTTPS on Production

**For localhost:** HTTP is fine
**For production:** MUST use HTTPS

**GitHub Pages:** Automatically HTTPS (you're good)
**Custom domain:** Enable SSL in DNS settings

---

## What You DO Need to Worry About

### 1. Don't Commit Sensitive Data

**Before committing, check:**
```bash
# Search for potential secrets
grep -r "sk_live" .
grep -r "sk_test" .
grep -r "password" .
```

**Add to .gitignore:**
```
.env
.env.local
*.key
*.pem
config/secrets.json
```

### 2. Validate on Backend (Future)

**When you add backend:**
- Validate review length (prevent spam)
- Rate limiting (max 5 reviews/minute per IP)
- Sanitize input (prevent XSS)

**Example:**
```javascript
// BAD (client-side only)
if (reviewText.length < 10) {
  alert('Too short');
}

// GOOD (backend validation too)
app.post('/api/review', (req, res) => {
  if (req.body.text.length < 10 || req.body.text.length > 500) {
    return res.status(400).json({ error: 'Invalid length' });
  }
  // Save review...
});
```

### 3. Use Environment Variables (When You Add Backend)

**Don't do this:**
```javascript
const stripe = require('stripe')('sk_test_HARDCODED_KEY');  // ❌ BAD
```

**Do this:**
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);  // ✅ GOOD
```

---

## Stripe Payment Links vs API vs Webhooks

### Payment Links (What You're Using)

**Security level:** 🟢 Safest
```
- No secrets needed
- No backend required
- No SSL required (for payment)
- Stripe handles everything
```

**What you can do:**
- Charge customers
- Redirect after payment
- No refunds, no webhooks, no custom logic

### Stripe API (Advanced)

**Security level:** 🟡 Medium
```
- Requires secret key
- Backend server needed
- Must protect API keys
- More control, more responsibility
```

**What you can do:**
- Create custom checkout
- Issue refunds
- Look up payment details
- Update customer info

**Example:**
```javascript
// Backend only (never frontend)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const refund = await stripe.refunds.create({
  payment_intent: 'pi_XXXXX',
});
```

### Webhooks (Most Complex)

**Security level:** 🟠 Complex
```
- Public endpoint (anyone can call)
- Must verify webhook signatures
- Must be idempotent
- Requires HTTPS
```

**What you can do:**
- Auto-refund after 28 days
- Send confirmation emails
- Update database after payment
- Handle failed payments

**Example:**
```javascript
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  req.body,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
);

if (event.type === 'payment_intent.succeeded') {
  // Auto-refund logic here
}
```

---

## When to Upgrade Your Security

### Stick with Payment Links if:
- [ ] Under 100 reviews/day
- [ ] No custom logic needed
- [ ] Simple $1 flat rate
- [ ] Don't need refunds
- [ ] Want simplest setup

### Upgrade to API if you need:
- [ ] Custom refund logic
- [ ] Different prices per business
- [ ] Subscription billing
- [ ] Customer portal
- [ ] Detailed analytics

### Add Webhooks if you need:
- [ ] Auto-refund after X days
- [ ] Email confirmations
- [ ] Update external database
- [ ] Handle failed payments
- [ ] Track customer lifecycle

---

## Quick Security Checklist

**Before deploying:**
- [ ] No `sk_live_` or `sk_test_` keys in frontend code
- [ ] No passwords in git history
- [ ] .env file in .gitignore
- [ ] HTTPS enabled (GitHub Pages does this automatically)
- [ ] Payment link redirect URL is correct domain

**If using backend:**
- [ ] Environment variables for secrets
- [ ] Input validation on server
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] Error messages don't leak sensitive info

**Monthly:**
- [ ] Review Stripe dashboard for suspicious activity
- [ ] Check failed payments
- [ ] Update dependencies (`npm audit`)

**Yearly:**
- [ ] Complete PCI SAQ-A questionnaire in Stripe dashboard

---

## What You DON'T Need

❌ SSL certificate for localhost testing
❌ PCI DSS certification (Stripe is certified)
❌ Security audit (unless processing $6M+/year)
❌ Penetration testing (for simple Payment Links)
❌ Web Application Firewall (unless high traffic)
❌ DDoS protection (unless targeted)

---

## Summary

**Your current setup:**
```
Payment Link (public URL)
   ↓
Stripe's servers (they handle security)
   ↓
Redirect back to you
```

**Security checklist:**
- ✅ Using Payment Links (safest method)
- ✅ No secrets in frontend
- ✅ Stripe handles card data
- ✅ PCI Level 4 compliance (simplest)
- ✅ GitHub Pages has HTTPS

**You're good to go.**

When you add backend/webhooks later, refer to the "Stripe API" and "Webhooks" sections above.
