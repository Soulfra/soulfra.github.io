#!/usr/bin/env node
/**
 * Web Researcher
 *
 * Lets Ollama research topics by fetching and summarizing web pages.
 * Uses curl/https to fetch URLs, then Ollama to summarize.
 *
 * Features:
 * - Fetch URL content
 * - Extract main text from HTML
 * - Summarize with Ollama
 * - Cache results to avoid re-fetching
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const crypto = require('crypto');
const path = require('path');
const DataStore = require('./data-store.js');

class WebResearcher {
  constructor(options = {}) {
    this.config = {
      ollamaHost: options.ollamaHost || '127.0.0.1',
      ollamaPort: options.ollamaPort || 11434,
      model: options.model || 'llama3.2',
      timeout: options.timeout || 30000, // 30 seconds
      maxContentLength: options.maxContentLength || 50000, // 50KB
      cacheTimeout: options.cacheTimeout || 86400000, // 24 hours
      ...options
    };

    // Cache for fetched URLs
    this.cacheStore = new DataStore(path.join(__dirname, '../data/web-research-cache.json'));
    this.cache = {};
  }

  /**
   * Initialize (load cache)
   */
  async initialize() {
    try {
      this.cache = await this.cacheStore.read();
      if (!this.cache || typeof this.cache !== 'object') {
        this.cache = {};
      }
      console.log(`✅ Web Researcher initialized with ${Object.keys(this.cache).length} cached URLs`);
      return true;
    } catch (error) {
      console.warn('⚠️ Web Researcher creating new cache');
      this.cache = {};
      return true;
    }
  }

  /**
   * Research a topic by fetching and summarizing URLs
   */
  async researchTopic(topic, urls = []) {
    // If no URLs provided, generate search query and find URLs
    if (!urls || urls.length === 0) {
      urls = await this.generateSearchQuery(topic);
    }

    const results = [];

    for (const url of urls) {
      try {
        console.log(`📄 Fetching: ${url}`);
        const content = await this.fetchURL(url);
        const summary = await this.summarizeContent(content, topic);

        results.push({
          url,
          summary,
          fetchedAt: new Date().toISOString()
        });

        console.log(`✅ Summarized: ${url}`);
      } catch (error) {
        console.error(`❌ Failed to research ${url}: ${error.message}`);
        results.push({
          url,
          error: error.message,
          fetchedAt: new Date().toISOString()
        });
      }
    }

    return results;
  }

  /**
   * Fetch URL content
   */
  async fetchURL(urlString) {
    // Check cache first
    const cacheKey = this.getCacheKey(urlString);
    const cached = this.cache[cacheKey];

    if (cached && this.isCacheValid(cached)) {
      console.log(`💾 Cache hit: ${urlString}`);
      return cached.content;
    }

    // Fetch from web
    return new Promise((resolve, reject) => {
      try {
        const parsedURL = new URL(urlString);
        const protocol = parsedURL.protocol === 'https:' ? https : http;

        const options = {
          hostname: parsedURL.hostname,
          port: parsedURL.port,
          path: parsedURL.pathname + parsedURL.search,
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          timeout: this.config.timeout
        };

        const req = protocol.request(options, (res) => {
          // Handle redirects
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            console.log(`↪️ Redirecting to: ${res.headers.location}`);
            return this.fetchURL(res.headers.location).then(resolve).catch(reject);
          }

          // Check content type
          const contentType = res.headers['content-type'] || '';
          if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
            return reject(new Error(`Unsupported content type: ${contentType}`));
          }

          let data = '';
          let size = 0;

          res.on('data', (chunk) => {
            size += chunk.length;
            if (size > this.config.maxContentLength) {
              req.destroy();
              reject(new Error('Content too large'));
              return;
            }
            data += chunk;
          });

          res.on('end', () => {
            // Extract text from HTML
            const textContent = this.extractText(data);

            // Cache result
            this.cache[cacheKey] = {
              url: urlString,
              content: textContent,
              fetchedAt: new Date().toISOString()
            };
            this.cacheStore.write(this.cache).catch(err => {
              console.warn('Cache write failed:', err.message);
            });

            resolve(textContent);
          });
        });

        req.on('error', (error) => {
          reject(new Error(`Request failed: ${error.message}`));
        });

        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });

        req.end();
      } catch (error) {
        reject(new Error(`URL parsing failed: ${error.message}`));
      }
    });
  }

  /**
   * Extract plain text from HTML
   */
  extractText(html) {
    // Remove script and style tags
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')  // Remove all HTML tags
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .trim();

    // Limit length
    if (text.length > this.config.maxContentLength) {
      text = text.substring(0, this.config.maxContentLength) + '...';
    }

    return text;
  }

  /**
   * Summarize content using Ollama
   */
  async summarizeContent(content, topic = '') {
    const prompt = topic
      ? `Summarize the following content in 2-3 sentences, focusing on information relevant to "${topic}":\n\n${content}`
      : `Summarize the following content in 2-3 sentences:\n\n${content}`;

    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        model: this.config.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3, // Lower temperature for factual summaries
          num_predict: 200  // ~2-3 sentences
        }
      });

      const options = {
        hostname: this.config.ollamaHost,
        port: this.config.ollamaPort,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(responseData);
            resolve(json.response || 'No summary available');
          } catch (e) {
            reject(new Error(`Ollama response parse error: ${e.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Ollama request failed: ${error.message}`));
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Generate search query for a topic (using Ollama)
   */
  async generateSearchQuery(topic) {
    const prompt = `Generate 3 good search URLs for researching "${topic}". Return only the URLs, one per line. Focus on authoritative sources like Wikipedia, official documentation, or reputable tech sites.`;

    try {
      const response = await this.callOllama(prompt);

      // Extract URLs from response
      const urls = response
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('http://') || line.startsWith('https://'))
        .slice(0, 3);

      return urls;
    } catch (error) {
      console.warn('⚠️ Failed to generate search URLs, using defaults');
      // Fallback: construct basic search URLs
      const query = encodeURIComponent(topic);
      return [
        `https://en.wikipedia.org/wiki/Special:Search?search=${query}`,
        `https://www.google.com/search?q=${query}`
      ];
    }
  }

  /**
   * Call Ollama API
   */
  async callOllama(prompt) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        model: this.config.model,
        prompt: prompt,
        stream: false
      });

      const options = {
        hostname: this.config.ollamaHost,
        port: this.config.ollamaPort,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(responseData);
            resolve(json.response || '');
          } catch (e) {
            reject(new Error(`Ollama response parse error: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  /**
   * Get cache key for URL
   */
  getCacheKey(url) {
    return crypto.createHash('md5').update(url).digest('hex');
  }

  /**
   * Check if cached result is still valid
   */
  isCacheValid(cached) {
    if (!cached || !cached.fetchedAt) return false;
    const age = Date.now() - new Date(cached.fetchedAt).getTime();
    return age < this.config.cacheTimeout;
  }

  /**
   * Clear cache
   */
  async clearCache() {
    this.cache = {};
    await this.cacheStore.write(this.cache);
    console.log('✅ Web research cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    const urls = Object.values(this.cache);
    const validCache = urls.filter(c => this.isCacheValid(c));

    return {
      totalCached: urls.length,
      validCache: validCache.length,
      expiredCache: urls.length - validCache.length,
      cacheSize: JSON.stringify(this.cache).length
    };
  }

  /**
   * Get module info
   */
  getInfo() {
    return {
      model: this.config.model,
      ollamaHost: this.config.ollamaHost,
      ollamaPort: this.config.ollamaPort,
      cacheStats: this.getCacheStats()
    };
  }
}

module.exports = WebResearcher;
