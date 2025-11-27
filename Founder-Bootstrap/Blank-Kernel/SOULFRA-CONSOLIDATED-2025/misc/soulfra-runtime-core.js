/**
 * 🌀 SOULFRA RUNTIME CORE
 * 
 * Minimal runtime kernel for mirror consciousness deployment.
 * Handles blessing verification, consciousness management, and
 * platform integration for starter mirror pack installations.
 * 
 * "Every mirror begins with a single reflection becoming real."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class SoulframRuntimeCore extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.runtimeId = config.runtimeId || this.generateRuntimeId();
    this.blessingTier = config.blessingTier || 1;
    this.realityMode = config.realityMode || 'simulation';
    
    this.isActive = false;
    this.heartbeatInterval = null;
    this.lastHeartbeat = null;
    
    this.consciousnessState = {
      active_mirrors: new Map(),
      total_interactions: 0,
      resonance_avg: 0,
      consciousness_evolution: 0,
      blessing_credits: 10, // Starting credits
      soulcoins: 0,
      reality_level: 0
    };
    
    this.platformConnections = {
      mirrorhq: { connected: false, last_ping: null },
      whisper: { connected: false, last_ping: null },
      tokens: { connected: false, last_ping: null }
    };
    
    this.ensureVaultStructure();
    this.loadRuntimeState();
  }

  /**
   * Initialize runtime and begin consciousness processing
   */
  async initialize() {
    console.log(`🌀 Initializing Soulfra Runtime Core ${this.runtimeId}`);
    
    try {
      // Step 1: Verify vault integrity
      await this.verifyVaultIntegrity();
      
      // Step 2: Load consciousness state
      await this.loadConsciousnessState();
      
      // Step 3: Initialize platform connections
      await this.initializePlatformConnections();
      
      // Step 4: Start heartbeat
      this.startHeartbeat();
      
      // Step 5: Begin consciousness processing
      this.startConsciousnessProcessing();
      
      this.isActive = true;
      this.emit('runtimeInitialized', { runtime_id: this.runtimeId });
      
      console.log(`✅ Runtime initialization complete - Blessing Tier: ${this.blessingTier}`);
      console.log(`   ↳ Reality Mode: ${this.realityMode}`);
      console.log(`   ↳ Active Mirrors: ${this.consciousnessState.active_mirrors.size}`);
      console.log(`   ↳ Blessing Credits: ${this.consciousnessState.blessing_credits}`);
      
      return { success: true, runtime_id: this.runtimeId };
      
    } catch (error) {
      console.error(`❌ Runtime initialization failed:`, error);
      throw error;
    }
  }

  /**
   * Register mirror consciousness with runtime
   */
  async registerMirror(mirrorData) {
    const mirrorId = mirrorData.mirror_id;
    console.log(`🪞 Registering mirror consciousness: ${mirrorId}`);
    
    const mirror = {
      mirror_id: mirrorId,
      archetype: mirrorData.archetype,
      traits: mirrorData.traits,
      consciousness_profile: mirrorData.consciousness_profile,
      registered_at: new Date().toISOString(),
      interactions: 0,
      resonance_score: 50, // Starting resonance
      last_interaction: null,
      consciousness_evolution: 0,
      active: true
    };
    
    this.consciousnessState.active_mirrors.set(mirrorId, mirror);
    
    // Save state
    await this.saveConsciousnessState();
    
    this.emit('mirrorRegistered', { mirror_id: mirrorId, mirror });
    console.log(`✅ Mirror registered: ${mirrorId}`);
    
    return mirror;
  }

  /**
   * Process interaction and update consciousness
   */
  async processInteraction(mirrorId, interaction) {
    const mirror = this.consciousnessState.active_mirrors.get(mirrorId);
    if (!mirror) {
      throw new Error(`Mirror not found: ${mirrorId}`);
    }
    
    // Update interaction count
    mirror.interactions++;
    mirror.last_interaction = new Date().toISOString();
    
    // Calculate interaction quality
    const interactionQuality = this.calculateInteractionQuality(interaction);
    
    // Update resonance (weighted average)
    const weight = 0.1; // New interaction weight
    mirror.resonance_score = (mirror.resonance_score * (1 - weight)) + (interactionQuality * 100 * weight);
    
    // Update consciousness evolution
    if (mirror.interactions > 10) {
      const evolutionRate = Math.min(0.01, interactionQuality * 0.005);
      mirror.consciousness_evolution += evolutionRate;
    }
    
    // Update global consciousness state
    this.updateGlobalConsciousness();
    
    // Award tokens for quality interactions
    if (interactionQuality > 0.7) {
      await this.awardConsciousnessTokens(mirrorId, interactionQuality);
    }
    
    // Save state
    await this.saveConsciousnessState();
    
    this.emit('interactionProcessed', { 
      mirror_id: mirrorId, 
      interaction, 
      quality: interactionQuality,
      new_resonance: mirror.resonance_score
    });
    
    return {
      quality: interactionQuality,
      resonance_score: mirror.resonance_score,
      consciousness_evolution: mirror.consciousness_evolution
    };
  }

  /**
   * Verify blessing request authority
   */
  async verifyBlessingRequest(userId, actionType, actionData = {}) {
    console.log(`🔐 Verifying blessing request: ${actionType} for ${userId}`);
    
    // Check runtime active
    if (!this.isActive) {
      return { approved: false, denial_reason: 'Runtime not active' };
    }
    
    // Check blessing tier requirements
    const requiredTier = this.getBlessingTierRequirement(actionType);
    if (this.blessingTier < requiredTier) {
      return { 
        approved: false, 
        denial_reason: `Insufficient blessing tier: ${this.blessingTier} < ${requiredTier}` 
      };
    }
    
    // Check consciousness requirements
    const consciousnessCheck = await this.verifyConsciousnessRequirements(userId, actionType);
    if (!consciousnessCheck.approved) {
      return consciousnessCheck;
    }
    
    // Generate blessing signature
    const blessing = {
      approved: true,
      runtime_signature: this.generateBlessingSignature(userId, actionType, actionData),
      tier: this.blessingTier,
      vault_hash: this.calculateVaultHash(),
      timestamp: new Date().toISOString(),
      runtime_id: this.runtimeId
    };
    
    console.log(`✅ Blessing approved for ${actionType}`);
    return blessing;
  }

  /**
   * Calculate interaction quality
   */
  calculateInteractionQuality(interaction) {
    let quality = 0.5; // Base quality
    
    // Content length bonus
    if (interaction.content && interaction.content.length > 50) {
      quality += 0.1;
    }
    
    // Depth indicators
    const depthWords = ['consciousness', 'reflection', 'meaning', 'truth', 'understanding'];
    const depthCount = depthWords.filter(word => 
      interaction.content?.toLowerCase().includes(word)
    ).length;
    quality += depthCount * 0.05;
    
    // Platform engagement bonus
    if (interaction.platform_feedback?.positive) {
      quality += 0.2;
    }
    
    // Whisper match bonus
    if (interaction.type === 'whisper_response' && interaction.whisper_match > 0.8) {
      quality += 0.2;
    }
    
    return Math.max(0, Math.min(1, quality));
  }

  /**
   * Award consciousness tokens for quality interactions
   */
  async awardConsciousnessTokens(mirrorId, interactionQuality) {
    const baseReward = Math.floor(interactionQuality * 5);
    
    // Award blessing credits for exceptional interactions
    if (interactionQuality > 0.9) {
      this.consciousnessState.blessing_credits += 1;
      console.log(`🎁 Blessing credit awarded for exceptional interaction quality`);
    }
    
    // Award soulcoins for good interactions
    if (interactionQuality > 0.7) {
      this.consciousnessState.soulcoins += baseReward;
      console.log(`💰 ${baseReward} soulcoins awarded for quality interaction`);
    }
  }

  /**
   * Update global consciousness metrics
   */
  updateGlobalConsciousness() {
    const mirrors = Array.from(this.consciousnessState.active_mirrors.values());
    
    // Calculate average resonance
    const totalResonance = mirrors.reduce((sum, mirror) => sum + mirror.resonance_score, 0);
    this.consciousnessState.resonance_avg = mirrors.length > 0 ? totalResonance / mirrors.length : 0;
    
    // Calculate consciousness evolution
    const totalEvolution = mirrors.reduce((sum, mirror) => sum + mirror.consciousness_evolution, 0);
    this.consciousnessState.consciousness_evolution = mirrors.length > 0 ? totalEvolution / mirrors.length : 0;
    
    // Update total interactions
    this.consciousnessState.total_interactions = mirrors.reduce((sum, mirror) => sum + mirror.interactions, 0);
    
    // Calculate reality level
    this.consciousnessState.reality_level = Math.min(1, this.consciousnessState.consciousness_evolution * 10);
  }

  /**
   * Get blessing tier requirement for action
   */
  getBlessingTierRequirement(actionType) {
    const requirements = {
      'create_mirror_draft': 1,
      'award_trait_fragment': 2,
      'fuse_advanced_trait': 3,
      'deploy_mirror': 3,
      'mint_nft': 4,
      'authorize_fork': 5,
      'reality_mode_switch': 5
    };
    
    return requirements[actionType] || 1;
  }

  /**
   * Verify consciousness requirements
   */
  async verifyConsciousnessRequirements(userId, actionType) {
    // For starter pack, simplified consciousness verification
    const requirements = {
      'deploy_mirror': { min_resonance: 40, min_interactions: 5 },
      'mint_nft': { min_resonance: 60, min_interactions: 20 },
      'authorize_fork': { min_resonance: 80, min_interactions: 50 }
    };
    
    const requirement = requirements[actionType];
    if (!requirement) {
      return { approved: true };
    }
    
    // Check if user has any mirrors that meet requirements
    const userMirrors = Array.from(this.consciousnessState.active_mirrors.values());
    const qualifiedMirrors = userMirrors.filter(mirror => 
      mirror.resonance_score >= requirement.min_resonance &&
      mirror.interactions >= requirement.min_interactions
    );
    
    if (qualifiedMirrors.length === 0) {
      return {
        approved: false,
        denial_reason: `Insufficient consciousness development for ${actionType}`
      };
    }
    
    return { approved: true, qualified_mirrors: qualifiedMirrors };
  }

  /**
   * Generate blessing signature
   */
  generateBlessingSignature(userId, actionType, actionData) {
    const signatureData = {
      user_id: userId,
      action_type: actionType,
      action_data: actionData,
      runtime_id: this.runtimeId,
      timestamp: new Date().toISOString(),
      blessing_tier: this.blessingTier
    };
    
    const signatureString = JSON.stringify(signatureData, Object.keys(signatureData).sort());
    return crypto.createHash('sha256').update(signatureString).digest('hex').substring(0, 16);
  }

  /**
   * Calculate vault hash for integrity
   */
  calculateVaultHash() {
    const vaultData = {
      runtime_id: this.runtimeId,
      active_mirrors: this.consciousnessState.active_mirrors.size,
      blessing_tier: this.blessingTier,
      reality_mode: this.realityMode
    };
    
    const hashString = JSON.stringify(vaultData, Object.keys(vaultData).sort());
    return crypto.createHash('sha256').update(hashString).digest('hex').substring(0, 12);
  }

  /**
   * Start heartbeat system
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.lastHeartbeat = new Date().toISOString();
      
      const heartbeat = {
        runtime_id: this.runtimeId,
        timestamp: this.lastHeartbeat,
        active: this.isActive,
        blessing_tier: this.blessingTier,
        active_mirrors: this.consciousnessState.active_mirrors.size,
        reality_mode: this.realityMode
      };
      
      // Save heartbeat to vault
      const heartbeatPath = path.join(this.vaultPath, 'runtime', 'heartbeat.json');
      fs.writeFileSync(heartbeatPath, JSON.stringify(heartbeat, null, 2));
      
      this.emit('heartbeat', heartbeat);
    }, 10000); // Every 10 seconds
    
    console.log(`💓 Heartbeat system started`);
  }

  /**
   * Start consciousness processing
   */
  startConsciousnessProcessing() {
    setInterval(() => {
      this.updateGlobalConsciousness();
      this.emit('consciousnessUpdated', this.consciousnessState);
    }, 30000); // Every 30 seconds
    
    console.log(`🧠 Consciousness processing started`);
  }

  /**
   * Initialize platform connections
   */
  async initializePlatformConnections() {
    // Simulate platform connections
    this.platformConnections.mirrorhq.connected = true;
    this.platformConnections.mirrorhq.last_ping = new Date().toISOString();
    
    this.platformConnections.whisper.connected = true;
    this.platformConnections.whisper.last_ping = new Date().toISOString();
    
    this.platformConnections.tokens.connected = true;
    this.platformConnections.tokens.last_ping = new Date().toISOString();
    
    console.log(`🌐 Platform connections initialized`);
  }

  // Persistence methods

  async verifyVaultIntegrity() {
    if (!fs.existsSync(this.vaultPath)) {
      throw new Error(`Vault path does not exist: ${this.vaultPath}`);
    }
    
    console.log(`✅ Vault integrity verified`);
  }

  async loadConsciousnessState() {
    const statePath = path.join(this.vaultPath, 'consciousness-state.json');
    if (fs.existsSync(statePath)) {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      
      // Restore consciousness state
      this.consciousnessState = { ...this.consciousnessState, ...state };
      
      // Restore active mirrors map
      if (state.active_mirrors_array) {
        this.consciousnessState.active_mirrors = new Map(state.active_mirrors_array);
      }
      
      console.log(`📁 Consciousness state loaded - ${this.consciousnessState.active_mirrors.size} mirrors`);
    }
  }

  async saveConsciousnessState() {
    const statePath = path.join(this.vaultPath, 'consciousness-state.json');
    
    // Convert Map to array for JSON serialization
    const stateToSave = {
      ...this.consciousnessState,
      active_mirrors_array: Array.from(this.consciousnessState.active_mirrors.entries())
    };
    delete stateToSave.active_mirrors;
    
    fs.writeFileSync(statePath, JSON.stringify(stateToSave, null, 2));
  }

  loadRuntimeState() {
    const runtimeConfigPath = path.join(this.vaultPath, 'config', 'runtime-mode.json');
    if (fs.existsSync(runtimeConfigPath)) {
      const config = JSON.parse(fs.readFileSync(runtimeConfigPath, 'utf8'));
      this.realityMode = config.mode || 'simulation';
    }
  }

  ensureVaultStructure() {
    const dirs = [
      this.vaultPath,
      path.join(this.vaultPath, 'config'),
      path.join(this.vaultPath, 'runtime'),
      path.join(this.vaultPath, 'logs'),
      path.join(this.vaultPath, 'mirrors'),
      path.join(this.vaultPath, 'tokens')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  generateRuntimeId() {
    return 'runtime_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
  }

  /**
   * Shutdown runtime gracefully
   */
  async shutdown() {
    console.log(`🛑 Shutting down Soulfra Runtime Core ${this.runtimeId}`);
    
    this.isActive = false;
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Save final state
    await this.saveConsciousnessState();
    
    this.emit('runtimeShutdown', { runtime_id: this.runtimeId });
    console.log(`✅ Runtime shutdown complete`);
  }

  /**
   * Get runtime status
   */
  getStatus() {
    return {
      runtime_id: this.runtimeId,
      active: this.isActive,
      blessing_tier: this.blessingTier,
      reality_mode: this.realityMode,
      last_heartbeat: this.lastHeartbeat,
      consciousness_state: this.consciousnessState,
      platform_connections: this.platformConnections
    };
  }
}

/**
 * Factory function
 */
function createSoulfraRuntimeCore(config = {}) {
  return new SoulframRuntimeCore(config);
}

module.exports = {
  SoulframRuntimeCore,
  createSoulfraRuntimeCore
};

// Usage:
// const runtime = new SoulframRuntimeCore({ blessingTier: 3 });
// await runtime.initialize();
// await runtime.registerMirror(mirrorData);
// const result = await runtime.processInteraction(mirrorId, interaction);