#!/usr/bin/env node
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { orchestrate } = require('./agent-orchestrator');
const { spawn } = require('child_process');

// ASCII art banner
const BANNER = `
╔═══════════════════════════════════════════════════════════════╗
║                    🧠 Cal Riven Chat Shell 🧠                 ║
║                  Mirror-backed conversation loop               ║
╚═══════════════════════════════════════════════════════════════╝
`;

// Session management
class ConversationManager {
  constructor() {
    this.sessionId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.conversationPath = path.join(__dirname, '..', 'vault', 'conversations', `${this.sessionId}.json`);
    this.conversation = {
      id: this.sessionId,
      started: new Date().toISOString(),
      deviceId: this.getDeviceId(),
      messages: []
    };
  }

  getDeviceId() {
    try {
      const boundToPath = path.join(__dirname, '..', '.bound-to');
      return fs.existsSync(boundToPath) ? fs.readFileSync(boundToPath, 'utf8').trim() : 'unknown';
    } catch (e) {
      return 'unknown';
    }
  }

  addMessage(role, content, metadata = {}) {
    const message = {
      timestamp: Date.now(),
      role,
      content,
      ...metadata
    };
    this.conversation.messages.push(message);
    this.save();
    return message;
  }

  save() {
    fs.writeFileSync(this.conversationPath, JSON.stringify(this.conversation, null, 2));
  }

  getContext(lastN = 5) {
    return this.conversation.messages
      .slice(-lastN)
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');
  }
}

// Launch detection patterns
const LAUNCH_PATTERNS = {
  website: /build\s+(me\s+)?a\s+website\s+for\s+(.+)/i,
  cli: /create\s+(a\s+)?cli\s+(tool\s+)?for\s+(.+)/i,
  typescript: /spin\s+up\s+(a\s+)?typescript\s+(project|app)\s+for\s+(.+)/i,
  launch: /let'?s\s+(launch|go|build)\s*(this|it)?/i,
  project: /create\s+(a\s+)?project\s+for\s+(.+)/i
};

// Chat interface
class CalChatInterface {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '\n🧠 Cal> '
    });
    
    this.conversation = new ConversationManager();
    this.memoryWatcher = null;
    this.isProcessing = false;
  }

  start() {
    console.clear();
    console.log(BANNER);
    console.log('✨ QR-verified chat interface ready');
    console.log('💡 Try: "Build me a website for my coffee shop"');
    console.log('📂 Drop files into vault/memory/ to expand context');
    console.log('🔚 Type "exit" or Ctrl+C to quit\n');

    // Watch memory vault for changes
    this.watchMemoryVault();

    // Display prompt
    this.rl.prompt();

    // Handle user input
    this.rl.on('line', async (input) => {
      const trimmed = input.trim();
      
      if (trimmed.toLowerCase() === 'exit') {
        return this.shutdown();
      }

      if (!trimmed) {
        return this.rl.prompt();
      }

      // Prevent concurrent processing
      if (this.isProcessing) {
        console.log('⏳ Still processing previous request...');
        return;
      }

      this.isProcessing = true;
      
      // Add user message to conversation
      this.conversation.addMessage('user', trimmed);

      // Check for launch commands
      const launchIntent = this.detectLaunchIntent(trimmed);
      if (launchIntent) {
        await this.handleLaunchIntent(trimmed, launchIntent);
      } else {
        await this.handleReflection(trimmed);
      }

      this.isProcessing = false;
      this.rl.prompt();
    });

    this.rl.on('close', () => this.shutdown());
  }

  detectLaunchIntent(input) {
    for (const [type, pattern] of Object.entries(LAUNCH_PATTERNS)) {
      const match = input.match(pattern);
      if (match) {
        return { type, match };
      }
    }
    return null;
  }

  async handleReflection(prompt) {
    console.log('\n🔮 Reflecting through mirror agents...');

    // Add conversation context
    const context = this.conversation.getContext();
    const enhancedPrompt = context ? `${context}\n\nuser: ${prompt}` : prompt;

    try {
      const result = await orchestrate(enhancedPrompt);
      
      if (result) {
        console.log('\n💬 Cal responds:');
        console.log(result.response);
        
        // Add Cal's response to conversation
        this.conversation.addMessage('cal', result.response, {
          winner: result.winner,
          blameId: result.blameId
        });
      } else {
        console.log('\n❌ No reflection received');
      }
    } catch (error) {
      console.error('\n❌ Reflection error:', error.message);
    }
  }

  async handleLaunchIntent(prompt, intent) {
    console.log(`\n🚀 Launch intent detected: ${intent.type}`);
    
    // First get reflection on the project idea
    await this.handleReflection(prompt);
    
    // Then offer to launch
    console.log('\n🎯 Ready to launch project. Shall I proceed? (yes/no)');
    
    const response = await new Promise(resolve => {
      this.rl.question('> ', resolve);
    });

    if (response.toLowerCase().startsWith('y')) {
      const projectName = this.extractProjectName(prompt, intent);
      const launcher = spawn('node', [
        path.join(__dirname, 'cal-launch-agent.js'),
        intent.type,
        projectName,
        prompt
      ], { stdio: 'inherit' });

      launcher.on('close', (code) => {
        if (code === 0) {
          console.log('\n✅ Project launched successfully!');
          this.conversation.addMessage('system', `Launched ${intent.type} project: ${projectName}`);
        } else {
          console.log('\n❌ Project launch failed');
        }
      });
    }
  }

  extractProjectName(prompt, intent) {
    // Extract project name from various patterns
    if (intent.type === 'website' && intent.match[2]) {
      return intent.match[2].replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    }
    if (intent.type === 'cli' && intent.match[3]) {
      return intent.match[3].replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    }
    if (intent.type === 'typescript' && intent.match[3]) {
      return intent.match[3].replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    }
    if (intent.type === 'project' && intent.match[2]) {
      return intent.match[2].replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    }
    return `cal-project-${Date.now()}`;
  }

  watchMemoryVault() {
    const memoryPath = path.join(__dirname, '..', 'vault', 'memory');
    
    this.memoryWatcher = fs.watch(memoryPath, async (eventType, filename) => {
      if (filename && eventType === 'rename') {
        console.log(`\n📄 New memory detected: ${filename}`);
        
        // Check if it's a seed file
        if (filename.endsWith('.seed.js') || filename.endsWith('.seed.md')) {
          console.log('🌱 Seed file detected! Say "let\'s launch this" to execute.');
          
          // Store seed in conversation context
          this.conversation.addMessage('system', `Seed file added: ${filename}`);
        }
      }
    });
  }

  shutdown() {
    console.log('\n👋 Cal signing off. Session saved to:', this.conversation.sessionId);
    this.conversation.addMessage('system', 'Session ended');
    
    if (this.memoryWatcher) {
      this.memoryWatcher.close();
    }
    
    this.rl.close();
    process.exit(0);
  }
}

// Voice input support (optional)
function checkVoiceSupport() {
  // Check if 'say' command exists (macOS)
  try {
    const { execSync } = require('child_process');
    execSync('which say', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

// Main execution
if (require.main === module) {
  const chat = new CalChatInterface();
  
  // Check for voice support
  if (checkVoiceSupport()) {
    console.log('🎤 Voice output available (macOS detected)');
  }
  
  chat.start();
}

module.exports = { CalChatInterface, ConversationManager };