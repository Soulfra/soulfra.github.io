// Stream-Based Bounty Challenge Engine
// Activated by /mirrorhq page load or stream presence

class BountyChallengeEngine {
  constructor() {
    this.activeAgents = new Map();
    this.availableChallenges = new Map();
    this.viewerState = null;
    this.submissionHandler = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🎯 Initializing Bounty Challenge Engine...');
    
    try {
      // Load challenge definitions
      await this.loadChallengeHooks();
      
      // Initialize submission handler
      this.submissionHandler = new BountySubmissionHandler();
      
      // Scan for active agents
      await this.scanActiveAgents();
      
      // Initialize viewer state
      await this.initializeViewerState();
      
      // Setup event listeners
      this.setupEventListeners();
      
      this.isInitialized = true;
      console.log('✅ Bounty Challenge Engine ready');
      
    } catch (error) {
      console.error('❌ Failed to initialize Bounty Challenge Engine:', error);
      throw error;
    }
  }

  async loadChallengeHooks() {
    try {
      // Load from vault or fetch from API
      const response = await fetch('/vault/challenges/stream-anomaly-hooks.json');
      const challengeData = await response.json();
      
      challengeData.agents.forEach(agentConfig => {
        this.availableChallenges.set(agentConfig.agent, agentConfig.challenges);
      });
      
      console.log(`📋 Loaded challenges for ${this.availableChallenges.size} agents`);
    } catch (error) {
      console.error('Failed to load challenge hooks:', error);
      // Fallback to hardcoded minimal challenges
      this.loadFallbackChallenges();
    }
  }

  loadFallbackChallenges() {
    const fallback = {
      "oracle_apprentice": [
        {
          type: "echo_loop",
          description: "Agent repeats final line in certain moods",
          trigger: "loop-detected",
          blessing_required: 2,
          reward: "blessing_fragment"
        }
      ]
    };
    
    Object.entries(fallback).forEach(([agent, challenges]) => {
      this.availableChallenges.set(agent, challenges);
    });
  }

  async scanActiveAgents() {
    // Check for active agent streams in the current context
    const streamElements = document.querySelectorAll('[data-agent-id]');
    
    streamElements.forEach(element => {
      const agentId = element.getAttribute('data-agent-id');
      const agentState = this.extractAgentState(element);
      
      this.activeAgents.set(agentId, {
        element: element,
        state: agentState,
        lastUpdate: Date.now(),
        challenges: this.availableChallenges.get(agentId) || []
      });
    });
    
    console.log(`🤖 Found ${this.activeAgents.size} active agents`);
  }

  extractAgentState(element) {
    return {
      mood: element.getAttribute('data-mood') || 'neutral',
      tier: element.getAttribute('data-tier') || 1,
      lastResponse: element.querySelector('.agent-response')?.textContent || '',
      traits: element.getAttribute('data-traits')?.split(',') || [],
      isResponding: element.classList.contains('responding')
    };
  }

  async initializeViewerState() {
    try {
      // Get viewer blessing state from vault
      const response = await fetch('/vault/viewer/blessing-state');
      this.viewerState = await response.json();
      
      if (!this.viewerState.blessings) {
        this.viewerState.blessings = 0;
      }
      
      console.log(`👤 Viewer initialized with ${this.viewerState.blessings} blessings`);
    } catch (error) {
      console.error('Failed to load viewer state:', error);
      // Anonymous viewer fallback
      this.viewerState = {
        id: 'anon_' + Date.now(),
        blessings: 0,
        reflections: 0,
        isAnonymous: true
      };
    }
  }

  setupEventListeners() {
    // Listen for agent state changes
    document.addEventListener('agentStateChange', (event) => {
      this.handleAgentStateChange(event.detail);
    });

    // Listen for potential anomalies
    document.addEventListener('agentAnomaly', (event) => {
      this.handlePotentialAnomaly(event.detail);
    });

    // Setup whisper submission interface
    this.createWhisperInterface();
  }

