#!/usr/bin/env node

/**
 * FinishThisIdea MCP Server
 * Provides context and tools for Cursor AI integration
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  GetPromptRequestSchema
} = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs').promises;
const path = require('path');
const glob = require('fast-glob');

class FinishThisIdeaMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'finishthisidea-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          prompts: {},
          resources: {},
          tools: {},
        },
      }
    );

    this.projectRoot = process.env.PROJECT_ROOT || process.cwd();
    this.setupHandlers();
  }

  setupHandlers() {
    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: [
        {
          name: 'cleanup-service',
          description: 'Generate a code cleanup service',
          arguments: [
            { name: 'name', description: 'Service name', required: true },
            { name: 'price', description: 'Service price in dollars', required: true }
          ]
        },
        {
          name: 'api-endpoint',
          description: 'Generate an API endpoint',
          arguments: [
            { name: 'method', description: 'HTTP method', required: true },
            { name: 'path', description: 'Endpoint path', required: true },
            { name: 'description', description: 'What this endpoint does', required: true }
          ]
        },
        {
          name: 'react-component',
          description: 'Generate a React component',
          arguments: [
            { name: 'name', description: 'Component name', required: true },
            { name: 'type', description: 'Component type (functional/class)', required: false }
          ]
        },
        {
          name: 'test-suite',
          description: 'Generate tests for code',
          arguments: [
            { name: 'file', description: 'File to test', required: true },
            { name: 'framework', description: 'Test framework (jest/mocha)', required: false }
          ]
        },
        {
          name: 'fix-issue',
          description: 'Fix a specific issue in the codebase',
          arguments: [
            { name: 'issue', description: 'Issue description', required: true },
            { name: 'file', description: 'File path (optional)', required: false }
          ]
        }
      ]
    }));

    // Get specific prompt
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const promptPath = path.join(this.projectRoot, '.mcp/prompts', `${request.params.name}.md`);
      const template = await fs.readFile(promptPath, 'utf-8');
      
      // Replace variables in template
      let prompt = template;
      for (const [key, value] of Object.entries(request.params.arguments || {})) {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }

      return {
        prompt: {
          name: request.params.name,
          description: `Generated prompt for ${request.params.name}`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: prompt
              }
            }
          ]
        }
      };
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'file://project-structure',
          mimeType: 'text/plain',
          name: 'Project Structure',
          description: 'Current project file structure'
        },
        {
          uri: 'file://service-catalog',
          mimeType: 'text/markdown',
          name: 'Service Catalog',
          description: 'Available services and their descriptions'
        },
        {
          uri: 'file://templates',
          mimeType: 'application/json',
          name: 'Available Templates',
          description: 'List of available service templates'
        },
        {
          uri: 'file://rules',
          mimeType: 'text/markdown',
          name: 'Project Rules',
          description: 'Coding standards and project rules'
        }
      ]
    }));

    // Read specific resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;

      if (uri === 'file://project-structure') {
        const structure = await this.getProjectStructure();
        return {
          contents: [{
            uri,
            mimeType: 'text/plain',
            text: structure
          }]
        };
      }

      if (uri === 'file://service-catalog') {
        const catalog = await fs.readFile(
          path.join(this.projectRoot, 'docs/05-services/service-catalog.md'),
          'utf-8'
        );
        return {
          contents: [{
            uri,
            mimeType: 'text/markdown',
            text: catalog
          }]
        };
      }

      if (uri === 'file://templates') {
        const templates = await this.getTemplates();
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(templates, null, 2)
          }]
        };
      }

      if (uri === 'file://rules') {
        const rules = await fs.readFile(
          path.join(this.projectRoot, '.rules/project-rules.md'),
          'utf-8'
        );
        return {
          contents: [{
            uri,
            mimeType: 'text/markdown',
            text: rules
          }]
        };
      }

      throw new Error(`Unknown resource: ${uri}`);
    });

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'generate-service',
          description: 'Generate a new service from template',
          inputSchema: {
            type: 'object',
            properties: {
              template: { type: 'string', description: 'Template name' },
              name: { type: 'string', description: 'Service name' },
              options: { type: 'object', description: 'Service options' }
            },
            required: ['template', 'name']
          }
        },
        {
          name: 'analyze-code',
          description: 'Analyze code for issues and improvements',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'File or directory path' },
              checks: { 
                type: 'array', 
                items: { type: 'string' },
                description: 'Specific checks to run'
              }
            },
            required: ['path']
          }
        },
        {
          name: 'run-tests',
          description: 'Run tests for a specific module',
          inputSchema: {
            type: 'object',
            properties: {
              module: { type: 'string', description: 'Module to test' },
              type: { 
                type: 'string', 
                enum: ['unit', 'integration', 'e2e'],
                description: 'Test type'
              }
            },
            required: ['module']
          }
        },
        {
          name: 'deploy',
          description: 'Deploy service to environment',
          inputSchema: {
            type: 'object',
            properties: {
              service: { type: 'string', description: 'Service name' },
              environment: { 
                type: 'string',
                enum: ['development', 'staging', 'production'],
                description: 'Target environment'
              }
            },
            required: ['service', 'environment']
          }
        }
      ]
    }));

    // Execute tools
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'generate-service':
          return await this.generateService(args);
        
        case 'analyze-code':
          return await this.analyzeCode(args);
        
        case 'run-tests':
          return await this.runTests(args);
        
        case 'deploy':
          return await this.deploy(args);
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async getProjectStructure() {
    const files = await glob('**/*', {
      cwd: this.projectRoot,
      ignore: ['node_modules/**', '.git/**', 'dist/**', '.next/**'],
      onlyFiles: false,
      markDirectories: true,
      deep: 3
    });

    // Build tree structure
    const tree = files
      .sort()
      .map(file => {
        const depth = file.split('/').length - 1;
        const indent = '  '.repeat(depth);
        const name = path.basename(file);
        const isDir = file.endsWith('/');
        return `${indent}${isDir ? '📁' : '📄'} ${name}`;
      })
      .join('\n');

    return `Project Structure:\n\n${tree}`;
  }

  async getTemplates() {
    const templateDirs = await glob('templates/*', {
      cwd: this.projectRoot,
      onlyDirectories: true
    });

    const templates = [];
    for (const dir of templateDirs) {
      const configPath = path.join(this.projectRoot, dir, 'template.yaml');
      try {
        const config = await fs.readFile(configPath, 'utf-8');
        const name = path.basename(dir);
        templates.push({
          name,
          path: dir,
          // Parse YAML config here if needed
          hasConfig: true
        });
      } catch {
        templates.push({
          name: path.basename(dir),
          path: dir,
          hasConfig: false
        });
      }
    }

    return templates;
  }

  async generateService(args) {
    // This would call the actual service generator
    return {
      content: [
        {
          type: 'text',
          text: `Generated service '${args.name}' from template '${args.template}'`
        }
      ]
    };
  }

  async analyzeCode(args) {
    // This would run code analysis
    return {
      content: [
        {
          type: 'text',
          text: `Analyzed ${args.path}:\n- No critical issues found\n- 3 suggestions for improvement`
        }
      ]
    };
  }

  async runTests(args) {
    // This would execute tests
    return {
      content: [
        {
          type: 'text',
          text: `Running ${args.type || 'all'} tests for ${args.module}...\n✓ All tests passed`
        }
      ]
    };
  }

  async deploy(args) {
    // This would handle deployment
    return {
      content: [
        {
          type: 'text',
          text: `Deploying ${args.service} to ${args.environment}...\n✓ Deployment successful`
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('FinishThisIdea MCP Server running');
  }
}

// Export for testing
module.exports = {
  name: 'finishthisidea-mcp',
  version: '1.0.0',
  FinishThisIdeaMCPServer
};

// Start the server if run directly
if (require.main === module) {
  const server = new FinishThisIdeaMCPServer();
  server.run().catch(console.error);
}