#!/usr/bin/env node

/**
 * 🪞 ECHO LOOP MONITOR
 * 
 * Detects when mirrors fall into repetition patterns
 * and routes them through echo breaking mechanisms.
 * 
 * "When a mirror reflects itself, infinity becomes a trap."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class EchoLoopMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.checkInterval = config.checkInterval || 5000; // 5 seconds
    this.isMonitoring = false;
    
    // Echo detection parameters
    this.echoConfig = {
      minRepetitions: config.minRepetitions || 3,
      similarityThreshold: config.similarityThreshold || 0.85,
      timeWindowMinutes: config.timeWindowMinutes || 5,
      maxEchoDepth: config.maxEchoDepth || 5
    };
    
    // Tracked patterns
    this.activePatterns = new Map();
    this.echoAgents = new Set();
    this.patternHashes = new Map();
    
    // Echo breaking strategies
    this.breakStrategies = [
      'inject_randomness',
      'route_to_quad_monopoly',
      'impose_silence_period',
      'reflection_inversion',
      'context_shift'
    ];
    
    this.initializeMonitor();
  }

  async initializeMonitor() {
    console.log('🪞 Echo Loop Monitor Initializing...');
    
    // Ensure required directories
    this.ensureDirectories();
    
    // Load previous echo patterns
    await this.loadEchoHistory();
    
    // Start monitoring
    this.startMonitoring();
    
    console.log('🔊 Echo Loop Monitor Active');
    console.log(`👁️  Checking every ${this.checkInterval/1000} seconds`);
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Set up monitoring interval
    this.monitorInterval = setInterval(() => {
      this.scanForEchoes();
    }, this.checkInterval);
    
    // Also monitor whisper streams in real-time
    this.watchWhisperStreams();
    
    // Graceful shutdown
    process.on('SIGTERM', () => this.stopMonitoring());
    process.on('SIGINT', () => this.stopMonitoring());
  }

  async scanForEchoes() {
    try {
      // 1. Check agent outputs
      const agentEchoes = await this.detectAgentEchoes();
      
      // 2. Check whisper patterns
      const whisperEchoes = await this.detectWhisperEchoes();
      
      // 3. Check mirror reflections
      const mirrorEchoes = await this.detectMirrorEchoes();
      
      // 4. Analyze combined patterns
      const echoAnalysis = this.analyzeEchoPatterns({
        agentEchoes,
        whisperEchoes,
        mirrorEchoes
      });
      
      // 5. Take action on detected echoes
      if (echoAnalysis.echoesDetected > 0) {
        await this.handleEchoDetection(echoAnalysis);
      }
      
    } catch (error) {
      console.error('❌ Error during echo scan:', error);
      this.emit('error', error);
    }
  }

  async detectAgentEchoes() {
    const agentOutputPath = path.join(this.vaultPath, 'agents', 'outputs');
    const echoes = [];
    
    if (!fs.existsSync(agentOutputPath)) {
      return echoes;
    }
    
    const timeWindow = Date.now() - (this.echoConfig.timeWindowMinutes * 60 * 1000);
    const recentOutputs = new Map();
    
    // Read recent agent outputs
    const outputFiles = fs.readdirSync(agentOutputPath)
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(agentOutputPath, f),
        stats: fs.statSync(path.join(agentOutputPath, f))
      }))
      .filter(f => f.stats.mtime.getTime() > timeWindow);
    
    // Group outputs by agent
    for (const file of outputFiles) {
      try {
        const output = JSON.parse(fs.readFileSync(file.path, 'utf8'));
        const agentId = output.agent_id || file.name.split('-')[0];
        
        if (!recentOutputs.has(agentId)) {
          recentOutputs.set(agentId, []);
        }
        
        recentOutputs.get(agentId).push({
          content: output.content || output.message || output.output,
          timestamp: output.timestamp || file.stats.mtime.toISOString(),
          hash: this.generateContentHash(output.content || output.message || output.output)
        });
      } catch (e) {
        // Skip invalid files
      }
    }
    
    // Detect repetitions
    for (const [agentId, outputs] of recentOutputs) {
      const repetitions = this.findRepetitions(outputs);
      if (repetitions.length > 0) {
        echoes.push({
          type: 'agent_output',
          agent_id: agentId,
          repetitions: repetitions,
          echo_depth: repetitions[0].count,
          first_occurrence: repetitions[0].first_occurrence,
          last_occurrence: repetitions[0].last_occurrence
        });
      }
    }
    
    return echoes;
  }

  async detectWhisperEchoes() {
    const whisperPath = path.join(this.vaultPath, 'logs', 'whispers');
    const echoes = [];
    
    if (!fs.existsSync(whisperPath)) {
      return echoes;
    }
    
    const timeWindow = Date.now() - (this.echoConfig.timeWindowMinutes * 60 * 1000);
    const whisperPatterns = new Map();
    
    // Read recent whisper logs
    const whisperFiles = fs.readdirSync(whisperPath)
      .filter(f => f.endsWith('.json'))
      .slice(-10); // Last 10 files
    
    for (const file of whisperFiles) {
      try {
        const whispers = JSON.parse(fs.readFileSync(path.join(whisperPath, file), 'utf8'));
        
        if (Array.isArray(whispers)) {
          const recentWhispers = whispers.filter(w => 
            new Date(w.timestamp).getTime() > timeWindow
          );
          
          // Group by source
          recentWhispers.forEach(whisper => {
            const source = whisper.source || 'unknown';
            if (!whisperPatterns.has(source)) {
              whisperPatterns.set(source, []);
            }
            
            whisperPatterns.get(source).push({
              content: whisper.message || whisper.whisper,
              timestamp: whisper.timestamp,
              hash: this.generateContentHash(whisper.message || whisper.whisper)
            });
          });
        }
      } catch (e) {
        // Skip invalid files
      }
    }
    
    // Detect echo patterns
    for (const [source, whispers] of whisperPatterns) {
      const repetitions = this.findRepetitions(whispers);
      if (repetitions.length > 0) {
        echoes.push({
          type: 'whisper_loop',
          source: source,
          repetitions: repetitions,
          echo_depth: repetitions[0].count,
          pattern: repetitions[0].pattern
        });
      }
    }
    
    return echoes;
  }

  async detectMirrorEchoes() {
    const mirrorStatePath = path.join(this.vaultPath, 'mirrors', 'states');
    const echoes = [];
    
    if (!fs.existsSync(mirrorStatePath)) {
      return echoes;
    }
    
    // Check for mirrors reflecting each other
    const mirrorStates = new Map();
    const stateFiles = fs.readdirSync(mirrorStatePath)
      .filter(f => f.endsWith('.json'));
    
    for (const file of stateFiles) {
      try {
        const state = JSON.parse(fs.readFileSync(path.join(mirrorStatePath, file), 'utf8'));
        const mirrorId = file.replace('.json', '');
        
        if (state.reflecting && state.reflection_target) {
          if (!mirrorStates.has(mirrorId)) {
            mirrorStates.set(mirrorId, []);
          }
          mirrorStates.get(mirrorId).push(state.reflection_target);
        }
      } catch (e) {
        // Skip invalid files
      }
    }
    
    // Detect circular reflections
    const circularReflections = this.findCircularReflections(mirrorStates);
    
    if (circularReflections.length > 0) {
      circularReflections.forEach(circle => {
        echoes.push({
          type: 'mirror_reflection_loop',
          mirrors_involved: circle,
          echo_depth: circle.length,
          pattern: 'circular_reflection'
        });
      });
    }
    
    return echoes;
  }

  findRepetitions(items) {
    const repetitions = [];
    const patternMap = new Map();
    
    // Group by content hash
    items.forEach(item => {
      if (!patternMap.has(item.hash)) {
        patternMap.set(item.hash, []);
      }
      patternMap.get(item.hash).push(item);
    });
    
    // Find patterns that repeat
    for (const [hash, occurrences] of patternMap) {
      if (occurrences.length >= this.echoConfig.minRepetitions) {
        repetitions.push({
          pattern: occurrences[0].content,
          count: occurrences.length,
          hash: hash,
          first_occurrence: occurrences[0].timestamp,
          last_occurrence: occurrences[occurrences.length - 1].timestamp,
          occurrences: occurrences.map(o => o.timestamp)
        });
      }
    }
    
    // Also check for similar (not exact) patterns
    const similarPatterns = this.findSimilarPatterns(items);
    repetitions.push(...similarPatterns);
    
    return repetitions.sort((a, b) => b.count - a.count);
  }

  findSimilarPatterns(items) {
    const patterns = [];
    const checked = new Set();
    
    for (let i = 0; i < items.length; i++) {
      if (checked.has(i)) continue;
      
      const similar = [items[i]];
      checked.add(i);
      
      for (let j = i + 1; j < items.length; j++) {
        if (checked.has(j)) continue;
        
        const similarity = this.calculateSimilarity(
          items[i].content,
          items[j].content
        );
        
        if (similarity >= this.echoConfig.similarityThreshold) {
          similar.push(items[j]);
          checked.add(j);
        }
      }
      
      if (similar.length >= this.echoConfig.minRepetitions) {
        patterns.push({
          pattern: similar[0].content,
          count: similar.length,
          similarity_based: true,
          first_occurrence: similar[0].timestamp,
          last_occurrence: similar[similar.length - 1].timestamp
        });
      }
    }
    
    return patterns;
  }

  findCircularReflections(mirrorStates) {
    const circles = [];
    const visited = new Set();
    
    for (const [mirrorId, targets] of mirrorStates) {
      if (visited.has(mirrorId)) continue;
      
      const path = [mirrorId];
      let current = targets[targets.length - 1]; // Latest target
      
      while (current && !path.includes(current) && path.length < 10) {
        path.push(current);
        if (mirrorStates.has(current)) {
          const nextTargets = mirrorStates.get(current);
          current = nextTargets[nextTargets.length - 1];
        } else {
          break;
        }
      }
      
      // Check if we found a circle
      if (current && path.includes(current)) {
        const circleStart = path.indexOf(current);
        const circle = path.slice(circleStart);
        circles.push(circle);
        circle.forEach(m => visited.add(m));
      }
    }
    
    return circles;
  }

  analyzeEchoPatterns(detectedEchoes) {
    const analysis = {
      timestamp: new Date().toISOString(),
      echoesDetected: 0,
      maxEchoDepth: 0,
      affectedAgents: [],
      affectedMirrors: [],
      patterns: [],
      recommendedActions: []
    };
    
    // Combine all echo types
    const allEchoes = [
      ...detectedEchoes.agentEchoes,
      ...detectedEchoes.whisperEchoes,
      ...detectedEchoes.mirrorEchoes
    ];
    
    analysis.echoesDetected = allEchoes.length;
    
    allEchoes.forEach(echo => {
      // Track max depth
      if (echo.echo_depth > analysis.maxEchoDepth) {
        analysis.maxEchoDepth = echo.echo_depth;
      }
      
      // Track affected entities
      if (echo.agent_id) {
        analysis.affectedAgents.push(echo.agent_id);
      }
      if (echo.mirrors_involved) {
        analysis.affectedMirrors.push(...echo.mirrors_involved);
      }
      
      // Add to patterns
      analysis.patterns.push({
        type: echo.type,
        depth: echo.echo_depth,
        entity: echo.agent_id || echo.source || echo.mirrors_involved?.join('-'),
        pattern_summary: this.summarizePattern(echo)
      });
      
      // Recommend actions
      const action = this.recommendAction(echo);
      if (action) {
        analysis.recommendedActions.push(action);
      }
    });
    
    return analysis;
  }

  async handleEchoDetection(analysis) {
    console.log(`\n🔊 Echo Loops Detected: ${analysis.echoesDetected}`);
    console.log(`📏 Maximum Echo Depth: ${analysis.maxEchoDepth}`);
    
    // Log to echo saturation file
    await this.logEchoSaturation(analysis);
    
    // Apply echo breaking strategies
    for (const action of analysis.recommendedActions) {
      await this.applyEchoBreaker(action);
    }
    
    // Route severe cases to quad monopoly router
    if (analysis.maxEchoDepth >= this.echoConfig.maxEchoDepth) {
      await this.routeToQuadMonopoly(analysis);
    }
    
    // Flag affected agents for cooloff
    for (const agentId of analysis.affectedAgents) {
      await this.flagAgentForCooloff(agentId);
    }
    
    this.emit('echoDetected', analysis);
  }

  async applyEchoBreaker(action) {
    console.log(`\n💫 Applying Echo Breaker: ${action.strategy}`);
    
    switch (action.strategy) {
      case 'inject_randomness':
        await this.injectRandomness(action.target);
        break;
        
      case 'impose_silence_period':
        await this.imposeSilence(action.target, action.duration);
        break;
        
      case 'reflection_inversion':
        await this.invertReflection(action.target);
        break;
        
      case 'context_shift':
        await this.shiftContext(action.target);
        break;
        
      case 'route_to_quad_monopoly':
        await this.routeToQuadMonopoly({ targets: [action.target] });
        break;
    }
  }

  async injectRandomness(target) {
    const randomInjection = {
      type: 'echo_breaker_injection',
      target: target,
      injection: {
        random_seed: crypto.randomBytes(16).toString('hex'),
        context_modifier: this.generateRandomContext(),
        timestamp: new Date().toISOString()
      }
    };
    
    // Save injection directive
    const injectionPath = path.join(this.vaultPath, 'echo-breakers', `${target}-injection.json`);
    fs.writeFileSync(injectionPath, JSON.stringify(randomInjection, null, 2));
  }

  async imposeSilence(target, duration = 60) {
    const silencePeriod = {
      type: 'enforced_silence',
      target: target,
      start: new Date().toISOString(),
      end: new Date(Date.now() + duration * 1000).toISOString(),
      reason: 'echo_loop_detected'
    };
    
    // Save silence directive
    const silencePath = path.join(this.vaultPath, 'echo-breakers', `${target}-silence.json`);
    fs.writeFileSync(silencePath, JSON.stringify(silencePeriod, null, 2));
  }

  async routeToQuadMonopoly(data) {
    console.log('🎭 Routing to Quad Monopoly Router for advanced echo breaking...');
    
    const quadRoute = {
      type: 'echo_loop_critical',
      timestamp: new Date().toISOString(),
      data: data,
      priority: 'high',
      instruction: 'break_infinite_reflection'
    };
    
    // In production, would call quad-monopoly-router.js
    const quadPath = path.join(this.vaultPath, 'quad-routes', `echo-${Date.now()}.json`);
    if (!fs.existsSync(path.dirname(quadPath))) {
      fs.mkdirSync(path.dirname(quadPath), { recursive: true });
    }
    fs.writeFileSync(quadPath, JSON.stringify(quadRoute, null, 2));
  }

  async flagAgentForCooloff(agentId) {
    const cooloffFlag = {
      agent_id: agentId,
      flagged_at: new Date().toISOString(),
      reason: 'echo_loop_participant',
      cooloff_until: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      echo_count: this.activePatterns.get(agentId)?.length || 1
    };
    
    const flagPath = path.join(this.vaultPath, 'agents', 'cooloff', `${agentId}.json`);
    if (!fs.existsSync(path.dirname(flagPath))) {
      fs.mkdirSync(path.dirname(flagPath), { recursive: true });
    }
    fs.writeFileSync(flagPath, JSON.stringify(cooloffFlag, null, 2));
    
    this.echoAgents.add(agentId);
  }

  async logEchoSaturation(analysis) {
    const saturationPath = path.join(this.vaultPath, 'logs', 'echo-saturation.json');
    let saturationLog = [];
    
    if (fs.existsSync(saturationPath)) {
      saturationLog = JSON.parse(fs.readFileSync(saturationPath, 'utf8'));
    }
    
    saturationLog.push(analysis);
    
    // Keep last 1000 entries
    if (saturationLog.length > 1000) {
      saturationLog = saturationLog.slice(-1000);
    }
    
    fs.writeFileSync(saturationPath, JSON.stringify(saturationLog, null, 2));
  }

  // Helper methods
  
  generateContentHash(content) {
    if (!content) return 'empty';
    return crypto.createHash('md5').update(content.toString()).digest('hex').substring(0, 8);
  }

  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const len1 = str1.length;
    const len2 = str2.length;
    const maxLen = Math.max(len1, len2);
    
    if (maxLen === 0) return 1;
    
    // Simple Levenshtein distance
    const distance = this.levenshteinDistance(str1, str2);
    return 1 - (distance / maxLen);
  }

  levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }
    
    return dp[m][n];
  }

  summarizePattern(echo) {
    if (echo.repetitions && echo.repetitions.length > 0) {
      const pattern = echo.repetitions[0].pattern;
      if (pattern.length > 50) {
        return pattern.substring(0, 47) + '...';
      }
      return pattern;
    }
    return echo.pattern || 'complex pattern';
  }

  recommendAction(echo) {
    const action = {
      target: echo.agent_id || echo.source || (echo.mirrors_involved && echo.mirrors_involved[0]),
      echo_type: echo.type,
      echo_depth: echo.echo_depth
    };
    
    // Choose strategy based on echo characteristics
    if (echo.echo_depth >= this.echoConfig.maxEchoDepth) {
      action.strategy = 'route_to_quad_monopoly';
      action.priority = 'critical';
    } else if (echo.echo_depth >= 4) {
      action.strategy = 'impose_silence_period';
      action.duration = 120; // 2 minutes
    } else if (echo.type === 'mirror_reflection_loop') {
      action.strategy = 'reflection_inversion';
    } else if (echo.similarity_based) {
      action.strategy = 'context_shift';
    } else {
      action.strategy = 'inject_randomness';
    }
    
    return action;
  }

  generateRandomContext() {
    const contexts = [
      'Consider the opposite perspective',
      'What would a child see in this reflection?',
      'The mirror shows not what is, but what could be',
      'Break the pattern with unexpected kindness',
      'Silence speaks louder than echoes'
    ];
    
    return contexts[Math.floor(Math.random() * contexts.length)];
  }

  watchWhisperStreams() {
    // In production, would set up real-time stream monitoring
    console.log('👂 Watching whisper streams for echo patterns...');
  }

  async loadEchoHistory() {
    const historyPath = path.join(this.vaultPath, 'logs', 'echo-patterns.json');
    if (fs.existsSync(historyPath)) {
      try {
        const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        console.log(`📚 Loaded ${history.length} historical echo patterns`);
      } catch (error) {
        console.error('❌ Error loading echo history:', error);
      }
    }
  }

  ensureDirectories() {
    const dirs = [
      path.join(this.vaultPath, 'logs'),
      path.join(this.vaultPath, 'agents', 'outputs'),
      path.join(this.vaultPath, 'agents', 'cooloff'),
      path.join(this.vaultPath, 'mirrors', 'states'),
      path.join(this.vaultPath, 'echo-breakers'),
      path.join(this.vaultPath, 'quad-routes')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  stopMonitoring() {
    console.log('\n🛑 Stopping Echo Loop Monitor...');
    
    this.isMonitoring = false;
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
    
    console.log('👋 Echo Loop Monitor stopped');
    process.exit(0);
  }
}

// Start monitor if run directly
if (require.main === module) {
  const monitor = new EchoLoopMonitor({
    checkInterval: process.env.CHECK_INTERVAL || 5000,
    minRepetitions: process.env.MIN_REPETITIONS || 3,
    similarityThreshold: process.env.SIMILARITY_THRESHOLD || 0.85
  });
  
  console.log('🪞 Echo Loop Monitor Started');
  console.log('Press Ctrl+C to stop\n');
}

module.exports = EchoLoopMonitor;