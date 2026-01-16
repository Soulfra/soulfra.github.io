// ParentalControls.js - Safety and monitoring features for families

const crypto = require('crypto');
const EventEmitter = require('events');

class ParentalControls extends EventEmitter {
  constructor() {
    super();
    this.controls = new Map();
    this.activityLogs = new Map();
    this.contentFilters = new Map();
    this.timeRestrictions = new Map();
    this.approvalQueues = new Map();
    this.emergencyContacts = new Map();
  }

  // Profile Management
  createChildProfile(parentId, childInfo) {
    const profileId = `child_${crypto.randomBytes(8).toString('hex')}`;
    const profile = {
      id: profileId,
      parentId,
      name: childInfo.name,
      age: childInfo.age,
      birthDate: childInfo.birthDate,
      created: new Date().toISOString(),
      settings: this.getAgeAppropriateSettings(childInfo.age),
      restrictions: {
        screenTime: this.getDefaultScreenTime(childInfo.age),
        bedtime: this.getDefaultBedtime(childInfo.age),
        contentRating: this.getContentRating(childInfo.age),
        allowedDomains: [],
        blockedContent: []
      },
      monitoring: {
        trackLocation: false,
        trackActivity: true,
        alertOnKeywords: ['help', 'scared', 'hurt', 'emergency'],
        realTimeAlerts: true
      }
    };

    this.controls.set(profileId, profile);
    this.activityLogs.set(profileId, []);
    this.emit('profileCreated', profile);
    
    return profile;
  }

  // Age-Appropriate Settings
  getAgeAppropriateSettings(age) {
    if (age < 7) {
      return {
        contentLevel: 'preschool',
        interactionMode: 'guided',
        voiceOnly: true,
        requiresParentPresence: true,
        educationalFocus: 'high',
        maxSessionLength: 30 // minutes
      };
    } else if (age < 13) {
      return {
        contentLevel: 'elementary',
        interactionMode: 'supervised',
        voiceOnly: false,
        requiresParentPresence: false,
        educationalFocus: 'medium',
        maxSessionLength: 60
      };
    } else if (age < 18) {
      return {
        contentLevel: 'teen',
        interactionMode: 'monitored',
        voiceOnly: false,
        requiresParentPresence: false,
        educationalFocus: 'balanced',
        maxSessionLength: 120
      };
    }
    return {
      contentLevel: 'general',
      interactionMode: 'independent',
      voiceOnly: false,
      requiresParentPresence: false,
      educationalFocus: 'optional',
      maxSessionLength: null
    };
  }

  getDefaultScreenTime(age) {
    const limits = {
      weekday: age < 7 ? 60 : age < 13 ? 90 : age < 18 ? 180 : null,
      weekend: age < 7 ? 90 : age < 13 ? 120 : age < 18 ? 240 : null,
      educational: age < 13 ? 120 : null // Extra time for educational content
    };
    return limits;
  }

  getDefaultBedtime(age) {
    if (age < 7) return { hour: 19, minute: 30 };
    if (age < 10) return { hour: 20, minute: 30 };
    if (age < 13) return { hour: 21, minute: 0 };
    if (age < 16) return { hour: 22, minute: 0 };
    return { hour: 23, minute: 0 };
  }

  getContentRating(age) {
    if (age < 7) return 'EC'; // Early Childhood
    if (age < 10) return 'E'; // Everyone
    if (age < 13) return 'E10+'; // Everyone 10+
    if (age < 17) return 'T'; // Teen
    return 'M'; // Mature
  }

  // Time Management
  checkTimeRestriction(profileId) {
    const profile = this.controls.get(profileId);
    if (!profile) return { allowed: false, reason: 'Profile not found' };

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const bedtime = profile.restrictions.bedtime;
    const bedtimeMinutes = bedtime.hour * 60 + bedtime.minute;

    // Check bedtime
    if (currentTime >= bedtimeMinutes || currentTime < 360) { // 6 AM
      return { allowed: false, reason: 'Past bedtime' };
    }

    // Check daily screen time
    const todayUsage = this.getScreenTimeToday(profileId);
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const limit = isWeekend ? 
      profile.restrictions.screenTime.weekend : 
      profile.restrictions.screenTime.weekday;

    if (limit && todayUsage >= limit) {
      return { 
        allowed: false, 
        reason: 'Daily screen time limit reached',
        usedMinutes: todayUsage,
        limitMinutes: limit
      };
    }

    return { 
      allowed: true, 
      remainingMinutes: limit ? limit - todayUsage : null 
    };
  }

