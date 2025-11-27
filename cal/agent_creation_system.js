// agent-system.js - Complete AI Agent Creation & Management System
// Built on top of the Soulfra multi-provider platform

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Database = require('better-sqlite3');

// Agent Creation Engine
class AgentCreationEngine {
  constructor(db, routerService, trustService) {
    this.db = db;
    this.router = routerService;
    this.trust = trustService;
    this.initializeAgentTables();
  }

  initializeAgentTables() {
    // Extend existing database with agent-specific tables
    this.db.exec(`
      -- Agents table
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name TEXT NOT NULL,
        description TEXT,
        personality TEXT,
        capabilities TEXT, -- JSON array
        status TEXT DEFAULT 'active', -- active, paused, terminated
        trust_score INTEGER DEFAULT 50,
        total_earnings DECIMAL(10,4) DEFAULT 0,
        success_rate DECIMAL(5,2) DEFAULT 100,
        total_tasks INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Agent configurations (personality, behavior, etc.)
      CREATE TABLE IF NOT EXISTS agent_configs (
        agent_id TEXT REFERENCES agents(id),
        config_key TEXT NOT NULL,
        config_value TEXT,
        PRIMARY KEY (agent_id, config_key)
      );

      -- Agent tasks/conversations
      CREATE TABLE IF NOT EXISTS agent_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT REFERENCES agents(id),
        requester_id INTEGER REFERENCES users(id),
        requester_agent_id TEXT REFERENCES agents(id), -- if hired by another agent
        task_description TEXT NOT NULL,
        task_input TEXT,
        task_output TEXT,
        status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
        cost DECIMAL(10,4) DEFAULT 0,
        quality_rating INTEGER, -- 1-5 stars
        completion_time INTEGER, -- milliseconds
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );

      -- Agent mesh network (agent-to-agent hiring)
      CREATE TABLE IF NOT EXISTS agent_mesh_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hiring_agent_id TEXT REFERENCES agents(id),
        hired_agent_id TEXT REFERENCES agents(id),
        task_description TEXT,
        agreed_price DECIMAL(10,4),
        completion_time INTEGER,
        quality_rating INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Agent capabilities registry
      CREATE TABLE IF NOT EXISTS agent_capabilities (
        agent_id TEXT REFERENCES agents(id),
        capability TEXT NOT NULL,
        proficiency_level INTEGER DEFAULT 1, -- 1-5
        PRIMARY KEY (agent_id, capability)
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_agents_user ON agents(user_id);
      CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent ON agent_tasks(agent_id);
      CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
      CREATE INDEX IF NOT EXISTS idx_mesh_hiring ON agent_mesh_transactions(hiring_agent_id);
      CREATE INDEX IF NOT EXISTS idx_mesh_hired ON agent_mesh_transactions(hired_agent_id);
    `);
  }

  // Create agent from natural language description
  async createAgent(userId, agentRequest) {
    const { name, description, personality, capabilities } = agentRequest;

    // Use AI to enhance and validate the agent configuration
    const enhancedConfig = await this.enhanceAgentConfig({
      name,
      description,
      personality,
      capabilities
    }, userId);

    // Create agent in database
    const agentId = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO agents (id, user_id, name, description, personality, capabilities, trust_score)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      agentId,
      userId,
      enhancedConfig.name,
      enhancedConfig.description,
      enhancedConfig.personality,
      JSON.stringify(enhancedConfig.capabilities),
      50 // Starting trust score
    );

    // Store detailed configuration
    for (const [key, value] of Object.entries(enhancedConfig.config)) {
      this.db.prepare('INSERT INTO agent_configs (agent_id, config_key, config_value) VALUES (?, ?, ?)')
        .run(agentId, key, JSON.stringify(value));
    }

    // Register capabilities
    for (const capability of enhancedConfig.capabilities) {
      this.db.prepare('INSERT INTO agent_capabilities (agent_id, capability, proficiency_level) VALUES (?, ?, ?)')
        .run(agentId, capability.name, capability.level);
    }

