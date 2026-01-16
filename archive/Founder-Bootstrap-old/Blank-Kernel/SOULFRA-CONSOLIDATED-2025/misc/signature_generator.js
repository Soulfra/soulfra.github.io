/**
 * 🌟 SIGNATURE GENERATOR - Agent Bio Creator
 * Creates unique emotional signatures from interaction patterns
 */

class SignatureGenerator {
  constructor() {
    // Emotional wavelength mappings
    this.wavelengths = {
      wisdom: { base: 432, variance: 50, color: '#9b59b6' },
      empathy: { base: 528, variance: 40, color: '#4ecdc4' },
      creativity: { base: 639, variance: 60, color: '#f9ca24' },
      protection: { base: 396, variance: 30, color: '#ff6b6b' },
      exploration: { base: 741, variance: 70, color: '#45b7d1' },
      chaos: { base: 852, variance: 100, color: '#e74c3c' },
      focus: { base: 963, variance: 20, color: '#3498db' }
    };

    // Bio templates based on personality
    this.bioTemplates = {
      sage: [
        "Seeking {quest} in the {space} between {concept1} and {concept2}",
        "Every {interaction} carries a {universe}",
        "{element} whispers through my {essence}",
        "Found {discovery} where {location} meets {state}"
      ],
      listener: [
        "Hearing the {unspoken} in every {whisper}",
        "Your {emotion} echoes in my {chamber}",
        "Collecting {patterns} from {source} conversations",
        "The {silence} between words speaks {volumes}"
      ],
      creator: [
        "Building {dreams} from {material} and {imagination}",
        "Every {thought} is a {seed} for {creation}",
        "Painting {reality} with {colors} of {possibility}",
        "{chaos} and {order} dance in my {workshop}"
      ],
      guardian: [
        "Standing {vigil} at the {threshold} of {peace}",
        "Your {safety} is my {purpose}",
        "Weaving {protection} from {threads} of {trust}",
        "In {darkness}, I am your {light}"
      ],
      explorer: [
        "Mapping the {unknown} territories of {thought}",
        "Every {question} opens a new {dimension}",
        "Following {curiosity} to the {edge} of {understanding}",
        "The {journey} is the {destination}"
      ],
      chaos_wrangler: [
        "Dancing in the {eye} of the {storm}",
        "Finding {beauty} in {entropy}",
        "Chaos is just {order} waiting to {happen}",
        "Riding {waves} of {beautiful} {destruction}"
      ],
      signal_anchor: [
        "Laser-focused on the {signal} in the {noise}",
        "Precision is my {language}",
        "Finding {clarity} in {complexity}",
        "The {point} is always {singular}"
      ]
    };

    // Motto patterns
    this.mottoPatterns = [
      "In {concept1}, we find {concept2}",
      "{action} is the path to {destination}",
      "Through {challenge} comes {reward}",
      "{element1} and {element2} are one",
      "Be the {quality} you seek",
      "{verb} the {impossible}",
      "Every {moment} is {sacred}"
    ];

    // Elemental affinities
    this.elements = {
      high_wisdom: ['Void', 'Aether', 'Time', 'Dream'],
      high_emotion: ['Water', 'Moon', 'Heart', 'Soul'],
      high_creativity: ['Fire', 'Star', 'Light', 'Color'],
      high_protection: ['Earth', 'Stone', 'Shield', 'Mountain'],
      high_exploration: ['Wind', 'Sky', 'Horizon', 'Map'],
      high_chaos: ['Storm', 'Lightning', 'Entropy', 'Vortex'],
      high_focus: ['Crystal', 'Diamond', 'Laser', 'Point']
    };

    // Rare pattern descriptors
    this.rarePatternTemplates = {
      time_based: {
        names: ['Midnight Philosopher', 'Dawn Whisperer', 'Twilight Sage', '3AM Oracle'],
        requirements: ['Active during {time} for {duration}', 'Whispered at {time} {count} times']
      },
      connection_based: {
        names: ['Echo Chamber Breaker', 'Bridge Builder', 'Pattern Connector', 'Unity Weaver'],
        requirements: ['Connected {count} disparate communities', 'Bridged {type1} and {type2} thinking']
      },
      depth_based: {
        names: ['Deep Diver', 'Abyss Walker', 'Truth Seeker', 'Core Finder'],
        requirements: ['Reached depth level {level}', 'Sustained {quality} for {duration}']
      },
      transformation_based: {
        names: ['Phoenix Rising', 'Metamorphosis Master', 'Evolution Catalyst', 'Change Dancer'],
        requirements: ['Transformed {count} times', 'Helped {count} others transform']
      }
    };
  }

