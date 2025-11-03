/**
 * Email Auto-Filer
 *
 * Parses email replies from daily check-ins and auto-files into folders:
 * - ideas/ - Brainstorms, feature requests, "what if" thinking
 * - code-reviews/ - Code snippets, technical decisions, architecture
 * - todos/ - Tasks, blockers, things to do
 * - wins/ - Completed work, shipped features, achievements
 *
 * Uses keyword detection + code snippet analysis
 *
 * @license AGPLv3
 * @version 1.0.0
 */

class EmailFiler {
  constructor(sheetsAuth) {
    this.sheets = sheetsAuth;

    // Detection patterns for each folder
    this.patterns = {
      ideas: {
        keywords: [
          'idea', 'thought', 'what if', 'could we', 'maybe',
          'brainstorm', 'consider', 'thinking about', 'wondering',
          'feature request', 'wish', 'want to build', 'imagining'
        ],
        weight: 1
      },
      code: {
        keywords: [
          'function', 'class', 'const', 'let', 'var', 'import',
          'export', 'async', 'await', '```', 'code', 'snippet',
          'refactor', 'implement', 'bug fix', 'technical', 'architecture'
        ],
        weight: 2, // Higher weight = prioritize this category
        hasCodeBlock: true
      },
      todos: {
        keywords: [
          'todo', 'need to', 'have to', 'must', 'should',
          'blocker', 'blocked', 'stuck', 'issue', 'problem',
          'fix', 'update', 'add', 'remove', 'change'
        ],
        weight: 1
      },
      wins: {
        keywords: [
          'done', 'completed', 'finished', 'shipped', 'deployed',
          'launched', 'fixed', 'solved', 'working', 'success',
          'built', 'created', 'implemented', 'achieved', 'win'
        ],
        weight: 2
      }
    };

    console.log('[EmailFiler] Initialized');
  }

