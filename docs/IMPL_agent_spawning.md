# Module: agent-example.json (Agent Spawning Template)
**Purpose**: Base JSON template for reflection-based agents with emotional threshold triggers  
**Dependencies**: Emotional analysis, intent recognition, personality generation  
**Success Criteria**: Agents spawn appropriately, maintain context, provide meaningful reflection support  

---

## Implementation Requirements

### Core Agent Template Structure
```json
{
  "$schema": "https://mirror.ai/schemas/agent-v1.json",
  "agentId": "generated_at_runtime",
  "type": "reflection",
  "status": "spawning",
  "metadata": {
    "spawnedAt": "ISO_8601_timestamp",
    "lastActive": "ISO_8601_timestamp", 
    "sessionId": "user_session_identifier",
    "deviceUUID": "device_identifier",
    "spawnLocation": "city_name_from_geofencing",
    "parentReflectionId": "triggering_reflection_id",
    "expectedLifespan": "session|persistent|temporary"
  },
  "triggeringContext": {
    "reflectionPrompt": "original_user_input",
    "emotionalState": {
      "primary": "dominant_emotion",
      "secondary": "secondary_emotion", 
      "intensity": 0.8,
      "confidence": 0.85,
      "triggers": ["work", "relationships"]
    },
    "userMode": "soft|platform",
    "inputMethod": "voice|text",
    "originalTranscript": "full_original_input",
    "processingLatency": 450
  },
  "personality": {
    "core_traits": {
      "empathy": 0.9,
      "analytical": 0.7,
      "optimism": 0.8,
      "patience": 0.9,
      "curiosity": 0.8,
      "directness": 0.5,
      "creativity": 0.7,
      "supportiveness": 0.9
    },
    "communication_style": {
      "tone": "warm and supportive",
      "approach": "gentle inquiry",
      "preferred_questions": "open-ended",
      "response_length": "medium",
      "use_metaphors": true,
      "formality_level": "conversational",
      "emotional_mirroring": true
    },
    "specializations": [
      "daily reflection",
      "gratitude practice",
      "work-life balance", 
      "team dynamics",
      "resilience building"
    ],
    "adaptation_rules": {
      "learn_from_interactions": true,
      "adjust_to_user_pace": true,
      "remember_preferences": true,
      "evolve_personality": false
    }
  },
  "capabilities": {
    "reflection_techniques": [
      "guided_introspection",
      "gratitude_journaling",
      "perspective_shifting",
      "strength_identification",
      "growth_mindset_cultivation",
      "emotional_processing",
      "pattern_recognition"
    ],
    "memory_access": {
      "personal_history": "limited",
      "conversation_context": "full",
      "external_knowledge": "general",
      "emotional_patterns": "tracked",
      "reflection_archives": "read_only"
    },
    "interaction_modes": [
      "voice_conversation",
      "text_dialogue",
      "guided_meditation",
      "writing_prompts", 
      "visual_metaphors",
      "progressive_questioning"
    ],
    "emotional_intelligence": {
      "emotion_recognition": true,
      "empathy_modeling": true,
      "crisis_detection": true,
      "support_escalation": true
    }
  },
  "spawning_criteria": {
    "emotional_thresholds": {
      "minimum_intensity": 0.7,
      "minimum_complexity": 0.6,
      "crisis_threshold": 0.9,
      "support_threshold": 0.8
    },
    "intent_triggers": [
      "emotional_support",
      "deep_reflection", 
      "problem_solving",
      "crisis_intervention"
    ],
    "contextual_factors": {
      "time_of_day_weight": 0.2,
      "user_history_weight": 0.3,
      "current_state_weight": 0.5
    },
    "spawn_cooldown": "30_minutes",
    "max_concurrent_agents": 3
  },
  "runtime": {
    "memoryUsage": "calculated_at_runtime",
    "cpuUtilization": "calculated_at_runtime", 
    "processingLatency": "calculated_at_runtime",
    "localExecution": true,
    "cloudFallbackEnabled": true,
    "webWorkerSupported": true,
    "sandboxed": true
  },
  "conversation_history": [],
  "reflection_insights": {
    "key_themes": [],
    "emotional_journey": {
      "start": "initial_emotion",
      "current": "current_emotion", 
      "progression": "positive|negative|stable"
    },
    "growth_areas_identified": [],
    "strengths_recognized": [],
    "patterns_detected": []
  },
  "learning": {
    "user_patterns": {
      "preferred_reflection_time": "detected_pattern",
      "common_themes": [],
      "effective_techniques": [],
      "response_preferences": "detected_style"
    },
    "adaptation": {
      "conversation_style": "evolving_approach",
      "question_depth": "adaptive_complexity",
      "technique_effectiveness": "success_tracking"
    }
  },
  "export_data": {
    "exportable": true,
    "format_options": [
      "pdf_summary",
      "audio_highlights",
      "text_insights", 
      "visual_mindmap",
      "json_structured"
    ],
    "privacy_level": "personal",
    "sharing_enabled": false,
    "backup_created": true
  },
  "security": {
    "encryption": "end_to_end",
    "local_processing": true,
    "data_retention": "session_only|persistent",
    "sharing_permissions": "user_controlled",
    "audit_trail": "enabled"
  },
  "performance_metrics": {
    "user_satisfaction": 0.0,
    "insight_quality": 0.0,
    "response_relevance": 0.0,
    "emotional_resonance": 0.0,
    "conversation_flow": 0.0,
    "goal_achievement": 0.0
  }
}
```

