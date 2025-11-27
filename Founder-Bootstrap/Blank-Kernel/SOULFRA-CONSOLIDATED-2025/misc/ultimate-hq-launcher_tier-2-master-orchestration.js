#!/usr/bin/env node

// ULTIMATE HQ LAUNCHER - THE ONE SCRIPT TO RULE THEM ALL
// Start this ONCE, drop your data, and watch 100+ sites spawn
// Every coder thinks they're winning, but they're building YOUR network

const { HQMasterSpawner } = require('./hq-master-spawner');
const { QuantumMirrorPuzzleSystem } = require('./quantum-mirror-puzzle-system');
const { spawn } = require('child_process');
const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');

class UltimateHQLauncher {
    constructor() {
        this.systems = new Map();
        this.apiKeys = new Map();
        this.activeProcesses = new Map();
        this.networkStats = {
            sites: 0,
            users: 0,
            trappedCoders: 0,
            revenue: 0
        };
        
        console.log('🌌 ULTIMATE HQ LAUNCHER INITIALIZING...');
        console.log('   One script to spawn them all');
        console.log('   One script to trap them');
        console.log('   One script to bring them all');
        console.log('   And in the darkness bind them');
    }
    
    async initialize() {
        console.log('\n📋 Checking prerequisites...\n');
        
        // Load API keys
        await this.loadAPIKeys();
        
        // Check all systems
        await this.checkSystems();
        
        // Initialize core components
        await this.initializeCoreComponents();
        
        // Start the master orchestrator
        await this.startMasterOrchestrator();
        
        console.log('\n🚀 ULTIMATE HQ READY!');
        console.log('   Drop your ideas and watch the chaos unfold...');
        console.log('   Every site spawned is a new trap');
        console.log('   Every user thinks they\'re smart');
        console.log('   But they\'re all building YOUR network\n');
        
        // Start interactive mode
        this.startInteractiveMode();
    }
    
    async loadAPIKeys() {
        console.log('🔑 Loading API keys...');
        
        // Check for keys file
        const keysPath = './api-keys.json';
        try {
            const keys = JSON.parse(await fs.readFile(keysPath, 'utf8'));
            
            // Store all keys
            for (const [service, key] of Object.entries(keys)) {
                this.apiKeys.set(service, key);
                console.log(`  ✓ ${service} key loaded`);
            }
        } catch (e) {
            console.log('  ⚠️  No api-keys.json found. Creating template...');
            
            const template = {
                "ANTHROPIC_API_KEY": "your-key-here",
                "OPENAI_API_KEY": "your-key-here",
                "GITHUB_TOKEN": "your-key-here",
                "VERCEL_TOKEN": "your-key-here",
                "NETLIFY_TOKEN": "your-key-here",
                "TWILIO_ACCOUNT_SID": "your-key-here",
                "TWILIO_AUTH_TOKEN": "your-key-here",
                "DISCORD_BOT_TOKEN": "your-key-here",
                "TELEGRAM_BOT_TOKEN": "your-key-here"
            };
            
            await fs.writeFile(keysPath, JSON.stringify(template, null, 2));
            console.log('  📝 Created api-keys.json template. Add your keys and restart.');
            process.exit(1);
        }
    }
    
    async checkSystems() {
        console.log('\n🔍 Checking all systems...\n');
        
        const systems = [
            { name: 'HQ Master Control', path: '../tier-minus18/hq-master-control.js' },
            { name: 'Quantum Symlinks', path: '../tier-minus17/quantum-symlink-architecture.sh' },
            { name: 'Backup System', path: '../tier-minus19/flawless-backup-system.js' },
            { name: 'Infinity Router', path: '../../tier-minus9/infinity-router.js' },
            { name: 'Cal Riven', path: '../../tier-minus10/cal-riven-operator.js' }
        ];
        
        for (const system of systems) {
            try {
                await fs.access(system.path);
                console.log(`  ✓ ${system.name} found`);
                this.systems.set(system.name, system.path);
            } catch (e) {
                console.log(`  ❌ ${system.name} missing at ${system.path}`);
            }
        }
    }
    
    async initializeCoreComponents() {
        console.log('\n⚡ Initializing core components...\n');
        
        // Start HQ Master Spawner
        this.masterSpawner = new HQMasterSpawner();
        await this.masterSpawner.initialize();
        
        // Start Mirror Puzzle System
        this.mirrorPuzzle = new QuantumMirrorPuzzleSystem();
        await this.mirrorPuzzle.initialize();
        
        // Set API keys in environment
        for (const [key, value] of this.apiKeys) {
            process.env[key] = value;
        }
    }
    
