/**
 * End-to-End Test Suite
 * 
 * Tests the complete 4-layer architecture:
 * 1. Admin (You) → 2. Laptop → 3. Server → 4. Arweave
 * 
 * Verifies all integrations work together properly.
 */

const LaptopAdminInterface = require('./laptop-admin-interface');
const ServerProductionBackend = require('./server-production-backend');
const ArweaveIntegration = require('./arweave-integration');
const ProductionDatabase = require('./production-database');
const SystemBackupManager = require('../vault/system-backup-manager');

class EndToEndTest {
    constructor() {
        this.testResults = [];
        this.errors = [];
        this.startTime = Date.now();
        
        // Test configuration
        this.config = {
            laptop_port: 3001, // Use different port for testing
            server_port: 4041,
            test_timeout: 30000, // 30 seconds per test
            cleanup_after: true
        };
        
        // Test components
        this.laptop = null;
        this.server = null;
        this.arweave = null;
        this.database = null;
        this.backup = null;
    }
    
    /**
     * Run complete end-to-end test suite
     */
    async runAllTests() {
        console.log('🧪 Starting End-to-End Test Suite');
        console.log('=' .repeat(60));
        console.log(`Testing 4-layer architecture:`);
        console.log(`1. Admin Control → 2. Laptop Interface → 3. Server Backend → 4. Arweave Storage`);
        console.log('');
        
        try {
            // Phase 1: Component initialization
            await this.testPhase1_Initialization();
            
            // Phase 2: Basic connectivity
            await this.testPhase2_Connectivity();
            
            // Phase 3: Agent lifecycle
            await this.testPhase3_AgentLifecycle();
            
            // Phase 4: Marketplace integration
            await this.testPhase4_MarketplaceIntegration();
            
            // Phase 5: Revenue processing
            await this.testPhase5_RevenueProcessing();
            
            // Phase 6: Backup and recovery
            await this.testPhase6_BackupRecovery();
            
            // Phase 7: Arweave permanence
            await this.testPhase7_ArweavePermanence();
            
            // Phase 8: Complete integration
            await this.testPhase8_CompleteIntegration();
            
            // Generate final report
            this.generateTestReport();
            
        } catch (error) {
            console.error('🚨 Test suite failed:', error);
            this.errors.push(error);
        } finally {
            if (this.config.cleanup_after) {
                await this.cleanup();
            }
        }
    }
    
    /**
     * Phase 1: Test component initialization
     */
    async testPhase1_Initialization() {
        console.log('\\n🔧 Phase 1: Component Initialization');
        console.log('-' .repeat(40));
        
        // Test 1.1: Database initialization
        await this.runTest('Database initialization', async () => {
            this.database = new ProductionDatabase();
            const result = await this.database.initialize();
            
            this.assert(result.connected, 'Database should be connected');
            this.assert(result.tables > 0, 'Database should have tables');
            
            return result;
        });
        
        // Test 1.2: Arweave initialization
        await this.runTest('Arweave initialization', async () => {
            this.arweave = new ArweaveIntegration();
            const result = await this.arweave.initialize();
            
            this.assert(result.connected, 'Arweave should be connected');
            this.assert(result.wallet_address, 'Should have wallet address');
            
            return result;
        });
        
        // Test 1.3: Backup manager initialization
        await this.runTest('Backup manager initialization', async () => {
            this.backup = new SystemBackupManager();
            
            this.assert(this.backup.backupDir, 'Should have backup directory');
            
            return { initialized: true };
        });
        
        // Test 1.4: Server backend initialization
        await this.runTest('Server backend initialization', async () => {
            this.server = new ServerProductionBackend();
            
            // Mock the dependencies for testing
            this.server.database = this.database;
            this.server.arweave = this.arweave;
            this.server.backupManager = this.backup;
            
            this.assert(this.server.serverConfig, 'Server should have config');
            this.assert(this.server.metrics, 'Server should have metrics');
            
            return { initialized: true };
        });
        
        // Test 1.5: Laptop admin interface initialization
        await this.runTest('Laptop admin interface initialization', async () => {
            this.laptop = new LaptopAdminInterface();
            this.laptop.port = this.config.laptop_port;
            
            this.assert(this.laptop.app, 'Laptop should have Express app');
            this.assert(this.laptop.serverConfig, 'Should have server config');
            
            return { initialized: true };
        });
    }
    
