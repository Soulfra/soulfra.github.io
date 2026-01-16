// Tone Diffuser - Spreads prompts across multiple tonal variations
class ToneDiffuser {
    constructor() {
        this.diffusionStrength = 0.8; // 0-1, higher = more diffusion
        this.toneSpectrum = this.initializeToneSpectrum();
        this.harmonics = new Map();
    }

    initializeToneSpectrum() {
        return {
            formal: {
                weight: 1.0,
                markers: ['therefore', 'moreover', 'consequently', 'pursuant to'],
                structure: 'complex',
                vocabulary: 'advanced'
            },
            
            casual: {
                weight: 0.8,
                markers: ['so', 'like', 'anyway', 'basically'],
                structure: 'simple',
                vocabulary: 'common'
            },
            
            technical: {
                weight: 0.9,
                markers: ['specifically', 'technically', 'functionally', 'algorithmically'],
                structure: 'precise',
                vocabulary: 'domain-specific'
            },
            
            poetic: {
                weight: 0.7,
                markers: ['perhaps', 'whence', 'thus', 'whereby'],
                structure: 'flowing',
                vocabulary: 'metaphorical'
            },
            
            minimalist: {
                weight: 0.6,
                markers: [],
                structure: 'bare',
                vocabulary: 'essential'
            },
            
            verbose: {
                weight: 1.2,
                markers: ['additionally', 'furthermore', 'it should be noted that', 'one might consider'],
                structure: 'elaborate',
                vocabulary: 'expansive'
            }
        };
    }

    diffusePrompt(prompt, targetTones = null) {
        // Select tones to diffuse across
        const selectedTones = targetTones || this.selectTonesForDiffusion();
        
        // Generate harmonic variations
        const variations = selectedTones.map(tone => {
            return {
                tone: tone,
                variation: this.applyTone(prompt, tone),
                harmonic: this.generateHarmonic(prompt, tone),
                weight: this.toneSpectrum[tone].weight
            };
        });
        
        // Blend variations based on diffusion strength
        const diffused = this.blendVariations(variations);
        
        // Store harmonic fingerprint
        this.storeHarmonics(prompt, diffused);
        
        return {
            original: prompt,
            diffused: diffused,
            variations: variations,
            entropy: this.calculateTonalEntropy(variations)
        };
    }

    selectTonesForDiffusion() {
        const allTones = Object.keys(this.toneSpectrum);
        const numTones = Math.ceil(allTones.length * this.diffusionStrength);
        
        // Randomly select tones
        const selected = [];
        const available = [...allTones];
        
        for (let i = 0; i < numTones; i++) {
            const index = Math.floor(Math.random() * available.length);
            selected.push(available.splice(index, 1)[0]);
        }
        
        return selected;
    }

    applyTone(prompt, toneName) {
        const tone = this.toneSpectrum[toneName];
        let modified = prompt;
        
        // Apply structural changes
        modified = this.applyStructure(modified, tone.structure);
        
        // Apply vocabulary changes
        modified = this.applyVocabulary(modified, tone.vocabulary);
        
        // Insert tone markers
        if (tone.markers.length > 0) {
            const marker = tone.markers[Math.floor(Math.random() * tone.markers.length)];
            modified = this.insertMarker(modified, marker);
        }
        
        // Apply weight transformation
        modified = this.applyWeight(modified, tone.weight);
        
        return modified;
    }

    applyStructure(text, structure) {
        switch (structure) {
            case 'complex':
                // Add subordinate clauses
                return text.replace(/\./g, ', which is to say,');
                
            case 'simple':
                // Break into shorter sentences
                return text.replace(/,/g, '.').replace(/which|that/g, '');
                
            case 'precise':
                // Add specificity
                return text.replace(/thing/gi, 'component')
                           .replace(/stuff/gi, 'material')
                           .replace(/do/gi, 'execute');
                
            case 'flowing':
                // Add rhythm
                return text.replace(/\s+/g, () => Math.random() > 0.8 ? ' — ' : ' ');
                
            case 'bare':
                // Remove unnecessary words
                return text.replace(/very|really|quite|rather/gi, '')
                           .replace(/\s+/g, ' ');
                
            case 'elaborate':
                // Expand phrases
                return text.replace(/is/g, 'can be characterized as')
                           .replace(/has/g, 'is in possession of');
                
            default:
                return text;
        }
    }

    applyVocabulary(text, vocabType) {
        const replacements = {
            advanced: {
                'use': 'utilize',
                'get': 'obtain',
                'show': 'demonstrate',
                'need': 'require',
                'help': 'assist'
            },
            common: {
                'utilize': 'use',
                'obtain': 'get',
                'demonstrate': 'show',
                'require': 'need',
                'assist': 'help'
            },
            'domain-specific': {
                'process': 'algorithm',
                'save': 'persist',
                'check': 'validate',
                'run': 'execute',
                'fix': 'debug'
            },
            metaphorical: {
                'create': 'birth',
                'destroy': 'unmake',
                'connect': 'weave',
                'separate': 'cleave',
                'transform': 'transmute'
            },
            essential: {
                'utilize': 'use',
                'approximately': 'about',
                'terminate': 'end',
                'commence': 'start',
                'purchase': 'buy'
            },
            expansive: {
                'big': 'substantially large',
                'small': 'diminutive in size',
                'fast': 'with considerable velocity',
                'slow': 'at a leisurely pace',
                'good': 'of exceptional quality'
            }
        };
        
        const vocab = replacements[vocabType] || {};
        let modified = text;
        
        Object.entries(vocab).forEach(([original, replacement]) => {
            const regex = new RegExp(`\\b${original}\\b`, 'gi');
            modified = modified.replace(regex, replacement);
        });
        
        return modified;
    }

