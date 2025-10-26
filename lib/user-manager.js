/**
 * User Manager for Google Sheets
 *
 * Stores users in Google Sheets `users` table:
 * - userId (Ed25519 public key hash)
 * - email
 * - name
 * - publicKey
 * - createdAt
 * - lastLogin
 * - source (e.g., "auth-page", "yc-waitlist")
 *
 * @license AGPLv3
 * @version 1.0.0
 */

class UserManager {
  constructor(sheetsAuth) {
    this.sheets = sheetsAuth;
    this.sheetName = 'users';

    console.log('[UserManager] Initialized');
  }

  /**
   * Create new user in Google Sheets
   */
  async createUser(userData) {
    try {
      const {
        userId,
        email,
        name,
        publicKey,
        source = 'auth-page'
      } = userData;

      if (!userId || !email) {
        throw new Error('userId and email are required');
      }

      // Check if user already exists
      const existing = await this.getUser(userId);
      if (existing) {
        console.log('[UserManager] User already exists:', userId);
        return { success: false, reason: 'exists', user: existing };
      }

      const row = [
        userId,
        email,
        name || '',
        publicKey || '',
        Date.now(),        // createdAt
        Date.now(),        // lastLogin
        source
      ];

      const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + this.sheets.spreadsheetId + '/values/' + this.sheetName + '!A:G:append?valueInputOption=RAW&key=' + this.sheets.apiKey;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [row] })
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMsg = (error.error && error.error.message) || response.statusText;
        throw new Error('Failed to create user: ' + errorMsg);
      }

      console.log('[UserManager] User created:', userId);

      return {
        success: true,
        user: {
          userId,
          email,
          name,
          publicKey,
          createdAt: Date.now(),
          lastLogin: Date.now(),
          source
        }
      };

    } catch (error) {
      console.error('[UserManager] Create user error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user by userId
   */
  async getUser(userId) {
    try {
      const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + this.sheets.spreadsheetId + '/values/' + this.sheetName + '!A:G?key=' + this.sheets.apiKey;

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
        publicKey: row[3],
        createdAt: parseInt(row[4]),
        lastLogin: parseInt(row[5]),
        source: row[6]
      };

    } catch (error) {
      console.error('[UserManager] Get user error:', error);
      return null;
    }
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId) {
    try {
      const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + this.sheets.spreadsheetId + '/values/' + this.sheetName + '!A:G?key=' + this.sheets.apiKey;

      const response = await fetch(url);
      const data = await response.json();
      const rows = data.values || [];

      const rowIndex = rows.findIndex((r, idx) => idx > 0 && r[0] === userId);

      if (rowIndex === -1) {
        return { success: false, reason: 'not_found' };
      }

      const row = rows[rowIndex];
      row[5] = Date.now(); // Update lastLogin

      const rowNum = rowIndex + 1;
      const updateUrl = 'https://sheets.googleapis.com/v4/spreadsheets/' + this.sheets.spreadsheetId + '/values/' + this.sheetName + '!A' + rowNum + ':G' + rowNum + '?valueInputOption=RAW&key=' + this.sheets.apiKey;

      await fetch(updateUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [row] })
      });

      console.log('[UserManager] Last login updated:', userId);

      return { success: true };

    } catch (error) {
      console.error('[UserManager] Update last login error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get total user count
   */
  async getUserCount() {
    try {
      const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + this.sheets.spreadsheetId + '/values/' + this.sheetName + '!A:A?key=' + this.sheets.apiKey;

      const response = await fetch(url);

      if (!response.ok) {
        return 0;
      }

      const data = await response.json();
      const rows = data.values || [];

      // Subtract 1 for header row
      return Math.max(0, rows.length - 1);

    } catch (error) {
      console.error('[UserManager] Get user count error:', error);
      return 0;
    }
  }

  /**
   * Get recent users (for admin dashboard)
   */
  async getRecentUsers(limit = 10) {
    try {
      const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + this.sheets.spreadsheetId + '/values/' + this.sheetName + '!A:G?key=' + this.sheets.apiKey;

      const response = await fetch(url);

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const rows = data.values || [];

      // Skip header row, take last N rows
      const userRows = rows.slice(1).slice(-limit).reverse();

      return userRows.map(row => ({
        userId: row[0],
        email: row[1],
        name: row[2],
        publicKey: row[3],
        createdAt: parseInt(row[4]),
        lastLogin: parseInt(row[5]),
        source: row[6]
      }));

    } catch (error) {
      console.error('[UserManager] Get recent users error:', error);
      return [];
    }
  }

  /**
   * Initialize users table (create if doesn't exist)
   */
  async initTable() {
    try {
      // Try to read existing table
      const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + this.sheets.spreadsheetId + '/values/' + this.sheetName + '!A1:G1?key=' + this.sheets.apiKey;

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        if (data.values && data.values.length > 0) {
          console.log('[UserManager] Table already exists');
          return { success: true, exists: true };
        }
      }

      // Create header row
      const header = ['userId', 'email', 'name', 'publicKey', 'createdAt', 'lastLogin', 'source'];

      const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets/' + this.sheets.spreadsheetId + '/values/' + this.sheetName + '!A1:G1?valueInputOption=RAW&key=' + this.sheets.apiKey;

      await fetch(createUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [header] })
      });

      console.log('[UserManager] Table initialized with header row');

      return { success: true, exists: false };

    } catch (error) {
      console.error('[UserManager] Init table error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export for use in HTML pages
if (typeof window !== 'undefined') {
  window.UserManager = UserManager;
}

console.log('[UserManager] Module loaded');
