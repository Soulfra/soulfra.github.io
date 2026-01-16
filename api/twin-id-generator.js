/**
 * Twin ID Generator
 * Generates unique IDs for digital twins
 * Can be encoded into QR codes
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class TwinIDGenerator {
  constructor(storePath = './data/twins.json') {
    this.storePath = path.resolve(__dirname, '..', storePath);
    this.ensureStore();
  }

  /**
   * Ensure twins.json exists
   */
  ensureStore() {
    const dir = path.dirname(this.storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.storePath)) {
      fs.writeFileSync(this.storePath, JSON.stringify({ twins: {} }, null, 2));
    }
  }

  /**
   * Generate unique short ID (8 chars, URL-safe)
   */
  generateID() {
    return crypto.randomBytes(6).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Create new twin account
   * @param {Object} data - Twin metadata
   * @returns {Object} Twin account with ID
   */
  createTwin(data) {
    const id = this.generateID();
    const twin = {
      id,
      createdAt: new Date().toISOString(),
      imageUrl: data.imageUrl || null,
      audioUrl: data.audioUrl || null,
      videoUrl: data.videoUrl || null,
      name: data.name || 'Unnamed Twin',
      metadata: data.metadata || {}
    };

    // Save to store
    const store = this.loadStore();
    store.twins[id] = twin;
    this.saveStore(store);

    return twin;
  }

  /**
   * Get twin by ID
   * @param {string} id - Twin ID
   * @returns {Object|null} Twin data or null
   */
  getTwin(id) {
    const store = this.loadStore();
    return store.twins[id] || null;
  }

  /**
   * Update twin data
   * @param {string} id - Twin ID
   * @param {Object} updates - Fields to update
   * @returns {Object|null} Updated twin or null
   */
  updateTwin(id, updates) {
    const store = this.loadStore();
    if (!store.twins[id]) return null;

    store.twins[id] = {
      ...store.twins[id],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveStore(store);
    return store.twins[id];
  }

  /**
   * Get all twins
   * @returns {Array} List of all twins
   */
  getAllTwins() {
    const store = this.loadStore();
    return Object.values(store.twins);
  }

  /**
   * Generate QR-friendly URL
   * @param {string} id - Twin ID
   * @param {string} baseUrl - Base URL (default: soulfra.github.io)
   * @returns {string} Full twin URL
   */
  getTwinURL(id, baseUrl = 'https://soulfra.github.io') {
    return `${baseUrl}/twin/${id}`;
  }

  /**
   * Load twins store
   */
  loadStore() {
    try {
      const data = fs.readFileSync(this.storePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      return { twins: {} };
    }
  }

  /**
   * Save twins store
   */
  saveStore(store) {
    fs.writeFileSync(this.storePath, JSON.stringify(store, null, 2));
  }
}

module.exports = TwinIDGenerator;

// CLI usage
if (require.main === module) {
  const generator = new TwinIDGenerator();

  const command = process.argv[2];

  if (command === 'create') {
    const name = process.argv[3] || 'Test Twin';
    const twin = generator.createTwin({ name });
    console.log('Created twin:');
    console.log(JSON.stringify(twin, null, 2));
    console.log('');
    console.log('URL:', generator.getTwinURL(twin.id));
  } else if (command === 'list') {
    const twins = generator.getAllTwins();
    console.log(`Total twins: ${twins.length}`);
    twins.forEach(twin => {
      console.log(`  ${twin.id} - ${twin.name} (${twin.createdAt})`);
    });
  } else if (command === 'get') {
    const id = process.argv[3];
    const twin = generator.getTwin(id);
    if (twin) {
      console.log(JSON.stringify(twin, null, 2));
    } else {
      console.log('Twin not found:', id);
    }
  } else {
    console.log('Usage:');
    console.log('  node twin-id-generator.js create [name]');
    console.log('  node twin-id-generator.js list');
    console.log('  node twin-id-generator.js get <id>');
  }
}
