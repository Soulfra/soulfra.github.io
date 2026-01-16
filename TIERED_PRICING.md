# Tiered Pricing with Stripe Pricing Tables

## What You're Building

Visual pricing comparison where customers choose their tier:

```
┌────────────────────────────────────────────────────┐
│  BASIC      │    PRO          │  ENTERPRISE        │
├─────────────┼─────────────────┼────────────────────┤
│ 28 days     │ 14 days free    │ 7 days free        │
│ free        │                 │                    │
│             │                 │                    │
│ $1/review   │ $0.75/review    │ $0.50/review       │
│             │ Unlimited       │ Unlimited          │
│             │ reviews         │ Analytics          │
│             │                 │ Priority support   │
│             │                 │ API access         │
└─────────────┴─────────────────┴────────────────────┘
```

**Inverse relationship:** Higher tier = fewer free days (creates urgency)

---

## How Stripe Pricing Tables Work

**Old way (what we have now):**
- Payment Link = single price
- Customer goes directly to checkout
- No choice, no comparison

**New way (Pricing Tables):**
- Show multiple tiers side-by-side
- Customer picks tier visually
- Stripe generates comparison table
- One embed code, handles everything

**Benefits:**
- No coding required
- Updates in Stripe dashboard (no redeploy)
- Mobile responsive
- A/B testing built-in
- Conversion tracking

---

## Step-by-Step Setup

### 1. Create Products in Stripe

Go to https://dashboard.stripe.com/products

**Product 1: Basic Tier**
- Name: `Verified Reviews - Basic`
- Pricing: Recurring, monthly
- Price: $1.00/month
- Description: `Basic verified reviews for small businesses`
- Trial period: 28 days
- Click "Save product"

**Product 2: Pro Tier**
- Name: `Verified Reviews - Pro`
- Pricing: Recurring, monthly
- Price: $7.50/month (approx 10 reviews at $0.75 each)
- Description: `Unlimited verified reviews for growing businesses`
- Trial period: 14 days
- Features:
  - Unlimited reviews
  - Email notifications
  - Basic analytics
- Click "Save product"

**Product 3: Enterprise Tier**
- Name: `Verified Reviews - Enterprise`
- Pricing: Recurring, monthly
- Price: $29.99/month
- Description: `Premium verified reviews with full analytics`
- Trial period: 7 days
- Features:
  - Unlimited reviews
  - Priority support
  - Advanced analytics
  - API access
  - White label option
- Click "Save product"

---

### 2. Create Pricing Table

Go to https://dashboard.stripe.com/pricing-tables

1. Click "+ New pricing table"
2. Add your 3 products:
   - Basic ($1/month, 28-day trial)
   - Pro ($7.50/month, 14-day trial)
   - Enterprise ($29.99/month, 7-day trial)