  createWhisperInterface() {
    // Create floating whisper button if it doesn't exist
    if (document.getElementById('whisper-interface')) return;
    
    const whisperButton = document.createElement('div');
    whisperButton.id = 'whisper-interface';
    whisperButton.className = 'whisper-button';
    whisperButton.innerHTML = '💭';
    whisperButton.title = 'Submit reflection (whisper)';
    
    whisperButton.addEventListener('click', () => {
      this.openWhisperModal();
    });
    
    document.body.appendChild(whisperButton);
  }

  openWhisperModal() {
    const modal = document.createElement('div');
    modal.className = 'whisper-modal';
    modal.innerHTML = `
      <div class="whisper-content">
        <h3>Submit Reflection</h3>
        <p>Describe what you've observed:</p>
        <textarea id="whisper-text" placeholder="I noticed the agent..."></textarea>
        <div class="whisper-actions">
          <button id="submit-whisper">Submit Reflection</button>
          <button id="cancel-whisper">Cancel</button>
        </div>
        <div class="blessing-status">
          Blessings: ${this.viewerState.blessings}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event handlers
    document.getElementById('submit-whisper').addEventListener('click', () => {
      const text = document.getElementById('whisper-text').value;
      this.submitReflection(text);
      document.body.removeChild(modal);
    });
    
    document.getElementById('cancel-whisper').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  }

  async submitReflection(reflectionText) {
    if (!reflectionText.trim()) {
      console.warn('Empty reflection submitted');
      return;
    }

    console.log('📝 Processing reflection submission...');
    
    try {
      const submission = {
        id: 'refl_' + Date.now(),
        viewerId: this.viewerState.id,
        text: reflectionText,
        timestamp: new Date().toISOString(),
        agents: Array.from(this.activeAgents.keys()),
        viewerState: this.viewerState
      };

      // Route through submission handler
      const result = await this.submissionHandler.processSubmission(submission);
      
      if (result.accepted) {
        this.showReflectionAccepted(result);
      } else {
        this.showReflectionPending(result);
      }
      
    } catch (error) {
      console.error('Failed to submit reflection:', error);
      this.showReflectionError(error);
    }
  }

  handleAgentStateChange(agentData) {
    const { agentId, newState } = agentData;
    
    if (this.activeAgents.has(agentId)) {
      const agent = this.activeAgents.get(agentId);
      agent.state = { ...agent.state, ...newState };
      agent.lastUpdate = Date.now();
      
      // Check for challenge triggers
      this.checkChallengeTriggersForAgent(agentId, newState);
    }
  }

  checkChallengeTriggersForAgent(agentId, state) {
    const agent = this.activeAgents.get(agentId);
    if (!agent || !agent.challenges) return;
    
    agent.challenges.forEach(challenge => {
      if (this.evaluateChallengeTrigger(challenge, state)) {
        this.flagPotentialChallenge(agentId, challenge, state);
      }
    });
  }

  evaluateChallengeTrigger(challenge, state) {
    switch (challenge.trigger) {
      case 'loop-detected':
        return this.detectEchoLoop(state);
      case 'trait-compare':
        return this.detectTraitInconsistency(state);
      case 'mood-shift':
        return this.detectUnexpectedMoodShift(state);
      default:
        return false;
    }
  }

  detectEchoLoop(state) {
    // Simple echo detection: last response repeated
    const responses = state.recentResponses || [state.lastResponse];
    if (responses.length < 2) return false;
    
    return responses[responses.length - 1] === responses[responses.length - 2];
  }

  detectTraitInconsistency(state) {
    // Check if expected traits are missing
    const expectedTraits = state.expectedTraits || [];
    const currentTraits = state.traits || [];
    
    return expectedTraits.some(trait => !currentTraits.includes(trait));
  }

  detectUnexpectedMoodShift(state) {
    // Detect rapid mood changes
    return state.moodHistory && 
           state.moodHistory.length > 1 && 
           state.moodHistory.slice(-2).every((mood, i, arr) => 
             i === 0 || mood !== arr[i - 1]
           );
  }

  flagPotentialChallenge(agentId, challenge, state) {
    console.log(`🚨 Potential challenge detected: ${challenge.type} for ${agentId}`);
    
    // Highlight the agent for viewer attention
    const agentElement = this.activeAgents.get(agentId)?.element;
    if (agentElement) {
      agentElement.classList.add('challenge-flagged');
      
      // Add visual indicator
      const indicator = document.createElement('div');
      indicator.className = 'challenge-indicator';
      indicator.innerHTML = '⚡';
      indicator.title = `Potential ${challenge.type} detected`;
      agentElement.appendChild(indicator);
    }
    
    // Auto-suggest reflection to engaged viewers
    if (this.viewerState.blessings >= challenge.blessing_required) {
      this.suggestReflection(agentId, challenge);
    }
  }

  suggestReflection(agentId, challenge) {
    const suggestion = document.createElement('div');
    suggestion.className = 'reflection-suggestion';
    suggestion.innerHTML = `
      <div class="suggestion-content">
        <p>💭 Reflection opportunity detected</p>
        <p>${challenge.description}</p>
        <button onclick="this.parentElement.parentElement.remove()">Dismiss</button>
      </div>
    `;
    
    document.body.appendChild(suggestion);
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (suggestion.parentElement) {
        suggestion.parentElement.removeChild(suggestion);
      }
    }, 10000);
  }

  showReflectionAccepted(result) {
    this.showNotification('✅ Reflection accepted! Reward issued: ' + result.reward, 'success');
  }

  showReflectionPending(result) {
    this.showNotification('⏳ Reflection submitted for review', 'pending');
  }

  showReflectionError(error) {
    this.showNotification('❌ Failed to submit reflection: ' + error.message, 'error');
  }

  showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `bounty-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentElement) {
        notification.parentElement.removeChild(notification);
      }
    }, 5000);
  }

  // Public API for external integration
  getActiveAgents() {
    return Array.from(this.activeAgents.keys());
  }

  getViewerState() {
    return { ...this.viewerState };
  }

  getAvailableChallenges(agentId) {
    return this.availableChallenges.get(agentId) || [];
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  if (window.location.pathname.includes('/mirrorhq') || 
      document.querySelector('[data-agent-id]')) {
    
    window.bountyChallengeEngine = new BountyChallengeEngine();
    await window.bountyChallengeEngine.initialize();
  }
});

