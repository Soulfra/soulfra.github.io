/**
 * SOULFRA GITHUB AUTHENTICATION SYSTEM
 * 
 * Handles GitHub OAuth, UUID generation, user agreements,
 * and repository access management for Whisper Tombs platform.
 */

const { Octokit } = require('@octokit/rest');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

class SoulfraMembershipSystem {
  constructor(config) {
    this.github = new Octokit({
      auth: config.github.clientSecret
    });
    this.config = config;
    this.db = config.database;
  }

  /**
   * Step 1: GitHub OAuth Flow Initiation
   */
  async initiateGitHubAuth(req, res) {
    const state = crypto.randomBytes(32).toString('hex');
    const scopes = ['user:email', 'read:user'];
    
    // Store state for verification
    req.session.githubState = state;
    req.session.demoContext = req.query.demo_context; // From neural scan
    
    const authURL = `https://github.com/login/oauth/authorize?` +
      `client_id=${this.config.github.clientId}&` +
      `redirect_uri=${this.config.github.redirectUri}&` +
      `scope=${scopes.join('%20')}&` +
      `state=${state}`;
    
    res.redirect(authURL);
  }

  /**
   * Step 2: Handle GitHub OAuth Callback
   */
  async handleGitHubCallback(req, res) {
    const { code, state } = req.query;
    
    // Verify state parameter
    if (state !== req.session.githubState) {
      return res.status(400).json({ error: 'Invalid state parameter' });
    }
    
    try {
      // Exchange code for access token
      const tokenResponse = await this.exchangeCodeForToken(code);
      const { access_token } = tokenResponse;
      
      // Get user information from GitHub
      const githubUser = await this.getGitHubUserInfo(access_token);
      
      // Create or update user in database
      const user = await this.createOrUpdateUser(githubUser, access_token);
      
      // Generate session token
      const sessionToken = await this.generateSessionToken(user);
      
      // Redirect to agreement or dashboard
      if (user.agreement_accepted) {
        res.redirect(`/dashboard?token=${sessionToken}`);
      } else {
        res.redirect(`/agreement?token=${sessionToken}`);
      }
      
    } catch (error) {
      console.error('GitHub auth error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }

  /**
   * Step 3: User Agreement Flow
   */
  async presentUserAgreement(req, res) {
    const token = req.query.token;
    const user = await this.verifySessionToken(token);
    
    if (!user) {
      return res.redirect('/auth/github');
    }
    
    const agreementData = {
      user: {
        github_username: user.github_username,
        uuid: user.uuid,
        created_at: user.created_at
      },
      agreement: {
        version: '1.0',
        last_updated: '2025-06-17',
        key_points: [
          'Access to private Soulfra Whisper Tombs repository',
          'AI agent relationship data processing',
          'Neural scan data (optional, for personalization)',
          'Tomb unlock tracking and analytics',
          'Cross-platform synchronization capabilities'
        ],
        data_usage: {
          required: [
            'GitHub identity for repository access',
            'UUID for user identification',
            'Tomb unlock patterns for system improvement'
          ],
          optional: [
            'Neural scan results for agent personalization',
            'Usage analytics for platform optimization',
            'Behavioral patterns for enhanced AI relationships'
          ]
        },
        privacy_commitments: [
          'No data sharing with third parties',
          'Local-first processing when possible',
          'User controls data retention policies',
          'Full data export available on request'
        ]
      }
    };
    
    res.render('agreement', { agreementData, token });
  }

  /**
   * Step 4: Process Agreement Acceptance
   */
  async processAgreementAcceptance(req, res) {
    const { token, agreement_accepted, data_permissions } = req.body;
    const user = await this.verifySessionToken(token);
    
    if (!user || !agreement_accepted) {
      return res.status(400).json({ error: 'Agreement acceptance required' });
    }
    
    try {
      // Update user agreement status
      await this.db.User.update({
        agreement_accepted: true,
        agreement_version: '1.0',
        agreement_timestamp: new Date(),
        data_permissions: JSON.stringify(data_permissions),
        onboarding_completed: true
      }, {
        where: { uuid: user.uuid }
      });
      
      // Add user to private GitHub repository
      await this.addUserToPrivateRepo(user);
      
      // Create user's personal vault
      await this.initializeUserVault(user);
      
      // Link demo context if available
      if (req.session.demoContext) {
        await this.linkDemoContext(user, req.session.demoContext);
      }
      
      res.json({
        success: true,
        redirect_url: '/dashboard',
        repository_access: {
          repo_url: `https://github.com/${this.config.github.org}/soulfra-whisper-tombs`,
          access_level: 'read',
          personal_vault: `vault/users/${user.uuid}/`
        }
      });
      
    } catch (error) {
      console.error('Agreement processing error:', error);
      res.status(500).json({ error: 'Failed to process agreement' });
    }
  }

  /**
   * Step 5: Add User to Private Repository
   */
  async addUserToPrivateRepo(user) {
    try {
      // Add user as collaborator to private repo
      await this.github.repos.addCollaborator({
        owner: this.config.github.org,
        repo: 'soulfra-whisper-tombs',
        username: user.github_username,
        permission: 'pull' // Read-only access initially
      });
      
      // Create user-specific branch for their vault
      const branchName = `user/${user.uuid}`;
      await this.createUserBranch(user.uuid, branchName);
      
      // Initialize user's vault structure
      await this.initializeVaultStructure(user.uuid, branchName);
      
      return {
        repository_url: `https://github.com/${this.config.github.org}/soulfra-whisper-tombs`,
        user_branch: branchName,
        vault_path: `vault/users/${user.uuid}/`,
        access_level: 'read'
      };
      
    } catch (error) {
      console.error('GitHub repo access error:', error);
      throw new Error('Failed to grant repository access');
    }
  }

  /**
   * User Creation and Management
   */
  async createOrUpdateUser(githubUser, accessToken) {
    const userUUID = this.generateUserUUID(githubUser);
    
    const [user, created] = await this.db.User.findOrCreate({
      where: { github_id: githubUser.id },
      defaults: {
        uuid: userUUID,
        github_username: githubUser.login,
        github_id: githubUser.id,
        email: githubUser.email,
        avatar_url: githubUser.avatar_url,
        github_access_token: this.encryptToken(accessToken),
        agreement_accepted: false,
        vault_initialized: false,
        trust_score: 0,
        blessing_tier: 1,
        created_at: new Date()
      }
    });
    
    if (!created) {
      // Update existing user
      await user.update({
        github_access_token: this.encryptToken(accessToken),
        last_login: new Date(),
        avatar_url: githubUser.avatar_url
      });
    }
    
    return user;
  }

  /**
   * UUID Generation (Deterministic but Secure)
   */
  generateUserUUID(githubUser) {
    // Create deterministic UUID based on GitHub ID + secret
    const input = `${githubUser.id}_${this.config.uuid_secret}`;
    const hash = crypto.createHash('sha256').update(input).digest('hex');
    
    // Format as UUID v4
    return [
      hash.substr(0, 8),
      hash.substr(8, 4),
      '4' + hash.substr(13, 3), // Version 4
      ((parseInt(hash.substr(16, 1), 16) & 0x3) | 0x8).toString(16) + hash.substr(17, 3),
      hash.substr(20, 12)
    ].join('-');
  }

  /**
   * Initialize User's Personal Vault
   */
  async initializeUserVault(user) {
    const vaultStructure = {
      user_id: user.uuid,
      vault_path: `vault/users/${user.uuid}/`,
      structure: {
        agents: {
          active: {},
          unlocked: {},
          relationships: {}
        },
        logs: {
          tomb_unlocks: [],
          neural_scans: [],
          interactions: []
        },
        config: {
          preferences: {},
          privacy_settings: {},
          agent_permissions: {}
        },
        exports: {
          neural_scans: [],
          agent_conversations: [],
          reflection_data: []
        }
      },
      created_at: new Date()
    };
    
    // Create vault record in database
    await this.db.UserVault.create(vaultStructure);
    
    // Initialize GitHub vault files
    await this.createVaultFiles(user.uuid, vaultStructure);
    
    return vaultStructure;
  }

  /**
   * Link Demo Experience to User Account
   */
  async linkDemoContext(user, demoContext) {
    try {
      // Parse demo context (neural scan data, tomb interactions, etc.)
      const context = JSON.parse(decodeURIComponent(demoContext));
      
      // Create demo link record
      await this.db.DemoLink.create({
        user_uuid: user.uuid,
        demo_session_id: context.demo_session_id,
        neural_scan_data: context.neural_scan,
        tomb_interactions: context.tomb_interactions,
        viral_shares: context.shares || [],
        demo_timestamp: context.timestamp,
        converted_to_member: true,
        conversion_timestamp: new Date()
      });
      
      // Apply demo insights to user profile
      if (context.neural_scan) {
        await this.applyNeuralScanInsights(user, context.neural_scan);
      }
      
      return { linked: true, context_applied: true };
      
    } catch (error) {
      console.error('Demo context linking error:', error);
      return { linked: false, error: error.message };
    }
  }

  /**
   * Session Management
   */
  async generateSessionToken(user) {
    const payload = {
      uuid: user.uuid,
      github_username: user.github_username,
      agreement_accepted: user.agreement_accepted,
      vault_initialized: user.vault_initialized,
      iat: Math.floor(Date.now() / 1000)
    };
    
    return jwt.sign(payload, this.config.jwt.secret, {
      expiresIn: this.config.jwt.expiresIn || '7d'
    });
  }

  async verifySessionToken(token) {
    try {
      const decoded = jwt.verify(token, this.config.jwt.secret);
      const user = await this.db.User.findOne({ where: { uuid: decoded.uuid } });
      return user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Utility Methods
   */
  async exchangeCodeForToken(code) {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: this.config.github.clientId,
        client_secret: this.config.github.clientSecret,
        code: code
      })
    });
    
    return await response.json();
  }

  async getGitHubUserInfo(accessToken) {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${accessToken}`,
        'User-Agent': 'Soulfra-Whisper-Tombs'
      }
    });
    
    return await response.json();
  }

  encryptToken(token) {
    const cipher = crypto.createCipher('aes-256-cbc', this.config.encryption.key);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  decryptToken(encryptedToken) {
    const decipher = crypto.createDecipher('aes-256-cbc', this.config.encryption.key);
    let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

module.exports = { SoulfraMembershipSystem };