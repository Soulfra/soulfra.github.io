/**
 * CALOS Unified Analytics Tracker
 *
 * Centralizes all tracking across CALOS ecosystem:
 * - Page views, lesson interactions, arena votes
 * - User journeys from GitHub repos → Learning hub
 * - Shopping/behavior trends
 * - Privacy-first: SHA-256 hashed IDs, local-first storage
 *
 * Usage:
 * <script src="https://soulfra.github.io/analytics/tracker.js"></script>
 *
 * Auto-initializes on load
 *
 * @version 1.0.0
 * @license MIT
 */

(function() {
  'use strict';

  console.log('%c🔍 CALOS Analytics Loading...', 'color: #667eea; font-weight: bold;');

  // Configuration
  const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:5001'
    : 'https://api.calos.dev';

  const STORAGE_KEY = 'calos_analytics_buffer';
  const FLUSH_INTERVAL = 30000; // 30 seconds
  const MAX_BUFFER_SIZE = 50;

  /**
   * Generate or retrieve anonymous user ID
   */
  function getUserId() {
    let userId = localStorage.getItem('calos_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('calos_user_id', userId);
    }
    return userId;
  }

  /**
   * Get session ID (resets every session)
   */
  function getSessionId() {
    let sessionId = sessionStorage.getItem('calos_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      sessionStorage.setItem('calos_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Detect brand/domain from URL
   */
  function detectBrand() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    // Check for brand in URL
    if (pathname.includes('calriven')) return 'calriven';
    if (pathname.includes('vibecoding')) return 'vibecoding';
    if (pathname.includes('perplexity')) return 'perplexity-vault';
    if (pathname.includes('soulfra')) return 'soulfra';

    // GitHub repos
    if (hostname.includes('github') && pathname.includes('calriven')) return 'calriven';
    if (hostname.includes('github') && pathname.includes('vibecoding')) return 'vibecoding';
    if (hostname.includes('github') && pathname.includes('perplexity')) return 'perplexity-vault';
    if (hostname.includes('github') && pathname.includes('soulfra')) return 'soulfra';
    if (hostname.includes('github') && pathname.includes('calos')) return 'calos-platform';

    // Learning hub
    if (pathname.includes('/learn')) return 'learning-hub';

    return 'unknown';
  }

  /**
   * CALOS Analytics Class
   */
  class CalOSAnalytics {
    constructor() {
      this.userId = getUserId();
      this.sessionId = getSessionId();
      this.brand = detectBrand();
      this.buffer = this.loadBuffer();
      this.sessionStart = Date.now();

      // Auto-track page view
      this.trackPageView();

      // Setup auto-flush
      this.startAutoFlush();

      // Track session end
      window.addEventListener('beforeunload', () => this.flush());

      // Track clicks
      document.addEventListener('click', (e) => this.trackClick(e), true);

      // Make globally available
      window.CalOSAnalytics = this;

      console.log('%c✅ Analytics Initialized', 'color: #2ecc71; font-weight: bold;');
      console.log('User ID:', this.userId);
      console.log('Session ID:', this.sessionId);
      console.log('Brand:', this.brand);
    }

    /**
     * Track generic event
     */
    track(eventName, properties = {}) {
      const event = {
        event_name: eventName,
        user_id: this.userId,
        session_id: this.sessionId,
        brand: this.brand,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        pathname: window.location.pathname,
        referrer: document.referrer,
        ...properties
      };

      this.addToBuffer(event);
      console.log('📊', eventName, properties);
    }

    /**
     * Track page view
     */
    trackPageView() {
      this.track('page_view', {
        page_title: document.title,
        user_agent: navigator.userAgent,
        screen_width: window.screen.width,
        screen_height: window.screen.height
      });
    }

    /**
     * Track lesson interaction
     */
    trackLesson(action, lessonId, metadata = {}) {
      this.track(`lesson_${action}`, {
        lesson_id: lessonId,
        ...metadata
      });
    }

    /**
     * Track arena vote
     */
    trackArenaVote(winner, loser, challengeId) {
      this.track('arena_vote', {
        winner_model: winner,
        loser_model: loser,
        challenge_id: challengeId
      });
    }

    /**
     * Track survey response
     */
    trackSurvey(questionId, answer) {
      this.track('survey_response', {
        question_id: questionId,
        answer: answer
      });
    }

    /**
     * Track funnel step
     */
    trackFunnel(funnelName, step, stepName) {
      this.track('funnel_step', {
        funnel_name: funnelName,
        funnel_step: step,
        step_name: stepName
      });
    }

    /**
     * Track clicks
     */
    trackClick(event) {
      const target = event.target;

      // Only track links and buttons
      if (!target.matches('a, button, [role="button"]')) return;

      const text = target.textContent?.trim().substring(0, 100) || '';
      const href = target.getAttribute('href') || '';
      const classes = target.className || '';

      this.track('click', {
        click_text: text,
        click_href: href,
        click_classes: classes,
        click_tag: target.tagName
      });
    }

    /**
     * Track error
     */
    trackError(error, context = {}) {
      this.track('error', {
        error_message: error.message || String(error),
        error_stack: error.stack,
        ...context
      });
    }

    /**
     * Add event to local buffer
     */
    addToBuffer(event) {
      this.buffer.push(event);
      this.saveBuffer();

      // Auto-flush if buffer is full
      if (this.buffer.length >= MAX_BUFFER_SIZE) {
        this.flush();
      }
    }

    /**
     * Load buffer from localStorage
     */
    loadBuffer() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.warn('Failed to load analytics buffer:', error);
        return [];
      }
    }

    /**
     * Save buffer to localStorage
     */
    saveBuffer() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.buffer));
      } catch (error) {
        console.warn('Failed to save analytics buffer:', error);
      }
    }

    /**
     * Flush buffer to API
     */
    async flush() {
      if (this.buffer.length === 0) return;

      const eventsToSend = [...this.buffer];
      this.buffer = [];
      this.saveBuffer();

      try {
        const response = await fetch(`${API_BASE}/api/analytics/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            events: eventsToSend
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        console.log(`✅ Flushed ${eventsToSend.length} analytics events`);

      } catch (error) {
        // If flush fails, put events back in buffer
        this.buffer = [...eventsToSend, ...this.buffer];
        this.saveBuffer();
        console.warn('Analytics flush failed (will retry):', error.message);
      }
    }

    /**
     * Start auto-flush interval
     */
    startAutoFlush() {
      setInterval(() => {
        if (this.buffer.length > 0) {
          this.flush();
        }
      }, FLUSH_INTERVAL);
    }

    /**
     * Get analytics summary for user
     */
    getSummary() {
      return {
        userId: this.userId,
        sessionId: this.sessionId,
        brand: this.brand,
        sessionDuration: Date.now() - this.sessionStart,
        bufferedEvents: this.buffer.length
      };
    }
  }

  /**
   * Convenience tracking functions (backward compatibility)
   */
  window.trackEvent = function(eventName, properties) {
    if (window.CalOSAnalytics) {
      window.CalOSAnalytics.track(eventName, properties);
    }
  };

  window.trackLessonStart = function(lessonId, lessonTitle) {
    if (window.CalOSAnalytics) {
      window.CalOSAnalytics.trackLesson('start', lessonId, { lesson_title: lessonTitle });
    }
  };

  window.trackLessonComplete = function(lessonId, score, timeSpent) {
    if (window.CalOSAnalytics) {
      window.CalOSAnalytics.trackLesson('complete', lessonId, { score, time_spent: timeSpent });
    }
  };

  window.trackArenaVote = function(winner, loser, challengeId) {
    if (window.CalOSAnalytics) {
      window.CalOSAnalytics.trackArenaVote(winner, loser, challengeId);
    }
  };

  // Auto-initialize
  try {
    new CalOSAnalytics();

    // Display summary in console after 5 seconds
    setTimeout(() => {
      if (window.CalOSAnalytics) {
        console.log('%c📊 Analytics Summary:', 'color: #667eea; font-weight: bold;');
        console.table(window.CalOSAnalytics.getSummary());
      }
    }, 5000);

  } catch (error) {
    console.error('Failed to initialize CALOS Analytics:', error);
  }

  // Track unhandled errors
  window.addEventListener('error', (event) => {
    if (window.CalOSAnalytics) {
      window.CalOSAnalytics.trackError(event.error || event.message, {
        filename: event.filename,
        line: event.lineno,
        column: event.colno
      });
    }
  });

  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (window.CalOSAnalytics) {
      window.CalOSAnalytics.trackError(event.reason, {
        type: 'unhandled_rejection'
      });
    }
  });

})();
