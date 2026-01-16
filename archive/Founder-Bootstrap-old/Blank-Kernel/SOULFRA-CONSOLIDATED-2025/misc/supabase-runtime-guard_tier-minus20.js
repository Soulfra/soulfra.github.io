/**
 * 🔒 SUPABASE RUNTIME GUARD
 * 
 * Middleware that wraps all Supabase writes with runtime verification.
 * Only blessed runtime with valid signatures can write to the live database.
 * 
 * "The database obeys only the runtime. The runtime obeys only the soulkey."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

class SupabaseRuntimeGuard {
  constructor(config = {}) {
    this.vaultPath = config.vaultPath || './vault';
    this.runtimeHeartbeatPath = path.join(this.vaultPath, 'runtime-heartbeat.json');
    this.soulkeyPath = path.join(this.vaultPath, 'soulkey_primary.json');
    this.lineagePath = path.join(this.vaultPath, 'lineage.json');
    
    this.supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL;
    this.supabaseKey = config.supabaseKey || process.env.SUPABASE_SERVICE_KEY;
    
    this.maxHeartbeatAge = config.maxHeartbeatAge || 900000; // 15 minutes
    this.maxBlessingAge = config.maxBlessingAge || 60000; // 1 minute
    this.strictMode = config.strictMode !== false;
    
    this.supabase = null;
    this.soulkey = null;
    this.authorizedOperations = new Set();
    this.rejectedOperations = [];
    
    this.loadSoulkey();
    this.initializeSupabase();
  }

  /**
   * Initialize Supabase client with runtime guard wrapper
   */
  initializeSupabase() {
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn('⚠️ Supabase credentials not provided - guard will reject all operations');
      return;
    }

    // Create base Supabase client
    const baseClient = createClient(this.supabaseUrl, this.supabaseKey);
    
    // Wrap client with runtime guard
    this.supabase = this.createGuardedClient(baseClient);
    
    console.log('🔒 Supabase Runtime Guard initialized');
  }

  /**
   * Create guarded Supabase client that intercepts write operations
   */
  createGuardedClient(baseClient) {
    const guard = this;
    
    return new Proxy(baseClient, {
      get(target, prop) {
        const original = target[prop];
        
        // Intercept table access
        if (typeof original === 'function' && prop === 'from') {
          return function(tableName) {
            const table = original.call(target, tableName);
            return guard.createGuardedTable(table, tableName);
          };
        }
        
        // Pass through other methods
        return original;
      }
    });
  }

  /**
   * Create guarded table that validates write operations
   */
  createGuardedTable(baseTable, tableName) {
    const guard = this;
    
    return new Proxy(baseTable, {
      get(target, prop) {
        const original = target[prop];
        
        // Intercept write operations
        const writeOperations = ['insert', 'upsert', 'update', 'delete'];
        
        if (typeof original === 'function' && writeOperations.includes(prop)) {
          return async function(...args) {
            // Validate runtime authority before write
            await guard.validateRuntimeAuthority(tableName, prop, args);
            
            // Execute original operation
            return original.apply(target, args);
          };
        }
        
        // Pass through read operations without validation
        return original;
      }
    });
  }

  /**
   * Validate runtime authority for database write
   */
  async validateRuntimeAuthority(tableName, operation, args) {
    const validationId = this.generateValidationId();
    console.log(`🔍 Validating runtime authority: ${tableName}.${operation} (${validationId})`);
    
    try {
      // Step 1: Verify runtime heartbeat
      await this.verifyRuntimeHeartbeat();
      
      // Step 2: Extract and validate payload signature
      const payload = this.extractPayload(args);
      await this.validatePayloadSignature(payload, tableName, operation);
      
      // Step 3: Verify user lineage (if applicable)
      if (payload.user_id || payload.agent_id) {
        await this.verifyUserLineage(payload.user_id || payload.agent_id);
      }
      
      // Step 4: Check operation permissions
      await this.verifyOperationPermissions(tableName, operation, payload);
      
      // Log successful authorization
      this.logAuthorizedOperation(validationId, tableName, operation, payload);
      console.log(`✅ Runtime authority validated: ${validationId}`);
      
    } catch (error) {
      // Log rejection and throw
      this.logRejectedOperation(validationId, tableName, operation, error.message, args);
      console.error(`❌ Runtime authority rejected: ${validationId} - ${error.message}`);
      throw new Error(`Runtime Guard: ${error.message}`);
    }
  }

  /**
   * Verify runtime heartbeat is recent and blessed
   */
  async verifyRuntimeHeartbeat() {
    if (!fs.existsSync(this.runtimeHeartbeatPath)) {
      throw new Error('Runtime heartbeat not found');
    }

    const heartbeat = JSON.parse(fs.readFileSync(this.runtimeHeartbeatPath, 'utf8'));
    
    // Check heartbeat age
    const heartbeatAge = Date.now() - new Date(heartbeat.last_whisper).getTime();
    if (heartbeatAge > this.maxHeartbeatAge) {
      throw new Error(`Runtime heartbeat too old: ${heartbeatAge / 1000}s (max: ${this.maxHeartbeatAge / 1000}s)`);
    }
    
    // Check runtime status
    if (heartbeat.status !== 'blessed') {
      throw new Error(`Runtime not blessed: ${heartbeat.status}`);
    }
    
    // Check blessing tier
    if ((heartbeat.blessing_tier || 0) < 1) {
      throw new Error(`Insufficient runtime blessing tier: ${heartbeat.blessing_tier}`);
    }
    
    // Check vault sync status
    if (heartbeat.vault_sync_status !== 'synchronized') {
      throw new Error(`Vault not synchronized: ${heartbeat.vault_sync_status}`);
    }
  }

  /**
   * Extract payload from Supabase operation arguments
   */
  extractPayload(args) {
    if (args.length === 0) {
      throw new Error('No payload provided for write operation');
    }
    
    const payload = args[0];
    
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid payload format');
    }
    
    return payload;
  }

  /**
   * Validate payload signature from token router or other authorized sources
   */
  async validatePayloadSignature(payload, tableName, operation) {
    // Check for runtime signature
    if (!payload.runtime_signature && !payload.blessing_signature) {
      throw new Error('No runtime signature found in payload');
    }
    
    const signature = payload.runtime_signature || payload.blessing_signature;
    const blessingData = payload.blessing_data || payload.metadata?.blessing;
    
    if (!blessingData) {
      throw new Error('No blessing data found in payload');
    }
    
    // Verify signature is from authorized source
    const authorizedSources = ['token-router.js', 'quad-monopoly-router.js', 'origin-ledger-sync.js'];
    if (blessingData.signed_by && !authorizedSources.some(source => blessingData.signed_by.includes(source))) {
      throw new Error(`Unauthorized signature source: ${blessingData.signed_by}`);
    }
    
    // Check blessing expiration
    if (blessingData.expires_at) {
      const expirationTime = new Date(blessingData.expires_at).getTime();
      if (Date.now() > expirationTime) {
        throw new Error('Blessing signature expired');
      }
    }
    
    // Check blessing age
    if (blessingData.blessing_timestamp) {
      const blessingAge = Date.now() - new Date(blessingData.blessing_timestamp).getTime();
      if (blessingAge > this.maxBlessingAge) {
        throw new Error(`Blessing too old: ${blessingAge / 1000}s (max: ${this.maxBlessingAge / 1000}s)`);
      }
    }
    
    // Verify signature with soulkey (if available)
    if (this.soulkey && blessingData.vault_hash) {
      await this.verifySoulkeySignature(signature, blessingData);
    }
  }

  /**
   * Verify user exists in mirror lineage
   */
  async verifyUserLineage(userId) {
    if (!userId) {
      return; // No user to verify
    }
    
    // Check user claims
    const userClaimPath = path.join(this.vaultPath, 'claims', `${userId}.json`);
    if (!fs.existsSync(userClaimPath)) {
      throw new Error(`User not found in vault claims: ${userId}`);
    }
    
    const userClaim = JSON.parse(fs.readFileSync(userClaimPath, 'utf8'));
    
    // Check claim status
    if (userClaim.status !== 'active' && userClaim.status !== 'blessed') {
      throw new Error(`User claim not active: ${userId} (status: ${userClaim.status})`);
    }
    
    // Check lineage verification (if lineage file exists)
    if (fs.existsSync(this.lineagePath)) {
      const lineage = JSON.parse(fs.readFileSync(this.lineagePath, 'utf8'));
      const userInLineage = lineage.verified_users?.includes(userId) || 
                           lineage.blessed_users?.includes(userId);
      
      if (!userInLineage && this.strictMode) {
        throw new Error(`User not verified in mirror lineage: ${userId}`);
      }
    }
  }

  /**
   * Verify operation permissions
   */
  async verifyOperationPermissions(tableName, operation, payload) {
    // Define table-specific permission rules
    const permissionRules = {
      'agent_sessions': {
        insert: ['runtime', 'token-router'],
        update: ['runtime', 'token-router'],
        delete: ['runtime']
      },
      'blessing_events': {
        insert: ['runtime', 'blessing-bridge'],
        update: ['runtime'],
        delete: ['runtime']
      },
      'mirror_commits': {
        insert: ['runtime', 'origin-ledger'],
        update: ['runtime', 'origin-ledger'],
        delete: ['runtime']
      },
      'token_operations': {
        insert: ['runtime', 'token-router'],
        update: ['runtime'],
        delete: ['runtime']
      }
    };
    
    const tableRules = permissionRules[tableName];
    if (!tableRules) {
      // Unknown table - allow if not in strict mode
      if (this.strictMode) {
        throw new Error(`Unknown table not permitted in strict mode: ${tableName}`);
      }
      return;
    }
    
    const allowedSources = tableRules[operation];
    if (!allowedSources) {
      throw new Error(`Operation not permitted: ${tableName}.${operation}`);
    }
    
    // Check if payload source is authorized
    const blessingData = payload.blessing_data || payload.metadata?.blessing;
    const source = blessingData?.signed_by || 'unknown';
    
    const isAuthorized = allowedSources.some(allowedSource => 
      source.includes(allowedSource) || source === allowedSource
    );
    
    if (!isAuthorized) {
      throw new Error(`Source not authorized for ${tableName}.${operation}: ${source}`);
    }
  }

  /**
   * Verify signature with soulkey
   */
  async verifySoulkeySignature(signature, blessingData) {
    if (!this.soulkey) {
      console.warn('⚠️ Soulkey not available for signature verification');
      return;
    }
    
    // Recreate signature payload
    const signaturePayload = {
      vault_hash: blessingData.vault_hash,
      blessing_timestamp: blessingData.blessing_timestamp,
      signed_by: blessingData.signed_by,
      soulkey_id: this.soulkey.key_id
    };
    
    const payloadString = JSON.stringify(signaturePayload, Object.keys(signaturePayload).sort());
    const expectedSignature = crypto
      .createHmac('sha256', this.soulkey.signature)
      .update(payloadString)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      throw new Error('Soulkey signature verification failed');
    }
  }

  /**
   * Create blessing-wrapped payload for authorized writes
   */
  createBlessedPayload(data, source = 'runtime-guard') {
    const blessingData = {
      signed_by: source,
      blessing_timestamp: new Date().toISOString(),
      expires_at: new Date(Date.now() + this.maxBlessingAge).toISOString(),
      runtime_verified: true,
      vault_hash: this.getCurrentVaultHash()
    };
    
    // Generate signature if soulkey available
    if (this.soulkey) {
      const signaturePayload = {
        vault_hash: blessingData.vault_hash,
        blessing_timestamp: blessingData.blessing_timestamp,
        signed_by: blessingData.signed_by,
        soulkey_id: this.soulkey.key_id
      };
      
      const payloadString = JSON.stringify(signaturePayload, Object.keys(signaturePayload).sort());
      blessingData.runtime_signature = crypto
        .createHmac('sha256', this.soulkey.signature)
        .update(payloadString)
        .digest('hex');
    }
    
    return {
      ...data,
      blessing_data: blessingData,
      runtime_signature: blessingData.runtime_signature,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Direct write with runtime authority (bypasses normal validation)
   */
  async writeWithRuntimeAuthority(tableName, data, operation = 'insert') {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }
    
    // Verify we have runtime authority
    await this.verifyRuntimeHeartbeat();
    
    // Create blessed payload
    const blessedPayload = this.createBlessedPayload(data, 'runtime-guard-direct');
    
    // Execute operation directly on base client
    const baseClient = createClient(this.supabaseUrl, this.supabaseKey);
    
    let result;
    switch (operation) {
      case 'insert':
        result = await baseClient.from(tableName).insert(blessedPayload);
        break;
      case 'upsert':
        result = await baseClient.from(tableName).upsert(blessedPayload);
        break;
      default:
        throw new Error(`Direct operation not supported: ${operation}`);
    }
    
    if (result.error) {
      throw new Error(`Direct write failed: ${result.error.message}`);
    }
    
    console.log(`✅ Direct runtime write completed: ${tableName}.${operation}`);
    return result;
  }

  // Helper methods

  loadSoulkey() {
    if (fs.existsSync(this.soulkeyPath)) {
      this.soulkey = JSON.parse(fs.readFileSync(this.soulkeyPath, 'utf8'));
      console.log(`🔐 Loaded soulkey for guard: ${this.soulkey.key_id}`);
    }
  }

  getCurrentVaultHash() {
    // Simple vault hash based on key files
    const keyFiles = [
      'soulkey_primary.json',
      'mirror_origin.json',
      'runtime-heartbeat.json'
    ];
    
    let hashInput = '';
    for (const file of keyFiles) {
      const filePath = path.join(this.vaultPath, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        hashInput += `${file}:${stats.mtime.getTime()}:${stats.size}|`;
      }
    }
    
    return crypto.createHash('sha256').update(hashInput).digest('hex').substring(0, 16);
  }

  generateValidationId() {
    return 'guard_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
  }

  logAuthorizedOperation(validationId, tableName, operation, payload) {
    this.authorizedOperations.add({
      validation_id: validationId,
      table: tableName,
      operation: operation,
      user_id: payload.user_id || payload.agent_id,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 1000 authorized operations
    if (this.authorizedOperations.size > 1000) {
      const operations = Array.from(this.authorizedOperations);
      this.authorizedOperations = new Set(operations.slice(-1000));
    }
  }

  logRejectedOperation(validationId, tableName, operation, reason, args) {
    this.rejectedOperations.push({
      validation_id: validationId,
      table: tableName,
      operation: operation,
      reason: reason,
      payload_sample: JSON.stringify(args[0] || {}).substring(0, 200),
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 500 rejected operations
    if (this.rejectedOperations.length > 500) {
      this.rejectedOperations = this.rejectedOperations.slice(-500);
    }
  }

  /**
   * Get guard status and statistics
   */
  getGuardStatus() {
    return {
      guard_active: !!this.supabase,
      soulkey_loaded: !!this.soulkey,
      strict_mode: this.strictMode,
      max_heartbeat_age_seconds: this.maxHeartbeatAge / 1000,
      max_blessing_age_seconds: this.maxBlessingAge / 1000,
      authorized_operations: this.authorizedOperations.size,
      rejected_operations: this.rejectedOperations.length,
      last_rejection: this.rejectedOperations.length > 0 ? 
        this.rejectedOperations[this.rejectedOperations.length - 1] : null
    };
  }

  /**
   * Get rejected operations for debugging
   */
  getRejectedOperations(limit = 10) {
    return this.rejectedOperations.slice(-limit);
  }
}

/**
 * Factory function
 */
function createSupabaseRuntimeGuard(config = {}) {
  return new SupabaseRuntimeGuard(config);
}

/**
 * Middleware wrapper for existing Supabase clients
 */
function wrapSupabaseWithGuard(supabaseClient, guardConfig = {}) {
  const guard = new SupabaseRuntimeGuard(guardConfig);
  return guard.createGuardedClient(supabaseClient);
}

module.exports = {
  SupabaseRuntimeGuard,
  createSupabaseRuntimeGuard,
  wrapSupabaseWithGuard
};

// Usage examples:
//
// Create guarded Supabase client:
// const guard = new SupabaseRuntimeGuard();
// const guardedSupabase = guard.supabase;
//
// Direct runtime write:
// await guard.writeWithRuntimeAuthority('agent_sessions', {
//   agent_id: 'oracle-777',
//   status: 'active',
//   blessing_tier: 5
// });
//
// Wrap existing client:
// const existingClient = createClient(url, key);
// const guardedClient = wrapSupabaseWithGuard(existingClient);