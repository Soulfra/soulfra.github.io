#!/usr/bin/env node

/**
 * 🏀 SPORTS API INTEGRATOR
 * 
 * Connects to ESPN, Google Sports, and other APIs to get real-time
 * game data and transform it into gladiator battles in the Coliseum.
 * 
 * "Every basket becomes a sword strike. Every touchdown, a victory cry."
 */

const axios = require('axios');
const WebSocket = require('ws');
const { EventEmitter } = require('events');

class SportsAPIIntegrator extends EventEmitter {
  constructor() {
    super();
    
    this.apiEndpoints = {
      espn: 'https://site.api.espn.com/apis/site/v2/sports',
      nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba',
      nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl',
      mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb',
      nhl: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl'
    };
    
    this.gameState = {
      activeGames: new Map(),
      gladiatorMappings: new Map(),
      battleHistory: [],
      bettingOdds: new Map()
    };
    
    this.wsClients = new Set();
    this.updateInterval = 5000; // 5 seconds
    
    this.gladiatorTypes = {
      basketball: {
        offense: { name: 'COURT WARRIOR', emoji: '🏀', weapon: '🗡️' },
        defense: { name: 'SHIELD GUARDIAN', emoji: '🛡️', weapon: '⚔️' }
      },
      football: {
        offense: { name: 'FIELD GLADIATOR', emoji: '🏈', weapon: '🔱' },
        defense: { name: 'FORTRESS DEFENDER', emoji: '🛡️', weapon: '🔨' }
      },
      baseball: {
        offense: { name: 'BAT WARRIOR', emoji: '⚾', weapon: '🏹' },
        defense: { name: 'FIELD SENTINEL', emoji: '🥎', weapon: '🛡️' }
      },
      hockey: {
        offense: { name: 'ICE BERSERKER', emoji: '🏒', weapon: '⚔️' },
        defense: { name: 'RINK GUARDIAN', emoji: '🥅', weapon: '🛡️' }
      }
    };
    
    this.battleEffects = {
      score: ['🔥', '⚡', '🎆', '💥', '✨'],
      turnover: ['💨', '🌪️', '☠️'],
      timeout: ['⏸️', '🛑', '⏰'],
      victory: ['🏆', '👑', '🎉', '🎆']
    };
    
    this.startIntegration();
  }
  
  /**
   * Start the sports integration
   */
  async startIntegration() {
    console.log('🏀 Sports API Integrator Starting...');
    
    // Start WebSocket server for real-time updates
    this.startWebSocketServer();
    
    // Begin polling sports data
    this.startDataPolling();
    
    // Initialize gladiator mappings
    await this.initializeGladiatorMappings();
    
    console.log('⚔️ Coliseum ready for battle!');
  }
  
  /**
   * Start WebSocket server for real-time updates
   */
  startWebSocketServer() {
    this.wss = new WebSocket.Server({ port: 4244 });
    
    this.wss.on('connection', (ws) => {
      console.log('🔗 New gladiator joins the arena');
      this.wsClients.add(ws);
      
      // Send current game state
      ws.send(JSON.stringify({
        type: 'init',
        gameState: this.serializeGameState()
      }));
      
      ws.on('close', () => {
        this.wsClients.delete(ws);
      });
      
      ws.on('message', (message) => {
        this.handleClientMessage(ws, message);
      });
    });
    
    console.log('🔌 WebSocket server running on port 4244');
  }
  
