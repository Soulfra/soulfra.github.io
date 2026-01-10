/**
 * GitHub Gist Database
 *
 * Distributed, blockchain-style database using GitHub Gists
 * - No backend server needed
 * - SHA-256 hashing for immutability
 * - Cross-domain sync
 * - Provable audit trails
 *
 * Features:
 * - Save/load analytics transactions
 * - Blockchain-style hash chains
 * - Cross-domain synchronization
 * - Anonymous (no GitHub auth needed)
 * - Local mock mode for testing
 *
 * Usage:
 *   const db = new GistDatabase({ mockMode: false });
 *   await db.saveTransaction({ message: 'Hello', sentiment: 'positive' });
 *   const transactions = await db.loadTransactions();
 */

class GistDatabase {
  constructor(options = {}) {
    this.GIST_API = 'https://api.github.com/gists';
    this.mockMode = options.mockMode || false;
    this.mockStorage = [];

    // Master Gist IDs for each domain (update these after creating)
    this.masterGists = {
      soulfra: null,      // Set via setMasterGist('soulfra', 'gist-id')
      cringeproof: null,
      calriven: null,
      deathtodata: null
    };

    // Load master Gist IDs from localStorage
    this.loadMasterGists();
  }

  /**
   * Save master Gist IDs to localStorage
   */
  saveMasterGists() {
    localStorage.setItem('soulfra_master_gists', JSON.stringify(this.masterGists));
  }

