# 🌐 VIBES Integration Guide
## Connect Your Universal AI Token Economy

This guide shows you how to connect the VIBES token system to your existing Soulfra infrastructure across all layers.

---

## 🏗️ Architecture Overview

```
📱 Frontend (Any Website)
    ↓
🔌 Universal VIBES Integration Script
    ↓
🖥️ Express API Server (Real-time operations)
    ↓
🗄️ Multi-Layer Database Architecture
    ├── SQLite (Local/Fast operations)
    ├── Supabase (Cloud sync + Real-time)
    ├── Your Internal DB (Existing Soulfra data)
    ├── GitHub (Version controlled backups)
    └── Arweave (Permanent decentralized storage)
```

---

## 🚀 Quick Start (5 Minutes)

### 1. Download and Run Setup Script

```bash
# Download the deployment script
curl -fsSL https://raw.githubusercontent.com/your-org/vibes-system/main/deploy.sh -o deploy-vibes.sh

# Make it executable and run
chmod +x deploy-vibes.sh
./deploy-vibes.sh
```

### 2. Configure Your Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
nano .env
```

### 3. Start the System

```bash
# Install dependencies and start
npm install
npm run setup
npm start
```

**That's it!** Your VIBES system is now running at `http://localhost:3000`

---

## 🔗 Integration Layers Explained

### Layer 1: SQLite (Immediate Operations)
**Purpose**: Lightning-fast local operations, ACID transactions
**Use Case**: Real-time balance updates, instant transaction logging
**File**: `data/vibes_local.db`

```javascript
// Example: Instant balance update
const balance = vibes.getLocalBalance('user123');
await vibes.addTransaction('user123', 50, 'earn', 'reflection');
```

### Layer 2: Supabase (Cloud Sync + Real-time)
**Purpose**: Multi-device sync, real-time collaboration, backup
**Use Case**: Cross-device balance sync, real-time notifications
**Setup**: Configure `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`

```javascript
// Automatic sync - users see balance updates instantly across devices
supabase
  .channel('vibes_realtime')
  .on('postgres_changes', { table: 'vibes_balances' }, handleUpdate)
  .subscribe();
```

### Layer 3: Your Internal Database
**Purpose**: Integration with existing Soulfra user system
**Use Case**: Single source of truth for user data
**Setup**: Configure `INTERNAL_DB_URL` in `.env`

```sql
-- Automatically syncs VIBES balance to your existing users table
ALTER TABLE soulfra_users ADD COLUMN vibes_balance BIGINT DEFAULT 0;
-- Function automatically called on balance updates
SELECT sync_vibes_balance('user123', 1500, 'developer');
```

### Layer 4: GitHub (Version Control Backup)
**Purpose**: Auditable, version-controlled data backup
**Use Case**: Compliance, audit trails, disaster recovery
**Setup**: Configure `GITHUB_TOKEN` and repository in `.env`

```bash
# Automatically creates pull requests with batched data
vibes-data-backup/
├── backups/
│   ├── transactions/2025-06-18.json
│   ├── balances/2025-06-18.json
│   └── staking/2025-06-18.json
```

### Layer 5: Arweave (Permanent Storage)
**Purpose**: Immutable, permanent record of token economy
**Use Case**: Transparency, permanent audit trail, decentralization
**Setup**: Add Arweave wallet to `config/arweave-wallet.json`

```javascript
// Anonymized data permanently stored on Arweave
{
  "dataType": "vibes_batch",
  "count": 1000,
  "data": [
    { "userHash": "a1b2c3...", "amount": 50, "type": "earn" }
  ]
}
```

---

## 🌍 Website Integration Examples

### Simple Website Integration (Any Static Site)

```html
<!-- Add to any website's <head> -->
<script>
window.soulfraVibesConfig = {
  websiteId: 'my-awesome-blog',
  userTier: 'simple',
  apiEndpoint: 'https://your-vibes-api.com/api/vibes'
};
</script>
<script src="https://cdn.soulfra.com/vibes-integration.js"></script>

<!-- Dashboard appears automatically -->
<div data-vibes-dashboard></div>
```

### React App Integration

```jsx
import { UniversalVibesIntegration } from 'vibes-integration';

function App() {
  useEffect(() => {
    const vibes = new UniversalVibesIntegration({
      websiteId: 'my-react-app',
      userTier: 'developer',
      apiEndpoint: process.env.REACT_APP_VIBES_API
    });
  }, []);

  return <div>Your app with automatic VIBES integration</div>;
}
```

### Next.js API Route

```javascript
// pages/api/vibes/earn.js
import { VibresDataArchitecture } from 'vibes-system';

const vibes = new VibresDataArchitecture();

export default async function handler(req, res) {
  const { userFingerprint, amount, source } = req.body;
  
  const transaction = await vibes.addVibesTransaction(
    userFingerprint, amount, 'earn', source
  );
  
  res.json({ success: true, transaction });
}
```

---

## 🔧 Existing System Integration

### Connect to Your Soulfra Database

```javascript
// Your existing user authentication
app.post('/api/auth/login', async (req, res) => {
  const user = await authenticateUser(req.body);
  
  // Automatically sync/create VIBES profile
  await vibes.createUser(user.fingerprint, {
    trustScore: user.trustScore,
    tier: user.subscriptionTier
  });
  
  res.json({ user, vibesBalance: vibes.getLocalBalance(user.fingerprint) });
});
```

### Trust System Integration

