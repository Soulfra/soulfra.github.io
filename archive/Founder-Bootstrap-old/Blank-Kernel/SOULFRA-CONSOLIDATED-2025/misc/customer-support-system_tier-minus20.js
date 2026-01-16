/**
 * 🤝 SOULFRA CUSTOMER SUPPORT SYSTEM
 * Simple, helpful, human support that actually solves problems
 */

const express = require('express');
const router = express.Router();
const EventEmitter = require('events');

class CustomerSupportSystem extends EventEmitter {
  constructor() {
    super();
    
    // Support channels
    this.channels = {
      chat: new LiveChatSupport(),
      email: new EmailSupport(),
      knowledge: new KnowledgeBase(),
      tickets: new TicketSystem()
    };
    
    // Support metrics
    this.metrics = {
      avgResponseTime: 0,
      satisfactionScore: 0,
      ticketsResolved: 0,
      commonIssues: new Map()
    };
    
    this.setupAutomation();
  }
  
  setupAutomation() {
    // Auto-categorize and route support requests
    this.on('support_request', async (request) => {
      const category = this.categorizeRequest(request);
      const urgency = this.assessUrgency(request);
      
      if (category === 'common' && this.channels.knowledge.hasAnswer(request.issue)) {
        // Auto-respond with knowledge base article
        return this.autoRespond(request);
      }
      
      if (urgency === 'critical') {
        // Escalate to human immediately
        return this.escalateToHuman(request);
      }
      
      // Route to appropriate channel
      return this.routeRequest(request, category, urgency);
    });
  }
  
  categorizeRequest(request) {
    const categories = {
      billing: ['payment', 'charge', 'subscription', 'refund', 'invoice'],
      technical: ['error', 'bug', 'crash', 'slow', 'broken'],
      account: ['login', 'password', 'email', 'locked', 'access'],
      feature: ['how to', 'can i', 'does it', 'tutorial'],
      security: ['hacked', 'breach', 'stolen', 'compromised']
    };
    
    const content = request.message.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  }
  
  assessUrgency(request) {
    const critical = ['cannot access', 'lost data', 'security breach', 'hacked'];
    const high = ['error', 'broken', 'urgent', 'asap'];
    
    const content = request.message.toLowerCase();
    
    if (critical.some(term => content.includes(term))) return 'critical';
    if (high.some(term => content.includes(term))) return 'high';
    if (request.userTier === 'enterprise') return 'high';
    
    return 'normal';
  }
}

// Live Chat Support
class LiveChatSupport {
  constructor() {
    this.activeChats = new Map();
    this.chatQueue = [];
    this.agents = new Map();
  }
  
  async startChat(userId, issue) {
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const chat = {
      id: chatId,
      userId,
      issue,
      startTime: new Date(),
      messages: [],
      status: 'waiting'
    };
    
    // Add greeting
    chat.messages.push({
      from: 'system',
      text: "Hi! I'm connecting you with a support agent. While you wait, here are some helpful resources:",
      suggestions: await this.getSuggestions(issue),
      timestamp: new Date()
    });
    
    this.activeChats.set(chatId, chat);
    this.chatQueue.push(chatId);
    
    // Assign to available agent
    this.assignToAgent(chatId);
    
    return chat;
  }
  
  async getSuggestions(issue) {
    // Smart suggestions based on issue
    const suggestions = [];
    
    if (issue.includes('password')) {
      suggestions.push({
        title: 'Reset Your Password',
        link: '/support/reset-password'
      });
    }
    
    if (issue.includes('billing')) {
      suggestions.push({
        title: 'Manage Subscription',
        link: '/billing/manage'
      });
    }
    
    return suggestions;
  }
  
  assignToAgent(chatId) {
    // Find available agent
    const availableAgent = Array.from(this.agents.values())
      .find(agent => agent.status === 'available');
    
    if (availableAgent) {
      availableAgent.activeChat = chatId;
      availableAgent.status = 'busy';
      
      const chat = this.activeChats.get(chatId);
      chat.status = 'active';
      chat.agent = availableAgent.name;
      
      chat.messages.push({
        from: 'agent',
        name: availableAgent.name,
        text: `Hi! I'm ${availableAgent.name}. I've reviewed your issue and I'm here to help. What specifically are you experiencing?`,
        timestamp: new Date()
      });
    }
  }
}

// Email Support
class EmailSupport {
  constructor() {
    this.templates = this.loadTemplates();
    this.autoResponses = this.setupAutoResponses();
  }
  
