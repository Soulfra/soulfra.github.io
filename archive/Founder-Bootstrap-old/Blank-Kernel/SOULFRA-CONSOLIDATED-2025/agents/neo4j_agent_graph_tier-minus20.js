/**
 * Neo4j Agent Relationship & Lineage Tracking Engine
 * Powers the AI Agent Grand Exchange with deep relationship insights
 */

import neo4j from 'neo4j-driver';
import { performance } from 'perf_hooks';

class AgentRelationshipEngine {
  constructor(uri = 'bolt://localhost:7687', user = 'neo4j', password = 'soulfra') {
    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    this.session = null;
  }

  async initialize() {
    this.session = this.driver.session();
    
    // Create indexes for performance
    await this.createIndexes();
    
    // Create constraints for data integrity
    await this.createConstraints();
    
    console.log('🕸️ Neo4j Agent Relationship Engine initialized');
  }

  async createIndexes() {
    const indexes = [
      'CREATE INDEX agent_id_index IF NOT EXISTS FOR (a:Agent) ON (a.id)',
      'CREATE INDEX user_fingerprint_index IF NOT EXISTS FOR (u:User) ON (u.fingerprint)',
      'CREATE INDEX market_price_timestamp IF NOT EXISTS FOR (p:PriceHistory) ON (p.timestamp)',
      'CREATE INDEX trade_timestamp IF NOT EXISTS FOR (t:Trade) ON (t.timestamp)',
      'CREATE INDEX agent_role_index IF NOT EXISTS FOR (a:Agent) ON (a.role)',
      'CREATE INDEX lineage_depth_index IF NOT EXISTS FOR ()-[r:EVOLVED_FROM]-() ON (r.depth)'
    ];

    for (const index of indexes) {
      try {
        await this.session.run(index);
      } catch (error) {
        console.log(`Index already exists or error: ${error.message}`);
      }
    }
  }

  async createConstraints() {
    const constraints = [
      'CREATE CONSTRAINT agent_id_unique IF NOT EXISTS FOR (a:Agent) REQUIRE a.id IS UNIQUE',
      'CREATE CONSTRAINT user_fingerprint_unique IF NOT EXISTS FOR (u:User) REQUIRE u.fingerprint IS UNIQUE',
      'CREATE CONSTRAINT trade_id_unique IF NOT EXISTS FOR (t:Trade) REQUIRE t.id IS UNIQUE'
    ];

    for (const constraint of constraints) {
      try {
        await this.session.run(constraint);
      } catch (error) {
        console.log(`Constraint already exists or error: ${error.message}`);
      }
    }
  }

  /**
   * Creates or updates an agent node with market and evolution data
   */
  async createOrUpdateAgent(agentData) {
    const query = `
      MERGE (a:Agent {id: $agentId})
      SET a += {
        role: $role,
        display_name: $displayName,
        emoji: $emoji,
        trust_score: $trustScore,
        interaction_count: $interactionCount,
        evolution_level: $evolutionLevel,
        market_value: $marketValue,
        rarity_score: $rarityScore,
        traits: $traits,
        created_at: $createdAt,
        updated_at: $updatedAt,
        semantic_cluster: $semanticCluster
      }
      
      // Connect to creator
      MERGE (u:User {fingerprint: $creatorFingerprint})
      SET u.username = $creatorUsername
      MERGE (a)-[:CREATED_BY]->(u)
      
      RETURN a
    `;

    const result = await this.session.run(query, {
      agentId: agentData.id,
      role: agentData.career?.current_role || 'spark',
      displayName: agentData.career?.role_display_name || 'Spark',
      emoji: agentData.career?.role_emoji || '⚡',
      trustScore: agentData.stats?.trust_score || 50,
      interactionCount: agentData.stats?.interaction_count || 0,
      evolutionLevel: agentData.career?.evolution_level || 0,
      marketValue: agentData.market_data?.current_value || 100,
      rarityScore: agentData.market_data?.rarity_score || 1.0,
      traits: agentData.career?.traits || [],
      createdAt: agentData.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      semanticCluster: agentData.semantic_cluster || 'unclassified',
      creatorFingerprint: agentData.creator_fingerprint,
      creatorUsername: agentData.creator_username || 'Anonymous'
    });

    return result.records[0]?.get('a').properties;
  }

