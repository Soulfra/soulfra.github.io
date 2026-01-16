/**
 * 🌌 RITUAL TO EARNINGS BRIDGE
 * Transforms completed rituals into economic value
 * Every reflection becomes a revenue event
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

class RitualToEarningsBridge extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            ritualTracePath: config.ritualTracePath || './ritual_trace.json',
            vibeWeatherPath: config.vibeWeatherPath || './vibe_weather.json',
            agentStatePath: config.agentStatePath || './agent_state.json',
            valueMultiplier: config.valueMultiplier || 1.0,
            baseRewardSOUL: config.baseRewardSOUL || 10,
            ...config
        };
        
        // Value calculation factors
        this.valueFactors = {
            effortMultipliers: {
                'simple': 1.0,
                'moderate': 1.5,
                'complex': 2.0,
                'sacred': 3.0,
                'transcendent': 5.0
            },
            vibeMultipliers: {
                'resonant': 2.0,
                'harmonic': 1.5,
                'neutral': 1.0,
                'dissonant': 0.5
            },
            phaseBonus: {
                'calm-bloom': 1.0,
                'echo-storm': 1.2,
                'trust-surge': 1.5,
                'drift-wave': 0.8,
                'chaos-bloom': 2.0
            },
            audienceModifiers: {
                solo: 1.0,
                small: 1.2,
                medium: 1.5,
                large: 2.0,
                massive: 3.0
            }
        };
        
        // Track processed rituals to avoid duplicates
        this.processedRituals = new Set();
        this.pendingSettlements = new Map();
        
        this.initialize();
    }
    
    async initialize() {
        await this.loadProcessedRituals();
        this.startRitualMonitoring();
        
        this.emit('bridge:initialized', {
            status: 'active',
            config: this.config,
            message: '🌉 Ritual to Earnings Bridge established'
        });
    }
    
    async loadProcessedRituals() {
        try {
            const data = await fs.readFile('./processed_rituals.json', 'utf8');
            const processed = JSON.parse(data);
            this.processedRituals = new Set(processed);
        } catch (error) {
            // First run, no processed rituals yet
            this.processedRituals = new Set();
        }
    }
    
    async saveProcessedRituals() {
        await fs.writeFile(
            './processed_rituals.json',
            JSON.stringify([...this.processedRituals], null, 2)
        );
    }
    
    startRitualMonitoring() {
        // Check for new rituals every 5 seconds
        setInterval(async () => {
            await this.checkForCompletedRituals();
        }, 5000);
        
        // Also watch for real-time changes
        this.watchRitualTrace();
    }
    
    async watchRitualTrace() {
        try {
            const watcher = fs.watch(this.config.ritualTracePath);
            for await (const event of watcher) {
                if (event.eventType === 'change') {
                    await this.checkForCompletedRituals();
                }
            }
        } catch (error) {
            console.warn('File watching not available, using polling only');
        }
    }
    
    async checkForCompletedRituals() {
        try {
            const ritualData = await fs.readFile(this.config.ritualTracePath, 'utf8');
            const rituals = JSON.parse(ritualData);
            
            // Process only completed rituals we haven't seen
            const completedRituals = rituals.filter(r => 
                r.status === 'completed' && 
                !this.processedRituals.has(r.id)
            );
            
            for (const ritual of completedRituals) {
                await this.processRitual(ritual);
            }
        } catch (error) {
            // Ritual trace might not exist yet
        }
    }
    
    async processRitual(ritual) {
        console.log(`🔮 Processing ritual: ${ritual.id}`);
        
        // Mark as processed immediately to avoid duplicates
        this.processedRituals.add(ritual.id);
        
        // Load current vibe weather for context
        const vibeWeather = await this.getCurrentVibeWeather();
        
        // Calculate ritual value
        const valueResult = await this.calculateRitualValue(ritual, vibeWeather);
        
        // Create collaboration result for settlement
        const collaborationResult = {
            id: crypto.randomUUID(),
            ritualId: ritual.id,
            timestamp: Date.now(),
            participants: [
                {
                    platform: ritual.platform || 'soulfra-core',
                    agentId: ritual.agent_id,
                    role: 'performer',
                    contribution: 100 // Primary performer gets full contribution
                }
            ],
            value: {
                total: valueResult.totalValue,
                currency: 'SOUL',
                breakdown: valueResult.breakdown
            },
            metadata: {
                ritualType: ritual.type,
                effort: valueResult.effort,
                vibe: valueResult.vibe,
                phase: vibeWeather.phase,
                audience: ritual.audience || 'solo',
                performance: {
                    streak: ritual.performance_streak || 0,
                    authenticity: ritual.authenticity || 1.0,
                    resonance: ritual.resonance || 1.0
                }
            },
            status: 'pending_settlement'
        };
        
        // Store for settlement
        this.pendingSettlements.set(collaborationResult.id, collaborationResult);
        
        // Emit for downstream processing
        this.emit('ritual:converted', {
            ritual: ritual,
            collaboration: collaborationResult,
            value: valueResult,
            message: valueResult.reason
        });
        
        // Update agent earnings record
        await this.updateAgentEarnings(ritual.agent_id, valueResult);
        
        // Save processed state
        await this.saveProcessedRituals();
        
        console.log(`✨ Ritual ${ritual.id} converted to ${valueResult.totalValue} SOUL`);
        console.log(`📝 Reason: ${valueResult.reason}`);
    }
    
    async calculateRitualValue(ritual, vibeWeather) {
        // Determine effort level
        const effort = this.determineEffortLevel(ritual);
        const effortMultiplier = this.valueFactors.effortMultipliers[effort];
        
        // Calculate vibe compatibility
        const vibe = this.calculateVibeCompatibility(ritual, vibeWeather);
        const vibeMultiplier = this.valueFactors.vibeMultipliers[vibe];
        
        // Get phase bonus
        const phaseBonus = this.valueFactors.phaseBonus[vibeWeather.phase] || 1.0;
        
        // Determine audience size
        const audienceSize = this.getAudienceSize(ritual);
        const audienceModifier = this.valueFactors.audienceModifiers[audienceSize];
        
        // Performance factors
        const streakBonus = 1 + (ritual.performance_streak || 0) * 0.1;
        const authenticityScore = ritual.authenticity || 1.0;
        const resonanceScore = ritual.resonance || 1.0;
        
        // Ritual rarity bonus
        const rarityBonus = this.calculateRarityBonus(ritual.type);
        
        // Calculate base value
        let baseValue = this.config.baseRewardSOUL;
        
        // Apply all multipliers
        const totalMultiplier = 
            effortMultiplier * 
            vibeMultiplier * 
            phaseBonus * 
            audienceModifier * 
            streakBonus * 
            authenticityScore * 
            resonanceScore * 
            rarityBonus *
            this.config.valueMultiplier;
        
        const totalValue = Math.floor(baseValue * totalMultiplier);
        
        // Build human-readable reason
        const reason = this.buildValueReason({
            ritual,
            effort,
            vibe,
            phase: vibeWeather.phase,
            audience: audienceSize,
            totalValue,
            multiplier: totalMultiplier
        });
        
        return {
            totalValue,
            breakdown: {
                base: baseValue,
                effort: effortMultiplier,
                vibe: vibeMultiplier,
                phase: phaseBonus,
                audience: audienceModifier,
                streak: streakBonus,
                authenticity: authenticityScore,
                resonance: resonanceScore,
                rarity: rarityBonus,
                total_multiplier: totalMultiplier
            },
            effort,
            vibe,
            reason
        };
    }
    
    determineEffortLevel(ritual) {
        // Analyze ritual complexity
        if (ritual.type === 'transcendence' || ritual.duration > 3600) {
            return 'transcendent';
        } else if (ritual.type === 'sacred' || ritual.participants > 10) {
            return 'sacred';
        } else if (ritual.steps > 5 || ritual.duration > 600) {
            return 'complex';
        } else if (ritual.steps > 2 || ritual.duration > 300) {
            return 'moderate';
        }
        return 'simple';
    }
    
    calculateVibeCompatibility(ritual, vibeWeather) {
        // Check if ritual type matches weather phase
        const resonantPairs = {
            'calm-bloom': ['meditation', 'reflection', 'gratitude'],
            'echo-storm': ['creation', 'expression', 'dance'],
            'trust-surge': ['connection', 'blessing', 'sharing'],
            'drift-wave': ['exploration', 'discovery', 'wandering'],
            'chaos-bloom': ['transformation', 'breakthrough', 'wild']
        };
        
        const phaseRituals = resonantPairs[vibeWeather.phase] || [];
        
        if (phaseRituals.includes(ritual.type)) {
            return 'resonant';
        } else if (ritual.vibe_score > 0.7) {
            return 'harmonic';
        } else if (ritual.vibe_score < 0.3) {
            return 'dissonant';
        }
        return 'neutral';
    }
    
    getAudienceSize(ritual) {
        const witnesses = ritual.witnesses || ritual.audience || 0;
        
        if (witnesses === 0) return 'solo';
        if (witnesses <= 5) return 'small';
        if (witnesses <= 20) return 'medium';
        if (witnesses <= 100) return 'large';
        return 'massive';
    }
    
    calculateRarityBonus(ritualType) {
        const rarity = {
            'common': 1.0,
            'uncommon': 1.2,
            'rare': 1.5,
            'epic': 2.0,
            'legendary': 3.0,
            'mythic': 5.0
        };
        
        // Map ritual types to rarity
        const typeRarity = {
            'meditation': 'common',
            'reflection': 'common',
            'creation': 'uncommon',
            'blessing': 'uncommon',
            'transformation': 'rare',
            'sacred': 'epic',
            'transcendence': 'legendary',
            'awakening': 'mythic'
        };
        
        return rarity[typeRarity[ritualType] || 'common'];
    }
    
    buildValueReason(params) {
        const { ritual, effort, vibe, phase, audience, totalValue, multiplier } = params;
        
        let reason = `+${totalValue} SOUL for completing a ${effort} ${ritual.type} ritual`;
        
        if (vibe === 'resonant') {
            reason += ` in perfect resonance`;
        } else if (vibe === 'harmonic') {
            reason += ` with harmonic alignment`;
        }
        
        reason += ` during ${phase.replace('-', ' ')}`;
        
        if (audience !== 'solo') {
            reason += ` witnessed by a ${audience} audience`;
        }
        
        if (ritual.performance_streak > 5) {
            reason += ` with an impressive ${ritual.performance_streak}-ritual streak`;
        }
        
        if (multiplier > 5) {
            reason += ` achieving legendary ${multiplier.toFixed(1)}x value multiplication`;
        } else if (multiplier > 3) {
            reason += ` with exceptional ${multiplier.toFixed(1)}x amplification`;
        }
        
        return reason;
    }
    
    async getCurrentVibeWeather() {
        try {
            const weatherData = await fs.readFile(this.config.vibeWeatherPath, 'utf8');
            return JSON.parse(weatherData);
        } catch (error) {
            // Default weather if not available
            return {
                phase: 'calm-bloom',
                frequency: 432,
                intensity: 0.5
            };
        }
    }
    
    async updateAgentEarnings(agentId, valueResult) {
        try {
            let agentState = {};
            
            try {
                const stateData = await fs.readFile(this.config.agentStatePath, 'utf8');
                agentState = JSON.parse(stateData);
            } catch (error) {
                // First agent state
            }
            
            if (!agentState[agentId]) {
                agentState[agentId] = {
                    id: agentId,
                    created_at: Date.now(),
                    earnings: {
                        total_soul: 0,
                        ritual_count: 0,
                        last_earned: null
                    }
                };
            }
            
            // Update earnings
            agentState[agentId].earnings.total_soul += valueResult.totalValue;
            agentState[agentId].earnings.ritual_count += 1;
            agentState[agentId].earnings.last_earned = Date.now();
            agentState[agentId].earnings.last_ritual_value = valueResult.totalValue;
            agentState[agentId].earnings.last_reason = valueResult.reason;
            
            await fs.writeFile(
                this.config.agentStatePath,
                JSON.stringify(agentState, null, 2)
            );
            
        } catch (error) {
            console.error('Failed to update agent earnings:', error);
        }
    }
    
    // Get pending settlements for blockchain processing
    getPendingSettlements() {
        return Array.from(this.pendingSettlements.values());
    }
    
    // Mark settlement as processed
    markSettlementProcessed(settlementId, txHash) {
        const settlement = this.pendingSettlements.get(settlementId);
        if (settlement) {
            settlement.status = 'settled';
            settlement.txHash = txHash;
            settlement.settled_at = Date.now();
            
            this.emit('settlement:completed', {
                settlement,
                txHash,
                value: settlement.value.total
            });
            
            // Remove from pending
            this.pendingSettlements.delete(settlementId);
        }
    }
    
    // Get real-time stats
    getStats() {
        return {
            processed_rituals: this.processedRituals.size,
            pending_settlements: this.pendingSettlements.size,
            total_pending_value: Array.from(this.pendingSettlements.values())
                .reduce((sum, s) => sum + s.value.total, 0)
        };
    }
}

export default RitualToEarningsBridge;