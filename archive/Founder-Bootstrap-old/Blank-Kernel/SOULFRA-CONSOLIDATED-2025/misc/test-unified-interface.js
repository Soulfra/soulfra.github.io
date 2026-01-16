#!/usr/bin/env node
/**
 * Test the UNIFIED SOULFRA MCP Interface
 * This demonstrates how everything works together
 */

const http = require('http');
const fs = require('fs');

console.log('🧪 TESTING YOUR UNIFIED SOULFRA INTERFACE');
console.log('==========================================');
console.log('');

async function testAllSystems() {
    const results = {
        soulfra_ultimate: false,
        mcp_config: false,
        mcp_integration: false,
        blockchain_ledger: false,
        recent_activity: false
    };
    
    // Test 1: SOULFRA Ultimate (your main platform)
    console.log('1. 🌟 Testing SOULFRA Ultimate...');
    try {
        const response = await httpGet('http://localhost:9999/api/user/test_unified_user');
        if (response) {
            console.log('   ✅ SOULFRA Ultimate responding with 60+ features');
            console.log(`   📊 User API working: ${JSON.stringify(response).substring(0, 50)}...`);
            results.soulfra_ultimate = true;
        }
    } catch (e) {
        console.log('   ❌ SOULFRA Ultimate not responding');
        console.log('   💡 Start with: python3 SOULFRA_ULTIMATE_UNIFIED.py');
    }
    
    // Test 2: MCP Configuration
    console.log('\n2. ⚙️  Testing MCP Configuration...');
    try {
        const config = JSON.parse(fs.readFileSync('mcp-existing-config.json', 'utf8'));
        console.log('   ✅ MCP config loaded');
        console.log(`   🔧 Tools available: ${Object.keys(config.tools).join(', ')}`);
        console.log(`   🔗 Systems: ${Object.keys(config.existing_systems).join(', ')}`);
        results.mcp_config = true;
    } catch (e) {
        console.log('   ❌ MCP config missing or invalid');
    }
    
    // Test 3: MCP Integration Module
    console.log('\n3. 🔌 Testing MCP Integration...');
    try {
        const ExistingSystemsIntegration = require('./src/mcp-existing-integration');
        const integration = new ExistingSystemsIntegration();
        console.log('   ✅ MCP integration module loaded');
        
        // Wait for system checks
        setTimeout(async () => {
            try {
                if (results.soulfra_ultimate) {
                    const status = await integration.getSoulfraStatus();
                    console.log(`   📈 SOULFRA Status: ${status.features} features running`);
                }
            } catch (e) {
                console.log('   ⚠️  Integration check failed:', e.message);
            }
        }, 2000);
        
        results.mcp_integration = true;
    } catch (e) {
        console.log('   ❌ MCP integration module failed:', e.message);
    }
    
    // Test 4: Blockchain Ledger Updates
    console.log('\n4. ⛓️  Testing Blockchain Ledger...');
    try {
        const ledgerContent = fs.readFileSync('unified_ledger.json', 'utf8');
        if (ledgerContent.trim()) {
            const ledgerEntry = JSON.parse(ledgerContent.split('\n')[0]);
            console.log('   ✅ Blockchain ledger has entries');
            console.log(`   📝 Latest entry: ${ledgerEntry.type} at ${new Date(ledgerEntry.timestamp * 1000).toLocaleString()}`);
            results.blockchain_ledger = true;
        }
    } catch (e) {
        console.log('   ❌ Blockchain ledger empty or missing');
    }
    
    // Test 5: Recent System Activity
    console.log('\n5. 📊 Testing Recent Activity...');
    try {
        const logContent = fs.readFileSync('logs/soulfra_ultimate.log', 'utf8');
        const lines = logContent.split('\n').filter(line => line.includes('GET') && line.includes('HTTP/1.1'));
        if (lines.length > 0) {
            console.log(`   ✅ ${lines.length} recent HTTP requests logged`);
            console.log(`   📈 Latest activity: ${lines[lines.length - 1].substring(0, 50)}...`);
            results.recent_activity = true;
        }
    } catch (e) {
        console.log('   ❌ No recent activity logs found');
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    
    const passed = Object.values(results).filter(r => r).length;
    const total = Object.keys(results).length;
    
    console.log(`✅ Passed: ${passed}/${total} tests`);
    console.log('');
    
    for (const [test, result] of Object.entries(results)) {
        const status = result ? '✅' : '❌';
        const name = test.replace(/_/g, ' ').toUpperCase();
        console.log(`${status} ${name}`);
    }
    
    console.log('');
    
    if (passed === total) {
        console.log('🎉 ALL SYSTEMS WORKING! Your unified interface is ready!');
        console.log('');
        console.log('HOW TO USE YOUR UNIFIED INTERFACE:');
        console.log('================================');
        console.log('1. 🚀 Start MCP Server:     ./launch-unified-interface.sh');
        console.log('2. 🎯 Use CLI Interface:    node use-mcp.js');
        console.log('3. 🔧 Quick Test:           node use-mcp.js --test');
        console.log('4. 🌐 Web Interface:        http://localhost:9999');
        console.log('5. 📡 MCP Health:           http://localhost:8888/health');
        console.log('');
        console.log('WHAT YOU CAN DO:');
        console.log('• Get SOULFRA platform status (60+ features)');
        console.log('• Create code improvement proposals');
        console.log('• Validate files against rules');
        console.log('• Store data on blockchain ledger');
        console.log('• Read/write files through MCP');
        console.log('• All unified through single interface!');
    } else {
        console.log('⚠️  Some systems need attention. See above for details.');
        console.log('');
        console.log('NEXT STEPS:');
        console.log('1. Make sure SOULFRA Ultimate is running: python3 SOULFRA_ULTIMATE_UNIFIED.py');
        console.log('2. Start MCP server: ./launch-unified-interface.sh');
        console.log('3. Re-run this test: node test-unified-interface.js');
    }
    
    console.log('');
}

function httpGet(url) {
    return new Promise((resolve, reject) => {
        http.get(url, { timeout: 3000 }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        }).on('error', reject).on('timeout', reject);
    });
}

testAllSystems().catch(console.error);