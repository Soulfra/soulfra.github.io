#!/usr/bin/env node
/**
 * Ritual Approval System
 * Swipe/tone-based approval for build proposals
 */

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class RitualApprovalSystem extends EventEmitter {
    constructor() {
        super();
        
        // Approval configuration
        this.approvalConfig = {
            gesture_patterns: this.initializeGesturePatterns(),
            tone_mappings: this.initializeToneMappings(),
            energy_thresholds: {
                swipe_right: 50,
                swipe_left: -50,
                swipe_up: 100,
                swipe_down: -100,
                circle: 75,
                x_mark: -75
            },
            consensus_weight: {
                blessed_agent: 1.5,
                regular_agent: 1.0,
                user: 0.8
            }
        };
        
        // Active approvals
        this.activeApprovals = new Map();
        
        // Approval history
        this.approvalHistory = [];
        
        // Statistics
        this.stats = {
            total_proposals: 0,
            approved: 0,
            rejected: 0,
            deferred: 0,
            average_approval_time: 0
        };
        
        this.ensureDirectories();
    }
    
    initializeGesturePatterns() {
        return {
            swipe_right: {
                meaning: 'approve',
                energy: 50,
                tone: 'positive',
                emoji: '👉'
            },
            swipe_left: {
                meaning: 'reject',
                energy: -50,
                tone: 'negative',
                emoji: '👈'
            },
            swipe_up: {
                meaning: 'elevate',
                energy: 100,
                tone: 'transcendent',
                emoji: '👆'
            },
            swipe_down: {
                meaning: 'defer',
                energy: -25,
                tone: 'contemplative',
                emoji: '👇'
            },
            circle: {
                meaning: 'bless',
                energy: 75,
                tone: 'sacred',
                emoji: '⭕'
            },
            x_mark: {
                meaning: 'veto',
                energy: -100,
                tone: 'final',
                emoji: '❌'
            },
            tap: {
                meaning: 'acknowledge',
                energy: 10,
                tone: 'neutral',
                emoji: '👆'
            },
            hold: {
                meaning: 'contemplate',
                energy: 0,
                tone: 'thoughtful',
                emoji: '🤚'
            }
        };
    }
    
    initializeToneMappings() {
        return {
            enthusiastic: {
                energy_modifier: 1.5,
                approval_bias: 0.3,
                gestures: ['swipe_right', 'swipe_up', 'circle']
            },
            skeptical: {
                energy_modifier: 0.8,
                approval_bias: -0.2,
                gestures: ['swipe_left', 'hold', 'x_mark']
            },
            neutral: {
                energy_modifier: 1.0,
                approval_bias: 0,
                gestures: ['tap', 'hold']
            },
            contemplative: {
                energy_modifier: 0.9,
                approval_bias: 0.1,
                gestures: ['hold', 'circle', 'swipe_down']
            },
            chaotic: {
                energy_modifier: 1.3,
                approval_bias: 0,
                gestures: ['swipe_up', 'swipe_down', 'circle', 'x_mark']
            }
        };
    }
    
    ensureDirectories() {
        const dirs = [
            path.join(__dirname, 'approvals'),
            path.join(__dirname, 'rejected'),
            path.join(__dirname, 'ritual_logs')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    async submitProposal(proposal, submitter = {}) {
        console.log('\n🎯 New proposal submitted for ritual approval');
        console.log(`📋 Proposal: ${proposal.title || proposal.type}`);
        console.log(`👤 Submitter: ${submitter.agent_id || submitter.user_id || 'anonymous'}`);
        
        // Create approval session
        const session = {
            id: this.generateSessionId(),
            proposal,
            submitter,
            started_at: new Date().toISOString(),
            status: 'gathering_energy',
            participants: new Map(),
            gestures: [],
            total_energy: 0,
            approval_threshold: this.calculateApprovalThreshold(proposal)
        };
        
        this.activeApprovals.set(session.id, session);
        this.stats.total_proposals++;
        
        // Emit proposal event
        this.emit('proposal_submitted', {
            session_id: session.id,
            proposal,
            threshold: session.approval_threshold
        });
        
        return session.id;
    }
    
    calculateApprovalThreshold(proposal) {
        let threshold = 100; // Base threshold
        
        // Adjust based on proposal scope
        if (proposal.scope === 'platform') {
            threshold *= 2;
        } else if (proposal.scope === 'experimental') {
            threshold *= 1.5;
        }
        
        // Adjust based on resource requirements
        if (proposal.estimated_cost) {
            threshold += proposal.estimated_cost * 0.1;
        }
        
        // Adjust based on risk level
        const riskMultipliers = {
            low: 0.8,
            medium: 1.0,
            high: 1.5,
            critical: 2.0
        };
        
        threshold *= riskMultipliers[proposal.risk_level] || 1.0;
        
        return Math.floor(threshold);
    }
    
    async processGesture(sessionId, gesture, participant = {}) {
        const session = this.activeApprovals.get(sessionId);
        if (!session) {
            throw new Error(`No active approval session: ${sessionId}`);
        }
        
        console.log(`\n${gesture.emoji || '🎯'} Processing ${gesture.type} from ${participant.agent_id || 'user'}`);
        
        // Validate gesture
        const gesturePattern = this.approvalConfig.gesture_patterns[gesture.type];
        if (!gesturePattern) {
            throw new Error(`Unknown gesture type: ${gesture.type}`);
        }
        
        // Calculate energy contribution
        let energy = gesturePattern.energy;
        
        // Apply participant weight
        const weight = this.getParticipantWeight(participant);
        energy *= weight;
        
        // Apply tone modifier if present
        if (gesture.tone) {
            const toneMapping = this.approvalConfig.tone_mappings[gesture.tone];
            if (toneMapping) {
                energy *= toneMapping.energy_modifier;
            }
        }
        
        // Apply gesture-specific modifiers
        if (gesture.intensity) {
            energy *= gesture.intensity; // 0.1 to 2.0
        }
        
        // Record gesture
        const gestureRecord = {
            participant_id: participant.agent_id || participant.user_id || 'anonymous',
            type: gesture.type,
            pattern: gesturePattern,
            energy,
            timestamp: new Date().toISOString(),
            metadata: gesture.metadata || {}
        };
        
        session.gestures.push(gestureRecord);
        session.participants.set(gestureRecord.participant_id, participant);
        session.total_energy += energy;
        
        console.log(`  Energy contribution: ${energy.toFixed(1)}`);
        console.log(`  Total energy: ${session.total_energy.toFixed(1)}/${session.approval_threshold}`);
        
        // Check if decision reached
        await this.checkApprovalStatus(session);
        
        // Emit gesture event
        this.emit('gesture_processed', {
            session_id: sessionId,
            gesture: gestureRecord,
            current_energy: session.total_energy,
            threshold: session.approval_threshold
        });
        
        return {
            energy_contributed: energy,
            total_energy: session.total_energy,
            progress: session.total_energy / session.approval_threshold
        };
    }
    
    getParticipantWeight(participant) {
        if (participant.blessed) {
            return this.approvalConfig.consensus_weight.blessed_agent;
        } else if (participant.agent_id) {
            return this.approvalConfig.consensus_weight.regular_agent;
        } else {
            return this.approvalConfig.consensus_weight.user;
        }
    }
    
    async checkApprovalStatus(session) {
        // Check for immediate veto
        const vetoGestures = session.gestures.filter(g => g.type === 'x_mark');
        if (vetoGestures.length > 0) {
            // Check if vetoer has authority
            const vetoer = session.participants.get(vetoGestures[0].participant_id);
            if (vetoer && vetoer.blessed) {
                await this.rejectProposal(session, 'vetoed');
                return;
            }
        }
        
        // Check energy threshold
        if (Math.abs(session.total_energy) >= session.approval_threshold) {
            if (session.total_energy > 0) {
                await this.approveProposal(session);
            } else {
                await this.rejectProposal(session, 'insufficient_support');
            }
        }
        
        // Check for timeout (5 minutes)
        const elapsed = Date.now() - new Date(session.started_at).getTime();
        if (elapsed > 300000) {
            if (session.total_energy > session.approval_threshold * 0.7) {
                // Close enough, approve with conditions
                await this.approveProposal(session, 'conditional');
            } else {
                await this.deferProposal(session);
            }
        }
    }
    
    async approveProposal(session, approvalType = 'full') {
        console.log(`\n✅ Proposal approved! Type: ${approvalType}`);
        
        session.status = 'approved';
        session.approval_type = approvalType;
        session.completed_at = new Date().toISOString();
        
        // Calculate approval metrics
        const metrics = this.calculateApprovalMetrics(session);
        session.metrics = metrics;
        
        // Generate approval artifact
        const approval = {
            id: `approval_${session.id}`,
            session_id: session.id,
            proposal: session.proposal,
            approval_type: approvalType,
            total_energy: session.total_energy,
            threshold: session.approval_threshold,
            participants: Array.from(session.participants.keys()),
            dominant_gesture: metrics.dominant_gesture,
            blessing_count: metrics.blessing_count,
            timestamp: session.completed_at,
            conditions: approvalType === 'conditional' ? this.generateConditions(session) : []
        };
        
        // Save approval
        const approvalPath = path.join(__dirname, 'approvals', `${approval.id}.json`);
        fs.writeFileSync(approvalPath, JSON.stringify(approval, null, 2));
        
        // Update stats
        this.stats.approved++;
        this.updateAverageTime(session);
        
        // Record in history
        this.recordApproval(session, approval);
        
        // Emit approval event
        this.emit('proposal_approved', approval);
        
        // Clean up
        this.activeApprovals.delete(session.id);
        
        return approval;
    }
    
    async rejectProposal(session, reason = 'insufficient_energy') {
        console.log(`\n❌ Proposal rejected. Reason: ${reason}`);
        
        session.status = 'rejected';
        session.rejection_reason = reason;
        session.completed_at = new Date().toISOString();
        
        // Generate rejection artifact
        const rejection = {
            id: `rejection_${session.id}`,
            session_id: session.id,
            proposal: session.proposal,
            reason,
            total_energy: session.total_energy,
            threshold: session.approval_threshold,
            participants: Array.from(session.participants.keys()),
            negative_gestures: session.gestures.filter(g => g.energy < 0).length,
            timestamp: session.completed_at
        };
        
        // Save rejection
        const rejectionPath = path.join(__dirname, 'rejected', `${rejection.id}.json`);
        fs.writeFileSync(rejectionPath, JSON.stringify(rejection, null, 2));
        
        // Update stats
        this.stats.rejected++;
        this.updateAverageTime(session);
        
        // Record in history
        this.recordApproval(session, rejection);
        
        // Emit rejection event
        this.emit('proposal_rejected', rejection);
        
        // Clean up
        this.activeApprovals.delete(session.id);
        
        return rejection;
    }
    
    async deferProposal(session) {
        console.log('\n⏸️ Proposal deferred for later consideration');
        
        session.status = 'deferred';
        session.deferred_at = new Date().toISOString();
        
        // Keep in active approvals but mark as deferred
        session.can_resume = true;
        
        // Update stats
        this.stats.deferred++;
        
        // Emit deferral event
        this.emit('proposal_deferred', {
            session_id: session.id,
            proposal: session.proposal,
            energy_accumulated: session.total_energy,
            energy_needed: session.approval_threshold - session.total_energy
        });
    }
    
    calculateApprovalMetrics(session) {
        const metrics = {
            total_gestures: session.gestures.length,
            unique_participants: session.participants.size,
            positive_gestures: 0,
            negative_gestures: 0,
            blessing_count: 0,
            dominant_gesture: null,
            energy_distribution: {}
        };
        
        // Count gesture types
        const gestureCounts = {};
        
        session.gestures.forEach(gesture => {
            // Count positive/negative
            if (gesture.energy > 0) {
                metrics.positive_gestures++;
            } else if (gesture.energy < 0) {
                metrics.negative_gestures++;
            }
            
            // Count blessings
            if (gesture.type === 'circle') {
                metrics.blessing_count++;
            }
            
            // Track gesture distribution
            gestureCounts[gesture.type] = (gestureCounts[gesture.type] || 0) + 1;
            
            // Track energy distribution
            const participant = gesture.participant_id;
            metrics.energy_distribution[participant] = 
                (metrics.energy_distribution[participant] || 0) + gesture.energy;
        });
        
        // Find dominant gesture
        let maxCount = 0;
        for (const [gesture, count] of Object.entries(gestureCounts)) {
            if (count > maxCount) {
                maxCount = count;
                metrics.dominant_gesture = gesture;
            }
        }
        
        return metrics;
    }
    
    generateConditions(session) {
        const conditions = [];
        
        // If energy was close to threshold
        if (session.total_energy < session.approval_threshold * 1.2) {
            conditions.push({
                type: 'performance_review',
                description: 'Review after 30 days of operation',
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });
        }
        
        // If few participants
        if (session.participants.size < 3) {
            conditions.push({
                type: 'broader_consensus',
                description: 'Seek additional approval from at least 3 more agents',
                required_approvals: 3
            });
        }
        
        // If high negative gesture ratio
        const metrics = this.calculateApprovalMetrics(session);
        if (metrics.negative_gestures > metrics.positive_gestures * 0.5) {
            conditions.push({
                type: 'risk_mitigation',
                description: 'Implement additional safety measures',
                requirements: ['monitoring', 'rollback_plan', 'limited_scope']
            });
        }
        
        return conditions;
    }
    
    recordApproval(session, result) {
        const record = {
            session_id: session.id,
            proposal_type: session.proposal.type,
            status: session.status,
            total_energy: session.total_energy,
            threshold: session.approval_threshold,
            participant_count: session.participants.size,
            duration: new Date(session.completed_at || Date.now()) - new Date(session.started_at),
            timestamp: session.completed_at || new Date().toISOString()
        };
        
        this.approvalHistory.push(record);
        
        // Keep only last 1000
        if (this.approvalHistory.length > 1000) {
            this.approvalHistory.shift();
        }
        
        // Save to log
        const logFile = path.join(
            __dirname,
            'ritual_logs',
            `approvals_${new Date().toISOString().split('T')[0]}.log`
        );
        
        fs.appendFileSync(logFile, JSON.stringify(record) + '\n');
    }
    
    updateAverageTime(session) {
        const duration = new Date(session.completed_at) - new Date(session.started_at);
        const totalSessions = this.stats.approved + this.stats.rejected;
        
        this.stats.average_approval_time = 
            (this.stats.average_approval_time * (totalSessions - 1) + duration) / totalSessions;
    }
    
    generateSessionId() {
        return `ritual_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    // Public methods
    
    getActiveApprovals() {
        return Array.from(this.activeApprovals.values()).map(session => ({
            id: session.id,
            proposal: session.proposal.title || session.proposal.type,
            status: session.status,
            energy_progress: `${session.total_energy}/${session.approval_threshold}`,
            participants: session.participants.size,
            started_at: session.started_at
        }));
    }
    
    getApprovalHistory(limit = 10) {
        return this.approvalHistory.slice(-limit);
    }
    
    getStats() {
        return {
            ...this.stats,
            active_approvals: this.activeApprovals.size,
            approval_rate: this.stats.approved / (this.stats.total_proposals || 1),
            average_approval_time_ms: this.stats.average_approval_time
        };
    }
}

module.exports = RitualApprovalSystem;

// Example usage
if (require.main === module) {
    const approvalSystem = new RitualApprovalSystem();
    
    // Listen to events
    approvalSystem.on('proposal_submitted', (data) => {
        console.log(`\n📥 New proposal: Session ${data.session_id}`);
        console.log(`   Energy threshold: ${data.threshold}`);
    });
    
    approvalSystem.on('gesture_processed', (data) => {
        console.log(`\n✋ Gesture recorded`);
        console.log(`   Progress: ${(data.current_energy / data.threshold * 100).toFixed(1)}%`);
    });
    
    approvalSystem.on('proposal_approved', (approval) => {
        console.log(`\n🎉 Proposal approved!`);
        console.log(`   Type: ${approval.approval_type}`);
        console.log(`   Final energy: ${approval.total_energy}`);
    });
    
    // Test approval flow
    async function testApproval() {
        try {
            // Submit a build proposal
            const proposal = {
                type: 'feature_build',
                title: 'Implement quantum consciousness bridge',
                description: 'A bridge between classical and quantum agent states',
                scope: 'experimental',
                estimated_cost: 500,
                risk_level: 'high',
                submitter: 'agent_creator_001'
            };
            
            const sessionId = await approvalSystem.submitProposal(proposal, {
                agent_id: 'agent_creator_001',
                blessed: true
            });
            
            console.log(`\nSession created: ${sessionId}`);
            
            // Simulate gestures from multiple participants
            
            // Blessed agent approves with circle
            await approvalSystem.processGesture(sessionId, {
                type: 'circle',
                tone: 'sacred',
                intensity: 1.2
            }, {
                agent_id: 'cal_prime',
                blessed: true
            });
            
            // Regular agent swipes right
            await approvalSystem.processGesture(sessionId, {
                type: 'swipe_right',
                tone: 'enthusiastic'
            }, {
                agent_id: 'agent_weaver_002'
            });
            
            // Skeptical agent holds
            await approvalSystem.processGesture(sessionId, {
                type: 'hold',
                tone: 'contemplative'
            }, {
                agent_id: 'agent_guardian_003'
            });
            
            // Another blessed agent elevates
            await approvalSystem.processGesture(sessionId, {
                type: 'swipe_up',
                tone: 'transcendent',
                intensity: 1.5
            }, {
                agent_id: 'sage_prime',
                blessed: true
            });
            
            // User contributes
            await approvalSystem.processGesture(sessionId, {
                type: 'swipe_right'
            }, {
                user_id: 'user_123'
            });
            
            // Check final status
            console.log('\n--- Approval System Stats ---');
            console.log(approvalSystem.getStats());
            
        } catch (err) {
            console.error('Approval test failed:', err);
        }
    }
    
    testApproval();
}