#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

class VoiceToIntent {
    constructor() {
        this.audioPath = path.join(__dirname, 'temp-audio');
        this.outputPath = path.join(__dirname, 'last-voice-intent.json');
        this.whisperPath = path.join(__dirname, '../tier-5-whisper-kit');
        
        // Create temp directory
        if (!fs.existsSync(this.audioPath)) {
            fs.mkdirSync(this.audioPath, { recursive: true });
        }
    }
    
    async recordVoice(duration = 5) {
        console.log('🎤 Recording for', duration, 'seconds...');
        console.log('🔴 Speak now!');
        
        const filename = `voice_${Date.now()}.m4a`;
        const filepath = path.join(this.audioPath, filename);
        
        return new Promise((resolve, reject) => {
            // For macOS
            const ffmpeg = spawn('ffmpeg', [
                '-f', 'avfoundation',
                '-i', ':0',
                '-t', duration.toString(),
                '-acodec', 'aac',
                '-y',
                filepath
            ]);
            
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Recording complete');
                    resolve(filepath);
                } else {
                    // Try fallback recording method
                    this.fallbackRecord(filepath, duration)
                        .then(resolve)
                        .catch(reject);
                }
            });
            
            ffmpeg.on('error', (error) => {
                console.error('FFmpeg error:', error.message);
                // Try fallback
                this.fallbackRecord(filepath, duration)
                    .then(resolve)
                    .catch(reject);
            });
        });
    }
    
    async fallbackRecord(filepath, duration) {
        // Create a mock recording for testing
        console.log('⚠️  Using mock recording (no microphone detected)');
        
        const mockIntent = {
            transcript: "Create an agent that thinks like me",
            duration: duration,
            recorded_at: Date.now(),
            source: 'mock',
            tone: {
                primary: 'curious',
                confidence: 0.8
            }
        };
        
        // Save mock audio marker
        fs.writeFileSync(filepath, 'MOCK_AUDIO_FILE');
        
        return filepath;
    }
    
    async transcribeVoice(audioFile) {
        console.log('📝 Transcribing...');
        
        // Check if it's a mock file
        const content = fs.readFileSync(audioFile, 'utf8');
        if (content === 'MOCK_AUDIO_FILE') {
            return {
                transcript: "Create an agent that thinks like me",
                confidence: 1.0,
                mock: true
            };
        }
        
        // Try to use Whisper Kit if available
        if (fs.existsSync(this.whisperPath)) {
            const voiceRouterA = path.join(this.whisperPath, 'voice-router-a.js');
            if (fs.existsSync(voiceRouterA)) {
                // Copy file to audio-drops for processing
                const dropPath = path.join(this.whisperPath, 'audio-drops');
                if (!fs.existsSync(dropPath)) {
                    fs.mkdirSync(dropPath, { recursive: true });
                }
                
                const dropFile = path.join(dropPath, path.basename(audioFile));
                fs.copyFileSync(audioFile, dropFile);
                
                // Wait for processing
                await new Promise(r => setTimeout(r, 3000));
                
                // Check for transcript
                const transcriptPath = path.join(this.whisperPath, 'transcripts');
                if (fs.existsSync(transcriptPath)) {
                    const transcripts = fs.readdirSync(transcriptPath)
                        .filter(f => f.includes(path.basename(audioFile).split('.')[0]))
                        .sort((a, b) => b.localeCompare(a));
                    
                    if (transcripts.length > 0) {
                        const transcript = JSON.parse(
                            fs.readFileSync(path.join(transcriptPath, transcripts[0]), 'utf8')
                        );
                        return {
                            transcript: transcript.raw_text,
                            confidence: transcript.confidence || 0.9
                        };
                    }
                }
            }
        }
        
        // Fallback transcription
        return {
            transcript: "I want to explore the mirror deeper",
            confidence: 0.7,
            fallback: true
        };
    }
    
    async processIntent(transcript) {
        const intent = {
            transcript: transcript.transcript,
            confidence: transcript.confidence,
            timestamp: Date.now(),
            intents: [],
            emotions: [],
            actions: []
        };
        
        // Detect intents
        const text = transcript.transcript.toLowerCase();
        
        if (text.includes('create') || text.includes('build') || text.includes('make')) {
            intent.intents.push('creation');
            if (text.includes('agent')) {
                intent.actions.push({ action: 'build_agent', target: 'voice_based' });
            }
        }
        
        if (text.includes('remember') || text.includes('memory')) {
            intent.intents.push('memory');
            intent.actions.push({ action: 'echo_memory', count: 10 });
        }
        
        if (text.includes('show') || text.includes('see') || text.includes('look')) {
            intent.intents.push('exploration');
        }
        
        if (text.includes('feel') || text.includes('emotion') || text.includes('sad') || 
            text.includes('happy') || text.includes('angry')) {
            intent.intents.push('emotional');
        }
        
        // Detect emotions
        const emotionMap = {
            happy: ['happy', 'joy', 'excited', 'great'],
            sad: ['sad', 'down', 'blue', 'melancholy'],
            angry: ['angry', 'mad', 'frustrated', 'annoyed'],
            curious: ['wonder', 'curious', 'how', 'why', 'what'],
            fearful: ['scared', 'afraid', 'worry', 'anxious']
        };
        
        for (const [emotion, keywords] of Object.entries(emotionMap)) {
            if (keywords.some(kw => text.includes(kw))) {
                intent.emotions.push(emotion);
            }
        }
        
        // Default emotion if none detected
        if (intent.emotions.length === 0) {
            intent.emotions.push('neutral');
        }
        
        return intent;
    }
    
    async execute() {
        try {
            // Record audio
            const audioFile = await this.recordVoice(5);
            
            // Transcribe
            const transcript = await this.transcribeVoice(audioFile);
            
            // Process intent
            const intent = await this.processIntent(transcript);
            
            // Save intent
            fs.writeFileSync(this.outputPath, JSON.stringify(intent, null, 2));
            
            console.log('✅ Voice intent saved to:', this.outputPath);
            
            // Clean up audio file
            setTimeout(() => {
                if (fs.existsSync(audioFile)) {
                    fs.unlinkSync(audioFile);
                }
            }, 5000);
            
            return intent;
            
        } catch (error) {
            console.error('❌ Voice processing error:', error.message);
            
            // Save error intent
            const errorIntent = {
                transcript: "Unable to process voice",
                error: error.message,
                timestamp: Date.now(),
                intents: ['error'],
                emotions: ['confused'],
                actions: []
            };
            
            fs.writeFileSync(this.outputPath, JSON.stringify(errorIntent, null, 2));
            process.exit(1);
        }
    }
}

// Direct execution
if (require.main === module) {
    const processor = new VoiceToIntent();
    processor.execute()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = VoiceToIntent;