/**
 * Tier Progression Manager
 *
 * d2jsp-style ladder/leveling system for educational progress tracking.
 * Users earn XP from quiz scores, location triggers, and completed tutorials.
 *
 * Features:
 * - 99 tier levels (like RuneScape skills)
 * - Named tiers (Novice → Legend)
 * - XP-based progression
 * - Achievement system
 * - Leaderboard
 * - Integration with Cal Knowledge Base
 *
 * Usage:
 *   const manager = new TierProgressionManager();
 *   await manager.init();
 *   await manager.awardXP(userId, 50, 'quiz_completed');
 *   const progress = await manager.getProgress(userId);
 *
 * XP Awards:
 * - Quiz completion: 10-100 XP (based on score)
 * - Location trigger: 25 XP
 * - Tutorial completed: 50 XP
 * - Math game: 15-30 XP (based on performance)
 */

const CalKnowledgeBase = require('./cal-knowledge-base');

/**
 * Tier level names (d2jsp-inspired)
 */
const TIER_NAMES = {
  1: 'Novice',
  10: 'Apprentice',
  20: 'Scholar',
  30: 'Specialist',
  40: 'Expert',
  50: 'Adept',
  60: 'Master',
  70: 'Grandmaster',
  80: 'Sage',
  90: 'Legend',
  99: 'Ascended'
};

/**
 * XP required for each level (exponential scaling)
 * Level 1: 100 XP, Level 99: 100,000+ XP
 */
