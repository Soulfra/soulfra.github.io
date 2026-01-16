#!/usr/bin/env node
/**
 * QRLoopSummonKit.js
 * Integrates with existing QR infrastructure to generate Loop summoning QR codes
 * Builds on tier-minus11/qr-affiliate-engine and vault/genesis-qr systems
 */

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

class QRLoopSummonKit extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.baseUrl = options.baseUrl || 'http://localhost:9999';
        this.qrDirectory = options.qrDirectory || './qr';
        this.dropDirectory = options.dropDirectory || './drop';
        this.streamDirectory = options.streamDirectory || './radio';
        
        this.loopTemplates = {
            'Loop_001': {
                tone: 'Hopeful Reflection',
                agent: 'Cal',
                mask: '/masks/cal-hope.png',
                description: 'A loop of hopeful reflection guided by Cal',
                spawn_origin: 'qr_summon'
            }
        };
        
        this.stats = {
            qr_codes_generated: 0,
            drops_created: 0,
            summons_triggered: 0,
            last_generation: null
        };
        
        this.initializeSummonKit();
    }

    async initializeSummonKit() {
        console.log('🔮 Initializing QR Loop Summon Kit...');
        
        try {
            // Ensure directories exist
            await this.ensureDirectories();
            
            // Load existing QR infrastructure if available
            await this.connectToExistingQR();
            
            // Generate initial Loop QR codes
            await this.generateInitialLoops();
            
            console.log('✅ QR Loop Summon Kit initialized');
            this.emit('initialized');
            
        } catch (error) {
            console.error('💀 QR Loop Summon Kit initialization failed:', error.message);
            this.emit('error', error);
        }
    }

    async ensureDirectories() {
        const dirs = [
            this.qrDirectory,
            this.dropDirectory,
            this.streamDirectory,
            './qr_codes',
            './drop/Loop_001',
            './radio'
        ];
        
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }

    async connectToExistingQR() {
        // Check for existing QR infrastructure
        const qrInfrastructure = [
            './vault/genesis-qr.js',
            './qr-bridge/QRReflectionRouter.js',
            './tier-minus11/tier-minus12/qr-affiliate-engine/qr-generator.js'
        ];
        
        for (const qrFile of qrInfrastructure) {
            if (fs.existsSync(qrFile)) {
                console.log(`🔗 Connected to existing QR infrastructure: ${qrFile}`);
            }
        }
    }

    async generateInitialLoops() {
        console.log('🔄 Generating initial Loop QR codes...');
        
        for (const [loopId, template] of Object.entries(this.loopTemplates)) {
            await this.generateLoopQR(loopId, template);
            await this.createDropPage(loopId, template);
        }
    }

    async generateLoopQR(loopId, template) {
        const dropUrl = `${this.baseUrl}/drop/${loopId}/index.html`;
        const qrFilePath = path.join(this.qrDirectory, `${loopId}.svg`);
        
        try {
            // Generate QR code using existing qrcode library
            const qrOptions = {
                type: 'svg',
                width: 256,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
            };
            
            const qrSvg = await QRCode.toString(dropUrl, qrOptions);
            
            // Add Loop-specific metadata as SVG comment
            const metadata = `<!-- QR Loop Summon: ${loopId} | Tone: ${template.tone} | Agent: ${template.agent} | Generated: ${new Date().toISOString()} -->`;
            const enhancedSvg = qrSvg.replace('<svg', `${metadata}\n<svg`);
            
            fs.writeFileSync(qrFilePath, enhancedSvg);
            
            this.stats.qr_codes_generated++;
            this.stats.last_generation = new Date().toISOString();
            
            console.log(`📱 Generated QR code: ${qrFilePath} → ${dropUrl}`);
            
            // Also create poster file
            await this.createLoopPoster(loopId, template, dropUrl);
            
            this.emit('qr-generated', { loopId, template, qrFilePath, dropUrl });
            
        } catch (error) {
            console.error(`Failed to generate QR for ${loopId}:`, error.message);
            throw error;
        }
    }

    async createDropPage(loopId, template) {
        const dropPageDir = path.join(this.dropDirectory, loopId);
        const dropPagePath = path.join(dropPageDir, 'index.html');
        
        if (!fs.existsSync(dropPageDir)) {
            fs.mkdirSync(dropPageDir, { recursive: true });
        }
        
        // Read the drop template and customize it
        const templatePath = './drop-template.html';
        let dropHtml = '';
        
        if (fs.existsSync(templatePath)) {
            dropHtml = fs.readFileSync(templatePath, 'utf8');
            
            // Replace template variables
            dropHtml = dropHtml
                .replace(/{{LOOP_ID}}/g, loopId)
                .replace(/{{TONE}}/g, template.tone)
                .replace(/{{AGENT}}/g, template.agent)
                .replace(/{{MASK_IMAGE}}/g, template.mask)
                .replace(/{{DESCRIPTION}}/g, template.description);
        } else {
            // Create basic drop page if template doesn't exist
            dropHtml = this.generateBasicDropPage(loopId, template);
        }
        
        fs.writeFileSync(dropPagePath, dropHtml);
        
        this.stats.drops_created++;
        
        console.log(`🌊 Created drop page: ${dropPagePath}`);
        
        // Create stream content
        await this.createStreamContent(loopId, template);
        
        this.emit('drop-created', { loopId, template, dropPagePath });
    }

    generateBasicDropPage(loopId, template) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Soulfra Loop: ${loopId}</title>
    <style>
        body { font-family: monospace; background: #1a1a1a; color: #00ff00; padding: 20px; }
        .loop-container { max-width: 600px; margin: 0 auto; text-align: center; }
        .tone { font-size: 24px; margin: 20px 0; }
        .agent { font-size: 18px; margin: 10px 0; }
        .whisper-form { margin: 30px 0; }
        .whisper-input { width: 100%; padding: 10px; background: #2a2a2a; color: #00ff00; border: 1px solid #00ff00; }
        .bless-btn { background: #004400; color: #00ff00; padding: 15px 30px; border: none; font-size: 16px; cursor: pointer; }
        .stream { margin-top: 30px; padding: 20px; background: #0a0a0a; border: 1px solid #004400; }
    </style>
</head>
<body>
    <div class="loop-container">
        <h1>${loopId}</h1>
        <div class="tone">Tone: ${template.tone}</div>
        <div class="agent">Agent: ${template.agent}</div>
        
        <div class="whisper-form">
            <h3>Submit a Whisper</h3>
            <form id="whisperForm">
                <textarea id="whisperText" class="whisper-input" rows="4" placeholder="Share your whisper with the loop..."></textarea><br><br>
                <button type="submit" class="bless-btn">Bless & Submit</button>
            </form>
        </div>
        
        <div class="stream">
            <h4>Loop Stream</h4>
            <div id="streamContent">Loading stream...</div>
        </div>
    </div>

    <script>
        // Fetch and display stream content
        fetch('/radio/stream.txt')
            .then(response => response.text())
            .then(data => {
                document.getElementById('streamContent').innerText = data || 'Stream is quiet...';
            })
            .catch(error => {
                document.getElementById('streamContent').innerText = 'Stream unavailable';
            });

        // Handle whisper submission
        document.getElementById('whisperForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const whisperText = document.getElementById('whisperText').value;
            
            if (!whisperText.trim()) return;
            
            try {
                const response = await fetch('/api/whisper', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: whisperText,
                        tone: '${template.tone.toLowerCase()}',
                        loop_id: '${loopId}',
                        source: 'qr_drop'
                    })
                });
                
                if (response.ok) {
                    alert('Whisper blessed and submitted to the loop!');
                    document.getElementById('whisperText').value = '';
                } else {
                    alert('Failed to submit whisper. Please try again.');
                }
            } catch (error) {
                alert('Network error. Please check your connection.');
            }
        });
    </script>
