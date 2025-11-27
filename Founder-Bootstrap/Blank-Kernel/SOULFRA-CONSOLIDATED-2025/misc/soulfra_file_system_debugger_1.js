#!/usr/bin/env node

// ==========================================
// SOULFRA FILE SYSTEM ISSUE DEBUGGER & FIXER
// Fix "File has not been read yet" and script generation issues
// ==========================================

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SoulframFileSystemFixer {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.verbose = process.argv.includes('--verbose');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      error: '❌',
      warning: '⚠️ ',
      success: '✅',
      info: 'ℹ️ ',
      debug: '🔍'
    }[type];

    console.log(`${prefix} ${message}`);
    
    if (type === 'error') this.issues.push(message);
    if (type === 'success') this.fixes.push(message);
  }

  async runDiagnostics() {
    console.log('🔍 Diagnosing Soulfra File System Issues...\n');

    await this.checkFileSystemState();
    await this.identifyFileRaceConditions();
    await this.checkScriptGeneration();
    await this.validateFilePermissions();
    await this.checkAsyncFileOperations();
    
    this.printSummary();
    
    if (this.issues.length > 0) {
      await this.generateFixScript();
    }
  }

  async checkFileSystemState() {
    this.log('Checking file system state...', 'info');

    try {
      // Check for common problematic files
      const problematicFiles = [
        'soulfra-quick-start.sh',
        'fix-soulfra.sh', 
        'setup-error-monitoring.sh',
        'server.js',
        'package.json'
      ];

      for (const file of problematicFiles) {
        try {
          const stats = await fs.stat(file);
          
          if (stats.size === 0) {
            this.log(`Empty file detected: ${file}`, 'error');
          } else {
            this.log(`File OK: ${file} (${stats.size} bytes)`, 'success');
          }

          // Check if file is readable
          try {
            const content = await fs.readFile(file, 'utf8');
            if (content.trim().length === 0) {
              this.log(`File exists but is empty: ${file}`, 'error');
            }
          } catch (readError) {
            this.log(`Cannot read file: ${file} - ${readError.message}`, 'error');
          }

        } catch (error) {
          if (error.code === 'ENOENT') {
            this.log(`File missing: ${file}`, 'warning');
          } else {
            this.log(`File system error for ${file}: ${error.message}`, 'error');
          }
        }
      }

    } catch (error) {
      this.log(`File system check failed: ${error.message}`, 'error');
    }
  }

  async identifyFileRaceConditions() {
    this.log('\nChecking for file race conditions...', 'info');

    // Look for common race condition patterns in existing files
    const sourceFiles = await this.findSourceFiles();
    
    for (const file of sourceFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for problematic patterns
        const patterns = [
          { pattern: /fs\.writeFile.*fs\.readFile/g, issue: 'Write then immediate read without await' },
          { pattern: /fs\.readFileSync.*fs\.writeFileSync/g, issue: 'Mixed sync/async file operations' },
          { pattern: /fs\.writeFile.*\n.*fs\.writeFile/g, issue: 'Multiple writes to same file' },
          { pattern: /fs\.readFile.*(?!await)/g, issue: 'Non-awaited file read' }
        ];

        patterns.forEach(({ pattern, issue }) => {
          const matches = content.match(pattern);
          if (matches) {
            this.log(`Race condition in ${file}: ${issue}`, 'error');
          }
        });

      } catch (error) {
        // Skip unreadable files
      }
    }
  }

  async checkScriptGeneration() {
    this.log('\nChecking script generation issues...', 'info');

    // Test script generation
    const testScriptPath = 'test-script-generation.sh';
    
    try {
      // Test synchronous script generation
      const testContent = `#!/bin/bash
echo "Test script working"
echo "Current directory: $(pwd)"
echo "User: $(whoami)"
`;

      await fs.writeFile(testScriptPath, testContent);
      
      // Verify it was written
      const writtenContent = await fs.readFile(testScriptPath, 'utf8');
      
      if (writtenContent === testContent) {
        this.log('Script generation test passed', 'success');
        
        // Test permissions
        try {
          await fs.chmod(testScriptPath, 0o755);
          this.log('Script permission setting working', 'success');
        } catch (permError) {
          this.log(`Permission setting failed: ${permError.message}`, 'error');
        }
        
      } else {
        this.log('Script content mismatch after write', 'error');
      }

      // Cleanup
      await fs.unlink(testScriptPath);

    } catch (error) {
      this.log(`Script generation test failed: ${error.message}`, 'error');
    }
  }

  async validateFilePermissions() {
    this.log('\nValidating file permissions...', 'info');

    try {
      // Check current directory permissions
      const stats = await fs.stat('.');
      this.log(`Current directory permissions: ${stats.mode.toString(8)}`, 'debug');

      // Check if we can create files
      const testFile = 'permission-test.txt';
      
      try {
        await fs.writeFile(testFile, 'test');
        await fs.unlink(testFile);
        this.log('File creation permissions OK', 'success');
      } catch (error) {
        this.log(`Cannot create files: ${error.message}`, 'error');
      }

      // Check script execution permissions
      try {
        execSync('echo "test" > permission-test.sh && chmod +x permission-test.sh && rm permission-test.sh');
        this.log('Script execution permissions OK', 'success');
      } catch (error) {
        this.log(`Script execution permission issue: ${error.message}`, 'error');
      }

    } catch (error) {
      this.log(`Permission validation failed: ${error.message}`, 'error');
    }
  }

  async checkAsyncFileOperations() {
    this.log('\nChecking async file operation patterns...', 'info');

    const sourceFiles = await this.findSourceFiles();
    
    for (const file of sourceFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        
        // Look for dangerous async patterns
        const asyncIssues = [
          {
            pattern: /fs\.writeFile\([^)]+\)\s*;\s*fs\.readFile/g,
            fix: 'Use await fs.writeFile() before reading'
          },
          {
            pattern: /fs\.readFile\([^)]+\)\s*;\s*.*\.content/g,
            fix: 'Await file read before using content'
          },
          {
            pattern: /setTimeout.*fs\.writeFile/g,
            fix: 'Avoid setTimeout with file operations'
          }
        ];

        asyncIssues.forEach(({ pattern, fix }) => {
          if (pattern.test(content)) {
            this.log(`Async issue in ${file}: ${fix}`, 'warning');
          }
        });

      } catch (error) {
        // Skip files we can't read
      }
    }
  }

  async findSourceFiles() {
    const files = [];
    
    try {
      const entries = await fs.readdir('.', { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.sh'))) {
          files.push(entry.name);
        }
        
        if (entry.isDirectory() && entry.name === 'src') {
          const srcFiles = await this.findFilesRecursive('src', ['.js']);
          files.push(...srcFiles);
        }
      }
    } catch (error) {
      this.log(`Error finding source files: ${error.message}`, 'warning');
    }

    return files;
  }

  async findFilesRecursive(dir, extensions) {
    const files = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.findFilesRecursive(fullPath, extensions);
          files.push(...subFiles);
        } else if (extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }

    return files;
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('🎯 FILE SYSTEM DIAGNOSTIC SUMMARY');
    console.log('='.repeat(50));
    
    console.log(`✅ Fixes Applied: ${this.fixes.length}`);
    console.log(`❌ Issues Found: ${this.issues.length}`);

    if (this.issues.length > 0) {
      console.log('\n🔧 ISSUES TO FIX:');
      this.issues.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue}`);
      });
    }

    if (this.issues.length === 0) {
      console.log('\n🎉 No critical file system issues found!');
    }
  }

  async generateFixScript() {
    console.log('\n🔧 Generating file system fix script...');
    
    const fixScript = await this.createRobustFixScript();
    
    // Use synchronous write to avoid async issues
    fsSync.writeFileSync('fix-filesystem-issues.sh', fixScript);
    fsSync.chmodSync('fix-filesystem-issues.sh', 0o755);
    
    console.log('✅ Fix script created: ./fix-filesystem-issues.sh');
    console.log('Run: ./fix-filesystem-issues.sh');
  }

  async createRobustFixScript() {
    return `#!/bin/bash
