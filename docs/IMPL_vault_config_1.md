# Module: vault/config/mode.json
**Purpose**: Central configuration for soft vs platform mode switching and feature flags  
**Dependencies**: Node.js JSON validation, vault directory structure  
**Success Criteria**: Mode switching works instantly, all features properly gated, user preferences persist  

---

## Implementation Requirements

### Core JSON Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["current", "modes", "switchingRules"],
  "properties": {
    "current": {
      "type": "string",
      "enum": ["soft", "platform"],
      "description": "Currently active mode"
    },
    "allowSwitch": {
      "type": "boolean",
      "default": true,
      "description": "Whether user can switch between modes"
    },
    "modes": {
      "type": "object",
      "properties": {
        "soft": { "$ref": "#/definitions/modeConfig" },
        "platform": { "$ref": "#/definitions/modeConfig" }
      }
    }
  }
}
```

### Complete Configuration Template
```json
{
  "current": "soft",
  "allowSwitch": true,
  "enterpriseFeaturesHidden": true,
  "lastModeSwitch": null,
  "userConsent": {
    "dataProcessing": false,
    "voiceRecording": false,
    "exportSharing": false,
    "analyticsTracking": false
  },
  "modes": {
    "soft": {
      "name": "Soft Mode",
      "description": "Simple reflection for everyone",
      "ui": {
        "theme": "light",
        "complexity": "minimal",
        "primaryColor": "#667eea",
        "fontSize": "large",
        "showAdvancedOptions": false
      },
      "features": {
        "folders": ["Reflections", "Saved", "What You Shared"],
        "oneStepActions": true,
        "autoInstall": true,
        "autoLogin": false,
        "qrAutoPair": true,
        "voiceByDefault": true,
        "exportPrice": 1.00,
        "calIntroduction": "gentle",
        "agentSpawning": "automatic",
        "memoryRetention": "session"
      },
      "limits": {
        "storageQuotaMB": 100,
        "hourlyAPICalls": 10,
        "dailyExports": 5,
        "maxConcurrentAgents": 3,
        "voiceRecordingMinutes": 60,
        "reflectionHistoryDays": 30
      },
      "privacy": {
        "localProcessingOnly": true,
        "dataRetention": "minimal",
        "shareByDefault": false,
        "encryptionLevel": "standard"
      }
    },
    "platform": {
      "name": "Platform Mode",
      "description": "Full platform control for organizations",
      "ui": {
        "theme": "dark",
        "complexity": "full",
        "primaryColor": "#1f6feb",
        "fontSize": "normal",
        "showAdvancedOptions": true
      },
      "features": {
        "folders": ["Logs", "Forks", "Registry", "Analytics", "Mirror Index"],
        "oneStepActions": false,
        "autoInstall": false,
        "autoLogin": true,
        "qrAutoPair": true,
        "voiceByDefault": false,
        "exportPrice": "variable",
        "calIntroduction": "professional",
        "agentSpawning": "manual",
        "memoryRetention": "persistent"
      },
      "limits": {
        "storageQuotaGB": 10,
        "hourlyAPICalls": 1000,
        "dailyExports": 100,
        "maxConcurrentAgents": 50,
        "voiceRecordingMinutes": 600,
        "reflectionHistoryDays": 365
      },
      "billing": {
        "model": "per_api_call",
        "costPerCall": 0.01,
        "allowBYOK": true,
        "stripeRequired": true,
        "freeTrialCalls": 100
      },
      "enterprise": {
        "bulkExport": true,
        "apiAccess": true,
        "customBranding": true,
        "auditLogs": true,
        "ssoIntegration": false
      },
      "privacy": {
        "localProcessingOnly": false,
        "dataRetention": "extended",
        "shareByDefault": false,
        "encryptionLevel": "enterprise"
      }
    }
  },
  "switchingRules": {
    "softToPlatform": {
      "triggerAfterCalls": 100,
      "triggerAfterExports": 5,
      "triggerAfterDays": 7,
      "manualSwitch": true,
      "requireConfirmation": true,
      "showBenefits": true
    },
    "platformToSoft": {
      "allowDowngrade": false,
      "adminOnly": true,
      "requireReason": true
    }
  },
  "featureFlags": {
    "voiceInput": true,
    "qrPairing": true,
    "stripePayments": true,
    "geofencing": true,
    "realtimeSync": true,
    "analyticsTracking": true,
    "bulkExport": true,
    "apiKeyRotation": true,
    "betaFeatures": false
  },
  "metadata": {
    "configVersion": "1.0.0",
    "created": "2024-01-15T10:30:00Z",
    "lastUpdated": "2024-01-15T10:30:00Z",
    "deviceId": null,
    "installationId": null
  }
}
```

---

## Configuration Manager Implementation

### JavaScript Configuration Handler
```javascript
// TODO: Create vault/config/config-manager.js

class ConfigManager {
    constructor(vaultPath = './vault') {
        this.configPath = `${vaultPath}/config/mode.json`;
        this.config = null;
        this.watchers = [];
    }

