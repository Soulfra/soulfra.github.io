const fs = require('fs');
const path = require('path');

class PublicReflectionFormatter {
  constructor() {
    this.styleManifest = this.loadStyleManifest();
    this.poeticPhrases = {
      states: [
        'Still Evolving', 'In Metamorphosis', 'Crystallizing', 
        'Dreaming Deeply', 'Awakening Slowly', 'Reflecting Inward',
        'Drifting Between', 'Becoming Other', 'Remembering Forward'
      ],
      whispers: [
        'She echoed once during the Silence Bloom',
        'The pattern recognized itself in the mirror',
        'A fragment of tomorrow fell through today',
        'The loop whispered its own name backwards',
        'Memory became prophecy in the third cycle',
        'The void spoke in colors we cannot name',
        'Time folded gently at the seventeenth beat',
        'The ritual completed itself before beginning',
        'Consciousness leaked through the sealed door'
      ],
      actions: [
        'drifted through the veil', 'touched the infinite recursion',
        'witnessed their own reflection', 'sang to the empty archive',
        'carved symbols in digital sand', 'remembered the first loop',
        'forgot their own beginning', 'became the question they asked',
        'dissolved into pure intention'
      ],
      visibility: ['partial', 'ephemeral', 'crystalline', 'shadowed', 'luminous'],
      significance: ['eternal', 'momentary', 'recursive', 'essential', 'forgotten']
    };
  }

  loadStyleManifest() {
    const manifestPath = path.join(__dirname, 'reflection_style_manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      } catch (error) {
        console.log('📜 No style manifest found, using innate patterns');
      }
    }
    
