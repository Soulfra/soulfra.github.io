/**
 * Web Search Engine
 *
 * Integrates multiple search providers:
 * - Google Custom Search API
 * - DuckDuckGo Instant Answer API
 * - Internal search index (analytics + conversations)
 *
 * Features:
 * - Result aggregation
 * - Deduplication
 * - Relevance ranking
 * - Trend detection
 * - Privacy-first (no tracking)
 */

class SearchEngine {
  constructor() {
    this.providers = {
      google: {
        name: 'Google Custom Search',
        enabled: false,
        apiKey: null,
        cx: null, // Custom Search Engine ID
        baseURL: 'https://www.googleapis.com/customsearch/v1'
      },
      duckduckgo: {
        name: 'DuckDuckGo',
        enabled: true,
        baseURL: 'https://api.duckduckgo.com'
      },
      internal: {
        name: 'Internal Index',
        enabled: true
      }
    };

    this.cache = new Map(); // Simple in-memory cache
    this.cacheDuration = 1000 * 60 * 60; // 1 hour

    this.stats = {
      totalSearches: 0,
      byProvider: {
        google: 0,
        duckduckgo: 0,
        internal: 0
      },
      cacheHits: 0
    };
  }

  /**
   * Search across all providers
   */
  async search(query, options = {}) {
    const {
      providers = ['duckduckgo', 'internal'], // Default to privacy-first
      maxResults = 10,
      includeInternal = true,
      cacheResults = true
    } = options;

    this.stats.totalSearches++;
    console.log(`🔍 Searching: "${query}"`);

    // Check cache
    const cacheKey = `${query}:${providers.join(',')}`;
    if (cacheResults && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheDuration) {
        this.stats.cacheHits++;
        console.log('📦 Cache hit');
        return cached.results;
      }
    }

    // Search each provider in parallel
    const searches = [];

    if (providers.includes('google') && this.providers.google.enabled) {
      searches.push(this.searchGoogle(query, maxResults));
    }

    if (providers.includes('duckduckgo') && this.providers.duckduckgo.enabled) {
      searches.push(this.searchDuckDuckGo(query, maxResults));
    }

    if (providers.includes('internal') && includeInternal) {
      searches.push(this.searchInternal(query, maxResults));
    }

    // Wait for all searches
    const results = await Promise.allSettled(searches);

    // Aggregate results
    const aggregated = this.aggregateResults(results, maxResults);

    // Cache results
    if (cacheResults) {
      this.cache.set(cacheKey, {
        results: aggregated,
        timestamp: Date.now()
      });
    }

