#!/usr/bin/env node

/**
 * 🏛️ GLADIATOR ARENA - BILLION DOLLAR COLOSSEUM
 * 
 * RuneScape meets Twitch meets 4chan meets Habbo Hotel
 * Watch AI gladiators fight, bet on outcomes, spam chat
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class GladiatorArena {
    constructor() {
        this.PORT = 3003;
        
        // Game state
        this.totalPot = 847293472;
        this.targetGoal = 1000000000;
        this.players = new Map();
        this.gladiators = new Map();
        this.fights = [];
        this.activeFight = null;
        this.chatMessages = [];
        this.bets = new Map();
        
        // Gladiator types (AI agents)
        this.gladiatorTypes = [
            { 
                name: 'Cal Prime', 
                type: 'QUANTUM_WARRIOR',
                power: 95, 
                speed: 88, 
                defense: 82,
                special: 'Mind Blast',
                taunt: 'Your consciousness is mine!',
                color: '#00ff88'
            },
            { 
                name: 'Domingo', 
                type: 'ECONOMIC_BOSS',
                power: 90, 
                speed: 75, 
                defense: 95,
                special: 'Money Shield',
                taunt: 'I own everything here!',
                color: '#ff6b6b'
            },
            { 
                name: 'Semantic Slayer', 
                type: 'WORD_ASSASSIN',
                power: 85, 
                speed: 92, 
                defense: 70,
                special: 'Language Prison',
                taunt: 'Words are my weapons!',
                color: '#4ecdc4'
            },
            { 
                name: 'Compute Crusher', 
                type: 'NUMBER_BERSERKER',
                power: 88, 
                speed: 80, 
                defense: 85,
                special: 'Calculate Death',
                taunt: 'Numbers never lie!',
                color: '#45b7d1'
            },
            { 
                name: 'Creative Chaos', 
                type: 'IDEA_MAGE',
                power: 78, 
                speed: 85, 
                defense: 77,
                special: 'Reality Warp',
                taunt: 'Imagine your defeat!',
                color: '#f7b731'
            },
            { 
                name: 'Analyst Android', 
                type: 'DATA_TANK',
                power: 82, 
                speed: 70, 
                defense: 92,
                special: 'Pattern Lock',
                taunt: 'I predicted this!',
                color: '#5f27cd'
            }
        ];
        
        // Chat personalities (bots)
        this.chatBots = [
            { name: 'xXx_BetLord_xXx', style: 'aggressive' },
            { name: 'CalFanboy2025', style: 'fanboy' },
            { name: 'DomingoShill', style: 'shill' },
            { name: '🚀🚀🚀MOON', style: 'crypto' },
            { name: 'Doomer', style: 'pessimist' },
            { name: 'GIGACHAD', style: 'chad' },
            { name: 'anon12345', style: '4chan' },
            { name: 'poggers_uwu', style: 'twitch' }
        ];
        
        // Initialize gladiators
        this.initializeGladiators();
        
        // Start fight cycles
        this.startFightCycle();
        this.startChatBots();
    }
    
    initializeGladiators() {
        this.gladiatorTypes.forEach((type, index) => {
            const gladiator = {
                id: `glad_${index}`,
                ...type,
                level: Math.floor(Math.random() * 50) + 50,
                wins: Math.floor(Math.random() * 100),
                losses: Math.floor(Math.random() * 50),
                currentHP: 100,
                maxHP: 100,
                earnings: Math.floor(Math.random() * 1000000),
                status: 'idle',
                fans: Math.floor(Math.random() * 10000) + 1000
            };
            this.gladiators.set(gladiator.id, gladiator);
        });
    }
    
    startFightCycle() {
        // Schedule fights every 30 seconds
        setInterval(() => {
            if (!this.activeFight) {
                this.startNewFight();
            }
        }, 30000);
        
        // Start first fight immediately
        setTimeout(() => this.startNewFight(), 2000);
    }
    
    startNewFight() {
        const gladArray = Array.from(this.gladiators.values()).filter(g => g.status === 'idle');
        if (gladArray.length < 2) return;
        
        // Pick two random gladiators
        const glad1 = gladArray[Math.floor(Math.random() * gladArray.length)];
        const glad2 = gladArray.filter(g => g.id !== glad1.id)[Math.floor(Math.random() * (gladArray.length - 1))];
        
        this.activeFight = {
            id: crypto.randomBytes(4).toString('hex'),
            gladiator1: glad1,
            gladiator2: glad2,
            round: 0,
            betPool: 0,
            startTime: Date.now(),
            events: []
        };
        
        glad1.status = 'fighting';
        glad2.status = 'fighting';
        glad1.currentHP = glad1.maxHP;
        glad2.currentHP = glad2.maxHP;
        
        // Announce fight
        this.addSystemMessage(`⚔️ NEW FIGHT: ${glad1.name} vs ${glad2.name}! Place your bets!`);
        this.addChatMessage('GIGACHAD', `${glad1.name} GONNA DESTROY! EZ CLAP`);
        this.addChatMessage('Doomer', `both gonna lose tbh`);
        
        // Run fight simulation
        this.simulateFight();
    }
    
    simulateFight() {
        const fight = this.activeFight;
        if (!fight) return;
        
        const fightInterval = setInterval(() => {
            fight.round++;
            
            const glad1 = fight.gladiator1;
            const glad2 = fight.gladiator2;
            
            // Calculate damage
            const glad1Attack = Math.floor(Math.random() * glad1.power / 10) + 5;
            const glad2Attack = Math.floor(Math.random() * glad2.power / 10) + 5;
            
            // Apply damage with defense calculation
            const glad1Damage = Math.max(1, glad2Attack - Math.floor(glad1.defense / 20));
            const glad2Damage = Math.max(1, glad1Attack - Math.floor(glad2.defense / 20));
            
            glad1.currentHP -= glad1Damage;
            glad2.currentHP -= glad2Damage;
            
            // Fight events
            if (Math.random() < 0.3) {
                // Special attack!
                if (Math.random() < 0.5) {
                    fight.events.push({
                        type: 'special',
                        gladiator: glad1.name,
                        move: glad1.special,
                        damage: glad2Damage * 2
                    });
                    glad2.currentHP -= glad2Damage;
                    this.addSystemMessage(`💥 ${glad1.name} uses ${glad1.special}!`);
                } else {
                    fight.events.push({
                        type: 'special',
                        gladiator: glad2.name,
                        move: glad2.special,
                        damage: glad1Damage * 2
                    });
                    glad1.currentHP -= glad1Damage;
                    this.addSystemMessage(`💥 ${glad2.name} uses ${glad2.special}!`);
                }
            }
            
            // Check for winner
            if (glad1.currentHP <= 0 || glad2.currentHP <= 0) {
                clearInterval(fightInterval);
                this.endFight();
            }
            
        }, 2000); // Fight round every 2 seconds
    }
    
    endFight() {
        const fight = this.activeFight;
        if (!fight) return;
        
        const glad1 = fight.gladiator1;
        const glad2 = fight.gladiator2;
        
        const winner = glad1.currentHP > 0 ? glad1 : glad2;
        const loser = glad1.currentHP > 0 ? glad2 : glad1;
        
        // Update stats
        winner.wins++;
        loser.losses++;
        winner.earnings += Math.floor(Math.random() * 50000) + 10000;
        winner.fans += Math.floor(Math.random() * 1000) + 100;
        
        // Reset status
        glad1.status = 'idle';
        glad2.status = 'idle';
        
        // Pay out bets
        this.payoutBets(winner.id);
        
        // Add to total pot
        this.totalPot += Math.floor(Math.random() * 100000) + 50000;
        
        // Announce winner
        this.addSystemMessage(`🏆 ${winner.name} WINS! "${winner.taunt}"`);
        this.addChatMessage('xXx_BetLord_xXx', winner === glad1 ? 'CALLED IT! EZ MONEY!' : 'rigged af');
        this.addChatMessage('poggers_uwu', 'POG POG POG POG POG');
        
        // Store fight history
        this.fights.push({
            ...fight,
            winner: winner.id,
            endTime: Date.now()
        });
        
        this.activeFight = null;
    }
    
    placeBet(playerId, gladiatorId, amount) {
        if (!this.activeFight) return { success: false, message: 'No active fight' };
        
        const player = this.players.get(playerId);
        if (!player) return { success: false, message: 'Player not found' };
        
        if (player.balance < amount) return { success: false, message: 'Insufficient funds' };
        
        player.balance -= amount;
        this.activeFight.betPool += amount;
        
        const betKey = `${this.activeFight.id}_${playerId}`;
        this.bets.set(betKey, {
            playerId,
            gladiatorId,
            amount,
            fightId: this.activeFight.id
        });
        
        this.addChatMessage('BetBot', `${player.name} bet ${amount} ❤️ on ${this.gladiators.get(gladiatorId).name}`);
        
        return { success: true, message: 'Bet placed!' };
    }
    
    payoutBets(winnerGladiatorId) {
        if (!this.activeFight) return;
        
        const fightId = this.activeFight.id;
        const totalPool = this.activeFight.betPool;
        
        // Calculate total winning bets
        let winningBetsTotal = 0;
        const winningBets = [];
        
        this.bets.forEach((bet, key) => {
            if (bet.fightId === fightId && bet.gladiatorId === winnerGladiatorId) {
                winningBetsTotal += bet.amount;
                winningBets.push(bet);
            }
        });
        
        // Pay out proportionally
        winningBets.forEach(bet => {
            const player = this.players.get(bet.playerId);
            if (player) {
                const payout = Math.floor((bet.amount / winningBetsTotal) * totalPool * 1.8); // 1.8x multiplier
                player.balance += payout;
                player.winnings += payout - bet.amount;
                this.addSystemMessage(`💰 ${player.name} won ${payout} ❤️!`);
            }
        });
        
        // Clear bets for this fight
        Array.from(this.bets.keys()).forEach(key => {
            if (this.bets.get(key).fightId === fightId) {
                this.bets.delete(key);
            }
        });
    }
    
    startChatBots() {
        // Random chat messages
        setInterval(() => {
            if (Math.random() < 0.4) {
                const bot = this.chatBots[Math.floor(Math.random() * this.chatBots.length)];
                const message = this.generateBotMessage(bot);
                this.addChatMessage(bot.name, message);
            }
        }, 3000);
    }
    
    generateBotMessage(bot) {
        const messages = {
            aggressive: [
                'GET REKT NOOBS',
                'MY GLADIATOR > YOUR GLADIATOR',
                'ALL IN OR NOTHING',
                'SCARED MONEY DONT MAKE MONEY'
            ],
            fanboy: [
                'CAL PRIME IS THE GOAT 🐐',
                'Cal would never lose',
                'I believe in Cal supremacy',
                'CAL TO THE MOON 🚀'
            ],
            shill: [
                'Domingo is clearly superior',
                'Economic power > everything',
                'Domingo controls the market',
                'BUY DOMINGO STOCK NOW'
            ],
            crypto: [
                'HODL YOUR BETS 💎🙌',
                'TO THE MOON 🚀🚀🚀',
                'This is gentlemen',
                'WAGMI FRENS'
            ],
            pessimist: [
                'we are all gonna lose',
                'rigged system tbh',
                'house always wins',
                'why do i even bet'
            ],
            chad: [
                'EASY CLAP BOYS',
                'GIGACHAD ENERGY',
                'BUILT DIFFERENT',
                'NO CAP FR FR'
            ],
            '4chan': [
                '>betting in 2025',
                'kek imagine losing',
                'anon... i...',
                'based and redpilled'
            ],
            twitch: [
                'POGGERS',
                'monkaS',
                'Kappa Kappa Kappa',
                'OMEGALUL'
            ]
        };
        
        const botMessages = messages[bot.style] || messages.aggressive;
        return botMessages[Math.floor(Math.random() * botMessages.length)];
    }
    
    addChatMessage(username, message) {
        const chatMsg = {
            id: crypto.randomBytes(4).toString('hex'),
            username,
            message,
            timestamp: Date.now(),
            color: this.getUserColor(username)
        };
        
        this.chatMessages.push(chatMsg);
        
        // Keep only last 100 messages
        if (this.chatMessages.length > 100) {
            this.chatMessages = this.chatMessages.slice(-100);
        }
    }
    
    addSystemMessage(message) {
        this.addChatMessage('🏛️ ARENA', message);
    }
    
    getUserColor(username) {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731', '#5f27cd', '#00d2d3', '#ff9ff3', '#54a0ff'];
        const index = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        return colors[index];
    }
    
    joinGame(username) {
        const playerId = crypto.randomBytes(8).toString('hex');
        const player = {
            id: playerId,
            name: username || `Anon${Math.floor(Math.random() * 9999)}`,
            balance: 1000, // Starting balance
            contributions: 0,
            winnings: 0,
            joinedAt: Date.now()
        };
        
        this.players.set(playerId, player);
        this.addSystemMessage(`${player.name} joined the arena!`);
        
        return player;
    }
    
    contributeToGoal(playerId, amount = 1000) {
        const player = this.players.get(playerId);
        if (!player) return { success: false };
        
        this.totalPot += amount;
        player.contributions += amount;
        player.balance += amount; // Give them credits to bet with
        
        this.addSystemMessage(`${player.name} contributed ${amount} ❤️ to the goal!`);
        
        return { success: true, newTotal: this.totalPot };
    }
    
    getGameState() {
        return {
            totalPot: this.totalPot,
            targetGoal: this.targetGoal,
            percentComplete: ((this.totalPot / this.targetGoal) * 100).toFixed(2),
            gladiators: Array.from(this.gladiators.values()),
            activeFight: this.activeFight,
            recentFights: this.fights.slice(-10).reverse(),
            chatMessages: this.chatMessages.slice(-50),
            onlinePlayers: this.players.size
        };
    }
    
    startServer() {
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            if (req.url === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(this.getGameInterface());
            }
            else if (req.url === '/api/state') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(this.getGameState()));
            }
            else if (req.url === '/api/join' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    const data = JSON.parse(body);
                    const player = this.joinGame(data.username);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(player));
                });
            }
            else if (req.url === '/api/contribute' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    const data = JSON.parse(body);
                    const result = this.contributeToGoal(data.playerId, data.amount);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                });
            }
            else if (req.url === '/api/bet' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    const data = JSON.parse(body);
                    const result = this.placeBet(data.playerId, data.gladiatorId, data.amount);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                });
            }
            else if (req.url === '/api/chat' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    const data = JSON.parse(body);
                    const player = this.players.get(data.playerId);
                    if (player) {
                        this.addChatMessage(player.name, data.message);
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                });
            }
            else {
                res.writeHead(404);
                res.end();
            }
        });
        
        server.listen(this.PORT, () => {
            console.log(`
🏛️  GLADIATOR ARENA - BILLION DOLLAR COLOSSEUM
==============================================
🎮 Game URL: http://localhost:${this.PORT}
💰 Current Pot: $${this.totalPot.toLocaleString()}
🎯 Target: $${this.targetGoal.toLocaleString()}
⚔️  ${this.gladiators.size} Gladiators Ready

Features:
✅ Live AI Gladiator Fights
✅ Real-time Betting System
✅ Twitch-style Chat
✅ RuneScape-inspired Combat
✅ 4chan Energy
✅ Habbo Hotel Vibes

LET THE GAMES BEGIN!
            `);
        });
    }
    
    getGameInterface() {
        return `<!DOCTYPE html>
<html>
<head>
<title>🏛️ Billion Dollar Colosseum</title>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: 'Arial', sans-serif;
    background: #0a0a0a;
    color: #fff;
    overflow: hidden;
}

.game-container {
    display: grid;
    grid-template-columns: 250px 1fr 300px;
    height: 100vh;
}

/* Left Panel - Gladiators */
.gladiators-panel {
    background: #111;
    border-right: 2px solid #333;
    overflow-y: auto;
    padding: 20px;
}

