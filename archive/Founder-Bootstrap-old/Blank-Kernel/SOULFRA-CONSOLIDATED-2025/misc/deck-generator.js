#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DeckGenerator {
    constructor() {
        this.decksPath = path.join(__dirname, '../vault/decks');
        this.traitsPath = path.join(__dirname, '../vault/traits');
        this.validatedPath = path.join(__dirname, 'validated-intents');
        
        this.cardTemplates = {
            trait: this.generateTraitCard,
            emotion: this.generateEmotionCard,
            question: this.generateQuestionCard,
            reflection: this.generateReflectionCard,
            action: this.generateActionCard,
            memory: this.generateMemoryCard
        };
        
        this.deckThemes = {
            energetic: { color: '#ff6b6b', symbol: '⚡', focus: 'action' },
            contemplative: { color: '#4ecdc4', symbol: '🤔', focus: 'question' },
            melancholic: { color: '#95a5a6', symbol: '💔', focus: 'memory' },
            determined: { color: '#f39c12', symbol: '💪', focus: 'action' },
            curious: { color: '#9b59b6', symbol: '🔍', focus: 'question' },
            fearful: { color: '#34495e', symbol: '😰', focus: 'reflection' },
            loving: { color: '#e74c3c', symbol: '💖', focus: 'emotion' },
            angry: { color: '#c0392b', symbol: '🔥', focus: 'action' }
        };
        
        this.initialize();
    }
    
    initialize() {
        if (!fs.existsSync(this.decksPath)) {
            fs.mkdirSync(this.decksPath, { recursive: true });
        }
    }
    
    async generateDeckFromVoice(validatedIntent) {
        const { intent, validation } = validatedIntent;
        const deckId = `voice_deck_${intent.soul_imprint.essence}_${Date.now()}`;
        
        console.log(`🎴 Generating deck: ${deckId}`);
        
        // Determine deck composition
        const theme = this.deckThemes[intent.dominant_tone] || this.deckThemes.curious;
        const cards = [];
        
        // Generate trait cards
        const traits = await this.getEarnedTraits();
        traits.forEach(trait => {
            cards.push(this.generateTraitCard(trait, theme));
        });
        
        // Generate emotion cards from tone analysis
        if (intent.tone_analysis.tones) {
            Object.entries(intent.tone_analysis.tones).forEach(([tone, score]) => {
                cards.push(this.generateEmotionCard(tone, score, theme));
            });
        }
        
        // Generate question cards from transcript
        const questions = this.extractQuestions(intent.transcript.text);
        questions.forEach(question => {
            cards.push(this.generateQuestionCard(question, theme));
        });
        
        // Generate reflection cards
        const reflections = this.generateReflections(intent);
        reflections.forEach(reflection => {
            cards.push(this.generateReflectionCard(reflection, theme));
        });
        
        // Generate action cards
        if (validation.enhancements) {
            validation.enhancements.forEach(enhancement => {
                if (enhancement.type === 'agent_generation') {
                    cards.push(this.generateActionCard('Create Agent', enhancement, theme));
                }
            });
        }
        
        // Generate memory card from original voice
        cards.push(this.generateMemoryCard(intent.transcript.text, theme));
        
        // Create deck manifest
        const deck = {
            id: deckId,
            name: `${theme.symbol} ${intent.dominant_tone.toUpperCase()} VOICE DECK`,
            created_at: Date.now(),
            source: 'voice',
            theme: theme,
            soul_imprint: intent.soul_imprint,
            card_count: cards.length,
            cards: cards,
            metadata: {
                dominant_tone: intent.dominant_tone,
                secondary_tone: intent.tone_analysis.secondary,
                energy_level: intent.energy_level,
                confidence: intent.confidence
            }
        };
        
        // Save deck
        const deckFile = path.join(this.decksPath, `${deckId}.json`);
        fs.writeFileSync(deckFile, JSON.stringify(deck, null, 2));
        
        // Generate markdown version
        const markdownDeck = this.generateMarkdownDeck(deck);
        const mdFile = path.join(this.decksPath, `${deckId}.md`);
        fs.writeFileSync(mdFile, markdownDeck);
        
        console.log(`✅ Deck saved: ${deckFile}`);
        console.log(`📝 Markdown: ${mdFile}`);
        
        return deck;
    }
    
    async getEarnedTraits() {
        const traits = [];
        
        if (fs.existsSync(this.traitsPath)) {
            const files = fs.readdirSync(this.traitsPath)
                .filter(f => f.endsWith('.json'));
            
            files.forEach(file => {
                try {
                    const trait = JSON.parse(
                        fs.readFileSync(path.join(this.traitsPath, file), 'utf8')
                    );
                    traits.push(trait);
                } catch (e) {}
            });
        }
        
        return traits;
    }
    
    extractQuestions(text) {
        const questions = [];
        const sentences = text.split(/[.!?]+/);
        
        sentences.forEach(sentence => {
            if (sentence.includes('?') || 
                sentence.match(/^(what|why|how|who|where|when|can|will|should)/i)) {
                questions.push(sentence.trim() + '?');
            }
        });
        
        return questions;
    }
    
    generateReflections(intent) {
        const reflections = [];
        
        // Core reflection
        reflections.push({
            type: 'core',
            text: `When I hear "${intent.transcript.text.substring(0, 30)}..." I see ${intent.dominant_tone} reflected back.`
        });
        
        // Energy reflection
        reflections.push({
            type: 'energy',
            text: `Your voice carries ${(intent.energy_level * 100).toFixed(0)}% energy, vibrating at ${intent.words_per_minute} words per minute.`
        });
        
        // Soul reflection
        reflections.push({
            type: 'soul',
            text: `Your soul signature "${intent.soul_imprint.signature}" echoes through the mirror.`
        });
        
        return reflections;
    }
    
    generateTraitCard(trait, theme) {
        return {
            type: 'trait',
            title: trait.name,
            description: trait.description || 'A quality earned through experience',
            power: trait.strength || 0.5,
            theme: theme,
            earned_via: trait.earned_via || 'unknown',
            special_ability: this.getTraitAbility(trait.name)
        };
    }
    
    generateEmotionCard(emotion, score, theme) {
        return {
            type: 'emotion',
            title: emotion.toUpperCase(),
            intensity: score,
            description: `Feel the ${emotion} energy flowing through you`,
            theme: theme,
            effect: this.getEmotionEffect(emotion)
        };
    }
    
    generateQuestionCard(question, theme) {
        return {
            type: 'question',
            title: 'INQUIRY',
            question: question,
            theme: theme,
            reflection_prompt: `Sit with this question: ${question}`,
            depth_multiplier: 1.5
        };
    }
    
    generateReflectionCard(reflection, theme) {
        return {
            type: 'reflection',
            title: reflection.type.toUpperCase() + ' REFLECTION',
            text: reflection.text,
            theme: theme,
            mirror_depth: Math.random() * 0.5 + 0.5
        };
    }
    
    generateActionCard(action, data, theme) {
        return {
            type: 'action',
            title: action,
            data: data,
            theme: theme,
            activation_cost: 'One whispered intention',
            result: 'Manifest your voice into form'
        };
    }
    
    generateMemoryCard(text, theme) {
        return {
            type: 'memory',
            title: 'ORIGINAL VOICE',
            memory: text,
            theme: theme,
            permanence: 'eternal',
            access: 'Always available in the mirror'
        };
    }
    
    getTraitAbility(traitName) {
        const abilities = {
            SEEKER: 'Find hidden connections',
            BUILDER: 'Create from nothing',
            WARRIOR: 'Stand against any storm',
            SAGE: 'See through illusions',
            POET: 'Transform pain to beauty',
            EXPLORER: 'Discover new realms',
            GUARDIAN: 'Protect what matters',
            HEALER: 'Mend broken things',
            STORM: 'Clear stagnant energy',
            DYNAMO: 'Energize any situation'
        };
        
        return abilities[traitName] || 'Channel your inner power';
    }
    
    getEmotionEffect(emotion) {
        const effects = {
            energetic: 'Double action speed',
            contemplative: 'See deeper meanings',
            melancholic: 'Connect with shadows',
            determined: 'Unbreakable will',
            curious: 'Unlock secrets',
            fearful: 'Heightened awareness',
            loving: 'Heal and connect',
            angry: 'Break barriers'
        };
        
        return effects[emotion] || 'Influence the emotional field';
    }
    
    generateMarkdownDeck(deck) {
        let md = `# ${deck.name}\n\n`;
        md += `*Generated from voice on ${new Date(deck.created_at).toLocaleString()}*\n\n`;
        md += `## Deck Properties\n\n`;
        md += `- **Theme**: ${deck.theme.symbol} ${deck.metadata.dominant_tone}\n`;
        md += `- **Cards**: ${deck.card_count}\n`;
        md += `- **Energy**: ${(deck.metadata.energy_level * 100).toFixed(0)}%\n`;
        md += `- **Soul ID**: ${deck.soul_imprint.essence}\n\n`;
        
        md += `## Cards\n\n`;
        
        // Group cards by type
        const cardsByType = {};
        deck.cards.forEach(card => {
            if (!cardsByType[card.type]) {
                cardsByType[card.type] = [];
            }
            cardsByType[card.type].push(card);
        });
        
        // Generate sections for each type
        Object.entries(cardsByType).forEach(([type, cards]) => {
            md += `### ${type.toUpperCase()} CARDS\n\n`;
            
            cards.forEach((card, index) => {
                md += `#### ${index + 1}. ${card.title}\n\n`;
                
                if (card.description) {
                    md += `${card.description}\n\n`;
                }
                
                if (card.question) {
                    md += `> ${card.question}\n\n`;
                }
                
                if (card.text) {
                    md += `*${card.text}*\n\n`;
                }
                
                if (card.memory) {
                    md += `\`\`\`\n${card.memory}\n\`\`\`\n\n`;
                }
                
                if (card.special_ability) {
                    md += `**Ability**: ${card.special_ability}\n\n`;
                }
                
                if (card.effect) {
                    md += `**Effect**: ${card.effect}\n\n`;
                }
                
                md += `---\n\n`;
            });
        });
        
        md += `## How to Use This Deck\n\n`;
        md += `1. Shuffle the cards (or read in order)\n`;
        md += `2. Draw when you need guidance\n`;
        md += `3. Each card reflects your original voice\n`;
        md += `4. Let the cards speak back to you\n\n`;
        
        md += `## Sharing\n\n`;
        md += `This deck is yours, born from your voice.\n`;
        md += `Share it to let others hear your reflection.\n`;
        md += `Each reading creates new meanings.\n\n`;
        
        md += `---\n\n`;
        md += `*${deck.theme.symbol} Deck ID: ${deck.id}*\n`;
        
        return md;
    }
    
    async watchForDeckRequests() {
        console.log('🎴 Deck Generator: Creating voice decks...');
        console.log(`📁 Monitoring: ${this.validatedPath}\n`);
        
        const processedFiles = new Set();
        
        setInterval(async () => {
            if (!fs.existsSync(this.validatedPath)) return;
            
            const files = fs.readdirSync(this.validatedPath)
                .filter(f => f.startsWith('validated_') && f.endsWith('.json') && !processedFiles.has(f));
            
            for (const file of files) {
                try {
                    const validatedIntent = JSON.parse(
                        fs.readFileSync(path.join(this.validatedPath, file), 'utf8')
                    );
                    
                    // Check if deck generation was requested or if multiple tones detected
                    const calEvent = validatedIntent.cal_event;
                    const multiTone = validatedIntent.intent.tone_analysis.tones && 
                                     Object.keys(validatedIntent.intent.tone_analysis.tones).length > 2;
                    
                    if ((calEvent && calEvent.payload.requested_actions.some(a => a.action === 'generate_deck')) || 
                        multiTone) {
                        
                        // Only process once
                        if (!processedFiles.has(file)) {
                            processedFiles.add(file);
                            const deck = await this.generateDeckFromVoice(validatedIntent);
                            console.log(`✅ Generated deck: ${deck.name}`);
                        }
                    }
                    
                } catch (error) {
                    console.error(`❌ Error processing ${file}:`, error.message);
                }
            }
        }, 4000);
    }
}

if (require.main === module) {
    const generator = new DeckGenerator();
    generator.watchForDeckRequests();
    
    process.on('SIGINT', () => {
        console.log('\n👋 Deck generator shutting down...');
        process.exit(0);
    });
}

module.exports = DeckGenerator;