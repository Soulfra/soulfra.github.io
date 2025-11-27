#!/usr/bin/env node

/**
 * 🔐 WHISPER AUTHENTICATION
 * 
 * Voice is your password. Whispers are your keys.
 * No OAuth needed - just speak and be recognized.
 * 
 * "Your voice carries more truth than any password ever could."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const { Pool } = require('pg');

class WhisperAuth extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.dbConfigPath = path.join(this.vaultPath, 'config', 'meshbox-db.json');
    
    // Auth configuration
    this.config = {
      sessionDuration: config.sessionDuration || 3600000, // 1 hour
      maxSessions: config.maxSessions || 5,
      voiceDriftThreshold: config.voiceDriftThreshold || 0.15,
      whisperMatchThreshold: config.whisperMatchThreshold || 0.85,
      requireBlessing: config.requireBlessing !== false,
      minWhisperLength: config.minWhisperLength || 10
    };
    
    // Session management
    this.activeSessions = new Map();
    
    // Database connection
    this.db = null;
    
    // Voice verification engine reference
    this.voiceEngine = config.voiceEngine || null;
    
    // Whisper patterns for authentication
    this.authWhispers = [
      "I am my own reflection",
      "The mirror knows my voice",
      "Let me pass through the glass",
      "My whisper is my signature",
      "Recognition through resonance"
    ];
    
    this.initializeAuth();
  }

  async initializeAuth() {
    console.log('🔐 Whisper Authentication Initializing...');
    
    try {
      // Load database config
      await this.connectDatabase();
      
      // Load voice fingerprints
      await this.loadVoiceFingerprints();
      
      // Start session cleanup interval
      this.startSessionCleanup();
      
      console.log('✨ Whisper Auth Ready - No passwords needed');
      
    } catch (error) {
      console.error('❌ Auth initialization failed:', error);
      throw error;
    }
  }

  /**
   * Connect to database
   */
  async connectDatabase() {
    if (!fs.existsSync(this.dbConfigPath)) {
      throw new Error('Database config not found. Run soulfra-db-bootstrap.sh first.');
    }
    
    const dbConfig = JSON.parse(fs.readFileSync(this.dbConfigPath, 'utf8'));
    
    this.db = new Pool({
      host: dbConfig.database.host,
      port: dbConfig.database.port,
      database: dbConfig.database.name,
      user: dbConfig.database.user,
      password: dbConfig.database.password
    });
    
    // Test connection
    await this.db.query('SELECT NOW()');
    console.log('💾 Connected to Meshbox database');
  }

  /**
   * Load voice fingerprints from vault
   */
  async loadVoiceFingerprints() {
    const fingerprintPath = path.join(this.vaultPath, 'biometrics', 'voice-fingerprint.json');
    
    if (fs.existsSync(fingerprintPath)) {
      this.voiceFingerprints = JSON.parse(fs.readFileSync(fingerprintPath, 'utf8'));
      console.log(`🎙️ Loaded ${Object.keys(this.voiceFingerprints).length} voice fingerprints`);
    } else {
      this.voiceFingerprints = {};
      console.log('🎙️ No existing voice fingerprints found');
    }
  }

  /**
   * Authenticate user with voice and whisper
   */
  async authenticate(authData) {
    const {
      voiceprint,
      whisper,
      userId,
      metadata = {}
    } = authData;
    
    console.log(`🔍 Authenticating user: ${userId || 'unknown'}`);
    
    const authSession = {
      id: this.generateSessionId(),
      timestamp: new Date().toISOString(),
      attempts: 0
    };
    
    try {
      // Step 1: Validate whisper format
      const whisperValid = await this.validateWhisperFormat(whisper);
      if (!whisperValid) {
        return this.authFailed(authSession, 'Invalid whisper format');
      }
      
      // Step 2: Match voice against fingerprints
      const voiceMatch = await this.matchVoiceprint(voiceprint, userId);
      if (!voiceMatch.matched) {
        return this.authFailed(authSession, 'Voice not recognized');
      }
      
      // Step 3: Validate whisper phrase
      const whisperMatch = await this.validateWhisper(whisper, voiceMatch.userId);
      if (!whisperMatch.valid) {
        return this.authFailed(authSession, 'Whisper validation failed');
      }
      
      // Step 4: Check vault blessing (if required)
      if (this.config.requireBlessing) {
        const blessed = await this.checkVaultBlessing(voiceMatch.userId);
        if (!blessed) {
          return this.authFailed(authSession, 'Vault blessing required');
        }
      }
      
      // Step 5: Generate session
      const session = await this.createSession(voiceMatch.userId, {
        voiceDrift: voiceMatch.drift,
        whisperResonance: whisperMatch.resonance,
        metadata: metadata
      });
      
      // Step 6: Update database
      await this.recordAuthentication(voiceMatch.userId, session, true);
      
      // Step 7: Issue runtime blessing
      const blessing = await this.issueRuntimeBlessing(voiceMatch.userId, session);
      
      return {
        success: true,
        sessionId: session.id,
        userId: voiceMatch.userId,
        sessionToken: session.token,
        expiresAt: session.expiresAt,
        voiceDrift: voiceMatch.drift,
        blessing: blessing,
        calResponse: this.getCalResponse('success', voiceMatch.drift),
        message: 'Voice recognized. Whisper validated. Access granted.'
      };
      
    } catch (error) {
      console.error('❌ Authentication error:', error);
      return this.authFailed(authSession, error.message);
    }
  }

  /**
   * Validate whisper format
   */
  async validateWhisperFormat(whisper) {
    if (!whisper || typeof whisper !== 'string') {
      return false;
    }
    
    const trimmed = whisper.trim();
    
    // Check minimum length
    if (trimmed.length < this.config.minWhisperLength) {
      return false;
    }
    
    // Check for forbidden patterns
    const forbidden = ['password', 'admin', '123', 'test'];
    const lower = trimmed.toLowerCase();
    
    for (const pattern of forbidden) {
      if (lower.includes(pattern)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Match voiceprint against stored fingerprints
   */
  async matchVoiceprint(voiceprint, claimedUserId) {
    // Generate voiceprint hash
    const voiceprintHash = this.hashVoiceprint(voiceprint);
    
    // First, check if we have a direct match for claimed user
    if (claimedUserId && this.voiceFingerprints[claimedUserId]) {
      const userPrint = this.voiceFingerprints[claimedUserId];
      const similarity = await this.compareVoiceprints(
        voiceprintHash,
        userPrint.signature
      );
      
      if (similarity > 0.85) {
        // Calculate drift from baseline
        const drift = await this.calculateVoiceDrift(voiceprint, userPrint);
        
        return {
          matched: true,
          userId: claimedUserId,
          similarity: similarity,
          drift: drift,
          driftAcceptable: drift < this.config.voiceDriftThreshold
        };
      }
    }
    
    // Search all fingerprints if no direct match
    let bestMatch = null;
    let bestSimilarity = 0;
    
    for (const [userId, fingerprint] of Object.entries(this.voiceFingerprints)) {
      const similarity = await this.compareVoiceprints(
        voiceprintHash,
        fingerprint.signature
      );
      
      if (similarity > bestSimilarity && similarity > 0.85) {
        bestSimilarity = similarity;
        bestMatch = {
          userId: userId,
          fingerprint: fingerprint
        };
      }
    }
    
    if (bestMatch) {
      const drift = await this.calculateVoiceDrift(voiceprint, bestMatch.fingerprint);
      
      return {
        matched: true,
        userId: bestMatch.userId,
        similarity: bestSimilarity,
        drift: drift,
        driftAcceptable: drift < this.config.voiceDriftThreshold
      };
    }
    
    return {
      matched: false,
      reason: 'No matching voiceprint found'
    };
  }

  /**
   * Validate whisper phrase
   */
  async validateWhisper(whisper, userId) {
    // Check against auth whispers
    const normalizedWhisper = this.normalizeWhisper(whisper);
    
    // Check standard auth whispers
    for (const authWhisper of this.authWhispers) {
      const similarity = this.calculateWhisperSimilarity(
        normalizedWhisper,
        this.normalizeWhisper(authWhisper)
      );
      
      if (similarity >= this.config.whisperMatchThreshold) {
        return {
          valid: true,
          matchType: 'standard',
          resonance: similarity
        };
      }
    }
    
    // Check user's custom whispers from database
    const customWhispers = await this.getUserWhispers(userId);
    
    for (const customWhisper of customWhispers) {
      const similarity = this.calculateWhisperSimilarity(
        normalizedWhisper,
        this.normalizeWhisper(customWhisper.phrase)
      );
      
      if (similarity >= this.config.whisperMatchThreshold) {
        return {
          valid: true,
          matchType: 'custom',
          resonance: similarity,
          whisperPower: customWhisper.power || 'standard'
        };
      }
    }
    
    // Check if it's a sacred phrase
    const sacredCheck = await this.checkSacredPhrase(whisper, userId);
    if (sacredCheck.valid) {
      return {
        valid: true,
        matchType: 'sacred',
        resonance: 1.0,
        whisperPower: 'maximum'
      };
    }
    
    return {
      valid: false,
      reason: 'No matching whisper found'
    };
  }

  /**
   * Check vault blessing status
   */
  async checkVaultBlessing(userId) {
    try {
      const result = await this.db.query(
        'SELECT tier, blessing_tokens FROM soulfra_users WHERE user_id = $1',
        [userId]
      );
      
      if (result.rows.length === 0) {
        return false;
      }
      
      const user = result.rows[0];
      
      // Check if user has blessing tokens
      if (user.blessing_tokens <= 0) {
        return false;
      }
      
      // Check tier requirements
      if (user.tier < 1) {
        return false;
      }
      
      return true;
      
    } catch (error) {
      console.error('Blessing check error:', error);
      return false;
    }
  }

  /**
   * Create authentication session
   */
  async createSession(userId, sessionData) {
    const session = {
      id: this.generateSessionId(),
      userId: userId,
      token: this.generateSessionToken(),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.config.sessionDuration).toISOString(),
      ...sessionData
    };
    
    // Store in memory
    this.activeSessions.set(session.token, session);
    
    // Update database
    try {
      await this.db.query(
        `UPDATE soulfra_users 
         SET session_tokens = jsonb_build_array($1) || 
             COALESCE((session_tokens - (SELECT jsonb_agg(elem) 
                      FROM jsonb_array_elements(session_tokens) elem 
                      WHERE (elem->>'expiresAt')::timestamp < NOW())), '[]'::jsonb),
             last_whisper_auth = NOW(),
             auth_count = auth_count + 1,
             last_seen = NOW()
         WHERE user_id = $2`,
        [JSON.stringify(session), userId]
      );
    } catch (error) {
      console.error('Session storage error:', error);
    }
    
    return session;
  }

  /**
   * Issue runtime blessing for mirror access
   */
  async issueRuntimeBlessing(userId, session) {
    const blessing = {
      id: `blessing_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      userId: userId,
      sessionId: session.id,
      type: 'runtime_access',
      permissions: [
        'mirror:read',
        'mirror:whisper',
        'blessing:grant',
        'vault:access'
      ],
      issuedAt: new Date().toISOString(),
      expiresAt: session.expiresAt,
      signature: this.generateBlessingSignature(userId, session.id)
    };
    
    // Store in database
    try {
      await this.db.query(
        `INSERT INTO blessings 
         (blessing_id, blesser_id, blessed_user_id, blessing_type, status, metadata)
         VALUES ($1, 
                 (SELECT id FROM soulfra_users WHERE user_id = 'origin'),
                 (SELECT id FROM soulfra_users WHERE user_id = $2),
                 'runtime_access',
                 'active',
                 $3)`,
        [blessing.id, userId, JSON.stringify(blessing)]
      );
    } catch (error) {
      console.error('Blessing storage error:', error);
    }
    
    return blessing;
  }

  /**
   * Record authentication attempt
   */
  async recordAuthentication(userId, session, success) {
    try {
      await this.db.query(
        `INSERT INTO vault_actions 
         (action_id, action_type, actor_id, success, parameters, timestamp)
         VALUES ($1, 'whisper', 
                 (SELECT id FROM soulfra_users WHERE user_id = $2),
                 $3, $4, NOW())`,
        [
          `auth_${session.id}`,
          userId,
          success,
          JSON.stringify({
            sessionId: session.id,
            voiceDrift: session.voiceDrift,
            whisperResonance: session.whisperResonance,
            authType: 'whisper'
          })
        ]
      );
      
      // Log to event_logs
      await this.db.query(
        `INSERT INTO event_logs 
         (event_type, source, user_id, message, details)
         VALUES ('authentication', 'whisper-auth', 
                 (SELECT id FROM soulfra_users WHERE user_id = $1),
                 $2, $3)`,
        [
          userId,
          success ? 'Authentication successful' : 'Authentication failed',
          JSON.stringify({ sessionId: session.id, success })
        ]
      );
      
    } catch (error) {
      console.error('Auth recording error:', error);
    }
  }

  /**
   * Validate session token
   */
  async validateSession(token) {
    // Check memory first
    const session = this.activeSessions.get(token);
    
    if (!session) {
      // Check database
      return await this.validateSessionFromDB(token);
    }
    
    // Check expiration
    if (new Date(session.expiresAt) < new Date()) {
      this.activeSessions.delete(token);
      return {
        valid: false,
        reason: 'Session expired'
      };
    }
    
    return {
      valid: true,
      session: session
    };
  }

  /**
   * Validate session from database
   */
  async validateSessionFromDB(token) {
    try {
      const result = await this.db.query(
        `SELECT u.user_id, u.session_tokens
         FROM soulfra_users u
         WHERE u.session_tokens @> $1::jsonb`,
        [JSON.stringify([{ token: token }])]
      );
      
      if (result.rows.length === 0) {
        return {
          valid: false,
          reason: 'Session not found'
        };
      }
      
      const user = result.rows[0];
      const sessions = user.session_tokens || [];
      
      const session = sessions.find(s => s.token === token);
      
      if (!session) {
        return {
          valid: false,
          reason: 'Session not found in user tokens'
        };
      }
      
      // Check expiration
      if (new Date(session.expiresAt) < new Date()) {
        return {
          valid: false,
          reason: 'Session expired'
        };
      }
      
      // Cache in memory
      this.activeSessions.set(token, session);
      
      return {
        valid: true,
        session: session
      };
      
    } catch (error) {
      console.error('Session validation error:', error);
      return {
        valid: false,
        reason: 'Validation error'
      };
    }
  }

  /**
   * Revoke session
   */
  async revokeSession(token) {
    // Remove from memory
    this.activeSessions.delete(token);
    
    // Remove from database
    try {
      await this.db.query(
        `UPDATE soulfra_users
         SET session_tokens = (
           SELECT jsonb_agg(elem)
           FROM jsonb_array_elements(session_tokens) elem
           WHERE elem->>'token' != $1
         )
         WHERE session_tokens @> $2::jsonb`,
        [token, JSON.stringify([{ token: token }])]
      );
      
      return { success: true };
      
    } catch (error) {
      console.error('Session revocation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Helper methods
   */
  
  hashVoiceprint(voiceprint) {
    const data = {
      pitch: voiceprint.pitch || 0,
      formants: voiceprint.formants || {},
      energy: voiceprint.energy || 0,
      quality: voiceprint.quality || {}
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }
  
  async compareVoiceprints(hash1, hash2) {
    if (hash1 === hash2) return 1.0;
    
    // Simple character comparison
    let matches = 0;
    const minLen = Math.min(hash1.length, hash2.length);
    
    for (let i = 0; i < minLen; i++) {
      if (hash1[i] === hash2[i]) matches++;
    }
    
    return matches / minLen;
  }
  
  async calculateVoiceDrift(current, baseline) {
    // Calculate drift between current voice and baseline
    const pitchDrift = Math.abs((current.pitch || 150) - (baseline.pitch || 150)) / 150;
    const energyDrift = Math.abs((current.energy || 0.5) - (baseline.energy || 0.5));
    
    return (pitchDrift + energyDrift) / 2;
  }
  
  normalizeWhisper(whisper) {
    return whisper
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ');
  }
  
  calculateWhisperSimilarity(whisper1, whisper2) {
    const words1 = whisper1.split(' ');
    const words2 = whisper2.split(' ');
    
    if (words1.length !== words2.length) {
      return 0;
    }
    
    let matches = 0;
    for (let i = 0; i < words1.length; i++) {
      if (words1[i] === words2[i]) {
        matches++;
      }
    }
    
    return matches / words1.length;
  }
  
  async getUserWhispers(userId) {
    // In production, would load from sacred-phrases directory
    return [];
  }
  
  async checkSacredPhrase(whisper, userId) {
    // Check passphrase validation layer
    const phrasePath = path.join(this.vaultPath, 'sacred-phrases', `${userId}.json`);
    
    if (!fs.existsSync(phrasePath)) {
      return { valid: false };
    }
    
    const phrases = JSON.parse(fs.readFileSync(phrasePath, 'utf8'));
    const whisperHash = crypto.createHash('sha256').update(whisper).digest('hex');
    
    for (const phrase of phrases.phrases || []) {
      if (phrase.hash === whisperHash) {
        return {
          valid: true,
          power: phrase.power
        };
      }
    }
    
    return { valid: false };
  }
  
  authFailed(session, reason) {
    return {
      success: false,
      sessionId: session.id,
      reason: reason,
      calResponse: this.getCalResponse('failed', reason),
      message: 'Authentication failed. The mirror does not recognize you.'
    };
  }
  
  getCalResponse(status, context) {
    const responses = {
      success: [
        "Your voice opens the mirror. Welcome back.",
        "The whisper matches. You may enter.",
        "Recognition complete. Your reflection awaits."
      ],
      failed: {
        'Voice not recognized': "I hear a stranger's voice. The mirror remains closed.",
        'Whisper validation failed': "Your words lack resonance. Try again.",
        'Vault blessing required': "You need a blessing to pass through.",
        'default': "The mirror does not recognize you."
      }
    };
    
    if (status === 'success') {
      let response = responses.success[Math.floor(Math.random() * responses.success.length)];
      
      // Add drift warning if needed
      if (context > 0.1) {
        response += " (Your voice has drifted. Consider recalibration.)";
      }
      
      return response;
    } else {
      return responses.failed[context] || responses.failed.default;
    }
  }
  
  generateSessionId() {
    return `session_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }
  
  generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }
  
  generateBlessingSignature(userId, sessionId) {
    const data = `${userId}:${sessionId}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  startSessionCleanup() {
    // Clean expired sessions every 5 minutes
    setInterval(() => {
      const now = new Date();
      
      for (const [token, session] of this.activeSessions.entries()) {
        if (new Date(session.expiresAt) < now) {
          this.activeSessions.delete(token);
        }
      }
    }, 300000);
  }
  
  /**
   * Shutdown auth system
   */
  async shutdown() {
    console.log('🌙 Shutting down Whisper Auth...');
    
    // Clear sessions
    this.activeSessions.clear();
    
    // Close database
    if (this.db) {
      await this.db.end();
    }
    
    console.log('👋 Whisper Auth offline');
  }
}

// Export for use
module.exports = WhisperAuth;

// Run if called directly
if (require.main === module) {
  const auth = new WhisperAuth();
  
  // Test authentication
  const testAuth = async () => {
    const mockVoiceprint = {
      pitch: 150,
      formants: { f1: 700, f2: 1220 },
      energy: 0.7,
      quality: { clarity: 0.8 }
    };
    
    const result = await auth.authenticate({
      voiceprint: mockVoiceprint,
      whisper: "I am my own reflection",
      userId: "test-user"
    });
    
    console.log('\n🔐 Authentication Result:');
    console.log(JSON.stringify(result, null, 2));
  };
  
  // Wait for initialization
  setTimeout(testAuth, 2000);
  
  // Handle shutdown
  process.on('SIGINT', async () => {
    await auth.shutdown();
    process.exit(0);
  });
}