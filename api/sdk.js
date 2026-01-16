/**
 * Soulfra Unified SDK - Frontend
 *
 * Simple, clean API for frontend development.
 * No API keys needed - calls your secure backend.
 *
 * Usage:
 *   <script src="/api/sdk.js"></script>
 *   <script>
 *     const soulfra = new SoulframSDK();
 *     const response = await soulfra.chat('Hello!');
 *     const repos = await soulfra.getRepos();
 *   </script>
 *
 * @version 1.0.0
 * @author Soulfra
 */

(function(window) {
  'use strict';

  /**
   * Custom error classes for better error handling
   */
  class SDKError extends Error {
    constructor(message, code, statusCode, details) {
      super(message);
      this.name = 'SDKError';
      this.code = code;
      this.statusCode = statusCode;
      this.details = details;
    }
  }

  class AuthenticationError extends SDKError {
    constructor(message, details) {
      super(message, 'AUTHENTICATION_ERROR', 401, details);
      this.name = 'AuthenticationError';
    }
  }

  class RateLimitError extends SDKError {
    constructor(message, retryAfter, details) {
      super(message, 'RATE_LIMIT_ERROR', 429, details);
      this.name = 'RateLimitError';
      this.retryAfter = retryAfter;
    }
  }

  class ValidationError extends SDKError {
    constructor(message, field, details) {
      super(message, 'VALIDATION_ERROR', 400, details);
      this.name = 'ValidationError';
      this.field = field;
    }
  }

  /**
   * Main SDK Class
   */
  class SoulframSDK {
    /**
     * @param {Object} options - Configuration options
     * @param {string} [options.baseURL] - API base URL (auto-detected if not provided)
     * @param {number} [options.timeout=30000] - Request timeout in ms
     * @param {boolean} [options.debug=false] - Enable debug logging
     */
    constructor(options = {}) {
      // Auto-detect base URL from API_CONFIG if available, otherwise use default
      this.baseURL = options.baseURL ||
                    (window.API_CONFIG && window.API_CONFIG.baseURL) ||
                    'http://localhost:5050';

      this.timeout = options.timeout || 30000;
      this.debug = options.debug || false;

      this._log('SDK initialized', { baseURL: this.baseURL });
    }

    /**
     * Internal logging
     */
    _log(...args) {
      if (this.debug) {
        console.log('[SoulframSDK]', ...args);
      }
    }

    /**
     * Internal error handler
     */
    _handleError(error, response) {
      if (response) {
        if (response.status === 401) {
          throw new AuthenticationError(error.message, error.details);
        }
        if (response.status === 429) {
          throw new RateLimitError(error.message, response.headers.get('retry-after'), error.details);
        }
        if (response.status === 400) {
          throw new ValidationError(error.message, error.details?.field, error.details);
        }
      }
      throw new SDKError(error.message, error.code || 'UNKNOWN_ERROR', response?.status, error.details);
    }

    /**
     * Internal HTTP request handler
     */
    async _request(endpoint, options = {}) {
      const url = `${this.baseURL}${endpoint}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        this._log('Request:', options.method || 'GET', url);

        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
          this._handleError(data.error || { message: 'Request failed' }, response);
        }

        this._log('Response:', data);
        return data;

      } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
          throw new SDKError('Request timeout', 'TIMEOUT_ERROR', 408);
        }

        throw error;
      }
    }

    // ============================================================================
    // AI & Chat Methods
    // ============================================================================

    /**
     * Send a chat message to AI (auto-routes to best provider)
     *
     * @param {string} message - The message to send
     * @param {Object} [options] - Chat options
     * @param {string} [options.provider='auto'] - AI provider: 'auto', 'openai', 'claude', 'ollama'
     * @param {string} [options.model] - Specific model to use
     * @param {number} [options.maxTokens] - Maximum tokens in response
     * @param {number} [options.temperature] - Creativity (0-1)
     * @param {Array} [options.history] - Previous messages for context
     * @returns {Promise<{content: string, provider: string, model: string, usage: Object}>}
     *
     * @example
     * const response = await soulfra.chat('Design a login form');
     * console.log(response.content); // AI response
     *
     * @example
     * // With options
     * const response = await soulfra.chat('Write a poem', {
     *   provider: 'claude',
     *   temperature: 0.9,
     *   maxTokens: 500
     * });
     */
    async chat(message, options = {}) {
      return this._request('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message,
          provider: options.provider || 'auto',
          model: options.model,
          maxTokens: options.maxTokens,
          temperature: options.temperature,
          history: options.history
        })
      });
    }

    /**
     * Stream a chat response (real-time token-by-token)
     *
     * @param {string} message - The message to send
     * @param {Object} [options] - Chat options (same as chat method)
     * @returns {AsyncGenerator<string>} Async generator yielding response chunks
     *
     * @example
     * for await (const chunk of soulfra.streamChat('Count to 10')) {
     *   process.stdout.write(chunk);
     * }
     */
    async *streamChat(message, options = {}) {
      const url = `${this.baseURL}/api/chat/stream`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          provider: options.provider || 'auto',
          model: options.model,
          maxTokens: options.maxTokens,
          temperature: options.temperature,
          history: options.history
        })
      });

      if (!response.ok) {
        const error = await response.json();
        this._handleError(error.error || { message: 'Stream failed' }, response);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield decoder.decode(value);
      }
    }

    /**
     * Adaptive chat - AI adapts to your expertise level (like WordPress Hello World)
     *
     * Automatically detects if you're a beginner, intermediate, or expert and:
     * - Routes to best AI model for your level
     * - Adjusts response complexity
     * - Tracks learning progression
     *
     * @param {string} message - The message to send
     * @param {Object} [options] - Chat options
     * @param {string} [options.userId] - User ID for tracking progression (optional)
     * @param {Array} [options.history] - Previous messages for context
     * @param {boolean} [options.adaptive=true] - Enable adaptive routing
     * @param {string} [options.provider] - Force specific provider (overrides adaptive)
     * @param {string} [options.model] - Force specific model (overrides adaptive)
     * @param {number} [options.maxTokens] - Maximum tokens in response
     * @param {number} [options.temperature] - Creativity (overrides adaptive)
     * @returns {Promise<{content: string, provider: string, model: string, usage: Object, expertise: Object, recommendation: Object, routing: Object}>}
     *
     * @example
     * // Beginner gets simple explanation with Ollama (local, free)
     * const response = await soulfra.chatAdaptive('How do I make a website?');
     *
     * @example
     * // Expert gets technical details with Claude
     * const response = await soulfra.chatAdaptive('What are the performance implications of using async/await vs promises in Node.js event loop?');
     * console.log('Detected level:', response.expertise.level);
     * console.log('Routed to:', response.routing.provider);
     *
     * @example
     * // Track user progression
     * const response = await soulfra.chatAdaptive('Explain closures', {
     *   userId: 'user123'
     * });
     * // System learns and adapts over time
     */
    async chatAdaptive(message, options = {}) {
      return this._request('/api/chat/adaptive', {
        method: 'POST',
        body: JSON.stringify({
          message,
          userId: options.userId,
          history: options.history,
          adaptive: options.adaptive !== false,
          provider: options.provider,
          model: options.model,
          maxTokens: options.maxTokens,
          temperature: options.temperature
        })
      });
    }

    /**
     * Stream adaptive chat (real-time with expertise adaptation)
     *
     * @param {string} message - The message to send
     * @param {Object} [options] - Chat options (same as chatAdaptive)
     * @returns {AsyncGenerator<string>} Async generator yielding response chunks
     *
     * @example
     * for await (const chunk of soulfra.streamChatAdaptive('Explain recursion')) {
     *   process.stdout.write(chunk);
     * }
     */
    async *streamChatAdaptive(message, options = {}) {
      const url = `${this.baseURL}/api/chat/adaptive/stream`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          userId: options.userId,
          history: options.history,
          adaptive: options.adaptive !== false,
          provider: options.provider,
          model: options.model,
          maxTokens: options.maxTokens,
          temperature: options.temperature
        })
      });

      if (!response.ok) {
        const error = await response.json();
        this._handleError(error.error || { message: 'Adaptive stream failed' }, response);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield decoder.decode(value);
      }
    }

    /**
     * Detect expertise level from a message (for testing/debugging)
     *
     * @param {string} message - Message to analyze
     * @param {Array} [history] - Conversation history
     * @returns {Promise<{expertise: Object, recommendation: Object}>}
     *
     * @example
     * const result = await soulfra.detectExpertise('How do I center a div?');
     * console.log('Level:', result.expertise.level); // 'beginner'
     * console.log('Confidence:', result.expertise.confidence); // 0.85
     * console.log('Recommended provider:', result.recommendation.provider); // 'ollama'
     */
    async detectExpertise(message, history = []) {
      return this._request('/api/expertise/detect', {
        method: 'POST',
        body: JSON.stringify({
          message,
          history
        })
      });
    }

    /**
     * Get learning statistics
     *
     * @returns {Promise<{totalUsers: number, expertiseCounts: Object, trends: Object, providers: Array}>}
     *
     * @example
     * const stats = await soulfra.getLearningStats();
     * console.log('Total users:', stats.totalUsers);
     * console.log('Beginners:', stats.expertiseCounts.beginner);
     */
    async getLearningStats() {
      const response = await this._request('/api/learning/stats');
      return response.data;
    }

    // ============================================================================
    // GitHub Methods
    // ============================================================================

    /**
     * Get all GitHub repositories (with pagination, gets ALL repos)
     *
     * @returns {Promise<{active: Array, experiments: Array, archived: Array, counts: Object}>}
     *
     * @example
     * const repos = await soulfra.getRepos();
     * repos.active.forEach(repo => {
     *   console.log(repo.name, repo.url);
     * });
     */
    async getRepos() {
      const response = await this._request('/api/debug/github-repos');
      return response.data; // Unwrap standardized response
    }

    // ============================================================================
    // Email & Comments Methods
    // ============================================================================

    /**
     * Save an email capture
     *
     * @param {string} email - Email address
     * @param {Object} [options] - Additional options
     * @param {string} [options.source] - Source/page identifier
     * @param {Object} [options.metadata] - Additional metadata
     * @returns {Promise<{saved: boolean, email: string, total_count: number}>}
     *
     * @example
     * await soulfra.saveEmail('user@example.com', {
     *   source: 'blog-subscribe',
     *   metadata: { campaign: 'launch' }
     * });
     */
    async saveEmail(email, options = {}) {
      return this._request('/api/email-capture', {
        method: 'POST',
        body: JSON.stringify({
          email,
          source: options.source || window.location.pathname,
          metadata: options.metadata || {}
        })
      });
    }

    /**
     * Save a comment
     *
     * @param {string} comment - Comment text
     * @param {Object} [options] - Additional options
     * @param {string} [options.author] - Author name
     * @param {string} [options.source] - Source/page identifier
     * @param {Object} [options.metadata] - Additional metadata
     * @returns {Promise<{saved: boolean, id: string, total_count: number}>}
     *
     * @example
     * await soulfra.saveComment('Great article!', {
     *   author: 'John Doe',
     *   source: 'blog-post-1'
     * });
     */
    async saveComment(comment, options = {}) {
      return this._request('/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          comment,
          author: options.author || 'Anonymous',
          source: options.source || window.location.pathname,
          metadata: options.metadata || {}
        })
      });
    }

    // ============================================================================
    // QR Code Methods
    // ============================================================================

    /**
     * Generate a QR code
     *
     * @param {Object} options - QR code options
     * @param {string} [options.type='bootstrap'] - QR type: 'bootstrap', 'auth', 'payment'
     * @param {Object} [options.data={}] - Data to encode
     * @returns {Promise<{qr: Object}>}
     *
     * @example
     * const { qr } = await soulfra.generateQR({
     *   type: 'auth',
     *   data: { sessionId: '12345' }
     * });
     * document.getElementById('qr-container').innerHTML = qr.svg;
     */
    async generateQR(options = {}) {
      return this._request('/api/qr/generate', {
        method: 'POST',
        body: JSON.stringify({
          type: options.type || 'bootstrap',
          data: options.data || {}
        })
      });
    }

    // ============================================================================
    // Agent Methods
    // ============================================================================

    /**
     * Build an agent from conversation
     *
     * @param {Array} conversation - Conversation history
     * @param {Object} [options] - Agent options
     * @param {boolean} [options.vaultIntegration=true] - Enable vault integration
     * @param {string} [options.category='ui'] - Agent category
     * @returns {Promise<{agent: Object}>}
     *
     * @example
     * const { agent } = await soulfra.buildAgent([
     *   { role: 'user', content: 'I need a login form' },
     *   { role: 'assistant', content: 'Here\'s a login form...' }
     * ], { category: 'ui' });
     */
    async buildAgent(conversation, options = {}) {
      return this._request('/api/agent/build', {
        method: 'POST',
        body: JSON.stringify({
          conversation,
          vaultIntegration: options.vaultIntegration !== false,
          category: options.category || 'ui'
        })
      });
    }

    // ============================================================================
    // Authentication Methods
    // ============================================================================

    /**
     * Generate QR code for authentication
     *
     * @returns {Promise<{sessionId: string, qrData: string, expiresIn: number}>}
     *
     * @example
     * const { sessionId, qrData } = await soulfra.generateAuthQR();
     * // Poll for status
     * const status = await soulfra.checkAuthStatus(sessionId);
     */
    async generateAuthQR() {
      return this._request('/api/auth/qr/generate', {
        method: 'POST'
      });
    }

    /**
     * Check QR authentication status
     *
     * @param {string} sessionId - Session ID from generateAuthQR
     * @returns {Promise<{session: Object}>}
     */
    async checkAuthStatus(sessionId) {
      return this._request(`/api/auth/qr/status/${sessionId}`);
    }

    // ============================================================================
    // Health & Status Methods
    // ============================================================================

    /**
     * Check API health
     *
     * @returns {Promise<{status: string, adapters: Object, storage: Object}>}
     *
     * @example
     * const health = await soulfra.health();
     * console.log('API Status:', health.status);
     * console.log('Adapters:', health.adapters);
     */
    async health() {
      const response = await this._request('/api/health');
      return response.data;
    }

    /**
     * Get API information
     *
     * @returns {Promise<Object>} API metadata
     */
    async getAPIInfo() {
      return this._request('/api');
    }
  }

  // Expose SDK to global scope
  window.SoulframSDK = SoulframSDK;

  // Also expose error classes for advanced error handling
  window.SoulframSDK.SDKError = SDKError;
  window.SoulframSDK.AuthenticationError = AuthenticationError;
  window.SoulframSDK.RateLimitError = RateLimitError;
  window.SoulframSDK.ValidationError = ValidationError;

  // Auto-initialize if API_CONFIG is available
  if (typeof window.API_CONFIG !== 'undefined') {
    console.log('✅ SoulframSDK loaded (auto-configured)');
  } else {
    console.log('✅ SoulframSDK loaded (using defaults)');
  }

})(window);
