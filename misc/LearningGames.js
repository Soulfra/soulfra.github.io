// LearningGames.js - Educational consciousness games for children

const EventEmitter = require('events');
const crypto = require('crypto');

class LearningGames extends EventEmitter {
  constructor() {
    super();
    this.games = new Map();
    this.playerProgress = new Map();
    this.achievements = new Map();
    this.curriculum = new Map();
    this.initializeGames();
    this.initializeCurriculum();
  }

  initializeGames() {
    // Math Games
    this.games.set('number-adventure', {
      id: 'number-adventure',
      name: 'Number Adventure',
      category: 'math',
      ageRange: { min: 4, max: 8 },
      skills: ['counting', 'addition', 'subtraction'],
      description: 'Help the numbers find their way home!',
      levels: [
        {
          id: 1,
          name: 'Counting Castle',
          objective: 'Count objects to unlock doors',
          difficulty: 'easy',
          exercises: this.generateCountingExercises(1, 10)
        },
        {
          id: 2,
          name: 'Addition Island',
          objective: 'Add numbers to build bridges',
          difficulty: 'medium',
          exercises: this.generateAdditionExercises(1, 5)
        },
        {
          id: 3,
          name: 'Subtraction Sea',
          objective: 'Subtract to sail the ship',
          difficulty: 'medium',
          exercises: this.generateSubtractionExercises(1, 10)
        }
      ]
    });

    // Reading Games
    this.games.set('word-wizard', {
      id: 'word-wizard',
      name: 'Word Wizard',
      category: 'reading',
      ageRange: { min: 5, max: 10 },
      skills: ['phonics', 'vocabulary', 'comprehension'],
      description: 'Cast spells with the power of words!',
      levels: [
        {
          id: 1,
          name: 'Letter Land',
          objective: 'Match letters and sounds',
          difficulty: 'easy',
          exercises: this.generatePhonicsExercises()
        },
        {
          id: 2,
          name: 'Word Forest',
          objective: 'Build words from letters',
          difficulty: 'medium',
          exercises: this.generateWordBuildingExercises()
        },
        {
          id: 3,
          name: 'Story Mountain',
          objective: 'Read and understand short stories',
          difficulty: 'hard',
          exercises: this.generateReadingComprehensionExercises()
        }
      ]
    });

    // Science Games
    this.games.set('science-explorer', {
      id: 'science-explorer',
      name: 'Science Explorer',
      category: 'science',
      ageRange: { min: 6, max: 12 },
      skills: ['observation', 'hypothesis', 'experimentation'],
      description: 'Discover the wonders of science!',
      levels: [
        {
          id: 1,
          name: 'Nature Detective',
          objective: 'Observe and classify living things',
          difficulty: 'easy',
          exercises: this.generateNatureScienceExercises()
        },
        {
          id: 2,
          name: 'Space Voyager',
          objective: 'Explore the solar system',
          difficulty: 'medium',
          exercises: this.generateSpaceScienceExercises()
        },
        {
          id: 3,
          name: 'Chemistry Kitchen',
          objective: 'Safe chemistry experiments',
          difficulty: 'hard',
          exercises: this.generateChemistryExercises()
        }
      ]
    });

    // Logic & Problem Solving
    this.games.set('puzzle-palace', {
      id: 'puzzle-palace',
      name: 'Puzzle Palace',
      category: 'logic',
      ageRange: { min: 5, max: 14 },
      skills: ['pattern-recognition', 'logical-thinking', 'problem-solving'],
      description: 'Solve puzzles to unlock magical treasures!',
      levels: [
        {
          id: 1,
          name: 'Pattern Park',
          objective: 'Complete patterns and sequences',
          difficulty: 'easy',
          exercises: this.generatePatternExercises()
        },
        {
          id: 2,
          name: 'Logic Lab',
          objective: 'Solve logic puzzles',
          difficulty: 'medium',
          exercises: this.generateLogicPuzzles()
        },
        {
          id: 3,
          name: 'Code Cave',
          objective: 'Learn basic coding concepts',
          difficulty: 'hard',
          exercises: this.generateCodingChallenges()
        }
      ]
    });

    // Creativity & Art
    this.games.set('creative-cosmos', {
      id: 'creative-cosmos',
      name: 'Creative Cosmos',
      category: 'creativity',
      ageRange: { min: 4, max: 12 },
      skills: ['imagination', 'artistic-expression', 'storytelling'],
      description: 'Express yourself through art and stories!',
      activities: [
        {
          id: 'color-mixing',
          name: 'Color Magic',
          objective: 'Learn about colors and mixing',
          type: 'interactive'
        },
        {
          id: 'shape-builder',
          name: 'Shape Builder',
          objective: 'Create art with shapes',
          type: 'creative'
        },
        {
          id: 'story-creator',
          name: 'Story Creator',
          objective: 'Write and illustrate stories',
          type: 'narrative'
        }
      ]
    });
  }

