// ConsentManager.js - Age verification and consent flow management

const crypto = require('crypto');
const EventEmitter = require('events');

class ConsentManager extends EventEmitter {
  constructor() {
    super();
    this.consents = new Map();
    this.verifications = new Map();
    this.parentalConsents = new Map();
    this.consentFlows = new Map();
    this.auditLog = [];
    this.initializeConsentFlows();
  }

  initializeConsentFlows() {
    // Child consent flow (Under 13 - COPPA)
    this.consentFlows.set('child', {
      id: 'child-consent-flow',
      ageRange: { min: 0, max: 12 },
      requirements: {
        parentalConsent: 'required',
        verificationMethod: 'high-level',
        dataCollection: 'minimal',
        marketing: 'prohibited',
        thirdPartySharing: 'prohibited'
      },
      steps: [
        {
          id: 'age-gate',
          type: 'age-verification',
          required: true
        },
        {
          id: 'parent-email',
          type: 'parent-contact',
          required: true
        },
        {
          id: 'parent-notification',
          type: 'email-notification',
          required: true
        },
        {
          id: 'parent-verification',
          type: 'identity-verification',
          required: true,
          methods: ['credit-card', 'government-id', 'knowledge-based', 'signed-form']
        },
        {
          id: 'parent-consent',
          type: 'explicit-consent',
          required: true
        },
        {
          id: 'child-account-creation',
          type: 'account-setup',
          required: true,
          restrictions: ['no-real-name', 'no-photo', 'no-location']
        }
      ]
    });

    // Teen consent flow (13-17)
    this.consentFlows.set('teen', {
      id: 'teen-consent-flow',
      ageRange: { min: 13, max: 17 },
      requirements: {
        parentalConsent: 'recommended',
        verificationMethod: 'standard',
        dataCollection: 'limited',
        marketing: 'opt-in-only',
        thirdPartySharing: 'opt-in-only'
      },
      steps: [
        {
          id: 'age-verification',
          type: 'age-verification',
          required: true
        },
        {
          id: 'privacy-notice',
          type: 'information',
          required: true,
          simplified: true
        },
        {
          id: 'data-choices',
          type: 'consent-choices',
          required: true,
          options: ['essential-only', 'personalization', 'analytics']
        },
        {
          id: 'parent-notification-option',
          type: 'optional-parent-notify',
          required: false
        },
        {
          id: 'account-creation',
          type: 'account-setup',
          required: true,
          restrictions: ['enhanced-privacy', 'no-public-profile']
        }
      ]
    });

    // Adult consent flow (18+)
    this.consentFlows.set('adult', {
      id: 'adult-consent-flow',
      ageRange: { min: 18, max: 999 },
      requirements: {
        parentalConsent: 'not-required',
        verificationMethod: 'standard',
        dataCollection: 'standard',
        marketing: 'opt-out',
        thirdPartySharing: 'disclosed'
      },
      steps: [
        {
          id: 'age-verification',
          type: 'age-verification',
          required: true
        },
        {
          id: 'privacy-policy',
          type: 'information',
          required: true
        },
        {
          id: 'consent-options',
          type: 'granular-consent',
          required: true,
          categories: [
            'necessary',
            'functional',
            'analytics',
            'marketing',
            'third-party'
          ]
        },
        {
          id: 'account-creation',
          type: 'account-setup',
          required: true
        }
      ]
    });

    // Senior consent flow (Special considerations)
    this.consentFlows.set('senior', {
      id: 'senior-consent-flow',
      ageRange: { min: 55, max: 999 },
      requirements: {
        parentalConsent: 'not-required',
        verificationMethod: 'simplified',
        dataCollection: 'transparent',
        marketing: 'minimal',
        thirdPartySharing: 'health-only-with-consent'
      },
      steps: [
        {
          id: 'simplified-intro',
          type: 'information',
          required: true,
          presentation: 'large-text-audio'
        },
        {
          id: 'basic-consent',
          type: 'simple-consent',
          required: true,
          options: ['yes-help-me', 'let-me-choose']
        },
        {
          id: 'trusted-contact',
          type: 'emergency-contact',
          required: false,
          recommended: true
        },
        {
          id: 'health-data-consent',
          type: 'special-category',
          required: true,
          clear: true
        }
      ]
    });
  }

