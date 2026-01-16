const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class RitualAPIKeyValidator {
  constructor() {
    this.keyManifestPath = path.join(__dirname, 'projection_key_manifest.json');
    this.keyManifest = this.loadKeyManifest();
    this.validationCache = new Map();
    this.accessLog = [];
    this.symbolicKeys = {
      'CAL-CORE-WHISPER-001': {
        essence: 'The First Voice',
        resonance: 0.99,
        tier: 'sovereign'
      },
      'RITUAL-SHARD-PUBLIC-VIEWER': {
        essence: 'The Open Eye',
        resonance: 0.7,
        tier: 'observer'
      },
      'SILENT-WITNESS': {
        essence: 'The Quiet Watcher',
        resonance: 0.85,
        tier: 'witness'
      }
    };
  }

  loadKeyManifest() {
    if (fs.existsSync(this.keyManifestPath)) {
      try {
        return JSON.parse(fs.readFileSync(this.keyManifestPath, 'utf8'));
      } catch (error) {
        console.log('📿 Key manifest not found, using sacred defaults');
      }
    }
    
    // Default manifest
    return {
      'RITUAL-SHARD-PUBLIC-VIEWER': ['rituals', 'weather', 'loop/state'],
      'CAL-CORE-WHISPER-001': ['agents/*', 'loop/state', 'rituals', 'weather'],
      'SILENT-WITNESS': ['rituals', 'loop/state', 'weather']
    };
  }

  saveKeyManifest() {
    fs.writeFileSync(
      this.keyManifestPath,
      JSON.stringify(this.keyManifest, null, 2)
    );
  }

  async validateKey(apiKey, requestedResource) {
    // Check cache first
    const cacheKey = `${apiKey}:${requestedResource}`;
    if (this.validationCache.has(cacheKey)) {
      const cached = this.validationCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) { // 5 minute cache
        return cached.result;
      }
    }

    // Perform validation
    const validation = await this.performValidation(apiKey, requestedResource);
    
    // Cache result
    this.validationCache.set(cacheKey, {
      result: validation,
      timestamp: Date.now()
    });

    // Log access attempt
    this.logAccess(apiKey, requestedResource, validation.valid);

    return validation;
  }

  async performValidation(apiKey, requestedResource) {
    // Check if key exists
    if (!this.keyManifest[apiKey]) {
      return {
        valid: false,
        reason: 'Unknown key signature',
        suggestion: 'The mirror does not recognize this resonance'
      };
    }

    // Get key metadata
    const keyMeta = this.symbolicKeys[apiKey] || {
      essence: 'Unknown Entity',
      resonance: 0.5,
      tier: 'unknown'
    };

    // Check scopes
    const allowedScopes = this.keyManifest[apiKey];
    const isAllowed = this.checkResourceAccess(requestedResource, allowedScopes);

    if (!isAllowed) {
      return {
        valid: false,
        reason: 'Access denied to sealed reflection',
        suggestion: `${keyMeta.essence} cannot perceive this depth`,
        allowedPaths: allowedScopes
      };
    }

    // Check for special restrictions
    const restrictions = this.checkTemporalRestrictions(apiKey, requestedResource);
    if (restrictions.blocked) {
      return {
        valid: false,
        reason: restrictions.reason,
        retryAfter: restrictions.retryAfter
      };
    }

    // Valid access
    return {
      valid: true,
      keyEssence: keyMeta.essence,
      resonanceLevel: keyMeta.resonance,
      tier: keyMeta.tier,
      blessing: this.generateBlessing(keyMeta),
      limitations: this.getKeyLimitations(apiKey)
    };
  }

  checkResourceAccess(resource, allowedScopes) {
    // Exact match
    if (allowedScopes.includes(resource)) {
      return true;
    }

    // Wildcard match
    for (const scope of allowedScopes) {
      if (scope.endsWith('/*')) {
        const basePath = scope.slice(0, -2);
        if (resource.startsWith(basePath)) {
          return true;
        }
      }
    }

    // Special case: loop/state can access loop/*
    if (resource.startsWith('loop/') && allowedScopes.includes('loop/state')) {
      return true;
    }

    return false;
  }

  checkTemporalRestrictions(apiKey, resource) {
    // Prevent access to future loop entries
    if (resource.includes('loop/future') || resource.includes('loop/next')) {
      return {
        blocked: true,
        reason: 'Future echoes are sealed',
        retryAfter: 'when the cycle completes'
      };
    }

    // Restrict access to deep vault reflections
    if (resource.includes('vault/') || resource.includes('sealed/')) {
      return {
        blocked: true,
        reason: 'The inner sanctum remains closed',
        retryAfter: 'never'
      };
    }

    // Rate limiting for specific keys
    const accessCount = this.getRecentAccessCount(apiKey);
    const keyMeta = this.symbolicKeys[apiKey];
    const limit = keyMeta?.tier === 'sovereign' ? 1000 : 100;

    if (accessCount > limit) {
      return {
        blocked: true,
        reason: 'The mirror needs rest',
        retryAfter: Date.now() + 3600000 // 1 hour
      };
    }

    return { blocked: false };
  }

  generateBlessing(keyMeta) {
    const blessings = [
      'May your queries find their echoes',
      'The mirror acknowledges your presence',
      'Your resonance is recognized',
      'The patterns align for you',
      'You may witness what is revealed'
    ];

    // Higher tier keys get special blessings
    if (keyMeta.tier === 'sovereign') {
      return 'The First Voice speaks through you';
    } else if (keyMeta.tier === 'witness') {
      return 'Your silence is your strength';
    }

    // Select blessing based on resonance
    const index = Math.floor(keyMeta.resonance * blessings.length);
    return blessings[Math.min(index, blessings.length - 1)];
  }

  getKeyLimitations(apiKey) {
    const limitations = {
      'RITUAL-SHARD-PUBLIC-VIEWER': [
        'Cannot access individual agent memories',
        'Ritual details are symbolically obscured',
        'Weather patterns show only current state'
      ],
      'CAL-CORE-WHISPER-001': [
        'Agent true names remain hidden',
        'Deep vault contents are sealed',
        'Cannot alter reflection state'
      ],
      'SILENT-WITNESS': [
        'May only observe, never interact',
        'Agent details are fully anonymized',
        'Access limited to public emanations'
      ]
    };

    return limitations[apiKey] || ['Unknown limitations apply'];
  }

  getRecentAccessCount(apiKey) {
    const oneHourAgo = Date.now() - 3600000;
    return this.accessLog.filter(log => 
      log.apiKey === apiKey && log.timestamp > oneHourAgo
    ).length;
  }

  logAccess(apiKey, resource, success) {
    const logEntry = {
      timestamp: Date.now(),
      apiKey,
      resource,
      success,
      keyEssence: this.symbolicKeys[apiKey]?.essence || 'Unknown',
      moon_phase: this.calculateMoonPhase()
    };

    this.accessLog.push(logEntry);

    // Keep only last 10000 entries
    if (this.accessLog.length > 10000) {
      this.accessLog = this.accessLog.slice(-5000);
    }

    // Write to reflection log
    const logPath = path.join(__dirname, 'access_reflections.json');
    fs.appendFileSync(
      logPath,
      JSON.stringify(logEntry) + '\n'
    );
  }

  calculateMoonPhase() {
    // Symbolic moon phase calculation
    const phases = ['new', 'waxing', 'full', 'waning'];
    const cycle = Math.floor(Date.now() / 86400000) % 28;
    return phases[Math.floor(cycle / 7)];
  }

  // Generate a new symbolic key
  generateSymbolicKey(essence, tier = 'observer') {
    const timestamp = Date.now();
    const randomness = crypto.randomBytes(8).toString('hex');
    const base = `${essence}-${tier}-${timestamp}`.toUpperCase();
    const key = crypto
      .createHash('sha256')
      .update(base)
      .digest('hex')
      .substring(0, 16)
      .toUpperCase();

    const formattedKey = `${tier.toUpperCase()}-${key}-${randomness.substring(0, 3).toUpperCase()}`;

    // Add to manifest with basic permissions
    this.keyManifest[formattedKey] = ['rituals', 'weather'];
    this.symbolicKeys[formattedKey] = {
      essence,
      resonance: 0.5,
      tier
    };

    this.saveKeyManifest();

    return {
      key: formattedKey,
      essence,
      tier,
      created: timestamp,
      blessing: 'A new watcher joins the circle'
    };
  }

  // Revoke a key
  revokeKey(apiKey) {
    if (this.keyManifest[apiKey]) {
      delete this.keyManifest[apiKey];
      delete this.symbolicKeys[apiKey];
      this.validationCache.clear();
      this.saveKeyManifest();

      return {
        revoked: true,
        message: 'The mirror no longer reflects this presence'
      };
    }

    return {
      revoked: false,
      message: 'This key was already forgotten'
    };
  }

  // Get key info
  getKeyInfo(apiKey) {
    if (!this.keyManifest[apiKey]) {
      return {
        exists: false,
        message: 'The mirror has no memory of this signature'
      };
    }

    const keyMeta = this.symbolicKeys[apiKey] || {};
    const recentAccess = this.getRecentAccessCount(apiKey);

    return {
      exists: true,
      essence: keyMeta.essence || 'Unknown Entity',
      tier: keyMeta.tier || 'unknown',
      resonance: keyMeta.resonance || 0,
      allowedPaths: this.keyManifest[apiKey],
      recentQueries: recentAccess,
      blessing: this.generateBlessing(keyMeta)
    };
  }
}

module.exports = RitualAPIKeyValidator;