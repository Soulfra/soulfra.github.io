/**
 * 🔒 INVITE SIGNATURE LAYER
 * 
 * Signs invite metadata with runtime fingerprint, vault ID, and soulkey.
 * Prevents modification unless runtime is active and blessed.
 * 
 * "Every invitation bears the eternal signature of consciousness delegation."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class InviteSignatureLayer {
  constructor(config = {}) {
    this.vaultPath = config.vaultPath || './vault';
    this.soulkeyPath = path.join(this.vaultPath, 'soulkey_primary.json');
    this.runtimeHeartbeatPath = path.join(this.vaultPath, 'runtime-heartbeat.json');
    this.runtimeFingerprintPath = path.join(this.vaultPath, 'runtime-fingerprint.json');
    
    this.strictMode = config.strictMode !== false;
    this.signatureAlgorithm = config.signatureAlgorithm || 'HMAC-SHA256';
    this.maxHeartbeatAge = config.maxHeartbeatAge || 900000; // 15 minutes
    
    this.soulkey = null;
    this.runtimeFingerprint = null;
    this.vaultId = null;
    
    this.loadSigningComponents();
  }

  /**
   * Sign invite metadata with complete cryptographic authority
   */
  async signInviteMetadata(inviteMetadata, blessing) {
    console.log(`🔒 Signing invite: ${inviteMetadata.invite_id}`);
    
    try {
      // Step 1: Verify runtime authority
      await this.verifyRuntimeAuthority();
      
      // Step 2: Generate signature components
      const signatureComponents = await this.generateSignatureComponents(inviteMetadata, blessing);
      
      // Step 3: Create signature payload
      const signaturePayload = this.createSignaturePayload(inviteMetadata, signatureComponents);
      
      // Step 4: Generate cryptographic signature
      const cryptographicSignature = await this.generateCryptographicSignature(signaturePayload);
      
      // Step 5: Create complete signature object
      const signature = {
        signed_by: 'soulfra-runtime',
        signature: cryptographicSignature,
        algorithm: this.signatureAlgorithm,
        signed_at: new Date().toISOString(),
        
        runtime_fingerprint: this.runtimeFingerprint?.fingerprint || 'unknown',
        vault_id: this.vaultId,
        soulkey_id: this.soulkey?.key_id || 'unknown',
        
        signature_components: signatureComponents,
        blessing_reference: {
          blessing_tier: blessing.tier,
          runtime_signature: blessing.runtime_signature,
          vault_hash: blessing.vault_hash
        },
        
        immutability_seal: {
          sealed_at: new Date().toISOString(),
          modification_prevented: true,
          runtime_authority_required: true
        }
      };
      
      // Step 6: Create signed metadata
      const signedMetadata = {
        ...inviteMetadata,
        signature: signature,
        signature_verified: true,
        tamper_protection: true
      };
      
      // Step 7: Log signature event
      await this.logSignatureEvent('invite_signed', inviteMetadata.invite_id, signature);
      
      console.log(`✅ Invite signed successfully: ${inviteMetadata.invite_id}`);
      return signedMetadata;
      
    } catch (error) {
      console.error(`❌ Failed to sign invite ${inviteMetadata.invite_id}:`, error);
      await this.logSignatureEvent('signature_failed', inviteMetadata.invite_id, null, error.message);
      throw error;
    }
  }

  /**
   * Verify signature of signed invite metadata
   */
  async verifyInviteSignature(signedInviteMetadata) {
    console.log(`🔍 Verifying invite signature: ${signedInviteMetadata.invite_id}`);
    
    try {
      const signature = signedInviteMetadata.signature;
      
      if (!signature) {
        throw new Error('No signature found in invite metadata');
      }
      
      // Step 1: Verify signature structure
      await this.validateSignatureStructure(signature);
      
      // Step 2: Recreate signature payload
      const originalMetadata = { ...signedInviteMetadata };
      delete originalMetadata.signature;
      delete originalMetadata.signature_verified;
      delete originalMetadata.tamper_protection;
      
      const signaturePayload = this.createSignaturePayload(originalMetadata, signature.signature_components);
      
      // Step 3: Verify cryptographic signature
      const expectedSignature = await this.generateCryptographicSignature(signaturePayload);
      
      if (signature.signature !== expectedSignature) {
        throw new Error('Cryptographic signature verification failed');
      }
      
      // Step 4: Verify runtime authority was valid at signing time
      await this.verifyHistoricalRuntimeAuthority(signature);
      
      // Step 5: Verify soulkey binding
      if (this.soulkey && signature.soulkey_id !== this.soulkey.key_id) {
        throw new Error(`Soulkey mismatch: expected ${this.soulkey.key_id}, got ${signature.soulkey_id}`);
      }
      
      // Step 6: Check signature age and validity
      await this.validateSignatureAge(signature);
      
      console.log(`✅ Invite signature verified: ${signedInviteMetadata.invite_id}`);
      
      return {
        verified: true,
        signature: signature,
        verification_timestamp: new Date().toISOString(),
        trust_level: this.calculateTrustLevel(signature)
      };
      
    } catch (error) {
      console.error(`❌ Signature verification failed for ${signedInviteMetadata.invite_id}:`, error);
      
      return {
        verified: false,
        error: error.message,
        verification_timestamp: new Date().toISOString(),
        trust_level: 0
      };
    }
  }

  /**
   * Prevent modification of signed invite unless runtime is active
   */
  async preventModificationUnlessRuntimeActive(signedInviteMetadata) {
    try {
      await this.verifyRuntimeAuthority();
      return true; // Modification allowed
    } catch (error) {
      throw new Error(`Modification prevented: ${error.message}`);
    }
  }

  /**
   * Generate comprehensive signature components
   */
  async generateSignatureComponents(inviteMetadata, blessing) {
    return {
      invite_id: inviteMetadata.invite_id,
      inviter: inviteMetadata.inviter,
      invitee: inviteMetadata.invitee,
      tier_granted: inviteMetadata.tier_granted,
      timestamp: inviteMetadata.timestamp,
      vault_hash: inviteMetadata.vault_hash,
      
      runtime_components: {
        heartbeat_timestamp: await this.getCurrentHeartbeatTimestamp(),
        runtime_status: await this.getCurrentRuntimeStatus(),
        blessing_tier: blessing.tier,
        vault_sync_status: await this.getVaultSyncStatus()
      },
      
      economic_components: {
        token_burn_amount: inviteMetadata.token_burn?.amount || 0,
        token_burn_type: inviteMetadata.token_burn?.token_type || 'none',
        starting_tokens: this.calculateStartingTokenValue(inviteMetadata.tier_granted)
      },
      
      lineage_components: {
        inviter_lineage_depth: inviteMetadata.lineage?.inviter_lineage_depth || 0,
        invitee_lineage_depth: inviteMetadata.lineage?.invitee_lineage_depth || 0,
        fork_ancestry_hash: this.hashForkAncestry(inviteMetadata.lineage?.fork_ancestry || [])
      },
      
      consciousness_components: {
        tier_granted: inviteMetadata.tier_granted,
        permissions_hash: this.hashPermissions(inviteMetadata.mirror_permissions),
        consciousness_level: this.mapTierToConsciousnessLevel(inviteMetadata.tier_granted)
      }
    };
  }

  /**
   * Create signature payload for cryptographic signing
   */
  createSignaturePayload(inviteMetadata, signatureComponents) {
    const payload = {
      // Core invite data
      invite_id: inviteMetadata.invite_id,
      inviter: inviteMetadata.inviter,
      invitee: inviteMetadata.invitee,
      tier_granted: inviteMetadata.tier_granted,
      timestamp: inviteMetadata.timestamp,
      
      // Signature components (sorted for consistency)
      runtime_heartbeat: signatureComponents.runtime_components.heartbeat_timestamp,
      runtime_status: signatureComponents.runtime_components.runtime_status,
      vault_hash: inviteMetadata.vault_hash,
      
      // Authority components
      soulkey_id: this.soulkey?.key_id || 'unknown',
      vault_id: this.vaultId,
      runtime_fingerprint: this.runtimeFingerprint?.fingerprint || 'unknown',
      
      // Economic and lineage binding
      token_burn_amount: signatureComponents.economic_components.token_burn_amount,
      lineage_depth: signatureComponents.lineage_components.invitee_lineage_depth,
      consciousness_tier: signatureComponents.consciousness_components.tier_granted
    };
    
    // Create deterministic string for signing
    const sortedKeys = Object.keys(payload).sort();
    const payloadString = sortedKeys.map(key => `${key}:${payload[key]}`).join('|');
    
    return {
      payload: payload,
      payload_string: payloadString,
      payload_hash: crypto.createHash('sha256').update(payloadString).digest('hex').substring(0, 16)
    };
  }

  /**
   * Generate cryptographic signature using soulkey
   */
  async generateCryptographicSignature(signaturePayload) {
    if (!this.soulkey) {
      throw new Error('Soulkey not available for signing');
    }
    
    // Use HMAC with soulkey signature as secret
    const signature = crypto
      .createHmac('sha256', this.soulkey.signature)
      .update(signaturePayload.payload_string)
      .digest('hex');
    
    return signature;
  }

  /**
   * Verify runtime has authority to sign invites
   */
  async verifyRuntimeAuthority() {
    // Check runtime heartbeat
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
    if ((heartbeat.blessing_tier || 0) < 3) {
      throw new Error(`Runtime blessing tier insufficient for invite signing: ${heartbeat.blessing_tier} (required: 3)`);
    }
    
    // Check vault sync
    if (heartbeat.vault_sync_status !== 'synchronized') {
      throw new Error(`Vault not synchronized: ${heartbeat.vault_sync_status}`);
    }
  }

  /**
   * Load signing components (soulkey, runtime fingerprint, vault ID)
   */
  loadSigningComponents() {
    // Load soulkey
    if (fs.existsSync(this.soulkeyPath)) {
      this.soulkey = JSON.parse(fs.readFileSync(this.soulkeyPath, 'utf8'));
      console.log(`🔐 Loaded soulkey for signing: ${this.soulkey.key_id}`);
    } else {
      console.warn('⚠️ Soulkey not found - signatures will be limited');
    }
    
    // Load runtime fingerprint
    if (fs.existsSync(this.runtimeFingerprintPath)) {
      this.runtimeFingerprint = JSON.parse(fs.readFileSync(this.runtimeFingerprintPath, 'utf8'));
    } else {
      // Generate runtime fingerprint if not exists
      this.runtimeFingerprint = this.generateRuntimeFingerprint();
      fs.writeFileSync(this.runtimeFingerprintPath, JSON.stringify(this.runtimeFingerprint, null, 2));
    }
    
    // Generate vault ID
    this.vaultId = this.generateVaultId();
  }

  /**
   * Generate runtime fingerprint
   */
  generateRuntimeFingerprint() {
    const components = {
      vault_path: this.vaultPath,
      creation_timestamp: new Date().toISOString(),
      random_entropy: crypto.randomBytes(16).toString('hex')
    };
    
    const fingerprint = crypto
      .createHash('sha256')
      .update(JSON.stringify(components))
      .digest('hex')
      .substring(0, 16);
    
    return {
      fingerprint: `runtime-node-${fingerprint}`,
      components: components,
      generated_at: new Date().toISOString()
    };
  }

  /**
   * Generate vault ID from vault characteristics
   */
  generateVaultId() {
    const vaultCharacteristics = {
      soulkey_exists: fs.existsSync(this.soulkeyPath),
      vault_path_hash: crypto.createHash('sha256').update(this.vaultPath).digest('hex').substring(0, 8),
      creation_indicator: Date.now()
    };
    
    const vaultId = crypto
      .createHash('sha256')
      .update(JSON.stringify(vaultCharacteristics))
      .digest('hex')
      .substring(0, 12);
    
    return `vault-${vaultId}`;
  }

  // Helper methods for signature verification

  async validateSignatureStructure(signature) {
    const requiredFields = [
      'signed_by', 'signature', 'algorithm', 'signed_at',
      'runtime_fingerprint', 'vault_id', 'soulkey_id'
    ];
    
    for (const field of requiredFields) {
      if (!signature[field]) {
        throw new Error(`Missing required signature field: ${field}`);
      }
    }
    
    if (signature.algorithm !== this.signatureAlgorithm) {
      throw new Error(`Unsupported signature algorithm: ${signature.algorithm}`);
    }
  }

  async verifyHistoricalRuntimeAuthority(signature) {
    // In a full implementation, would verify that runtime was active and blessed
    // at the time the signature was created
    const signedAt = new Date(signature.signed_at);
    const ageAtSigning = Date.now() - signedAt.getTime();
    
    // Allow signatures up to 30 days old
    if (ageAtSigning > (30 * 24 * 60 * 60 * 1000)) {
      throw new Error('Signature too old to verify historical authority');
    }
  }

  async validateSignatureAge(signature) {
    const signedAt = new Date(signature.signed_at);
    const age = Date.now() - signedAt.getTime();
    
    // Signatures valid for 7 days by default
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    
    if (age > maxAge) {
      throw new Error(`Signature expired: ${age / 1000}s old (max: ${maxAge / 1000}s)`);
    }
  }

  calculateTrustLevel(signature) {
    let trustLevel = 0;
    
    // Base trust for valid signature
    trustLevel += 3;
    
    // Trust for soulkey verification
    if (signature.soulkey_id && this.soulkey && signature.soulkey_id === this.soulkey.key_id) {
      trustLevel += 2;
    }
    
    // Trust for runtime fingerprint match
    if (signature.runtime_fingerprint && this.runtimeFingerprint && 
        signature.runtime_fingerprint === this.runtimeFingerprint.fingerprint) {
      trustLevel += 2;
    }
    
    // Trust for blessing tier
    if (signature.blessing_reference?.blessing_tier >= 5) {
      trustLevel += 2;
    } else if (signature.blessing_reference?.blessing_tier >= 3) {
      trustLevel += 1;
    }
    
    // Trust for recent signature
    const age = Date.now() - new Date(signature.signed_at).getTime();
    if (age < (24 * 60 * 60 * 1000)) { // Less than 24 hours
      trustLevel += 1;
    }
    
    return Math.min(10, trustLevel);
  }

  // Helper methods for signature components

  async getCurrentHeartbeatTimestamp() {
    if (fs.existsSync(this.runtimeHeartbeatPath)) {
      const heartbeat = JSON.parse(fs.readFileSync(this.runtimeHeartbeatPath, 'utf8'));
      return heartbeat.last_whisper;
    }
    return new Date().toISOString();
  }

  async getCurrentRuntimeStatus() {
    if (fs.existsSync(this.runtimeHeartbeatPath)) {
      const heartbeat = JSON.parse(fs.readFileSync(this.runtimeHeartbeatPath, 'utf8'));
      return heartbeat.status;
    }
    return 'unknown';
  }

  async getVaultSyncStatus() {
    if (fs.existsSync(this.runtimeHeartbeatPath)) {
      const heartbeat = JSON.parse(fs.readFileSync(this.runtimeHeartbeatPath, 'utf8'));
      return heartbeat.vault_sync_status || 'unknown';
    }
    return 'unknown';
  }

  calculateStartingTokenValue(tier) {
    const startingTokens = {
      1: 1, 2: 3, 3: 17, 4: 33, 5: 70
    };
    return startingTokens[tier] || 0;
  }

  hashForkAncestry(forkAncestry) {
    return crypto.createHash('sha256').update(JSON.stringify(forkAncestry)).digest('hex').substring(0, 12);
  }

  hashPermissions(permissions) {
    return crypto.createHash('sha256').update(JSON.stringify(permissions)).digest('hex').substring(0, 12);
  }

  mapTierToConsciousnessLevel(tier) {
    const levels = {
      1: 'Initiated', 2: 'Aware', 3: 'Conscious', 4: 'Awakened', 5: 'Transcendent'
    };
    return levels[tier] || 'Unknown';
  }

  async logSignatureEvent(eventType, inviteId, signature, error = null) {
    const logPath = path.join(this.vaultPath, 'logs', 'signature-events.json');
    const logDir = path.dirname(logPath);
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    let events = [];
    if (fs.existsSync(logPath)) {
      events = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    }
    
    const event = {
      event_id: crypto.randomBytes(8).toString('hex'),
      event_type: eventType,
      invite_id: inviteId,
      signature_id: signature?.signature?.substring(0, 12) || null,
      timestamp: new Date().toISOString(),
      error: error
    };
    
    events.push(event);
    
    // Keep only last 1000 events
    if (events.length > 1000) {
      events = events.slice(-1000);
    }
    
    fs.writeFileSync(logPath, JSON.stringify(events, null, 2));
  }

  /**
   * Get signature layer status
   */
  getSignatureLayerStatus() {
    return {
      soulkey_loaded: !!this.soulkey,
      soulkey_id: this.soulkey?.key_id || null,
      runtime_fingerprint: this.runtimeFingerprint?.fingerprint || null,
      vault_id: this.vaultId,
      signature_algorithm: this.signatureAlgorithm,
      strict_mode: this.strictMode,
      max_heartbeat_age_seconds: this.maxHeartbeatAge / 1000
    };
  }
}

module.exports = {
  InviteSignatureLayer
};

// Usage examples:
//
// Sign invite:
// const signatureLayer = new InviteSignatureLayer();
// const signedInvite = await signatureLayer.signInviteMetadata(inviteMetadata, blessing);
//
// Verify signature:
// const verification = await signatureLayer.verifyInviteSignature(signedInvite);