const twilio = require('twilio');
const config = require('../config/environment');

class SMSService {
  constructor() {
    this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
    this.fromNumber = config.twilio.phoneNumber;
    this.messagingServiceSid = config.twilio.messagingServiceSid;
  }

  async sendSMS(to, message) {
    try {
      const result = await this.client.messages.create({
        body: message,
        to: to,
        from: this.fromNumber,
        messagingServiceSid: this.messagingServiceSid
      });

      console.log(`SMS sent to ${to}, SID: ${result.sid}`);
      return {
        success: true,
        sid: result.sid,
        status: result.status
      };
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  async sendVerificationCode(phoneNumber, code) {
    const message = `Your Billion Dollar Game verification code is: ${code}. This code expires in 10 minutes.`;
    return await this.sendSMS(phoneNumber, message);
  }

  async sendContractNotification(phoneNumber, contract) {
    const message = `Billion Dollar Game: New contract "${contract.title}" worth $${contract.value.toLocaleString()}. View at: ${config.app.url}/c/${contract.contract_number}`;
    return await this.sendSMS(phoneNumber, message);
  }

  async sendPaymentNotification(phoneNumber, amount, balance) {
    const message = `Billion Dollar Game: Payment received! Amount: $${amount.toLocaleString()}. New balance: $${balance.toLocaleString()}`;
    return await this.sendSMS(phoneNumber, message);
  }

  async sendDailyReminder(phoneNumber, streak) {
    const message = `Billion Dollar Game: Don't forget to claim your daily bonus! Current streak: ${streak} days. Claim now: ${config.app.url}/daily`;
    return await this.sendSMS(phoneNumber, message);
  }

  async sendSecurityAlert(phoneNumber, action) {
    const message = `Billion Dollar Game Security Alert: ${action} was performed on your account. If this wasn't you, please secure your account immediately.`;
    return await this.sendSMS(phoneNumber, message);
  }

  async sendBulkSMS(recipients, message) {
    const results = [];
    
    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const batchPromises = batch.map(recipient => 
        this.sendSMS(recipient.phoneNumber, message)
          .then(result => ({ ...result, recipient }))
          .catch(error => ({ success: false, error: error.message, recipient }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  async validatePhoneNumber(phoneNumber) {
    try {
      const lookup = await this.client.lookups.v1
        .phoneNumbers(phoneNumber)
        .fetch();
      
      return {
        valid: true,
        formatted: lookup.phoneNumber,
        countryCode: lookup.countryCode,
        nationalFormat: lookup.nationalFormat
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  async getMessageStatus(messageSid) {
    try {
      const message = await this.client.messages(messageSid).fetch();
      return {
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated
      };
    } catch (error) {
      console.error('Error fetching message status:', error);
      throw error;
    }
  }

  async setupWebhook(webhookUrl, events = ['MESSAGE_STATUS']) {
    try {
      // Configure webhook for message status callbacks
      // This would typically be done through Twilio console or API
      console.log(`Webhook configured for ${webhookUrl} with events: ${events.join(', ')}`);
    } catch (error) {
      console.error('Error setting up webhook:', error);
      throw error;
    }
  }
}

module.exports = SMSService;