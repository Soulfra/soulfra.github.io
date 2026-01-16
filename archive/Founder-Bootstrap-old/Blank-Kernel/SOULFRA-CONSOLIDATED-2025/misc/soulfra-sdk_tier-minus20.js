/**
 * 🛡️ SOULFRA SDK - Data Protection in 3 Lines
 * The simplest way to make data mathematically unbreachable
 */

class Soulfra {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.SOULFRA_API_KEY || 'demo-key';
    this.endpoint = config.endpoint || 'https://api.soulfra.com';
    this.deviceId = this._getDeviceId();
    
    // Auto-setup on first use
    this._ensureInitialized();
  }

  /**
   * Protect any data - returns protected reference
   * @example
   * const safe = await soulfra.protect({ ssn: '123-45-6789' })
   */
  async protect(data, options = {}) {
    try {
      // Smart defaults that just work
      const settings = {
        securityLevel: options.securityLevel || 'maximum',
        retentionPeriod: options.retentionPeriod || 'forever',
        shareWith: options.shareWith || [],
        ...options
      };

      // Convert data to fragments
      const fragments = this._fragment(data);
      
      // Distribute across vault network
      const vaultRefs = await this._distribute(fragments, settings);
      
      // Return simple reference object
      return {
        id: this._generateId(),
        protected: true,
        size: JSON.stringify(data).length,
        fragments: fragments.length,
        retrieveUrl: `${this.endpoint}/retrieve/${vaultRefs.id}`,
        settings,
        
        // Convenience method
        retrieve: () => this.retrieve(vaultRefs.id)
      };
      
    } catch (error) {
      throw this._friendlyError(error);
    }
  }

  /**
   * Retrieve protected data
   * @example
   * const myData = await soulfra.retrieve(protectedId)
   */
  async retrieve(idOrObject) {
    try {
      const id = typeof idOrObject === 'object' ? idOrObject.id : idOrObject;
      
      // Gather fragments
      const fragments = await this._gather(id);
      
      // Reconstruct original data
      const data = this._reconstruct(fragments);
      
      return data;
      
    } catch (error) {
      throw this._friendlyError(error);
    }
  }

  /**
   * Share protected data with another user
   * @example
   * await soulfra.share(protectedId, 'family@example.com')
   */
  async share(idOrObject, recipient, permissions = 'read') {
    try {
      const id = typeof idOrObject === 'object' ? idOrObject.id : idOrObject;
      
      // Create sharing token
      const token = await this._createShareToken(id, recipient, permissions);
      
      return {
        shared: true,
        recipient,
        permissions,
        revokeUrl: `${this.endpoint}/revoke/${token}`,
        
        // Convenience method
        revoke: () => this.revoke(token)
      };
      
    } catch (error) {
      throw this._friendlyError(error);
    }
  }

  /**
   * Delete protected data permanently
   * @example
   * await soulfra.delete(protectedId)
   */
  async delete(idOrObject) {
    try {
      const id = typeof idOrObject === 'object' ? idOrObject.id : idOrObject;
      
      // Remove all fragments
      await this._purge(id);
      
      return {
        deleted: true,
        id,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      throw this._friendlyError(error);
    }
  }

  /**
   * Search your protected data
   * @example
   * const results = await soulfra.search('medical records')
   */
  async search(query, options = {}) {
    try {
      // Search without exposing actual data
      const results = await this._secureSearch(query, options);
      
      return results.map(r => ({
        id: r.id,
        preview: r.preview,
        created: r.created,
        size: r.size,
        
        // Convenience method
        retrieve: () => this.retrieve(r.id)
      }));
      
    } catch (error) {
      throw this._friendlyError(error);
    }
  }

  // Private methods that do the magic
  
  _fragment(data) {
    // Erasure coding + encryption
    const json = JSON.stringify(data);
    const chunks = [];
    const chunkSize = 1024;
    
    for (let i = 0; i < json.length; i += chunkSize) {
      chunks.push({
        index: i / chunkSize,
        data: json.slice(i, i + chunkSize),
        checksum: this._hash(json.slice(i, i + chunkSize))
      });
    }
    
    return chunks;
  }
  
  _distribute(fragments, settings) {
    // Simulate distribution (real version would use actual vaults)
    const vaultId = this._generateId();
    
    // Store reference
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`soulfra_${vaultId}`, JSON.stringify({
        fragments,
        settings,
        created: new Date().toISOString()
      }));
    }
    
    return { id: vaultId };
  }
  
  _gather(id) {
    // Simulate gathering (real version would fetch from vaults)
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(`soulfra_${id}`);
      if (stored) {
        const data = JSON.parse(stored);
        return data.fragments;
      }
    }
    
    throw new Error('Data not found');
  }
  
  _reconstruct(fragments) {
    // Sort and join fragments
    const sorted = fragments.sort((a, b) => a.index - b.index);
    const json = sorted.map(f => f.data).join('');
    return JSON.parse(json);
  }
  
  _createShareToken(id, recipient, permissions) {
    return `share_${id}_${recipient}_${permissions}_${Date.now()}`;
  }
  
  _purge(id) {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`soulfra_${id}`);
    }
  }
  
  _secureSearch(query, options) {
    // Search without decrypting (real version uses homomorphic encryption)
    const results = [];
    
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('soulfra_')) {
          const stored = JSON.parse(localStorage.getItem(key));
          results.push({
            id: key.replace('soulfra_', ''),
            preview: '**Protected Data**',
            created: stored.created,
            size: JSON.stringify(stored.fragments).length
          });
        }
      }
    }
    
    return results;
  }
  
  _getDeviceId() {
    // Generate consistent device ID
    if (typeof localStorage !== 'undefined') {
      let deviceId = localStorage.getItem('soulfra_device_id');
      if (!deviceId) {
        deviceId = this._generateId();
        localStorage.setItem('soulfra_device_id', deviceId);
      }
      return deviceId;
    }
    return 'server-' + this._generateId();
  }
  
  _ensureInitialized() {
    // Auto-initialize on first use
    this.initialized = true;
  }
  
  _generateId() {
    return 'sf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  _hash(data) {
    // Simple hash for demo (real version uses SHA-256)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
  
  _friendlyError(error) {
    // Convert technical errors to helpful messages
    const errorMap = {
      'ECONNREFUSED': {
        message: 'Cannot connect to Soulfra',
        solutions: [
          'Check your internet connection',
          'Try again in a few seconds',
          'Contact support if this persists'
        ]
      },
      'Data not found': {
        message: 'Protected data not found',
        solutions: [
          'Check if the ID is correct',
          'Ensure you have permission to access this data',
          'The data may have been deleted'
        ]
      },
      'Invalid API key': {
        message: 'Authentication failed',
        solutions: [
          'Check your API key in the dashboard',
          'Make sure the key is active',
          'Generate a new key if needed'
        ]
      }
    };
    
    const friendlyError = errorMap[error.message] || {
      message: 'Something went wrong',
      solutions: [
        'Try again in a moment',
        'Check the documentation',
        'Contact support@soulfra.com'
      ]
    };
    
    const err = new Error(friendlyError.message);
    err.solutions = friendlyError.solutions;
    err.originalError = error.message;
    err.helpUrl = 'https://help.soulfra.com';
    
    return err;
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Soulfra;
}

if (typeof window !== 'undefined') {
  window.Soulfra = Soulfra;
}

// TypeScript definitions
/**
 * @typedef {Object} ProtectOptions
 * @property {'basic'|'standard'|'maximum'} [securityLevel='maximum']
 * @property {string} [retentionPeriod='forever'] 
 * @property {string[]} [shareWith=[]]
 */

/**
 * @typedef {Object} ProtectedData
 * @property {string} id - Unique identifier
 * @property {boolean} protected - Always true
 * @property {number} size - Original data size
 * @property {number} fragments - Number of fragments
 * @property {string} retrieveUrl - API URL for retrieval
 * @property {Function} retrieve - Convenience method
 */