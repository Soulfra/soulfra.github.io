#!/usr/bin/env node
/**
 * Soulfra Payments Engine
 *
 * Core payment processing - the heart of your Stripe/Square alternative
 *
 * Features:
 * - Create payment intents
 * - Confirm payments
 * - Process refunds
 * - Handle multiple currencies
 * - Calculate fees
 * - Transaction logging
 * - Fraud detection basics
 */

const crypto = require('crypto');
const path = require('path');
const DataStore = require('./data-store.js');

class PaymentsEngine {
  constructor(options = {}) {
    // Configuration
    this.config = {
      stripeSecretKey: options.stripeSecretKey || process.env.STRIPE_SECRET_KEY,
      defaultCurrency: options.defaultCurrency || 'USD',
      transactionFeePercent: options.transactionFeePercent || 0.029, // 2.9%
      transactionFeeFixed: options.transactionFeeFixed || 30, // $0.30 in cents
      enableFraudDetection: options.enableFraudDetection !== false,
      ...options
    };

    // Data stores
    this.paymentsStore = new DataStore(path.join(__dirname, '../data/payments.json'));
    this.transactionsStore = new DataStore(path.join(__dirname, '../data/transactions.json'));
    this.refundsStore = new DataStore(path.join(__dirname, '../data/refunds.json'));

    // Stripe client (lazy loaded)
    this.stripe = null;

    // Stats
    this.stats = {
      totalPayments: 0,
      totalAmount: 0,
      totalFees: 0,
      successfulPayments: 0,
      failedPayments: 0,
      refunds: 0
    };
  }

  /**
   * Initialize Stripe SDK
   */
  async initialize() {
    if (!this.config.stripeSecretKey) {
      console.warn('⚠️ Stripe secret key not found. Set STRIPE_SECRET_KEY env variable.');
      console.warn('⚠️ Payments engine running in MOCK MODE');
      return false;
    }

    try {
      const stripe = require('stripe');
      this.stripe = stripe(this.config.stripeSecretKey);
      console.log('✅ Payments engine initialized with Stripe');
      return true;
    } catch (error) {
      console.warn('⚠️ Stripe SDK not installed. Run: npm install stripe');
      console.warn('⚠️ Payments engine running in MOCK MODE');
      return false;
    }
  }

  /**
   * Check if engine is ready
   */
  isReady() {
    return this.stripe !== null;
  }

  /**
   * Create a payment intent
   *
   * @param {Object} params
   * @param {number} params.amount - Amount in cents (e.g., 1000 = $10.00)
   * @param {string} params.currency - Currency code (USD, EUR, etc.)
   * @param {string} params.customerId - Customer ID (optional)
   * @param {string} params.description - Payment description
   * @param {Object} params.metadata - Additional metadata
   * @returns {Object} Payment intent details
   */
  async createPayment(params) {
    const {
      amount,
      currency = this.config.defaultCurrency,
      customerId,
      description,
      metadata = {},
      paymentMethod
    } = params;

    // Validation
    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Generate payment ID
    const paymentId = this.generatePaymentId();

    // Calculate fees
    const fees = this.calculateFees(amount);

    // Create payment object
    const payment = {
      id: paymentId,
      amount,
      currency: currency.toUpperCase(),
      customerId,
      description,
      metadata,
      status: 'pending',
      fees,
      netAmount: amount - fees.total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Fraud detection check
    if (this.config.enableFraudDetection) {
      const fraudCheck = this.checkFraud(payment);
      payment.fraudScore = fraudCheck.score;
      payment.fraudFlags = fraudCheck.flags;

      if (fraudCheck.score > 80) {
        payment.status = 'flagged';
        payment.fraudReason = 'High fraud score';
      }
    }

    // Mock mode (no Stripe)
    if (!this.isReady()) {
      console.log(`[MOCK] Payment created: ${paymentId} - $${(amount / 100).toFixed(2)}`);
      await this.paymentsStore.append(payment);
      return {
        success: true,
        paymentId,
        clientSecret: `mock_secret_${paymentId}`,
        amount,
        currency,
        status: payment.status,
        fees,
        mock: true
      };
    }

    // Real Stripe payment
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency: currency.toLowerCase(),
        customer: customerId,
        description,
        metadata: {
          ...metadata,
          paymentId
        },
        payment_method: paymentMethod,
        automatic_payment_methods: paymentMethod ? undefined : {
          enabled: true
        }
      });

      payment.stripePaymentIntentId = paymentIntent.id;
      payment.clientSecret = paymentIntent.client_secret;
      payment.status = paymentIntent.status;

      await this.paymentsStore.append(payment);

      console.log(`✅ Payment created: ${paymentId} - $${(amount / 100).toFixed(2)}`);

