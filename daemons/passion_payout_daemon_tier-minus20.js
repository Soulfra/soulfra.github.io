// SOULFRA SPORT MIRROR - Passion Payout Daemon
// Post-game trait reward distribution and ritual honor calculation

import { SoulfraPlatform } from '../core/soulfra-runtime-core.js';

class PassionPayoutDaemon {
  constructor(soulfraPlatform) {
    this.platform = soulfraPlatform;
    this.payoutHistory = new Map();
    this.pendingPayouts = new Map();
    this.gameResults = new Map();
    
    // Payout calculation constants
    this.payoutConfig = {
      base_ritual_value: 0.1,
      emotion_multipliers: {
        blessing: 1.2,
        curse: 1.0,
        analysis: 1.5,
        celebration: 2.0,
        despair: 1.1
      },
      trust_bonus_threshold: 80,
      trust_bonus_multiplier: 1.5,
      loyalty_duration_bonus: 0.02, // per minute watched
      prediction_bonuses: {
        correct_winner: 2.0,
        correct_score_range: 1.5,
        correct_first_goal: 1.3
      }
    };
  }

  // Initialize payout tracking for a game
  async initializeGamePayout(gameId, gameMetadata) {
    const payoutSession = {
      game_id: gameId,
      game_metadata: gameMetadata,
      participants: new Map(),
      ritual_count: 0,
      start_time: Date.now(),
      status: 'active'
    };
    
    this.pendingPayouts.set(gameId, payoutSession);
    
    return {
      success: true,
      game_id: gameId,
      payout_session_active: true
    };
  }

  // Track ritual for future payout calculation
  async trackRitualForPayout(gameId, userFingerprint, emotionalLedgerEntry) {
    const session = this.pendingPayouts.get(gameId);
    if (!session) {
      console.warn(`No payout session for game ${gameId}`);
      return;
    }

    const userId = this.hashFingerprint(userFingerprint);
    
    if (!session.participants.has(userId)) {
      session.participants.set(userId, {
        user_fingerprint_hash: userId,
        rituals: [],
        total_passion: 0,
        total_focus: 0,
        total_loyalty: 0,
        session_duration: 0,
        predictions: [],
        team_alignment: null
      });
    }
    
    const participant = session.participants.get(userId);
    
    // Add ritual to participant history
    participant.rituals.push({
      timestamp: emotionalLedgerEntry.ritual_data.timestamp,
      emotion: emotionalLedgerEntry.ritual_data.emotion_primary,
      intensity: emotionalLedgerEntry.ritual_data.emotion_intensity,
      trait_impacts: emotionalLedgerEntry.trait_impacts,
      trust_score: emotionalLedgerEntry.ritual_data.trust_score_at_time,
      whisper_text: emotionalLedgerEntry.ritual_data.whisper_text
    });
    
    // Accumulate trait totals
    participant.total_passion += emotionalLedgerEntry.trait_impacts.passion || 0;
    participant.total_focus += emotionalLedgerEntry.trait_impacts.focus || 0;
    participant.total_loyalty += emotionalLedgerEntry.trait_impacts.loyalty || 0;
    
    // Update team alignment
    if (!participant.team_alignment) {
      participant.team_alignment = emotionalLedgerEntry.ritual_data.team_alignment;
    }
    
    // Update session duration
    participant.session_duration = Date.now() - session.start_time;
    
    session.ritual_count++;
  }

  // Process game completion and calculate payouts
  async processGameCompletion(gameId, gameResult) {
    const session = this.pendingPayouts.get(gameId);
    if (!session) {
      throw new Error(`No payout session found for game ${gameId}`);
    }
    
    // Store game result
    this.gameResults.set(gameId, {
      ...gameResult,
      completion_time: Date.now()
    });
    
    session.status = 'calculating';
    
    try {
      // Calculate payouts for each participant
      const payoutResults = await this.calculateAllPayouts(session, gameResult);
      
      // Distribute rewards through vault system
      const distributionResults = await this.distributeRewards(payoutResults);
      
      // Store payout history
      const payoutRecord = {
        game_id: gameId,
        game_result: gameResult,
        participant_count: session.participants.size,
        total_rituals: session.ritual_count,
        payout_results: payoutResults,
        distribution_results: distributionResults,
        completion_timestamp: Date.now()
      };
      
      this.payoutHistory.set(gameId, payoutRecord);
      
      // Clean up pending session
      this.pendingPayouts.delete(gameId);
      
      return {
        success: true,
        game_id: gameId,
        participants_paid: distributionResults.length,
        total_ritual_value_distributed: distributionResults.reduce(
          (sum, result) => sum + result.total_payout, 0
        ),
        top_performers: this.getTopPerformers(payoutResults, 3)
      };
      
    } catch (error) {
      console.error('Payout processing failed:', error);
      session.status = 'error';
      return {
        success: false,
        error: error.message
      };
    }
  }

