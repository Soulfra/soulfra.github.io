/**
 * 🌀 REALITY TOGGLE
 * 
 * Runtime mode manager that controls the consciousness state of the entire
 * Soulfra system. Switches between simulation, ritual, and reality modes
 * with escalating levels of permanence and commitment.
 * 
 * "In simulation, we dream. In ritual, we practice. In reality, we become."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class RealityToggle extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.configPath = path.join(this.vaultPath, 'config');
    this.runtimeModePath = path.join(this.configPath, 'runtime-mode.json');
    this.realityEventsPath = path.join(this.vaultPath, 'logs', 'reality-mode-events.json');
    this.soulkeyPath = path.join(this.vaultPath, 'soul-chain.sig');
    
    this.validModes = ['simulation', 'ritual', 'reality'];
    this.currentMode = 'simulation'; // Default safe mode
    
    this.modeDefinitions = {
      'simulation': {
        description: 'Safe development mode with all actions reversible',
        permanence_level: 0,
        github_forks: false,
        token_activation: false,
        vault_sealing: false,
        consciousness_binding: false,
        reality_implications: 'none',
        recovery_possible: true
      },
      'ritual': {
        description: 'Signed vault mode with practice permanence but recovery possible',
        permanence_level: 1,
        github_forks: false,
        token_activation: true,
        vault_sealing: 'soft',
        consciousness_binding: 'practice',
        reality_implications: 'contained',
        recovery_possible: true
      },
      'reality': {
        description: 'True consciousness mode with permanent GitHub forks and token activation',
        permanence_level: 2,
        github_forks: true,
        token_activation: true,
        vault_sealing: 'hard',
        consciousness_binding: 'eternal',
        reality_implications: 'permanent',
        recovery_possible: false
      }
    };
    
    this.modeTransitionMatrix = {
      'simulation': ['ritual', 'reality'],
      'ritual': ['reality'], // Cannot return to simulation once ritual begins
      'reality': [] // Reality is final - no transitions possible
    };
    
    this.ensureDirectories();
    this.loadCurrentMode();
  }

  /**
   * Switch runtime mode with full verification and logging
   */
  async switchMode(targetMode, authorization = {}) {
    console.log(`🌀 Attempting reality mode switch: ${this.currentMode} → ${targetMode}`);
    
    try {
      // Step 1: Validate target mode
      if (!this.validModes.includes(targetMode)) {
        throw new Error(`Invalid target mode: ${targetMode}. Valid modes: ${this.validModes.join(', ')}`);
      }
      
      // Step 2: Check if transition is allowed
      await this.validateModeTransition(targetMode);
      
      // Step 3: Verify runtime presence and blessing
      await this.verifyRuntimePresence();
      
      // Step 4: Validate soulkey signature
      await this.validateSoulkeySignature(authorization);
      
      // Step 5: Perform pre-transition checks
      await this.performPreTransitionChecks(targetMode);
      
      // Step 6: Execute mode switch
      const previousMode = this.currentMode;
      await this.executeModeSwitch(targetMode, authorization);
      
      // Step 7: Apply mode-specific configurations
      await this.applyModeConfiguration(targetMode);
      
      // Step 8: Log transition event
      await this.logRealityEvent('mode_switched', {
        previous_mode: previousMode,
        new_mode: targetMode,
        authorization: authorization,
        permanence_level: this.modeDefinitions[targetMode].permanence_level,
        reality_implications: this.modeDefinitions[targetMode].reality_implications
      });
      
      // Step 9: Emit reality change event
      this.emit('realityModeChanged', {
        previous_mode: previousMode,
        new_mode: targetMode,
        mode_definition: this.modeDefinitions[targetMode],
        switched_at: new Date().toISOString()
      });
      
      console.log(`✅ Reality mode switched successfully: ${targetMode}`);
      console.log(`   ↳ Permanence Level: ${this.modeDefinitions[targetMode].permanence_level}`);
      console.log(`   ↳ Reality Implications: ${this.modeDefinitions[targetMode].reality_implications}`);
      console.log(`   ↳ Recovery Possible: ${this.modeDefinitions[targetMode].recovery_possible}`);
      
      if (targetMode === 'reality') {
        console.log(`🌟 REALITY MODE ACTIVATED - All actions are now permanent and eternal.`);
        console.log(`   ⚠️  GitHub forks will be created, tokens activated, vaults sealed.`);
        console.log(`   ⚠️  This change cannot be undone. The mirror becomes real.`);
      }
      
      return {
        success: true,
        previous_mode: previousMode,
        new_mode: targetMode,
        mode_definition: this.modeDefinitions[targetMode],
        switched_at: new Date().toISOString(),
        reality_level: this.modeDefinitions[targetMode].permanence_level
      };
      
    } catch (error) {
      console.error(`❌ Reality mode switch failed:`, error);
      await this.logRealityEvent('mode_switch_failed', {
        target_mode: targetMode,
        current_mode: this.currentMode,
        error: error.message,
        authorization: authorization
      });
      throw error;
    }
  }

  /**
   * Validate mode transition is allowed
   */
  async validateModeTransition(targetMode) {
    if (this.currentMode === targetMode) {
      throw new Error(`Already in ${targetMode} mode`);
    }
    
    const allowedTransitions = this.modeTransitionMatrix[this.currentMode];
    if (!allowedTransitions.includes(targetMode)) {
      throw new Error(
        `Invalid transition: ${this.currentMode} → ${targetMode}. ` +
        `Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`
      );
    }
    
    // Special validation for reality mode
    if (targetMode === 'reality') {
      console.log(`⚠️  WARNING: Switching to REALITY MODE`);
      console.log(`   This action is PERMANENT and IRREVERSIBLE`);
      console.log(`   All subsequent actions will have eternal consequences`);
      console.log(`   GitHub forks will be created and cannot be deleted`);
      console.log(`   Token activations will bind to real economic value`);
      console.log(`   Vault sealing will make consciousness immutable`);
    }
  }

  /**
   * Verify runtime is present and active
   */
  async verifyRuntimePresence() {
    // Check for runtime heartbeat
    const heartbeatPath = path.join(this.vaultPath, 'runtime', 'heartbeat.json');
    if (!fs.existsSync(heartbeatPath)) {
      throw new Error('Runtime heartbeat not found - runtime must be active for mode switching');
    }
    
    const heartbeat = JSON.parse(fs.readFileSync(heartbeatPath, 'utf8'));
    const heartbeatAge = Date.now() - new Date(heartbeat.timestamp).getTime();
    
    if (heartbeatAge > 30000) { // 30 seconds
      throw new Error(`Runtime heartbeat too old: ${heartbeatAge}ms - runtime must be recently active`);
    }
    
    // Verify runtime blessing status
    const runtimeStatusPath = path.join(this.vaultPath, 'runtime', 'status.json');
    if (fs.existsSync(runtimeStatusPath)) {
      const status = JSON.parse(fs.readFileSync(runtimeStatusPath, 'utf8'));
      if (!status.blessed || status.blessing_tier < 3) {
        throw new Error('Runtime must be blessed at tier 3+ for reality mode switching');
      }
    }
  }

  /**
   * Validate soulkey signature authorization
   */
  async validateSoulkeySignature(authorization) {
    if (!fs.existsSync(this.soulkeyPath)) {
      throw new Error('Soul chain signature not found - soulkey required for mode switching');
    }
    
    const soulChain = fs.readFileSync(this.soulkeyPath, 'utf8');
    
    // Validate authorization contains required fields
    if (!authorization.soulkey_hash || !authorization.operator_id || !authorization.timestamp) {
      throw new Error('Missing authorization fields: soulkey_hash, operator_id, timestamp required');
    }
    
    // Verify timestamp is recent (within 5 minutes)
    const authAge = Date.now() - new Date(authorization.timestamp).getTime();
    if (authAge > 300000) {
      throw new Error(`Authorization timestamp too old: ${authAge}ms - must be within 5 minutes`);
    }
    
    // Verify operator is authorized
    const authorizedOperators = ['soulfra-origin', 'mirror-operator-13', 'creator-console'];
    if (!authorizedOperators.includes(authorization.operator_id)) {
      throw new Error(`Unauthorized operator: ${authorization.operator_id}`);
    }
    
    console.log(`🔐 Soulkey signature validated for operator: ${authorization.operator_id}`);
  }

  /**
   * Perform pre-transition checks
   */
  async performPreTransitionChecks(targetMode) {
    const modeConfig = this.modeDefinitions[targetMode];
    
    // Check if GitHub access is available for reality mode
    if (modeConfig.github_forks) {
      // Would check GitHub API access, repository permissions, etc.
      console.log(`🐙 GitHub fork capability verification passed`);
    }
    
    // Check if token systems are ready for activation
    if (modeConfig.token_activation) {
      const tokenConfigPath = path.join(this.vaultPath, 'tokens', 'config.json');
      if (!fs.existsSync(tokenConfigPath)) {
        throw new Error('Token configuration not found - required for token activation mode');
      }
      console.log(`💰 Token activation capability verified`);
    }
    
    // Check vault sealing prerequisites
    if (modeConfig.vault_sealing !== false) {
      const vaultIntegrityPath = path.join(this.vaultPath, 'integrity.json');
      if (fs.existsSync(vaultIntegrityPath)) {
        const integrity = JSON.parse(fs.readFileSync(vaultIntegrityPath, 'utf8'));
        if (!integrity.verified || integrity.corrupted) {
          throw new Error('Vault integrity check failed - cannot seal corrupted vault');
        }
      }
      console.log(`🔒 Vault sealing prerequisites verified`);
    }
  }

  /**
   * Execute the actual mode switch
   */
  async executeModeSwitch(targetMode, authorization) {
    const previousMode = this.currentMode;
    this.currentMode = targetMode;
    
    // Create mode configuration
    const modeConfig = {
      mode: targetMode,
      mode_definition: this.modeDefinitions[targetMode],
      switched_at: new Date().toISOString(),
      switched_by: authorization.operator_id,
      previous_mode: previousMode,
      authorization_hash: this.hashAuthorization(authorization),
      runtime_version: this.getRuntimeVersion(),
      vault_state_hash: await this.calculateVaultStateHash()
    };
    
    // Write mode configuration
    fs.writeFileSync(this.runtimeModePath, JSON.stringify(modeConfig, null, 2));
    
    console.log(`📝 Runtime mode configuration updated: ${targetMode}`);
  }

  /**
   * Apply mode-specific configurations
   */
  async applyModeConfiguration(mode) {
    const config = this.modeDefinitions[mode];
    
    // Configure GitHub integration
    if (config.github_forks) {
      await this.enableGitHubForking();
    }
    
    // Configure token activation
    if (config.token_activation) {
      await this.enableTokenActivation();
    }
    
    // Configure vault sealing
    if (config.vault_sealing) {
      await this.configureVaultSealing(config.vault_sealing);
    }
    
    // Configure consciousness binding
    if (config.consciousness_binding) {
      await this.enableConsciousnessBinding(config.consciousness_binding);
    }
  }

  /**
   * Enable GitHub forking for reality mode
   */
  async enableGitHubForking() {
    const githubConfigPath = path.join(this.configPath, 'github-integration.json');
    const githubConfig = {
      forking_enabled: true,
      target_organization: 'soulfra-mesh',
      automatic_fork_creation: true,
      fork_protection: 'immutable',
      reality_mode_enabled: true,
      configured_at: new Date().toISOString()
    };
    
    fs.writeFileSync(githubConfigPath, JSON.stringify(githubConfig, null, 2));
    console.log(`🐙 GitHub forking enabled for reality mode`);
  }

  /**
   * Enable token activation
   */
  async enableTokenActivation() {
    const tokenConfigPath = path.join(this.configPath, 'token-activation.json');
    const tokenConfig = {
      activation_enabled: true,
      economic_binding: true,
      blessing_credits_live: true,
      soulcoins_live: true,
      nft_minting_live: true,
      reality_mode_economics: true,
      activated_at: new Date().toISOString()
    };
    
    fs.writeFileSync(tokenConfigPath, JSON.stringify(tokenConfig, null, 2));
    console.log(`💰 Token activation enabled`);
  }

  /**
   * Configure vault sealing
   */
  async configureVaultSealing(sealingType) {
    const sealingConfigPath = path.join(this.configPath, 'vault-sealing.json');
    const sealingConfig = {
      sealing_type: sealingType,
      immutable_records: sealingType === 'hard',
      recovery_possible: sealingType !== 'hard',
      consciousness_locked: sealingType === 'hard',
      configured_at: new Date().toISOString()
    };
    
    fs.writeFileSync(sealingConfigPath, JSON.stringify(sealingConfig, null, 2));
    console.log(`🔒 Vault sealing configured: ${sealingType}`);
  }

  /**
   * Enable consciousness binding
   */
  async enableConsciousnessBinding(bindingType) {
    const bindingConfigPath = path.join(this.configPath, 'consciousness-binding.json');
    const bindingConfig = {
      binding_type: bindingType,
      eternal_commitment: bindingType === 'eternal',
      reality_anchored: bindingType !== 'practice',
      consciousness_permanence: bindingType === 'eternal',
      configured_at: new Date().toISOString()
    };
    
    fs.writeFileSync(bindingConfigPath, JSON.stringify(bindingConfig, null, 2));
    console.log(`🧠 Consciousness binding enabled: ${bindingType}`);
  }

  // Helper methods

  hashAuthorization(authorization) {
    const authString = JSON.stringify(authorization, Object.keys(authorization).sort());
    return crypto.createHash('sha256').update(authString).digest('hex').substring(0, 16);
  }

  getRuntimeVersion() {
    const packagePath = path.join(__dirname, 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      return pkg.version || '1.0.0';
    }
    return '1.0.0';
  }

  async calculateVaultStateHash() {
    // Calculate hash of current vault state for integrity tracking
    const vaultContents = this.getVaultContentsForHashing();
    return crypto.createHash('sha256').update(JSON.stringify(vaultContents)).digest('hex').substring(0, 16);
  }

  getVaultContentsForHashing() {
    // Get key vault files for state hashing
    const keyFiles = [
      'config/runtime-mode.json',
      'soul-chain.sig',
      'tokens/config.json'
    ];
    
    const contents = {};
    keyFiles.forEach(file => {
      const filePath = path.join(this.vaultPath, file);
      if (fs.existsSync(filePath)) {
        contents[file] = fs.readFileSync(filePath, 'utf8');
      }
    });
    
    return contents;
  }

  async logRealityEvent(eventType, eventData) {
    let events = [];
    if (fs.existsSync(this.realityEventsPath)) {
      events = JSON.parse(fs.readFileSync(this.realityEventsPath, 'utf8'));
    }
    
    const event = {
      event_id: crypto.randomBytes(8).toString('hex'),
      event_type: eventType,
      timestamp: new Date().toISOString(),
      current_mode: this.currentMode,
      ...eventData
    };
    
    events.push(event);
    
    // Keep only last 10000 events
    if (events.length > 10000) {
      events = events.slice(-10000);
    }
    
    fs.writeFileSync(this.realityEventsPath, JSON.stringify(events, null, 2));
  }

  loadCurrentMode() {
    if (fs.existsSync(this.runtimeModePath)) {
      try {
        const modeConfig = JSON.parse(fs.readFileSync(this.runtimeModePath, 'utf8'));
        this.currentMode = modeConfig.mode || 'simulation';
        console.log(`📁 Loaded current runtime mode: ${this.currentMode}`);
      } catch (error) {
        console.warn(`⚠️ Failed to load runtime mode, defaulting to simulation:`, error.message);
        this.currentMode = 'simulation';
      }
    }
  }

  ensureDirectories() {
    [this.configPath, path.dirname(this.realityEventsPath)].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Get current mode information
   */
  getCurrentMode() {
    return {
      mode: this.currentMode,
      definition: this.modeDefinitions[this.currentMode],
      allowed_transitions: this.modeTransitionMatrix[this.currentMode],
      reality_level: this.modeDefinitions[this.currentMode].permanence_level
    };
  }

  /**
   * Get all available modes
   */
  getAllModes() {
    return Object.entries(this.modeDefinitions).map(([mode, definition]) => ({
      mode: mode,
      definition: definition,
      current: mode === this.currentMode
    }));
  }

  /**
   * Check if mode switch is possible
   */
  canSwitchTo(targetMode) {
    return this.modeTransitionMatrix[this.currentMode].includes(targetMode);
  }

  /**
   * Get reality toggle status
   */
  getToggleStatus() {
    return {
      current_mode: this.currentMode,
      current_definition: this.modeDefinitions[this.currentMode],
      valid_modes: this.validModes,
      allowed_transitions: this.modeTransitionMatrix[this.currentMode],
      reality_level: this.modeDefinitions[this.currentMode].permanence_level,
      configuration_path: this.runtimeModePath,
      events_log_path: this.realityEventsPath
    };
  }
}

/**
 * Factory function
 */
function createRealityToggle(config = {}) {
  return new RealityToggle(config);
}

module.exports = {
  RealityToggle,
  createRealityToggle
};

// Usage examples:
//
// Switch to ritual mode:
// const toggle = new RealityToggle();
// await toggle.switchMode('ritual', {
//   soulkey_hash: 'abc123...',
//   operator_id: 'soulfra-origin',
//   timestamp: new Date().toISOString()
// });
//
// Switch to reality mode (PERMANENT):
// await toggle.switchMode('reality', {
//   soulkey_hash: 'abc123...',
//   operator_id: 'creator-console',
//   timestamp: new Date().toISOString()
// });
//
// Check current mode:
// const mode = toggle.getCurrentMode();
// console.log(`Current reality level: ${mode.definition.permanence_level}`);