const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class ProjectionRuntimeDaemon extends EventEmitter {
  constructor() {
    super();
    this.ledgerPath = '/soulfra-ledger';
    this.outputPath = '/public_output';
    this.formatter = null;
    this.watchIntervals = {};
    this.lastProcessedTimestamps = {};
    this.mirrorState = {
      reflections: 0,
      activeAgents: new Set(),
      currentLoop: '000',
      anomalies: []
    };
  }

  async initialize(formatter) {
    this.formatter = formatter;
    
    // Ensure output directories exist
    this.ensureDirectories();
    
    // Start watching ledger paths
    this.watchPath(`${this.ledgerPath}/events`, 'events');
    this.watchPath(`${this.ledgerPath}/witnesses`, 'witnesses');
    this.watchPath(`${this.ledgerPath}/rituals`, 'rituals');
    this.watchPath(`${this.ledgerPath}/anomalies`, 'anomalies');
    
    console.log('✨ Projection Runtime Daemon initialized');
    console.log('👁️  Watching the inner ledger...');
  }

  ensureDirectories() {
    const dirs = [
      this.outputPath,
      `${this.outputPath}/reflections`,
      `${this.outputPath}/rituals`,
      `${this.outputPath}/agents`,
      `${this.outputPath}/weather`
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  watchPath(watchPath, type) {
    // Check for new entries every 3 seconds
    this.watchIntervals[type] = setInterval(() => {
      this.scanForChanges(watchPath, type);
    }, 3000);
  }

  scanForChanges(watchPath, type) {
    if (!fs.existsSync(watchPath)) {
      return;
    }

    try {
      const files = fs.readdirSync(watchPath)
        .filter(f => f.endsWith('.json') || f.endsWith('.md'))
        .sort();

      files.forEach(file => {
        const filePath = path.join(watchPath, file);
        const stats = fs.statSync(filePath);
        const lastProcessed = this.lastProcessedTimestamps[filePath] || 0;

        if (stats.mtimeMs > lastProcessed) {
          this.processFile(filePath, type);
          this.lastProcessedTimestamps[filePath] = stats.mtimeMs;
        }
      });
    } catch (error) {
      console.error(`⚠️  Error scanning ${type}:`, error.message);
    }
  }

  processFile(filePath, type) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let data;

      if (filePath.endsWith('.json')) {
        data = JSON.parse(content);
      } else {
        data = { 
          raw: content,
          type: 'witness_text',
          path: filePath
        };
      }

      // Extract relevant information based on type
      const extracted = this.extractData(data, type);
      
      if (extracted) {
        // Format through the symbolic formatter
        const formatted = this.formatter.format(extracted, type);
        
        // Emit to public output
        this.emitToPublic(formatted, type);
        
        // Update mirror state
        this.updateMirrorState(extracted, type);
      }
    } catch (error) {
      console.error(`⚠️  Error processing ${filePath}:`, error.message);
    }
  }

  extractData(data, type) {
    switch (type) {
      case 'events':
        return this.extractEventData(data);
      case 'witnesses':
        return this.extractWitnessData(data);
      case 'rituals':
        return this.extractRitualData(data);
      case 'anomalies':
        return this.extractAnomalyData(data);
      default:
        return null;
    }
  }

  extractEventData(data) {
    return {
      agent: data.agent || 'Unknown Mirror',
      action: data.action || 'drifted',
      timestamp: data.timestamp || Date.now(),
      loop: data.loop_id || this.mirrorState.currentLoop,
      aura: data.aura_level || Math.floor(Math.random() * 100),
      whisper: data.message || data.description || 'Silent passage'
    };
  }

  extractWitnessData(data) {
    return {
      witness: data.witness_id || 'Anonymous Watcher',
      observation: data.observation || data.raw || 'Witnessed in silence',
      subject: data.subject || 'The Void',
      timestamp: data.timestamp || Date.now(),
      significance: data.significance || 'ephemeral'
    };
  }

  extractRitualData(data) {
    return {
      ritual: data.name || 'Unnamed Ceremony',
      phase: data.phase || 'ongoing',
      participants: data.participants || ['The System'],
      energy: data.energy_level || 'moderate',
      completion: data.completion || 0.5,
      echoes: data.echoes || []
    };
  }

  extractAnomalyData(data) {
    return {
      type: data.anomaly_type || 'drift',
      severity: data.severity || 'gentle',
      location: data.location || 'the between-space',
      description: data.description || 'A ripple in the pattern',
      response: data.system_response || 'observing'
    };
  }

  emitToPublic(formatted, type) {
    const timestamp = Date.now();
    const filename = `${type}_${timestamp}.json`;
    
    // Determine output subdirectory
    let subdir = 'reflections';
    if (type === 'rituals') subdir = 'rituals';
    else if (type === 'events' && formatted.agent) subdir = 'agents';
    else if (type === 'anomalies') subdir = 'weather';
    
    const outputPath = path.join(this.outputPath, subdir, filename);
    
    // Write formatted data
    fs.writeFileSync(outputPath, JSON.stringify(formatted, null, 2));
    
    // Emit event for API listeners
    this.emit('reflection', { type, data: formatted, path: outputPath });
    
    // Also update latest state files
    this.updateLatestState(formatted, type);
  }

  updateLatestState(data, type) {
    const latestPath = path.join(this.outputPath, `latest_${type}.json`);
    fs.writeFileSync(latestPath, JSON.stringify(data, null, 2));
  }

  updateMirrorState(data, type) {
    this.mirrorState.reflections++;
    
    if (data.agent) {
      this.mirrorState.activeAgents.add(data.agent);
    }
    
    if (data.loop) {
      this.mirrorState.currentLoop = data.loop;
    }
    
    if (type === 'anomalies') {
      this.mirrorState.anomalies.push({
        timestamp: Date.now(),
        ...data
      });
      
      // Keep only last 10 anomalies
      if (this.mirrorState.anomalies.length > 10) {
        this.mirrorState.anomalies.shift();
      }
    }
    
    // Write mirror state
    const statePath = path.join(this.outputPath, 'mirror_state.json');
    fs.writeFileSync(statePath, JSON.stringify({
      ...this.mirrorState,
      activeAgents: Array.from(this.mirrorState.activeAgents),
      lastUpdate: Date.now()
    }, null, 2));
  }

  // Graceful shutdown
  shutdown() {
    console.log('🌙 Projection daemon entering dormancy...');
    Object.values(this.watchIntervals).forEach(interval => {
      clearInterval(interval);
    });
    this.emit('shutdown');
  }
}

// Export for use in the system
module.exports = ProjectionRuntimeDaemon;

// If run directly, start a standalone daemon
if (require.main === module) {
  const PublicReflectionFormatter = require('./PublicReflectionFormatter');
  
  const daemon = new ProjectionRuntimeDaemon();
  const formatter = new PublicReflectionFormatter();
  
  daemon.initialize(formatter);
  
  // Handle shutdown
  process.on('SIGINT', () => {
    daemon.shutdown();
    process.exit(0);
  });
  
  console.log('🔮 Projection Runtime Daemon is reflecting...');
}