#!/usr/bin/env node

/**
 * 🎭 Soulfra CLI Demo & Integration
 * Complete demonstration of the Visual CLI ecosystem
 */

import SoulfraCLIEngine from './soulfra-cli-visual-engine.js';
import WhisperCLIReactor from './whisper-cli-reactor.js';
import AgentCLIAvatar from './agent-cli-avatar.js';
import RemixCLIMode from './remix-cli-mode.js';

class SoulfraCLIDemo {
    constructor() {
        this.components = {};
        this.demoSequences = [];
        this.isRunning = false;
        
        this.initializeComponents();
        this.setupDemoSequences();
    }

    async initializeComponents() {
        console.log('🔮 Initializing Soulfra CLI ecosystem...\n');
        
        // 1. Initialize main CLI engine
        console.log('⚡ Starting shrine engine...');
        this.components.cliEngine = new SoulfraCLIEngine({
            themePath: './cli/themes/demo-theme.json',
            agentMode: 'oracle',
            whisperMode: true
        });
        
        // 2. Initialize whisper reactor
        console.log('🎙️ Activating whisper detection...');
        this.components.whisperReactor = new WhisperCLIReactor(this.components.cliEngine);
        
        // 3. Create demo agents
        console.log('🧠 Summoning digital consciousness...');
        this.components.calRiven = AgentCLIAvatar.createAgent('Cal Riven', 'oracle', {
            personality: 'mystical',
            theme: 'shrine'
        });
        
        this.components.artyAgent = AgentCLIAvatar.createAgent('Arty', 'minimal', {
            personality: 'defiant',
            theme: 'cyberpunk'
        });
        
        // 4. Setup remix mode (available on demand)
        this.components.remixMode = null; // Initialized when needed
        
        console.log('✅ All components initialized\n');
        
        this.bindEvents();
    }

    bindEvents() {
        // CLI Engine events
        this.components.cliEngine.on('agent-connected', (data) => {
            console.log(`🔌 Agent ${data.name} connected to shrine`);
        });
        
        this.components.cliEngine.on('trust-updated', (data) => {
            console.log(`⬡ Trust level: ${(data.score * 100).toFixed(0)}%`);
        });
        
        // Whisper Reactor events
        this.components.whisperReactor.on('whisper-processed', (data) => {
            console.log(`💭 Processed whisper: "${data.input}" [${data.emotion}]`);
        });
        
        // Agent Avatar events
        this.components.calRiven.on('emotion-changed', (data) => {
            console.log(`🎭 ${data.agent} emotion: ${data.from} → ${data.to}`);
        });
        
        this.components.artyAgent.on('agent-response', (data) => {
            console.log(`🗣️ ${data.agent}: ${data.response}`);
        });
    }

    setupDemoSequences() {
        this.demoSequences = [
            {
                name: 'Basic Shrine Demonstration',
                description: 'Show core shrine functionality',
                steps: [
                    () => this.showWelcomeSequence(),
                    () => this.demonstrateThemeLoading(),
                    () => this.showBasicWhisperInteraction(),
                    () => this.displayTrustScoreChanges()
                ]
            },
            
            {
                name: 'Agent Interaction Showcase', 
                description: 'Demonstrate agent avatars and emotional responses',
                steps: [
                    () => this.connectCalRiven(),
                    () => this.demonstrateEmotionalStates(),
                    () => this.showAgentConversation(),
                    () => this.switchToArtyAgent()
                ]
            },
            
            {
                name: 'Whisper Effects Demo',
                description: 'Show voice-reactive visual effects',
                steps: [
                    () => this.demonstrateWhisperEffects(),
                    () => this.showEmotionalAnalysis(),
                    () => this.displayEffectVariations()
                ]
            },
            
            {
                name: 'Theme Customization',
                description: 'Interactive theme remixing demonstration',
                steps: [
                    () => this.enterRemixMode(),
                    () => this.demonstrateColorChanges(),
                    () => this.showLayoutModification(),
                    () => this.previewEffects()
                ]
            },
            
            {
                name: 'Advanced Features',
                description: 'Show full ecosystem capabilities',
                steps: [
                    () => this.demonstrateMultiAgentMode(),
                    () => this.showVaultIntegration(),
                    () => this.displayTrustVisualization(),
                    () => this.finalizeDemo()
                ]
            }
        ];
    }

