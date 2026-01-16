# System Flow Diagram

## From Pixel 1 to Verified Badge

Complete map of how everything connects.

---

## The Big Picture

```
Business Setup
      ↓
Customer Reviews
      ↓
Payment
      ↓
Verification
```

---

## Detailed Flow

### Part 1: Business Onboarding

```
┌─────────────────────────────────────────┐
│ 1. Business Owner                       │
├─────────────────────────────────────────┤
│ Opens: business-qr.html                 │
│ Enters: "Joe's Coffee Shop"            │
│ Clicks: "Generate QR Code"              │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ 2. Word-Based ID Generation             │
├─────────────────────────────────────────┤
│ Script: wordlist.js                     │
│ Input: "Joe's Coffee Shop"              │
│ Hash: Business name → 3 words           │
│ Output: "purple-mountain-tiger-472"     │
│                                          │
│ OLD: coffee-shop-x9k2 (random)          │
│ NEW: purple-mountain-tiger (memorable)  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ 3. QR Code Creation                     │
├─────────────────────────────────────────┤
│ Library: qrcodejs                       │
│ Encodes: review.html?business=purple... │
│ Full URL example:                        │
│ http://soulfra.github.io/review.html    │
│   ?business=purple-mountain-tiger-472   │
│                                          │
│ Actions:                                 │
│ - Download PNG                           │
│ - Print sticker                          │
│ - Copy URL                               │
└─────────────────────────────────────────┘
                  ↓
          [QR Code Sticker]
     (Placed in physical business)
```

---

### Part 2: Customer Review Flow

```
┌─────────────────────────────────────────┐
│ 4. Customer Scans QR Code               │
├─────────────────────────────────────────┤
│ Device: Phone camera                    │
│ Detects: QR code URL                    │
│ Opens: review.html?business=purple...   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ 5. Review Form Page                     │
├─────────────────────────────────────────┤
│ File: review.html                       │
│                                          │
│ JavaScript reads URL params:             │
│ - businessId = "purple-mountain..."     │
│ - Display: "Reviewing: PURPLE..."       │
│                                          │
│ Customer fills:                          │
│ - Name: "Sarah Johnson"                 │
│ - Rating: ⭐⭐⭐⭐⭐ (5 stars)           │
│ - Review: "Amazing coffee! Best..."     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ 6. Form Validation                      │
├─────────────────────────────────────────┤
│ Checks:                                  │
│ - Name not empty                         │
│ - Rating selected (1-5)                  │
│ - Review text 10-500 chars               │
│                                          │
│ If valid → continue                      │
│ If invalid → show error                  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ 7. Store in SessionStorage              │
├─────────────────────────────────────────┤
│ Browser API: sessionStorage              │
│ Key: "pendingReview"                     │
│ Value: {                                 │
│   businessId: "purple-mountain...",     │
│   name: "Sarah Johnson",                 │
│   rating: 5,                             │
│   text: "Amazing coffee...",             │
│   timestamp: "2026-01-11T..."           │
│ }                                        │
│                                          │
│ Why sessionStorage:                      │
│ - Temporary (cleared on tab close)       │
│ - Available after Stripe redirect        │
│ - No backend needed yet                  │
└─────────────────────────────────────────┘
                  ↓
          [Click "Pay $1"]
```

---

### Part 3: Payment Flow

```
┌─────────────────────────────────────────┐
│ 8. Stripe Redirect                      │
├─────────────────────────────────────────┤
│ JavaScript (review.html:290):            │
│                                          │
│ const link = 'https://buy.stripe.com/  │
│   test_XXXXXXXXX'                       │
│                                          │
│ window.location.href = link +            │
│   '?client_reference_id=' + businessId  │
│                                          │
│ Browser navigates to Stripe's servers    │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ 9. Stripe Payment Page                  │
├─────────────────────────────────────────┤
│ Domain: checkout.stripe.com              │
│ NOT our code (Stripe handles security)   │
│                                          │
│ Customer enters:                         │
│ - Card: 4242 4242 4242 4242 (test)      │
│ - Expiry: 12/34                          │
│ - CVC: 123                               │
│                                          │
│ Stripe processes:                        │
│ - Validates card                         │
│ - Charges $1.00                          │
│ - Creates payment record                 │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ 10. Payment Success Redirect            │
├─────────────────────────────────────────┤
│ Stripe redirects to:                     │
│ verified.html?business=purple...         │
│                                          │
│ URL configured in:                       │
│ Stripe Dashboard → Payment Links         │
│ → After payment → Redirect URL           │
└─────────────────────────────────────────┘
```

---

