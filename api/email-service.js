/**
 * Email Service - Multi-Provider Support
 *
 * Supports SendGrid, Postmark, and console fallback
 * Auto-detects which service to use based on environment variables
 *
 * Priority order:
 * 1. SendGrid (if SENDGRID_API_KEY set)
 * 2. Postmark (if POSTMARK_API_KEY set)
 * 3. Console (fallback - logs email to console)
 *
 * Usage:
 *   const emailService = require('./email-service.js');
 *   await emailService.sendWelcomeEmail(user, apiKey);
 */

const https = require('https');

class EmailService {
  constructor() {
    this.sendgridKey = process.env.SENDGRID_API_KEY;
    this.postmarkKey = process.env.POSTMARK_API_KEY;
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@soulfra.com';
    this.fromName = process.env.FROM_NAME || 'Soulfra Platform';

    // Detect provider
    if (this.sendgridKey) {
      this.provider = 'sendgrid';
      console.log('[EmailService] Using SendGrid');
    } else if (this.postmarkKey) {
      this.provider = 'postmark';
      console.log('[EmailService] Using Postmark');
    } else {
      this.provider = 'console';
      console.log('[EmailService] Using console fallback (no email service configured)');
    }
  }

  /**
   * Send welcome email with API key
   */
  async sendWelcomeEmail(user, apiKey) {
    const subject = `Welcome to Soulfra - Your API Key Inside`;
    const html = this._generateWelcomeTemplate(user, apiKey);
    const text = this._generateWelcomeText(user, apiKey);

    return await this.send({
      to: user.email,
      subject,
      html,
      text
    });
  }

  /**
   * Send generic email
   */
  async send({ to, subject, html, text }) {
    try {
      switch (this.provider) {
        case 'sendgrid':
          return await this._sendViaSendGrid({ to, subject, html, text });
        case 'postmark':
          return await this._sendViaPostmark({ to, subject, html, text });
        default:
          return await this._sendViaConsole({ to, subject, html, text });
      }
    } catch (error) {
      console.error('[EmailService] Send error:', error.message);

      // Fallback to console if real service fails
      if (this.provider !== 'console') {
        console.warn('[EmailService] Falling back to console logging');
        return await this._sendViaConsole({ to, subject, html, text });
      }

      return {
        success: false,
        error: error.message,
        provider: this.provider
      };
    }
  }

