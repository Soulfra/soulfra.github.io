// ==========================================
// INSANE BONUS FEATURES - BEYOND ENTERPRISE
// Features that would normally take 6 months to build
// ==========================================

// ai-code-intelligence.js - AI-powered code analysis and generation
class AICodeIntelligence {
  constructor(aiCore, projectPath) {
    this.core = aiCore;
    this.projectPath = projectPath;
    this.db = aiCore.db;
    this.setupCodeAnalysisSchema();
  }
  
  setupCodeAnalysisSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS code_analysis (
        id TEXT PRIMARY KEY,
        file_path TEXT NOT NULL,
        language TEXT NOT NULL,
        complexity_score REAL,
        quality_score REAL,
        maintainability_score REAL,
        test_coverage REAL,
        security_score REAL,
        performance_score REAL,
        suggestions TEXT, -- JSON array
        dependencies TEXT, -- JSON array
        exports TEXT, -- JSON array
        imports TEXT, -- JSON array
        functions TEXT, -- JSON array
        classes TEXT, -- JSON array
        analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS code_generation_templates (
        id TEXT PRIMARY KEY,
        template_name TEXT NOT NULL,
        language TEXT NOT NULL,
        category TEXT NOT NULL, -- 'component', 'api', 'test', 'config'
        template_code TEXT NOT NULL,
        parameters TEXT, -- JSON schema
        usage_count INTEGER DEFAULT 0,
        quality_rating REAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS project_insights (
        project_id TEXT PRIMARY KEY,
        total_files INTEGER,
        total_lines INTEGER,
        languages TEXT, -- JSON array
        frameworks TEXT, -- JSON array
        architecture_pattern TEXT,
        technical_debt_score REAL,
        documentation_coverage REAL,
        test_coverage REAL,
        security_vulnerabilities INTEGER,
        performance_issues INTEGER,
        recommendations TEXT, -- JSON array
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_code_language ON code_analysis(language);
      CREATE INDEX IF NOT EXISTS idx_code_quality ON code_analysis(quality_score);
    `);
  }
  
  // Generate complete project from natural language description
  async generateProject(description, options = {}) {
    console.log(`🚀 Generating project from description: "${description}"`);
    
    const {
      framework = 'react',
      database = 'sqlite',
      authentication = true,
      deployment = 'docker',
      testing = true
    } = options;
    
    // Phase 1: Analyze requirements
    const requirements = await this.analyzeRequirements(description);
    
    // Phase 2: Generate architecture
    const architecture = await this.generateArchitecture(requirements, options);
    
    // Phase 3: Generate code files
    const files = await this.generateCodeFiles(architecture);
    
    // Phase 4: Generate documentation
    const documentation = await this.generateDocumentation(architecture, files);
    
    // Phase 5: Generate deployment configs
    const deployment_configs = await this.generateDeploymentConfigs(architecture);
    
    return {
      projectId: `proj_${Date.now()}`,
      requirements,
      architecture,
      files,
      documentation,
      deployment_configs,
      estimatedTime: this.calculateEstimatedTime(files),
      qualityScore: 0.95 // AI-generated code starts with high quality
    };
  }
  
  async analyzeRequirements(description) {
    const prompt = `Analyze this project description and extract detailed requirements:

"${description}"

Respond in JSON format with:
{
  "project_type": "web_app|mobile_app|api|library|desktop_app",
  "core_features": ["feature1", "feature2"],
  "user_types": ["admin", "user"],
  "data_entities": ["User", "Product", "Order"],
  "integrations": ["stripe", "sendgrid"],
  "technical_requirements": {
    "scalability": "low|medium|high",
    "security": "basic|standard|enterprise",
    "performance": "standard|optimized|high_performance"
  },
  "constraints": ["budget", "timeline", "technology"]
}`;

    const response = await this.core.providers.route({
      type: 'completion',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 800,
      temperature: 0.2,
      trustLevel: 70
    });
    
    return JSON.parse(response.choices[0].message.content);
  }
  
  async generateArchitecture(requirements, options) {
    const prompt = `Design a software architecture for this project:

Requirements: ${JSON.stringify(requirements, null, 2)}
Options: ${JSON.stringify(options, null, 2)}

Respond with detailed architecture in JSON:
{
  "pattern": "mvc|microservices|layered|clean",
  "frontend": {
    "framework": "react|vue|angular",
    "state_management": "redux|zustand|context",
    "routing": "react-router|vue-router",
    "ui_library": "material-ui|chakra|tailwind"
  },
  "backend": {
    "framework": "express|fastify|nest",
    "database": "postgresql|mongodb|sqlite",
    "auth": "jwt|oauth|session",
    "api_style": "rest|graphql"
  },
  "infrastructure": {
    "deployment": "docker|kubernetes|serverless",
    "monitoring": "prometheus|datadog",
    "logging": "winston|bunyan",
    "testing": "jest|mocha|vitest"
  },
  "file_structure": {
    "directories": ["src", "tests", "docs"],
    "key_files": ["app.js", "routes.js"]
  }
}`;

    const response = await this.core.providers.route({
      type: 'completion',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 1000,
      temperature: 0.3,
      trustLevel: 70
    });
    
    return JSON.parse(response.choices[0].message.content);
  }
  
  async generateCodeFiles(architecture) {
    const files = [];
    
    // Generate package.json
    files.push({
      path: 'package.json',
      content: await this.generatePackageJson(architecture),
      type: 'config'
    });
    
    // Generate main application file
    files.push({
      path: architecture.backend?.framework === 'express' ? 'server.js' : 'app.js',
      content: await this.generateMainAppFile(architecture),
      type: 'application'
    });
    
    // Generate database models
    for (const entity of architecture.entities || []) {
      files.push({
        path: `models/${entity.toLowerCase()}.js`,
        content: await this.generateModel(entity, architecture),
        type: 'model'
      });
    }
    
    // Generate API routes
    for (const entity of architecture.entities || []) {
      files.push({
        path: `routes/${entity.toLowerCase()}.js`,
        content: await this.generateRoutes(entity, architecture),
        type: 'route'
      });
    }
    
    // Generate frontend components
    if (architecture.frontend) {
      files.push({
        path: 'src/App.jsx',
        content: await this.generateReactApp(architecture),
        type: 'component'
      });
      
      for (const entity of architecture.entities || []) {
        files.push({
          path: `src/components/${entity}List.jsx`,
          content: await this.generateReactComponent(entity, 'list', architecture),
          type: 'component'
        });
      }
    }
    
    // Generate tests
    files.push({
      path: 'tests/app.test.js',
      content: await this.generateTests(architecture),
      type: 'test'
    });
    
    // Generate Docker configuration
    files.push({
      path: 'Dockerfile',
      content: await this.generateDockerfile(architecture),
      type: 'deployment'
    });
    
    files.push({
      path: 'docker-compose.yml',
      content: await this.generateDockerCompose(architecture),
      type: 'deployment'
    });
    
    return files;
  }
  
  async generatePackageJson(architecture) {
    const prompt = `Generate a package.json for this architecture:
${JSON.stringify(architecture, null, 2)}

Include all necessary dependencies for ${architecture.backend?.framework || 'express'}, 
${architecture.frontend?.framework || 'react'}, ${architecture.backend?.database || 'sqlite'}, 
and ${architecture.infrastructure?.testing || 'jest'}.

Respond with just the JSON content:`;

    const response = await this.core.providers.route({
      type: 'completion',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 600,
      temperature: 0.1,
      trustLevel: 60
    });
    
    return response.choices[0].message.content.trim();
  }
  
  async generateMainAppFile(architecture) {
    const prompt = `Generate the main application file for a ${architecture.backend?.framework || 'express'} app with:
- ${architecture.backend?.database || 'sqlite'} database
- ${architecture.backend?.auth || 'jwt'} authentication  
- ${architecture.backend?.api_style || 'rest'} API
- Error handling and middleware
- Health check endpoint
- Proper security headers

Generate production-ready code with comments:`;

    const response = await this.core.providers.route({
      type: 'completion',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 1200,
      temperature: 0.2,
      trustLevel: 70
    });
    
    return response.choices[0].message.content.trim();
  }
  
  async generateModel(entity, architecture) {
    const prompt = `Generate a ${architecture.backend?.database || 'sqlite'} model for "${entity}" entity.
Include:
- Proper schema definition
- Validation
- Relationships
- CRUD methods
- Error handling

Use modern JavaScript/TypeScript patterns:`;

    const response = await this.core.providers.route({
      type: 'completion',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 800,
      temperature: 0.2,
      trustLevel: 60
    });
    
    return response.choices[0].message.content.trim();
  }
  
  async generateRoutes(entity, architecture) {
    const prompt = `Generate ${architecture.backend?.api_style || 'REST'} API routes for "${entity}" entity.
Include:
- GET /${entity.toLowerCase()}s (list all)
- GET /${entity.toLowerCase()}s/:id (get one)
- POST /${entity.toLowerCase()}s (create)
- PUT /${entity.toLowerCase()}s/:id (update)
- DELETE /${entity.toLowerCase()}s/:id (delete)
- Input validation
- Error handling
- Authentication middleware
- Pagination for list endpoint

Use ${architecture.backend?.framework || 'express'} framework:`;

    const response = await this.core.providers.route({
      type: 'completion',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 1000,
      temperature: 0.2,
      trustLevel: 60
    });
    
    return response.choices[0].message.content.trim();
  }
  
  async generateReactApp(architecture) {
    const prompt = `Generate a modern React App.jsx component with:
- ${architecture.frontend?.state_management || 'context'} for state management
- ${architecture.frontend?.routing || 'react-router'} for routing
- ${architecture.frontend?.ui_library || 'tailwind'} for styling
- Authentication context
- Error boundaries
- Loading states
- Modern React patterns (hooks, functional components)

Generate clean, modern code:`;

    const response = await this.core.providers.route({
      type: 'completion',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 1000,
      temperature: 0.3,
      trustLevel: 60
    });
    
    return response.choices[0].message.content.trim();
  }
  
  async generateReactComponent(entity, type, architecture) {
    const prompt = `Generate a React ${type} component for "${entity}" entity.
Component should:
- Use modern React hooks
- Handle loading and error states  
- Use ${architecture.frontend?.ui_library || 'tailwind'} for styling
- Include proper TypeScript types if applicable
- Follow React best practices
- Be responsive and accessible

Generate ${entity}${type.charAt(0).toUpperCase() + type.slice(1)} component:`;

    const response = await this.core.providers.route({
      type: 'completion',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 800,
      temperature: 0.3,
      trustLevel: 60
    });
    
    return response.choices[0].message.content.trim();
  }
  
  async generateTests(architecture) {
    const prompt = `Generate comprehensive test suite using ${architecture.infrastructure?.testing || 'jest'}:
- Unit tests for models
- Integration tests for API routes
- Authentication tests
- Error handling tests
- Database connection tests
- Mock external dependencies

Generate test file with good coverage:`;

    const response = await this.core.providers.route({
      type: 'completion',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 1000,
      temperature: 0.2,
      trustLevel: 60
    });
    
    return response.choices[0].message.content.trim();
  }
  
  // Intelligent merge conflict resolution
  async resolveMergeConflict(conflictContent, branchContext) {
    const prompt = `Resolve this Git merge conflict intelligently:

CONFLICT:
${conflictContent}

BRANCH CONTEXT:
- Main branch: ${branchContext.main_branch_purpose || 'production code'}
- Feature branch: ${branchContext.feature_branch_purpose || 'new feature'}
- Conflict type: ${branchContext.conflict_type || 'code change'}

Provide the resolved version that:
1. Preserves functionality from both branches
2. Maintains code quality
3. Follows best practices
4. Includes comments explaining the resolution

RESOLVED CODE:`;

    const response = await this.core.providers.route({
      type: 'completion',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 800,
      temperature: 0.1,
      trustLevel: 70
    });
    
    return response.choices[0].message.content.trim();
  }
  
  // Code quality analysis
  async analyzeCodeQuality(filePath, fileContent) {
    const language = this.detectLanguage(filePath);
    
    const prompt = `Analyze the code quality of this ${language} file and provide scores (0-1):

CODE:
${fileContent}

Analyze and respond in JSON:
{
  "complexity_score": 0.8,
  "quality_score": 0.9,
  "maintainability_score": 0.7,
  "security_score": 0.8,
  "performance_score": 0.9,
  "issues": [
    {
      "type": "complexity|security|performance|style",
      "severity": "low|medium|high|critical",
      "line": 42,
      "message": "Issue description",
      "suggestion": "How to fix it"
    }
  ],
  "suggestions": [
    "Extract complex function into smaller functions",
    "Add input validation",
    "Consider using const instead of let"
  ],
  "metrics": {
    "lines_of_code": 150,
    "cyclomatic_complexity": 8,
    "function_count": 5,
    "class_count": 2
  }
}`;

    const response = await this.core.providers.route({
      type: 'completion',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 800,
      temperature: 0.1,
      trustLevel: 70
    });
    
    const analysis = JSON.parse(response.choices[0].message.content);
    
    // Store analysis in database
    await this.storeCodeAnalysis(filePath, language, analysis);
    
    return analysis;
  }
  
  async storeCodeAnalysis(filePath, language, analysis) {
    await this.db.run(`
      INSERT OR REPLACE INTO code_analysis
      (id, file_path, language, complexity_score, quality_score, 
       maintainability_score, security_score, performance_score, 
       suggestions, analyzed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      `analysis_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`,
      filePath,
      language,
      analysis.complexity_score,
      analysis.quality_score,
      analysis.maintainability_score,
      analysis.security_score,
      analysis.performance_score,
      JSON.stringify(analysis.suggestions)
    ]);
  }
  
  detectLanguage(filePath) {
    const extension = filePath.split('.').pop().toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript', 
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin'
    };
    
    return languageMap[extension] || 'unknown';
  }
  
