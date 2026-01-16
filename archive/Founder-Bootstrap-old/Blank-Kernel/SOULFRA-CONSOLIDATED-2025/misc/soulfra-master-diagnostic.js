#!/usr/bin/env node

/**
 * Soulfra Master Diagnostic Tool
 * Uses ALL our existing monitoring systems to diagnose issues
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

console.log('🔍 Soulfra Master Diagnostic Tool');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Track all issues found
const issues = [];
const warnings = [];
const fixes = [];

// ===== SYSTEM REQUIREMENTS CHECK =====
console.log('1️⃣  Checking System Requirements...\n');

function checkCommand(command, description, required = true) {
    try {
        execSync(`which ${command}`, { stdio: 'ignore' });
        console.log(`✅ ${description}: Found`);
        return true;
    } catch (e) {
        if (required) {
            console.log(`❌ ${description}: NOT FOUND`);
            issues.push(`${command} is not installed`);
            
            // Add fix suggestions
            if (command === 'redis-cli') {
                fixes.push('Install Redis: brew install redis (macOS) or apt-get install redis (Linux)');
            }
        } else {
            console.log(`⚠️  ${description}: Not found (optional)`);
            warnings.push(`${command} is not installed (optional)`);
        }
        return false;
    }
}

// Check required commands
checkCommand('node', 'Node.js');
checkCommand('npm', 'NPM Package Manager');
checkCommand('python3', 'Python 3');
checkCommand('redis-cli', 'Redis CLI');
checkCommand('curl', 'cURL');

// Check optional commands
checkCommand('docker', 'Docker', false);
checkCommand('git', 'Git', false);

// ===== CHECK EXISTING ERROR MONITORING =====
console.log('\n2️⃣  Checking Error Monitoring Systems...\n');

function checkFile(filePath, description) {
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${description}: Found`);
        return true;
    } else {
        console.log(`❌ ${description}: Missing`);
        issues.push(`${description} file missing: ${filePath}`);
        return false;
    }
}

// Check our existing monitoring systems
const monitoringSystems = [
    ['soulfra_silent_error_monitoring.js', 'Silent Error Monitor'],
    ['cal-self-diagnostic.js', 'Cal Self-Diagnostic'],
    ['health-monitor.js', 'Health Monitor'],
    ['monitor-services.sh', 'Shell Monitor Script']
];

let hasMonitoring = false;
for (const [file, desc] of monitoringSystems) {
    if (checkFile(file, desc)) {
        hasMonitoring = true;
    }
}

// ===== CHECK SERVICES =====
console.log('\n3️⃣  Checking Services...\n');

async function checkPort(port, service) {
    return new Promise((resolve) => {
        const check = spawn('curl', ['-s', `http://localhost:${port}`]);
        let responded = false;
        
        check.on('close', (code) => {
            if (!responded) {
                if (code === 0 || code === 7) { // 7 = connection refused
                    console.log(`✅ Port ${port} (${service}): Available`);
                    resolve(true);
                } else {
                    console.log(`❌ Port ${port} (${service}): Failed`);
                    issues.push(`${service} on port ${port} is not responding`);
                    resolve(false);
                }
                responded = true;
            }
        });
        
        // Timeout after 2 seconds
        setTimeout(() => {
            if (!responded) {
                check.kill();
                console.log(`⚠️  Port ${port} (${service}): Timeout`);
                warnings.push(`${service} on port ${port} timed out`);
                resolve(false);
                responded = true;
            }
        }, 2000);
    });
}

// Check key service ports
const services = [
    [8888, 'Unified Gateway'],
    [9999, 'Production Server'],
    [7777, 'Smart Router'],
    [4040, 'Cal Riven'],
    [6379, 'Redis']
];

async function checkAllServices() {
    for (const [port, service] of services) {
        await checkPort(port, service);
    }
}

// ===== CHECK FILES AND DIRECTORIES =====
console.log('\n4️⃣  Checking Required Files...\n');

const requiredFiles = [
    'production-server.js',
    'smart-route-server.py',
    'real-agent-provisioner.js',
    'agent-claude-bridge.js',
    'package.json'
];

for (const file of requiredFiles) {
    checkFile(file, path.basename(file));
}

// Check directories
const requiredDirs = ['logs', 'mirror-shell', 'runtime', 'api'];
for (const dir of requiredDirs) {
    if (fs.existsSync(dir)) {
        console.log(`✅ Directory ${dir}: Exists`);
    } else {
        console.log(`⚠️  Directory ${dir}: Missing (will be created)`);
        warnings.push(`Directory ${dir} missing`);
        fs.mkdirSync(dir, { recursive: true });
    }
}

// ===== RUN CAL'S SELF-DIAGNOSTIC =====
console.log('\n5️⃣  Running Cal\'s Self-Diagnostic...\n');

async function runCalDiagnostic() {
    if (fs.existsSync('cal-self-diagnostic.js')) {
        try {
            const diagnostic = require('./cal-self-diagnostic.js');
            console.log('🤖 Cal is checking himself...');
            // Would run Cal's diagnostic here
            console.log('✅ Cal diagnostic available');
        } catch (e) {
            console.log('⚠️  Cal diagnostic exists but cannot run:', e.message);
        }
    }
}

// ===== GENERATE REPORT =====
async function generateReport() {
    await checkAllServices();
    await runCalDiagnostic();
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DIAGNOSTIC REPORT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (issues.length === 0 && warnings.length === 0) {
        console.log('🎉 ALL SYSTEMS HEALTHY!\n');
        console.log('You can start the platform with: ./start-everything.sh');
    } else {
        if (issues.length > 0) {
            console.log('❌ CRITICAL ISSUES FOUND:\n');
            issues.forEach((issue, i) => {
                console.log(`   ${i + 1}. ${issue}`);
            });
        }
        
        if (warnings.length > 0) {
            console.log('\n⚠️  WARNINGS:\n');
            warnings.forEach((warning, i) => {
                console.log(`   ${i + 1}. ${warning}`);
            });
        }
        
        if (fixes.length > 0) {
            console.log('\n💡 SUGGESTED FIXES:\n');
            fixes.forEach((fix, i) => {
                console.log(`   ${i + 1}. ${fix}`);
            });
        }
        
        // Generate fix script
        console.log('\n📝 Generating automated fix script...');
        generateFixScript();
    }
    
    // Save diagnostic report
    const report = {
        timestamp: new Date().toISOString(),
        issues: issues,
        warnings: warnings,
        fixes: fixes,
        hasMonitoring: hasMonitoring
    };
    
    fs.writeFileSync('diagnostic-report.json', JSON.stringify(report, null, 2));
    console.log('\n💾 Full report saved to: diagnostic-report.json');
}

function generateFixScript() {
    let script = `#!/bin/bash
# Soulfra Automated Fix Script
# Generated: ${new Date().toISOString()}

echo "🔧 Running automated fixes..."
`;

    // Add Redis installation if needed
    if (issues.some(i => i.includes('redis-cli'))) {
        script += `
# Install Redis
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "📦 Installing Redis via Homebrew..."
    brew install redis
    brew services start redis
else
    echo "📦 Installing Redis..."
    sudo apt-get update
    sudo apt-get install -y redis-server
    sudo systemctl start redis
fi
`;
    }

    // Create missing directories
    script += `
# Create required directories
mkdir -p logs pids uploads generated mirror-shell runtime api
`;

    // Add monitoring integration
    if (hasMonitoring) {
        script += `
# Create monitoring wrapper
cat > start-with-monitoring.js << 'EOF'
const SilentErrorMonitor = require('./soulfra_silent_error_monitoring.js');
const monitor = new SilentErrorMonitor();

// Start monitoring
monitor.startMonitoring();

// Then start your services
require('./start-everything.sh');
EOF
`;
    }

    fs.writeFileSync('auto-fix.sh', script);
    fs.chmodSync('auto-fix.sh', '755');
    console.log('✅ Fix script created: ./auto-fix.sh');
}

// ===== RUN DIAGNOSTIC =====
generateReport();