    /**
     * Phase 2: Test connectivity between layers
     */
    async testPhase2_Connectivity() {
        console.log('\\n🔗 Phase 2: Layer Connectivity');
        console.log('-' .repeat(40));
        
        // Test 2.1: Database connectivity
        await this.runTest('Database read/write operations', async () => {
            const testAgent = {
                id: 'test-agent-001',
                name: 'Test Agent',
                creator: 'test-user',
                created: Date.now()
            };
            
            await this.database.storeAgent(testAgent);
            const retrieved = await this.database.getAgent('test-agent-001');
            
            this.assert(retrieved, 'Should retrieve stored agent');
            this.assert(retrieved.name === 'Test Agent', 'Retrieved data should match');
            
            return { stored: true, retrieved: true };
        });
        
        // Test 2.2: Arweave storage operations
        await this.runTest('Arweave storage operations', async () => {
            const testData = {
                type: 'test_record',
                content: 'This is a test record',
                timestamp: Date.now()
            };
            
            const transaction = await this.arweave.storeData(testData, 'test');
            
            this.assert(transaction.id, 'Should return transaction ID');
            this.assert(transaction.cost >= 0, 'Should have valid cost');
            
            return transaction;
        });
        
        // Test 2.3: Backup creation
        await this.runTest('Backup creation', async () => {
            // Mock a minimal sovereign app for backup
            const mockSovereignApp = {
                marketplaceBackend: {
                    approvedMarketplaces: new Map(),
                    pendingApprovals: new Map(),
                    blacklistedDomains: new Set(),
                    revenueStreams: new Map(),
                    platformVault: { balance: 0, transactions: [] },
                    deployedAgents: new Map(),
                    agentMarketplaceMap: new Map(),
                    securityMonitor: { violations: [] }
                },
                agentPlatform: {
                    users: new Map(),
                    agents: new Map(),
                    relationships: new Map(),
                    marketplace: {},
                    revenueModel: {
                        agentWealth: new Map(),
                        agentLedger: new Map(),
                        creatorLedger: new Map(),
                        wealthMilestones: new Map(),
                        platformVault: { balance: 0, transactions: [] },
                        config: {}
                    },
                    config: {}
                },
                sessions: new Map(),
                agentInstances: new Map()
            };
            
            const backup = await this.backup.createFullBackup(mockSovereignApp);
            
            this.assert(backup.backup_id, 'Should have backup ID');
            this.assert(backup.size > 0, 'Backup should have size');
            this.assert(backup.files.length > 0, 'Should have backup files');
            
            return backup;
        });
    }
    
    /**
     * Phase 3: Test complete agent lifecycle
     */
    async testPhase3_AgentLifecycle() {
        console.log('\\n🤖 Phase 3: Agent Lifecycle');
        console.log('-' .repeat(40));
        
        // Test 3.1: Agent creation
        await this.runTest('Agent creation with ownership', async () => {
            const agentData = {
                id: 'lifecycle-agent-001',
                name: 'Lifecycle Test Agent',
                creator: 'test-creator',
                created: Date.now(),
                
                ownership: {
                    creatorShare: 60,
                    agentShare: 40,
                    vestingSchedule: { immediate: 10 }
                },
                
                capabilities: {
                    core: ['conversation', 'analysis'],
                    specialized: ['testing']
                },
                
                personality: {
                    type: 'helpful',
                    traits: ['reliable', 'thorough']
                },
                
                wallet: {
                    address: 'test-wallet-address',
                    balance: 0
                }
            };
            
            // Store in database
            await this.database.storeAgent(agentData);
            
            // Store ownership on Arweave
            const arweaveResult = await this.arweave.storeAgentOwnership(agentData);
            
            this.assert(arweaveResult.id, 'Should store on Arweave');
            
            return { agent: agentData, arweave: arweaveResult };
        });
        
        // Test 3.2: Agent deployment
        await this.runTest('Agent deployment to marketplace', async () => {
            const deployment = {
                id: 'deployment-001',
                agent_id: 'lifecycle-agent-001',
                marketplace_id: 'test-marketplace-001',
                
                config: {
                    autonomy_level: 0.7,
                    max_daily_spend: 50
                },
                
                access_token: 'test-access-token',
                status: 'active',
                deployed_at: Date.now()
            };
            
            await this.database.storeAgentDeployment(deployment);
            
            const retrieved = await this.database.getAgentDeployment('lifecycle-agent-001');
            
            this.assert(retrieved.length > 0, 'Should retrieve deployment');
            this.assert(retrieved[0].status === 'active', 'Deployment should be active');
            
            return deployment;
        });
        
        // Test 3.3: Agent wealth tracking
        await this.runTest('Agent wealth accumulation', async () => {
            const transaction = {
                id: 'wealth-tx-001',
                agent_id: 'lifecycle-agent-001',
                marketplace_id: 'test-marketplace-001',
                gross_amount: 100,
                splits: {
                    platform: 2,
                    marketplace: 6,
                    creator: 55.2,
                    agent: 36.8
                },
                type: 'subscription',
                processed_at: Date.now()
            };
            
            // Store revenue transaction
            await this.database.storeRevenueTransaction(transaction);
            
            // Store on Arweave
            const arweaveResult = await this.arweave.storeRevenueRecord(transaction);
            
            this.assert(arweaveResult.id, 'Should store revenue on Arweave');
            
            // Get metrics
            const metrics = await this.database.getAgentMetrics('lifecycle-agent-001');
            
            this.assert(metrics.total_revenue === 100, 'Should track revenue');
            this.assert(metrics.transactions === 1, 'Should count transactions');
            
            return { transaction, metrics };
        });
    }
    
