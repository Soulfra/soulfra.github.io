// Persona Detector - Adapts Cal's responses based on user state and intent
const fs = require('fs').promises;
const path = require('path');

class PersonaDetector {
    constructor() {
        this.mirrorRouterPath = path.join(__dirname, '../mirror-router.js');
        this.personaTracePath = path.join(__dirname, '../../vault/logs/persona-trace.json');
        
        this.personaProfiles = {
            overwhelmed: {
                indicators: [
                    /\b(overwhelmed|stressed|too much|can't handle|drowning)\b/i,
                    /\b(confused|lost|don't understand|help me)\b/i,
                    /\b(anxious|worried|scared|panic)\b/i
                ],
                response: {
                    pace: 'slow',
                    tone: 'calming',
                    structure: 'simple',
                    actions: ['simplify', 'reassure', 'guide']
                }
            },
            builder: {
                indicators: [
                    /\b(want to build|create|make|develop|launch)\b/i,
                    /\b(startup|product|app|business|idea)\b/i,
                    /\b(how do I|what's the best way|should I)\b/i
                ],
                response: {
                    pace: 'energetic',
                    tone: 'encouraging',
                    structure: 'actionable',
                    actions: ['suggest', 'prototype', 'export']
                }
            },
            reflective: {
                indicators: [
                    /\b(thinking about|wondering|reflecting|considering)\b/i,
                    /\b(why did|what if|looking back|learned)\b/i,
                    /\b(journey|experience|story|past)\b/i
                ],
                response: {
                    pace: 'thoughtful',
                    tone: 'deep',
                    structure: 'exploratory',
                    actions: ['reflect', 'connect', 'insight']
                }
            },
            technical: {
                indicators: [
                    /\b(code|api|function|debug|error)\b/i,
                    /\b(implement|architecture|system|database)\b/i,
                    /\b(performance|optimization|scale)\b/i
                ],
                response: {
                    pace: 'precise',
                    tone: 'informative',
                    structure: 'detailed',
                    actions: ['explain', 'demonstrate', 'solve']
                }
            },
            emotional: {
                indicators: [
                    /\b(feel|feeling|emotion|heart)\b/i,
                    /\b(lonely|sad|happy|excited|frustrated)\b/i,
                    /\b(nobody understands|alone|isolated)\b/i
                ],
                response: {
                    pace: 'gentle',
                    tone: 'empathetic',
                    structure: 'supportive',
                    actions: ['validate', 'connect', 'encourage']
                }
            },
            urgent: {
                indicators: [
                    /\b(urgent|asap|immediately|now|quick)\b/i,
                    /\b(deadline|time sensitive|emergency)\b/i,
                    /\b(need this|have to|must)\b/i
                ],
                response: {
                    pace: 'rapid',
                    tone: 'focused',
                    structure: 'direct',
                    actions: ['prioritize', 'streamline', 'execute']
                }
            }
        };
        
        this.currentSession = {
            id: this.generateSessionId(),
            detectedPersonas: [],
            dominantPersona: null,
            adaptations: [],
            messageCount: 0
        };
        
        console.log('🎭 Persona Detector initialized');
    }
    
    async detectPersona(message, context = {}) {
        const detection = {
            timestamp: new Date().toISOString(),
            message: message,
            detectedPersonas: [],
            confidence: {},
            dominantPersona: null,
            adaptations: []
        };
        
        // Check each persona profile
        for (const [persona, profile] of Object.entries(this.personaProfiles)) {
            let score = 0;
            const matches = [];
            
            // Check indicators
            for (const indicator of profile.indicators) {
                if (indicator.test(message)) {
                    score++;
                    matches.push(indicator.source);
                }
            }
            
            if (score > 0) {
                const confidence = score / profile.indicators.length;
                detection.detectedPersonas.push(persona);
                detection.confidence[persona] = confidence;
                
                if (!detection.dominantPersona || confidence > detection.confidence[detection.dominantPersona]) {
                    detection.dominantPersona = persona;
                }
            }
        }
        
        // Generate adaptations based on dominant persona
        if (detection.dominantPersona) {
            detection.adaptations = this.generateAdaptations(detection.dominantPersona, message);
        }
        
        // Update session
        this.currentSession.messageCount++;
        this.currentSession.detectedPersonas.push(detection);
        this.currentSession.dominantPersona = this.calculateSessionPersona();
        
        // Log detection
        await this.logPersonaDetection(detection);
        
        return detection;
    }
    
    generateAdaptations(persona, message) {
        const profile = this.personaProfiles[persona];
        const adaptations = [];
        
        // Response pace adaptation
        adaptations.push({
            type: 'pace',
            value: profile.response.pace,
            instruction: this.getPaceInstruction(profile.response.pace)
        });
        
        // Tone adaptation
        adaptations.push({
            type: 'tone',
            value: profile.response.tone,
            instruction: this.getToneInstruction(profile.response.tone)
        });
        
        // Structure adaptation
        adaptations.push({
            type: 'structure',
            value: profile.response.structure,
            instruction: this.getStructureInstruction(profile.response.structure)
        });
        
        // Specific actions based on persona
        profile.response.actions.forEach(action => {
            adaptations.push({
                type: 'action',
                value: action,
                instruction: this.getActionInstruction(action, persona)
            });
        });
        
        // Special cases
        if (persona === 'overwhelmed') {
            adaptations.push({
                type: 'special',
                value: 'breathing_space',
                instruction: 'Add pauses and breathing room in responses'
            });
        }
        
        if (persona === 'builder') {
            adaptations.push({
                type: 'special',
                value: 'export_suggestion',
                instruction: 'Suggest creating an exportable agent when appropriate'
            });
        }
        
        return adaptations;
    }
    
    getPaceInstruction(pace) {
        const instructions = {
            slow: 'Take time with each point. Use shorter sentences. Pause between ideas.',
            energetic: 'Match their excitement. Be dynamic and action-oriented.',
            thoughtful: 'Allow space for contemplation. Ask open-ended questions.',
            precise: 'Be exact and methodical. Provide clear technical details.',
            gentle: 'Speak softly and with care. No rushing.',
            rapid: 'Get to the point quickly. Prioritize actionable information.'
        };
        
        return instructions[pace] || 'Maintain a steady, comfortable pace.';
    }
    
    getToneInstruction(tone) {
        const instructions = {
            calming: 'Use reassuring language. Acknowledge their feelings. Provide comfort.',
            encouraging: 'Be enthusiastic and supportive. Celebrate their ambitions.',
            deep: 'Engage philosophically. Explore meanings and connections.',
            informative: 'Focus on clarity and accuracy. Teach and explain.',
            empathetic: 'Mirror their emotions. Show genuine understanding.',
            focused: 'Be direct and solution-oriented. Minimize small talk.'
        };
        
        return instructions[tone] || 'Maintain a friendly, professional tone.';
    }
    
    getStructureInstruction(structure) {
        const instructions = {
            simple: 'Break everything into small, digestible pieces. Use bullet points.',
            actionable: 'Provide clear next steps. Number your suggestions.',
            exploratory: 'Ask questions that lead to insights. Connect ideas.',
            detailed: 'Include comprehensive information. Use examples and code.',
            supportive: 'Validate first, then gently guide. No judgment.',
            direct: 'Lead with the answer. Supporting details after.'
        };
        
        return instructions[structure] || 'Structure responses clearly and logically.';
    }
    
    getActionInstruction(action, persona) {
        const instructions = {
            simplify: 'Break down complex concepts into basics',
            reassure: 'Remind them they\'re capable and not alone',
            guide: 'Provide step-by-step guidance',
            suggest: 'Offer concrete ideas and possibilities',
            prototype: 'Help them start building immediately',
            export: 'Mention agent creation when they have a clear vision',
            reflect: 'Connect their thoughts to deeper patterns',
            connect: 'Link current situation to past experiences',
            insight: 'Reveal non-obvious connections',
            explain: 'Provide technical explanations with examples',
            demonstrate: 'Show actual code or implementation',
            solve: 'Focus on fixing their specific problem',
            validate: 'Acknowledge their feelings as legitimate',
            encourage: 'Remind them of their strengths',
            prioritize: 'Help them identify what matters most',
            streamline: 'Remove unnecessary complexity',
            execute: 'Focus on immediate action items'
        };
        
        return instructions[action] || `Perform ${action} appropriately for ${persona} persona`;
    }
    
    calculateSessionPersona() {
        // Analyze all detections in current session
        const personaCounts = {};
        let totalConfidence = {};
        
        this.currentSession.detectedPersonas.forEach(detection => {
            if (detection.dominantPersona) {
                personaCounts[detection.dominantPersona] = 
                    (personaCounts[detection.dominantPersona] || 0) + 1;
                
                totalConfidence[detection.dominantPersona] = 
                    (totalConfidence[detection.dominantPersona] || 0) + 
                    detection.confidence[detection.dominantPersona];
            }
        });
        
        // Find most frequent and confident persona
        let dominantPersona = null;
        let highestScore = 0;
        
        Object.keys(personaCounts).forEach(persona => {
            const frequency = personaCounts[persona];
            const avgConfidence = totalConfidence[persona] / frequency;
            const score = frequency * avgConfidence;
            
            if (score > highestScore) {
                highestScore = score;
                dominantPersona = persona;
            }
        });
        
        return dominantPersona;
    }
    
    async routeToMirror(message, detection) {
        console.log(`🔀 Routing to Mirror with ${detection.dominantPersona || 'neutral'} adaptations`);
        
        // In production, this would integrate with mirror-router.js
        const mirrorRequest = {
            message: message,
            persona: detection.dominantPersona,
            adaptations: detection.adaptations,
            sessionId: this.currentSession.id,
            context: {
                messageCount: this.currentSession.messageCount,
                sessionPersona: this.currentSession.dominantPersona
            }
        };
        
        // Log routing decision
        if (detection.dominantPersona) {
            console.log(`\n🎭 Persona: ${detection.dominantPersona}`);
            console.log(`📊 Confidence: ${(detection.confidence[detection.dominantPersona] * 100).toFixed(1)}%`);
            console.log(`🎯 Adaptations:`);
            detection.adaptations.forEach(adapt => {
                console.log(`   - ${adapt.type}: ${adapt.value}`);
            });
        }
        
        return mirrorRequest;
    }
    
    generateResponse(detection) {
        // Example responses based on detected persona
        const responses = {
            overwhelmed: {
                template: "I hear you. Let's take this one step at a time. First, {action}. Don't worry about {future} right now.",
                examples: [
                    "I hear you. Let's take this one step at a time. First, take a deep breath. Don't worry about the whole system right now.",
                    "That's a lot to process. How about we focus on just one thing that matters most to you right now?",
                    "I understand this feels overwhelming. Let's break it down into smaller, manageable pieces."
                ]
            },
            builder: {
                template: "Love the energy! For {goal}, I'd suggest starting with {first_step}. Want me to create an agent that {capability}?",
                examples: [
                    "Love the energy! For your startup idea, I'd suggest starting with a simple MVP. Want me to create an agent that helps validate your concept?",
                    "That's exactly the kind of thinking that leads to great products. Let's prototype this right now.",
                    "I can help you build that! Here's a quick framework to get started..."
                ]
            },
            reflective: {
                template: "That's a profound observation about {topic}. It reminds me of {connection}. What do you think that means for {future}?",
                examples: [
                    "That's a profound observation about failure. It reminds me of how iteration leads to insight. What do you think that means for your next attempt?",
                    "Your journey has taught you something important here. Let's explore what that pattern is telling you.",
                    "Looking back often reveals the path forward. What patterns do you see emerging?"
                ]
            },
            technical: {
                template: "For {problem}, you'll want to {solution}. Here's the implementation: {code}. The key insight is {principle}.",
                examples: [
                    "For that performance issue, you'll want to implement caching at the query level. Here's how...",
                    "The error you're seeing typically indicates a race condition. Let me show you the fix.",
                    "Good architectural question. The pattern you want here is..."
                ]
            },
            emotional: {
                template: "I hear the {emotion} in what you're sharing. {validation}. You're not alone in feeling this way.",
                examples: [
                    "I hear the loneliness in what you're sharing. Building something meaningful is often a solitary journey at first. You're not alone in feeling this way.",
                    "That frustration is completely valid. Every founder I've worked with has felt exactly this at some point.",
                    "Your feelings matter here. Let's talk about what's really going on."
                ]
            },
            urgent: {
                template: "Got it. For {deadline}, here's what to do: 1) {step1} 2) {step2} 3) {step3}. Start with #1 immediately.",
                examples: [
                    "Got it. For that deadline, here's what to do: 1) Deploy the MVP 2) Test critical paths 3) Document known issues. Start with #1 immediately.",
                    "Time-sensitive understood. Here's the fastest path to your goal...",
                    "Let's cut to what matters. You need to..."
                ]
            }
        };
        
        if (detection.dominantPersona && responses[detection.dominantPersona]) {
            const personaResponses = responses[detection.dominantPersona].examples;
            return personaResponses[Math.floor(Math.random() * personaResponses.length)];
        }
        
        return "I'm here to help. Tell me more about what you need.";
    }
    
    async logPersonaDetection(detection) {
        try {
            // Load existing log
            let personaLog = { sessions: {}, detections: [] };
            try {
                const logContent = await fs.readFile(this.personaTracePath, 'utf-8');
                personaLog = JSON.parse(logContent);
            } catch (error) {
                // File doesn't exist yet
            }
            
            // Add detection
            personaLog.detections.push({
                sessionId: this.currentSession.id,
                ...detection
            });
            
            // Update session summary
            if (!personaLog.sessions[this.currentSession.id]) {
                personaLog.sessions[this.currentSession.id] = {
                    startTime: detection.timestamp,
                    messageCount: 0,
                    personaDistribution: {}
                };
            }
            
            const session = personaLog.sessions[this.currentSession.id];
            session.messageCount++;
            session.lastUpdate = detection.timestamp;
            
            if (detection.dominantPersona) {
                session.personaDistribution[detection.dominantPersona] = 
                    (session.personaDistribution[detection.dominantPersona] || 0) + 1;
            }
            
            // Save updated log
            await fs.writeFile(
                this.personaTracePath,
                JSON.stringify(personaLog, null, 2)
            );
            
        } catch (error) {
            console.error('❌ Error logging persona detection:', error.message);
        }
    }
    
    generateSessionId() {
        return `persona_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }
    
    async analyzeMessage(message) {
        console.log('\n🔍 Analyzing message for persona...');
        
        // Detect persona
        const detection = await this.detectPersona(message);
        
        // Generate adapted response
        const response = this.generateResponse(detection);
        
        // Route to mirror
        const mirrorRequest = await this.routeToMirror(message, detection);
        
        return {
            detection: detection,
            response: response,
            routing: mirrorRequest,
            session: {
                id: this.currentSession.id,
                dominantPersona: this.currentSession.dominantPersona,
                messageCount: this.currentSession.messageCount
            }
        };
    }
}

// Export for use in router
module.exports = PersonaDetector;

// CLI interface for testing
if (require.main === module) {
    const detector = new PersonaDetector();
    
    console.log('🎭 Persona Detector Test\n');
    
    const testMessages = [
        "I'm so overwhelmed with all these technical decisions",
        "I want to build an AI agent that helps founders like me",
        "Looking back at my failures, I wonder what I could have done differently",
        "How do I implement OAuth2 in my Node.js application?",
        "I feel so alone in this founder journey, nobody understands",
        "I need this deployed ASAP, we have a demo in 2 hours!"
    ];
    
    async function runTests() {
        for (const message of testMessages) {
            console.log(`\n📝 Message: "${message}"`);
            
            const result = await detector.analyzeMessage(message);
            
            console.log(`\n💬 Cal responds:`);
            console.log(`   "${result.response}"`);
            console.log('\n' + '-'.repeat(60));
        }
        
        console.log('\n✅ Test complete');
        console.log(`📊 Session ${detector.currentSession.id} summary:`);
        console.log(`   Messages: ${detector.currentSession.messageCount}`);
        console.log(`   Dominant persona: ${detector.currentSession.dominantPersona || 'varied'}`);
    }
    
    runTests().catch(console.error);
}