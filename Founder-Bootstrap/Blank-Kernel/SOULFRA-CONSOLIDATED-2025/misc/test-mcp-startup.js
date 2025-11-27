/**
 * Test MCP Server Startup
 * Tests if the MCP server can initialize and start correctly
 */

const http = require('http');

console.log('🧪 Testing MCP Server Startup...\n');

// Start the MCP server in a child process
const { spawn } = require('child_process');
const mcpProcess = spawn('node', ['src/mcp-server.js'], {
    stdio: ['inherit', 'pipe', 'pipe']
});

let output = '';
let errorOutput = '';

mcpProcess.stdout.on('data', (data) => {
    output += data.toString();
    process.stdout.write(data);
});

mcpProcess.stderr.on('data', (data) => {
    errorOutput += data.toString();
    process.stderr.write(data);
});

// Wait a few seconds for startup
setTimeout(() => {
    console.log('\n🔍 Checking if MCP server is responding...');
    
    // Test the health endpoint
    http.get('http://localhost:8888/health', (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const health = JSON.parse(data);
                console.log('\n✅ MCP Server is running!');
                console.log('   Status:', health.status);
                console.log('   Uptime:', health.uptime, 'seconds');
                console.log('\n📊 Services:', JSON.stringify(health.services, null, 2));
            } catch (error) {
                console.log('\n❌ Error parsing health response:', error.message);
            }
            
            // Test the MCP info endpoint
            http.get('http://localhost:8888/mcp', (res) => {
                let mcpData = '';
                
                res.on('data', (chunk) => {
                    mcpData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const mcp = JSON.parse(mcpData);
                        console.log('\n🛠️  MCP Capabilities:');
                        console.log('   Version:', mcp.version);
                        console.log('   Capabilities:', mcp.capabilities.join(', '));
                        console.log('   Tools:', mcp.tools.join(', '));
                    } catch (error) {
                        console.log('\n❌ Error parsing MCP info:', error.message);
                    }
                    
                    // Shutdown the server
                    console.log('\n🛑 Shutting down test server...');
                    mcpProcess.kill('SIGINT');
                });
                
            }).on('error', (err) => {
                console.log('\n❌ Error connecting to MCP endpoint:', err.message);
                mcpProcess.kill('SIGINT');
            });
        });
        
    }).on('error', (err) => {
        console.log('\n❌ Error connecting to health endpoint:', err.message);
        console.log('   Make sure port 8888 is not already in use.');
        mcpProcess.kill('SIGINT');
    });
    
}, 3000);

mcpProcess.on('close', (code) => {
    console.log('\nMCP Server process exited with code', code);
    
    if (errorOutput) {
        console.log('\n⚠️  Error output:', errorOutput);
    }
    
    process.exit(code);
});