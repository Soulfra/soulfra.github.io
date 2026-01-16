// MemoryHelper.js - Cognitive assistance features for seniors

const EventEmitter = require('events');
const crypto = require('crypto');

class MemoryHelper extends EventEmitter {
  constructor() {
    super();
    this.users = new Map();
    this.memories = new Map();
    this.cognitiveProfiles = new Map();
    this.exercises = new Map();
    this.reminders = new Map();
    this.associations = new Map();
    this.initializeExercises();
  }

  // Cognitive Profile Management
  createCognitiveProfile(userId, assessment) {
    const profileId = `cognitive_${crypto.randomBytes(8).toString('hex')}`;
    const profile = {
      id: profileId,
      userId,
      created: new Date().toISOString(),
      baselineAssessment: {
        shortTermMemory: assessment.shortTermMemory || 'moderate',
        longTermMemory: assessment.longTermMemory || 'good',
        workingMemory: assessment.workingMemory || 'moderate',
        proceduralMemory: assessment.proceduralMemory || 'good',
        recognitionMemory: assessment.recognitionMemory || 'good'
      },
      strengths: this.identifyStrengths(assessment),
      challenges: this.identifyChallenges(assessment),
      strategies: this.recommendStrategies(assessment),
      progressTracking: {
        exercises: [],
        improvements: [],
        lastAssessment: new Date().toISOString()
      },
      preferences: {
        exerciseTypes: assessment.preferences || ['visual', 'verbal', 'associative'],
        difficulty: assessment.difficulty || 'adaptive',
        sessionLength: assessment.sessionLength || 15,
        reminderStyle: assessment.reminderStyle || 'gentle'
      }
    };

    this.cognitiveProfiles.set(profileId, profile);
    this.setupPersonalizedProgram(userId, profile);
    this.emit('profileCreated', profile);
    
    return profile;
  }

  identifyStrengths(assessment) {
    const strengths = [];
    
    if (assessment.longTermMemory === 'good' || assessment.longTermMemory === 'excellent') {
      strengths.push({
        area: 'long_term_memory',
        description: 'Strong recall of past events and experiences',
        leverage: 'Use familiar memories as anchors for new information'
      });
    }
    
    if (assessment.recognitionMemory === 'good' || assessment.recognitionMemory === 'excellent') {
      strengths.push({
        area: 'recognition',
        description: 'Good at recognizing familiar faces and objects',
        leverage: 'Use visual cues and associations'
      });
    }
    
    if (assessment.proceduralMemory === 'good' || assessment.proceduralMemory === 'excellent') {
      strengths.push({
        area: 'procedural',
        description: 'Retains skills and routines well',
        leverage: 'Build on existing routines and habits'
      });
    }
    
    return strengths;
  }

  identifyChallenges(assessment) {
    const challenges = [];
    
    if (assessment.shortTermMemory === 'poor' || assessment.shortTermMemory === 'very_poor') {
      challenges.push({
        area: 'short_term_memory',
        impact: 'Difficulty remembering recent events or new information',
        support: 'Use frequent reminders and written notes'
      });
    }
    
    if (assessment.workingMemory === 'poor' || assessment.workingMemory === 'very_poor') {
      challenges.push({
        area: 'working_memory',
        impact: 'Difficulty with multi-step tasks',
        support: 'Break tasks into single steps with clear instructions'
      });
    }
    
    return challenges;
  }

  recommendStrategies(assessment) {
    const strategies = [];
    
    // Universal helpful strategies
    strategies.push({
      name: 'routine_reinforcement',
      description: 'Establish and maintain daily routines',
      implementation: 'Use consistent times for meals, medications, and activities'
    });
    
    strategies.push({
      name: 'visual_aids',
      description: 'Use pictures and visual cues',
      implementation: 'Label items, use photo reminders, color coding'
    });
    
    // Specific strategies based on challenges
    if (assessment.shortTermMemory === 'poor') {
      strategies.push({
        name: 'external_memory_aids',
        description: 'Use calendars, notes, and digital reminders',
        implementation: 'Place reminders in frequently visited locations'
      });
    }
    
    if (assessment.workingMemory === 'poor') {
      strategies.push({
        name: 'task_simplification',
        description: 'Break complex tasks into simple steps',
        implementation: 'One instruction at a time, with completion checks'
      });
    }
    
    return strategies;
  }