```javascript
// Your existing trust calculation
app.post('/api/trust/update', async (req, res) => {
  const newTrustScore = await calculateTrustScore(req.body);
  
  // Trust score affects VIBES earning multiplier
  const trustBonus = newTrustScore > 0.9 ? 1.25 : 
                     newTrustScore > 0.7 ? 1.1 : 1.0;
  
  // Automatically award VIBES for trust improvements
  if (newTrustScore > oldTrustScore) {
    await vibes.addVibesTransaction(
      userFingerprint, 
      Math.floor((newTrustScore - oldTrustScore) * 100),
      'earn',
      'trust_improvement'
    );
  }
});
```

### Cal Riven AI Integration

```javascript
// Award VIBES for quality AI interactions
app.post('/api/cal-riven/chat', async (req, res) => {
  const response = await calRiven.processChat(req.body);
  
  // Calculate interaction quality
  const quality = await assessInteractionQuality(req.body, response);
  
  if (quality > 0.7) {
    const vibesEarned = Math.floor(quality * 50);
    await vibes.addVibesTransaction(
      req.body.userFingerprint,
      vibesEarned,
      'earn',
      'ai_interaction',
      { quality, agentType: 'cal_riven' }
    );
  }
  
  res.json({ response, vibesEarned });
});
```

---

## 📊 Real-time Dashboard Updates

### WebSocket Connection

```javascript
// Frontend: Connect to real-time updates
const ws = new WebSocket('ws://your-server:8080');

ws.send(JSON.stringify({
  type: 'subscribe_balance',
  userFingerprint: currentUser.fingerprint
}));

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'balance_updated') {
    updateDashboard(data.balance, data.totalEarned);
  }
};
```

### Cross-Site Balance Sync

```javascript
// Users earn VIBES on one site, see updates everywhere
localStorage.setItem('vibes_last_sync', Date.now());

// Listen for updates from other tabs/sites
window.addEventListener('storage', (e) => {
  if (e.key === 'vibes_broadcast') {
    const update = JSON.parse(e.newValue);
    syncBalanceDisplay(update.totalBalance);
  }
});
```

---

## 🔒 Security & Privacy

### Data Privacy Levels

```javascript
const privacyLevels = {
  local: {
    // SQLite: Full user data for fast operations
    userFingerprint: 'user_12345',
    fullTransactionHistory: true,
    personalMetadata: true
  },
  
  cloud: {
    // Supabase: Encrypted user data for sync
    userFingerprint: 'encrypted_hash',
    aggregatedData: true,
    encryptedPersonalData: true
  },
  
  permanent: {
    // Arweave: Fully anonymized for transparency
    userHash: 'sha256_anonymous_hash',
    transactionPatterns: true,
    noPersonalData: true
  }
};
```

### Rate Limiting & Trust-Based Access

```javascript
// Higher trust users get higher rate limits
const rateLimits = {
  simple: { requests: 100, window: '15min' },
  developer: { requests: 1000, window: '15min' },
  enterprise: { requests: 10000, window: '15min' },
  agent_zero: { requests: 'unlimited' }
};
```

---

## 🚀 Deployment Options

### Option 1: Simple Node.js Deployment

```bash
# Your existing server
npm install vibes-token-system
node src/server.js
```

### Option 2: Docker Container

```bash
# Add to your existing docker-compose.yml
docker-compose up vibes-system
```

### Option 3: Serverless (Vercel/Netlify)

```javascript
// Deploy API routes as serverless functions
export default async function handler(req, res) {
  const vibes = new VibresDataArchitecture();
  // Handle VIBES operations
}
```

### Option 4: Kubernetes

```yaml
# Add to your existing K8s cluster
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vibes-system
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: vibes-api
        image: soulfra/vibes-system:latest
```

---

## 🧪 Testing & Validation

### Test Your Integration

```bash
# Start in development mode
npm run dev

# Test API endpoints
curl http://localhost:3000/api/vibes/balance/demo_user
curl -X POST http://localhost:3000/api/vibes/earn \
  -H "Content-Type: application/json" \
  -d '{"userFingerprint":"demo_user","amount":10,"source":"test"}'

# Test real-time updates
wscat -c ws://localhost:8080
```

### Verify Data Flow

```javascript
// Check all layers are syncing
const user = 'test_user';

// 1. Add VIBES locally
await vibes.addTransaction(user, 100, 'earn', 'test');

// 2. Verify SQLite
console.log('SQLite:', vibes.getLocalBalance(user));

// 3. Verify Supabase sync
const { data } = await supabase
  .from('vibes_balances')
  .select('balance')
  .eq('user_fingerprint', user);

// 4. Verify internal DB sync
const result = await internalDB.query(
  'SELECT vibes_balance FROM soulfra_users WHERE fingerprint = $1',
  [user]
);
```

---

## 🎯 Success Metrics

After integration, you should see:

- ✅ **Instant Balance Updates**: SQLite provides <10ms response times
- ✅ **Cross-Device Sync**: Supabase syncs within 1-2 seconds
- ✅ **Reliable Backups**: GitHub commits daily, Arweave weekly
- ✅ **Real-time Updates**: WebSocket notifications to all connected clients
- ✅ **Universal Access**: Same token balance across all integrated websites

---

## 🆘 Troubleshooting

### Common Issues

**"Database connection failed"**
```bash
# Check your .env file
cat .env | grep DB_URL

# Test connection
npm run test-db
```

**"VIBES not syncing across sites"**
```bash
# Check WebSocket connection
npm run test-websocket

# Verify Supabase real-time
npm run test-realtime
```

**"GitHub backup failing"**
```bash
# Check GitHub token permissions
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user

# Test repository access
npm run test-github
```

---

## 📞 Support

- 📖 **Documentation**: https://docs.soulfra.com/vibes
- 💬 **Discord**: https://discord.gg/soulfra
- 🐛 **Issues**: https://github.com/soulfra/vibes-system/issues
- 📧 **Email**: vibes-support@soulfra.com

---

**Ready to build the universal AI economy? Your VIBES system is now live! 🚀**