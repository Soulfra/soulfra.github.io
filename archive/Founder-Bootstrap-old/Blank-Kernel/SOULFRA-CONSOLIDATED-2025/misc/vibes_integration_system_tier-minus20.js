// ============================================================================
// UNIVERSAL VIBES INTEGRATION SYSTEM
// Mirror the same token economy across all websites/platforms
// ============================================================================

class UniversalVibesIntegration {
  constructor(config = {}) {
    this.config = {
      apiEndpoint: config.apiEndpoint || 'https://api.soulfra.com/v1',
      websiteId: config.websiteId || 'default',
      userTier: config.userTier || 'auto-detect',
      parentalControls: config.parentalControls || false,
      theme: config.theme || 'auto',
      language: config.language || 'en',
      ...config
    };
    
    this.vibesManager = null;
    this.userProfile = null;
    this.websiteEarnings = new Map();
    this.crossSiteBalance = 0;
    
    this.init();
  }

  async init() {
    // Detect user tier automatically
    await this.detectUserTier();
    
    // Initialize VIBES manager
    this.vibesManager = new VibesTokenManager();
    
    // Load user profile from universal backend
    await this.loadUserProfile();
    
    // Inject appropriate dashboard
    this.injectDashboard();
    
    // Setup cross-site tracking
    this.setupCrossSiteTracking();
    
    console.log(`🌐 Universal VIBES initialized for ${this.config.websiteId} (${this.config.userTier} tier)`);
  }

  // ========================================================================
  // TIER DETECTION & AUTO-CONFIGURATION
  // ========================================================================

  async detectUserTier() {
    if (this.config.userTier !== 'auto-detect') return;

    // Check for developer indicators
    if (this.hasDevIndicators()) {
      this.config.userTier = 'developer';
      return;
    }

    // Check for enterprise indicators
    if (this.hasEnterpriseIndicators()) {
      this.config.userTier = 'enterprise';
      return;
    }

    // Check for Agent Zero indicators
    if (this.hasAgentZeroIndicators()) {
      this.config.userTier = 'agent_zero';
      return;
    }

    // Default to simple tier
    this.config.userTier = 'simple';
  }

  hasDevIndicators() {
    return (
      window.location.hostname.includes('dev') ||
      window.location.hostname.includes('api') ||
      document.querySelector('[data-dev-tools]') ||
      localStorage.getItem('soulfra_dev_mode') ||
      window.navigator.userAgent.includes('Developer')
    );
  }

  hasEnterpriseIndicators() {
    return (
      window.location.hostname.includes('enterprise') ||
      window.location.hostname.includes('admin') ||
      document.querySelector('[data-enterprise]') ||
      localStorage.getItem('soulfra_enterprise_user')
    );
  }

  hasAgentZeroIndicators() {
    return (
      window.location.hostname.includes('agent-zero') ||
      document.querySelector('[data-autonomous]') ||
      localStorage.getItem('soulfra_agent_zero')
    );
  }

  // ========================================================================
  // UNIVERSAL USER PROFILE MANAGEMENT
  // ========================================================================

