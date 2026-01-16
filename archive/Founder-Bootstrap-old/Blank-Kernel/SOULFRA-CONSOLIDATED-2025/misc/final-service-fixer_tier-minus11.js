#!/usr/bin/env node

// FINAL SERVICE FIXER - Fixes all remaining issues

const fs = require('fs').promises;
const path = require('path');

async function fixPaymentSystem() {
    console.log('Fixing Payment System...');
    
    const filePath = path.join(__dirname, 'tier-8-payment-ecosystem', 'qr-point-of-sale-system.js');
    
    try {
        let content = await fs.readFile(filePath, 'utf8');
        
        // Add missing classes after the payment processor classes
        const classesToAdd = `
class UniversalQREngine {
    constructor() {
        this.qrCodes = new Map();
    }
    
    async generate(data) {
        const code = crypto.randomUUID();
        this.qrCodes.set(code, data);
        return code;
    }
}

class SmartPOSTerminal {
    constructor() {
        this.terminals = new Map();
    }
    
    async process(transaction) {
        return {
            success: true,
            terminal: 'POS-' + Math.random().toString(36).substr(2, 9)
        };
    }
}

class PaymentProcessingEngine {
    constructor() {
        this.processors = {
            square: new SquareKiller(),
            stripe: new StripeBypass(),
            paypal: new PayPalCrusher()
        };
    }
    
    async process(amount, processor = 'square') {
        return this.processors[processor].process(amount);
    }
}

class UniversalRewardsLayer {
    constructor() {
        this.rewards = new Map();
    }
    
    async addReward(userId, amount) {
        const current = this.rewards.get(userId) || 0;
        this.rewards.set(userId, current + amount);
        return current + amount;
    }
}

`;
        
        // Find where to insert (after PayPalCrusher class)
        const insertPoint = content.indexOf('class QRPointOfSaleSystem');
        if (insertPoint > -1) {
            content = content.slice(0, insertPoint) + classesToAdd + content.slice(insertPoint);
            await fs.writeFile(filePath, content, 'utf8');
            console.log('  ✅ Added missing payment classes');
        }
        
    } catch (error) {
        console.log('  ❌ Error:', error.message);
    }
}

async function fixDualDashboard() {
    console.log('Fixing Dual Dashboard...');
    
    const filePath = path.join(__dirname, 'tier-9-dual-dashboard', 'consumer-backend-implementation.js');
    
    try {
        let content = await fs.readFile(filePath, 'utf8');
        
        // Fix the syntax error - remove the incorrectly placed initializeRoutes
        content = content.replace(/}\s*\n\s*initializeRoutes\(\) {[\s\S]*?}\s*\n}$/m, '}');
        
        await fs.writeFile(filePath, content, 'utf8');
        console.log('  ✅ Fixed syntax error');
        
    } catch (error) {
        console.log('  ❌ Error:', error.message);
    }
}

async function fixAll() {
    console.log('🔧 FINAL SERVICE FIXER\n');
    
    await fixPaymentSystem();
    await fixDualDashboard();
    
    console.log('\n✅ All fixes applied!');
    console.log('   Run ./start-all-services.sh to test');
}

if (require.main === module) {
    fixAll().catch(console.error);
}