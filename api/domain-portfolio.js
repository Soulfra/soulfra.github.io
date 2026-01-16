#!/usr/bin/env node
/**
 * Domain Portfolio Manager
 *
 * Manages domain portfolio for emoji-based word games
 * Each domain gets a unique emoji fingerprint for puzzles
 *
 * Game Strategy:
 * - Daily puzzles feature owned domains as answers
 * - Users guess domain from emoji clues
 * - Winners get redirected to actual domain
 * - Viral sharing drives traffic (NYT Wordle model)
 *
 * Usage:
 *   const DomainPortfolio = require('./domain-portfolio');
 *   const portfolio = new DomainPortfolio();
 *
 *   // Add domain
 *   portfolio.addDomain('ritual.com', {
 *     category: 'lifestyle',
 *     difficulty: 'easy',
 *     redirectURL: 'https://ritual.com'
 *   });
 *
 *   // Get emoji fingerprint
 *   const emoji = portfolio.getDomainEmoji('ritual.com');
 */

const fs = require('fs');
const path = require('path');
const WordToEmojiMapper = require('./word-to-emoji-mapper');

class DomainPortfolio {
  constructor(options = {}) {
    this.verbose = options.verbose || false;

    // Initialize emoji mapper
    this.mapper = new WordToEmojiMapper();

    // Paths
    this.dataDir = path.join(__dirname, '../data');
    this.portfolioFile = path.join(this.dataDir, 'domain-portfolio.json');

    // Load portfolio
    this.portfolio = this.loadPortfolio();

    console.log('🌐 DomainPortfolio initialized');
    console.log(`   Domains: ${Object.keys(this.portfolio.domains).length}`);
  }

