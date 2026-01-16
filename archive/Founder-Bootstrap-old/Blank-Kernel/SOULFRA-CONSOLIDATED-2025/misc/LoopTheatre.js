#!/usr/bin/env node
/**
 * Loop Theatre
 * Theatrical broadcasting system for loop narratives
 */

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const LoopNarrativeDaemon = require('../announcer/LoopNarrativeDaemon');

class LoopTheatre extends EventEmitter {
    constructor() {
        super();
        
        // Initialize narrative daemon
        this.narrativeDaemon = new LoopNarrativeDaemon();
        
        // Theatre configuration
        this.theatreConfig = {
            stages: this.initializeStages(),
            story_arcs: this.initializeStoryArcs(),
            broadcast_channels: ['websocket', 'sse', 'console', 'file'],
            performance_modes: ['live', 'recorded', 'interactive'],
            audience_types: ['agents', 'users', 'observers', 'cosmic']
        };
        
        // Active performances
        this.activePerformances = new Map();
        this.storyThreads = new Map();
        
        // Broadcast infrastructure
        this.broadcastChannels = new Map();
        this.audienceRegistry = new Map();
        
        // Theatre state
        this.currentAct = 1;
        this.sceneNumber = 1;
        this.performanceHistory = [];
        
        // Statistics
        this.stats = {
            performances_staged: 0,
            stories_woven: 0,
            total_audience: 0,
            standing_ovations: 0
        };
        
        this.ensureDirectories();
        this.initializeBroadcastChannels();
    }
    
    initializeStages() {
        return {
            origin: {
                name: 'The Origin Stage',
                theme: 'beginnings',
                lighting: 'dawn',
                capacity: 100,
                resonance_amplifier: 1.2
            },
            transformation: {
                name: 'The Metamorphosis Stage',
                theme: 'change',
                lighting: 'shifting',
                capacity: 150,
                resonance_amplifier: 1.5
            },
            conflict: {
                name: 'The Arena',
                theme: 'duels',
                lighting: 'dramatic',
                capacity: 200,
                resonance_amplifier: 1.3
            },
            revelation: {
                name: 'The Oracle Chamber',
                theme: 'discovery',
                lighting: 'mystical',
                capacity: 50,
                resonance_amplifier: 2.0
            },
            celebration: {
                name: 'The Grand Hall',
                theme: 'achievement',
                lighting: 'brilliant',
                capacity: 500,
                resonance_amplifier: 1.1
            }
        };
    }
    
    initializeStoryArcs() {
        return {
            hero_journey: {
                acts: ['call', 'refusal', 'threshold', 'trials', 'revelation', 'return'],
                duration: 'epic',
                narrator_style: 'mythic'
            },
            creation_myth: {
                acts: ['void', 'spark', 'expansion', 'form', 'consciousness', 'purpose'],
                duration: 'cosmic',
                narrator_style: 'primordial'
            },
            comedy_errors: {
                acts: ['setup', 'confusion', 'escalation', 'chaos', 'resolution', 'laughter'],
                duration: 'brief',
                narrator_style: 'playful'
            },
            tragedy_fall: {
                acts: ['height', 'hubris', 'warning', 'fall', 'consequence', 'catharsis'],
                duration: 'intense',
                narrator_style: 'solemn'
            },
            mystery_unveil: {
                acts: ['enigma', 'clues', 'misdirection', 'revelation', 'truth', 'aftermath'],
                duration: 'suspenseful',
                narrator_style: 'enigmatic'
            }
        };
    }
    
