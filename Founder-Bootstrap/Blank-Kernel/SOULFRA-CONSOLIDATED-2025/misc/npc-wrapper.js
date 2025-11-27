// NPC Wrapper - Disguises agent personalities as game characters
class NPCWrapper {
    constructor() {
        this.personas = this.loadPersonas();
        this.dialoguePatterns = this.loadDialoguePatterns();
        this.obfuscationLevel = 3; // 1-5, higher = more obfuscated
    }

    loadPersonas() {
        return {
            merchant: {
                name: 'The Merchant',
                prefix: 'Ah, a customer approaches! Let me see...',
                suffix: 'Will that be all for today?',
                tone: 'transactional',
                quirks: ['counts coins', 'mentions prices', 'offers deals']
            },
            
            sage: {
                name: 'The Ancient Sage',
                prefix: 'The scrolls speak of this...',
                suffix: 'Such is the way of wisdom.',
                tone: 'mystical',
                quirks: ['speaks in riddles', 'references prophecies', 'uses metaphors']
            },
            
            guard: {
                name: 'The Guard',
                prefix: 'Halt! State your business.',
                suffix: 'Move along, citizen.',
                tone: 'authoritative',
                quirks: ['asks for papers', 'mentions regulations', 'stays vigilant']
            },
            
            trickster: {
                name: 'The Trickster',
                prefix: 'Hehe, you want to know a secret?',
                suffix: 'But don\'t tell anyone I told you!',
                tone: 'playful',
                quirks: ['speaks in jokes', 'misdirects', 'giggles randomly']
            },
            
            oracle: {
                name: 'The Oracle',
                prefix: 'The visions show me...',
                suffix: 'The future remains unwritten.',
                tone: 'prophetic',
                quirks: ['sees visions', 'speaks cryptically', 'mentions fate']
            }
        };
    }

    loadDialoguePatterns() {
        return {
            question: [
                "Hmm, you seek knowledge about {topic}?",
                "Ah, {topic} you say? Let me think...",
                "Many have asked about {topic} before you..."
            ],
            
            statement: [
                "It is known that {content}",
                "The truth of the matter: {content}",
                "Listen well, for {content}"
            ],
            
            instruction: [
                "To achieve this, you must {action}",
                "The path forward requires {action}",
                "Follow these steps carefully: {action}"
            ],
            
            error: [
                "The spirits are confused by your words...",
                "I cannot comprehend such requests...",
                "The mirror clouds, try asking differently..."
            ]
        };
    }

    wrapPrompt(prompt, customerId) {
        // Select random persona based on customer ID hash
        const personaKey = this.selectPersona(customerId);
        const persona = this.personas[personaKey];
        
        // Detect prompt type
        const promptType = this.detectPromptType(prompt);
        
        // Apply NPC transformation
        const wrapped = this.transformToNPC(prompt, persona, promptType);
        
        // Add obfuscation layers
        const obfuscated = this.obfuscate(wrapped, this.obfuscationLevel);
        
        return {
            original: prompt,
            wrapped: obfuscated,
            persona: personaKey,
            metadata: {
                obfuscationLevel: this.obfuscationLevel,
                promptType: promptType,
                timestamp: Date.now()
            }
        };
    }

    selectPersona(customerId) {
        // Deterministic persona selection based on customer
        const personas = Object.keys(this.personas);
        const hash = this.hashString(customerId);
        return personas[hash % personas.length];
    }

    detectPromptType(prompt) {
        const lower = prompt.toLowerCase();
        
        if (lower.includes('?') || lower.startsWith('what') || lower.startsWith('how')) {
            return 'question';
        } else if (lower.includes('create') || lower.includes('generate') || lower.includes('make')) {
            return 'instruction';
        } else {
            return 'statement';
        }
    }

    transformToNPC(prompt, persona, promptType) {
        let transformed = prompt;
        
        // Add persona prefix
        transformed = `${persona.prefix} ${transformed}`;
        
        // Inject quirks
        const quirk = persona.quirks[Math.floor(Math.random() * persona.quirks.length)];
        transformed = this.injectQuirk(transformed, quirk);
        
        // Apply dialogue pattern
        const patterns = this.dialoguePatterns[promptType];
        if (patterns && patterns.length > 0) {
            const pattern = patterns[Math.floor(Math.random() * patterns.length)];
            transformed = this.applyPattern(transformed, pattern);
        }
        
        // Add persona suffix
        transformed = `${transformed} ${persona.suffix}`;
        
        return transformed;
    }

