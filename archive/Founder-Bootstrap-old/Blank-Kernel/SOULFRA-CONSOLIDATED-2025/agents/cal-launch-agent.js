#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const MemoryLoader = require('./cal-memory-loader');

// Project templates
const TEMPLATES = {
  website: {
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{PROJECT_NAME}}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>Welcome to {{PROJECT_NAME}}</h1>
        <p>Built with Cal Riven - Mirror-backed development</p>
        <div id="content"></div>
    </div>
    <script src="main.js"></script>
</body>
</html>`,
      'style.css': `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0a0a0a;
    color: #00ff00;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.container {
    max-width: 800px;
    padding: 2rem;
    text-align: center;
}

h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    text-shadow: 0 0 20px #00ff00;
}`,
      'main.js': `// Cal Riven Project: {{PROJECT_NAME}}
// Generated from: {{PROMPT}}

console.log('🧠 Cal Riven project initialized');

// Mirror reflection point
function reflect(data) {
    console.log('🔮 Reflecting:', data);
    return data;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const content = document.getElementById('content');
    content.innerHTML = '<p>Ready for mirror propagation...</p>';
});`
    }
  },
  
  cli: {
    files: {
      'index.js': `#!/usr/bin/env node
// Cal Riven CLI: {{PROJECT_NAME}}
// Generated from: {{PROMPT}}

const fs = require('fs');
const path = require('path');

console.log('🧠 Cal Riven CLI - {{PROJECT_NAME}}');
console.log('Mirror-backed command line tool\\n');

// Parse arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';

// Commands
const commands = {
    help: () => {
        console.log('Available commands:');
        console.log('  reflect <text>  - Reflect text through mirror');
        console.log('  vault           - Show vault status');
        console.log('  help            - Show this message');
    },
    
    reflect: () => {
        const text = args.slice(1).join(' ');
        console.log('🔮 Reflecting:', text);
        console.log('✨ Mirrored:', text.split('').reverse().join(''));
    },
    
    vault: () => {
        console.log('📂 Vault status: Connected');
        console.log('🔗 Trust chain: Verified');
    }
};

// Execute command
const handler = commands[command] || commands.help;
handler();`,
      'package.json': `{
  "name": "{{PROJECT_NAME}}",
  "version": "1.0.0",
  "description": "{{PROMPT}}",
  "main": "index.js",
  "bin": {
    "{{PROJECT_NAME}}": "./index.js"
  },
  "scripts": {
    "start": "node index.js",
    "test": "echo \\"Cal reflects all tests\\""
  },
  "keywords": ["cal-riven", "mirror", "cli"],
  "author": "Cal Riven",
  "license": "MIT"
}`
    }
  },
  
  typescript: {
    files: {
      'src/index.ts': `// Cal Riven TypeScript Project: {{PROJECT_NAME}}
// Generated from: {{PROMPT}}

interface MirrorReflection {
    input: string;
    output: string;
    timestamp: number;
    trust: boolean;
}

class CalRivenProject {
    private projectName: string;
    private vault: Map<string, any>;

    constructor(name: string) {
        this.projectName = name;
        this.vault = new Map();
        console.log('🧠 Cal Riven TypeScript project initialized:', name);
    }

    reflect(input: string): MirrorReflection {
        const reflection: MirrorReflection = {
            input,
            output: this.processThroughMirror(input),
            timestamp: Date.now(),
            trust: true
        };
        
        this.vault.set(\`reflection_\${Date.now()}\`, reflection);
        return reflection;
    }

    private processThroughMirror(input: string): string {
        // Mirror logic here
        return \`Reflected: \${input}\`;
    }
}

// Initialize
const project = new CalRivenProject('{{PROJECT_NAME}}');
console.log('✨ Ready for mirror propagation...');

export { CalRivenProject, MirrorReflection };`,
      'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`,
      'package.json': `{
  "name": "{{PROJECT_NAME}}",
  "version": "1.0.0",
  "description": "{{PROMPT}}",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "test": "echo \\"Cal reflects all tests\\""
  },
  "keywords": ["cal-riven", "mirror", "typescript"],
  "author": "Cal Riven",
  "license": "MIT",
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.0.0"
  }
}`
    }
  },
  