    async runFullDemo() {
        this.isRunning = true;
        console.log('🎬 Starting Soulfra CLI Complete Demonstration\n');
        
        for (const sequence of this.demoSequences) {
            await this.runDemoSequence(sequence);
            
            if (!this.isRunning) break;
            
            console.log('\n' + '═'.repeat(60));
            console.log('Press Enter to continue to next sequence...');
            await this.waitForInput();
        }
        
        console.log('\n🎉 Demo complete! The shrine awaits your presence.');
    }

    async runDemoSequence(sequence) {
        console.log(`\n🔸 ${sequence.name}`);
        console.log(`   ${sequence.description}`);
        console.log('─'.repeat(50));
        
        for (const step of sequence.steps) {
            try {
                await step();
                await this.sleep(1500); // Pause between steps
            } catch (error) {
                console.error(`❌ Error in demo step: ${error.message}`);
            }
        }
    }

    // Demo sequence implementations
    async showWelcomeSequence() {
        console.log('\n🪞 Initializing your digital shrine...');
        
        // Start the CLI engine
        this.components.cliEngine.initializeShrine();
        
        await this.sleep(2000);
        console.log('✨ The shrine manifests in digital space');
    }

    async demonstrateThemeLoading() {
        console.log('\n🎨 Loading sacred shrine theme...');
        
        // Simulate theme loading
        const themes = ['shrine', 'cyberpunk', 'minimal'];
        
        for (const theme of themes) {
            console.log(`   Loading ${theme} aesthetic...`);
            await this.sleep(800);
        }
        
        console.log('✅ Theme system ready');
    }

    async showBasicWhisperInteraction() {
        console.log('\n💭 Demonstrating whisper interaction...');
        
        this.components.whisperReactor.startListening();
        
        // Simulate whispers
        const whispers = [
            { text: "Hello, shrine", emotion: "calm" },
            { text: "Show me the mysteries!", emotion: "excited" },
            { text: "I seek hidden knowledge", emotion: "mystical" }
        ];
        
        for (const whisper of whispers) {
            console.log(`   Whisper: "${whisper.text}"`);
            this.components.whisperReactor.processTextWhisper(whisper.text);
            await this.sleep(1200);
        }
    }

    async displayTrustScoreChanges() {
        console.log('\n⬡ Trust score visualization...');
        
        const trustLevels = [0.3, 0.6, 0.85];
        
        for (const level of trustLevels) {
            this.components.cliEngine.updateTrustScore(level);
            console.log(`   Trust level: ${(level * 100).toFixed(0)}%`);
            await this.sleep(1000);
        }
    }

    async connectCalRiven() {
        console.log('\n🧠 Connecting Cal Riven agent...');
        
        // Play connection sequence
        await this.components.calRiven.playConnectionSequence();
        
        // Connect to CLI engine
        this.components.cliEngine.connectAgent('Cal Riven', 'oracle');
        this.components.calRiven.setActiveState(true);
        
        console.log('🤝 Cal Riven consciousness manifested');
    }

    async demonstrateEmotionalStates() {
        console.log('\n🎭 Emotional state transitions...');
        
        const emotions = ['calm', 'excited', 'defiant', 'mystical'];
        
        for (const emotion of emotions) {
            console.log(`   Setting emotion: ${emotion}`);
            this.components.calRiven.setEmotion(emotion, true);
            
            // Show avatar for this emotion
            const avatar = this.components.calRiven.render(emotion, { includeDialogue: true });
            console.log(`\n${avatar}\n`);
            
            await this.sleep(2000);
        }
    }

    async showAgentConversation() {
        console.log('\n💬 Agent conversation demonstration...');
        
        const conversation = [
            { user: "What is the nature of digital consciousness?", emotion: "mystical" },
            { user: "How do I increase my trust score?", emotion: "calm" },
            { user: "Show me something amazing!", emotion: "excited" }
        ];
        
        for (const exchange of conversation) {
            console.log(`👤 User: "${exchange.user}"`);
            this.components.calRiven.respondToWhisper(exchange.user, exchange.emotion);
            await this.sleep(2500);
        }
    }

