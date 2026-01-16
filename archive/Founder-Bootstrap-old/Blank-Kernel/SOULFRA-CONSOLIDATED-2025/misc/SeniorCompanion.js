// SeniorCompanion.js - Simplified, accessible interface for seniors

const EventEmitter = require('events');
const crypto = require('crypto');

class SeniorCompanion extends EventEmitter {
  constructor() {
    super();
    this.users = new Map();
    this.sessions = new Map();
    this.reminders = new Map();
    this.healthData = new Map();
    this.socialConnections = new Map();
    this.assistantProfiles = new Map();
    this.initializeAssistantProfiles();
  }

  // User Management
  createSeniorProfile(userInfo) {
    const userId = `senior_${crypto.randomBytes(8).toString('hex')}`;
    const profile = {
      id: userId,
      name: userInfo.name,
      age: userInfo.age,
      created: new Date().toISOString(),
      preferences: {
        fontSize: userInfo.fontSize || 'large',
        contrast: userInfo.contrast || 'high',
        audioSpeed: userInfo.audioSpeed || 'slow',
        language: userInfo.language || 'en',
        voiceGender: userInfo.voiceGender || 'female',
        simplifiedMode: userInfo.simplifiedMode !== false
      },
      accessibility: {
        visualAid: userInfo.visualAid || 'none', // none, low, moderate, severe
        hearingAid: userInfo.hearingAid || 'none',
        motorControl: userInfo.motorControl || 'normal', // normal, limited, assisted
        cognitiveSupport: userInfo.cognitiveSupport || 'minimal' // minimal, moderate, high
      },
      interests: userInfo.interests || [],
      medicalInfo: {
        conditions: userInfo.conditions || [],
        medications: [],
        emergencyContact: userInfo.emergencyContact || null
      },
      companion: this.assignCompanion(userInfo),
      dailyGoals: {
        socialInteraction: 3,
        physicalActivity: 30, // minutes
        mentalExercise: 20,
        medicationReminders: true
      },
      statistics: {
        daysActive: 0,
        totalInteractions: 0,
        goalsCompleted: 0
      }
    };

    this.users.set(userId, profile);
    this.setupDefaultReminders(userId);
    this.emit('profileCreated', profile);
    return profile;
  }

  assignCompanion(userInfo) {
    // Select companion based on user preferences and needs
    const companions = [
      { name: 'Mary', personality: 'warm and patient', specialty: 'daily_activities' },
      { name: 'Robert', personality: 'friendly and knowledgeable', specialty: 'health_wellness' },
      { name: 'Grace', personality: 'cheerful and encouraging', specialty: 'social_connection' },
      { name: 'William', personality: 'calm and supportive', specialty: 'memory_assistance' }
    ];

    // Match based on primary need
    let selectedCompanion = companions[0];
    if (userInfo.primaryNeed === 'health') {
      selectedCompanion = companions[1];
    } else if (userInfo.primaryNeed === 'social') {
      selectedCompanion = companions[2];
    } else if (userInfo.primaryNeed === 'memory') {
      selectedCompanion = companions[3];
    }

    return {
      ...selectedCompanion,
      avatar: this.generateAvatar(selectedCompanion.name),
      voiceProfile: {
        pace: 'slow',
        clarity: 'high',
        warmth: 'high',
        patience: 'infinite'
      }
    };
  }

  generateAvatar(name) {
    const avatars = {
      'Mary': { emoji: '👩‍🦳', color: '#9370DB' },
      'Robert': { emoji: '👨‍🦳', color: '#4682B4' },
      'Grace': { emoji: '👵', color: '#FF69B4' },
      'William': { emoji: '👴', color: '#228B22' }
    };
    return avatars[name] || { emoji: '🙋', color: '#708090' };
  }

