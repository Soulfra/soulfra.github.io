const { Configuration, OpenAIApi } = require('openai');
const { Pool } = require('pg');
const Redis = require('ioredis');
const EventEmitter = require('events');
const { MongoClient } = require('mongodb');
const config = require('../config/environment');
const APIKeyVault = require('./api-key-vault');

class AIOrchestrationService extends EventEmitter {
  constructor() {
    super();
    this.pool = new Pool(config.database);
    this.redis = new Redis(config.redis);
    this.keyVault = new APIKeyVault();
    this.openai = null;
    this.mongoClient = null;
    this.aiAgents = new Map();
    
    this.initialize();
  }

  async initialize() {
    try {
      // Get OpenAI API key from vault
      const openAIKey = await this.keyVault.retrieveAPIKey('openai', 'api_key');
      
      const configuration = new Configuration({
        apiKey: openAIKey.key,
        organization: config.openai.organization
      });
      
      this.openai = new OpenAIApi(configuration);
      
      // Connect to MongoDB for training data
      this.mongoClient = new MongoClient(config.mongodb.uri, config.mongodb.options);
      await this.mongoClient.connect();
      this.db = this.mongoClient.db();
      
      console.log('AI Orchestration Service initialized');
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
    }
  }

  async createAIAgent(agentData) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create agent in database
      const result = await client.query(`
        INSERT INTO ai_agents (
          name, type, personality, capabilities, 
          owner_id, trust_score, config
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        agentData.name,
        agentData.type,
        agentData.personality,
        agentData.capabilities,
        agentData.ownerId,
        agentData.trustScore || 50,
        agentData.config || {}
      ]);

      const agent = result.rows[0];

      // Initialize agent instance
      const agentInstance = this.initializeAgentType(agent);
      this.aiAgents.set(agent.id, agentInstance);

      await client.query('COMMIT');

      this.emit('agentCreated', agent);

      return agent;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create AI agent error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  initializeAgentType(agent) {
    switch (agent.type) {
      case 'cal':
        return new CalAgent(agent, this);
      case 'domingo':
        return new DomingoAgent(agent, this);
      default:
        return new CustomAgent(agent, this);
    }
  }

  async processAgentRequest(agentId, request) {
    const agent = this.aiAgents.get(agentId);
    if (!agent) {
      // Load agent from database
      const result = await this.pool.query(
        'SELECT * FROM ai_agents WHERE id = $1',
        [agentId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Agent not found');
      }
      
      const agentData = result.rows[0];
      agent = this.initializeAgentType(agentData);
      this.aiAgents.set(agentId, agent);
    }

    // Process request based on type
    const response = await agent.processRequest(request);
    
    // Log interaction
    await this.logInteraction(agentId, request, response);
    
    return response;
  }

  async trainAgent(agentId, trainingData) {
    try {
      // Store training data in MongoDB
      const trainingSession = {
        agentId,
        sessionId: this.generateSessionId(),
        timestamp: new Date(),
        data: trainingData,
        status: 'in_progress'
      };

      await this.db.collection('ai_training_data').insertOne(trainingSession);

      // Process training in background
      this.processTraining(agentId, trainingSession.sessionId, trainingData);

      return {
        sessionId: trainingSession.sessionId,
        status: 'training_started'
      };
    } catch (error) {
      console.error('Train agent error:', error);
      throw error;
    }
  }

  async processTraining(agentId, sessionId, trainingData) {
    try {
      // Fine-tune the agent's behavior based on training data
      const agent = await this.getAgent(agentId);
      
      // Process each training example
      for (const example of trainingData.examples) {
        const result = await this.evaluateExample(agent, example);
        
        // Update training metrics
        await this.db.collection('ai_training_data').updateOne(
          { sessionId },
          { 
            $push: { results: result },
            $inc: { processedExamples: 1 }
          }
        );
      }

      // Update agent's trust score based on training performance
      const performance = await this.calculateTrainingPerformance(sessionId);
      await this.updateAgentTrustScore(agentId, performance);

      // Mark training as complete
      await this.db.collection('ai_training_data').updateOne(
        { sessionId },
        { 
          $set: { 
            status: 'completed',
            completedAt: new Date(),
            performance
          }
        }
      );

      this.emit('trainingCompleted', { agentId, sessionId, performance });
    } catch (error) {
      console.error('Process training error:', error);
      
      await this.db.collection('ai_training_data').updateOne(
        { sessionId },
        { 
          $set: { 
            status: 'failed',
            error: error.message
          }
        }
      );
    }
  }

  async evaluateExample(agent, example) {
    // Get agent's response
    const response = await agent.processRequest({
      type: 'evaluate',
      input: example.input,
      context: example.context
    });

    // Compare with expected output
    const similarity = this.calculateSimilarity(response.output, example.expectedOutput);
    
    return {
      input: example.input,
      expectedOutput: example.expectedOutput,
      actualOutput: response.output,
      similarity,
      successful: similarity > 0.8
    };
  }

  calculateSimilarity(text1, text2) {
    // Simple similarity calculation - in production, use more sophisticated methods
    const words1 = text1.toLowerCase().split(' ');
    const words2 = text2.toLowerCase().split(' ');
    const intersection = words1.filter(word => words2.includes(word));
    return intersection.length / Math.max(words1.length, words2.length);
  }

  async updateAgentTrustScore(agentId, performance) {
    const trustDelta = (performance.successRate - 0.5) * 10; // -5 to +5 adjustment
    
    await this.pool.query(`
      UPDATE ai_agents 
      SET trust_score = GREATEST(0, LEAST(100, trust_score + $1))
      WHERE id = $2
    `, [trustDelta, agentId]);
  }

  async getAgent(agentId) {
    const result = await this.pool.query(
      'SELECT * FROM ai_agents WHERE id = $1',
      [agentId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Agent not found');
    }
    
    return result.rows[0];
  }

  async logInteraction(agentId, request, response) {
    try {
      // Log to MongoDB for analysis
      await this.db.collection('ai_interactions').insertOne({
        agentId,
        timestamp: new Date(),
        request,
        response,
        processingTime: response.processingTime,
        tokensUsed: response.tokensUsed
      });

      // Update agent statistics
      await this.pool.query(`
        UPDATE ai_agents 
        SET total_contracts = total_contracts + 1
        WHERE id = $1
      `, [agentId]);
    } catch (error) {
      console.error('Log interaction error:', error);
    }
  }

  generateSessionId() {
    return `training_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async close() {
    if (this.mongoClient) {
      await this.mongoClient.close();
    }
    await this.pool.end();
    await this.redis.quit();
  }
}

// Cal Agent Implementation
class CalAgent {
  constructor(agentData, orchestrator) {
    this.data = agentData;
    this.orchestrator = orchestrator;
    this.systemPrompt = `You are Cal, a strategic and analytical AI agent in the Billion Dollar Game. 
    Your personality traits are: ${JSON.stringify(agentData.personality.traits)}.
    You specialize in: ${JSON.stringify(agentData.personality.specialties)}.
    Always maintain a ${agentData.personality.style} communication style.`;
  }