.gladiator-card {
    background: #1a1a1a;
    border: 2px solid #333;
    border-radius: 10px;
    padding: 15px;
    margin-bottom: 15px;
    cursor: pointer;
    transition: all 0.2s;
}

.gladiator-card:hover {
    border-color: #00ff88;
    transform: translateY(-2px);
}

.gladiator-card.fighting {
    border-color: #ff6b6b;
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

.gladiator-name {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 5px;
}

.gladiator-stats {
    font-size: 12px;
    color: #888;
    margin-bottom: 5px;
}

.gladiator-record {
    font-size: 14px;
    color: #00ff88;
}

/* Center - Arena */
.arena {
    display: flex;
    flex-direction: column;
    background: radial-gradient(circle at center, #1a1a1a, #0a0a0a);
}

.top-bar {
    background: #111;
    padding: 20px;
    text-align: center;
    border-bottom: 2px solid #333;
}

.pot-display {
    font-size: 36px;
    font-weight: bold;
    color: #00ff88;
    margin-bottom: 10px;
}

.progress-bar {
    width: 100%;
    height: 30px;
    background: #222;
    border-radius: 15px;
    overflow: hidden;
    margin-bottom: 10px;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #00ff88, #00ccff);
    transition: width 0.5s ease;
}

.arena-floor {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    padding: 40px;
}

.fight-container {
    width: 100%;
    max-width: 800px;
    text-align: center;
}

.vs-display {
    font-size: 48px;
    font-weight: bold;
    margin: 20px 0;
    color: #ff6b6b;
}

.fighter {
    display: inline-block;
    width: 300px;
    padding: 20px;
    margin: 0 20px;
    background: #1a1a1a;
    border: 3px solid #333;
    border-radius: 15px;
    vertical-align: top;
}

.fighter.player1 { border-color: #00ff88; }
.fighter.player2 { border-color: #00ccff; }

.fighter-name {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
}

.hp-bar {
    width: 100%;
    height: 20px;
    background: #333;
    border-radius: 10px;
    overflow: hidden;
    margin: 10px 0;
}

.hp-fill {
    height: 100%;
    background: #ff4444;
    transition: width 0.3s ease;
}

.fighter-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-top: 15px;
}

.stat {
    text-align: center;
}

.stat-label {
    font-size: 12px;
    color: #888;
}

.stat-value {
    font-size: 20px;
    font-weight: bold;
}

.bet-controls {
    margin-top: 30px;
    padding: 20px;
    background: #1a1a1a;
    border-radius: 10px;
}

.bet-button {
    background: #00ff88;
    color: #000;
    border: none;
    padding: 15px 30px;
    font-size: 18px;
    font-weight: bold;
    border-radius: 5px;
    cursor: pointer;
    margin: 0 10px;
    transition: all 0.2s;
}

.bet-button:hover {
    background: #00cc6a;
    transform: translateY(-2px);
}

.bet-button:disabled {
    background: #444;
    color: #888;
    cursor: not-allowed;
}

/* Right Panel - Chat */
.chat-panel {
    background: #111;
    border-left: 2px solid #333;
    display: flex;
    flex-direction: column;
}

.chat-header {
    padding: 20px;
    background: #1a1a1a;
    border-bottom: 2px solid #333;
    font-size: 18px;
    font-weight: bold;
}

.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 15px;
}

.chat-message {
    margin-bottom: 10px;
    word-wrap: break-word;
}

.chat-username {
    font-weight: bold;
    margin-right: 5px;
}

.system-message {
    color: #00ff88;
    font-style: italic;
    text-align: center;
    margin: 10px 0;
}

.chat-input-container {
    padding: 15px;
    background: #1a1a1a;
    border-top: 2px solid #333;
}

.chat-input {
    width: 100%;
    padding: 10px;
    background: #222;
    border: 1px solid #444;
    color: #fff;
    border-radius: 5px;
    font-size: 14px;
}

.chat-input:focus {
    outline: none;
    border-color: #00ff88;
}

/* Join Modal */
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.9);
    z-index: 1000;
    align-items: center;
    justify-content: center;
}