function calculateXPRequired(level) {
  if (level === 1) return 100;
  if (level >= 99) return 0; // Max level

  // Exponential formula: XP = 100 * (level ^ 1.5)
  return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * Achievements unlocked at milestone levels
 */
const ACHIEVEMENTS = {
  10: { name: 'First Steps', description: 'Reached level 10' },
  25: { name: 'Quarter Century', description: 'Reached level 25' },
  50: { name: 'Halfway There', description: 'Reached level 50' },
  75: { name: 'Elite Learner', description: 'Reached level 75' },
  99: { name: 'Max Level', description: 'Reached the maximum level!' }
};

class TierProgressionManager {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.calKB = options.calKB || new CalKnowledgeBase({ verbose: this.verbose });
    this.kbInitialized = false;
  }

  /**
   * Initialize progression manager
   */
  async init() {
    await this.initKB();

    if (this.verbose) {
      console.log('📊 Tier Progression Manager initialized');
      console.log('   Levels: 1-99');
      console.log('   Named tiers: 11');
    }
  }

  /**
   * Initialize Cal Knowledge Base
   */
  async initKB() {
    if (!this.kbInitialized) {
      await this.calKB.init();
      this.kbInitialized = true;
    }
  }

  /**
   * Get user's tier progression
   */
  async getProgress(userId) {
    const sql = `SELECT * FROM tier_progress WHERE user_id = ? ORDER BY id DESC LIMIT 1`;
    const rows = await this.calKB.querySQL(sql, [userId]);

    if (rows.length === 0) {
      // Create new user
      return await this.createUser(userId);
    }

    const progress = rows[0];

    // Parse JSON fields
    const quizScores = progress.quiz_scores_json ? JSON.parse(progress.quiz_scores_json) : [];
    const achievements = progress.achievements_json ? JSON.parse(progress.achievements_json) : [];

    return {
      userId: progress.user_id,
      tierLevel: progress.tier_level,
      tierName: this.getTierName(progress.tier_level),
      xpEarned: progress.xp_earned,
      xpRequired: progress.xp_required,
      xpProgress: ((progress.xp_earned / progress.xp_required) * 100).toFixed(1),
      quizScores: quizScores,
      achievements: achievements,
      createdAt: progress.created_at,
      updatedAt: progress.updated_at
    };
  }

  /**
   * Create new user with default tier progress
   */
  async createUser(userId) {
    const sql = `
      INSERT INTO tier_progress (
        user_id,
        tier_level,
        tier_name,
        xp_earned,
        xp_required,
        quiz_scores_json,
        achievements_json,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      userId,
      1,
      'Novice',
      0,
      calculateXPRequired(1),
      JSON.stringify([]),
      JSON.stringify([]),
      new Date().toISOString(),
      new Date().toISOString()
    ];

    await this.calKB.runSQL(sql, params);

    if (this.verbose) {
      console.log(`👤 Created new user: ${userId} (Tier 1: Novice)`);
    }

    return await this.getProgress(userId);
  }

  /**
   * Award XP to user
   */
  async awardXP(userId, xpAmount, source = 'unknown', metadata = {}) {
    let progress = await this.getProgress(userId);

    // Add XP
    let newXP = progress.xpEarned + xpAmount;
    let currentLevel = progress.tierLevel;
    let xpRequired = progress.xpRequired;

    // Check for level up
    const levelUpResult = this.checkLevelUp(newXP, currentLevel, xpRequired);

    if (levelUpResult.leveledUp) {
      currentLevel = levelUpResult.newLevel;
      newXP = levelUpResult.remainingXP;
      xpRequired = levelUpResult.newXPRequired;

      // Check for achievements
      const newAchievement = ACHIEVEMENTS[currentLevel];
      if (newAchievement) {
        progress.achievements.push({
          level: currentLevel,
          name: newAchievement.name,
          description: newAchievement.description,
          unlockedAt: new Date().toISOString()
        });
      }

      if (this.verbose) {
        console.log(`🎉 Level up! ${userId} reached level ${currentLevel}: ${this.getTierName(currentLevel)}`);
      }
    }

    // Update database
    const sql = `
      UPDATE tier_progress
      SET
        tier_level = ?,
        tier_name = ?,
        xp_earned = ?,
        xp_required = ?,
        achievements_json = ?,
        updated_at = ?
      WHERE user_id = ?
    `;

    const params = [
      currentLevel,
      this.getTierName(currentLevel),
      newXP,
      xpRequired,
      JSON.stringify(progress.achievements),
      new Date().toISOString(),
      userId
    ];

    await this.calKB.runSQL(sql, params);

    if (this.verbose) {
      console.log(`✨ Awarded ${xpAmount} XP to ${userId} (${source})`);
      console.log(`   Progress: ${newXP}/${xpRequired} XP (Level ${currentLevel})`);
    }

    return {
      xpAwarded: xpAmount,
      totalXP: newXP,
      xpRequired: xpRequired,
      leveledUp: levelUpResult.leveledUp,
      newLevel: levelUpResult.leveledUp ? currentLevel : null,
      newTierName: levelUpResult.leveledUp ? this.getTierName(currentLevel) : null
    };
  }

  /**
   * Check if user leveled up
   */
  checkLevelUp(xpEarned, currentLevel, xpRequired) {
    if (currentLevel >= 99) {
      // Max level reached
      return {
        leveledUp: false,
        newLevel: 99,
        remainingXP: xpEarned,
        newXPRequired: 0
      };
    }

    if (xpEarned < xpRequired) {
      // Not enough XP to level up
      return {
        leveledUp: false,
        newLevel: currentLevel,
        remainingXP: xpEarned,
        newXPRequired: xpRequired
      };
    }

    // Level up!
    const newLevel = currentLevel + 1;
    const remainingXP = xpEarned - xpRequired;
    const newXPRequired = calculateXPRequired(newLevel);

    // Check for multiple level ups
    if (remainingXP >= newXPRequired && newLevel < 99) {
      return this.checkLevelUp(remainingXP, newLevel, newXPRequired);
    }

    return {
      leveledUp: true,
      newLevel: newLevel,
      remainingXP: remainingXP,
      newXPRequired: newXPRequired
    };
  }

  /**
   * Record quiz score and award XP
   */
  async recordQuizScore(userId, quizScore, quizTotal) {
    const percentage = (quizScore / quizTotal) * 100;

    // XP based on quiz performance (10-100 XP)
    const xpAwarded = Math.floor(10 + (percentage * 0.9)); // 0% = 10 XP, 100% = 100 XP

    // Get current progress
    let progress = await this.getProgress(userId);

    // Add quiz score to history
    progress.quizScores.push({
      score: quizScore,
      total: quizTotal,
      percentage: percentage.toFixed(1),
      xpAwarded: xpAwarded,
      timestamp: new Date().toISOString()
    });

    // Update quiz scores in database
    const sql = `
      UPDATE tier_progress
      SET quiz_scores_json = ?
      WHERE user_id = ?
    `;

    await this.calKB.runSQL(sql, [JSON.stringify(progress.quizScores), userId]);

    // Award XP
    return await this.awardXP(userId, xpAwarded, 'quiz_completed', {
      score: quizScore,
      total: quizTotal,
      percentage: percentage
    });
  }

  /**
   * Get tier name for level
   */
  getTierName(level) {
    // Find the highest tier name <= level
    const tierLevels = Object.keys(TIER_NAMES).map(Number).sort((a, b) => b - a);

    for (const tierLevel of tierLevels) {
      if (level >= tierLevel) {
        return TIER_NAMES[tierLevel];
      }
    }

    return TIER_NAMES[1]; // Default to Novice
  }

  /**
   * Get leaderboard (top users by tier level)
   */
  async getLeaderboard(limit = 10) {
    const sql = `
      SELECT
        user_id,
        tier_level,
        tier_name,
        xp_earned,
        achievements_json,
        updated_at
      FROM tier_progress
      ORDER BY tier_level DESC, xp_earned DESC
      LIMIT ?
    `;

    const rows = await this.calKB.querySQL(sql, [limit]);

    return rows.map((row, index) => ({
      rank: index + 1,
      userId: row.user_id,
      tierLevel: row.tier_level,
      tierName: row.tier_name,
      xpEarned: row.xp_earned,
      achievementCount: row.achievements_json ? JSON.parse(row.achievements_json).length : 0,
      lastActive: row.updated_at
    }));
  }

  /**
   * Get user rank
   */
  async getUserRank(userId) {
    const sql = `
      SELECT COUNT(*) + 1 as rank
      FROM tier_progress
      WHERE tier_level > (SELECT tier_level FROM tier_progress WHERE user_id = ?)
         OR (tier_level = (SELECT tier_level FROM tier_progress WHERE user_id = ?)
             AND xp_earned > (SELECT xp_earned FROM tier_progress WHERE user_id = ?))
    `;

    const rows = await this.calKB.querySQL(sql, [userId, userId, userId]);

    return rows[0]?.rank || null;
  }

  /**
   * Get total users
   */
  async getTotalUsers() {
    const sql = `SELECT COUNT(*) as count FROM tier_progress`;
    const rows = await this.calKB.querySQL(sql);
    return rows[0].count;
  }

  /**
   * Get tier distribution (how many users at each tier level)
   */
  async getTierDistribution() {
    const sql = `
      SELECT
        tier_name,
        COUNT(*) as user_count,
        AVG(xp_earned) as avg_xp
      FROM tier_progress
      GROUP BY tier_name
      ORDER BY MIN(tier_level) ASC
    `;

    const rows = await this.calKB.querySQL(sql);

    return rows.map(row => ({
      tierName: row.tier_name,
      userCount: row.user_count,
      avgXP: Math.round(row.avg_xp)
    }));
  }

  /**
   * Export tier definitions to XML (d2jsp-style)
   */
  async exportToXML() {
    const tiers = [];

    for (let level = 1; level <= 99; level++) {
      tiers.push({
        level: level,
        name: this.getTierName(level),
        xpRequired: calculateXPRequired(level),
        achievement: ACHIEVEMENTS[level] || null
      });
    }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<tiers>\n';

    for (const tier of tiers) {
      xml += `  <tier level="${tier.level}" name="${tier.name}" xpRequired="${tier.xpRequired}">\n`;
      if (tier.achievement) {
        xml += `    <achievement name="${tier.achievement.name}" description="${tier.achievement.description}" />\n`;
      }
      xml += '  </tier>\n';
    }

    xml += '</tiers>';

    return xml;
  }

  /**
   * Get statistics
   */
  async getStats() {
    const totalUsers = await this.getTotalUsers();
    const distribution = await this.getTierDistribution();

    const sql = `
      SELECT
        AVG(tier_level) as avg_level,
        MAX(tier_level) as max_level,
        SUM(xp_earned) as total_xp
      FROM tier_progress
    `;

    const rows = await this.calKB.querySQL(sql);

    return {
      totalUsers: totalUsers,
      avgLevel: Math.round(rows[0].avg_level * 10) / 10,
      maxLevel: rows[0].max_level,
      totalXP: rows[0].total_xp,
      tierDistribution: distribution
    };
  }
}

module.exports = TierProgressionManager;

// CLI usage example
if (require.main === module) {
  (async () => {
    console.log('📊 Tier Progression Manager Demo\n');

    const manager = new TierProgressionManager({ verbose: true });
    await manager.init();

    const testUser = 'test-learner-123';

    console.log('\n🎯 Creating new user...\n');
    const progress = await manager.getProgress(testUser);

    console.log(`User: ${progress.userId}`);
    console.log(`Tier: Level ${progress.tierLevel} - ${progress.tierName}`);
    console.log(`XP: ${progress.xpEarned}/${progress.xpRequired} (${progress.xpProgress}%)`);

    console.log('\n\n📝 Simulating quiz completion...\n');
    const quizResult = await manager.recordQuizScore(testUser, 8, 10);

    console.log(`Quiz: 8/10 (80%)`);
    console.log(`XP awarded: ${quizResult.xpAwarded}`);
    console.log(`Total XP: ${quizResult.totalXP}/${quizResult.xpRequired}`);

    console.log('\n\n🏆 Simulating rapid progression (multiple level ups)...\n');
    for (let i = 0; i < 20; i++) {
      await manager.awardXP(testUser, 500, 'tutorial_completed');
    }

    const newProgress = await manager.getProgress(testUser);
    console.log(`\nCurrent tier: Level ${newProgress.tierLevel} - ${newProgress.tierName}`);
    console.log(`Achievements unlocked: ${newProgress.achievements.length}`);

    newProgress.achievements.forEach(achievement => {
      console.log(`   🏆 ${achievement.name} (Level ${achievement.level})`);
    });

    console.log('\n\n📊 Leaderboard:\n');
    const leaderboard = await manager.getLeaderboard(5);
    leaderboard.forEach(entry => {
      console.log(`   ${entry.rank}. ${entry.userId} - Level ${entry.tierLevel} (${entry.tierName})`);
    });

    console.log('\n\n📈 Statistics:\n');
    const stats = await manager.getStats();
    console.log(`   Total users: ${stats.totalUsers}`);
    console.log(`   Average level: ${stats.avgLevel}`);
    console.log(`   Max level: ${stats.maxLevel}`);
    console.log(`   Total XP earned: ${stats.totalXP}`);

    console.log('\n✅ Demo complete!');
  })();
}