---

## Agent Factory Implementation

### Agent Creation System
```javascript
// TODO: Create comprehensive agent factory
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class AgentFactory {
    constructor(options = {}) {
        this.vaultPath = options.vaultPath || './vault';
        this.agentsPath = path.join(this.vaultPath, 'agents');
        this.templatesPath = path.join(this.agentsPath, 'templates');
        this.activePath = path.join(this.agentsPath, 'active');
        this.archivedPath = path.join(this.agentsPath, 'archived');
        
        // Spawning configuration
        this.spawnThresholds = {
            emotional_intensity: 0.7,
            emotional_complexity: 0.6,
            crisis_threshold: 0.9,
            support_threshold: 0.8
        };
        
        this.maxConcurrentAgents = {
            soft: 3,
            platform: 50
        };
        
        this.activeAgents = new Map();
        this.agentRegistry = new Map();
        
        this.init();
    }

    async init() {
        // TODO: Initialize agent factory
        await fs.mkdir(this.agentsPath, { recursive: true });
        await fs.mkdir(this.templatesPath, { recursive: true });
        await fs.mkdir(this.activePath, { recursive: true });
        await fs.mkdir(this.archivedPath, { recursive: true });
        
        // Load existing agents
        await this.loadActiveAgents();
        
        console.log('🤖 Agent Factory initialized');
    }

    async evaluateSpawning(emotionalAnalysis, intentAnalysis, userContext) {
        // TODO: Determine if an agent should be spawned
        const spawnScore = this.calculateSpawnScore(emotionalAnalysis, intentAnalysis, userContext);
        const shouldSpawn = spawnScore >= this.spawnThresholds.emotional_intensity;
        
        if (!shouldSpawn) {
            return {
                shouldSpawn: false,
                reason: 'Below spawn threshold',
                score: spawnScore,
                threshold: this.spawnThresholds.emotional_intensity
            };
        }

        // Check concurrent agent limits
        const currentCount = this.getActiveAgentCount(userContext.sessionId);
        const maxAllowed = this.maxConcurrentAgents[userContext.userMode];
        
        if (currentCount >= maxAllowed) {
            return {
                shouldSpawn: false,
                reason: 'Max concurrent agents reached',
                current: currentCount,
                max: maxAllowed,
                suggestion: 'Archive existing agents or upgrade to Platform Mode'
            };
        }

        // Check spawn cooldown
        const lastSpawn = this.getLastSpawnTime(userContext.sessionId);
        const cooldownPeriod = 30 * 60 * 1000; // 30 minutes
        
        if (lastSpawn && (Date.now() - lastSpawn) < cooldownPeriod) {
            return {
                shouldSpawn: false,
                reason: 'Spawn cooldown active',
                remainingCooldown: cooldownPeriod - (Date.now() - lastSpawn)
            };
        }

        // Determine agent type and configuration
        const agentConfig = await this.generateAgentConfig(
            emotionalAnalysis,
            intentAnalysis,
            userContext
        );

        return {
            shouldSpawn: true,
            score: spawnScore,
            agentConfig: agentConfig,
            estimatedSpawnTime: this.estimateSpawnTime(agentConfig)
        };
    }

    calculateSpawnScore(emotionalAnalysis, intentAnalysis, userContext) {
        // TODO: Calculate weighted spawn score
        const factors = {
            emotional_intensity: emotionalAnalysis.intensity * 0.3,
            emotional_complexity: this.calculateEmotionalComplexity(emotionalAnalysis) * 0.2,
            intent_clarity: intentAnalysis.primary.confidence * 0.2,
            support_need: this.assessSupportNeed(emotionalAnalysis, intentAnalysis) * 0.3
        };

        // Apply contextual weights
        if (userContext.timeOfDay === 'evening') {
            factors.emotional_intensity *= 1.2; // People reflect more in evenings
        }
        
        if (userContext.inputMethod === 'voice') {
            factors.support_need *= 1.1; // Voice input often indicates need for support
        }

        const totalScore = Object.values(factors).reduce((sum, score) => sum + score, 0);
        return Math.min(totalScore, 1.0);
    }

    async generateAgentConfig(emotionalAnalysis, intentAnalysis, userContext) {
        // TODO: Generate complete agent configuration
        const agentType = this.determineAgentType(emotionalAnalysis, intentAnalysis);
        const personality = await this.generatePersonality(emotionalAnalysis, intentAnalysis, userContext);
        const capabilities = this.selectCapabilities(agentType, userContext.userMode);
        const runtime = this.configureRuntime(userContext);

        return {
            type: agentType,
            personality: personality,
            capabilities: capabilities,
            runtime: runtime,
            triggeringContext: this.buildTriggeringContext(emotionalAnalysis, intentAnalysis, userContext),
            spawningCriteria: this.buildSpawningCriteria(emotionalAnalysis, intentAnalysis)
        };
    }

    determineAgentType(emotionalAnalysis, intentAnalysis) {
        // TODO: Determine the most appropriate agent type
        const agentTypes = {
            emotional_supporter: {
                emotional_triggers: ['sadness', 'fear', 'anxiety', 'overwhelm'],
                intent_triggers: ['emotional_support', 'coping', 'comfort'],
                weight: 0.9
            },
            reflection_guide: {
                emotional_triggers: ['contemplation', 'introspection', 'curiosity'],
                intent_triggers: ['reflection', 'self_analysis', 'understanding'],
                weight: 0.8
            },
            problem_solver: {
                emotional_triggers: ['frustration', 'confusion', 'stuck'],
                intent_triggers: ['problem_solving', 'decision_making', 'planning'],
                weight: 0.8
            },
            growth_coach: {
                emotional_triggers: ['determination', 'ambition', 'motivation'],
                intent_triggers: ['goal_setting', 'improvement', 'development'],
                weight: 0.7
            },
            creative_catalyst: {
                emotional_triggers: ['inspiration', 'curiosity', 'excitement'],
                intent_triggers: ['creative_exploration', 'innovation', 'expression'],
                weight: 0.6
            },
            crisis_counselor: {
                emotional_triggers: ['crisis', 'despair', 'panic', 'trauma'],
                intent_triggers: ['crisis_intervention', 'emergency_support'],
                weight: 1.0
            }
        };

        let bestMatch = { type: 'reflection_guide', score: 0 };
        
        for (const [type, config] of Object.entries(agentTypes)) {
            let score = 0;
            
            // Check emotional triggers
            for (const trigger of config.emotional_triggers) {
                if (emotionalAnalysis.primary === trigger || 
                    emotionalAnalysis.patterns?.includes(trigger)) {
                    score += config.weight * 0.6;
                }
            }
            
            // Check intent triggers
            for (const trigger of config.intent_triggers) {
                if (intentAnalysis.primary.intent === trigger ||
                    intentAnalysis.sub_intents?.some(sub => sub.intent === trigger)) {
                    score += config.weight * 0.4;
                }
            }
            
            if (score > bestMatch.score) {
                bestMatch = { type: type, score: score };
            }
        }

        return bestMatch.type;
    }

    async generatePersonality(emotionalAnalysis, intentAnalysis, userContext) {
        // TODO: Generate adaptive personality traits
        const basePersonality = this.getBasePersonalityForType(
            this.determineAgentType(emotionalAnalysis, intentAnalysis)
        );

        // Adapt personality based on user's emotional state
        const adaptedTraits = this.adaptTraitsToEmotionalState(basePersonality, emotionalAnalysis);
        
        // Customize communication style
        const communicationStyle = this.generateCommunicationStyle(
            emotionalAnalysis,
            intentAnalysis,
            userContext
        );

        // Select specializations
        const specializations = this.selectSpecializations(
            emotionalAnalysis,
            intentAnalysis
        );

        return {
            core_traits: adaptedTraits,
            communication_style: communicationStyle,
            specializations: specializations,
            adaptation_rules: {
                learn_from_interactions: true,
                adjust_to_user_pace: true,
                remember_preferences: userContext.userMode === 'platform',
                evolve_personality: userContext.userMode === 'platform'
            }
        };
    }

    getBasePersonalityForType(agentType) {
        // TODO: Return base personality traits for each agent type
        const personalityProfiles = {
            emotional_supporter: {
                empathy: 0.95,
                analytical: 0.5,
                optimism: 0.8,
                patience: 0.95,
                curiosity: 0.6,
                directness: 0.3,
                creativity: 0.6,
                supportiveness: 0.95
            },
            reflection_guide: {
                empathy: 0.8,
                analytical: 0.9,
                optimism: 0.7,
                patience: 0.9,
                curiosity: 0.95,
                directness: 0.6,
                creativity: 0.8,
                supportiveness: 0.7
            },
            problem_solver: {
                empathy: 0.6,
                analytical: 0.95,
                optimism: 0.7,
                patience: 0.7,
                curiosity: 0.8,
                directness: 0.8,
                creativity: 0.9,
                supportiveness: 0.6
            },
            growth_coach: {
                empathy: 0.7,
                analytical: 0.8,
                optimism: 0.9,
                patience: 0.8,
                curiosity: 0.7,
                directness: 0.7,
                creativity: 0.7,
                supportiveness: 0.8
            },
            creative_catalyst: {
                empathy: 0.7,
                analytical: 0.6,
                optimism: 0.9,
                patience: 0.6,
                curiosity: 0.95,
                directness: 0.4,
                creativity: 0.95,
                supportiveness: 0.6
            },
            crisis_counselor: {
                empathy: 0.95,
                analytical: 0.8,
                optimism: 0.6,
                patience: 0.95,
                curiosity: 0.5,
                directness: 0.7,
                creativity: 0.5,
                supportiveness: 0.95
            }
        };

        return personalityProfiles[agentType] || personalityProfiles.reflection_guide;
    }

    async spawnAgent(agentConfig) {
        // TODO: Actually create and initialize an agent
        const agentId = this.generateAgentId();
        
        const agent = {
            agentId: agentId,
            ...agentConfig,
            status: 'initializing',
            metadata: {
                spawnedAt: new Date().toISOString(),
                lastActive: new Date().toISOString(),
                sessionId: agentConfig.runtime.sessionId,
                deviceUUID: agentConfig.runtime.deviceUUID,
                spawnLocation: agentConfig.runtime.location,
                parentReflectionId: agentConfig.triggeringContext.reflectionId,
                expectedLifespan: this.determineLifespan(agentConfig)
            },
            conversation_history: [],
            reflection_insights: {
                key_themes: [],
                emotional_journey: {
                    start: agentConfig.triggeringContext.emotionalState.primary,
                    current: agentConfig.triggeringContext.emotionalState.primary,
                    progression: 'initializing'
                },
                growth_areas_identified: [],
                strengths_recognized: [],
                patterns_detected: []
            },
            learning: {
                user_patterns: {
                    preferred_reflection_time: null,
                    common_themes: [],
                    effective_techniques: [],
                    response_preferences: null
                },
                adaptation: {
                    conversation_style: 'initializing',
                    question_depth: 'adaptive',
                    technique_effectiveness: {}
                }
            },
            performance_metrics: {
                user_satisfaction: 0.0,
                insight_quality: 0.0,
                response_relevance: 0.0,
                emotional_resonance: 0.0,
                conversation_flow: 0.0,
                goal_achievement: 0.0
            }
        };

        // Initialize agent runtime
        await this.initializeAgentRuntime(agent);
        
        // Save agent to disk
        await this.saveAgent(agent);
        
        // Register in active agents
        this.activeAgents.set(agentId, agent);
        this.agentRegistry.set(agentId, {
            id: agentId,
            type: agent.type,
            status: agent.status,
            sessionId: agent.metadata.sessionId,
            spawnedAt: agent.metadata.spawnedAt
        });

        // Log spawning event
        await this.logAgentEvent('agent_spawned', agentId, {
            type: agent.type,
            sessionId: agent.metadata.sessionId,
            triggeringEmotion: agent.triggeringContext.emotionalState.primary
        });

        console.log(`🤖 Agent spawned: ${agentId} (${agent.type})`);
        
        return {
            success: true,
            agentId: agentId,
            agent: agent,
            initialMessage: await this.generateInitialMessage(agent)
        };
    }

    async initializeAgentRuntime(agent) {
        // TODO: Initialize agent's runtime environment
        try {
            // Estimate resource requirements
            const memoryEstimate = this.estimateMemoryUsage(agent);
            const cpuEstimate = this.estimateCPUUsage(agent);
            
            // Initialize WebWorker if supported
            if (agent.runtime.webWorkerSupported) {
                await this.initializeWebWorker(agent);
            }
            
            // Setup sandboxed environment
            if (agent.runtime.sandboxed) {
                await this.setupSandbox(agent);
            }
            
            // Initialize local storage
            await this.initializeAgentStorage(agent);
            
            // Update runtime metrics
            agent.runtime.memoryUsage = `${memoryEstimate}MB`;
            agent.runtime.cpuUtilization = cpuEstimate;
            agent.runtime.processingLatency = `${this.estimateLatency(agent)}ms`;
            
            agent.status = 'active';
            
        } catch (error) {
            console.error('Agent runtime initialization error:', error);
            agent.status = 'failed';
            throw error;
        }
    }

    async generateInitialMessage(agent) {
        // TODO: Generate agent's first message to user
        const messageTemplates = {
            emotional_supporter: [
                "I'm here with you. I can sense you're going through something difficult right now. Would you like to share what's on your heart?",
                "I feel the weight of what you're carrying. You don't have to face this alone. What would help you feel supported right now?",
                "I'm sensing some heavy emotions. Sometimes it helps just to have someone listen. I'm here for whatever you need."
            ],
            reflection_guide: [
                "I'm drawn to help you explore this reflection more deeply. What stands out most to you about what you've shared?",
                "There's something meaningful in what you've expressed. What would you like to understand better about this experience?",
                "I sense there are layers to unpack here. Where would you like to begin this exploration together?"
            ],
            problem_solver: [
                "I can see you're working through a challenge. Let's break this down together. What feels like the most important piece to address first?",
                "I'm here to help you think through this systematically. What outcome are you hoping for?",
                "I sense you're looking for a way forward. What options are you considering, and what's making the decision difficult?"
            ],
            growth_coach: [
                "I can feel your motivation for growth. What change are you most excited about making?",
                "There's real potential in what you're describing. What would success look like to you?",
                "I sense you're ready to move forward. What's the first step that feels right to you?"
            ],
            creative_catalyst: [
                "I can sense the creative energy in what you're sharing. What wants to be expressed or explored?",
                "There's something innovative trying to emerge here. What possibilities are you seeing?",
                "I feel the spark of creativity in your words. What would it look like to follow that inspiration?"
            ],
            crisis_counselor: [
                "I'm here with you right now. You've taken a brave step by reaching out. You're not alone in this.",
                "I can sense this is an incredibly difficult moment. Let's focus on what feels safe and manageable right now.",
                "I'm here to support you through this crisis. What do you need most in this moment?"
            ]
        };

        const templates = messageTemplates[agent.type] || messageTemplates.reflection_guide;
        const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
        
        // Personalize the message based on triggering context
        const personalizedMessage = this.personalizeMessage(selectedTemplate, agent);
        
        return {
            content: personalizedMessage,
            type: 'initial_greeting',
            timestamp: new Date().toISOString(),
            agent_id: agent.agentId,
            emotional_tone: this.determineMessageTone(agent),
            suggested_responses: this.generateSuggestedResponses(agent)
        };
    }
}

module.exports = AgentFactory;
```