  loadTemplates() {
    return {
      welcome: {
        subject: 'Welcome to Soulfra - Getting Started',
        body: `Hi {{name}},

Welcome to Soulfra! Your data is now protected by mathematics that even quantum computers can't break.

Here's how to get started:

1. **Protect Your First File**
   Open the Soulfra app and drag any file into it. That's it!

2. **Set Up Family Sharing** (if on Family plan)
   Go to Settings > Family and invite up to 4 family members.

3. **Install on Other Devices**
   Download Soulfra on all your devices using the same email.

Need help? Just reply to this email or visit help.soulfra.com

Stay sovereign,
The Soulfra Team`
      },
      
      passwordReset: {
        subject: 'Reset Your Soulfra Password',
        body: `Hi {{name}},

Someone requested a password reset for your Soulfra account.

Click here to reset: {{resetLink}}

This link expires in 1 hour. If you didn't request this, please ignore this email.

For security, Soulfra uses biometric authentication, so you may not even need a password for daily use!

Questions? Reply to this email.

The Soulfra Team`
      },
      
      subscriptionConfirm: {
        subject: 'Subscription Confirmed - Thank You!',
        body: `Hi {{name}},

Your {{plan}} subscription is now active! 

What's included:
{{features}}

Your next billing date is {{nextBilling}}.

Manage your subscription anytime at: {{billingPortal}}

Thank you for trusting us with your data protection.

The Soulfra Team`
      }
    };
  }
  
  setupAutoResponses() {
    return {
      'how to share': {
        subject: 'Re: How to Share Protected Data',
        body: `Thanks for your question about sharing!

To share protected data in Soulfra:

1. Open the file you want to share
2. Click the Share button
3. Enter the recipient's email
4. Choose permissions (view only or full access)
5. Click Send

The recipient will get a secure link that only works for them.

For family sharing, add family members in Settings > Family for automatic sharing.

Need more help? Check out our sharing guide: help.soulfra.com/sharing

Best,
Soulfra Support`
      },
      
      'cancel subscription': {
        subject: 'Re: Cancellation Request',
        body: `I'm sorry to hear you're thinking about leaving!

Before you go:

1. **Export Your Data**: Go to Settings > Export to download all your protected data
2. **Tell Us Why**: Your feedback helps us improve: feedback.soulfra.com
3. **Cancel Anytime**: Visit billing.soulfra.com or click here: {{cancelLink}}

Remember: Your free tier (1GB) is always available if you change your mind.

Is there anything I can help with to improve your experience?

Best,
{{agentName}}
Soulfra Support`
      }
    };
  }
  
  async sendEmail(to, templateName, variables) {
    const template = this.templates[templateName];
    if (!template) throw new Error('Template not found');
    
    let subject = template.subject;
    let body = template.body;
    
    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(placeholder, value);
      body = body.replace(new RegExp(placeholder, 'g'), value);
    }
    
    // In production, integrate with SendGrid/Postmark
    console.log(`📧 Email sent to ${to}: ${subject}`);
    
    return { sent: true, messageId: `msg_${Date.now()}` };
  }
}

// Knowledge Base
class KnowledgeBase {
  constructor() {
    this.articles = this.loadArticles();
    this.searchIndex = this.buildSearchIndex();
  }
  
  loadArticles() {
    return [
      {
        id: 'getting-started',
        title: 'Getting Started with Soulfra',
        category: 'basics',
        content: `Welcome to Soulfra! Here's everything you need to know...`,
        keywords: ['start', 'begin', 'new', 'setup', 'install']
      },
      {
        id: 'biometric-setup',
        title: 'Setting Up Biometric Authentication',
        category: 'security',
        content: `Soulfra uses your face or fingerprint to protect your data...`,
        keywords: ['face', 'fingerprint', 'biometric', 'touch id', 'face id']
      },
      {
        id: 'sharing-data',
        title: 'How to Share Protected Data',
        category: 'features',
        content: `Share your protected data securely with others...`,
        keywords: ['share', 'send', 'collaborate', 'family']
      },
      {
        id: 'troubleshooting-sync',
        title: 'Fixing Sync Issues',
        category: 'troubleshooting',
        content: `If your data isn't syncing between devices...`,
        keywords: ['sync', 'not syncing', 'devices', 'update']
      }
    ];
  }
  
  buildSearchIndex() {
    const index = new Map();
    
    this.articles.forEach(article => {
      article.keywords.forEach(keyword => {
        if (!index.has(keyword)) {
          index.set(keyword, []);
        }
        index.get(keyword).push(article.id);
      });
    });
    
    return index;
  }
  
  search(query) {
    const words = query.toLowerCase().split(' ');
    const matches = new Map();
    
    words.forEach(word => {
      if (this.searchIndex.has(word)) {
        this.searchIndex.get(word).forEach(articleId => {
          matches.set(articleId, (matches.get(articleId) || 0) + 1);
        });
      }
    });
    
    // Sort by relevance
    const sorted = Array.from(matches.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => this.articles.find(a => a.id === id));
    
    return sorted.slice(0, 5);
  }
  
