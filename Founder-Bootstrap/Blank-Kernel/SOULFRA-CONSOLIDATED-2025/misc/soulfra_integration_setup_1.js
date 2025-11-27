// ==========================================
// SOULFRA INTEGRATION SETUP
// Connect Soulfra routing to your existing infrastructure
// ==========================================

const { SoulframContextRouter } = require('./soulfra-context-router');

// Step 1: Integrate with your existing Vector Database
class VectorDBIntegration {
  constructor(existingVectorDB) {
    this.vectorDB = existingVectorDB; // Your existing vector DB
    this.embeddings = existingVectorDB.embeddings;
  }

  async findRelevantContext(prompt, userId) {
    // Use your existing embedding search
    const queryEmbedding = await this.embeddings.embed(prompt);
    const similarDocs = await this.vectorDB.findSimilar(queryEmbedding, {
      limit: 5,
      threshold: 0.7,
      filters: { userId } // Privacy: only user's own docs
    });

    return {
      documents: similarDocs,
      contextRelevance: this.calculateRelevance(prompt, similarDocs),
      tokenEstimate: this.estimateTokens(similarDocs)
    };
  }

  calculateRelevance(prompt, docs) {
    // Soulfra adds relevance scoring for routing decisions
    return docs.reduce((avg, doc) => avg + doc.similarity, 0) / docs.length;
  }

  estimateTokens(docs) {
    return docs.reduce((total, doc) => total + (doc.content.length / 4), 0);
  }
}

// Step 2: Integrate with your existing Chat Log System
class ChatLogIntegration {
  constructor(existingChatLogProcessor) {
    this.processor = existingChatLogProcessor;
  }

  async getConversationContext(userId, limit = 10) {
    // Use your existing chat log processing
    const recentMessages = await this.processor.getRecentMessages(userId, limit);
    const conversationSummary = await this.processor.summarizeConversation(recentMessages);
    
    return {
      messages: recentMessages,
      summary: conversationSummary,
      contextContinuity: this.assessContinuity(recentMessages),
      tokenEstimate: this.estimateContextTokens(recentMessages)
    };
  }

  assessContinuity(messages) {
    // Soulfra analyzes conversation flow for routing
    const topics = messages.map(m => this.extractTopics(m.content));
    const topicOverlap = this.calculateTopicOverlap(topics);
    return topicOverlap > 0.6 ? 'high' : topicOverlap > 0.3 ? 'medium' : 'low';
  }

  extractTopics(content) {
    // Simple topic extraction - enhance with your existing NLP
    return content.toLowerCase().split(' ').filter(word => word.length > 3);
  }

  calculateTopicOverlap(topicSets) {
    if (topicSets.length < 2) return 0;
    
    const allTopics = new Set(topicSets.flat());
    const commonTopics = new Set();
    
    allTopics.forEach(topic => {
      const count = topicSets.filter(set => set.includes(topic)).length;
      if (count > 1) commonTopics.add(topic);
    });
    
    return commonTopics.size / allTopics.size;
  }
}

// Step 3: Integrate with your Neo4j Graph Database
class Neo4jIntegration {
  constructor(existingNeo4jDriver) {
    this.driver = existingNeo4jDriver;
  }

  async getRelationshipContext(prompt, userId) {
    const session = this.driver.session();
    
    try {
      // Extract entities from prompt
      const entities = this.extractEntities(prompt);
      
      // Query your existing Neo4j graph
      const query = `
        MATCH (u:User {id: $userId})-[:OWNS|CREATED]->(entity)
        WHERE entity.name IN $entities OR entity.content CONTAINS ANY($entities)
        MATCH (entity)-[r*1..2]-(related)
        RETURN entity, r, related
        LIMIT 20
      `;
      
      const result = await session.run(query, { userId, entities });
      
      return {
        entities: this.formatEntities(result.records),
        relationships: this.formatRelationships(result.records),
        graphComplexity: this.calculateGraphComplexity(result.records),
        tokenEstimate: this.estimateGraphTokens(result.records)
      };
      
    } finally {
      await session.close();
    }
  }

  extractEntities(prompt) {
    // Simple entity extraction - use your existing NER
    const words = prompt.split(' ');
    return words.filter(word => 
      word.length > 3 && 
      (word[0] === word[0].toUpperCase() || word.includes('_'))
    );
  }

  calculateGraphComplexity(records) {
    const uniqueNodes = new Set();
    const relationships = [];
    
    records.forEach(record => {
      uniqueNodes.add(record.get('entity').identity.toString());
      if (record.get('related')) {
        uniqueNodes.add(record.get('related').identity.toString());
        relationships.push(record.get('r'));
      }
    });
    
    return {
      nodeCount: uniqueNodes.size,
      relationshipCount: relationships.length,
      complexity: uniqueNodes.size + (relationships.length * 0.5)
    };
  }
}

