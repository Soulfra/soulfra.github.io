// SafetyGuardian.js - Child protection features

const crypto = require('crypto');
const EventEmitter = require('events');

class SafetyGuardian extends EventEmitter {
  constructor() {
    super();
    this.profiles = new Map();
    this.sessions = new Map();
    this.alerts = new Map();
    this.contentFilters = new Map();
    this.interactionLogs = new Map();
    this.trustedContacts = new Map();
    this.initializeSafetyProtocols();
  }

  // Safety Profile Creation
  createSafetyProfile(childId, parentId, settings) {
    const profileId = `safety_${crypto.randomBytes(8).toString('hex')}`;
    const profile = {
      id: profileId,
      childId,
      parentId,
      created: new Date().toISOString(),
      settings: {
        age: settings.age,
        maturityLevel: this.calculateMaturityLevel(settings.age),
        strictnessLevel: settings.strictnessLevel || 'balanced',
        contentFiltering: {
          enabled: true,
          level: this.getContentFilterLevel(settings.age),
          customBlockedWords: settings.blockedWords || [],
          allowedDomains: settings.allowedDomains || []
        },
        interactionRules: {
          chatEnabled: settings.age >= 8,
          requireParentApproval: settings.age < 13,
          allowFriendRequests: false,
          maxDailyMessages: settings.age < 10 ? 20 : 50
        },
        privacySettings: {
          shareLocation: false,
          shareRealName: false,
          shareAge: false,
          sharePhoto: false,
          publicProfile: false
        },
        timeRestrictions: {
          dailyLimit: this.getAgeDailyLimit(settings.age),
          schoolHours: settings.schoolHours || { start: '08:00', end: '15:00' },
          bedtime: this.getAgeBedtime(settings.age),
          weekendBonus: 30 // extra minutes on weekends
        },
        emergencyProtocols: {
          panicButton: true,
          autoAlert: true,
          keywords: ['help', 'scared', 'hurt', 'emergency', 'stranger'],
          parentNotificationDelay: 0 // immediate
        }
      },
      statistics: {
        totalPlaytime: 0,
        sessionsToday: 0,
        alertsTriggered: 0,
        blockedContent: 0
      }
    };

    this.profiles.set(profileId, profile);
    this.emit('profileCreated', profile);
    return profile;
  }

  calculateMaturityLevel(age) {
    if (age < 6) return 'early-childhood';
    if (age < 9) return 'elementary';
    if (age < 13) return 'pre-teen';
    if (age < 16) return 'teen';
    return 'young-adult';
  }

  getContentFilterLevel(age) {
    if (age < 7) return 'very-strict';
    if (age < 10) return 'strict';
    if (age < 13) return 'moderate';
    if (age < 16) return 'light';
    return 'minimal';
  }

  getAgeDailyLimit(age) {
    if (age < 6) return 30;
    if (age < 8) return 45;
    if (age < 10) return 60;
    if (age < 13) return 90;
    if (age < 16) return 120;
    return 180;
  }

  getAgeBedtime(age) {
    if (age < 7) return { hour: 19, minute: 0 };
    if (age < 10) return { hour: 20, minute: 0 };
    if (age < 13) return { hour: 21, minute: 0 };
    if (age < 16) return { hour: 22, minute: 0 };
    return { hour: 23, minute: 0 };
  }

  // Session Management
  startSession(childId, profileId) {
    const profile = this.profiles.get(profileId);
    if (!profile) throw new Error('Safety profile not found');

    // Check time restrictions
    const timeCheck = this.checkTimeRestrictions(profile);
    if (!timeCheck.allowed) {
      this.emit('sessionBlocked', { childId, reason: timeCheck.reason });
      return null;
    }

    const sessionId = `session_${crypto.randomBytes(8).toString('hex')}`;
    const session = {
      id: sessionId,
      childId,
      profileId,
      startTime: new Date(),
      endTime: null,
      activities: [],
      interactions: [],
      contentAccessed: [],
      alertsTriggered: [],
      status: 'active'
    };

    this.sessions.set(sessionId, session);
    profile.statistics.sessionsToday++;
    
    // Set automatic session end based on time limit
    const remainingTime = this.getRemainingPlaytime(profile);
    if (remainingTime > 0) {
      setTimeout(() => {
        this.endSession(sessionId, 'time_limit_reached');
      }, remainingTime * 60 * 1000);
    }

    this.emit('sessionStarted', session);
    return session;
  }

