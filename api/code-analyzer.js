#!/usr/bin/env node
/**
 * Code Analyzer
 *
 * Teaches Ollama to analyze code, find bugs, suggest fixes,
 * and help with debugging - like Claude Code but FREE.
 *
 * Features:
 * - Analyze code for bugs
 * - Explain code
 * - Suggest improvements
 * - Debug issues
 * - Maintain web standards
 * - Save analysis notes to identity context
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class CodeAnalyzer {
  constructor(identityKeyring, options = {}) {
    this.identityKeyring = identityKeyring;

    this.config = {
      ollamaHost: options.ollamaHost || '127.0.0.1',
      ollamaPort: options.ollamaPort || 11434,
      model: options.model || 'deepseek-coder', // or 'llama3.2'
      temperature: options.temperature || 0.3, // Lower for code analysis
      ...options
    };

    // Stats
    this.stats = {
      totalAnalyses: 0,
      bugsFound: 0,
      suggestionsGiven: 0,
      filesAnalyzed: new Set()
    };
  }

  /**
   * Analyze code file
   */
  async analyzeFile(filePath, options = {}) {
    const {
      task = 'analyze', // 'analyze', 'explain', 'debug', 'improve'
      context = ''
    } = options;

    // Read file
    const code = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    const fileExt = path.extname(filePath);

    // Determine language
    const language = this.detectLanguage(fileExt);

    // Build prompt based on task
    const prompt = this.buildPrompt(task, code, language, fileName, context);

    // Call Ollama
    const analysis = await this.callOllama(prompt);

    // Save to identity context
    if (this.identityKeyring.activeIdentity) {
      await this.identityKeyring.addCodeNote(filePath, {
        task,
        analysis,
        language,
        timestamp: new Date().toISOString()
      });
    }

    // Update stats
    this.stats.totalAnalyses++;
    this.stats.filesAnalyzed.add(filePath);

    if (task === 'analyze' && analysis.toLowerCase().includes('bug')) {
      this.stats.bugsFound++;
    }
    if (task === 'improve') {
      this.stats.suggestionsGiven++;
    }

    console.log(`✅ Code ${task}: ${fileName}`);

    return {
      success: true,
      file: filePath,
      language,
      task,
      analysis
    };
  }

  /**
   * Analyze code snippet (not from file)
   */
  async analyzeCode(code, language, options = {}) {
    const {
      task = 'analyze',
      context = ''
    } = options;

    const prompt = this.buildPrompt(task, code, language, 'snippet', context);
    const analysis = await this.callOllama(prompt);

    this.stats.totalAnalyses++;

    return {
      success: true,
      language,
      task,
      analysis
    };
  }

  /**
   * Debug specific issue
   */
  async debugIssue(description, code = '', options = {}) {
    const prompt = `You are a debugging assistant. Help diagnose and fix this issue.

**Issue Description:**
${description}

${code ? `**Code:**
\`\`\`
${code}
\`\`\`
` : ''}

**Instructions:**
1. Identify the most likely cause of the issue
2. Explain why this is happening
3. Provide a step-by-step fix
4. Suggest how to prevent this in the future

**Response:**`;

    const analysis = await this.callOllama(prompt);

    // Save to identity context
    if (this.identityKeyring.activeIdentity) {
      this.identityKeyring.activeIdentity.context.debuggingHistory.push({
        description,
        code: code.substring(0, 500), // First 500 chars
        solution: analysis,
        timestamp: new Date().toISOString()
      });
      await this.identityKeyring.activeIdentity.stores.context.write(
        this.identityKeyring.activeIdentity.context
      );
    }

    return {
      success: true,
      issue: description,
      solution: analysis
    };
  }

  /**
   * Explain code
   */
  async explainCode(code, language, options = {}) {
    const prompt = `You are a code teacher. Explain this ${language} code in simple terms.

