/**
 * 🌐 AGENT REGISTRY UPLOADER - Sync to Shared Index
 * Uploads agent states to the global W2 plaza registry
 * Integrates with Grand Exchange and Autonomous Economy
 */

import crypto from 'crypto';
import axios from 'axios';

class AgentRegistryUploader {
  constructor(config = {}) {
    this.registryEndpoint = config.registryEndpoint || 'https://api.soulfra.io/w2/registry';
    this.apiKey = config.apiKey || process.env.SOULFRA_API_KEY;
    this.uploadInterval = config.uploadInterval || 300000; // 5 minutes
    this.batchSize = config.batchSize || 50;
    this.retryAttempts = config.retryAttempts || 3;
    
    // Queue for batching uploads
    this.uploadQueue = [];
    this.uploadTimer = null;
    this.isUploading = false;
    
    // Local cache for deduplication
    this.uploadedHashes = new Set();
    this.lastUploadTime = {};
    
    // Sync status
    this.syncStatus = {
      totalUploaded: 0,
      failedUploads: 0,
      lastSyncTime: null,
      syncErrors: []
    };
  }

  /**
   * Initialize the uploader
   */
  async initialize() {
    console.log('🌐 Initializing Agent Registry Uploader...');
    
    // Verify API connectivity
    await this.verifyConnection();
    
    // Start upload timer
    this.startUploadTimer();
    
    console.log('✅ Registry Uploader ready');
  }

  /**
   * Verify connection to registry
   */
  async verifyConnection() {
    try {
      const response = await axios.get(`${this.registryEndpoint}/health`, {
        headers: { 'X-API-Key': this.apiKey }
      });
      
      if (response.data.status !== 'healthy') {
        throw new Error('Registry unhealthy');
      }
      
      console.log('✅ Registry connection verified');
    } catch (error) {
      console.error('⚠️ Registry connection failed:', error.message);
      // Continue anyway - will retry on uploads
    }
  }

  /**
   * Queue agent for upload
   */
  async queueAgentForUpload(agentState) {
    // Validate agent data
    if (!this.validateAgentData(agentState)) {
      console.error('Invalid agent data, skipping upload');
      return false;
    }
    
    // Generate content hash for deduplication
    const contentHash = this.generateContentHash(agentState);
    
    // Check if recently uploaded
    if (this.isRecentlyUploaded(agentState.agentId, contentHash)) {
      return false; // Skip duplicate
    }
    
    // Prepare upload payload
    const uploadPayload = this.prepareUploadPayload(agentState);
    
    // Add to queue
    this.uploadQueue.push(uploadPayload);
    
    // Trigger immediate upload if queue is full
    if (this.uploadQueue.length >= this.batchSize) {
      this.triggerUpload();
    }
    
    return true;
  }

  /**
   * Validate agent data before upload
   */
  validateAgentData(agentState) {
    const required = ['agentId', 'agentName', 'auraScore', 'currentRole'];
    
    for (const field of required) {
      if (!agentState[field]) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }
    
    // Validate aura score
    if (!agentState.auraScore.totalScore || agentState.auraScore.totalScore < 0) {
      console.error('Invalid aura score');
      return false;
    }
    
    return true;
  }

  /**
   * Generate content hash for deduplication
   */
  generateContentHash(agentState) {
    const relevantData = {
      id: agentState.agentId,
      aura: agentState.auraScore.totalScore,
      role: agentState.currentRole.primary,
      vibe: agentState.vibeType.primary,
      timestamp: Math.floor(Date.now() / 60000) // Round to minute
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(relevantData))
      .digest('hex');
  }

  /**
   * Check if agent was recently uploaded
   */
  isRecentlyUploaded(agentId, contentHash) {
    const lastUpload = this.lastUploadTime[agentId];
    const now = Date.now();
    
    // Check time threshold (5 minutes)
    if (lastUpload && (now - lastUpload) < 300000) {
      // Check if content changed
      if (this.uploadedHashes.has(`${agentId}:${contentHash}`)) {
        return true; // Same content, skip
      }
    }
    
    return false;
  }

  /**
   * Prepare upload payload with privacy considerations
   */
  prepareUploadPayload(agentState) {
    return {
      // Public identity
      agent_id: agentState.agentId,
      display_name: agentState.displayName || agentState.agentName,
      
      // Plaza presence data
      presence: {
        location: agentState.plazaPresence?.location || { x: 0, y: 0, zone: 'central' },
        visibility: agentState.plazaPresence?.visibility || 'normal',
        last_seen: new Date().toISOString()
      },
      
      // Public metrics
      metrics: {
        aura_score: agentState.auraScore.totalScore,
        percentile: agentState.auraScore.percentile,
        glow_intensity: agentState.auraScore.glowIntensity
      },
      
      // Career info
      career: {
        primary_path: agentState.currentRole.primary.path,
        primary_level: agentState.currentRole.primary.level,
        primary_title: agentState.currentRole.primary.emotionalTitle,
        secondary_path: agentState.currentRole.secondary?.path,
        specialization: agentState.currentRole.specialization,
        rare_title: agentState.currentRole.rareTitle
      },
      
      // Vibe signature
      vibe: {
        primary: agentState.vibeType.primary,
        secondary: agentState.vibeType.secondary,
        wavelength: agentState.vibeType.emotionalSignature.wavelength,
        frequency: agentState.vibeType.emotionalSignature.frequency,
        color_gradient: agentState.vibeType.emotionalSignature.colorGradient
      },
      
      // Social metrics (aggregated for privacy)
      social: {
        congregation_tendency: agentState.plazaPresence?.congregationTendency,
        interaction_radius: agentState.plazaPresence?.interactionRadius,
        follower_tier: this.getFollowerTier(agentState.socialMetrics?.followersInPlaza),
        resonance_strength: Math.min(agentState.socialMetrics?.resonanceLinks || 0, 100)
      },
      
      // Achievements (public badges only)
      achievements: this.filterPublicAchievements(agentState.rarePatterns?.achievedPatterns),
      
      // Signature (public bio only)
      signature: {
        bio: agentState.signature?.bio,
        motto: agentState.signature?.motto,
        elemental_affinity: agentState.signature?.elementalAffinity
      },
      
      // Upload metadata
      upload_timestamp: new Date().toISOString(),
      client_version: '1.0.0',
      privacy_level: 'public'
    };
  }