  checkTimeRestrictions(profile) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    // Check bedtime
    const bedtime = profile.settings.timeRestrictions.bedtime;
    const bedtimeMinutes = bedtime.hour * 60 + bedtime.minute;
    
    if (currentTime >= bedtimeMinutes || currentTime < 360) { // 6 AM
      return { allowed: false, reason: 'past_bedtime' };
    }

    // Check school hours (weekdays only)
    if (now.getDay() >= 1 && now.getDay() <= 5) {
      const schoolStart = this.timeToMinutes(profile.settings.timeRestrictions.schoolHours.start);
      const schoolEnd = this.timeToMinutes(profile.settings.timeRestrictions.schoolHours.end);
      
      if (currentTime >= schoolStart && currentTime <= schoolEnd) {
        return { allowed: false, reason: 'school_hours' };
      }
    }

    // Check daily limit
    const todayPlaytime = this.getTodayPlaytime(profile.id);
    const limit = profile.settings.timeRestrictions.dailyLimit;
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const effectiveLimit = isWeekend ? limit + profile.settings.timeRestrictions.weekendBonus : limit;

    if (todayPlaytime >= effectiveLimit) {
      return { allowed: false, reason: 'daily_limit_reached' };
    }

    return { allowed: true };
  }

  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  getRemainingPlaytime(profile) {
    const todayPlaytime = this.getTodayPlaytime(profile.id);
    const limit = profile.settings.timeRestrictions.dailyLimit;
    return Math.max(0, limit - todayPlaytime);
  }

  getTodayPlaytime(profileId) {
    const today = new Date().toDateString();
    const sessions = Array.from(this.sessions.values())
      .filter(s => s.profileId === profileId && new Date(s.startTime).toDateString() === today);
    
    return sessions.reduce((total, session) => {
      const end = session.endTime || new Date();
      const duration = (end - session.startTime) / 1000 / 60; // minutes
      return total + duration;
    }, 0);
  }

  endSession(sessionId, reason = 'normal') {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'active') return;

    session.endTime = new Date();
    session.status = 'ended';
    session.endReason = reason;

    const duration = (session.endTime - session.startTime) / 1000 / 60;
    const profile = this.profiles.get(session.profileId);
    if (profile) {
      profile.statistics.totalPlaytime += duration;
    }

    this.emit('sessionEnded', { session, reason });
    return session;
  }

  // Content Filtering
  filterContent(profileId, content, contentType = 'text') {
    const profile = this.profiles.get(profileId);
    if (!profile) return { allowed: false, filtered: null };

    const filters = this.getContentFilters(profile.settings.contentFiltering.level);
    let filtered = content;
    let blocked = false;
    const violations = [];

    // Apply text filters
    if (contentType === 'text' || contentType === 'chat') {
      // Check blocked words
      const allBlockedWords = [
        ...filters.blockedWords,
        ...profile.settings.contentFiltering.customBlockedWords
      ];

      allBlockedWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        if (regex.test(content)) {
          violations.push({ type: 'blocked_word', word });
          filtered = filtered.replace(regex, '*'.repeat(word.length));
        }
      });

      // Check for personal information patterns
      const personalInfoPatterns = [
        { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, type: 'phone_number' },
        { pattern: /\b\d{5}(?:-\d{4})?\b/g, type: 'zip_code' },
        { pattern: /\S+@\S+\.\S+/g, type: 'email' },
        { pattern: /\b\d{1,5}\s+\w+\s+(street|st|avenue|ave|road|rd|boulevard|blvd)\b/gi, type: 'address' }
      ];

      personalInfoPatterns.forEach(({ pattern, type }) => {
        if (pattern.test(content)) {
          violations.push({ type: 'personal_info', infoType: type });
          filtered = filtered.replace(pattern, '[BLOCKED]');
          blocked = true;
        }
      });

      // Check for inappropriate topics
      filters.inappropriateTopics.forEach(topic => {
        if (content.toLowerCase().includes(topic)) {
          violations.push({ type: 'inappropriate_topic', topic });
          blocked = true;
        }
      });
    }

    // Apply image filters
    if (contentType === 'image') {
      // In production, this would use image recognition API
      // For now, block all external images for young children
      if (profile.settings.age < 10) {
        blocked = true;
        violations.push({ type: 'external_image' });
      }
    }

    // Log the filtering event
    if (violations.length > 0) {
      profile.statistics.blockedContent++;
      this.logContentViolation(profileId, content, violations);
    }

    return {
      allowed: !blocked,
      filtered: blocked ? null : filtered,
      violations
    };
  }

  getContentFilters(level) {
    const filters = {
      'very-strict': {
        blockedWords: [
          'stupid', 'dumb', 'hate', 'kill', 'die', 'death', 'blood',
          'violence', 'fight', 'war', 'gun', 'knife', 'drug', 'alcohol',
          'scary', 'monster', 'ghost', 'demon', 'hell', 'damn'
        ],
        inappropriateTopics: ['violence', 'romance', 'horror', 'adult'],
        maxMessageLength: 100
      },
      'strict': {
        blockedWords: [
          'kill', 'die', 'death', 'blood', 'violence', 'drug', 'alcohol',
          'gun', 'knife', 'hell', 'damn', 'sexy'
        ],
        inappropriateTopics: ['violence', 'adult', 'extreme'],
        maxMessageLength: 200
      },
      'moderate': {
        blockedWords: [
          'drug', 'alcohol', 'violence', 'sexual', 'suicide'
        ],
        inappropriateTopics: ['adult', 'extreme'],
        maxMessageLength: 500
      },
      'light': {
        blockedWords: ['sexual', 'suicide', 'explicit'],
        inappropriateTopics: ['explicit'],
        maxMessageLength: 1000
      }
    };

    return filters[level] || filters.moderate;
  }

  // Interaction Monitoring
  monitorInteraction(sessionId, interaction) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const profile = this.profiles.get(session.profileId);
    if (!profile) return;

    // Check interaction limits
    if (interaction.type === 'chat') {
      const todayMessages = session.interactions.filter(
        i => i.type === 'chat' && new Date(i.timestamp).toDateString() === new Date().toDateString()
      ).length;

      if (todayMessages >= profile.settings.interactionRules.maxDailyMessages) {
        this.emit('interactionBlocked', {
          sessionId,
          reason: 'daily_message_limit',
          interaction
        });
        return false;
      }
    }

    // Filter content
    if (interaction.content) {
      const filtered = this.filterContent(session.profileId, interaction.content, 'chat');
      if (!filtered.allowed) {
        this.triggerAlert(session.profileId, 'content_violation', {
          interaction,
          violations: filtered.violations
        });
        return false;
      }
      interaction.content = filtered.filtered;
    }

    // Check for emergency keywords
    if (interaction.content) {
      const emergencyKeywords = profile.settings.emergencyProtocols.keywords;
      const contentLower = interaction.content.toLowerCase();
      const triggered = emergencyKeywords.some(keyword => contentLower.includes(keyword));
      
      if (triggered) {
        this.triggerEmergencyProtocol(session.profileId, interaction);
      }
    }

    // Log interaction
    interaction.timestamp = new Date().toISOString();
    session.interactions.push(interaction);

    return true;
  }

  // Alert System
  triggerAlert(profileId, alertType, details) {
    const profile = this.profiles.get(profileId);
    if (!profile) return;

    const alert = {
      id: `alert_${crypto.randomBytes(8).toString('hex')}`,
      profileId,
      parentId: profile.parentId,
      type: alertType,
      severity: this.calculateAlertSeverity(alertType, details),
      details,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };

    this.alerts.set(alert.id, alert);
    profile.statistics.alertsTriggered++;

    // Notify parent based on severity
    if (alert.severity === 'critical') {
      this.notifyParentImmediately(alert);
    } else if (alert.severity === 'high') {
      this.notifyParentDelayed(alert, 60000); // 1 minute delay
    } else {
      this.addToParentDigest(alert);
    }

    this.emit('alertTriggered', alert);
    return alert;
  }

  calculateAlertSeverity(alertType, details) {
    const severityMap = {
      'emergency_protocol': 'critical',
      'stranger_contact': 'critical',
      'personal_info_shared': 'high',
      'content_violation': 'medium',
      'time_limit_warning': 'low',
      'friend_request': 'low'
    };

    return severityMap[alertType] || 'medium';
  }

  triggerEmergencyProtocol(profileId, trigger) {
    const profile = this.profiles.get(profileId);
    if (!profile) return;

    const emergency = {
      id: `emergency_${crypto.randomBytes(8).toString('hex')}`,
      profileId,
      trigger,
      timestamp: new Date().toISOString(),
      status: 'active',
      parentNotified: false,
      actions: []
    };

    // Immediate actions
    emergency.actions.push({
      type: 'session_paused',
      timestamp: new Date().toISOString()
    });

    // Notify parent immediately
    this.notifyParentImmediately({
      type: 'emergency_protocol',
      severity: 'critical',
      emergency
    });

    // Log location if available
    emergency.actions.push({
      type: 'location_logged',
      timestamp: new Date().toISOString()
    });

    this.emit('emergencyProtocolActivated', emergency);
    return emergency;
  }

  // Parent Communication
  notifyParentImmediately(alert) {
    this.emit('parentNotificationUrgent', {
      alert,
      channel: 'all', // SMS, email, push, in-app
      priority: 'critical'
    });
  }

  notifyParentDelayed(alert, delay) {
    setTimeout(() => {
      this.emit('parentNotification', {
        alert,
        channel: 'push',
        priority: 'high'
      });
    }, delay);
  }

  addToParentDigest(alert) {
    // Collected and sent as daily summary
    const digestKey = `digest_${alert.parentId}_${new Date().toDateString()}`;
    if (!this.parentDigests) this.parentDigests = new Map();
    
    if (!this.parentDigests.has(digestKey)) {
      this.parentDigests.set(digestKey, []);
    }
    
    this.parentDigests.get(digestKey).push(alert);
  }

  // Reporting
  generateSafetyReport(profileId, period = 'week') {
    const profile = this.profiles.get(profileId);
    if (!profile) return null;

    const sessions = Array.from(this.sessions.values())
      .filter(s => s.profileId === profileId);
    
    const alerts = Array.from(this.alerts.values())
      .filter(a => a.profileId === profileId);

    return {
      profileId,
      period,
      generated: new Date().toISOString(),
      summary: {
        totalSessions: sessions.length,
        totalPlaytime: profile.statistics.totalPlaytime,
        alertsTriggered: alerts.length,
        contentBlocked: profile.statistics.blockedContent
      },
      alerts: alerts.map(a => ({
        type: a.type,
        severity: a.severity,
        timestamp: a.timestamp,
        details: a.details
      })),
      recommendations: this.generateSafetyRecommendations(profile, sessions, alerts)
    };
  }

  generateSafetyRecommendations(profile, sessions, alerts) {
    const recommendations = [];

    // Check if too many alerts
    if (alerts.length > 10) {
      recommendations.push({
        type: 'increase_monitoring',
        reason: 'High number of safety alerts',
        action: 'Consider increasing content filtering level'
      });
    }

    // Check playtime patterns
    const avgSessionLength = sessions.reduce((sum, s) => {
      const duration = (s.endTime || new Date()) - s.startTime;
      return sum + duration;
    }, 0) / sessions.length / 1000 / 60; // minutes

    if (avgSessionLength > 60) {
      recommendations.push({
        type: 'reduce_session_length',
        reason: 'Long average session duration',
        action: 'Consider setting shorter session limits'
      });
    }

    return recommendations;
  }

  // Trusted Contacts
  addTrustedContact(profileId, contact) {
    const contacts = this.trustedContacts.get(profileId) || [];
    contacts.push({
      id: `trusted_${crypto.randomBytes(8).toString('hex')}`,
      name: contact.name,
      relationship: contact.relationship,
      verified: false,
      added: new Date().toISOString()
    });
    
    this.trustedContacts.set(profileId, contacts);
    return contacts;
  }

  verifyContact(profileId, contactId, verificationCode) {
    const contacts = this.trustedContacts.get(profileId) || [];
    const contact = contacts.find(c => c.id === contactId);
    
    if (contact && this.validateVerificationCode(verificationCode)) {
      contact.verified = true;
      contact.verifiedAt = new Date().toISOString();
      return true;
    }
    
    return false;
  }

  validateVerificationCode(code) {
    // In production, this would validate against sent codes
    return code.length === 6 && /^\d+$/.test(code);
  }

  logContentViolation(profileId, content, violations) {
    const log = {
      profileId,
      timestamp: new Date().toISOString(),
      content: content.substring(0, 100), // Store only preview
      violations,
      handled: true
    };

    if (!this.violationLogs) this.violationLogs = [];
    this.violationLogs.push(log);

    // Keep only last 1000 violations
    if (this.violationLogs.length > 1000) {
      this.violationLogs = this.violationLogs.slice(-1000);
    }
  }

  // Initialize default safety protocols
  initializeSafetyProtocols() {
    // Set up periodic checks
    setInterval(() => {
      this.checkActiveSessions();
    }, 60000); // Every minute

    // Set up daily digest sending
    setInterval(() => {
      this.sendDailyDigests();
    }, 86400000); // Every 24 hours
  }

  checkActiveSessions() {
    const now = new Date();
    
    Array.from(this.sessions.values())
      .filter(s => s.status === 'active')
      .forEach(session => {
        const profile = this.profiles.get(session.profileId);
        if (!profile) return;

        // Check if past bedtime
        const bedtime = profile.settings.timeRestrictions.bedtime;
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        if (currentHour === bedtime.hour && currentMinute >= bedtime.minute) {
          this.endSession(session.id, 'bedtime_reached');
          this.triggerAlert(session.profileId, 'bedtime_enforcement', {
            sessionId: session.id,
            bedtime: `${bedtime.hour}:${bedtime.minute.toString().padStart(2, '0')}`
          });
        }

        // Send warnings 5 minutes before limits
        const remaining = this.getRemainingPlaytime(profile);
        if (remaining === 5) {
          this.triggerAlert(session.profileId, 'time_limit_warning', {
            remaining: 5,
            sessionId: session.id
          });
        }
      });
  }

  sendDailyDigests() {
    if (!this.parentDigests) return;

    const today = new Date().toDateString();
    Array.from(this.parentDigests.entries())
      .filter(([key]) => key.includes(today))
      .forEach(([key, alerts]) => {
        const parentId = key.split('_')[1];
        this.emit('parentDigest', {
          parentId,
          alerts,
          date: today
        });
      });

    // Clear sent digests
    Array.from(this.parentDigests.keys())
      .filter(key => key.includes(today))
      .forEach(key => this.parentDigests.delete(key));
  }
}

module.exports = SafetyGuardian;