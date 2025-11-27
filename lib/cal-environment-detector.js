/**
 * Cal Environment Detector
 *
 * Solves the confusion: "how can we make sure its local versus deployed
 * or versus our brand versions or whatnot?"
 *
 * Cal now knows EXACTLY where he is and which brand he's serving.
 *
 * Detects:
 * - Environment: local, production, github-pages
 * - Brand: soulfra, calriven, deathtodata, etc.
 * - API Base URL: Correct URL for current environment
 * - Config: Auto-loads brand-specific settings
 *
 * Usage (Server-side):
 *   const CalEnv = require('./lib/cal-environment-detector');
 *   const env = new CalEnv();
 *
 *   console.log(env.getEnvironment());  // 'local' | 'production' | 'github-pages'
 *   console.log(env.getBrand());        // 'soulfra' | 'calriven' | etc.
 *   console.log(env.getApiBaseUrl());   // 'http://localhost:5001' | 'https://soulfra.com'
 *
 *   const config = await env.getBrandConfig();
 *   console.log(config.llm.temperature);  // 0.5 (soulfra) or 0.7 (calriven)
 *
 * Usage (Client-side):
 *   <script src="/lib/cal-environment-detector.js"></script>
 *   <script>
 *     const env = new CalEnvironmentDetector({ clientSide: true });
 *     console.log(env.getEnvironment());  // 'local'
 *     console.log(env.getBrand());        // 'soulfra'
 *     console.log(env.getApiBaseUrl());   // 'http://localhost:5001'
 *   </script>
 *
 * Works cross-platform (Windows, Mac, Linux) and cross-environment (Node + Browser).
 */

// Support both Node.js and browser
const isNode = typeof module !== 'undefined' && module.exports;
const fs = isNode ? require('fs').promises : null;
const path = isNode ? require('path') : null;

class CalEnvironmentDetector {
  constructor(options = {}) {
    this.options = options;
    this.clientSide = options.clientSide || !isNode;

    // Cache
    this._environment = null;
    this._brand = null;
    this._brandConfig = null;
    this._apiBaseUrl = null;

    // Detect immediately
    this._detect();
  }

  /**
   * Internal detection logic
   * Runs on construction
   */
  _detect() {
    const hostname = this._getHostname();
    const port = this._getPort();

    // Environment detection
    if (this._isLocalhost(hostname)) {
      this._environment = 'local';
    } else if (this._isGitHubPages(hostname)) {
      this._environment = 'github-pages';
    } else {
      this._environment = 'production';
    }

    // Brand detection (based on domain mapping)
    this._brand = this._detectBrand(hostname);

    // API base URL
    this._apiBaseUrl = this._detectApiBaseUrl(hostname, port);
  }

  /**
   * Get hostname (works in Node.js and browser)
   */
  _getHostname() {
    if (this.clientSide) {
      // Browser
      return window.location.hostname;
    } else {
      // Node.js - check env vars or default to localhost
      return process.env.HOSTNAME ||
             process.env.HOST ||
             process.env.DOMAIN ||
             'localhost';
    }
  }

  /**
   * Get port (works in Node.js and browser)
   */
  _getPort() {
    if (this.clientSide) {
      // Browser
      return window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
    } else {
      // Node.js
      return process.env.PORT || '5001';
    }
  }

  /**
   * Check if hostname is localhost
   */
  _isLocalhost(hostname) {
    return hostname === 'localhost' ||
           hostname === '127.0.0.1' ||
           hostname === '0.0.0.0' ||
           hostname.startsWith('localhost:');
  }

  /**
   * Check if hostname is GitHub Pages
   */
  _isGitHubPages(hostname) {
    return hostname.endsWith('.github.io');
  }