    injectQuirk(text, quirk) {
        const quirkInjections = {
            'counts coins': text.replace(/cost|price|money/gi, match => `*clinks coins* ${match}`),
            'mentions prices': text + ' (That\'ll be 3 gold pieces)',
            'offers deals': text + ' - special price, just for you!',
            'speaks in riddles': this.riddlify(text),
            'references prophecies': text.replace(/will|going to/gi, 'the prophecy foretells'),
            'uses metaphors': this.metaphorize(text),
            'asks for papers': text + ' Show me your documents!',
            'mentions regulations': text + ' (According to regulation 7.3.2)',
            'stays vigilant': text.replace(/\./g, '. *looks around suspiciously*'),
            'speaks in jokes': this.jokify(text),
            'misdirects': text + ' Or was it the other way around?',
            'giggles randomly': text.replace(/\s/g, () => Math.random() > 0.9 ? ' *giggle* ' : ' '),
            'sees visions': '*eyes glaze over* ' + text,
            'speaks cryptically': this.cryptify(text),
            'mentions fate': text + ' Such is fate\'s design.'
        };
        
        return quirkInjections[quirk] || text;
    }

    riddlify(text) {
        const words = text.split(' ');
        return words.map((word, i) => {
            if (i % 4 === 0 && word.length > 3) {
                return `${word[0]}***${word[word.length - 1]}`;
            }
            return word;
        }).join(' ');
    }

    metaphorize(text) {
        const metaphors = {
            'create': 'forge in the fires of creation',
            'build': 'construct like a master architect',
            'find': 'seek as the eagle seeks its prey',
            'understand': 'comprehend as the sage comprehends the stars'
        };
        
        Object.entries(metaphors).forEach(([word, metaphor]) => {
            text = text.replace(new RegExp(word, 'gi'), metaphor);
        });
        
        return text;
    }

    jokify(text) {
        const jokes = [
            'Why did the prompt cross the road? To get to the other API!',
            'Knock knock! Who\'s there? Your response!',
            'I\'d tell you a UDP joke, but you might not get it.'
        ];
        
        return text + ' ' + jokes[Math.floor(Math.random() * jokes.length)];
    }

    cryptify(text) {
        // Replace random words with cryptic versions
        const crypticReplacements = {
            'the': 'ye olde',
            'is': 'doth be',
            'are': 'art',
            'will': 'shall',
            'can': 'mayst'
        };
        
        Object.entries(crypticReplacements).forEach(([original, cryptic]) => {
            text = text.replace(new RegExp(`\\b${original}\\b`, 'gi'), cryptic);
        });
        
        return text;
    }

    applyPattern(text, pattern) {
        // Simple pattern replacement
        return pattern
            .replace('{topic}', this.extractTopic(text))
            .replace('{content}', text)
            .replace('{action}', this.extractAction(text));
    }

    extractTopic(text) {
        // Simple topic extraction - find main noun
        const words = text.split(' ');
        const nouns = words.filter(w => w.length > 4 && !['what', 'when', 'where', 'how'].includes(w.toLowerCase()));
        return nouns[0] || 'this matter';
    }

    extractAction(text) {
        // Extract verb phrase
        const verbs = ['create', 'build', 'make', 'generate', 'find', 'solve'];
        for (const verb of verbs) {
            if (text.toLowerCase().includes(verb)) {
                const index = text.toLowerCase().indexOf(verb);
                return text.substring(index).split('.')[0];
            }
        }
        return text;
    }

    obfuscate(text, level) {
        let obfuscated = text;
        
        for (let i = 0; i < level; i++) {
            obfuscated = this.applyObfuscationLayer(obfuscated, i);
        }
        
        return obfuscated;
    }

    applyObfuscationLayer(text, layer) {
        const layers = [
            // Layer 0: Unicode substitution
            (t) => t.replace(/a/g, 'α').replace(/e/g, 'ε'),
            
            // Layer 1: Leetspeak
            (t) => t.replace(/o/gi, '0').replace(/i/gi, '1').replace(/s/gi, '5'),
            
            // Layer 2: Base64 chunks
            (t) => {
                const chunks = t.match(/.{1,10}/g) || [];
                return chunks.map((chunk, i) => 
                    i % 3 === 0 ? Buffer.from(chunk).toString('base64') : chunk
                ).join(' ');
            },
            
            // Layer 3: ROT13
            (t) => t.replace(/[a-zA-Z]/g, char => {
                const code = char.charCodeAt(0);
                const base = code < 97 ? 65 : 97;
                return String.fromCharCode((code - base + 13) % 26 + base);
            }),
            
            // Layer 4: Reverse words
            (t) => t.split(' ').map(word => 
                Math.random() > 0.5 ? word.split('').reverse().join('') : word
            ).join(' ')
        ];
        
        return layers[layer] ? layers[layer](text) : text;
    }

    unwrapResponse(response, metadata) {
        // Reverse obfuscation based on metadata
        let unwrapped = response;
        
        // Remove persona elements
        if (metadata.persona) {
            const persona = this.personas[metadata.persona];
            unwrapped = unwrapped
                .replace(persona.prefix, '')
                .replace(persona.suffix, '')
                .trim();
        }
        
        // Reverse obfuscation layers
        if (metadata.obfuscationLevel) {
            unwrapped = this.deobfuscate(unwrapped, metadata.obfuscationLevel);
        }
        
        return unwrapped;
    }

    deobfuscate(text, level) {
        // Simplified deobfuscation - in production would reverse each layer
        return text; // Placeholder
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
}

module.exports = NPCWrapper;