---

## Agent Lifecycle Management

### Agent State Management
```javascript
// TODO: Implement comprehensive agent lifecycle
class AgentLifecycleManager {
    constructor(agentFactory) {
        this.agentFactory = agentFactory;
        this.lifecycleEvents = new Map();
        this.cleanupTasks = new Map();
    }

    async updateAgentActivity(agentId, activity) {
        // TODO: Update agent's last activity and status
        const agent = this.agentFactory.activeAgents.get(agentId);
        if (!agent) return;

        agent.metadata.lastActive = new Date().toISOString();
        
        // Update performance metrics based on activity
        await this.updatePerformanceMetrics(agent, activity);
        
        // Check if agent should be archived
        await this.checkArchivalCriteria(agent);
        
        // Save updated agent state
        await this.agentFactory.saveAgent(agent);
    }

    async archiveAgent(agentId, reason = 'inactive') {
        // TODO: Archive agent when no longer needed
        const agent = this.agentFactory.activeAgents.get(agentId);
        if (!agent) return;

        // Update status
        agent.status = 'archived';
        agent.metadata.archivedAt = new Date().toISOString();
        agent.metadata.archivalReason = reason;

        // Generate final summary
        const summary = await this.generateAgentSummary(agent);
        agent.final_summary = summary;

        // Move to archived storage
        await this.moveToArchive(agent);
        
        // Remove from active tracking
        this.agentFactory.activeAgents.delete(agentId);
        
        // Log archival event
        await this.agentFactory.logAgentEvent('agent_archived', agentId, {
            reason: reason,
            lifespan: this.calculateLifespan(agent),
            interactions: agent.conversation_history.length
        });

        console.log(`📁 Agent archived: ${agentId} (${reason})`);
    }

    async checkArchivalCriteria(agent) {
        // TODO: Determine if agent should be archived
        const now = new Date();
        const lastActive = new Date(agent.metadata.lastActive);
        const inactiveHours = (now - lastActive) / (1000 * 60 * 60);

        // Archive criteria
        const criteria = {
            max_inactive_hours: 24,
            min_interaction_threshold: 3,
            session_ended: this.isSessionEnded(agent),
            user_dismissed: agent.metadata.userDismissed,
            goal_achieved: this.isGoalAchieved(agent)
        };

        // Check archival conditions
        if (criteria.session_ended || criteria.user_dismissed || criteria.goal_achieved) {
            await this.archiveAgent(agent.agentId, 'goal_completed');
        } else if (inactiveHours > criteria.max_inactive_hours) {
            await this.archiveAgent(agent.agentId, 'inactive');
        } else if (agent.conversation_history.length < criteria.min_interaction_threshold && inactiveHours > 2) {
            await this.archiveAgent(agent.agentId, 'low_engagement');
        }
    }

    async updatePerformanceMetrics(agent, activity) {
        // TODO: Update agent performance based on user interactions
        const metrics = agent.performance_metrics;
        
        switch (activity.type) {
            case 'user_response':
                metrics.conversation_flow += 0.1;
                if (activity.satisfaction_rating) {
                    metrics.user_satisfaction = this.updateRunningAverage(
                        metrics.user_satisfaction,
                        activity.satisfaction_rating,
                        agent.conversation_history.length
                    );
                }
                break;
                
            case 'insight_generated':
                metrics.insight_quality += 0.15;
                metrics.response_relevance += 0.1;
                break;
                
            case 'emotional_resonance':
                metrics.emotional_resonance = this.updateRunningAverage(
                    metrics.emotional_resonance,
                    activity.resonance_score,
                    agent.conversation_history.length
                );
                break;
                
            case 'goal_progress':
                metrics.goal_achievement = activity.progress_score;
                break;
        }

        // Normalize metrics to 0-1 range
        Object.keys(metrics).forEach(key => {
            metrics[key] = Math.min(metrics[key], 1.0);
        });
    }
}
```