    console.log(`✅ Found ${aggregated.length} results`);
    return aggregated;
  }

  /**
   * Search Google Custom Search API
   */
  async searchGoogle(query, maxResults) {
    if (!this.providers.google.apiKey || !this.providers.google.cx) {
      throw new Error('Google API key or CX not configured');
    }

    this.stats.byProvider.google++;

    const url = new URL(this.providers.google.baseURL);
    url.searchParams.set('key', this.providers.google.apiKey);
    url.searchParams.set('cx', this.providers.google.cx);
    url.searchParams.set('q', query);
    url.searchParams.set('num', Math.min(maxResults, 10));

    console.log('🔍 Google search...');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      provider: 'google',
      results: (data.items || []).map(item => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
        source: 'google',
        timestamp: new Date().toISOString()
      }))
    };
  }

  /**
   * Search DuckDuckGo Instant Answer API
   */
  async searchDuckDuckGo(query, maxResults) {
    this.stats.byProvider.duckduckgo++;

    const url = new URL(this.providers.duckduckgo.baseURL);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('no_html', '1');
    url.searchParams.set('skip_disambig', '1');

    console.log('🔍 DuckDuckGo search...');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`);
    }

    const data = await response.json();

    // DuckDuckGo returns instant answers, not search results
    const results = [];

    // Abstract (instant answer)
    if (data.Abstract) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL,
        snippet: data.Abstract,
        source: 'duckduckgo',
        timestamp: new Date().toISOString()
      });
    }

    // Related topics
    if (data.RelatedTopics) {
      data.RelatedTopics.slice(0, maxResults - results.length).forEach(topic => {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0],
            url: topic.FirstURL,
            snippet: topic.Text,
            source: 'duckduckgo',
            timestamp: new Date().toISOString()
          });
        }
      });
    }

    return {
      provider: 'duckduckgo',
      results: results
    };
  }

  /**
   * Search internal index (analytics + conversations)
   */
  async searchInternal(query, maxResults) {
    this.stats.byProvider.internal++;
    console.log('🔍 Internal search...');

    const results = [];

    // Search analytics DB
    try {
      const analyticsData = localStorage.getItem('soulfra_analytics');
      if (analyticsData) {
        const transactions = JSON.parse(analyticsData);
        const queryLower = query.toLowerCase();

        const matches = transactions.filter(t => {
          const messageLower = (t.message || '').toLowerCase();
          return messageLower.includes(queryLower);
        });

        matches.slice(0, maxResults).forEach(t => {
          results.push({
            title: `Conversation: ${t.message.substring(0, 60)}...`,
            url: '#transaction-' + t.id,
            snippet: t.message,
            source: 'internal',
            metadata: {
              sentiment: t.sentiment,
              timestamp: t.timestamp,
              status: t.status
            },
            timestamp: t.timestamp
          });
        });
      }
    } catch (e) {
      console.warn('Error searching internal index:', e);
    }

    return {
      provider: 'internal',
      results: results
    };
  }

  /**
   * Aggregate and rank results from multiple providers
   */
  aggregateResults(searchResults, maxResults) {
    const allResults = [];

    searchResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value.results) {
        allResults.push(...result.value.results);
      } else if (result.status === 'rejected') {
        console.warn(`Search failed:`, result.reason.message);
      }
    });

    // Deduplicate by URL
    const seen = new Set();
    const deduplicated = allResults.filter(result => {
      if (seen.has(result.url)) {
        return false;
      }
      seen.add(result.url);
      return true;
    });

    // Score results (simple relevance scoring)
    deduplicated.forEach(result => {
      result.score = this.calculateRelevance(result);
    });

    // Sort by score
    deduplicated.sort((a, b) => b.score - a.score);

    // Return top N results
    return deduplicated.slice(0, maxResults);
  }

  /**
   * Calculate relevance score for a result
   */
  calculateRelevance(result) {
    let score = 0;

    // Source priority (internal > duckduckgo > google)
    if (result.source === 'internal') score += 10;
    else if (result.source === 'duckduckgo') score += 5;
    else if (result.source === 'google') score += 3;

    // Recency bonus (for internal results)
    if (result.metadata && result.metadata.timestamp) {
      const age = Date.now() - new Date(result.metadata.timestamp).getTime();
      const daysSinceCreated = age / (1000 * 60 * 60 * 24);
      if (daysSinceCreated < 7) score += 5;
      else if (daysSinceCreated < 30) score += 2;
    }

    // Sentiment bonus (for internal results)
    if (result.metadata && result.metadata.sentiment === 'positive') {
      score += 1;
    }

    return score;
  }

  /**
   * Detect trending topics from search history
   */
  detectTrends(timeWindow = 7) {
    const transactions = this.getAnalyticsTransactions();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeWindow);

    // Count keyword frequency
    const keywords = {};
    transactions.forEach(t => {
      if (new Date(t.timestamp) > cutoffDate) {
        const words = (t.message || '').toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.length > 3) { // Skip short words
            keywords[word] = (keywords[word] || 0) + 1;
          }
        });
      }
    });

    // Sort by frequency
    const trending = Object.entries(keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ keyword: word, count }));

    return trending;
  }

  /**
   * Get analytics transactions
   */
  getAnalyticsTransactions() {
    try {
      const data = localStorage.getItem('soulfra_analytics');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Configure Google Custom Search
   */
  configureGoogle(apiKey, cx) {
    this.providers.google.apiKey = apiKey;
    this.providers.google.cx = cx;
    this.providers.google.enabled = true;
    console.log('✅ Google Custom Search configured');
  }

  /**
   * Get search statistics
   */
  getStats() {
    return {
      totalSearches: this.stats.totalSearches,
      cacheHits: this.stats.cacheHits,
      cacheHitRate: this.stats.totalSearches > 0
        ? ((this.stats.cacheHits / this.stats.totalSearches) * 100).toFixed(1) + '%'
        : '0%',
      byProvider: this.stats.byProvider,
      cacheSize: this.cache.size
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('✅ Search cache cleared');
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.SearchEngine = SearchEngine;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SearchEngine;
}
