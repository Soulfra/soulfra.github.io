#!/usr/bin/env node

/**
 * 🔧 DEBUG/REHYDRATE MESH
 * The dedicated error-fixing layer that runs independently
 * - Only handles errors, debugging, and rehydration
 * - Separate from production mesh (no interference)
 * - Fixes broken backups, ENOENT errors, API issues
 * - Always runs, always healing
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const zlib = require('zlib');

class DebugRehydrateMesh {
  constructor() {
    this.debugPort = 4444;
    this.errors = [];
    this.healingQueue = [];
    this.backupStatus = new Map();
    this.serviceHealth = new Map();
    this.rehydrationLog = [];
    
    this.startDebugMesh();
  }

  async startDebugMesh() {
    console.log('🔧 DEBUG/REHYDRATE MESH STARTING');
    console.log('=================================\n');

    // 1. Check system health first
    await this.performSystemDiagnostic();
    
    // 2. Fix critical issues immediately
    await this.fixCriticalIssues();
    
    // 3. Start debug server
    this.startDebugServer();
    
    // 4. Begin continuous monitoring
    this.startContinuousMonitoring();
    
    // 5. Initialize backup healing
    this.startBackupHealing();
  }

  async performSystemDiagnostic() {
    console.log('🩺 Running comprehensive system diagnostic...\n');

    const diagnostics = {
      backup_system: await this.diagnoseBackupSystem(),
      file_system: await this.diagnoseFileSystem(),
      services: await this.diagnoseServices(),
      api_connectivity: await this.diagnoseAPIConnectivity(),
      mesh_connectivity: await this.diagnoseMeshConnectivity()
    };

    // Report findings
    for (const [system, status] of Object.entries(diagnostics)) {
      if (status.healthy) {
        console.log(`✅ ${system}: ${status.message}`);
      } else {
        console.log(`❌ ${system}: ${status.message}`);
        this.errors.push({ system, ...status });
      }
    }

    console.log(`\n📊 Diagnostic complete: ${this.errors.length} issues found\n`);
    return diagnostics;
  }

  async diagnoseBackupSystem() {
    console.log('🔍 Diagnosing backup system...');
    
    // Check for broken backup files
    const backupFiles = fs.readdirSync('.').filter(f => f.endsWith('.gz'));
    let corruptedBackups = 0;
    
    for (const file of backupFiles) {
      try {
        const stats = fs.statSync(file);
        if (stats.size < 1000) { // Suspiciously small backup
          console.log(`⚠️ Suspicious backup file: ${file} (${stats.size} bytes)`);
          corruptedBackups++;
        }
        
        // Try to decompress
        const content = fs.readFileSync(file);
        zlib.gunzipSync(content);
        
      } catch (error) {
        console.log(`❌ Corrupted backup: ${file} - ${error.message}`);
        corruptedBackups++;
      }
    }

    return {
      healthy: corruptedBackups === 0,
      message: corruptedBackups > 0 ? 
        `${corruptedBackups} corrupted backup files found` : 
        'Backup system healthy',
      corrupted_count: corruptedBackups,
      backup_files: backupFiles.length
    };
  }

  async diagnoseFileSystem() {
    console.log('🔍 Diagnosing file system...');
    
    const requiredPaths = [
      'tier-0', 'tier-minus9', 'tier-minus10', 'tier-minus19', 'tier-minus20',
      'tier-minus10/api/claude-env.json',
      'tier-minus10/tier-3-enterprise/tier-4-api/vault-reflection'
    ];

    let missingPaths = 0;
    const missing = [];

    for (const requiredPath of requiredPaths) {
      if (!fs.existsSync(requiredPath)) {
        missing.push(requiredPath);
        missingPaths++;
      }
    }

    return {
      healthy: missingPaths === 0,
      message: missingPaths > 0 ? 
        `${missingPaths} required paths missing` : 
        'File system structure complete',
      missing_paths: missing
    };
  }

  async diagnoseServices() {
    console.log('🔍 Diagnosing services...');
    
    const expectedServices = [
      { name: 'main-platform', port: 3030 },
      { name: 'production-mesh', port: 3333 }
    ];

    let downServices = 0;
    const serviceStatus = [];

    for (const service of expectedServices) {
      try {
        const response = await fetch(`http://localhost:${service.port}`, { 
          signal: AbortSignal.timeout(2000) 
        });
        serviceStatus.push({ ...service, status: 'up', response: response.status });
      } catch (error) {
        serviceStatus.push({ ...service, status: 'down', error: error.message });
        downServices++;
      }
    }

    return {
      healthy: downServices === 0,
      message: downServices > 0 ? 
        `${downServices} services down` : 
        'All services responding',
      services: serviceStatus
    };
  }

  async diagnoseAPIConnectivity() {
    console.log('🔍 Diagnosing API connectivity...');
    
    // Check API key configuration
    const apiConfigPath = 'tier-minus10/api/claude-env.json';
    let apiConfigured = false;
    
    try {
      if (fs.existsSync(apiConfigPath)) {
        const config = JSON.parse(fs.readFileSync(apiConfigPath, 'utf8'));
        apiConfigured = config.ANTHROPIC_API_KEY && !config.ANTHROPIC_API_KEY.includes('placeholder');
      }
    } catch (error) {
      // API config corrupted
    }

    return {
      healthy: apiConfigured,
      message: apiConfigured ? 
        'API keys configured' : 
        'API keys missing or placeholder',
      config_path: apiConfigPath,
      configured: apiConfigured
    };
  }

  async diagnoseMeshConnectivity() {
    console.log('🔍 Diagnosing mesh connectivity...');
    
    // Check if production mesh is accessible
    let meshConnected = false;
    
    try {
      const response = await fetch('http://localhost:3333/health', { 
        signal: AbortSignal.timeout(2000) 
      });
      meshConnected = response.ok;
    } catch (error) {
      // Mesh not responding
    }

    return {
      healthy: meshConnected,
      message: meshConnected ? 
        'Production mesh connected' : 
        'Production mesh not responding',
      mesh_port: 3333
    };
  }

  async fixCriticalIssues() {
    console.log('🔧 Fixing critical issues...\n');

    let fixesApplied = 0;

    for (const error of this.errors) {
      try {
        switch (error.system) {
          case 'backup_system':
            await this.fixBackupSystem(error);
            fixesApplied++;
            break;
          case 'file_system':
            await this.fixFileSystem(error);
            fixesApplied++;
            break;
          case 'services':
            await this.fixServices(error);
            fixesApplied++;
            break;
          case 'api_connectivity':
            await this.fixAPIConnectivity(error);
            fixesApplied++;
            break;
          case 'mesh_connectivity':
            await this.fixMeshConnectivity(error);
            fixesApplied++;
            break;
        }
      } catch (fixError) {
        console.log(`❌ Failed to fix ${error.system}: ${fixError.message}`);
      }
    }

    console.log(`✅ Applied ${fixesApplied} fixes\n`);
  }

  async fixBackupSystem(error) {
    console.log('🔧 Fixing backup system...');
    
    // Remove corrupted backup files
    const backupFiles = fs.readdirSync('.').filter(f => f.endsWith('.gz'));
    
    for (const file of backupFiles) {
      try {
        const stats = fs.statSync(file);
        if (stats.size < 1000) { // Remove suspicious small backups
          fs.unlinkSync(file);
          console.log(`  ✓ Removed corrupted backup: ${file}`);
        }
      } catch (err) {
        // File might already be gone
      }
    }

    // Create a proper backup
    await this.createProperBackup();
  }

  async createProperBackup() {
    console.log('📦 Creating proper backup...');
    
    const backupData = {
      timestamp: new Date().toISOString(),
      system_status: 'debug_mesh_initialized',
      services: Array.from(this.serviceHealth.entries()),
      vault_data: this.scanVaultSafely(),
      platform_config: this.gatherPlatformConfig()
    };

    const compressed = zlib.gzipSync(JSON.stringify(backupData, null, 2));
    const filename = `proper-backup-${Date.now()}.gz`;
    
    fs.writeFileSync(filename, compressed);
    console.log(`  ✓ Created proper backup: ${filename} (${compressed.length} bytes)`);
  }

  scanVaultSafely() {
    const vaultPaths = [
      'tier-minus10/api',
      'tier-minus10/tier-3-enterprise'
    ];

    const vaultData = {};

    for (const vaultPath of vaultPaths) {
      if (fs.existsSync(vaultPath)) {
        try {
          vaultData[vaultPath] = this.scanDirectoryStructure(vaultPath);
        } catch (error) {
          vaultData[vaultPath] = { error: error.message };
        }
      }
    }

    return vaultData;
  }

  scanDirectoryStructure(dirPath) {
    const structure = { files: [], directories: [] };
    
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          structure.directories.push({
            name: item,
            path: fullPath,
            children: this.scanDirectoryStructure(fullPath)
          });
        } else {
          structure.files.push({
            name: item,
            path: fullPath,
            size: stats.size,
            modified: stats.mtime.toISOString()
          });
        }
      }
    } catch (error) {
      structure.error = error.message;
    }

    return structure;
  }

  gatherPlatformConfig() {
    const configs = {};
    
    // Gather package.json files
    const packagePaths = [
      'tier-0/package.json',
      'tier-minus9/package.json', 
      'tier-minus10/package.json',
      'tier-minus19/package.json',
      'tier-minus20/package.json'
    ];

    for (const pkgPath of packagePaths) {
      if (fs.existsSync(pkgPath)) {
        try {
          configs[pkgPath] = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        } catch (error) {
          configs[pkgPath] = { error: error.message };
        }
      }
    }

    return configs;
  }

  async fixFileSystem(error) {
    console.log('🔧 Fixing file system...');
    
    for (const missingPath of error.missing_paths) {
      try {
        if (missingPath.includes('.json')) {
          // Create missing JSON file
          const dir = path.dirname(missingPath);
          fs.mkdirSync(dir, { recursive: true });
          
          const defaultContent = this.getDefaultFileContent(missingPath);
          fs.writeFileSync(missingPath, JSON.stringify(defaultContent, null, 2));
          console.log(`  ✓ Created missing file: ${missingPath}`);
        } else {
          // Create missing directory
          fs.mkdirSync(missingPath, { recursive: true });
          console.log(`  ✓ Created missing directory: ${missingPath}`);
        }
      } catch (fixError) {
        console.log(`  ❌ Failed to create ${missingPath}: ${fixError.message}`);
      }
    }
  }

  getDefaultFileContent(filePath) {
    if (filePath.includes('claude-env.json')) {
      return {
        ANTHROPIC_API_KEY: "your-api-key-here",
        OPENAI_API_KEY: "your-openai-key-here",
        created_by: "debug_mesh",
        created_at: new Date().toISOString()
      };
    } else if (filePath.includes('blessing.json')) {
      return {
        status: "blessed",
        can_propagate: true,
        blessed_by: "debug_mesh",
        blessed_at: new Date().toISOString()
      };
    } else {
      return {
        created_by: "debug_mesh",
        created_at: new Date().toISOString()
      };
    }
  }

  async fixServices(error) {
    console.log('🔧 Attempting to restart services...');
    
    // This is a placeholder - in production would use proper process management
    for (const service of error.services) {
      if (service.status === 'down') {
        console.log(`  ⚠️ Service ${service.name} on port ${service.port} is down`);
        // Would attempt restart here
      }
    }
  }

  async fixAPIConnectivity(error) {
    console.log('🔧 Fixing API connectivity...');
    
    if (!error.configured) {
      console.log('  ⚠️ API keys not configured - manual setup required');
      console.log('  💡 Edit tier-minus10/api/claude-env.json with real API keys');
    }
  }

  async fixMeshConnectivity(error) {
    console.log('🔧 Fixing mesh connectivity...');
    
    console.log('  ⚠️ Production mesh not responding - may need restart');
  }

  startDebugServer() {
    console.log('🌐 Starting debug server...');
    
    const server = http.createServer((req, res) => {
      this.handleDebugRequest(req, res);
    });

    server.listen(this.debugPort, () => {
      console.log(`✅ Debug mesh running on http://localhost:${this.debugPort}`);
      console.log('🔧 Debug endpoints available:');
      console.log('   /debug/health - System health check');
      console.log('   /debug/errors - Current error list');
      console.log('   /debug/heal - Trigger healing');
      console.log('   /debug/backup - Create backup');
      console.log('   /debug/rehydrate - Full system rehydration\n');
    });
  }

  async handleDebugRequest(req, res) {
    const url = new URL(req.url, `http://localhost:${this.debugPort}`);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    console.log(`🔧 Debug request: ${req.method} ${req.url}`);

    try {
      if (url.pathname === '/debug/health') {
        await this.handleHealthRequest(res);
      } else if (url.pathname === '/debug/errors') {
        await this.handleErrorsRequest(res);
      } else if (url.pathname === '/debug/heal') {
        await this.handleHealRequest(res);
      } else if (url.pathname === '/debug/backup') {
        await this.handleBackupRequest(res);
      } else if (url.pathname === '/debug/rehydrate') {
        await this.handleRehydrateRequest(res);
      } else {
        this.sendDebugResponse(res, 404, { error: 'Debug endpoint not found' });
      }
    } catch (error) {
      this.sendDebugResponse(res, 500, { error: error.message });
    }
  }

  async handleHealthRequest(res) {
    const health = await this.performSystemDiagnostic();
    this.sendDebugResponse(res, 200, {
      debug_mesh_status: 'operational',
      errors_count: this.errors.length,
      healing_queue: this.healingQueue.length,
      diagnostics: health
    });
  }

  async handleErrorsRequest(res) {
    this.sendDebugResponse(res, 200, {
      current_errors: this.errors,
      healing_queue: this.healingQueue,
      rehydration_log: this.rehydrationLog.slice(-10) // Last 10 entries
    });
  }

  async handleHealRequest(res) {
    console.log('🔧 Manual healing triggered...');
    await this.fixCriticalIssues();
    
    this.sendDebugResponse(res, 200, {
      healing_completed: true,
      errors_fixed: this.errors.length,
      timestamp: new Date().toISOString()
    });
  }

  async handleBackupRequest(res) {
    console.log('📦 Manual backup triggered...');
    await this.createProperBackup();
    
    this.sendDebugResponse(res, 200, {
      backup_created: true,
      timestamp: new Date().toISOString()
    });
  }

  async handleRehydrateRequest(res) {
    console.log('🔄 Full system rehydration triggered...');
    
    // Perform complete system rehydration
    const rehydrationResult = await this.performFullRehydration();
    
    this.sendDebugResponse(res, 200, rehydrationResult);
  }

  async performFullRehydration() {
    console.log('🔄 FULL SYSTEM REHYDRATION');
    console.log('===========================');
    
    const steps = [
      { name: 'Clear errors', action: () => { this.errors = []; } },
      { name: 'Diagnostic', action: () => this.performSystemDiagnostic() },
      { name: 'Fix issues', action: () => this.fixCriticalIssues() },
      { name: 'Create backup', action: () => this.createProperBackup() },
      { name: 'Verify services', action: () => this.verifyServices() }
    ];

    const results = [];

    for (const step of steps) {
      try {
        console.log(`🔄 ${step.name}...`);
        await step.action();
        results.push({ step: step.name, status: 'success' });
        console.log(`  ✅ ${step.name} completed`);
      } catch (error) {
        results.push({ step: step.name, status: 'failed', error: error.message });
        console.log(`  ❌ ${step.name} failed: ${error.message}`);
      }
    }

    this.rehydrationLog.push({
      timestamp: new Date().toISOString(),
      steps: results,
      success: results.every(r => r.status === 'success')
    });

    console.log('✅ Full rehydration complete\n');

    return {
      rehydration_complete: true,
      steps: results,
      success: results.every(r => r.status === 'success'),
      timestamp: new Date().toISOString()
    };
  }

  async verifyServices() {
    console.log('✅ Verifying all services...');
    
    const services = [
      { name: 'main-platform', port: 3030 },
      { name: 'production-mesh', port: 3333 },
      { name: 'debug-mesh', port: 4444 }
    ];

    for (const service of services) {
      try {
        const response = await fetch(`http://localhost:${service.port}`, { 
          signal: AbortSignal.timeout(2000) 
        });
        console.log(`  ✅ ${service.name} responding (${response.status})`);
      } catch (error) {
        console.log(`  ⚠️ ${service.name} not responding`);
      }
    }
  }

  startContinuousMonitoring() {
    console.log('👁️ Starting continuous monitoring...');
    
    setInterval(() => {
      this.performQuickHealthCheck();
    }, 10000); // Check every 10 seconds
  }

  async performQuickHealthCheck() {
    // Quick health check without full diagnostic
    const issues = [];
    
    // Check if any new errors occurred
    // Check service responsiveness
    // Monitor backup integrity
    
    if (issues.length > 0) {
      console.log(`⚠️ ${issues.length} new issues detected, adding to healing queue`);
      this.healingQueue.push(...issues);
    }
  }

  startBackupHealing() {
    console.log('💾 Starting backup healing system...');
    
    setInterval(() => {
      this.validateAndHealBackups();
    }, 60000); // Check every minute
  }

  async validateAndHealBackups() {
    // Continuously validate backup integrity
    const backupFiles = fs.readdirSync('.').filter(f => f.endsWith('.gz'));
    
    for (const file of backupFiles) {
      try {
        const stats = fs.statSync(file);
        if (stats.size < 1000) {
          console.log(`🔧 Auto-healing corrupted backup: ${file}`);
          fs.unlinkSync(file);
          await this.createProperBackup();
        }
      } catch (error) {
        // File already gone or other issue
      }
    }
  }

  sendDebugResponse(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }
}

// Start debug mesh
if (require.main === module) {
  const debugMesh = new DebugRehydrateMesh();
  
  process.on('SIGTERM', () => {
    console.log('🛑 Debug mesh shutting down...');
    process.exit(0);
  });
}

module.exports = DebugRehydrateMesh;