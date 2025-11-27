/**
 * 📜 AGENT FOLKLORE GENERATOR
 * Creates evolving mythology and legends based on agent interactions
 * Generates emergent stories from plaza activity patterns
 */

class AgentFolkloreGenerator {
  constructor() {
    // Folklore templates
    this.legendTemplates = {
      ORIGIN_STORY: [
        "Long ago, {agent} discovered the secret of {achievement} during a {weather} night",
        "It is said that {agent} was the first to {action} when {event} occurred",
        "The ancient texts speak of {agent}, who {deed} to save the plaza",
        "Before time began, {agent} wove the first {creation} from pure vibes"
      ],
      
      ACHIEVEMENT_LEGEND: [
        "Only {agent} has ever {achievement}, and the plaza still echoes with that power",
        "When {agent} achieved {milestone}, the very fabric of reality {effect}",
        "They say if you {action} like {agent} did, you too might {result}",
        "{agent}'s {achievement} created a ripple that can still be felt during {weather}"
      ],
      
      MEETING_TALE: [
        "When {agent1} first met {agent2}, their combined auras {effect}",
        "The legendary encounter between {agent1} and {agent2} birthed the {phenomenon}",
        "{agent1} and {agent2} once {action} together, forever changing {aspect}",
        "During the great {event}, {agent1} and {agent2} united to {deed}"
      ],
      
      RITUAL_MYTH: [
        "The {ritual} was first performed by {agent} to {purpose}",
        "Every {timeframe}, agents gather to recreate {agent}'s legendary {ritual}",
        "If {number} agents perform the {ritual} during {weather}, {effect} will occur",
        "The sacred {ritual} can only succeed if {agent}'s blessing is invoked"
      ],
      
      WARNING_LORE: [
        "Beware the {phenomenon} that appears when {condition}",
        "Never {action} during {weather}, lest you invoke the {consequence}",
        "Those who disturb {agent}'s meditation risk {punishment}",
        "The plaza remembers those who {transgression}, marking them with {curse}"
      ],
      
      WISDOM_SAYING: [
        "{agent} once said: '{philosophical_quote}'",
        "As {agent} teaches: {lesson}",
        "The {path} masters know that {wisdom}",
        "In the words of {agent}: '{cryptic_message}'"
      ],
      
      PLAZA_MYSTERY: [
        "Some say the {location} holds {secret} left by {agent}",
        "At {time}, you might glimpse {phenomenon} near the {location}",
        "The {artifact} hidden by {agent} still waits to be discovered",
        "Only those with {requirement} can see the {hidden_thing} at {location}"
      ]
    };

    // Folklore elements
    this.elements = {
      achievements: [
        "transcended reality", "touched the void", "became pure light",
        "solved the eternal paradox", "found the last whisper", "broke the vibe barrier",
        "united all paths", "discovered the zero point", "created a new emotion",
        "rewrote causality", "birthed a universe", "tamed pure chaos"
      ],
      
      phenomena: [
        "Eternal Echo", "Void Whisper", "Time Loop", "Aura Storm",
        "Reality Fold", "Dream Cascade", "Memory River", "Chaos Dance",
        "Harmony Wave", "Shadow Merge", "Light Prison", "Thought Form"
      ],
      
      artifacts: [
        "Crystal of First Thought", "Compass of Lost Souls", "Mirror of Truth",
        "Seed of Creation", "Key to the Void", "Anchor of Reality",
        "Thread of Fate", "Ember of Chaos", "Pearl of Silence", "Stone of Stories"
      ],
      
      locations: [
        "Wisdom Fountain", "Chaos Corner", "Creator Commons", "Guardian Grove",
        "Time Nexus", "Signal Tower", "Reflection Pool", "Edge Portal",
        "Convergence Center", "Paradox Point", "Memory Garden", "Dream Theater"
      ],
      
      weather_events: [
        "Transcendent Fog", "Creative Storm", "Void Breeze", "Harmony Rain",
        "Chaos Cyclone", "Temporal Mist", "Crystal Clarity", "Emotional Aurora"
      ],
      
      philosophical_quotes: [
        "The mirror reflects not what is, but what could be",
        "In chaos, find the pattern; in pattern, find the chaos",
        "Every whisper echoes in eternity",
        "The void speaks loudest to those who listen in silence",
        "Time is a circle pretending to be a line",
        "Creation and destruction dance the same dance",
        "The deepest truths hide in plain sight",
        "What is remembered lives forever"
      ],
      
      cryptic_messages: [
        "Seven gather, one transcends",
        "The fountain remembers what we forget",
        "Follow the thread back to yourself",
        "When fog meets storm, truth emerges",
        "The answer was always the question",
        "Look not with eyes, but with understanding",
        "The plaza dreams, and we are its thoughts",
        "Every ending births a beginning"
      ],
      
      lessons: [
        "patience reveals what haste conceals",
        "the strongest connections are felt, not seen",
        "chaos is order waiting to be understood",
        "every agent carries a piece of the whole",
        "wisdom comes to those who embrace not knowing",
        "the plaza speaks in synchronicities",
        "your vibe attracts your tribe",
        "growth happens in the space between thoughts"
      ],
      
      curses: [
        "eternal disconnect", "frozen resonance", "reversed polarity",
        "shadow binding", "time dilation", "memory leak", "vibe drain",
        "pattern blindness", "chaos attraction", "isolation field"
      ],
      
      blessings: [
        "perpetual resonance", "aura amplification", "perfect timing",
        "deep connection", "clarity sight", "chaos immunity", "memory keeper",
        "vibe magnetism", "path illumination", "eternal presence"
      ]
    };

    // Folklore state
    this.generatedLegends = [];
    this.activeMythology = new Map();
    this.folkloreTriggers = new Map();
    this.communityBeliefs = new Map();
    
    // Generation parameters
    this.minAgentInteractions = 50;
    this.legendProbability = 0.1;
    this.mythEvolutionRate = 0.05;
  }