  /**
   * SendGrid provider
   */
  async _sendViaSendGrid({ to, subject, html, text }) {
    const data = JSON.stringify({
      personalizations: [{
        to: [{ email: to }]
      }],
      from: {
        email: this.fromEmail,
        name: this.fromName
      },
      subject,
      content: [
        { type: 'text/html', value: html },
        { type: 'text/plain', value: text }
      ]
    });

    const options = {
      hostname: 'api.sendgrid.com',
      path: '/v3/mail/send',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.sendgridKey}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            success: true,
            provider: 'sendgrid',
            to,
            subject
          });
        } else {
          reject(new Error(`SendGrid API error: ${res.statusCode}`));
        }
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  /**
   * Postmark provider
   */
  async _sendViaPostmark({ to, subject, html, text }) {
    const data = JSON.stringify({
      From: this.fromEmail,
      To: to,
      Subject: subject,
      HtmlBody: html,
      TextBody: text,
      MessageStream: 'outbound'
    });

    const options = {
      hostname: 'api.postmarkapp.com',
      path: '/email',
      method: 'POST',
      headers: {
        'X-Postmark-Server-Token': this.postmarkKey,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            success: true,
            provider: 'postmark',
            to,
            subject
          });
        } else {
          reject(new Error(`Postmark API error: ${res.statusCode}`));
        }
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  /**
   * Console fallback (for testing without email service)
   */
  async _sendViaConsole({ to, subject, html, text }) {
    console.log('\n' + '='.repeat(60));
    console.log('📧 EMAIL (Console Fallback)');
    console.log('='.repeat(60));
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('-'.repeat(60));
    console.log(text);
    console.log('='.repeat(60) + '\n');

    return {
      success: true,
      provider: 'console',
      to,
      subject,
      note: 'Email logged to console (no real email sent)'
    };
  }

  /**
   * Generate welcome email HTML template
   */
  _generateWelcomeTemplate(user, apiKey) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Soulfra</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 8px; text-align: center; color: white;">
    <h1 style="margin: 0 0 10px 0; font-size: 2rem;">🚀 Welcome to Soulfra!</h1>
    <p style="margin: 0; opacity: 0.9;">Privacy-first automation for developers</p>
  </div>

  <div style="padding: 30px 0;">
    <p>Hi <strong>${user.name}</strong>,</p>

    <p>Your Soulfra account has been created! Here's everything you need to get started:</p>

    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h2 style="margin-top: 0; color: #667eea;">🔑 Your API Key</h2>
      <code style="display: block; background: white; padding: 15px; border-radius: 4px; border: 2px solid #667eea; font-size: 14px; word-break: break-all;">${apiKey}</code>
      <p style="margin-bottom: 0; font-size: 0.9rem; color: #666;">Keep this secure! You can find it anytime in your dashboard.</p>
    </div>

    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
      <h3 style="margin-top: 0;">📦 Account Details</h3>
      <ul style="margin: 0; padding-left: 20px;">
        <li><strong>Plan:</strong> ${user.plan === 'free' ? 'Free (Self-hosted)' : 'Managed ($9/mo)'}</li>
        <li><strong>Email:</strong> ${user.email}</li>
        <li><strong>Use Case:</strong> ${user.use_case || 'Not specified'}</li>
      </ul>
    </div>

    <h3>🚀 Quick Start</h3>
    <ol>
      <li><strong>Visit your dashboard:</strong> <a href="https://soulfra.com/dashboard.html" style="color: #667eea;">soulfra.com/dashboard</a></li>
      <li><strong>Copy your API key</strong> (shown above)</li>
      <li><strong>Make your first API call:</strong>
        <pre style="background: #2d2d2d; color: #f8f8f2; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 13px;">curl -H "Authorization: Bearer ${apiKey}" \\
     https://soulfra.com/api/health</pre>
      </li>
    </ol>

    <h3>📚 Resources</h3>
    <ul>
      <li><a href="https://soulfra.com/docs" style="color: #667eea;">API Documentation</a></li>
      <li><a href="https://soulfra.com/examples" style="color: #667eea;">Code Examples</a></li>
      <li><a href="https://soulfra.com/support" style="color: #667eea;">Support & Community</a></li>
    </ul>

    <div style="background: #fff9e6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <p style="margin: 0;"><strong>💡 Pro Tip:</strong> ${user.plan === 'free' ? 'Self-host your automation workflows locally and keep full control of your data.' : 'Your managed API is ready to use - no setup required!'}</p>
    </div>

  </div>

  <div style="padding: 20px 0; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 0.9rem;">
    <p>Need help? Reply to this email or visit <a href="https://soulfra.com/support" style="color: #667eea;">soulfra.com/support</a></p>
    <p style="margin: 10px 0 0 0;">
      <strong>Soulfra Platform</strong><br>
      Privacy-first automation for developers
    </p>
  </div>

</body>
</html>
    `.trim();
  }

  /**
   * Generate welcome email plain text
   */
  _generateWelcomeText(user, apiKey) {
    return `
Welcome to Soulfra!
==================

Hi ${user.name},

Your Soulfra account has been created! Here's everything you need to get started:

🔑 YOUR API KEY
--------------
${apiKey}

Keep this secure! You can find it anytime in your dashboard.

📦 ACCOUNT DETAILS
-----------------
- Plan: ${user.plan === 'free' ? 'Free (Self-hosted)' : 'Managed ($9/mo)'}
- Email: ${user.email}
- Use Case: ${user.use_case || 'Not specified'}

🚀 QUICK START
-------------
1. Visit your dashboard: https://soulfra.com/dashboard.html
2. Copy your API key (shown above)
3. Make your first API call:

   curl -H "Authorization: Bearer ${apiKey}" https://soulfra.com/api/health

📚 RESOURCES
-----------
- API Documentation: https://soulfra.com/docs
- Code Examples: https://soulfra.com/examples
- Support & Community: https://soulfra.com/support

💡 Pro Tip: ${user.plan === 'free' ? 'Self-host your automation workflows locally and keep full control of your data.' : 'Your managed API is ready to use - no setup required!'}

Need help? Reply to this email or visit soulfra.com/support

--
Soulfra Platform
Privacy-first automation for developers
    `.trim();
  }

  /**
   * Get current provider info
   */
  getInfo() {
    return {
      provider: this.provider,
      fromEmail: this.fromEmail,
      fromName: this.fromName,
      configured: this.provider !== 'console'
    };
  }
}

// Export singleton
module.exports = new EmailService();