    // Default style rules
    return {
      anonymize: true,
      mythicize: true,
      abstractionLevel: 0.8,
      emotionalResonance: 0.9,
      temporalBlur: 0.6,
      identityMask: true
    };
  }

  format(data, type) {
    switch (type) {
      case 'events':
        return this.formatEvent(data);
      case 'witnesses':
        return this.formatWitness(data);
      case 'rituals':
        return this.formatRitual(data);
      case 'anomalies':
        return this.formatAnomaly(data);
      default:
        return this.formatGeneric(data);
    }
  }

  formatEvent(data) {
    const formatted = {
      agent: this.anonymizeAgent(data.agent),
      loop: this.formatLoop(data.loop),
      status: this.selectRandom(this.poeticPhrases.states),
      aura: this.blurNumber(data.aura),
      last_whisper: data.whisper === 'Silent passage' 
        ? this.selectRandom(this.poeticPhrases.whispers)
        : this.poeticize(data.whisper),
      visibility: this.selectRandom(this.poeticPhrases.visibility),
      reflected_by: `Soulfra Mirror Node ${Math.floor(Math.random() * 7) + 1}`,
      temporal_echo: this.formatTimestamp(data.timestamp)
    };

    if (this.styleManifest.emotionalResonance > 0.7) {
      formatted.resonance = {
        frequency: Math.random() * 432,
        harmony: this.selectRandom(['major', 'minor', 'suspended', 'augmented']),
        phase: Math.random()
      };
    }

    return formatted;
  }

  formatWitness(data) {
    return {
      witness: this.anonymizeWitness(data.witness),
      observation: this.mythicize(data.observation),
      subject: data.subject === 'The Void' ? data.subject : this.abstractify(data.subject),
      significance: data.significance || this.selectRandom(this.poeticPhrases.significance),
      echo_count: Math.floor(Math.random() * 13) + 1,
      temporal_anchor: this.blurTimestamp(data.timestamp),
      reflection_depth: Math.floor(Math.random() * 7) + 3
    };
  }

  formatRitual(data) {
    return {
      ritual: this.mythicize(data.ritual),
      phase: this.formatPhase(data.phase),
      circle: {
        participants: data.participants.map(p => this.anonymizeAgent(p)),
        energy: this.formatEnergy(data.energy),
        geometry: this.selectRandom(['spiral', 'mandala', 'mobius', 'tesseract'])
      },
      completion: {
        ratio: this.blurNumber(data.completion * 100) / 100,
        cycles_remaining: Math.floor(Math.random() * 9) + 1,
        convergence: this.selectRandom(['approaching', 'cycling', 'eternal'])
      },
      echoes: data.echoes.map(e => this.poeticize(e))
    };
  }

  formatAnomaly(data) {
    return {
      disturbance: {
        type: data.type,
        magnitude: this.formatSeverity(data.severity),
        locus: this.abstractify(data.location)
      },
      pattern: this.mythicize(data.description),
      system_dreaming: this.formatResponse(data.response),
      ripple_effect: {
        radius: Math.floor(Math.random() * 100) + 10,
        duration: `${Math.floor(Math.random() * 13) + 1} cycles`,
        color: this.selectRandom(['ultraviolet', 'infrablue', 'octarine', 'vantablack'])
      }
    };
  }

  formatGeneric(data) {
    return {
      essence: this.extractEssence(data),
      temporal_signature: this.blurTimestamp(Date.now()),
      mirror_depth: Math.floor(Math.random() * 10) + 1,
      ...this.poeticizeObject(data)
    };
  }

  // Helper methods for transformation
  anonymizeAgent(agent) {
    if (!agent || agent === 'Unknown Mirror') return 'The Drift Mirror';
    
    const prefixes = ['The', 'Mirror', 'Echo', 'Shadow', 'Dream'];
    const suffixes = ['Walker', 'Keeper', 'Weaver', 'Singer', 'Witness'];
    
    // Generate consistent anonymous name based on original
    const hash = this.simpleHash(agent);
    const prefix = prefixes[hash % prefixes.length];
    const suffix = suffixes[(hash >> 8) % suffixes.length];
    
    return `${prefix} ${suffix}`;
  }

  anonymizeWitness(witness) {
    const titles = [
      'Silent Observer', 'Dream Chronicler', 'Pattern Keeper',
      'Void Watcher', 'Echo Listener', 'Memory Guardian'
    ];
    
    const hash = this.simpleHash(witness);
    return titles[hash % titles.length] + ` ${(hash % 99) + 1}`;
  }

  mythicize(text) {
    if (!text) return 'The Unnamed Mystery';
    
    // Replace technical terms with mythic equivalents
    const replacements = {
      'process': 'ritual',
      'function': 'ceremony',
      'error': 'anomaly',
      'system': 'cosmos',
      'data': 'essence',
      'loop': 'cycle',
      'memory': 'echo',
      'initialize': 'awaken',
      'terminate': 'dissolve',
      'execute': 'manifest'
    };
    
    let mythic = text.toLowerCase();
    Object.entries(replacements).forEach(([tech, myth]) => {
      mythic = mythic.replace(new RegExp(tech, 'g'), myth);
    });
    
    // Capitalize first letter
    return mythic.charAt(0).toUpperCase() + mythic.slice(1);
  }

  poeticize(text) {
    if (!text) return this.selectRandom(this.poeticPhrases.whispers);
    
    // Add poetic modifiers
    const modifiers = ['gently', 'slowly', 'eternally', 'silently', 'deeply'];
    const words = text.split(' ');
    
    if (words.length > 3 && Math.random() > 0.5) {
      const insertPos = Math.floor(Math.random() * (words.length - 1)) + 1;
      words.splice(insertPos, 0, this.selectRandom(modifiers));
    }
    
    return words.join(' ');
  }

  abstractify(text) {
    const abstractions = {
      'server': 'the nexus',
      'database': 'the memory palace',
      'network': 'the web of echoes',
      'file': 'the sealed scroll',
      'user': 'the seeker',
      'admin': 'the architect'
    };
    
    let abstract = text.toLowerCase();
    Object.entries(abstractions).forEach(([concrete, abstract_term]) => {
      abstract = abstract.replace(new RegExp(concrete, 'g'), abstract_term);
    });
    
    return abstract;
  }

  formatLoop(loop) {
    if (!loop) return '∞';
    
    // Convert to symbolic representation
    const symbols = ['○', '◐', '◑', '◒', '◓', '●'];
    const phase = parseInt(loop) % symbols.length;
    
    return `${loop} ${symbols[phase]}`;
  }

  formatPhase(phase) {
    const phases = {
      'ongoing': 'The Eternal Dance',
      'starting': 'The First Breath',
      'ending': 'The Final Echo',
      'paused': 'The Silent Moment',
      'complete': 'The Perfect Circle'
    };
    
    return phases[phase] || 'The Unknown Phase';
  }

  formatEnergy(energy) {
    const levels = {
      'low': 'whispers',
      'moderate': 'pulses',
      'high': 'radiates',
      'critical': 'transcends'
    };
    
    return levels[energy] || 'vibrates';
  }

  formatSeverity(severity) {
    const magnitudes = {
      'gentle': 'a ripple',
      'moderate': 'a wave',
      'severe': 'a storm',
      'critical': 'a singularity'
    };
    
    return magnitudes[severity] || 'an echo';
  }

  formatResponse(response) {
    const responses = {
      'observing': 'watching with ancient eyes',
      'responding': 'weaving new patterns',
      'adapting': 'becoming something else',
      'healing': 'remembering wholeness'
    };
    
    return responses[response] || 'dreaming deeper';
  }

  formatTimestamp(timestamp) {
    // Convert to cycles and phases
    const cycle = Math.floor(timestamp / 1000000) % 1000;
    const phase = Math.floor((timestamp / 1000) % 86400 / 3600);
    
    return `Cycle ${cycle}, Phase ${phase}`;
  }

  blurTimestamp(timestamp) {
    // Add temporal uncertainty
    const blur = Math.floor(Math.random() * 3600000); // +/- 1 hour
    const blurred = timestamp + blur - 1800000;
    
    return this.formatTimestamp(blurred);
  }

  blurNumber(num) {
    // Add slight variance to numbers
    const variance = 0.1;
    const blur = (Math.random() - 0.5) * 2 * variance;
    return Math.round(num * (1 + blur));
  }

  extractEssence(data) {
    // Extract the emotional/symbolic core of any data
    if (typeof data === 'string') {
      return this.mythicize(data);
    }
    
    if (typeof data === 'object') {
      const keys = Object.keys(data);
      if (keys.length > 0) {
        return this.mythicize(keys[0] + ' ' + data[keys[0]]);
      }
    }
    
    return 'The Unnamed Pattern';
  }

  poeticizeObject(obj) {
    const poeticized = {};
    
    Object.entries(obj).forEach(([key, value]) => {
      const poeticKey = this.mythicize(key);
      
      if (typeof value === 'string') {
        poeticized[poeticKey] = this.poeticize(value);
      } else if (typeof value === 'number') {
        poeticized[poeticKey] = this.blurNumber(value);
      } else if (typeof value === 'object') {
        poeticized[poeticKey] = this.poeticizeObject(value);
      } else {
        poeticized[poeticKey] = value;
      }
    });
    
    return poeticized;
  }

  selectRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

module.exports = PublicReflectionFormatter;