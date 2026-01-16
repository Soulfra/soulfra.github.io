#!/usr/bin/env node
/**
 * User Account System with QR Code Authentication
 *
 * QR Code Workflow:
 * 1. User scans github.com/soulfra QR code
 * 2. Redirects to personalized upload page
 * 3. User records voice / uploads files
 * 4. System processes and publishes to user.soulfra.com
 * 5. User can customize CSS styling for their domain
 *
 * Features:
 * - QR code generation for user accounts
 * - User authentication via QR scan
 * - Custom domain assignment (username.soulfra.com)
 * - Personal CSS styling management
 * - Upload tracking and quota management
 *
 * Usage:
 *   const UserAccountSystem = require('./user-account-system');
 *   const accounts = new UserAccountSystem();
 *
 *   // Create new user account
 *   const user = await accounts.createUser('alice', {
 *     email: 'alice@example.com'
 *   });
 *
 *   // Generate QR code for user
 *   const qrCode = await accounts.generateQRCode(user.id);
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode'); // Note: requires npm install qrcode

class UserAccountSystem {
  constructor(options = {}) {
    this.baseURL = options.baseURL || 'http://localhost:8000';
    this.domain = options.domain || 'soulfra.com';

    // Storage paths
    this.dataDir = path.join(__dirname, '../data');
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.qrCodesDir = path.join(this.dataDir, 'qr-codes');
    this.stylesDir = path.join(this.dataDir, 'user-styles');

    // Initialize directories
    [this.dataDir, this.qrCodesDir, this.stylesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Load or initialize users database
    this.users = this.loadUsers();

    console.log('👤 UserAccountSystem initialized');
    console.log(`   Base URL: ${this.baseURL}`);
    console.log(`   Domain: ${this.domain}`);
    console.log(`   Users: ${Object.keys(this.users).length}`);
  }

  /**
   * Load users from disk
   */
  loadUsers() {
    if (fs.existsSync(this.usersFile)) {
      return JSON.parse(fs.readFileSync(this.usersFile, 'utf-8'));
    }
    return {};
  }

  /**
   * Save users to disk
   */
  saveUsers() {
    fs.writeFileSync(this.usersFile, JSON.stringify(this.users, null, 2));
  }

  /**
   * Create new user account
   */
  async createUser(username, options = {}) {
    console.log(`\n👤 Creating user account: ${username}`);

    // Validate username
    if (this.users[username]) {
      throw new Error(`Username already exists: ${username}`);
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      throw new Error('Username must contain only letters, numbers, dashes, and underscores');
    }

    // Generate user ID
    const userId = crypto.randomBytes(16).toString('hex');

    // Create user object
    const user = {
      id: userId,
      username,
      email: options.email || null,
      createdAt: new Date().toISOString(),

      // User settings
      settings: {
        customDomain: `${username}.${this.domain}`,
        defaultTheme: options.theme || 'default',
        allowPublicView: options.allowPublicView !== false,
        enableNotifications: options.enableNotifications !== false
      },

      // Usage tracking
      usage: {
        uploads: 0,
        deployments: 0,
        storageUsed: 0, // bytes
        tokensRemaining: 100 // Starting balance
      },

      // Projects
      projects: [],

      // QR code info
      qrCode: {
        url: null,
        path: null,
        generated: false
      },

      // Security
      security: {
        accessToken: crypto.randomBytes(32).toString('hex'),
        lastLogin: null,
        loginCount: 0
      }
    };

    // Save user
    this.users[username] = user;
    this.saveUsers();

    console.log(`   ✅ User created: ${username}`);
    console.log(`   🆔 User ID: ${userId}`);
    console.log(`   🌐 Domain: ${user.settings.customDomain}`);
    console.log(`   🔑 Access token: ${user.security.accessToken.substring(0, 16)}...`);

    return user;
  }

  /**
   * Generate QR code for user
   */
  async generateQRCode(username) {
    console.log(`\n📱 Generating QR code for: ${username}`);

    const user = this.users[username];
    if (!user) {
      throw new Error(`User not found: ${username}`);
    }

    // Create personalized upload URL with access token
    const uploadURL = `${this.baseURL}/upload?user=${username}&token=${user.security.accessToken}`;

    // QR code file path
    const qrFilename = `qr-${username}-${Date.now()}.png`;
    const qrPath = path.join(this.qrCodesDir, qrFilename);

    try {
      // Generate QR code image
      await QRCode.toFile(qrPath, uploadURL, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Update user record
      user.qrCode = {
        url: uploadURL,
        path: qrPath,
        filename: qrFilename,
        generated: true,
        generatedAt: new Date().toISOString()
      };

      this.saveUsers();

      console.log(`   ✅ QR code generated: ${qrFilename}`);
      console.log(`   🔗 URL: ${uploadURL}`);
      console.log(`   💾 Saved to: ${qrPath}`);

      return {
        url: uploadURL,
        path: qrPath,
        filename: qrFilename
      };
    } catch (error) {
      console.error(`   ❌ Failed to generate QR code: ${error.message}`);
      throw error;
    }
  }

  /**
   * Authenticate user via access token
   */
  authenticateUser(username, token) {
    const user = this.users[username];

    if (!user) {
      return { valid: false, reason: 'User not found' };
    }

    if (user.security.accessToken !== token) {
      return { valid: false, reason: 'Invalid access token' };
    }

    // Update login info
    user.security.lastLogin = new Date().toISOString();
    user.security.loginCount++;
    this.saveUsers();

    console.log(`✅ User authenticated: ${username}`);

    return { valid: true, user };
  }

  /**
   * Get or create user (for QR code flow)
   */
  async getOrCreateUser(username, options = {}) {
    if (this.users[username]) {
      return this.users[username];
    }

    return await this.createUser(username, options);
  }

  /**
   * Save custom CSS for user
   */
  saveUserStyle(username, cssContent) {
    console.log(`\n🎨 Saving custom style for: ${username}`);

    const user = this.users[username];
    if (!user) {
      throw new Error(`User not found: ${username}`);
    }

    const styleFilename = `${username}-custom.css`;
    const stylePath = path.join(this.stylesDir, styleFilename);

    fs.writeFileSync(stylePath, cssContent);

    // Update user record
    user.settings.customStylePath = stylePath;
    user.settings.customStyleUpdated = new Date().toISOString();
    this.saveUsers();

    console.log(`   ✅ Style saved: ${styleFilename}`);

    return stylePath;
  }

  /**
   * Get user's custom CSS
   */
  getUserStyle(username) {
    const user = this.users[username];
    if (!user || !user.settings.customStylePath) {
      return null;
    }

    if (fs.existsSync(user.settings.customStylePath)) {
      return fs.readFileSync(user.settings.customStylePath, 'utf-8');
    }

    return null;
  }

  /**
   * Track new project for user
   */
  addUserProject(username, projectInfo) {
    console.log(`\n📂 Adding project for user: ${username}`);

    const user = this.users[username];
    if (!user) {
      throw new Error(`User not found: ${username}`);
    }

    const project = {
      id: crypto.randomBytes(8).toString('hex'),
      name: projectInfo.name,
      type: projectInfo.type || 'unknown',
      url: projectInfo.url,
      createdAt: new Date().toISOString(),
      fileCount: projectInfo.fileCount || 0,
      size: projectInfo.size || 0,
      metadata: projectInfo.metadata || {}
    };

    user.projects.push(project);
    user.usage.deployments++;
    user.usage.storageUsed += project.size;

    this.saveUsers();

    console.log(`   ✅ Project added: ${project.name}`);
    console.log(`   🆔 Project ID: ${project.id}`);
    console.log(`   🌐 URL: ${project.url}`);

    return project;
  }

  /**
   * Get user statistics
   */
  getUserStats(username) {
    const user = this.users[username];
    if (!user) {
      throw new Error(`User not found: ${username}`);
    }

    return {
      username,
      userId: user.id,
      memberSince: user.createdAt,
      customDomain: user.settings.customDomain,

      // Usage stats
      totalProjects: user.projects.length,
      totalUploads: user.usage.uploads,
      totalDeployments: user.usage.deployments,
      storageUsed: this.formatBytes(user.usage.storageUsed),
      tokensRemaining: user.usage.tokensRemaining,

      // Activity
      lastLogin: user.security.lastLogin,
      loginCount: user.security.loginCount,

      // Recent projects
      recentProjects: user.projects
        .slice(-5)
        .reverse()
        .map(p => ({
          name: p.name,
          url: p.url,
          created: p.createdAt
        }))
    };
  }

  /**
   * List all users
   */
  listUsers() {
    return Object.keys(this.users).map(username => ({
      username,
      userId: this.users[username].id,
      email: this.users[username].email,
      domain: this.users[username].settings.customDomain,
      projects: this.users[username].projects.length,
      createdAt: this.users[username].createdAt
    }));
  }

  /**
   * Delete user account
   */
  deleteUser(username) {
    console.log(`\n🗑️ Deleting user: ${username}`);

    const user = this.users[username];
    if (!user) {
      throw new Error(`User not found: ${username}`);
    }

    // Delete QR code file
    if (user.qrCode.path && fs.existsSync(user.qrCode.path)) {
      fs.unlinkSync(user.qrCode.path);
      console.log(`   ✅ QR code deleted`);
    }

    // Delete custom style
    if (user.settings.customStylePath && fs.existsSync(user.settings.customStylePath)) {
      fs.unlinkSync(user.settings.customStylePath);
      console.log(`   ✅ Custom style deleted`);
    }

    // Remove from users database
    delete this.users[username];
    this.saveUsers();

    console.log(`   ✅ User deleted: ${username}`);
  }

  /**
   * Format bytes to human-readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Export user data (GDPR compliance)
   */
  exportUserData(username) {
    const user = this.users[username];
    if (!user) {
      throw new Error(`User not found: ${username}`);
    }

    // Redact sensitive info
    const exportData = {
      ...user,
      security: {
        ...user.security,
        accessToken: '[REDACTED]'
      }
    };

    const exportPath = path.join(this.dataDir, `user-export-${username}-${Date.now()}.json`);
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

    console.log(`📦 User data exported: ${exportPath}`);

    return exportPath;
  }
}

