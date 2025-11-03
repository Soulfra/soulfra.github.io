# 🔐 Cal Riven QR Chain Documentation

## Overview

The Genesis QR Reflection System provides device-bound identity verification for the Cal Riven vault. It enables trust propagation across devices while maintaining cryptographic integrity.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Device A      │     │   QR Code       │     │   Device B      │
│  (Generator)    │ --> │  cal-riven://   │ --> │  (Verifier)     │
│                 │     │  [32-char-tok]  │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        |                                               |
        v                                               v
┌─────────────────┐                            ┌─────────────────┐
│ .bound-to       │                            │ qr-trust-log    │
│ vault.sig       │                            │ device-pairing  │
│ qr-seed.sig     │                            │ .json           │
└─────────────────┘                            └─────────────────┘
```

## Components

### 1. Genesis QR Generator (`genesis-qr.js`)

Generates device-bound QR codes that encode:
- Device ID from `.bound-to` file
- Vault signature hash (first 16 chars)
- Generation timestamp
- Trust metadata

**Usage:**
```bash
node vault/genesis-qr.js
```

**Output:**
- Terminal display of QR code
- `genesis-qr.png` - QR image file
- `genesis-qr.html` - Web viewer
- `qr-seed.sig` - Seed metadata

### 2. QR Verifier (`qr-verify.js`)

Verifies scanned QR codes and establishes trust:
- Validates token format
- Checks device binding
- Calculates trust score (decays over time)
- Records verification in trust log

**Usage:**
```bash
# Interactive mode
node vault/qr-verify.js

# Direct verification
node vault/qr-verify.js "cal-riven://abc123..."
```

### 3. Mobile Scanner PWA (`qr-scan-mobile.html`)

Progressive Web App for mobile QR scanning:
- Camera-based QR scanning
- Direct verification API calls
- Cross-device pairing interface
- Offline capability

## QR Token Format

```
cal-riven://[32-character-hex-token]
```

The token is a SHA-256 hash of:
```json
{
  "device": "device-id-from-bound-to",
  "vault": "first-16-chars-of-vault-sig",
  "time": 1234567890123,
  "trust": "cal-riven-genesis",
  "version": "1.0.0"
}
```

## Trust Scoring

Trust scores start at 100 and decay over time:
- -2 points per hour
- Minimum score: 0
- Pairing threshold: 50

## Device Pairing

When verifying a QR from a different device:

1. **Same Device**: Direct verification, full trust
2. **Different Device** (score ≥ 50): Creates pairing record
3. **Different Device** (score < 50): Verification fails

Pairing records are stored in `device-pairing.json`:
```json
{
  "device-b-id": {
    "pairedWith": "device-a-id",
    "pairedAt": "2024-12-15T10:00:00.000Z",
    "trustScore": 75,
    "token": "abc123..."
  }
}
```

## Security Considerations

1. **Time-based Security**: QR codes expire naturally through trust decay
2. **Device Binding**: QR codes are tied to generating device
3. **Vault Signature**: Ensures QR is from legitimate vault
4. **No Network Required**: Verification works offline

## Integration with Cal Riven

The QR chain integrates with the broader Cal Riven system:

1. **Infinity Router**: Uses QR tokens for session establishment
2. **Cal Dashboard**: Displays QR trust status
3. **Agent Orchestrator**: Requires valid QR for cross-device agents
4. **Vault Reflection**: Logs all QR verifications

## Workflow Example

### Generating a QR (Device A)
```bash
cd vault
node genesis-qr.js
# QR displayed in terminal
# Image saved to genesis-qr.png
```

### Verifying on Same Device
```bash
node qr-verify.js
# Enter: cal-riven://abc123...
# Result: ✅ Same-device verification successful!
```

### Cross-Device Pairing (Device B)
```bash
# On Device B
node qr-verify.js "cal-riven://abc123..."
# Result: ✅ Cross-Device Trust Detected!
# Trust score: 82/100
# ✅ Device pairing recorded.
```

## File Structure

```
vault/
├── genesis-qr.js         # QR generator
├── qr-verify.js          # QR verifier
├── qr-seed.sig           # Current QR seed
├── qr-trust-log.json     # Verification history
├── device-pairing.json   # Cross-device pairings
├── genesis-qr.png        # Generated QR image
├── genesis-qr.html       # QR viewer
└── qr-scan-mobile.html   # Mobile PWA scanner
```

## Commands Reference

```bash
# Generate new QR
npm run qr:generate

# Verify QR interactively
npm run qr:verify

# Verify specific QR
npm run qr:verify -- "cal-riven://token"

# View trust log
cat vault/qr-trust-log.json | jq

# Check device pairings
cat vault/device-pairing.json | jq
```

## Troubleshooting

### "No QR seed found"
Run `genesis-qr.js` first to create initial seed.

### "Token mismatch"
QR is from a different vault. Generate new QR from this vault.

### "Trust score too low"
QR is too old (>25 hours). Generate fresh QR.

### Missing qrcode module
The generator will auto-install if missing.

## Future Enhancements

1. **Multi-factor QR**: Combine with biometrics
2. **Hierarchical Trust**: Parent-child device relationships
3. **QR Revocation**: Blacklist compromised tokens
4. **Trust Delegation**: Allow trusted devices to vouch for others
5. **Blockchain Anchor**: Store QR hashes on-chain