# Auto-generated Soulfra file system fix script
set -e

echo "🔧 Fixing Soulfra File System Issues..."

# Fix 1: Create directories with proper permissions
echo "📁 Creating directories..."
mkdir -p src/{monitoring,analysis,trust,routing,mobile}
mkdir -p {public,uploads,temp,logs,config,scripts,tests}
chmod 755 src src/* public uploads temp logs config scripts tests 2>/dev/null || true

# Fix 2: Fix empty script files
echo "📝 Fixing empty script files..."
if [ -f "soulfra-quick-start.sh" ] && [ ! -s "soulfra-quick-start.sh" ]; then
    cat > soulfra-quick-start.sh << 'SCRIPT_EOF'
#!/bin/bash
echo "🚀 Soulfra Quick Start"
echo "Current directory: \$(pwd)"
echo "Files: \$(ls -la)"
echo "Node version: \$(node --version)"
echo "NPM version: \$(npm --version)"

# Basic health check
if [ -f "package.json" ]; then
    echo "✅ package.json found"
else
    echo "❌ package.json missing"
fi

if [ -f "server.js" ]; then
    echo "✅ server.js found"
else
    echo "❌ server.js missing"
fi

echo "Run 'npm install && npm start' to continue"
SCRIPT_EOF
    chmod +x soulfra-quick-start.sh
    echo "✅ Fixed soulfra-quick-start.sh"
fi

# Fix 3: Create robust package.json
echo "📦 Ensuring package.json exists..."
if [ ! -f "package.json" ] || [ ! -s "package.json" ]; then
    cat > package.json << 'JSON_EOF'
{
  "name": "soulfra-platform",
  "version": "1.0.0",
  "description": "Soulfra AI Platform",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js || node server.js",
    "test": "echo 'Testing...' && node --version",
    "health": "curl -s http://localhost:3001/health || echo 'Server not running'"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
JSON_EOF
    echo "✅ Created package.json"
fi

# Fix 4: Create minimal working server
echo "🖥️  Creating minimal server..."
if [ ! -f "server.js" ] || [ ! -s "server.js" ]; then
    cat > server.js << 'SERVER_EOF'
const express = require('express');
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'Soulfra Platform Running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(port, () => {
  console.log(\`🚀 Soulfra running on http://localhost:\${port}\`);
  console.log(\`✅ Health check: http://localhost:\${port}/health\`);
});
SERVER_EOF
    echo "✅ Created server.js"
fi

# Fix 5: Install dependencies safely
echo "📦 Installing dependencies..."
if command -v npm >/dev/null 2>&1; then
    npm install || echo "⚠️  npm install had issues, continuing..."
else
    echo "❌ npm not found, please install Node.js"
fi

# Fix 6: Test file operations
echo "🧪 Testing file operations..."
echo "test" > test-file.txt
if [ -s "test-file.txt" ]; then
    echo "✅ File write/read working"
    rm test-file.txt
else
    echo "❌ File operations not working properly"
fi

# Fix 7: Set all script permissions
echo "🔐 Setting script permissions..."
find . -name "*.sh" -type f -exec chmod +x {} \\; 2>/dev/null || true

echo ""
echo "🎉 File system fixes applied!"
echo ""
echo "🚀 Quick test commands:"
echo "  npm start                    # Start the server"
echo "  curl http://localhost:3001   # Test the server"
echo "  ./soulfra-quick-start.sh     # Run quick start"
echo ""
`;
  }
}

// ==========================================
// SPECIFIC FILE OPERATION FIXER
// ==========================================

class FileOperationFixer {
  static async fixFileReadWriteRaceConditions() {
    console.log('🔧 Fixing file read/write race conditions...');

    // Replace problematic file operations with robust versions
    const robustFileOps = `
// Robust file operations to prevent race conditions
const robustFs = {
  async safeWriteFile(filePath, content) {
    const tempPath = filePath + '.tmp';
    try {
      await fs.writeFile(tempPath, content);
      await fs.rename(tempPath, filePath);
      return true;
    } catch (error) {
      try {
        await fs.unlink(tempPath);
      } catch {}
      throw error;
    }
  },

  async safeReadFile(filePath) {
    let retries = 3;
    while (retries > 0) {
      try {
        return await fs.readFile(filePath, 'utf8');
      } catch (error) {
        if (error.code === 'ENOENT' || retries === 1) {
          throw error;
        }
        retries--;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  },

  async ensureFileExists(filePath, defaultContent = '') {
    try {
      await fs.access(filePath);
      const content = await this.safeReadFile(filePath);
      if (content.trim().length === 0 && defaultContent) {
        await this.safeWriteFile(filePath, defaultContent);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this.safeWriteFile(filePath, defaultContent);
      } else {
        throw error;
      }
    }
  }
};

module.exports = { robustFs };
`;

    try {
      await fs.writeFile('src/utils/robust-file-ops.js', robustFileOps);
      console.log('✅ Created robust file operations module');
    } catch (error) {
      console.log('⚠️  Could not create robust file ops:', error.message);
    }
  }

  static async createMinimalWorkingPlatform() {
    console.log('🏗️  Creating minimal working platform...');

    // Create the absolute minimal setup that works
    const minimalServer = `
const express = require('express');
const app = express();
const port = 3001;

// Middleware
app.use(express.json());

// Simple routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Soulfra Platform - Minimal Mode',
    status: 'running',
    time: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Start server
const server = app.listen(port, () => {
  console.log('🚀 Minimal Soulfra running on http://localhost:3001');
  console.log('✅ Test: curl http://localhost:3001/health');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('🛑 Server stopped');
    process.exit(0);
  });
});
`;

    try {
      // Use synchronous operations to avoid race conditions
      fsSync.writeFileSync('minimal-server.js', minimalServer);
      console.log('✅ Created minimal-server.js');
      
      console.log('\n🚀 Test the minimal server:');
      console.log('  node minimal-server.js');
      console.log('  curl http://localhost:3001/health');
      
    } catch (error) {
      console.log('❌ Failed to create minimal server:', error.message);
    }
  }
}

// ==========================================
// MAIN EXECUTION
// ==========================================

async function main() {
  const fixer = new SoulframFileSystemFixer();
  
  if (process.argv.includes('--fix-race-conditions')) {
    await FileOperationFixer.fixFileReadWriteRaceConditions();
    return;
  }
  
  if (process.argv.includes('--minimal-platform')) {
    await FileOperationFixer.createMinimalWorkingPlatform();
    return;
  }
  
  if (process.argv.includes('--quick-fix')) {
    console.log('🔧 Running quick fixes...');
    
    // Quick fix for empty scripts
    const quickFixScript = `#!/bin/bash
echo "🚀 Soulfra Quick Fix"
echo "Creating basic structure..."
mkdir -p src public temp
echo '{"name":"soulfra-platform","version":"1.0.0"}' > package.json
echo 'console.log("Soulfra working");' > test.js
node test.js
rm test.js
echo "✅ Basic setup complete"
`;
    
    fsSync.writeFileSync('quick-fix.sh', quickFixScript);
    fsSync.chmodSync('quick-fix.sh', 0o755);
    
    console.log('✅ Created quick-fix.sh - run: ./quick-fix.sh');
    return;
  }
  
  // Run full diagnostics
  await fixer.runDiagnostics();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { SoulframFileSystemFixer, FileOperationFixer };
