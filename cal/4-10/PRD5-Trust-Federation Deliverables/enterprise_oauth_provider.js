// soulfra/src/modules/federation/oauth-provider.js
// Enterprise OAuth2 Provider - Compete with Auth0 for AI platforms

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { AdvancedCryptoEngine } = require('./advanced-crypto');

class EnterpriseOAuth2Provider {
  constructor(db, cryptoEngine) {
    this.db = db;
    this.crypto = cryptoEngine;
    this.initializeOAuthTables();
  }

  initializeOAuthTables() {
    this.db.exec(`
      -- OAuth2 Applications (Partners)
      CREATE TABLE IF NOT EXISTS oauth_applications (
        client_id TEXT PRIMARY KEY,
        client_secret_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        website_url TEXT,
        callback_urls TEXT, -- JSON array
        logo_url TEXT,
        
        -- Trust requirements
        min_trust_required INTEGER DEFAULT 0,
        max_daily_verifications INTEGER DEFAULT 10000,
        
        -- Features & permissions
        scopes_allowed TEXT DEFAULT 'trust:read', -- space-separated
        features_enabled TEXT, -- JSON array
        
        -- Status & limits
        status TEXT DEFAULT 'pending',
        verified BOOLEAN DEFAULT FALSE,
        rate_limit_per_hour INTEGER DEFAULT 1000,
        
        -- Business details
        industry TEXT,
        company_size TEXT,
        integration_type TEXT, -- 'web', 'mobile', 'api', 'enterprise'
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP,
        last_used TIMESTAMP
      );

      -- OAuth2 Authorization Codes
      CREATE TABLE IF NOT EXISTS oauth_auth_codes (
        code TEXT PRIMARY KEY,
        client_id TEXT REFERENCES oauth_applications(client_id),
        user_id INTEGER REFERENCES users(id),
        scope TEXT NOT NULL,
        redirect_uri TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- OAuth2 Access Tokens  
      CREATE TABLE IF NOT EXISTS oauth_access_tokens (
        token_id TEXT PRIMARY KEY,
        token_hash TEXT NOT NULL,
        client_id TEXT REFERENCES oauth_applications(client_id),
        user_id INTEGER REFERENCES users(id),
        scope TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        refresh_token_hash TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used TIMESTAMP,
        usage_count INTEGER DEFAULT 0
      );

      -- Trust Sharing Consents
      CREATE TABLE IF NOT EXISTS trust_sharing_consents (
        id TEXT PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        client_id TEXT REFERENCES oauth_applications(client_id),
        scope TEXT NOT NULL,
        granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        auto_renew BOOLEAN DEFAULT FALSE,
        last_shared TIMESTAMP
      );

      -- API Usage Analytics
      CREATE TABLE IF NOT EXISTS oauth_usage_analytics (
        id TEXT PRIMARY KEY,
        client_id TEXT REFERENCES oauth_applications(client_id),
        user_id INTEGER REFERENCES users(id),
        endpoint TEXT NOT NULL,
        trust_score_accessed INTEGER,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        response_time_ms INTEGER,
        success BOOLEAN DEFAULT TRUE,
        error_code TEXT,
        ip_address TEXT,
        user_agent TEXT
      );

      -- Webhooks Configuration
      CREATE TABLE IF NOT EXISTS oauth_webhooks (
        id TEXT PRIMARY KEY,
        client_id TEXT REFERENCES oauth_applications(client_id),
        endpoint_url TEXT NOT NULL,
        secret_hash TEXT NOT NULL,
        events TEXT NOT NULL, -- JSON array of subscribed events
        active BOOLEAN DEFAULT TRUE,
        last_success TIMESTAMP,
        failure_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_oauth_codes_expires ON oauth_auth_codes(expires_at);
      CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires ON oauth_access_tokens(expires_at);
      CREATE INDEX IF NOT EXISTS idx_oauth_usage_client ON oauth_usage_analytics(client_id, timestamp);
    `);
  }

