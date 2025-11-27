#!/usr/bin/env node

/**
 * MCP Tool: Generate Service
 * Creates a new service from template with AI assistance
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class ServiceGenerator {
  constructor() {
    this.templatesDir = path.join(process.cwd(), 'templates');
    this.servicesDir = path.join(process.cwd(), 'services');
  }

  async generate(args) {
    const { template, name, options = {} } = args;

    console.log(`🚀 Generating service: ${name}`);
    console.log(`📋 Using template: ${template}`);

    // Validate inputs
    await this.validate(template, name);

    // Create service directory
    const servicePath = path.join(this.servicesDir, name);
    await fs.mkdir(servicePath, { recursive: true });

    // Copy template files
    await this.copyTemplate(template, servicePath, { name, ...options });

    // Generate additional files
    await this.generateAdditionalFiles(servicePath, { name, ...options });

    // Install dependencies
    await this.installDependencies(servicePath);

    // Run initial tests
    await this.runTests(servicePath);

    console.log(`✅ Service generated successfully at: ${servicePath}`);

    return {
      success: true,
      path: servicePath,
      name,
      template,
      nextSteps: [
        `cd services/${name}`,
        'npm run dev',
        'npm test'
      ]
    };
  }

  async validate(template, name) {
    // Check template exists
    const templatePath = path.join(this.templatesDir, template);
    try {
      await fs.access(templatePath);
    } catch {
      throw new Error(`Template not found: ${template}`);
    }

    // Check name is valid
    if (!/^[a-z-]+$/.test(name)) {
      throw new Error('Service name must be lowercase with hyphens only');
    }

    // Check service doesn't already exist
    const servicePath = path.join(this.servicesDir, name);
    try {
      await fs.access(servicePath);
      throw new Error(`Service already exists: ${name}`);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  async copyTemplate(template, targetPath, vars) {
    const templatePath = path.join(this.templatesDir, template);
    const files = await this.getAllFiles(templatePath);

    for (const file of files) {
      const relativePath = path.relative(templatePath, file);
      const targetFile = path.join(targetPath, relativePath);

      // Create directory if needed
      await fs.mkdir(path.dirname(targetFile), { recursive: true });

      // Read and process template
      const content = await fs.readFile(file, 'utf-8');
      const processed = this.processTemplate(content, vars);

      // Write processed file
      await fs.writeFile(targetFile, processed);
    }
  }

  async getAllFiles(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await this.getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  processTemplate(content, vars) {
    let processed = content;

    // Replace all template variables
    for (const [key, value] of Object.entries(vars)) {
      const patterns = [
        new RegExp(`{{${key}}}`, 'g'),
        new RegExp(`{{${this.toCamelCase(key)}}}`, 'g'),
        new RegExp(`{{${this.toPascalCase(key)}}}`, 'g'),
        new RegExp(`{{${this.toKebabCase(key)}}}`, 'g'),
      ];

      for (const pattern of patterns) {
        processed = processed.replace(pattern, value);
      }
    }

    return processed;
  }

  async generateAdditionalFiles(servicePath, options) {
    // Generate README
    const readme = `# ${this.toPascalCase(options.name)} Service

## Overview

${options.description || 'AI-powered service for FinishThisIdea platform.'}

## Features

- Fast processing (< 30 minutes)
- AI-powered analysis
- High-quality output
- Comprehensive error handling

## API Endpoints

\`\`\`
POST /api/${options.name}/upload
POST /api/${options.name}/process
GET  /api/${options.name}/status/:jobId
GET  /api/${options.name}/download/:jobId
\`\`\`

## Development

\`\`\`bash
# Install dependencies
npm install

# Run in development
npm run dev

# Run tests
npm test

# Build for production
npm run build
\`\`\`

## Configuration

See \`.env.example\` for required environment variables.

## Testing

\`\`\`bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# All tests
npm test
\`\`\`
`;

    await fs.writeFile(path.join(servicePath, 'README.md'), readme);

    // Generate package.json if not exists
    const packageJsonPath = path.join(servicePath, 'package.json');
    try {
      await fs.access(packageJsonPath);
    } catch {
      const packageJson = {
        name: `@finishthisidea/${options.name}`,
        version: '1.0.0',
        description: options.description || `${options.name} service`,
        main: 'dist/index.js',
        scripts: {
          dev: 'nodemon src/index.ts',
          build: 'tsc',
          start: 'node dist/index.js',
          test: 'jest',
          'test:unit': 'jest --testPathPattern=unit',
          'test:integration': 'jest --testPathPattern=integration'
        },
        dependencies: {
          express: '^4.18.0',
          bull: '^4.11.0',
          ioredis: '^5.3.0',
          zod: '^3.22.0'
        },
        devDependencies: {
          '@types/node': '^20.10.0',
          typescript: '^5.3.0',
          jest: '^29.7.0',
          nodemon: '^3.0.0'
        }
      };

      await fs.writeFile(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2)
      );
    }
  }

  async installDependencies(servicePath) {
    console.log('📦 Installing dependencies...');
    try {
      await execAsync('npm install', { cwd: servicePath });
      console.log('✅ Dependencies installed');
    } catch (error) {
      console.warn('⚠️  Failed to install dependencies:', error.message);
    }
  }

  async runTests(servicePath) {
    console.log('🧪 Running initial tests...');
    try {
      await execAsync('npm test', { cwd: servicePath });
      console.log('✅ All tests passed');
    } catch (error) {
      console.warn('⚠️  Some tests failed:', error.message);
    }
  }

  // Helper methods
  toCamelCase(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }

  toPascalCase(str) {
    const camel = this.toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  }

  toKebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
}

// Export for MCP
module.exports = async function generateService(args) {
  const generator = new ServiceGenerator();
  return await generator.generate(args);
};

// CLI support
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: generate-service.js <template> <name> [options]');
    process.exit(1);
  }

  const [template, name, ...options] = args;
  const generator = new ServiceGenerator();
  
  generator.generate({
    template,
    name,
    options: options.reduce((acc, opt) => {
      const [key, value] = opt.split('=');
      acc[key] = value;
      return acc;
    }, {})
  }).catch(console.error);
}