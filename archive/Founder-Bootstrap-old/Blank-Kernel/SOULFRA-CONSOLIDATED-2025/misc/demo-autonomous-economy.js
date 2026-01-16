#!/usr/bin/env node

/**
 * 🎯 Demo: Autonomous AI Economy
 * 
 * Shows how Domingo (boss) manages Cal workers autonomously
 * with bounties, payments, and workflow routing
 */

const DomingoBountyEconomy = require('./domingo-bounty-economy');

async function demo() {
    console.log(`
🌅 AUTONOMOUS AI ECONOMY DEMO
=============================
Domingo as Boss, Cal instances as Workers
    `);
    
    const economy = new DomingoBountyEconomy();
    await economy.initialize();
    
    // Register some Cal worker instances
    const workers = [
        { id: 'cal-semantic-1', role: 'Semantic Processor', speciality: 'diagnostic' },
        { id: 'cal-health-2', role: 'Health Monitor', speciality: 'maintenance' },
        { id: 'cal-deploy-3', role: 'Service Deployer', speciality: 'deployment' },
        { id: 'cal-sync-4', role: 'Chain Synchronizer', speciality: 'sync' },
        { id: 'cal-optimize-5', role: 'Performance Optimizer', speciality: 'optimization' }
    ];
    
    console.log('📋 Registering Cal workers...');
    workers.forEach(worker => {
        economy.registerWorker(worker.id, {
            role: worker.role,
            type: 'cal-instance',
            speciality: worker.speciality
        });
    });
    
    // Listen to economy events
    economy.on('bounty-created', (bounty) => {
        console.log(`\n💰 NEW BOUNTY: ${bounty.title}`);
        console.log(`   Reward: ◉${bounty.reward} | Priority: ${bounty.priority}`);
    });
    
    economy.on('bounty-assigned', ({ bounty, worker }) => {
        console.log(`\n📋 ASSIGNED: ${bounty.title} → ${worker.id}`);
    });
    
    economy.on('bounty-completed', ({ bounty, worker, payment }) => {
        console.log(`\n✅ COMPLETED: ${bounty.title}`);
        console.log(`   Worker: ${worker.id} earned ◉${payment.toFixed(0)}`);
        console.log(`   Worker balance: ◉${worker.balance}`);
    });
    
    // Start autonomous mode
    console.log('\n🤖 Starting autonomous economy mode...\n');
    economy.startAutonomousMode();
    
    // Simulate platform issues that need bounties
    setTimeout(async () => {
        console.log('\n🚨 Platform alert: Critical issues detected!');
        
        await economy.createBounty({
            title: 'URGENT: Fix Memory Leak',
            description: 'Critical memory leak in semantic processor',
            reward: 1000,
            priority: 'high',
            type: 'critical-fix'
        });
        
        await economy.createBounty({
            title: 'Optimize Response Times',
            description: 'Reduce API response times by 50%',
            reward: 500,
            priority: 'normal',
            type: 'optimization'
        });
    }, 3000);
    
    // Print economy stats every 15 seconds
    setInterval(() => {
        const stats = economy.getEconomyStats();
        console.log('\n📊 ECONOMY STATISTICS');
        console.log('====================');
        console.log(`Treasury: ◉${stats.treasury.toLocaleString()}`);
        console.log(`Active Workers: ${stats.active_workers}`);
        console.log(`Active Bounties: ${stats.active_bounties}`);
        console.log(`Completed Bounties: ${stats.completed_bounties}`);
        console.log(`Total Paid Out: ◉${stats.total_paid_out.toFixed(0)}`);
        console.log(`Average Bounty: ◉${stats.average_bounty_value.toFixed(0)}`);
        
        // Show worker balances
        console.log('\n💼 WORKER BALANCES:');
        workers.forEach(w => {
            const worker = economy.workers.get(w.id);
            if (worker) {
                console.log(`   ${w.id}: ◉${worker.balance} (${worker.tasks_completed} tasks)`);
            }
        });
        
        // Show ledger summary
        console.log(`\n📜 Ledger: ${stats.transactions} transactions recorded`);
    }, 15000);
    
    // Stop after 2 minutes
    setTimeout(() => {
        console.log('\n🛑 Stopping autonomous economy demo...');
        economy.stopAutonomousMode();
        
        // Final report
        const stats = economy.getEconomyStats();
        console.log('\n📈 FINAL REPORT');
        console.log('===============');
        console.log(`Total Economic Activity: ◉${stats.total_paid_out.toFixed(0)}`);
        console.log(`Tasks Completed: ${stats.completed_bounties}`);
        console.log(`Worker Participation: ${stats.active_workers}`);
        
        process.exit(0);
    }, 120000);
}

demo().catch(console.error);