  // ===== PARTNER REGISTRATION & MANAGEMENT =====

  async registerPartnerApplication(applicationData) {
    const clientId = 'sf_' + crypto.randomBytes(16).toString('hex');
    const clientSecret = 'sfs_' + crypto.randomBytes(32).toString('hex');
    const clientSecretHash = await this.hashSecret(clientSecret);

    const stmt = this.db.prepare(`
      INSERT INTO oauth_applications 
      (client_id, client_secret_hash, name, description, website_url, callback_urls,
       logo_url, min_trust_required, scopes_allowed, industry, company_size, integration_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      clientId,
      clientSecretHash,
      applicationData.name,
      applicationData.description,
      applicationData.websiteUrl,
      JSON.stringify(applicationData.callbackUrls || []),
      applicationData.logoUrl,
      applicationData.minTrustRequired || 0,
      applicationData.scopesAllowed || 'trust:read',
      applicationData.industry,
      applicationData.companySize,
      applicationData.integrationType || 'web'
    ]);

    // Generate webhook secret
    const webhookSecret = 'sfwhk_' + crypto.randomBytes(32).toString('hex');

    return {
      clientId,
      clientSecret, // Only returned once
      webhookSecret,
      status: 'pending',
      dashboardUrl: `https://soulfra.ai/partners/dashboard/${clientId}`,
      documentation: 'https://docs.soulfra.ai/federation/oauth2',
      testingSandbox: `https://sandbox.soulfra.ai/oauth/test/${clientId}`,
      nextSteps: [
        'Implement OAuth2 authorization flow',
        'Set up webhook endpoints',
        'Test in sandbox environment',
        'Submit for production approval'
      ]
    };
  }

  // ===== OAUTH2 AUTHORIZATION FLOW =====

