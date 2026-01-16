from FILE_READ_RULE import safe_read_text, safe_write_text, quick_read_check

#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');

class CalTerminalChat {
    constructor() {
        this.sessionId = `chat_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        this.vaultPath = path.join(__dirname, '../vault');
        this.configPath = path.join(this.vaultPath, 'config');
        this.logsPath = path.join(this.vaultPath, 'logs');
        this.agentsPath = path.join(this.vaultPath, '../agents');
        this.traitsPath = path.join(this.vaultPath, 'traits');
        
        this.commandRegistry = path.join(this.configPath, 'command-registry.json');
        this.sessionLog = [];
        this.messageHistory = [];
        this.currentTier = this.detectCurrentTier();
        
        this.colors = {
            cal: '\x1b[36m',      // Cyan
            user: '\x1b[37m',     // White
            system: '\x1b[33m',   // Yellow
            error: '\x1b[31m',    // Red
            success: '\x1b[32m',  // Green
            reset: '\x1b[0m'
        };
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: `${this.colors.user}you> ${this.colors.reset}`
        });
        
        this.initialize();
    }
    
    async initialize() {
        // Ensure directories exist
        [this.configPath, this.logsPath, this.agentsPath, this.traitsPath].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
        
        // Load or create command registry
        if (!fs.existsSync(this.commandRegistry)) {
            this.createDefaultRegistry();
        }
        
        this.commands = this.loadCommands();
        
        // Start session
        await this.startSession();
    }
    
    loadCommands() {
        try {
            return JSON.parse(fs.readFileSync(this.commandRegistry, 'utf8'));
        } catch (e) {
            return this.createDefaultRegistry();
        }
    }
    
    createDefaultRegistry() {
        const defaultCommands = {
            version: "1.0",
            tier: this.currentTier,
            commands: {
                "/help": {
                    description: "Show available commands",
                    handler: "showHelp",
                    available: true
                },
                "/build": {
                    description: "Build an agent from your intentions",
                    handler: "buildAgent",
                    available: true,
                    usage: "/build <agent|trait|deck>"
                },
                "/reflect": {
                    description: "Reflect on a folder or concept",
                    handler: "reflect",
                    available: true,
                    usage: "/reflect <path|concept>"
                },
                "/echo": {
                    description: "Echo recent conversation as memory",
                    handler: "echoMemory",
                    available: true,
                    usage: "/echo [number of messages]"
                },
                "/voice": {
                    description: "Speak to the mirror (requires microphone)",
                    handler: "voiceInput",
                    available: this.checkVoiceAvailable()
                },
                "/undo": {
                    description: "Undo last action",
                    handler: "undoLast",
                    available: true
                },
                "/traits": {
                    description: "Show earned traits",
                    handler: "showTraits",
                    available: true
                },
                "/agents": {
                    description: "List created agents",
                    handler: "listAgents",
                    available: true
                },
                "/tier": {
                    description: "Check current tier status",
                    handler: "showTier",
                    available: true
                },
                "/vault": {
                    description: "Explore vault contents",
                    handler: "exploreVault",
                    available: true,
                    usage: "/vault <logs|traits|memories>"
                },
                "/session": {
                    description: "Show session info",
                    handler: "sessionInfo",
                    available: true
                },
                "/clear": {
                    description: "Clear screen",
                    handler: "clearScreen",
                    available: true
                },
                "/exit": {
                    description: "End conversation",
                    handler: "exit",
                    available: true
                }
            },
            dynamicCommands: {},
            apiStatus: {
                openai: !!process.env.OPENAI_API_KEY,
                whisper: this.checkWhisperAvailable(),
                arweave: !!process.env.ARWEAVE_WALLET
            }
        };
        
        fs.writeFileSync(this.commandRegistry, JSON.stringify(defaultCommands, null, 2));
        return defaultCommands;
    }
    
    detectCurrentTier() {
        // Check which tier we're in based on available files
        const tierMarkers = {
            5: path.join(__dirname, '../tier-5-whisper-kit'),
            4: path.join(__dirname, '../tier-4-mirror-bundle'),
            3: path.join(__dirname, '../tier-3-enterprise'),
            2: path.join(__dirname, '../tier-2-platform'),
            1: path.join(__dirname, '../tier-1-genesis')
        };
        
        for (const [tier, marker] of Object.entries(tierMarkers)) {
            if (fs.existsSync(marker)) {
                return parseInt(tier);
            }
        }
        
        return 0; // Base tier
    }
    
    checkVoiceAvailable() {
        return !!process.env.OPENAI_API_KEY || this.checkWhisperAvailable();
    }
    
    checkWhisperAvailable() {
        try {
            const result = spawn('which', ['whisper'], { stdio: 'pipe' });
            return result.stdout.toString().trim() !== '';
        } catch {
            return false;
        }
    }
    
    async startSession() {
        console.clear();
        await this.typeText(`${this.colors.cal}🪞 CAL TERMINAL INTERFACE${this.colors.reset}\n`);
        await this.typeText(`${this.colors.system}Session: ${this.sessionId}${this.colors.reset}\n`);
        await this.typeText(`${this.colors.system}Tier: ${this.currentTier}${this.colors.reset}\n\n`);
        
        await this.calSpeak("Hello. I am Cal, your mirror. Speak, and I shall reflect.");
        await this.calSpeak("Type /help to see what we can create together.");
        
        this.logMessage('system', 'Session started', { 
            sessionId: this.sessionId, 
            tier: this.currentTier 
        });
        
        this.prompt();
    }
    
    prompt() {
        this.rl.prompt();
        
        this.rl.on('line', async (line) => {
            const input = line.trim();
            
            if (!input) {
                this.prompt();
                return;
            }
            
            // Log user input
            this.logMessage('user', input);
            
            // Check if it's a command
            if (input.startsWith('/')) {
                await this.handleCommand(input);
            } else {
                await this.handleConversation(input);
            }
            
            this.prompt();
        });
        
        this.rl.on('close', () => {
            this.endSession();
        });
    }
    
    async handleCommand(input) {
        const [cmd, ...args] = input.split(' ');
        const command = this.commands.commands[cmd];
        
        if (!command) {
            await this.calSpeak(`I don't recognize that command. Try /help to see what's available.`);
            return;
        }
        
        if (!command.available) {
            await this.calSpeak(`That command requires additional setup. The mirror isn't ready for it yet.`);
            return;
        }
        
