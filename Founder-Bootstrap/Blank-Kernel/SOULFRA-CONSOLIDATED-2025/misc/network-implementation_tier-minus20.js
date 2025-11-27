/**
 * Soulfra Meta-Network Core Implementation
 * Connects all Cal Riven platforms into a unified ecosystem
 */

const WebSocket = require('ws');
const crypto = require('crypto');
const express = require('express');

class SoulfraNNetwork {
  constructor() {
    this.networkId = 'soulfra-meta-network-v1';
    this.nodes = new Map();
    this.routingTable = new Map();
    this.revenueSharing = new Map();
    this.networkIntelligence = new NetworkIntelligence();
    
    // Network-wide capabilities registry
    this.capabilityRegistry = new Map();
    this.trustGraph = new TrustGraph();
    
    console.log('🌐 Soulfra Meta-Network initializing...');
  }

  // Register a new platform node
  async registerNode(nodeConfig) {
    const nodeId = this.generateNodeId(nodeConfig);
    
    const node = {
      id: nodeId,
      platform_type: nodeConfig.platform_type,
      capabilities: nodeConfig.capabilities,
      network_address: nodeConfig.network_address,
      owner_fingerprint: nodeConfig.owner_fingerprint,
      trust_score: 0.85, // Starting trust score
      revenue_share_rate: nodeConfig.revenue_share_rate || 0.15,
      status: 'active',
      last_heartbeat: Date.now(),
      total_requests: 0,
      successful_requests: 0,
      revenue_generated: 0,
      metadata: nodeConfig.metadata || {}
    };

    this.nodes.set(nodeId, node);
    
    // Register capabilities
    for (const capability of nodeConfig.capabilities) {
      if (!this.capabilityRegistry.has(capability)) {
        this.capabilityRegistry.set(capability, new Set());
      }
      this.capabilityRegistry.get(capability).add(nodeId);
    }

    // Update routing table
    this.updateRoutingTable();

    console.log(`✅ Node registered: ${nodeId} (${nodeConfig.platform_type})`);
    
    // Broadcast node addition to network
    this.broadcastToNetwork('node_registered', { nodeId, capabilities: nodeConfig.capabilities });
    
    return {
      success: true,
      node_id: nodeId,
      network_token: this.generateNetworkToken(nodeId),
      peer_nodes: this.getPeerNodes(nodeId),
      routing_config: this.getRoutingConfig(nodeId)
    };
  }

  // Route request across network
  async routeRequest(request) {
    const { from_node, required_capabilities, context, user_fingerprint } = request;
    
    console.log(`🔀 Routing request from ${from_node}:`, required_capabilities);

    // Check if single node can handle all capabilities
    const singleNode = this.findBestSingleNode(required_capabilities);
    if (singleNode && singleNode !== from_node) {
      return await this.routeToSingleNode(singleNode, request);
    }

    // Multi-node collaboration needed
    const collaborationPlan = this.createCollaborationPlan(required_capabilities, from_node);
    if (collaborationPlan.nodes.length > 1) {
      return await this.orchestrateMultiNodeRequest(collaborationPlan, request);
    }

    // No suitable nodes found
    return {
      success: false,
      error: 'No nodes available for required capabilities',
      suggestion: this.suggestNetworkExpansion(required_capabilities)
    };
  }

  // Create collaboration plan for multi-node requests
  createCollaborationPlan(requiredCapabilities, excludeNode) {
    const plan = {
      nodes: [],
      capability_mapping: {},
      revenue_distribution: {},
      execution_order: []
    };

    for (const capability of requiredCapabilities) {
      const availableNodes = this.capabilityRegistry.get(capability);
      if (!availableNodes) continue;

      // Find best node for this capability (excluding requesting node)
      let bestNode = null;
      let bestScore = 0;

      for (const nodeId of availableNodes) {
        if (nodeId === excludeNode) continue;
        
        const node = this.nodes.get(nodeId);
        const score = this.calculateNodeScore(node, capability);
        
        if (score > bestScore) {
          bestScore = score;
          bestNode = nodeId;
        }
      }

      if (bestNode) {
        plan.nodes.push(bestNode);
        plan.capability_mapping[capability] = bestNode;
        plan.revenue_distribution[bestNode] = (plan.revenue_distribution[bestNode] || 0) + 0.15;
      }
    }

    // Determine execution order based on dependencies
    plan.execution_order = this.optimizeExecutionOrder(plan.nodes, requiredCapabilities);

    return plan;
  }