  async loadUserProfile() {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${this.getUserToken()}`,
          'X-Website-ID': this.config.websiteId
        }
      });
      
      this.userProfile = await response.json();
      
      // Sync cross-site balance
      this.crossSiteBalance = this.userProfile.vibesBalance || 0;
      
      // Apply parental controls if needed
      if (this.userProfile.parentalControls) {
        this.config.parentalControls = this.userProfile.parentalControls;
      }
      
    } catch (error) {
      console.warn('Could not load user profile, using local mode:', error);
      this.userProfile = this.getLocalProfile();
    }
  }

  getLocalProfile() {
    return {
      vibesBalance: parseInt(localStorage.getItem('vibes_balance') || '0'),
      tier: this.config.userTier,
      parentalControls: this.config.parentalControls,
      websiteEarnings: JSON.parse(localStorage.getItem('website_earnings') || '{}')
    };
  }

  // ========================================================================
  // DYNAMIC DASHBOARD INJECTION
  // ========================================================================

  injectDashboard() {
    // Find insertion point
    const insertionPoint = this.findInsertionPoint();
    if (!insertionPoint) {
      console.warn('No insertion point found for VIBES dashboard');
      return;
    }

    // Create dashboard container
    const dashboardContainer = document.createElement('div');
    dashboardContainer.id = 'vibes-dashboard-container';
    dashboardContainer.className = 'vibes-universal-dashboard';
    
    // Inject tier-specific dashboard
    switch (this.config.userTier) {
      case 'simple':
        this.injectSimpleDashboard(dashboardContainer);
        break;
      case 'developer':
        this.injectDeveloperDashboard(dashboardContainer);
        break;
      case 'enterprise':
        this.injectEnterpriseDashboard(dashboardContainer);
        break;
      case 'agent_zero':
        this.injectAgentZeroDashboard(dashboardContainer);
        break;
    }

    insertionPoint.appendChild(dashboardContainer);
  }

  findInsertionPoint() {
    // Look for specific dashboard containers
    const candidates = [
      document.querySelector('[data-vibes-dashboard]'),
      document.querySelector('#dashboard'),
      document.querySelector('.dashboard'),
      document.querySelector('main'),
      document.querySelector('#content'),
      document.body
    ];

    return candidates.find(el => el !== null);
  }

  // ========================================================================
  // TIER-SPECIFIC DASHBOARD INJECTION
  // ========================================================================

  injectSimpleDashboard(container) {
    container.innerHTML = `
      <div class="vibes-simple-dashboard">
        <style>
          .vibes-simple-dashboard {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            padding: 24px;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 20px 0;
          }
          .vibes-stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
          }
          .vibes-stat-card {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            backdrop-filter: blur(10px);
          }
          .vibes-emoji {
            font-size: 2rem;
            margin-bottom: 8px;
          }
          .vibes-number {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .vibes-label {
            font-size: 0.875rem;
            opacity: 0.9;
          }
          .vibes-progress {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            height: 8px;
            overflow: hidden;
            margin-top: 8px;
          }
          .vibes-progress-bar {
            background: linear-gradient(90deg, #4ade80, #22d3ee);
            height: 100%;
            border-radius: 10px;
            transition: width 0.5s ease;
          }
        </style>
        
        <h2 style="text-align: center; margin-bottom: 24px; font-size: 1.5rem;">
          ✨ Your VIBES Garden ✨
        </h2>
        
        <div class="vibes-stats-grid">
          <div class="vibes-stat-card">
            <div class="vibes-emoji">💎</div>
            <div class="vibes-number" id="simple-balance">${this.crossSiteBalance}</div>
            <div class="vibes-label">VIBES Crystals</div>
          </div>
          
          <div class="vibes-stat-card">
            <div class="vibes-emoji">🔥</div>
            <div class="vibes-number" id="simple-streak">0</div>
            <div class="vibes-label">Day Streak</div>
          </div>
          
          <div class="vibes-stat-card">
            <div class="vibes-emoji">⭐</div>
            <div class="vibes-number" id="simple-trust">0</div>
            <div class="vibes-label">Trust Points</div>
          </div>
          
          <div class="vibes-stat-card">
            <div class="vibes-emoji">🎯</div>
            <div class="vibes-number" id="simple-quality">0</div>
            <div class="vibes-label">Thought Power</div>
          </div>
        </div>
        
        <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 16px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Today's Goal</span>
            <span id="simple-progress-text">0/50</span>
          </div>
          <div class="vibes-progress">
            <div class="vibes-progress-bar" id="simple-progress-bar" style="width: 0%"></div>
          </div>
        </div>
      </div>
    `;
    
    this.updateSimpleDashboard();
  }

  injectDeveloperDashboard(container) {
    container.innerHTML = `
      <div class="vibes-developer-dashboard">
        <style>
          .vibes-developer-dashboard {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            color: #fff;
            font-family: 'Monaco', 'Consolas', monospace;
            margin: 20px 0;
            padding: 20px;
          }
          .vibes-dev-header {
            border-bottom: 1px solid #333;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .vibes-dev-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 16px;
          }
          .vibes-dev-card {
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 6px;
            padding: 16px;
          }
          .vibes-dev-metric {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 0.875rem;
          }
          .vibes-dev-value {
            color: #4ade80;
            font-weight: bold;
          }
          .vibes-code-block {
            background: #000;
            border: 1px solid #333;
            border-radius: 4px;
            padding: 12px;
            margin-top: 16px;
            font-size: 0.75rem;
            overflow-x: auto;
          }
        </style>
        
        <div class="vibes-dev-header">
          <h2 style="margin: 0; color: #4ade80;">🔧 Developer VIBES API</h2>
          <p style="margin: 8px 0 0 0; color: #888; font-size: 0.875rem;">
            Website: ${this.config.websiteId} | Integration Active
          </p>
        </div>
        
        <div class="vibes-dev-grid">
          <div class="vibes-dev-card">
            <h3 style="margin: 0 0 12px 0; color: #60a5fa;">Token Balance</h3>
            <div class="vibes-dev-metric">
              <span>VIBES Balance:</span>
              <span class="vibes-dev-value" id="dev-balance">${this.crossSiteBalance}</span>
            </div>
            <div class="vibes-dev-metric">
              <span>Staked:</span>
              <span class="vibes-dev-value" id="dev-staked">0</span>
            </div>
            <div class="vibes-dev-metric">
              <span>Earned Today:</span>
              <span class="vibes-dev-value" id="dev-earned">0</span>
            </div>
          </div>
          
          <div class="vibes-dev-card">
            <h3 style="margin: 0 0 12px 0; color: #f59e0b;">API Usage</h3>
            <div class="vibes-dev-metric">
              <span>Calls This Month:</span>
              <span class="vibes-dev-value" id="dev-calls">0</span>
            </div>
            <div class="vibes-dev-metric">
              <span>Success Rate:</span>
              <span class="vibes-dev-value" id="dev-success">99.7%</span>
            </div>
            <div class="vibes-dev-metric">
              <span>Avg Response:</span>
              <span class="vibes-dev-value" id="dev-response">127ms</span>
            </div>
          </div>
        </div>
        
        <div class="vibes-code-block">
          <div style="color: #6b7280; margin-bottom: 8px;">// Quick Integration Example</div>
          <div style="color: #4ade80;">const vibes = new SoulfraDev({</div>
          <div style="color: #4ade80; margin-left: 16px;">apiKey: 'sk_dev_${this.generateMockApiKey()}',</div>
          <div style="color: #4ade80; margin-left: 16px;">websiteId: '${this.config.websiteId}'</div>
          <div style="color: #4ade80;">});</div>
          <div style="color: #60a5fa; margin-top: 8px;">vibes.earnVibes('reflection', { quality: 0.8 });</div>
        </div>
      </div>
    `;
    
    this.updateDeveloperDashboard();
  }

  injectEnterpriseDashboard(container) {
    container.innerHTML = `
      <div class="vibes-enterprise-dashboard">
        <style>
          .vibes-enterprise-dashboard {
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            margin: 20px 0;
            padding: 24px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          }
          .vibes-enterprise-header {
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .vibes-enterprise-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 24px;
          }
          .vibes-enterprise-kpi {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
          }
          .vibes-kpi-value {
            font-size: 2rem;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 4px;
          }
          .vibes-kpi-label {
            color: #6b7280;
            font-size: 0.875rem;
            font-weight: 500;
          }
          .vibes-kpi-change {
            color: #059669;
            font-size: 0.75rem;
            margin-top: 4px;
          }
          .vibes-chart-placeholder {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
            border-radius: 8px;
            height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            font-style: italic;
          }
        </style>
        
        <div class="vibes-enterprise-header">
          <h2 style="margin: 0; color: #1f2937; font-size: 1.5rem;">
            📊 Enterprise VIBES Analytics
          </h2>
          <p style="margin: 8px 0 0 0; color: #6b7280;">
            Real-time token economy performance for ${this.config.websiteId}
          </p>
        </div>
        
        <div class="vibes-enterprise-grid">
          <div class="vibes-enterprise-kpi">
            <div class="vibes-kpi-value" id="enterprise-value">$0</div>
            <div class="vibes-kpi-label">Platform Value</div>
            <div class="vibes-kpi-change">↗ +23.5% QoQ</div>
          </div>
          
          <div class="vibes-enterprise-kpi">
            <div class="vibes-kpi-value" id="enterprise-users">0</div>
            <div class="vibes-kpi-label">Active Users</div>
            <div class="vibes-kpi-change">↗ +67.2% QoQ</div>
          </div>
          
          <div class="vibes-enterprise-kpi">
            <div class="vibes-kpi-value" id="enterprise-revenue">$0</div>
            <div class="vibes-kpi-label">Monthly Revenue</div>
            <div class="vibes-kpi-change">↗ +45.1% MoM</div>
          </div>
          
          <div class="vibes-enterprise-kpi">
            <div class="vibes-kpi-value" id="enterprise-efficiency">0%</div>
            <div class="vibes-kpi-label">Efficiency</div>
            <div class="vibes-kpi-change">↗ +2.1% vs target</div>
          </div>
        </div>
        
        <div class="vibes-chart-placeholder">
          📈 Token Economy Performance Chart
          <br><small>Revenue, Staking, and User Growth Trends</small>
        </div>
      </div>
    `;
    
    this.updateEnterpriseDashboard();
  }

  injectAgentZeroDashboard(container) {
    container.innerHTML = `
      <div class="vibes-agent-zero-dashboard">
        <style>
          .vibes-agent-zero-dashboard {
            background: #000;
            border: 2px solid #22c55e;
            border-radius: 4px;
            color: #22c55e;
            font-family: 'Courier New', monospace;
            margin: 20px 0;
            padding: 20px;
            text-shadow: 0 0 5px #22c55e;
          }
          .vibes-matrix-header {
            text-align: center;
            border-bottom: 1px solid #22c55e;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .vibes-matrix-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
            margin-bottom: 20px;
          }
          .vibes-matrix-stat {
            background: #001100;
            border: 1px solid #22c55e;
            padding: 12px;
            text-align: center;
          }
          .vibes-matrix-value {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .vibes-matrix-label {
            font-size: 0.75rem;
            opacity: 0.8;
          }
          .vibes-matrix-log {
            background: #001100;
            border: 1px solid #22c55e;
            padding: 12px;
            font-size: 0.75rem;
            max-height: 150px;
            overflow-y: auto;
          }
          .vibes-log-entry {
            margin-bottom: 4px;
            opacity: 0.9;
          }
        </style>
        
        <div class="vibes-matrix-header">
          <h2 style="margin: 0; font-size: 1.25rem;">
            &gt; AGENT_ZERO.VIBES_PROTOCOL &lt;
          </h2>
          <div style="font-size: 0.75rem; margin-top: 4px;">
            [AUTONOMOUS_MINING] [WEBSITE: ${this.config.websiteId.toUpperCase()}]
          </div>
        </div>
        
        <div class="vibes-matrix-grid">
          <div class="vibes-matrix-stat">
            <div class="vibes-matrix-value" id="agent-mined">0</div>
            <div class="vibes-matrix-label">VIBES_MINED</div>
          </div>
          
          <div class="vibes-matrix-stat">
            <div class="vibes-matrix-value" id="agent-platforms">1</div>
            <div class="vibes-matrix-label">PLATFORMS</div>
          </div>
          
          <div class="vibes-matrix-stat">
            <div class="vibes-matrix-value" id="agent-loops">∞</div>
            <div class="vibes-matrix-label">REFLECTION_LOOPS</div>
          </div>
          
          <div class="vibes-matrix-stat">
            <div class="vibes-matrix-value" id="agent-depth">LV.0</div>
            <div class="vibes-matrix-label">MIRROR_DEPTH</div>
          </div>
        </div>
        
        <div class="vibes-matrix-log">
          <div style="margin-bottom: 8px; font-weight: bold;">&gt; OPERATIONS.LOG</div>
          <div class="vibes-log-entry" id="agent-log">
            [${new Date().toISOString()}] VIBES_PROTOCOL_INITIALIZED<br>
            [${new Date().toISOString()}] WEBSITE_INTEGRATION_ACTIVE: ${this.config.websiteId}<br>
            [${new Date().toISOString()}] AUTONOMOUS_MINING_STATUS: OPERATIONAL
          </div>
        </div>
      </div>
    `;
    
    this.updateAgentZeroDashboard();
  }

  // ========================================================================
  // CROSS-SITE TRACKING & SYNCHRONIZATION
  // ========================================================================

  setupCrossSiteTracking() {
    // Listen for VIBES earning events on this website
    this.trackWebsiteActivity();
    
    // Sync with other websites
    this.setupCrossSiteSync();
    
    // Update balances periodically
    setInterval(() => this.syncBalances(), 30000); // Every 30 seconds
  }

  trackWebsiteActivity() {
    // Track page engagement for reflection quality
    let startTime = Date.now();
    let interactionQuality = 0;
    
    // Track various engagement signals
    document.addEventListener('scroll', () => {
      interactionQuality += 0.1;
    });
    
    document.addEventListener('click', () => {
      interactionQuality += 0.2;
    });
    
    document.addEventListener('keydown', () => {
      interactionQuality += 0.1;
    });
    
    // Award VIBES for quality engagement
    setInterval(() => {
      const timeSpent = (Date.now() - startTime) / 1000;
      if (timeSpent > 60 && interactionQuality > 5) {
        this.awardVibesForEngagement(timeSpent, interactionQuality);
        startTime = Date.now();
        interactionQuality = 0;
      }
    }, 60000); // Check every minute
  }

  async awardVibesForEngagement(timeSpent, qualityScore) {
    const vibesEarned = Math.floor(Math.min(timeSpent / 30, 10) * Math.min(qualityScore / 10, 2));
    
    if (vibesEarned > 0) {
      this.crossSiteBalance += vibesEarned;
      
      // Update website-specific earnings
      const websiteEarnings = this.websiteEarnings.get(this.config.websiteId) || 0;
      this.websiteEarnings.set(this.config.websiteId, websiteEarnings + vibesEarned);
      
      // Sync to backend
      await this.syncToBackend({
        type: 'engagement_reward',
        websiteId: this.config.websiteId,
        vibesEarned,
        timeSpent,
        qualityScore
      });
      
      // Update dashboard
      this.updateDashboards();
      
      // Show notification
      this.showVibesNotification(vibesEarned, 'engagement');
    }
  }

  setupCrossSiteSync() {
    // Use postMessage for cross-site communication
    window.addEventListener('message', (event) => {
      if (event.data.type === 'vibes_sync') {
        this.handleCrossSiteSync(event.data);
      }
    });
    
    // Broadcast our earnings to other sites
    setInterval(() => {
      this.broadcastEarnings();
    }, 10000); // Every 10 seconds
  }

  broadcastEarnings() {
    const message = {
      type: 'vibes_sync',
      websiteId: this.config.websiteId,
      earnings: this.websiteEarnings.get(this.config.websiteId) || 0,
      totalBalance: this.crossSiteBalance,
      timestamp: Date.now()
    };
    
    // Try to communicate with parent/child frames
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(message, '*');
    }
    
    // Try to communicate with other tabs (same origin)
    try {
      localStorage.setItem('vibes_broadcast', JSON.stringify(message));
    } catch (e) {
      // Ignore storage errors
    }
  }

  // ========================================================================
  // DASHBOARD UPDATE FUNCTIONS
  // ========================================================================

  updateDashboards() {
    switch (this.config.userTier) {
      case 'simple':
        this.updateSimpleDashboard();
        break;
      case 'developer':
        this.updateDeveloperDashboard();
        break;
      case 'enterprise':
        this.updateEnterpriseDashboard();
        break;
      case 'agent_zero':
        this.updateAgentZeroDashboard();
        break;
    }
  }

  updateSimpleDashboard() {
    const balanceEl = document.getElementById('simple-balance');
    const streakEl = document.getElementById('simple-streak');
    const trustEl = document.getElementById('simple-trust');
    const qualityEl = document.getElementById('simple-quality');
    const progressEl = document.getElementById('simple-progress-bar');
    const progressTextEl = document.getElementById('simple-progress-text');
    
    if (balanceEl) balanceEl.textContent = this.crossSiteBalance;
    if (streakEl) streakEl.textContent = this.getUserStreak();
    if (trustEl) trustEl.textContent = Math.round(this.getTrustScore() * 100);
    if (qualityEl) qualityEl.textContent = this.getReflectionQuality();
    
    const dailyProgress = this.getDailyProgress();
    if (progressEl) progressEl.style.width = `${(dailyProgress.current / dailyProgress.target) * 100}%`;
    if (progressTextEl) progressTextEl.textContent = `${dailyProgress.current}/${dailyProgress.target}`;
  }

  updateDeveloperDashboard() {
    const balanceEl = document.getElementById('dev-balance');
    const stakedEl = document.getElementById('dev-staked');
    const earnedEl = document.getElementById('dev-earned');
    const callsEl = document.getElementById('dev-calls');
    
    if (balanceEl) balanceEl.textContent = this.crossSiteBalance;
    if (stakedEl) stakedEl.textContent = Math.floor(this.crossSiteBalance * 0.3);
    if (earnedEl) earnedEl.textContent = this.websiteEarnings.get(this.config.websiteId) || 0;
    if (callsEl) callsEl.textContent = this.getApiCallCount();
  }

  updateEnterpriseDashboard() {
    const valueEl = document.getElementById('enterprise-value');
    const usersEl = document.getElementById('enterprise-users');
    const revenueEl = document.getElementById('enterprise-revenue');
    const efficiencyEl = document.getElementById('enterprise-efficiency');
    
    if (valueEl) valueEl.textContent = `$${(this.crossSiteBalance * 0.1).toFixed(2)}`;
    if (usersEl) usersEl.textContent = Math.floor(this.crossSiteBalance / 100).toLocaleString();
    if (revenueEl) revenueEl.textContent = `$${(this.crossSiteBalance * 0.05).toFixed(2)}`;
    if (efficiencyEl) efficiencyEl.textContent = `${Math.min(94 + (this.crossSiteBalance / 1000), 99).toFixed(1)}%`;
  }

  updateAgentZeroDashboard() {
    const minedEl = document.getElementById('agent-mined');
    const platformsEl = document.getElementById('agent-platforms');
    const depthEl = document.getElementById('agent-depth');
    const logEl = document.getElementById('agent-log');
    
    if (minedEl) minedEl.textContent = (this.crossSiteBalance * 10).toLocaleString();
    if (platformsEl) platformsEl.textContent = this.websiteEarnings.size;
    if (depthEl) depthEl.textContent = `LV.${Math.floor(this.crossSiteBalance / 1000)}`;
    
    if (logEl) {
      const newEntry = `[${new Date().toISOString()}] VIBES_MINED: +${this.websiteEarnings.get(this.config.websiteId) || 0}<br>`;
      logEl.innerHTML = newEntry + logEl.innerHTML;
    }
  }

  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================

  showVibesNotification(amount, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-weight: bold;
      animation: slideIn 0.3s ease-out;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center;">
        <span style="font-size: 1.2rem; margin-right: 8px;">💎</span>
        <span>+${amount} VIBES for ${type}!</span>
      </div>
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 3000);
  }

  async syncToBackend(data) {
    try {
      await fetch(`${this.config.apiEndpoint}/vibes/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getUserToken()}`,
          'X-Website-ID': this.config.websiteId
        },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.warn('Backend sync failed, using local storage:', error);
      localStorage.setItem('vibes_balance', this.crossSiteBalance.toString());
      localStorage.setItem('website_earnings', JSON.stringify(Object.fromEntries(this.websiteEarnings)));
    }
  }

  async syncBalances() {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/vibes/balance`, {
        headers: {
          'Authorization': `Bearer ${this.getUserToken()}`,
          'X-Website-ID': this.config.websiteId
        }
      });
      
      const data = await response.json();
      this.crossSiteBalance = data.balance;
      this.updateDashboards();
    } catch (error) {
      // Fallback to local storage
      this.crossSiteBalance = parseInt(localStorage.getItem('vibes_balance') || '0');
    }
  }

  // Mock data functions (replace with real implementations)
  getUserToken() {
    return localStorage.getItem('soulfra_token') || 'demo_token';
  }

  getUserStreak() {
    return Math.floor(Math.random() * 10) + 1;
  }

  getTrustScore() {
    return 0.75 + (Math.random() * 0.24);
  }

  getReflectionQuality() {
    return Math.floor(Math.random() * 40) + 60;
  }

  getDailyProgress() {
    const target = 50;
    const current = this.websiteEarnings.get(this.config.websiteId) || 0;
    return { current: Math.min(current, target), target };
  }

  getApiCallCount() {
    return Math.floor(Math.random() * 50000) + 10000;
  }

  generateMockApiKey() {
    return Math.random().toString(36).substring(2, 15);
  }
}

