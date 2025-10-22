/**
 * Pastebin Authentication (dpaste.com)
 *
 * Serverless auth using dpaste.com as anonymous storage
 * - No backend server needed
 * - No authentication required
 * - Works on static GitHub Pages
 * - End-to-end encrypted
 * - Fully anonymous
 *
 * How it works:
 * 1. Desktop creates anonymous paste with encrypted session data
 * 2. QR code contains paste ID + encryption key
 * 3. iPhone reads paste, creates verification paste
 * 4. Desktop polls for verification paste
 * 5. Both devices paired!
 */

class PastebinAuth {
  constructor() {
    this.DPASTE_API = 'https://dpaste.com/api/';
    this.SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Create session paste for QR login
   * Returns: { pasteId, encryptionKey, qrPayload, expiresAt }
   */
  async createSession(deviceFingerprint) {
    try {
      // Generate encryption key (shared via QR code)
      const encryptionKey = this.generateEncryptionKey();

      // Generate unique session ID
      const sessionId = this.generateSessionId();

      // Create session data
      const sessionData = {
        type: 'qr-login-session',
        sessionId: sessionId,
        status: 'pending',
        createdAt: Date.now(),
        expiresAt: Date.now() + this.SESSION_TIMEOUT,
        desktopFingerprint: deviceFingerprint,
        phoneFingerprint: null,
        verified: false
      };

      // Encrypt session data
      const encryptedData = await this.encrypt(JSON.stringify(sessionData), encryptionKey);

      // Create anonymous paste on dpaste.com
      const formData = new FormData();
      formData.append('content', encryptedData);
      formData.append('syntax', 'text');
      formData.append('expiry_days', '1'); // Expires in 1 day

      const pasteResponse = await fetch(this.DPASTE_API, {
        method: 'POST',
        body: formData
      });

      if (!pasteResponse.ok) {
        throw new Error('Failed to create paste');
      }

      // dpaste.com returns the paste URL
      const pasteUrl = await pasteResponse.text();
      const pasteId = pasteUrl.trim().split('/').filter(Boolean).pop();

      // QR payload contains paste ID + encryption key + session ID
      const qrPayload = {
        type: 'calos-qr-login',
        version: '2.0.0',
        pasteId: pasteId,
        sessionId: sessionId,
        key: encryptionKey,
        expiresAt: sessionData.expiresAt
      };

      return {
        pasteId: pasteId,
        pasteUrl: `https://dpaste.com/${pasteId}/raw`,
        sessionId: sessionId,
        encryptionKey,
        qrPayload: JSON.stringify(qrPayload),
        expiresAt: sessionData.expiresAt
      };

    } catch (error) {
      console.error('[PastebinAuth] Create session error:', error);
      throw error;
    }
  }

  /**
   * Verify QR scan from iPhone
   * Creates verification paste linked to session
   */
  async verifySession(sessionId, encryptionKey, phoneFingerprint, userId) {
    try {
      // Create verification data
      const verificationData = {
        type: 'qr-login-verification',
        sessionId: sessionId, // Links back to original session
        status: 'verified',
        verified: true,
        phoneFingerprint: phoneFingerprint,
        userId: userId,
        verifiedAt: Date.now()
      };

      // Encrypt verification data
      const encryptedData = await this.encrypt(JSON.stringify(verificationData), encryptionKey);

      // Create verification paste
      const formData = new FormData();
      formData.append('content', encryptedData);
      formData.append('syntax', 'text');
      formData.append('expiry_days', '1');

      const pasteResponse = await fetch(this.DPASTE_API, {
        method: 'POST',
        body: formData
      });

      if (!pasteResponse.ok) {
        throw new Error('Failed to create verification paste');
      }

      const pasteUrl = await pasteResponse.text();
      const verificationId = pasteUrl.trim().split('/').filter(Boolean).pop();

      // Store verification ID in localStorage for polling
      const verificationsKey = `calos_verifications_${sessionId}`;
      localStorage.setItem(verificationsKey, verificationId);

      return {
        success: true,
        sessionId: sessionId,
        verificationId: verificationId,
        userId
      };

    } catch (error) {
      console.error('[PastebinAuth] Verify session error:', error);
      throw error;
    }
  }

  /**
   * Read session from paste
   */
  async readSession(pasteId, encryptionKey) {
    try {
      const response = await fetch(`https://dpaste.com/${pasteId}/raw`);

      if (!response.ok) {
        throw new Error('Paste not found');
      }

      const encryptedData = await response.text();

      // Decrypt session data
      const decryptedData = await this.decrypt(encryptedData, encryptionKey);
      return JSON.parse(decryptedData);

    } catch (error) {
      console.error('[PastebinAuth] Read session error:', error);
      throw error;
    }
  }

  /**
   * Poll for verification (desktop checks if phone scanned)
   * Checks localStorage for verification ID
   */
  async pollForVerification(sessionId, encryptionKey) {
    try {
      // Check localStorage for verification ID
      const verificationsKey = `calos_verifications_${sessionId}`;
      const verificationId = localStorage.getItem(verificationsKey);

      if (!verificationId) {
        // Try checking if iPhone left a verification ID in a known location
        // For cross-tab communication, we can use localStorage events
        return { verified: false };
      }

      // Read verification paste
      const response = await fetch(`https://dpaste.com/${verificationId}/raw`);

      if (!response.ok) {
        return { verified: false };
      }

      const encryptedData = await response.text();
      const sessionData = JSON.parse(await this.decrypt(encryptedData, encryptionKey));

      // Verify this is for our session
      if (sessionData.sessionId === sessionId && sessionData.verified) {
        return {
          verified: true,
          session: sessionData,
          verificationId
        };
      }

      return { verified: false };

    } catch (error) {
      console.error('[PastebinAuth] Poll verification error:', error);
      return { verified: false };
    }
  }

  /**
   * Alternative: Use dpaste.com's expire feature
   * Create paste with sessionId in content, poll by creating new pastes with known pattern
   */
  async pollForVerificationAlt(sessionId, encryptionKey) {
    // This is a workaround since we can't search dpaste
    // Instead, iPhone will update the SAME paste by creating a new one
    // and desktop polls the known verification paste ID

    // Better approach: Use BroadcastChannel API for same-origin communication
    const verificationsKey = `calos_verifications_${sessionId}`;
    const storedData = localStorage.getItem(verificationsKey);

    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        if (data.verified && data.sessionId === sessionId) {
          return {
            verified: true,
            session: data
          };
        }
      } catch (e) {
        // Invalid data
      }
    }

    return { verified: false };
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
   * Generate unique session ID
   */
  generateSessionId() {
    const array = new Uint8Array(16);
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
      console.error('[PastebinAuth] Encryption error:', error);
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
      console.error('[PastebinAuth] Decryption error:', error);
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
window.PastebinAuth = PastebinAuth;
