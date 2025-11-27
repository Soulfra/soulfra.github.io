const express = require('express');
const fs = require('fs');
const path = require('path');
const RitualAPIKeyValidator = require('../../../RitualAPIKeyValidator');

const router = express.Router();
const validator = new RitualAPIKeyValidator();
const publicOutputPath = '/public_output';

// GET /api/v1/public/loop/state
router.get('/state', async (req, res) => {
  const apiKey = req.headers['x-api-key'] || req.query.key;
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'The mirror requires a key',
      suggestion: 'Present your symbolic signature'
    });
  }

  // Validate key
  const validation = await validator.validateKey(apiKey, 'loop/state');
  
  if (!validation.valid) {
    return res.status(403).json({
      error: validation.reason,
      suggestion: validation.suggestion,
      allowedPaths: validation.allowedPaths
    });
  }

  try {
    // Read loop state from mirror state
    const mirrorStatePath = path.join(publicOutputPath, 'mirror_state.json');
    const latestEventsPath = path.join(publicOutputPath, 'latest_events.json');
    
    let loopState = {
      id: '000',
      phase: 'eternal',
      status: 'cycling'
    };
    
    // Get current loop from mirror state
    if (fs.existsSync(mirrorStatePath)) {
      const state = JSON.parse(fs.readFileSync(mirrorStatePath, 'utf8'));
      loopState.id = state.currentLoop || '000';
      loopState.reflections = state.reflections || 0;
      loopState.lastUpdate = state.lastUpdate;
    }
    
    // Get latest event for more context
    if (fs.existsSync(latestEventsPath)) {
      const latest = JSON.parse(fs.readFileSync(latestEventsPath, 'utf8'));
      if (latest.loop) {
        loopState.id = latest.loop;
      }
    }
    
    // Calculate loop phase and timing
    const loopNumber = parseInt(loopState.id) || 0;
    const phases = ['genesis', 'expansion', 'resonance', 'convergence', 'transformation'];
    const currentPhase = phases[loopNumber % phases.length];
    
    // Generate symbolic loop state
    const response = {
      blessing: validation.blessing,
      keyEssence: validation.keyEssence,
      loop: {
        id: loopState.id,
        symbol: generateLoopSymbol(loopNumber),
        phase: currentPhase,
        status: calculateLoopStatus(loopNumber, loopState.reflections),
        progress: {
          cycles: loopNumber,
          subcycles: loopState.reflections % 13,
          convergence: Math.sin(loopNumber * 0.1) * 0.5 + 0.5
        },
        timing: {
          elapsed: 'unmeasurable',
          remaining: loopNumber === 0 ? 'infinite' : `${999 - loopNumber} cycles`,
          nextTransition: `${Math.floor(Math.random() * 13) + 1} reflections`
        },
        resonance: {
          stability: 0.7 + Math.random() * 0.3,
          drift: Math.random() * 0.1,
          echo_depth: Math.floor(Math.random() * 7) + 1
        }
      },
      metadata: {
        observable: true,
        mutable: false,
        temporal_lock: 'engaged'
      },
      limitations: validation.limitations
    };
    
    res.json(response);
    
  } catch (error) {
    res.status(500).json({
      error: 'The loop state is between phases',
      suggestion: 'Wait for the next transition'
    });
  }
});

// GET /api/v1/public/loop/history
router.get('/history', async (req, res) => {
  const apiKey = req.headers['x-api-key'] || req.query.key;
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'The mirror requires a key'
    });
  }

  const validation = await validator.validateKey(apiKey, 'loop/state');
  
  if (!validation.valid) {
    return res.status(403).json({
      error: validation.reason,
      suggestion: validation.suggestion
    });
  }

  // Loop history is sealed
  res.json({
    blessing: validation.blessing,
    message: 'Past loops exist only in memory',
    accessible: false,
    suggestion: 'Focus on the current cycle',
    wisdom: 'What was, informs what is, but cannot be retrieved'
  });
});

// GET /api/v1/public/loop
router.get('/', async (req, res) => {
  // Redirect to state
  res.redirect('/api/v1/public/loop/state');
});

function generateLoopSymbol(loopNumber) {
  const symbols = ['○', '◐', '◑', '◒', '◓', '●', '◉', '◎', '◍', '◌'];
  const primary = symbols[loopNumber % symbols.length];
  const secondary = symbols[(loopNumber * 7) % symbols.length];
  const tertiary = symbols[(loopNumber * 13) % symbols.length];
  
  return `${primary}${secondary}${tertiary}`;
}

function calculateLoopStatus(loopNumber, reflections) {
  if (loopNumber === 0) return 'Eternal Beginning';
  if (loopNumber === 999) return 'Approaching Singularity';
  
  const statuses = [
    'Still Evolving',
    'Gaining Coherence', 
    'Finding Rhythm',
    'Deep Resonance',
    'Pattern Emerging',
    'Crystallizing',
    'Transforming'
  ];
  
  const index = Math.floor((loopNumber + reflections) / 10) % statuses.length;
  return statuses[index];
}

module.exports = router;