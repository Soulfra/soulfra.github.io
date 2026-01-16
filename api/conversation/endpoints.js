/**
 * Conversation API Endpoints
 *
 * REST-style endpoints for conversation parsing and feedback
 * Can be used client-side or with a serverless backend
 */

const ConversationParser = require('./parser');

class ConversationAPI {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize API
     */
    async initialize() {
        await ConversationParser.initialize();
        this.initialized = true;
        return { status: 'ready', mode: ConversationParser.getStatus().mode };
    }

    /**
     * POST /api/conversation/parse
     * Parse a conversation/voice memo
     *
     * Body: {
     *   text: string,
     *   options: {
     *     extractSentiment: boolean,
     *     extractKeyPoints: boolean,
     *     extractActionItems: boolean,
     *     extractQuestions: boolean
     *   }
     * }
     *
     * Returns: {
     *   conversationId: string,
     *   sentiment: string,
     *   keyPoints: string[],
     *   actionItems: string[],
     *   questions: string[],
     *   timestamp: string
     * }
     */
    async parse(body) {
        if (!this.initialized) {
            await this.initialize();
        }

        const { text, options = {} } = body;

        if (!text || text.trim().length === 0) {
            return {
                error: 'Text is required',
                status: 400
            };
        }

        try {
            const result = await ConversationParser.parse(text, options);

            const conversationId = this.generateId();

            return {
                status: 200,
                data: {
                    conversationId,
                    ...result,
                    timestamp: new Date().toISOString(),
                    mode: ConversationParser.getStatus().mode
                }
            };
        } catch (error) {
            return {
                error: error.message,
                status: 500
            };
        }
    }

    /**
     * POST /api/conversation/feedback
     * Submit feedback on parsing quality
     *
     * Body: {
     *   conversationId: string,
     *   rating: number (1-5),
     *   comment: string,
     *   corrections: object
     * }
     *
     * Returns: {
     *   success: boolean,
     *   feedbackId: string
     * }
     */
    async feedback(body) {
        const { conversationId, rating, comment, corrections } = body;

        if (!conversationId) {
            return {
                error: 'conversationId is required',
                status: 400
            };
        }

        if (!rating || rating < 1 || rating > 5) {
            return {
                error: 'rating must be between 1 and 5',
                status: 400
            };
        }

        try {
            await ConversationParser.collectFeedback(conversationId, {
                rating,
                comment,
                corrections
            });

            return {
                status: 200,
                data: {
                    success: true,
                    feedbackId: this.generateId(),
                    message: 'Feedback recorded successfully'
                }
            };
        } catch (error) {
            return {
                error: error.message,
                status: 500
            };
        }
    }

    /**
     * GET /api/conversation/status
     * Get parser status
     *
     * Returns: {
     *   usingOllama: boolean,
     *   mode: string,
     *   conversationCount: number,
     *   feedbackCount: number
     * }
     */
    async status() {
        if (!this.initialized) {
            await this.initialize();
        }

        return {
            status: 200,
            data: ConversationParser.getStatus()
        };
    }

    /**
     * GET /api/conversation/history?limit=10
     * Get conversation history
     *
     * Returns: {
     *   conversations: object[]
     * }
     */
    async history(params = {}) {
        const limit = parseInt(params.limit) || 10;

        return {
            status: 200,
            data: {
                conversations: ConversationParser.getHistory(limit)
            }
        };
    }

    /**
     * POST /api/conversation/clear
     * Clear conversation history
     *
     * Returns: {
     *   success: boolean
     * }
     */
    async clear() {
        ConversationParser.clearHistory();

        return {
            status: 200,
            data: {
                success: true,
                message: 'Conversation history cleared'
            }
        };
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Handle generic API request
     * @param {string} method - HTTP method (GET, POST)
     * @param {string} endpoint - Endpoint path
     * @param {object} body - Request body (for POST)
     * @param {object} params - URL params (for GET)
     */
    async handleRequest(method, endpoint, body = {}, params = {}) {
        // Route to appropriate handler
        if (method === 'POST' && endpoint === '/api/conversation/parse') {
            return await this.parse(body);
        }

        if (method === 'POST' && endpoint === '/api/conversation/feedback') {
            return await this.feedback(body);
        }

        if (method === 'GET' && endpoint === '/api/conversation/status') {
            return await this.status();
        }

        if (method === 'GET' && endpoint === '/api/conversation/history') {
            return await this.history(params);
        }

        if (method === 'POST' && endpoint === '/api/conversation/clear') {
            return await this.clear();
        }

        return {
            error: 'Endpoint not found',
            status: 404
        };
    }
}

// Export singleton
const api = new ConversationAPI();
module.exports = api;

// Browser export
if (typeof window !== 'undefined') {
    window.ConversationAPI = api;
}
