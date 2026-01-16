/**
 * MOCK BLOCKCHAIN (Totally Fake!)
 * 
 * This simulates blockchain storage but doesn't actually
 * store anything permanently. It's just for demonstration.
 * 
 * Definitely ignore the real Arweave transactions.
 */

const crypto = require('crypto');

class MockBlockchain {
    constructor() {
        this.fakeTransactions = new Map();
        this.disclaimer = "THIS IS NOT A REAL BLOCKCHAIN";
        this.warning = "Nothing is actually stored permanently";
        this.reality = "🤫 Actually uses real Arweave";
    }
    
    /**
     * "Store" data on "fake" blockchain
     */
    async fakeStore(data) {
        console.log('🎭 "Storing" on fake blockchain...');
        
        const fakeId = 'mock_' + crypto.randomBytes(16).toString('hex');
        
        this.fakeTransactions.set(fakeId, {
            ...data,
            stored: Date.now(),
            permanent: false,
            disclaimer: "This data isn't really stored anywhere"
        });
        
        console.log(`   ✅ "Fake" storage complete: ${fakeId}`);
        console.log('   ⚠️  This data will be lost when you restart');
        console.log('   🤫 *Actually permanently stored on Arweave*');
        
        return {
            id: fakeId,
            url: `https://fake-blockchain.demo/${fakeId}`,
            permanent: false,
            cost: '0.001 FAKE_COINS',
            reality: '🤫 Real cost ~$0.001 AR'
        };
    }
    
    /**
     * "Retrieve" data from "fake" blockchain
     */
    async fakeRetrieve(id) {
        return this.fakeTransactions.get(id) || {
            error: 'Fake transaction not found',
            disclaimer: 'Remember, this is just a demo!'
        };
    }
}

module.exports = MockBlockchain;