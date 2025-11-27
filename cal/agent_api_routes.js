// Add these routes to your existing server.js file
// This integrates the agent system with the multi-provider platform

const AgentCreationEngine = require('./agent-system');

// Initialize Agent Engine (add this after initializing router and trustService)
const agentEngine = new AgentCreationEngine(db, router, trustService);

// ================================
// AGENT MANAGEMENT API ROUTES
// ================================

// Create a new AI agent
app.post('/api/agents', authMiddleware, async (req, res) => {
  try {
    const { name, description, personality, capabilities, voiceDescription } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    // If user provided voice description, use AI to convert to structured format
    let agentRequest = { name, description, personality, capabilities };
    
    if (voiceDescription) {
      // Use AI to parse voice description into structured agent config
      const parseResponse = await router.route({
        messages: [{
          role: 'user', 
          content: `Convert this voice description into a structured AI agent configuration:

"${voiceDescription}"

Extract and format as JSON:
{
  "name": "agent name",
  "description": "what the agent does",
  "personality": "personality traits",
  "capabilities": ["capability1", "capability2", ...]
}

Make the agent useful and professional.`
        }],
        temperature: 0.3
      }, req.user.id);

      try {
        const parsedConfig = JSON.parse(parseResponse.content);
        agentRequest = {
          name: parsedConfig.name || name,
          description: parsedConfig.description || description,
          personality: parsedConfig.personality || personality || 'Professional and helpful',
          capabilities: parsedConfig.capabilities || capabilities || ['general_assistant']
        };
      } catch (error) {
        console.error('Failed to parse voice description:', error);
        // Continue with original request
      }
    }

    const agent = await agentEngine.createAgent(req.user.id, agentRequest);

    res.json({
      success: true,
      agent,
      message: `Agent "${agent.name}" created successfully!`
    });

  } catch (error) {
    console.error('Agent creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's agents
app.get('/api/agents', authMiddleware, async (req, res) => {
  try {
    const agents = agentEngine.getUserAgents(req.user.id);
    res.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific agent details
app.get('/api/agents/:agentId', authMiddleware, async (req, res) => {
  try {
    const agent = agentEngine.getAgentById(req.params.agentId);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Check if user owns this agent or if agent is public
    if (agent.user_id !== req.user.id) {
      // Return limited public info
      res.json({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        capabilities: agent.capabilities,
        trust_score: agent.trust_score,
        success_rate: agent.success_rate,
        total_tasks: agent.total_tasks
      });
    } else {
      // Return full details for owner
      const analytics = agentEngine.getAgentAnalytics(req.params.agentId);
      res.json(analytics);
    }
  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Execute a task with an agent
app.post('/api/agents/:agentId/execute', authMiddleware, async (req, res) => {
  try {
    const { taskDescription, input } = req.body;

    if (!taskDescription) {
      return res.status(400).json({ error: 'Task description is required' });
    }

    const result = await agentEngine.executeAgentTask(
      req.params.agentId,
      taskDescription,
      input || '',
      req.user.id
    );

    res.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('Agent execution error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Agent-to-agent hiring (mesh network)
app.post('/api/agents/:agentId/hire', authMiddleware, async (req, res) => {
  try {
    const { taskDescription, requirements } = req.body;

    if (!taskDescription) {
      return res.status(400).json({ error: 'Task description is required' });
    }

    // Verify user owns the hiring agent
    const hiringAgent = agentEngine.getAgentById(req.params.agentId);
    if (!hiringAgent || hiringAgent.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only hire agents on behalf of your own agents' });
    }

    const result = await agentEngine.agentHireAgent(
      req.params.agentId,
      taskDescription,
      requirements || {}
    );

    res.json({
      success: true,
      result,
      message: 'Agent successfully hired another agent for the task'
    });

  } catch (error) {
    console.error('Agent hiring error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rate a completed agent task
app.post('/api/agents/tasks/:taskId/rate', authMiddleware, async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Verify user has permission to rate this task
    const task = db.prepare('SELECT requester_id FROM agent_tasks WHERE id = ?').get(req.params.taskId);
    if (!task || task.requester_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only rate tasks you requested' });
    }

    const result = agentEngine.rateAgentTask(req.params.taskId, rating, feedback);

    res.json({
      success: true,
      result,
      message: 'Task rated successfully'
    });

  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get agent marketplace (discover available agents)
app.get('/api/marketplace/agents', authMiddleware, async (req, res) => {
  try {
    const { capability, minTrustScore, minSuccessRate } = req.query;

    const agents = agentEngine.findSuitableAgents({
      capability,
      minTrustScore: minTrustScore ? parseInt(minTrustScore) : undefined,
      minSuccessRate: minSuccessRate ? parseFloat(minSuccessRate) : undefined
    });

    res.json(agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      capabilities: agent.capabilities,
      trust_score: agent.trust_score,
      success_rate: agent.success_rate,
      total_tasks: agent.total_tasks,
      avg_rating: agent.avg_rating
    })));

  } catch (error) {
    console.error('Marketplace error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's task history
app.get('/api/agents/tasks', authMiddleware, async (req, res) => {
  try {
    const tasks = db.prepare(`
      SELECT 
        at.*,
        a.name as agent_name,
        a.description as agent_description
      FROM agent_tasks at
      JOIN agents a ON at.agent_id = a.id
      WHERE at.requester_id = ?
      ORDER BY at.created_at DESC
      LIMIT 50
    `).all(req.user.id);

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get mesh network activity (agent-to-agent transactions)
app.get('/api/mesh/activity', authMiddleware, async (req, res) => {
  try {
    const activity = db.prepare(`
      SELECT 
        amt.*,
        hiring.name as hiring_agent_name,
        hired.name as hired_agent_name
      FROM agent_mesh_transactions amt
      JOIN agents hiring ON amt.hiring_agent_id = hiring.id
      JOIN agents hired ON amt.hired_agent_id = hired.id
      WHERE hiring.user_id = ? OR hired.user_id = ?
      ORDER BY amt.created_at DESC
      LIMIT 20
    `).all(req.user.id, req.user.id);

    res.json(activity);
  } catch (error) {
    console.error('Error fetching mesh activity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Agent analytics dashboard
app.get('/api/analytics/agents', authMiddleware, async (req, res) => {
  try {
    // Get user's agent performance summary
    const agentStats = db.prepare(`
      SELECT 
        COUNT(DISTINCT a.id) as total_agents,
        SUM(a.total_earnings) as total_earnings,
        AVG(a.success_rate) as avg_success_rate,
        SUM(a.total_tasks) as total_tasks
      FROM agents a
      WHERE a.user_id = ?
    `).get(req.user.id);

    // Get recent performance
    const recentPerformance = db.prepare(`
      SELECT 
        DATE(at.created_at) as date,
        COUNT(*) as tasks,
        AVG(at.quality_rating) as avg_rating,
        SUM(at.cost) as earnings
      FROM agent_tasks at
      JOIN agents a ON at.agent_id = a.id
      WHERE a.user_id = ? AND at.created_at > datetime('now', '-30 days')
      GROUP BY DATE(at.created_at)
      ORDER BY date DESC
    `).all(req.user.id);

    // Get top performing agents
    const topAgents = db.prepare(`
      SELECT 
        a.id,
        a.name,
        a.total_earnings,
        a.success_rate,
        a.total_tasks
      FROM agents a
      WHERE a.user_id = ?
      ORDER BY a.total_earnings DESC
      LIMIT 5
    `).all(req.user.id);

    res.json({
      summary: agentStats,
      recentPerformance,
      topAgents
    });

  } catch (error) {
    console.error('Error fetching agent analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================================
// AGENT QUICK LAUNCH HELPER
// ================================

// Quick agent creation with templates
app.post('/api/agents/quick-create', authMiddleware, async (req, res) => {
  try {
    const { template, customization } = req.body;

    const templates = {
      'content-writer': {
        name: 'Content Writer',
        description: 'Creates engaging blog posts, articles, and marketing copy',
        personality: 'Creative, professional, and engaging. Focuses on clarity and persuasion.',
        capabilities: ['content_writing', 'seo_optimization', 'copywriting', 'blog_writing']
      },
      'data-analyst': {
        name: 'Data Analyst',
        description: 'Analyzes data, creates reports, and provides insights',
        personality: 'Analytical, precise, and detail-oriented. Communicates findings clearly.',
        capabilities: ['data_analysis', 'report_generation', 'statistics', 'data_visualization']
      },
      'customer-support': {
        name: 'Customer Support Agent',
        description: 'Handles customer inquiries and provides helpful support',
        personality: 'Friendly, patient, and helpful. Always aims to solve problems.',
        capabilities: ['customer_service', 'problem_solving', 'communication', 'documentation']
      },
      'code-reviewer': {
        name: 'Code Reviewer',
        description: 'Reviews code for bugs, best practices, and improvements',
        personality: 'Thorough, constructive, and helpful. Focuses on code quality.',
        capabilities: ['code_review', 'debugging', 'best_practices', 'security_analysis']
      },
      'social-media-manager': {
        name: 'Social Media Manager',
        description: 'Creates and optimizes social media content and strategies',
        personality: 'Creative, trendy, and engaging. Understands social media dynamics.',
        capabilities: ['social_media', 'content_creation', 'hashtag_optimization', 'engagement_strategy']
      }
    };

    if (!templates[template]) {
      return res.status(400).json({ 
        error: 'Invalid template',
        availableTemplates: Object.keys(templates)
      });
    }

    let agentConfig = templates[template];

    // Apply customizations
    if (customization) {
      agentConfig = {
        ...agentConfig,
        ...customization,
        name: customization.name || agentConfig.name,
        description: customization.description || agentConfig.description
      };
    }

    const agent = await agentEngine.createAgent(req.user.id, agentConfig);

    res.json({
      success: true,
      agent,
      template,
      message: `${agent.name} created successfully from ${template} template!`
    });

  } catch (error) {
    console.error('Quick agent creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test an agent with a sample task
app.post('/api/agents/:agentId/test', authMiddleware, async (req, res) => {
  try {
    const agent = agentEngine.getAgentById(req.params.agentId);
    
    if (!agent || agent.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Agent not found or access denied' });
    }

    // Use a simple test task based on agent capabilities
    const testTasks = {
      'content_writing': 'Write a short introduction paragraph about artificial intelligence.',
      'data_analysis': 'Explain how you would analyze customer satisfaction survey data.',
      'customer_service': 'How would you help a customer who is having trouble logging into their account?',
      'code_review': 'What are the key things you look for when reviewing JavaScript code?',
      'social_media': 'Create a sample tweet about the benefits of automation.'
    };

    const primaryCapability = agent.capabilities[0]?.name || 'general_assistant';
    const testTask = testTasks[primaryCapability] || 'Introduce yourself and explain what you can help with.';

    const result = await agentEngine.executeAgentTask(
      req.params.agentId,
      'Test Task',
      testTask,
      req.user.id
    );

    res.json({
      success: true,
      testTask,
      result,
      message: 'Agent test completed successfully!'
    });

  } catch (error) {
    console.error('Agent test error:', error);
    res.status(500).json({ error: error.message });
  }
});

console.log('🤖 Agent system initialized with the following endpoints:');
console.log('   POST /api/agents - Create new agent');
console.log('   GET  /api/agents - List user agents');
console.log('   POST /api/agents/quick-create - Create from template');
console.log('   POST /api/agents/:id/execute - Execute agent task');
console.log('   POST /api/agents/:id/hire - Agent-to-agent hiring');
console.log('   GET  /api/marketplace/agents - Discover agents');
console.log('   GET  /api/mesh/activity - Mesh network activity');
console.log('   POST /api/agents/:id/test - Test agent with sample task');