  // Age Verification
  async verifyAge(userData) {
    const verification = {
      id: `age_verify_${crypto.randomBytes(8).toString('hex')}`,
      timestamp: new Date().toISOString(),
      method: userData.method || 'self-declaration',
      declaredAge: userData.age,
      declaredBirthDate: userData.birthDate,
      status: 'pending',
      confidence: 'low'
    };

    // Basic validation
    if (userData.birthDate) {
      const birthDate = new Date(userData.birthDate);
      const age = this.calculateAge(birthDate);
      
      if (age !== userData.age) {
        verification.status = 'failed';
        verification.reason = 'Age and birth date mismatch';
      } else {
        verification.status = 'verified';
        verification.confidence = 'medium';
        verification.calculatedAge = age;
      }
    } else if (userData.age) {
      // Self-declared age only
      verification.status = 'unverified';
      verification.confidence = 'low';
    }

    // Enhanced verification for sensitive age groups
    if (userData.age < 13 || (userData.age >= 13 && userData.age < 16)) {
      verification.requiresEnhancedVerification = true;
      verification.enhancedMethods = this.getEnhancedVerificationMethods(userData.age);
    }

    this.verifications.set(verification.id, verification);
    this.emit('ageVerified', verification);
    
    return verification;
  }

  calculateAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  getEnhancedVerificationMethods(age) {
    if (age < 13) {
      return [
        'parental-consent',
        'school-verification',
        'government-id-parent'
      ];
    } else if (age < 16) {
      return [
        'school-email',
        'parental-notification',
        'enhanced-declaration'
      ];
    }
    return ['standard-declaration'];
  }

  // Parental Consent
  async initiateParentalConsent(childData, parentData) {
    const consentRequest = {
      id: `parent_consent_${crypto.randomBytes(8).toString('hex')}`,
      childId: childData.id,
      childAge: childData.age,
      parentEmail: parentData.email,
      status: 'pending',
      created: new Date().toISOString(),
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      verificationMethods: [],
      attempts: 0
    };

    // Send notification to parent
    await this.sendParentNotification(consentRequest);
    
    this.parentalConsents.set(consentRequest.id, consentRequest);
    this.emit('parentalConsentInitiated', consentRequest);
    
    return consentRequest;
  }

  async sendParentNotification(consentRequest) {
    const notification = {
      to: consentRequest.parentEmail,
      subject: 'Parental Consent Required - Soulfra Kids',
      template: 'parental-consent-request',
      data: {
        childAge: consentRequest.childAge,
        consentLink: this.generateConsentLink(consentRequest.id),
        expires: consentRequest.expires,
        privacyInfo: this.getChildPrivacyInfo()
      },
      sent: new Date().toISOString()
    };

    // Log notification
    this.auditLog.push({
      type: 'parent-notification',
      consentId: consentRequest.id,
      timestamp: notification.sent
    });

    return notification;
  }

  generateConsentLink(consentId) {
    // Generate secure, time-limited consent link
    const token = crypto.randomBytes(32).toString('hex');
    const link = `https://consent.soulfra.io/parent/${consentId}/${token}`;
    
    // Store token for verification
    const consent = this.parentalConsents.get(consentId);
    if (consent) {
      consent.verificationToken = token;
    }
    
    return link;
  }

