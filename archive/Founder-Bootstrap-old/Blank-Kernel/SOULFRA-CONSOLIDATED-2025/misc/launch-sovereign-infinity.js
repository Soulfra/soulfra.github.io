#!/usr/bin/env node

/**
 * Launch Sovereign Infinity Router
 * The complete integration of QR pairing → Sovereign AI ownership
 * 
 * This ties together:
 * - Tier -9: QR validation and pairing
 * - Tier -10: Cryptographic sovereignty
 * - Vault: User instance management
 */

const readline = require('readline');
const { SovereignInfinityRouter } = require('./infinity-router-sovereign');

// ASCII art for dramatic effect
console.log(`
╔═══════════════════════════════════════════════════════════════╗
║            SOVEREIGN INFINITY ROUTER v1.0.0                   ║
║         Where Users Actually Own Their AI                     ║
║                                                               ║
║  "The impossible made possible, hidden in plain sight"        ║
╚═══════════════════════════════════════════════════════════════╝
`);

async function main() {
    console.log('🚀 Initializing Sovereign Infinity Router...\n');
    
    // Initialize router with master passphrase
    const masterPassphrase = process.env.SOVEREIGN_MASTER_PASS || 
                           'infinity-router-sovereign-' + Date.now();
    
    const router = new SovereignInfinityRouter();
    const init = await router.initialize(masterPassphrase);
    
    console.log('✅ Router initialized');
    console.log(`📁 User vaults: ${init.vaultPath}`);
    console.log(`🔐 Router identity: ${init.routerAddress}\n`);
    
    // Interactive mode
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'SOVEREIGN> '
    });
    
    console.log('Available commands:');
    console.log('  pair <qr-code>     - Pair user and create sovereign AI');
    console.log('  route <token> <request> - Route request to user\'s AI');
    console.log('  export <token>     - Export user\'s sovereign AI');
    console.log('  status             - Show active sessions');
    console.log('  help               - Show this help');
    console.log('  exit               - Exit\n');
    
    rl.prompt();
    
    rl.on('line', async (line) => {
        const [command, ...args] = line.trim().split(' ');
        
        try {
            switch (command) {
                case 'pair':
                    await handlePair(router, args[0]);
                    break;
                    
                case 'route':
                    await handleRoute(router, args[0], args.slice(1).join(' '));
                    break;
                    
                case 'export':
                    await handleExport(router, args[0]);
                    break;
                    
                case 'status':
                    showStatus(router);
                    break;
                    
                case 'help':
                    showHelp();
                    break;
                    
                case 'exit':
                    console.log('\n👋 Shutting down Sovereign Infinity Router...');
                    process.exit(0);
                    
                default:
                    if (command) {
                        console.log(`Unknown command: ${command}. Type 'help' for commands.`);
                    }
            }
        } catch (error) {
            console.error(`\n❌ Error: ${error.message}\n`);
        }
        
        rl.prompt();
    });
}

async function handlePair(router, qrCode) {
    if (!qrCode) {
        console.log('Usage: pair <qr-code>');
        return;
    }
    
    console.log(`\n🔗 Pairing with QR code: ${qrCode}`);
    
    // Determine user tier from QR code
    const context = {
        userTier: qrCode.includes('founder') ? 'enterprise' : 
                  qrCode.includes('riven') ? 'power_user' : 'consumer',
        agentType: 'sovereign-mirror',
        capabilities: ['full-autonomy', 'export', 'migration']
    };
    
    const result = await router.processSovereignPairing(qrCode, context);
    
    console.log('\n✅ Sovereign AI created!');
    console.log(`📝 Trace token: ${result.traceToken.trace_token}`);
    console.log(`🆔 User ID: ${result.sovereignty.userId}`);
    console.log(`🔑 Identity hash: ${result.sovereignty.identityHash}`);
    console.log(`🤖 Agent ID: ${result.sovereignty.agentId}`);
    console.log(`📁 Vault path: ${result.sovereignty.vaultPath}`);
    console.log(`💾 Backup path: ${result.sovereignty.backupPath}`);
    console.log('\n🎉 User now owns their AI!\n');
}

