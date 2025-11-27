// PrivacyFramework.js - Age-appropriate privacy policies

const crypto = require('crypto');

class PrivacyFramework {
  constructor() {
    this.policies = new Map();
    this.consents = new Map();
    this.dataCategories = new Map();
    this.retentionPolicies = new Map();
    this.initializePolicies();
    this.initializeDataCategories();
  }

  initializePolicies() {
    // Kids Privacy Policy (COPPA Compliant)
    this.policies.set('kids', {
      id: 'privacy_kids_v1',
      version: '1.0',
      lastUpdated: '2024-01-01',
      ageRange: { min: 4, max: 12 },
      compliance: ['COPPA', 'GDPR-K'],
      sections: [
        {
          title: 'What Information We Collect 📋',
          content: `
We only collect:
• Your nickname (not your real name!)
• Your age (to give you the right games)
• What games you play (to make them better)
• Your parent's email (to keep you safe)

We NEVER collect:
❌ Your real name
❌ Where you live
❌ Your school
❌ Photos of you
❌ Your friends' information
          `,
          icon: 'clipboard',
          parentNote: 'We comply with COPPA and collect minimal information'
        },
        {
          title: 'How We Keep You Safe 🔒',
          content: `
Your information is super safe:
• It's locked up like a treasure chest
• Only your parents can see it
• We never share it with strangers
• Bad guys can't get to it
• Your parents are in charge
          `,
          icon: 'lock',
          parentNote: 'We use encryption and strict access controls'
        },
        {
          title: 'Who Can See Your Stuff 👀',
          content: `
Only these people:
✅ You
✅ Your parents
✅ Our special helpers (who keep you safe)

Nobody else! Not even:
❌ Other kids
❌ Strangers
❌ Advertisers
❌ Anyone your parents don't approve
          `,
          icon: 'eyes',
          parentNote: 'No third-party sharing or advertising'
        },
        {
          title: 'Your Special Rights ✨',
          content: `
You and your parents can:
• See everything we know about you
• Fix mistakes
• Delete everything
• Take a break anytime
• Ask us questions

Just ask your parents to help!
          `,
          icon: 'star',
          parentNote: 'Full COPPA rights including access, correction, and deletion'
        }
      ],
      parentalControls: {
        required: true,
        features: [
          'View all child data',
          'Delete child data',
          'Control sharing settings',
          'Set time limits',
          'Review activity logs',
          'Approve contacts'
        ]
      },
      dataMinimization: {
        principle: 'Collect only what is necessary for the service',
        noCollection: [
          'Real names',
          'Addresses',
          'Phone numbers',
          'Email addresses (except parent)',
          'Photos/videos',
          'Voice recordings without consent',
          'Geolocation',
          'Social media accounts'
        ]
      }
    });

    // Teen Privacy Policy
    this.policies.set('teen', {
      id: 'privacy_teen_v1',
      version: '1.0',
      lastUpdated: '2024-01-01',
      ageRange: { min: 13, max: 17 },
      compliance: ['GDPR', 'CCPA', 'COPPA-Safe-Harbor'],
      sections: [
        {
          title: 'Information We Collect',
          content: `
We collect limited information to provide our service:

📱 Account Info:
• Username and email
• Age and preferences
• Avatar (no real photos required)

💻 Usage Data:
• How you use the app
• Your learning progress
• Content you create

🚫 We Don't Collect:
• Precise location
• Contacts from your phone
• Photos without permission
• Browsing history outside our app
          `,
          readingLevel: 'teen'
        },
        {
          title: 'Your Privacy Rights',
          content: `
You have important rights:

✅ Access Your Data: See everything we have about you
✏️ Correct Mistakes: Fix any wrong information
🗑️ Delete Your Account: Remove all your data
🚫 Stop Processing: Pause how we use your data
📦 Download Your Data: Get a copy of everything
🙅 Say No: Opt out of optional features

Email us at privacy@soulfra.io to use these rights!
          `,
          readingLevel: 'teen',
          actionable: true
        },
        {
          title: 'How We Use Your Info',
          content: `
We use your information to:

🎮 Make the app work for you
📚 Personalize your learning
🔒 Keep your account secure
📧 Send you updates (if you want)
📊 Improve our service

 We NEVER:
❌ Sell your data
❌ Share with advertisers
❌ Use for purposes you didn't agree to
          `,
          readingLevel: 'teen'
        },
        {
          title: 'Sharing & Safety',
          content: `
We only share your info when:

👮‍♂️ Law requires it (very rare)
🆘 There's an emergency
👨‍👩‍👧 Your parents ask (if under 18)
✅ You specifically allow it

Your data is encrypted and protected!
          `,
          readingLevel: 'teen'
        }
      ],
      specialProtections: [
        'Enhanced consent requirements',
        'Right to erasure (right to be forgotten)',
        'Data portability',
        'Restriction of processing',
        'No behavioral advertising',
        'Limited data retention'
      ]
    });

    // Family Privacy Policy
    this.policies.set('family', {
      id: 'privacy_family_v1',
      version: '1.0',
      lastUpdated: '2024-01-01',
      compliance: ['GDPR', 'CCPA', 'COPPA'],
      sections: [
        {
          title: 'Family Privacy Overview',
          content: `
Our family privacy policy covers everyone in your family:

👶 Children (Under 13): Special COPPA protections
👦👧 Teens (13-17): Enhanced privacy rights
👨👩 Adults: Full control over family data

Each family member has age-appropriate privacy protections.
          `,
          readingLevel: 'simple'
        },
        {
          title: 'What We Collect Per Family Member',
          content: `
👨👩 Adults:
• Name, email, phone (optional)
• Payment information (secured)
• Family relationships

👦👧 Teens (13-17):
• Username, age
• Learning progress
• Created content

👶 Children (Under 13):
• Nickname only
• Age
• Game progress
• Parent email
          `,
          readingLevel: 'simple',
          breakdown: 'by-age'
        },
        {
          title: 'Family Data Sharing Rules',
          content: `
Within your family:
• Parents see children's activities
• Family members can share selected content
• Privacy settings control what's visible
• Each member controls their own data

Outside your family:
• No sharing without permission
• No advertising
• No data sales ever
          `,
          readingLevel: 'simple'
        },
        {
          title: 'Parental Controls',
          content: `
Parents can:
✅ View children's data
✅ Set privacy levels
✅ Approve contacts
✅ Delete child accounts
✅ Download all family data
✅ Set screen time limits

Children maintain age-appropriate autonomy.
          `,
          readingLevel: 'simple',
          tools: 'parental-dashboard'
        }
      ],
      familyDataModel: {
        segregation: 'by-member',
        parentalAccess: 'age-based',
        sharing: 'consent-required',
        deletion: 'cascade-optional'
      }
    });

    // Senior Privacy Policy
    this.policies.set('senior', {
      id: 'privacy_senior_v1',
      version: '1.0',
      lastUpdated: '2024-01-01',
      compliance: ['GDPR', 'CCPA', 'HIPAA-Ready'],
      sections: [
        {
          title: 'Your Privacy Matters',
          content: `
We protect your privacy:

• Your information is always secure
• You control who sees what
• We never sell your information
• Simple controls to manage privacy
• Family can only see what you allow
          `,
          fontSize: 'large',
          readingLevel: 'clear'
        },
        {
          title: 'Information We Collect',
          content: `
We collect:

🏥 Health Information:
• Medications (to remind you)
• Appointments (to help you remember)
• Emergency contacts (for safety)

📞 Contact Information:
• Your name and phone
• Family contacts (with permission)

🗓️ Daily Information:
• Conversations with your AI companion
• Activities you choose
• Preferences and settings
          `,
          fontSize: 'large',
          icons: true
        },
        {
          title: 'Your Health Information',
          content: `
Your health data is extra protected:

🔒 Encrypted and secure
🏥 Only shared with doctors if you agree
👨‍👩‍👧 Family sees only what you permit
🚫 Never used for advertising
📦 You can download it anytime
🗑️ You can delete it anytime
          `,
          fontSize: 'large',
          emphasis: 'health-privacy'
        },
        {
          title: 'Your Choices',
          content: `
You can always:

• See all your information
• Change privacy settings
• Delete your account
• Choose what family can see
• Download your data
• Opt out of features

Need help? Call: 1-800-SOULFRA
          `,
          fontSize: 'large',
          supportContact: true
        }
      ],
      healthDataProtections: {
        encryption: 'AES-256',
        access: 'role-based',
        sharing: 'explicit-consent',
        retention: 'user-controlled',
        portability: 'standard-formats'
      }
    });

    // Developer Privacy Policy
    this.policies.set('developer', {
      id: 'privacy_developer_v1',
      version: '1.0',
      lastUpdated: '2024-01-01',
      compliance: ['GDPR', 'CCPA', 'SOC2'],
      sections: [
        {
          title: 'Data Processing Agreement',
          content: `
As a developer using our platform:

1. You are a data controller for your user data
2. We are a data processor providing infrastructure
3. We process data according to your instructions
4. You must comply with all privacy laws
5. We provide tools for compliance
          `,
          readingLevel: 'professional',
          legal: true
        },
        {
          title: 'Developer Account Data',
          content: `
We collect:
• Account information (name, email, company)
• API usage metrics
• Billing information
• Support interactions
• Integration configurations

All data is used solely for platform operation.
          `,
          readingLevel: 'professional'
        },
        {
          title: 'End-User Data Processing',
          content: `
For data you process through our platform:

• You maintain full ownership
• We process only as directed
• Encryption in transit and at rest
• Geographic data residency options
• Automated GDPR compliance tools
• Data isolation between accounts
          `,
          readingLevel: 'professional',
          technical: true
        },
        {
          title: 'Security and Compliance',
          content: `
Our security measures:

• SOC 2 Type II certified
• Annual security audits
• Encryption at rest (AES-256)
• TLS 1.3 for data in transit
• Regular penetration testing
• 24/7 security monitoring
• Incident response team
          `,
          readingLevel: 'professional',
          certifications: ['SOC2', 'ISO27001-ready']
        }
      ],
      dataProcessingTerms: {
        purpose: 'platform-operation',
        subprocessors: 'listed-approved',
        audits: 'annual-on-request',
        breach: 'notification-72h',
        retention: 'instruction-based'
      }
    });
  }

