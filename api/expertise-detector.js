/**
 * Expertise Detector
 *
 * Analyzes user messages to determine technical skill level
 * Used for adaptive learning routing (like WordPress Hello World)
 *
 * Levels:
 * - beginner: Learning basics, needs simple explanations
 * - intermediate: Understands fundamentals, needs practical guidance
 * - expert: Deep knowledge, needs technical details and edge cases
 */

class ExpertiseDetector {
  constructor() {
    // Keywords that indicate different expertise levels
    this.expertKeywords = [
      'optimization', 'performance', 'architecture', 'scalability',
      'refactor', 'design pattern', 'algorithm', 'complexity',
      'asynchronous', 'concurrency', 'async/await', 'callback hell',
      'dependency injection', 'middleware', 'pipeline', 'stream',
      'race condition', 'deadlock', 'mutex', 'semaphore',
      'immutable', 'pure function', 'side effect', 'closure',
      'lexical scope', 'hoisting', 'prototype chain',
      'garbage collection', 'memory leak', 'heap', 'stack',
      'parse', 'tokenize', 'ast', 'compiler', 'interpreter',
      'webpack', 'bundler', 'transpile', 'polyfill',
      'cors preflight', 'csrf', 'xss', 'injection',
      'pagination', 'rate limiting', 'caching', 'cdn'
    ];

    this.intermediateKeywords = [
      'function', 'class', 'method', 'variable', 'array', 'object',
      'loop', 'if statement', 'condition', 'parameter', 'return',
      'api', 'endpoint', 'request', 'response', 'http', 'https',
      'json', 'xml', 'database', 'query', 'frontend', 'backend',
      'error', 'bug', 'debug', 'console.log', 'print',
      'file', 'folder', 'directory', 'path', 'import', 'export',
      'package', 'library', 'module', 'dependency',
      'git', 'commit', 'branch', 'merge', 'pull request',
      'test', 'testing', 'unit test', 'integration'
    ];

    this.beginnerIndicators = [
      'how do i', 'how to', 'what is', 'what does', 'can you explain',
      'i don\'t understand', 'confused', 'not working', 'doesn\'t work',
      'getting started', 'tutorial', 'basic', 'simple',
      'step by step', 'beginner', 'new to', 'first time',
      'help me', 'i tried', 'i\'m trying to'
    ];
  }

  /**
   * Detect expertise level from a message
   * @param {string} message - User's message
   * @param {Array} history - Previous messages (optional)
   * @returns {Object} { level: 'beginner'|'intermediate'|'expert', confidence: 0-1, signals: [] }
   */
  detect(message, history = []) {
    const text = message.toLowerCase();
    const signals = [];
    let score = 50; // Start neutral (0-100 scale)

    // Check for beginner indicators
    const beginnerMatches = this.beginnerIndicators.filter(phrase => text.includes(phrase));
    if (beginnerMatches.length > 0) {
      score -= beginnerMatches.length * 10;
      signals.push({ type: 'beginner_phrases', matches: beginnerMatches });
    }

    // Check for expert keywords
    const expertMatches = this.expertKeywords.filter(keyword => text.includes(keyword));
    if (expertMatches.length > 0) {
      score += expertMatches.length * 15;
      signals.push({ type: 'expert_keywords', matches: expertMatches });
    }

    // Check for intermediate keywords
    const intermediateMatches = this.intermediateKeywords.filter(keyword => text.includes(keyword));
    if (intermediateMatches.length > 0) {
      score += intermediateMatches.length * 5;
      signals.push({ type: 'intermediate_keywords', matches: intermediateMatches });
    }

    // Code snippet detection (backticks, function definitions, etc.)
    if (text.includes('```') || text.includes('function ') || text.includes('const ')) {
      score += 10;
      signals.push({ type: 'code_snippet' });
    }

    // Error message analysis (shows debugging capability)
    if (text.includes('error:') || text.includes('exception:') || /error.*line \d+/.test(text)) {
      score += 5;
      signals.push({ type: 'error_analysis' });
    }

    // Question complexity
    const questionWords = ['why', 'how does', 'what happens when', 'what\'s the difference'];
    const complexQuestions = questionWords.filter(q => text.includes(q));
    if (complexQuestions.length > 0) {
      score += complexQuestions.length * 8;
      signals.push({ type: 'complex_questions', matches: complexQuestions });
    }

    // Message length (experts tend to provide more context)
    if (message.length > 300) {
      score += 5;
      signals.push({ type: 'detailed_message' });
    }

    // Technical abbreviations
    const techAbbrevs = ['api', 'sdk', 'cli', 'orm', 'mvc', 'rest', 'graphql', 'sql', 'nosql'];
    const abbrevMatches = techAbbrevs.filter(abbr => text.includes(abbr));
    if (abbrevMatches.length > 1) {
      score += abbrevMatches.length * 5;
      signals.push({ type: 'technical_abbreviations', matches: abbrevMatches });
    }

    // Analyze conversation history (if provided)
    if (history.length > 0) {
      const historyScore = this._analyzeHistory(history);
      score = (score * 0.7) + (historyScore * 0.3); // Weighted average
      signals.push({ type: 'history_analysis', score: historyScore });
    }

    // Normalize score to 0-100
    score = Math.max(0, Math.min(100, score));

    // Determine level and confidence
    let level;
    let confidence;

    if (score < 35) {
      level = 'beginner';
      confidence = (35 - score) / 35; // Higher confidence when further from threshold
    } else if (score > 65) {
      level = 'expert';
      confidence = (score - 65) / 35;
    } else {
      level = 'intermediate';
      confidence = 1 - (Math.abs(score - 50) / 15); // Highest confidence near middle
    }

    confidence = Math.max(0, Math.min(1, confidence));

    return {
      level,
      confidence: parseFloat(confidence.toFixed(2)),
      score,
      signals
    };
  }

  /**
   * Analyze conversation history for patterns
   */
  _analyzeHistory(history) {
    let score = 50;

    for (const msg of history) {
      if (!msg.content) continue;

      const text = msg.content.toLowerCase();

      // Look for learning progression
      if (text.includes('thanks') || text.includes('got it') || text.includes('understand now')) {
        score += 5; // Learning and adapting
      }

      // Follow-up questions indicate deeper understanding
      if (text.includes('what about') || text.includes('also') || text.includes('related')) {
        score += 3;
      }
    }

    return score;
  }

  /**
   * Get recommended provider and model based on expertise
   */
  recommend(expertiseLevel) {
    const recommendations = {
      beginner: {
        provider: 'ollama',
        model: 'llama3.2',
        temperature: 0.3, // More deterministic, simpler explanations
        systemPrompt: 'You are a patient teacher explaining concepts to beginners. Use simple language, avoid jargon, and provide step-by-step explanations with examples. Like WordPress\'s "Hello World" post, make it welcoming and educational.'
      },
      intermediate: {
        provider: 'auto', // Can use Ollama or cloud
        model: 'auto',
        temperature: 0.5, // Balanced
        systemPrompt: 'You are a helpful coding assistant. Assume the user understands basics but needs practical guidance. Provide clear explanations with code examples and best practices.'
      },
      expert: {
        provider: 'claude', // Use best model for complex questions
        model: 'claude-sonnet-4-5-20250929',
        temperature: 0.7, // More creative, explore edge cases
        systemPrompt: 'You are an expert technical consultant. Provide in-depth technical analysis, discuss trade-offs, edge cases, and advanced patterns. Assume deep knowledge and focus on nuance.'
      }
    };

    return recommendations[expertiseLevel] || recommendations.intermediate;
  }
}

module.exports = ExpertiseDetector;
