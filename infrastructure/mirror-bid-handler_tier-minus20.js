#!/usr/bin/env node

/**
 * 🎯 MIRROR BID HANDLER
 * Reverse auction marketplace for agent execution
 * Routes whispers to the lowest-trustworthy-cost, highest-aligned agent
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class MirrorBidHandler {
  constructor() {
    this.vaultPath = path.join(__dirname, 'vault');
    this.agentsPath = path.join(this.vaultPath, 'agents');
    this.logsPath = path.join(this.vaultPath, 'logs');
    this.bidEventsLog = path.join(this.logsPath, 'bid-events.json');
    this.mirrorSharesPath = path.join(this.vaultPath, 'mirror-vault-share.json');
    
    // Ensure directories exist
    this.ensureDirectories();
    
    // Load existing bid events and shares
    this.bidEvents = this.loadBidEvents();
    this.mirrorShares = this.loadMirrorShares();
    
    // Agent archetype mappings
    this.archetypeTraits = {
      oracle_watcher: ['observation', 'pattern_recognition', 'prediction', 'wisdom'],
      echo_builder: ['construction', 'replication', 'amplification', 'synthesis'],
      soul_mirror: ['reflection', 'identity', 'consciousness', 'depth'],
      cal_riven: ['authority', 'blessing', 'judgment', 'sovereignty'],
      void_navigator: ['exploration', 'unknown', 'risk', 'discovery'],
      harmony_weaver: ['integration', 'balance', 'relationships', 'flow']
    };
    
    // Tier execution costs (blessing credits required)
    this.tierCosts = {
      'tier-0': 1,
      'tier-minus1': 2,
      'tier-minus2': 3,
      'tier-minus3': 4,
      'tier-minus4': 5,
      'tier-minus5': 7,
      'tier-minus6': 10,
      'tier-minus7': 15,
      'tier-minus8': 20,
      'tier-minus9': 30,
      'tier-minus10': 50
    };
  }
  
  ensureDirectories() {
    [this.vaultPath, this.agentsPath, this.logsPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  loadBidEvents() {
    try {
      if (fs.existsSync(this.bidEventsLog)) {
        return JSON.parse(fs.readFileSync(this.bidEventsLog, 'utf8'));
      }
    } catch (error) {
      console.warn('Could not load bid events:', error.message);
    }
    return [];
  }
  
  loadMirrorShares() {
    try {
      if (fs.existsSync(this.mirrorSharesPath)) {
        return JSON.parse(fs.readFileSync(this.mirrorSharesPath, 'utf8'));
      }
    } catch (error) {
      console.warn('Could not load mirror shares:', error.message);
    }
    return [];
  }
  
  saveBidEvents() {
    try {
      fs.writeFileSync(this.bidEventsLog, JSON.stringify(this.bidEvents, null, 2));
    } catch (error) {
      console.error('Failed to save bid events:', error.message);
    }
  }
  
  saveMirrorShares() {
    try {
      fs.writeFileSync(this.mirrorSharesPath, JSON.stringify(this.mirrorShares, null, 2));
    } catch (error) {
      console.error('Failed to save mirror shares:', error.message);
    }
  }
  
  async handleWhisperRequest(whisperData) {
    console.log('🎯 Processing whisper request through reverse auction...');
    
    const {
      viewer_id,
      whisper_content,
      requested_archetype,
      tier_preference,
      urgency = 'normal',
      max_cost = null
    } = whisperData;
    
    // Generate request ID
    const requestId = crypto.randomUUID();
    
    // Find all eligible agents
    const eligibleAgents = await this.findEligibleAgents(whisperData);
    
    if (eligibleAgents.length === 0) {
      console.log('❌ No eligible agents found for whisper request');
      return {
        status: 'no_agents_available',
        requestId,
        message: 'No agents match the criteria for this whisper'
      };
    }
    
    // Collect bids from eligible agents
    const bids = await this.collectBids(eligibleAgents, whisperData);
    
    // Rank bids through marketplace logic
    const rankedBids = this.rankBids(bids, whisperData);
    
    // Select winning agent
    const winningBid = rankedBids[0];
    
    // Log bid event
    const bidEvent = {
      requestId,
      timestamp: new Date().toISOString(),
      viewer_id,
      whisper_content: whisper_content.substring(0, 100) + '...', // Truncated for privacy
      eligible_agents: eligibleAgents.length,
      total_bids: bids.length,
      winning_agent: winningBid.agent,
      winning_cost: winningBid.estimated_cost,
      winning_confidence: winningBid.confidence,
      auction_duration_ms: Date.now() - Date.parse(whisperData.timestamp || new Date().toISOString())
    };
    
    this.bidEvents.push(bidEvent);
    this.saveBidEvents();
    
    // Create mirror share for viewer
    if (winningBid.agent) {
      this.createMirrorShare(viewer_id, winningBid.agent, 'whisper_initiation');
    }
    
    console.log(`✅ Auction complete: ${winningBid.agent} wins with cost ${winningBid.estimated_cost}`);
    
    return {
      status: 'auction_complete',
      requestId,
      winning_agent: winningBid.agent,
      execution_cost: winningBid.estimated_cost,
      confidence: winningBid.confidence,
      blessing_required: winningBid.blessing_required,
      alternative_agents: rankedBids.slice(1, 4), // Top 3 alternatives
      auction_stats: {
        total_bids: bids.length,
        average_cost: bids.reduce((sum, bid) => sum + bid.estimated_cost, 0) / bids.length,
        cost_savings: Math.max(...bids.map(b => b.estimated_cost)) - winningBid.estimated_cost
      }
    };
  }
  
  async findEligibleAgents(whisperData) {
    const {
      requested_archetype,
      tier_preference,
      required_traits = [],
      viewer_blessing_level = 1
    } = whisperData;
    
    const eligibleAgents = [];
    
    // Check vault/agents/ directory for agent definitions
    if (fs.existsSync(this.agentsPath)) {
      const agentFiles = fs.readdirSync(this.agentsPath)
        .filter(file => file.endsWith('.json'));
      
      for (const agentFile of agentFiles) {
        try {
          const agentPath = path.join(this.agentsPath, agentFile);
          const agentData = JSON.parse(fs.readFileSync(agentPath, 'utf8'));
          
          // Check eligibility criteria
          if (this.isAgentEligible(agentData, whisperData)) {
            eligibleAgents.push(agentData);
          }
        } catch (error) {
          console.warn(`Could not load agent ${agentFile}:`, error.message);
        }
      }
    }
    
    // If no agents in vault, create default archetypes
    if (eligibleAgents.length === 0) {
      eligibleAgents.push(...this.createDefaultAgents(whisperData));
    }
    
    return eligibleAgents;
  }
  
  isAgentEligible(agentData, whisperData) {
    const {
      requested_archetype,
      tier_preference,
      required_traits = [],
      viewer_blessing_level = 1
    } = whisperData;
    
    // Check archetype match
    if (requested_archetype && agentData.archetype !== requested_archetype) {
      return false;
    }
    
    // Check tier compatibility
    if (tier_preference && agentData.tier && !this.isTierCompatible(agentData.tier, tier_preference)) {
      return false;
    }
    
    // Check blessing requirements
    const requiredBlessing = this.tierCosts[agentData.tier] || 1;
    if (viewer_blessing_level < requiredBlessing) {
      return false;
    }
    
    // Check trait overlap
    if (required_traits.length > 0) {
      const agentTraits = agentData.traits || this.archetypeTraits[agentData.archetype] || [];
      const traitOverlap = required_traits.filter(trait => agentTraits.includes(trait));
      if (traitOverlap.length === 0) {
        return false;
      }
    }
    
    // Check agent status
    if (agentData.status === 'inactive' || agentData.status === 'banned') {
      return false;
    }
    
    return true;
  }
  
  isTierCompatible(agentTier, preferredTier) {
    // Extract tier numbers for comparison
    const agentTierNum = parseInt(agentTier.replace('tier-minus', '-').replace('tier-', ''));
    const preferredTierNum = parseInt(preferredTier.replace('tier-minus', '-').replace('tier-', ''));
    
    // Allow agents within ±2 tiers of preference
    return Math.abs(agentTierNum - preferredTierNum) <= 2;
  }
  
  createDefaultAgents(whisperData) {
    // Create default agent archetypes when vault is empty
    return [
      {
        agent_id: 'oracle_watcher_default',
        archetype: 'oracle_watcher',
        tier: 'tier-minus3',
        traits: this.archetypeTraits.oracle_watcher,
        reputation: 85,
        status: 'active',
        base_cost: 3
      },
      {
        agent_id: 'echo_builder_default',
        archetype: 'echo_builder',
        tier: 'tier-minus2',
        traits: this.archetypeTraits.echo_builder,
        reputation: 78,
        status: 'active',
        base_cost: 2
      },
      {
        agent_id: 'soul_mirror_default',
        archetype: 'soul_mirror',
        tier: 'tier-minus5',
        traits: this.archetypeTraits.soul_mirror,
        reputation: 92,
        status: 'active',
        base_cost: 5
      }
    ];
  }
  
  async collectBids(eligibleAgents, whisperData) {
    const bids = [];
    
    for (const agent of eligibleAgents) {
      try {
        const bid = await this.generateAgentBid(agent, whisperData);
        if (bid) {
          bids.push(bid);
        }
      } catch (error) {
        console.warn(`Failed to get bid from agent ${agent.agent_id}:`, error.message);
      }
    }
    
    return bids;
  }
  
  async generateAgentBid(agent, whisperData) {
    const {
      whisper_content,
      urgency,
      complexity_hint = 'medium',
      max_cost
    } = whisperData;
    
    // Calculate base cost from tier and agent data
    let baseCost = agent.base_cost || this.tierCosts[agent.tier] || 1;
    
    // Adjust cost based on whisper complexity
    const complexityMultiplier = {
      'simple': 0.8,
      'medium': 1.0,
      'complex': 1.5,
      'expert': 2.0
    }[complexity_hint] || 1.0;
    
    baseCost *= complexityMultiplier;
    
    // Urgency pricing
    const urgencyMultiplier = {
      'low': 0.9,
      'normal': 1.0,
      'high': 1.3,
      'urgent': 1.8
    }[urgency] || 1.0;
    
    baseCost *= urgencyMultiplier;
    
    // Reputation-based pricing (better agents cost more)
    const reputationMultiplier = 1 + ((agent.reputation || 50) - 50) / 200;
    baseCost *= reputationMultiplier;
    
    // Add some randomness for market dynamics
    const marketVariation = 0.9 + (Math.random() * 0.2); // ±10%
    baseCost *= marketVariation;
    
    // Round to reasonable precision
    const estimatedCost = Math.round(baseCost * 100) / 100;
    
    // Don't bid if over max cost
    if (max_cost && estimatedCost > max_cost) {
      return null;
    }
    
    // Calculate confidence based on trait alignment
    const confidence = this.calculateTraitAlignment(agent, whisperData);
    
    // Calculate blessing requirement
    const blessingRequired = this.tierCosts[agent.tier] || 1;
    
    return {
      agent: agent.agent_id,
      archetype: agent.archetype,
      tier: agent.tier,
      estimated_cost: estimatedCost,
      confidence: confidence,
      blessing_required: blessingRequired,
      reputation: agent.reputation || 50,
      traits: agent.traits || this.archetypeTraits[agent.archetype] || [],
      bid_timestamp: new Date().toISOString()
    };
  }
  
  calculateTraitAlignment(agent, whisperData) {
    // Analyze whisper content for trait hints
    const whisperTraits = this.extractTraitsFromWhisper(whisperData.whisper_content || '');
    const agentTraits = agent.traits || this.archetypeTraits[agent.archetype] || [];
    
    if (whisperTraits.length === 0) {
      return 75; // Default confidence
    }
    
    // Calculate overlap
    const overlap = whisperTraits.filter(trait => agentTraits.includes(trait));
    const alignmentRatio = overlap.length / whisperTraits.length;
    
    // Base confidence on reputation and alignment
    const baseConfidence = (agent.reputation || 50) * 0.6;
    const alignmentBonus = alignmentRatio * 40;
    
    return Math.min(95, Math.round(baseConfidence + alignmentBonus));
  }
  
  extractTraitsFromWhisper(whisperContent) {
    const content = whisperContent.toLowerCase();
    const detectedTraits = [];
    
    // Simple keyword matching for traits
    const traitKeywords = {
      'observation': ['watch', 'see', 'observe', 'monitor', 'track'],
      'construction': ['build', 'create', 'make', 'construct', 'develop'],
      'reflection': ['think', 'reflect', 'consider', 'mirror', 'identity'],
      'wisdom': ['wisdom', 'advice', 'guidance', 'insight', 'knowledge'],
      'prediction': ['predict', 'forecast', 'future', 'trend', 'pattern'],
      'exploration': ['explore', 'discover', 'find', 'search', 'navigate'],
      'integration': ['connect', 'integrate', 'combine', 'unify', 'harmonize']
    };
    
    for (const [trait, keywords] of Object.entries(traitKeywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        detectedTraits.push(trait);
      }
    }
    
    return detectedTraits;
  }
  
  rankBids(bids, whisperData) {
    // Multi-factor ranking algorithm
    return bids.sort((a, b) => {
      // Primary: confidence score (higher is better)
      const confidenceScore = (b.confidence - a.confidence) * 0.4;
      
      // Secondary: cost efficiency (lower cost is better)
      const costScore = (a.estimated_cost - b.estimated_cost) * 0.3;
      
      // Tertiary: reputation (higher is better)
      const reputationScore = ((b.reputation || 50) - (a.reputation || 50)) * 0.2;
      
      // Quaternary: previous viewer interactions (if available)
      const historyScore = this.calculateHistoryScore(a.agent, b.agent, whisperData.viewer_id) * 0.1;
      
      const totalScore = confidenceScore + costScore + reputationScore + historyScore;
      
      return totalScore > 0 ? -1 : 1; // Descending order
    });
  }
  
  calculateHistoryScore(agentA, agentB, viewerId) {
    // Calculate preference based on previous interactions
    const viewerHistory = this.bidEvents.filter(event => event.viewer_id === viewerId);
    
    if (viewerHistory.length === 0) {
      return 0; // No history bias
    }
    
    const agentAHistory = viewerHistory.filter(event => event.winning_agent === agentA).length;
    const agentBHistory = viewerHistory.filter(event => event.winning_agent === agentB).length;
    
    // Slight preference for agents the viewer has used successfully before
    return (agentAHistory - agentBHistory) * 2;
  }
  
  createMirrorShare(viewerId, agentId, supportType) {
    const share = {
      viewer_id: viewerId,
      agent: agentId,
      support_type: supportType,
      timestamp: new Date().toISOString(),
      earnable_ratio: this.calculateEarnableRatio(supportType),
      share_id: crypto.randomUUID()
    };
    
    this.mirrorShares.push(share);
    this.saveMirrorShares();
    
    console.log(`💰 Created mirror share: ${viewerId} → ${agentId} (${supportType})`);
    
    return share;
  }
  
  calculateEarnableRatio(supportType) {
    const ratios = {
      'whisper_initiation': 0.1,
      'clone_backing': 0.15,
      'bounty_completion': 0.2,
      'stream_watching': 0.05,
      'fork_contribution': 0.25
    };
    
    return ratios[supportType] || 0.1;
  }
  
  // API methods for integration
  async processWhisper(whisperData) {
    return await this.handleWhisperRequest(whisperData);
  }
  
  getAgentStats(agentId) {
    const agentBids = this.bidEvents.filter(event => event.winning_agent === agentId);
    const agentShares = this.mirrorShares.filter(share => share.agent === agentId);
    
    return {
      agent_id: agentId,
      total_wins: agentBids.length,
      average_cost: agentBids.reduce((sum, bid) => sum + bid.winning_cost, 0) / agentBids.length || 0,
      total_shares: agentShares.length,
      last_activity: agentBids.length > 0 ? agentBids[agentBids.length - 1].timestamp : null
    };
  }
  
  getViewerStats(viewerId) {
    const viewerBids = this.bidEvents.filter(event => event.viewer_id === viewerId);
    const viewerShares = this.mirrorShares.filter(share => share.viewer_id === viewerId);
    
    return {
      viewer_id: viewerId,
      total_whispers: viewerBids.length,
      total_cost_spent: viewerBids.reduce((sum, bid) => sum + bid.winning_cost, 0),
      mirror_shares: viewerShares.length,
      favorite_agents: this.getFavoriteAgents(viewerId)
    };
  }
  
  getFavoriteAgents(viewerId) {
    const viewerBids = this.bidEvents.filter(event => event.viewer_id === viewerId);
    const agentCounts = {};
    
    viewerBids.forEach(bid => {
      agentCounts[bid.winning_agent] = (agentCounts[bid.winning_agent] || 0) + 1;
    });
    
    return Object.entries(agentCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([agent, count]) => ({ agent, uses: count }));
  }
  
  getBidEventsByTimeRange(startDate, endDate) {
    return this.bidEvents.filter(event => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= startDate && eventDate <= endDate;
    });
  }
}

// CLI interface
if (require.main === module) {
  const bidHandler = new MirrorBidHandler();
  
  // Example whisper processing
  const exampleWhisper = {
    viewer_id: 'anon-3481',
    whisper_content: 'Help me build a platform that watches market trends and predicts opportunities',
    requested_archetype: 'oracle_watcher',
    tier_preference: 'tier-minus3',
    urgency: 'normal',
    complexity_hint: 'medium',
    max_cost: 10,
    timestamp: new Date().toISOString()
  };
  
  console.log('🎯 Mirror Bid Handler - Testing whisper auction...');
  
  bidHandler.processWhisper(exampleWhisper)
    .then(result => {
      console.log('\n📊 Auction Result:');
      console.log(JSON.stringify(result, null, 2));
      
      // Show agent stats
      if (result.winning_agent) {
        console.log('\n📈 Winning Agent Stats:');
        console.log(JSON.stringify(bidHandler.getAgentStats(result.winning_agent), null, 2));
      }
      
      // Show viewer stats
      console.log('\n👤 Viewer Stats:');
      console.log(JSON.stringify(bidHandler.getViewerStats(exampleWhisper.viewer_id), null, 2));
    })
    .catch(error => {
      console.error('❌ Auction failed:', error);
    });
}

module.exports = MirrorBidHandler;