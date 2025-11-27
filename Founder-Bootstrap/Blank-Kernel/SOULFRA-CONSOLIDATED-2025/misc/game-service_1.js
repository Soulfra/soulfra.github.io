const { Pool } = require('pg');
const Redis = require('ioredis');
const EventEmitter = require('events');
const config = require('../config/environment');

class GameService extends EventEmitter {
  constructor() {
    super();
    this.pool = new Pool(config.database);
    this.redis = new Redis(config.redis);
    this.gameConfig = config.game;
  }

  async getUserGameState(userId) {
    // Try to get from cache first
    const cacheKey = `game_state:${userId}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Get from database
    const result = await this.pool.query(
      'SELECT * FROM game_state WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Create initial game state
      const initialState = await this.createInitialGameState(userId);
      return initialState;
    }

    const gameState = result.rows[0];
    
    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(gameState));
    
    return gameState;
  }

  async createInitialGameState(userId) {
    const initialState = {
      user_id: userId,
      current_level: 1,
      experience_points: 0,
      achievements: [],
      active_contracts: [],
      daily_streak: 0,
      last_daily_bonus: null,
      powerups: {},
      statistics: {
        total_earnings: 0,
        contracts_completed: 0,
        perfect_contracts: 0,
        disputes_won: 0,
        disputes_lost: 0
      }
    };

    await this.pool.query(`
      INSERT INTO game_state (
        user_id, current_level, experience_points, achievements,
        active_contracts, daily_streak, powerups, statistics
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      initialState.user_id,
      initialState.current_level,
      initialState.experience_points,
      initialState.achievements,
      initialState.active_contracts,
      initialState.daily_streak,
      initialState.powerups,
      initialState.statistics
    ]);