  // Memory Storage and Retrieval
  storeMemory(userId, memory) {
    const userMemories = this.memories.get(userId) || [];
    
    const memoryRecord = {
      id: `memory_${crypto.randomBytes(8).toString('hex')}`,
      userId,
      type: memory.type, // 'personal', 'factual', 'procedural', 'event'
      category: memory.category, // 'family', 'work', 'hobby', 'daily_life'
      content: memory.content,
      associations: memory.associations || [],
      importance: memory.importance || 'normal',
      created: new Date().toISOString(),
      lastAccessed: null,
      accessCount: 0,
      triggers: this.identifyTriggers(memory),
      emotionalTone: memory.emotionalTone || 'neutral',
      veracity: memory.veracity || 'unverified',
      metadata: memory.metadata || {}
    };
    
    userMemories.push(memoryRecord);
    this.memories.set(userId, userMemories);
    
    // Create associations
    this.createAssociations(memoryRecord);
    
    this.emit('memoryStored', memoryRecord);
    return memoryRecord;
  }

  identifyTriggers(memory) {
    const triggers = [];
    const content = memory.content.toLowerCase();
    
    // Time triggers
    const timePatterns = [
      /morning|breakfast|wake up/,
      /afternoon|lunch/,
      /evening|dinner|bedtime/
    ];
    
    timePatterns.forEach((pattern, index) => {
      if (pattern.test(content)) {
        triggers.push({
          type: 'time',
          value: ['morning', 'afternoon', 'evening'][index]
        });
      }
    });
    
    // Location triggers
    const locations = ['home', 'kitchen', 'bedroom', 'garden', 'church', 'store'];
    locations.forEach(location => {
      if (content.includes(location)) {
        triggers.push({ type: 'location', value: location });
      }
    });
    
    // People triggers
    const peoplePattern = /\b(daughter|son|husband|wife|friend|doctor|grandchild)\b/g;
    const matches = content.match(peoplePattern);
    if (matches) {
      matches.forEach(person => {
        triggers.push({ type: 'person', value: person });
      });
    }
    
    return triggers;
  }

  createAssociations(memory) {
    const associations = this.associations.get(memory.userId) || new Map();
    
    // Create associations based on triggers
    memory.triggers.forEach(trigger => {
      const key = `${trigger.type}_${trigger.value}`;
      const associated = associations.get(key) || [];
      associated.push(memory.id);
      associations.set(key, associated);
    });
    
    // Create word associations
    const words = memory.content.toLowerCase().split(/\s+/);
    const significantWords = words.filter(word => 
      word.length > 4 && !this.isCommonWord(word)
    );
    
    significantWords.forEach(word => {
      const key = `word_${word}`;
      const associated = associations.get(key) || [];
      associated.push(memory.id);
      associations.set(key, associated);
    });
    
    this.associations.set(memory.userId, associations);
  }

  isCommonWord(word) {
    const commonWords = ['have', 'that', 'with', 'this', 'will', 'your', 'from', 'they', 'been', 'more'];
    return commonWords.includes(word);
  }

