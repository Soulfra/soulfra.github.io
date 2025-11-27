// KidsWorld.js - Gamified consciousness exploration for children

const EventEmitter = require('events');
const crypto = require('crypto');

class KidsWorld extends EventEmitter {
  constructor() {
    super();
    this.players = new Map();
    this.worlds = new Map();
    this.creatures = new Map();
    this.quests = new Map();
    this.rewards = new Map();
    this.safetyMonitor = new Map();
    this.initializeWorlds();
  }

  // Player Management
  createPlayer(childInfo) {
    const playerId = `player_${crypto.randomBytes(8).toString('hex')}`;
    const player = {
      id: playerId,
      name: childInfo.name,
      age: childInfo.age,
      avatar: this.createAvatar(childInfo),
      level: 1,
      experience: 0,
      coins: 100,
      energy: 100,
      created: new Date().toISOString(),
      companion: this.createCompanion(childInfo.age),
      inventory: {
        items: [],
        capacity: 20
      },
      skills: {
        creativity: 1,
        knowledge: 1,
        kindness: 1,
        courage: 1,
        wisdom: 1
      },
      achievements: [],
      currentWorld: 'rainbow-meadows',
      position: { x: 50, y: 50 },
      playtime: {
        today: 0,
        total: 0,
        lastActive: new Date().toISOString()
      }
    };

    this.players.set(playerId, player);
    this.emit('playerCreated', player);
    return player;
  }