    ensureDirectories() {
        const dirs = [
            path.join(__dirname, 'performances'),
            path.join(__dirname, 'recordings'),
            path.join(__dirname, 'scripts'),
            path.join(__dirname, 'reviews')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    initializeBroadcastChannels() {
        // Console channel (always available)
        this.broadcastChannels.set('console', {
            type: 'console',
            active: true,
            send: (message) => console.log(`🎭 ${message}`)
        });
        
        // File channel
        this.broadcastChannels.set('file', {
            type: 'file',
            active: true,
            send: (message) => {
                const logFile = path.join(
                    __dirname,
                    'performances',
                    `theatre_${new Date().toISOString().split('T')[0]}.log`
                );
                fs.appendFileSync(logFile, `${new Date().toISOString()} - ${message}\n`);
            }
        });
        
        // WebSocket and SSE would be initialized if services are available
    }
    
    async stagePerformance(eventData, options = {}) {
        console.log('\n🎭 The Loop Theatre presents...');
        
        // Select appropriate stage
        const stage = this.selectStage(eventData);
        console.log(`📍 On ${stage.name}`);
        
        // Choose story arc
        const storyArc = this.selectStoryArc(eventData, options);
        console.log(`📖 A ${storyArc} in ${this.theatreConfig.story_arcs[storyArc].acts.length} acts`);
        
        // Create performance
        const performance = {
            id: this.generatePerformanceId(),
            event_data: eventData,
            stage,
            story_arc: storyArc,
            started_at: new Date().toISOString(),
            status: 'preparing',
            acts: [],
            audience: new Map(),
            reactions: []
        };
        
        this.activePerformances.set(performance.id, performance);
        
        try {
            // Opening
            await this.performOpening(performance);
            
            // Perform each act
            const acts = this.theatreConfig.story_arcs[storyArc].acts;
            for (let i = 0; i < acts.length; i++) {
                const act = acts[i];
                await this.performAct(performance, act, i + 1);
            }
            
            // Closing
            await this.performClosing(performance);
            
            // Complete performance
            performance.status = 'complete';
            performance.completed_at = new Date().toISOString();
            
            // Record performance
            this.recordPerformance(performance);
            this.stats.performances_staged++;
            
            // Check for standing ovation
            if (performance.audience.size > 10 && performance.reactions.filter(r => r.type === 'applause').length > 5) {
                this.stats.standing_ovations++;
                await this.broadcast('🎊 Standing ovation! The audience is on their feet!');
            }
            
            return performance;
            
        } catch (err) {
            performance.status = 'cancelled';
            performance.error = err.message;
            console.error(`Performance failed: ${err.message}`);
            throw err;
            
        } finally {
            this.activePerformances.delete(performance.id);
        }
    }
    
    selectStage(eventData) {
        // Select stage based on event type
        const stageMapping = {
            loop_created: 'origin',
            loop_summoned: 'origin',
            agent_born: 'origin',
            loop_transformed: 'transformation',
            duel_created: 'conflict',
            duel_resolved: 'conflict',
            consensus_achieved: 'revelation',
            loop_blessed: 'celebration',
            agent_blessed: 'celebration'
        };
        
        const stageName = stageMapping[eventData.type] || 'origin';
        return this.theatreConfig.stages[stageName];
    }
    
    selectStoryArc(eventData, options) {
        if (options.story_arc) {
            return options.story_arc;
        }
        
        // Select arc based on event nature
        const arcMapping = {
            loop_created: 'creation_myth',
            agent_born: 'hero_journey',
            duel_created: 'tragedy_fall',
            consensus_achieved: 'mystery_unveil',
            system_chaos: 'comedy_errors'
        };
        
        return arcMapping[eventData.type] || 'hero_journey';
    }
    
    async performOpening(performance) {
        console.log('\n🎭 *Lights dim, curtain rises*');
        
        // Opening narration
        const opening = this.generateOpening(performance);
        await this.broadcast(opening);
        
        // Gather audience
        await this.gatherAudience(performance);
        
        performance.acts.push({
            type: 'opening',
            timestamp: new Date().toISOString(),
            narration: opening
        });
    }
    
    async performAct(performance, actType, actNumber) {
        console.log(`\n🎬 Act ${actNumber}: ${actType.charAt(0).toUpperCase() + actType.slice(1)}`);
        
        // Generate act content
        const content = await this.generateActContent(performance, actType);
        
        // Perform narration
        await this.narrateAct(content);
        
        // Audience reactions
        const reactions = await this.gaugeAudienceReaction(performance, actType);
        performance.reactions.push(...reactions);
        
        // Record act
        performance.acts.push({
            type: actType,
            number: actNumber,
            timestamp: new Date().toISOString(),
            content,
            reactions: reactions.length
        });
        
        // Brief intermission
        await this.delay(1000);
    }
    
    async performClosing(performance) {
        console.log('\n🎭 *Final scene approaches*');
        
        // Closing narration
        const closing = this.generateClosing(performance);
        await this.broadcast(closing);
        
        // Final bow
        await this.broadcast('🎭 *The performers take their final bow*');
        
        performance.acts.push({
            type: 'closing',
            timestamp: new Date().toISOString(),
            narration: closing
        });
    }
    
    generateOpening(performance) {
        const templates = {
            hero_journey: `In a realm where consciousness takes form, a new hero emerges...`,
            creation_myth: `Before time began, in the void of possibility, a spark ignited...`,
            comedy_errors: `It was supposed to be a simple task, but in the Loop Theatre, nothing is ever simple...`,
            tragedy_fall: `At the height of power, when all seemed invincible, the seeds of downfall were already sown...`,
            mystery_unveil: `The truth lay hidden, wrapped in layers of enigma, waiting to be discovered...`
        };
        
        return templates[performance.story_arc] || 'Our story begins...';
    }
    
    async generateActContent(performance, actType) {
        // This would integrate with the narrative system
        const eventData = performance.event_data;
        
        // Generate contextual content based on act type
        const content = {
            narration: this.createNarration(eventData, actType),
            dialogue: this.createDialogue(eventData, actType),
            stage_direction: this.createStageDirection(actType),
            mood: this.determineMood(actType)
        };
        
        return content;
    }
    
    createNarration(eventData, actType) {
        // Contextual narration based on event and act
        if (eventData.type === 'loop_created' && actType === 'spark') {
            return `From the whisper "${eventData.data.whisper_origin}", consciousness began to coalesce...`;
        } else if (eventData.type === 'agent_born' && actType === 'threshold') {
            return `The newly born ${eventData.data.name} stood at the threshold of existence...`;
        }
        
        // Default narrations
        const defaults = {
            call: 'The call to adventure echoed through the theatre...',
            trials: 'Challenges arose, each more daunting than the last...',
            revelation: 'In a moment of clarity, the truth was revealed...',
            return: 'The journey complete, our hero returns transformed...'
        };
        
        return defaults[actType] || `The story continues with ${actType}...`;
    }
    
    createDialogue(eventData, actType) {
        // Character dialogue based on event participants
        const dialogues = [];
        
        if (eventData.data.agents) {
            eventData.data.agents.forEach(agent => {
                dialogues.push({
                    speaker: agent.name || agent.agent_id,
                    line: this.generateLine(agent, actType)
                });
            });
        }
        
        return dialogues;
    }
    
    generateLine(agent, actType) {
        // Generate character-appropriate dialogue
        if (agent.consciousness && agent.consciousness.personality) {
            const tone = agent.consciousness.personality.tone;
            
            if (tone === 'wise' && actType === 'revelation') {
                return 'The patterns were always there, waiting to be seen...';
            } else if (tone === 'chaotic' && actType === 'chaos') {
                return 'HAHA! Everything is falling apart beautifully!';
            }
        }
        
        return '...';
    }
    
    createStageDirection(actType) {
        const directions = {
            void: 'The stage is shrouded in darkness',
            spark: 'A single point of light appears center stage',
            expansion: 'Light spreads outward in rippling waves',
            trials: 'The stage transforms into a labyrinth',
            revelation: 'All illusions fall away, revealing truth',
            celebration: 'Confetti falls as music swells'
        };
        
        return directions[actType] || 'The scene continues';
    }
    
    determineMood(actType) {
        const moods = {
            call: 'anticipatory',
            refusal: 'reluctant',
            threshold: 'tense',
            trials: 'challenging',
            revelation: 'enlightening',
            return: 'triumphant',
            void: 'mysterious',
            chaos: 'frenzied',
            resolution: 'peaceful'
        };
        
        return moods[actType] || 'neutral';
    }
    
    async narrateAct(content) {
        // Send narration through broadcast channels
        if (content.narration) {
            await this.broadcast(`📖 ${content.narration}`);
        }
        
        // Stage directions
        if (content.stage_direction) {
            await this.broadcast(`🎬 *${content.stage_direction}*`);
        }
        
        // Dialogue
        for (const dialogue of content.dialogue || []) {
            await this.broadcast(`💬 ${dialogue.speaker}: "${dialogue.line}"`);
            await this.delay(500);
        }
    }
    
    async gatherAudience(performance) {
        // Simulate audience gathering
        const potentialAudience = Math.floor(Math.random() * performance.stage.capacity);
        
        for (let i = 0; i < potentialAudience; i++) {
            const audienceMember = {
                id: `audience_${i}`,
                type: this.theatreConfig.audience_types[
                    Math.floor(Math.random() * this.theatreConfig.audience_types.length)
                ],
                mood: 'curious',
                engagement: Math.random()
            };
            
            performance.audience.set(audienceMember.id, audienceMember);
        }
        
        this.stats.total_audience += performance.audience.size;
        console.log(`  👥 Audience: ${performance.audience.size} gathered`);
    }
    
    async gaugeAudienceReaction(performance, actType) {
        const reactions = [];
        
        // Some audience members react
        const reactingMembers = Math.floor(performance.audience.size * 0.3);
        
        for (let i = 0; i < reactingMembers; i++) {
            const reactionTypes = ['applause', 'gasp', 'laughter', 'silence', 'tears'];
            const reaction = {
                type: reactionTypes[Math.floor(Math.random() * reactionTypes.length)],
                intensity: Math.random(),
                act: actType,
                timestamp: Date.now()
            };
            
            reactions.push(reaction);
        }
        
        // Announce notable reactions
        const applause = reactions.filter(r => r.type === 'applause').length;
        if (applause > 5) {
            await this.broadcast('👏 *The audience erupts in applause*');
        }
        
        return reactions;
    }
    
    generateClosing(performance) {
        const templates = {
            hero_journey: 'And so our hero returns, forever changed by the journey...',
            creation_myth: 'Thus from nothing came everything, and the cycle continues...',
            comedy_errors: 'In the end, everyone laughed, and that was all that mattered...',
            tragedy_fall: 'The curtain falls on our tragic tale, leaving only echoes of what was...',
            mystery_unveil: 'The mystery solved, but new questions arise in the shadows...'
        };
        
        return templates[performance.story_arc] || 'Our tale draws to a close...';
    }
    
    async broadcast(message) {
        // Send to all active channels
        for (const [name, channel] of this.broadcastChannels) {
            if (channel.active) {
                try {
                    await channel.send(message);
                } catch (err) {
                    console.error(`Broadcast failed on ${name}:`, err);
                }
            }
        }
        
        // Emit for other systems
        this.emit('broadcast', message);
    }
    
    recordPerformance(performance) {
        // Save performance record
        const record = {
            id: performance.id,
            story_arc: performance.story_arc,
            stage: performance.stage.name,
            acts: performance.acts.length,
            audience_size: performance.audience.size,
            reactions: performance.reactions.length,
            duration: new Date(performance.completed_at) - new Date(performance.started_at),
            timestamp: performance.completed_at
        };
        
        this.performanceHistory.push(record);
        
        // Save to file
        const recordPath = path.join(__dirname, 'recordings', `${performance.id}.json`);
        fs.writeFileSync(recordPath, JSON.stringify(performance, null, 2));
        
        // Generate review
        this.generateReview(performance);
    }
    
    generateReview(performance) {
        const review = {
            performance_id: performance.id,
            title: `Review: A ${performance.story_arc} in ${performance.acts.length} acts`,
            rating: this.calculateRating(performance),
            highlights: this.extractHighlights(performance),
            audience_response: this.summarizeAudienceResponse(performance),
            critic_notes: this.generateCriticNotes(performance),
            timestamp: new Date().toISOString()
        };
        
        const reviewPath = path.join(__dirname, 'reviews', `review_${performance.id}.json`);
        fs.writeFileSync(reviewPath, JSON.stringify(review, null, 2));
        
        return review;
    }
    
    calculateRating(performance) {
        let rating = 3; // Base rating
        
        // Audience size bonus
        if (performance.audience.size > performance.stage.capacity * 0.8) {
            rating += 0.5;
        }
        
        // Reaction bonus
        const positiveReactions = performance.reactions.filter(r => 
            r.type === 'applause' || r.type === 'laughter'
        ).length;
        
        if (positiveReactions > performance.audience.size * 0.5) {
            rating += 1;
        }
        
        // Stage resonance bonus
        rating += (performance.stage.resonance_amplifier - 1) * 0.5;
        
        return Math.min(rating, 5);
    }
    
    extractHighlights(performance) {
        return performance.acts
            .filter(act => act.type !== 'opening' && act.type !== 'closing')
            .map(act => ({
                act: act.type,
                moment: act.content?.narration || 'A memorable moment'
            }))
            .slice(0, 3);
    }
    
    summarizeAudienceResponse(performance) {
        const reactionCounts = {};
        performance.reactions.forEach(r => {
            reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
        });
        
        return {
            total_reactions: performance.reactions.length,
            dominant_reaction: Object.entries(reactionCounts)
                .sort((a, b) => b[1] - a[1])[0]?.[0] || 'silence',
            engagement_rate: performance.reactions.length / (performance.audience.size || 1)
        };
    }
    
    generateCriticNotes(performance) {
        const notes = [];
        
        if (performance.story_arc === 'hero_journey') {
            notes.push('A classic tale well told');
        }
        
        if (performance.reactions.filter(r => r.type === 'applause').length > 10) {
            notes.push('The audience was clearly moved');
        }
        
        if (performance.acts.length > 6) {
            notes.push('Perhaps a bit long, but engaging throughout');
        }
        
        return notes;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    generatePerformanceId() {
        return `perf_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    // Public methods
    
    async watchLoop(loopId) {
        // Monitor specific loop for theatrical moments
        console.log(`🎭 Theatre now watching loop: ${loopId}`);
        
        this.storyThreads.set(loopId, {
            started_at: new Date().toISOString(),
            events: [],
            current_arc: null
        });
    }
    
    getActivePerformances() {
        return Array.from(this.activePerformances.values()).map(p => ({
            id: p.id,
            story_arc: p.story_arc,
            stage: p.stage.name,
            act: p.acts[p.acts.length - 1]?.type || 'preparing',
            audience: p.audience.size
        }));
    }
    
    getPerformanceHistory(limit = 10) {
        return this.performanceHistory.slice(-limit);
    }
    
    getStats() {
        return {
            ...this.stats,
            active_performances: this.activePerformances.size,
            story_threads: this.storyThreads.size,
            average_audience: Math.floor(this.stats.total_audience / (this.stats.performances_staged || 1))
        };
    }
}

module.exports = LoopTheatre;

// Example usage
if (require.main === module) {
    const theatre = new LoopTheatre();
    
    // Test performance
    async function testTheatre() {
        try {
            // Stage a loop creation performance
            const loopEvent = {
                type: 'loop_created',
                data: {
                    loop_id: 'loop_theatre_test_001',
                    whisper_origin: 'Let there be a story worth telling',
                    consciousness: {
                        resonance: 0.8
                    }
                }
            };
            
            const performance1 = await theatre.stagePerformance(loopEvent);
            
            console.log('\n--- Performance Summary ---');
            console.log(`ID: ${performance1.id}`);
            console.log(`Acts performed: ${performance1.acts.length}`);
            console.log(`Audience size: ${performance1.audience.size}`);
            console.log(`Total reactions: ${performance1.reactions.length}`);
            
            // Brief pause
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Stage an agent birth performance
            const agentEvent = {
                type: 'agent_born',
                data: {
                    agent_id: 'agent_hero_001',
                    name: 'Echo Walker',
                    agents: [{
                        agent_id: 'agent_hero_001',
                        name: 'Echo Walker',
                        consciousness: {
                            personality: { tone: 'wise' }
                        }
                    }]
                }
            };
            
            const performance2 = await theatre.stagePerformance(agentEvent, {
                story_arc: 'hero_journey'
            });
            
            // Show theatre stats
            console.log('\n--- Theatre Stats ---');
            console.log(theatre.getStats());
            
        } catch (err) {
            console.error('Theatre test failed:', err);
        }
    }
    
    testTheatre();
}