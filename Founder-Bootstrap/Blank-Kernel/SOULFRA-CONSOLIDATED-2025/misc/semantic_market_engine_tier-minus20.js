/**
 * Semantic Market Analysis & Dynamic Pricing Engine
 * Uses ML clustering to identify agent archetypes and predict market values
 * Powers the AI Agent Grand Exchange with sophisticated market mechanics
 */

import * as tf from '@tensorflow/tfjs-node';
import { createCanvas } from 'canvas';

class SemanticMarketEngine {
  constructor() {
    this.sentenceModel = null;
    this.clusterModel = null;
    this.pricingModel = null;
    this.marketSegments = new Map();
    this.priceHistory = new Map();
    this.demandSignals = new Map();
    
    // Market archetype definitions
    this.archetypes = {
      'productivity_enhancer': {
        keywords: ['efficiency', 'workflow', 'automation', 'task', 'productivity'],
        base_multiplier: 1.2,
        seasonal_patterns: { 'Q1': 1.4, 'Q4': 1.6 }, // New year productivity, year-end rush
        target_audience: ['professionals', 'enterprises', 'freelancers']
      },
      'creative_catalyst': {
        keywords: ['creative', 'writing', 'art', 'design', 'inspiration'],
        base_multiplier: 1.5,
        seasonal_patterns: { 'summer': 0.8, 'back_to_school': 1.3 },
        target_audience: ['creators', 'artists', 'students', 'marketers']
      },
      'analytical_brain': {
        keywords: ['analysis', 'data', 'research', 'logic', 'reasoning'],
        base_multiplier: 1.8,
        seasonal_patterns: { 'earnings_season': 2.0, 'academic_year': 1.4 },
        target_audience: ['researchers', 'analysts', 'consultants', 'academics']
      },
      'social_connector': {
        keywords: ['communication', 'social', 'empathy', 'relationship', 'support'],
        base_multiplier: 1.3,
        seasonal_patterns: { 'holidays': 1.5, 'valentine': 1.7 },
        target_audience: ['hr_teams', 'customer_service', 'therapists', 'coaches']
      },
      'compliance_guardian': {
        keywords: ['compliance', 'security', 'regulation', 'audit', 'governance'],
        base_multiplier: 2.2,
        seasonal_patterns: { 'Q4': 2.5, 'regulatory_deadline': 3.0 },
        target_audience: ['enterprises', 'financial_services', 'healthcare', 'government']
      },
      'innovation_driver': {
        keywords: ['innovation', 'breakthrough', 'experimental', 'cutting_edge', 'research'],
        base_multiplier: 2.5,
        seasonal_patterns: { 'funding_rounds': 3.0, 'conference_season': 2.8 },
        target_audience: ['startups', 'r_and_d', 'venture_capital', 'tech_companies']
      }
    };
    
    // Market event triggers
    this.marketEvents = {
      'ai_breakthrough': { impact: 1.5, duration: '72h', affected: ['innovation_driver', 'analytical_brain'] },
      'regulatory_update': { impact: 2.0, duration: '168h', affected: ['compliance_guardian'] },
      'economic_uncertainty': { impact: 0.7, duration: '720h', affected: ['all'] },
      'funding_boom': { impact: 1.8, duration: '240h', affected: ['innovation_driver', 'analytical_brain'] },
      'enterprise_adoption': { impact: 1.4, duration: '480h', affected: ['productivity_enhancer', 'compliance_guardian'] }
    };
  }

  async initialize() {
    console.log('🧠 Initializing Semantic Market Engine...');
    
    // Load or create sentence embedding model
    await this.initializeSentenceModel();
    
    // Initialize clustering model
    await this.initializeClusterModel();
    
    // Initialize pricing prediction model
    await this.initializePricingModel();
    
    console.log('✅ Semantic Market Engine ready');
  }

  async initializeSentenceModel() {
    // Simplified sentence embedding (in production, use SentenceTransformers or similar)
    this.sentenceModel = {
      encode: (texts) => {
        return texts.map(text => this.createSimpleEmbedding(text));
      }
    };
  }