  async authorize(params, userId) {
    const { client_id, redirect_uri, scope, state, response_type } = params;

    // Validate client
    const client = this.db.prepare(`
      SELECT * FROM oauth_applications WHERE client_id = ? AND status = 'active'
    `).get(client_id);

    if (!client) {
      throw new Error('Invalid or inactive client');
    }

    // Validate redirect URI
    const allowedUrls = JSON.parse(client.callback_urls || '[]');
    if (!allowedUrls.includes(redirect_uri)) {
      throw new Error('Invalid redirect URI');
    }

    // Validate scope
    const requestedScopes = scope.split(' ');
    const allowedScopes = client.scopes_allowed.split(' ');
    const invalidScopes = requestedScopes.filter(s => !allowedScopes.includes(s));
    
    if (invalidScopes.length > 0) {
      throw new Error(`Invalid scopes: ${invalidScopes.join(', ')}`);
    }

    // Check user trust requirements
    const user = this.db.prepare('SELECT trust_score FROM users WHERE id = ?').get(userId);
    if (user.trust_score < client.min_trust_required) {
      throw new Error(`Minimum trust score of ${client.min_trust_required} required`);
    }

    // Check existing consent
    const existingConsent = this.db.prepare(`
      SELECT * FROM trust_sharing_consents 
      WHERE user_id = ? AND client_id = ? AND scope = ?
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `).get(userId, client_id, scope);

    // Generate authorization code
    const authCode = 'sfac_' + crypto.randomBytes(20).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    this.db.prepare(`
      INSERT INTO oauth_auth_codes 
      (code, client_id, user_id, scope, redirect_uri, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run([authCode, client_id, userId, scope, redirect_uri, expiresAt]);

    return {
      authorizationCode: authCode,
      state,
      redirectUrl: `${redirect_uri}?code=${authCode}&state=${state}`,
      requiresConsent: !existingConsent,
      clientInfo: {
        name: client.name,
        description: client.description,
        logoUrl: client.logo_url,
        website: client.website_url
      },
      scopeDetails: this.describeScopePermissions(requestedScopes)
    };
  }

  // ===== TOKEN EXCHANGE =====

  async exchangeToken(code, clientId, clientSecret, redirectUri) {
    // Verify client credentials
    const client = await this.verifyClientCredentials(clientId, clientSecret);
    if (!client) {
      throw new Error('Invalid client credentials');
    }

    // Get and validate auth code
    const authCode = this.db.prepare(`
      SELECT * FROM oauth_auth_codes 
      WHERE code = ? AND client_id = ? AND redirect_uri = ? AND used = FALSE
    `).get(code, clientId, redirectUri);

    if (!authCode) {
      throw new Error('Invalid or expired authorization code');
    }

    if (new Date() > new Date(authCode.expires_at)) {
      throw new Error('Authorization code expired');
    }

    // Mark code as used
    this.db.prepare('UPDATE oauth_auth_codes SET used = TRUE WHERE code = ?').run(code);

    // Generate access token
    const tokenId = 'sfat_' + crypto.randomBytes(20).toString('hex');
    const accessToken = 'sfat_' + crypto.randomBytes(32).toString('hex');
    const refreshToken = 'sfrt_' + crypto.randomBytes(32).toString('hex');
    
    const tokenHash = await this.hashSecret(accessToken);
    const refreshTokenHash = await this.hashSecret(refreshToken);
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    this.db.prepare(`
      INSERT INTO oauth_access_tokens 
      (token_id, token_hash, client_id, user_id, scope, expires_at, refresh_token_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run([
      tokenId, tokenHash, clientId, authCode.user_id, 
      authCode.scope, expiresAt, refreshTokenHash
    ]);

    // Store consent for future use
    this.db.prepare(`
      INSERT OR REPLACE INTO trust_sharing_consents 
      (id, user_id, client_id, scope, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).run([
      crypto.randomBytes(16).toString('hex'),
      authCode.user_id,
      clientId,
      authCode.scope,
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    ]);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: refreshToken,
      scope: authCode.scope
    };
  }

  // ===== USER INFO & TRUST DATA ENDPOINTS =====

  async getUserTrustInfo(accessToken, requestedFields = []) {
    const tokenData = await this.verifyAccessToken(accessToken);
    if (!tokenData) {
      throw new Error('Invalid access token');
    }

    // Log API usage
    this.logApiUsage(tokenData.client_id, tokenData.user_id, 'userinfo', tokenData.user.trust_score);

    // Get enhanced user data
    const user = this.db.prepare(`
      SELECT u.*, 
        COUNT(tc.id) as certificate_count,
        SUM(tc.usage_count) as total_verifications,
        MAX(tc.trust_score) as highest_trust_score
      FROM users u
      LEFT JOIN trust_certificates tc ON tc.user_id = u.id
      WHERE u.id = ?
      GROUP BY u.id
    `).get(tokenData.user_id);

    // Determine what data to return based on scope
    const scopes = tokenData.scope.split(' ');
    const response = {
      sub: `soulfra:user:${user.id}`,
      verified: true,
      issued_at: Math.floor(Date.now() / 1000)
    };

    if (scopes.includes('trust:read')) {
      response.trust = {
        score: user.trust_score,
        tier: this.calculateTier(user.trust_score),
        percentile: await this.calculatePercentile(user.trust_score),
        certificates_issued: user.certificate_count || 0,
        total_verifications: user.total_verifications || 0,
        highest_score: user.highest_trust_score || user.trust_score,
        last_updated: user.updated_at
      };
    }

    if (scopes.includes('trust:history')) {
      response.trust_history = await this.getTrustHistory(user.id);
    }

    if (scopes.includes('profile:read')) {
      response.profile = {
        created_at: user.created_at,
        account_age_days: Math.floor((Date.now() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)),
        verified_email: !!user.email
      };
    }

    if (scopes.includes('achievements:read')) {
      response.achievements = await this.getUserAchievements(user.id);
    }

    // Apply selective disclosure if requested
    if (requestedFields.length > 0) {
      const filtered = {};
      requestedFields.forEach(field => {
        if (response[field] !== undefined) {
          filtered[field] = response[field];
        }
      });
      return filtered;
    }

    return response;
  }

  // ===== WEBHOOK SYSTEM =====

  async setupWebhook(clientId, webhookData) {
    const client = this.db.prepare(`
      SELECT * FROM oauth_applications WHERE client_id = ? AND status = 'active'
    `).get(clientId);

    if (!client) {
      throw new Error('Invalid client');
    }

    const webhookId = 'sfwhk_' + crypto.randomBytes(16).toString('hex');
    const secret = 'sfwhks_' + crypto.randomBytes(32).toString('hex');
    const secretHash = await this.hashSecret(secret);

    this.db.prepare(`
      INSERT INTO oauth_webhooks 
      (id, client_id, endpoint_url, secret_hash, events)
      VALUES (?, ?, ?, ?, ?)
    `).run([
      webhookId,
      clientId,
      webhookData.endpointUrl,
      secretHash,
      JSON.stringify(webhookData.events || ['trust.updated', 'certificate.issued'])
    ]);

    return {
      webhookId,
      secret, // Only returned once
      endpointUrl: webhookData.endpointUrl,
      events: webhookData.events,
      testUrl: `https://soulfra.ai/webhooks/test/${webhookId}`
    };
  }

  async sendWebhook(clientId, event, data) {
    const webhooks = this.db.prepare(`
      SELECT * FROM oauth_webhooks 
      WHERE client_id = ? AND active = TRUE
    `).all(clientId);

    for (const webhook of webhooks) {
      const events = JSON.parse(webhook.events);
      if (events.includes(event.type)) {
        try {
          await this.deliverWebhook(webhook, event, data);
          
          // Update success timestamp
          this.db.prepare(`
            UPDATE oauth_webhooks 
            SET last_success = CURRENT_TIMESTAMP, failure_count = 0 
            WHERE id = ?
          `).run(webhook.id);
          
        } catch (error) {
          console.error(`Webhook delivery failed for ${webhook.id}:`, error);
          
          // Increment failure count
          this.db.prepare(`
            UPDATE oauth_webhooks 
            SET failure_count = failure_count + 1 
            WHERE id = ?
          `).run(webhook.id);
          
          // Disable after 10 failures
          if (webhook.failure_count >= 9) {
            this.db.prepare(`
              UPDATE oauth_webhooks 
              SET active = FALSE 
              WHERE id = ?
            `).run(webhook.id);
          }
        }
      }
    }
  }

  async deliverWebhook(webhook, event, data) {
    const payload = {
      event: event.type,
      timestamp: Date.now(),
      data: data
    };

    const signature = crypto
      .createHmac('sha256', webhook.secret_hash)
      .update(JSON.stringify(payload))
      .digest('hex');

    const response = await fetch(webhook.endpoint_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Soulfra-Signature': `sha256=${signature}`,
        'X-Soulfra-Webhook-Id': webhook.id,
        'User-Agent': 'Soulfra-Webhooks/1.0'
      },
      body: JSON.stringify(payload),
      timeout: 10000 // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Webhook delivery failed: ${response.status} ${response.statusText}`);
    }
  }

  // ===== ANALYTICS & MONITORING =====

  getPartnerAnalytics(clientId, timeRange = '7d') {
    const timeCondition = this.getTimeCondition(timeRange);
    
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(DISTINCT user_id) as unique_users,
        AVG(trust_score_accessed) as avg_trust_score,
        AVG(response_time_ms) as avg_response_time,
        COUNT(CASE WHEN success = TRUE THEN 1 END) as successful_requests,
        COUNT(CASE WHEN success = FALSE THEN 1 END) as failed_requests
      FROM oauth_usage_analytics 
      WHERE client_id = ? AND ${timeCondition}
    `).get(clientId);

    const topEndpoints = this.db.prepare(`
      SELECT endpoint, COUNT(*) as usage_count
      FROM oauth_usage_analytics 
      WHERE client_id = ? AND ${timeCondition}
      GROUP BY endpoint 
      ORDER BY usage_count DESC 
      LIMIT 10
    `).all(clientId);

    const timeSeriesData = this.db.prepare(`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as requests,
        COUNT(DISTINCT user_id) as unique_users,
        AVG(trust_score_accessed) as avg_trust_score
      FROM oauth_usage_analytics 
      WHERE client_id = ? AND ${timeCondition}
      GROUP BY DATE(timestamp) 
      ORDER BY date DESC
    `).all(clientId);

    return {
      summary: stats,
      topEndpoints,
      timeSeries: timeSeriesData,
      period: timeRange
    };
  }

  // ===== UTILITY METHODS =====

  async verifyClientCredentials(clientId, clientSecret) {
    const client = this.db.prepare(`
      SELECT * FROM oauth_applications WHERE client_id = ?
    `).get(clientId);

    if (!client) return null;

    const isValidSecret = await this.verifySecret(clientSecret, client.client_secret_hash);
    return isValidSecret ? client : null;
  }

  async verifyAccessToken(token) {
    const tokenHash = await this.hashSecret(token);
    
    const tokenData = this.db.prepare(`
      SELECT oat.*, u.trust_score, u.email, oa.name as client_name
      FROM oauth_access_tokens oat
      JOIN users u ON oat.user_id = u.id
      JOIN oauth_applications oa ON oat.client_id = oa.client_id
      WHERE oat.token_hash = ? AND oat.expires_at > CURRENT_TIMESTAMP
    `).get(tokenHash);

    if (!tokenData) return null;

    // Update last used
    this.db.prepare(`
      UPDATE oauth_access_tokens 
      SET last_used = CURRENT_TIMESTAMP, usage_count = usage_count + 1 
      WHERE token_id = ?
    `).run(tokenData.token_id);

    return {
      ...tokenData,
      user: {
        id: tokenData.user_id,
        trust_score: tokenData.trust_score,
        email: tokenData.email
      }
    };
  }

  describeScopePermissions(scopes) {
    const descriptions = {
      'trust:read': 'Access your current trust score and tier',
      'trust:history': 'Access your trust score history and trends',
      'profile:read': 'Access basic profile information',
      'achievements:read': 'Access your badges and achievements',
      'certificates:generate': 'Generate trust certificates on your behalf'
    };

    return scopes.map(scope => ({
      scope,
      description: descriptions[scope] || 'Unknown permission',
      required: true
    }));
  }

  logApiUsage(clientId, userId, endpoint, trustScore) {
    this.db.prepare(`
      INSERT INTO oauth_usage_analytics 
      (id, client_id, user_id, endpoint, trust_score_accessed, response_time_ms, success)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run([
      crypto.randomBytes(16).toString('hex'),
      clientId,
      userId,
      endpoint,
      trustScore,
      Math.floor(Math.random() * 200) + 50, // Mock response time
      true
    ]);
  }

  async hashSecret(secret) {
    return crypto.createHash('sha256').update(secret).digest('hex');
  }

  async verifySecret(secret, hash) {
    return (await this.hashSecret(secret)) === hash;
  }

  calculateTier(trustScore) {
    if (trustScore >= 70) return 'premium';
    if (trustScore >= 50) return 'standard';
    return 'basic';
  }

  getTimeCondition(timeRange) {
    const ranges = {
      '1d': "timestamp >= datetime('now', '-1 day')",
      '7d': "timestamp >= datetime('now', '-7 days')",
      '30d': "timestamp >= datetime('now', '-30 days')",
      '90d': "timestamp >= datetime('now', '-90 days')"
    };
    return ranges[timeRange] || ranges['7d'];
  }
}

module.exports = { EnterpriseOAuth2Provider };