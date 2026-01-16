#!/usr/bin/env node
/**
 * GitHub API Fetcher
 *
 * Handles GitHub API requests with:
 * - Automatic pagination (gets ALL repos, not just 100)
 * - Link header parsing
 * - Rate limit handling
 * - Caching
 * - Authentication support
 *
 * Usage:
 *   const fetcher = require('./github-fetcher');
 *   const repos = await fetcher.getAllRepos('soulfra');
 */

const https = require('https');

class GitHubFetcher {
  constructor(options = {}) {
    this.token = options.token || process.env.GITHUB_TOKEN;
    this.cache = new Map();
    this.cacheTTL = options.cacheTTL || 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Parse GitHub Link header for pagination
   *
   * Example header:
   * Link: <https://api.github.com/user/repos?page=2>; rel="next",
   *       <https://api.github.com/user/repos?page=5>; rel="last"
   */
  parseLinkHeader(linkHeader) {
    if (!linkHeader) return {};

    const links = {};
    const parts = linkHeader.split(',');

    parts.forEach(part => {
      const section = part.split(';');
      if (section.length !== 2) return;

      const url = section[0].replace(/<(.*)>/, '$1').trim();
      const name = section[1].replace(/rel="(.*)"/, '$1').trim();

      links[name] = url;
    });

    return links;
  }

  /**
   * Make HTTPS request to GitHub API
   */
  async request(path, options = {}) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        hostname: 'api.github.com',
        path: path,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Soulfra-Backend',
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          ...options.headers
        }
      };

      // Add authentication if token available
      if (this.token) {
        requestOptions.headers['Authorization'] = `Bearer ${this.token}`;
      }

      https.get(requestOptions, (response) => {
        let data = '';

        response.on('data', chunk => { data += chunk; });

        response.on('end', () => {
          try {
            const parsedData = JSON.parse(data);

            // Check for rate limit
            const rateLimit = {
              limit: response.headers['x-ratelimit-limit'],
              remaining: response.headers['x-ratelimit-remaining'],
              reset: response.headers['x-ratelimit-reset']
            };

            resolve({
              data: parsedData,
              headers: response.headers,
              statusCode: response.statusCode,
              rateLimit
            });
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Fetch all pages of a paginated endpoint
   */
  async fetchAllPages(initialPath) {
    const allItems = [];
    let nextUrl = initialPath;
    let pageCount = 0;
    const maxPages = 100; // Safety limit (10,000 items max)

    console.log(`📄 Fetching GitHub API: ${initialPath}`);

    while (nextUrl && pageCount < maxPages) {
      try {
        // Extract path from full URL if needed
        const path = nextUrl.startsWith('http')
          ? new URL(nextUrl).pathname + new URL(nextUrl).search
          : nextUrl;

        const response = await this.request(path);

        if (response.statusCode !== 200) {
          console.error(`❌ GitHub API error: ${response.statusCode}`);
          break;
        }

        const items = response.data;
        allItems.push(...items);

        pageCount++;
        console.log(`  Page ${pageCount}: ${items.length} items (total: ${allItems.length})`);

        // Check rate limit
        if (response.rateLimit.remaining) {
          console.log(`  Rate limit: ${response.rateLimit.remaining}/${response.rateLimit.limit} remaining`);
        }

        // Parse Link header for next page
        const links = this.parseLinkHeader(response.headers['link']);
        nextUrl = links.next || null;

        // Alternative: if we got less than per_page items, this is the last page
        if (items.length < 100) {
          nextUrl = null;
        }

      } catch (error) {
        console.error(`❌ Error fetching page ${pageCount + 1}:`, error.message);
        break;
      }
    }

    if (pageCount >= maxPages) {
      console.warn(`⚠️ Reached safety limit of ${maxPages} pages`);
    }

    console.log(`✅ Fetched ${allItems.length} total items across ${pageCount} pages\n`);

    return allItems;
  }

  /**
   * Get ALL repositories for a user (handles pagination)
   */
  async getAllRepos(username, options = {}) {
    const cacheKey = `repos:${username}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        console.log(`📦 Using cached repos for ${username}`);
        return cached.data;
      }
    }

    // Determine which endpoint to use
    const useAuthenticated = this.token && options.includePrivate !== false;

    let path;
    if (useAuthenticated) {
      // Authenticated endpoint - gets ALL repos (public, private, archived)
      path = '/user/repos?per_page=100&sort=updated&direction=desc&affiliation=owner&visibility=all';
      console.log(`🔐 Using authenticated endpoint (gets private repos)`);
    } else {
      // Public endpoint - only public repos
      path = `/users/${username}/repos?per_page=100&sort=updated&direction=desc`;
      console.log(`🌐 Using public endpoint (no auth token)`);
    }

    // Fetch all pages
    const repos = await this.fetchAllPages(path);

    // Cache the result
    this.cache.set(cacheKey, {
      data: repos,
      timestamp: Date.now()
    });

    return repos;
  }

  /**
   * Categorize repositories
   */
  categorizeRepos(repos) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    const categories = {
      active: [],
      experiments: [],
      archived: [],
      private: [],
      forks: []
    };

    repos.forEach(repo => {
      const pushedAt = new Date(repo.pushed_at);

      const repoData = {
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        is_fork: repo.fork,
        is_private: repo.private,
        is_archived: repo.archived,
        pushed_at: repo.pushed_at,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        visibility: repo.visibility
      };

      // Primary categorization
      if (repo.archived) {
        categories.archived.push(repoData);
      } else if (pushedAt > thirtyDaysAgo) {
        categories.active.push(repoData);
      } else {
        categories.experiments.push(repoData);
      }

      // Secondary categorizations
      if (repo.private) {
        categories.private.push(repoData);
      }
      if (repo.fork) {
        categories.forks.push(repoData);
      }
    });

    return {
      success: true,
      total_repos: repos.length,
      categories,
      counts: {
        total: repos.length,
        active: categories.active.length,
        experiments: categories.experiments.length,
        archived: categories.archived.length,
        private: categories.private.length,
        forks: categories.forks.length
      }
    };
  }

  /**
   * Get ALL repos and categorize them
   */
  async getReposSummary(username, options = {}) {
    try {
      const repos = await this.getAllRepos(username, options);
      const categorized = this.categorizeRepos(repos);

      return {
        success: true,
        data: categorized,
        metadata: {
          timestamp: new Date().toISOString(),
          cached: false,
          authenticated: !!this.token
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GITHUB_FETCH_ERROR',
          message: error.message
        }
      };
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }
}

// Export singleton instance
const fetcher = new GitHubFetcher();

module.exports = fetcher;

// CLI usage
if (require.main === module) {
  const username = process.argv[2] || 'soulfra';

  (async () => {
    console.log(`\n🚀 Fetching ALL repos for ${username}...\n`);

    const result = await fetcher.getReposSummary(username);

    if (result.success) {
      console.log('\n📊 Summary:');
      console.log(`   Total repos: ${result.data.total_repos}`);
      console.log(`   Active (30d): ${result.data.counts.active}`);
      console.log(`   Experiments: ${result.data.counts.experiments}`);
      console.log(`   Archived: ${result.data.counts.archived}`);
      console.log(`   Private: ${result.data.counts.private}`);
      console.log(`   Forks: ${result.data.counts.forks}`);
      console.log(`   Authenticated: ${result.metadata.authenticated}\n`);
    } else {
      console.error('\n❌ Error:', result.error.message, '\n');
    }
  })();
}
