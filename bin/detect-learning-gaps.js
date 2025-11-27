#!/usr/bin/env node

/**
 * Learning Gap Detector
 *
 * Scans codebase for @LEARNING-GAP markers and generates registry
 * for integration with speedrun maps (/learn/player.html).
 *
 * Usage:
 *   node bin/detect-learning-gaps.js
 *   node bin/detect-learning-gaps.js --scan lib routes
 *   node bin/detect-learning-gaps.js --output data/learning-gaps.json
 */

const fs = require('fs');
const path = require('path');

class LearningGapDetector {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.outputPath = options.output || path.join(__dirname, '../data/learning-gaps.json');
  }

  /**
   * Detect learning gaps in a single file
   */
  detectGaps(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const gaps = [];

    lines.forEach((line, index) => {
      if (line.includes('@LEARNING-GAP')) {
        const gap = this.parseGap(lines, index);
        gaps.push({
          file: filePath,
          line: index + 1,
          codeSnippet: this.extractCodeSnippet(lines, index),
          ...gap
        });
      }
    });

    return gaps;
  }

  /**
   * Parse @LEARNING-GAP marker and extract metadata
   */
  parseGap(lines, startIndex) {
    const gap = {
      description: '',
      concept: '',
      difficulty: 'beginner',
      speedrunHint: '',
      speedrunFix: '',
      speedrunSkip: true
    };

    let i = startIndex;

    // Parse comment block
    while (i < lines.length && lines[i].trim().startsWith('//')) {
      const line = lines[i].trim();

      if (line.includes('@LEARNING-GAP:')) {
        gap.description = line.split('@LEARNING-GAP:')[1].trim();
      } else if (line.includes('@CONCEPT:')) {
        gap.concept = line.split('@CONCEPT:')[1].trim();
      } else if (line.includes('@DIFFICULTY:')) {
        gap.difficulty = line.split('@DIFFICULTY:')[1].trim();
      } else if (line.includes('@SPEEDRUN-HINT:')) {
        gap.speedrunHint = line.split('@SPEEDRUN-HINT:')[1].trim().replace(/^"(.*)"$/, '$1');
      } else if (line.includes('@SPEEDRUN-FIX:')) {
        gap.speedrunFix = line.split('@SPEEDRUN-FIX:')[1].trim().replace(/^"(.*)"$/, '$1');
      } else if (line.includes('@SPEEDRUN-SKIP:')) {
        gap.speedrunSkip = line.split('@SPEEDRUN-SKIP:')[1].trim() === 'true';
      }

      i++;
    }

    return gap;
  }

  /**
   * Extract code snippet around the gap (3 lines before/after)
   */
  extractCodeSnippet(lines, startIndex) {
    const snippetStart = Math.max(0, startIndex - 3);
    const snippetEnd = Math.min(lines.length, startIndex + 10);
    const snippet = lines.slice(snippetStart, snippetEnd).join('\n');
    return snippet;
  }

  /**
   * Get all JS files in directory (recursive)
   */
  getJSFiles(dir) {
    const files = [];

    if (!fs.existsSync(dir)) {
      if (this.verbose) {
        console.log(`⚠️  Directory not found: ${dir}`);
      }
      return files;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);

      // Skip node_modules, .git, etc.
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        return;
      }

      if (entry.isDirectory()) {
        files.push(...this.getJSFiles(fullPath));
      } else if (entry.name.endsWith('.js') || entry.name.endsWith('.html')) {
        files.push(fullPath);
      }
    });

    return files;
  }

  /**
   * Scan directories for learning gaps
   */
  scanDirectories(directories) {
    const allGaps = [];

    directories.forEach(dir => {
      const fullPath = path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);

      if (this.verbose) {
        console.log(`\n📂 Scanning directory: ${fullPath}`);
      }

      const files = this.getJSFiles(fullPath);

      if (this.verbose) {
        console.log(`   Found ${files.length} files to scan`);
      }

      files.forEach(file => {
        const gaps = this.detectGaps(file);

        if (gaps.length > 0 && this.verbose) {
          console.log(`   ✅ ${path.relative(process.cwd(), file)}: ${gaps.length} gap(s)`);
        }

        allGaps.push(...gaps);
      });
    });

    return allGaps;
  }

  /**
   * Save gaps to JSON file
   */
  saveGaps(gaps) {
    const outputDir = path.dirname(this.outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(this.outputPath, JSON.stringify(gaps, null, 2));

    if (this.verbose) {
      console.log(`\n💾 Saved ${gaps.length} learning gaps to ${this.outputPath}`);
    }
  }

  /**
   * Generate summary report
   */
  generateReport(gaps) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 LEARNING GAP DETECTION REPORT');
    console.log('='.repeat(60));

    console.log(`\n📈 Summary:`);
    console.log(`   Total gaps found: ${gaps.length}`);

    // By difficulty
    const byDifficulty = gaps.reduce((acc, gap) => {
      acc[gap.difficulty] = (acc[gap.difficulty] || 0) + 1;
      return acc;
    }, {});

    console.log(`\n🎯 By Difficulty:`);
    Object.entries(byDifficulty).forEach(([difficulty, count]) => {
      console.log(`   ${difficulty.padEnd(15)}: ${count}`);
    });

    // By concept
    const byConcept = gaps.reduce((acc, gap) => {
      if (gap.concept) {
        acc[gap.concept] = (acc[gap.concept] || 0) + 1;
      }
      return acc;
    }, {});

    if (Object.keys(byConcept).length > 0) {
      console.log(`\n📚 By Concept:`);
      Object.entries(byConcept)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([concept, count]) => {
          console.log(`   ${concept.padEnd(25)}: ${count}`);
        });
    }

    // Speedrun-skippable
    const speedrunSkippable = gaps.filter(g => g.speedrunSkip).length;
    const speedrunRequired = gaps.length - speedrunSkippable;

    console.log(`\n⚡ Speedrun Stats:`);
    console.log(`   Skippable gaps:  ${speedrunSkippable}`);
    console.log(`   Required gaps:   ${speedrunRequired}`);

    // Recent gaps
    console.log(`\n🔍 Sample Gaps:`);
    gaps.slice(0, 5).forEach(gap => {
      console.log(`\n   📄 ${gap.file}:${gap.line}`);
      console.log(`      ${gap.description}`);
      console.log(`      Concept: ${gap.concept || 'N/A'} (${gap.difficulty})`);
      if (gap.speedrunHint) {
        console.log(`      Speedrun hint: ${gap.speedrunHint}`);
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Report complete. Data saved to ${this.outputPath}`);
    console.log('='.repeat(60) + '\n');
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);

  // Parse arguments
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    output: null,
    directories: []
  };

  // Extract --output
  const outputIndex = args.indexOf('--output');
  if (outputIndex !== -1 && args[outputIndex + 1]) {
    options.output = args[outputIndex + 1];
  }

  // Extract directories (non-flag arguments)
  options.directories = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('-'));

  // Default directories if none specified
  if (options.directories.length === 0) {
    options.directories = ['lib', 'routes', 'bin', 'public'];
  }

  // Run detector
  const detector = new LearningGapDetector({
    verbose: true,
    output: options.output
  });

  console.log('🔍 Learning Gap Detector');
  console.log('========================\n');

  try {
    const gaps = detector.scanDirectories(options.directories);
    detector.saveGaps(gaps);
    detector.generateReport(gaps);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

module.exports = LearningGapDetector;