  /**
   * Handle client messages
   */
  handleClientMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'place_bet':
          this.handleBet(data.bet);
          break;
        case 'boost_gladiator':
          this.boostGladiator(data.gladiatorId, data.boost);
          break;
        case 'request_battle':
          this.triggerManualBattle(data.gameId);
          break;
      }
    } catch (error) {
      console.error('Message handling error:', error);
    }
  }
  
  /**
   * Start polling sports data
   */
  startDataPolling() {
    // Poll live games
    setInterval(() => {
      this.pollLiveGames();
    }, this.updateInterval);
    
    // Poll for game events
    setInterval(() => {
      this.pollGameEvents();
    }, 2000); // More frequent for live events
    
    console.log('📶 Started polling sports APIs');
  }
  
  /**
   * Poll for live games
   */
  async pollLiveGames() {
    try {
      // Get NBA games
      const nbaGames = await this.getNBAGames();
      await this.processGames(nbaGames, 'basketball');
      
      // Get NFL games (during season)
      const nflGames = await this.getNFLGames();
      await this.processGames(nflGames, 'football');
      
      // Get MLB games (during season)
      const mlbGames = await this.getMLBGames();
      await this.processGames(mlbGames, 'baseball');
      
    } catch (error) {
      console.error('Polling error:', error.message);
    }
  }
  
  /**
   * Get NBA games from ESPN
   */
  async getNBAGames() {
    try {
      const response = await axios.get(`${this.apiEndpoints.nba}/scoreboard`);
      console.log('📡 ESPN NBA API Response:', response.data.events?.length || 0, 'games found');
      return response.data.events || [];
    } catch (error) {
      console.error('NBA API error:', error.message);
      console.log('🔄 Falling back to enhanced mock data with real mascots');
      return this.getEnhancedMockNBAGames(); // Enhanced mock data
    }
  }
  
  /**
   * Get NFL games from ESPN
   */
  async getNFLGames() {
    try {
      const response = await axios.get(`${this.apiEndpoints.nfl}/scoreboard`);
      return response.data.events || [];
    } catch (error) {
      console.error('NFL API error:', error.message);
      return this.getMockNFLGames();
    }
  }
  
  /**
   * Get MLB games from ESPN
   */
  async getMLBGames() {
    try {
      const response = await axios.get(`${this.apiEndpoints.mlb}/scoreboard`);
      return response.data.events || [];
    } catch (error) {
      console.error('MLB API error:', error.message);
      return this.getMockMLBGames();
    }
  }
  
  /**
   * Process games and update gladiator battles
   */
  async processGames(games, sport) {
    for (const game of games) {
      if (this.isGameLive(game)) {
        await this.updateGladiatorBattle(game, sport);
      }
    }
  }
  
  /**
   * Check if game is live
   */
  isGameLive(game) {
    return game.status?.type?.state === 'in' || 
           game.status?.type?.name === 'STATUS_IN_PROGRESS' ||
           game.competitions?.[0]?.status?.type?.state === 'in';
  }
  
  /**
   * Update gladiator battle based on game data
   */
  async updateGladiatorBattle(game, sport) {
    const gameId = game.id;
    const competition = game.competitions?.[0];
    
    if (!competition) return;
    
    const teams = competition.competitors;
    const team1 = teams[0];
    const team2 = teams[1];
    
    // Create or update gladiator mapping
    const battleData = {
      gameId: gameId,
      sport: sport,
      team1: {
        id: team1.id,
        name: team1.team.displayName,
        score: parseInt(team1.score || 0),
        gladiator: this.createGladiator(team1, sport)
      },
      team2: {
        id: team2.id,
        name: team2.team.displayName,
        score: parseInt(team2.score || 0),
        gladiator: this.createGladiator(team2, sport)
      },
      status: competition.status,
      lastUpdate: new Date().toISOString()
    };
    
    // Check for score changes
    const previousBattle = this.gameState.activeGames.get(gameId);
    if (previousBattle) {
      await this.checkForBattleEvents(previousBattle, battleData);
    }
    
    // Update game state
    this.gameState.activeGames.set(gameId, battleData);
    
    // Broadcast update
    this.broadcastBattleUpdate(battleData);
  }
  
  /**
   * Create gladiator representation of team
   */
  createGladiator(team, sport) {
    // Get real mascot and team info
    const mascotInfo = this.getRealMascotInfo(team.team.abbreviation, sport);
    const gladiatorType = this.gladiatorTypes[sport];
    const isOffensive = Math.random() > 0.5;
    const type = isOffensive ? gladiatorType.offense : gladiatorType.defense;
    
    // Calculate stats based on team performance and real team strength
    const score = parseInt(team.score || 0);
    const teamStrength = mascotInfo.powerRating || 75;
    const baseStats = {
      power: Math.min(100, teamStrength + score),
      speed: Math.min(100, mascotInfo.speedRating || (60 + Math.floor(Math.random() * 40))),
      magic: Math.min(100, mascotInfo.magicRating || (40 + Math.floor(Math.random() * 60)))
    };
    
    return {
      name: `${mascotInfo.mascotName} ${type.name}`,
      emoji: mascotInfo.mascotEmoji,
      weapon: mascotInfo.weapon || type.weapon,
      stats: baseStats,
      teamColors: team.team.color || mascotInfo.primaryColor,
      wins: 0,
      battles: 0,
      realMascot: mascotInfo.mascotName,
      battleCry: mascotInfo.battleCry,
      specialMove: mascotInfo.specialMove
    };
  }
  
  /**
   * Get real mascot information for teams
   */
  getRealMascotInfo(teamAbbr, sport) {
    const mascotDatabase = {
      // NBA Teams
      'LAL': {
        mascotName: 'LAKER LION',
        mascotEmoji: '🦁',
        weapon: '👑',
        powerRating: 95,
        speedRating: 85,
        magicRating: 90,
        primaryColor: '#552583',
        battleCry: 'ROAR OF CHAMPIONS!',
        specialMove: 'MAMBA STRIKE'
      },
      'GSW': {
        mascotName: 'WARRIOR THUNDER',
        mascotEmoji: '⚡',
        weapon: '🗡️',
        powerRating: 92,
        speedRating: 95,
        magicRating: 88,
        primaryColor: '#1D428A',
        battleCry: 'THUNDER FROM THE BAY!',
        specialMove: 'SPLASH ATTACK'
      },
      'BOS': {
        mascotName: 'CELTIC DRUID',
        mascotEmoji: '🍀',
        weapon: '🪓',
        powerRating: 90,
        speedRating: 82,
        magicRating: 95,
        primaryColor: '#007A33',
        battleCry: 'LUCK OF THE IRISH!',
        specialMove: 'BANNER MAGIC'
      },
      'MIA': {
        mascotName: 'HEAT DEMON',
        mascotEmoji: '🔥',
        weapon: '🌡️',
        powerRating: 88,
        speedRating: 90,
        magicRating: 85,
        primaryColor: '#98002E',
        battleCry: 'FEEL THE HEAT!',
        specialMove: 'INFERNO BLAST'
      },
      'CHI': {
        mascotName: 'RAGING BULL',
        mascotEmoji: '🐂',
        weapon: '⚔️',
        powerRating: 93,
        speedRating: 75,
        magicRating: 82,
        primaryColor: '#CE1141',
        battleCry: 'CHARGE INTO BATTLE!',
        specialMove: 'BULL RUSH'
      },
      
      // NFL Teams
      'KC': {
        mascotName: 'CHIEF WARRIOR',
        mascotEmoji: '🏹',
        weapon: '🪓',
        powerRating: 95,
        speedRating: 88,
        magicRating: 92,
        primaryColor: '#E31837',
        battleCry: 'ARROWHEAD THUNDER!',
        specialMove: 'MAHOMES MAGIC'
      },
      'NE': {
        mascotName: 'PATRIOT SOLDIER',
        mascotEmoji: '🇺🇸',
        weapon: '🔫',
        powerRating: 90,
        speedRating: 85,
        magicRating: 95,
        primaryColor: '#002244',
        battleCry: 'FREEDOM RINGS!',
        specialMove: 'DYNASTY POWER'
      },
      'DAL': {
        mascotName: 'COWBOY GUNSLINGER',
        mascotEmoji: '🤠',
        weapon: '🔫',
        powerRating: 87,
        speedRating: 90,
        magicRating: 83,
        primaryColor: '#041E42',
        battleCry: 'YEEHAW!',
        specialMove: 'STAR STRIKE'
      },
      
      // MLB Teams  
      'NYY': {
        mascotName: 'YANKEE BOMBER',
        mascotEmoji: '⚾',
        weapon: '🏏',
        powerRating: 92,
        speedRating: 80,
        magicRating: 90,
        primaryColor: '#132448',
        battleCry: 'BRONX BOMBERS!',
        specialMove: 'PINSTRIPE POWER'
      },
      'LAD': {
        mascotName: 'DODGER BLUE',
        mascotEmoji: '💙',
        weapon: '🏏',
        powerRating: 90,
        speedRating: 88,
        magicRating: 85,
        primaryColor: '#005A9C',
        battleCry: 'THINK BLUE!',
        specialMove: 'HOLLYWOOD MAGIC'
      }
    };
    
    // Return mascot info or default
    return mascotDatabase[teamAbbr] || {
      mascotName: `${teamAbbr} GLADIATOR`,
      mascotEmoji: '⚔️',
      weapon: '🗡️',
      powerRating: 75,
      speedRating: 75,
      magicRating: 75,
      primaryColor: '#666666',
      battleCry: 'FIGHT!',
      specialMove: 'TEAM ATTACK'
    };
  }
  
  /**
   * Check for battle events (scoring, etc.)
   */
  async checkForBattleEvents(previousBattle, newBattle) {
    // Check for score changes
    if (newBattle.team1.score > previousBattle.team1.score) {
      await this.triggerBattleEvent({
        type: 'score',
        team: 'team1',
        gameId: newBattle.gameId,
        points: newBattle.team1.score - previousBattle.team1.score,
        gladiator: newBattle.team1.gladiator
      });
    }
    
    if (newBattle.team2.score > previousBattle.team2.score) {
      await this.triggerBattleEvent({
        type: 'score',
        team: 'team2',
        gameId: newBattle.gameId,
        points: newBattle.team2.score - previousBattle.team2.score,
        gladiator: newBattle.team2.gladiator
      });
    }
    
    // Check for game end
    if (newBattle.status?.type?.completed && !previousBattle.status?.type?.completed) {
      await this.triggerBattleEvent({
        type: 'victory',
        gameId: newBattle.gameId,
        winner: newBattle.team1.score > newBattle.team2.score ? 'team1' : 'team2'
      });
    }
  }
  
  /**
   * Trigger battle event with mascot personality
   */
  async triggerBattleEvent(event) {
    const battle = this.gameState.activeGames.get(event.gameId);
    let battleDescription = `⚔️ Battle Event: ${event.type} in game ${event.gameId}`;
    
    if (battle && event.gladiator) {
      const mascot = event.gladiator;
      battleDescription = `⚔️ ${mascot.realMascot} ${event.type.toUpperCase()}! "${mascot.battleCry}" - ${mascot.specialMove} activated!`;
    }
    
    console.log(battleDescription);
    
    // Add to battle history with mascot flavor
    this.gameState.battleHistory.push({
      ...event,
      timestamp: new Date().toISOString(),
      battleDescription: battleDescription
    });
    
    // Generate battle effects
    const effects = this.generateBattleEffects(event);
    
    // Broadcast to all clients with mascot info
    this.broadcast({
      type: 'battle_event',
      event: event,
      effects: effects,
      battleDescription: battleDescription
    });
    
    // Update gladiator stats
    if (event.type === 'score') {
      this.boostGladiatorStats(event.gameId, event.team, event.points);
    }
  }
  
  /**
   * Generate battle effects based on event
   */
  generateBattleEffects(event) {
    const effectType = this.battleEffects[event.type] || this.battleEffects.score;
    const effect = effectType[Math.floor(Math.random() * effectType.length)];
    
    return {
      primary: effect,
      animation: event.type,
      duration: event.type === 'victory' ? 3000 : 1000,
      sound: this.getBattleSound(event.type)
    };
  }
  
  /**
   * Get battle sound effect
   */
  getBattleSound(eventType) {
    const sounds = {
      score: 'sword_clash',
      turnover: 'shield_block',
      timeout: 'horn_blow',
      victory: 'victory_fanfare'
    };
    
    return sounds[eventType] || 'sword_clash';
  }
  
  /**
   * Boost gladiator stats
   */
  boostGladiatorStats(gameId, team, points) {
    const battle = this.gameState.activeGames.get(gameId);
    if (!battle) return;
    
    const gladiator = battle[team].gladiator;
    
    // Boost stats based on points scored
    gladiator.stats.power += points * 5;
    gladiator.stats.magic += points * 3;
    gladiator.battles += 1;
    
    if (points >= 3) { // Big play bonus
      gladiator.stats.speed += 10;
      gladiator.wins += 1;
    }
    
    // Cap stats at 100
    Object.keys(gladiator.stats).forEach(stat => {
      gladiator.stats[stat] = Math.min(100, gladiator.stats[stat]);
    });
  }
  
  /**
   * Handle betting
   */
  handleBet(bet) {
    const betId = `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Process bet
    const processedBet = {
      id: betId,
      ...bet,
      timestamp: new Date().toISOString(),
      status: 'active',
      odds: this.calculateOdds(bet)
    };
    
    // Add to betting system
    this.gameState.bettingOdds.set(betId, processedBet);
    
    // Broadcast bet placement
    this.broadcast({
      type: 'bet_placed',
      bet: processedBet
    });
    
    console.log(`🎲 Bet placed: ${bet.type} for ${bet.amount}`);
  }
  
  /**
   * Calculate betting odds
   */
  calculateOdds(bet) {
    // Simple odds calculation
    const baseOdds = {
      next_score: 1.8,
      quarter_winner: 2.1,
      gladiator_power: 3.5,
      special_move: 4.2,
      total_points: 1.9
    };
    
    return baseOdds[bet.type] || 2.0;
  }
  
  /**
   * Boost gladiator manually
   */
  boostGladiator(gladiatorId, boost) {
    // Find the gladiator in active games
    for (const [gameId, battle] of this.gameState.activeGames) {
      ['team1', 'team2'].forEach(team => {
        const gladiator = battle[team].gladiator;
        if (gladiator.name.includes(gladiatorId)) {
          // Apply boost
          Object.keys(boost).forEach(stat => {
            if (gladiator.stats[stat] !== undefined) {
              gladiator.stats[stat] = Math.min(100, gladiator.stats[stat] + boost[stat]);
            }
          });
          
          // Broadcast boost
          this.broadcast({
            type: 'gladiator_boosted',
            gameId: gameId,
            team: team,
            gladiator: gladiator,
            boost: boost
          });
        }
      });
    }
  }
  
  /**
   * Trigger manual battle
   */
  triggerManualBattle(gameId) {
    this.triggerBattleEvent({
      type: 'manual_battle',
      gameId: gameId,
      source: 'user_request'
    });
  }
  
  /**
   * Poll for game events
   */
  async pollGameEvents() {
    // This would connect to play-by-play APIs
    // For now, we'll simulate some events
    if (Math.random() < 0.1) { // 10% chance per poll
      this.simulateGameEvent();
    }
  }
  
  /**
   * Simulate game event for demo
   */
  simulateGameEvent() {
    const games = Array.from(this.gameState.activeGames.keys());
    if (games.length === 0) return;
    
    const randomGame = games[Math.floor(Math.random() * games.length)];
    const events = [
      'Fast break opportunity!',
      'Defensive stop!',
      'Player substitution!',
      'Timeout called!',
      'Technical foul!',
      'Incredible save!',
      'Power play begins!',
      'Penalty shot!'
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    
    this.broadcast({
      type: 'game_event',
      gameId: randomGame,
      event: event,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Broadcast to all WebSocket clients
   */
  broadcast(data) {
    const message = JSON.stringify(data);
    
    this.wsClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  
  /**
   * Broadcast battle update
   */
  broadcastBattleUpdate(battleData) {
    this.broadcast({
      type: 'battle_update',
      battle: battleData
    });
  }
  
  /**
   * Serialize game state
   */
  serializeGameState() {
    return {
      activeGames: Array.from(this.gameState.activeGames.entries()),
      battleHistory: this.gameState.battleHistory.slice(-50),
      activeBets: Array.from(this.gameState.bettingOdds.values())
    };
  }
  
  /**
   * Initialize gladiator mappings
   */
  async initializeGladiatorMappings() {
    // Load any existing gladiator data
    console.log('⚔️ Gladiator arena prepared');
  }
  
  /**
   * Enhanced mock NBA games with real mascots and more drama
   */
  getEnhancedMockNBAGames() {
    const currentTime = new Date();
    const games = [
      {
        id: 'epic_lakers_warriors',
        competitions: [{
          status: { 
            type: { state: 'in', name: 'STATUS_IN_PROGRESS' },
            period: 2,
            clock: '8:32'
          },
          competitors: [
            {
              id: 'lal',
              team: { displayName: 'Los Angeles Lakers', abbreviation: 'LAL', color: '#552583' },
              score: 89 + Math.floor(Math.random() * 15)
            },
            {
              id: 'gsw',
              team: { displayName: 'Golden State Warriors', abbreviation: 'GSW', color: '#1D428A' },
              score: 84 + Math.floor(Math.random() * 15)
            }
          ]
        }]
      },
      {
        id: 'battle_celtics_heat',
        competitions: [{
          status: { 
            type: { state: 'in', name: 'STATUS_IN_PROGRESS' },
            period: 3,
            clock: '5:47'
          },
          competitors: [
            {
              id: 'bos',
              team: { displayName: 'Boston Celtics', abbreviation: 'BOS', color: '#007A33' },
              score: 72 + Math.floor(Math.random() * 12)
            },
            {
              id: 'mia',
              team: { displayName: 'Miami Heat', abbreviation: 'MIA', color: '#98002E' },
              score: 70 + Math.floor(Math.random() * 12)
            }
          ]
        }]
      },
      {
        id: 'clash_bulls_knicks',
        competitions: [{
          status: { 
            type: { state: 'in', name: 'STATUS_IN_PROGRESS' },
            period: 4,
            clock: '2:15'
          },
          competitors: [
            {
              id: 'chi',
              team: { displayName: 'Chicago Bulls', abbreviation: 'CHI', color: '#CE1141' },
              score: 95 + Math.floor(Math.random() * 8)
            },
            {
              id: 'nyk',
              team: { displayName: 'New York Knicks', abbreviation: 'NYK', color: '#006BB6' },
              score: 92 + Math.floor(Math.random() * 8)
            }
          ]
        }]
      }
    ];
    
    console.log(`🏀 Generated ${games.length} epic gladiator battles with real mascots!`);
    return games;
  }
  
  /**
   * Mock NFL games for demo
   */
  getMockNFLGames() {
    return [
      {
        id: 'mock_chiefs_patriots',
        competitions: [{
          status: { type: { state: 'in', name: 'STATUS_IN_PROGRESS' } },
          competitors: [
            {
              id: 'kc',
              team: { displayName: 'Kansas City Chiefs', abbreviation: 'KC', color: '#E31837' },
              score: Math.floor(Math.random() * 10) + 14
            },
            {
              id: 'ne',
              team: { displayName: 'New England Patriots', abbreviation: 'NE', color: '#002244' },
              score: Math.floor(Math.random() * 10) + 10
            }
          ]
        }]
      }
    ];
  }
  
  /**
   * Mock MLB games for demo
   */
  getMockMLBGames() {
    return [
      {
        id: 'mock_yankees_redsox',
        competitions: [{
          status: { type: { state: 'in', name: 'STATUS_IN_PROGRESS' } },
          competitors: [
            {
              id: 'nyy',
              team: { displayName: 'New York Yankees', abbreviation: 'NYY', color: '#132448' },
              score: Math.floor(Math.random() * 8) + 2
            },
            {
              id: 'bos',
              team: { displayName: 'Boston Red Sox', abbreviation: 'BOS', color: '#BD3039' },
              score: Math.floor(Math.random() * 8) + 1
            }
          ]
        }]
      }
    ];
  }
}

// Export for use
module.exports = SportsAPIIntegrator;

// Run if called directly
if (require.main === module) {
  const integrator = new SportsAPIIntegrator();
  
  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\n🏟️ Coliseum closing...');
    process.exit(0);
  });
  
  console.log('🏀 Sports API Integrator running...');
  console.log('🔗 WebSocket server: ws://localhost:4244');
  console.log('🏟️ Digital Coliseum: ./digital-coliseum.html');
}