3. Customize appearance:
   - **Header:** "Choose Your Plan"
   - **Highlight:** Mark "Pro" as "Most Popular"
   - **Button text:** "Start Free Trial"
   - **Colors:** Match your brand (green #00ff88)

4. Configure options:
   - Enable trial periods: ✓
   - Show features: ✓
   - Allow monthly/yearly toggle: ✓ (optional)
   - Customer information to collect:
     - Email (required)
     - Name (optional)

5. Click "Create pricing table"

6. **Copy the embed code** - looks like:
   ```html
   <script async src="https://js.stripe.com/v3/pricing-table.js"></script>
   <stripe-pricing-table
     pricing-table-id="prctbl_XXXXXXXXX"
     publishable-key="pk_test_XXXXXXXXX">
   </stripe-pricing-table>
   ```

---

### 3. Add to Your Site

Create `pricing.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Choose Your Plan</title>
    <style>
        body {
            font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
            background: #0a0a0a;
            color: #00ff88;
            padding: 40px 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            font-size: 36px;
            margin-bottom: 20px;
        }
        .subtitle {
            text-align: center;
            color: #888;
            margin-bottom: 60px;
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Choose Your Plan</h1>
        <p class="subtitle">Higher tiers = fewer free days. Pick your commitment level.</p>

        <!-- PASTE YOUR STRIPE PRICING TABLE CODE HERE -->
        <script async src="https://js.stripe.com/v3/pricing-table.js"></script>
        <stripe-pricing-table
          pricing-table-id="prctbl_REPLACE_WITH_YOUR_ID"
          publishable-key="pk_test_REPLACE_WITH_YOUR_KEY">
        </stripe-pricing-table>
    </div>
</body>
</html>
```

Replace `REPLACE_WITH_YOUR_ID` and `REPLACE_WITH_YOUR_KEY` with your actual values from Stripe.

---

## Pricing Strategy: Inverse Relationship

### Traditional Model (More $ = More Free Time)
```
Basic: 7 days free, $1/month
Pro: 14 days free, $10/month
Enterprise: 30 days free, $50/month
```
**Problem:** People choose basic, milk the free trial, never upgrade

### Your Model (More $ = Less Free Time)
```
Basic: 28 days free, $1/month
Pro: 14 days free, $7.50/month
Enterprise: 7 days free, $29.99/month
```

**Why this works:**
- **Commitment signal:** Higher tiers attract serious customers
- **Less tire-kicking:** Shorter trials filter out freeloaders
- **Urgency:** 7-day trial for enterprise creates FOMO
- **Value perception:** "Enterprise doesn't need a long trial, it's that good"

### Psychology Explained

**Basic tier:**
- 28 days = safe, low-risk
- For small businesses testing the waters
- Price-sensitive customers
- Monthly churn likely high

**Pro tier:**
- 14 days = confidence in product
- For growing businesses ready to commit
- Willing to pay more = better retention
- "Most Popular" badge drives conversions

**Enterprise tier:**
- 7 days = "we know it's good, just try it"
- For established businesses
- Need features NOW (analytics, API)
- Shortest trial = highest commitment = best customers

---

## Features Per Tier

### Basic ($1/month, 28-day trial)
```
✓ 1 verified review per month
✓ QR code generator
✓ Verification badge
✓ Basic email support
```

### Pro ($7.50/month, 14-day trial)
```
✓ Everything in Basic
✓ Unlimited verified reviews
✓ Email notifications
✓ Review analytics (basic)
✓ Custom branding
✓ Priority email support
```

### Enterprise ($29.99/month, 7-day trial)
```
✓ Everything in Pro
✓ Advanced analytics dashboard
✓ API access
✓ Webhook integrations
✓ White label option
✓ Dedicated account manager
✓ 24/7 priority support
✓ Custom integrations
```

---

## Testing the Pricing Table

### Test Mode

1. Make sure you're in **Test mode** (toggle in Stripe dashboard)
2. Create test pricing table with test products
3. Use test publishable key (`pk_test_...`)
4. Test card: `4242 4242 4242 4242`

### Test Different Scenarios

**Scenario 1: Customer chooses Basic**
- Starts 28-day free trial
- Charged $1 on day 29
- Can cancel anytime

**Scenario 2: Customer chooses Pro**
- Starts 14-day free trial
- Charged $7.50 on day 15
- Can cancel anytime

**Scenario 3: Customer chooses Enterprise**
- Starts 7-day free trial
- Charged $29.99 on day 8
- Can cancel anytime

### What Happens After Trial

Stripe automatically:
- Sends email 3 days before trial ends
- Charges card on trial end date
- Sends receipt
- Continues subscription monthly

You can configure:
- Trial end reminders
- Failed payment retries
- Cancellation flow
- Dunning emails

---

## Revenue Projections

### Conservative (100 customers)

```
Basic: 60 customers × $1 = $60/month
Pro: 30 customers × $7.50 = $225/month
Enterprise: 10 customers × $29.99 = $299.90/month

Total: $584.90/month
Stripe fees: ~$35
Net: ~$550/month
```

### Moderate (500 customers)

```
Basic: 300 × $1 = $300/month
Pro: 150 × $7.50 = $1,125/month
Enterprise: 50 × $29.99 = $1,499.50/month

Total: $2,924.50/month
Stripe fees: ~$175
Net: ~$2,750/month
```

### Optimistic (2,000 customers)

```
Basic: 1,000 × $1 = $1,000/month
Pro: 800 × $7.50 = $6,000/month
Enterprise: 200 × $29.99 = $5,998/month

Total: $12,998/month
Stripe fees: ~$780
Net: ~$12,218/month
```

---

## A/B Testing Ideas

### Test #1: Trial Length

**Version A (Inverse):**
- Basic: 28 days, Pro: 14 days, Enterprise: 7 days

**Version B (Traditional):**
- Basic: 7 days, Pro: 14 days, Enterprise: 30 days

Measure: Which converts more Pro/Enterprise customers?

### Test #2: Pricing

**Version A (Current):**
- $1 / $7.50 / $29.99

**Version B (Round Numbers):**
- $1 / $10 / $30

Measure: Which feels more premium?

### Test #3: Feature Emphasis

**Version A:** Emphasize "Unlimited reviews"
**Version B:** Emphasize "Analytics" and "API"

Measure: Which feature drives upgrades?

---

## Conversion Optimization Tips

### 1. Highlight Pro Tier
- Add "Most Popular" badge
- Make it visually prominent
- Use brighter color

### 2. Show Savings
- Add "Save 25% with annual billing"
- Show monthly equivalent

### 3. Social Proof
- "Join 1,000+ businesses"
- Customer testimonials above table

### 4. Feature Comparison
- Add "Compare plans" expandable section
- Show feature checklist

### 5. FAQ Below Table
- "Can I change plans?" → Yes, anytime
- "What if I cancel?" → No fees, keep reviews
- "Is there a setup fee?" → No, free to start

---

## Automating Everything

### Current Flow (Manual)

```
Customer scans QR
   ↓
Leaves review
   ↓
Pays $1
   ↓
Gets verified badge
```

### With Pricing Table (Automated)

```
Business signs up
   ↓
Chooses tier (Basic/Pro/Enterprise)
   ↓
Starts free trial
   ↓
Gets QR codes
   ↓
Customers leave reviews
   ↓
Auto-charged at trial end
   ↓
Reviews kept if active subscription
```

**Automated with webhooks:**
- New subscription → Generate business account
- Trial ending → Send reminder email
- Payment failed → Retry 3x, then suspend
- Upgraded tier → Unlock new features
- Cancelled → Archive reviews, disable new submissions

---

## Next Steps

1. **Create 3 products in Stripe** (Basic, Pro, Enterprise)
2. **Set trial periods** (28, 14, 7 days)
3. **Create pricing table** in Stripe dashboard
4. **Copy embed code**
5. **Create pricing.html** with embed code
6. **Test in test mode** with test card
7. **Switch to live mode** when ready
8. **Add to main site** (link from homepage)

---

## Summary

**Inverse pricing model:**
- Higher tier = fewer free days
- Creates urgency
- Filters serious customers

**Pricing table benefits:**
- Visual comparison
- No coding
- Update in dashboard
- Conversion optimized

**Revenue potential:**
- 100 customers = $550/month
- 500 customers = $2,750/month
- 2,000 customers = $12,218/month

**Implementation time:** 15 minutes (vs. days of custom code)

Start with Stripe Pricing Tables. Scale with automation.