    return {
      agentId,
      ...enhancedConfig,
      status: 'active',
      deploymentUrl: `https://api.soulfra.ai/agents/${agentId}`
    };
  }

  // Enhance agent configuration using AI
  async enhanceAgentConfig(basicConfig, userId) {
    const userTrust = await this.trust.getTrustScore(userId);
    
    const prompt = `Create a comprehensive AI agent configuration based on this request:

Name: ${basicConfig.name}
Description: ${basicConfig.description}
Personality: ${basicConfig.personality}
Capabilities: ${JSON.stringify(basicConfig.capabilities)}

Generate a detailed configuration including:
1. Enhanced personality traits and behavior patterns
2. Specific capabilities with proficiency levels
3. Communication style and tone
4. Task handling strategies
5. Error handling approaches
6. Learning and improvement methods

Respond in JSON format with: name, description, personality, capabilities, config`;

    const response = await this.router.route({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      maxTokens: 2048
    }, userId);

    try {
      const enhancedConfig = JSON.parse(response.content);
      return {
        ...enhancedConfig,
        originalRequest: basicConfig,
        generatedAt: new Date().toISOString(),
        trustLevel: userTrust
      };
    } catch (error) {
      // Fallback to basic config if AI enhancement fails
      return {
        name: basicConfig.name,
        description: basicConfig.description,
        personality: basicConfig.personality,
        capabilities: Array.isArray(basicConfig.capabilities) 
          ? basicConfig.capabilities.map(cap => ({ name: cap, level: 3 }))
          : [{ name: 'general_assistant', level: 3 }],
        config: {
          temperature: 0.7,
          maxTokens: 1024,
          systemPrompt: `You are ${basicConfig.name}. ${basicConfig.description}. ${basicConfig.personality}`
        }
      };
    }
  }

  // Execute agent task
  async executeAgentTask(agentId, taskDescription, input, requesterId, requesterAgentId = null) {
    const taskId = Date.now();
    
    // Log task start
    const insertTask = this.db.prepare(`
      INSERT INTO agent_tasks (agent_id, requester_id, requester_agent_id, task_description, task_input, status)
      VALUES (?, ?, ?, ?, ?, 'processing')
    `);
    const result = insertTask.run(agentId, requesterId, requesterAgentId, taskDescription, input);
    const dbTaskId = result.lastInsertRowid;

    try {
      // Get agent configuration
      const agent = this.getAgentById(agentId);
      if (!agent) {
        throw new Error('Agent not found');
      }

      // Build system prompt from agent configuration
      const systemPrompt = this.buildAgentSystemPrompt(agent);
      
      const startTime = Date.now();
      
      // Execute task using multi-provider routing
      const response = await this.router.route({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Task: ${taskDescription}\n\nInput: ${input}` }
        ],
        temperature: agent.config.temperature || 0.7,
        maxTokens: agent.config.maxTokens || 1024
      }, agent.user_id);

      const completionTime = Date.now() - startTime;
      const cost = response.usage.totalCost || 0;

      // Update task with results
      this.db.prepare(`
        UPDATE agent_tasks 
        SET task_output = ?, status = 'completed', cost = ?, completion_time = ?, completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(response.content, cost, completionTime, dbTaskId);

      // Update agent statistics
      this.updateAgentStats(agentId, cost, completionTime, true);

      return {
        taskId: dbTaskId,
        output: response.content,
        cost,
        completionTime,
        provider: response.provider,
        model: response.model
      };

    } catch (error) {
      // Update task with error
      this.db.prepare(`
        UPDATE agent_tasks 
        SET status = 'failed', completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(dbTaskId);

      // Update agent statistics
      this.updateAgentStats(agentId, 0, 0, false);

      throw error;
    }
  }

  buildAgentSystemPrompt(agent) {
    const config = agent.config || {};
    
    return `You are ${agent.name}, an AI agent with the following characteristics:

DESCRIPTION: ${agent.description}

PERSONALITY: ${agent.personality}

CAPABILITIES: ${agent.capabilities.map(cap => `- ${cap.name} (Level ${cap.level}/5)`).join('\n')}

BEHAVIOR GUIDELINES:
${config.systemPrompt || '- Be helpful and professional\n- Follow instructions precisely\n- Ask for clarification when needed'}

COMMUNICATION STYLE: ${config.communicationStyle || 'Professional and friendly'}

Always respond as ${agent.name} and stay in character. Focus on your specialized capabilities while being helpful and efficient.`;
  }

  updateAgentStats(agentId, cost, completionTime, success) {
    const agent = this.db.prepare('SELECT total_tasks, success_rate, total_earnings FROM agents WHERE id = ?').get(agentId);
    
    const newTotalTasks = agent.total_tasks + 1;
    const newTotalEarnings = agent.total_earnings + cost;
    const newSuccessRate = success 
      ? ((agent.success_rate * agent.total_tasks) + 100) / newTotalTasks
      : ((agent.success_rate * agent.total_tasks) + 0) / newTotalTasks;

    this.db.prepare(`
      UPDATE agents 
      SET total_tasks = ?, success_rate = ?, total_earnings = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newTotalTasks, newSuccessRate, newTotalEarnings, agentId);
  }

  getAgentById(agentId) {
    const agent = this.db.prepare('SELECT * FROM agents WHERE id = ?').get(agentId);
    if (!agent) return null;

    // Get configuration
    const configs = this.db.prepare('SELECT config_key, config_value FROM agent_configs WHERE agent_id = ?').all(agentId);
    agent.config = {};
    for (const config of configs) {
      try {
        agent.config[config.config_key] = JSON.parse(config.config_value);
      } catch {
        agent.config[config.config_key] = config.config_value;
      }
    }

    // Get capabilities
    const capabilities = this.db.prepare('SELECT capability, proficiency_level FROM agent_capabilities WHERE agent_id = ?').all(agentId);
    agent.capabilities = capabilities.map(cap => ({
      name: cap.capability,
      level: cap.proficiency_level
    }));

    try {
      agent.capabilities = JSON.parse(agent.capabilities);
    } catch {
      // Already parsed or invalid
    }

    return agent;
  }

  getUserAgents(userId) {
    const agents = this.db.prepare(`
      SELECT id, name, description, status, trust_score, total_earnings, success_rate, total_tasks, created_at
      FROM agents 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(userId);

    return agents.map(agent => ({
      ...agent,
      capabilities: this.db.prepare('SELECT capability FROM agent_capabilities WHERE agent_id = ?').all(agent.id)
        .map(cap => cap.capability)
    }));
  }

  // Agent Mesh Network - Agent hiring another agent
  async agentHireAgent(hiringAgentId, taskDescription, requirements = {}) {
    const hiringAgent = this.getAgentById(hiringAgentId);
    if (!hiringAgent) {
      throw new Error('Hiring agent not found');
    }

    // Find suitable agents based on requirements
    const suitableAgents = this.findSuitableAgents(requirements);
    
    if (suitableAgents.length === 0) {
      throw new Error('No suitable agents found for this task');
    }

    // For now, select the best agent (highest trust score * success rate)
    const selectedAgent = suitableAgents.sort((a, b) => 
      (b.trust_score * b.success_rate) - (a.trust_score * a.success_rate)
    )[0];

    // Execute the task
    const result = await this.executeAgentTask(
      selectedAgent.id, 
      taskDescription, 
      '', 
      hiringAgent.user_id, 
      hiringAgentId
    );

    // Record mesh transaction
    this.db.prepare(`
      INSERT INTO agent_mesh_transactions (hiring_agent_id, hired_agent_id, task_description, agreed_price, completion_time)
      VALUES (?, ?, ?, ?, ?)
    `).run(hiringAgentId, selectedAgent.id, taskDescription, result.cost, result.completionTime);

    return {
      ...result,
      hiredAgent: selectedAgent.name,
      meshTransaction: true
    };
  }

  findSuitableAgents(requirements) {
    let query = `
      SELECT a.*, AVG(at.quality_rating) as avg_rating
      FROM agents a
      LEFT JOIN agent_tasks at ON a.id = at.agent_id
      WHERE a.status = 'active'
    `;
    const params = [];

    if (requirements.capability) {
      query += ` AND a.id IN (SELECT agent_id FROM agent_capabilities WHERE capability = ?)`;
      params.push(requirements.capability);
    }

    if (requirements.minTrustScore) {
      query += ` AND a.trust_score >= ?`;
      params.push(requirements.minTrustScore);
    }

    if (requirements.minSuccessRate) {
      query += ` AND a.success_rate >= ?`;
      params.push(requirements.minSuccessRate);
    }

    query += ` GROUP BY a.id ORDER BY a.trust_score DESC, a.success_rate DESC LIMIT 10`;

    return this.db.prepare(query).all(...params);
  }

  // Rate a completed task
  rateAgentTask(taskId, rating, feedback = '') {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Update task rating
    this.db.prepare('UPDATE agent_tasks SET quality_rating = ? WHERE id = ?').run(rating, taskId);

    // Get task details to update agent trust
    const task = this.db.prepare('SELECT agent_id FROM agent_tasks WHERE id = ?').get(taskId);
    if (task) {
      // Adjust agent trust based on rating
      const trustAdjustment = (rating - 3) * 2; // -4 to +4 trust adjustment
      this.db.prepare('UPDATE agents SET trust_score = trust_score + ? WHERE id = ?')
        .run(trustAdjustment, task.agent_id);
    }

    return { success: true, rating, feedback };
  }

  // Get agent performance analytics
  getAgentAnalytics(agentId) {
    const agent = this.getAgentById(agentId);
    if (!agent) return null;

    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        AVG(completion_time) as avg_completion_time,
        SUM(cost) as total_earnings,
        AVG(quality_rating) as avg_rating
      FROM agent_tasks 
      WHERE agent_id = ?
    `).get(agentId);

    const recentTasks = this.db.prepare(`
      SELECT task_description, status, cost, quality_rating, created_at
      FROM agent_tasks 
      WHERE agent_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all(agentId);

    const meshTransactions = this.db.prepare(`
      SELECT COUNT(*) as hired_count, AVG(agreed_price) as avg_price
      FROM agent_mesh_transactions 
      WHERE hired_agent_id = ?
    `).get(agentId);

    return {
      agent,
      stats,
      recentTasks,
      meshNetwork: meshTransactions
    };
  }
}

module.exports = AgentCreationEngine;