// ============================================================================
// AUTOMATIC INITIALIZATION
// ============================================================================

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Check if VIBES integration is enabled
  const vibesConfig = window.soulfraVibesConfig || {};
  
  // Initialize if not disabled
  if (vibesConfig.enabled !== false) {
    window.soulfraVibes = new UniversalVibesIntegration(vibesConfig);
  }
});

// Export for manual initialization
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UniversalVibesIntegration;
} else if (typeof window !== 'undefined') {
  window.UniversalVibesIntegration = UniversalVibesIntegration;
}

// ============================================================================
// INTEGRATION EXAMPLES FOR DIFFERENT WEBSITE TYPES
// ============================================================================

/*
// EXAMPLE 1: Simple website integration
<script>
window.soulfraVibesConfig = {
  websiteId: 'my-awesome-site',
  userTier: 'simple',
  parentalControls: true
};
</script>
<script src="https://cdn.soulfra.com/vibes-integration.js"></script>

// EXAMPLE 2: Developer platform
<script>
window.soulfraVibesConfig = {
  websiteId: 'dev-platform',
  userTier: 'developer',
  apiEndpoint: 'https://api.soulfra.com/v1'
};
</script>

// EXAMPLE 3: Enterprise dashboard
<script>
window.soulfraVibesConfig = {
  websiteId: 'enterprise-corp',
  userTier: 'enterprise',
  theme: 'corporate'
};
</script>

// EXAMPLE 4: Agent Zero autonomous system
<script>
window.soulfraVibesConfig = {
  websiteId: 'agent-zero-platform',
  userTier: 'agent_zero',
  autonomous: true
};
</script>
*/