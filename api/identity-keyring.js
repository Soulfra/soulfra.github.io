#!/usr/bin/env node
/**
 * Identity Keyring System
 *
 * Like PGP keyrings, but for AI personas.
 * Each identity is completely isolated with its own:
 * - Profile (public, shareable)
 * - Memory (private conversations)
 * - Context (private code analysis, debugging notes)
 *
 * Features:
 * - Create/import/export identities
 * - Switch between identities
 * - Isolated memory per identity
 * - Publish profiles (no private data)
 * - Import others' profiles
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const DataStore = require('./data-store.js');
const DomainContext = require('./llm/domain-context.js');

class IdentityKeyring {
  constructor(options = {}) {
    this.config = {
      identitiesDir: options.identitiesDir || path.join(__dirname, '../data/identities'),
      ...options
    };

    // Ensure identities directory exists
    if (!fs.existsSync(this.config.identitiesDir)) {
      fs.mkdirSync(this.config.identitiesDir, { recursive: true });
    }

    // Domain context for profile generation
    this.domainContext = new DomainContext();

    // Current active identity
    this.activeIdentity = null;

    // Stats
    this.stats = {
      totalIdentities: 0,
      identitiesCreated: 0,
      identitiesImported: 0,
      identitySwitches: 0
    };
  }

  /**
   * Initialize - scan for existing identities
   */
  async initialize() {
    try {
      const identities = fs.readdirSync(this.config.identitiesDir);
      this.stats.totalIdentities = identities.length;

      // Load default identity (first one found, or create Soulfra)
      if (identities.length > 0) {
        const firstIdentity = identities[0];
        await this.switchIdentity(firstIdentity);
      } else {
        // Create default Soulfra identity
        await this.createIdentity('soulfra');
      }

      console.log(`✅ Identity Keyring initialized with ${this.stats.totalIdentities} identities`);
      return true;
    } catch (error) {
      console.warn('⚠️ Identity Keyring initialization warning:', error.message);
      // Create default identity
      await this.createIdentity('soulfra');
      return true;
    }
  }

  /**
   * Create new identity
   */
  async createIdentity(domain, options = {}) {
    // Get domain context
    const domainCtx = this.domainContext.getContext(domain);

    // Generate identity hash
    const identityHash = crypto.randomBytes(8).toString('hex');
    const identityId = `${domain}-${identityHash}`;
    const identityDir = path.join(this.config.identitiesDir, identityId);

    // Create identity directory
    if (!fs.existsSync(identityDir)) {
      fs.mkdirSync(identityDir, { recursive: true });
    }

    // Create profile (public, shareable)
    const profile = {
      id: identityId,
      domain,
      name: domainCtx.name,
      tagline: domainCtx.tagline,
      category: domainCtx.category,
      mission: domainCtx.mission,
      focus: domainCtx.focus,
      values: domainCtx.values,
      technologies: domainCtx.technologies,
      useCases: domainCtx.useCases,
      version: 1,
      createdAt: new Date().toISOString(),
      ...options.metadata
    };

    // Create memory (private)
    const memory = {
      identityId,
      conversations: [],
      learnings: [],
      preferences: {},
      createdAt: new Date().toISOString()
    };

    // Create context (private - code analysis)
    const context = {
      identityId,
      codebaseNotes: {},
      debuggingHistory: [],
      knownIssues: [],
      solutions: [],
      createdAt: new Date().toISOString()
    };

    // Save files
    const profileStore = new DataStore(path.join(identityDir, 'profile.json'));
    const memoryStore = new DataStore(path.join(identityDir, 'memory.json'));
    const contextStore = new DataStore(path.join(identityDir, 'context.json'));

    await profileStore.write(profile);
    await memoryStore.write(memory);
    await contextStore.write(context);

    this.stats.identitiesCreated++;
    this.stats.totalIdentities++;

    console.log(`✅ Identity created: ${identityId}`);

    // Switch to new identity
    await this.switchIdentity(identityId);

    return {
      success: true,
      identityId,
      profile
    };
  }

  /**
   * Switch to identity
   */
  async switchIdentity(identityId) {
    const identityDir = path.join(this.config.identitiesDir, identityId);

    if (!fs.existsSync(identityDir)) {
      throw new Error(`Identity ${identityId} not found`);
    }

    // Load identity data
    const profileStore = new DataStore(path.join(identityDir, 'profile.json'));
    const memoryStore = new DataStore(path.join(identityDir, 'memory.json'));
    const contextStore = new DataStore(path.join(identityDir, 'context.json'));

    const profile = await profileStore.read();
    const memory = await memoryStore.read();
    const context = await contextStore.read();

    this.activeIdentity = {
      id: identityId,
      dir: identityDir,
      profile,
      memory,
      context,
      stores: {
        profile: profileStore,
        memory: memoryStore,
        context: contextStore
      }
    };

    this.stats.identitySwitches++;

    console.log(`🔄 Switched to identity: ${identityId} (${profile.name})`);

    return {
      success: true,
      identityId,
      profile: {
        id: profile.id,
        name: profile.name,
        tagline: profile.tagline,
        domain: profile.domain
      }
    };
  }

  /**
   * Get active identity
   */
  getActiveIdentity() {
    if (!this.activeIdentity) {
      throw new Error('No active identity');
    }

    return {
      id: this.activeIdentity.id,
      name: this.activeIdentity.profile.name,
      domain: this.activeIdentity.profile.domain,
      tagline: this.activeIdentity.profile.tagline
    };
  }

  /**
   * Add conversation to memory
   */
  async addConversation(message, response, metadata = {}) {
    if (!this.activeIdentity) {
      throw new Error('No active identity');
    }

    const conversation = {
      id: crypto.randomBytes(8).toString('hex'),
      message,
      response,
      metadata,
      timestamp: new Date().toISOString()
    };

    this.activeIdentity.memory.conversations.push(conversation);
    await this.activeIdentity.stores.memory.write(this.activeIdentity.memory);

    return conversation;
  }

  /**
   * Add learning to memory
   */
  async addLearning(topic, insight, metadata = {}) {
    if (!this.activeIdentity) {
      throw new Error('No active identity');
    }

    const learning = {
      id: crypto.randomBytes(8).toString('hex'),
      topic,
      insight,
      metadata,
      timestamp: new Date().toISOString()
    };

    this.activeIdentity.memory.learnings.push(learning);
    await this.activeIdentity.stores.memory.write(this.activeIdentity.memory);

    return learning;
  }

  /**
   * Add code analysis note
   */
  async addCodeNote(file, note, metadata = {}) {
    if (!this.activeIdentity) {
      throw new Error('No active identity');
    }

    if (!this.activeIdentity.context.codebaseNotes[file]) {
      this.activeIdentity.context.codebaseNotes[file] = [];
    }

    const codeNote = {
      id: crypto.randomBytes(8).toString('hex'),
      file,
      note,
      metadata,
      timestamp: new Date().toISOString()
    };

    this.activeIdentity.context.codebaseNotes[file].push(codeNote);
    await this.activeIdentity.stores.context.write(this.activeIdentity.context);

    return codeNote;
  }

  /**
   * Get conversation history
   */
  getConversations(limit = 10) {
    if (!this.activeIdentity) {
      throw new Error('No active identity');
    }

    return this.activeIdentity.memory.conversations.slice(-limit);
  }

  /**
   * Get learnings
   */
  getLearnings(limit = 10) {
    if (!this.activeIdentity) {
      throw new Error('No active identity');
    }

    return this.activeIdentity.memory.learnings.slice(-limit);
  }

  /**
   * Get code notes for file
   */
  getCodeNotes(file) {
    if (!this.activeIdentity) {
      throw new Error('No active identity');
    }

    return this.activeIdentity.context.codebaseNotes[file] || [];
  }

  /**
   * List all identities
   */
  async listIdentities() {
    const identities = [];
    const dirs = fs.readdirSync(this.config.identitiesDir);

    for (const dir of dirs) {
      const profilePath = path.join(this.config.identitiesDir, dir, 'profile.json');
      if (fs.existsSync(profilePath)) {
        const profileStore = new DataStore(profilePath);
        const profile = await profileStore.read();

        identities.push({
          id: profile.id,
          name: profile.name,
          domain: profile.domain,
          tagline: profile.tagline,
          active: this.activeIdentity && this.activeIdentity.id === profile.id,
          createdAt: profile.createdAt
        });
      }
    }

    return identities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Export identity profile (public only, no private data)
   */
  async exportProfile(identityId) {
    const identityDir = path.join(this.config.identitiesDir, identityId || this.activeIdentity.id);

    if (!fs.existsSync(identityDir)) {
      throw new Error(`Identity ${identityId} not found`);
    }

    const profileStore = new DataStore(path.join(identityDir, 'profile.json'));
    const profile = await profileStore.read();

    // Remove any private fields (none for now, but future-proofing)
    const publicProfile = {
      ...profile,
      exported: true,
      exportedAt: new Date().toISOString()
    };

    return publicProfile;
  }

  /**
   * Import identity profile
   */
  async importProfile(profileData, options = {}) {
    // Validate profile
    if (!profileData.domain || !profileData.name) {
      throw new Error('Invalid profile: missing domain or name');
    }

    // Generate new identity hash
    const identityHash = crypto.randomBytes(8).toString('hex');
    const identityId = `${profileData.domain}-${identityHash}`;
    const identityDir = path.join(this.config.identitiesDir, identityId);

    // Create identity directory
    if (!fs.existsSync(identityDir)) {
      fs.mkdirSync(identityDir, { recursive: true });
    }

    // Create profile with new ID
    const profile = {
      ...profileData,
      id: identityId,
      imported: true,
      importedAt: new Date().toISOString(),
      originalId: profileData.id
    };

    // Create fresh memory and context
    const memory = {
      identityId,
      conversations: [],
      learnings: [],
      preferences: {},
      createdAt: new Date().toISOString()
    };

    const context = {
      identityId,
      codebaseNotes: {},
      debuggingHistory: [],
      knownIssues: [],
      solutions: [],
      createdAt: new Date().toISOString()
    };

    // Save files
    const profileStore = new DataStore(path.join(identityDir, 'profile.json'));
    const memoryStore = new DataStore(path.join(identityDir, 'memory.json'));
    const contextStore = new DataStore(path.join(identityDir, 'context.json'));

    await profileStore.write(profile);
    await memoryStore.write(memory);
    await contextStore.write(context);

    this.stats.identitiesImported++;
    this.stats.totalIdentities++;

    console.log(`✅ Identity imported: ${identityId} (${profile.name})`);

    if (options.switch) {
      await this.switchIdentity(identityId);
    }

    return {
      success: true,
      identityId,
      profile: {
        id: profile.id,
        name: profile.name,
        domain: profile.domain
      }
    };
  }

  /**
   * Delete identity
   */
  async deleteIdentity(identityId) {
    const identityDir = path.join(this.config.identitiesDir, identityId);

    if (!fs.existsSync(identityDir)) {
      throw new Error(`Identity ${identityId} not found`);
    }

    // Don't delete active identity
    if (this.activeIdentity && this.activeIdentity.id === identityId) {
      throw new Error('Cannot delete active identity. Switch to another identity first.');
    }

    // Remove directory
    fs.rmSync(identityDir, { recursive: true, force: true });

    this.stats.totalIdentities--;

    console.log(`✅ Identity deleted: ${identityId}`);

    return {
      success: true,
      identityId
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    const memoryStats = this.activeIdentity ? {
      conversations: this.activeIdentity.memory.conversations.length,
      learnings: this.activeIdentity.memory.learnings.length,
      codeNotes: Object.keys(this.activeIdentity.context.codebaseNotes).length
    } : null;

    return {
      totalIdentities: this.stats.totalIdentities,
      identitiesCreated: this.stats.identitiesCreated,
      identitiesImported: this.stats.identitiesImported,
      identitySwitches: this.stats.identitySwitches,
      activeIdentity: this.activeIdentity ? {
        id: this.activeIdentity.id,
        name: this.activeIdentity.profile.name,
        domain: this.activeIdentity.profile.domain
      } : null,
      memory: memoryStats
    };
  }

  /**
   * Get module info
   */
  getInfo() {
    return {
      identitiesDir: this.config.identitiesDir,
      stats: this.getStats(),
      activeIdentity: this.activeIdentity ? {
        id: this.activeIdentity.id,
        name: this.activeIdentity.profile.name,
        domain: this.activeIdentity.profile.domain,
        tagline: this.activeIdentity.profile.tagline
      } : null
    };
  }
}

module.exports = IdentityKeyring;