  /**
   * Analyze and file email content
   */
  async fileEmail(data) {
    try {
      const {
        userId,
        email,
        subject,
        body,
        timestamp = Date.now()
      } = data;

      if (!userId || !body) {
        throw new Error('userId and body required');
      }

      // Detect category
      const analysis = this.analyzeContent(body);
      const category = analysis.category;

      // Save to appropriate folder
      await this._saveToFolder(category, {
        userId,
        email,
        subject,
        body,
        timestamp,
        keywords: analysis.keywords,
        score: analysis.score
      });

      console.log('[EmailFiler] Filed email to:', category);

      return {
        success: true,
        category,
        analysis
      };

    } catch (error) {
      console.error('[EmailFiler] File email error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Analyze email content to determine category
   */
  analyzeContent(text) {
    const lower = text.toLowerCase();
    const scores = {};
    const matchedKeywords = {};

    // Check each category
    for (const [category, config] of Object.entries(this.patterns)) {
      let score = 0;
      const keywords = [];

      // Check for code blocks (if applicable)
      if (config.hasCodeBlock) {
        if (text.includes('```') || text.includes('function') || text.includes('class')) {
          score += 10;
          keywords.push('code-block-detected');
        }
      }

      // Check keywords
      for (const keyword of config.keywords) {
        if (lower.includes(keyword)) {
          score += config.weight;
          keywords.push(keyword);
        }
      }

      scores[category] = score;
      matchedKeywords[category] = keywords;
    }

    // Get category with highest score
    let maxScore = 0;
    let bestCategory = 'ideas'; // default

    for (const [category, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        bestCategory = category;
      }
    }

    return {
      category: bestCategory,
      score: maxScore,
      allScores: scores,
      keywords: matchedKeywords[bestCategory]
    };
  }

  /**
   * Get all items from a folder
   */
  async getFolder(userId, category) {
    try {
      const sheetName = this._getFolderSheetName(category);
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/${sheetName}!A:G?key=${this.sheets.apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const rows = data.values || [];

      // Filter user's items
      const items = rows
        .slice(1)
        .filter(r => r[0] === userId)
        .map(r => ({
          userId: r[0],
          email: r[1],
          subject: r[2],
          body: r[3],
          timestamp: parseInt(r[4]),
          keywords: JSON.parse(r[5] || '[]'),
          score: parseInt(r[6]) || 0
        }));

      // Sort by timestamp (newest first)
      items.sort((a, b) => b.timestamp - a.timestamp);

      return items;

    } catch (error) {
      console.error('[EmailFiler] Get folder error:', error);
      return [];
    }
  }

  /**
   * Get summary stats for all folders
   */
  async getFolderStats(userId) {
    try {
      const stats = {};

      for (const category of ['ideas', 'code', 'todos', 'wins']) {
        const items = await this.getFolder(userId, category);
        stats[category] = {
          count: items.length,
          recent: items.slice(0, 5) // 5 most recent
        };
      }

      return stats;

    } catch (error) {
      console.error('[EmailFiler] Get folder stats error:', error);
      return null;
    }
  }

  /**
   * Get recent activity (last 7 days)
   */
  async getRecentActivity(userId, days = 7) {
    try {
      const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
      const activity = [];

      for (const category of ['ideas', 'code', 'todos', 'wins']) {
        const items = await this.getFolder(userId, category);

        const recent = items.filter(item => item.timestamp > cutoff);

        activity.push({
          category,
          count: recent.length,
          items: recent
        });
      }

      return activity;

    } catch (error) {
      console.error('[EmailFiler] Get recent activity error:', error);
      return [];
    }
  }

  /**
   * Search across all folders
   */
  async search(userId, query) {
    try {
      const lower = query.toLowerCase();
      const results = [];

      for (const category of ['ideas', 'code', 'todos', 'wins']) {
        const items = await this.getFolder(userId, category);

        const matches = items.filter(item => {
          return item.subject.toLowerCase().includes(lower) ||
                 item.body.toLowerCase().includes(lower);
        });

        if (matches.length > 0) {
          results.push({
            category,
            count: matches.length,
            items: matches
          });
        }
      }

      return results;

    } catch (error) {
      console.error('[EmailFiler] Search error:', error);
      return [];
    }
  }

  /**
   * Move item to different folder
   */
  async moveItem(userId, itemId, fromCategory, toCategory) {
    try {
      // Get item from source folder
      const items = await this.getFolder(userId, fromCategory);
      const item = items.find(i => i.timestamp === itemId);

      if (!item) {
        return { success: false, reason: 'not_found' };
      }

      // Save to destination folder
      await this._saveToFolder(toCategory, item);

      // Delete from source folder (TODO: implement delete)

      console.log('[EmailFiler] Moved item:', fromCategory, '→', toCategory);

      return { success: true };

    } catch (error) {
      console.error('[EmailFiler] Move item error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save to folder in Sheets
   * @private
   */
  async _saveToFolder(category, data) {
    const {
      userId,
      email,
      subject,
      body,
      timestamp,
      keywords,
      score
    } = data;

    const sheetName = this._getFolderSheetName(category);

    const row = [
      userId,
      email,
      subject || '',
      body,
      timestamp,
      JSON.stringify(keywords || []),
      score || 0
    ];

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/${sheetName}!A:G:append?valueInputOption=RAW&key=${this.sheets.apiKey}`;

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] })
    });
  }

  /**
   * Get sheet name for folder
   * @private
   */
  _getFolderSheetName(category) {
    const mapping = {
      'ideas': 'folder_ideas',
      'code': 'folder_code_reviews',
      'todos': 'folder_todos',
      'wins': 'folder_wins'
    };
    return mapping[category] || 'folder_ideas';
  }

  /**
   * Initialize folder tables
   */
  async initTables() {
    try {
      const headers = ['userId', 'email', 'subject', 'body', 'timestamp', 'keywords', 'score'];

      for (const category of ['ideas', 'code', 'todos', 'wins']) {
        const sheetName = this._getFolderSheetName(category);
        await this._initTable(sheetName, headers);
      }

      console.log('[EmailFiler] Tables initialized');

      return { success: true };

    } catch (error) {
      console.error('[EmailFiler] Init tables error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize single table
   * @private
   */
  async _initTable(sheetName, headers) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/${sheetName}!A1:G1?key=${this.sheets.apiKey}`;

    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      if (data.values && data.values.length > 0) {
        console.log(`[EmailFiler] Table ${sheetName} already exists`);
        return;
      }
    }

    // Create header
    const createUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheets.spreadsheetId}/values/${sheetName}!A1:G1?valueInputOption=RAW&key=${this.sheets.apiKey}`;

    await fetch(createUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [headers] })
    });
  }
}

// Export
if (typeof window !== 'undefined') {
  window.EmailFiler = EmailFiler;
}

console.log('[EmailFiler] Module loaded');
