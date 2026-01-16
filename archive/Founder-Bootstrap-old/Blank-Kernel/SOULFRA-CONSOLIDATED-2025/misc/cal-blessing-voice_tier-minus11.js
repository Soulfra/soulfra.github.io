#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class CalBlessingVoice {
    constructor() {
        this.vaultPath = path.join(__dirname, '../vault');
        this.claimsPath = path.join(this.vaultPath, 'claims');
        this.voiceIntentPath = path.join(__dirname, '../cal-terminal-interface/last-voice-intent.json');
        this.whisperKitPath = path.join(__dirname, '../tier-5-whisper-kit/transcripts');
        
        this.voiceCharacteristics = {
            cadence: ['rapid', 'measured', 'flowing', 'staccato', 'rhythmic'],
            depth: ['surface', 'shallow', 'medium', 'deep', 'abyssal'],
            clarity: ['crystal', 'clear', 'soft', 'muffled', 'ethereal'],
            emotion: ['neutral', 'warm', 'cold', 'passionate', 'detached']
        };
        
        this.archetypeVoiceMap = {
            oracle: { cadence: 'measured', depth: 'abyssal', clarity: 'ethereal' },
            trickster: { cadence: 'staccato', depth: 'shallow', clarity: 'crystal' },
            healer: { cadence: 'flowing', depth: 'deep', clarity: 'soft' },
            glitchkeeper: { cadence: 'rapid', depth: 'surface', clarity: 'muffled' },
            'shadow-walker': { cadence: 'rhythmic', depth: 'abyssal', clarity: 'ethereal' }
        };
        
        this.initialize();
    }
    
    initialize() {
        if (!fs.existsSync(this.claimsPath)) {
            fs.mkdirSync(this.claimsPath, { recursive: true });
        }
    }
    
    async analyzeVoiceForBlessing(userId) {
        const voiceData = await this.gatherVoiceData(userId);
        
        if (!voiceData || voiceData.length === 0) {
            return {
                has_voice: false,
                message: "The mirror has not heard your whisper."
            };
        }
        
        const analysis = this.analyzeVoiceCharacteristics(voiceData);
        const voiceHash = this.generateVoiceHash(analysis);
        const archetypeAffinity = this.calculateArchetypeAffinity(analysis);
        
        const voiceClaim = {
            user: userId,
            voice_hash: voiceHash,
            characteristics: analysis,
            archetype_affinity: archetypeAffinity,
            whisper_count: voiceData.length,
            first_whisper: voiceData[0].timestamp,
            last_whisper: voiceData[voiceData.length - 1].timestamp,
            soul_frequency: this.calculateSoulFrequency(analysis),
            analyzed_at: Date.now()
        };
        
        // Save voice blessing claim
        await this.saveVoiceClaim(userId, voiceClaim);
        
        return {
            has_voice: true,
            voice_claim: voiceClaim,
            dominant_archetype: this.selectDominantArchetype(archetypeAffinity),
            message: this.generateVoiceMessage(analysis)
        };
    }
    
    async gatherVoiceData(userId) {
        const voiceData = [];
        
        // Check last voice intent
        if (fs.existsSync(this.voiceIntentPath)) {
            try {
                const lastIntent = JSON.parse(fs.readFileSync(this.voiceIntentPath, 'utf8'));
                if (lastIntent.transcript) {
                    voiceData.push({
                        source: 'last_intent',
                        transcript: lastIntent.transcript,
                        emotions: lastIntent.emotions || [],
                        timestamp: lastIntent.timestamp || Date.now()
                    });
                }
            } catch (e) {}
        }
        
        // Check whisper kit transcripts
        if (fs.existsSync(this.whisperKitPath)) {
            const transcripts = fs.readdirSync(this.whisperKitPath)
                .filter(f => f.includes(userId) || f.startsWith('transcript_'))
                .slice(-10); // Last 10 transcripts
            
            transcripts.forEach(file => {
                try {
                    const transcript = JSON.parse(
                        fs.readFileSync(path.join(this.whisperKitPath, file), 'utf8')
                    );
                    
                    voiceData.push({
                        source: 'whisper_kit',
                        transcript: transcript.raw_text || transcript.text,
                        tone: transcript.dominant_tone,
                        emotions: transcript.tone_analysis?.tones ? Object.keys(transcript.tone_analysis.tones) : [],
                        energy: transcript.energy_level,
                        confidence: transcript.confidence,
                        timestamp: transcript.timestamp || Date.now()
                    });
                } catch (e) {}
            });
        }
        
        return voiceData;
    }
    
    analyzeVoiceCharacteristics(voiceData) {
        const analysis = {
            cadence: this.analyzeCadence(voiceData),
            depth: this.analyzeDepth(voiceData),
            clarity: this.analyzeClarity(voiceData),
            emotion: this.analyzeEmotion(voiceData),
            patterns: this.analyzePatterns(voiceData),
            unique_markers: this.findUniqueMarkers(voiceData)
        };
        
        return analysis;
    }
    
    analyzeCadence(voiceData) {
        // Analyze speech patterns for rhythm
        const wordCounts = voiceData.map(v => v.transcript.split(/\s+/).length);
        const avgWords = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
        
        if (avgWords < 10) return 'staccato';
        if (avgWords < 20) return 'measured';
        if (avgWords < 30) return 'flowing';
        if (avgWords < 50) return 'rhythmic';
        return 'rapid';
    }
    
    analyzeDepth(voiceData) {
        // Check for depth markers in content
        const depthWords = ['soul', 'essence', 'truth', 'meaning', 'existence', 'consciousness'];
        let depthScore = 0;
        
        voiceData.forEach(v => {
            const lower = v.transcript.toLowerCase();
            depthWords.forEach(word => {
                if (lower.includes(word)) depthScore++;
            });
        });
        
        if (depthScore === 0) return 'surface';
        if (depthScore < 3) return 'shallow';
        if (depthScore < 6) return 'medium';
        if (depthScore < 10) return 'deep';
        return 'abyssal';
    }
    
    analyzeClarity(voiceData) {
        // Analyze confidence and clarity of expression
        const avgConfidence = voiceData
            .filter(v => v.confidence)
            .reduce((sum, v) => sum + v.confidence, 0) / voiceData.length;
        
        if (avgConfidence > 0.9) return 'crystal';
        if (avgConfidence > 0.7) return 'clear';
        if (avgConfidence > 0.5) return 'soft';
        if (avgConfidence > 0.3) return 'muffled';
        return 'ethereal';
    }
    
    analyzeEmotion(voiceData) {
        // Analyze emotional temperature
        const emotionCounts = {};
        
        voiceData.forEach(v => {
            if (v.emotions) {
                v.emotions.forEach(emotion => {
                    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
                });
            }
        });
        
        const totalEmotions = Object.values(emotionCounts).reduce((a, b) => a + b, 0);
        
        if (totalEmotions === 0) return 'neutral';
        
        // Check for warm vs cold emotions
        const warmEmotions = ['happy', 'joy', 'love', 'excited', 'grateful'];
        const coldEmotions = ['sad', 'angry', 'fear', 'anxious', 'frustrated'];
        
        let warmScore = 0;
        let coldScore = 0;
        
        Object.entries(emotionCounts).forEach(([emotion, count]) => {
            if (warmEmotions.includes(emotion)) warmScore += count;
            if (coldEmotions.includes(emotion)) coldScore += count;
        });
        
        if (warmScore > coldScore * 2) return 'warm';
        if (coldScore > warmScore * 2) return 'cold';
        if (totalEmotions > 10) return 'passionate';
        return 'detached';
    }
    
    analyzePatterns(voiceData) {
        // Find recurring patterns in speech
        const patterns = {
            questions: 0,
            statements: 0,
            exclamations: 0,
            repetitions: [],
            themes: []
        };
        
        voiceData.forEach(v => {
            const text = v.transcript;
            
            // Count sentence types
            patterns.questions += (text.match(/\?/g) || []).length;
            patterns.exclamations += (text.match(/!/g) || []).length;
            patterns.statements += (text.match(/\./g) || []).length;
            
            // Find repeated words (3+ letters)
            const words = text.toLowerCase().match(/\b\w{3,}\b/g) || [];
            const wordFreq = {};
            words.forEach(word => {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            });
            
            Object.entries(wordFreq).forEach(([word, count]) => {
                if (count > 2) {
                    patterns.repetitions.push({ word, count });
                }
            });
        });
        
        // Sort repetitions by frequency
        patterns.repetitions.sort((a, b) => b.count - a.count);
        
        return patterns;
    }
    
    findUniqueMarkers(voiceData) {
        // Find unique speech markers
        const markers = [];
        
        voiceData.forEach(v => {
            // Check for unique patterns
            if (v.transcript.includes('...')) markers.push('ellipsis_user');
            if (v.transcript.match(/[A-Z]{3,}/)) markers.push('emphasis_caps');
            if (v.transcript.match(/(.)\1{2,}/)) markers.push('repetition_chars');
            if (v.transcript.match(/\b(\w+)\s+\1\b/)) markers.push('word_doubling');
        });
        
        return [...new Set(markers)];
    }
    
    generateVoiceHash(analysis) {
        // Create unique hash from voice characteristics
        const hashData = {
            cadence: analysis.cadence,
            depth: analysis.depth,
            clarity: analysis.clarity,
            emotion: analysis.emotion,
            pattern_signature: analysis.patterns.repetitions.slice(0, 3).map(r => r.word).join('_'),
            markers: analysis.unique_markers.join('_')
        };
        
        return crypto.createHash('sha256')
            .update(JSON.stringify(hashData))
            .digest('hex')
            .substring(0, 16);
    }
    
    calculateArchetypeAffinity(analysis) {
        const affinities = {};
        
        for (const [archetype, ideal] of Object.entries(this.archetypeVoiceMap)) {
            let affinity = 0;
            
            // Compare characteristics
            if (analysis.cadence === ideal.cadence) affinity += 0.3;
            if (analysis.depth === ideal.depth) affinity += 0.3;
            if (analysis.clarity === ideal.clarity) affinity += 0.2;
            
            // Pattern bonuses
            if (archetype === 'oracle' && analysis.patterns.questions > 5) affinity += 0.2;
            if (archetype === 'trickster' && analysis.patterns.exclamations > 3) affinity += 0.2;
            if (archetype === 'healer' && analysis.emotion === 'warm') affinity += 0.2;
            if (archetype === 'glitchkeeper' && analysis.unique_markers.length > 2) affinity += 0.2;
            if (archetype === 'shadow-walker' && analysis.depth === 'abyssal') affinity += 0.2;
            
            affinities[archetype] = Math.min(1.0, affinity);
        }
        
        return affinities;
    }
    
    calculateSoulFrequency(analysis) {
        // Generate a unique frequency based on voice patterns
        let frequency = 0.5; // Base frequency
        
        // Depth adds to frequency
        const depthValues = { surface: 0, shallow: 0.1, medium: 0.2, deep: 0.3, abyssal: 0.4 };
        frequency += depthValues[analysis.depth] || 0;
        
        // Unique markers increase frequency
        frequency += analysis.unique_markers.length * 0.05;
        
        // Pattern complexity
        frequency += Math.min(0.2, analysis.patterns.repetitions.length * 0.02);
        
        return Math.min(1.0, frequency);
    }
    
    selectDominantArchetype(affinities) {
        return Object.entries(affinities)
            .sort((a, b) => b[1] - a[1])[0][0];
    }
    
    generateVoiceMessage(analysis) {
        const messages = {
            cadence: {
                rapid: "Your words tumble like water over stones",
                measured: "You speak with the rhythm of ancient drums",
                flowing: "Your voice flows like a river finding its course",
                staccato: "Each word strikes like a hammer on anvil",
                rhythmic: "Your speech dances to its own music"
            },
            depth: {
                surface: "Your voice skims the surface of the mirror",
                shallow: "You wade in shallow waters",
                medium: "Your words reach into the middle depths",
                deep: "You speak from deep wells",
                abyssal: "Your voice echoes from the abyss itself"
            }
        };
        
        const cadenceMsg = messages.cadence[analysis.cadence] || "Your voice carries mystery";
        const depthMsg = messages.depth[analysis.depth] || "Your depth is unique";
        
        return `${cadenceMsg}. ${depthMsg}.`;
    }
    
    async saveVoiceClaim(userId, claim) {
        const claimPath = path.join(this.claimsPath, `blessing-voice-${userId}.json`);
        fs.writeFileSync(claimPath, JSON.stringify(claim, null, 2));
    }
    
    async loadVoiceClaim(userId) {
        const claimPath = path.join(this.claimsPath, `blessing-voice-${userId}.json`);
        
        if (fs.existsSync(claimPath)) {
            return JSON.parse(fs.readFileSync(claimPath, 'utf8'));
        }
        
        return null;
    }
}