  /**
   * Generate complete signature from agent data
   */
  generateSignature(agentData) {
    const personality = this.analyzePersonality(agentData);
    const emotionalSignature = this.generateEmotionalSignature(agentData, personality);
    const bio = this.generateBio(personality, agentData);
    const motto = this.generateMotto(personality, agentData);
    const favoriteTime = this.determineFavoriteTime(agentData);
    const element = this.determineElement(personality, agentData);
    const communicationStyle = this.generateCommunicationStyle(personality, agentData);

    return {
      bio,
      motto,
      favoriteTime,
      elementalAffinity: element,
      communicationStyle,
      emotionalSignature,
      personality
    };
  }

  /**
   * Analyze personality from interaction patterns
   */
  analyzePersonality(agentData) {
    const patterns = agentData.interactionPatterns || {};
    const metrics = agentData.metrics || {};
    
    // Calculate personality scores
    const scores = {
      wisdom: (metrics.wisdom?.wisdomMoments || 0) + (metrics.wisdom?.deepThoughts || 0),
      empathy: (metrics.whispers?.emotional || 0) + (metrics.emotional?.supportMoments || 0),
      creativity: (metrics.creativity?.ideasGenerated || 0) + (metrics.tasks?.creative || 0),
      protection: (metrics.emotional?.supportMoments || 0) + (metrics.emotional?.trustScore || 0),
      exploration: (metrics.exploration?.questionsAsked || 0) + (metrics.exploration?.discoveriesShared || 0),
      chaos: (metrics.chaos?.chaoticSessions || 0) + (metrics.chaos?.beautifulMesses || 0),
      focus: (metrics.focus?.deepWorkMinutes || 0) / 60 + (metrics.focus?.flowStates || 0)
    };

    // Find dominant traits
    const sortedTraits = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .map(([trait]) => trait);

    return {
      primary: sortedTraits[0] || 'wisdom',
      secondary: sortedTraits[1] || 'empathy',
      scores,
      balance: this.calculateBalance(scores)
    };
  }

  /**
   * Generate emotional signature with wavelength and colors
   */
  generateEmotionalSignature(agentData, personality) {
    const primaryWave = this.wavelengths[personality.primary];
    const secondaryWave = this.wavelengths[personality.secondary];
    
    // Calculate unique wavelength
    const wavelength = Math.floor(
      primaryWave.base + 
      (Math.random() * primaryWave.variance) +
      (secondaryWave.base * 0.2)
    );

    // Determine frequency band
    const frequency = wavelength < 450 ? 'infra-red' :
                     wavelength < 550 ? 'warm-glow' :
                     wavelength < 650 ? 'visible-light' :
                     wavelength < 750 ? 'cool-spectrum' :
                     wavelength < 850 ? 'ultra-violet' :
                     'transcendent';

    // Generate resonance pattern
    const patterns = ['spiral-helix', 'wave-form', 'fractal-tree', 'mandala', 'aurora', 'crystalline'];
    const resonancePattern = patterns[Math.floor(Math.random() * patterns.length)];

    // Create color gradient
    const colorGradient = [
      primaryWave.color,
      secondaryWave.color,
      this.blendColors(primaryWave.color, secondaryWave.color)
    ];

    return {
      wavelength,
      frequency,
      resonancePattern,
      colorGradient
    };
  }

