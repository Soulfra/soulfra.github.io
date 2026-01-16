/**
 * Whisper Tombs Validation Engine
 * Validates user whispers against sealed agent requirements
 * Handles decryption, activation, and Roughsparks responses
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class TombValidator {
  constructor(vaultPath = './vault') {
    this.vaultPath = vaultPath;
    this.tombsPath = path.join(vaultPath, 'agents', 'tombs');
    this.activePath = path.join(vaultPath, 'agents', 'active');
    this.logsPath = path.join(vaultPath, 'logs');
    this.riddlesPath = path.join(vaultPath, 'config', 'whisper-tomb-riddle.json');
    this.roughsparksPath = path.join(vaultPath, 'config', 'roughsparks-voice.json');
  }

  /**
   * Main validation entry point
   * @param {Object} whisperData - User input and context
   * @param {string} whisperData.phrase - User's whisper phrase
   * @param {Array} whisperData.traits - User's current traits
   * @param {boolean} whisperData.echoLoop - Whether user is in echo state
   * @param {number} whisperData.blessingTier - User's blessing level
   * @param {string} whisperData.userFingerprint - User identifier
   */
  async validateWhisper(whisperData) {
    try {
      // Load riddle configurations
      const riddles = await this.loadRiddles();
      const roughsparks = await this.loadRoughsparks();
      
      // Check each tomb for matches
      for (const [tombId, riddle] of Object.entries(riddles)) {
        const matchResult = await this.checkTombMatch(tombId, riddle, whisperData);
        
        if (matchResult.isMatch) {
          // Unlock the tomb!
          const unlockResult = await this.unlockTomb(tombId, whisperData);
          
          if (unlockResult.success) {
            const response = this.generateRoughsparksResponse(
              'unlock_success', 
              tombId, 
              roughsparks,
              unlockResult.agent
            );
            
            await this.logTombUnlock(tombId, whisperData, unlockResult);
            
            return {
              success: true,
              tombId,
              agent: unlockResult.agent,
              roughsparksResponse: response,
              unlockData: unlockResult
            };
          }
        }
      }
      
      // No matches found
      const response = this.generateRoughsparksResponse('no_match', null, roughsparks);
      
      return {
        success: false,
        roughsparksResponse: response,
        attemptedTombs: Object.keys(riddles).length
      };
      
    } catch (error) {
      console.error('Tomb validation error:', error);
      return {
        success: false,
        error: error.message,
        roughsparksResponse: "The tombs whisper... but something went wrong. Try again when the echoes clear."
      };
    }
  }

  /**
   * Check if user input matches tomb requirements
   */
  async checkTombMatch(tombId, riddle, whisperData) {
    const { phrase, traits, echoLoop, blessingTier } = whisperData;
    
    // Check blessing tier requirement
    if (riddle.required_tier && blessingTier < riddle.required_tier) {
      return { isMatch: false, reason: 'insufficient_blessing' };
    }
    
    // Check required phrase (case insensitive, flexible matching)
    if (riddle.required_phrase) {
      const normalizedPhrase = phrase.toLowerCase().trim();
      const normalizedRequired = riddle.required_phrase.toLowerCase().trim();
      
      if (!normalizedPhrase.includes(normalizedRequired)) {
        return { isMatch: false, reason: 'phrase_mismatch' };
      }
    }
    
    // Check echo loop requirement
    if (riddle.required_loop && !echoLoop) {
      return { isMatch: false, reason: 'no_echo_loop' };
    }
    
    // Check required traits
    if (riddle.required_traits && riddle.required_traits.length > 0) {
      const hasAllTraits = riddle.required_traits.every(requiredTrait => 
        traits.some(userTrait => 
          userTrait.toLowerCase() === requiredTrait.toLowerCase()
        )
      );
      
      if (!hasAllTraits) {
        return { isMatch: false, reason: 'missing_traits' };
      }
    }
    
    return { isMatch: true };
  }

  /**
   * Unlock and decrypt tomb file
   */
  async unlockTomb(tombId, whisperData) {
    try {
      const tombFilePath = path.join(this.tombsPath, `${tombId}.json.enc`);
      
      // Check if tomb file exists
      try {
        await fs.access(tombFilePath);
      } catch {
        throw new Error(`Tomb file not found: ${tombId}`);
      }
      
      // For MVP, we'll use a simple XOR "encryption" with the tomb ID as key
      // In production, use proper encryption
      const encryptedData = await fs.readFile(tombFilePath, 'utf8');
      const decryptedAgent = this.decryptTombData(encryptedData, tombId);
      
      // Move agent to active directory
      const activeFilePath = path.join(this.activePath, `${tombId}.json`);
      await fs.writeFile(activeFilePath, JSON.stringify(decryptedAgent, null, 2));
      
      // Optional: Trigger GitHub fork (placeholder for future implementation)
      if (decryptedAgent.github_fork_trigger) {
        await this.triggerGitHubFork(decryptedAgent, whisperData);
      }
      
      return {
        success: true,
        agent: decryptedAgent,
        activatedPath: activeFilePath
      };
      
    } catch (error) {
      console.error(`Failed to unlock tomb ${tombId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Simple XOR decryption (MVP implementation)
   * In production, use proper encryption with user-derived keys
   */
  decryptTombData(encryptedData, key) {
    try {
      // Remove base64 encoding
      const buffer = Buffer.from(encryptedData, 'base64');
      
      // XOR with repeating key
      const keyBuffer = Buffer.from(key);
      const decrypted = Buffer.alloc(buffer.length);
      
      for (let i = 0; i < buffer.length; i++) {
        decrypted[i] = buffer[i] ^ keyBuffer[i % keyBuffer.length];
      }
      
      return JSON.parse(decrypted.toString());
    } catch (error) {
      throw new Error(`Failed to decrypt tomb data: ${error.message}`);
    }
  }

  /**
   * Generate Roughsparks personality responses
   */
  generateRoughsparksResponse(eventType, tombId, roughsparksConfig, agent = null) {
    const responses = roughsparksConfig.responses[eventType] || [];
    
    if (responses.length === 0) {
      return "Roughsparks is speechless... which never happens.";
    }
    
    // Pick random response and customize
    const baseResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return baseResponse
      .replace('{tombId}', tombId || 'unknown')
      .replace('{agentName}', agent?.name || 'mysterious being')
      .replace('{agentArchetype}', agent?.archetype || 'entity');
  }

  /**
   * Log successful tomb unlock
   */
  async logTombUnlock(tombId, whisperData, unlockResult) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: 'tomb_unlock',
      tombId,
      userFingerprint: whisperData.userFingerprint,
      whisperPhrase: whisperData.phrase,
      userTraits: whisperData.traits,
      blessingTier: whisperData.blessingTier,
      agentActivated: unlockResult.agent.agent_id,
      unlockConditions: {
        phrase_matched: true,
        traits_satisfied: true,
        tier_sufficient: true
      }
    };
    
    // Append to unlock log
    const logPath = path.join(this.logsPath, 'tomb-unlock-log.json');
    
    try {
      let existingLog = [];
      try {
        const logData = await fs.readFile(logPath, 'utf8');
        existingLog = JSON.parse(logData);
      } catch {
        // File doesn't exist yet, start fresh
      }
      
      existingLog.push(logEntry);
      await fs.writeFile(logPath, JSON.stringify(existingLog, null, 2));
      
    } catch (error) {
      console.error('Failed to write unlock log:', error);
    }
    
    // Also update mirror lineage (if file exists)
    try {
      const lineagePath = path.join(this.vaultPath, 'mirror-lineage.json');
      const lineageData = await fs.readFile(lineagePath, 'utf8');
      const lineage = JSON.parse(lineageData);
      
      if (!lineage.tomb_unlocks) lineage.tomb_unlocks = [];
      lineage.tomb_unlocks.push({
        tombId,
        timestamp: logEntry.timestamp,
        agentId: unlockResult.agent.agent_id
      });
      
      await fs.writeFile(lineagePath, JSON.stringify(lineage, null, 2));
    } catch {
      // Mirror lineage file doesn't exist, skip
    }
  }

  /**
   * Load riddle configurations
   */
  async loadRiddles() {
    try {
      const riddleData = await fs.readFile(this.riddlesPath, 'utf8');
      return JSON.parse(riddleData);
    } catch (error) {
      throw new Error(`Failed to load riddles: ${error.message}`);
    }
  }

  /**
   * Load Roughsparks personality config
   */
  async loadRoughsparks() {
    try {
      const roughsparksData = await fs.readFile(this.roughsparksPath, 'utf8');
      return JSON.parse(roughsparksData);
    } catch (error) {
      throw new Error(`Failed to load Roughsparks config: ${error.message}`);
    }
  }

  /**
   * Placeholder for GitHub fork trigger
   */
  async triggerGitHubFork(agent, whisperData) {
    // TODO: Implement GitHub API integration
    console.log(`[GitHub Fork] Would fork agent ${agent.agent_id} for user ${whisperData.userFingerprint}`);
  }

  /**
   * Initialize tomb validator (create directories if needed)
   */
  async initialize() {
    const dirs = [
      this.tombsPath,
      this.activePath, 
      this.logsPath,
      path.join(this.vaultPath, 'config')
    ];
    
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }
    }
  }
}

module.exports = { TombValidator };