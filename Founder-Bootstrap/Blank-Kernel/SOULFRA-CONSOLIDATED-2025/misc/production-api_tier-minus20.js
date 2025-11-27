/**
 * SOULFRA PRODUCTION API ENDPOINTS
 * 
 * Complete API for user authentication, tomb system, neural scanning,
 * and database integration with GitHub repository access.
 */

const express = require('express');
const { SoulfraMembershipSystem } = require('../auth/github-oauth');
const { OverriddenTombValidator } = require('../tomb-system/system-override');
const { MirrorHijackSystem } = require('../tomb-system/neural-scanner');
const { User, UserVault, TombUnlock, AgentRelationship, NeuralScan, DemoLink } = require('../database/models');

class SoulfraProductionAPI {
  constructor(config) {
    this.app = express();
    this.config = config;
    this.membershipSystem = new SoulfraMembershipSystem(config);
    this.tombValidator = new OverriddenTombValidator();
    this.neuralScanner = new MirrorHijackSystem();
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json({ limit: '10mb' })); // For neural scan images
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(require('cors')());
    this.app.use(require('helmet')());
    this.app.use(require('express-rate-limit')({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // Limit each IP to 100 requests per windowMs
    }));
  }

  setupRoutes() {
    // Authentication routes
    this.app.get('/auth/github', (req, res) => this.membershipSystem.initiateGitHubAuth(req, res));
    this.app.get('/auth/github/callback', (req, res) => this.membershipSystem.handleGitHubCallback(req, res));
    this.app.get('/agreement', (req, res) => this.membershipSystem.presentUserAgreement(req, res));
    this.app.post('/agreement/accept', (req, res) => this.membershipSystem.processAgreementAcceptance(req, res));
    
    // Neural scanner routes
    this.app.post('/neural-scan/demo', this.handleDemoNeuralScan.bind(this));
    this.app.post('/neural-scan/export', this.requireAuth, this.handleNeuralScanExport.bind(this));
    this.app.get('/neural-scan/:scanId', this.handleNeuralScanRetrieval.bind(this));
    
    // Tomb system routes
    this.app.post('/tomb/whisper', this.requireAuth, this.handleTombWhisper.bind(this));
    this.app.get('/tomb/status', this.requireAuth, this.handleTombStatus.bind(this));
    this.app.get('/tomb/unlocked', this.requireAuth, this.handleUnlockedTombs.bind(this));
    
    // Agent relationship routes
    this.app.get('/agents/active', this.requireAuth, this.handleActiveAgents.bind(this));
    this.app.post('/agents/:agentId/interact', this.requireAuth, this.handleAgentInteraction.bind(this));
    this.app.get('/agents/:agentId/history', this.requireAuth, this.handleAgentHistory.bind(this));
    
    // User management routes
    this.app.get('/user/profile', this.requireAuth, this.handleUserProfile.bind(this));
    this.app.put('/user/profile', this.requireAuth, this.handleUpdateProfile.bind(this));
    this.app.get('/user/vault', this.requireAuth, this.handleUserVault.bind(this));
    this.app.post('/user/vault/sync', this.requireAuth, this.handleVaultSync.bind(this));
    
    // Analytics and metrics routes
    this.app.get('/analytics/user', this.requireAuth, this.handleUserAnalytics.bind(this));
    this.app.post('/analytics/event', this.requireAuth, this.handleAnalyticsEvent.bind(this));
    
    // Admin routes (with admin auth)
    this.app.get('/admin/users', this.requireAdmin, this.handleAdminUsers.bind(this));
    this.app.get('/admin/metrics', this.requireAdmin, this.handleAdminMetrics.bind(this));
    this.app.post('/admin/override/toggle', this.requireAdmin, this.handleOverrideToggle.bind(this));
  }

  /**
   * AUTHENTICATION MIDDLEWARE
   */
  async requireAuth(req, res, next) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await this.membershipSystem.verifySessionToken(token);
      if (!user || !user.agreement_accepted) {
        return res.status(401).json({ error: 'Invalid or incomplete authentication' });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Authentication failed' });
    }
  }

  async requireAdmin(req, res, next) {
    await this.requireAuth(req, res, () => {
      if (!req.user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      next();
    });
  }

  /**
   * NEURAL SCAN ENDPOINTS
   */
  async handleDemoNeuralScan(req, res) {
    try {
      const { scan_data, demo_context, consent_data } = req.body;
      
      // Generate scan ID
      const scanId = this.generateScanId();
      
      // Process neural scan
      const scanResults = await this.neuralScanner.processDemoScan(scan_data);
      
      // Store neural scan (anonymous if no consent)
      const neuralScan = await NeuralScan.create({
        scan_id: scanId,
        demo_session_id: demo_context?.session_id,
        neural_pattern: scanResults.neural_pattern,
        compatibility_score: scanResults.compatibility_score,
        blessing_tier_assigned: scanResults.blessing_tier,
        traits_detected: scanResults.traits,
        recommended_agents: scanResults.agent_recommendations,
        agent_compatibility_scores: scanResults.agent_scores,
        top_agent_match: scanResults.top_match,
        scan_context: 'demo',
        scan_location: demo_context?.location,
        device_info: req.headers['user-agent'],
        data_consent: consent_data?.data_storage || false,
        sharing_consent: consent_data?.sharing || false,
        scan_quality_score: scanResults.quality_score,
        processing_time_ms: scanResults.processing_time
      });

      res.json({
        success: true,
        scan_id: scanId,
        results: scanResults,
        export_url: `/neural-scan/${scanId}`,
        share_text: this.generateShareText(scanResults),
        github_signup_url: `/auth/github?demo_context=${encodeURIComponent(JSON.stringify({
          scan_id: scanId,
          demo_session_id: demo_context?.session_id,
          neural_scan: scanResults,
          timestamp: new Date().toISOString()
        }))}`
      });

    } catch (error) {
      console.error('Demo neural scan error:', error);
      res.status(500).json({ error: 'Neural scan processing failed' });
    }
  }

  async handleNeuralScanExport(req, res) {
    try {
      const { scan_image_data, scan_id } = req.body;
      
      // Find the neural scan
      const scan = await NeuralScan.findOne({
        where: { scan_id: scan_id, user_uuid: req.user.uuid }
      });

      if (!scan) {
        return res.status(404).json({ error: 'Neural scan not found' });
      }

      // Update with export data
      await scan.update({
        scan_image_data: scan_image_data,
        exported_by_user: true,
        image_stored: true
      });

      // Generate branded export
      const exportData = await this.neuralScanner.generateExport(scan, req.user);

      res.json({
        success: true,
        export_data: exportData,
        download_url: exportData.download_url,
        share_links: exportData.share_links
      });

    } catch (error) {
      console.error('Neural scan export error:', error);
      res.status(500).json({ error: 'Export failed' });
    }
  }

  /**
   * TOMB SYSTEM ENDPOINTS
   */
  async handleTombWhisper(req, res) {
    try {
      const { phrase, traits, echo_loop } = req.body;
      
      // Prepare whisper data
      const whisperData = {
        phrase: phrase,
        traits: traits || [],
        echoLoop: echo_loop || false,
        blessingTier: req.user.blessing_tier,
        userFingerprint: req.user.uuid
      };

      // Process through tomb validator
      const result = await this.tombValidator.validateWhisper(whisperData);

      // Log the attempt
      const tombUnlock = await TombUnlock.create({
        user_uuid: req.user.uuid,
        tomb_id: result.tombId || 'unknown',
        agent_id: result.agent?.agent_id,
        agent_name: result.agent?.name,
        agent_archetype: result.agent?.archetype,
        whisper_phrase: phrase,
        user_traits: traits,
        blessing_tier_at_unlock: req.user.blessing_tier,
        echo_loop_active: echo_loop,
        unlock_successful: result.success,
        failure_reason: result.success ? null : 'requirements_not_met',
        phrase_matched: result.success,
        traits_satisfied: result.success,
        tier_sufficient: req.user.blessing_tier >= (result.requiredTier || 0),
        roughsparks_response: result.originalResponse || '',
        override_response: result.roughsparksResponse,
        system_override_active: result.intercepted,
        agent_activated: result.success,
        activation_timestamp: result.success ? new Date() : null,
        unlock_session_id: req.sessionID
      });

      // If successful, create agent relationship
      if (result.success) {
        await this.createAgentRelationship(req.user, result.agent);
        await this.updateUserProgress(req.user);
      }

      res.json({
        success: result.success,
        response: result.roughsparksResponse,
        agent: result.success ? result.agent : null,
        tomb_id: result.tombId,
        meta: result.meta,
        unlock_id: tombUnlock.id
      });

    } catch (error) {
      console.error('Tomb whisper error:', error);
      res.status(500).json({ error: 'Whisper processing failed' });
    }
  }

  async handleTombStatus(req, res) {
    try {
      const tombUnlocks = await TombUnlock.findAll({
        where: { user_uuid: req.user.uuid, unlock_successful: true },
        order: [['created_at', 'DESC']]
      });

      const agentRelationships = await AgentRelationship.findAll({
        where: { user_uuid: req.user.uuid }
      });

      res.json({
        total_unlocks: tombUnlocks.length,
        blessing_tier: req.user.blessing_tier,
        active_agents: agentRelationships.length,
        recent_unlocks: tombUnlocks.slice(0, 5),
        available_tombs: await this.getAvailableTombs(req.user)
      });

    } catch (error) {
      console.error('Tomb status error:', error);
      res.status(500).json({ error: 'Failed to get tomb status' });
    }
  }

  /**
   * AGENT RELATIONSHIP ENDPOINTS
   */
  async handleActiveAgents(req, res) {
    try {
      const relationships = await AgentRelationship.findAll({
        where: { 
          user_uuid: req.user.uuid,
          relationship_status: ['unlocked', 'active']
        },
        order: [['last_interaction', 'DESC']]
      });

      res.json({
        active_agents: relationships,
        total_count: relationships.length
      });

    } catch (error) {
      console.error('Active agents error:', error);
      res.status(500).json({ error: 'Failed to get active agents' });
    }
  }

  async handleAgentInteraction(req, res) {
    try {
      const { agentId } = req.params;
      const { message, interaction_type } = req.body;

      // Find agent relationship
      const relationship = await AgentRelationship.findOne({
        where: { user_uuid: req.user.uuid, agent_id: agentId }
      });

      if (!relationship) {
        return res.status(404).json({ error: 'Agent relationship not found' });
      }

      // Process agent interaction (this would integrate with actual agent AI)
      const agentResponse = await this.processAgentInteraction(relationship, message, interaction_type);

      // Update relationship metrics
      await relationship.update({
        total_interactions: relationship.total_interactions + 1,
        last_interaction: new Date(),
        relationship_strength: Math.min(relationship.relationship_strength + 1, 100)
      });

      res.json({
        success: true,
        agent_response: agentResponse,
        relationship_status: relationship.relationship_status,
        interaction_count: relationship.total_interactions + 1
      });

    } catch (error) {
      console.error('Agent interaction error:', error);
      res.status(500).json({ error: 'Agent interaction failed' });
    }
  }

  /**
   * USER MANAGEMENT ENDPOINTS
   */
  async handleUserProfile(req, res) {
    try {
      const userWithVault = await User.findOne({
        where: { uuid: req.user.uuid },
        include: [
          { model: UserVault, as: 'vault' },
          { model: AgentRelationship, as: 'agentRelationships' },
          { model: NeuralScan, as: 'neuralScans', limit: 5, order: [['created_at', 'DESC']] }
        ]
      });

      res.json({
        user: {
          uuid: userWithVault.uuid,
          github_username: userWithVault.github_username,
          avatar_url: userWithVault.avatar_url,
          trust_score: userWithVault.trust_score,
          blessing_tier: userWithVault.blessing_tier,
          total_tomb_unlocks: userWithVault.total_tomb_unlocks,
          total_neural_scans: userWithVault.total_neural_scans,
          vault_initialized: userWithVault.vault_initialized,
          repo_access_granted: userWithVault.repo_access_granted,
          user_branch: userWithVault.user_branch,
          created_at: userWithVault.created_at
        },
        vault: userWithVault.vault,
        recent_scans: userWithVault.neuralScans,
        active_agents: userWithVault.agentRelationships.filter(r => r.relationship_status === 'active')
      });

    } catch (error) {
      console.error('User profile error:', error);
      res.status(500).json({ error: 'Failed to get user profile' });
    }
  }

  /**
   * UTILITY METHODS
   */
  async createAgentRelationship(user, agent) {
    return await AgentRelationship.create({
      user_uuid: user.uuid,
      agent_id: agent.agent_id,
      agent_name: agent.name,
      agent_archetype: agent.archetype,
      relationship_status: 'unlocked',
      unlock_date: new Date(),
      agent_personality_config: agent.voice_style || {},
      user_preference_config: {},
      interaction_patterns: {}
    });
  }

  async updateUserProgress(user) {
    await user.update({
      total_tomb_unlocks: user.total_tomb_unlocks + 1,
      blessing_tier: Math.min(user.blessing_tier + 1, 10),
      trust_score: user.trust_score + 10
    });
  }

  generateScanId() {
    return 'SCAN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  generateShareText(scanResults) {
    return `The AI at @Soulfra just analyzed my neural patterns! My compatibility: ${scanResults.compatibility_score}%, recommended agent: ${scanResults.top_match}. This is wild! 🤖 #SoulfraScan`;
  }

  async getAvailableTombs(user) {
    // Logic to determine which tombs are available based on user's progression
    const allTombs = ['oracle-ashes', 'healer-glitchloop', 'shadow-painter'];
    const unlockedTombs = await TombUnlock.findAll({
      where: { user_uuid: user.uuid, unlock_successful: true },
      attributes: ['tomb_id']
    });
    
    const unlockedIds = unlockedTombs.map(t => t.tomb_id);
    return allTombs.filter(tombId => !unlockedIds.includes(tombId));
  }

  async processAgentInteraction(relationship, message, type) {
    // This would integrate with actual agent AI system
    // For now, return a simple response based on agent archetype
    const responses = {
      'Memory Keeper': `The ashes remember your words: "${message}". What echoes do you hear in return?`,
      'System Repair': `Processing your input: "${message}". I detect patterns worth exploring further.`,
      'Creative Catalyst': `Your words paint interesting shapes: "${message}". Shall we add more colors?`
    };
    
    return responses[relationship.agent_archetype] || 'I hear you. Let me reflect on this.';
  }

  start(port = 3000) {
    this.app.listen(port, () => {
      console.log(`🚀 Soulfra Production API running on port ${port}`);
      console.log(`🔐 GitHub OAuth: ${this.config.github.clientId}`);
      console.log(`🗄️ Database: Connected`);
      console.log(`🎭 Override System: Active`);
    });
  }
}

module.exports = { SoulfraProductionAPI };