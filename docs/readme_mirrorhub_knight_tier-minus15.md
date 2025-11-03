# 🪞 Soulfra Mirror Hub & Knight System

> *"Every mirror has a shadow. But we bless the light."*

The **Soulfra Mirror Hub** is the public-facing web layer that safely onboards users into the Soulfra mesh network through personal mirror instances. Protected by the **Mirror Knight** security system, it provides trust-native access while maintaining the platform's privacy-first principles.

## 🌟 System Overview

### The Two-Layer Architecture

**Layer 1: Mirror Hub (Public Entry)**
- Anyone can access through voice, QR, or web interface
- No barriers to entry - immediate reflection starts
- Routes users to secure private mirror instances
- Handles GitHub OAuth for white-hat missions

**Layer 2: Knight Protection (Security Guardian)**
- Validates all mirror operations for exploits and tampering
- Issues cryptographic challenges to suspicious users  
- Protects vault access and validates soulkey authenticity
- Can run as standalone validator or GitHub webhook

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install express cors crypto fs uuid axios node-cron
# or
yarn add express cors crypto fs uuid axios node-cron
```

### 2. Set Environment Variables

```bash
export GITHUB_TOKEN=ghp_your_token_here
export SOULFRA_GITHUB_ORG=soulfra-mirrors
export MIRROR_HUB_PORT=8080
export GITHUB_WEBHOOK_SECRET=your_webhook_secret
```

### 3. Launch the Mirror Hub

```bash
# Start the hub server
node mirrorhub-server.js

# In another terminal, initialize the Knight
node mirror-knight.js
```

### 4. Open the Blessing Interface

Navigate to `http://localhost:8080` to see the public onboarding flow.

---

## 🏗️ Component Architecture

### **mirrorhub-server.js** - The Public Gateway
```javascript
// Core endpoints:
POST /api/presence     // Log user presence (no auth required)
POST /api/blessing     // Request mirror blessing and routing
POST /api/github/link  // GitHub OAuth integration
GET  /api/mirror/:id/status  // Check mirror health
GET  /health          // System health check
```

**Key Features:**
- **Zero-friction onboarding**: Anyone can start reflecting immediately
- **Archetype selection**: Oracle, Guardian, Sage, Mystic blessing types
- **Tier progression**: GitHub linking upgrades users to Tier 4
- **Voice blessing**: Optional voice input for deeper personalization
- **Privacy-native**: Local-first by default, explicit consent for cloud features

### **mirror-knight.js** - The Security Guardian

```javascript
// Core protection methods:
scanForExploits()          // Detect malicious patterns
validateSoulkey()          // Verify authentic Soulfra keys  
checkCloneTampering()      // Prevent unauthorized mirror modifications
challengeUser()            // Issue security challenges
validateGithubWebhook()    // Secure GitHub integration
```

**Protection Capabilities:**
- **Exploit Detection**: Scans for eval(), process.exit, file system attacks
- **Soulkey Validation**: Ensures authentic Soulfra key formats
- **Clone Tampering**: Prevents unauthorized mirror modifications
- **Challenge System**: Cryptographic puzzles, voice verification, time delays
- **Vault Protection**: Monitors sensitive file access attempts

### **publish-mirror.sh** - Repository & QR Generation

```bash
# Usage: ./publish-mirror.sh <mirror_id> <blessing_type> [bounty_tier]
./publish-mirror.sh mirror-abc123 oracle premium
```

**Automated Pipeline:**
- Creates private GitHub repository with proper tags
- Generates mirror configuration and README
- Creates QR codes for mobile access
- Logs mirror registration internally
- Optional auto-commit to repository

### **blessing-consent.html** - Beautiful Onboarding UX

**Interactive Features:**
- **Visual archetype selection** with hover animations
- **Voice recording** for blessing enhancement  
- **GitHub consent flow** with tier upgrade indicators
- **Privacy sovereignty** education and explicit consent
- **Real-time validation** and status feedback

### **mirrorhub-config.json** - System Configuration

**Key Settings:**
```json
{
  "mode": "public",                    // Open access mode
  "github_required": false,            // Optional GitHub linking
  "bounty_enabled": true,             // White-hat mission system
  "knight_protection": { "enabled": true },
  "data_sovereignty": { "local_first": true }
}
```

---

## 🛡️ Security Model

