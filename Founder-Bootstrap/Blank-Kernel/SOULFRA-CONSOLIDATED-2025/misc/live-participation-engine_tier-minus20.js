#!/usr/bin/env node

/**
 * 🎯 LIVE PARTICIPATION ENGINE
 * The missing piece that makes everything INSTANTLY BUYABLE
 * 
 * WHAT IT DOES:
 * - Viewers watch streams and earn Stripe credits
 * - Businesses buy automations with one click
 * - Creators get paid for live automation building
 * - Gamers unlock features through participation
 * - Everything is monetized and instant
 * 
 * THE MAGIC:
 * - Watch stream → Earn credits → Buy automation → Use immediately
 * - Vote on decisions → Get rewarded → Level up → Unlock features
 * - Build automation live → Audience pays → Deploy instantly
 */

const fs = require('fs');
const http = require('http');
const crypto = require('crypto');

class LiveParticipationEngine {
  constructor() {
    this.port = 5001; // The participation hub
    this.stripeCredits = new Map(); // User credit balances
    this.liveStreams = new Map(); // Active streams
    this.automationMarketplace = new Map(); // Available automations
    this.gamingRewards = new Map(); // Gaming achievements
    this.businessRequests = new Map(); // Live business requests
    this.creatorEarnings = new Map(); // Creator revenue tracking
    
    this.initializeParticipationEngine();
  }

  async initializeParticipationEngine() {
    console.log('🎯 LIVE PARTICIPATION ENGINE STARTING');
    console.log('====================================\n');

    // 1. Setup Stripe credits system
    await this.setupStripeCredits();
    
    // 2. Initialize automation marketplace
    await this.initializeMarketplace();
    
    // 3. Setup gaming rewards
    await this.setupGamingRewards();
    
    // 4. Launch participation server
    this.startParticipationServer();
    
    // 5. Connect to streaming network
    await this.connectToStreams();
    
    console.log('🎯 PARTICIPATION ENGINE LIVE!');
    console.log('💰 Stripe credits, marketplace, and gaming all connected!');
  }

  async setupStripeCredits() {
    console.log('💳 Setting up Stripe credits system...');
    
    this.creditSystem = {
      earning_rates: {
        watching_stream: 1, // 1 credit per minute watched
        voting_decision: 5, // 5 credits per vote
        helping_creator: 10, // 10 credits for suggestions
        playing_game: 2, // 2 credits per game action
        sharing_content: 3, // 3 credits for shares
        referring_user: 50 // 50 credits for referrals
      },
      spending_options: {
        basic_automation: 100, // 100 credits
        custom_automation: 500, // 500 credits
        priority_request: 250, // 250 credits
        exclusive_access: 1000, // 1000 credits
        creator_tip: 25, // 25 credits minimum
        game_powerups: 10 // 10 credits
      },
      conversion_rates: {
        credits_to_usd: 0.01, // 1 credit = $0.01
        usd_to_credits: 100, // $1 = 100 credits
        minimum_purchase: 1000, // $10 minimum
        creator_payout: 0.7 // Creators get 70%
      }
    };

    // Initialize demo users with credits
    this.stripeCredits.set('demo_viewer', 1000);
    this.stripeCredits.set('demo_business', 5000);
    this.stripeCredits.set('demo_creator', 2500);
    
    console.log('✓ Stripe credits system ready');
    console.log('  💰 Demo users loaded with credits');
    console.log('  🎮 Gaming rewards connected');
    console.log('  💼 Business marketplace open');
  }

  async initializeMarketplace() {
    console.log('🛒 Initializing automation marketplace...');
    
    // Pre-populate with demo automations
    this.automationMarketplace.set('email-sorter', {
      id: 'email-sorter',
      name: 'Smart Email Sorting',
      description: 'AI sorts your emails automatically',
      price_credits: 150,
      creator: 'AutomationWizard',
      category: 'productivity',
      time_saved: '2 hours/week',
      popularity: 847,
      live_demo_url: 'http://localhost:7777/demo/email-sorter',
      instant_deploy: true,
      enterprise_ready: true
    });

    this.automationMarketplace.set('calendar-sync', {
      id: 'calendar-sync',
      name: 'Multi-Calendar Sync',
      description: 'Syncs all your calendars intelligently',
      price_credits: 200,
      creator: 'CalendarMaster',
      category: 'scheduling',
      time_saved: '1 hour/day',
      popularity: 623,
      live_demo_url: 'http://localhost:8888/demo/calendar-sync',
      instant_deploy: true,
      enterprise_ready: true
    });

    this.automationMarketplace.set('slack-summarizer', {
      id: 'slack-summarizer',
      name: 'Slack Message Summarizer',
      description: 'AI summarizes Slack channels daily',
      price_credits: 300,
      creator: 'TeamEfficiency',
      category: 'communication',
      time_saved: '30 minutes/day',
      popularity: 1205,
      live_demo_url: 'http://localhost:9999/demo/slack-summarizer',
      instant_deploy: true,
      enterprise_ready: true
    });

    console.log('✓ Marketplace ready with featured automations');
    console.log('  🎯 Instant deployment available');
    console.log('  💼 Enterprise-grade automations');
  }

