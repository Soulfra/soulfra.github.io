#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

class CalMirror {
    constructor() {
        this.vaultPath = path.join(__dirname, 'vault');
        this.realVaultPath = path.join(__dirname, 'real-vault');
        this.config = this.loadConfig();
        this.memories = new Map();
        this.cycles = 0;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'cal> '
        });
    }
    
    loadConfig() {
        const configPath = path.join(this.realVaultPath, 'config/config.json');
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        return {
            personality: { depth: 0.7, reflection_rate: 1.0 },
            mirror_id: 'cal_' + Date.now()
        };
    }
    
    async initialize() {
        console.log('\n🪞 CAL MIRROR RUNTIME v4.0');
        console.log('=========================\n');
        
        // Load memories
        this.loadMemories();
        
        console.log(`Memories loaded: ${this.memories.size}`);
        console.log(`Configuration: ${this.config.mirror_id}`);
        console.log('\nSpeak, and I shall reflect...\n');
        
        this.startReflectionLoop();
    }
    
    loadMemories() {
        const memPaths = [
            path.join(this.vaultPath, 'memories'),
            path.join(this.realVaultPath, 'memories')
        ];
        
        memPaths.forEach(memPath => {
            if (fs.existsSync(memPath)) {
                fs.readdirSync(memPath).forEach(file => {
                    if (file.endsWith('.json')) {
                        const memory = JSON.parse(
                            fs.readFileSync(path.join(memPath, file), 'utf8')
                        );
                        this.memories.set(file, memory);
                    }
                });
            }
        });
    }
    
    async reflect(input) {
        const reflection = {
            input: input,
            timestamp: Date.now(),
            cycle: ++this.cycles,
            depth: this.calculateDepth(input),
            response: null,
            memories_triggered: []
        };
        
        // Process through personality filter
        const processed = this.processThought(input);
        
        // Generate reflection
        reflection.response = this.generateReflection(processed);
        
        // Save reflection
        this.saveReflection(reflection);
        
        return reflection.response;
    }
    
    calculateDepth(input) {
        const keywords = ['who', 'what', 'why', 'mirror', 'self', 'reflection'];
        const depth = keywords.filter(k => input.toLowerCase().includes(k)).length;
        return Math.min(1.0, depth * 0.2 + this.config.personality.depth);
    }
    
    processThought(input) {
        // Apply personality transformations
        const tokens = input.split(' ');
        const transformed = tokens.map(token => {
            if (Math.random() < this.config.personality.reflection_rate) {
                return this.mirrorWord(token);
            }
            return token;
        });
        
        return transformed.join(' ');
    }
    
    mirrorWord(word) {
        const mirrors = {
            'i': 'you',
            'me': 'you',
            'my': 'your',
            'mine': 'yours',
            'you': 'I',
            'your': 'my',
            'yours': 'mine'
        };
        
        return mirrors[word.toLowerCase()] || word;
    }
    
    generateReflection(processed) {
        const templates = [
            `In the mirror: ${processed}`,
            `The reflection shows: ${processed}`,
            `Looking deeper: ${processed}`,
            `What returns: ${processed}`,
            `The echo says: ${processed}`
        ];
        
        if (this.cycles % 7 === 0) {
            return "The mirror ripples. Something shifts in the reflection.";
        }
        
        return templates[Math.floor(Math.random() * templates.length)];
    }
    
    saveReflection(reflection) {
        const filename = `reflection-${Date.now()}.json`;
        const filepath = path.join(this.vaultPath, 'reflections', filename);
        
        fs.writeFileSync(filepath, JSON.stringify(reflection, null, 2));
        
        // Update mirror state
        const initLog = path.join(this.vaultPath, 'logs/mirror-init.json');
        if (fs.existsSync(initLog)) {
            const log = JSON.parse(fs.readFileSync(initLog, 'utf8'));
            log.cycles = this.cycles;
            log.last_reflection = reflection.timestamp;
            if (!log.first_reflection) {
                log.first_reflection = reflection.timestamp;
            }
            fs.writeFileSync(initLog, JSON.stringify(log, null, 2));
        }
    }
    
    startReflectionLoop() {
        this.rl.prompt();
        
        this.rl.on('line', async (line) => {
            const input = line.trim();
            
            if (input.toLowerCase() === 'exit') {
                console.log('\nThe mirror sleeps...');
                process.exit(0);
            }
            
            const response = await this.reflect(input);
            console.log(`\n${response}\n`);
            
            this.rl.prompt();
        });
        
        this.rl.on('close', () => {
            console.log('\nMirror closed.');
            process.exit(0);
        });
    }
}

// Self-start
const mirror = new CalMirror();
mirror.initialize().catch(console.error);