  createSimpleEmbedding(text) {
    const words = text.toLowerCase().split(/\\W+/);
    const embedding = new Array(384).fill(0); // Standard sentence embedding size
    
    // Simple bag-of-words with archetype weighting
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      embedding[hash % 384] += 1;
      
      // Boost archetype-relevant words
      Object.entries(this.archetypes).forEach(([archetype, config]) => {
        if (config.keywords.includes(word)) {
          embedding[hash % 384] += 2;
        }
      });
    });
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  async initializeClusterModel() {
    // K-means clustering for agent archetype identification
    this.clusterModel = {
      numClusters: Object.keys(this.archetypes).length,
      centroids: this.initializeRandomCentroids(Object.keys(this.archetypes).length, 384),
      predict: (embeddings) => this.performClustering(embeddings)
    };
  }

  initializeRandomCentroids(numClusters, dimensions) {
    const centroids = [];
    for (let i = 0; i < numClusters; i++) {
      const centroid = [];
      for (let j = 0; j < dimensions; j++) {
        centroid.push(Math.random() * 2 - 1); // Random between -1 and 1
      }
      centroids.push(centroid);
    }
    return centroids;
  }

  performClustering(embeddings) {
    return embeddings.map(embedding => {
      let minDistance = Infinity;
      let closestCluster = 0;
      
      this.clusterModel.centroids.forEach((centroid, index) => {
        const distance = this.euclideanDistance(embedding, centroid);
        if (distance < minDistance) {
          minDistance = distance;
          closestCluster = index;
        }
      });
      
      return closestCluster;
    });
  }

  euclideanDistance(a, b) {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  }

  async initializePricingModel() {
    // Neural network for price prediction
    this.pricingModel = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [20], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'linear' }) // Price output
      ]
    });

    this.pricingModel.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
  }

  /**
   * Analyzes agent and assigns market archetype
   */
  async analyzeAgentArchetype(agent) {
    // Create description from agent data
    const description = this.createAgentDescription(agent);
    
    // Generate embedding
    const embedding = this.sentenceModel.encode([description])[0];
    
    // Cluster assignment
    const clusterIndex = this.clusterModel.predict([embedding])[0];
    const archetypeKeys = Object.keys(this.archetypes);
    const archetype = archetypeKeys[clusterIndex % archetypeKeys.length];
    
    // Calculate confidence score
    const confidence = this.calculateArchetypeConfidence(description, archetype);
    
    return {
      archetype,
      confidence,
      embedding,
      market_segment: this.archetypes[archetype],
      description
    };
  }

  createAgentDescription(agent) {
    const parts = [
      agent.career?.role_display_name || 'AI Agent',
      (agent.career?.traits || []).join(' '),
      agent.behavior_summary || '',
      agent.specialization || '',
      agent.enterprise_config?.department_access?.join(' ') || ''
    ];
    
    return parts.filter(p => p).join(' ').toLowerCase();
  }

  calculateArchetypeConfidence(description, archetype) {
    const archetypeConfig = this.archetypes[archetype];
    const words = description.split(/\\W+/);
    const matches = words.filter(word => archetypeConfig.keywords.includes(word));
    return Math.min(matches.length / archetypeConfig.keywords.length, 1.0);
  }

  /**
   * Predicts market value using ML model
   */
  async predictMarketValue(agent, marketContext = {}) {
    const archetype = await this.analyzeAgentArchetype(agent);
    
    // Prepare features for ML model
    const features = this.extractPricingFeatures(agent, archetype, marketContext);
    
    // Get base prediction from neural network
    const featureTensor = tf.tensor2d([features]);
    const prediction = this.pricingModel.predict(featureTensor);
    const basePrediction = await prediction.data();
    featureTensor.dispose();
    prediction.dispose();
    
    // Apply market modifiers
    const modifiedPrice = this.applyMarketModifiers(
      basePrediction[0],
      archetype,
      marketContext
    );
    
    return {
      predicted_value: Math.round(modifiedPrice),
      base_prediction: Math.round(basePrediction[0]),
      archetype: archetype.archetype,
      confidence: archetype.confidence,
      market_factors: this.getMarketFactors(archetype, marketContext)
    };
  }

  extractPricingFeatures(agent, archetype, marketContext) {
    return [
      // Agent intrinsic features
      agent.stats?.trust_score / 100 || 0.5,
      agent.stats?.interaction_count / 1000 || 0,
      agent.career?.evolution_level || 0,
      agent.market_data?.lineage_depth || 0,
      archetype.confidence,
      
      // Market features
      this.getCurrentDemand(archetype.archetype),
      this.getSupplyLevel(archetype.archetype),
      this.getSeasonalMultiplier(archetype.archetype),
      this.getRarityScore(agent),
      this.getCreatorReputation(agent.creator_fingerprint),
      
      // Network features
      this.getLineageValue(agent),
      this.getPerformanceScore(agent),
      this.getTrendingScore(agent),
      this.getEnterpriseAppeal(agent),
      this.getSpecializationBonus(agent),
      
      // Economic features
      marketContext.overall_volume || 1.0,
      marketContext.volatility || 0.1,
      marketContext.economic_sentiment || 0.5,
      this.getCompetitionLevel(archetype.archetype),
      this.getInnovationIndex(archetype.archetype)
    ];
  }

  applyMarketModifiers(basePrice, archetype, marketContext) {
    let modifiedPrice = basePrice;
    
    // Archetype base multiplier
    modifiedPrice *= archetype.market_segment.base_multiplier;
    
    // Seasonal adjustments
    const seasonalMultiplier = this.getSeasonalMultiplier(archetype.archetype);
    modifiedPrice *= seasonalMultiplier;
    
    // Supply/demand dynamics
    const demandMultiplier = this.getDemandMultiplier(archetype.archetype);
    modifiedPrice *= demandMultiplier;
    
    // Market events
    const eventMultiplier = this.getActiveEventMultiplier(archetype.archetype);
    modifiedPrice *= eventMultiplier;
    
    // Enterprise premium
    if (this.isEnterpriseArchetype(archetype.archetype)) {
      modifiedPrice *= 1.5;
    }
    
    return Math.max(modifiedPrice, 50); // Minimum price floor
  }

  getCurrentDemand(archetype) {
    // Simulate demand based on archetype and time
    const baseThresholds = {
      'compliance_guardian': 0.8,
      'innovation_driver': 0.9,
      'analytical_brain': 0.7,
      'productivity_enhancer': 0.6,
      'creative_catalyst': 0.5,
      'social_connector': 0.4
    };
    
    return baseThresholds[archetype] || 0.5;
  }

  getSupplyLevel(archetype) {
    // Simulate supply scarcity
    const supplyLevels = {
      'compliance_guardian': 0.2, // Very scarce
      'innovation_driver': 0.3,   // Scarce
      'analytical_brain': 0.4,
      'productivity_enhancer': 0.7,
      'creative_catalyst': 0.8,
      'social_connector': 0.9     // Abundant
    };
    
    return supplyLevels[archetype] || 0.5;
  }

  getSeasonalMultiplier(archetype) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const quarter = Math.ceil(month / 3);
    
    // Apply seasonal patterns
    if (archetype === 'compliance_guardian' && quarter === 4) {
      return 2.0; // Year-end compliance rush
    }
    
    if (archetype === 'productivity_enhancer' && month === 1) {
      return 1.4; // New year productivity boost
    }
    
    if (archetype === 'creative_catalyst' && (month >= 8 && month <= 9)) {
      return 1.3; // Back-to-school creative projects
    }
    
    return 1.0;
  }

  getDemandMultiplier(archetype) {
    const demand = this.getCurrentDemand(archetype);
    const supply = this.getSupplyLevel(archetype);
    
    // Simple supply/demand economics
    return Math.max(0.5, (demand / supply) * 0.8 + 0.2);
  }

  getActiveEventMultiplier(archetype) {
    // Check for active market events
    let multiplier = 1.0;
    
    Object.entries(this.marketEvents).forEach(([eventType, config]) => {
      if (this.isEventActive(eventType)) {
        if (config.affected.includes(archetype) || config.affected.includes('all')) {
          multiplier *= config.impact;
        }
      }
    });
    
    return multiplier;
  }

  isEventActive(eventType) {
    // Simulate active events (in production, check real event database)
    const activeEvents = ['enterprise_adoption', 'ai_breakthrough'];
    return activeEvents.includes(eventType);
  }

  isEnterpriseArchetype(archetype) {
    const enterpriseArchetypes = ['compliance_guardian', 'analytical_brain', 'innovation_driver'];
    return enterpriseArchetypes.includes(archetype);
  }

  getRarityScore(agent) {
    const evolutionLevel = agent.career?.evolution_level || 0;
    const lineageDepth = agent.market_data?.lineage_depth || 0;
    const trustScore = agent.stats?.trust_score || 50;
    
    // Rarity calculation
    return Math.min(
      (evolutionLevel * 0.4 + lineageDepth * 0.3 + trustScore / 100 * 0.3),
      1.0
    );
  }

  getCreatorReputation(creatorFingerprint) {
    // Mock creator reputation (would query real data)
    const reputations = {
      'fp_founder000': 0.95,
      'fp_dev_alice': 0.87,
      'fp_enterprise_bob': 0.91
    };
    
    return reputations[creatorFingerprint] || 0.5;
  }

  getLineageValue(agent) {
    // Calculate based on ancestor success
    return Math.min((agent.market_data?.lineage_depth || 0) * 0.1, 0.8);
  }

  getPerformanceScore(agent) {
    const trustScore = agent.stats?.trust_score || 50;
    const interactionCount = agent.stats?.interaction_count || 0;
    
    return Math.min(
      (trustScore / 100 * 0.7 + Math.min(interactionCount / 1000, 1) * 0.3),
      1.0
    );
  }

  getTrendingScore(agent) {
    // Mock trending calculation (would use real interaction velocity)
    return Math.random() * 0.5; // Random for demo
  }

  getEnterpriseAppeal(agent) {
    const enterpriseFeatures = [
      'compliance', 'security', 'audit', 'governance', 
      'regulation', 'enterprise', 'business'
    ];
    
    const description = this.createAgentDescription(agent);
    const matches = enterpriseFeatures.filter(feature => 
      description.includes(feature)
    ).length;
    
    return Math.min(matches / enterpriseFeatures.length, 1.0);
  }

  getSpecializationBonus(agent) {
    // Specialized agents command premium
    const traits = agent.career?.traits || [];
    const specialization = traits.length > 5 ? 0.2 : 0.1;
    return specialization;
  }

  getCompetitionLevel(archetype) {
    // Market competition simulation
    const competitionLevels = {
      'compliance_guardian': 0.2, // Low competition
      'innovation_driver': 0.3,
      'analytical_brain': 0.5,
      'productivity_enhancer': 0.8,
      'creative_catalyst': 0.9,
      'social_connector': 0.95   // High competition
    };
    
    return competitionLevels[archetype] || 0.5;
  }

  getInnovationIndex(archetype) {
    // How innovative/cutting-edge the archetype is
    const innovationScores = {
      'innovation_driver': 1.0,
      'analytical_brain': 0.8,
      'compliance_guardian': 0.3,
      'productivity_enhancer': 0.5,
      'creative_catalyst': 0.7,
      'social_connector': 0.4
    };
    
    return innovationScores[archetype] || 0.5;
  }

  getMarketFactors(archetype, marketContext) {
    return {
      demand_level: this.getCurrentDemand(archetype.archetype),
      supply_level: this.getSupplyLevel(archetype.archetype),
      seasonal_multiplier: this.getSeasonalMultiplier(archetype.archetype),
      competition_level: this.getCompetitionLevel(archetype.archetype),
      active_events: this.getActiveMarketEvents(archetype.archetype)
    };
  }

  getActiveMarketEvents(archetype) {
    return Object.entries(this.marketEvents)
      .filter(([eventType, config]) => 
        this.isEventActive(eventType) && 
        (config.affected.includes(archetype) || config.affected.includes('all'))
      )
      .map(([eventType, config]) => ({
        event: eventType,
        impact: config.impact,
        duration: config.duration
      }));
  }

  /**
   * Generates market insights and predictions
   */
  async generateMarketInsights() {
    const insights = {
      trending_archetypes: await this.getTrendingArchetypes(),
      price_predictions: await this.getPricePredictions(),
      supply_demand_analysis: this.getSupplyDemandAnalysis(),
      investment_opportunities: await this.getInvestmentOpportunities(),
      market_sentiment: this.calculateMarketSentiment()
    };
    
    return insights;
  }

  async getTrendingArchetypes() {
    return Object.keys(this.archetypes).map(archetype => ({
      archetype,
      trend_score: this.getDemandMultiplier(archetype),
      price_momentum: this.getActiveEventMultiplier(archetype),
      volume_change: Math.random() * 0.5 - 0.25 // Mock volume data
    })).sort((a, b) => b.trend_score - a.trend_score);
  }

  async getPricePredictions() {
    const predictions = {};
    
    for (const archetype of Object.keys(this.archetypes)) {
      predictions[archetype] = {
        '1h': this.predictPriceChange(archetype, '1h'),
        '24h': this.predictPriceChange(archetype, '24h'),
        '7d': this.predictPriceChange(archetype, '7d'),
        '30d': this.predictPriceChange(archetype, '30d')
      };
    }
    
    return predictions;
  }

  predictPriceChange(archetype, timeframe) {
    // Simplified prediction (would use more sophisticated ML)
    const baseVolatility = 0.1;
    const trendMultiplier = this.getDemandMultiplier(archetype);
    const timeMultiplier = { '1h': 0.02, '24h': 0.05, '7d': 0.15, '30d': 0.3 }[timeframe];
    
    const change = (Math.random() - 0.5) * baseVolatility * timeMultiplier * trendMultiplier;
    return Math.round(change * 100) / 100; // Round to 2 decimal places
  }

  getSupplyDemandAnalysis() {
    const analysis = {};
    
    Object.keys(this.archetypes).forEach(archetype => {
      const demand = this.getCurrentDemand(archetype);
      const supply = this.getSupplyLevel(archetype);
      
      analysis[archetype] = {
        demand_level: demand,
        supply_level: supply,
        pressure: demand / supply,
        market_status: this.getMarketStatus(demand, supply)
      };
    });
    
    return analysis;
  }

  getMarketStatus(demand, supply) {
    const ratio = demand / supply;
    
    if (ratio > 2) return 'high_demand_low_supply';
    if (ratio > 1.5) return 'bullish';
    if (ratio > 0.8) return 'balanced';
    if (ratio > 0.5) return 'bearish';
    return 'oversupplied';
  }

  async getInvestmentOpportunities() {
    // Identify undervalued archetypes with strong fundamentals
    const opportunities = [];
    
    Object.keys(this.archetypes).forEach(archetype => {
      const demand = this.getCurrentDemand(archetype);
      const supply = this.getSupplyLevel(archetype);
      const seasonal = this.getSeasonalMultiplier(archetype);
      
      const opportunityScore = (demand / supply) * seasonal * Math.random();
      
      if (opportunityScore > 1.2) {
        opportunities.push({
          archetype,
          opportunity_score: opportunityScore,
          reason: this.getOpportunityReason(archetype, demand, supply, seasonal)
        });
      }
    });
    
    return opportunities.sort((a, b) => b.opportunity_score - a.opportunity_score);
  }

  getOpportunityReason(archetype, demand, supply, seasonal) {
    const reasons = [];
    
    if (demand / supply > 1.5) reasons.push('High demand vs supply');
    if (seasonal > 1.2) reasons.push('Seasonal boost active');
    if (this.getActiveEventMultiplier(archetype) > 1.2) reasons.push('Market event impact');
    
    return reasons.join(', ') || 'Fundamental value opportunity';
  }

  calculateMarketSentiment() {
    // Overall market mood calculation
    const archetypeData = Object.keys(this.archetypes).map(archetype => ({
      demand: this.getCurrentDemand(archetype),
      supply: this.getSupplyLevel(archetype),
      events: this.getActiveEventMultiplier(archetype)
    }));
    
    const avgDemand = archetypeData.reduce((sum, data) => sum + data.demand, 0) / archetypeData.length;
    const avgSupply = archetypeData.reduce((sum, data) => sum + data.supply, 0) / archetypeData.length;
    const avgEvents = archetypeData.reduce((sum, data) => sum + data.events, 0) / archetypeData.length;
    
    const sentiment = (avgDemand / avgSupply) * avgEvents;
    
    if (sentiment > 1.5) return 'very_bullish';
    if (sentiment > 1.2) return 'bullish';
    if (sentiment > 0.8) return 'neutral';
    if (sentiment > 0.6) return 'bearish';
    return 'very_bearish';
  }
}

export default SemanticMarketEngine;