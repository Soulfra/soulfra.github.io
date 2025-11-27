// soulfra-trust-sdk - Enterprise Partner Integration SDK
// npm install soulfra-trust-sdk

/**
 * Soulfra Trust Federation SDK
 * 
 * Enterprise-grade SDK for integrating with Soulfra's Trust Federation system.
 * Enables platforms to verify user trust scores, implement trust-based access control,
 * and participate in the cross-platform reputation network.
 * 
 * @version 2.0.0
 * @author Soulfra Engineering Team
 * @license MIT
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class SoulfraTrustSDK {
  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.webhookSecret = config.webhookSecret;
    this.baseUrl = config.baseUrl || 'https://api.soulfra.ai';
    this.environment = config.environment || 'production';
    this.rateLimiter = new RateLimiter(config.rateLimit);
    this.cache = new Map();
    this.analytics = new SDKAnalytics(config.analytics);
    
    if (!this.clientId || !this.clientSecret) {
      throw new Error('clientId and clientSecret are required');
    }
  }

  // ===== AUTHENTICATION & SETUP =====

  /**
   * Initialize OAuth2 flow for user trust verification
   * @param {Object} options - OAuth configuration
   * @returns {Promise<Object>} Authorization URL and state
   */
  async createAuthorizationUrl(options = {}) {
    const state = crypto.randomBytes(16).toString('hex');
    const scope = options.scope || 'trust:read';
    const redirectUri = options.redirectUri || this.config.defaultRedirectUri;

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      scope,
      state,
      redirect_uri: redirectUri
    });

    return {
      authorizationUrl: `${this.baseUrl}/oauth/authorize?${params}`,
      state,
      expiresIn: 600 // 10 minutes
    };
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from callback
   * @param {string} redirectUri - Must match authorization request
   * @returns {Promise<Object>} Access token and user info
   */
  async exchangeCodeForToken(code, redirectUri) {
    const response = await this.makeRequest('/oauth/token', {
      method: 'POST',
      body: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret
      }
    });

    // Cache token for this user session
    this.cache.set(`token:${code}`, response, 3600); // 1 hour cache

    return response;
  }

  // ===== TRUST VERIFICATION =====

  /**
   * Verify a user's trust certificate
   * @param {string} certificate - JWT trust certificate
   * @param {Object} options - Verification options
   * @returns {Promise<Object>} Verification result with trust data
   */
  async verifyTrustCertificate(certificate, options = {}) {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = `verify:${this.hashString(certificate)}`;
      if (this.cache.has(cacheKey) && !options.bypassCache) {
        this.analytics.recordCacheHit('verify', Date.now() - startTime);
        return this.cache.get(cacheKey);
      }

      const response = await this.makeRequest('/federation/verify', {
        method: 'POST',
        headers: {
          'X-API-Key': this.clientSecret,
          'X-Partner-ID': this.clientId
        },
        body: {
          certificate,
          partnerId: this.clientId,
          options: {
            verifyZKP: options.verifyZeroKnowledge || false,
            selectiveFields: options.selectiveFields || [],
            strictMode: options.strictMode || false
          }
        }
      });

      // Cache successful verifications
      if (response.valid) {
        this.cache.set(cacheKey, response, 300); // 5 minute cache
      }

      this.analytics.recordApiCall('verify', Date.now() - startTime, response.valid);
      return response;

    } catch (error) {
      this.analytics.recordError('verify', error);
      throw new TrustVerificationError(`Verification failed: ${error.message}`);
    }
  }

  /**
   * Get detailed user trust information via OAuth token
   * @param {string} accessToken - OAuth access token
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Detailed trust profile
   */
  async getUserTrustProfile(accessToken, options = {}) {
    const startTime = Date.now();

    try {
      const response = await this.makeRequest('/oauth/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Partner-ID': this.clientId
        },
        query: {
          fields: options.fields?.join(','),
          include_history: options.includeHistory || false,
          include_achievements: options.includeAchievements || true
        }
      });

      this.analytics.recordApiCall('userinfo', Date.now() - startTime, true);
      return response;

    } catch (error) {
      this.analytics.recordError('userinfo', error);
      throw new TrustAPIError(`Failed to get user profile: ${error.message}`);
    }
  }

  // ===== TRUST-BASED ACCESS CONTROL =====

  /**
   * Check if user meets trust requirements for a feature
   * @param {Object} userTrust - User trust data
   * @param {Object} requirements - Access requirements
   * @returns {Object} Access decision with details
   */
  checkAccess(userTrust, requirements) {
    const result = {
      granted: false,
      reason: null,
      recommendations: [],
      metadata: {
        userTier: userTrust.tier,
        requiredScore: requirements.minTrustScore,
        actualScore: userTrust.score,
        timestamp: Date.now()
      }
    };

    // Basic trust score check
    if (userTrust.score < requirements.minTrustScore) {
      result.reason = 'insufficient_trust_score';
      result.recommendations.push({
        action: 'improve_trust',
        description: `Increase trust score to ${requirements.minTrustScore}`,
        estimatedTime: this.estimateTimeToImprove(userTrust.score, requirements.minTrustScore)
      });
      return result;
    }

    // Tier-based restrictions
    if (requirements.requiredTier && !this.checkTierRequirement(userTrust.tier, requirements.requiredTier)) {
      result.reason = 'insufficient_tier';
      result.recommendations.push({
        action: 'upgrade_tier',
        description: `Upgrade to ${requirements.requiredTier} tier`,
        benefits: this.getTierBenefits(requirements.requiredTier)
      });
      return result;
    }

    // Behavioral requirements
    if (requirements.behaviorChecks) {
      const behaviorResult = this.checkBehaviorRequirements(userTrust.behavior, requirements.behaviorChecks);
      if (!behaviorResult.passed) {
        result.reason = 'behavior_requirements_not_met';
        result.recommendations.push(...behaviorResult.recommendations);
        return result;
      }
    }

    // Risk assessment
    if (requirements.maxRiskLevel && userTrust.behavior?.risk_assessment) {
      if (this.getRiskLevel(userTrust.behavior.risk_assessment) > requirements.maxRiskLevel) {
        result.reason = 'risk_too_high';
        result.recommendations.push({
          action: 'reduce_risk',
          description: 'Complete additional verification steps',
          steps: ['verify_email', 'link_additional_accounts', 'complete_trust_building_activities']
        });
        return result;
      }
    }

    // All checks passed
    result.granted = true;
    result.grantedFeatures = this.determineGrantedFeatures(userTrust, requirements);
    
    return result;
  }

  /**
   * Middleware for Express.js to protect routes with trust requirements
   * @param {Object} requirements - Trust requirements for the route
   * @returns {Function} Express middleware function
   */
  requireTrust(requirements) {
    return async (req, res, next) => {
      try {
        // Extract trust data from request (via header, token, etc.)
        const trustData = await this.extractTrustFromRequest(req);
        
        if (!trustData) {
          return res.status(401).json({
            error: 'trust_required',
            message: 'Valid trust verification required',
            authUrl: await this.createAuthorizationUrl({
              redirectUri: req.originalUrl
            })
          });
        }

        // Check access requirements
        const accessCheck = this.checkAccess(trustData, requirements);
        
        if (!accessCheck.granted) {
          return res.status(403).json({
            error: 'insufficient_trust',
            reason: accessCheck.reason,
            recommendations: accessCheck.recommendations,
            userTrust: {
              score: trustData.score,
              tier: trustData.tier,
              required: requirements
            }
          });
        }

        // Add trust data to request for use in route handlers
        req.userTrust = trustData;
        req.accessGrant = accessCheck;
        
        next();
        
      } catch (error) {
        res.status(500).json({
          error: 'trust_verification_failed',
          message: error.message
        });
      }
    };
  }

  // ===== WEBHOOK HANDLING =====

  /**
   * Verify webhook signature and parse event
   * @param {string} payload - Raw webhook payload
   * @param {string} signature - Webhook signature header
   * @returns {Object} Parsed and verified webhook event
   */
  verifyWebhook(payload, signature) {
    if (!this.webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    const providedSignature = signature.replace('sha256=', '');

    if (!crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    )) {
      throw new WebhookVerificationError('Invalid webhook signature');
    }

    try {
      return JSON.parse(payload);
    } catch (error) {
      throw new WebhookVerificationError('Invalid webhook payload');
    }
  }

  /**
   * Handle webhook events with automatic event type routing
   * @param {Object} event - Verified webhook event
   * @param {Object} handlers - Event type handlers
   */
  async handleWebhookEvent(event, handlers) {
    const eventType = event.event;
    const handler = handlers[eventType];

    if (!handler) {
      console.warn(`No handler for webhook event type: ${eventType}`);
      return { status: 'ignored', reason: 'no_handler' };
    }

    try {
      const result = await handler(event.data, event);
      
      this.analytics.recordWebhookEvent(eventType, true);
      
      return {
        status: 'processed',
        eventType,
        result
      };
      
    } catch (error) {
      console.error(`Webhook handler error for ${eventType}:`, error);
      
      this.analytics.recordWebhookEvent(eventType, false, error);
      
      return {
        status: 'error',
        eventType,
        error: error.message
      };
    }
  }

  // ===== ANALYTICS & MONITORING =====

  /**
   * Get integration analytics and usage metrics
   * @param {Object} options - Analytics query options
   * @returns {Promise<Object>} Analytics data
   */
  async getAnalytics(options = {}) {
    const timeRange = options.timeRange || '7d';
    
    const response = await this.makeRequest('/federation/analytics', {
      query: {
        client_id: this.clientId,
        time_range: timeRange,
        metrics: options.metrics?.join(',') || 'all',
        granularity: options.granularity || 'daily'
      },
      headers: {
        'X-API-Key': this.clientSecret
      }
    });

    return response;
  }

  /**
   * Track custom events for your integration
   * @param {string} event - Event name
   * @param {Object} properties - Event properties
   */
  trackEvent(event, properties = {}) {
    this.analytics.trackCustomEvent(event, {
      ...properties,
      clientId: this.clientId,
      timestamp: Date.now()
    });
  }

  // ===== UTILITY METHODS =====

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || 'GET';
    
    // Rate limiting
    await this.rateLimiter.checkLimit();

    // Build request
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `SoulfraTrustSDK/2.0.0 (${this.environment})`,
        ...options.headers
      }
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    if (options.query) {
      const params = new URLSearchParams(options.query);
      url += `?${params}`;
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new APIError(`API request failed: ${response.status} ${error.message}`);
    }

    return response.json();
  }

  checkTierRequirement(userTier, requiredTier) {
    const tiers = { basic: 1, standard: 2, premium: 3 };
    return tiers[userTier] >= tiers[requiredTier];
  }

  checkBehaviorRequirements(behavior, requirements) {
    const result = { passed: true, recommendations: [] };

    if (requirements.minConsistency && behavior.consistency_score < requirements.minConsistency) {
      result.passed = false;
      result.recommendations.push({
        action: 'improve_consistency',
        description: 'Maintain more regular interaction patterns'
      });
    }

    if (requirements.minQuality && behavior.interaction_quality < requirements.minQuality) {
      result.passed = false;
      result.recommendations.push({
        action: 'improve_quality',
        description: 'Focus on helpful, high-quality interactions'
      });
    }

    return result;
  }

  getRiskLevel(riskAssessment) {
    const levels = { low: 1, medium: 2, high: 3 };
    return levels[riskAssessment] || 2;
  }

  hashString(str) {
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
  }

  estimateTimeToImprove(currentScore, targetScore) {
    const pointsNeeded = targetScore - currentScore;
    const avgGainPerWeek = 2; // Conservative estimate
    return Math.ceil(pointsNeeded / avgGainPerWeek);
  }
}

