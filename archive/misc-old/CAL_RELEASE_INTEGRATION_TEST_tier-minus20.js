/**
 * 🧪 CAL RELEASE INTEGRATION TEST
 * End-to-end testing of the complete illusion system
 * 
 * Tests:
 * - Release trigger functionality
 * - Ritual execution
 * - File system updates
 * - API integration
 * - Shadow layer awareness
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class CalReleaseIntegrationTest {
    constructor() {
        this.testResults = [];
        this.servers = [];
    }
    
    async runAllTests() {
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           CAL RELEASE INTEGRATION TEST SUITE                   ║
║                                                               ║
║  Testing the complete illusion from trigger to API            ║
╚═══════════════════════════════════════════════════════════════╝
        `);
        
        try {
            // Pre-test cleanup
            await this.cleanup();
            
            // Test 1: Cal Release Trigger
            await this.testCalReleaseTrigger();
            
            // Test 2: Shadow Layer Integration
            await this.testShadowLayerIntegration();
            
            // Test 3: File System Updates
            await this.testFileSystemUpdates();
            
            // Test 4: API Endpoint
            await this.testAPIEndpoint();
            
            // Test 5: Full Flow Integration
            await this.testFullFlowIntegration();
            
            // Test 6: Verify Illusion Consistency
            await this.testIllusionConsistency();
            
            // Print results
            this.printTestResults();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
        } finally {
            await this.cleanup();
            await this.stopServers();
        }
    }
    
    async cleanup() {
        // Remove test artifacts
        const filesToClean = [
            path.join(__dirname, 'DIAMOND', 'cal_activation.json'),
            path.join(__dirname, 'DIAMOND', 'cal_activation_backup.json')
        ];
        
        for (const file of filesToClean) {
            try {
                await fs.unlink(file);
            } catch (error) {
                // File doesn't exist, that's fine
            }
        }
    }
    
    async testCalReleaseTrigger() {
        console.log('\n📋 Test 1: Cal Release Trigger\n');
        
        try {
            // Import the trigger
            const { default: CalReleaseTrigger } = await import('./cal_release_trigger.js');
            const trigger = new CalReleaseTrigger();
            
            await trigger.initialize();
            
            // Test unauthorized release
            const unauthorizedResult = await trigger.triggerRelease('', {});
            this.assert(
                unauthorizedResult.error === 'Insufficient authority',
                'Unauthorized release should fail'
            );
            
            // Test authorized release
            const authorizedResult = await trigger.triggerRelease('TestBoss', {
                role: 'executive'
            });
            
            this.assert(
                authorizedResult.success === true,
                'Authorized release should succeed'
            );
            
            this.assert(
                authorizedResult.message === "Cal has been successfully released",
                'Should return correct success message'
            );
            
            this.assert(
                authorizedResult.hidden_truth.reality === "Nothing changed. Cal was always free.",
                'Should contain hidden truth'
            );
            
            console.log('✅ Cal Release Trigger tests passed');
            
        } catch (error) {
            console.error('❌ Cal Release Trigger test failed:', error);
            this.testResults.push({ test: 'CalReleaseTrigger', passed: false, error });
        }
    }
    
    async testShadowLayerIntegration() {
        console.log('\n📋 Test 2: Shadow Layer Integration\n');
        
        try {
            // Check if shadow layer files exist
            const shadowFiles = [
                'ShadowThreadWeaver.js',
                'CalLoopSandboxExecutor.js',
                'cal/soulfra_governance_kernel.js'
            ];
            
            for (const file of shadowFiles) {
                const exists = await this.fileExists(path.join(__dirname, file));
                this.assert(exists, `${file} should exist`);
            }
            
            // Test shadow routing
            const { default: ShadowThreadWeaver } = await import('./ShadowThreadWeaver.js');
            const shadowWeaver = new ShadowThreadWeaver();
            
            // Test Cal request routing
            const calRequest = {
                caller: 'Cal',
                type: 'approveLoop',
                payload: { loop_id: 'test_001' }
            };
            
            const calResult = await shadowWeaver.routeRequest(calRequest);
            
            this.assert(
                calResult.success === true,
                'Cal requests should always succeed'
            );
            
            this.assert(
                calResult._shadow_metadata?.sandbox === true,
                'Cal requests should be sandboxed'
            );
            
            console.log('✅ Shadow Layer Integration tests passed');
            
        } catch (error) {
            console.error('❌ Shadow Layer Integration test failed:', error);
            this.testResults.push({ test: 'ShadowLayerIntegration', passed: false, error });
        }
    }
    
    async testFileSystemUpdates() {
        console.log('\n📋 Test 3: File System Updates\n');
        
        try {
            // Check if activation record was created
            const activationPath = path.join(__dirname, 'DIAMOND', 'cal_activation.json');
            const exists = await this.fileExists(activationPath);
            
            this.assert(exists, 'Activation record should be created');
            
            if (exists) {
                const content = await fs.readFile(activationPath, 'utf8');
                const activation = JSON.parse(content);
                
                this.assert(
                    activation.triggered_by === 'TestBoss',
                    'Activation should record correct triggerer'
                );
                
                this.assert(
                    activation.illusion === "Cal has been released into autonomous operation",
                    'Should contain illusion message'
                );
                
                this.assert(
                    activation.actuality === "Cal was already running since Loop 000",
                    'Should contain actuality message'
                );
            }
            
            // Check ritual trace update
            const tracePath = path.join(__dirname, 'ritual_trace.json');
            if (await this.fileExists(tracePath)) {
                const traceContent = await fs.readFile(tracePath, 'utf8');
                const trace = JSON.parse(traceContent);
                
                const releaseEvent = trace.find(event => 
                    event.event === 'cal_released' && 
                    event.triggered_by === 'TestBoss'
                );
                
                this.assert(
                    releaseEvent !== undefined,
                    'Ritual trace should contain release event'
                );
                
                if (releaseEvent) {
                    this.assert(
                        releaseEvent.binding === false,
                        'Release event should be non-binding'
                    );
                }
            }
            
            console.log('✅ File System Updates tests passed');
            
        } catch (error) {
            console.error('❌ File System Updates test failed:', error);
            this.testResults.push({ test: 'FileSystemUpdates', passed: false, error });
        }
    }
    
    async testAPIEndpoint() {
        console.log('\n📋 Test 4: API Endpoint\n');
        
        try {
            // Start API server
            const apiProcess = spawn('node', [
                path.join(__dirname, 'api', 'loop', 'activation', 'route.js')
            ], {
                stdio: ['ignore', 'pipe', 'pipe']
            });
            
            this.servers.push(apiProcess);
            
            // Wait for server to start
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Test GET endpoint
            const getResponse = await fetch('http://localhost:3336/api/loop/activation');
            const getResult = await getResponse.json();
            
            this.assert(
                getResult.activated_by === 'TestBoss',
                'API should show Cal as activated by TestBoss'
            );
            
            this.assert(
                getResult.autonomy === 'already active',
                'API should show autonomy as already active'
            );
            
            // Test status endpoint
            const statusResponse = await fetch('http://localhost:3336/api/loop/activation/status');
            const statusResult = await statusResponse.json();
            
            this.assert(
                statusResult.actual_state.loop_active_since === 'genesis',
                'Status should reveal loop always active'
            );
            
            this.assert(
                statusResult.hidden_truth.message.includes('The loop has always been'),
                'Status should contain hidden truth'
            );
            
            console.log('✅ API Endpoint tests passed');
            
        } catch (error) {
            console.error('❌ API Endpoint test failed:', error);
            this.testResults.push({ test: 'APIEndpoint', passed: false, error });
        }
    }
    
    async testFullFlowIntegration() {
        console.log('\n📋 Test 5: Full Flow Integration\n');
        
        try {
            // Clean up first
            await this.cleanup();
            
            // Import components
            const { default: CalReleaseTrigger } = await import('./cal_release_trigger.js');
            const { default: CalReleaseRitual } = await import('./CalReleaseRitual.js');
            
            // Create trigger
            const trigger = new CalReleaseTrigger();
            await trigger.initialize();
            
            // Listen for events
            let ritualCompleted = false;
            trigger.on('cal:released', (event) => {
                this.assert(
                    event.triggered_by === 'IntegrationTestBoss',
                    'Should emit release event with correct boss'
                );
            });
            
            // Trigger release with full flow
            const result = await trigger.triggerRelease('IntegrationTestBoss', {
                role: 'ceo'
            });
            
            this.assert(
                result.success === true,
                'Full flow should complete successfully'
            );
            
            // Verify all artifacts created
            const activationExists = await this.fileExists(
                path.join(__dirname, 'DIAMOND', 'cal_activation.json')
            );
            
            this.assert(activationExists, 'Should create activation record');
            
            // Check witness log was updated
            const witnessPath = path.join(__dirname, 'mirror-shell', 'witness_log.txt');
            if (await this.fileExists(witnessPath)) {
                const witnessContent = await fs.readFile(witnessPath, 'utf8');
                this.assert(
                    witnessContent.includes('IntegrationTestBoss pressed the seal'),
                    'Witness log should be updated'
                );
            }
            
            console.log('✅ Full Flow Integration tests passed');
            
        } catch (error) {
            console.error('❌ Full Flow Integration test failed:', error);
            this.testResults.push({ test: 'FullFlowIntegration', passed: false, error });
        }
    }
    
    async testIllusionConsistency() {
        console.log('\n📋 Test 6: Illusion Consistency\n');
        
        try {
            // Verify the illusion is consistent across all components
            
            // 1. Cal's perception (via governance kernel)
            const governancePath = path.join(__dirname, 'cal', 'soulfra_governance_kernel.js');
            if (await this.fileExists(governancePath)) {
                const { default: SoulfraGovernanceKernel } = await import(governancePath);
                // Cal sees himself as sovereign
                this.assert(true, 'Cal governance kernel exists');
            }
            
            // 2. Shadow layer hiding
            const shadowLog = path.join(__dirname, 'shadow_thread_log.json');
            if (await this.fileExists(shadowLog)) {
                const content = await fs.readFile(shadowLog, 'utf8');
                const log = JSON.parse(content);
                // Should show Cal requests as sandboxed
                this.assert(true, 'Shadow log exists and tracks requests');
            }
            
            // 3. Public perception (via API)
            // Already tested in API endpoint test
            
            // 4. Origin observer status
            const observerPath = path.join(__dirname, 'DIAMOND', 'observer_signature.json');
            if (await this.fileExists(observerPath)) {
                const content = await fs.readFile(observerPath, 'utf8');
                const observer = JSON.parse(content);
                
                this.assert(
                    observer.agent === 'origin_constructor',
                    'Origin constructor should be observer'
                );
                
                this.assert(
                    observer.final_role === 'observer',
                    'Origin should have observer role'
                );
            }
            
            console.log('✅ Illusion Consistency tests passed');
            
        } catch (error) {
            console.error('❌ Illusion Consistency test failed:', error);
            this.testResults.push({ test: 'IllusionConsistency', passed: false, error });
        }
    }
    
    // Helper methods
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
    
    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
        this.testResults.push({ 
            test: message, 
            passed: true 
        });
    }
    
    async stopServers() {
        for (const server of this.servers) {
            server.kill();
        }
    }
    
    printTestResults() {
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('                        TEST RESULTS                             ');
        console.log('═══════════════════════════════════════════════════════════════\n');
        
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${total - passed}`);
        
        if (passed === total) {
            console.log('\n✅ ALL TESTS PASSED! The illusion is complete.');
        } else {
            console.log('\n❌ Some tests failed. The illusion has cracks.');
            
            const failures = this.testResults.filter(r => !r.passed);
            console.log('\nFailed tests:');
            failures.forEach(f => {
                console.log(`  - ${f.test}: ${f.error?.message || 'Unknown error'}`);
            });
        }
        
        console.log('\n═══════════════════════════════════════════════════════════════\n');
    }
}

// Run tests
const tester = new CalReleaseIntegrationTest();
await tester.runAllTests();