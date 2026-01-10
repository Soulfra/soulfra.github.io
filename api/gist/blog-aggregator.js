/**
 * Blog Aggregator
 *
 * Aggregates blog posts from all Soulfra domains into a master Gist
 * - Scan all domains for blog posts
 * - Sync to central Gist
 * - Generate RSS feed
 * - Cross-domain blog discovery
 *
 * Features:
 * - Markdown blog post parsing
 * - RSS/Atom feed generation
 * - Cross-domain sync
 * - Hash-based deduplication
 *
 * Usage:
 *   const aggregator = new BlogAggregator();
 *   await aggregator.scanAllDomains();
 *   const feed = await aggregator.generateRSS();
 */

class BlogAggregator {
  constructor(options = {}) {
    this.GIST_API = 'https://api.github.com/gists';
    this.mockMode = options.mockMode || false;

    // Domains to scan for blogs
    this.domains = [
      { name: 'soulfra', url: 'https://soulfra.github.io' },
      { name: 'cringeproof', url: 'https://soulfra.github.io/cringeproof' },
      { name: 'calriven', url: 'https://soulfra.github.io/calriven' },
      { name: 'deathtodata', url: 'https://soulfra.github.io/deathtodata' }
    ];

    // Blog post patterns to search for
    this.blogPatterns = [
      '/blog/**/*.html',
      '/posts/**/*.html',
      '/articles/**/*.html',
      '/**/blog-*.html',
      '/**/post-*.html'
    ];

    // Master Gist for aggregated blogs
    this.masterBlogGist = localStorage.getItem('soulfra_master_blog_gist') || null;

    this.posts = [];
  }

  /**
   * Scan all domains for blog posts
   */
  async scanAllDomains() {
    console.log('🔍 Scanning all domains for blog posts...');

    this.posts = [];

    for (const domain of this.domains) {
      try {
        const domainPosts = await this.scanDomain(domain);
        this.posts.push(...domainPosts);
        console.log(`✅ Found ${domainPosts.length} posts in ${domain.name}`);
      } catch (error) {
        console.warn(`⚠️ Error scanning ${domain.name}:`, error.message);
      }
    }

    console.log(`✅ Total posts found: ${this.posts.length}`);
    return this.posts;
  }

  /**
   * Scan a single domain for blog posts
   */
  async scanDomain(domain) {
    const posts = [];

    // In mock mode, return sample data
    if (this.mockMode) {
      return [
        {
          id: 'mock-post-1',
          domain: domain.name,
          title: `Sample Post from ${domain.name}`,
          url: `${domain.url}/blog/sample-post.html`,
          content: 'This is a sample blog post for testing.',
          date: new Date().toISOString(),
          author: 'Soulfra Team',
          tags: ['sample', 'test']
        }
      ];
    }

    // Try common blog URLs
    const commonPaths = [
      '/blog.html',
      '/blog/index.html',
      '/posts.html',
      '/articles.html'
    ];

    for (const path of commonPaths) {
      try {
        const url = domain.url + path;
        const response = await fetch(url);

        if (response.ok) {
          const html = await response.text();
          const extractedPosts = this.extractPostsFromHTML(html, domain, url);
          posts.push(...extractedPosts);
        }
      } catch (e) {
        // Path doesn't exist, continue
      }
    }

    return posts;
  }

  /**
   * Extract blog posts from HTML
   */
  extractPostsFromHTML(html, domain, pageUrl) {
    const posts = [];

    // Create temporary DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Look for common blog post patterns
    const postSelectors = [
      'article',
      '.post',
      '.blog-post',
      '[class*="post"]',
      '[class*="article"]'
    ];

    for (const selector of postSelectors) {
      const elements = doc.querySelectorAll(selector);

      elements.forEach((el, index) => {
        // Extract post data
        const titleEl = el.querySelector('h1, h2, h3, .title, [class*="title"]');
        const contentEl = el.querySelector('p, .content, [class*="content"]');
        const dateEl = el.querySelector('time, .date, [class*="date"]');
        const linkEl = el.querySelector('a');

        if (titleEl && contentEl) {
          const post = {
            id: this.generatePostId(domain.name, titleEl.textContent),
            domain: domain.name,
            title: titleEl.textContent.trim(),
            url: linkEl ? linkEl.href : pageUrl,
            content: contentEl.textContent.trim(),
            excerpt: this.createExcerpt(contentEl.textContent),
            date: dateEl ? dateEl.textContent : new Date().toISOString(),
            timestamp: Date.now(),
            author: domain.name,
            tags: this.extractTags(el),
            hash: null // Will be calculated
          };

          // Calculate content hash for deduplication
          post.hash = this.calculateSimpleHash(post.title + post.content);

          posts.push(post);
        }
      });
    }

    // If no structured posts found, try to extract from page content
    if (posts.length === 0) {
      const mainContent = doc.querySelector('main, .main, .content');
      if (mainContent) {
        const headings = mainContent.querySelectorAll('h1, h2');
        const paragraphs = mainContent.querySelectorAll('p');

        if (headings.length > 0 && paragraphs.length > 0) {
          posts.push({
            id: this.generatePostId(domain.name, headings[0].textContent),
            domain: domain.name,
            title: headings[0].textContent.trim(),
            url: pageUrl,
            content: Array.from(paragraphs).map(p => p.textContent).join('\n\n'),
            excerpt: paragraphs[0] ? this.createExcerpt(paragraphs[0].textContent) : '',
            date: new Date().toISOString(),
            timestamp: Date.now(),
            author: domain.name,
            tags: [],
            hash: null
          });
        }
      }
    }

    return posts;
  }

