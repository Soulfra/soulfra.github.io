/**
 * GitHub Gist Authentication
 *
 * Serverless auth using GitHub Gists as distributed database
 * - No backend server needed
 * - Works on static GitHub Pages
 * - End-to-end encrypted
 * - Fully distributed
 *
 * How it works:
 * 1. Desktop creates anonymous Gist with session data
 * 2. QR code contains Gist ID + encryption key
 * 3. iPhone reads Gist, updates with auth data
 * 4. Desktop polls Gist for changes
 * 5. Both devices paired!
 */

class GitHubGistAuth {
  constructor() {
    this.GIST_API = 'https://api.github.com/gists';
    this.SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Create session Gist for QR login
   * Returns: { gistId, encryptionKey, qrPayload, expiresAt }
   */
  async createSession(deviceFingerprint) {
    try {
      // Generate encryption key (shared via QR code)
      const encryptionKey = this.generateEncryptionKey();

      // Create session data
      const sessionData = {
        type: 'qr-login-session',
        status: 'pending',
        createdAt: Date.now(),
        expiresAt: Date.now() + this.SESSION_TIMEOUT,
        desktopFingerprint: deviceFingerprint,
        phoneFingerprint: null,
        verified: false
      };

      // Encrypt session data
      const encryptedData = await this.encrypt(JSON.stringify(sessionData), encryptionKey);

      // Create anonymous public Gist
      const gistResponse = await fetch(this.GIST_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          description: 'CalOS QR Login Session',
          public: true, // Public but encrypted
          files: {
            'session.json': {
              content: encryptedData
            }
          }
        })
      });

      if (!gistResponse.ok) {
        throw new Error('Failed to create Gist');
      }

      const gist = await gistResponse.json();

      // QR payload contains Gist ID + encryption key
      const qrPayload = {
        type: 'calos-qr-login',
        version: '1.0.0',
        gistId: gist.id,
        key: encryptionKey,
        expiresAt: sessionData.expiresAt
      };

      return {
        gistId: gist.id,
        gistUrl: gist.html_url,
        encryptionKey,
        qrPayload: JSON.stringify(qrPayload),
        expiresAt: sessionData.expiresAt
      };

    } catch (error) {
      console.error('[GistAuth] Create session error:', error);
      throw error;
    }
  }

  /**
   * Verify QR scan from iPhone
   * Updates Gist with phone fingerprint
   */
  async verifySession(gistId, encryptionKey, phoneFingerprint, userId) {
    try {
      // Read current session from Gist
      const sessionData = await this.readSession(gistId, encryptionKey);

      // Check if expired
      if (Date.now() > sessionData.expiresAt) {
        throw new Error('Session expired');
      }

      // Check if already verified
      if (sessionData.verified) {
        throw new Error('Session already verified');
      }

      // Update session with phone data
      sessionData.status = 'verified';
      sessionData.verified = true;
      sessionData.phoneFingerprint = phoneFingerprint;
      sessionData.userId = userId;
      sessionData.verifiedAt = Date.now();

      // Encrypt updated session
      const encryptedData = await this.encrypt(JSON.stringify(sessionData), encryptionKey);

      // Update Gist (anonymous, no auth needed for our use case)
      // Note: GitHub doesn't allow anonymous updates, so we store the update
      // in a comment instead (which can be done anonymously)

      // Alternative: Use query params or create new public Gist
      // For now, we'll use a workaround: store verification in QR payload itself

      // Actually, let's use a different approach:
      // Phone creates its own Gist with verification data
      const verificationGist = await fetch(this.GIST_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          description: `CalOS QR Login Verification - ${gistId}`,
          public: true,
          files: {
            'verification.json': {
              content: encryptedData
            },
            'parent-session.txt': {
              content: gistId // Link back to original session
            }
          }
        })
      });

      if (!verificationGist.ok) {
        throw new Error('Failed to create verification Gist');
      }

      const verification = await verificationGist.json();

      return {
        success: true,
        sessionGistId: gistId,
        verificationGistId: verification.id,
        userId
      };

    } catch (error) {
      console.error('[GistAuth] Verify session error:', error);
      throw error;
    }
  }

  /**
   * Read session from Gist
   */
  async readSession(gistId, encryptionKey) {
    try {
      const response = await fetch(`${this.GIST_API}/${gistId}`);

      if (!response.ok) {
        throw new Error('Gist not found');
      }

      const gist = await response.json();
      const encryptedData = gist.files['session.json'].content;

      // Decrypt session data
      const decryptedData = await this.decrypt(encryptedData, encryptionKey);
      return JSON.parse(decryptedData);

    } catch (error) {
      console.error('[GistAuth] Read session error:', error);
      throw error;
    }
  }

  /**
   * Poll for verification (desktop checks if phone scanned)
   * Looks for verification Gist linked to this session
   */
  async pollForVerification(gistId, encryptionKey) {
    try {
      // Search for verification Gists linked to this session
      // GitHub's search API allows anonymous access
      const searchQuery = `CalOS QR Login Verification - ${gistId}`;
      const searchUrl = `https://api.github.com/search/code?q=${encodeURIComponent(searchQuery)}`;

      const response = await fetch(searchUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        return { verified: false };
      }

      const results = await response.json();

      // If we found a verification Gist
      if (results.total_count > 0) {
        const verificationGistUrl = results.items[0].repository.url;
        const verificationGistId = verificationGistUrl.split('/').pop();

        // Read verification Gist
        const verificationResponse = await fetch(`${this.GIST_API}/${verificationGistId}`);
        const verificationGist = await verificationResponse.json();

        const encryptedData = verificationGist.files['verification.json'].content;
        const sessionData = JSON.parse(await this.decrypt(encryptedData, encryptionKey));

        return {
          verified: true,
          session: sessionData,
          verificationGistId
        };
      }

      return { verified: false };

    } catch (error) {
      console.error('[GistAuth] Poll verification error:', error);
      return { verified: false };
    }
  }

  /**
   * Generate random encryption key
   */
  generateEncryptionKey() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Encrypt data using Web Crypto API
   */
  async encrypt(data, keyHex) {
    try {
      // Convert hex key to bytes
      const keyBytes = new Uint8Array(keyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

      // Import key
      const key = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );

      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(data)
      );

      // Combine IV + encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Return as base64
      return btoa(String.fromCharCode(...combined));

    } catch (error) {
      console.error('[GistAuth] Encryption error:', error);
      throw error;
    }
  }

  /**
   * Decrypt data using Web Crypto API
   */
  async decrypt(encryptedBase64, keyHex) {
    try {
      // Convert base64 to bytes
      const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      // Convert hex key to bytes
      const keyBytes = new Uint8Array(keyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

      // Import key
      const key = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      return new TextDecoder().decode(decrypted);

    } catch (error) {
      console.error('[GistAuth] Decryption error:', error);
      throw error;
    }
  }

  /**
   * Generate QR code from payload
   */
  async generateQRCode(payload) {
    // Use QRCode library (loaded via CDN)
    if (typeof QRCode === 'undefined') {
      throw new Error('QRCode library not loaded');
    }

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      QRCode.toCanvas(canvas, payload, {
        width: 300,
        margin: 2,
        color: {
          dark: '#667eea',
          light: '#ffffff'
        }
      }, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve(canvas.toDataURL());
        }
      });
    });
  }
}

// Export for use in HTML pages
window.GitHubGistAuth = GitHubGistAuth;
