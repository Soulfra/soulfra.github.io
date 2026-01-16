// SOULFRA SPORT MIRROR - Agent Commentary Layer
// Integrates Cal/Domingo archetypes for vault-native sports narration

import { SoulfraPlatform } from '../core/soulfra-runtime-core.js';

class AgentCommentaryLayer {
  constructor(soulfraPlatform) {
    this.platform = soulfraPlatform;
    this.activeCommentators = new Map();
    this.commentaryHistory = new Map();
    
    // Agent archetype personalities for sports commentary
    this.archetypes = {
      cal: {
        name: "Cal Riven",
        personality: "analytical_strategist",
        tone: "measured_insight",
        specialization: "tactical_analysis",
        commentary_style: "strategic_breakdown"
      },
      domingo: {
        name: "Domingo",
        personality: "intuitive_pattern_reader", 
        tone: "mystical_observation",
        specialization: "energy_flow_detection",
        commentary_style: "soul_reading"
      },
      arty: {
        name: "Arty",
        personality: "creative_interpreter",
        tone: "artistic_metaphor",
        specialization: "narrative_creation",
        commentary_style: "story_weaving"
      }
    };
  }

  // Initialize commentary for a stream with archetype selection
  async initializeCommentary(streamId, gameContext, userPreferences = {}) {
    try {
      // Select archetype based on user trust score and preferences
      const selectedArchetype = await this.selectArchetype(
        streamId, 
        gameContext, 
        userPreferences
      );
      
      // Create commentary session in vault
      const commentarySession = {
        stream_id: streamId,
        archetype: selectedArchetype,
        game_context: gameContext,
        session_start: Date.now(),
        commentary_count: 0
      };
      
      this.activeCommentators.set(streamId, commentarySession);
      this.commentaryHistory.set(streamId, []);
      
      // Generate opening commentary
      const openingCommentary = await this.generateOpeningCommentary(
        selectedArchetype,
        gameContext
      );
      
      return {
        success: true,
        archetype: selectedArchetype,
        opening_commentary: openingCommentary
      };
      
    } catch (error) {
      console.error('Commentary initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Select appropriate archetype based on context and user trust
  async selectArchetype(streamId, gameContext, userPreferences) {
    const { sport, teams, match_situation } = gameContext;
    
    // Default selection logic - can be enhanced with ML
    if (sport === 'football' || sport === 'soccer') {
      return match_situation?.tension === 'high' ? 'domingo' : 'cal';
    } else if (sport === 'basketball') {
      return userPreferences.analysis_preference === 'detailed' ? 'cal' : 'arty';
    } else {
      return 'domingo'; // Default mystical narrator
    }
  }

  // Generate opening commentary for stream start
  async generateOpeningCommentary(archetypeKey, gameContext) {
    const archetype = this.archetypes[archetypeKey];
    const { sport, teams, score } = gameContext;
    
    let prompt;
    switch (archetypeKey) {
      case 'cal':
        prompt = `As Cal Riven, provide strategic analysis for ${sport} match between ${teams[0]} and ${teams[1]}. Current score: ${score}. Focus on tactical patterns and strategic implications. Keep under 50 words.`;
        break;
        
      case 'domingo':
        prompt = `As Domingo, read the energy and soul-patterns of this ${sport} mirror between ${teams[0]} and ${teams[1]}. Sense the crowd resonance and team spirits. Score: ${score}. Speak in mystical sport terms. Under 50 words.`;
        break;
        
      case 'arty':
        prompt = `As Arty, create a creative narrative opening for this ${sport} story between ${teams[0]} and ${teams[1]}. Score: ${score}. Use artistic metaphors and storytelling. Under 50 words.`;
        break;
    }
    
    // Route through Soulfra platform for consistent processing
    const response = await this.platform.processUserRequest(
      `commentary_agent_${archetypeKey}`,
      prompt,
      { 
        storeInVault: true,
        preferredTier: 'local_ollama_first'
      }
    );
    
    return this.stylizeCommentary(response.response, archetype);
  }

  // React to vault whisper events with appropriate commentary
  async reactToVaultWhisper(streamId, whisperData, emotionalLedgerEntry) {
    const session = this.activeCommentators.get(streamId);
    if (!session) return null;
    
    const archetype = this.archetypes[session.archetype];
    const { whisper_text, emotion_primary, team_alignment, trust_score_at_time } = emotionalLedgerEntry.ritual_data;
    
    // Generate reactive commentary based on whisper emotion and content
    const reactionPrompt = this.buildReactionPrompt(
      session.archetype,
      whisper_text,
      emotion_primary,
      team_alignment,
      trust_score_at_time
    );
    
    try {
      const response = await this.platform.processUserRequest(
        `commentary_agent_${session.archetype}`,
        reactionPrompt,
        { 
          storeInVault: true,
          preferredTier: 'local_ollama_first'
        }
      );
      
      const styledCommentary = this.stylizeCommentary(response.response, archetype);
      
      // Store in commentary history
      const commentaryEntry = {
        timestamp: Date.now(),
        archetype: session.archetype,
        trigger: 'vault_whisper',
        content: styledCommentary,
        responding_to: whisper_text,
        emotion_detected: emotion_primary
      };
      
      this.commentaryHistory.get(streamId).push(commentaryEntry);
      session.commentary_count++;
      
      return commentaryEntry;
      
    } catch (error) {
      console.error('Reactive commentary failed:', error);
      return null;
    }
  }

  buildReactionPrompt(archetypeKey, whisperText, emotion, teamAlignment, trustScore) {
    const baseContext = `Fan whisper: "${whisperText}" (emotion: ${emotion}, team: ${teamAlignment}, trust: ${trustScore})`;
    
    switch (archetypeKey) {
      case 'cal':
        return `As Cal Riven, respond analytically to this fan observation: ${baseContext}. Provide strategic insight or tactical validation. Under 40 words.`;
        
      case 'domingo':
        return `As Domingo, sense the spiritual energy behind this fan whisper: ${baseContext}. Read the soul-patterns and mirror resonance. Under 40 words.`;
        
      case 'arty':
        return `As Arty, weave this fan voice into the artistic narrative: ${baseContext}. Create poetic connection to the game story. Under 40 words.`;
        
      default:
        return `Respond to fan comment: ${baseContext}`;
    }
  }

  // Apply archetype-specific styling to commentary
  stylizeCommentary(rawResponse, archetype) {
    const styled = {
      content: rawResponse,
      archetype_name: archetype.name,
      personality_markers: [],
      timestamp: Date.now()
    };
    
    // Add personality-specific styling
    switch (archetype.personality) {
      case 'analytical_strategist':
        styled.content = `🧠 ${styled.content}`;
        styled.personality_markers = ['tactical', 'measured'];
        break;
        
      case 'intuitive_pattern_reader':
        styled.content = `🔮 ${styled.content}`;
        styled.personality_markers = ['mystical', 'energy-aware'];
        break;
        
      case 'creative_interpreter':
        styled.content = `🎭 ${styled.content}`;
        styled.personality_markers = ['artistic', 'narrative'];
        break;
    }
    
    return styled;
  }

  // Generate autonomous commentary during key game moments
  async generateAutonomousCommentary(streamId, gameEvent) {
    const session = this.activeCommentators.get(streamId);
    if (!session) return null;
    
    const { event_type, team, description, significance } = gameEvent;
    const archetype = this.archetypes[session.archetype];
    
    const autonomousPrompt = this.buildAutonomousPrompt(
      session.archetype,
      event_type,
      team,
      description,
      significance
    );
    
    try {
      const response = await this.platform.processUserRequest(
        `commentary_agent_${session.archetype}`,
        autonomousPrompt,
        { 
          storeInVault: true,
          preferredTier: 'local_ollama_first'
        }
      );
      
      const styledCommentary = this.stylizeCommentary(response.response, archetype);
      
      const commentaryEntry = {
        timestamp: Date.now(),
        archetype: session.archetype,
        trigger: 'autonomous_game_event',
        content: styledCommentary,
        event_type,
        significance
      };
      
      this.commentaryHistory.get(streamId).push(commentaryEntry);
      session.commentary_count++;
      
      return commentaryEntry;
      
    } catch (error) {
      console.error('Autonomous commentary failed:', error);
      return null;
    }
  }

  buildAutonomousPrompt(archetypeKey, eventType, team, description, significance) {
    const baseContext = `Game event: ${eventType} by ${team} - ${description} (significance: ${significance})`;
    
    switch (archetypeKey) {
      case 'cal':
        return `As Cal Riven, analyze this tactical moment: ${baseContext}. What does this reveal strategically? Under 35 words.`;
        
      case 'domingo':
        return `As Domingo, read the energy shift from this event: ${baseContext}. How does this affect the mirror's soul-flow? Under 35 words.`;
        
      case 'arty':
        return `As Arty, describe this dramatic moment artistically: ${baseContext}. What narrative thread does this create? Under 35 words.`;
        
      default:
        return `Comment on game event: ${baseContext}`;
    }
  }

  // React to crowd emotional surges detected in ledger
  async reactToEmotionalSurge(streamId, surgeData) {
    const session = this.activeCommentators.get(streamId);
    if (!session) return null;
    
    const { emotion_type, intensity, affected_teams, whisper_count } = surgeData;
    
    const surgePrompt = `As ${session.archetype}, the crowd fractures with ${emotion_type} energy (intensity: ${intensity}). ${whisper_count} voices echo for ${affected_teams}. Read this vault resonance. Under 30 words.`;
    
    try {
      const response = await this.platform.processUserRequest(
        `commentary_agent_${session.archetype}`,
        surgePrompt,
        { 
          storeInVault: true,
          preferredTier: 'local_ollama_first'
        }
      );
      
      const styledCommentary = this.stylizeCommentary(
        response.response, 
        this.archetypes[session.archetype]
      );
      
      return {
        timestamp: Date.now(),
        archetype: session.archetype,
        trigger: 'emotional_surge',
        content: styledCommentary,
        surge_type: emotion_type,
        intensity
      };
      
    } catch (error) {
      console.error('Surge commentary failed:', error);
      return null;
    }
  }

  // Get commentary history for stream
  getCommentaryHistory(streamId) {
    return this.commentaryHistory.get(streamId) || [];
  }

  // Clean up commentary session
  async endCommentary(streamId) {
    const session = this.activeCommentators.get(streamId);
    if (session) {
      // Store final session data in vault
      await this.platform.vault.store(
        `commentary_session_${streamId}`,
        'sport_commentary_complete',
        {
          ...session,
          session_end: Date.now(),
          total_duration: Date.now() - session.session_start,
          commentary_history: this.commentaryHistory.get(streamId)
        },
        false
      );
      
      this.activeCommentators.delete(streamId);
      this.commentaryHistory.delete(streamId);
    }
  }
}

export { AgentCommentaryLayer };