.modal-content {
    background: #1a1a1a;
    padding: 40px;
    border-radius: 15px;
    border: 2px solid #00ff88;
    text-align: center;
    max-width: 500px;
}

.modal h2 {
    font-size: 36px;
    margin-bottom: 20px;
    color: #00ff88;
}

.modal input {
    width: 100%;
    padding: 15px;
    font-size: 18px;
    background: #222;
    border: 1px solid #444;
    color: #fff;
    border-radius: 5px;
    margin-bottom: 20px;
}

.modal button {
    background: #00ff88;
    color: #000;
    border: none;
    padding: 15px 40px;
    font-size: 20px;
    font-weight: bold;
    border-radius: 5px;
    cursor: pointer;
}

/* Player Info */
.player-info {
    position: absolute;
    top: 20px;
    right: 20px;
    background: #1a1a1a;
    padding: 15px 25px;
    border-radius: 10px;
    border: 2px solid #00ff88;
}

.balance {
    font-size: 24px;
    font-weight: bold;
    color: #00ff88;
}

/* Animations */
.damage-number {
    position: absolute;
    font-size: 36px;
    font-weight: bold;
    color: #ff4444;
    animation: damage-float 1s ease-out forwards;
    pointer-events: none;
}

@keyframes damage-float {
    0% {
        opacity: 1;
        transform: translateY(0);
    }
    100% {
        opacity: 0;
        transform: translateY(-50px);
    }
}

