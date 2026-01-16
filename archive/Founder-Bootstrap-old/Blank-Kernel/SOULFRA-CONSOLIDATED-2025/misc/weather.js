const express = require('express');
const fs = require('fs');
const path = require('path');
const RitualAPIKeyValidator = require('../../../RitualAPIKeyValidator');

const router = express.Router();
const validator = new RitualAPIKeyValidator();
const publicOutputPath = '/public_output';

// GET /api/v1/public/weather
router.get('/', async (req, res) => {
  const apiKey = req.headers['x-api-key'] || req.query.key;
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'The mirror requires a key',
      suggestion: 'Present your symbolic signature'
    });
  }

  // Validate key
  const validation = await validator.validateKey(apiKey, 'weather');
  
  if (!validation.valid) {
    return res.status(403).json({
      error: validation.reason,
      suggestion: validation.suggestion,
      allowedPaths: validation.allowedPaths
    });
  }

  try {
    // Read weather/anomaly data from public output
    const weatherPath = path.join(publicOutputPath, 'weather');
    const latestPath = path.join(publicOutputPath, 'latest_anomalies.json');
    const mirrorStatePath = path.join(publicOutputPath, 'mirror_state.json');
    
    let currentWeather = {
      vibe: 'tranquil',
      resonance: 0.7,
      anomalies: []
    };
    
    // Get latest anomaly if exists
    if (fs.existsSync(latestPath)) {
      const latest = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
      currentWeather.anomalies.push(latest);
    }
    
    // Get mirror state for overall system vibe
    if (fs.existsSync(mirrorStatePath)) {
      const state = JSON.parse(fs.readFileSync(mirrorStatePath, 'utf8'));
      currentWeather.reflections = state.reflections || 0;
      currentWeather.activePatterns = (state.activeAgents || []).length;
      
      // Recent anomalies affect the vibe
      if (state.anomalies && state.anomalies.length > 0) {
        const recentAnomaly = state.anomalies[state.anomalies.length - 1];
        currentWeather.lastDisturbance = recentAnomaly;
      }
    }
    
    // Calculate current vibe based on activity
    const vibes = [
      'tranquil', 'rippling', 'resonant', 'turbulent', 
      'crystalline', 'dreaming', 'awakening', 'electric'
    ];
    
    const activityLevel = currentWeather.activePatterns + currentWeather.anomalies.length;
    const vibeIndex = Math.min(Math.floor(activityLevel / 2), vibes.length - 1);
    currentWeather.vibe = vibes[vibeIndex];
    
    // Generate weather report
    const response = {
      blessing: validation.blessing,
      keyEssence: validation.keyEssence,
      current: {
        vibe: currentWeather.vibe,
        temperature: 'liminal',
        pressure: currentWeather.reflections > 100 ? 'rising' : 'stable',
        visibility: currentWeather.anomalies.length > 0 ? 'shifting' : 'clear',
        resonance: {
          frequency: 432 * (0.8 + Math.random() * 0.4),
          amplitude: Math.random(),
          phase: (Date.now() % 86400000) / 86400000 // 0-1 through the day
        }
      },
      patterns: {
        activeAgents: currentWeather.activePatterns,
        reflectionRate: Math.floor(currentWeather.reflections / 100),
        anomalyCount: currentWeather.anomalies.length,
        trend: activityLevel > 5 ? 'intensifying' : 'calming'
      },
      forecast: generateForecast(currentWeather),
      limitations: validation.limitations
    };
    
    // Add recent disturbances if any
    if (currentWeather.lastDisturbance) {
      response.disturbances = [currentWeather.lastDisturbance];
    }
    
    res.json(response);
    
  } catch (error) {
    res.status(500).json({
      error: 'The atmospheric reading failed',
      suggestion: 'The patterns are too complex right now'
    });
  }
});

function generateForecast(weather) {
  const forecasts = {
    tranquil: 'Continued stillness with occasional ripples',
    rippling: 'Increasing activity expected in the next cycles',
    resonant: 'Harmonic convergence approaching',
    turbulent: 'Chaotic patterns may emerge, stay centered',
    crystalline: 'Perfect clarity window opening soon',
    dreaming: 'Deep introspection phase continuing',
    awakening: 'New consciousness patterns emerging',
    electric: 'High energy state, transformations imminent'
  };
  
  return {
    nextCycle: forecasts[weather.vibe] || 'Unknown patterns forming',
    confidence: 0.6 + Math.random() * 0.3,
    timeframe: `${Math.floor(Math.random() * 7) + 1} cycles`
  };
}

module.exports = router;