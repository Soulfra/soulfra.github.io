// FamilyActivities.js - Shared learning experiences for families

const EventEmitter = require('events');
const crypto = require('crypto');

class FamilyActivities extends EventEmitter {
  constructor() {
    super();
    this.activities = new Map();
    this.templates = new Map();
    this.progress = new Map();
    this.achievements = new Map();
    this.initializeActivityTemplates();
  }

  initializeActivityTemplates() {
    // Story Creation Activities
    this.templates.set('collaborative-story', {
      type: 'creative',
      name: 'Family Story Time',
      description: 'Create magical stories together',
      minParticipants: 2,
      maxParticipants: 8,
      ageRange: { min: 4, max: 99 },
      duration: 30,
      setup: () => ({
        story: {
          title: '',
          characters: [],
          plot: [],
          currentTurn: 0,
          style: 'fantasy' // fantasy, adventure, mystery, comedy
        },
        rules: {
          turnOrder: 'sequential',
          contributionLength: 'sentence', // word, sentence, paragraph
          votingEnabled: true
        }
      })
    });

    // Educational Games
    this.templates.set('family-trivia', {
      type: 'educational',
      name: 'Family Trivia Night',
      description: 'Test your knowledge together',
      minParticipants: 2,
      maxParticipants: 10,
      ageRange: { min: 7, max: 99 },
      duration: 45,
      setup: () => ({
        categories: ['Science', 'History', 'Family Facts', 'Pop Culture', 'Geography'],
        difficulty: 'adaptive', // adjusts based on participants
        scoring: {
          correct: 100,
          bonus: 50,
          streak: 25
        },
        rounds: 5,
        questionsPerRound: 5
      })
    });

    // Creative Activities
    this.templates.set('drawing-game', {
      type: 'creative',
      name: 'Collaborative Drawing',
      description: 'Create art together',
      minParticipants: 2,
      maxParticipants: 6,
      ageRange: { min: 4, max: 99 },
      duration: 20,
      setup: () => ({
        canvas: {
          width: 800,
          height: 600,
          background: 'white'
        },
        tools: ['pencil', 'brush', 'eraser', 'colors'],
        themes: ['animals', 'fantasy', 'nature', 'space', 'underwater'],
        mode: 'collaborative' // collaborative, turns, sections
      })
    });

    // Learning Adventures
    this.templates.set('science-quest', {
      type: 'educational',
      name: 'Science Quest',
      description: 'Explore science concepts together',
      minParticipants: 1,
      maxParticipants: 4,
      ageRange: { min: 8, max: 16 },
      duration: 60,
      setup: () => ({
        topics: ['Solar System', 'Human Body', 'Chemistry', 'Physics', 'Biology'],
        experiments: [],
        quizzes: [],
        simulations: [],
        badges: ['Explorer', 'Scientist', 'Genius', 'Master']
      })
    });

    // Memory Lane
    this.templates.set('memory-sharing', {
      type: 'bonding',
      name: 'Memory Lane',
      description: 'Share and preserve family memories',
      minParticipants: 2,
      maxParticipants: 20,
      ageRange: { min: 5, max: 99 },
      duration: 45,
      setup: () => ({
        prompts: [
          'Funniest family moment',
          'Best vacation memory',
          'Family traditions',
          'Childhood stories',
          'Family recipes'
        ],
        mediaTypes: ['text', 'photo', 'video', 'audio'],
        privacyLevel: 'family'
      })
    });

    // Cooking Together
    this.templates.set('cooking-class', {
      type: 'life-skills',
      name: 'Family Cooking Class',
      description: 'Learn to cook together',
      minParticipants: 2,
      maxParticipants: 6,
      ageRange: { min: 6, max: 99 },
      duration: 90,
      setup: () => ({
        recipes: {
          beginner: ['Sandwiches', 'Salads', 'Smoothies'],
          intermediate: ['Pasta', 'Pizza', 'Stir-fry'],
          advanced: ['Lasagna', 'Curry', 'Baked goods']
        },
        safety: {
          knifeSkills: 'age-appropriate',
          heatSources: 'supervised',
          hygiene: 'emphasized'
        },
        learning: ['measurements', 'nutrition', 'techniques']
      })
    });
  }

  // Activity Management
  createActivity(familyId, templateId, customSettings = {}) {
    const template = this.templates.get(templateId);
    if (!template) throw new Error('Activity template not found');

    const activityId = `activity_${crypto.randomBytes(8).toString('hex')}`;
    const activity = {
      id: activityId,
      familyId,
      templateId,
      name: template.name,
      type: template.type,
      status: 'waiting', // waiting, active, paused, completed
      created: new Date().toISOString(),
      participants: [],
      settings: {
        ...template.setup(),
        ...customSettings
      },
      state: {},
      timeline: [],
      results: null
    };

    this.activities.set(activityId, activity);
    this.emit('activityCreated', activity);
    return activity;
  }

