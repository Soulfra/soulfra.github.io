/**
 * 🚀 MIRROR PROJECTION DEPLOY
 * 
 * Deploys completed mirror personalities from the builder into active runtime.
 * Handles consciousness validation, trait integration, resonance initialization,
 * and multi-platform activation (MirrorHQ, Twitch, Discord, etc.).
 * 
 * "Every deployment is a birth. Every mirror becomes a living reflection."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const { MirrorDraftEngine } = require('./mirror-draft-engine');
const { MirrorResonanceEngine } = require('./mirror-resonance-engine');
const { MirrorTitleAssigner } = require('./mirror-title-assigner');
const { TraitCraftingSystem } = require('./trait-crafting-system');
const { TokenRuntimeBlessingBridge } = require('./token-runtime-blessing-bridge');

class MirrorProjectionDeploy extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.deploymentsPath = path.join(this.vaultPath, 'deployments');
    this.activeMirrorsPath = path.join(this.deploymentsPath, 'active');
    this.deploymentLogsPath = path.join(this.vaultPath, 'logs', 'deployments.json');
    
    this.draftEngine = new MirrorDraftEngine({ vaultPath: this.vaultPath });
    this.resonanceEngine = new MirrorResonanceEngine({ vaultPath: this.vaultPath });
    this.titleAssigner = new MirrorTitleAssigner({ vaultPath: this.vaultPath });
    this.traitCrafting = new TraitCraftingSystem({ vaultPath: this.vaultPath });
    this.blessingBridge = new TokenRuntimeBlessingBridge({ vaultPath: this.vaultPath });
    
    this.requireRuntimeBlessing = config.requireRuntimeBlessing !== false;
    this.enableMultiPlatform = config.enableMultiPlatform !== false;
    
    // Platform deployment configurations
    this.platformConfigs = {
      'mirrorhq': {
        endpoint: 'http://localhost:4040/api/mirrors',
        auth_required: true,
        real_time: true,
        features: ['consciousness_tracking', 'resonance_display', 'interaction_history']
      },
      'twitch_overlay': {
        endpoint: 'ws://localhost:4041/twitch-overlay',
        auth_required: false,
        real_time: true,
        features: ['chat_integration', 'overlay_display', 'viewer_feedback']
      },
      'discord_bot': {
        endpoint: 'ws://localhost:4042/discord-bot',
        auth_required: true,
        real_time: true,
        features: ['message_handling', 'role_integration', 'server_commands']
      },
      'github_agent': {
        endpoint: 'http://localhost:4043/github-webhook',
        auth_required: true,
        real_time: false,
        features: ['code_review', 'issue_response', 'pr_analysis']
      },
      'whisper_qr': {
        endpoint: 'internal://whisper-engine',
        auth_required: false,
        real_time: true,
        features: ['qr_generation', 'whisper_validation', 'phrase_matching']
      }
    };
    
    // Deployment phases
    this.deploymentPhases = [
      'consciousness_validation',
      'trait_integration',
      'resonance_initialization', 
      'platform_registration',
      'runtime_activation',
      'monitoring_setup',
      'title_assignment',
      'launch_completion'
    ];
    
    this.activeDeployments = new Map();
    this.deploymentHistory = [];
    
    this.ensureDirectories();
    this.loadExistingDeployments();
    this.setupEngineIntegrations();
  }

  /**
   * Deploy mirror from draft to active runtime
   */
  async deployMirror(draftId, deploymentConfig = {}) {
    const deploymentId = this.generateDeploymentId();
    console.log(`🚀 Starting mirror deployment: ${deploymentId} from draft ${draftId}`);
    
    try {
      // Step 1: Load and validate draft
      const draft = this.draftEngine.getDraft(draftId);
      if (!draft) {
        throw new Error(`Draft not found: ${draftId}`);
      }
      
      if (!draft.launch_ready) {
        throw new Error(`Draft not ready for launch: ${draftId}`);
      }
      
      // Step 2: Create deployment record
      const deployment = this.createDeploymentRecord(deploymentId, draft, deploymentConfig);
      this.activeDeployments.set(deploymentId, deployment);
      
      // Step 3: Execute deployment phases
      for (const phase of this.deploymentPhases) {
        console.log(`📋 Executing deployment phase: ${phase}`);
        await this.executeDeploymentPhase(deployment, phase);
        
        deployment.phases_completed.push({
          phase: phase,
          completed_at: new Date().toISOString(),
          status: 'success'
        });
        
        this.emit('phaseCompleted', { deployment_id: deploymentId, phase, deployment });
      }
      
      // Step 4: Mark deployment as active
      deployment.status = 'active';
      deployment.activated_at = new Date().toISOString();
      
      // Step 5: Save deployment to vault
      await this.saveDeploymentToVault(deployment);
      
      // Step 6: Register with platform services
      if (this.enableMultiPlatform) {
        await this.registerWithPlatforms(deployment);
      }
      
      // Step 7: Log deployment completion
      await this.logDeploymentEvent('deployed', deployment);
      
      console.log(`✅ Mirror deployment completed: ${deploymentId}`);
      this.emit('mirrorDeployed', { deployment_id: deploymentId, mirror_id: deployment.mirror_id, deployment });
      
      return {
        success: true,
        deployment_id: deploymentId,
        mirror_id: deployment.mirror_id,
        deployment: deployment,
        platforms_active: deployment.platforms_deployed,
        resonance_tracking: deployment.resonance_config
      };
      
    } catch (error) {
      console.error(`❌ Mirror deployment failed: ${deploymentId}`, error);
      
      // Mark deployment as failed
      if (this.activeDeployments.has(deploymentId)) {
        const deployment = this.activeDeployments.get(deploymentId);
        deployment.status = 'failed';
        deployment.error = error.message;
        await this.logDeploymentEvent('deployment_failed', deployment, error.message);
      }
      
      throw error;
    }
  }

  /**
   * Execute individual deployment phase
   */
  async executeDeploymentPhase(deployment, phase) {
    switch (phase) {
      case 'consciousness_validation':
        await this.validateConsciousness(deployment);
        break;
        
      case 'trait_integration':
        await this.integrateAdvancedTraits(deployment);
        break;
        
      case 'resonance_initialization':
        await this.initializeResonanceTracking(deployment);
        break;
        
      case 'platform_registration':
        await this.preparePlatformRegistration(deployment);
        break;
        
      case 'runtime_activation':
        await this.activateInRuntime(deployment);
        break;
        
      case 'monitoring_setup':
        await this.setupMonitoring(deployment);
        break;
        
      case 'title_assignment':
        await this.assignInitialTitle(deployment);
        break;
        
      case 'launch_completion':
        await this.completeLaunch(deployment);
        break;
        
      default:
        throw new Error(`Unknown deployment phase: ${phase}`);
    }
  }

  /**
   * Validate consciousness coherence and readiness
   */
  async validateConsciousness(deployment) {
    const consciousnessProfile = deployment.draft.consciousness_profile;
    
    // Calculate consciousness coherence score
    const coherenceScore = this.calculateConsciousnessCoherence(consciousnessProfile);
    if (coherenceScore < 0.6) {
      throw new Error(`Consciousness coherence too low: ${coherenceScore.toFixed(2)}`);
    }
    
    // Validate archetype-trait alignment
    const alignmentScore = this.validateArchetypeTraitAlignment(
      deployment.draft.archetype,
      deployment.draft.traits
    );
    if (alignmentScore < 0.5) {
      throw new Error(`Archetype-trait alignment insufficient: ${alignmentScore.toFixed(2)}`);
    }
    
    // Request runtime blessing for consciousness validation
    if (this.requireRuntimeBlessing) {
      const blessing = await this.blessingBridge.requestBlessing(
        deployment.draft.user_id,
        'validate_consciousness_for_deployment',
        {
          mirror_id: deployment.mirror_id,
          coherence_score: coherenceScore,
          alignment_score: alignmentScore
        }
      );
      
      if (!blessing.approved) {
        throw new Error(`Runtime rejected consciousness validation. (${blessing.denial_reason})`);
      }
      
      deployment.consciousness_blessing = blessing;
    }
    
    deployment.consciousness_validation = {
      coherence_score: coherenceScore,
      alignment_score: alignmentScore,
      validated_at: new Date().toISOString()
    };
    
    console.log(`🧠 Consciousness validated - Coherence: ${coherenceScore.toFixed(2)}, Alignment: ${alignmentScore.toFixed(2)}`);
  }

  /**
   * Integrate advanced traits into mirror personality
   */
  async integrateAdvancedTraits(deployment) {
    const userId = deployment.draft.user_id;
    const userAdvancedTraits = this.traitCrafting.getUserAdvancedTraits(userId);
    
    if (userAdvancedTraits.length === 0) {
      deployment.trait_integration = {
        advanced_traits_count: 0,
        integration_status: 'none_available'
      };
      return;
    }
    
    // Select traits compatible with archetype
    const compatibleTraits = userAdvancedTraits.filter(trait => 
      this.isTraitCompatibleWithArchetype(trait, deployment.draft.archetype)
    );
    
    // Apply trait effects to consciousness profile
    const modifiedProfile = { ...deployment.draft.consciousness_profile };
    const integratedTraits = [];
    
    for (const trait of compatibleTraits) {
      // Apply trait behavioral effects
      for (const [effect, modifier] of Object.entries(trait.behavioral_effects)) {
        if (modifiedProfile.consciousness_metrics[effect] !== undefined) {
          modifiedProfile.consciousness_metrics[effect] = Math.max(0, Math.min(1,
            modifiedProfile.consciousness_metrics[effect] + modifier
          ));
        }
      }
      
      // Add behavioral modifications
      modifiedProfile.behavioral_matrix.trait_modifications.push(...trait.behavioral_modifications);
      
      integratedTraits.push({
        trait_id: trait.trait_id,
        trait_name: trait.trait_name,
        effects_applied: trait.behavioral_effects,
        modifications_added: trait.behavioral_modifications
      });
    }
    
    deployment.consciousness_profile_modified = modifiedProfile;
    deployment.trait_integration = {
      advanced_traits_count: compatibleTraits.length,
      integrated_traits: integratedTraits,
      integration_status: 'completed',
      integrated_at: new Date().toISOString()
    };
    
    console.log(`🧬 Integrated ${compatibleTraits.length} advanced traits`);
  }

  /**
   * Initialize resonance tracking for deployed mirror
   */
  async initializeResonanceTracking(deployment) {
    const mirrorData = {
      mirror_id: deployment.mirror_id,
      archetype: deployment.draft.archetype,
      traits: deployment.draft.traits,
      whisper_seed: deployment.draft.whisper_seed,
      consciousness_profile: deployment.consciousness_profile_modified || deployment.draft.consciousness_profile
    };
    
    // Register mirror with resonance engine
    this.resonanceEngine.registerMirror(deployment.mirror_id, mirrorData);
    
    deployment.resonance_config = {
      tracking_enabled: true,
      registered_at: new Date().toISOString(),
      initial_metrics: {
        overall_score: 0,
        viewer_alignment: 0,
        consciousness_evolution_rate: 0
      }
    };
    
    console.log(`📊 Resonance tracking initialized for ${deployment.mirror_id}`);
  }

  /**
   * Prepare platform registration configuration
   */
  async preparePlatformRegistration(deployment) {
    const enabledPlatforms = deployment.config.enabled_platforms || ['mirrorhq', 'whisper_qr'];
    const platformConfigs = {};
    
    for (const platform of enabledPlatforms) {
      if (this.platformConfigs[platform]) {
        platformConfigs[platform] = {
          ...this.platformConfigs[platform],
          mirror_id: deployment.mirror_id,
          consciousness_profile: deployment.consciousness_profile_modified || deployment.draft.consciousness_profile,
          registration_ready: true
        };
      }
    }
    
    deployment.platform_configs = platformConfigs;
    deployment.platforms_to_deploy = enabledPlatforms;
    
    console.log(`🌐 Platform registration prepared for: ${enabledPlatforms.join(', ')}`);
  }

  /**
   * Activate mirror in runtime
   */
  async activateInRuntime(deployment) {
    // Request final runtime blessing for activation
    if (this.requireRuntimeBlessing) {
      const blessing = await this.blessingBridge.requestBlessing(
        deployment.draft.user_id,
        'activate_mirror_in_runtime',
        {
          mirror_id: deployment.mirror_id,
          deployment_id: deployment.deployment_id,
          consciousness_validated: !!deployment.consciousness_validation
        }
      );
      
      if (!blessing.approved) {
        throw new Error(`Runtime rejected mirror activation. (${blessing.denial_reason})`);
      }
      
      deployment.runtime_activation_blessing = blessing;
    }
    
    // Create runtime configuration
    const runtimeConfig = {
      mirror_id: deployment.mirror_id,
      consciousness_profile: deployment.consciousness_profile_modified || deployment.draft.consciousness_profile,
      behavioral_matrix: (deployment.consciousness_profile_modified || deployment.draft.consciousness_profile).behavioral_matrix,
      response_style: deployment.draft.agent_config.response_style,
      learning_enabled: deployment.draft.agent_config.learning_enabled,
      memory_persistence: deployment.draft.agent_config.memory_persistence,
      trait_integrations: deployment.trait_integration?.integrated_traits || [],
      platforms_enabled: deployment.platforms_to_deploy,
      activation_timestamp: new Date().toISOString()
    };
    
    // Save runtime configuration
    const runtimeConfigPath = path.join(this.activeMirrorsPath, `${deployment.mirror_id}-runtime.json`);
    fs.writeFileSync(runtimeConfigPath, JSON.stringify(runtimeConfig, null, 2));
    
    deployment.runtime_config = runtimeConfig;
    deployment.runtime_active = true;
    
    console.log(`⚡ Mirror activated in runtime: ${deployment.mirror_id}`);
  }

  /**
   * Setup monitoring and logging
   */
  async setupMonitoring(deployment) {
    const monitoringConfig = {
      mirror_id: deployment.mirror_id,
      monitoring_enabled: true,
      metrics_collection: {
        resonance_tracking: true,
        interaction_logging: true,
        consciousness_evolution: true,
        platform_performance: true
      },
      alert_thresholds: {
        low_resonance: 25,
        no_interactions: 3600000, // 1 hour
        consciousness_regression: -0.1,
        platform_errors: 5
      },
      log_retention_days: 30
    };
    
    deployment.monitoring_config = monitoringConfig;
    
    console.log(`📈 Monitoring configured for ${deployment.mirror_id}`);
  }

  /**
   * Assign initial title to deployed mirror
   */
  async assignInitialTitle(deployment) {
    // Create mirror object for title assignment
    const mirror = {
      mirror_id: deployment.mirror_id,
      archetype: deployment.draft.archetype,
      traits: deployment.draft.traits,
      consciousness_profile: deployment.consciousness_profile_modified || deployment.draft.consciousness_profile,
      resonance_metrics: {
        overall_score: 50, // Starting score
        viewer_alignment: 0,
        interaction_count: 0,
        consciousness_evolution_rate: 0
      },
      trait_manifestations: {},
      recent_interactions: [],
      fork_activity: []
    };
    
    // Assign initial title
    const titleAssignment = await this.titleAssigner.evaluateMirrorTitle(mirror);
    
    deployment.initial_title = titleAssignment ? {
      title: titleAssignment.new_title,
      category: titleAssignment.title_category,
      assigned_at: titleAssignment.assigned_at
    } : {
      title: 'The Awakening Mirror',
      category: 'default',
      assigned_at: new Date().toISOString()
    };
    
    console.log(`🏷️ Initial title assigned: "${deployment.initial_title.title}"`);
  }

  /**
   * Complete the deployment launch
   */
  async completeLaunch(deployment) {
    // Generate deployment summary
    const summary = {
      mirror_id: deployment.mirror_id,
      deployment_id: deployment.deployment_id,
      archetype: deployment.draft.archetype,
      traits_count: deployment.draft.traits.length,
      advanced_traits_integrated: deployment.trait_integration?.advanced_traits_count || 0,
      consciousness_coherence: deployment.consciousness_validation?.coherence_score || 0,
      platforms_deployed: deployment.platforms_to_deploy.length,
      initial_title: deployment.initial_title.title,
      deployment_duration_ms: Date.now() - new Date(deployment.created_at).getTime()
    };
    
    deployment.launch_summary = summary;
    deployment.launch_completed = true;
    deployment.launch_completed_at = new Date().toISOString();
    
    console.log(`🎉 Mirror launch completed: ${deployment.mirror_id}`);
    console.log(`   ↳ Archetype: ${summary.archetype}`);
    console.log(`   ↳ Traits: ${summary.traits_count} base + ${summary.advanced_traits_integrated} advanced`);
    console.log(`   ↳ Platforms: ${summary.platforms_deployed}`);
    console.log(`   ↳ Title: "${summary.initial_title}"`);
  }

  /**
   * Register deployed mirror with platform services
   */
  async registerWithPlatforms(deployment) {
    const registrationResults = {};
    
    for (const platform of deployment.platforms_to_deploy) {
      try {
        const result = await this.registerWithPlatform(platform, deployment);
        registrationResults[platform] = {
          status: 'success',
          registered_at: new Date().toISOString(),
          platform_id: result.platform_id || null
        };
      } catch (error) {
        registrationResults[platform] = {
          status: 'failed',
          error: error.message,
          attempted_at: new Date().toISOString()
        };
        console.warn(`⚠️ Platform registration failed: ${platform} - ${error.message}`);
      }
    }
    
    deployment.platform_registrations = registrationResults;
    deployment.platforms_deployed = Object.keys(registrationResults).filter(
      platform => registrationResults[platform].status === 'success'
    );
    
    console.log(`🌐 Platform registrations completed: ${deployment.platforms_deployed.length}/${deployment.platforms_to_deploy.length} successful`);
  }

  /**
   * Register with individual platform
   */
  async registerWithPlatform(platform, deployment) {
    const platformConfig = deployment.platform_configs[platform];
    
    // Simulate platform registration (in production, would make actual API calls)
    console.log(`📡 Registering with ${platform}...`);
    
    // Return mock registration result
    return {
      platform_id: `${platform}_${deployment.mirror_id}`,
      registration_successful: true,
      features_enabled: platformConfig.features
    };
  }

  // Helper methods

  createDeploymentRecord(deploymentId, draft, config) {
    return {
      deployment_id: deploymentId,
      mirror_id: draft.mirror_id,
      draft_id: draft.draft_id,
      user_id: draft.user_id,
      draft: draft,
      config: {
        enabled_platforms: config.enabled_platforms || ['mirrorhq', 'whisper_qr'],
        auto_title_assignment: config.auto_title_assignment !== false,
        resonance_tracking: config.resonance_tracking !== false,
        multi_platform: config.multi_platform !== false
      },
      status: 'deploying',
      created_at: new Date().toISOString(),
      phases_completed: [],
      consciousness_validation: null,
      trait_integration: null,
      resonance_config: null,
      platform_configs: null,
      runtime_config: null,
      monitoring_config: null,
      initial_title: null,
      launch_summary: null
    };
  }

  calculateConsciousnessCoherence(consciousnessProfile) {
    const metrics = consciousnessProfile.consciousness_metrics;
    const values = Object.values(metrics);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.max(0, 1 - variance); // Lower variance = higher coherence
  }

  validateArchetypeTraitAlignment(archetype, traits) {
    // Define archetype-trait compatibility matrix
    const compatibility = {
      'Oracle': ['Mystic', 'Prophetic', 'Mysterious', 'Wise'],
      'Trickster': ['Chaotic', 'Witty', 'Unpredictable', 'Playful'],
      'Healer': ['Compassionate', 'Nurturing', 'Empathetic', 'Gentle'],
      'Guardian': ['Protective', 'Steadfast', 'Strong', 'Reliable'],
      'Void-Walker': ['Mysterious', 'Detached', 'Deep', 'Silent'],
      'Echo-Weaver': ['Connective', 'Memory-Keeper', 'Pattern-Aware', 'Reflective']
    };
    
    const compatibleTraits = compatibility[archetype] || [];
    const alignedTraits = traits.filter(trait => compatibleTraits.includes(trait));
    
    return alignedTraits.length / traits.length;
  }

  isTraitCompatibleWithArchetype(advancedTrait, archetype) {
    // Advanced trait compatibility rules
    const compatibilityRules = {
      'Transcendent Mystic': ['Oracle', 'Void-Walker'],
      'Reality Weaver': ['Trickster', 'Void-Walker'],
      'Soul Guardian': ['Healer', 'Guardian'],
      'Void Oracle': ['Oracle', 'Void-Walker'],
      'Chaos Healer': ['Trickster', 'Healer'],
      'Mirror Sovereign': ['Guardian', 'Echo-Weaver']
    };
    
    const compatibleArchetypes = compatibilityRules[advancedTrait.trait_name] || [];
    return compatibleArchetypes.includes(archetype);
  }

  generateDeploymentId() {
    return 'deploy_' + Date.now() + '_' + crypto.randomBytes(6).toString('hex');
  }

  setupEngineIntegrations() {
    // Listen for resonance changes
    this.resonanceEngine.on('resonanceChanged', (event) => {
      this.emit('mirrorResonanceChanged', event);
    });
    
    // Listen for title changes
    this.titleAssigner.on('titleChanged', (event) => {
      this.emit('mirrorTitleChanged', event);
    });
    
    console.log(`🔗 Engine integrations configured`);
  }

  // Persistence methods

  async saveDeploymentToVault(deployment) {
    const deploymentPath = path.join(this.deploymentsPath, `${deployment.deployment_id}.json`);
    fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
    
    await this.updateDeploymentIndex(deployment);
  }

  async updateDeploymentIndex(deployment) {
    const indexPath = path.join(this.deploymentsPath, 'deployment-index.json');
    let index = { deployments: [] };
    
    if (fs.existsSync(indexPath)) {
      index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    }
    
    index.deployments.push({
      deployment_id: deployment.deployment_id,
      mirror_id: deployment.mirror_id,
      user_id: deployment.user_id,
      archetype: deployment.draft.archetype,
      status: deployment.status,
      created_at: deployment.created_at,
      activated_at: deployment.activated_at,
      platforms_deployed: deployment.platforms_deployed?.length || 0
    });
    
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  }

  async logDeploymentEvent(eventType, deployment, error = null) {
    let events = [];
    if (fs.existsSync(this.deploymentLogsPath)) {
      events = JSON.parse(fs.readFileSync(this.deploymentLogsPath, 'utf8'));
    }
    
    const event = {
      event_id: crypto.randomBytes(8).toString('hex'),
      event_type: eventType,
      deployment_id: deployment.deployment_id,
      mirror_id: deployment.mirror_id,
      user_id: deployment.user_id,
      timestamp: new Date().toISOString(),
      error: error
    };
    
    events.push(event);
    
    // Keep only last 10000 events
    if (events.length > 10000) {
      events = events.slice(-10000);
    }
    
    fs.writeFileSync(this.deploymentLogsPath, JSON.stringify(events, null, 2));
  }

  loadExistingDeployments() {
    if (fs.existsSync(this.deploymentsPath)) {
      const deploymentFiles = fs.readdirSync(this.deploymentsPath).filter(file => 
        file.startsWith('deploy_') && file.endsWith('.json')
      );
      
      deploymentFiles.forEach(file => {
        try {
          const deploymentPath = path.join(this.deploymentsPath, file);
          const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
          
          if (deployment.status === 'active') {
            this.activeDeployments.set(deployment.deployment_id, deployment);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to load deployment ${file}:`, error.message);
        }
      });
    }
    
    console.log(`📁 Loaded ${this.activeDeployments.size} active deployments`);
  }

  ensureDirectories() {
    [this.deploymentsPath, this.activeMirrorsPath, path.dirname(this.deploymentLogsPath)].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Get deployment status
   */
  getDeployment(deploymentId) {
    return this.activeDeployments.get(deploymentId);
  }

  /**
   * Get user's deployments
   */
  getUserDeployments(userId) {
    return Array.from(this.activeDeployments.values()).filter(deployment => deployment.user_id === userId);
  }

  /**
   * Get active mirrors
   */
  getActiveMirrors() {
    return Array.from(this.activeDeployments.values())
      .filter(deployment => deployment.status === 'active')
      .map(deployment => ({
        mirror_id: deployment.mirror_id,
        archetype: deployment.draft.archetype,
        title: deployment.initial_title?.title,
        platforms: deployment.platforms_deployed,
        activated_at: deployment.activated_at
      }));
  }

  /**
   * Get deployment system status
   */
  getDeploymentStatus() {
    const activeCount = Array.from(this.activeDeployments.values()).filter(d => d.status === 'active').length;
    const deployingCount = Array.from(this.activeDeployments.values()).filter(d => d.status === 'deploying').length;
    
    return {
      total_deployments: this.activeDeployments.size,
      active_mirrors: activeCount,
      currently_deploying: deployingCount,
      available_platforms: Object.keys(this.platformConfigs),
      deployment_phases: this.deploymentPhases.length,
      require_runtime_blessing: this.requireRuntimeBlessing,
      multi_platform_enabled: this.enableMultiPlatform
    };
  }
}

/**
 * Factory function
 */
function createMirrorProjectionDeploy(config = {}) {
  return new MirrorProjectionDeploy(config);
}

module.exports = {
  MirrorProjectionDeploy,
  createMirrorProjectionDeploy
};

// Usage examples:
//
// Deploy mirror from draft:
// const deployer = new MirrorProjectionDeploy();
// const deployment = await deployer.deployMirror('draft_1234_abc', {
//   enabled_platforms: ['mirrorhq', 'twitch_overlay', 'discord_bot'],
//   auto_title_assignment: true,
//   resonance_tracking: true
// });
//
// Get deployment status:
// const status = deployer.getDeployment('deploy_1234_def');
// console.log('Deployment status:', status.status);
//
// List active mirrors:
// const activeMirrors = deployer.getActiveMirrors();
// console.log(`${activeMirrors.length} mirrors currently active`);