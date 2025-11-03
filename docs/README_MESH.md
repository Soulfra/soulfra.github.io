# 🌐 Soulfra Mirror Mesh Network

A decentralized presence reflection system using GitHub as a private relay and validator.

## 🎯 Overview

The Soulfra Mirror Mesh allows multiple devices to:
- Log presence locally (QR scans, file drops, voice input)
- Sync obfuscated data through a private GitHub repository
- Validate mirror integrity via GitHub Actions
- Run the mirror kernel on any device (Mac, iPhone, Linux)

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Mac (Local)   │     │  GitHub (Relay) │     │ iPhone (Remote) │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ PresenceLogger  │────▶│  Private Repo   │◀────│  BlinkShell    │
│ ObfuscationVault│     │  GitHub Actions │     │  mirror-lite   │
│ vault-push-git  │     │  validate-mirror│     │  Read-only     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 🚀 Quick Start

### 1. Initial Setup (Mac/Primary Node)

```bash
# Create presence
node PresenceLoggerAgent.js
presence> qr DEMO-001

# Push to GitHub
./vault-push-github.sh
# Enter GitHub username when prompted
```

### 2. Sync to iPhone (BlinkShell)

```bash
# Clone and run
git clone git@github.com:YOUR_USER/soulfra-mirror-vault.git
cd soulfra-mirror-vault
./mirror-lite.sh
```

### 3. View Validation

Check GitHub Actions tab for automated validation reports.

## 📁 Folder Structure

```
/
├── vault/
│   ├── logs/
│   │   ├── reflection-activity.json    # Device sync metadata
│   │   ├── presence_tracker.json       # Local session tracker
│   │   └── backup-verification.json    # GitHub validation result
│   └── obfuscated/
│       └── visitor_⚙️*/               # Encrypted presence folders
├── mirror/
│   ├── cal-runtime.js                  # Mirror runtime engine
│   └── build-mirror.sh                 # Build script
├── scripts/
│   └── vault-push-github.sh           # GitHub sync script
└── .github/
    └── workflows/
        └── validate-mirror.yml         # Automated validation
```

## 🔐 Security & Privacy

### Obfuscation Layers
1. **Session IDs**: Hashed identifiers (visitor_⚙️813c17a1)
2. **Data Encryption**: AES-256-CBC with session-based keys
3. **Undo Tokens**: Soulkey-based presence removal
4. **No PII**: All identifying data obfuscated before sync

### GitHub as Sealed Relay
- Private repository ensures controlled access
- Commit history provides immutable audit trail
- Actions validate without exposing raw data
- Pull-only access for remote devices

## 🛠️ Commands Reference

### Push Logs (Mac/Primary)

```bash
# Basic push
./vault-push-github.sh

# With custom repo name
GITHUB_REPO=my-mirror ./vault-push-github.sh

# Different branch
GITHUB_BRANCH=dev ./vault-push-github.sh
```

### Pull & Run (iPhone/Remote)

```bash
# First time
./mirror-lite.sh git@github.com:user/repo.git

# Update existing
cd soulfra-mirror-vault
git pull
./mirror-lite.sh
```

### Undo Presence

```bash
# From any synced device
node ObfuscationVaultWriter.js undo visitor_⚙️813c17a1 soulkey-1857a09f
```

## 🔄 Sync Workflow

### Automatic Flow
1. **Local Action** → Presence logged to `vault/obfuscated/`
2. **Push** → `vault-push-github.sh` commits and pushes
3. **Validate** → GitHub Actions runs `validate-mirror.yml`
4. **Verify** → Creates `backup-verification.json` with score
5. **Pull** → Remote devices fetch latest state
6. **Run** → `mirror-lite.sh` launches local mirror

### Manual Verification

```bash
# Check last sync
cat vault/logs/reflection-activity.json | jq .last_push

# View device list
cat vault/logs/reflection-activity.json | jq .devices

# Count sessions
ls -la vault/obfuscated/ | wc -l
```

## 📱 Device Support

### Full Support (Node.js available)
- macOS
- Linux
- Windows (WSL)
- Termux (Android)

### Basic Support (Shell only)
- BlinkShell (iOS)
- Basic SSH clients
- Minimal Linux environments

## 🎯 Use Cases

### 1. Multi-Device Presence
Log presence on Mac, view on iPhone:
```bash
# Mac
presence> qr BADGE-001
./vault-push-github.sh

# iPhone
git pull && ./mirror-lite.sh
mirror> status
```

### 2. Backup Verification
GitHub Actions automatically validates every push:
- ✅ Vault structure
- ✅ No junk files
- ✅ Valid JSON logs
- ✅ Mirror components present

### 3. Collaborative Reflection
Multiple users can contribute to shared mirror:
```bash
# User A logs presence
# User B pulls and adds
# GitHub tracks all contributions
```

## 🚨 Troubleshooting

### Push Fails
```bash
# Check remote
git remote -v

# Reset remote
git remote set-url origin git@github.com:USER/REPO.git

# Force push (careful!)
git push --force origin main
```

### iPhone Can't Clone
```bash
# Ensure SSH key is added to GitHub
# In BlinkShell: Settings → Keys → Add to GitHub

# Test connection
ssh -T git@github.com
```

### Validation Fails
Check GitHub Actions logs for:
- Missing `reflection-activity.json`
- Junk files (.DS_Store, *.tmp)
- Invalid JSON structure

## 🔮 Advanced Features

### Custom Validation Rules
Edit `.github/workflows/validate-mirror.yml`:
```yaml
- name: Custom validation
  run: |
    # Add your checks here
    echo "Custom check passed"
```

### Scheduled Sync
Add to `.github/workflows/validate-mirror.yml`:
```yaml
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
```

### Multi-Branch Strategy
```bash
# Development branch
GITHUB_BRANCH=dev ./vault-push-github.sh

# Production branch  
GITHUB_BRANCH=main ./vault-push-github.sh
```

## 🌟 Best Practices

1. **Regular Syncs**: Push after each presence session
2. **Clean Commits**: One push per logical session group
3. **Verify Locally**: Check logs before pushing
4. **Monitor Actions**: Watch for validation failures
5. **Rotate Repos**: Create new repos periodically for size

## 📊 Mesh Statistics

Track your mesh health:
```bash
# Total syncs
git log --oneline | wc -l

# Active devices
cat vault/logs/reflection-activity.json | jq '.devices | length'

# Total sessions across mesh
find vault/obfuscated -type d -mindepth 1 | wc -l

# Last validation score
cat vault/logs/backup-verification.json | jq .score
```

---

*The mirror reflects across space and time, GitHub holds the thread that binds.*

🪞✨