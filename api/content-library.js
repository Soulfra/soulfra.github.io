#!/usr/bin/env node
/**
 * Content Library
 *
 * Central storage for all generated content across domains.
 * Prevents regenerating the same content twice.
 *
 * Features:
 * - Save generated content
 * - Search by domain, type, topic
 * - Avoid duplicates
 * - Track generation metadata
 */

const crypto = require('crypto');
const path = require('path');
const DataStore = require('./data-store.js');

class ContentLibrary {
  constructor() {
    this.store = new DataStore(path.join(__dirname, '../data/content-library.json'));
    this.cache = null;
  }

  /**
   * Initialize library (load from disk)
   */
  async initialize() {
    try {
      this.cache = await this.store.read();
      if (!this.cache || typeof this.cache !== 'object') {
        this.cache = this.createEmptyLibrary();
        await this.store.write(this.cache);
      }
      console.log(`✅ Content Library initialized with ${this.getStats().totalItems} items`);
      return true;
    } catch (error) {
      console.warn('⚠️ Content Library creating new database');
      this.cache = this.createEmptyLibrary();
      await this.store.write(this.cache);
      return true;
    }
  }

  /**
   * Create empty library structure
   */
  createEmptyLibrary() {
    return {
      soulfra: { articles: [], landing_pages: [], emails: [], social_posts: [], products: [] },
      calriven: { articles: [], landing_pages: [], emails: [], social_posts: [], products: [] },
      deathtodata: { articles: [], landing_pages: [], emails: [], social_posts: [], products: [] },
      cringeproof: { articles: [], landing_pages: [], emails: [], social_posts: [], products: [] },
      howtocookathome: { articles: [], landing_pages: [], emails: [], social_posts: [], products: [] },
      general: { articles: [], landing_pages: [], emails: [], social_posts: [], products: [] }
    };
  }

  /**
   * Save content to library
   */
  async save(params) {
    const {
      domain = 'general',
      type = 'article', // article, landing_page, email, social_post, product
      topic,
      content,
      metadata = {},
      sources = []
    } = params;

    // Ensure library is loaded
    if (!this.cache) {
      await this.initialize();
    }

    // Normalize domain and type
    const normalizedDomain = domain.toLowerCase();
    const normalizedType = type.toLowerCase().replace(/-/g, '_') + 's'; // pluralize

    // Ensure domain exists
    if (!this.cache[normalizedDomain]) {
      this.cache[normalizedDomain] = this.createEmptyLibrary()[normalizedDomain];
    }

    // Ensure type array exists
    if (!this.cache[normalizedDomain][normalizedType]) {
      this.cache[normalizedDomain][normalizedType] = [];
    }

    // Generate content ID
    const contentId = this.generateContentId(domain, type);

    // Create content entry
    const entry = {
      id: contentId,
      domain: normalizedDomain,
      type: type.replace(/-/g, '_'),
      topic,
      content,
      metadata: {
        ...metadata,
        wordCount: this.countWords(content),
        characterCount: content.length
      },
      sources,
      generatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      version: 1
    };

    // Add to library
    this.cache[normalizedDomain][normalizedType].push(entry);

    // Save to disk
    await this.store.write(this.cache);

    console.log(`✅ Content saved: ${contentId} - ${domain}/${type}`);

    return {
      success: true,
      contentId,
      entry
    };
  }

  /**
   * Search library for existing content
   */
  async search(params) {
    const {
      domain,
      type,
      topic,
      query
    } = params;

    if (!this.cache) {
      await this.initialize();
    }

    let results = [];

    // Filter by domain
    const domains = domain ? [domain.toLowerCase()] : Object.keys(this.cache);

    for (const d of domains) {
      if (!this.cache[d]) continue;

      // Filter by type
      const types = type
        ? [type.toLowerCase().replace(/-/g, '_') + 's']
        : Object.keys(this.cache[d]);

      for (const t of types) {
        if (!this.cache[d][t]) continue;

        const items = this.cache[d][t];

        // Filter by topic/query
        for (const item of items) {
          let matches = true;

          if (topic && !item.topic.toLowerCase().includes(topic.toLowerCase())) {
            matches = false;
          }

          if (query) {
            const searchableText = `${item.topic} ${item.content} ${JSON.stringify(item.metadata)}`.toLowerCase();
            if (!searchableText.includes(query.toLowerCase())) {
              matches = false;
            }
          }

          if (matches) {
            results.push(item);
          }
        }
      }
    }

    return results;
  }

  /**
   * Get content by ID
   */
  async get(contentId) {
    if (!this.cache) {
      await this.initialize();
    }

    for (const domain of Object.keys(this.cache)) {
      for (const type of Object.keys(this.cache[domain])) {
        const item = this.cache[domain][type].find(i => i.id === contentId);
        if (item) {
          return item;
        }
      }
    }

    return null;
  }