  /**
   * Detect brand from hostname
   *
   * Brand-to-domain mapping (from brands/*.json):
   * - soulfra.com → soulfra
   * - calriven.com → calriven
   * - deathtodata.com → deathtodata
   * - localhost:5001 → soulfra (default for local dev)
   * - soulfra.github.io → soulfra
   * - calriven.github.io → calriven
   */
  _detectBrand(hostname) {
    // Check for specific brand domains
    const brandMappings = {
      'soulfra.com': 'soulfra',
      'soulfra.github.io': 'soulfra',
      'calriven.com': 'calriven',
      'calriven.github.io': 'calriven',
      'deathtodata.com': 'deathtodata',
      'deathtodata.github.io': 'deathtodata',
      'finishthisidea.com': 'finishthisidea',
      'finishthisrepo.com': 'finishthisrepo',
      'ipomyagent.com': 'ipomyagent',
      'hollowtown.com': 'hollowtown',
      'coldstartkit.com': 'coldstartkit',
      'brandaidkit.com': 'brandaidkit',
      'dealordelete.com': 'dealordelete',
      'saveorsink.com': 'saveorsink',
      'cringeproof.com': 'cringeproof'
    };

    // Direct mapping
    if (brandMappings[hostname]) {
      return brandMappings[hostname];
    }

    // Check environment variable override
    if (!this.clientSide && process.env.BRAND) {
      return process.env.BRAND;
    }

    // Check subdomain pattern (brand.soulfra.com → brand)
    const parts = hostname.split('.');
    if (parts.length >= 3 && parts[1] === 'soulfra') {
      return parts[0];
    }

    // Default to soulfra for localhost
    if (this._isLocalhost(hostname)) {
      return 'soulfra';
    }

    // Fallback
    return 'soulfra';
  }

  /**
   * Detect API base URL based on environment and brand
   */
  _detectApiBaseUrl(hostname, port) {
    // Local development
    if (this._environment === 'local') {
      return `http://localhost:${port}`;
    }

    // GitHub Pages (static - no API server)
    if (this._environment === 'github-pages') {
      // For GitHub Pages, API calls go to production backend
      // Map brand to production domain
      const brandToDomain = {
        'soulfra': 'https://soulfra.com',
        'calriven': 'https://calriven.com',
        'deathtodata': 'https://deathtodata.com',
        'finishthisidea': 'https://finishthisidea.com',
        'finishthisrepo': 'https://finishthisrepo.com',
        'ipomyagent': 'https://ipomyagent.com',
        'hollowtown': 'https://hollowtown.com',
        'coldstartkit': 'https://coldstartkit.com',
        'brandaidkit': 'https://brandaidkit.com',
        'dealordelete': 'https://dealordelete.com',
        'saveorsink': 'https://saveorsink.com',
        'cringeproof': 'https://cringeproof.com'
      };

      return brandToDomain[this._brand] || 'https://soulfra.com';
    }

    // Production
    return `https://${hostname}`;
  }

  /**
   * Get current environment
   * @returns {string} 'local' | 'production' | 'github-pages'
   */
  getEnvironment() {
    return this._environment;
  }

  /**
   * Get current brand
   * @returns {string} 'soulfra' | 'calriven' | 'deathtodata' | etc.
   */
  getBrand() {
    return this._brand;
  }

  /**
   * Get API base URL for current environment
   * @returns {string} e.g., 'http://localhost:5001' or 'https://soulfra.com'
   */
  getApiBaseUrl() {
    return this._apiBaseUrl;
  }

  /**
   * Check if running locally
   * @returns {boolean}
   */
  isLocal() {
    return this._environment === 'local';
  }

  /**
   * Check if running in production
   * @returns {boolean}
   */
  isProduction() {
    return this._environment === 'production';
  }

  /**
   * Check if running on GitHub Pages
   * @returns {boolean}
   */
  isGitHubPages() {
    return this._environment === 'github-pages';
  }

  /**
   * Load brand configuration from brands/{brand}.json
   * Node.js only (async file read)
   *
   * @returns {Promise<object>} Brand config object
   */
  async getBrandConfig() {
    // Return cached config if available
    if (this._brandConfig) {
      return this._brandConfig;
    }

    // Client-side: fetch config via HTTP
    if (this.clientSide) {
      try {
        const response = await fetch(`/brands/${this._brand}.json`);
        if (response.ok) {
          this._brandConfig = await response.json();
          return this._brandConfig;
        }
      } catch (error) {
        console.warn(`[CalEnv] Failed to fetch brand config: ${error.message}`);
      }

      // Fallback to default config
      return this._getDefaultBrandConfig();
    }

    // Server-side: read from filesystem
    try {
      const brandPath = path.join(process.cwd(), 'brands', `${this._brand}.json`);
      const content = await fs.readFile(brandPath, 'utf-8');
      this._brandConfig = JSON.parse(content);
      return this._brandConfig;
    } catch (error) {
      console.warn(`[CalEnv] Failed to load brand config for ${this._brand}: ${error.message}`);
      return this._getDefaultBrandConfig();
    }
  }

