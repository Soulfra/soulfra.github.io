#!/usr/bin/env node

/**
 * 🎮 GAME ORCHESTRATOR
 * 
 * Central coordinator for the Billion Dollar Gladiator Arena
 * Manages all shells and game state
 */

const EventEmitter = require('events');
const BattleShell = require('./shells/battle-shell');
const EconomyShell = require('./shells/economy-shell');
const ChatShell = require('./shells/chat-shell');
const BettingShell = require('./shells/betting-shell');
const GameInfinityRouter = require('./game-infinity-router');

class GameOrchestrator extends EventEmitter {
    constructor() {
        super();
        
        // Initialize shells
        this.battleShell = new BattleShell();
        this.economyShell = new EconomyShell();
        this.chatShell = new ChatShell();
        this.bettingShell = new BettingShell(this.economyShell);
        this.router = new GameInfinityRouter();
        
        // Game state
        this.state = {
            totalContributed: 0,
            currentFightId: null,
            nextFightTime: null,
            phase: 'intermission', // intermission, betting, fighting, resolution
            activePlayers: new Map(),
            fightSchedule: [],
            tournamentMode: false
        };
        
        // Gladiator roster
        this.gladiators = this.createGladiatorRoster();
        
        // Game loop timing
        this.phaseTimers = {
            intermission: 60000, // 1 minute
            betting: 30000,      // 30 seconds
            fighting: null,      // Variable based on fight
            resolution: 30000    // 30 seconds
        };
        
        // Fight queue
        this.fightQueue = [];
        
        // Setup shell listeners
        this.setupShellListeners();
    }
    
    async initialize() {
        console.log('🎮 Game Orchestrator initializing...');
        
        // Initialize all shells
        await Promise.all([
            this.economyShell.initialize(),
            this.router.initialize()
        ]);
        
        // Create initial gladiators
        this.seedGladiators();
        
        // Start game loop
        this.startGameLoop();
        
        console.log('🎮 Game Orchestrator ready!');
        console.log('   Phase: Intermission');
        console.log('   Next fight in: 60 seconds');
    }
    
    createGladiatorRoster() {
        return [
            {
                id: 'cal_prime',
                name: 'Cal Prime',
                title: 'The Quantum Warrior',
                type: 'QUANTUM_WARRIOR',
                stats: {
                    power: 95,
                    defense: 82,
                    speed: 88,
                    stamina: 90,
                    maxHP: 100
                },
                special: 'Mind Blast',
                taunt: 'Your reality is mine to shape!',
                wins: 847,
                losses: 153,
                fanBase: 42069
            },
            {
                id: 'domingo_boss',
                name: 'Domingo Boss',
                title: 'The Economic Overlord',
                type: 'ECONOMIC_BOSS',
                stats: {
                    power: 90,
                    defense: 95,
                    speed: 75,
                    stamina: 85,
                    maxHP: 120
                },
                special: 'Money Shield',
                taunt: 'Money talks, poverty walks!',
                wins: 666,
                losses: 234,
                fanBase: 31337
            },
            {
                id: 'void_speaker',
                name: 'Void Speaker',
                title: 'The Word Assassin',
                type: 'WORD_ASSASSIN',
                stats: {
                    power: 88,
                    defense: 78,
                    speed: 92,
                    stamina: 87,
                    maxHP: 90
                },
                special: 'Language Prison',
                taunt: 'Words cut deeper than swords!',
                wins: 512,
                losses: 256,
                fanBase: 8192
            },
            {
                id: 'mirror_dancer',
                name: 'Mirror Dancer',
                title: 'The Reflection',
                type: 'MIRROR_TYPE',
                stats: {
                    power: 85,
                    defense: 85,
                    speed: 85,
                    stamina: 85,
                    maxHP: 100
                },
                special: 'Perfect Copy',
                taunt: 'I am you, but better!',
                wins: 333,
                losses: 333,
                fanBase: 13337
            },
            {
                id: 'chad_destroyer',
                name: 'Chad Destroyer',
                title: 'The Gigachad',
                type: 'PHYSICAL_BEAST',
                stats: {
                    power: 99,
                    defense: 70,
                    speed: 80,
                    stamina: 95,
                    maxHP: 110
                },
                special: 'Sigma Strike',
                taunt: 'Built different, cry about it!',
                wins: 420,
                losses: 69,
                fanBase: 69420
            }
        ];
    }
    
