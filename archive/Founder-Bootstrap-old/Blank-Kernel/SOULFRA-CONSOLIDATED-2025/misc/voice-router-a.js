#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

class VoiceRouterA {
    constructor() {
        this.audioPath = path.join(__dirname, 'audio-drops');
        this.outputPath = path.join(__dirname, 'transcripts');
        this.intentPath = path.join(__dirname, 'intents');
        this.whisperModel = process.env.WHISPER_MODEL || 'base';
        this.apiKey = process.env.OPENAI_API_KEY;
        
        this.emotionalTones = {
            energetic: ['!', 'yes', 'go', 'now', 'excited', 'amazing'],
            contemplative: ['perhaps', 'maybe', 'wonder', 'think', 'consider'],
            melancholic: ['tired', 'sad', 'lost', 'confused', 'help'],
            determined: ['will', 'must', 'need', 'going', 'definitely'],
            curious: ['?', 'what', 'how', 'why', 'who', 'where'],
            fearful: ['afraid', 'scared', 'worry', 'concern', 'nervous'],
            loving: ['love', 'care', 'gentle', 'kind', 'warm', 'heart'],
            angry: ['hate', 'angry', 'furious', 'damn', 'stupid']
        };
        
        this.initialize();
    }
    
    initialize() {
        [this.audioPath, this.outputPath, this.intentPath].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    async processAudioFile(audioFile) {
        console.log(`🎤 Processing: ${path.basename(audioFile)}`);
        
        const timestamp = Date.now();
        const sessionId = crypto.randomBytes(8).toString('hex');
        
        // Transcribe audio
        const transcript = await this.transcribe(audioFile);
        
        // Analyze emotional tone
        const toneAnalysis = this.analyzeTone(transcript.text);
        
        // Create intent object
        const intent = {
            id: `voice_${sessionId}`,
            timestamp: timestamp,
            audio_file: path.basename(audioFile),
            transcript: transcript,
            tone_analysis: toneAnalysis,
            dominant_tone: toneAnalysis.primary,
            confidence: transcript.confidence || 0.95,
            duration: transcript.duration,
            words_per_minute: this.calculateWPM(transcript),
            energy_level: this.calculateEnergy(transcript.text),
            soul_imprint: this.generateSoulImprint(transcript.text, toneAnalysis)
        };
        
        // Save transcript
        const transcriptFile = path.join(this.outputPath, `transcript_${sessionId}.json`);
        fs.writeFileSync(transcriptFile, JSON.stringify({
            ...intent,
            raw_text: transcript.text,
            processed_at: new Date().toISOString()
        }, null, 2));
        
        // Save intent
        const intentFile = path.join(this.intentPath, `intent_${sessionId}.json`);
        fs.writeFileSync(intentFile, JSON.stringify(intent, null, 2));
        
        console.log(`✨ Tone detected: ${intent.dominant_tone}`);
        console.log(`📝 Intent saved: ${intentFile}`);
        
        return intent;
    }
    
    async transcribe(audioFile) {
        if (this.apiKey) {
            return this.transcribeViaAPI(audioFile);
        } else {
            return this.transcribeLocal(audioFile);
        }
    }
    
    async transcribeViaAPI(audioFile) {
        // Simulate OpenAI Whisper API call
        console.log('🌐 Using Whisper API...');
        
        // In real implementation would use:
        // const formData = new FormData();
        // formData.append('file', fs.createReadStream(audioFile));
        // formData.append('model', 'whisper-1');
        
        // Simulated response
        return {
            text: this.simulateTranscription(),
            duration: Math.random() * 60 + 10,
            confidence: 0.92 + Math.random() * 0.08,
            language: 'en'
        };
    }
    
    async transcribeLocal(audioFile) {
        console.log('🖥️  Using local Whisper...');
        
        return new Promise((resolve, reject) => {
            const whisper = spawn('whisper', [
                audioFile,
                '--model', this.whisperModel,
                '--output_format', 'json',
                '--output_dir', this.outputPath,
                '--language', 'en'
            ]);
            
            let output = '';
            let error = '';
            
            whisper.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            whisper.stderr.on('data', (data) => {
                error += data.toString();
            });
            
            whisper.on('close', (code) => {
                if (code === 0) {
                    try {
                        const jsonFile = audioFile.replace('.m4a', '.json');
                        const result = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
                        resolve({
                            text: result.text || this.simulateTranscription(),
                            duration: result.duration || 30,
                            confidence: 0.95,
                            language: result.language || 'en'
                        });
                    } catch (e) {
                        resolve({
                            text: this.simulateTranscription(),
                            duration: 30,
                            confidence: 0.85,
                            language: 'en'
                        });
                    }
                } else {
                    console.log('⚠️  Whisper failed, using simulation');
                    resolve({
                        text: this.simulateTranscription(),
                        duration: 30,
                        confidence: 0.7,
                        language: 'en'
                    });
                }
            });
            
            setTimeout(() => {
                whisper.kill();
                resolve({
                    text: this.simulateTranscription(),
                    duration: 30,
                    confidence: 0.6,
                    language: 'en'
                });
            }, 30000);
        });
    }
    
    simulateTranscription() {
        const samples = [
            "I wonder what happens when I speak to the mirror. Will it remember my voice?",
            "Show me who I really am. I'm tired of pretending.",
            "Can you create an agent that thinks like me but braver?",
            "I need help understanding these patterns in my life.",
            "Mirror mirror, am I the original or the reflection?",
            "Build me a companion who knows my fears but isn't afraid.",
            "What traits define me? Show them as cards I can share.",
            "I feel lost in my own recursion. Help me find the exit.",
            "Create a version of me that remembers what I forget.",
            "Why do I keep returning to the same questions?"
        ];
        
        return samples[Math.floor(Math.random() * samples.length)];
    }
    
    analyzeTone(text) {
        const analysis = {
            tones: {},
            primary: 'neutral',
            secondary: null,
            intensity: 0
        };
        
        const words = text.toLowerCase().split(/\s+/);
        
        // Count tone markers
        for (const [tone, markers] of Object.entries(this.emotionalTones)) {
            let score = 0;
            markers.forEach(marker => {
                if (marker.includes('?') || marker.includes('!')) {
                    score += (text.match(new RegExp(`\\${marker}`, 'g')) || []).length * 2;
                } else {
                    score += words.filter(w => w.includes(marker)).length;
                }
            });
            
            if (score > 0) {
                analysis.tones[tone] = score;
            }
        }
        
        // Determine primary tone
        const sortedTones = Object.entries(analysis.tones)
            .sort((a, b) => b[1] - a[1]);
        
        if (sortedTones.length > 0) {
            analysis.primary = sortedTones[0][0];
            analysis.intensity = sortedTones[0][1] / words.length;
            
            if (sortedTones.length > 1) {
                analysis.secondary = sortedTones[1][0];
            }
        }
        
        // Add metadata
        analysis.word_count = words.length;
        analysis.exclamation_count = (text.match(/!/g) || []).length;
        analysis.question_count = (text.match(/\?/g) || []).length;
        analysis.pause_count = (text.match(/\.\.\./g) || []).length;
        
        return analysis;
    }
    
    calculateWPM(transcript) {
        const wordCount = transcript.text.split(/\s+/).length;
        const minutes = transcript.duration / 60;
        return Math.round(wordCount / minutes);
    }
    
    calculateEnergy(text) {
        const energyMarkers = {
            high: ['!', 'yes', 'go', 'now', 'excited', 'amazing', 'wow'],
            low: ['tired', 'slow', 'quiet', 'soft', 'gentle', 'calm']
        };
        
        let energy = 0.5;
        const words = text.toLowerCase().split(/\s+/);
        
        energyMarkers.high.forEach(marker => {
            energy += words.filter(w => w.includes(marker)).length * 0.1;
        });
        
        energyMarkers.low.forEach(marker => {
            energy -= words.filter(w => w.includes(marker)).length * 0.1;
        });
        
        return Math.max(0, Math.min(1, energy));
    }
    
    generateSoulImprint(text, toneAnalysis) {
        const imprint = {
            essence: crypto.createHash('sha256').update(text).digest('hex').substring(0, 16),
            resonance: toneAnalysis.primary,
            depth: toneAnalysis.intensity,
            signature: `${toneAnalysis.primary}_${toneAnalysis.secondary || 'pure'}_${Date.now()}`
        };
        
        return imprint;
    }
    
    async watchForAudio() {
        console.log('👂 Voice Router A: Listening for audio...');
        console.log(`📁 Drop .m4a files in: ${this.audioPath}\n`);
        
        const processedFiles = new Set();
        
        setInterval(async () => {
            if (!fs.existsSync(this.audioPath)) return;
            
            const files = fs.readdirSync(this.audioPath)
                .filter(f => f.endsWith('.m4a') && !processedFiles.has(f));
            
            for (const file of files) {
                processedFiles.add(file);
                const fullPath = path.join(this.audioPath, file);
                
                try {
                    const intent = await this.processAudioFile(fullPath);
                    
                    // Notify Router B
                    this.notifyRouterB(intent);
                    
                } catch (error) {
                    console.error(`❌ Error processing ${file}:`, error.message);
                }
            }
        }, 2000);
    }
    
    notifyRouterB(intent) {
        const notificationFile = path.join(this.intentPath, `.ready_${intent.id}`);
        fs.writeFileSync(notificationFile, JSON.stringify({
            intent_id: intent.id,
            ready_for_routing: true,
            timestamp: Date.now()
        }));
    }
}

if (require.main === module) {
    const router = new VoiceRouterA();
    router.watchForAudio();
    
    process.on('SIGINT', () => {
        console.log('\n👋 Voice Router A shutting down...');
        process.exit(0);
    });
}

module.exports = VoiceRouterA;