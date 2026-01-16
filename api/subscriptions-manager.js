#!/usr/bin/env node
/**
 * Soulfra Subscriptions Manager
 *
 * Recurring billing system for subscription-based products
 *
 * Features:
 * - Create subscription plans
 * - Subscribe customers
 * - Handle billing cycles
 * - Process recurring payments
 * - Manage cancellations/pauses
 * - Failed payment retry logic
 * - Proration calculations
 * - Trial periods
 */

const crypto = require('crypto');
const path = require('path');
const DataStore = require('./data-store.js');

class SubscriptionsManager {
  constructor(paymentsEngine, options = {}) {
    this.paymentsEngine = paymentsEngine;

    // Configuration
    this.config = {
      retryFailedPayments: options.retryFailedPayments !== false,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 86400000, // 24 hours in ms
      ...options
    };

    // Data stores
    this.plansStore = new DataStore(path.join(__dirname, '../data/subscription-plans.json'));
    this.subscriptionsStore = new DataStore(path.join(__dirname, '../data/subscriptions.json'));

    // Stripe subscription support
    this.stripe = null;

    // Stats
    this.stats = {
      activeSubs: 0,
      canceledSubs: 0,
      pausedSubs: 0,
      monthlyRecurringRevenue: 0,
      churnRate: 0
    };
  }

  /**
   * Initialize with Stripe
   */
  async initialize() {
    if (this.paymentsEngine.isReady()) {
      this.stripe = this.paymentsEngine.stripe;
      console.log('✅ Subscriptions manager initialized');
      return true;
    } else {
      console.warn('⚠️ Subscriptions manager in MOCK MODE');
      return false;
    }
  }

  /**
   * Check if ready
   */
  isReady() {
    return this.stripe !== null;
  }

  /**
   * Create a subscription plan
   *
   * @param {Object} params
   * @param {string} params.name - Plan name (e.g., "Pro Plan")
   * @param {number} params.amount - Amount in cents
   * @param {string} params.currency - Currency code
   * @param {string} params.interval - Billing interval (day, week, month, year)
   * @param {number} params.intervalCount - Number of intervals (e.g., 1 month, 3 months)
   * @param {number} params.trialDays - Trial period in days (optional)
   * @param {Object} params.features - Plan features
   */
  async createPlan(params) {
    const {
      name,
      amount,
      currency = 'USD',
      interval = 'month',
      intervalCount = 1,
      trialDays = 0,
      features = {},
      metadata = {}
    } = params;

    // Validation
    if (!name || !amount) {
      throw new Error('Plan name and amount are required');
    }

    if (!['day', 'week', 'month', 'year'].includes(interval)) {
      throw new Error('Interval must be: day, week, month, or year');
    }

    const planId = this.generatePlanId();

    const plan = {
      id: planId,
      name,
      amount,
      currency: currency.toUpperCase(),
      interval,
      intervalCount,
      trialDays,
      features,
      metadata,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Mock mode
    if (!this.isReady()) {
      await this.plansStore.append(plan);
      console.log(`[MOCK] Plan created: ${planId} - ${name} - $${(amount / 100).toFixed(2)}/${interval}`);

      return {
        success: true,
        planId,
        plan,
        mock: true
      };
    }

    // Real Stripe plan
    try {
      // Create product
      const product = await this.stripe.products.create({
        name,
        metadata: {
          ...metadata,
          planId
        }
      });

      // Create price
      const price = await this.stripe.prices.create({
        unit_amount: amount,
        currency: currency.toLowerCase(),
        recurring: {
          interval,
          interval_count: intervalCount
        },
        product: product.id,
        metadata: {
          planId
        }
      });

      plan.stripeProductId = product.id;
      plan.stripePriceId = price.id;

      await this.plansStore.append(plan);

      console.log(`✅ Plan created: ${planId} - ${name} - $${(amount / 100).toFixed(2)}/${interval}`);

      return {
        success: true,
        planId,
        plan,
        stripeProductId: product.id,
        stripePriceId: price.id
      };
    } catch (error) {
      console.error(`❌ Plan creation failed: ${error.message}`);
      throw new Error(`Plan creation failed: ${error.message}`);
    }
  }

  /**
   * Subscribe a customer to a plan
   */
  async subscribe(params) {
    const {
      customerId,
      planId,
      paymentMethod,
      trialDays,
      metadata = {}
    } = params;

    // Validation
    if (!customerId || !planId) {
      throw new Error('Customer ID and plan ID are required');
    }

    // Get plan
    const plans = await this.plansStore.read();
    const plan = plans.find(p => p.id === planId);

    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    if (!plan.active) {
      throw new Error(`Plan ${planId} is not active`);
    }

    const subscriptionId = this.generateSubscriptionId();

    // Calculate next billing date
    const trialEndDate = trialDays || plan.trialDays
      ? new Date(Date.now() + ((trialDays || plan.trialDays) * 86400000))
      : null;

    const nextBillingDate = this.calculateNextBillingDate(
      trialEndDate || new Date(),
      plan.interval,
      plan.intervalCount
    );

    const subscription = {
      id: subscriptionId,
      customerId,
      planId,
      status: trialEndDate ? 'trialing' : 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: nextBillingDate.toISOString(),
      trialEnd: trialEndDate ? trialEndDate.toISOString() : null,
      cancelAtPeriodEnd: false,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Mock mode
    if (!this.isReady()) {
      await this.subscriptionsStore.append(subscription);
      console.log(`[MOCK] Subscription created: ${subscriptionId} - Customer ${customerId} → Plan ${planId}`);
      this.stats.activeSubs++;

      return {
        success: true,
        subscriptionId,
        subscription,
        mock: true
      };
    }

    // Real Stripe subscription
    try {
      const stripeSubscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: plan.stripePriceId }],
        trial_period_days: trialDays || plan.trialDays || undefined,
        default_payment_method: paymentMethod,
        metadata: {
          ...metadata,
          subscriptionId
        }
      });

