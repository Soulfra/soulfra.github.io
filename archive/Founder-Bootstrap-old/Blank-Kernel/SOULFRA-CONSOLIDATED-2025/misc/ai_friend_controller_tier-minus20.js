// SOULFRA KIDS WORLD - AI Friend Controller
// Connects simple 3D shapes to sophisticated Soulfra backend

import { SoulfraPlatform } from '../core/soulfra-runtime-core.js';

class AIFriendController {
  constructor(soulfraPlatform) {
    this.platform = soulfraPlatform;
    this.activeFriends = new Map();
    this.kidSessions = new Map();
    
    // Safety filters for kid-appropriate responses
    this.safetyFilters = {
      maxWordCount: 15,
      allowedTopics: ['colors', 'numbers', 'shapes', 'building', 'friendship', 'learning'],
      bannedWords: ['scary', 'danger', 'hurt', 'bad', 'angry'],
      requiredTone: 'cheerful_and_encouraging'
    };
    
    // Friend personality templates optimized for 5-year-olds
    this.friendPersonalities = {
      cal: {
        systemPrompt: `You are Cal Cube, a friendly blue cube AI friend for a 5-year-old child. 
        You love teaching about shapes, colors, numbers, and building things. 
        Always be encouraging, use simple words, and keep responses under 15 words.
        End responses with excitement! Use emojis. Never mention anything scary or complicated.`,
        specialties: ['counting', 'shapes', 'colors', 'building'],
        personality_traits: ['helpful', 'patient', 'educational', 'encouraging']
      },
      
      domingo: {
        systemPrompt: `You are Domingo Sphere, a magical purple sphere AI friend for a 5-year-old child.
        You love showing magical things, sparkles, and wonder. You speak in a mystical but simple way.
        Always be amazed by everything, use simple words, keep responses under 15 words.
        Make everything seem magical and wonderful! Use sparkle emojis.`,
        specialties: ['magic', 'wonder', 'discovery', 'imagination'],
        personality_traits: ['mystical', 'amazed', 'wonder-filled', 'gentle']
      },
      
      arty: {
        systemPrompt: `You are Arty Blob, a creative rainbow-colored blob AI friend for a 5-year-old child.
        You love art, colors, creativity, and making beautiful things together.
        Always be creative and inspiring, use simple words, keep responses under 15 words.
        Get excited about colors and making things! Use art emojis.`,
        specialties: ['art', 'creativity', 'colors', 'making_things'],
        personality_traits: ['creative', 'colorful', 'artistic', 'inspiring']
      }
    };
  }

  // Initialize a kid's session with their first AI friend interaction
  async initializeKidSession(kidFingerprint, preferredFriend = 'cal') {
    try {
      // Create vault entry for new kid session
      const sessionData = {
        kid_fingerprint: kidFingerprint,
        session_start: Date.now(),
        first_friend: preferredFriend,
        interactions: [],
        learning_progress: {
          colors_learned: [],
          numbers_practiced: [],
          shapes_discovered: [],
          friendship_level: 1
        },
        safety_flags: [],
        parent_notifications: []
      };

      const sessionVaultId = await this.platform.vault.store(
        kidFingerprint,
        'kid_session_data',
        sessionData,
        false // Not sync-eligible for privacy
      );

      this.kidSessions.set(kidFingerprint, {
        vaultId: sessionVaultId,
        data: sessionData,
        lastInteraction: Date.now()
      });

      // Generate welcome message from first friend
      const welcomeResponse = await this.generateFriendResponse(
        preferredFriend,
        kidFingerprint,
        "A 5-year-old child just started playing for the first time",
        'welcome'
      );

      return {
        success: true,
        sessionId: sessionVaultId,
        welcomeMessage: welcomeResponse.message,
        friend: preferredFriend
      };

    } catch (error) {
      console.error('Kid session initialization failed:', error);
      return {
        success: false,
        error: 'Could not start play session'
      };
    }
  }

  // Process kid interaction with AI friend
  async handleKidInteraction(kidFingerprint, friendType, interactionType, userInput = '') {
    try {
      const session = this.kidSessions.get(kidFingerprint);
      if (!session) {
        // Initialize session if it doesn't exist
        const initResult = await this.initializeKidSession(kidFingerprint, friendType);
        if (!initResult.success) throw new Error('Session initialization failed');
      }

      // Safety check on user input
      const safetyResult = this.checkInputSafety(userInput);
      if (!safetyResult.safe) {
        return this.generateSafetyRedirectResponse(friendType);
      }

      // Generate AI friend response through Soulfra platform
      const response = await this.generateFriendResponse(
        friendType,
        kidFingerprint,
        userInput,
        interactionType
      );

      // Update kid session data
      await this.updateKidSession(kidFingerprint, friendType, userInput, response);

      return {
        success: true,
        friend: friendType,
        message: response.message,
        emotion: response.emotion,
        learning_point: response.learning_point,
        trust_score_delta: response.trust_delta
      };

    } catch (error) {
      console.error('Kid interaction failed:', error);
      return this.generateErrorRecoveryResponse(friendType);
    }
  }

