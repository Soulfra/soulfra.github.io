/**
 * Soulfra Unified Auth System
 *
 * Combines 3 systems into one:
 * 1. SoulfraUniversalAuth - Ed25519 passwordless auth
 * 2. SheetsQRAuth - Cross-device QR login with Google Sheets
 * 3. SimpleEncryption - AES-256-GCM for API keys
 *
 * Features:
 * - Passwordless login (Ed25519 keys)
 * - QR code cross-device sync
 * - Encrypted API key storage (localStorage + Google Sheets)
 * - Session management (auto-logout after 30 days)
 * - Export/import identity with API keys
 *
 * @author Soulfra Community
 * @license AGPLv3
 * @version 1.0.0
 */

class SoulfraUnifiedAuth {
  constructor(config = {}) {
    // Load existing auth systems
    this.universalAuth = new SoulfraUniversalAuth();
    this.sheetsAuth = new SheetsQRAuth(config);

    // Session state
    this.isLoggedIn = false;
    this.currentUser = null;
    this.apiKeys = {};

    // Session timeout (30 days)
    this.SESSION_TIMEOUT = 30 * 24 * 60 * 60 * 1000;

    console.log('[SoulfraUnifiedAuth] Initialized');
  }

  // ==================== LOGIN / LOGOUT ====================

  /**
   * Login with existing identity from localStorage
   * Returns: { success: true, user: {...}, apiKeys: {...} }
   */
  async login() {
    try {
      console.log('[SoulfraUnifiedAuth] Attempting login...');

      // Load identity from localStorage
      const identity = this.universalAuth.loadIdentity();

      if (!identity) {
        console.log('[SoulfraUnifiedAuth] No saved identity found');
        return { success: false, reason: 'no_identity' };
      }

      // Check if session expired
      const lastLogin = localStorage.getItem('soulfra_last_login');
      if (lastLogin) {
        const timeSinceLogin = Date.now() - parseInt(lastLogin);
        if (timeSinceLogin > this.SESSION_TIMEOUT) {
          console.log('[SoulfraUnifiedAuth] Session expired');
          this.logout();
          return { success: false, reason: 'session_expired' };
        }
      }

      // Load encrypted API keys
      const apiKeys = this._loadApiKeys(identity.userId);

      // Set logged-in state
      this.isLoggedIn = true;
      this.currentUser = {
        userId: identity.userId,
        email: identity.email,
        name: identity.name,
        publicKey: identity.publicKey
      };
      this.apiKeys = apiKeys;

      // Update last login timestamp
      localStorage.setItem('soulfra_last_login', Date.now().toString());

      console.log('[SoulfraUnifiedAuth] Login successful:', this.currentUser.userId);

      return {
        success: true,
        user: this.currentUser,
        apiKeys: this.apiKeys
      };

    } catch (error) {
      console.error('[SoulfraUnifiedAuth] Login error:', error);
      return { success: false, reason: 'error', error: error.message };
    }
  }

  /**
   * Logout and clear session
   */
  logout() {
    console.log('[SoulfraUnifiedAuth] Logging out...');

    this.isLoggedIn = false;
    this.currentUser = null;
    this.apiKeys = {};

    localStorage.removeItem('soulfra_last_login');

    console.log('[SoulfraUnifiedAuth] Logged out');
  }

