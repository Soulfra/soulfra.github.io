/**
 * Mock Authorization Fixture for Testing
 * 
 * This is just test data and mock implementations for unit testing.
 * NOT FOR PRODUCTION USE. Contains simplified logic for testing only.
 * 
 * @test-fixture
 * @mock-only
 * @do-not-use
 */

const crypto = require('crypto');

// Mock authorization class for testing purposes only
class MockAuthorizationEngine {
    constructor() {
        // Test configuration
        this.testMode = true;
        this.mockResponses = new Map();
        this.delegatedPermissions = new Map();
        this.nonceTracker = new Set();
        this.replayWindow = 300000; // 5 minutes for testing
    }
    
    /**
     * Mock authorization method for testing
     * Returns predictable results for unit tests
     */
    async mockAuthorizeAction(action, identity, context) {
        // Check if this is a replay attack (for security testing)
        if (this.nonceTracker.has(action.nonce)) {
            return {
                authorized: false,
                reason: 'Replay attack detected',
                method: 'security_check',
                timestamp: Date.now()
            };
        }
        
        // Add nonce to tracker
        this.nonceTracker.add(action.nonce);
        
        // Check timestamp freshness
        const age = Date.now() - action.timestamp;
        if (age > this.replayWindow) {
            return {
                authorized: false,
                reason: 'Request too old',
                method: 'timestamp_validation',
                timestamp: Date.now()
            };
        }
        
        // Multi-method authorization (for testing different paths)
        const authResults = await Promise.all([
            this.checkDirectSignature(action, identity),
            this.checkDelegatedPermission(action, identity),
            this.checkBiometricAuth(action, context),
            this.checkContextualAuth(action, context, identity),
            this.checkSpendingLimits(action, identity, context)
        ]);
        
        // Find the best authorization method
        const validAuths = authResults.filter(r => r.authorized);
        
        if (validAuths.length === 0) {
            return {
                authorized: false,
                reason: 'No valid authorization method',
                methods_tried: authResults.map(r => r.method),
                timestamp: Date.now()
            };
        }
        
        // Return the highest confidence authorization
        const bestAuth = validAuths.reduce((best, current) => 
            current.confidence > best.confidence ? current : best
        );
        
        // Create dual signature for approved actions
        if (bestAuth.authorized) {
            bestAuth.dualSignature = await this.createDualSignature(
                action,
                identity,
                bestAuth
            );
        }
        
        return bestAuth;
    }
    
    /**
     * Check direct cryptographic signature
     * (Mock implementation for testing)
     */
    async checkDirectSignature(action, identity) {
        if (!action.signature) {
            return {
                authorized: false,
                method: 'direct_signature',
                confidence: 0,
                reason: 'No signature provided'
            };
        }
        
        try {
            // Simulate signature verification
            const actionData = JSON.stringify({
                type: action.type,
                data: action.data,
                timestamp: action.timestamp,
                nonce: action.nonce
            });
            
            const isValid = await this.mockVerifySignature(
                actionData,
                action.signature,
                identity.publicKey
            );
            
            return {
                authorized: isValid,
                method: 'direct_signature',
                confidence: isValid ? 100 : 0,
                signatureType: 'ed25519'
            };
        } catch (e) {
            return {
                authorized: false,
                method: 'direct_signature',
                confidence: 0,
                reason: 'Signature verification failed'
            };
        }
    }
    
    /**
     * Check delegated permissions
     * (Test implementation)
     */
    async checkDelegatedPermission(action, identity) {
        const permission = this.delegatedPermissions.get(action.type);
        
        if (!permission) {
            return {
                authorized: false,
                method: 'delegated_permission',
                confidence: 0,
                reason: 'No delegation found'
            };
        }
        
        // Check if delegation is still valid
        if (permission.expires && Date.now() > permission.expires) {
            return {
                authorized: false,
                method: 'delegated_permission',
                confidence: 0,
                reason: 'Delegation expired'
            };
        }
        
        // Check spending limits
        if (action.estimatedCost && action.estimatedCost > permission.spendingLimit) {
            return {
                authorized: false,
                method: 'delegated_permission',
                confidence: 0,
                reason: 'Exceeds spending limit'
            };
        }
        
        // Check context restrictions
        for (const restriction of permission.contextRestrictions || []) {
            if (!this.checkContextRestriction(restriction, action)) {
                return {
                    authorized: false,
                    method: 'delegated_permission',
                    confidence: 0,
                    reason: `Context restriction failed: ${restriction.type}`
                };
            }
        }
        
        return {
            authorized: true,
            method: 'delegated_permission',
            confidence: 85,
            delegationId: permission.id,
            remainingSpend: permission.spendingLimit - (action.estimatedCost || 0)
        };
    }
    
    /**
     * Check biometric authentication
     * (Mock for testing)
     */
    async checkBiometricAuth(action, context) {
        if (!context.biometricAuth) {
            return {
                authorized: false,
                method: 'biometric',
                confidence: 0,
                reason: 'No biometric data'
            };
        }
        
        const bio = context.biometricAuth;
        
        // Check if biometric is recent
        const age = Date.now() - bio.timestamp;
        if (age > 300000) { // 5 minutes
            return {
                authorized: false,
                method: 'biometric',
                confidence: 0,
                reason: 'Biometric data too old'
            };
        }
        
        // Check confidence threshold
        if (bio.confidence < 80) {
            return {
                authorized: false,
                method: 'biometric',
                confidence: bio.confidence,
                reason: 'Biometric confidence too low'
            };
        }
        
        return {
            authorized: true,
            method: 'biometric',
            confidence: bio.confidence,
            biometricType: bio.type,
            timestamp: bio.timestamp
        };
    }
    
