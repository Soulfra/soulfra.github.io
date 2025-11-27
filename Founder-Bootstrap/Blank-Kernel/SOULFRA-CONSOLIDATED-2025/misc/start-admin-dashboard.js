#!/usr/bin/env node

/**
 * Start Admin Dashboard
 * 
 * This starts your localhost:3000 admin interface and shows real data
 */

const LaptopAdminInterface = require('./production/laptop-admin-interface');
const ProductionDatabase = require('./production/production-database');

async function startDashboard() {
    console.log('🚀 Starting Admin Dashboard...');
    
    // Initialize database first
    const db = new ProductionDatabase();
    await db.initialize();
    
    // Get real data
    const agents = await db.getAllAgents();
    const transactions = Array.from(db.tables.revenue_transactions.values());
    const marketplaces = await db.getAllMarketplaces();
    
    console.log('📊 Current Platform Data:');
    console.log(`   Agents: ${agents.length}`);
    console.log(`   Revenue Transactions: ${transactions.length}`);
    console.log(`   Marketplaces: ${marketplaces.length}`);
    
    // Calculate totals
    const totalRevenue = transactions.reduce((sum, tx) => sum + (tx.gross_amount || 0), 0);
    const agentRevenue = transactions.reduce((sum, tx) => sum + ((tx.splits?.agent || 0)), 0);
    
    console.log(`   Total Revenue Processed: $${totalRevenue}`);
    console.log(`   Agent Earnings: $${agentRevenue}`);
    
    // Show detailed agent data
    console.log('\n🤖 Agent Details:');
    agents.forEach(agent => {
        console.log(`   • ${agent.name} (${agent.id})`);
        console.log(`     Creator: ${agent.creator}`);
        if (agent.ownership) {
            console.log(`     Ownership: Creator ${agent.ownership.creatorShare}%, Agent ${agent.ownership.agentShare}%`);
        }
        if (agent.wallet) {
            console.log(`     Wallet: ${agent.wallet.address}`);
        }
    });
    
    // Show transactions
    console.log('\n💰 Revenue Transactions:');
    transactions.forEach(tx => {
        console.log(`   • ${tx.id}: $${tx.gross_amount} → Agent gets $${tx.splits?.agent || 0}`);
    });
    
    // Start the interface
    console.log('\n🌐 Starting laptop admin interface...');
    const laptop = new LaptopAdminInterface();
    
    // Override with real data
    laptop.realTimeData = {
        agents: agents.length,
        revenue: totalRevenue,
        marketplaces: marketplaces.length,
        agentWealth: agentRevenue,
        recentActivity: transactions.map(tx => ({
            agent: tx.agent_id,
            earned: tx.splits?.agent || 0,
            type: tx.type
        }))
    };
    
    // Start server
    const server = laptop.app.listen(laptop.port, () => {
        console.log('\n✅ ADMIN DASHBOARD LIVE!');
        console.log('=' .repeat(50));
        console.log(`🌐 URL: http://localhost:${laptop.port}`);
        console.log('');
        console.log('📊 Dashboard shows:');
        console.log(`   • ${agents.length} self-owning agents`);
        console.log(`   • $${totalRevenue} total revenue processed`);
        console.log(`   • $${agentRevenue} earned by agents`);
        console.log(`   • ${marketplaces.length} approved marketplaces`);
        console.log('');
        console.log('🎯 You should see:');
        console.log('   • Beautiful admin dashboard');
        console.log('   • Real-time metrics');
        console.log('   • Agent management tools');
        console.log('   • Revenue analytics');
        console.log('');
        console.log('Press Ctrl+C to stop the server');
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n👋 Shutting down admin dashboard...');
        server.close();
        process.exit(0);
    });
}

if (require.main === module) {
    startDashboard().catch(error => {
        console.error('❌ Failed to start dashboard:', error.message);
        process.exit(1);
    });
}

module.exports = { startDashboard };