  initializeCurriculum() {
    // Age-based learning paths
    this.curriculum.set('early-learner', {
      ageRange: { min: 4, max: 6 },
      focus: ['basic-counting', 'letter-recognition', 'colors-shapes'],
      recommendedGames: ['number-adventure', 'creative-cosmos'],
      dailyGoals: {
        math: 15,
        reading: 15,
        creative: 20
      }
    });

    this.curriculum.set('elementary', {
      ageRange: { min: 7, max: 10 },
      focus: ['arithmetic', 'reading-comprehension', 'basic-science'],
      recommendedGames: ['word-wizard', 'science-explorer', 'puzzle-palace'],
      dailyGoals: {
        math: 20,
        reading: 20,
        science: 15,
        logic: 15
      }
    });

    this.curriculum.set('advanced', {
      ageRange: { min: 11, max: 14 },
      focus: ['problem-solving', 'advanced-math', 'scientific-method'],
      recommendedGames: ['puzzle-palace', 'science-explorer'],
      dailyGoals: {
        math: 25,
        science: 20,
        logic: 20,
        creative: 15
      }
    });
  }

  // Exercise Generators
  generateCountingExercises(min, max) {
    const exercises = [];
    for (let i = 0; i < 10; i++) {
      const count = Math.floor(Math.random() * (max - min + 1)) + min;
      exercises.push({
        id: `count_${i}`,
        type: 'counting',
        question: `Count the ${this.getRandomObject(count)}`,
        answer: count,
        visual: this.generateVisualArray(count),
        points: 10
      });
    }
    return exercises;
  }

  generateAdditionExercises(min, max) {
    const exercises = [];
    for (let i = 0; i < 10; i++) {
      const a = Math.floor(Math.random() * max) + min;
      const b = Math.floor(Math.random() * max) + min;
      exercises.push({
        id: `add_${i}`,
        type: 'addition',
        question: `${a} + ${b} = ?`,
        visual: `${this.getNumberEmoji(a)} + ${this.getNumberEmoji(b)}`,
        answer: a + b,
        points: 15
      });
    }
    return exercises;
  }

  generateSubtractionExercises(min, max) {
    const exercises = [];
    for (let i = 0; i < 10; i++) {
      const a = Math.floor(Math.random() * max) + min;
      const b = Math.floor(Math.random() * Math.min(a, max)) + min;
      exercises.push({
        id: `sub_${i}`,
        type: 'subtraction',
        question: `${a} - ${b} = ?`,
        visual: `${this.getNumberEmoji(a)} - ${this.getNumberEmoji(b)}`,
        answer: a - b,
        points: 15
      });
    }
    return exercises;
  }