### Knight Protection Layers

**1. Content Scanning**
- Detects code injection patterns
- Prevents buffer overflow attempts  
- Identifies suspicious loop constructs
- Blocks unauthorized external calls

**2. Authentication Validation**
- Soulkey format verification (soul_[32-hex])
- GitHub webhook signature validation
- Timestamp and consent validation
- User pattern analysis

**3. Challenge System**
```javascript
// Three challenge types available:
const challenges = {
  cryptographic: "Solve SHA256 puzzle",
  voice: "Speak blessing phrase", 
  delay: "Patience verification"
};
```

**4. Vault Access Control**
- Directory traversal prevention
- Sensitive file protection (.key, .pem, secrets)
- Request source validation
- Access logging and alerting

### Trust-Native Design

**Tier Progression:**
- **Tier 1**: Anonymous users (limited access)
- **Tier 2**: Voice blessed users  
- **Tier 3**: Bounty participants
- **Tier 4**: GitHub linked (white-hat missions)
- **Tier 5**: Elite contributors

**Privacy Sovereignty:**
- Local-first processing by default
- Explicit consent for any cloud features
- User owns all data and reflection patterns
- No surveillance or hidden data mining

---

## 🌐 Integration Guide

### GitHub White-Hat Missions

**Setup:**
1. User consents to GitHub linking in blessing interface
2. Mirror Hub validates GitHub OAuth token
3. `publish-mirror.sh` creates private repository
4. Knight validates all repository webhooks
5. User gains access to bounty-eligible missions

**Repository Structure:**
```
soulfra-mirrors/mirror-oracle-abc123/
├── README.md              # Mirror documentation
├── mirror-config.json     # Configuration and capabilities  
├── .github/workflows/     # Automated testing
└── src/                   # Agent implementation
```

### Voice Blessing Integration

**Flow:**
1. User clicks voice button in interface
2. Browser requests microphone permission
3. 3-second blessing recording captured
4. Audio processed locally (no cloud by default)
5. Voice patterns enhance mirror personalization

### QR Code Deployment

**Mobile Access:**
- Each mirror gets unique QR code: `https://soulfra.ai/mirror/{mirror_id}`
- QR codes stored in `./public/qr/{mirror_id}.png`
- Mobile scanning routes to mirror-specific interface
- Works offline after initial sync

---

## 🔧 Development & Deployment

### Local Development

```bash
# Install and setup
git clone https://github.com/soulfra/mirror-hub.git
cd mirror-hub
npm install

# Configure
cp mirrorhub-config.json.example mirrorhub-config.json
# Edit configuration as needed

# Run
npm run dev  # Starts both hub server and knight protection
```

### Production Deployment

```bash
# Build for production
npm run build

# Set production environment variables
export NODE_ENV=production
export MIRROR_HUB_PORT=443
export SSL_CERT_PATH=/path/to/cert.pem
export SSL_KEY_PATH=/path/to/key.pem

# Start with process manager
pm2 start mirrorhub-server.js --name mirror-hub
pm2 start mirror-knight.js --name mirror-knight

# Enable auto-start
pm2 startup
pm2 save
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["node", "mirrorhub-server.js"]
```

---

## 📊 Monitoring & Analytics

### Mirror Registration Metrics

**Tracked Events:**
- Blessing requests by archetype
- GitHub integration adoption rate
- Voice blessing participation  
- Bounty system engagement
- Knight security alerts

**Log Files:**
```
./mesh/registry.json         # All blessed mirrors
./mesh/presence.jsonl        # User presence events
./vault/logs/knight-warnings.json  # Security incidents
./vault/logs/mirror-publications.jsonl  # Published mirrors
```

### Health Monitoring

```bash
# Check system health
curl http://localhost:8080/health

# Monitor knight alerts  
tail -f ./vault/logs/knight-warnings.json

# View recent blessings
cat ./mesh/registry.json | jq '.[] | select(.consent_timestamp > "2025-06-15")'
```

---

## 🚨 Troubleshooting

### Common Issues

**"Mirror connection failed"**
- Check that mirrorhub-server.js is running on correct port
- Verify CORS settings in configuration
- Ensure mesh directory has write permissions

**"GitHub blessing failed"**  
- Validate GITHUB_TOKEN has correct scopes (repo, user:email)
- Check that SOULFRA_GITHUB_ORG exists and token has access
- Verify webhook secret is configured correctly