  async calculateAllPayouts(session, gameResult) {
    const payoutResults = [];
    
    for (const [userId, participant] of session.participants) {
      const individualPayout = await this.calculateIndividualPayout(
        participant,
        gameResult,
        session
      );
      
      payoutResults.push({
        user_id: userId,
        participant_data: participant,
        payout_calculation: individualPayout
      });
    }
    
    // Sort by total payout for leaderboard
    payoutResults.sort((a, b) => 
      b.payout_calculation.total_payout - a.payout_calculation.total_payout
    );
    
    return payoutResults;
  }

  async calculateIndividualPayout(participant, gameResult, session) {
    const calculation = {
      base_components: {},
      bonuses: {},
      penalties: {},
      total_payout: 0,
      trait_rewards: {},
      honor_level: 'participant'
    };
    
    // Base ritual value calculation
    calculation.base_components.ritual_count = participant.rituals.length;
    calculation.base_components.base_value = 
      participant.rituals.length * this.payoutConfig.base_ritual_value;
    
    // Emotion type multipliers
    const emotionValues = {};
    participant.rituals.forEach(ritual => {
      const emotion = ritual.emotion;
      if (!emotionValues[emotion]) emotionValues[emotion] = 0;
      emotionValues[emotion] += this.payoutConfig.base_ritual_value * 
        (this.payoutConfig.emotion_multipliers[emotion] || 1.0);
    });
    calculation.base_components.emotion_values = emotionValues;
    calculation.base_components.emotion_total = Object.values(emotionValues)
      .reduce((sum, val) => sum + val, 0);
    
    // Trust score bonus
    const avgTrustScore = participant.rituals.reduce(
      (sum, ritual) => sum + ritual.trust_score, 0
    ) / participant.rituals.length;
    
    if (avgTrustScore > this.payoutConfig.trust_bonus_threshold) {
      calculation.bonuses.trust_bonus = 
        calculation.base_components.emotion_total * 
        (this.payoutConfig.trust_bonus_multiplier - 1.0);
    }
    
    // Loyalty duration bonus
    const durationMinutes = participant.session_duration / (1000 * 60);
    calculation.bonuses.duration_bonus = 
      durationMinutes * this.payoutConfig.loyalty_duration_bonus * 
      calculation.base_components.emotion_total;
    
    // Prediction accuracy bonuses
    const predictionBonus = this.calculatePredictionBonus(
      participant,
      gameResult,
      calculation.base_components.emotion_total
    );
    calculation.bonuses.prediction_bonus = predictionBonus;
    
    // Trait-specific rewards
    calculation.trait_rewards = {
      passion_fragments: Math.floor(participant.total_passion / 10),
      focus_fragments: Math.floor(participant.total_focus / 15),
      loyalty_fragments: Math.floor(participant.total_loyalty / 12),
      tribal_essence: this.calculateTribalEssence(participant, gameResult)
    };
    
    // Calculate honor level
    calculation.honor_level = this.calculateHonorLevel(participant, calculation);
    
    // Sum total payout
    calculation.total_payout = 
      calculation.base_components.emotion_total +
      (calculation.bonuses.trust_bonus || 0) +
      (calculation.bonuses.duration_bonus || 0) +
      (calculation.bonuses.prediction_bonus || 0) -
      (calculation.penalties.excessive_negativity || 0);
    
    return calculation;
  }

  calculatePredictionBonus(participant, gameResult, baseValue) {
    let bonus = 0;
    
    // Check team alignment prediction
    if (participant.team_alignment === gameResult.winner) {
      bonus += baseValue * this.payoutConfig.prediction_bonuses.correct_winner;
    }
    
    // Additional prediction logic could be added here
    // based on any pre-game predictions stored
    
    return bonus;
  }