  /**
   * Load master Gist IDs from localStorage
   */
  loadMasterGists() {
    try {
      const saved = localStorage.getItem('soulfra_master_gists');
      if (saved) {
        this.masterGists = { ...this.masterGists, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('[GistDB] Could not load master Gists:', e);
    }
  }

  /**
   * Set master Gist ID for a domain
   */
  setMasterGist(domain, gistId) {
    this.masterGists[domain] = gistId;
    this.saveMasterGists();
    console.log(`✅ Set master Gist for ${domain}:`, gistId);
  }

  /**
   * Calculate SHA-256 hash of transaction
   */
  async calculateHash(transaction) {
    const data = JSON.stringify(transaction);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Create signed transaction with hash
   */
  async createSignedTransaction(data) {
    const transaction = {
      id: this.generateId(),
      timestamp: Date.now(),
      data: data,
      previousHash: null, // Set during chain building
      signature: null
    };

    // Calculate hash
    const hash = await this.calculateHash(transaction);
    transaction.signature = hash;

    return transaction;
  }

  /**
   * Verify transaction hash
   */
  async verifyTransaction(transaction) {
    const storedSignature = transaction.signature;
    const tempTransaction = { ...transaction };
    delete tempTransaction.signature;

    const calculatedHash = await this.calculateHash(tempTransaction);
    return storedSignature === calculatedHash;
  }

  /**
   * Save transaction to Gist
   */
  async saveTransaction(data, domain = 'soulfra') {
    try {
      console.log(`💾 Saving transaction to ${domain}...`);

      // Create signed transaction
      const transaction = await this.createSignedTransaction(data);

      // Mock mode: save to memory
      if (this.mockMode) {
        this.mockStorage.push(transaction);
        console.log('✅ [MOCK] Transaction saved:', transaction.id);
        return {
          success: true,
          transaction,
          gistId: 'mock-gist-' + transaction.id,
          hash: transaction.signature
        };
      }

      // Load existing transactions
      const existing = await this.loadTransactions(domain);

      // Build hash chain
      if (existing.length > 0) {
        const lastTransaction = existing[existing.length - 1];
        transaction.previousHash = lastTransaction.signature;
      }

      // Recalculate hash with previousHash
      const finalHash = await this.calculateHash(transaction);
      transaction.signature = finalHash;

      // Add to chain
      existing.push(transaction);

      // Save to Gist
      const gistId = this.masterGists[domain];

      if (!gistId) {
        // Create new master Gist for this domain
        const newGist = await this.createMasterGist(domain, existing);
        this.setMasterGist(domain, newGist.id);

        console.log(`✅ Transaction saved (new Gist created):`, transaction.id);
        return {
          success: true,
          transaction,
          gistId: newGist.id,
          hash: transaction.signature,
          isNew: true
        };
      } else {
        // Update existing Gist
        await this.updateGist(gistId, existing);

        console.log(`✅ Transaction saved:`, transaction.id);
        return {
          success: true,
          transaction,
          gistId: gistId,
          hash: transaction.signature
        };
      }

    } catch (error) {
      console.error('[GistDB] Save error:', error);
      throw error;
    }
  }

  /**
   * Load transactions from Gist
   */
  async loadTransactions(domain = 'soulfra') {
    try {
      console.log(`📥 Loading transactions from ${domain}...`);

      // Mock mode: return from memory
      if (this.mockMode) {
        console.log(`✅ [MOCK] Loaded ${this.mockStorage.length} transactions`);
        return this.mockStorage;
      }

      const gistId = this.masterGists[domain];

      if (!gistId) {
        console.log('ℹ️ No master Gist found, returning empty');
        return [];
      }

      const response = await fetch(`${this.GIST_API}/${gistId}`);

      if (!response.ok) {
        throw new Error(`Gist not found: ${response.status}`);
      }

      const gist = await response.json();
      const content = gist.files['transactions.json'].content;
      const transactions = JSON.parse(content);

      console.log(`✅ Loaded ${transactions.length} transactions`);
      return transactions;

    } catch (error) {
      console.error('[GistDB] Load error:', error);
      return [];
    }
  }

  /**
   * Verify entire blockchain
   */
  async verifyBlockchain(domain = 'soulfra') {
    const transactions = await this.loadTransactions(domain);

    if (transactions.length === 0) {
      return { valid: true, message: 'Empty chain' };
    }

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];

      // Verify hash
      const isValid = await this.verifyTransaction(transaction);
      if (!isValid) {
        return {
          valid: false,
          message: `Invalid signature at transaction ${i}`,
          transaction
        };
      }

      // Verify chain link (except first)
      if (i > 0) {
        const previous = transactions[i - 1];
        if (transaction.previousHash !== previous.signature) {
          return {
            valid: false,
            message: `Broken chain at transaction ${i}`,
            transaction
          };
        }
      }
    }

    return {
      valid: true,
      message: `All ${transactions.length} transactions verified`,
      chainLength: transactions.length
    };
  }

  /**
   * Create new master Gist for domain
   */
  async createMasterGist(domain, transactions = []) {
    const response = await fetch(this.GIST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        description: `Soulfra Analytics Database - ${domain}`,
        public: true,
        files: {
          'transactions.json': {
            content: JSON.stringify(transactions, null, 2)
          },
          'README.md': {
            content: `# Soulfra Analytics - ${domain}\n\n` +
                     `Blockchain-style analytics database\n\n` +
                     `- Total Transactions: ${transactions.length}\n` +
                     `- Created: ${new Date().toISOString()}\n` +
                     `- Domain: ${domain}\n\n` +
                     `🔐 All transactions are SHA-256 signed and chained for immutability.`
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create Gist: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Update existing Gist
   */
  async updateGist(gistId, transactions) {
    const response = await fetch(`${this.GIST_API}/${gistId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        files: {
          'transactions.json': {
            content: JSON.stringify(transactions, null, 2)
          },
          'README.md': {
            content: `# Soulfra Analytics\n\n` +
                     `Blockchain-style analytics database\n\n` +
                     `- Total Transactions: ${transactions.length}\n` +
                     `- Last Updated: ${new Date().toISOString()}\n\n` +
                     `🔐 All transactions are SHA-256 signed and chained for immutability.`
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update Gist: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Sync to all domains
   */
  async syncToAllDomains() {
    console.log('🔄 Syncing to all domains...');

    const results = {};
    const domains = Object.keys(this.masterGists);

    for (const domain of domains) {
      try {
        const transactions = await this.loadTransactions('soulfra');

        if (transactions.length > 0 && !this.masterGists[domain]) {
          // Create Gist for this domain
          const gist = await this.createMasterGist(domain, transactions);
          this.setMasterGist(domain, gist.id);
          results[domain] = { success: true, gistId: gist.id };
        } else if (this.masterGists[domain]) {
          // Update existing Gist
          await this.updateGist(this.masterGists[domain], transactions);
          results[domain] = { success: true, gistId: this.masterGists[domain] };
        }
      } catch (error) {
        results[domain] = { success: false, error: error.message };
      }
    }

    console.log('✅ Sync complete:', results);
    return results;
  }

  /**
   * Export transactions to CSV
   */
  exportToCSV(transactions) {
    const headers = ['ID', 'Timestamp', 'Message', 'Sentiment', 'Status', 'Hash'];
    const rows = transactions.map(t => [
      t.id,
      new Date(t.timestamp).toISOString(),
      JSON.stringify(t.data.message || ''),
      t.data.sentiment || '',
      t.data.status || '',
      t.signature
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csv;
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * Get database stats
   */
  async getStats(domain = 'soulfra') {
    const transactions = await this.loadTransactions(domain);
    const verification = await this.verifyBlockchain(domain);

    return {
      domain,
      totalTransactions: transactions.length,
      gistId: this.masterGists[domain],
      chainValid: verification.valid,
      lastTransaction: transactions.length > 0 ? transactions[transactions.length - 1] : null,
      masterGists: this.masterGists
    };
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.GistDatabase = GistDatabase;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GistDatabase;
}
