/**
 * Learning Router
 *
 * Adaptive AI routing based on user expertise level
 * Like WordPress Hello World - scaffolds learning from beginner to expert
 *
 * Flow:
 * 1. Analyze user message for expertise level
 * 2. Select appropriate provider and model
 * 3. Customize system prompt for skill level
 * 4. Route request to best AI provider
 * 5. Track learning progression
 */

const ExpertiseDetector = require('./expertise-detector');

class LearningRouter {
  constructor(providers) {
    this.providers = providers; // Map of available AI providers
    this.detector = new ExpertiseDetector();
    this.userProfiles = new Map(); // Track user progression
  }

  /**
   * Route a chat request adaptively
   * @param {string} message - User's message
   * @param {Object} options - Chat options
   * @param {string} options.userId - User ID for tracking (optional)
   * @param {Array} options.history - Conversation history
   * @param {boolean} options.adaptive - Enable adaptive routing (default: true)
   * @returns {Promise<Object>} Chat response with metadata
   */
  async chat(message, options = {}) {
    const {
      userId = null,
      history = [],
      adaptive = true,
      ...chatOptions
    } = options;

    // Detect expertise level
    const expertise = this.detector.detect(message, history);

    // Get recommendation based on expertise
    const recommendation = this.detector.recommend(expertise.level);

    // Update user profile
    if (userId) {
      this._updateProfile(userId, expertise);
    }

    // Select provider (allow manual override)
    const providerName = chatOptions.provider || recommendation.provider;
    const provider = this._selectProvider(providerName);

    if (!provider) {
      throw new Error(`No provider available for: ${providerName}`);
    }

    // Build messages with adaptive system prompt
    const messages = [];

    if (adaptive) {
      messages.push({
        role: 'system',
        content: recommendation.systemPrompt
      });
    } else if (chatOptions.system) {
      messages.push({
        role: 'system',
        content: chatOptions.system
      });
    }

    // Add history
    if (history.length > 0) {
      messages.push(...history);
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    // Execute chat
    const modelToUse = chatOptions.model || (recommendation.model !== 'auto' ? recommendation.model : undefined);
    const response = await provider.chat(messages, {
      model: modelToUse, // Let provider use its default if undefined
      temperature: chatOptions.temperature !== undefined ? chatOptions.temperature : recommendation.temperature,
      maxTokens: chatOptions.maxTokens || 1024
    });

    // Add metadata
    return {
      ...response,
      expertise: {
        level: expertise.level,
        confidence: expertise.confidence,
        signals: expertise.signals
      },
      recommendation,
      routing: {
        provider: provider.name,
        model: response.model,
        reason: adaptive ? `Adaptive routing for ${expertise.level} user` : 'Manual selection'
      }
    };
  }

  /**
   * Stream chat with adaptive routing
   */
  async *streamChat(message, options = {}) {
    const {
      userId = null,
      history = [],
      adaptive = true,
      ...chatOptions
    } = options;

    // Detect expertise level
    const expertise = this.detector.detect(message, history);

    // Get recommendation
    const recommendation = this.detector.recommend(expertise.level);

    // Update user profile
    if (userId) {
      this._updateProfile(userId, expertise);
    }

    // Select provider
    const providerName = chatOptions.provider || recommendation.provider;
    const provider = this._selectProvider(providerName);

    if (!provider) {
      throw new Error(`No provider available for: ${providerName}`);
    }

    // Build messages
    const messages = [];

    if (adaptive) {
      messages.push({
        role: 'system',
        content: recommendation.systemPrompt
      });
    } else if (chatOptions.system) {
      messages.push({
        role: 'system',
        content: chatOptions.system
      });
    }

    if (history.length > 0) {
      messages.push(...history);
    }

    messages.push({
      role: 'user',
      content: message
    });

    // Stream response
    const modelToUse = chatOptions.model || (recommendation.model !== 'auto' ? recommendation.model : undefined);
    const stream = await provider.stream(messages, {
      model: modelToUse, // Let provider use its default if undefined
      temperature: chatOptions.temperature !== undefined ? chatOptions.temperature : recommendation.temperature,
      maxTokens: chatOptions.maxTokens || 1024
    });

    // Yield chunks with metadata on first chunk
    let isFirst = true;
    for await (const chunk of stream) {
      if (isFirst) {
        // Optionally prepend metadata (for debugging)
        // yield JSON.stringify({ expertise, recommendation }) + '\n\n';
        isFirst = false;
      }
      yield chunk;
    }
  }

  /**
   * Select provider from available providers
   */
  _selectProvider(preferredProvider) {
    // If specific provider requested
    if (preferredProvider && preferredProvider !== 'auto') {
      const provider = this.providers.get(preferredProvider);
      if (provider && provider.isReady()) {
        return provider;
      }
    }

    // Auto-select based on availability
    // Priority: Claude > OpenAI > Ollama
    const priority = ['claude', 'openai', 'ollama'];

    for (const name of priority) {
      const provider = this.providers.get(name);
      if (provider && provider.isReady()) {
        return provider;
      }
    }

    // Fallback to any available provider
    for (const provider of this.providers.values()) {
      if (provider.isReady()) {
        return provider;
      }
    }

    return null;
  }

  /**
   * Update user profile with learning progression
   */
  _updateProfile(userId, expertise) {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        userId,
        interactions: [],
        expertiseLevels: [],
        createdAt: new Date().toISOString()
      });
    }

    const profile = this.userProfiles.get(userId);

    profile.interactions.push({
      timestamp: new Date().toISOString(),
      level: expertise.level,
      confidence: expertise.confidence,
      score: expertise.score
    });

    profile.expertiseLevels.push(expertise.level);

    // Keep only last 50 interactions
    if (profile.interactions.length > 50) {
      profile.interactions = profile.interactions.slice(-50);
    }

    // Calculate progression trend
    profile.trend = this._calculateTrend(profile.expertiseLevels);

    return profile;
  }

  /**
   * Calculate learning progression trend
   */
  _calculateTrend(levels) {
    if (levels.length < 3) return 'not_enough_data';

    const recentLevels = levels.slice(-10);
    const levelScores = {
      beginner: 1,
      intermediate: 2,
      expert: 3
    };

    const avgRecent = recentLevels.reduce((sum, level) => sum + levelScores[level], 0) / recentLevels.length;
    const avgOverall = levels.reduce((sum, level) => sum + levelScores[level], 0) / levels.length;

    if (avgRecent > avgOverall + 0.3) {
      return 'improving'; // Learning and progressing
    } else if (avgRecent < avgOverall - 0.3) {
      return 'declining'; // May need help or exploring new topics
    } else {
      return 'stable'; // Consistent level
    }
  }

  /**
   * Get user profile
   */
  getUserProfile(userId) {
    return this.userProfiles.get(userId) || null;
  }

  /**
   * Get routing statistics
   */
  getStats() {
    const totalUsers = this.userProfiles.size;
    const expertiseCounts = { beginner: 0, intermediate: 0, expert: 0 };
    const trends = { improving: 0, stable: 0, declining: 0, not_enough_data: 0 };

    for (const profile of this.userProfiles.values()) {
      const lastLevel = profile.expertiseLevels[profile.expertiseLevels.length - 1];
      if (lastLevel) expertiseCounts[lastLevel]++;
      if (profile.trend) trends[profile.trend]++;
    }

    return {
      totalUsers,
      expertiseCounts,
      trends,
      providers: Array.from(this.providers.keys()).map(name => ({
        name,
        ready: this.providers.get(name).isReady()
      }))
    };
  }
}

module.exports = LearningRouter;
