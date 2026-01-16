const { Pool } = require('pg');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');
const EventEmitter = require('events');
const config = require('../config/environment');
const EmailService = require('./email-service');
const SMSService = require('./sms-service');

class TransactionService extends EventEmitter {
  constructor() {
    super();
    this.pool = new Pool(config.database);
    this.emailService = new EmailService();
    this.smsService = new SMSService();
    this.stripe = stripe;
  }

  async createTransaction(transactionData) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Generate unique transaction hash
      const transactionHash = this.generateTransactionHash();

      // Calculate fees
      const feeAmount = this.calculateFee(transactionData.amount, transactionData.type);

      // Create transaction record
      const result = await client.query(`
        INSERT INTO transactions (
          transaction_hash, type, from_user_id, to_user_id,
          contract_id, amount, fee_amount, currency, status, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        transactionHash,
        transactionData.type,
        transactionData.fromUserId || null,
        transactionData.toUserId,
        transactionData.contractId || null,
        transactionData.amount,
        feeAmount,
        transactionData.currency || 'USD',
        'pending',
        transactionData.metadata || {}
      ]);

      const transaction = result.rows[0];

      // Process based on transaction type
      let processResult;
      switch (transactionData.type) {
        case 'deposit':
          processResult = await this.processDeposit(client, transaction);
          break;
        case 'withdrawal':
          processResult = await this.processWithdrawal(client, transaction);
          break;
        case 'contract_payment':
          processResult = await this.processContractPayment(client, transaction);
          break;
        case 'fee':
          processResult = await this.processFee(client, transaction);
          break;
        default:
          throw new Error('Invalid transaction type');
      }

      // Update transaction with processing result
      await client.query(`
        UPDATE transactions 
        SET status = $1, stripe_payment_intent_id = $2, completed_at = $3
        WHERE id = $4
      `, [
        processResult.status,
        processResult.paymentIntentId || null,
        processResult.status === 'completed' ? new Date() : null,
        transaction.id
      ]);

      await client.query('COMMIT');

      // Emit events
      this.emit('transactionCreated', transaction);
      if (processResult.status === 'completed') {
        this.emit('transactionCompleted', transaction);
      }

      // Send notifications
      this.sendTransactionNotifications(transaction);

      return {
        ...transaction,
        status: processResult.status,
        paymentIntent: processResult.paymentIntent
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create transaction error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async processDeposit(client, transaction) {
    try {
      // Get user's Stripe customer ID
      const userResult = await client.query(
        'SELECT stripe_customer_id FROM users WHERE id = $1',
        [transaction.to_user_id]
      );

      const stripeCustomerId = userResult.rows[0].stripe_customer_id;

      // Create Stripe payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(transaction.amount * 100), // Convert to cents
        currency: transaction.currency.toLowerCase(),
        customer: stripeCustomerId,
        metadata: {
          transaction_id: transaction.id,
          transaction_hash: transaction.transaction_hash,
          type: 'deposit'
        }
      });

      return {
        status: 'pending',
        paymentIntentId: paymentIntent.id,
        paymentIntent: paymentIntent
      };
    } catch (error) {
      console.error('Process deposit error:', error);
      throw error;
    }
  }

  async processWithdrawal(client, transaction) {
    try {
      // Check user balance
      const balanceResult = await client.query(
        'SELECT balance FROM users WHERE id = $1',
        [transaction.from_user_id]
      );

      const userBalance = parseFloat(balanceResult.rows[0].balance);
      const totalAmount = transaction.amount + transaction.fee_amount;

      if (userBalance < totalAmount) {
        throw new Error('Insufficient balance');
      }

      // Deduct from user balance
      await client.query(
        'UPDATE users SET balance = balance - $1 WHERE id = $2',
        [totalAmount, transaction.from_user_id]
      );

      // Create Stripe payout
      const payout = await this.stripe.payouts.create({
        amount: Math.round(transaction.amount * 100),
        currency: transaction.currency.toLowerCase(),
        metadata: {
          transaction_id: transaction.id,
          user_id: transaction.from_user_id
        }
      });

      return {
        status: 'completed',
        payoutId: payout.id
      };
    } catch (error) {
      console.error('Process withdrawal error:', error);
      throw error;
    }
  }

  async processContractPayment(client, transaction) {
    try {
      // Get contract details
      const contractResult = await client.query(
        'SELECT * FROM contracts WHERE id = $1',
        [transaction.contract_id]
      );

      const contract = contractResult.rows[0];

      if (contract.status !== 'active') {
        throw new Error('Contract is not active');
      }

      // Transfer funds between users
      if (transaction.from_user_id) {
        // Deduct from sender
        await client.query(
          'UPDATE users SET balance = balance - $1 WHERE id = $2',
          [transaction.amount + transaction.fee_amount, transaction.from_user_id]
        );
      }

      // Add to recipient (minus fees)
      await client.query(
        'UPDATE users SET balance = balance + $1 WHERE id = $2',
        [transaction.amount, transaction.to_user_id]
      );

      // Update contract status if fully paid
      await client.query(
        'UPDATE contracts SET status = $1 WHERE id = $2',
        ['completed', contract.id]
      );

      // Record platform fee as separate transaction
      if (transaction.fee_amount > 0) {
        await this.createTransaction({
          type: 'fee',
          fromUserId: transaction.to_user_id,
          toUserId: null, // Platform
          amount: transaction.fee_amount,
          contractId: contract.id,
          metadata: {
            originalTransaction: transaction.id
          }
        });
      }

      return {
        status: 'completed'
      };
    } catch (error) {
      console.error('Process contract payment error:', error);
      throw error;
    }
  }

  async processFee(client, transaction) {
    // Platform fees are automatically completed
    return {
      status: 'completed'
    };
  }

  async confirmStripePayment(paymentIntentId) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get payment intent from Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        throw new Error('Payment not succeeded');
      }

      // Find transaction
      const transactionResult = await client.query(
        'SELECT * FROM transactions WHERE stripe_payment_intent_id = $1',
        [paymentIntentId]
      );

      if (transactionResult.rows.length === 0) {
        throw new Error('Transaction not found');
      }

      const transaction = transactionResult.rows[0];

      // Update transaction status
      await client.query(`
        UPDATE transactions 
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [transaction.id]);

