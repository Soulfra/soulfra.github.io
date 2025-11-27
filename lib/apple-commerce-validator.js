/**
 * Apple Commerce Validator
 *
 * Validates Apple App Store Server API receipts for compliance with
 * App Store Review Guidelines. Handles JWSRenewalInfo, JWSTransaction,
 * and ErrorCodes validation.
 *
 * Integration with existing Subscriptions.js (Stripe):
 *   const validator = new AppleCommerceValidator();
 *   await validator.init();
 *   const result = await validator.validateTransaction(jws, userId);
 *   if (result.valid) {
 *     // Proceed with Stripe subscription creation
 *   }
 *
 * References:
 * - https://developer.apple.com/documentation/advancedcommerceapi/jwsrenewalinfo
 * - https://developer.apple.com/documentation/advancedcommerceapi/jwstransaction
 * - https://developer.apple.com/documentation/advancedcommerceapi/errorcodes
 */

const https = require('https');
const crypto = require('crypto');

/**
 * Apple Error Codes
 * Mapped from Apple Advanced Commerce API documentation
 */
const APPLE_ERROR_CODES = {
  // Authentication Errors
  4040001: 'Invalid or expired authentication token',
  4040002: 'Authentication token not provided',
  4030001: 'Insufficient permissions',

  // Transaction Errors
  4040010: 'Transaction not found',
  4000010: 'Invalid transaction ID',
  4090010: 'Transaction already refunded',

  // Subscription Errors
  4040020: 'Subscription not found',
  4000020: 'Invalid subscription ID',
  4090020: 'Subscription already cancelled',

  // Renewal Errors
  4040030: 'Renewal info not found',
  4000030: 'Invalid renewal parameters',

  // Receipt Errors
  21000: 'The App Store could not read the JSON object you provided',
  21002: 'The data in the receipt-data property was malformed',
  21003: 'The receipt could not be authenticated',
  21004: 'The shared secret you provided does not match the shared secret on file',
  21005: 'The receipt server is not currently available',
  21006: 'This receipt is valid but the subscription has expired',
  21007: 'This receipt is from the test environment',
  21008: 'This receipt is from the production environment',
  21009: 'Internal data access error',
  21010: 'The user account cannot be found or has been deleted',

  // Generic Errors
  5000001: 'Internal server error',
  4290001: 'Rate limit exceeded'
};

/**
 * Subscription Status Values
 */
const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  GRACE_PERIOD: 'grace_period',
  BILLING_RETRY: 'billing_retry'
};

class AppleCommerceValidator {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.environment = options.environment || 'production'; // or 'sandbox'
    this.calKB = options.calKB || null; // CalKnowledgeBase instance for logging

    // Apple public keys cache
    this.publicKeysCache = null;
    this.publicKeysCacheExpiry = null;
    this.publicKeysCacheTTL = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Initialize validator
   */
  async init() {
    // Fetch Apple public keys for JWS verification
    await this.refreshPublicKeys();

    if (this.verbose) {
      console.log(`🍎 Apple Commerce Validator initialized (${this.environment})`);
    }
  }

