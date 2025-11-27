// Agent Zero Integration Test Suite
// Tests the complete Agent Zero tier integration system

const AgentZeroTierAdapter = require('./tier-adapter');
const AutonomousActionEngine = require('./autonomous-engine');
const ApprovalWorkflowSystem = require('./approval-workflow');
const BiometricMirrorAuth = require('../biometric/biometric-auth');
const TierManager = require('../biometric/tier-manager');

class AgentZeroIntegrationTest {
    constructor() {
        this.biometricAuth = new BiometricMirrorAuth();
        this.tierManager = new TierManager();
        this.tierAdapter = new AgentZeroTierAdapter({
            biometricAuth: this.biometricAuth,
            tierManager: this.tierManager
        });
        this.autonomousEngine = new AutonomousActionEngine({
            tierAdapter: this.tierAdapter
        });
        this.approvalWorkflow = new ApprovalWorkflowSystem();
        
        this.testResults = [];
    }

    async runAllTests() {
        console.log('🧪 Starting Agent Zero Integration Tests...\n');

        try {
            await this.testTierCapabilityMapping();
            await this.testAutonomousActionExecution();
            await this.testApprovalWorkflow();
            await this.testTierProgression();
            await this.testSpendingControls();
            await this.testEmergencyStops();
            await this.testUserLearning();

            this.printTestResults();
            return this.testResults.every(result => result.passed);

        } catch (error) {
            console.error('❌ Test suite failed:', error);
            return false;
        }
    }

    async testTierCapabilityMapping() {
        console.log('🎯 Testing Tier Capability Mapping...');
        
        try {
            const testUserId = 'test_user_001';
            const testToken = 'bio_test_token_001';

            // Test guest tier capabilities
            const guestCapabilities = await this.tierAdapter.getTierCapabilities(testUserId, testToken);
            
            if (guestCapabilities.tier === 'guest' && 
                guestCapabilities.autonomy_level === 0.1 &&
                guestCapabilities.spending_limit === 0) {
                
                console.log('✅ Guest tier capabilities correctly mapped');
                this.testResults.push({
                    name: 'Tier Capability Mapping',
                    passed: true,
                    details: `Guest tier: autonomy ${guestCapabilities.autonomy_level}, spending $${guestCapabilities.spending_limit}`
                });
            } else {
                throw new Error('Guest tier capability mapping failed');
            }

        } catch (error) {
            console.log('❌ Tier capability mapping test failed:', error.message);
            this.testResults.push({
                name: 'Tier Capability Mapping',
                passed: false,
                error: error.message
            });
        }
    }

    async testAutonomousActionExecution() {
        console.log('🤖 Testing Autonomous Action Execution...');
        
        try {
            const testUserId = 'test_user_002';
            const testAction = {
                id: 'test_action_001',
                type: 'reflection_analysis',
                purpose: 'Analyze user reflection patterns',
                estimated_cost: 0.02,
                complexity: 'low',
                reflection: 'Today I felt grateful for my family and excited about new opportunities.'
            };

            const context = {
                biometricToken: 'bio_test_token_002'
            };

            // Execute action
            const result = await this.autonomousEngine.executeAction(testUserId, testAction, context);
            
            if (result.status === 'completed' && result.result.type === 'reflection_analysis') {
                console.log('✅ Autonomous action execution successful');
                this.testResults.push({
                    name: 'Autonomous Action Execution',
                    passed: true,
                    details: `Action: ${testAction.type}, Status: ${result.status}, Cost: $${result.cost_incurred}`
                });
            } else {
                throw new Error(`Action execution failed: ${result.status} - ${result.message || 'Unknown error'}`);
            }

        } catch (error) {
            console.log('❌ Autonomous action execution test failed:', error.message);
            this.testResults.push({
                name: 'Autonomous Action Execution',
                passed: false,
                error: error.message
            });
        }
    }

    async testApprovalWorkflow() {
        console.log('📋 Testing Approval Workflow...');
        
        try {
            const testUserId = 'test_user_003';
            const testAction = {
                id: 'test_action_002',
                type: 'agent_spawning',
                purpose: 'Create productivity assistant',
                estimated_cost: 5.00,
                complexity: 'medium',
                agent_config: {
                    type: 'productivity_assistant',
                    name: 'Focus Helper',
                    capabilities: ['task_scheduling', 'reminder_management']
                }
            };

            const capabilities = {
                tier: 'consumer',
                autonomy_level: 0.4,
                spending_limit: 25,
                approval_thresholds: {
                    spending_over: 5,
                    new_integrations: true
                }
            };

            const context = { biometricToken: 'bio_test_token_003' };

            // Request approval
            const approvalResult = await this.approvalWorkflow.requestApproval(
                testUserId, testAction, capabilities, context, 'exec_test_001'
            );
            
            if (approvalResult.status === 'approval_requested' && approvalResult.approval_id) {
                console.log('✅ Approval workflow request successful');
                
                // Simulate user approval
                const userResponse = {
                    decision: 'approved',
                    feedback: 'This looks helpful for my productivity'
                };

                const responseResult = await this.approvalWorkflow.processApprovalResponse(
                    approvalResult.approval_id, userResponse, testUserId
                );

                if (responseResult.status === 'approved_and_executing') {
                    console.log('✅ Approval workflow response processing successful');
                    this.testResults.push({
                        name: 'Approval Workflow',
                        passed: true,
                        details: `Request: ${approvalResult.status}, Response: ${responseResult.status}`
                    });
                } else {
                    throw new Error(`Approval response processing failed: ${responseResult.status}`);
                }
            } else {
                throw new Error(`Approval request failed: ${approvalResult.status}`);
            }

        } catch (error) {
            console.log('❌ Approval workflow test failed:', error.message);
            this.testResults.push({
                name: 'Approval Workflow',
                passed: false,
                error: error.message
            });
        }
    }

