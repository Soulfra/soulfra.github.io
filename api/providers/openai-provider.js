/**
 * OpenAI Provider
 *
 * Handles OpenAI API integration
 * Uses native HTTPS (no dependencies)
 */

const https = require('https');
const BaseProvider = require('./base-provider');

class OpenAIProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'openai';
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.defaultModel = config.defaultModel || 'gpt-4o-mini';
    this.baseURL = 'api.openai.com';
  }

  isReady() {
    return !!this.apiKey;
  }

  /**
   * Make HTTPS request to OpenAI API
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
          'Authorization': `Bearer ${this.apiKey}`,
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

    const response = await this._request('/v1/chat/completions', {
      model: normalized.model,
      messages: messages,
      max_tokens: normalized.maxTokens,
      temperature: normalized.temperature
    });

    const choice = response.data.choices[0];

    return {
      content: choice.message.content,
      usage: {
        inputTokens: response.data.usage.prompt_tokens,
        outputTokens: response.data.usage.completion_tokens,
        totalTokens: response.data.usage.total_tokens
      },
      model: response.data.model,
      provider: this.name,
      finishReason: choice.finish_reason
    };
  }

  /**
   * Stream chat completion
   */
  async *stream(messages, options = {}) {
    const normalized = this._normalizeOptions(options);

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        model: normalized.model,
        messages: messages,
        max_tokens: normalized.maxTokens,
        temperature: normalized.temperature,
        stream: true
      });

      const requestOptions = {
        hostname: this.baseURL,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'Authorization': `Bearer ${this.apiKey}`
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
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices[0]?.delta?.content;
                  if (content) yield content;
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
   * Generate embeddings
   */
  async embed(input, options = {}) {
    const model = options.model || 'text-embedding-3-small';

    const response = await this._request('/v1/embeddings', {
      model: model,
      input: Array.isArray(input) ? input : [input]
    });

    if (Array.isArray(input)) {
      return response.data.data.map(item => item.embedding);
    } else {
      return response.data.data[0].embedding;
    }
  }

  /**
   * Normalize options (OpenAI-specific format)
   */
  _normalizeOptions(options) {
    return {
      model: options.model || this.defaultModel,
      maxTokens: options.maxTokens || 1024,
      temperature: options.temperature !== undefined ? options.temperature : 0.7
    };
  }
}

module.exports = OpenAIProvider;
