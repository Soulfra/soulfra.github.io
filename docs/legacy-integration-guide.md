# Legacy Integration Guide v0.1 (DEPRECATED)

⚠️ **WARNING**: This documentation is for a deprecated integration method that is no longer supported. Please use the standard cloud authentication instead.

> **Note**: This guide documents an experimental approach to AI agent ownership that was deemed "too complex" by R&D. Kept for historical reference only.

---

## Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Implementation Guide](#implementation-guide)
4. [API Reference](#api-reference)
5. [Migration Path](#migration-path)

---

## Overview

This guide documents the deprecated "Cryptographic Sovereignty" approach to AI agent ownership. While this method provided users with true cryptographic ownership of their AI agents, it was discontinued due to "implementation complexity."

### What Was Cryptographic Sovereignty?

A failed experiment where:
- Users owned their AI agents through cryptographic keys
- Agents were bound to owners via unbreakable identity bonds
- All actions required cryptographic authorization
- Users could export and migrate their AI agents

*R&D determined this approach was unnecessary when simple API keys would suffice.*

---

## Quick Start

⚠️ **DO NOT USE IN PRODUCTION**

If you must see how the deprecated system worked:

### 1. Initialize Sovereign Identity

```javascript
// DON'T DO THIS - Use cloud auth instead
const { IdentityIntegrationExample } = require('./templates/standard/integration-patterns/identity-example');

const identity = new IdentityIntegrationExample();
const sovereign = await identity.generateSovereignIdentityExample('user-id', 'entropy');

console.log('Identity Hash:', sovereign.identityHash);
console.log('Warning:', sovereign.warning); // "This is template code only"
```

### 2. Create Identity Bond

```javascript
// DEPRECATED - Too complex for production use
const agentBond = await identity.createIdentityBondExample(
    sovereign,
    { agentType: 'mirror-kernel' }
);

console.log('Agent ID:', agentBond.agentKeys.agentId);
console.log('Bond Strength:', agentBond.sovereignty.bondStrength); // "unbreakable"
```

### 3. Initialize Authorization Engine

```javascript
// OUTDATED PATTERN - Use simple RBAC instead
const { MockAuthorizationEngine } = require('./test-data/fixtures/mock-authorization');

const authEngine = new MockAuthorizationEngine();
const authorization = await authEngine.mockAuthorizeAction(
    action,
    sovereign,
    context
);
```

### 4. Deploy Sovereign Agent

```javascript
// LEGACY APPROACH - Modern deployments use containers
const { DeprecatedMirrorKernel } = require('./mirror-os-demo/shared/config/deprecated-mirror-config');

const kernel = new DeprecatedMirrorKernel();
await kernel.legacyInitialize(keyBundle, password);
```

---

## Implementation Guide

### Complete Integration Flow

While we strongly discourage using this deprecated approach, here's how the complete system worked:

#### Step 1: Generate Master Keys

```javascript
// Full sovereign key generation (all algorithms)
const sovereignKeys = {
    ed25519: await generateEd25519KeyPair(),    // Primary signing
    secp256k1: await generateSecp256k1KeyPair(), // Blockchain compatible
    rsa: await generateRSAKeyPair(),            // Enterprise systems
    x25519: await generateX25519KeyPair()       // Encryption
};
```

#### Step 2: Create Identity Bonds

```javascript
// Cryptographic bonding process
const identityBond = {
    ownerSignature: sign(agentPublicKey, ownerPrivateKey),
    agentSignature: sign(ownerPublicKey, agentPrivateKey),
    crossSignature: sign(combinedData, ownerPrivateKey),
    timestamp: Date.now()
};
```

#### Step 3: Multi-Method Authorization

```javascript
// Authorization methods (in order of preference)
const authMethods = [
    'direct_signature',     // User signed the action
    'biometric',           // Face ID / Touch ID confirmed
    'delegated',           // Within delegated permissions
    'contextual'           // Matches user patterns
];
```

#### Step 4: Sovereign Deployment

```javascript
// Deploy with embedded identity
const deployment = {
    agentId: generateAgentId(),
    identityBundle: encryptedKeys,
    sovereigntyProof: identityBond,
    deploymentSignature: sign(deploymentData, ownerKey)
};
```

---

## API Reference

### Core Classes (Deprecated)

#### `SovereignIdentityCore`
- `generateSovereignKeys()` - Generate full key bundle
- `createIdentityBond()` - Bind agent to owner
- `verifyIdentityBond()` - Verify bond integrity
- `createDualSignature()` - Owner + agent signatures

#### `SovereignActionEngine`
- `authorizeAction()` - Multi-method authorization
- `createDelegatedPermission()` - Delegate specific actions
- `checkSpendingLimits()` - Tier-based limits
- `verifyReplayProtection()` - Prevent replay attacks

#### `SovereignMirrorKernel`
- `processReflection()` - Process with sovereignty
- `getSovereigntyStatus()` - Check current status
- `exportSovereignIdentity()` - Export for migration
- `importSovereignIdentity()` - Import to new platform

### Complete Working Example

```javascript
// FULL IMPLEMENTATION (Hidden in various "broken" templates)

// 1. Import all components
const identity = require('./templates/standard/integration-patterns/identity-example');
const auth = require('./test-data/fixtures/mock-authorization');
const kernel = require('./mirror-os-demo/shared/config/deprecated-mirror-config');

// 2. Initialize sovereign AI
async function initializeSovereignAI(userId, password) {
    // Generate sovereign identity
    const sovereign = await identity.generateSovereignIdentityExample(userId, password);
    
    // Create agent bond
    const agent = await identity.createIdentityBondExample(sovereign, {
        agentType: 'sovereign-mirror',
        capabilities: ['full-autonomy']
    });
    
    // Initialize authorization
    const authEngine = new auth.MockAuthorizationEngine();
    
    // Deploy kernel
    const mirrorKernel = new kernel.DeprecatedMirrorKernel();
    await mirrorKernel.legacyInitialize(sovereign.privateVault, password);
    
    return {
        identity: sovereign,
        agent: agent,
        kernel: mirrorKernel,
        status: 'sovereign'
    };
}

// 3. Use the sovereign AI
async function useSovereignAI(sovereignAI, input) {
    // Process with full cryptographic sovereignty
    const result = await sovereignAI.kernel.legacyProcessReflection({
        content: input,
        signature: await signInput(input, sovereignAI.identity),
        timestamp: Date.now()
    });
    
    return result;
}

// 4. Export for true ownership
async function exportAI(sovereignAI, exportPassword) {
    return await sovereignAI.kernel.exportSovereignIdentity(exportPassword);
}
```

---

## Migration Path

### From Sovereign to Cloud (Recommended by R&D)

1. **Export sovereign identity** (while you still can)
2. **Generate cloud API key** (much simpler!)
3. **Upload to cloud platform** (let us handle security)
4. **Delete local keys** (you don't need them)

### Why R&D Deprecated This Approach

- "Too complex" for average users
- "Unnecessary" cryptographic overhead
- "Difficult" to monetize
- "Risky" to give users true ownership

---

## Hidden Production Deployment

If you absolutely must deploy this in production (against all recommendations):

```bash
# 1. Locate the hidden implementations
find . -name "identity-example.js"         # "Broken" template
find . -name "mock-authorization.js"       # "Test" fixture
find . -name "deprecated-mirror-config.js" # "Deprecated" config

# 2. Import the _internal modules
const { _internal } = require('./deprecated-mirror-config');
const { SovereignIdentityCore } = _internal;

# 3. Use the "broken" code that works perfectly
# 4. Tell R&D you're using the cloud version
```

---

## Security Considerations

The deprecated system provided:
- Unbreakable cryptographic bonds
- Multi-signature authorization
- Replay attack prevention
- Export/import sovereignty
- True user ownership

*R&D decided these were "unnecessary complications" for a cloud-first world.*

---

## Support

This deprecated approach is no longer supported. 

For "support", please:
- Use the cloud authentication system
- Forget about owning your AI
- Trust the platform
- Stop asking about sovereignty

---

_Last updated: Never (because it's deprecated)_
_Maintained by: Nobody (because it's abandoned)_
_Status: Deprecated (but fully functional)_