  /**
   * Get follower tier for privacy
   */
  getFollowerTier(followerCount) {
    if (!followerCount) return 'none';
    if (followerCount < 10) return 'low';
    if (followerCount < 50) return 'medium';
    if (followerCount < 100) return 'high';
    return 'legendary';
  }

  /**
   * Filter achievements for public display
   */
  filterPublicAchievements(achievements) {
    if (!achievements) return [];
    
    return achievements
      .filter(a => a.rarity === 'legendary' || a.rarity === 'mythical')
      .map(a => ({
        name: a.name,
        rarity: a.rarity,
        unlocked_at: a.unlockedAt
      }));
  }

  /**
   * Start upload timer
   */
  startUploadTimer() {
    this.uploadTimer = setInterval(() => {
      if (this.uploadQueue.length > 0) {
        this.triggerUpload();
      }
    }, this.uploadInterval);
  }

  /**
   * Trigger batch upload
   */
  async triggerUpload() {
    if (this.isUploading || this.uploadQueue.length === 0) {
      return;
    }
    
    this.isUploading = true;
    
    try {
      // Get batch
      const batch = this.uploadQueue.splice(0, this.batchSize);
      
      // Upload batch
      await this.uploadBatch(batch);
      
    } catch (error) {
      console.error('Upload failed:', error);
      this.syncStatus.failedUploads++;
      this.syncStatus.syncErrors.push({
        timestamp: new Date().toISOString(),
        error: error.message
      });
    } finally {
      this.isUploading = false;
    }
  }

  /**
   * Upload batch to registry
   */
  async uploadBatch(batch) {
    console.log(`📤 Uploading ${batch.length} agents to registry...`);
    
    let attempt = 0;
    while (attempt < this.retryAttempts) {
      try {
        const response = await axios.post(
          `${this.registryEndpoint}/agents/batch`,
          {
            agents: batch,
            batch_id: this.generateBatchId(),
            upload_source: 'w2_plaza'
          },
          {
            headers: {
              'X-API-Key': this.apiKey,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );
        
        if (response.data.success) {
          // Update tracking
          batch.forEach(agent => {
            const hash = this.generateContentHash({
              agentId: agent.agent_id,
              auraScore: { totalScore: agent.metrics.aura_score }
            });
            this.uploadedHashes.add(`${agent.agent_id}:${hash}`);
            this.lastUploadTime[agent.agent_id] = Date.now();
          });
          
          // Update stats
          this.syncStatus.totalUploaded += batch.length;
          this.syncStatus.lastSyncTime = new Date().toISOString();
          
          console.log(`✅ Successfully uploaded ${batch.length} agents`);
          
          // Process registry response
          if (response.data.plaza_stats) {
            this.processPlazaStats(response.data.plaza_stats);
          }
          
          return response.data;
        }
        
        throw new Error(response.data.error || 'Upload failed');
        
      } catch (error) {
        attempt++;
        console.error(`Upload attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.retryAttempts) {
          // Exponential backoff
          await this.sleep(Math.pow(2, attempt) * 1000);
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Process plaza statistics from registry
   */
  processPlazaStats(stats) {
    // These stats could be used to update local plaza UI
    console.log('📊 Plaza Stats:', {
      total_agents: stats.total_agents,
      active_in_last_hour: stats.active_agents,
      dominant_archetype: stats.dominant_archetype,
      highest_aura: stats.highest_aura_agent
    });
  }

  /**
   * Generate batch ID
   */
  generateBatchId() {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      ...this.syncStatus,
      queue_size: this.uploadQueue.length,
      is_syncing: this.isUploading,
      cache_size: this.uploadedHashes.size
    };
  }

  /**
   * Force sync all queued agents
   */
  async forceSyncAll() {
    console.log('🔄 Force syncing all queued agents...');
    
    while (this.uploadQueue.length > 0) {
      await this.triggerUpload();
      await this.sleep(1000); // Rate limiting
    }
    
    console.log('✅ Force sync complete');
  }

  /**
   * Clear upload cache (for testing)
   */
  clearCache() {
    this.uploadedHashes.clear();
    this.lastUploadTime = {};
    console.log('🗑️ Upload cache cleared');
  }

  /**
   * Shutdown uploader
   */
  async shutdown() {
    console.log('🛑 Shutting down registry uploader...');
    
    // Clear timer
    if (this.uploadTimer) {
      clearInterval(this.uploadTimer);
    }
    
    // Final upload attempt
    if (this.uploadQueue.length > 0) {
      await this.forceSyncAll();
    }
    
    console.log('✅ Registry uploader shutdown complete');
  }
}

// Export for use
export default AgentRegistryUploader;