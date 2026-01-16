#!/usr/bin/env node

/**
 * 🎲 BETTING SHELL
 * 
 * Manages bet placement, odds calculation, and live betting
 * Integrates with Economy Shell for transactions
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class BettingShell extends EventEmitter {
    constructor(economyShell) {
        super();
        
        this.economyShell = economyShell;
        
        // Betting configuration
        this.config = {
            oddsUpdateInterval: 5000, // 5 seconds
            liveBettingCutoff: 0.75, // Stop live betting at 75% fight completion
            maxOddsShift: 0.3, // Max 30% odds shift during fight
            favoriteBonus: 1.1, // 10% better odds for underdog
            parleyMultiplier: 2.5, // Parley bet multiplier
            specialBetTypes: [
                'first_blood',
                'knockout',
                'flawless_victory',
                'comeback_king',
                'total_rounds'
            ]
        };
        
        // Active betting markets
        this.markets = new Map();
        
        // Bet history
        this.betHistory = new Map();
        
        // Live odds tracking
        this.liveOdds = new Map();
        
        // Special bets
        this.specialBets = new Map();
    }
    
    createMarket(fightId, gladiator1, gladiator2) {
        // Calculate initial odds based on stats
        const odds1 = this.calculateInitialOdds(gladiator1, gladiator2);
        const odds2 = this.calculateInitialOdds(gladiator2, gladiator1);
        
        const market = {
            fightId: fightId,
            gladiator1: {
                ...gladiator1,
                odds: odds1,
                initialOdds: odds1,
                totalBets: 0,
                betCount: 0
            },
            gladiator2: {
                ...gladiator2,
                odds: odds2,
                initialOdds: odds2,
                totalBets: 0,
                betCount: 0
            },
            status: 'open',
            created: Date.now(),
            specialBets: this.createSpecialBets(fightId)
        };
        
        this.markets.set(fightId, market);
        
        // Create economy pool
        this.economyShell.createBettingPool(fightId, gladiator1, gladiator2);
        
        this.emit('market-created', market);
        
        return market;
    }
    
    calculateInitialOdds(gladiator, opponent) {
        // Base odds on stats
        const powerRatio = gladiator.power / (gladiator.power + opponent.power);
        const defenseRatio = gladiator.defense / (gladiator.defense + opponent.defense);
        const speedRatio = gladiator.speed / (gladiator.speed + opponent.speed);
        
        // Weight different stats
        const statScore = (powerRatio * 0.4) + (defenseRatio * 0.3) + (speedRatio * 0.3);
        
        // Factor in win rate if available
        let winRateBonus = 0;
        if (gladiator.wins && gladiator.losses) {
            const winRate = gladiator.wins / (gladiator.wins + gladiator.losses);
            winRateBonus = (winRate - 0.5) * 0.2; // Max 10% bonus
        }
        
        // Calculate odds (higher = better chance)
        const rawOdds = statScore + winRateBonus;
        
        // Convert to betting odds (2.0 = even money)
        const bettingOdds = 1 / rawOdds;
        
        // Round to 2 decimal places
        return Math.round(bettingOdds * 100) / 100;
    }
    
    createSpecialBets(fightId) {
        const specialBets = new Map();
        
        // First Blood
        specialBets.set('first_blood', {
            type: 'first_blood',
            description: 'Who draws first blood?',
            options: ['gladiator1', 'gladiator2'],
            odds: { gladiator1: 1.8, gladiator2: 1.8 },
            status: 'open'
        });
        
        // Knockout
        specialBets.set('knockout', {
            type: 'knockout',
            description: 'Will there be a knockout?',
            options: ['yes', 'no'],
            odds: { yes: 2.5, no: 1.5 },
            status: 'open'
        });
        
        // Total Rounds
        specialBets.set('total_rounds', {
            type: 'total_rounds',
            description: 'Total rounds over/under 25',
            options: ['over', 'under'],
            odds: { over: 1.9, under: 1.9 },
            status: 'open'
        });
        
        // Flawless Victory
        specialBets.set('flawless_victory', {
            type: 'flawless_victory',
            description: 'Will winner have >80% HP?',
            options: ['yes', 'no'],
            odds: { yes: 3.5, no: 1.3 },
            status: 'open'
        });
        
        // Comeback
        specialBets.set('comeback', {
            type: 'comeback',
            description: 'Comeback from <30% HP?',
            options: ['yes', 'no'],
            odds: { yes: 4.0, no: 1.2 },
            status: 'open'
        });
        
        return specialBets;
    }
    
    placeBet(playerId, fightId, betType, selection, amount) {
        const market = this.markets.get(fightId);
        if (!market || market.status !== 'open') {
            return { success: false, error: 'Market closed' };
        }
        
        // Regular bet on winner
        if (betType === 'winner') {
            const result = this.economyShell.placeBet(playerId, fightId, selection, amount);
            
            if (result.success) {
                // Update market stats
                if (selection === market.gladiator1.id) {
                    market.gladiator1.totalBets += amount;
                    market.gladiator1.betCount++;
                } else {
                    market.gladiator2.totalBets += amount;
                    market.gladiator2.betCount++;
                }
                
                // Update odds based on betting volume
                this.updateMarketOdds(fightId);
                
                // Record bet
                this.recordBet(playerId, fightId, betType, selection, amount, result.bet.odds);
            }
            
            return result;
        }
        
        // Special bet
        else if (this.config.specialBetTypes.includes(betType)) {
            return this.placeSpecialBet(playerId, fightId, betType, selection, amount);
        }
        
        return { success: false, error: 'Invalid bet type' };
    }
    
    placeSpecialBet(playerId, fightId, betType, selection, amount) {
        const market = this.markets.get(fightId);
        if (!market) return { success: false, error: 'Market not found' };
        
        const specialBet = market.specialBets.get(betType);
        if (!specialBet || specialBet.status !== 'open') {
            return { success: false, error: 'Special bet not available' };
        }
        
        // Check valid selection
        if (!specialBet.options.includes(selection)) {
            return { success: false, error: 'Invalid selection' };
        }
        
        // Process through economy
        const account = this.economyShell.playerLedger.get(playerId);
        if (!account || account.balance < amount) {
            return { success: false, error: 'Insufficient balance' };
        }
        
        // Deduct balance
        account.balance -= amount;
        account.totalWagered += amount;
        
        // Record special bet
        const betId = crypto.randomBytes(8).toString('hex');
        const bet = {
            id: betId,
            playerId: playerId,
            fightId: fightId,
            type: betType,
            selection: selection,
            amount: amount,
            odds: specialBet.odds[selection],
            timestamp: Date.now(),
            status: 'pending'
        };
        
        if (!this.specialBets.has(fightId)) {
            this.specialBets.set(fightId, []);
        }
        this.specialBets.get(fightId).push(bet);
        
        // Record in history
        this.recordBet(playerId, fightId, betType, selection, amount, bet.odds);
        
        this.emit('special-bet-placed', bet);
        
        return {
            success: true,
            bet: bet,
            newBalance: account.balance
        };
    }
    
    updateMarketOdds(fightId) {
        const market = this.markets.get(fightId);
        if (!market) return;
        
        // Calculate betting ratio
        const total = market.gladiator1.totalBets + market.gladiator2.totalBets;
        if (total === 0) return;
        
        const ratio1 = market.gladiator1.totalBets / total;
        const ratio2 = market.gladiator2.totalBets / total;
        
        // Adjust odds based on betting volume (more bets = worse odds)
        const adjustment1 = (0.5 - ratio1) * this.config.maxOddsShift;
        const adjustment2 = (0.5 - ratio2) * this.config.maxOddsShift;
        
        market.gladiator1.odds = Math.max(1.1, 
            Math.round((market.gladiator1.initialOdds + adjustment1) * 100) / 100
        );
        market.gladiator2.odds = Math.max(1.1,
            Math.round((market.gladiator2.initialOdds + adjustment2) * 100) / 100
        );
        
        this.emit('odds-updated', {
            fightId: fightId,
            gladiator1Odds: market.gladiator1.odds,
            gladiator2Odds: market.gladiator2.odds
        });
    }
    
    updateLiveOdds(fightId, fightStatus) {
        const market = this.markets.get(fightId);
        if (!market || market.status !== 'live') return;
        
        // Check if past cutoff
        const fightProgress = fightStatus.round / 50; // Assuming 50 max rounds
        if (fightProgress > this.config.liveBettingCutoff) {
            this.closeMarket(fightId);
            return;
        }
        
        // Adjust odds based on current HP
        const hp1Ratio = fightStatus.gladiator1HP / 100;
        const hp2Ratio = fightStatus.gladiator2HP / 100;
        
        // Heavily favor the gladiator with more HP
        const hpAdjustment = (hp1Ratio - hp2Ratio) * 0.5;
        
        market.gladiator1.odds = Math.max(1.05,
            Math.round((market.gladiator1.initialOdds - hpAdjustment) * 100) / 100
        );
        market.gladiator2.odds = Math.max(1.05,
            Math.round((market.gladiator2.initialOdds + hpAdjustment) * 100) / 100
        );
        
        this.liveOdds.set(fightId, {
            gladiator1: market.gladiator1.odds,
            gladiator2: market.gladiator2.odds,
            lastUpdate: Date.now()
        });
        
        this.emit('live-odds-updated', {
            fightId: fightId,
            odds: this.liveOdds.get(fightId),
            fightProgress: fightProgress
        });
    }
    
    startLiveBetting(fightId) {
        const market = this.markets.get(fightId);
        if (!market) return;
        
        market.status = 'live';
        this.emit('live-betting-started', { fightId });
    }
    
    closeMarket(fightId) {
        const market = this.markets.get(fightId);
        if (!market) return;
        
        market.status = 'closed';
        market.closedAt = Date.now();
        
        // Close special bets
        market.specialBets.forEach(bet => {
            bet.status = 'closed';
        });
        
        // Notify economy shell
        this.economyShell.closeBettingPool(fightId);
        
        this.emit('market-closed', { fightId });
    }
    
    resolveSpecialBets(fightId, fightResult) {
        const specialBets = this.specialBets.get(fightId);
        if (!specialBets) return;
        
        specialBets.forEach(bet => {
            let won = false;
            
            switch (bet.type) {
                case 'first_blood':
                    won = (bet.selection === 'gladiator1' && fightResult.firstBlood === 'gladiator1') ||
                          (bet.selection === 'gladiator2' && fightResult.firstBlood === 'gladiator2');
                    break;
                    
                case 'knockout':
                    const isKnockout = fightResult.winner && 
                        (fightResult.loserHP === 0 || fightResult.rounds < 20);
                    won = (bet.selection === 'yes' && isKnockout) ||
                          (bet.selection === 'no' && !isKnockout);
                    break;
                    
                case 'total_rounds':
                    won = (bet.selection === 'over' && fightResult.rounds > 25) ||
                          (bet.selection === 'under' && fightResult.rounds <= 25);
                    break;
                    
                case 'flawless_victory':
                    const isFlawless = fightResult.winnerHP > 80;
                    won = (bet.selection === 'yes' && isFlawless) ||
                          (bet.selection === 'no' && !isFlawless);
                    break;
                    
                case 'comeback':
                    won = (bet.selection === 'yes' && fightResult.hadComeback) ||
                          (bet.selection === 'no' && !fightResult.hadComeback);
                    break;
            }
            
            // Process payout
            if (won) {
                const payout = Math.floor(bet.amount * bet.odds);
                const account = this.economyShell.playerLedger.get(bet.playerId);
                if (account) {
                    account.balance += payout;
                    account.totalWon += payout - bet.amount;
                }
                
                bet.status = 'won';
                bet.payout = payout;
            } else {
                bet.status = 'lost';
                const account = this.economyShell.playerLedger.get(bet.playerId);
                if (account) {
                    account.totalLost += bet.amount;
                }
            }
        });
    }
    
    recordBet(playerId, fightId, betType, selection, amount, odds) {
        if (!this.betHistory.has(playerId)) {
            this.betHistory.set(playerId, []);
        }
        
        const bet = {
            fightId: fightId,
            betType: betType,
            selection: selection,
            amount: amount,
            odds: odds,
            timestamp: Date.now()
        };
        
        this.betHistory.get(playerId).push(bet);
        
        // Keep only last 100 bets per player
        const history = this.betHistory.get(playerId);
        if (history.length > 100) {
            this.betHistory.set(playerId, history.slice(-100));
        }
    }
    
    getMarketInfo(fightId) {
        const market = this.markets.get(fightId);
        if (!market) return null;
        
        return {
            status: market.status,
            gladiator1: {
                name: market.gladiator1.name,
                odds: market.gladiator1.odds,
                totalBets: market.gladiator1.totalBets,
                betCount: market.gladiator1.betCount
            },
            gladiator2: {
                name: market.gladiator2.name,
                odds: market.gladiator2.odds,
                totalBets: market.gladiator2.totalBets,
                betCount: market.gladiator2.betCount
            },
            totalPool: market.gladiator1.totalBets + market.gladiator2.totalBets,
            specialBets: Array.from(market.specialBets.values())
        };
    }
    
    getPlayerBetHistory(playerId, limit = 10) {
        const history = this.betHistory.get(playerId) || [];
        return history.slice(-limit).reverse();
    }
    
    getBettingTrends() {
        const trends = {
            totalVolume: 0,
            popularGladiators: new Map(),
            biggestBets: [],
            recentActivity: []
        };
        
        // Calculate from all active markets
        this.markets.forEach(market => {
            const volume = market.gladiator1.totalBets + market.gladiator2.totalBets;
            trends.totalVolume += volume;
            
            // Track popular gladiators
            if (!trends.popularGladiators.has(market.gladiator1.id)) {
                trends.popularGladiators.set(market.gladiator1.id, {
                    name: market.gladiator1.name,
                    totalBets: 0,
                    betCount: 0
                });
            }
            const glad1Stats = trends.popularGladiators.get(market.gladiator1.id);
            glad1Stats.totalBets += market.gladiator1.totalBets;
            glad1Stats.betCount += market.gladiator1.betCount;
        });
        
        return trends;
    }
}

module.exports = BettingShell;