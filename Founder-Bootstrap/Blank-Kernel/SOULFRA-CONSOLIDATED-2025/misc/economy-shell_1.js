#!/usr/bin/env node

/**
 * 💰 ECONOMY SHELL
 * 
 * Manages all currency transactions, betting pools, and economic mechanics
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class EconomyShell extends EventEmitter {
    constructor() {
        super();
        
        // Economy configuration
        this.config = {
            startingBalance: 1000,
            contributionAmount: 1000,
            minBet: 10,
            maxBet: 10000,
            houseEdge: 0.02, // 2%
            winMultiplier: 1.8,
            currencySymbol: '❤️'
        };
        
        // Ledgers
        this.playerLedger = new Map();
        this.betLedger = new Map();
        this.transactionHistory = [];
        
        // Betting pools
        this.activePools = new Map();
        
        // Economy stats
        this.stats = {
            totalCirculation: 0,
            totalBetsPlaced: 0,
            totalBetsVolume: 0,
            houseProfits: 0,
            biggestWin: 0,
            biggestBet: 0
        };
        
        // Ledger files
        this.ledgerPath = path.join(__dirname, '..', 'ledgers');
        this.playerLedgerFile = path.join(this.ledgerPath, 'player-ledger.json');
        this.economyStatsFile = path.join(this.ledgerPath, 'economy-stats.json');
    }
    
    async initialize() {
        // Create ledger directory
        await fs.mkdir(this.ledgerPath, { recursive: true });
        
        // Load existing ledgers
        await this.loadLedgers();
        
        // Start auto-save
        this.startAutoSave();
        
        console.log('💰 Economy Shell initialized');
        console.log(`   Total circulation: ${this.config.currencySymbol} ${this.stats.totalCirculation}`);
    }
    
    async loadLedgers() {
        try {
            // Load player ledger
            const playerData = await fs.readFile(this.playerLedgerFile, 'utf8');
            const players = JSON.parse(playerData);
            Object.entries(players).forEach(([id, data]) => {
                this.playerLedger.set(id, data);
            });
            
            // Load economy stats
            const statsData = await fs.readFile(this.economyStatsFile, 'utf8');
            this.stats = JSON.parse(statsData);
        } catch (error) {
            // Files don't exist yet, that's ok
            console.log('💰 Creating new ledgers...');
        }
    }
    
    async saveLedgers() {
        try {
            // Save player ledger
            const playerData = {};
            this.playerLedger.forEach((data, id) => {
                playerData[id] = data;
            });
            await fs.writeFile(this.playerLedgerFile, JSON.stringify(playerData, null, 2));
            
            // Save economy stats
            await fs.writeFile(this.economyStatsFile, JSON.stringify(this.stats, null, 2));
        } catch (error) {
            console.error('Failed to save ledgers:', error);
        }
    }
    
    startAutoSave() {
        setInterval(() => {
            this.saveLedgers();
        }, 30000); // Save every 30 seconds
    }
    
    createPlayerAccount(playerId, initialData = {}) {
        if (this.playerLedger.has(playerId)) {
            return this.playerLedger.get(playerId);
        }
        
        const account = {
            id: playerId,
            balance: this.config.startingBalance,
            totalWagered: 0,
            totalWon: 0,
            totalLost: 0,
            winRate: 0,
            biggestWin: 0,
            currentStreak: 0,
            bestStreak: 0,
            transactions: [],
            created: Date.now(),
            ...initialData
        };
        
        this.playerLedger.set(playerId, account);
        this.stats.totalCirculation += account.balance;
        
        this.emit('account-created', account);
        
        return account;
    }
    
    getPlayerBalance(playerId) {
        const account = this.playerLedger.get(playerId);
        return account ? account.balance : 0;
    }
    
    contribute(playerId, amount = null) {
        const contributionAmount = amount || this.config.contributionAmount;
        let account = this.playerLedger.get(playerId);
        
        if (!account) {
            account = this.createPlayerAccount(playerId);
        }
        
        // Add to balance
        account.balance += contributionAmount;
        this.stats.totalCirculation += contributionAmount;
        
        // Record transaction
        const transaction = {
            id: crypto.randomBytes(8).toString('hex'),
            type: 'contribution',
            playerId: playerId,
            amount: contributionAmount,
            timestamp: Date.now()
        };
        
        account.transactions.push(transaction);
        this.transactionHistory.push(transaction);
        
        this.emit('contribution', {
            playerId,
            amount: contributionAmount,
            newBalance: account.balance
        });
        
        return {
            success: true,
            amount: contributionAmount,
            newBalance: account.balance
        };
    }
    
    createBettingPool(fightId, gladiator1, gladiator2) {
        const pool = {
            fightId: fightId,
            gladiator1: {
                id: gladiator1.id,
                name: gladiator1.name,
                bets: new Map(),
                totalBets: 0
            },
            gladiator2: {
                id: gladiator2.id,
                name: gladiator2.name,
                bets: new Map(),
                totalBets: 0
            },
            totalPool: 0,
            status: 'open',
            created: Date.now()
        };
        
        this.activePools.set(fightId, pool);
        
        this.emit('pool-created', pool);
        
        return pool;
    }
    
    placeBet(playerId, fightId, gladiatorId, amount) {
        // Validate player
        const account = this.playerLedger.get(playerId);
        if (!account) {
            return { success: false, error: 'Account not found' };
        }
        
        // Validate amount
        if (amount < this.config.minBet || amount > this.config.maxBet) {
            return { success: false, error: 'Invalid bet amount' };
        }
        
        if (account.balance < amount) {
            return { success: false, error: 'Insufficient balance' };
        }
        
        // Validate pool
        const pool = this.activePools.get(fightId);
        if (!pool || pool.status !== 'open') {
            return { success: false, error: 'Betting closed' };
        }
        
        // Find which gladiator
        let targetGladiator;
        if (pool.gladiator1.id === gladiatorId) {
            targetGladiator = pool.gladiator1;
        } else if (pool.gladiator2.id === gladiatorId) {
            targetGladiator = pool.gladiator2;
        } else {
            return { success: false, error: 'Invalid gladiator' };
        }
        
        // Place the bet
        account.balance -= amount;
        account.totalWagered += amount;
        
        // Add to pool
        const existingBet = targetGladiator.bets.get(playerId) || 0;
        targetGladiator.bets.set(playerId, existingBet + amount);
        targetGladiator.totalBets += amount;
        pool.totalPool += amount;
        
        // Record bet
        const bet = {
            id: crypto.randomBytes(8).toString('hex'),
            playerId: playerId,
            fightId: fightId,
            gladiatorId: gladiatorId,
            amount: amount,
            timestamp: Date.now(),
            odds: this.calculateOdds(pool, gladiatorId)
        };
        
        this.betLedger.set(bet.id, bet);
        
        // Update stats
        this.stats.totalBetsPlaced++;
        this.stats.totalBetsVolume += amount;
        if (amount > this.stats.biggestBet) {
            this.stats.biggestBet = amount;
        }
        
        // Record transaction
        const transaction = {
            id: crypto.randomBytes(8).toString('hex'),
            type: 'bet',
            playerId: playerId,
            amount: -amount,
            fightId: fightId,
            timestamp: Date.now()
        };
        
        account.transactions.push(transaction);
        this.transactionHistory.push(transaction);
        
        this.emit('bet-placed', {
            bet: bet,
            pool: pool,
            playerBalance: account.balance
        });
        
        return {
            success: true,
            bet: bet,
            newBalance: account.balance
        };
    }
    
    calculateOdds(pool, gladiatorId) {
        const glad1Total = pool.gladiator1.totalBets || 1;
        const glad2Total = pool.gladiator2.totalBets || 1;
        const total = glad1Total + glad2Total;
        
        if (pool.gladiator1.id === gladiatorId) {
            return (total / glad1Total * (1 - this.config.houseEdge)).toFixed(2);
        } else {
            return (total / glad2Total * (1 - this.config.houseEdge)).toFixed(2);
        }
    }
    
    closeBettingPool(fightId) {
        const pool = this.activePools.get(fightId);
        if (!pool) return false;
        
        pool.status = 'closed';
        pool.closedAt = Date.now();
        
        this.emit('pool-closed', pool);
        
        return true;
    }
    
    resolveBets(fightId, winnerGladiatorId) {
        const pool = this.activePools.get(fightId);
        if (!pool || pool.status === 'resolved') return;
        
        pool.status = 'resolved';
        pool.winnerId = winnerGladiatorId;
        
        // Calculate house take
        const houseTake = Math.floor(pool.totalPool * this.config.houseEdge);
        this.stats.houseProfits += houseTake;
        const availablePool = pool.totalPool - houseTake;
        
        // Find winning gladiator
        let winningGladiator;
        if (pool.gladiator1.id === winnerGladiatorId) {
            winningGladiator = pool.gladiator1;
        } else if (pool.gladiator2.id === winnerGladiatorId) {
            winningGladiator = pool.gladiator2;
        } else {
            // Draw - return bets
            this.returnBets(pool);
            return;
        }
        
        // Pay out winners
        const payouts = [];
        winningGladiator.bets.forEach((betAmount, playerId) => {
            const account = this.playerLedger.get(playerId);
            if (!account) return;
            
            // Calculate payout
            const proportion = betAmount / winningGladiator.totalBets;
            const payout = Math.floor(availablePool * proportion);
            
            // Update account
            account.balance += payout;
            account.totalWon += payout - betAmount;
            account.currentStreak++;
            
            if (account.currentStreak > account.bestStreak) {
                account.bestStreak = account.currentStreak;
            }
            
            if (payout - betAmount > account.biggestWin) {
                account.biggestWin = payout - betAmount;
            }
            
            if (payout - betAmount > this.stats.biggestWin) {
                this.stats.biggestWin = payout - betAmount;
            }
            
            // Record transaction
            const transaction = {
                id: crypto.randomBytes(8).toString('hex'),
                type: 'payout',
                playerId: playerId,
                amount: payout,
                fightId: fightId,
                timestamp: Date.now()
            };
            
            account.transactions.push(transaction);
            this.transactionHistory.push(transaction);
            
            payouts.push({
                playerId: playerId,
                betAmount: betAmount,
                payout: payout,
                profit: payout - betAmount
            });
        });
        
        // Update losers
        const losingGladiator = pool.gladiator1.id === winnerGladiatorId ? 
            pool.gladiator2 : pool.gladiator1;
            
        losingGladiator.bets.forEach((betAmount, playerId) => {
            const account = this.playerLedger.get(playerId);
            if (!account) return;
            
            account.totalLost += betAmount;
            account.currentStreak = 0;
            
            // Update win rate
            const totalBets = (account.totalWon + account.totalLost) / this.config.contributionAmount;
            account.winRate = totalBets > 0 ? 
                (account.totalWon / (account.totalWon + account.totalLost)) : 0;
        });
        
        // Clean up
        this.activePools.delete(fightId);
        
        this.emit('bets-resolved', {
            fightId: fightId,
            winnerId: winnerGladiatorId,
            totalPool: pool.totalPool,
            houseTake: houseTake,
            payouts: payouts
        });
    }
    
    returnBets(pool) {
        // Return all bets in case of draw or cancellation
        pool.gladiator1.bets.forEach((amount, playerId) => {
            const account = this.playerLedger.get(playerId);
            if (account) {
                account.balance += amount;
            }
        });
        
        pool.gladiator2.bets.forEach((amount, playerId) => {
            const account = this.playerLedger.get(playerId);
            if (account) {
                account.balance += amount;
            }
        });
        
        pool.status = 'cancelled';
        this.activePools.delete(pool.fightId);
    }
    
    getEconomyStats() {
        return {
            ...this.stats,
            activePlayers: this.playerLedger.size,
            activeBettingPools: this.activePools.size,
            currencySymbol: this.config.currencySymbol
        };
    }
    
    getPlayerStats(playerId) {
        const account = this.playerLedger.get(playerId);
        if (!account) return null;
        
        return {
            balance: account.balance,
            totalWagered: account.totalWagered,
            totalWon: account.totalWon,
            totalLost: account.totalLost,
            winRate: (account.winRate * 100).toFixed(1) + '%',
            biggestWin: account.biggestWin,
            currentStreak: account.currentStreak,
            bestStreak: account.bestStreak,
            recentTransactions: account.transactions.slice(-10).reverse()
        };
    }
}

module.exports = EconomyShell;