  /**
   * Records agent evolution in the lineage graph
   */
  async recordEvolution(parentAgentId, childAgentId, evolutionData) {
    const query = `
      MATCH (parent:Agent {id: $parentAgentId})
      MATCH (child:Agent {id: $childAgentId})
      
      MERGE (parent)-[e:EVOLVED_TO {
        evolution_timestamp: $timestamp,
        trigger_type: $triggerType,
        requirements_met: $requirementsMet,
        evidence: $evidence,
        depth: $depth
      }]->(child)
      
      // Calculate lineage depth
      OPTIONAL MATCH path = (root:Agent)-[:EVOLVED_TO*]->(child)
      WHERE NOT (root)<-[:EVOLVED_TO]-(:Agent)
      WITH child, max(length(path)) as maxDepth
      SET child.lineage_depth = coalesce(maxDepth, 0)
      
      RETURN e, child.lineage_depth as newDepth
    `;

    const result = await this.session.run(query, {
      parentAgentId,
      childAgentId,
      timestamp: new Date().toISOString(),
      triggerType: evolutionData.trigger_type || 'user_interaction',
      requirementsMet: evolutionData.requirements_met || {},
      evidence: evolutionData.evidence || {},
      depth: evolutionData.depth || 1
    });

    return result.records[0]?.get('newDepth');
  }

  /**
   * Records agent trading/ownership transfer
   */
  async recordTrade(tradeData) {
    const query = `
      MATCH (agent:Agent {id: $agentId})
      MATCH (seller:User {fingerprint: $sellerFingerprint})
      MATCH (buyer:User {fingerprint: $buyerFingerprint})
      
      CREATE (trade:Trade {
        id: $tradeId,
        timestamp: $timestamp,
        price: $price,
        currency: $currency,
        trade_type: $tradeType,
        market_conditions: $marketConditions
      })
      
      CREATE (seller)-[:SOLD {price: $price, timestamp: $timestamp}]->(trade)
      CREATE (buyer)-[:BOUGHT {price: $price, timestamp: $timestamp}]->(trade)
      CREATE (trade)-[:INVOLVES]->(agent)
      
      // Update agent ownership
      OPTIONAL MATCH (agent)-[oldOwnership:OWNED_BY]->(oldOwner)
      DELETE oldOwnership
      CREATE (agent)-[:OWNED_BY {since: $timestamp, acquired_price: $price}]->(buyer)
      
      // Update market price history
      CREATE (pricePoint:PriceHistory {
        timestamp: $timestamp,
        price: $price,
        volume: 1,
        trade_type: $tradeType
      })
      CREATE (agent)-[:MARKET_PRICE]->(pricePoint)
      
      RETURN trade
    `;

    const result = await this.session.run(query, {
      agentId: tradeData.agent_id,
      sellerFingerprint: tradeData.seller_fingerprint,
      buyerFingerprint: tradeData.buyer_fingerprint,
      tradeId: this.generateTradeId(),
      timestamp: new Date().toISOString(),
      price: tradeData.price,
      currency: tradeData.currency || 'credits',
      tradeType: tradeData.trade_type || 'direct_sale',
      marketConditions: tradeData.market_conditions || {}
    });

    return result.records[0]?.get('trade').properties;
  }

