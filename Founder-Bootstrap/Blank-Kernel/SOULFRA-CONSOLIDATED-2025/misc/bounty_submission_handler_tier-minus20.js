// Bounty Submission Handler
// Processes viewer reflections and routes through approval pipeline

class BountySubmissionHandler {
  constructor() {
    this.submissionQueue = [];
    this.approvalQueue = [];
    this.processedSubmissions = new Map();
    this.rateLimits = new Map(); // viewerId -> submission timestamps
  }

  async processSubmission(submission) {
    console.log('🔄 Processing submission:', submission.id);
    
    try {
      // Step 1: Rate limiting check
      if (!this.checkRateLimit(submission.viewerId)) {
        throw new Error('Rate limit exceeded. Please wait before submitting another reflection.');
      }

      // Step 2: Viewer state verification
      const viewerValid = await this.verifyViewerState(submission.viewerState);
      if (!viewerValid.isValid) {
        throw new Error(viewerValid.reason);
      }

      // Step 3: Archetype filtering (prevent raw GPT feedback)
      const filteredSubmission = await this.applyArchetypeFilter(submission);
      
      // Step 4: Agent stream state verification
      const streamValid = await this.verifyStreamState(submission.agents);
      if (!streamValid.isValid) {
        throw new Error(streamValid.reason);
      }

      // Step 5: Challenge trigger matching
      const triggerMatch = await this.evaluateTriggerMatch(filteredSubmission);
      
      // Step 6: Route to appropriate handler
      let result;
      if (triggerMatch.hasMatch) {
        result = await this.handleMatchedSubmission(filteredSubmission, triggerMatch);
      } else {
        result = await this.handleUnmatchedSubmission(filteredSubmission);
      }

      // Step 7: Log submission
      await this.logSubmission(filteredSubmission, result);
      
      // Step 8: Update rate limits
      this.updateRateLimit(submission.viewerId);
      
      return result;
      
    } catch (error) {
      console.error('Submission processing failed:', error);
      await this.logFailedSubmission(submission, error);
      throw error;
    }
  }

  checkRateLimit(viewerId) {
    const now = Date.now();
    const submissions = this.rateLimits.get(viewerId) || [];
    
    // Remove submissions older than 1 hour
    const recentSubmissions = submissions.filter(timestamp => 
      now - timestamp < 3600000 // 1 hour in ms
    );
    
    // Allow max 5 submissions per hour
    if (recentSubmissions.length >= 5) {
      return false;
    }
    
    this.rateLimits.set(viewerId, recentSubmissions);
    return true;
  }

  async verifyViewerState(viewerState) {
    // Anonymous viewers can submit but with limited rewards
    if (viewerState.isAnonymous) {
      return {
        isValid: true,
        tier: 'anonymous',
        maxReward: 'blessing_fragment'
      };
    }

    try {
      // Verify blessing count and reflection history
      const response = await fetch(`/vault/viewer/${viewerState.id}/verify`);
      const verification = await response.json();
      
      if (!verification.exists) {
        return {
          isValid: false,
          reason: 'Viewer not found in vault system'
        };
      }

      return {
        isValid: true,
        tier: this.calculateViewerTier(verification),
        blessings: verification.blessings || 0,
        reflections: verification.reflections || 0
      };
      
    } catch (error) {
      console.error('Viewer verification failed:', error);
      return {
        isValid: false,
        reason: 'Could not verify viewer state'
      };
    }
  }

  calculateViewerTier(verification) {
    const blessings = verification.blessings || 0;
    const reflections = verification.reflections || 0;
    
    if (blessings >= 10 && reflections >= 20) return 'blessed';
    if (blessings >= 5 && reflections >= 10) return 'initiated';
    if (reflections >= 5) return 'apprentice';
    return 'novice';
  }

  async applyArchetypeFilter(submission) {
    // Filter out raw GPT-style responses and obvious spam
    const text = submission.text.toLowerCase();
    
    // Reject obvious AI-generated patterns
    const aiPatterns = [
      /as an ai/,
      /i don't have the ability/,
      /i cannot provide/,
      /here's what i think/,
      /based on my analysis/
    ];
    
    const hasAiPattern = aiPatterns.some(pattern => pattern.test(text));
    if (hasAiPattern) {
      throw new Error('Submission appears to be AI-generated. Please provide human observations.');
    }

    // Reject spam patterns
    const spamPatterns = [
      /(.)\1{10,}/, // Repeated characters
      /^.{0,5}$/, // Too short
      /buy now|click here|free money/i // Obvious spam
    ];
    
    const hasSpamPattern = spamPatterns.some(pattern => pattern.test(text));
    if (hasSpamPattern) {
      throw new Error('Submission rejected as spam.');
    }

    // Extract semantic content using simple keyword analysis
    const reflectionKeywords = [
      'noticed', 'observed', 'seems', 'appears', 'behavior', 'pattern',
      'repeating', 'stuck', 'unusual', 'different', 'changed', 'weird'
    ];
    
    const hasReflectionContent = reflectionKeywords.some(keyword => 
      text.includes(keyword)
    );

    return {
      ...submission,
      filtered_text: submission.text,
      has_reflection_content: hasReflectionContent,
      archetype_score: hasReflectionContent ? 0.8 : 0.3
    };
  }

