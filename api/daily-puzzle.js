#!/usr/bin/env node
/**
 * Daily Puzzle Generator
 *
 * Generates deterministic daily puzzles (like NYT Wordle)
 * Same date = same puzzle for everyone
 *
 * Features:
 * - Date-based seeding (everyone gets same puzzle)
 * - Rotation through domain portfolio
 * - Difficulty balancing (mix easy/medium/hard)
 * - Historical puzzle archive
 * - Puzzle preview (for planning)
 *
 * Usage:
 *   const DailyPuzzle = require('./daily-puzzle');
 *   const puzzle = new DailyPuzzle();
 *
 *   // Get today's puzzle
 *   const today = puzzle.getTodaysPuzzle();
 *   console.log(`Today's domain: ${today.domain.name}`);
 *   console.log(`Emoji clue: ${today.domain.emoji.art}`);
 */

const crypto = require('crypto');
const DomainPortfolio = require('./domain-portfolio');

class DailyPuzzle {
  constructor(options = {}) {
    this.verbose = options.verbose || false;

    // Initialize domain portfolio
    this.portfolio = new DomainPortfolio();

    // Seed for puzzle generation (NEVER change this!)
    this.masterSeed = options.masterSeed || 'soulfra-daily-puzzle-2026';

    // Start date (epoch for puzzle numbering)
    this.startDate = new Date('2026-01-01T00:00:00Z');

    console.log('📅 DailyPuzzle initialized');
    console.log(`   Available domains: ${Object.keys(this.portfolio.portfolio.domains).length}`);
  }

  /**
   * Get puzzle number for a date
   * Puzzle #1 = Jan 1, 2026
   * Puzzle #2 = Jan 2, 2026, etc.
   */
  getPuzzleNumber(date = new Date()) {
    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);

    const start = new Date(this.startDate);
    start.setUTCHours(0, 0, 0, 0);

    const diffTime = targetDate - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays + 1; // Puzzle #1 starts on day 1
  }

  /**
   * Get deterministic domain for puzzle number
   * Uses cryptographic hash to ensure determinism
   */
  getDomainForPuzzle(puzzleNumber) {
    const domains = Object.values(this.portfolio.portfolio.domains);

    if (domains.length === 0) {
      throw new Error('No domains in portfolio');
    }

    // Create deterministic hash from puzzle number + master seed
    const hash = crypto
      .createHash('sha256')
      .update(`${this.masterSeed}-puzzle-${puzzleNumber}`)
      .digest('hex');

    // Convert hash to index
    const hashNum = parseInt(hash.substring(0, 8), 16);
    const index = hashNum % domains.length;

    return domains[index];
  }

  /**
   * Get today's puzzle
   */
  getTodaysPuzzle() {
    const puzzleNumber = this.getPuzzleNumber();
    const domain = this.getDomainForPuzzle(puzzleNumber);

    return {
      puzzleNumber,
      date: new Date().toISOString().split('T')[0],
      domain: {
        name: domain.name,
        baseName: domain.baseName,
        emoji: domain.emoji,
        category: domain.game.category,
        difficulty: domain.game.difficulty,
        hints: domain.game.hints,
        maxAttempts: domain.game.maxAttempts,
        redirectURL: domain.meta.redirectURL
      },
      shareText: this.generateShareText(puzzleNumber, domain)
    };
  }

  /**
   * Get puzzle for specific date
   */
  getPuzzleForDate(dateString) {
    const date = new Date(dateString);
    const puzzleNumber = this.getPuzzleNumber(date);
    const domain = this.getDomainForPuzzle(puzzleNumber);

    return {
      puzzleNumber,
      date: dateString,
      domain: {
        name: domain.name,
        baseName: domain.baseName,
        emoji: domain.emoji,
        category: domain.game.category,
        difficulty: domain.game.difficulty,
        hints: domain.game.hints,
        maxAttempts: domain.game.maxAttempts,
        redirectURL: domain.meta.redirectURL
      }
    };
  }

  /**
   * Get upcoming puzzles (for planning)
   */
  getUpcomingPuzzles(days = 7) {
    const puzzles = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];

      const puzzleNumber = this.getPuzzleNumber(date);
      const domain = this.getDomainForPuzzle(puzzleNumber);

      puzzles.push({
        puzzleNumber,
        date: dateString,
        domain: domain.name,
        emoji: domain.emoji.art,
        difficulty: domain.game.difficulty
      });
    }

    return puzzles;
  }

  /**
   * Get past puzzles (archive)
   */
  getPastPuzzles(days = 7) {
    const puzzles = [];
    const today = new Date();

    for (let i = days; i >= 1; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      const puzzleNumber = this.getPuzzleNumber(date);
      const domain = this.getDomainForPuzzle(puzzleNumber);

      puzzles.push({
        puzzleNumber,
        date: dateString,
        domain: domain.name,
        emoji: domain.emoji.art,
        difficulty: domain.game.difficulty
      });
    }

    return puzzles;
  }

  /**
   * Generate shareable text (like Wordle)
   */
  generateShareText(puzzleNumber, domain) {
    return `Soulfra #${puzzleNumber}\n${domain.emoji.art}\n\nPlay at: soulfra.com/game`;
  }

  /**
   * Validate that puzzle rotation is balanced
   */
  analyzePuzzleDistribution(days = 30) {
    const distribution = {
      byDifficulty: { easy: 0, medium: 0, hard: 0 },
      byCategory: {},
      domains: {}
    };

    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      const puzzleNumber = this.getPuzzleNumber(date);
      const domain = this.getDomainForPuzzle(puzzleNumber);

      // Count by difficulty
      distribution.byDifficulty[domain.game.difficulty]++;

      // Count by category
      const category = domain.game.category;
      distribution.byCategory[category] = (distribution.byCategory[category] || 0) + 1;

      // Count domain appearances
      distribution.domains[domain.name] = (distribution.domains[domain.name] || 0) + 1;
    }

    return distribution;
  }

  /**
   * Test puzzle generation (verify determinism)
   */
  testDeterminism() {
    console.log('\n🧪 Testing Puzzle Determinism...\n');

    const testDate = '2026-01-10';

    // Generate puzzle 3 times
    const puzzle1 = this.getPuzzleForDate(testDate);
    const puzzle2 = this.getPuzzleForDate(testDate);
    const puzzle3 = this.getPuzzleForDate(testDate);

    const isDeterministic =
      puzzle1.domain.name === puzzle2.domain.name &&
      puzzle2.domain.name === puzzle3.domain.name;

    console.log(`Date: ${testDate}`);
    console.log(`Puzzle #: ${puzzle1.puzzleNumber}`);
    console.log(`Domain (1st): ${puzzle1.domain.name}`);
    console.log(`Domain (2nd): ${puzzle2.domain.name}`);
    console.log(`Domain (3rd): ${puzzle3.domain.name}`);
    console.log(`\nDeterministic: ${isDeterministic ? '✅ YES' : '❌ NO'}\n`);

    if (isDeterministic) {
      console.log('✅ Puzzle generation is deterministic!');
      console.log('   Same date → Same puzzle (always)\n');
    } else {
      console.error('❌ Puzzle generation is NOT deterministic!');
      console.error('   This is a critical bug - fix immediately!\n');
    }

    return isDeterministic;
  }
}