  getScreenTimeToday(profileId) {
    const logs = this.activityLogs.get(profileId) || [];
    const today = new Date().toDateString();
    
    return logs
      .filter(log => new Date(log.timestamp).toDateString() === today)
      .reduce((total, log) => total + (log.duration || 0), 0);
  }

  // Content Filtering
  filterContent(profileId, content) {
    const profile = this.controls.get(profileId);
    if (!profile) return { allowed: false, filtered: null };

    const filters = this.getContentFilters(profile.settings.contentLevel);
    let filtered = content;
    let blocked = false;

    // Check for blocked keywords
    filters.blockedWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(content)) {
        blocked = true;
        filtered = filtered.replace(regex, '[blocked]');
      }
    });

    // Check for inappropriate content patterns
    filters.patterns.forEach(pattern => {
      if (pattern.test(content)) {
        blocked = true;
        filtered = '[Content blocked by safety filter]';
      }
    });

    return {
      allowed: !blocked,
      filtered: filtered,
      reason: blocked ? 'Content contains inappropriate material' : null
    };
  }

  getContentFilters(level) {
    const filters = {
      preschool: {
        blockedWords: ['violence', 'scary', 'death', 'weapon', 'drug'],
        patterns: [/\b(kill|die|hurt|fight)\b/gi],
        allowedTopics: ['animals', 'colors', 'numbers', 'family', 'friends']
      },
      elementary: {
        blockedWords: ['violence', 'drug', 'alcohol', 'explicit'],
        patterns: [/\b(suicide|self-harm|abuse)\b/gi],
        allowedTopics: ['education', 'science', 'history', 'games', 'sports']
      },
      teen: {
        blockedWords: ['explicit', 'graphic'],
        patterns: [/\b(self-harm|suicide)\b/gi],
        allowedTopics: ['all']
      }
    };

    return filters[level] || filters.elementary;
  }

  // Activity Monitoring
  logActivity(profileId, activity) {
    const log = {
      id: `log_${crypto.randomBytes(8).toString('hex')}`,
      profileId,
      timestamp: new Date().toISOString(),
      type: activity.type,
      content: activity.content,
      duration: activity.duration,
      location: activity.location,
      flagged: false
    };

    // Check for alert keywords
    const profile = this.controls.get(profileId);
    if (profile && profile.monitoring.alertOnKeywords) {
      const content = JSON.stringify(activity.content).toLowerCase();
      const triggered = profile.monitoring.alertOnKeywords.some(keyword => 
        content.includes(keyword.toLowerCase())
      );
      
      if (triggered) {
        log.flagged = true;
        this.sendParentAlert(profile.parentId, {
          type: 'keyword_alert',
          childId: profileId,
          activity: log,
          message: 'Alert keyword detected in child activity'
        });
      }
    }

    const logs = this.activityLogs.get(profileId) || [];
    logs.push(log);
    this.activityLogs.set(profileId, logs);

    return log;
  }

  // Approval System
  requestApproval(profileId, request) {
    const profile = this.controls.get(profileId);
    if (!profile) throw new Error('Profile not found');

    const approvalRequest = {
      id: `approval_${crypto.randomBytes(8).toString('hex')}`,
      profileId,
      parentId: profile.parentId,
      type: request.type, // 'content', 'app', 'friend', 'purchase'
      details: request.details,
      timestamp: new Date().toISOString(),
      status: 'pending',
      parentResponse: null
    };

    const queue = this.approvalQueues.get(profile.parentId) || [];
    queue.push(approvalRequest);
    this.approvalQueues.set(profile.parentId, queue);

    this.sendParentAlert(profile.parentId, {
      type: 'approval_request',
      request: approvalRequest
    });

    return approvalRequest;
  }

  processApproval(approvalId, decision, parentId) {
    const queue = this.approvalQueues.get(parentId) || [];
    const request = queue.find(r => r.id === approvalId);
    
    if (!request) throw new Error('Approval request not found');

    request.status = decision; // 'approved' or 'denied'
    request.parentResponse = {
      decision,
      timestamp: new Date().toISOString(),
      parentId
    };

    this.emit('approvalProcessed', request);
    return request;
  }

  // Emergency Features
  addEmergencyContact(profileId, contact) {
    const contacts = this.emergencyContacts.get(profileId) || [];
    contacts.push({
      id: `contact_${crypto.randomBytes(8).toString('hex')}`,
      name: contact.name,
      relationship: contact.relationship,
      phone: contact.phone,
      email: contact.email,
      priority: contact.priority || contacts.length + 1
    });
    
    this.emergencyContacts.set(profileId, contacts);
    return contacts;
  }

  triggerEmergency(profileId, type = 'general') {
    const profile = this.controls.get(profileId);
    if (!profile) throw new Error('Profile not found');

    const emergency = {
      id: `emergency_${crypto.randomBytes(8).toString('hex')}`,
      profileId,
      type,
      timestamp: new Date().toISOString(),
      location: 'Location services required',
      status: 'active'
    };

    // Alert parent immediately
    this.sendParentAlert(profile.parentId, {
      type: 'emergency',
      priority: 'critical',
      emergency
    });

    // Alert emergency contacts
    const contacts = this.emergencyContacts.get(profileId) || [];
    contacts.forEach(contact => {
      this.emit('emergencyContactAlert', {
        contact,
        emergency
      });
    });

    return emergency;
  }

  // Parent Notifications
  sendParentAlert(parentId, alert) {
    this.emit('parentAlert', {
      parentId,
      alert,
      timestamp: new Date().toISOString(),
      requiresAction: alert.type === 'approval_request' || alert.type === 'emergency'
    });
  }

  // Reports and Analytics
  generateActivityReport(profileId, period = 'week') {
    const logs = this.activityLogs.get(profileId) || [];
    const profile = this.controls.get(profileId);
    if (!profile) return null;

    const now = new Date();
    const periodStart = new Date(now);
    
    switch (period) {
      case 'day':
        periodStart.setDate(periodStart.getDate() - 1);
        break;
      case 'week':
        periodStart.setDate(periodStart.getDate() - 7);
        break;
      case 'month':
        periodStart.setMonth(periodStart.getMonth() - 1);
        break;
    }

    const periodLogs = logs.filter(log => 
      new Date(log.timestamp) >= periodStart
    );

    return {
      profileId,
      childName: profile.name,
      period,
      totalScreenTime: periodLogs.reduce((sum, log) => sum + (log.duration || 0), 0),
      activityBreakdown: this.categorizeActivities(periodLogs),
      flaggedActivities: periodLogs.filter(log => log.flagged),
      mostActiveHours: this.calculateActiveHours(periodLogs),
      contentInteractions: this.analyzeContent(periodLogs),
      recommendations: this.generateRecommendations(periodLogs, profile)
    };
  }

  categorizeActivities(logs) {
    const categories = {};
    logs.forEach(log => {
      categories[log.type] = (categories[log.type] || 0) + 1;
    });
    return categories;
  }

  calculateActiveHours(logs) {
    const hours = {};
    logs.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    });
    return hours;
  }

  analyzeContent(logs) {
    // Simplified content analysis
    return {
      educational: logs.filter(log => log.type === 'learn').length,
      entertainment: logs.filter(log => log.type === 'play').length,
      social: logs.filter(log => log.type === 'chat').length
    };
  }

  generateRecommendations(logs, profile) {
    const recommendations = [];
    const totalScreenTime = logs.reduce((sum, log) => sum + (log.duration || 0), 0);
    
    if (totalScreenTime > 300) {
      recommendations.push('Consider reducing screen time');
    }
    
    const educationalTime = logs
      .filter(log => log.type === 'learn')
      .reduce((sum, log) => sum + (log.duration || 0), 0);
    
    if (educationalTime < totalScreenTime * 0.3) {
      recommendations.push('Encourage more educational activities');
    }

    return recommendations;
  }
}

module.exports = ParentalControls;