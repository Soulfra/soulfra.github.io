/**
 * 💳 SOULFRA STRIPE BILLING INTEGRATION
 * Simple, transparent pricing that just works
 */

const express = require('express');
const router = express.Router();

// Stripe configuration (would use real Stripe in production)
const STRIPE_PUBLIC_KEY = process.env.STRIPE_PUBLIC_KEY || 'pk_test_demo';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_demo';

// Pricing tiers
const PRICING_TIERS = {
  free: {
    id: 'free',
    name: 'Personal Free',
    price: 0,
    priceId: null,
    features: [
      '1 device',
      '1GB protected storage',
      'Basic sovereignty features',
      'Community support'
    ],
    limits: {
      devices: 1,
      storage: 1 * 1024 * 1024 * 1024, // 1GB in bytes
      apiCalls: 1000 // per month
    }
  },
  
  family: {
    id: 'family',
    name: 'Family',
    price: 999, // $9.99 in cents
    priceId: 'price_family_monthly',
    features: [
      '5 devices',
      '100GB protected storage',
      'Cross-device sync',
      'Family sharing controls',
      'Priority support'
    ],
    limits: {
      devices: 5,
      storage: 100 * 1024 * 1024 * 1024, // 100GB
      apiCalls: 10000
    }
  },
  
  business: {
    id: 'business',
    name: 'Business',
    price: 4900, // $49 in cents
    priceId: 'price_business_monthly',
    features: [
      'Unlimited devices',
      'Unlimited storage',
      'Enterprise admin controls',
      'HIPAA/SOC2 compliance',
      'SLA guarantees',
      '24/7 phone support'
    ],
    limits: {
      devices: -1, // unlimited
      storage: -1, // unlimited
      apiCalls: -1 // unlimited
    }
  },
  
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'custom',
    priceId: null,
    features: [
      'Air-gapped deployment',
      'Custom compliance',
      'Dedicated support team',
      'Custom integrations',
      'Training included',
      'White-label options'
    ],
    limits: {
      devices: -1,
      storage: -1,
      apiCalls: -1
    }
  }
};

// Stripe mock for demo (replace with real Stripe SDK)
class StripeMock {
  async createCustomer(email, metadata) {
    return {
      id: 'cus_' + Math.random().toString(36).substr(2, 9),
      email,
      metadata
    };
  }
  
  async createSubscription(customerId, priceId) {
    return {
      id: 'sub_' + Math.random().toString(36).substr(2, 9),
      customer: customerId,
      items: [{ price: priceId }],
      status: 'active'
    };
  }
  
  async createCheckoutSession(params) {
    return {
      id: 'cs_' + Math.random().toString(36).substr(2, 9),
      url: `https://checkout.stripe.com/demo/${params.mode}`,
      ...params
    };
  }
  
  async createPortalSession(customerId) {
    return {
      url: `https://billing.stripe.com/demo/${customerId}`
    };
  }
}

const stripe = new StripeMock();

// API Endpoints

/**
 * Get pricing information
 */
router.get('/pricing', (req, res) => {
  res.json({
    tiers: Object.values(PRICING_TIERS),
    currency: 'USD',
    billingPeriod: 'monthly'
  });
});

/**
 * Create checkout session
 */
router.post('/create-checkout', async (req, res) => {
  try {
    const { tier, email, successUrl, cancelUrl } = req.body;
    
    // Validate tier
    const pricingTier = PRICING_TIERS[tier];
    if (!pricingTier || tier === 'free') {
      return res.status(400).json({
        error: 'Invalid tier selected'
      });
    }
    
    if (tier === 'enterprise') {
      return res.json({
        action: 'contact_sales',
        message: 'Please contact sales for enterprise pricing',
        salesUrl: 'https://soulfra.com/contact-sales'
      });
    }
    
    // Create Stripe checkout session
    const session = await stripe.createCheckoutSession({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: pricingTier.priceId,
        quantity: 1
      }],
      customer_email: email,
      success_url: successUrl || 'https://app.soulfra.com/welcome',
      cancel_url: cancelUrl || 'https://soulfra.com/pricing',
      metadata: {
        tier: tier
      }
    });
    
    res.json({
      checkoutUrl: session.url,
      sessionId: session.id
    });
    
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message
    });
  }
});

