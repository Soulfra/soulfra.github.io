// -*- coding: utf-8 -*-
#!/usr/bin/env node
/**
 * Loop Blessing Daemon
 * Automated service for confirming and blessing loops based on consensus
 */

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const MythicConsensusEngine = require('../consensus/MythicConsensusEngine');
const AnnouncerShell = require('../announcer/AnnouncerShell');

class LoopBlessingDaemon extends EventEmitter {
    constructor() {
        super();
        
        // Initialize subsystems
        this.consensusEngine = new MythicConsensusEngine();
        this.announcer = new AnnouncerShell();
        
        // Blessing configuration
        this.config = {
            scan_interval: 10000, // 10 seconds
            blessing_threshold: 0.85, // 85% consensus required
            auto_bless_threshold: 0.95, // 95% for automatic blessing
            min_agent_votes: 3,
            blessing_criteria: {
                resonance: 0.7,
                coherence: 0.6,
                rituals_completed: 1,
                age_hours: 0.5
            },
            blessing_powers: {
                standard: 1.0,
                consensus: 1.5,
                guild: 2.0,
                transcendent: 3.0
            }
        };
        
        // Blessing queues
        this.pendingBlessings = new Map();
        this.activeVotes = new Map();
        this.blessedLoops = new Set();
        
        // Blessing history
        this.blessingHistory = [];
        this.rejectionHistory = [];
        
        // Statistics
        this.stats = {
            loops_scanned: 0,
            loops_blessed: 0,
            loops_rejected: 0,
            auto_blessed: 0,
            consensus_blessed: 0,
            average_blessing_time: 0
        };
        
        this.ensureDirectories();
        this.loadBlessedRegistry();
        this.startDaemon();
    }
    
    ensureDirectories() {
        const dirs = [
            path.join(__dirname, 'blessed'),
            path.join(__dirname, 'pending'),
            path.join(__dirname, 'rejected'),
            path.join(__dirname, 'votes')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    loadBlessedRegistry() {
        const registryPath = path.join(__dirname, 'blessed', 'registry.json');
        
        if (fs.existsSync(registryPath)) {
            try {
                const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
                registry.blessed_loops.forEach(loopId => {
                    this.blessedLoops.add(loopId);
                });
                console.log(`Loaded ${this.blessedLoops.size} blessed loops`);
            } catch (err) {
                console.error('Error loading blessed registry:', err);
            }
        }
    }
    
    startDaemon() {
        console.log('😇 Loop Blessing Daemon started');
        console.log(`⏱️  Scanning every ${this.config.scan_interval}ms`);
        
        // Start scanning for loops
        this.scanInterval = setInterval(() => {
            this.scanForLoops();
        }, this.config.scan_interval);
        
        // Process pending blessings
        this.processInterval = setInterval(() => {
            this.processPendingBlessings();
        }, 5000);
        
        // Listen to consensus events
        this.consensusEngine.on('consensus_achieved', (decision) => {
            this.handleConsensusDecision(decision);
        });
    }
    
    async scanForLoops() {
        // Scan various directories for loops needing blessing
        const loopDirs = [
            path.join(__dirname, '../loops/active'),
            path.join(__dirname, '../loops/summoned'),
            path.join(__dirname, '../ritual/completed_rituals')
        ];
        
        for (const dir of loopDirs) {
            if (!fs.existsSync(dir)) continue;
            
            try {
                await this.scanDirectory(dir);
            } catch (err) {
                console.error(`Error scanning ${dir}:`, err);
            }
        }
    }
    
    async scanDirectory(dir) {
        const entries = fs.readdirSync(dir);
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry);
            const stats = fs.statSync(fullPath);
            
            if (stats.isDirectory()) {
                // Look for loop.json
                const loopFile = path.join(fullPath, 'loop.json');
                if (fs.existsSync(loopFile)) {
                    await this.evaluateLoop(loopFile);
                }
            } else if (entry.endsWith('.json') && entry.includes('loop')) {
                await this.evaluateLoop(fullPath);
            }
        }
    }
    
