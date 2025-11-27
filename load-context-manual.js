import fs from 'fs';
import path from 'path';

class ManualContextLoader {
    constructor() {
        this.context = {
            buildingProcess: [],
            strategicDecisions: [],
            technicalChoices: [],
            reasoningPatterns: []
        };
    }

    async loadCurrentDirectory(searchPath = '.') {
        console.log(`🔍 Scanning ${searchPath} for context...`);
        
        const files = this.findAllFiles(searchPath);
        console.log(`📄 Found ${files.length} potential files`);
        
        for (const file of files) {
            try {
                await this.processFile(file);
            } catch (error) {
                console.log(`⚠️  Skipped ${file}: ${error.message}`);
            }
        }
        
        await this.saveContext();
        console.log(`✅ Processed context with ${this.context.buildingProcess.length} documents`);
        return this.context;
    }

    findAllFiles(dir) {
        const files = [];
        
        function scanDir(directory, depth = 0) {
            if (depth > 3) return; // Limit depth
            
            try {
                const items = fs.readdirSync(directory);
                
                for (const item of items) {
                    if (item.startsWith('.') || item === 'node_modules') continue;
                    
                    const fullPath = path.join(directory, item);
                    const stat = fs.statSync(fullPath);
                    
                    if (stat.isDirectory()) {
                        scanDir(fullPath, depth + 1);
                    } else if (this.isRelevantFile(item)) {
                        files.push(fullPath);
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        }
        
        scanDir.bind(this)(dir);
        return files;
    }

    isRelevantFile(filename) {
        const relevant = ['.md', '.txt', '.json', '.js', '.ts'];
        const irrelevant = ['package-lock.json', 'node_modules', '.git'];
        
        if (irrelevant.some(pattern => filename.includes(pattern))) return false;
        return relevant.some(ext => filename.endsWith(ext));
    }

    async processFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const filename = path.basename(filePath);
        
        // Skip if too small or too large
        if (content.length < 50 || content.length > 50000) return;
        
        const processed = {
            filename: filename,
            path: filePath,
            type: this.detectType(content, filename),
            content: content.substring(0, 2000), // First 2000 chars
            keyDecisions: this.extractDecisions(content),
            strategicInsights: this.extractStrategy(content),
            technicalInfo: this.extractTechnical(content),
            buildingPatterns: this.extractPatterns(content)
        };
        
        this.context.buildingProcess.push(processed);
        console.log(`📄 Processed: ${filename} (${processed.type})`);
    }

    detectType(content, filename) {
        const lower = content.toLowerCase();
        if (filename.includes('prd') || lower.includes('product requirement')) return 'product';
        if (filename.includes('integration') || lower.includes('integration')) return 'integration';
        if (filename.includes('strategy') || lower.includes('strategy')) return 'strategic';
        if (filename.includes('server') || filename.includes('backend')) return 'backend';
        if (filename.includes('frontend') || filename.includes('react')) return 'frontend';
        if (lower.includes('soulfra')) return 'soulfra-specific';
        return 'general';
    }

    extractDecisions(content) {
        const decisions = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            const lower = line.toLowerCase();
            if (lower.includes('decision') || lower.includes('decided') || 
                lower.includes('choice') || lower.includes('selected') ||
                lower.includes('recommend') || lower.includes('should')) {
                decisions.push(line.trim().substring(0, 200));
            }
        }
        
        return decisions.slice(0, 5); // Top 5
    }

    extractStrategy(content) {
        const strategy = [];
        const lines = content.split('\n');
        const strategicTerms = ['market', 'competitive', 'advantage', 'positioning', 
                               'value', 'revenue', 'business', 'customer', 'user'];
        
        for (const line of lines) {
            if (strategicTerms.some(term => line.toLowerCase().includes(term))) {
                strategy.push(line.trim().substring(0, 200));
            }
        }
        
        return strategy.slice(0, 5); // Top 5
    }

    extractTechnical(content) {
        const technical = [];
        
        // Look for code blocks, API endpoints, technical terms
        if (content.includes('```')) {
            technical.push('Contains code blocks');
        }
        if (content.includes('API') || content.includes('endpoint')) {
            technical.push('API/endpoint references');
        }
        if (content.includes('implementation') || content.includes('architecture')) {
            technical.push('Implementation details');
        }
        
        return technical;
    }

    extractPatterns(content) {
        const patterns = [];
        const lower = content.toLowerCase();
        
        if (lower.includes('step') || lower.includes('process')) patterns.push('systematic_approach');
        if (lower.includes('user') || lower.includes('customer')) patterns.push('user_focused');
        if (lower.includes('simple') || lower.includes('clear')) patterns.push('clarity_first');
        if (lower.includes('iterate') || lower.includes('improve')) patterns.push('iterative');
        if (lower.includes('trust') || lower.includes('privacy')) patterns.push('trust_native');
        if (lower.includes('platform') || lower.includes('scaling')) patterns.push('platform_thinking');
        
        return patterns;
    }

    async saveContext() {
        const dir = './cal-riven/context';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        const contextFile = path.join(dir, 'soulfra-knowledge.json');
        fs.writeFileSync(contextFile, JSON.stringify(this.context, null, 2));
        console.log(`💾 Saved context to: ${contextFile}`);
    }
}

// Run the loader
const loader = new ManualContextLoader();
const docPath = process.argv[2] || '.';

loader.loadCurrentDirectory(docPath)
    .then(context => {
        console.log(`\n🎯 Context Summary:`);
        console.log(`   Documents: ${context.buildingProcess.length}`);
        console.log(`   Strategic insights: ${context.buildingProcess.reduce((acc, doc) => acc + doc.strategicInsights.length, 0)}`);
        console.log(`   Technical info: ${context.buildingProcess.reduce((acc, doc) => acc + doc.technicalInfo.length, 0)}`);
        console.log(`   Building patterns: ${[...new Set(context.buildingProcess.flatMap(doc => doc.buildingPatterns))].length}`);
    })
    .catch(console.error);