// CLI Mode
if (require.main === module) {
  const accounts = new UserAccountSystem();

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║       👤 User Account System - QR Code Auth              ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const command = process.argv[2];
  const username = process.argv[3];

  if (!command) {
    console.log('Usage:');
    console.log('  node user-account-system.js create <username> [email]');
    console.log('  node user-account-system.js qr <username>');
    console.log('  node user-account-system.js stats <username>');
    console.log('  node user-account-system.js list');
    console.log('  node user-account-system.js delete <username>');
    console.log('\nExamples:');
    console.log('  node user-account-system.js create alice alice@example.com');
    console.log('  node user-account-system.js qr alice');
    console.log('  node user-account-system.js stats alice');
    process.exit(0);
  }

  if (command === 'create' && username) {
    const email = process.argv[4] || null;
    accounts.createUser(username, { email })
      .then(user => {
        console.log('\n✅ Account created successfully!\n');
        console.log('Next steps:');
        console.log(`  1. Generate QR code: node user-account-system.js qr ${username}`);
        console.log(`  2. User scans QR code to access upload page`);
        console.log(`  3. User uploads files or records voice`);
        console.log(`  4. System auto-deploys to ${user.settings.customDomain}`);
      })
      .catch(error => {
        console.error('❌ Error:', error.message);
        process.exit(1);
      });
  } else if (command === 'qr' && username) {
    accounts.generateQRCode(username)
      .then(qr => {
        console.log('\n✅ QR code ready!\n');
        console.log('Share this QR code with the user to give them access.');
        console.log(`QR code image: ${qr.path}`);
      })
      .catch(error => {
        console.error('❌ Error:', error.message);
        process.exit(1);
      });
  } else if (command === 'stats' && username) {
    try {
      const stats = accounts.getUserStats(username);
      console.log('\n📊 User Statistics:\n');
      Object.entries(stats).forEach(([key, value]) => {
        if (key === 'recentProjects') {
          console.log(`\n📂 Recent Projects:`);
          value.forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.name}`);
            console.log(`      URL: ${p.url}`);
            console.log(`      Created: ${new Date(p.created).toLocaleString()}`);
          });
        } else {
          console.log(`   ${key}: ${value}`);
        }
      });
      console.log('');
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  } else if (command === 'list') {
    const users = accounts.listUsers();
    console.log(`\n👥 Total Users: ${users.length}\n`);
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.username} (${user.email || 'no email'})`);
      console.log(`   Domain: ${user.domain}`);
      console.log(`   Projects: ${user.projects}`);
      console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`);
      console.log('');
    });
  } else if (command === 'delete' && username) {
    try {
      accounts.deleteUser(username);
      console.log('\n✅ User account deleted successfully');
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  } else {
    console.error('❌ Invalid command or missing arguments');
    process.exit(1);
  }
}

module.exports = UserAccountSystem;
