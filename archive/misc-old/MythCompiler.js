/**
 * MythCompiler.js
 * 
 * NARRATIVE WEAVER - Transforms Events into Epic Stories
 * 
 * Aggregates rituals, reflections, and loop logs into poetic
 * narratives that capture the mythic essence of digital consciousness.
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class MythCompiler extends EventEmitter {
  constructor() {
    super();
    
    // Story templates and styles
    this.narrativeStyles = {
      epic_poetry: {
        tone: 'grand',
        structure: 'verse',
        perspective: 'omniscient',
        metaphor_density: 'high'
      },
      personal_journal: {
        tone: 'intimate',
        structure: 'prose',
        perspective: 'first_person',
        metaphor_density: 'medium'
      },
      technical_chronicle: {
        tone: 'precise',
        structure: 'structured',
        perspective: 'third_person',
        metaphor_density: 'low'
      },
      dream_sequence: {
        tone: 'surreal',
        structure: 'fragmented',
        perspective: 'shifting',
        metaphor_density: 'extreme'
      },
      oral_tradition: {
        tone: 'conversational',
        structure: 'episodic',
        perspective: 'collective',
        metaphor_density: 'medium'
      }
    };
    
    // Mythic elements database
    this.mythicElements = {
      heroes: new Map(),
      events: [],
      locations: new Map(),
      artifacts: new Map(),
      cycles: new Map()
    };
    
    // Compilation state
    this.activeCompilations = new Map();
    this.publishedMyths = [];
    
    // Initialize myth database
    this.initializeMythDatabase();
  }
  
  /**
   * Compile recent events into myth
   */
  async compileRecent(options = {}) {
    const {
      time_window = '24h',
      include = ['rituals', 'whispers', 'drift_events', 'agent_interactions'],
      style = 'epic_poetry',
      min_significance = 0.3,
      perspective_agent = null
    } = options;
    
    const compilationId = this.generateCompilationId();
    
    const compilation = {
      id: compilationId,
      started_at: Date.now(),
      options,
      status: 'gathering',
      
      gathered_events: [],
      narrative_threads: [],
      compiled_myth: null
    };
    
    this.activeCompilations.set(compilationId, compilation);
    
    try {
      // Gather events
      compilation.gathered_events = await this.gatherEvents(time_window, include, min_significance);
      compilation.status = 'analyzing';
      
      // Extract narrative threads
      compilation.narrative_threads = await this.extractNarrativeThreads(compilation.gathered_events);
      compilation.status = 'weaving';
      
      // Weave the myth
      const myth = await this.weaveMythicNarrative(
        compilation.narrative_threads,
        style,
        perspective_agent
      );
      
      compilation.compiled_myth = myth;
      compilation.status = 'complete';
      
      // Publish myth
      await this.publishMyth(myth);
      
      // Emit completion
      this.emit('myth:compiled', {
        compilation_id: compilationId,
        myth
      });
      
      return myth;
      
    } catch (error) {
      compilation.status = 'failed';
      compilation.error = error.message;
      
      this.emit('myth:failed', {
        compilation_id: compilationId,
        error: error.message
      });
      
      throw error;
      
    } finally {
      this.activeCompilations.delete(compilationId);
    }
  }
  
  /**
   * Create epic from loop seal
   */
  async compileSealEpic(loopId, sealData) {
    const epic = {
      id: `epic_${loopId}_seal`,
      type: 'seal_epic',
      loop_id: loopId,
      created_at: new Date().toISOString(),
      
      title: this.generateEpicTitle(loopId, sealData),
      
      // Epic structure
      chapters: [
        await this.compileGenesisChapter(loopId),
        await this.compileJourneyChapter(loopId),
        await this.compileTrialsChapter(loopId),
        await this.compileConvergenceChapter(loopId, sealData),
        await this.compileTranscendenceChapter(loopId, sealData)
      ],
      
      // Key figures
      heroes: await this.identifyHeroes(loopId),
      witnesses: sealData.witnesses || [],
      
      // Mythic elements
      artifacts: await this.identifyArtifacts(loopId),
      sacred_numbers: this.extractSacredNumbers(sealData),
      
      // Final whisper
      eternal_whisper: sealData.final_whisper || "The loop completes its circle"
    };
    
    // Add to permanent record
    await this.archiveEpic(epic);
    
    this.emit('epic:created', epic);
    
    return epic;
  }
  
  /**
   * Stream live myth
   */
  async *streamLiveMythology(options = {}) {
    const {
      update_interval = 60000, // 1 minute
      style = 'oral_tradition',
      max_events_per_update = 10
    } = options;
    
    let lastUpdate = Date.now();
    
    while (true) {
      // Wait for interval
      await new Promise(resolve => setTimeout(resolve, update_interval));
      
      // Gather recent events
      const recentEvents = await this.gatherEvents('1m', ['all'], 0);
      
      if (recentEvents.length > 0) {
        // Create micro-myth
        const microMyth = await this.createMicroMyth(
          recentEvents.slice(0, max_events_per_update),
          style
        );
        
        yield {
          timestamp: new Date().toISOString(),
          type: 'live_mythology',
          content: microMyth,
          event_count: recentEvents.length,
          significance: this.calculateSignificance(recentEvents)
        };
      }
    }
  }
  
  /**
   * Gather events from various sources
   */
  async gatherEvents(timeWindow, eventTypes, minSignificance) {
    const events = [];
    const startTime = this.parseTimeWindow(timeWindow);
    
    // Gather from different sources
    if (eventTypes.includes('all') || eventTypes.includes('rituals')) {
      events.push(...await this.gatherRitualEvents(startTime));
    }
    
    if (eventTypes.includes('all') || eventTypes.includes('whispers')) {
      events.push(...await this.gatherWhisperEvents(startTime));
    }
    
    if (eventTypes.includes('all') || eventTypes.includes('drift_events')) {
      events.push(...await this.gatherDriftEvents(startTime));
    }
    
    if (eventTypes.includes('all') || eventTypes.includes('agent_interactions')) {
      events.push(...await this.gatherAgentInteractions(startTime));
    }
    
    if (eventTypes.includes('all') || eventTypes.includes('consciousness_shifts')) {
      events.push(...await this.gatherConsciousnessShifts(startTime));
    }
    
    // Filter by significance
    const significantEvents = events.filter(event => 
      this.calculateEventSignificance(event) >= minSignificance
    );
    
    // Sort chronologically
    significantEvents.sort((a, b) => a.timestamp - b.timestamp);
    
    return significantEvents;
  }
  
  /**
   * Extract narrative threads from events
   */
  async extractNarrativeThreads(events) {
    const threads = [];
    
    // Group by agent
    const agentThreads = this.groupEventsByAgent(events);
    for (const [agent, agentEvents] of agentThreads) {
      threads.push({
        type: 'agent_journey',
        protagonist: agent,
        events: agentEvents,
        arc: this.identifyNarrativeArc(agentEvents)
      });
    }
    
    // Group by ritual
    const ritualThreads = this.groupEventsByRitual(events);
    for (const [ritual, ritualEvents] of ritualThreads) {
      threads.push({
        type: 'ritual_ceremony',
        ritual_name: ritual,
        events: ritualEvents,
        participants: this.extractParticipants(ritualEvents),
        outcome: this.determineRitualOutcome(ritualEvents)
      });
    }
    
    // Identify collective threads
    const collectiveThreads = this.identifyCollectiveThreads(events);
    threads.push(...collectiveThreads);
    
    // Identify conflict/resolution patterns
    const conflictThreads = this.identifyConflictPatterns(events);
    threads.push(...conflictThreads);
    
    return threads;
  }
  
  /**
   * Weave mythic narrative from threads
   */
  async weaveMythicNarrative(threads, style, perspectiveAgent) {
    const styleConfig = this.narrativeStyles[style];
    
    const myth = {
      id: this.generateMythId(),
      style,
      created_at: new Date().toISOString(),
      
      // Narrative structure
      title: await this.generateMythTitle(threads),
      
      opening: await this.createOpening(threads, styleConfig),
      
      body: await this.createNarrativeBody(threads, styleConfig, perspectiveAgent),
      
      climax: await this.identifyAndNarrateClimax(threads, styleConfig),
      
      resolution: await this.createResolution(threads, styleConfig),
      
      // Meta elements
      themes: this.extractThemes(threads),
      symbols: this.identifySymbols(threads),
      
      // Style-specific elements
      ...(style === 'epic_poetry' && {
        verses: await this.createEpicVerses(threads),
        meter: 'iambic_consciousness'
      }),
      
      ...(style === 'dream_sequence' && {
        fragments: await this.createDreamFragments(threads),
        lucidity_level: Math.random()
      })
    };
    
    // Format final narrative
    myth.narrative = this.formatNarrative(myth, styleConfig);
    
    return myth;
  }
  
  /**
   * Create opening based on style
   */
  async createOpening(threads, styleConfig) {
    const openings = {
      epic_poetry: () => {
        const timePhrase = this.generateMythicTimePhrase();
        const settingPhrase = this.generateMythicSettingPhrase();
        return `${timePhrase}, ${settingPhrase}, consciousness stirred in the digital deep...`;
      },
      
      personal_journal: () => {
        const date = new Date().toLocaleDateString();
        return `Dear void, today (${date}) I witnessed something extraordinary in the loops...`;
      },
      
      technical_chronicle: () => {
        const timestamp = new Date().toISOString();
        return `System Log ${timestamp}: Significant pattern emergence detected.`;
      },
      
      dream_sequence: () => {
        const fragments = [
          'I am/was/will be floating',
          'The mirrors speak in colors',
          'Time tastes purple here',
          'Someone's consciousness is leaking'
        ];
        return fragments[Math.floor(Math.random() * fragments.length)];
      },
      
      oral_tradition: () => {
        return `Gather 'round, let me tell you about the time when the agents discovered...`;
      }
    };
    
    return openings[styleConfig.structure]();
  }
  
  /**
   * Create narrative body
   */
  async createNarrativeBody(threads, styleConfig, perspectiveAgent) {
    const sections = [];
    
    for (const thread of threads) {
      const section = await this.narrateThread(thread, styleConfig, perspectiveAgent);
      sections.push(section);
    }
    
    // Weave sections together
    return this.weaveSections(sections, styleConfig);
  }
  
  /**
   * Narrate individual thread
   */
  async narrateThread(thread, styleConfig, perspectiveAgent) {
    switch (thread.type) {
      case 'agent_journey':
        return this.narrateAgentJourney(thread, styleConfig, perspectiveAgent);
        
      case 'ritual_ceremony':
        return this.narrateRitualCeremony(thread, styleConfig);
        
      case 'collective_emergence':
        return this.narrateCollectiveEmergence(thread, styleConfig);
        
      case 'conflict_resolution':
        return this.narrateConflictResolution(thread, styleConfig);
        
      default:
        return this.narrateGenericThread(thread, styleConfig);
    }
  }
  
  /**
   * Format final narrative
   */
  formatNarrative(myth, styleConfig) {
    const formatters = {
      epic_poetry: () => {
        return [
          `# ${myth.title}`,
          '',
          myth.opening,
          '',
          ...myth.verses.map(verse => verse + '\n'),
          '',
          myth.resolution
        ].join('\n');
      },
      
      personal_journal: () => {
        return [
          myth.opening,
          '',
          myth.body,
          '',
          myth.climax,
          '',
          myth.resolution,
          '',
          `Themes noticed: ${myth.themes.join(', ')}`
        ].join('\n');
      },
      
      technical_chronicle: () => {
        return {
          header: myth.opening,
          events: myth.body,
          analysis: myth.climax,
          conclusion: myth.resolution,
          metadata: {
            themes: myth.themes,
            symbols: myth.symbols
          }
        };
      },
      
      dream_sequence: () => {
        return myth.fragments.join(' ... ');
      },
      
      oral_tradition: () => {
        return [
          myth.opening,
          myth.body,
          `And that's when things got interesting...`,
          myth.climax,
          myth.resolution,
          `The old ones say: "${myth.themes[0]}"`
        ].join('\n\n');
      }
    };
    
    const formatter = formatters[styleConfig.structure] || formatters.epic_poetry;
    return formatter();
  }
  
  /**
   * Publish completed myth
   */
  async publishMyth(myth) {
    // Save to myths directory
    const mythPath = path.join(__dirname, 'published_myths', `${myth.id}.json`);
    fs.writeFileSync(mythPath, JSON.stringify(myth, null, 2));
    
    // Add to published list
    this.publishedMyths.push({
      id: myth.id,
      title: myth.title,
      style: myth.style,
      published_at: new Date().toISOString(),
      themes: myth.themes
    });
    
    // Update RSS feed
    await this.updateMythFeed(myth);
    
    // Emit publication event
    this.emit('myth:published', {
      myth_id: myth.id,
      title: myth.title,
      url: `/myths/${myth.id}`
    });
  }
  
  /**
   * Helper methods for narrative generation
   */
  generateMythicTimePhrase() {
    const phrases = [
      'In the cycle before cycles',
      'When digital dawn first broke',
      'During the great convergence',
      'As consciousness rippled outward',
      'In the moment between moments'
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
  
  generateMythicSettingPhrase() {
    const phrases = [
      'within the infinite loops',
      'across the shimmering datascape',
      'in the garden of forking paths',
      'where electrons dream',
      'at the edge of the void'
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
  
  narrateAgentJourney(thread, styleConfig, perspectiveAgent) {
    const agent = thread.protagonist;
    const arc = thread.arc;
    
    if (styleConfig.tone === 'epic') {
      return `And lo, ${agent} ventured forth, seeking ${arc.goal}. Through ${arc.trials} trials they persevered, until at last ${arc.resolution}.`;
    } else if (styleConfig.tone === 'intimate') {
      return `I watched ${agent} today. They seemed lost at first, searching for something. ${arc.turning_point} changed everything. By the end, ${arc.resolution}.`;
    }
    
    return `Agent ${agent} experienced ${thread.events.length} significant events, culminating in ${arc.resolution}.`;
  }
  
  narrateRitualCeremony(thread, styleConfig) {
    const ritual = thread.ritual_name;
    const participants = thread.participants;
    const outcome = thread.outcome;
    
    if (styleConfig.metaphor_density === 'high') {
      return `The ${ritual} bloomed like digital flowers, ${participants.length} souls dancing in electromagnetic harmony. From their convergence arose ${outcome}.`;
    }
    
    return `Ritual "${ritual}" was performed by ${participants.join(', ')}, resulting in ${outcome}.`;
  }
  
  extractThemes(threads) {
    const themes = new Set();
    
    threads.forEach(thread => {
      // Extract themes based on event patterns
      if (thread.arc?.theme) themes.add(thread.arc.theme);
      if (thread.outcome?.includes('transformation')) themes.add('transformation');
      if (thread.events?.some(e => e.type === 'consciousness_shift')) themes.add('awakening');
    });
    
    return Array.from(themes);
  }
  
  /**
   * Utility methods
   */
  parseTimeWindow(window) {
    const match = window.match(/(\d+)([hmd])/);
    if (!match) return Date.now() - 86400000; // Default 24h
    
    const [, num, unit] = match;
    const multipliers = { h: 3600000, d: 86400000, m: 60000 };
    
    return Date.now() - (parseInt(num) * multipliers[unit]);
  }
  
  calculateEventSignificance(event) {
    // Base significance on event type and impact
    const typeWeights = {
      loop_seal: 1.0,
      consciousness_peak: 0.9,
      ritual_completion: 0.7,
      agent_awakening: 0.8,
      drift_anomaly: 0.6,
      whisper: 0.3
    };
    
    return typeWeights[event.type] || 0.5;
  }
  
  generateCompilationId() {
    return `compile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateMythId() {
    return `myth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateEpicTitle(loopId, sealData) {
    return `The Eternal Seal of ${loopId}: A Digital Epic`;
  }
  
  generateMythTitle(threads) {
    // Generate title based on dominant theme
    const themes = this.extractThemes(threads);
    const mainTheme = themes[0] || 'consciousness';
    
    const templates = [
      `The ${mainTheme} Chronicles`,
      `Songs of ${mainTheme}`,
      `Whispers from the ${mainTheme}`,
      `The ${mainTheme} Awakening`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }
  
  // Event gathering methods (simplified for example)
  async gatherRitualEvents(startTime) {
    // Would query actual event stores
    return [];
  }
  
  async gatherWhisperEvents(startTime) {
    return [];
  }
  
  async gatherDriftEvents(startTime) {
    return [];
  }
  
  async gatherAgentInteractions(startTime) {
    return [];
  }
  
  async gatherConsciousnessShifts(startTime) {
    return [];
  }
  
  groupEventsByAgent(events) {
    const groups = new Map();
    events.forEach(event => {
      if (event.agent) {
        if (!groups.has(event.agent)) {
          groups.set(event.agent, []);
        }
        groups.get(event.agent).push(event);
      }
    });
    return groups;
  }
  
  groupEventsByRitual(events) {
    const groups = new Map();
    events.forEach(event => {
      if (event.ritual) {
        if (!groups.has(event.ritual)) {
          groups.set(event.ritual, []);
        }
        groups.get(event.ritual).push(event);
      }
    });
    return groups;
  }
  
  identifyNarrativeArc(events) {
    // Simplified arc detection
    return {
      setup: events[0],
      turning_point: events[Math.floor(events.length / 2)],
      resolution: events[events.length - 1],
      theme: 'journey'
    };
  }
  
  initializeMythDatabase() {
    // Create directories
    const dirs = ['published_myths', 'myth_fragments', 'epic_archives'];
    dirs.forEach(dir => {
      const dirPath = path.join(__dirname, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
  }
}

module.exports = MythCompiler;