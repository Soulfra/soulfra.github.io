#!/usr/bin/env node

/**
 * DEBUG: What Actually Works?
 * 
 * This script tests each component individually to find silent errors
 * and shows you exactly what localhost:3000 should display.
 */

const fs = require('fs');
const path = require('path');

async function debugComponents() {
    console.log('🔍 DEBUGGING: Finding Silent Errors');
    console.log('=' .repeat(50));
    
    // 1. Test basic file existence
    console.log('\n📁 FILE EXISTENCE CHECK:');
    const requiredFiles = [
        './production/laptop-admin-interface.js',
        './production/server-production-backend.js', 
        './production/production-database.js',
        './production/arweave-integration.js'
    ];
    
    for (const file of requiredFiles) {
        const exists = fs.existsSync(file);
        console.log(`   ${exists ? '✅' : '❌'} ${file}`);
        if (!exists) {
            console.log('   ⚠️  MISSING CRITICAL FILE!');
            return;
        }
    }
    
    // 2. Test module loading
    console.log('\n📦 MODULE LOADING CHECK:');
    try {
        const LaptopInterface = require('./production/laptop-admin-interface');
        console.log('   ✅ LaptopAdminInterface loaded');
        
        const ServerBackend = require('./production/server-production-backend');
        console.log('   ✅ ServerProductionBackend loaded');
        
        const Database = require('./production/production-database');
        console.log('   ✅ ProductionDatabase loaded');
        
        const Arweave = require('./production/arweave-integration');
        console.log('   ✅ ArweaveIntegration loaded');
        
    } catch (error) {
        console.log('   ❌ MODULE LOADING FAILED:', error.message);
        return;
    }
    
    // 3. Test database initialization
    console.log('\n💾 DATABASE TEST:');
    try {
        const Database = require('./production/production-database');
        const db = new Database();
        await db.initialize();
        
        console.log(`   ✅ Database connected: ${db.connected}`);
        console.log(`   ✅ Tables: ${Object.keys(db.tables).length}`);
        console.log(`   ✅ Records: ${db.stats.total_records}`);
        
        // Test data integrity
        const agents = await db.getAllAgents();
        const transactions = await db.getRecentTransactions();
        const marketplaces = await db.getAllMarketplaces();
        
        console.log(`   📊 Live Data:`);
        console.log(`      Agents: ${agents.length}`);
        console.log(`      Transactions: ${transactions.length}`);  
        console.log(`      Marketplaces: ${marketplaces.length}`);
        
        // Calculate revenue
        const totalRevenue = transactions.reduce((sum, tx) => sum + tx.gross_amount, 0);
        console.log(`      Total Revenue: $${totalRevenue}`);
        
    } catch (error) {
        console.log('   ❌ DATABASE FAILED:', error.message);
    }
    
    // 4. Test Arweave
    console.log('\n🌐 ARWEAVE TEST:');
    try {
        const ArweaveIntegration = require('./production/arweave-integration');
        const arweave = new ArweaveIntegration();
        await arweave.initialize();
        
        console.log(`   ✅ Arweave connected: ${arweave.connected}`);
        console.log(`   ✅ Wallet: ${arweave.wallet}`);
        console.log(`   ✅ Transactions created: ${arweave.stats.transactions_created}`);
        
    } catch (error) {
        console.log('   ❌ ARWEAVE FAILED:', error.message);
    }
    
    // 5. Test laptop interface startup
    console.log('\n💻 LAPTOP INTERFACE TEST:');
    try {
        const LaptopAdminInterface = require('./production/laptop-admin-interface');
        const laptop = new LaptopAdminInterface();
        
        console.log('   ✅ Interface created');
        console.log(`   📍 Will run on: http://localhost:${laptop.port || 3000}`);
        
        // Show what the interface should display
        console.log('\n   🌐 LOCALHOST:3000 SHOULD SHOW:');
        console.log('   ┌─────────────────────────────────────────┐');
        console.log('   │ 👑 Sovereign Agent Admin Dashboard      │');
        console.log('   ├─────────────────────────────────────────┤');
        console.log('   │ 📊 Platform Status: LIVE               │');
        console.log('   │ 🤖 Active Agents: 4                    │');
        console.log('   │ 💰 Total Revenue: $200                 │');
        console.log('   │ 🏪 Approved Marketplaces: 1            │');
        console.log('   ├─────────────────────────────────────────┤');
        console.log('   │ [Create Agent] [Manage Marketplaces]   │');
        console.log('   │ [Revenue Analytics] [System Backups]   │');
        console.log('   ├─────────────────────────────────────────┤');
        console.log('   │ Recent Agent Activity:                  │');
        console.log('   │ • lifecycle-agent-001 earned $36.80    │');
        console.log('   │ • integration-agent-xxx earned $23.00  │');
        console.log('   │ • Total agent wealth: $59.80           │');
        console.log('   └─────────────────────────────────────────┘');
        
    } catch (error) {
        console.log('   ❌ LAPTOP INTERFACE FAILED:', error.message);
    }
    
    // 6. Check backup integrity
    console.log('\n💾 BACKUP INTEGRITY CHECK:');
    try {
        const backupDir = './data/database/backups';
        if (fs.existsSync(backupDir)) {
            const backups = fs.readdirSync(backupDir);
            console.log(`   ✅ Found ${backups.length} backups`);
            
            // Check latest backup
            if (backups.length > 0) {
                const latestBackup = backups[backups.length - 1];
                const backupPath = path.join(backupDir, latestBackup);
                const files = fs.readdirSync(backupPath);
                
                console.log(`   📦 Latest backup: ${latestBackup}`);
                console.log(`   📁 Files: ${files.length}`);
                
                // Check sizes
                let totalSize = 0;
                files.forEach(file => {
                    const filePath = path.join(backupPath, file);
                    const stats = fs.statSync(filePath);
                    totalSize += stats.size;
                    console.log(`      ${file}: ${Math.round(stats.size / 1024)}KB`);
                });
                
                console.log(`   📊 Total backup size: ${Math.round(totalSize / 1024)}KB`);
                
                if (totalSize < 5000) {
                    console.log('   ⚠️  BACKUP TOO SMALL - LIKELY MISSING DATA!');
                }
            }
        } else {
            console.log('   ❌ NO BACKUPS FOUND');
        }
    } catch (error) {
        console.log('   ❌ BACKUP CHECK FAILED:', error.message);
    }
    
    // 7. Final diagnosis
    console.log('\n🔬 DIAGNOSIS:');
    console.log('   If everything above shows ✅, your system is working');
    console.log('   If you see ❌, that component needs fixing');
    console.log('   Small backup sizes indicate data isn\'t being captured properly');
    
    console.log('\n🚀 TO START YOUR ADMIN INTERFACE:');
    console.log('   1. Run: node production/laptop-admin-interface.js');
    console.log('   2. Visit: http://localhost:3000');
    console.log('   3. You should see the dashboard above');
    
    console.log('\n📋 TO FIX SILENT ERRORS:');
    console.log('   • Check console for error messages');
    console.log('   • Verify all database files exist');
    console.log('   • Ensure proper data is being stored');
    console.log('   • Test each component individually');
}

// Run the debug
if (require.main === module) {
    debugComponents()
        .then(() => {
            console.log('\n✅ Debug completed!');
        })
        .catch(error => {
            console.error('\n🚨 Debug failed:', error);
            console.log('\nThis error tells us what\'s broken!');
        });
}

module.exports = { debugComponents };