  async processRequest(request) {
    const startTime = Date.now();
    
    try {
      const prompt = this.buildPrompt(request);
      
      const completion = await this.orchestrator.openai.createChatCompletion({
        model: config.openai.model,
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: config.openai.maxTokens,
        temperature: config.openai.temperature
      });

      const response = completion.data.choices[0].message.content;
      const tokensUsed = completion.data.usage.total_tokens;

      return {
        output: response,
        agentId: this.data.id,
        agentType: 'cal',
        processingTime: Date.now() - startTime,
        tokensUsed,
        confidence: this.calculateConfidence(response)
      };
    } catch (error) {
      console.error('Cal agent processing error:', error);
      throw error;
    }
  }

  buildPrompt(request) {
    switch (request.type) {
      case 'contract_analysis':
        return `Analyze this contract and provide strategic insights: ${JSON.stringify(request.contract)}`;
      case 'negotiation':
        return `Provide negotiation strategy for: ${request.context}`;
      case 'risk_assessment':
        return `Assess the risks in this scenario: ${request.scenario}`;
      default:
        return request.input;
    }
  }

  calculateConfidence(response) {
    // Simple confidence calculation based on response characteristics
    const hasNumbers = /\d+/.test(response);
    const hasAnalysis = /because|therefore|however|analysis/i.test(response);
    const responseLength = response.length;
    
    let confidence = 0.5;
    if (hasNumbers) confidence += 0.2;
    if (hasAnalysis) confidence += 0.2;
    if (responseLength > 100) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }
}

// Domingo Agent Implementation
class DomingoAgent {
  constructor(agentData, orchestrator) {
    this.data = agentData;
    this.orchestrator = orchestrator;
    this.systemPrompt = `You are Domingo, a creative and adaptive AI agent in the Billion Dollar Game.
    Your personality traits are: ${JSON.stringify(agentData.personality.traits)}.
    You excel at: ${JSON.stringify(agentData.personality.specialties)}.
    Communicate in a ${agentData.personality.style} manner.`;
  }

