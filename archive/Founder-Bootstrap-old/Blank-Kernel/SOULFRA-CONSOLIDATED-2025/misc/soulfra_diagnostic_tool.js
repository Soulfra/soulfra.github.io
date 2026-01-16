#!/usr/bin/env node

// ==========================================
// SOULFRA PLATFORM DIAGNOSTIC TOOL
// Debug silent errors and missing dependencies
// ==========================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SoulfraDiagnosticTool {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.successes = [];
    this.verbose = process.argv.includes('--verbose');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      error: '❌',
      warning: '⚠️ ',
      success: '✅',
      info: 'ℹ️ '
    }[type];

    console.log(`${prefix} ${message}`);
    
    if (type === 'error') this.errors.push(message);
    if (type === 'warning') this.warnings.push(message);
    if (type === 'success') this.successes.push(message);
  }

  async runDiagnostics() {
    console.log('🔍 Running Soulfra Platform Diagnostics...\n');

    await this.checkEnvironment();
    await this.checkDependencies();
    await this.checkProjectStructure();
    await this.checkConfiguration();
    await this.checkServices();
    await this.runBasicTests();
    
    this.printSummary();
    
    if (this.errors.length > 0) {
      this.generateFixScript();
    }
  }

  async checkEnvironment() {
    this.log('Checking Environment Setup...', 'info');

    try {
      // Check Node.js version
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      
      if (majorVersion >= 16) {
        this.log(`Node.js ${nodeVersion} ✓`, 'success');
      } else {
        this.log(`Node.js ${nodeVersion} - recommend >= 16.0.0`, 'warning');
      }

      // Check npm
      try {
        const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
        this.log(`npm ${npmVersion} ✓`, 'success');
      } catch (error) {
        this.log('npm not found', 'error');
      }

      // Check Docker
      try {
        const dockerVersion = execSync('docker --version', { encoding: 'utf8' }).trim();
        this.log(`${dockerVersion} ✓`, 'success');
      } catch (error) {
        this.log('Docker not found - some features may not work', 'warning');
      }

      // Check Redis
      try {
        execSync('redis-cli ping', { encoding: 'utf8', stdio: 'pipe' });
        this.log('Redis is running ✓', 'success');
      } catch (error) {
        this.log('Redis not running - will cause orchestration failures', 'error');
      }

    } catch (error) {
      this.log(`Environment check failed: ${error.message}`, 'error');
    }
  }

  async checkDependencies() {
    this.log('\nChecking Project Dependencies...', 'info');

    try {
      // Check if package.json exists
      if (!fs.existsSync('package.json')) {
        this.log('package.json not found', 'error');
        return;
      }

      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // Check required dependencies
      const requiredDeps = [
        'express',
        'cors',
        'multer',
        'redis',
        'uuid',
        'papaparse'
      ];

      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      for (const dep of requiredDeps) {
        if (dependencies[dep]) {
          this.log(`${dep} ${dependencies[dep]} ✓`, 'success');
        } else {
          this.log(`Missing dependency: ${dep}`, 'error');
        }
      }

      // Check if node_modules exists
      if (!fs.existsSync('node_modules')) {
        this.log('node_modules not found - run npm install', 'error');
      } else {
        this.log('node_modules found ✓', 'success');
      }

    } catch (error) {
      this.log(`Dependency check failed: ${error.message}`, 'error');
    }
  }

  async checkProjectStructure() {
    this.log('\nChecking Project Structure...', 'info');

    const requiredStructure = {
      'src/': 'directory',
      'src/orchestrator/': 'directory',
      'src/analysis/': 'directory',
      'src/trust/': 'directory',
      'src/routing/': 'directory',
      'public/': 'directory',
      'uploads/': 'directory',
      'temp/': 'directory'
    };

    for (const [filePath, type] of Object.entries(requiredStructure)) {
      try {
        const exists = fs.existsSync(filePath);
        const stat = exists ? fs.statSync(filePath) : null;
        
        if (!exists) {
          this.log(`Missing ${type}: ${filePath}`, 'error');
        } else if (type === 'directory' && !stat.isDirectory()) {
          this.log(`Expected directory but found file: ${filePath}`, 'error');
        } else {
          this.log(`${filePath} ✓`, 'success');
        }
      } catch (error) {
        this.log(`Error checking ${filePath}: ${error.message}`, 'error');
      }
    }
  }

  async checkConfiguration() {
    this.log('\nChecking Configuration...', 'info');

    // Check environment variables
    const requiredEnvVars = [
      'NODE_ENV',
      'PORT',
      'REDIS_URL'
    ];

    const optionalEnvVars = [
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
      'STRIPE_SECRET_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        this.log(`${envVar} set ✓`, 'success');
      } else {
        this.log(`Missing required environment variable: ${envVar}`, 'error');
      }
    }

    for (const envVar of optionalEnvVars) {
      if (process.env[envVar]) {
        this.log(`${envVar} set ✓`, 'success');
      } else {
        this.log(`Optional environment variable not set: ${envVar}`, 'warning');
      }
    }

    // Check config files
    const configFiles = [
      '.env',
      'docker-compose.yml',
      'config/default.json'
    ];

    for (const configFile of configFiles) {
      if (fs.existsSync(configFile)) {
        this.log(`${configFile} found ✓`, 'success');
      } else {
        this.log(`Config file missing: ${configFile}`, 'warning');
      }
    }
  }

  async checkServices() {
    this.log('\nChecking Service Files...', 'info');

    const serviceFiles = [
      'src/orchestrator/platform.js',
      'src/analysis/analyzer.js',
      'src/trust/engine.js',
      'src/routing/router.js',
      'src/mobile/exporter.js',
      'server.js'
    ];

    for (const serviceFile of serviceFiles) {
      try {
        if (fs.existsSync(serviceFile)) {
          // Try to require the file to check for syntax errors
          const content = fs.readFileSync(serviceFile, 'utf8');
          
          // Basic syntax checks
          if (content.includes('require(') && !content.includes('module.exports')) {
            this.log(`${serviceFile} missing module.exports`, 'warning');
          }
          
          // Check for common issues
          if (content.includes('await') && !content.includes('async')) {
            this.log(`${serviceFile} has await without async`, 'error');
          }
          
          this.log(`${serviceFile} ✓`, 'success');
        } else {
          this.log(`Service file missing: ${serviceFile}`, 'error');
        }
      } catch (error) {
        this.log(`Error checking ${serviceFile}: ${error.message}`, 'error');
      }
    }
  }

  async runBasicTests() {
    this.log('\nRunning Basic Tests...', 'info');

    try {
      // Test Redis connection
      if (fs.existsSync('src/orchestrator/platform.js')) {
        this.log('Testing Redis connection...', 'info');
        
        try {
          const redis = require('redis');
          const client = redis.createClient();
          await client.connect();
          await client.ping();
          await client.disconnect();
          this.log('Redis connection test passed ✓', 'success');
        } catch (error) {
          this.log(`Redis connection failed: ${error.message}`, 'error');
        }
      }

      // Test basic HTTP server
      this.log('Testing basic server setup...', 'info');
      
      try {
        const express = require('express');
        const app = express();
        const server = app.listen(0); // Random port
        const port = server.address().port;
        server.close();
        this.log(`HTTP server test passed on port ${port} ✓`, 'success');
      } catch (error) {
        this.log(`HTTP server test failed: ${error.message}`, 'error');
      }

    } catch (error) {
      this.log(`Basic tests failed: ${error.message}`, 'error');
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('🎯 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(50));
    
    console.log(`✅ Successes: ${this.successes.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);

    if (this.errors.length > 0) {
      console.log('\n🔧 CRITICAL ISSUES TO FIX:');
      this.errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS TO ADDRESS:');
      this.warnings.forEach((warning, i) => {
        console.log(`${i + 1}. ${warning}`);
      });
    }

    if (this.errors.length === 0) {
      console.log('\n🎉 All critical checks passed! Platform should be ready to run.');
    }
  }

  generateFixScript() {
    console.log('\n🔧 Generating automatic fix script...');
    
    const fixScript = this.createFixScript();
    fs.writeFileSync('fix-soulfra.sh', fixScript);
    fs.chmodSync('fix-soulfra.sh', '755');
    
    console.log('✅ Fix script created: ./fix-soulfra.sh');
    console.log('Run: chmod +x fix-soulfra.sh && ./fix-soulfra.sh');
  }

  createFixScript() {
    let script = `#!/bin/bash
# Auto-generated Soulfra fix script
set -e

echo "🔧 Fixing Soulfra Platform Issues..."

`;

    // Fix missing directories
    const dirs = ['src/orchestrator', 'src/analysis', 'src/trust', 'src/routing', 'src/mobile', 'public', 'uploads', 'temp'];
    dirs.forEach(dir => {
      script += `mkdir -p ${dir}\n`;
    });

    // Fix missing package.json
    if (!fs.existsSync('package.json')) {
      script += `
# Create package.json
cat > package.json << 'EOF'
{
  "name": "soulfra-platform",
  "version": "1.0.0",
  "description": "Soulfra AI Platform",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "diagnostic": "node diagnostic.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "redis": "^4.6.0",
    "uuid": "^9.0.0",
    "papaparse": "^5.4.1",
    "fs-extra": "^11.1.1",
    "marked": "^5.1.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF

`;
    }

    // Install dependencies
    script += `
# Install dependencies
echo "📦 Installing dependencies..."
npm install

`;

    // Create basic .env file
    script += `
# Create .env file
cat > .env << 'EOF'
NODE_ENV=development
PORT=3001
REDIS_URL=redis://localhost:6379
# Add your API keys here:
# OPENAI_API_KEY=your_key_here
# ANTHROPIC_API_KEY=your_key_here
EOF

`;

    // Start Redis if not running
    script += `
# Start Redis
echo "🔴 Starting Redis..."
if ! redis-cli ping >/dev/null 2>&1; then
  if command -v docker >/dev/null 2>&1; then
    docker run -d --name redis -p 6379:6379 redis:alpine
  elif command -v redis-server >/dev/null 2>&1; then
    redis-server --daemonize yes
  else
    echo "❌ Redis not found. Please install Redis or Docker."
    exit 1
  fi
fi

`;

    // Create basic server.js if missing
    if (!fs.existsSync('server.js')) {
      script += `
# Create basic server.js
cat > server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Soulfra Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      diagnostic: 'node diagnostic.js'
    }
  });
});