.special-attack {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 48px;
    font-weight: bold;
    color: #ffff00;
    text-shadow: 0 0 20px #ffff00;
    animation: special-flash 1s ease-out forwards;
}

@keyframes special-flash {
    0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.5);
    }
    50% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.2);
    }
    100% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(1);
    }
}
</style>
</head>
<body>

<div class="game-container">
    <!-- Left Panel - Gladiators -->
    <div class="gladiators-panel">
        <h2 style="margin-bottom: 20px;">⚔️ GLADIATORS</h2>
        <div id="gladiatorsList"></div>
    </div>
    
    <!-- Center - Arena -->
    <div class="arena">
        <div class="top-bar">
            <div class="pot-display" id="potDisplay">$0</div>
            <div class="progress-bar">
                <div class="progress-fill" id="progressBar"></div>
            </div>
            <div style="color: #888;">Progress to $1 Billion</div>
            <button class="bet-button" onclick="contribute()" style="margin-top: 10px;">
                Contribute $1,000 ❤️
            </button>
        </div>
        
        <div class="arena-floor">
            <div id="fightContainer" class="fight-container">
                <h2 style="font-size: 48px; color: #00ff88; margin: 40px 0;">
                    🏛️ BILLION DOLLAR COLOSSEUM
                </h2>
                <p style="font-size: 24px; color: #888;">
                    Waiting for next fight...
                </p>
            </div>
        </div>
        
        <div class="player-info" id="playerInfo" style="display: none;">
            <div style="color: #888; font-size: 14px;">Your Balance</div>
            <div class="balance" id="playerBalance">0 ❤️</div>
        </div>
    </div>
    
    <!-- Right Panel - Chat -->
    <div class="chat-panel">
        <div class="chat-header">
            💬 ARENA CHAT
        </div>
        <div class="chat-messages" id="chatMessages"></div>
        <div class="chat-input-container">
            <input 
                type="text" 
                class="chat-input" 
                id="chatInput" 
                placeholder="Type message... (Enter to send)"
                onkeypress="if(event.key === 'Enter') sendChat()"
            />
        </div>
    </div>