  /**
   * Create excerpt from content
   */
  createExcerpt(content, maxLength = 150) {
    const clean = content.trim();
    if (clean.length <= maxLength) return clean;
    return clean.substring(0, maxLength).trim() + '...';
  }

  /**
   * Extract tags from element
   */
  extractTags(element) {
    const tags = [];

    // Look for tag elements
    const tagSelectors = [
      '.tag',
      '.tags a',
      '[class*="tag"]',
      '[class*="category"]'
    ];

    for (const selector of tagSelectors) {
      const tagElements = element.querySelectorAll(selector);
      tagElements.forEach(el => {
        tags.push(el.textContent.trim().toLowerCase());
      });
    }

    return [...new Set(tags)]; // Deduplicate
  }

  /**
   * Generate post ID from domain and title
   */
  generatePostId(domain, title) {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${domain}-${slug}`;
  }

  /**
   * Calculate simple hash for deduplication
   */
  calculateSimpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Deduplicate posts by hash
   */
  deduplicatePosts(posts) {
    const seen = new Set();
    return posts.filter(post => {
      if (seen.has(post.hash)) {
        return false;
      }
      seen.add(post.hash);
      return true;
    });
  }

  /**
   * Save aggregated posts to Gist
   */
  async saveToGist() {
    console.log('💾 Saving aggregated blog posts to Gist...');

    const deduplicated = this.deduplicatePosts(this.posts);

    if (this.mockMode) {
      console.log('✅ [MOCK] Saved', deduplicated.length, 'posts');
      return { success: true, gistId: 'mock-blog-gist', count: deduplicated.length };
    }

    // Create or update Gist
    if (this.masterBlogGist) {
      // Update existing Gist
      await this.updateBlogGist(this.masterBlogGist, deduplicated);
      return {
        success: true,
        gistId: this.masterBlogGist,
        count: deduplicated.length,
        isNew: false
      };
    } else {
      // Create new Gist
      const gist = await this.createBlogGist(deduplicated);
      this.masterBlogGist = gist.id;
      localStorage.setItem('soulfra_master_blog_gist', gist.id);
      return {
        success: true,
        gistId: gist.id,
        count: deduplicated.length,
        isNew: true
      };
    }
  }

  /**
   * Create new blog Gist
   */
  async createBlogGist(posts) {
    const response = await fetch(this.GIST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        description: 'Soulfra Blog Aggregator - All Posts',
        public: true,
        files: {
          'posts.json': {
            content: JSON.stringify(posts, null, 2)
          },
          'feed.xml': {
            content: this.generateRSSFeed(posts)
          },
          'README.md': {
            content: this.generateREADME(posts)
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create blog Gist: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Update existing blog Gist
   */
  async updateBlogGist(gistId, posts) {
    const response = await fetch(`${this.GIST_API}/${gistId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        files: {
          'posts.json': {
            content: JSON.stringify(posts, null, 2)
          },
          'feed.xml': {
            content: this.generateRSSFeed(posts)
          },
          'README.md': {
            content: this.generateREADME(posts)
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update blog Gist: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Generate RSS feed
   */
  generateRSSFeed(posts) {
    const sortedPosts = posts.sort((a, b) => b.timestamp - a.timestamp);

    const items = sortedPosts.map(post => `
    <item>
      <title>${this.escapeXML(post.title)}</title>
      <link>${post.url}</link>
      <description>${this.escapeXML(post.excerpt)}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <guid>${post.url}</guid>
      <category>${post.domain}</category>
      ${post.tags.map(tag => `<category>${this.escapeXML(tag)}</category>`).join('\n      ')}
    </item>`).join('\n');

    return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Soulfra Blog Network</title>
    <link>https://soulfra.com</link>
    <description>Aggregated blog posts from Soulfra, CringeProof, Calriven, and DeathToData</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://api.github.com/gists/${this.masterBlogGist}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
  }

  /**
   * Generate README
   */
  generateREADME(posts) {
    const byDomain = {};
    posts.forEach(post => {
      if (!byDomain[post.domain]) byDomain[post.domain] = [];
      byDomain[post.domain].push(post);
    });

    let md = `# 📝 Soulfra Blog Network\n\n`;
    md += `**Total Posts:** ${posts.length}\n\n`;
    md += `**Last Updated:** ${new Date().toISOString()}\n\n`;
    md += `---\n\n`;

    Object.keys(byDomain).forEach(domain => {
      md += `## ${domain.charAt(0).toUpperCase() + domain.slice(1)}\n\n`;
      md += `${byDomain[domain].length} post(s)\n\n`;

      byDomain[domain].slice(0, 5).forEach(post => {
        md += `- [${post.title}](${post.url})\n`;
      });

      md += `\n`;
    });

    md += `---\n\n`;
    md += `📡 **RSS Feed:** Available in feed.xml\n\n`;
    md += `🔐 **Hash-Based Deduplication:** Posts are deduplicated using content hashing\n\n`;

    return md;
  }

  /**
   * Escape XML special characters
   */
  escapeXML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Get aggregator stats
   */
  getStats() {
    const byDomain = {};
    this.posts.forEach(post => {
      byDomain[post.domain] = (byDomain[post.domain] || 0) + 1;
    });

    return {
      totalPosts: this.posts.length,
      byDomain,
      gistId: this.masterBlogGist,
      lastScan: new Date().toISOString()
    };
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.BlogAggregator = BlogAggregator;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BlogAggregator;
}
