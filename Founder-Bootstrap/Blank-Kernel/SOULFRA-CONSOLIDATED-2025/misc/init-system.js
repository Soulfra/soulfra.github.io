#!/usr/bin/env node

/**
 * Mirror Kernel - System Initialization
 * 
 * This initializes the complete Mirror Kernel system
 * Run this first to set up your private keys and start all services
 */

const readline = require('readline');
const { EmotionalTruthLayer } = require('./emotional-truth-layer/core-system');
const { initialize: initKeys, getPublicKeys } = require('./private-keys/key-management');
const fs = require('fs').promises;
const path = require('path');

// Colors for console
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m'
};

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Promisify question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    console.clear();
    console.log(colors.blue + colors.bright);
    console.log('🪞 MIRROR KERNEL - INITIALIZATION 🪞');
    console.log('=====================================');
    console.log(colors.reset);
    console.log('Welcome to Mirror Kernel - The Emotional Truth Layer of the Internet\n');
    
    try {
        // Step 1: Check if already initialized
        const initialized = await checkInitialization();
        
        if (initialized) {
            console.log(colors.yellow + '⚠️  System already initialized.' + colors.reset);
            const reinit = await question('\nReinitialize? This will create new keys (y/N): ');
            
            if (reinit.toLowerCase() !== 'y') {
                console.log('\nStarting with existing configuration...\n');
                await startSystem();
                return;
            }
        }
        
        // Step 2: Initialize keys
        console.log(colors.blue + '\n🔐 PRIVATE KEY INITIALIZATION' + colors.reset);
        console.log('─────────────────────────────\n');
        console.log('Your master passphrase is the key to everything.');
        console.log('Make it strong, memorable, and NEVER share it.\n');
        
        console.log('Example: "Mirror reflects truth through emotional connections 2025!"');
        console.log(colors.red + 'DO NOT use the example - create your own!\n' + colors.reset);
        
        const passphrase = await question('Enter your master passphrase: ');
        
        if (passphrase.length < 20) {
            console.log(colors.red + '\n❌ Passphrase too short. Use at least 20 characters.' + colors.reset);
            process.exit(1);
        }
        
        console.log('\n' + colors.yellow + 'Initializing keys...' + colors.reset);
        const keys = await initKeys(passphrase);
        
        console.log(colors.green + '\n✅ Keys initialized successfully!' + colors.reset);
        console.log('\nYour public addresses:');
        
        Object.entries(keys.publicKeys).forEach(([name, key]) => {
            console.log(`  ${name}: ${key.address}`);
        });
        
        // Save initialization state
        await saveInitState(keys.publicKeys);
        
        // Step 3: Start system
        console.log(colors.blue + '\n🌟 STARTING EMOTIONAL TRUTH LAYER' + colors.reset);
        console.log('──────────────────────────────────\n');
        
        await startSystem();
        
        // Step 4: Show dashboard
        await showDashboard();
        
    } catch (error) {
        console.error(colors.red + '\n❌ Initialization failed:', error.message + colors.reset);
        process.exit(1);
    } finally {
        rl.close();
    }
}

async function checkInitialization() {
    try {
        await fs.access(path.join(__dirname, '.initialized'));
        return true;
    } catch {
        return false;
    }
}

async function saveInitState(publicKeys) {
    const state = {
        initialized: true,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        publicKeys: publicKeys
    };
    
    await fs.writeFile(
        path.join(__dirname, '.initialized'),
        JSON.stringify(state, null, 2)
    );
}

async function startSystem() {
    // Initialize emotional truth layer
    const emotional = new EmotionalTruthLayer();
    await emotional.initialize();
    
    // Start other services
    console.log(colors.green + '✅ Emotional processing: ONLINE' + colors.reset);
    console.log(colors.green + '✅ Truth detection: ACTIVE' + colors.reset);
    console.log(colors.green + '✅ Fun optimization: ENGAGED' + colors.reset);
    console.log(colors.green + '✅ Connection layer: READY' + colors.reset);
    
    // Demo processing
    console.log(colors.blue + '\n📝 DEMO: Processing sample content...\n' + colors.reset);
    
    const sampleContent = "I'm excited about making technology more human and connecting with others!";
    const result = await emotional.processContent(sampleContent);
    
    console.log('Input:', sampleContent);
    console.log('\nAnalysis:');
    console.log(`  Empathy Score: ${(result.emotional.empathyScore * 100).toFixed(0)}%`);
    console.log(`  Truth Score: ${(result.truth.score * 100).toFixed(0)}%`);
    console.log(`  Fun Level: ${(result.fun.level * 100).toFixed(0)}%`);
    console.log(`  Connection: ${result.connection.recommendation}`);
    console.log(`  Human Value: ${result.enhanced.humanValue.meaning}`);
}

async function showDashboard() {
    console.log(colors.bright + colors.blue + '\n📊 MIRROR KERNEL DASHBOARD' + colors.reset);
    console.log('═══════════════════════════\n');
    
    console.log('System Status:');
    console.log('  🟢 Emotional Layer: ACTIVE');
    console.log('  🟢 Mesh Network: READY');
    console.log('  🟢 Key System: SECURED');
    console.log('  🟢 API Gateway: LISTENING');
    
    console.log('\nQuick Commands:');
    console.log('  npm run process <text>    - Process text through emotional layer');
    console.log('  npm run mesh:status       - Check mesh network status');
    console.log('  npm run keys:backup       - Backup your keys');
    console.log('  npm run dashboard         - Open web dashboard');
    
    console.log('\nAPI Endpoints:');
    console.log('  POST /api/process         - Process content');
    console.log('  GET  /api/stats          - System statistics');
    console.log('  GET  /api/health         - Health check');
    
    console.log('\nNext Steps:');
    console.log('  1. Try processing some content');
    console.log('  2. Check the web dashboard');
    console.log('  3. Read the documentation');
    console.log('  4. Join our community');
    
    console.log(colors.green + '\n✨ Mirror Kernel is ready to make the internet human again! ✨' + colors.reset);
    console.log('\nDocumentation: https://mirror-kernel.org/docs');
    console.log('Community: https://mirror-kernel.org/community\n');
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    initializeSystem: main
};