    async testTierProgression() {
        console.log('⬆️ Testing Tier Progression Analytics...');
        
        try {
            const testUserId = 'test_user_004';
            
            // Simulate usage history by recording several actions
            const testActions = [
                { type: 'reflection_analysis', status: 'completed', cost: 0.02 },
                { type: 'basic_agent_spawning', status: 'completed', cost: 3.00 },
                { type: 'pattern_recognition', status: 'completed', cost: 1.50 },
                { type: 'qr_sharing', status: 'completed', cost: 0.00 }
            ];

            // Record actions
            for (const action of testActions) {
                await this.tierAdapter.recordActionAttempt(
                    testUserId, 
                    action, 
                    { status: action.status, actual_cost: action.cost },
                    { tier: 'consumer' }
                );
            }

            // Generate analytics
            const analytics = await this.tierAdapter.getUserTierAnalytics(testUserId, '7d');
            
            if (analytics && analytics.total_actions === testActions.length) {
                console.log('✅ Tier progression analytics working correctly');
                this.testResults.push({
                    name: 'Tier Progression Analytics',
                    passed: true,
                    details: `Actions: ${analytics.total_actions}, Success Rate: ${analytics.success_rate.toFixed(2)}`
                });
            } else {
                throw new Error('Tier progression analytics not generating correct data');
            }

        } catch (error) {
            console.log('❌ Tier progression test failed:', error.message);
            this.testResults.push({
                name: 'Tier Progression Analytics',
                passed: false,
                error: error.message
            });
        }
    }

    async testSpendingControls() {
        console.log('💰 Testing Spending Controls...');
        
        try {
            const testUserId = 'test_user_005';
            const testAction = {
                id: 'test_action_003',
                type: 'workflow_automation',
                purpose: 'Automate email processing',
                estimated_cost: 50.00, // Exceeds typical consumer limit
                complexity: 'high'
            };

            const capabilities = {
                tier: 'consumer',
                spending_limit: 25,
                autonomy_level: 0.4
            };

            const context = { biometricToken: 'bio_test_token_005' };

            // Execute action that should be blocked by spending limit
            const result = await this.autonomousEngine.executeAction(testUserId, testAction, context);
            
            if (result.status === 'spending_limit_exceeded') {
                console.log('✅ Spending controls working correctly');
                this.testResults.push({
                    name: 'Spending Controls',
                    passed: true,
                    details: `Blocked action with cost $${testAction.estimated_cost} against limit $${capabilities.spending_limit}`
                });
            } else {
                throw new Error(`Spending control failed: action should have been blocked but got status ${result.status}`);
            }

        } catch (error) {
            console.log('❌ Spending controls test failed:', error.message);
            this.testResults.push({
                name: 'Spending Controls',
                passed: false,
                error: error.message
            });
        }
    }

    async testEmergencyStops() {
        console.log('🚨 Testing Emergency Stop Controls...');
        
        try {
            const testUserId = 'test_user_006';
            const testAction = {
                id: 'test_action_004',
                type: 'reflection_analysis',
                purpose: 'Basic reflection analysis',
                estimated_cost: 0.02,
                complexity: 'low'
            };

            const context = { biometricToken: 'bio_test_token_006' };

            // Set emergency stop
            this.autonomousEngine.setEmergencyStop(testUserId, 'user_requested');

            // Try to execute action
            const result = await this.autonomousEngine.executeAction(testUserId, testAction, context);
            
            if (result.status === 'emergency_stop_active') {
                console.log('✅ Emergency stop working correctly');
                
                // Clear emergency stop
                const cleared = this.autonomousEngine.clearEmergencyStop(testUserId, 'user');
                
                if (cleared) {
                    console.log('✅ Emergency stop clearing working correctly');
                    this.testResults.push({
                        name: 'Emergency Stop Controls',
                        passed: true,
                        details: 'Emergency stop activated, blocked action, and cleared successfully'
                    });
                } else {
                    throw new Error('Emergency stop could not be cleared');
                }
            } else {
                throw new Error(`Emergency stop failed: action should have been blocked but got status ${result.status}`);
            }

        } catch (error) {
            console.log('❌ Emergency stop test failed:', error.message);
            this.testResults.push({
                name: 'Emergency Stop Controls',
                passed: false,
                error: error.message
            });
        }
    }