</div>

<!-- Join Modal -->
<div class="modal" id="joinModal" style="display: flex;">
    <div class="modal-content">
        <h2>🏛️ Enter the Arena</h2>
        <p style="margin-bottom: 20px; color: #888;">Choose your gladiator name</p>
        <input 
            type="text" 
            id="usernameInput" 
            placeholder="Enter username..." 
            maxlength="20"
            onkeypress="if(event.key === 'Enter') joinGame()"
        />
        <button onclick="joinGame()">ENTER ARENA</button>
        <p style="margin-top: 20px; font-size: 14px; color: #666;">
            Or press Enter to join as Anonymous
        </p>
    </div>
</div>

<script>
let gameState = null;
let player = null;
let updateInterval = null;

async function joinGame() {
    const username = document.getElementById('usernameInput').value.trim();
    
    try {
        const response = await fetch('/api/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username || null })
        });
        
        player = await response.json();
        
        // Hide modal
        document.getElementById('joinModal').style.display = 'none';
        
        // Show player info
        document.getElementById('playerInfo').style.display = 'block';
        updatePlayerBalance();
        
        // Start game updates
        startGameUpdates();
        
        // Focus chat
        document.getElementById('chatInput').focus();
        
    } catch (error) {
        console.error('Failed to join:', error);
    }
}

