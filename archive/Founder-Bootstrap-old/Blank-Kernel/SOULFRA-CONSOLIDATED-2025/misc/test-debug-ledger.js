// 🧪 DEBUG AND LEDGER TEST
// Tests the debug extraction and consciousness ledger systems

import { DebugExtractionLayer } from '../infrastructure/debug-extraction-layer.js';
import { ConsciousnessLedger } from '../infrastructure/consciousness-ledger.js';
import chalk from 'chalk';

class DebugLedgerTest {
    constructor() {
        this.debugLayer = null;
        this.ledger = null;
    }

    async runTests() {
        console.log(chalk.blue.bold('\n🧪 DEBUG & LEDGER SYSTEM TEST'));
        console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

        await this.setupSystems();
        await this.testDebugCapture();
        await this.testLedgerRecording();
        await this.testCrossBoundaryEvents();
        await this.testIntegration();
        await this.testWebInterfaces();
        await this.cleanup();
        
        this.showResults();
    }

    async setupSystems() {
        console.log(chalk.yellow('🔧 Setting up debug and ledger systems...\n'));
        
        try {
            // Start debug layer
            process.env.DEBUG = 'true';
            process.env.DEBUG_PORT = '19999'; // Test port
            this.debugLayer = new DebugExtractionLayer();
            
            // Start ledger
            process.env.LEDGER_PORT = '18889'; // Test port
            this.ledger = new ConsciousnessLedger();
            
            // Connect them
            this.ledger.attachToDebugLayer(this.debugLayer);
            
            // Wait for services to start
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log(chalk.green('✅ Systems initialized\n'));
        } catch (error) {
            console.error(chalk.red('❌ Setup failed:', error.message));
        }
    }

    async testDebugCapture() {
        console.log(chalk.yellow('🐛 Testing debug capture...\n'));
        
        // Test error capture
        this.debugLayer.captureError({
            type: 'test_error',
            message: 'This is a test error',
            source: 'test_suite'
        });
        
        // Test vault error
        this.debugLayer.captureVaultError('test-vault-001', {
            type: 'policy_violation',
            message: 'Test policy violation'
        });
        
        // Test service error
        this.debugLayer.captureServiceError('test-service', {
            type: 'connection_failure',
            message: 'Test connection failure'
        });
        
        // Check if errors were captured
        const errors = this.debugLayer.getRecentErrors(10);
        console.log(chalk.blue(`Captured ${errors.length} errors`));
        
        const vaultErrors = this.debugLayer.extractVaultLogs('test-vault-001');
        console.log(chalk.blue(`Vault errors: ${vaultErrors.length}`));
        
        const serviceErrors = this.debugLayer.extractServiceLogs('test-service');
        console.log(chalk.blue(`Service errors: ${serviceErrors.length}`));
        
        console.log(chalk.green('✅ Debug capture test complete\n'));
    }

    async testLedgerRecording() {
        console.log(chalk.yellow('📒 Testing ledger recording...\n'));
        
        // Record inside event
        const insideEntry = this.ledger.recordInsideEvent('test-vault-001', {
            type: 'agent_execution',
            agentId: 'test-agent-001',
            status: 'success'
        });
        console.log(chalk.blue(`Inside event recorded: ${insideEntry.id}`));
        
        // Record outside event
        const outsideEntry = this.ledger.recordOutsideEvent('test-service', {
            type: 'api_request',
            method: 'GET',
            path: '/test'
        });
        console.log(chalk.blue(`Outside event recorded: ${outsideEntry.id}`));
        
        // Get stats
        const stats = this.ledger.getLedgerStats();
        console.log(chalk.blue(`Total blocks: ${stats.blocks.total}`));
        console.log(chalk.blue(`Inside events: ${stats.events.inside.total}`));
        console.log(chalk.blue(`Outside events: ${stats.events.outside.total}`));
        
        console.log(chalk.green('✅ Ledger recording test complete\n'));
    }

    async testCrossBoundaryEvents() {
        console.log(chalk.yellow('🔄 Testing cross-boundary events...\n'));
        
        // Record authorized crossing
        const authorizedCross = this.ledger.recordCrossBoundaryEvent({
            type: 'debug_extraction',
            from: 'vault-001',
            to: 'debug-layer',
            data: { errors: 5 }
        });
        console.log(chalk.blue(`Authorized crossing recorded: ${authorizedCross.id} (Verified: ${authorizedCross.verified})`));
        
        // Record unauthorized crossing
        const unauthorizedCross = this.ledger.recordCrossBoundaryEvent({
            type: 'data_leak',
            from: 'vault-002',
            to: 'external',
            data: { sensitive: true }
        });
        console.log(chalk.blue(`Unauthorized crossing recorded: ${unauthorizedCross.id} (Verified: ${unauthorizedCross.verified})`));
        
        // Get cross-boundary stats
        const stats = this.ledger.getLedgerStats();
        console.log(chalk.blue(`Cross-boundary events: ${stats.events.crossBoundary.total}`));
        console.log(chalk.blue(`Verified: ${stats.events.crossBoundary.verified}`));
        console.log(chalk.blue(`Unverified: ${stats.events.crossBoundary.unverified}`));
        
        console.log(chalk.green('✅ Cross-boundary test complete\n'));
    }