  // Assistant Profiles
  initializeAssistantProfiles() {
    // Daily Activities Assistant
    this.assistantProfiles.set('daily_activities', {
      name: 'Daily Helper',
      capabilities: [
        'medication_reminders',
        'appointment_scheduling',
        'meal_planning',
        'routine_management'
      ],
      prompts: {
        morning: 'Good morning! Let\'s start your day together. Have you taken your morning medications?',
        afternoon: 'Good afternoon! Would you like to review your schedule for the rest of the day?',
        evening: 'Good evening! Let\'s prepare for tomorrow. Any appointments to remember?'
      }
    });

    // Health & Wellness Assistant
    this.assistantProfiles.set('health_wellness', {
      name: 'Health Companion',
      capabilities: [
        'vitals_tracking',
        'exercise_guidance',
        'symptom_monitoring',
        'doctor_communication'
      ],
      exercises: [
        { name: 'Gentle Stretching', duration: 10, difficulty: 'easy' },
        { name: 'Chair Yoga', duration: 15, difficulty: 'easy' },
        { name: 'Walking Meditation', duration: 20, difficulty: 'moderate' },
        { name: 'Balance Exercises', duration: 10, difficulty: 'moderate' }
      ]
    });

    // Memory & Cognitive Assistant
    this.assistantProfiles.set('memory_cognitive', {
      name: 'Memory Friend',
      capabilities: [
        'memory_games',
        'photo_memories',
        'story_telling',
        'cognitive_exercises'
      ],
      activities: [
        { name: 'Photo Album Review', type: 'memory', benefit: 'recall' },
        { name: 'Word Association', type: 'cognitive', benefit: 'vocabulary' },
        { name: 'Number Patterns', type: 'cognitive', benefit: 'logic' },
        { name: 'Story Completion', type: 'creative', benefit: 'imagination' }
      ]
    });

    // Social Connection Assistant
    this.assistantProfiles.set('social_connection', {
      name: 'Social Buddy',
      capabilities: [
        'video_calling',
        'message_sending',
        'group_activities',
        'event_notifications'
      ],
      socialActivities: [
        { name: 'Virtual Coffee Hour', type: 'group', frequency: 'daily' },
        { name: 'Book Club', type: 'group', frequency: 'weekly' },
        { name: 'Memory Lane Sharing', type: 'group', frequency: 'weekly' },
        { name: 'Game Night', type: 'group', frequency: 'twice_weekly' }
      ]
    });
  }

  // Session Management
  startSession(userId) {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');

    const sessionId = `session_${crypto.randomBytes(8).toString('hex')}`;
    const session = {
      id: sessionId,
      userId,
      startTime: new Date(),
      companion: user.companion,
      interactions: [],
      activitiesCompleted: [],
      mood: 'neutral',
      status: 'active'
    };

    this.sessions.set(sessionId, session);
    
    // Greet user based on time of day
    const greeting = this.generateGreeting(user, session);
    this.speak(sessionId, greeting);
    
    // Check for important reminders
    this.checkImmediateReminders(userId);
    
    this.emit('sessionStarted', session);
    return session;
  }

  generateGreeting(user, session) {
    const hour = new Date().getHours();
    const companion = user.companion;
    let timeGreeting = '';
    
    if (hour < 12) {
      timeGreeting = 'Good morning';
    } else if (hour < 17) {
      timeGreeting = 'Good afternoon';
    } else {
      timeGreeting = 'Good evening';
    }

    return `${timeGreeting}, ${user.name}! This is ${companion.name}. I'm here to help you today. How are you feeling?`;
  }

  // Interaction Handling
  processUserInput(sessionId, input) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const user = this.users.get(session.userId);
    
    // Log interaction
    const interaction = {
      timestamp: new Date(),
      userInput: input,
      type: this.classifyInput(input),
      sentiment: this.analyzeSentiment(input)
    };
    
    session.interactions.push(interaction);

    // Generate appropriate response
    const response = this.generateResponse(user, session, interaction);
    
    // Update session mood based on sentiment
    this.updateSessionMood(session, interaction.sentiment);
    
    // Check for triggers (emergency, confusion, etc.)
    this.checkTriggers(user, session, interaction);
    
