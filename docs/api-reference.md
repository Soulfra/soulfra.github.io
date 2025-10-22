# CalOS Platform API Reference

> **Note**: This documentation is also available at [github.com/Soulfra/calos-platform](https://github.com/Soulfra/calos-platform)

## Quick Start

```html
<!-- Copy-paste this - no npm install required -->
<script src="https://soulfra.github.io/calos-sdk-browser.js"></script>
<script>
  const calos = new CalOSPlatform({
    baseURL: 'https://api.calos.dev',
    privacyMode: 'strict' // auto-obfuscate PII
  });
</script>
```

## Core Modules

### Receipt Parser

Parse receipts using OCR and auto-categorize expenses.

```javascript
// Parse receipt from image
const receipt = await calos.receipts.parse(imageFile);

console.log(receipt.merchant);     // "Whole Foods"
console.log(receipt.total);        // 47.23
console.log(receipt.category);     // "Groceries"
console.log(receipt.items);        // [{name: "Milk", price: 4.99}, ...]
```

**Supported Formats**:
- JPG, PNG, PDF
- Stripe receipts
- PayPal receipts
- Square receipts
- Amazon receipts

**Categories** (10 types):
- Groceries
- Dining
- Transportation
- Entertainment
- Utilities
- Healthcare
- Shopping
- Services
- Travel
- Other

### Email Relay

Zero-cost email relay using Gmail/Brevo SMTP.

```javascript
// Send email
await calos.email.send({
  to: 'user@example.com',
  subject: 'Welcome to CalOS',
  body: 'Thanks for signing up!',
  from: 'noreply@calos.dev' // optional
});
```

**Features**:
- **Free**: Gmail (500/day), Brevo (300/day), MailerSend (3k/month)
- **Double opt-in**: Recipients must confirm
- **Rate limiting**: 50/hour, 500/day per user
- **AES-256 encryption**: OAuth tokens encrypted at rest
- **Anti-spam**: Reputation tracking, auto-disable bad actors

### POS Terminal

Square competitor for in-person payments.

```javascript
// Charge card
const charge = await calos.pos.charge({
  amount: 2900, // $29.00 in cents
  card: '4242424242424242',
  exp: '12/25',
  cvc: '123',
  description: 'Coffee & pastry'
});

console.log(charge.status);   // "succeeded"
console.log(charge.id);       // "ch_abc123"
```

**Pricing**:
- **2.6% + $0.10** per transaction
- No monthly fees
- QuickBooks sync included
- Cash tracking
- QR code payments
- Stripe Terminal integration

### Ragebait Generator

Dev meme generator with domain branding.

```javascript
// Generate dev meme
const meme = await calos.ragebait.generate({
  template: 'npm-install',
  domain: 'calos',
  format: 'gif' // or 'mp4'
});

console.log(meme.url);        // Download link
console.log(meme.shareUrl);   // Twitter/social share link
```

**Templates** (11 types):
- npm install
- merge conflicts
- code review
- production bug
- scope creep
- stack overflow
- ai autocomplete
- legacy codebase
- timezone bugs
- dependency hell
- meeting overflow

### File Explorer

Zero-dependency git scanner.

```javascript
// Scan repos
const repos = await calos.files.scanRepos('/path/to/projects');

repos.forEach(repo => {
  console.log(repo.path);
  console.log(repo.uncommitted);    // Uncommitted changes count
  console.log(repo.lastCommit);     // Last commit message
  console.log(repo.github);         // GitHub URL (if connected)
});
```

### Privacy Dashboard

See exactly what data CalOS collects.

```javascript
// Get privacy report
const privacy = await calos.privacy.getReport();

console.log(privacy.piiCollected);       // []
console.log(privacy.telemetry);          // {hashed_user_id, domain_only_email}
console.log(privacy.thirdParty);         // [Stripe, OpenAI]
console.log(privacy.localFirst);         // true (Ollama for sensitive data)
```

**Guarantees**:
- **0 PII leaks**: SHA-256 hashed user IDs, domain-only emails
- **Trust through transparency**: Show logic, not raw data
- **Local-first**: Ollama for sensitive queries (free tier)
- **Auto-detect**: Switches to local AI for sensitive content

## Configuration

```javascript
const calos = new CalOSPlatform({
  // Required
  baseURL: 'https://api.calos.dev',

  // Optional
  privacyMode: 'strict',           // 'strict' | 'balanced' | 'none'
  apiKey: 'calos_sk_...',          // Bearer token
  enableLocalAI: true,             // Use Ollama for free tier
  ollamaUrl: 'http://localhost:11434',
  encryptionKey: 'your-32-char-key',
  debug: false
});
```

## Privacy Modes

### Strict (Recommended)
- SHA-256 hash all user IDs
- Domain-only emails (`user@***.com`)
- Local AI for sensitive queries
- No PII in logs

### Balanced
- Hash user IDs
- Mask emails (partial domain)
- Cloud AI with obfuscation
- Minimal PII in logs

### None
- Raw data (use for self-hosted only)
- Full visibility
- Fast performance
- Your responsibility

## Error Handling

```javascript
try {
  const receipt = await calos.receipts.parse(imageFile);
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    console.error('Too many requests:', error.retryAfter);
  } else if (error.code === 'INVALID_API_KEY') {
    console.error('Check your API key');
  } else {
    console.error('Unknown error:', error.message);
  }
}
```

## Rate Limits

| Plan | Requests/Hour | Requests/Day | POS Transactions/Month |
|------|---------------|--------------|------------------------|
| Free | 100 | 1000 | 100 |
| Pro ($29/mo) | 10,000 | 100,000 | Unlimited |
| Enterprise ($99/mo) | Unlimited | Unlimited | Unlimited |

## Self-Hosting

```bash
# Clone repo
git clone https://github.com/Soulfra/calos-platform
cd calos-platform

# Set environment variables
cp .env.example .env
# Edit .env with your keys

# Run with Docker
docker-compose up

# Or run locally
npm install
npm start
```

**Requirements**:
- PostgreSQL 14+
- Redis 6+
- Node.js 18+
- (Optional) Ollama for local AI

## Support

- **GitHub Discussions**: [Soulfra/calos-platform/discussions](https://github.com/Soulfra/calos-platform/discussions)
- **GitHub Issues**: [Soulfra/calos-platform/issues](https://github.com/Soulfra/calos-platform/issues)
- **Live Demo**: [soulfra.github.io/sdk.html](https://soulfra.github.io/sdk.html)
- **Privacy Dashboard**: [soulfra.github.io/privacy-dashboard.html](https://soulfra.github.io/privacy-dashboard.html)

## License

MIT © 2025 SoulFra

---

**Built with ❤️ by SoulFra**
Zero dependencies • Privacy-First • Self-Hostable