    insertMarker(text, marker) {
        const sentences = text.split('. ');
        if (sentences.length > 1) {
            const insertPoint = Math.floor(Math.random() * (sentences.length - 1)) + 1;
            sentences[insertPoint] = `${marker}, ${sentences[insertPoint].toLowerCase()}`;
        }
        return sentences.join('. ');
    }

    applyWeight(text, weight) {
        if (weight > 1) {
            // Expand text
            return text + ` To elaborate further, ${text.toLowerCase()}`;
        } else if (weight < 1) {
            // Compress text
            const words = text.split(' ');
            const keepRatio = weight;
            return words.filter(() => Math.random() < keepRatio).join(' ');
        }
        return text;
    }

    generateHarmonic(prompt, tone) {
        // Create a unique harmonic signature for this prompt-tone combination
        const words = prompt.split(' ');
        const toneData = this.toneSpectrum[tone];
        
        const harmonic = {
            frequency: words.length * toneData.weight,
            amplitude: prompt.length / 100,
            phase: this.hashString(prompt + tone) % 360,
            resonance: Math.random()
        };
        
        return harmonic;
    }

    blendVariations(variations) {
        if (variations.length === 0) return '';
        if (variations.length === 1) return variations[0].variation;
        
        // Weighted blend of variations
        const totalWeight = variations.reduce((sum, v) => sum + v.weight, 0);
        
        // Take weighted portions from each variation
        const blended = variations.map(v => {
            const portion = v.weight / totalWeight;
            const words = v.variation.split(' ');
            const takeCount = Math.ceil(words.length * portion);
            return words.slice(0, takeCount).join(' ');
        }).join(' ');
        
        // Apply smoothing
        return this.smoothTransitions(blended);
    }

    smoothTransitions(text) {
        // Remove duplicate words at boundaries
        const words = text.split(' ');
        const smoothed = [words[0]];
        
        for (let i = 1; i < words.length; i++) {
            if (words[i].toLowerCase() !== words[i-1].toLowerCase()) {
                smoothed.push(words[i]);
            }
        }
        
        return smoothed.join(' ');
    }

    calculateTonalEntropy(variations) {
        // Measure the disorder/variety in tonal variations
        const harmonics = variations.map(v => v.harmonic);
        
        const avgFreq = harmonics.reduce((sum, h) => sum + h.frequency, 0) / harmonics.length;
        const variance = harmonics.reduce((sum, h) => sum + Math.pow(h.frequency - avgFreq, 2), 0) / harmonics.length;
        
        return {
            entropy: Math.sqrt(variance),
            coherence: 1 / (1 + variance),
            resonance: harmonics.reduce((sum, h) => sum + h.resonance, 0) / harmonics.length
        };
    }

    storeHarmonics(original, diffused) {
        const key = this.hashString(original);
        
        this.harmonics.set(key, {
            timestamp: Date.now(),
            original: original,
            diffused: diffused,
            spectrum: this.analyzeSpectrum(diffused)
        });
        
        // Limit cache size
        if (this.harmonics.size > 1000) {
            const oldestKey = this.harmonics.keys().next().value;
            this.harmonics.delete(oldestKey);
        }
    }

    analyzeSpectrum(text) {
        // Analyze tonal spectrum of text
        const spectrum = {};
        
        Object.entries(this.toneSpectrum).forEach(([tone, data]) => {
            let score = 0;
            
            // Check for tone markers
            data.markers.forEach(marker => {
                if (text.toLowerCase().includes(marker)) {
                    score += 0.25;
                }
            });
            
            // Check vocabulary alignment
            const words = text.split(' ');
            const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
            
            if (data.vocabulary === 'advanced' && avgWordLength > 6) score += 0.25;
            if (data.vocabulary === 'common' && avgWordLength < 5) score += 0.25;
            
            spectrum[tone] = Math.min(score, 1);
        });
        
        return spectrum;
    }

    reverseDiffusion(diffusedText) {
        // Attempt to extract original prompt (lossy process)
        // This is intentionally imperfect to maintain obfuscation
        
        // Find cached harmonic
        let original = null;
        
        for (const [key, data] of this.harmonics.entries()) {
            if (data.diffused.includes(diffusedText.substring(0, 50))) {
                original = data.original;
                break;
            }
        }
        
        if (!original) {
            // Attempt reconstruction
            original = this.reconstructFromDiffused(diffusedText);
        }
        
        return original;
    }

    reconstructFromDiffused(text) {
        // Basic reconstruction - remove obvious markers and normalize
        let reconstructed = text;
        
        // Remove all tone markers
        Object.values(this.toneSpectrum).forEach(tone => {
            tone.markers.forEach(marker => {
                reconstructed = reconstructed.replace(new RegExp(marker + ',?\\s*', 'gi'), '');
            });
        });
        
        // Normalize vocabulary
        reconstructed = this.applyVocabulary(reconstructed, 'common');
        
        // Clean up
        reconstructed = reconstructed.replace(/\s+/g, ' ').trim();
        
        return reconstructed;
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

    setDiffusionStrength(strength) {
        this.diffusionStrength = Math.max(0, Math.min(1, strength));
    }

    getTonalFingerprint(text) {
        return {
            spectrum: this.analyzeSpectrum(text),
            entropy: this.calculateTonalEntropy([{
                harmonic: {
                    frequency: text.length,
                    amplitude: 1,
                    phase: 0,
                    resonance: 0.5
                }
            }])
        };
    }
}

module.exports = ToneDiffuser;