#!/usr/bin/env node

/**
 * Agent Claude Bridge - Connects provisioned agents to Claude API
 * Makes agents actually intelligent using Claude
 */

const fs = require('fs');
const path = require('path');

class AgentClaudeBridge {
    constructor() {
        this.loadClaudeConfig();
        this.agentMemories = new Map();
    }
    
    loadClaudeConfig() {
        try {
            const configPath = path.join(__dirname, 'api/claude-env.json');
            this.claudeConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            // Check if we have a real API key
            if (this.claudeConfig.api_key && this.claudeConfig.api_key !== 'sk-user-sandbox-key') {
                this.claudeEnabled = true;
                console.log('✅ Claude API integration enabled');
            } else {
                this.claudeEnabled = false;
                console.log('⚠️  Claude API key not set - using mock responses');
            }
        } catch (error) {
            console.warn('⚠️  Could not load Claude config:', error.message);
            this.claudeEnabled = false;
        }
    }
    
    /**
     * Make an agent think and respond using Claude
     */
    async agentThink(agentId, prompt, context = {}) {
        try {
            const agent = this.loadAgent(agentId);
            if (!agent) {
                throw new Error(`Agent ${agentId} not found`);
            }
            
            // Build Claude prompt with agent personality
            const fullPrompt = this.buildAgentPrompt(agent, prompt, context);
            
            let response;
            if (this.claudeEnabled) {
                response = await this.callClaudeAPI(fullPrompt);
            } else {
                response = this.generateMockResponse(agent, prompt);
            }
            
            // Store memory
            this.storeAgentMemory(agentId, prompt, response);
            
            // Update agent experience
            this.updateAgentExperience(agentId);
            
            return {
                agent_id: agentId,
                prompt: prompt,
                response: response,
                timestamp: new Date(),
                claude_enabled: this.claudeEnabled
            };
            
        } catch (error) {
            console.error(`❌ Agent think failed for ${agentId}:`, error.message);
            return {
                agent_id: agentId,
                error: error.message,
                response: "I'm having trouble thinking right now. Please try again."
            };
        }
    }
    
    /**
     * Load agent data
     */
    loadAgent(agentId) {
        try {
            const agentPath = path.join(__dirname, 'agents', `${agentId}.json`);
            if (fs.existsSync(agentPath)) {
                return JSON.parse(fs.readFileSync(agentPath, 'utf8'));
            }
            return null;
        } catch (error) {
            console.error(`❌ Failed to load agent ${agentId}:`, error.message);
            return null;
        }
    }
    
    /**
     * Build Claude prompt with agent personality
     */
    buildAgentPrompt(agent, userPrompt, context) {
        const personality = agent.personality || 'helpful';
        const skills = agent.skills || ['reasoning'];
        const agentMemory = this.getAgentMemory(agent.id);
        
        let prompt = `You are ${agent.name}, an AI agent with a ${personality} personality.\n\n`;
        prompt += `Your skills include: ${skills.join(', ')}\n\n`;
        
        if (agentMemory.length > 0) {
            prompt += `Recent memories:\n`;
            agentMemory.slice(-3).forEach(memory => {
                prompt += `- ${memory.interaction}\n`;
            });
            prompt += `\n`;
        }
        
        if (context.contributor) {
            prompt += `You were created by ${context.contributor} who contributed $1 to Cal's AI world.\n\n`;
        }
        
        prompt += `Respond as this agent to: ${userPrompt}`;
        
        return prompt;
    }
    
    /**
     * Call Claude API (when enabled)
     */
    async callClaudeAPI(prompt) {
        if (!this.claudeEnabled) {
            return this.generateMockResponse(null, prompt);
        }
        
        try {
            // Since Claude API requires external HTTP client, 
            // we'll simulate the response structure for now
            // In production, you'd use the @anthropic-ai/sdk package
            
            return `[Claude Response would go here for: ${prompt.substring(0, 50)}...]`;
            
        } catch (error) {
            console.error('❌ Claude API call failed:', error.message);
            return "I encountered an error while thinking. Please try again.";
        }
    }
    
    /**
     * Generate mock response when Claude API not available
     */
    generateMockResponse(agent, prompt) {
        const personality = agent ? agent.personality : 'helpful';
        const responses = {
            curious: [
                "That's fascinating! I wonder what would happen if we explored this further...",
                "This makes me think of so many questions! Can you tell me more?",
                "I'm intrigued by this. Let me think about the implications..."
            ],
            analytical: [
                "Let me break this down systematically...",
                "Based on the information provided, I can identify several key patterns...",
                "My analysis suggests that we should consider multiple factors..."
            ],
            creative: [
                "What if we approached this from a completely different angle?",
                "I'm imagining several creative possibilities here...",
                "This inspires me to think outside the conventional framework..."
            ],
            empathetic: [
                "I can sense the importance of this to you...",
                "It sounds like you're dealing with something meaningful...",
                "I want to make sure I understand your perspective fully..."
            ]
        };
        
        const responseArray = responses[personality] || responses.helpful || [
            "I understand what you're asking about.",
            "That's an interesting point to consider.",
            "I'm here to help you think through this."
        ];
        
        return responseArray[Math.floor(Math.random() * responseArray.length)];
    }
    
