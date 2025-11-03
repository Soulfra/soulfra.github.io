/**
 * Google OAuth Handler (Simple)
 *
 * Uses Google Identity Services (new API, easier than OAuth2)
 * - "Sign in with Google" button
 * - Gets email, name, picture
 * - Saves to localStorage
 * - Saves to Google Sheets
 * - No backend needed
 *
 * @license AGPLv3
 * @version 1.0.0
 */

class GoogleOAuth {
  constructor(config = {}) {
    this.clientId = config.clientId || 'YOUR_GOOGLE_CLIENT_ID'; // Replace with your Client ID
    this.sheetsConfig = config.sheets || null; // { spreadsheetId, apiKey }

    this.isLoggedIn = false;
    this.currentUser = null;

    console.log('[GoogleOAuth] Initialized');
  }

  /**
   * Initialize Google Identity Services
   * Call this on page load
   */
  async init() {
    try {
      // Wait for Google script to load
      await this._waitForGoogle();

      console.log('[GoogleOAuth] Google Identity Services ready');

      return { success: true };

    } catch (error) {
      console.error('[GoogleOAuth] Init error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Render "Sign in with Google" button
   *
   * @param {string} elementId - ID of div to render button in
   */
  renderButton(elementId) {
    try {
      if (typeof google === 'undefined') {
        throw new Error('Google Identity Services not loaded');
      }

      // Initialize Google OAuth
      google.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response) => this._handleCredentialResponse(response)
      });

      // Render button
      google.accounts.id.renderButton(
        document.getElementById(elementId),
        {
          theme: 'filled_blue',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left'
        }
      );

      // Show One Tap prompt (optional)
      google.accounts.id.prompt();

      console.log('[GoogleOAuth] Button rendered');

    } catch (error) {
      console.error('[GoogleOAuth] Render button error:', error);
    }
  }

  /**
   * Handle credential response from Google
   * @private
   */
  async _handleCredentialResponse(response) {
    try {
      console.log('[GoogleOAuth] Received credential');

      // Decode JWT to get user info
      const user = this._parseJwt(response.credential);

      const userData = {
        email: user.email,
        name: user.name,
        picture: user.picture,
        userId: this._hashEmail(user.email),
        googleId: user.sub,
        createdAt: Date.now(),
        lastLogin: Date.now()
      };

      // Save to localStorage
      this._saveToLocalStorage(userData);

      // Set logged-in state
      this.isLoggedIn = true;
      this.currentUser = userData;

      // Save to Google Sheets (if configured)
      if (this.sheetsConfig) {
        await this._saveToSheets(userData);
      }

      console.log('[GoogleOAuth] Login successful:', userData.email);

      // Trigger success callback (if provided)
      if (window.onGoogleLoginSuccess) {
        window.onGoogleLoginSuccess(userData);
      }

      // Redirect to app (if no callback provided)
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect') || 'index.html';

      setTimeout(() => {
        window.location.href = redirect;
      }, 1000);

    } catch (error) {
      console.error('[GoogleOAuth] Handle credential error:', error);

      if (window.onGoogleLoginError) {
        window.onGoogleLoginError(error);
      }
    }
  }

  /**
   * Check if user is logged in
   */
  isAuthenticated() {
    if (this.isLoggedIn) {
      return true;
    }

    // Check localStorage
    const user = this._loadFromLocalStorage();
    if (user) {
      // Check session timeout (30 days)
      const timeSinceLogin = Date.now() - user.lastLogin;
      const SESSION_TIMEOUT = 30 * 24 * 60 * 60 * 1000;

      if (timeSinceLogin < SESSION_TIMEOUT) {
        this.isLoggedIn = true;
        this.currentUser = user;
        return true;
      } else {
        // Session expired
        this.logout();
        return false;
      }
    }

    return false;
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    if (!this.isAuthenticated()) {
      return null;
    }
    return this.currentUser;
  }

  /**
   * Logout
   */
  logout() {
    console.log('[GoogleOAuth] Logging out');

    this.isLoggedIn = false;
    this.currentUser = null;

    // Clear localStorage
    localStorage.removeItem('soulfra_google_user');
    localStorage.removeItem('soulfra_last_login');

    // Sign out from Google
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.disableAutoSelect();
    }