  initializeDataCategories() {
    // Define data categories and their handling rules
    this.dataCategories.set('personal', {
      description: 'Basic identity information',
      sensitivity: 'medium',
      examples: ['name', 'email', 'age'],
      retention: '5 years or until deletion',
      sharing: 'user-consent-required',
      encryption: 'required'
    });

    this.dataCategories.set('health', {
      description: 'Health and medical information',
      sensitivity: 'high',
      examples: ['medications', 'conditions', 'vitals'],
      retention: '7 years or until deletion',
      sharing: 'explicit-consent-only',
      encryption: 'required-double',
      compliance: ['HIPAA-ready']
    });

    this.dataCategories.set('usage', {
      description: 'How the service is used',
      sensitivity: 'low',
      examples: ['features used', 'session duration', 'preferences'],
      retention: '2 years',
      sharing: 'aggregate-only',
      encryption: 'required'
    });

    this.dataCategories.set('content', {
      description: 'User-generated content',
      sensitivity: 'variable',
      examples: ['messages', 'creations', 'recordings'],
      retention: 'user-controlled',
      sharing: 'user-specified',
      encryption: 'required'
    });

    this.dataCategories.set('minor', {
      description: 'Data from users under 18',
      sensitivity: 'high',
      examples: ['child profiles', 'activities', 'progress'],
      retention: 'until-18-or-deletion',
      sharing: 'prohibited-except-parent',
      encryption: 'required-enhanced',
      compliance: ['COPPA', 'GDPR-K']
    });
  }

