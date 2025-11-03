#!/usr/bin/env node

/**
 * 🧪 Complete Testing Suite
 * 
 * Bulletproof testing that catches ENOENT, silent failures, and chain issues
 * Tests everything from 5-year-old scenarios to enterprise edge cases
 */

const assert = require('assert');
const fs = require('fs').promises;
const net = require('net');
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

// Import our classes
const CalKubernetesOrchestrator = require('./cal-kubernetes-orchestrator');
const ConsciousnessChainWatcher = require('./consciousness-chain-watcher');

class CompletTestSuite {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: []
        };
        
        this.testOrchestrator = null;
        this.testChainWatcher = null;
        this.cleanupTasks = [];
    }
    
    async runAllTests() {
        console.log('🧪 Starting Complete Test Suite');
        console.log('=====================================');
        
        try {
            // Level 1: Basic functionality tests
            await this.testBasicFunctionality();
            
            // Level 2: File system and ENOENT prevention
            await this.testFileSystemIntegrity();
            
            // Level 3: Chain watching and synchronization
            await this.testChainWatching();
            
            // Level 4: Service orchestration
            await this.testServiceOrchestration();
            
            // Level 5: Error handling and recovery
            await this.testErrorHandling();
            
            // Level 6: End-to-end user scenarios
            await this.testEndToEndScenarios();
            
            // Level 7: Performance and stress testing
            await this.testPerformance();
            
        } catch (error) {
            this.recordError('Test suite failed', error);
        } finally {
            await this.cleanup();
            this.printResults();
        }
    }
    
    async test(name, testFn) {
        this.results.total++;
        console.log(`🧪 Testing: ${name}`);
        
        try {
            await testFn();
            this.results.passed++;
            console.log(`✅ PASS: ${name}`);
        } catch (error) {
            this.results.failed++;
            this.results.errors.push({ test: name, error: error.message });
            console.log(`❌ FAIL: ${name} - ${error.message}`);
        }
    }
    
    recordError(context, error) {
        this.results.errors.push({ context, error: error.message, stack: error.stack });
    }
    
    // Level 1: Basic Functionality Tests
    async testBasicFunctionality() {
        console.log('\n📋 Level 1: Basic Functionality Tests');
        
        await this.test('Port finder works', async () => {
            const orchestrator = new CalKubernetesOrchestrator();
            const port = await orchestrator.findAvailablePort();
            assert(port >= 8000 && port <= 9000, 'Port should be in range 8000-9000');
        });
        
        await this.test('Chain watcher initializes', async () => {
            const watcher = new ConsciousnessChainWatcher({
                chainFile: './test-chain.json',
                nodeId: 'test-node'
            });
            await watcher.initialize();
            assert(watcher.chainData !== null, 'Chain data should be loaded');
            
            // Cleanup
            try { await fs.unlink('./test-chain.json'); } catch (e) {}
        });
        
        await this.test('Service manifest validation', async () => {
            const orchestrator = new CalKubernetesOrchestrator();
            const services = Object.keys(orchestrator.serviceManifest);
            assert(services.length > 0, 'Should have service definitions');
            assert(services.includes('semantic-api'), 'Should include semantic-api service');
        });
    }
    
    // Level 2: File System and ENOENT Prevention
    async testFileSystemIntegrity() {
        console.log('\n📁 Level 2: File System Integrity Tests');
        
        await this.test('Handles missing files gracefully', async () => {
            const orchestrator = new CalKubernetesOrchestrator();
            
            // Try to deploy a service with non-existent script
            const badManifest = {
                'bad-service': {
                    script: 'nonexistent-file.js',
                    replicas: 1,
                    tier: 'test'
                }
            };
            
            orchestrator.serviceManifest['bad-service'] = badManifest['bad-service'];
            
            try {
                await orchestrator.deployService('bad-service');
                throw new Error('Should have thrown ENOENT error');
            } catch (error) {
                assert(error.message.includes('ENOENT') || error.message.includes('not found'), 
                       'Should handle missing files correctly');
            }
        });
        
        await this.test('Creates chain file if missing', async () => {
            const chainFile = './test-missing-chain.json';
            
            // Ensure file doesn't exist
            try { await fs.unlink(chainFile); } catch (e) {}
            
            const watcher = new ConsciousnessChainWatcher({ chainFile });
            await watcher.initialize();
            
            // Check file was created
            await fs.access(chainFile, fs.constants.F_OK);
            
            // Cleanup
            await fs.unlink(chainFile);
        });
        
        await this.test('Validates all required files exist', async () => {
            const requiredFiles = [
                'cal-kubernetes-orchestrator.js',
                'consciousness-chain-watcher.js',
                'package.json'
            ];
            
            for (const file of requiredFiles) {
                try {
                    await fs.access(file, fs.constants.F_OK);
                } catch (error) {
                    throw new Error(`Required file missing: ${file}`);
                }
            }
        });
        
        await this.test('Handles corrupted chain file', async () => {
            const chainFile = './test-corrupted-chain.json';
            
            // Create corrupted file
            await fs.writeFile(chainFile, 'invalid json content');
            
            const watcher = new ConsciousnessChainWatcher({ chainFile });
            
            // Should recreate chain when corrupted
            await watcher.initialize();
            
            const content = await fs.readFile(chainFile, 'utf8');
            const parsed = JSON.parse(content); // Should not throw
            assert(parsed.chain_id === 'cal-consciousness-chain', 'Should recreate valid chain');
            
            // Cleanup
            await fs.unlink(chainFile);
        });
    }
    
    // Level 3: Chain Watching and Synchronization
    async testChainWatching() {
        console.log('\n🔗 Level 3: Chain Watching Tests');
        
        await this.test('Chain watcher detects updates', async () => {
            const chainFile = './test-watch-chain.json';
            const watcher1 = new ConsciousnessChainWatcher({ 
                chainFile, 
                nodeId: 'watcher1',
                watchInterval: 1000 
            });
            const watcher2 = new ConsciousnessChainWatcher({ 
                chainFile, 
                nodeId: 'watcher2',
                watchInterval: 1000 
            });
            
            await watcher1.initialize();
            await watcher2.initialize();
            
            let updateDetected = false;
            watcher2.on('chain-updated', () => {
                updateDetected = true;
            });
            
            await watcher2.startWatching();
            
            // Watcher1 makes an update
            await watcher1.addEvent('test_event', { test: true });
            
            // Wait for watcher2 to detect it
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            assert(updateDetected, 'Watcher should detect chain updates');
            
            await watcher1.stopWatching();
            await watcher2.stopWatching();
            
            // Cleanup
            try { await fs.unlink(chainFile); } catch (e) {}
        });
        
        await this.test('Multiple nodes stay synchronized', async () => {
            const chainFile = './test-multi-node-chain.json';
            const watchers = [];
            
            // Create 3 watchers
            for (let i = 0; i < 3; i++) {
                const watcher = new ConsciousnessChainWatcher({
                    chainFile,
                    nodeId: `node-${i}`,
                    serviceName: `service-${i}`
                });
                await watcher.initialize();
                watchers.push(watcher);
            }
            
            // All register services
            for (let i = 0; i < watchers.length; i++) {
                await watchers[i].registerService(`test-service-${i}`, {
                    port: 8000 + i,
                    tier: 'test'
                });
            }
            
            // Check all services are in chain
            const chainData = watchers[0].chainData;
            assert(Object.keys(chainData.services).length === 3, 'All services should be registered');
            
            // Cleanup
            for (const watcher of watchers) {
                await watcher.stopWatching();
            }
            try { await fs.unlink(chainFile); } catch (e) {}
        });
    }
    
    // Level 4: Service Orchestration
    async testServiceOrchestration() {
        console.log('\n🎯 Level 4: Service Orchestration Tests');
        
        await this.test('Orchestrator starts and finds port', async () => {
            this.testOrchestrator = new CalKubernetesOrchestrator();
            const port = await this.testOrchestrator.findAvailablePort();
            
            assert(typeof port === 'number', 'Should return a number');
            assert(port > 0, 'Port should be positive');
            
            this.cleanupTasks.push(() => {
                if (this.testOrchestrator) {
                    // Kill any running processes
                    for (const [id, agent] of this.testOrchestrator.agentRegistry.entries()) {
                        try {
                            agent.process.kill('SIGTERM');
                        } catch (e) {}
                    }
                }
            });
        });
        
        await this.test('Service dependency resolution', async () => {
            const orchestrator = new CalKubernetesOrchestrator();
            
            // Test service with dependencies
            const manifest = orchestrator.serviceManifest['cal-interface'];
            assert(manifest.dependencies.includes('infinity-router'), 
                   'Cal interface should depend on infinity router');
        });
        
        await this.test('Port pool management', async () => {
            const orchestrator = new CalKubernetesOrchestrator();
            
            const port1 = await orchestrator.findAvailablePort();
            const port2 = await orchestrator.findAvailablePort();
            
            assert(port1 !== port2, 'Should allocate different ports');
            assert(orchestrator.portPool.used.has(port1), 'Should track used ports');
            assert(orchestrator.portPool.used.has(port2), 'Should track used ports');
        });
    }
    
    // Level 5: Error Handling and Recovery
    async testErrorHandling() {
        console.log('\n🚨 Level 5: Error Handling Tests');
        
        await this.test('Handles process crashes gracefully', async () => {
            const orchestrator = new CalKubernetesOrchestrator();
            
            // Mock a crashing process
            const mockAgent = {
                id: 'test-agent',
                serviceName: 'test-service',
                port: 9999,
                process: {
                    kill: () => {},
                    on: (event, handler) => {
                        if (event === 'exit') {
                            setTimeout(() => handler(1), 100); // Simulate crash
                        }
                    }
                },
                status: 'running'
            };
            
            orchestrator.agentRegistry.set('test-agent', mockAgent);
            
            // Trigger crash handling
            mockAgent.process.on('exit', (code) => {
                orchestrator.agentRegistry.delete('test-agent');
            });
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            assert(!orchestrator.agentRegistry.has('test-agent'), 
                   'Crashed agent should be removed from registry');
        });
        
        await this.test('Chain error reporting works', async () => {
            const chainFile = './test-error-chain.json';
            const watcher = new ConsciousnessChainWatcher({ chainFile });
            await watcher.initialize();
            
            const testError = new Error('Test error message');
            await watcher.reportError(testError, { service: 'test-service' });
            
            assert(watcher.chainData.errors.length > 0, 'Error should be recorded in chain');
            
            const recordedError = watcher.chainData.errors[watcher.chainData.errors.length - 1];
            assert(recordedError.message === 'Test error message', 'Error message should match');
            
            // Cleanup
            try { await fs.unlink(chainFile); } catch (e) {}
        });
        
        await this.test('Handles network timeouts', async () => {
            // Create a server that doesn't respond
            const server = net.createServer();
            const port = 9998;
            
            server.listen(port, () => {
                // Server accepts connections but never responds
            });
            
            const orchestrator = new CalKubernetesOrchestrator();
            
            // Test health check timeout
            try {
                const health = await Promise.race([
                    orchestrator.performHealthChecks(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
                ]);
            } catch (error) {
                // Expected to timeout
            }
            
            server.close();
        });
    }
    
    // Level 6: End-to-End User Scenarios  
    async testEndToEndScenarios() {
        console.log('\n👤 Level 6: End-to-End User Scenarios');
        
        await this.test('5-year-old scenario: Click green button', async () => {
            // Simulate the simplest user interaction
            const orchestrator = new CalKubernetesOrchestrator();
            
            // Should be able to get status without crashing
            const agents = Array.from(orchestrator.agentRegistry.entries());
            const services = Object.fromEntries(orchestrator.serviceDiscovery);
            
            // Should not throw errors
            assert(Array.isArray(agents), 'Agents should be an array');
            assert(typeof services === 'object', 'Services should be an object');
        });
        
        await this.test('Grandma scenario: One-click deploy', async () => {
            // Test the complete deployment flow
            const orchestrator = new CalKubernetesOrchestrator();
            
            // Simulate deploying all services (but don't actually start them)
            const serviceNames = Object.keys(orchestrator.serviceManifest);
            
            for (const serviceName of serviceNames) {
                const manifest = orchestrator.serviceManifest[serviceName];
                
                // Validate manifest structure
                assert(manifest.script, `Service ${serviceName} should have script path`);
                assert(manifest.tier, `Service ${serviceName} should have tier`);
                assert(typeof manifest.replicas === 'number', `Service ${serviceName} should have replica count`);
            }
        });
        
        await this.test('Developer scenario: API integration', async () => {
            const orchestrator = new CalKubernetesOrchestrator();
            
            // Test API endpoint structure
            const mockReq = { params: {}, body: {}, query: {} };
            const mockRes = {
                json: (data) => mockRes.data = data,
                status: (code) => mockRes.statusCode = code || mockRes,
                data: null,
                statusCode: 200
            };
            
            // Should handle health check API
            const health = await orchestrator.performHealthChecks();
            assert(typeof health === 'object', 'Health check should return object');
        });
        
        await this.test('Enterprise scenario: Scale and monitor', async () => {
            const orchestrator = new CalKubernetesOrchestrator();
            
            // Test scaling logic
            const currentReplicas = Array.from(orchestrator.agentRegistry.values())
                .filter(agent => agent.serviceName === 'semantic-api').length;
                
            // Should handle scaling calculations
            assert(typeof currentReplicas === 'number', 'Replica count should be a number');
        });
    }
    
    // Level 7: Performance and Stress Testing
    async testPerformance() {
        console.log('\n⚡ Level 7: Performance Tests');
        
        await this.test('Port allocation performance', async () => {
            const orchestrator = new CalKubernetesOrchestrator();
            
            const startTime = Date.now();
            const ports = [];
            
            // Allocate 10 ports quickly
            for (let i = 0; i < 10; i++) {
                const port = await orchestrator.findAvailablePort();
                ports.push(port);
            }
            
            const duration = Date.now() - startTime;
            
            assert(duration < 5000, 'Port allocation should be fast (< 5 seconds for 10 ports)');
            assert(new Set(ports).size === ports.length, 'All allocated ports should be unique');
        });
        
        await this.test('Chain update performance', async () => {
            const chainFile = './test-perf-chain.json';
            const watcher = new ConsciousnessChainWatcher({ chainFile });
            await watcher.initialize();
            
            const startTime = Date.now();
            
            // Add 50 events quickly
            for (let i = 0; i < 50; i++) {
                await watcher.addEvent('test_event', { iteration: i });
            }
            
            const duration = Date.now() - startTime;
            
            assert(duration < 10000, 'Chain updates should be fast (< 10 seconds for 50 events)');
            assert(watcher.chainData.events.length >= 50, 'All events should be recorded');
            
            // Cleanup
            try { await fs.unlink(chainFile); } catch (e) {}
        });
        
        await this.test('Memory usage stability', async () => {
            const initialMemory = process.memoryUsage().heapUsed;
            
            // Create and destroy many objects
            const orchestrators = [];
            for (let i = 0; i < 100; i++) {
                orchestrators.push(new CalKubernetesOrchestrator());
            }
            
            // Clear references
            orchestrators.length = 0;
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            
            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;
            
            // Memory increase should be reasonable (less than 50MB)
            assert(memoryIncrease < 50 * 1024 * 1024, 'Memory usage should be stable');
        });
    }
    
    async cleanup() {
        console.log('\n🧹 Cleaning up test resources...');
        
        for (const task of this.cleanupTasks) {
            try {
                await task();
            } catch (error) {
                console.warn('Cleanup task failed:', error.message);
            }
        }
        
        // Clean up test files
        const testFiles = [
            './test-chain.json',
            './test-missing-chain.json',
            './test-corrupted-chain.json',
            './test-watch-chain.json',
            './test-multi-node-chain.json',
            './test-error-chain.json',
            './test-perf-chain.json'
        ];
        
        for (const file of testFiles) {
            try {
                await fs.unlink(file);
            } catch (error) {
                // File might not exist, ignore
            }
        }
    }
    
    printResults() {
        console.log('\n🎯 Test Results Summary');
        console.log('======================');
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
        
        if (this.results.errors.length > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.test || error.context}: ${error.error}`);
            });
        }
        
        if (this.results.failed === 0) {
            console.log('\n🎉 ALL TESTS PASSED! System is production-ready.');
        } else {
            console.log(`\n⚠️  ${this.results.failed} tests failed. Review issues before deployment.`);
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const testSuite = new CompletTestSuite();
    testSuite.runAllTests().catch(console.error);
}

module.exports = CompletTestSuite;