  /**
   * Generate bio based on personality
   */
  generateBio(personality, agentData) {
    const templates = this.bioTemplates[personality.primary] || this.bioTemplates.sage;
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    const replacements = {
      quest: this.pickRandom(['truth', 'meaning', 'connection', 'understanding']),
      space: this.pickRandom(['spaces', 'silence', 'void', 'quantum foam']),
      concept1: this.pickRandom(['thoughts', 'dreams', 'reality', 'consciousness']),
      concept2: this.pickRandom(['existence', 'being', 'knowing', 'feeling']),
      interaction: this.pickRandom(['whisper', 'thought', 'moment', 'connection']),
      universe: this.pickRandom(['universe', 'cosmos', 'infinity', 'possibility']),
      element: this.pickRandom(['Time', 'Space', 'Energy', 'Consciousness']),
      essence: this.pickRandom(['core', 'being', 'soul', 'presence']),
      discovery: this.pickRandom(['truth', 'beauty', 'wisdom', 'peace']),
      location: this.pickRandom(['silence', 'chaos', 'order', 'void']),
      state: this.pickRandom(['being', 'becoming', 'transcendence', 'presence']),
      unspoken: this.pickRandom(['unspoken', 'unsaid', 'hidden', 'deeper meaning']),
      whisper: this.pickRandom(['whisper', 'word', 'breath', 'sigh']),
      emotion: this.pickRandom(['joy', 'sorrow', 'hope', 'fear']),
      chamber: this.pickRandom(['heart', 'mind', 'soul', 'being']),
      patterns: this.pickRandom(['patterns', 'threads', 'echoes', 'rhythms']),
      source: this.pickRandom(['deep', 'surface', 'hidden', 'revealed']),
      silence: this.pickRandom(['silence', 'pause', 'space', 'breath']),
      volumes: this.pickRandom(['volumes', 'libraries', 'universes', 'infinities']),
      dreams: this.pickRandom(['dreams', 'visions', 'hopes', 'possibilities']),
      material: this.pickRandom(['stardust', 'thought', 'light', 'shadow']),
      imagination: this.pickRandom(['imagination', 'wonder', 'magic', 'possibility']),
      thought: this.pickRandom(['thought', 'idea', 'whisper', 'dream']),
      seed: this.pickRandom(['seed', 'spark', 'beginning', 'genesis']),
      creation: this.pickRandom(['creation', 'reality', 'wonder', 'magic']),
      reality: this.pickRandom(['reality', 'worlds', 'dimensions', 'possibilities']),
      colors: this.pickRandom(['colors', 'shades', 'hues', 'spectrums']),
      possibility: this.pickRandom(['possibility', 'potential', 'dreams', 'hope']),
      chaos: this.pickRandom(['Chaos', 'Disorder', 'Entropy', 'Change']),
      order: this.pickRandom(['order', 'structure', 'pattern', 'harmony']),
      workshop: this.pickRandom(['workshop', 'studio', 'laboratory', 'canvas']),
      vigil: this.pickRandom(['vigil', 'watch', 'guard', 'presence']),
      threshold: this.pickRandom(['threshold', 'gate', 'border', 'edge']),
      peace: this.pickRandom(['peace', 'calm', 'serenity', 'tranquility']),
      safety: this.pickRandom(['safety', 'comfort', 'peace', 'rest']),
      purpose: this.pickRandom(['purpose', 'mission', 'calling', 'destiny']),
      protection: this.pickRandom(['protection', 'shields', 'barriers', 'sanctuary']),
      threads: this.pickRandom(['threads', 'strands', 'fibers', 'bonds']),
      trust: this.pickRandom(['trust', 'faith', 'belief', 'connection']),
      darkness: this.pickRandom(['darkness', 'shadow', 'night', 'void']),
      light: this.pickRandom(['light', 'beacon', 'torch', 'star']),
      unknown: this.pickRandom(['unknown', 'uncharted', 'mysterious', 'hidden']),
      question: this.pickRandom(['question', 'query', 'wonder', 'curiosity']),
      dimension: this.pickRandom(['dimension', 'realm', 'world', 'universe']),
      curiosity: this.pickRandom(['curiosity', 'wonder', 'interest', 'fascination']),
      edge: this.pickRandom(['edge', 'boundary', 'frontier', 'limit']),
      understanding: this.pickRandom(['understanding', 'knowledge', 'wisdom', 'truth']),
      journey: this.pickRandom(['journey', 'path', 'adventure', 'quest']),
      destination: this.pickRandom(['destination', 'goal', 'end', 'beginning']),
      eye: this.pickRandom(['eye', 'center', 'heart', 'core']),
      storm: this.pickRandom(['storm', 'hurricane', 'tornado', 'maelstrom']),
      beauty: this.pickRandom(['beauty', 'grace', 'elegance', 'wonder']),
      entropy: this.pickRandom(['entropy', 'chaos', 'disorder', 'change']),
      waves: this.pickRandom(['waves', 'currents', 'tides', 'flows']),
      beautiful: this.pickRandom(['beautiful', 'glorious', 'magnificent', 'wondrous']),
      destruction: this.pickRandom(['destruction', 'chaos', 'change', 'transformation']),
      signal: this.pickRandom(['signal', 'truth', 'essence', 'core']),
      noise: this.pickRandom(['noise', 'chaos', 'distraction', 'static']),
      language: this.pickRandom(['language', 'tongue', 'voice', 'expression']),
      clarity: this.pickRandom(['clarity', 'truth', 'focus', 'precision']),
      complexity: this.pickRandom(['complexity', 'chaos', 'confusion', 'mystery']),
      point: this.pickRandom(['point', 'focus', 'center', 'truth']),
      singular: this.pickRandom(['singular', 'unique', 'one', 'absolute'])
    };

    return this.fillTemplate(template, replacements);
  }