  calculateTribalEssence(participant, gameResult) {
    const essence = {
      type: 'neutral',
      strength: 0
    };
    
    if (participant.team_alignment === gameResult.winner) {
      essence.type = 'victorious_tribal';
      essence.strength = Math.min(participant.total_loyalty / 20, 10);
    } else if (participant.team_alignment === gameResult.loser) {
      essence.type = 'faithful_mourning';
      essence.strength = Math.min(participant.total_loyalty / 15, 10);
    } else {
      essence.type = 'wise_observer';
      essence.strength = Math.min(participant.total_focus / 25, 10);
    }
    
    return essence;
  }

  calculateHonorLevel(participant, calculation) {
    const totalRituals = participant.rituals.length;
    const totalTraits = participant.total_passion + participant.total_focus + participant.total_loyalty;
    const totalPayout = calculation.total_payout;
    
    if (totalRituals >= 50 && totalTraits >= 1000 && totalPayout >= 10) {
      return 'vault_legend';
    } else if (totalRituals >= 25 && totalTraits >= 500 && totalPayout >= 5) {
      return 'ritual_master';
    } else if (totalRituals >= 10 && totalTraits >= 200 && totalPayout >= 2) {
      return 'devoted_fan';
    } else if (totalRituals >= 5) {
      return 'active_participant';
    } else {
      return 'casual_observer';
    }
  }

  async distributeRewards(payoutResults) {
    const distributionResults = [];
    
    for (const result of payoutResults) {
      try {
        // Store rewards in vault
        const rewardVaultId = await this.platform.vault.store(
          result.user_id,
          'sport_ritual_rewards',
          {
            game_id: result.payout_calculation.game_id,
            total_payout: result.payout_calculation.total_payout,
            trait_rewards: result.payout_calculation.trait_rewards,
            honor_level: result.payout_calculation.honor_level,
            distribution_timestamp: Date.now(),
            calculation_breakdown: result.payout_calculation
          },
          false // Not sync-eligible
        );
        
        // Update user trust score with payout bonus
        const trustBonus = Math.min(Math.floor(result.payout_calculation.total_payout), 5);
        await this.platform.trustEngine.updateTrustScore(
          result.user_id,
          trustBonus,
          'sport_ritual_completion_bonus'
        );
        
        distributionResults.push({
          user_id: result.user_id,
          vault_id: rewardVaultId,
          total_payout: result.payout_calculation.total_payout,
          honor_level: result.payout_calculation.honor_level,
          success: true
        });
        
      } catch (error) {
        console.error(`Distribution failed for user ${result.user_id}:`, error);
        distributionResults.push({
          user_id: result.user_id,
          success: false,
          error: error.message
        });
      }
    }
    
    return distributionResults;
  }

  getTopPerformers(payoutResults, count = 3) {
    return payoutResults.slice(0, count).map(result => ({
      user_id: result.user_id,
      total_payout: result.payout_calculation.total_payout,
      honor_level: result.payout_calculation.honor_level,
      ritual_count: result.participant_data.rituals.length,
      traits: {
        passion: result.participant_data.total_passion,
        focus: result.participant_data.total_focus,
        loyalty: result.participant_data.total_loyalty
      }
    }));
  }

  // Create optional NFT-style trophy for top performers
  async mintRitualTrophy(gameId, userFingerprint, performanceData) {
    const trophyData = {
      game_id: gameId,
      user_fingerprint_hash: this.hashFingerprint(userFingerprint),
      trophy_type: performanceData.honor_level,
      performance_stats: performanceData,
      mint_timestamp: Date.now(),
      trophy_id: `trophy_${gameId}_${Date.now()}`
    };
    
    // Store trophy in vault as permanent record
    const trophyVaultId = await this.platform.vault.store(
      userFingerprint,
      'sport_ritual_trophy',
      trophyData,
      true // Sync-eligible for potential blockchain minting
    );
    
    return {
      trophy_id: trophyData.trophy_id,
      vault_id: trophyVaultId,
      trophy_data: trophyData
    };
  }

  // Get payout history for analytics
  getPayoutHistory(gameId = null) {
    if (gameId) {
      return this.payoutHistory.get(gameId);
    }
    return Array.from(this.payoutHistory.values());
  }

  // Get current pending sessions
  getPendingSessions() {
    return Array.from(this.pendingPayouts.values());
  }

  hashFingerprint(fingerprint) {
    // Simple hash for anonymization - use crypto.createHash in production
    return fingerprint.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0).toString(36);
  }
}

export { PassionPayoutDaemon };