  hasAnswer(issue) {
    return this.search(issue).length > 0;
  }
}

// Ticket System
class TicketSystem {
  constructor() {
    this.tickets = new Map();
    this.ticketCount = 0;
  }
  
  createTicket(userId, issue, category, urgency) {
    const ticketId = `TKT-${String(++this.ticketCount).padStart(6, '0')}`;
    
    const ticket = {
      id: ticketId,
      userId,
      issue,
      category,
      urgency,
      status: 'open',
      created: new Date(),
      updated: new Date(),
      messages: [],
      assignee: null
    };
    
    this.tickets.set(ticketId, ticket);
    
    // Add initial message
    ticket.messages.push({
      from: 'system',
      text: `Ticket ${ticketId} created. We'll respond within ${this.getSLA(urgency)}.`,
      timestamp: new Date()
    });
    
    return ticket;
  }
  
  getSLA(urgency) {
    const slas = {
      critical: '1 hour',
      high: '4 hours',
      normal: '24 hours',
      low: '48 hours'
    };
    return slas[urgency] || '24 hours';
  }
}

// API Routes
router.post('/chat/start', async (req, res) => {
  try {
    const { userId, issue } = req.body;
    const support = req.app.locals.support;
    
    const chat = await support.channels.chat.startChat(userId, issue);
    
    res.json({
      success: true,
      chat
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/email/send', async (req, res) => {
  try {
    const { to, template, variables } = req.body;
    const support = req.app.locals.support;
    
    const result = await support.channels.email.sendEmail(to, template, variables);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/kb/search', (req, res) => {
  const { q } = req.query;
  const support = req.app.locals.support;
  
  const results = support.channels.knowledge.search(q);
  
  res.json({
    query: q,
    results
  });
});

router.post('/ticket/create', (req, res) => {
  const { userId, issue, category, urgency } = req.body;
  const support = req.app.locals.support;
  
  const ticket = support.channels.tickets.createTicket(userId, issue, category, urgency);
  
  res.json({
    success: true,
    ticket
  });
});

// Help Widget HTML
router.get('/widget', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Soulfra Help</title>
  <style>
    body { font-family: -apple-system, sans-serif; margin: 0; padding: 20px; }
    .help-widget { max-width: 600px; margin: 0 auto; }
    .search-box { width: 100%; padding: 15px; font-size: 16px; border: 2px solid #ddd; border-radius: 8px; margin-bottom: 20px; }
    .quick-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 30px; }
    .action-card { background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.3s; }
    .action-card:hover { background: #667eea; color: white; transform: translateY(-2px); }
    .results { margin-top: 20px; }
    .result-item { background: white; padding: 15px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 10px; cursor: pointer; }
    .result-item:hover { border-color: #667eea; }
    .chat-button { position: fixed; bottom: 20px; right: 20px; background: #667eea; color: white; padding: 15px 30px; border-radius: 50px; cursor: pointer; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
  </style>
</head>
<body>
  <div class="help-widget">
    <h1>How can we help?</h1>
    
    <input type="text" class="search-box" placeholder="Search for help..." id="searchBox">
    
    <div class="quick-actions">
      <div class="action-card" onclick="quickAction('password')">
        🔑 Reset Password
      </div>
      <div class="action-card" onclick="quickAction('billing')">
        💳 Billing Help
      </div>
      <div class="action-card" onclick="quickAction('share')">
        🔗 Share Data
      </div>
      <div class="action-card" onclick="quickAction('sync')">
        🔄 Sync Issues
      </div>
    </div>
    
    <div id="results" class="results"></div>
  </div>
  
  <div class="chat-button" onclick="startChat()">
    💬 Chat with us
  </div>
  
  <script>
    const searchBox = document.getElementById('searchBox');
    const results = document.getElementById('results');
    
    searchBox.addEventListener('input', async (e) => {
      const query = e.target.value;
      if (query.length < 2) {
        results.innerHTML = '';
        return;
      }
      
      const response = await fetch('/api/support/kb/search?q=' + encodeURIComponent(query));
      const data = await response.json();
      
      results.innerHTML = data.results.map(article => \`
        <div class="result-item" onclick="viewArticle('\${article.id}')">
          <h3>\${article.title}</h3>
          <p>\${article.category}</p>
        </div>
      \`).join('');
    });
    
    function quickAction(action) {
      searchBox.value = action;
      searchBox.dispatchEvent(new Event('input'));
    }
    
    function viewArticle(id) {
      window.location.href = '/support/article/' + id;
    }
    
    function startChat() {
      window.open('/support/chat', 'chat', 'width=400,height=600');
    }
  </script>
</body>
</html>
  `);
});

module.exports = { CustomerSupportSystem, router };