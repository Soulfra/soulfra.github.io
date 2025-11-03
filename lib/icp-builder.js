/**
 * ICP Builder (Ideal Customer Profile)
 *
 * Profiles visitors based on:
 * - Questions asked (voice consultant)
 * - Tools used
 * - Repos explored
 * - Skills mentioned
 * - Engagement patterns
 *
 * Builds talent pipeline for bounty matching
 *
 * @license AGPLv3
 * @version 1.0.0
 */

class ICPBuilder {
  constructor(sheetsAuth) {
    this.sheets = sheetsAuth;
    this.sheetName = 'talent_pipeline';

    // Skill keywords for auto-detection
    this.skillKeywords = {
      'react': ['react', 'jsx', 'hooks', 'component'],
      'node': ['node', 'nodejs', 'express', 'npm'],
      'python': ['python', 'django', 'flask', 'pandas'],
      'ai': ['ai', 'ml', 'machine learning', 'llm', 'gpt', 'claude'],
      'devops': ['docker', 'kubernetes', 'ci/cd', 'deployment'],
      'security': ['security', 'encryption', 'auth', 'cryptography'],
      'frontend': ['frontend', 'ui', 'ux', 'css', 'html'],
      'backend': ['backend', 'api', 'database', 'server'],
      'fullstack': ['fullstack', 'full stack', 'full-stack'],
      'mobile': ['mobile', 'ios', 'android', 'react native']
    };

    console.log('[ICPBuilder] Initialized');
  }

