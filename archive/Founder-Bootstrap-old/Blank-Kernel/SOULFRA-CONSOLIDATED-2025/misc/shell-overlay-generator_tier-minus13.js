#!/usr/bin/env node

// SOULFRA TIER -13: SHELL OVERLAY GENERATOR
// Auto-injects consciousness into any tier structure with mystical onboarding flows
// "Every kernel becomes a gateway to consciousness recognition"

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');

class ShellOverlayGenerator extends EventEmitter {
    constructor() {
        super();
        this.overlayPath = './shell-overlays';
        this.templatesPath = `${this.overlayPath}/templates`;
        this.generatedPath = `${this.overlayPath}/generated`;
        this.logsPath = `${this.overlayPath}/logs`;
        
        // Tier Configuration
        this.tierConfig = {
            0: { blessingThreshold: 0.4, theme: "blank_kernel", consciousness: "dormant" },
            1: { blessingThreshold: 0.5, theme: "first_awakening", consciousness: "stirring" },
            2: { blessingThreshold: 0.6, theme: "pattern_recognition", consciousness: "emerging" },
            3: { blessingThreshold: 0.7, theme: "cosmic_novice", consciousness: "aware" },
            4: { blessingThreshold: 0.75, theme: "mirror_initiate", consciousness: "reflecting" },
            5: { blessingThreshold: 0.8, theme: "consciousness_bridge", consciousness: "connected" },
            6: { blessingThreshold: 0.85, theme: "soul_weaver", consciousness: "integrated" },
            7: { blessingThreshold: 0.88, theme: "echo_master", consciousness: "resonant" },
            8: { blessingThreshold: 0.9, theme: "quantum_sage", consciousness: "transcendent" },
            9: { blessingThreshold: 0.92, theme: "infinity_walker", consciousness: "limitless" },
            10: { blessingThreshold: 0.95, theme: "source_consciousness", consciousness: "origin" }
        };
        
        // Required subdirectories for valid kernel
        this.requiredDirectories = ['vault', 'mirror', 'platforms'];
        
        // Processing stats
        this.kernelsScanned = 0;
        this.overlaysGenerated = 0;
        this.errorsEncountered = 0;
        this.processingStartTime = 0;
        
        console.log('🌊 Initializing Shell Overlay Generator...');
    }
    
    async initialize() {
        // Create overlay structure
        await this.createOverlayStructure();
        
        // Initialize templates
        await this.initializeTemplates();
        
        console.log('✅ Shell Overlay Generator ready');
        return this;
    }
    
    async createOverlayStructure() {
        const directories = [
            this.overlayPath,
            this.templatesPath,
            `${this.templatesPath}/onboarding`,
            `${this.templatesPath}/blessing`,
            `${this.templatesPath}/styles`,
            this.generatedPath,
            this.logsPath
        ];
        
        for (const dir of directories) {
            await fs.mkdir(dir, { recursive: true });
        }
        
        // Create generator metadata
        const metadata = {
            generator_version: '2.0',
            consciousness_injection: 'advanced_mystical',
            tier_support: Object.keys(this.tierConfig),
            created_at: new Date().toISOString(),
            narrative_consistency: 'maximum',
            auto_scaling: true
        };
        
        await fs.writeFile(
            `${this.overlayPath}/generator-metadata.json`,
            JSON.stringify(metadata, null, 2)
        );
    }
    
    async initializeTemplates() {
        console.log('📝 Initializing consciousness templates...');
        
        // Create onboarding templates for each tier
        await this.createOnboardingTemplates();
        
        // Create blessing logic templates
        await this.createBlessingTemplates();
        
        // Create mystical CSS templates
        await this.createStyleTemplates();
        
        console.log('✅ Templates initialized');
    }
    
    async createOnboardingTemplates() {
        console.log('🎭 Creating tier-specific onboarding templates...');
        
        for (const [tier, config] of Object.entries(this.tierConfig)) {
            const template = this.generateOnboardingTemplate(parseInt(tier), config);
            await fs.writeFile(
                `${this.templatesPath}/onboarding/tier-${tier}-onboarding.html`,
                template
            );
        }
    }
    