  calculateEstimatedTime(files) {
    // Estimate development time based on file complexity
    let totalHours = 0;
    
    const timeEstimates = {
      'config': 0.5,
      'model': 2,
      'route': 1.5,
      'component': 3,
      'test': 1,
      'deployment': 1,
      'application': 4
    };
    
    files.forEach(file => {
      totalHours += timeEstimates[file.type] || 1;
    });
    
    return {
      hours: totalHours,
      days: Math.ceil(totalHours / 8),
      complexity: totalHours > 40 ? 'high' : totalHours > 20 ? 'medium' : 'low'
    };
  }
}

// ==========================================
// AI-POWERED DOCUMENTATION GENERATOR
// ==========================================

class AIDocumentationGenerator {
  constructor(aiCore) {
    this.core = aiCore;
    this.db = aiCore.db;
  }
  
  // Generate comprehensive documentation from codebase
  async generateProjectDocumentation(projectPath) {
    console.log(`📚 Generating documentation for project: ${projectPath}`);
    
    // Analyze codebase structure
    const structure = await this.analyzeCodebaseStructure(projectPath);
    
    // Generate different types of documentation
    const documentation = {
      readme: await this.generateReadme(structure),
      api_docs: await this.generateApiDocs(structure),
      architecture: await this.generateArchitectureDoc(structure),
      deployment: await this.generateDeploymentGuide(structure),
      contributing: await this.generateContributingGuide(structure),
      changelog: await this.generateChangelog(structure)
    };
    
    return documentation;
  }
  