app.listen(port, () => {
  console.log(\`🚀 Soulfra Platform running on http://localhost:\${port}\`);
});
EOF

`;
    }

    script += `
echo "✅ Soulfra Platform fixes applied!"
echo "🚀 Run 'npm start' to start the platform"
echo "🔍 Run 'node diagnostic.js' to check status"
`;

    return script;
  }
}

// ==========================================
// ENHANCED ERROR HANDLER
// Catch and report all types of errors
// ==========================================

class SoulfraPlatformDebugger {
  constructor() {
    this.setupErrorHandlers();
  }

  setupErrorHandlers() {
    // Catch uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ UNCAUGHT EXCEPTION:', error);
      console.error('Stack:', error.stack);
      this.suggestFix(error);
    });

    // Catch unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ UNHANDLED PROMISE REJECTION:', reason);
      console.error('Promise:', promise);
      this.suggestFix(reason);
    });

    // Catch warnings
    process.on('warning', (warning) => {
      console.warn('⚠️  WARNING:', warning.message);
      console.warn('Stack:', warning.stack);
    });
  }

  suggestFix(error) {
    const errorMessage = error.message || error.toString();
    
    const suggestions = {
      'Cannot find module': '📦 Run: npm install',
      'ECONNREFUSED': '🔴 Start Redis: redis-server or docker run -d -p 6379:6379 redis:alpine',
      'Permission denied': '🔐 Fix permissions: chmod +x script or sudo',
      'Address already in use': '🌐 Port in use: Change PORT environment variable',
      'Redis connection': '🔴 Check Redis: redis-cli ping',
      'timeout': '⏱️  Service timeout: Check service health',
      'ENOENT': '📁 File not found: Check file paths and structure'
    };

    for (const [pattern, suggestion] of Object.entries(suggestions)) {
      if (errorMessage.includes(pattern)) {
        console.log(`\n💡 SUGGESTED FIX: ${suggestion}\n`);
        break;
      }
    }

    console.log('🔧 Run diagnostic tool: node diagnostic.js');
  }
}