    console.log('[GoogleOAuth] Logged out');
  }

  /**
   * Save user to localStorage
   * @private
   */
  _saveToLocalStorage(user) {
    localStorage.setItem('soulfra_google_user', JSON.stringify(user));
    localStorage.setItem('soulfra_last_login', user.lastLogin.toString());
  }

  /**
   * Load user from localStorage
   * @private
   */
  _loadFromLocalStorage() {
    try {
      const userJson = localStorage.getItem('soulfra_google_user');
      if (!userJson) {
        return null;
      }
      return JSON.parse(userJson);
    } catch (error) {
      console.error('[GoogleOAuth] Load from localStorage error:', error);
      return null;
    }
  }

  /**
   * Save user to Google Sheets
   * @private
   */
  async _saveToSheets(user) {
    try {
      if (!this.sheetsConfig) {
        console.warn('[GoogleOAuth] Sheets not configured');
        return;
      }

      const { spreadsheetId, apiKey } = this.sheetsConfig;
      const sheetName = 'users';

      // Check if user already exists
      const existing = await this._getUserFromSheets(user.userId);

      if (existing) {
        // Update lastLogin
        await this._updateUserInSheets(user.userId, { lastLogin: user.lastLogin });
        console.log('[GoogleOAuth] Updated user in Sheets');
      } else {
        // Create new user
        const row = [
          user.userId,
          user.email,
          user.name,
          user.picture,
          user.googleId,
          user.createdAt,
          user.lastLogin,
          'google-oauth'
        ];

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A:H:append?valueInputOption=RAW&key=${apiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: [row] })
        });

        if (!response.ok) {
          throw new Error('Failed to save to Sheets');
        }

        console.log('[GoogleOAuth] Saved user to Sheets');
      }

    } catch (error) {
      console.error('[GoogleOAuth] Save to Sheets error:', error);
      // Don't fail login if Sheets save fails
    }
  }

  /**
   * Get user from Google Sheets
   * @private
   */
  async _getUserFromSheets(userId) {
    try {
      const { spreadsheetId, apiKey } = this.sheetsConfig;
      const sheetName = 'users';

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A:H?key=${apiKey}`;

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

      return {
        userId: row[0],
        email: row[1],
        name: row[2],
        picture: row[3],
        googleId: row[4],
        createdAt: parseInt(row[5]),
        lastLogin: parseInt(row[6]),
        source: row[7]
      };

    } catch (error) {
      console.error('[GoogleOAuth] Get from Sheets error:', error);
      return null;
    }
  }

  /**
   * Update user in Google Sheets
   * @private
   */
  async _updateUserInSheets(userId, updates) {
    try {
      const { spreadsheetId, apiKey } = this.sheetsConfig;
      const sheetName = 'users';

      // Get all rows
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A:H?key=${apiKey}`;

      const response = await fetch(url);
      const data = await response.json();
      const rows = data.values || [];

      const rowIndex = rows.findIndex((r, idx) => idx > 0 && r[0] === userId);

      if (rowIndex === -1) {
        throw new Error('User not found in Sheets');
      }

      const row = rows[rowIndex];

      // Apply updates
      if (updates.lastLogin) {
        row[6] = updates.lastLogin;
      }

      const rowNum = rowIndex + 1;
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A${rowNum}:H${rowNum}?valueInputOption=RAW&key=${apiKey}`;

      await fetch(updateUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [row] })
      });

    } catch (error) {
      console.error('[GoogleOAuth] Update in Sheets error:', error);
    }
  }

  /**
   * Parse JWT to get user info
   * @private
   */
  _parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('[GoogleOAuth] Parse JWT error:', error);
      throw error;
    }
  }

  /**
   * Hash email to create userId
   * @private
   */
  _hashEmail(email) {
    // Simple hash (not cryptographic, just for ID generation)
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'user_' + Math.abs(hash).toString(36);
  }

  /**
   * Wait for Google script to load
   * @private
   */
  _waitForGoogle() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max

      const check = () => {
        if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('Google Identity Services failed to load'));
        } else {
          attempts++;
          setTimeout(check, 100);
        }
      };

      check();
    });
  }
}

// Export
if (typeof window !== 'undefined') {
  window.GoogleOAuth = GoogleOAuth;
}

console.log('[GoogleOAuth] Module loaded');
