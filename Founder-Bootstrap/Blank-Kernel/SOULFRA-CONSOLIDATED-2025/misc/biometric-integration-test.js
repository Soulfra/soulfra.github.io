// Mirror Kernel Biometric System Integration Test
// Tests the complete biometric authentication flow with tier management

const BiometricMirrorAuth = require('./biometric-auth');
const TierManager = require('./tier-manager');
const VaultMultiUser = require('./vault-multiuser');

class BiometricIntegrationTest {
    constructor() {
        this.biometricAuth = new BiometricMirrorAuth();
        this.tierManager = new TierManager();
        this.vaultManager = new VaultMultiUser();
        
        this.testResults = [];
    }

    async runAllTests() {
        console.log('🧪 Starting Mirror Kernel Biometric Integration Tests...\n');

        try {
            await this.testBiometricRegistration();
            await this.testTierProgression();
            await this.testVaultIsolation();
            await this.testPermissionSystem();
            await this.testUsageTracking();

            this.printTestResults();
            return this.testResults.every(result => result.passed);

        } catch (error) {
            console.error('❌ Test suite failed:', error);
            return false;
        }
    }

    async testBiometricRegistration() {
        console.log('🔐 Testing Biometric Registration...');
        
        try {
            // Simulate user registration
            const registrationResult = await this.biometricAuth.registerUser({
                username: 'test_user',
                displayName: 'Test User'
            });

            if (registrationResult.success) {
                console.log('✅ User registration successful');
                this.testResults.push({
                    name: 'Biometric Registration',
                    passed: true,
                    details: `User ID: ${registrationResult.userId}`
                });
            } else {
                throw new Error('Registration failed');
            }

        } catch (error) {
            console.log('❌ Biometric registration failed:', error.message);
            this.testResults.push({
                name: 'Biometric Registration',
                passed: false,
                error: error.message
            });
        }
    }

    async testTierProgression() {
        console.log('⬆️ Testing Tier Progression...');
        
        try {
            const userId = 'test_user_001';
            
            // Test tier permission checks
            const guestPermission = await this.tierManager.checkPermission(userId, 'guest', 'exports', 'allowed');
            const consumerPermission = await this.tierManager.checkPermission(userId, 'consumer', 'exports', 'allowed');
            const powerUserPermission = await this.tierManager.checkPermission(userId, 'power_user', 'exports', 'monthly_limit');

            if (!guestPermission.allowed && consumerPermission.allowed && powerUserPermission.allowed) {
                console.log('✅ Tier progression logic working correctly');
                this.testResults.push({
                    name: 'Tier Progression',
                    passed: true,
                    details: 'Guest < Consumer < Power User permissions verified'
                });
            } else {
                throw new Error('Tier progression logic failed');
            }

        } catch (error) {
            console.log('❌ Tier progression test failed:', error.message);
            this.testResults.push({
                name: 'Tier Progression',
                passed: false,
                error: error.message
            });
        }
    }

    async testVaultIsolation() {
        console.log('🔒 Testing Vault Isolation...');
        
        try {
            const userId1 = 'test_user_001';
            const userId2 = 'test_user_002';
            const biometricToken = 'bio_test_token_001';
            
            // Create vaults for different users
            const vault1 = await this.vaultManager.createVault(userId1, biometricToken, 'personal_vault', {
                reflections: ['Today I felt happy'],
                emotions: ['joy', 'excitement']
            });

            const vault2 = await this.vaultManager.createVault(userId2, biometricToken, 'work_vault', {
                reflections: ['Work was stressful'],
                emotions: ['stress', 'anxiety']
            });

            // Test that users can only access their own vaults
            const access1 = await this.vaultManager.accessVault(userId1, biometricToken, vault1.vaultId);
            const access2 = await this.vaultManager.accessVault(userId2, biometricToken, vault1.vaultId); // Should fail

            if (vault1.success && vault2.success && access1.success && !access2.success) {
                console.log('✅ Vault isolation working correctly');
                this.testResults.push({
                    name: 'Vault Isolation',
                    passed: true,
                    details: 'Cross-user vault access properly blocked'
                });
            } else {
                throw new Error('Vault isolation compromised');
            }

        } catch (error) {
            console.log('❌ Vault isolation test failed:', error.message);
            this.testResults.push({
                name: 'Vault Isolation',
                passed: false,
                error: error.message
            });
        }
    }

    async testPermissionSystem() {
        console.log('🛡️ Testing Permission System...');
        
        try {
            const userId = 'test_user_001';
            
            // Test export limits
            const guestExportCheck = await this.tierManager.checkResourceLimit(userId, 'guest', 'exports', 1);
            const consumerExportCheck = await this.tierManager.checkResourceLimit(userId, 'consumer', 'exports', 5);
            const powerUserExportCheck = await this.tierManager.checkResourceLimit(userId, 'power_user', 'exports', 100);

            // Test agent limits
            const guestAgentCheck = await this.tierManager.checkResourceLimit(userId, 'guest', 'agents', 1);
            const consumerAgentCheck = await this.tierManager.checkResourceLimit(userId, 'consumer', 'agents', 2);

            if (!guestExportCheck.allowed && consumerExportCheck.allowed && powerUserExportCheck.allowed &&
                !guestAgentCheck.allowed && consumerAgentCheck.allowed) {
                console.log('✅ Permission system working correctly');
                this.testResults.push({
                    name: 'Permission System',
                    passed: true,
                    details: 'Resource limits enforced properly across tiers'
                });
            } else {
                throw new Error('Permission system not enforcing limits correctly');
            }

        } catch (error) {
            console.log('❌ Permission system test failed:', error.message);
            this.testResults.push({
                name: 'Permission System',
                passed: false,
                error: error.message
            });
        }
    }

    async testUsageTracking() {
        console.log('📊 Testing Usage Tracking...');
        
        try {
            const userId = 'test_user_001';
            
            // Record some usage
            const exportUsage = await this.tierManager.recordUsage(userId, 'consumer', 'exports', 3);
            const agentUsage = await this.tierManager.recordUsage(userId, 'consumer', 'agents', 1);
            
            // Get current usage
            const currentExportUsage = await this.tierManager.getCurrentUsage(userId, 'exports');
            const currentAgentUsage = await this.tierManager.getCurrentUsage(userId, 'agents');

            if (exportUsage.success && agentUsage.success && currentExportUsage === 3 && currentAgentUsage === 1) {
                console.log('✅ Usage tracking working correctly');
                this.testResults.push({
                    name: 'Usage Tracking',
                    passed: true,
                    details: `Exports: ${currentExportUsage}, Agents: ${currentAgentUsage}`
                });
            } else {
                throw new Error('Usage tracking not recording correctly');
            }

        } catch (error) {
            console.log('❌ Usage tracking test failed:', error.message);
            this.testResults.push({
                name: 'Usage Tracking',
                passed: false,
                error: error.message
            });
        }
    }

    printTestResults() {
        console.log('\n📋 Test Results Summary:');
        console.log('=' * 50);
        
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
        
        console.log('=' * 50);
        console.log(`Total: ${this.testResults.length} | Passed: ${passed} | Failed: ${failed}`);
        
        if (failed === 0) {
            console.log('🎉 All biometric integration tests passed!');
        } else {
            console.log('⚠️ Some tests failed. Check implementation.');
        }
    }
}

// Export for use in other modules
module.exports = BiometricIntegrationTest;

// Run tests if this file is executed directly
if (require.main === module) {
    const test = new BiometricIntegrationTest();
    test.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}