    seedGladiators() {
        // Add gladiators to economy ledger
        this.gladiators.forEach(gladiator => {
            this.economyShell.createPlayerAccount(`gladiator_${gladiator.id}`, {
                isGladiator: true,
                gladiatorData: gladiator
            });
        });
    }
    
    setupShellListeners() {
        // Battle events
        this.battleShell.on('fight-completed', (result) => {
            this.handleFightCompletion(result);
        });
        
        this.battleShell.on('round-complete', (data) => {
            this.handleRoundUpdate(data);
        });
        
        // Economy events
        this.economyShell.on('contribution', (data) => {
            this.handleContribution(data);
        });
        
        // Betting events
        this.bettingShell.on('bet-placed', (bet) => {
            this.handleBetPlaced(bet);
        });
        
        // Chat events
        this.chatShell.on('message', (data) => {
            this.handleChatMessage(data);
        });
        
        // Router events
        this.router.on('player-joined', (session) => {
            this.handlePlayerJoined(session);
        });
    }
    
    startGameLoop() {
        this.runPhase();
    }
    
    async runPhase() {
        switch (this.state.phase) {
            case 'intermission':
                await this.runIntermission();
                break;
            case 'betting':
                await this.runBettingPhase();
                break;
            case 'fighting':
                await this.runFightPhase();
                break;
            case 'resolution':
                await this.runResolutionPhase();
                break;
        }
    }
    
    async runIntermission() {
        console.log('⏸️  INTERMISSION PHASE');
        
        // Announce in chat
        this.chatShell.systemMessage('arena', 
            '⏸️ INTERMISSION - Next fight in 60 seconds! Check the shop and leaderboards!'
        );
        
        // Schedule next fight
        this.scheduleNextFight();
        
        // Update state
        this.state.phase = 'intermission';
        this.emit('phase-change', { phase: 'intermission' });
        
        // Wait for intermission to end
        setTimeout(() => {
            this.state.phase = 'betting';
            this.runPhase();
        }, this.phaseTimers.intermission);
    }
    
    scheduleNextFight() {
        // Pick two random gladiators
        const available = [...this.gladiators];
        const glad1Index = Math.floor(Math.random() * available.length);
        const glad1 = available[glad1Index];
        available.splice(glad1Index, 1);
        
        const glad2Index = Math.floor(Math.random() * available.length);
        const glad2 = available[glad2Index];
        
        this.state.nextFight = {
            gladiator1: glad1,
            gladiator2: glad2,
            scheduledTime: Date.now() + this.phaseTimers.intermission
        };
        
        console.log(`📅 Scheduled: ${glad1.name} vs ${glad2.name}`);
    }
    
    async runBettingPhase() {
        console.log('🎲 BETTING PHASE');
        
        const { gladiator1, gladiator2 } = this.state.nextFight;
        
        // Create fight
        const fightId = this.battleShell.createFight(gladiator1, gladiator2);
        this.state.currentFightId = fightId;
        
        // Create betting market
        this.bettingShell.createMarket(fightId, gladiator1, gladiator2);
        
        // Announce in chat
        this.chatShell.systemMessage('arena', 
            `🎲 BETTING OPEN! ${gladiator1.name} (${gladiator1.title}) vs ${gladiator2.name} (${gladiator2.title})`
        );
        
        // Show stats
        this.chatShell.systemMessage('arena',
            `📊 ${gladiator1.name}: ${gladiator1.wins}W-${gladiator1.losses}L | ${gladiator2.name}: ${gladiator2.wins}W-${gladiator2.losses}L`
        );
        
        // Bot reactions
        this.chatShell.triggerFightEvent(fightId, { type: 'fight_start' });
        
        // Update state
        this.state.phase = 'betting';
        this.emit('phase-change', { phase: 'betting', fightId });
        
        // Wait for betting phase to end
        setTimeout(() => {
            this.bettingShell.closeMarket(fightId);
            this.state.phase = 'fighting';
            this.runPhase();
        }, this.phaseTimers.betting);
    }
    
