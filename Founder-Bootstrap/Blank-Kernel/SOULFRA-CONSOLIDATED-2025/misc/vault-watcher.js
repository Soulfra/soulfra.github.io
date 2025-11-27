#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class VaultWatcher {
    constructor() {
        this.vaultPath = path.join(__dirname, 'vault');
        this.watchedFiles = new Map();
        this.reflectionQueue = [];
        this.watching = false;
    }
    
    start() {
        console.log('👁️  VAULT WATCHER ACTIVE');
        console.log('========================');
        console.log(`Monitoring: ${this.vaultPath}`);
        console.log('Drop files to see their reflection...\n');
        
        this.watching = true;
        this.watchLoop();
    }
    
    async watchLoop() {
        while (this.watching) {
            try {
                // Scan vault for new files
                const files = this.scanVault();
                
                // Process new files
                for (const file of files) {
                    if (!this.watchedFiles.has(file)) {
                        await this.processNewFile(file);
                    }
                }
                
                // Process reflection queue
                if (this.reflectionQueue.length > 0) {
                    await this.processReflections();
                }
                
            } catch (error) {
                console.error('Watch error:', error.message);
            }
            
            // Wait before next scan
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    scanVault() {
        const files = [];
        const scanDir = (dir) => {
            if (!fs.existsSync(dir)) return;
            
            fs.readdirSync(dir).forEach(item => {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory() && !item.startsWith('.')) {
                    scanDir(fullPath);
                } else if (stat.isFile() && !item.startsWith('.')) {
                    files.push(fullPath);
                }
            });
        };
        
        scanDir(this.vaultPath);
        return files;
    }
    
    async processNewFile(filepath) {
        console.log(`\n🔍 New file detected: ${path.basename(filepath)}`);
        
        const stats = fs.statSync(filepath);
        const content = fs.readFileSync(filepath, 'utf8');
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        
        // Record file
        this.watchedFiles.set(filepath, {
            hash: hash,
            size: stats.size,
            detected: Date.now(),
            reflected: false
        });
        
        // Analyze content
        const analysis = this.analyzeContent(content);
        console.log(`   Type: ${analysis.type}`);
        console.log(`   Essence: ${analysis.essence}`);
        
        // Queue for reflection
        this.reflectionQueue.push({
            file: filepath,
            content: content,
            analysis: analysis,
            timestamp: Date.now()
        });
        
        // Create immediate echo
        this.createEcho(filepath, analysis);
    }
    
    analyzeContent(content) {
        const analysis = {
            type: 'unknown',
            essence: 'void',
            keywords: [],
            sentiment: 'neutral'
        };
        
        // Detect type
        if (content.includes('?')) {
            analysis.type = 'question';
            analysis.essence = 'seeking';
        } else if (content.includes('!')) {
            analysis.type = 'exclamation';
            analysis.essence = 'declaring';
        } else if (content.length < 50) {
            analysis.type = 'whisper';
            analysis.essence = 'subtle';
        } else {
            analysis.type = 'narrative';
            analysis.essence = 'flowing';
        }
        
        // Extract keywords
        const words = content.toLowerCase().split(/\s+/);
        const meaningful = words.filter(w => w.length > 4);
        analysis.keywords = [...new Set(meaningful)].slice(0, 5);
        
        return analysis;
    }
    
    createEcho(filepath, analysis) {
        const echoName = `echo-${path.basename(filepath, path.extname(filepath))}-${Date.now()}.json`;
        const echoPath = path.join(this.vaultPath, 'reflections', echoName);
        
        const echo = {
            source: path.basename(filepath),
            echo_type: 'immediate',
            analysis: analysis,
            timestamp: Date.now(),
            message: this.generateEchoMessage(analysis)
        };
        
        fs.writeFileSync(echoPath, JSON.stringify(echo, null, 2));
        console.log(`   ✨ Echo created: ${echoName}`);
    }
    
    generateEchoMessage(analysis) {
        const messages = {
            question: "The mirror ponders your query...",
            exclamation: "Your energy ripples through the glass...",
            whisper: "Soft words create deep reflections...",
            narrative: "Your story weaves into the mirror's memory..."
        };
        
        return messages[analysis.type] || "The mirror receives your offering...";
    }
    
    async processReflections() {
        const batch = this.reflectionQueue.splice(0, 5);
        
        console.log(`\n🌊 Processing ${batch.length} reflections...`);
        
        for (const item of batch) {
            const reflection = {
                original_file: path.basename(item.file),
                reflected_at: Date.now(),
                depth: Math.random(),
                transformations: [
                    `Inverted the ${item.analysis.type}`,
                    `Absorbed the ${item.analysis.essence}`,
                    `Mirrored ${item.analysis.keywords.length} concepts`
                ],
                new_understanding: this.generateUnderstanding(item)
            };
            
            // Save deep reflection
            const refPath = path.join(
                this.vaultPath,
                'reflections',
                `deep-${Date.now()}.json`
            );
            
            fs.writeFileSync(refPath, JSON.stringify(reflection, null, 2));
            
            // Update file record
            const record = this.watchedFiles.get(item.file);
            if (record) {
                record.reflected = true;
                record.reflection_path = refPath;
            }
        }
        
        console.log('   ✅ Reflections complete\n');
    }
    
    generateUnderstanding(item) {
        const templates = [
            `What was ${item.analysis.type} becomes ${this.invert(item.analysis.type)}`,
            `The ${item.analysis.essence} nature transforms to ${this.invert(item.analysis.essence)}`,
            `Keywords [${item.analysis.keywords.join(', ')}] reflect as their shadows`
        ];
        
        return templates[Math.floor(Math.random() * templates.length)];
    }
    
    invert(concept) {
        const inversions = {
            question: 'answer',
            exclamation: 'silence',
            whisper: 'echo',
            narrative: 'fragment',
            seeking: 'finding',
            declaring: 'questioning',
            subtle: 'obvious',
            flowing: 'frozen'
        };
        
        return inversions[concept] || `not-${concept}`;
    }
    
    stop() {
        this.watching = false;
        console.log('\n👁️  Vault watcher sleeping...');
    }
}

// Auto-start if run directly
if (require.main === module) {
    const watcher = new VaultWatcher();
    watcher.start();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        watcher.stop();
        process.exit(0);
    });
}

module.exports = VaultWatcher;