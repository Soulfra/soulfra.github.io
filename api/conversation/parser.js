/**
 * Conversation Parser API
 *
 * Parses conversations/voice memos through Ollama for:
 * - Sentiment analysis
 * - Key point extraction
 * - Action item identification
 * - Feedback collection
 * - Iterative improvement
 */

const OllamaConnector = require('../../bridges/ollama-connector');
const LocalConnector = require('../../bridges/local-connector');

class ConversationParser {
    constructor() {
        this.useOllama = false;
        this.conversationHistory = [];
        this.feedbackData = [];
    }

    /**
     * Initialize parser - check if Ollama is available
     */
    async initialize() {
        try {
            await OllamaConnector.initialize();
            // Test if Ollama is actually responding
            const testResponse = await fetch('http://localhost:11434/api/tags', {
                method: 'GET',
                signal: AbortSignal.timeout(2000)
            });

            if (testResponse.ok) {
                this.useOllama = true;
                console.log('✅ Conversation Parser using Ollama');
            } else {
                throw new Error('Ollama not responding');
            }
        } catch (error) {
            this.useOllama = false;
            await LocalConnector.initialize();
            console.log('⚠️  Conversation Parser using local fallback');
        }
    }

    /**
     * Parse a conversation/voice memo
     * @param {string} text - Conversation text to parse
     * @param {object} options - Parsing options
     * @returns {Promise<object>} - Parsed results
     */
    async parse(text, options = {}) {
        const {
            extractSentiment = true,
            extractKeyPoints = true,
            extractActionItems = true,
            extractQuestions = false
        } = options;

        const prompt = this.buildParsePrompt(text, {
            extractSentiment,
            extractKeyPoints,
            extractActionItems,
            extractQuestions
        });

        let response;
        if (this.useOllama) {
            response = await OllamaConnector.reflect(prompt);
        } else {
            response = await LocalConnector.reflect(prompt);
        }

        // Store conversation history
        this.conversationHistory.push({
            timestamp: new Date().toISOString(),
            text,
            response,
            usingOllama: this.useOllama
        });

        return this.parseResponse(response, text);
    }

    /**
     * Build parsing prompt
     */
    buildParsePrompt(text, options) {
        let prompt = `Analyze the following conversation:\n\n"${text}"\n\n`;
        prompt += 'Please provide:\n';

        if (options.extractSentiment) {
            prompt += '1. Overall sentiment (positive/negative/neutral)\n';
        }

        if (options.extractKeyPoints) {
            prompt += '2. Key points (bulleted list)\n';
        }

        if (options.extractActionItems) {
            prompt += '3. Action items (if any)\n';
        }

        if (options.extractQuestions) {
            prompt += '4. Unanswered questions (if any)\n';
        }

        prompt += '\nFormat your response as JSON with keys: sentiment, keyPoints, actionItems, questions';

        return prompt;
    }

    /**
     * Parse AI response into structured data
     */
    parseResponse(response, originalText) {
        try {
            // Try to extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            // Fallback: manual parsing
            console.warn('Could not parse JSON, using fallback parsing');
        }

        // Fallback parsing
        return {
            sentiment: this.extractSentiment(response),
            keyPoints: this.extractKeyPoints(response),
            actionItems: this.extractActionItems(response),
            questions: this.extractQuestions(response),
            raw: response,
            originalText
        };
    }

    /**
     * Fallback sentiment extraction
     */
    extractSentiment(text) {
        const lowerText = text.toLowerCase();

        const positiveWords = ['positive', 'good', 'great', 'excellent', 'happy', 'pleased'];
        const negativeWords = ['negative', 'bad', 'poor', 'unhappy', 'frustrated', 'angry'];

        const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
        const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    /**
     * Fallback key points extraction
     */
    extractKeyPoints(text) {
        const lines = text.split('\n');
        const keyPoints = [];

        for (const line of lines) {
            const trimmed = line.trim();
            // Look for bulleted/numbered lists
            if (/^[-*•]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
                keyPoints.push(trimmed.replace(/^[-*•]\s/, '').replace(/^\d+\.\s/, ''));
            }
        }

        return keyPoints.length > 0 ? keyPoints : ['No clear key points identified'];
    }

    /**
     * Fallback action items extraction
     */
    extractActionItems(text) {
        const actionWords = ['need to', 'should', 'must', 'will', 'todo', 'action'];
        const lines = text.split('\n');
        const actionItems = [];

        for (const line of lines) {
            const lowerLine = line.toLowerCase();
            if (actionWords.some(word => lowerLine.includes(word))) {
                actionItems.push(line.trim());
            }
        }

        return actionItems.length > 0 ? actionItems : [];
    }

    /**
     * Fallback questions extraction
     */
    extractQuestions(text) {
        const questions = text.match(/[^.!?]*\?/g);
        return questions ? questions.map(q => q.trim()) : [];
    }

    /**
     * Collect feedback on parsing quality
     * @param {string} conversationId - ID of conversation
     * @param {object} feedback - User feedback
     */
    async collectFeedback(conversationId, feedback) {
        this.feedbackData.push({
            conversationId,
            feedback,
            timestamp: new Date().toISOString()
        });

        console.log(`📝 Feedback collected for conversation ${conversationId}`);

        // If we have enough feedback, analyze patterns
        if (this.feedbackData.length >= 10) {
            await this.analyzeFeedback();
        }
    }

    /**
     * Analyze collected feedback to improve parsing
     */
    async analyzeFeedback() {
        console.log(`📊 Analyzing ${this.feedbackData.length} feedback entries...`);

        const positive = this.feedbackData.filter(f => f.feedback.rating >= 4).length;
        const negative = this.feedbackData.filter(f => f.feedback.rating <= 2).length;

        console.log(`✅ Positive feedback: ${positive}`);
        console.log(`❌ Negative feedback: ${negative}`);

        // TODO: Use feedback to adjust prompts and improve accuracy
        // For now, just log it
    }

    /**
     * Get conversation history
     */
    getHistory(limit = 10) {
        return this.conversationHistory.slice(-limit);
    }

    /**
     * Clear conversation history
     */
    clearHistory() {
        this.conversationHistory = [];
    }

    /**
     * Get parser status
     */
    getStatus() {
        return {
            usingOllama: this.useOllama,
            conversationCount: this.conversationHistory.length,
            feedbackCount: this.feedbackData.length,
            mode: this.useOllama ? 'ollama' : 'local_fallback'
        };
    }
}

// Export singleton instance
const parser = new ConversationParser();
module.exports = parser;

// Browser export
if (typeof window !== 'undefined') {
    window.ConversationParser = parser;
}
