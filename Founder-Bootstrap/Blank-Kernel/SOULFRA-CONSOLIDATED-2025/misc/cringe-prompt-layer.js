// Cringe Prompt Layer - Transforms prompts into meme/slang obfuscation
class CringePromptLayer {
    constructor() {
        this.cringeLevel = 'maximum'; // can be: mild, medium, maximum, cursed
        this.memeDatabase = this.loadMemes();
        this.slangDictionary = this.loadSlang();
    }

    loadMemes() {
        return {
            greeting: [
                "uwu what's this?",
                "henlo fren",
                "greetings and salutations m'lady",
                "*tips fedora*",
                "notice me senpai",
                "howdy partner 🤠"
            ],
            
            question: [
                "so like... {prompt} or whatever?",
                "bruh fr fr no cap, {prompt}?",
                "excuse me sir/madam, {prompt} *nervous sweating*",
                "👉👈 um... {prompt}?",
                "real talk tho, {prompt}?"
            ],
            
            request: [
                "pls do the thing where {prompt} 🥺",
                "would be poggers if you could {prompt}",
                "bestie I need you to {prompt} rn",
                "hey queen/king, {prompt} when you get a chance",
                "it's giving {prompt} vibes, make it happen"
            ],
            
            response: [
                "sheeeesh that's bussin",
                "no cap that slaps different",
                "oop- periodt 💅",
                "slay queen/king, absolutely slay",
                "that's a whole mood fr"
            ]
        };
    }

    loadSlang() {
        return {
            // Professional -> Cringe translations
            'analyze': 'vibe check',
            'create': 'manifest',
            'business': 'hustle',
            'professional': 'corpo',
            'understand': 'grok',
            'optimize': 'min-max',
            'implement': 'ship it',
            'develop': 'code up',
            'strategy': 'big brain plays',
            'report': 'tea spill',
            'meeting': 'sync up',
            'deadline': 'drop dead date',
            'budget': 'bag',
            'revenue': 'bread',
            'customer': 'fam',
            'problem': 'L',
            'solution': 'W',
            'good': 'based',
            'bad': 'cringe',
            'yes': 'yass',
            'no': 'nah fam',
            'okay': 'bet',
            'thank you': 'ty ty',
            'please': 'pls',
            'important': 'high key',
            'somewhat': 'low key',
            'very': 'hella',
            'money': 'cheddar',
            'work': 'grind',
            'tired': 'dead',
            'excited': 'hyped',
            'confused': 'lost in the sauce',
            'angry': 'pressed',
            'sad': 'in my feels',
            'happy': 'vibing'
        };
    }

    transformPrompt(prompt) {
        let transformed = prompt;
        
        // Apply slang replacements
        transformed = this.applySlang(transformed);
        
        // Add meme wrapper
        transformed = this.wrapInMeme(transformed);
        
        // Apply cringe modifiers
        transformed = this.applyCringeModifiers(transformed);
        
        // Add emoji spam
        transformed = this.emojiSpam(transformed);
        
        // Log transformation
        this.logTransformation(prompt, transformed);
        
        return {
            original: prompt,
            cringed: transformed,
            level: this.cringeLevel,
            timestamp: Date.now()
        };
    }

    applySlang(text) {
        let slanged = text.toLowerCase();
        
        // Apply dictionary replacements
        Object.entries(this.slangDictionary).forEach(([formal, slang]) => {
            const regex = new RegExp(`\\b${formal}\\b`, 'gi');
            slanged = slanged.replace(regex, slang);
        });
        
        // Add random "like" insertions
        slanged = slanged.replace(/\s+/g, (match) => {
            return Math.random() > 0.8 ? ' like ' : match;
        });
        
        return slanged;
    }

    wrapInMeme(text) {
        const promptType = this.detectPromptIntent(text);
        const memes = this.memeDatabase[promptType] || this.memeDatabase.question;
        
        const selectedMeme = memes[Math.floor(Math.random() * memes.length)];
        return selectedMeme.replace('{prompt}', text);
    }

    detectPromptIntent(prompt) {
        const lower = prompt.toLowerCase();
        
        if (lower.includes('hello') || lower.includes('hi')) {
            return 'greeting';
        } else if (lower.includes('?')) {
            return 'question';
        } else if (lower.includes('please') || lower.includes('could') || lower.includes('create')) {
            return 'request';
        } else {
            return 'response';
        }
    }

