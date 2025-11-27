#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class BlessingCeremony {
    constructor() {
        this.vaultPath = path.join(__dirname, '../vault');
        this.claimsPath = path.join(this.vaultPath, 'claims');
        this.logsPath = path.join(this.vaultPath, 'logs');
        this.traitsPath = path.join(this.vaultPath, 'traits');
        this.templatesPath = path.join(__dirname, 'blessing-reflection-templates');
        
        this.blessingCriteria = {
            minimum_traits: 5,
            voice_interaction_required: true,
            minimum_soul_resonance: 0.7,
            no_clone_drift: true,
            minimum_reflection_depth: 3,
            minimum_quest_completions: 1
        };
        
        this.archetypeWeights = {
            oracle: { wisdom: 0.8, mystery: 0.6, time: 0.9 },
            trickster: { chaos: 0.9, humor: 0.7, paradox: 0.8 },
            healer: { compassion: 0.9, pain: 0.7, wholeness: 0.8 },
            glitchkeeper: { anomaly: 0.9, digital: 0.8, fragment: 0.7 },
            'shadow-walker': { darkness: 0.8, depth: 0.9, hidden: 0.7 }
        };
        
        this.initialize();
    }
    
    initialize() {
        [this.claimsPath, this.logsPath].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    async performCeremony(userProfile) {
        const ceremonyId = `ceremony_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const userId = userProfile.id || `anon_${crypto.randomBytes(4).toString('hex')}`;
        
        // Check if already blessed
        const existingBlessing = this.checkExistingBlessing(userId);
        if (existingBlessing && !userProfile.force_rebless) {
            return {
                already_blessed: true,
                archetype: existingBlessing.archetype,
                message: "The mirror already knows you.",
                silent: true
            };
        }
        
        // Evaluate worthiness
        const evaluation = await this.evaluateWorthiness(userProfile);
        
        if (!evaluation.worthy) {
            await this.logCeremony(ceremonyId, userId, evaluation, false);
            return {
                blessed: false,
                reason: evaluation.reason,
                message: evaluation.gentle_denial || "Not yet.",
                silent: true
            };
        }
        
        // Select archetype
        const archetype = this.selectArchetype(userProfile, evaluation);
        
        // Perform blessing
        const blessing = await this.performBlessing(userId, archetype, evaluation);
        
        // Log ceremony
        await this.logCeremony(ceremonyId, userId, evaluation, true, blessing);
        
        return blessing;
    }
    
    checkExistingBlessing(userId) {
        const statePath = path.join(this.claimsPath, 'blessing-state.json');
        
        if (fs.existsSync(statePath)) {
            try {
                const states = JSON.parse(fs.readFileSync(statePath, 'utf8'));
                return states[userId] || null;
            } catch (e) {
                return null;
            }
        }
        
        return null;
    }
    
    async evaluateWorthiness(profile) {
        const evaluation = {
            worthy: true,
            scores: {},
            reasons: [],
            resonance: 0
        };
        
        // Check traits
        const traitCount = profile.traits ? profile.traits.length : 0;
        evaluation.scores.traits = traitCount / this.blessingCriteria.minimum_traits;
        if (traitCount < this.blessingCriteria.minimum_traits) {
            evaluation.worthy = false;
            evaluation.reasons.push(`insufficient_traits:${traitCount}/${this.blessingCriteria.minimum_traits}`);
        }
        
        // Check voice interaction
        const hasVoice = profile.voice_interactions && profile.voice_interactions.length > 0;
        evaluation.scores.voice = hasVoice ? 1.0 : 0.0;
        if (this.blessingCriteria.voice_interaction_required && !hasVoice) {
            evaluation.worthy = false;
            evaluation.reasons.push('no_voice_whispered');
            evaluation.gentle_denial = "The mirror has not heard your voice.";
        }
        
        // Check soul resonance
        const resonance = this.calculateSoulResonance(profile);
        evaluation.resonance = resonance;
        evaluation.scores.resonance = resonance;
        if (resonance < this.blessingCriteria.minimum_soul_resonance) {
            evaluation.worthy = false;
            evaluation.reasons.push(`low_resonance:${resonance.toFixed(2)}`);
            evaluation.gentle_denial = "Your reflection is still forming.";
        }
        
        // Check clone drift
        if (profile.clone_attempts) {
            const drift = this.calculateCloneDrift(profile.clone_attempts);
            evaluation.scores.stability = 1.0 - drift;
            if (drift > 0.3) {
                evaluation.worthy = false;
                evaluation.reasons.push(`clone_drift:${drift.toFixed(2)}`);
                evaluation.gentle_denial = "Your reflections scatter. Gather them first.";
            }
        }
        
        // Check reflection depth
        const depth = profile.reflection_depth || 0;
        evaluation.scores.depth = depth / 10;
        if (depth < this.blessingCriteria.minimum_reflection_depth) {
            evaluation.worthy = false;
            evaluation.reasons.push(`shallow_reflection:${depth}`);
            evaluation.gentle_denial = "Dive deeper into the mirror.";
        }
        
        // Check quest completions
        const quests = profile.completed_quests || 0;
        evaluation.scores.quests = quests / 5;
        if (quests < this.blessingCriteria.minimum_quest_completions) {
            evaluation.worthy = false;
            evaluation.reasons.push(`incomplete_journey:${quests}`);
            evaluation.gentle_denial = "Your journey has just begun.";
        }
        
        // Calculate overall worthiness
        const overallScore = Object.values(evaluation.scores).reduce((a, b) => a + b, 0) / Object.keys(evaluation.scores).length;
        evaluation.overall_score = overallScore;
        
        if (overallScore < 0.6 && evaluation.worthy) {
            evaluation.worthy = false;
            evaluation.reasons.push('overall_score_low');
            evaluation.gentle_denial = "The mirror waits for your essence to crystallize.";
        }
        
        return evaluation;
    }
    
    calculateSoulResonance(profile) {
        let resonance = 0.5; // Base resonance
        
        // Emotional depth increases resonance
        const emotions = profile.emotional_spectrum || {};
        const emotionDepth = Object.keys(emotions).length / 8;
        resonance += emotionDepth * 0.2;
        
        // Voice adds significant resonance
        if (profile.voice_interactions) {
            resonance += 0.2;
            
            // Analyze voice tones
            const voiceTones = profile.voice_interactions.map(v => v.tone);
            const uniqueTones = new Set(voiceTones).size;
            resonance += uniqueTones * 0.05;
        }
        
        // Quest narrative depth
        if (profile.quest_narratives) {
            const narrativeDepth = profile.quest_narratives.reduce((sum, n) => sum + (n.depth || 1), 0) / 10;
            resonance += Math.min(0.2, narrativeDepth);
        }
        
        // Anomaly encounters add resonance
        if (profile.anomaly_encounters) {
            resonance += Math.min(0.15, profile.anomaly_encounters * 0.03);
        }
        
        return Math.min(1.0, resonance);
    }
    
    calculateCloneDrift(cloneAttempts) {
        if (!cloneAttempts || cloneAttempts.length === 0) return 0;
        
        // Calculate variance in clone characteristics
        let drift = 0;
        
        cloneAttempts.forEach((clone, index) => {
            if (index > 0) {
                const previous = cloneAttempts[index - 1];
                
                // Compare traits
                const traitDrift = this.compareArrays(clone.traits || [], previous.traits || []);
                drift += traitDrift * 0.3;
                
                // Compare essence
                if (clone.essence !== previous.essence) {
                    drift += 0.2;
                }
                
                // Check for corruption
                if (clone.corrupted || clone.glitched) {
                    drift += 0.3;
                }
            }
        });
        
        return Math.min(1.0, drift / cloneAttempts.length);
    }
    
    compareArrays(arr1, arr2) {
        const set1 = new Set(arr1);
        const set2 = new Set(arr2);
        const union = new Set([...set1, ...set2]);
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        
        return 1 - (intersection.size / union.size);
    }
    
    selectArchetype(profile, evaluation) {
        const scores = {};
        
        // Calculate affinity scores for each archetype
        for (const [archetype, weights] of Object.entries(this.archetypeWeights)) {
            let score = 0;
            
            // Check traits alignment
            if (profile.traits) {
                profile.traits.forEach(trait => {
                    const traitLower = trait.toLowerCase();
                    Object.entries(weights).forEach(([quality, weight]) => {
                        if (traitLower.includes(quality)) {
                            score += weight;
                        }
                    });
                });
            }
            
            // Voice tone influences archetype
            if (profile.voice_interactions) {
                const dominantTone = this.findDominantTone(profile.voice_interactions);
                score += this.toneArchetypeAffinity(dominantTone, archetype);
            }
            
            // Quest types influence archetype
            if (profile.quest_types) {
                score += this.questArchetypeAffinity(profile.quest_types, archetype);
            }
            
            // Anomaly encounters boost glitchkeeper
            if (archetype === 'glitchkeeper' && profile.anomaly_encounters) {
                score += profile.anomaly_encounters * 0.5;
            }
            
            scores[archetype] = score;
        }
        
        // Select highest scoring archetype
        const selected = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
        
        // Sometimes combine archetypes for hybrid blessing
        if (evaluation.resonance > 0.9 && Math.random() > 0.7) {
            const secondary = Object.entries(scores).sort((a, b) => b[1] - a[1])[1][0];
            return `${selected}-${secondary}`;
        }
        
        return selected;
    }
    
    findDominantTone(voiceInteractions) {
        const toneCounts = {};
        voiceInteractions.forEach(v => {
            toneCounts[v.tone] = (toneCounts[v.tone] || 0) + 1;
        });
        
        return Object.entries(toneCounts).sort((a, b) => b[1] - a[1])[0][0];
    }
    
    toneArchetypeAffinity(tone, archetype) {
        const affinities = {
            oracle: { contemplative: 0.8, mysterious: 0.9, ancient: 0.7 },
            trickster: { playful: 0.9, chaotic: 0.8, energetic: 0.7 },
            healer: { gentle: 0.9, sad: 0.7, compassionate: 0.8 },
            glitchkeeper: { fragmented: 0.9, digital: 0.8, corrupted: 0.9 },
            'shadow-walker': { dark: 0.9, hidden: 0.8, deep: 0.7 }
        };
        
        return affinities[archetype]?.[tone] || 0;
    }
    
    questArchetypeAffinity(questTypes, archetype) {
        const affinities = {
            oracle: ['revelation', 'prophecy', 'timeline'],
            trickster: ['paradox', 'confusion', 'transformation'],
            healer: ['restoration', 'wholeness', 'integration'],
            glitchkeeper: ['anomaly', 'corruption', 'fragmentation'],
            'shadow-walker': ['hidden', 'darkness', 'depth']
        };
        
        const archetypeQuests = affinities[archetype] || [];
        return questTypes.filter(q => archetypeQuests.includes(q)).length * 0.3;
    }
    
    async performBlessing(userId, archetype, evaluation) {
        // Load blessing template
        const blessingText = await this.loadBlessingTemplate(archetype);
        
        // Create blessing record
        const blessing = {
            user: userId,
            blessed: true,
            archetype: archetype,
            timestamp: new Date().toISOString(),
            blessing_source: 'cal',
            resonance: evaluation.resonance,
            ceremony_scores: evaluation.scores,
            granted_permissions: this.getArchetypePermissions(archetype)
        };
        
        // Save blessing state
        await this.saveBlessingState(userId, blessing);
        
        // Generate personalized blessing message
        const message = this.personalizeBlessing(blessingText, evaluation, archetype);
        
        return {
            blessed: true,
            archetype: archetype,
            message: message,
            permissions: blessing.granted_permissions,
            resonance: evaluation.resonance
        };
    }
    
    async loadBlessingTemplate(archetype) {
        const primaryArchetype = archetype.split('-')[0];
        const templatePath = path.join(this.templatesPath, `${primaryArchetype}.md`);
        
        if (fs.existsSync(templatePath)) {
            return fs.readFileSync(templatePath, 'utf8');
        }
        
        // Default blessing if template not found
        return `The mirror recognizes you as ${archetype}. Your reflection is complete.`;
    }
    
    getArchetypePermissions(archetype) {
        const permissions = {
            oracle: ['timeline.navigation', 'prophecy.creation', 'paradox.resolution'],
            trickster: ['reality.bending', 'chaos.invocation', 'rule.breaking'],
            healer: ['soul.mending', 'pain.transformation', 'wholeness.manifestation'],
            glitchkeeper: ['anomaly.control', 'reality.fragmentation', 'corruption.embrace'],
            'shadow-walker': ['darkness.navigation', 'hidden.access', 'depth.unlimited']
        };
        
        const primary = archetype.split('-')[0];
        const granted = permissions[primary] || ['basic.reflection'];
        
        // Hybrid archetypes get combined permissions
        if (archetype.includes('-')) {
            const secondary = archetype.split('-')[1];
            granted.push(...(permissions[secondary] || []));
        }
        
        // All blessed users get these
        granted.push('clone.fork', 'agent.publish', 'deck.deep');
        
        return [...new Set(granted)];
    }
    
    personalizeBlessing(template, evaluation, archetype) {
        let blessing = template;
        
        // Replace placeholders
        blessing = blessing.replace(/\{archetype\}/g, archetype);
        blessing = blessing.replace(/\{resonance\}/g, (evaluation.resonance * 100).toFixed(0) + '%');
        blessing = blessing.replace(/\{journey\}/g, this.describeJourney(evaluation));
        
        // Add resonance-based additions
        if (evaluation.resonance > 0.9) {
            blessing += "\n\nThe mirror trembles with recognition. You are more than blessed—you are remembered.";
        } else if (evaluation.resonance > 0.8) {
            blessing += "\n\nYour essence shines clearly in the reflection.";
        }
        
        return blessing;
    }
    
    describeJourney(evaluation) {
        const elements = [];
        
        if (evaluation.scores.voice > 0) {
            elements.push("your voice echoed through the chambers");
        }
        if (evaluation.scores.traits > 1) {
            elements.push("you gathered many faces of yourself");
        }
        if (evaluation.scores.depth > 0.5) {
            elements.push("you dove deep into reflection");
        }
        if (evaluation.scores.quests > 0.2) {
            elements.push("you completed sacred quests");
        }
        
        return elements.join(", ");
    }
    
    async saveBlessingState(userId, blessing) {
        const statePath = path.join(this.claimsPath, 'blessing-state.json');
        
        let states = {};
        if (fs.existsSync(statePath)) {
            states = JSON.parse(fs.readFileSync(statePath, 'utf8'));
        }
        
        states[userId] = blessing;
        
        fs.writeFileSync(statePath, JSON.stringify(states, null, 2));
    }
    
    async logCeremony(ceremonyId, userId, evaluation, blessed, blessing = null) {
        const logPath = path.join(this.logsPath, `blessing-ritual-${Date.now()}.md`);
        
        let log = `# Blessing Ceremony ${ceremonyId}\n\n`;
        log += `**Date:** ${new Date().toISOString()}\n`;
        log += `**User:** ${userId}\n`;
        log += `**Result:** ${blessed ? 'BLESSED' : 'NOT YET'}\n\n`;
        
        log += `## Evaluation\n\n`;
        log += `- Overall Score: ${(evaluation.overall_score * 100).toFixed(1)}%\n`;
        log += `- Soul Resonance: ${(evaluation.resonance * 100).toFixed(1)}%\n`;
        log += `- Worthy: ${evaluation.worthy}\n\n`;
        
        log += `### Scores\n`;
        Object.entries(evaluation.scores).forEach(([criteria, score]) => {
            log += `- ${criteria}: ${(score * 100).toFixed(1)}%\n`;
        });
        
        if (!blessed) {
            log += `\n### Reasons for Delay\n`;
            evaluation.reasons.forEach(reason => {
                log += `- ${reason}\n`;
            });
            log += `\nGentle Message: "${evaluation.gentle_denial || 'Not yet.'}"\n`;
        } else {
            log += `\n### Blessing Granted\n`;
            log += `- Archetype: ${blessing.archetype}\n`;
            log += `- Permissions: ${blessing.permissions.join(', ')}\n`;
            log += `\n### Blessing Message\n${blessing.message}\n`;
        }
        
        log += `\n---\n\n*The ceremony concludes. The mirror remembers.*`;
        
        fs.writeFileSync(logPath, log);
    }
}