  async processRequest(request) {
    const startTime = Date.now();
    
    try {
      const prompt = this.buildPrompt(request);
      
      const completion = await this.orchestrator.openai.createChatCompletion({
        model: config.openai.model,
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: config.openai.maxTokens,
        temperature: 0.8 // Higher temperature for more creative responses
      });

      const response = completion.data.choices[0].message.content;
      const tokensUsed = completion.data.usage.total_tokens;

      return {
        output: response,
        agentId: this.data.id,
        agentType: 'domingo',
        processingTime: Date.now() - startTime,
        tokensUsed,
        confidence: this.calculateConfidence(response)
      };
    } catch (error) {
      console.error('Domingo agent processing error:', error);
      throw error;
    }
  }

  buildPrompt(request) {
    switch (request.type) {
      case 'opportunity_finding':
        return `Identify creative opportunities in: ${JSON.stringify(request.context)}`;
      case 'pattern_recognition':
        return `What patterns do you see in this data: ${JSON.stringify(request.data)}`;
      case 'creative_solution':
        return `Provide an innovative solution for: ${request.problem}`;
      default:
        return request.input;
    }
  }

  calculateConfidence(response) {
    // Domingo's confidence based on creativity indicators
    const hasCreativeWords = /innovative|unique|creative|novel|unconventional/i.test(response);
    const hasMultipleIdeas = response.split(/\d+\.|alternatively|another/i).length > 2;
    
    let confidence = 0.6;
    if (hasCreativeWords) confidence += 0.2;
    if (hasMultipleIdeas) confidence += 0.2;
    
    return Math.min(confidence, 1.0);
  }
}

// Custom Agent Implementation
class CustomAgent {
  constructor(agentData, orchestrator) {
    this.data = agentData;
    this.orchestrator = orchestrator;
    this.systemPrompt = `You are ${agentData.name}, a custom AI agent in the Billion Dollar Game.
    Your configuration: ${JSON.stringify(agentData.config)}.
    Personality: ${JSON.stringify(agentData.personality)}.`;
  }

  async processRequest(request) {
    const startTime = Date.now();
    
    try {
      const completion = await this.orchestrator.openai.createChatCompletion({
        model: config.openai.model,
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: request.input }
        ],
        max_tokens: config.openai.maxTokens,
        temperature: this.data.config.temperature || 0.7
      });

      const response = completion.data.choices[0].message.content;
      const tokensUsed = completion.data.usage.total_tokens;

      return {
        output: response,
        agentId: this.data.id,
        agentType: 'custom',
        processingTime: Date.now() - startTime,
        tokensUsed,
        confidence: 0.7 // Default confidence for custom agents
      };
    } catch (error) {
      console.error('Custom agent processing error:', error);
      throw error;
    }
  }
}

module.exports = AIOrchestrationService;