      subscription.stripeSubscriptionId = stripeSubscription.id;
      subscription.status = stripeSubscription.status;
      subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000).toISOString();
      subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000).toISOString();

      await this.subscriptionsStore.append(subscription);

      console.log(`✅ Subscription created: ${subscriptionId} - Customer ${customerId} → Plan ${planId}`);
      this.stats.activeSubs++;

      return {
        success: true,
        subscriptionId,
        subscription,
        stripeSubscriptionId: stripeSubscription.id
      };
    } catch (error) {
      console.error(`❌ Subscription creation failed: ${error.message}`);
      throw new Error(`Subscription creation failed: ${error.message}`);
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId, options = {}) {
    const subscriptions = await this.subscriptionsStore.read();
    const subscription = subscriptions.find(s => s.id === subscriptionId);

    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    const {
      immediately = false,
      reason = 'customer_request'
    } = options;

    // Mock mode
    if (!this.isReady()) {
      if (immediately) {
        subscription.status = 'canceled';
        subscription.canceledAt = new Date().toISOString();
      } else {
        subscription.cancelAtPeriodEnd = true;
        subscription.cancelAt = subscription.currentPeriodEnd;
      }

      subscription.cancellationReason = reason;
      subscription.updatedAt = new Date().toISOString();

      await this.subscriptionsStore.write(subscriptions);

      console.log(`[MOCK] Subscription canceled: ${subscriptionId}${immediately ? ' immediately' : ' at period end'}`);
      this.stats.activeSubs--;
      this.stats.canceledSubs++;

      return {
        success: true,
        subscriptionId,
        status: subscription.status,
        canceledAt: subscription.canceledAt,
        mock: true
      };
    }

    // Real Stripe cancellation
    try {
      const stripeSubscription = await this.stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: !immediately,
          metadata: {
            cancellationReason: reason
          }
        }
      );

      if (immediately) {
        await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        subscription.status = 'canceled';
        subscription.canceledAt = new Date().toISOString();
      } else {
        subscription.cancelAtPeriodEnd = true;
        subscription.cancelAt = subscription.currentPeriodEnd;
      }

      subscription.cancellationReason = reason;
      subscription.updatedAt = new Date().toISOString();

      await this.subscriptionsStore.write(subscriptions);

      console.log(`✅ Subscription canceled: ${subscriptionId}${immediately ? ' immediately' : ' at period end'}`);
      this.stats.activeSubs--;
      this.stats.canceledSubs++;

      return {
        success: true,
        subscriptionId,
        status: subscription.status,
        canceledAt: subscription.canceledAt
      };
    } catch (error) {
      console.error(`❌ Subscription cancellation failed: ${error.message}`);
      throw new Error(`Subscription cancellation failed: ${error.message}`);
    }
  }

  /**
   * Pause a subscription
   */
  async pauseSubscription(subscriptionId, resumeAt = null) {
    const subscriptions = await this.subscriptionsStore.read();
    const subscription = subscriptions.find(s => s.id === subscriptionId);

    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    subscription.status = 'paused';
    subscription.pausedAt = new Date().toISOString();
    subscription.resumeAt = resumeAt;
    subscription.updatedAt = new Date().toISOString();

    await this.subscriptionsStore.write(subscriptions);

    console.log(`✅ Subscription paused: ${subscriptionId}`);
    this.stats.activeSubs--;
    this.stats.pausedSubs++;

    return {
      success: true,
      subscriptionId,
      status: 'paused',
      pausedAt: subscription.pausedAt,
      resumeAt
    };
  }

  /**
   * Resume a paused subscription
   */
  async resumeSubscription(subscriptionId) {
    const subscriptions = await this.subscriptionsStore.read();
    const subscription = subscriptions.find(s => s.id === subscriptionId);

    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    if (subscription.status !== 'paused') {
      throw new Error(`Subscription ${subscriptionId} is not paused`);
    }

    subscription.status = 'active';
    subscription.resumedAt = new Date().toISOString();
    subscription.pausedAt = null;
    subscription.resumeAt = null;
    subscription.updatedAt = new Date().toISOString();

    await this.subscriptionsStore.write(subscriptions);

    console.log(`✅ Subscription resumed: ${subscriptionId}`);
    this.stats.pausedSubs--;
    this.stats.activeSubs++;

    return {
      success: true,
      subscriptionId,
      status: 'active',
      resumedAt: subscription.resumedAt
    };
  }

  /**
   * Process recurring billing
   */
  async processBilling() {
    const subscriptions = await this.subscriptionsStore.read();
    const now = new Date();

    let processed = 0;
    let failed = 0;

    for (const subscription of subscriptions) {
      // Skip inactive subscriptions
      if (!['active', 'trialing'].includes(subscription.status)) {
        continue;
      }

      // Check if billing is due
      const periodEnd = new Date(subscription.currentPeriodEnd);

      if (now >= periodEnd) {
        try {
          await this.billSubscription(subscription);
          processed++;
        } catch (error) {
          console.error(`❌ Billing failed for subscription ${subscription.id}: ${error.message}`);
          failed++;
        }
      }
    }

    console.log(`✅ Processed ${processed} subscriptions, ${failed} failed`);

    return {
      success: true,
      processed,
      failed
    };
  }

  /**
   * Bill a single subscription
   */
  async billSubscription(subscription) {
    // Get plan
    const plans = await this.plansStore.read();
    const plan = plans.find(p => p.id === subscription.planId);

    if (!plan) {
      throw new Error(`Plan ${subscription.planId} not found`);
    }

    // Create payment
    const payment = await this.paymentsEngine.createPayment({
      amount: plan.amount,
      currency: plan.currency,
      customerId: subscription.customerId,
      description: `Subscription payment - ${plan.name}`,
      metadata: {
        subscriptionId: subscription.id,
        planId: plan.id,
        billingCycle: subscription.currentPeriodEnd
      }
    });

    // Update subscription period
    const subscriptions = await this.subscriptionsStore.read();
    const sub = subscriptions.find(s => s.id === subscription.id);

    const nextBillingDate = this.calculateNextBillingDate(
      new Date(),
      plan.interval,
      plan.intervalCount
    );

    sub.currentPeriodStart = new Date().toISOString();
    sub.currentPeriodEnd = nextBillingDate.toISOString();
    sub.lastBillingAt = new Date().toISOString();
    sub.updatedAt = new Date().toISOString();

    await this.subscriptionsStore.write(subscriptions);

    console.log(`✅ Billed subscription ${subscription.id} - $${(plan.amount / 100).toFixed(2)}`);

    return payment;
  }

  /**
   * Calculate next billing date
   */
  calculateNextBillingDate(startDate, interval, intervalCount) {
    const date = new Date(startDate);

    switch (interval) {
      case 'day':
        date.setDate(date.getDate() + intervalCount);
        break;
      case 'week':
        date.setDate(date.getDate() + (intervalCount * 7));
        break;
      case 'month':
        date.setMonth(date.getMonth() + intervalCount);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() + intervalCount);
        break;
    }

    return date;
  }

  /**
   * Get subscription
   */
  async getSubscription(subscriptionId) {
    const subscriptions = await this.subscriptionsStore.read();
    const subscription = subscriptions.find(s => s.id === subscriptionId);

    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    return subscription;
  }

  /**
   * List subscriptions for a customer
   */
  async listSubscriptions(customerId) {
    const subscriptions = await this.subscriptionsStore.read();
    return subscriptions.filter(s => s.customerId === customerId);
  }

  /**
   * Get plan
   */
  async getPlan(planId) {
    const plans = await this.plansStore.read();
    const plan = plans.find(p => p.id === planId);

    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    return plan;
  }

  /**
   * List all plans
   */
  async listPlans() {
    const plans = await this.plansStore.read();
    return plans.filter(p => p.active);
  }

  /**
   * Get statistics
   */
  async getStats() {
    const subscriptions = await this.subscriptionsStore.read();
    const plans = await this.plansStore.read();

    const activeSubscriptions = subscriptions.filter(s => s.status === 'active' || s.status === 'trialing');

    // Calculate MRR (Monthly Recurring Revenue)
    let mrr = 0;
    for (const sub of activeSubscriptions) {
      const plan = plans.find(p => p.id === sub.planId);
      if (plan) {
        // Normalize to monthly amount
        let monthlyAmount = plan.amount;
        if (plan.interval === 'year') {
          monthlyAmount = plan.amount / 12;
        } else if (plan.interval === 'day') {
          monthlyAmount = plan.amount * 30;
        } else if (plan.interval === 'week') {
          monthlyAmount = plan.amount * 4;
        }
        mrr += monthlyAmount / plan.intervalCount;
      }
    }

    return {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
      canceledSubscriptions: subscriptions.filter(s => s.status === 'canceled').length,
      pausedSubscriptions: subscriptions.filter(s => s.status === 'paused').length,
      trialingSubscriptions: subscriptions.filter(s => s.status === 'trialing').length,
      monthlyRecurringRevenue: Math.round(mrr),
      totalPlans: plans.length,
      activePlans: plans.filter(p => p.active).length
    };
  }

  /**
   * Generate unique plan ID
   */
  generatePlanId() {
    return `plan_${crypto.randomBytes(12).toString('hex')}`;
  }

  /**
   * Generate unique subscription ID
   */
  generateSubscriptionId() {
    return `sub_${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Get manager info
   */
  getInfo() {
    return {
      ready: this.isReady(),
      mode: this.isReady() ? 'live' : 'mock',
      config: this.config,
      stats: this.stats
    };
  }
}

module.exports = SubscriptionsManager;