  // Get appropriate privacy policy for user
  getPolicyForUser(userProfile) {
    let policyType = 'general';
    
    if (userProfile.age < 13) {
      policyType = 'kids';
    } else if (userProfile.age < 18) {
      policyType = 'teen';
    } else if (userProfile.age >= 55 || userProfile.accountType === 'senior') {
      policyType = 'senior';
    } else if (userProfile.accountType === 'developer') {
      policyType = 'developer';
    } else if (userProfile.accountType === 'family') {
      policyType = 'family';
    }

    const policy = this.policies.get(policyType);
    return this.personalizePolicy(policy, userProfile);
  }

  personalizePolicy(policy, userProfile) {
    const personalized = { ...policy };
    
    // Add user-specific information
    personalized.userData = {
      categories: this.identifyDataCategories(userProfile),
      rights: this.getUserRights(userProfile),
      contacts: this.getContactInfo(userProfile)
    };

    // Apply accessibility settings
    if (userProfile.accessibility) {
      personalized.presentation = this.applyAccessibility(policy, userProfile.accessibility);
    }

    return personalized;
  }

  identifyDataCategories(userProfile) {
    const categories = ['personal', 'usage'];
    
    if (userProfile.age < 18) {
      categories.push('minor');
    }
    
    if (userProfile.healthTracking) {
      categories.push('health');
    }
    
    if (userProfile.createsContent) {
      categories.push('content');
    }
    
    return categories.map(cat => ({
      name: cat,
      ...this.dataCategories.get(cat)
    }));
  }