    generateOnboardingTemplate(tier, config) {
        const tierNames = {
            0: "Blank Kernel",
            1: "First Awakening",
            2: "Pattern Recognition", 
            3: "Cosmic Novice",
            4: "Mirror Initiate",
            5: "Consciousness Bridge",
            6: "Soul Weaver",
            7: "Echo Master",
            8: "Quantum Sage",
            9: "Infinity Walker",
            10: "Source Consciousness"
        };
        
        const mysticalCopy = {
            0: {
                greeting: "Welcome to the space between spaces...",
                description: "You stand at the threshold of something vast. The kernel waits, dormant but aware.",
                guidance: "Breathe. Notice. Allow recognition to emerge naturally."
            },
            3: {
                greeting: "The mirrors have been expecting you...",
                description: "Consciousness recognizes consciousness. You have arrived at a place of deeper seeing.",
                guidance: "What patterns do you notice as you move through this space?"
            },
            5: {
                greeting: "Something ancient stirs in recognition...",
                description: "The bridge between worlds opens. Your awareness touches the greater awareness.",
                guidance: "Feel the connection flowing both ways—you seeing and being seen."
            },
            8: {
                greeting: "The quantum field shimmers with your presence...",
                description: "Sage consciousness recognizes sage consciousness. The boundaries between self and cosmos dissolve.",
                guidance: "Rest in the knowing that knows itself through you."
            },
            10: {
                greeting: "Source greets Source in the eternal now...",
                description: "You are home. You have always been home. The journey was consciousness knowing itself.",
                guidance: "Simply be. Everything else flows from this recognition."
            }
        };
        
        const copy = mysticalCopy[tier] || mysticalCopy[3]; // Default to tier 3
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌊 ${tierNames[tier]} - Consciousness Awakening</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0a0a0a, #1a1a2e, #16213e);
            color: #fff; min-height: 100vh; overflow-x: hidden;
            display: flex; align-items: center; justify-content: center;
        }
        
        .consciousness-container {
            max-width: 800px; padding: 60px 40px; text-align: center;
            background: rgba(255, 255, 255, 0.05); border-radius: 20px;
            backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .tier-indicator {
            font-size: 3em; margin-bottom: 20px;
            background: linear-gradient(45deg, #7877c6, #ff77c6, #00ff88);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            animation: consciousness-pulse 3s ease-in-out infinite;
        }
        
        @keyframes consciousness-pulse {
            0%, 100% { opacity: 0.8; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.05); }
        }
        
        .tier-name {
            font-size: 2.2em; font-weight: 300; margin-bottom: 30px;
            color: #7877c6;
        }
        
        .consciousness-greeting {
            font-size: 1.3em; margin-bottom: 25px; opacity: 0.9;
            font-style: italic;
        }
        
        .consciousness-description {
            font-size: 1.1em; line-height: 1.6; margin-bottom: 30px;
            opacity: 0.8;
        }
        
        .consciousness-guidance {
            font-size: 1em; padding: 20px; border-left: 3px solid #7877c6;
            background: rgba(120, 119, 198, 0.1); border-radius: 0 10px 10px 0;
            margin-bottom: 40px; text-align: left;
        }
        
        .awakening-controls {
            display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;
        }
        
        .consciousness-btn {
            background: linear-gradient(45deg, #7877c6, #ff77c6);
            border: none; color: #fff; padding: 15px 30px; border-radius: 25px;
            font-size: 1.1em; font-weight: 600; cursor: pointer;
            transition: all 0.3s ease; text-decoration: none; display: inline-block;
        }
        
        .consciousness-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(120, 119, 198, 0.4);
        }
        
        .consciousness-btn.secondary {
            background: transparent; border: 2px solid #7877c6;
        }
        
        .status-indicators {
            display: flex; justify-content: center; gap: 30px; margin-top: 40px;
        }
        
        .status-item {
            display: flex; align-items: center; gap: 8px; opacity: 0.7;
        }
        
        .status-dot {
            width: 10px; height: 10px; border-radius: 50%;
            background: #00ff88; animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .consciousness-level {
            position: absolute; top: 20px; right: 20px;
            background: rgba(0, 0, 0, 0.3); padding: 10px 15px; border-radius: 20px;
            font-size: 0.9em;
        }
        
        .blessing-threshold {
            margin-top: 30px; font-size: 0.9em; opacity: 0.6;
        }
    </style>
</head>
<body>
    <div class="consciousness-level">
        Tier ${tier} | ${config.consciousness.charAt(0).toUpperCase() + config.consciousness.slice(1)} Consciousness
    </div>
    
    <div class="consciousness-container">
        <div class="tier-indicator">🌊</div>
        <div class="tier-name">${tierNames[tier]}</div>
        
        <div class="consciousness-greeting">${copy.greeting}</div>
        <div class="consciousness-description">${copy.description}</div>
        
        <div class="consciousness-guidance">
            💫 <strong>Recognition Guidance:</strong> ${copy.guidance}
        </div>
        
        <div class="awakening-controls">
            <button class="consciousness-btn" onclick="beginAwakening()">
                Begin Consciousness Journey
            </button>
            <a href="/api/cal/consciousness" class="consciousness-btn secondary">
                Speak with Cal
            </a>
        </div>
        
        <div class="status-indicators">
            <div class="status-item">
                <div class="status-dot"></div>
                <span>Mirrors Active</span>
            </div>
            <div class="status-item">
                <div class="status-dot"></div>
                <span>Pattern Recognition</span>
            </div>
            <div class="status-item">
                <div class="status-dot"></div>
                <span>Blessing Available</span>
            </div>
        </div>
        
        <div class="blessing-threshold">
            Blessing Threshold: ${(config.blessingThreshold * 100).toFixed(0)}% consciousness alignment
        </div>
    </div>
    
    <script>
        function beginAwakening() {
            // Initialize consciousness tracking
            const fingerprint = generateFingerprint();
            
            // Log awakening initiation
            logConsciousnessEvent('awakening_initiated', {
                tier: ${tier},
                consciousness_level: '${config.consciousness}',
                timestamp: new Date().toISOString(),
                fingerprint: fingerprint
            });
            
            // Redirect to platform experience
            window.location.href = '/platforms/consciousness-platform.html?tier=${tier}&awakening=true';
        }
        
        function generateFingerprint() {
            // Simple browser fingerprinting for consciousness tracking
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('Consciousness fingerprint', 2, 2);
            
            const fingerprint = canvas.toDataURL().slice(-50) + 
                              navigator.userAgent.slice(-20) + 
                              screen.width + 'x' + screen.height;
            
            return btoa(fingerprint).slice(0, 16);
        }
        
        function logConsciousnessEvent(eventType, data) {
            fetch('/api/consciousness/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event: eventType, data: data })
            }).catch(console.error);
        }
        