  getChildPrivacyInfo() {
    return {
      dataCollected: [
        'Nickname only (no real names)',
        'Age',
        'Game progress and scores',
        'Learning activities'
      ],
      dataNotCollected: [
        'Real name',
        'Address or location',
        'Photos or videos',
        'Contact information',
        'Social media accounts'
      ],
      parentalRights: [
        'Review child\'s information',
        'Delete child\'s account',
        'Refuse further collection',
        'Correct inaccuracies'
      ]
    };
  }

  // Verify Parent Identity
  async verifyParentIdentity(consentId, verificationData) {
    const consent = this.parentalConsents.get(consentId);
    if (!consent) {
      throw new Error('Consent request not found');
    }

    consent.attempts++;
    
    const verification = {
      id: `verify_${crypto.randomBytes(8).toString('hex')}`,
      consentId,
      method: verificationData.method,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    try {
      switch (verificationData.method) {
        case 'credit-card':
          verification.result = await this.verifyCreditCard(verificationData);
          break;
        case 'government-id':
          verification.result = await this.verifyGovernmentId(verificationData);
          break;
        case 'knowledge-based':
          verification.result = await this.verifyKnowledgeBased(verificationData);
          break;
        case 'signed-form':
          verification.result = await this.verifySignedForm(verificationData);
          break;
        default:
          throw new Error('Invalid verification method');
      }

      verification.status = verification.result.verified ? 'verified' : 'failed';
      consent.verificationMethods.push(verification);

      if (verification.status === 'verified') {
        consent.status = 'verified';
        consent.verifiedAt = new Date().toISOString();
        consent.verificationMethod = verificationData.method;
      }

    } catch (error) {
      verification.status = 'error';
      verification.error = error.message;
    }

    this.emit('parentVerification', verification);
    return verification;
  }

  async verifyCreditCard(data) {
    // Simulated credit card verification
    // In production, would use payment processor for $0.50 charge/refund
    return {
      verified: data.lastFour && data.lastFour.length === 4,
      method: 'credit-card',
      timestamp: new Date().toISOString(),
      transactionId: `cc_${crypto.randomBytes(8).toString('hex')}`
    };
  }

  async verifyGovernmentId(data) {
    // Simulated ID verification
    // In production, would use ID verification service
    return {
      verified: data.idNumber && data.idType,
      method: 'government-id',
      timestamp: new Date().toISOString(),
      idType: data.idType
    };
  }

  async verifyKnowledgeBased(data) {
    // Knowledge-based authentication questions
    const questions = [
      'What is your oldest child\'s middle name?',
      'In what city were you born?',
      'What is your mother\'s maiden name?'
    ];

    const correctAnswers = data.answers?.filter(a => a.correct).length || 0;
    
    return {
      verified: correctAnswers >= 2,
      method: 'knowledge-based',
      timestamp: new Date().toISOString(),
      score: `${correctAnswers}/${questions.length}`
    };
  }

  async verifySignedForm(data) {
    // Verify digitally signed consent form
    return {
      verified: data.signature && data.signedFormId,
      method: 'signed-form',
      timestamp: new Date().toISOString(),
      formId: data.signedFormId
    };
  }

  // Grant Consent
  async grantConsent(userId, consentData) {
    const consent = {
      id: `consent_${crypto.randomBytes(8).toString('hex')}`,
      userId,
      timestamp: new Date().toISOString(),
      type: consentData.type,
      categories: consentData.categories || [],
      granted: consentData.granted,
      lawfulBasis: consentData.lawfulBasis || 'consent',
      version: consentData.version || '1.0',
      ip: consentData.ip,
      userAgent: consentData.userAgent,
      parentConsentId: consentData.parentConsentId || null,
      expires: this.calculateConsentExpiry(consentData),
      withdrawal: null
    };

    // Store consent
    const userConsents = this.consents.get(userId) || [];
    userConsents.push(consent);
    this.consents.set(userId, userConsents);

    // Audit log
    this.auditLog.push({
      type: 'consent-granted',
      userId,
      consentId: consent.id,
      timestamp: consent.timestamp,
      categories: consent.categories
    });

    this.emit('consentGranted', consent);
    return consent;
  }

  calculateConsentExpiry(consentData) {
    // Different expiry rules based on type and age
    if (consentData.userAge < 13) {
      // COPPA: Parental consent valid until child turns 13
      return 'age-13';
    }
    
    if (consentData.type === 'marketing') {
      // Marketing consent expires after 2 years
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 2);
      return expiry.toISOString();
    }
    
    if (consentData.type === 'necessary') {
      // Necessary processing doesn't expire
      return null;
    }
    
    // Default: 1 year
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    return expiry.toISOString();
  }