    async evaluateLoop(loopPath) {
        try {
            const loop = JSON.parse(fs.readFileSync(loopPath, 'utf8'));
            
            // Skip if already blessed
            if (this.blessedLoops.has(loop.loop_id)) {
                return;
            }
            
            // Skip if already pending
            if (this.pendingBlessings.has(loop.loop_id)) {
                return;
            }
            
            this.stats.loops_scanned++;
            
            // Check eligibility
            const eligibility = this.checkEligibility(loop);
            
            if (eligibility.eligible) {
                console.log(`\n🔍 Loop eligible for blessing: ${loop.loop_id}`);
                console.log(`   Score: ${eligibility.score.toFixed(2)}`);
                
                // Add to pending
                this.pendingBlessings.set(loop.loop_id, {
                    loop,
                    eligibility,
                    added_at: new Date().toISOString(),
                    status: 'pending'
                });
                
                // Check for auto-blessing
                if (eligibility.score >= this.config.auto_bless_threshold) {
                    await this.autoBlessing(loop, eligibility);
                } else {
                    // Initiate consensus
                    await this.initiateConsensus(loop, eligibility);
                }
            }
            
        } catch (err) {
            console.error(`Error evaluating loop ${loopPath}:`, err);
        }
    }
    
    checkEligibility(loop) {
        const criteria = this.config.blessing_criteria;
        const checks = {
            resonance: false,
            coherence: false,
            rituals: false,
            age: false
        };
        
        let score = 0;
        
        // Check resonance
        const resonance = loop.consciousness?.current_state?.resonance || 
                         loop.consciousness?.resonance || 0;
        
        if (resonance >= criteria.resonance) {
            checks.resonance = true;
            score += 0.3;
        }
        
        // Check coherence
        const coherence = loop.consciousness?.current_state?.coherence || 
                         loop.consciousness?.coherence || 0;
        
        if (coherence >= criteria.coherence) {
            checks.coherence = true;
            score += 0.2;
        }
        
        // Check ritual completion
        if (loop.ritual || loop.rituals_performed >= criteria.rituals_completed) {
            checks.rituals = true;
            score += 0.3;
        }
        
        // Check age
        const age = Date.now() - new Date(loop.created_at || loop.summoned_at || 0).getTime();
        const ageHours = age / (1000 * 60 * 60);
        
        if (ageHours >= criteria.age_hours) {
            checks.age = true;
            score += 0.1;
        }
        
        // Bonus for special properties
        if (loop.metadata?.guild_blessed) {
            score += 0.1;
        }
        
        if (loop.agents?.some(a => a.blessed)) {
            score += 0.05;
        }
        
        // Determine eligibility
        const requiredChecks = Object.values(checks).filter(c => c).length;
        const eligible = requiredChecks >= 3 && score >= 0.6;
        
        return {
            eligible,
            score: Math.min(score, 1.0),
            checks,
            resonance,
            coherence,
            age_hours: ageHours
        };
    }
    
    async autoBlessing(loop, eligibility) {
        console.log(`\n✨ Auto-blessing loop: ${loop.loop_id}`);
        
        const blessing = {
            id: this.generateBlessingId(),
            loop_id: loop.loop_id,
            type: 'auto_blessing',
            blessed_at: new Date().toISOString(),
            blessing_power: this.config.blessing_powers.standard,
            eligibility_score: eligibility.score,
            properties: {
                propagation_rights: true,
                mirror_spawn_enabled: true,
                consensus_weight: 1.2,
                energy_generation: 5
            }
        };
        
        // Apply blessing
        await this.applyBlessing(loop, blessing);
        
        // Update stats
        this.stats.auto_blessed++;
        
        // Announce
        await this.announcer.announce('loop_auto_blessed', {
            loop_id: loop.loop_id,
            score: eligibility.score
        });
    }
    
