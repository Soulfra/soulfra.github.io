#!/usr/bin/env node
/**
 * Ollama Code Analyzer
 *
 * Reverse engineers code like OCR for screenshots
 * Uses local Ollama AI (free, private) to analyze:
 * - HTML/CSS/JS structure
 * - Design patterns
 * - Security issues
 * - Performance problems
 * - Generate documentation
 * - Suggest improvements
 *
 * Like CringeProof screenshot analysis but for code
 *
 * Usage:
 *   const analyzer = new OllamaCodeAnalyzer();
 *   const analysis = await analyzer.analyzeProject('/drops/myproject');
 */

const fs = require('fs');
const path = require('path');
const OllamaProvider = require('./providers/ollama-provider');

class OllamaCodeAnalyzer {
  constructor(options = {}) {
    this.ollama = new OllamaProvider();
    this.maxFileSize = options.maxFileSize || 100000; // 100KB max per file
    this.supportedExtensions = options.supportedExtensions || [
      '.html', '.htm',
      '.css',
      '.js', '.jsx',
      '.json',
      '.md'
    ];

    console.log('🔍 OllamaCodeAnalyzer initialized');
  }

  /**
   * Analyze entire project directory
   */
  async analyzeProject(projectPath) {
    console.log(`\n🔍 Analyzing project: ${projectPath}`);

    // Get all files
    const files = this.getProjectFiles(projectPath);

    console.log(`   Found ${files.length} files`);

    // Read file contents
    const fileContents = this.readFiles(projectPath, files);

    // Analyze structure
    const structure = this.analyzeStructure(fileContents);

    // Generate Ollama prompt
    const prompt = this.generateAnalysisPrompt(structure, fileContents);

    // Get AI analysis
    console.log(`   Sending to Ollama for analysis...`);

    const analysis = await this.getOllamaAnalysis(prompt);

    return {
      projectPath,
      fileCount: files.length,
      structure,
      aiAnalysis: analysis,
      files: files.map(f => f.relative),
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * Analyze single file
   */
  async analyzeFile(filePath) {
    console.log(`\n🔍 Analyzing file: ${filePath}`);

    const content = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath);

    const prompt = `Analyze this ${ext} file and provide insights:

File: ${path.basename(filePath)}
Content:
\`\`\`
${content.substring(0, 5000)} // Truncate for performance
\`\`\`

Please analyze:
1. What does this code do?
2. Is the code well-written?
3. Any security concerns?
4. Any performance issues?
5. Suggestions for improvement

Provide a concise, actionable analysis.`;

    const analysis = await this.getOllamaAnalysis(prompt);

    return {
      filePath,
      fileType: ext,
      aiAnalysis: analysis,
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * Reverse engineer from description
   */
  async reverseEngineer(description) {
    console.log(`\n🔧 Reverse engineering from description...`);

    const prompt = `Based on this description, generate the HTML/CSS/JS code:

Description: ${description}

Generate:
1. HTML structure
2. CSS styling
3. JavaScript functionality (if needed)

Provide complete, working code that implements this description.
Make it responsive and modern.`;

    const code = await this.getOllamaAnalysis(prompt);

    return {
      description,
      generatedCode: code,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Get project files
   */
  getProjectFiles(projectPath) {
    const files = [];

    const walk = (dir, basePath = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(basePath, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules, .git, etc.
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            walk(fullPath, relativePath);
          }
        } else {
          const ext = path.extname(entry.name);
          if (this.supportedExtensions.includes(ext)) {
            const stats = fs.statSync(fullPath);
            if (stats.size <= this.maxFileSize) {
              files.push({
                absolute: fullPath,
                relative: relativePath,
                extension: ext,
                size: stats.size
              });
            }
          }
        }
      }
    };

    walk(projectPath);
    return files;
  }

  /**
   * Read file contents
   */
  readFiles(projectPath, files) {
    const contents = [];

    for (const file of files) {
      try {
        const content = fs.readFileSync(file.absolute, 'utf8');
        contents.push({
          path: file.relative,
          extension: file.extension,
          content: content,
          lines: content.split('\n').length
        });
      } catch (error) {
        console.warn(`⚠️ Could not read ${file.relative}:`, error.message);
      }
    }

    return contents;
  }

  /**
   * Analyze code structure
   */
  analyzeStructure(fileContents) {
    const structure = {
      hasHTML: false,
      hasCSS: false,
      hasJS: false,
      hasReact: false,
      hasAPI: false,
      totalLines: 0,
      fileTypes: {}
    };

    for (const file of fileContents) {
      structure.totalLines += file.lines;

      // Count file types
      structure.fileTypes[file.extension] = (structure.fileTypes[file.extension] || 0) + 1;

      // Detect technologies
      if (file.extension === '.html') structure.hasHTML = true;
      if (file.extension === '.css') structure.hasCSS = true;
      if (file.extension === '.js' || file.extension === '.jsx') structure.hasJS = true;

      if (file.content.includes('React') || file.content.includes('useState')) {
        structure.hasReact = true;
      }

      if (file.content.includes('fetch(') || file.content.includes('axios')) {
        structure.hasAPI = true;
      }
    }

    return structure;
  }

  /**
   * Generate analysis prompt for Ollama
   */
  generateAnalysisPrompt(structure, fileContents) {
    // Build file summary
    const fileSummary = fileContents.map(f => {
      return `${f.path} (${f.lines} lines):\n${f.content.substring(0, 500)}...\n`;
    }).join('\n\n');

    const prompt = `Analyze this web project and provide insights:

Project Structure:
- Files: ${Object.entries(structure.fileTypes).map(([ext, count]) => `${count} ${ext}`).join(', ')}
- Total Lines: ${structure.totalLines}
- Technologies: ${structure.hasReact ? 'React, ' : ''}${structure.hasHTML ? 'HTML, ' : ''}${structure.hasCSS ? 'CSS, ' : ''}${structure.hasJS ? 'JavaScript' : ''}

File Contents:
${fileSummary}

Please provide:
1. Project Purpose: What does this project do?
2. Code Quality: Is it well-written? (1-10 score)
3. Security Issues: Any vulnerabilities?
4. Performance Issues: Any bottlenecks?
5. Best Practices: What's good? What needs improvement?
6. Suggestions: Top 3 improvements to make

Be concise and actionable. Focus on the most important insights.`;

    return prompt;
  }

  /**
   * Get analysis from Ollama
   */
  async getOllamaAnalysis(prompt) {
    try {
      const messages = [
        {
          role: 'system',
          content: 'You are an expert code reviewer. Provide concise, actionable analysis of code. Focus on practical improvements.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await this.ollama.chat(messages, {
        temperature: 0.3, // More deterministic for code analysis
        maxTokens: 1024
      });

      return response.content;

    } catch (error) {
      console.error('❌ Ollama analysis failed:', error.message);
      return `Analysis failed: ${error.message}. Is Ollama running? Try: ollama serve`;
    }
  }

  /**
   * Suggest improvements
   */
  async suggestImprovements(projectPath) {
    const analysis = await this.analyzeProject(projectPath);

    const prompt = `Based on this project analysis, suggest specific code improvements:

${analysis.aiAnalysis}

Provide:
1. Specific code changes (with before/after examples)
2. File-by-file recommendations
3. Priority: High/Medium/Low for each suggestion

Format as actionable tasks.`;

    const suggestions = await this.getOllamaAnalysis(prompt);

    return {
      ...analysis,
      improvements: suggestions
    };
  }

  /**
   * Generate documentation
   */
  async generateDocs(projectPath) {
    const analysis = await this.analyzeProject(projectPath);

    const prompt = `Generate README.md documentation for this project:

${analysis.aiAnalysis}

Include:
1. Project title and description
2. Features list
3. Installation instructions
4. Usage examples
5. File structure explanation
6. Tech stack

Format as proper markdown.`;

    const readme = await this.getOllamaAnalysis(prompt);

    return {
      ...analysis,
      readme
    };
  }
}

// CLI Mode
if (require.main === module) {
  const analyzer = new OllamaCodeAnalyzer();

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║       🔍 Ollama Code Analyzer - Reverse Engineer Code     ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Test with example project if provided
  const projectPath = process.argv[2] || path.join(__dirname, '../drops/NiceLeak');

  if (fs.existsSync(projectPath)) {
    console.log(`Analyzing: ${projectPath}\n`);

    analyzer.analyzeProject(projectPath)
      .then(result => {
        console.log('\n📊 Analysis Complete!\n');
        console.log('Files:', result.fileCount);
        console.log('Structure:', result.structure);
        console.log('\n🤖 AI Analysis:\n');
        console.log(result.aiAnalysis);
      })
      .catch(error => {
        console.error('❌ Error:', error.message);
      });
  } else {
    console.log('Usage: node ollama-code-analyzer.js <project-path>');
    console.log(`Example: node ollama-code-analyzer.js drops/myproject`);
  }
}

module.exports = OllamaCodeAnalyzer;