  generatePhonicsExercises() {
    const exercises = [];
    const phonics = [
      { letter: 'A', sound: 'ah', words: ['apple', 'ant', 'alligator'] },
      { letter: 'B', sound: 'buh', words: ['ball', 'bear', 'butterfly'] },
      { letter: 'C', sound: 'kuh', words: ['cat', 'car', 'cake'] }
    ];

    phonics.forEach((phonic, i) => {
      exercises.push({
        id: `phonic_${i}`,
        type: 'phonics',
        question: `Which word starts with ${phonic.letter}?`,
        options: this.shuffleArray([...phonic.words, 'dog', 'fish']).slice(0, 3),
        answer: phonic.words[0],
        points: 20
      });
    });
    return exercises;
  }

  generateWordBuildingExercises() {
    const exercises = [];
    const words = [
      { word: 'cat', letters: ['c', 'a', 't'], hint: '🐱' },
      { word: 'dog', letters: ['d', 'o', 'g'], hint: '🐶' },
      { word: 'sun', letters: ['s', 'u', 'n'], hint: '☀️' },
      { word: 'moon', letters: ['m', 'o', 'o', 'n'], hint: '🌙' }
    ];

    words.forEach((item, i) => {
      exercises.push({
        id: `word_${i}`,
        type: 'word_building',
        hint: item.hint,
        letters: this.shuffleArray(item.letters),
        answer: item.word,
        points: 25
      });
    });
    return exercises;
  }

  generateReadingComprehensionExercises() {
    const stories = [
      {
        text: 'The little bird was hungry. It flew to the tree and found a red apple. The bird was happy!',
        questions: [
          {
            question: 'What was the bird looking for?',
            options: ['Food', 'Water', 'Friends'],
            answer: 'Food'
          },
          {
            question: 'What color was the apple?',
            options: ['Green', 'Red', 'Yellow'],
            answer: 'Red'
          }
        ]
      }
    ];

    const exercises = [];
    stories.forEach((story, i) => {
      story.questions.forEach((q, j) => {
        exercises.push({
          id: `comprehension_${i}_${j}`,
          type: 'comprehension',
          story: story.text,
          question: q.question,
          options: q.options,
          answer: q.answer,
          points: 30
        });
      });
    });
    return exercises;
  }

  generateNatureScienceExercises() {
    return [
      {
        id: 'nature_1',
        type: 'classification',
        question: 'Which of these is a living thing?',
        options: ['Rock', 'Tree', 'Water', 'Sand'],
        answer: 'Tree',
        explanation: 'Trees are living things that grow, need water, and make oxygen!',
        points: 20
      },
      {
        id: 'nature_2',
        type: 'observation',
        question: 'What do plants need to grow?',
        options: ['Sunlight and water', 'Just darkness', 'Only soil', 'Just air'],
        answer: 'Sunlight and water',
        explanation: 'Plants need sunlight, water, air, and nutrients from soil to grow!',
        points: 25
      }
    ];
  }

  generateSpaceScienceExercises() {
    return [
      {
        id: 'space_1',
        type: 'identification',
        question: 'Which planet is closest to the Sun?',
        options: ['Earth', 'Mercury', 'Mars', 'Venus'],
        answer: 'Mercury',
        visual: '☀️ 🪐 🌍 🔴',
        points: 30
      },
      {
        id: 'space_2',
        type: 'facts',
        question: 'How many planets are in our solar system?',
        options: ['7', '8', '9', '10'],
        answer: '8',
        explanation: 'Our solar system has 8 planets orbiting the Sun!',
        points: 25
      }
    ];
  }

  generateChemistryExercises() {
    return [
      {
        id: 'chem_1',
        type: 'experiment',
        question: 'What happens when you mix baking soda and vinegar?',
        options: ['It freezes', 'It bubbles', 'It turns blue', 'Nothing'],
        answer: 'It bubbles',
        explanation: 'The reaction creates carbon dioxide gas, making bubbles!',
        safetyNote: 'Always do experiments with adult supervision',
        points: 35
      }
    ];
  }

