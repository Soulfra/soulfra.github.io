# 100% Refund Marketing Promo

## Your Idea

**Concept:**
```
Customer pays $1 for verified review
   ↓
Track if they upgrade within 28 days
   ↓
If NO upgrade → Auto-refund $1
   ↓
Result: Free verified reviews if you don't convert
```

**Marketing angle:**
- "Risk-free verification"
- "Try premium for 28 days, keep $1 if you upgrade"
- "Get your $1 back if we don't deliver value"

**Psychological hook:**
- Removes barrier to entry ($1 feels free)
- Incentivizes upgrade (keep the $1)
- Shows confidence in product

---

## Two Approaches

### Approach 1: Auto-Refund (Complex)

**What it requires:**

1. **Backend server** to track state
2. **Stripe webhooks** to detect payments
3. **Database** to store:
   - Payment ID
   - Business ID
   - Timestamp
   - Upgrade status
4. **Cron job** to check 28-day window
5. **Stripe API** to issue refunds

**Complexity:** 🔴 High

**Files needed:**
```
/api/webhook-handler.js        - Receive Stripe events
/api/refund-scheduler.js        - Check 28-day windows
/api/database-schema.sql        - Store payment data
/.env                           - Stripe secret keys
/package.json                   - Add dependencies
```

**Security requirements:**
- Webhook signature verification
- Secret key protection
- HTTPS endpoint
- Idempotent processing

**Cost:**
- Stripe: $0.30 + 2.9% per payment
- Stripe: $0.30 + 2.9% per refund
- **Net cost:** ~$0.60 in fees (you lose money on refunds)

### Approach 2: Simple Promo Codes (Easy)

**What it requires:**

1. Create promo code in Stripe dashboard
2. Share code with customers
3. No backend, no webhooks, no complexity

**Complexity:** 🟢 Low

**How it works:**
```
Customer sees: "Use code FIRST28FREE"
   ↓
Enters code at checkout
   ↓
First 28 days free (or first 3 reviews free)
   ↓
After trial, pays $1 per review
```

**No refund needed - just free upfront**

---

## Comparison

| Feature | Auto-Refund | Promo Codes |
|---------|-------------|-------------|
| **Setup time** | 2-3 days | 5 minutes |
| **Code complexity** | High | None |
| **Backend required** | Yes | No |
| **Stripe fees** | 2x (payment + refund) | 1x (only charged reviews) |
| **Risk of abuse** | Medium (request refund + never upgrade) | Low (limited uses) |
| **Marketing message** | "Get $1 back" | "First 3 free" |
| **Maintenance** | Ongoing (cron jobs) | None |

---

## Recommended: Hybrid Approach

**Phase 1: Simple Promo (Now)**
```
Create Stripe coupon:
- Code: "FIRST28FREE"
- Duration: 28 days
- 100% off

OR

- Code: "FIRST3FREE"
- Duration: First 3 reviews
- 100% off
```

**Test the model:**
- See if customers use free reviews
- Track upgrade rate
- No complex infrastructure

**If it works:**
→ Move to Phase 2

**Phase 2: Auto-Refund (Later)**

Only build complex refund system if:
- [ ] Promo codes aren't converting
- [ ] Need "money back guarantee" angle
- [ ] Have budget for double Stripe fees
- [ ] Ready to maintain webhook infrastructure

---

## How to Create Stripe Promo Code (5 Minutes)

### Option 1: 28 Days Free

1. Go to https://dashboard.stripe.com/coupons
2. Click "+ New coupon"
3. Fill out:
   - **Name:** "First 28 Days Free"
   - **ID:** `FIRST28FREE`
   - **Discount:** 100% off
   - **Duration:** Once (or Repeating for 28 days if subscription)
4. Click "Create coupon"
5. Share code with customers

**Usage in Payment Link:**
- Customer enters `FIRST28FREE` at checkout
- First payment is $0
- After 28 days (if subscription), regular $1 charge resumes

### Option 2: First 3 Reviews Free

1. Create coupon:
   - **Name:** "First 3 Reviews Free"
   - **ID:** `FIRST3FREE`
   - **Discount:** 100% off
   - **Duration:** Repeating
   - **Repeats for:** 3 months (if monthly) or 3 invoices
2. Customer gets 3 free verified reviews
3. 4th review costs $1

### Option 3: Launch Discount

1. Create coupon:
   - **Name:** "Launch Special"
   - **ID:** `LAUNCH50`
   - **Discount:** 50% off
   - **Duration:** Forever
2. Early adopters pay $0.50 instead of $1
3. Later customers pay full $1

---

## Auto-Refund Implementation (If You Really Want It)

**WARNING:** Only proceed if you've tested promo codes and need the refund angle.

### Step 1: Set Up Webhooks

**Create webhook endpoint:**
```javascript
// api/webhook.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./database');

app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const payment = event.data.object;

    // Save payment to database
    await db.savePayment({
      paymentId: payment.id,
      businessId: payment.metadata.businessId,
      amount: payment.amount,
      timestamp: new Date(),
      refundEligible: true,
      upgradeStatus: 'pending'
    });
  }

  res.json({ received: true });
});
```

### Step 2: Track Upgrades

