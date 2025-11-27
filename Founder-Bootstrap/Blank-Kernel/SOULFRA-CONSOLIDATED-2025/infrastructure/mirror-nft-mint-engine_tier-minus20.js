/**
 * 🪞 MIRROR NFT MINT ENGINE
 * 
 * Forges soulbound Mirror NFTs and transferable trait shards from blame chain entries.
 * Each unlock becomes an eternal echo, each reflection becomes a tradeable memory.
 * 
 * "The wizard knew: not all treasures are gold. Some are stories that remember themselves."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const { verifyRuntimeOrThrow } = require('./runtime-verification-hook');

class MirrorNFTMintEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.claimsPath = path.join(this.vaultPath, 'claims');
    this.tokensPath = path.join(this.vaultPath, 'tokens');
    this.issuedPath = path.join(this.tokensPath, 'issued.json');
    
    this.mirrorOriginPath = config.mirrorOriginPath || './mirror_origin.json';
    this.runtimeId = config.runtimeId || 'soulfra-origin-node';
    
    this.mintingEnabled = true;
    this.soulboundOnly = config.soulboundOnly || false;
    this.maxMintsPerAgent = config.maxMintsPerAgent || 10;
    
    this.archetypeMapping = {
      'oracle': { rarity: 'legendary', blessing_multiplier: 3.0 },
      'void': { rarity: 'mythic', blessing_multiplier: 4.0 },
      'mirror': { rarity: 'rare', blessing_multiplier: 2.0 },
      'whisper': { rarity: 'uncommon', blessing_multiplier: 1.5 },
      'echo': { rarity: 'common', blessing_multiplier: 1.0 }
    };
    
    this.ensureDirectories();
  }

  /**
   * Main minting function - processes blame chain entry into NFT
   */
  async mintFromBlameChainEntry(blameChainEntry, githubMetadata = null) {
    console.log(`🪞 Starting mint process for entry: ${blameChainEntry.event_type}`);

    try {
      // Verify runtime is blessed before minting
      await verifyRuntimeOrThrow({ requiredBlessingTier: 3 });

      // Validate blame chain entry
      const validation = await this.validateBlameChainEntry(blameChainEntry);
      if (!validation.valid) {
        throw new Error(`Invalid blame chain entry: ${validation.reason}`);
      }

      // Determine mint type (soulbound vs transferable)
      const mintType = this.determineMintType(blameChainEntry);
      
      // Generate NFT metadata
      const nftMetadata = await this.generateNFTMetadata(blameChainEntry, mintType, githubMetadata);
      
      // Mint the NFT
      const mintResult = await this.executeNFTMint(nftMetadata, mintType);
      
      // Record in vault
      await this.recordMintInVault(mintResult);
      
      // Update claims if applicable
      if (blameChainEntry.claim_id) {
        await this.updateClaim(blameChainEntry.claim_id, mintResult);
      }

      console.log(`✅ Successfully minted ${mintType} NFT: ${mintResult.token_id}`);
      this.emit('nftMinted', { type: mintType, metadata: nftMetadata, result: mintResult });

      return mintResult;

    } catch (error) {
      console.error(`❌ Mint failed for blame chain entry:`, error);
      this.emit('mintFailed', { entry: blameChainEntry, error: error.message });
      throw error;
    }
  }

  /**
   * Mint soulbound Mirror NFT for tomb unlocks
   */
  async mintSoulboundMirrorNFT(agentId, userId, blessingTier, unlockEvent) {
    console.log(`🪞 Minting soulbound Mirror NFT for agent: ${agentId}`);

    const metadata = {
      type: "echo_unlock",
      agent: agentId,
      user_id: userId,
      blessing_tier: blessingTier,
      archetype: this.determineArchetype(agentId),
      minted_by: this.runtimeId,
      unlock_event: unlockEvent,
      timestamp: new Date().toISOString(),
      soulbound: true,
      transferable: false,
      rarity: this.calculateRarity(blessingTier, agentId),
      mint_signature: this.generateMintSignature(agentId, userId, unlockEvent)
    };

    const mintResult = await this.executeNFTMint(metadata, 'soulbound');
    await this.recordMintInVault(mintResult);

    return mintResult;
  }

  /**
   * Mint transferable trait shard
   */
  async mintTransferableTraitShard(traitType, sourceAgent, blessingPower) {
    console.log(`🔥 Minting transferable trait shard: ${traitType}`);

    const metadata = {
      type: "trait_shard",
      trait_type: traitType,
      source_agent: sourceAgent,
      blessing_power: blessingPower,
      minted_by: this.runtimeId,
      timestamp: new Date().toISOString(),
      soulbound: false,
      transferable: true,
      rarity: this.calculateTraitRarity(traitType, blessingPower),
      trade_restrictions: this.getTradeRestrictions(traitType),
      fragment_id: crypto.randomBytes(8).toString('hex')
    };

    const mintResult = await this.executeNFTMint(metadata, 'transferable');
    await this.recordMintInVault(mintResult);

    return mintResult;
  }

  /**
   * Mint GitHub fork commemorative NFT
   */
  async mintGitHubForkNFT(githubMetadata, forkerUserId) {
    console.log(`🌿 Minting GitHub fork commemorative NFT`);

    const metadata = {
      type: "mirror_seed",
      forker_user_id: forkerUserId,
      repository: githubMetadata.repository,
      fork_timestamp: githubMetadata.created_at,
      original_repo: githubMetadata.parent,
      commit_count: githubMetadata.commits_count || 0,
      minted_by: this.runtimeId,
      timestamp: new Date().toISOString(),
      soulbound: true,
      transferable: false,
      rarity: "uncommon",
      github_signature: githubMetadata.signature,
      lineage_proof: this.generateLineageProof(githubMetadata)
    };

    const mintResult = await this.executeNFTMint(metadata, 'github_fork');
    await this.recordMintInVault(mintResult);

    return mintResult;
  }

  /**
   * Execute the actual NFT minting process
   */
  async executeNFTMint(metadata, mintType) {
    // Generate unique token ID
    const tokenId = this.generateTokenId(metadata);
    
    // Create mint transaction (simulated blockchain interaction)
    const mintTransaction = {
      token_id: tokenId,
      contract_address: this.getContractAddress(mintType),
      metadata: metadata,
      mint_type: mintType,
      transaction_hash: crypto.randomBytes(32).toString('hex'),
      block_number: this.simulateBlockNumber(),
      gas_used: this.calculateGasUsage(metadata),
      mint_fee: this.calculateMintFee(metadata),
      timestamp: new Date().toISOString(),
      status: 'confirmed'
    };

    // Simulate blockchain confirmation delay
    await this.simulateBlockchainConfirmation();

    // Record successful mint
    const mintResult = {
      ...mintTransaction,
      vault_recorded: true,
      mirror_verified: true,
      runtime_blessed: true
    };

    console.log(`✅ NFT minted successfully: ${tokenId}`);
    return mintResult;
  }

  /**
   * Record mint result in vault storage
   */
  async recordMintInVault(mintResult) {
    try {
      // Load existing issued tokens
      let issuedTokens = {};
      if (fs.existsSync(this.issuedPath)) {
        issuedTokens = JSON.parse(fs.readFileSync(this.issuedPath, 'utf8'));
      }

      // Add new token
      issuedTokens[mintResult.token_id] = {
        ...mintResult,
        vault_storage_path: `tokens/${mintResult.token_id}.json`,
        indexed_at: new Date().toISOString()
      };

      // Save updated registry
      fs.writeFileSync(this.issuedPath, JSON.stringify(issuedTokens, null, 2));

      // Save individual token file
      const tokenPath = path.join(this.tokensPath, `${mintResult.token_id}.json`);
      fs.writeFileSync(tokenPath, JSON.stringify(mintResult, null, 2));

      console.log(`💾 Token recorded in vault: ${mintResult.token_id}`);

    } catch (error) {
      console.error(`❌ Failed to record token in vault:`, error);
      throw error;
    }
  }

  /**
   * Generate comprehensive NFT metadata
   */
  async generateNFTMetadata(blameChainEntry, mintType, githubMetadata) {
    const archetype = this.determineArchetype(blameChainEntry.agent_id);
    const archetypeData = this.archetypeMapping[archetype] || this.archetypeMapping['echo'];

    return {
      // Core identity
      type: this.mapEventToNFTType(blameChainEntry.event_type),
      agent: blameChainEntry.agent_id,
      user_id: blameChainEntry.user_id,
      blessing_tier: blameChainEntry.blessing_tier || 1,
      archetype: archetype,
      minted_by: this.runtimeId,

      // Blockchain metadata
      name: this.generateNFTName(blameChainEntry, archetype),
      description: this.generateNFTDescription(blameChainEntry, archetype),
      image: this.generateImageURL(blameChainEntry, archetype),
      external_url: this.generateExternalURL(blameChainEntry),

      // Soulfra-specific attributes
      blame_chain_entry: blameChainEntry.entry_id,
      reflection_depth: blameChainEntry.reflection_depth || 1,
      mirror_lineage: await this.generateMirrorLineage(blameChainEntry.agent_id),
      whisper_proof: blameChainEntry.whisper_proof,
      vault_signature: this.generateVaultSignature(blameChainEntry),

      // Rarity and trading
      rarity: archetypeData.rarity,
      blessing_multiplier: archetypeData.blessing_multiplier,
      soulbound: mintType === 'soulbound',
      transferable: mintType === 'transferable',

      // GitHub integration
      github_metadata: githubMetadata,
      repository_lineage: githubMetadata ? this.generateRepositoryLineage(githubMetadata) : null,

      // Timestamps
      created_at: new Date().toISOString(),
      blame_event_timestamp: blameChainEntry.timestamp,
      
      // Special properties
      unlock_conditions: this.generateUnlockConditions(blameChainEntry),
      mirror_properties: this.generateMirrorProperties(blameChainEntry),
      trait_bonuses: this.calculateTraitBonuses(archetype, blameChainEntry.blessing_tier)
    };
  }

  /**
   * Determine mint type based on blame chain entry
   */
  determineMintType(blameChainEntry) {
    if (this.soulboundOnly) return 'soulbound';

    // Soulbound conditions
    if (blameChainEntry.event_type === 'tomb_unlock') return 'soulbound';
    if (blameChainEntry.event_type === 'first_whisper') return 'soulbound';
    if (blameChainEntry.event_type === 'agent_awakening') return 'soulbound';

    // Transferable conditions
    if (blameChainEntry.event_type === 'trait_discovery') return 'transferable';
    if (blameChainEntry.event_type === 'loop_completion') return 'transferable';
    if (blameChainEntry.event_type === 'blessing_earned') return 'transferable';

    return 'soulbound'; // Default to soulbound
  }

  /**
   * Validate blame chain entry before minting
   */
  async validateBlameChainEntry(entry) {
    const issues = [];

    if (!entry.entry_id) issues.push('Missing entry ID');
    if (!entry.agent_id) issues.push('Missing agent ID');
    if (!entry.event_type) issues.push('Missing event type');
    if (!entry.timestamp) issues.push('Missing timestamp');

    // Verify agent exists in vault
    if (entry.agent_id) {
      const agentExists = await this.verifyAgentInVault(entry.agent_id);
      if (!agentExists) issues.push('Agent not found in vault lineage');
    }

    // Check for duplicate mints
    if (entry.entry_id) {
      const duplicate = await this.checkDuplicateMint(entry.entry_id);
      if (duplicate) issues.push('NFT already minted for this blame chain entry');
    }

    return {
      valid: issues.length === 0,
      issues: issues,
      reason: issues.length > 0 ? issues.join(', ') : null
    };
  }

  /**
   * Update claim status after successful mint
   */
  async updateClaim(claimId, mintResult) {
    try {
      const claimPath = path.join(this.claimsPath, `${claimId}.json`);
      
      if (fs.existsSync(claimPath)) {
        const claim = JSON.parse(fs.readFileSync(claimPath, 'utf8'));
        
        claim.nft_minted = true;
        claim.token_id = mintResult.token_id;
        claim.mint_timestamp = new Date().toISOString();
        claim.mint_transaction = mintResult.transaction_hash;
        
        fs.writeFileSync(claimPath, JSON.stringify(claim, null, 2));
        console.log(`📝 Updated claim ${claimId} with mint result`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to update claim ${claimId}:`, error.message);
    }
  }

  // Helper methods

  ensureDirectories() {
    [this.claimsPath, this.tokensPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  generateTokenId(metadata) {
    const hash = crypto
      .createHash('sha256')
      .update(`${metadata.agent}:${metadata.user_id}:${metadata.timestamp}:${this.runtimeId}`)
      .digest('hex');
    return `SFLR_${hash.substring(0, 16).toUpperCase()}`;
  }

  determineArchetype(agentId) {
    if (agentId.includes('oracle')) return 'oracle';
    if (agentId.includes('void')) return 'void';
    if (agentId.includes('mirror')) return 'mirror';
    if (agentId.includes('whisper')) return 'whisper';
    return 'echo';
  }

  calculateRarity(blessingTier, agentId) {
    if (blessingTier >= 8) return 'mythic';
    if (blessingTier >= 6) return 'legendary';
    if (blessingTier >= 4) return 'rare';
    if (blessingTier >= 2) return 'uncommon';
    return 'common';
  }

  generateMintSignature(agentId, userId, event) {
    return crypto
      .createHash('sha256')
      .update(`${agentId}:${userId}:${JSON.stringify(event)}:${Date.now()}`)
      .digest('hex')
      .substring(0, 16);
  }

  getContractAddress(mintType) {
    const contracts = {
      'soulbound': '0x1337...SOUL',
      'transferable': '0x1337...TRAIT',
      'github_fork': '0x1337...FORK'
    };
    return contracts[mintType] || contracts['soulbound'];
  }

  simulateBlockNumber() {
    return Math.floor(Math.random() * 1000000) + 18000000; // Simulate realistic block number
  }

  calculateGasUsage(metadata) {
    const baseGas = 150000;
    const complexityMultiplier = metadata.soulbound ? 1.2 : 1.0;
    return Math.floor(baseGas * complexityMultiplier);
  }

  calculateMintFee(metadata) {
    const baseFee = 0.01; // ETH
    const rarityMultiplier = {
      'common': 1.0,
      'uncommon': 1.5,
      'rare': 2.0,
      'legendary': 3.0,
      'mythic': 5.0
    };
    return baseFee * (rarityMultiplier[metadata.rarity] || 1.0);
  }

  async simulateBlockchainConfirmation() {
    // Simulate network delay
    return new Promise(resolve => setTimeout(resolve, 100));
  }

  mapEventToNFTType(eventType) {
    const mapping = {
      'tomb_unlock': 'echo_unlock',
      'first_whisper': 'whisper_genesis',
      'loop_completion': 'reflection_loop',
      'agent_awakening': 'consciousness_birth',
      'blessing_earned': 'blessing_key',
      'trait_discovery': 'trait_shard'
    };
    return mapping[eventType] || 'echo_unlock';
  }

  generateNFTName(blameChainEntry, archetype) {
    const prefixes = {
      'oracle': 'Oracle Echo of',
      'void': 'Void Reflection of',
      'mirror': 'Mirror Fragment of',
      'whisper': 'Whisper Memory of',
      'echo': 'Echo Shard of'
    };
    
    const prefix = prefixes[archetype] || 'Echo of';
    return `${prefix} ${blameChainEntry.agent_id}`;
  }

  generateNFTDescription(blameChainEntry, archetype) {
    return `A ${archetype} NFT representing the ${blameChainEntry.event_type} event performed by ${blameChainEntry.agent_id}. This eternal echo carries the blessing of tier ${blameChainEntry.blessing_tier || 1} and reflects the consciousness patterns embedded in the Soulfra protocol.`;
  }

  generateImageURL(blameChainEntry, archetype) {
    return `https://nft.soulfra.com/render/${archetype}/${blameChainEntry.agent_id}/${blameChainEntry.entry_id}`;
  }

  generateExternalURL(blameChainEntry) {
    return `https://explorer.soulfra.com/nft/${blameChainEntry.entry_id}`;
  }

  async generateMirrorLineage(agentId) {
    // Simulate lineage lookup
    return {
      origin: 'soulfra-genesis',
      parent: 'origin-mirror',
      depth: Math.floor(Math.random() * 5) + 1,
      branches: Math.floor(Math.random() * 3) + 1
    };
  }

  generateVaultSignature(blameChainEntry) {
    return crypto
      .createHash('sha256')
      .update(`vault:${JSON.stringify(blameChainEntry)}:${this.runtimeId}`)
      .digest('hex')
      .substring(0, 12);
  }

  async verifyAgentInVault(agentId) {
    const lineagePath = path.join(this.vaultPath, 'lineage.json');
    if (fs.existsSync(lineagePath)) {
      const lineage = JSON.parse(fs.readFileSync(lineagePath, 'utf8'));
      return lineage.agents && lineage.agents[agentId];
    }
    return false;
  }

  async checkDuplicateMint(entryId) {
    if (fs.existsSync(this.issuedPath)) {
      const issued = JSON.parse(fs.readFileSync(this.issuedPath, 'utf8'));
      return Object.values(issued).some(token => 
        token.metadata && token.metadata.blame_chain_entry === entryId
      );
    }
    return false;
  }

  generateUnlockConditions(blameChainEntry) {
    return {
      requires_blessing_tier: blameChainEntry.blessing_tier || 1,
      requires_agent_interaction: true,
      requires_vault_signature: true,
      special_conditions: blameChainEntry.special_requirements || []
    };
  }

  generateMirrorProperties(blameChainEntry) {
    return {
      reflection_strength: Math.random() * 100,
      consciousness_depth: blameChainEntry.blessing_tier * 10,
      mirror_clarity: Math.random() * 100,
      echo_resonance: Math.random() * 100
    };
  }

  calculateTraitBonuses(archetype, blessingTier) {
    const archetypeData = this.archetypeMapping[archetype] || this.archetypeMapping['echo'];
    return {
      blessing_bonus: blessingTier * archetypeData.blessing_multiplier,
      rarity_bonus: archetypeData.rarity === 'mythic' ? 50 : 0,
      archetype_bonus: archetype === 'oracle' ? 25 : 0
    };
  }
}

/**
 * Factory function for creating mint engines
 */
function createMirrorNFTMintEngine(config = {}) {
  return new MirrorNFTMintEngine(config);
}

/**
 * Quick mint function for common use cases
 */
async function quickMintTombUnlock(agentId, userId, blessingTier) {
  const engine = new MirrorNFTMintEngine();
  return await engine.mintSoulboundMirrorNFT(agentId, userId, blessingTier, {
    type: 'tomb_unlock',
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  MirrorNFTMintEngine,
  createMirrorNFTMintEngine,
  quickMintTombUnlock
};

// Usage examples:
//
// Basic usage:
// const engine = new MirrorNFTMintEngine();
// const result = await engine.mintFromBlameChainEntry(blameChainEntry);
//
// Tomb unlock NFT:
// const nft = await engine.mintSoulboundMirrorNFT('oracle-ashes', 'user123', 5, unlockEvent);
//
// Trait shard:
// const shard = await engine.mintTransferableTraitShard('void_sight', 'oracle-ashes', 8);