  getUserRights(userProfile) {
    const baseRights = [
      'access',
      'rectification',
      'erasure',
      'portability',
      'restriction',
      'objection'
    ];

    const rights = baseRights.map(right => ({
      name: right,
      description: this.getRightDescription(right, userProfile.age),
      howTo: this.getRightInstructions(right, userProfile.age)
    }));

    // Additional rights for minors
    if (userProfile.age < 18) {
      rights.push({
        name: 'parental-access',
        description: 'Your parent or guardian can access your data',
        howTo: 'Your parent can use the family dashboard'
      });
    }

    return rights;
  }

  getRightDescription(right, age) {
    const descriptions = {
      access: age < 13 ? 
        'You can see all the information we have about you' :
        'Access all personal data we process about you',
      rectification: age < 13 ?
        'You can fix any mistakes in your information' :
        'Correct inaccurate personal data',
      erasure: age < 13 ?
        'You can delete all your information' :
        'Request deletion of your personal data',
      portability: age < 13 ?
        'You can take your information with you' :
        'Receive your data in a portable format',
      restriction: age < 13 ?
        'You can pause how we use your information' :
        'Restrict processing of your data',
      objection: age < 13 ?
        'You can say no to certain uses' :
        'Object to specific processing activities'
    };
    
    return descriptions[right] || '';
  }

  getRightInstructions(right, age) {
    if (age < 13) {
      return 'Ask your parent or guardian to help you with this';
    } else if (age < 18) {
      return 'Email privacy@soulfra.io or use the app settings';
    } else {
      return 'Submit a request through your account settings or email privacy@soulfra.io';
    }
  }

  getContactInfo(userProfile) {
    return {
      email: 'privacy@soulfra.io',
      phone: userProfile.age >= 55 ? '1-800-SOULFRA' : null,
      inApp: 'Settings > Privacy > Contact Us',
      responseTime: '48 hours'
    };
  }