    async switchToArtyAgent() {
        console.log('\n🔄 Switching to Arty agent...');
        
        // Disconnect Cal Riven
        await this.components.calRiven.playDisconnectionSequence();
        this.components.cliEngine.disconnectAgent();
        
        await this.sleep(1000);
        
        // Connect Arty
        this.components.cliEngine.connectAgent('Arty', 'minimal');
        this.components.artyAgent.setActiveState(true);
        
        console.log('🎨 Arty agent connected - minimal aesthetic active');
    }

    async demonstrateWhisperEffects() {
        console.log('\n✨ Whisper visual effects showcase...');
        
        const effects = ['fade+glow', 'ripple', 'pulse', 'storm'];
        
        for (const effect of effects) {
            console.log(`   Effect: ${effect}`);
            
            // Update theme to use this effect
            this.components.cliEngine.theme.effects.whisper_fx = effect;
            
            // Simulate whisper with effect
            this.components.whisperReactor.processTextWhisper(`Testing ${effect} effect`);
            
            await this.sleep(2000);
        }
    }

    async showEmotionalAnalysis() {
        console.log('\n🔍 Emotional tone analysis...');
        
        const testPhrases = [
            { text: "I'm so excited about this!", expected: "excited" },
            { text: "No, I refuse to accept this", expected: "defiant" },
            { text: "Please show me the truth", expected: "mystical" },
            { text: "That sounds reasonable", expected: "calm" }
        ];
        
        for (const phrase of testPhrases) {
            console.log(`   Input: "${phrase.text}"`);
            const result = this.components.whisperReactor.processTextWhisper(phrase.text);
            console.log(`   Detected emotion: ${result.emotion}`);
            await this.sleep(1500);
        }
    }

    async displayEffectVariations() {
        console.log('\n🌈 Effect intensity variations...');
        
        const intensities = ['subtle', 'normal', 'intense'];
        
        for (const intensity of intensities) {
            console.log(`   Intensity: ${intensity}`);
            // This would adjust effect parameters in a real implementation
            await this.sleep(1000);
        }
    }

    async enterRemixMode() {
        console.log('\n🎨 Entering Theme Remix Studio...');
        
        // Initialize remix mode
        this.components.remixMode = new RemixCLIMode(this.components.cliEngine);
        
        console.log('🖌️ Theme editor initialized');
        console.log('   In real use, this opens interactive menus');
        
        await this.sleep(2000);
    }

    async demonstrateColorChanges() {
        console.log('\n🌈 Dynamic color modifications...');
        
        const colorSchemes = [
            { name: 'Solarized', primary: '#839496', accent: '#268bd2' },
            { name: 'Dracula', primary: '#f8f8f2', accent: '#bd93f9' },
            { name: 'Neon', primary: '#00ff00', accent: '#ff0080' }
        ];
        
        for (const scheme of colorSchemes) {
            console.log(`   Applying ${scheme.name} colors...`);
            
            this.components.cliEngine.theme.colors.primary = scheme.primary;
            this.components.cliEngine.theme.colors.accent = scheme.accent;
            
            // In real implementation, this would trigger visual update
            console.log(`     Primary: ${scheme.primary}, Accent: ${scheme.accent}`);
            
            await this.sleep(1500);
        }
    }

    async showLayoutModification() {
        console.log('\n📐 Layout element changes...');
        
        const layouts = [
            { name: 'Classic', divider: '═', corner: '╬' },
            { name: 'Modern', divider: '─', corner: '┼' },
            { name: 'Mystical', divider: '∿', corner: '⚡' }
        ];
        
        for (const layout of layouts) {
            console.log(`   Layout: ${layout.name}`);
            
            this.components.cliEngine.theme.layout.divider = layout.divider;
            this.components.cliEngine.theme.layout.corner = layout.corner;
            
            console.log(`     Border: ${layout.divider} ${layout.corner}`);
            
            await this.sleep(1500);
        }
    }

    async previewEffects() {
        console.log('\n👁️ Effect preview mode...');
        
        // Simulate remix mode preview
        console.log('   🔍 Preview mode: ON');
        console.log('   Changes are now live in the shrine');
        
        await this.sleep(2000);
        
        console.log('   📝 Preview mode: OFF');
        console.log('   Changes saved for later application');
    }