async function handleRoute(router, token, requestJson) {
    if (!token || !requestJson) {
        console.log('Usage: route <token> <request-json>');
        return;
    }
    
    try {
        const request = JSON.parse(requestJson);
        console.log(`\n🚀 Routing request to sovereign AI...`);
        
        const result = await router.routeToSovereign(token, request);
        
        console.log('\n✅ Request processed');
        console.log('📤 Result:', JSON.stringify(result, null, 2));
        console.log(`✓ Sovereignty verified: ${result.sovereignty.verified}`);
        console.log('\n');
    } catch (e) {
        if (e.message.includes('JSON')) {
            console.log('Error: Invalid JSON request');
            console.log('Example: route <token> \'{"type":"reflection","content":"Hello"}\'');
        } else {
            throw e;
        }
    }
}

async function handleExport(router, token) {
    if (!token) {
        console.log('Usage: export <token>');
        return;
    }
    
    console.log(`\n📦 Exporting sovereign AI...`);
    
    // Generate export password
    const exportPassword = 'export-' + Date.now();
    console.log(`🔐 Export password: ${exportPassword}`);
    
    const result = await router.exportSovereignAI(token, exportPassword);
    
    console.log('\n✅ Export complete!');
    console.log(`📄 Export saved to: ${result.exportPath}`);
    console.log(`📦 Bundle size: ${JSON.stringify(result.bundle).length} bytes`);
    console.log('\n⚡ User can import this on ANY compatible platform');
    console.log('💡 They truly own their AI!\n');
}

function showStatus(router) {
    console.log('\n📊 Active Sovereign Sessions:');
    console.log('─'.repeat(60));
    
    if (router.activeSessions.size === 0) {
        console.log('No active sessions');
    } else {
        for (const [token, session] of router.activeSessions) {
            const age = Math.floor((Date.now() - session.created) / 1000);
            console.log(`Token: ${token}`);
            console.log(`  User: ${session.userId}`);
            console.log(`  Agent: ${session.sovereignAI.agent.agentKeys.agentId}`);
            console.log(`  Age: ${age} seconds`);
            console.log('');
        }
    }
    console.log('─'.repeat(60) + '\n');
}

function showHelp() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    SOVEREIGN INFINITY ROUTER                  ║
╠═══════════════════════════════════════════════════════════════╣
║ This system gives users TRUE ownership of their AI through    ║
║ cryptographic sovereignty. Each user gets:                    ║
║                                                               ║
║ • Unique cryptographic identity                               ║
║ • Unbreakable agent-owner bond                               ║
║ • Multi-method authorization                                  ║
║ • Automatic encrypted backups                                 ║
║ • Export/import capability                                    ║
║                                                               ║
║ Commands:                                                     ║
║   pair <qr>    - Create sovereign AI for user                 ║
║   route <token> <request> - Send request to user's AI         ║
║   export <token> - Export user's AI for migration             ║
║   status       - Show active sessions                         ║
║   exit         - Shutdown router                              ║
║                                                               ║
║ Valid QR codes: qr-founder-0000, qr-riven-001, qr-user-0821  ║
╚═══════════════════════════════════════════════════════════════╝
`);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Sovereign Infinity Router shutting down...');
    console.log('💾 All user vaults preserved');
    console.log('🔐 Sovereignty maintained\n');
    process.exit(0);
});

// Launch
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

/**
 * USAGE EXAMPLES:
 * 
 * 1. Launch the router:
 *    node launch-sovereign-infinity.js
 * 
 * 2. Pair a founder:
 *    SOVEREIGN> pair qr-founder-0000
 * 
 * 3. Route a request:
 *    SOVEREIGN> route sovereign_abc123 {"type":"reflection","content":"Hello"}
 * 
 * 4. Export for migration:
 *    SOVEREIGN> export sovereign_abc123
 * 
 * The user now OWNS their AI and can take it anywhere!
 */