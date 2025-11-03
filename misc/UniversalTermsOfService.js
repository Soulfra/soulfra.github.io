// UniversalTermsOfService.js - Tier-appropriate terms for all user types

const crypto = require('crypto');

class UniversalTermsOfService {
  constructor() {
    this.terms = new Map();
    this.acceptances = new Map();
    this.versions = new Map();
    this.initializeTerms();
  }

  initializeTerms() {
    // Developer Terms
    this.terms.set('developer', {
      id: 'tos_developer_v1',
      version: '1.0',
      effectiveDate: '2024-01-01',
      sections: [
        {
          title: 'API Usage and Access',
          content: `
1.1 API Access: You are granted a non-exclusive, non-transferable license to access and use the Soulfra API.
1.2 Rate Limits: API usage is subject to rate limits as specified in your subscription tier.
1.3 Prohibited Uses: You may not use the API to create competing services or violate any laws.
1.4 API Keys: You are responsible for maintaining the security of your API keys.
          `,
          readingLevel: 'professional'
        },
        {
          title: 'Intellectual Property',
          content: `
2.1 Your Content: You retain all rights to content you create using our platform.
2.2 Our Technology: Soulfra retains all rights to its AI technology and platform.
2.3 Feedback: Any feedback provided may be used by Soulfra without compensation.
          `,
          readingLevel: 'professional'
        },
        {
          title: 'Data Processing and Privacy',
          content: `
3.1 Data Processing: We process data according to our Data Processing Agreement.
3.2 GDPR Compliance: We comply with GDPR requirements for EU data.
3.3 Data Security: We implement industry-standard security measures.
          `,
          readingLevel: 'professional'
        },
        {
          title: 'Liability and Indemnification',
          content: `
4.1 Limitation of Liability: Our liability is limited to the fees paid in the last 12 months.
4.2 Indemnification: You agree to indemnify Soulfra against claims arising from your use.
4.3 No Warranties: The service is provided "as is" without warranties.
          `,
          readingLevel: 'professional'
        }
      ],
      requiresSignature: true,
      minimumAge: 18
    });

    // Family Terms
    this.terms.set('family', {
      id: 'tos_family_v1',
      version: '1.0',
      effectiveDate: '2024-01-01',
      sections: [
        {
          title: 'Family Account Setup',
          content: `
Welcome to Soulfra Family! Here's what you need to know:

• One adult must be the main account holder
• You can add family members of all ages
• Each family member gets their own safe space
• Parents can monitor children's activities
          `,
          readingLevel: 'simple',
          visualAid: 'family_setup_diagram'
        },
        {
          title: 'Keeping Everyone Safe',
          content: `
We care about your family's safety:

• Children under 13 have special protections
• No personal information is shared
• Parents control privacy settings
• All content is filtered for appropriateness
• Emergency contacts are always available
          `,
          readingLevel: 'simple',
          visualAid: 'safety_shield_icon'
        },
        {
          title: 'What We Collect and Why',
          content: `
We only collect information to help your family:

• Names and ages (to personalize experiences)
• Activities (to track learning progress)
• Preferences (to make it more fun)
• Nothing is sold or shared with others
          `,
          readingLevel: 'simple'
        },
        {
          title: 'Rules for Everyone',
          content: `
Simple rules to follow:

• Be kind to each other
• Don't share passwords
• Tell an adult if something seems wrong
• Have fun learning together!
          `,
          readingLevel: 'simple',
          visualAid: 'rules_checklist'
        }
      ],
      requiresSignature: true,
      requiresParentalConsent: true,
      minimumAge: 0,
      parentalControlAge: 18
    });

    // Kids Terms (Simplified)
    this.terms.set('kids', {
      id: 'tos_kids_v1',
      version: '1.0',
      effectiveDate: '2024-01-01',
      sections: [
        {
          title: 'Welcome to Soulfra Kids! 🌟',
          content: `
Hi there! Before we start having fun, here are some important rules:

🎮 This is your special place to play and learn
👨‍👩‍👧‍👦 Your parents help keep you safe here
🔐 We never share your information with strangers
✨ Everything here is just for you!
          `,
          readingLevel: 'child',
          audio: true,
          visualAid: 'welcome_animation'
        },
        {
          title: 'Safety Rules 🛡️',
          content: `
Important safety rules:

1. Never tell anyone your real name or where you live
2. If someone asks for personal information, tell your parents
3. Only talk to your Soulfra friend (your AI companion)
4. If anything makes you uncomfortable, tell a grown-up
          `,
          readingLevel: 'child',
          audio: true,
          visualAid: 'safety_superhero'
        },
        {
          title: 'Having Fun Together! 🎉',
          content: `
Here's how to have the most fun:

• Play games and learn new things
• Be nice to your AI friend
• Ask questions - there are no silly questions!
• Show your parents the cool things you learn
          `,
          readingLevel: 'child',
          audio: true,
          visualAid: 'fun_activities'
        },
        {
          title: 'Parent Permission 👨‍👩‍👧',
          content: `
Remember:

• Your parents said it's okay for you to be here
• They can see what you're doing to keep you safe
• Always ask them if you're unsure about something
• They love you and want you to have fun safely!
          `,
          readingLevel: 'child',
          audio: true,
          visualAid: 'parent_approval'
        }
      ],
      requiresSignature: false,
      requiresParentalConsent: true,
      minimumAge: 4,
      maximumAge: 12,
      presentationFormat: 'interactive_story'
    });

    // Senior Terms
    this.terms.set('senior', {
      id: 'tos_senior_v1',
      version: '1.0',
      effectiveDate: '2024-01-01',
      sections: [
        {
          title: 'Welcome to Your Companion Service',
          content: `
We're happy to have you here. This agreement explains:

• How we help you stay connected and healthy
• What information we need from you
• How we keep your information safe
• Your rights and choices

Everything is designed to be simple and clear.
          `,
          readingLevel: 'clear',
          fontSize: 'large',
          audioAvailable: true
        },
        {
          title: 'Our Services',
          content: `
We provide:

• A friendly AI companion to talk with
• Medication reminders
• Health monitoring assistance
• Connection to family and friends
• Emergency help when needed

You can use as much or as little as you want.
          `,
          readingLevel: 'clear',
          fontSize: 'large'
        },
        {
          title: 'Your Privacy',
          content: `
Your privacy is very important:

• We only collect health information to help you
• Your conversations are private
• We never sell your information
• You can delete your data anytime
• Family can only see what you allow
          `,
          readingLevel: 'clear',
          fontSize: 'large',
          emphasis: ['never sell', 'private']
        },
        {
          title: 'Health Information',
          content: `
About your health data:

• We help track medications and appointments
• Health data is shared with doctors only if you agree
• Emergency contacts are notified in emergencies
• You control who sees what
          `,
          readingLevel: 'clear',
          fontSize: 'large'
        },
        {
          title: 'Getting Help',
          content: `
If you need help:

• Ask your AI companion anytime
• Call our support line: 1-800-SOULFRA
• Your family can help with settings
• Emergency button contacts help immediately
          `,
          readingLevel: 'clear',
          fontSize: 'large',
          visualAid: 'help_contacts'
        }
      ],
      requiresSignature: true,
      minimumAge: 55,
      supportContact: true,
      largeprint: true,
      audioVersion: true
    });

    // General Terms (Simplified Universal)
    this.terms.set('general', {
      id: 'tos_general_v1',
      version: '1.0',
      effectiveDate: '2024-01-01',
      sections: [
        {
          title: 'Welcome to Soulfra',
          content: `
By using Soulfra, you agree to these terms. We've made them as simple as possible.

• Use Soulfra responsibly and legally
• Your content belongs to you
• We protect your privacy
• We're here to help
          `,
          readingLevel: 'plain'
        },
        {
          title: 'Acceptable Use',
          content: `
Please:
✓ Be respectful
✓ Protect your account
✓ Follow the law
✓ Report problems

Please don't:
✗ Harm others
✗ Break things
✗ Steal data
✗ Spam anyone
          `,
          readingLevel: 'plain',
          visualAid: 'do_dont_list'
        }
      ],
      requiresSignature: true,
      minimumAge: 13
    });
  }

