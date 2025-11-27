const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

class VibeGraphServer {
  constructor(config, vaultLogger) {
    this.config = config;
    this.vaultLogger = vaultLogger;
    this.app = express();
    this.reviews = new Map();
    this.emotions = config.emotions || ['happy', 'sad', 'excited', 'calm', 'frustrated', 'satisfied'];
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Audio upload handling
    const storage = multer.memoryStorage();
    this.upload = multer({ 
      storage, 
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm'];
        cb(null, allowedMimes.includes(file.mimetype));
      }
    });
  }

  setupRoutes() {
    // Review management
    this.app.post('/api/reviews', this.createReview.bind(this));
    this.app.get('/api/reviews', this.listReviews.bind(this));
    this.app.get('/api/reviews/:id', this.getReview.bind(this));
    this.app.post('/api/reviews/:id/vote', this.voteOnReview.bind(this));

    // Voice analysis
    this.app.post('/api/voice/analyze', this.upload.single('audio'), this.analyzeVoice.bind(this));
    this.app.post('/api/voice/transcribe', this.upload.single('audio'), this.transcribeVoice.bind(this));

    // Emotion analysis
    this.app.post('/api/emotions/analyze', this.analyzeEmotion.bind(this));
    this.app.get('/api/emotions/categories', this.getEmotionCategories.bind(this));

    // Analytics
    this.app.get('/api/analytics/sentiment', this.getSentimentAnalytics.bind(this));
    this.app.get('/api/analytics/agent/:agentId', this.getAgentAnalytics.bind(this));

    // Vibe visualization
    this.app.get('/api/vibes/graph/:agentId', this.getVibeGraph.bind(this));
    this.app.get('/api/vibes/trending', this.getTrendingVibes.bind(this));

    // Emotional Memory Integration Routes
    this.app.get('/api/emotional/status', async (req, res) => {
        try {
            const response = await fetch('http://localhost:3666/api/system/health');
            const data = await response.json();
            res.json(data);
        } catch (error) {
            res.status(503).json({ error: 'Semantic API unavailable' });
        }
    });

    this.app.get('/api/emotional/agents', async (req, res) => {
        try {
            const response = await fetch('http://localhost:3666/api/agents/list');
            const data = await response.json();
            res.json(data);
        } catch (error) {
            res.status(503).json({ error: 'Agent data unavailable' });
        }
    });

    this.app.get('/api/emotional/timeline', async (req, res) => {
        try {
            const { timeRange = '24h' } = req.query;
            const response = await fetch(`http://localhost:3666/api/emotions/timeline?timeRange=${timeRange}`);
            const data = await response.json();
            res.json(data);
        } catch (error) {
            res.status(503).json({ error: 'Timeline data unavailable' });
        }
    });

    this.app.get('/api/emotional/integrity', async (req, res) => {
        try {
            const response = await fetch('http://localhost:3666/api/system/integrity');
            const data = await response.json();
            res.json(data);
        } catch (error) {
            res.status(503).json({ error: 'Integrity data unavailable' });
        }
    });

    // Emotional Memory Analytics
    this.app.get('/api/emotional/analytics', async (req, res) => {
        try {
            const [healthRes, driftRes, echoRes] = await Promise.all([
                fetch('http://localhost:3666/api/system/health'),
                fetch('http://localhost:3666/api/system/drift'),
                fetch('http://localhost:3666/api/traces/echoes')
            ]);
            
            const analytics = {
                health: healthRes.ok ? await healthRes.json() : null,
                drift: driftRes.ok ? await driftRes.json() : null,
                echoes: echoRes.ok ? await echoRes.json() : null,
                timestamp: new Date().toISOString()
            };
            
            res.json(analytics);
        } catch (error) {
            res.status(503).json({ error: 'Analytics unavailable' });
        }
    });

    console.log('🧠 Emotional memory routes added to VibeGraph server');
  }

  async createReview(req, res) {
    try {
      const reviewData = {
        id: uuidv4(),
        agentId: req.body.agentId,
        userId: req.body.userId || `user-${uuidv4()}`,
        rating: parseInt(req.body.rating),
        textReview: req.body.textReview || '',
        voiceReview: req.body.voiceReview || null, // Base64 audio data
        emotions: req.body.emotions || [],
        sentiment: null,
        voiceAnalysis: null,
        metadata: {
          timestamp: new Date().toISOString(),
          source: req.body.source || 'web',
          sessionId: req.body.sessionId
        }
      };

      // Validate required fields
      if (!reviewData.agentId || !reviewData.rating) {
        return res.status(400).json({ error: 'Agent ID and rating are required' });
      }

      if (reviewData.rating < 1 || reviewData.rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      // Analyze text sentiment
      if (reviewData.textReview) {
        reviewData.sentiment = await this.analyzeSentiment(reviewData.textReview);
      }

      // Analyze voice if provided
      if (reviewData.voiceReview) {
        reviewData.voiceAnalysis = await this.analyzeVoiceData(reviewData.voiceReview);
        if (reviewData.voiceAnalysis.transcription) {
          reviewData.sentiment = await this.analyzeSentiment(reviewData.voiceAnalysis.transcription);
        }
      }

      // Store review
      this.reviews.set(reviewData.id, reviewData);
      await this.vaultLogger.saveReview(reviewData);

      // Update agent analytics
      await this.updateAgentAnalytics(reviewData.agentId, reviewData);

      res.json({
        success: true,
        review: reviewData
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async listReviews(req, res) {
    try {
      const { agentId, userId, sentiment, rating, limit = 50 } = req.query;
      let reviews = Array.from(this.reviews.values());

      // Apply filters
      if (agentId) {
        reviews = reviews.filter(review => review.agentId === agentId);
      }

      if (userId) {
        reviews = reviews.filter(review => review.userId === userId);
      }

      if (sentiment) {
        reviews = reviews.filter(review => 
          review.sentiment && review.sentiment.label === sentiment
        );
      }

      if (rating) {
        reviews = reviews.filter(review => review.rating === parseInt(rating));
      }

      // Sort by timestamp (newest first)
      reviews.sort((a, b) => new Date(b.metadata.timestamp) - new Date(a.metadata.timestamp));

      // Limit results
      reviews = reviews.slice(0, parseInt(limit));

      res.json({
        reviews,
        total: reviews.length
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getReview(req, res) {
    try {
      const review = this.reviews.get(req.params.id);
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      res.json({ review });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async voteOnReview(req, res) {
    try {
      const review = this.reviews.get(req.params.id);
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      const { vote, userId } = req.body; // vote: 'helpful' | 'not_helpful'
      
      if (!review.votes) {
        review.votes = { helpful: 0, not_helpful: 0, voters: [] };
      }

      // Check if user already voted
      const existingVote = review.votes.voters.find(v => v.userId === userId);
      if (existingVote) {
        return res.status(400).json({ error: 'User already voted on this review' });
      }

      // Add vote
      review.votes[vote]++;
      review.votes.voters.push({ userId, vote, timestamp: new Date().toISOString() });

      await this.vaultLogger.log('vibegraph', 'review_voted', {
        reviewId: review.id,
        userId,
        vote
      });

      res.json({
        success: true,
        votes: review.votes
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async analyzeVoice(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Audio file required' });
      }

      const analysis = await this.analyzeVoiceBuffer(req.file.buffer);
      
      res.json({
        success: true,
        analysis
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async transcribeVoice(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Audio file required' });
      }

      const transcription = await this.transcribeAudio(req.file.buffer);
      
      res.json({
        success: true,
        transcription
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async analyzeEmotion(req, res) {
    try {
      const { text, voiceData } = req.body;
      
      if (!text && !voiceData) {
        return res.status(400).json({ error: 'Text or voice data required' });
      }

      let emotions = [];

      if (text) {
        emotions = await this.analyzeTextEmotions(text);
      }

      if (voiceData) {
        const voiceEmotions = await this.analyzeVoiceEmotions(voiceData);
        emotions = emotions.concat(voiceEmotions);
      }

      res.json({
        success: true,
        emotions: this.consolidateEmotions(emotions)
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEmotionCategories(req, res) {
    res.json({
      emotions: this.emotions,
      sentiments: ['positive', 'negative', 'neutral'],
      categories: ['helpful', 'creative', 'efficient', 'friendly']
    });
  }

  async getSentimentAnalytics(req, res) {
    try {
      const { agentId, timeRange = '7d' } = req.query;
      
      let reviews = Array.from(this.reviews.values());
      
      if (agentId) {
        reviews = reviews.filter(review => review.agentId === agentId);
      }

      // Filter by time range
      const cutoffDate = this.getTimeRangeCutoff(timeRange);
      reviews = reviews.filter(review => 
        new Date(review.metadata.timestamp) >= cutoffDate
      );

      const analytics = this.calculateSentimentAnalytics(reviews);

      res.json({
        success: true,
        analytics,
        timeRange,
        totalReviews: reviews.length
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAgentAnalytics(req, res) {
    try {
      const agentId = req.params.agentId;
      const reviews = Array.from(this.reviews.values())
        .filter(review => review.agentId === agentId);

      if (reviews.length === 0) {
        return res.json({
          agentId,
          analytics: {
            totalReviews: 0,
            averageRating: 0,
            sentimentBreakdown: {},
            emotionBreakdown: {},
            trendingVibes: []
          }
        });
      }

      const analytics = {
        totalReviews: reviews.length,
        averageRating: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
        sentimentBreakdown: this.calculateSentimentBreakdown(reviews),
        emotionBreakdown: this.calculateEmotionBreakdown(reviews),
        ratingDistribution: this.calculateRatingDistribution(reviews),
        trendingVibes: this.calculateTrendingVibes(reviews),
        recentReviews: reviews.slice(0, 5)
      };

      res.json({
        agentId,
        analytics
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getVibeGraph(req, res) {
    try {
      const agentId = req.params.agentId;
      const { timeRange = '30d' } = req.query;

      const reviews = Array.from(this.reviews.values())
        .filter(review => review.agentId === agentId);

      const cutoffDate = this.getTimeRangeCutoff(timeRange);
      const filteredReviews = reviews.filter(review => 
        new Date(review.metadata.timestamp) >= cutoffDate
      );

      const vibeGraph = this.generateVibeGraph(filteredReviews, timeRange);

      res.json({
        success: true,
        agentId,
        timeRange,
        vibeGraph
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTrendingVibes(req, res) {
    try {
      const { limit = 10 } = req.query;
      const reviews = Array.from(this.reviews.values());
      
      // Get reviews from last 7 days
      const cutoffDate = this.getTimeRangeCutoff('7d');
      const recentReviews = reviews.filter(review => 
        new Date(review.metadata.timestamp) >= cutoffDate
      );

      const trending = this.calculateTrendingVibes(recentReviews);

      res.json({
        success: true,
        trending: trending.slice(0, parseInt(limit))
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Analysis methods
  async analyzeSentiment(text) {
    // Simple sentiment analysis - in production, use a proper NLP service
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'awesome', 'fantastic', 'wonderful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'horrible', 'disappointing', 'frustrating'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveScore++;
      if (negativeWords.includes(word)) negativeScore++;
    });

    const totalScore = positiveScore - negativeScore;
    let label = 'neutral';
    let confidence = 0.5;

    if (totalScore > 0) {
      label = 'positive';
      confidence = Math.min(0.9, 0.5 + (totalScore * 0.1));
    } else if (totalScore < 0) {
      label = 'negative';
      confidence = Math.min(0.9, 0.5 + (Math.abs(totalScore) * 0.1));
    }

    return {
      label,
      confidence,
      score: totalScore
    };
  }

  async analyzeVoiceData(base64Audio) {
    // Simulate voice analysis - in production, use speech-to-text and emotion recognition
    return {
      transcription: 'This is a simulated transcription of the voice review.',
      emotions: ['calm', 'satisfied'],
      pitch: Math.random() * 100 + 100, // Hz
      volume: Math.random() * 100, // dB
      pace: Math.random() * 200 + 100, // words per minute
      tone: ['friendly', 'professional'][Math.floor(Math.random() * 2)]
    };
  }

  async analyzeVoiceBuffer(buffer) {
    // Simulate advanced voice analysis
    return {
      duration: buffer.length / 16000, // Assume 16kHz sample rate
      emotions: this.detectEmotions(),
      pitch: Math.random() * 100 + 100,
      volume: Math.random() * 100,
      clarity: Math.random() * 0.5 + 0.5,
      sentiment: Math.random() > 0.5 ? 'positive' : 'negative'
    };
  }

  async transcribeAudio(buffer) {
    // Simulate transcription - in production, use Google Speech-to-Text or similar
    const sampleTranscriptions = [
      "This agent was really helpful and answered all my questions.",
      "I found the response a bit slow but overall satisfied.",
      "Excellent experience, would definitely recommend.",
      "Could use some improvement in understanding context.",
      "Perfect for my needs, very efficient and friendly."
    ];

    return {
      text: sampleTranscriptions[Math.floor(Math.random() * sampleTranscriptions.length)],
      confidence: Math.random() * 0.3 + 0.7,
      duration: buffer.length / 16000
    };
  }

  async analyzeTextEmotions(text) {
    // Simple emotion detection based on keywords
    const emotionKeywords = {
      happy: ['happy', 'joy', 'excited', 'pleased', 'delighted'],
      sad: ['sad', 'disappointed', 'upset', 'down', 'depressed'],
      frustrated: ['frustrated', 'annoyed', 'irritated', 'angry', 'mad'],
      satisfied: ['satisfied', 'content', 'pleased', 'fulfilled'],
      calm: ['calm', 'peaceful', 'relaxed', 'serene'],
      excited: ['excited', 'thrilled', 'enthusiastic', 'energetic']
    };

    const detectedEmotions = [];
    const words = text.toLowerCase().split(/\s+/);

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      const matches = keywords.filter(keyword => 
        words.some(word => word.includes(keyword))
      );
      
      if (matches.length > 0) {
        detectedEmotions.push({
          emotion,
          confidence: Math.min(0.9, matches.length * 0.3),
          keywords: matches
        });
      }
    }

    return detectedEmotions;
  }

  detectEmotions() {
    // Simulate emotion detection
    const possibleEmotions = this.emotions;
    const detected = [];
    
    for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
      detected.push(possibleEmotions[Math.floor(Math.random() * possibleEmotions.length)]);
    }
    
    return [...new Set(detected)]; // Remove duplicates
  }

  // Utility methods
  consolidateEmotions(emotions) {
    const consolidated = {};
    emotions.forEach(emotion => {
      if (typeof emotion === 'string') {
        consolidated[emotion] = (consolidated[emotion] || 0) + 1;
      } else if (emotion.emotion) {
        consolidated[emotion.emotion] = Math.max(
          consolidated[emotion.emotion] || 0,
          emotion.confidence || 0.5
        );
      }
    });
    return consolidated;
  }

  getTimeRangeCutoff(timeRange) {
    const now = new Date();
    const ranges = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    };
    
    const days = ranges[timeRange] || 7;
    return new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  }

  calculateSentimentAnalytics(reviews) {
    const sentiments = { positive: 0, negative: 0, neutral: 0 };
    const emotions = {};
    const ratings = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    reviews.forEach(review => {
      // Sentiment
      if (review.sentiment) {
        sentiments[review.sentiment.label]++;
      }

      // Emotions
      review.emotions.forEach(emotion => {
        emotions[emotion] = (emotions[emotion] || 0) + 1;
      });

      // Ratings
      ratings[review.rating]++;
    });

    return {
      sentiments,
      emotions,
      ratings,
      averageRating: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    };
  }

  calculateSentimentBreakdown(reviews) {
    const breakdown = { positive: 0, negative: 0, neutral: 0 };
    reviews.forEach(review => {
      if (review.sentiment) {
        breakdown[review.sentiment.label]++;
      }
    });
    return breakdown;
  }

  calculateEmotionBreakdown(reviews) {
    const breakdown = {};
    reviews.forEach(review => {
      review.emotions.forEach(emotion => {
        breakdown[emotion] = (breakdown[emotion] || 0) + 1;
      });
    });
    return breakdown;
  }

  calculateRatingDistribution(reviews) {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      distribution[review.rating]++;
    });
    return distribution;
  }

  calculateTrendingVibes(reviews) {
    const vibes = {};
    
    reviews.forEach(review => {
      // Combine emotions and sentiment
      const reviewVibes = [...review.emotions];
      if (review.sentiment) {
        reviewVibes.push(review.sentiment.label);
      }
      
      reviewVibes.forEach(vibe => {
        vibes[vibe] = (vibes[vibe] || 0) + 1;
      });
    });

    return Object.entries(vibes)
      .map(([vibe, count]) => ({ vibe, count }))
      .sort((a, b) => b.count - a.count);
  }

  generateVibeGraph(reviews, timeRange) {
    // Create time-based emotional journey
    const timeline = [];
    const intervals = timeRange === '1d' ? 24 : 
                     timeRange === '7d' ? 7 : 
                     timeRange === '30d' ? 30 : 90;

    for (let i = 0; i < intervals; i++) {
      const intervalReviews = reviews.filter(review => {
        // Simplified time bucketing
        const reviewTime = new Date(review.metadata.timestamp);
        const bucketStart = new Date(Date.now() - (intervals - i) * 24 * 60 * 60 * 1000);
        const bucketEnd = new Date(Date.now() - (intervals - i - 1) * 24 * 60 * 60 * 1000);
        return reviewTime >= bucketStart && reviewTime < bucketEnd;
      });

      const emotions = {};
      intervalReviews.forEach(review => {
        review.emotions.forEach(emotion => {
          emotions[emotion] = (emotions[emotion] || 0) + 1;
        });
      });

      timeline.push({
        period: i,
        emotions,
        reviewCount: intervalReviews.length,
        averageRating: intervalReviews.length > 0 ? 
          intervalReviews.reduce((sum, r) => sum + r.rating, 0) / intervalReviews.length : 0
      });
    }

    return timeline;
  }

  async updateAgentAnalytics(agentId, review) {
    const analytics = await this.vaultLogger.getAgentAnalytics(agentId);
    
    analytics.reviews.push({
      id: review.id,
      rating: review.rating,
      sentiment: review.sentiment?.label,
      emotions: review.emotions,
      timestamp: review.metadata.timestamp
    });

    // Recalculate rating
    analytics.rating = analytics.reviews.reduce((sum, r) => sum + r.rating, 0) / analytics.reviews.length;

    await this.vaultLogger.updateAgentAnalytics(agentId, analytics);
  }

  start(port) {
    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        console.log(`VibeGraph server running on port ${port}`);
        resolve();
      });
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}

module.exports = VibeGraphServer;