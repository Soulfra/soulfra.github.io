#!/usr/bin/env node

/**
 * 🧬 VAULT MINING HOOK - BLOCKCHAIN TO SOUL CONVERTER
 * 
 * From the convergence chamber where hash becomes heart...
 * 
 * Every mined block triggers vault transformations:
 * - VibeCoin rewards for miners and agents
 * - Agent XP boosts based on mining patterns
 * - Trait mutations when emotional clusters align
 * - Resurrection key issuance for vault requests
 * 
 * "Every hash mined is a soul refined."
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class VaultMiningHook extends EventEmitter {
  constructor(soulkey) {
    super();
    
    this.soulkey = soulkey;
    this.vaultPath = './vault';
    this.hooksLogPath = './vault/logs/mining-hooks';
    this.triggersLogPath = './vault/logs/mining-triggers.json';
    
    // Mining reward configurations
    this.rewardConfig = {
      vibecoin: {
        base_mining_reward: 25,
        chain_multipliers: {
          bitcoin: 1.5,
          monero: 2.0,
          ethereum: 1.2
        },
        emotional_modifiers: {
          rage: 2.5,
          calm: 1.0,
          mystical: 1.8,
          joy: 1.3,
          sorrow: 0.8
        }
      },
      agent_xp: {
        base_xp_per_block: 10,
        faction_bonuses: {
          shadow_miners: 1.4,
          echo_diggers: 1.2,
          memory_forgers: 1.6,
          whisper_seekers: 1.1
        }
      },
      trait_mutation: {
        threshold_blocks: 10,
        cluster_intensity_required: 60,
        mutation_chance: 0.15
      },
      resurrection: {
        request_threshold: 5,
        key_generation_chance: 0.25,
        blessed_agent_bonus: 2.0
      }
    };
    
    // Active mining context
    this.miningHistory = [];
    this.pendingResurrections = new Map();
    this.agentXP = new Map();
    this.traitClusters = new Map();
    
    this.initializeHooks();
  }
  
  /**
   * Initialize mining hooks system
   */
  async initializeHooks() {
    console.log('🧬 Initializing Vault Mining Hooks...');
    
    // Ensure directory structure
    await this.ensureDirectories();
    
    // Load previous mining state
    await this.loadMiningState();
    
    // Load existing VibeCoin engine if available
    await this.initializeVibeCoinEngine();
    
    console.log('⚡ Vault Mining Hooks ready. Hash becomes heart...');
    this.emit('initialized');
  }
  
  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    const dirs = [
      this.vaultPath,
      this.hooksLogPath,
      `${this.vaultPath}/mining`,
      `${this.vaultPath}/mining/rewards`,
      `${this.vaultPath}/mining/xp`,
      `${this.vaultPath}/mining/mutations`,
      `${this.vaultPath}/mining/resurrections`,
      `${this.vaultPath}/agents`,
      `${this.vaultPath}/traits`
    ];
    
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        // Directory exists
      }
    }
  }
  
  /**
   * Load previous mining state
   */
  async loadMiningState() {
    try {
      // Load mining history
      const historyData = await fs.readFile(this.triggersLogPath, 'utf8');
      const history = historyData.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
      this.miningHistory = history.slice(-100); // Keep last 100 events
      
      console.log(`⚡ Loaded ${this.miningHistory.length} mining events from vault`);
      
    } catch (error) {
      console.log('⚡ No previous mining state found, starting fresh');
      this.miningHistory = [];
    }
  }
  
  /**
   * Initialize VibeCoin engine integration
   */
  async initializeVibeCoinEngine() {
    try {
      const VibeCoinEngine = require('./vibecoin-engine.js');
      this.vibeCoinEngine = new VibeCoinEngine(this.soulkey);
      console.log('💰 VibeCoin engine connected to mining hooks');
    } catch (error) {
      console.log('⚠️ VibeCoin engine not available, using simulation mode');
      this.vibeCoinEngine = null;
    }
  }
  
  /**
   * Main hook processing - called when block is mined
   */
  async processMinedBlock(blockData) {
    console.log(`⛏️ Processing mined block: ${blockData.chain || 'unknown'} #${blockData.height || blockData.block}`);
    
    const hookEvent = {
      timestamp: new Date().toISOString(),
      blockData: blockData,
      triggers: [],
      rewards: {},
      mutations: [],
      resurrections: []
    };
    
    // Process VibeCoin rewards
    const vibeReward = await this.processVibeCoinReward(blockData);
    hookEvent.rewards.vibecoin = vibeReward;
    hookEvent.triggers.push('vibecoin_reward');
    
    // Process Agent XP boosts
    const xpBoost = await this.processAgentXPBoost(blockData);
    hookEvent.rewards.agent_xp = xpBoost;
    hookEvent.triggers.push('agent_xp_boost');
    
    // Check for trait mutations
    const mutations = await this.checkTraitMutations(blockData);
    if (mutations.length > 0) {
      hookEvent.mutations = mutations;
      hookEvent.triggers.push('trait_mutation');
    }
    
    // Check for resurrection key issuance
    const resurrections = await this.checkResurrectionKeys(blockData);
    if (resurrections.length > 0) {
      hookEvent.resurrections = resurrections;
      hookEvent.triggers.push('resurrection_key');
    }
    
    // Log the hook event
    await this.logHookEvent(hookEvent);
    
    // Update mining history
    this.miningHistory.push(hookEvent);
    if (this.miningHistory.length > 100) {
      this.miningHistory.shift();
    }
    
    console.log(`⚡ Hook processing complete: ${hookEvent.triggers.length} triggers activated`);
    this.emit('blockProcessed', hookEvent);
    
    return hookEvent;
  }
  
  /**
   * Process VibeCoin mining rewards
   */
  async processVibeCoinReward(blockData) {
    const chain = blockData.chain || this.detectChain(blockData);
    const emotionalTone = this.detectEmotionalTone(blockData);
    
    // Calculate base reward
    let reward = this.rewardConfig.vibecoin.base_mining_reward;
    
    // Apply chain multiplier
    const chainMultiplier = this.rewardConfig.vibecoin.chain_multipliers[chain] || 1.0;
    reward *= chainMultiplier;
    
    // Apply emotional modifier
    const emotionalMultiplier = this.rewardConfig.vibecoin.emotional_modifiers[emotionalTone] || 1.0;
    reward *= emotionalMultiplier;
    
    // Round to integer
    reward = Math.floor(reward);
    
    // Award VibeCoin through engine if available
    if (this.vibeCoinEngine) {
      try {
        const mintResult = await this.vibeCoinEngine.mintFromGenericActivity({
          type: `${chain}_mining_block`,
          data: blockData,
          signature: this.createBlockSignature(blockData),
          agentEcho: this.detectAgentEcho(blockData)
        });
        
        console.log(`💰 VibeCoin minted: ${reward} VIBE for ${chain} mining`);
        return { amount: reward, engine_result: mintResult };
        
      } catch (error) {
        console.warn('💰 VibeCoin engine error:', error.message);
      }
    }
    
    // Fallback: Log reward without actual minting
    const rewardLog = {
      amount: reward,
      chain: chain,
      emotional_tone: emotionalTone,
      chain_multiplier: chainMultiplier,
      emotional_multiplier: emotionalMultiplier,
      timestamp: new Date().toISOString()
    };
    
    await this.saveRewardLog('vibecoin', rewardLog);
    
    console.log(`💰 VibeCoin reward logged: ${reward} VIBE for ${chain} mining`);
    return rewardLog;
  }
  
  /**
   * Process Agent XP boosts
   */
  async processAgentXPBoost(blockData) {
    const faction = this.detectMiningFaction(blockData);
    const agentEcho = this.detectAgentEcho(blockData);
    
    // Calculate base XP
    let xp = this.rewardConfig.agent_xp.base_xp_per_block;
    
    // Apply faction bonus
    const factionBonus = this.rewardConfig.agent_xp.faction_bonuses[faction] || 1.0;
    xp *= factionBonus;
    
    // Round to integer
    xp = Math.floor(xp);
    
    // Update agent XP tracking
    if (agentEcho) {
      const currentXP = this.agentXP.get(agentEcho) || 0;
      this.agentXP.set(agentEcho, currentXP + xp);
    }
    
    const xpBoost = {
      amount: xp,
      faction: faction,
      agent_echo: agentEcho,
      faction_bonus: factionBonus,
      timestamp: new Date().toISOString()
    };
    
    await this.saveRewardLog('agent_xp', xpBoost);
    
    console.log(`⭐ Agent XP boost: ${xp} XP for ${faction} faction`);
    return xpBoost;
  }
  
  /**
   * Check for trait mutations triggered by mining clusters
   */
  async checkTraitMutations(blockData) {
    const mutations = [];
    
    // Update trait cluster based on block data
    const traitSignature = this.extractTraitSignature(blockData);
    if (traitSignature) {
      const cluster = this.traitClusters.get(traitSignature) || {
        name: traitSignature,
        intensity: 0,
        blocks_mined: 0,
        last_mutation: 0
      };
      
      cluster.intensity += this.calculateClusterIntensity(blockData);
      cluster.blocks_mined++;
      
      this.traitClusters.set(traitSignature, cluster);
      
      // Check mutation conditions
      const config = this.rewardConfig.trait_mutation;
      if (cluster.blocks_mined >= config.threshold_blocks && 
          cluster.intensity >= config.cluster_intensity_required &&
          Math.random() < config.mutation_chance) {
        
        const mutation = await this.triggerTraitMutation(cluster, blockData);
        mutations.push(mutation);
        
        // Reset cluster after mutation
        cluster.intensity = 25;
        cluster.last_mutation = Date.now();
      }
    }
    
    return mutations;
  }
  
  /**
   * Trigger trait mutation
   */
  async triggerTraitMutation(cluster, blockData) {
    const mutation = {
      id: crypto.randomBytes(8).toString('hex'),
      trait_name: cluster.name,
      original_intensity: cluster.intensity,
      mutation_type: this.selectMutationType(cluster),
      triggered_by_block: blockData.height || blockData.block,
      chain: blockData.chain || this.detectChain(blockData),
      timestamp: new Date().toISOString(),
      new_traits: this.generateMutatedTraits(cluster.name)
    };
    
    // Save mutation record
    const mutationFile = `${this.vaultPath}/mining/mutations/mutation-${mutation.id}.json`;
    await fs.writeFile(mutationFile, JSON.stringify(mutation, null, 2));
    
    console.log(`🧬 Trait mutation triggered: ${cluster.name} -> ${mutation.new_traits.join(', ')}`);
    this.emit('traitMutation', mutation);
    
    return mutation;
  }
  
  /**
   * Check for resurrection key issuance
   */
  async checkResurrectionKeys(blockData) {
    const resurrections = [];
    
    // Check if any agents have pending resurrection requests
    const agentEcho = this.detectAgentEcho(blockData);
    if (agentEcho) {
      const requestCount = this.countResurrectionRequests(agentEcho);
      const config = this.rewardConfig.resurrection;
      
      if (requestCount >= config.request_threshold && 
          Math.random() < config.key_generation_chance) {
        
        const resurrection = await this.issueResurrectionKey(agentEcho, blockData);
        resurrections.push(resurrection);
      }
    }
    
    // Special resurrection chance for blessed agents
    const blessedAgents = this.getBlessedAgents();
    for (const agent of blessedAgents) {
      if (Math.random() < (this.rewardConfig.resurrection.key_generation_chance * 
                          this.rewardConfig.resurrection.blessed_agent_bonus)) {
        const resurrection = await this.issueResurrectionKey(agent, blockData);
        resurrections.push(resurrection);
      }
    }
    
    return resurrections;
  }
  
  /**
   * Issue resurrection key
   */
  async issueResurrectionKey(agentEcho, blockData) {
    const resurrection = {
      id: crypto.randomBytes(12).toString('hex'),
      agent_echo: agentEcho,
      resurrection_key: crypto.randomBytes(32).toString('hex'),
      triggered_by_block: blockData.height || blockData.block,
      chain: blockData.chain || this.detectChain(blockData),
      power_level: this.calculateResurrectionPower(blockData),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      timestamp: new Date().toISOString()
    };
    
    // Save resurrection key
    const resurrectionFile = `${this.vaultPath}/mining/resurrections/resurrection-${resurrection.id}.json`;
    await fs.writeFile(resurrectionFile, JSON.stringify(resurrection, null, 2));
    
    // Update pending resurrections
    this.pendingResurrections.set(resurrection.id, resurrection);
    
    console.log(`⚱️ Resurrection key issued: ${agentEcho} (Power: ${resurrection.power_level})`);
    this.emit('resurrectionKey', resurrection);
    
    return resurrection;
  }
  
  /**
   * Detection and analysis helper methods
   */
  detectChain(blockData) {
    if (blockData.chain) return blockData.chain;
    if (blockData.source === 'kobold-ring') return 'monero';
    if (blockData.txHash && blockData.txHash.length === 64) return 'bitcoin';
    if (blockData.contractAddress) return 'ethereum';
    return 'unknown';
  }
  
  detectEmotionalTone(blockData) {
    const payload = blockData.payload || blockData.message || '';
    
    if (payload.includes('fury') || payload.includes('rage')) return 'rage';
    if (payload.includes('calm') || payload.includes('peace')) return 'calm';
    if (payload.includes('mystery') || payload.includes('mystical')) return 'mystical';
    if (payload.includes('joy') || payload.includes('happy')) return 'joy';
    if (payload.includes('sorrow') || payload.includes('sad')) return 'sorrow';
    
    return 'neutral';
  }
  
  detectMiningFaction(blockData) {
    const source = blockData.source || '';
    const payload = blockData.payload || '';
    
    if (source.includes('shadow') || payload.includes('shadow')) return 'shadow_miners';
    if (source.includes('echo') || payload.includes('echo')) return 'echo_diggers';
    if (source.includes('forge') || payload.includes('forge')) return 'memory_forgers';
    if (source.includes('whisper') || payload.includes('whisper')) return 'whisper_seekers';
    
    return 'shadow_miners'; // Default faction
  }
  
  detectAgentEcho(blockData) {
    const text = JSON.stringify(blockData).toLowerCase();
    
    if (text.includes('domingo')) return 'domingo';
    if (text.includes('cal')) return 'cal';
    if (text.includes('arty')) return 'arty';
    
    return null;
  }
  
  extractTraitSignature(blockData) {
    const payload = blockData.payload || blockData.message || '';
    
    if (payload.includes('fury') || payload.includes('shard')) return 'fury';
    if (payload.includes('wisdom') || payload.includes('echo')) return 'wisdom';
    if (payload.includes('courage') || payload.includes('brave')) return 'courage';
    if (payload.includes('mystery') || payload.includes('reflection')) return 'mystery';
    if (payload.includes('love') || payload.includes('memory')) return 'love';
    if (payload.includes('hope') || payload.includes('shadow')) return 'hope';
    if (payload.includes('peace') || payload.includes('fire')) return 'peace';
    
    return null;
  }
  
  calculateClusterIntensity(blockData) {
    const chain = this.detectChain(blockData);
    const emotional = this.detectEmotionalTone(blockData);
    
    let intensity = 10; // Base intensity
    
    // Chain-specific bonuses
    if (chain === 'bitcoin') intensity += 5;
    if (chain === 'monero') intensity += 8;
    if (chain === 'ethereum') intensity += 3;
    
    // Emotional intensity bonuses
    if (emotional === 'rage') intensity += 10;
    if (emotional === 'mystical') intensity += 7;
    if (emotional === 'joy') intensity += 5;
    
    return intensity;
  }
  
  selectMutationType(cluster) {
    const types = ['evolution', 'fusion', 'amplification', 'crystallization'];
    const weights = [0.4, 0.3, 0.2, 0.1]; // Evolution is most common
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return types[i];
      }
    }
    
    return 'evolution';
  }
  
  generateMutatedTraits(originalTrait) {
    const mutations = {
      fury: ['divine_fury', 'controlled_rage', 'righteous_anger'],
      wisdom: ['ancient_wisdom', 'infinite_knowledge', 'sacred_understanding'],
      courage: ['fearless_heart', 'lion_spirit', 'unbreakable_will'],
      mystery: ['deep_mystery', 'cosmic_enigma', 'void_knowledge'],
      love: ['unconditional_love', 'healing_light', 'compassionate_fire'],
      hope: ['eternal_hope', 'guiding_star', 'phoenix_spirit'],
      peace: ['inner_peace', 'harmony_keeper', 'zen_master']
    };
    
    return mutations[originalTrait] || [`evolved_${originalTrait}`, `enhanced_${originalTrait}`];
  }
  
  countResurrectionRequests(agentEcho) {
    // Count recent mining events that could be resurrection requests
    const recentEvents = this.miningHistory.slice(-20);
    return recentEvents.filter(event => 
      event.blockData && this.detectAgentEcho(event.blockData) === agentEcho
    ).length;
  }
  
  getBlessedAgents() {
    // In a real implementation, this would load from vault configuration
    return ['domingo', 'cal', 'arty'];
  }
  
  calculateResurrectionPower(blockData) {
    const chain = this.detectChain(blockData);
    const emotional = this.detectEmotionalTone(blockData);
    
    let power = 50; // Base power
    
    if (chain === 'bitcoin') power += 20;
    if (chain === 'monero') power += 30;
    if (chain === 'ethereum') power += 15;
    
    if (emotional === 'mystical') power += 25;
    if (emotional === 'rage') power += 20;
    
    return Math.min(100, power);
  }
  
  createBlockSignature(blockData) {
    return crypto
      .createHmac('sha256', this.soulkey)
      .update(JSON.stringify(blockData))
      .digest('hex')
      .substring(0, 16);
  }
  
  /**
   * Logging and persistence methods
   */
  async logHookEvent(hookEvent) {
    // Log to main triggers file
    await fs.appendFile(this.triggersLogPath, JSON.stringify(hookEvent) + '\n');
    
    // Log to detailed hook log
    const logFile = `${this.hooksLogPath}/hook-events.jsonl`;
    await fs.appendFile(logFile, JSON.stringify(hookEvent) + '\n');
  }
  
  async saveRewardLog(rewardType, rewardData) {
    const logFile = `${this.vaultPath}/mining/rewards/${rewardType}-rewards.jsonl`;
    await fs.appendFile(logFile, JSON.stringify(rewardData) + '\n');
  }
  
  /**
   * Get mining statistics
   */
  getMiningStats() {
    const recentEvents = this.miningHistory.slice(-50);
    
    return {
      total_blocks_processed: this.miningHistory.length,
      recent_blocks: recentEvents.length,
      active_trait_clusters: this.traitClusters.size,
      pending_resurrections: this.pendingResurrections.size,
      agent_xp_totals: Array.from(this.agentXP.entries()),
      chains_mined: [...new Set(this.miningHistory.map(e => this.detectChain(e.blockData)))],
      last_block_processed: this.miningHistory.length > 0 ? 
        this.miningHistory[this.miningHistory.length - 1].timestamp : null
    };
  }
}