**When customer upgrades:**
```javascript
// api/upgrade.js
app.post('/api/upgrade', async (req, res) => {
  const { businessId } = req.body;

  // Mark all payments as upgraded (no refund)
  await db.updatePayments({
    businessId,
    upgradeStatus: 'upgraded',
    refundEligible: false
  });

  res.json({ success: true });
});
```

### Step 3: Scheduled Refund Check

**Run daily cron job:**
```javascript
// api/refund-scheduler.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./database');

async function checkRefunds() {
  const now = new Date();
  const cutoff = new Date(now - 28 * 24 * 60 * 60 * 1000); // 28 days ago

  // Find payments older than 28 days, not upgraded
  const eligiblePayments = await db.getPayments({
    timestamp: { $lt: cutoff },
    upgradeStatus: 'pending',
    refundEligible: true
  });

  for (const payment of eligiblePayments) {
    try {
      // Issue refund
      const refund = await stripe.refunds.create({
        payment_intent: payment.paymentId,
        reason: 'requested_by_customer'
      });

      // Mark as refunded
      await db.updatePayment(payment.id, {
        refundEligible: false,
        refundedAt: new Date(),
        refundId: refund.id
      });

      console.log(`Refunded ${payment.paymentId}`);
    } catch (err) {
      console.error(`Failed to refund ${payment.paymentId}:`, err);
    }
  }
}

// Run every day at midnight
setInterval(checkRefunds, 24 * 60 * 60 * 1000);
```

### Step 4: Stripe Dashboard Setup

1. Go to https://dashboard.stripe.com/webhooks
2. Click "+ Add endpoint"
3. URL: `https://yourdomain.com/webhook`
4. Events to send:
   - `payment_intent.succeeded`
   - `charge.refunded`
5. Copy webhook secret to `.env`

### Step 5: Database Schema

```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  payment_id VARCHAR(255) UNIQUE NOT NULL,
  business_id VARCHAR(255) NOT NULL,
  amount INTEGER NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  upgrade_status VARCHAR(50) DEFAULT 'pending',
  refund_eligible BOOLEAN DEFAULT TRUE,
  refunded_at TIMESTAMP,
  refund_id VARCHAR(255)
);

CREATE INDEX idx_timestamp ON payments(timestamp);
CREATE INDEX idx_upgrade_status ON payments(upgrade_status);
```

---

## Cost Analysis

### Promo Code Approach

**Example: 100 customers**
```
Free reviews: 100 × $0 = $0 revenue
Stripe fees: $0 (no charge, no fee)

Upgrades: 20 × $10/month = $200/month
Stripe fees: 20 × $0.59 = $11.80
Net: $188.20/month

Non-upgrades: 80 × $0 = $0
Total cost: $0
```

**Result:** $188.20/month profit, $0 sunk cost

### Auto-Refund Approach

**Example: 100 customers**
```
Initial payments: 100 × $1 = $100 revenue
Stripe fees (charge): 100 × $0.33 = $33
Net: $67

Upgrades: 20 keep $1 = $20 retained
Non-upgrades: 80 refunds = $80 returned

Stripe fees (refund): 80 × $0.33 = $26.40
Total fees: $33 + $26.40 = $59.40

Net on $1 reviews: $100 - $80 - $59.40 = -$39.40 (LOSS)

Upgrades: 20 × $10/month = $200/month
Stripe fees: 20 × $0.59 = $11.80
Net: $188.20/month

Total first month: $188.20 - $39.40 = $148.80
```

**Result:** $148.80/month profit, but LOST $39.40 on refunds

---

## Recommendation

**Start with Simple Promo:**

1. Create `FIRST28FREE` coupon in Stripe
2. Add promo code field to review form
3. Market as "First 28 days free"
4. Track conversion rate

**Measure:**
- How many use promo code?
- How many upgrade after 28 days?
- What's customer acquisition cost?

**If promo works:**
→ Keep using it (simpler, cheaper)

**If promo doesn't work:**
→ Test auto-refund messaging
→ A/B test "Get $1 back" vs "Free trial"

---

## Marketing Copy

### Promo Code Approach

**Landing page:**
> Try Verified Reviews Free for 28 Days
>
> Use code FIRST28FREE at checkout
>
> No credit card required until day 29

**Email:**
> Subject: Your Free Trial Starts Now
>
> Thanks for signing up! Your first 28 days are free with code FIRST28FREE.
>
> After your trial, it's just $1 per verified review.

### Auto-Refund Approach

**Landing page:**
> 100% Money-Back Guarantee
>
> Pay $1 now. If you don't upgrade in 28 days, we'll refund it automatically.
>
> Zero risk. All reward.

**Email:**
> Subject: We'll Refund Your $1 if You Don't Love It
>
> Try our verified review system for 28 days. If you don't upgrade to premium, we'll automatically refund your $1.
>
> You literally can't lose.

---

## Summary

**Your idea is great, but:**
- Auto-refund costs 2x in Stripe fees
- Requires complex backend infrastructure
- 2-3 days to build vs 5 minutes for promo code

**Recommendation:**
1. ✅ Start with `FIRST28FREE` promo code (now)
2. Test conversion rates
3. If needed, build auto-refund later (Phase 2)

**Best of both worlds:**
- Offer free trial via promo code
- Add auto-refund as premium marketing angle later
- Test which converts better

Start simple. Scale when proven.
