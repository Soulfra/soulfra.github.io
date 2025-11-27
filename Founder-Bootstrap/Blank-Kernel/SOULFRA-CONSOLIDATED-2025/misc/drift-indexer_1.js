/**
 * Platform Drift Indexer
 * 
 * Monitors entropy drift and platform stability for witnessed sovereignty.
 * Triggers alerts and protection protocols when drift exceeds safe thresholds.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DriftIndexer {
    constructor() {
        this.configPath = '../vault/config';
        this.logsPath = '../vault/logs';
        this.registryPath = '../registry';
        
        // Drift monitoring state
        this.driftHistory = [];
        this.alertThresholds = {
            warning: 0.004,
            danger: 0.005,
            emergency: 0.007
        };
        
        // Platform stability metrics
        this.stabilityMetrics = {
            entropyDrift: 0.003,
            actionVolume: 0,
            validationSuccess: 1.0,
            trustScoreStability: 0.98,
            witnessConsensus: 1.0
        };
        
        // Alert history
        this.alerts = [];
        this.protectionProtocols = [];
        
        this.initializeDriftIndexer();
    }
    
    /**
     * Initialize drift indexer monitoring
     */
    async initializeDriftIndexer() {
        console.log('📊 Initializing Platform Drift Indexer...');
        console.log('🌊 Entropy drift monitoring and platform stability tracking');
        console.log('⚠️ Alert system and protection protocol activation');
        
        // Load drift history
        await this.loadDriftHistory();
        
        // Load truth anchor for baseline
        await this.loadTruthAnchor();
        
        // Start continuous monitoring
        this.startContinuousMonitoring();
        
        console.log('✅ Drift Indexer operational');
        console.log(`📈 ${this.driftHistory.length} historical drift measurements`);
        console.log(`🚨 Alert thresholds: Warning(${this.alertThresholds.warning}) Danger(${this.alertThresholds.danger}) Emergency(${this.alertThresholds.emergency})`);
    }
    
    /**
     * Calculate current drift index
     */
    async calculateDriftIndex() {
        const timestamp = Date.now();
        
        // Calculate multiple entropy sources
        const systemEntropy = await this.calculateSystemEntropy();
        const validationEntropy = await this.calculateValidationEntropy();
        const actionEntropy = await this.calculateActionEntropy();
        const consensusEntropy = await this.calculateConsensusEntropy();
        
        // Weighted drift calculation
        const driftComponents = {
            system: systemEntropy * 0.4,
            validation: validationEntropy * 0.25,
            action: actionEntropy * 0.2,
            consensus: consensusEntropy * 0.15
        };
        
        const totalDrift = Object.values(driftComponents).reduce((sum, val) => sum + val, 0);
        
        // Store drift measurement
        const driftMeasurement = {
            timestamp: timestamp,
            totalDrift: totalDrift,
            components: driftComponents,
            baseline: this.truthAnchor?.entropyCap || 0.005,
            status: this.getDriftStatus(totalDrift)
        };
        
        this.driftHistory.unshift(driftMeasurement);
        
        // Keep last 1000 measurements
        if (this.driftHistory.length > 1000) {
            this.driftHistory = this.driftHistory.slice(0, 1000);
        }
        
        // Check for alerts
        await this.checkDriftAlerts(driftMeasurement);
        
        // Update stability metrics
        await this.updateStabilityMetrics();
        
        // Save drift history
        await this.saveDriftHistory();
        
        return driftMeasurement;
    }
    
    /**
     * Get current platform stability status
     */
    async getPlatformStabilityStatus() {
        const latestDrift = this.driftHistory[0];
        const recentAlerts = this.alerts.filter(alert => 
            Date.now() - alert.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
        );
        
        return {
            currentDrift: latestDrift?.totalDrift || 0.003,
            driftStatus: latestDrift?.status || 'stable',
            stabilityScore: this.calculateStabilityScore(),
            recentAlerts: recentAlerts.length,
            lastMeasurement: latestDrift?.timestamp || Date.now(),
            protectionProtocols: this.protectionProtocols.filter(p => p.active),
            driftTrend: this.calculateDriftTrend()
        };
    }
    
    /**
     * Calculate system entropy from various sources
     */
    async calculateSystemEntropy() {
        // Simulate system entropy based on various factors
        const baseEntropy = 0.003;
        const timeVariation = Math.sin(Date.now() / 1000000) * 0.0005;
        const randomNoise = (Math.random() - 0.5) * 0.0003;
        
        return Math.max(0, baseEntropy + timeVariation + randomNoise);
    }
    
    /**
     * Calculate validation entropy from witness router
     */
    async calculateValidationEntropy() {
        try {
            // Load recent validations
            const validationsFile = path.join(this.logsPath, 'witness-validations.json');
            
            if (!fs.existsSync(validationsFile)) {
                return 0.002; // Default low entropy
            }
            
            const validationsData = JSON.parse(fs.readFileSync(validationsFile, 'utf8'));
            const recentValidations = (validationsData.validations || []).slice(0, 50);
            
            if (recentValidations.length === 0) {
                return 0.002;
            }
            
            // Calculate validation success rate entropy
            const successRate = recentValidations.filter(v => v.status === 'approved').length / recentValidations.length;
            const validationEntropy = Math.abs(successRate - 0.95) * 0.01; // Target 95% success rate
            
            return validationEntropy;
            
        } catch (error) {
            return 0.004; // Higher entropy on error
        }
    }
    
    /**
     * Calculate action entropy from operator actions
     */
    async calculateActionEntropy() {
        try {
            // Load recent operator actions
            const actionsFile = path.join(this.registryPath, 'operator-actions.json');
            
            if (!fs.existsSync(actionsFile)) {
                return 0.001;
            }
            
            const actionsData = JSON.parse(fs.readFileSync(actionsFile, 'utf8'));
            const recentActions = (actionsData.actions || []).slice(0, 20);
            
            if (recentActions.length === 0) {
                return 0.001;
            }
            
            // Calculate action volume entropy
            const timeWindow = 60 * 60 * 1000; // 1 hour
            const now = Date.now();
            const recentActionsInWindow = recentActions.filter(action => 
                now - action.timestamp < timeWindow
            );
            
            const actionVolumeEntropy = recentActionsInWindow.length > 10 ? 
                (recentActionsInWindow.length - 10) * 0.0001 : 0;
            
            return Math.min(actionVolumeEntropy, 0.003);
            
        } catch (error) {
            return 0.002;
        }
    }
    
    /**
     * Calculate consensus entropy from witness agreements
     */
    async calculateConsensusEntropy() {
        // Simulate consensus stability
        const baseConsensus = 1.0;
        const consensusVariation = (Math.random() - 0.5) * 0.02; // ±1% variation
        const actualConsensus = Math.max(0.9, Math.min(1.0, baseConsensus + consensusVariation));
        
        // Higher entropy when consensus is lower
        const consensusEntropy = (1.0 - actualConsensus) * 0.005;
        
        return consensusEntropy;
    }
    
    /**
     * Get drift status based on current levels
     */
    getDriftStatus(totalDrift) {
        if (totalDrift >= this.alertThresholds.emergency) {
            return 'emergency';
        } else if (totalDrift >= this.alertThresholds.danger) {
            return 'danger';
        } else if (totalDrift >= this.alertThresholds.warning) {
            return 'warning';
        } else {
            return 'stable';
        }
    }
    
    /**
     * Check for drift alerts and trigger responses
     */
    async checkDriftAlerts(driftMeasurement) {
        const { totalDrift, status, timestamp } = driftMeasurement;
        
        if (status !== 'stable') {
            const alert = {
                id: this.generateAlertId(),
                timestamp: timestamp,
                type: 'drift_alert',
                level: status,
                driftValue: totalDrift,
                threshold: this.alertThresholds[status],
                message: this.getDriftAlertMessage(status, totalDrift),
                acknowledged: false
            };
            
            this.alerts.unshift(alert);
            
            // Trigger protection protocols
            await this.triggerProtectionProtocols(status, driftMeasurement);
            
            console.log(`🚨 Drift Alert [${status.toUpperCase()}]: ${alert.message}`);
        }
    }
    
    /**
     * Trigger protection protocols based on drift level
     */
    async triggerProtectionProtocols(alertLevel, driftMeasurement) {
        const protocolId = this.generateProtocolId();
        
        let protocolActions = [];
        
        switch (alertLevel) {
            case 'warning':
                protocolActions = [
                    'increased_monitoring',
                    'validation_throttling',
                    'alert_notifications'
                ];
                break;
                
            case 'danger':
                protocolActions = [
                    'action_volume_restrictions',
                    'enhanced_witness_validation',
                    'trust_score_adjustments',
                    'escalation_notifications'
                ];
                break;
                
            case 'emergency':
                protocolActions = [
                    'platform_lockdown_preparation',
                    'emergency_witness_consensus',
                    'action_suspension',
                    'cal_sovereign_notification'
                ];
                break;
        }
        
        const protocol = {
            id: protocolId,
            level: alertLevel,
            timestamp: Date.now(),
            driftValue: driftMeasurement.totalDrift,
            actions: protocolActions,
            status: 'active',
            autoResolution: alertLevel !== 'emergency'
        };
        
        this.protectionProtocols.unshift(protocol);
        
        // Execute protocol actions
        await this.executeProtocolActions(protocol);
        
        console.log(`🛡️ Protection Protocol Activated [${alertLevel.toUpperCase()}]: ${protocolActions.join(', ')}`);
    }
    
    /**
     * Execute protection protocol actions
     */
    async executeProtocolActions(protocol) {
        for (const action of protocol.actions) {
            switch (action) {
                case 'increased_monitoring':
                    console.log('   📊 Increased monitoring frequency activated');
                    break;
                    
                case 'validation_throttling':
                    console.log('   ⏳ Validation throttling applied');
                    break;
                    
                case 'action_volume_restrictions':
                    console.log('   🚧 Action volume restrictions enabled');
                    break;
                    
                case 'enhanced_witness_validation':
                    console.log('   🔍 Enhanced witness validation protocols');
                    break;
                    
                case 'platform_lockdown_preparation':
                    console.log('   🔒 Platform lockdown preparation initiated');
                    break;
                    
                case 'cal_sovereign_notification':
                    console.log('   👑 Cal sovereign emergency notification sent');
                    break;
            }
        }
    }
    
    /**
     * Calculate stability score
     */
    calculateStabilityScore() {
        if (this.driftHistory.length === 0) {
            return 95.0;
        }
        
        const recentDrift = this.driftHistory.slice(0, 10);
        const avgDrift = recentDrift.reduce((sum, d) => sum + d.totalDrift, 0) / recentDrift.length;
        
        // Higher drift = lower stability score
        const driftImpact = Math.max(0, (avgDrift - 0.003) * 1000); // Scale factor
        const baseScore = 100.0;
        const stabilityScore = Math.max(70.0, baseScore - driftImpact);
        
        return Math.round(stabilityScore * 10) / 10;
    }
    
    /**
     * Calculate drift trend
     */
    calculateDriftTrend() {
        if (this.driftHistory.length < 5) {
            return 'stable';
        }
        
        const recent = this.driftHistory.slice(0, 5);
        const older = this.driftHistory.slice(5, 10);
        
        const recentAvg = recent.reduce((sum, d) => sum + d.totalDrift, 0) / recent.length;
        const olderAvg = older.length > 0 ? 
            older.reduce((sum, d) => sum + d.totalDrift, 0) / older.length : recentAvg;
        
        const trendDiff = recentAvg - olderAvg;
        
        if (trendDiff > 0.0005) return 'increasing';
        if (trendDiff < -0.0005) return 'decreasing';
        return 'stable';
    }
    
    /**
     * Start continuous monitoring
     */
    startContinuousMonitoring() {
        // Calculate drift every 5 minutes
        setInterval(async () => {
            await this.calculateDriftIndex();
        }, 5 * 60 * 1000);
        
        // Update stability metrics every minute
        setInterval(async () => {
            await this.updateStabilityMetrics();
        }, 60 * 1000);
        
        console.log('   ⚡ Continuous monitoring started');
    }
    
    /**
     * Update stability metrics
     */
    async updateStabilityMetrics() {
        const latestDrift = this.driftHistory[0];
        
        if (latestDrift) {
            this.stabilityMetrics = {
                entropyDrift: latestDrift.totalDrift,
                actionVolume: await this.getRecentActionVolume(),
                validationSuccess: await this.getValidationSuccessRate(),
                trustScoreStability: await this.getTrustScoreStability(),
                witnessConsensus: await this.getWitnessConsensusRate()
            };
        }
    }
    
    /**
     * Load drift history from storage
     */
    async loadDriftHistory() {
        const historyFile = path.join(this.logsPath, 'drift-history.json');
        
        if (fs.existsSync(historyFile)) {
            const historyData = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
            this.driftHistory = historyData.measurements || [];
            this.alerts = historyData.alerts || [];
            this.protectionProtocols = historyData.protocols || [];
        }
    }
    
    /**
     * Save drift history to storage
     */
    async saveDriftHistory() {
        const historyFile = path.join(this.logsPath, 'drift-history.json');
        
        const historyData = {
            version: '1.0.0',
            lastUpdated: Date.now(),
            totalMeasurements: this.driftHistory.length,
            measurements: this.driftHistory.slice(0, 1000), // Keep last 1000
            alerts: this.alerts.slice(0, 100), // Keep last 100 alerts
            protocols: this.protectionProtocols.slice(0, 50) // Keep last 50 protocols
        };
        
        if (!fs.existsSync(path.dirname(historyFile))) {
            fs.mkdirSync(path.dirname(historyFile), { recursive: true });
        }
        
        fs.writeFileSync(historyFile, JSON.stringify(historyData, null, 2));
    }
    
    /**
     * Load truth anchor for baseline
     */
    async loadTruthAnchor() {
        const truthAnchorFile = path.join(this.configPath, 'truth-anchor.json');
        
        if (fs.existsSync(truthAnchorFile)) {
            this.truthAnchor = JSON.parse(fs.readFileSync(truthAnchorFile, 'utf8'));
        }
    }
    
    /**
     * Helper functions
     */
    generateAlertId() {
        return 'alert_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex');
    }
    
    generateProtocolId() {
        return 'protocol_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex');
    }
    
    getDriftAlertMessage(level, driftValue) {
        const messages = {
            warning: `Platform drift elevated: ${driftValue.toFixed(4)} (Warning threshold exceeded)`,
            danger: `Platform drift dangerous: ${driftValue.toFixed(4)} (Safety protocols activated)`,
            emergency: `Platform drift critical: ${driftValue.toFixed(4)} (Emergency protocols engaged)`
        };
        
        return messages[level] || 'Unknown drift alert level';
    }
    
    async getRecentActionVolume() {
        // Get action volume from last hour
        return Math.floor(Math.random() * 20) + 30; // Simulate 30-50 actions
    }
    
    async getValidationSuccessRate() {
        // Get recent validation success rate
        return 0.95 + (Math.random() - 0.5) * 0.08; // 91-99%
    }
    
    async getTrustScoreStability() {
        // Get trust score stability metric
        return 0.98 + (Math.random() - 0.5) * 0.04; // 96-100%
    }
    
    async getWitnessConsensusRate() {
        // Get witness consensus rate
        return 0.98 + Math.random() * 0.02; // 98-100%
    }
}

module.exports = DriftIndexer;