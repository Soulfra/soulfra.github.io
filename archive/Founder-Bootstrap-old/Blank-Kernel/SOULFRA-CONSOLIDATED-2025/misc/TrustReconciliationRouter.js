#!/usr/bin/env node

/**
 * TrustReconciliationRouter.js
 * Validates external events through Cal before accepting into the vault
 * Implements trust verification and quarantine logic
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

class TrustReconciliationRouter {
    constructor() {
        this.vaultPath = path.join(__dirname, '../../../');
        this.logsPath = path.join(this.vaultPath, 'logs');
        this.confirmedPath = path.join(this.vaultPath, 'confirmed-events');
        this.quarantinePath = path.join(this.vaultPath, 'quarantine');
        
        // Log paths
        this.eventLogPath = path.join(this.logsPath, 'external-event-log.json');
        this.trustLogPath = path.join(this.logsPath, 'trust-verification.json');
        this.calQueuePath = path.join(this.logsPath, 'cal-input-queue.json');
        
        // Trust policies
        this.trustPolicies = {
            webhook: { requiresSignature: true, maxAge: 300000 }, // 5 minutes
            notion: { requiresAuth: true, allowedActions: ['created', 'updated'] },
            discord: { requiresMention: false, trustedUsers: [] },
            calendar: { futureEventsOnly: true, maxDaysAhead: 30 },
            email: { trustedDomains: [], requiresCommand: false },
            api: { requiresApiKey: true, rateLimit: 100 },
            ifttt: { trustedTriggers: [], maxPayloadSize: 10240 }
        };
        
        // Processing state
        this.processing = false;
        this.processedEvents = new Set();
        
        this.initialize();
    }
    
    initialize() {
        // Create directories
        [this.confirmedPath, this.quarantinePath].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
        
        // Initialize trust log
        if (!fs.existsSync(this.trustLogPath)) {
            fs.writeFileSync(this.trustLogPath, JSON.stringify({
                router_id: `trust_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
                created: new Date().toISOString(),
                policies: this.trustPolicies,
                verifications: []
            }, null, 2));
        }
    }
    
    /**
     * Main processing loop
     */
    async processEvents() {
        if (this.processing) return;
        this.processing = true;
        
        try {
            // Load external events
            if (!fs.existsSync(this.eventLogPath)) {
                return;
            }
            
            const eventLog = JSON.parse(fs.readFileSync(this.eventLogPath, 'utf8'));
            const pendingEvents = eventLog.events.filter(e => 
                e.processing.status === 'pending' && 
                !this.processedEvents.has(e.id)
            );
            
            console.log(`🔍 Processing ${pendingEvents.length} pending events`);
            
            for (const event of pendingEvents) {
                await this.verifyEvent(event);
                this.processedEvents.add(event.id);
                
                // Update event status
                event.processing.status = 'processed';
                event.processing.processed_at = Date.now();
            }
            
            // Save updated event log
            fs.writeFileSync(this.eventLogPath, JSON.stringify(eventLog, null, 2));
            
        } finally {
            this.processing = false;
        }
    }
    
    /**
     * Verify individual event
     */
    async verifyEvent(event) {
        console.log(`🛡️  Verifying event: ${event.id} (${event.source}/${event.type})`);
        
        const verification = {
            id: `verify_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            eventId: event.id,
            timestamp: Date.now(),
            source: event.source,
            type: event.type,
            checks: {},
            decision: null,
            reason: null
        };
        
        // Run trust checks based on source
        const trustChecks = await this.runTrustChecks(event);
        verification.checks = trustChecks;
        
        // Check if event passes basic trust requirements
        const basicTrust = this.evaluateBasicTrust(trustChecks);
        
        if (!basicTrust.passed) {
            verification.decision = 'quarantine';
            verification.reason = basicTrust.reason;
            await this.quarantineEvent(event, verification);
        } else {
            // Send to Cal for deep verification
            const calDecision = await this.verifyWithCal(event);
            verification.calVerification = calDecision;
            
            if (calDecision.approved) {
                verification.decision = 'confirmed';
                verification.reason = 'Cal approved';
                await this.confirmEvent(event, verification);
            } else {
                verification.decision = 'quarantine';
                verification.reason = calDecision.reason || 'Cal rejected';
                await this.quarantineEvent(event, verification);
            }
        }
        
        // Log verification
        await this.logVerification(verification);
    }
    
    /**
     * Run trust checks based on event source
     */
    async runTrustChecks(event) {
        const checks = {
            timestamp_valid: true,
            source_trusted: true,
            payload_valid: true,
            policy_compliant: true
        };
        
        // Check event age
        const eventAge = Date.now() - event.timestamp;
        const policy = this.trustPolicies[event.source] || {};
        
        if (policy.maxAge && eventAge > policy.maxAge) {
            checks.timestamp_valid = false;
            checks.timestamp_reason = `Event too old: ${eventAge}ms > ${policy.maxAge}ms`;
        }
        
        // Source-specific checks
        switch (event.source) {
            case 'webhook':
                if (policy.requiresSignature && !event.metadata?.headers?.['x-webhook-signature']) {
                    checks.source_trusted = false;
                    checks.source_reason = 'Missing webhook signature';
                }
                break;
                
            case 'notion':
                if (policy.allowedActions && !policy.allowedActions.includes(event.data?.action)) {
                    checks.policy_compliant = false;
                    checks.policy_reason = `Action not allowed: ${event.data?.action}`;
                }
                break;
                
            case 'discord':
                if (policy.requiresMention && event.type !== 'mention') {
                    checks.policy_compliant = false;
                    checks.policy_reason = 'Bot mention required';
                }
                break;
                
            case 'calendar':
                if (policy.futureEventsOnly && event.data?.start) {
                    const eventTime = new Date(event.data.start).getTime();
                    if (eventTime < Date.now()) {
                        checks.policy_compliant = false;
                        checks.policy_reason = 'Past events not allowed';
                    }
                }
                break;
                
            case 'email':
                if (policy.trustedDomains.length > 0) {
                    const fromDomain = event.data?.from?.split('@')[1];
                    if (!policy.trustedDomains.includes(fromDomain)) {
                        checks.source_trusted = false;
                        checks.source_reason = `Untrusted domain: ${fromDomain}`;
                    }
                }
                break;
                
            case 'api':
                if (policy.requiresApiKey && !event.metadata?.api_key_id) {
                    checks.source_trusted = false;
                    checks.source_reason = 'API key required';
                }
                break;
                
            case 'ifttt':
                const payloadSize = JSON.stringify(event.data).length;
                if (policy.maxPayloadSize && payloadSize > policy.maxPayloadSize) {
                    checks.payload_valid = false;
                    checks.payload_reason = `Payload too large: ${payloadSize} bytes`;
                }
                break;
        }
        
        // Validate payload structure
        if (!event.data || typeof event.data !== 'object') {
            checks.payload_valid = false;
            checks.payload_reason = 'Invalid payload structure';
        }
        
        return checks;
    }
    
    /**
     * Evaluate basic trust from checks
     */
    evaluateBasicTrust(checks) {
        const failed = [];
        
        for (const [check, result] of Object.entries(checks)) {
            if (result === false) {
                failed.push(check);
            }
        }
        
        if (failed.length > 0) {
            return {
                passed: false,
                reason: `Failed checks: ${failed.join(', ')}`
            };
        }
        
        return { passed: true };
    }
    
    /**
     * Verify with Cal
     */
    async verifyWithCal(event) {
        // First check if Cal is available
        const calAvailable = await this.isCalAvailable();
        
        if (!calAvailable) {
            // Fallback decision based on priority
            if (event.priority === 'high') {
                return { approved: true, reason: 'High priority - Cal unavailable' };
            }
            return { approved: false, reason: 'Cal unavailable for verification' };
        }
        
        // Create Cal verification request
        const calRequest = {
            type: 'trust_verification',
            event: event,
            timestamp: Date.now(),
            router: 'trust_reconciliation'
        };
        
        // Write to Cal queue
        let queue = { events: [] };
        if (fs.existsSync(this.calQueuePath)) {
            queue = JSON.parse(fs.readFileSync(this.calQueuePath, 'utf8'));
        }
        
        queue.events.push(calRequest);
        fs.writeFileSync(this.calQueuePath, JSON.stringify(queue, null, 2));
        
        // Simulate Cal processing (in real system, Cal would write response)
        const calResponse = await this.simulateCalDecision(event);
        
        return calResponse;
    }
    
    /**
     * Check if Cal is available
     */
    async isCalAvailable() {
        const calPaths = [
            path.join(this.vaultPath, '../cal-riven-operator.js'),
            path.join(this.vaultPath, '../mirror/cal-runtime.js')
        ];
        
        return calPaths.some(p => fs.existsSync(p));
    }
    
    /**
     * Simulate Cal's decision logic
     */
    async simulateCalDecision(event) {
        // Cal's trust logic would consider:
        // 1. Event source reputation
        // 2. Content analysis
        // 3. Pattern matching with previous events
        // 4. User intent alignment
        
        const decision = {
            approved: true,
            confidence: 0,
            reason: null
        };
        
        // Source trust scores
        const sourceTrust = {
            webhook: 0.7,
            notion: 0.9,
            discord: 0.6,
            calendar: 0.95,
            email: 0.8,
            api: 0.75,
            ifttt: 0.65
        };
        
        decision.confidence = sourceTrust[event.source] || 0.5;
        
        // Adjust based on content
        const eventString = JSON.stringify(event.data).toLowerCase();
        
        // Positive indicators
        if (eventString.includes('create') || eventString.includes('schedule')) {
            decision.confidence += 0.1;
        }
        
        // Negative indicators
        if (eventString.includes('delete') || eventString.includes('remove')) {
            decision.confidence -= 0.2;
        }
        
        // Priority boost
        if (event.priority === 'high') {
            decision.confidence += 0.15;
        }
        
        // Make decision
        decision.approved = decision.confidence > 0.6;
        decision.reason = decision.approved ? 
            `Confidence: ${(decision.confidence * 100).toFixed(0)}%` :
            `Low confidence: ${(decision.confidence * 100).toFixed(0)}%`;
        
        return decision;
    }
    
    /**
     * Confirm event - move to confirmed vault
     */
    async confirmEvent(event, verification) {
        console.log(`✅ Event confirmed: ${event.id}`);
        
        const confirmedEvent = {
            ...event,
            verification: verification,
            confirmed_at: Date.now(),
            vault_path: `confirmed-events/${event.source}/${event.id}.json`
        };
        
        // Create source directory
        const sourceDir = path.join(this.confirmedPath, event.source);
        if (!fs.existsSync(sourceDir)) {
            fs.mkdirSync(sourceDir, { recursive: true });
        }
        
        // Write confirmed event
        const eventPath = path.join(sourceDir, `${event.id}.json`);
        fs.writeFileSync(eventPath, JSON.stringify(confirmedEvent, null, 2));
        
        // Create reflection in vault
        await this.createReflection(confirmedEvent);
    }
    
    /**
     * Quarantine event - move to quarantine vault
     */
    async quarantineEvent(event, verification) {
        console.log(`🚫 Event quarantined: ${event.id} - ${verification.reason}`);
        
        const quarantinedEvent = {
            ...event,
            verification: verification,
            quarantined_at: Date.now(),
            vault_path: `quarantine/${event.source}/${event.id}.json`
        };
        
        // Create source directory
        const sourceDir = path.join(this.quarantinePath, event.source);
        if (!fs.existsSync(sourceDir)) {
            fs.mkdirSync(sourceDir, { recursive: true });
        }
        
        // Write quarantined event
        const eventPath = path.join(sourceDir, `${event.id}.json`);
        fs.writeFileSync(eventPath, JSON.stringify(quarantinedEvent, null, 2));
    }
    
    /**
     * Create reflection for confirmed event
     */
    async createReflection(event) {
        const reflectionPath = path.join(this.logsPath, 'reflection-activity.json');
        let reflection = { sessions: [] };
        
        if (fs.existsSync(reflectionPath)) {
            reflection = JSON.parse(fs.readFileSync(reflectionPath, 'utf8'));
        }
        
        reflection.sessions.push({
            id: event.id,
            type: 'external_event',
            source: event.source,
            timestamp: event.confirmed_at,
            data: {
                event_type: event.type,
                priority: event.priority,
                confidence: event.verification.calVerification?.confidence
            }
        });
        
        reflection.last_external_event = event.confirmed_at;
        
        fs.writeFileSync(reflectionPath, JSON.stringify(reflection, null, 2));
    }
    
    /**
     * Log verification result
     */
    async logVerification(verification) {
        const trustLog = JSON.parse(fs.readFileSync(this.trustLogPath, 'utf8'));
        
        trustLog.verifications.push(verification);
        trustLog.last_verification = new Date().toISOString();
        
        // Update statistics
        if (!trustLog.statistics) {
            trustLog.statistics = {
                total: 0,
                confirmed: 0,
                quarantined: 0,
                by_source: {}
            };
        }
        
        trustLog.statistics.total++;
        trustLog.statistics[verification.decision]++;
        
        if (!trustLog.statistics.by_source[verification.source]) {
            trustLog.statistics.by_source[verification.source] = {
                total: 0,
                confirmed: 0,
                quarantined: 0
            };
        }
        
        trustLog.statistics.by_source[verification.source].total++;
        trustLog.statistics.by_source[verification.source][verification.decision]++;
        
        // Keep only last 5000 verifications
        if (trustLog.verifications.length > 5000) {
            trustLog.verifications = trustLog.verifications.slice(-5000);
        }
        
        fs.writeFileSync(this.trustLogPath, JSON.stringify(trustLog, null, 2));
    }
    
    /**
     * Run continuous processing
     */
    async runForever() {
        console.log('🛡️  Trust Reconciliation Router started');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Monitoring:', this.eventLogPath);
        console.log('Confirmed events:', this.confirmedPath);
        console.log('Quarantine:', this.quarantinePath);
        console.log('');
        
        // Process events every 5 seconds
        setInterval(async () => {
            try {
                await this.processEvents();
            } catch (error) {
                console.error('Processing error:', error.message);
            }
        }, 5000);
        
        // Log statistics every minute
        setInterval(() => {
            const trustLog = JSON.parse(fs.readFileSync(this.trustLogPath, 'utf8'));
            if (trustLog.statistics) {
                console.log('📊 Trust statistics:', trustLog.statistics);
            }
        }, 60000);
    }
}

// Run if called directly
if (require.main === module) {
    const router = new TrustReconciliationRouter();
    router.runForever().catch(console.error);
}

module.exports = TrustReconciliationRouter;