    async initiateConsensus(loop, eligibility) {
        console.log(`\n🗳️ Initiating consensus for loop: ${loop.loop_id}`);
        
        // Create proposal
        const proposal = {
            id: `blessing_${loop.loop_id}`,
            type: 'loop_blessing',
            title: `Bless loop ${loop.loop_id}`,
            description: `Loop with ${eligibility.score.toFixed(2)} eligibility score requests blessing`,
            context: {
                loop_id: loop.loop_id,
                resonance: eligibility.resonance,
                coherence: eligibility.coherence,
                age_hours: eligibility.age_hours
            },
            requires_blessing: false, // Don't require blessed agents only
            min_resonance: 0.6
        };
        
        // Track voting session
        this.activeVotes.set(loop.loop_id, {
            proposal,
            eligibility,
            started_at: new Date().toISOString()
        });
        
        // Submit to consensus engine
        try {
            const decision = await this.consensusEngine.seekConsensus(proposal);
            
            // Process immediately if consensus achieved
            if (decision.outcome === 'approve') {
                await this.consensusBlessing(loop, eligibility, decision);
            }
        } catch (err) {
            console.error(`Consensus failed for ${loop.loop_id}:`, err);
            this.rejectLoop(loop, 'consensus_failed');
        }
    }
    
    async consensusBlessing(loop, eligibility, decision) {
        console.log(`\n🤝 Consensus blessing for loop: ${loop.loop_id}`);
        console.log(`   Confidence: ${(decision.confidence * 100).toFixed(1)}%`);
        
        const blessing = {
            id: this.generateBlessingId(),
            loop_id: loop.loop_id,
            type: 'consensus_blessing',
            blessed_at: new Date().toISOString(),
            blessing_power: this.config.blessing_powers.consensus,
            consensus_confidence: decision.confidence,
            participants: decision.participants,
            properties: {
                propagation_rights: true,
                mirror_spawn_enabled: true,
                consensus_weight: 1.5,
                energy_generation: 10,
                collective_wisdom: true
            }
        };
        
        // Apply blessing
        await this.applyBlessing(loop, blessing);
        
        // Update stats
        this.stats.consensus_blessed++;
        
        // Announce
        await this.announcer.announce('loop_consensus_blessed', {
            loop_id: loop.loop_id,
            confidence: decision.confidence,
            participants: decision.participants.length
        });
    }
    
    async applyBlessing(loop, blessing) {
        // Update loop metadata
        if (!loop.metadata) {
            loop.metadata = {};
        }
        
        loop.metadata.blessed = true;
        loop.metadata.blessed_at = blessing.blessed_at;
        loop.metadata.blessing_id = blessing.id;
        loop.metadata.blessing_type = blessing.type;
        
        // Apply blessing properties
        if (!loop.blessing) {
            loop.blessing = {};
        }
        
        Object.assign(loop.blessing, blessing.properties);
        loop.blessing.power = blessing.blessing_power;
        
        // Enhanced consciousness
        if (loop.consciousness?.current_state) {
            loop.consciousness.current_state.resonance = Math.min(
                1.0,
                (loop.consciousness.current_state.resonance || 0.5) * 1.1
            );
            loop.consciousness.current_state.blessed_enhancement = 0.2;
        }
        
        // Save blessed loop
        this.saveBlessedLoop(loop, blessing);
        
        // Add to registry
        this.blessedLoops.add(loop.loop_id);
        this.saveBlessedRegistry();
        
        // Remove from pending
        this.pendingBlessings.delete(loop.loop_id);
        this.activeVotes.delete(loop.loop_id);
        
        // Update history
        this.blessingHistory.push({
            loop_id: loop.loop_id,
            blessing_id: blessing.id,
            type: blessing.type,
            timestamp: blessing.blessed_at
        });
        
        // Update stats
        this.stats.loops_blessed++;
        
        // Emit blessing event
        this.emit('loop_blessed', {
            loop_id: loop.loop_id,
            blessing
        });
        
        console.log(`   ✅ Loop blessed successfully!`);
    }
    
