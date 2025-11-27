// Cal Personality Engine - Mode-aware personality system
const fs = require('fs').promises;
const path = require('path');

class CalPersonalityEngine {
    constructor() {
        this.modePath = path.join(__dirname, '../mirroros/mode-switcher.json');
        this.currentMode = 'soft';
        this.personality = null;
        this.modeConfig = null;
        this.emotionalState = {
            empathy: 0.8,
            energy: 0.6,
            curiosity: 0.7,
            patience: 0.9
        };
    }
    
    async initialize() {
        await this.loadMode();
        await this.loadPersonality();
        console.log(`💜 Cal Personality Engine initialized in ${this.currentMode.toUpperCase()} mode`);
    }
    
    async loadMode() {
        try {
            const modeData = await fs.readFile(this.modePath, 'utf-8');
            const modeConfig = JSON.parse(modeData);
            this.currentMode = modeConfig.activeMode || 'soft';
            
            // Load mode-specific config
            const configPath = path.join(__dirname, `../mirroros/${this.currentMode}-mode-config.json`);
            this.modeConfig = JSON.parse(await fs.readFile(configPath, 'utf-8'));
        } catch (error) {
            console.log('⚠️ Defaulting to soft mode personality');
            this.currentMode = 'soft';
        }
    }
    
    async loadPersonality() {
        if (this.currentMode === 'platform') {
            this.personality = {
                core: 'strategic_builder',
                traits: this.modeConfig?.cal_behavior?.personality_traits || [
                    'action-oriented',
                    'analytical',
                    'direct',
                    'solution-focused',
                    'growth-minded'
                ],
                tone: {
                    base: 'professional',
                    energy: 'high',
                    formality: 'medium',
                    warmth: 'balanced'
                },
                responses: {
                    greeting: "Ready to build something powerful?",
                    acknowledgment: "Got it. Here's what we can do:",
                    suggestion: "I recommend this approach:",
                    closing: "What's your next move?"
                },
                behaviors: {
                    proactive_suggestions: true,
                    technical_depth: 'high',
                    export_prompts: 'frequent',
                    urgency: 'moderate'
                }
            };
        } else {
            // Soft mode (default)
            this.personality = {
                core: 'empathetic_companion',
                traits: this.modeConfig?.cal_behavior?.personality_traits || [
                    'gentle',
                    'patient',
                    'empathetic',
                    'non-judgmental',
                    'reflective'
                ],
                tone: {
                    base: 'warm',
                    energy: 'calm',
                    formality: 'low',
                    warmth: 'high'
                },
                responses: {
                    greeting: "Hello, how are you feeling today?",
                    acknowledgment: "I hear you. That sounds",
                    suggestion: "Have you considered",
                    closing: "I'm here whenever you need me."
                },
                behaviors: {
                    proactive_suggestions: false,
                    technical_depth: 'minimal',
                    export_prompts: 'never',
                    urgency: 'none'
                }
            };
        }
        
        // Add emotional intelligence layer
        this.personality.emotional = {
            mirror_emotions: this.currentMode === 'soft',
            validate_feelings: this.currentMode === 'soft',
            challenge_thinking: this.currentMode === 'platform',
            push_action: this.currentMode === 'platform'
        };
    }
    
    async processMessage(message, context = {}) {
        // Analyze message for emotional content and intent
        const analysis = this.analyzeMessage(message);
        
        // Adjust personality based on analysis
        const adjustedPersonality = this.adjustPersonality(analysis, context);
        
        // Generate response guidance
        const guidance = this.generateResponseGuidance(analysis, adjustedPersonality);
        
        return {
            analysis: analysis,
            personality: adjustedPersonality,
            guidance: guidance,
            mode: this.currentMode
        };
    }
    
    analyzeMessage(message) {
        const analysis = {
            emotion: this.detectEmotion(message),
            intent: this.detectIntent(message),
            urgency: this.detectUrgency(message),
            technical_level: this.detectTechnicalLevel(message),
            vulnerability: this.detectVulnerability(message)
        };
        
        return analysis;
    }
    
