/**
 * Billion Dollar Game - Authentication Manager
 * Integrates with Soulfra tier system for secure authentication
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Import tier system modules
const { validateQR } = require('../../../qr-validator');
const { injectTraceToken } = require('../../../infinity-router');

class AuthManager {
  constructor() {
    this.sessions = new Map();
    this.trustTokens = new Map();
    this.config = {
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      tokenRotation: 60 * 60 * 1000, // 1 hour
      maxSessions: 10000,
      maxFailedAttempts: 5
    };
    this.failedAttempts = new Map();
  }
  
  /**
   * Initialize authentication system
   */
  async initialize() {
    console.log('[AuthManager] Initializing authentication system...');
    
    // Load existing sessions if any
    await this.loadSessions();
    
    // Start session cleanup timer
    this.startSessionCleanup();
    
    // Verify tier system integration
    await this.verifyTierIntegration();
    
    console.log('[AuthManager] Authentication system initialized');
  }
  
  /**
   * Verify integration with tier system
   */
  async verifyTierIntegration() {
    try {
      // Check if tier -9 modules are available
      if (typeof validateQR !== 'function') {
        throw new Error('QR validator not available');
      }
      
      if (typeof injectTraceToken !== 'function') {
        throw new Error('Trace token injector not available');
      }
      
      // Check for blessing.json
      const blessingPath = path.join(__dirname, '../../../blessing.json');
      if (fs.existsSync(blessingPath)) {
        this.blessing = JSON.parse(fs.readFileSync(blessingPath, 'utf8'));
        console.log('[AuthManager] Blessing status:', this.blessing.status);
      }
      
      // Check for soul-chain.sig
      const soulChainPath = path.join(__dirname, '../../../soul-chain.sig');
      if (fs.existsSync(soulChainPath)) {
        this.soulChainSig = fs.readFileSync(soulChainPath, 'utf8').trim();
        console.log('[AuthManager] Soul chain signature loaded');
      }
      
      console.log('[AuthManager] Tier system integration verified');
    } catch (error) {
      console.error('[AuthManager] Tier integration error:', error.message);
    }
  }
  
  /**
   * Authenticate with QR code
   */
  async authenticateQR(qrCode, clientInfo) {
    console.log(`[AuthManager] QR authentication attempt: ${qrCode}`);
    
    // Check failed attempts
    const failedKey = clientInfo.ipAddress;
    const attempts = this.failedAttempts.get(failedKey) || 0;
    if (attempts >= this.config.maxFailedAttempts) {
      throw new Error('Too many failed attempts. Please try again later.');
    }
    
    try {
      // Validate QR code through tier -9
      const isValid = await validateQR(qrCode);
      
      if (!isValid) {
        this.failedAttempts.set(failedKey, attempts + 1);
        throw new Error('Invalid QR code');
      }
      
      // Generate trace token through tier -9
      const traceToken = await injectTraceToken(qrCode);
      
      // Create game session
      const session = await this.createSession({
        qrCode,
        traceToken,
        clientInfo,
        type: 'human'
      });
      
      // Reset failed attempts
      this.failedAttempts.delete(failedKey);
      
      console.log(`[AuthManager] QR authentication successful: ${session.sessionId}`);
      return session;
      
    } catch (error) {
      console.error('[AuthManager] QR authentication failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Authenticate AI agent
   */
  async authenticateAgent(agentId, agentCredentials) {
    console.log(`[AuthManager] Agent authentication attempt: ${agentId}`);
    
    try {
      // Verify blessing status
      if (!this.blessing || this.blessing.status !== 'blessed') {
        throw new Error('Agent not blessed');
      }
      
      // Verify propagation permission
      if (!this.blessing.can_propagate) {
        throw new Error('Agent cannot propagate');
      }
      
      // Verify soul chain signature
      if (!this.verifySoulChain(agentCredentials.signature)) {
        throw new Error('Invalid soul chain signature');
      }
      
      // Create agent session
      const session = await this.createSession({
        agentId,
        agentCredentials,
        type: 'agent',
        blessed: true
      });
      
      console.log(`[AuthManager] Agent authentication successful: ${session.sessionId}`);
      return session;
      
    } catch (error) {
      console.error('[AuthManager] Agent authentication failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Create a new session
   */
  async createSession(data) {
    const sessionId = this.generateSessionId();
    const token = this.generateToken();
    
    const session = {
      sessionId,
      playerId: data.qrCode || data.agentId,
      playerType: data.type,
      token,
      trustToken: data.traceToken,
      created: Date.now(),
      lastActive: Date.now(),
      metadata: {
        qrCode: data.qrCode,
        agentId: data.agentId,
        blessed: data.blessed || false,
        clientInfo: data.clientInfo
      }
    };
    
    // Store session
    this.sessions.set(sessionId, session);
    this.trustTokens.set(token, sessionId);
    
    // Save sessions
    await this.saveSessions();
    
    return {
      sessionId,
      token,
      playerId: session.playerId,
      playerType: session.playerType,
      expiresIn: this.config.sessionTimeout
    };
  }
  
  /**
   * Verify session token
   */
  verifyToken(token) {
    const sessionId = this.trustTokens.get(token);
    if (!sessionId) {
      return null;
    }
    
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }
    
    // Check if session expired
    if (Date.now() - session.created > this.config.sessionTimeout) {
      this.destroySession(sessionId);
      return null;
    }
    
    // Update last active
    session.lastActive = Date.now();
    
    return session;
  }
  
  /**
   * Get session by ID
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }
  
  /**
   * Refresh session token
   */
  async refreshToken(oldToken) {
    const session = this.verifyToken(oldToken);
    if (!session) {
      throw new Error('Invalid or expired token');
    }
    
    // Generate new token
    const newToken = this.generateToken();
    
    // Remove old token
    this.trustTokens.delete(oldToken);
    
    // Add new token
    this.trustTokens.set(newToken, session.sessionId);
    session.token = newToken;
    session.lastActive = Date.now();
    
    // Save sessions
    await this.saveSessions();
    
    return {
      token: newToken,
      expiresIn: this.config.sessionTimeout
    };
  }
  
  /**
   * Destroy session
   */
  async destroySession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.trustTokens.delete(session.token);
      this.sessions.delete(sessionId);
      await this.saveSessions();
    }
  }
  
  /**
   * Verify soul chain signature
   */
  verifySoulChain(signature) {
    if (!this.soulChainSig) {
      return false;
    }
    
    // Simple verification - in production would use proper crypto
    return signature === this.soulChainSig;
  }
  
  /**
   * Generate session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
  }
  
  /**
   * Generate secure token
   */
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }
  
  /**
   * Start session cleanup timer
   */
  startSessionCleanup() {
    setInterval(() => {
      const now = Date.now();
      const expired = [];
      
      this.sessions.forEach((session, sessionId) => {
        if (now - session.created > this.config.sessionTimeout) {
          expired.push(sessionId);
        }
      });
      
      expired.forEach(sessionId => {
        this.destroySession(sessionId);
      });
      
      if (expired.length > 0) {
        console.log(`[AuthManager] Cleaned up ${expired.length} expired sessions`);
      }
    }, 60000); // Check every minute
  }
  
  /**
   * Save sessions to disk
   */
  async saveSessions() {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const sessionsFile = path.join(dataDir, 'sessions.json');
    const data = {
      sessions: Array.from(this.sessions.entries()),
      trustTokens: Array.from(this.trustTokens.entries())
    };
    
    try {
      await fs.promises.writeFile(sessionsFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('[AuthManager] Failed to save sessions:', error);
    }
  }
  
  /**
   * Load sessions from disk
   */
  async loadSessions() {
    const sessionsFile = path.join(__dirname, '../data/sessions.json');
    
    try {
      const data = await fs.promises.readFile(sessionsFile, 'utf8');
      const parsed = JSON.parse(data);
      
      this.sessions = new Map(parsed.sessions);
      this.trustTokens = new Map(parsed.trustTokens);
      
      console.log(`[AuthManager] Loaded ${this.sessions.size} sessions`);
    } catch (error) {
      console.log('[AuthManager] No saved sessions found');
    }
  }
  
  /**
   * Get authentication statistics
   */
  getStats() {
    const humanSessions = Array.from(this.sessions.values()).filter(s => s.playerType === 'human').length;
    const agentSessions = Array.from(this.sessions.values()).filter(s => s.playerType === 'agent').length;
    
    return {
      totalSessions: this.sessions.size,
      humanSessions,
      agentSessions,
      failedAttempts: this.failedAttempts.size,
      uptime: Date.now() - (this.startTime || Date.now())
    };
  }
}

module.exports = AuthManager;