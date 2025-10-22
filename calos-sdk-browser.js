/**
 * CalOS Platform SDK - Browser Edition
 *
 * Zero-dependency privacy-first automation platform for browsers
 *
 * Usage:
 * <script src="calos-sdk-browser.js"></script>
 * <script>
 *   const calos = new CalOSPlatform({ baseURL: 'https://api.calos.dev' });
 *   await calos.receipts.parse(imageFile);
 * </script>
 *
 * @version 2.0.0-browser
 * @license MIT
 * @dependencies ZERO - uses only browser built-ins (fetch, FileReader, crypto)
 */

(function(window) {
  'use strict';

  /**
   * Privacy modes
   */
  const PrivacyMode = {
    STRICT: 'strict',
    BALANCED: 'balanced',
    OFF: 'off'
  };

  /**
   * Main CalOS Platform class
   */
  class CalOSPlatform {
    constructor(config = {}) {
      this.apiKey = config.apiKey;
      this.baseURL = config.baseURL || 'http://localhost:5001';
      this.privacyMode = config.privacyMode || PrivacyMode.BALANCED;
      this.timeout = config.timeout || 60000;

      // Sub-modules
      this.receipts = new ReceiptsModule(this);
      this.email = new EmailModule(this);
      this.pos = new POSModule(this);
      this.ragebait = new RagebaitModule(this);
      this.files = new FilesModule(this);
      this.privacy = new PrivacyModule(this);

      console.log(`[CalOSPlatform] Browser SDK initialized (privacy: ${this.privacyMode})`);
    }

    /**
     * Make HTTP request
     */
    async request(method, path, options = {}) {
      const url = `${this.baseURL}${path}`;
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'calos-browser-sdk/2.0.0',
        ...options.headers
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const config = {
        method,
        headers,
        signal: AbortSignal.timeout(this.timeout)
      };

      if (options.body) {
        config.body = JSON.stringify(this._obfuscate(options.body));
      }

      try {
        const response = await fetch(url, config);
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(`API error: ${response.status} - ${error.message || response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error('[CalOSPlatform] Request failed:', error.message);
        throw error;
      }
    }

    /**
     * Obfuscate data based on privacy mode
     */
    _obfuscate(data) {
      if (this.privacyMode === PrivacyMode.OFF) return data;

      const obfuscated = JSON.parse(JSON.stringify(data));
      const piiFields = ['email', 'phone', 'address', 'ssn', 'name', 'firstName', 'lastName'];

      const removePII = (obj) => {
        if (typeof obj !== 'object' || obj === null) return obj;
        for (const key in obj) {
          if (piiFields.some(field => key.toLowerCase().includes(field))) {
            obj[key] = '[REDACTED]';
          } else if (typeof obj[key] === 'object') {
            removePII(obj[key]);
          }
        }
        return obj;
      };

      return this.privacyMode === PrivacyMode.STRICT ? removePII(obfuscated) : obfuscated;
    }

    /**
     * Health check
     */
    async health() {
      try {
        const response = await this.request('GET', '/health');
        return { success: true, status: response.status || 'healthy', services: response.services || {} };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  }

  /**
   * Receipts Module - OCR + Categorization
   */
  class ReceiptsModule {
    constructor(sdk) {
      this.sdk = sdk;
    }

    /**
     * Parse receipt from File object (browser upload)
     */
    async parse(file) {
      const formData = new FormData();
      formData.append('receipt', file);

      const response = await fetch(`${this.sdk.baseURL}/api/receipts/upload`, {
        method: 'POST',
        headers: {
          ...(this.sdk.apiKey && { 'Authorization': `Bearer ${this.sdk.apiKey}` })
        },
        body: formData
      });

      if (!response.ok) throw new Error(`Receipt parsing failed: ${response.statusText}`);
      return await response.json();
    }

    /**
     * Parse receipt from text
     */
    async parseText(text, merchant = 'auto') {
      return await this.sdk.request('POST', '/api/receipts/parse', { body: { text, merchant } });
    }

    /**
     * Get expense categories
     */
    async getCategories() {
      return await this.sdk.request('GET', '/api/receipts/categories');
    }

    /**
     * Get expense breakdown
     */
    async getBreakdown(userId, startDate, endDate) {
      const params = new URLSearchParams({ userId, startDate, endDate });
      return await this.sdk.request('GET', `/api/receipts/breakdown?${params}`);
    }
  }

  /**
   * Email Module - Gmail Zero-Cost Relay
   */
  class EmailModule {
    constructor(sdk) {
      this.sdk = sdk;
    }

    async send({ userId, to, subject, text, html }) {
      return await this.sdk.request('POST', '/api/gmail/send', { body: { userId, to, subject, text, html } });
    }

    async addRecipient(userId, email) {
      return await this.sdk.request('POST', '/api/gmail/recipients/add', { body: { userId, email } });
    }

    async checkLimits(userId) {
      return await this.sdk.request('GET', `/api/gmail/limits?userId=${userId}`);
    }

    async getStatus(userId) {
      return await this.sdk.request('GET', `/api/gmail/status?userId=${userId}`);
    }
  }

  /**
   * POS Module - Square Competitor
   */
  class POSModule {
    constructor(sdk) {
      this.sdk = sdk;
    }

    async charge({ amount, currency = 'usd', terminalId, description, metadata }) {
      return await this.sdk.request('POST', '/api/pos/charge', { body: { amount, currency, terminalId, description, metadata } });
    }

    async generateQR({ amount, description }) {
      return await this.sdk.request('POST', '/api/pos/qr', { body: { amount, description } });
    }

    async cash({ amount, description, metadata }) {
      return await this.sdk.request('POST', '/api/pos/cash', { body: { amount, description, metadata } });
    }

    async getTransactions(locationId, startDate, endDate) {
      const params = new URLSearchParams({ locationId, startDate, endDate });
      return await this.sdk.request('GET', `/api/pos/transactions?${params}`);
    }
  }

  /**
   * Ragebait Module - Dev Meme Generator
   */
  class RagebaitModule {
    constructor(sdk) {
      this.sdk = sdk;
    }

    async generate(templateId, options = {}) {
      return await this.sdk.request('POST', '/api/ragebait/generate', {
        body: { templateId, domain: options.domain, watermark: options.watermark, format: options.format || 'gif' }
      });
    }

    async listTemplates() {
      return await this.sdk.request('GET', '/api/ragebait/templates');
    }

    async createTemplate(template) {
      return await this.sdk.request('POST', '/api/ragebait/templates', { body: template });
    }
  }

  /**
   * Files Module - File Explorer & Git Scanner
   */
  class FilesModule {
    constructor(sdk) {
      this.sdk = sdk;
    }

    async scanGitRepos(path = '~/Desktop') {
      return await this.sdk.request('GET', `/api/explorer/git?path=${encodeURIComponent(path)}`);
    }

    async getTree(path, depth = 3) {
      return await this.sdk.request('GET', `/api/explorer/tree?path=${encodeURIComponent(path)}&depth=${depth}`);
    }

    async analyzeRepo(repoPath) {
      return await this.sdk.request('GET', `/api/explorer/analyze?path=${encodeURIComponent(repoPath)}`);
    }

    async scan() {
      return await this.sdk.request('GET', '/api/explorer/scan');
    }
  }

  /**
   * Privacy Module - Telemetry & Data Control
   */
  class PrivacyModule {
    constructor(sdk) {
      this.sdk = sdk;
    }

    async getDashboard() {
      return await this.sdk.request('GET', '/api/privacy/dashboard');
    }

    async getDataFlow(timeRange = '7d') {
      return await this.sdk.request('GET', `/api/privacy/dataflow?range=${timeRange}`);
    }

    async getTelemetryPreview() {
      return await this.sdk.request('GET', '/api/privacy/telemetry/preview');
    }

    async optOut() {
      return await this.sdk.request('POST', '/api/privacy/telemetry/opt-out');
    }

    async exportData(userId) {
      return await this.sdk.request('GET', `/api/privacy/export?userId=${userId}`);
    }

    async deleteData(userId) {
      return await this.sdk.request('DELETE', `/api/privacy/data?userId=${userId}`);
    }
  }

  // Export to window
  window.CalOSPlatform = CalOSPlatform;
  window.PrivacyMode = PrivacyMode;

  console.log('[CalOS Browser SDK] Loaded successfully - zero dependencies ✅');

})(window);