  /**
   * Get brand config synchronously (Node.js only)
   * Use getBrandConfig() for async version
   *
   * @returns {object|null} Brand config or null if not cached
   */
  getBrandConfigSync() {
    if (this._brandConfig) {
      return this._brandConfig;
    }

    // Try to load synchronously (Node.js only)
    if (!this.clientSide) {
      try {
        const brandPath = path.join(process.cwd(), 'brands', `${this._brand}.json`);
        const content = require('fs').readFileSync(brandPath, 'utf-8');
        this._brandConfig = JSON.parse(content);
        return this._brandConfig;
      } catch (error) {
        console.warn(`[CalEnv] Failed to load brand config sync: ${error.message}`);
      }
    }

    return null;
  }

  /**
   * Default brand config (fallback)
   */
  _getDefaultBrandConfig() {
    return {
      brand: this._brand,
      displayName: this._brand.charAt(0).toUpperCase() + this._brand.slice(1),
      domains: [this._getHostname()],
      llm: {
        temperature: 0.6,
        systemPrompt: 'You are a helpful AI assistant.',
        modelPreferences: {
          free: 'ollama:llama3.2',
          starter: 'claude-3-haiku',
          pro: 'claude-3.5-sonnet',
          enterprise: 'claude-opus'
        }
      },
      theme: {
        primaryColor: '#3498db',
        accentColor: '#2ecc71'
      },
      api: {
        baseUrl: this._apiBaseUrl
      }
    };
  }

  /**
   * Get full diagnostic information
   * Useful for debugging environment issues
   *
   * @returns {object} Complete environment info
   */
  getDiagnostics() {
    return {
      environment: this._environment,
      brand: this._brand,
      apiBaseUrl: this._apiBaseUrl,
      hostname: this._getHostname(),
      port: this._getPort(),
      isLocal: this.isLocal(),
      isProduction: this.isProduction(),
      isGitHubPages: this.isGitHubPages(),
      clientSide: this.clientSide,
      platform: this.clientSide ? 'browser' : process.platform,
      nodeEnv: this.clientSide ? null : process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Print diagnostics to console
   * Helpful for debugging
   */
  printDiagnostics() {
    const diag = this.getDiagnostics();

    console.log('\n🔍 Cal Environment Diagnostics');
    console.log('━'.repeat(50));
    console.log(`Environment:  ${diag.environment}`);
    console.log(`Brand:        ${diag.brand}`);
    console.log(`API Base URL: ${diag.apiBaseUrl}`);
    console.log(`Hostname:     ${diag.hostname}`);
    console.log(`Port:         ${diag.port}`);
    console.log(`Platform:     ${diag.platform}`);
    console.log(`Client-side:  ${diag.clientSide}`);
    console.log('');

    return diag;
  }

  /**
   * Create environment-aware API URL
   * Combines API base URL with endpoint path
   *
   * @param {string} endpoint - API endpoint (e.g., '/api/chat')
   * @returns {string} Full API URL
   */
  getApiUrl(endpoint) {
    const base = this._apiBaseUrl;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}${path}`;
  }

  /**
   * Check if a feature is enabled for this brand
   *
   * @param {string} featureName - Feature to check
   * @returns {Promise<boolean>} True if feature is enabled
   */
  async hasFeature(featureName) {
    const config = await this.getBrandConfig();
    return config.features && config.features[featureName] === true;
  }

  /**
   * Get tier limits for this brand
   *
   * @param {string} tierName - Tier name (free, starter, pro, enterprise)
   * @returns {Promise<object>} Tier limits
   */
  async getTierLimits(tierName) {
    const config = await this.getBrandConfig();
    return config.tier && config.tier[tierName] ? config.tier[tierName] : null;
  }

  /**
   * Get LLM settings for this brand
   *
   * @returns {Promise<object>} LLM configuration
   */
  async getLLMConfig() {
    const config = await this.getBrandConfig();
    return config.llm || this._getDefaultBrandConfig().llm;
  }
}

// Export for Node.js
if (isNode) {
  module.exports = CalEnvironmentDetector;
}

// Export for browser (global)
if (typeof window !== 'undefined') {
  window.CalEnvironmentDetector = CalEnvironmentDetector;
}
