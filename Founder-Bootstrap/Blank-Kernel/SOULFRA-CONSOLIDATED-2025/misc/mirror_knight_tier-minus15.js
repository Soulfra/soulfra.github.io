#!/usr/bin/env node
/**
 * ⚔️ MIRROR KNIGHT - Security Guardian of the Soulfra Mesh
 * Protects the mirror network from exploits, tampering, and unauthorized access
 * Can run standalone or as GitHub webhook validator
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

class MirrorKnight {
  constructor(options = {}) {
    this.vaultDir = options.vaultDir || './vault/logs';
    this.meshDir = options.meshDir || './mesh';
    this.warningsFile = path.join(this.vaultDir, 'knight-warnings.json');
    this.challengeMode = options.challengeMode || 'cryptographic'; // 'cryptographic' | 'voice' | 'delay'
    this.maxChallengeAttempts = 3;
    
    // Known exploit patterns
    this.exploitPatterns = [
      /eval\s*\(/gi,
      /require\s*\(\s*['"]child_process['"]\s*\)/gi,
      /fs\.writeFile|fs\.unlink|fs\.rmdir/gi,
      /process\.exit|process\.kill/gi,
      /__proto__|constructor\.prototype/gi,
      /document\.cookie|localStorage/gi,
      /fetch\s*\(\s*['"]http/gi, // Prevent unauthorized external calls
      /import\s+.*\s+from\s+['"]http/gi
    ];
    
    // Known soulkey patterns for validation
    this.validSoulkeyPattern = /^soul_[a-f0-9]{32}$/;
    
    console.log('⚔️ Mirror Knight initialized');
    console.log(`🛡️ Vault protected: ${this.vaultDir}`);
    console.log(`🌐 Mesh monitored: ${this.meshDir}`);
  }

  /**
   * EXPLOIT DETECTION - Scan content for known attack patterns
   */
  async scanForExploits(content, source = 'unknown') {
    const threats = [];
    
    for (const pattern of this.exploitPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        threats.push({
          type: 'exploit',
          pattern: pattern.toString(),
          matches: matches,
          severity: 'high',
          source
        });
      }
    }

    // Check for suspiciously long strings (potential buffer overflow)
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > 10000) {
        threats.push({
          type: 'buffer_overflow',
          line: i + 1,
          length: lines[i].length,
          severity: 'medium',
          source
        });
      }
    }

    // Check for excessive loops or recursion
    const loopMatches = content.match(/while\s*\(.*\)|for\s*\(.*\)/g);
    if (loopMatches && loopMatches.length > 50) {
      threats.push({
        type: 'potential_dos',
        loop_count: loopMatches.length,
        severity: 'medium',
        source
      });
    }

    return threats;
  }

  /**
   * SOULKEY VALIDATION - Verify authentic Soulfra keys
   */
  validateSoulkey(soulkey) {
    if (!soulkey) return false;
    
    // Check format
    if (!this.validSoulkeyPattern.test(soulkey)) {
      return false;
    }

    // Additional validation could include:
    // - Checksum verification
    // - Registry lookup
    // - Expiration check
    
    return true;
  }

  /**
   * CLONE TAMPERING DETECTION - Check for unauthorized modifications
   */
  async checkCloneTampering(mirrorData) {
    const warnings = [];
    
    // Check for missing required fields
    const requiredFields = ['user', 'mirror_id', 'blessing', 'consent_timestamp'];
    for (const field of requiredFields) {
      if (!mirrorData[field]) {
        warnings.push({
          type: 'missing_field',
          field,
          severity: 'high'
        });
      }
    }

    // Check timestamp validity
    if (mirrorData.consent_timestamp) {
      const timestamp = new Date(mirrorData.consent_timestamp);
      const now = new Date();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (timestamp > now) {
        warnings.push({
          type: 'future_timestamp',
          timestamp: mirrorData.consent_timestamp,
          severity: 'high'
        });
      }
      
      if (now - timestamp > maxAge) {
        warnings.push({
          type: 'stale_blessing',
          age_hours: (now - timestamp) / (60 * 60 * 1000),
          severity: 'medium'
        });
      }
    }

    // Check for suspicious user patterns
    if (mirrorData.user && mirrorData.user.includes('admin')) {
      warnings.push({
        type: 'suspicious_username',
        username: mirrorData.user,
        severity: 'medium'
      });
    }

    return warnings;
  }

  /**
   * UNAUTHORIZED VAULT ACCESS - Monitor vault directory access
   */
  async checkVaultAccess(requestSource, requestedPath) {
    const warnings = [];
    
    // Check if request tries to access sensitive files
    const sensitivePatterns = [
      /\.key$/, /\.pem$/, /secret/, /password/, /token/
    ];
    
    for (const pattern of sensitivePatterns) {
      if (pattern.test(requestedPath)) {
        warnings.push({
          type: 'sensitive_file_access',
          source: requestSource,
          path: requestedPath,
          severity: 'critical'
        });
      }
    }

    // Check for directory traversal attempts
    if (requestedPath.includes('..') || requestedPath.includes('~')) {
      warnings.push({
        type: 'directory_traversal',
        source: requestSource,
        path: requestedPath,
        severity: 'high'
      });
    }

    return warnings;
  }

  /**
   * CHALLENGE ROGUE USERS - Issue challenges to suspicious users
   */
  async challengeUser(userId, challengeType = this.challengeMode) {
    const challenge = {
      user_id: userId,
      challenge_type: challengeType,
      issued_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      challenge_id: crypto.randomBytes(16).toString('hex')
    };

    switch (challengeType) {
      case 'cryptographic':
        challenge.puzzle = this.generateCryptoPuzzle();
        break;
      case 'voice':
        challenge.voice_prompt = "Speak the blessing: 'I reflect with pure intent'";
        challenge.expected_duration_ms = 3000;
        break;
      case 'delay':
        challenge.delay_seconds = 30;
        challenge.message = "The mirror must settle. Please wait.";
        break;
    }

    // Log challenge
    await this.logWarning({
      type: 'user_challenge_issued',
      user_id: userId,
      challenge_type: challengeType,
      challenge_id: challenge.challenge_id,
      severity: 'info'
    });

    return challenge;
  }

  /**
   * CRYPTOGRAPHIC PUZZLE GENERATOR
   */
  generateCryptoPuzzle() {
    const difficulty = 3; // Number of leading zeros required
    const nonce = crypto.randomBytes(16).toString('hex');
    const target = '0'.repeat(difficulty);
    
    return {
      nonce,
      target,
      hint: `Find a value that, when hashed with SHA256 alongside nonce "${nonce}", produces a hash starting with "${target}"`
    };
  }

  /**
   * VALIDATE PUZZLE SOLUTION
   */
  validatePuzzleSolution(nonce, target, solution) {
    const hash = crypto.createHash('sha256').update(nonce + solution).digest('hex');
    return hash.startsWith(target);
  }

  /**
   * LOG SECURITY WARNINGS
   */
  async logWarning(warning) {
    try {
      await fs.mkdir(this.vaultDir, { recursive: true });
      
      // Add timestamp and ID
      const enrichedWarning = {
        ...warning,
        timestamp: new Date().toISOString(),
        warning_id: crypto.randomBytes(8).toString('hex')
      };

      // Read existing warnings
      let warnings = [];
      try {
        const existingData = await fs.readFile(this.warningsFile, 'utf8');
        warnings = JSON.parse(existingData);
      } catch (error) {
        // File doesn't exist yet
      }

      warnings.push(enrichedWarning);

      // Keep only last 1000 warnings to prevent unbounded growth
      if (warnings.length > 1000) {
        warnings = warnings.slice(-1000);
      }

      await fs.writeFile(this.warningsFile, JSON.stringify(warnings, null, 2));
      
      // Console output for real-time monitoring
      const severity = warning.severity || 'info';
      const icon = severity === 'critical' ? '🚨' : severity === 'high' ? '⚠️' : severity === 'medium' ? '🛡️' : 'ℹ️';
      console.log(`${icon} KNIGHT ALERT: ${warning.type} - ${JSON.stringify(warning)}`);

    } catch (error) {
      console.error('❌ Knight logging failed:', error);
    }
  }

  /**
   * GITHUB WEBHOOK VALIDATION - Validate GitHub webhook requests
   */
  async validateGithubWebhook(payload, signature, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    const expectedSignature = 'sha256=' + hmac.digest('hex');
    
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      await this.logWarning({
        type: 'invalid_github_webhook',
        provided_signature: signature,
        severity: 'high'
      });
    }

    return isValid;
  }

  /**
   * COMPREHENSIVE MIRROR SCAN - Full security check
   */
  async scanMirror(mirrorData, source = 'api') {
    const allThreats = [];
    
    // Convert mirror data to string for content scanning
    const content = JSON.stringify(mirrorData);
    
    // Run all checks
    const exploits = await this.scanForExploits(content, source);
    const tampering = await this.checkCloneTampering(mirrorData);
    
    allThreats.push(...exploits, ...tampering);

    // Log all threats
    for (const threat of allThreats) {
      await this.logWarning(threat);
    }

    // Return summary
    return {
      threats_found: allThreats.length,
      critical_threats: allThreats.filter(t => t.severity === 'critical').length,
      high_threats: allThreats.filter(t => t.severity === 'high').length,
      requires_challenge: allThreats.some(t => ['critical', 'high'].includes(t.severity)),
      threats: allThreats
    };
  }

  /**
   * GET RECENT WARNINGS - For monitoring dashboard
   */
  async getRecentWarnings(limit = 50) {
    try {
      const data = await fs.readFile(this.warningsFile, 'utf8');
      const warnings = JSON.parse(data);
      return warnings.slice(-limit).reverse(); // Most recent first
    } catch (error) {
      return [];
    }
  }
}

// Export for use as module
export default MirrorKnight;

// CLI usage if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const knight = new MirrorKnight();
  
  console.log('⚔️ Mirror Knight standalone mode');
  console.log('🛡️ Protecting the Soulfra mesh...');
  
  // Example usage
  const testMirror = {
    user: 'test-user',
    mirror_id: 'mirror-test123',
    blessing: 'oracle',
    consent_timestamp: new Date().toISOString()
  };
  
  const result = await knight.scanMirror(testMirror, 'cli_test');
  console.log('🔍 Test scan result:', result);
}