/**
 * Handle successful payment (webhook)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // In production, verify webhook signature
    const event = JSON.parse(req.body);
    
    switch (event.type) {
      case 'checkout.session.completed':
        await handleSuccessfulPayment(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object);
        break;
    }
    
    res.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get customer billing portal
 */
router.post('/billing-portal', async (req, res) => {
  try {
    const { customerId } = req.body;
    
    const session = await stripe.createPortalSession(customerId);
    
    res.json({
      portalUrl: session.url
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create portal session',
      message: error.message
    });
  }
});

/**
 * Calculate ROI for enterprise customers
 */
router.post('/calculate-roi', (req, res) => {
  const {
    employees = 100,
    averageSalary = 75000,
    currentBreachRisk = 0.83, // 83% industry average
    currentBreachCost = 4450000 // $4.45M average
  } = req.body;
  
  // Calculate potential losses without Soulfra
  const expectedLossWithoutSoulfra = currentBreachCost * currentBreachRisk;
  
  // Cost of Soulfra
  const soulfraAnnualCost = employees * PRICING_TIERS.business.price * 12 / 100;
  
  // Savings
  const annualSavings = expectedLossWithoutSoulfra - soulfraAnnualCost;
  const roi = (annualSavings / soulfraAnnualCost) * 100;
  
  // Additional benefits
  const cyberInsuranceSavings = currentBreachCost * 0.03; // 3% of coverage
  const complianceSavings = employees * 2000; // $2K per employee in compliance costs
  const productivityGains = employees * averageSalary * 0.02; // 2% productivity gain
  
  const totalBenefits = annualSavings + cyberInsuranceSavings + complianceSavings + productivityGains;
  const totalRoi = (totalBenefits / soulfraAnnualCost) * 100;
  
  res.json({
    inputs: {
      employees,
      averageSalary,
      currentBreachRisk: (currentBreachRisk * 100).toFixed(0) + '%',
      currentBreachCost: '$' + (currentBreachCost / 1000000).toFixed(2) + 'M'
    },
    costs: {
      soulfraAnnual: soulfraAnnualCost,
      soulfraMonthly: soulfraAnnualCost / 12,
      perEmployee: soulfraAnnualCost / employees
    },
    savings: {
      breachPrevention: expectedLossWithoutSoulfra,
      cyberInsurance: cyberInsuranceSavings,
      compliance: complianceSavings,
      productivity: productivityGains,
      total: totalBenefits
    },
    roi: {
      percentage: totalRoi.toFixed(0) + '%',
      paybackMonths: (soulfraAnnualCost / (totalBenefits / 12)).toFixed(1),
      fiveYearValue: totalBenefits * 5
    },
    summary: {
      headline: `${totalRoi.toFixed(0)}% ROI in Year 1`,
      savings: `$${(totalBenefits / 1000000).toFixed(1)}M annual savings`,
      payback: `${(soulfraAnnualCost / (totalBenefits / 12)).toFixed(0)} month payback`
    }
  });
});

// Helper functions

async function handleSuccessfulPayment(session) {
  console.log('Payment successful:', session.id);
  // In production:
  // 1. Create user account
  // 2. Provision resources
  // 3. Send welcome email
  // 4. Update CRM
}

async function handleSubscriptionUpdate(subscription) {
  console.log('Subscription updated:', subscription.id);
  // In production:
  // 1. Update user limits
  // 2. Notify user
  // 3. Adjust resources
}

async function handleSubscriptionCancellation(subscription) {
  console.log('Subscription cancelled:', subscription.id);
  // In production:
  // 1. Downgrade to free tier
  // 2. Send retention email
  // 3. Schedule data export
}

