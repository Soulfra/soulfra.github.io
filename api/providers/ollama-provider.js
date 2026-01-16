/**
 * Ollama Provider
 *
 * Handles local Ollama API integration
 * Uses native HTTP (no dependencies, no API keys needed)
 * Connects to locally running Ollama instance
 */

const http = require('http');
const BaseProvider = require('./base-provider');

class OllamaProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'ollama';
    this.defaultModel = config.defaultModel || 'llama3.2:3b'; // Latest Meta model with size
    this.baseURL = config.baseURL || '127.0.0.1'; // Use IPv4 explicitly
    this.port = config.port || 11434;
  }

  isReady() {
    // Ollama doesn't need API keys, just needs to be running
    // We'll check availability on first request
    return true;
  }

  /**
   * Make HTTP request to Ollama API
   */
  async _request(path, body, options = {}) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(body);

      const requestOptions = {
        hostname: this.baseURL,
        port: this.port,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          ...options.headers
        }
      };

      const req = http.request(requestOptions, (response) => {
        let data = '';

        response.on('data', chunk => { data += chunk; });

        response.on('end', () => {
          try {
            const parsed = JSON.parse(data);

            if (response.statusCode !== 200) {
              reject(new Error(parsed.error || `HTTP ${response.statusCode}`));
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
        reject(new Error(`Ollama not available at ${this.baseURL}:${this.port} - ${error.message}`));
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

    // Ollama expects a single prompt, not message array
    // Convert messages to single prompt
    const prompt = this._messagesToPrompt(messages);

    const requestBody = {
      model: normalized.model,
      prompt: prompt,
      stream: false,
      options: {
        temperature: normalized.temperature,
        num_predict: normalized.maxTokens
      }
    };

    try {
      const response = await this._request('/api/generate', requestBody);

      return {
        content: response.data.response,
        usage: {
          inputTokens: response.data.prompt_eval_count || 0,
          outputTokens: response.data.eval_count || 0,
          totalTokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0)
        },
        model: response.data.model,
        provider: this.name,
        finishReason: response.data.done ? 'stop' : 'length'
      };
    } catch (error) {
      throw new Error(`Ollama error: ${error.message}. Is Ollama running? Try: ollama serve`);
    }
  }

  /**
   * Stream chat completion
   */
  async *stream(messages, options = {}) {
    const normalized = this._normalizeOptions(options);

    // Convert messages to single prompt
    const prompt = this._messagesToPrompt(messages);

    const requestBody = {
      model: normalized.model,
      prompt: prompt,
      stream: true,
      options: {
        temperature: normalized.temperature,
        num_predict: normalized.maxTokens
      }
    };

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(requestBody);

      const requestOptions = {
        hostname: this.baseURL,
        port: this.port,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(requestOptions, (response) => {
        if (response.statusCode !== 200) {
          let errorData = '';
          response.on('data', chunk => { errorData += chunk; });
          response.on('end', () => {
            try {
              const error = JSON.parse(errorData);
              reject(new Error(error.error || `HTTP ${response.statusCode}`));
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
              if (!line.trim()) continue;

              try {
                const parsed = JSON.parse(line);
                if (parsed.response) {
                  yield parsed.response;
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        })();

        resolve(generator);
      });

      req.on('error', (error) => {
        reject(new Error(`Ollama not available: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Convert OpenAI-style messages to Ollama prompt
   */
  _messagesToPrompt(messages) {
    let prompt = '';

    for (const message of messages) {
      if (message.role === 'system') {
        prompt += `System: ${message.content}\n\n`;
      } else if (message.role === 'user') {
        prompt += `User: ${message.content}\n\n`;
      } else if (message.role === 'assistant') {
        prompt += `Assistant: ${message.content}\n\n`;
      }
    }

    prompt += 'Assistant: ';
    return prompt;
  }

  /**
   * Normalize options (Ollama-specific format)
   */
  _normalizeOptions(options) {
    return {
      model: options.model || this.defaultModel,
      maxTokens: options.maxTokens || 1024,
      temperature: options.temperature !== undefined ? options.temperature : 0.7
    };
  }

  /**
   * List available models
   */
  async listModels() {
    try {
      const response = await this._request('/api/tags', {});
      return response.data.models || [];
    } catch (error) {
      throw new Error(`Failed to list Ollama models: ${error.message}`);
    }
  }

  /**
   * Check if Ollama is running
   */
  async healthCheck() {
    try {
      await this.listModels();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Vision API - analyze image with LLaVA
   * @param {string} imageData - Base64 encoded image
   * @param {string} prompt - Question/instruction about the image
   * @param {object} options - Additional options
   */
  async vision(imageData, prompt, options = {}) {
    // Strip data URL prefix if present
    let base64Image = imageData;
    if (base64Image.startsWith('data:')) {
      base64Image = base64Image.split(',')[1];
    }

    const requestBody = {
      model: options.model || 'llava',
      prompt: prompt,
      images: [base64Image],
      stream: false,
      options: {
        temperature: options.temperature || 0.7,
        num_predict: options.maxTokens || 1024
      }
    };

    try {
      const response = await this._request('/api/generate', requestBody);

      return {
        content: response.data.response,
        usage: {
          inputTokens: response.data.prompt_eval_count || 0,
          outputTokens: response.data.eval_count || 0,
          totalTokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0)
        },
        model: response.data.model,
        provider: this.name,
        finishReason: response.data.done ? 'stop' : 'length'
      };
    } catch (error) {
      throw new Error(`Ollama vision error: ${error.message}. Is LLaVA model installed? Try: ollama pull llava`);
    }
  }
}

module.exports = OllamaProvider;
