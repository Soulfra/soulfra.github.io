// soulfra/src/modules/federation/index.js
// Plugs into existing Soulfra architecture

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

class TrustFederation {
  constructor(db, config = {}) {
    this.db = db;
    this.jwtSecret = config.jwtSecret || process.env.JWT_SECRET;
    this.issuer = config.issuer || 'https://soulfra.ai';
    this.keyId = config.keyId || 'soulfra-v1';
  }

  // ===== CORE CERTIFICATE FUNCTIONS =====
  
  async generateCertificate(userId, options = {}) {
    // Get user's current trust data from existing system
    const user = this.db.prepare(`
      SELECT trust_score, email, created_at 
      FROM users WHERE id = ?
    `).get(userId);
    
    if (!user) throw new Error('User not found');

    // Create trust claims (standard JWT format)
    const now = Math.floor(Date.now() / 1000);
    const claims = {
      // Standard JWT claims
      iss: this.issuer,
      sub: `user:${userId}`,
      aud: options.audience || 'federation',
      iat: now,
      exp: now + (options.validitySeconds || 30 * 24 * 60 * 60), // 30 days default
      
      // Soulfra trust claims
      trust: {
        score: user.trust_score,
        tier: this.getTier(user.trust_score),
        earned_at: user.created_at,
        last_updated: now
      },
      
      // Certificate metadata
      version: '1.0',
      type: 'trust_certificate'
    };

    // Add privacy option
    if (options.anonymous) {
      delete claims.sub; // Remove user identifier
      claims.anonymous = true;
    }

    // Sign certificate
    const certificate = jwt.sign(claims, this.jwtSecret, {
      keyid: this.keyId,
      algorithm: 'HS256'
    });

    // Store certificate record
    const certId = this.generateId();
    this.db.prepare(`
      INSERT INTO trust_certificates 
      (id, user_id, certificate_data, trust_score, tier, issued_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run([
      certId,
      userId,
      certificate,
      user.trust_score,
      claims.trust.tier,
      new Date(claims.iat * 1000),
      new Date(claims.exp * 1000)
    ]);

    return {
      certificateId: certId,
      certificate,
      trustScore: user.trust_score,
      tier: claims.trust.tier,
      expiresAt: new Date(claims.exp * 1000),
      shareUrl: `${this.issuer}/verify/${certId}`
    };
  }

  async verifyCertificate(certificate) {
    try {
      // Verify JWT signature and decode
      const decoded = jwt.verify(certificate, this.jwtSecret);
      
      // Basic validation
      if (decoded.iss !== this.issuer) {
        return { valid: false, error: 'Invalid issuer' };
      }

      // Check if revoked (future feature)
      // const revoked = await this.checkRevocation(certificate);
      
      return {
        valid: true,
        claims: decoded,
        trustScore: decoded.trust.score,
        tier: decoded.trust.tier,
        verifiedAt: new Date()
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  // ===== TRUST TIER CALCULATION =====
  
  getTier(trustScore) {
    if (trustScore >= 70) return 'premium';
    if (trustScore >= 50) return 'standard';
    return 'basic';
  }

  getTierBenefits(tier) {
    const tiers = {
      basic: {
        features: ['basic_ai', 'limited_agents'],
        exportLimit: 5,
        validityDays: 7
      },
      standard: {
        features: ['gpt-3.5', 'basic_agents', 'marketplace'],
        exportLimit: 50,
        validityDays: 30
      },
      premium: {
        features: ['gpt-4', 'advanced_agents', 'priority_support'],
        exportLimit: 500,
        validityDays: 90
      }
    };
    return tiers[tier] || tiers.basic;
  }

  // ===== PARTNER VERIFICATION =====
  
  async registerPartner(partnerData) {
    // Simple partner registration for MVP
    const partnerId = this.generateId();
    const apiKey = this.generateApiKey();
    
    this.db.prepare(`
      INSERT INTO federation_partners 
      (id, name, domain, webhook_url, api_key_hash, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run([
      partnerId,
      partnerData.name,
      partnerData.domain,
      partnerData.webhookUrl,
      this.hashApiKey(apiKey),
      'pending'
    ]);

    return {
      partnerId,
      apiKey, // Return once, then hash
      status: 'pending',
      verificationUrl: `${this.issuer}/partners/${partnerId}/verify`
    };
  }

  async verifyPartnerRequest(apiKey, certificate) {
    // Verify partner API key
    const partners = this.db.prepare(`
      SELECT * FROM federation_partners WHERE status = 'active'
    `).all();

    const validPartner = partners.find(p => 
      this.verifyApiKey(apiKey, p.api_key_hash)
    );

    if (!validPartner) {
      return { valid: false, error: 'Invalid partner credentials' };
    }

    // Verify the certificate
    const verification = await this.verifyCertificate(certificate);
    
    if (verification.valid) {
      // Log successful verification
      this.logVerification(validPartner.id, verification.claims.trust.score);
    }

    return {
      ...verification,
      partner: validPartner.name,
      verifiedBy: 'Soulfra Trust Federation'
    };
  }

  // ===== DATABASE SETUP =====
  
  initializeDatabase() {
    // Add federation tables to existing Soulfra database
    this.db.exec(`
      -- Trust certificates
      CREATE TABLE IF NOT EXISTS trust_certificates (
        id TEXT PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        certificate_data TEXT NOT NULL,
        trust_score INTEGER NOT NULL,
        tier TEXT NOT NULL,
        issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        usage_count INTEGER DEFAULT 0,
        revoked BOOLEAN DEFAULT FALSE
      );

      -- Federation partners
      CREATE TABLE IF NOT EXISTS federation_partners (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        domain TEXT UNIQUE NOT NULL,
        webhook_url TEXT,
        api_key_hash TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_verification TIMESTAMP
      );

      -- Verification events (analytics)
      CREATE TABLE IF NOT EXISTS federation_events (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        partner_id TEXT,
        user_id INTEGER,
        trust_score INTEGER,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSON
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_certificates_user ON trust_certificates(user_id);
      CREATE INDEX IF NOT EXISTS idx_certificates_expires ON trust_certificates(expires_at);
      CREATE INDEX IF NOT EXISTS idx_events_timestamp ON federation_events(timestamp);
    `);
  }

  // ===== UTILITY FUNCTIONS =====
  
  generateId() {
    return crypto.randomBytes(16).toString('hex');
  }

  generateApiKey() {
    return 'sf_' + crypto.randomBytes(32).toString('hex');
  }

  hashApiKey(apiKey) {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  verifyApiKey(apiKey, hash) {
    return this.hashApiKey(apiKey) === hash;
  }

  logVerification(partnerId, trustScore) {
    this.db.prepare(`
      INSERT INTO federation_events 
      (id, event_type, partner_id, trust_score, metadata)
      VALUES (?, ?, ?, ?, ?)
    `).run([
      this.generateId(),
      'verification',
      partnerId,
      trustScore,
      JSON.stringify({ timestamp: Date.now() })
    ]);
  }
}

module.exports = TrustFederation;