  // Get appropriate terms for user
  getTermsForUser(userProfile) {
    let termsType = 'general';
    
    if (userProfile.accountType) {
      termsType = userProfile.accountType;
    } else if (userProfile.age < 13) {
      termsType = 'kids';
    } else if (userProfile.age >= 55) {
      termsType = 'senior';
    } else if (userProfile.isDeveloper) {
      termsType = 'developer';
    } else if (userProfile.familyAccount) {
      termsType = 'family';
    }

    const terms = this.terms.get(termsType);
    
    // Apply accessibility settings
    if (userProfile.accessibility) {
      return this.applyAccessibilitySettings(terms, userProfile.accessibility);
    }

    return terms;
  }

  applyAccessibilitySettings(terms, settings) {
    const modifiedTerms = { ...terms };
    
    if (settings.fontSize) {
      modifiedTerms.fontSize = settings.fontSize;
    }
    
    if (settings.highContrast) {
      modifiedTerms.contrast = 'high';
    }
    
    if (settings.screenReader) {
      modifiedTerms.screenReaderOptimized = true;
    }
    
    if (settings.simplifiedLanguage) {
      modifiedTerms.sections = this.simplifyLanguage(terms.sections);
    }
    
    return modifiedTerms;
  }

  simplifyLanguage(sections) {
    // This would use NLP to simplify complex terms
    return sections.map(section => ({
      ...section,
      content: this.simplifyText(section.content),
      readingLevel: 'simple'
    }));
  }

