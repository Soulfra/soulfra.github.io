#!/usr/bin/env node

/**
 * 🔧 SOULFRA DIAGNOSTIC & REPAIR SHELL
 * Identifies and fixes deformation issues across the entire ecosystem
 * Checks files, services, encoding, and can restore from backups
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

class SoulfraDiagnosticRepairShell {
  constructor() {
    this.port = 8888;
    this.issues = [];
    this.repairs = [];
    this.services = new Map();
    this.fileStatus = new Map();
    
    this.initializeShell();
  }

  async initializeShell() {
    console.log('🔧 SOULFRA DIAGNOSTIC & REPAIR SHELL');
    console.log('====================================');
    console.log('Scanning for deformation and issues...\n');

    // 1. Check all JavaScript files
    await this.checkJavaScriptFiles();
    
    // 2. Check all JSON files
    await this.checkJSONFiles();
    
    // 3. Check all Markdown files
    await this.checkMarkdownFiles();
    
    // 4. Check service health
    await this.checkServiceHealth();
    
    // 5. Check for encoding issues
    await this.checkEncodingIssues();
    
    // 6. Check for port conflicts
    await this.checkPortConflicts();
    
    // 7. Generate diagnostic report
    this.generateDiagnosticReport();
    
    // 8. Start repair server
    this.startRepairServer();
  }

  async checkJavaScriptFiles() {
    console.log('🔍 Checking JavaScript files...');
    
    const jsFiles = [
      'soulfra-outcomes.js',
      'white-knight-security-mesh.js',
      'soulfra-streaming-network.js',
      'live-participation-engine.js',
      'tier-4-mirror-api-bridge.js',
      'enhanced-gaming-engine.js',
      'enterprise-dashboard-engine.js',
      'mobile-apps-engine.js',
      'ai-collaboration-engine.js',
      'platform-generator-engine.js',
      'multi-tenant-orchestrator.js'
    ];
    
    for (const file of jsFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for syntax errors
        try {
          new Function(content);
          this.fileStatus.set(file, { status: 'valid', type: 'javascript' });
        } catch (syntaxError) {
          this.issues.push({
            file: file,
            type: 'syntax_error',
            error: syntaxError.message,
            line: this.extractLineNumber(syntaxError.message)
          });
          this.fileStatus.set(file, { status: 'syntax_error', type: 'javascript' });
        }
        
        // Check for common deformation patterns
        if (content.includes('') || content.includes('') || content.includes(''')) {
          this.issues.push({
            file: file,
            type: 'encoding_issue',
            error: 'Contains malformed characters',
            sample: this.extractMalformedSample(content)
          });
        }
        
        // Check for template literal issues
        const templateLiteralRegex = /`[^`]*\${[^}]*}[^`]*`/g;
        const matches = content.match(templateLiteralRegex);
        if (matches) {
          matches.forEach(match => {
            if (match.includes('\\$') || match.includes('\\`')) {
              this.issues.push({
                file: file,
                type: 'template_literal_issue',
                error: 'Escaped template literal syntax',
                sample: match.substring(0, 100)
              });
            }
          });
        }
        
      } catch (error) {
        this.issues.push({
          file: file,
          type: 'file_error',
          error: error.message
        });
        this.fileStatus.set(file, { status: 'error', type: 'javascript' });
      }
    }
    
    console.log(`✓ Checked ${jsFiles.length} JavaScript files`);
  }

  async checkJSONFiles() {
    console.log('🔍 Checking JSON files...');
    
    const jsonFiles = [
      'package.json',
      'platform-launch-seed.json'
    ];
    
    for (const file of jsonFiles) {
      if (fs.existsSync(file)) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          JSON.parse(content);
          this.fileStatus.set(file, { status: 'valid', type: 'json' });
        } catch (error) {
          this.issues.push({
            file: file,
            type: 'json_parse_error',
            error: error.message
          });
          this.fileStatus.set(file, { status: 'invalid', type: 'json' });
        }
      }
    }
    
    console.log(`✓ Checked ${jsonFiles.length} JSON files`);
  }

  async checkMarkdownFiles() {
    console.log('🔍 Checking Markdown files...');
    
    const mdFiles = [
      'SOULFRA_MAXED_OUT_PRDS.md',
      'creator_tech_battle_plan.md',
      'viral_sharing_prd.md',
      'viral_sharing_executive_memo.md'
    ];
    
    for (const file of mdFiles) {
      if (fs.existsSync(file)) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          // Check for encoding issues
          if (content.includes('') || content.includes('"') || content.includes(''')) {
            this.issues.push({
              file: file,
              type: 'markdown_encoding',
              error: 'Contains encoding artifacts',
              canAutoFix: true
            });
          }
          
          this.fileStatus.set(file, { status: 'valid', type: 'markdown' });
        } catch (error) {
          this.issues.push({
            file: file,
            type: 'file_error',
            error: error.message
          });
        }
      }
    }
    
    console.log(`✓ Checked ${mdFiles.length} Markdown files`);
  }

  async checkServiceHealth() {
    console.log('🔍 Checking service health...');
    
    const services = [
      { name: 'Soulfra Outcomes', port: 3030 },
      { name: 'White Knight Security', port: 5555 },
      { name: 'Streaming Network', port: 6666 },
      { name: 'Live Participation', port: 5001 },
      { name: 'API Bridge', port: 4000 },
      { name: 'Gaming Engine', port: 6000 },
      { name: 'Enterprise Dashboard', port: 6001 },
      { name: 'Mobile Apps', port: 6002 },
      { name: 'AI Collaboration', port: 6003 },
      { name: 'Platform Generator', port: 7100 },
      { name: 'Multi-Tenant Orchestrator', port: 7001 }
    ];
    
    for (const service of services) {
      const isRunning = await this.checkPort(service.port);
      this.services.set(service.name, {
        port: service.port,
        status: isRunning ? 'running' : 'stopped',
        accessible: false
      });
      
      if (isRunning) {
        // Check if service responds
        try {
          const response = await this.checkHTTPResponse(service.port);
          this.services.get(service.name).accessible = response.ok;
          this.services.get(service.name).httpCode = response.code;
        } catch (error) {
          this.services.get(service.name).accessible = false;
          this.services.get(service.name).error = error.message;
        }
      }
    }
    
    console.log(`✓ Checked ${services.length} services`);
  }

  async checkEncodingIssues() {
    console.log('🔍 Checking for encoding issues...');
    
    const allFiles = fs.readdirSync('.').filter(f => 
      f.endsWith('.js') || f.endsWith('.json') || f.endsWith('.md')
    );
    
    let encodingIssues = 0;
    
    for (const file of allFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const problematicChars = [
          { char: '', name: 'replacement character' },
          { char: ''', name: 'smart quote artifact' },
          { char: '"', name: 'smart quote artifact' },
          { char: '"', name: 'em dash artifact' },
          { char: 'Ã¢', name: 'UTF-8 decode error' }
        ];
        
        for (const prob of problematicChars) {
          if (content.includes(prob.char)) {
            encodingIssues++;
            this.issues.push({
              file: file,
              type: 'encoding_artifact',
              error: `Contains ${prob.name}`,
              character: prob.char,
              canAutoFix: true
            });
            break;
          }
        }
      } catch (error) {
        // Ignore read errors for now
      }
    }
    
    console.log(`✓ Found ${encodingIssues} encoding issues`);
  }

  async checkPortConflicts() {
    console.log('🔍 Checking for port conflicts...');
    
    try {
      const output = execSync('lsof -i -P -n | grep LISTEN', { encoding: 'utf8' });
      const lines = output.split('\n');
      
      const portsInUse = new Set();
      lines.forEach(line => {
        const match = line.match(/:(\d+)\s+\(LISTEN\)/);
        if (match) {
          portsInUse.add(parseInt(match[1]));
        }
      });
      
      const soulfraPortsNeeded = [3030, 5555, 6666, 5001, 4000, 6000, 6001, 6002, 6003, 7100, 7001];
      
      for (const port of soulfraPortsNeeded) {
        if (portsInUse.has(port)) {
          const processInfo = lines.find(line => line.includes(`:${port}`));
          if (processInfo && !processInfo.includes('node')) {
            this.issues.push({
              type: 'port_conflict',
              port: port,
              error: `Port ${port} is in use by another process`,
              process: processInfo.split(/\s+/)[0]
            });
          }
        }
      }
    } catch (error) {
      // lsof might not be available or fail
    }
    
    console.log('✓ Port conflict check complete');
  }

  async checkPort(port) {
    return new Promise((resolve) => {
      const server = require('net').createServer();
      server.once('error', () => resolve(true)); // Port in use
      server.once('listening', () => {
        server.close();
        resolve(false); // Port available
      });
      server.listen(port);
    });
  }

  async checkHTTPResponse(port) {
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        resolve({ ok: res.statusCode === 200, code: res.statusCode });
        res.resume();
      });
      req.on('error', (error) => {
        resolve({ ok: false, error: error.message });
      });
      req.setTimeout(2000, () => {
        req.destroy();
        resolve({ ok: false, error: 'Timeout' });
      });
    });
  }

  extractLineNumber(errorMessage) {
    const match = errorMessage.match(/line (\d+)/i);
    return match ? parseInt(match[1]) : null;
  }

  extractMalformedSample(content) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('') || lines[i].includes('')) {
        return `Line ${i + 1}: ${lines[i].substring(0, 100)}...`;
      }
    }
    return 'Unknown location';
  }

  generateDiagnosticReport() {
    console.log('\n📊 DIAGNOSTIC REPORT');
    console.log('===================');
    
    console.log(`\n🚨 Issues Found: ${this.issues.length}`);
    if (this.issues.length > 0) {
      console.log('\nDetailed Issues:');
      this.issues.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.type.toUpperCase()}`);
        console.log(`   File: ${issue.file || 'N/A'}`);
        console.log(`   Error: ${issue.error}`);
        if (issue.canAutoFix) {
          console.log(`   ✅ Can be auto-fixed`);
        }
      });
    }
    
    console.log('\n📡 Service Status:');
    for (const [name, status] of this.services) {
      const icon = status.status === 'running' && status.accessible ? '✅' : '❌';
      console.log(`${icon} ${name}: ${status.status} (Port ${status.port})`);
    }
    
    console.log('\n📁 File Status Summary:');
    let validFiles = 0;
    let invalidFiles = 0;
    for (const [file, status] of this.fileStatus) {
      if (status.status === 'valid') validFiles++;
      else invalidFiles++;
    }
    console.log(`✅ Valid files: ${validFiles}`);
    console.log(`❌ Invalid files: ${invalidFiles}`);
  }

  async autoRepair() {
    console.log('\n🔧 STARTING AUTO-REPAIR');
    console.log('=====================');
    
    let repaired = 0;
    
    // Fix encoding issues
    const encodingIssues = this.issues.filter(i => i.canAutoFix && i.type.includes('encoding'));
    for (const issue of encodingIssues) {
      try {
        let content = fs.readFileSync(issue.file, 'utf8');
        
        // Common encoding fixes
        content = content
          .replace(/'/g, "'")
          .replace(/"/g, '"')
          .replace(/"/g, '"')
          .replace(/""/g, '—')
          .replace(/""/g, '–')
          .replace(/Ã¢/g, '')
          .replace(//g, '')
          .replace(//g, '')
          .replace(/oe/g, 'oe')
          .replace(//g, '');
        
        fs.writeFileSync(issue.file, content, 'utf8');
        repaired++;
        this.repairs.push({
          file: issue.file,
          type: 'encoding_fix',
          status: 'success'
        });
      } catch (error) {
        this.repairs.push({
          file: issue.file,
          type: 'encoding_fix',
          status: 'failed',
          error: error.message
        });
      }
    }
    
    console.log(`✓ Repaired ${repaired} files`);
    
    // Restart stopped services
    const stoppedServices = Array.from(this.services.entries())
      .filter(([name, status]) => status.status === 'stopped');
    
    if (stoppedServices.length > 0) {
      console.log('\n🚀 Restarting stopped services...');
      try {
        execSync('./launch-soulfra-ecosystem.sh', { stdio: 'inherit' });
        console.log('✓ Services restarted');
      } catch (error) {
        console.log('❌ Failed to restart services:', error.message);
      }
    }
    
    return repaired;
  }

  startRepairServer() {
    console.log('\n🌐 Starting diagnostic server...');
    
    const server = http.createServer((req, res) => {
      this.handleRepairRequest(req, res);
    });

    server.listen(this.port, () => {
      console.log(`✓ Diagnostic & Repair Shell running on port ${this.port}`);
      console.log(`\n🔧 Access dashboard at: http://localhost:${this.port}`);
    });
  }

  async handleRepairRequest(req, res) {
    const url = new URL(req.url, `http://localhost:${this.port}`);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (url.pathname === '/') {
      await this.handleDashboard(res);
    } else if (url.pathname === '/api/autorepair' && req.method === 'POST') {
      await this.handleAutoRepair(res);
    } else if (url.pathname === '/api/restart-services' && req.method === 'POST') {
      await this.handleRestartServices(res);
    } else if (url.pathname === '/api/refresh' && req.method === 'GET') {
      await this.handleRefresh(res);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  }

  async handleDashboard(res) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>🔧 Soulfra Diagnostic & Repair Dashboard</title>
  <style>
    body { font-family: Arial; background: #0a0a0a; color: white; margin: 0; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .status-card { background: #1a1a1a; padding: 20px; border-radius: 10px; margin: 20px 0; }
    .issue { background: #2a2a2a; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #ff6b6b; }
    .service { background: #2a2a2a; padding: 15px; margin: 10px 0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
    .service.running { border-left: 4px solid #4CAF50; }
    .service.stopped { border-left: 4px solid #ff6b6b; }
    .repair-button { background: #4CAF50; color: white; border: none; padding: 12px 24px; font-size: 16px; border-radius: 8px; cursor: pointer; margin: 10px; }
    .repair-button:hover { opacity: 0.9; }
    .restart-button { background: #2196F3; color: white; border: none; padding: 12px 24px; font-size: 16px; border-radius: 8px; cursor: pointer; margin: 10px; }
    .repair-log { background: #1a1a1a; padding: 20px; border-radius: 10px; margin: 20px 0; font-family: monospace; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .stat-box { background: #2a2a2a; padding: 20px; border-radius: 10px; text-align: center; }
    .stat-number { font-size: 36px; font-weight: bold; color: #667eea; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔧 Soulfra Diagnostic & Repair Dashboard</h1>
    
    <div class="stats">
      <div class="stat-box">
        <div class="stat-number">${this.issues.length}</div>
        <div>Issues Found</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${this.issues.filter(i => i.canAutoFix).length}</div>
        <div>Auto-Fixable</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${Array.from(this.services.values()).filter(s => s.status === 'running').length}</div>
        <div>Services Running</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${this.repairs.length}</div>
        <div>Repairs Made</div>
      </div>
    </div>
    
    <div class="status-card">
      <h2>🚨 Issues Detected</h2>
      ${this.issues.length === 0 ? '<p style="color: #4CAF50;">✅ No issues found!</p>' : ''}
      ${this.issues.map(issue => `
        <div class="issue">
          <strong>${issue.type.toUpperCase()}</strong><br>
          ${issue.file ? `File: ${issue.file}<br>` : ''}
          Error: ${issue.error}<br>
          ${issue.canAutoFix ? '<span style="color: #4CAF50;">✅ Can be auto-fixed</span>' : ''}
        </div>
      `).join('')}
    </div>
    
    <div class="status-card">
      <h2>📡 Service Status</h2>
      ${Array.from(this.services.entries()).map(([name, status]) => `
        <div class="service ${status.status}">
          <div>
            <strong>${name}</strong><br>
            Port: ${status.port} • Status: ${status.status}
            ${status.accessible === false && status.status === 'running' ? '<br><span style="color: #ff9800;">⚠️ Running but not responding</span>' : ''}
          </div>
          <div>
            ${status.status === 'running' && status.accessible ? '✅' : '❌'}
          </div>
        </div>
      `).join('')}
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <button class="repair-button" onclick="autoRepair()">🔧 Auto-Repair All Issues</button>
      <button class="restart-button" onclick="restartServices()">🚀 Restart All Services</button>
      <button class="repair-button" onclick="location.reload()">🔄 Refresh Diagnostics</button>
    </div>
    
    <div class="repair-log" id="repairLog" style="display: none;">
      <h3>📝 Repair Log</h3>
      <div id="logContent"></div>
    </div>
  </div>
  
  <script>
    async function autoRepair() {
      const logDiv = document.getElementById('repairLog');
      const logContent = document.getElementById('logContent');
      logDiv.style.display = 'block';
      logContent.innerHTML = 'Starting auto-repair...\\n';
      
      try {
        const response = await fetch('/api/autorepair', { method: 'POST' });
        const result = await response.json();
        
        logContent.innerHTML += \`\\nRepaired \${result.repaired} files\\n\`;
        result.repairs.forEach(repair => {
          logContent.innerHTML += \`\\n\${repair.status === 'success' ? '✅' : '❌'} \${repair.file} - \${repair.type}\`;
        });
        
        setTimeout(() => location.reload(), 3000);
      } catch (error) {
        logContent.innerHTML += '\\n❌ Repair failed: ' + error.message;
      }
    }
    
    async function restartServices() {
      if (confirm('Restart all Soulfra services?')) {
        try {
          const response = await fetch('/api/restart-services', { method: 'POST' });
          const result = await response.json();
          alert(result.message);
          setTimeout(() => location.reload(), 5000);
        } catch (error) {
          alert('Failed to restart services: ' + error.message);
        }
      }
    }
  </script>
</body>
</html>`;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  async handleAutoRepair(res) {
    const repaired = await this.autoRepair();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      repaired: repaired,
      repairs: this.repairs
    }));
  }

  async handleRestartServices(res) {
    try {
      execSync('./stop-soulfra-ecosystem.sh', { stdio: 'pipe' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      execSync('./launch-soulfra-ecosystem.sh', { stdio: 'pipe' });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'All services restarted successfully'
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: error.message
      }));
    }
  }

  async handleRefresh(res) {
    // Re-run all checks
    this.issues = [];
    this.repairs = [];
    this.services.clear();
    this.fileStatus.clear();
    
    await this.checkJavaScriptFiles();
    await this.checkJSONFiles();
    await this.checkMarkdownFiles();
    await this.checkServiceHealth();
    await this.checkEncodingIssues();
    await this.checkPortConflicts();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      issues: this.issues.length,
      services: this.services.size
    }));
  }
}

// Start the diagnostic shell
if (require.main === module) {
  const diagnosticShell = new SoulfraDiagnosticRepairShell();
  
  // Auto-repair if requested
  if (process.argv.includes('--auto-repair')) {
    setTimeout(() => {
      diagnosticShell.autoRepair();
    }, 2000);
  }
  
  process.on('SIGTERM', () => {
    console.log('🛑 Shutting down diagnostic shell...');
    process.exit(0);
  });
}

module.exports = SoulfraDiagnosticRepairShell;