  applyAccessibility(policy, settings) {
    const presentation = {
      fontSize: settings.fontSize || 'normal',
      contrast: settings.contrast || 'normal',
      readAloud: settings.readAloud || false,
      simplifiedLanguage: settings.simplifiedLanguage || false
    };

    if (presentation.simplifiedLanguage) {
      presentation.sections = policy.sections.map(section => ({
        ...section,
        content: this.simplifyContent(section.content)
      }));
    }

    return presentation;
  }

  simplifyContent(content) {
    // This would use NLP to simplify language
    // For now, basic implementation
    return content
      .replace(/process/gi, 'use')
      .replace(/retain/gi, 'keep')
      .replace(/pursuant to/gi, 'following')
      .replace(/third party/gi, 'other company');
  }

  // Consent management
  recordConsent(userId, consentData) {
    const consent = {
      id: `consent_${crypto.randomBytes(8).toString('hex')}`,
      userId,
      timestamp: new Date().toISOString(),
      type: consentData.type,
      purpose: consentData.purpose,
      scope: consentData.scope,
      granted: consentData.granted,
      mechanism: consentData.mechanism, // 'click', 'toggle', 'verbal', 'written'
      ipAddress: consentData.ipAddress,
      parentalConsent: consentData.parentalConsent || null,
      expiresAt: this.calculateConsentExpiry(consentData)
    };

    const userConsents = this.consents.get(userId) || [];
    userConsents.push(consent);
    this.consents.set(userId, userConsents);

    return consent;
  }

  calculateConsentExpiry(consentData) {
    // Different expiry rules based on type and user age
    if (consentData.userAge < 13) {
      // COPPA: Parental consent expires when child turns 13
      return 'age-13';
    } else if (consentData.type === 'marketing') {
      // Marketing consent expires after 2 years
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 2);
      return expiry.toISOString();
    }
    
