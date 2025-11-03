
/**
 * 💳 REAL STRIPE INTEGRATION API
 * Handles actual money transactions
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeIntegration {
  constructor() {
    this.creditRate = 100; // 100 credits = $1
    this.creatorShare = 0.70; // 70% to creators
  }

  async purchaseCredits(userId, amountUSD) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountUSD * 100, // Convert to cents
      currency: 'usd',
      metadata: {
        userId,
        credits: amountUSD * this.creditRate
      }
    });
    
    return paymentIntent;
  }

  async payoutCreator(creatorId, amountUSD) {
    const transfer = await stripe.transfers.create({
      amount: amountUSD * 100,
      currency: 'usd',
      destination: creatorId, // Creator's Stripe account
      metadata: {
        type: 'creator_payout',
        platform: 'soulfra'
      }
    });
    
    return transfer;
  }

  async createSubscription(customerId, priceId) {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata: {
        type: 'enterprise',
        platform: 'soulfra'
      }
    });
    
    return subscription;
  }
}

module.exports = StripeIntegration;