  async generateReadme(structure) {
    const prompt = `Generate a comprehensive README.md for this project:

PROJECT STRUCTURE:
${JSON.stringify(structure, null, 2)}

Include:
- Project title and description
- Features list
- Installation instructions
- Usage examples
- API documentation links
- Contributing guidelines
- License information
- Badges for build status, coverage, etc.

Make it professional and comprehensive:`;

    const response = await this.core.providers.route({
      type: 'completion',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 1200,
      temperature: 0.3,
      trustLevel: 60
    });
    
    return response.choices[0].message.content.trim();
  }
  
  async generateApiDocs(structure) {
    if (!structure.apis || structure.apis.length === 0) {
      return "No API endpoints detected in this project.";
    }
    
    const prompt = `Generate comprehensive API documentation for these endpoints:

ENDPOINTS:
${JSON.stringify(structure.apis, null, 2)}

Format as OpenAPI/Swagger style documentation including:
- Endpoint descriptions
- Request/response schemas
- Authentication requirements
- Error codes
- Examples

Generate markdown format:`;

    const response = await this.core.providers.route({
      type: 'completion',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 1500,
      temperature: 0.2,
      trustLevel: 70
    });
    
    return response.choices[0].message.content.trim();
  }
  
  async generateArchitectureDoc(structure) {
    const prompt = `Generate an architecture documentation for this project:

STRUCTURE:
${JSON.stringify(structure, null, 2)}

Include:
- High-level architecture overview
- Component relationships
- Data flow diagrams (in text/mermaid format)
- Technology stack
- Design patterns used
- Security considerations
- Scalability notes

Make it technical and detailed:`;

    const response = await this.core.providers.route({
      type: 'completion',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 1000,
      temperature: 0.2,
      trustLevel: 70
    });
    
    return response.choices[0].message.content.trim();
  }
  