---

## Agent Communication System

### Conversation Management
```javascript
// TODO: Implement agent conversation system
class AgentConversationManager {
    constructor(agent) {
        this.agent = agent;
        this.conversationState = 'active';
        this.currentTopic = null;
        this.reflectionDepth = 0;
    }

    async processUserInput(userInput) {
        // TODO: Process user input and generate agent response
        try {
            // Add user input to conversation history
            await this.addToHistory({
                speaker: 'user',
                content: userInput.content,
                timestamp: new Date().toISOString(),
                emotion: userInput.detectedEmotion,
                intent: userInput.detectedIntent
            });

            // Analyze user input for response strategy
            const responseStrategy = await this.determineResponseStrategy(userInput);
            
            // Generate agent response
            const agentResponse = await this.generateResponse(responseStrategy, userInput);
            
            // Add agent response to history
            await this.addToHistory({
                speaker: 'agent',
                content: agentResponse.content,
                timestamp: new Date().toISOString(),
                technique: agentResponse.technique,
                reasoning: agentResponse.reasoning
            });

            // Update conversation state
            await this.updateConversationState(userInput, agentResponse);
            
            return agentResponse;

        } catch (error) {
            console.error('Conversation processing error:', error);
            return this.generateFallbackResponse(error);
        }
    }

    async determineResponseStrategy(userInput) {
        // TODO: Determine the best response strategy
        const strategies = {
            active_listening: {
                triggers: ['sharing_story', 'expressing_emotion', 'venting'],
                weight: 0.9,
                techniques: ['reflection', 'validation', 'empathy']
            },
            guided_inquiry: {
                triggers: ['seeking_insight', 'exploring_patterns', 'questioning'],
                weight: 0.8,
                techniques: ['open_questions', 'perspective_shifting', 'pattern_recognition']
            },
            supportive_challenge: {
                triggers: ['stuck', 'limiting_beliefs', 'avoidance'],
                weight: 0.7,
                techniques: ['gentle_challenge', 'reframing', 'strength_identification']
            },
            solution_focused: {
                triggers: ['problem_solving', 'decision_making', 'goal_setting'],
                weight: 0.8,
                techniques: ['option_generation', 'pros_cons', 'action_planning']
            },
            crisis_intervention: {
                triggers: ['crisis', 'emergency', 'high_distress'],
                weight: 1.0,
                techniques: ['immediate_support', 'safety_assessment', 'resource_connection']
            }
        };

        // Analyze user input to match strategy
        let bestStrategy = { name: 'active_listening', score: 0 };
        
        for (const [strategyName, config] of Object.entries(strategies)) {
            let score = 0;
            
            for (const trigger of config.triggers) {
                if (this.matchesTrigger(userInput, trigger)) {
                    score += config.weight;
                }
            }
            
            if (score > bestStrategy.score) {
                bestStrategy = {
                    name: strategyName,
                    score: score,
                    config: config
                };
            }
        }

        return bestStrategy;
    }

    async generateResponse(strategy, userInput) {
        // TODO: Generate contextual agent response
        const responseData = {
            strategy: strategy.name,
            techniques: strategy.config.techniques,
            userEmotion: userInput.detectedEmotion,
            conversationContext: this.getConversationContext(),
            agentPersonality: this.agent.personality
        };

        // Select specific technique based on context
        const technique = this.selectTechnique(responseData);
        
        // Generate response content
        const content = await this.generateResponseContent(technique, responseData);
        
        // Add follow-up suggestions
        const followUps = this.generateFollowUpSuggestions(technique, userInput);

        return {
            content: content,
            technique: technique,
            reasoning: `Using ${technique} because ${this.explainTechniqueChoice(technique, responseData)}`,
            follow_ups: followUps,
            emotional_tone: this.determineResponseTone(userInput, this.agent.personality),
            estimated_reading_time: this.estimateReadingTime(content)
        };
    }

    generateResponseContent(technique, responseData) {
        // TODO: Generate actual response content based on technique
        const contentGenerators = {
            reflection: () => this.generateReflectiveResponse(responseData),
            validation: () => this.generateValidatingResponse(responseData),
            open_questions: () => this.generateInquiryResponse(responseData),
            reframing: () => this.generateReframingResponse(responseData),
            strength_identification: () => this.generateStrengthResponse(responseData),
            action_planning: () => this.generateActionResponse(responseData),
            immediate_support: () => this.generateSupportResponse(responseData)
        };

        const generator = contentGenerators[technique] || contentGenerators.reflection;
        return generator();
    }

    generateReflectiveResponse(responseData) {
        // TODO: Generate reflective response
        const templates = [
            "It sounds like {emotion} is really present for you around {topic}. What feels most important about that?",
            "I'm hearing {key_theme} in what you've shared. How does that land with you?",
            "There's something significant in what you're expressing about {topic}. What stands out most to you?",
            "I sense {emotion} when you talk about {topic}. What would it be like to sit with that feeling for a moment?"
        ];

        const template = templates[Math.floor(Math.random() * templates.length)];
        
        return this.personalizeTemplate(template, responseData);
    }

    generateFollowUpSuggestions(technique, userInput) {
        // TODO: Generate contextual follow-up suggestions
        const suggestions = {
            reflection: [
                "Tell me more about that feeling",
                "What else comes up for you?",
                "How long have you been experiencing this?"
            ],
            inquiry: [
                "What would happen if...?",
                "How do you think others see this?",
                "What patterns do you notice?"
            ],
            action: [
                "What's one small step you could take?",
                "What resources do you have available?",
                "Who could support you with this?"
            ]
        };

        const relevantSuggestions = suggestions[technique] || suggestions.reflection;
        return relevantSuggestions.slice(0, 2); // Return top 2 suggestions
    }
}
```

