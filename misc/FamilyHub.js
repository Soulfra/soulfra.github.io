// FamilyHub.js - Shared consciousness space for families

const EventEmitter = require('events');
const crypto = require('crypto');

class FamilyHub extends EventEmitter {
  constructor() {
    super();
    this.families = new Map();
    this.members = new Map();
    this.activities = new Map();
    this.sharedMemories = new Map();
    this.safetySettings = new Map();
  }

  // Family Management
  createFamily(config) {
    const familyId = `family_${crypto.randomBytes(8).toString('hex')}`;
    const family = {
      id: familyId,
      name: config.name,
      created: new Date().toISOString(),
      members: [],
      settings: {
        privacyLevel: config.privacyLevel || 'balanced',
        contentFilter: config.contentFilter || 'moderate',
        timeRestrictions: config.timeRestrictions || {},
        allowedActivities: config.allowedActivities || ['chat', 'learn', 'play']
      },
      sharedAgent: null
    };

    this.families.set(familyId, family);
    this.emit('familyCreated', family);
    return family;
  }

  // Member Management
  addFamilyMember(familyId, memberInfo) {
    const family = this.families.get(familyId);
    if (!family) throw new Error('Family not found');

    const memberId = `member_${crypto.randomBytes(8).toString('hex')}`;
    const member = {
      id: memberId,
      familyId,
      name: memberInfo.name,
      role: memberInfo.role, // parent, child, teen, grandparent
      age: memberInfo.age,
      avatar: memberInfo.avatar || this.generateAvatar(memberInfo.name),
      permissions: this.getRolePermissions(memberInfo.role),
      created: new Date().toISOString(),
      lastActive: null,
      preferences: {
        theme: 'default',
        language: 'en',
        accessibility: {}
      }
    };

    this.members.set(memberId, member);
    family.members.push(memberId);
    
    // Create personalized agent for the member
    member.personalAgent = this.createPersonalAgent(member);
    
    this.emit('memberAdded', { family, member });
    return member;
  }

  getRolePermissions(role) {
    const permissions = {
      parent: {
        canManageFamily: true,
        canViewAllActivity: true,
        canSetRestrictions: true,
        canDeleteContent: true,
        timeLimit: null
      },
      teen: {
        canManageFamily: false,
        canViewAllActivity: false,
        canSetRestrictions: false,
        canDeleteContent: false,
        timeLimit: 180 // minutes per day
      },
      child: {
        canManageFamily: false,
        canViewAllActivity: false,
        canSetRestrictions: false,
        canDeleteContent: false,
        timeLimit: 60,
        requiresApproval: true
      },
      grandparent: {
        canManageFamily: true,
        canViewAllActivity: true,
        canSetRestrictions: false,
        canDeleteContent: false,
        timeLimit: null
      }
    };

    return permissions[role] || permissions.child;
  }

  // Shared Activities
  createSharedActivity(familyId, activityConfig) {
    const family = this.families.get(familyId);
    if (!family) throw new Error('Family not found');

    const activityId = `activity_${crypto.randomBytes(8).toString('hex')}`;
    const activity = {
      id: activityId,
      familyId,
      type: activityConfig.type, // 'story', 'game', 'learn', 'chat'
      title: activityConfig.title,
      description: activityConfig.description,
      participants: [],
      created: new Date().toISOString(),
      status: 'active',
      content: [],
      metadata: activityConfig.metadata || {}
    };

    this.activities.set(activityId, activity);
    
    // Initialize activity-specific features
    switch (activity.type) {
      case 'story':
        activity.storyElements = {
          characters: [],
          plot: [],
          currentTurn: null
        };
        break;
      case 'game':
        activity.gameState = {
          score: {},
          level: 1,
          achievements: []
        };
        break;
      case 'learn':
        activity.learningPath = {
          topic: activityConfig.topic,
          progress: {},
          resources: []
        };
        break;
    }

    this.emit('activityCreated', activity);
    return activity;
  }

  joinActivity(activityId, memberId) {
    const activity = this.activities.get(activityId);
    const member = this.members.get(memberId);
    
    if (!activity || !member) {
      throw new Error('Activity or member not found');
    }

    if (!activity.participants.includes(memberId)) {
      activity.participants.push(memberId);
      
      // Initialize participant-specific data
      if (activity.type === 'game') {
        activity.gameState.score[memberId] = 0;
      } else if (activity.type === 'learn') {
        activity.learningPath.progress[memberId] = {
          completed: [],
          current: null,
          score: 0
        };
      }

      this.emit('memberJoinedActivity', { activity, member });
    }

    return activity;
  }

  // Shared Memory System
  addSharedMemory(familyId, memory) {
    const family = this.families.get(familyId);
    if (!family) throw new Error('Family not found');

    const memoryId = `memory_${crypto.randomBytes(8).toString('hex')}`;
    const sharedMemory = {
      id: memoryId,
      familyId,
      type: memory.type, // 'photo', 'video', 'text', 'milestone'
      title: memory.title,
      content: memory.content,
      creator: memory.creator,
      created: new Date().toISOString(),
      tags: memory.tags || [],
      reactions: {},
      privacy: memory.privacy || 'family', // 'family', 'private', 'extended'
      metadata: memory.metadata || {}
    };

    this.sharedMemories.set(memoryId, sharedMemory);
    
    // Add to family timeline
    if (!family.timeline) family.timeline = [];
    family.timeline.push(memoryId);

    this.emit('memoryAdded', sharedMemory);
    return sharedMemory;
  }

