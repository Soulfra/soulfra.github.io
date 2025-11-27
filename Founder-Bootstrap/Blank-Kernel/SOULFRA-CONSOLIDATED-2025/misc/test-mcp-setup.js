const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🔍 Testing MCP Server Setup...\n');

// Step 1: Create .mcp directory and config
console.log('1. Setting up .mcp directory and configuration...');
const mcpDir = path.join(__dirname, '.mcp');

try {
    // Create directory
    if (!fs.existsSync(mcpDir)) {
        fs.mkdirSync(mcpDir, { recursive: true });
        console.log('   ✓ Created .mcp directory');
    } else {
        console.log('   ✓ .mcp directory exists');
    }
    
    // Create config
    const config = {
        "name": "SOULFRA MCP Integration",
        "version": "1.0.0",
        "description": "Model Context Protocol server for unifying all SOULFRA services",
        "port": 8888,
        
        "capabilities": ["tools", "context", "memory"],
        
        "servers": {
            "soulfra-main": {
                "name": "SOULFRA Ultimate Unified",
                "url": "http://localhost:9999",
                "type": "http"
            },
            "cal-riven": {
                "name": "Cal Riven Trust Engine",
                "url": "http://localhost:4040",
                "type": "http"
            },
            "semantic-api": {
                "name": "Semantic Search API",
                "url": "http://localhost:3666",
                "type": "http"
            },
            "vector-db": {
                "name": "Vector Database",
                "url": "http://localhost:7891",
                "type": "websocket"
            },
            "rules-engine": {
                "name": "Rules Orchestrator",
                "url": "http://localhost:7788",
                "type": "http"
            },
            "mirror-bridge": {
                "name": "Mirror Bridge",
                "url": "http://localhost:8889",
                "type": "websocket"
            }
        },
        
        "tools": {
            "file": {
                "enabled": true,
                "operations": ["read", "write", "list", "search"]
            },
            "search": {
                "enabled": true,
                "types": ["semantic", "vector", "regex", "ast"]
            },
            "agent": {
                "enabled": true,
                "operations": ["spawn", "control", "query", "terminate"]
            },
            "rules": {
                "enabled": true,
                "operations": ["validate", "enforce", "report"]
            }
        },
        
        "context": {
            "codebase": {
                "enabled": true,
                "scan_on_start": true,
                "update_interval": 300
            },
            "services": {
                "enabled": true,
                "health_check_interval": 60
            },
            "rules": {
                "enabled": true,
                "path": ".rules/"
            }
        },
        
        "memory": {
            "enabled": true,
            "persist": true,
            "path": ".mcp/memory.json",
            "categories": ["conversations", "agent_states", "reflections"]
        }
    };
    
    const configPath = path.join(mcpDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('   ✓ Created config.json');
    
    // Create memory file
    const memoryPath = path.join(mcpDir, 'memory.json');
    if (!fs.existsSync(memoryPath)) {
        fs.writeFileSync(memoryPath, JSON.stringify({
            conversations: [],
            agent_states: {},
            reflections: [],
            created_at: new Date().toISOString()
        }, null, 2));
        console.log('   ✓ Created memory.json');
    }
    
} catch (error) {
    console.error('   ✗ Error setting up .mcp directory:', error.message);
    process.exit(1);
}

// Step 2: Check dependencies
console.log('\n2. Checking dependencies...');
const packageJson = require('./package.json');
const requiredDeps = ['ws', 'express', 'body-parser'];
const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);

if (missingDeps.length === 0) {
    console.log('   ✓ All required dependencies are installed');
} else {
    console.log('   ✗ Missing dependencies:', missingDeps.join(', '));
}

// Step 3: Test MCP server
console.log('\n3. Testing MCP server...');
const mcpServerPath = path.join(__dirname, 'src', 'mcp-server.js');

if (fs.existsSync(mcpServerPath)) {
    console.log('   ✓ MCP server found at src/mcp-server.js');
    
    // Try to start the server briefly
    console.log('   → Attempting to start MCP server...');
    
    const mcpProcess = spawn('node', [mcpServerPath], {
        env: { ...process.env, MCP_TEST_MODE: 'true' }
    });
    
    let serverStarted = false;
    
    mcpProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('   ', output.trim());
        if (output.includes('MCP Server running') || output.includes('listening')) {
            serverStarted = true;
        }
    });
    
    mcpProcess.stderr.on('data', (data) => {
        console.error('   Error:', data.toString().trim());
    });
    
    // Give it 3 seconds to start, then kill it
    setTimeout(() => {
        if (serverStarted) {
            console.log('\n   ✓ MCP server can start successfully!');
        } else {
            console.log('\n   ⚠ MCP server started but didn\'t confirm it\'s listening');
        }
        
        mcpProcess.kill();
        
        console.log('\n✅ MCP Setup Complete!');
        console.log('\nTo start the MCP server, run:');
        console.log('   node src/mcp-server.js');
        console.log('\nOr add to package.json scripts:');
        console.log('   "mcp": "node src/mcp-server.js"');
        
        process.exit(0);
    }, 3000);
    
} else {
    console.log('   ✗ MCP server not found at expected location');
    process.exit(1);
}