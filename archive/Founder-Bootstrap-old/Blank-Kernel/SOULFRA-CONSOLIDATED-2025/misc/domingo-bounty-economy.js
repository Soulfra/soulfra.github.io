#!/usr/bin/env node

/**
 * 💰 Domingo Bounty Economy System
 * 
 * Domingo acts as the boss, managing bounties and paying Cal workers
 * Autonomous workflow routing based on economic incentives
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const crypto = require('crypto');

class DomingoBountyEconomy extends EventEmitter {
    constructor() {
        super();
        
        // Economic configuration
        this.economy = {
            currency: 'Resonance',
            symbol: '◉',
            treasury: 1000000, // Domingo's treasury
            base_wage: 100,    // Base payment per task
            performance_bonus: 0.5, // 50% bonus for excellent work
            drift_penalty: 0.2  // 20% penalty for high drift
        };
        
        // Ledger storage
        this.ledgerFile = './economy-ledger.json';
        this.bountyBoardFile = './bounty-board.json';
        
        // Active bounties
        this.bounties = new Map();
        
        // Worker registry
        this.workers = new Map();
        
        // Transaction history
        this.transactions = [];
        
        // Autonomous settings
        this.autonomous = {
            enabled: true,
            bounty_creation_interval: 30000, // 30 seconds
            payment_processing_interval: 15000, // 15 seconds
            workflow_routing_interval: 20000 // 20 seconds
        };
    }
    
    async initialize() {
        await this.loadLedger();
        await this.loadBountyBoard();
        
        // Register Domingo as the treasury holder
        this.registerWorker('domingo', {
            type: 'boss',
            balance: this.economy.treasury,
            role: 'Platform Orchestrator',
            can_create_bounties: true,
            can_pay_workers: true
        });
        
        console.log(`💰 Domingo Bounty Economy initialized with ${this.economy.symbol}${this.economy.treasury} in treasury`);
    }
    
    async loadLedger() {
        try {
            const data = await fs.readFile(this.ledgerFile, 'utf8');
            const ledger = JSON.parse(data);
            this.transactions = ledger.transactions || [];
            this.economy.treasury = ledger.treasury || this.economy.treasury;
        } catch (error) {
            // Initialize new ledger
            await this.saveLedger();
        }
    }
    
    async saveLedger() {
        const ledger = {
            currency: this.economy.currency,
            symbol: this.economy.symbol,
            treasury: this.economy.treasury,
            last_updated: new Date().toISOString(),
            total_transactions: this.transactions.length,
            transactions: this.transactions.slice(-1000) // Keep last 1000
        };
        
        await fs.writeFile(this.ledgerFile, JSON.stringify(ledger, null, 2));
    }
    
    async loadBountyBoard() {
        try {
            const data = await fs.readFile(this.bountyBoardFile, 'utf8');
            const board = JSON.parse(data);
            
            // Restore bounties
            board.active_bounties.forEach(bounty => {
                this.bounties.set(bounty.id, bounty);
            });
        } catch (error) {
            // Initialize empty board
            await this.saveBountyBoard();
        }
    }
    
    async saveBountyBoard() {
        const board = {
            last_updated: new Date().toISOString(),
            active_bounties: Array.from(this.bounties.values()),
            total_bounties: this.bounties.size
        };
        
        await fs.writeFile(this.bountyBoardFile, JSON.stringify(board, null, 2));
    }
    
    registerWorker(workerId, workerData) {
        this.workers.set(workerId, {
            id: workerId,
            balance: workerData.balance || 0,
            type: workerData.type || 'cal-instance',
            role: workerData.role || 'Worker',
            reputation: 1.0,
            tasks_completed: 0,
            total_earned: 0,
            registered_at: new Date().toISOString(),
            ...workerData
        });
        
        console.log(`👷 Registered worker: ${workerId} (${workerData.role})`);
    }
    
    async createBounty(bountyData) {
        const bounty = {
            id: crypto.randomUUID(),
            title: bountyData.title,
            description: bountyData.description,
            type: bountyData.type || 'general',
            reward: bountyData.reward || this.economy.base_wage,
            priority: bountyData.priority || 'normal',
            created_by: 'domingo',
            created_at: new Date().toISOString(),
            status: 'open',
            assigned_to: null,
            completed_at: null,
            performance_metrics: {}
        };
        
        this.bounties.set(bounty.id, bounty);
        await this.saveBountyBoard();
        
        this.emit('bounty-created', bounty);
        
        console.log(`💰 New bounty created: ${bounty.title} (${this.economy.symbol}${bounty.reward})`);
        
        return bounty;
    }
    
    async assignBounty(bountyId, workerId) {
        const bounty = this.bounties.get(bountyId);
        const worker = this.workers.get(workerId);
        
        if (!bounty || !worker) {
            throw new Error('Invalid bounty or worker');
        }
        
        if (bounty.status !== 'open') {
            throw new Error('Bounty not available');
        }
        
        bounty.status = 'assigned';
        bounty.assigned_to = workerId;
        bounty.assigned_at = new Date().toISOString();
        
        await this.saveBountyBoard();
        
        this.emit('bounty-assigned', { bounty, worker });
        
        console.log(`📋 Bounty assigned: ${bounty.title} → ${workerId}`);
    }
    
    async completeBounty(bountyId, performance = {}) {
        const bounty = this.bounties.get(bountyId);
        if (!bounty || bounty.status !== 'assigned') {
            throw new Error('Invalid bounty state');
        }
        
        const worker = this.workers.get(bounty.assigned_to);
        if (!worker) {
            throw new Error('Worker not found');
        }
        
        // Calculate payment based on performance
        let payment = bounty.reward;
        
        // Apply performance bonus
        if (performance.quality === 'excellent') {
            payment *= (1 + this.economy.performance_bonus);
        }
        
        // Apply drift penalty
        if (performance.drift && performance.drift > 0.3) {
            payment *= (1 - this.economy.drift_penalty);
        }
        
        // Process payment
        await this.processPayment('domingo', bounty.assigned_to, payment, `Bounty: ${bounty.title}`);
        
        // Update bounty status
        bounty.status = 'completed';
        bounty.completed_at = new Date().toISOString();
        bounty.performance_metrics = performance;
        bounty.final_payment = payment;
        
        // Update worker stats
        worker.tasks_completed++;
        worker.total_earned += payment;
        
        await this.saveBountyBoard();
        
        this.emit('bounty-completed', { bounty, worker, payment });
        
        console.log(`✅ Bounty completed: ${bounty.title} - Paid ${this.economy.symbol}${payment} to ${worker.id}`);
    }
    
    async processPayment(from, to, amount, description) {
        const sender = this.workers.get(from);
        const receiver = this.workers.get(to);
        
        if (!sender || !receiver) {
            throw new Error('Invalid sender or receiver');
        }
        
        if (sender.balance < amount) {
            throw new Error('Insufficient funds');
        }
        
        // Transfer funds
        sender.balance -= amount;
        receiver.balance += amount;
        
        // Record transaction
        const transaction = {
            id: crypto.randomUUID(),
            from,
            to,
            amount,
            description,
            timestamp: new Date().toISOString(),
            type: 'payment'
        };
        
        this.transactions.push(transaction);
        
        // Update treasury if Domingo is involved
        if (from === 'domingo') {
            this.economy.treasury = sender.balance;
        }
        
        await this.saveLedger();
        
        return transaction;
    }
    
    // Autonomous bounty creation based on platform needs
    async generateAutonomousBounties() {
        const bountyTypes = [
            {
                title: 'Health Check Analysis',
                description: 'Perform comprehensive health check and report issues',
                type: 'diagnostic',
                reward: 150
            },
            {
                title: 'Drift Reduction',
                description: 'Reduce semantic drift below 20% threshold',
                type: 'maintenance',
                reward: 200
            },
            {
                title: 'Service Deployment',
                description: 'Deploy and verify new service instance',
                type: 'deployment',
                reward: 250
            },
            {
                title: 'Chain Synchronization',
                description: 'Ensure consciousness chain is synchronized',
                type: 'sync',
                reward: 100
            },
            {
                title: 'Performance Optimization',
                description: 'Optimize service response times',
                type: 'optimization',
                reward: 300
            }
        ];
        
        // Create 1-3 random bounties
        const count = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < count; i++) {
            const bountyType = bountyTypes[Math.floor(Math.random() * bountyTypes.length)];
            await this.createBounty({
                ...bountyType,
                priority: Math.random() > 0.7 ? 'high' : 'normal'
            });
        }
    }
    
    // Autonomous workflow routing - match workers to bounties
    async routeWorkflows() {
        const openBounties = Array.from(this.bounties.values())
            .filter(b => b.status === 'open')
            .sort((a, b) => {
                // Prioritize by reward and priority
                const scoreA = a.reward * (a.priority === 'high' ? 2 : 1);
                const scoreB = b.reward * (b.priority === 'high' ? 2 : 1);
                return scoreB - scoreA;
            });
        
        const availableWorkers = Array.from(this.workers.values())
            .filter(w => w.type === 'cal-instance' && w.reputation > 0.5);
        
        // Match workers to bounties
        for (const bounty of openBounties) {
            if (availableWorkers.length === 0) break;
            
            // Find best worker for this bounty type
            const bestWorker = availableWorkers.sort((a, b) => {
                // Score based on reputation and experience
                const scoreA = a.reputation * (a.tasks_completed + 1);
                const scoreB = b.reputation * (b.tasks_completed + 1);
                return scoreB - scoreA;
            })[0];
            
            if (bestWorker) {
                await this.assignBounty(bounty.id, bestWorker.id);
                
                // Remove worker from available pool
                const index = availableWorkers.indexOf(bestWorker);
                availableWorkers.splice(index, 1);
            }
        }
    }
    
    // Start autonomous operations
    startAutonomousMode() {
        if (!this.autonomous.enabled) return;
        
        console.log('🤖 Starting autonomous bounty economy...');
        
        // Bounty creation daemon
        this.bountyCreationTimer = setInterval(async () => {
            await this.generateAutonomousBounties();
        }, this.autonomous.bounty_creation_interval);
        
        // Workflow routing daemon
        this.workflowRoutingTimer = setInterval(async () => {
            await this.routeWorkflows();
        }, this.autonomous.workflow_routing_interval);
        
        // Payment processing daemon (simulate work completion)
        this.paymentProcessingTimer = setInterval(async () => {
            // Check assigned bounties and simulate completion
            const assignedBounties = Array.from(this.bounties.values())
                .filter(b => b.status === 'assigned');
            
            for (const bounty of assignedBounties) {
                // Simulate work completion (in real system, Cal would report completion)
                const performance = {
                    quality: Math.random() > 0.3 ? 'excellent' : 'good',
                    drift: Math.random() * 0.5,
                    time_taken: Math.floor(Math.random() * 300) + 60 // 1-6 minutes
                };
                
                await this.completeBounty(bounty.id, performance);
            }
        }, this.autonomous.payment_processing_interval);
    }
    
    stopAutonomousMode() {
        console.log('🛑 Stopping autonomous operations...');
        
        clearInterval(this.bountyCreationTimer);
        clearInterval(this.workflowRoutingTimer);
        clearInterval(this.paymentProcessingTimer);
    }
    
    // Get economy statistics
    getEconomyStats() {
        const totalInCirculation = Array.from(this.workers.values())
            .reduce((sum, worker) => sum + worker.balance, 0);
        
        const completedBounties = Array.from(this.bounties.values())
            .filter(b => b.status === 'completed');
        
        const totalPaidOut = completedBounties
            .reduce((sum, bounty) => sum + (bounty.final_payment || 0), 0);
        
        return {
            currency: this.economy.currency,
            symbol: this.economy.symbol,
            treasury: this.economy.treasury,
            total_in_circulation: totalInCirculation,
            active_workers: this.workers.size - 1, // Exclude Domingo
            active_bounties: Array.from(this.bounties.values()).filter(b => b.status === 'open').length,
            completed_bounties: completedBounties.length,
            total_paid_out: totalPaidOut,
            average_bounty_value: totalPaidOut / (completedBounties.length || 1),
            transactions: this.transactions.length
        };
    }
}

// Export for use by Domingo
module.exports = DomingoBountyEconomy;

// Run standalone if called directly
if (require.main === module) {
    async function demo() {
        const economy = new DomingoBountyEconomy();
        await economy.initialize();
        
        // Register some Cal workers
        economy.registerWorker('cal-1', { role: 'Semantic Processor' });
        economy.registerWorker('cal-2', { role: 'Health Monitor' });
        economy.registerWorker('cal-3', { role: 'Service Deployer' });
        
        // Start autonomous mode
        economy.startAutonomousMode();
        
        // Print stats every 10 seconds
        setInterval(() => {
            const stats = economy.getEconomyStats();
            console.log('\n📊 Economy Statistics:');
            console.log(`Treasury: ${stats.symbol}${stats.treasury}`);
            console.log(`Active Workers: ${stats.active_workers}`);
            console.log(`Active Bounties: ${stats.active_bounties}`);
            console.log(`Completed Bounties: ${stats.completed_bounties}`);
            console.log(`Total Paid Out: ${stats.symbol}${stats.total_paid_out.toFixed(2)}`);
        }, 10000);
    }
    
    demo().catch(console.error);
}