// Simple pricing page HTML
router.get('/pricing-page', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Soulfra Pricing - Simple & Transparent</title>
  <style>
    body { font-family: -apple-system, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { text-align: center; color: #333; }
    .pricing-grid { display: flex; gap: 20px; margin: 40px 0; flex-wrap: wrap; justify-content: center; }
    .pricing-card { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); flex: 1; min-width: 280px; max-width: 350px; position: relative; }
    .pricing-card.popular { border: 2px solid #5B57FF; }
    .popular-badge { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: #5B57FF; color: white; padding: 5px 20px; border-radius: 20px; font-size: 12px; }
    .tier-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .price { font-size: 48px; font-weight: bold; margin: 20px 0; }
    .price sup { font-size: 20px; }
    .features { list-style: none; padding: 0; margin: 30px 0; }
    .features li { padding: 10px 0; border-bottom: 1px solid #eee; }
    .features li:before { content: "✓ "; color: #00c851; font-weight: bold; }
    .cta-button { display: block; width: 100%; padding: 15px; background: #5B57FF; color: white; text-align: center; text-decoration: none; border-radius: 8px; font-weight: bold; border: none; cursor: pointer; font-size: 16px; }
    .cta-button:hover { background: #4845d9; }
    .cta-button.secondary { background: #e0e0e0; color: #333; }
    .roi-calculator { background: white; padding: 30px; border-radius: 12px; margin: 40px 0; }
    input { padding: 10px; margin: 5px; border: 1px solid #ddd; border-radius: 4px; }
    .roi-result { background: #f0f7ff; padding: 20px; border-radius: 8px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Simple, Transparent Pricing</h1>
    <p style="text-align: center; color: #666; font-size: 18px;">
      Protect your data from breaches. Forever.
    </p>
    
    <div class="pricing-grid">
      ${Object.values(PRICING_TIERS).map(tier => `
        <div class="pricing-card ${tier.id === 'family' ? 'popular' : ''}">
          ${tier.id === 'family' ? '<div class="popular-badge">MOST POPULAR</div>' : ''}
          <div class="tier-name">${tier.name}</div>
          <div class="price">
            ${tier.price === 'custom' ? 'Custom' : tier.price === 0 ? 'Free' : '$' + (tier.price/100)}
            ${tier.price !== 'custom' && tier.price !== 0 ? '<sup>/mo</sup>' : ''}
          </div>
          <ul class="features">
            ${tier.features.map(f => `<li>${f}</li>`).join('')}
          </ul>
          <button class="cta-button ${tier.id === 'free' ? 'secondary' : ''}" 
                  onclick="selectTier('${tier.id}')">
            ${tier.id === 'free' ? 'Start Free' : 
              tier.id === 'enterprise' ? 'Contact Sales' : 
              'Start Trial'}
          </button>
        </div>
      `).join('')}
    </div>
    
    <div class="roi-calculator">
      <h2>ROI Calculator for Business</h2>
      <p>See how much you'll save with Soulfra</p>
      
      <div>
        <label>Number of employees:</label>
        <input type="number" id="employees" value="100" onchange="calculateROI()">
        
        <label>Average salary:</label>
        <input type="number" id="salary" value="75000" onchange="calculateROI()">
        
        <button class="cta-button" onclick="calculateROI()">Calculate ROI</button>
      </div>
      
      <div id="roi-result" class="roi-result" style="display: none;">
        <h3 id="roi-headline"></h3>
        <p id="roi-savings"></p>
        <p id="roi-payback"></p>
      </div>
    </div>
  </div>
  
  <script>
    function selectTier(tier) {
      if (tier === 'free') {
        window.location.href = '/signup';
      } else if (tier === 'enterprise') {
        window.location.href = '/contact-sales';
      } else {
        fetch('/api/billing/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier })
        })
        .then(res => res.json())
        .then(data => {
          window.location.href = data.checkoutUrl;
        });
      }
    }
    
    function calculateROI() {
      const employees = document.getElementById('employees').value;
      const salary = document.getElementById('salary').value;
      
      fetch('/api/billing/calculate-roi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees, averageSalary: salary })
      })
      .then(res => res.json())
      .then(data => {
        document.getElementById('roi-result').style.display = 'block';
        document.getElementById('roi-headline').textContent = data.summary.headline;
        document.getElementById('roi-savings').textContent = data.summary.savings;
        document.getElementById('roi-payback').textContent = data.summary.payback + ' payback period';
      });
    }
  </script>
</body>
</html>
  `);
});

module.exports = router;