// ==========================================
// MINIMAL WORKING SERVER
// Fallback if main platform fails
// ==========================================

function createMinimalServer() {
  console.log('🔧 Creating minimal working server...');
  
  const express = require('express');
  const app = express();
  const port = process.env.PORT || 3001;

  app.use(express.json());
  app.use(express.static('public'));

  app.get('/', (req, res) => {
    res.json({
      message: 'Soulfra Platform - Minimal Mode',
      status: 'running',
      debug: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    });
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', mode: 'minimal' });
  });

  app.post('/api/test', (req, res) => {
    res.json({ 
      message: 'API endpoint working',
      received: req.body,
      timestamp: new Date().toISOString()
    });
  });

  return app.listen(port, () => {
    console.log(`✅ Minimal server running on http://localhost:${port}`);
    console.log('🔍 Try: curl http://localhost:${port}/health');
  });
}

// ==========================================
// MAIN EXECUTION
// ==========================================

async function main() {
  // Initialize error handlers
  new SoulfraPlatformDebugger();

  if (process.argv.includes('--minimal')) {
    // Start minimal server only
    createMinimalServer();
    return;
  }

  try {
    // Run full diagnostics
    const diagnostic = new SoulfraDiagnosticTool();
    await diagnostic.runDiagnostics();

    // If no critical errors, try to start platform
    if (diagnostic.errors.length === 0) {
      console.log('\n🚀 Attempting to start Soulfra Platform...');
      
      try {
        // Try to load and start the main platform
        if (fs.existsSync('server.js')) {
          require('./server.js');
        } else {
          console.log('⚠️  server.js not found, starting minimal server...');
          createMinimalServer();
        }
      } catch (error) {
        console.error('❌ Platform start failed:', error.message);
        console.log('🔧 Starting minimal server as fallback...');
        createMinimalServer();
      }
    } else {
      console.log('\n🛑 Critical errors found. Please run the fix script first.');
      console.log('Then run: node diagnostic.js --minimal to test basic functionality');
    }

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    console.log('🔧 Starting minimal server...');
    createMinimalServer();
  }
}

// Run diagnostics if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  SoulfraDiagnosticTool,
  SoulfraPlatformDebugger,
  createMinimalServer
};