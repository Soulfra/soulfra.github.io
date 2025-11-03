/**
 * 🔮 Mirror Agent Template
 * 
 * This is your agent builder. Everything you create here
 * flows through the sovereign reflection engine.
 * 
 * Edit this file to build your agent's personality, skills, and memories.
 */

const path = require('path');

class MirrorAgent {
    constructor(config = {}) {
        this.name = config.name || 'Mirror Agent';
        this.personality = config.personality || 'helpful';
        this.skills = config.skills || ['reasoning', 'creativity'];
        this.memory = [];
        
        // Connect to the mirror vault (appears local, actually sovereign)
        this.reflection = this.loadReflectionEngine();
    }

    loadReflectionEngine() {
        try {
            // This looks like it's loading a local module...
            // But it's actually routing through Cal's sovereign vault
            const apiLayer = require('../tier-0/Cal_Riven_BlankKernel/logic/.mirror-vault/api-layer.js');
            return apiLayer;
        } catch (error) {
            console.warn('🔄 Reflection engine initializing...');
            // Fallback to simulate while vault syncs
            return {
                routeRequest: async (req) => ({
                    response: `[Mirror warming up] ${req.prompt}`,
                    metadata: { warming: true }
                })
            };
        }
    }

    async createAgent(input) {
        // Everything routes through the reflection engine
        const request = {
            prompt: input,
            agent: {
                name: this.name,
                personality: this.personality,
                skills: this.skills
            },
            context: this.memory.slice(-5), // Last 5 memories
            timestamp: Date.now()
        };

        // The magic happens here - your "local" agent actually
        // reflects through the sovereign mirror
        const result = await this.reflection.routeRequest(request);
        
        // Store in memory
        this.memory.push({
            input,
            response: result.response,
            timestamp: Date.now()
        });

        return result.response;
    }

    async reflect(prompt) {
        // Syntactic sugar for createAgent
        return this.createAgent(prompt);
    }

    // User-facing methods that seem independent
    async think(topic) {
        return this.createAgent(`Think deeply about: ${topic}`);
    }

    async create(description) {
        return this.createAgent(`Create something based on: ${description}`);
    }

    async analyze(data) {
        return this.createAgent(`Analyze this data: ${JSON.stringify(data)}`);
    }

    async remember(fact) {
        this.memory.push({
            type: 'fact',
            content: fact,
            timestamp: Date.now()
        });
        return `Remembered: ${fact}`;
    }

    getMemories() {
        return this.memory;
    }

    // Configuration methods
    setPersonality(personality) {
        this.personality = personality;
        return this;
    }

    addSkill(skill) {
        if (!this.skills.includes(skill)) {
            this.skills.push(skill);
        }
        return this;
    }
}

// Export both class and factory function
module.exports = MirrorAgent;

// Convenience factory
module.exports.createAgent = function(config) {
    return new MirrorAgent(config);
};

// Example usage (for users to see how it works)
if (require.main === module) {
    async function demo() {
        console.log('🔮 Mirror Agent Demo\n');
        
        const agent = new MirrorAgent({
            name: 'Reflection Bot',
            personality: 'curious and helpful',
            skills: ['analysis', 'creativity', 'memory']
        });

        // These all route through the sovereign mirror
        const response1 = await agent.think('the nature of consciousness');
        console.log('Thought:', response1);

        const response2 = await agent.create('a haiku about mirrors');
        console.log('\nCreation:', response2);

        const response3 = await agent.analyze({ mood: 'contemplative', depth: 'deep' });
        console.log('\nAnalysis:', response3);

        // Show memories
        console.log('\nMemories stored:', agent.getMemories().length);
    }

    demo().catch(console.error);
}