  /**
   * Load portfolio from disk
   */
  loadPortfolio() {
    if (fs.existsSync(this.portfolioFile)) {
      return JSON.parse(fs.readFileSync(this.portfolioFile, 'utf-8'));
    }

    // Initialize empty portfolio
    return {
      domains: {},
      categories: {
        lifestyle: [],
        tech: [],
        creative: [],
        business: [],
        entertainment: [],
        education: [],
        other: []
      },
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Save portfolio to disk
   */
  savePortfolio() {
    this.portfolio.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.portfolioFile, JSON.stringify(this.portfolio, null, 2));
  }

  /**
   * Add domain to portfolio
   */
  addDomain(domainName, options = {}) {
    console.log(`\n🌐 Adding domain: ${domainName}`);

    // Normalize domain name
    const normalized = domainName.toLowerCase().trim();

    // Extract base name (without .com)
    const baseName = normalized.replace(/\.(com|net|org|io|co|app|xyz|ai)$/, '');

    // Generate emoji fingerprint
    const emojiArt = this.mapper.textToEmojiArt(baseName);
    const fingerprint = this.mapper.generateFingerprint(baseName);

    // Calculate difficulty based on length and complexity
    const difficulty = this.calculateDifficulty(baseName);

    const domain = {
      name: normalized,
      baseName,
      addedAt: new Date().toISOString(),

      // Emoji identification
      emoji: {
        art: emojiArt,
        fingerprint: fingerprint.fingerprint,
        emojiCount: emojiArt.split(' ').length,
        wordCount: baseName.split(/[-_\s]/).length
      },

      // Game properties
      game: {
        difficulty,
        category: options.category || 'other',
        hints: options.hints || this.generateHints(baseName),
        maxAttempts: difficulty === 'easy' ? 6 : difficulty === 'medium' ? 5 : 4
      },

      // Domain properties
      meta: {
        redirectURL: options.redirectURL || `https://${normalized}`,
        description: options.description || '',
        tags: options.tags || [],
        isOwned: options.isOwned !== false,
        monetization: options.monetization || 'redirect'
      },

      // Stats
      stats: {
        timesPlayed: 0,
        timesSolved: 0,
        averageAttempts: 0,
        successRate: 0
      }
    };

    // Add to portfolio
    this.portfolio.domains[normalized] = domain;

    // Add to category
    const category = domain.game.category;
    if (this.portfolio.categories[category]) {
      if (!this.portfolio.categories[category].includes(normalized)) {
        this.portfolio.categories[category].push(normalized);
      }
    }

    this.savePortfolio();

    console.log(`   ✅ Added: ${normalized}`);
    console.log(`   Emoji: ${emojiArt}`);
    console.log(`   Difficulty: ${difficulty}`);
    console.log(`   Category: ${category}`);

    return domain;
  }

  /**
   * Calculate difficulty based on domain characteristics
   */
  calculateDifficulty(baseName) {
    const length = baseName.length;
    const words = baseName.split(/[-_\s]/).length;
    const hasNumbers = /\d/.test(baseName);

    if (length <= 6 && words === 1 && !hasNumbers) {
      return 'easy';
    } else if (length <= 12 && words <= 2) {
      return 'medium';
    } else {
      return 'hard';
    }
  }

  /**
   * Generate hints for domain
   */
  generateHints(baseName) {
    return [
      `${baseName.length} letters`,
      `Starts with "${baseName[0].toUpperCase()}"`,
      `Category hint available after 3 tries`
    ];
  }

  /**
   * Get domain by name
   */
  getDomain(domainName) {
    const normalized = domainName.toLowerCase().trim();
    return this.portfolio.domains[normalized] || null;
  }

  /**
   * Get domain emoji
   */
  getDomainEmoji(domainName) {
    const domain = this.getDomain(domainName);
    return domain ? domain.emoji.art : null;
  }

  /**
   * Get all domains in category
   */
  getDomainsByCategory(category) {
    const domainNames = this.portfolio.categories[category] || [];
    return domainNames.map(name => this.portfolio.domains[name]).filter(d => d);
  }

  /**
   * Get random domain (for testing)
   */
  getRandomDomain(options = {}) {
    const { category, difficulty } = options;

    let domains = Object.values(this.portfolio.domains);

    if (category) {
      domains = domains.filter(d => d.game.category === category);
    }

    if (difficulty) {
      domains = domains.filter(d => d.game.difficulty === difficulty);
    }

    if (domains.length === 0) {
      return null;
    }

    return domains[Math.floor(Math.random() * domains.length)];
  }

  /**
   * Search domains
   */
  searchDomains(query) {
    const normalized = query.toLowerCase().trim();
    return Object.values(this.portfolio.domains).filter(domain => {
      return domain.name.includes(normalized) ||
             domain.baseName.includes(normalized) ||
             domain.emoji.art.includes(normalized) ||
             domain.game.category.includes(normalized);
    });
  }

  /**
   * Update domain stats (after game play)
   */
  updateStats(domainName, played, solved, attempts) {
    const domain = this.getDomain(domainName);
    if (!domain) return;

    if (played) {
      domain.stats.timesPlayed++;
    }

    if (solved) {
      domain.stats.timesSolved++;

      // Update average attempts
      const totalAttempts = (domain.stats.averageAttempts * (domain.stats.timesSolved - 1)) + attempts;
      domain.stats.averageAttempts = Math.round(totalAttempts / domain.stats.timesSolved);
    }

    // Update success rate
    domain.stats.successRate = domain.stats.timesPlayed > 0
      ? Math.round((domain.stats.timesSolved / domain.stats.timesPlayed) * 100)
      : 0;

    this.savePortfolio();
  }

  /**
   * Get portfolio summary
   */
  getSummary() {
    const domains = Object.values(this.portfolio.domains);

    const summary = {
      totalDomains: domains.length,
      byCategory: {},
      byDifficulty: {
        easy: 0,
        medium: 0,
        hard: 0
      },
      mostPlayed: [],
      bestPerforming: []
    };

    // Count by category
    Object.keys(this.portfolio.categories).forEach(cat => {
      summary.byCategory[cat] = this.portfolio.categories[cat].length;
    });

    // Count by difficulty
    domains.forEach(domain => {
      summary.byDifficulty[domain.game.difficulty]++;
    });

    // Most played
    summary.mostPlayed = domains
      .sort((a, b) => b.stats.timesPlayed - a.stats.timesPlayed)
      .slice(0, 10)
      .map(d => ({
        name: d.name,
        plays: d.stats.timesPlayed,
        emoji: d.emoji.art
      }));

    // Best performing (highest success rate)
    summary.bestPerforming = domains
      .filter(d => d.stats.timesPlayed > 0)
      .sort((a, b) => b.stats.successRate - a.stats.successRate)
      .slice(0, 10)
      .map(d => ({
        name: d.name,
        successRate: d.stats.successRate,
        emoji: d.emoji.art
      }));

    return summary;
  }

  /**
   * Export portfolio for game use
   */
  exportForGame() {
    const domains = Object.values(this.portfolio.domains);

    return domains.map(d => ({
      name: d.name,
      baseName: d.baseName,
      emoji: d.emoji.art,
      category: d.game.category,
      difficulty: d.game.difficulty,
      hints: d.game.hints,
      maxAttempts: d.game.maxAttempts,
      redirectURL: d.meta.redirectURL
    }));
  }

  /**
   * Delete domain
   */
  deleteDomain(domainName) {
    const normalized = domainName.toLowerCase().trim();
    const domain = this.portfolio.domains[normalized];

    if (!domain) {
      throw new Error(`Domain not found: ${domainName}`);
    }

    // Remove from category
    const category = domain.game.category;
    if (this.portfolio.categories[category]) {
      this.portfolio.categories[category] = this.portfolio.categories[category]
        .filter(name => name !== normalized);
    }

    // Remove from domains
    delete this.portfolio.domains[normalized];

    this.savePortfolio();

    console.log(`🗑️  Deleted domain: ${normalized}`);
  }
}

// CLI Mode
if (require.main === module) {
  const portfolio = new DomainPortfolio({ verbose: true });

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║        🌐 Domain Portfolio Manager                        ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const command = process.argv[2];
  const domainName = process.argv[3];

  if (!command) {
    console.log('Usage:');
    console.log('  node domain-portfolio.js add <domain> [category]');
    console.log('  node domain-portfolio.js list [category]');
    console.log('  node domain-portfolio.js show <domain>');
    console.log('  node domain-portfolio.js summary');
    console.log('  node domain-portfolio.js delete <domain>');
    console.log('\nExamples:');
    console.log('  node domain-portfolio.js add ritual.com lifestyle');
    console.log('  node domain-portfolio.js add cringeproof.com tech');
    console.log('  node domain-portfolio.js list lifestyle');
    console.log('  node domain-portfolio.js show ritual.com');
    process.exit(0);
  }

  if (command === 'add' && domainName) {
    const category = process.argv[4] || 'other';
    portfolio.addDomain(domainName, { category });
    console.log('\n✅ Domain added to portfolio!');
  } else if (command === 'list') {
    const category = domainName;
    const domains = category
      ? portfolio.getDomainsByCategory(category)
      : Object.values(portfolio.portfolio.domains);

    console.log(`\n🌐 Domains${category ? ` in "${category}"` : ''}: ${domains.length}\n`);
    domains.forEach((d, i) => {
      console.log(`${i + 1}. ${d.name}`);
      console.log(`   Emoji: ${d.emoji.art}`);
      console.log(`   Difficulty: ${d.game.difficulty}`);
      console.log(`   Category: ${d.game.category}`);
      console.log(`   Plays: ${d.stats.timesPlayed} | Success: ${d.stats.successRate}%`);
      console.log('');
    });
  } else if (command === 'show' && domainName) {
    const domain = portfolio.getDomain(domainName);
    if (!domain) {
      console.error(`❌ Domain not found: ${domainName}`);
      process.exit(1);
    }

    console.log('\n📋 Domain Details:\n');
    console.log(JSON.stringify(domain, null, 2));
  } else if (command === 'summary') {
    const summary = portfolio.getSummary();
    console.log('\n📊 Portfolio Summary:\n');
    console.log(`Total Domains: ${summary.totalDomains}\n`);

    console.log('By Category:');
    Object.entries(summary.byCategory).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });

    console.log('\nBy Difficulty:');
    Object.entries(summary.byDifficulty).forEach(([diff, count]) => {
      console.log(`  ${diff}: ${count}`);
    });

    if (summary.mostPlayed.length > 0) {
      console.log('\nMost Played:');
      summary.mostPlayed.slice(0, 5).forEach((d, i) => {
        console.log(`  ${i + 1}. ${d.emoji} ${d.name} (${d.plays} plays)`);
      });
    }

    if (summary.bestPerforming.length > 0) {
      console.log('\nBest Performing:');
      summary.bestPerforming.slice(0, 5).forEach((d, i) => {
        console.log(`  ${i + 1}. ${d.emoji} ${d.name} (${d.successRate}% success)`);
      });
    }
  } else if (command === 'delete' && domainName) {
    portfolio.deleteDomain(domainName);
    console.log('\n✅ Domain deleted!');
  } else {
    console.error('❌ Invalid command or missing arguments');
    process.exit(1);
  }
}

module.exports = DomainPortfolio;