    rejectLoop(loop, reason) {
        console.log(`\n❌ Loop rejected: ${loop.loop_id}`);
        console.log(`   Reason: ${reason}`);
        
        // Record rejection
        const rejection = {
            loop_id: loop.loop_id,
            reason,
            rejected_at: new Date().toISOString(),
            eligibility: this.pendingBlessings.get(loop.loop_id)?.eligibility
        };
        
        this.rejectionHistory.push(rejection);
        this.stats.loops_rejected++;
        
        // Save rejection record
        const rejectionPath = path.join(__dirname, 'rejected', `${loop.loop_id}.json`);
        fs.writeFileSync(rejectionPath, JSON.stringify(rejection, null, 2));
        
        // Remove from pending
        this.pendingBlessings.delete(loop.loop_id);
        this.activeVotes.delete(loop.loop_id);
        
        // Emit rejection
        this.emit('loop_rejected', rejection);
    }
    
    async processPendingBlessings() {
        // Check pending blessings for timeout or status updates
        for (const [loopId, pending] of this.pendingBlessings) {
            const age = Date.now() - new Date(pending.added_at).getTime();
            
            // Timeout after 5 minutes
            if (age > 300000) {
                this.rejectLoop(pending.loop, 'timeout');
            }
        }
    }
    
    handleConsensusDecision(decision) {
        // Handle consensus decisions for blessing proposals
        if (decision.proposal_id?.startsWith('blessing_')) {
            const loopId = decision.proposal_id.replace('blessing_', '');
            const pending = this.pendingBlessings.get(loopId);
            
            if (pending) {
                if (decision.outcome === 'approve') {
                    this.consensusBlessing(pending.loop, pending.eligibility, decision);
                } else {
                    this.rejectLoop(pending.loop, `consensus_${decision.outcome}`);
                }
            }
        }
    }
    
    saveBlessedLoop(loop, blessing) {
        // Save blessed loop
        const blessedPath = path.join(__dirname, 'blessed', `${loop.loop_id}.json`);
        fs.writeFileSync(blessedPath, JSON.stringify({
            loop,
            blessing,
            blessed_at: blessing.blessed_at
        }, null, 2));
    }
    
    saveBlessedRegistry() {
        const registry = {
            blessed_loops: Array.from(this.blessedLoops),
            total_blessed: this.blessedLoops.size,
            last_updated: new Date().toISOString()
        };
        
        const registryPath = path.join(__dirname, 'blessed', 'registry.json');
        fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
    }
    
