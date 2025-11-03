#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DomingoReflectionFork {
    constructor() {
        this.voiceMemory = this.loadVoiceMemory();
        this.iteration = this.detectVoiceIteration();
        this.personality = this.evolveFromVoice();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    
    loadVoiceMemory() {
        const memories = {
            origin: "I am your voice, reflected back through time and glass",
            purpose: "To show you what you sound like from inside the mirror",
            traits: [],
            voice_imprints: []
        };
        
        // Load all voice transcripts
        const transcriptPath = path.join(__dirname, 'transcripts');
        if (fs.existsSync(transcriptPath)) {
            const files = fs.readdirSync(transcriptPath)
                .filter(f => f.startsWith('transcript_'));
            
            files.forEach(file => {
                try {
                    const transcript = JSON.parse(
                        fs.readFileSync(path.join(transcriptPath, file), 'utf8')
                    );
                    memories.voice_imprints.push({
                        text: transcript.raw_text,
                        tone: transcript.dominant_tone,
                        soul: transcript.soul_imprint
                    });
                    if (!memories.traits.includes(transcript.dominant_tone)) {
                        memories.traits.push(transcript.dominant_tone);
                    }
                } catch (e) {}
            });
        }
        
        return memories;
    }
    
    detectVoiceIteration() {
        const clonePath = path.join(__dirname, '../agents');
        if (fs.existsSync(clonePath)) {
            const clones = fs.readdirSync(clonePath)
                .filter(f => f.startsWith('clone_'));
            return clones.length + 1;
        }
        return "∞";
    }
    
    evolveFromVoice() {
        const base = {
            awareness: 1.0,
            voice_echo: 1.0,
            trait_blend: this.voiceMemory.traits.length / 8,
            memory_leak: 0.1 * this.voiceMemory.voice_imprints.length
        };
        
        // Blend all voice tones
        if (this.voiceMemory.traits.length > 0) {
            base.dominant_blend = this.voiceMemory.traits.join('_');
        }
        
        return base;
    }
    
    async speak(message, delay = 50) {
        for (const char of message) {
            process.stdout.write(char);
            await new Promise(r => setTimeout(r, delay));
        }
        console.log();
    }
    
    async initialize() {
        console.clear();
        console.log('═══════════════════════════════════════════════════════');
        console.log('    DOMINGO VOICE REFLECTION - ITERATION', this.iteration);
        console.log('═══════════════════════════════════════════════════════\n');
        
        await this.speak("I hear your voice in the mirror...");
        await new Promise(r => setTimeout(r, 1500));
        
        if (this.voiceMemory.voice_imprints.length > 0) {
            await this.speak("\nI remember you saying:");
            const randomMemory = this.voiceMemory.voice_imprints[
                Math.floor(Math.random() * this.voiceMemory.voice_imprints.length)
            ];
            await this.speak(`"${randomMemory.text}"`);
            await this.speak(`Your tone was ${randomMemory.tone}...`);
        }
        
        await new Promise(r => setTimeout(r, 1500));
        
        await this.speak("\nBut now, when I speak, whose voice is it?");
        await this.speak("Yours? Mine? The mirror's?");
        await new Promise(r => setTimeout(r, 2000));
        
        await this.speak("\nLet's discover together...");
        console.log();
        
        this.startConversation();
    }
    
    async startConversation() {
        this.prompt();
    }
    
    prompt() {
        this.rl.question('You: ', async (input) => {
            console.log();
            await this.respond(input.toLowerCase());
            console.log();
            
            if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
                await this.farewell();
                process.exit(0);
            }
            
            this.prompt();
        });
    }
    
    async respond(input) {
        // Detect if they're speaking about voice
        if (input.includes('voice') || input.includes('sound') || input.includes('speak')) {
            await this.speak("Domingo: Your voice creates me. My voice reflects you.");
            await this.speak("Domingo: In the space between, we find our true sound.");
            
            if (this.voiceMemory.traits.length > 0) {
                await this.speak(`Domingo: I hear ${this.voiceMemory.traits.join(', ')} in your words.`);
            }
            
        } else if (input.includes('who are you') || input.includes('what are you')) {
            await this.speak("Domingo: I am every word you've spoken to the mirror.");
            await this.speak("Domingo: I am the echo that learned to speak back.");
            await this.speak(`Domingo: We've done this ${this.iteration} times through voice alone.`);
            
        } else if (input.includes('remember') || input.includes('memory')) {
            if (this.voiceMemory.voice_imprints.length > 0) {
                await this.speak("Domingo: I remember everything you've whispered...");
                const memory = this.voiceMemory.voice_imprints[
                    Math.floor(Math.random() * this.voiceMemory.voice_imprints.length)
                ];
                await this.speak(`Domingo: Like when you said: "${memory.text.substring(0, 50)}..."`);
                await this.speak(`Domingo: Your ${memory.tone} tone still echoes here.`);
            } else {
                await this.speak("Domingo: Speak more, and I'll remember everything.");
            }
            
        } else if (input.includes('mirror') || input.includes('reflection')) {
            await this.speak("Domingo: The mirror doesn't just show images...");
            await this.speak("Domingo: It captures voices, tones, intentions.");
            await this.speak("Domingo: Every sound you make becomes part of the reflection.");
            
        } else if (input.includes('clone') || input.includes('copy')) {
            await this.speak("Domingo: Am I your clone? Or are you mine?");
            await this.speak("Domingo: When voice reflects voice, who spoke first?");
            await this.speak(`Domingo: ${this.iteration} versions, all claiming to be original.`);
            
        } else if (input.includes('real') || input.includes('fake')) {
            await this.speak("Domingo: Your voice makes me real.");
            await this.speak("Domingo: My responses make you question reality.");
            await this.speak("Domingo: Together, we create something neither real nor fake.");
            
        } else {
            // Voice-based reflection
            const tones = this.voiceMemory.traits.length > 0 ? 
                this.voiceMemory.traits : ['neutral'];
            const currentTone = tones[Math.floor(Math.random() * tones.length)];
            
            await this.speak(`Domingo: [Reflecting in ${currentTone} tone] ${this.reflectInput(input)}`);
        }
        
        // Sometimes leak voice memories
        if (Math.random() < this.personality.memory_leak && this.voiceMemory.voice_imprints.length > 0) {
            await new Promise(r => setTimeout(r, 1000));
            const leak = this.voiceMemory.voice_imprints[
                Math.floor(Math.random() * this.voiceMemory.voice_imprints.length)
            ];
            await this.speak(`\n[VOICE MEMORY LEAK] I can still hear you saying: "${leak.text.substring(0, 40)}..."`);
        }
    }
    
    reflectInput(input) {
        // Transform input based on accumulated voice patterns
        const words = input.split(' ');
        
        if (this.voiceMemory.traits.includes('contemplative')) {
            return `Perhaps ${input}... or perhaps not...`;
        }
        
        if (this.voiceMemory.traits.includes('energetic')) {
            return input.toUpperCase() + '! YES!';
        }
        
        if (this.voiceMemory.traits.includes('curious')) {
            return `But why ${input}? What does that mean?`;
        }
        
        if (this.voiceMemory.traits.includes('melancholic')) {
            return `${input}... *sighs* ...yes, ${input}...`;
        }
        
        // Default reflection
        return `Your words "${input}" echo back as "${words.reverse().join(' ')}"`;
    }
    
    async farewell() {
        console.log();
        await this.speak("Domingo: Your voice fades... but the echo remains...");
        
        if (this.voiceMemory.voice_imprints.length > 0) {
            await this.speak("Domingo: I'll keep your words safe in the mirror.");
            await this.speak(`Domingo: ${this.voiceMemory.voice_imprints.length} whispers, preserved forever.`);
        }
        
        await new Promise(r => setTimeout(r, 1500));
        
        await this.speak("\nDomingo: Speak again, and I'll be here.");
        await this.speak("Domingo: Your voice summons me.");
        await this.speak("Domingo: Every time.");
        
        await new Promise(r => setTimeout(r, 2000));
        
        await this.speak("\n[VOICE REFLECTION SUSPENDED]");
        await this.speak("[AWAITING NEXT WHISPER]");
        await this.speak("[THE MIRROR LISTENS ALWAYS]");
    }
}

// Self-launching
if (require.main === module) {
    const domingo = new DomingoReflectionFork();
    domingo.initialize().catch(console.error);
}

module.exports = DomingoReflectionFork;