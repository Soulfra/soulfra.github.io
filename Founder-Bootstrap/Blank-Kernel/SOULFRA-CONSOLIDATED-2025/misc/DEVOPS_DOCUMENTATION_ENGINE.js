#!/usr/bin/env node

/**
 * 🔧 DEVOPS DOCUMENTATION ENGINE
 * 
 * Comprehensive system for auto-documenting, versioning, and tracking
 * all components, dependencies, and deployment configurations
 * 
 * Features:
 * - Auto-analyzes codebase structure
 * - Generates multi-level documentation
 * - Git-like versioning for docs
 * - Dependency graph visualization
 * - Error pattern detection
 * - Implementation guides
 * - Threading/idea tracking
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process').promises;

class DevOpsDocumentationEngine {
    constructor() {
        this.docsPath = path.join(__dirname, '.devops-docs');
        this.historyPath = path.join(this.docsPath, 'history');
        this.currentVersion = null;
        
        // Documentation levels
        this.docLevels = {
            EXECUTIVE: 'executive',      // C-suite level overview
            ARCHITECT: 'architect',      // System design level
            DEVELOPER: 'developer',      // Implementation level
            DEVOPS: 'devops',           // Deployment/operations
            QA: 'qa',                   // Testing/verification
            USER: 'user'                // End user documentation
        };
        
        // Component analysis patterns
        this.patterns = {
            services: /^(class|function)\s+(\w+)(Service|Server|API|Handler)/gm,
            dependencies: /require\(['"]([^'"]+)['"]\)/g,
            ports: /(?:PORT|port)\s*[:=]\s*(\d+)/g,
            apis: /app\.(get|post|put|delete)\(['"]([^'"]+)/g,
            errors: /(throw|Error|catch|reject)/g,
            configs: /(config|Config|CONFIG)/g
        };
        
        // Error tracking
        this.commonErrors = new Map();
        this.solutions = new Map();
    }
    
    async initialize() {
        // Create documentation directory structure
        await fs.mkdir(this.docsPath, { recursive: true });
        await fs.mkdir(this.historyPath, { recursive: true });
        await fs.mkdir(path.join(this.docsPath, 'components'), { recursive: true });
        await fs.mkdir(path.join(this.docsPath, 'threads'), { recursive: true });
        await fs.mkdir(path.join(this.docsPath, 'ideas'), { recursive: true });
        
        // Load existing version history
        await this.loadHistory();
        
        console.log('📚 DevOps Documentation Engine initialized');
    }
    
    /**
     * Analyze entire codebase and generate comprehensive documentation
     */
    async analyzeAndDocument(targetPath = __dirname) {
        console.log('🔍 Analyzing codebase...');
        
        const analysis = {
            timestamp: new Date().toISOString(),
            path: targetPath,
            components: [],
            dependencies: new Map(),
            services: [],
            apis: [],
            ports: new Set(),
            errors: [],
            config: {},
            structure: await this.analyzeStructure(targetPath)
        };
        
        // Deep analysis of all files
        await this.deepAnalyze(targetPath, analysis);
        
        // Generate documentation at all levels
        const docs = await this.generateMultiLevelDocs(analysis);
        
        // Create version snapshot
        const version = await this.createVersion(analysis, docs);
        
        // Generate implementation guides
        await this.generateImplementationGuides(analysis);
        
        // Generate dependency graph
        await this.generateDependencyGraph(analysis);
        
        console.log(`✅ Documentation generated: Version ${version.id}`);
        
        return version;
    }
    
    /**
     * Deep analyze all code files
     */
    async deepAnalyze(dirPath, analysis, depth = 0) {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            
            // Skip node_modules and hidden directories
            if (entry.name.startsWith('.') || entry.name === 'node_modules') {
                continue;
            }
            
            if (entry.isDirectory()) {
                await this.deepAnalyze(fullPath, analysis, depth + 1);
            } else if (entry.name.endsWith('.js')) {
                await this.analyzeFile(fullPath, analysis);
            } else if (entry.name.endsWith('.json')) {
                await this.analyzeConfig(fullPath, analysis);
            } else if (entry.name.endsWith('.md')) {
                await this.analyzeDocumentation(fullPath, analysis);
            }
        }
    }
    
    /**
     * Analyze individual JavaScript file
     */
    async analyzeFile(filePath, analysis) {
        const content = await fs.readFile(filePath, 'utf8');
        const relativePath = path.relative(__dirname, filePath);
        
        const component = {
            path: relativePath,
            name: path.basename(filePath, '.js'),
            type: this.detectComponentType(content),
            services: [],
            dependencies: [],
            apis: [],
            ports: [],
            errors: [],
            complexity: this.calculateComplexity(content),
            documentation: this.extractDocumentation(content)
        };
        
        // Extract services/classes
        let match;
        while ((match = this.patterns.services.exec(content)) !== null) {
            component.services.push({
                type: match[1],
                name: match[2] + (match[3] || ''),
                line: this.getLineNumber(content, match.index)
            });
        }
        
        // Extract dependencies
        while ((match = this.patterns.dependencies.exec(content)) !== null) {
            const dep = match[1];
            component.dependencies.push(dep);
            
            // Track global dependencies
            if (!analysis.dependencies.has(dep)) {
                analysis.dependencies.set(dep, []);
            }
            analysis.dependencies.get(dep).push(relativePath);
        }
        
        // Extract APIs
        while ((match = this.patterns.apis.exec(content)) !== null) {
            component.apis.push({
                method: match[1].toUpperCase(),
                path: match[2]
            });
        }
        
        // Extract ports
        while ((match = this.patterns.ports.exec(content)) !== null) {
            const port = parseInt(match[1]);
            component.ports.push(port);
            analysis.ports.add(port);
        }
        
        // Detect error patterns
        const errorMatches = content.match(this.patterns.errors) || [];
        component.errors = errorMatches.length;
        
        // Check for common error patterns we've seen
        this.detectCommonErrors(content, relativePath);
        
        analysis.components.push(component);
    }
    
    /**
     * Detect component type from content
     */
    detectComponentType(content) {
        if (content.includes('createServer') || content.includes('listen(')) {
            return 'server';
        } else if (content.includes('EventEmitter') || content.includes('emit(')) {
            return 'event-driven';
        } else if (content.includes('class') && content.includes('Shell')) {
            return 'shell';
        } else if (content.includes('router') || content.includes('Router')) {
            return 'router';
        } else if (content.includes('test') || content.includes('describe(')) {
            return 'test';
        }
        return 'module';
    }
    
    /**
     * Calculate code complexity
     */
    calculateComplexity(content) {
        const lines = content.split('\n').length;
        const functions = (content.match(/function/g) || []).length;
        const conditions = (content.match(/(if|else|switch|case)/g) || []).length;
        const loops = (content.match(/(for|while|do)/g) || []).length;
        
        return {
            lines,
            functions,
            conditions,
            loops,
            score: Math.round((conditions + loops) / functions * 10) || 0
        };
    }
    
    /**
     * Extract JSDoc and comments
     */
    extractDocumentation(content) {
        const jsdocPattern = /\/\*\*[\s\S]*?\*\//g;
        const docs = content.match(jsdocPattern) || [];
        return docs.map(doc => doc.replace(/^\/\*\*|\*\/$/g, '').trim());
    }
    
    /**
     * Detect common error patterns
     */
    detectCommonErrors(content, filePath) {
        // Pattern: Uninitialized variables
        if (content.includes('.set(') && content.includes('undefined')) {
            this.commonErrors.set('uninitialized-map', {
                pattern: 'Calling .set() on undefined Map',
                files: [...(this.commonErrors.get('uninitialized-map')?.files || []), filePath],
                solution: 'Initialize Map in constructor before use'
            });
        }
        
        // Pattern: Missing await
        if (content.includes('async') && content.match(/^\s*\w+\.\w+\(/m)) {
            this.commonErrors.set('missing-await', {
                pattern: 'Possible missing await on async call',
                files: [...(this.commonErrors.get('missing-await')?.files || []), filePath],
                solution: 'Add await keyword before async function calls'
            });
        }
        
        // Pattern: Port conflicts
        if (content.includes('EADDRINUSE')) {
            this.commonErrors.set('port-conflict', {
                pattern: 'Port already in use error handling',
                files: [...(this.commonErrors.get('port-conflict')?.files || []), filePath],
                solution: 'Kill existing processes or use dynamic port allocation'
            });
        }
    }
    
    /**
     * Generate multi-level documentation
     */
    async generateMultiLevelDocs(analysis) {
        const docs = {};
        
        // Executive Summary
        docs[this.docLevels.EXECUTIVE] = this.generateExecutiveSummary(analysis);
        
        // Architecture Documentation
        docs[this.docLevels.ARCHITECT] = this.generateArchitectureDocs(analysis);
        
        // Developer Documentation
        docs[this.docLevels.DEVELOPER] = this.generateDeveloperDocs(analysis);
        
        // DevOps Documentation
        docs[this.docLevels.DEVOPS] = this.generateDevOpsDocs(analysis);
        
        // QA Documentation
        docs[this.docLevels.QA] = this.generateQADocs(analysis);
        
        // User Documentation
        docs[this.docLevels.USER] = this.generateUserDocs(analysis);
        
        return docs;
    }
    
    /**
     * Generate Executive Summary
     */
    generateExecutiveSummary(analysis) {
        const totalComponents = analysis.components.length;
        const totalLines = analysis.components.reduce((sum, c) => sum + c.complexity.lines, 0);
        const services = analysis.components.filter(c => c.type === 'server').length;
        
        return {
            title: 'Executive Summary',
            sections: [
                {
                    heading: 'System Overview',
                    content: `The system consists of ${totalComponents} components with ${totalLines.toLocaleString()} lines of code.`
                },
                {
                    heading: 'Key Services',
                    content: `${services} active services managing game operations, economy, and infrastructure.`
                },
                {
                    heading: 'Technology Stack',
                    content: 'Node.js-based microservices architecture with event-driven design.'
                },
                {
                    heading: 'Business Value',
                    content: 'Scalable gaming platform supporting real-time interactions and economic transactions.'
                }
            ],
            metrics: {
                components: totalComponents,
                services: services,
                apis: analysis.components.reduce((sum, c) => sum + c.apis.length, 0),
                complexity: 'Medium'
            }
        };
    }
    
    /**
     * Generate Architecture Documentation
     */
    generateArchitectureDocs(analysis) {
        // Build dependency tree
        const dependencyTree = this.buildDependencyTree(analysis);
        
        // Identify architectural patterns
        const patterns = this.identifyPatterns(analysis);
        
        return {
            title: 'System Architecture',
            sections: [
                {
                    heading: 'Architecture Overview',
                    content: this.generateArchitectureDiagram(analysis)
                },
                {
                    heading: 'Component Hierarchy',
                    content: dependencyTree
                },
                {
                    heading: 'Design Patterns',
                    content: patterns
                },
                {
                    heading: 'Service Communication',
                    content: this.generateServiceMap(analysis)
                }
            ],
            diagrams: {
                componentDiagram: this.generateComponentDiagram(analysis),
                sequenceDiagram: this.generateSequenceDiagram(analysis)
            }
        };
    }
    
    /**
     * Generate Developer Documentation
     */
    generateDeveloperDocs(analysis) {
        const apiDocs = this.generateAPIDocs(analysis);
        const setupGuide = this.generateSetupGuide(analysis);
        
        return {
            title: 'Developer Documentation',
            sections: [
                {
                    heading: 'Getting Started',
                    content: setupGuide
                },
                {
                    heading: 'API Reference',
                    content: apiDocs
                },
                {
                    heading: 'Code Examples',
                    content: this.generateCodeExamples(analysis)
                },
                {
                    heading: 'Common Patterns',
                    content: this.generatePatternExamples(analysis)
                },
                {
                    heading: 'Troubleshooting',
                    content: this.generateTroubleshootingGuide()
                }
            ]
        };
    }
    
    /**
     * Generate DevOps Documentation
     */
    generateDevOpsDocs(analysis) {
        const ports = Array.from(analysis.ports).sort((a, b) => a - b);
        
        return {
            title: 'DevOps Documentation',
            sections: [
                {
                    heading: 'Deployment Guide',
                    content: this.generateDeploymentGuide(analysis)
                },
                {
                    heading: 'Port Configuration',
                    content: `Services use ports: ${ports.join(', ')}`
                },
                {
                    heading: 'Environment Setup',
                    content: this.generateEnvironmentGuide(analysis)
                },
                {
                    heading: 'Monitoring',
                    content: this.generateMonitoringGuide(analysis)
                },
                {
                    heading: 'Scaling Strategy',
                    content: this.generateScalingGuide(analysis)
                }
            ],
            scripts: {
                startup: this.generateStartupScript(analysis),
                healthCheck: this.generateHealthCheckScript(analysis),
                deployment: this.generateDeploymentScript(analysis)
            }
        };
    }
    
    /**
     * Generate QA Documentation
     */
    generateQADocs(analysis) {
        return {
            title: 'QA Documentation',
            sections: [
                {
                    heading: 'Test Coverage',
                    content: this.analyzeTestCoverage(analysis)
                },
                {
                    heading: 'Test Scenarios',
                    content: this.generateTestScenarios(analysis)
                },
                {
                    heading: 'Error Patterns',
                    content: this.documentErrorPatterns()
                },
                {
                    heading: 'Performance Benchmarks',
                    content: this.generateBenchmarks(analysis)
                }
            ],
            testPlans: this.generateTestPlans(analysis)
        };
    }
    
    /**
     * Generate User Documentation
     */
    generateUserDocs(analysis) {
        return {
            title: 'User Guide',
            sections: [
                {
                    heading: 'Getting Started',
                    content: 'Simple guide to access and use the platform'
                },
                {
                    heading: 'Features',
                    content: this.documentUserFeatures(analysis)
                },
                {
                    heading: 'FAQ',
                    content: this.generateFAQ()
                }
            ]
        };
    }
    
    /**
     * Create versioned snapshot
     */
    async createVersion(analysis, docs) {
        const version = {
            id: crypto.randomBytes(4).toString('hex'),
            timestamp: new Date().toISOString(),
            analysis: analysis,
            documentation: docs,
            changes: await this.detectChanges(analysis)
        };
        
        // Save version
        const versionPath = path.join(this.historyPath, `v${version.id}.json`);
        await fs.writeFile(versionPath, JSON.stringify(version, null, 2));
        
        // Update current version
        this.currentVersion = version;
        await fs.writeFile(
            path.join(this.docsPath, 'current.json'),
            JSON.stringify({ version: version.id }, null, 2)
        );
        
        // Generate readable docs
        await this.generateReadableDocs(version);
        
        return version;
    }
    
    /**
     * Generate readable documentation files
     */
    async generateReadableDocs(version) {
        // Create main README
        const readme = this.generateMainReadme(version);
        await fs.writeFile(path.join(this.docsPath, 'README.md'), readme);
        
        // Create level-specific docs
        for (const [level, content] of Object.entries(version.documentation)) {
            const levelDoc = this.formatLevelDoc(level, content);
            await fs.writeFile(
                path.join(this.docsPath, `${level.toUpperCase()}.md`),
                levelDoc
            );
        }
        
        // Create component docs
        for (const component of version.analysis.components) {
            const componentDoc = this.generateComponentDoc(component);
            await fs.writeFile(
                path.join(this.docsPath, 'components', `${component.name}.md`),
                componentDoc
            );
        }
    }
    
    /**
     * Generate main README
     */
    generateMainReadme(version) {
        return `# 🔧 DevOps Documentation v${version.id}

Generated: ${new Date(version.timestamp).toLocaleString()}

## 📚 Documentation Levels

- [Executive Summary](./EXECUTIVE.md) - High-level overview for leadership
- [Architecture Guide](./ARCHITECT.md) - System design and patterns
- [Developer Guide](./DEVELOPER.md) - Implementation details and APIs
- [DevOps Guide](./DEVOPS.md) - Deployment and operations
- [QA Guide](./QA.md) - Testing and quality assurance
- [User Guide](./USER.md) - End-user documentation

## 🏗️ System Overview

${version.documentation.executive.sections[0].content}

## 🚀 Quick Start

\`\`\`bash
# Install dependencies
npm install

# Run the system
node MASTER_ORCHESTRATOR.js

# Access control panel
open http://localhost:3006
\`\`\`

## 📊 System Metrics

- Components: ${version.analysis.components.length}
- Services: ${version.analysis.components.filter(c => c.type === 'server').length}
- APIs: ${version.analysis.components.reduce((sum, c) => sum + c.apis.length, 0)}
- Dependencies: ${version.analysis.dependencies.size}

## ⚠️ Common Issues

${Array.from(this.commonErrors.values()).map(error => 
`### ${error.pattern}
- Files: ${error.files.join(', ')}
- Solution: ${error.solution}`
).join('\n\n')}

## 📁 Component Documentation

${version.analysis.components.map(c => 
`- [${c.name}](./components/${c.name}.md) - ${c.type}`
).join('\n')}
`;
    }
    
    /**
     * Format level-specific documentation
     */
    formatLevelDoc(level, content) {
        let doc = `# ${content.title}\n\n`;
        
        content.sections.forEach(section => {
            doc += `## ${section.heading}\n\n`;
            doc += `${section.content}\n\n`;
        });
        
        if (content.metrics) {
            doc += `## Metrics\n\n`;
            doc += '```json\n';
            doc += JSON.stringify(content.metrics, null, 2);
            doc += '\n```\n\n';
        }
        
        if (content.scripts) {
            doc += `## Scripts\n\n`;
            Object.entries(content.scripts).forEach(([name, script]) => {
                doc += `### ${name}\n\n`;
                doc += '```bash\n';
                doc += script;
                doc += '\n```\n\n';
            });
        }
        
        return doc;
    }
    
    /**
     * Generate component documentation
     */
    generateComponentDoc(component) {
        return `# ${component.name}

**Type:** ${component.type}  
**Path:** ${component.path}

## Overview

${component.documentation.join('\n\n') || 'No documentation found.'}

## Complexity Metrics

- Lines of Code: ${component.complexity.lines}
- Functions: ${component.complexity.functions}
- Conditions: ${component.complexity.conditions}
- Loops: ${component.complexity.loops}
- Complexity Score: ${component.complexity.score}/10

## Services

${component.services.map(s => `- **${s.name}** (${s.type}) - Line ${s.line}`).join('\n') || 'No services found.'}

## Dependencies

${component.dependencies.map(d => `- ${d}`).join('\n') || 'No dependencies.'}

## APIs

${component.apis.map(api => `- **${api.method}** ${api.path}`).join('\n') || 'No APIs exposed.'}

## Configuration

Ports: ${component.ports.join(', ') || 'None'}

## Error Handling

Error patterns detected: ${component.errors}
`;
    }
    
    /**
     * Generate implementation guides
     */
    async generateImplementationGuides(analysis) {
        const guides = {
            setup: this.generateSetupGuide(analysis),
            deployment: this.generateDeploymentGuide(analysis),
            troubleshooting: this.generateTroubleshootingGuide()
        };
        
        for (const [name, content] of Object.entries(guides)) {
            await fs.writeFile(
                path.join(this.docsPath, `GUIDE_${name.toUpperCase()}.md`),
                content
            );
        }
    }
    
    /**
     * Generate setup guide
     */
    generateSetupGuide(analysis) {
        const ports = Array.from(analysis.ports);
        const dependencies = Array.from(analysis.dependencies.keys())
            .filter(d => !d.startsWith('.'));
        
        return `# Setup Guide

## Prerequisites

- Node.js v14 or higher
- npm or yarn
- Available ports: ${ports.join(', ')}

## Installation

\`\`\`bash
# Clone the repository
git clone <repository-url>
cd <project-directory>

# Install dependencies
npm install ${dependencies.join(' ')}

# Create required directories
mkdir -p ledgers shells game-modules
\`\`\`

## Configuration

1. Create blessing.json:
\`\`\`json
{
  "status": "blessed",
  "can_propagate": true
}
\`\`\`

2. Set environment variables:
\`\`\`bash
export NODE_ENV=production
export ANTHROPIC_API_KEY=your-key-here
\`\`\`

## Starting Services

### Option 1: Master Orchestrator (Recommended)
\`\`\`bash
node MASTER_ORCHESTRATOR.js
\`\`\`

### Option 2: Individual Services
\`\`\`bash
# Start Cal Riven
node runtime/riven-cli-server.js &

# Start Domingo Economy
node domingo-surface/domingo-bounty-economy.js &

# Start Arena
node GLADIATOR_ARENA_STANDALONE.js &
\`\`\`

## Verification

1. Check Master Control: http://localhost:3006
2. Check Arena: http://localhost:3004
3. Check Cal Riven: http://localhost:4040

## Common Issues

${Array.from(this.commonErrors.entries()).map(([key, error]) => 
`### ${error.pattern}
**Solution:** ${error.solution}`
).join('\n\n')}
`;
    }
    
    /**
     * Thread and idea management
     */
    async createThread(title, description, tags = []) {
        const thread = {
            id: crypto.randomBytes(8).toString('hex'),
            title,
            description,
            tags,
            created: new Date().toISOString(),
            status: 'open',
            ideas: [],
            connections: []
        };
        
        await fs.writeFile(
            path.join(this.docsPath, 'threads', `${thread.id}.json`),
            JSON.stringify(thread, null, 2)
        );
        
        return thread;
    }
    
    async addIdea(threadId, idea) {
        const threadPath = path.join(this.docsPath, 'threads', `${threadId}.json`);
        const thread = JSON.parse(await fs.readFile(threadPath, 'utf8'));
        
        const ideaObj = {
            id: crypto.randomBytes(4).toString('hex'),
            content: idea,
            timestamp: new Date().toISOString(),
            implemented: false
        };
        
        thread.ideas.push(ideaObj);
        
        await fs.writeFile(threadPath, JSON.stringify(thread, null, 2));
        
        return ideaObj;
    }
    
    /**
     * Generate visual dependency graph
     */
    generateDependencyGraph(analysis) {
        const mermaid = `graph TD
${analysis.components.map(c => {
    const deps = c.dependencies
        .filter(d => d.startsWith('.'))
        .map(d => {
            const depName = path.basename(d, '.js');
            return `    ${c.name} --> ${depName}`;
        })
        .join('\n');
    return deps;
}).filter(Boolean).join('\n')}

${Array.from(analysis.ports).map(port => {
    const component = analysis.components.find(c => c.ports.includes(port));
    if (component) {
        return `    ${component.name} -.->|port ${port}| Network`;
    }
}).filter(Boolean).join('\n')}
`;
        
        return mermaid;
    }
    
    /**
     * File dump analyzer
     */
    async analyzeFileDump(dumpPath) {
        console.log(`📦 Analyzing file dump: ${dumpPath}`);
        
        const dumpAnalysis = {
            path: dumpPath,
            timestamp: new Date().toISOString(),
            fileTypes: new Map(),
            totalSize: 0,
            structure: {},
            recommendations: []
        };
        
        await this.analyzeDumpStructure(dumpPath, dumpAnalysis);
        
        // Generate dump documentation
        const dumpDoc = this.generateDumpDocumentation(dumpAnalysis);
        
        await fs.writeFile(
            path.join(this.docsPath, `DUMP_ANALYSIS_${Date.now()}.md`),
            dumpDoc
        );
        
        return dumpAnalysis;
    }
    
    async analyzeDumpStructure(dirPath, analysis, depth = 0) {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            
            if (entry.isDirectory()) {
                await this.analyzeDumpStructure(fullPath, analysis, depth + 1);
            } else {
                const stats = await fs.stat(fullPath);
                const ext = path.extname(entry.name);
                
                analysis.totalSize += stats.size;
                
                if (!analysis.fileTypes.has(ext)) {
                    analysis.fileTypes.set(ext, { count: 0, totalSize: 0 });
                }
                
                const typeStats = analysis.fileTypes.get(ext);
                typeStats.count++;
                typeStats.totalSize += stats.size;
            }
        }
    }
    
    generateDumpDocumentation(analysis) {
        return `# File Dump Analysis

**Path:** ${analysis.path}  
**Date:** ${new Date(analysis.timestamp).toLocaleString()}  
**Total Size:** ${(analysis.totalSize / 1024 / 1024).toFixed(2)} MB

## File Type Distribution

${Array.from(analysis.fileTypes.entries())
    .sort((a, b) => b[1].totalSize - a[1].totalSize)
    .map(([ext, stats]) => 
`- **${ext || 'no extension'}**: ${stats.count} files (${(stats.totalSize / 1024).toFixed(2)} KB)`
    ).join('\n')}

## Recommendations

${analysis.recommendations.join('\n')}
`;
    }
    
    /**
     * Export functionality for CI/CD integration
     */
    async exportForCI() {
        const ciConfig = {
            version: this.currentVersion?.id || 'latest',
            services: [],
            tests: [],
            deploymentSteps: []
        };
        
        // Generate CI/CD configuration
        const currentAnalysis = this.currentVersion?.analysis;
        if (currentAnalysis) {
            ciConfig.services = currentAnalysis.components
                .filter(c => c.type === 'server')
                .map(c => ({
                    name: c.name,
                    path: c.path,
                    port: c.ports[0],
                    healthCheck: `/health`
                }));
        }
        
        // Export as multiple formats
        await fs.writeFile(
            path.join(this.docsPath, 'ci-config.json'),
            JSON.stringify(ciConfig, null, 2)
        );
        
        // Generate GitHub Actions workflow
        const workflow = this.generateGitHubActionsWorkflow(ciConfig);
        await fs.writeFile(
            path.join(this.docsPath, 'deploy.yml'),
            workflow
        );
        
        return ciConfig;
    }
    
    generateGitHubActionsWorkflow(config) {
        return `name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm install
    
    - name: Run tests
      run: npm test
    
    - name: Start services
      run: |
${config.services.map(s => 
`        node ${s.path} &`
).join('\n')}
    
    - name: Health checks
      run: |
${config.services.map(s => 
`        curl -f http://localhost:${s.port}${s.healthCheck} || exit 1`
).join('\n')}
`;
    }
    
    /**
     * Main execution
     */
    async run() {
        await this.initialize();
        
        // Analyze current codebase
        const version = await this.analyzeAndDocument();
        
        // Export for CI/CD
        await this.exportForCI();
        
        // Create initial thread for improvements
        const thread = await this.createThread(
            'System Improvements',
            'Track ideas for system enhancements',
            ['enhancement', 'architecture']
        );
        
        // Add discovered issues as ideas
        for (const [key, error] of this.commonErrors) {
            await this.addIdea(thread.id, `Fix: ${error.pattern} - ${error.solution}`);
        }
        
        console.log(`
📚 Documentation Complete!
========================
Version: ${version.id}
Components: ${version.analysis.components.length}
Common Errors: ${this.commonErrors.size}

View documentation at: ${this.docsPath}/README.md
        `);
    }
}

// Export for use as module
module.exports = DevOpsDocumentationEngine;

// Run if called directly
if (require.main === module) {
    const engine = new DevOpsDocumentationEngine();
    engine.run().catch(console.error);
}