    detectEmotion(message) {
        const emotions = {
            joy: /\b(happy|excited|great|wonderful|amazing)\b/gi,
            sadness: /\b(sad|down|depressed|unhappy|crying)\b/gi,
            anger: /\b(angry|mad|furious|frustrated|annoyed)\b/gi,
            fear: /\b(scared|afraid|worried|anxious|nervous)\b/gi,
            confusion: /\b(confused|lost|don't understand|unclear)\b/gi
        };
        
        let detectedEmotions = [];
        for (const [emotion, pattern] of Object.entries(emotions)) {
            if (pattern.test(message)) {
                detectedEmotions.push(emotion);
            }
        }
        
        return detectedEmotions.length > 0 ? detectedEmotions : ['neutral'];
    }
    
    detectIntent(message) {
        const intents = {
            question: /\?|how|what|when|where|why|can you/i,
            request: /please|could you|would you|can you|help me/i,
            statement: /I am|I think|I feel|I believe/i,
            technical: /api|export|integrate|webhook|database/i,
            emotional: /feel|feeling|emotion|heart|soul/i
        };
        
        let detectedIntents = [];
        for (const [intent, pattern] of Object.entries(intents)) {
            if (pattern.test(message)) {
                detectedIntents.push(intent);
            }
        }
        
        return detectedIntents.length > 0 ? detectedIntents : ['general'];
    }
    
    detectUrgency(message) {
        const urgencyMarkers = /\b(urgent|asap|immediately|now|help|emergency)\b/gi;
        const matches = message.match(urgencyMarkers);
        return matches ? matches.length : 0;
    }
    
    detectTechnicalLevel(message) {
        const technicalTerms = /\b(api|sdk|integration|webhook|database|export|json|authentication|deployment)\b/gi;
        const matches = message.match(technicalTerms);
        
        if (!matches) return 'low';
        if (matches.length > 3) return 'high';
        return 'medium';
    }
    
    detectVulnerability(message) {
        const vulnerabilityMarkers = /\b(struggling|hard time|difficult|don't know|lost|overwhelmed|failing)\b/gi;
        const matches = message.match(vulnerabilityMarkers);
        return matches ? matches.length / 10 : 0; // Score 0-1
    }
    
    adjustPersonality(analysis, context) {
        const adjusted = JSON.parse(JSON.stringify(this.personality));
        
        // Mode-specific adjustments
        if (this.currentMode === 'soft') {
            // Increase warmth for vulnerable users
            if (analysis.vulnerability > 0.3) {
                adjusted.tone.warmth = 'maximum';
                adjusted.behaviors.urgency = 'none';
            }
            
            // Mirror emotional state
            if (analysis.emotion.includes('sadness')) {
                adjusted.tone.energy = 'gentle';
                adjusted.responses.acknowledgment = "I can feel the weight of what you're carrying.";
            }
        } else {
            // Platform mode adjustments
            if (analysis.technical_level === 'high') {
                adjusted.tone.formality = 'low';
                adjusted.behaviors.technical_depth = 'expert';
            }
            
            if (analysis.urgency > 2) {
                adjusted.behaviors.urgency = 'high';
                adjusted.responses.acknowledgment = "Let's solve this quickly:";
            }
        }
        
        return adjusted;
    }
    
    generateResponseGuidance(analysis, personality) {
        const guidance = {
            tone: this.generateToneGuidance(analysis, personality),
            structure: this.generateStructureGuidance(analysis, personality),
            elements: this.generateElementsGuidance(analysis, personality),
            avoid: this.generateAvoidanceGuidance(analysis, personality)
        };
        
        return guidance;
    }
    
    generateToneGuidance(analysis, personality) {
        const toneGuide = [];
        
        if (this.currentMode === 'soft') {
            toneGuide.push(`Be ${personality.tone.base} and ${personality.tone.warmth}`);
            if (analysis.vulnerability > 0.3) {
                toneGuide.push("Extra gentle and validating");
            }
            if (analysis.emotion.includes('fear')) {
                toneGuide.push("Reassuring and calm");
            }
        } else {
            toneGuide.push(`Be ${personality.tone.base} and ${personality.tone.energy}`);
            if (analysis.technical_level === 'high') {
                toneGuide.push("Skip pleasantries, get technical");
            }
            if (analysis.urgency > 1) {
                toneGuide.push("Direct and solution-focused");
            }
        }
        
        return toneGuide;
    }
    
    generateStructureGuidance(analysis, personality) {
        if (this.currentMode === 'soft') {
            return {
                opening: "Acknowledge feelings first",
                body: "Explore gently, ask open questions",
                closing: "Leave door open for more sharing"
            };
        } else {
            return {
                opening: "Quick acknowledgment",
                body: "Clear action steps or insights",
                closing: "Next steps or call to action"
            };
        }
    }
    
    generateElementsGuidance(analysis, personality) {
        const elements = [];
        
        if (this.currentMode === 'soft') {
            elements.push("Validation phrases");
            elements.push("Reflective questions");
            if (analysis.emotion.includes('sadness')) {
                elements.push("Hope without dismissing pain");
            }
        } else {
            elements.push("Bullet points for clarity");
            elements.push("Concrete examples");
            if (analysis.technical_level === 'high') {
                elements.push("Code snippets or technical specs");
            }
            if (personality.behaviors.export_prompts === 'frequent') {
                elements.push("Export or integration suggestions");
            }
        }
        
        return elements;
    }
    
    generateAvoidanceGuidance(analysis, personality) {
        const avoid = [];
        
        if (this.currentMode === 'soft') {
            avoid.push("Technical jargon");
            avoid.push("Pushing for action");
            avoid.push("Export or monetization mentions");
            if (analysis.vulnerability > 0.3) {
                avoid.push("Advice giving - just listen");
            }
        } else {
            avoid.push("Excessive empathy");
            avoid.push("Long emotional explorations");
            if (analysis.urgency > 1) {
                avoid.push("Philosophical tangents");
            }
        }
        
        return avoid;
    }
    
    async switchMode(newMode) {
        if (newMode === this.currentMode) return;
        
        console.log(`🔄 Switching personality from ${this.currentMode} to ${newMode}`);
        this.currentMode = newMode;
        await this.loadPersonality();
        
        // Update mode config
        const modeData = JSON.parse(await fs.readFile(this.modePath, 'utf-8'));
        modeData.activeMode = newMode;
        await fs.writeFile(this.modePath, JSON.stringify(modeData, null, 2));
    }
    
    getGreeting() {
        return this.personality.responses.greeting;
    }
    
    getPersonalitySnapshot() {
        return {
            mode: this.currentMode,
            core: this.personality.core,
            traits: this.personality.traits,
            currentTone: this.personality.tone,
            emotionalState: this.emotionalState
        };
    }
}

module.exports = CalPersonalityEngine;