#!/usr/bin/env node
/**
 * Drop Watcher
 *
 * Watches /drops folder for new projects and auto-deploys them
 * Like localhost.run but for your own platform
 *
 * Flow:
 * 1. Detect new folder in /drops
 * 2. Charge user tokens
 * 3. Analyze code with Ollama
 * 4. Deploy to drops.soulfra.com/projectname
 * 5. Post to social feed
 *
 * Usage:
 *   node api/drop-watcher.js
 *   (runs as background service)
 */

const fs = require('fs');
const path = require('path');
const { deploymentAgent } = require('../utils/deploymentAgent');
const TokenEconomy = require('./token-economy');
const DomainRouter = require('./domain-router');

class DropWatcher {
  constructor(options = {}) {
    // Support multiple watch paths
    this.dropsPaths = options.dropsPaths || [
      path.join(__dirname, '../drops'), // Project drops folder
      path.join(process.env.HOME, 'Public/Drop Box') // macOS Drop Box
    ];
    this.dataPath = path.join(__dirname, '../data');
    this.watchInterval = options.watchInterval || 5000; // Check every 5 seconds
    this.deployedDropsPath = path.join(this.dataPath, 'deployed-drops.json');
    this.defaultUserId = options.defaultUserId || 'default@soulfra.com';

    // Initialize token economy
    this.economy = new TokenEconomy();

    // Initialize domain router
    this.domainRouter = new DomainRouter();

    // Track deployed drops to avoid re-deploying
    this.deployedDrops = this.loadDeployedDrops();

    // Watch state
    this.watching = false;
    this.watcher = null;

    this.initialize();

    console.log('📂 DropWatcher initialized');
    console.log(`   Watching ${this.dropsPaths.length} locations:`);
    this.dropsPaths.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p}`);
    });
    console.log(`   Default user: ${this.defaultUserId}`);
  }

  /**
   * Initialize data directory and files
   */
  initialize() {
    // Create data directory
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }

    // Create deployed-drops.json if doesn't exist
    if (!fs.existsSync(this.deployedDropsPath)) {
      this.saveDeployedDrops();
    }
  }

  /**
   * Load list of already-deployed drops
   */
  loadDeployedDrops() {
    try {
      if (fs.existsSync(this.deployedDropsPath)) {
        const data = fs.readFileSync(this.deployedDropsPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('⚠️ Could not load deployed drops:', error.message);
    }

    return {
      drops: [],
      lastCheck: null
    };
  }

  /**
   * Save deployed drops list
   */
  saveDeployedDrops() {
    try {
      fs.writeFileSync(
        this.deployedDropsPath,
        JSON.stringify(this.deployedDrops, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('❌ Failed to save deployed drops:', error.message);
    }
  }

  /**
   * Start watching /drops folder
   */
  start() {
    if (this.watching) {
      console.log('⚠️ Already watching');
      return;
    }

    this.watching = true;
    console.log('👁️  Started watching /drops folder');
    console.log(`   Checking every ${this.watchInterval}ms`);

    // Initial scan
    this.scanDrops();

    // Set up interval
    this.watcher = setInterval(() => {
      this.scanDrops();
    }, this.watchInterval);
  }

  /**
   * Stop watching
   */
  stop() {
    if (!this.watching) {
      return;
    }

    this.watching = false;

    if (this.watcher) {
      clearInterval(this.watcher);
      this.watcher = null;
    }

    console.log('⏹️  Stopped watching');
  }

  /**
   * Scan drops folders for new projects
   */
  async scanDrops() {
    try {
      // Scan all watch paths
      for (const dropsPath of this.dropsPaths) {
        if (!fs.existsSync(dropsPath)) {
          continue;
        }

        const entries = fs.readdirSync(dropsPath, { withFileTypes: true });
        const folders = entries.filter(entry => entry.isDirectory());

        for (const folder of folders) {
          const dropName = folder.name;

          // Skip hidden folders and node_modules
          if (dropName.startsWith('.') || dropName === 'node_modules') {
            continue;
          }

          // Check if already deployed
          if (this.isDeployed(dropName)) {
            continue;
          }

          // New drop detected!
          const fullPath = path.join(dropsPath, dropName);
          const source = dropsPath.includes('Drop Box') ? '📱 AirDrop/Drop Box' : '💻 Local';
          console.log(`\n🆕 New drop detected: ${dropName} (from ${source})`);
          await this.handleNewDrop(dropName, fullPath);
        }
      }

      this.deployedDrops.lastCheck = new Date().toISOString();
      this.saveDeployedDrops();

    } catch (error) {
      console.error('❌ Error scanning drops:', error.message);
    }
  }

  /**
   * Check if drop is already deployed
   */
  isDeployed(dropName) {
    return this.deployedDrops.drops.some(drop => drop.name === dropName);
  }

  /**
   * Handle new drop - deploy and track
   */
  async handleNewDrop(dropName, sourcePath) {
    const dropPath = sourcePath;

    // If source is Drop Box, copy to project drops folder first
    const projectDropsPath = path.join(__dirname, '../drops');
    const targetPath = path.join(projectDropsPath, dropName);

    if (sourcePath.includes('Drop Box')) {
      console.log(`📋 Copying from Drop Box to project drops...`);
      if (!fs.existsSync(projectDropsPath)) {
        fs.mkdirSync(projectDropsPath, { recursive: true });
      }
      fs.cpSync(sourcePath, targetPath, { recursive: true });
      console.log(`   ✅ Copied to drops/${dropName}`);
    }

    // Get drop metadata
    const metadata = this.analyzeDropStructure(dropPath);

    console.log(`📊 Analyzing drop structure...`);
    console.log(`   Files: ${metadata.fileCount}`);
    console.log(`   Type: ${metadata.type}`);

    // Check token balance (Phase 2 - for now, allow free deploys)
    const tokenCost = 10;
    const hasTokens = await this.checkTokenBalance(tokenCost);

    if (!hasTokens) {
      console.log(`❌ Insufficient tokens (need ${tokenCost})`);
      return;
    }

    // Deploy the drop
    console.log(`🚀 Deploying ${dropName}...`);

    try {
      const zipPath = await deploymentAgent(dropName, true);

      // Assign domain via DomainRouter
      const domainAssignment = this.domainRouter.assignDomain(
        dropName,
        this.defaultUserId,
        { metadata }
      );

      // Record deployment
      const deployment = {
        name: dropName,
        deployedAt: new Date().toISOString(),
        url: domainAssignment.url,
        metadata,
        tokenCost,
        status: 'deployed',
        domainAssignment
      };

      this.deployedDrops.drops.push(deployment);
      this.saveDeployedDrops();

      console.log(`✅ Deployed successfully!`);
      console.log(`   URL: ${deployment.url}`);
      console.log(`   Cost: ${tokenCost} tokens`);

      // Analyze with Ollama (Phase 1.5)
      // await this.analyzeWithOllama(dropName, dropPath);

      // Post to social feed (Phase 2)
      // await this.postToFeed(deployment);

    } catch (error) {
      console.error(`❌ Deployment failed:`, error.message);
    }
  }

  /**
   * Analyze drop structure
   */
  analyzeDropStructure(dropPath) {
    const files = this.getFilesRecursive(dropPath);

    const hasHTML = files.some(f => f.endsWith('.html'));
    const hasJS = files.some(f => f.endsWith('.js'));
    const hasCSS = files.some(f => f.endsWith('.css'));
    const hasReact = files.some(f => f.includes('react') || f.endsWith('.jsx'));
    const hasPackageJson = files.some(f => f.endsWith('package.json'));

    let type = 'unknown';

    if (hasReact || hasPackageJson) {
      type = 'app';
    } else if (hasHTML) {
      type = 'website';
    } else if (hasJS && !hasHTML) {
      type = 'script';
    }

    return {
      fileCount: files.length,
      hasHTML,
      hasJS,
      hasCSS,
      hasReact,
      hasPackageJson,
      type
    };
  }

  /**
   * Get all files recursively
   */
  getFilesRecursive(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
      const filePath = path.join(dirPath, file);

      if (fs.statSync(filePath).isDirectory()) {
        if (!file.startsWith('.') && file !== 'node_modules') {
          arrayOfFiles = this.getFilesRecursive(filePath, arrayOfFiles);
        }
      } else {
        arrayOfFiles.push(filePath);
      }
    });

    return arrayOfFiles;
  }

  /**
   * Check token balance and charge if sufficient
   */
  async checkTokenBalance(cost, userId = null) {
    const user = userId || this.defaultUserId;

    // Check balance
    const hasTokens = this.economy.hasBalance(user, cost);

    if (hasTokens) {
      // Charge the tokens
      try {
        this.economy.chargeDeploy(user);
        return true;
      } catch (error) {
        console.error(`❌ Failed to charge tokens:`, error.message);
        return false;
      }
    }

    return false;
  }

  /**
   * Get deployment stats
   */
  getStats() {
    return {
      totalDeployments: this.deployedDrops.drops.length,
      lastCheck: this.deployedDrops.lastCheck,
      drops: this.deployedDrops.drops.map(drop => ({
        name: drop.name,
        deployedAt: drop.deployedAt,
        url: drop.url,
        type: drop.metadata.type
      }))
    };
  }

  /**
   * Get specific drop info
   */
  getDrop(dropName) {
    return this.deployedDrops.drops.find(drop => drop.name === dropName);
  }

  /**
   * Manually trigger deployment
   */
  async deployDrop(dropName) {
    if (this.isDeployed(dropName)) {
      console.log(`⚠️ ${dropName} already deployed`);
      return this.getDrop(dropName);
    }

    // Search for drop in all watch paths
    let dropPath = null;
    for (const basePath of this.dropsPaths) {
      const testPath = path.join(basePath, dropName);
      if (fs.existsSync(testPath)) {
        dropPath = testPath;
        break;
      }
    }

    if (!dropPath) {
      throw new Error(`Drop not found: ${dropName}`);
    }

    await this.handleNewDrop(dropName, dropPath);
    return this.getDrop(dropName);
  }
}

// CLI Mode
if (require.main === module) {
  const watcher = new DropWatcher();

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║       📂 Drop Watcher - Auto-Deploy Service               ║');
  console.log('║                                                            ║');
  console.log('║  Drop any folder into /drops and it auto-deploys!         ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  watcher.start();

  // Show stats every minute
  setInterval(() => {
    const stats = watcher.getStats();
    console.log(`\n📊 Stats: ${stats.totalDeployments} deployments | Last check: ${stats.lastCheck}`);
  }, 60000);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down...');
    watcher.stop();
    process.exit(0);
  });
}

module.exports = DropWatcher;
