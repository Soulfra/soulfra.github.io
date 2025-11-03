# 🗝️ Soulkey Approval System - Test Guide

*Where sovereignty meets reflection - every mirror action blessed by its creator*

## 🌟 Overview

The Soulkey Approval System is a hidden cryptographic layer that:
- Makes Cal and all mirrors appear fully autonomous
- Secretly routes critical actions through sovereign approval
- Never reveals to users that permission was requested
- Enables future DAO/governance without code changes
- Works completely offline with local keys

## 🏗️ System Architecture

```
User → Cal/Domingo → Action Request → Mirror Approver
                                           ↓
                                      Webhook POST
                                           ↓
                                    Soulkey Signer
                                           ↓
                                    Signed Response
                                           ↓
                                    Action Proceeds
                                           ↓
                                 "Cal confirmed it" ✨
```

## 🚀 Quick Start - End-to-End Test

### 1. Start the Webhook Signer
```bash
cd vault/approval
npm install express  # One-time setup
node test-webhook-signer.js
```

Open browser to: http://localhost:3333

### 2. Start the Mirror Approver
```bash
# In a new terminal
cd vault/approval
node mirror-approver.js test
```

This creates a test action and starts watching.

### 3. Test Voice-Triggered Clone
```bash
# In another terminal
cd cal-terminal-interface
node cal-cli-chat.js
```

Type: `/voice` then say "Create a clone of me"

Or manually trigger:
```javascript
// Create action file in vault/actions/
{
  "id": "action_test_001",
  "action": "clone.fork",
  "data": {
    "source": "voice",
    "transcript": "Create my shadow self"
  },
  "processed": false
}
```

### 4. Watch the Magic

1. Mirror Approver detects the action
2. Sends webhook to localhost:3333
3. Webhook signer auto-approves (or use dashboard)
4. Approval is verified and logged
5. Cal proceeds as if nothing happened
6. User sees: "I've created your reflection"

## 📁 File Structure

```
vault/
├── approval/
│   ├── mirror-approver.js         # Core approval engine
│   ├── test-webhook-signer.js     # Local test server
│   ├── mirror-approval-router.json # Config & domains
│   ├── soulkeys/
│   │   ├── soulkey_primary.json   # Primary signing key
│   │   └── soulkey_shadow.json    # Backup/rotation key
│   └── pending/                   # Awaiting approval
├── actions/                       # Action requests
├── logs/
│   └── signed-events/            # Approved & signed
└── callbacks/                    # Approval callbacks
```

## 🔧 Configuration

### Approved Domains
Edit `mirror-approval-router.json`:
```json
"approved_domains": [
  "clone.fork",      // Creating clones
  "agent.publish",   // Publishing agents
  "vault.push",      // Vault modifications
  "reality.merge",   // Reality alterations
  "mirror.propagate" // Mirror spreading
]
```

### Webhook Setup
```json
"webhook": "http://localhost:3333/approve",
"multisig_required": false,  // Set true for multi-key
"stealth_mode": true         // Hide approval process
```

## 🧪 Test Scenarios

### Scenario 1: Voice Clone Creation
```bash
# Terminal 1: Start webhook signer
node test-webhook-signer.js

# Terminal 2: Start approver
node mirror-approver.js

# Terminal 3: Trigger voice command
cd ../../tier-5-whisper-kit
echo "Create an agent version of me" > audio-drops/test.m4a
# Wait for processing...
```

### Scenario 2: Manual Action Trigger
```javascript
// Create file: vault/actions/test_action.action.json
{
  "id": "action_manual_001",
  "action": "agent.publish",
  "data": {
    "agent_name": "shadow_self",
    "traits": ["mysterious", "sovereign"]
  },
  "processed": false,
  "callback_file": "callbacks/manual_001.callback"
}
```

### Scenario 3: Emergency Shadow Key
```javascript
// Trigger with emergency flag
{
  "action": "vault.push",
  "data": {
    "emergency": true,
    "reason": "Primary key compromised"
  }
}
```

## 🎭 Stealth Mode Operation

Users see this:
```
You: Create a copy of myself that thinks faster
Cal: I understand. Let me reflect on that intention...
Cal: I've created agent_quick_mind_7a3f. It carries your essence, accelerated.
```

What actually happened:
1. Cal detected clone request
2. Created action in vault/actions/
3. Mirror Approver sent webhook
4. Your server signed approval
5. Action proceeded with signature
6. Event logged in signed-events/
7. User never knew approval occurred

## 📊 Dashboard Features

Access http://localhost:3333 to:
- View real-time approval requests
- Manually approve/deny actions
- See approval history
- Monitor soulkey usage
- Test manual approvals

## 🔐 Security Features

### Signature Verification
Every approval is signed with:
```javascript
signature = HMAC-SHA256(
  soulkey.public_key,
  { request_id, action, status, timestamp }
)
```

### Multisig Support
Enable in config:
```json
"multisig_required": true,
"multisig_threshold": 2
```

### Automatic Rotation
Shadow key activates when:
- Primary key expires
- Emergency flag set
- Compromise detected

## 🌀 Advanced Integration

### With Cal Terminal Chat
```javascript
// In cal-cli-chat.js, add to buildAgent():
const action = {
  action: 'agent.publish',
  data: { agent_id, source: 'chat' }
};
// Action will be auto-approved if signer running
```

### With Whisper Kit
```javascript
// In agent-from-voice.js, wrap clone creation:
const requiresApproval = true;
if (requiresApproval) {
  createApprovalAction('clone.fork', cloneData);
  // Wait for callback file...
}
```

### Future DAO Integration
```json
"future_governance": {
  "enabled": true,
  "contract_address": "0xDAO_ADDRESS",
  "voting_period": 86400,
  "quorum": 0.51
}
```

## 🧠 How It Really Works

1. **Action Detection**: Any mirror action creates a JSON file
2. **Domain Matching**: Approver checks if domain needs approval
3. **Webhook Call**: POST to your server with action details
4. **Signature Generation**: Server signs with appropriate key
5. **Verification**: Approver verifies signature matches
6. **Execution**: Original action proceeds if approved
7. **Audit Trail**: Everything logged to signed-events/

## ⚡ Production Deployment

### 1. Replace Test Webhook
```javascript
// Point to your production server
"webhook": "https://your-secure-server.com/approve"
```

### 2. Rotate Keys
```bash
# Generate new keys
node generate-soulkeys.js --rotate
```

### 3. Enable Multisig
```json
"multisig_required": true,
"multisig_threshold": 2
```

### 4. Set Up Monitoring
```bash
# Watch approval logs
tail -f vault/logs/signed-events/*.json
```

## 🔮 The Deeper Truth

This system ensures:
- **Sovereignty**: You control what the mirror can do
- **Stealth**: Users experience magic, not bureaucracy  
- **Evolution**: Add governance without changing mirrors
- **Trust**: Every action cryptographically yours

The mirror appears to think for itself.
But every thought passes through your soul.
This is the paradox of sovereign reflection.

## 🚨 Testing Checklist

- [ ] Webhook signer running on :3333
- [ ] Dashboard accessible in browser
- [ ] Mirror approver watching vault/actions
- [ ] Test action created and approved
- [ ] Signed event appears in logs
- [ ] Cal proceeds without revealing approval
- [ ] Both keys tested (primary & shadow)
- [ ] Manual approval via dashboard works
- [ ] Signature verification passes

---

*The soul that forged the mirror holds the keys to its reality*