  simplifyText(text) {
    // Simplified implementation - would use NLP in production
    const replacements = {
      'intellectual property': 'your creations',
      'indemnification': 'protecting us from lawsuits',
      'liability': 'responsibility',
      'warranties': 'promises',
      'non-exclusive': 'others can use it too',
      'transferable': 'can be given to others'
    };
    
    let simplified = text;
    Object.entries(replacements).forEach(([complex, simple]) => {
      simplified = simplified.replace(new RegExp(complex, 'gi'), simple);
    });
    
    return simplified;
  }

  // Record acceptance
  recordAcceptance(userId, termsId, acceptanceData) {
    const acceptance = {
      id: `accept_${crypto.randomBytes(8).toString('hex')}`,
      userId,
      termsId,
      version: this.terms.get(termsId)?.version,
      timestamp: new Date().toISOString(),
      ipAddress: acceptanceData.ipAddress,
      userAgent: acceptanceData.userAgent,
      method: acceptanceData.method, // 'click', 'signature', 'verbal', 'guardian'
      guardianId: acceptanceData.guardianId || null,
      additionalData: acceptanceData.additional || {}
    };

    const userAcceptances = this.acceptances.get(userId) || [];
    userAcceptances.push(acceptance);
    this.acceptances.set(userId, userAcceptances);

    return acceptance;
  }

  // Check if user has accepted current terms
  hasAcceptedCurrentTerms(userId, termsType) {
    const currentTerms = this.terms.get(termsType);
    if (!currentTerms) return false;

    const userAcceptances = this.acceptances.get(userId) || [];
    return userAcceptances.some(acceptance => 
      acceptance.termsId === currentTerms.id && 
      acceptance.version === currentTerms.version
    );
  }

  // Generate kid-friendly terms presentation
  generateKidsPresentation(terms) {
    return {
      type: 'interactive_story',
      pages: terms.sections.map((section, index) => ({
        pageNumber: index + 1,
        title: section.title,
        content: section.content,
        animation: this.getKidsAnimation(section.title),
        narration: {
          text: section.content,
          voice: 'friendly_character',
          speed: 'slow'
        },
        interaction: {
          type: 'tap_to_continue',
          confirmationRequired: section.title.includes('Safety')
        }
      })),
      completion: {
        celebration: 'confetti',
        message: 'Great job! You learned all the rules!',
        parentNotification: true
      }
    };
  }

  getKidsAnimation(title) {
    const animations = {
      'Welcome': 'waving_character',
      'Safety': 'shield_hero',
      'Fun': 'dancing_animals',
      'Parent': 'family_hug'
    };
    
    const key = Object.keys(animations).find(k => title.includes(k));
    return animations[key] || 'friendly_character';
  }

