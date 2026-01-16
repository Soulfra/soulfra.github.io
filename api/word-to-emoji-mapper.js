#!/usr/bin/env node
/**
 * Word → Emoji Deterministic Mapper
 *
 * Maps words to emojis deterministically (like a visual hash/seed)
 * Same word always produces same emoji
 *
 * Creates visual "fingerprints" of text/audio transcripts
 * Generates creative emoji art from spoken words
 *
 * Usage:
 *   const WordToEmojiMapper = require('./word-to-emoji-mapper');
 *   const mapper = new WordToEmojiMapper();
 *
 *   const art = mapper.textToEmojiArt("Hello world, this is a test");
 *   // → "👋 🌍 📍 ✨ 🅰️ 🧪"
 */

const crypto = require('crypto');

class WordToEmojiMapper {
  constructor(options = {}) {
    this.seed = options.seed || 'soulfra-creative-2026';
    this.preservePunctuation = options.preservePunctuation !== false;

    // Curated emoji sets by category for better visual variety
    this.emojiCategories = {
      common: ['👋', '❤️', '✨', '🎉', '🔥', '💯', '👌', '🙌', '💪', '🎯'],
      nature: ['🌍', '🌊', '🌈', '🌸', '🌳', '🍃', '🦋', '🐝', '🌞', '🌙'],
      creative: ['🎨', '🎭', '🎪', '🎬', '🎵', '🎸', '🎹', '🎤', '🎧', '📸'],
      tech: ['💻', '📱', '🖥️', '⌨️', '🖱️', '💾', '📡', '🔌', '🔋', '🌐'],
      symbols: ['⭐', '💎', '🔮', '🎁', '🏆', '🎯', '🔑', '💡', '🔔', '📌'],
      emotions: ['😊', '😍', '🤔', '😎', '🥳', '😇', '🤗', '😌', '🙏', '💭'],
      objects: ['📚', '✏️', '📝', '📋', '📍', '🎪', '🏠', '🌆', '🗝️', '⚡'],
      letters: ['🅰️', '🅱️', '©️', '🆔', '🅾️', '🆚', '🔤', '🔡', '🔠', '🆕'],
      science: ['🧪', '🔬', '🧬', '🔭', '🌡️', '⚗️', '🧲', '💉', '🩺', '🧠'],
      time: ['⏰', '⏱️', '⌛', '⏳', '📅', '📆', '🕐', '🕑', '🕒', '🕓']
    };

    // Flatten all emojis into single array
    this.allEmojis = Object.values(this.emojiCategories).flat();

    console.log(`🎨 WordToEmojiMapper initialized`);
    console.log(`   Total emojis: ${this.allEmojis.length}`);
    console.log(`   Seed: ${this.seed}`);
  }

  /**
   * Convert text to emoji art
   */
  textToEmojiArt(text, options = {}) {
    const preserveSpaces = options.preserveSpaces !== false;
    const words = this.tokenize(text);

    const emojiSequence = words.map(token => {
      if (token.isWord) {
        return this.wordToEmoji(token.text);
      } else if (preserveSpaces && token.isSpace) {
        return ' ';
      } else if (this.preservePunctuation && token.isPunctuation) {
        return token.text;
      }
      return '';
    }).filter(e => e);

    return emojiSequence.join('');
  }

  /**
   * Convert single word to emoji (deterministic)
   */
  wordToEmoji(word) {
    // Normalize word (lowercase for consistency)
    const normalized = word.toLowerCase().trim();

    if (!normalized) return '';

    // Create deterministic hash from word + seed
    const hash = crypto
      .createHash('sha256')
      .update(this.seed + normalized)
      .digest('hex');

    // Convert first 8 chars of hash to number
    const hashNum = parseInt(hash.substring(0, 8), 16);

    // Map to emoji index
    const emojiIndex = hashNum % this.allEmojis.length;

    return this.allEmojis[emojiIndex];
  }

