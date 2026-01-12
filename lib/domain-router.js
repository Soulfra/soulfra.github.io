/**
 * Domain Router - ZK/CCNA Style Cross-Domain Navigation
 *
 * Intelligent routing between Soulfra ecosystem domains:
 * - soulfra.com (infrastructure hub)
 * - cringeproof.com (onboarding, ideas)
 * - calriven.com (business tools)
 * - deathtodata.com (manifesto)
 *
 * Features:
 * - Context-aware routing based on knowledge graph
 * - Session state preservation across domains
 * - Smart navigation hints
 * - Routing analytics and debugging
 *
 * Inspired by:
 * - ZK (Zettelkasten): Concept-based linking
 * - CCNA: Routing protocols and path optimization
 *
 * Usage:
 *   await DomainRouter.init();
 *   DomainRouter.route('authentication'); // Suggests best domain
 *   DomainRouter.navigate('/cringeproof/ideas.html', { preserve: true });
 */

class DomainRouterEngine {
  constructor() {
    this.currentDomain = this.detectDomain();
    this.currentPath = window.location.pathname;
    this.routingTable = this.buildRoutingTable();
    this.sessionKey = 'soulfra_routing_session';
    this.analyticsKey = 'soulfra_routing_analytics';
    console.log('[DomainRouter] Engine initialized');
    console.log(`[DomainRouter] Current: ${this.currentDomain}${this.currentPath}`);
  }

  /**
   * Detect current domain context
   */
  detectDomain() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    // Production domains
    if (hostname === 'cringeproof.com' || pathname.startsWith('/cringeproof/')) {
      return 'cringeproof';
    }
    if (hostname === 'calriven.com' || pathname.startsWith('/cal/')) {
      return 'calriven';
    }
    if (hostname === 'deathtodata.com' || pathname.startsWith('/deathtodata/')) {
      return 'deathtodata';
    }

    // Tool-specific paths
    if (pathname.startsWith('/pipelines/')) return 'pipelines';
    if (pathname.startsWith('/voice/')) return 'voice';
    if (pathname.startsWith('/reviews/')) return 'reviews';
    if (pathname.startsWith('/sandbox/')) return 'sandbox';

