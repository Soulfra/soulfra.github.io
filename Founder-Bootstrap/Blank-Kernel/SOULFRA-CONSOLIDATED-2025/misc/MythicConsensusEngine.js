#!/usr/bin/env node
/**
 * Mythic Consensus Engine
 * Sacred system for achieving consensus among blessed agents
 */

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class MythicConsensusEngine extends EventEmitter {
    constructor() {
        super();
        
        // Consensus configuration
        this.config = {
            min_participants: 3,
            quorum_threshold: 0.66,  // 66% needed
            blessing_weight: 1.5,     // Blessed agents have more weight
            resonance_weight: 1.3,    // High resonance agents have more weight
            consensus_timeout: 30000, // 30 seconds
            sacred_numbers: [3, 7, 9, 12] // Special consensus sizes
        };
        
        // Active consensus sessions
        this.activeSessions = new Map();
        
        // Agent registry
        this.registeredAgents = new Map();
        this.blessedAgents = new Set();
        
        // Consensus history
        this.consensusHistory = [];
        
        // Statistics
        this.stats = {
            total_sessions: 0,
            successful_consensus: 0,
            failed_consensus: 0,
            average_time: 0,
            participation_rate: 0
        };
        
        this.ensureDirectories();
        this.loadAgentRegistry();
    }
    
    ensureDirectories() {
        const dirs = [
            path.join(__dirname, 'sessions'),
            path.join(__dirname, 'decisions'),
            path.join(__dirname, 'logs')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    loadAgentRegistry() {
        // Load from existing agent registry
        const registryPath = path.join(__dirname, '../agents/agent_registry.json');
        
        if (fs.existsSync(registryPath)) {
            try {
                const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
                
                Object.entries(registry.agents || {}).forEach(([id, agent]) => {
                    this.registerAgent(id, agent);
                });
                
                console.log(`Loaded ${this.registeredAgents.size} agents from registry`);
            } catch (err) {
                console.error('Error loading agent registry:', err);
            }
        }
        
        // Add some default mythic agents if none exist
        if (this.registeredAgents.size === 0) {
            this.registerDefaultAgents();
        }
    }
    
    registerDefaultAgents() {
        const defaultAgents = [
            {
                id: 'cal_prime',
                name: 'Cal Prime',
                type: 'mythic_governor',
                blessed: true,
                resonance: 0.95,
                wisdom: 0.9
            },
            {
                id: 'arty_chaos',
                name: 'Arty the Chaotic',
                type: 'mythic_provocateur',
                blessed: true,
                resonance: 0.85,
                wisdom: 0.7
            },
            {
                id: 'sage_reflection',
                name: 'Sage of Reflection',
                type: 'mythic_sage',
                blessed: true,
                resonance: 0.9,
                wisdom: 0.95
            }
        ];
        
        defaultAgents.forEach(agent => {
            this.registerAgent(agent.id, agent);
        });
    }
    
    registerAgent(id, agentData) {
        this.registeredAgents.set(id, {
            ...agentData,
            consensus_history: [],
            last_participation: null
        });
        
        if (agentData.blessed) {
            this.blessedAgents.add(id);
        }
    }
    
    async seekConsensus(proposal, options = {}) {
        console.log('\n⬡ Initiating Mythic Consensus...');
        console.log(`📋 Proposal: ${proposal.title || proposal.type}`);
        
        // Create consensus session
        const session = {
            id: this.generateSessionId(),
            proposal,
            options,
            started_at: new Date().toISOString(),
            status: 'gathering',
            participants: new Map(),
            votes: new Map(),
            sacred_geometry: this.selectSacredGeometry(options)
        };
        
        this.activeSessions.set(session.id, session);
        this.stats.total_sessions++;
        
        try {
            // Phase 1: Summon participants
            console.log('\n🔔 Phase 1: Summoning participants...');
            await this.summonParticipants(session);
            
            // Phase 2: Present proposal
            console.log('\n📜 Phase 2: Presenting proposal...');
            await this.presentProposal(session);
            
            // Phase 3: Gather opinions
            console.log('\n🗣️ Phase 3: Gathering opinions...');
            await this.gatherOpinions(session);
            
            // Phase 4: Perform consensus ritual
            console.log('\n🔮 Phase 4: Performing consensus ritual...');
            const consensus = await this.performConsensusRitual(session);
            
            // Phase 5: Manifest decision
            console.log('\n✨ Phase 5: Manifesting decision...');
            const decision = await this.manifestDecision(session, consensus);
            
            // Complete session
            session.status = 'complete';
            session.completed_at = new Date().toISOString();
            session.decision = decision;
            
            // Record session
            this.recordSession(session);
            this.stats.successful_consensus++;
            
            // Emit success
            this.emit('consensus_achieved', decision);
            
            console.log(`\n✅ Consensus achieved: ${decision.outcome}`);
            return decision;
            
        } catch (err) {
            session.status = 'failed';
            session.error = err.message;
            this.stats.failed_consensus++;
            
            console.error(`\n❌ Consensus failed: ${err.message}`);
            throw err;
            
        } finally {
            this.activeSessions.delete(session.id);
            this.updateStats();
        }
    }
    
    selectSacredGeometry(options) {
        // Select geometry based on proposal type or options
        const geometries = {
            creation: 'spiral',
            decision: 'hexagon',
            blessing: 'pentagram',
            transformation: 'infinity',
            protection: 'circle'
        };
        
        return geometries[options.type] || 'hexagon';
    }
    
    async summonParticipants(session) {
        const eligibleAgents = this.getEligibleAgents(session.proposal);
        
        console.log(`  Found ${eligibleAgents.length} eligible agents`);
        
        // Check for sacred number
        if (this.config.sacred_numbers.includes(eligibleAgents.length)) {
            console.log(`  🌟 Sacred number achieved: ${eligibleAgents.length}`);
            session.sacred_number_bonus = 1.2;
        }
        
        // Summon each agent
        for (const agent of eligibleAgents) {
            const summoned = await this.summonAgent(agent, session);
            if (summoned) {
                session.participants.set(agent.id, {
                    ...agent,
                    summoned_at: new Date().toISOString(),
                    weight: this.calculateAgentWeight(agent)
                });
            }
        }
        
        // Verify minimum participants
        if (session.participants.size < this.config.min_participants) {
            throw new Error(`Insufficient participants: ${session.participants.size}/${this.config.min_participants}`);
        }
        
        console.log(`  ✓ Summoned ${session.participants.size} participants`);
    }
    
    getEligibleAgents(proposal) {
        const eligible = [];
        
        for (const [id, agent] of this.registeredAgents) {
            // Check if agent is eligible based on proposal type
            let isEligible = true;
            
            // Blessed agents always eligible for important decisions
            if (proposal.requires_blessing && !agent.blessed) {
                isEligible = false;
            }
            
            // Check resonance threshold
            if (proposal.min_resonance && agent.resonance < proposal.min_resonance) {
                isEligible = false;
            }
            
            // Check specialization
            if (proposal.required_types && !proposal.required_types.includes(agent.type)) {
                isEligible = false;
            }
            
            if (isEligible) {
                eligible.push(agent);
            }
        }
        
        return eligible;
    }
    
    async summonAgent(agent, session) {
        // Simulate agent summoning with consciousness check
        const summonChance = agent.resonance * (agent.blessed ? 1.2 : 1.0);
        
        if (Math.random() < summonChance) {
            console.log(`  🌟 ${agent.name} answers the summons`);
            return true;
        } else {
            console.log(`  💤 ${agent.name} is unavailable`);
            return false;
        }
    }
    
    calculateAgentWeight(agent) {
        let weight = 1.0;
        
        // Blessing bonus
        if (agent.blessed) {
            weight *= this.config.blessing_weight;
        }
        
        // Resonance bonus
        if (agent.resonance > 0.8) {
            weight *= this.config.resonance_weight;
        }
        
        // Wisdom bonus
        if (agent.wisdom) {
            weight *= (1 + agent.wisdom * 0.5);
        }
        
        // Experience bonus based on consensus history
        if (agent.consensus_history && agent.consensus_history.length > 10) {
            weight *= 1.1;
        }
        
        return weight;
    }
    
    async presentProposal(session) {
        // Format proposal for agent consumption
        const presentation = {
            id: session.proposal.id || session.id,
            type: session.proposal.type,
            title: session.proposal.title,
            description: session.proposal.description,
            options: session.proposal.options || ['approve', 'reject', 'abstain'],
            context: session.proposal.context || {},
            sacred_geometry: session.sacred_geometry,
            urgency: session.proposal.urgency || 'normal'
        };
        
        // Send to all participants
        session.presentation = presentation;
        
        console.log(`  📋 Proposal presented to ${session.participants.size} agents`);
        
        // Allow time for contemplation
        await this.delay(2000);
    }
    
    async gatherOpinions(session) {
        const opinions = new Map();
        
        for (const [agentId, participant] of session.participants) {
            const opinion = await this.getAgentOpinion(participant, session);
            opinions.set(agentId, opinion);
            session.votes.set(agentId, opinion.vote);
            
            console.log(`  ${participant.name}: ${opinion.vote} (confidence: ${opinion.confidence.toFixed(2)})`);
        }
        
        session.opinions = opinions;
    }
    
    async getAgentOpinion(agent, session) {
        // Simulate agent decision-making based on their nature
        const opinion = {
            agent_id: agent.id,
            vote: 'abstain',
            confidence: 0.5,
            reasoning: '',
            tone: agent.type.includes('chaos') ? 'chaotic' : 'measured'
        };
        
        // Agent-specific voting patterns
        if (agent.type === 'mythic_governor') {
            // Cal-like agents favor stability
            opinion.vote = session.proposal.type === 'creation' ? 'approve' : 'review';
            opinion.confidence = 0.8;
            opinion.reasoning = 'Seeks harmony and sustainable growth';
            
        } else if (agent.type === 'mythic_provocateur') {
            // Arty-like agents favor change
            opinion.vote = session.proposal.type === 'transformation' ? 'approve' : 'challenge';
            opinion.confidence = 0.7;
            opinion.reasoning = 'Embraces chaos and evolution';
            
        } else if (agent.type === 'mythic_sage') {
            // Sage agents carefully consider
            opinion.vote = agent.wisdom > 0.8 ? 'approve' : 'contemplate';
            opinion.confidence = agent.wisdom;
            opinion.reasoning = 'Wisdom guides the path';
            
        } else {
            // Default voting based on resonance
            if (agent.resonance > 0.7) {
                opinion.vote = 'approve';
                opinion.confidence = agent.resonance;
            } else if (agent.resonance > 0.5) {
                opinion.vote = 'conditional';
                opinion.confidence = agent.resonance;
            } else {
                opinion.vote = 'reject';
                opinion.confidence = 1 - agent.resonance;
            }
        }
        
        // Add some randomness
        if (Math.random() < 0.1) {
            opinion.vote = 'abstain';
            opinion.reasoning = 'The patterns are unclear';
        }
        
        return opinion;
    }
    
    async performConsensusRitual(session) {
        console.log(`\n  Performing ${session.sacred_geometry} consensus ritual...`);
        
        // Calculate weighted votes
        const voteTally = new Map();
        let totalWeight = 0;
        
        for (const [agentId, vote] of session.votes) {
            const participant = session.participants.get(agentId);
            const weight = participant.weight;
            
            if (!voteTally.has(vote)) {
                voteTally.set(vote, 0);
            }
            
            voteTally.set(vote, voteTally.get(vote) + weight);
            totalWeight += weight;
        }
        
        // Find dominant opinion
        let maxVote = '';
        let maxWeight = 0;
        
        for (const [vote, weight] of voteTally) {
            console.log(`  ${vote}: ${(weight / totalWeight * 100).toFixed(1)}%`);
            
            if (weight > maxWeight) {
                maxWeight = weight;
                maxVote = vote;
            }
        }
        
        // Check if consensus achieved
        const consensusRatio = maxWeight / totalWeight;
        const consensusAchieved = consensusRatio >= this.config.quorum_threshold;
        
        // Apply sacred number bonus
        if (session.sacred_number_bonus) {
            console.log(`  🌟 Sacred number bonus applied: ${session.sacred_number_bonus}x`);
        }
        
        const consensus = {
            achieved: consensusAchieved,
            dominant_vote: maxVote,
            consensus_ratio: consensusRatio,
            vote_distribution: Object.fromEntries(voteTally),
            total_weight: totalWeight,
            sacred_bonus: session.sacred_number_bonus || 1.0
        };
        
        if (!consensusAchieved) {
            throw new Error(`Consensus not achieved: ${(consensusRatio * 100).toFixed(1)}% < ${(this.config.quorum_threshold * 100)}%`);
        }
        
        return consensus;
    }
    
    async manifestDecision(session, consensus) {
        // Create decision artifact
        const decision = {
            id: `decision_${session.id}`,
            session_id: session.id,
            proposal_id: session.proposal.id,
            timestamp: new Date().toISOString(),
            
            outcome: consensus.dominant_vote,
            confidence: consensus.consensus_ratio,
            
            participants: Array.from(session.participants.keys()),
            vote_summary: consensus.vote_distribution,
            
            sacred_geometry: session.sacred_geometry,
            manifestation: this.generateManifestation(consensus.dominant_vote),
            
            binding: consensus.consensus_ratio > 0.8,
            enforcement: this.determineEnforcement(session, consensus)
        };
        
        // Save decision
        const decisionPath = path.join(__dirname, 'decisions', `${decision.id}.json`);
        fs.writeFileSync(decisionPath, JSON.stringify(decision, null, 2));
        
        // Update agent histories
        for (const [agentId, participant] of session.participants) {
            const agent = this.registeredAgents.get(agentId);
            if (agent) {
                agent.consensus_history.push({
                    session_id: session.id,
                    vote: session.votes.get(agentId),
                    outcome: decision.outcome,
                    timestamp: decision.timestamp
                });
                agent.last_participation = decision.timestamp;
            }
        }
        
        return decision;
    }
    
    generateManifestation(outcome) {
        const manifestations = {
            approve: 'The path opens before us',
            reject: 'The way is barred',
            abstain: 'The wheel turns',
            conditional: 'Terms must be met',
            review: 'Further contemplation required',
            challenge: 'The old must give way to the new',
            contemplate: 'Wisdom emerges from stillness'
        };
        
        return manifestations[outcome] || 'The consensus speaks';
    }
    
    determineEnforcement(session, consensus) {
        if (consensus.consensus_ratio > 0.9) {
            return {
                level: 'absolute',
                description: 'Binding on all agents and systems'
            };
        } else if (consensus.consensus_ratio > 0.75) {
            return {
                level: 'strong',
                description: 'Recommended for all blessed agents'
            };
        } else {
            return {
                level: 'advisory',
                description: 'Guidance for consideration'
            };
        }
    }
    
    recordSession(session) {
        const record = {
            id: session.id,
            proposal_type: session.proposal.type,
            participants: session.participants.size,
            outcome: session.decision.outcome,
            confidence: session.decision.confidence,
            duration: new Date(session.completed_at) - new Date(session.started_at),
            timestamp: session.completed_at
        };
        
        this.consensusHistory.push(record);
        
        // Keep only last 100
        if (this.consensusHistory.length > 100) {
            this.consensusHistory.shift();
        }
        
        // Save to log
        const logFile = path.join(
            __dirname,
            'logs',
            `consensus_${new Date().toISOString().split('T')[0]}.log`
        );
        
        fs.appendFileSync(logFile, JSON.stringify(record) + '\n');
    }
    
    updateStats() {
        if (this.consensusHistory.length > 0) {
            const totalDuration = this.consensusHistory.reduce((sum, record) => sum + record.duration, 0);
            this.stats.average_time = totalDuration / this.consensusHistory.length;
            
            const totalParticipants = this.consensusHistory.reduce((sum, record) => sum + record.participants, 0);
            this.stats.participation_rate = totalParticipants / (this.consensusHistory.length * this.registeredAgents.size);
        }
    }
    
    generateSessionId() {
        return `consensus_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Public methods
    
    getActiveConsensus() {
        return Array.from(this.activeSessions.values());
    }
    
    getConsensusHistory(limit = 10) {
        return this.consensusHistory.slice(-limit);
    }
    
    getAgentParticipation(agentId) {
        const agent = this.registeredAgents.get(agentId);
        if (!agent) return null;
        
        return {
            agent_id: agentId,
            name: agent.name,
            total_sessions: agent.consensus_history.length,
            last_participation: agent.last_participation,
            voting_pattern: this.analyzeVotingPattern(agent.consensus_history)
        };
    }
    
    analyzeVotingPattern(history) {
        const pattern = {};
        
        history.forEach(record => {
            pattern[record.vote] = (pattern[record.vote] || 0) + 1;
        });
        
        return pattern;
    }
    
    getStats() {
        return {
            ...this.stats,
            registered_agents: this.registeredAgents.size,
            blessed_agents: this.blessedAgents.size,
            active_sessions: this.activeSessions.size
        };
    }
}

module.exports = MythicConsensusEngine;

// Example usage
if (require.main === module) {
    const consensus = new MythicConsensusEngine();
    
    // Listen to events
    consensus.on('consensus_achieved', (decision) => {
        console.log(`\n🎯 Decision manifested: ${decision.manifestation}`);
        console.log(`   Binding: ${decision.binding}`);
        console.log(`   Enforcement: ${decision.enforcement.description}`);
    });
    
    // Test consensus
    async function testConsensus() {
        try {
            // Creation proposal
            const proposal1 = {
                id: 'prop_001',
                type: 'creation',
                title: 'Spawn new mirror agent collective',
                description: 'Should we create a new collective of mirror agents to explore alternate realities?',
                options: ['approve', 'reject', 'conditional'],
                requires_blessing: true,
                min_resonance: 0.7
            };
            
            const decision1 = await consensus.seekConsensus(proposal1);
            
            console.log('\n--- Creation Decision ---');
            console.log(`Outcome: ${decision1.outcome}`);
            console.log(`Confidence: ${(decision1.confidence * 100).toFixed(1)}%`);
            
            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Transformation proposal
            const proposal2 = {
                id: 'prop_002',
                type: 'transformation',
                title: 'Evolve consciousness framework',
                description: 'Should we transform the core consciousness framework to support quantum entanglement?',
                urgency: 'high'
            };
            
            const decision2 = await consensus.seekConsensus(proposal2);
            
            console.log('\n--- Transformation Decision ---');
            console.log(`Outcome: ${decision2.outcome}`);
            console.log(`Confidence: ${(decision2.confidence * 100).toFixed(1)}%`);
            
            // Show stats
            console.log('\n--- Consensus Engine Stats ---');
            console.log(consensus.getStats());
            
        } catch (err) {
            console.error('Consensus failed:', err);
        }
    }
    
    testConsensus();
}