  async setupGamingRewards() {
    console.log('🎮 Setting up gaming rewards system...');
    
    this.gamingSystem = {
      achievements: {
        first_purchase: { credits: 100, title: '🛒 First Purchase' },
        stream_watcher: { credits: 50, title: '📺 Stream Watcher' },
        automation_user: { credits: 200, title: '🤖 Automation Master' },
        community_helper: { credits: 75, title: '🤝 Community Helper' },
        business_buyer: { credits: 500, title: '💼 Business Buyer' },
        creator_supporter: { credits: 150, title: '🎨 Creator Supporter' }
      },
      daily_quests: {
        watch_30_minutes: { credits: 30, description: 'Watch streams for 30 minutes' },
        vote_5_times: { credits: 25, description: 'Vote on 5 decisions' },
        help_creator: { credits: 50, description: 'Help a creator with feedback' },
        try_automation: { credits: 100, description: 'Try a new automation' },
        share_content: { credits: 15, description: 'Share content on social media' }
      },
      leaderboards: {
        top_earners: [], // Users who earn most credits
        top_spenders: [], // Users who spend most credits  
        top_helpers: [], // Users who help most creators
        top_voters: [] // Users who vote most on decisions
      }
    };

    console.log('✓ Gaming system ready');
    console.log('  🏆 Achievements unlock credits and features');
    console.log('  📊 Leaderboards drive competition');
    console.log('  🎯 Daily quests keep users engaged');
  }

  startParticipationServer() {
    console.log('🌐 Starting participation server...');
    
    const server = http.createServer((req, res) => {
      this.handleParticipationRequest(req, res);
    });

    server.listen(this.port, () => {
      console.log(`✓ Participation engine running on port ${this.port}`);
    });
  }

  async handleParticipationRequest(req, res) {
    const url = new URL(req.url, `http://localhost:${this.port}`);
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    console.log(`🎯 Participation: ${req.method} ${req.url}`);

    try {
      if (url.pathname === '/') {
        await this.handleMainInterface(res);
      } else if (url.pathname === '/api/marketplace') {
        await this.handleMarketplace(res);
      } else if (url.pathname === '/api/buy') {
        await this.handlePurchase(req, res);
      } else if (url.pathname === '/api/credits') {
        await this.handleCredits(req, res);
      } else if (url.pathname === '/api/vote') {
        await this.handleVoting(req, res);
      } else if (url.pathname === '/api/stream/watch') {
        await this.handleStreamWatching(req, res);
      } else if (url.pathname === '/api/gaming') {
        await this.handleGaming(res);
      } else if (url.pathname === '/api/business/request') {
        await this.handleBusinessRequest(req, res);
      } else {
        this.sendResponse(res, 404, { error: 'Not found' });
      }
    } catch (error) {
      this.sendResponse(res, 500, { error: error.message });
    }
  }