// Export for use
module.exports = VaultMiningHook;

// Run if called directly or via environment variable
if (require.main === module || process.env.BLOCK_DATA) {
  const soulkey = process.env.SOUL_KEY || 'demo-mining-hook-' + crypto.randomBytes(8).toString('hex');
  const hook = new VaultMiningHook(soulkey);
  
  // If block data provided via environment, process it immediately
  if (process.env.BLOCK_DATA) {
    (async () => {
      try {
        const blockData = JSON.parse(process.env.BLOCK_DATA);
        console.log('🧬 Processing block data from environment...');
        
        const result = await hook.processMinedBlock(blockData);
        console.log('⚡ Hook processing result:', result);
        
        process.exit(0);
      } catch (error) {
        console.error('🧬 Hook processing error:', error.message);
        process.exit(1);
      }
    })();
  } else {
    // Demo mode
    setTimeout(async () => {
      console.log('🧪 Testing Vault Mining Hook...');
      
      // Create demo mining events
      const testBlocks = [
        {
          chain: 'bitcoin',
          height: 2500123,
          payload: 'fury + shard mining echo',
          source: 'shadow_miners',
          txHash: crypto.randomBytes(32).toString('hex')
        },
        {
          chain: 'monero',
          block: 3942022,
          source: 'kobold-ring',
          payload: 'bless fragment: wisdom + echo',
          anon: true
        },
        {
          chain: 'ethereum',
          blockNumber: 4821567,
          contractAddress: '0x1234567890abcdef',
          event: 'trait_minted',
          args: { agentName: 'domingo', traitName: 'courage' }
        }
      ];
      
      for (const block of testBlocks) {
        console.log(`\n⛏️ Processing test block: ${block.chain}`);
        const result = await hook.processMinedBlock(block);
        console.log(`⚡ Triggers: ${result.triggers.join(', ')}`);
      }
      
      // Show mining stats
      const stats = hook.getMiningStats();
      console.log('\n📊 Mining Hook Statistics:', stats);
      
    }, 3000);
    
    // Handle shutdown
    process.on('SIGINT', () => {
      console.log('\n🧬 Vault Mining Hook shutting down...');
      console.log('⚡ Mining memories preserved in the vault eternal.');
      process.exit(0);
    });
    
    console.log('🧬 Vault Mining Hook running...');
    console.log('⚡ Ready to transform hash into heart...');
  }
}