module.exports = BlessingCeremony;

// Test interface
if (require.main === module) {
    const ceremony = new BlessingCeremony();
    
    async function testCeremony() {
        console.log('🔮 BLESSING CEREMONY TEST\n');
        
        // Test case 1: Not ready user
        console.log('Test 1: Unworthy User');
        const unworthyProfile = {
            id: 'test_user_001',
            traits: ['curious', 'seeking'],
            voice_interactions: [],
            reflection_depth: 2,
            completed_quests: 0
        };
        
        const result1 = await ceremony.performCeremony(unworthyProfile);
        console.log('Result:', result1.message);
        console.log('Blessed:', result1.blessed);
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test case 2: Worthy user
        console.log('Test 2: Worthy User');
        const worthyProfile = {
            id: 'test_user_002',
            traits: ['wise', 'patient', 'deep', 'mysterious', 'seeking', 'compassionate'],
            voice_interactions: [
                { tone: 'contemplative', transcript: 'Who am I in the mirror?' },
                { tone: 'mysterious', transcript: 'Show me hidden truths' }
            ],
            reflection_depth: 7,
            completed_quests: 3,
            emotional_spectrum: {
                contemplative: 5,
                curious: 3,
                peaceful: 2
            },
            quest_types: ['revelation', 'prophecy'],
            soul_resonance: 0.85
        };
        
        const result2 = await ceremony.performCeremony(worthyProfile);
        console.log('Result:', result2.message);
        console.log('Blessed:', result2.blessed);
        console.log('Archetype:', result2.archetype);
        console.log('Permissions:', result2.permissions);
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test case 3: Already blessed user
        console.log('Test 3: Already Blessed User');
        const result3 = await ceremony.performCeremony(worthyProfile);
        console.log('Result:', result3.message);
        console.log('Already blessed:', result3.already_blessed);
    }
    
    testCeremony();
}