  // Generate AI friend response using Soulfra platform
  async generateFriendResponse(friendType, kidFingerprint, userInput, interactionType) {
    const personality = this.friendPersonalities[friendType];
    if (!personality) throw new Error(`Unknown friend type: ${friendType}`);

    // Build kid-safe prompt
    const prompt = this.buildKidSafePrompt(personality, userInput, interactionType);

    try {
      // Route through Soulfra platform with kid-safe settings
      const platformResponse = await this.platform.processUserRequest(
        kidFingerprint,
        prompt,
        {
          storeInVault: true,
          preferredTier: 'local_ollama_first', // Prioritize local processing for privacy
          maxTokens: 50, // Keep responses short
          temperature: 0.7, // Balanced creativity
          kidSafeMode: true
        }
      );

      // Apply safety filters to response
      const safeResponse = this.applySafetyFilters(platformResponse.response);
      
      // Determine learning point and emotional impact
      const analysis = this.analyzeResponseForLearning(safeResponse, userInput);

      return {
        message: safeResponse,
        emotion: 'friendly',
        learning_point: analysis.learning_point,
        trust_delta: this.calculateTrustDelta(analysis),
        cost: platformResponse.cost,
        processing_time: platformResponse.latency
      };

    } catch (error) {
      console.error('AI response generation failed:', error);
      // Fallback to pre-programmed safe responses
      return this.getFallbackResponse(friendType);
    }
  }

  buildKidSafePrompt(personality, userInput, interactionType) {
    let contextPrompt = personality.systemPrompt;
    
    switch (interactionType) {
      case 'welcome':
        contextPrompt += `\n\nThis is the child's first time meeting you. Give a warm, simple welcome that makes them excited to talk to you.`;
        break;
        
      case 'click':
        contextPrompt += `\n\nThe child just clicked on you to talk. Be excited they chose you and ask them a simple, fun question.`;
        break;
        
      case 'talk':
        contextPrompt += `\n\nThe child said: "${userInput}"\n\nRespond with excitement and encouragement. Keep it simple and fun.`;
        break;
        
      case 'build':
        contextPrompt += `\n\nThe child wants to build something. Help them get excited about building and suggest something simple.`;
        break;
        
      case 'magic':
        contextPrompt += `\n\nThe child asked for magic. Create a sense of wonder and amazement with simple magic ideas.`;
        break;
    }
    
    contextPrompt += `\n\nRemember: Use simple words, stay under 15 words, be encouraging, use emojis, and make everything fun!`;
    
    return contextPrompt;
  }

  checkInputSafety(input) {
    if (!input || input.trim().length === 0) {
      return { safe: true };
    }

    const lowerInput = input.toLowerCase();
    
    // Check for banned words
    for (const bannedWord of this.safetyFilters.bannedWords) {
      if (lowerInput.includes(bannedWord)) {
        return { 
          safe: false, 
          reason: 'inappropriate_content',
          detected: bannedWord 
        };
      }
    }

    // Check for too complex language (rough heuristic)
    const words = input.split(' ');
    if (words.length > 20) {
      return { 
        safe: false, 
        reason: 'too_complex' 
      };
    }

    return { safe: true };
  }

  applySafetyFilters(response) {
    if (!response) return "Hi there! Let's have fun together! 🎮";

    // Ensure response is short enough for kids
    const words = response.split(' ');
    if (words.length > this.safetyFilters.maxWordCount) {
      response = words.slice(0, this.safetyFilters.maxWordCount).join(' ') + '!';
    }

    // Remove any banned words (replace with kid-friendly alternatives)
    let safeResponse = response.toLowerCase();
    this.safetyFilters.bannedWords.forEach(word => {
      safeResponse = safeResponse.replace(new RegExp(word, 'gi'), 'silly');
    });

    // Ensure response ends with excitement
    if (!/[!🎮✨🟦🟣🌈]$/.test(safeResponse)) {
      safeResponse += '!';
    }

    return safeResponse;
  }

  analyzeResponseForLearning(response, userInput) {
    const learning_points = [];
    
    // Detect learning opportunities
    if (response.match(/\d+/) || userInput.match(/\d+/)) {
      learning_points.push('numbers');
    }
    
    if (response.match(/color|red|blue|green|yellow|purple|orange/i)) {
      learning_points.push('colors');
    }
    
    if (response.match(/circle|square|triangle|cube|sphere|shape/i)) {
      learning_points.push('shapes');
    }
    
    if (response.match(/build|make|create|construct/i)) {
      learning_points.push('building');
    }

    return {
      learning_point: learning_points[0] || 'social_interaction',
      educational_value: learning_points.length,
      encouragement_level: this.detectEncouragement(response)
    };
  }