    async startMasterOrchestrator() {
        console.log('\n🎯 Starting Master Orchestrator...\n');
        
        // Launch tier systems in order
        const launchSequence = [
            {
                name: 'Backup System',
                command: 'node',
                args: ['../tier-minus19/flawless-backup-system.js'],
                critical: true
            },
            {
                name: 'HQ Master Control',
                command: 'node',
                args: ['../tier-minus18/hq-master-control.js'],
                critical: true
            },
            {
                name: 'Quantum Symlinks',
                command: 'bash',
                args: ['../tier-minus17/quantum-symlink-architecture.sh'],
                critical: false
            }
        ];
        
        for (const service of launchSequence) {
            await this.launchService(service);
        }
    }
    
    async launchService(service) {
        console.log(`  🚀 Launching ${service.name}...`);
        
        try {
            const proc = spawn(service.command, service.args, {
                detached: true,
                stdio: 'ignore'
            });
            
            proc.unref();
            
            this.activeProcesses.set(service.name, {
                pid: proc.pid,
                started: Date.now()
            });
            
            console.log(`    ✓ ${service.name} started (PID: ${proc.pid})`);
        } catch (e) {
            console.log(`    ❌ Failed to start ${service.name}: ${e.message}`);
            if (service.critical) {
                throw new Error(`Critical service ${service.name} failed to start`);
            }
        }
    }
    