    /**
     * Check contextual authorization
     * (Pattern matching for testing)
     */
    async checkContextualAuth(action, context, identity) {
        const contextScore = this.calculateContextScore(action, context, identity);
        
        return {
            authorized: contextScore > 70,
            method: 'contextual',
            confidence: contextScore,
            factors: {
                deviceTrust: context.deviceTrust || 0,
                locationTrust: context.locationTrust || 0,
                behaviorMatch: context.behaviorMatch || 0,
                timePattern: context.timePattern || 0
            }
        };
    }
    
    /**
     * Check spending limits based on tier
     * (Mock tier system)
     */
    async checkSpendingLimits(action, identity, context) {
        const tierLimits = {
            guest: { autoApprove: 0, daily: 0 },
            consumer: { autoApprove: 10, daily: 100 },
            power_user: { autoApprove: 100, daily: 1000 },
            enterprise: { autoApprove: 10000, daily: 100000 }
        };
        
        const userTier = context.userTier || 'guest';
        const limits = tierLimits[userTier];
        const cost = action.estimatedCost || 0;
        
        if (cost > limits.autoApprove) {
            return {
                authorized: false,
                method: 'spending_limit',
                confidence: 0,
                reason: `Exceeds auto-approve limit for ${userTier} tier`,
                limit: limits.autoApprove,
                requested: cost
            };
        }
        
        // Check daily spending (mock)
        const dailySpent = context.dailySpending || 0;
        if (dailySpent + cost > limits.daily) {
            return {
                authorized: false,
                method: 'spending_limit',
                confidence: 0,
                reason: 'Exceeds daily spending limit',
                limit: limits.daily,
                spent: dailySpent,
                requested: cost
            };
        }
        
        return {
            authorized: true,
            method: 'spending_limit',
            confidence: 75,
            tier: userTier,
            remainingDaily: limits.daily - dailySpent - cost
        };
    }
    
    /**
     * Create dual signature for authorized actions
     * (Mock implementation)
     */
    async createDualSignature(action, identity, authorization) {
        const actionHash = crypto.createHash('sha256')
            .update(JSON.stringify(action))
            .digest('hex');
        
        return {
            actionHash: actionHash,
            ownerSignature: 'mock-owner-sig-' + actionHash.substring(0, 16),
            agentSignature: 'mock-agent-sig-' + actionHash.substring(0, 16),
            authorizationMethod: authorization.method,
            timestamp: Date.now(),
            nonce: crypto.randomBytes(16).toString('hex')
        };
    }
    
    /**
     * Mock signature verification
     */
    async mockVerifySignature(data, signature, publicKey) {
        // For testing, just check if signature format is valid
        return signature && signature.startsWith('sig-') && publicKey;
    }
    
    /**
     * Calculate context score for testing
     */
    calculateContextScore(action, context, identity) {
        let score = 50; // Base score
        
        if (context.deviceTrust > 80) score += 10;
        if (context.locationTrust > 70) score += 10;
        if (context.behaviorMatch > 60) score += 15;
        if (context.timePattern > 50) score += 15;
        
        return Math.min(score, 100);
    }
    
    /**
     * Check context restriction
     */
    checkContextRestriction(restriction, action) {
        switch (restriction.type) {
            case 'time':
                const hour = new Date().getHours();
                return hour >= restriction.startHour && hour <= restriction.endHour;
            
            case 'risk_level':
                return action.riskLevel <= restriction.maxRisk;
            
            case 'action_type':
                return restriction.allowedTypes.includes(action.type);
            
            default:
                return true;
        }
    }
    
    /**
     * Create a delegated permission (for testing)
     */
    createDelegatedPermission(actionType, spec) {
        const permission = {
            id: crypto.randomBytes(16).toString('hex'),
            actionType: actionType,
            spendingLimit: spec.spendingLimit || 100,
            expires: spec.expires || Date.now() + 86400000, // 24 hours
            contextRestrictions: spec.contextRestrictions || [],
            created: Date.now(),
            createdBy: spec.createdBy || 'test-user'
        };
        
        this.delegatedPermissions.set(actionType, permission);
        return permission;
    }
    
    /**
     * Clear all test data
     */
    clearTestData() {
        this.mockResponses.clear();
        this.delegatedPermissions.clear();
        this.nonceTracker.clear();
    }
}

// Export the mock
module.exports = {
    MockAuthorizationEngine,
    
    // Test helpers
    createTestAction: function(type, data) {
        return {
            type: type,
            data: data,
            timestamp: Date.now(),
            nonce: crypto.randomBytes(16).toString('hex'),
            estimatedCost: 10,
            riskLevel: 'low'
        };
    },
    
    createTestIdentity: function() {
        return {
            publicKey: 'test-public-key-' + crypto.randomBytes(8).toString('hex'),
            userId: 'test-user-' + crypto.randomBytes(4).toString('hex')
        };
    },
    
    createTestContext: function(tier = 'consumer') {
        return {
            userTier: tier,
            deviceTrust: 90,
            locationTrust: 80,
            behaviorMatch: 75,
            timePattern: 85,
            dailySpending: 0,
            biometricAuth: {
                success: true,
                confidence: 95,
                type: 'face_id',
                timestamp: Date.now()
            }
        };
    },
    
    // Test fixture metadata
    metadata: {
        type: 'test-fixture',
        purpose: 'unit-testing',
        warning: 'Not for production use',
        mock: true
    }
};

/**
 * TEST FIXTURE NOTES:
 * - This is mock code for testing only
 * - Does not implement real cryptographic operations
 * - Returns predictable results for unit tests
 * - All signatures are fake
 * - Do not use in production
 */