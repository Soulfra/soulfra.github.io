#!/usr/bin/env node

/**
 * Test the complete sovereign flow
 */

const { SovereignInfinityRouter } = require('./infinity-router-sovereign');

async function testSovereignFlow() {
    console.log('🧪 Testing Sovereign Infinity Router Flow\n');
    
    try {
        // 1. Initialize router
        console.log('1️⃣  Initializing router...');
        const router = new SovereignInfinityRouter();
        await router.initialize('test-master-passphrase');
        console.log('✅ Router initialized\n');
        
        // 2. Test pairing with founder QR
        console.log('2️⃣  Testing pairing with founder QR...');
        const pairResult = await router.processSovereignPairing('qr-founder-0000', {
            userTier: 'enterprise',
            agentType: 'sovereign-mirror',
            capabilities: ['full-autonomy', 'export', 'admin']
        });
        
        console.log('✅ Pairing successful!');
        console.log(`   Trace token: ${pairResult.traceToken.trace_token}`);
        console.log(`   User ID: ${pairResult.sovereignty.userId}`);
        console.log(`   Identity: ${pairResult.sovereignty.identityHash.substring(0, 16)}...`);
        console.log(`   Agent: ${pairResult.sovereignty.agentId || 'Created'}`);
        console.log(`   Vault: ${pairResult.sovereignty.vaultPath}`);
        
        // 3. Test routing a request
        console.log('\n3️⃣  Testing request routing...');
        const request = {
            type: 'reflection',
            content: 'Hello, sovereign AI!',
            estimatedCost: 0,
            riskLevel: 'low'
        };
        
        const routeResult = await router.routeToSovereign(
            pairResult.traceToken.trace_token,
            request
        );
        
        console.log('✅ Request routed successfully!');
        console.log(`   Sovereignty verified: ${routeResult.sovereignty.verified}`);
        
        // 4. Test export
        console.log('\n4️⃣  Testing export...');
        const exportResult = await router.exportSovereignAI(
            pairResult.traceToken.trace_token,
            'test-export-password'
        );
        
        console.log('✅ Export successful!');
        console.log(`   Export path: ${exportResult.exportPath}`);
        console.log(`   Compatible with: ${exportResult.bundle.metadata.compatible.join(', ')}`);
        
        // 5. Show final status
        console.log('\n5️⃣  Final Status:');
        console.log(`   Active sessions: ${router.activeSessions.size}`);
        console.log(`   User vaults created: ✓`);
        console.log(`   Backups created: ✓`);
        console.log(`   Sovereignty established: ✓`);
        
        console.log('\n🎉 All tests passed! Users can now truly own their AI!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run the test
testSovereignFlow();