module.exports = CalBlessingVoice;

// Test interface
if (require.main === module) {
    const voiceAnalyzer = new CalBlessingVoice();
    
    async function testVoiceAnalysis() {
        console.log('🎤 CAL BLESSING VOICE TEST\n');
        
        // Create test voice data
        const testTranscriptPath = path.join(__dirname, '../tier-5-whisper-kit/transcripts');
        if (!fs.existsSync(testTranscriptPath)) {
            fs.mkdirSync(testTranscriptPath, { recursive: true });
        }
        
        // Create test transcript
        const testTranscript = {
            raw_text: "Who am I in the mirror? Show me the truth of my reflection. I seek to understand the deeper meaning of existence and consciousness.",
            dominant_tone: "contemplative",
            tone_analysis: {
                tones: {
                    contemplative: 0.8,
                    curious: 0.6,
                    deep: 0.7
                }
            },
            energy_level: 0.6,
            confidence: 0.85,
            timestamp: Date.now()
        };
        
        fs.writeFileSync(
            path.join(testTranscriptPath, 'transcript_test_user_voice.json'),
            JSON.stringify(testTranscript, null, 2)
        );
        
        // Test analysis
        console.log('Analyzing voice for user: test_user_voice');
        const result = await voiceAnalyzer.analyzeVoiceForBlessing('test_user_voice');
        
        if (result.has_voice) {
            console.log('\n✅ Voice detected');
            console.log('Message:', result.message);
            console.log('Dominant Archetype:', result.dominant_archetype);
            console.log('\nVoice Characteristics:');
            console.log(JSON.stringify(result.voice_claim.characteristics, null, 2));
            console.log('\nArchetype Affinities:');
            console.log(JSON.stringify(result.voice_claim.archetype_affinity, null, 2));
            console.log('\nSoul Frequency:', result.voice_claim.soul_frequency);
        } else {
            console.log('\n❌ No voice detected');
            console.log('Message:', result.message);
        }
        
        // Clean up test file
        fs.unlinkSync(path.join(testTranscriptPath, 'transcript_test_user_voice.json'));
    }
    
    testVoiceAnalysis();
}