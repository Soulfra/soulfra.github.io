// DeveloperPlatform.js - Full API access, SDK generation, webhook management

const crypto = require('crypto');
const EventEmitter = require('events');

class DeveloperPlatform extends EventEmitter {
  constructor() {
    super();
    this.apiKeys = new Map();
    this.webhooks = new Map();
    this.sdkTemplates = new Map();
    this.rateLimits = new Map();
    this.initializeSDKTemplates();
  }

  // API Key Management
  generateAPIKey(developerId, permissions = ['read', 'write']) {
    const apiKey = `sk_live_${crypto.randomBytes(32).toString('hex')}`;
    const keyData = {
      id: crypto.randomBytes(16).toString('hex'),
      key: apiKey,
      developerId,
      permissions,
      created: new Date().toISOString(),
      lastUsed: null,
      requestCount: 0,
      rateLimit: 1000 // requests per hour
    };
    
    this.apiKeys.set(apiKey, keyData);
    this.emit('apiKeyGenerated', keyData);
    return keyData;
  }

  // Webhook Management
  registerWebhook(developerId, config) {
    const webhookId = crypto.randomBytes(16).toString('hex');
    const webhook = {
      id: webhookId,
      developerId,
      url: config.url,
      events: config.events || ['*'],
      secret: crypto.randomBytes(32).toString('hex'),
      active: true,
      created: new Date().toISOString(),
      failures: 0,
      lastTriggered: null
    };
    
    this.webhooks.set(webhookId, webhook);
    this.emit('webhookRegistered', webhook);
    return webhook;
  }

  // SDK Generation
  initializeSDKTemplates() {
    // JavaScript SDK Template
    this.sdkTemplates.set('javascript', {
      generate: (config) => `
// Soulfra JavaScript SDK v1.0.0
class SoulfraSDK {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = '${config.baseUrl || 'https://api.soulfra.io'}';
  }

  async createAgent(params) {
    return this._request('POST', '/agents', params);
  }

  async getAgent(agentId) {
    return this._request('GET', \`/agents/\${agentId}\`);
  }

  async sendMessage(agentId, message) {
    return this._request('POST', \`/agents/\${agentId}/messages\`, { message });
  }

  async _request(method, path, body) {
    const response = await fetch(\`\${this.baseUrl}\${path}\`, {
      method,
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });
    return response.json();
  }
}

module.exports = SoulfraSDK;
`
    });

    // Python SDK Template
    this.sdkTemplates.set('python', {
      generate: (config) => `
# Soulfra Python SDK v1.0.0
import requests
import json

class SoulfraSDK:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = '${config.baseUrl || 'https://api.soulfra.io'}'
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        })
    
    def create_agent(self, params):
        return self._request('POST', '/agents', params)
    
    def get_agent(self, agent_id):
        return self._request('GET', f'/agents/{agent_id}')
    
    def send_message(self, agent_id, message):
        return self._request('POST', f'/agents/{agent_id}/messages', {'message': message})
    
    def _request(self, method, path, data=None):
        url = f'{self.base_url}{path}'
        response = self.session.request(method, url, json=data)
        response.raise_for_status()
        return response.json()
`
    });

    // Go SDK Template
    this.sdkTemplates.set('go', {
      generate: (config) => `
// Soulfra Go SDK v1.0.0
package soulfra

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

type Client struct {
    APIKey  string
    BaseURL string
    client  *http.Client
}

func NewClient(apiKey string) *Client {
    return &Client{
        APIKey:  apiKey,
        BaseURL: "${config.baseUrl || 'https://api.soulfra.io'}",
        client:  &http.Client{},
    }
}

func (c *Client) CreateAgent(params map[string]interface{}) (map[string]interface{}, error) {
    return c.request("POST", "/agents", params)
}

func (c *Client) GetAgent(agentID string) (map[string]interface{}, error) {
    return c.request("GET", fmt.Sprintf("/agents/%s", agentID), nil)
}

func (c *Client) SendMessage(agentID, message string) (map[string]interface{}, error) {
    params := map[string]interface{}{"message": message}
    return c.request("POST", fmt.Sprintf("/agents/%s/messages", agentID), params)
}
`
    });
  }

  generateSDK(language, config = {}) {
    const template = this.sdkTemplates.get(language);
    if (!template) {
      throw new Error(`SDK template not found for language: ${language}`);
    }
    return template.generate(config);
  }

  // Rate Limiting
  checkRateLimit(apiKey) {
    const keyData = this.apiKeys.get(apiKey);
    if (!keyData) return { allowed: false, error: 'Invalid API key' };

    const hourAgo = new Date(Date.now() - 3600000);
    const recentRequests = this.rateLimits.get(apiKey) || [];
    const validRequests = recentRequests.filter(time => time > hourAgo);
    
    if (validRequests.length >= keyData.rateLimit) {
      return { 
        allowed: false, 
        error: 'Rate limit exceeded',
        resetAt: new Date(validRequests[0].getTime() + 3600000)
      };
    }

    validRequests.push(new Date());
    this.rateLimits.set(apiKey, validRequests);
    
    keyData.requestCount++;
    keyData.lastUsed = new Date().toISOString();
    
    return { allowed: true, remaining: keyData.rateLimit - validRequests.length };
  }

  // Webhook Triggering
  async triggerWebhook(event, data) {
    const webhooksToTrigger = Array.from(this.webhooks.values())
      .filter(w => w.active && (w.events.includes('*') || w.events.includes(event)));

    for (const webhook of webhooksToTrigger) {
      try {
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(JSON.stringify(data))
          .digest('hex');

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Soulfra-Signature': signature,
            'X-Soulfra-Event': event
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          webhook.failures++;
          if (webhook.failures > 5) {
            webhook.active = false;
            this.emit('webhookDisabled', webhook);
          }
        } else {
          webhook.failures = 0;
          webhook.lastTriggered = new Date().toISOString();
        }
      } catch (error) {
        console.error(`Webhook ${webhook.id} failed:`, error);
        webhook.failures++;
      }
    }
  }

  // Analytics
  getAPIUsageStats(developerId) {
    const developerKeys = Array.from(this.apiKeys.values())
      .filter(key => key.developerId === developerId);

    return {
      totalKeys: developerKeys.length,
      totalRequests: developerKeys.reduce((sum, key) => sum + key.requestCount, 0),
      activeKeys: developerKeys.filter(key => key.lastUsed).length,
      webhooks: Array.from(this.webhooks.values())
        .filter(w => w.developerId === developerId).length
    };
  }
}

module.exports = DeveloperPlatform;