const twilio = require('twilio');
const config = require('../config/environment');

class WhatsAppService {
  constructor() {
    this.client = twilio(config.whatsapp.accountSid, config.whatsapp.authToken);
    this.fromNumber = `whatsapp:${config.whatsapp.phoneNumber}`;
  }

  async sendMessage(to, message, mediaUrl = null) {
    try {
      const messageData = {
        body: message,
        from: this.fromNumber,
        to: `whatsapp:${to}`
      };

      if (mediaUrl) {
        messageData.mediaUrl = [mediaUrl];
      }

      const result = await this.client.messages.create(messageData);

      console.log(`WhatsApp message sent to ${to}, SID: ${result.sid}`);
      return {
        success: true,
        sid: result.sid,
        status: result.status
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  async sendWelcomeMessage(phoneNumber, username) {
    const message = `🎮 Welcome to Billion Dollar Game, ${username}!

Your journey to becoming a virtual billionaire starts now! 

Here's what you can do:
📝 Create contracts
✍️ Sign agreements
💰 Earn from successful deals
🤖 Work with AI agents
🏆 Climb the leaderboard

Type "help" for available commands or visit: ${config.app.url}

Ready to make your first million? 💸`;

    return await this.sendMessage(phoneNumber, message);
  }

  async sendContractNotification(phoneNumber, contract) {
    const message = `📋 *New Contract Alert!*

*Title:* ${contract.title}
*Value:* $${contract.value.toLocaleString()}
*Contract ID:* ${contract.contract_number}
*Status:* ${contract.status}

View details: ${config.app.url}/contracts/${contract.id}

Reply with "sign ${contract.contract_number}" to sign this contract.`;

    return await this.sendMessage(phoneNumber, message);
  }

  async sendPaymentConfirmation(phoneNumber, transaction) {
    const message = `💰 *Payment Received!*

*Amount:* $${transaction.amount.toLocaleString()}
*Type:* ${transaction.type}
*Transaction ID:* ${transaction.transaction_hash}
*Status:* ✅ Completed

Your funds have been added to your account balance.`;

    return await this.sendMessage(phoneNumber, message);
  }

  async sendContractSigned(phoneNumber, contract, signer) {
    const message = `✍️ *Contract Signed!*

${signer.username} has signed your contract "${contract.title}"

*Contract Value:* $${contract.value.toLocaleString()}
*Your Earnings:* $${(contract.value * (1 - contract.fee_percentage / 100)).toLocaleString()}

The contract is now active! 🎉`;

    return await this.sendMessage(phoneNumber, message);
  }

  async sendDailyStats(phoneNumber, stats) {
    const message = `📊 *Your Daily Summary*

*Current Balance:* $${stats.balance.toLocaleString()}
*Today's Earnings:* $${stats.dailyEarnings.toLocaleString()}
*Active Contracts:* ${stats.activeContracts}
*New Signatures:* ${stats.newSignatures}
*Leaderboard Rank:* #${stats.rank}

Keep up the great work! 🚀`;

    return await this.sendMessage(phoneNumber, message);
  }

  async sendInteractiveMenu(phoneNumber) {
    const message = `🎮 *Billion Dollar Game Menu*

Please choose an option:

1️⃣ Check Balance
2️⃣ Create Contract
3️⃣ View Contracts
4️⃣ Leaderboard
5️⃣ AI Assistant
6️⃣ Daily Bonus
7️⃣ Help

Reply with the number of your choice.`;

    return await this.sendMessage(phoneNumber, message);
  }

  async handleIncomingMessage(from, body) {
    const phoneNumber = from.replace('whatsapp:', '');
    const command = body.toLowerCase().trim();

    try {
      // Parse commands
      if (command === 'menu' || command === 'help') {
        return await this.sendInteractiveMenu(phoneNumber);
      }
      
      if (command.startsWith('sign ')) {
        const contractId = command.substring(5);
        return await this.handleSignCommand(phoneNumber, contractId);
      }

      if (command === '1' || command === 'balance') {
        return await this.handleBalanceCommand(phoneNumber);
      }

      if (command === '2' || command === 'create') {
        return await this.handleCreateContractCommand(phoneNumber);
      }

      // Default response
      return await this.sendMessage(
        phoneNumber, 
        'I didn\'t understand that command. Type "help" for available options.'
      );
    } catch (error) {
      console.error('Error handling WhatsApp message:', error);
      return await this.sendMessage(
        phoneNumber,
        'An error occurred processing your request. Please try again later.'
      );
    }
  }

  async handleSignCommand(phoneNumber, contractId) {
    // This would integrate with your contract service
    // For now, returning a placeholder response
    return await this.sendMessage(
      phoneNumber,
      `Processing signature for contract ${contractId}...`
    );
  }

  async handleBalanceCommand(phoneNumber) {
    // This would integrate with your user service
    // For now, returning a placeholder response
    return await this.sendMessage(
      phoneNumber,
      'Fetching your balance...'
    );
  }

  async handleCreateContractCommand(phoneNumber) {
    const message = `📝 *Create New Contract*

To create a contract, send a message in this format:

CONTRACT <title> <value>

Example:
CONTRACT "Website Development" 5000

This will create a contract titled "Website Development" worth $5,000.`;

    return await this.sendMessage(phoneNumber, message);
  }

  async sendMediaMessage(to, message, mediaUrl, mediaType = 'image') {
    try {
      const messageData = {
        body: message,
        from: this.fromNumber,
        to: `whatsapp:${to}`,
        mediaUrl: [mediaUrl]
      };

      const result = await this.client.messages.create(messageData);

      console.log(`WhatsApp media message sent to ${to}, SID: ${result.sid}`);
      return {
        success: true,
        sid: result.sid,
        status: result.status
      };
    } catch (error) {
      console.error('Error sending WhatsApp media message:', error);
      throw error;
    }
  }

  async sendContractDocument(phoneNumber, contract, pdfUrl) {
    const message = `📄 Here's your contract document for "${contract.title}"`;
    return await this.sendMediaMessage(phoneNumber, message, pdfUrl, 'document');
  }

  async createMessageTemplate(name, content, variables = []) {
    // In production, this would create a message template through
    // WhatsApp Business API for faster approval and sending
    console.log(`Creating WhatsApp template: ${name}`);
    return {
      name: name,
      content: content,
      variables: variables,
      status: 'pending_approval'
    };
  }

  async sendTemplateMessage(to, templateName, variables = {}) {
    // This would send a pre-approved template message
    // Templates are required for business-initiated conversations
    try {
      const messageData = {
        from: this.fromNumber,
        to: `whatsapp:${to}`,
        contentSid: templateName,
        contentVariables: JSON.stringify(variables)
      };

      const result = await this.client.messages.create(messageData);
      return {
        success: true,
        sid: result.sid
      };
    } catch (error) {
      console.error('Error sending template message:', error);
      throw error;
    }
  }
}

module.exports = WhatsAppService;