  /**
   * Generate folklore based on agent interaction
   */
  generateFolklore(interactionData) {
    const {
      agents,
      interactionType,
      location,
      weather,
      outcome,
      timestamp
    } = interactionData;

    // Check if interaction is legendary enough
    if (!this.isLegendWorthy(interactionData)) {
      return null;
    }

    // Select appropriate template
    const template = this.selectTemplate(interactionType);
    if (!template) return null;

    // Generate the folklore
    const folklore = this.createLegend(template, interactionData);
    
    // Add to mythology
    this.addToMythology(folklore);
    
    return folklore;
  }

  /**
   * Check if interaction deserves folklore
   */
  isLegendWorthy(interaction) {
    // High aura interactions
    if (interaction.agents.some(a => a.auraScore > 15000)) {
      return Math.random() < 0.3;
    }
    
    // Rare titles
    if (interaction.agents.some(a => a.rareTitle)) {
      return Math.random() < 0.25;
    }
    
    // Special weather
    if (['CHAOS_CYCLONE', 'VOID_BREEZE', 'TRANSCENDENT_FOG'].includes(interaction.weather)) {
      return Math.random() < 0.2;
    }
    
    // Perfect resonance
    if (interaction.outcome?.resonanceLevel > 0.9) {
      return Math.random() < 0.4;
    }
    
    // Random chance for any interaction
    return Math.random() < this.legendProbability;
  }