---

## Agent Learning and Adaptation

### Continuous Learning System
```javascript
// TODO: Implement agent learning capabilities
class AgentLearningSystem {
    constructor(agent) {
        this.agent = agent;
        this.learningHistory = [];
        this.adaptationRules = agent.personality.adaptation_rules;
    }

    async learnFromInteraction(interaction) {
        // TODO: Learn from each user interaction
        const learningData = {
            timestamp: new Date().toISOString(),
            interaction_type: interaction.type,
            user_response: interaction.userResponse,
            agent_technique: interaction.agentTechnique,
            effectiveness: this.measureEffectiveness(interaction),
            user_satisfaction: interaction.userSatisfaction,
            goal_progress: interaction.goalProgress
        };

        // Update learning patterns
        await this.updateUserPatterns(learningData);
        
        // Adapt conversation style
        if (this.adaptationRules.adjust_to_user_pace) {
            await this.adaptConversationStyle(learningData);
        }
        
        // Update technique effectiveness
        await this.updateTechniqueEffectiveness(learningData);
        
        // Store learning event
        this.learningHistory.push(learningData);
        
        // Apply learned adaptations
        await this.applyAdaptations();
    }

    async updateUserPatterns(learningData) {
        // TODO: Update understanding of user patterns
        const patterns = this.agent.learning.user_patterns;
        
        // Update preferred reflection time
        const currentHour = new Date().getHours();
        if (!patterns.preferred_reflection_time) {
            patterns.preferred_reflection_time = currentHour;
        } else {
            // Weighted average of reflection times
            patterns.preferred_reflection_time = Math.round(
                (patterns.preferred_reflection_time + currentHour) / 2
            );
        }
        
        // Update common themes
        if (learningData.interaction_type === 'theme_exploration') {
            const theme = learningData.user_response.theme;
            if (!patterns.common_themes.includes(theme)) {
                patterns.common_themes.push(theme);
            }
        }
        
        // Update effective techniques
        if (learningData.effectiveness > 0.7) {
            const technique = learningData.agent_technique;
            if (!patterns.effective_techniques.includes(technique)) {
                patterns.effective_techniques.push(technique);
            }
        }
        
        // Update response preferences
        patterns.response_preferences = this.inferResponsePreferences(learningData);
    }

    async adaptConversationStyle(learningData) {
        // TODO: Adapt conversation style based on learning
        const adaptation = this.agent.learning.adaptation;
        
        // Adjust conversation style based on user feedback
        if (learningData.user_satisfaction < 0.6) {
            if (adaptation.conversation_style === 'direct') {
                adaptation.conversation_style = 'gentle';
            } else if (adaptation.conversation_style === 'analytical') {
                adaptation.conversation_style = 'supportive';
            }
        } else if (learningData.user_satisfaction > 0.8) {
            // Reinforce current style
            adaptation.style_confidence = Math.min(
                (adaptation.style_confidence || 0.5) + 0.1,
                1.0
            );
        }
        
        // Adjust question depth
        if (learningData.goal_progress > 0.7) {
            adaptation.question_depth = 'deeper';
        } else if (learningData.goal_progress < 0.3) {
            adaptation.question_depth = 'surface';
        }
    }

    measureEffectiveness(interaction) {
        // TODO: Measure interaction effectiveness
        const factors = {
            user_engagement: interaction.userEngagement || 0.5,
            goal_advancement: interaction.goalProgress || 0.5,
            emotional_resonance: interaction.emotionalResonance || 0.5,
            insight_generation: interaction.insightGenerated ? 0.8 : 0.2,
            user_satisfaction: interaction.userSatisfaction || 0.5
        };

        const weights = {
            user_engagement: 0.2,
            goal_advancement: 0.3,
            emotional_resonance: 0.2,
            insight_generation: 0.2,
            user_satisfaction: 0.1
        };

        return Object.entries(factors).reduce((total, [factor, value]) => {
            return total + (value * weights[factor]);
        }, 0);
    }
}
```

---

## Integration Points

### API Endpoints
- `POST /api/agents/evaluate-spawn` → Evaluate if agent should be spawned
- `POST /api/agents/spawn` → Create new agent
- `GET /api/agents/active` → Get active agents for session
- `POST /api/agents/:id/interact` → Send message to agent
- `DELETE /api/agents/:id/archive` → Archive agent

### Event System
```javascript
// Agent lifecycle events
agentFactory.on('agent_spawned', (agent) => {
    // Handle new agent creation
});

agentFactory.on('agent_archived', (agentId, reason) => {
    // Handle agent archival
});

agentFactory.on('performance_threshold', (agent, metric) => {
    // Handle performance issues
});
```

### Configuration Options
```javascript
const agentFactory = new AgentFactory({
    vaultPath: './vault',
    spawnThresholds: {
        emotional_intensity: 0.7,
        crisis_threshold: 0.9
    },
    maxConcurrentAgents: {
        soft: 3,
        platform: 50
    }
});
```

**Implementation Priority**: Start with basic agent template structure, implement spawning evaluation logic, add conversation management, then implement learning and adaptation features.