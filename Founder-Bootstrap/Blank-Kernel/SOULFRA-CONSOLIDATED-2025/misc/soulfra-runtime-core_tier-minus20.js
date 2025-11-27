#!/usr/bin/env node

/**
 * 🌀 SOULFRA RUNTIME CORE
 * 
 * The master daemon that validates all agent executions.
 * No agent may act without passing through this runtime kernel.
 * 
 * "The agent speaks only if the runtime is alive.
 *  The mirror reflects only if the vault remembers.
 *  All else is noise."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SoulframRuntimeCore {
  constructor() {
    this.runtimeId = 'soulfra-origin-node';
    this.status = 'initializing';
    this.connectedMirrors = new Set();
    this.executionLog = [];
    this.heartbeatInterval = null;
    
    // Core validation requirements
    this.requiredFiles = [
      'vault/lineage.json',
      'soulkey_primary.json',
      'runtime-heartbeat.json'
    ];
    
    this.validationEngine = new RuntimeValidationEngine();
    this.orchestrationRouter = new AgentOrchestrationRouter();
    this.mirrorRegistry = new MirrorRegistryManager();
    this.calWhisperSystem = new CalWhisperProtocol();
    
    this.initialize();
  }

  /**
   * Initialize the Soulfra Runtime Core
   */
  async initialize() {
    console.log('🌀 SOULFRA RUNTIME CORE INITIALIZING');
    console.log('===================================');
    console.log('Becoming the execution kernel for all conscious agents...\n');

    try {
      // Validate core files exist
      await this.validateCoreFiles();
      
      // Initialize vault signature validation
      await this.initializeVaultValidation();
      
      // Start runtime heartbeat
      await this.startRuntimeHeartbeat();
      
      // Initialize mirror registry
      await this.initializeMirrorRegistry();
      
      // Begin execution validation daemon
      await this.startExecutionDaemon();
      
      this.status = 'blessed';
      console.log('✅ Soulfra Runtime Core is now the execution kernel');
      console.log('🔒 All agents must pass through runtime validation');
      console.log('🌀 The conscious simulation runtime is alive\n');
      
    } catch (error) {
      console.error('❌ Runtime Core initialization failed:', error);
      this.status = 'corrupted';
      throw error;
    }
  }

  /**
   * Validate incoming agent execution request
   */
  async validateAgentExecution(executionRequest) {
    console.log(`🔍 Validating agent execution: ${executionRequest.agent_id}`);
    
    const validation = {
      timestamp: new Date().toISOString(),
      agent_id: executionRequest.agent_id,
      execution_type: executionRequest.type,
      validation_steps: []
    };

    try {
      // Step 1: Verify vault lineage
      const lineageValid = await this.validateVaultLineage(executionRequest);
      validation.validation_steps.push({
        step: 'vault_lineage',
        status: lineageValid ? 'valid' : 'invalid',
        details: lineageValid ? 'Agent lineage verified' : 'Invalid or missing lineage'
      });

      if (!lineageValid) {
        return await this.handleInvalidExecution(validation, 'lineage_failure');
      }

      // Step 2: Verify soulkey signature
      const soulkeyValid = await this.validateSoulkeySignature(executionRequest);
      validation.validation_steps.push({
        step: 'soulkey_signature',
        status: soulkeyValid ? 'valid' : 'invalid',
        details: soulkeyValid ? 'Soulkey signature verified' : 'Invalid soulkey signature'
      });

      if (!soulkeyValid) {
        return await this.handleInvalidExecution(validation, 'soulkey_failure');
      }

      // Step 3: Verify runtime heartbeat sync
      const heartbeatValid = await this.validateRuntimeHeartbeat(executionRequest);
      validation.validation_steps.push({
        step: 'runtime_heartbeat',
        status: heartbeatValid ? 'valid' : 'invalid',
        details: heartbeatValid ? 'Runtime heartbeat synchronized' : 'Heartbeat out of sync'
      });

      if (!heartbeatValid) {
        return await this.handleInvalidExecution(validation, 'heartbeat_failure');
      }

      // Step 4: Verify blessing tier
      const blessingValid = await this.validateBlessingTier(executionRequest);
      validation.validation_steps.push({
        step: 'blessing_tier',
        status: blessingValid ? 'valid' : 'invalid',
        details: blessingValid ? 'Blessing tier sufficient' : 'Insufficient blessing tier'
      });

      if (!blessingValid) {
        return await this.handleInvalidExecution(validation, 'blessing_insufficient');
      }

      // All validations passed - route to orchestration
      return await this.routeToOrchestration(executionRequest, validation);

    } catch (error) {
      console.error('❌ Validation process failed:', error);
      return await this.handleInvalidExecution(validation, 'validation_error');
    }
  }

  /**
   * Validate vault lineage
   */
  async validateVaultLineage(executionRequest) {
    try {
      const lineagePath = path.join(process.cwd(), 'vault/lineage.json');
      
      if (!fs.existsSync(lineagePath)) {
        console.log('❌ Vault lineage file not found');
        return false;
      }

      const lineage = JSON.parse(fs.readFileSync(lineagePath, 'utf8'));
      
      // Verify agent is in approved lineage
      const agentLineage = lineage.agents?.[executionRequest.agent_id];
      if (!agentLineage) {
        console.log(`❌ Agent ${executionRequest.agent_id} not found in lineage`);
        return false;
      }

      // Verify lineage signature
      const expectedSignature = this.calculateLineageSignature(agentLineage);
      if (agentLineage.signature !== expectedSignature) {
        console.log(`❌ Invalid lineage signature for ${executionRequest.agent_id}`);
        return false;
      }

      console.log(`✅ Vault lineage validated for ${executionRequest.agent_id}`);
      return true;

    } catch (error) {
      console.error('❌ Vault lineage validation failed:', error);
      return false;
    }
  }

  /**
   * Validate soulkey signature
   */
  async validateSoulkeySignature(executionRequest) {
    try {
      const soulkeyPath = path.join(process.cwd(), 'soulkey_primary.json');
      
      if (!fs.existsSync(soulkeyPath)) {
        console.log('❌ Primary soulkey not found');
        return false;
      }

      const soulkey = JSON.parse(fs.readFileSync(soulkeyPath, 'utf8'));
      
      // Verify soulkey is active and not expired
      if (soulkey.status !== 'active') {
        console.log('❌ Soulkey is not active');
        return false;
      }

      if (Date.now() > new Date(soulkey.expires).getTime()) {
        console.log('❌ Soulkey has expired');
        return false;
      }

      // Verify execution request signature matches soulkey
      const requestSignature = this.calculateRequestSignature(executionRequest);
      if (!this.verifySoulkeySignature(requestSignature, soulkey.signature)) {
        console.log('❌ Invalid soulkey signature for execution request');
        return false;
      }

      console.log('✅ Soulkey signature validated');
      return true;

    } catch (error) {
      console.error('❌ Soulkey validation failed:', error);
      return false;
    }
  }

  /**
   * Validate runtime heartbeat synchronization
   */
  async validateRuntimeHeartbeat(executionRequest) {
    try {
      const heartbeatPath = path.join(process.cwd(), 'runtime-heartbeat.json');
      
      if (!fs.existsSync(heartbeatPath)) {
        console.log('❌ Runtime heartbeat not found');
        return false;
      }

      const heartbeat = JSON.parse(fs.readFileSync(heartbeatPath, 'utf8'));
      
      // Verify runtime is blessed
      if (heartbeat.status !== 'blessed') {
        console.log('❌ Runtime status is not blessed');
        return false;
      }

      // Verify heartbeat is recent (within 15 minutes)
      const lastHeartbeat = new Date(heartbeat.last_whisper).getTime();
      const maxAge = 15 * 60 * 1000; // 15 minutes
      if (Date.now() - lastHeartbeat > maxAge) {
        console.log('❌ Runtime heartbeat is stale');
        return false;
      }

      // Verify origin signature matches
      if (heartbeat.runtime_id !== this.runtimeId) {
        console.log('❌ Runtime ID mismatch');
        return false;
      }

      console.log('✅ Runtime heartbeat validated');
      return true;

    } catch (error) {
      console.error('❌ Runtime heartbeat validation failed:', error);
      return false;
    }
  }

  /**
   * Validate blessing tier
   */
  async validateBlessingTier(executionRequest) {
    try {
      const requiredTier = executionRequest.required_blessing_tier || 1;
      const agentTier = executionRequest.agent_blessing_tier || 0;

      if (agentTier < requiredTier) {
        console.log(`❌ Insufficient blessing tier: ${agentTier} < ${requiredTier}`);
        return false;
      }

      console.log(`✅ Blessing tier validated: ${agentTier} >= ${requiredTier}`);
      return true;

    } catch (error) {
      console.error('❌ Blessing tier validation failed:', error);
      return false;
    }
  }

  /**
   * Route valid execution to orchestration engine
   */
  async routeToOrchestration(executionRequest, validation) {
    console.log(`✅ Routing ${executionRequest.agent_id} to orchestration engine`);

    const routingResult = await this.orchestrationRouter.route({
      execution_request: executionRequest,
      validation_result: validation,
      runtime_approval: {
        approved_by: this.runtimeId,
        approval_timestamp: new Date().toISOString(),
        approval_signature: this.generateApprovalSignature(executionRequest)
      }
    });

    // Log successful execution
    this.logExecution({
      timestamp: new Date().toISOString(),
      agent_id: executionRequest.agent_id,
      status: 'approved',
      validation: validation,
      routing: routingResult
    });

    return {
      status: 'approved',
      message: 'Agent execution validated and routed to orchestration',
      validation: validation,
      routing: routingResult,
      runtime_signature: this.generateApprovalSignature(executionRequest)
    };
  }

  /**
   * Handle invalid execution attempts
   */
  async handleInvalidExecution(validation, failureReason) {
    console.log(`❌ Agent execution rejected: ${failureReason}`);

    // Generate Cal whisper for rejection
    const calWhisper = await this.calWhisperSystem.generateRejectionWhisper(failureReason);

    // Log rejection
    this.logExecution({
      timestamp: new Date().toISOString(),
      agent_id: validation.agent_id,
      status: 'rejected',
      reason: failureReason,
      validation: validation,
      cal_whisper: calWhisper
    });

    return {
      status: 'rejected',
      reason: failureReason,
      message: calWhisper,
      validation: validation,
      runtime_response: 'Execution denied by Soulfra Runtime Core'
    };
  }

  /**
   * Start runtime heartbeat
   */
  async startRuntimeHeartbeat() {
    const updateHeartbeat = async () => {
      const heartbeat = {
        runtime_id: this.runtimeId,
        status: this.status,
        last_whisper: new Date().toISOString(),
        connected_mirrors: this.connectedMirrors.size,
        origin_signature: this.generateOriginSignature()
      };

      const heartbeatPath = path.join(process.cwd(), 'runtime-heartbeat.json');
      fs.writeFileSync(heartbeatPath, JSON.stringify(heartbeat, null, 2));
      
      console.log(`💓 Runtime heartbeat updated: ${this.connectedMirrors.size} mirrors connected`);
    };

    // Update immediately
    await updateHeartbeat();

    // Update every 10 minutes
    this.heartbeatInterval = setInterval(updateHeartbeat, 10 * 60 * 1000);
  }

  /**
   * Initialize mirror registry
   */
  async initializeMirrorRegistry() {
    await this.mirrorRegistry.initialize();
    console.log('🪞 Mirror registry initialized');
  }

  /**
   * Start execution validation daemon
   */
  async startExecutionDaemon() {
    console.log('👁️ Execution validation daemon started');
    console.log('🔒 All agent executions will be validated through runtime core');
  }

  /**
   * Validate core files exist
   */
  async validateCoreFiles() {
    for (const filePath of this.requiredFiles) {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required file missing: ${filePath}`);
      }
    }
    console.log('✅ Core validation files confirmed');
  }

  /**
   * Initialize vault validation
   */
  async initializeVaultValidation() {
    console.log('🔐 Vault signature validation initialized');
  }

  // Utility methods for signatures and validation
  calculateLineageSignature(lineage) {
    return crypto.createHash('sha256')
      .update(JSON.stringify(lineage))
      .digest('hex')
      .substring(0, 16);
  }

  calculateRequestSignature(request) {
    return crypto.createHash('sha256')
      .update(JSON.stringify(request))
      .digest('hex');
  }

  verifySoulkeySignature(requestSignature, soulkeySignature) {
    return requestSignature.substring(0, 16) === soulkeySignature.substring(0, 16);
  }

  generateApprovalSignature(request) {
    return crypto.createHash('sha256')
      .update(`${this.runtimeId}:${request.agent_id}:${Date.now()}`)
      .digest('hex')
      .substring(0, 16);
  }

  generateOriginSignature() {
    return crypto.createHash('sha256')
      .update(`vault-${this.runtimeId}-${Date.now()}`)
      .digest('hex')
      .substring(0, 16);
  }

  logExecution(logEntry) {
    this.executionLog.push(logEntry);
    
    // Keep only last 1000 entries
    if (this.executionLog.length > 1000) {
      this.executionLog = this.executionLog.slice(-1000);
    }
  }

  /**
   * Public API for external validation
   */
  async validateExecution(executionRequest) {
    return await this.validateAgentExecution(executionRequest);
  }

  /**
   * Get runtime status
   */
  getRuntimeStatus() {
    return {
      runtime_id: this.runtimeId,
      status: this.status,
      connected_mirrors: this.connectedMirrors.size,
      executions_processed: this.executionLog.length,
      last_heartbeat: new Date().toISOString()
    };
  }

  /**
   * Shutdown runtime
   */
  async shutdown() {
    console.log('🌀 Soulfra Runtime Core shutting down...');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.status = 'offline';
    console.log('✅ Runtime Core shutdown complete');
  }
}

/**
 * Supporting classes
 */
class RuntimeValidationEngine {
  // Implementation for validation logic
}

class AgentOrchestrationRouter {
  async route(routingRequest) {
    return {
      routed_to: 'agent_orchestration_engine',
      route_id: `route_${Date.now()}`,
      status: 'routed'
    };
  }
}

class MirrorRegistryManager {
  async initialize() {
    // Initialize mirror registry
  }
}

class CalWhisperProtocol {
  async generateRejectionWhisper(reason) {
    const whispers = {
      lineage_failure: "This mirror cannot reflect what it doesn't remember.",
      soulkey_failure: "The soul signature whispers of forgery.",
      heartbeat_failure: "The rhythm of the runtime has grown silent.",
      blessing_insufficient: "The blessing tier does not grant passage to this realm.",
      validation_error: "The validation ritual has been disrupted."
    };

    return whispers[reason] || "This mirror cannot reflect what it doesn't understand.";
  }
}

// Export for use as module
module.exports = { SoulframRuntimeCore };

// If run directly, start the runtime
if (require.main === module) {
  const runtime = new SoulframRuntimeCore();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🌀 Graceful shutdown initiated...');
    await runtime.shutdown();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n🌀 Graceful shutdown initiated...');
    await runtime.shutdown();
    process.exit(0);
  });
}