  /**
   * Calculates lineage value and prestige
   */
  async calculateLineageValue(agentId) {
    const query = `
      MATCH (agent:Agent {id: $agentId})
      
      // Find the root ancestor
      OPTIONAL MATCH path = (root:Agent)-[:EVOLVED_TO*]->(agent)
      WHERE NOT (root)<-[:EVOLVED_TO]-(:Agent)
      WITH agent, root, length(path) as lineageDepth
      
      // Calculate descendant success
      OPTIONAL MATCH (agent)-[:EVOLVED_TO*]->(descendant:Agent)
      WITH agent, root, lineageDepth, 
           avg(descendant.trust_score) as avgDescendantTrust,
           count(descendant) as descendantCount,
           max(descendant.market_value) as maxDescendantValue
      
      // Calculate sibling success (other agents from same root)
      OPTIONAL MATCH (root)-[:EVOLVED_TO*]->(sibling:Agent)
      WHERE sibling.id <> agent.id
      WITH agent, root, lineageDepth, avgDescendantTrust, descendantCount, maxDescendantValue,
           avg(sibling.trust_score) as avgSiblingTrust,
           count(sibling) as siblingCount
      
      // Creator reputation impact
      OPTIONAL MATCH (agent)-[:CREATED_BY]->(creator:User)-[:CREATED_BY]-(otherAgent:Agent)
      WITH agent, root, lineageDepth, avgDescendantTrust, descendantCount, maxDescendantValue,
           avgSiblingTrust, siblingCount,
           avg(otherAgent.trust_score) as creatorAvgTrust,
           count(otherAgent) as creatorAgentCount
      
      RETURN {
        agent_id: agent.id,
        lineage_depth: coalesce(lineageDepth, 0),
        root_agent_id: coalesce(root.id, agent.id),
        descendant_count: coalesce(descendantCount, 0),
        avg_descendant_trust: coalesce(avgDescendantTrust, 0),
        max_descendant_value: coalesce(maxDescendantValue, 0),
        sibling_count: coalesce(siblingCount, 0),
        avg_sibling_trust: coalesce(avgSiblingTrust, 0),
        creator_reputation: coalesce(creatorAvgTrust, 0),
        creator_portfolio_size: coalesce(creatorAgentCount, 0)
      } as lineageAnalysis
    `;

    const result = await this.session.run(query, { agentId });
    const analysis = result.records[0]?.get('lineageAnalysis');

    if (!analysis) return { value_multiplier: 1.0, prestige_score: 0 };

    // Calculate lineage value multiplier
    const depth_bonus = Math.pow(1.1, analysis.lineage_depth);
    const descendant_bonus = 1 + (analysis.descendant_count * 0.05);
    const success_bonus = 1 + (analysis.avg_descendant_trust / 100);
    const creator_bonus = 1 + (analysis.creator_reputation / 200);

    const value_multiplier = depth_bonus * descendant_bonus * success_bonus * creator_bonus;
    const prestige_score = analysis.lineage_depth * 10 + analysis.descendant_count * 5 + analysis.creator_reputation;

    return {
      value_multiplier: Math.min(value_multiplier, 10.0), // Cap at 10x
      prestige_score,
      analysis
    };
  }

  /**
   * Gets market analytics for agent trading
   */
  async getMarketAnalytics(role = null, timeframe = '7d') {
    const timeFilter = this.getTimeFilter(timeframe);
    
    const query = `
      MATCH (a:Agent)-[:MARKET_PRICE]->(p:PriceHistory)
      WHERE p.timestamp > $timeFilter
      ${role ? 'AND a.role = $role' : ''}
      
      WITH a, p
      ORDER BY p.timestamp DESC
      
      WITH a, collect(p)[0] as latestPrice, collect(p) as priceHistory
      
      RETURN {
        role: a.role,
        agent_count: count(a),
        avg_price: avg(latestPrice.price),
        min_price: min(latestPrice.price),
        max_price: max(latestPrice.price),
        total_volume: sum(size(priceHistory)),
        price_trend: CASE 
          WHEN size(priceHistory) > 1 THEN 
            (priceHistory[0].price - priceHistory[-1].price) / priceHistory[-1].price
          ELSE 0.0 
        END
      } as marketData
      ORDER BY marketData.avg_price DESC
    `;

    const result = await this.session.run(query, { 
      timeFilter,
      role: role || null
    });

    return result.records.map(record => record.get('marketData'));
  }