    return initialState;
  }

  async addExperience(userId, amount, reason) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get current game state
      const stateResult = await client.query(
        'SELECT current_level, experience_points FROM game_state WHERE user_id = $1',
        [userId]
      );

      const currentState = stateResult.rows[0];
      const newXP = currentState.experience_points + amount;
      
      // Calculate new level
      const newLevel = this.calculateLevel(newXP);
      const leveledUp = newLevel > currentState.current_level;

      // Update game state
      await client.query(`
        UPDATE game_state 
        SET experience_points = $1, current_level = $2
        WHERE user_id = $3
      `, [newXP, newLevel, userId]);

      // If leveled up, grant rewards
      if (leveledUp) {
        await this.grantLevelRewards(client, userId, newLevel);
        this.emit('levelUp', { userId, newLevel, previousLevel: currentState.current_level });
      }

      // Log XP gain
      await this.logGameEvent(client, userId, 'xp_gained', {
        amount,
        reason,
        newTotal: newXP,
        newLevel
      });

      await client.query('COMMIT');

      // Clear cache
      await this.redis.del(`game_state:${userId}`);

      return {
        newXP,
        newLevel,
        leveledUp,
        xpGained: amount
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Add experience error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  calculateLevel(experiencePoints) {
    // Simple level calculation - can be adjusted
    const xpPerLevel = this.gameConfig.levelUpXpRequirement;
    return Math.floor(Math.sqrt(experiencePoints / xpPerLevel)) + 1;
  }

  async grantLevelRewards(client, userId, level) {
    const rewards = this.getLevelRewards(level);
    
    // Grant money reward
    if (rewards.money > 0) {
      await client.query(
        'UPDATE users SET balance = balance + $1 WHERE id = $2',
        [rewards.money, userId]
      );
    }

    // Grant powerups
    if (rewards.powerups) {
      const stateResult = await client.query(
        'SELECT powerups FROM game_state WHERE user_id = $1',
        [userId]
      );
      
      const currentPowerups = stateResult.rows[0].powerups || {};
      
      for (const [powerup, quantity] of Object.entries(rewards.powerups)) {
        currentPowerups[powerup] = (currentPowerups[powerup] || 0) + quantity;
      }

      await client.query(
        'UPDATE game_state SET powerups = $1 WHERE user_id = $2',
        [currentPowerups, userId]
      );
    }

    // Unlock achievements
    if (rewards.achievements) {
      for (const achievement of rewards.achievements) {
        await this.unlockAchievement(client, userId, achievement);
      }
    }
  }

  getLevelRewards(level) {
    const rewards = {
      money: level * 100,
      powerups: {},
      achievements: []
    };

    // Special milestone rewards
    if (level % 5 === 0) {
      rewards.money *= 5;
      rewards.powerups.double_xp = 1;
    }

    if (level % 10 === 0) {
      rewards.powerups.fee_reduction = 1;
      rewards.achievements.push(`level_${level}_milestone`);
    }

    return rewards;
  }

  async unlockAchievement(client, userId, achievementId) {
    const queryClient = client || this.pool;
    
    // Check if already unlocked
    const stateResult = await queryClient.query(
      'SELECT achievements FROM game_state WHERE user_id = $1',
      [userId]
    );

    const achievements = stateResult.rows[0].achievements || [];
    
    if (!achievements.includes(achievementId)) {
      achievements.push(achievementId);
      
      await queryClient.query(
        'UPDATE game_state SET achievements = $1 WHERE user_id = $2',
        [achievements, userId]
      );

      // Grant achievement rewards
      const achievementRewards = this.getAchievementRewards(achievementId);
      if (achievementRewards.xp) {
        await this.addExperience(userId, achievementRewards.xp, `achievement_${achievementId}`);
      }

      this.emit('achievementUnlocked', { userId, achievementId });
    }
  }

  getAchievementRewards(achievementId) {
    const rewards = {
      first_contract: { xp: 100, money: 50 },
      first_million: { xp: 1000, money: 10000 },
      contract_master: { xp: 500, powerups: { contract_boost: 1 } },
      ai_whisperer: { xp: 750, powerups: { ai_efficiency: 1 } },
      dispute_resolver: { xp: 600, money: 1000 },
      daily_devotee: { xp: 300, powerups: { daily_boost: 1 } }
    };

    return rewards[achievementId] || { xp: 100 };
  }

  async claimDailyBonus(userId) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get current game state
      const stateResult = await client.query(
        'SELECT daily_streak, last_daily_bonus FROM game_state WHERE user_id = $1',
        [userId]
      );

      const state = stateResult.rows[0];
      const now = new Date();
      const lastBonus = state.last_daily_bonus ? new Date(state.last_daily_bonus) : null;

      // Check if already claimed today
      if (lastBonus && this.isSameDay(lastBonus, now)) {
        const hoursUntilNext = 24 - now.getHours();
        return {
          claimed: false,
          message: 'Daily bonus already claimed',
          hoursUntilNext
        };
      }

      // Calculate streak
      let newStreak = 1;
      if (lastBonus && this.isConsecutiveDay(lastBonus, now)) {
        newStreak = state.daily_streak + 1;
      }

      // Calculate bonus amount
      const baseBonus = this.gameConfig.dailyBonusAmount;
      const streakMultiplier = Math.min(newStreak * 0.1, 2); // Max 2x at 20 days
      const bonusAmount = baseBonus * (1 + streakMultiplier);

      // Update user balance
      await client.query(
        'UPDATE users SET balance = balance + $1 WHERE id = $2',
        [bonusAmount, userId]
      );

      // Update game state
      await client.query(`
        UPDATE game_state 
        SET daily_streak = $1, last_daily_bonus = $2
        WHERE user_id = $3
      `, [newStreak, now, userId]);

      // Grant XP
      await this.addExperience(userId, 50 * newStreak, 'daily_bonus');

      // Check for streak achievements
      if (newStreak === 7) {
        await this.unlockAchievement(client, userId, 'week_warrior');
      } else if (newStreak === 30) {
        await this.unlockAchievement(client, userId, 'monthly_master');
      }

      await client.query('COMMIT');

      // Clear cache
      await this.redis.del(`game_state:${userId}`);

      return {
        claimed: true,
        amount: bonusAmount,
        streak: newStreak,
        nextBonus: new Date(now.getTime() + 24 * 60 * 60 * 1000)
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Daily bonus error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  isSameDay(date1, date2) {
    return date1.toDateString() === date2.toDateString();
  }

  isConsecutiveDay(lastDate, currentDate) {
    const oneDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round((currentDate - lastDate) / oneDay);
    return diffDays === 1;
  }

  async usePowerup(userId, powerupType) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get current powerups
      const stateResult = await client.query(
        'SELECT powerups FROM game_state WHERE user_id = $1',
        [userId]
      );

      const powerups = stateResult.rows[0].powerups || {};

      if (!powerups[powerupType] || powerups[powerupType] < 1) {
        throw new Error('Insufficient powerups');
      }

      // Deduct powerup
      powerups[powerupType]--;

      await client.query(
        'UPDATE game_state SET powerups = $1 WHERE user_id = $2',
        [powerups, userId]
      );

      // Apply powerup effect
      const effect = await this.applyPowerupEffect(client, userId, powerupType);

      await client.query('COMMIT');

      // Clear cache
      await this.redis.del(`game_state:${userId}`);

      return {
        success: true,
        powerupType,
        remaining: powerups[powerupType],
        effect
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Use powerup error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async applyPowerupEffect(client, userId, powerupType) {
    const effects = {
      double_xp: {
        duration: 3600, // 1 hour
        multiplier: 2
      },
      fee_reduction: {
        duration: 1800, // 30 minutes
        reduction: 0.5 // 50% fee reduction
      },
      contract_boost: {
        duration: 3600,
        valueMultiplier: 1.2 // 20% value boost
      },
      ai_efficiency: {
        duration: 7200, // 2 hours
        speedBoost: 2 // 2x AI processing speed
      }
    };

    const effect = effects[powerupType];
    if (!effect) {
      throw new Error('Unknown powerup type');
    }

    // Store active effect in Redis
    const effectKey = `powerup_effect:${userId}:${powerupType}`;
    await this.redis.setex(effectKey, effect.duration, JSON.stringify({
      ...effect,
      activatedAt: new Date(),
      expiresAt: new Date(Date.now() + effect.duration * 1000)
    }));

    return effect;
  }

  async getLeaderboard(options = {}) {
    const { type = 'wealth', limit = 100, offset = 0 } = options;
    
    let query;
    if (type === 'wealth') {
      query = `
        SELECT u.id, u.username, u.balance, u.reputation_score,
               gs.current_level, gs.achievements,
               COUNT(DISTINCT c.id) as total_contracts
        FROM users u
        JOIN game_state gs ON u.id = gs.user_id
        LEFT JOIN contracts c ON u.id = c.creator_id
        WHERE u.is_active = true
        GROUP BY u.id, u.username, u.balance, u.reputation_score, 
                 gs.current_level, gs.achievements
        ORDER BY u.balance DESC
        LIMIT $1 OFFSET $2
      `;
    } else if (type === 'reputation') {
      query = `
        SELECT u.id, u.username, u.balance, u.reputation_score,
               gs.current_level, gs.achievements,
               COUNT(DISTINCT c.id) as total_contracts
        FROM users u
        JOIN game_state gs ON u.id = gs.user_id
        LEFT JOIN contracts c ON u.id = c.creator_id
        WHERE u.is_active = true
        GROUP BY u.id, u.username, u.balance, u.reputation_score, 
                 gs.current_level, gs.achievements
        ORDER BY u.reputation_score DESC, u.balance DESC
        LIMIT $1 OFFSET $2
      `;
    }

    const result = await this.pool.query(query, [limit, offset]);
    
    // Add rank to results
    return result.rows.map((row, index) => ({
      ...row,
      rank: offset + index + 1
    }));
  }

  async getGlobalStats() {
    const cacheKey = 'global_stats';
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const statsQuery = `
      SELECT 
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT c.id) as total_contracts,
        COALESCE(SUM(c.value), 0) as total_contract_value,
        COALESCE(SUM(t.amount), 0) as total_transaction_volume,
        COUNT(DISTINCT CASE WHEN u.last_active > NOW() - INTERVAL '24 hours' 
                           THEN u.id END) as daily_active_users,
        COUNT(DISTINCT CASE WHEN c.created_at > NOW() - INTERVAL '24 hours' 
                           THEN c.id END) as daily_contracts,
        AVG(u.reputation_score) as average_reputation
      FROM users u
      LEFT JOIN contracts c ON u.id = c.creator_id
      LEFT JOIN transactions t ON t.status = 'completed'
    `;

    const result = await this.pool.query(statsQuery);
    const stats = result.rows[0];

    // Format numbers
    const formattedStats = {
      totalUsers: parseInt(stats.total_users),
      totalContracts: parseInt(stats.total_contracts),
      totalContractValue: parseFloat(stats.total_contract_value),
      totalVolume: parseFloat(stats.total_transaction_volume),
      dailyActiveUsers: parseInt(stats.daily_active_users),
      dailyContracts: parseInt(stats.daily_contracts),
      averageReputation: parseFloat(stats.average_reputation).toFixed(1)
    };

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(formattedStats));

    return formattedStats;
  }

  async logGameEvent(client, userId, eventType, eventData) {
    const queryClient = client || this.pool;
    
    // Store in PostgreSQL
    await queryClient.query(`
      INSERT INTO audit_logs (user_id, action, entity_type, changes)
      VALUES ($1, $2, $3, $4)
    `, [userId, `game_${eventType}`, 'game', eventData]);

    // Also store in MongoDB for analytics
    // This would be implemented with MongoDB connection
  }

  async updateStatistics(userId, statType, value) {
    const validStats = [
      'total_earnings', 'contracts_completed', 'perfect_contracts',
      'disputes_won', 'disputes_lost', 'ai_interactions'
    ];

    if (!validStats.includes(statType)) {
      throw new Error('Invalid statistic type');
    }

    await this.pool.query(`
      UPDATE game_state 
      SET statistics = jsonb_set(
        statistics, 
        '{${statType}}', 
        to_jsonb(COALESCE((statistics->>'${statType}')::numeric, 0) + $1)
      )
      WHERE user_id = $2
    `, [value, userId]);

    // Clear cache
    await this.redis.del(`game_state:${userId}`);
  }
}

module.exports = GameService;