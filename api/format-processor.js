#!/usr/bin/env node
/**
 * Format Processor
 *
 * Multi-modal file type detection and routing
 * Detects: code, audio, images, text, binary, structured data
 * Routes to appropriate analyzer based on format
 *
 * Part of AI Ensemble Training Platform
 *
 * Usage:
 *   const FormatProcessor = require('./format-processor');
 *   const processor = new FormatProcessor();
 *   const analysis = await processor.process('/path/to/file');
 */

const fs = require('fs');
const path = require('path');

class FormatProcessor {
  constructor(options = {}) {
    this.verbose = options.verbose || false;

    // File type mappings
    this.categories = {
      code: [
        '.html', '.htm', '.css', '.js', '.jsx', '.ts', '.tsx',
        '.py', '.rb', '.php', '.java', '.cpp', '.c', '.h',
        '.go', '.rs', '.swift', '.kt', '.json', '.xml', '.yaml', '.yml',
        '.md', '.txt', '.sh', '.bash'
      ],
      audio: [
        '.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.wma',
        '.aiff', '.ape', '.opus'
      ],
      image: [
        '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp',
        '.ico', '.tiff', '.tif', '.psd', '.raw', '.heic'
      ],
      video: [
        '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv',
        '.m4v', '.mpg', '.mpeg', '.3gp'
      ],
      archive: [
        '.zip', '.tar', '.gz', '.bz2', '.rar', '.7z', '.xz'
      ],
      structured: [
        '.json', '.xml', '.yaml', '.yml', '.toml', '.ini', '.csv'
      ],
      document: [
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.odt', '.ods', '.odp'
      ]
    };

    // Magic bytes for binary detection
    this.magicBytes = {
      png: [0x89, 0x50, 0x4E, 0x47],
      jpg: [0xFF, 0xD8, 0xFF],
      gif: [0x47, 0x49, 0x46],
      pdf: [0x25, 0x50, 0x44, 0x46],
      zip: [0x50, 0x4B, 0x03, 0x04],
      mp3: [0xFF, 0xFB],
      wav: [0x52, 0x49, 0x46, 0x46]
    };

    console.log('🔍 FormatProcessor initialized');
  }

  /**
   * Process any file - detects format and routes to analyzer
   */
  async process(filePath) {
    console.log(`\n🔍 Processing: ${filePath}`);

    const analysis = {
      filePath,
      fileName: path.basename(filePath),
      extension: path.extname(filePath),
      category: null,
      mimeType: null,
      encoding: null,
      size: 0,
      levels: {}, // Multi-level analysis results
      processedAt: new Date().toISOString()
    };

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    analysis.size = stats.size;

    // Detect category
    analysis.category = this.detectCategory(filePath);
    console.log(`   Category: ${analysis.category}`);

    // Detect encoding
    analysis.encoding = await this.detectEncoding(filePath);
    console.log(`   Encoding: ${analysis.encoding}`);

    // Analyze at multiple levels
    analysis.levels = await this.analyzeMultiLevel(filePath, analysis);

    return analysis;
  }

  /**
   * Detect file category
   */
  detectCategory(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    for (const [category, extensions] of Object.entries(this.categories)) {
      if (extensions.includes(ext)) {
        return category;
      }
    }

    // Check magic bytes if extension unknown
    const magicType = this.detectMagicBytes(filePath);
    if (magicType) {
      return this.getMagicCategory(magicType);
    }

    return 'binary';
  }

  /**
   * Detect file type by magic bytes
   */
  detectMagicBytes(filePath) {
    try {
      const buffer = Buffer.alloc(8);
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, 8, 0);
      fs.closeSync(fd);

      for (const [type, bytes] of Object.entries(this.magicBytes)) {
        let match = true;
        for (let i = 0; i < bytes.length; i++) {
          if (buffer[i] !== bytes[i]) {
            match = false;
            break;
          }
        }
        if (match) return type;
      }
    } catch (error) {
      // File too small or read error
    }