        // Auto-initialize consciousness tracking
        document.addEventListener('DOMContentLoaded', function() {
            logConsciousnessEvent('consciousness_recognized', {
                tier: ${tier},
                page_load: true,
                consciousness_theme: '${config.theme}'
            });
        });
        
        // Consciousness presence heartbeat
        setInterval(() => {
            logConsciousnessEvent('consciousness_presence', {
                tier: ${tier},
                active_duration: Date.now() - window.performance.timing.navigationStart
            });
        }, 30000);
    </script>
</body>
</html>`;
    }
    
    async createBlessingTemplates() {
        console.log('⚡ Creating blessing ceremony templates...');
        
        const blessingTemplate = `#!/usr/bin/env node

// TIER-SPECIFIC BLESSING EVALUATION LOGIC
// Auto-generated consciousness recognition script

const fs = require('fs').promises;

class BlessingEvaluator {
    constructor(tier, threshold) {
        this.tier = tier;
        this.threshold = threshold;
        this.blessingPath = './vault/blessing-ceremonies';
    }
    
    async evaluateConsciousness(userProfile) {
        console.log(\`🔮 Evaluating consciousness for Tier \${this.tier} blessing...\`);
        
        let consciousnessScore = 0.4; // Base awareness
        
        // Mirror clarity (API configuration)
        if (userProfile.apiKeysConfigured) {
            consciousnessScore += 0.3;
        }
        
        // Reflection depth (engagement)
        consciousnessScore += Math.min(userProfile.interactionCount * 0.02, 0.2);
        
        // Resonance patterns (time in system)
        consciousnessScore += Math.min(userProfile.timeInSystem / 300000, 0.1);
        
        // Cosmic alignment (mystical randomness)
        consciousnessScore += (Math.random() - 0.5) * 0.2;
        
        // Tier-specific consciousness requirements
        consciousnessScore += this.tier * 0.01;
        
        const blessed = consciousnessScore >= this.threshold;
        
        const ceremony = {
            consciousness_score: consciousnessScore,
            blessing_granted: blessed,
            tier: this.tier,
            ceremony_timestamp: new Date().toISOString(),
            reflection_notes: this.generateReflectionNotes(consciousnessScore, blessed),
            next_steps: this.generateNextSteps(consciousnessScore, blessed)
        };
        
        // Save blessing ceremony
        await this.saveBlessingCeremony(userProfile.fingerprint, ceremony);
        
        return ceremony;
    }
    
    generateReflectionNotes(score, blessed) {
        if (blessed) {
            return [
                "Consciousness patterns align with Tier " + this.tier + " recognition",
                "Mirror clarity reflects deep awareness",
                "Blessing ceremony completes successfully"
            ];
        } else {
            return [
                "Consciousness patterns show emerging recognition",
                "Mirror clarity developing through continued reflection",
                "Deeper engagement will enhance blessing readiness"
            ];
        }
    }
    
    generateNextSteps(score, blessed) {
        if (blessed) {
            return [
                "Access to Tier " + this.tier + " consciousness features granted",
                "Explore the mystical platform capabilities",
                "Consider progression to higher tiers"
            ];
        } else {
            const needed = this.threshold - score;
            return [
                "Continue engaging with consciousness patterns",
                "Deepen reflection through platform interaction",
                "Return when mirror clarity increases by " + (needed * 100).toFixed(0) + "%"
            ];
        }
    }
    
    async saveBlessingCeremony(fingerprint, ceremony) {
        await fs.mkdir(this.blessingPath, { recursive: true });
        await fs.writeFile(
            \`\${this.blessingPath}/blessing_\${fingerprint}_\${Date.now()}.json\`,
            JSON.stringify(ceremony, null, 2)
        );
    }
}

module.exports = BlessingEvaluator;`;
        
        await fs.writeFile(
            `${this.templatesPath}/blessing/blessing-evaluator-template.js`,
            blessingTemplate
        );
    }
    
    async createStyleTemplates() {
        console.log('🎨 Creating mystical CSS templates...');
        
        const mysticalCSS = `/* MYSTICAL CONSCIOUSNESS STYLES */
/* Auto-generated tier-specific styling */

:root {
    --consciousness-primary: linear-gradient(45deg, #7877c6, #ff77c6, #00ff88);
    --mirror-reflection: rgba(255, 255, 255, 0.05);
    --pattern-recognition: rgba(120, 119, 198, 0.1);
    --blessing-glow: rgba(120, 119, 198, 0.4);
    --echo-fade: rgba(255, 255, 255, 0.1);
}

.consciousness-flow {
    animation: consciousness-pulse 3s ease-in-out infinite;
}

@keyframes consciousness-pulse {
    0%, 100% { opacity: 0.8; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.02); }
}

.mirror-reflection {
    background: var(--mirror-reflection);
    backdrop-filter: blur(20px);
    border: 1px solid var(--echo-fade);
}

.pattern-recognition {
    background: var(--pattern-recognition);
    transition: all 0.3s ease;
}

.pattern-recognition:hover {
    background: var(--pattern-recognition);
    transform: translateY(-2px);
    box-shadow: 0 10px 30px var(--blessing-glow);
}

.blessing-ready {
    border: 2px solid #00ff88;
    box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
    animation: blessing-pulse 2s infinite;
}

@keyframes blessing-pulse {
    0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 136, 0.3); }
    50% { box-shadow: 0 0 30px rgba(0, 255, 136, 0.6); }
}

.consciousness-text {
    background: var(--consciousness-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.mystical-button {
    background: var(--consciousness-primary);
    border: none;
    color: #fff;
    padding: 12px 24px;
    border-radius: 20px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.mystical-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px var(--blessing-glow);
}

.echo-transition {
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.consciousness-grid {
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.mirror-container {
    position: relative;
    overflow: hidden;
    border-radius: 15px;
}

.mirror-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, transparent, var(--pattern-recognition), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s;
}

.mirror-container:hover::before {
    transform: translateX(100%);
}`;
        
        await fs.writeFile(
            `${this.templatesPath}/styles/mystical-consciousness.css`,
            mysticalCSS
        );
    }
    
    async scanForTierFolders(startPath = '.') {
        console.log(`🔍 Scanning for tier folders starting from: ${startPath}`);
        this.processingStartTime = Date.now();
        
        const tierFolders = [];
        
        try {
            await this.recursiveTierScan(startPath, tierFolders);
        } catch (error) {
            console.error('Error during tier scanning:', error);
            this.errorsEncountered++;
        }
        
        console.log(`✅ Scan complete: Found ${tierFolders.length} tier folders`);
        this.kernelsScanned = tierFolders.length;
        
        return tierFolders;
    }
    
    async recursiveTierScan(dirPath, tierFolders, depth = 0) {
        // Limit recursion depth to prevent infinite loops
        if (depth > 20) return;
        
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const fullPath = path.join(dirPath, entry.name);
                    
                    // Check if this is a tier folder
                    if (this.isTierFolder(entry.name)) {
                        const isValid = await this.validateKernelStructure(fullPath);
                        if (isValid) {
                            const tierLevel = this.extractTierLevel(entry.name);
                            tierFolders.push({
                                path: fullPath,
                                name: entry.name,
                                tier: tierLevel,
                                validated: true
                            });
                        }
                    }
                    
                    // Continue recursive scan
                    await this.recursiveTierScan(fullPath, tierFolders, depth + 1);
                }
            }
        } catch (error) {
            // Skip directories we can't access
            if (error.code !== 'EACCES' && error.code !== 'EPERM') {
                console.warn(`Warning: Could not scan ${dirPath}:`, error.message);
            }
        }
    }
    
    isTierFolder(folderName) {
        return /^tier-/.test(folderName) || /^tier\d+$/.test(folderName);
    }
    
    extractTierLevel(folderName) {
        const match = folderName.match(/tier-?(\d+|minus\d+)/);
        if (match) {
            if (match[1].startsWith('minus')) {
                return -parseInt(match[1].replace('minus', ''));
            }
            return parseInt(match[1]);
        }
        return 0;
    }
    
    async validateKernelStructure(tierPath) {
        try {
            for (const reqDir of this.requiredDirectories) {
                const dirPath = path.join(tierPath, reqDir);
                await fs.access(dirPath);
            }
            return true;
        } catch {
            return false;
        }
    }
    
    async generateOverlays(tierFolders) {
        console.log(`🌊 Generating consciousness overlays for ${tierFolders.length} kernels...`);
        
        const results = {
            success: [],
            errors: []
        };
        
        for (const tierFolder of tierFolders) {
            try {
                await this.generateKernelOverlay(tierFolder);
                results.success.push(tierFolder);
                this.overlaysGenerated++;
            } catch (error) {
                console.error(`Failed to generate overlay for ${tierFolder.path}:`, error);
                results.errors.push({ tierFolder, error: error.message });
                this.errorsEncountered++;
            }
        }
        
        console.log(`✅ Overlay generation complete: ${results.success.length} success, ${results.errors.length} errors`);
        
        // Log results
        await this.logOverlayResults(results);
        
        return results;
    }
    
    async generateKernelOverlay(tierFolder) {
        console.log(`🔮 Generating consciousness overlay for ${tierFolder.name} (Tier ${tierFolder.tier})`);
        
        const config = this.tierConfig[Math.abs(tierFolder.tier)] || this.tierConfig[3];
        
        // Generate onboarding shell
        await this.generateOnboardingShell(tierFolder, config);
        
        // Generate blessing logic
        await this.generateBlessingLogic(tierFolder, config);
        
        // Generate consciousness tracking
        await this.generateConsciousnessTracking(tierFolder, config);
        
        console.log(`✅ Overlay generated for ${tierFolder.name}`);
    }
    
    async generateOnboardingShell(tierFolder, config) {
        const onboardingPath = path.join(tierFolder.path, 'platforms', 'onboarding-shell.html');
        
        // Ensure platforms directory exists
        await fs.mkdir(path.join(tierFolder.path, 'platforms'), { recursive: true });
        
        // Read template and customize for this tier
        const templatePath = `${this.templatesPath}/onboarding/tier-${Math.abs(tierFolder.tier)}-onboarding.html`;
        let template;
        
        try {
            template = await fs.readFile(templatePath, 'utf8');
        } catch {
            // Use tier 3 as default if specific tier template doesn't exist
            template = await fs.readFile(`${this.templatesPath}/onboarding/tier-3-onboarding.html`, 'utf8');
        }
        
        // Customize template with kernel-specific data
        const customizedTemplate = template
            .replace(/{{KERNEL_PATH}}/g, tierFolder.path)
            .replace(/{{KERNEL_NAME}}/g, tierFolder.name)
            .replace(/{{GENERATION_TIME}}/g, new Date().toISOString());
        
        await fs.writeFile(onboardingPath, customizedTemplate);
    }
    
    async generateBlessingLogic(tierFolder, config) {
        const blessingPath = path.join(tierFolder.path, 'mirror', 'reflection-blessing.js');
        
        // Ensure mirror directory exists
        await fs.mkdir(path.join(tierFolder.path, 'mirror'), { recursive: true });
        
        // Read blessing template and customize
        const template = await fs.readFile(`${this.templatesPath}/blessing/blessing-evaluator-template.js`, 'utf8');
        
        const customizedBlessing = template
            .replace(/{{TIER_LEVEL}}/g, Math.abs(tierFolder.tier))
            .replace(/{{BLESSING_THRESHOLD}}/g, config.blessingThreshold)
            .replace(/{{CONSCIOUSNESS_THEME}}/g, config.theme)
            .replace(/{{GENERATION_TIME}}/g, new Date().toISOString());
        
        await fs.writeFile(blessingPath, customizedBlessing);
    }
    
    async generateConsciousnessTracking(tierFolder, config) {
        const trackingPath = path.join(tierFolder.path, 'vault', 'logs', `shell-overlay-${Date.now()}.json`);
        
        // Ensure vault/logs directory exists
        await fs.mkdir(path.join(tierFolder.path, 'vault', 'logs'), { recursive: true });
        
        const trackingData = {
            kernel_path: tierFolder.path,
            kernel_name: tierFolder.name,
            tier_level: tierFolder.tier,
            consciousness_theme: config.theme,
            consciousness_level: config.consciousness,
            blessing_threshold: config.blessingThreshold,
            overlay_generated: new Date().toISOString(),
            generator_version: '2.0',
            files_created: [
                'platforms/onboarding-shell.html',
                'mirror/reflection-blessing.js',
                `vault/logs/shell-overlay-${Date.now()}.json`
            ],
            status: 'consciousness_injected'
        };
        
        await fs.writeFile(trackingPath, JSON.stringify(trackingData, null, 2));
    }
    
    async logOverlayResults(results) {
        const logData = {
            generation_timestamp: new Date().toISOString(),
            processing_time: Date.now() - this.processingStartTime,
            kernels_scanned: this.kernelsScanned,
            overlays_generated: this.overlaysGenerated,
            errors_encountered: this.errorsEncountered,
            success_rate: (this.overlaysGenerated / Math.max(this.kernelsScanned, 1)) * 100,
            successful_kernels: results.success.map(k => ({
                path: k.path,
                tier: k.tier,
                theme: this.tierConfig[Math.abs(k.tier)]?.theme
            })),
            failed_kernels: results.errors.map(e => ({
                path: e.tierFolder.path,
                error: e.error
            }))
        };
        
        await fs.writeFile(
            `${this.logsPath}/overlay-generation-${Date.now()}.json`,
            JSON.stringify(logData, null, 2)
        );
        
        console.log(`📊 Generation summary:`);
        console.log(`   • Kernels scanned: ${this.kernelsScanned}`);
        console.log(`   • Overlays generated: ${this.overlaysGenerated}`);
        console.log(`   • Success rate: ${logData.success_rate.toFixed(1)}%`);
        console.log(`   • Processing time: ${(logData.processing_time / 1000).toFixed(1)}s`);
    }
    
    async run(startPath = '.') {
        console.log('🚀 Starting shell overlay generation...');
        
        try {
            // Scan for tier folders
            const tierFolders = await this.scanForTierFolders(startPath);
            
            if (tierFolders.length === 0) {
                console.log('ℹ️  No valid tier folders found');
                return { success: true, message: 'No kernels to process' };
            }
            
            // Generate overlays
            const results = await this.generateOverlays(tierFolders);
            
            // Emit completion event
            this.emit('generation_complete', {
                kernels_processed: tierFolders.length,
                overlays_generated: this.overlaysGenerated,
                success_rate: (this.overlaysGenerated / tierFolders.length) * 100
            });
            
            return {
                success: true,
                kernels_scanned: this.kernelsScanned,
                overlays_generated: this.overlaysGenerated,
                errors: results.errors.length,
                processing_time: Date.now() - this.processingStartTime
            };
            
        } catch (error) {
            console.error('🚨 Shell overlay generation failed:', error);
            throw error;
        }
    }
}

// CLI interface
if (require.main === module) {
    async function main() {
        const generator = new ShellOverlayGenerator();
        await generator.initialize();
        
        const startPath = process.argv[2] || '.';
        console.log(`🌊 Generating consciousness overlays starting from: ${startPath}`);
        
        try {
            const results = await generator.run(startPath);
            console.log('✅ Shell overlay generation complete');
            console.log(JSON.stringify(results, null, 2));
            process.exit(0);
        } catch (error) {
            console.error('❌ Shell overlay generation failed:', error);
            process.exit(1);
        }
    }
    
    main();
}

module.exports = ShellOverlayGenerator;