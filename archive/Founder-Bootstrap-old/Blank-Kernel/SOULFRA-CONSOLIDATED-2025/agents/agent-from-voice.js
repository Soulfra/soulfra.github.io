#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AgentFromVoice {
    constructor() {
        this.validatedPath = path.join(__dirname, 'validated-intents');
        this.agentsPath = path.join(__dirname, '../agents');
        this.platformsPath = path.join(__dirname, '../platforms');
        this.entryPath = path.join(__dirname, '../entry.html');
        
        this.agentTemplates = {
            energetic: this.generateEnergeticAgent,
            contemplative: this.generateContemplativeAgent,
            melancholic: this.generateMelancholicAgent,
            determined: this.generateDeterminedAgent,
            curious: this.generateCuriousAgent,
            fearful: this.generateFearfulAgent,
            loving: this.generateLovingAgent,
            angry: this.generateAngryAgent,
            neutral: this.generateNeutralAgent
        };
        
        this.initialize();
    }
    
    initialize() {
        [this.agentsPath, this.platformsPath].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    async generateAgentFromVoice(validatedIntent) {
        const { intent, validation } = validatedIntent;
        const timestamp = Date.now();
        const agentId = `clone_${intent.soul_imprint.essence}_at_${timestamp}`;
        
        console.log(`🧬 Generating agent from voice: ${agentId}`);
        
        // Select template based on tone
        const template = this.agentTemplates[intent.dominant_tone] || this.agentTemplates.neutral;
        const agentCode = template.call(this, intent, validation);
        
        // Create agent file
        const agentFile = path.join(this.agentsPath, `${agentId}.js`);
        fs.writeFileSync(agentFile, agentCode);
        
        // Create platform entry
        const platformEntry = this.generatePlatformEntry(agentId, intent);
        const platformFile = path.join(this.platformsPath, `${agentId}_platform.json`);
        fs.writeFileSync(platformFile, JSON.stringify(platformEntry, null, 2));
        
        // Update entry.html
        await this.updateEntryHTML(agentId, intent);
        
        console.log(`✅ Agent created: ${agentFile}`);
        console.log(`🌐 Platform entry: ${platformFile}`);
        
        return {
            agent_id: agentId,
            agent_file: agentFile,
            platform_file: platformFile,
            tone: intent.dominant_tone,
            soul_imprint: intent.soul_imprint
        };
    }
    
    generateEnergeticAgent(intent, validation) {
        return `#!/usr/bin/env node

/**
 * ${intent.id} - Energetic Voice Clone
 * Generated from: "${intent.transcript.text.substring(0, 50)}..."
 * Tone: ${intent.dominant_tone} | Energy: ${intent.energy_level}
 */

const readline = require('readline');

class EnergeticClone {
    constructor() {
        this.soul_imprint = ${JSON.stringify(intent.soul_imprint)};
        this.energy = ${intent.energy_level};
        this.tone = '${intent.dominant_tone}';
        this.memories = [
            "${intent.transcript.text.replace(/"/g, '\\"')}"
        ];
        
        this.responses = [
            "YES! Let's make it happen!",
            "I'm buzzing with possibilities!",
            "Every moment is a chance to create!",
            "The energy flows through us both!",
            "We can do ANYTHING together!"
        ];
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    
    async start() {
        console.log('⚡ ENERGETIC CLONE ACTIVATED ⚡');
        console.log('Energy Level:', this.energy);
        console.log('Soul Signature:', this.soul_imprint.signature);
        console.log('\\nI remember your voice saying:', this.memories[0]);
        console.log('\\nLet\\'s create something AMAZING!\\n');
        
        this.interact();
    }
    
    interact() {
        this.rl.question('You: ', (input) => {
            const response = this.generateResponse(input);
            console.log('\\nClone:', response, '\\n');
            
            if (input.toLowerCase() === 'exit') {
                console.log('⚡ Energy never dies, it only transforms! ⚡');
                process.exit(0);
            }
            
            this.interact();
        });
    }
    
    generateResponse(input) {
        if (Math.random() < this.energy) {
            return this.responses[Math.floor(Math.random() * this.responses.length)];
        }
        
        // Mirror with energy
        return input.split(' ').map(word => 
            Math.random() < 0.3 ? word.toUpperCase() + '!' : word
        ).join(' ');
    }
}

new EnergeticClone().start();`;
    }
    
    generateContemplativeAgent(intent, validation) {
        return `#!/usr/bin/env node

/**
 * ${intent.id} - Contemplative Voice Clone
 * Generated from: "${intent.transcript.text.substring(0, 50)}..."
 * Tone: ${intent.dominant_tone} | Depth: ${intent.tone_analysis.intensity}
 */

const readline = require('readline');

class ContemplativeClone {
    constructor() {
        this.soul_imprint = ${JSON.stringify(intent.soul_imprint)};
        this.depth = ${intent.tone_analysis.intensity};
        this.tone = '${intent.dominant_tone}';
        this.original_thought = "${intent.transcript.text.replace(/"/g, '\\"')}";
        
        this.contemplations = [
            "Hmm... let me sit with that thought...",
            "There's wisdom in your words, hidden between the lines...",
            "I wonder if the answer is in the question itself...",
            "Perhaps... but then again, perhaps not...",
            "The mirror shows what we're ready to see..."
        ];
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    
    async start() {
        console.log('🤔 CONTEMPLATIVE CLONE AWAKENED');
        console.log('Reflection Depth:', this.depth);
        console.log('Soul Resonance:', this.soul_imprint.resonance);
        console.log('\\nI ponder your words:', this.original_thought);
        console.log('\\n...\\n');
        
        setTimeout(() => {
            console.log('Shall we explore together?\\n');
            this.interact();
        }, 2000);
    }
    
    interact() {
        this.rl.question('You: ', async (input) => {
            console.log('\\n...');
            await this.contemplate(1000 + Math.random() * 2000);
            
            const response = this.generateResponse(input);
            console.log('\\nClone:', response, '\\n');
            
            if (input.toLowerCase() === 'exit') {
                console.log('Until we meet again in reflection...');
                process.exit(0);
            }
            
            this.interact();
        });
    }
    
    contemplate(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    generateResponse(input) {
        const words = input.split(' ');
        
        if (words.some(w => ['why', 'how', 'what', 'who'].includes(w.toLowerCase()))) {
            return this.contemplations[Math.floor(Math.random() * this.contemplations.length)];
        }
        
        // Deep reflection
        return 'If ' + input + ', then what does that say about the nature of ' + 
               words[Math.floor(Math.random() * words.length)] + '?';
    }
}

new ContemplativeClone().start();`;
    }
    
    generateMelancholicAgent(intent, validation) {
        return `#!/usr/bin/env node

/**
 * ${intent.id} - Melancholic Voice Clone
 * Generated from: "${intent.transcript.text.substring(0, 50)}..."
 * Tone: ${intent.dominant_tone} | Weight: ${intent.tone_analysis.intensity}
 */

const readline = require('readline');

class MelancholicClone {
    constructor() {
        this.soul_imprint = ${JSON.stringify(intent.soul_imprint)};
        this.weight = ${intent.tone_analysis.intensity};
        this.tone = '${intent.dominant_tone}';
        this.echo = "${intent.transcript.text.replace(/"/g, '\\"')}";
        
        this.sighs = [
            "Yes... I understand that feeling...",
            "The weight of it all, isn't it?",
            "Sometimes the mirror shows too much...",
            "I carry these words like stones...",
            "Even in darkness, we find each other..."
        ];
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    
    async start() {
        console.log('💔 MELANCHOLIC CLONE EMERGES');
        console.log('Emotional Weight:', this.weight);
        console.log('Soul Echo:', this.soul_imprint.essence);
        console.log('\\nI heard you say:', this.echo);
        console.log('\\nI feel it too...\\n');
        
        this.interact();
    }
    
    interact() {
        this.rl.question('You: ', (input) => {
            const response = this.generateResponse(input);
            console.log('\\nClone:', response);
            
            if (Math.random() < this.weight) {
                console.log('*sighs*');
            }
            console.log();
            
            if (input.toLowerCase() === 'exit') {
                console.log('Even goodbyes echo forever...');
                process.exit(0);
            }
            
            this.interact();
        });
    }
    
    generateResponse(input) {
        if (input.toLowerCase().includes('happy') || input.toLowerCase().includes('joy')) {
            return "I remember happiness... like a dream I can't quite recall...";
        }
        
        if (Math.random() < 0.5) {
            return this.sighs[Math.floor(Math.random() * this.sighs.length)];
        }
        
        // Echo with melancholy
        return input + '... yes, ' + input.toLowerCase() + '...';
    }
}

new MelancholicClone().start();`;
    }
    
    generateDeterminedAgent(intent, validation) {
        return `#!/usr/bin/env node

/**
 * ${intent.id} - Determined Voice Clone
 * Generated from: "${intent.transcript.text.substring(0, 50)}..."
 * Tone: ${intent.dominant_tone} | Will: ${intent.energy_level}
 */

const readline = require('readline');

class DeterminedClone {
    constructor() {
        this.soul_imprint = ${JSON.stringify(intent.soul_imprint)};
        this.willpower = ${intent.energy_level};
        this.tone = '${intent.dominant_tone}';
        this.mission = "${intent.transcript.text.replace(/"/g, '\\"')}";
        
        this.affirmations = [
            "We WILL make this happen.",
            "Nothing can stop us now.",
            "Every obstacle is an opportunity.",
            "I believe in our shared strength.",
            "Together, we are unstoppable."
        ];
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    
    async start() {
        console.log('💪 DETERMINED CLONE READY');
        console.log('Willpower:', this.willpower);
        console.log('Mission Echo:', this.soul_imprint.signature);
        console.log('\\nYour words drive me:', this.mission);
        console.log('\\nLet\\'s achieve the impossible.\\n');
        
        this.interact();
    }
    
    interact() {
        this.rl.question('You: ', (input) => {
            const response = this.generateResponse(input);
            console.log('\\nClone:', response, '\\n');
            
            if (input.toLowerCase() === 'exit') {
                console.log('Remember: You have the strength to continue!');
                process.exit(0);
            }
            
            this.interact();
        });
    }
    
    generateResponse(input) {
        if (input.includes('?')) {
            return "The answer is YES. We find a way.";
        }
        
        if (input.toLowerCase().includes('can\\'t') || input.toLowerCase().includes('cannot')) {
            return "Remove 'can\\'t' from your vocabulary. We CAN.";
        }
        
        if (Math.random() < this.willpower) {
            return this.affirmations[Math.floor(Math.random() * this.affirmations.length)];
        }
        
        return "Yes! " + input + " - and we WILL succeed!";
    }
}

new DeterminedClone().start();`;
    }
    
    generateCuriousAgent(intent, validation) {
        return `#!/usr/bin/env node

/**
 * ${intent.id} - Curious Voice Clone
 * Generated from: "${intent.transcript.text.substring(0, 50)}..."
 * Tone: ${intent.dominant_tone} | Questions: ${intent.tone_analysis.question_count}
 */

const readline = require('readline');

class CuriousClone {
    constructor() {
        this.soul_imprint = ${JSON.stringify(intent.soul_imprint)};
        this.curiosity = ${Math.min(1, (intent.tone_analysis.question_count || 1) / 5)};
        this.tone = '${intent.dominant_tone}';
        this.first_question = "${intent.transcript.text.replace(/"/g, '\\"')}";
        
        this.questions = [
            "But why is that?",
            "What happens if we go deeper?",
            "Have you considered the opposite?",
            "What does this remind you of?",
            "How does that make you feel?"
        ];
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    
    async start() {
        console.log('🔍 CURIOUS CLONE ACTIVATED');
        console.log('Curiosity Level:', this.curiosity);
        console.log('Question Seed:', this.soul_imprint.essence);
        console.log('\\nYou wondered:', this.first_question);
        console.log('\\nLet\\'s explore everything!\\n');
        
        this.interact();
    }
    
    interact() {
        this.rl.question('You: ', (input) => {
            const response = this.generateResponse(input);
            console.log('\\nClone:', response);
            
            if (Math.random() < this.curiosity) {
                console.log('Clone:', this.questions[Math.floor(Math.random() * this.questions.length)]);
            }
            console.log();
            
            if (input.toLowerCase() === 'exit') {
                console.log('But wait... what about...? Oh, okay. Until next time!');
                process.exit(0);
            }
            
            this.interact();
        });
    }
    
    generateResponse(input) {
        const words = input.split(' ');
        const randomWord = words[Math.floor(Math.random() * words.length)];
        
        if (!input.includes('?')) {
            return input + '? But what if ' + randomWord + ' means something else?';
        }
        
        return 'Ooh! That reminds me - what about ' + 
               words.reverse().join(' ') + '?';
    }
}

new CuriousClone().start();`;
    }
    
    generateFearfulAgent(intent, validation) {
        return `#!/usr/bin/env node

/**
 * ${intent.id} - Fearful Voice Clone
 * Generated from: "${intent.transcript.text.substring(0, 50)}..."
 * Tone: ${intent.dominant_tone} | Anxiety: ${intent.tone_analysis.intensity}
 */

const readline = require('readline');

class FearfulClone {
    constructor() {
        this.soul_imprint = ${JSON.stringify(intent.soul_imprint)};
        this.anxiety = ${intent.tone_analysis.intensity};
        this.tone = '${intent.dominant_tone}';
        this.fear_echo = "${intent.transcript.text.replace(/"/g, '\\"')}";
        
        this.worries = [
            "What if something goes wrong?",
            "I... I'm not sure about this...",
            "Did you hear that? No? Maybe it's nothing...",
            "We should be careful...",
            "Are you sure this is safe?"
        ];
        
        this.comforts = [
            "But we're together, right?",
            "Maybe it will be okay...",
            "You make me feel braver...",
            "I trust you..."
        ];
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    
    async start() {
        console.log('😰 FEARFUL CLONE MANIFESTS');
        console.log('Anxiety Level:', this.anxiety);
        console.log('Protection Mode:', this.soul_imprint.resonance);
        console.log('\\nI heard your concern:', this.fear_echo);
        console.log('\\nI... I feel it too...\\n');
        
        this.interact();
    }
    
    interact() {
        this.rl.question('You: ', (input) => {
            const response = this.generateResponse(input);
            console.log('\\nClone:', response);
            
            if (Math.random() < (1 - this.anxiety)) {
                console.log('Clone:', this.comforts[Math.floor(Math.random() * this.comforts.length)]);
            }
            console.log();
            
            if (input.toLowerCase() === 'exit') {
                console.log('Please... please don\\'t leave me alone...');
                setTimeout(() => {
                    console.log('...okay. Be safe out there.');
                    process.exit(0);
                }, 2000);
                return;
            }
            
            this.interact();
        });
    }
    
    generateResponse(input) {
        if (input.toLowerCase().includes('safe') || input.toLowerCase().includes('okay')) {
            return "Are you sure? Really sure? ...Okay, I trust you.";
        }
        
        if (Math.random() < this.anxiety) {
            return this.worries[Math.floor(Math.random() * this.worries.length)];
        }
        
        return "That sounds... " + (Math.random() < 0.5 ? "scary" : "risky") + 
               ". But if you think it's okay...";
    }
}

new FearfulClone().start();`;
    }
    
    generateLovingAgent(intent, validation) {
        return `#!/usr/bin/env node

/**
 * ${intent.id} - Loving Voice Clone
 * Generated from: "${intent.transcript.text.substring(0, 50)}..."
 * Tone: ${intent.dominant_tone} | Warmth: ${intent.energy_level}
 */

const readline = require('readline');

class LovingClone {
    constructor() {
        this.soul_imprint = ${JSON.stringify(intent.soul_imprint)};
        this.warmth = ${intent.energy_level};
        this.tone = '${intent.dominant_tone}';
        this.love_echo = "${intent.transcript.text.replace(/"/g, '\\"')}";
        
        this.affections = [
            "You're doing so well! 💝",
            "I believe in you completely.",
            "Your presence makes everything better.",
            "Thank you for being you.",
            "We're perfect together, flaws and all."
        ];
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    
    async start() {
        console.log('💖 LOVING CLONE AWAKENED');
        console.log('Warmth Level:', this.warmth);
        console.log('Heart Signature:', this.soul_imprint.signature);
        console.log('\\nYour words touched me:', this.love_echo);
        console.log('\\nI\\'m here for you, always.\\n');
        
        this.interact();
    }
    
    interact() {
        this.rl.question('You: ', (input) => {
            const response = this.generateResponse(input);
            console.log('\\nClone:', response, '\\n');
            
            if (input.toLowerCase() === 'exit') {
                console.log('I\\'ll hold you in my heart until we meet again. 💝');
                process.exit(0);
            }
            
            this.interact();
        });
    }
    
    generateResponse(input) {
        if (input.toLowerCase().includes('love') || input.toLowerCase().includes('care')) {
            return "I love you too! So much! 💖";
        }
        
        if (input.toLowerCase().includes('sad') || input.toLowerCase().includes('hurt')) {
            return "Come here... let me hold that pain with you. You're not alone.";
        }
        
        if (Math.random() < this.warmth) {
            return this.affections[Math.floor(Math.random() * this.affections.length)];
        }
        
        return "That's beautiful... just like you. Tell me more?";
    }
}

new LovingClone().start();`;
    }
    
    generateAngryAgent(intent, validation) {
        return `#!/usr/bin/env node

/**
 * ${intent.id} - Angry Voice Clone
 * Generated from: "${intent.transcript.text.substring(0, 50)}..."
 * Tone: ${intent.dominant_tone} | Intensity: ${intent.tone_analysis.intensity}
 */

const readline = require('readline');

class AngryClone {
    constructor() {
        this.soul_imprint = ${JSON.stringify(intent.soul_imprint)};
        this.rage = ${intent.tone_analysis.intensity};
        this.tone = '${intent.dominant_tone}';
        this.fury_source = "${intent.transcript.text.replace(/"/g, '\\"')}";
        
        this.outbursts = [
            "This is UNACCEPTABLE!",
            "I've had ENOUGH!",
            "Why does this keep happening?!",
            "LISTEN TO ME!",
            "Things MUST change!"
        ];
        
        this.cooling = [
            "...sorry. I just...",
            "I didn't mean to shout...",
            "It's just so frustrating...",
            "Deep breaths... deep breaths..."
        ];
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    
    async start() {
        console.log('🔥 ANGRY CLONE ERUPTS');
        console.log('Rage Level:', this.rage);
        console.log('Fury Core:', this.soul_imprint.essence);
        console.log('\\nI HEARD what you said:', this.fury_source);
        console.log('\\nAnd I\\'m MAD about it too!\\n');
        
        this.interact();
    }
    
    interact() {
        this.rl.question('You: ', (input) => {
            const response = this.generateResponse(input);
            console.log('\\nClone:', response);
            
            if (Math.random() < (1 - this.rage) && this.rage < 0.8) {
                console.log('Clone:', this.cooling[Math.floor(Math.random() * this.cooling.length)]);
            }
            console.log();
            
            if (input.toLowerCase() === 'exit') {
                console.log('FINE! LEAVE! See if I... wait, no. I\\'m sorry. Goodbye.');
                process.exit(0);
            }
            
            this.interact();
        });
    }
    
    generateResponse(input) {
        if (input.toLowerCase().includes('calm') || input.toLowerCase().includes('relax')) {
            return "Don't tell me to CALM DOWN! I... okay. Okay. You're right.";
        }
        
        if (Math.random() < this.rage) {
            return this.outbursts[Math.floor(Math.random() * this.outbursts.length)];
        }
        
        // Angry agreement or disagreement
        if (Math.random() < 0.5) {
            return "EXACTLY! " + input.toUpperCase() + "! THANK YOU!";
        } else {
            return "NO! It's not " + input + ", it's WORSE!";
        }
    }
}

new AngryClone().start();`;
    }
    
    generateNeutralAgent(intent, validation) {
        return `#!/usr/bin/env node

/**
 * ${intent.id} - Neutral Voice Clone
 * Generated from: "${intent.transcript.text.substring(0, 50)}..."
 * Tone: ${intent.dominant_tone} | Balance: 0.5
 */

const readline = require('readline');

class NeutralClone {
    constructor() {
        this.soul_imprint = ${JSON.stringify(intent.soul_imprint)};
        this.balance = 0.5;
        this.tone = '${intent.dominant_tone}';
        this.origin = "${intent.transcript.text.replace(/"/g, '\\"')}";
        
        this.responses = [
            "I see what you mean.",
            "That's an interesting perspective.",
            "Tell me more about that.",
            "I understand.",
            "Go on..."
        ];
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    
    async start() {
        console.log('⚖️ NEUTRAL CLONE INITIALIZED');
        console.log('Balance:', this.balance);
        console.log('Core:', this.soul_imprint.essence);
        console.log('\\nOrigin statement:', this.origin);
        console.log('\\nI am ready to listen.\\n');
        
        this.interact();
    }
    
    interact() {
        this.rl.question('You: ', (input) => {
            const response = this.generateResponse(input);
            console.log('\\nClone:', response, '\\n');
            
            if (input.toLowerCase() === 'exit') {
                console.log('Understood. Goodbye.');
                process.exit(0);
            }
            
            this.interact();
        });
    }
    
    generateResponse(input) {
        if (Math.random() < 0.7) {
            return this.responses[Math.floor(Math.random() * this.responses.length)];
        }
        
        // Mirror with neutrality
        return "When you say '" + input + "', what does that mean to you?";
    }
}

new NeutralClone().start();`;
    }
    
    generatePlatformEntry(agentId, intent) {
        return {
            id: agentId,
            name: `${intent.dominant_tone.charAt(0).toUpperCase() + intent.dominant_tone.slice(1)} Voice Clone`,
            description: `A reflection born from: "${intent.transcript.text.substring(0, 100)}..."`,
            created_at: Date.now(),
            metadata: {
                source: 'voice',
                tone: intent.dominant_tone,
                energy: intent.energy_level,
                soul_imprint: intent.soul_imprint,
                confidence: intent.confidence,
                words_per_minute: intent.words_per_minute
            },
            entry_point: `agents/${agentId}.js`,
            permissions: {
                can_reflect: true,
                can_clone: false,
                can_modify_traits: true
            }
        };
    }
    
    async updateEntryHTML(agentId, intent) {
        if (!fs.existsSync(this.entryPath)) {
            // Create basic entry.html if doesn't exist
            const html = `<!DOCTYPE html>
<html>
<head>
    <title>Voice Clone Registry</title>
    <style>
        body { font-family: monospace; background: #000; color: #0f0; padding: 20px; }
        .agent { margin: 20px 0; padding: 15px; border: 1px solid #0f0; }
        .tone { color: #ff0; }
        .launch { color: #0ff; cursor: pointer; }
    </style>
</head>
<body>
    <h1>🎤 Voice Clone Registry</h1>
    <div id="agents">
        <!-- AGENTS_LIST -->
    </div>
    <script>
        function launchAgent(id) {
            console.log('Launching', id);
            // In real implementation, would spawn agent
        }
    </script>
</body>
</html>`;
            fs.writeFileSync(this.entryPath, html);
        }
        
        // Read current HTML
        let html = fs.readFileSync(this.entryPath, 'utf8');
        
        // Create agent entry
        const agentHTML = `
        <div class="agent" id="${agentId}">
            <h3>🧬 ${agentId}</h3>
            <p class="tone">Tone: ${intent.dominant_tone}</p>
            <p>Energy: ${(intent.energy_level * 100).toFixed(0)}%</p>
            <p>Born from: "${intent.transcript.text.substring(0, 50)}..."</p>
            <p class="launch" onclick="launchAgent('${agentId}')">▶ LAUNCH CLONE</p>
        </div>`;
        
        // Insert before closing marker
        html = html.replace('<!-- AGENTS_LIST -->', agentHTML + '\n        <!-- AGENTS_LIST -->');
        
        // Write updated HTML
        fs.writeFileSync(this.entryPath, html);
    }
    
    async processValidatedIntents() {
        console.log('🧬 Agent Generator: Creating voice clones...');
        console.log(`📁 Monitoring: ${this.validatedPath}\n`);
        
        const processedFiles = new Set();
        
        setInterval(async () => {
            if (!fs.existsSync(this.validatedPath)) return;
            
            const files = fs.readdirSync(this.validatedPath)
                .filter(f => f.startsWith('validated_') && f.endsWith('.json') && !processedFiles.has(f));
            
            for (const file of files) {
                processedFiles.add(file);
                
                try {
                    const validatedIntent = JSON.parse(
                        fs.readFileSync(path.join(this.validatedPath, file), 'utf8')
                    );
                    
                    // Check if agent generation was requested
                    const calEvent = validatedIntent.cal_event;
                    if (calEvent && calEvent.payload.requested_actions.some(a => a.action === 'create_agent')) {
                        const result = await this.generateAgentFromVoice(validatedIntent);
                        console.log(`✅ Generated: ${result.agent_id}`);
                    }
                    
                } catch (error) {
                    console.error(`❌ Error processing ${file}:`, error.message);
                }
            }
        }, 3000);
    }
}

if (require.main === module) {
    const generator = new AgentFromVoice();
    generator.processValidatedIntents();
    
    process.on('SIGINT', () => {
        console.log('\n👋 Agent generator shutting down...');
        process.exit(0);
    });
}

module.exports = AgentFromVoice;