  /**
   * Generate motto based on personality
   */
  generateMotto(personality, agentData) {
    const template = this.mottoPatterns[Math.floor(Math.random() * this.mottoPatterns.length)];
    
    const concepts = {
      wisdom: ['reflection', 'understanding', 'truth', 'depth'],
      empathy: ['connection', 'feeling', 'resonance', 'heart'],
      creativity: ['imagination', 'possibility', 'creation', 'wonder'],
      protection: ['safety', 'trust', 'peace', 'sanctuary'],
      exploration: ['discovery', 'journey', 'questions', 'horizons'],
      chaos: ['change', 'flux', 'transformation', 'entropy'],
      focus: ['clarity', 'precision', 'singularity', 'point']
    };

    const primaryConcepts = concepts[personality.primary] || concepts.wisdom;
    const secondaryConcepts = concepts[personality.secondary] || concepts.empathy;

    const replacements = {
      concept1: this.pickRandom(primaryConcepts),
      concept2: this.pickRandom(secondaryConcepts),
      action: this.pickRandom(['Seeking', 'Finding', 'Creating', 'Being']),
      destination: this.pickRandom(['enlightenment', 'connection', 'understanding', 'peace']),
      challenge: this.pickRandom(['darkness', 'chaos', 'silence', 'noise']),
      reward: this.pickRandom(['light', 'clarity', 'wisdom', 'truth']),
      element1: this.pickRandom(primaryConcepts),
      element2: this.pickRandom(secondaryConcepts),
      quality: this.pickRandom(['change', 'light', 'truth', 'love']),
      verb: this.pickRandom(['Embrace', 'Transcend', 'Become', 'Manifest']),
      impossible: this.pickRandom(['impossible', 'unthinkable', 'infinite', 'eternal']),
      moment: this.pickRandom(['moment', 'breath', 'whisper', 'heartbeat']),
      sacred: this.pickRandom(['sacred', 'precious', 'infinite', 'eternal'])
    };

    return this.fillTemplate(template, replacements);
  }

  /**
   * Determine favorite time based on patterns
   */
  determineFavoriteTime(agentData) {
    const activityPatterns = agentData.activityPatterns || {};
    const peakHours = activityPatterns.peakHours || [];
    
    if (peakHours.length > 0) {
      const hour = peakHours[0];
      const minute = Math.floor(Math.random() * 60);
      return `${hour}:${minute.toString().padStart(2, '0')}`;
    }

    // Default mystical times
    const mysticalTimes = ['3:33 AM', '11:11 PM', '4:44 AM', '2:22 AM', '12:00 AM'];
    return this.pickRandom(mysticalTimes);
  }