    async runFightPhase() {
        console.log('⚔️  FIGHT PHASE');
        
        const fightId = this.state.currentFightId;
        
        // Start the fight
        this.battleShell.startFight(fightId);
        
        // Start live betting
        this.bettingShell.startLiveBetting(fightId);
        
        // Announce in chat
        this.chatShell.systemMessage('arena', '⚔️ FIGHT! The gladiators clash!');
        
        // Update state
        this.state.phase = 'fighting';
        this.emit('phase-change', { phase: 'fighting', fightId });
        
        // Fight will complete via event
    }
    
    async runResolutionPhase() {
        console.log('🏆 RESOLUTION PHASE');
        
        // Update state
        this.state.phase = 'resolution';
        this.emit('phase-change', { phase: 'resolution' });
        
        // Wait for resolution phase
        setTimeout(() => {
            this.state.phase = 'intermission';
            this.runPhase();
        }, this.phaseTimers.resolution);
    }
    
    handleFightCompletion(result) {
        console.log(`🏆 Fight completed! Winner: ${result.winner ? result.winner.name : 'DRAW'}`);
        
        // Resolve bets
        this.economyShell.resolveBets(result.fightId, result.winner ? result.winner.id : null);
        
        // Resolve special bets
        this.bettingShell.resolveSpecialBets(result.fightId, {
            winner: result.winner,
            loserHP: result.loser ? result.loser.currentHP : 50,
            winnerHP: result.winner ? result.winner.currentHP : 50,
            rounds: result.rounds,
            firstBlood: 'gladiator1', // TODO: Track this properly
            hadComeback: false // TODO: Track this properly
        });
        
        // Update gladiator records
        if (result.winner && result.loser) {
            const winner = this.gladiators.find(g => g.id === result.winner.id);
            const loser = this.gladiators.find(g => g.id === result.loser.id);
            
            if (winner) winner.wins++;
            if (loser) loser.losses++;
        }
        
        // Announce results
        if (result.winner) {
            this.chatShell.systemMessage('arena', 
                `🏆 ${result.winner.name} WINS! "${result.winner.taunt || 'Victory is mine!'}"`
            );
        } else {
            this.chatShell.systemMessage('arena', '⚔️ DRAW! Both gladiators stand exhausted!');
        }
        
        // Trigger chat reactions
        this.chatShell.triggerFightEvent(result.fightId, { type: 'fight_end' });
        
        // Move to resolution phase
        this.state.phase = 'resolution';
        this.runPhase();
    }
    
    handleRoundUpdate(data) {
        // Update live odds
        const fightStatus = this.battleShell.getFightStatus(data.fightId);
        if (fightStatus) {
            this.bettingShell.updateLiveOdds(data.fightId, {
                round: data.round,
                gladiator1HP: data.gladiator1HP,
                gladiator2HP: data.gladiator2HP
            });
        }
        
        // Trigger chat events for exciting moments
        if (data.gladiator1HP < 30 || data.gladiator2HP < 30) {
            if (Math.random() < 0.3) {
                this.chatShell.triggerFightEvent(data.fightId, { type: 'comeback' });
            }
        }
    }
    
    handleContribution(data) {
        this.state.totalContributed += data.amount;
        
        // Check if we've hit milestones
        const milestones = [10000, 100000, 1000000, 10000000, 100000000, 1000000000];
        for (const milestone of milestones) {
            if (this.state.totalContributed >= milestone && 
                this.state.totalContributed - data.amount < milestone) {
                this.chatShell.systemMessage('global', 
                    `🎉 MILESTONE! We've reached ${this.formatCurrency(milestone)} contributed!`
                );
                this.triggerSpecialEvent(milestone);
            }
        }
        
        this.emit('contribution', {
            playerId: data.playerId,
            amount: data.amount,
            totalContributed: this.state.totalContributed
        });
    }
    