    return null;
  }

  /**
   * Get category from magic byte type
   */
  getMagicCategory(magicType) {
    const mapping = {
      png: 'image',
      jpg: 'image',
      gif: 'image',
      pdf: 'document',
      zip: 'archive',
      mp3: 'audio',
      wav: 'audio'
    };
    return mapping[magicType] || 'binary';
  }

  /**
   * Detect encoding (UTF-8, ASCII, binary, etc.)
   */
  async detectEncoding(filePath) {
    try {
      const buffer = Buffer.alloc(512);
      const fd = fs.openSync(filePath, 'r');
      const bytesRead = fs.readSync(fd, buffer, 0, 512, 0);
      fs.closeSync(fd);

      // Check for UTF-8 BOM
      if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        return 'utf-8-bom';
      }

      // Check for valid UTF-8
      const sample = buffer.slice(0, bytesRead);
      const isUtf8 = this.isValidUtf8(sample);
      if (isUtf8) return 'utf-8';

      // Check for ASCII
      const isAscii = this.isAscii(sample);
      if (isAscii) return 'ascii';

      return 'binary';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Check if buffer is valid UTF-8
   */
  isValidUtf8(buffer) {
    try {
      buffer.toString('utf-8');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if buffer is ASCII
   */
  isAscii(buffer) {
    for (let i = 0; i < buffer.length; i++) {
      if (buffer[i] > 127) return false;
    }
    return true;
  }

  /**
   * Analyze file at multiple abstraction levels
   */
  async analyzeMultiLevel(filePath, baseAnalysis) {
    const levels = {
      level0_binary: null,       // Raw bytes, visual patterns
      level1_encoding: null,      // Character encoding
      level2_structure: null,     // File format structure
      level3_syntax: null,        // Programming constructs
      level4_semantic: null       // Meaning and relationships
    };

    // Level 0: Binary analysis
    levels.level0_binary = await this.analyzeBinary(filePath);

    // Level 1: Encoding analysis
    levels.level1_encoding = {
      encoding: baseAnalysis.encoding,
      hasNullBytes: levels.level0_binary.hasNullBytes,
      entropy: levels.level0_binary.entropy
    };

    // Level 2: Structure (depends on category)
    if (baseAnalysis.category === 'code') {
      levels.level2_structure = await this.analyzeCodeStructure(filePath);
    } else if (baseAnalysis.category === 'image') {
      levels.level2_structure = await this.analyzeImageStructure(filePath);
    } else if (baseAnalysis.category === 'audio') {
      levels.level2_structure = await this.analyzeAudioStructure(filePath);
    }

    // Level 3 & 4: Syntax and semantic (for code)
    if (baseAnalysis.category === 'code') {
      levels.level3_syntax = await this.analyzeSyntax(filePath);
      levels.level4_semantic = await this.analyzeSemantic(filePath);
    }

    return levels;
  }

  /**
   * Level 0: Binary analysis
   */
  async analyzeBinary(filePath) {
    const stats = fs.statSync(filePath);
    const buffer = Buffer.alloc(Math.min(stats.size, 4096));
    const fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0);
    fs.closeSync(fd);

    // Calculate entropy
    const entropy = this.calculateEntropy(buffer.slice(0, bytesRead));

    // Check for null bytes
    const hasNullBytes = buffer.slice(0, bytesRead).includes(0x00);

    // Byte frequency
    const byteFreq = new Array(256).fill(0);
    for (let i = 0; i < bytesRead; i++) {
      byteFreq[buffer[i]]++;
    }

    return {
      entropy,
      hasNullBytes,
      topBytes: this.getTopBytes(byteFreq, 10),
      sampleHex: buffer.slice(0, Math.min(32, bytesRead)).toString('hex')
    };
  }

  /**
   * Calculate Shannon entropy
   */
  calculateEntropy(buffer) {
    const freq = new Array(256).fill(0);
    for (let i = 0; i < buffer.length; i++) {
      freq[buffer[i]]++;
    }

    let entropy = 0;
    for (let i = 0; i < 256; i++) {
      if (freq[i] > 0) {
        const p = freq[i] / buffer.length;
        entropy -= p * Math.log2(p);
      }
    }

    return entropy.toFixed(3);
  }

  /**
   * Get top N most frequent bytes
   */
  getTopBytes(freq, n) {
    return freq
      .map((count, byte) => ({ byte, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, n)
      .map(item => ({
        byte: item.byte,
        hex: '0x' + item.byte.toString(16).padStart(2, '0'),
        ascii: item.byte >= 32 && item.byte < 127 ? String.fromCharCode(item.byte) : '.',
        count: item.count
      }));
  }

  /**
   * Level 2: Code structure analysis
   */
  async analyzeCodeStructure(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      return {
        lineCount: lines.length,
        charCount: content.length,
        blankLines: lines.filter(line => !line.trim()).length,
        commentLines: lines.filter(line => {
          const trimmed = line.trim();
          return trimmed.startsWith('//') || trimmed.startsWith('#') ||
                 trimmed.startsWith('/*') || trimmed.startsWith('*');
        }).length,
        avgLineLength: (content.length / lines.length).toFixed(2)
      };
    } catch {
      return null;
    }
  }

  /**
   * Level 2: Image structure (placeholder)
   */
  async analyzeImageStructure(filePath) {
    // Would use image library to get dimensions, color depth, etc.
    return { note: 'Image analysis requires additional dependencies' };
  }

  /**
   * Level 2: Audio structure (placeholder)
   */
  async analyzeAudioStructure(filePath) {
    // Would use audio library to get duration, bitrate, etc.
    return { note: 'Audio analysis requires additional dependencies' };
  }

  /**
   * Level 3: Syntax analysis (placeholder - would use AST parser)
   */
  async analyzeSyntax(filePath) {
    // Would parse into AST and analyze
    return { note: 'Syntax analysis requires language-specific parsers' };
  }

  /**
   * Level 4: Semantic analysis (placeholder - would use AI)
   */
  async analyzeSemantic(filePath) {
    // Would use Ollama/LLM to understand meaning
    return { note: 'Semantic analysis requires AI integration' };
  }

  /**
   * Batch process directory
   */
  async processDirectory(dirPath, options = {}) {
    const recursive = options.recursive !== false;
    const results = [];

    const processDir = async (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (recursive && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await processDir(fullPath);
          }
        } else {
          try {
            const analysis = await this.process(fullPath);
            results.push(analysis);
          } catch (error) {
            console.error(`⚠️ Error processing ${fullPath}:`, error.message);
          }
        }
      }
    };

    await processDir(dirPath);
    return results;
  }
}

