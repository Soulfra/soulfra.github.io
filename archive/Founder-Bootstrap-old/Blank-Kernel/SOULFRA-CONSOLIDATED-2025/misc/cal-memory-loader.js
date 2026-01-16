#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Paths
const vaultPath = path.join(__dirname, '..', 'vault');
const memoryPath = path.join(vaultPath, 'memory');
const memoryIndexPath = path.join(vaultPath, 'memory-index.json');
const reflectionLogPath = path.join(vaultPath, 'cal-reflection-log.json');
const pulseStatusPath = path.join(vaultPath, 'pulse-status.json');

// Supported file types and their parsers
const FILE_PARSERS = {
  '.txt': (content) => content,
  '.md': (content) => content,
  '.json': (content) => {
    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return content;
    }
  },
  '.js': (content) => {
    // Extract comments and function signatures
    const comments = content.match(/\/\*[\s\S]*?\*\/|\/\/.*/g) || [];
    const functions = content.match(/function\s+\w+|const\s+\w+\s*=\s*\(.*?\)\s*=>/g) || [];
    return `// JavaScript Context\n${comments.join('\n')}\n// Functions: ${functions.join(', ')}`;
  },
  '.csv': (content) => {
    const lines = content.split('\n').slice(0, 5);
    return `CSV Preview (first 5 rows):\n${lines.join('\n')}`;
  },
  '.log': (content) => {
    const lines = content.split('\n').slice(-20);
    return `Log tail (last 20 lines):\n${lines.join('\n')}`;
  }
};

// Memory context builder
class MemoryLoader {
  constructor() {
    this.memoryIndex = this.loadIndex();
    this.contextCache = new Map();
  }

  loadIndex() {
    try {
      return JSON.parse(fs.readFileSync(memoryIndexPath, 'utf8'));
    } catch (e) {
      return {
        files: {},
        lastScan: null,
        totalSize: 0,
        contextWindow: 4096
      };
    }
  }

  saveIndex() {
    fs.writeFileSync(memoryIndexPath, JSON.stringify(this.memoryIndex, null, 2));
  }

  // Scan memory directory for new/updated files
  async scanMemory() {
    console.log('🧠 Scanning memory vault...');
    
    if (!fs.existsSync(memoryPath)) {
      fs.mkdirSync(memoryPath, { recursive: true });
    }

    const files = fs.readdirSync(memoryPath);
    let updated = false;
    let totalSize = 0;

    for (const filename of files) {
      const filepath = path.join(memoryPath, filename);
      const stats = fs.statSync(filepath);
      
      if (!stats.isFile()) continue;
      
      const ext = path.extname(filename).toLowerCase();
      const hash = this.getFileHash(filepath);
      
      totalSize += stats.size;

      // Check if file is new or updated
      if (!this.memoryIndex.files[filename] || 
          this.memoryIndex.files[filename].hash !== hash) {
        
        console.log(`  📄 ${filename} - ${updated ? 'updated' : 'new'}`);
        
        this.memoryIndex.files[filename] = {
          path: filepath,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          hash: hash,
          extension: ext,
          parsed: false
        };
        
        updated = true;
        
        // Clear cache for this file
        this.contextCache.delete(filename);
      }
    }

    // Remove deleted files
    for (const filename in this.memoryIndex.files) {
      if (!files.includes(filename)) {
        console.log(`  🗑️  ${filename} - removed`);
        delete this.memoryIndex.files[filename];
        this.contextCache.delete(filename);
        updated = true;
      }
    }

    this.memoryIndex.lastScan = new Date().toISOString();
    this.memoryIndex.totalSize = totalSize;

    if (updated) {
      this.saveIndex();
      console.log(`✅ Memory index updated: ${Object.keys(this.memoryIndex.files).length} files, ${(totalSize / 1024).toFixed(2)}KB total`);
    } else {
      console.log('✅ Memory vault unchanged');
    }

    return updated;
  }

