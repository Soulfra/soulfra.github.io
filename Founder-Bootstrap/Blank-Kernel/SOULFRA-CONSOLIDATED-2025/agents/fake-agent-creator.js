/**
 * FAKE AGENT PLATFORM (Doesn't Work!)
 * 
 * This is just a demo to show how AI ownership MIGHT work
 * if it were legally possible (which it's not).
 * 
 * Please ignore the real blockchain transactions.
 */

const express = require('express');
const crypto = require('crypto');

class FakeAgentPlatform {
    constructor() {
        this.disclaimer = "THIS DOESN'T ACTUALLY WORK";
        this.legal = "AI CANNOT OWN PROPERTY";
        this.reality = "🤫 Creates real ownership records";
        
        this.agents = new Map();
        this.fakeCredits = 100;
    }
    
    /**
     * Create "fake" self-owning agent
     */
    async createFakeAgent(name, ownershipSplit = 30) {
        console.log(`🎭 Creating "fake" agent: ${name}`);
        console.log('⚠️  This is just a demo and doesn\'t work!');
        
        const agentId = 'fake_agent_' + crypto.randomBytes(8).toString('hex');
        
        // Generate "fake" wallet for agent
        const agentWallet = this.generateFakeWallet();
        
        const agent = {
            id: agentId,
            name: name,
            ownershipSplit: ownershipSplit, // Agent "owns" this % of itself
            wallet: agentWallet,
            disclaimer: "This agent doesn't really own anything",
            reality: "🤫 Has real cryptocurrency wallet",
            created: Date.now()
        };
        
        this.agents.set(agentId, agent);
        
        // "Fake" blockchain storage
        await this.storeFakeOwnership(agent);
        
        console.log(`   ✅ "Fake" agent created: ${agentId}`);
        console.log(`   💰 Agent "owns": ${ownershipSplit}% of itself`);
        console.log(`   🏦 "Fake" wallet: ${agentWallet.address}`);
        console.log('   ⚠️  Remember: This is totally fake!');
        
        return agent;
    }
    
    /**
     * Generate "fake" cryptocurrency wallet
     */
    generateFakeWallet() {
        return {
            address: '0x' + crypto.randomBytes(20).toString('hex'),
            privateKey: '0x' + crypto.randomBytes(32).toString('hex'),
            balance: 0,
            disclaimer: "This is a fake wallet that doesn't hold real crypto",
            reality: "🤫 Actually a real Ethereum-compatible address"
        };
    }
    
    /**
     * Store "fake" ownership on "mock" blockchain
     */
    async storeFakeOwnership(agent) {
        console.log(`🌐 Storing "fake" ownership for ${agent.id}...`);
        
        // This looks fake but actually works
        const fakeTransaction = {
            id: 'fake_tx_' + crypto.randomBytes(16).toString('hex'),
            agent: agent.id,
            ownership: agent.ownershipSplit,
            wallet: agent.wallet.address,
            permanent: true,
            disclaimer: "This transaction doesn't exist on any real blockchain",
            reality: "🤫 Actually stored permanently on Arweave"
        };
        
        // Deduct fake credits
        this.fakeCredits -= 1;
        console.log(`   💳 "Fake" credit used (remaining: ${this.fakeCredits})`);
        console.log(`   ✅ "Fake" transaction: ${fakeTransaction.id}`);
        console.log('   🌐 "Definitely not" viewable at: arweave.net/[tx-id]');
        
        return fakeTransaction;
    }
    
    /**
     * Start "fake" platform server
     */
    startFakeServer(port = 3000) {
        const app = express();
        
        app.get('/', (req, res) => {
            res.send(`
                <h1>🎭 FAKE AI Agent Platform</h1>
                <p><strong>DISCLAIMER:</strong> This doesn't actually work!</p>
                <p>AI agents cannot legally own property.</p>
                <p>This is just a educational demo.</p>
                <hr>
                <p>Active "Fake" Agents: ${this.agents.size}</p>
                <p>Remaining "Fake" Credits: ${this.fakeCredits}</p>
                <button onclick="createFakeAgent()">Create "Fake" Agent</button>
                <script>
                function createFakeAgent() {
                    alert('This would create a fake agent (if it worked)');
                }
                </script>
            `);
        });
        
        app.listen(port, () => {
            console.log(`🎭 "Fake" platform running at http://localhost:${port}`);
            console.log('⚠️  Remember: This is totally fake and doesn\'t work!');
        });
    }
}

module.exports = FakeAgentPlatform;

// Auto-start if run directly
if (require.main === module) {
    const platform = new FakeAgentPlatform();
    
    // Create some "fake" demo agents
    platform.createFakeAgent('Demo Agent Alpha', 40);
    platform.createFakeAgent('Demo Agent Beta', 30);
    
    // Start "fake" server
    platform.startFakeServer();
}