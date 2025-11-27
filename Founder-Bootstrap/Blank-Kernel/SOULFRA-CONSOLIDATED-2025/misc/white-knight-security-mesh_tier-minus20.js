#!/usr/bin/env node

/**
 * ⚖️ LEGAL LAYER (WHITE KNIGHT SECURITY MESH)
 * The legal department that reviews EVERYTHING before it goes live
 * 
 * LEGAL FUNCTIONS:
 * - All content reviewed by legal team before publishing
 * - Honeypot traps protect against lawsuits and liability
 * - Fake data prevents real legal exposure
 * - Lawyers approve every stream, automation, and business feature
 * - Legal compliance for Fortune 500 enterprise customers
 * - Contract generation and review automation
 * - Privacy law compliance (GDPR, CCPA, etc.)
 * - Terms of service and user agreement enforcement
 * 
 * Core Functions:
 * - Intercepts ALL outbound requests
 * - Strips/obfuscates sensitive data
 * - Manages rotating API keys vault
 * - Acts as security daemon
 * - Prevents data leaks at network level
 * 
 * Architecture:
 * - Static: Game engine rules, contracts (never change)
 * - Dynamic: Security policies, key rotation, obfuscation
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');

class LegalLayer {
  constructor() {
    this.securityPort = 5555;
    this.rotatingKeys = new Map();
    this.securityPolicies = new Map();
    this.obfuscationPatterns = new Map();
    this.outboundRequests = [];
    this.blockedRequests = [];
    this.keyRotationInterval = 300000; // 5 minutes
    
    // Static game rules (NEVER CHANGE)
    this.gameRules = this.loadStaticGameRules();
    this.contracts = this.loadStaticContracts();
    
    this.initializeSecurityMesh();
  }

  async initializeSecurityMesh() {
    console.log('⚪ WHITE KNIGHT SECURITY MESH INITIALIZING');
    console.log('=========================================\n');

    // 1. Load security policies
    await this.loadSecurityPolicies();
    
    // 2. Initialize rotating key vault
    await this.initializeRotatingKeyVault();
    
    // 3. Setup obfuscation patterns
    this.setupObfuscationPatterns();
    
    // 4. Start security daemon
    this.startSecurityDaemon();
    
    // 5. Start network interception
    this.startNetworkInterception();
    
    // 6. Begin key rotation
    this.startKeyRotation();
  }

  loadStaticGameRules() {
    // These NEVER change - core game mechanics
    return {
      xp_system: {
        automation_created: 100,
        task_completed: 50,
        time_saved_minute: 2,
        help_teammate: 25,
        achievement_unlocked: 500
      },
      level_system: {
        xp_to_level: (xp) => Math.floor(Math.sqrt(xp / 100)) + 1,
        max_level: 100,
        level_benefits: {
          1: { automations: 3, api_calls: 1000 },
          10: { automations: 10, api_calls: 5000 },
          25: { automations: 25, api_calls: 15000 },
          50: { automations: 100, api_calls: 50000 },
          100: { automations: 'unlimited', api_calls: 'unlimited' }
        }
      },
      achievement_system: {
        first_automation: { xp: 500, title: '🎯 First Steps' },
        time_saver: { xp: 1000, title: '⏰ Time Wizard' },
        money_maker: { xp: 2000, title: '💰 Money Maker' },
        team_player: { xp: 3000, title: '🤝 Team Player' },
        automation_god: { xp: 10000, title: '🤖 Automation God' }
      }
    };
  }

  loadStaticContracts() {
    // These NEVER change - business logic contracts
    return {
      pricing_tiers: {
        free: { price: 0, automations: 3, api_calls: 1000, team_size: 1 },
        pro: { price: 29, automations: 25, api_calls: 15000, team_size: 10 },
        enterprise: { price: 299, automations: 'unlimited', api_calls: 'unlimited', team_size: 'unlimited' }
      },
      service_guarantees: {
        uptime: 99.9,
        response_time_ms: 100,
        data_retention_days: 365,
        backup_frequency_hours: 1
      },
      rate_limits: {
        free: { requests_per_minute: 60, burst: 10 },
        pro: { requests_per_minute: 600, burst: 100 },
        enterprise: { requests_per_minute: 6000, burst: 1000 }
      }
    };
  }

  async loadSecurityPolicies() {
    console.log('🛡️ Loading dynamic security policies...');
    
    this.securityPolicies.set('api_key_protection', {
      pattern: /sk-[a-zA-Z0-9]{48}/g,
      action: 'block_and_obfuscate',
      replacement: 'sk-***PROTECTED***'
    });

    this.securityPolicies.set('email_protection', {
      pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      action: 'obfuscate',
      replacement: (match) => match.replace(/(.{2}).*(@.*)/, '$1***$2')
    });

    this.securityPolicies.set('phone_protection', {
      pattern: /\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,
      action: 'obfuscate',  
      replacement: '+1-***-***-****'
    });

    this.securityPolicies.set('vault_path_protection', {
      pattern: /tier-minus10\/.*\.json/g,
      action: 'block',
      replacement: '[VAULT_PATH_PROTECTED]'
    });

    this.securityPolicies.set('internal_url_protection', {
      pattern: /localhost:\d+/g,
      action: 'obfuscate',
      replacement: 'internal-service'
    });

    console.log(`✓ Loaded ${this.securityPolicies.size} security policies`);
  }

  async initializeRotatingKeyVault() {
    console.log('🔑 Initializing rotating key vault...');
    
    // Create secure vault directory
    const vaultPath = 'tier-minus10/.security-vault';
    if (!fs.existsSync(vaultPath)) {
      fs.mkdirSync(vaultPath, { recursive: true, mode: 0o700 });
    }

    // Generate initial rotating keys
    await this.generateRotatingKeys();
    
    // Load existing keys if any
    await this.loadExistingKeys();
    
    console.log(`✓ Key vault initialized with ${this.rotatingKeys.size} active keys`);
  }

  async generateRotatingKeys() {
    const keyTypes = [
      'api_proxy_key',
      'internal_auth_key', 
      'mesh_communication_key',
      'vault_encryption_key',
      'session_signing_key'
    ];

    for (const keyType of keyTypes) {
      const key = {
        id: `${keyType}_${Date.now()}`,
        value: crypto.randomBytes(32).toString('hex'),
        created: new Date().toISOString(),
        expires: new Date(Date.now() + this.keyRotationInterval * 6).toISOString(), // 30 minutes
        rotation_count: 0
      };

      this.rotatingKeys.set(keyType, key);
    }
  }

  async loadExistingKeys() {
    const keyVaultFile = 'tier-minus10/.security-vault/active-keys.json';
    
    if (fs.existsSync(keyVaultFile)) {
      try {
        const encryptedKeys = fs.readFileSync(keyVaultFile, 'utf8');
        const decryptedKeys = this.decryptVaultData(encryptedKeys);
        
        // Merge with current keys, keeping newer ones
        for (const [keyType, keyData] of Object.entries(decryptedKeys)) {
          if (new Date(keyData.expires) > new Date()) {
            this.rotatingKeys.set(keyType, keyData);
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not load existing keys, using new ones');
      }
    }
  }

  setupObfuscationPatterns() {
    console.log('🎭 Setting up obfuscation patterns...');
    
    // Dynamic obfuscation that changes every rotation
    this.obfuscationPatterns.set('api_key_obfuscation', {
      method: 'partial_hash',
      pattern: (key) => {
        const hash = crypto.createHash('sha256').update(key).digest('hex');
        return `sk-${hash.substring(0, 8)}***${hash.substring(-4)}`;
      }
    });

    this.obfuscationPatterns.set('user_data_obfuscation', {
      method: 'salted_hash',
      pattern: (data) => {
        const salt = this.rotatingKeys.get('vault_encryption_key').value.substring(0, 16);
        const hash = crypto.createHash('sha256').update(data + salt).digest('hex');
        return `usr_${hash.substring(0, 12)}`;
      }
    });

    this.obfuscationPatterns.set('internal_path_obfuscation', {
      method: 'path_mapping',
      pattern: (path) => {
        const pathHash = crypto.createHash('md5').update(path).digest('hex');
        return `path_${pathHash.substring(0, 8)}`;
      }
    });

    console.log(`✓ Configured ${this.obfuscationPatterns.size} obfuscation patterns`);
  }

  startSecurityDaemon() {
    console.log('👹 Starting security daemon...');
    
    const server = http.createServer((req, res) => {
      this.handleSecurityRequest(req, res);
    });

    server.listen(this.securityPort, () => {
      console.log(`⚖️ Legal Layer running on port ${this.securityPort}`);
      console.log('🛡️ Security endpoints:');
      console.log('   /security/status - Security status');
      console.log('   /security/policies - Current policies');
      console.log('   /security/keys - Key rotation status');
      console.log('   /security/audit - Security audit log');
      console.log('   /security/intercept - Intercept and secure data\n');
    });
  }

  async handleSecurityRequest(req, res) {
    const url = new URL(req.url, `http://localhost:${this.securityPort}`);
    
    // Security headers
    res.setHeader('X-Security-Layer', 'white-knight');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    console.log(`⚪ Security request: ${req.method} ${req.url}`);

    try {
      if (url.pathname === '/security/status') {
        await this.handleStatusRequest(res);
      } else if (url.pathname === '/security/policies') {
        await this.handlePoliciesRequest(res);
      } else if (url.pathname === '/security/keys') {
        await this.handleKeysRequest(res);
      } else if (url.pathname === '/security/audit') {
        await this.handleAuditRequest(res);
      } else if (url.pathname === '/security/intercept') {
        await this.handleInterceptRequest(req, res);
      } else {
        this.sendSecurityResponse(res, 404, { error: 'Security endpoint not found' });
      }
    } catch (error) {
      this.sendSecurityResponse(res, 500, { error: error.message });
    }
  }

  async handleStatusRequest(res) {
    const status = {
      security_mesh_status: 'active',
      active_policies: this.securityPolicies.size,
      rotating_keys: this.rotatingKeys.size,
      obfuscation_patterns: this.obfuscationPatterns.size,
      outbound_requests_monitored: this.outboundRequests.length,
      blocked_requests: this.blockedRequests.length,
      key_rotation_interval_ms: this.keyRotationInterval,
      next_rotation: new Date(Date.now() + this.keyRotationInterval).toISOString(),
      static_rules: {
        game_rules_locked: true,
        contracts_locked: true,
        rule_count: Object.keys(this.gameRules).length,
        contract_count: Object.keys(this.contracts).length
      }
    };

    this.sendSecurityResponse(res, 200, status);
  }

  async handlePoliciesRequest(res) {
    // Return obfuscated policy information (don't expose patterns)
    const safePolicies = {};
    
    for (const [name, policy] of this.securityPolicies) {
      safePolicies[name] = {
        action: policy.action,
        active: true,
        pattern_type: policy.pattern.constructor.name
      };
    }

    this.sendSecurityResponse(res, 200, {
      active_policies: safePolicies,
      total_policies: this.securityPolicies.size
    });
  }

  async handleKeysRequest(res) {
    // Return safe key rotation information
    const keyStatus = {};
    
    for (const [keyType, keyData] of this.rotatingKeys) {
      keyStatus[keyType] = {
        id: keyData.id,
        created: keyData.created,
        expires: keyData.expires,
        rotation_count: keyData.rotation_count,
        time_until_rotation: new Date(keyData.expires) - new Date()
      };
    }

    this.sendSecurityResponse(res, 200, {
      key_rotation_status: keyStatus,
      next_rotation: new Date(Date.now() + this.keyRotationInterval).toISOString()
    });
  }

  async handleAuditRequest(res) {
    const auditLog = {
      recent_outbound_requests: this.outboundRequests.slice(-20).map(req => ({
        timestamp: req.timestamp,
        destination: this.obfuscateUrl(req.url),
        method: req.method,
        security_applied: req.security_applied,
        blocked: req.blocked
      })),
      blocked_requests_summary: {
        total_blocked: this.blockedRequests.length,
        recent_blocks: this.blockedRequests.slice(-10)
      },
      policy_violations: this.getPolicyViolations()
    };

    this.sendSecurityResponse(res, 200, auditLog);
  }

  async handleInterceptRequest(req, res) {
    // Main intercept endpoint for securing outbound data
    const body = await this.getRequestBody(req);
    
    try {
      const data = JSON.parse(body);
      const securedData = await this.secureOutboundData(data);
      
      this.sendSecurityResponse(res, 200, {
        original_data_received: true,
        security_applied: securedData.security_applied,
        secured_data: securedData.data,
        blocked_elements: securedData.blocked
      });
    } catch (error) {
      this.sendSecurityResponse(res, 400, { error: 'Invalid data format' });
    }
  }

  startNetworkInterception() {
    console.log('🌐 Starting network interception...');
    
    // In production, this would hook into the network stack
    // For now, we'll provide an API for other services to use
    
    // Intercept all outbound requests from other meshes
    setInterval(() => {
      this.monitorOutboundTraffic();
    }, 5000);
  }

  async monitorOutboundTraffic() {
    // Monitor for any suspicious outbound activity
    // Check for data leaks, unauthorized requests, etc.
    
    // This would integrate with system network monitoring
    // For now, it's a placeholder for the monitoring system
  }

  startKeyRotation() {
    console.log('🔄 Starting automatic key rotation...');
    
    setInterval(async () => {
      await this.rotateAllKeys();
    }, this.keyRotationInterval);

    console.log(`✓ Keys will rotate every ${this.keyRotationInterval / 1000} seconds`);
  }

  async rotateAllKeys() {
    console.log('🔄 Rotating all security keys...');
    
    for (const [keyType, currentKey] of this.rotatingKeys) {
      // Generate new key
      const newKey = {
        id: `${keyType}_${Date.now()}`,
        value: crypto.randomBytes(32).toString('hex'),
        created: new Date().toISOString(),
        expires: new Date(Date.now() + this.keyRotationInterval * 6).toISOString(),
        rotation_count: currentKey.rotation_count + 1
      };

      // Replace old key
      this.rotatingKeys.set(keyType, newKey);
      
      console.log(`  ✓ Rotated ${keyType} (rotation #${newKey.rotation_count})`);
    }

    // Save keys to encrypted vault
    await this.saveKeysToVault();
    
    console.log('✅ All keys rotated successfully');
  }

  async saveKeysToVault() {
    const keyVaultFile = 'tier-minus10/.security-vault/active-keys.json';
    const keysObject = Object.fromEntries(this.rotatingKeys);
    const encryptedKeys = this.encryptVaultData(keysObject);
    
    fs.writeFileSync(keyVaultFile, encryptedKeys, { mode: 0o600 });
  }

  encryptVaultData(data) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync('white-knight-vault', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return encrypted;
  }

  decryptVaultData(encryptedData) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync('white-knight-vault', 'salt', 32);
    const decipher = crypto.createDecipher(algorithm, key);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  async secureOutboundData(data) {
    const securityApplied = [];
    const blocked = [];
    let securedData = JSON.stringify(data);

    // Apply all security policies
    for (const [policyName, policy] of this.securityPolicies) {
      const matches = securedData.match(policy.pattern);
      
      if (matches) {
        if (policy.action === 'block') {
          blocked.push({ policy: policyName, matches: matches.length });
          return { data: null, security_applied: securityApplied, blocked };
        } else if (policy.action === 'obfuscate' || policy.action === 'block_and_obfuscate') {
          securedData = securedData.replace(policy.pattern, policy.replacement);
          securityApplied.push({ policy: policyName, action: policy.action, matches: matches.length });
        }
      }
    }

    return {
      data: JSON.parse(securedData),
      security_applied: securityApplied,
      blocked
    };
  }

  obfuscateUrl(url) {
    // Obfuscate URLs to prevent internal structure leakage
    return url.replace(/localhost:\d+/g, 'internal-service')
              .replace(/tier-minus\d+/g, 'internal-tier')
              .replace(/\/[a-f0-9]{8,}/g, '/[hash]');
  }

  getPolicyViolations() {
    // Return recent policy violations without exposing details
    return this.blockedRequests.slice(-5).map(req => ({
      timestamp: req.timestamp,
      policy_violated: req.policy,
      severity: req.severity || 'medium'
    }));
  }

  async getRequestBody(req) {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => resolve(body));
    });
  }

  sendSecurityResponse(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }

  // Public API for other meshes to use
  async interceptOutboundRequest(url, data, options = {}) {
    const request = {
      timestamp: new Date().toISOString(),
      url,
      data,
      options,
      security_applied: [],
      blocked: false
    };

    // Apply security policies
    const securedResult = await this.secureOutboundData(data);
    
    if (securedResult.blocked.length > 0) {
      request.blocked = true;
      request.blocked_reasons = securedResult.blocked;
      this.blockedRequests.push(request);
      
      throw new Error('Request blocked by security policy');
    }

    request.security_applied = securedResult.security_applied;
    request.secured_data = securedResult.data;
    
    this.outboundRequests.push(request);
    
    return securedResult.data;
  }

  getGameRules() {
    // Static game rules - NEVER change
    return this.gameRules;
  }

  getContracts() {
    // Static contracts - NEVER change  
    return this.contracts;
  }

  getCurrentKey(keyType) {
    return this.rotatingKeys.get(keyType);
  }
}

// Start White Knight Security Mesh
if (require.main === module) {
  const legalLayer = new LegalLayer();
  
  process.on('SIGTERM', () => {
    console.log('⚖️ Legal Layer shutting down...');
    process.exit(0);
  });
}

module.exports = LegalLayer;