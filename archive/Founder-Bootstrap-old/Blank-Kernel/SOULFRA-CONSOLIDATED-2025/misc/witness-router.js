/**
 * Witness Router System
 * 
 * Validates every action from Router Mirror Buffer.
 * Checks truth anchor, entropy drift, and sovereign trust score.
 * Blocks exports and triggers reflection delays on audit failures.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class WitnessRouter {
    constructor() {
        this.vaultPath = '../vault';
        this.configPath = '../vault/config';
        this.logsPath = '../vault/logs';
        
        // Witness validation state
        this.truthAnchor = null;
        this.validationHistory = [];
        this.rejectedActions = [];
        
        // Validation thresholds
        this.thresholds = {
            maxEntropyDrift: 0.005,
            minTrustScore: 90.0,
            maxForkVolume: 100,
            reflectionDelayTrigger: 3 // failed validations before delay
        };
        
        // Active validation sessions
        this.activeSessions = new Map();
        this.reflectionDelays = new Map();
        
        this.initializeWitnessRouter();
    }
    
    /**
     * Initialize witness router validation system
     */
    async initializeWitnessRouter() {
        console.log('🔍 Initializing Witness Router Validation System...');
        console.log('⚖️ Truth anchor verification and entropy drift monitoring');
        console.log('🛡️ Sovereign trust score validation');
        
        // Load truth anchor
        await this.loadTruthAnchor();
        
        // Load validation history
        await this.loadValidationHistory();
        
        // Initialize reflection delay tracking
        await this.loadReflectionDelays();
        
        console.log('✅ Witness Router ready for validation');
        console.log(`📊 ${this.validationHistory.length} historical validations`);
        console.log(`🚫 ${this.rejectedActions.length} rejected actions on record`);
    }
    
    /**
     * Validate incoming action from Router Mirror Buffer
     */
    async validateAction(actionData) {
        console.log(`🔍 Witness validation: ${actionData.action} [${actionData.requestId}]`);
        
        const validationId = this.generateValidationId();
        const timestamp = Date.now();
        
        // Create validation session
        const validationSession = {
            validationId: validationId,
            requestId: actionData.requestId,
            action: actionData.action,
            enterpriseVaultSig: actionData.enterpriseVaultSig,
            timestamp: timestamp,
            status: 'validating'
        };
        
        this.activeSessions.set(validationId, validationSession);
        
        try {
            // Step 1: Verify truth anchor integrity
            const truthAnchorCheck = await this.verifyTruthAnchor(actionData);
            if (!truthAnchorCheck.valid) {
                return await this.rejectAction(validationSession, 'truth_anchor_failure', truthAnchorCheck.reason);
            }
            
            // Step 2: Check entropy drift
            const entropyCheck = await this.checkEntropyDrift(actionData);
            if (!entropyCheck.valid) {
                return await this.rejectAction(validationSession, 'entropy_drift_exceeded', entropyCheck.reason);
            }
            
            // Step 3: Validate sovereign trust score
            const trustScoreCheck = await this.validateSovereignTrustScore(actionData);
            if (!trustScoreCheck.valid) {
                return await this.rejectAction(validationSession, 'trust_score_insufficient', trustScoreCheck.reason);
            }
            
            // Step 4: Check fork volume quota
            const forkVolumeCheck = await this.checkForkVolumeQuota(actionData);
            if (!forkVolumeCheck.valid) {
                return await this.rejectAction(validationSession, 'fork_volume_exceeded', forkVolumeCheck.reason);
            }
            
            // Step 5: Verify global Cal tone consistency
            const calToneCheck = await this.verifyGlobalCalTone(actionData);
            if (!calToneCheck.valid) {
                return await this.rejectAction(validationSession, 'cal_tone_inconsistency', calToneCheck.reason);
            }
            
            // Step 6: Check for reflection delays
            const reflectionDelayCheck = await this.checkReflectionDelay(actionData.enterpriseVaultSig);
            if (!reflectionDelayCheck.allowed) {
                return await this.rejectAction(validationSession, 'reflection_delay_active', reflectionDelayCheck.reason);
            }
            
            // All validations passed
            validationSession.status = 'approved';
            validationSession.validationResults = {
                truthAnchor: truthAnchorCheck,
                entropyDrift: entropyCheck,
                trustScore: trustScoreCheck,
                forkVolume: forkVolumeCheck,
                calTone: calToneCheck,
                reflectionDelay: reflectionDelayCheck
            };
            
            // Calculate new trust score
            const newTrustScore = this.calculateUpdatedTrustScore(actionData.enterpriseVaultSig, true);
            
            // Log successful validation
            await this.logSuccessfulValidation(validationSession);
            
            console.log(`   ✅ Validation approved: ${validationId}`);
            
            return {
                approved: true,
                validationId: validationId,
                trustScore: newTrustScore,
                validationResults: validationSession.validationResults,
                witnessSignature: this.generateWitnessSignature(validationSession)
            };
            
        } catch (error) {
            return await this.rejectAction(validationSession, 'validation_error', error.message);
            
        } finally {
            // Clean up active session
            this.activeSessions.delete(validationId);
        }
    }
    
    /**
     * Verify truth anchor integrity
     */
    async verifyTruthAnchor(actionData) {
        console.log('   🔐 Verifying truth anchor integrity...');
        
        if (!this.truthAnchor) {
            return {
                valid: false,
                reason: 'Truth anchor not loaded'
            };
        }
        
        // Verify root signature matches
        const expectedSignature = this.truthAnchor.rootSignature;
        const currentSignature = this.calculateCurrentSignature();
        
        if (expectedSignature !== currentSignature) {
            return {
                valid: false,
                reason: 'Root signature mismatch'
            };
        }
        
        // Check platform change hash
        const lastChangeHash = this.truthAnchor.lastApprovedPlatformChangeHash;
        const currentChangeHash = this.calculatePlatformChangeHash();
        
        // Allow for approved changes
        if (currentChangeHash !== lastChangeHash) {
            const changeApproved = await this.verifyPlatformChange(currentChangeHash);
            if (!changeApproved) {
                return {
                    valid: false,
                    reason: 'Unapproved platform changes detected'
                };
            }
        }
        
        return {
            valid: true,
            signature: currentSignature,
            changeHash: currentChangeHash
        };
    }
    
    /**
     * Check entropy drift levels
     */
    async checkEntropyDrift(actionData) {
        console.log('   📊 Checking entropy drift levels...');
        
        const currentEntropy = await this.calculateCurrentEntropy();
        const entropyBaseline = this.truthAnchor.entropyCap;
        const entropyDrift = Math.abs(currentEntropy - entropyBaseline);
        
        if (entropyDrift > this.thresholds.maxEntropyDrift) {
            return {
                valid: false,
                reason: `Entropy drift exceeded: ${entropyDrift.toFixed(4)} > ${this.thresholds.maxEntropyDrift}`,
                currentEntropy: currentEntropy,
                baseline: entropyBaseline,
                drift: entropyDrift
            };
        }
        
        return {
            valid: true,
            currentEntropy: currentEntropy,
            baseline: entropyBaseline,
            drift: entropyDrift
        };
    }
    
    /**
     * Validate sovereign trust score
     */
    async validateSovereignTrustScore(actionData) {
        console.log('   🎯 Validating sovereign trust score...');
        
        const trustScore = await this.getCurrentTrustScore(actionData.enterpriseVaultSig);
        
        if (trustScore < this.thresholds.minTrustScore) {
            return {
                valid: false,
                reason: `Trust score below threshold: ${trustScore}% < ${this.thresholds.minTrustScore}%`,
                currentScore: trustScore,
                threshold: this.thresholds.minTrustScore
            };
        }
        
        // Check for recent trust score degradation
        const recentHistory = await this.getRecentTrustHistory(actionData.enterpriseVaultSig);
        const degradationRate = this.calculateTrustDegradation(recentHistory);
        
        if (degradationRate > 5.0) { // More than 5% degradation in recent history
            return {
                valid: false,
                reason: `Rapid trust score degradation detected: ${degradationRate.toFixed(1)}%`,
                currentScore: trustScore,
                degradationRate: degradationRate
            };
        }
        
        return {
            valid: true,
            currentScore: trustScore,
            degradationRate: degradationRate
        };
    }
    
    /**
     * Check fork volume quota
     */
    async checkForkVolumeQuota(actionData) {
        console.log('   🍴 Checking fork volume quota...');
        
        if (!actionData.action.includes('fork')) {
            return { valid: true, reason: 'Not a fork action' };
        }
        
        const currentForkVolume = await this.getCurrentForkVolume(actionData.enterpriseVaultSig);
        const forkQuotaLimit = this.truthAnchor.forkVolumeQuota;
        
        if (currentForkVolume >= forkQuotaLimit) {
            return {
                valid: false,
                reason: `Fork volume quota exceeded: ${currentForkVolume}/${forkQuotaLimit}`,
                currentVolume: currentForkVolume,
                quota: forkQuotaLimit
            };
        }
        
        return {
            valid: true,
            currentVolume: currentForkVolume,
            quota: forkQuotaLimit,
            remaining: forkQuotaLimit - currentForkVolume
        };
    }
    
    /**
     * Verify global Cal tone consistency
     */
    async verifyGlobalCalTone(actionData) {
        console.log('   🤖 Verifying global Cal tone consistency...');
        
        if (!actionData.action.includes('cal')) {
            return { valid: true, reason: 'Not a Cal-related action' };
        }
        
        const globalCalTone = this.truthAnchor.globalCalTone;
        const requestedTone = actionData.data?.tone;
        
        // Enterprise clients can have custom tones, but they must be compatible
        const compatibleTones = this.getCompatibleTones(globalCalTone);
        
        if (requestedTone && !compatibleTones.includes(requestedTone)) {
            return {
                valid: false,
                reason: `Cal tone incompatible with global setting: ${requestedTone} not in ${compatibleTones.join(', ')}`,
                globalTone: globalCalTone,
                requestedTone: requestedTone,
                compatibleTones: compatibleTones
            };
        }
        
        return {
            valid: true,
            globalTone: globalCalTone,
            requestedTone: requestedTone
        };
    }
    
    /**
     * Check for active reflection delays
     */
    async checkReflectionDelay(enterpriseVaultSig) {
        console.log('   ⏳ Checking reflection delay status...');
        
        if (this.reflectionDelays.has(enterpriseVaultSig)) {
            const delayData = this.reflectionDelays.get(enterpriseVaultSig);
            
            // Check if delay period has expired
            if (Date.now() < delayData.delayUntil) {
                return {
                    allowed: false,
                    reason: `Reflection delay active until ${new Date(delayData.delayUntil).toISOString()}`,
                    delayUntil: delayData.delayUntil,
                    failureCount: delayData.failureCount
                };
            } else {
                // Delay period has expired, remove it
                this.reflectionDelays.delete(enterpriseVaultSig);
                await this.saveReflectionDelays();
            }
        }
        
        return {
            allowed: true,
            reason: 'No active reflection delay'
        };
    }
    
    /**
     * Reject action and apply consequences
     */
    async rejectAction(validationSession, reason, details) {
        console.log(`   ❌ Validation rejected: ${reason}`);
        
        validationSession.status = 'rejected';
        validationSession.rejectionReason = reason;
        validationSession.rejectionDetails = details;
        
        // Update trust score (decrease for rejection)
        const newTrustScore = this.calculateUpdatedTrustScore(validationSession.enterpriseVaultSig, false);
        
        // Check if we need to trigger reflection delay
        await this.checkAndTriggerReflectionDelay(validationSession.enterpriseVaultSig);
        
        // Log rejected action
        await this.logRejectedValidation(validationSession);
        
        return {
            approved: false,
            validationId: validationSession.validationId,
            reason: reason,
            details: details,
            trustScore: newTrustScore,
            reflectionRequired: true
        };
    }
    
    /**
     * Check and trigger reflection delay if needed
     */
    async checkAndTriggerReflectionDelay(enterpriseVaultSig) {
        // Count recent failures
        const recentFailures = this.getRecentFailureCount(enterpriseVaultSig);
        
        if (recentFailures >= this.thresholds.reflectionDelayTrigger) {
            const delayDuration = this.calculateReflectionDelayDuration(recentFailures);
            const delayUntil = Date.now() + delayDuration;
            
            this.reflectionDelays.set(enterpriseVaultSig, {
                failureCount: recentFailures,
                delayUntil: delayUntil,
                triggeredAt: Date.now()
            });
            
            await this.saveReflectionDelays();
            
            console.log(`   ⏳ Reflection delay triggered for ${enterpriseVaultSig}: ${delayDuration / 60000} minutes`);
        }
    }
    
    /**
     * Load truth anchor configuration
     */
    async loadTruthAnchor() {
        const truthAnchorFile = path.join(this.configPath, 'truth-anchor.json');
        
        if (fs.existsSync(truthAnchorFile)) {
            this.truthAnchor = JSON.parse(fs.readFileSync(truthAnchorFile, 'utf8'));
        } else {
            // Create default truth anchor
            this.truthAnchor = {
                version: '1.0.0',
                rootSignature: this.generateRootSignature(),
                lastApprovedPlatformChangeHash: this.calculatePlatformChangeHash(),
                entropyCap: 0.005,
                forkVolumeQuota: 100,
                globalCalTone: 'reflective',
                createdAt: Date.now(),
                lastUpdated: Date.now()
            };
            
            if (!fs.existsSync(path.dirname(truthAnchorFile))) {
                fs.mkdirSync(path.dirname(truthAnchorFile), { recursive: true });
            }
            
            fs.writeFileSync(truthAnchorFile, JSON.stringify(this.truthAnchor, null, 2));
        }
        
        console.log('   ✅ Truth anchor loaded');
    }
    
    /**
     * Load validation history
     */
    async loadValidationHistory() {
        const historyFile = path.join(this.logsPath, 'witness-validations.json');
        
        if (fs.existsSync(historyFile)) {
            const historyData = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
            this.validationHistory = historyData.validations || [];
        }
    }
    
    /**
     * Load reflection delays
     */
    async loadReflectionDelays() {
        const delaysFile = path.join(this.logsPath, 'reflection-delays.json');
        
        if (fs.existsSync(delaysFile)) {
            const delaysData = JSON.parse(fs.readFileSync(delaysFile, 'utf8'));
            
            for (const [vaultSig, delayData] of Object.entries(delaysData.delays || {})) {
                this.reflectionDelays.set(vaultSig, delayData);
            }
        }
    }
    
    /**
     * Save reflection delays
     */
    async saveReflectionDelays() {
        const delaysFile = path.join(this.logsPath, 'reflection-delays.json');
        
        const delaysData = {
            version: '1.0.0',
            lastUpdated: Date.now(),
            delays: Object.fromEntries(this.reflectionDelays)
        };
        
        if (!fs.existsSync(path.dirname(delaysFile))) {
            fs.mkdirSync(path.dirname(delaysFile), { recursive: true });
        }
        
        fs.writeFileSync(delaysFile, JSON.stringify(delaysData, null, 2));
    }
    
    /**
     * Log successful validation
     */
    async logSuccessfulValidation(validationSession) {
        const validation = {
            ...validationSession,
            loggedAt: Date.now()
        };
        
        this.validationHistory.unshift(validation);
        
        // Keep only last 10,000 validations
        if (this.validationHistory.length > 10000) {
            this.validationHistory = this.validationHistory.slice(0, 10000);
        }
        
        await this.saveValidationHistory();
    }
    
    /**
     * Log rejected validation
     */
    async logRejectedValidation(validationSession) {
        const rejectedValidation = {
            ...validationSession,
            loggedAt: Date.now()
        };
        
        this.rejectedActions.unshift(rejectedValidation);
        
        // Save to rejected actions log
        const rejectedFile = path.join(this.logsPath, 'rejected-operator-events.json');
        let rejectedLog = { events: [] };
        
        if (fs.existsSync(rejectedFile)) {
            rejectedLog = JSON.parse(fs.readFileSync(rejectedFile, 'utf8'));
        }
        
        rejectedLog.events.unshift(rejectedValidation);
        
        if (!fs.existsSync(path.dirname(rejectedFile))) {
            fs.mkdirSync(path.dirname(rejectedFile), { recursive: true });
        }
        
        fs.writeFileSync(rejectedFile, JSON.stringify(rejectedLog, null, 2));
    }
    
    /**
     * Save validation history
     */
    async saveValidationHistory() {
        const historyFile = path.join(this.logsPath, 'witness-validations.json');
        
        const historyData = {
            version: '1.0.0',
            lastUpdated: Date.now(),
            totalValidations: this.validationHistory.length,
            validations: this.validationHistory
        };
        
        if (!fs.existsSync(path.dirname(historyFile))) {
            fs.mkdirSync(path.dirname(historyFile), { recursive: true });
        }
        
        fs.writeFileSync(historyFile, JSON.stringify(historyData, null, 2));
    }
    
    /**
     * Helper functions
     */
    generateValidationId() {
        return 'witness_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    }
    
    generateRootSignature() {
        return crypto.randomBytes(32).toString('hex');
    }
    
    calculateCurrentSignature() {
        // In real implementation, would calculate based on platform state
        return this.truthAnchor?.rootSignature || 'no_signature';
    }
    
    calculatePlatformChangeHash() {
        // In real implementation, would hash platform configuration
        return crypto.randomBytes(16).toString('hex');
    }
    
    async verifyPlatformChange(changeHash) {
        // In real implementation, would check approved changes list
        return true; // For now, assume all changes are approved
    }
    
    async calculateCurrentEntropy() {
        // Simulate entropy calculation
        return 0.003 + Math.random() * 0.002;
    }
    
    async getCurrentTrustScore(enterpriseVaultSig) {
        // Get trust score from enterprise vault configuration
        const recentValidations = this.validationHistory.filter(v => 
            v.enterpriseVaultSig === enterpriseVaultSig
        ).slice(0, 10);
        
        const successRate = recentValidations.length > 0 ? 
            recentValidations.filter(v => v.status === 'approved').length / recentValidations.length : 1.0;
        
        return Math.max(85.0, Math.min(99.9, 95.0 + (successRate - 0.9) * 50));
    }
    
    calculateUpdatedTrustScore(enterpriseVaultSig, successful) {
        // Simple trust score calculation
        const current = 98.7; // Would get from vault config
        const adjustment = successful ? 0.1 : -0.5;
        return Math.max(80.0, Math.min(99.9, current + adjustment));
    }
    
    getCompatibleTones(globalTone) {
        const compatibility = {
            'reflective': ['reflective', 'enterprise', 'neutral'],
            'strategic': ['strategic', 'enterprise', 'neutral'],
            'playful': ['playful', 'neutral'],
            'null': ['null', 'neutral']
        };
        
        return compatibility[globalTone] || ['neutral'];
    }
    
    getRecentFailureCount(enterpriseVaultSig) {
        const recent = this.rejectedActions.filter(action =>
            action.enterpriseVaultSig === enterpriseVaultSig &&
            Date.now() - action.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
        );
        
        return recent.length;
    }
    
    calculateReflectionDelayDuration(failureCount) {
        // Exponential backoff: 5 minutes, 15 minutes, 45 minutes, etc.
        return Math.min(5 * Math.pow(3, failureCount - 3) * 60 * 1000, 6 * 60 * 60 * 1000); // Max 6 hours
    }
    
    async getCurrentForkVolume(enterpriseVaultSig) {
        // Count recent forks for this vault
        const recentForks = this.validationHistory.filter(v =>
            v.enterpriseVaultSig === enterpriseVaultSig &&
            v.action.includes('fork') &&
            Date.now() - v.timestamp < 30 * 24 * 60 * 60 * 1000 // Last 30 days
        );
        
        return recentForks.length;
    }
    
    async getRecentTrustHistory(enterpriseVaultSig) {
        // Get recent trust score history
        return this.validationHistory.filter(v =>
            v.enterpriseVaultSig === enterpriseVaultSig
        ).slice(0, 20);
    }
    
    calculateTrustDegradation(history) {
        if (history.length < 2) return 0;
        
        // Simple degradation calculation
        const recent = history.slice(0, 5);
        const older = history.slice(5, 10);
        
        const recentAvg = recent.reduce((sum, v) => sum + (v.status === 'approved' ? 1 : 0), 0) / recent.length;
        const olderAvg = older.length > 0 ? older.reduce((sum, v) => sum + (v.status === 'approved' ? 1 : 0), 0) / older.length : recentAvg;
        
        return Math.max(0, (olderAvg - recentAvg) * 100);
    }
    
    generateWitnessSignature(validationSession) {
        const signatureInput = JSON.stringify({
            validationId: validationSession.validationId,
            requestId: validationSession.requestId,
            timestamp: validationSession.timestamp,
            status: validationSession.status
        });
        
        return crypto.createHash('sha256').update(signatureInput).digest('hex').substring(0, 16);
    }
}

module.exports = WitnessRouter;