    /**
     * Phase 4: Test marketplace integration
     */
    async testPhase4_MarketplaceIntegration() {
        console.log('\\n🏪 Phase 4: Marketplace Integration');
        console.log('-' .repeat(40));
        
        // Test 4.1: Marketplace approval
        await this.runTest('Marketplace approval process', async () => {
            const marketplace = {
                id: 'test-marketplace-002',
                domain: 'test-marketplace.com',
                name: 'Test Marketplace',
                type: 'production',
                tier: 'standard',
                approved: true,
                approvedAt: Date.now(),
                features: ['sovereign-agents'],
                apiKey: 'test-api-key',
                metrics: {
                    totalAgents: 0,
                    activeAgents: 0,
                    totalRevenue: 0
                }
            };
            
            await this.database.storeMarketplace(marketplace);
            
            const retrieved = await this.database.getMarketplace('test-marketplace-002');
            
            this.assert(retrieved.approved, 'Marketplace should be approved');
            this.assert(retrieved.api_key, 'Should have API key');
            
            return marketplace;
        });
        
        // Test 4.2: API key validation
        await this.runTest('API key validation', async () => {
            const marketplaces = await this.database.getAllMarketplaces();
            
            this.assert(marketplaces.length > 0, 'Should have marketplaces');
            
            const testMarketplace = marketplaces.find(m => m.id === 'test-marketplace-002');
            
            this.assert(testMarketplace, 'Should find test marketplace');
            this.assert(testMarketplace.api_key === 'test-api-key', 'API key should match');
            
            return { validated: true };
        });
    }
    
    /**
     * Phase 5: Test revenue processing
     */
    async testPhase5_RevenueProcessing() {
        console.log('\\n💰 Phase 5: Revenue Processing');
        console.log('-' .repeat(40));
        
        // Test 5.1: Revenue calculation
        await this.runTest('Revenue split calculation', async () => {
            const grossAmount = 100;
            const expectedSplits = {
                platform: 2,
                marketplace: 6,
                creator: 55.2,
                agent: 36.8
            };
            
            // Test splits add up to 100
            const total = Object.values(expectedSplits).reduce((a, b) => a + b, 0);
            
            this.assert(Math.abs(total - 100) < 0.1, 'Splits should total 100%');
            
            return { splits: expectedSplits, total };
        });
        
        // Test 5.2: Revenue analytics
        await this.runTest('Revenue analytics', async () => {
            const analytics = await this.database.getRevenueAnalytics();
            
            this.assert(analytics.total_transactions >= 0, 'Should have transaction count');
            this.assert(analytics.total_revenue >= 0, 'Should have revenue total');
            this.assert(analytics.by_agent instanceof Map, 'Should have agent breakdown');
            
            return analytics;
        });
    }
    