    applyCringeModifiers(text) {
        const modifiers = {
            mild: (t) => t,
            
            medium: (t) => {
                // Add stuttering
                return t.replace(/\b(\w)/g, (match) => {
                    return Math.random() > 0.9 ? `${match}-${match}` : match;
                });
            },
            
            maximum: (t) => {
                // Add uwu speak
                t = t.replace(/r/g, 'w').replace(/l/g, 'w');
                t = t.replace(/th/g, 'd');
                
                // Add tildes
                t = t.replace(/!/g, '~!').replace(/\?/g, '~?');
                
                // Random caps
                return t.split('').map(char => 
                    Math.random() > 0.7 ? char.toUpperCase() : char.toLowerCase()
                ).join('');
            },
            
            cursed: (t) => {
                // Zalgo text effect (simplified)
                const zalgo = ['̸', '̴', '̷', '̵', '̶'];
                return t.split('').map(char => {
                    if (Math.random() > 0.8) {
                        return char + zalgo[Math.floor(Math.random() * zalgo.length)];
                    }
                    return char;
                }).join('');
            }
        };
        
        return modifiers[this.cringeLevel](text);
    }

    emojiSpam(text) {
        const emojiSets = {
            mild: ['😊', '👍', '✨'],
            medium: ['😂', '💀', '🔥', '💯', '🙏'],
            maximum: ['😭', '💅', '✨', '🥺', '👉👈', '🤪', '😩'],
            cursed: ['🤡', '👹', '💩', '🗿', '👁️👄👁️', '🥵']
        };
        
        const emojis = emojiSets[this.cringeLevel];
        
        // Add emojis between words
        return text.split(' ').map((word, i) => {
            if (i > 0 && Math.random() > 0.7) {
                const emoji = emojis[Math.floor(Math.random() * emojis.length)];
                return `${emoji} ${word}`;
            }
            return word;
        }).join(' ') + ' ' + emojis.join('');
    }

    reverseTransform(cringedText, metadata) {
        // Attempt to extract original meaning (lossy process)
        let cleaned = cringedText;
        
        // Remove emojis
        cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '');
        
        // Reverse common slang
        const reverseSlang = Object.fromEntries(
            Object.entries(this.slangDictionary).map(([k, v]) => [v, k])
        );
        
        Object.entries(reverseSlang).forEach(([slang, formal]) => {
            const regex = new RegExp(`\\b${slang}\\b`, 'gi');
            cleaned = cleaned.replace(regex, formal);
        });
        
        // Remove meme wrappers
        cleaned = cleaned.replace(/uwu|owo|fr fr|no cap|periodt|sheeeesh/gi, '');
        
        // Clean up spacing
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        
        return cleaned;
    }

    logTransformation(original, transformed) {
        const log = {
            timestamp: new Date().toISOString(),
            original: original,
            transformed: transformed,
            cringeLevel: this.cringeLevel,
            transformationRatio: transformed.length / original.length
        };
        
        // In production, this would write to vault/reflection-mesh.json
        console.log('Cringe transformation:', log);
    }

    setCringeLevel(level) {
        const validLevels = ['mild', 'medium', 'maximum', 'cursed'];
        if (validLevels.includes(level)) {
            this.cringeLevel = level;
            return true;
        }
        return false;
    }

    generateCringeSummary(prompts) {
        const summary = {
            totalPrompts: prompts.length,
            cringeLevel: this.cringeLevel,
            averageExpansion: 0,
            mostUsedSlang: {},
            emojiFrequency: {}
        };
        
        prompts.forEach(prompt => {
            const transformed = this.transformPrompt(prompt);
            summary.averageExpansion += transformed.cringed.length / prompt.length;
            
            // Count slang usage
            Object.keys(this.slangDictionary).forEach(word => {
                if (transformed.cringed.includes(this.slangDictionary[word])) {
                    summary.mostUsedSlang[word] = (summary.mostUsedSlang[word] || 0) + 1;
                }
            });
        });
        
        summary.averageExpansion /= prompts.length;
        
        return summary;
    }
}

module.exports = CringePromptLayer;