  /**
   * Tokenize text into words, spaces, punctuation
   */
  tokenize(text) {
    const tokens = [];
    let currentWord = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (/[a-zA-Z0-9']/.test(char)) {
        // Part of word
        currentWord += char;
      } else {
        // Not part of word
        if (currentWord) {
          tokens.push({ text: currentWord, isWord: true });
          currentWord = '';
        }

        if (char === ' ') {
          tokens.push({ text: ' ', isSpace: true });
        } else if (/[.,!?;:'"()-]/.test(char)) {
          tokens.push({ text: char, isPunctuation: true });
        }
      }
    }

    // Don't forget last word
    if (currentWord) {
      tokens.push({ text: currentWord, isWord: true });
    }

    return tokens;
  }

  /**
   * Get detailed mapping (word → emoji with hash info)
   */
  getWordMapping(word) {
    const normalized = word.toLowerCase().trim();
    const hash = crypto
      .createHash('sha256')
      .update(this.seed + normalized)
      .digest('hex');

    const hashNum = parseInt(hash.substring(0, 8), 16);
    const emojiIndex = hashNum % this.allEmojis.length;
    const emoji = this.allEmojis[emojiIndex];

    return {
      word: normalized,
      emoji,
      hash: hash.substring(0, 16), // First 16 chars
      emojiIndex,
      deterministic: true
    };
  }

  /**
   * Generate visual fingerprint from text
   * Returns structured data for creative visualization
   */
  generateFingerprint(text) {
    const words = this.tokenize(text).filter(t => t.isWord);
    const wordMappings = words.map(w => this.getWordMapping(w.text));
    const emojiSequence = wordMappings.map(m => m.emoji);

    // Calculate fingerprint hash
    const fingerprintHash = crypto
      .createHash('sha256')
      .update(emojiSequence.join(''))
      .digest('hex');

    return {
      originalText: text,
      wordCount: words.length,
      emojiSequence: emojiSequence.join(' '),
      fingerprint: fingerprintHash,
      mappings: wordMappings,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Verify fingerprint (prove deterministic mapping)
   */
  verifyFingerprint(text, expectedFingerprint) {
    const generated = this.generateFingerprint(text);
    return {
      valid: generated.fingerprint === expectedFingerprint,
      expected: expectedFingerprint,
      actual: generated.fingerprint,
      match: generated.fingerprint === expectedFingerprint ? '✅' : '❌'
    };
  }

  /**
   * Create animated emoji art (returns frames for animation)
   */
  createAnimatedArt(text, options = {}) {
    const frames = options.frames || 5;
    const variants = [];

    for (let i = 0; i < frames; i++) {
      // Create variant by slightly modifying seed
      const variantMapper = new WordToEmojiMapper({
        seed: `${this.seed}-frame-${i}`
      });
      variants.push({
        frame: i,
        art: variantMapper.textToEmojiArt(text),
        delay: options.delay || 200 // ms
      });
    }

    return variants;
  }

  /**
   * Get emoji stats from text
   */
  getStats(text) {
    const fingerprint = this.generateFingerprint(text);
    const emojiArray = fingerprint.emojiSequence.split(' ');

    // Count unique emojis
    const uniqueEmojis = [...new Set(emojiArray)];

    // Count emoji frequency
    const frequency = {};
    emojiArray.forEach(emoji => {
      frequency[emoji] = (frequency[emoji] || 0) + 1;
    });

    return {
      totalWords: fingerprint.wordCount,
      totalEmojis: emojiArray.length,
      uniqueEmojis: uniqueEmojis.length,
      mostCommon: Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([emoji, count]) => ({ emoji, count })),
      diversity: (uniqueEmojis.length / emojiArray.length * 100).toFixed(2) + '%'
    };
  }

  /**
   * Export fingerprint as embeddable HTML
   */
  exportAsHTML(text, options = {}) {
    const fingerprint = this.generateFingerprint(text);
    const style = options.style || 'default';

    const css = this.getStyleCSS(style);

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Emoji Art: ${text.substring(0, 30)}...</title>
    <style>${css}</style>
</head>
<body>
    <div class="emoji-art">
        <h1 class="emoji-sequence">${fingerprint.emojiSequence}</h1>
        <p class="original-text">"${text}"</p>
        <p class="fingerprint">Fingerprint: ${fingerprint.fingerprint.substring(0, 16)}...</p>
        <p class="metadata">Generated: ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>`;
  }

  /**
   * Get CSS styles for different visual themes
   */
  getStyleCSS(style) {
    const styles = {
      default: `
        body {
          font-family: 'Segoe UI', system-ui, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
        }
        .emoji-art {
          text-align: center;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 60px;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .emoji-sequence {
          font-size: 3em;
          line-height: 1.5;
          margin: 20px 0;
          letter-spacing: 0.1em;
        }
        .original-text {
          font-size: 1.2em;
          opacity: 0.9;
          font-style: italic;
        }
        .fingerprint, .metadata {
          font-size: 0.9em;
          opacity: 0.7;
          font-family: monospace;
        }
      `,
      minimal: `
        body { margin: 0; padding: 40px; font-family: monospace; }
        .emoji-sequence { font-size: 4em; letter-spacing: 0.2em; }
        .original-text { color: #666; }
      `,
      neon: `
        body {
          background: #000;
          color: #0f0;
          font-family: 'Courier New', monospace;
        }
        .emoji-art { text-align: center; padding: 60px; }
        .emoji-sequence {
          font-size: 3em;
          text-shadow: 0 0 10px #0f0, 0 0 20px #0f0;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `
    };

    return styles[style] || styles.default;
  }
}

// CLI Mode
if (require.main === module) {
  const mapper = new WordToEmojiMapper();

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║       🎨 Word → Emoji Mapper - Visual Art Generator       ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const testText = process.argv.slice(2).join(' ') || "I love creative coding";

  console.log(`Input: "${testText}"\n`);

  // Generate emoji art
  const art = mapper.textToEmojiArt(testText);
  console.log('🎨 Emoji Art:');
  console.log(`   ${art}\n`);

  // Get fingerprint
  const fingerprint = mapper.generateFingerprint(testText);
  console.log('🔑 Fingerprint:');
  console.log(`   Hash: ${fingerprint.fingerprint.substring(0, 32)}...`);
  console.log(`   Words: ${fingerprint.wordCount}\n`);

  // Show mappings
  console.log('📊 Word Mappings:');
  fingerprint.mappings.forEach(m => {
    console.log(`   ${m.word.padEnd(15)} → ${m.emoji}  (hash: ${m.hash})`);
  });

  // Stats
  console.log('\n📈 Stats:');
  const stats = mapper.getStats(testText);
  Object.entries(stats).forEach(([key, value]) => {
    if (key === 'mostCommon') {
      console.log(`   ${key}: ${value.map(v => `${v.emoji}(${v.count})`).join(', ')}`);
    } else {
      console.log(`   ${key}: ${value}`);
    }
  });

  // Verification demo
  console.log('\n✅ Verification:');
  const verification = mapper.verifyFingerprint(testText, fingerprint.fingerprint);
  console.log(`   Deterministic: ${verification.match}`);
  console.log(`   Same input → Same output: ${verification.valid ? 'YES' : 'NO'}`);
}

module.exports = WordToEmojiMapper;