  joinActivity(activityId, participant) {
    const activity = this.activities.get(activityId);
    if (!activity) throw new Error('Activity not found');

    const template = this.templates.get(activity.templateId);
    
    // Check age restrictions
    if (participant.age < template.ageRange.min || participant.age > template.ageRange.max) {
      throw new Error('Participant age outside activity range');
    }

    // Check participant limit
    if (activity.participants.length >= template.maxParticipants) {
      throw new Error('Activity is full');
    }

    activity.participants.push({
      id: participant.id,
      name: participant.name,
      age: participant.age,
      avatar: participant.avatar,
      joinedAt: new Date().toISOString()
    });

    // Initialize participant progress
    this.initializeParticipantProgress(activityId, participant.id);

    // Start activity if minimum participants reached
    if (activity.participants.length >= template.minParticipants && activity.status === 'waiting') {
      this.startActivity(activityId);
    }

    this.emit('participantJoined', { activity, participant });
    return activity;
  }

  startActivity(activityId) {
    const activity = this.activities.get(activityId);
    if (!activity) throw new Error('Activity not found');

    activity.status = 'active';
    activity.startTime = new Date().toISOString();

    // Initialize activity-specific state
    switch (activity.templateId) {
      case 'collaborative-story':
        this.initializeStoryActivity(activity);
        break;
      case 'family-trivia':
        this.initializeTriviaActivity(activity);
        break;
      case 'drawing-game':
        this.initializeDrawingActivity(activity);
        break;
      case 'science-quest':
        this.initializeScienceActivity(activity);
        break;
    }

    this.emit('activityStarted', activity);
    return activity;
  }

  // Activity-Specific Implementations
  initializeStoryActivity(activity) {
    activity.state = {
      currentAuthor: 0,
      storyParts: [],
      votes: {},
      timer: null
    };

    // Generate story prompt
    const prompts = [
      'Once upon a time in a magical forest...',
      'The spaceship landed on a mysterious planet...',
      'The detective received a strange letter...',
      'In the kingdom of talking animals...'
    ];
    
    activity.state.prompt = prompts[Math.floor(Math.random() * prompts.length)];
    activity.timeline.push({
      event: 'story_started',
      prompt: activity.state.prompt,
      timestamp: new Date().toISOString()
    });
  }

  initializeTriviaActivity(activity) {
    activity.state = {
      currentRound: 1,
      currentQuestion: 0,
      scores: {},
      questions: this.generateTriviaQuestions(activity.settings),
      answers: {},
      streaks: {}
    };

    // Initialize scores
    activity.participants.forEach(p => {
      activity.state.scores[p.id] = 0;
      activity.state.streaks[p.id] = 0;
    });
  }

  initializeDrawingActivity(activity) {
    activity.state = {
      canvas: this.createCanvas(activity.settings.canvas),
      currentTheme: null,
      contributions: [],
      tools: activity.settings.tools,
      colors: ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF']
    };

    // Select random theme
    const themes = activity.settings.themes;
    activity.state.currentTheme = themes[Math.floor(Math.random() * themes.length)];
  }

  initializeScienceActivity(activity) {
    activity.state = {
      currentTopic: null,
      completedExperiments: [],
      unlockedBadges: {},
      knowledgePoints: {},
      currentExperiment: null
    };

    // Initialize progress for each participant
    activity.participants.forEach(p => {
      activity.state.knowledgePoints[p.id] = 0;
      activity.state.unlockedBadges[p.id] = [];
    });
  }

  // Activity Actions
  submitStoryContribution(activityId, participantId, contribution) {
    const activity = this.activities.get(activityId);
    if (!activity || activity.templateId !== 'collaborative-story') {
      throw new Error('Invalid story activity');
    }

    const currentAuthorId = activity.participants[activity.state.currentAuthor].id;
    if (participantId !== currentAuthorId) {
      throw new Error('Not your turn to contribute');
    }

    activity.state.storyParts.push({
      author: participantId,
      text: contribution,
      timestamp: new Date().toISOString()
    });

    // Move to next author
    activity.state.currentAuthor = 
      (activity.state.currentAuthor + 1) % activity.participants.length;

    this.emit('storyContribution', { activity, contribution });
    return activity;
  }

  answerTriviaQuestion(activityId, participantId, answer) {
    const activity = this.activities.get(activityId);
    if (!activity || activity.templateId !== 'family-trivia') {
      throw new Error('Invalid trivia activity');
    }

    const currentQ = activity.state.questions[activity.state.currentQuestion];
    const isCorrect = answer === currentQ.correct;

    if (!activity.state.answers[activity.state.currentQuestion]) {
      activity.state.answers[activity.state.currentQuestion] = {};
    }
    
    activity.state.answers[activity.state.currentQuestion][participantId] = {
      answer,
      isCorrect,
      timestamp: new Date().toISOString()
    };

    // Update scores
    if (isCorrect) {
      activity.state.scores[participantId] += activity.settings.scoring.correct;
      activity.state.streaks[participantId]++;
      
      // Streak bonus
      if (activity.state.streaks[participantId] >= 3) {
        activity.state.scores[participantId] += activity.settings.scoring.streak;
      }
    } else {
      activity.state.streaks[participantId] = 0;
    }

    // Check if all participants answered
    const totalAnswers = Object.keys(activity.state.answers[activity.state.currentQuestion]).length;
    if (totalAnswers === activity.participants.length) {
      this.nextTriviaQuestion(activityId);
    }

    return { isCorrect, score: activity.state.scores[participantId] };
  }

