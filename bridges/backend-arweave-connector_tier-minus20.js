
/**
 * 🔗 ARWEAVE PERMANENT STORAGE API
 * Stores automations permanently on the blockchain
 */

const Arweave = require('arweave');

class ArweaveConnector {
  constructor() {
    this.arweave = Arweave.init({
      host: 'arweave.net',
      port: 443,
      protocol: 'https'
    });
    this.wallet = null; // Load from vault
  }

  async storeAutomation(automation) {
    const transaction = await this.arweave.createTransaction({
      data: JSON.stringify(automation)
    }, this.wallet);
    
    transaction.addTag('Content-Type', 'application/json');
    transaction.addTag('App-Name', 'Soulfra');
    transaction.addTag('Type', 'Automation');
    
    await this.arweave.transactions.sign(transaction, this.wallet);
    await this.arweave.transactions.post(transaction);
    
    return transaction.id;
  }

  async retrieveAutomation(txId) {
    const transaction = await this.arweave.transactions.get(txId);
    const data = await this.arweave.transactions.getData(txId, {decode: true, string: true});
    return JSON.parse(data);
  }
}

module.exports = ArweaveConnector;