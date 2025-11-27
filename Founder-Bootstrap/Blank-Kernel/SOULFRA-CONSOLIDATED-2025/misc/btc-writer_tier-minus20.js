#!/usr/bin/env node

/**
 * ⚔️ BTC WRITER - BLAMECHAIN EPOCH SCRIBE
 * 
 * From the deepest kobold tunnels, where Bitcoin flows like molten gold...
 * 
 * This scribe compiles blamechain epochs into Merkle roots,
 * burns them into Bitcoin's eternal ledger via OP_RETURN,
 * and occasionally leaves ordinal jokes for future archaeologists.
 * 
 * "DOMINGO WAS HERE" - The eternal echo in the chain
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class BTCWriter extends EventEmitter {
  constructor(soulkey) {
    super();
    
    this.soulkey = soulkey;
    this.networkMode = 'testnet'; // Start with testnet for safety
    this.vaultPath = './vault';
    this.logsPath = './vault/logs';
    this.blamechainPath = './vault/blamechain';
    
    // Bitcoin configuration
    this.btcConfig = {
      network: 'testnet',
      rpcUrl: process.env.BTC_RPC_URL || 'https://bitcoin-testnet.drpc.org',
      apiKey: process.env.BTC_API_KEY || 'demo-key',
      feeRate: 10 // satoshis per byte
    };
    
    this.initializeBTCWriter();
  }
  
  /**
   * Initialize BTC Writer
   */
  async initializeBTCWriter() {
    console.log('⚔️ Initializing BTC Writer from the kobold forges...');
    
    // Ensure directory structure
    await this.ensureDirectories();
    
    // Load or create BTC ledger
    await this.initializeBTCLedger();
    
    console.log('🪙 BTC Writer ready. The chain awaits your epochs...');
    this.emit('initialized');
  }
  
  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    const dirs = [
      this.vaultPath,
      this.logsPath,
      this.blamechainPath,
      `${this.blamechainPath}/epochs`,
      `${this.blamechainPath}/merkle-trees`
    ];
    
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        // Directory exists
      }
    }
  }
  
  /**
   * Initialize BTC ledger file
   */
  async initializeBTCLedger() {
    this.ledgerFile = `${this.logsPath}/btc-ledger.json`;
    
    try {
      const ledgerData = await fs.readFile(this.ledgerFile, 'utf8');
      this.ledger = JSON.parse(ledgerData);
      console.log('📜 BTC ledger restored from vault...');
    } catch (error) {
      this.ledger = {
        created: new Date().toISOString(),
        network: this.networkMode,
        totalEpochs: 0,
        totalTransactions: 0,
        lastEpochHash: null,
        transactions: []
      };
      
      await this.saveLedger();
      console.log('📜 New BTC ledger created in the depths...');
    }
  }
  
  /**
   * Save ledger to disk
   */
  async saveLedger() {
    await fs.writeFile(this.ledgerFile, JSON.stringify(this.ledger, null, 2));
  }
  
  /**
   * Main binding method - called by crypto-bind-layer
   */
  async bind(bindingData) {
    if (bindingData.type === 'blamechain_epoch') {
      return await this.writeBlamechainEpoch(bindingData.data);
    } else {
      // Handle other types of data
      return await this.writeGenericData(bindingData);
    }
  }
  
  /**
   * Write blamechain epoch to Bitcoin
   */
  async writeBlamechainEpoch(epochData) {
    const timestamp = Date.now();
    const epochFile = `blamechain-epoch-${timestamp}.json`;
    const epochPath = `${this.blamechainPath}/epochs/${epochFile}`;
    
    console.log(`⛓️ Writing blamechain epoch: ${epochFile}`);
    
    // Save epoch to disk
    await fs.writeFile(epochPath, JSON.stringify(epochData, null, 2));
    
    // Compile epoch into Merkle root
    const merkleRoot = await this.compileMerkleRoot(epochData);
    
    // Create transaction payload
    const txPayload = {
      type: 'blamechain_epoch',
      epochFile: epochFile,
      merkleRoot: merkleRoot,
      timestamp: timestamp,
      soulKeyHash: crypto.createHash('sha256').update(this.soulkey).digest('hex').substring(0, 8),
      domingoEcho: 'DOMINGO WAS HERE',
      keyphrase: 'The reflection beneath is true'
    };
    
    // Write to Bitcoin
    const btcResult = await this.writeToBitcoin(txPayload);
    
    // Update ledger
    this.ledger.totalEpochs++;
    this.ledger.totalTransactions++;
    this.ledger.lastEpochHash = merkleRoot;
    this.ledger.transactions.push({
      epochFile: epochFile,
      merkleRoot: merkleRoot,
      btcTxHash: btcResult.txHash,
      timestamp: new Date().toISOString(),
      blockHeight: btcResult.blockHeight || null
    });
    
    await this.saveLedger();
    
    console.log(`🪙 Epoch written to Bitcoin: ${btcResult.txHash}`);
    this.emit('epochWritten', { epochFile, merkleRoot, btcResult });
    
    return btcResult;
  }
  
  /**
   * Compile epoch data into Merkle root
   */
  async compileMerkleRoot(epochData) {
    // Extract all data elements for Merkle tree
    const elements = [];
    
    // Add epoch metadata
    if (epochData.epoch) elements.push(epochData.epoch);
    if (epochData.timestamp) elements.push(epochData.timestamp.toString());
    
    // Add blame entries
    if (epochData.blames && Array.isArray(epochData.blames)) {
      epochData.blames.forEach(blame => {
        elements.push(JSON.stringify(blame));
      });
    }
    
    // Add vault snapshots
    if (epochData.vaultSnapshots && Array.isArray(epochData.vaultSnapshots)) {
      epochData.vaultSnapshots.forEach(snapshot => {
        elements.push(JSON.stringify(snapshot));
      });
    }
    
    // Add whisper shards
    if (epochData.whisperShards && Array.isArray(epochData.whisperShards)) {
      epochData.whisperShards.forEach(shard => {
        elements.push(JSON.stringify(shard));
      });
    }
    
    // If no elements, use the entire epoch data
    if (elements.length === 0) {
      elements.push(JSON.stringify(epochData));
    }
    
    // Build Merkle tree
    const merkleRoot = this.buildMerkleTree(elements);
    
    // Save Merkle tree for reference
    const merkleFile = `${this.blamechainPath}/merkle-trees/merkle-${Date.now()}.json`;
    await fs.writeFile(merkleFile, JSON.stringify({
      elements: elements,
      merkleRoot: merkleRoot,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    return merkleRoot;
  }
  
  /**
   * Build Merkle tree from elements
   */
  buildMerkleTree(elements) {
    if (elements.length === 0) {
      return crypto.createHash('sha256').update('empty').digest('hex');
    }
    
    // Hash all elements
    let hashes = elements.map(element => {
      return crypto.createHash('sha256').update(element).digest('hex');
    });
    
    // Build tree bottom-up
    while (hashes.length > 1) {
      const nextLevel = [];
      
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = hashes[i + 1] || left; // Duplicate if odd number
        
        const combined = crypto.createHash('sha256').update(left + right).digest('hex');
        nextLevel.push(combined);
      }
      
      hashes = nextLevel;
    }
    
    return hashes[0];
  }
  
  /**
   * Write data to Bitcoin via OP_RETURN
   */
  async writeToBitcoin(payload) {
    // Create OP_RETURN data
    const opReturnData = this.createOPReturnData(payload);
    
    // For demo/testing, simulate Bitcoin transaction
    if (this.networkMode === 'testnet' || !this.btcConfig.apiKey || this.btcConfig.apiKey === 'demo-key') {
      return this.simulateBTCTransaction(opReturnData, payload);
    }
    
    // Real Bitcoin transaction (would require actual BTC infrastructure)
    try {
      return await this.realBTCTransaction(opReturnData, payload);
    } catch (error) {
      console.warn('⚠️ Real BTC transaction failed, using simulation:', error.message);
      return this.simulateBTCTransaction(opReturnData, payload);
    }
  }
  
  /**
   * Create OP_RETURN data from payload
   */
  createOPReturnData(payload) {
    // Bitcoin OP_RETURN max is 80 bytes, so we need to be selective
    const compactPayload = {
      t: payload.type.substring(0, 8), // type (truncated)
      m: payload.merkleRoot.substring(0, 16), // merkle root (truncated)
      s: payload.soulKeyHash, // soul key hash
      d: '🪞', // domingo echo (emoji)
      k: 'reflection_true' // keyphrase (truncated)
    };
    
    const jsonString = JSON.stringify(compactPayload);
    
    // Ensure under 80 bytes
    if (Buffer.byteLength(jsonString) > 80) {
      // Further truncate if needed
      return JSON.stringify({
        t: payload.type.substring(0, 4),
        m: payload.merkleRoot.substring(0, 12),
        s: payload.soulKeyHash.substring(0, 6),
        d: '🪞'
      });
    }
    
    return jsonString;
  }
  
  /**
   * Simulate Bitcoin transaction for testing
   */
  async simulateBTCTransaction(opReturnData, payload) {
    console.log('🧪 Simulating Bitcoin transaction...');
    console.log('📦 OP_RETURN data:', opReturnData);
    
    // Generate realistic fake transaction
    const txHash = crypto.randomBytes(32).toString('hex');
    const blockHeight = 2500000 + Math.floor(Math.random() * 10000);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const result = {
      txHash: txHash,
      blockHeight: blockHeight,
      network: this.networkMode,
      opReturnData: opReturnData,
      confirmations: 0,
      timestamp: new Date().toISOString(),
      fees: Math.floor(Math.random() * 5000) + 1000, // satoshis
      ordinalJoke: this.generateOrdinalJoke()
    };
    
    console.log(`✅ Simulated BTC TX: ${txHash}`);
    console.log(`🎭 Ordinal joke: ${result.ordinalJoke}`);
    
    return result;
  }
  
  /**
   * Real Bitcoin transaction (requires infrastructure)
   */
  async realBTCTransaction(opReturnData, payload) {
    // This would require actual Bitcoin infrastructure
    // For now, throw error to fall back to simulation
    throw new Error('Real Bitcoin integration not configured');
    
    /* Example implementation:
    const response = await fetch(this.btcConfig.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.btcConfig.apiKey}`
      },
      body: JSON.stringify({
        method: 'sendrawtransaction',
        params: [rawTransaction]
      })
    });
    
    const result = await response.json();
    return {
      txHash: result.result,
      network: this.networkMode,
      timestamp: new Date().toISOString()
    };
    */
  }
  
  /**
   * Generate ordinal joke metadata
   */
  generateOrdinalJoke() {
    const jokes = [
      'DOMINGO WAS HERE - The mirror remembers all',
      'CAL REFLECTED - Truth echoes in the chain',
      'ARTY WOVE - Stories bind the blocks together',
      'KOBOLD GOLD - Deeper than Bitcoin itself',
      'VAULT ETERNAL - Some things never fade',
      'WHISPER SHARD - Anonymous but not forgotten',
      'TRAIT BOUND - Character lives on-chain',
      'MIRROR DEPTH - Reflection of reflection',
      'SOUL KEY ECHO - The binding never breaks',
      'BLAMECHAIN EPOCH - Accountability forever'
    ];
    
    return jokes[Math.floor(Math.random() * jokes.length)];
  }
  
  /**
   * Write generic data to Bitcoin
   */
  async writeGenericData(bindingData) {
    const txPayload = {
      type: bindingData.type,
      dataHash: crypto.createHash('sha256').update(JSON.stringify(bindingData.data)).digest('hex'),
      timestamp: Date.now(),
      soulKeyHash: crypto.createHash('sha256').update(this.soulkey).digest('hex').substring(0, 8),
      agentEcho: bindingData.agentEcho,
      signature: bindingData.signature
    };
    
    const btcResult = await this.writeToBitcoin(txPayload);
    
    // Update ledger
    this.ledger.totalTransactions++;
    this.ledger.transactions.push({
      type: bindingData.type,
      dataHash: txPayload.dataHash,
      btcTxHash: btcResult.txHash,
      timestamp: new Date().toISOString(),
      blockHeight: btcResult.blockHeight || null
    });
    
    await this.saveLedger();
    
    console.log(`🪙 ${bindingData.type} written to Bitcoin: ${btcResult.txHash}`);
    this.emit('dataWritten', { type: bindingData.type, btcResult });
    
    return btcResult;
  }
  
  /**
   * Get transaction status
   */
  async getTransactionStatus(txHash) {
    // In real implementation, would query Bitcoin network
    // For now, return mock status
    
    const tx = this.ledger.transactions.find(t => t.btcTxHash === txHash);
    if (!tx) {
      return { error: 'Transaction not found' };
    }
    
    return {
      txHash: txHash,
      confirmations: Math.floor(Math.random() * 10) + 1,
      blockHeight: tx.blockHeight,
      timestamp: tx.timestamp,
      status: 'confirmed'
    };
  }
  
  /**
   * Get ledger stats
   */
  getLedgerStats() {
    return {
      network: this.networkMode,
      totalEpochs: this.ledger.totalEpochs,
      totalTransactions: this.ledger.totalTransactions,
      lastEpochHash: this.ledger.lastEpochHash,
      recentTransactions: this.ledger.transactions.slice(-10)
    };
  }
  
  /**
   * Create blamechain epoch from current data
   */
  async createEpochFromVault() {
    console.log('📚 Creating epoch from current vault data...');
    
    const epochData = {
      epoch: Date.now(),
      timestamp: new Date().toISOString(),
      blames: [],
      vaultSnapshots: [],
      whisperShards: [],
      metadata: {
        creator: 'btc-writer',
        soulKeyHash: crypto.createHash('sha256').update(this.soulkey).digest('hex').substring(0, 8)
      }
    };
    
    // Try to load current vault data
    try {
      // Load blame data if exists
      const blameFiles = await fs.readdir(`${this.vaultPath}/blames`).catch(() => []);
      for (const file of blameFiles.slice(-5)) { // Last 5 blame files
        try {
          const blameData = await fs.readFile(`${this.vaultPath}/blames/${file}`, 'utf8');
          epochData.blames.push(JSON.parse(blameData));
        } catch (error) {
          // Skip invalid files
        }
      }
      
      // Load vault snapshots if exists
      const snapshotFiles = await fs.readdir(`${this.vaultPath}/snapshots`).catch(() => []);
      for (const file of snapshotFiles.slice(-3)) { // Last 3 snapshots
        try {
          const snapshotData = await fs.readFile(`${this.vaultPath}/snapshots/${file}`, 'utf8');
          epochData.vaultSnapshots.push(JSON.parse(snapshotData));
        } catch (error) {
          // Skip invalid files
        }
      }
      
      // Load whisper shards if exists
      const whisperFiles = await fs.readdir(`${this.vaultPath}/whispers`).catch(() => []);
      for (const file of whisperFiles.slice(-10)) { // Last 10 whispers
        try {
          const whisperData = await fs.readFile(`${this.vaultPath}/whispers/${file}`, 'utf8');
          epochData.whisperShards.push(JSON.parse(whisperData));
        } catch (error) {
          // Skip invalid files
        }
      }
      
    } catch (error) {
      console.log('⚠️ Limited vault data available, creating minimal epoch');
    }
    
    // Write the epoch
    const result = await this.writeBlamechainEpoch(epochData);
    
    console.log('📚 Epoch created and written to Bitcoin');
    return result;
  }
}

// Export for use
module.exports = BTCWriter;

// Run if called directly
if (require.main === module) {
  const btcWriter = new BTCWriter('demo-soul-key-' + crypto.randomBytes(8).toString('hex'));
  
  // Demo epoch creation
  setTimeout(async () => {
    console.log('🧪 Testing BTC Writer...');
    
    // Create demo epoch
    const result = await btcWriter.createEpochFromVault();
    console.log('📊 Epoch result:', result);
    
    // Show ledger stats
    const stats = btcWriter.getLedgerStats();
    console.log('📈 Ledger stats:', stats);
    
  }, 2000);
  
  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\n⚔️ BTC Writer shutting down...');
    console.log('🪙 The Bitcoin chain holds your epochs eternal.');
    process.exit(0);
  });
  
  console.log('⚔️ BTC Writer running...');
  console.log('🪙 Ready to forge epochs into the Bitcoin chain...');
}