  /**
   * Finds similar agents for recommendation engine
   */
  async findSimilarAgents(agentId, limit = 10) {
    const query = `
      MATCH (target:Agent {id: $agentId})
      
      MATCH (similar:Agent)
      WHERE similar.id <> target.id
      AND similar.role = target.role
      
      // Calculate similarity score
      WITH target, similar,
        abs(target.trust_score - similar.trust_score) as trust_diff,
        abs(target.interaction_count - similar.interaction_count) as interaction_diff,
        abs(target.evolution_level - similar.evolution_level) as evolution_diff,
        size([trait IN target.traits WHERE trait IN similar.traits]) as common_traits
      
      WITH target, similar,
        (100 - trust_diff) * 0.3 +
        (100 - (interaction_diff / 10)) * 0.2 +
        (100 - (evolution_diff * 20)) * 0.2 +
        (common_traits * 10) * 0.3 as similarity_score
      
      WHERE similarity_score > 50
      
      RETURN similar {
        .*,
        similarity_score: similarity_score
      } as agent
      ORDER BY similarity_score DESC
      LIMIT $limit
    `;

    const result = await this.session.run(query, { agentId, limit });
    return result.records.map(record => record.get('agent'));
  }

  /**
   * Gets trending agents based on recent activity
   */
  async getTrendingAgents(limit = 20) {
    const query = `
      MATCH (a:Agent)-[:MARKET_PRICE]->(p:PriceHistory)
      WHERE p.timestamp > datetime() - duration('P7D')
      
      WITH a, collect(p) as prices
      WHERE size(prices) > 1
      
      WITH a, prices,
        (prices[0].price - prices[-1].price) / prices[-1].price as price_change,
        sum([price IN prices | price.volume]) as total_volume
      
      WHERE total_volume > 0
      
      WITH a, price_change, total_volume,
        (price_change * 0.6 + (total_volume / 100) * 0.4) as trending_score
      
      RETURN a {
        .*,
        price_change: price_change,
        volume: total_volume,
        trending_score: trending_score
      } as agent
      ORDER BY trending_score DESC
      LIMIT $limit
    `;

    const result = await this.session.run(query, { limit });
    return result.records.map(record => record.get('agent'));
  }

  /**
   * Identifies potential evolution opportunities
   */
  async identifyEvolutionOpportunities(userFingerprint) {
    const query = `
      MATCH (user:User {fingerprint: $userFingerprint})<-[:OWNED_BY]-(agent:Agent)
      
      // Find agents that have evolved from similar base roles
      MATCH (similar:Agent)-[:EVOLVED_TO]->(evolved:Agent)
      WHERE similar.role = agent.role
      AND similar.trust_score <= agent.trust_score
      AND similar.interaction_count <= agent.interaction_count
      
      WITH agent, evolved.role as potential_evolution, count(*) as evolution_frequency
      WHERE evolution_frequency > 2
      
      // Check market value potential
      MATCH (market_evolved:Agent)-[:MARKET_PRICE]->(p:PriceHistory)
      WHERE market_evolved.role = potential_evolution
      
      WITH agent, potential_evolution, evolution_frequency,
           avg(p.price) as avg_evolved_price
      
      // Calculate opportunity score
      WITH agent, potential_evolution, evolution_frequency, avg_evolved_price,
           (avg_evolved_price - agent.market_value) as value_increase,
           evolution_frequency * 10 as success_likelihood
      
      WHERE value_increase > 0
      
      RETURN {
        agent_id: agent.id,
        current_role: agent.role,
        evolution_opportunity: potential_evolution,
        current_value: agent.market_value,
        potential_value: avg_evolved_price,
        value_increase: value_increase,
        success_likelihood: success_likelihood,
        opportunity_score: (value_increase / agent.market_value) * success_likelihood
      } as opportunity
      ORDER BY opportunity.opportunity_score DESC
    `;

    const result = await this.session.run(query, { userFingerprint });
    return result.records.map(record => record.get('opportunity'));
  }

  // Helper methods
  getTimeFilter(timeframe) {
    const durations = {
      '1h': 'PT1H',
      '24h': 'P1D', 
      '7d': 'P7D',
      '30d': 'P30D',
      '1y': 'P1Y'
    };
    
    return `datetime() - duration('${durations[timeframe] || 'P7D'}')`;
  }

  generateTradeId() {
    return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async close() {
    if (this.session) {
      await this.session.close();
    }
    await this.driver.close();
  }
}

export default AgentRelationshipEngine;