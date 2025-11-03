/**
 * Daily Accountability Bot
 *
 * Sends 2 emails per day:
 * - Morning (9am): "What are you building today?"
 * - Evening (9pm): "What did you ship today?"
 *
 * Uses Gmail Relay for zero-cost email automation
 *
 * @license AGPLv3
 * @version 1.0.0
 */

class DailyAccountability {
  constructor(gmailRelay, sheetsAuth) {
    this.gmail = gmailRelay;
    this.sheets = sheetsAuth;
    this.sheetName = 'accountability_log';

    console.log('[DailyAccountability] Initialized');
  }

  /**
   * Send morning check-in email
   */
  async sendMorningEmail(userId, email, name = '') {
    try {
      const greeting = name ? `Hey ${name}` : 'Hey';

      const subject = '🌅 Morning Check-in: What are you building today?';
      const body = `${greeting},

It's Cal. Daily check-in time.

**What are you building today?**

Just reply to this email with:
- Your main goal for today
- What you're excited about
- Any blockers

I'll auto-file your response and check back tonight to see what you shipped.

Let's build something.

—Cal
Daily Accountability Bot
`;

      const result = await this.gmail.send({
        to: email,
        subject,
        body
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Log to Sheets
      await this._logCheckIn({
        userId,
        email,
        type: 'morning',
        sentAt: Date.now(),
        responded: false
      });

      console.log('[DailyAccountability] Morning email sent:', email);

      return { success: true };

    } catch (error) {
      console.error('[DailyAccountability] Morning email error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send evening check-in email
   */
  async sendEveningEmail(userId, email, name = '') {
    try {
      const greeting = name ? `Hey ${name}` : 'Hey';

      const subject = '🌙 Evening Check-in: What did you ship today?';
      const body = `${greeting},

End of day check-in.

**What did you ship today?**

Reply with:
- What you built/completed
- Code you're proud of (paste snippets!)
- Wins (big or small)
- What you learned

Tomorrow morning, I'll ask what you're building next.

Keep shipping.

—Cal
Daily Accountability Bot
`;

      const result = await this.gmail.send({
        to: email,
        subject,
        body
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Log to Sheets
      await this._logCheckIn({
        userId,
        email,
        type: 'evening',
        sentAt: Date.now(),
        responded: false
      });

      console.log('[DailyAccountability] Evening email sent:', email);

      return { success: true };

    } catch (error) {
      console.error('[DailyAccountability] Evening email error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Schedule daily emails for user
   */
  async scheduleEmails(userId, email, name = '', timezone = 'America/Los_Angeles') {
    try {
      // Get user's schedule preferences
      const schedule = await this.getSchedule(userId);

      if (!schedule) {
        // Create default schedule
        await this._createSchedule({
          userId,
          email,
          name,
          morningTime: '09:00',
          eveningTime: '21:00',
          timezone,
          enabled: true
        });
      }

      console.log('[DailyAccountability] Schedule created for:', email);

      return { success: true };

    } catch (error) {
      console.error('[DailyAccountability] Schedule error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's schedule
   */
  async getSchedule(userId) {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/accountability_schedules!A:G?key=${this.sheets.apiKey}`;

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
        morningTime: row[3],
        eveningTime: row[4],
        timezone: row[5],
        enabled: row[6] === 'true'
      };

    } catch (error) {
      console.error('[DailyAccountability] Get schedule error:', error);
      return null;
    }
  }

  /**
   * Get check-in streak (consecutive days responded)
   */
  async getStreak(userId) {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/${this.sheetName}!A:F?key=${this.sheets.apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        return { streak: 0, total: 0 };
      }

      const data = await response.json();
      const rows = data.values || [];

      // Filter user's check-ins
      const userRows = rows.filter((r, idx) => idx > 0 && r[0] === userId);

      // Count total responded
      const total = userRows.filter(r => r[4] === 'true').length;

      // Calculate streak (consecutive days with at least 1 response)
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];

        const dayResponses = userRows.filter(r => {
          const sentDate = new Date(parseInt(r[3]));
          return sentDate.toISOString().split('T')[0] === dateStr && r[4] === 'true';
        });

        if (dayResponses.length > 0) {
          streak++;
        } else {
          break;
        }
      }

      return { streak, total };

    } catch (error) {
      console.error('[DailyAccountability] Get streak error:', error);
      return { streak: 0, total: 0 };
    }
  }

  /**
   * Mark check-in as responded
   */
  async markResponded(userId, type, responseText) {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/${this.sheetName}!A:F?key=${this.sheets.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();
      const rows = data.values || [];

      // Find most recent unresp check-in of this type
      const rowIndex = rows.findIndex((r, idx) => {
        return idx > 0 &&
               r[0] === userId &&
               r[2] === type &&
               r[4] !== 'true';
      });

      if (rowIndex === -1) {
        return { success: false, reason: 'not_found' };
      }

      const row = rows[rowIndex];
      row[4] = 'true'; // responded
      row[5] = Date.now(); // respondedAt

      const rowNum = rowIndex + 1;
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/${this.sheetName}!A${rowNum}:F${rowNum}?valueInputOption=RAW&key=${this.sheets.apiKey}`;

      await fetch(updateUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [row] })
      });

      console.log('[DailyAccountability] Marked responded:', type);

      return { success: true };

    } catch (error) {
      console.error('[DailyAccountability] Mark responded error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Log check-in to Sheets
   * @private
   */
  async _logCheckIn(data) {
    const { userId, email, type, sentAt, responded } = data;

    const row = [
      userId,
      email,
      type,
      sentAt,
      responded,
      '' // respondedAt (empty until they respond)
    ];

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/${this.sheetName}!A:F:append?valueInputOption=RAW&key=${this.sheets.apiKey}`;

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] })
    });
  }

  /**
   * Create schedule in Sheets
   * @private
   */
  async _createSchedule(data) {
    const { userId, email, name, morningTime, eveningTime, timezone, enabled } = data;

    const row = [
      userId,
      email,
      name,
      morningTime,
      eveningTime,
      timezone,
      enabled.toString()
    ];

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/accountability_schedules!A:G:append?valueInputOption=RAW&key=${this.sheets.apiKey}`;

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] })
    });
  }

  /**
   * Initialize tables
   */
  async initTables() {
    try {
      // Create accountability_log table
      await this._initTable(
        this.sheetName,
        ['userId', 'email', 'type', 'sentAt', 'responded', 'respondedAt']
      );

      // Create accountability_schedules table
      await this._initTable(
        'accountability_schedules',
        ['userId', 'email', 'name', 'morningTime', 'eveningTime', 'timezone', 'enabled']
      );

      console.log('[DailyAccountability] Tables initialized');

      return { success: true };

    } catch (error) {
      console.error('[DailyAccountability] Init tables error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize single table
   * @private
   */
  async _initTable(sheetName, headers) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/${sheetName}!A1:${String.fromCharCode(64 + headers.length)}1?key=${this.sheets.apiKey}`;

    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      if (data.values && data.values.length > 0) {
        console.log(`[DailyAccountability] Table ${sheetName} already exists`);
        return;
      }
    }

    // Create header
    const createUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/${sheetName}!A1:${String.fromCharCode(64 + headers.length)}1?valueInputOption=RAW&key=${this.sheets.apiKey}`;

    await fetch(createUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [headers] })
    });
  }
}

// Export
if (typeof window !== 'undefined') {
  window.DailyAccountability = DailyAccountability;
}

console.log('[DailyAccountability] Module loaded');