    async testUserLearning() {
        console.log('📚 Testing User Learning System...');
        
        try {
            const testUserId = 'test_user_007';
            
            // Simulate learning from user approvals
            const testApproval = {
                action: {
                    type: 'agent_spawning',
                    estimated_cost: 5.00
                }
            };

            const testResponse = {
                decision: 'approved',
                feedback: 'This agent is very helpful'
            };

            // Test user preference learning
            const preferenceEngine = this.approvalWorkflow.userPreferenceEngine;
            await preferenceEngine.learnFromApproval(testUserId, testApproval.action, testResponse);

            // Check if preferences were updated
            const userPrefs = preferenceEngine.userPreferences.get(testUserId);
            
            if (userPrefs && 
                userPrefs.approval_patterns.agent_spawning &&
                userPrefs.approval_patterns.agent_spawning.approved === 1) {
                
                console.log('✅ User learning system working correctly');
                this.testResults.push({
                    name: 'User Learning System',
                    passed: true,
                    details: 'User preferences learned from approval decision'
                });
            } else {
                throw new Error('User learning system not updating preferences correctly');
            }

        } catch (error) {
            console.log('❌ User learning test failed:', error.message);
            this.testResults.push({
                name: 'User Learning System',
                passed: false,
                error: error.message
            });
        }
    }

    printTestResults() {
        console.log('\n📋 Agent Zero Integration Test Results:');
        console.log('=' * 60);
        
        let passed = 0;
        let failed = 0;
        
        this.testResults.forEach(result => {
            const status = result.passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} - ${result.name}`);
            
            if (result.details) {
                console.log(`    ${result.details}`);
            }
            if (result.error) {
                console.log(`    Error: ${result.error}`);
            }
            
            result.passed ? passed++ : failed++;
        });
        
        console.log('=' * 60);
        console.log(`Total: ${this.testResults.length} | Passed: ${passed} | Failed: ${failed}`);
        
        if (failed === 0) {
            console.log('🎉 All Agent Zero integration tests passed!');
        } else {
            console.log('⚠️ Some tests failed. Check implementation.');
        }
    }

    // Integration test for complete workflow
    async testCompleteAgentZeroWorkflow() {
        console.log('🔄 Testing Complete Agent Zero Workflow...');
        
        try {
            const testUserId = 'test_user_complete';
            const biometricToken = 'bio_complete_test_token';

            // Step 1: User authenticates and gets capabilities
            const capabilities = await this.tierAdapter.getTierCapabilities(testUserId, biometricToken);
            console.log(`User authenticated as ${capabilities.tier} with autonomy level ${capabilities.autonomy_level}`);

            // Step 2: Agent Zero suggests an action based on user patterns
            const suggestedAction = {
                id: 'complete_test_action',
                type: 'agent_spawning',
                purpose: 'Create a reflection pattern analyzer',
                estimated_cost: 8.00,
                complexity: 'medium',
                agent_config: {
                    type: 'pattern_analyzer',
                    name: 'Insight Explorer',
                    capabilities: ['pattern_detection', 'trend_analysis', 'insight_generation']
                }
            };

            // Step 3: Validate action permissions
            const permissionResult = await this.tierAdapter.validateActionPermission(
                testUserId, suggestedAction, capabilities
            );

            if (!permissionResult.permitted) {
                throw new Error(`Action not permitted: ${permissionResult.reason}`);
            }

            console.log('Action validated and approved for execution');

            // Step 4: Execute action (this would normally be done by autonomous engine)
            const executionResult = await this.autonomousEngine.executeAction(
                testUserId, suggestedAction, { biometricToken }
            );

            if (executionResult.status === 'completed') {
                console.log('✅ Complete Agent Zero workflow test successful');
                
                // Step 5: Generate user analytics
                const analytics = await this.tierAdapter.getUserTierAnalytics(testUserId, '30d');
                console.log(`User analytics: ${analytics.total_actions} actions, ${(analytics.success_rate * 100).toFixed(1)}% success rate`);

                this.testResults.push({
                    name: 'Complete Agent Zero Workflow',
                    passed: true,
                    details: `Full workflow from authentication to execution completed successfully`
                });

            } else {
                throw new Error(`Workflow execution failed: ${executionResult.status} - ${executionResult.message}`);
            }

        } catch (error) {
            console.log('❌ Complete workflow test failed:', error.message);
            this.testResults.push({
                name: 'Complete Agent Zero Workflow',
                passed: false,
                error: error.message
            });
        }
    }
}

// Export for use in other modules
module.exports = AgentZeroIntegrationTest;

// Run tests if this file is executed directly
if (require.main === module) {
    const test = new AgentZeroIntegrationTest();
    test.runAllTests().then(success => {
        console.log(`\n${success ? '✅' : '❌'} Agent Zero Integration Tests ${success ? 'PASSED' : 'FAILED'}`);
        process.exit(success ? 0 : 1);
    });
}