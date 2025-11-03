#!/usr/bin/env node

/**
 * MASTER SYSTEM LAUNCHER
 * 
 * Launches ALL systems with proper port management
 * and inter-system connections
 */

const { spawn, exec } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Port allocation for all systems
const SYSTEM_PORTS = {
  // Core Systems
  'ACTUALLY_WORKING': 8080,
  'PRODUCTION_LEGAL': 8888,
  'AI_ECONOMY_SCOREBOARD': 3003,
  'CAL_DASHBOARD': 4040,
  'DOMINGO_ECONOMY': 5055,
  
  // Gaming/Arena Systems  
  'RUNESCAPE_ARENA': 3333,
  'BILLION_DOLLAR_ARENA': 6666,
  'ALTERCATION_VALLEY': 7777,
  
  // Infrastructure
  'INFINITY_ROUTER': 9090,
  'MIRROR_OS': 4000,
  'BLANK_KERNEL': 8000,
  
  // Tier Systems
  'ENTERPRISE_DASHBOARD': 5000,
  'CONSCIOUSNESS_COMMERCE': 5500,
  'MIRRORHUB': 6000,
  
  // Integration
  'UNIFIED_DASHBOARD': 8889,
  'ECONOMY_MESH': 7000,
  'VOICE_SERVER': 3030,
  
  // API Servers
  'CAL_API': 4041,
  'PLATFORM_API': 4042,
  'QR_SERVER': 4043,
  'PROMOTION_SERVER': 4044,
  'MONETIZATION_SERVER': 4045
};

// System definitions
const SYSTEMS = [
  {
    name: 'AI Economy Scoreboard',
    file: './ai-economy-scoreboard.js',
    port: SYSTEM_PORTS.AI_ECONOMY_SCOREBOARD,
    status: 'ready',
    dependencies: []
  },
  {
    name: 'Cal Dashboard', 
    file: './runtime/riven-cli-server.js',
    port: SYSTEM_PORTS.CAL_DASHBOARD,
    status: 'ready',
    dependencies: []
  },
  {
    name: 'Domingo Economy',
    file: './domingo-surface/domingo-bounty-economy.js', 
    port: SYSTEM_PORTS.DOMINGO_ECONOMY,
    status: 'ready',
    dependencies: []
  },
  {
    name: 'Billion Dollar Arena',
    file: './billion-dollar-arena.js',
    port: SYSTEM_PORTS.BILLION_DOLLAR_ARENA,
    status: 'ready',
    dependencies: ['AI_ECONOMY_SCOREBOARD']
  },
  {
    name: 'Mirror OS',
    file: './mirror-os-demo/server.js',
    port: SYSTEM_PORTS.MIRROR_OS,
    status: 'ready', 
    dependencies: []
  },
  {
    name: 'Infinity Router',
    file: './infinity-router-server.js',
    port: SYSTEM_PORTS.INFINITY_ROUTER,
    status: 'ready',
    dependencies: []
  },
  {
    name: 'Enterprise Dashboard',
    file: './tier-minus11/tier-minus12/tier-minus13/tier-minus14/tier-minus15/tier-minus16/tier-minus17/enterprise-semantic-dashboard.js',
    port: SYSTEM_PORTS.ENTERPRISE_DASHBOARD,
    status: 'check',
    dependencies: ['CAL_DASHBOARD']
  },
  {
    name: 'Unified Economy Mesh',
    file: './unified-economy-mesh.js',
    port: SYSTEM_PORTS.ECONOMY_MESH,
    status: 'ready',
    dependencies: ['AI_ECONOMY_SCOREBOARD', 'DOMINGO_ECONOMY']
  }
];

// Track running processes
const runningProcesses = new Map();

// Kill process on port
async function killPort(port) {
  return new Promise((resolve) => {
    exec(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, (err) => {
      setTimeout(resolve, 500);
    });
  });
}

// Check if file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (e) {
    return false;
  }
}

// Check if port is available
function checkPort(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

// Launch a system
async function launchSystem(system) {
  console.log(`\n🚀 Launching ${system.name}...`);
  
  // Check if file exists
  if (!fileExists(system.file)) {
    console.log(`❌ File not found: ${system.file}`);
    return false;
  }
  
  // Kill anything on the port
  await killPort(system.port);
  
  // Set port environment variable
  const env = { ...process.env, PORT: system.port };
  
  // Spawn the process
  const proc = spawn('node', [system.file], {
    env,
    stdio: ['inherit', 'pipe', 'pipe']
  });
  
  // Track output
  let started = false;
  proc.stdout.on('data', (data) => {
    const output = data.toString();
    if (!started && (output.includes('Server') || output.includes('running') || output.includes('listening'))) {
      started = true;
      console.log(`✅ ${system.name} started on port ${system.port}`);
    }
  });
  
  proc.stderr.on('data', (data) => {
    console.error(`❌ ${system.name} error:`, data.toString());
  });
  
  proc.on('close', (code) => {
    console.log(`🛑 ${system.name} stopped (code ${code})`);
    runningProcesses.delete(system.name);
  });
  
  runningProcesses.set(system.name, proc);
  
  // Give it time to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return started;
}

// Main launcher
async function launchAll() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                  MASTER SYSTEM LAUNCHER                       ║
║                                                               ║
║  Launching ${SYSTEMS.length} systems with proper connections              ║
╚═══════════════════════════════════════════════════════════════╝\n`);
  
  // First, check what's already running
  console.log('🔍 Checking existing processes...');
  exec('ps aux | grep node | grep -E "(server|economy|dashboard|arena)" | grep -v grep', (err, stdout) => {
    if (stdout) {
      console.log('\n📋 Already running:');
      console.log(stdout);
    }
  });
  
  // Launch systems in order of dependencies
  const launched = [];
  const failed = [];
  
  for (const system of SYSTEMS) {
    if (system.status === 'check') {
      console.log(`\n⚠️  ${system.name} - needs verification`);
      continue;
    }
    
    const success = await launchSystem(system);
    if (success) {
      launched.push(system);
    } else {
      failed.push(system);
    }
  }
  
  // Summary
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    LAUNCH SUMMARY                             ║
╚═══════════════════════════════════════════════════════════════╝\n`);
  
  console.log('\n✅ Successfully launched:');
  launched.forEach(s => {
    console.log(`   ${s.name}: http://localhost:${s.port}`);
  });
  
  if (failed.length > 0) {
    console.log('\n❌ Failed to launch:');
    failed.forEach(s => {
      console.log(`   ${s.name}: ${s.file}`);
    });
  }
  
  console.log(`\n🌐 MAIN DASHBOARDS:
   Actually Working System: http://localhost:8080
   Production Legal System: http://localhost:8888
   AI Economy Scoreboard: http://localhost:3003
   Unified Dashboard: http://localhost:8889\n`);
  
  console.log('\nPress Ctrl+C to stop all systems\n');
}

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping all systems...');
  runningProcesses.forEach((proc, name) => {
    console.log(`   Stopping ${name}...`);
    proc.kill();
  });
  setTimeout(() => process.exit(0), 1000);
});

// Run
launchAll().catch(console.error);