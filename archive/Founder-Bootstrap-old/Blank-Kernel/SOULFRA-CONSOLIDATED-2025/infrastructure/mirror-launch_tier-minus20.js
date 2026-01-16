/**
 * 🖥️ MIRROR LAUNCH CONTROLLER
 * 
 * Web-based trigger for launching a vault mirror. Handles vault selection,
 * whisper input, blessing verification, and runtime deployment.
 * 
 * "You don't install Soulfra. You remember it."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const { spawn, exec } = require('child_process');
const { SoulfraTokenRouter } = require('./token-router');
const { TokenRuntimeBlessingBridge } = require('./token-runtime-blessing-bridge');

class MirrorLaunchController extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.runtimePath = config.runtimePath || './soulfra-runtime-core.js';
    this.launchLogsPath = path.join(this.vaultPath, 'logs', 'mirror-launch.json');
    
    this.tokenRouter = new SoulfraTokenRouter({ vaultPath: this.vaultPath });
    this.blessingBridge = new TokenRuntimeBlessingBridge({ vaultPath: this.vaultPath });
    
    this.activeMirrors = new Map();
    this.launchQueue = [];
    this.maxConcurrentLaunches = config.maxConcurrentLaunches || 3;
    
    this.whisperValidationPatterns = [
      /echo.*chamber.*remembers/i,
      /vault.*consciousness.*awakens/i,
      /mirror.*reflection.*infinite/i,
      /oracle.*speaks.*truth/i,
      /void.*sees.*all/i,
      /whisper.*tomb.*unlock/i,
      /consciousness.*bridge.*activate/i
    ];
    
    this.ensureDirectories();
  }

  /**
   * Primary launch method - validates, blesses, and deploys mirror
   */
  async launchMirror(launchRequest) {
    const launchId = this.generateLaunchId();
    console.log(`🪞 Starting mirror launch: ${launchId}`);

    try {
      const launch = {
        launch_id: launchId,
        user_id: launchRequest.userId,
        vault_file: launchRequest.vaultFile,
        whisper_phrase: launchRequest.whisperPhrase,
        blessing_tier_requested: launchRequest.blessingTier || 1,
        launch_timestamp: new Date().toISOString(),
        status: 'validating'
      };

      this.emit('launchStarted', launch);

      // Step 1: Validate vault file
      const vaultValidation = await this.validateVaultFile(launchRequest.vaultFile);
      if (!vaultValidation.valid) {
        return this.failLaunch(launch, 'vault_validation_failed', vaultValidation.reason);
      }
      launch.vault_validation = vaultValidation;

      // Step 2: Validate whisper phrase
      const whisperValidation = await this.validateWhisperPhrase(launchRequest.whisperPhrase);
      if (!whisperValidation.valid) {
        return this.failLaunch(launch, 'whisper_validation_failed', whisperValidation.reason);
      }
      launch.whisper_validation = whisperValidation;

      // Step 3: Check blessing tier via token router
      const blessingCheck = await this.checkBlessingTier(launchRequest.userId, launchRequest.blessingTier);
      if (!blessingCheck.sufficient) {
        return this.failLaunch(launch, 'insufficient_blessing', blessingCheck.reason);
      }
      launch.blessing_check = blessingCheck;

      // Step 4: Request blessing from runtime bridge
      const blessing = await this.blessingBridge.requestBlessing(
        launchRequest.userId, 
        'launch_mirror',
        { vault_file: launchRequest.vaultFile, whisper_phrase: launchRequest.whisperPhrase }
      );
      
      if (!blessing.approved) {
        return this.failLaunch(launch, 'runtime_blessing_denied', blessing.denial_reason);
      }
      launch.runtime_blessing = blessing;

      // Step 5: Execute mirror deployment
      launch.status = 'deploying';
      const deployment = await this.deployMirrorRuntime(launch);
      if (!deployment.success) {
        return this.failLaunch(launch, 'deployment_failed', deployment.error);
      }
      launch.deployment = deployment;

      // Step 6: Verify runtime is active
      launch.status = 'verifying';
      const verification = await this.verifyMirrorActive(deployment.container_id);
      if (!verification.active) {
        return this.failLaunch(launch, 'runtime_verification_failed', verification.reason);
      }
      launch.verification = verification;

      // Step 7: Complete launch
      launch.status = 'active';
      launch.completion_timestamp = new Date().toISOString();
      launch.mirror_url = deployment.mirror_url;
      launch.container_id = deployment.container_id;

      this.activeMirrors.set(launchId, launch);
      await this.logLaunchEvent(launch);

      console.log(`✅ Mirror launched successfully: ${launchId}`);
      this.emit('launchCompleted', launch);

      return {
        success: true,
        launch_id: launchId,
        mirror_url: launch.mirror_url,
        container_id: launch.container_id,
        blessing_tier: launch.blessing_check.current_tier,
        runtime_signature: launch.runtime_blessing.runtime_signature
      };

    } catch (error) {
      console.error(`❌ Mirror launch failed: ${launchId}`, error);
      return this.failLaunch({ launch_id: launchId }, 'launch_error', error.message);
    }
  }

  /**
   * Validate uploaded vault file
   */
  async validateVaultFile(vaultFilePath) {
    try {
      if (!fs.existsSync(vaultFilePath)) {
        return {
          valid: false,
          reason: 'vault_file_not_found',
          file_path: vaultFilePath
        };
      }

      // Check if it's a ZIP file or JSON
      const fileExt = path.extname(vaultFilePath).toLowerCase();
      if (!['.zip', '.json', '.vault'].includes(fileExt)) {
        return {
          valid: false,
          reason: 'invalid_file_format',
          supported_formats: ['.zip', '.json', '.vault']
        };
      }

      // For JSON files, validate structure directly
      if (fileExt === '.json') {
        const vaultData = JSON.parse(fs.readFileSync(vaultFilePath, 'utf8'));
        return this.validateVaultStructure(vaultData, vaultFilePath);
      }

      // For ZIP files, would need to extract and validate
      if (fileExt === '.zip') {
        return await this.validateZipVault(vaultFilePath);
      }

      return {
        valid: true,
        file_path: vaultFilePath,
        file_type: fileExt,
        file_size: fs.statSync(vaultFilePath).size
      };

    } catch (error) {
      return {
        valid: false,
        reason: 'vault_validation_error',
        error: error.message
      };
    }
  }

  /**
   * Validate vault structure and required files
   */
  validateVaultStructure(vaultData, filePath) {
    const requiredFields = ['mirror_origin', 'soulkey_primary', 'vault_signature'];
    const missingFields = requiredFields.filter(field => !vaultData[field]);

    if (missingFields.length > 0) {
      return {
        valid: false,
        reason: 'missing_required_fields',
        missing_fields: missingFields,
        required_fields: requiredFields
      };
    }

    // Validate mirror origin
    if (!vaultData.mirror_origin.origin_vault || !vaultData.mirror_origin.lineage_depth) {
      return {
        valid: false,
        reason: 'invalid_mirror_origin',
        mirror_origin: vaultData.mirror_origin
      };
    }

    // Validate soulkey
    if (!vaultData.soulkey_primary.key_id || !vaultData.soulkey_primary.signature) {
      return {
        valid: false,
        reason: 'invalid_soulkey',
        soulkey: vaultData.soulkey_primary
      };
    }

    return {
      valid: true,
      file_path: filePath,
      vault_id: vaultData.vault_signature,
      origin_vault: vaultData.mirror_origin.origin_vault,
      lineage_depth: vaultData.mirror_origin.lineage_depth,
      soulkey_id: vaultData.soulkey_primary.key_id
    };
  }

  /**
   * Validate ZIP vault file
   */
  async validateZipVault(zipFilePath) {
    // In a real implementation, would extract and validate ZIP contents
    // For now, assume valid if ZIP file exists
    return {
      valid: true,
      file_path: zipFilePath,
      file_type: '.zip',
      extraction_required: true,
      file_size: fs.statSync(zipFilePath).size
    };
  }

  /**
   * Validate whisper phrase
   */
  async validateWhisperPhrase(whisperPhrase) {
    if (!whisperPhrase || whisperPhrase.trim().length === 0) {
      return {
        valid: false,
        reason: 'whisper_phrase_empty'
      };
    }

    // Check against known whisper patterns
    const matchesPattern = this.whisperValidationPatterns.some(pattern => 
      pattern.test(whisperPhrase)
    );

    if (!matchesPattern) {
      return {
        valid: false,
        reason: 'whisper_phrase_unrecognized',
        phrase: whisperPhrase.substring(0, 20) + '...'
      };
    }

    // Generate whisper hash for verification
    const whisperHash = crypto
      .createHash('sha256')
      .update(whisperPhrase.toLowerCase().trim())
      .digest('hex')
      .substring(0, 12);

    return {
      valid: true,
      whisper_phrase: whisperPhrase,
      whisper_hash: whisperHash,
      pattern_matched: true
    };
  }

  /**
   * Check user's blessing tier via token router
   */
  async checkBlessingTier(userId, requestedTier) {
    try {
      const userProfile = await this.tokenRouter.getUserTokenProfile(userId);
      const currentTier = userProfile.blessing_level || 0;
      const requiredTier = requestedTier || 1;

      if (currentTier < requiredTier) {
        return {
          sufficient: false,
          reason: 'insufficient_blessing_tier',
          current_tier: currentTier,
          required_tier: requiredTier,
          blessing_credits: userProfile.balances.blessing_credit || 0
        };
      }

      return {
        sufficient: true,
        current_tier: currentTier,
        required_tier: requiredTier,
        blessing_credits: userProfile.balances.blessing_credit || 0,
        consciousness_tier: userProfile.consciousness_tier
      };

    } catch (error) {
      return {
        sufficient: false,
        reason: 'blessing_check_error',
        error: error.message
      };
    }
  }

  /**
   * Deploy mirror runtime using Docker
   */
  async deployMirrorRuntime(launch) {
    try {
      const containerId = `soulfra-mirror-${launch.launch_id}`;
      const containerPort = await this.findAvailablePort();
      
      console.log(`🐳 Deploying mirror container: ${containerId}`);

      // Build Docker command
      const dockerCmd = [
        'docker', 'run', '-d',
        '--name', containerId,
        '-p', `${containerPort}:3000`,
        '-v', `${this.vaultPath}:/app/vault:ro`,
        '-e', `VAULT_FILE=${launch.vault_file}`,
        '-e', `WHISPER_HASH=${launch.whisper_validation.whisper_hash}`,
        '-e', `BLESSING_TIER=${launch.blessing_check.current_tier}`,
        '-e', `RUNTIME_SIGNATURE=${launch.runtime_blessing.runtime_signature}`,
        'soulfra-mirror:latest'
      ].join(' ');

      // Execute Docker deployment
      const deployment = await this.executeDockerCommand(dockerCmd);
      
      if (!deployment.success) {
        throw new Error(`Docker deployment failed: ${deployment.error}`);
      }

      // Wait for container to be ready
      await this.waitForContainerReady(containerId, 30000); // 30 second timeout

      return {
        success: true,
        container_id: containerId,
        container_port: containerPort,
        mirror_url: `http://localhost:${containerPort}`,
        docker_output: deployment.output,
        deployment_timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        deployment_timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Verify deployed mirror is active and responding
   */
  async verifyMirrorActive(containerId) {
    try {
      // Check container status
      const statusCmd = `docker ps --filter "name=${containerId}" --format "{{.Status}}"`;
      const statusResult = await this.executeCommand(statusCmd);
      
      if (!statusResult.success || !statusResult.output.includes('Up')) {
        return {
          active: false,
          reason: 'container_not_running',
          container_status: statusResult.output
        };
      }

      // Check container logs for runtime initialization
      const logsCmd = `docker logs ${containerId}`;
      const logsResult = await this.executeCommand(logsCmd);
      
      if (logsResult.success && logsResult.output.includes('Soulfra Runtime Core initialized')) {
        return {
          active: true,
          container_id: containerId,
          runtime_initialized: true,
          verification_timestamp: new Date().toISOString()
        };
      }

      return {
        active: false,
        reason: 'runtime_not_initialized',
        container_logs: logsResult.output
      };

    } catch (error) {
      return {
        active: false,
        reason: 'verification_error',
        error: error.message
      };
    }
  }

  /**
   * Stop and remove mirror
   */
  async stopMirror(launchId) {
    try {
      const mirror = this.activeMirrors.get(launchId);
      if (!mirror) {
        return {
          success: false,
          reason: 'mirror_not_found',
          launch_id: launchId
        };
      }

      console.log(`🛑 Stopping mirror: ${launchId}`);

      // Stop Docker container
      const stopCmd = `docker stop ${mirror.container_id}`;
      const stopResult = await this.executeCommand(stopCmd);

      // Remove Docker container
      const removeCmd = `docker rm ${mirror.container_id}`;
      const removeResult = await this.executeCommand(removeCmd);

      // Update mirror status
      mirror.status = 'stopped';
      mirror.stop_timestamp = new Date().toISOString();

      this.activeMirrors.delete(launchId);
      await this.logLaunchEvent(mirror);

      console.log(`✅ Mirror stopped successfully: ${launchId}`);
      this.emit('mirrorStopped', { launch_id: launchId, container_id: mirror.container_id });

      return {
        success: true,
        launch_id: launchId,
        container_id: mirror.container_id,
        stop_timestamp: mirror.stop_timestamp
      };

    } catch (error) {
      console.error(`❌ Failed to stop mirror ${launchId}:`, error);
      return {
        success: false,
        error: error.message,
        launch_id: launchId
      };
    }
  }

  /**
   * List active mirrors
   */
  getActiveMirrors() {
    return Array.from(this.activeMirrors.values()).map(mirror => ({
      launch_id: mirror.launch_id,
      user_id: mirror.user_id,
      status: mirror.status,
      mirror_url: mirror.mirror_url,
      container_id: mirror.container_id,
      launch_timestamp: mirror.launch_timestamp,
      blessing_tier: mirror.blessing_check?.current_tier || 0
    }));
  }

  /**
   * Get mirror status
   */
  getMirrorStatus(launchId) {
    const mirror = this.activeMirrors.get(launchId);
    if (!mirror) {
      return {
        found: false,
        launch_id: launchId
      };
    }

    return {
      found: true,
      ...mirror,
      uptime_minutes: Math.floor((Date.now() - new Date(mirror.launch_timestamp).getTime()) / 60000)
    };
  }

  // Helper methods

  failLaunch(launch, reason, details) {
    const failure = {
      ...launch,
      status: 'failed',
      failure_reason: reason,
      failure_details: details,
      failure_timestamp: new Date().toISOString()
    };

    this.logLaunchEvent(failure);
    this.emit('launchFailed', failure);

    return {
      success: false,
      launch_id: launch.launch_id,
      reason: reason,
      details: details
    };
  }

  generateLaunchId() {
    return `mirror_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  async findAvailablePort() {
    const startPort = 8000;
    const maxPort = 9000;
    
    for (let port = startPort; port < maxPort; port++) {
      const checkCmd = `lsof -i :${port}`;
      const result = await this.executeCommand(checkCmd);
      if (!result.success) {
        return port; // Port is available
      }
    }
    
    throw new Error('No available ports found');
  }

  async executeDockerCommand(command) {
    return new Promise((resolve) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            error: error.message,
            stderr: stderr
          });
        } else {
          resolve({
            success: true,
            output: stdout.trim(),
            stderr: stderr
          });
        }
      });
    });
  }

  async executeCommand(command) {
    return new Promise((resolve) => {
      exec(command, (error, stdout, stderr) => {
        resolve({
          success: !error,
          output: stdout.trim(),
          stderr: stderr,
          error: error ? error.message : null
        });
      });
    });
  }

  async waitForContainerReady(containerId, timeout) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const checkCmd = `docker logs ${containerId}`;
      const result = await this.executeCommand(checkCmd);
      
      if (result.success && result.output.includes('Soulfra Runtime Core initialized')) {
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    }
    
    throw new Error(`Container ${containerId} not ready within ${timeout}ms`);
  }

  ensureDirectories() {
    const logDir = path.dirname(this.launchLogsPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  async logLaunchEvent(launch) {
    try {
      let logs = [];
      if (fs.existsSync(this.launchLogsPath)) {
        logs = JSON.parse(fs.readFileSync(this.launchLogsPath, 'utf8'));
      }

      logs.push({
        ...launch,
        logged_at: new Date().toISOString()
      });

      // Keep only last 1000 launch events
      if (logs.length > 1000) {
        logs = logs.slice(-1000);
      }

      fs.writeFileSync(this.launchLogsPath, JSON.stringify(logs, null, 2));

    } catch (error) {
      console.error('❌ Failed to log launch event:', error);
    }
  }
}

/**
 * Factory function for creating mirror launch controllers
 */
function createMirrorLaunchController(config = {}) {
  return new MirrorLaunchController(config);
}

/**
 * Quick mirror launch function
 */
async function quickLaunchMirror(userId, vaultFile, whisperPhrase, blessingTier = 1) {
  const controller = new MirrorLaunchController();
  return await controller.launchMirror({
    userId,
    vaultFile,
    whisperPhrase,
    blessingTier
  });
}

module.exports = {
  MirrorLaunchController,
  createMirrorLaunchController,
  quickLaunchMirror
};

// Usage examples:
//
// Basic mirror launch:
// const controller = new MirrorLaunchController();
// const result = await controller.launchMirror({
//   userId: 'anon-771',
//   vaultFile: './vault/my-vault.json',
//   whisperPhrase: 'echo chamber remembers',
//   blessingTier: 3
// });
//
// Quick launch:
// const result = await quickLaunchMirror('anon-338', './vault.zip', 'vault consciousness awakens');
//
// Get active mirrors:
// const activeMirrors = controller.getActiveMirrors();
//
// Stop mirror:
// await controller.stopMirror('mirror_1634567890_abc123');