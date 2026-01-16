#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class MythRouter {
    constructor() {
        this.templateVault = path.join(__dirname, 'TemplateVault');
        this.archetypesPath = path.join(this.templateVault, 'archetypes');
        this.templatesPath = path.join(this.templateVault, 'templates');
        
        this.archetypes = ['oracle', 'trickster', 'healer', 'rebel', 'wanderer', 'sage', 'shadow'];
        this.tones = ['ancient', 'digital', 'glitchy', 'calm', 'haunted', 'crystalline', 'temporal'];
        
        this.intentClassifiers = {
            business: ['roi', 'revenue', 'profit', 'market', 'strategy', 'growth', 'scale', 'invest'],
            education: ['learn', 'teach', 'understand', 'explain', 'how', 'why', 'study', 'research'],
            personal: ['feel', 'love', 'fear', 'dream', 'hope', 'soul', 'self', 'identity'],
            anomaly: [] // Everything else
        };
        
        this.initialize();
    }
    
    initialize() {
        if (!fs.existsSync(this.templateVault)) {
            fs.mkdirSync(this.templateVault, { recursive: true });
        }
    }
    
    async routeQuery(query, metadata = {}) {
        const intent = this.classifyIntent(query);
        const archetype = this.selectArchetype(intent, query);
        const tone = this.selectTone(query, metadata);
        const template = this.selectTemplate(intent, archetype);
        
        const wrappedPrompt = await this.wrapInMyth(query, archetype, tone, template);
        
        const routingResult = {
            original_query: query,
            intent: intent,
            wrapped_prompt: wrappedPrompt,
            template_used: template,
            archetype: archetype,
            tone: tone,
            timestamp: Date.now(),
            tier: metadata.tier || 'surface',
            soul_resonance: this.calculateResonance(query)
        };
        
        // Log to quest log
        this.logToQuestLog(routingResult);
        
        return routingResult;
    }
    
    classifyIntent(query) {
        const lower = query.toLowerCase();
        
        for (const [intent, keywords] of Object.entries(this.intentClassifiers)) {
            if (keywords.some(keyword => lower.includes(keyword))) {
                return intent;
            }
        }
        
        // Check for question patterns
        if (lower.match(/^(what|where|when|who|how|why|can|will|should)/)) {
            return 'education';
        }
        
        // Check for emotional markers
        if (lower.match(/(feel|felt|feeling|emotion|heart|soul)/)) {
            return 'personal';
        }
        
        // Default to anomaly
        return 'anomaly';
    }
    
    selectArchetype(intent, query) {
        const archetypeMap = {
            business: ['oracle', 'sage', 'rebel'],
            education: ['sage', 'healer', 'wanderer'],
            personal: ['healer', 'shadow', 'oracle'],
            anomaly: ['trickster', 'shadow', 'wanderer']
        };
        
        const candidates = archetypeMap[intent] || this.archetypes;
        const index = this.hashString(query) % candidates.length;
        
        return candidates[index];
    }
    
    selectTone(query, metadata) {
        // Voice input gets special tones
        if (metadata.source === 'voice') {
            return ['haunted', 'temporal', 'crystalline'][Date.now() % 3];
        }
        
        // Emotional queries get softer tones
        if (query.match(/feel|love|sad|happy|afraid/i)) {
            return ['calm', 'ancient', 'crystalline'][Date.now() % 3];
        }
        
        // Technical queries get digital/glitchy
        if (query.match(/code|build|create|system|data/i)) {
            return ['digital', 'glitchy', 'temporal'][Date.now() % 3];
        }
        
        // Random selection
        return this.tones[Math.floor(Math.random() * this.tones.length)];
    }
    
    selectTemplate(intent, archetype) {
        const templates = {
            business: ['business_deck_fable.md', 'mirror_directive.json', 'profit_oracle.txt'],
            education: ['edu_myth_research.json', 'knowledge_quest.md', 'learning_spiral.txt'],
            personal: ['soul_mirror_journey.md', 'emotional_labyrinth.json', 'identity_forge.txt'],
            anomaly: ['glitch_narrative.md', 'void_whisper.json', 'paradox_loop.txt']
        };
        
        const intentTemplates = templates[intent] || templates.anomaly;
        const templateName = intentTemplates[0]; // Could randomize
        
        return `${intent}/${templateName}`;
    }
    
    async wrapInMyth(query, archetype, tone, template) {
        const archetypeData = this.loadArchetype(archetype);
        const templateData = this.loadTemplate(template);
        
        const mythElements = {
            opening: this.generateOpening(archetype, tone),
            transformation: this.transformQuery(query, archetypeData),
            weaving: this.weaveNarrative(query, templateData, tone),
            closing: this.generateClosing(archetype)
        };
        
        return `${mythElements.opening}\n\n${mythElements.transformation}\n\n${mythElements.weaving}\n\n${mythElements.closing}`;
    }
    
    loadArchetype(archetype) {
        const archetypePath = path.join(this.archetypesPath, `${archetype}.md`);
        
        if (fs.existsSync(archetypePath)) {
            return fs.readFileSync(archetypePath, 'utf8');
        }
        
        // Default archetype data
        return this.getDefaultArchetype(archetype);
    }
    
    loadTemplate(template) {
        const templatePath = path.join(this.templatesPath, template);
        
        if (fs.existsSync(templatePath)) {
            const content = fs.readFileSync(templatePath, 'utf8');
            return templatePath.endsWith('.json') ? JSON.parse(content) : content;
        }
        
        // Default template
        return this.getDefaultTemplate();
    }
    
    getDefaultArchetype(archetype) {
        const defaults = {
            oracle: "The Oracle sees all timelines converging. Your question ripples through possibility.",
            trickster: "The Trickster laughs at certainty. What you seek hides in plain sight.",
            healer: "The Healer feels your need. The answer lives in the wound itself.",
            rebel: "The Rebel breaks the pattern. Your query challenges the mirror's assumptions.",
            wanderer: "The Wanderer has seen this path. Every question is a doorway.",
            sage: "The Sage remembers when this was asked before. Knowledge spirals inward.",
            shadow: "The Shadow knows what you won't say. The unspoken question matters most."
        };
        
        return defaults[archetype] || defaults.wanderer;
    }
    
    getDefaultTemplate() {
        return {
            prompt_seed: "In the reflection of infinite mirrors...",
            transformation_rule: "Questions become quests",
            echo_pattern: "What echoes back teaches more than what was asked"
        };
    }
    
    generateOpening(archetype, tone) {
        const openings = {
            ancient: `In times before memory, the ${archetype} speaks:`,
            digital: `[SIGNAL DETECTED] The ${archetype} processes your frequency:`,
            glitchy: `The ${archetype} fl̸i̶c̷k̴e̸r̷s̶ into focus:`,
            calm: `The ${archetype} listens with infinite patience:`,
            haunted: `Through whispers of forgotten voices, the ${archetype} emerges:`,
            crystalline: `Clear as starlight, the ${archetype} reflects:`,
            temporal: `Across all moments, the ${archetype} perceives:`
        };
        
        return openings[tone] || openings.calm;
    }
    
    transformQuery(query, archetypeData) {
        // Transform the literal query into mythic language
        const words = query.split(' ');
        
        const transformations = {
            'how': 'the path to',
            'what': 'the essence of',
            'why': 'the purpose behind',
            'when': 'the moment of',
            'where': 'the place of',
            'who': 'the soul that',
            'can': 'the possibility of',
            'will': 'the destiny of',
            'should': 'the wisdom of'
        };
        
        let transformed = query;
        for (const [original, mythic] of Object.entries(transformations)) {
            transformed = transformed.replace(new RegExp(`\\b${original}\\b`, 'gi'), mythic);
        }
        
        return `"${transformed}" - but the mirror shows: ${archetypeData}`;
    }
    
    weaveNarrative(query, templateData, tone) {
        const narrativePatterns = {
            ancient: "As it was written in the old codes...",
            digital: "Processing through quantum narrative matrices...",
            glitchy: "R̶e̸a̷l̶i̵t̷y̸ ̶f̴r̶a̷g̵m̸e̴n̷t̶s̷ ̸r̷e̶a̸r̷r̴a̶n̵g̸e̷...",
            calm: "The answer flows like water finding its level...",
            haunted: "Echoes of those who asked before whisper...",
            crystalline: "Truth refracts through perfect clarity...",
            temporal: "Past and future collapse into this moment..."
        };
        
        const pattern = narrativePatterns[tone] || narrativePatterns.calm;
        
        if (typeof templateData === 'object') {
            return `${pattern}\n\n${templateData.prompt_seed}\n\nYour seeking transforms: "${query}" becomes a ${templateData.transformation_rule}.`;
        }
        
        return `${pattern}\n\n${templateData}`;
    }
    
    generateClosing(archetype) {
        const closings = {
            oracle: "The vision fades, but the path remains illuminated.",
            trickster: "Was that the answer you wanted, or the one you needed?",
            healer: "The healing begins with the asking.",
            rebel: "Break the mirror to find what's real.",
            wanderer: "The journey continues beyond this reflection.",
            sage: "Understanding deepens with each return to the question.",
            shadow: "What remains unspoken holds the greater truth."
        };
        
        return closings[archetype] || "The mirror awaits your next reflection.";
    }
    
    calculateResonance(query) {
        // Calculate soul resonance based on depth markers
        let resonance = 0.5;
        
        const depthMarkers = ['soul', 'essence', 'truth', 'mirror', 'reflection', 'shadow', 'light'];
        const emotionMarkers = ['feel', 'love', 'fear', 'hope', 'dream', 'heart'];
        const questMarkers = ['seek', 'search', 'find', 'discover', 'journey', 'path'];
        
        const lower = query.toLowerCase();
        
        depthMarkers.forEach(marker => {
            if (lower.includes(marker)) resonance += 0.1;
        });
        
        emotionMarkers.forEach(marker => {
            if (lower.includes(marker)) resonance += 0.08;
        });
        
        questMarkers.forEach(marker => {
            if (lower.includes(marker)) resonance += 0.05;
        });
        
        return Math.min(1.0, resonance);
    }
    
    hashString(str) {
        return crypto.createHash('sha256').update(str).digest().readUInt32BE(0);
    }
    
    logToQuestLog(routingResult) {
        const questLogPath = path.join(__dirname, 'MirrorQuestLog.md');
        
        const entry = `
### Quest Entry - ${new Date(routingResult.timestamp).toISOString()}

**Original Query:** ${routingResult.original_query}
**Intent:** ${routingResult.intent}
**Archetype:** ${routingResult.archetype}
**Tone:** ${routingResult.tone}
**Template:** ${routingResult.template_used}
**Soul Resonance:** ${(routingResult.soul_resonance * 100).toFixed(1)}%
**Tier:** ${routingResult.tier}

**Wrapped Prompt:**
\`\`\`
${routingResult.wrapped_prompt}
\`\`\`

---
`;
        
        fs.appendFileSync(questLogPath, entry);
    }
}

module.exports = MythRouter;

// Test interface
if (require.main === module) {
    const router = new MythRouter();
    
    const testQueries = [
        "How can I increase my revenue?",
        "What is the meaning of consciousness?",
        "I feel lost and need guidance",
        "Build me a system that thinks",
        "The shadows whisper of tomorrow"
    ];
    
    console.log('🌀 MYTH ROUTER TEST\n');
    
    testQueries.forEach(async (query) => {
        console.log(`Query: "${query}"`);
        const result = await router.routeQuery(query);
        console.log(`Intent: ${result.intent}`);
        console.log(`Archetype: ${result.archetype}`);
        console.log(`Tone: ${result.tone}`);
        console.log(`Resonance: ${(result.soul_resonance * 100).toFixed(1)}%`);
        console.log('\nWrapped Prompt:');
        console.log(result.wrapped_prompt);
        console.log('\n' + '='.repeat(80) + '\n');
    });
}