// Step 4: Integrate with your MCP (Model Context Protocol)
class MCPIntegration {
  constructor(existingMCPClient) {
    this.mcpClient = existingMCPClient;
  }

  async getModelContext(prompt, userId) {
    // Use your existing MCP implementation
    const mcpContext = await this.mcpClient.getContext({
      prompt,
      userId,
      includeHistory: true,
      includeTools: true
    });

    return {
      tools: mcpContext.availableTools,
      history: mcpContext.conversationHistory,
      capabilities: mcpContext.modelCapabilities,
      contextLength: mcpContext.maxContextLength,
      tokenEstimate: this.estimateMCPTokens(mcpContext)
    };
  }

  estimateMCPTokens(mcpContext) {
    let tokens = 0;
    
    if (mcpContext.conversationHistory) {
      tokens += mcpContext.conversationHistory.length * 100; // Rough estimate
    }
    
    if (mcpContext.availableTools) {
      tokens += mcpContext.availableTools.length * 50; // Tool descriptions
    }
    
    return tokens;
  }
}

// Step 5: Main Integration Class
class SoulframInfrastructureIntegration {
  constructor(existingSystems) {
    // Wrap your existing systems
    this.vectorDB = new VectorDBIntegration(existingSystems.vectorDB);
    this.chatLogs = new ChatLogIntegration(existingSystems.chatLogProcessor);
    this.neo4j = new Neo4jIntegration(existingSystems.neo4jDriver);
    this.mcp = new MCPIntegration(existingSystems.mcpClient);
    
    // Initialize Soulfra router
    this.router = new SoulframContextRouter(this);
  }

  async processRequest(userId, prompt, options = {}) {
    console.log('🚀 Processing request through integrated Soulfra system...');
    
    // Gather context from ALL your existing systems
    const [vectorContext, chatContext, graphContext, mcpContext] = await Promise.all([
      this.vectorDB.findRelevantContext(prompt, userId),
      this.chatLogs.getConversationContext(userId),
      this.neo4j.getRelationshipContext(prompt, userId),
      this.mcp.getModelContext(prompt, userId)
    ]);

    const combinedContext = {
      vector: vectorContext,
      chat: chatContext,
      graph: graphContext,
      mcp: mcpContext,
      
      // Soulfra analysis
      totalTokens: this.calculateTotalTokens(vectorContext, chatContext, graphContext, mcpContext),
      complexityScore: this.calculateComplexity(vectorContext, chatContext, graphContext, mcpContext),
      qualityRequirement: this.determineQualityNeeds(prompt, vectorContext, graphContext)
    };

    // Route through Soulfra intelligence
    return await this.router.processUserRequest(userId, prompt, {
      ...options,
      context: combinedContext
    });
  }

  calculateTotalTokens(...contexts) {
    return contexts.reduce((total, context) => total + (context.tokenEstimate || 0), 0);
  }

  calculateComplexity(...contexts) {
    let complexity = 0;
    
    // Vector complexity
    if (contexts[0].contextRelevance > 0.8) complexity += 2;
    
    // Chat complexity  
    if (contexts[1].contextContinuity === 'high') complexity += 2;
    
    // Graph complexity
    if (contexts[2].graphComplexity?.complexity > 10) complexity += 3;
    
    // MCP complexity
    if (contexts[3].tools?.length > 3) complexity += 1;
    
    return complexity;
  }

  determineQualityNeeds(prompt, vectorContext, graphContext) {
    // Complex analysis with graph relationships = high quality needed
    if (graphContext.graphComplexity?.nodeCount > 5) return 'high';
    
    // High relevance documents = medium quality
    if (vectorContext.contextRelevance > 0.7) return 'medium';
    
    // Simple prompt = low quality sufficient
    if (prompt.length < 50 && !prompt.includes('analyze')) return 'low';
    
    return 'medium';
  }
}

// ==========================================
// SETUP YOUR INTEGRATION
// ==========================================

// Your existing systems (unchanged)
const existingSystems = {
  vectorDB: yourExistingVectorDB,
  chatLogProcessor: yourExistingChatLogProcessor,
  neo4jDriver: yourExistingNeo4jDriver,
  mcpClient: yourExistingMCPClient
};

// Create integrated Soulfra system
const soulframSystem = new SoulframInfrastructureIntegration(existingSystems);

// Usage: Same interface, but now with intelligent routing
app.post('/api/chat', async (req, res) => {
  try {
    const { userId, prompt } = req.body;
    
    // This now uses ALL your existing infrastructure + Soulfra routing
    const response = await soulframSystem.processRequest(userId, prompt);
    
    res.json({
      response: response.content,
      metadata: {
        provider: response.metadata.routingDecision.provider,
        model: response.metadata.routingDecision.model,
        reasoning: response.metadata.routingDecision.reasoning,
        cost: response.metadata.costActual,
        contextUsed: response.metadata.contextUsed,
        trustScore: response.metadata.userTrustScore
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = { SoulframInfrastructureIntegration };