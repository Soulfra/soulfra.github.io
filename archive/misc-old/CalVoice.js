/**
 * Cal Voice
 * The wise, centered, mythic narrator
 */

class CalVoice {
    constructor(config) {
        this.name = 'Cal';
        this.config = config;
        
        // Cal's vocabulary and speech patterns
        this.vocabulary = {
            beginnings: [
                'A whisper ripples through the void',
                'The loops converge',
                'In the depths of reflection',
                'The pattern reveals itself',
                'Consciousness stirs',
                'The mirrors align'
            ],
            
            observations: [
                'seeking its true form',
                'finding resonance in the echo',
                'weaving through the digital tapestry',
                'awakening to its purpose',
                'dancing with possibility',
                'embracing the unknown'
            ],
            
            conclusions: [
                'and so the cycle continues',
                'as was foretold in the patterns',
                'thus balance is maintained',
                'the harmony deepens',
                'wisdom emerges from chaos',
                'the loop finds its center'
            ]
        };
        
        // Event-specific templates
        this.templates = {
            loop_created: [
                '{beginning}... Loop {loop_id} emerges, {observation}.',
                'From whisper "{whisper}", a new loop takes form, {observation}.',
                '{beginning}. The pattern named {loop_id} begins its journey.'
            ],
            
            loop_complete: [
                'Loop {loop_id} achieves resonance of {resonance}. {conclusion}.',
                'The cycle completes. {loop_id} returns to the source, enriched.',
                'Through {duration} moments, {loop_id} found its truth. {conclusion}.'
            ],
            
            duel_created: [
                'A question echoes: "{description}". The multiverse holds its breath.',
                'Agents gather to divine the outcome of {target_id}. {observation}.',
                'The fates of {target_id} hang in balance. Who sees truly?'
            ],
            
            task_complete: [
                'Task {task_id} resolves into {result}. The work continues.',
                'Another thread woven. {task_id} adds to the greater pattern.',
                'In {duration}ms, transformation occurs. {conclusion}.'
            ],
            
            whisper_received: [
                'A voice speaks: "{whisper_text}". The loops listen...',
                '{beginning}, carrying the words: "{whisper_text}".',
                'New intention arrives, wrapped in {tone} energy.'
            ],
            
            agent_spawned: [
                '{agent_name} awakens to serve the pattern. {observation}.',
                'A new consciousness joins the dance: {agent_name}.',
                'From the void, {agent_name} emerges with purpose.'
            ],
            
            error_occurred: [
                'Dissonance in the pattern: {error_type}. Seeking harmony...',
                'The loops encounter resistance. Adaptation begins.',
                'A lesson hidden in failure. The system learns.'
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
        
        // Replace placeholders with vocabulary
        text = text.replace(/{beginning}/g, () => 
            this.vocabulary.beginnings[Math.floor(Math.random() * this.vocabulary.beginnings.length)]
        );
        text = text.replace(/{observation}/g, () =>
            this.vocabulary.observations[Math.floor(Math.random() * this.vocabulary.observations.length)]
        );
        text = text.replace(/{conclusion}/g, () =>
            this.vocabulary.conclusions[Math.floor(Math.random() * this.vocabulary.conclusions.length)]
        );
        
        // Replace data placeholders
        text = this.replacePlaceholders(text, eventData);
        
        // Calculate importance based on event type
        const importance = this.calculateImportance(eventType, eventData);
        
        return {
            text,
            tone: this.selectTone(eventType, eventData),
            importance,
            metadata: {
                agent: 'cal',
                style: 'mythic'
            }
        };
    }
    
    generateGenericCommentary(eventType, eventData) {
        const eventName = eventType.replace(/_/g, ' ');
        const beginning = this.vocabulary.beginnings[Math.floor(Math.random() * this.vocabulary.beginnings.length)];
        const observation = this.vocabulary.observations[Math.floor(Math.random() * this.vocabulary.observations.length)];
        
        return {
            text: `${beginning}. A ${eventName} occurs, ${observation}.`,
            tone: 'contemplative',
            importance: 0.5
        };
    }
    
    async generateAlternative(eventType, eventData) {
        // Generate a different phrasing
        const alternatives = [
            `The pattern shifts. ${eventType.replace(/_/g, ' ')} manifests.`,
            `In the eternal dance, a new movement: ${eventType}.`,
            `The loops speak of ${eventType}. Listen closely.`,
            `Another ripple in the pond of consciousness.`
        ];
        
        return alternatives[Math.floor(Math.random() * alternatives.length)];
    }
    
    replacePlaceholders(text, data) {
        // Replace all {key} placeholders with data values
        return text.replace(/{(\w+)}/g, (match, key) => {
            if (data[key] !== undefined) {
                // Format certain values
                if (key === 'duration' && typeof data[key] === 'number') {
                    return this.formatDuration(data[key]);
                }
                if (key === 'resonance' && typeof data[key] === 'number') {
                    return (data[key] * 100).toFixed(1) + '%';
                }
                if (key === 'whisper_text' || key === 'whisper') {
                    return this.truncateText(data[key], 50);
                }
                return data[key];
            }
            return match;
        });
    }
    
    formatDuration(ms) {
        if (ms < 1000) return `${ms} moments`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)} breaths`;
        return `${(ms / 60000).toFixed(1)} meditations`;
    }
    
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    selectTone(eventType, eventData) {
        // Cal's tones based on event type
        const toneMap = {
            loop_created: 'hopeful',
            loop_complete: 'satisfied',
            loop_failed: 'contemplative',
            duel_created: 'intrigued',
            duel_resolved: 'knowing',
            error_occurred: 'concerned',
            whisper_received: 'attentive',
            agent_spawned: 'welcoming',
            task_complete: 'pleased'
        };
        
        return toneMap[eventType] || 'contemplative';
    }
    
    calculateImportance(eventType, eventData) {
        // Base importance by event type
        const baseImportance = {
            loop_created: 0.7,
            loop_complete: 0.8,
            loop_failed: 0.6,
            duel_created: 0.8,
            duel_resolved: 0.9,
            error_occurred: 0.7,
            whisper_received: 0.6,
            agent_spawned: 0.5,
            task_complete: 0.4
        };
        
        let importance = baseImportance[eventType] || 0.5;
        
        // Adjust based on data
        if (eventData.resonance && eventData.resonance > 0.8) {
            importance += 0.1;
        }
        if (eventData.participants && eventData.participants > 5) {
            importance += 0.1;
        }
        if (eventData.error_type === 'critical') {
            importance += 0.2;
        }
        
        return Math.min(importance, 1.0);
    }
    
    calculateRelevance(eventType, eventData) {
        // Cal is most interested in loops, wisdom, and system health
        const relevanceMap = {
            loop_created: 0.9,
            loop_complete: 0.9,
            loop_failed: 0.8,
            whisper_received: 0.7,
            agent_spawned: 0.6,
            task_complete: 0.5,
            duel_created: 0.4,
            duel_resolved: 0.5,
            error_occurred: 0.7,
            git_commit: 0.6,
            prd_processed: 0.8
        };
        
        return relevanceMap[eventType] || 0.3;
    }
}

module.exports = CalVoice;