  // Communication Features
  sendFamilyMessage(familyId, senderId, message) {
    const family = this.families.get(familyId);
    const sender = this.members.get(senderId);
    
    if (!family || !sender) {
      throw new Error('Family or sender not found');
    }

    // Apply content filtering based on family settings
    const filteredMessage = this.applyContentFilter(
      message,
      family.settings.contentFilter
    );

    const messageObj = {
      id: `msg_${crypto.randomBytes(8).toString('hex')}`,
      familyId,
      senderId,
      content: filteredMessage,
      timestamp: new Date().toISOString(),
      reactions: {},
      edited: false
    };

    // Store in family chat history
    if (!family.chatHistory) family.chatHistory = [];
    family.chatHistory.push(messageObj);

    // Notify all family members
    this.notifyFamilyMembers(familyId, 'newMessage', messageObj);
    
    return messageObj;
  }

  // Safety and Privacy
  applyContentFilter(content, filterLevel) {
    // Simple content filtering simulation
    const filters = {
      strict: ['violent', 'inappropriate', 'scary', 'adult'],
      moderate: ['violent', 'inappropriate'],
      minimal: ['violent']
    };

    let filtered = content;
    const blockedWords = filters[filterLevel] || filters.moderate;
    
    blockedWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      filtered = filtered.replace(regex, '***');
    });

    return filtered;
  }

  setSafetySettings(familyId, settings) {
    const family = this.families.get(familyId);
    if (!family) throw new Error('Family not found');

    family.settings = {
      ...family.settings,
      ...settings
    };

    this.safetySettings.set(familyId, {
      screenTimeLimit: settings.screenTimeLimit || {},
      bedtimeRestrictions: settings.bedtimeRestrictions || {},
      contentRatings: settings.contentRatings || 'PG',
      approvedContacts: settings.approvedContacts || [],
      locationSharing: settings.locationSharing || false
    });

    this.emit('safetySettingsUpdated', { familyId, settings });
    return family.settings;
  }

  // Family Agent Creation
  createFamilyAgent(familyId) {
    const family = this.families.get(familyId);
    if (!family) throw new Error('Family not found');

    const agent = {
      id: `agent_family_${familyId}`,
      type: 'family',
      personality: 'warm, supportive, and educational',
      capabilities: [
        'family_coordination',
        'educational_support',
        'activity_facilitation',
        'memory_keeping'
      ],
      knowledge: {
        familyHistory: [],
        preferences: {},
        learningStyles: {}
      }
    };

    family.sharedAgent = agent;
    return agent;
  }

  createPersonalAgent(member) {
    const ageBasedPersonality = {
      child: 'playful, patient, and encouraging',
      teen: 'understanding, respectful, and informative',
      parent: 'helpful, efficient, and supportive',
      grandparent: 'gentle, clear, and accommodating'
    };

    return {
      id: `agent_${member.id}`,
      type: 'personal',
      personality: ageBasedPersonality[member.role] || 'friendly and helpful',
      capabilities: this.getAgeAppropriateCapabilities(member.age),
      preferences: member.preferences
    };
  }

  getAgeAppropriateCapabilities(age) {
    if (age < 10) {
      return ['storytelling', 'simple_games', 'basic_learning', 'drawing'];
    } else if (age < 18) {
      return ['homework_help', 'creative_writing', 'research', 'social_skills'];
    } else {
      return ['full_assistance', 'planning', 'analysis', 'creative_tools'];
    }
  }

  // Activity Helpers
  generateAvatar(name) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD'];
    const animals = ['bear', 'cat', 'dog', 'rabbit', 'bird', 'fox', 'owl'];
    
    const hash = crypto.createHash('md5').update(name).digest('hex');
    const colorIndex = parseInt(hash.substr(0, 2), 16) % colors.length;
    const animalIndex = parseInt(hash.substr(2, 2), 16) % animals.length;
    
    return {
      color: colors[colorIndex],
      animal: animals[animalIndex],
      initial: name.charAt(0).toUpperCase()
    };
  }

  // Notification System
  notifyFamilyMembers(familyId, event, data) {
    const family = this.families.get(familyId);
    if (!family) return;

    family.members.forEach(memberId => {
      this.emit('notification', {
        memberId,
        event,
        data,
        timestamp: new Date().toISOString()
      });
    });
  }

  // Analytics and Insights
  getFamilyInsights(familyId) {
    const family = this.families.get(familyId);
    if (!family) throw new Error('Family not found');

    const activities = Array.from(this.activities.values())
      .filter(a => a.familyId === familyId);
    
    const memories = Array.from(this.sharedMemories.values())
      .filter(m => m.familyId === familyId);

    return {
      totalMembers: family.members.length,
      activeActivities: activities.filter(a => a.status === 'active').length,
      totalMemories: memories.length,
      mostActiveTime: this.calculateMostActiveTime(family),
      favoriteActivities: this.calculateFavoriteActivities(activities),
      familyMood: this.calculateFamilyMood(family)
    };
  }

  calculateMostActiveTime(family) {
    // Simplified - would analyze actual usage patterns
    return 'Evenings (6-8 PM)';
  }

  calculateFavoriteActivities(activities) {
    const typeCounts = {};
    activities.forEach(a => {
      typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
    });
    return Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type);
  }

  calculateFamilyMood(family) {
    // Simplified mood calculation
    return 'Happy and Connected';
  }
}

module.exports = FamilyHub;