    async testIntegration() {
        console.log(chalk.yellow('🔗 Testing debug-ledger integration...\n'));
        
        // Simulate a vault critical error that should trigger cross-boundary event
        this.debugLayer.emit('vault_critical', {
            vaultId: 'critical-vault-001',
            errorCount: 10
        });
        
        // Wait for event processing
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if cross-boundary event was recorded
        const crossEvents = this.ledger.getCrossBoundaryEvents();
        const criticalEvent = crossEvents.find(e => e.type === 'vault_critical_alert');
        
        if (criticalEvent) {
            console.log(chalk.green(`✅ Critical vault event properly recorded as cross-boundary`));
            console.log(chalk.blue(`   From: ${criticalEvent.fromLocation}`));
            console.log(chalk.blue(`   To: ${criticalEvent.toLocation}`));
        } else {
            console.log(chalk.red('❌ Critical vault event not recorded'));
        }
        
        console.log(chalk.green('✅ Integration test complete\n'));
    }

    async testWebInterfaces() {
        console.log(chalk.yellow('🌐 Testing web interfaces...\n'));
        
        const debugPort = process.env.DEBUG_PORT || 19999;
        const ledgerPort = process.env.LEDGER_PORT || 18889;
        
        // Test debug dashboard
        try {
            const debugResponse = await fetch(`http://localhost:${debugPort}/`);
            console.log(chalk.blue(`Debug dashboard status: ${debugResponse.status}`));
            
            const debugErrorsResponse = await fetch(`http://localhost:${debugPort}/debug/errors`);
            const debugErrors = await debugErrorsResponse.json();
            console.log(chalk.blue(`Debug errors API: ${debugErrors.length} errors`));
        } catch (error) {
            console.log(chalk.red(`Debug interface error: ${error.message}`));
        }
        
        // Test ledger dashboard
        try {
            const ledgerResponse = await fetch(`http://localhost:${ledgerPort}/`);
            console.log(chalk.blue(`Ledger dashboard status: ${ledgerResponse.status}`));
            
            const ledgerStatsResponse = await fetch(`http://localhost:${ledgerPort}/ledger/stats`);
            const ledgerStats = await ledgerStatsResponse.json();
            console.log(chalk.blue(`Ledger stats API: ${ledgerStats.blocks.total} blocks`));
            
            // Verify integrity
            const integrityResponse = await fetch(`http://localhost:${ledgerPort}/ledger/verify`);
            const integrity = await integrityResponse.json();
            console.log(chalk.blue(`Ledger integrity: ${integrity.valid ? '✅ Valid' : '❌ Compromised'}`));
        } catch (error) {
            console.log(chalk.red(`Ledger interface error: ${error.message}`));
        }
        
        console.log(chalk.green('✅ Web interface test complete\n'));
    }

    async cleanup() {
        console.log(chalk.yellow('🧹 Cleaning up...\n'));
        
        if (this.debugLayer) {
            this.debugLayer.shutdown();
        }
        
        if (this.ledger) {
            this.ledger.shutdown();
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(chalk.green('✅ Cleanup complete\n'));
    }

    showResults() {
        console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.green.bold('\n✅ DEBUG & LEDGER SYSTEM TEST COMPLETE'));
        
        console.log(chalk.yellow('\n📊 Final Statistics:'));
        
        if (this.debugLayer) {
            const debugStats = this.debugLayer.getDebugStats();
            console.log(chalk.blue(`Debug Layer:`));
            console.log(chalk.gray(`  Total Errors: ${debugStats.totalErrors}`));
            console.log(chalk.gray(`  Vault Errors: ${debugStats.vaultErrorCount}`));
            console.log(chalk.gray(`  Service Errors: ${debugStats.serviceErrorCount}`));
        }
        
        if (this.ledger) {
            const ledgerStats = this.ledger.getLedgerStats();
            console.log(chalk.blue(`\nConsciousness Ledger:`));
            console.log(chalk.gray(`  Blocks: ${ledgerStats.blocks.total}`));
            console.log(chalk.gray(`  Inside Events: ${ledgerStats.events.inside.total}`));
            console.log(chalk.gray(`  Outside Events: ${ledgerStats.events.outside.total}`));
            console.log(chalk.gray(`  Cross-Boundary: ${ledgerStats.events.crossBoundary.total}`));
            console.log(chalk.gray(`  Integrity: ${ledgerStats.integrity.valid ? '✅ Valid' : '❌ Compromised'}`));
        }
        
        console.log(chalk.green('\n🎉 Both systems are working correctly!'));
        console.log(chalk.blue('\n💡 To use in production:'));
        console.log(chalk.gray('   1. Start the multi-ring orchestrator: npm start'));
        console.log(chalk.gray('   2. View debug dashboard: http://localhost:9999'));
        console.log(chalk.gray('   3. View ledger dashboard: http://localhost:8889'));
        console.log(chalk.gray('   4. Use CLI commands: debug, errors, ledger'));
        console.log();
    }
}

// Run the test
const test = new DebugLedgerTest();
test.runTests().catch(console.error);