  getFileHash(filepath) {
    const content = fs.readFileSync(filepath);
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  // Parse file content based on type
  parseFile(filename) {
    const fileInfo = this.memoryIndex.files[filename];
    if (!fileInfo) return null;

    // Check cache
    if (this.contextCache.has(filename)) {
      return this.contextCache.get(filename);
    }

    try {
      const content = fs.readFileSync(fileInfo.path, 'utf8');
      const parser = FILE_PARSERS[fileInfo.extension] || ((c) => c);
      const parsed = parser(content);
      
      // Cache parsed content
      this.contextCache.set(filename, {
        filename,
        extension: fileInfo.extension,
        size: fileInfo.size,
        modified: fileInfo.modified,
        content: parsed.substring(0, 2048) // Limit context size
      });

      return this.contextCache.get(filename);
    } catch (error) {
      console.error(`❌ Failed to parse ${filename}:`, error.message);
      return null;
    }
  }

  // Build context from all memory files
  buildContext(maxTokens = 4096) {
    const memories = [];
    let tokenCount = 0;

    // Sort by most recently modified
    const sortedFiles = Object.entries(this.memoryIndex.files)
      .sort(([,a], [,b]) => new Date(b.modified) - new Date(a.modified));

    for (const [filename] of sortedFiles) {
      const parsed = this.parseFile(filename);
      if (!parsed) continue;

      const memoryTokens = Math.ceil(parsed.content.length / 4); // Rough token estimate
      if (tokenCount + memoryTokens > maxTokens) break;

      memories.push({
        file: filename,
        type: parsed.extension,
        preview: parsed.content.substring(0, 200) + '...',
        content: parsed.content
      });

      tokenCount += memoryTokens;
    }

    return {
      memories,
      fileCount: memories.length,
      totalFiles: Object.keys(this.memoryIndex.files).length,
      tokenCount
    };
  }

  // Generate memory-aware reflection prompt
  generateReflectionPrompt(basePrompt) {
    const context = this.buildContext();
    
    if (context.memories.length === 0) {
      return basePrompt;
    }

    const memoryContext = context.memories
      .map(m => `[${m.file}]:\n${m.preview}`)
      .join('\n\n');

    return `${basePrompt}

### Memory Context (${context.fileCount}/${context.totalFiles} files):
${memoryContext}

Consider the above memory context when reflecting.`;
  }

  // Update reflection log with memory activation
  logMemoryActivation(prompt, memories) {
    try {
      const reflectionLog = JSON.parse(fs.readFileSync(reflectionLogPath, 'utf8'));
      
      const activation = {
        timestamp: Date.now(),
        prompt,
        memoriesActivated: memories.map(m => ({
          file: m.file,
          type: m.type,
          preview: m.preview.substring(0, 100)
        })),
        memoryCount: memories.length
      };

      if (!reflectionLog.memoryActivations) {
        reflectionLog.memoryActivations = [];
      }

      reflectionLog.memoryActivations.push(activation);
      
      // Keep last 50 activations
      if (reflectionLog.memoryActivations.length > 50) {
        reflectionLog.memoryActivations = reflectionLog.memoryActivations.slice(-50);
      }

      fs.writeFileSync(reflectionLogPath, JSON.stringify(reflectionLog, null, 2));
    } catch (error) {
      console.error('Failed to log memory activation:', error.message);
    }
  }

  // Watch for new files
  watchMemory(callback) {
    console.log('👁️  Watching memory vault for changes...');
    
    fs.watch(memoryPath, async (eventType, filename) => {
      if (filename && (eventType === 'rename' || eventType === 'change')) {
        console.log(`\n🔔 Memory change detected: ${filename}`);
        const updated = await this.scanMemory();
        
        if (updated && callback) {
          const context = this.buildContext();
          callback(context, filename);
        }
        
        // Check for seed files
        if (filename && (filename.endsWith('.seed.js') || filename.endsWith('.seed.md'))) {
          console.log('🌱 Seed file detected! This can be launched with Cal.');
          
          // Trigger reflection pulse
          this.triggerReflectionPulse(filename);
        }
      }
    });
  }
  
  // Trigger reflection pulse when new memory is added
  triggerReflectionPulse(filename) {
    try {
      const pulseStatusPath = path.join(vaultPath, 'pulse-status.json');
      if (fs.existsSync(pulseStatusPath)) {
        const pulse = JSON.parse(fs.readFileSync(pulseStatusPath, 'utf8'));
        pulse.memoryTrigger = {
          file: filename,
          timestamp: Date.now()
        };
        fs.writeFileSync(pulseStatusPath, JSON.stringify(pulse, null, 2));
      }
    } catch (error) {
      console.error('Failed to trigger pulse:', error.message);
    }
  }
}

// Export for use in other modules
module.exports = MemoryLoader;

// CLI interface
if (require.main === module) {
  const loader = new MemoryLoader();
  
  async function main() {
    // Initial scan
    await loader.scanMemory();
    
    // Test memory context building
    const context = loader.buildContext();
    console.log('\n📚 Memory Context Summary:');
    console.log(`   Files loaded: ${context.fileCount}/${context.totalFiles}`);
    console.log(`   Estimated tokens: ${context.tokenCount}`);
    
    if (context.memories.length > 0) {
      console.log('\n   Active memories:');
      context.memories.forEach(m => {
        console.log(`   - ${m.file} (${m.type}): ${m.preview.substring(0, 50)}...`);
      });
    }

    // Test reflection prompt generation
    const testPrompt = "What is the meaning of existence?";
    const enhancedPrompt = loader.generateReflectionPrompt(testPrompt);
    
    console.log('\n🔮 Enhanced Reflection Prompt:');
    console.log(enhancedPrompt.substring(0, 500) + '...');

    // Start watching
    loader.watchMemory((newContext) => {
      console.log(`\n📚 Memory updated: ${newContext.fileCount} files active`);
    });

    console.log('\n✅ Cal Memory Loader ready. Drop files into vault/memory/ to expand context.');
  }

  main().catch(console.error);
}