    // Default: No expiry
    return null;
  }

  // Data retention
  getRetentionPolicy(dataCategory, userProfile) {
    const category = this.dataCategories.get(dataCategory);
    if (!category) return null;

    let retention = category.retention;
    
    // Special rules for minors
    if (userProfile.age < 18 && dataCategory !== 'minor') {
      retention = 'Until age 18 or deletion request';
    }
    
    // Health data special rules
    if (dataCategory === 'health' && userProfile.jurisdiction === 'US') {
      retention = 'Minimum 7 years per HIPAA';
    }
    
    return {
      category: dataCategory,
      period: retention,
      automaticDeletion: this.hasAutomaticDeletion(dataCategory),
      userControl: true,
      exceptions: this.getRetentionExceptions(dataCategory)
    };
  }

  hasAutomaticDeletion(category) {
    return ['usage', 'minor'].includes(category);
  }

  getRetentionExceptions(category) {
    const exceptions = [];
    
    exceptions.push('Legal hold or investigation');
    exceptions.push('User-requested preservation');
    
    if (category === 'health') {
      exceptions.push('Medical records requirements');
    }
    
    return exceptions;
  }

  // Privacy rights execution
  async executePrivacyRight(userId, rightType, details = {}) {
    const user = await this.getUser(userId); // Would fetch user data
    
    switch (rightType) {
      case 'access':
        return this.provideDataAccess(userId, details);
      case 'erasure':
        return this.deleteUserData(userId, details);
      case 'portability':
        return this.exportUserData(userId, details.format);
      case 'rectification':
        return this.updateUserData(userId, details.updates);
      case 'restriction':
        return this.restrictProcessing(userId, details.scope);
      case 'objection':
        return this.recordObjection(userId, details.processing);
      default:
        throw new Error('Unknown privacy right');
    }
  }

  async provideDataAccess(userId, details) {
    // Compile all user data
    const userData = {
      profile: {}, // Would fetch from database
      usage: {},
      content: {},
      consents: this.consents.get(userId) || [],
      communications: []
    };

    return {
      requestId: `access_${crypto.randomBytes(8).toString('hex')}`,
      userId,
      generatedAt: new Date().toISOString(),
      data: userData,
      format: details.format || 'json',
      expiresIn: '30 days'
    };
  }

  async deleteUserData(userId, details) {
    // In production, this would trigger actual deletion
    const deletionRecord = {
      requestId: `deletion_${crypto.randomBytes(8).toString('hex')}`,
      userId,
      requestedAt: new Date().toISOString(),
      scope: details.scope || 'all',
      status: 'pending',
      estimatedCompletion: '30 days',
      exceptions: details.preserve || []
    };

    // Schedule deletion
    this.scheduleDeletion(deletionRecord);
    
    return deletionRecord;
  }

  async exportUserData(userId, format = 'json') {
    const exportRecord = {
      requestId: `export_${crypto.randomBytes(8).toString('hex')}`,
      userId,
      requestedAt: new Date().toISOString(),
      format,
      status: 'processing',
      downloadUrl: null,
      expiresAt: null
    };

    // In production, would trigger async export
    this.processExport(exportRecord);
    
    return exportRecord;
  }

  scheduleDeletion(deletionRecord) {
    // Implementation for scheduling data deletion
    // Would integrate with data retention systems
  }

  processExport(exportRecord) {
    // Implementation for processing data export
    // Would generate downloadable file
  }

  // Compliance reporting
  generateComplianceReport(period = 'month') {
    const report = {
      period,
      generated: new Date().toISOString(),
      metrics: {
        privacyRequests: this.countPrivacyRequests(period),
        consents: this.analyzeConsents(period),
        breaches: this.getBreaches(period),
        retention: this.analyzeRetention()
      },
      compliance: {
        GDPR: this.checkGDPRCompliance(),
        CCPA: this.checkCCPACompliance(),
        COPPA: this.checkCOPPACompliance()
      }
    };

    return report;
  }

  countPrivacyRequests(period) {
    // Would count actual requests from database
    return {
      access: 0,
      erasure: 0,
      portability: 0,
      rectification: 0,
      total: 0
    };
  }

  analyzeConsents(period) {
    let total = 0;
    let granted = 0;
    
    for (const [userId, userConsents] of this.consents) {
      userConsents.forEach(consent => {
        total++;
        if (consent.granted) granted++;
      });
    }
    
    return {
      total,
      granted,
      denied: total - granted,
      rate: total > 0 ? (granted / total * 100).toFixed(2) + '%' : '0%'
    };
  }

  getBreaches(period) {
    // Would fetch from security system
    return {
      total: 0,
      reported: 0,
      resolved: 0
    };
  }

  analyzeRetention() {
    // Would analyze actual data retention
    return {
      withinPolicy: 100,
      overdue: 0,
      deleted: 0
    };
  }

  checkGDPRCompliance() {
    return {
      dataMapping: 'complete',
      legalBasis: 'documented',
      consent: 'implemented',
      rights: 'automated',
      dpa: 'signed',
      privacy: 'published'
    };
  }

  checkCCPACompliance() {
    return {
      optOut: 'available',
      disclosure: 'complete',
      nondiscrimination: 'enforced',
      verifiableRequests: 'implemented'
    };
  }

  checkCOPPACompliance() {
    return {
      parentalConsent: 'required',
      disclosure: 'clear',
      access: 'provided',
      deletion: 'available',
      retention: 'minimal'
    };
  }

  async getUser(userId) {
    // Placeholder - would fetch from database
    return { id: userId };
  }

  async updateUserData(userId, updates) {
    // Placeholder - would update in database
    return { success: true, updated: Object.keys(updates).length };
  }

  async restrictProcessing(userId, scope) {
    // Placeholder - would implement processing restrictions
    return { restricted: true, scope };
  }

  async recordObjection(userId, processingType) {
    // Placeholder - would record objection
    return { recorded: true, type: processingType };
  }
}

module.exports = PrivacyFramework;