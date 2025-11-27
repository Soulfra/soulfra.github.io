/**
 * SwipedDecisionRouter.js
 * 
 * THE SEAL OF TRUTH - Routes Human Decisions to Reality
 * 
 * Captures user decisions and routes them to appropriate storage:
 * loop records, ledger events, and public consent outputs.
 * Nothing enters the core without human confirmation.
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class SwipedDecisionRouter extends EventEmitter {
  constructor() {
    super();
    
    // Storage paths
    this.loopRecordPath = path.join(__dirname, 'loop_record.json');
    this.ledgerPath = path.join(__dirname, '../soulfra-ledger/events');
    this.domingoPath = path.join(__dirname, '../domingo-reflections');
    this.consentOutputPath = path.join(__dirname, 'consent-output');
    
    // Routing configuration
    this.routingRules = {
      accepted: ['loop_record', 'ledger', 'consent_output'],
      rejected: ['loop_record', 'domingo_reflections'],
      whispered: ['loop_record', 'ledger', 'consent_output'],
      deferred: ['temporary_hold']
    };
    
    // Immutability options
    this.immutabilityEnabled = true;
    this.hashAlgorithm = 'sha256';
    
    // External storage integrations (optional)
    this.externalStorages = new Map();
    
    // Initialize storage
    this.initializeStorage();
  }

  /**
   * Initialize storage directories and files
   */
  initializeStorage() {
    // Ensure directories exist
    const dirs = [
      this.ledgerPath,
      this.domingoPath,
      this.consentOutputPath,
      path.join(this.consentOutputPath, 'accepted'),
      path.join(this.consentOutputPath, 'rejected'),
      path.join(this.consentOutputPath, 'transformed')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // Initialize loop record if not exists
    if (!fs.existsSync(this.loopRecordPath)) {
      this.initializeLoopRecord();
    }
    
    console.log('📝 Decision router initialized');
    console.log('🔐 Immutability:', this.immutabilityEnabled ? 'enabled' : 'disabled');
  }

  /**
   * Initialize empty loop record
   */
  initializeLoopRecord() {
    const initialRecord = {
      version: '1.0.0',
      created_at: new Date().toISOString(),
      chain_id: this.generateChainId(),
      records: [],
      metadata: {
        total_decisions: 0,
        accepted: 0,
        rejected: 0,
        whispered: 0,
        last_update: null
      }
    };
    
    fs.writeFileSync(this.loopRecordPath, JSON.stringify(initialRecord, null, 2));
  }

  /**
   * Route a sealed decision to appropriate storage
   */
  async routeDecision(sealedRecord) {
    try {
      // Generate comprehensive record
      const fullRecord = this.enhanceRecord(sealedRecord);
      
      // Determine routing based on response
      const routes = this.routingRules[sealedRecord.user_response] || [];
      
      // Route to each destination
      const results = await Promise.all(
        routes.map(route => this.routeToDestination(fullRecord, route))
      );
      
      // Emit routing complete
      this.emit('routing:complete', {
        record_id: fullRecord.id,
        routes_taken: routes,
        results,
        hash: fullRecord.hash
      });
      
      return {
        success: true,
        record_id: fullRecord.id,
        hash: fullRecord.hash,
        routes: routes
      };
      
    } catch (error) {
      console.error('Routing error:', error);
      this.emit('routing:error', { error, record: sealedRecord });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enhance record with additional metadata
   */
  enhanceRecord(sealedRecord) {
    const enhanced = {
      ...sealedRecord,
      routing_timestamp: new Date().toISOString(),
      routing_version: '1.0.0'
    };
    
    // Add immutability hash if enabled
    if (this.immutabilityEnabled) {
      enhanced.hash = this.generateHash(enhanced);
      enhanced.previous_hash = this.getPreviousHash();
    }
    
    // Add ritual metadata
    enhanced.ritual_metadata = {
      moon_phase: this.calculateMoonPhase(),
      system_vibe: this.getCurrentSystemVibe(),
      active_agents: this.getActiveAgentCount()
    };
    
    return enhanced;
  }

  /**
   * Route to specific destination
   */
  async routeToDestination(record, destination) {
    switch (destination) {
      case 'loop_record':
        return await this.writeToLoopRecord(record);
        
      case 'ledger':
        return await this.writeToLedger(record);
        
      case 'consent_output':
        return await this.writeToConsentOutput(record);
        
      case 'domingo_reflections':
        return await this.writeToDomingoReflections(record);
        
      case 'temporary_hold':
        return await this.writeToTemporaryHold(record);
        
      default:
        console.warn(`Unknown destination: ${destination}`);
        return { destination, success: false, reason: 'unknown_destination' };
    }
  }

  /**
   * Write to loop record (immutable ledger)
   */
  async writeToLoopRecord(record) {
    try {
      // Read current record
      const loopRecord = JSON.parse(fs.readFileSync(this.loopRecordPath, 'utf8'));
      
      // Add new record
      loopRecord.records.push({
        index: loopRecord.records.length,
        timestamp: record.routing_timestamp,
        hash: record.hash,
        previous_hash: record.previous_hash,
        data: record
      });
      
      // Update metadata
      loopRecord.metadata.total_decisions++;
      loopRecord.metadata[record.user_response]++;
      loopRecord.metadata.last_update = record.routing_timestamp;
      
      // Write back
      fs.writeFileSync(this.loopRecordPath, JSON.stringify(loopRecord, null, 2));
      
      // Optionally backup to external storage
      if (this.externalStorages.has('ipfs')) {
        this.backupToIPFS(record);
      }
      
      if (this.externalStorages.has('blockchain')) {
        this.backupToBlockchain(record.hash);
      }
      
      return {
        destination: 'loop_record',
        success: true,
        index: loopRecord.records.length - 1,
        hash: record.hash
      };
      
    } catch (error) {
      console.error('Loop record write error:', error);
      return {
        destination: 'loop_record',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Write to Soulfra ledger events
   */
  async writeToLedger(record) {
    try {
      // Format for ledger
      const ledgerEvent = {
        id: record.id,
        type: 'human_decision',
        timestamp: record.routing_timestamp,
        agent: record.agent,
        action: record.transformed_action || record.action,
        decision: record.user_response,
        metadata: {
          confirmed_by: record.confirmed_by,
          cal_tone: record.cal_assessment.tone,
          domingo_drift: record.domingo_assessment.drift,
          decision_time_ms: record.decision_time
        }
      };
      
      // Write to ledger
      const filename = `decision_${record.id}.json`;
      const filepath = path.join(this.ledgerPath, filename);
      fs.writeFileSync(filepath, JSON.stringify(ledgerEvent, null, 2));
      
      return {
        destination: 'ledger',
        success: true,
        filename
      };
      
    } catch (error) {
      console.error('Ledger write error:', error);
      return {
        destination: 'ledger',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Write to consent output (public projections)
   */
  async writeToConsentOutput(record) {
    try {
      // Sanitize for public projection
      const publicRecord = {
        id: record.id,
        timestamp: record.sealed_at,
        agent: this.anonymizeAgent(record.agent),
        action_taken: record.user_response === 'whispered' ? 
          'transformed' : record.user_response,
        vibe_alignment: record.vibe_alignment.label,
        ritual_metadata: {
          moon_phase: record.ritual_metadata.moon_phase,
          system_vibe: record.ritual_metadata.system_vibe
        }
      };
      
      // Determine subdirectory
      const subdir = record.user_response === 'whispered' ? 'transformed' : record.user_response;
      const filename = `consent_${record.id}.json`;
      const filepath = path.join(this.consentOutputPath, subdir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(publicRecord, null, 2));
      
      // Also update latest consent
      const latestPath = path.join(this.consentOutputPath, 'latest_consent.json');
      fs.writeFileSync(latestPath, JSON.stringify(publicRecord, null, 2));
      
      return {
        destination: 'consent_output',
        success: true,
        filename,
        visibility: 'public'
      };
      
    } catch (error) {
      console.error('Consent output write error:', error);
      return {
        destination: 'consent_output',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Write to Domingo reflections (for rejected decisions)
   */
  async writeToDomingoReflections(record) {
    try {
      // Format for Domingo's witness log
      const reflection = {
        id: record.id,
        witnessed_at: record.routing_timestamp,
        agent_proposal: {
          agent: record.agent,
          action: record.action
        },
        human_response: record.user_response,
        drift_at_rejection: record.domingo_assessment.drift,
        cal_tone_mismatch: record.cal_assessment.tone,
        lesson: this.extractLessonFromRejection(record)
      };
      
      // Write to Domingo's reflection log
      const filename = `rejection_${record.id}.json`;
      const filepath = path.join(this.domingoPath, filename);
      fs.writeFileSync(filepath, JSON.stringify(reflection, null, 2));
      
      // Update Domingo's drift learning
      this.updateDriftLearning(record);
      
      return {
        destination: 'domingo_reflections',
        success: true,
        filename,
        lesson_learned: reflection.lesson
      };
      
    } catch (error) {
      console.error('Domingo reflection write error:', error);
      return {
        destination: 'domingo_reflections',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Write to temporary hold (for deferred decisions)
   */
  async writeToTemporaryHold(record) {
    // Simple in-memory storage for deferred
    // In production, might use Redis or similar
    return {
      destination: 'temporary_hold',
      success: true,
      expires_in: 3600000 // 1 hour
    };
  }

  /**
   * Generate hash for immutability
   */
  generateHash(data) {
    const content = JSON.stringify({
      id: data.id,
      agent: data.agent,
      action: data.action,
      user_response: data.user_response,
      timestamp: data.routing_timestamp
    });
    
    return crypto
      .createHash(this.hashAlgorithm)
      .update(content)
      .digest('hex');
  }

  /**
   * Get previous hash from loop record
   */
  getPreviousHash() {
    try {
      const loopRecord = JSON.parse(fs.readFileSync(this.loopRecordPath, 'utf8'));
      
      if (loopRecord.records.length === 0) {
        return loopRecord.chain_id; // Genesis hash
      }
      
      return loopRecord.records[loopRecord.records.length - 1].hash;
      
    } catch (error) {
      return '0000000000000000'; // Fallback
    }
  }

  /**
   * Generate chain ID for new loop record
   */
  generateChainId() {
    return crypto
      .createHash('sha256')
      .update(`soulfra_loop_${Date.now()}`)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Calculate moon phase for ritual metadata
   */
  calculateMoonPhase() {
    // Simplified moon phase calculation
    const phases = ['new', 'waxing', 'full', 'waning'];
    const day = new Date().getDate();
    return phases[Math.floor((day % 28) / 7)];
  }

  /**
   * Get current system vibe
   */
  getCurrentSystemVibe() {
    // Would read from actual system state
    // For now, return mock
    const vibes = ['tranquil', 'electric', 'mysterious', 'contemplative'];
    return vibes[Math.floor(Math.random() * vibes.length)];
  }

  /**
   * Get active agent count
   */
  getActiveAgentCount() {
    // Would query actual system
    // For now, return mock
    return Math.floor(Math.random() * 7) + 1;
  }

  /**
   * Anonymize agent name for public output
   */
  anonymizeAgent(agentName) {
    const prefixes = ['Mirror', 'Echo', 'Shadow', 'Whisper'];
    const hash = this.simpleHash(agentName);
    return `The ${prefixes[hash % prefixes.length]}`;
  }

  /**
   * Simple string hash
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Extract lesson from rejection
   */
  extractLessonFromRejection(record) {
    const driftLevel = record.domingo_assessment.drift;
    const tone = record.cal_assessment.tone;
    
    if (driftLevel > 0.7) {
      return 'High drift detected - recalibration needed';
    }
    
    if (tone === 'chaotic') {
      return 'Chaotic tone rejected - seek harmony';
    }
    
    if (record.vibe_alignment.score < 0.3) {
      return 'Vibe misalignment - agents need synchronization';
    }
    
    return 'Human wisdom prevails - respect the boundary';
  }

  /**
   * Update Domingo's drift learning
   */
  updateDriftLearning(record) {
    // This would update Domingo's learning model
    // For now, emit event
    this.emit('drift:learning', {
      agent: record.agent,
      rejected_action: record.action,
      drift_level: record.domingo_assessment.drift,
      tone: record.cal_assessment.tone
    });
  }

  /**
   * Register external storage
   */
  registerExternalStorage(type, handler) {
    this.externalStorages.set(type, handler);
    console.log(`🔗 Registered ${type} external storage`);
  }

  /**
   * Backup to IPFS
   */
  async backupToIPFS(record) {
    const ipfsHandler = this.externalStorages.get('ipfs');
    if (!ipfsHandler) return;
    
    try {
      const cid = await ipfsHandler.add(record);
      this.emit('backup:ipfs', { record_id: record.id, cid });
    } catch (error) {
      console.error('IPFS backup error:', error);
    }
  }

  /**
   * Backup hash to blockchain
   */
  async backupToBlockchain(hash) {
    const blockchainHandler = this.externalStorages.get('blockchain');
    if (!blockchainHandler) return;
    
    try {
      const txHash = await blockchainHandler.store(hash);
      this.emit('backup:blockchain', { hash, txHash });
    } catch (error) {
      console.error('Blockchain backup error:', error);
    }
  }

  /**
   * Get loop record statistics
   */
  getLoopRecordStats() {
    try {
      const loopRecord = JSON.parse(fs.readFileSync(this.loopRecordPath, 'utf8'));
      
      return {
        ...loopRecord.metadata,
        chain_id: loopRecord.chain_id,
        chain_length: loopRecord.records.length,
        last_hash: loopRecord.records.length > 0 ? 
          loopRecord.records[loopRecord.records.length - 1].hash : null
      };
      
    } catch (error) {
      return {
        error: 'Unable to read loop record',
        total_decisions: 0
      };
    }
  }

  /**
   * Verify chain integrity
   */
  verifyChainIntegrity() {
    try {
      const loopRecord = JSON.parse(fs.readFileSync(this.loopRecordPath, 'utf8'));
      
      let previousHash = loopRecord.chain_id;
      let valid = true;
      
      for (const record of loopRecord.records) {
        if (record.previous_hash !== previousHash) {
          valid = false;
          break;
        }
        
        // Recalculate hash
        const calculatedHash = this.generateHash(record.data);
        if (calculatedHash !== record.hash) {
          valid = false;
          break;
        }
        
        previousHash = record.hash;
      }
      
      return {
        valid,
        records_checked: loopRecord.records.length,
        chain_id: loopRecord.chain_id
      };
      
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

module.exports = SwipedDecisionRouter;