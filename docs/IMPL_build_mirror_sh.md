# Module: build-mirror.sh
**Purpose**: One-command setup script that initializes Mirror Kernel on user's device  
**Dependencies**: Node.js 16+, 500MB free storage, modern browser  
**Success Criteria**: <5 minutes setup, auto-recovery on failure, vault created and encrypted  

---

## Implementation Requirements

### Core Script Structure
```bash
#!/bin/bash
# Mirror Kernel Initialization Script
# Usage: ./build-mirror.sh [--mode=soft|platform] [--debug]

set -e  # Exit on any error

# TODO: Add these functions in order
main() {
    check_system_requirements
    create_vault_structure
    install_dependencies
    configure_initial_mode
    setup_encryption
    validate_installation
    launch_first_time_setup
}

# Call main function
main "$@"
```

### Required Functions

#### 1. System Requirements Check
```bash
check_system_requirements() {
    # TODO: Implement these checks
    # - Node.js version >= 16.0.0
    # - Available storage >= 500MB
    # - Browser support (Chrome/Safari/Firefox)
    # - CPU architecture (x64/arm64)
    # - RAM >= 4GB recommended
    
    echo "🔍 Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js not found. Please install Node.js 16+ first"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    # TODO: Add version comparison logic
    
    # Check available storage
    AVAILABLE_SPACE=$(df -h . | awk 'NR==2 {print $4}' | sed 's/[A-Za-z]//g')
    # TODO: Convert to MB and validate >= 500MB
    
    # Check CPU/RAM
    # TODO: Add OS-specific checks for Linux/macOS/Windows
    
    echo "✅ System requirements met"
}
```

#### 2. Vault Directory Structure
```bash
create_vault_structure() {
    echo "📁 Creating vault directory structure..."
    
    # TODO: Create these directories
    VAULT_ROOT="./vault"
    
    # Core directories
    mkdir -p "$VAULT_ROOT"/{config,logs,exports,pairing,routing}
    mkdir -p "$VAULT_ROOT"/agents/{active,archived,templates}
    mkdir -p "$VAULT_ROOT"/memory/{reflections,conversations,insights}
    mkdir -p "$VAULT_ROOT"/security/{keys,sessions,audit}
    
    # Platform-specific directories
    mkdir -p "./platforms"/{ui,api,workers}
    mkdir -p "./runtime"/{local,cloud,hybrid}
    
    # TODO: Set proper permissions (700 for sensitive dirs)
    chmod 700 "$VAULT_ROOT"/security
    chmod 755 "$VAULT_ROOT"/{config,logs}
    
    echo "✅ Vault structure created"
}
```

#### 3. Dependency Installation
```bash
install_dependencies() {
    echo "📦 Installing dependencies..."
    
    # TODO: Check if package.json exists, create if missing
    if [ ! -f "package.json" ]; then
        npm init -y
        # TODO: Update package.json with Mirror Kernel metadata
    fi
    
    # Required dependencies
    REQUIRED_DEPS=(
        "express@4.18.2"
        "ws@8.13.0" 
        "cors@2.8.5"
        "crypto-js@4.1.1"
    )
    
    # TODO: Install each dependency with error handling
    for dep in "${REQUIRED_DEPS[@]}"; do
        echo "Installing $dep..."
        npm install "$dep" || {
            echo "❌ Failed to install $dep"
            exit 1
        }
    done
    
    echo "✅ Dependencies installed"
}
```

#### 4. Initial Mode Configuration
```bash
configure_initial_mode() {
    echo "⚙️  Configuring initial mode..."
    
    MODE=${1:-soft}  # Default to soft mode
    
    # TODO: Create mode.json with proper defaults
    cat > vault/config/mode.json << EOF
{
  "current": "$MODE",
  "allowSwitch": true,
  "enterpriseFeaturesHidden": true,
  "modes": {
    "soft": {
      "features": {
        "folders": ["Reflections", "Saved", "What You Shared"],
        "exportPrice": 1.00,
        "voiceByDefault": true,
        "autoInstall": true
      },
      "limits": {
        "storageQuotaMB": 100,
        "hourlyAPICalls": 10,
        "maxAgents": 3
      }
    },
    "platform": {
      "features": {
        "folders": ["Logs", "Forks", "Registry", "Analytics"],
        "exportPrice": "variable",
        "voiceByDefault": false,
        "autoInstall": false
      },
      "limits": {
        "storageQuotaMB": 10000,
        "hourlyAPICalls": 1000,
        "maxAgents": 50
      }
    }
  },
  "lastUpdated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
    
    echo "✅ Mode configured: $MODE"
}
```

#### 5. Encryption Setup
```bash
setup_encryption() {
    echo "🔐 Setting up encryption..."
    
    # TODO: Generate encryption keys for vault
    ENCRYPTION_KEY=$(openssl rand -hex 32)
    DEVICE_UUID=$(uuidgen 2>/dev/null || echo "dev_$(date +%s)_$(openssl rand -hex 8)")
    
    # TODO: Store keys securely
    cat > vault/security/device.json << EOF
{
  "deviceUUID": "$DEVICE_UUID",
  "created": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "encryptionEnabled": true,
  "keyRotationInterval": "30d"
}
EOF
    
    # TODO: Store encryption key in OS keychain/secure storage
    echo "$ENCRYPTION_KEY" > vault/security/.vault_key
    chmod 600 vault/security/.vault_key
    
    echo "✅ Encryption configured"
}
```