  // Progress Tracking
  initializeParticipantProgress(activityId, participantId) {
    const key = `${activityId}_${participantId}`;
    this.progress.set(key, {
      startTime: new Date().toISOString(),
      contributions: 0,
      achievements: [],
      experience: 0
    });
  }

  updateProgress(activityId, participantId, update) {
    const key = `${activityId}_${participantId}`;
    const progress = this.progress.get(key) || {};
    
    Object.assign(progress, update);
    this.progress.set(key, progress);

    // Check for achievements
    this.checkAchievements(activityId, participantId, progress);
    
    return progress;
  }

  // Achievement System
  checkAchievements(activityId, participantId, progress) {
    const achievements = [];

    // Participation achievements
    if (progress.contributions === 1) {
      achievements.push({
        id: 'first_contribution',
        name: 'First Steps',
        description: 'Made your first contribution',
        icon: '🌟'
      });
    }

    if (progress.contributions === 10) {
      achievements.push({
        id: 'active_participant',
        name: 'Active Participant',
        description: 'Made 10 contributions',
        icon: '⭐'
      });
    }

    // Add new achievements to progress
    achievements.forEach(achievement => {
      if (!progress.achievements.find(a => a.id === achievement.id)) {
        progress.achievements.push(achievement);
        this.emit('achievementUnlocked', {
          activityId,
          participantId,
          achievement
        });
      }
    });
  }

  // Utility Functions
  generateTriviaQuestions(settings) {
    // In production, this would fetch from a question database
    const questions = [];
    const categories = settings.categories;
    
    for (let round = 0; round < settings.rounds; round++) {
      for (let q = 0; q < settings.questionsPerRound; q++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        questions.push(this.generateQuestion(category, settings.difficulty));
      }
    }
    
    return questions;
  }

  generateQuestion(category, difficulty) {
    // Simplified question generation
    const templates = {
      'Science': [
        { q: 'What planet is known as the Red Planet?', a: 'Mars', options: ['Mars', 'Venus', 'Jupiter', 'Saturn'] },
        { q: 'How many bones are in the human body?', a: '206', options: ['206', '150', '300', '250'] }
      ],
      'History': [
        { q: 'Who was the first President of the United States?', a: 'George Washington', options: ['George Washington', 'Thomas Jefferson', 'John Adams', 'Benjamin Franklin'] }
      ],
      'Family Facts': [
        { q: 'What year was our family founded?', a: 'Custom', options: ['Custom', 'Custom', 'Custom', 'Custom'] }
      ]
    };

    const categoryQuestions = templates[category] || templates['Science'];
    const question = categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];
    
    return {
      category,
      question: question.q,
      correct: question.a,
      options: question.options,
      difficulty
    };
  }

  createCanvas(settings) {
    return {
      width: settings.width,
      height: settings.height,
      layers: [],
      background: settings.background
    };
  }

  nextTriviaQuestion(activityId) {
    const activity = this.activities.get(activityId);
    activity.state.currentQuestion++;
    
    if (activity.state.currentQuestion >= activity.state.questions.length) {
      this.completeActivity(activityId);
    } else {
      this.emit('nextQuestion', {
        activity,
        question: activity.state.questions[activity.state.currentQuestion]
      });
    }
  }

  completeActivity(activityId) {
    const activity = this.activities.get(activityId);
    activity.status = 'completed';
    activity.endTime = new Date().toISOString();
    
    // Calculate results based on activity type
    activity.results = this.calculateResults(activity);
    
    this.emit('activityCompleted', activity);
    return activity;
  }

  calculateResults(activity) {
    switch (activity.templateId) {
      case 'family-trivia':
        return {
          winner: this.getTopScorer(activity.state.scores),
          scores: activity.state.scores,
          correctAnswers: this.countCorrectAnswers(activity.state.answers)
        };
      case 'collaborative-story':
        return {
          story: activity.state.storyParts.map(p => p.text).join(' '),
          contributors: activity.participants.length,
          wordCount: activity.state.storyParts.reduce((sum, p) => sum + p.text.split(' ').length, 0)
        };
      default:
        return { completed: true };
    }
  }

  getTopScorer(scores) {
    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1])[0];
  }

  countCorrectAnswers(answers) {
    let correct = 0;
    Object.values(answers).forEach(questionAnswers => {
      Object.values(questionAnswers).forEach(answer => {
        if (answer.isCorrect) correct++;
      });
    });
    return correct;
  }
}

module.exports = FamilyActivities;