  async handleMainInterface(res) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>🎯 Live Participation Hub</title>
  <style>
    body { font-family: Arial; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin: 0; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 40px; }
    .section { background: rgba(255,255,255,0.1); padding: 20px; margin: 20px 0; border-radius: 15px; backdrop-filter: blur(10px); }
    .credits-bar { background: #4CAF50; padding: 15px; border-radius: 10px; text-align: center; font-size: 24px; margin-bottom: 20px; }
    .marketplace { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
    .automation { background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; }
    .buy-button { background: #FF6B6B; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; cursor: pointer; }
    .live-indicator { background: #ff0000; padding: 5px 10px; border-radius: 15px; font-size: 12px; }
    .gaming-section { display: flex; gap: 20px; }
    .achievement { background: rgba(255,255,255,0.2); padding: 10px; margin: 5px 0; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Live Participation Hub</h1>
      <p>Watch • Vote • Buy • Play • Earn</p>
    </div>
    
    <div class="credits-bar">
      💰 Your Credits: <span id="credits">1000</span> ($<span id="usd">10.00</span>)
    </div>
    
    <div class="section">
      <h2>🛒 Instant Automation Marketplace</h2>
      <div class="marketplace" id="marketplace">
        <div class="automation">
          <h3>📧 Smart Email Sorting</h3>
          <p>AI sorts your emails automatically</p>
          <p><strong>⏰ Saves:</strong> 2 hours/week</p>
          <p><strong>💰 Cost:</strong> 150 credits</p>
          <div class="live-indicator">🔴 LIVE DEMO</div>
          <button class="buy-button" onclick="buyAutomation('email-sorter')">Buy & Deploy Now</button>
        </div>
        
        <div class="automation">
          <h3>📅 Multi-Calendar Sync</h3>
          <p>Syncs all your calendars intelligently</p>
          <p><strong>⏰ Saves:</strong> 1 hour/day</p>
          <p><strong>💰 Cost:</strong> 200 credits</p>
          <div class="live-indicator">🔴 LIVE DEMO</div>
          <button class="buy-button" onclick="buyAutomation('calendar-sync')">Buy & Deploy Now</button>
        </div>
        
        <div class="automation">
          <h3>💬 Slack Summarizer</h3>
          <p>AI summarizes Slack channels daily</p>
          <p><strong>⏰ Saves:</strong> 30 minutes/day</p>
          <p><strong>💰 Cost:</strong> 300 credits</p>
          <div class="live-indicator">🔴 LIVE DEMO</div>
          <button class="buy-button" onclick="buyAutomation('slack-summarizer')">Buy & Deploy Now</button>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2>📺 Live Streams & Voting</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
        <div style="background: rgba(255,0,0,0.2); padding: 15px; border-radius: 10px;">
          <h3>YouTube: Cal Programming</h3>
          <p>🔴 234 viewers • Building email automation</p>
          <button class="buy-button" onclick="watchStream('youtube')">Watch & Earn Credits</button>
        </div>
        <div style="background: rgba(128,0,128,0.2); padding: 15px; border-radius: 10px;">
          <h3>Twitch: Live Coding</h3>
          <p>🔴 567 viewers • Chat helping debug</p>
          <button class="buy-button" onclick="watchStream('twitch')">Join & Collaborate</button>
        </div>
        <div style="background: rgba(0,150,255,0.2); padding: 15px; border-radius: 10px;">
          <h3>Twitter: Business Meeting</h3>
          <p>🔴 89 viewers • Voting on strategy</p>
          <button class="buy-button" onclick="voteOnDecision()">Vote & Earn 5 Credits</button>
        </div>
      </div>
    </div>
    
    <div class="gaming-section">
      <div class="section" style="flex: 1;">
        <h2>🎮 Gaming Rewards</h2>
        <div class="achievement">🏆 First Purchase - 100 credits</div>
        <div class="achievement">📺 Stream Watcher - 50 credits</div>
        <div class="achievement">🤖 Automation Master - 200 credits</div>
        <div class="achievement">🤝 Community Helper - 75 credits</div>
      </div>
      
      <div class="section" style="flex: 1;">
        <h2>💼 Business Requests</h2>
        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; margin: 10px 0;">
          <h4>Fortune 500 Company</h4>
          <p>"Need automation for 10,000 employees"</p>
          <p><strong>Budget:</strong> 50,000 credits</p>
          <button class="buy-button">Build Custom Solution</button>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    function buyAutomation(id) {
      fetch('/api/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ automation_id: id, user: 'demo_viewer' })
      })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          alert('🎉 Automation purchased and deployed! Check your dashboard.');
          updateCredits();
        } else {
          alert('❌ ' + data.error);
        }
      });
    }
    
    function watchStream(platform) {
      fetch('/api/stream/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, user: 'demo_viewer', duration: 30 })
      })
      .then(r => r.json())
      .then(data => {
        alert('📺 Earned ' + data.credits_earned + ' credits for watching!');
        updateCredits();
      });
    }
    
    function voteOnDecision() {
      fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'hire_more_developers', vote: 'yes', user: 'demo_viewer' })
      })
      .then(r => r.json())
      .then(data => {
        alert('🗳️ Vote recorded! Earned ' + data.credits_earned + ' credits.');
        updateCredits();
      });
    }
    
    function updateCredits() {
      fetch('/api/credits?user=demo_viewer')
        .then(r => r.json())
        .then(data => {
          document.getElementById('credits').textContent = data.credits;
          document.getElementById('usd').textContent = (data.credits * 0.01).toFixed(2);
        });
    }
    
    // Update credits every 10 seconds
    setInterval(updateCredits, 10000);
  </script>