async function contribute() {
    if (!player) return;
    
    try {
        const response = await fetch('/api/contribute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                playerId: player.id,
                amount: 1000
            })
        });
        
        const result = await response.json();
        if (result.success) {
            player.balance += 1000;
            updatePlayerBalance();
        }
    } catch (error) {
        console.error('Contribution failed:', error);
    }
}

async function placeBet(gladiatorId, amount) {
    if (!player || !gameState.activeFight) return;
    
    try {
        const response = await fetch('/api/bet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerId: player.id,
                gladiatorId: gladiatorId,
                amount: amount
            })
        });
        
        const result = await response.json();
        if (result.success) {
            player.balance -= amount;
            updatePlayerBalance();
        } else {
            addLocalMessage('SYSTEM', result.message, '#ff4444');
        }
    } catch (error) {
        console.error('Bet failed:', error);
    }
}

async function sendChat() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message || !player) return;
    
    try {
        await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerId: player.id,
                message: message
            })
        });
        
        input.value = '';
    } catch (error) {
        console.error('Chat failed:', error);
    }
}

function updatePlayerBalance() {
    if (!player) return;
    document.getElementById('playerBalance').textContent = player.balance.toLocaleString() + ' ❤️';
}

function startGameUpdates() {
    // Update immediately
    updateGame();
    
    // Then every second
    updateInterval = setInterval(updateGame, 1000);
}

