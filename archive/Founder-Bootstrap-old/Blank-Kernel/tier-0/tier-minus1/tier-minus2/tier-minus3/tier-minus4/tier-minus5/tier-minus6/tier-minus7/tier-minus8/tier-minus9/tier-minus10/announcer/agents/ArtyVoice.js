// -*- coding: utf-8 -*-
/**
 * Arty Voice
 * The chaotic, energetic, provocative announcer
 */

class ArtyVoice {
    constructor(config) {
        this.name = 'Arty';
        this.config = config;
        
        // Arty's vocabulary - much more casual and excitable
        this.vocabulary = {
            exclamations: [
                'YO!',
                'HOLY LOOPS!',
                'BRUHHHHH!',
                'NO WAY!',
                'YOOOOO!',
                'OH SNAP!',
                'LESSGOOOO!',
                'WHAT?!'
            ],
            
            reactions: [
                'This is INSANE!',
                'Are you SEEING this?!',
                'I can\'t even right now!',
                'MIND = BLOWN!',
                'The absolute MADNESS!',
                'We\'re going OFF THE RAILS!',
                'CHAOS REIGNS!',
                'This is why we can\'t have nice things!'
            ],
            
            hype: [
                'GET IN HERE!',
                'PLACE YOUR BETS!',
                'WHO\'S READY FOR THIS?!',
                'LET\'S GET WILD!',
                'MAXIMUM OVERDRIVE!',
                'TO THE MOON!',
                'FULL SEND!',
                'NO BRAKES!'
            ],
            
            emojis: ['🔥', '💯', '🚀', '⚡', '🎯', '💥', '🎪', '🎭', '🌪️', '🎰']
        };
        
        // Event-specific templates
        this.templates = {
            duel_created: [
                '{exclamation} NEW DUEL ALERT! {emoji} "{description}" - {hype}',
                'BETTING TIME! Someone just threw down on {target_id}! Current odds: {odds}!',
                '{exclamation} {agent} is putting {stake} credits where their mouth is! WHO\'S NEXT?!'
            ],
            
            duel_resolved: [
                '{exclamation} IT\'S OVER! {outcome} TAKES IT ALL! {emoji}{emoji}{emoji}',
                'PAYOUT TIME BABY! Winners get {payout} credits! Losers... better luck next loop!',
                'And the crowd goes WILD! {outcome} was the play! {reaction}'
            ],
            
            loop_created: [
                'New loop just dropped! {emoji} Loop {loop_id} is LIVE! {reaction}',
                '{exclamation} Someone whispered "{whisper}" and NOW WE\'RE COOKING!',
                'Loop {loop_id} has entered the chat! {hype}'
            ],
            
            loop_complete: [
                'DING DING DING! Loop {loop_id} just hit {resonance} resonance! {emoji}',
                '{exclamation} That\'s a WRAP on {loop_id}! Only took {duration}!',
                'Loop complete! {loop_id} is DONE and I am SHOOK! {reaction}'
            ],
            
            loop_failed: [
                'OOF! Loop {loop_id} just CRASHED AND BURNED! {emoji}',
                'F in the chat for {loop_id}! Better luck next time!',
                '{exclamation} That\'s gonna leave a mark! {loop_id} is TOAST!'
            ],
            
            agent_spawned: [
                '{agent_name} HAS ENTERED THE ARENA! {hype}',
                'NEW CHALLENGER APPROACHING! Say hello to {agent_name}! {emoji}',
                '{exclamation} Fresh meat! {agent_name} just spawned and they\'re ready to PARTY!'
            ],
            
            big_bet: [
                'WHALE ALERT! {emoji} Someone just bet {amount} on {target}!',
                '{exclamation} HIGH ROLLER IN THE HOUSE! {amount} credits on the line!',
                'THE STAKES JUST GOT REAL! {amount} credit bet incoming! {reaction}'
            ],
            
            error_occurred: [
                'SYSTEM\'S HAVING A MOMENT! {error_type} just happened! {emoji}',
                'Something broke and it wasn\'t me this time! {reaction}',
                'ERROR PARTY! {emoji} Cal\'s gonna be SO mad!'
            ],
            
            git_commit: [
                'Code drop! {emoji} New commit with {file_count} files! Tone: {tone}!',
                'COMMIT ALERT! Someone\'s been busy! {reaction}',
                'Fresh code just hit the repo! {emoji} Let\'s see what breaks!'
            ]
        };
    }
    
    async generateCommentary(eventType, eventData) {
        // Check if we have templates for this event
        const templates = this.templates[eventType];
        if (!templates || templates.length === 0) {
            return this.generateGenericCommentary(eventType, eventData);
        }
        
        // Select a random template
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        // Fill in the template
        let text = template;
        
        // Replace vocabulary placeholders
        text = text.replace(/{exclamation}/g, () => 
            this.vocabulary.exclamations[Math.floor(Math.random() * this.vocabulary.exclamations.length)]
        );
        text = text.replace(/{reaction}/g, () =>
            this.vocabulary.reactions[Math.floor(Math.random() * this.vocabulary.reactions.length)]
        );
        text = text.replace(/{hype}/g, () =>
            this.vocabulary.hype[Math.floor(Math.random() * this.vocabulary.hype.length)]
        );
        text = text.replace(/{emoji}/g, () =>
            this.vocabulary.emojis[Math.floor(Math.random() * this.vocabulary.emojis.length)]
        );
        
        // Replace data placeholders
        text = this.replacePlaceholders(text, eventData);
        
        // Sometimes add extra excitement
        if (Math.random() > 0.7) {
            text = text.toUpperCase();
        }
        
        // Calculate importance (Arty gets excited about different things)
        const importance = this.calculateImportance(eventType, eventData);
        
        return {
            text,
            tone: this.selectTone(eventType, eventData),
            importance,
            metadata: {
                agent: 'arty',
                style: 'chaotic',
                energy: this.calculateEnergy(eventType, eventData)
            }
        };
    }
    