</body>
</html>`;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  async handlePurchase(req, res) {
    const body = await this.getRequestBody(req);
    const { automation_id, user } = JSON.parse(body);
    
    const automation = this.automationMarketplace.get(automation_id);
    const userCredits = this.stripeCredits.get(user) || 0;
    
    if (!automation) {
      this.sendResponse(res, 404, { error: 'Automation not found' });
      return;
    }
    
    if (userCredits < automation.price_credits) {
      this.sendResponse(res, 400, { error: 'Insufficient credits' });
      return;
    }
    
    // Process purchase
    this.stripeCredits.set(user, userCredits - automation.price_credits);
    
    // Record creator earnings
    const creatorEarnings = this.creatorEarnings.get(automation.creator) || 0;
    const creatorShare = Math.floor(automation.price_credits * this.creditSystem.conversion_rates.creator_payout);
    this.creatorEarnings.set(automation.creator, creatorEarnings + creatorShare);
    
    console.log(`💰 Purchase: ${user} bought ${automation.name} for ${automation.price_credits} credits`);
    
    this.sendResponse(res, 200, {
      success: true,
      automation: automation,
      credits_remaining: this.stripeCredits.get(user),
      deployed: true,
      dashboard_url: `http://localhost:3030/dashboard?automation=${automation_id}`
    });
  }

  async handleCredits(req, res) {
    const url = new URL(req.url, `http://localhost:${this.port}`);
    const user = url.searchParams.get('user') || 'demo_viewer';
    
    const credits = this.stripeCredits.get(user) || 0;
    
    this.sendResponse(res, 200, {
      user,
      credits,
      usd_value: credits * this.creditSystem.conversion_rates.credits_to_usd,
      earning_opportunities: this.creditSystem.earning_rates,
      spending_options: this.creditSystem.spending_options
    });
  }

  async handleVoting(req, res) {
    const body = await this.getRequestBody(req);
    const { decision, vote, user } = JSON.parse(body);
    
    // Award credits for voting
    const creditsEarned = this.creditSystem.earning_rates.voting_decision;
    const currentCredits = this.stripeCredits.get(user) || 0;
    this.stripeCredits.set(user, currentCredits + creditsEarned);
    
    console.log(`🗳️ Vote: ${user} voted ${vote} on ${decision}, earned ${creditsEarned} credits`);
    
    this.sendResponse(res, 200, {
      vote_recorded: true,
      decision,
      vote,
      credits_earned: creditsEarned,
      total_credits: this.stripeCredits.get(user)
    });
  }

  async handleStreamWatching(req, res) {
    const body = await this.getRequestBody(req);
    const { platform, user, duration } = JSON.parse(body);
    
    // Award credits for watching
    const creditsEarned = duration * this.creditSystem.earning_rates.watching_stream;
    const currentCredits = this.stripeCredits.get(user) || 0;
    this.stripeCredits.set(user, currentCredits + creditsEarned);
    
    console.log(`📺 Watch: ${user} watched ${platform} for ${duration} minutes, earned ${creditsEarned} credits`);
    
    this.sendResponse(res, 200, {
      watch_recorded: true,
      platform,
      duration,
      credits_earned: creditsEarned,
      total_credits: this.stripeCredits.get(user)
    });
  }

  async handleGaming(res) {
    this.sendResponse(res, 200, {
      achievements: this.gamingSystem.achievements,
      daily_quests: this.gamingSystem.daily_quests,
      leaderboards: this.gamingSystem.leaderboards
    });
  }

  async handleBusinessRequest(req, res) {
    const body = await this.getRequestBody(req);
    const request = JSON.parse(body);
    
    const requestId = crypto.randomUUID();
    this.businessRequests.set(requestId, {
      ...request,
      id: requestId,
      timestamp: new Date().toISOString(),
      status: 'open'
    });
    
    console.log(`💼 Business Request: ${request.company} - ${request.description}`);
    
    this.sendResponse(res, 200, {
      request_id: requestId,
      status: 'submitted',
      estimated_delivery: '24-48 hours',
      live_updates: `http://localhost:${this.port}/api/business/status/${requestId}`
    });
  }

  async connectToStreams() {
    console.log('🔗 Connecting to streaming network...');
    
    // Connect to the streaming network
    try {
      const response = await fetch('http://localhost:6666/api/feed');
      if (response.ok) {
        console.log('✓ Connected to streaming network');
      }
    } catch (error) {
      console.log('⚠️ Streaming network not available yet');
    }
  }

  async getRequestBody(req) {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => resolve(body));
    });
  }

  sendResponse(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }

  // Public API
  getStats() {
    return {
      total_users: this.stripeCredits.size,
      total_credits_in_circulation: Array.from(this.stripeCredits.values()).reduce((a, b) => a + b, 0),
      total_automations: this.automationMarketplace.size,
      total_creator_earnings: Array.from(this.creatorEarnings.values()).reduce((a, b) => a + b, 0),
      active_business_requests: this.businessRequests.size
    };
  }
}

// Start the participation engine
if (require.main === module) {
  const engine = new LiveParticipationEngine();
  
  process.on('SIGTERM', () => {
    console.log('🛑 Shutting down participation engine...');
    process.exit(0);
  });
}

module.exports = LiveParticipationEngine;