#### 6. Installation Validation
```bash
validate_installation() {
    echo "🔍 Validating installation..."
    
    # TODO: Check all required files exist
    REQUIRED_FILES=(
        "vault/config/mode.json"
        "vault/security/device.json"
        "package.json"
        "node_modules/express"
    )
    
    for file in "${REQUIRED_FILES[@]}"; do
        if [ ! -e "$file" ]; then
            echo "❌ Missing required file: $file"
            exit 1
        fi
    done
    
    # TODO: Test basic functionality
    # - Can create a test reflection
    # - Can spawn a test agent
    # - Can access UI endpoints
    
    echo "✅ Installation validated"
}
```

#### 7. First-Time Setup
```bash
launch_first_time_setup() {
    echo "🚀 Launching first-time setup..."
    
    # TODO: Start local server for setup wizard
    node -e "
        const express = require('express');
        const app = express();
        const port = 3333;
        
        app.get('/setup', (req, res) => {
            res.send('<h1>Mirror Kernel Setup Complete!</h1><p>Your reflection space is ready.</p>');
        });
        
        app.listen(port, () => {
            console.log('Setup wizard: http://localhost:3333/setup');
        });
    " &
    
    SERVER_PID=$!
    
    # TODO: Open browser to setup page
    if command -v open &> /dev/null; then
        open "http://localhost:3333/setup"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:3333/setup"
    fi
    
    echo "✅ Setup complete! Visit http://localhost:3333/setup"
    echo "📝 Your vault is located at: $(pwd)/vault"
    echo "🔑 Device UUID: $(cat vault/security/device.json | grep deviceUUID | cut -d'"' -f4)"
    
    # TODO: Wait for user confirmation, then cleanup
    read -p "Press Enter to continue..."
    kill $SERVER_PID 2>/dev/null || true
}
```

---

## Configuration Parameters

### Command Line Options
```bash
# Default: soft mode, production settings
./build-mirror.sh

# Platform mode for power users
./build-mirror.sh --mode=platform

# Debug mode with verbose logging
./build-mirror.sh --debug

# Custom vault location
./build-mirror.sh --vault=/custom/path

# Skip dependency installation (for CI/testing)
./build-mirror.sh --no-deps
```

### Environment Variables
```bash
# Override default settings
export MIRROR_MODE=platform           # soft|platform
export MIRROR_VAULT_PATH=/custom/path  # Custom vault location
export MIRROR_DEBUG=true              # Enable debug logging
export MIRROR_AUTO_OPEN=false         # Don't auto-open browser
```

---

## Error Handling Requirements

### Auto-Recovery Logic
```bash
# TODO: Implement these recovery scenarios

handle_permission_error() {
    echo "❌ Permission denied. Trying with sudo..."
    # Retry with elevated permissions
}

handle_network_error() {
    echo "❌ Network error. Switching to offline mode..."
    # Use cached dependencies, skip optional downloads
}

handle_storage_error() {
    echo "❌ Insufficient storage. Cleaning up..."
    # Remove temp files, offer storage optimization
}

handle_dependency_error() {
    echo "❌ Dependency error. Using fallback versions..."
    # Try alternative package versions
}
```

### Rollback Mechanism
```bash
rollback_installation() {
    echo "🔄 Rolling back installation..."
    
    # TODO: Remove created directories
    rm -rf vault/ platforms/ runtime/
    
    # TODO: Restore original package.json if it existed
    if [ -f "package.json.backup" ]; then
        mv package.json.backup package.json
    fi
    
    echo "✅ Rollback complete"
}
```

---

## Testing Validation

### Automated Tests
```bash
# TODO: Add these test functions

test_vault_creation() {
    # Verify all directories exist with correct permissions
    [ -d "vault/config" ] && [ -w "vault/config" ]
}

test_encryption_setup() {
    # Verify encryption key exists and is secure
    [ -f "vault/security/.vault_key" ] && [ "$(stat -c %a vault/security/.vault_key)" = "600" ]
}

test_mode_configuration() {
    # Verify mode.json is valid JSON with required fields
    node -e "const config = require('./vault/config/mode.json'); console.log('Valid:', config.current)"
}

test_dependency_installation() {
    # Verify all required packages are available
    node -e "require('express'); require('ws'); require('cors'); console.log('Dependencies OK')"
}

run_all_tests() {
    echo "🧪 Running validation tests..."
    test_vault_creation && echo "✅ Vault creation"
    test_encryption_setup && echo "✅ Encryption setup"
    test_mode_configuration && echo "✅ Mode configuration"
    test_dependency_installation && echo "✅ Dependencies"
    echo "✅ All tests passed"
}
```

---

## Integration Points

### Files Created
- `vault/config/mode.json` → Used by UI modules for feature flags
- `vault/security/device.json` → Used by pairing system for device identification
- `package.json` → Used by all Node.js modules for dependencies

### Environment Setup
- Sets `MIRROR_VAULT_PATH` environment variable
- Creates symlinks for easy access to common directories
- Configures local development server on port 3333

### Next Steps After Setup
1. Run `node platforms/local-runner.js` to start development server
2. Visit generated UI at `http://localhost:3333`
3. Complete first reflection to test agent spawning
4. Verify export functionality with test Stripe integration

---

## Security Considerations

### File Permissions
```bash
# Vault root: readable/writable by owner only
chmod 700 vault/

# Config files: readable by owner and group
chmod 640 vault/config/*.json

# Security files: readable by owner only
chmod 600 vault/security/*

# Logs: readable by owner and group for debugging
chmod 644 vault/logs/*.json
```

### Sensitive Data Handling
- Encryption keys stored in OS keychain when available
- No credentials in plain text files
- Automatic cleanup of temporary files
- User consent required before any network operations

### Audit Trail
```bash
# TODO: Log all setup actions
log_action() {
    echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") $1" >> vault/logs/setup.log
}
```

**Implementation Priority**: Complete functions in order listed. Test each function independently before moving to next. Focus on error handling and user experience over performance optimization.