      // Update user balance for deposits
      if (transaction.type === 'deposit') {
        await client.query(
          'UPDATE users SET balance = balance + $1 WHERE id = $2',
          [transaction.amount, transaction.to_user_id]
        );
      }

      await client.query('COMMIT');

      // Send confirmation notifications
      await this.sendPaymentConfirmation(transaction);

      this.emit('paymentConfirmed', transaction);

      return {
        success: true,
        transaction
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Confirm payment error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  calculateFee(amount, transactionType) {
    const feeRates = {
      deposit: 0.029, // 2.9% for deposits (Stripe fee)
      withdrawal: 0.01, // 1% for withdrawals
      contract_payment: config.game.baseFeePercentage / 100, // Platform fee
      fee: 0 // No fee on fee transactions
    };

    const rate = feeRates[transactionType] || 0;
    return parseFloat((amount * rate).toFixed(2));
  }

  generateTransactionHash() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(16).toString('hex');
    return crypto.createHash('sha256')
      .update(`${timestamp}-${random}`)
      .digest('hex');
  }

  async getTransactionHistory(userId, options = {}) {
    const { limit = 50, offset = 0, type = null } = options;

    let query = `
      SELECT t.*, 
        u1.username as from_username,
        u2.username as to_username,
        c.title as contract_title
      FROM transactions t
      LEFT JOIN users u1 ON t.from_user_id = u1.id
      LEFT JOIN users u2 ON t.to_user_id = u2.id
      LEFT JOIN contracts c ON t.contract_id = c.id
      WHERE (t.from_user_id = $1 OR t.to_user_id = $1)
    `;

    const params = [userId];

    if (type) {
      query += ` AND t.type = $${params.length + 1}`;
      params.push(type);
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await this.pool.query(query, params);
    
    return result.rows.map(row => ({
      ...row,
      isIncoming: row.to_user_id === userId,
      netAmount: row.to_user_id === userId 
        ? row.amount 
        : -(row.amount + row.fee_amount)
    }));
  }

  async getTransactionStats(userId, period = '30d') {
    const periodMap = {
      '24h': '1 day',
      '7d': '7 days',
      '30d': '30 days',
      '90d': '90 days',
      '1y': '1 year'
    };

    const interval = periodMap[period] || '30 days';

    const query = `
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN type = 'deposit' THEN 1 END) as deposits,
        COUNT(CASE WHEN type = 'withdrawal' THEN 1 END) as withdrawals,
        COUNT(CASE WHEN type = 'contract_payment' THEN 1 END) as contract_payments,
        COALESCE(SUM(CASE WHEN to_user_id = $1 THEN amount ELSE 0 END), 0) as total_received,
        COALESCE(SUM(CASE WHEN from_user_id = $1 THEN amount + fee_amount ELSE 0 END), 0) as total_sent,
        COALESCE(SUM(fee_amount), 0) as total_fees
      FROM transactions
      WHERE (from_user_id = $1 OR to_user_id = $1)
        AND created_at > NOW() - INTERVAL '${interval}'
        AND status = 'completed'
    `;

    const result = await this.pool.query(query, [userId]);
    
    const stats = result.rows[0];
    return {
      ...stats,
      net_flow: parseFloat(stats.total_received) - parseFloat(stats.total_sent),
      average_transaction: stats.total_transactions > 0 
        ? (parseFloat(stats.total_received) + parseFloat(stats.total_sent)) / stats.total_transactions
        : 0
    };
  }

  async sendTransactionNotifications(transaction) {
    try {
      // Get user details
      const userQuery = `
        SELECT id, email, phone_number, discord_id, telegram_id 
        FROM users 
        WHERE id = $1 OR id = $2
      `;
      
      const userResult = await this.pool.query(userQuery, [
        transaction.from_user_id,
        transaction.to_user_id
      ]);

      const users = userResult.rows;

      // Send notifications to relevant users
      for (const user of users) {
        if (user.id === transaction.to_user_id && transaction.amount > 0) {
          // Recipient notification
          await this.emailService.sendPaymentReceivedEmail(user, transaction);
          
          if (user.phone_number) {
            await this.smsService.sendPaymentNotification(
              user.phone_number,
              transaction.amount,
              user.balance
            );
          }
        }
      }
    } catch (error) {
      console.error('Send transaction notifications error:', error);
    }
  }

  async sendPaymentConfirmation(transaction) {
    try {
      const user = await this.pool.query(
        'SELECT * FROM users WHERE id = $1',
        [transaction.to_user_id]
      );

      if (user.rows.length > 0) {
        await this.emailService.sendPaymentReceivedEmail(user.rows[0], transaction);
      }
    } catch (error) {
      console.error('Send payment confirmation error:', error);
    }
  }

  async refundTransaction(transactionId, reason) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get original transaction
      const transactionResult = await client.query(
        'SELECT * FROM transactions WHERE id = $1',
        [transactionId]
      );

      if (transactionResult.rows.length === 0) {
        throw new Error('Transaction not found');
      }

      const originalTransaction = transactionResult.rows[0];

      if (originalTransaction.status !== 'completed') {
        throw new Error('Can only refund completed transactions');
      }

      // Create refund transaction
      const refundTransaction = await this.createTransaction({
        type: 'refund',
        fromUserId: originalTransaction.to_user_id,
        toUserId: originalTransaction.from_user_id,
        amount: originalTransaction.amount,
        contractId: originalTransaction.contract_id,
        metadata: {
          originalTransactionId: originalTransaction.id,
          reason: reason
        }
      });

      // If Stripe payment, create Stripe refund
      if (originalTransaction.stripe_payment_intent_id) {
        await this.stripe.refunds.create({
          payment_intent: originalTransaction.stripe_payment_intent_id,
          reason: 'requested_by_customer',
          metadata: {
            refund_transaction_id: refundTransaction.id
          }
        });
      }

      await client.query('COMMIT');

      this.emit('transactionRefunded', {
        original: originalTransaction,
        refund: refundTransaction
      });

      return refundTransaction;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Refund transaction error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = TransactionService;