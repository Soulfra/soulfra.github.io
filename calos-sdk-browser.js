/**
 * CALOS Platform Browser SDK
 * Connects static GitHub Pages to the CALOS backend
 *
 * Usage:
 *   <script src="https://soulfra.github.io/calos-sdk-browser.js"></script>
 *   <script>
 *     const calos = new CalOSPlatform({
 *       baseURL: 'http://localhost:5001',
 *       apiKey: 'YOUR_API_KEY_HERE' // Optional
 *     });
 *
 *     // Submit portfolio
 *     await calos.portfolio.submit({
 *       userName: 'John Doe',
 *       userEmail: 'john@example.com',
 *       githubRepos: [
 *         { url: 'https://github.com/user/repo', description: 'My project' }
 *       ],
 *       liveDemo: 'https://demo.example.com',
 *       description: 'My portfolio work',
 *       tags: ['javascript', 'react']
 *     });
 *   </script>
 */

(function(window) {
  'use strict';

  class CalOSPlatform {
    constructor(options = {}) {
      this.baseURL = options.baseURL || 'https://api.calos.dev';
      this.apiKey = options.apiKey || null;
      this.userId = options.userId || null;
      this.privacyMode = options.privacyMode || 'standard'; // 'strict', 'standard', 'minimal'

      // Initialize sub-modules
      this.portfolio = new PortfolioModule(this);
      this.user = new UserModule(this);
      this.chat = new ChatModule(this);
      this.dashboard = new DashboardModule(this);
    }

    // Make HTTP request
    async request(endpoint, options = {}) {
      const url = `${this.baseURL}${endpoint}`;

      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      // Add API key if available
      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey;
      }

      // Add user ID if available
      if (this.userId) {
        headers['X-User-ID'] = this.userId;
      }

      const config = {
        method: options.method || 'GET',
        headers,
        ...options
      };

      if (options.body) {
        config.body = JSON.stringify(options.body);
      }

      try {
        const response = await fetch(url, config);

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: response.statusText }));
          throw new Error(error.error || error.message || 'Request failed');
        }

        return await response.json();
      } catch (error) {
        console.error(`[CalOS SDK] Request failed: ${endpoint}`, error);
        throw error;
      }
    }
  }

  // ============================================================================
  // Portfolio Module
  // ============================================================================

  class PortfolioModule {
    constructor(sdk) {
      this.sdk = sdk;
    }

    async submit(data) {
      return await this.sdk.request('/api/portfolio/submit', {
        method: 'POST',
        body: {
          userId: this.sdk.userId,
          userName: data.userName,
          userEmail: data.userEmail,
          githubRepos: data.githubRepos || [],
          liveDemo: data.liveDemo || null,
          caseStudy: data.caseStudy || null,
          description: data.description || '',
          tags: data.tags || []
        }
      });
    }

    async getSubmissions() {
      const userId = this.sdk.userId || 'anonymous';
      return await this.sdk.request(`/api/portfolio/submissions?userId=${userId}`);
    }

    async getSubmission(id) {
      return await this.sdk.request(`/api/portfolio/submissions/${id}`);
    }

    async getStats() {
      return await this.sdk.request('/api/portfolio/stats');
    }
  }

  // ============================================================================
  // User Module
  // ============================================================================

  class UserModule {
    constructor(sdk) {
      this.sdk = sdk;
    }

    async getStats(userId) {
      const uid = userId || this.sdk.userId;
      if (!uid) {
        throw new Error('User ID is required');
      }

      return await this.sdk.request(`/api/user/${uid}/stats`);
    }

    async getProfile(userId) {
      const uid = userId || this.sdk.userId;
      if (!uid) {
        throw new Error('User ID is required');
      }

      return await this.sdk.request(`/api/user/${uid}/profile`);
    }
  }

  // ============================================================================
  // Chat Module
  // ============================================================================

  class ChatModule {
    constructor(sdk) {
      this.sdk = sdk;
    }

    async send(message, options = {}) {
      return await this.sdk.request('/api/chat/send', {
        method: 'POST',
        body: {
          userId: this.sdk.userId || 'anonymous',
          content: message,
          brandKey: options.brandKey || null,
          ...options
        }
      });
    }

    async getHistory(options = {}) {
      const userId = this.sdk.userId || 'anonymous';
      const params = new URLSearchParams({
        userId,
        limit: options.limit || 50,
        ...options
      });

      return await this.sdk.request(`/api/chat/history?${params}`);
    }
  }

  // ============================================================================
  // Dashboard Module
  // ============================================================================

  class DashboardModule {
    constructor(sdk) {
      this.sdk = sdk;
    }

    async getData() {
      const userId = this.sdk.userId || 'anonymous';

      const [userStats, portfolioStats] = await Promise.all([
        this.sdk.user.getStats(userId).catch(() => ({
          apiCalls: 0,
          emailsSent: 0,
          storage: { used: 0, total: 1024 }
        })),
        this.sdk.portfolio.getStats().catch(() => ({
          totalSubmissions: 0,
          pendingSubmissions: 0
        }))
      ]);

      return {
        apiCalls: userStats.apiCalls || 0,
        emailsSent: userStats.emailsSent || 0,
        storage: userStats.storage || { used: 0, total: 1024 },
        portfolioSubmissions: portfolioStats.totalSubmissions || 0,
        pendingReviews: portfolioStats.pendingSubmissions || 0,
        lastUpdated: new Date().toISOString()
      };
    }

    async getActivityFeed(options = {}) {
      const userId = this.sdk.userId || 'anonymous';
      const params = new URLSearchParams({
        userId,
        limit: options.limit || 20,
        ...options
      });

      return await this.sdk.request(`/api/activity/feed?${params}`);
    }
  }

  // Auto-init when DOM is ready
  function initFromDOM() {
    const initElement = document.getElementById('calos-init');
    if (!initElement) return null;

    const options = {
      baseURL: initElement.dataset.baseUrl || 'http://localhost:5001',
      apiKey: initElement.dataset.apiKey || null,
      userId: initElement.dataset.userId || null,
      privacyMode: initElement.dataset.privacyMode || 'standard'
    };

    return new CalOSPlatform(options);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const sdk = initFromDOM();
      if (sdk) {
        window.calos = sdk;
        console.log('[CalOS SDK] Auto-initialized from DOM');
      }
    });
  } else {
    const sdk = initFromDOM();
    if (sdk) {
      window.calos = sdk;
      console.log('[CalOS SDK] Auto-initialized from DOM');
    }
  }

  window.CalOSPlatform = CalOSPlatform;

})(window);
