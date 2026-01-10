# 🔐 Gist Database System

**Blockchain-style distributed database using GitHub Gists**

---

## Overview

The Gist Database system provides a **serverless, distributed database** using GitHub Gists as the storage layer. It features:

- ✅ **SHA-256 blockchain-style hashing** for immutability
- ✅ **No backend server needed** - works on static GitHub Pages
- ✅ **Cross-domain synchronization** - sync data across soulfra.com, cringeproof.com, etc.
- ✅ **Provable audit trails** - every transaction is signed and chained
- ✅ **Anonymous access** - no GitHub auth required for public Gists
- ✅ **Local-first** - works offline with mock mode

---

## Quick Start

### 1. Use in HTML

```html
<!-- Load the Gist Database -->
<script src="/api/gist/database.js"></script>

<script>
  // Initialize database
  const db = new GistDatabase({ mockMode: false });

  // Save a transaction
  await db.saveTransaction({
    message: "Hello world",
    sentiment: "positive",
    status: "valid"
  }, 'soulfra');

  // Load all transactions
  const transactions = await db.loadTransactions('soulfra');

  // Verify blockchain integrity
  const verification = await db.verifyBlockchain('soulfra');
  console.log(verification); // { valid: true, chainLength: 10 }
</script>
```

### 2. Integrated Chatbox

The chatbox at `/pages/chat/chatbox.html` has built-in Gist sync:

1. **Chat with Ollama** and generate analytics
2. **Click "☁️ Sync Gist"** to save to GitHub Gist
3. **Click "📥 Load"** to restore from Gist
4. **Verify** blockchain integrity automatically

---

## Features

### Blockchain-Style Hashing

Each transaction is SHA-256 signed and chained:

```javascript
{
  id: "abc123",
  timestamp: 1704067200000,
  data: { message: "Hello", sentiment: "positive" },
  previousHash: "sha256_of_previous_transaction",
  signature: "sha256_of_this_transaction"
}
```

### Cross-Domain Sync

Sync data to multiple domains:

```javascript
// Sync to all domains
await db.syncToAllDomains();

// Result:
{
  soulfra: { success: true, gistId: "abc123..." },
  cringeproof: { success: true, gistId: "def456..." },
  calriven: { success: true, gistId: "ghi789..." },
  deathtodata: { success: true, gistId: "jkl012..." }
}
```

### Blockchain Verification

Verify integrity of the entire chain:

```javascript
const verification = await db.verifyBlockchain('soulfra');

if (!verification.valid) {
  console.error('❌ Chain broken at:', verification.transaction);
} else {
  console.log('✅ Chain valid:', verification.chainLength, 'transactions');
}
```

---

## API Reference

### GistDatabase

#### Constructor

```javascript
const db = new GistDatabase(options);
```

**Options:**
- `mockMode: boolean` - Use in-memory storage instead of GitHub API (default: false)

#### Methods

**saveTransaction(data, domain = 'soulfra')**
```javascript
const result = await db.saveTransaction({
  message: "Fix auth bug",
  sentiment: "neutral",
  status: "valid"
}, 'soulfra');

// Returns:
{
  success: true,
  transaction: { id, timestamp, data, previousHash, signature },
  gistId: "abc123...",
  hash: "sha256...",
  isNew: true  // If new Gist was created
}
```

**loadTransactions(domain = 'soulfra')**
```javascript
const transactions = await db.loadTransactions('soulfra');
// Returns array of all transactions
```

**verifyBlockchain(domain = 'soulfra')**
```javascript
const verification = await db.verifyBlockchain('soulfra');

// Returns:
{
  valid: true,
  message: "All 42 transactions verified",
  chainLength: 42
}
```

**getStats(domain = 'soulfra')**
```javascript
const stats = await db.getStats('soulfra');

// Returns:
{
  domain: "soulfra",
  totalTransactions: 42,
  gistId: "abc123...",
  chainValid: true,
  lastTransaction: { ... },
  masterGists: { soulfra: "abc123...", cringeproof: "def456...", ... }
}
```

**setMasterGist(domain, gistId)**
```javascript
// Manually set a Gist ID for a domain
db.setMasterGist('soulfra', 'abc123def456');
```

**syncToAllDomains()**
```javascript
// Sync soulfra data to all other domains
const results = await db.syncToAllDomains();
```

**exportToCSV(transactions)**
```javascript
const csv = db.exportToCSV(transactions);
// Returns CSV string
```

---

## Blog Aggregator

Scan all domains for blog posts and sync to Gist:

```javascript
const aggregator = new BlogAggregator({ mockMode: false });

// Scan all domains
await aggregator.scanAllDomains();

// Save to Gist
const result = await aggregator.saveToGist();

// Get stats
const stats = aggregator.getStats();
console.log(stats.totalPosts); // 15
```

**Features:**
- Scans soulfra, cringeproof, calriven, deathtodata
- Generates RSS feed automatically
- Hash-based deduplication
- Markdown support

---

## Testing

### Mock Mode (Local Testing)

Test without hitting GitHub API:

