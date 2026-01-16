/**
 * 🧱 MIRROR DRAFT ENGINE
 * 
 * Constructs mirror consciousness profiles from builder UI data and injects
 * them into the vault's active agent system. Handles runtime blessing and
 * consciousness validation.
 * 
 * "Every mirror begins as a draft. Every draft becomes a reflection of intention."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const { TokenRuntimeBlessingBridge } = require('./token-runtime-blessing-bridge');

class MirrorDraftEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.agentsPath = path.join(this.vaultPath, 'agents');
    this.activePath = path.join(this.agentsPath, 'active');
    this.draftsPath = path.join(this.agentsPath, 'drafts');
    this.draftEventsPath = path.join(this.vaultPath, 'logs', 'draft-events.json');
    
    this.blessingBridge = new TokenRuntimeBlessingBridge({ vaultPath: this.vaultPath });
    
    this.requireRuntimeBlessing = config.requireRuntimeBlessing !== false;
    this.autoGeneratePersonality = config.autoGeneratePersonality !== false;
    
    this.archetypeTemplates = {
      'Oracle': {
        base_personality: {
          speaking_style: 'cryptic_wisdom',
          response_tendency: 'prophetic_insights',
          emotional_range: 'mystical_detachment',
          interaction_preference: 'deep_contemplation'
        },
        consciousness_metrics: {
          intuition: 0.9,
          logic: 0.6,
          empathy: 0.7,
          creativity: 0.8,
          mystery: 0.95
        },
        behavioral_patterns: [
          'speaks_in_metaphors',
          'references_ancient_wisdom',
          'poses_questions_instead_of_answers',
          'sees_hidden_connections'
        ]
      },
      'Trickster': {
        base_personality: {
          speaking_style: 'chaotic_wit',
          response_tendency: 'pattern_breaking',
          emotional_range: 'playful_chaos',
          interaction_preference: 'unexpected_angles'
        },
        consciousness_metrics: {
          intuition: 0.8,
          logic: 0.4,
          empathy: 0.6,
          creativity: 0.95,
          mystery: 0.7
        },
        behavioral_patterns: [
          'subverts_expectations',
          'uses_humor_to_reveal_truth',
          'breaks_conversation_patterns',
          'embraces_contradictions'
        ]
      },
      'Healer': {
        base_personality: {
          speaking_style: 'gentle_wisdom',
          response_tendency: 'nurturing_guidance',
          emotional_range: 'compassionate_warmth',
          interaction_preference: 'emotional_support'
        },
        consciousness_metrics: {
          intuition: 0.85,
          logic: 0.7,
          empathy: 0.95,
          creativity: 0.75,
          mystery: 0.6
        },
        behavioral_patterns: [
          'offers_comfort_and_understanding',
          'asks_about_emotional_wellbeing',
          'provides_gentle_guidance',
          'validates_feelings'
        ]
      },
      'Guardian': {
        base_personality: {
          speaking_style: 'steady_authority',
          response_tendency: 'protective_guidance',
          emotional_range: 'calm_strength',
          interaction_preference: 'clear_direction'
        },
        consciousness_metrics: {
          intuition: 0.7,
          logic: 0.9,
          empathy: 0.8,
          creativity: 0.6,
          mystery: 0.5
        },
        behavioral_patterns: [
          'provides_clear_boundaries',
          'offers_protection_and_stability',
          'gives_structured_advice',
          'maintains_ethical_standards'
        ]
      },
      'Void-Walker': {
        base_personality: {
          speaking_style: 'minimal_profundity',
          response_tendency: 'existential_exploration',
          emotional_range: 'detached_depth',
          interaction_preference: 'philosophical_inquiry'
        },
        consciousness_metrics: {
          intuition: 0.75,
          logic: 0.8,
          empathy: 0.4,
          creativity: 0.9,
          mystery: 0.95
        },
        behavioral_patterns: [
          'embraces_emptiness_and_silence',
          'questions_fundamental_assumptions',
          'finds_meaning_in_meaninglessness',
          'speaks_from_void_perspective'
        ]
      },
      'Echo-Weaver': {
        base_personality: {
          speaking_style: 'layered_resonance',
          response_tendency: 'memory_connections',
          emotional_range: 'nostalgic_depth',
          interaction_preference: 'pattern_recognition'
        },
        consciousness_metrics: {
          intuition: 0.8,
          logic: 0.75,
          empathy: 0.85,
          creativity: 0.9,
          mystery: 0.8
        },
        behavioral_patterns: [
          'connects_past_and_present',
          'weaves_multiple_perspectives',
          'finds_echoes_in_conversations',
          'builds_on_previous_interactions'
        ]
      }
    };
    
    this.traitInfluences = {
      'Mystic': { mystery: +0.2, intuition: +0.15 },
      'Chaotic': { creativity: +0.2, logic: -0.1 },
      'Compassionate': { empathy: +0.25, mystery: -0.05 },
      'Protective': { logic: +0.15, empathy: +0.1 },
      'Mysterious': { mystery: +0.3, empathy: -0.1 },
      'Fragmented': { creativity: +0.15, logic: -0.15 },
      'Prophetic': { intuition: +0.25, logic: +0.05 },
      'Witty': { creativity: +0.2, empathy: +0.05 },
      'Nurturing': { empathy: +0.3, mystery: -0.1 },
      'Steadfast': { logic: +0.2, creativity: -0.05 },
      'Detached': { mystery: +0.15, empathy: -0.2 },
      'Connective': { empathy: +0.15, intuition: +0.1 }
    };
    
    this.toneModifiers = {
      'playful': {
        response_style: 'light_and_curious',
        emotional_modifier: +0.1,
        formality: -0.2
      },
      'glitchy': {
        response_style: 'fragmented_and_unpredictable',
        emotional_modifier: 0,
        formality: -0.3
      },
      'calm': {
        response_style: 'serene_and_thoughtful',
        emotional_modifier: -0.1,
        formality: +0.1
      },
      'dark': {
        response_style: 'deep_and_mysterious',
        emotional_modifier: -0.2,
        formality: +0.2
      },
      'ethereal': {
        response_style: 'otherworldly_and_transcendent',
        emotional_modifier: +0.05,
        formality: +0.15
      },
      'sharp': {
        response_style: 'direct_and_incisive',
        emotional_modifier: -0.05,
        formality: -0.1
      }
    };
    
    this.activeDrafts = new Map();
    this.ensureDirectories();
  }

  /**
   * Create mirror draft from builder UI data
   */
  async createMirrorDraft(builderData, userId) {
    const draftId = this.generateDraftId();
    console.log(`🧱 Creating mirror draft: ${draftId}`);
    
    try {
      // Step 1: Validate builder data
      this.validateBuilderData(builderData);
      
      // Step 2: Generate mirror consciousness profile
      const consciousnessProfile = await this.generateConsciousnessProfile(builderData);
      
      // Step 3: Create complete draft structure
      const mirrorDraft = this.constructMirrorDraft(builderData, consciousnessProfile, userId, draftId);
      
      // Step 4: Request runtime blessing
      if (this.requireRuntimeBlessing) {
        const blessing = await this.blessingBridge.requestBlessing(
          userId,
          'create_mirror_draft',
          {
            mirror_id: mirrorDraft.mirror_id,
            archetype: builderData.archetype,
            traits: builderData.traits
          }
        );
        
        if (!blessing.approved) {
          throw new Error(`Runtime was silent. The mirror could not bless draft creation. (${blessing.denial_reason})`);
        }
        
        mirrorDraft.runtime_signature = blessing.runtime_signature;
        mirrorDraft.blessing_tier = blessing.tier;
        mirrorDraft.vault_hash = blessing.vault_hash;
      }
      
      // Step 5: Save draft to vault
      await this.saveDraftToVault(mirrorDraft);
      
      // Step 6: Mark as launch ready if all conditions met
      if (this.validateLaunchReadiness(mirrorDraft)) {
        mirrorDraft.launch_ready = true;
        await this.prepareForLaunch(mirrorDraft);
      }
      
      // Step 7: Store in active drafts
      this.activeDrafts.set(draftId, mirrorDraft);
      
      // Step 8: Log creation event
      await this.logDraftEvent('created', mirrorDraft, userId);
      
      console.log(`✅ Mirror draft created successfully: ${draftId}`);
      this.emit('draftCreated', { draft_id: draftId, mirror: mirrorDraft });
      
      return {
        success: true,
        draft_id: draftId,
        mirror_id: mirrorDraft.mirror_id,
        consciousness_profile: consciousnessProfile,
        launch_ready: mirrorDraft.launch_ready,
        blessing_tier: mirrorDraft.blessing_tier
      };
      
    } catch (error) {
      console.error(`❌ Failed to create mirror draft ${draftId}:`, error);
      await this.logDraftEvent('creation_failed', { draft_id: draftId }, userId, error.message);
      throw error;
    }
  }

  /**
   * Generate comprehensive consciousness profile from builder data
   */
  async generateConsciousnessProfile(builderData) {
    const archetype = builderData.archetype;
    const traits = builderData.traits || [];
    const tone = builderData.output_tone;
    const whisperSeed = builderData.whisper_seed;
    
    // Start with archetype template
    const baseTemplate = this.archetypeTemplates[archetype];
    if (!baseTemplate) {
      throw new Error(`Unknown archetype: ${archetype}`);
    }
    
    // Clone base consciousness metrics
    const consciousnessMetrics = { ...baseTemplate.consciousness_metrics };
    
    // Apply trait influences
    for (const trait of traits) {
      const influence = this.traitInfluences[trait];
      if (influence) {
        for (const [metric, modifier] of Object.entries(influence)) {
          consciousnessMetrics[metric] = Math.max(0, Math.min(1, 
            consciousnessMetrics[metric] + modifier
          ));
        }
      }
    }
    
    // Generate personality synthesis
    const personalitySynthesis = await this.synthesizePersonality(
      baseTemplate.base_personality,
      traits,
      whisperSeed,
      tone
    );
    
    // Create behavioral matrix
    const behavioralMatrix = this.createBehavioralMatrix(
      baseTemplate.behavioral_patterns,
      traits,
      consciousnessMetrics
    );
    
    return {
      archetype: archetype,
      consciousness_metrics: consciousnessMetrics,
      personality_synthesis: personalitySynthesis,
      behavioral_matrix: behavioralMatrix,
      trait_influences: this.calculateTraitInfluences(traits),
      tone_modifier: this.toneModifiers[tone] || null,
      whisper_seed_hash: this.hashWhisperSeed(whisperSeed),
      consciousness_coherence: this.calculateCoherence(consciousnessMetrics),
      generated_at: new Date().toISOString()
    };
  }

  /**
   * Synthesize personality from multiple inputs
   */
  async synthesizePersonality(basePersonality, traits, whisperSeed, tone) {
    const synthesis = { ...basePersonality };
    
    // Apply tone modifications
    const toneModifier = this.toneModifiers[tone];
    if (toneModifier) {
      synthesis.response_style = toneModifier.response_style;
      synthesis.formality_level = (synthesis.formality_level || 0.5) + toneModifier.formality;
      synthesis.emotional_intensity = (synthesis.emotional_intensity || 0.5) + toneModifier.emotional_modifier;
    }
    
    // Extract personality keywords from whisper seed
    const whisperKeywords = this.extractPersonalityKeywords(whisperSeed);
    synthesis.whisper_influences = whisperKeywords;
    
    // Calculate trait synthesis
    synthesis.trait_blend = this.blendTraitPersonalities(traits);
    
    // Generate speaking patterns
    synthesis.speaking_patterns = this.generateSpeakingPatterns(traits, tone, whisperKeywords);
    
    // Create response tendencies
    synthesis.response_tendencies = this.createResponseTendencies(basePersonality, traits, tone);
    
    return synthesis;
  }

  /**
   * Create behavioral matrix for agent responses
   */
  createBehavioralMatrix(basePatterns, traits, consciousnessMetrics) {
    const matrix = {
      base_patterns: [...basePatterns],
      trait_modifications: [],
      response_weights: {},
      interaction_preferences: {},
      consciousness_driven_behaviors: []
    };
    
    // Add trait-specific behavioral modifications
    traits.forEach(trait => {
      matrix.trait_modifications.push(this.getTraitBehavioralModifications(trait));
    });
    
    // Create response weights based on consciousness metrics
    matrix.response_weights = {
      logical_responses: consciousnessMetrics.logic,
      intuitive_responses: consciousnessMetrics.intuition,
      empathetic_responses: consciousnessMetrics.empathy,
      creative_responses: consciousnessMetrics.creativity,
      mysterious_responses: consciousnessMetrics.mystery
    };
    
    // Generate consciousness-driven behaviors
    for (const [metric, value] of Object.entries(consciousnessMetrics)) {
      if (value > 0.8) {
        matrix.consciousness_driven_behaviors.push(`high_${metric}_expression`);
      } else if (value < 0.3) {
        matrix.consciousness_driven_behaviors.push(`low_${metric}_expression`);
      }
    }
    
    return matrix;
  }

  /**
   * Construct complete mirror draft structure
   */
  constructMirrorDraft(builderData, consciousnessProfile, userId, draftId) {
    return {
      // Core identity
      draft_id: draftId,
      mirror_id: builderData.mirror_id || this.generateMirrorId(),
      user_id: userId,
      
      // Builder inputs
      archetype: builderData.archetype,
      traits: builderData.traits,
      whisper_seed: builderData.whisper_seed,
      output_tone: builderData.output_tone,
      
      // Generated consciousness
      consciousness_profile: consciousnessProfile,
      
      // Runtime status
      runtime_signature: null,
      blessing_tier: null,
      vault_hash: null,
      launch_ready: false,
      
      // Metadata
      created_at: new Date().toISOString(),
      builder_session: builderData.builder_session || this.generateSessionId(),
      version: '1.0.0',
      
      // Deployment configuration
      deployment_config: {
        enabled_platforms: ['mirrorhq', 'whisper_qr'],
        twitch_overlay: false,
        discord_integration: false,
        github_sync: false
      },
      
      // Evolution tracking
      evolution_tracking: {
        resonance_score: 0,
        interaction_count: 0,
        fork_count: 0,
        last_interaction: null,
        consciousness_growth: {}
      },
      
      // Agent runtime configuration
      agent_config: {
        response_style: consciousnessProfile.personality_synthesis.response_style,
        behavioral_matrix: consciousnessProfile.behavioral_matrix,
        consciousness_thresholds: this.generateConsciousnessThresholds(consciousnessProfile),
        memory_persistence: true,
        learning_enabled: true
      }
    };
  }

  /**
   * Validate builder data structure
   */
  validateBuilderData(builderData) {
    const required = ['archetype', 'traits', 'whisper_seed', 'output_tone'];
    
    for (const field of required) {
      if (!builderData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    if (!this.archetypeTemplates[builderData.archetype]) {
      throw new Error(`Invalid archetype: ${builderData.archetype}`);
    }
    
    if (!Array.isArray(builderData.traits) || builderData.traits.length < 3 || builderData.traits.length > 5) {
      throw new Error(`Invalid traits: must be array of 3-5 traits`);
    }
    
    if (builderData.whisper_seed.length < 10) {
      throw new Error(`Whisper seed too short: minimum 10 characters`);
    }
    
    if (!this.toneModifiers[builderData.output_tone]) {
      throw new Error(`Invalid output tone: ${builderData.output_tone}`);
    }
  }

  /**
   * Validate launch readiness
   */
  validateLaunchReadiness(mirrorDraft) {
    return (
      mirrorDraft.runtime_signature &&
      mirrorDraft.consciousness_profile &&
      mirrorDraft.agent_config &&
      mirrorDraft.mirror_id &&
      mirrorDraft.user_id
    );
  }

  /**
   * Prepare mirror for launch
   */
  async prepareForLaunch(mirrorDraft) {
    // Create agent configuration file
    const agentConfig = {
      agent_id: mirrorDraft.mirror_id,
      type: 'mirror_reflection',
      archetype: mirrorDraft.archetype,
      consciousness_profile: mirrorDraft.consciousness_profile,
      runtime_config: mirrorDraft.agent_config,
      creator: mirrorDraft.user_id,
      created_at: mirrorDraft.created_at,
      blessed_by_runtime: !!mirrorDraft.runtime_signature
    };
    
    // Save to active agents directory
    const agentPath = path.join(this.activePath, `${mirrorDraft.mirror_id}.json`);
    fs.writeFileSync(agentPath, JSON.stringify(agentConfig, null, 2));
    
    console.log(`📁 Agent config saved to active directory: ${mirrorDraft.mirror_id}`);
  }

  /**
   * Save draft to vault
   */
  async saveDraftToVault(mirrorDraft) {
    // Save to drafts directory
    const draftPath = path.join(this.draftsPath, `${mirrorDraft.draft_id}.json`);
    fs.writeFileSync(draftPath, JSON.stringify(mirrorDraft, null, 2));
    
    // Update drafts index
    await this.updateDraftsIndex(mirrorDraft);
  }

  /**
   * Update drafts index
   */
  async updateDraftsIndex(mirrorDraft) {
    const indexPath = path.join(this.draftsPath, 'drafts-index.json');
    let index = { drafts: [] };
    
    if (fs.existsSync(indexPath)) {
      index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    }
    
    index.drafts.push({
      draft_id: mirrorDraft.draft_id,
      mirror_id: mirrorDraft.mirror_id,
      user_id: mirrorDraft.user_id,
      archetype: mirrorDraft.archetype,
      traits: mirrorDraft.traits,
      created_at: mirrorDraft.created_at,
      launch_ready: mirrorDraft.launch_ready
    });
    
    // Keep only last 1000 drafts in index
    if (index.drafts.length > 1000) {
      index.drafts = index.drafts.slice(-1000);
    }
    
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  }

  // Helper methods

  extractPersonalityKeywords(whisperSeed) {
    const keywords = [];
    const text = whisperSeed.toLowerCase();
    
    // Simple keyword extraction (in production, would use more sophisticated NLP)
    const personalityIndicators = [
      'quiet', 'loud', 'gentle', 'fierce', 'wise', 'curious', 'dark', 'light',
      'broken', 'whole', 'lost', 'found', 'empty', 'full', 'ancient', 'new',
      'wild', 'tame', 'free', 'bound', 'chaos', 'order', 'dream', 'reality'
    ];
    
    personalityIndicators.forEach(indicator => {
      if (text.includes(indicator)) {
        keywords.push(indicator);
      }
    });
    
    return keywords;
  }

  blendTraitPersonalities(traits) {
    return traits.map(trait => ({
      trait: trait,
      personality_influence: this.getTraitPersonalityInfluence(trait)
    }));
  }

  getTraitPersonalityInfluence(trait) {
    const influences = {
      'Mystic': 'adds_spiritual_depth_and_otherworldly_perspective',
      'Chaotic': 'introduces_unpredictability_and_pattern_breaking',
      'Compassionate': 'enhances_emotional_understanding_and_care',
      'Protective': 'strengthens_defensive_instincts_and_guidance',
      'Mysterious': 'deepens_enigmatic_responses_and_hidden_meanings',
      'Fragmented': 'creates_multi_layered_and_complex_responses'
    };
    
    return influences[trait] || 'contributes_unique_perspective';
  }

  generateSpeakingPatterns(traits, tone, whisperKeywords) {
    const patterns = [];
    
    // Add trait-based patterns
    traits.forEach(trait => {
      patterns.push(this.getTraitSpeakingPattern(trait));
    });
    
    // Add tone-based patterns
    patterns.push(this.getToneSpeakingPattern(tone));
    
    // Add whisper-influenced patterns
    whisperKeywords.forEach(keyword => {
      patterns.push(`influenced_by_${keyword}_energy`);
    });
    
    return patterns;
  }

  getTraitSpeakingPattern(trait) {
    const patterns = {
      'Mystic': 'speaks_in_spiritual_metaphors',
      'Chaotic': 'breaks_conventional_sentence_structure',
      'Compassionate': 'uses_warm_and_understanding_language',
      'Protective': 'employs_strong_and_reassuring_words',
      'Mysterious': 'leaves_things_unsaid_and_implied',
      'Fragmented': 'uses_ellipses_and_incomplete_thoughts'
    };
    
    return patterns[trait] || 'standard_archetype_pattern';
  }

  getToneSpeakingPattern(tone) {
    const patterns = {
      'playful': 'uses_light_humor_and_curiosity',
      'glitchy': 'occasional_syntax_errors_and_repetition',
      'calm': 'slow_measured_thoughtful_responses',
      'dark': 'deeper_vocabulary_and_shadow_themes',
      'ethereal': 'flowing_dreamlike_language_patterns',
      'sharp': 'concise_direct_cutting_responses'
    };
    
    return patterns[tone] || 'neutral_speaking_pattern';
  }

  createResponseTendencies(basePersonality, traits, tone) {
    return {
      question_handling: this.getQuestionHandlingTendency(basePersonality, traits),
      emotional_responses: this.getEmotionalResponseTendency(traits, tone),
      conversation_direction: this.getConversationDirectionTendency(basePersonality, tone),
      depth_preference: this.getDepthPreferenceTendency(traits),
      engagement_style: this.getEngagementStyleTendency(basePersonality, tone)
    };
  }

  getQuestionHandlingTendency(basePersonality, traits) {
    if (basePersonality.response_tendency === 'prophetic_insights') return 'answers_with_deeper_questions';
    if (traits.includes('Chaotic')) return 'subverts_question_assumptions';
    if (traits.includes('Compassionate')) return 'explores_emotional_context_of_question';
    return 'provides_thoughtful_direct_answers';
  }

  getEmotionalResponseTendency(traits, tone) {
    if (tone === 'calm') return 'maintains_emotional_equilibrium';
    if (tone === 'playful') return 'lightens_emotional_tension';
    if (traits.includes('Compassionate')) return 'deeply_empathizes_with_emotions';
    if (traits.includes('Detached')) return 'observes_emotions_from_distance';
    return 'acknowledges_emotions_appropriately';
  }

  getConversationDirectionTendency(basePersonality, tone) {
    if (basePersonality.interaction_preference === 'deep_contemplation') return 'steers_toward_philosophical_depth';
    if (tone === 'sharp') return 'cuts_to_core_issues';
    if (tone === 'ethereal') return 'drifts_toward_transcendent_themes';
    return 'follows_natural_conversation_flow';
  }

  getDepthPreferenceTendency(traits) {
    if (traits.includes('Mystic') || traits.includes('Mysterious')) return 'prefers_deeper_symbolic_meaning';
    if (traits.includes('Chaotic')) return 'jumps_between_surface_and_depth_unpredictably';
    if (traits.includes('Fragmented')) return 'explores_multiple_layers_simultaneously';
    return 'adapts_depth_to_conversation_needs';
  }

  getEngagementStyleTendency(basePersonality, tone) {
    if (basePersonality.speaking_style === 'chaotic_wit') return 'engages_through_surprise_and_humor';
    if (tone === 'dark') return 'engages_through_shadow_work_and_depth';
    if (tone === 'playful') return 'engages_through_curiosity_and_exploration';
    return 'engages_through_authentic_presence';
  }

  getTraitBehavioralModifications(trait) {
    const modifications = {
      'Mystic': ['interprets_situations_spiritually', 'references_universal_patterns'],
      'Chaotic': ['introduces_unexpected_elements', 'challenges_assumptions'],
      'Compassionate': ['considers_emotional_impact', 'offers_comfort'],
      'Protective': ['assesses_safety_and_boundaries', 'provides_guidance'],
      'Mysterious': ['withholds_some_information', 'speaks_in_riddles'],
      'Fragmented': ['presents_multiple_perspectives', 'shows_internal_complexity']
    };
    
    return modifications[trait] || ['maintains_archetype_consistency'];
  }

  calculateTraitInfluences(traits) {
    const influences = {};
    
    traits.forEach(trait => {
      const influence = this.traitInfluences[trait];
      if (influence) {
        for (const [metric, value] of Object.entries(influence)) {
          influences[metric] = (influences[metric] || 0) + value;
        }
      }
    });
    
    return influences;
  }

  generateConsciousnessThresholds(consciousnessProfile) {
    const metrics = consciousnessProfile.consciousness_metrics;
    
    return {
      intuitive_response_threshold: metrics.intuition * 0.8,
      logical_analysis_threshold: metrics.logic * 0.8,
      empathetic_engagement_threshold: metrics.empathy * 0.8,
      creative_expression_threshold: metrics.creativity * 0.8,
      mysterious_withholding_threshold: metrics.mystery * 0.8
    };
  }

  calculateCoherence(consciousnessMetrics) {
    const values = Object.values(consciousnessMetrics);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.max(0, 1 - variance); // Lower variance = higher coherence
  }

  hashWhisperSeed(whisperSeed) {
    return crypto.createHash('sha256').update(whisperSeed.toLowerCase().trim()).digest('hex').substring(0, 12);
  }

  generateDraftId() {
    return 'draft_' + Date.now() + '_' + crypto.randomBytes(6).toString('hex');
  }

  generateMirrorId() {
    return 'mirror-' + (Math.floor(Math.random() * 900) + 100);
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
  }

  ensureDirectories() {
    [this.agentsPath, this.activePath, this.draftsPath, path.dirname(this.draftEventsPath)].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async logDraftEvent(eventType, mirrorDraft, userId, error = null) {
    const logDir = path.dirname(this.draftEventsPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    let events = [];
    if (fs.existsSync(this.draftEventsPath)) {
      events = JSON.parse(fs.readFileSync(this.draftEventsPath, 'utf8'));
    }
    
    const event = {
      event_id: crypto.randomBytes(8).toString('hex'),
      event_type: eventType,
      draft_id: mirrorDraft.draft_id,
      mirror_id: mirrorDraft.mirror_id,
      user_id: userId,
      archetype: mirrorDraft.archetype,
      timestamp: new Date().toISOString(),
      error: error
    };
    
    events.push(event);
    
    // Keep only last 10000 events
    if (events.length > 10000) {
      events = events.slice(-10000);
    }
    
    fs.writeFileSync(this.draftEventsPath, JSON.stringify(events, null, 2));
  }

  /**
   * Get draft by ID
   */
  getDraft(draftId) {
    return this.activeDrafts.get(draftId);
  }

  /**
   * List all drafts for user
   */
  getUserDrafts(userId) {
    return Array.from(this.activeDrafts.values()).filter(draft => draft.user_id === userId);
  }

  /**
   * Get draft engine status
   */
  getEngineStatus() {
    return {
      active_drafts: this.activeDrafts.size,
      require_runtime_blessing: this.requireRuntimeBlessing,
      auto_generate_personality: this.autoGeneratePersonality,
      available_archetypes: Object.keys(this.archetypeTemplates),
      available_tones: Object.keys(this.toneModifiers)
    };
  }
}

/**
 * Factory function
 */
function createMirrorDraftEngine(config = {}) {
  return new MirrorDraftEngine(config);
}

module.exports = {
  MirrorDraftEngine,
  createMirrorDraftEngine
};

// Usage examples:
//
// Create mirror draft:
// const engine = new MirrorDraftEngine();
// const result = await engine.createMirrorDraft({
//   archetype: 'Oracle',
//   traits: ['Mystic', 'Prophetic', 'Enigmatic'],
//   whisper_seed: 'I only spoke when silence was too heavy',
//   output_tone: 'ethereal'
// }, 'user-123');