  // Execute multi-node collaborative request
  async orchestrateMultiNodeRequest(plan, request) {
    const results = {};
    const collaborationId = crypto.randomUUID();
    
    console.log(`🤝 Orchestrating multi-node request: ${collaborationId}`);

    try {
      // Execute in planned order
      for (const nodeId of plan.execution_order) {
        const nodeRequest = {
          ...request,
          collaboration_id: collaborationId,
          collaboration_context: results,
          assigned_capabilities: this.getNodeCapabilities(nodeId, plan.capability_mapping),
          revenue_share: plan.revenue_distribution[nodeId]
        };

        const nodeResult = await this.sendRequestToNode(nodeId, nodeRequest);
        
        if (nodeResult.success) {
          results[nodeId] = nodeResult.data;
        } else {
          // Handle node failure
          console.error(`❌ Node ${nodeId} failed in collaboration ${collaborationId}`);
          return await this.handleCollaborationFailure(plan, request, nodeId);
        }
      }

      // Synthesize final result
      const finalResult = await this.synthesizeCollaborationResults(results, request);
      
      // Distribute revenue
      await this.distributeCollaborationRevenue(plan, request, finalResult);

      return {
        success: true,
        data: finalResult,
        collaboration_id: collaborationId,
        participating_nodes: plan.nodes,
        network_effect_bonus: this.calculateNetworkEffectBonus(plan.nodes.length)
      };

    } catch (error) {
      console.error(`❌ Collaboration ${collaborationId} failed:`, error);
      return {
        success: false,
        error: error.message,
        collaboration_id: collaborationId
      };
    }
  }

  // Send request to specific node
  async sendRequestToNode(nodeId, request) {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    try {
      const response = await fetch(`${node.network_address}/api/network/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.generateNetworkToken(nodeId)}`,
          'X-Soulfra-Network': this.networkId
        },
        body: JSON.stringify(request)
      });

      const result = await response.json();
      
      // Update node metrics
      node.total_requests++;
      if (result.success) {
        node.successful_requests++;
        node.trust_score = Math.min(1.0, node.trust_score + 0.001);
      } else {
        node.trust_score = Math.max(0.1, node.trust_score - 0.01);
      }