### Part 4: Verification

```
┌─────────────────────────────────────────┐
│ 11. Verification Page Load              │
├─────────────────────────────────────────┤
│ File: verified.html                     │
│                                          │
│ JavaScript reads:                        │
│ 1. URL param: businessId                 │
│ 2. sessionStorage: pendingReview         │
│                                          │
│ If both present → show verification      │
│ If missing → show error                  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ 12. Generate Verification ID            │
├─────────────────────────────────────────┤
│ Format: VER-{timestamp}-{random}         │
│ Example: VER-1736611234-X7K2             │
│                                          │
│ Purpose:                                 │
│ - Unique proof of verification           │
│ - Can be looked up later                 │
│ - Included in QR code                    │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ 13. Display Verified Badge              │
├─────────────────────────────────────────┤
│ Shows:                                   │
│ ┌────────────────────┐                  │
│ │   ✓ VERIFIED       │                  │
│ │ VER-1736611234-X7K2│                  │
│ └────────────────────┘                  │
│                                          │
│ Review details:                          │
│ - Name: Sarah Johnson                    │
│ - Rating: ⭐⭐⭐⭐⭐                     │
│ - Review text                            │
│ - Timestamp                              │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ 14. Generate Proof QR Code              │
├─────────────────────────────────────────┤
│ Library: qrcodejs                       │
│ Encodes: verified.html?business=purple  │
│   ...&verify=VER-1736611234-X7K2        │
│                                          │
│ Anyone can scan this QR to:              │
│ - Verify review is legit                 │
│ - See verification timestamp             │
│ - Confirm payment was made               │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ 15. Save to LocalStorage                │
├─────────────────────────────────────────┤
│ Key: "verifiedReviews"                   │
│ Value: Array of all verified reviews     │
│                                          │
│ Persists even after:                     │
│ - Browser close                          │
│ - Tab refresh                            │
│ - Days/weeks later                       │
│                                          │
│ Used for:                                │
│ - Review history                         │
│ - Re-downloading proof                   │
│ - Analytics (future)                     │
└─────────────────────────────────────────┘
                  ↓
          [Download QR Proof]
       [Share Verification URL]
```

---

## Data Flow Summary

### Browser Storage

```
┌──────────────────┬─────────────────┬──────────────┐
│ Storage Type     │ When            │ What         │
├──────────────────┼─────────────────┼──────────────┤
│ sessionStorage   │ Review submit   │ Pending      │
│ (temporary)      │ Before payment  │ review data  │
│                  │                 │              │
│ localStorage     │ After payment   │ Verified     │
│ (permanent)      │ After verified  │ reviews      │
│                  │                 │              │
│ cookies          │ (not used)      │ N/A          │
└──────────────────┴─────────────────┴──────────────┘
```

### URL Parameters

```
business-qr.html → (generates) → review.html?business=X
review.html → (redirects) → stripe.com
stripe.com → (redirects) → verified.html?business=X
verified.html → (generates) → verified.html?business=X&verify=Y
```

### External Services

```
┌──────────────┬────────────────────┬─────────────────┐
│ Service      │ What We Send       │ What We Get     │
├──────────────┼────────────────────┼─────────────────┤
│ Stripe       │ Customer to        │ Payment success │
│ (checkout)   │ payment page       │ + redirect back │
│              │                    │                 │
│ QRCode.js    │ URL string         │ QR code image   │
│ (CDN)        │                    │ (client-side)   │
│              │                    │                 │
│ GitHub Pages │ Static HTML/JS     │ Hosting         │
│ (hosting)    │ files              │ + HTTPS         │
└──────────────┴────────────────────┴─────────────────┘
```

---

## File Dependency Map

```
business-qr.html
    ├─ wordlist.js (BIP39-style IDs)
    └─ qrcodejs (CDN)
        └─ Generates → review.html URL

review.html
    └─ Contains Stripe Payment Link
        └─ Redirects → stripe.com
            └─ Redirects → verified.html

verified.html
    ├─ qrcodejs (CDN)
    └─ Reads sessionStorage
        └─ Generates proof QR

test-flow.html
    └─ Automated test runner
        └─ Tests all pages in sequence
```

---

## Automation Points

### What's Already Automated

✅ QR code generation (client-side)
✅ Review form validation
✅ Stripe redirect
✅ Payment processing (Stripe)
✅ Return to verified page
✅ Proof QR generation
✅ LocalStorage persistence

### What Could Be Automated (Future)