// ===== HELPER CLASSES =====

class RateLimiter {
  constructor(config = {}) {
    this.maxRequests = config.maxRequests || 1000;
    this.windowMs = config.windowMs || 60000; // 1 minute
    this.requests = [];
  }

  async checkLimit() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);
      throw new RateLimitError(`Rate limit exceeded. Wait ${waitTime}ms`);
    }

    this.requests.push(now);
  }
}

class SDKAnalytics {
  constructor(config = {}) {
    this.enabled = config.enabled !== false;
    this.events = [];
  }

  recordApiCall(endpoint, duration, success) {
    if (!this.enabled) return;
    
    this.events.push({
      type: 'api_call',
      endpoint,
      duration,
      success,
      timestamp: Date.now()
    });
  }

  recordCacheHit(operation, savedTime) {
    if (!this.enabled) return;
    
    this.events.push({
      type: 'cache_hit',
      operation,
      savedTime,
      timestamp: Date.now()
    });
  }

  recordError(operation, error) {
    if (!this.enabled) return;
    
    this.events.push({
      type: 'error',
      operation,
      error: error.message,
      timestamp: Date.now()
    });
  }

  recordWebhookEvent(eventType, success, error = null) {
    if (!this.enabled) return;
    
    this.events.push({
      type: 'webhook',
      eventType,
      success,
      error: error?.message,
      timestamp: Date.now()
    });
  }