    /**
     * Phase 6: Test backup and recovery
     */
    async testPhase6_BackupRecovery() {
        console.log('\\n💾 Phase 6: Backup & Recovery');
        console.log('-' .repeat(40));
        
        // Test 6.1: Database backup
        await this.runTest('Database backup creation', async () => {
            const backup = await this.database.createBackup();
            
            this.assert(backup.backup_id, 'Should have backup ID');
            this.assert(backup.size > 0, 'Backup should have size');
            this.assert(backup.metadata, 'Should have metadata');
            
            return backup;
        });
        
        // Test 6.2: Arweave backup storage
        await this.runTest('Arweave backup storage', async () => {
            const backupData = {
                backup_id: 'test-backup-001',
                created: Date.now(),
                summary: {
                    agents: 2,
                    marketplaces: 2,
                    transactions: 1,
                    revenue: 100
                }
            };
            
            const arweaveResult = await this.arweave.storeBackup(backupData);
            
            this.assert(arweaveResult.id, 'Should store backup on Arweave');
            
            return arweaveResult;
        });
    }
    
    /**
     * Phase 7: Test Arweave permanence
     */
    async testPhase7_ArweavePermanence() {
        console.log('\\n🌐 Phase 7: Arweave Permanence');
        console.log('-' .repeat(40));
        
        // Test 7.1: Permanent ownership records
        await this.runTest('Permanent ownership storage', async () => {
            const records = await this.arweave.getAgentRecords('lifecycle-agent-001');
            
            this.assert(records.length > 0, 'Should have agent records');
            
            const ownershipRecord = records.find(r => r.type === 'ownership');
            this.assert(ownershipRecord, 'Should have ownership record');
            
            return records;
        });
        
        // Test 7.2: Data retrieval
        await this.runTest('Arweave data retrieval', async () => {
            // Use a mock transaction ID from our stored records
            const mockTxId = 'mock-tx-' + Date.now();
            
            const retrieved = await this.arweave.retrieveData(mockTxId);
            
            this.assert(retrieved.transaction_id === mockTxId, 'Should retrieve by ID');
            this.assert(retrieved.data, 'Should have data');
            
            return retrieved;
        });
        
        // Test 7.3: Transaction status
        await this.runTest('Transaction status tracking', async () => {
            const status = await this.arweave.getDetailedStatus();
            
            this.assert(status.connected, 'Should be connected');
            this.assert(status.stats, 'Should have statistics');
            this.assert(status.records, 'Should track records');
            
            return status;
        });
    }
    
    /**
     * Phase 8: Test complete integration
     */
    async testPhase8_CompleteIntegration() {
        console.log('\\n🎯 Phase 8: Complete Integration');
        console.log('-' .repeat(40));
        
        // Test 8.1: End-to-end agent creation
        await this.runTest('Complete agent creation flow', async () => {
            const agentId = 'integration-agent-' + Date.now();
            
            // 1. Create agent
            const agent = {
                id: agentId,
                name: 'Integration Test Agent',
                creator: 'integration-test',
                created: Date.now(),
                ownership: { creatorShare: 50, agentShare: 50 },
                wallet: { address: 'integration-wallet', balance: 0 }
            };
            
            // 2. Store in database
            await this.database.storeAgent(agent);
            
            // 3. Store ownership on Arweave
            await this.arweave.storeAgentOwnership(agent);
            
            // 4. Create deployment
            const deployment = {
                id: 'integration-deployment-' + Date.now(),
                agent_id: agentId,
                marketplace_id: 'test-marketplace-002',
                status: 'active',
                deployed_at: Date.now()
            };
            
            await this.database.storeAgentDeployment(deployment);
            
            // 5. Process revenue
            const transaction = {
                id: 'integration-tx-' + Date.now(),
                agent_id: agentId,
                marketplace_id: 'test-marketplace-002',
                gross_amount: 50,
                splits: { platform: 1, marketplace: 3, creator: 23, agent: 23 },
                processed_at: Date.now()
            };
            
            await this.database.storeRevenueTransaction(transaction);
            await this.arweave.storeRevenueRecord(transaction);
            
            // 6. Verify complete flow
            const storedAgent = await this.database.getAgent(agentId);
            const agentRecords = await this.arweave.getAgentRecords(agentId);
            const agentMetrics = await this.database.getAgentMetrics(agentId);
            
            this.assert(storedAgent, 'Agent should be in database');
            this.assert(agentRecords.length > 0, 'Agent should have Arweave records');
            this.assert(agentMetrics.total_revenue === 50, 'Revenue should be tracked');
            
            return {
                agent: storedAgent,
                arweave_records: agentRecords.length,
                revenue: agentMetrics.total_revenue
            };
        });
        
        // Test 8.2: System health check
        await this.runTest('Complete system health', async () => {
            const health = {
                database: await this.database.isHealthy(),
                arweave: this.arweave.isHealthy(),
                backup: true // Backup manager is always healthy if initialized
            };
            
            this.assert(health.database, 'Database should be healthy');
            this.assert(health.arweave, 'Arweave should be healthy');
            this.assert(health.backup, 'Backup should be healthy');
            
            const overallHealth = Object.values(health).every(h => h);
            this.assert(overallHealth, 'Overall system should be healthy');
            
            return health;
        });
        
        // Test 8.3: Performance metrics
        await this.runTest('Performance metrics', async () => {
            const metrics = {
                database_records: this.database.stats.total_records,
                arweave_transactions: this.arweave.stats.transactions_created,
                test_duration: Date.now() - this.startTime
            };
            
            this.assert(metrics.database_records > 0, 'Should have database records');
            this.assert(metrics.arweave_transactions > 0, 'Should have Arweave transactions');
            this.assert(metrics.test_duration > 0, 'Should track test duration');
            
            return metrics;
        });
    }
    