    // Default to soulfra
    return 'soulfra';
  }

  /**
   * Build routing table (maps concepts/topics to domains)
   */
  buildRoutingTable() {
    return {
      // CringeProof: Onboarding, ideas, creativity
      cringeproof: {
        keywords: ['idea', 'onboard', 'creative', 'story', 'memo', 'tier', 'inbox', 'urgent', 'someday', 'archive', 'compiler', 'narrative'],
        paths: ['/cringeproof/'],
        priority: 0.9,
        description: 'Onboarding and idea compilation'
      },

      // Calriven: Business tools, payments, faucet
      calriven: {
        keywords: ['payment', 'stripe', 'cal', 'dollar', 'faucet', 'business', 'revenue', 'test', 'protocol'],
        paths: ['/cal/'],
        priority: 0.9,
        description: 'Business tools and $1 Cal Faucet'
      },

      // DeathToData: Manifesto, philosophy
      deathtodata: {
        keywords: ['manifesto', 'philosophy', 'data', 'privacy', 'death', 'mission', 'vision'],
        paths: ['/deathtodata/'],
        priority: 0.8,
        description: 'Manifesto and philosophy'
      },

      // Pipelines: Automation, workflows
      pipelines: {
        keywords: ['pipeline', 'automation', 'workflow', 'task', 'run', 'process'],
        paths: ['/pipelines/'],
        priority: 0.7,
        description: 'Pipeline automation system'
      },

      // Voice: Audio memos, recording
      voice: {
        keywords: ['voice', 'audio', 'record', 'microphone', 'speech', 'transcription'],
        paths: ['/voice/'],
        priority: 0.7,
        description: 'Voice memo recording'
      },

      // Reviews: Feedback, assessments
      reviews: {
        keywords: ['review', 'feedback', 'assessment', 'evaluation', 'rating'],
        paths: ['/reviews/'],
        priority: 0.7,
        description: 'Review and feedback system'
      },

      // Sandbox: Testing, debugging
      sandbox: {
        keywords: ['test', 'debug', 'sandbox', 'experiment', 'punch', 'ollama'],
        paths: ['/sandbox/'],
        priority: 0.6,
        description: 'Testing and debugging environment'
      },

      // Soulfra: Infrastructure, navigation
      soulfra: {
        keywords: ['navigation', 'nav', 'home', 'infrastructure', 'core', 'system'],
        paths: ['/nav.html', '/index.html', '/'],
        priority: 0.5,
        description: 'Infrastructure hub and navigation'
      }
    };
  }

  /**
   * Initialize router with knowledge graph
   */
  async init() {
    console.log('[DomainRouter] Initializing...');

    try {
      // Load knowledge graph if not already loaded
      if (!window.KnowledgeGraph.loaded) {
        console.log('[DomainRouter] Loading knowledge graph...');
        await window.KnowledgeGraph.load();
      }

      // Restore session if exists
      this.restoreSession();

      // Log current route
      this.logRoute({
        type: 'page_load',
        domain: this.currentDomain,
        path: this.currentPath,
        timestamp: new Date().toISOString()
      });

      console.log('[DomainRouter] Initialized successfully');
    } catch (error) {
      console.error('[DomainRouter] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Route a query to best domain
   * Returns suggestion without navigating
   */
  route(query, options = {}) {
    const { threshold = 0.5, includeAlternatives = true } = options;

    console.log(`[DomainRouter] Routing query: "${query}"`);

    // Score each domain
    const scores = {};

    Object.entries(this.routingTable).forEach(([domain, config]) => {
      let score = 0;

      // Keyword matching
      const queryLower = query.toLowerCase();
      config.keywords.forEach(keyword => {
        if (queryLower.includes(keyword)) {
          score += 0.3;
        }
      });

      // Multiply by priority
      score *= config.priority;

      scores[domain] = score;
    });

    // Use knowledge graph for enhanced routing
    if (window.KnowledgeGraph.loaded) {
      const hint = window.KnowledgeGraph.getRoutingHint(query);
      if (hint.suggestedDomain && scores[hint.suggestedDomain] !== undefined) {
        scores[hint.suggestedDomain] += hint.confidence * 0.5;
      }
    }

    // Sort by score
    const ranked = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .map(([domain, score]) => ({
        domain,
        score,
        config: this.routingTable[domain],
        above_threshold: score >= threshold
      }));

    const result = {
      query,
      primary: ranked[0],
      alternatives: includeAlternatives ? ranked.slice(1, 4) : [],
      allScores: Object.fromEntries(ranked.map(r => [r.domain, r.score]))
    };

    console.log(`[DomainRouter] Primary suggestion: ${result.primary.domain} (score: ${result.primary.score.toFixed(2)})`);

    return result;
  }

  /**
   * Navigate to a path, preserving session state
   */
  navigate(path, options = {}) {
    const {
      preserve = true,
      newTab = false,
      trackAnalytics = true
    } = options;

    console.log(`[DomainRouter] Navigating to: ${path}`);

    // Save session before navigation
    if (preserve) {
      this.saveSession();
    }

    // Log navigation
    if (trackAnalytics) {
      this.logRoute({
        type: 'navigation',
        from: this.currentPath,
        to: path,
        timestamp: new Date().toISOString()
      });
    }

    // Navigate
    if (newTab) {
      window.open(path, '_blank');
    } else {
      window.location.href = path;
    }
  }

  /**
   * Get smart navigation suggestions for current context
   */
  getSuggestions(options = {}) {
    const { limit = 5 } = options;

    const suggestions = [];

    // Suggest related tools based on current domain
    const currentConfig = this.routingTable[this.currentDomain];

    if (currentConfig) {
      // Suggest complementary tools
      Object.entries(this.routingTable).forEach(([domain, config]) => {
        if (domain !== this.currentDomain) {
          const relevance = this.calculateRelevance(currentConfig, config);
          if (relevance > 0.3) {
            suggestions.push({
              domain,
              path: config.paths[0],
              description: config.description,
              relevance,
              reason: this.explainRelevance(this.currentDomain, domain)
            });
          }
        }
      });
    }

    // Sort by relevance
    suggestions.sort((a, b) => b.relevance - a.relevance);

    return suggestions.slice(0, limit);
  }

  /**
   * Calculate relevance between two domain configs
   */
  calculateRelevance(config1, config2) {
    const sharedKeywords = config1.keywords.filter(k =>
      config2.keywords.includes(k)
    );

    const baseRelevance = sharedKeywords.length / Math.max(config1.keywords.length, config2.keywords.length);
    const priorityBoost = (config1.priority + config2.priority) / 2;

    return baseRelevance * 0.7 + priorityBoost * 0.3;
  }

  /**
   * Explain why two domains are related
   */
  explainRelevance(fromDomain, toDomain) {
    const explanations = {
      'cringeproof->calriven': 'Turn your ideas into paid products',
      'cringeproof->voice': 'Record voice memos as ideas',
      'cringeproof->pipelines': 'Automate your idea workflow',
      'calriven->sandbox': 'Test your business logic',
      'voice->cringeproof': 'Compile voice memos into ideas',
      'pipelines->sandbox': 'Test your automation',
      'sandbox->soulfra': 'Return to navigation hub',
      'default': 'Related tool in the ecosystem'
    };

    const key = `${fromDomain}->${toDomain}`;
    return explanations[key] || explanations.default;
  }

  /**
   * Save session state
   */
  saveSession() {
    const session = {
      lastDomain: this.currentDomain,
      lastPath: this.currentPath,
      timestamp: new Date().toISOString(),
      userContext: {
        sessionId: this.getSessionId(),
        visitCount: this.getVisitCount() + 1
      }
    };

    localStorage.setItem(this.sessionKey, JSON.stringify(session));
    console.log('[DomainRouter] Session saved');
  }

  /**
   * Restore session state
   */
  restoreSession() {
    const sessionData = localStorage.getItem(this.sessionKey);

    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        console.log('[DomainRouter] Session restored:', session);
        return session;
      } catch (error) {
        console.error('[DomainRouter] Failed to restore session:', error);
        return null;
      }
    }

    return null;
  }

  /**
   * Get or create session ID
   */
  getSessionId() {
    let sessionId = localStorage.getItem('soulfra_session_id');

    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('soulfra_session_id', sessionId);
    }

    return sessionId;
  }

  /**
   * Get visit count
   */
  getVisitCount() {
    const count = parseInt(localStorage.getItem('soulfra_visit_count') || '0');
    return count;
  }

  /**
   * Log routing event
   */
  logRoute(event) {
    const analyticsData = localStorage.getItem(this.analyticsKey);
    let analytics = analyticsData ? JSON.parse(analyticsData) : { events: [] };

    analytics.events.push(event);

    // Keep only last 100 events
    if (analytics.events.length > 100) {
      analytics.events = analytics.events.slice(-100);
    }

    localStorage.setItem(this.analyticsKey, JSON.stringify(analytics));
  }

  /**
   * Get routing analytics
   */
  getAnalytics() {
    const analyticsData = localStorage.getItem(this.analyticsKey);
    if (!analyticsData) return { events: [] };

    try {
      const analytics = JSON.parse(analyticsData);

      // Calculate statistics
      const stats = {
        totalEvents: analytics.events.length,
        byType: {},
        byDomain: {},
        recentEvents: analytics.events.slice(-10)
      };

      analytics.events.forEach(event => {
        // Count by type
        stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;

        // Count by domain
        if (event.domain) {
          stats.byDomain[event.domain] = (stats.byDomain[event.domain] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('[DomainRouter] Failed to parse analytics:', error);
      return { events: [] };
    }
  }

  /**
   * Get breadcrumb trail
   */
  getBreadcrumbs() {
    const breadcrumbs = [
      { label: 'Home', path: '/', domain: 'soulfra' }
    ];

    const pathParts = this.currentPath.split('/').filter(p => p);

    let currentPath = '';
    pathParts.forEach((part, index) => {
      currentPath += `/${part}`;

      // Determine domain from path
      const domain = this.detectDomain();

      breadcrumbs.push({
        label: this.formatBreadcrumbLabel(part),
        path: currentPath,
        domain: domain,
        isCurrent: index === pathParts.length - 1
      });
    });

    return breadcrumbs;
  }

  /**
   * Format breadcrumb label
   */
  formatBreadcrumbLabel(pathPart) {
    return pathPart
      .replace(/[-_]/g, ' ')
      .replace(/\.html?$/, '')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get current route info
   */
  getCurrentRoute() {
    return {
      domain: this.currentDomain,
      path: this.currentPath,
      config: this.routingTable[this.currentDomain],
      breadcrumbs: this.getBreadcrumbs(),
      suggestions: this.getSuggestions({ limit: 3 })
    };
  }
}

// Export singleton instance
window.DomainRouter = new DomainRouterEngine();

console.log('[DomainRouter] Module loaded. Call DomainRouter.init() to initialize.');
