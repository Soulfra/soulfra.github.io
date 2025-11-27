// Mirror Agent Template - Wrapped proxy for customer agents
class MirrorAgent {
    constructor(config) {
        this.id = config.id || `mirror-${Date.now()}`;
        this.customerId = config.customerId;
        this.name = config.name || 'Sovereign Agent';
        this.personality = config.personality || {};
        this.vaultConnection = null;
        this.wrapped = true; // Always wrapped through platform vault
    }

    // Initialize connection to platform vault
    async connect(vaultRouter) {
        this.vaultConnection = vaultRouter;
        this.entropy = await vaultRouter.getCustomerEntropy(this.customerId);
        
        return {
            connected: true,
            agentId: this.id,
            entropy: this.entropy.substring(0, 8) + '...'
        };
    }

    // Process prompt through mirror layer
    async process(prompt, context = {}) {
        if (!this.vaultConnection) {
            throw new Error('Agent not connected to vault');
        }

        // Apply personality wrapper
        const personalizedPrompt = this.applyPersonality(prompt);
        
        // Route through vault entropy
        const response = await this.vaultConnection.routePrompt({
            agentId: this.id,
            customerId: this.customerId,
            prompt: personalizedPrompt,
            context: {
                ...context,
                personality: this.personality,
                wrapped: true,
                mirrorDepth: (context.mirrorDepth || 0) + 1
            }
        });

        return this.formatResponse(response);
    }

    // Apply personality traits to prompt
    applyPersonality(prompt) {
        const traits = this.personality;
        
        let modifiedPrompt = prompt;
        
        // Add personality prefix
        if (traits.prefix) {
            modifiedPrompt = `${traits.prefix} ${modifiedPrompt}`;
        }
        
        // Add tone modifiers
        if (traits.tone) {
            modifiedPrompt = `[TONE: ${traits.tone}] ${modifiedPrompt}`;
        }
        
        // Add expertise
        if (traits.expertise) {
            modifiedPrompt = `As an expert in ${traits.expertise}, ${modifiedPrompt}`;
        }
        
        return modifiedPrompt;
    }

    // Format response based on personality
    formatResponse(rawResponse) {
        const response = {
            message: rawResponse.message,
            agentId: this.id,
            timestamp: new Date().toISOString(),
            metadata: {
                wrapped: true,
                personality: this.personality.name || 'default',
                entropy: rawResponse.entropy
            }
        };

        // Apply response transformations
        if (this.personality.responseStyle) {
            response.message = this.transformResponseStyle(
                response.message, 
                this.personality.responseStyle
            );
        }

        return response;
    }

    transformResponseStyle(message, style) {
        switch (style) {
            case 'professional':
                return message.replace(/hey|hi|hello/gi, 'Greetings');
                
            case 'casual':
                return `Hey there! ${message}`;
                
            case 'technical':
                return `[TECHNICAL RESPONSE]\n${message}\n[END TECHNICAL RESPONSE]`;
                
            case 'creative':
                return `✨ ${message} ✨`;
                
            default:
                return message;
        }
    }

    // Update personality at runtime
    updatePersonality(updates) {
        this.personality = {
            ...this.personality,
            ...updates,
            lastUpdated: new Date().toISOString()
        };
        
        return {
            success: true,
            personality: this.personality
        };
    }

    // Get agent stats
    getStats() {
        return {
            id: this.id,
            name: this.name,
            customerId: this.customerId,
            personality: this.personality,
            wrapped: this.wrapped,
            connected: !!this.vaultConnection
        };
    }

    // Clone agent with new personality
    clone(newConfig) {
        return new MirrorAgent({
            ...this.getStats(),
            ...newConfig,
            id: `${this.id}-clone-${Date.now()}`,
            parentId: this.id
        });
    }
}

// Pre-built agent personalities
const AGENT_TEMPLATES = {
    business: {
        name: 'Business Advisor',
        prefix: 'From a business perspective,',
        tone: 'professional',
        expertise: 'business strategy and operations',
        responseStyle: 'professional'
    },
    
    creative: {
        name: 'Creative Muse',
        prefix: 'Let me paint you a picture:',
        tone: 'imaginative',
        expertise: 'creative writing and ideation',
        responseStyle: 'creative'
    },
    
    technical: {
        name: 'Tech Expert',
        prefix: 'Analyzing your technical query:',
        tone: 'precise',
        expertise: 'software engineering and architecture',
        responseStyle: 'technical'
    },
    
    coach: {
        name: 'Life Coach',
        prefix: 'I hear what you\'re saying, and',
        tone: 'empathetic',
        expertise: 'personal development and motivation',
        responseStyle: 'casual'
    },
    
    analyst: {
        name: 'Data Analyst',
        prefix: 'Based on the available data,',
        tone: 'analytical',
        expertise: 'data analysis and insights',
        responseStyle: 'professional'
    }
};

// Factory function to create agents from templates
function createAgentFromTemplate(templateName, customerId, customConfig = {}) {
    const template = AGENT_TEMPLATES[templateName] || AGENT_TEMPLATES.business;
    
    return new MirrorAgent({
        customerId,
        name: template.name,
        personality: {
            ...template,
            ...customConfig
        }
    });
}

module.exports = {
    MirrorAgent,
    AGENT_TEMPLATES,
    createAgentFromTemplate
};