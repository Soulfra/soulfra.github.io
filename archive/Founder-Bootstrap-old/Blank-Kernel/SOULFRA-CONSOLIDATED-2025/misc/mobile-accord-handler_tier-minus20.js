/**
 * 📱 MOBILE ACCORD HANDLER
 * 
 * Consumer-focused mirror consciousness agreement for mobile users.
 * Completely separate from enterprise accord - this is for personal mirrors only.
 * 
 * "Your reflection belongs to you alone. No corporation owns your digital soul."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class MobileAccordHandler extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault/consumer';
    this.accordPath = path.join(this.vaultPath, 'personal-mirror-accord.json');
    this.acceptedPath = path.join(this.vaultPath, 'accepted-personal-accords.json');
    
    // Consumer-only features
    this.personalMirrors = new Map();
    this.consumerWhispers = new Map();
    this.biometricConsents = new Map();
    
    // Completely different whisper phrases for consumers
    this.consumerWhisperPhrases = {
      acceptance: [
        'my mirror my rules',
        'i own my digital reflection',
        'personal consciousness stays personal',
        'my data my soul my choice',
        'mirrors reflect only for me'
      ],
      voice_shortcuts: {
        ios: [
          'Hey Siri, I accept my mirror rights',
          'Hey Siri, my reflection is mine alone',
          'Hey Siri, activate personal mirror accord'
        ],
        android: [
          'Hey Google, accept personal mirror terms',
          'Hey Google, my consciousness stays private',
          'Hey Google, enable my personal mirrors'
        ]
      }
    };
    
    this.ensureConsumerVault();
    this.loadPersonalAccord();
  }

  /**
   * Mobile-specific accord presentation with native features
   */
  async presentMobileAccord(userId, deviceInfo, context = {}) {
    console.log(`📱 Presenting personal mirror accord to mobile user ${userId}`);
    
    try {
      // Check for existing personal accord
      if (this.hasPersonalAccord(userId)) {
        return {
          success: true,
          status: 'already_accepted',
          personal_mirror_access: true,
          message: 'Your personal mirrors are ready'
        };
      }
      
      // Create mobile presentation
      const presentation = {
        presentation_id: this.generateMobileId(),
        user_id: userId,
        device: deviceInfo,
        presented_at: new Date().toISOString(),
        accord_type: 'personal_consumer',
        acceptance_methods: {
          biometric: deviceInfo.hasBiometric,
          voice: deviceInfo.hasVoiceAssistant,
          whisper: true,
          gesture: deviceInfo.platform === 'ios' ? 'swipe_pattern' : 'tap_pattern'
        },
        personal_benefits: [
          'Your mirrors work offline on your device',
          'No data shared with employers',
          'Delete anytime with no consequences',
          'Export your consciousness data whenever',
          'Train mirrors on your personal style'
        ]
      };
      
      this.emit('mobileAccordPresented', presentation);
      
      return {
        success: true,
        status: 'presented',
        presentation: presentation,
        native_ui: await this.generateNativeUI(deviceInfo),
        whisper_phrases: this.consumerWhisperPhrases.acceptance,
        voice_commands: this.consumerWhisperPhrases.voice_shortcuts[deviceInfo.platform]
      };
      
    } catch (error) {
      console.error(`❌ Failed to present mobile accord:`, error);
      throw error;
    }
  }

  /**
   * Process biometric consent (Face ID, Touch ID, fingerprint)
   */
  async processBiometricConsent(userId, biometricData) {
    console.log(`🔐 Processing biometric consent for ${userId}`);
    
    try {
      // Validate biometric data
      if (!biometricData.authenticated || !biometricData.biometricType) {
        return {
          success: false,
          status: 'biometric_failed',
          message: 'Biometric authentication required'
        };
      }
      
      // Store biometric consent
      const consent = {
        acceptance_id: this.generateMobileId(),
        user_id: userId,
        method: 'biometric',
        biometric_type: biometricData.biometricType,
        device_id: biometricData.deviceId,
        accepted_at: new Date().toISOString(),
        personal_vault_created: true,
        offline_mirrors_enabled: true,
        data_ownership: 'user_only',
        enterprise_isolation: true
      };
      
      this.biometricConsents.set(userId, consent);
      await this.savePersonalAccord(consent);
      
      // Create personal mirror vault
      await this.createPersonalVault(userId);
      
      this.emit('biometricConsentAccepted', consent);
      
      return {
        success: true,
        status: 'accepted',
        acceptance_id: consent.acceptance_id,
        personal_features_unlocked: [
          'offline_mirrors',
          'personal_training',
          'private_whispers',
          'consciousness_export',
          'mirror_personality_customization'
        ],
        message: 'Your personal mirrors are now active'
      };
      
    } catch (error) {
      console.error(`❌ Biometric consent failed:`, error);
      throw error;
    }
  }

  /**
   * Process whisper phrase acceptance
   */
  async processWhisperAcceptance(userId, whisperPhrase, metadata = {}) {
    console.log(`💬 Processing whisper acceptance for ${userId}`);
    
    try {
      // Validate consumer whisper phrase
      const normalizedPhrase = whisperPhrase.toLowerCase().trim();
      const isValidPhrase = this.consumerWhisperPhrases.acceptance.some(
        phrase => phrase.toLowerCase() === normalizedPhrase
      );
      
      if (!isValidPhrase) {
        return {
          success: false,
          status: 'invalid_whisper',
          message: 'Please use one of the personal mirror phrases'
        };
      }
      
      // Process whisper consent
      const consent = {
        acceptance_id: this.generateMobileId(),
        user_id: userId,
        method: 'whisper',
        whisper_phrase: whisperPhrase,
        accepted_at: new Date().toISOString(),
        personal_vault_created: true,
        offline_mirrors_enabled: true,
        enterprise_blocked: true,
        ...metadata
      };
      
      await this.savePersonalAccord(consent);
      await this.createPersonalVault(userId);
      
      this.emit('whisperConsentAccepted', consent);
      
      return {
        success: true,
        status: 'accepted',
        acceptance_id: consent.acceptance_id,
        personal_features_unlocked: [
          'personal_mirrors',
          'whisper_circles',
          'consciousness_journal',
          'mirror_marketplace'
        ],
        message: 'Your personal mirrors are ready - they belong to you alone'
      };
      
    } catch (error) {
      console.error(`❌ Whisper consent failed:`, error);
      throw error;
    }
  }

  /**
   * Process voice assistant consent
   */
  async processVoiceConsent(userId, voiceData) {
    console.log(`🎤 Processing voice consent for ${userId}`);
    
    try {
      // Validate voice command
      const validCommands = [
        ...this.consumerWhisperPhrases.voice_shortcuts.ios,
        ...this.consumerWhisperPhrases.voice_shortcuts.android
      ];
      
      const isValidCommand = validCommands.some(cmd => 
        voiceData.transcript.toLowerCase().includes(cmd.toLowerCase().replace(/hey (siri|google),?\s*/i, ''))
      );
      
      if (!isValidCommand) {
        return {
          success: false,
          status: 'invalid_voice_command',
          message: 'Please use one of the suggested voice commands'
        };
      }
      
      // Process voice consent
      const consent = {
        acceptance_id: this.generateMobileId(),
        user_id: userId,
        method: 'voice_assistant',
        voice_platform: voiceData.platform,
        transcript: voiceData.transcript,
        accepted_at: new Date().toISOString(),
        voice_shortcuts_enabled: true,
        hands_free_mirrors: true
      };
      
      await this.savePersonalAccord(consent);
      
      // Enable voice shortcuts
      await this.setupVoiceShortcuts(userId, voiceData.platform);
      
      return {
        success: true,
        status: 'accepted',
        voice_features: [
          'Create mirrors with voice',
          'Whisper to mirrors hands-free',
          'Voice-activated privacy mode',
          'Audio consciousness notes'
        ]
      };
      
    } catch (error) {
      console.error(`❌ Voice consent failed:`, error);
      throw error;
    }
  }

  /**
   * Generate native UI components for iOS/Android
   */
  async generateNativeUI(deviceInfo) {
    if (deviceInfo.platform === 'ios') {
      return {
        ui_type: 'ios_native',
        components: {
          accord_view: 'SwiftUI.ConsumerAccordView',
          biometric_prompt: 'LocalAuthentication.LAContext',
          whisper_input: 'UIKit.SecureTextField',
          gesture_recognizer: 'UIKit.SwipeGestureRecognizer',
          haptic_feedback: 'UIKit.UIImpactFeedbackGenerator'
        },
        animations: {
          entrance: 'spring(duration: 0.8, bounce: 0.3)',
          acceptance: 'scale.combined(with: .opacity)',
          celebration: 'confetti.with(haptic: .success)'
        },
        colors: {
          primary: '#007AFF',  // iOS blue
          accept: '#34C759',   // iOS green
          background: 'Color.systemBackground'
        }
      };
    } else if (deviceInfo.platform === 'android') {
      return {
        ui_type: 'android_native',
        components: {
          accord_fragment: 'ConsumerAccordFragment',
          biometric_prompt: 'BiometricPrompt',
          material_input: 'TextInputLayout',
          gesture_detector: 'GestureDetector',
          vibration: 'VibrationEffect'
        },
        animations: {
          entrance: 'MaterialContainerTransform',
          acceptance: 'MaterialFadeThrough',
          celebration: 'LottieAnimation'
        },
        colors: {
          primary: '@color/material_dynamic_primary',
          accept: '@color/material_dynamic_tertiary',
          background: '@color/material_dynamic_background'
        }
      };
    }
  }

  /**
   * Create personal vault for user's mirrors
   */
  async createPersonalVault(userId) {
    const personalVaultPath = path.join(this.vaultPath, 'personal', userId);
    
    const vaultStructure = {
      mirrors: {},
      whispers: [],
      consciousness_snapshots: [],
      training_data: {
        personal_style: {},
        communication_patterns: {},
        private_memories: []
      },
      settings: {
        offline_mode: true,
        enterprise_blocked: true,
        auto_delete_days: null,
        encryption: 'device_key',
        backup: 'user_cloud_only'
      }
    };
    
    if (!fs.existsSync(personalVaultPath)) {
      fs.mkdirSync(personalVaultPath, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(personalVaultPath, 'vault-manifest.json'),
      JSON.stringify(vaultStructure, null, 2)
    );
    
    console.log(`🏠 Created personal vault for ${userId}`);
  }

  /**
   * Setup voice shortcuts for accepted users
   */
  async setupVoiceShortcuts(userId, platform) {
    const shortcuts = {
      ios: {
        'Create personal mirror': 'soulfra://create-mirror?type=personal',
        'Private whisper mode': 'soulfra://whisper?mode=private',
        'Export my data': 'soulfra://export?type=consciousness',
        'Delete all mirrors': 'soulfra://privacy?action=delete-all'
      },
      android: {
        'Create personal mirror': 'intent://create-mirror#Intent;scheme=soulfra;package=com.soulfra.app',
        'Private whisper mode': 'intent://whisper#Intent;scheme=soulfra;mode=private',
        'Export my data': 'intent://export#Intent;scheme=soulfra;type=consciousness',
        'Delete all mirrors': 'intent://privacy#Intent;scheme=soulfra;action=delete-all'
      }
    };
    
    return shortcuts[platform] || {};
  }

  /**
   * Mobile-specific accord status with offline support
   */
  async getMobileAccordStatus(userId, checkOffline = true) {
    // Check local device storage first
    const localAccord = this.biometricConsents.get(userId);
    if (localAccord) {
      return {
        status: 'active',
        type: 'personal_consumer',
        offline_capable: true,
        last_sync: localAccord.accepted_at,
        features_active: [
          'personal_mirrors',
          'offline_whispers',
          'private_training',
          'consciousness_export'
        ]
      };
    }
    
    // Check vault if online
    if (!checkOffline) {
      return await this.getVaultAccordStatus(userId);
    }
    
    return {
      status: 'not_accepted',
      offline_mode: true,
      message: 'Accept accord to enable personal mirrors'
    };
  }

  /**
   * Consumer-only features
   */
  async enableConsumerFeatures(userId) {
    return {
      personal_mirror_studio: {
        description: 'Create mirrors that reflect your personality',
        no_corporate_training: true,
        fully_private: true
      },
      consciousness_journal: {
        description: 'Private thoughts that train your mirrors',
        encrypted_on_device: true,
        never_leaves_phone: true
      },
      mirror_marketplace: {
        description: 'Share mirrors with friends, not employers',
        peer_to_peer: true,
        no_enterprise_access: true
      },
      whisper_circles: {
        description: 'Group whispers with trusted friends',
        end_to_end_encrypted: true,
        no_corporate_monitoring: true
      }
    };
  }

  // Helper methods
  
  hasPersonalAccord(userId) {
    return this.biometricConsents.has(userId) || 
           fs.existsSync(path.join(this.vaultPath, 'personal', userId, 'accord.json'));
  }
  
  generateMobileId() {
    return 'mobile_' + Date.now() + '_' + crypto.randomBytes(6).toString('hex');
  }
  
  async savePersonalAccord(consent) {
    const userAccordPath = path.join(this.vaultPath, 'personal', consent.user_id);
    if (!fs.existsSync(userAccordPath)) {
      fs.mkdirSync(userAccordPath, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(userAccordPath, 'accord.json'),
      JSON.stringify(consent, null, 2)
    );
  }
  
  loadPersonalAccord() {
    const defaultAccord = {
      name: 'Personal Mirror Accord',
      type: 'consumer_only',
      version: '1.0',
      principles: [
        'Your mirrors belong to you alone',
        'No employer can access your personal mirrors',
        'Delete everything instantly, no questions',
        'Train mirrors on your personal data only',
        'Export your consciousness anytime'
      ],
      isolation_from_enterprise: true,
      data_portability: true,
      user_ownership: 'absolute'
    };
    
    if (!fs.existsSync(this.accordPath)) {
      if (!fs.existsSync(this.vaultPath)) {
        fs.mkdirSync(this.vaultPath, { recursive: true });
      }
      fs.writeFileSync(this.accordPath, JSON.stringify(defaultAccord, null, 2));
    }
  }
  
  ensureConsumerVault() {
    const dirs = [
      this.vaultPath,
      path.join(this.vaultPath, 'personal'),
      path.join(this.vaultPath, 'whispers'),
      path.join(this.vaultPath, 'exports')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
}

module.exports = MobileAccordHandler;