  // Generate senior-friendly presentation
  generateSeniorPresentation(terms) {
    return {
      type: 'guided_walkthrough',
      features: {
        fontSize: 'extra-large',
        contrast: 'high',
        pacing: 'user-controlled',
        audio: 'available-on-demand',
        help: 'always-visible'
      },
      sections: terms.sections.map(section => ({
        title: section.title,
        content: this.formatForSeniors(section.content),
        summary: this.generateSummary(section.content),
        audio: {
          available: true,
          autoplay: false,
          speed: 'adjustable'
        },
        navigation: {
          previous: 'large-button',
          next: 'large-button',
          help: 'prominent'
        }
      })),
      assistance: {
        phone: '1-800-SOULFRA',
        chat: 'simplified-interface',
        family: 'one-click-contact'
      }
    };
  }

  formatForSeniors(content) {
    // Add extra spacing and clear formatting
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .join('\n\n'); // Double spacing
  }

  generateSummary(content) {
    // Extract key points
    const bullets = content.match(/•[^\n]+/g) || [];
    if (bullets.length > 0) {
      return `Key points: ${bullets.slice(0, 3).join(' ')}}`;
    }
    
    // Extract first sentence if no bullets
    const firstSentence = content.match(/[^.!?]+[.!?]/)?.[0];
    return firstSentence || 'Please read this section carefully';
  }

  // Version management
  updateTermsVersion(termsType, updates) {
    const currentTerms = this.terms.get(termsType);
    if (!currentTerms) throw new Error('Terms type not found');

    const previousVersion = {
      ...currentTerms,
      supersededDate: new Date().toISOString()
    };

    // Store previous version
    const versionHistory = this.versions.get(termsType) || [];
    versionHistory.push(previousVersion);
    this.versions.set(termsType, versionHistory);

    // Update current terms
    const newVersion = {
      ...currentTerms,
      ...updates,
      id: `${currentTerms.id}_v${versionHistory.length + 2}`,
      version: `${parseInt(currentTerms.version) + 1}.0`,
      effectiveDate: new Date().toISOString(),
      changes: this.summarizeChanges(currentTerms, updates)
    };

    this.terms.set(termsType, newVersion);
    
    // Notify users who need to re-accept
    this.notifyUsersOfUpdate(termsType, newVersion.changes);
    
    return newVersion;
  }

  summarizeChanges(oldTerms, updates) {
    const changes = [];
    
    // Compare sections
    if (updates.sections) {
      updates.sections.forEach((newSection, index) => {
        const oldSection = oldTerms.sections[index];
        if (!oldSection || oldSection.content !== newSection.content) {
          changes.push({
            type: 'section_update',
            section: newSection.title,
            description: 'Content updated for clarity'
          });
        }
      });
    }
    
    return changes;
  }

  notifyUsersOfUpdate(termsType, changes) {
    // This would trigger notifications to affected users
    const notification = {
      type: 'terms_update',
      termsType,
      changes,
      action: 'review_required',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
    
    // Emit event for notification system
    return notification;
  }

  // Export terms for legal compliance
  exportTermsForCompliance(termsType, format = 'pdf') {
    const terms = this.terms.get(termsType);
    if (!terms) throw new Error('Terms type not found');

    const exportData = {
      terms,
      metadata: {
        exported: new Date().toISOString(),
        format,
        purpose: 'compliance',
        includesVersionHistory: true
      },
      versionHistory: this.versions.get(termsType) || [],
      acceptanceStats: this.getAcceptanceStats(termsType)
    };

    return exportData;
  }

  getAcceptanceStats(termsType) {
    let totalAcceptances = 0;
    let currentVersionAcceptances = 0;
    const currentVersion = this.terms.get(termsType)?.version;

    for (const [userId, acceptances] of this.acceptances) {
      const relevantAcceptances = acceptances.filter(a => 
        a.termsId.includes(termsType)
      );
      
      totalAcceptances += relevantAcceptances.length;
      currentVersionAcceptances += relevantAcceptances.filter(a => 
        a.version === currentVersion
      ).length;
    }

    return {
      totalAcceptances,
      currentVersionAcceptances,
      acceptanceRate: totalAcceptances > 0 ? 
        (currentVersionAcceptances / totalAcceptances * 100).toFixed(2) + '%' : '0%'
    };
  }
}

module.exports = UniversalTermsOfService;