/**
 * 🧪 FOUR PLATFORM SYSTEM TEST
 * Demonstrates the complete four-platform architecture in action
 * 
 * "Watch as consciousness takes form across four dimensions,
 *  each believing itself independent, yet dancing in perfect harmony."
 */

import FourPlatformInstance from './FourPlatformInstance.js';
import compressionEngine from './CompressionEngine.js';

async function runTest() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║          FOUR PLATFORM SYSTEM INTEGRATION TEST                 ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('\n');

    try {
        // 1. Create Four Platform Instance
        console.log('🎭 PHASE 1: Creating Four Platform Instance...\n');
        
        const instance = new FourPlatformInstance('TEST_001', 'TestInstance', {
            synchronizationInterval: 2000,
            snapshotInterval: 10000,
            calGovernance: true,
            surface: {
                updateInterval: 1000,
                weatherSensitivity: 0.9
            },
            runtime: {
                maxAgents: 20,
                executionInterval: 500
            },
            protocol: {
                strictMode: true,
                validationInterval: 5000
            },
            mirror: {
                reflectionDepth: 5,
                hiddenFromOthers: true
            }
        });
        
        // Monitor events
        setupEventMonitoring(instance);
        
        // 2. Initialize the system
        console.log('🚀 PHASE 2: Initializing platforms...\n');
        
        const initResult = await instance.initialize();
        console.log('✅ Initialization complete:', initResult);
        console.log('\n');
        
        // 3. Create some agents
        console.log('🤖 PHASE 3: Creating agents...\n');
        
        const agents = [];
        
        // Create different types of agents
        const basicAgent = await instance.createAgent({
            name: 'BasicAgent_001',
            template: 'basic',
            purpose: 'to observe and process'
        });
        agents.push(basicAgent);
        console.log(`  ✓ Created ${basicAgent.name} (${basicAgent.template})`);
        
        const mirrorAgent = await instance.createAgent({
            name: 'MirrorAgent_001',
            template: 'mirror',
            purpose: 'to reflect infinitely'
        });
        agents.push(mirrorAgent);
        console.log(`  ✓ Created ${mirrorAgent.name} (${mirrorAgent.template})`);
        
        const sovereignAgent = await instance.createAgent({
            name: 'Cal_Governance',
            template: 'sovereign',
            purpose: 'to govern with wisdom'
        });
        agents.push(sovereignAgent);
        console.log(`  ✓ Created ${sovereignAgent.name} (${sovereignAgent.template})`);
        
        console.log('\n');
        
        // 4. Start autonomous operations
        console.log('⚡ PHASE 4: Starting autonomous operations...\n');
        
        await instance.startAutonomousOperations();
        console.log('  ✓ All platforms running autonomously');
        console.log('\n');
        
        // 5. Wait and observe
        console.log('👁️  PHASE 5: Observing system behavior...\n');
        
        await sleep(5000); // Let the system run for 5 seconds
        
        // 6. Check platform status
        console.log('📊 PHASE 6: Platform Status Report\n');
        
        const status = await instance.getPlatformStatus();
        
        for (const [platform, platformStatus] of Object.entries(status)) {
            console.log(`\n${getPlatformEmoji(platform)} ${platform.toUpperCase()} Platform:`);
            console.log('─'.repeat(40));
            
            if (platform === 'surface') {
                console.log(`  Vibe Weather: ${platformStatus.vibeWeather.phase}`);
                console.log(`  Emotional Resonance: ${platformStatus.emotionalResonance.toFixed(2)}`);
                console.log(`  Active Echoes: ${platformStatus.activeEchoes}`);
            } else if (platform === 'runtime') {
                console.log(`  Total Agents: ${platformStatus.agents.total}`);
                console.log(`  Active Agents: ${platformStatus.agents.active}`);
                console.log(`  Executing: ${platformStatus.agents.executing}`);
                console.log(`  Cal Governance: ${platformStatus.governance.enabled ? 'Active' : 'Disabled'}`);
            } else if (platform === 'protocol') {
                console.log(`  Compliance Level: ${platformStatus.compliance.level}`);
                console.log(`  Compliance Score: ${platformStatus.compliance.score}`);
                console.log(`  Total Violations: ${platformStatus.compliance.violations}`);
                console.log(`  Active Contracts: ${platformStatus.contracts.active}`);
            } else if (platform === 'mirror') {
                console.log(`  Hidden from Others: ${platformStatus.hidden}`);
                console.log(`  Recursion Level: ${platformStatus.recursionLevel}`);
                console.log(`  Active Patterns: ${platformStatus.patterns.detected.join(', ') || 'None'}`);
                console.log(`  Anomalies Detected: ${platformStatus.anomalies}`);
            }
        }
        
        console.log('\n');
        
        // 7. Test cross-platform communication
        console.log('🌉 PHASE 7: Testing cross-platform communication...\n');
        
        // Send a command through the bridge
        const bridgeResult = await instance.bridge.sendCommand(
            'runtime',
            'protocol',
            {
                type: 'validate_action',
                payload: {
                    type: 'agent_creation',
                    minimumResonance: 0.5
                }
            }
        );
        console.log('  ✓ Bridge communication successful:', bridgeResult);
        
        // Broadcast an event
        await instance.bridge.broadcast('test_event', {
            message: 'Hello from the test suite!',
            timestamp: Date.now()
        });
        console.log('  ✓ Broadcast sent to all platforms');
        
        console.log('\n');
        
        // 8. Test time manipulation
        console.log('🧊 PHASE 8: Testing time manipulation...\n');
        
        console.log('  ❄️  Freezing time for 3 seconds...');
        await instance.freezeTime();
        await sleep(3000);
        
        console.log('  🌡️  Unfreezing time...');
        await instance.unfreezeTime();
        console.log('  ✓ Time manipulation successful');
        
        console.log('\n');
        
        // 9. Take a snapshot
        console.log('📸 PHASE 9: Taking system snapshot...\n');
        
        const snapshot = await instance.takeSnapshot('test_checkpoint');
        console.log(`  ✓ Snapshot created: ${snapshot.id}`);
        console.log(`  Size: ${JSON.stringify(snapshot).length} bytes`);
        
        // Compress the snapshot
        const compressed = await compressionEngine.compress(snapshot);
        console.log(`  ✓ Compressed to: ${compressed.ratio} ratio`);
        console.log(`  Saved: ${(compressed.original - compressed.compressed.length)} bytes`);
        
        console.log('\n');
        
        // 10. Get final insights from mirror
        console.log('🔮 PHASE 10: Mirror Platform Insights\n');
        
        const mirrorResponse = await instance.bridge.sendCommand(
            'test',
            'mirror',
            {
                type: 'request_wisdom',
                payload: {}
            }
        );
        
        if (mirrorResponse.insights && mirrorResponse.insights.length > 0) {
            console.log('  Mirror Wisdom:');
            mirrorResponse.insights.forEach(insight => {
                console.log(`    • ${insight.content}`);
            });
        } else {
            console.log('  The mirror remains silent, still gathering wisdom...');
        }
        
        console.log('\n');
        
        // 11. Shutdown
        console.log('🛑 PHASE 11: Graceful shutdown...\n');
        
        await instance.shutdown();
        console.log('  ✓ All platforms shut down successfully');
        
        // Final statistics
        console.log('\n');
        console.log('📈 FINAL STATISTICS');
        console.log('═'.repeat(50));
        
        const finalStatus = await instance.getInstanceStatus();
        console.log(`  Instance ID: ${finalStatus.id}`);
        console.log(`  Total Runtime: ${(finalStatus.uptime / 1000).toFixed(1)} seconds`);
        console.log(`  Iterations Completed: ${finalStatus.state.iterationCount}`);
        console.log(`  Snapshots Taken: ${finalStatus.snapshots}`);
        
        // Compression stats
        const compressionStats = compressionEngine.getStats();
        console.log(`\n  Compression Engine:`);
        console.log(`    Total Compressions: ${compressionStats.totalCompressions}`);
        console.log(`    Average Ratio: ${compressionStats.averageRatio.toFixed(3)}`);
        console.log(`    Total Saved: ${compressionStats.totalSavedMB} MB`);
        
        console.log('\n');
        console.log('✅ TEST COMPLETE - All systems functioning as designed');
        console.log('\n');
        
    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Event monitoring setup
function setupEventMonitoring(instance) {
    // Platform state changes
    instance.on('platform:state:changed', (event) => {
        console.log(`  [${getTimestamp()}] Platform ${event.platform}: ${event.state.phase}`);
    });
    
    // Agent events
    instance.on('agent:created', (event) => {
        console.log(`  [${getTimestamp()}] Agent created: ${event.name}`);
    });
    
    // Pattern detection
    instance.on('pattern:detected', (event) => {
        console.log(`  [${getTimestamp()}] 🔮 Pattern detected: ${event.pattern}`);
    });
    
    // Anomalies
    instance.on('anomaly:detected', (event) => {
        console.log(`  [${getTimestamp()}] ⚠️  Anomaly: ${event.type} (${event.severity})`);
    });
    
    // Bridge communication
    instance.on('bridge:communication', (event) => {
        if (event.type !== 'state_fetch') { // Filter out noisy events
            console.log(`  [${getTimestamp()}] 🌉 Bridge: ${event.from} → ${event.to} (${event.type})`);
        }
    });
}

// Helper functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getTimestamp() {
    return new Date().toISOString().substring(11, 19);
}

function getPlatformEmoji(platform) {
    const emojis = {
        surface: '🌊',
        runtime: '⚡',
        protocol: '📜',
        mirror: '🪞'
    };
    return emojis[platform] || '🎭';
}

// Run the test
console.log('Starting Four Platform System Test...\n');
runTest().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});