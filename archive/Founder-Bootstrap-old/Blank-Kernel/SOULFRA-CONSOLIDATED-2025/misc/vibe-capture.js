// Vibe Capture - Voice/emotion-based review system with vault logging
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class VibeCapture {
    constructor() {
        this.vibeMemoryPath = path.join(__dirname, 'vault/memory/vibe-logs.json');
        this.calMemoryPath = path.join(__dirname, 'vault/memory/cal-location-memory.json');
        this.vaultLogsPath = path.join(__dirname, 'vault-sync-core/logs');
        
        this.emotionTags = [
            'joy', 'excitement', 'contentment', 'peace', 'love',
            'anger', 'frustration', 'sadness', 'anxiety', 'fear',
            'surprise', 'curiosity', 'hope', 'gratitude', 'nostalgia',
            'neutral', 'mixed', 'complex'
        ];
        
        this.sentimentAnalyzer = new SimpleSentimentAnalyzer();
        
        this.init();
    }

    async init() {
        console.log('🎵 Initializing Vibe Capture...');
        
        await this.ensureDirectories();
        await this.loadVibeMemory();
        await this.loadCalMemory();
        
        console.log('✅ Vibe Capture ready');
    }

    async ensureDirectories() {
        const dirs = [
            path.dirname(this.vibeMemoryPath),
            path.dirname(this.calMemoryPath),
            this.vaultLogsPath
        ];

        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    async loadVibeMemory() {
        try {
            const vibeContent = await fs.readFile(this.vibeMemoryPath, 'utf8');
            this.vibeMemory = JSON.parse(vibeContent);
        } catch {
            this.vibeMemory = {
                reviews: [],
                totalReviews: 0,
                locations: {},
                created: new Date().toISOString()
            };
            await this.saveVibeMemory();
        }
    }

    async loadCalMemory() {
        try {
            const calContent = await fs.readFile(this.calMemoryPath, 'utf8');
            this.calMemory = JSON.parse(calContent);
        } catch {
            this.calMemory = {
                locations: {},
                preferences: {},
                patterns: {},
                created: new Date().toISOString()
            };
            await this.saveCalMemory();
        }
    }

    async saveVibeMemory() {
        await fs.writeFile(this.vibeMemoryPath, JSON.stringify(this.vibeMemory, null, 2));
    }

    async saveCalMemory() {
        await fs.writeFile(this.calMemoryPath, JSON.stringify(this.calMemory, null, 2));
    }

    async captureVibe(review) {
        console.log(`📝 Capturing vibe for: ${review.location}`);
        
        const reviewId = `vibe-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        
        // Analyze sentiment and emotion
        const analysis = await this.analyzeReview(review);
        
        // Create vibe record
        const vibeRecord = {
            id: reviewId,
            location: review.location,
            rating: review.rating,
            text: review.text,
            voice: review.voice || null,
            emotion: analysis.emotion,
            sentiment: analysis.sentiment,
            keywords: analysis.keywords,
            timestamp: new Date().toISOString(),
            coordinates: review.coordinates || null,
            userId: review.userId || 'anonymous',
            weatherContext: review.weather || null,
            timeContext: this.getTimeContext()
        };
        
        // Add to vibe memory
        this.vibeMemory.reviews.push(vibeRecord);
        this.vibeMemory.totalReviews++;
        
        // Update location summary
        await this.updateLocationSummary(vibeRecord);
        
        // Update Cal's memory
        await this.updateCalMemory(vibeRecord);
        
        // Save data
        await this.saveVibeMemory();
        await this.saveCalMemory();
        
        // Log to vault
        await this.logToVault('vibe', 'review_captured', {
            reviewId: reviewId,
            location: review.location,
            rating: review.rating,
            emotion: analysis.emotion,
            sentiment: analysis.sentiment.label
        });
        
        console.log(`✅ Vibe captured: ${reviewId}`);
        
        return {
            reviewId: reviewId,
            analysis: analysis,
            calResponse: await this.generateCalResponse(vibeRecord),
            locationSummary: this.vibeMemory.locations[review.location]
        };
    }

    async analyzeReview(review) {
        console.log('🧠 Analyzing review sentiment and emotion...');
        
        const text = review.text || '';
        
        // Sentiment analysis
        const sentiment = this.sentimentAnalyzer.analyze(text);
        
        // Emotion detection
        const emotion = this.detectEmotion(text, review.rating);
        
        // Keyword extraction
        const keywords = this.extractKeywords(text);
        
        // Voice analysis (if available)
        let voiceAnalysis = null;
        if (review.voice) {
            voiceAnalysis = await this.analyzeVoice(review.voice);
        }
        
        return {
            sentiment: sentiment,
            emotion: emotion,
            keywords: keywords,
            voice: voiceAnalysis,
            confidence: this.calculateConfidence(sentiment, emotion, review.rating)
        };
    }

    detectEmotion(text, rating) {
        const emotionKeywords = {
            joy: ['happy', 'amazing', 'wonderful', 'fantastic', 'love', 'perfect'],
            excitement: ['excited', 'thrilled', 'incredible', 'awesome', 'wow'],
            contentment: ['satisfied', 'pleased', 'comfortable', 'nice', 'good'],
            peace: ['calm', 'relaxing', 'peaceful', 'serene', 'tranquil'],
            anger: ['angry', 'terrible', 'awful', 'horrible', 'hate', 'worst'],
            frustration: ['frustrated', 'annoying', 'disappointing', 'slow', 'bad'],
            sadness: ['sad', 'depressing', 'lonely', 'empty', 'gloomy'],
            anxiety: ['anxious', 'nervous', 'worried', 'stressful', 'overwhelming'],
            surprise: ['surprised', 'unexpected', 'shocking', 'unbelievable'],
            curiosity: ['interesting', 'intriguing', 'wondering', 'curious'],
            gratitude: ['grateful', 'thankful', 'appreciate', 'blessed'],
            nostalgia: ['reminds', 'memories', 'nostalgic', 'childhood', 'past']
        };
        
        const textLower = text.toLowerCase();
        const emotionScores = {};
        
        // Score emotions based on keywords
        for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
            emotionScores[emotion] = keywords.reduce((score, keyword) => {
                return score + (textLower.includes(keyword) ? 1 : 0);
            }, 0);
        }
        
        // Factor in rating
        if (rating >= 4) {
            emotionScores.joy += 2;
            emotionScores.contentment += 1;
        } else if (rating <= 2) {
            emotionScores.frustration += 2;
            emotionScores.sadness += 1;
        }
        
        // Find dominant emotion
        const dominantEmotion = Object.entries(emotionScores)
            .reduce((a, b) => emotionScores[a[0]] > emotionScores[b[0]] ? a : b)[0];
        
        return dominantEmotion || 'neutral';
    }

    extractKeywords(text) {
        // Simple keyword extraction
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
        
        return text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.includes(word))
            .slice(0, 10); // Top 10 keywords
    }

    async analyzeVoice(voiceData) {
        // Simulate voice analysis
        // In production, this would use speech-to-text and emotion detection APIs
        
        const emotions = ['calm', 'excited', 'frustrated', 'happy', 'sad', 'neutral'];
        const tones = ['confident', 'hesitant', 'enthusiastic', 'monotone', 'expressive'];
        
        return {
            duration: voiceData.duration || Math.random() * 60, // seconds
            emotion: emotions[Math.floor(Math.random() * emotions.length)],
            tone: tones[Math.floor(Math.random() * tones.length)],
            energy: Math.random(), // 0-1
            clarity: 0.7 + Math.random() * 0.3, // 0.7-1.0
            transcription: 'Voice transcription would appear here...'
        };
    }

    calculateConfidence(sentiment, emotion, rating) {
        let confidence = 0.5;
        
        // Higher confidence if sentiment aligns with rating
        if ((sentiment.label === 'positive' && rating >= 4) ||
            (sentiment.label === 'negative' && rating <= 2)) {
            confidence += 0.3;
        }
        
        // Higher confidence if emotion aligns with sentiment
        const positiveEmotions = ['joy', 'excitement', 'contentment', 'peace', 'gratitude'];
        const negativeEmotions = ['anger', 'frustration', 'sadness', 'anxiety'];
        
        if ((sentiment.label === 'positive' && positiveEmotions.includes(emotion)) ||
            (sentiment.label === 'negative' && negativeEmotions.includes(emotion))) {
            confidence += 0.2;
        }
        
        return Math.min(confidence, 1.0);
    }

    async updateLocationSummary(vibeRecord) {
        const location = vibeRecord.location;
        
        if (!this.vibeMemory.locations[location]) {
            this.vibeMemory.locations[location] = {
                totalReviews: 0,
                averageRating: 0,
                emotions: {},
                keywords: {},
                firstReview: vibeRecord.timestamp,
                lastReview: null
            };
        }
        
        const locationData = this.vibeMemory.locations[location];
        
        // Update counts and averages
        const totalRating = locationData.averageRating * locationData.totalReviews;
        locationData.totalReviews++;
        locationData.averageRating = (totalRating + vibeRecord.rating) / locationData.totalReviews;
        locationData.lastReview = vibeRecord.timestamp;
        
        // Update emotion counts
        locationData.emotions[vibeRecord.emotion] = (locationData.emotions[vibeRecord.emotion] || 0) + 1;
        
        // Update keyword counts
        vibeRecord.keywords.forEach(keyword => {
            locationData.keywords[keyword] = (locationData.keywords[keyword] || 0) + 1;
        });
    }

    async updateCalMemory(vibeRecord) {
        const location = vibeRecord.location;
        
        if (!this.calMemory.locations[location]) {
            this.calMemory.locations[location] = {
                visits: 0,
                totalRating: 0,
                averageRating: 0,
                emotionalProfile: {},
                memories: [],
                preferences: {},
                lastVisit: null
            };
        }
        
        const calLocation = this.calMemory.locations[location];
        
        // Update visit data
        calLocation.visits++;
        calLocation.totalRating += vibeRecord.rating;
        calLocation.averageRating = calLocation.totalRating / calLocation.visits;
        calLocation.lastVisit = vibeRecord.timestamp;
        
        // Update emotional profile
        calLocation.emotionalProfile[vibeRecord.emotion] = 
            (calLocation.emotionalProfile[vibeRecord.emotion] || 0) + 1;
        
        // Add memory
        calLocation.memories.push({
            text: vibeRecord.text.substring(0, 100),
            emotion: vibeRecord.emotion,
            rating: vibeRecord.rating,
            timestamp: vibeRecord.timestamp
        });
        
        // Keep only last 10 memories per location
        if (calLocation.memories.length > 10) {
            calLocation.memories = calLocation.memories.slice(-10);
        }
        
        // Update preferences
        this.updateCalPreferences(vibeRecord);
    }

    updateCalPreferences(vibeRecord) {
        // Analyze patterns for Cal's preferences
        if (vibeRecord.rating >= 4) {
            vibeRecord.keywords.forEach(keyword => {
                this.calMemory.preferences[keyword] = (this.calMemory.preferences[keyword] || 0) + 1;
            });
        }
    }

    async generateCalResponse(vibeRecord) {
        const location = vibeRecord.location;
        const calLocation = this.calMemory.locations[location];
        
        const responses = {
            high_rating: [
                `I'm glad you enjoyed ${location}! Your ${vibeRecord.emotion} really comes through.`,
                `${location} seems to be a special place for you. I can sense the positive energy.`,
                `That's wonderful! I'll remember that ${location} brings you ${vibeRecord.emotion}.`
            ],
            medium_rating: [
                `Thanks for sharing your experience at ${location}. I can sense the mixed feelings.`,
                `${location} seems to have both good and challenging aspects for you.`,
                `I appreciate your honest assessment of ${location}.`
            ],
            low_rating: [
                `I understand ${location} wasn't a great experience. Your ${vibeRecord.emotion} is valid.`,
                `Thank you for the honest feedback about ${location}. I'll note this for future reference.`,
                `I can sense your disappointment with ${location}. That's valuable information.`
            ]
        };
        
        let responseCategory;
        if (vibeRecord.rating >= 4) responseCategory = 'high_rating';
        else if (vibeRecord.rating >= 3) responseCategory = 'medium_rating';
        else responseCategory = 'low_rating';
        
        const baseResponse = responses[responseCategory][
            Math.floor(Math.random() * responses[responseCategory].length)
        ];
        
        // Add context if this isn't the first visit
        if (calLocation && calLocation.visits > 1) {
            return baseResponse + ` This is your ${calLocation.visits}${this.getOrdinalSuffix(calLocation.visits)} review of this place.`;
        }
        
        return baseResponse;
    }

    getOrdinalSuffix(n) {
        const suffixes = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
    }

    getTimeContext() {
        const now = new Date();
        const hour = now.getHours();
        
        if (hour < 6) return 'late_night';
        if (hour < 12) return 'morning';
        if (hour < 17) return 'afternoon';
        if (hour < 21) return 'evening';
        return 'night';
    }

    async getLocationVibes(location) {
        return this.vibeMemory.locations[location] || null;
    }

    async getLocationsByEmotion(emotion) {
        const locations = [];
        
        for (const [location, data] of Object.entries(this.vibeMemory.locations)) {
            if (data.emotions[emotion] && data.emotions[emotion] > 0) {
                locations.push({
                    location: location,
                    emotionCount: data.emotions[emotion],
                    totalReviews: data.totalReviews,
                    averageRating: data.averageRating
                });
            }
        }
        
        return locations.sort((a, b) => b.emotionCount - a.emotionCount);
    }

    async getTopLocations(limit = 10) {
        return Object.entries(this.vibeMemory.locations)
            .map(([location, data]) => ({ location, ...data }))
            .sort((a, b) => b.averageRating - a.averageRating)
            .slice(0, limit);
    }

    async getRecentReviews(limit = 20) {
        return this.vibeMemory.reviews.slice(-limit).reverse();
    }

    async logToVault(module, action, data) {
        const logPath = path.join(this.vaultLogsPath, 'vibe-activity.log');
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            module: module,
            action: action,
            data: data
        };

        await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n');
    }

    async getStats() {
        const emotionDistribution = {};
        this.vibeMemory.reviews.forEach(review => {
            emotionDistribution[review.emotion] = (emotionDistribution[review.emotion] || 0) + 1;
        });
        
        return {
            totalReviews: this.vibeMemory.totalReviews,
            totalLocations: Object.keys(this.vibeMemory.locations).length,
            averageRating: this.vibeMemory.reviews.length > 0 ? 
                this.vibeMemory.reviews.reduce((sum, r) => sum + r.rating, 0) / this.vibeMemory.reviews.length : 0,
            emotionDistribution: emotionDistribution,
            calMemoryLocations: Object.keys(this.calMemory.locations).length,
            topEmotions: Object.entries(emotionDistribution)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
        };
    }
}

