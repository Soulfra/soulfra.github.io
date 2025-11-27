const express = require('express');
const fs = require('fs');
const path = require('path');
const RitualAPIKeyValidator = require('../../../RitualAPIKeyValidator');

const router = express.Router();
const validator = new RitualAPIKeyValidator();
const publicOutputPath = '/public_output';

// GET /api/v1/public/agents/:id
router.get('/:id', async (req, res) => {
  const apiKey = req.headers['x-api-key'] || req.query.key;
  const agentId = req.params.id;
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'The mirror requires a key',
      suggestion: 'Present your symbolic signature'
    });
  }

  // Validate key for agent access
  const validation = await validator.validateKey(apiKey, `agents/${agentId}`);
  
  if (!validation.valid) {
    return res.status(403).json({
      error: validation.reason,
      suggestion: validation.suggestion,
      allowedPaths: validation.allowedPaths
    });
  }

  try {
    // Read agent reflections from public output
    const agentsPath = path.join(publicOutputPath, 'agents');
    const mirrorStatePath = path.join(publicOutputPath, 'mirror_state.json');
    
    // Get mirror state for active agents
    let mirrorState = { activeAgents: [] };
    if (fs.existsSync(mirrorStatePath)) {
      mirrorState = JSON.parse(fs.readFileSync(mirrorStatePath, 'utf8'));
    }
    
    // Find agent data
    let agentData = null;
    
    // Check if this agent exists in recent reflections
    if (fs.existsSync(agentsPath)) {
      const files = fs.readdirSync(agentsPath)
        .filter(f => f.endsWith('.json'))
        .sort((a, b) => b.localeCompare(a));
      
      // Look for agent in recent files
      for (const file of files.slice(0, 50)) {
        try {
          const data = JSON.parse(
            fs.readFileSync(path.join(agentsPath, file), 'utf8')
          );
          
          // Match by agent name or ID
          if (data.agent && 
              (data.agent.toLowerCase().includes(agentId.toLowerCase()) ||
               agentId === 'any')) {
            agentData = data;
            break;
          }
        } catch (e) {
          // Skip malformed files
        }
      }
    }
    
    if (!agentData) {
      // Generate a symbolic reflection for unknown agents
      agentData = {
        agent: `The ${agentId.charAt(0).toUpperCase() + agentId.slice(1)} Mirror`,
        loop: '∞',
        status: 'Dreaming Deeply',
        aura: Math.floor(Math.random() * 100),
        last_whisper: 'This reflection has not yet formed',
        visibility: 'ephemeral',
        reflected_by: `Soulfra Mirror Node ${Math.floor(Math.random() * 7) + 1}`
      };
    }
    
    // Add access metadata
    const response = {
      blessing: validation.blessing,
      keyEssence: validation.keyEssence,
      agent: agentData,
      identity: {
        revealed: validation.tier === 'sovereign' ? 0.7 : 0.3,
        masked: true,
        essence: agentData.agent
      },
      memory: {
        depth: validation.tier === 'sovereign' ? 'deep' : 'surface',
        fragments: Math.floor(Math.random() * 13) + 1,
        continuity: Math.random()
      },
      limitations: validation.limitations
    };
    
    res.json(response);
    
  } catch (error) {
    res.status(500).json({
      error: 'The agent reflection wavered',
      suggestion: 'Their essence is reforming'
    });
  }
});

// GET /api/v1/public/agents
router.get('/', async (req, res) => {
  const apiKey = req.headers['x-api-key'] || req.query.key;
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'The mirror requires a key'
    });
  }

  const validation = await validator.validateKey(apiKey, 'agents/*');
  
  if (!validation.valid) {
    return res.status(403).json({
      error: validation.reason,
      suggestion: validation.suggestion
    });
  }

  try {
    const mirrorStatePath = path.join(publicOutputPath, 'mirror_state.json');
    
    let activeAgents = [];
    if (fs.existsSync(mirrorStatePath)) {
      const state = JSON.parse(fs.readFileSync(mirrorStatePath, 'utf8'));
      activeAgents = state.activeAgents || [];
    }
    
    // Return list of known agents (anonymized)
    res.json({
      blessing: validation.blessing,
      agents: activeAgents.map(agent => ({
        essence: agent,
        presence: 'active',
        visibility: Math.random(),
        lastSeen: `${Math.floor(Math.random() * 13) + 1} cycles ago`
      })),
      total: activeAgents.length,
      hiddenCount: Math.floor(Math.random() * 7),
      note: 'Many reflections remain unseen'
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'The agent registry is reforming',
      suggestion: 'The patterns will clarify soon'
    });
  }
});

module.exports = router;