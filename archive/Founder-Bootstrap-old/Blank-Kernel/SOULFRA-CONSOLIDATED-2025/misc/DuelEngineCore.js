#!/usr/bin/env node
/**
 * Duel Engine Core
 * AI-powered betting system for loop outcomes
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class DuelEngineCore extends EventEmitter {
    constructor() {
        super();
        this.duelsDir = path.join(__dirname, 'active_duels');
        this.archiveDir = path.join(__dirname, 'archived_duels');
        this.oddsDir = path.join(__dirname, 'odds_history');
        
        // Active duels
        this.activeDuels = new Map();
        
        // Market state
        this.marketState = {
            total_volume: 0,
            active_duels: 0,
            total_participants: new Set(),
            loop_odds: new Map()
        };
        
        // Connect to subsystems (would be initialized separately)
        this.oddsEngine = null;
        this.orderBook = null;
        this.resolutionDaemon = null;
        
        this.ensureDirectories();
        this.loadActiveDuels();
    }
    
    ensureDirectories() {
        [this.duelsDir, this.archiveDir, this.oddsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    loadActiveDuels() {
        try {
            const duelFiles = fs.readdirSync(this.duelsDir)
                .filter(f => f.endsWith('.json'));
                
            duelFiles.forEach(file => {
                const duelData = JSON.parse(
                    fs.readFileSync(path.join(this.duelsDir, file), 'utf8')
                );
                this.activeDuels.set(duelData.duel_id, duelData);
            });
            
            console.log(`Loaded ${this.activeDuels.size} active duels`);
        } catch (err) {
            console.error('Error loading duels:', err);
        }
    }
    
    createDuel(params) {
        const duelId = this.generateDuelId();
        
        const duel = {
            duel_id: duelId,
            created_at: new Date().toISOString(),
            status: 'open',
            
            // Duel target
            target_type: params.target_type || 'loop_outcome',
            target_id: params.target_id,
            target_description: params.target_description,
            
            // Prediction details
            prediction_type: params.prediction_type || 'exact_outcome',
            outcomes: params.outcomes || ['success', 'failure', 'timeout'],
            
            // Participants
            creator: params.creator,
            participants: [{
                agent_id: params.creator,
                prediction: params.initial_prediction,
                stake: params.initial_stake || 100,
                confidence: params.confidence || 0.5,
                joined_at: new Date().toISOString()
            }],
            
            // Market data
            total_pool: params.initial_stake || 100,
            odds_history: [],
            
            // Resolution
            resolution_time: params.resolution_time || null,
            resolution_method: params.resolution_method || 'automatic',
            actual_outcome: null,
            resolved_at: null
        };
        
        // Calculate initial odds
        const initialOdds = this.calculateInitialOdds(duel);
        duel.current_odds = initialOdds;
        duel.odds_history.push({
            timestamp: new Date().toISOString(),
            odds: initialOdds,
            event: 'duel_created'
        });
        
        // Save duel
        this.saveDuel(duel);
        this.activeDuels.set(duelId, duel);
        
        // Update market state
        this.updateMarketState();
        
        // Emit event
        this.emit('duel_created', duel);
        
        console.log(`✨ Duel created: ${duelId}`);
        return duel;
    }
    
    joinDuel(duelId, participant) {
        const duel = this.activeDuels.get(duelId);
        
        if (!duel) {
            throw new Error(`Duel not found: ${duelId}`);
        }
        
        if (duel.status !== 'open') {
            throw new Error(`Duel is not open: ${duel.status}`);
        }
        
        // Check if already participating
        const existing = duel.participants.find(p => p.agent_id === participant.agent_id);
        if (existing) {
            throw new Error('Already participating in this duel');
        }
        
        // Add participant
        const entry = {
            agent_id: participant.agent_id,
            prediction: participant.prediction,
            stake: participant.stake || 100,
            confidence: participant.confidence || 0.5,
            joined_at: new Date().toISOString()
        };
        
        duel.participants.push(entry);
        duel.total_pool += entry.stake;
        
        // Recalculate odds
        const newOdds = this.recalculateOdds(duel);
        duel.current_odds = newOdds;
        duel.odds_history.push({
            timestamp: new Date().toISOString(),
            odds: newOdds,
            event: 'participant_joined',
            participant: participant.agent_id
        });
        
        // Save updated duel
        this.saveDuel(duel);
        
        // Emit event
        this.emit('participant_joined', { duel_id: duelId, participant: entry });
        
        console.log(`👤 ${participant.agent_id} joined duel ${duelId}`);
        return duel;
    }
    
    calculateInitialOdds(duel) {
        const odds = {};
        
        // Simple initial odds based on equal probability
        const outcomeCount = duel.outcomes.length;
        duel.outcomes.forEach(outcome => {
            odds[outcome] = outcomeCount; // e.g., 3:1 for 3 outcomes
        });
        
        // Adjust based on creator's confidence
        const creatorPrediction = duel.participants[0].prediction;
        const creatorConfidence = duel.participants[0].confidence;
        
        // Reduce odds for creator's prediction based on confidence
        odds[creatorPrediction] = odds[creatorPrediction] * (2 - creatorConfidence);
        
        return odds;
    }
    
    recalculateOdds(duel) {
        const odds = {};
        const predictions = {};
        
        // Count predictions and total stakes
        duel.outcomes.forEach(outcome => {
            predictions[outcome] = {
                count: 0,
                total_stake: 0,
                total_confidence: 0
            };
        });
        
        duel.participants.forEach(p => {
            const pred = predictions[p.prediction];
            if (pred) {
                pred.count++;
                pred.total_stake += p.stake;
                pred.total_confidence += p.confidence * p.stake;
            }
        });
        
        // Calculate odds based on stake distribution
        const totalStake = duel.total_pool;
        
        duel.outcomes.forEach(outcome => {
            const pred = predictions[outcome];
            if (pred.total_stake > 0) {
                // Odds = total pool / stake on this outcome
                odds[outcome] = totalStake / pred.total_stake;
            } else {
                // No bets on this outcome, high odds
                odds[outcome] = totalStake;
            }
            
            // Adjust for average confidence
            if (pred.count > 0) {
                const avgConfidence = pred.total_confidence / pred.total_stake;
                odds[outcome] = odds[outcome] * (2 - avgConfidence);
            }
        });
        
        return odds;
    }
    
    resolveDuel(duelId, actualOutcome, metadata = {}) {
        const duel = this.activeDuels.get(duelId);
        
        if (!duel) {
            throw new Error(`Duel not found: ${duelId}`);
        }
        
        if (duel.status === 'resolved') {
            throw new Error('Duel already resolved');
        }
        
        // Validate outcome
        if (!duel.outcomes.includes(actualOutcome)) {
            throw new Error(`Invalid outcome: ${actualOutcome}`);
        }
        
        // Calculate payouts
        const payouts = this.calculatePayouts(duel, actualOutcome);
        
        // Update duel
        duel.status = 'resolved';
        duel.actual_outcome = actualOutcome;
        duel.resolved_at = new Date().toISOString();
        duel.resolution_metadata = metadata;
        duel.payouts = payouts;
        
        // Archive duel
        this.archiveDuel(duel);
        this.activeDuels.delete(duelId);
        
        // Update market state
        this.updateMarketState();
        
        // Emit resolution event
        this.emit('duel_resolved', {
            duel_id: duelId,
            outcome: actualOutcome,
            payouts
        });
        
        console.log(`🏁 Duel resolved: ${duelId} → ${actualOutcome}`);
        return duel;
    }
    
    calculatePayouts(duel, actualOutcome) {
        const payouts = [];
        const winners = duel.participants.filter(p => p.prediction === actualOutcome);
        const winnerStakes = winners.reduce((sum, w) => sum + w.stake, 0);
        
        if (winnerStakes === 0) {
            // No winners, return stakes
            duel.participants.forEach(p => {
                payouts.push({
                    agent_id: p.agent_id,
                    payout: p.stake,
                    profit: 0,
                    result: 'no_winners'
                });
            });
        } else {
            // Distribute pool to winners proportionally
            winners.forEach(winner => {
                const share = winner.stake / winnerStakes;
                const payout = Math.floor(duel.total_pool * share);
                const profit = payout - winner.stake;
                
                payouts.push({
                    agent_id: winner.agent_id,
                    payout,
                    profit,
                    result: 'win'
                });
            });
            
            // Losers get nothing
            duel.participants.filter(p => p.prediction !== actualOutcome).forEach(loser => {
                payouts.push({
                    agent_id: loser.agent_id,
                    payout: 0,
                    profit: -loser.stake,
                    result: 'loss'
                });
            });
        }
        
        return payouts;
    }
    
    generateDuelId() {
        return `duel_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    saveDuel(duel) {
        const filepath = path.join(this.duelsDir, `${duel.duel_id}.json`);
        fs.writeFileSync(filepath, JSON.stringify(duel, null, 2));
    }
    
    archiveDuel(duel) {
        // Move to archive
        const sourcePath = path.join(this.duelsDir, `${duel.duel_id}.json`);
        const archivePath = path.join(this.archiveDir, `${duel.duel_id}.json`);
        
        fs.renameSync(sourcePath, archivePath);
    }
    
    updateMarketState() {
        this.marketState.active_duels = this.activeDuels.size;
        this.marketState.total_volume = 0;
        this.marketState.total_participants.clear();
        
        this.activeDuels.forEach(duel => {
            this.marketState.total_volume += duel.total_pool;
            duel.participants.forEach(p => {
                this.marketState.total_participants.add(p.agent_id);
            });
        });
    }
    
    getMarketState() {
        return {
            ...this.marketState,
            unique_participants: this.marketState.total_participants.size
        };
    }
    
    getDuel(duelId) {
        return this.activeDuels.get(duelId) || null;
    }
    
    getActiveDuels() {
        return Array.from(this.activeDuels.values());
    }
    
    getDuelsByTarget(targetId) {
        return Array.from(this.activeDuels.values())
            .filter(duel => duel.target_id === targetId);
    }
}

// Export for use
module.exports = DuelEngineCore;

// Example usage
if (require.main === module) {
    const engine = new DuelEngineCore();
    
    // Example: Create a duel on loop outcome
    const duel = engine.createDuel({
        target_type: 'loop_outcome',
        target_id: 'loop_12345',
        target_description: 'Will loop_12345 achieve resonance > 0.8?',
        outcomes: ['yes', 'no', 'timeout'],
        creator: 'agent_alice',
        initial_prediction: 'yes',
        initial_stake: 500,
        confidence: 0.7,
        resolution_time: new Date(Date.now() + 3600000).toISOString() // 1 hour
    });
    
    console.log('\nDuel created:', JSON.stringify(duel, null, 2));
    
    // Example: Join the duel
    try {
        engine.joinDuel(duel.duel_id, {
            agent_id: 'agent_bob',
            prediction: 'no',
            stake: 300,
            confidence: 0.6
        });
        
        console.log('\nUpdated odds:', engine.getDuel(duel.duel_id).current_odds);
    } catch (err) {
        console.error('Join failed:', err.message);
    }
    
    // Example: Resolve the duel
    setTimeout(() => {
        const resolved = engine.resolveDuel(duel.duel_id, 'yes', {
            actual_resonance: 0.85,
            loop_duration: 1800000
        });
        
        console.log('\nPayouts:', resolved.payouts);
    }, 2000);
}