// CLI Mode
if (require.main === module) {
  const puzzle = new DailyPuzzle({ verbose: true });

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║          📅 Daily Puzzle Generator                        ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const command = process.argv[2];

  if (!command || command === 'today') {
    // Show today's puzzle
    const today = puzzle.getTodaysPuzzle();

    console.log(`📅 Today's Puzzle (#${today.puzzleNumber})`);
    console.log(`Date: ${today.date}\n`);

    console.log(`🎯 Domain: ${today.domain.name}`);
    console.log(`🎨 Emoji Clue: ${today.domain.emoji.art}`);
    console.log(`📊 Difficulty: ${today.domain.difficulty}`);
    console.log(`📂 Category: ${today.domain.category}`);
    console.log(`🔢 Max Attempts: ${today.domain.maxAttempts}`);
    console.log(`🔗 Redirect: ${today.domain.redirectURL}\n`);

    console.log(`📱 Share Text:`);
    console.log(`${today.shareText}\n`);
  } else if (command === 'upcoming') {
    const days = parseInt(process.argv[3]) || 7;
    const puzzles = puzzle.getUpcomingPuzzles(days);

    console.log(`📅 Next ${days} Puzzles:\n`);
    puzzles.forEach(p => {
      console.log(`#${p.puzzleNumber} | ${p.date} | ${p.emoji} ${p.domain} (${p.difficulty})`);
    });
    console.log('');
  } else if (command === 'past') {
    const days = parseInt(process.argv[3]) || 7;
    const puzzles = puzzle.getPastPuzzles(days);

    console.log(`📅 Past ${days} Puzzles:\n`);
    puzzles.forEach(p => {
      console.log(`#${p.puzzleNumber} | ${p.date} | ${p.emoji} ${p.domain} (${p.difficulty})`);
    });
    console.log('');
  } else if (command === 'distribution') {
    const days = parseInt(process.argv[3]) || 30;
    const dist = puzzle.analyzePuzzleDistribution(days);

    console.log(`📊 Puzzle Distribution (next ${days} days):\n`);

    console.log('By Difficulty:');
    Object.entries(dist.byDifficulty).forEach(([diff, count]) => {
      const percentage = ((count / days) * 100).toFixed(1);
      console.log(`  ${diff}: ${count} (${percentage}%)`);
    });

    console.log('\nBy Category:');
    Object.entries(dist.byCategory).forEach(([cat, count]) => {
      const percentage = ((count / days) * 100).toFixed(1);
      console.log(`  ${cat}: ${count} (${percentage}%)`);
    });

    console.log('\nBy Domain:');
    Object.entries(dist.domains)
      .sort((a, b) => b[1] - a[1])
      .forEach(([domain, count]) => {
        const percentage = ((count / days) * 100).toFixed(1);
        console.log(`  ${domain}: ${count} (${percentage}%)`);
      });
    console.log('');
  } else if (command === 'test') {
    puzzle.testDeterminism();
  } else if (command === 'date') {
    const dateString = process.argv[3];
    if (!dateString) {
      console.error('❌ Please provide a date (YYYY-MM-DD)');
      process.exit(1);
    }

    const p = puzzle.getPuzzleForDate(dateString);
    console.log(`📅 Puzzle for ${dateString} (#${p.puzzleNumber}):\n`);
    console.log(`Domain: ${p.domain.name}`);
    console.log(`Emoji: ${p.domain.emoji.art}`);
    console.log(`Difficulty: ${p.domain.difficulty}\n`);
  } else {
    console.log('Usage:');
    console.log('  node daily-puzzle.js                   # Show today\'s puzzle');
    console.log('  node daily-puzzle.js upcoming [days]   # Show upcoming puzzles');
    console.log('  node daily-puzzle.js past [days]       # Show past puzzles');
    console.log('  node daily-puzzle.js distribution [days] # Analyze distribution');
    console.log('  node daily-puzzle.js test              # Test determinism');
    console.log('  node daily-puzzle.js date YYYY-MM-DD   # Get puzzle for date');
    process.exit(0);
  }
}

module.exports = DailyPuzzle;