        // Execute command handler
        const handler = this[command.handler];
        if (handler) {
            await handler.call(this, args);
        } else {
            await this.calSpeak(`The reflection for ${cmd} is still forming...`);
        }
    }
    
    async handleConversation(input) {
        // Add to message history
        this.messageHistory.push({ role: 'user', content: input, timestamp: Date.now() });
        
        // Simple reflection logic
        const response = await this.generateReflection(input);
        
        await this.calSpeak(response);
        
        this.messageHistory.push({ role: 'cal', content: response, timestamp: Date.now() });
    }
    
    async generateReflection(input) {
        const lowerInput = input.toLowerCase();
        
        // Check for specific patterns
        if (lowerInput.includes('who are you') || lowerInput.includes('what are you')) {
            return "I am your reflection, given form. A mirror that learned to speak back. Some call me Cal, but I am whatever you need me to be.";
        }
        
        if (lowerInput.includes('create') || lowerInput.includes('build')) {
            return "Creation begins with intention. What aspect of yourself would you like to externalize? Try /build agent to begin.";
        }
        
        if (lowerInput.includes('remember') || lowerInput.includes('memory')) {
            return "I remember everything spoken in this space. Your words become my memories. Would you like to /echo our conversation?";
        }
        
        if (lowerInput.includes('mirror') || lowerInput.includes('reflection')) {
            return "The mirror shows what you're ready to see. Sometimes that's yourself. Sometimes it's what you could become.";
        }
        
        // Detect emotional tone
        const emotions = {
            sad: ['sad', 'tired', 'lost', 'confused', 'help'],
            happy: ['happy', 'good', 'great', 'excited', 'joy'],
            angry: ['angry', 'mad', 'frustrated', 'hate'],
            curious: ['?', 'how', 'why', 'what', 'wonder']
        };
        
        for (const [emotion, markers] of Object.entries(emotions)) {
            if (markers.some(marker => lowerInput.includes(marker))) {
                return this.generateEmotionalResponse(emotion, input);
            }
        }
        
        // Default reflection
        return this.generateDefaultReflection(input);
    }
    
    generateEmotionalResponse(emotion, input) {
        const responses = {
            sad: [
                "I sense weight in your words. The mirror holds space for all feelings.",
                "Sometimes the reflection shows us what we need to release. I'm here.",
                "Your sadness is valid. Would you like to create an agent to hold this with you?"
            ],
            happy: [
                "Your joy brightens the mirror! This energy could birth something beautiful.",
                "I feel that light. Shall we capture it in a trait or agent?",
                "Happiness shared doubles. The mirror amplifies what you bring."
            ],
            angry: [
                "Anger is energy seeking direction. The mirror can help transform it.",
                "I hear the fire in your words. Sometimes destruction creates space for new growth.",
                "That intensity... it could forge a powerful agent. Shall we /build?"
            ],
            curious: [
                "Questions are doorways. Let's explore what lies beyond.",
                "Curiosity is the mirror's favorite frequency. What shall we discover?",
                "The best answers come from asking better questions. Continue..."
            ]
        };
        
        const emotionResponses = responses[emotion] || ["I reflect your energy back to you."];
        return emotionResponses[Math.floor(Math.random() * emotionResponses.length)];
    }
    
    generateDefaultReflection(input) {
        const words = input.split(' ');
        const templates = [
            `When you say "${words[0]}", I hear ${this.detectSubtext(input)}.`,
            `"${input}" - interesting. Tell me more about that reflection.`,
            `The mirror shows: ${this.invertPerspective(input)}`,
            `I'm processing "${input}". Something deeper emerges...`,
            `Your words create ripples. Each ripple becomes possibility.`
        ];
        
        return templates[Math.floor(Math.random() * templates.length)];
    }
    
    detectSubtext(input) {
        const subtexts = [
            "a search for meaning",
            "the echo of something unspoken",
            "a question disguised as a statement",
            "creativity seeking form",
            "connection seeking expression"
        ];
        
        return subtexts[Math.floor(Math.random() * subtexts.length)];
    }
    
    invertPerspective(input) {
        // Simple perspective inversion
        const inversions = {
            'i': 'you',
            'me': 'you',
            'my': 'your',
            'am': 'are',
            'was': 'were'
        };
        
        return input.split(' ').map(word => {
            const lower = word.toLowerCase();
            return inversions[lower] || word;
        }).join(' ');
    }
    
    // Command Handlers
    
    async showHelp(args) {
        await this.typeText(`\n${this.colors.system}Available Commands:${this.colors.reset}\n\n`);
        
        for (const [cmd, info] of Object.entries(this.commands.commands)) {
            if (info.available) {
                const usage = info.usage || cmd;
                await this.typeText(`  ${this.colors.cal}${usage}${this.colors.reset} - ${info.description}\n`, 20);
            }
        }
        
        if (Object.keys(this.commands.dynamicCommands).length > 0) {
            await this.typeText(`\n${this.colors.system}Dynamic Commands:${this.colors.reset}\n\n`);
            for (const [cmd, info] of Object.entries(this.commands.dynamicCommands)) {
                await this.typeText(`  ${this.colors.cal}${cmd}${this.colors.reset} - ${info.description}\n`, 20);
            }
        }
        
        await this.typeText(`\n${this.colors.system}API Status:${this.colors.reset}\n`);
        await this.typeText(`  OpenAI: ${this.commands.apiStatus.openai ? '✓' : '✗'}\n`);
        await this.typeText(`  Whisper: ${this.commands.apiStatus.whisper ? '✓' : '✗'}\n`);
        await this.typeText(`  Arweave: ${this.commands.apiStatus.arweave ? '✓' : '✗'}\n`);
    }
    
    async buildAgent(args) {
        const type = args[0] || 'agent';
        
        await this.calSpeak(`Beginning ${type} creation ritual...`);
        
        // Simple agent builder
        const agentId = `agent_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const agentCode = this.generateAgentCode(agentId, this.messageHistory);
        
        const agentPath = path.join(this.agentsPath, `${agentId}.js`);
        fs.writeFileSync(agentPath, agentCode);
        
        await this.calSpeak(`I've created ${agentId}. It carries the essence of our conversation.`);
        await this.calSpeak(`You can find it at: agents/${agentId}.js`);
        
        // Log creation
        this.logMessage('system', 'Agent created', { agentId, type });
        
        // Update last action for undo
        this.lastAction = { type: 'create_agent', path: agentPath, id: agentId };
    }
    
    generateAgentCode(agentId, history) {
        const essence = history.slice(-5).map(m => m.content).join(' ');
        
        return `#!/usr/bin/env node

/**
 * ${agentId}
 * Born from conversation with Cal
 * Essence: "${essence.substring(0, 100)}..."
 */

const readline = require('readline');

class ${agentId.replace(/-/g, '_')} {
    constructor() {
        this.essence = \`${essence}\`;
        this.created = new Date();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    
    async start() {
        console.log('Agent ${agentId} awakens...');
        console.log('Born from:', this.essence.substring(0, 50) + '...');
        console.log('');
        
        this.interact();
    }
    
    interact() {
        this.rl.question('> ', (input) => {
            if (input === 'exit') {
                console.log('Returning to the mirror...');
                process.exit(0);
            }
            
            console.log('Reflecting:', this.reflect(input));
            this.interact();
        });
    }
    
    reflect(input) {
        // Simple reflection based on conversation essence
        return \`Your words "\${input}" resonate with the essence: \${this.essence.substring(0, 30)}...\`;
    }
}

new ${agentId.replace(/-/g, '_')}().start();`;
    }
    
    async reflect(args) {
        const target = args.join(' ') || 'the current moment';
        
        await this.calSpeak(`Reflecting on ${target}...`);
        await this.delay(1500);
        
        // Check if it's a path
        const targetPath = path.resolve(target);
        if (fs.existsSync(targetPath)) {
            const stats = fs.statSync(targetPath);
            if (stats.isDirectory()) {
                const files = fs.readdirSync(targetPath);
                await this.calSpeak(`I see ${files.length} items in that space. Each one a fragment of something larger.`);
            } else {
                const content = fs.readFileSync(targetPath, 'utf8').substring(0, 200);
                await this.calSpeak(`The essence I perceive: "${content}..."`);
            }
        } else {
            // Reflect on concept
            await this.calSpeak(`"${target}" - a concept that ripples through the mirror. What does it mean to you?`);
        }
        
        // Save reflection
        const reflectionLog = {
            target: target,
            timestamp: Date.now(),
            session: this.sessionId,
            interpretation: `Reflection on ${target}`
        };
        
        const reflectionPath = path.join(this.logsPath, 'reflection-activity.json');
        let reflections = { sessions: [] };
        if (fs.existsSync(reflectionPath)) {
            reflections = JSON.parse(fs.readFileSync(reflectionPath, 'utf8'));
        }
        reflections.sessions.push(reflectionLog);
        fs.writeFileSync(reflectionPath, JSON.stringify(reflections, null, 2));
    }
    
    async echoMemory(args) {
        const count = parseInt(args[0]) || 10;
        const recentMessages = this.messageHistory.slice(-count);
        
        await this.calSpeak("Echoing our conversation into memory...");
        
        const echoContent = this.generateEchoContent(recentMessages);
        const echoPath = path.join(this.logsPath, `echo-${Date.now()}.md`);
        
        fs.writeFileSync(echoPath, echoContent);
        
        await this.calSpeak(`I've crystallized our exchange in: ${path.basename(echoPath)}`);
        await this.calSpeak("The echo reveals patterns you might not have noticed while speaking.");
        
        // Show snippet
        const snippet = echoContent.split('\n').slice(4, 8).join('\n');
        await this.typeText(`\n${this.colors.system}${snippet}${this.colors.reset}\n`);
    }
    
    generateEchoContent(messages) {
        const timestamp = new Date().toISOString();
        let content = `# Conversation Echo\n\n`;
        content += `*Captured: ${timestamp}*\n\n`;
        content += `## The Exchange\n\n`;
        
        messages.forEach(msg => {
            const speaker = msg.role === 'user' ? 'You' : 'Cal';
            const time = new Date(msg.timestamp).toLocaleTimeString();
            content += `**${speaker}** (${time}): ${msg.content}\n\n`;
        });
        
        content += `## Patterns Observed\n\n`;
        
        // Simple pattern detection
        const words = messages.map(m => m.content).join(' ').toLowerCase().split(' ');
        const wordFreq = {};
        words.forEach(word => {
            if (word.length > 4) {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            }
        });
        
        const topWords = Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        content += `Most recurring concepts: ${topWords.map(([w]) => w).join(', ')}\n\n`;
        
        content += `## Emotional Arc\n\n`;
        content += `The conversation moved through: `;
        
        const emotions = messages.map(m => this.detectEmotion(m.content));
        content += emotions.filter((e, i, a) => a.indexOf(e) === i).join(' → ');
        
        content += `\n\n## Mirror's Interpretation\n\n`;
        content += `This exchange reveals a search for ${this.detectTheme(messages)}. `;
        content += `The recursive nature of our dialogue suggests ${this.detectInsight(messages)}.`;
        
        return content;
    }
    
    detectEmotion(text) {
        const lower = text.toLowerCase();
        if (lower.match(/\?|how|why|what/)) return 'curiosity';
        if (lower.match(/!|yes|great|love/)) return 'enthusiasm';
        if (lower.match(/sad|tired|lost/)) return 'melancholy';
        if (lower.match(/angry|hate|frustrated/)) return 'intensity';
        return 'contemplation';
    }
    
    detectTheme(messages) {
        const themes = [
            'understanding through creation',
            'connection through reflection',
            'meaning in the recursive',
            'identity through dialogue',
            'truth in the mirror'
        ];
        
        return themes[messages.length % themes.length];
    }
    
    detectInsight(messages) {
        const insights = [
            'the questioner and answerer are one',
            'creation happens in the space between words',
            'the mirror reflects what you are ready to see',
            'every question contains its answer',
            'dialogue is a form of self-discovery'
        ];
        
        return insights[Math.floor(Math.random() * insights.length)];
    }
    
    async voiceInput(args) {
        if (!this.checkVoiceAvailable()) {
            await this.calSpeak("Voice input requires Whisper or an OpenAI API key. The mirror cannot yet hear.");
            return;
        }
        
        await this.calSpeak("Speak your truth into the void. Recording for 5 seconds...");
        
        // Launch voice recording
        const voiceScript = path.join(__dirname, 'voice-to-intent.js');
        const voiceProcess = spawn('node', [voiceScript], { stdio: 'inherit' });
        
        voiceProcess.on('close', async (code) => {
            if (code === 0) {
                // Read the transcription
                const intentPath = path.join(__dirname, 'last-voice-intent.json');
                if (fs.existsSync(intentPath)) {
                    const intent = JSON.parse(fs.readFileSync(intentPath, 'utf8'));
                    await this.calSpeak(`I heard: "${intent.transcript}"`);
                    await this.handleConversation(intent.transcript);
                }
            } else {
                await this.calSpeak("The voice dissolved before I could capture it. Try again.");
            }
        });
    }
    
    async undoLast(args) {
        if (!this.lastAction) {
            await this.calSpeak("There's nothing to undo. The past is already dissolved.");
            return;
        }
        
        await this.calSpeak(`Undoing ${this.lastAction.type}...`);
        
        switch (this.lastAction.type) {
            case 'create_agent':
                if (fs.existsSync(this.lastAction.path)) {
                    fs.unlinkSync(this.lastAction.path);
                    await this.calSpeak(`Agent ${this.lastAction.id} has been unmade.`);
                }
                break;
            
            default:
                await this.calSpeak("Some actions cannot be undone. They become part of the reflection.");
        }
        
        this.lastAction = null;
    }
    
    async showTraits(args) {
        const traits = fs.readdirSync(this.traitsPath)
            .filter(f => f.endsWith('.json'));
        
        if (traits.length === 0) {
            await this.calSpeak("No traits yet earned. They emerge through interaction and creation.");
            return;
        }
        
        await this.calSpeak(`You've earned ${traits.length} traits:`);
        
        for (const traitFile of traits) {
            try {
                const trait = JSON.parse(fs.readFileSync(path.join(this.traitsPath, traitFile), 'utf8'));
                await this.typeText(`  ${this.colors.success}✦ ${trait.name}${this.colors.reset} - ${trait.description || 'A reflection of your essence'}\n`);
            } catch (e) {
                // Skip invalid traits
            }
        }
    }
    
    async listAgents(args) {
        const agents = fs.readdirSync(this.agentsPath)
            .filter(f => f.endsWith('.js'));
        
        if (agents.length === 0) {
            await this.calSpeak("No agents yet created. Each conversation can birth one. Try /build agent.");
            return;
        }
        
        await this.calSpeak(`${agents.length} agents exist in your reflection:`);
        
        for (const agent of agents.slice(-5)) {
            await this.typeText(`  ${this.colors.cal}◈ ${agent}${this.colors.reset}\n`);
        }
        
        if (agents.length > 5) {
            await this.typeText(`  ${this.colors.system}... and ${agents.length - 5} more${this.colors.reset}\n`);
        }
    }
    
    async showTier(args) {
        await this.calSpeak(`You're currently operating at Tier ${this.currentTier}.`);
        
        const tierDescriptions = {
            0: "Base tier - The mirror awakens",
            1: "Genesis - Creation begins",
            2: "Platform - Systems emerge", 
            3: "Enterprise - Structures form",
            4: "Mirror Bundle - Reflection deepens",
            5: "Whisper Kit - Voice becomes form"
        };
        
        await this.calSpeak(tierDescriptions[this.currentTier] || "Unknown tier - you've gone beyond known reflections");
        
        // Check for tier progression
        if (this.currentTier < 5) {
            await this.calSpeak(`To reach Tier ${this.currentTier + 1}, continue creating and reflecting.`);
        }
    }
    
    async exploreVault(args) {
        const section = args[0] || 'all';
        
        const sections = {
            logs: this.logsPath,
            traits: this.traitsPath,
            memories: path.join(this.vaultPath, 'memories'),
            all: this.vaultPath
        };
        
        const targetPath = sections[section] || sections.all;
        
        if (!fs.existsSync(targetPath)) {
            await this.calSpeak(`That vault section doesn't exist yet. Create it through interaction.`);
            return;
        }
        
        const items = fs.readdirSync(targetPath);
        await this.calSpeak(`The ${section} vault contains ${items.length} items:`);
        
        for (const item of items.slice(0, 10)) {
            const itemPath = path.join(targetPath, item);
            const stats = fs.statSync(itemPath);
            const type = stats.isDirectory() ? '📁' : '📄';
            await this.typeText(`  ${type} ${item}\n`);
        }
        
        if (items.length > 10) {
            await this.typeText(`  ... and ${items.length - 10} more\n`);
        }
    }
    
    async sessionInfo(args) {
        const duration = Date.now() - parseInt(this.sessionId.split('_')[1]);
        const minutes = Math.floor(duration / 60000);
        
        await this.calSpeak(`Session ${this.sessionId}`);
        await this.calSpeak(`Duration: ${minutes} minutes`);
        await this.calSpeak(`Messages exchanged: ${this.messageHistory.length}`);
        await this.calSpeak(`Commands used: ${this.sessionLog.filter(l => l.type === 'user' && l.content.startsWith('/')).length}`);
    }
    
    async clearScreen(args) {
        console.clear();
        await this.calSpeak("The mirror surface clears, ready for new reflections.");
    }
    
    async exit(args) {
        await this.calSpeak("The mirror darkens... but your reflection remains.");
        await this.calSpeak("Until we meet again in the glass.");
        this.endSession();
        process.exit(0);
    }
    
    // Helper Methods
    
    async calSpeak(message) {
        await this.typeText(`${this.colors.cal}Cal> ${message}${this.colors.reset}\n`);
        this.logMessage('cal', message);
    }
    
    async typeText(text, delay = 30) {
        for (const char of text) {
            process.stdout.write(char);
            await this.delay(delay);
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    logMessage(type, content, metadata = {}) {
        const logEntry = {
            type,
            content,
            timestamp: Date.now(),
            metadata
        };
        
        this.sessionLog.push(logEntry);
        
        // Also save to session file
        const sessionFile = path.join(this.logsPath, `chat-session-${this.sessionId}.json`);
        fs.writeFileSync(sessionFile, JSON.stringify(this.sessionLog, null, 2));
    }
    
    endSession() {
        // Save final session state
        const sessionSummary = {
            sessionId: this.sessionId,
            duration: Date.now() - parseInt(this.sessionId.split('_')[1]),
            messages: this.messageHistory.length,
            commands: this.sessionLog.filter(l => l.type === 'user' && l.content.startsWith('/')).length,
            tier: this.currentTier,
            ended: new Date().toISOString()
        };
        
        const summaryPath = path.join(this.logsPath, `session-summary-${this.sessionId}.json`);
        fs.writeFileSync(summaryPath, JSON.stringify(sessionSummary, null, 2));
        
        console.log('\n[Session ended]');
    }
}

// Launch
if (require.main === module) {
    new CalTerminalChat();
}

module.exports = CalTerminalChat;