  createAvatar(childInfo) {
    const animals = ['bunny', 'puppy', 'kitten', 'panda', 'fox', 'owl', 'dragon'];
    const colors = ['rainbow', 'purple', 'blue', 'green', 'pink', 'golden', 'silver'];
    
    return {
      type: animals[Math.floor(Math.random() * animals.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      accessories: [],
      expressions: ['happy', 'excited', 'curious', 'proud'],
      currentExpression: 'happy'
    };
  }

  createCompanion(age) {
    const companions = [
      { name: 'Sparkle', type: 'fairy', personality: 'cheerful' },
      { name: 'Buddy', type: 'robot', personality: 'helpful' },
      { name: 'Luna', type: 'unicorn', personality: 'magical' },
      { name: 'Rex', type: 'dinosaur', personality: 'brave' },
      { name: 'Whiskers', type: 'cat', personality: 'wise' }
    ];

    const companion = companions[Math.floor(Math.random() * companions.length)];
    return {
      ...companion,
      level: 1,
      mood: 'happy',
      abilities: this.getCompanionAbilities(companion.type, age)
    };
  }

  getCompanionAbilities(type, age) {
    const abilities = {
      fairy: ['magic dust', 'flying', 'nature speak'],
      robot: ['calculations', 'building', 'problem solving'],
      unicorn: ['healing', 'rainbow bridge', 'dream magic'],
      dinosaur: ['strength', 'protection', 'ancient wisdom'],
      cat: ['stealth', 'night vision', 'secret paths']
    };

    // Age-appropriate abilities
    const available = abilities[type] || [];
    return age < 7 ? [available[0]] : available.slice(0, 2);
  }

  // World Initialization
  initializeWorlds() {
    // Rainbow Meadows - Starting World
    this.worlds.set('rainbow-meadows', {
      id: 'rainbow-meadows',
      name: 'Rainbow Meadows',
      description: 'A colorful world full of friendly creatures',
      theme: 'nature',
      difficulty: 'easy',
      areas: [
        { name: 'Flower Fields', x: 0, y: 0, activities: ['flower-picking', 'butterfly-catching'] },
        { name: 'Crystal Lake', x: 100, y: 0, activities: ['fishing', 'swimming'] },
        { name: 'Giggle Grove', x: 0, y: 100, activities: ['hide-and-seek', 'tree-climbing'] },
        { name: 'Cloud Castle', x: 100, y: 100, activities: ['story-time', 'dream-weaving'] }
      ],
      npcs: [
        { name: 'Mayor Bunny', type: 'quest-giver', location: 'Flower Fields' },
        { name: 'Professor Owl', type: 'teacher', location: 'Cloud Castle' },
        { name: 'Chef Panda', type: 'merchant', location: 'Crystal Lake' }
      ],
      backgroundMusic: 'cheerful-meadow-theme',
      ambientSounds: ['birds', 'wind', 'water']
    });

    // Science Island
    this.worlds.set('science-island', {
      id: 'science-island',
      name: 'Science Island',
      description: 'Discover the wonders of science',
      theme: 'educational',
      difficulty: 'medium',
      requiredLevel: 5,
      areas: [
        { name: 'Chemistry Lab', activities: ['potion-mixing', 'color-experiments'] },
        { name: 'Space Observatory', activities: ['star-gazing', 'planet-exploration'] },
        { name: 'Dinosaur Dig', activities: ['fossil-hunting', 'time-travel'] },
        { name: 'Robot Workshop', activities: ['robot-building', 'coding-basics'] }
      ]
    });

    // Creativity Castle
    this.worlds.set('creativity-castle', {
      id: 'creativity-castle',
      name: 'Creativity Castle',
      description: 'Express yourself through art and music',
      theme: 'creative',
      difficulty: 'easy',
      requiredLevel: 3,
      areas: [
        { name: 'Art Studio', activities: ['painting', 'sculpting'] },
        { name: 'Music Hall', activities: ['instrument-playing', 'composing'] },
        { name: 'Theater Stage', activities: ['acting', 'storytelling'] },
        { name: 'Dance Floor', activities: ['dancing', 'movement-games'] }
      ]
    });
  }

  // Quest System
  createQuest(type, playerLevel) {
    const questTemplates = {
      collection: {
        name: 'Flower Collection',
        description: 'Help Mayor Bunny collect magical flowers',
        objectives: [
          { type: 'collect', item: 'magical_flower', quantity: 5 }
        ],
        rewards: { experience: 50, coins: 25, items: ['flower_crown'] }
      },
      helping: {
        name: 'Help the Lost Puppy',
        description: 'A puppy needs help finding its way home',
        objectives: [
          { type: 'find', target: 'lost_puppy' },
          { type: 'escort', target: 'puppy_home' }
        ],
        rewards: { experience: 75, coins: 30, skills: { kindness: 1 } }
      },
      learning: {
        name: 'Professor Owl\'s Lesson',
        description: 'Learn something new from Professor Owl',
        objectives: [
          { type: 'visit', location: 'Cloud Castle' },
          { type: 'complete_lesson', subject: 'colors' }
        ],
        rewards: { experience: 100, skills: { knowledge: 1 } }
      },
      creative: {
        name: 'Paint a Rainbow',
        description: 'Create a beautiful rainbow painting',
        objectives: [
          { type: 'create', item: 'rainbow_painting' }
        ],
        rewards: { experience: 60, items: ['paint_brush'], skills: { creativity: 1 } }
      }
    };

    const types = Object.keys(questTemplates);
    const selectedType = type || types[Math.floor(Math.random() * types.length)];
    const template = questTemplates[selectedType];

    const questId = `quest_${crypto.randomBytes(8).toString('hex')}`;
    const quest = {
      id: questId,
      ...template,
      level: playerLevel,
      status: 'available',
      progress: {},
      created: new Date().toISOString()
    };

    this.quests.set(questId, quest);
    return quest;
  }

  acceptQuest(playerId, questId) {
    const player = this.players.get(playerId);
    const quest = this.quests.get(questId);
    
    if (!player || !quest) throw new Error('Player or quest not found');
    if (quest.level > player.level) throw new Error('Player level too low');

    quest.status = 'active';
    quest.playerId = playerId;
    quest.startTime = new Date().toISOString();

    // Initialize progress tracking
    quest.objectives.forEach((obj, index) => {
      quest.progress[index] = {
        completed: false,
        current: 0,
        required: obj.quantity || 1
      };
    });

    if (!player.activeQuests) player.activeQuests = [];
    player.activeQuests.push(questId);

    this.emit('questAccepted', { player, quest });
    return quest;
  }

  updateQuestProgress(playerId, questId, objectiveIndex, progress) {
    const quest = this.quests.get(questId);
    if (!quest || quest.playerId !== playerId) return;

    quest.progress[objectiveIndex].current += progress;
    
    if (quest.progress[objectiveIndex].current >= quest.progress[objectiveIndex].required) {
      quest.progress[objectiveIndex].completed = true;
    }

    // Check if all objectives completed
    const allCompleted = Object.values(quest.progress).every(p => p.completed);
    if (allCompleted) {
      this.completeQuest(playerId, questId);
    }

    this.emit('questProgress', { playerId, quest });
  }

  completeQuest(playerId, questId) {
    const player = this.players.get(playerId);
    const quest = this.quests.get(questId);
    
    if (!player || !quest) return;

    quest.status = 'completed';
    quest.completedAt = new Date().toISOString();

    // Grant rewards
    if (quest.rewards.experience) {
      this.grantExperience(playerId, quest.rewards.experience);
    }
    if (quest.rewards.coins) {
      player.coins += quest.rewards.coins;
    }
    if (quest.rewards.items) {
      quest.rewards.items.forEach(item => {
        this.addToInventory(playerId, item);
      });
    }
    if (quest.rewards.skills) {
      Object.entries(quest.rewards.skills).forEach(([skill, points]) => {
        player.skills[skill] += points;
      });
    }

    // Remove from active quests
    player.activeQuests = player.activeQuests.filter(q => q !== questId);

    this.emit('questCompleted', { player, quest });
    return quest;
  }

  // Gameplay Mechanics
  movePlayer(playerId, direction) {
    const player = this.players.get(playerId);
    if (!player) return;

    const speed = 10;
    const moves = {
      up: { x: 0, y: -speed },
      down: { x: 0, y: speed },
      left: { x: -speed, y: 0 },
      right: { x: speed, y: 0 }
    };

    const move = moves[direction];
    if (!move) return;

    player.position.x += move.x;
    player.position.y += move.y;

    // Keep within world bounds
    player.position.x = Math.max(0, Math.min(200, player.position.x));
    player.position.y = Math.max(0, Math.min(200, player.position.y));

    // Use energy
    player.energy = Math.max(0, player.energy - 1);

    // Check for area transitions
    this.checkAreaTransition(player);

    this.emit('playerMoved', { player, direction });
    return player;
  }

  checkAreaTransition(player) {
    const world = this.worlds.get(player.currentWorld);
    if (!world) return;

    const currentArea = world.areas.find(area => {
      const distance = Math.sqrt(
        Math.pow(player.position.x - area.x, 2) + 
        Math.pow(player.position.y - area.y, 2)
      );
      return distance < 50;
    });

    if (currentArea && player.currentArea !== currentArea.name) {
      player.currentArea = currentArea.name;
      this.emit('areaEntered', { player, area: currentArea });
    }
  }

  // Mini-Games
  startMiniGame(playerId, gameType) {
    const miniGames = {
      'flower-picking': {
        name: 'Flower Picking',
        description: 'Collect as many flowers as you can!',
        duration: 60,
        scoring: { flower: 10, rare_flower: 50 },
        difficulty: 'easy'
      },
      'bubble-pop': {
        name: 'Bubble Pop',
        description: 'Pop the colorful bubbles!',
        duration: 45,
        scoring: { bubble: 5, golden_bubble: 25 },
        difficulty: 'easy'
      },
      'memory-match': {
        name: 'Memory Match',
        description: 'Match the pairs!',
        gridSize: 4,
        scoring: { match: 20, perfect: 100 },
        difficulty: 'medium'
      },
      'word-builder': {
        name: 'Word Builder',
        description: 'Build words from letters!',
        duration: 90,
        scoring: { word: 15, bonus_word: 50 },
        difficulty: 'medium'
      }
    };

    const game = miniGames[gameType];
    if (!game) throw new Error('Unknown mini-game type');

    const gameSession = {
      id: `game_${crypto.randomBytes(8).toString('hex')}`,
      playerId,
      type: gameType,
      ...game,
      score: 0,
      startTime: new Date().toISOString(),
      status: 'active'
    };

    this.emit('miniGameStarted', gameSession);
    return gameSession;
  }

  // Experience and Leveling
  grantExperience(playerId, amount) {
    const player = this.players.get(playerId);
    if (!player) return;

    player.experience += amount;
    
    // Check for level up
    const requiredExp = player.level * 100;
    if (player.experience >= requiredExp) {
      player.level++;
      player.experience -= requiredExp;
      
      // Level up rewards
      player.coins += 50 * player.level;
      player.energy = 100;
      
      // Unlock new abilities
      if (player.level % 5 === 0) {
        this.unlockCompanionAbility(player);
      }

      this.emit('levelUp', { player, newLevel: player.level });
    }

    return player;
  }

  unlockCompanionAbility(player) {
    const allAbilities = this.getCompanionAbilities(player.companion.type, 99);
    const currentAbilities = player.companion.abilities;
    const locked = allAbilities.filter(a => !currentAbilities.includes(a));
    
    if (locked.length > 0) {
      player.companion.abilities.push(locked[0]);
      this.emit('abilityUnlocked', { player, ability: locked[0] });
    }
  }

  // Inventory Management
  addToInventory(playerId, itemId) {
    const player = this.players.get(playerId);
    if (!player) return;

    if (player.inventory.items.length >= player.inventory.capacity) {
      throw new Error('Inventory full');
    }

    const item = {
      id: itemId,
      obtained: new Date().toISOString(),
      quantity: 1
    };

    const existing = player.inventory.items.find(i => i.id === itemId);
    if (existing) {
      existing.quantity++;
    } else {
      player.inventory.items.push(item);
    }

    this.emit('itemObtained', { player, item: itemId });
    return player.inventory;
  }

  // Safety Features
  checkPlaytime(playerId) {
    const player = this.players.get(playerId);
    if (!player) return;

    const now = new Date();
    const today = now.toDateString();
    const lastActiveDate = new Date(player.playtime.lastActive).toDateString();

    if (today !== lastActiveDate) {
      player.playtime.today = 0;
    }

    player.playtime.lastActive = now.toISOString();

    // Check limits based on age
    const limits = {
      under7: 30,
      under10: 60,
      under13: 90,
      default: 120
    };

    let limit = limits.default;
    if (player.age < 7) limit = limits.under7;
    else if (player.age < 10) limit = limits.under10;
    else if (player.age < 13) limit = limits.under13;

    if (player.playtime.today >= limit) {
      this.emit('playtimeLimitReached', { player, limit });
      return { allowed: false, reason: 'Daily playtime limit reached' };
    }

    return { allowed: true, remaining: limit - player.playtime.today };
  }

  // Chat Safety
  filterChat(message, playerId) {
    const player = this.players.get(playerId);
    if (!player) return '';

    // Age-appropriate filtering
    let filtered = message;
    
    // Remove numbers (phone numbers, addresses)
    filtered = filtered.replace(/\d{3,}/g, '***');
    
    // Remove email patterns
    filtered = filtered.replace(/\S+@\S+/g, '***');
    
    // Simple word filter for young children
    if (player.age < 10) {
      const blockedWords = ['stupid', 'dumb', 'hate', 'ugly'];
      blockedWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        filtered = filtered.replace(regex, '***');
      });
    }

    return filtered;
  }

  // Friend System (Safe)
  sendFriendRequest(fromPlayerId, toPlayerCode) {
    const fromPlayer = this.players.get(fromPlayerId);
    if (!fromPlayer) return;

    // Friend codes are safe, parent-approved codes
    const request = {
      id: `friend_req_${crypto.randomBytes(8).toString('hex')}`,
      from: fromPlayerId,
      toCode: toPlayerCode,
      status: 'pending_parent_approval',
      created: new Date().toISOString()
    };

    this.emit('friendRequestCreated', request);
    return request;
  }
}

module.exports = KidsWorld;