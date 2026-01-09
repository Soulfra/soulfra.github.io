/**
 * Local Reflection Connector
 *
 * Fallback connector when Ollama is not available.
 * Provides pattern-based responses and simple reflection capabilities.
 */
class LocalConnector {
    constructor() {
        this.initialized = true;
        this.conversationHistory = [];
        this.patterns = this.loadPatterns();
        this.reflectionTemplates = {
            default: "Based on the query: '{prompt}', here is my reflection: ",
            analytical: "Analyzing the request: '{prompt}'. The key considerations are: ",
            creative: "Exploring the creative aspects of: '{prompt}'. A possible approach: ",
            technical: "Technical analysis of: '{prompt}'. Implementation details: "
        };
    }

    async initialize() {
        console.log('✅ Local connector initialized (fallback mode)');
        return true;
    }

    /**
     * Load response patterns for common queries
     */
    loadPatterns() {
        return [
            {
                patterns: [/^(hi|hello|hey)/i],
                responses: [
                    "Hello! I'm running in local fallback mode. Ollama is not available.",
                    "Hey there! Using basic pattern matching since Ollama isn't running."
                ]
            },
            {
                patterns: [/help/i],
                responses: [
                    "I can help with basic queries in fallback mode. For AI features, start Ollama.",
                ]
            },
            {
                patterns: [/status/i],
                responses: [
                    "🔴 Local fallback mode (Ollama not available)\n💡 Start Ollama with 'ollama serve'"
                ]
            }
        ];
    }

    async reflect(prompt, apiKey = null) {
        try {
            // Add to conversation history
            this.conversationHistory.push({
                role: 'user',
                content: prompt,
                timestamp: Date.now()
            });

            // Try pattern matching first
            for (const pattern of this.patterns) {
                for (const regex of pattern.patterns) {
                    if (regex.test(prompt)) {
                        const response = pattern.responses[
                            Math.floor(Math.random() * pattern.responses.length)
                        ];

                        this.conversationHistory.push({
                            role: 'assistant',
                            content: response,
                            timestamp: Date.now()
                        });

                        return response;
                    }
                }
            }

            // Simulate processing time
            await this.simulateDelay(100, 500);

            // Determine prompt type
            const promptType = this.analyzePromptType(prompt);

            // Generate reflection based on type
            const reflection = this.generateReflection(prompt, promptType);

            this.conversationHistory.push({
                role: 'assistant',
                content: reflection,
                timestamp: Date.now()
            });

            return reflection;
        } catch (error) {
            console.error('Local reflection error:', error);
            throw error;
        }
    }

    getHistory(limit = 10) {
        return this.conversationHistory.slice(-limit);
    }

    clearHistory() {
        this.conversationHistory = [];
    }

    analyzePromptType(prompt) {
        const lowerPrompt = prompt.toLowerCase();
        
        if (lowerPrompt.includes('code') || lowerPrompt.includes('implement') || lowerPrompt.includes('function')) {
            return 'technical';
        } else if (lowerPrompt.includes('create') || lowerPrompt.includes('design') || lowerPrompt.includes('imagine')) {
            return 'creative';
        } else if (lowerPrompt.includes('analyze') || lowerPrompt.includes('explain') || lowerPrompt.includes('why')) {
            return 'analytical';
        }
        
        return 'default';
    }

    generateReflection(prompt, type) {
        const template = this.reflectionTemplates[type];
        let reflection = template.replace('{prompt}', prompt);

        // Add type-specific content
        switch (type) {
            case 'technical':
                reflection += this.generateTechnicalContent(prompt);
                break;
            case 'creative':
                reflection += this.generateCreativeContent(prompt);
                break;
            case 'analytical':
                reflection += this.generateAnalyticalContent(prompt);
                break;
            default:
                reflection += this.generateDefaultContent(prompt);
        }

        return reflection;
    }

    generateTechnicalContent(prompt) {
        const keywords = this.extractKeywords(prompt);
        return `
1. Define clear interfaces and data structures
2. Implement core functionality with error handling
3. Add appropriate logging and monitoring
4. Write comprehensive tests
5. Document the implementation

Key technical considerations for ${keywords.join(', ')}:
- Performance optimization strategies
- Security best practices
- Scalability considerations
- Maintenance and debugging approaches`;
    }

    generateCreativeContent(prompt) {
        const keywords = this.extractKeywords(prompt);
        return `
Exploring creative dimensions:
- Visual metaphors and representations
- Narrative structures and storytelling
- User experience innovations
- Cross-domain inspiration sources

Creative synthesis for ${keywords.join(', ')}:
The intersection of technology and artistry opens new possibilities for expression and interaction.`;
    }

    generateAnalyticalContent(prompt) {
        const keywords = this.extractKeywords(prompt);
        return `
Analytical framework:
1. Problem decomposition and root cause analysis
2. Pattern recognition and trend identification
3. Comparative analysis with existing solutions
4. Risk assessment and mitigation strategies

Critical factors for ${keywords.join(', ')}:
- Underlying assumptions and constraints
- Stakeholder impacts and dependencies
- Success metrics and evaluation criteria`;
    }

    generateDefaultContent(prompt) {
        const keywords = this.extractKeywords(prompt);
        return `
Considering the context of ${keywords.join(', ')}:
- Primary objectives and goals
- Available resources and constraints
- Potential approaches and alternatives
- Expected outcomes and impacts

This reflection provides a foundation for further exploration and implementation.`;
    }

    extractKeywords(prompt) {
        // Simple keyword extraction
        const words = prompt.toLowerCase().split(/\s+/);
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how']);
        
        return words
            .filter(word => word.length > 3 && !stopWords.has(word))
            .slice(0, 5);
    }

    async simulateDelay(min, max) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }
}

module.exports = new LocalConnector();