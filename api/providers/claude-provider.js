/**
 * Claude (Anthropic) Provider
 *
 * Handles Anthropic Claude API integration
 * Uses native HTTPS (no dependencies)
 */

const https = require('https');
const BaseProvider = require('./base-provider');

class ClaudeProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'claude';
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    this.defaultModel = config.defaultModel || 'claude-sonnet-4-5-20250929';
    this.baseURL = 'api.anthropic.com';
  }

  isReady() {
    return !!this.apiKey;
  }

  /**
   * Make HTTPS request to Claude API
   */
  async _request(path, body, options = {}) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(body);

      const requestOptions = {
        hostname: this.baseURL,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          ...options.headers
        }
      };

      const req = https.request(requestOptions, (response) => {
        let data = '';

        response.on('data', chunk => { data += chunk; });

        response.on('end', () => {
          try {
            const parsed = JSON.parse(data);

            if (response.statusCode !== 200) {
              reject(new Error(parsed.error?.message || `HTTP ${response.statusCode}`));
              return;
            }

            resolve({
              data: parsed,
              headers: response.headers,
              statusCode: response.statusCode
            });
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Chat completion
   */
  async chat(messages, options = {}) {
    const normalized = this._normalizeOptions(options);

    // Claude uses system parameter instead of system role
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    const requestBody = {
      model: normalized.model,
      max_tokens: normalized.maxTokens,
      temperature: normalized.temperature,
      messages: userMessages.map(m => ({
        role: m.role,
        content: m.content
      }))
    };

    if (systemMessage) {
      requestBody.system = systemMessage.content;
    }

    const response = await this._request('/v1/messages', requestBody);

    const textContent = response.data.content.find(c => c.type === 'text');

    return {
      content: textContent ? textContent.text : '',
      usage: {
        inputTokens: response.data.usage.input_tokens,
        outputTokens: response.data.usage.output_tokens,
        totalTokens: response.data.usage.input_tokens + response.data.usage.output_tokens
      },
      model: response.data.model,
      provider: this.name,
      finishReason: response.data.stop_reason
    };
  }

  /**
   * Stream chat completion
   */
  async *stream(messages, options = {}) {
    const normalized = this._normalizeOptions(options);

    // Claude uses system parameter instead of system role
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    const requestBody = {
      model: normalized.model,
      max_tokens: normalized.maxTokens,
      temperature: normalized.temperature,
      messages: userMessages.map(m => ({
        role: m.role,
        content: m.content
      })),
      stream: true
    };

    if (systemMessage) {
      requestBody.system = systemMessage.content;
    }

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(requestBody);

      const requestOptions = {
        hostname: this.baseURL,
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        }
      };

      const req = https.request(requestOptions, (response) => {
        if (response.statusCode !== 200) {
          let errorData = '';
          response.on('data', chunk => { errorData += chunk; });
          response.on('end', () => {
            try {
              const error = JSON.parse(errorData);
              reject(new Error(error.error?.message || `HTTP ${response.statusCode}`));
            } catch {
              reject(new Error(`HTTP ${response.statusCode}`));
            }
          });
          return;
        }

        // Create async generator for streaming
        const generator = (async function*() {
          let buffer = '';

          for await (const chunk of response) {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);

                try {
                  const parsed = JSON.parse(data);

                  // Claude streaming events
                  if (parsed.type === 'content_block_delta') {
                    if (parsed.delta.type === 'text_delta') {
                      yield parsed.delta.text;
                    }
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        })();

        resolve(generator);
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Normalize options (Claude-specific format)
   */
  _normalizeOptions(options) {
    return {
      model: options.model || this.defaultModel,
      maxTokens: options.maxTokens || 1024,
      temperature: options.temperature !== undefined ? options.temperature : 0.7
    };
  }
}

module.exports = ClaudeProvider;