  async verifyStreamState(agentIds) {
    try {
      // Check if agents are actually active and accessible
      for (const agentId of agentIds) {
        const response = await fetch(`/api/agents/${agentId}/state`);
        
        if (!response.ok) {
          return {
            isValid: false,
            reason: `Agent ${agentId} is not accessible`
          };
        }
        
        const agentState = await response.json();
        if (!agentState.isActive) {
          return {
            isValid: false,
            reason: `Agent ${agentId} is not currently active`
          };
        }
      }
      
      return { isValid: true };
      
    } catch (error) {
      console.error('Stream state verification failed:', error);
      return {
        isValid: false,
        reason: 'Could not verify agent stream states'
      };
    }
  }

  async evaluateTriggerMatch(submission) {
    try {
      // Load challenge definitions for the mentioned agents
      const challenges = await this.loadChallengesForAgents(submission.agents);
      
      const matches = [];
      const text = submission.filtered_text.toLowerCase();
      
      for (const [agentId, agentChallenges] of challenges) {
        for (const challenge of agentChallenges) {
          const match = this.checkTriggerMatch(text, challenge);
          if (match.confidence > 0.5) {
            matches.push({
              agentId,
              challenge,
              confidence: match.confidence,
              extractedData: match.data
            });
          }
        }
      }

      // Sort by confidence
      matches.sort((a, b) => b.confidence - a.confidence);
      
      return {
        hasMatch: matches.length > 0,
        matches: matches,
        bestMatch: matches[0] || null
      };
      
    } catch (error) {
      console.error('Trigger matching failed:', error);
      return { hasMatch: false, matches: [] };
    }
  }

  async loadChallengesForAgents(agentIds) {
    const challenges = new Map();
    
    try {
      const response = await fetch('/vault/challenges/stream-anomaly-hooks.json');
      const challengeData = await response.json();
      
      challengeData.agents.forEach(agentConfig => {
        if (agentIds.includes(agentConfig.agent)) {
          challenges.set(agentConfig.agent, agentConfig.challenges);
        }
      });
      
    } catch (error) {
      console.error('Failed to load challenges:', error);
    }
    
    return challenges;
  }

  checkTriggerMatch(text, challenge) {
    let confidence = 0;
    let extractedData = {};

    switch (challenge.type) {
      case 'echo_loop':
        confidence = this.matchEchoLoop(text);
        break;
        
      case 'forgotten_trait':
        const traitMatch = this.matchForgottenTrait(text);
        confidence = traitMatch.confidence;
        extractedData = traitMatch.data;
        break;
        
      case 'mood_inconsistency':
        confidence = this.matchMoodInconsistency(text);
        break;
        
      case 'response_lag':
        confidence = this.matchResponseLag(text);
        break;
        
      default:
        confidence = this.matchGenericAnomaly(text, challenge);
    }

    return { confidence, data: extractedData };
  }

  matchEchoLoop(text) {
    const loopKeywords = ['repeating', 'repeat', 'same thing', 'loop', 'stuck', 'again'];
    const matches = loopKeywords.filter(keyword => text.includes(keyword));
    return Math.min(matches.length * 0.3, 1.0);
  }

  matchForgottenTrait(text) {
    const traitKeywords = ['lost', 'missing', 'forgot', 'used to', 'before'];
    const matches = traitKeywords.filter(keyword => text.includes(keyword));
    
    // Try to extract what trait was mentioned
    const traitPatterns = [
      /lost (?:its|their) (\w+)/,
      /missing (?:the|its) (\w+)/,
      /forgot (?:to|about) (\w+)/
    ];
    
    let extractedTrait = null;
    for (const pattern of traitPatterns) {
      const match = text.match(pattern);
      if (match) {
        extractedTrait = match[1];
        break;
      }
    }
    
    return {
      confidence: Math.min(matches.length * 0.25, 0.9),
      data: { trait: extractedTrait }
    };
  }

  matchMoodInconsistency(text) {
    const moodKeywords = ['suddenly', 'changed', 'different mood', 'weird', 'off'];
    const matches = moodKeywords.filter(keyword => text.includes(keyword));
    return Math.min(matches.length * 0.2, 0.8);
  }

  matchResponseLag(text) {
    const lagKeywords = ['slow', 'delay', 'taking forever', 'not responding'];
    const matches = lagKeywords.filter(keyword => text.includes(keyword));
    return Math.min(matches.length * 0.3, 0.7);
  }

  matchGenericAnomaly(text, challenge) {
    // Use challenge description keywords for matching
    const description = challenge.description.toLowerCase();
    const keywords = description.split(' ').filter(word => word.length > 3);
    
    const matches = keywords.filter(keyword => text.includes(keyword));
    return Math.min(matches.length * 0.1, 0.6);
  }