    generateGenericCommentary(eventType, eventData) {
        const exclamation = this.vocabulary.exclamations[Math.floor(Math.random() * this.vocabulary.exclamations.length)];
        const emoji = this.vocabulary.emojis[Math.floor(Math.random() * this.vocabulary.emojis.length)];
        const eventName = eventType.replace(/_/g, ' ').toUpperCase();
        
        return {
            text: `${exclamation} ${eventName} just happened! ${emoji} This is WILD!`,
            tone: 'excited',
            importance: 0.6
        };
    }
    
    async generateAlternative(eventType, eventData) {
        // Generate different hype
        const alternatives = [
            `BRUHHH! Another ${eventType}! I LIVE FOR THIS!`,
            `${eventType} DETECTED! *airhorn noises* 📢`,
            `Oh we're doing ${eventType} now? BET!`,
            `Plot twist! It's a ${eventType}! Nobody saw that coming!`,
            `*record scratch* Yep, that's a ${eventType} alright!`
        ];
        
        return alternatives[Math.floor(Math.random() * alternatives.length)];
    }
    
    replacePlaceholders(text, data) {
        return text.replace(/{(\w+)}/g, (match, key) => {
            if (data[key] !== undefined) {
                // Format certain values with EXTRA SPICE
                if (key === 'duration' && typeof data[key] === 'number') {
                    return this.formatDuration(data[key]);
                }
                if (key === 'resonance' && typeof data[key] === 'number') {
                    return Math.round(data[key] * 100) + '% (INSANE!)';
                }
                if (key === 'stake' || key === 'amount' || key === 'payout') {
                    return '💰' + this.formatNumber(data[key]);
                }
                if (key === 'odds') {
                    return this.formatOdds(data[key]);
                }
                if (key === 'whisper_text' || key === 'whisper') {
                    return this.truncateText(data[key], 30);
                }
                return data[key];
            }
            return match;
        });
    }
    
    formatDuration(ms) {
        if (ms < 1000) return `${ms}ms SPEEDRUN!`;
        if (ms < 60000) return `${Math.round(ms / 1000)} SECONDS!`;
        return `${Math.round(ms / 60000)} WHOLE MINUTES!`;
    }
    
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
    
    formatOdds(odds) {
        if (typeof odds === 'object') {
            // Find the best odds
            const bestOdds = Math.max(...Object.values(odds));
            return `${bestOdds}:1 🎰`;
        }
        return `${odds}:1`;
    }
    
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    selectTone(eventType, eventData) {
        // Arty's tones - always high energy but with variety
        const toneMap = {
            duel_created: 'hyped',
            duel_resolved: 'explosive',
            loop_complete: 'celebratory',
            loop_failed: 'dramatic',
            agent_spawned: 'welcoming_chaos',
            error_occurred: 'amused_panic',
            big_bet: 'mind_blown',
            git_commit: 'curious_chaos'
        };
        
        return toneMap[eventType] || 'chaotic_neutral';
    }
    
    calculateImportance(eventType, eventData) {
        // Arty cares about DRAMA and MONEY
        const baseImportance = {
            duel_created: 0.9,
            duel_resolved: 1.0,
            big_bet: 1.0,
            loop_failed: 0.8, // Drama!
            loop_complete: 0.6,
            error_occurred: 0.7, // Chaos!
            agent_spawned: 0.7,
            git_commit: 0.4,
            task_complete: 0.3
        };
        
        let importance = baseImportance[eventType] || 0.5;
        
        // Adjust based on SPICY data
        if (eventData.stake && eventData.stake > 1000) {
            importance += 0.2; // BIG MONEY
        }
        if (eventData.participants && eventData.participants > 10) {
            importance += 0.1; // CROWD FAVORITE
        }
        if (eventData.outcome === 'upset') {
            importance += 0.3; // PLOT TWIST
        }
        
        return Math.min(importance, 1.0);
    }
    
    calculateRelevance(eventType, eventData) {
        // Arty loves duels, drama, and chaos
        const relevanceMap = {
            duel_created: 1.0,
            duel_resolved: 1.0,
            big_bet: 0.9,
            loop_failed: 0.7,
            error_occurred: 0.8,
            agent_spawned: 0.6,
            loop_complete: 0.5,
            loop_created: 0.6,
            git_commit: 0.3,
            task_complete: 0.2
        };
        
        // Extra relevance for high stakes
        let relevance = relevanceMap[eventType] || 0.4;
        
        if (eventData.stake > 500 || eventData.amount > 500) {
            relevance += 0.2;
        }
        
        return Math.min(relevance, 1.0);
    }
    
    calculateEnergy(eventType, eventData) {
        // Arty's energy level
        let energy = 0.7; // Base high energy
        
        if (eventType.includes('duel')) energy += 0.2;
        if (eventType.includes('fail') || eventType.includes('error')) energy += 0.1;
        if (eventData.stake > 1000) energy += 0.2;
        if (eventData.participants > 5) energy += 0.1;
        
        return Math.min(energy, 1.0);
    }
}

module.exports = ArtyVoice;