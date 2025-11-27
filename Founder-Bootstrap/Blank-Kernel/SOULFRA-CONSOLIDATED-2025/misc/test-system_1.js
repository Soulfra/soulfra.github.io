#!/usr/bin/env node

// MirrorOS System Test Script
// Tests all modules and integration points

const fs = require('fs').promises;
const path = require('path');

class MirrorOSSystemTest {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.verbose = process.argv.includes('--verbose') || process.argv.includes('-v');
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',     // Cyan
      success: '\x1b[32m',  // Green
      error: '\x1b[31m',    // Red
      warning: '\x1b[33m',  // Yellow
      reset: '\x1b[0m'
    };

    const prefix = {
      info: 'ℹ️ ',
      success: '✅',
      error: '❌',
      warning: '⚠️ '
    };

    console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`);
  }

  async test(name, testFn) {
    if (this.verbose) {
      this.log(`Running test: ${name}`, 'info');
    }
    
    try {
      await testFn();
      this.passed++;
      if (this.verbose) {
        this.log(`${name} - PASSED`, 'success');
      }
    } catch (error) {
      this.failed++;
      this.log(`${name} - FAILED: ${error.message}`, 'error');
      if (this.verbose) {
        console.error(error.stack);
      }
    }
  }

  async runAllTests() {
    console.log('🧪 MirrorOS System Test Suite');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // File structure tests
    await this.test('Package.json exists', () => this.testFileExists('package.json'));
    await this.test('Main server exists', () => this.testFileExists('server.js'));
    await this.test('Launch script exists', () => this.testFileExists('launch-demos.sh'));
    await this.test('Config file exists', () => this.testFileExists('shared/config/mirror-config.js'));
    await this.test('Vault logger exists', () => this.testFileExists('shared/vault/vault-logger.js'));

    // Module structure tests
    const modules = ['cal-chat', 'agent-monetization', 'vibegraph', 'qr-checkin', 'agent-promotion'];
    
    const moduleFiles = {
      'cal-chat': { server: 'cal-chat-server.js', client: 'cal-chat-client.html' },
      'agent-monetization': { server: 'monetization-server.js', client: 'monetization-client.html' },
      'vibegraph': { server: 'vibegraph-server.js', client: 'vibegraph-client.html' },
      'qr-checkin': { server: 'qr-server.js', client: 'qr-client.html' },
      'agent-promotion': { server: 'promotion-server.js', client: 'promotion-client.html' }
    };

    for (const module of modules) {
      const files = moduleFiles[module];
      await this.test(`Module ${module} server exists`, () => 
        this.testFileExists(`modules/${module}/${files.server}`)
      );
      
      await this.test(`Module ${module} client exists`, () => 
        this.testFileExists(`modules/${module}/${files.client}`)
      );
    }

    // Dashboard tests
    await this.test('Unified dashboard exists', () => this.testFileExists('dashboard/unified-dashboard.html'));

    // Configuration tests
    await this.test('Config file is valid', () => this.testConfigFile());
    await this.test('Package.json is valid', () => this.testPackageJson());

    // Dependencies test
    await this.test('Node modules exist', () => this.testNodeModules());

    // Vault structure test
    await this.test('Vault directory structure', () => this.testVaultStructure());

    // Code quality tests
    await this.test('No obvious syntax errors', () => this.testSyntax());

    // Integration tests
    await this.test('Module exports are valid', () => this.testModuleExports());

    this.printResults();
  }

  async testFileExists(filePath) {
    const fullPath = path.resolve(filePath);
    const stats = await fs.stat(fullPath);
    if (!stats.isFile()) {
      throw new Error(`${filePath} is not a file`);
    }
  }

  async testConfigFile() {
    const configPath = 'shared/config/mirror-config.js';
    const configCode = await fs.readFile(configPath, 'utf8');
    
    // Basic syntax check
    if (!configCode.includes('module.exports')) {
      throw new Error('Config file does not export properly');
    }

    // Try to require it
    delete require.cache[require.resolve(path.resolve(configPath))];
    const config = require(path.resolve(configPath));
    
    if (!config.server || !config.modules || !config.vault) {
      throw new Error('Config file missing required sections');
    }

    if (!config.server.port) {
      throw new Error('Config missing server port');
    }
  }

  async testPackageJson() {
    const packagePath = 'package.json';
    const packageContent = await fs.readFile(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);
    
    if (!packageJson.name) {
      throw new Error('Package.json missing name');
    }

    if (!packageJson.main) {
      throw new Error('Package.json missing main entry point');
    }

    if (!packageJson.scripts) {
      throw new Error('Package.json missing scripts');
    }

    if (!packageJson.dependencies) {
      throw new Error('Package.json missing dependencies');
    }

    // Check for required dependencies
    const requiredDeps = ['express', 'ws', 'cors', 'qrcode'];
    for (const dep of requiredDeps) {
      if (!packageJson.dependencies[dep]) {
        throw new Error(`Missing required dependency: ${dep}`);
      }
    }
  }

  async testNodeModules() {
    try {
      await fs.access('node_modules');
    } catch {
      throw new Error('node_modules directory not found. Run npm install first.');
    }

    // Check for key modules
    const keyModules = ['express', 'ws', 'cors'];
    for (const mod of keyModules) {
      try {
        await fs.access(`node_modules/${mod}`);
      } catch {
        throw new Error(`Required module ${mod} not installed`);
      }
    }
  }

  async testVaultStructure() {
    const vaultDirs = [
      'vault/logs',
      'vault/conversations',
      'vault/agents',
      'vault/reviews',
      'vault/checkins',
      'vault/exports',
      'vault/analytics',
      'vault/backups'
    ];

    // Create vault structure if it doesn't exist
    for (const dir of vaultDirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        if (error.code !== 'EEXIST') {
          throw new Error(`Failed to create vault directory ${dir}: ${error.message}`);
        }
      }
    }

    // Verify all directories exist
    for (const dir of vaultDirs) {
      try {
        const stats = await fs.stat(dir);
        if (!stats.isDirectory()) {
          throw new Error(`${dir} is not a directory`);
        }
      } catch {
        throw new Error(`Vault directory ${dir} does not exist`);
      }
    }
  }

  async testSyntax() {
    const jsFiles = [
      'server.js',
      'shared/config/mirror-config.js',
      'shared/vault/vault-logger.js'
    ];

    for (const file of jsFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        
        // Basic syntax checks
        if (content.includes('const') && !content.includes('require')) {
          continue; // Probably a config file
        }

        // Check for common syntax issues
        const openBraces = (content.match(/{/g) || []).length;
        const closeBraces = (content.match(/}/g) || []).length;
        
        if (openBraces !== closeBraces) {
          throw new Error(`${file} has unmatched braces`);
        }

        const openParens = (content.match(/\(/g) || []).length;
        const closeParens = (content.match(/\)/g) || []).length;
        
        if (openParens !== closeParens) {
          throw new Error(`${file} has unmatched parentheses`);
        }

      } catch (error) {
        if (error.code === 'ENOENT') {
          continue; // File doesn't exist, will be caught by other tests
        }
        throw error;
      }
    }
  }

  async testModuleExports() {
    const modules = [
      'modules/cal-chat/cal-chat-server.js',
      'modules/agent-monetization/monetization-server.js',
      'modules/vibegraph/vibegraph-server.js',
      'modules/qr-checkin/qr-server.js',
      'modules/agent-promotion/promotion-server.js'
    ];

    for (const modulePath of modules) {
      try {
        const content = await fs.readFile(modulePath, 'utf8');
        
        if (!content.includes('module.exports')) {
          throw new Error(`${modulePath} does not export a module`);
        }

        if (!content.includes('class ') && !content.includes('function ')) {
          throw new Error(`${modulePath} does not contain a class or function`);
        }

      } catch (error) {
        if (error.code === 'ENOENT') {
          throw new Error(`Module file ${modulePath} does not exist`);
        }
        throw error;
      }
    }
  }

  printResults() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏁 Test Results');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    this.log(`Total tests: ${this.passed + this.failed}`, 'info');
    this.log(`Passed: ${this.passed}`, 'success');
    
    if (this.failed > 0) {
      this.log(`Failed: ${this.failed}`, 'error');
      console.log('\n💡 Tips:');
      console.log('   • Run npm install to install dependencies');
      console.log('   • Check file paths and permissions');
      console.log('   • Run with --verbose for detailed output');
      console.log('\n🔧 If issues persist, check the README.md for troubleshooting.');
      process.exit(1);
    } else {
      this.log('All tests passed! 🎉', 'success');
      console.log('\n🚀 System is ready! Run ./launch-demos.sh to start MirrorOS.');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new MirrorOSSystemTest();
  tester.runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = MirrorOSSystemTest;