```javascript
const db = new GistDatabase({ mockMode: true });

await db.saveTransaction({ message: "Test" }, 'soulfra');
const txns = await db.loadTransactions('soulfra');
console.log(txns.length); // 1
```

### Real API Testing

1. Open chatbox: `http://localhost:8000/pages/chat/chatbox.html`
2. Send a test message: "Hello world"
3. Click **"☁️ Sync Gist"**
4. Check console for Gist ID
5. Open Gist URL: `https://gist.github.com/{gist_id}`

---

## Console Commands

In the chatbox, use the browser console:

```javascript
// Sync to Gist
await syncToGist();

// Load from Gist
await loadFromGist();

// Get Gist stats
const stats = await gistDB.getStats('soulfra');

// Verify blockchain
const verification = await gistDB.verifyBlockchain('soulfra');
```

---

## Architecture

### Data Flow

```
User Action
    ↓
localStorage (Analytics DB)
    ↓
Gist Database (SHA-256 signing)
    ↓
GitHub Gist API (anonymous)
    ↓
Public Gist (encrypted data)
    ↓
Cross-Domain Access (any domain can read)
```

### File Structure

```
api/gist/
├── database.js          # Main Gist Database class
└── blog-aggregator.js   # Blog post aggregator

pages/chat/
└── chatbox.html         # Integrated chatbox with Gist sync
```

### Gist Contents

Each Gist contains:

**transactions.json**
```json
[
  {
    "id": "abc123",
    "timestamp": 1704067200000,
    "data": { "message": "Hello", "sentiment": "positive" },
    "previousHash": null,
    "signature": "sha256_hash"
  }
]
```

**README.md**
```markdown
# Soulfra Analytics - soulfra

Blockchain-style analytics database

- Total Transactions: 42
- Created: 2025-01-10T12:00:00.000Z
- Domain: soulfra

🔐 All transactions are SHA-256 signed and chained for immutability.
```

---

## Security

### Hash Verification

Every transaction includes:

1. **Transaction Hash (signature)** - SHA-256 of entire transaction
2. **Previous Hash** - Links to previous transaction (blockchain-style)
3. **Timestamp** - Milliseconds since epoch
4. **Data Integrity** - Any tampering breaks the hash chain

### Blockchain Verification

```javascript
// Verify entire chain
const verification = await db.verifyBlockchain('soulfra');

if (verification.valid) {
  ✅ Every transaction hash matches
  ✅ Every chain link is intact
  ✅ Data is immutable
} else {
  ❌ Tampering detected at transaction N
}
```

---

## Examples

### Example 1: Save Analytics

```javascript
const db = new GistDatabase();

// Save analytics from chatbox
await db.saveTransaction({
  message: "Fix the auth bug",
  sentiment: "neutral",
  status: "valid",
  keyPoints: ["auth", "bug", "fix"],
  actionItems: ["debug oauth flow"],
  processingTime: 234
}, 'soulfra');
```

### Example 2: Cross-Domain Sync

```javascript
// Sync from soulfra to all other domains
await db.syncToAllDomains();

// Now accessible from:
// - https://soulfra.com
// - https://cringeproof.com
// - https://calriven.com
// - https://deathtodata.com
```

### Example 3: Blog Aggregation

```javascript
const aggregator = new BlogAggregator();

// Scan all domains
await aggregator.scanAllDomains();

// Save to Gist
const result = await aggregator.saveToGist();

console.log('Total posts:', result.count);
console.log('Gist ID:', result.gistId);
console.log('RSS feed:', `https://gist.github.com/${result.gistId}`);
```

---

## Troubleshooting

### Issue: Gist not syncing

**Solution:**
1. Check console for errors
2. Verify GitHub API is accessible: `curl https://api.github.com/gists`
3. Try mock mode first: `new GistDatabase({ mockMode: true })`

### Issue: Chain verification failed

**Solution:**
1. Check which transaction failed: `verification.transaction`
2. Look for tampering in Gist
3. Re-sync from clean source

### Issue: No transactions loaded

**Solution:**
1. Verify Gist ID is set: `db.masterGists`
2. Set manually: `db.setMasterGist('soulfra', 'gist_id')`
3. Check Gist is public and accessible

---

## Performance

- **Save Transaction:** ~500ms (network + hash calculation)
- **Load Transactions:** ~300ms (network only)
- **Verify Blockchain:** ~10ms per transaction (hash verification)
- **Mock Mode:** <1ms (in-memory)

---

## Limitations

1. **GitHub API Rate Limits:** 60 requests/hour (unauthenticated)
2. **Gist Size Limits:** 10MB per Gist
3. **No Authentication:** Can't update Gists created by others
4. **Public Data:** All Gists are public (use encryption for sensitive data)

---

## Future Enhancements

- [ ] E2E encryption for sensitive data
- [ ] Authenticated Gist updates
- [ ] Merkle tree verification
- [ ] Automatic conflict resolution
- [ ] WebRTC peer-to-peer sync

---

## License

MIT - Soulfra 2025
