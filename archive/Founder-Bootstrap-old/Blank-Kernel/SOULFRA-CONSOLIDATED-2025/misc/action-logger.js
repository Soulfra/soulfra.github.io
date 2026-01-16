/**
 * Action Logger with Witness Validation
 * 
 * Logs all enterprise console actions with cryptographic signatures.
 * Integrates with witness router for validation and audit trail.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ActionLogger {
    constructor() {
        this.logsPath = '../vault/logs';
        this.registryPath = '../registry';
        this.configPath = '../vault/config';
        
        // Logging state
        this.actionBuffer = [];
        this.witnessValidations = [];
        this.rejectedActions = [];
        
        // Logging configuration
        this.config = {
            bufferSize: 100,
            flushInterval: 30000, // 30 seconds
            compressionThreshold: 1000,
            integrityChecking: true,
            witnessValidationRequired: true
        };
        
        // Cryptographic keys for integrity
        this.signingKey = null;
        this.verificationKey = null;
        
        this.initializeActionLogger();
    }
    
    /**
     * Initialize action logger system
     */
    async initializeActionLogger() {
        console.log('📝 Initializing Action Logger with Witness Validation...');
        console.log('🔐 Cryptographic integrity and audit trail system');
        console.log('⚖️ Witness router validation integration');
        
        // Load or create cryptographic keys
        await this.initializeCryptographicKeys();
        
        // Load existing logs
        await this.loadExistingLogs();
        
        // Start periodic flush
        this.startPeriodicFlush();
        
        console.log('✅ Action Logger operational');
        console.log(`📊 ${this.witnessValidations.length} historical validations loaded`);
        console.log(`🚫 ${this.rejectedActions.length} rejected actions on record`);
    }
    
    /**
     * Log enterprise console action
     */
    async logAction(actionData, validationResult = null) {
        const timestamp = Date.now();
        const actionId = this.generateActionId();
        
        const logEntry = {
            actionId: actionId,
            timestamp: timestamp,
            requestId: actionData.requestId || this.generateRequestId(),
            action: actionData.action,
            enterpriseVaultSig: actionData.enterpriseVaultSig,
            data: actionData.data || actionData,
            userAgent: actionData.userAgent || 'enterprise-console',
            ipAddress: actionData.ipAddress || '127.0.0.1',
            sessionId: actionData.sessionId || 'console-session',
            
            // Validation information
            witnessed: validationResult ? validationResult.approved : false,
            validationId: validationResult?.validationId || null,
            witnessSignature: validationResult?.witnessSignature || null,
            trustScore: validationResult?.trustScore || null,
            
            // Action outcome
            status: this.determineActionStatus(actionData, validationResult),
            result: actionData.result || null,
            error: actionData.error || null,
            
            // Integrity
            integrityHash: null, // Will be calculated
            signature: null // Will be calculated
        };
        
        // Calculate integrity hash and signature
        logEntry.integrityHash = this.calculateIntegrityHash(logEntry);
        logEntry.signature = this.signLogEntry(logEntry);
        
        // Add to buffer
        this.actionBuffer.push(logEntry);
        
        // Immediate logging for critical actions
        if (this.isCriticalAction(actionData.action)) {
            await this.flushActionBuffer();
        }
        
        // Log to witness validation or rejected actions
        if (validationResult) {
            if (validationResult.approved) {
                await this.logWitnessValidation(logEntry, validationResult);
            } else {
                await this.logRejectedAction(logEntry, validationResult);
            }
        }
        
        console.log(`📝 Action logged: ${actionData.action} [${actionId}]`);
        
        return {
            logged: true,
            actionId: actionId,
            timestamp: timestamp,
            witnessed: logEntry.witnessed
        };
    }
    
    /**
     * Log witness validation
     */
    async logWitnessValidation(logEntry, validationResult) {
        const witnessLog = {
            validationId: validationResult.validationId,
            actionId: logEntry.actionId,
            requestId: logEntry.requestId,
            action: logEntry.action,
            enterpriseVaultSig: logEntry.enterpriseVaultSig,
            timestamp: logEntry.timestamp,
            
            // Validation details
            approved: true,
            trustScore: validationResult.trustScore,
            witnessSignature: validationResult.witnessSignature,
            validationResults: validationResult.validationResults,
            
            // Audit trail
            loggedAt: Date.now(),
            integrityVerified: true,
            auditSignature: this.generateAuditSignature(logEntry, validationResult)
        };
        
        this.witnessValidations.unshift(witnessLog);
        
        // Keep only last 10,000 validations
        if (this.witnessValidations.length > 10000) {
            this.witnessValidations = this.witnessValidations.slice(0, 10000);
        }
        
        await this.saveWitnessValidations();
    }
    
    /**
     * Log rejected action
     */
    async logRejectedAction(logEntry, validationResult) {
        const rejectedLog = {
            validationId: validationResult.validationId || this.generateValidationId(),
            actionId: logEntry.actionId,
            requestId: logEntry.requestId,
            action: logEntry.action,
            enterpriseVaultSig: logEntry.enterpriseVaultSig,
            timestamp: logEntry.timestamp,
            
            // Rejection details
            approved: false,
            reason: validationResult.reason,
            details: validationResult.details,
            trustScore: validationResult.trustScore,
            reflectionRequired: validationResult.reflectionRequired || false,
            
            // Audit trail
            loggedAt: Date.now(),
            severity: this.calculateRejectionSeverity(validationResult.reason),
            auditSignature: this.generateAuditSignature(logEntry, validationResult)
        };
        
        this.rejectedActions.unshift(rejectedLog);
        
        // Keep only last 1,000 rejected actions
        if (this.rejectedActions.length > 1000) {
            this.rejectedActions = this.rejectedActions.slice(0, 1000);
        }
        
        await this.saveRejectedActions();
        
        console.log(`🚫 Rejected action logged: ${logEntry.action} [${validationResult.reason}]`);
    }
    
    /**
     * Get action logs for enterprise console display
     */
    async getActionLogs(filters = {}) {
        const limit = filters.limit || 50;
        const action = filters.action;
        const enterpriseVaultSig = filters.enterpriseVaultSig;
        const timeRange = filters.timeRange || 24 * 60 * 60 * 1000; // 24 hours
        const status = filters.status; // 'approved', 'rejected', 'all'
        
        let logs = [];
        
        // Combine witness validations and rejected actions
        if (!status || status === 'approved' || status === 'all') {
            const approvedLogs = this.witnessValidations
                .filter(log => this.applyFilters(log, filters, timeRange))
                .map(log => ({
                    ...log,
                    displayStatus: 'Validated',
                    displayTimestamp: new Date(log.timestamp).toLocaleString(),
                    displayAction: this.formatActionForDisplay(log.action),
                    displayVault: log.enterpriseVaultSig?.substring(0, 12) + '...',
                    trustScoreDisplay: log.trustScore?.toFixed(1) + '%'
                }));
            
            logs = logs.concat(approvedLogs);
        }
        
        if (!status || status === 'rejected' || status === 'all') {
            const rejectedLogs = this.rejectedActions
                .filter(log => this.applyFilters(log, filters, timeRange))
                .map(log => ({
                    ...log,
                    displayStatus: 'Rejected',
                    displayTimestamp: new Date(log.timestamp).toLocaleString(),
                    displayAction: this.formatActionForDisplay(log.action),
                    displayVault: log.enterpriseVaultSig?.substring(0, 12) + '...',
                    displayReason: log.reason
                }));
            
            logs = logs.concat(rejectedLogs);
        }
        
        // Sort by timestamp (newest first)
        logs.sort((a, b) => b.timestamp - a.timestamp);
        
        return logs.slice(0, limit);
    }
    
    /**
     * Get validation statistics
     */
    async getValidationStatistics(timeRange = 24 * 60 * 60 * 1000) {
        const cutoffTime = Date.now() - timeRange;
        
        const recentValidations = this.witnessValidations.filter(v => v.timestamp >= cutoffTime);
        const recentRejections = this.rejectedActions.filter(r => r.timestamp >= cutoffTime);
        
        const totalActions = recentValidations.length + recentRejections.length;
        const successRate = totalActions > 0 ? (recentValidations.length / totalActions) * 100 : 100;
        
        const avgTrustScore = recentValidations.length > 0 ?
            recentValidations.reduce((sum, v) => sum + (v.trustScore || 0), 0) / recentValidations.length : 0;
        
        return {
            timeRange: timeRange,
            totalActions: totalActions,
            approvedActions: recentValidations.length,
            rejectedActions: recentRejections.length,
            successRate: Math.round(successRate * 10) / 10,
            averageTrustScore: Math.round(avgTrustScore * 10) / 10,
            witnessConsensusRate: this.calculateWitnessConsensusRate(recentValidations),
            topRejectionReasons: this.getTopRejectionReasons(recentRejections)
        };
    }
    
    /**
     * Flush action buffer to storage
     */
    async flushActionBuffer() {
        if (this.actionBuffer.length === 0) {
            return;
        }
        
        const actionsToFlush = [...this.actionBuffer];
        this.actionBuffer = [];
        
        // Write to action log file
        await this.writeActionsToLog(actionsToFlush);
        
        console.log(`💾 Flushed ${actionsToFlush.length} actions to log`);
    }
    
    /**
     * Write actions to log file
     */
    async writeActionsToLog(actions) {
        const logFile = path.join(this.logsPath, 'enterprise-console-actions.json');
        
        let existingLog = { actions: [] };
        
        if (fs.existsSync(logFile)) {
            existingLog = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        }
        
        // Add new actions
        existingLog.actions = actions.concat(existingLog.actions);
        
        // Keep only last 10,000 actions
        if (existingLog.actions.length > 10000) {
            existingLog.actions = existingLog.actions.slice(0, 10000);
        }
        
        existingLog.version = '1.0.0';
        existingLog.lastUpdated = Date.now();
        existingLog.totalActions = existingLog.actions.length;
        
        if (!fs.existsSync(path.dirname(logFile))) {
            fs.mkdirSync(path.dirname(logFile), { recursive: true });
        }
        
        fs.writeFileSync(logFile, JSON.stringify(existingLog, null, 2));
    }
    
    /**
     * Save witness validations
     */
    async saveWitnessValidations() {
        const validationsFile = path.join(this.logsPath, 'witness-validations.json');
        
        const validationsData = {
            version: '1.0.0',
            lastUpdated: Date.now(),
            totalValidations: this.witnessValidations.length,
            validations: this.witnessValidations
        };
        
        if (!fs.existsSync(path.dirname(validationsFile))) {
            fs.mkdirSync(path.dirname(validationsFile), { recursive: true });
        }
        
        fs.writeFileSync(validationsFile, JSON.stringify(validationsData, null, 2));
    }
    
    /**
     * Save rejected actions
     */
    async saveRejectedActions() {
        const rejectedFile = path.join(this.logsPath, 'rejected-operator-events.json');
        
        const rejectedData = {
            version: '1.0.0',
            lastUpdated: Date.now(),
            totalRejections: this.rejectedActions.length,
            events: this.rejectedActions
        };
        
        if (!fs.existsSync(path.dirname(rejectedFile))) {
            fs.mkdirSync(path.dirname(rejectedFile), { recursive: true });
        }
        
        fs.writeFileSync(rejectedFile, JSON.stringify(rejectedData, null, 2));
    }
    
    /**
     * Initialize cryptographic keys
     */
    async initializeCryptographicKeys() {
        const keyFile = path.join(this.configPath, 'action-logger-keys.json');
        
        if (fs.existsSync(keyFile)) {
            const keyData = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
            this.signingKey = keyData.signingKey;
            this.verificationKey = keyData.verificationKey;
        } else {
            // Generate new keys
            this.signingKey = crypto.randomBytes(32).toString('hex');
            this.verificationKey = crypto.randomBytes(32).toString('hex');
            
            const keyData = {
                signingKey: this.signingKey,
                verificationKey: this.verificationKey,
                createdAt: Date.now()
            };
            
            if (!fs.existsSync(path.dirname(keyFile))) {
                fs.mkdirSync(path.dirname(keyFile), { recursive: true });
            }
            
            fs.writeFileSync(keyFile, JSON.stringify(keyData, null, 2));
        }
    }
    
    /**
     * Load existing logs
     */
    async loadExistingLogs() {
        // Load witness validations
        const validationsFile = path.join(this.logsPath, 'witness-validations.json');
        if (fs.existsSync(validationsFile)) {
            const validationsData = JSON.parse(fs.readFileSync(validationsFile, 'utf8'));
            this.witnessValidations = validationsData.validations || [];
        }
        
        // Load rejected actions
        const rejectedFile = path.join(this.logsPath, 'rejected-operator-events.json');
        if (fs.existsSync(rejectedFile)) {
            const rejectedData = JSON.parse(fs.readFileSync(rejectedFile, 'utf8'));
            this.rejectedActions = rejectedData.events || [];
        }
    }
    
    /**
     * Start periodic flush
     */
    startPeriodicFlush() {
        setInterval(async () => {
            await this.flushActionBuffer();
        }, this.config.flushInterval);
    }
    
    /**
     * Helper functions
     */
    generateActionId() {
        return 'action_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    }
    
    generateRequestId() {
        return 'req_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    }
    
    generateValidationId() {
        return 'validation_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    }
    
    calculateIntegrityHash(logEntry) {
        const hashInput = JSON.stringify({
            actionId: logEntry.actionId,
            timestamp: logEntry.timestamp,
            action: logEntry.action,
            enterpriseVaultSig: logEntry.enterpriseVaultSig,
            data: logEntry.data
        });
        
        return crypto.createHash('sha256').update(hashInput).digest('hex');
    }
    
    signLogEntry(logEntry) {
        const signatureInput = logEntry.integrityHash + this.signingKey;
        return crypto.createHash('sha256').update(signatureInput).digest('hex').substring(0, 16);
    }
    
    generateAuditSignature(logEntry, validationResult) {
        const auditInput = JSON.stringify({
            actionId: logEntry.actionId,
            validationId: validationResult.validationId,
            timestamp: logEntry.timestamp,
            status: validationResult.approved
        });
        
        return crypto.createHash('sha256').update(auditInput + this.signingKey).digest('hex').substring(0, 16);
    }
    
    determineActionStatus(actionData, validationResult) {
        if (!validationResult) return 'pending';
        if (validationResult.approved) return 'completed';
        return 'rejected';
    }
    
    isCriticalAction(action) {
        const criticalActions = [
            'platform_lockdown',
            'emergency_stop',
            'cal_sovereign_escalation',
            'witness_router_override'
        ];
        
        return criticalActions.includes(action);
    }
    
    calculateRejectionSeverity(reason) {
        const severityMap = {
            'truth_anchor_failure': 'critical',
            'entropy_drift_exceeded': 'high',
            'trust_score_insufficient': 'medium',
            'fork_volume_exceeded': 'medium',
            'cal_tone_inconsistency': 'low',
            'reflection_delay_active': 'low'
        };
        
        return severityMap[reason] || 'medium';
    }
    
    applyFilters(log, filters, timeRange) {
        const cutoffTime = Date.now() - timeRange;
        
        if (log.timestamp < cutoffTime) return false;
        if (filters.action && log.action !== filters.action) return false;
        if (filters.enterpriseVaultSig && log.enterpriseVaultSig !== filters.enterpriseVaultSig) return false;
        
        return true;
    }
    
    formatActionForDisplay(action) {
        const actionMap = {
            'fork_platform': 'Fork Platform',
            'bless_agent': 'Bless Agent',
            'deploy_cal_instance': 'Deploy Cal',
            'export_agent': 'Export Agent',
            'update_pricing': 'Update Pricing',
            'cal_tone': 'Cal Tone',
            'export_lock': 'Export Lock',
            'generate_dashboard': 'Generate Dashboard',
            'push_ui_update': 'Push UI Update',
            'platform_sync': 'Platform Sync'
        };
        
        return actionMap[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    calculateWitnessConsensusRate(validations) {
        if (validations.length === 0) return 100.0;
        
        const consensusValidations = validations.filter(v => v.witnessSignature);
        return Math.round((consensusValidations.length / validations.length) * 1000) / 10;
    }
    
    getTopRejectionReasons(rejections) {
        const reasonCounts = {};
        
        rejections.forEach(r => {
            reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1;
        });
        
        return Object.entries(reasonCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([reason, count]) => ({ reason, count }));
    }
}

module.exports = ActionLogger;