    return response;
  }

  classifyInput(input) {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('hurt') || lowerInput.includes('pain') || lowerInput.includes('help')) {
      return 'health_concern';
    } else if (lowerInput.includes('medicine') || lowerInput.includes('medication') || lowerInput.includes('pill')) {
      return 'medication_query';
    } else if (lowerInput.includes('remember') || lowerInput.includes('forget') || lowerInput.includes('forgot')) {
      return 'memory_concern';
    } else if (lowerInput.includes('lonely') || lowerInput.includes('talk') || lowerInput.includes('friend')) {
      return 'social_need';
    } else if (lowerInput.includes('appointment') || lowerInput.includes('doctor') || lowerInput.includes('schedule')) {
      return 'scheduling';
    } else {
      return 'general_conversation';
    }
  }

  analyzeSentiment(input) {
    const positiveWords = ['good', 'great', 'happy', 'wonderful', 'fine', 'well', 'better'];
    const negativeWords = ['sad', 'tired', 'lonely', 'hurt', 'confused', 'worried', 'scared'];
    
    const lowerInput = input.toLowerCase();
    let sentiment = 'neutral';
    
    positiveWords.forEach(word => {
      if (lowerInput.includes(word)) sentiment = 'positive';
    });
    
    negativeWords.forEach(word => {
      if (lowerInput.includes(word)) sentiment = 'negative';
    });
    
    return sentiment;
  }

  generateResponse(user, session, interaction) {
    const responses = {
      health_concern: {
        template: "I understand you're not feeling well. Can you tell me more about what's bothering you? Should I contact your emergency contact?",
        action: () => this.handleHealthConcern(user, interaction)
      },
      medication_query: {
        template: "Let me check your medication schedule for you.",
        action: () => this.checkMedications(user)
      },
      memory_concern: {
        template: "Don't worry, I'm here to help you remember. What are you trying to recall?",
        action: () => this.assistWithMemory(user, interaction)
      },
      social_need: {
        template: "I understand. Would you like to call a family member or join a group activity?",
        action: () => this.suggestSocialActivities(user)
      },
      scheduling: {
        template: "I'll help you with your schedule. Let me check your appointments.",
        action: () => this.reviewSchedule(user)
      },
      general_conversation: {
        template: "That's nice to hear. Would you like to do an activity together?",
        action: () => this.suggestActivities(user, session)
      }
    };

    const responseType = responses[interaction.type] || responses.general_conversation;
    
    if (responseType.action) {
      responseType.action();
    }
    
    return {
      text: responseType.template,
      spoken: true,
      emotion: 'caring',
      suggestions: this.getContextualSuggestions(user, interaction.type)
    };
  }

  // Reminder System
  setupDefaultReminders(userId) {
    const user = this.users.get(userId);
    if (!user) return;

    const defaultReminders = [
      {
        id: `reminder_${crypto.randomBytes(8).toString('hex')}`,
        type: 'medication',
        time: '08:00',
        message: 'Time for your morning medications',
        repeat: 'daily',
        priority: 'high'
      },
      {
        id: `reminder_${crypto.randomBytes(8).toString('hex')}`,
        type: 'medication',
        time: '12:00',
        message: 'Time for your afternoon medications',
        repeat: 'daily',
        priority: 'high'
      },
      {
        id: `reminder_${crypto.randomBytes(8).toString('hex')}`,
        type: 'medication',
        time: '20:00',
        message: 'Time for your evening medications',
        repeat: 'daily',
        priority: 'high'
      },
      {
        id: `reminder_${crypto.randomBytes(8).toString('hex')}`,
        type: 'activity',
        time: '10:00',
        message: 'Time for your morning exercise',
        repeat: 'daily',
        priority: 'medium'
      },
      {
        id: `reminder_${crypto.randomBytes(8).toString('hex')}`,
        type: 'hydration',
        time: '09:00',
        message: 'Remember to drink water',
        repeat: 'every_2_hours',
        priority: 'low'
      }
    ];

    const userReminders = new Map();
    defaultReminders.forEach(reminder => {
      userReminders.set(reminder.id, reminder);
    });
    
    this.reminders.set(userId, userReminders);
  }

  addReminder(userId, reminderInfo) {
    const userReminders = this.reminders.get(userId) || new Map();
    
    const reminder = {
      id: `reminder_${crypto.randomBytes(8).toString('hex')}`,
      ...reminderInfo,
      created: new Date().toISOString(),
      active: true
    };
    
    userReminders.set(reminder.id, reminder);
    this.reminders.set(userId, userReminders);
    
    this.emit('reminderAdded', { userId, reminder });
    return reminder;
  }

  checkImmediateReminders(userId) {
    const userReminders = this.reminders.get(userId);
    if (!userReminders) return;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    userReminders.forEach(reminder => {
      if (reminder.active && reminder.time === currentTime) {
        this.triggerReminder(userId, reminder);
      }
    });
  }

  triggerReminder(userId, reminder) {
    const user = this.users.get(userId);
    if (!user) return;

    const notification = {
      id: `notif_${crypto.randomBytes(8).toString('hex')}`,
      userId,
      reminder,
      timestamp: new Date(),
      acknowledged: false
    };

    // Speak the reminder
    const spokenMessage = `${user.name}, ${reminder.message}`;
    this.speak(userId, spokenMessage, { priority: reminder.priority });
    
    // Visual notification
    this.emit('reminderTriggered', notification);
    
    // Log for tracking
    if (reminder.type === 'medication') {
      this.logMedicationReminder(userId, reminder);
    }
    
    return notification;
  }

  // Health Monitoring
  recordVitals(userId, vitals) {
    const healthLog = this.healthData.get(userId) || [];
    
    const record = {
      id: `vitals_${crypto.randomBytes(8).toString('hex')}`,
      timestamp: new Date(),
      bloodPressure: vitals.bloodPressure,
      heartRate: vitals.heartRate,
      temperature: vitals.temperature,
      oxygenLevel: vitals.oxygenLevel,
      bloodSugar: vitals.bloodSugar,
      weight: vitals.weight,
      notes: vitals.notes || ''
    };
    
    healthLog.push(record);
    this.healthData.set(userId, healthLog);
    
    // Check for concerning values
    const alerts = this.checkVitalAlerts(record);
    if (alerts.length > 0) {
      this.handleHealthAlerts(userId, alerts);
    }
    
    this.emit('vitalsRecorded', { userId, record });
    return record;
  }

  checkVitalAlerts(vitals) {
    const alerts = [];
    
    // Blood pressure checks
    if (vitals.bloodPressure) {
      const [systolic, diastolic] = vitals.bloodPressure.split('/').map(Number);
      if (systolic > 140 || diastolic > 90) {
        alerts.push({ type: 'high_blood_pressure', severity: 'warning' });
      }
      if (systolic > 180 || diastolic > 120) {
        alerts.push({ type: 'critical_blood_pressure', severity: 'critical' });
      }
    }
    
    // Heart rate checks
    if (vitals.heartRate) {
      if (vitals.heartRate < 50 || vitals.heartRate > 100) {
        alerts.push({ type: 'abnormal_heart_rate', severity: 'warning' });
      }
    }
    
    // Oxygen level checks
    if (vitals.oxygenLevel && vitals.oxygenLevel < 92) {
      alerts.push({ type: 'low_oxygen', severity: 'warning' });
    }
    
    return alerts;
  }

  handleHealthAlerts(userId, alerts) {
    const user = this.users.get(userId);
    if (!user) return;

    alerts.forEach(alert => {
      if (alert.severity === 'critical') {
        // Immediate action
        this.notifyEmergencyContact(user, alert);
        this.speak(userId, 'I\'ve detected concerning vital signs. I\'m notifying your emergency contact.', 
          { priority: 'critical' });
      } else if (alert.severity === 'warning') {
        // Suggest action
        this.speak(userId, 'Your vitals show some concerning values. Would you like me to schedule a doctor\'s appointment?',
          { priority: 'high' });
      }
    });
    
    this.emit('healthAlertsDetected', { userId, alerts });
  }

  // Medication Management
  addMedication(userId, medicationInfo) {
    const user = this.users.get(userId);
    if (!user) return;

    const medication = {
      id: `med_${crypto.randomBytes(8).toString('hex')}`,
      name: medicationInfo.name,
      dosage: medicationInfo.dosage,
      frequency: medicationInfo.frequency,
      times: medicationInfo.times || [],
      purpose: medicationInfo.purpose,
      prescribedBy: medicationInfo.prescribedBy,
      startDate: medicationInfo.startDate || new Date().toISOString(),
      endDate: medicationInfo.endDate,
      refillDate: medicationInfo.refillDate,
      sideEffects: medicationInfo.sideEffects || [],
      notes: medicationInfo.notes || ''
    };
    
    user.medicalInfo.medications.push(medication);
    
    // Create reminders for medication times
    medication.times.forEach(time => {
      this.addReminder(userId, {
        type: 'medication',
        time: time,
        message: `Time to take ${medication.name} (${medication.dosage})`,
        repeat: 'daily',
        priority: 'high',
        medicationId: medication.id
      });
    });
    
    this.emit('medicationAdded', { userId, medication });
    return medication;
  }

  checkMedications(user) {
    const now = new Date();
    const currentHour = now.getHours();
    
    const upcomingMeds = user.medicalInfo.medications.filter(med => {
      return med.times.some(time => {
        const [hour] = time.split(':').map(Number);
        return Math.abs(hour - currentHour) <= 1;
      });
    });
    
    if (upcomingMeds.length > 0) {
      const medList = upcomingMeds.map(med => `${med.name} (${med.dosage})`).join(', ');
      return `Your upcoming medications: ${medList}`;
    } else {
      return 'No medications scheduled for the next hour.';
    }
  }

  logMedicationReminder(userId, reminder) {
    const log = {
      userId,
      reminderId: reminder.id,
      timestamp: new Date(),
      acknowledged: false,
      taken: false
    };
    
    // In production, this would persist to a database
    this.emit('medicationReminderLogged', log);
  }

  // Social Features
  joinGroupActivity(userId, activityId) {
    const user = this.users.get(userId);
    if (!user) return;

    const activity = this.getGroupActivity(activityId);
    if (!activity) return;

    const participation = {
      userId,
      activityId,
      joinedAt: new Date(),
      status: 'active'
    };
    
    // Add to user's social connections
    const connections = this.socialConnections.get(userId) || [];
    connections.push({
      type: 'group_activity',
      activity: activity.name,
      timestamp: new Date(),
      participants: activity.currentParticipants
    });
    
    this.socialConnections.set(userId, connections);
    user.statistics.totalInteractions++;
    
    this.emit('joinedGroupActivity', { userId, activity });
    return participation;
  }

  getGroupActivity(activityId) {
    // Simulated group activities
    const activities = {
      'coffee_hour': {
        name: 'Virtual Coffee Hour',
        time: '10:00 AM',
        duration: 60,
        currentParticipants: 8,
        maxParticipants: 12
      },
      'book_club': {
        name: 'Book Club Discussion',
        time: '2:00 PM',
        duration: 90,
        currentParticipants: 6,
        maxParticipants: 10
      }
    };
    
    return activities[activityId];
  }

  suggestSocialActivities(user) {
    const suggestions = [];
    const socialProfile = this.assistantProfiles.get('social_connection');
    
    socialProfile.socialActivities.forEach(activity => {
      if (this.matchesUserInterests(user, activity)) {
        suggestions.push({
          activity: activity.name,
          type: activity.type,
          nextSession: this.getNextSessionTime(activity.frequency)
        });
      }
    });
    
    return suggestions;
  }

  matchesUserInterests(user, activity) {
    // Simple interest matching
    const activityKeywords = activity.name.toLowerCase().split(' ');
    return user.interests.some(interest => 
      activityKeywords.some(keyword => interest.toLowerCase().includes(keyword))
    );
  }

  getNextSessionTime(frequency) {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        return 'Tomorrow at 10:00 AM';
      case 'weekly':
        return 'Next Tuesday at 2:00 PM';
      case 'twice_weekly':
        return 'Thursday at 7:00 PM';
      default:
        return 'Schedule to be announced';
    }
  }

  // Cognitive Activities
  startCognitiveExercise(userId, exerciseType) {
    const exercises = {
      memory: {
        name: 'Memory Match',
        description: 'Match pairs of cards',
        difficulty: 'adjustable',
        duration: 15
      },
      wordplay: {
        name: 'Word Association',
        description: 'Connect related words',
        difficulty: 'easy',
        duration: 10
      },
      puzzles: {
        name: 'Simple Puzzles',
        description: 'Complete picture puzzles',
        difficulty: 'moderate',
        duration: 20
      },
      trivia: {
        name: 'Memory Lane Trivia',
        description: 'Questions about past decades',
        difficulty: 'easy',
        duration: 15
      }
    };

    const exercise = exercises[exerciseType];
    if (!exercise) return null;

    const session = {
      id: `exercise_${crypto.randomBytes(8).toString('hex')}`,
      userId,
      type: exerciseType,
      exercise,
      startTime: new Date(),
      score: 0,
      completed: false
    };
    
    this.emit('cognitiveExerciseStarted', session);
    return session;
  }

  // Voice Interface
  speak(sessionId, message, options = {}) {
    const session = this.sessions.get(sessionId) || { userId: sessionId };
    const user = this.users.get(session.userId);
    
    if (!user) return;

    const spokenMessage = {
      text: message,
      voice: user.preferences.voiceGender,
      speed: user.preferences.audioSpeed,
      volume: 'normal',
      emphasis: options.priority || 'normal',
      pauseAfter: true
    };
    
    this.emit('speak', spokenMessage);
    return spokenMessage;
  }

  // Helper Methods
  updateSessionMood(session, sentiment) {
    const moodMap = {
      positive: ['happy', 'content', 'cheerful'],
      negative: ['concerned', 'sympathetic', 'supportive'],
      neutral: ['calm', 'attentive', 'ready']
    };
    
    const moods = moodMap[sentiment] || moodMap.neutral;
    session.mood = moods[Math.floor(Math.random() * moods.length)];
  }

  checkTriggers(user, session, interaction) {
    const triggers = {
      emergency: ['help', 'emergency', 'hurt', 'fall', 'pain'],
      confusion: ['confused', 'lost', 'don\'t understand', 'what', 'where am i'],
      distress: ['scared', 'frightened', 'worried', 'anxious']
    };
    
    const lowerInput = interaction.userInput.toLowerCase();
    
    Object.entries(triggers).forEach(([triggerType, keywords]) => {
      if (keywords.some(keyword => lowerInput.includes(keyword))) {
        this.handleTrigger(user, session, triggerType, interaction);
      }
    });
  }

  handleTrigger(user, session, triggerType, interaction) {
    switch (triggerType) {
      case 'emergency':
        this.handleEmergency(user, session, interaction);
        break;
      case 'confusion':
        this.handleConfusion(user, session);
        break;
      case 'distress':
        this.handleDistress(user, session);
        break;
    }
  }

  handleEmergency(user, session, interaction) {
    // Immediate response
    this.speak(session.id, 'I\'m getting help right away. Stay calm, help is coming.', 
      { priority: 'critical' });
    
    // Notify emergency contact
    if (user.medicalInfo.emergencyContact) {
      this.notifyEmergencyContact(user, {
        type: 'emergency_triggered',
        trigger: interaction.userInput,
        timestamp: new Date()
      });
    }
    
    this.emit('emergencyDetected', { user, session, interaction });
  }

  handleConfusion(user, session) {
    this.speak(session.id, 
      `Don't worry, ${user.name}. You're safe at home. I'm ${user.companion.name}, your companion. Would you like me to call someone familiar?`,
      { priority: 'high' }
    );
    
    // Suggest calming activities
    this.suggestCalmingActivities(user, session);
  }

  handleDistress(user, session) {
    this.speak(session.id,
      `I understand you're feeling worried. Let's take some deep breaths together. Breathe in slowly... and out. You're doing great.`,
      { priority: 'high' }
    );
    
    // Offer support options
    this.offerSupportOptions(user, session);
  }

  suggestCalmingActivities(user, session) {
    const activities = [
      'Would you like to look at some family photos?',
      'Shall we listen to some calming music?',
      'Would you like me to read you a story?',
      'Let\'s do some gentle breathing exercises together.'
    ];
    
    const suggestion = activities[Math.floor(Math.random() * activities.length)];
    setTimeout(() => {
      this.speak(session.id, suggestion);
    }, 3000);
  }

  offerSupportOptions(user, session) {
    const options = [
      { text: 'Call family member', action: 'contact_family' },
      { text: 'Breathing exercise', action: 'breathing_exercise' },
      { text: 'Favorite music', action: 'play_music' },
      { text: 'Just talk', action: 'conversation' }
    ];
    
    this.emit('supportOptionsOffered', { session, options });
  }

  notifyEmergencyContact(user, alert) {
    if (!user.medicalInfo.emergencyContact) return;
    
    const notification = {
      to: user.medicalInfo.emergencyContact,
      regarding: user.name,
      alert,
      timestamp: new Date(),
      location: 'Home', // Would use actual location in production
      status: 'sent'
    };
    
    this.emit('emergencyContactNotified', notification);
  }

  getContextualSuggestions(user, interactionType) {
    const suggestions = {
      health_concern: [
        'Check vitals',
        'Call doctor',
        'Review medications',
        'Emergency contact'
      ],
      social_need: [
        'Call family',
        'Join group activity',
        'Share memories',
        'Play a game'
      ],
      memory_concern: [
        'View photos',
        'Review schedule',
        'Memory exercises',
        'Call someone'
      ],
      general_conversation: [
        'Tell a story',
        'Do an activity',
        'Check reminders',
        'Listen to music'
      ]
    };
    
    return suggestions[interactionType] || suggestions.general_conversation;
  }

  // Reporting and Analytics
  generateDailyReport(userId) {
    const user = this.users.get(userId);
    if (!user) return null;

    const today = new Date().toDateString();
    const todaySessions = Array.from(this.sessions.values())
      .filter(s => s.userId === userId && s.startTime.toDateString() === today);
    
    const report = {
      userId,
      date: today,
      summary: {
        totalInteractions: todaySessions.reduce((sum, s) => sum + s.interactions.length, 0),
        activitiesCompleted: todaySessions.reduce((sum, s) => sum + s.activitiesCompleted.length, 0),
        moodTrend: this.calculateMoodTrend(todaySessions),
        medicationCompliance: this.checkMedicationCompliance(userId, today),
        socialEngagement: this.calculateSocialEngagement(userId, today)
      },
      recommendations: this.generateRecommendations(user, todaySessions),
      alerts: this.getTodayAlerts(userId)
    };
    
    return report;
  }

  calculateMoodTrend(sessions) {
    if (sessions.length === 0) return 'neutral';
    
    const moods = sessions.map(s => s.mood);
    const positiveMoods = ['happy', 'content', 'cheerful'];
    const positiveCount = moods.filter(m => positiveMoods.includes(m)).length;
    
    if (positiveCount > moods.length / 2) return 'positive';
    if (positiveCount < moods.length / 3) return 'needs_attention';
    return 'stable';
  }

  checkMedicationCompliance(userId, date) {
    // In production, would check actual medication logs
    return {
      scheduled: 3,
      taken: 3,
      compliance: 100
    };
  }

  calculateSocialEngagement(userId, date) {
    const connections = this.socialConnections.get(userId) || [];
    const todayConnections = connections.filter(c => 
      c.timestamp.toDateString() === date
    );
    
    return {
      interactions: todayConnections.length,
      groupActivities: todayConnections.filter(c => c.type === 'group_activity').length,
      calls: todayConnections.filter(c => c.type === 'call').length
    };
  }

  generateRecommendations(user, sessions) {
    const recommendations = [];
    
    // Check activity levels
    if (sessions.length < 3) {
      recommendations.push({
        type: 'engagement',
        message: 'Try to interact more throughout the day',
        priority: 'medium'
      });
    }
    
    // Check social interaction
    const socialInteractions = sessions.flatMap(s => s.interactions)
      .filter(i => i.type === 'social_need').length;
    
    if (socialInteractions === 0) {
      recommendations.push({
        type: 'social',
        message: 'Consider joining a group activity or calling a friend',
        priority: 'low'
      });
    }
    
    return recommendations;
  }

  getTodayAlerts(userId) {
    // Would retrieve actual alerts from the system
    return [];
  }
}

module.exports = SeniorCompanion;