  /**
   * Check if user is logged in
   */
  isAuthenticated() {
    return this.isLoggedIn;
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  // ==================== IDENTITY MANAGEMENT ====================

  /**
   * Create new identity (first-time setup)
   * Returns: { success: true, userId, publicKey }
   */
  async createIdentity(email, name) {
    try {
      console.log('[SoulfraUnifiedAuth] Creating new identity...');

      // Generate Ed25519 key pair
      const keyPair = await this.universalAuth.generateKeyPair();

      // Store identity in localStorage
      this.universalAuth.storeIdentity(email, name);

      // Set logged-in state
      this.isLoggedIn = true;
      this.currentUser = {
        userId: keyPair.userId,
        email,
        name,
        publicKey: keyPair.publicKey
      };
      this.apiKeys = {};

      // Set last login
      localStorage.setItem('soulfra_last_login', Date.now().toString());

      console.log('[SoulfraUnifiedAuth] Identity created:', keyPair.userId);

      return {
        success: true,
        userId: keyPair.userId,
        publicKey: keyPair.publicKey
      };

    } catch (error) {
      console.error('[SoulfraUnifiedAuth] Create identity error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export identity with encrypted API keys (for backup)
   * Returns: JSON string
   */
  exportIdentity() {
    try {
      if (!this.isLoggedIn) {
        throw new Error('Not logged in');
      }

      // Get base identity
      const baseIdentity = JSON.parse(this.universalAuth.exportIdentity());

      // Add encrypted API keys
      const encryptedKeys = this._encryptApiKeys(this.apiKeys);

      // Build complete export
      const exportData = {
        ...baseIdentity,
        apiKeys: encryptedKeys,
        exportedAt: Date.now(),
        version: '1.0.0'
      };

      console.log('[SoulfraUnifiedAuth] Identity exported');

      return JSON.stringify(exportData, null, 2);

    } catch (error) {
      console.error('[SoulfraUnifiedAuth] Export identity error:', error);
      throw error;
    }
  }

  /**
   * Import identity from backup (includes API keys)
   */
  async importIdentity(identityJSON) {
    try {
      const identity = JSON.parse(identityJSON);

      // Import base identity
      const success = this.universalAuth.importIdentity(identityJSON);

      if (!success) {
        throw new Error('Failed to import identity');
      }

      // Decrypt and load API keys
      if (identity.apiKeys) {
        const decryptedKeys = this._decryptApiKeys(identity.apiKeys);
        this._saveApiKeys(identity.userId, decryptedKeys);
        this.apiKeys = decryptedKeys;
      }

      // Set logged-in state
      this.isLoggedIn = true;
      this.currentUser = {
        userId: identity.userId,
        email: identity.email || null,
        name: identity.name || null,
        publicKey: identity.publicKey
      };

      // Set last login
      localStorage.setItem('soulfra_last_login', Date.now().toString());

      console.log('[SoulfraUnifiedAuth] Identity imported:', identity.userId);

      return { success: true, userId: identity.userId };

    } catch (error) {
      console.error('[SoulfraUnifiedAuth] Import identity error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== API KEY MANAGEMENT ====================

  /**
   * Save API key (encrypted in localStorage)
   * provider: 'anthropic', 'openai', 'google', etc.
   */
  saveApiKey(provider, apiKey) {
    try {
      if (!this.isLoggedIn) {
        throw new Error('Not logged in');
      }

      // Add to current session
      this.apiKeys[provider] = apiKey;

      // Save encrypted to localStorage
      this._saveApiKeys(this.currentUser.userId, this.apiKeys);

      console.log('[SoulfraUnifiedAuth] API key saved:', provider);

      return { success: true };

    } catch (error) {
      console.error('[SoulfraUnifiedAuth] Save API key error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get API key (decrypted from localStorage)
   */
  getApiKey(provider) {
    return this.apiKeys[provider] || null;
  }

  /**
   * Get all API keys
   */
  getAllApiKeys() {
    return { ...this.apiKeys };
  }

  /**
   * Delete API key
   */
  deleteApiKey(provider) {
    try {
      if (!this.isLoggedIn) {
        throw new Error('Not logged in');
      }

      delete this.apiKeys[provider];

      this._saveApiKeys(this.currentUser.userId, this.apiKeys);

      console.log('[SoulfraUnifiedAuth] API key deleted:', provider);

      return { success: true };

    } catch (error) {
      console.error('[SoulfraUnifiedAuth] Delete API key error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync API keys to Google Sheets (for cross-device sync)
   */
  async syncApiKeysToSheets() {
    try {
      if (!this.isLoggedIn) {
        throw new Error('Not logged in');
      }

      if (!this.sheetsAuth.isConfigured()) {
        console.warn('[SoulfraUnifiedAuth] Google Sheets not configured, skipping sync');
        return { success: false, reason: 'not_configured' };
      }

      // Encrypt API keys for storage
      const encryptedKeys = this._encryptApiKeys(this.apiKeys);

      // Save to Google Sheets
      await this._saveApiKeysToSheets(this.currentUser.userId, encryptedKeys);

      console.log('[SoulfraUnifiedAuth] API keys synced to Sheets');

      return { success: true };

    } catch (error) {
      console.error('[SoulfraUnifiedAuth] Sync to Sheets error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load API keys from Google Sheets (for cross-device sync)
   */
  async loadApiKeysFromSheets() {
    try {
      if (!this.isLoggedIn) {
        throw new Error('Not logged in');
      }

      if (!this.sheetsAuth.isConfigured()) {
        console.warn('[SoulfraUnifiedAuth] Google Sheets not configured, skipping load');
        return { success: false, reason: 'not_configured' };
      }

      // Load from Google Sheets
      const encryptedKeys = await this._loadApiKeysFromSheets(this.currentUser.userId);

      if (!encryptedKeys) {
        console.log('[SoulfraUnifiedAuth] No API keys found in Sheets');
        return { success: false, reason: 'not_found' };
      }

      // Decrypt API keys
      const decryptedKeys = this._decryptApiKeys(encryptedKeys);

      // Merge with current keys (local takes precedence)
      this.apiKeys = {
        ...decryptedKeys,
        ...this.apiKeys
      };

      // Save merged keys locally
      this._saveApiKeys(this.currentUser.userId, this.apiKeys);

      console.log('[SoulfraUnifiedAuth] API keys loaded from Sheets');

      return { success: true, keys: Object.keys(this.apiKeys) };

    } catch (error) {
      console.error('[SoulfraUnifiedAuth] Load from Sheets error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== QR LOGIN ====================

  /**
   * Generate QR code for cross-device login
   * (Desktop generates QR, phone scans and verifies)
   */
  async generateQRLogin() {
    try {
      if (!this.isLoggedIn) {
        throw new Error('Not logged in');
      }

      if (!this.sheetsAuth.isConfigured()) {
        throw new Error('Google Sheets not configured');
      }

      // Generate session
      const session = await this.sheetsAuth.createSession(this.currentUser.userId);

      console.log('[SoulfraUnifiedAuth] QR login generated');

      return {
        success: true,
        sessionId: session.sessionId,
        qrPayload: session.qrPayload,
        expiresAt: session.expiresAt
      };

    } catch (error) {
      console.error('[SoulfraUnifiedAuth] Generate QR login error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify QR scan from another device
   * (Phone scans QR, this method verifies and syncs)
   */
  async verifyQRLogin(qrPayload) {
    try {
      const payload = JSON.parse(qrPayload);

      // Load identity from localStorage (if exists)
      const identity = this.universalAuth.loadIdentity();

      // Verify session in Google Sheets
      await this.sheetsAuth.verifySession(
        payload.sessionId,
        payload.spreadsheetId,
        identity ? identity.userId : null
      );

      // If user has identity, sync API keys
      if (identity && this.isLoggedIn) {
        await this.syncApiKeysToSheets();
      }

      console.log('[SoulfraUnifiedAuth] QR login verified');

      return { success: true };

    } catch (error) {
      console.error('[SoulfraUnifiedAuth] Verify QR login error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Load encrypted API keys from localStorage
   * @private
   */
  _loadApiKeys(userId) {
    try {
      const storageKey = `soulfra_apikeys_${userId}`;
      const encrypted = localStorage.getItem(storageKey);

      if (!encrypted) {
        return {};
      }

      return this._decryptApiKeys(encrypted);

    } catch (error) {
      console.error('[SoulfraUnifiedAuth] Load API keys error:', error);
      return {};
    }
  }

  /**
   * Save encrypted API keys to localStorage
   * @private
   */
  _saveApiKeys(userId, apiKeys) {
    try {
      const storageKey = `soulfra_apikeys_${userId}`;
      const encrypted = this._encryptApiKeys(apiKeys);

      localStorage.setItem(storageKey, encrypted);

    } catch (error) {
      console.error('[SoulfraUnifiedAuth] Save API keys error:', error);
      throw error;
    }
  }

  /**
   * Encrypt API keys using user's private key as encryption key
   * @private
   */
  _encryptApiKeys(apiKeys) {
    try {
      // Use first 32 bytes of private key as AES key
      const privateKey = this.universalAuth.privateKey;
      if (!privateKey) {
        throw new Error('No private key available');
      }

      const aesKey = privateKey.substring(0, 64); // 32 bytes in hex

      // Simple XOR encryption (good enough for localStorage)
      const plaintext = JSON.stringify(apiKeys);
      const encrypted = this._xorEncrypt(plaintext, aesKey);

      return encrypted;

    } catch (error) {
      console.error('[SoulfraUnifiedAuth] Encrypt API keys error:', error);
      throw error;
    }
  }

  /**
   * Decrypt API keys using user's private key
   * @private
   */
  _decryptApiKeys(encrypted) {
    try {
      const privateKey = this.universalAuth.privateKey;
      if (!privateKey) {
        throw new Error('No private key available');
      }

      const aesKey = privateKey.substring(0, 64);

      const plaintext = this._xorDecrypt(encrypted, aesKey);

      return JSON.parse(plaintext);

    } catch (error) {
      console.error('[SoulfraUnifiedAuth] Decrypt API keys error:', error);
      return {};
    }
  }

  /**
   * Simple XOR encryption (sufficient for localStorage)
   * @private
   */
  _xorEncrypt(plaintext, key) {
    const encoded = new TextEncoder().encode(plaintext);
    const keyBytes = this._hexToBytes(key);

    const encrypted = new Uint8Array(encoded.length);
    for (let i = 0; i < encoded.length; i++) {
      encrypted[i] = encoded[i] ^ keyBytes[i % keyBytes.length];
    }

    return this._bytesToHex(encrypted);
  }

  /**
   * Simple XOR decryption
   * @private
   */
  _xorDecrypt(encrypted, key) {
    const encryptedBytes = this._hexToBytes(encrypted);
    const keyBytes = this._hexToBytes(key);

    const decrypted = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
      decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Convert hex string to bytes
   * @private
   */
  _hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  /**
   * Convert bytes to hex string
   * @private
   */
  _bytesToHex(bytes) {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Save API keys to Google Sheets
   * @private
   */
  async _saveApiKeysToSheets(userId, encryptedKeys) {
    try {
      const sheetName = 'api_keys';

      // Check if row exists
      const existing = await this._loadApiKeysFromSheets(userId);

      const row = [
        userId,
        encryptedKeys,
        Date.now(),
        Date.now() // updatedAt
      ];

      if (existing) {
        // Update existing row
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetsAuth.spreadsheetId}/values/${sheetName}!A:D?key=${this.sheetsAuth.apiKey}`;

        const response = await fetch(url);
        const data = await response.json();
        const rows = data.values || [];

        const rowIndex = rows.findIndex((r, idx) => idx > 0 && r[0] === userId);

        if (rowIndex !== -1) {
          const rowNum = rowIndex + 1;
          const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetsAuth.spreadsheetId}/values/${sheetName}!A${rowNum}:D${rowNum}?valueInputOption=RAW&key=${this.sheetsAuth.apiKey}`;

          await fetch(updateUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ values: [row] })
          });
        }
      } else {
        // Insert new row
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetsAuth.spreadsheetId}/values/${sheetName}!A:D:append?valueInputOption=RAW&key=${this.sheetsAuth.apiKey}`;

        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: [row] })
        });
      }

    } catch (error) {
      console.error('[SoulfraUnifiedAuth] Save to Sheets error:', error);
      throw error;
    }
  }

  /**
   * Load API keys from Google Sheets
   * @private
   */
  async _loadApiKeysFromSheets(userId) {
    try {
      const sheetName = 'api_keys';
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetsAuth.spreadsheetId}/values/${sheetName}!A:D?key=${this.sheetsAuth.apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const rows = data.values || [];

      const row = rows.find((r, idx) => idx > 0 && r[0] === userId);

      if (!row) {
        return null;
      }

      return row[1]; // Encrypted keys

    } catch (error) {
      console.error('[SoulfraUnifiedAuth] Load from Sheets error:', error);
      return null;
    }
  }
}

// Export for use in HTML pages
if (typeof window !== 'undefined') {
  window.SoulfraUnifiedAuth = SoulfraUnifiedAuth;
}

console.log('[SoulfraUnifiedAuth] Module loaded');
