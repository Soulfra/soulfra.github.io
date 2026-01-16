/**
 * Base Provider Interface
 *
 * All AI providers (OpenAI, Claude, Ollama) extend this base class.
 * Ensures consistent interface across all providers.
 */

class BaseProvider {
  constructor(config = {}) {
    this.name = 'base';
    this.config = config;
  }

  /**
   * Check if provider is ready to use
   * @returns {boolean}
   */
  isReady() {
    return false;
  }

  /**
   * Get provider information
   * @returns {Object}
   */
  getInfo() {
    return {
      name: this.name,
      ready: this.isReady(),
      config: {
        hasApiKey: !!this.config.apiKey,
        model: this.config.model
      }
    };
  }

  /**
   * Send a chat message
   * @param {Array} messages - Chat messages
   * @param {Object} options - Chat options
   * @returns {Promise<{content: string, usage: Object, model: string}>}
   */
  async chat(messages, options = {}) {
    throw new Error('chat() must be implemented by provider');
  }

  /**
   * Stream a chat response
   * @param {Array} messages - Chat messages
   * @param {Object} options - Chat options
   * @returns {AsyncGenerator<string>}
   */
  async *stream(messages, options = {}) {
    throw new Error('stream() must be implemented by provider');
  }

  /**
   * Generate embeddings
   * @param {string|Array<string>} input - Text to embed
   * @param {Object} options - Embedding options
   * @returns {Promise<Array<number>>}
   */
  async embed(input, options = {}) {
    throw new Error('embed() not supported by this provider');
  }

  /**
   * Normalize messages to provider format
   * @param {Array} messages - Messages in common format
   * @returns {Array} Messages in provider-specific format
   */
  _normalizeMessages(messages) {
    // Base implementation - override in providers if needed
    return messages.map(m => ({
      role: m.role,
      content: m.content
    }));
  }

  /**
   * Normalize options to provider format
   * @param {Object} options - Options in common format
   * @returns {Object} Options in provider-specific format
   */
  _normalizeOptions(options) {
    return {
      model: options.model || this.config.defaultModel,
      maxTokens: options.maxTokens || 1024,
      temperature: options.temperature !== undefined ? options.temperature : 0.7
    };
  }
}

module.exports = BaseProvider;
