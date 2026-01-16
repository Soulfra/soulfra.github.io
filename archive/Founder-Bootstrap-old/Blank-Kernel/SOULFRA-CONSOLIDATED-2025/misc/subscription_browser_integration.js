// ==========================================
// SOULFRA SUBSCRIPTION BROWSER INTEGRATION
// Route through existing ChatGPT Plus & Claude Pro subscriptions
// ==========================================

const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');

class SubscriptionIntegrationManager {
  constructor() {
    this.sessions = new Map(); // Store browser sessions
    this.requestQueue = new Map(); // Queue requests by provider
    this.rateLimits = {
      chatgpt: { requests: 0, resetTime: Date.now() + 3600000 }, // 1 hour reset
      claude: { requests: 0, resetTime: Date.now() + 3600000 }
    };
  }

  async initializeBrowserSessions() {
    console.log('🌐 Initializing subscription browser sessions...');
    
    // Launch persistent browser sessions
    const chatgptBrowser = await puppeteer.launch({
      headless: true, // Set to false for debugging
      userDataDir: './browser-sessions/chatgpt',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const claudeBrowser = await puppeteer.launch({
      headless: true,
      userDataDir: './browser-sessions/claude', 
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.sessions.set('chatgpt', {
      browser: chatgptBrowser,
      page: null,
      isAuthenticated: false,
      isReady: false
    });

    this.sessions.set('claude', {
      browser: claudeBrowser,
      page: null,
      isAuthenticated: false,
      isReady: false
    });

    // Setup session pages
    await this.setupChatGPTSession();
    await this.setupClaudeSession();

    console.log('✅ Browser sessions initialized');
  }

  async setupChatGPTSession() {
    console.log('🤖 Setting up ChatGPT session...');
    
    const session = this.sessions.get('chatgpt');
    const page = await session.browser.newPage();
    
    // Navigate to ChatGPT
    await page.goto('https://chat.openai.com', { waitUntil: 'networkidle0' });
    
    // Check if already logged in
    try {
      await page.waitForSelector('.text-token-text-primary', { timeout: 5000 });
      session.isAuthenticated = true;
      session.isReady = true;
      console.log('✅ ChatGPT session ready (already authenticated)');
    } catch (error) {
      console.log('⚠️  ChatGPT requires manual login - opening browser...');
      // In production, you'd implement OAuth or session restoration
      await this.promptManualLogin('ChatGPT', page);
    }
    
    session.page = page;
  }

  async setupClaudeSession() {
    console.log('🧠 Setting up Claude session...');
    
    const session = this.sessions.get('claude');
    const page = await session.browser.newPage();
    
    // Navigate to Claude
    await page.goto('https://claude.ai', { waitUntil: 'networkidle0' });
    
    // Check if already logged in
    try {
      await page.waitForSelector('[data-testid="chat-input"]', { timeout: 5000 });
      session.isAuthenticated = true;
      session.isReady = true;
      console.log('✅ Claude session ready (already authenticated)');
    } catch (error) {
      console.log('⚠️  Claude requires manual login - opening browser...');
      await this.promptManualLogin('Claude', page);
    }
    
    session.page = page;
  }

  async promptManualLogin(provider, page) {
    // For initial setup, require manual login
    console.log(`\n🔐 MANUAL LOGIN REQUIRED FOR ${provider.toUpperCase()}`);
    console.log(`Please log in to ${provider} in the browser that just opened.`);
    console.log('Press ENTER when login is complete...\n');
    
    // In development, pause for manual login
    if (process.env.NODE_ENV === 'development') {
      await page.setViewport({ width: 1200, height: 800 });
      await new Promise(resolve => {
        process.stdin.once('data', resolve);
      });
    }
    
    // Mark as authenticated after manual login
    this.sessions.get(provider.toLowerCase()).isAuthenticated = true;
    this.sessions.get(provider.toLowerCase()).isReady = true;
  }

  async routeToSubscription(prompt, userTrustScore, options = {}) {
    console.log('🔄 Routing to subscription services...');
    
    // Determine best provider based on prompt complexity and trust score
    const routingDecision = this.makeSubscriptionRoutingDecision(prompt, userTrustScore);
    
    try {
      let response;
      
      switch (routingDecision.provider) {
        case 'chatgpt':
          response = await this.sendToChatGPT(prompt, routingDecision);
          break;
        case 'claude':
          response = await this.sendToClaude(prompt, routingDecision);
          break;
        default:
          throw new Error(`Unsupported provider: ${routingDecision.provider}`);
      }
      
      return {
        content: response,
        metadata: {
          provider: routingDecision.provider,
          model: routingDecision.model,
          reasoning: routingDecision.reasoning,
          cost: 0, // Subscription = zero marginal cost!
          trustScore: userTrustScore,
          subscriptionUsed: true
        }
      };
      
    } catch (error) {
      console.error(`❌ Subscription routing failed: ${error.message}`);
      throw error;
    }
  }

  makeSubscriptionRoutingDecision(prompt, trustScore) {
    // Smart routing based on subscription capabilities
    
    const promptLength = prompt.length;
    const complexity = this.analyzePromptComplexity(prompt);
    
    // ChatGPT Plus advantages: Code, math, web browsing
    if (this.isCodeRelated(prompt) || this.requiresWebBrowsing(prompt)) {
      return {
        provider: 'chatgpt',
        model: 'gpt-4',
        reasoning: 'Code/web browsing optimized for ChatGPT Plus',
        tier: 'plus'
      };
    }
    
    // Claude Pro advantages: Long context, writing, analysis
    if (promptLength > 1000 || this.isWritingTask(prompt) || complexity > 7) {
      return {
        provider: 'claude',
        model: 'claude-3-sonnet',
        reasoning: 'Long context/writing optimized for Claude Pro',
        tier: 'pro'
      };
    }
    
    // Default: Use based on current rate limits
    const chatgptAvailable = this.rateLimits.chatgpt.requests < 40; // ChatGPT Plus ~40/3hr
    const claudeAvailable = this.rateLimits.claude.requests < 100; // Claude Pro ~100/8hr
    
    if (trustScore > 70 && claudeAvailable) {
      return {
        provider: 'claude',
        model: 'claude-3-sonnet',
        reasoning: 'High trust user + Claude available',
        tier: 'pro'
      };
    }
    
    if (chatgptAvailable) {
      return {
        provider: 'chatgpt',
        model: 'gpt-4',
        reasoning: 'ChatGPT Plus available',
        tier: 'plus'
      };
    }
    
    // Fallback to whichever has capacity
    return {
      provider: claudeAvailable ? 'claude' : 'chatgpt',
      model: claudeAvailable ? 'claude-3-sonnet' : 'gpt-4',
      reasoning: 'Fallback to available subscription',
      tier: claudeAvailable ? 'pro' : 'plus'
    };
  }

  async sendToChatGPT(prompt, routingDecision) {
    const session = this.sessions.get('chatgpt');
    
    if (!session.isReady) {
      throw new Error('ChatGPT session not ready');
    }
    
    const page = session.page;
    
    try {
      // Wait for chat input to be available
      await page.waitForSelector('#prompt-textarea', { timeout: 10000 });
      
      // Clear any existing text and send new prompt
      await page.click('#prompt-textarea');
      await page.keyboard.down('Control');
      await page.keyboard.press('a');
      await page.keyboard.up('Control');
      await page.type('#prompt-textarea', prompt);
      
      // Send the message
      await page.keyboard.press('Enter');
      
      // Wait for response to start appearing
      await page.waitForFunction(
        () => {
          const messages = document.querySelectorAll('[data-message-author-role="assistant"]');
          return messages.length > 0 && messages[messages.length - 1].textContent.length > 10;
        },
        { timeout: 30000 }
      );
      
      // Wait a bit more for complete response
      await page.waitForTimeout(2000);
      
      // Extract the latest assistant response
      const response = await page.evaluate(() => {
        const messages = document.querySelectorAll('[data-message-author-role="assistant"]');
        if (messages.length > 0) {
          return messages[messages.length - 1].textContent;
        }
        return null;
      });
      
      if (!response) {
        throw new Error('No response received from ChatGPT');
      }
      
      // Update rate limiting
      this.rateLimits.chatgpt.requests++;
      
      console.log('✅ ChatGPT response received');
      return response;
      
    } catch (error) {
      console.error('❌ ChatGPT request failed:', error.message);
      throw error;
    }
  }

  async sendToClaude(prompt, routingDecision) {
    const session = this.sessions.get('claude');
    
    if (!session.isReady) {
      throw new Error('Claude session not ready');
    }
    
    const page = session.page;
    
    try {
      // Wait for chat input
      await page.waitForSelector('[data-testid="chat-input"]', { timeout: 10000 });
      
      // Clear and send prompt
      await page.click('[data-testid="chat-input"]');
      await page.keyboard.down('Control');
      await page.keyboard.press('a');
      await page.keyboard.up('Control');
      await page.type('[data-testid="chat-input"]', prompt);
      
      // Send message (Enter or send button)
      await page.keyboard.press('Enter');
      
      // Wait for response
      await page.waitForFunction(
        () => {
          const messages = document.querySelectorAll('[data-testid="message"]');
          const lastMessage = messages[messages.length - 1];
          return lastMessage && lastMessage.textContent.length > 10;
        },
        { timeout: 45000 } // Claude can be slower
      );
      
      // Extract response
      const response = await page.evaluate(() => {
        const messages = document.querySelectorAll('[data-testid="message"]');
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          // Look for assistant messages specifically
          if (lastMessage.textContent.includes('Claude') || messages.length % 2 === 0) {
            return lastMessage.textContent;
          }
        }
        return null;
      });
      
      if (!response) {
        throw new Error('No response received from Claude');
      }
      
      // Update rate limiting
      this.rateLimits.claude.requests++;
      
      console.log('✅ Claude response received');
      return response;
      
    } catch (error) {
      console.error('❌ Claude request failed:', error.message);
      throw error;
    }
  }

  // Helper methods for prompt analysis
  analyzePromptComplexity(prompt) {
    let complexity = 0;
    
    if (prompt.length > 500) complexity += 2;
    if (prompt.includes('analyze') || prompt.includes('explain')) complexity += 2;
    if (prompt.includes('code') || prompt.includes('function')) complexity += 3;
    if (prompt.includes('strategy') || prompt.includes('business')) complexity += 2;
    
    return complexity;
  }

  isCodeRelated(prompt) {
    const codeKeywords = ['function', 'class', 'import', 'const', 'let', 'var', 'def', 'code', 'programming'];
    return codeKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
  }

  requiresWebBrowsing(prompt) {
    const webKeywords = ['current', 'latest', 'news', 'today', 'recent', 'search for'];
    return webKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
  }

  isWritingTask(prompt) {
    const writingKeywords = ['write', 'draft', 'compose', 'essay', 'article', 'blog', 'content'];
    return writingKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
  }

  async cleanup() {
    console.log('🧹 Cleaning up browser sessions...');
    
    for (const [provider, session] of this.sessions) {
      if (session.browser) {
        await session.browser.close();
      }
    }
    
    this.sessions.clear();
    console.log('✅ Browser sessions cleaned up');
  }
}

// Usage example
const subscriptionManager = new SubscriptionIntegrationManager();

// Initialize on startup
subscriptionManager.initializeBrowserSessions();

// Route requests through subscriptions
async function routeToSubscriptions(prompt, userTrustScore) {
  try {
    const response = await subscriptionManager.routeToSubscription(prompt, userTrustScore);
    return response;
  } catch (error) {
    // Fallback to API if subscription fails
    console.log('⚠️  Subscription routing failed, falling back to API');
    return await fallbackToAPI(prompt, userTrustScore);
  }
}

async function fallbackToAPI(prompt, userTrustScore) {
  // Your existing API routing logic here
  console.log('🔄 Using API fallback');
  return { content: 'API fallback response', metadata: { subscriptionUsed: false } };
}

module.exports = { SubscriptionIntegrationManager, routeToSubscriptions };