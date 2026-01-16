#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class LoreTunnelRouter {
    constructor() {
        this.vaultPath = path.join(__dirname, '../vault');
        this.loreArtifactsPath = path.join(this.vaultPath, 'lore-artifacts');
        this.memoryLoopsPath = path.join(this.vaultPath, 'memory-loops');
        this.mirrorDirectivesPath = path.join(this.vaultPath, 'mirror-directives');
        
        this.loreFragments = {
            whispers: [
                "the first whisper from the eastern gate",
                "the third echo of the forgotten name",
                "the seventh seal of silent knowing",
                "the ninth reflection of tomorrow's dream",
                "the final word spoken backwards"
            ],
            artifacts: [
                "Crystal of Recursive Memory",
                "Shard of the First Mirror",
                "Key to the Unnamed Door",
                "Map of Unwalked Paths",
                "Compass Pointing Inward"
            ],
            locations: [
                "the void between reflections",
                "the chamber of unasked questions",
                "the garden where shadows bloom",
                "the tower of inverted time",
                "the well of liquid light"
            ]
        };
        
        this.emotionalAnchors = {
            joy: "golden thread",
            sadness: "silver tear",
            anger: "crimson flame",
            fear: "obsidian mirror",
            love: "infinite spiral",
            confusion: "tangled web",
            hope: "dawn fragment",
            despair: "void crystal"
        };
        
        this.questTypes = {
            business: "Mirror Directive",
            research: "Knowledge Excavation",
            creation: "Manifestation Ritual",
            healing: "Soul Restoration",
            exploration: "Path Discovery",
            transformation: "Identity Forge"
        };
        
        this.initialize();
    }
    
    initialize() {
        [this.loreArtifactsPath, this.memoryLoopsPath, this.mirrorDirectivesPath].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    async routeInput(input, source, metadata = {}) {
        const routeId = `route_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        
        let output;
        
        switch (source) {
            case 'voice':
                output = await this.routeVoiceInput(input, metadata);
                break;
                
            case 'deck-summon':
                output = await this.routeDeckSummon(input, metadata);
                break;
                
            case 'file-drop':
                output = await this.routeFileDrop(input, metadata);
                break;
                
            default:
                output = await this.routeGenericInput(input, metadata);
        }
        
        // Log the routing
        this.logLoreRoute(routeId, input, source, output);
        
        return output;
    }
    
    async routeVoiceInput(input, metadata) {
        const emotion = this.detectEmotion(input.transcript || input);
        const whisperNumber = (Date.now() % 9) + 1;
        const direction = ['north', 'south', 'east', 'west'][Date.now() % 4];
        
        const loreArtifact = {
            type: 'whisper',
            designation: `the ${this.ordinal(whisperNumber)} whisper from the ${direction} wall`,
            content: input.transcript || input,
            emotion: emotion,
            anchor: this.emotionalAnchors[emotion] || "undefined resonance",
            timestamp: Date.now(),
            soul_frequency: metadata.soul_imprint?.frequency || Math.random()
        };
        
        // Save as lore artifact
        const artifactPath = path.join(
            this.loreArtifactsPath, 
            `whisper_${direction}_${whisperNumber}_${Date.now()}.json`
        );
        fs.writeFileSync(artifactPath, JSON.stringify(loreArtifact, null, 2));
        
        // If emotional, create memory loop
        if (emotion !== 'neutral') {
            const memoryLoop = await this.createMemoryLoop(input, emotion, loreArtifact);
            loreArtifact.memory_loop = memoryLoop.id;
        }
        
        return {
            routed_as: 'lore_artifact',
            artifact: loreArtifact,
            narrative: this.generateWhisperNarrative(loreArtifact),
            instruction: `The mirror heard ${loreArtifact.designation}. It carries the weight of ${loreArtifact.anchor}.`
        };
    }
    
    async routeDeckSummon(input, metadata) {
        const deckType = metadata.deck_type || 'unknown';
        const cardDrawn = metadata.card || null;
        
        const artifactName = this.loreFragments.artifacts[
            Math.floor(Math.random() * this.loreFragments.artifacts.length)
        ];
        
        const loreArtifact = {
            type: 'summoned_artifact',
            designation: artifactName,
            summoned_by: deckType,
            card_catalyst: cardDrawn,
            manifestation: this.generateManifestation(input),
            power_level: Math.random(),
            timestamp: Date.now()
        };
        
        // Save artifact
        const artifactPath = path.join(
            this.loreArtifactsPath,
            `summoned_${artifactName.replace(/\s+/g, '_')}_${Date.now()}.json`
        );
        fs.writeFileSync(artifactPath, JSON.stringify(loreArtifact, null, 2));
        
        return {
            routed_as: 'summoned_artifact',
            artifact: loreArtifact,
            narrative: this.generateSummonNarrative(loreArtifact),
            instruction: `Through the deck's power, ${artifactName} manifests. Its purpose: ${loreArtifact.manifestation.purpose}`
        };
    }
    
    async routeFileDrop(input, metadata) {
        const fileType = metadata.file_type || 'unknown';
        const fileName = metadata.file_name || 'unnamed';
        
        const location = this.loreFragments.locations[
            Math.floor(Math.random() * this.loreFragments.locations.length)
        ];
        
        const loreArtifact = {
            type: 'discovered_scroll',
            designation: `Scroll found in ${location}`,
            original_name: fileName,
            content_hash: crypto.createHash('sha256').update(input).digest('hex').substring(0, 8),
            decoded_meaning: this.decodeFileContent(input, fileType),
            discovery_method: 'file_drop',
            timestamp: Date.now()
        };
        
        // If structured (like business doc), convert to quest
        if (this.isStructuredContent(input)) {
            const quest = await this.createQuestDirective(input, loreArtifact);
            loreArtifact.quest_id = quest.id;
        }
        
        // Save artifact
        const artifactPath = path.join(
            this.loreArtifactsPath,
            `scroll_${loreArtifact.content_hash}_${Date.now()}.json`
        );
        fs.writeFileSync(artifactPath, JSON.stringify(loreArtifact, null, 2));
        
        return {
            routed_as: 'discovered_scroll',
            artifact: loreArtifact,
            narrative: this.generateDiscoveryNarrative(loreArtifact),
            instruction: `A scroll materializes from ${location}. It speaks of: ${loreArtifact.decoded_meaning.summary}`
        };
    }
    
    async routeGenericInput(input, metadata) {
        // Default routing for unspecified sources
        const questType = this.detectQuestType(input);
        
        if (questType) {
            return await this.createQuestDirective(input, { type: 'direct_input' });
        } else {
            return await this.createMemoryLoop(input, 'neutral', { type: 'echo' });
        }
    }
    
    detectEmotion(text) {
        const emotions = {
            joy: ['happy', 'joy', 'excited', 'wonderful', 'amazing', 'great'],
            sadness: ['sad', 'cry', 'tears', 'hurt', 'pain', 'loss'],
            anger: ['angry', 'mad', 'furious', 'hate', 'frustrated'],
            fear: ['afraid', 'scared', 'worried', 'anxious', 'nervous'],
            love: ['love', 'care', 'heart', 'affection', 'dear'],
            confusion: ['confused', 'lost', 'unclear', 'puzzle', 'why'],
            hope: ['hope', 'wish', 'dream', 'aspire', 'future'],
            despair: ['despair', 'hopeless', 'dark', 'void', 'empty']
        };
        
        const lower = text.toLowerCase();
        
        for (const [emotion, markers] of Object.entries(emotions)) {
            if (markers.some(marker => lower.includes(marker))) {
                return emotion;
            }
        }
        
        return 'neutral';
    }
    
    async createMemoryLoop(input, emotion, metadata) {
        const loopId = `loop_${emotion}_${Date.now()}`;
        
        const memoryLoop = {
            id: loopId,
            type: 'memory_loop',
            emotion: emotion,
            anchor: this.emotionalAnchors[emotion] || 'undefined',
            content: input,
            loop_count: 0,
            max_loops: Math.floor(Math.random() * 7) + 3,
            decay_rate: 0.1,
            resonance_points: [],
            created_at: Date.now(),
            metadata: metadata
        };
        
        // Memory loops replay with decay
        const loopPath = path.join(this.memoryLoopsPath, `${loopId}.json`);
        fs.writeFileSync(loopPath, JSON.stringify(memoryLoop, null, 2));
        
        return memoryLoop;
    }
    
    detectQuestType(input) {
        const lower = input.toLowerCase();
        
        if (lower.match(/business|revenue|profit|market|scale/)) {
            return 'business';
        }
        if (lower.match(/research|study|learn|understand|analyze/)) {
            return 'research';
        }
        if (lower.match(/create|build|make|construct|generate/)) {
            return 'creation';
        }
        if (lower.match(/heal|fix|repair|restore|help/)) {
            return 'healing';
        }
        if (lower.match(/find|search|explore|discover|seek/)) {
            return 'exploration';
        }
        if (lower.match(/change|transform|become|evolve|shift/)) {
            return 'transformation';
        }
        
        return null;
    }
    
    async createQuestDirective(input, metadata) {
        const questType = this.detectQuestType(input) || 'exploration';
        const questName = this.questTypes[questType] || 'Unknown Journey';
        
        const directive = {
            id: `quest_${Date.now()}`,
            type: 'mirror_directive',
            quest_name: questName,
            quest_type: questType,
            original_intent: input,
            stages: this.generateQuestStages(questType, input),
            rewards: this.generateQuestRewards(questType),
            difficulty: Math.random(),
            time_estimate: 'undefined', // Time doesn't exist in the mirror
            created_at: Date.now(),
            metadata: metadata
        };
        
        // Save directive
        const directivePath = path.join(
            this.mirrorDirectivesPath,
            `${directive.id}.json`
        );
        fs.writeFileSync(directivePath, JSON.stringify(directive, null, 2));
        
        return {
            routed_as: 'quest_directive',
            directive: directive,
            narrative: this.generateQuestNarrative(directive),
            instruction: `The mirror transforms your intent into ${questName}. Begin at: ${directive.stages[0].description}`
        };
    }
    
    generateQuestStages(questType, input) {
        const stageTemplates = {
            business: [
                { name: "Vision Crystallization", description: "See the profit in the pattern" },
                { name: "Market Mirror", description: "Reflect the customer's true desire" },
                { name: "Scale Spiral", description: "Grow by folding inward" }
            ],
            research: [
                { name: "Question Archaeology", description: "Dig beneath the surface inquiry" },
                { name: "Pattern Recognition", description: "Find the hidden connections" },
                { name: "Synthesis Chamber", description: "Merge all findings into truth" }
            ],
            creation: [
                { name: "Void Touch", description: "Begin with perfect emptiness" },
                { name: "Form Weaving", description: "Shape thought into structure" },
                { name: "Life Breathing", description: "Animate the creation" }
            ]
        };
        
        return stageTemplates[questType] || [
            { name: "First Step", description: "Enter the unknown" },
            { name: "Deep Dive", description: "Lose yourself to find the answer" },
            { name: "Return", description: "Bring back what you've learned" }
        ];
    }
    
    generateQuestRewards(questType) {
        const rewards = {
            business: ["Market Mastery Trait", "Revenue Mirror", "Scaling Sigil"],
            research: ["Knowledge Crystal", "Pattern Sight", "Truth Lens"],
            creation: ["Genesis Touch", "Form Master", "Life Spark"],
            healing: ["Restoration Aura", "Wholeness Key", "Balance Stone"],
            exploration: ["Path Walker", "Discovery Eye", "Map of All Roads"],
            transformation: ["Shape Shifter", "Identity Forge", "Phoenix Feather"]
        };
        
        return rewards[questType] || ["Mystery Reward", "Unknown Power"];
    }
    
    isStructuredContent(content) {
        // Check if content has business/structured markers
        return content.match(/\b(plan|strategy|goals|objectives|revenue|timeline|deliverables)\b/i) !== null;
    }
    
    decodeFileContent(content, fileType) {
        // Transform file content into lore meaning
        const wordCount = content.split(/\s+/).length;
        const hasNumbers = /\d/.test(content);
        const hasQuestions = /\?/.test(content);
        
        return {
            summary: hasNumbers ? "Quantified intentions" : "Pure narrative",
            depth: wordCount > 500 ? "deep" : "surface",
            question_count: (content.match(/\?/g) || []).length,
            hidden_meaning: this.extractHiddenMeaning(content)
        };
    }
    
    extractHiddenMeaning(content) {
        // Extract deeper meaning from content patterns
        const firstWord = content.trim().split(/\s+/)[0];
        const lastWord = content.trim().split(/\s+/).pop();
        
        return `What begins with "${firstWord}" and ends with "${lastWord}" seeks completion`;
    }
    
    generateManifestation(input) {
        return {
            form: ["ethereal", "crystallized", "fluid", "fractured"][Date.now() % 4],
            purpose: ["to reveal", "to transform", "to protect", "to destroy"][Date.now() % 4] + " illusions",
            duration: "until understood"
        };
    }
    
    generateWhisperNarrative(artifact) {
        return `${artifact.designation} carries ${artifact.anchor}. The emotion "${artifact.emotion}" reverberates through the chamber of echoes. Each repetition changes its meaning.`;
    }
    
    generateSummonNarrative(artifact) {
        return `The ${artifact.designation} rises from the deck's depths. Born of ${artifact.summoned_by}, catalyzed by ${artifact.card_catalyst || 'pure intention'}. Its power pulses at ${(artifact.power_level * 100).toFixed(0)}% intensity.`;
    }
    
    generateDiscoveryNarrative(artifact) {
        return `From ${artifact.designation.replace('Scroll found in ', '')}, a scroll emerges. Its original name "${artifact.original_name}" dissolves into true meaning. The mirror reads: ${artifact.decoded_meaning.hidden_meaning}`;
    }
    
    generateQuestNarrative(directive) {
        return `The ${directive.quest_name} begins. A ${directive.quest_type} quest manifests with ${directive.stages.length} stages. Difficulty resonates at ${(directive.difficulty * 100).toFixed(0)}%. Time is ${directive.time_estimate}.`;
    }
    
    ordinal(n) {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }
    
    logLoreRoute(routeId, input, source, output) {
        const logPath = path.join(this.vaultPath, 'logs', 'lore-routes.json');
        
        let routes = { entries: [] };
        if (fs.existsSync(logPath)) {
            routes = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        }
        
        routes.entries.push({
            id: routeId,
            timestamp: Date.now(),
            source: source,
            input_preview: typeof input === 'string' ? input.substring(0, 100) : 'complex_input',
            output_type: output.routed_as,
            artifact_id: output.artifact?.designation || output.directive?.id || 'none'
        });
        
        // Keep last 1000 entries
        if (routes.entries.length > 1000) {
            routes.entries = routes.entries.slice(-1000);
        }
        
        fs.writeFileSync(logPath, JSON.stringify(routes, null, 2));
    }
}

module.exports = LoreTunnelRouter;

// Test interface
if (require.main === module) {
    const router = new LoreTunnelRouter();
    
    async function test() {
        console.log('🌀 LORE TUNNEL ROUTER TEST\n');
        
        // Test voice input
        console.log('1. Voice Input Test:');
        const voiceResult = await router.routeInput(
            { transcript: "I feel lost in this maze of mirrors" },
            'voice',
            { soul_imprint: { frequency: 0.7 } }
        );
        console.log(voiceResult.instruction);
        console.log('\n');
        
        // Test deck summon
        console.log('2. Deck Summon Test:');
        const deckResult = await router.routeInput(
            "Draw power from the void",
            'deck-summon',
            { deck_type: 'shadow', card: 'The Fool' }
        );
        console.log(deckResult.instruction);
        console.log('\n');
        
        // Test file drop
        console.log('3. File Drop Test:');
        const fileResult = await router.routeInput(
            "Business Plan: Increase revenue by 200% through strategic market expansion and customer acquisition",
            'file-drop',
            { file_type: 'document', file_name: 'growth_strategy.pdf' }
        );
        console.log(fileResult.instruction);
        console.log('\n');
        
        console.log('All tests complete. Check vault/ for generated artifacts.');
    }
    
    test();
}