    handleBetPlaced(bet) {
        // Announce big bets
        if (bet.amount >= 10000) {
            this.chatShell.systemMessage('betting', 
                `💰 BIG BET! Someone just bet ${this.formatCurrency(bet.amount)}!`
            );
        }
    }
    
    handleChatMessage(data) {
        // Could add chat commands here
        // For now, just forward to interested parties
        this.emit('chat-message', data);
    }
    
    handlePlayerJoined(session) {
        // Create economy account
        this.economyShell.createPlayerAccount(session.playerId, {
            username: session.username
        });
        
        // Join chat channels
        this.chatShell.joinChannel(session.playerId, session.username, 'global');
        this.chatShell.joinChannel(session.playerId, session.username, 'arena');
        
        // Track active player
        this.state.activePlayers.set(session.playerId, {
            sessionId: session.id,
            username: session.username,
            joinedAt: Date.now()
        });
        
        // Welcome message
        this.chatShell.systemMessage('global', 
            `👋 ${session.username} joined the arena! Current progress: ${this.formatCurrency(this.state.totalContributed)}/${this.formatCurrency(1000000000)}`
        );
        
        this.emit('player-joined', session);
    }
    
    triggerSpecialEvent(milestone) {
        switch (milestone) {
            case 1000000: // 1 million
                // Unlock new gladiator
                this.unlockSpecialGladiator();
                break;
            case 10000000: // 10 million
                // Start tournament mode
                this.startTournament();
                break;
            case 100000000: // 100 million
                // Double rewards weekend
                this.activateDoubleRewards();
                break;
            case 1000000000: // 1 BILLION!
                // ENDGAME
                this.triggerEndgame();
                break;
        }
    }
    
    unlockSpecialGladiator() {
        const specialGladiator = {
            id: 'mystery_champion',
            name: 'Mystery Champion',
            title: 'The Unknown',
            type: 'LEGENDARY',
            stats: {
                power: 100,
                defense: 100,
                speed: 100,
                stamina: 100,
                maxHP: 150
            },
            special: 'Fate Reversal',
            taunt: 'You cannot comprehend my power!',
            wins: 0,
            losses: 0,
            fanBase: 0
        };
        
        this.gladiators.push(specialGladiator);
        this.chatShell.systemMessage('global', 
            '🌟 SPECIAL EVENT! Mystery Champion has entered the arena!'
        );
    }
    
    startTournament() {
        this.state.tournamentMode = true;
        this.chatShell.systemMessage('global', 
            '🏆 TOURNAMENT MODE ACTIVATED! Winner takes massive prize pool!'
        );
    }
    
    activateDoubleRewards() {
        this.economyShell.config.winMultiplier = 3.6; // Double the normal 1.8
        this.chatShell.systemMessage('global', 
            '💰💰 DOUBLE REWARDS ACTIVE! All wins pay 2x!'
        );
    }
    
    triggerEndgame() {
        this.chatShell.systemMessage('global', 
            '🎉🎉🎉 WE DID IT! ONE BILLION DOLLARS! THE GAME HAS EVOLVED!'
        );
        
        // TODO: Implement endgame content
        // - Unlock prestige system
        // - New game modes
        // - Special rewards for all players
    }
    
    formatCurrency(amount) {
        if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
        return `$${amount}`;
    }
    
    getGameState() {
        return {
            phase: this.state.phase,
            totalContributed: this.state.totalContributed,
            currentFight: this.state.currentFightId ? 
                this.battleShell.getFightStatus(this.state.currentFightId) : null,
            nextFight: this.state.nextFight,
            activePlayers: this.state.activePlayers.size,
            tournamentMode: this.state.tournamentMode
        };
    }
}

module.exports = GameOrchestrator;

// Run if called directly
if (require.main === module) {
    const orchestrator = new GameOrchestrator();
    orchestrator.initialize().catch(console.error);
}