  generatePatternExercises() {
    const patterns = [
      {
        sequence: ['🔴', '🔵', '🔴', '🔵', '?'],
        answer: '🔴',
        type: 'color'
      },
      {
        sequence: ['1', '2', '3', '4', '?'],
        answer: '5',
        type: 'number'
      },
      {
        sequence: ['■', '▲', '●', '■', '▲', '?'],
        answer: '●',
        type: 'shape'
      }
    ];

    return patterns.map((pattern, i) => ({
      id: `pattern_${i}`,
      type: 'pattern',
      sequence: pattern.sequence,
      answer: pattern.answer,
      patternType: pattern.type,
      points: 20
    }));
  }

  generateLogicPuzzles() {
    return [
      {
        id: 'logic_1',
        type: 'deduction',
        setup: 'Tom is taller than Sam. Sam is taller than Max.',
        question: 'Who is the tallest?',
        options: ['Tom', 'Sam', 'Max'],
        answer: 'Tom',
        points: 40
      },
      {
        id: 'logic_2',
        type: 'sequence',
        setup: 'If Monday comes before Tuesday, and Tuesday comes before Wednesday...',
        question: 'What day comes after Tuesday?',
        options: ['Monday', 'Wednesday', 'Thursday', 'Friday'],
        answer: 'Wednesday',
        points: 30
      }
    ];
  }

  generateCodingChallenges() {
    return [
      {
        id: 'code_1',
        type: 'sequence',
        title: 'Help the robot reach the star!',
        grid: [
          ['R', '.', '.', '.'],
          ['.', '.', '.', '.'],
          ['.', '.', '.', '.'],
          ['.', '.', '.', 'S']
        ],
        instructions: ['Move Right', 'Move Down', 'Move Right', 'Move Down'],
        answer: ['Right', 'Right', 'Right', 'Down', 'Down', 'Down'],
        points: 50
      }
    ];
  }

  // Game Session Management
  startGameSession(playerId, gameId, level = 1) {
    const game = this.games.get(gameId);
    if (!game) throw new Error('Game not found');

    const sessionId = `session_${crypto.randomBytes(8).toString('hex')}`;
    const session = {
      id: sessionId,
      playerId,
      gameId,
      level,
      startTime: new Date(),
      score: 0,
      correctAnswers: 0,
      totalQuestions: 0,
      currentExercise: 0,
      exercises: game.levels ? game.levels[level - 1].exercises : game.activities,
      status: 'active',
      streak: 0,
      bonuses: []
    };

    this.emit('gameSessionStarted', session);
    return session;
  }

  submitAnswer(sessionId, answer) {
    const session = this.getSession(sessionId);
    if (!session || session.status !== 'active') return null;

    const exercise = session.exercises[session.currentExercise];
    const isCorrect = this.checkAnswer(exercise, answer);

    session.totalQuestions++;
    
    if (isCorrect) {
      session.correctAnswers++;
      session.score += exercise.points;
      session.streak++;
      
      // Streak bonus
      if (session.streak >= 3) {
        const bonus = Math.floor(exercise.points * 0.5);
        session.score += bonus;
        session.bonuses.push({
          type: 'streak',
          amount: bonus,
          at: session.currentExercise
        });
      }

      this.updatePlayerProgress(session.playerId, session.gameId, exercise);
    } else {
      session.streak = 0;
    }

    const result = {
      correct: isCorrect,
      explanation: exercise.explanation,
      correctAnswer: exercise.answer,
      score: session.score,
      streak: session.streak
    };

    // Move to next exercise
    session.currentExercise++;
    if (session.currentExercise >= session.exercises.length) {
      this.completeSession(sessionId);
    }

    this.emit('answerSubmitted', { session, result });
    return result;
  }