  // Memory Retrieval
  retrieveMemory(userId, query) {
    const userMemories = this.memories.get(userId) || [];
    const associations = this.associations.get(userId) || new Map();
    
    // Search strategies
    const results = [];
    
    // 1. Direct keyword search
    const keywords = query.toLowerCase().split(/\s+/);
    userMemories.forEach(memory => {
      const content = memory.content.toLowerCase();
      const matchCount = keywords.filter(keyword => content.includes(keyword)).length;
      if (matchCount > 0) {
        results.push({
          memory,
          relevance: matchCount / keywords.length,
          matchType: 'keyword'
        });
      }
    });
    
    // 2. Association search
    keywords.forEach(keyword => {
      const wordKey = `word_${keyword}`;
      const associatedIds = associations.get(wordKey) || [];
      associatedIds.forEach(id => {
        const memory = userMemories.find(m => m.id === id);
        if (memory && !results.find(r => r.memory.id === id)) {
          results.push({
            memory,
            relevance: 0.7,
            matchType: 'association'
          });
        }
      });
    });
    
    // 3. Trigger-based search
    const triggers = this.identifyTriggers({ content: query });
    triggers.forEach(trigger => {
      const triggerKey = `${trigger.type}_${trigger.value}`;
      const associatedIds = associations.get(triggerKey) || [];
      associatedIds.forEach(id => {
        const memory = userMemories.find(m => m.id === id);
        if (memory && !results.find(r => r.memory.id === id)) {
          results.push({
            memory,
            relevance: 0.5,
            matchType: 'trigger'
          });
        }
      });
    });
    
    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);
    
    // Update access tracking
    results.forEach(result => {
      result.memory.lastAccessed = new Date().toISOString();
      result.memory.accessCount++;
    });
    