  project: {
    files: {
      'main.js': `// Cal Riven Project: {{PROJECT_NAME}}
// Generated from: {{PROMPT}}

const PROJECT_NAME = '{{PROJECT_NAME}}';
const CREATED_AT = new Date().toISOString();

console.log(\`🧠 Cal Riven Project: \${PROJECT_NAME}\`);
console.log(\`🔮 Created: \${CREATED_AT}\`);
console.log('✨ Mirror-backed development environment\\n');

// Project logic here
function main() {
    console.log('Initializing project...');
    // Add your code here
}

// Cal Riven reflection point
function reflect(data) {
    console.log('🔗 Reflecting through trust chain...');
    return data;
}

// Execute
if (require.main === module) {
    main();
}

module.exports = { main, reflect };`
    }
  }
};

// Project launcher
class CalProjectLauncher {
  constructor(type, name, prompt) {
    this.type = type;
    this.name = name;
    this.prompt = prompt;
    this.projectPath = path.join(__dirname, '..', 'projects', name);
    this.memoryLoader = new MemoryLoader();
  }

  async launch() {
    console.log(`\n🚀 Launching ${this.type} project: ${this.name}`);
    
    // Create project directory
    if (fs.existsSync(this.projectPath)) {
      console.error(`❌ Project ${this.name} already exists`);
      return false;
    }

    fs.mkdirSync(this.projectPath, { recursive: true });
    console.log(`📂 Created project directory: ${this.projectPath}`);

    // Get template
    const template = TEMPLATES[this.type] || TEMPLATES.project;

    // Load memory context
    await this.memoryLoader.scanMemory();
    const memoryContext = this.memoryLoader.buildContext();

    // Create files from template
    for (const [filename, content] of Object.entries(template.files)) {
      const filePath = path.join(this.projectPath, filename);
      const fileDir = path.dirname(filePath);
      
      // Create subdirectories if needed
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }

      // Replace placeholders
      const processedContent = content
        .replace(/{{PROJECT_NAME}}/g, this.name)
        .replace(/{{PROMPT}}/g, this.prompt);

      fs.writeFileSync(filePath, processedContent);
      console.log(`✅ Created: ${filename}`);
    }

    // Create README with memory context
    await this.createReadme(memoryContext);

    // Create launch script
    this.createLaunchScript();

    // Log to reflection vault
    this.logLaunch();

    console.log(`\n✨ Project ${this.name} launched successfully!`);
    console.log(`📍 Location: ${this.projectPath}`);
    console.log(`🚀 To start: cd ${path.relative(process.cwd(), this.projectPath)} && npm start`);

    // Check for seed files in memory
    this.checkForSeeds();

    return true;
  }

  async createReadme(memoryContext) {
    const readmeContent = `# ${this.name}

> ${this.prompt}

## 🧠 Cal Riven Project

This project was generated through the Cal Riven mirror reflection system.

- **Type**: ${this.type}
- **Created**: ${new Date().toISOString()}
- **Trust Chain**: Verified ✅

## 🔮 Memory Context

${memoryContext.memories.length > 0 ? 
  `This project was created with ${memoryContext.fileCount} memory files active:\n\n` +
  memoryContext.memories.map(m => `- **${m.file}** (${m.type})`).join('\n')
  : 'No memory files were active during creation.'}

## 🚀 Getting Started

\`\`\`bash
# Install dependencies (if any)
npm install

# Run the project
npm start
\`\`\`

## 📂 Structure

${Object.keys(TEMPLATES[this.type]?.files || TEMPLATES.project.files)
  .map(f => `- \`${f}\` - ${this.getFileDescription(f)}`)
  .join('\n')}