  async handleMatchedSubmission(submission, triggerMatch) {
    const bestMatch = triggerMatch.bestMatch;
    const challenge = bestMatch.challenge;
    
    console.log(`✨ Challenge match found: ${challenge.type} (${bestMatch.confidence})`);
    
    // Check blessing requirements
    const viewerBlessings = submission.viewerState.blessings || 0;
    const requiredBlessings = challenge.blessing_required || 0;
    
    if (viewerBlessings < requiredBlessings) {
      return {
        accepted: false,
        reason: `Requires ${requiredBlessings} blessings (you have ${viewerBlessings})`,
        suggestedAction: 'Continue participating to earn more blessings'
      };
    }
    
    // Auto-approve high-confidence matches
    if (bestMatch.confidence > 0.8) {
      const reward = await this.issueReward(submission, challenge);
      
      return {
        accepted: true,
        autoApproved: true,
        challenge: challenge.type,
        confidence: bestMatch.confidence,
        reward: reward
      };
    }
    
    // Queue for manual approval
    await this.queueForApproval(submission, triggerMatch);
    
    return {
      accepted: false,
      queued: true,
      challenge: challenge.type,
      confidence: bestMatch.confidence,
      estimatedReview: '2-24 hours'
    };
  }

  async handleUnmatchedSubmission(submission) {
    // General feedback submission - lower priority queue
    await this.queueGeneralFeedback(submission);
    
    return {
      accepted: false,
      queued: true,
      type: 'general_feedback',
      estimatedReview: '1-7 days',
      reward: 'Small blessing fragment for participation'
    };
  }

  async issueReward(submission, challenge) {
    try {
      const rewardType = challenge.reward || 'blessing_fragment';
      
      const rewardRequest = {
        viewerId: submission.viewerId,
        type: rewardType,
        source: 'bounty_challenge',
        challengeType: challenge.type,
        submissionId: submission.id,
        timestamp: new Date().toISOString()
      };
      
      // Route through QuadMonopolyRouter as required
      const response = await fetch('/api/rewards/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rewardRequest)
      });
      
      if (response.ok) {
        const reward = await response.json();
        console.log('🎁 Reward issued:', reward);
        return reward;
      } else {
        throw new Error('Reward issuance failed');
      }
      
    } catch (error) {
      console.error('Failed to issue reward:', error);
      return { type: 'error', message: 'Reward processing failed' };
    }
  }

  async queueForApproval(submission, triggerMatch) {
    const approvalItem = {
      id: `approval_${Date.now()}`,
      submissionId: submission.id,
      type: 'challenge_match',
      triggerMatch: triggerMatch,
      submission: submission,
      queuedAt: new Date().toISOString(),
      priority: this.calculatePriority(triggerMatch)
    };
    
    this.approvalQueue.push(approvalItem);
    
    // Persist to vault
    await this.saveApprovalQueue();
  }

  async queueGeneralFeedback(submission) {
    const feedbackItem = {
      id: `feedback_${Date.now()}`,
      submissionId: submission.id,
      type: 'general_feedback',
      submission: submission,
      queuedAt: new Date().toISOString(),
      priority: 'low'
    };
    
    this.approvalQueue.push(feedbackItem);
    await this.saveApprovalQueue();
  }

  calculatePriority(triggerMatch) {
    const confidence = triggerMatch.bestMatch.confidence;
    
    if (confidence > 0.9) return 'urgent';
    if (confidence > 0.7) return 'high';
    if (confidence > 0.5) return 'medium';
    return 'low';
  }

  async logSubmission(submission, result) {
    const logEntry = {
      stream_id: `stream_${Date.now()}`,
      viewer_id: submission.viewerId,
      submission_text: submission.filtered_text,
      agent_affected: submission.agents,
      challenge_type: result.challenge || 'unmatched',
      reward_issued: result.reward || null,
      timestamp: new Date().toISOString(),
      result_status: result.accepted ? 'accepted' : 'queued',
      confidence: result.confidence || 0
    };
    
    try {
      // Append to bounty log
      await fetch('/vault/logs/bounty-log.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      });
      
    } catch (error) {
      console.error('Failed to log submission:', error);
    }
  }

  async logFailedSubmission(submission, error) {
    const errorLog = {
      submission_id: submission.id,
      viewer_id: submission.viewerId,
      error_message: error.message,
      timestamp: new Date().toISOString(),
      submission_text: submission.text ? submission.text.substring(0, 100) : ''
    };
    
    try {
      await fetch('/vault/logs/bounty-errors.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorLog)
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  updateRateLimit(viewerId) {
    const now = Date.now();
    const submissions = this.rateLimits.get(viewerId) || [];
    submissions.push(now);
    this.rateLimits.set(viewerId, submissions);
  }

  async saveApprovalQueue() {
    try {
      await fetch('/vault/queues/approval-queue.json', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queue: this.approvalQueue,
          lastUpdated: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to save approval queue:', error);
    }
  }

  // Public API for monitoring
  getQueueStatus() {
    return {
      approvalQueue: this.approvalQueue.length,
      rateLimits: this.rateLimits.size,
      processed: this.processedSubmissions.size
    };
  }

  getRecentSubmissions(limit = 10) {
    return Array.from(this.processedSubmissions.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }
}

// Export for use in main engine
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BountySubmissionHandler;
} else {
  window.BountySubmissionHandler = BountySubmissionHandler;
}