  trackCustomEvent(event, properties) {
    if (!this.enabled) return;
    
    this.events.push({
      type: 'custom',
      event,
      properties,
      timestamp: Date.now()
    });
  }
}

// ===== ERROR CLASSES =====

class TrustVerificationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TrustVerificationError';
  }
}

class TrustAPIError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TrustAPIError';
  }
}

class WebhookVerificationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'WebhookVerificationError';
  }
}

class APIError extends Error {
  constructor(message) {
    super(message);
    this.name = 'APIError';
  }
}

class RateLimitError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// ===== EXPORT =====

module.exports = {
  SoulfraTrustSDK,
  TrustVerificationError,
  TrustAPIError,
  WebhookVerificationError,
  APIError,
  RateLimitError
};

// ===== USAGE EXAMPLES =====

/*
// Example 1: Basic Integration
const sdk = new SoulfraTrustSDK({
  clientId: 'sf_your_client_id',
  clientSecret: 'sfs_your_client_secret',
  webhookSecret: 'sfwhk_your_webhook_secret'
});

// Example 2: Verify Trust Certificate
const verification = await sdk.verifyTrustCertificate(userCertificate);
if (verification.valid && verification.trustScore >= 70) {
  // Grant premium access
}

// Example 3: Express.js Middleware
app.get('/premium-feature', 
  sdk.requireTrust({ minTrustScore: 70, requiredTier: 'premium' }),
  (req, res) => {
    res.json({ message: 'Premium feature accessed!', userTrust: req.userTrust });
  }
);

// Example 4: Webhook Handler
app.post('/webhooks/soulfra', (req, res) => {
  const event = sdk.verifyWebhook(req.body, req.headers['x-soulfra-signature']);
  
  sdk.handleWebhookEvent(event, {
    'trust.updated': async (data) => {
      // Update user permissions based on new trust score
      await updateUserPermissions(data.userId, data.newTrustScore);
    },
    'certificate.issued': async (data) => {
      // Log certificate issuance
      console.log(`Certificate issued for user ${data.userId}`);
    }
  });
  
  res.status(200).json({ received: true });
});

// Example 5: OAuth Flow
const authUrl = await sdk.createAuthorizationUrl({
  scope: 'trust:read profile:read',
  redirectUri: 'https://yourapp.com/callback'
});

// Redirect user to authUrl.authorizationUrl
// After user returns with code:
const tokenResponse = await sdk.exchangeCodeForToken(code, redirectUri);
const userTrust = await sdk.getUserTrustProfile(tokenResponse.access_token);
*/