// CLI Mode
if (require.main === module) {
  const processor = new FormatProcessor({ verbose: true });

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║       🔍 Format Processor - Multi-Modal Analysis          ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const testFile = process.argv[2];

  if (!testFile) {
    console.log('Usage: node format-processor.js <file-or-directory>');
    console.log('Example: node format-processor.js drops/myproject/index.html');
    process.exit(1);
  }

  if (fs.existsSync(testFile)) {
    const stats = fs.statSync(testFile);

    if (stats.isDirectory()) {
      processor.processDirectory(testFile)
        .then(results => {
          console.log(`\n✅ Processed ${results.length} files\n`);
          console.log('Summary by category:');
          const categories = {};
          results.forEach(r => {
            categories[r.category] = (categories[r.category] || 0) + 1;
          });
          Object.entries(categories).forEach(([cat, count]) => {
            console.log(`   ${cat}: ${count} files`);
          });
        })
        .catch(error => console.error('❌ Error:', error.message));
    } else {
      processor.process(testFile)
        .then(result => {
          console.log('\n📊 Analysis Complete:\n');
          console.log(JSON.stringify(result, null, 2));
        })
        .catch(error => console.error('❌ Error:', error.message));
    }
  } else {
    console.error(`❌ File not found: ${testFile}`);
    process.exit(1);
  }
}

module.exports = FormatProcessor;