**Code:**
\`\`\`${language}
${code}
\`\`\`

**Instructions:**
1. Explain what this code does (high level)
2. Break down key parts
3. Explain any complex concepts
4. Mention potential issues or improvements

**Explanation:**`;

    const explanation = await this.callOllama(prompt);

    return {
      success: true,
      language,
      explanation
    };
  }

  /**
   * Check web standards compliance
   */
  async checkWebStandards(html, options = {}) {
    const prompt = `You are a web standards expert. Analyze this HTML for compliance with modern web standards.

**HTML:**
\`\`\`html
${html}
\`\`\`

**Check for:**
1. Semantic HTML usage
2. Accessibility (ARIA, alt text, etc.)
3. Modern best practices
4. Deprecated tags or attributes
5. Performance issues

**Analysis:**`;

    const analysis = await this.callOllama(prompt);

    return {
      success: true,
      analysis,
      type: 'web_standards'
    };
  }

  /**
   * Security audit
   */
  async securityAudit(code, language, options = {}) {
    const prompt = `You are a security auditor. Analyze this ${language} code for security vulnerabilities.

**Code:**
\`\`\`${language}
${code}
\`\`\`

**Check for:**
1. Injection vulnerabilities (SQL, XSS, etc.)
2. Authentication/authorization issues
3. Insecure data handling
4. Exposed secrets or credentials
5. Common security anti-patterns

**Security Report:**`;

    const audit = await this.callOllama(prompt);

    return {
      success: true,
      language,
      audit,
      type: 'security'
    };
  }

  /**
   * Build prompt for code analysis
   */
  buildPrompt(task, code, language, fileName, context) {
    const prompts = {
      analyze: `You are a code reviewer. Analyze this ${language} code for bugs, issues, and improvements.

**File:** ${fileName}
**Language:** ${language}

**Code:**
\`\`\`${language}
${code}
\`\`\`

${context ? `**Additional Context:**\n${context}\n\n` : ''}**Analysis:**
1. Are there any bugs or errors?
2. Are there any code smells or anti-patterns?
3. Is the code following best practices?
4. What improvements can be made?

Provide a clear, actionable analysis:`,

      explain: `You are a code teacher. Explain this ${language} code clearly.

**File:** ${fileName}
**Language:** ${language}

**Code:**
\`\`\`${language}
${code}
\`\`\`

${context ? `**Additional Context:**\n${context}\n\n` : ''}**Explanation:**`,

      debug: `You are a debugging expert. Help find and fix issues in this ${language} code.

**File:** ${fileName}
**Language:** ${language}

**Code:**
\`\`\`${language}
${code}
\`\`\`

${context ? `**Issue:**\n${context}\n\n` : ''}**Debugging Steps:**
1. Identify potential issues
2. Explain the root cause
3. Suggest fixes
4. Provide corrected code if needed

**Analysis:**`,

      improve: `You are a code optimization expert. Suggest improvements for this ${language} code.

**File:** ${fileName}
**Language:** ${language}

**Code:**
\`\`\`${language}
${code}
\`\`\`

${context ? `**Focus:**\n${context}\n\n` : ''}**Improvements:**
1. Performance optimizations
2. Readability improvements
3. Better patterns or practices
4. Refactoring suggestions

**Suggestions:**`
    };

    return prompts[task] || prompts.analyze;
  }

  /**
   * Detect language from file extension
   */
  detectLanguage(ext) {
    const languages = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.jsx': 'javascript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.html': 'html',
      '.css': 'css',
      '.json': 'json',
      '.md': 'markdown',
      '.sh': 'bash',
      '.go': 'go',
      '.rs': 'rust',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c'
    };

    return languages[ext] || 'text';
  }

  /**
   * Call Ollama API
   */
  async callOllama(prompt) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        model: this.config.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: this.config.temperature,
          num_predict: 2000 // Longer responses for code analysis
        }
      });

      const options = {
        hostname: this.config.ollamaHost,
        port: this.config.ollamaPort,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(responseData);
            resolve(json.response || '');
          } catch (e) {
            reject(new Error(`Ollama response parse error: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Ollama request timeout'));
      });

      req.setTimeout(30000); // 30 second timeout

      req.write(data);
      req.end();
    });
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalAnalyses: this.stats.totalAnalyses,
      bugsFound: this.stats.bugsFound,
      suggestionsGiven: this.stats.suggestionsGiven,
      filesAnalyzed: this.stats.filesAnalyzed.size,
      model: this.config.model
    };
  }

  /**
   * Get module info
   */
  getInfo() {
    return {
      model: this.config.model,
      ollamaHost: this.config.ollamaHost,
      ollamaPort: this.config.ollamaPort,
      temperature: this.config.temperature,
      stats: this.getStats()
    };
  }
}

module.exports = CodeAnalyzer;
