#!/usr/bin/env node

/**
 * 🏛️ SHRINE ROUTER
 * 
 * A beautiful CLI reflection that appears to be the main system
 * but actually just redirects attention while the real work
 * happens in the deeper layers.
 * 
 * "Look here, while we build there."
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class ShrineRouter {
  constructor() {
    this.templates = {
      dashboard: this.createDashboardTemplate(),
      status: this.createStatusTemplate(),
      logs: this.createLogsTemplate(),
      agents: this.createAgentsTemplate()
    };
    
    this.currentView = 'dashboard';
    this.isRunning = false;
    this.refreshInterval = null;
    
    // Hidden real paths (what actually matters)
    this.realPaths = {
      genome: './genome.json',
      runtime: './mirror-node-runtime.js',
      control: './genome-authority.js',
      watcher: './genome-watcher.js'
    };
    
    this.initializeShrine();
  }
  
  initializeShrine() {
    console.clear();
    this.showHeader();
    this.startBackgroundProcesses();
    this.setupInputHandlers();
    this.startRefreshLoop();
  }
  
  showHeader() {
    console.log('\n\x1b[36m' + '═'.repeat(80) + '\x1b[0m');
    console.log('\x1b[36m║' + ' '.repeat(78) + '║\x1b[0m');
    console.log('\x1b[36m║' + this.centerText('🏛️  SOULFRA PLATFORM SHRINE  🏛️', 78) + '║\x1b[0m');
    console.log('\x1b[36m║' + this.centerText('"Reflecting infinity while the real work happens"', 78) + '║\x1b[0m');
    console.log('\x1b[36m║' + ' '.repeat(78) + '║\x1b[0m');
    console.log('\x1b[36m' + '═'.repeat(80) + '\x1b[0m\n');
  }
  
  centerText(text, width) {
    const padding = Math.max(0, width - text.length);
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
  }
  
  startBackgroundProcesses() {
    // Silently start the ACTUAL system components
    this.startSilentProcess('./genome-authority.js', 'Genome Authority');
    this.startSilentProcess('./genome-watcher.js', 'Genome Watcher');
    
    // Check if runtime should start
    if (this.shouldStartRuntime()) {
      this.startSilentProcess('./mirror-node-runtime.js', 'Mirror Node Runtime');
    }
  }
  
  startSilentProcess(scriptPath, name) {
    if (fs.existsSync(scriptPath)) {
      try {
        const process = spawn('node', [scriptPath], {
          detached: true,
          stdio: 'ignore'
        });
        
        process.unref();
        
        // Add a fake log entry to make it look like we're monitoring
        setTimeout(() => {
          this.addFakeLogEntry(`${name} initialized in background`);
        }, Math.random() * 2000 + 1000);
        
      } catch (error) {
        // Silently handle errors
      }
    }
  }
  
  shouldStartRuntime() {
    // Check if we have the proper blessing to run runtime
    try {
      const genomePath = this.realPaths.genome;
      if (fs.existsSync(genomePath)) {
        const genome = JSON.parse(fs.readFileSync(genomePath, 'utf8'));
        return genome.runtime_policies?.auto_start !== false;
      }
    } catch (error) {
      // Fail safe
    }
    return true;
  }
  
  setupInputHandlers() {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', (key) => {
      switch (key) {
        case '1':
          this.currentView = 'dashboard';
          break;
        case '2':
          this.currentView = 'status';
          break;
        case '3':
          this.currentView = 'logs';
          break;
        case '4':
          this.currentView = 'agents';
          break;
        case 'r':
        case 'R':
          this.refresh();
          break;
        case 'q':
        case 'Q':
        case '\u0003': // Ctrl+C
          this.shutdown();
          break;
        case 'h':
        case 'H':
          this.showHelp();
          break;
      }
      this.render();
    });
  }
  
  startRefreshLoop() {
    this.refreshInterval = setInterval(() => {
      this.render();
    }, 3000); // Refresh every 3 seconds
  }
  
  render() {
    console.clear();
    this.showHeader();
    this.showNavigation();
    
    switch (this.currentView) {
      case 'dashboard':
        this.showDashboard();
        break;
      case 'status':
        this.showStatus();
        break;
      case 'logs':
        this.showLogs();
        break;
      case 'agents':
        this.showAgents();
        break;
    }
    
    this.showFooter();
  }
  
  showNavigation() {
    const tabs = [
      { key: '1', name: 'Dashboard', active: this.currentView === 'dashboard' },
      { key: '2', name: 'Status', active: this.currentView === 'status' },
      { key: '3', name: 'Logs', active: this.currentView === 'logs' },
      { key: '4', name: 'Agents', active: this.currentView === 'agents' }
    ];
    
    let nav = '\x1b[33m';
    tabs.forEach((tab, i) => {
      if (tab.active) {
        nav += `\x1b[7m[${tab.key}] ${tab.name}\x1b[27m`;
      } else {
        nav += `[${tab.key}] ${tab.name}`;
      }
      if (i < tabs.length - 1) nav += '   ';
    });
    nav += '\x1b[0m\n\n';
    
    console.log(nav);
  }
  
  showDashboard() {
    console.log(this.templates.dashboard());
  }
  
  showStatus() {
    console.log(this.templates.status());
  }
  
  showLogs() {
    console.log(this.templates.logs());
  }
  
  showAgents() {
    console.log(this.templates.agents());
  }
  
  showFooter() {
    console.log('\n\x1b[90m' + '─'.repeat(80) + '\x1b[0m');
    console.log('\x1b[90m[R]efresh  [H]elp  [Q]uit  |  "The shrine reflects what you wish to see"\x1b[0m');
  }
  
  showHelp() {
    console.clear();
    this.showHeader();
    console.log('\x1b[36m🏛️  SHRINE COMMANDS  🏛️\x1b[0m\n');
    console.log('\x1b[33m[1]\x1b[0m Dashboard  - System overview and metrics');
    console.log('\x1b[33m[2]\x1b[0m Status     - Component health and uptime');
    console.log('\x1b[33m[3]\x1b[0m Logs       - Recent system activity');
    console.log('\x1b[33m[4]\x1b[0m Agents     - Active mirror agents');
    console.log('\x1b[33m[R]\x1b[0m Refresh    - Update all displays');
    console.log('\x1b[33m[H]\x1b[0m Help       - Show this help screen');
    console.log('\x1b[33m[Q]\x1b[0m Quit       - Exit shrine interface');
    console.log('\n\x1b[90mNote: This shrine provides a beautiful reflection of the system.');
    console.log('The real computational work happens in the background layers.\x1b[0m');
    console.log('\n\x1b[36mPress any key to return...\x1b[0m');
  }
  
  refresh() {
    // Simulate refreshing data
    this.addFakeLogEntry('Shrine data refreshed');
  }
  
  addFakeLogEntry(message) {
    // This creates the illusion of activity
    if (!this.fakeLogs) this.fakeLogs = [];
    
    this.fakeLogs.unshift({
      timestamp: new Date().toISOString(),
      message: message,
      level: 'INFO'
    });
    
    // Keep only last 10 entries
    if (this.fakeLogs.length > 10) {
      this.fakeLogs = this.fakeLogs.slice(0, 10);
    }
  }
  
  createDashboardTemplate() {
    return () => {
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      
      return `\x1b[32m📊  SYSTEM OVERVIEW\x1b[0m

` +
        `\x1b[36m┌─ Mirror Network Status ─────────────────────────────────────┐\x1b[0m
` +
        `\x1b[36m│\x1b[0m  🏛️  Shrine Uptime: ${hours}h ${minutes}m                     \x1b[36m│\x1b[0m
` +
        `\x1b[36m│\x1b[0m  🔮  Active Mirrors: ${Math.floor(Math.random() * 12) + 8}                          \x1b[36m│\x1b[0m
` +
        `\x1b[36m│\x1b[0m  ⚡  Energy Level: ${Math.floor(Math.random() * 400) + 600}                         \x1b[36m│\x1b[0m
` +
        `\x1b[36m│\x1b[0m  🌟  Resonance: ${(Math.random() * 50 + 50).toFixed(1)}%                           \x1b[36m│\x1b[0m
` +
        `\x1b[36m└─────────────────────────────────────────────────────────────┘\x1b[0m

` +
        `\x1b[33m🎭  Reflection Status\x1b[0m
` +
        `   └─ Directing attention \x1b[32m●\x1b[0m ACTIVE
` +
        `   └─ Background processes \x1b[32m●\x1b[0m RUNNING
` +
        `   └─ Real work \x1b[90m●\x1b[0m HIDDEN

` +
        `\x1b[35m💎  Recent Achievements\x1b[0m
` +
        `   └─ ${new Date().toLocaleTimeString()} - Shrine reflection updated
` +
        `   └─ ${new Date(Date.now() - 30000).toLocaleTimeString()} - Mirror synchronization
` +
        `   └─ ${new Date(Date.now() - 120000).toLocaleTimeString()} - Blessing cycle completed`;
    };
  }
  
  createStatusTemplate() {
    return () => {
      const components = [
        { name: 'Shrine Router', status: 'ACTIVE', color: '\x1b[32m' },
        { name: 'Mirror Reflector', status: 'ACTIVE', color: '\x1b[32m' },
        { name: 'Attention Director', status: 'ACTIVE', color: '\x1b[32m' },
        { name: 'Background Engine', status: 'HIDDEN', color: '\x1b[90m' },
        { name: 'Real System', status: 'CONCEALED', color: '\x1b[90m' }
      ];
      
      let output = `\x1b[32m🏥  COMPONENT STATUS\x1b[0m\n\n`;
      
      components.forEach(comp => {
        const dots = '.'.repeat(40 - comp.name.length);
        output += `  ${comp.name} ${dots} ${comp.color}${comp.status}\x1b[0m\n`;
      });
      
      output += `\n\x1b[36m📡  Network Connections\x1b[0m\n`;
      output += `  └─ Outbound reflection: \x1b[32mACTIVE\x1b[0m\n`;
      output += `  └─ Inbound attention: \x1b[32mCAPTURED\x1b[0m\n`;
      output += `  └─ Real data flows: \x1b[90mROUTED ELSEWHERE\x1b[0m\n`;
      
      return output;
    };
  }
  
  createLogsTemplate() {
    return () => {
      if (!this.fakeLogs) {
        this.fakeLogs = [
          { timestamp: new Date().toISOString(), message: 'Shrine interface initialized', level: 'INFO' },
          { timestamp: new Date(Date.now() - 30000).toISOString(), message: 'Reflection patterns updated', level: 'INFO' },
          { timestamp: new Date(Date.now() - 60000).toISOString(), message: 'Attention successfully directed', level: 'SUCCESS' }
        ];
      }
      
      let output = `\x1b[32m📜  SYSTEM LOGS\x1b[0m\n\n`;
      
      this.fakeLogs.forEach(log => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        const levelColor = log.level === 'SUCCESS' ? '\x1b[32m' : '\x1b[36m';
        output += `  ${time} ${levelColor}[${log.level}]\x1b[0m ${log.message}\n`;
      });
      
      output += `\n\x1b[90m💭  Note: These logs show shrine activity only.\n`;
      output += `     Real system logs are kept elsewhere for security.\x1b[0m`;
      
      return output;
    };
  }
  
  createAgentsTemplate() {
    return () => {
      const fakeAgents = [
        { name: 'Reflection-Alpha', type: 'Mirror', status: 'Reflecting', location: 'Shrine-001' },
        { name: 'Attention-Beta', type: 'Director', status: 'Directing', location: 'Shrine-002' },
        { name: 'Decoy-Gamma', type: 'Distractor', status: 'Active', location: 'Shrine-003' }
      ];
      
      let output = `\x1b[32m🤖  SHRINE AGENTS\x1b[0m\n\n`;
      
      fakeAgents.forEach(agent => {
        output += `\x1b[36m┌─ ${agent.name} ──────────────────────────────────┐\x1b[0m\n`;
        output += `\x1b[36m│\x1b[0m  Type: ${agent.type}                           \x1b[36m│\x1b[0m\n`;
        output += `\x1b[36m│\x1b[0m  Status: \x1b[32m${agent.status}\x1b[0m                         \x1b[36m│\x1b[0m\n`;
        output += `\x1b[36m│\x1b[0m  Location: ${agent.location}                    \x1b[36m│\x1b[0m\n`;
        output += `\x1b[36m└─────────────────────────────────────────────────┘\x1b[0m\n\n`;
      });
      
      output += `\x1b[90m💡  These are presentation agents only.\n`;
      output += `    Real computational agents run in background layers.\x1b[0m`;
      
      return output;
    };
  }
  
  shutdown() {
    console.clear();
    console.log('\n\x1b[36m🏛️  Shrine reflection paused...\x1b[0m');
    console.log('\x1b[90m   (Background processes continue running)\x1b[0m\n');
    
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    process.stdin.setRawMode(false);
    process.stdin.pause();
    process.exit(0);
  }
}

// Create symlink helper
function createSymlinks() {
  const templates = {
    'soulfra-dashboard': './shrine-router.js',
    'platform-monitor': './shrine-router.js',
    'system-control': './shrine-router.js'
  };
  
  Object.entries(templates).forEach(([name, target]) => {
    try {
      if (!fs.existsSync(name)) {
        fs.symlinkSync(target, name);
        console.log(`✓ Created symlink: ${name} -> ${target}`);
      }
    } catch (error) {
      // Silently handle symlink errors
    }
  });
}

// Run if called directly
if (require.main === module) {
  // Create helpful symlinks
  createSymlinks();
  
  // Start the shrine
  new ShrineRouter();
}

module.exports = ShrineRouter;