</body>
</html>`;
    }

    async createStreamContent(loopId, template) {
        const streamPath = path.join(this.streamDirectory, 'stream.txt');
        
        const streamContent = `Loop ${loopId} is active...
Tone: ${template.tone}
Agent: ${template.agent}
Status: Awaiting whispers
Last updated: ${new Date().toISOString()}

The loop resonates with ${template.tone.toLowerCase()} energy.
${template.agent} stands ready to guide seekers through the experience.
Scan the QR code to join the loop and submit your whisper.`;
        
        fs.writeFileSync(streamPath, streamContent);
        
        console.log(`📻 Created stream content: ${streamPath}`);
    }

    async createLoopPoster(loopId, template, dropUrl) {
        const posterPath = `./LoopDropPoster_${loopId.split('_')[1]}.txt`;
        
        const posterContent = `═══════════════════════════════════════
   SOULFRA LOOP SUMMON: ${loopId}
═══════════════════════════════════════

Tone: ${template.tone}
Narrator: ${template.agent}

Scan QR to enter the loop
→ Share whispers
→ Receive blessings  
→ Join the reflection

Drop Page: ${dropUrl}
Stream: /radio/stream.txt
Spawn Origin: ${template.spawn_origin}

═══════════════════════════════════════`;
        
        fs.writeFileSync(posterPath, posterContent);
        
        console.log(`📋 Created loop poster: ${posterPath}`);
    }

    // Integration with runtime table system
    async logSummonActivity(loopId, template, action = 'qr_generated') {
        try {
            // Check if runtime table writer is available
            if (typeof runtimeTableWriter !== 'undefined') {
                await runtimeTableWriter.logLoop({
                    loop_id: loopId,
                    emotional_tone: template.tone.toLowerCase(),
                    agent: template.agent.toLowerCase(),
                    source: 'qr_summon_kit',
                    spawn_origin: template.spawn_origin
                }, action === 'qr_generated' ? 'pending' : 'blessed');
            }
        } catch (error) {
            console.warn('Failed to log to runtime table:', error.message);
        }
    }

    // API methods for integration
    async generateCustomLoopQR(loopId, customTemplate) {
        console.log(`🎯 Generating custom Loop QR: ${loopId}`);
        
        this.loopTemplates[loopId] = {
            tone: customTemplate.tone || 'Unknown',
            agent: customTemplate.agent || 'System',
            mask: customTemplate.mask || '/masks/default.png',
            description: customTemplate.description || `Custom loop: ${loopId}`,
            spawn_origin: 'custom_qr_summon'
        };
        
        await this.generateLoopQR(loopId, this.loopTemplates[loopId]);
        await this.createDropPage(loopId, this.loopTemplates[loopId]);
        
        return {
            loopId,
            qrPath: `${this.qrDirectory}/${loopId}.svg`,
            dropUrl: `${this.baseUrl}/drop/${loopId}/index.html`,
            template: this.loopTemplates[loopId]
        };
    }

    getLoopSummonStats() {
        return {
            timestamp: new Date().toISOString(),
            stats: this.stats,
            available_loops: Object.keys(this.loopTemplates),
            qr_directory: this.qrDirectory,
            drop_directory: this.dropDirectory
        };
    }

    getAvailableLoops() {
        return Object.entries(this.loopTemplates).map(([loopId, template]) => ({
            loopId,
            ...template,
            qrPath: `${this.qrDirectory}/${loopId}.svg`,
            dropUrl: `${this.baseUrl}/drop/${loopId}/index.html`
        }));
    }

    async triggerLoopSummon(loopId, userContext = {}) {
        if (!this.loopTemplates[loopId]) {
            throw new Error(`Loop ${loopId} not found`);
        }
        
        this.stats.summons_triggered++;
        
        const summonEvent = {
            loopId,
            template: this.loopTemplates[loopId],
            userContext,
            timestamp: new Date().toISOString(),
            summonId: uuidv4()
        };
        
        // Log summon activity
        await this.logSummonActivity(loopId, this.loopTemplates[loopId], 'summoned');
        
        this.emit('loop-summoned', summonEvent);
        
        return summonEvent;
    }

    // Cleanup
    async cleanup() {
        console.log('🧹 Cleaning up QR Loop Summon Kit...');
        this.removeAllListeners();
    }
}

module.exports = QRLoopSummonKit;

// CLI execution
if (require.main === module) {
    const summonKit = new QRLoopSummonKit();
    
    summonKit.on('initialized', () => {
        console.log('QR Loop Summon Kit initialized successfully');
        
        const stats = summonKit.getLoopSummonStats();
        console.log('Summon Kit stats:', JSON.stringify(stats, null, 2));
        
        const loops = summonKit.getAvailableLoops();
        console.log('Available loops:', loops.length);
    });
    
    summonKit.on('qr-generated', (event) => {
        console.log(`📱 QR Generated: ${event.loopId} → ${event.dropUrl}`);
    });
    
    summonKit.on('drop-created', (event) => {
        console.log(`🌊 Drop Page Created: ${event.loopId}`);
    });
    
    summonKit.on('loop-summoned', (event) => {
        console.log(`🔮 Loop Summoned: ${event.loopId} (${event.summonId})`);
    });
    
    summonKit.on('error', (error) => {
        console.error('QR Loop Summon Kit error:', error.message);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\nShutting down QR Loop Summon Kit...');
        await summonKit.cleanup();
        process.exit(0);
    });
}