  checkAnswer(exercise, answer) {
    if (exercise.type === 'multiple_choice' || exercise.options) {
      return answer === exercise.answer;
    }
    
    if (exercise.type === 'number' || exercise.type === 'counting' || 
        exercise.type === 'addition' || exercise.type === 'subtraction') {
      return parseInt(answer) === exercise.answer;
    }
    
    if (exercise.type === 'word_building') {
      return answer.toLowerCase() === exercise.answer.toLowerCase();
    }
    
    return answer === exercise.answer;
  }

  completeSession(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.status = 'completed';
    session.endTime = new Date();
    session.duration = (session.endTime - session.startTime) / 1000 / 60; // minutes
    
    const accuracy = (session.correctAnswers / session.totalQuestions) * 100;
    const performance = {
      score: session.score,
      accuracy: accuracy,
      duration: session.duration,
      level: session.level
    };

    // Award achievements
    const achievements = this.checkAchievements(session);
    achievements.forEach(achievement => {
      this.awardAchievement(session.playerId, achievement);
    });

    // Update player stats
    this.updatePlayerStats(session.playerId, performance);

    this.emit('sessionCompleted', { session, performance, achievements });
    return { session, performance, achievements };
  }

  // Progress Tracking
  updatePlayerProgress(playerId, gameId, exercise) {
    const key = `${playerId}_${gameId}`;
    let progress = this.playerProgress.get(key) || {
      playerId,
      gameId,
      exercisesCompleted: {},
      skillProgress: {},
      lastPlayed: null
    };

    // Track completed exercises
    if (!progress.exercisesCompleted[exercise.type]) {
      progress.exercisesCompleted[exercise.type] = 0;
    }
    progress.exercisesCompleted[exercise.type]++;

    // Update skill progress
    const game = this.games.get(gameId);
    if (game && game.skills) {
      game.skills.forEach(skill => {
        if (!progress.skillProgress[skill]) {
          progress.skillProgress[skill] = 0;
        }
        progress.skillProgress[skill] += exercise.points / 100; // Convert to skill points
      });
    }

    progress.lastPlayed = new Date();
    this.playerProgress.set(key, progress);
    
    return progress;
  }

  updatePlayerStats(playerId, performance) {
    // This would update overall player statistics
    // In production, this would persist to a database
  }

  // Achievement System
  checkAchievements(session) {
    const achievements = [];

    // Perfect score
    if (session.correctAnswers === session.totalQuestions && session.totalQuestions >= 5) {
      achievements.push({
        id: 'perfect_score',
        name: 'Perfect Score!',
        description: 'Answer all questions correctly',
        icon: '⭐',
        points: 100
      });
    }

    // Speed demon
    if (session.duration < 5 && session.correctAnswers >= 8) {
      achievements.push({
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete quickly with high accuracy',
        icon: '⚡',
        points: 75
      });
    }

    // Streak master
    if (session.streak >= 10) {
      achievements.push({
        id: 'streak_master',
        name: 'Streak Master',
        description: 'Get 10 correct answers in a row',
        icon: '🔥',
        points: 150
      });
    }

    return achievements;
  }

  awardAchievement(playerId, achievement) {
    const playerAchievements = this.achievements.get(playerId) || [];
    
    // Check if already earned
    if (!playerAchievements.find(a => a.id === achievement.id)) {
      achievement.earnedAt = new Date();
      playerAchievements.push(achievement);
      this.achievements.set(playerId, playerAchievements);
      
      this.emit('achievementUnlocked', { playerId, achievement });
    }
  }

  // Helper Methods
  getRandomObject(count) {
    const objects = ['stars', 'hearts', 'flowers', 'balloons', 'apples'];
    return objects[Math.floor(Math.random() * objects.length)];
  }