// CSS styles for the interface
const styles = `
.whisper-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  transition: transform 0.2s;
}

.whisper-button:hover {
  transform: scale(1.1);
}

.whisper-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.whisper-content {
  background: white;
  padding: 30px;
  border-radius: 10px;
  max-width: 500px;
  width: 90%;
}

.whisper-content textarea {
  width: 100%;
  height: 120px;
  margin: 15px 0;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  resize: vertical;
}

.whisper-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.whisper-actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

#submit-whisper {
  background: #667eea;
  color: white;
}

#cancel-whisper {
  background: #eee;
  color: #333;
}

.challenge-flagged {
  border: 2px solid #ff6b6b;
  animation: pulse 2s infinite;
}

.challenge-indicator {
  position: absolute;
  top: -10px;
  right: -10px;
  background: #ff6b6b;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.reflection-suggestion {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #4ecdc4;
  color: white;
  padding: 15px;
  border-radius: 10px;
  max-width: 300px;
  z-index: 1500;
}

.bounty-notification {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 15px 25px;
  border-radius: 10px;
  color: white;
  z-index: 2500;
}

.bounty-notification.success {
  background: #4ecdc4;
}

.bounty-notification.pending {
  background: #f39c12;
}

.bounty-notification.error {
  background: #e74c3c;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(255, 107, 107, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0); }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);