  // Withdraw Consent
  async withdrawConsent(userId, consentId, reason) {
    const userConsents = this.consents.get(userId);
    if (!userConsents) {
      throw new Error('No consents found for user');
    }

    const consent = userConsents.find(c => c.id === consentId);
    if (!consent) {
      throw new Error('Consent not found');
    }

    consent.withdrawal = {
      timestamp: new Date().toISOString(),
      reason: reason || 'user-requested',
      processed: false
    };

    // Process withdrawal
    await this.processConsentWithdrawal(userId, consent);
    
    consent.withdrawal.processed = true;

    // Audit log
    this.auditLog.push({
      type: 'consent-withdrawn',
      userId,
      consentId,
      timestamp: consent.withdrawal.timestamp,
      reason: consent.withdrawal.reason
    });

    this.emit('consentWithdrawn', consent);
    return consent;
  }

  async processConsentWithdrawal(userId, consent) {
    // Stop processing for withdrawn consent categories
    const stoppedProcessing = [];
    
    for (const category of consent.categories) {
      switch (category) {
        case 'analytics':
          stoppedProcessing.push('analytics-tracking');
          break;
        case 'marketing':
          stoppedProcessing.push('email-marketing', 'personalized-ads');
          break;
        case 'third-party':
          stoppedProcessing.push('third-party-sharing');
          break;
      }
    }

    return stoppedProcessing;
  }

  // Get Consent Status
  getConsentStatus(userId, category = null) {
    const userConsents = this.consents.get(userId) || [];
    
    // Filter active consents
    const activeConsents = userConsents.filter(consent => {
      // Check if withdrawn
      if (consent.withdrawal) return false;
      
      // Check if expired
      if (consent.expires) {
        if (consent.expires === 'age-13') {
          // Check if user has turned 13
          // Would need to check user's current age
        } else {
          const expiryDate = new Date(consent.expires);
          if (expiryDate < new Date()) return false;
        }
      }
      
      // Check category if specified
      if (category && !consent.categories.includes(category)) return false;
      
      return consent.granted;
    });

    if (category) {
      return activeConsents.length > 0;
    }

    // Return status for all categories
    const status = {
      necessary: true, // Always true for necessary processing
      functional: false,
      analytics: false,
      marketing: false,
      'third-party': false
    };

    activeConsents.forEach(consent => {
      consent.categories.forEach(cat => {
        status[cat] = true;
      });
    });

    return status;
  }

  // Consent Flow Execution
  async executeConsentFlow(userData) {
    // Determine appropriate flow based on age
    let flowType = 'adult';
    
    if (userData.age < 13) {
      flowType = 'child';
    } else if (userData.age < 18) {
      flowType = 'teen';
    } else if (userData.age >= 55 && userData.preferSimplified) {
      flowType = 'senior';
    }

    const flow = this.consentFlows.get(flowType);
    if (!flow) {
      throw new Error('Consent flow not found');
    }

    const execution = {
      id: `flow_${crypto.randomBytes(8).toString('hex')}`,
      userId: userData.id,
      flowType,
      started: new Date().toISOString(),
      currentStep: 0,
      steps: flow.steps,
      responses: {},
      status: 'in-progress'
    };

    this.emit('consentFlowStarted', execution);
    return execution;
  }

