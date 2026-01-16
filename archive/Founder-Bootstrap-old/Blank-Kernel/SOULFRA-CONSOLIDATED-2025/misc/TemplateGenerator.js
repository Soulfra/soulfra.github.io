#!/usr/bin/env node
/**
 * TemplateGenerator.js
 * Generates required files based on SOULFRA rules and templates
 * Creates consistent structure across the codebase
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class TemplateGenerator extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.rulesPath = options.rulesPath || path.join(process.cwd(), '.rules');
        this.templatesPath = path.join(this.rulesPath, 'templates');
        
        this.templates = {
            readme: this.readmeTemplate.bind(this),
            gitignore: this.gitignoreTemplate.bind(this),
            index: this.indexTemplate.bind(this),
            component: this.componentTemplate.bind(this),
            service: this.serviceTemplate.bind(this),
            hook: this.hookTemplate.bind(this),
            test: this.testTemplate.bind(this),
            package: this.packageTemplate.bind(this),
            tsconfig: this.tsconfigTemplate.bind(this),
            localRules: this.localRulesTemplate.bind(this)
        };
        
        this.directoryTemplates = {
            'src': ['README.md', 'index.ts'],
            'components': ['README.md', 'index.ts'],
            'services': ['README.md', 'index.ts'],
            'hooks': ['README.md', 'index.ts'],
            'utils': ['README.md', 'index.ts'],
            'api': ['README.md', 'index.ts'],
            'models': ['README.md', 'index.ts'],
            'features': ['README.md'],
            'tests': ['README.md', 'setup.ts'],
            'docs': ['README.md', 'ARCHITECTURE.md']
        };
    }
    
    async getRequiredFilesForDirectory(dirPath) {
        const dirName = path.basename(dirPath);
        const parentDir = path.basename(path.dirname(dirPath));
        const requiredFiles = [];
        
        // Check if it's a root project directory
        if (this.isProjectRoot(dirPath)) {
            requiredFiles.push(
                { name: 'README.md', type: 'readme' },
                { name: '.gitignore', type: 'gitignore' }
            );
            
            // Check for specific project types
            if (fs.existsSync(path.join(dirPath, 'src'))) {
                if (!fs.existsSync(path.join(dirPath, 'tsconfig.json'))) {
                    requiredFiles.push({ name: 'tsconfig.json', type: 'tsconfig' });
                }
            }
        }
        
        // Check directory-specific templates
        if (this.directoryTemplates[dirName]) {
            for (const file of this.directoryTemplates[dirName]) {
                requiredFiles.push({
                    name: file,
                    type: this.getFileType(file)
                });
            }
        }
        
        // Feature directories need specific structure
        if (parentDir === 'features' || dirName.endsWith('-feature')) {
            requiredFiles.push(
                { name: 'README.md', type: 'readme' },
                { name: 'index.ts', type: 'index' },
                { name: `${dirName}.types.ts`, type: 'types' },
                { name: `${dirName}.service.ts`, type: 'service' }
            );
        }
        
        return requiredFiles;
    }
    
    async generateFileContent(type, context = {}) {
        if (!this.templates[type]) {
            throw new Error(`Unknown template type: ${type}`);
        }
        
        return this.templates[type](context);
    }
    
    async generateLocalRules(dirPath) {
        const dirName = path.basename(dirPath);
        const context = {
            directory: dirName,
            path: dirPath,
            timestamp: new Date().toISOString()
        };
        
        return this.localRulesTemplate(context);
    }
    
    // Template methods
    readmeTemplate(context) {
        const { directory = 'Project', description = '' } = context;
        
        return `# ${directory}

${description || 'This directory contains ' + directory + ' related code.'}

## Structure

\`\`\`
${directory}/
├── README.md       # This file
├── index.ts        # Main exports
└── ...            # Implementation files
\`\`\`

## Usage

\`\`\`typescript
import { /* exports */ } from './${directory}';
\`\`\`

## Development

Follow the SOULFRA development guidelines:
- Maximum 3 levels of nesting
- Feature-first organization
- Clear, descriptive naming

## Rules

This directory follows the project-wide rules defined in \`.rules/\`.
See local rules in \`.rules\` file if present.

---
Generated on ${new Date().toISOString()}
`;
    }
    
    gitignoreTemplate(context) {
        return `# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output/

# Production
build/
dist/
out/

# Development
.env.local
.env.development.local
.env.test.local
.env.production.local
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.env

# Temporary
.tmp/
temp/
*.tmp
*.temp

# Local
.bound-to
mirror-trace-token.json
*.sig
`;
    }
    
    indexTemplate(context) {
        const { directory = 'module' } = context;
        
        return `/**
 * Index file for ${directory}
 * Central export point for all ${directory} functionality
 * 
 * @module ${directory}
 */

// Export all public APIs
// export * from './types';
// export * from './components';
// export * from './services';
// export * from './utils';

// Re-export specific items if needed
// export { default as MainComponent } from './MainComponent';

// Module initialization if needed
export default {
    name: '${directory}',
    version: '1.0.0',
    initialized: false,
    
    init() {
        if (this.initialized) return;
        
        console.log(\`Initializing ${directory} module...\`);
        this.initialized = true;
    }
};
`;
    }
    
    componentTemplate(context) {
        const { name = 'Component', props = [] } = context;
        
        return `import React from 'react';

interface ${name}Props {
    ${props.map(p => `${p}: any;`).join('\n    ')}
}

/**
 * ${name} component
 * 
 * @component
 */
export const ${name}: React.FC<${name}Props> = (props) => {
    return (
        <div className="${name.toLowerCase()}">
            {/* Component implementation */}
        </div>
    );
};

export default ${name};
`;
    }
    
    serviceTemplate(context) {
        const { name = 'Service', methods = [] } = context;
        
        return `/**
 * ${name}
 * Business logic and API interactions
 */

export class ${name} {
    private static instance: ${name};
    
    private constructor() {
        // Private constructor for singleton
    }
    
    static getInstance(): ${name} {
        if (!${name}.instance) {
            ${name}.instance = new ${name}();
        }
        return ${name}.instance;
    }
    
    ${methods.map(m => `
    async ${m}() {
        // Implementation
        throw new Error('Method not implemented');
    }`).join('\n    ')}
}

// Export singleton instance
export default ${name}.getInstance();
`;
    }
    
    hookTemplate(context) {
        const { name = 'useCustomHook' } = context;
        
        return `import { useState, useEffect, useCallback } from 'react';

/**
 * ${name}
 * Custom React hook for ${name.replace('use', '').toLowerCase()} functionality
 * 
 * @hook
 */
export function ${name}() {
    const [state, setState] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    useEffect(() => {
        // Side effects
    }, []);
    
    const action = useCallback(() => {
        // Hook logic
    }, []);
    
    return {
        state,
        loading,
        error,
        action
    };
}

export default ${name};
`;
    }
    
    testTemplate(context) {
        const { name = 'Component', type = 'component' } = context;
        
        return `import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ${name} from './${name}';

describe('${name}', () => {
    it('should render without crashing', () => {
        ${type === 'component' ? 
            `render(<${name} />);
        expect(screen.getByRole('${name.toLowerCase()}')).toBeInTheDocument();` :
            `const instance = new ${name}();
        expect(instance).toBeDefined();`
        }
    });
    
    it('should handle basic functionality', () => {
        // Add specific tests
    });
});
`;
    }
    
    packageTemplate(context) {
        const { name = 'project', description = '' } = context;
        
        return `{
  "name": "${name}",
  "version": "1.0.0",
  "description": "${description}",
  "main": "index.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest",
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "vitest": "^1.0.0"
  }
}
`;
    }
    
    tsconfigTemplate(context) {
        return `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/services/*": ["./src/services/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
`;
    }
    
    localRulesTemplate(context) {
        const { directory = '', path: dirPath = '' } = context;
        
        return `# Local Rules for ${directory}

This directory follows the SOULFRA project rules with these specific additions:

## Directory-Specific Rules

1. **File Organization**
   - All files in this directory must follow the ${directory} naming convention
   - Maximum file size: ${this.getMaxFileSize(directory)} lines
   - Required files: ${this.getRequiredFiles(directory).join(', ')}

2. **Code Style**
   - ${this.getCodeStyleRules(directory)}

3. **Dependencies**
   - This directory can depend on: ${this.getAllowedDependencies(directory)}
   - This directory cannot import from: ${this.getBlockedImports(directory)}

4. **Testing**
   - All files must have corresponding test files
   - Test coverage minimum: 80%

5. **Documentation**
   - All public APIs must be documented with JSDoc/TSDoc
   - README must be kept up to date with any structural changes

## Enforcement

These rules are automatically enforced by the Rules Orchestrator.
Violations will be logged to .rules/violations.log

Generated: ${context.timestamp}
`;
    }
    
    // Helper methods
    isProjectRoot(dirPath) {
        // Check for common root indicators
        const indicators = [
            'package.json',
            'tsconfig.json',
            '.git',
            'src',
            'README.md'
        ];
        
        return indicators.some(file => 
            fs.existsSync(path.join(dirPath, file))
        );
    }
    
    getFileType(fileName) {
        if (fileName === 'README.md') return 'readme';
        if (fileName === '.gitignore') return 'gitignore';
        if (fileName === 'index.ts' || fileName === 'index.js') return 'index';
        if (fileName === 'tsconfig.json') return 'tsconfig';
        if (fileName === 'package.json') return 'package';
        if (fileName.includes('.test.') || fileName.includes('.spec.')) return 'test';
        if (fileName.endsWith('.types.ts')) return 'types';
        return 'generic';
    }
    
    getMaxFileSize(directory) {
        const sizes = {
            'components': 200,
            'services': 300,
            'utils': 100,
            'hooks': 150,
            'api': 300
        };
        return sizes[directory] || 250;
    }
    
    getRequiredFiles(directory) {
        return this.directoryTemplates[directory] || ['README.md'];
    }
    
    getCodeStyleRules(directory) {
        const rules = {
            'components': 'Use functional components with TypeScript',
            'services': 'Use class-based services with singleton pattern',
            'hooks': 'Must start with "use" prefix',
            'utils': 'Pure functions only, no side effects'
        };
        return rules[directory] || 'Follow project-wide style guide';
    }
    
    getAllowedDependencies(directory) {
        const deps = {
            'components': ['hooks', 'utils', 'types'],
            'services': ['models', 'utils', 'types'],
            'api': ['services', 'models', 'utils'],
            'hooks': ['services', 'utils', 'types']
        };
        return (deps[directory] || ['utils', 'types']).join(', ');
    }
    
    getBlockedImports(directory) {
        const blocked = {
            'utils': ['components', 'pages', 'api'],
            'models': ['components', 'pages', 'api'],
            'types': ['*'] // Types shouldn't import anything
        };
        return (blocked[directory] || []).join(', ') || 'None';
    }
}

module.exports = TemplateGenerator;

// CLI testing
if (require.main === module) {
    const generator = new TemplateGenerator();
    
    const command = process.argv[2];
    const type = process.argv[3];
    const context = process.argv[4] ? JSON.parse(process.argv[4]) : {};
    
    if (!command || !type) {
        console.log('Usage: node TemplateGenerator.js generate <type> [context]');
        console.log('Types: readme, gitignore, index, component, service, hook, test');
        process.exit(1);
    }
    
    if (command === 'generate') {
        generator.generateFileContent(type, context)
            .then(content => console.log(content))
            .catch(err => console.error(err));
    }
}