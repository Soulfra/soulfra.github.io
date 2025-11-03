// DocumentationEngine.js - Auto-generated API documentation

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DocumentationEngine {
  constructor() {
    this.endpoints = new Map();
    this.schemas = new Map();
    this.examples = new Map();
    this.categories = new Map();
    this.initializeDefaultDocs();
  }

  initializeDefaultDocs() {
    // Core API endpoints
    this.addEndpoint({
      method: 'POST',
      path: '/api/agents',
      category: 'Agents',
      summary: 'Create a new agent',
      description: 'Creates a new AI agent with specified personality and capabilities',
      requestBody: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', description: 'Agent display name' },
          personality: { type: 'string', description: 'Agent personality traits' },
          capabilities: { 
            type: 'array', 
            items: { type: 'string' },
            description: 'List of agent capabilities'
          },
          memory_enabled: { type: 'boolean', description: 'Enable conversation memory' },
          model: { 
            type: 'string', 
            enum: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
            default: 'claude-3-sonnet'
          }
        }
      },
      responses: {
        200: {
          description: 'Agent created successfully',
          schema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              status: { type: 'string', enum: ['active', 'inactive'] },
              created: { type: 'string', format: 'date-time' }
            }
          }
        },
        400: { description: 'Invalid request parameters' },
        401: { description: 'Unauthorized - Invalid API key' },
        429: { description: 'Rate limit exceeded' }
      },
      examples: [
        {
          name: 'Basic Agent',
          request: {
            name: 'Assistant',
            personality: 'helpful and friendly'
          },
          response: {
            id: 'agent_abc123',
            name: 'Assistant',
            status: 'active',
            created: '2024-01-15T10:00:00Z'
          }
        },
        {
          name: 'Advanced Agent',
          request: {
            name: 'Code Expert',
            personality: 'technical and precise',
            capabilities: ['code_analysis', 'debugging', 'optimization'],
            memory_enabled: true,
            model: 'claude-3-opus'
          },
          response: {
            id: 'agent_xyz789',
            name: 'Code Expert',
            status: 'active',
            created: '2024-01-15T10:00:00Z',
            capabilities: ['code_analysis', 'debugging', 'optimization'],
            model: 'claude-3-opus'
          }
        }
      ]
    });

    this.addEndpoint({
      method: 'GET',
      path: '/api/agents/{agentId}',
      category: 'Agents',
      summary: 'Get agent details',
      description: 'Retrieve detailed information about a specific agent',
      parameters: [
        {
          name: 'agentId',
          in: 'path',
          required: true,
          type: 'string',
          description: 'Unique agent identifier'
        }
      ],
      responses: {
        200: {
          description: 'Agent details retrieved',
          schema: { $ref: '#/schemas/Agent' }
        },
        404: { description: 'Agent not found' }
      }
    });

    this.addEndpoint({
      method: 'POST',
      path: '/api/agents/{agentId}/messages',
      category: 'Messages',
      summary: 'Send message to agent',
      description: 'Send a message to an agent and receive a response',
      parameters: [
        {
          name: 'agentId',
          in: 'path',
          required: true,
          type: 'string'
        }
      ],
      requestBody: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string', description: 'Message content' },
          context: {
            type: 'object',
            properties: {
              conversation_id: { type: 'string' },
              metadata: { type: 'object' }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Message processed successfully',
          schema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              agentId: { type: 'string' },
              message: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              usage: {
                type: 'object',
                properties: {
                  input_tokens: { type: 'number' },
                  output_tokens: { type: 'number' }
                }
              }
            }
          }
        }
      }
    });

    // Webhooks documentation
    this.addEndpoint({
      method: 'POST',
      path: '/api/webhooks',
      category: 'Webhooks',
      summary: 'Register webhook',
      description: 'Register a new webhook endpoint for event notifications',
      requestBody: {
        type: 'object',
        required: ['url'],
        properties: {
          url: { type: 'string', format: 'uri' },
          events: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['agent.created', 'agent.updated', 'agent.deleted', 'message.sent', 'message.received']
            }
          },
          description: { type: 'string' }
        }
      }
    });

    // Add schemas
    this.addSchema('Agent', {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Unique agent identifier' },
        name: { type: 'string', description: 'Agent display name' },
        personality: { type: 'string', description: 'Personality description' },
        capabilities: {
          type: 'array',
          items: { type: 'string' }
        },
        status: {
          type: 'string',
          enum: ['active', 'inactive', 'suspended']
        },
        created: { type: 'string', format: 'date-time' },
        updated: { type: 'string', format: 'date-time' },
        metadata: { type: 'object' }
      }
    });

    this.addSchema('Message', {
      type: 'object',
      properties: {
        id: { type: 'string' },
        agentId: { type: 'string' },
        role: { type: 'string', enum: ['user', 'assistant'] },
        content: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
        conversation_id: { type: 'string' }
      }
    });
  }

  addEndpoint(endpoint) {
    const key = `${endpoint.method} ${endpoint.path}`;
    this.endpoints.set(key, endpoint);
    
    if (endpoint.category) {
      if (!this.categories.has(endpoint.category)) {
        this.categories.set(endpoint.category, []);
      }
      this.categories.get(endpoint.category).push(endpoint);
    }
  }

  addSchema(name, schema) {
    this.schemas.set(name, schema);
  }

  generateOpenAPISpec() {
    const spec = {
      openapi: '3.0.0',
      info: {
        title: 'Soulfra API',
        version: '1.0.0',
        description: 'AI Agent Platform API',
        contact: {
          name: 'Soulfra Support',
          email: 'support@soulfra.io'
        }
      },
      servers: [
        {
          url: 'https://api.soulfra.io',
          description: 'Production server'
        },
        {
          url: 'https://sandbox.soulfra.io',
          description: 'Sandbox server'
        }
      ],
      security: [
        {
          bearerAuth: []
        }
      ],
      paths: {},
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'API Key'
          }
        },
        schemas: {}
      }
    };

    // Add endpoints
    for (const [key, endpoint] of this.endpoints) {
      const [method, path] = key.split(' ');
      if (!spec.paths[path]) {
        spec.paths[path] = {};
      }
      
      spec.paths[path][method.toLowerCase()] = {
        summary: endpoint.summary,
        description: endpoint.description,
        tags: endpoint.category ? [endpoint.category] : [],
        parameters: endpoint.parameters || [],
        requestBody: endpoint.requestBody ? {
          required: true,
          content: {
            'application/json': {
              schema: endpoint.requestBody
            }
          }
        } : undefined,
        responses: endpoint.responses
      };
    }

    // Add schemas
    for (const [name, schema] of this.schemas) {
      spec.components.schemas[name] = schema;
    }

    return spec;
  }

  generateMarkdown() {
    let markdown = '# Soulfra API Documentation\n\n';
    markdown += 'Base URL: `https://api.soulfra.io`\n\n';
    markdown += '## Authentication\n\n';
    markdown += 'All API requests require authentication using an API key:\n\n';
    markdown += '```\nAuthorization: Bearer YOUR_API_KEY\n```\n\n';

    // Generate by category
    for (const [category, endpoints] of this.categories) {
      markdown += `## ${category}\n\n`;
      
      for (const endpoint of endpoints) {
        markdown += `### ${endpoint.summary}\n\n`;
        markdown += `**${endpoint.method}** \`${endpoint.path}\`\n\n`;
        markdown += `${endpoint.description}\n\n`;

        if (endpoint.parameters) {
          markdown += '#### Parameters\n\n';
          markdown += '| Name | Type | Required | Description |\n';
          markdown += '|------|------|----------|-------------|\n';
          for (const param of endpoint.parameters) {
            markdown += `| ${param.name} | ${param.type} | ${param.required ? 'Yes' : 'No'} | ${param.description || ''} |\n`;
          }
          markdown += '\n';
        }

        if (endpoint.requestBody) {
          markdown += '#### Request Body\n\n';
          markdown += '```json\n';
          markdown += JSON.stringify(this.schemaToExample(endpoint.requestBody), null, 2);
          markdown += '\n```\n\n';
        }

        if (endpoint.examples) {
          markdown += '#### Examples\n\n';
          for (const example of endpoint.examples) {
            markdown += `**${example.name}**\n\n`;
            if (example.request) {
              markdown += 'Request:\n```json\n';
              markdown += JSON.stringify(example.request, null, 2);
              markdown += '\n```\n\n';
            }
            if (example.response) {
              markdown += 'Response:\n```json\n';
              markdown += JSON.stringify(example.response, null, 2);
              markdown += '\n```\n\n';
            }
          }
        }
      }
    }

    return markdown;
  }

  generateHTML() {
    const openapi = this.generateOpenAPISpec();
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>${openapi.info.title} - API Documentation</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui.css">
    <style>
        body { margin: 0; padding: 0; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-bundle.js"></script>
    <script>
        window.onload = function() {
            window.ui = SwaggerUIBundle({
                spec: ${JSON.stringify(openapi, null, 2)},
                dom_id: '#swagger-ui',
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIBundle.SwaggerUIStandalonePreset
                ],
                layout: "BaseLayout"
            });
        };
    </script>
</body>
</html>
    `;
  }

  generatePostmanCollection() {
    const collection = {
      info: {
        name: 'Soulfra API',
        description: 'API collection for Soulfra platform',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      auth: {
        type: 'bearer',
        bearer: [{
          key: 'token',
          value: '{{api_key}}',
          type: 'string'
        }]
      },
      variable: [
        {
          key: 'base_url',
          value: 'https://api.soulfra.io',
          type: 'string'
        },
        {
          key: 'api_key',
          value: 'YOUR_API_KEY',
          type: 'string'
        }
      ],
      item: []
    };

    // Group by category
    for (const [category, endpoints] of this.categories) {
      const folder = {
        name: category,
        item: []
      };

      for (const endpoint of endpoints) {
        const [method, path] = `${endpoint.method} ${endpoint.path}`.split(' ');
        const request = {
          name: endpoint.summary,
          request: {
            method: method,
            header: [
              {
                key: 'Content-Type',
                value: 'application/json'
              }
            ],
            url: {
              raw: `{{base_url}}${path}`,
              host: ['{{base_url}}'],
              path: path.split('/').filter(p => p)
            }
          }
        };

        if (endpoint.requestBody && endpoint.examples?.[0]?.request) {
          request.request.body = {
            mode: 'raw',
            raw: JSON.stringify(endpoint.examples[0].request, null, 2)
          };
        }

        folder.item.push(request);
      }

      collection.item.push(folder);
    }

    return collection;
  }

  schemaToExample(schema, depth = 0) {
    if (depth > 5) return null; // Prevent infinite recursion

    if (schema.example) return schema.example;

    switch (schema.type) {
      case 'string':
        if (schema.format === 'date-time') return '2024-01-15T10:00:00Z';
        if (schema.format === 'uri') return 'https://example.com';
        if (schema.enum) return schema.enum[0];
        return 'string';
      
      case 'number':
      case 'integer':
        return 0;
      
      case 'boolean':
        return true;
      
      case 'array':
        if (schema.items) {
          return [this.schemaToExample(schema.items, depth + 1)];
        }
        return [];
      
      case 'object':
        const obj = {};
        if (schema.properties) {
          for (const [key, prop] of Object.entries(schema.properties)) {
            obj[key] = this.schemaToExample(prop, depth + 1);
          }
        }
        return obj;
      
      default:
        return null;
    }
  }

  // Export documentation in various formats
  exportDocumentation(format = 'markdown') {
    switch (format.toLowerCase()) {
      case 'markdown':
      case 'md':
        return this.generateMarkdown();
      
      case 'html':
        return this.generateHTML();
      
      case 'openapi':
      case 'swagger':
        return JSON.stringify(this.generateOpenAPISpec(), null, 2);
      
      case 'postman':
        return JSON.stringify(this.generatePostmanCollection(), null, 2);
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}

module.exports = DocumentationEngine;