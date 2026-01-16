// -*- coding: utf-8 -*-
// ==========================================
// CLAUDE DESKTOP & CLI INTEGRATION
// Route through Claude Desktop app and CLI tools
// ==========================================

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

class ClaudeDesktopIntegration {
  constructor() {
    this.claudeDesktopPath = this.findClaudeDesktop();
    this.claudeCodePath = this.findClaudeCode();
    this.tempDir = path.join(__dirname, 'temp-conversations');
    this.wsConnection = null;
    
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  findClaudeDesktop() {
    // Common Claude Desktop installation paths
    const possiblePaths = [
      '/Applications/Claude.app/Contents/MacOS/Claude', // macOS
      'C:\\Program Files\\Claude\\Claude.exe', // Windows
      '/usr/bin/claude', // Linux
      '/opt/claude/claude', // Linux alternative
      `${process.env.HOME}/.local/bin/claude` // User install
    ];

    for (const claudePath of possiblePaths) {
      if (fs.existsSync(claudePath)) {
        console.log(`✅ Found Claude Desktop at: ${claudePath}`);
        return claudePath;
      }
    }

    console.log('⚠️  Claude Desktop not found, checking if installed...');
    return null;
  }

  findClaudeCode() {
    try {
      // Check if claude-code CLI is installed
      const claudeCodePath = execSync('which claude-code', { encoding: 'utf8' }).trim();
      console.log(`✅ Found Claude Code CLI at: ${claudeCodePath}`);
      return claudeCodePath;
    } catch (error) {
      console.log('⚠️  Claude Code CLI not found. Install with: npm install -g @anthropic-ai/claude-code');
      return null;
    }
  }

  async routeThroughClaudeDesktop(prompt, options = {}) {
    if (!this.claudeDesktopPath) {
      throw new Error('Claude Desktop not available');
    }

    console.log('🖥️  Routing through Claude Desktop...');

    try {
      // Create a temporary conversation file
      const conversationId = Date.now();
      const conversationFile = path.join(this.tempDir, `conversation-${conversationId}.txt`);
      
      // Write prompt to file
      fs.writeFileSync(conversationFile, prompt);

      // Launch Claude Desktop with the conversation
      // Note: This approach depends on Claude Desktop supporting file input
      const claudeProcess = spawn(this.claudeDesktopPath, [
        '--conversation-file', conversationFile,
        '--output-format', 'text',
        '--timeout', '30'
      ], {
        stdio: 'pipe'
      });

      return new Promise((resolve, reject) => {
        let response = '';
        let errorOutput = '';

        claudeProcess.stdout.on('data', (data) => {
          response += data.toString();
        });

        claudeProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        claudeProcess.on('close', (code) => {
          // Clean up temp file
          fs.unlinkSync(conversationFile);

          if (code === 0) {
            resolve({
              content: response.trim(),
              metadata: {
                provider: 'claude_desktop',
                model: 'claude-3-sonnet',
                cost: 0, // Desktop subscription = free
                source: 'desktop_app'
              }
            });
          } else {
            reject(new Error(`Claude Desktop failed: ${errorOutput}`));
          }
        });

        // Send prompt to Claude Desktop
        claudeProcess.stdin.write(prompt);
        claudeProcess.stdin.end();
      });

    } catch (error) {
      console.error('❌ Claude Desktop integration failed:', error.message);
      throw error;
    }
  }

  async routeThroughClaudeCode(prompt, projectContext = null) {
    if (!this.claudeCodePath) {
      throw new Error('Claude Code CLI not available');
    }

    console.log('⌨️  Routing through Claude Code CLI...');

    try {
      // Create temp directory for this request
      const requestId = Date.now();
      const requestDir = path.join(this.tempDir, `claude-code-${requestId}`);
      fs.mkdirSync(requestDir, { recursive: true });

      // If project context provided, set up project structure
      if (projectContext) {
        this.setupProjectContext(requestDir, projectContext);
      }

      // Create prompt file
      const promptFile = path.join(requestDir, 'prompt.md');
      fs.writeFileSync(promptFile, `# Request\n\n${prompt}\n\n## Context\n\nThis is a request from Soulfra routing system.`);

      // Execute Claude Code CLI
      const command = `cd "${requestDir}" && claude-code --file "${promptFile}" --output-format json`;
      
      const result = execSync(command, {
        encoding: 'utf8',
        timeout: 45000, // 45 second timeout
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      // Parse Claude Code response
      const response = JSON.parse(result);

      // Clean up temp directory
      fs.rmSync(requestDir, { recursive: true, force: true });

      return {
        content: response.response || response.content,
        metadata: {
          provider: 'claude_code',
          model: 'claude-3-sonnet',
          cost: 0, // CLI subscription = free
          source: 'cli_tool',
          files_created: response.files_created || [],
          suggestions: response.suggestions || []
        }
      };

    } catch (error) {
      console.error('❌ Claude Code CLI failed:', error.message);
      throw error;
    }
  }

  setupProjectContext(directory, context) {
    // Set up basic project structure for Claude Code
    if (context.files) {
      context.files.forEach(file => {
        const filePath = path.join(directory, file.name);
        const fileDir = path.dirname(filePath);
        
        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, file.content || '');
      });
    }

    // Create a basic package.json if it's a Node.js project
    if (context.type === 'nodejs') {
      const packageJson = {
        name: "soulfra-temp-project",
        version: "1.0.0",
        description: "Temporary project for Claude Code",
        dependencies: context.dependencies || {}
      };
      
      fs.writeFileSync(
        path.join(directory, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
    }

    // Create README with context
    const readme = `# Soulfra Context\n\n${context.description || 'Generated by Soulfra routing system'}\n\n## Files\n\n${context.files?.map(f => `- ${f.name}`).join('\n') || 'No files provided'}`;
    fs.writeFileSync(path.join(directory, 'README.md'), readme);
  }

  async establishDesktopWebSocketConnection() {
    // Some desktop apps support WebSocket connections for automation
    // This is speculative - would need to check Claude Desktop's actual API
    
    try {
      console.log('🔌 Attempting WebSocket connection to Claude Desktop...');
      
      this.wsConnection = new WebSocket('ws://localhost:9339'); // Hypothetical port
      
      return new Promise((resolve, reject) => {
        this.wsConnection.on('open', () => {
          console.log('✅ WebSocket connected to Claude Desktop');
          resolve();
        });

        this.wsConnection.on('error', (error) => {
          console.log('❌ WebSocket connection failed:', error.message);
          reject(error);
        });

        this.wsConnection.on('message', (data) => {
          console.log('📨 Received from Claude Desktop:', data.toString());
        });
      });

    } catch (error) {
      console.log('⚠️  WebSocket connection not available');
      return null;
    }
  }

  async sendWebSocketRequest(prompt) {
    if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket connection not available');
    }

    return new Promise((resolve, reject) => {
      const requestId = Date.now();
      
      const request = {
        id: requestId,
        type: 'conversation',
        content: prompt,
        timestamp: new Date().toISOString()
      };

      // Listen for response
      const responseHandler = (data) => {
        try {
          const response = JSON.parse(data.toString());
          if (response.id === requestId) {
            this.wsConnection.off('message', responseHandler);
            resolve({
              content: response.content,
              metadata: {
                provider: 'claude_desktop_ws',
                model: response.model || 'claude-3-sonnet',
                cost: 0,
                source: 'websocket'
              }
            });
          }
        } catch (error) {
          reject(error);
        }
      };

      this.wsConnection.on('message', responseHandler);

      // Send request
      this.wsConnection.send(JSON.stringify(request));

      // Timeout after 30 seconds
      setTimeout(() => {
        this.wsConnection.off('message', responseHandler);
        reject(new Error('WebSocket request timeout'));
      }, 30000);
    });
  }
}

// ==========================================
// CHATGPT CLI INTEGRATION (if available)
// ==========================================

class ChatGPTCLIIntegration {
  constructor() {
    this.cliPath = this.findChatGPTCLI();
  }

  findChatGPTCLI() {
    try {
      // Check for various ChatGPT CLI tools
      const possibleCommands = ['chatgpt', 'gpt', 'openai-cli'];
      
      for (const cmd of possibleCommands) {
        try {
          const path = execSync(`which ${cmd}`, { encoding: 'utf8' }).trim();
          console.log(`✅ Found ChatGPT CLI: ${cmd} at ${path}`);
          return cmd;
        } catch (e) {
          // Command not found, continue
        }
      }
      
      console.log('⚠️  No ChatGPT CLI found. Install with: npm install -g chatgpt-cli');
      return null;
    } catch (error) {
      return null;
    }
  }

  async routeThroughCLI(prompt, model = 'gpt-4') {
    if (!this.cliPath) {
      throw new Error('ChatGPT CLI not available');
    }

    console.log('⌨️  Routing through ChatGPT CLI...');

    try {
      // Different CLI tools have different syntaxes
      let command;
      
      if (this.cliPath === 'chatgpt') {
        command = `${this.cliPath} "${prompt}" --model ${model}`;
      } else if (this.cliPath === 'gpt') {
        command = `${this.cliPath} -m ${model} "${prompt}"`;
      } else {
        command = `${this.cliPath} "${prompt}"`;
      }

      const result = execSync(command, {
        encoding: 'utf8',
        timeout: 30000,
        maxBuffer: 1024 * 1024 * 5 // 5MB buffer
      });

      return {
        content: result.trim(),
        metadata: {
          provider: 'chatgpt_cli',
          model: model,
          cost: 0, // CLI through subscription = free
          source: 'cli_tool'
        }
      };

    } catch (error) {
      console.error('❌ ChatGPT CLI failed:', error.message);
      throw error;
    }
  }
}

// ==========================================
// UNIFIED SUBSCRIPTION ROUTING
// ==========================================

class UnifiedSubscriptionRouter {
  constructor() {
    this.claudeDesktop = new ClaudeDesktopIntegration();
    this.chatgptCLI = new ChatGPTCLIIntegration();
    this.availableMethods = this.detectAvailableMethods();
  }

  detectAvailableMethods() {
    const methods = [];
    
    if (this.claudeDesktop.claudeDesktopPath) methods.push('claude_desktop');
    if (this.claudeDesktop.claudeCodePath) methods.push('claude_code');
    if (this.chatgptCLI.cliPath) methods.push('chatgpt_cli');
    
    console.log(`🔍 Available subscription methods: ${methods.join(', ')}`);
    return methods;
  }

  async route(prompt, userTrustScore, options = {}) {
    const routingDecision = this.makeRoutingDecision(prompt, userTrustScore, options);
    
    console.log(`🎯 Routing to: ${routingDecision.method} (${routingDecision.reasoning})`);

    try {
      let response;

      switch (routingDecision.method) {
        case 'claude_desktop':
          response = await this.claudeDesktop.routeThroughClaudeDesktop(prompt);
          break;
          
        case 'claude_code':
          response = await this.claudeDesktop.routeThroughClaudeCode(prompt, options.projectContext);
          break;
          
        case 'chatgpt_cli':
          response = await this.chatgptCLI.routeThroughCLI(prompt, 'gpt-4');
          break;
          
        default:
          throw new Error(`Method ${routingDecision.method} not available`);
      }

      return {
        ...response,
        metadata: {
          ...response.metadata,
          routingReasoning: routingDecision.reasoning,
          subscriptionOptimized: true
        }
      };

    } catch (error) {
      console.error(`❌ Subscription routing failed: ${error.message}`);
      
      // Fallback to next available method
      const fallbackMethod = this.getFallbackMethod(routingDecision.method);
      if (fallbackMethod) {
        console.log(`🔄 Falling back to: ${fallbackMethod}`);
        return await this.route(prompt, userTrustScore, { ...options, preferredMethod: fallbackMethod });
      }
      
      throw error;
    }
  }

  makeRoutingDecision(prompt, trustScore, options) {
    // Prefer user's specified method
    if (options.preferredMethod && this.availableMethods.includes(options.preferredMethod)) {
      return {
        method: options.preferredMethod,
        reasoning: 'User preference'
      };
    }

    // Code-related prompts → Claude Code CLI
    if (this.isCodeRelated(prompt) && this.availableMethods.includes('claude_code')) {
      return {
        method: 'claude_code',
        reasoning: 'Code task optimized for Claude Code CLI'
      };
    }

    // Long context tasks → Claude Desktop
    if (prompt.length > 2000 && this.availableMethods.includes('claude_desktop')) {
      return {
        method: 'claude_desktop',
        reasoning: 'Long context optimized for Claude Desktop'
      };
    }

    // Quick tasks → ChatGPT CLI (faster)
    if (prompt.length < 200 && this.availableMethods.includes('chatgpt_cli')) {
      return {
        method: 'chatgpt_cli',
        reasoning: 'Quick task optimized for ChatGPT CLI'
      };
    }

    // Default to first available method
    return {
      method: this.availableMethods[0],
      reasoning: 'Default available method'
    };
  }

  isCodeRelated(prompt) {
    const codeKeywords = ['function', 'class', 'import', 'const', 'def', 'code', 'programming', 'debug', 'refactor'];
    return codeKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
  }

  getFallbackMethod(failedMethod) {
    const methods = this.availableMethods.filter(m => m !== failedMethod);
    return methods[0] || null;
  }
}

module.exports = {
  ClaudeDesktopIntegration,
  ChatGPTCLIIntegration,
  UnifiedSubscriptionRouter
};