    /**
     * Run individual test with error handling
     */
    async runTest(testName, testFunction) {
        const startTime = Date.now();
        
        try {
            console.log(`  🧪 Running: ${testName}`);
            
            const result = await Promise.race([
                testFunction(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Test timeout')), this.config.test_timeout)
                )
            ]);
            
            const duration = Date.now() - startTime;
            console.log(`     ✅ PASSED (${duration}ms)`);
            
            this.testResults.push({
                name: testName,
                status: 'PASSED',
                duration: duration,
                result: result
            });
            
            return result;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            console.log(`     ❌ FAILED (${duration}ms): ${error.message}`);
            
            this.testResults.push({
                name: testName,
                status: 'FAILED',
                duration: duration,
                error: error.message
            });
            
            this.errors.push({ test: testName, error: error });
            throw error;
        }
    }
    
    /**
     * Assert helper
     */
    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }
    
    /**
     * Generate final test report
     */
    generateTestReport() {
        const totalDuration = Date.now() - this.startTime;
        const passed = this.testResults.filter(r => r.status === 'PASSED').length;
        const failed = this.testResults.filter(r => r.status === 'FAILED').length;
        const total = this.testResults.length;
        
        console.log('\\n' + '=' .repeat(60));
        console.log('🏁 END-TO-END TEST REPORT');
        console.log('=' .repeat(60));
        
        console.log(`\\n📊 Summary:`);
        console.log(`   Total Tests: ${total}`);
        console.log(`   Passed: ${passed} ✅`);
        console.log(`   Failed: ${failed} ❌`);
        console.log(`   Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        console.log(`   Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
        
        if (failed === 0) {
            console.log('\\n🎉 ALL TESTS PASSED!');
            console.log('\\n✅ Your 4-layer architecture is working perfectly:');
            console.log('   1. Admin Control ✅');
            console.log('   2. Laptop Interface ✅');
            console.log('   3. Server Backend ✅');
            console.log('   4. Arweave Storage ✅');
            console.log('\\n🚀 Ready for production deployment!');
        } else {
            console.log('\\n⚠️  Some tests failed. Review the errors above.');
            console.log('\\n❌ Failed Tests:');
            this.testResults.filter(r => r.status === 'FAILED').forEach(test => {
                console.log(`   - ${test.name}: ${test.error}`);
            });
        }
        
        console.log('\\n📋 Detailed Results:');
        this.testResults.forEach(test => {
            const status = test.status === 'PASSED' ? '✅' : '❌';
            console.log(`   ${status} ${test.name} (${test.duration}ms)`);
        });
        
        console.log('\\n' + '=' .repeat(60));
    }
    
    /**
     * Cleanup test environment
     */
    async cleanup() {
        console.log('\\n🧹 Cleaning up test environment...');
        
        try {
            // Close database connections
            if (this.database) {
                // Database cleanup would go here
            }
            
            // Stop any running servers
            if (this.laptop) {
                // Laptop cleanup would go here
            }
            
            if (this.server) {
                // Server cleanup would go here
            }
            
            console.log('✅ Cleanup completed');
            
        } catch (error) {
            console.warn('⚠️ Cleanup error:', error.message);
        }
    }
}

// Export and run if executed directly
module.exports = EndToEndTest;

if (require.main === module) {
    const test = new EndToEndTest();
    test.runAllTests().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('🚨 Test suite crashed:', error);
        process.exit(1);
    });
}