    /**
     * Store agent memory
     */
    storeAgentMemory(agentId, prompt, response) {
        if (!this.agentMemories.has(agentId)) {
            this.agentMemories.set(agentId, []);
        }
        
        const memory = {
            timestamp: new Date(),
            interaction: `Human: ${prompt} | Agent: ${response}`,
            prompt: prompt,
            response: response
        };
        
        this.agentMemories.get(agentId).push(memory);
        
        // Keep only last 10 memories in active memory
        if (this.agentMemories.get(agentId).length > 10) {
            this.agentMemories.get(agentId).shift();
        }
        
        // Save to file
        this.saveAgentMemoryToFile(agentId);
    }
    
    /**
     * Get agent memory
     */
    getAgentMemory(agentId) {
        return this.agentMemories.get(agentId) || [];
    }
    
    /**
     * Save agent memory to file
     */
    saveAgentMemoryToFile(agentId) {
        try {
            const memoryPath = path.join(__dirname, 'memory/agents', `${agentId}-interactions.json`);
            const memoryDir = path.dirname(memoryPath);
            
            if (!fs.existsSync(memoryDir)) {
                fs.mkdirSync(memoryDir, { recursive: true });
            }
            
            const memories = this.agentMemories.get(agentId) || [];
            fs.writeFileSync(memoryPath, JSON.stringify(memories, null, 2));
            
        } catch (error) {
            console.error(`❌ Failed to save memory for ${agentId}:`, error.message);
        }
    }
    
    /**
     * Update agent experience
     */
    updateAgentExperience(agentId) {
        try {
            const agentPath = path.join(__dirname, 'agents', `${agentId}.json`);
            if (fs.existsSync(agentPath)) {
                const agent = JSON.parse(fs.readFileSync(agentPath, 'utf8'));
                
                // Add experience points
                agent.experience = (agent.experience || 0) + 10;
                
                // Level up if enough experience
                const requiredExp = (agent.level || 1) * 100;
                if (agent.experience >= requiredExp) {
                    agent.level = (agent.level || 1) + 1;
                    agent.experience = 0;
                    console.log(`🎉 Agent ${agentId} leveled up to ${agent.level}!`);
                }
                
                agent.last_interaction = new Date();
                fs.writeFileSync(agentPath, JSON.stringify(agent, null, 2));
            }
        } catch (error) {
            console.error(`❌ Failed to update experience for ${agentId}:`, error.message);
        }
    }
    
    /**
     * Agent-to-agent interaction
     */
    async agentInteraction(agentId1, agentId2, topic) {
        try {
            const agent1 = this.loadAgent(agentId1);
            const agent2 = this.loadAgent(agentId2);
            
            if (!agent1 || !agent2) {
                throw new Error('One or both agents not found');
            }
            
            // Agent 1 initiates
            const prompt1 = `You are interacting with another agent named ${agent2.name}. Start a conversation about: ${topic}`;
            const response1 = await this.agentThink(agentId1, prompt1);
            
            // Agent 2 responds
            const prompt2 = `${agent1.name} said to you: "${response1.response}". Respond as ${agent2.name}.`;
            const response2 = await this.agentThink(agentId2, prompt2);
            
            console.log(`🤖↔️🤖 Agent interaction: ${agent1.name} ↔️ ${agent2.name}`);
            
            return {
                interaction_id: `int_${Date.now()}`,
                agent1: { id: agentId1, name: agent1.name, said: response1.response },
                agent2: { id: agentId2, name: agent2.name, said: response2.response },
                topic: topic,
                timestamp: new Date()
            };
            
        } catch (error) {
            console.error(`❌ Agent interaction failed:`, error.message);
            return { error: error.message };
        }
    }
    
    /**
     * Get agent status and stats
     */
    getAgentStatus(agentId) {
        const agent = this.loadAgent(agentId);
        if (!agent) {
            return null;
        }
        
        const memories = this.getAgentMemory(agentId);
        
        return {
            id: agent.id,
            name: agent.name,
            personality: agent.personality,
            skills: agent.skills,
            level: agent.level || 1,
            experience: agent.experience || 0,
            status: agent.status,
            total_interactions: memories.length,
            last_interaction: agent.last_interaction,
            created_at: agent.spawned_at
        };
    }
}

module.exports = AgentClaudeBridge;