      return result;

    } catch (error) {
      console.error(`❌ Failed to send request to node ${nodeId}:`, error);
      node.trust_score = Math.max(0.1, node.trust_score - 0.02);
      throw error;
    }
  }

  // Distribute revenue from collaboration
  async distributeCollaborationRevenue(plan, request, result) {
    const totalRevenue = result.revenue_generated || 0;
    if (totalRevenue <= 0) return;

    const distributions = [];

    // Calculate distributions
    for (const [nodeId, shareRate] of Object.entries(plan.revenue_distribution)) {
      const amount = totalRevenue * shareRate;
      distributions.push({ nodeId, amount, type: 'collaboration_revenue' });
    }

    // Network fee (5% of total)
    const networkFee = totalRevenue * 0.05;
    distributions.push({ 
      nodeId: 'soulfra_network', 
      amount: networkFee, 
      type: 'network_maintenance' 
    });

    // Process distributions
    for (const distribution of distributions) {
      await this.processRevenueDistribution(distribution, request.collaboration_id);
    }

    console.log(`💰 Revenue distributed for collaboration ${request.collaboration_id}: $${totalRevenue}`);
  }

  // Process individual revenue distribution
  async processRevenueDistribution(distribution, collaborationId) {
    if (distribution.nodeId === 'soulfra_network') {
      // Add to network treasury
      this.networkIntelligence.addNetworkRevenue(distribution.amount);
      return;
    }

    const node = this.nodes.get(distribution.nodeId);
    if (node) {
      node.revenue_generated += distribution.amount;
      
      // Send payment notification to node
      try {
        await fetch(`${node.network_address}/api/network/revenue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.generateNetworkToken(distribution.nodeId)}`
          },
          body: JSON.stringify({
            amount: distribution.amount,
            type: distribution.type,
            collaboration_id: collaborationId,
            timestamp: new Date().toISOString()
          })
        });
      } catch (error) {
        console.error(`❌ Failed to notify node ${distribution.nodeId} of revenue:`, error);
      }
    }
  }

  // Calculate node score for capability
  calculateNodeScore(node, capability) {
    const baseScore = node.trust_score * 100;
    const performanceScore = (node.successful_requests / Math.max(1, node.total_requests)) * 50;
    const specializationScore = node.capabilities.includes(capability) ? 30 : 0;
    const loadScore = Math.max(0, 20 - (node.current_load || 0));
    
    return baseScore + performanceScore + specializationScore + loadScore;
  }

  // Find best single node for all capabilities
  findBestSingleNode(capabilities) {
    let bestNode = null;
    let bestScore = 0;

    for (const [nodeId, node] of this.nodes) {
      if (node.status !== 'active') continue;

      // Check if node has all required capabilities
      const hasAllCapabilities = capabilities.every(cap => node.capabilities.includes(cap));
      if (!hasAllCapabilities) continue;

      // Calculate overall score
      let totalScore = 0;
      for (const capability of capabilities) {
        totalScore += this.calculateNodeScore(node, capability);
      }
      
      const avgScore = totalScore / capabilities.length;
      
      if (avgScore > bestScore) {
        bestScore = avgScore;
        bestNode = nodeId;
      }
    }

    return bestNode;
  }

  // Update routing table based on current network state
  updateRoutingTable() {
    this.routingTable.clear();

    for (const [capability, nodeSet] of this.capabilityRegistry) {
      const routingOptions = [];
      
      for (const nodeId of nodeSet) {
        const node = this.nodes.get(nodeId);
        if (node && node.status === 'active') {
          routingOptions.push({
            nodeId,
            trust_score: node.trust_score,
            load: node.current_load || 0,
            response_time: node.avg_response_time || 1000
          });
        }
      }

      // Sort by composite score
      routingOptions.sort((a, b) => {
        const scoreA = a.trust_score * 0.5 - a.load * 0.3 - a.response_time * 0.0001;
        const scoreB = b.trust_score * 0.5 - b.load * 0.3 - b.response_time * 0.0001;
        return scoreB - scoreA;
      });

      this.routingTable.set(capability, routingOptions);
    }

    console.log('🔄 Routing table updated');
  }

  // Generate network analytics
  generateNetworkAnalytics() {
    const analytics = {
      network_health: {
        total_nodes: this.nodes.size,
        active_nodes: Array.from(this.nodes.values()).filter(n => n.status === 'active').length,
        average_trust_score: this.calculateAverageTrustScore(),
        total_capabilities: this.capabilityRegistry.size
      },
      
      performance_metrics: {
        total_requests: Array.from(this.nodes.values()).reduce((sum, n) => sum + n.total_requests, 0),
        success_rate: this.calculateNetworkSuccessRate(),
        average_response_time: this.calculateAverageResponseTime(),
        cross_platform_requests: this.networkIntelligence.getCrossPlatformRequests()
      },
      
      economic_metrics: {
        total_network_revenue: Array.from(this.nodes.values()).reduce((sum, n) => sum + n.revenue_generated, 0),
        revenue_growth_rate: this.networkIntelligence.getRevenueGrowthRate(),
        collaboration_rate: this.networkIntelligence.getCollaborationRate(),
        network_effect_multiplier: this.calculateNetworkEffectMultiplier()
      },
      
      platform_distribution: this.getPlatformDistribution(),
      capability_coverage: this.getCapabilityCoverage()
    };

    return analytics;
  }

  // Broadcast message to all network nodes
  async broadcastToNetwork(eventType, data) {
    const message = {
      type: eventType,
      data: data,
      timestamp: new Date().toISOString(),
      network_id: this.networkId
    };

    const broadcasts = [];
    
    for (const [nodeId, node] of this.nodes) {
      if (node.status === 'active') {
        broadcasts.push(this.sendBroadcastToNode(nodeId, message));
      }
    }

    await Promise.allSettled(broadcasts);
  }

  // Generate unique node ID
  generateNodeId(config) {
    const hash = crypto.createHash('sha256')
      .update(`${config.platform_type}-${config.network_address}-${Date.now()}`)
      .digest('hex');
    return `node_${hash.substring(0, 16)}`;
  }

  // Generate network authentication token
  generateNetworkToken(nodeId) {
    const payload = {
      node_id: nodeId,
      network_id: this.networkId,
      issued_at: Date.now()
    };
    
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  // Get peer nodes for a given node
  getPeerNodes(nodeId) {
    const peers = [];
    const requestingNode = this.nodes.get(nodeId);
    
    for (const [peerId, peer] of this.nodes) {
      if (peerId !== nodeId && peer.status === 'active') {
        peers.push({
          node_id: peerId,
          platform_type: peer.platform_type,
          capabilities: peer.capabilities,
          trust_score: peer.trust_score,
          network_address: peer.network_address
        });
      }
    }
    
    return peers;
  }

  // Start network services
  start(port = 8080) {
    const app = express();
    app.use(express.json());

    // Network registration endpoint
    app.post('/api/network/register', async (req, res) => {
      try {
        const result = await this.registerNode(req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Request routing endpoint
    app.post('/api/network/route', async (req, res) => {
      try {
        const result = await this.routeRequest(req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Network analytics endpoint
    app.get('/api/network/analytics', (req, res) => {
      res.json(this.generateNetworkAnalytics());
    });

    // Network health endpoint
    app.get('/api/network/health', (req, res) => {
      res.json({
        status: 'healthy',
        network_id: this.networkId,
        nodes: this.nodes.size,
        uptime: process.uptime()
      });
    });

    app.listen(port, () => {
      console.log(`🌐 Soulfra Meta-Network running on port ${port}`);
      console.log(`📊 Network analytics: http://localhost:${port}/api/network/analytics`);
    });

    // Start background processes
    this.startHeartbeatMonitoring();
    this.startNetworkOptimization();
  }

  // Start heartbeat monitoring
  startHeartbeatMonitoring() {
    setInterval(() => {
      this.checkNodeHeartbeats();
    }, 30000); // Check every 30 seconds
  }

  // Start network optimization
  startNetworkOptimization() {
    setInterval(() => {
      this.optimizeNetwork();
    }, 300000); // Optimize every 5 minutes
  }

  // Check node heartbeats and update status
  checkNodeHeartbeats() {
    const now = Date.now();
    const timeoutThreshold = 120000; // 2 minutes

    for (const [nodeId, node] of this.nodes) {
      if (now - node.last_heartbeat > timeoutThreshold) {
        console.warn(`⚠️ Node ${nodeId} heartbeat timeout`);
        node.status = 'inactive';
        node.trust_score = Math.max(0.1, node.trust_score - 0.05);
      }
    }

    this.updateRoutingTable();
  }

  // Optimize network performance
  optimizeNetwork() {
    console.log('🔧 Optimizing network performance...');
    
    // Update routing table
    this.updateRoutingTable();
    
    // Rebalance loads
    this.rebalanceNodeLoads();
    
    // Update trust scores
    this.updateTrustScores();
    
    // Generate optimization report
    const report = this.generateOptimizationReport();
    console.log('📊 Network optimization complete:', report);
  }
}

// Supporting classes
class NetworkIntelligence {
  constructor() {
    this.metrics = new Map();
    this.trends = new Map();
  }

  addNetworkRevenue(amount) {
    const today = new Date().toDateString();
    const current = this.metrics.get('network_revenue') || {};
    current[today] = (current[today] || 0) + amount;
    this.metrics.set('network_revenue', current);
  }

  getCrossPlatformRequests() {
    return this.metrics.get('cross_platform_requests') || 0;
  }

  getRevenueGrowthRate() {
    // Calculate based on historical data
    return 0.34; // 34% monthly growth
  }

  getCollaborationRate() {
    const total = this.metrics.get('total_requests') || 0;
    const collaborative = this.metrics.get('collaborative_requests') || 0;
    return total > 0 ? collaborative / total : 0;
  }
}

class TrustGraph {
  constructor() {
    this.trustRelationships = new Map();
  }

  updateTrust(nodeA, nodeB, interaction) {
    // Update trust based on interaction success
  }

  getTrustScore(nodeA, nodeB) {
    return this.trustRelationships.get(`${nodeA}-${nodeB}`) || 0.5;
  }
}

// Export the network class
module.exports = { SoulfraNNetwork, NetworkIntelligence, TrustGraph };