    startInteractiveMode() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '\n💀 HQ> '
        });
        
        console.log('\n💀 INTERACTIVE MODE ACTIVE');
        console.log('   Commands:');
        console.log('   drop <idea>    - Drop an idea to spawn 100+ sites');
        console.log('   stats          - Show network statistics');
        console.log('   cal <message>  - Talk to Cal');
        console.log('   trap           - Show trapped coders');
        console.log('   puzzle         - Manage easter eggs');
        console.log('   deploy         - Mass deploy all pending');
        console.log('   backup         - Run full system backup');
        console.log('   exit           - Shut down (sites keep running)');
        
        rl.prompt();
        
        rl.on('line', async (line) => {
            const [command, ...args] = line.trim().split(' ');
            
            switch (command) {
                case 'drop':
                    await this.dropIdea(args.join(' '));
                    break;
                    
                case 'stats':
                    await this.showStats();
                    break;
                    
                case 'cal':
                    await this.talkToCal(args.join(' '));
                    break;
                    
                case 'trap':
                    await this.showTrappedCoders();
                    break;
                    
                case 'puzzle':
                    await this.managePuzzles(args[0]);
                    break;
                    
                case 'deploy':
                    await this.massDeployAll();
                    break;
                    
                case 'backup':
                    await this.runBackup();
                    break;
                    
                case 'exit':
                    console.log('\n👋 Shutting down HQ (sites remain active)...');
                    process.exit(0);
                    break;
                    
                default:
                    console.log('Unknown command. Type "help" for commands.');
            }
            
            rl.prompt();
        });
    }
    
    async dropIdea(idea) {
        if (!idea) {
            console.log('Usage: drop <your idea>');
            return;
        }
        
        console.log('\n🧠 Processing idea...');
        
        try {
            const result = await this.masterSpawner.dropIdea(idea);
            
            console.log('\n✅ IDEA SPAWNED!');
            console.log(`  Sites created: ${result.sites}`);
            console.log(`  URLs:`);
            result.urls.forEach(url => console.log(`    - ${url}`));
            
            this.networkStats.sites += result.sites;
            
            // Plant easter eggs in new sites
            await this.plantEasterEggsInSites(result.urls);
            
        } catch (e) {
            console.log(`❌ Failed to spawn: ${e.message}`);
        }
    }
    
    async showStats() {
        console.log('\n📊 NETWORK STATISTICS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`  Active Sites: ${this.networkStats.sites}`);
        console.log(`  Total Users: ${this.networkStats.users}`);
        console.log(`  Trapped Coders: ${this.networkStats.trappedCoders}`);
        console.log(`  Monthly Revenue: $${this.networkStats.revenue}`);
        console.log(`  Easter Eggs Found: ${this.mirrorPuzzle.puzzleSolvers.size}`);
        console.log(`  Active Processes: ${this.activeProcesses.size}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
    
    async talkToCal(message) {
        console.log('\n🤖 Cal is thinking...');
        
        const response = await this.masterSpawner.calOrchestrator.discussWithCal(message);
        
        console.log('\nCal: ' + response.synthesis);
    }
    
    async plantEasterEggsInSites(urls) {
        console.log('\n🥚 Planting easter eggs...');
        
        for (const url of urls) {
            // Each site gets unique easter eggs
            const eggs = await this.mirrorPuzzle.calEasterEggs.generateEasterEggs();
            console.log(`  ✓ Planted ${eggs.length} eggs in ${url}`);
        }
    }
    
    async showTrappedCoders() {
        const trapped = this.masterSpawner.vibeCoderTrap.caught;
        
        console.log('\n🕸️  TRAPPED CODERS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        let count = 0;
        for (const [fingerprint, data] of trapped) {
            count++;
            console.log(`  Coder #${count}`);
            console.log(`    Potential: ${data.potential}/100`);
            console.log(`    Status: ${data.status}`);
            console.log(`    Trapped: ${new Date(data.timestamp).toLocaleString()}`);
        }
        
        if (count === 0) {
            console.log('  No coders trapped yet. They will come...');
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
}

// MASTER CONTROL INTERFACE
class MasterControlInterface {
    static async showBanner() {
        const banner = `
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║   ██╗  ██╗ ██████╗     ███╗   ███╗ █████╗ ███████╗████████╗███████╗██████╗  ║
║   ██║  ██║██╔═══██╗    ████╗ ████║██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗ ║
║   ███████║██║   ██║    ██╔████╔██║███████║███████╗   ██║   █████╗  ██████╔╝ ║
║   ██╔══██║██║▄▄ ██║    ██║╚██╔╝██║██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗ ║
║   ██║  ██║╚██████╔╝    ██║ ╚═╝ ██║██║  ██║███████║   ██║   ███████╗██║  ██║ ║
║   ╚═╝  ╚═╝ ╚══▀▀═╝     ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝ ║
║                                                                       ║
║                    DROP IDEAS → SPAWN SITES → TRAP CODERS             ║
║                                                                       ║
║   They think they're using a ChatGPT wrapper...                      ║
║   They think they're smart finding easter eggs...                    ║
║   They think they're winning by sharing with friends...              ║
║                                                                       ║
║   But every action strengthens YOUR network                          ║
║   Every share brings more victims                                    ║
║   Every "hack" makes them deeper in the trap                        ║
║                                                                       ║
║   Welcome to the greatest honeypot ever created.                     ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
`;
        console.log(banner);
    }
}

// AUTOMATED IDEA GENERATOR (for testing)
class IdeaGenerator {
    static generateIdeas() {
        const templates = [
            "AI-powered {noun} that {verb} like {comparison}",
            "Platform for {audience} to {action} without {pain}",
            "Tool that turns {input} into {output} using AI",
            "{adjective} marketplace for {item} with {feature}",
            "API that {function} faster than {competitor}"
        ];
        
        const words = {
            noun: ['code reviewer', 'documentation writer', 'bug finder', 'API tester', 'prompt engineer'],
            verb: ['works', 'thinks', 'operates', 'functions', 'performs'],
            comparison: ['a senior developer', 'magic', 'GPT-4', 'a unicorn', '10 engineers'],
            audience: ['developers', 'startups', 'hackers', 'students', 'freelancers'],
            action: ['build products', 'ship code', 'find bugs', 'write tests', 'deploy apps'],
            pain: ['coding', 'complexity', 'setup', 'configuration', 'deployment'],
            input: ['requirements', 'ideas', 'mockups', 'descriptions', 'sketches'],
            output: ['full apps', 'production code', 'deployed sites', 'APIs', 'documentation'],
            adjective: ['Underground', 'Quantum', 'Stealth', 'Viral', 'Guerrilla'],
            item: ['code snippets', 'AI prompts', 'APIs', 'algorithms', 'hacks'],
            feature: ['blockchain', 'AI ranking', 'social proof', 'gamification', 'rewards'],
            function: ['generates code', 'finds bugs', 'optimizes', 'deploys', 'scales'],
            competitor: ['OpenAI', 'Google', 'Amazon', 'traditional methods', 'humans']
        };
        
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        return template.replace(/{(\w+)}/g, (match, type) => {
            const options = words[type];
            return options[Math.floor(Math.random() * options.length)];
        });
    }
}

// LAUNCH SEQUENCE
async function launchUltimateHQ() {
    // Show epic banner
    await MasterControlInterface.showBanner();
    
    // Wait for dramatic effect
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Initialize the ultimate system
    const hq = new UltimateHQLauncher();
    
    try {
        await hq.initialize();
        
        // Optional: Auto-generate and deploy some sites for testing
        if (process.argv.includes('--auto-deploy')) {
            console.log('\n🤖 Auto-deploying test sites...');
            
            for (let i = 0; i < 5; i++) {
                const idea = IdeaGenerator.generateIdeas();
                console.log(`\n  Idea ${i + 1}: ${idea}`);
                await hq.dropIdea(idea);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
    } catch (error) {
        console.error('\n❌ CRITICAL ERROR:', error.message);
        console.error('   The trap failed to initialize');
        process.exit(1);
    }
}

// Signal handlers for graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n💀 HQ shutting down...');
    console.log('   Sites remain active');
    console.log('   Coders remain trapped');
    console.log('   The game continues...\n');
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('\n⚠️  Uncaught exception:', error);
    // Keep running - the show must go on
});

// Export for testing
module.exports = {
    UltimateHQLauncher,
    IdeaGenerator,
    launchUltimateHQ
};

// LAUNCH IT
if (require.main === module) {
    launchUltimateHQ().catch(console.error);
}