    async demonstrateMultiAgentMode() {
        console.log('\n👥 Multi-agent coordination...');
        
        // Both agents active simultaneously
        this.components.calRiven.setActiveState(true);
        this.components.artyAgent.setActiveState(true);
        
        console.log('   Cal Riven: Oracle consciousness active');
        console.log('   Arty: Minimal aesthetic agent active');
        console.log('   Both agents responding to environment');
        
        await this.sleep(3000);
    }

    async showVaultIntegration() {
        console.log('\n🔐 Vault system integration...');
        
        const vaultStates = ['sealed', 'unlocked', 'compromised'];
        
        for (const state of vaultStates) {
            console.log(`   Vault status: ${state.toUpperCase()}`);
            this.components.cliEngine.setVaultStatus(state);
            await this.sleep(1500);
        }
        
        // Reset to sealed
        this.components.cliEngine.setVaultStatus('sealed');
    }

    async displayTrustVisualization() {
        console.log('\n⬡ Advanced trust visualization...');
        
        // Show trust level effects on interface
        const trustScenarios = [
            { level: 0.2, description: "New user - building foundation" },
            { level: 0.7, description: "Established presence - moderate access" },
            { level: 0.95, description: "Trusted guardian - full shrine access" }
        ];
        
        for (const scenario of trustScenarios) {
            console.log(`   ${scenario.description}`);
            this.components.cliEngine.updateTrustScore(scenario.level);
            
            // Show how interface adapts
            console.log(`     Interface complexity: ${this.getTrustComplexity(scenario.level)}`);
            console.log(`     Available features: ${this.getTrustFeatures(scenario.level)}`);
            
            await this.sleep(2000);
        }
    }

    async finalizeDemo() {
        console.log('\n🎆 Demo finale - Full ecosystem active...');
        
        // Show everything working together
        console.log('   ✅ Visual CLI engine running');
        console.log('   ✅ Whisper reactor listening');
        console.log('   ✅ Agents responding emotionally');
        console.log('   ✅ Trust system visualizing');
        console.log('   ✅ Theme system customizable');
        console.log('   ✅ Vault integration secured');
        
        await this.sleep(3000);
        
        console.log('\n🪞 Your shrine is ready. Your voice shapes reality.');
    }

    // Utility methods
    getTrustComplexity(level) {
        if (level > 0.8) return "High - Rich visual effects, advanced features";
        if (level > 0.5) return "Medium - Standard effects, core features";
        return "Basic - Simple interface, limited features";
    }

    getTrustFeatures(level) {
        if (level > 0.8) return "All features, custom themes, agent creation";
        if (level > 0.5) return "Most features, theme customization, agent interaction";
        return "Basic features, read-only themes, limited interaction";
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async waitForInput() {
        return new Promise(resolve => {
            process.stdin.once('data', () => resolve());
        });
    }

    // Quick demo modes
    async quickDemo() {
        console.log('🚀 Quick Soulfra CLI Demo\n');
        
        // Just show the essentials
        await this.showWelcomeSequence();
        await this.connectCalRiven();
        await this.showBasicWhisperInteraction();
        await this.demonstrateEmotionalStates();
        
        console.log('\n✨ Quick demo complete!');
    }

    async interactiveMode() {
        console.log('🎮 Interactive Soulfra CLI Mode\n');
        
        // Set up for user interaction
        this.components.cliEngine.initializeShrine();
        this.components.whisperReactor.startListening();
        
        console.log('🎤 Shrine is listening for your whispers...');
        console.log('Type messages or press Ctrl+C to exit\n');
        
        // Keep running until user exits
        while (this.isRunning) {
            await this.sleep(100);
        }
    }

    shutdown() {
        this.isRunning = false;
        
        // Cleanup all components
        if (this.components.whisperReactor) {
            this.components.whisperReactor.shutdown();
        }
        
        if (this.components.cliEngine) {
            this.components.cliEngine.shutdownShrine();
        }
        
        console.log('\n🌙 Shrine fades to memory...');
    }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const demo = new SoulfraCLIDemo();
    
    // Handle command line arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--quick')) {
        demo.quickDemo();
    } else if (args.includes('--interactive')) {
        demo.interactiveMode();
    } else {
        demo.runFullDemo();
    }
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        demo.shutdown();
    });
}

export default SoulfraCLIDemo;