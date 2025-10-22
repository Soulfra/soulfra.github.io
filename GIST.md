# CalOS Platform SDK - Browser Edition (Zero Dependencies)

**Privacy-first automation SDK** - Receipts • Email • Payments • Dev Tools

## Installation

**Option 1: Copy-paste (No npm install)**
```html
<script src="https://soulfra.github.io/calos-sdk-browser.js"></script>
```

**Option 2: Download and self-host**
```bash
curl -O https://soulfra.github.io/calos-sdk-browser.js
```

**Option 3: Inline (for gists/codepen)**
```html
<!-- Copy entire calos-sdk-browser.js here -->
<script>
  /* SDK code goes here */
</script>
```

## Quick Start

```html
<!DOCTYPE html>
<html>
<head>
  <title>CalOS SDK Demo</title>
</head>
<body>
  <h1>CalOS Platform SDK</h1>

  <!-- Load SDK (zero dependencies!) -->
  <script src="https://soulfra.github.io/calos-sdk-browser.js"></script>

  <script>
    // Initialize
    const calos = new CalOSPlatform({
      baseURL: 'https://api.calos.dev', // or 'http://localhost:5001'
      privacyMode: 'strict' // auto-obfuscate PII
    });

    // Example 1: Parse receipt
    async function parseReceipt(file) {
      const result = await calos.receipts.parse(file);
      console.log('Receipt:', result.receipt);
      // { merchant: 'Stripe', amount: 29.00, category: 'Payment Processing 💳' }
    }

    // Example 2: Send email
    async function sendEmail() {
      await calos.email.send({
        userId: 'user_123',
        to: 'customer@example.com',
        subject: 'Hello from CalOS',
        text: 'This email was sent via zero-cost Gmail relay!'
      });
      console.log('Email sent!');
    }

    // Example 3: Charge card
    async function chargeCard() {
      const charge = await calos.pos.charge({
        amount: 2900, // $29.00 in cents
        terminalId: 'tmr_abc123',
        description: 'Coffee & Pastry'
      });
      console.log('Charged:', charge);
    }

    // Example 4: Generate dev meme
    async function generateMeme() {
      const ragebait = await calos.ragebait.generate('npm-install', {
        domain: 'myapp.com',
        watermark: 'Built with MyApp'
      });
      console.log('Meme generated:', ragebait.gifUrl);
    }

    // Example 5: Scan git repos
    async function scanRepos() {
      const repos = await calos.files.scanGitRepos('~/Desktop');
      console.log('Found', repos.total, 'git repositories');
    }

    // Example 6: Privacy dashboard
    async function checkPrivacy() {
      const dashboard = await calos.privacy.getDashboard();
      console.log('Privacy stats:', {
        localQueries: dashboard.dashboard.dataFlow.local,
        externalQueries: dashboard.dashboard.dataFlow.external,
        piiLeaks: dashboard.dashboard.trustMetrics.piiLeaks // Should be 0!
      });
    }

    // Check system health
    calos.health().then(health => {
      console.log('System status:', health.status);
    });
  </script>

  <!-- UI Example: Receipt Upload -->
  <div>
    <h2>Upload Receipt</h2>
    <input type="file" id="receiptInput" accept="image/*">
    <button onclick="uploadReceipt()">Parse Receipt</button>
    <pre id="result"></pre>
  </div>

  <script>
    async function uploadReceipt() {
      const file = document.getElementById('receiptInput').files[0];
      if (!file) {
        alert('Please select a receipt image');
        return;
      }

      try {
        const result = await calos.receipts.parse(file);
        document.getElementById('result').textContent =
          JSON.stringify(result.receipt, null, 2);
      } catch (error) {
        document.getElementById('result').textContent =
          'Error: ' + error.message;
      }
    }
  </script>
</body>
</html>
```

## Features

| Feature | Description | Endpoint |
|---------|-------------|----------|
| **Receipts** | OCR + auto-categorize (10 expense types) | `/api/receipts/*` |
| **Email** | Zero-cost Gmail relay (500/day free) | `/api/gmail/*` |
| **POS** | Stripe competitor (2.6% + $0.10) | `/api/pos/*` |
| **Ragebait** | Dev meme generator (11 templates) | `/api/ragebait/*` |
| **Files** | Git scanner (zero-dep) | `/api/explorer/*` |
| **Privacy** | Telemetry obfuscation dashboard | `/api/privacy/*` |

## Privacy Modes

```javascript
const calos = new CalOSPlatform({
  privacyMode: 'strict' // 'strict', 'balanced', or 'off'
});
```

- **`strict`** - Obfuscate everything, route sensitive queries to local Ollama
- **`balanced`** - Obfuscate PII only, allow external APIs for non-sensitive data
- **`off`** - No obfuscation (dev/testing only)

## What Gets Obfuscated (Strict Mode)

- **User IDs** → SHA-256 hash (irreversible)
- **Emails** → Domain only (e.g., "gmail.com")
- **Financial data** → Removed entirely
- **IP addresses** → Country-level only
- **Sensitive queries** → Routed to local Ollama (never hits OpenAI)

## API Endpoints

### Self-Hosted (Free)
```bash
# Start server
cd agent-router
npm start -- --local

# SDK connects to:
baseURL: 'http://localhost:5001'
```

### Managed Hosting ($9/mo)
```javascript
baseURL: 'https://api.calos.dev'
// No server needed, just sign up at calos.dev
```

## Dependencies

**ZERO** - Uses only browser built-ins:
- `fetch()` - HTTP requests (built-in since 2017)
- `FileReader` - File uploads (built-in)
- `FormData` - Form data (built-in)
- `crypto.subtle` - Encryption (built-in)

## License

MIT - Free forever, even for commercial use

## Links

- **Portal**: https://soulfra.github.io
- **GitHub**: https://github.com/soulfra/calos-platform
- **Privacy Dashboard**: https://soulfra.github.io/privacy-dashboard.html
- **Discord**: https://discord.gg/calos
- **Twitter**: https://twitter.com/calos

---

**Built with ❤️ by SoulFra** - Privacy-first automation for developers

**Total size: ~15 KB minified** • **Zero dependencies** • **Works offline**
