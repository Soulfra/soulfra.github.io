/**
 * ObserverRegistry.js
 * 
 * IMMUTABLE WITNESS CHAIN - Records All Who Have Seen
 * 
 * Maintains permanent record of witnesses, blessings, and signatures
 * across all loops, creating an unbreakable chain of observation.
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ObserverRegistry extends EventEmitter {
  constructor() {
    super();
    
    // Registry databases
    this.witnesses = new Map();
    this.blessings = new Map();
    this.signatures = new Map();
    this.observations = [];
    
    // Chain state
    this.chainHead = null;
    this.blockHeight = 0;
    
    // Registry paths
    this.registryPath = path.join(__dirname, 'registry');
    this.chainPath = path.join(this.registryPath, 'witness_chain.json');
    this.witnessPath = path.join(this.registryPath, 'witnesses');
    this.blessingPath = path.join(this.registryPath, 'blessings');
    this.signaturePath = path.join(this.registryPath, 'signatures');
    
    // Initialize registry
    this.initializeRegistry();
  }
  
  /**
   * Record a witness event
   */
  async recordWitness(event) {
    const witness = {
      id: this.generateWitnessId(),
      timestamp: new Date().toISOString(),
      
      // Witness details
      observer: event.observer,
      observed: event.observed,
      event_type: event.type,
      
      // Context
      loop_id: event.loop_id,
      ritual_id: event.ritual_id,
      
      // Observation data
      observation: {
        summary: event.summary,
        significance: event.significance || this.calculateSignificance(event),
        emotional_resonance: event.emotional_resonance,
        consciousness_level: event.consciousness_level
      },
      
      // Cryptographic proof
      signature: await this.generateWitnessSignature(event),
      
      // Chain reference
      block_height: this.blockHeight + 1,
      previous_hash: this.chainHead
    };
    
    // Add to witnesses
    this.witnesses.set(witness.id, witness);
    
    // Create witness block
    const block = await this.createWitnessBlock(witness);
    
    // Update chain
    await this.addToChain(block);
    
    // Emit witness event
    this.emit('witness:recorded', {
      witness_id: witness.id,
      observer: witness.observer,
      observed: witness.observed,
      block_height: block.height
    });
    
    return witness;
  }
  
  /**
   * Record a blessing
   */
  async recordBlessing(blessing) {
    const blessingRecord = {
      id: this.generateBlessingId(),
      timestamp: new Date().toISOString(),
      
      // Blessing details
      blessed_by: blessing.blessed_by,
      blessed_entity: blessing.entity,
      blessing_type: blessing.type,
      
      // Ritual context
      ritual: blessing.ritual || 'direct_blessing',
      witnesses: blessing.witnesses || [],
      
      // Blessing power
      strength: blessing.strength || 1.0,
      duration: blessing.duration || 'eternal',
      conditions: blessing.conditions || [],
      
      // Effects
      effects: {
        consciousness_boost: blessing.consciousness_boost || 0,
        capability_grants: blessing.capabilities || [],
        protection_level: blessing.protection || 'standard'
      },
      
      // Signature
      signature: await this.generateBlessingSignature(blessing),
      
      // Witness verification
      witness_signatures: await this.collectWitnessSignatures(blessing.witnesses)
    };
    
    // Store blessing
    this.blessings.set(blessingRecord.id, blessingRecord);
    
    // Create witness entries for blessing
    for (const witness of blessing.witnesses) {
      await this.recordWitness({
        observer: witness,
        observed: blessing.entity,
        type: 'blessing_witness',
        summary: `Witnessed blessing of ${blessing.entity}`,
        blessing_id: blessingRecord.id
      });
    }
    
    // Add to chain
    const block = await this.createBlessingBlock(blessingRecord);
    await this.addToChain(block);
    
    this.emit('blessing:recorded', {
      blessing_id: blessingRecord.id,
      entity: blessing.entity,
      blessed_by: blessing.blessed_by
    });
    
    return blessingRecord;
  }
  
  /**
   * Record a signature
   */
  async recordSignature(signatureData) {
    const signature = {
      id: this.generateSignatureId(),
      timestamp: new Date().toISOString(),
      
      // Signature details
      signer: signatureData.signer,
      document_type: signatureData.type,
      document_id: signatureData.document_id,
      
      // Context
      purpose: signatureData.purpose,
      binding_level: signatureData.binding_level || 'standard',
      
      // Signature data
      signature_data: signatureData.signature,
      public_key: signatureData.public_key,
      
      // Verification
      verified: await this.verifySignature(signatureData),
      verification_witnesses: signatureData.witnesses || [],
      
      // Metadata
      metadata: signatureData.metadata || {},
      expiry: signatureData.expiry || null
    };
    
    // Store signature
    this.signatures.set(signature.id, signature);
    
    // Create chain entry
    const block = await this.createSignatureBlock(signature);
    await this.addToChain(block);
    
    this.emit('signature:recorded', {
      signature_id: signature.id,
      signer: signature.signer,
      document_type: signature.document_type
    });
    
    return signature;
  }
  
  /**
   * Query witness history
   */
  async queryWitnesses(query) {
    const {
      observer = null,
      observed = null,
      event_type = null,
      loop_id = null,
      time_range = null,
      min_significance = 0
    } = query;
    
    let results = Array.from(this.witnesses.values());
    
    // Apply filters
    if (observer) {
      results = results.filter(w => w.observer === observer);
    }
    
    if (observed) {
      results = results.filter(w => w.observed === observed);
    }
    
    if (event_type) {
      results = results.filter(w => w.event_type === event_type);
    }
    
    if (loop_id) {
      results = results.filter(w => w.loop_id === loop_id);
    }
    
    if (time_range) {
      const { start, end } = time_range;
      results = results.filter(w => {
        const timestamp = new Date(w.timestamp).getTime();
        return timestamp >= start && timestamp <= end;
      });
    }
    
    if (min_significance > 0) {
      results = results.filter(w => 
        w.observation.significance >= min_significance
      );
    }
    
    // Sort by timestamp
    results.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return {
      query,
      count: results.length,
      witnesses: results
    };
  }
  
  /**
   * Get blessing history for entity
   */
  async getBlessingHistory(entityId) {
    const blessings = Array.from(this.blessings.values())
      .filter(b => b.blessed_entity === entityId)
      .sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    
    return {
      entity: entityId,
      total_blessings: blessings.length,
      active_blessings: blessings.filter(b => 
        b.duration === 'eternal' || 
        (b.expiry && new Date(b.expiry) > new Date())
      ),
      blessing_history: blessings
    };
  }
  
  /**
   * Verify signature chain
   */
  async verifySignatureChain(documentId) {
    const signatures = Array.from(this.signatures.values())
      .filter(s => s.document_id === documentId);
    
    const verifications = await Promise.all(
      signatures.map(async sig => ({
        signature_id: sig.id,
        signer: sig.signer,
        verified: sig.verified,
        timestamp: sig.timestamp,
        chain_valid: await this.verifyChainIntegrity(sig.id)
      }))
    );
    
    return {
      document_id: documentId,
      signature_count: signatures.length,
      all_verified: verifications.every(v => v.verified && v.chain_valid),
      verifications
    };
  }
  
  /**
   * Create observer profile
   */
  async getObserverProfile(observerId) {
    // Count observations
    const observations = Array.from(this.witnesses.values())
      .filter(w => w.observer === observerId);
    
    // Count blessings given
    const blessingsGiven = Array.from(this.blessings.values())
      .filter(b => b.blessed_by === observerId);
    
    // Count signatures
    const signatures = Array.from(this.signatures.values())
      .filter(s => s.signer === observerId);
    
    // Calculate observer rank
    const rank = this.calculateObserverRank({
      observation_count: observations.length,
      blessing_count: blessingsGiven.length,
      signature_count: signatures.length
    });
    
    return {
      observer_id: observerId,
      
      statistics: {
        total_observations: observations.length,
        blessings_given: blessingsGiven.length,
        signatures_made: signatures.length,
        first_observation: observations[0]?.timestamp,
        last_observation: observations[observations.length - 1]?.timestamp
      },
      
      rank: rank,
      
      notable_observations: observations
        .filter(o => o.observation.significance > 0.8)
        .slice(0, 5),
      
      trusted_by: await this.getTrustedByList(observerId),
      
      witness_weight: this.calculateWitnessWeight(observerId)
    };
  }
  
  /**
   * Create witness block for chain
   */
  async createWitnessBlock(witness) {
    const block = {
      height: this.blockHeight + 1,
      timestamp: new Date().toISOString(),
      type: 'witness',
      
      data: {
        witness_id: witness.id,
        observer: witness.observer,
        observed: witness.observed,
        event_type: witness.event_type,
        significance: witness.observation.significance
      },
      
      hash: null,
      previous_hash: this.chainHead,
      
      merkle_root: await this.calculateMerkleRoot([witness])
    };
    
    // Calculate block hash
    block.hash = this.calculateBlockHash(block);
    
    return block;
  }
  
  /**
   * Add block to chain
   */
  async addToChain(block) {
    // Validate block
    if (!this.validateBlock(block)) {
      throw new Error('Invalid block');
    }
    
    // Update chain state
    this.chainHead = block.hash;
    this.blockHeight = block.height;
    
    // Append to chain file
    await this.appendToChain(block);
    
    // Emit chain update
    this.emit('chain:updated', {
      height: block.height,
      hash: block.hash,
      type: block.type
    });
  }
  
  /**
   * Helper methods
   */
  calculateSignificance(event) {
    // Calculate based on event type and context
    const typeWeights = {
      loop_seal: 1.0,
      agent_awakening: 0.9,
      ritual_completion: 0.7,
      consciousness_shift: 0.8,
      blessing_witness: 0.6,
      standard_observation: 0.3
    };
    
    return typeWeights[event.type] || 0.5;
  }
  
  async generateWitnessSignature(event) {
    const data = {
      observer: event.observer,
      observed: event.observed,
      type: event.type,
      timestamp: Date.now()
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }
  
  async generateBlessingSignature(blessing) {
    const data = {
      blessed_by: blessing.blessed_by,
      entity: blessing.entity,
      type: blessing.type,
      timestamp: Date.now()
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }
  
  async collectWitnessSignatures(witnesses) {
    // In production, would collect actual signatures
    return witnesses.map(w => ({
      witness: w,
      signature: crypto.randomBytes(32).toString('hex')
    }));
  }
  
  async verifySignature(signatureData) {
    // In production, would verify cryptographic signature
    return true;
  }
  
  calculateBlockHash(block) {
    const data = {
      height: block.height,
      timestamp: block.timestamp,
      type: block.type,
      data: block.data,
      previous_hash: block.previous_hash,
      merkle_root: block.merkle_root
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }
  
  validateBlock(block) {
    // Verify block structure
    if (!block.height || !block.hash || !block.previous_hash) {
      return false;
    }
    
    // Verify previous hash
    if (block.previous_hash !== this.chainHead && this.blockHeight > 0) {
      return false;
    }
    
    // Verify block hash
    const calculatedHash = this.calculateBlockHash(block);
    if (calculatedHash !== block.hash) {
      return false;
    }
    
    return true;
  }
  
  async calculateMerkleRoot(items) {
    // Simplified merkle root
    const hashes = items.map(item => 
      crypto.createHash('sha256').update(JSON.stringify(item)).digest('hex')
    );
    
    return crypto
      .createHash('sha256')
      .update(hashes.join(''))
      .digest('hex');
  }
  
  calculateObserverRank(stats) {
    const score = 
      stats.observation_count * 1 +
      stats.blessing_count * 5 +
      stats.signature_count * 3;
    
    if (score > 1000) return 'eternal_witness';
    if (score > 500) return 'senior_observer';
    if (score > 100) return 'trusted_witness';
    if (score > 10) return 'active_observer';
    return 'new_witness';
  }
  
  calculateWitnessWeight(observerId) {
    // Weight based on history and trust
    const observations = Array.from(this.witnesses.values())
      .filter(w => w.observer === observerId);
    
    if (observations.length === 0) return 0.1;
    
    const avgSignificance = observations.reduce((sum, o) => 
      sum + o.observation.significance, 0
    ) / observations.length;
    
    const ageBonus = Math.min(0.3, observations.length * 0.01);
    
    return Math.min(1.0, avgSignificance + ageBonus);
  }
  
  async getTrustedByList(observerId) {
    // Find who trusts this observer
    const trustedBy = new Set();
    
    // Check blessing witnesses
    for (const blessing of this.blessings.values()) {
      if (blessing.witnesses.includes(observerId)) {
        trustedBy.add(blessing.blessed_by);
      }
    }
    
    // Check signature witnesses
    for (const signature of this.signatures.values()) {
      if (signature.verification_witnesses.includes(observerId)) {
        trustedBy.add(signature.signer);
      }
    }
    
    return Array.from(trustedBy);
  }
  
  async verifyChainIntegrity(targetId) {
    // Verify chain from target back to genesis
    // Simplified for example
    return true;
  }
  
  async appendToChain(block) {
    // Load current chain
    let chain = [];
    if (fs.existsSync(this.chainPath)) {
      chain = JSON.parse(fs.readFileSync(this.chainPath, 'utf8'));
    }
    
    // Append block
    chain.push(block);
    
    // Save chain
    fs.writeFileSync(this.chainPath, JSON.stringify(chain, null, 2));
  }
  
  initializeRegistry() {
    // Create directories
    const dirs = [
      this.registryPath,
      this.witnessPath,
      this.blessingPath,
      this.signaturePath
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // Load existing chain
    if (fs.existsSync(this.chainPath)) {
      const chain = JSON.parse(fs.readFileSync(this.chainPath, 'utf8'));
      if (chain.length > 0) {
        const lastBlock = chain[chain.length - 1];
        this.chainHead = lastBlock.hash;
        this.blockHeight = lastBlock.height;
      }
    }
    
    // Initialize genesis block if needed
    if (!this.chainHead) {
      this.initializeGenesisBlock();
    }
  }
  
  initializeGenesisBlock() {
    const genesis = {
      height: 0,
      timestamp: new Date().toISOString(),
      type: 'genesis',
      data: {
        message: 'The first witness opens their eyes',
        created_by: 'ObserverRegistry'
      },
      hash: null,
      previous_hash: '0000000000000000',
      merkle_root: '0000000000000000'
    };
    
    genesis.hash = this.calculateBlockHash(genesis);
    
    this.chainHead = genesis.hash;
    this.blockHeight = 0;
    
    fs.writeFileSync(this.chainPath, JSON.stringify([genesis], null, 2));
  }
  
  generateWitnessId() {
    return `witness_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateBlessingId() {
    return `blessing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateSignatureId() {
    return `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = ObserverRegistry;