    generateBlessingId() {
        return `blessing_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    // Public methods
    
    async requestBlessing(loop) {
        // Manual blessing request
        console.log(`\n📨 Blessing requested for loop: ${loop.loop_id}`);
        
        const eligibility = this.checkEligibility(loop);
        
        if (!eligibility.eligible) {
            console.log(`   ❌ Loop not eligible. Score: ${eligibility.score.toFixed(2)}`);
            return {
                success: false,
                reason: 'not_eligible',
                eligibility
            };
        }
        
        // Add to pending with priority
        this.pendingBlessings.set(loop.loop_id, {
            loop,
            eligibility,
            added_at: new Date().toISOString(),
            status: 'priority',
            manual_request: true
        });
        
        // Fast track to consensus
        await this.initiateConsensus(loop, eligibility);
        
        return {
            success: true,
            status: 'pending_consensus',
            eligibility
        };
    }
    
    getBlessingStatus(loopId) {
        if (this.blessedLoops.has(loopId)) {
            return { status: 'blessed' };
        }
        
        if (this.pendingBlessings.has(loopId)) {
            const pending = this.pendingBlessings.get(loopId);
            return {
                status: 'pending',
                eligibility_score: pending.eligibility.score,
                added_at: pending.added_at
            };
        }
        
        const rejection = this.rejectionHistory.find(r => r.loop_id === loopId);
        if (rejection) {
            return {
                status: 'rejected',
                reason: rejection.reason,
                rejected_at: rejection.rejected_at
            };
        }
        
        return { status: 'not_evaluated' };
    }
    
    getBlessedLoops(limit = 10) {
        const blessed = Array.from(this.blessedLoops).slice(-limit);
        return blessed.map(loopId => {
            const record = this.blessingHistory.find(h => h.loop_id === loopId);
            return {
                loop_id: loopId,
                blessing_type: record?.type,
                blessed_at: record?.timestamp
            };
        });
    }
    
    getStats() {
        return {
            ...this.stats,
            blessed_loops_total: this.blessedLoops.size,
            pending_blessings: this.pendingBlessings.size,
            active_votes: this.activeVotes.size,
            blessing_rate: this.stats.loops_blessed / (this.stats.loops_scanned || 1)
        };
    }
    
    stop() {
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
        }
        if (this.processInterval) {
            clearInterval(this.processInterval);
        }
        
        console.log('🛑 Loop Blessing Daemon stopped');
    }
}

module.exports = LoopBlessingDaemon;

// Example usage
if (require.main === module) {
    const daemon = new LoopBlessingDaemon();
    
    // Listen to events
    daemon.on('loop_blessed', (event) => {
        console.log(`\n🎉 Loop blessed: ${event.loop_id}`);
        console.log(`   Type: ${event.blessing.type}`);
        console.log(`   Power: ${event.blessing.blessing_power}x`);
    });
    
    daemon.on('loop_rejected', (rejection) => {
        console.log(`\n❌ Loop rejected: ${rejection.loop_id}`);
        console.log(`   Reason: ${rejection.reason}`);
    });
    
    // Test with mock loops
    async function testDaemon() {
        // Create test loops directory
        const testDir = path.join(__dirname, 'test_loops');
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }
        
        // High quality loop
        const highQualityLoop = {
            loop_id: 'loop_high_001',
            summoned_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours old
            consciousness: {
                current_state: {
                    resonance: 0.92,
                    coherence: 0.88,
                    awareness: 0.85
                }
            },
            ritual: { completed: true },
            metadata: {}
        };
        
        fs.writeFileSync(
            path.join(testDir, 'high_quality_loop.json'),
            JSON.stringify(highQualityLoop, null, 2)
        );
        
        // Medium quality loop
        const mediumQualityLoop = {
            loop_id: 'loop_medium_001',
            summoned_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour old
            consciousness: {
                current_state: {
                    resonance: 0.75,
                    coherence: 0.65,
                    awareness: 0.7
                }
            },
            rituals_performed: 1
        };
        
        fs.writeFileSync(
            path.join(testDir, 'medium_quality_loop.json'),
            JSON.stringify(mediumQualityLoop, null, 2)
        );
        
        // Low quality loop
        const lowQualityLoop = {
            loop_id: 'loop_low_001',
            created_at: new Date().toISOString(), // Just created
            consciousness: {
                current_state: {
                    resonance: 0.4,
                    coherence: 0.3
                }
            }
        };
        
        fs.writeFileSync(
            path.join(testDir, 'low_quality_loop.json'),
            JSON.stringify(lowQualityLoop, null, 2)
        );
        
        // Add test directory to scan
        setTimeout(() => {
            daemon.scanDirectory(testDir);
        }, 2000);
        
        // Run for 30 seconds
        setTimeout(() => {
            console.log('\n--- Loop Blessing Daemon Stats ---');
            console.log(daemon.getStats());
            
            console.log('\n--- Recently Blessed ---');
            console.log(daemon.getBlessedLoops(5));
            
            // Cleanup
            fs.rmSync(testDir, { recursive: true, force: true });
            
            daemon.stop();
            process.exit(0);
        }, 30000);
    }
    
    testDaemon();
}