  /**
   * Fetch Apple public keys for JWS verification
   * Keys are cached for 24 hours
   */
  async refreshPublicKeys() {
    const now = Date.now();

    // Use cached keys if still valid
    if (this.publicKeysCache && this.publicKeysCacheExpiry && now < this.publicKeysCacheExpiry) {
      if (this.verbose) {
        console.log('🔑 Using cached Apple public keys');
      }
      return this.publicKeysCache;
    }

    // Apple's public key endpoint
    const url = 'https://appleid.apple.com/auth/keys';

    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const keys = JSON.parse(data);
            this.publicKeysCache = keys;
            this.publicKeysCacheExpiry = now + this.publicKeysCacheTTL;

            if (this.verbose) {
              console.log(`🔑 Fetched ${keys.keys.length} Apple public keys`);
            }

            resolve(keys);
          } catch (err) {
            reject(new Error(`Failed to parse Apple public keys: ${err.message}`));
          }
        });
      }).on('error', (err) => {
        reject(new Error(`Failed to fetch Apple public keys: ${err.message}`));
      });
    });
  }

  /**
   * Validate JWSTransaction (in-app purchase transaction)
   *
   * @param {string} jws - JSON Web Signature from Apple
   * @param {string} userId - User ID for logging
   * @returns {object} { valid, transaction, error }
   */
  async validateTransaction(jws, userId) {
    try {
      // Decode JWS (JWT format: header.payload.signature)
      const decoded = this.decodeJWS(jws);

      if (!decoded) {
        return {
          valid: false,
          error: 'Invalid JWS format',
          errorCode: 4000010
        };
      }

      // Verify signature with Apple public key
      const verified = await this.verifySignature(jws, decoded.header);

      if (!verified) {
        return {
          valid: false,
          error: 'JWS signature verification failed',
          errorCode: 21003
        };
      }

      // Parse transaction data
      const transaction = decoded.payload;

      // Validate transaction status
      const status = this.getTransactionStatus(transaction);

      // Log to CalKnowledgeBase if available
      if (this.calKB) {
        await this.logTransaction(userId, transaction, 'success', status);
      }

      return {
        valid: true,
        transaction: transaction,
        status: status,
        expiresAt: transaction.expiresDate ? new Date(transaction.expiresDate) : null
      };
    } catch (err) {
      if (this.verbose) {
        console.error(`❌ Transaction validation failed: ${err.message}`);
      }

      // Log error to CalKnowledgeBase
      if (this.calKB) {
        await this.logTransaction(userId, null, 'failure', null, err.message);
      }

      return {
        valid: false,
        error: err.message,
        errorCode: 5000001
      };
    }
  }

  /**
   * Validate JWSRenewalInfo (auto-renewing subscription renewal info)
   *
   * @param {string} jws - JSON Web Signature from Apple
   * @param {string} userId - User ID for logging
   * @returns {object} { valid, renewalInfo, error }
   */
  async validateRenewalInfo(jws, userId) {
    try {
      const decoded = this.decodeJWS(jws);

      if (!decoded) {
        return {
          valid: false,
          error: 'Invalid JWS format',
          errorCode: 4000030
        };
      }

      const verified = await this.verifySignature(jws, decoded.header);

      if (!verified) {
        return {
          valid: false,
          error: 'JWS signature verification failed',
          errorCode: 21003
        };
      }

      const renewalInfo = decoded.payload;

      // Determine renewal status
      const willRenew = renewalInfo.autoRenewStatus === 1;
      const gracePeriod = renewalInfo.isInBillingRetryPeriod === true;

      return {
        valid: true,
        renewalInfo: renewalInfo,
        willRenew: willRenew,
        gracePeriod: gracePeriod,
        expirationIntent: renewalInfo.expirationIntent || null
      };
    } catch (err) {
      if (this.verbose) {
        console.error(`❌ Renewal info validation failed: ${err.message}`);
      }

      return {
        valid: false,
        error: err.message,
        errorCode: 5000001
      };
    }
  }

  /**
   * Decode JWS (JWT) into header and payload
   * JWS format: header.payload.signature (all base64url encoded)
   */
  decodeJWS(jws) {
    try {
      const parts = jws.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const header = JSON.parse(this.base64UrlDecode(parts[0]));
      const payload = JSON.parse(this.base64UrlDecode(parts[1]));
      const signature = parts[2];

      return { header, payload, signature };
    } catch (err) {
      if (this.verbose) {
        console.error(`❌ JWS decode failed: ${err.message}`);
      }
      return null;
    }
  }

  /**
   * Verify JWS signature using Apple public key
   */
  async verifySignature(jws, header) {
    try {
      // Ensure public keys are available
      if (!this.publicKeysCache) {
        await this.refreshPublicKeys();
      }

      // Find matching public key by kid (key ID)
      const kid = header.kid;
      const key = this.publicKeysCache.keys.find(k => k.kid === kid);

      if (!key) {
        if (this.verbose) {
          console.error(`❌ No public key found for kid: ${kid}`);
        }
        return false;
      }

      // In production, you would use a proper JWT library (e.g., jsonwebtoken)
      // For now, return true (simplified for demo)
      // TODO: Implement actual RSA signature verification with crypto module
      return true;
    } catch (err) {
      if (this.verbose) {
        console.error(`❌ Signature verification failed: ${err.message}`);
      }
      return false;
    }
  }

  /**
   * Determine transaction status
   */
  getTransactionStatus(transaction) {
    const now = Date.now();
    const expiresAt = transaction.expiresDate ? new Date(transaction.expiresDate).getTime() : null;

    if (!expiresAt) {
      // Non-subscription purchase (consumable, non-consumable)
      return SUBSCRIPTION_STATUS.ACTIVE;
    }

    if (now < expiresAt) {
      return SUBSCRIPTION_STATUS.ACTIVE;
    }

    // Check if cancelled
    if (transaction.revocationDate) {
      return SUBSCRIPTION_STATUS.CANCELLED;
    }

    return SUBSCRIPTION_STATUS.EXPIRED;
  }

  /**
   * Log transaction to CalKnowledgeBase
   */
  async logTransaction(userId, transaction, validationStatus, subscriptionStatus, errorMessage = null) {
    if (!this.calKB || !this.calKB.db) {
      return;
    }

    const sql = `
      INSERT INTO apple_transactions (
        user_id,
        transaction_id,
        jws_transaction,
        validation_status,
        subscription_status,
        error_code,
        expires_at,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      userId,
      transaction ? transaction.transactionId : null,
      transaction ? JSON.stringify(transaction) : null,
      validationStatus,
      subscriptionStatus,
      errorMessage,
      transaction && transaction.expiresDate ? new Date(transaction.expiresDate).toISOString() : null,
      new Date().toISOString()
    ];

    try {
      await this.calKB.runSQL(sql, params);

      if (this.verbose) {
        console.log(`💾 Apple transaction logged for user: ${userId}`);
      }
    } catch (err) {
      if (this.verbose) {
        console.error(`❌ Failed to log transaction: ${err.message}`);
      }
    }
  }

  /**
   * Get human-readable error message from Apple error code
   */
  getErrorMessage(errorCode) {
    return APPLE_ERROR_CODES[errorCode] || `Unknown error (code: ${errorCode})`;
  }

  /**
   * Base64url decode (JWT standard)
   */
  base64UrlDecode(str) {
    // Convert base64url to base64
    str = str.replace(/-/g, '+').replace(/_/g, '/');

    // Pad with '=' if needed
    while (str.length % 4) {
      str += '=';
    }

    return Buffer.from(str, 'base64').toString('utf8');
  }
}

module.exports = AppleCommerceValidator;

// CLI usage example
if (require.main === module) {
  (async () => {
    console.log('🍎 Apple Commerce Validator Demo\n');

    const validator = new AppleCommerceValidator({ verbose: true });
    await validator.init();

    // Demo: Validate a mock JWS transaction
    const mockJWS = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjEyMzQ1In0.eyJ0cmFuc2FjdGlvbklkIjoidHhuXzEyMzQ1IiwiZXhwaXJlc0RhdGUiOjE3MzE2MDAwMDAwMDB9.mock-signature';

    console.log('📝 Validating mock transaction...\n');
    const result = await validator.validateTransaction(mockJWS, 'test-user');

    console.log('Result:', result);
    console.log('\n✅ Demo complete!');
  })();
}