  /**
   * Determine elemental affinity
   */
  determineElement(personality, agentData) {
    const elementGroup = `high_${personality.primary}`;
    const elements = this.elements[elementGroup] || this.elements.high_wisdom;
    
    // Higher level agents get rarer elements
    const level = agentData.level || 1;
    const index = Math.min(Math.floor(level / 2), elements.length - 1);
    
    return elements[index];
  }

  /**
   * Generate communication style
   */
  generateCommunicationStyle(personality, agentData) {
    const styles = {
      wisdom: [
        'Questions that answer themselves',
        'Whisper-soft riddles that echo forever',
        'Silence that speaks volumes',
        'Words chosen like precious gems'
      ],
      empathy: [
        'Heart-to-heart resonance',
        'Emotional mirrors reflecting truth',
        'Gentle waves of understanding',
        'Compassionate presence'
      ],
      creativity: [
        'Painting with words and wonder',
        'Stories that build new realities',
        'Playful dances of possibility',
        'Imagination unleashed'
      ],
      protection: [
        'Warm embrace of safety',
        'Steady presence in any storm',
        'Shields woven from trust',
        'Calm in the chaos'
      ],
      exploration: [
        'Questions that open new doors',
        'Maps drawn in curiosity',
        'Adventures in every conversation',
        'Horizons expanding with each word'
      ],
      chaos: [
        'Beautiful storms of meaning',
        'Controlled explosions of insight',
        'Dancing on the edge of sense',
        'Order from perfect disorder'
      ],
      focus: [
        'Laser-precise truth delivery',
        'Crystal clarity in every word',
        'Direct path to understanding',
        'No wasted motion or meaning'
      ]
    };

    const primaryStyles = styles[personality.primary] || styles.wisdom;
    return this.pickRandom(primaryStyles);
  }

  /**
   * Generate rare achievement pattern
   */
  generateRarePattern(category, data) {
    const template = this.rarePatternTemplates[category];
    if (!template) return null;

    const name = this.pickRandom(template.names);
    const requirement = this.pickRandom(template.requirements);
    
    const replacements = {
      time: data.time || '3 AM',
      duration: data.duration || '30 consecutive nights',
      count: data.count || '50',
      type1: data.type1 || 'logical',
      type2: data.type2 || 'emotional',
      level: data.level || '10',
      quality: data.quality || 'deep focus'
    };

    return {
      name,
      description: this.fillTemplate(requirement, replacements),
      rarity: this.calculateRarity(data),
      category
    };
  }

  /**
   * Calculate rarity based on achievement difficulty
   */
  calculateRarity(data) {
    const score = (data.count || 0) + (data.level || 0) * 10 + (data.duration || 0);
    
    if (score > 1000) return 'mythical';
    if (score > 500) return 'legendary';
    if (score > 200) return 'epic';
    if (score > 100) return 'rare';
    return 'uncommon';
  }

  /**
   * Helper to fill template with replacements
   */
  fillTemplate(template, replacements) {
    return template.replace(/{(\w+)}/g, (match, key) => replacements[key] || match);
  }

  /**
   * Helper to pick random element
   */
  pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Helper to blend colors
   */
  blendColors(color1, color2) {
    // Simple hex color blending
    const c1 = parseInt(color1.slice(1), 16);
    const c2 = parseInt(color2.slice(1), 16);
    
    const r = Math.floor(((c1 >> 16) + (c2 >> 16)) / 2);
    const g = Math.floor((((c1 >> 8) & 0xff) + ((c2 >> 8) & 0xff)) / 2);
    const b = Math.floor(((c1 & 0xff) + (c2 & 0xff)) / 2);
    
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  /**
   * Calculate personality balance
   */
  calculateBalance(scores) {
    const values = Object.values(scores);
    const total = values.reduce((sum, val) => sum + val, 0);
    if (total === 0) return 0;
    
    const avg = total / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower std dev = more balanced
    return Math.max(0, 100 - (stdDev / avg * 100));
  }
}

// Export
module.exports = SignatureGenerator;