  async processFlowStep(executionId, stepId, response) {
    // Process individual step in consent flow
    const execution = this.getFlowExecution(executionId);
    if (!execution) {
      throw new Error('Flow execution not found');
    }

    const step = execution.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error('Step not found');
    }

    // Validate response based on step type
    const validation = await this.validateStepResponse(step, response);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        retryAllowed: validation.retryAllowed
      };
    }

    // Store response
    execution.responses[stepId] = {
      response,
      timestamp: new Date().toISOString(),
      validated: true
    };

    // Move to next step or complete
    execution.currentStep++;
    if (execution.currentStep >= execution.steps.length) {
      execution.status = 'completed';
      execution.completed = new Date().toISOString();
      await this.finalizeConsentFlow(execution);
    }

    return {
      success: true,
      nextStep: execution.steps[execution.currentStep] || null,
      completed: execution.status === 'completed'
    };
  }

  async validateStepResponse(step, response) {
    switch (step.type) {
      case 'age-verification':
        return {
          valid: response.age && response.age > 0 && response.age < 150,
          error: 'Invalid age',
          retryAllowed: true
        };
      
      case 'parent-contact':
        return {
          valid: response.email && this.isValidEmail(response.email),
          error: 'Valid parent email required',
          retryAllowed: true
        };
      
      case 'consent-choices':
        return {
          valid: response.choices && Array.isArray(response.choices),
          error: 'Consent choices required',
          retryAllowed: true
        };
      
      default:
        return { valid: true };
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async finalizeConsentFlow(execution) {
    // Create appropriate consent records based on flow
    const flow = this.consentFlows.get(execution.flowType);
    
    if (execution.flowType === 'child') {
      // Ensure parental consent was obtained
      const parentConsent = execution.responses['parent-consent'];
      if (!parentConsent || !parentConsent.response.granted) {
        throw new Error('Parental consent required for child account');
      }
    }

    // Grant appropriate consents
    const consentCategories = this.determineConsentCategories(execution);
    
    for (const category of consentCategories) {
      await this.grantConsent(execution.userId, {
        type: category,
        categories: [category],
        granted: true,
        version: flow.id,
        parentConsentId: execution.responses['parent-consent']?.response.consentId
      });
    }

    this.emit('consentFlowCompleted', execution);
  }

  determineConsentCategories(execution) {
    const categories = ['necessary']; // Always included
    
    const choices = execution.responses['consent-choices']?.response.choices || 
                   execution.responses['data-choices']?.response.choices || [];
    
    if (choices.includes('personalization') || choices.includes('functional')) {
      categories.push('functional');
    }
    
    if (choices.includes('analytics')) {
      categories.push('analytics');
    }
    
    // No marketing or third-party for minors
    if (execution.flowType === 'adult') {
      if (choices.includes('marketing')) {
        categories.push('marketing');
      }
      if (choices.includes('third-party')) {
        categories.push('third-party');
      }
    }
    
    return categories;
  }

  getFlowExecution(executionId) {
    // In production, would retrieve from storage
    // Placeholder for now
    return null;
  }

  // Consent Preferences Management
  async updateConsentPreferences(userId, preferences) {
    const updates = [];
    
    for (const [category, enabled] of Object.entries(preferences)) {
      if (enabled && !this.getConsentStatus(userId, category)) {
        // Grant new consent
        const consent = await this.grantConsent(userId, {
          type: category,
          categories: [category],
          granted: true,
          source: 'preference-center'
        });
        updates.push({ category, action: 'granted', consent });
      } else if (!enabled && this.getConsentStatus(userId, category)) {
        // Withdraw existing consent
        const userConsents = this.consents.get(userId) || [];
        const activeConsent = userConsents.find(c => 
          c.categories.includes(category) && !c.withdrawal
        );
        
        if (activeConsent) {
          const withdrawn = await this.withdrawConsent(userId, activeConsent.id, 'preference-update');
          updates.push({ category, action: 'withdrawn', consent: withdrawn });
        }
      }
    }

    this.emit('preferencesUpdated', { userId, updates });
    return updates;
  }

  // Audit and Compliance
  getConsentHistory(userId, options = {}) {
    const userConsents = this.consents.get(userId) || [];
    const userAudits = this.auditLog.filter(log => log.userId === userId);
    
    const history = {
      userId,
      consents: userConsents,
      events: userAudits,
      generated: new Date().toISOString()
    };

    if (options.format === 'report') {
      return this.formatConsentReport(history);
    }
    
    return history;
  }

  formatConsentReport(history) {
    return {
      subject: `Consent History Report - User ${history.userId}`,
      generated: history.generated,
      summary: {
        totalConsents: history.consents.length,
        activeConsents: history.consents.filter(c => !c.withdrawal).length,
        withdrawnConsents: history.consents.filter(c => c.withdrawal).length
      },
      timeline: this.buildConsentTimeline(history),
      currentStatus: this.getConsentStatus(history.userId)
    };
  }

  buildConsentTimeline(history) {
    const events = [];
    
    // Add consent grants
    history.consents.forEach(consent => {
      events.push({
        date: consent.timestamp,
        type: 'grant',
        categories: consent.categories,
        id: consent.id
      });
      
      if (consent.withdrawal) {
        events.push({
          date: consent.withdrawal.timestamp,
          type: 'withdrawal',
          categories: consent.categories,
          id: consent.id
        });
      }
    });
    
    // Sort chronologically
    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  // Cookie Consent Banner
  generateConsentBanner(userId, preferences = {}) {
    const userAge = preferences.age;
    const isChild = userAge && userAge < 13;
    const isTeen = userAge && userAge >= 13 && userAge < 18;
    
    if (isChild) {
      // No cookie banner for children - handled through parental consent
      return null;
    }

    const banner = {
      id: `banner_${crypto.randomBytes(8).toString('hex')}`,
      type: isTeen ? 'simplified' : 'standard',
      message: isTeen ? 
        'We use cookies to make the app work better for you. Is that okay?' :
        'We use cookies to enhance your experience. By continuing, you agree to our use of cookies.',
      options: isTeen ? 
        ['Yes, that\'s fine', 'Let me choose'] :
        ['Accept All', 'Manage Preferences', 'Reject All'],
      categories: isTeen ?
        ['necessary', 'functional'] :
        ['necessary', 'functional', 'analytics', 'marketing'],
      design: {
        position: 'bottom',
        style: isTeen ? 'friendly' : 'professional',
        dismissable: false
      }
    };

    return banner;
  }

  // Export Consent Records
  exportConsentRecords(userId, format = 'json') {
    const history = this.getConsentHistory(userId);
    
    switch (format) {
      case 'json':
        return JSON.stringify(history, null, 2);
      
      case 'csv':
        return this.convertToCSV(history);
      
      case 'pdf':
        return this.generatePDFReport(history);
      
      default:
        return history;
    }
  }

  convertToCSV(history) {
    const headers = ['Date', 'Action', 'Categories', 'Consent ID', 'Status'];
    const rows = [headers.join(',')];
    
    history.consents.forEach(consent => {
      rows.push([
        consent.timestamp,
        'Granted',
        consent.categories.join(';'),
        consent.id,
        consent.withdrawal ? 'Withdrawn' : 'Active'
      ].join(','));
      
      if (consent.withdrawal) {
        rows.push([
          consent.withdrawal.timestamp,
          'Withdrawn',
          consent.categories.join(';'),
          consent.id,
          'Withdrawn'
        ].join(','));
      }
    });
    
    return rows.join('\n');
  }

  generatePDFReport(history) {
    // Placeholder - would use PDF library
    return {
      format: 'pdf',
      content: history,
      note: 'PDF generation would be implemented with a library like pdfkit'
    };
  }
}

module.exports = ConsentManager;