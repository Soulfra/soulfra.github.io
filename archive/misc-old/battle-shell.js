#!/usr/bin/env node

/**
 * ⚔️ BATTLE SHELL
 * 
 * Manages gladiator combat mechanics, damage calculation, and fight resolution
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class BattleShell extends EventEmitter {
    constructor() {
        super();
        
        // Combat configuration
        this.config = {
            roundDuration: 2000, // 2 seconds per round
            maxRounds: 50,
            criticalChance: 0.15,
            blockChance: 0.20,
            specialMoveChance: 0.25,
            damageVariance: 0.3
        };
        
        // Active fights
        this.activeFights = new Map();
        
        // Combat log
        this.combatLogs = new Map();
    }
    
    createFight(gladiator1, gladiator2, fightConfig = {}) {
        const fightId = crypto.randomBytes(8).toString('hex');
        
        const fight = {
            id: fightId,
            gladiator1: this.prepareGladiator(gladiator1),
            gladiator2: this.prepareGladiator(gladiator2),
            round: 0,
            startTime: Date.now(),
            config: { ...this.config, ...fightConfig },
            log: [],
            status: 'preparing',
            winner: null
        };
        
        this.activeFights.set(fightId, fight);
        this.emit('fight-created', fight);
        
        return fightId;
    }
    
    prepareGladiator(gladiator) {
        return {
            ...gladiator,
            currentHP: gladiator.maxHP || 100,
            currentStamina: gladiator.maxStamina || 100,
            buffs: [],
            debuffs: [],
            comboCount: 0,
            blockReady: true,
            specialReady: true
        };
    }
    
    startFight(fightId) {
        const fight = this.activeFights.get(fightId);
        if (!fight || fight.status !== 'preparing') return false;
        
        fight.status = 'active';
        fight.actualStartTime = Date.now();
        
        this.emit('fight-started', fight);
        
        // Run fight rounds
        this.runFightRounds(fightId);
        
        return true;
    }
    
    runFightRounds(fightId) {
        const fight = this.activeFights.get(fightId);
        if (!fight || fight.status !== 'active') return;
        
        const roundInterval = setInterval(() => {
            fight.round++;
            
            // Check if fight should end
            if (this.shouldEndFight(fight)) {
                clearInterval(roundInterval);
                this.endFight(fightId);
                return;
            }
            
            // Execute round
            this.executeRound(fight);
            
            // Emit round update
            this.emit('round-complete', {
                fightId: fight.id,
                round: fight.round,
                gladiator1HP: fight.gladiator1.currentHP,
                gladiator2HP: fight.gladiator2.currentHP
            });
            
        }, fight.config.roundDuration);
    }
    
    executeRound(fight) {
        const { gladiator1, gladiator2 } = fight;
        
        // Both gladiators attack
        const glad1Action = this.determineAction(gladiator1, gladiator2);
        const glad2Action = this.determineAction(gladiator2, gladiator1);
        
        // Resolve actions
        this.resolveAction(gladiator1, gladiator2, glad1Action, fight);
        this.resolveAction(gladiator2, gladiator1, glad2Action, fight);
        
        // Apply status effects
        this.applyStatusEffects(gladiator1);
        this.applyStatusEffects(gladiator2);
        
        // Regenerate stamina
        gladiator1.currentStamina = Math.min(100, gladiator1.currentStamina + 5);
        gladiator2.currentStamina = Math.min(100, gladiator2.currentStamina + 5);
    }
    
    determineAction(attacker, defender) {
        // AI decision making based on gladiator stats and situation
        const actions = ['attack', 'heavy_attack', 'quick_attack', 'block', 'special'];
        const weights = this.calculateActionWeights(attacker, defender);
        
        return this.weightedRandom(actions, weights);
    }
    
    calculateActionWeights(attacker, defender) {
        const weights = [30, 20, 25, 15, 10]; // Base weights
        
        // Adjust based on HP
        if (attacker.currentHP < 30) {
            weights[3] += 20; // More likely to block when low HP
        }
        
        // Adjust based on stamina
        if (attacker.currentStamina < 20) {
            weights[2] += 15; // Quick attacks when low stamina
            weights[1] -= 10; // Less heavy attacks
        }
        
        // Special move availability
        if (!attacker.specialReady) {
            weights[4] = 0;
        } else if (defender.currentHP < 40) {
            weights[4] += 20; // More likely to use special as finisher
        }
        
        return weights;
    }
    
    weightedRandom(items, weights) {
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) return items[i];
        }
        
        return items[0];
    }
    
    resolveAction(attacker, defender, action, fight) {
        let damage = 0;
        let blocked = false;
        let critical = false;
        
        switch (action) {
            case 'attack':
                damage = this.calculateDamage(attacker.power, defender.defense, 1.0);
                attacker.currentStamina -= 10;
                break;
                
            case 'heavy_attack':
                damage = this.calculateDamage(attacker.power, defender.defense, 1.5);
                attacker.currentStamina -= 20;
                attacker.comboCount = 0; // Resets combo
                break;
                
            case 'quick_attack':
                damage = this.calculateDamage(attacker.power, defender.defense, 0.7);
                attacker.currentStamina -= 5;
                attacker.comboCount++;
                if (attacker.comboCount >= 3) {
                    damage *= 1.5; // Combo bonus
                    this.addToLog(fight, `${attacker.name} lands a COMBO!`);
                }
                break;
                
            case 'block':
                attacker.blockReady = true;
                attacker.currentStamina += 10;
                this.addToLog(fight, `${attacker.name} takes a defensive stance`);
                return;
                
            case 'special':
                damage = this.executeSpecialMove(attacker, defender, fight);
                attacker.specialReady = false;
                attacker.currentStamina -= 30;
                break;
        }
        
        // Check for block
        if (defender.blockReady && Math.random() < this.config.blockChance) {
            blocked = true;
            damage = Math.floor(damage * 0.3);
            defender.blockReady = false;
            this.addToLog(fight, `${defender.name} blocks the attack!`);
        }
        
        // Check for critical
        if (!blocked && Math.random() < this.config.criticalChance) {
            critical = true;
            damage *= 2;
            this.addToLog(fight, `${attacker.name} lands a CRITICAL HIT!`);
        }
        
        // Apply damage
        defender.currentHP = Math.max(0, defender.currentHP - damage);
        
        // Log the action
        if (damage > 0) {
            this.addToLog(fight, 
                `${attacker.name} ${action.replace('_', ' ')}s ${defender.name} for ${damage} damage`
            );
        }
    }
    
    calculateDamage(attackPower, defenderDefense, multiplier) {
        const baseDamage = attackPower / 10;
        const defenseReduction = defenderDefense / 20;
        const variance = 1 + (Math.random() - 0.5) * this.config.damageVariance;
        
        return Math.floor(Math.max(1, (baseDamage - defenseReduction) * multiplier * variance));
    }
    
    executeSpecialMove(attacker, defender, fight) {
        const special = attacker.special || 'Special Attack';
        let damage = this.calculateDamage(attacker.power * 2, defender.defense, 1.0);
        
        // Apply special effects based on gladiator type
        switch (attacker.type) {
            case 'QUANTUM_WARRIOR':
                // Mind blast - ignores some defense
                damage = attacker.power / 5 * 2;
                this.addToLog(fight, `${attacker.name} uses ${special}! Reality warps!`);
                break;
                
            case 'ECONOMIC_BOSS':
                // Money shield - damage + heal
                attacker.currentHP = Math.min(attacker.maxHP, attacker.currentHP + 20);
                this.addToLog(fight, `${attacker.name} uses ${special}! Money heals!`);
                break;
                
            case 'WORD_ASSASSIN':
                // Language prison - damage + stun chance
                if (Math.random() < 0.5) {
                    defender.debuffs.push({ type: 'stun', duration: 1 });
                    this.addToLog(fight, `${defender.name} is trapped in words!`);
                }
                break;
                
            default:
                this.addToLog(fight, `${attacker.name} uses ${special}!`);
        }
        
        return damage;
    }
    
    applyStatusEffects(gladiator) {
        // Process debuffs
        gladiator.debuffs = gladiator.debuffs.filter(debuff => {
            if (debuff.type === 'stun') {
                gladiator.currentStamina = 0; // Can't act while stunned
            }
            debuff.duration--;
            return debuff.duration > 0;
        });
        
        // Process buffs
        gladiator.buffs = gladiator.buffs.filter(buff => {
            buff.duration--;
            return buff.duration > 0;
        });
    }
    
    shouldEndFight(fight) {
        // Check if someone is defeated
        if (fight.gladiator1.currentHP <= 0 || fight.gladiator2.currentHP <= 0) {
            return true;
        }
        
        // Check max rounds
        if (fight.round >= fight.config.maxRounds) {
            return true;
        }
        
        return false;
    }
    
    endFight(fightId) {
        const fight = this.activeFights.get(fightId);
        if (!fight) return;
        
        fight.status = 'completed';
        fight.endTime = Date.now();
        
        // Determine winner
        if (fight.gladiator1.currentHP > fight.gladiator2.currentHP) {
            fight.winner = fight.gladiator1;
            fight.loser = fight.gladiator2;
        } else if (fight.gladiator2.currentHP > fight.gladiator1.currentHP) {
            fight.winner = fight.gladiator2;
            fight.loser = fight.gladiator1;
        } else {
            fight.winner = null; // Draw
        }
        
        // Add final log entry
        if (fight.winner) {
            this.addToLog(fight, `🏆 ${fight.winner.name} WINS! "${fight.winner.taunt || 'Victory is mine!'}"`);
        } else {
            this.addToLog(fight, `⚔️ DRAW! Both gladiators stand exhausted!`);
        }
        
        // Store in combat logs
        this.combatLogs.set(fightId, fight);
        
        // Clean up active fight
        this.activeFights.delete(fightId);
        
        // Emit completion event
        this.emit('fight-completed', {
            fightId: fight.id,
            winner: fight.winner,
            loser: fight.loser,
            rounds: fight.round,
            duration: fight.endTime - fight.actualStartTime
        });
    }
    
    addToLog(fight, message) {
        fight.log.push({
            round: fight.round,
            timestamp: Date.now(),
            message: message
        });
    }
    
    getFightStatus(fightId) {
        const fight = this.activeFights.get(fightId) || this.combatLogs.get(fightId);
        if (!fight) return null;
        
        return {
            id: fight.id,
            status: fight.status,
            round: fight.round,
            gladiator1: {
                name: fight.gladiator1.name,
                currentHP: fight.gladiator1.currentHP,
                maxHP: fight.gladiator1.maxHP || 100,
                stamina: fight.gladiator1.currentStamina
            },
            gladiator2: {
                name: fight.gladiator2.name,
                currentHP: fight.gladiator2.currentHP,
                maxHP: fight.gladiator2.maxHP || 100,
                stamina: fight.gladiator2.currentStamina
            },
            recentEvents: fight.log.slice(-5),
            winner: fight.winner ? fight.winner.name : null
        };
    }
}

module.exports = BattleShell;