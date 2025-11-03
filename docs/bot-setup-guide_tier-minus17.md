# Bot Setup Guide - Discord, Telegram, and Phone

Here's how to set up Cal on each platform. It's actually pretty straightforward!

## Discord Bot Setup

1. **Create Discord Application**
   ```
   1. Go to https://discord.com/developers/applications
   2. Click "New Application" 
   3. Name it (e.g., "Cal AI Co-founder")
   4. Go to "Bot" section
   5. Click "Add Bot"
   6. Copy the Bot Token
   ```

2. **Set Bot Permissions**
   ```
   - Send Messages
   - Read Message History
   - Attach Files
   - Add Reactions
   - Use Slash Commands (optional)
   ```

3. **Invite Bot to Server**
   ```
   1. Go to OAuth2 > URL Generator
   2. Select "bot" scope
   3. Select permissions above
   4. Copy generated URL
   5. Open URL to add bot to your server
   ```

4. **Configure in Code**
   ```bash
   # Set environment variable
   export DISCORD_BOT_TOKEN="your-bot-token-here"
   
   # Or create .env file
   DISCORD_BOT_TOKEN=your-bot-token-here
   ```

## Telegram Bot Setup

1. **Create Telegram Bot**
   ```
   1. Message @BotFather on Telegram
   2. Send: /newbot
   3. Choose name (e.g., "Cal AI")
   4. Choose username (e.g., @CalAIBot)
   5. Copy the API token
   ```

2. **Configure Bot Settings**
   ```
   Message @BotFather:
   /setdescription - Set bot description
   /setabouttext - Set about text
   /setuserpic - Set bot avatar
   /setcommands - Set command list
   ```

3. **Configure in Code**
   ```bash
   # Set environment variable
   export TELEGRAM_BOT_TOKEN="your-telegram-token-here"
   ```

## Twilio Setup (Phone/SMS)

1. **Create Twilio Account**
   ```
   1. Sign up at https://www.twilio.com
   2. Get free trial credit ($15)
   3. Verify your phone number
   ```

2. **Get Phone Number**
   ```
   1. Go to Phone Numbers > Manage > Buy a Number
   2. Choose a number with Voice and SMS capabilities
   3. Note the phone number
   ```

3. **Configure Webhooks**
   ```
   1. Go to Phone Numbers > Manage > Active Numbers
   2. Click your number
   3. Set Voice webhook: https://your-server.com/voice/incoming
   4. Set SMS webhook: https://your-server.com/sms/incoming
   ```

4. **Get Credentials**
   ```
   1. Go to Account > API keys & tokens
   2. Copy Account SID
   3. Copy Auth Token
   ```

5. **Configure in Code**
   ```bash
   export TWILIO_ACCOUNT_SID="your-account-sid"
   export TWILIO_AUTH_TOKEN="your-auth-token"
   export TWILIO_PHONE_NUMBER="+1234567890"
   ```

## Quick Setup Script

Create a file called `setup-bots.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function question(prompt) {
    return new Promise(resolve => {
        rl.question(prompt, resolve);
    });
}

async function setupBots() {
    console.log('🤖 Cal Bot Setup Wizard\n');
    
    const config = {};
    
    // Discord
    console.log('=== Discord Setup ===');
    const setupDiscord = await question('Set up Discord bot? (y/n): ');
    if (setupDiscord.toLowerCase() === 'y') {
        config.DISCORD_BOT_TOKEN = await question('Discord Bot Token: ');
    }
    
    // Telegram
    console.log('\n=== Telegram Setup ===');
    const setupTelegram = await question('Set up Telegram bot? (y/n): ');
    if (setupTelegram.toLowerCase() === 'y') {
        config.TELEGRAM_BOT_TOKEN = await question('Telegram Bot Token: ');
    }
    
    // Twilio
    console.log('\n=== Twilio Setup (Phone/SMS) ===');
    const setupTwilio = await question('Set up Twilio? (y/n): ');
    if (setupTwilio.toLowerCase() === 'y') {
        config.TWILIO_ACCOUNT_SID = await question('Twilio Account SID: ');
        config.TWILIO_AUTH_TOKEN = await question('Twilio Auth Token: ');
        config.TWILIO_PHONE_NUMBER = await question('Twilio Phone Number: ');
    }
    
    // API Keys
    console.log('\n=== API Keys ===');
    config.ANTHROPIC_API_KEY = await question('Anthropic API Key (for Cal\'s brain): ');
    
    // Write .env file
    const envContent = Object.entries(config)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    
    fs.writeFileSync('.env', envContent);
    
    console.log('\n✅ Configuration saved to .env file');
    console.log('🚀 You can now run: node cal-omnichannel.js');
    
    rl.close();
}

setupBots().catch(console.error);
```

## Running Everything

1. **Install Dependencies**
   ```bash
   npm install discord.js node-telegram-bot-api twilio express ws dotenv
   ```

2. **Create .env file**
   ```bash
   # Either run the setup script
   node setup-bots.js
   
   # Or create manually
   echo "DISCORD_BOT_TOKEN=your-token" > .env
   echo "TELEGRAM_BOT_TOKEN=your-token" >> .env
   # etc...
   ```

3. **Run Cal**
   ```bash
   node cal-omnichannel.js
   ```

## For Production

1. **Use a Process Manager**
   ```bash
   npm install -g pm2
   pm2 start cal-omnichannel.js --name "cal-bot"
   pm2 save
   pm2 startup
   ```

2. **Set Up Reverse Proxy (for webhooks)**
   ```nginx
   server {
       listen 443 ssl;
       server_name your-domain.com;
       
       location /voice/ {
           proxy_pass http://localhost:3003;
       }
       
       location /sms/ {
           proxy_pass http://localhost:3004;
       }
   }
   ```

3. **Use ngrok for Testing**
   ```bash
   # Install ngrok
   npm install -g ngrok
   
   # Expose webhooks
   ngrok http 3003
   # Use the HTTPS URL for Twilio webhooks
   ```

## Cost Breakdown

- **Discord**: FREE
- **Telegram**: FREE
- **Twilio**: 
  - Phone number: ~$1/month
  - SMS: ~$0.0075 per message
  - Voice: ~$0.013 per minute
  - Free trial includes $15 credit

## Security Notes

1. **Never commit tokens to git**
   ```bash
   echo ".env" >> .gitignore
   ```

2. **Use environment variables in production**
   ```bash
   # On server
   export DISCORD_BOT_TOKEN="..."
   # Don't use .env file in production
   ```

3. **Rotate tokens regularly**
   - Discord: Regenerate in developer portal
   - Telegram: Message @BotFather with /revoke
   - Twilio: Generate new auth token in console

That's it! Cal will now be available across all platforms. The beauty is that all conversations are synced - start on Discord, continue on Telegram, get summaries via SMS.