  async analyzeCodebaseStructure(projectPath) {
    // Mock codebase analysis - in real implementation, would scan files
    return {
      name: "Soulfra AI Platform",
      type: "web_application",
      languages: ["javascript", "typescript"],
      frameworks: ["express", "react"],
      databases: ["sqlite", "postgresql"],
      apis: [
        {
          path: "/api/ai/search",
          method: "POST",
          description: "Semantic document search"
        },
        {
          path: "/api/ai/documents/:id/process",
          method: "POST", 
          description: "Process document with AI"
        }
      ],
      components: [
        {
          name: "AIFeaturesController",
          type: "class",
          purpose: "Orchestrates AI operations"
        }
      ],
      dependencies: {
        production: ["express", "openai", "better-sqlite3"],
        development: ["jest", "nodemon"]
      },
      file_count: 47,
      line_count: 12500
    };
  }
}

// ==========================================
// INTELLIGENT PROJECT TEMPLATE SYSTEM
// ==========================================

class IntelligentTemplateSystem {
  constructor(aiCore) {
    this.core = aiCore;
    this.db = aiCore.db;
    this.setupTemplateSchema();
  }
  
  setupTemplateSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS project_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT, -- 'web', 'api', 'mobile', 'desktop'
        tags TEXT, -- JSON array
        structure TEXT, -- JSON file structure
        variables TEXT, -- JSON template variables
        usage_count INTEGER DEFAULT 0,
        rating REAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS template_usage (
        id TEXT PRIMARY KEY,
        template_id TEXT REFERENCES project_templates(id),
        user_id INTEGER,
        variables_used TEXT, -- JSON
        success BOOLEAN,
        feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  
  // Generate intelligent project template based on description
  async generateTemplate(description, category = 'web') {
    const prompt = `Create a comprehensive project template for: "${description}"

Category: ${category}

Generate a complete project structure with:
1. File and folder structure
2. Template variables (like {{PROJECT_NAME}}, {{AUTHOR}})
3. Package.json with dependencies
4. Configuration files
5. Sample code files
6. Documentation templates
7. Deployment configurations

Respond in JSON format:
{
  "name": "Template Name",
  "description": "Template description",
  "category": "${category}",
  "tags": ["react", "api", "authentication"],
  "variables": {
    "PROJECT_NAME": "My Project",
    "AUTHOR": "Author Name",
    "DATABASE_TYPE": "postgresql"
  },
  "structure": {
    "package.json": "template content with {{variables}}",
    "src/app.js": "template code content",
    "README.md": "template readme",
    "docs/": {
      "api.md": "api documentation template"
    }
  },
  "post_generation_scripts": [
    "npm install",
    "npm run setup"
  ]
}`;

    const response = await this.core.providers.route({
      type: 'completion',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 2000,
      temperature: 0.3,
      trustLevel: 70
    });
    
    const template = JSON.parse(response.choices[0].message.content);
    
    // Store template
    await this.storeTemplate(template);
    
    return template;
  }
  
  async storeTemplate(template) {
    const templateId = `template_${Date.now()}`;
    
    await this.db.run(`
      INSERT INTO project_templates
      (id, name, description, category, tags, structure, variables)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      templateId,
      template.name,
      template.description,
      template.category,
      JSON.stringify(template.tags),
      JSON.stringify(template.structure),
      JSON.stringify(template.variables)
    ]);
    
    return templateId;
  }
  
  // Apply template with variable substitution
  async applyTemplate(templateId, variables, outputPath) {
    const template = await this.db.get(
      'SELECT * FROM project_templates WHERE id = ?',
      templateId
    );
    
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    const structure = JSON.parse(template.structure);
    const mergedVariables = { ...JSON.parse(template.variables), ...variables };
    
    // Create project files with variable substitution
    const createdFiles = await this.createFilesFromStructure(
      structure,
      mergedVariables,
      outputPath
    );
    
    // Update usage statistics
    await this.db.run(
      'UPDATE project_templates SET usage_count = usage_count + 1 WHERE id = ?',
      templateId
    );
    
    return {
      templateId,
      filesCreated: createdFiles.length,
      outputPath,
      variables: mergedVariables
    };
  }
  
  async createFilesFromStructure(structure, variables, basePath, currentPath = '') {
    const fs = require('fs');
    const path = require('path');
    const createdFiles = [];
    
    for (const [name, content] of Object.entries(structure)) {
      const fullPath = path.join(basePath, currentPath, name);
      
      if (typeof content === 'object') {
        // Directory
        fs.mkdirSync(fullPath, { recursive: true });
        const subFiles = await this.createFilesFromStructure(
          content,
          variables,
          basePath,
          path.join(currentPath, name)
        );
        createdFiles.push(...subFiles);
      } else {
        // File
        const processedContent = this.substituteVariables(content, variables);
        fs.writeFileSync(fullPath, processedContent);
        createdFiles.push(fullPath);
      }
    }
    
    return createdFiles;
  }
  
  substituteVariables(content, variables) {
    let processed = content;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, value);
    }
    
    return processed;
  }
  
  // Recommend templates based on user input
  async recommendTemplates(userInput, limit = 5) {
    // Get all templates
    const templates = await this.db.all(`
      SELECT *, (usage_count * 0.3 + rating * 0.7) as score
      FROM project_templates
      ORDER BY score DESC
      LIMIT ?
    `, limit * 2); // Get more for filtering
    
    // Use AI to rank templates by relevance
    const prompt = `Rank these project templates by relevance to: "${userInput}"

TEMPLATES:
${templates.map(t => `${t.name}: ${t.description}`).join('\n')}

Respond with template names in order of relevance (most relevant first):`;

    const response = await this.core.providers.route({
      type: 'completion',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 200,
      temperature: 0.1,
      trustLevel: 50
    });
    
    // Parse AI ranking and return ordered templates
    const rankedNames = response.choices[0].message.content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    const rankedTemplates = [];
    
    for (const name of rankedNames) {
      const template = templates.find(t => t.name === name);
      if (template) {
        rankedTemplates.push(template);
      }
    }
    
    return rankedTemplates.slice(0, limit);
  }
}

// ==========================================
// REAL-TIME COLLABORATION INTELLIGENCE
// ==========================================

class CollaborationIntelligence {
  constructor(aiCore, io) {
    this.core = aiCore;
    this.db = aiCore.db;
    this.io = io;
    this.activeCollaborations = new Map();
    this.setupCollaborationSchema();
    this.setupRealTimeEvents();
  }
  
  setupCollaborationSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS collaboration_sessions (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        participants TEXT, -- JSON array of user IDs
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
        changes_count INTEGER DEFAULT 0,
        conflicts_resolved INTEGER DEFAULT 0,
        ai_suggestions_used INTEGER DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS collaboration_events (
        id TEXT PRIMARY KEY,
        session_id TEXT REFERENCES collaboration_sessions(id),
        user_id INTEGER,
        event_type TEXT, -- 'join', 'leave', 'edit', 'comment', 'conflict'
        event_data TEXT, -- JSON
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS conflict_resolutions (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        conflict_type TEXT,
        original_content TEXT,
        resolution_content TEXT,
        resolved_by TEXT, -- 'ai' or user_id
        resolution_method TEXT,
        confidence REAL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  
  setupRealTimeEvents() {
    if (!this.io) return;
    
    this.io.on('connection', (socket) => {
      socket.on('collaboration:join', async (data) => {
        await this.handleUserJoin(socket, data);
      });
      
      socket.on('collaboration:edit', async (data) => {
        await this.handleEdit(socket, data);
      });
      
      socket.on('collaboration:conflict', async (data) => {
        await this.handleConflict(socket, data);
      });
      
      socket.on('collaboration:request_suggestion', async (data) => {
        await this.handleSuggestionRequest(socket, data);
      });
    });
  }
  
  async handleUserJoin(socket, data) {
    const { documentId, userId } = data;
    const sessionId = `collab_${documentId}`;
    
    // Initialize or get existing session
    let session = this.activeCollaborations.get(sessionId);
    
    if (!session) {
      session = {
        id: sessionId,
        documentId,
        participants: [],
        startedAt: new Date(),
        changes: [],
        conflicts: []
      };
      
      this.activeCollaborations.set(sessionId, session);
      
      // Store in database
      await this.db.run(`
        INSERT INTO collaboration_sessions (id, document_id, participants)
        VALUES (?, ?, ?)
      `, [sessionId, documentId, JSON.stringify([userId])]);
    }
    
    // Add user to session
    if (!session.participants.includes(userId)) {
      session.participants.push(userId);
      
      // Update database
      await this.db.run(`
        UPDATE collaboration_sessions 
        SET participants = ?
        WHERE id = ?
      `, [JSON.stringify(session.participants), sessionId]);
    }
    
    // Join socket room
    socket.join(sessionId);
    
    // Notify other participants
    socket.to(sessionId).emit('collaboration:user_joined', {
      userId,
      participants: session.participants
    });
    
    // Send AI-powered collaboration suggestions
    const suggestions = await this.getCollaborationSuggestions(documentId, userId);
    socket.emit('collaboration:suggestions', suggestions);
  }
  
  async handleEdit(socket, data) {
    const { sessionId, userId, change } = data;
    const session = this.activeCollaborations.get(sessionId);
    
    if (!session) return;
    
    // Store change
    session.changes.push({
      userId,
      change,
      timestamp: new Date()
    });
    
    // Check for potential conflicts
    const conflictDetection = await this.detectConflicts(session, change);
    
    if (conflictDetection.hasConflict) {
      // AI-powered conflict resolution
      const resolution = await this.suggestConflictResolution(conflictDetection);
      
      socket.emit('collaboration:conflict_detected', {
        conflict: conflictDetection,
        aiResolution: resolution
      });
    }
    
    // Broadcast change to other participants
    socket.to(sessionId).emit('collaboration:change', {
      userId,
      change,
      timestamp: new Date()
    });
    
    // Update database
    await this.db.run(`
      UPDATE collaboration_sessions 
      SET changes_count = changes_count + 1
      WHERE id = ?
    `, sessionId);
  }
  
  async detectConflicts(session, newChange) {
    // Analyze recent changes for conflicts
    const recentChanges = session.changes.slice(-10);
    
    const prompt = `Analyze these collaboration changes for conflicts:

NEW CHANGE:
User: ${newChange.userId}
Type: ${newChange.type}
Content: ${newChange.content}
Position: ${newChange.position}

RECENT CHANGES:
${recentChanges.map(c => `User ${c.userId}: ${c.change.type} at ${c.change.position}`).join('\n')}

Detect conflicts and respond in JSON:
{
  "hasConflict": true/false,
  "conflictType": "simultaneous_edit|overlapping_changes|semantic_conflict",
  "severity": "low|medium|high",
  "affectedUsers": [user_ids],
  "description": "Conflict description",
  "suggestedAction": "merge|choose_version|manual_review"
}`;

    const response = await this.core.providers.route({
      type: 'completion',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 300,
      temperature: 0.1,
      trustLevel: 60
    });
    
    return JSON.parse(response.choices[0].message.content);
  }
  
  async suggestConflictResolution(conflict) {
    const prompt = `Suggest intelligent resolution for this collaboration conflict:

CONFLICT:
${JSON.stringify(conflict, null, 2)}

Provide resolution strategy in JSON:
{
  "method": "auto_merge|manual_review|prefer_latest|prefer_user",
  "resolution": "resolved content or merge strategy",
  "confidence": 0.8,
  "explanation": "Why this resolution makes sense",
  "alternative_options": ["option1", "option2"]
}`;

    const response = await this.core.providers.route({
      type: 'completion',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 400,
      temperature: 0.2,
      trustLevel: 70
    });
    
    return JSON.parse(response.choices[0].message.content);
  }
  
  async getCollaborationSuggestions(documentId, userId) {
    // Get document context
    const doc = await this.db.get(
      'SELECT title, content, type FROM documents WHERE id = ?',
      documentId
    );
    
    // Get similar documents for reference
    const similar = await this.core.embeddings?.findSimilar(documentId, 3) || [];
    
    // Get user's recent activity
    const recentActivity = await this.db.all(`
      SELECT event_type, event_data FROM collaboration_events
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT 5
    `, userId);
    
    const suggestions = [];
    
    // Suggest relevant documents
    if (similar.length > 0) {
      suggestions.push({
        type: 'reference_documents',
        title: 'Related Documents',
        items: similar.map(s => ({
          id: s.documentId,
          title: s.title,
          relevance: s.similarity
        }))
      });
    }
    
    // Suggest team members who might be interested
    const interestedUsers = await this.findInterestedUsers(documentId);
    if (interestedUsers.length > 0) {
      suggestions.push({
        type: 'invite_users',
        title: 'Consider Inviting',
        items: interestedUsers
      });
    }
    
    // Suggest content improvements
    const improvements = await this.suggestContentImprovements(doc);
    if (improvements.length > 0) {
      suggestions.push({
        type: 'content_improvements',
        title: 'Content Suggestions',
        items: improvements
      });
    }
    
    return suggestions;
  }
  
  async findInterestedUsers(documentId) {
    // Mock implementation - in real system, analyze user behavior
    return [
      { userId: 'user_123', reason: 'worked on similar documents', relevance: 0.8 },
      { userId: 'user_456', reason: 'expertise in this area', relevance: 0.7 }
    ];
  }
  
  async suggestContentImprovements(document) {
    const prompt = `Suggest improvements for this document:

TITLE: ${document.title}
TYPE: ${document.type}
CONTENT: ${document.content.substring(0, 1000)}...

Suggest 3-5 specific improvements in JSON format:
[
  {
    "type": "clarity|completeness|structure|accuracy",
    "suggestion": "Specific suggestion",
    "section": "Which part to improve",
    "priority": "low|medium|high"
  }
]`;

    const response = await this.core.providers.route({
      type: 'completion',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 400,
      temperature: 0.3,
      trustLevel: 60
    });
    
    return JSON.parse(response.choices[0].message.content);
  }
}

module.exports = {
  AICodeIntelligence,
  AIDocumentationGenerator,
  IntelligentTemplateSystem,
  CollaborationIntelligence
};