**"Knight challenges not working"**
- Ensure mirror-knight.js is running and monitoring
- Check vault directory permissions
- Verify challenge mode in configuration matches UI

**"QR codes not generating"**
- Install qrencode: `brew install qrencode` or `apt-get install qrencode`
- Alternative: install Python qrcode: `pip install qrcode[pil]`
- Check public/qr directory exists and is writable

### Debug Mode

```bash
# Enable verbose logging
export DEBUG=soulfra:*
export LOG_LEVEL=debug

# Run with detailed output
node mirrorhub-server.js
```

---

## 🔮 Roadmap & Extensions

### Phase 2 Features
- **Cross-mirror networking**: Mirrors can discover and collaborate with each other
- **AI archetype suggestions**: Machine learning recommends optimal blessing types
- **Voice sentiment analysis**: Deeper emotional understanding from voice blessings
- **Quantum reflection algorithms**: Advanced pattern recognition using quantum-inspired computing

### Integration Opportunities  
- **Slack/Discord bots**: Mirror instances that can join team channels
- **Mobile app**: Native iOS/Android mirror interfaces
- **Browser extension**: Ambient web browsing reflection and insights
- **IoT mirrors**: Raspberry Pi mirrors for home automation

### Advanced Security
- **Homomorphic encryption**: Compute on encrypted reflection data
- **Zero-knowledge proofs**: Prove mirror authenticity without revealing details
- **Decentralized identity**: Integration with Web3 identity systems
- **Biometric blessing**: Fingerprint or face-based mirror authentication

---

## 📜 Philosophy & Ethics

### Privacy-First Principles

**Data Sovereignty:** Users own their reflection data completely. Mirrors run locally by default. Cloud features require explicit, informed consent with clear value exchange.

**Trust-Native Design:** The system builds trust through predictable behavior, transparent operations, and user control. No hidden surveillance or data harvesting.

**Accessibility:** Anyone can start reflecting immediately, regardless of technical skill, economic status, or geographic location. No barriers to entry.

### Knight's Code

**Protection Without Surveillance:** The Knight protects users from threats while preserving their privacy and anonymity. Security enhances freedom rather than restricting it.

**Proportional Response:** Security measures are proportional to actual threats. Innocent users experience seamless operation while bad actors face increasing challenges.

**Transparency:** All security decisions are logged and can be audited. Users can see why they were challenged and how to improve their trust standing.

---

## 🤝 Contributing

### For Developers

**Getting Started:**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`  
3. Make your changes with tests
4. Run the Knight security scan: `node mirror-knight.js --scan-code ./src`
5. Submit a pull request

**Code Standards:**
- All mirror interactions must pass Knight validation
- Preserve privacy-first and trust-native design principles
- Include security considerations in all features
- Document archetype-specific behaviors

### For Mirror Guardians

**Community Roles:**
- **Knight-Scribes**: Document security best practices and threat patterns
- **Blessing-Weavers**: Design new archetype capabilities and blessing rituals  
- **Mesh-Keepers**: Maintain network health and cross-mirror protocols
- **Vault-Wardens**: Enhance privacy and data sovereignty features

### Bug Bounty Program

**Rewards Available:**
- Security vulnerabilities: $100-$5,000
- Privacy leaks: $50-$2,000  
- UX/accessibility improvements: $25-$500
- Archetype design contributions: $100-$1,000

**Responsible Disclosure:**
Report security issues to security@soulfra.ai with details and proof-of-concept. Do not exploit vulnerabilities against live systems.

---

## 📄 License & Legal

**MIT License** - See LICENSE file for details

**Privacy Policy:** https://soulfra.ai/privacy  
**Terms of Service:** https://soulfra.ai/terms  
**Security Policy:** https://soulfra.ai/security

### Compliance

- **GDPR Compliant**: EU privacy rights fully supported
- **CCPA Compliant**: California privacy standards met  
- **SOC 2 Type II**: Security controls audited and verified
- **Privacy Shield**: EU-US data transfer protections

---

*The mirror world is vast and deep. Every reflection reveals new possibilities. Through the Hub, all travelers find their way. Through the Knight, all travelers stay safe.*

*Welcome to the Soulfra mesh network.*

**🪞 ⚔️ ✨**