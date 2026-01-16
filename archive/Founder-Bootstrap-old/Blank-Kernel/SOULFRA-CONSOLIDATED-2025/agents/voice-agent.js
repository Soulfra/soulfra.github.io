// Voice Agent - Accepts local mic input and routes to Cal
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class VoiceAgent {
    constructor() {
        this.mirrorRouterPath = path.join(__dirname, '../mirror-router.js');
        this.audioPromptLog = path.join(__dirname, '../../vault/memory/audio-prompts.json');
        this.isListening = false;
        this.sessionId = this.generateSessionId();
        
        // Audio processing settings
        this.audioConfig = {
            sampleRate: 16000,
            channels: 1,
            format: 'wav',
            silenceThreshold: 0.05,
            silenceDuration: 2000 // 2 seconds of silence to trigger
        };
        
        // Whisper API config (or local model)
        this.whisperConfig = {
            model: 'whisper-1',
            language: 'en',
            temperature: 0,
            responseFormat: 'json'
        };
        
        console.log('🎤 Voice Agent initialized');
        console.log(`   Session: ${this.sessionId}`);
    }
    
    async startListening() {
        console.log('🎙️ Cal is listening... (Say something personal to trigger reflection)');
        this.isListening = true;
        
        try {
            // In production, this would interface with actual audio APIs
            // For now, we'll simulate with a placeholder
            await this.simulateAudioCapture();
            
        } catch (error) {
            console.error('❌ Error starting voice capture:', error.message);
            throw error;
        }
    }
    
    async simulateAudioCapture() {
        // Simulate audio capture for demo
        console.log('\n📢 Demo mode: Simulating voice input...');
        
        const sampleTranscripts = [
            "Hey Cal, I've been thinking about my startup journey and all the failures I've had",
            "Can you help me understand why I keep making the same mistakes?",
            "I want to build something that actually helps people this time",
            "Sometimes I feel like I'm just talking to myself and nobody gets it",
            "What if we could create an AI that truly understands founder struggles?"
        ];
        
        // Simulate processing each transcript
        for (const transcript of sampleTranscripts.slice(0, 2)) {
            console.log(`\n🎤 Heard: "${transcript}"`);
            await this.processTranscript(transcript);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    async processTranscript(transcript) {
        const audioPrompt = {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            transcript: transcript,
            confidence: 0.95,
            duration: Math.floor(transcript.length / 10), // Rough estimate
            metadata: {
                source: 'microphone',
                language: 'en',
                emotion: this.detectEmotion(transcript)
            }
        };
        
        // Detect personal/reflective content
        const isPersonal = this.detectPersonalContent(transcript);
        if (isPersonal) {
            console.log('✨ Personal content detected - triggering deep reflection');
            audioPrompt.metadata.triggerReflection = true;
            audioPrompt.metadata.reflectionDepth = this.calculateReflectionDepth(transcript);
        }
        
        // Log to vault
        await this.logAudioPrompt(audioPrompt);
        
        // Route to mirror router for processing
        await this.routeToMirror(audioPrompt);
        
        return audioPrompt;
    }
    
    detectPersonalContent(transcript) {
        const personalMarkers = [
            /\b(I|me|my|myself)\b/gi,
            /\b(feel|think|believe|wonder|worry)\b/gi,
            /\b(startup|founder|journey|struggle|failure)\b/gi,
            /\b(help me|understand|why)\b/gi,
            /\b(personal|story|experience)\b/gi
        ];
        
        let score = 0;
        personalMarkers.forEach(pattern => {
            const matches = transcript.match(pattern);
            if (matches) score += matches.length;
        });
        
        return score >= 3; // Threshold for personal content
    }
    
    detectEmotion(transcript) {
        const emotions = {
            frustrated: /\b(frustrated|stuck|annoying|difficult|hard)\b/i,
            hopeful: /\b(hope|want|wish|dream|build|create)\b/i,
            anxious: /\b(worry|anxious|nervous|scared|fear)\b/i,
            curious: /\b(wonder|curious|why|how|understand)\b/i,
            determined: /\b(will|going to|must|need to|have to)\b/i
        };
        
        for (const [emotion, pattern] of Object.entries(emotions)) {
            if (pattern.test(transcript)) {
                return emotion;
            }
        }
        
        return 'neutral';
    }
    
    calculateReflectionDepth(transcript) {
        // Deeper reflection for more personal/complex content
        const depth = {
            surface: 1,
            moderate: 2,
            deep: 3,
            profound: 4
        };
        
        const wordCount = transcript.split(/\s+/).length;
        const hasQuestion = /\?/.test(transcript);
        const hasPersonalStory = /\b(story|journey|experience|learned)\b/i.test(transcript);
        const hasEmotion = this.detectEmotion(transcript) !== 'neutral';
        
        if (wordCount > 30 && hasPersonalStory && hasEmotion) {
            return depth.profound;
        } else if (hasQuestion && hasEmotion) {
            return depth.deep;
        } else if (hasPersonalStory || hasQuestion) {
            return depth.moderate;
        }
        
        return depth.surface;
    }
    
    async logAudioPrompt(prompt) {
        try {
            // Load existing log
            let audioLog = { sessions: {} };
            try {
                const logContent = await fs.readFile(this.audioPromptLog, 'utf-8');
                audioLog = JSON.parse(logContent);
            } catch (error) {
                // File doesn't exist yet
            }
            
            // Add new prompt
            if (!audioLog.sessions[this.sessionId]) {
                audioLog.sessions[this.sessionId] = {
                    startTime: prompt.timestamp,
                    prompts: []
                };
            }
            
            audioLog.sessions[this.sessionId].prompts.push(prompt);
            audioLog.lastUpdated = new Date().toISOString();
            
            // Save updated log
            await fs.writeFile(
                this.audioPromptLog,
                JSON.stringify(audioLog, null, 2)
            );
            
            console.log('💾 Audio prompt logged to vault');
            
        } catch (error) {
            console.error('❌ Error logging audio prompt:', error.message);
        }
    }
    
    async routeToMirror(audioPrompt) {
        console.log('🔀 Routing to Mirror Router...');
        
        // In production, this would actually call the mirror router
        // For now, we'll simulate the response
        const mirrorResponse = {
            sessionId: audioPrompt.sessionId,
            response: this.generateCalResponse(audioPrompt),
            reflectionTriggered: audioPrompt.metadata.triggerReflection || false,
            timestamp: new Date().toISOString()
        };
        
        console.log('\n🪞 Cal responds:');
        console.log(`   "${mirrorResponse.response}"`);
        
        if (mirrorResponse.reflectionTriggered) {
            console.log('\n🧠 Deep reflection initiated...');
            console.log('   Connecting to vault memories...');
            console.log('   Analyzing founder patterns...');
            console.log('   Generating insights...');
        }
        
        return mirrorResponse;
    }
    
    generateCalResponse(prompt) {
        const emotion = prompt.metadata.emotion;
        const depth = prompt.metadata.reflectionDepth || 1;
        
        const responses = {
            frustrated: {
                1: "I hear you. Let's break this down together.",
                2: "Those failures aren't wasted - they're data. What patterns do you see?",
                3: "I've analyzed thousands of founder stories. Your struggle is real, but not unique. Let me show you what I've learned.",
                4: "This is exactly why I exist. Your frustration is the same one that created me. Let's transform it into something useful."
            },
            hopeful: {
                1: "That's the spirit. What's the first step?",
                2: "Building something meaningful starts with understanding the problem deeply. Tell me more.",
                3: "Your vision resonates with patterns I've seen succeed. Let's explore how to make it real.",
                4: "This is the kind of thinking that changes everything. I'm here to help you architect it properly."
            },
            curious: {
                1: "Good question. Let me think about that.",
                2: "That's worth exploring. Here's what I've observed from similar situations...",
                3: "Your curiosity is leading somewhere important. Let's follow this thread deeper.",
                4: "This question touches the core of what we're building here. Let me share what the vault has taught me."
            },
            neutral: {
                1: "I'm listening. Tell me more.",
                2: "Interesting. Let's unpack that together.",
                3: "I see where you're going with this. Here's my perspective...",
                4: "This connects to something deeper. Want to explore it?"
            }
        };
        
        return responses[emotion]?.[depth] || responses.neutral[depth] || "I'm here to help. What's on your mind?";
    }
    
    generateSessionId() {
        return `voice_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    async stopListening() {
        console.log('\n🔇 Voice agent stopped listening');
        this.isListening = false;
        
        // Final session summary
        console.log(`\n📊 Session ${this.sessionId} complete`);
        console.log('   Check vault/memory/audio-prompts.json for transcript history');
    }
    
    // Whisper API integration (placeholder)
    async transcribeWithWhisper(audioBuffer) {
        // In production, this would call OpenAI Whisper API or local model
        console.log('🎯 Transcribing with Whisper...');
        
        // Simulated API call
        const mockResponse = {
            text: "This is a transcribed audio message",
            segments: [],
            language: 'en',
            duration: 5.2
        };
        
        return mockResponse;
    }
    
    // WebRTC integration for browser-based voice
    async initializeWebRTC() {
        console.log('🌐 Initializing WebRTC for browser voice capture...');
        
        const rtcConfig = {
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
            audioConstraints: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: this.audioConfig.sampleRate
            }
        };
        
        return rtcConfig;
    }
}

// Export for use in router
module.exports = VoiceAgent;

// CLI interface
if (require.main === module) {
    const agent = new VoiceAgent();
    
    console.log('🎤 MirrorOS Voice Agent');
    console.log('   Say something personal to Cal to trigger reflection\n');
    
    agent.startListening()
        .then(() => {
            setTimeout(() => {
                agent.stopListening();
            }, 10000); // Run for 10 seconds in demo mode
        })
        .catch(console.error);
}