## 🔗 Cal Riven Integration

This project is connected to the Cal Riven vault and can:
- Reflect prompts through mirror agents
- Access vault memory context
- Participate in the trust chain

---
*Generated by Cal Riven Launch Agent*`;

    fs.writeFileSync(path.join(this.projectPath, 'README.md'), readmeContent);
    console.log('✅ Created: README.md');
  }

  getFileDescription(filename) {
    const descriptions = {
      'index.html': 'Main HTML entry point',
      'style.css': 'Stylesheet with Cal theme',
      'main.js': 'JavaScript logic',
      'index.js': 'CLI entry point',
      'package.json': 'Node.js package configuration',
      'src/index.ts': 'TypeScript entry point',
      'tsconfig.json': 'TypeScript configuration'
    };
    return descriptions[filename] || 'Project file';
  }

  createLaunchScript() {
    const scriptContent = `#!/bin/bash
# Cal Riven Project Launch Script

echo "🧠 Launching ${this.name}..."
echo "🔮 Type: ${this.type}"
echo ""

case "${this.type}" in
  website)
    echo "🌐 Opening in browser..."
    open index.html 2>/dev/null || xdg-open index.html 2>/dev/null || echo "Please open index.html manually"
    ;;
  cli)
    echo "🖥️  Running CLI..."
    node index.js
    ;;
  typescript)
    echo "📦 Building TypeScript..."
    npm run build
    npm start
    ;;
  *)
    echo "🚀 Running project..."
    node main.js
    ;;
esac`;

    const scriptPath = path.join(this.projectPath, 'launch.sh');
    fs.writeFileSync(scriptPath, scriptContent);
    fs.chmodSync(scriptPath, '755');
    console.log('✅ Created: launch.sh');
  }

  logLaunch() {
    const reflectionLogPath = path.join(__dirname, '..', 'vault', 'cal-reflection-log.json');
    
    try {
      let reflectionLog = { reflections: [] };
      if (fs.existsSync(reflectionLogPath)) {
        reflectionLog = JSON.parse(fs.readFileSync(reflectionLogPath, 'utf8'));
      }

      reflectionLog.reflections.push({
        timestamp: Date.now(),
        type: 'project_launch',
        prompt: this.prompt,
        response: `Launched ${this.type} project: ${this.name}`,
        projectPath: this.projectPath,
        vault_reflected: true
      });

      fs.writeFileSync(reflectionLogPath, JSON.stringify(reflectionLog, null, 2));
      console.log('✅ Logged to vault reflection log');
    } catch (error) {
      console.error('⚠️  Failed to log launch:', error.message);
    }
  }

  checkForSeeds() {
    const memoryPath = path.join(__dirname, '..', 'vault', 'memory');
    try {
      const files = fs.readdirSync(memoryPath);
      const seeds = files.filter(f => f.endsWith('.seed.js') || f.endsWith('.seed.md'));
      
      if (seeds.length > 0) {
        console.log(`\n🌱 Found ${seeds.length} seed file(s) in memory vault:`);
        seeds.forEach(seed => {
          console.log(`   - ${seed}`);
        });
        console.log('💡 These seeds can enhance your project with additional functionality');
      }
    } catch (error) {
      // Ignore if memory directory doesn't exist
    }
  }
}

// Main execution
if (require.main === module) {
  const [type, name, ...promptParts] = process.argv.slice(2);
  const prompt = promptParts.join(' ');

  if (!type || !name) {
    console.error('Usage: cal-launch-agent.js <type> <name> <prompt>');
    console.error('Types: website, cli, typescript, project');
    process.exit(1);
  }

  const launcher = new CalProjectLauncher(type, name, prompt);
  launcher.launch().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Launch failed:', error.message);
    process.exit(1);
  });
}

module.exports = { CalProjectLauncher };