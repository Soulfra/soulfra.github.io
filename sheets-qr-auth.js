/**
 * Google Sheets QR Authentication (Browser Version)
 *
 * Serverless auth using Google Sheets as anonymous storage
 * - No backend server needed
 * - Works cross-device (desktop ↔ iPhone)
 * - No CORS issues
 * - Works on static GitHub Pages
 * - Free (10M cells, 100 requests/min)
 *
 * How it works:
 * 1. Desktop creates row in Google Sheets with session data
 * 2. QR code contains spreadsheet ID + session ID
 * 3. iPhone reads row, updates status to "verified"
 * 4. Desktop polls Google Sheets for status change
 * 5. Both devices paired!
 *
 * @version 1.0.0
 * @license MIT
 */

class SheetsQRAuth {
  constructor(config = {}) {
    // Public Google Sheet (anyone with link can view/edit)
    // Create your own at: sheets.google.com
    // Share → Anyone with link → Editor
    this.spreadsheetId = config.spreadsheetId || '1YourSpreadsheetIdHere';
    this.sheetName = config.sheetName || 'qr_sessions';
    this.apiKey = config.apiKey || 'YOUR_GOOGLE_API_KEY'; // Google API key with Sheets API enabled

    this.SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

    console.log('[SheetsQRAuth] Initialized');
  }

  /**
   * Create session for QR login
   * Returns: { sessionId, qrPayload, expiresAt }
   */
  async createSession(deviceFingerprint) {
    try {
      // Generate unique session ID
      const sessionId = this.generateSessionId();

      // Create session data
      const sessionData = {
        sessionId: sessionId,
        status: 'pending',
        createdAt: Date.now(),
        expiresAt: Date.now() + this.SESSION_TIMEOUT,
        desktopFingerprint: deviceFingerprint,
        phoneFingerprint: null,
        verified: false,
        userId: null
      };

      // Insert row into Google Sheets
      await this.insertRow(sessionData);

      // QR payload contains spreadsheet ID + session ID
      const qrPayload = {
        type: 'calos-qr-login',
        version: '3.0.0',
        spreadsheetId: this.spreadsheetId,
        sheetName: this.sheetName,
        sessionId: sessionId,
        expiresAt: sessionData.expiresAt
      };

      return {
        sessionId: sessionId,
        qrPayload: JSON.stringify(qrPayload),
        expiresAt: sessionData.expiresAt,
        sheetUrl: `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit#gid=0`
      };

    } catch (error) {
      console.error('[SheetsQRAuth] Create session error:', error);
      throw error;
    }
  }

  /**
   * Verify QR scan from iPhone
   * Updates session row to "verified"
   */
  async verifySession(sessionId, phoneFingerprint, userId) {
    try {
      // Update session row
      const updates = {
        status: 'verified',
        verified: true,
        phoneFingerprint: phoneFingerprint,
        userId: userId,
        verifiedAt: Date.now()
      };

      await this.updateRow(sessionId, updates);

      return {
        success: true,
        sessionId: sessionId,
        userId: userId
      };

    } catch (error) {
      console.error('[SheetsQRAuth] Verify session error:', error);
      throw error;
    }
  }

  /**
   * Poll for verification (desktop checks if phone scanned)
   */
  async pollForVerification(sessionId) {
    try {
      // Read session row from Google Sheets
      const session = await this.readRow(sessionId);

      if (!session) {
        return { verified: false, error: 'Session not found' };
      }

      // Check if expired
      if (Date.now() > session.expiresAt) {
        return { verified: false, error: 'Session expired' };
      }

      // Check if verified
      if (session.verified && session.status === 'verified') {
        return {
          verified: true,
          session: session
        };
      }

      return { verified: false };

    } catch (error) {
      console.error('[SheetsQRAuth] Poll verification error:', error);
      return { verified: false, error: error.message };
    }
  }

  /**
   * Insert row into Google Sheets using REST API
   * @private
   */
  async insertRow(data) {
    try {
      // Convert data to row array
      const row = [
        data.sessionId,
        data.status,
        data.createdAt,
        data.expiresAt,
        data.desktopFingerprint || '',
        data.phoneFingerprint || '',
        data.verified ? 'true' : 'false',
        data.userId || '',
        data.verifiedAt || ''
      ];

      // Append row using Google Sheets API v4
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${this.sheetName}!A:I:append?valueInputOption=RAW&key=${this.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [row]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to insert row: ${error.error?.message || response.statusText}`);
      }

      console.log('[SheetsQRAuth] Inserted session:', data.sessionId);
      return await response.json();

    } catch (error) {
      console.error('[SheetsQRAuth] Insert row error:', error);
      throw error;
    }
  }

  /**
   * Read row from Google Sheets
   * @private
   */
  async readRow(sessionId) {
    try {
      // Get all rows
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${this.sheetName}!A:I?key=${this.apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to read rows: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const rows = data.values || [];

      if (rows.length === 0) {
        return null;
      }

      // Find row with matching sessionId (column A)
      const rowIndex = rows.findIndex((row, idx) => idx > 0 && row[0] === sessionId);

      if (rowIndex === -1) {
        return null;
      }

      const row = rows[rowIndex];

      // Parse row data
      return {
        sessionId: row[0],
        status: row[1],
        createdAt: parseInt(row[2]),
        expiresAt: parseInt(row[3]),
        desktopFingerprint: row[4],
        phoneFingerprint: row[5],
        verified: row[6] === 'true',
        userId: row[7],
        verifiedAt: row[8] ? parseInt(row[8]) : null,
        _rowIndex: rowIndex
      };

    } catch (error) {
      console.error('[SheetsQRAuth] Read row error:', error);
      throw error;
    }
  }

  /**
   * Update row in Google Sheets
   * @private
   */
  async updateRow(sessionId, updates) {
    try {
      // First, read the row to get its index
      const session = await this.readRow(sessionId);

      if (!session) {
        throw new Error('Session not found');
      }

      // Build updated row
      const updatedRow = [
        session.sessionId,
        updates.status || session.status,
        session.createdAt,
        session.expiresAt,
        session.desktopFingerprint,
        updates.phoneFingerprint || session.phoneFingerprint,
        (updates.verified !== undefined ? updates.verified : session.verified) ? 'true' : 'false',
        updates.userId || session.userId,
        updates.verifiedAt || session.verifiedAt || ''
      ];

      // Update row using Google Sheets API v4
      const rowNum = session._rowIndex + 1; // Convert to 1-indexed
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${this.sheetName}!A${rowNum}:I${rowNum}?valueInputOption=RAW&key=${this.apiKey}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [updatedRow]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to update row: ${error.error?.message || response.statusText}`);
      }

      console.log('[SheetsQRAuth] Updated session:', sessionId);
      return await response.json();

    } catch (error) {
      console.error('[SheetsQRAuth] Update row error:', error);
      throw error;
    }
  }

  /**
   * Generate unique session ID
   * @private
   */
  generateSessionId() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

// Export for use in HTML pages
window.SheetsQRAuth = SheetsQRAuth;