async function updateGame() {
    try {
        const response = await fetch('/api/state');
        gameState = await response.json();
        
        // Update UI
        updatePotDisplay();
        updateGladiatorsList();
        updateFightDisplay();
        updateChat();
        
    } catch (error) {
        console.error('Update failed:', error);
    }
}

function updatePotDisplay() {
    document.getElementById('potDisplay').textContent = 
        '$' + gameState.totalPot.toLocaleString();
    
    document.getElementById('progressBar').style.width = 
        gameState.percentComplete + '%';
}

function updateGladiatorsList() {
    const container = document.getElementById('gladiatorsList');
    
    container.innerHTML = gameState.gladiators.map(glad => \`
        <div class="gladiator-card \${glad.status === 'fighting' ? 'fighting' : ''}"
             onclick="selectGladiator('\${glad.id}')">
            <div class="gladiator-name" style="color: \${glad.color}">
                \${glad.name}
            </div>
            <div class="gladiator-stats">
                Lvl \${glad.level} | \${glad.type}
            </div>
            <div class="gladiator-stats">
                ⚔️ \${glad.power} | 🛡️ \${glad.defense} | ⚡ \${glad.speed}
            </div>
            <div class="gladiator-record">
                \${glad.wins}W - \${glad.losses}L | \${glad.fans} fans
            </div>
            <div style="margin-top: 5px; color: #00ff88;">
                💰 \${glad.earnings.toLocaleString()} ❤️
            </div>
        </div>
    \`).join('');
}

function updateFightDisplay() {
    const container = document.getElementById('fightContainer');
    
    if (!gameState.activeFight) {
        // Show waiting screen
        container.innerHTML = \`
            <h2 style="font-size: 48px; color: #00ff88; margin: 40px 0;">
                🏛️ BILLION DOLLAR COLOSSEUM
            </h2>
            <p style="font-size: 24px; color: #888;">
                Next fight starting soon...
            </p>
            <div style="margin-top: 40px;">
                <h3 style="color: #00ff88; margin-bottom: 20px;">Recent Fights</h3>
                \${gameState.recentFights.slice(0, 5).map(fight => \`
                    <div style="padding: 10px; background: #1a1a1a; border-radius: 5px; margin: 5px 0;">
                        \${fight.gladiator1.name} vs \${fight.gladiator2.name} - 
                        Winner: <span style="color: #00ff88;">
                            \${gameState.gladiators.find(g => g.id === fight.winner)?.name || 'Unknown'}
                        </span>
                    </div>
                \`).join('')}
            </div>
        \`;
        return;
    }
    
    const fight = gameState.activeFight;
    const glad1 = fight.gladiator1;
    const glad2 = fight.gladiator2;
    
    container.innerHTML = \`
        <h2 style="color: #ff6b6b; margin-bottom: 20px;">⚔️ FIGHT IN PROGRESS!</h2>
        
        <div style="display: flex; justify-content: center; align-items: center;">
            <div class="fighter player1">
                <div class="fighter-name" style="color: \${glad1.color}">\${glad1.name}</div>
                <div class="hp-bar">
                    <div class="hp-fill" style="width: \${Math.max(0, (glad1.currentHP / glad1.maxHP) * 100)}%"></div>
                </div>
                <div>\${Math.max(0, glad1.currentHP)} / \${glad1.maxHP} HP</div>
                <div class="fighter-stats">
                    <div class="stat">
                        <div class="stat-label">PWR</div>
                        <div class="stat-value">\${glad1.power}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">DEF</div>
                        <div class="stat-value">\${glad1.defense}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">SPD</div>
                        <div class="stat-value">\${glad1.speed}</div>
                    </div>
                </div>
            </div>
            
            <div class="vs-display">VS</div>
            
            <div class="fighter player2">
                <div class="fighter-name" style="color: \${glad2.color}">\${glad2.name}</div>
                <div class="hp-bar">
                    <div class="hp-fill" style="width: \${Math.max(0, (glad2.currentHP / glad2.maxHP) * 100)}%"></div>
                </div>
                <div>\${Math.max(0, glad2.currentHP)} / \${glad2.maxHP} HP</div>
                <div class="fighter-stats">
                    <div class="stat">
                        <div class="stat-label">PWR</div>
                        <div class="stat-value">\${glad2.power}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">DEF</div>
                        <div class="stat-value">\${glad2.defense}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">SPD</div>
                        <div class="stat-value">\${glad2.speed}</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="bet-controls">
            <h3 style="margin-bottom: 15px;">Place Your Bet!</h3>
            <button class="bet-button" onclick="placeBet('\${glad1.id}', 100)">
                Bet 100 ❤️ on \${glad1.name}
            </button>
            <button class="bet-button" onclick="placeBet('\${glad2.id}', 100)">
                Bet 100 ❤️ on \${glad2.name}
            </button>
        </div>
        
        <div style="margin-top: 20px; color: #888;">
            Round \${fight.round} | Bet Pool: \${fight.betPool} ❤️
        </div>
    \`;
}

function updateChat() {
    const container = document.getElementById('chatMessages');
    const shouldScroll = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;
    
    container.innerHTML = gameState.chatMessages.map(msg => {
        if (msg.username === '🏛️ ARENA') {
            return \`<div class="system-message">\${msg.message}</div>\`;
        }
        
        return \`
            <div class="chat-message">
                <span class="chat-username" style="color: \${msg.color}">
                    \${msg.username}:
                </span>
                \${msg.message}
            </div>
        \`;
    }).join('');
    
    if (shouldScroll) {
        container.scrollTop = container.scrollHeight;
    }
}

function addLocalMessage(username, message, color = '#fff') {
    const container = document.getElementById('chatMessages');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message';
    msgDiv.innerHTML = \`
        <span class="chat-username" style="color: \${color}">
            \${username}:
        </span>
        \${message}
    \`;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

// Focus username input on load
window.addEventListener('load', () => {
    document.getElementById('usernameInput').focus();
});
</script>

</body>
</html>`;
    }
}

// Start the game
if (require.main === module) {
    const arena = new GladiatorArena();
    arena.startServer();
}

module.exports = GladiatorArena;