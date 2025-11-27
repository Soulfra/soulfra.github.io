const sgMail = require('@sendgrid/mail');
const config = require('../config/environment');
const { generateEmailTemplate } = require('../utils/email-templates');

class EmailService {
  constructor() {
    sgMail.setApiKey(config.sendgrid.apiKey);
    this.fromEmail = config.sendgrid.fromEmail;
    this.fromName = config.sendgrid.fromName;
    this.templateIds = config.sendgrid.templateIds;
  }

  async sendWelcomeEmail(user) {
    try {
      const msg = {
        to: user.email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        templateId: this.templateIds.welcome,
        dynamicTemplateData: {
          username: user.username,
          userId: user.id,
          loginUrl: `${config.app.url}/login`,
          supportEmail: 'support@billiondollargame.com'
        }
      };

      await sgMail.send(msg);
      console.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  async sendContractCreatedEmail(user, contract) {
    try {
      const msg = {
        to: user.email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        templateId: this.templateIds.contractCreated,
        dynamicTemplateData: {
          username: user.username,
          contractId: contract.contract_number,
          contractTitle: contract.title,
          contractValue: contract.value.toLocaleString(),
          feePercentage: contract.fee_percentage,
          contractUrl: `${config.app.url}/contracts/${contract.id}`,
          expiryDate: contract.expiry_date 
            ? new Date(contract.expiry_date).toLocaleDateString() 
            : 'No expiry'
        }
      };

      await sgMail.send(msg);
      console.log(`Contract created email sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending contract created email:', error);
      throw error;
    }
  }

  async sendContractSignedEmail(user, contract, signer) {
    try {
      const msg = {
        to: user.email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        templateId: this.templateIds.contractSigned,
        dynamicTemplateData: {
          username: user.username,
          contractId: contract.contract_number,
          contractTitle: contract.title,
          signerName: signer.username,
          signedAt: new Date().toLocaleString(),
          contractUrl: `${config.app.url}/contracts/${contract.id}`
        }
      };

      await sgMail.send(msg);
      console.log(`Contract signed email sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending contract signed email:', error);
      throw error;
    }
  }

  async sendPaymentReceivedEmail(user, transaction) {
    try {
      const msg = {
        to: user.email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        templateId: this.templateIds.paymentReceived,
        dynamicTemplateData: {
          username: user.username,
          amount: transaction.amount.toLocaleString(),
          transactionId: transaction.transaction_hash,
          transactionType: transaction.type,
          newBalance: user.balance.toLocaleString(),
          transactionDate: new Date().toLocaleString(),
          dashboardUrl: `${config.app.url}/dashboard`
        }
      };

      await sgMail.send(msg);
      console.log(`Payment received email sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending payment received email:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(user, resetToken) {
    try {
      const resetUrl = `${config.app.url}/reset-password?token=${resetToken}`;
      
      const msg = {
        to: user.email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: 'Password Reset Request - Billion Dollar Game',
        html: generateEmailTemplate('passwordReset', {
          username: user.username,
          resetUrl: resetUrl,
          expiryTime: '1 hour'
        })
      };

      await sgMail.send(msg);
      console.log(`Password reset email sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  async sendContractExpiryReminder(user, contract) {
    try {
      const daysUntilExpiry = Math.ceil(
        (new Date(contract.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
      );

      const msg = {
        to: user.email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: `Contract Expiring Soon - ${contract.title}`,
        html: generateEmailTemplate('contractExpiry', {
          username: user.username,
          contractTitle: contract.title,
          contractId: contract.contract_number,
          daysUntilExpiry: daysUntilExpiry,
          contractUrl: `${config.app.url}/contracts/${contract.id}`
        })
      };

      await sgMail.send(msg);
      console.log(`Contract expiry reminder sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending contract expiry reminder:', error);
      throw error;
    }
  }

  async sendDailyDigest(user, stats) {
    try {
      const msg = {
        to: user.email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: 'Your Daily Billion Dollar Game Summary',
        html: generateEmailTemplate('dailyDigest', {
          username: user.username,
          currentBalance: user.balance.toLocaleString(),
          dailyEarnings: stats.dailyEarnings.toLocaleString(),
          activeContracts: stats.activeContracts,
          newSignatures: stats.newSignatures,
          leaderboardPosition: stats.leaderboardPosition,
          dashboardUrl: `${config.app.url}/dashboard`
        })
      };

      await sgMail.send(msg);
      console.log(`Daily digest sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending daily digest:', error);
      throw error;
    }
  }

  async sendBulkEmail(recipients, subject, content, templateData = {}) {
    try {
      const messages = recipients.map(recipient => ({
        to: recipient.email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: subject,
        html: generateEmailTemplate('custom', {
          username: recipient.username,
          content: content,
          ...templateData
        })
      }));

      // SendGrid allows up to 1000 recipients per request
      const chunks = [];
      for (let i = 0; i < messages.length; i += 1000) {
        chunks.push(messages.slice(i, i + 1000));
      }

      for (const chunk of chunks) {
        await sgMail.send(chunk);
      }

      console.log(`Bulk email sent to ${recipients.length} recipients`);
    } catch (error) {
      console.error('Error sending bulk email:', error);
      throw error;
    }
  }

  async sendTransactionalEmail(to, subject, htmlContent, attachments = []) {
    try {
      const msg = {
        to: to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: subject,
        html: htmlContent,
        attachments: attachments.map(attachment => ({
          content: attachment.content,
          filename: attachment.filename,
          type: attachment.type || 'application/pdf',
          disposition: attachment.disposition || 'attachment'
        }))
      };

      await sgMail.send(msg);
      console.log(`Transactional email sent to ${to}`);
    } catch (error) {
      console.error('Error sending transactional email:', error);
      throw error;
    }
  }

  async verifyEmailAddress(email) {
    // In a production environment, you might want to use SendGrid's
    // email validation API or another service
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = EmailService;