  generateVisualArray(count) {
    const emojis = ['⭐', '❤️', '🌸', '🎈', '🍎'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    return Array(count).fill(emoji);
  }

  getNumberEmoji(num) {
    const emojis = ['️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    return num <= 10 ? emojis[num] || num.toString() : num.toString();
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getSession(sessionId) {
    // In production, this would retrieve from a session store
    return this.sessions?.get(sessionId);
  }

  // Recommendation System
  getRecommendedGames(playerId, age) {
    const curriculum = this.getCurriculumForAge(age);
    const progress = this.getPlayerOverallProgress(playerId);
    
    const recommendations = [];
    
    curriculum.recommendedGames.forEach(gameId => {
      const game = this.games.get(gameId);
      if (game && age >= game.ageRange.min && age <= game.ageRange.max) {
        recommendations.push({
          game,
          reason: this.getRecommendationReason(game, progress),
          priority: this.calculatePriority(game, progress)
        });
      }
    });

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  getCurriculumForAge(age) {
    for (const [key, curriculum] of this.curriculum) {
      if (age >= curriculum.ageRange.min && age <= curriculum.ageRange.max) {
        return curriculum;
      }
    }
    return this.curriculum.get('elementary'); // default
  }

  getPlayerOverallProgress(playerId) {
    const allProgress = [];
    for (const [key, progress] of this.playerProgress) {
      if (key.startsWith(playerId)) {
        allProgress.push(progress);
      }
    }
    return allProgress;
  }

  getRecommendationReason(game, progress) {
    // Simple recommendation logic
    if (!progress.find(p => p.gameId === game.id)) {
      return 'New game to explore!';
    }
    return 'Continue your progress!';
  }

  calculatePriority(game, progress) {
    // Higher priority for games not yet played
    const played = progress.find(p => p.gameId === game.id);
    return played ? 50 : 100;
  }

  // Parent Dashboard Data
  getProgressReport(playerId, period = 'week') {
    const progress = this.getPlayerOverallProgress(playerId);
    const achievements = this.achievements.get(playerId) || [];
    
    return {
      playerId,
      period,
      summary: {
        gamesPlayed: progress.length,
        totalPoints: this.calculateTotalPoints(progress),
        achievementsEarned: achievements.length,
        favoriteSubject: this.identifyFavoriteSubject(progress),
        skillGrowth: this.calculateSkillGrowth(progress)
      },
      detailedProgress: progress,
      achievements,
      recommendations: this.generateLearningRecommendations(progress)
    };
  }

  calculateTotalPoints(progress) {
    // Sum up all skill progress points
    return progress.reduce((total, p) => {
      const skillPoints = Object.values(p.skillProgress || {}).reduce((sum, points) => sum + points, 0);
      return total + skillPoints;
    }, 0);
  }

  identifyFavoriteSubject(progress) {
    const subjects = {};
    progress.forEach(p => {
      const game = this.games.get(p.gameId);
      if (game && game.category) {
        subjects[game.category] = (subjects[game.category] || 0) + 1;
      }
    });
    
    return Object.entries(subjects)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'exploring';
  }

  calculateSkillGrowth(progress) {
    const skills = {};
    progress.forEach(p => {
      Object.entries(p.skillProgress || {}).forEach(([skill, points]) => {
        skills[skill] = (skills[skill] || 0) + points;
      });
    });
    return skills;
  }

  generateLearningRecommendations(progress) {
    const recommendations = [];
    const skills = this.calculateSkillGrowth(progress);
    
    // Find weakest skills
    const avgSkillPoints = Object.values(skills).reduce((a, b) => a + b, 0) / Object.keys(skills).length;
    
    Object.entries(skills).forEach(([skill, points]) => {
      if (points < avgSkillPoints * 0.8) {
        recommendations.push({
          type: 'skill_improvement',
          skill,
          message: `Practice more ${skill} activities to improve!`,
          suggestedGames: this.getGamesForSkill(skill)
        });
      }
    });

    return recommendations;
  }

  getGamesForSkill(skill) {
    const games = [];
    for (const [id, game] of this.games) {
      if (game.skills && game.skills.includes(skill)) {
        games.push(id);
      }
    }
    return games;
  }
}

module.exports = LearningGames;