    return results.slice(0, 5); // Return top 5 matches
  }

  // Reminder System
  createMemoryReminder(userId, reminderInfo) {
    const reminder = {
      id: `reminder_${crypto.randomBytes(8).toString('hex')}`,
      userId,
      type: reminderInfo.type || 'memory_prompt',
      memory: reminderInfo.memory,
      schedule: reminderInfo.schedule || 'daily',
      time: reminderInfo.time,
      prompt: reminderInfo.prompt || this.generatePrompt(reminderInfo.memory),
      active: true,
      created: new Date().toISOString(),
      lastTriggered: null,
      responses: []
    };
    
    const userReminders = this.reminders.get(userId) || [];
    userReminders.push(reminder);
    this.reminders.set(userId, userReminders);
    
    this.emit('reminderCreated', reminder);
    return reminder;
  }

  generatePrompt(memory) {
    const prompts = {
      family: [
        "Do you remember this about your family?",
        "Let's think about your loved ones.",
        "This is a special family memory."
      ],
      daily_routine: [
        "This is part of your daily routine.",
        "Remember to do this today.",
        "This is something you do regularly."
      ],
      important: [
        "This is important to remember.",
        "Let me help you recall this.",
        "This is something significant."
      ]
    };
    
    const category = memory.category || 'general';
    const promptList = prompts[category] || prompts.important;
    return promptList[Math.floor(Math.random() * promptList.length)];
  }

  // Cognitive Exercises
  initializeExercises() {
    // Memory exercises
    this.exercises.set('word_pairs', {
      name: 'Word Pair Association',
      type: 'memory',
      description: 'Remember pairs of related words',
      difficulty: ['easy', 'medium', 'hard'],
      benefits: ['associative_memory', 'verbal_memory'],
      generator: (difficulty) => this.generateWordPairs(difficulty)
    });

    this.exercises.set('story_recall', {
      name: 'Story Recall',
      type: 'memory',
      description: 'Listen to a story and answer questions',
      difficulty: ['easy', 'medium'],
      benefits: ['comprehension', 'sequential_memory'],
      generator: (difficulty) => this.generateStoryRecall(difficulty)
    });

    this.exercises.set('face_name', {
      name: 'Face-Name Association',
      type: 'memory',
      description: 'Match names with faces',
      difficulty: ['easy', 'medium', 'hard'],
      benefits: ['recognition_memory', 'social_memory'],
      generator: (difficulty) => this.generateFaceNameExercise(difficulty)
    });

    // Attention exercises
    this.exercises.set('find_differences', {
      name: 'Find the Differences',
      type: 'attention',
      description: 'Spot differences between two similar images',
      difficulty: ['easy', 'medium'],
      benefits: ['visual_attention', 'concentration'],
      generator: (difficulty) => this.generateFindDifferences(difficulty)
    });

    // Executive function exercises
    this.exercises.set('sequence_order', {
      name: 'Sequence Ordering',
      type: 'executive',
      description: 'Put items in the correct order',
      difficulty: ['easy', 'medium'],
      benefits: ['planning', 'organization'],
      generator: (difficulty) => this.generateSequenceOrder(difficulty)
    });

    // Language exercises
    this.exercises.set('word_finding', {
      name: 'Word Finding',
      type: 'language',
      description: 'Find words in categories',
      difficulty: ['easy', 'medium'],
      benefits: ['vocabulary', 'categorical_thinking'],
      generator: (difficulty) => this.generateWordFinding(difficulty)
    });
  }

  generateWordPairs(difficulty) {
    const pairs = {
      easy: [
        ['cat', 'meow'],
        ['dog', 'bark'],
        ['sun', 'bright'],
        ['moon', 'night'],
        ['flower', 'garden']
      ],
      medium: [
        ['ocean', 'wave'],
        ['mountain', 'peak'],
        ['library', 'book'],
        ['kitchen', 'cook'],
        ['music', 'melody']
      ],
      hard: [
        ['democracy', 'vote'],
        ['philosophy', 'wisdom'],
        ['economy', 'trade'],
        ['biology', 'life'],
        ['astronomy', 'stars']
      ]
    };

    const selectedPairs = pairs[difficulty] || pairs.easy;
    const exercisePairs = this.shuffleArray(selectedPairs).slice(0, 5);
    
    return {
      phase: 'study',
      instruction: 'Remember these word pairs',
      pairs: exercisePairs,
      duration: difficulty === 'easy' ? 30 : difficulty === 'medium' ? 20 : 15,
      testPhase: {
        instruction: 'What word goes with...',
        questions: exercisePairs.map(pair => ({
          prompt: pair[0],
          answer: pair[1]
        }))
      }
    };
  }

  generateStoryRecall(difficulty) {
    const stories = {
      easy: {
        text: 'Mary went to the store. She bought milk and bread. On her way home, she met her friend Susan. They talked about the weather.',
        questions: [
          { q: 'Where did Mary go?', a: 'store', options: ['store', 'park', 'church'] },
          { q: 'What did Mary buy?', a: 'milk and bread', options: ['milk and bread', 'eggs', 'fruit'] },
          { q: 'Who did Mary meet?', a: 'Susan', options: ['Susan', 'John', 'Betty'] }
        ]
      },
      medium: {
        text: 'Robert decided to plant a garden in his backyard. He went to the garden center on Saturday morning and bought tomato plants, lettuce seeds, and a new watering can. His grandson Tommy helped him dig the holes. They finished planting by lunchtime and celebrated with lemonade.',
        questions: [
          { q: 'What day did Robert go to the garden center?', a: 'Saturday', options: ['Saturday', 'Sunday', 'Friday'] },
          { q: 'What vegetables did Robert plant?', a: 'tomatoes and lettuce', options: ['tomatoes and lettuce', 'carrots and beans', 'peppers and corn'] },
          { q: 'Who helped Robert?', a: 'Tommy', options: ['Tommy', 'Billy', 'Johnny'] },
          { q: 'What did they drink after planting?', a: 'lemonade', options: ['lemonade', 'water', 'tea'] }
        ]
      }
    };

    const story = stories[difficulty] || stories.easy;
    return {
      phase: 'listen',
      story: story.text,
      readingTime: difficulty === 'easy' ? 60 : 90,
      questions: story.questions
    };
  }

  generateFaceNameExercise(difficulty) {
    const names = {
      easy: ['John', 'Mary', 'Bob', 'Sue', 'Tom'],
      medium: ['William', 'Elizabeth', 'Robert', 'Patricia', 'Michael'],
      hard: ['Alexander', 'Margaret', 'Christopher', 'Jennifer', 'Benjamin']
    };

    const faceDescriptions = [
      { features: 'gray hair, glasses', emoji: '👴' },
      { features: 'white hair, kind smile', emoji: '👵' },
      { features: 'bald, mustache', emoji: '👨‍🦲' },
      { features: 'curly hair, glasses', emoji: '👩‍🦱' },
      { features: 'short hair, beard', emoji: '🧔' }
    ];

    const selectedNames = names[difficulty] || names.easy;
    const pairs = selectedNames.map((name, index) => ({
      name,
      face: faceDescriptions[index]
    }));

    return {
      phase: 'study',
      instruction: 'Remember these people\'s names',
      pairs: pairs,
      studyTime: difficulty === 'easy' ? 45 : 30,
      testPhase: {
        instruction: 'What is this person\'s name?',
        questions: this.shuffleArray(pairs).map(pair => ({
          face: pair.face,
          answer: pair.name,
          options: this.generateNameOptions(pair.name, selectedNames)
        }))
      }
    };
  }

  generateNameOptions(correctName, allNames) {
    const options = [correctName];
    const otherNames = allNames.filter(n => n !== correctName);
    
    while (options.length < 3) {
      const randomName = otherNames[Math.floor(Math.random() * otherNames.length)];
      if (!options.includes(randomName)) {
        options.push(randomName);
      }
    }
    
    return this.shuffleArray(options);
  }

  generateFindDifferences(difficulty) {
    // Simplified version using emoji scenes
    const scenes = {
      easy: {
        scene1: '🏠 🌳 🐶 ☀️ 🌸',
        scene2: '🏠 🌲 🐶 ☀️ 🌸', // tree different
        differences: 1,
        hint: 'Look at the tree'
      },
      medium: {
        scene1: '🏠 🌳 🐶 ☀️ 🌸 🚗 🐱',
        scene2: '🏠 🌲 🐱 ☁️ 🌸 🚗 🐱', // tree, pet swap, weather
        differences: 3,
        hint: 'Check the tree, weather, and pets'
      }
    };

    const scene = scenes[difficulty] || scenes.easy;
    return {
      instruction: `Find ${scene.differences} difference${scene.differences > 1 ? 's' : ''}`,
      scene1: scene.scene1,
      scene2: scene.scene2,
      timeLimit: difficulty === 'easy' ? 60 : 90,
      hint: scene.hint,
      differences: scene.differences
    };
  }

  generateSequenceOrder(difficulty) {
    const sequences = {
      easy: [
        {
          type: 'daily_routine',
          items: ['Wake up', 'Brush teeth', 'Eat breakfast', 'Get dressed'],
          scrambled: ['Eat breakfast', 'Wake up', 'Get dressed', 'Brush teeth']
        },
        {
          type: 'cooking',
          items: ['Get ingredients', 'Mix ingredients', 'Bake in oven', 'Let cool'],
          scrambled: ['Bake in oven', 'Get ingredients', 'Let cool', 'Mix ingredients']
        }
      ],
      medium: [
        {
          type: 'letter_writing',
          items: ['Get paper', 'Write address', 'Write message', 'Sign name', 'Put in envelope', 'Add stamp'],
          scrambled: ['Write message', 'Add stamp', 'Get paper', 'Put in envelope', 'Write address', 'Sign name']
        },
        {
          type: 'gardening',
          items: ['Choose location', 'Prepare soil', 'Plant seeds', 'Water plants', 'Add mulch', 'Watch grow'],
          scrambled: ['Water plants', 'Choose location', 'Watch grow', 'Plant seeds', 'Prepare soil', 'Add mulch']
        }
      ]
    };

    const sequenceList = sequences[difficulty] || sequences.easy;
    const selected = sequenceList[Math.floor(Math.random() * sequenceList.length)];
    
    return {
      instruction: `Put these ${selected.type.replace('_', ' ')} steps in order`,
      items: selected.scrambled,
      correctOrder: selected.items,
      type: selected.type
    };
  }

  generateWordFinding(difficulty) {
    const categories = {
      easy: [
        { category: 'Animals', letter: 'C', examples: ['cat', 'cow', 'chicken', 'camel'] },
        { category: 'Foods', letter: 'B', examples: ['bread', 'banana', 'butter', 'beans'] },
        { category: 'Colors', letter: 'B', examples: ['blue', 'black', 'brown', 'beige'] }
      ],
      medium: [
        { category: 'Countries', letter: 'S', examples: ['Spain', 'Sweden', 'Switzerland', 'Scotland'] },
        { category: 'Occupations', letter: 'T', examples: ['teacher', 'tailor', 'taxi driver', 'therapist'] },
        { category: 'Kitchen items', letter: 'P', examples: ['pot', 'pan', 'plate', 'pitcher'] }
      ]
    };

    const categoryList = categories[difficulty] || categories.easy;
    const selected = categoryList[Math.floor(Math.random() * categoryList.length)];
    
    return {
      instruction: `Name as many ${selected.category} that start with ${selected.letter}`,
      category: selected.category,
      letter: selected.letter,
      timeLimit: 60,
      minimumWords: difficulty === 'easy' ? 3 : 5,
      examples: selected.examples // For validation
    };
  }

  // Exercise Session Management
  startExerciseSession(userId, exerciseType, difficulty) {
    const exercise = this.exercises.get(exerciseType);
    if (!exercise) throw new Error('Exercise type not found');

    const profile = this.cognitiveProfiles.get(userId);
    if (!profile) throw new Error('Cognitive profile not found');

    const sessionId = `session_${crypto.randomBytes(8).toString('hex')}`;
    const exerciseData = exercise.generator(difficulty || 'easy');
    
    const session = {
      id: sessionId,
      userId,
      exerciseType,
      exerciseName: exercise.name,
      difficulty,
      startTime: new Date(),
      data: exerciseData,
      responses: [],
      score: 0,
      status: 'active',
      phase: exerciseData.phase || 'start'
    };

    this.emit('exerciseStarted', session);
    return session;
  }

  submitExerciseResponse(sessionId, response) {
    // Implementation would track responses and calculate scores
    // This would integrate with the specific exercise logic
  }

  // Memory Support Tools
  createMemoryAid(userId, aidType, content) {
    const aids = {
      photo_reminder: {
        type: 'visual',
        format: 'photo_with_caption',
        usage: 'Display photo with associated information'
      },
      voice_note: {
        type: 'audio',
        format: 'recorded_message',
        usage: 'Play recorded reminder in familiar voice'
      },
      routine_chart: {
        type: 'visual_sequential',
        format: 'step_by_step_images',
        usage: 'Guide through daily routines'
      },
      medication_organizer: {
        type: 'physical_digital',
        format: 'day_time_grid',
        usage: 'Track medication schedule'
      }
    };

    const aid = aids[aidType];
    if (!aid) throw new Error('Unknown memory aid type');

    const memoryAid = {
      id: `aid_${crypto.randomBytes(8).toString('hex')}`,
      userId,
      type: aidType,
      ...aid,
      content,
      created: new Date().toISOString(),
      lastUsed: null,
      effectiveness: null
    };

    this.emit('memoryAidCreated', memoryAid);
    return memoryAid;
  }

  // Progress Tracking
  assessProgress(userId) {
    const profile = this.cognitiveProfiles.get(userId);
    if (!profile) return null;

    const exercises = profile.progressTracking.exercises;
    const recentExercises = exercises.filter(e => {
      const exerciseDate = new Date(e.completedAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return exerciseDate > thirtyDaysAgo;
    });

    const analysis = {
      exercisesCompleted: recentExercises.length,
      averageScore: this.calculateAverageScore(recentExercises),
      strongAreas: this.identifyStrongAreas(recentExercises),
      improvementAreas: this.identifyImprovementAreas(recentExercises),
      trend: this.calculateTrend(exercises),
      recommendations: this.generateRecommendations(profile, recentExercises)
    };

    return analysis;
  }

  calculateAverageScore(exercises) {
    if (exercises.length === 0) return 0;
    const totalScore = exercises.reduce((sum, e) => sum + (e.score || 0), 0);
    return Math.round(totalScore / exercises.length);
  }

  identifyStrongAreas(exercises) {
    const typeScores = {};
    
    exercises.forEach(exercise => {
      if (!typeScores[exercise.type]) {
        typeScores[exercise.type] = { total: 0, count: 0 };
      }
      typeScores[exercise.type].total += exercise.score || 0;
      typeScores[exercise.type].count++;
    });

    const averages = Object.entries(typeScores).map(([type, data]) => ({
      type,
      average: data.total / data.count
    }));

    return averages
      .filter(a => a.average >= 80)
      .map(a => a.type);
  }

  identifyImprovementAreas(exercises) {
    const typeScores = {};
    
    exercises.forEach(exercise => {
      if (!typeScores[exercise.type]) {
        typeScores[exercise.type] = { total: 0, count: 0 };
      }
      typeScores[exercise.type].total += exercise.score || 0;
      typeScores[exercise.type].count++;
    });

    const averages = Object.entries(typeScores).map(([type, data]) => ({
      type,
      average: data.total / data.count
    }));

    return averages
      .filter(a => a.average < 60)
      .map(a => a.type);
  }

  calculateTrend(allExercises) {
    if (allExercises.length < 10) return 'insufficient_data';

    const recent = allExercises.slice(-5);
    const previous = allExercises.slice(-10, -5);
    
    const recentAvg = this.calculateAverageScore(recent);
    const previousAvg = this.calculateAverageScore(previous);
    
    if (recentAvg > previousAvg + 5) return 'improving';
    if (recentAvg < previousAvg - 5) return 'declining';
    return 'stable';
  }

  generateRecommendations(profile, exercises) {
    const recommendations = [];
    
    // Exercise frequency
    if (exercises.length < 10) {
      recommendations.push({
        type: 'frequency',
        message: 'Try to complete exercises more regularly',
        suggestion: '3-4 times per week for best results'
      });
    }
    
    // Difficulty adjustment
    const avgScore = this.calculateAverageScore(exercises);
    if (avgScore > 90) {
      recommendations.push({
        type: 'difficulty',
        message: 'You\'re doing great! Consider trying harder exercises',
        suggestion: 'Increase difficulty level'
      });
    } else if (avgScore < 50) {
      recommendations.push({
        type: 'difficulty',
        message: 'Consider easier exercises to build confidence',
        suggestion: 'Decrease difficulty level'
      });
    }
    
    // Variety
    const exerciseTypes = new Set(exercises.map(e => e.type));
    if (exerciseTypes.size < 3) {
      recommendations.push({
        type: 'variety',
        message: 'Try different types of exercises',
        suggestion: 'Mix memory, attention, and language exercises'
      });
    }
    
    return recommendations;
  }

  // Helper Methods
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  setupPersonalizedProgram(userId, profile) {
    // Create a personalized exercise schedule
    const schedule = {
      monday: ['word_pairs', 'easy'],
      wednesday: ['story_recall', 'easy'],
      friday: ['face_name', 'easy'],
      sunday: ['word_finding', 'easy']
    };
    
    // Adjust based on profile
    if (profile.baselineAssessment.shortTermMemory === 'poor') {
      schedule.tuesday = ['word_pairs', 'easy'];
      schedule.thursday = ['word_pairs', 'easy'];
    }
    
    this.emit('programCreated', { userId, schedule });
    return schedule;
  }
}

module.exports = MemoryHelper;