      return {
        success: true,
        paymentId,
        stripePaymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount,
        currency,
        status: payment.status,
        fees
      };
    } catch (error) {
      console.error(`❌ Payment creation failed: ${error.message}`);
      payment.status = 'failed';
      payment.error = error.message;
      await this.paymentsStore.append(payment);

      throw new Error(`Payment creation failed: ${error.message}`);
    }
  }

  /**
   * Confirm a payment
   */
  async confirmPayment(paymentId, paymentMethod) {
    const payments = await this.paymentsStore.read();
    const payment = payments.find(p => p.id === paymentId);

    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    if (!this.isReady()) {
      // Mock mode
      payment.status = 'succeeded';
      payment.confirmedAt = new Date().toISOString();
      payment.paymentMethod = paymentMethod || 'mock_card';
      await this.paymentsStore.write(payments);

      console.log(`[MOCK] Payment confirmed: ${paymentId}`);
      this.stats.successfulPayments++;
      this.stats.totalAmount += payment.amount;
      this.stats.totalFees += payment.fees.total;

      return {
        success: true,
        paymentId,
        status: 'succeeded',
        amount: payment.amount,
        mock: true
      };
    }

    // Real Stripe confirmation
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(
        payment.stripePaymentIntentId,
        paymentMethod ? { payment_method: paymentMethod } : {}
      );

      payment.status = paymentIntent.status;
      payment.confirmedAt = new Date().toISOString();
      payment.updatedAt = new Date().toISOString();

      if (paymentIntent.status === 'succeeded') {
        payment.succeededAt = new Date().toISOString();
        this.stats.successfulPayments++;
        this.stats.totalAmount += payment.amount;
        this.stats.totalFees += payment.fees.total;

        // Log transaction
        await this.logTransaction({
          type: 'payment',
          paymentId,
          amount: payment.amount,
          currency: payment.currency,
          customerId: payment.customerId,
          status: 'succeeded'
        });
      }

      await this.paymentsStore.write(payments);

      console.log(`✅ Payment confirmed: ${paymentId} - ${paymentIntent.status}`);

      return {
        success: true,
        paymentId,
        status: paymentIntent.status,
        amount: payment.amount
      };
    } catch (error) {
      console.error(`❌ Payment confirmation failed: ${error.message}`);
      payment.status = 'failed';
      payment.error = error.message;
      payment.updatedAt = new Date().toISOString();
      await this.paymentsStore.write(payments);

      this.stats.failedPayments++;

      throw new Error(`Payment confirmation failed: ${error.message}`);
    }
  }

  /**
   * Process a refund
   */
  async refund(paymentId, amount = null, reason = null) {
    const payments = await this.paymentsStore.read();
    const payment = payments.find(p => p.id === paymentId);

    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    if (payment.status !== 'succeeded') {
      throw new Error(`Cannot refund payment with status: ${payment.status}`);
    }

    const refundAmount = amount || payment.amount;

    if (refundAmount > payment.amount) {
      throw new Error(`Refund amount ($${refundAmount / 100}) exceeds payment amount ($${payment.amount / 100})`);
    }

    const refundId = this.generateRefundId();

    // Calculate refund fees (Stripe doesn't refund fees on refunds)
    const refundFees = this.calculateFees(refundAmount);

    const refund = {
      id: refundId,
      paymentId,
      amount: refundAmount,
      currency: payment.currency,
      fees: refundFees,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    if (!this.isReady()) {
      // Mock mode
      refund.status = 'succeeded';
      payment.refunded = true;
      payment.refundedAmount = (payment.refundedAmount || 0) + refundAmount;
      payment.updatedAt = new Date().toISOString();

      await this.refundsStore.append(refund);
      await this.paymentsStore.write(payments);

      console.log(`[MOCK] Refund processed: ${refundId} - $${(refundAmount / 100).toFixed(2)}`);
      this.stats.refunds++;

      return {
        success: true,
        refundId,
        paymentId,
        amount: refundAmount,
        status: 'succeeded',
        mock: true
      };
    }

    // Real Stripe refund
    try {
      const stripeRefund = await this.stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        amount: refundAmount,
        reason: reason || 'requested_by_customer',
        metadata: {
          refundId,
          paymentId
        }
      });

      refund.stripeRefundId = stripeRefund.id;
      refund.status = stripeRefund.status;

      payment.refunded = true;
      payment.refundedAmount = (payment.refundedAmount || 0) + refundAmount;
      payment.updatedAt = new Date().toISOString();

      await this.refundsStore.append(refund);
      await this.paymentsStore.write(payments);

      // Log transaction
      await this.logTransaction({
        type: 'refund',
        refundId,
        paymentId,
        amount: refundAmount,
        currency: payment.currency,
        status: 'succeeded'
      });

      console.log(`✅ Refund processed: ${refundId} - $${(refundAmount / 100).toFixed(2)}`);
      this.stats.refunds++;

      return {
        success: true,
        refundId,
        paymentId,
        amount: refundAmount,
        status: stripeRefund.status
      };
    } catch (error) {
      console.error(`❌ Refund failed: ${error.message}`);
      refund.status = 'failed';
      refund.error = error.message;
      await this.refundsStore.append(refund);

      throw new Error(`Refund failed: ${error.message}`);
    }
  }

  /**
   * Get payment status
   */
  async getPayment(paymentId) {
    const payments = await this.paymentsStore.read();
    const payment = payments.find(p => p.id === paymentId);

    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    return payment;
  }

  /**
   * List payments (with filtering)
   */
  async listPayments(filters = {}) {
    const payments = await this.paymentsStore.read();

    let filtered = payments;

    if (filters.customerId) {
      filtered = filtered.filter(p => p.customerId === filters.customerId);
    }

    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    if (filters.startDate) {
      filtered = filtered.filter(p => new Date(p.createdAt) >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      filtered = filtered.filter(p => new Date(p.createdAt) <= new Date(filters.endDate));
    }

    return filtered;
  }

  /**
   * Calculate transaction fees
   */
  calculateFees(amount) {
    const percentFee = Math.round(amount * this.config.transactionFeePercent);
    const fixedFee = this.config.transactionFeeFixed;
    const total = percentFee + fixedFee;

    return {
      amount,
      percentFee,
      fixedFee,
      total,
      percentRate: this.config.transactionFeePercent,
      netAmount: amount - total
    };
  }

  /**
   * Basic fraud detection
   */
  checkFraud(payment) {
    let score = 0;
    const flags = [];

    // Large amounts are riskier
    if (payment.amount > 100000) { // $1000+
      score += 30;
      flags.push('high_amount');
    }

    // Very small amounts can be test transactions
    if (payment.amount < 100) { // Less than $1
      score += 10;
      flags.push('low_amount');
    }

    // Check metadata for suspicious patterns
    if (payment.metadata?.email?.includes('test') || payment.metadata?.email?.includes('fake')) {
      score += 20;
      flags.push('suspicious_email');
    }

    // TODO: Add more sophisticated fraud checks
    // - IP geolocation
    // - Device fingerprinting
    // - Velocity checks (multiple payments in short time)
    // - Card BIN checks
    // - Machine learning model

    return { score, flags, riskLevel: score > 50 ? 'high' : score > 20 ? 'medium' : 'low' };
  }

  /**
   * Log transaction
   */
  async logTransaction(transaction) {
    const logEntry = {
      id: this.generateTransactionId(),
      timestamp: new Date().toISOString(),
      ...transaction
    };

    await this.transactionsStore.append(logEntry);
    this.stats.totalPayments++;

    return logEntry;
  }

  /**
   * Get statistics
   */
  async getStats() {
    const payments = await this.paymentsStore.read();
    const refunds = await this.refundsStore.read();

    const stats = {
      totalPayments: payments.length,
      successfulPayments: payments.filter(p => p.status === 'succeeded').length,
      failedPayments: payments.filter(p => p.status === 'failed').length,
      pendingPayments: payments.filter(p => p.status === 'pending').length,
      totalAmount: payments.filter(p => p.status === 'succeeded').reduce((sum, p) => sum + p.amount, 0),
      totalFees: payments.filter(p => p.status === 'succeeded').reduce((sum, p) => sum + p.fees.total, 0),
      totalRefunds: refunds.length,
      totalRefundedAmount: refunds.reduce((sum, r) => sum + r.amount, 0),
      currencies: [...new Set(payments.map(p => p.currency))],
      averagePayment: payments.length > 0
        ? payments.filter(p => p.status === 'succeeded').reduce((sum, p) => sum + p.amount, 0) / payments.filter(p => p.status === 'succeeded').length
        : 0
    };

    return stats;
  }

  /**
   * Generate unique payment ID
   */
  generatePaymentId() {
    return `pay_${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Generate unique refund ID
   */
  generateRefundId() {
    return `ref_${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Generate unique transaction ID
   */
  generateTransactionId() {
    return `txn_${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Get engine info
   */
  getInfo() {
    return {
      ready: this.isReady(),
      mode: this.isReady() ? 'live' : 'mock',
      config: {
        defaultCurrency: this.config.defaultCurrency,
        transactionFeePercent: this.config.transactionFeePercent,
        transactionFeeFixed: this.config.transactionFeeFixed,
        enableFraudDetection: this.config.enableFraudDetection
      },
      stats: this.stats
    };
  }
}

module.exports = PaymentsEngine;