  /**
   * Update existing content
   */
  async update(contentId, updates) {
    if (!this.cache) {
      await this.initialize();
    }

    for (const domain of Object.keys(this.cache)) {
      for (const type of Object.keys(this.cache[domain])) {
        const index = this.cache[domain][type].findIndex(i => i.id === contentId);
        if (index !== -1) {
          const item = this.cache[domain][type][index];

          // Update fields
          if (updates.content) item.content = updates.content;
          if (updates.metadata) item.metadata = { ...item.metadata, ...updates.metadata };
          if (updates.topic) item.topic = updates.topic;

          item.lastUpdated = new Date().toISOString();
          item.version = (item.version || 1) + 1;

          // Save
          await this.store.write(this.cache);

          console.log(`✅ Content updated: ${contentId}`);

          return {
            success: true,
            contentId,
            item
          };
        }
      }
    }

    throw new Error(`Content ${contentId} not found`);
  }

  /**
   * Delete content
   */
  async delete(contentId) {
    if (!this.cache) {
      await this.initialize();
    }

    for (const domain of Object.keys(this.cache)) {
      for (const type of Object.keys(this.cache[domain])) {
        const index = this.cache[domain][type].findIndex(i => i.id === contentId);
        if (index !== -1) {
          this.cache[domain][type].splice(index, 1);
          await this.store.write(this.cache);

          console.log(`✅ Content deleted: ${contentId}`);

          return {
            success: true,
            contentId
          };
        }
      }
    }

    throw new Error(`Content ${contentId} not found`);
  }

  /**
   * List all content for a domain
   */
  async listByDomain(domain) {
    if (!this.cache) {
      await this.initialize();
    }

    const normalizedDomain = domain.toLowerCase();

    if (!this.cache[normalizedDomain]) {
      return [];
    }

    const all = [];
    for (const type of Object.keys(this.cache[normalizedDomain])) {
      all.push(...this.cache[normalizedDomain][type]);
    }

    return all.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
  }

  /**
   * Get library statistics
   */
  getStats() {
    if (!this.cache) {
      return {
        totalItems: 0,
        byDomain: {},
        byType: {},
        totalWords: 0
      };
    }

    const stats = {
      totalItems: 0,
      byDomain: {},
      byType: {},
      totalWords: 0
    };

    for (const domain of Object.keys(this.cache)) {
      stats.byDomain[domain] = 0;

      for (const type of Object.keys(this.cache[domain])) {
        const items = this.cache[domain][type];
        stats.byDomain[domain] += items.length;
        stats.totalItems += items.length;

        if (!stats.byType[type]) {
          stats.byType[type] = 0;
        }
        stats.byType[type] += items.length;

        // Count words
        for (const item of items) {
          stats.totalWords += item.metadata?.wordCount || 0;
        }
      }
    }

    return stats;
  }

  /**
   * Check if similar content exists
   */
  async exists(domain, type, topic) {
    const results = await this.search({ domain, type, topic });
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Generate unique content ID
   */
  generateContentId(domain, type) {
    const prefix = type.substring(0, 3);
    const hash = crypto.randomBytes(12).toString('hex');
    return `${prefix}_${domain}_${hash}`;
  }

  /**
   * Count words in text
   */
  countWords(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).length;
  }

  /**
   * Export content as Markdown
   */
  exportMarkdown(content) {
    const { topic, content: body, metadata, generatedAt, sources } = content;

    let md = `# ${topic}\n\n`;

    if (metadata?.headline) {
      md += `**${metadata.headline}**\n\n`;
    }

    md += `${body}\n\n`;

    if (sources && sources.length > 0) {
      md += `## Sources\n\n`;
      sources.forEach((source, i) => {
        md += `${i + 1}. ${source}\n`;
      });
      md += `\n`;
    }

    md += `---\n`;
    md += `*Generated: ${new Date(generatedAt).toLocaleDateString()}*\n`;

    return md;
  }

  /**
   * Export content as HTML
   */
  exportHTML(content) {
    const { topic, content: body, metadata, generatedAt, sources } = content;

    let html = `<!DOCTYPE html>\n<html>\n<head>\n`;
    html += `  <title>${topic}</title>\n`;
    html += `  <meta charset="UTF-8">\n`;
    html += `</head>\n<body>\n`;
    html += `  <h1>${topic}</h1>\n`;

    if (metadata?.headline) {
      html += `  <p><strong>${metadata.headline}</strong></p>\n`;
    }

    html += `  <article>\n${body}</article>\n`;

    if (sources && sources.length > 0) {
      html += `  <h2>Sources</h2>\n  <ol>\n`;
      sources.forEach(source => {
        html += `    <li>${source}</li>\n`;
      });
      html += `  </ol>\n`;
    }

    html += `  <footer>\n`;
    html += `    <p><em>Generated: ${new Date(generatedAt).toLocaleDateString()}</em></p>\n`;
    html += `  </footer>\n`;
    html += `</body>\n</html>`;

    return html;
  }
}

module.exports = ContentLibrary;