🔄 Email confirmation after payment (requires webhook)
🔄 Auto-save reviews to database (requires backend)
🔄 Analytics tracking (requires backend)
🔄 Review moderation (requires backend)
🔄 Business dashboard (requires backend)
🔄 API for integrations (requires backend)

---

## Test Flow

```
test-flow.html
    ↓
┌─────────────────────────────────┐
│ Step 1: Generate QR             │ ← business-qr.html logic
│ Step 2: Load review form        │ ← review.html exists?
│ Step 3: Fill form               │ ← Simulate form fill
│ Step 4: Submit review           │ ← Check sessionStorage
│ Step 5: Redirect to Stripe      │ ← Check payment link
│ ──────────────────────────────  │
│ Step 6: Complete payment        │ ← MANUAL (test card)
│ Step 7: Load verified page      │ ← MANUAL (check redirect)
│ Step 8: Check badge             │ ← MANUAL (visual verify)
└─────────────────────────────────┘
```

---

## Tiered Pricing Flow (Future)

```
Customer visits: pricing.html
    ↓
<stripe-pricing-table> embedded
    ↓
Shows 3 tiers:
┌───────────────────────────────────────────┐
│ BASIC       PRO         ENTERPRISE        │
│ 28d free    14d free    7d free           │
│ $1/mo       $7.50/mo    $29.99/mo         │
└───────────────────────────────────────────┘
    ↓
Customer chooses tier
    ↓
Stripe checkout (with trial period)
    ↓
Subscription created
    ↓
Business account activated
    ↓
QR codes generated
    ↓
Reviews start coming in
    ↓
Trial ends → Auto-charge
```

---

## Security Flow

```
┌──────────────────────────────────────────┐
│ Customer Side (Public)                   │
├──────────────────────────────────────────┤
│ ✓ review.html (client-side JS)          │
│ ✓ Stripe Payment Link (public URL)      │
│ ✓ No secrets exposed                    │
│ ✓ No API keys in code                   │
└──────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────┐
│ Stripe's Side (Secure)                   │
├──────────────────────────────────────────┤
│ ✓ Card data never touches our servers   │
│ ✓ PCI compliance handled by Stripe      │
│ ✓ Payment processing on stripe.com      │
│ ✓ Only sends success/failure back       │
└──────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────┐
│ Our Side (When We Add Backend)          │
├──────────────────────────────────────────┤
│ ✓ Secret keys in environment variables  │
│ ✓ Webhook signature verification        │
│ ✓ HTTPS only (GitHub Pages auto)        │
│ ✓ Input validation & sanitization       │
└──────────────────────────────────────────┘
```

---

## Word-Based ID Encoding

```
Business name: "Joe's Coffee Shop"
    ↓
Hash function (wordlist.js)
    ↓
Select 3 words from BIP39 list
    ↓
Word 1: "purple"   (hash % 512 = index 234)
Word 2: "mountain" (hash % 512 = index 419)
Word 3: "tiger"    (hash % 512 = index 87)
    ↓
Add timestamp suffix
    ↓
Final ID: "purple-mountain-tiger-472"

Benefits:
✓ Memorable (vs "coffee-x9k2")
✓ Easy to spell over phone
✓ Still unique (512³ × 1000 = 134M combinations)
✓ BIP39 compatible (Bitcoin standard)
```

---

## Complete URL Flow

```
Step 1: Generate QR
URL: http://localhost:8000/business-qr.html
Action: Enter business name
Output: QR code with review URL

Step 2: Customer scans
URL: http://localhost:8000/review.html?business=purple-mountain-tiger-472
Action: Fill review form
Storage: sessionStorage['pendingReview'] = {...}

Step 3: Payment
URL: https://checkout.stripe.com/c/pay/cs_test_XXXXXXXXX
Action: Enter card details
Result: Payment processed

Step 4: Verification
URL: http://localhost:8000/verified.html?business=purple-mountain-tiger-472
Action: Show badge + proof QR
Storage: localStorage['verifiedReviews'].push({...})

Step 5: Share proof
URL: http://localhost:8000/verified.html?business=purple-mountain-tiger-472&verify=VER-1736611234-X7K2
Action: Anyone can verify review
```

---

## Summary

**Entry Point:** business-qr.html
**Exit Point:** verified.html (with proof QR)
**Time:** ~2 minutes (instant blending, not 20 min render)
**Storage:** sessionStorage → localStorage
**Payment:** Stripe Payment Links (no backend needed)
**Security:** PCI Level 4 (simplest)
**IDs:** Word-based (Bitcoin BIP39-style)
**Automation:** 90% automated, 10% manual (Stripe payment)

Start from pixel 1. End with verified badge. Scale to infinity.