// Simple sentiment analyzer
class SimpleSentimentAnalyzer {
    constructor() {
        this.positiveWords = [
            'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like',
            'beautiful', 'perfect', 'awesome', 'incredible', 'outstanding', 'brilliant'
        ];
        
        this.negativeWords = [
            'bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'worst', 'disgusting',
            'disappointing', 'annoying', 'frustrating', 'slow', 'rude', 'dirty'
        ];
    }

    analyze(text) {
        const words = text.toLowerCase().split(/\W+/);
        
        let positiveScore = 0;
        let negativeScore = 0;
        
        words.forEach(word => {
            if (this.positiveWords.includes(word)) positiveScore++;
            if (this.negativeWords.includes(word)) negativeScore++;
        });
        
        const totalScore = positiveScore - negativeScore;
        let label;
        
        if (totalScore > 0) label = 'positive';
        else if (totalScore < 0) label = 'negative';
        else label = 'neutral';
        
        return {
            label: label,
            score: totalScore,
            confidence: Math.min(Math.abs(totalScore) / Math.max(words.length, 1), 1),
            positive: positiveScore,
            negative: negativeScore
        };
    }
}

module.exports = VibeCapture;

// Example usage
if (require.main === module) {
    const vibeCapture = new VibeCapture();
    
    setTimeout(async () => {
        console.log('\n🧪 Testing Vibe Capture...');
        
        const testReview = {
            location: 'Downtown Coffee Shop',
            rating: 4,
            text: 'Amazing coffee and great atmosphere! I love the peaceful vibe here.',
            coordinates: { lat: 37.7749, lng: -122.4194 },
            userId: 'test-user'
        };
        
        const result = await vibeCapture.captureVibe(testReview);
        console.log('\n📊 Capture Result:', result);
        
        const stats = await vibeCapture.getStats();
        console.log('\n📈 Vibe Stats:', stats);
    }, 1000);
}