  /**
   * Create or update visitor profile
   */
  async trackVisitor(data) {
    try {
      const {
        userId,
        email,
        name,
        interaction,  // { type: 'voice', 'github', 'tool', data: {...} }
        source = 'website'
      } = data;

      if (!userId) {
        throw new Error('userId required');
      }

      // Get existing profile or create new
      let profile = await this.getProfile(userId);

      if (!profile) {
        profile = await this.createProfile({
          userId,
          email: email || '',
          name: name || '',
          source
        });
      }

      // Add interaction
      if (interaction) {
        await this.addInteraction(userId, interaction);
      }

      // Update engagement score
      await this.updateEngagement(userId);

      console.log('[ICPBuilder] Tracked visitor:', userId);

      return { success: true, profile };

    } catch (error) {
      console.error('[ICPBuilder] Track visitor error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create new profile
   */
  async createProfile(data) {
    try {
      const {
        userId,
        email,
        name,
        source
      } = data;

      const row = [
        userId,
        email,
        name,
        '',                    // skills (JSON array)
        '',                    // interests (JSON array)
        'exploring',           // lookingFor (exploring, job, cofounder, learning)
        0,                     // engagementScore
        source,
        '[]',                  // interactions (JSON array)
        Date.now(),           // createdAt
        Date.now()            // lastActive
      ];

      const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + this.sheets.spreadsheetId + '/values/' + this.sheetName + '!A:K:append?valueInputOption=RAW&key=' + this.sheets.apiKey;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [row] })
      });

      if (!response.ok) {
        throw new Error('Failed to create profile');
      }

      console.log('[ICPBuilder] Profile created:', userId);

      return {
        userId,
        email,
        name,
        skills: [],
        interests: [],
        lookingFor: 'exploring',
        engagementScore: 0,
        source,
        interactions: [],
        createdAt: Date.now(),
        lastActive: Date.now()
      };

    } catch (error) {
      console.error('[ICPBuilder] Create profile error:', error);
      throw error;
    }
  }

  /**
   * Get profile by userId
   */
  async getProfile(userId) {
    try {
      const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + this.sheets.spreadsheetId + '/values/' + this.sheetName + '!A:K?key=' + this.sheets.apiKey;

      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const rows = data.values || [];

      const rowIndex = rows.findIndex((r, idx) => idx > 0 && r[0] === userId);

      if (rowIndex === -1) {
        return null;
      }

      const row = rows[rowIndex];

      return {
        userId: row[0],
        email: row[1],
        name: row[2],
        skills: this._parseJSON(row[3]),
        interests: this._parseJSON(row[4]),
        lookingFor: row[5],
        engagementScore: parseInt(row[6]) || 0,
        source: row[7],
        interactions: this._parseJSON(row[8]),
        createdAt: parseInt(row[9]),
        lastActive: parseInt(row[10]),
        _rowIndex: rowIndex
      };

    } catch (error) {
      console.error('[ICPBuilder] Get profile error:', error);
      return null;
    }
  }

  /**
   * Add interaction to profile
   */
  async addInteraction(userId, interaction) {
    try {
      const profile = await this.getProfile(userId);

      if (!profile) {
        throw new Error('Profile not found');
      }

      // Add interaction
      profile.interactions.push({
        ...interaction,
        timestamp: Date.now()
      });

      // Extract skills from interaction
      const detectedSkills = this.detectSkills(interaction);
      profile.skills = [...new Set([...profile.skills, ...detectedSkills])];

      // Update row
      await this._updateProfile(profile);

      console.log('[ICPBuilder] Interaction added:', interaction.type);

      return { success: true };

    } catch (error) {
      console.error('[ICPBuilder] Add interaction error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Detect skills from interaction text
   */
  detectSkills(interaction) {
    const text = JSON.stringify(interaction).toLowerCase();
    const skills = [];

    for (const [skill, keywords] of Object.entries(this.skillKeywords)) {
      if (keywords.some(kw => text.includes(kw))) {
        skills.push(skill);
      }
    }

    return skills;
  }

  /**
   * Update engagement score
   */
  async updateEngagement(userId) {
    try {
      const profile = await this.getProfile(userId);

      if (!profile) {
        return { success: false, reason: 'not_found' };
      }

      // Calculate engagement score
      // +10 per interaction, +50 for voice, +100 for GitHub, +20 for tool use
      let score = 0;

      profile.interactions.forEach(interaction => {
        if (interaction.type === 'voice') score += 50;
        else if (interaction.type === 'github') score += 100;
        else if (interaction.type === 'tool') score += 20;
        else score += 10;
      });

      profile.engagementScore = score;
      profile.lastActive = Date.now();

      await this._updateProfile(profile);

      console.log('[ICPBuilder] Engagement updated:', userId, score);

      return { success: true, score };

    } catch (error) {
      console.error('[ICPBuilder] Update engagement error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get top talent (highest engagement)
   */
  async getTopTalent(limit = 10) {
    try {
      const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + this.sheets.spreadsheetId + '/values/' + this.sheetName + '!A:K?key=' + this.sheets.apiKey;

      const response = await fetch(url);

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const rows = data.values || [];

      // Parse all profiles
      const profiles = rows.slice(1).map(row => ({
        userId: row[0],
        email: row[1],
        name: row[2],
        skills: this._parseJSON(row[3]),
        interests: this._parseJSON(row[4]),
        lookingFor: row[5],
        engagementScore: parseInt(row[6]) || 0,
        source: row[7],
        interactions: this._parseJSON(row[8]),
        createdAt: parseInt(row[9]),
        lastActive: parseInt(row[10])
      }));

      // Sort by engagement score
      profiles.sort((a, b) => b.engagementScore - a.engagementScore);

      return profiles.slice(0, limit);

    } catch (error) {
      console.error('[ICPBuilder] Get top talent error:', error);
      return [];
    }
  }

  /**
   * Find profiles by skill
   */
  async findBySkill(skill) {
    try {
      const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + this.sheets.spreadsheetId + '/values/' + this.sheetName + '!A:K?key=' + this.sheets.apiKey;

      const response = await fetch(url);

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const rows = data.values || [];

      // Parse and filter profiles
      const profiles = rows.slice(1)
        .map(row => ({
          userId: row[0],
          email: row[1],
          name: row[2],
          skills: this._parseJSON(row[3]),
          interests: this._parseJSON(row[4]),
          lookingFor: row[5],
          engagementScore: parseInt(row[6]) || 0,
          source: row[7],
          interactions: this._parseJSON(row[8]),
          createdAt: parseInt(row[9]),
          lastActive: parseInt(row[10])
        }))
        .filter(profile => profile.skills.includes(skill.toLowerCase()));

      // Sort by engagement
      profiles.sort((a, b) => b.engagementScore - a.engagementScore);

      return profiles;

    } catch (error) {
      console.error('[ICPBuilder] Find by skill error:', error);
      return [];
    }
  }

  /**
   * Get pipeline stats
   */
  async getStats() {
    try {
      const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + this.sheets.spreadsheetId + '/values/' + this.sheetName + '!A:K?key=' + this.sheets.apiKey;

      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const rows = data.values || [];

      const profiles = rows.slice(1).map(row => ({
        engagementScore: parseInt(row[6]) || 0,
        skills: this._parseJSON(row[3])
      }));

      // Calculate stats
      const totalProfiles = profiles.length;
      const highEngagement = profiles.filter(p => p.engagementScore > 100).length;
      const avgEngagement = profiles.reduce((sum, p) => sum + p.engagementScore, 0) / totalProfiles || 0;

      // Count skills
      const skillCounts = {};
      profiles.forEach(profile => {
        profile.skills.forEach(skill => {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        });
      });

      return {
        totalProfiles,
        highEngagement,
        avgEngagement: Math.round(avgEngagement),
        topSkills: Object.entries(skillCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([skill, count]) => ({ skill, count }))
      };

    } catch (error) {
      console.error('[ICPBuilder] Get stats error:', error);
      return null;
    }
  }

  /**
   * Update profile in Sheets
   * @private
   */
  async _updateProfile(profile) {
    const row = [
      profile.userId,
      profile.email,
      profile.name,
      JSON.stringify(profile.skills),
      JSON.stringify(profile.interests),
      profile.lookingFor,
      profile.engagementScore,
      profile.source,
      JSON.stringify(profile.interactions),
      profile.createdAt,
      profile.lastActive
    ];

    const rowNum = profile._rowIndex + 1;
    const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + this.sheets.spreadsheetId + '/values/' + this.sheetName + '!A' + rowNum + ':K' + rowNum + '?valueInputOption=RAW&key=' + this.sheets.apiKey;

    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] })
    });
  }

  /**
   * Parse JSON safely
   * @private
   */
  _parseJSON(str) {
    try {
      return JSON.parse(str || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Initialize table
   */
  async initTable() {
    try {
      const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + this.sheets.spreadsheetId + '/values/' + this.sheetName + '!A1:K1?key=' + this.sheets.apiKey;

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        if (data.values && data.values.length > 0) {
          console.log('[ICPBuilder] Table already exists');
          return { success: true, exists: true };
        }
      }

      // Create header
      const header = ['userId', 'email', 'name', 'skills', 'interests', 'lookingFor', 'engagementScore', 'source', 'interactions', 'createdAt', 'lastActive'];

      const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets/' + this.sheets.spreadsheetId + '/values/' + this.sheetName + '!A1:K1?valueInputOption=RAW&key=' + this.sheets.apiKey;

      await fetch(createUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [header] })
      });

      console.log('[ICPBuilder] Table initialized');

      return { success: true, exists: false };

    } catch (error) {
      console.error('[ICPBuilder] Init table error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export
if (typeof window !== 'undefined') {
  window.ICPBuilder = ICPBuilder;
}

console.log('[ICPBuilder] Module loaded');