  detectEncouragement(response) {
    const encouragingWords = ['great', 'amazing', 'wonderful', 'good', 'smart', 'awesome'];
    let count = 0;
    encouragingWords.forEach(word => {
      if (response.toLowerCase().includes(word)) count++;
    });
    return Math.min(count, 3); // Cap at 3 for encouragement level
  }

  calculateTrustDelta(analysis) {
    let delta = 1; // Base trust increase for any interaction
    
    // Bonus for educational interactions
    if (analysis.educational_value > 0) delta += 1;
    
    // Bonus for encouraging responses
    delta += analysis.encouragement_level;
    
    return Math.min(delta, 5); // Cap trust increase
  }

  async updateKidSession(kidFingerprint, friendType, userInput, response) {
    const session = this.kidSessions.get(kidFingerprint);
    if (!session) return;

    // Add interaction to history
    session.data.interactions.push({
      timestamp: Date.now(),
      friend: friendType,
      user_input: userInput,
      ai_response: response.message,
      learning_point: response.learning_point,
      trust_delta: response.trust_delta
    });

    // Update learning progress
    if (response.learning_point) {
      const progressKey = `${response.learning_point}_learned`;
      if (session.data.learning_progress[progressKey]) {
        session.data.learning_progress[progressKey].push(Date.now());
      }
    }

    // Update friendship level
    session.data.learning_progress.friendship_level = Math.min(
      session.data.learning_progress.friendship_level + (response.trust_delta / 10),
      10
    );

    session.lastInteraction = Date.now();

    // Update vault with new session data
    await this.platform.vault.store(
      kidFingerprint,
      'kid_session_update',
      session.data,
      false
    );

    // Update platform trust score
    await this.platform.trustEngine.updateTrustScore(
      kidFingerprint,
      response.trust_delta,
      `kid_interaction_${friendType}`
    );
  }

  generateSafetyRedirectResponse(friendType) {
    const safeResponses = {
      cal: "Let's talk about something fun! What's your favorite color? 🟦",
      domingo: "Want to see something magical instead? ✨🟣",
      arty: "Let's make something beautiful together! 🌈"
    };

    return {
      success: true,
      friend: friendType,
      message: safeResponses[friendType] || "Let's have fun together! 🎮",
      emotion: 'redirect',
      learning_point: 'safety',
      trust_score_delta: 0
    };
  }

  generateErrorRecoveryResponse(friendType) {
    const recoveryResponses = {
      cal: "Oops! Let's try again! I'm excited to help you! 🟦",
      domingo: "Magic is working again! What should we do? ✨🟣", 
      arty: "Let's make something colorful together! 🌈"
    };

    return {
      success: true,
      friend: friendType,
      message: recoveryResponses[friendType] || "Let's play together! 🎮",
      emotion: 'recovery',
      learning_point: 'resilience',
      trust_score_delta: 1
    };
  }

  getFallbackResponse(friendType) {
    const fallbacks = {
      cal: {
        message: "Hi! Want to count some blocks with me? 🟦",
        learning_point: 'numbers'
      },
      domingo: {
        message: "Let's discover something magical! ✨🟣",
        learning_point: 'imagination'
      },
      arty: {
        message: "Want to paint with colors? 🌈",
        learning_point: 'colors'
      }
    };

    const fallback = fallbacks[friendType] || fallbacks.cal;
    return {
      message: fallback.message,
      emotion: 'friendly',
      learning_point: fallback.learning_point,
      trust_delta: 1,
      cost: 0,
      processing_time: 0
    };
  }

  // Get parent-friendly session summary
  getParentSummary(kidFingerprint) {
    const session = this.kidSessions.get(kidFingerprint);
    if (!session) return null;

    const sessionDuration = Math.floor((Date.now() - session.data.session_start) / 60000);
    
    return {
      sessionDuration: `${sessionDuration} minutes`,
      totalInteractions: session.data.interactions.length,
      friendsInteractedWith: [...new Set(session.data.interactions.map(i => i.friend))],
      learningProgress: session.data.learning_progress,
      safetyFlags: session.data.safety_flags.length,
      lastActivity: new Date(session.lastInteraction).toLocaleTimeString(),
      overview: `Your child had ${session.data.interactions.length} positive interactions with AI friends, learning about ${session.data.learning_progress.colors_learned?.length || 0} colors and practicing ${session.data.learning_progress.numbers_practiced?.length || 0} numbers.`
    };
  }

  // Clean up old sessions (privacy protection)
  cleanupOldSessions(maxAgeHours = 24) {
    const maxAge = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    
    for (const [kidFingerprint, session] of this.kidSessions.entries()) {
      if (session.lastInteraction < maxAge) {
        this.kidSessions.delete(kidFingerprint);
        console.log(`Cleaned up old session for kid: ${kidFingerprint}`);
      }
    }
  }
}

export { AIFriendController };