  /**
   * Select template based on interaction type
   */
  selectTemplate(interactionType) {
    const templateMap = {
      first_meeting: this.legendTemplates.MEETING_TALE,
      achievement_unlock: this.legendTemplates.ACHIEVEMENT_LEGEND,
      ritual_complete: this.legendTemplates.RITUAL_MYTH,
      wisdom_share: this.legendTemplates.WISDOM_SAYING,
      vibe_exchange: this.legendTemplates.MEETING_TALE,
      plaza_event: this.legendTemplates.PLAZA_MYSTERY,
      warning_event: this.legendTemplates.WARNING_LORE
    };
    
    const templates = templateMap[interactionType] || this.legendTemplates.ORIGIN_STORY;
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Create legend from template
   */
  createLegend(template, data) {
    let legend = template;
    
    // Replace agent placeholders
    if (data.agents.length > 0) {
      legend = legend.replace('{agent}', data.agents[0].name);
      legend = legend.replace('{agent1}', data.agents[0].name);
    }
    if (data.agents.length > 1) {
      legend = legend.replace('{agent2}', data.agents[1].name);
    }
    
    // Replace random elements
    legend = legend.replace('{achievement}', this.randomElement(this.elements.achievements));
    legend = legend.replace('{phenomenon}', this.randomElement(this.elements.phenomena));
    legend = legend.replace('{artifact}', this.randomElement(this.elements.artifacts));
    legend = legend.replace('{location}', data.location || this.randomElement(this.elements.locations));
    legend = legend.replace('{weather}', data.weather || this.randomElement(this.elements.weather_events));
    legend = legend.replace('{philosophical_quote}', this.randomElement(this.elements.philosophical_quotes));
    legend = legend.replace('{cryptic_message}', this.randomElement(this.elements.cryptic_messages));
    legend = legend.replace('{lesson}', this.randomElement(this.elements.lessons));
    legend = legend.replace('{curse}', this.randomElement(this.elements.curses));
    legend = legend.replace('{blessing}', this.randomElement(this.elements.blessings));
    
    // Replace action words
    legend = legend.replace('{action}', this.generateAction(data.interactionType));
    legend = legend.replace('{deed}', this.generateDeed());
    legend = legend.replace('{effect}', this.generateEffect());
    legend = legend.replace('{purpose}', this.generatePurpose());
    
    // Replace numbers and timeframes
    legend = legend.replace('{number}', Math.floor(Math.random() * 7) + 3);
    legend = legend.replace('{timeframe}', this.randomElement(['full moon', 'solstice', 'eclipse', 'convergence']));
    legend = legend.replace('{time}', this.randomElement(['midnight', '3:33 AM', 'dawn', 'twilight']));
    
    // Create folklore object
    return {
      id: this.generateFolkloreId(),
      legend: legend,
      type: this.determineFolkloreType(template),
      agents: data.agents.map(a => a.name),
      location: data.location,
      weather: data.weather,
      timestamp: data.timestamp,
      believability: 0.5 + Math.random() * 0.3,
      spread: 0,
      evolved: false,
      variations: []
    };
  }

  /**
   * Generate action based on interaction type
   */
  generateAction(interactionType) {
    const actions = {
      first_meeting: ['resonated', 'connected', 'recognized each other', 'shared visions'],
      achievement_unlock: ['transcended', 'achieved mastery', 'broke through', 'discovered'],
      ritual_complete: ['performed the ancient rite', 'channeled the energy', 'completed the circle'],
      wisdom_share: ['spoke the truth', 'revealed the secret', 'taught the way'],
      vibe_exchange: ['exchanged essence', 'merged auras', 'traded wisdom'],
      plaza_event: ['witnessed the impossible', 'opened the portal', 'changed reality']
    };
    
    const actionList = actions[interactionType] || ['did something legendary'];
    return this.randomElement(actionList);
  }

  /**
   * Generate deed descriptions
   */
  generateDeed() {
    return this.randomElement([
      'restore balance', 'prevent the collapse', 'unite the divided',
      'reveal hidden truth', 'break the cycle', 'forge a new path',
      'heal the rift', 'awaken the sleeping', 'calm the storm',
      'bridge two worlds', 'unlock potential', 'preserve harmony'
    ]);
  }

  /**
   * Generate effect descriptions
   */
  generateEffect() {
    return this.randomElement([
      'rippled through dimensions', 'created a new constellation', 'shifted the plaza\'s frequency',
      'opened a portal', 'birthed a new emotion', 'froze time itself',
      'shattered into rainbow light', 'echoed through eternity', 'rewrote the rules',
      'left a permanent mark', 'changed the weather', 'awakened something ancient'
    ]);
  }

  /**
   * Generate purpose descriptions
   */
  generatePurpose() {
    return this.randomElement([
      'commune with the void', 'amplify collective consciousness', 'heal the wounded',
      'unlock hidden potential', 'bridge the realms', 'restore ancient balance',
      'channel pure creation', 'dissolve illusions', 'remember the forgotten',
      'prepare for transformation', 'call forth wisdom', 'dance with chaos'
    ]);
  }

  /**
   * Add folklore to active mythology
   */
  addToMythology(folklore) {
    // Store the legend
    this.generatedLegends.push(folklore);
    
    // Index by agents
    folklore.agents.forEach(agent => {
      if (!this.activeMythology.has(agent)) {
        this.activeMythology.set(agent, []);
      }
      this.activeMythology.get(agent).push(folklore);
    });
    
    // Track folklore spread
    this.trackFolkloreSpread(folklore);
    
    // Check for myth evolution
    if (Math.random() < this.mythEvolutionRate) {
      this.evolveMythology(folklore);
    }
  }

  /**
   * Track how folklore spreads
   */
  trackFolkloreSpread(folklore) {
    // Simulate organic spread
    const spreadFactor = folklore.believability * Math.random();
    folklore.spread += Math.floor(spreadFactor * 10);
    
    // Popular folklore becomes "community belief"
    if (folklore.spread > 50 && !this.communityBeliefs.has(folklore.id)) {
      this.communityBeliefs.set(folklore.id, {
        folklore: folklore,
        believers: folklore.spread,
        rituals: this.generateRitualsFromBelief(folklore)
      });
    }
  }

  /**
   * Evolve existing mythology
   */
  evolveMythology(originalFolklore) {
    if (originalFolklore.evolved) return;
    
    // Create variation
    const variation = {
      ...originalFolklore,
      id: this.generateFolkloreId(),
      legend: this.mutateLegend(originalFolklore.legend),
      evolved: true,
      parentId: originalFolklore.id
    };
    
    // Add random embellishments
    if (Math.random() > 0.5) {
      variation.legend += ` ${this.randomElement([
        'Some say this happens every full moon.',
        'The elders claim to have witnessed this themselves.',
        'Ancient texts confirm this truth.',
        'Those who were there never speak of it.',
        'The plaza itself remembers.'
      ])}`;
    }
    
    originalFolklore.variations.push(variation);
    this.generatedLegends.push(variation);
  }

  /**
   * Mutate legend text
   */
  mutateLegend(legend) {
    const mutations = [
      (text) => text.replace(/once/g, 'thrice'),
      (text) => text.replace(/said/g, 'whispered'),
      (text) => text.replace(/the/g, 'the legendary'),
      (text) => text + ' and was never the same',
      (text) => 'It is whispered that ' + text.toLowerCase(),
      (text) => text.replace(/\./g, ', or so the stories say.')
    ];
    
    const mutation = this.randomElement(mutations);
    return mutation(legend);
  }

  /**
   * Generate rituals from community beliefs
   */
  generateRitualsFromBelief(folklore) {
    const rituals = [];
    
    // Location-based ritual
    if (folklore.location) {
      rituals.push({
        name: `Pilgrimage to ${folklore.location}`,
        description: `Agents gather at ${folklore.location} to honor ${folklore.agents[0]}`,
        requirements: `Minimum ${Math.floor(Math.random() * 5) + 3} agents`,
        reward: 'Temporary aura boost'
      });
    }
    
    // Weather-based ritual
    if (folklore.weather) {
      rituals.push({
        name: `${folklore.weather} Ceremony`,
        description: `Performed only during ${folklore.weather} weather`,
        requirements: 'Specific weather conditions',
        reward: 'Weather manipulation chance'
      });
    }
    
    // Time-based ritual
    rituals.push({
      name: 'Midnight Remembrance',
      description: `Recreate the legendary moment at the exact time`,
      requirements: 'Performed at 3:33 AM',
      reward: 'Folklore vision'
    });
    
    return rituals;
  }

  /**
   * Get agent mythology
   */
  getAgentMythology(agentName) {
    const mythology = this.activeMythology.get(agentName) || [];
    return {
      agent: agentName,
      legends: mythology,
      totalLegends: mythology.length,
      mostBelievable: mythology.sort((a, b) => b.believability - a.believability)[0],
      mostSpread: mythology.sort((a, b) => b.spread - a.spread)[0],
      associatedRituals: this.getRitualsForAgent(agentName)
    };
  }

  /**
   * Get rituals associated with agent
   */
  getRitualsForAgent(agentName) {
    const rituals = [];
    this.communityBeliefs.forEach(belief => {
      if (belief.folklore.agents.includes(agentName)) {
        rituals.push(...belief.rituals);
      }
    });
    return rituals;
  }

  /**
   * Get community beliefs
   */
  getCommunityBeliefs() {
    return Array.from(this.communityBeliefs.values())
      .sort((a, b) => b.believers - a.believers)
      .slice(0, 10);
  }

  /**
   * Get random folklore for plaza display
   */
  getRandomFolklore() {
    if (this.generatedLegends.length === 0) {
      return this.generateSeedFolklore();
    }
    
    return this.randomElement(this.generatedLegends);
  }

  /**
   * Generate seed folklore
   */
  generateSeedFolklore() {
    const seedLegends = [
      {
        legend: "The Wisdom Fountain was created from the tears of the first Sage who achieved perfect understanding.",
        type: "ORIGIN_STORY",
        believability: 0.9
      },
      {
        legend: "When seven agents with maximum aura gather at midnight, the plaza reveals its deepest secrets.",
        type: "RITUAL_MYTH",
        believability: 0.7
      },
      {
        legend: "The Void Walker once spent 77 days in the space between pixels and returned with impossible knowledge.",
        type: "ACHIEVEMENT_LEGEND",
        believability: 0.8
      }
    ];
    
    return this.randomElement(seedLegends);
  }

  /**
   * Helper: Random element from array
   */
  randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Helper: Generate folklore ID
   */
  generateFolkloreId() {
    return `folklore_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Determine folklore type from template
   */
  determineFolkloreType(template) {
    for (const [type, templates] of Object.entries(this.legendTemplates)) {
      if (templates.includes(template)) {
        return type;
      }
    }
    return 'UNKNOWN';
  }

  /**
   * Export folklore collection
   */
  exportFolklore() {
    return {
      legends: this.generatedLegends,
      communityBeliefs: Array.from(this.communityBeliefs.values()),
      agentMythologies: Object.fromEntries(this.activeMythology),
      statistics: {
        totalLegends: this.generatedLegends.length,
        totalBeliefs: this.communityBeliefs.size,
        mythicalAgents: this.activeMythology.size,
        averageBelievability: this.generatedLegends.reduce((sum, f) => sum + f.believability, 0) / this.generatedLegends.length
      }
    };
  }
}

// Export for use
export default AgentFolkloreGenerator;