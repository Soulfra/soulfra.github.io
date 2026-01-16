const express = require('express');
const { v4: uuidv4 } = require('uuid');

class AgentPromotionServer {
  constructor(config, vaultLogger) {
    this.config = config;
    this.vaultLogger = vaultLogger;
    this.app = express();
    this.agents = new Map();
    this.reviews = new Map();
    this.promotions = new Map();
    this.campaigns = new Map();
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  setupRoutes() {
    // Agent management
    this.app.get('/api/agents/promoted', this.getPromotedAgents.bind(this));
    this.app.get('/api/agents/eligible', this.getEligibleAgents.bind(this));
    this.app.get('/api/agents/:id/promotion-status', this.getPromotionStatus.bind(this));
    
    // Review-based promotion
    this.app.post('/api/agents/:id/evaluate', this.evaluateAgentForPromotion.bind(this));
    this.app.post('/api/agents/:id/promote', this.promoteAgent.bind(this));
    this.app.post('/api/agents/:id/demote', this.demoteAgent.bind(this));
    
    // Promotion campaigns
    this.app.get('/api/campaigns', this.getCampaigns.bind(this));
    this.app.post('/api/campaigns', this.createCampaign.bind(this));
    this.app.get('/api/campaigns/:id', this.getCampaign.bind(this));
    this.app.put('/api/campaigns/:id', this.updateCampaign.bind(this));
    this.app.post('/api/campaigns/:id/agents/:agentId', this.addAgentToCampaign.bind(this));
    
    // Analytics and insights
    this.app.get('/api/analytics/promotion-trends', this.getPromotionTrends.bind(this));
    this.app.get('/api/analytics/review-impact', this.getReviewImpact.bind(this));
    this.app.get('/api/leaderboard', this.getLeaderboard.bind(this));
    
    // Review aggregation
    this.app.get('/api/reviews/agent/:agentId/summary', this.getAgentReviewSummary.bind(this));
    this.app.post('/api/reviews/sync', this.syncReviewsFromVibeGraph.bind(this));
  }

  async getPromotedAgents(req, res) {
    try {
      const { category, tier, limit = 20 } = req.query;
      let agents = Array.from(this.agents.values())
        .filter(agent => agent.promoted);

      // Apply filters
      if (category) {
        agents = agents.filter(agent => 
          agent.categories.includes(category)
        );
      }

      if (tier) {
        agents = agents.filter(agent => agent.tier === tier);
      }

      // Sort by promotion score
      agents.sort((a, b) => (b.promotionScore || 0) - (a.promotionScore || 0));
      
      // Limit results
      agents = agents.slice(0, parseInt(limit));

      res.json({
        success: true,
        agents,
        total: agents.length
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEligibleAgents(req, res) {
    try {
      const eligibleAgents = [];
      
      for (const [agentId, agent] of this.agents.entries()) {
        if (!agent.promoted) {
          const eligibility = await this.checkPromotionEligibility(agentId);
          if (eligibility.eligible) {
            eligibleAgents.push({
              ...agent,
              eligibility
            });
          }
        }
      }

      // Sort by eligibility score
      eligibleAgents.sort((a, b) => 
        (b.eligibility.score || 0) - (a.eligibility.score || 0)
      );

      res.json({
        success: true,
        agents: eligibleAgents
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPromotionStatus(req, res) {
    try {
      const agentId = req.params.id;
      const agent = this.agents.get(agentId);
      
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const eligibility = await this.checkPromotionEligibility(agentId);
      const reviewSummary = await this.getAgentReviewSummaryData(agentId);
      const promotionHistory = this.getAgentPromotionHistory(agentId);

      res.json({
        success: true,
        status: {
          agent,
          eligibility,
          reviewSummary,
          promotionHistory,
          promoted: agent.promoted || false,
          tier: agent.tier || 'standard'
        }
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async evaluateAgentForPromotion(req, res) {
    try {
      const agentId = req.params.id;
      const agent = this.agents.get(agentId);
      
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const evaluation = await this.performDetailedEvaluation(agentId);

      await this.vaultLogger.log('agent-promotion', 'agent_evaluated', {
        agentId,
        evaluation
      });

      res.json({
        success: true,
        evaluation
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async promoteAgent(req, res) {
    try {
      const agentId = req.params.id;
      const { tier = 'promoted', reason, campaignId } = req.body;
      
      const agent = this.agents.get(agentId);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Check eligibility
      const eligibility = await this.checkPromotionEligibility(agentId);
      if (!eligibility.eligible && !req.body.force) {
        return res.status(400).json({ 
          error: 'Agent not eligible for promotion',
          eligibility
        });
      }

      // Create promotion record
      const promotion = {
        id: uuidv4(),
        agentId,
        fromTier: agent.tier || 'standard',
        toTier: tier,
        timestamp: new Date().toISOString(),
        reason: reason || 'Review-based promotion',
        campaignId: campaignId || null,
        criteria: eligibility,
        promotedBy: req.body.promotedBy || 'system'
      };

      // Update agent
      agent.promoted = true;
      agent.tier = tier;
      agent.promotionDate = promotion.timestamp;
      agent.promotionScore = eligibility.score || 0;

      // Store promotion
      this.promotions.set(promotion.id, promotion);

      await this.vaultLogger.log('agent-promotion', 'agent_promoted', {
        agentId,
        promotion
      });

      res.json({
        success: true,
        promotion,
        agent
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async demoteAgent(req, res) {
    try {
      const agentId = req.params.id;
      const { reason } = req.body;
      
      const agent = this.agents.get(agentId);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      if (!agent.promoted) {
        return res.status(400).json({ error: 'Agent is not currently promoted' });
      }

      // Create demotion record
      const demotion = {
        id: uuidv4(),
        agentId,
        fromTier: agent.tier,
        toTier: 'standard',
        timestamp: new Date().toISOString(),
        reason: reason || 'Performance review',
        demotedBy: req.body.demotedBy || 'system'
      };

      // Update agent
      agent.promoted = false;
      agent.tier = 'standard';
      agent.demotionDate = demotion.timestamp;

      await this.vaultLogger.log('agent-promotion', 'agent_demoted', {
        agentId,
        demotion
      });

      res.json({
        success: true,
        demotion,
        agent
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCampaigns(req, res) {
    try {
      const { status, active } = req.query;
      let campaigns = Array.from(this.campaigns.values());

      if (status) {
        campaigns = campaigns.filter(campaign => campaign.status === status);
      }

      if (active === 'true') {
        const now = new Date();
        campaigns = campaigns.filter(campaign => 
          new Date(campaign.startDate) <= now && 
          new Date(campaign.endDate) >= now
        );
      }

      res.json({
        success: true,
        campaigns
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createCampaign(req, res) {
    try {
      const campaignData = {
        id: uuidv4(),
        name: req.body.name,
        description: req.body.description,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        criteria: req.body.criteria || {},
        rewards: req.body.rewards || {},
        agents: [],
        status: 'active',
        metadata: {
          created: new Date().toISOString(),
          creator: req.body.creator || 'system'
        }
      };

      this.campaigns.set(campaignData.id, campaignData);

      await this.vaultLogger.log('agent-promotion', 'campaign_created', {
        campaignId: campaignData.id,
        name: campaignData.name
      });

      res.json({
        success: true,
        campaign: campaignData
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCampaign(req, res) {
    try {
      const campaign = this.campaigns.get(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Get campaign analytics
      const analytics = await this.getCampaignAnalytics(campaign.id);

      res.json({
        success: true,
        campaign,
        analytics
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateCampaign(req, res) {
    try {
      const campaign = this.campaigns.get(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const updatedCampaign = {
        ...campaign,
        ...req.body,
        id: campaign.id, // Preserve ID
        metadata: {
          ...campaign.metadata,
          updated: new Date().toISOString()
        }
      };

      this.campaigns.set(campaign.id, updatedCampaign);

      await this.vaultLogger.log('agent-promotion', 'campaign_updated', {
        campaignId: campaign.id,
        changes: Object.keys(req.body)
      });

      res.json({
        success: true,
        campaign: updatedCampaign
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async addAgentToCampaign(req, res) {
    try {
      const { id: campaignId, agentId } = req.params;
      
      const campaign = this.campaigns.get(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const agent = this.agents.get(agentId);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Check if agent already in campaign
      if (campaign.agents.includes(agentId)) {
        return res.status(400).json({ error: 'Agent already in campaign' });
      }

      campaign.agents.push(agentId);

      await this.vaultLogger.log('agent-promotion', 'agent_added_to_campaign', {
        campaignId,
        agentId
      });

      res.json({
        success: true,
        campaign
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPromotionTrends(req, res) {
    try {
      const { timeRange = '30d' } = req.query;
      const promotions = Array.from(this.promotions.values());
      
      const cutoffDate = this.getTimeRangeCutoff(timeRange);
      const filteredPromotions = promotions.filter(promotion =>
        new Date(promotion.timestamp) >= cutoffDate
      );

      const trends = {
        totalPromotions: filteredPromotions.length,
        dailyBreakdown: this.calculateDailyPromotions(filteredPromotions, timeRange),
        tierDistribution: this.calculateTierDistribution(filteredPromotions),
        categoryBreakdown: this.calculateCategoryBreakdown(filteredPromotions),
        averageReviewScore: this.calculateAveragePromotionScore(filteredPromotions)
      };

      res.json({
        success: true,
        trends,
        timeRange
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getReviewImpact(req, res) {
    try {
      const impact = {
        promotionsTriggered: 0,
        averageRatingThreshold: this.config.promotionThreshold,
        reviewsRequired: this.config.reviewsRequired,
        categoryImpact: {},
        sentimentImpact: {}
      };

      // Calculate impact metrics
      const promotions = Array.from(this.promotions.values());
      impact.promotionsTriggered = promotions.length;

      // Analyze category impact
      for (const promotion of promotions) {
        const criteria = promotion.criteria;
        if (criteria.categoryScores) {
          Object.entries(criteria.categoryScores).forEach(([category, score]) => {
            if (!impact.categoryImpact[category]) {
              impact.categoryImpact[category] = { total: 0, count: 0 };
            }
            impact.categoryImpact[category].total += score;
            impact.categoryImpact[category].count++;
          });
        }
      }

      // Calculate averages
      Object.keys(impact.categoryImpact).forEach(category => {
        const data = impact.categoryImpact[category];
        data.average = data.total / data.count;
      });

      res.json({
        success: true,
        impact
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getLeaderboard(req, res) {
    try {
      const { category, limit = 10 } = req.query;
      let agents = Array.from(this.agents.values());

      // Filter by category if specified
      if (category) {
        agents = agents.filter(agent => 
          agent.categories && agent.categories.includes(category)
        );
      }

      // Calculate scores for all agents
      const leaderboard = [];
      for (const agent of agents) {
        const reviewSummary = await this.getAgentReviewSummaryData(agent.id);
        const eligibility = await this.checkPromotionEligibility(agent.id);
        
        leaderboard.push({
          ...agent,
          reviewSummary,
          score: eligibility.score || 0,
          rank: 0 // Will be set after sorting
        });
      }

      // Sort by score
      leaderboard.sort((a, b) => b.score - a.score);

      // Set ranks
      leaderboard.forEach((agent, index) => {
        agent.rank = index + 1;
      });

      // Limit results
      const topAgents = leaderboard.slice(0, parseInt(limit));

      res.json({
        success: true,
        leaderboard: topAgents,
        total: leaderboard.length
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAgentReviewSummary(req, res) {
    try {
      const agentId = req.params.agentId;
      const summary = await this.getAgentReviewSummaryData(agentId);

      res.json({
        success: true,
        summary
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async syncReviewsFromVibeGraph(req, res) {
    try {
      // This would typically integrate with the VibeGraph module
      // For now, we'll simulate the sync
      const syncedReviews = req.body.reviews || [];
      
      syncedReviews.forEach(review => {
        this.reviews.set(review.id, review);
      });

      await this.vaultLogger.log('agent-promotion', 'reviews_synced', {
        count: syncedReviews.length
      });

      res.json({
        success: true,
        synced: syncedReviews.length
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Helper methods
  async checkPromotionEligibility(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return { eligible: false, reason: 'Agent not found' };
    }

    const reviewSummary = await this.getAgentReviewSummaryData(agentId);
    
    // Check basic requirements
    const hasEnoughReviews = reviewSummary.totalReviews >= this.config.reviewsRequired;
    const hasGoodRating = reviewSummary.averageRating >= this.config.promotionThreshold;
    
    // Calculate category scores
    const categoryScores = {};
    this.config.categories.forEach(category => {
      categoryScores[category] = this.calculateCategoryScore(agentId, category);
    });

    // Calculate overall score
    const score = this.calculatePromotionScore(reviewSummary, categoryScores);

    const eligible = hasEnoughReviews && hasGoodRating && score >= 80;

    return {
      eligible,
      score,
      requirements: {
        hasEnoughReviews,
        hasGoodRating,
        requiredReviews: this.config.reviewsRequired,
        actualReviews: reviewSummary.totalReviews,
        requiredRating: this.config.promotionThreshold,
        actualRating: reviewSummary.averageRating
      },
      categoryScores,
      recommendation: this.generatePromotionRecommendation(score, eligible)
    };
  }

  async performDetailedEvaluation(agentId) {
    const eligibility = await this.checkPromotionEligibility(agentId);
    const reviewSummary = await this.getAgentReviewSummaryData(agentId);
    const competitorAnalysis = await this.getCompetitorAnalysis(agentId);
    const trendAnalysis = await this.getTrendAnalysis(agentId);

    return {
      eligibility,
      reviewSummary,
      competitorAnalysis,
      trendAnalysis,
      recommendations: this.generateDetailedRecommendations(eligibility, reviewSummary)
    };
  }

  async getAgentReviewSummaryData(agentId) {
    const agentReviews = Array.from(this.reviews.values())
      .filter(review => review.agentId === agentId);

    if (agentReviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        sentimentBreakdown: {},
        recentTrend: 'stable',
        categoryRatings: {}
      };
    }

    const totalRating = agentReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / agentReviews.length;

    // Sentiment breakdown
    const sentimentBreakdown = {};
    agentReviews.forEach(review => {
      if (review.sentiment) {
        const sentiment = review.sentiment.label;
        sentimentBreakdown[sentiment] = (sentimentBreakdown[sentiment] || 0) + 1;
      }
    });

    // Recent trend (last 10 reviews vs previous 10)
    const sortedReviews = agentReviews.sort((a, b) => 
      new Date(b.metadata.timestamp) - new Date(a.metadata.timestamp)
    );
    
    const recentReviews = sortedReviews.slice(0, 10);
    const previousReviews = sortedReviews.slice(10, 20);
    
    let recentTrend = 'stable';
    if (recentReviews.length >= 5 && previousReviews.length >= 5) {
      const recentAvg = recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length;
      const previousAvg = previousReviews.reduce((sum, r) => sum + r.rating, 0) / previousReviews.length;
      
      if (recentAvg > previousAvg + 0.3) recentTrend = 'improving';
      else if (recentAvg < previousAvg - 0.3) recentTrend = 'declining';
    }

    return {
      totalReviews: agentReviews.length,
      averageRating,
      sentimentBreakdown,
      recentTrend,
      categoryRatings: this.calculateCategoryRatings(agentReviews),
      recentReviews: recentReviews.slice(0, 5)
    };
  }

  calculateCategoryScore(agentId, category) {
    const agentReviews = Array.from(this.reviews.values())
      .filter(review => review.agentId === agentId);

    // Simple scoring based on review content and ratings
    let categoryScore = 0;
    let relevantReviews = 0;

    agentReviews.forEach(review => {
      if (review.textReview && review.textReview.toLowerCase().includes(category.toLowerCase())) {
        categoryScore += review.rating;
        relevantReviews++;
      }
    });

    return relevantReviews > 0 ? (categoryScore / relevantReviews) * 20 : 50; // Scale to 0-100
  }

  calculatePromotionScore(reviewSummary, categoryScores) {
    let score = 0;

    // Base score from rating (0-40 points)
    score += (reviewSummary.averageRating / 5) * 40;

    // Review count bonus (0-20 points)
    const reviewBonus = Math.min(reviewSummary.totalReviews / 10, 1) * 20;
    score += reviewBonus;

    // Category performance (0-30 points)
    const categoryValues = Object.values(categoryScores);
    if (categoryValues.length > 0) {
      const avgCategoryScore = categoryValues.reduce((sum, score) => sum + score, 0) / categoryValues.length;
      score += (avgCategoryScore / 100) * 30;
    }

    // Trend bonus (0-10 points)
    if (reviewSummary.recentTrend === 'improving') score += 10;
    else if (reviewSummary.recentTrend === 'declining') score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  generatePromotionRecommendation(score, eligible) {
    if (eligible) {
      if (score >= 90) return 'Highly recommended for promotion';
      if (score >= 80) return 'Recommended for promotion';
      return 'Eligible for promotion with monitoring';
    } else {
      if (score >= 70) return 'Close to promotion - needs more reviews';
      if (score >= 50) return 'Improving - continue monitoring';
      return 'Needs significant improvement';
    }
  }

  generateDetailedRecommendations(eligibility, reviewSummary) {
    const recommendations = [];

    if (!eligibility.requirements.hasEnoughReviews) {
      recommendations.push({
        type: 'reviews',
        message: `Need ${eligibility.requirements.requiredReviews - eligibility.requirements.actualReviews} more reviews`,
        priority: 'high'
      });
    }

    if (!eligibility.requirements.hasGoodRating) {
      recommendations.push({
        type: 'rating',
        message: `Improve rating from ${eligibility.requirements.actualRating.toFixed(1)} to ${eligibility.requirements.requiredRating}`,
        priority: 'high'
      });
    }

    if (reviewSummary.recentTrend === 'declining') {
      recommendations.push({
        type: 'trend',
        message: 'Address declining review trend',
        priority: 'medium'
      });
    }

    // Category-specific recommendations
    Object.entries(eligibility.categoryScores).forEach(([category, score]) => {
      if (score < 60) {
        recommendations.push({
          type: 'category',
          message: `Improve performance in ${category} (currently ${score.toFixed(1)}/100)`,
          priority: 'medium'
        });
      }
    });

    return recommendations;
  }

  async getCompetitorAnalysis(agentId) {
    // Simple competitor analysis
    const agent = this.agents.get(agentId);
    if (!agent) return {};

    const competitors = Array.from(this.agents.values())
      .filter(a => a.id !== agentId && a.type === agent.type)
      .slice(0, 5);

    const analysis = {
      position: 'middle',
      betterThan: 0,
      totalCompetitors: competitors.length
    };

    // This would be more sophisticated in a real implementation
    return analysis;
  }

  async getTrendAnalysis(agentId) {
    const agentReviews = Array.from(this.reviews.values())
      .filter(review => review.agentId === agentId)
      .sort((a, b) => new Date(a.metadata.timestamp) - new Date(b.metadata.timestamp));

    if (agentReviews.length < 5) {
      return { trend: 'insufficient_data', confidence: 0 };
    }

    // Simple trend analysis
    const recentRatings = agentReviews.slice(-5).map(r => r.rating);
    const olderRatings = agentReviews.slice(-10, -5).map(r => r.rating);

    const recentAvg = recentRatings.reduce((sum, r) => sum + r, 0) / recentRatings.length;
    const olderAvg = olderRatings.length > 0 ? 
      olderRatings.reduce((sum, r) => sum + r, 0) / olderRatings.length : recentAvg;

    let trend = 'stable';
    if (recentAvg > olderAvg + 0.3) trend = 'improving';
    else if (recentAvg < olderAvg - 0.3) trend = 'declining';

    return {
      trend,
      confidence: Math.min(agentReviews.length / 20, 1),
      recentAverage: recentAvg,
      previousAverage: olderAvg
    };
  }

  calculateCategoryRatings(reviews) {
    const categoryRatings = {};

    this.config.categories.forEach(category => {
      const categoryReviews = reviews.filter(review =>
        review.textReview && 
        review.textReview.toLowerCase().includes(category.toLowerCase())
      );

      if (categoryReviews.length > 0) {
        const avgRating = categoryReviews.reduce((sum, r) => sum + r.rating, 0) / categoryReviews.length;
        categoryRatings[category] = {
          rating: avgRating,
          count: categoryReviews.length
        };
      }
    });

    return categoryRatings;
  }

  getAgentPromotionHistory(agentId) {
    return Array.from(this.promotions.values())
      .filter(promotion => promotion.agentId === agentId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  async getCampaignAnalytics(campaignId) {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return {};

    return {
      totalAgents: campaign.agents.length,
      promotedAgents: campaign.agents.filter(agentId => {
        const agent = this.agents.get(agentId);
        return agent && agent.promoted;
      }).length,
      averageScore: 0, // Would calculate from agent scores
      status: campaign.status
    };
  }

  // Utility methods
  getTimeRangeCutoff(timeRange) {
    const now = new Date();
    const ranges = {
      '7d': 7,
      '30d': 30,
      '90d': 90
    };
    
    const days = ranges[timeRange] || 30;
    return new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  }

  calculateDailyPromotions(promotions, timeRange) {
    const breakdown = {};
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      breakdown[dateKey] = 0;
    }

    promotions.forEach(promotion => {
      const dateKey = promotion.timestamp.split('T')[0];
      if (breakdown.hasOwnProperty(dateKey)) {
        breakdown[dateKey]++;
      }
    });

    return breakdown;
  }

  calculateTierDistribution(promotions) {
    const distribution = {};
    promotions.forEach(promotion => {
      const tier = promotion.toTier;
      distribution[tier] = (distribution[tier] || 0) + 1;
    });
    return distribution;
  }

  calculateCategoryBreakdown(promotions) {
    const breakdown = {};
    
    promotions.forEach(promotion => {
      const agent = this.agents.get(promotion.agentId);
      if (agent && agent.categories) {
        agent.categories.forEach(category => {
          breakdown[category] = (breakdown[category] || 0) + 1;
        });
      }
    });

    return breakdown;
  }

  calculateAveragePromotionScore(promotions) {
    if (promotions.length === 0) return 0;
    
    const totalScore = promotions.reduce((sum, promotion) => {
      return sum + (promotion.criteria.score || 0);
    }, 0);

    return totalScore / promotions.length;
  }

  // Initialize with sample data
  initializeSampleData() {
    // Add sample agents
    const sampleAgents = [
      {
        id: 'agent-1',
        name: 'Cal Assistant',
        type: 'chat',
        categories: ['helpful', 'friendly'],
        promoted: false,
        tier: 'standard'
      },
      {
        id: 'agent-2',
        name: 'Creative Helper',
        type: 'creative',
        categories: ['creative', 'efficient'],
        promoted: true,
        tier: 'promoted',
        promotionScore: 87
      }
    ];

    sampleAgents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });
  }

  start(port) {
    this.initializeSampleData();
    
    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        console.log(`Agent Promotion server running on port ${port}`);
        resolve();
      });
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}

module.exports = AgentPromotionServer;