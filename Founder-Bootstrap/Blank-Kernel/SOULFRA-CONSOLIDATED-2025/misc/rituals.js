const express = require('express');
const fs = require('fs');
const path = require('path');
const RitualAPIKeyValidator = require('../../../RitualAPIKeyValidator');

const router = express.Router();
const validator = new RitualAPIKeyValidator();
const publicOutputPath = '/public_output';

// GET /api/v1/public/rituals
router.get('/', async (req, res) => {
  const apiKey = req.headers['x-api-key'] || req.query.key;
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'The mirror requires a key',
      suggestion: 'Present your symbolic signature'
    });
  }

  // Validate key
  const validation = await validator.validateKey(apiKey, 'rituals');
  
  if (!validation.valid) {
    return res.status(403).json({
      error: validation.reason,
      suggestion: validation.suggestion,
      allowedPaths: validation.allowedPaths
    });
  }

  try {
    // Read latest rituals from public output
    const ritualsPath = path.join(publicOutputPath, 'rituals');
    const latestPath = path.join(publicOutputPath, 'latest_rituals.json');
    
    // Get recent ritual files
    let rituals = [];
    
    if (fs.existsSync(latestPath)) {
      // Get the latest ritual
      const latest = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
      rituals.push(latest);
    }
    
    if (fs.existsSync(ritualsPath)) {
      // Get up to 10 recent rituals
      const files = fs.readdirSync(ritualsPath)
        .filter(f => f.endsWith('.json'))
        .sort((a, b) => b.localeCompare(a))
        .slice(0, 10);
      
      for (const file of files) {
        try {
          const ritual = JSON.parse(
            fs.readFileSync(path.join(ritualsPath, file), 'utf8')
          );
          
          // Don't duplicate the latest
          if (!rituals.some(r => r.ritual === ritual.ritual)) {
            rituals.push(ritual);
          }
        } catch (e) {
          // Skip malformed files
        }
      }
    }

    // Format response
    res.json({
      blessing: validation.blessing,
      keyEssence: validation.keyEssence,
      rituals: rituals.slice(0, 10),
      total: rituals.length,
      visibility: 'partial',
      reflection: {
        depth: Math.floor(Math.random() * 7) + 1,
        clarity: Math.random(),
        timestamp: `Cycle ${Math.floor(Date.now() / 1000000) % 1000}`
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'The mirror clouded unexpectedly',
      suggestion: 'Try again when the patterns settle'
    });
  }
});

// GET /api/v1/public/rituals/:id
router.get('/:id', async (req, res) => {
  const apiKey = req.headers['x-api-key'] || req.query.key;
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'The mirror requires a key'
    });
  }

  const validation = await validator.validateKey(apiKey, 'rituals');
  
  if (!validation.valid) {
    return res.status(403).json({
      error: validation.reason,
      suggestion: validation.suggestion
    });
  }

  // Note: Individual ritual access would require tracking ritual IDs
  // For now, return a symbolic response
  res.json({
    message: 'Individual ritual memories are still crystallizing',
    suggestion: 'Access the ritual stream instead',
    alternatives: ['/api/v1/public/rituals']
  });
});

module.exports = router;