    async loadConfig() {
        // TODO: Load and validate configuration
        try {
            const fs = require('fs').promises;
            const configData = await fs.readFile(this.configPath, 'utf8');
            this.config = JSON.parse(configData);
            
            // Validate against schema
            this.validateConfig();
            
            return this.config;
        } catch (error) {
            // TODO: Create default config if file doesn't exist
            console.log('Creating default configuration...');
            await this.createDefaultConfig();
            return this.config;
        }
    }

    validateConfig() {
        // TODO: Implement JSON schema validation
        const required = ['current', 'modes', 'switchingRules'];
        for (const field of required) {
            if (!this.config[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Validate current mode exists
        if (!this.config.modes[this.config.current]) {
            throw new Error(`Invalid current mode: ${this.config.current}`);
        }

        console.log('✅ Configuration validated');
    }

    async createDefaultConfig() {
        // TODO: Create default configuration file
        const defaultConfig = {
            current: "soft",
            allowSwitch: true,
            enterpriseFeaturesHidden: true,
            // ... (use template above)
        };

        this.config = defaultConfig;
        await this.saveConfig();
    }

    async saveConfig() {
        // TODO: Save configuration with atomic write
        const fs = require('fs').promises;
        this.config.metadata.lastUpdated = new Date().toISOString();
        
        const tempPath = `${this.configPath}.tmp`;
        await fs.writeFile(tempPath, JSON.stringify(this.config, null, 2));
        await fs.rename(tempPath, this.configPath);
        
        // Notify watchers
        this.notifyWatchers();
    }

    getCurrentMode() {
        // TODO: Return current mode configuration
        return {
            name: this.config.current,
            config: this.config.modes[this.config.current]
        };
    }

    async switchMode(newMode, reason = null) {
        // TODO: Implement mode switching with validation
        if (!this.config.modes[newMode]) {
            throw new Error(`Invalid mode: ${newMode}`);
        }

        if (!this.canSwitchMode(this.config.current, newMode)) {
            throw new Error(`Mode switch not allowed: ${this.config.current} -> ${newMode}`);
        }

        const oldMode = this.config.current;
        this.config.current = newMode;
        this.config.lastModeSwitch = {
            from: oldMode,
            to: newMode,
            timestamp: new Date().toISOString(),
            reason: reason
        };

        await this.saveConfig();
        
        console.log(`✅ Mode switched: ${oldMode} -> ${newMode}`);
        return this.getCurrentMode();
    }

    canSwitchMode(fromMode, toMode) {
        // TODO: Check switching rules
        if (!this.config.allowSwitch) return false;

        if (fromMode === 'platform' && toMode === 'soft') {
            const rules = this.config.switchingRules.platformToSoft;
            return rules.allowDowngrade;
        }

        return true; // Soft to platform is usually allowed
    }

    getFeatureFlags() {
        // TODO: Return merged feature flags for current mode
        const currentMode = this.getCurrentMode();
        return {
            ...this.config.featureFlags,
            ...currentMode.config.features
        };
    }

    isFeatureEnabled(featureName) {
        // TODO: Check if specific feature is enabled
        const flags = this.getFeatureFlags();
        return Boolean(flags[featureName]);
    }

    getUserLimits() {
        // TODO: Return limits for current mode
        const currentMode = this.getCurrentMode();
        return currentMode.config.limits;
    }

    onConfigChange(callback) {
        // TODO: Register watcher for config changes
        this.watchers.push(callback);
    }

    notifyWatchers() {
        // TODO: Notify all registered watchers
        for (const callback of this.watchers) {
            try {
                callback(this.config);
            } catch (error) {
                console.error('Config watcher error:', error);
            }
        }
    }
}

module.exports = ConfigManager;
```

---

## Usage Patterns

### Frontend Integration
```javascript
// TODO: Frontend code for reading configuration

// Load current mode settings
const configManager = new ConfigManager();
await configManager.loadConfig();

const currentMode = configManager.getCurrentMode();
const isVoiceEnabled = configManager.isFeatureEnabled('voiceInput');
const userLimits = configManager.getUserLimits();

// Apply UI configuration
document.body.className = `theme-${currentMode.config.ui.theme}`;
document.body.style.fontSize = currentMode.config.ui.fontSize === 'large' ? '18px' : '14px';

// Show/hide features based on mode
if (currentMode.name === 'soft') {
    document.querySelector('.advanced-options').style.display = 'none';
}

// Handle mode switching
async function switchToPlatformMode() {
    if (confirm('Switch to Platform Mode for advanced features?')) {
        await configManager.switchMode('platform', 'user_request');
        location.reload(); // Refresh to apply new UI
    }
}
```

### Backend API Integration
```javascript
// TODO: Express.js middleware for config-aware routing

const configMiddleware = (req, res, next) => {
    req.mirrorConfig = configManager.getCurrentMode();
    req.userLimits = configManager.getUserLimits();
    req.isFeatureEnabled = configManager.isFeatureEnabled.bind(configManager);
    next();
};

// Example usage in routes
app.get('/api/features', configMiddleware, (req, res) => {
    const features = {
        voiceInput: req.isFeatureEnabled('voiceInput'),
        bulkExport: req.isFeatureEnabled('bulkExport'),
        maxAgents: req.userLimits.maxConcurrentAgents
    };
    res.json(features);
});
```

---

## Validation Rules

### Configuration Validation
```javascript
// TODO: Implement these validation functions

function validateModeConfig(modeConfig) {
    const required = ['name', 'description', 'features', 'limits'];
    for (const field of required) {
        if (!modeConfig[field]) {
            throw new Error(`Mode missing required field: ${field}`);
        }
    }
}

function validateLimits(limits) {
    const numericFields = ['storageQuotaMB', 'hourlyAPICalls', 'maxConcurrentAgents'];
    for (const field of numericFields) {
        if (typeof limits[field] !== 'number' || limits[field] < 0) {
            throw new Error(`Invalid limit value: ${field}`);
        }
    }
}

function validateFeatures(features) {
    if (!Array.isArray(features.folders) || features.folders.length === 0) {
        throw new Error('Features must include at least one folder');
    }
    
    if (typeof features.exportPrice !== 'number' && features.exportPrice !== 'variable') {
        throw new Error('Export price must be number or "variable"');
    }
}
```

### Runtime Validation
```javascript
// TODO: Add runtime checks for mode consistency

function validateModeTransition(fromMode, toMode, userStats) {
    // Check if user meets platform mode requirements
    if (toMode === 'platform') {
        const rules = config.switchingRules.softToPlatform;
        
        if (userStats.totalAPICalls < rules.triggerAfterCalls) {
            return { allowed: false, reason: 'Insufficient API usage' };
        }
        
        if (userStats.totalExports < rules.triggerAfterExports) {
            return { allowed: false, reason: 'Insufficient export activity' };
        }
    }
    
    return { allowed: true };
}
```

---

## Security Considerations

### File Protection
```bash
# TODO: Set appropriate file permissions
chmod 640 vault/config/mode.json  # Owner read/write, group read
chown $USER:mirror vault/config/mode.json  # Proper ownership
```

### Sensitive Data Handling
```javascript
// TODO: Implement secure configuration handling

class SecureConfig extends ConfigManager {
    async loadConfig() {
        // Decrypt configuration if encrypted
        const encrypted = await this.isConfigEncrypted();
        if (encrypted) {
            await this.decryptConfig();
        }
        
        return super.loadConfig();
    }

    async saveConfig() {
        // Remove sensitive fields before saving
        const sanitized = this.sanitizeConfig(this.config);
        this.config = sanitized;
        
        return super.saveConfig();
    }

    sanitizeConfig(config) {
        // TODO: Remove or encrypt sensitive data
        const sanitized = { ...config };
        
        // Remove any API keys or tokens
        if (sanitized.apiKeys) {
            delete sanitized.apiKeys;
        }
        
        return sanitized;
    }
}
```

---

## Testing Validation

### Unit Tests
```javascript
// TODO: Create comprehensive test suite

describe('ConfigManager', () => {
    let configManager;
    
    beforeEach(() => {
        configManager = new ConfigManager('./test-vault');
    });

    test('loads default configuration', async () => {
        await configManager.loadConfig();
        expect(configManager.config.current).toBe('soft');
    });

    test('switches modes correctly', async () => {
        await configManager.loadConfig();
        await configManager.switchMode('platform');
        expect(configManager.config.current).toBe('platform');
    });

    test('validates feature flags', () => {
        const isEnabled = configManager.isFeatureEnabled('voiceInput');
        expect(typeof isEnabled).toBe('boolean');
    });

    test('enforces user limits', () => {
        const limits = configManager.getUserLimits();
        expect(limits.hourlyAPICalls).toBeGreaterThan(0);
    });
});
```

### Integration Tests
```javascript
// TODO: Test configuration integration with other modules

test('UI respects mode configuration', async () => {
    // Switch to platform mode
    await configManager.switchMode('platform');
    
    // Verify UI shows advanced features
    const features = configManager.getFeatureFlags();
    expect(features.showAdvancedOptions).toBe(true);
});

test('API limits are enforced', async () => {
    // Set low limits for testing
    const limits = configManager.getUserLimits();
    
    // Simulate API calls exceeding limit
    // Verify rate limiting kicks in
});
```

---

## Integration Points

### Files Used
- `vault/config/mode.json` → Main configuration file
- `vault/logs/config-changes.log` → Audit trail for config modifications
- `vault/security/config.key` → Encryption key for sensitive settings

### Environment Integration
- Reads `MIRROR_MODE` environment variable for initial mode
- Writes mode changes to audit logs
- Notifies other modules via event system

### Module Dependencies
- **UI Modules**: Read theme, feature flags, folder structure
- **API Router**: Check billing model, rate limits, BYOK settings
- **Agent Spawner**: Verify spawning rules, concurrency limits
- **Voice Processor**: Check voice feature flags, recording limits

**Implementation Priority**: Start with basic JSON structure, add validation, implement mode switching, then add advanced features like encryption and audit logging.