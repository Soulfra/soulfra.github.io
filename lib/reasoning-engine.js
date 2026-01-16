/**
 * Word-Timing Reasoning Engine
 *
 * Forces temporal experience through word-by-word reveal timing.
 * Prevents judgment before full comprehension.
 *
 * Originally conceived as IVC (Interview Voice Coach)
 *
 * Core mechanic: You can't judge what you haven't fully experienced.
 * The pacing creates comprehension. The timing is the game.
 *
 * @license AGPLv3
 * @version 1.0.0
 */

class ReasoningEngine {
  constructor() {
    this.currentSession = null;
    this.progressKey = 'reasoning_progress';

    // Timing defaults (ms per word)
    this.timingModes = {
      fast: 100,      // Speed reading
      normal: 150,    // Natural reading pace
      slow: 250,      // Comprehension focus
      meditative: 500 // Deep reflection
    };

    this.currentMode = 'normal';
  }

  /**
   * Start a reasoning session
   * @param {Object} options - Configuration
   * @returns {Object} - Session data
   */
  startSession(options = {}) {
    const {
      text,
      mode = 'normal',
      requireVoice = false,
      requireScroll = true,
      minReadTime = null,
      onComplete = null,
      containerId = 'reasoning-container'
    } = options;

    if (!text) throw new Error('Text required for reasoning session');

    const words = text.split(/\s+/);
    const timing = this.timingModes[mode] || this.timingModes.normal;

    this.currentSession = {
      id: `session-${Date.now()}`,
      text,
      words,
      mode,
      timing,
      totalWords: words.length,
      currentWord: 0,
      startTime: Date.now(),
      endTime: null,
      completed: false,
      scrolledToEnd: !requireScroll,
      voiceRecorded: !requireVoice,
      minReadTime: minReadTime || (words.length * timing),
      onComplete,
      containerId
    };

    this.saveProgress();
    return this.currentSession;
  }

  /**
   * Render word-by-word animation
   */
  async renderAnimation(containerId) {
    if (!this.currentSession) {
      throw new Error('No active session. Call startSession() first.');
    }

    const container = document.getElementById(containerId || this.currentSession.containerId);
    if (!container) {
      throw new Error(`Container ${containerId} not found`);
    }

    container.innerHTML = '';
    container.style.fontSize = '18px';
    container.style.lineHeight = '1.8';
    container.style.padding = '20px';
    container.style.minHeight = '200px';

    const { words, timing } = this.currentSession;

    // Render words sequentially
    for (let i = 0; i < words.length; i++) {
      await this.renderWord(container, words[i], i);
      await this.sleep(timing);
      this.currentSession.currentWord = i + 1;
      this.saveProgress();
    }

    // Animation complete
    this.currentSession.endTime = Date.now();
    this.checkCompletion();
  }

  /**
   * Render a single word with animation
   */
  async renderWord(container, word, index) {
    const span = document.createElement('span');
    span.className = 'reasoning-word';
    span.textContent = word;
    span.style.display = 'inline';  // Changed from inline-block
    span.style.marginRight = '5px'; // Use margin instead of space character
    span.style.opacity = '0';
    span.style.transform = 'translateY(10px)';
    span.style.transition = 'all 0.3s ease-out';
    span.dataset.wordIndex = index;

    container.appendChild(span);

    // Trigger animation
    setTimeout(() => {
      span.style.opacity = '1';
      span.style.transform = 'translateY(0)';
    }, 10);
  }

  /**
   * Track scroll progress
   */
  trackScroll(containerElement) {
    if (!this.currentSession) return;

    const handleScroll = () => {
      const scrollHeight = containerElement.scrollHeight;
      const scrollTop = containerElement.scrollTop;
      const clientHeight = containerElement.clientHeight;

      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      if (scrollPercentage >= 0.95) {
        this.currentSession.scrolledToEnd = true;
        this.saveProgress();
        this.checkCompletion();
      }
    };

    containerElement.addEventListener('scroll', handleScroll);
    return () => containerElement.removeEventListener('scroll', handleScroll);
  }

  /**
   * Record voice verification
   */
  async recordVoice() {
    if (!this.currentSession) return;

    // This would integrate with existing voice/record.html system
    // For now, just mark as recorded
    this.currentSession.voiceRecorded = true;
    this.saveProgress();
    this.checkCompletion();
  }

  /**
   * Check if session is complete
   */
  checkCompletion() {
    if (!this.currentSession) return false;

    const {
      currentWord,
      totalWords,
      scrolledToEnd,
      voiceRecorded,
      minReadTime,
      startTime,
      endTime
    } = this.currentSession;

    // Check all conditions
    const wordsComplete = currentWord >= totalWords;
    const scrollComplete = scrolledToEnd;
    const voiceComplete = voiceRecorded;
    const timeComplete = endTime && (endTime - startTime >= minReadTime);

    const isComplete = wordsComplete && scrollComplete && voiceComplete && timeComplete;

    if (isComplete && !this.currentSession.completed) {
      this.currentSession.completed = true;
      this.saveProgress();

      if (this.currentSession.onComplete) {
        this.currentSession.onComplete(this.currentSession);
      }
    }

    return isComplete;
  }

  /**
   * Get completion status
   */
  getStatus() {
    if (!this.currentSession) return null;

    const {
      currentWord,
      totalWords,
      scrolledToEnd,
      voiceRecorded,
      minReadTime,
      startTime,
      endTime,
      completed
    } = this.currentSession;

    const elapsedTime = (endTime || Date.now()) - startTime;
    const timeRemaining = Math.max(0, minReadTime - elapsedTime);

    return {
      completed,
      progress: {
        words: `${currentWord}/${totalWords}`,
        percentage: Math.floor((currentWord / totalWords) * 100)
      },
      requirements: {
        wordsRead: currentWord >= totalWords,
        scrolledToEnd,
        voiceRecorded,
        timeElapsed: elapsedTime >= minReadTime
      },
      time: {
        elapsed: elapsedTime,
        remaining: timeRemaining,
        minRequired: minReadTime
      }
    };
  }

  /**
   * Enable/disable action buttons based on completion
   */
  gateActions(buttonIds = []) {
    const status = this.getStatus();
    if (!status) return;

    buttonIds.forEach(buttonId => {
      const button = document.getElementById(buttonId);
      if (button) {
        button.disabled = !status.completed;
        button.style.opacity = status.completed ? '1' : '0.5';
        button.style.cursor = status.completed ? 'pointer' : 'not-allowed';

        if (!status.completed) {
          button.title = this.getGateMessage(status);
        }
      }
    });
  }

  /**
   * Get gate message explaining what's required
   */
  getGateMessage(status) {
    const requirements = status.requirements;
    const missing = [];

    if (!requirements.wordsRead) missing.push('finish reading');
    if (!requirements.scrolledToEnd) missing.push('scroll to the end');
    if (!requirements.voiceRecorded) missing.push('record your voice');
    if (!requirements.timeElapsed) {
      const seconds = Math.ceil(status.time.remaining / 1000);
      missing.push(`wait ${seconds} more seconds`);
    }

    if (missing.length === 0) return 'Ready';
    return `You must ${missing.join(', ')} before continuing`;
  }

  /**
   * Create visual progress indicator
   */
  createProgressBar(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const progressHTML = `
      <div class="reasoning-progress" style="
        background: rgba(0,0,0,0.8);
        border: 1px solid #333;
        border-radius: 8px;
        padding: 15px;
        margin: 20px 0;
      ">
        <div style="margin-bottom: 10px;">
          <strong>Reading Progress</strong>
        </div>
        <div class="progress-bar" style="
          width: 100%;
          height: 8px;
          background: #333;
          border-radius: 4px;
          overflow: hidden;
        ">
          <div class="progress-fill" style="
            height: 100%;
            background: linear-gradient(90deg, #00ff88, #00ccff);
            width: 0%;
            transition: width 0.3s;
          "></div>
        </div>
        <div class="requirements" style="margin-top: 15px; font-size: 12px;">
          <div class="req-item" data-req="words">
            <span class="icon">⏳</span> Read all words
          </div>
          <div class="req-item" data-req="scroll">
            <span class="icon">⏳</span> Scroll to end
          </div>
          <div class="req-item" data-req="voice" style="display: none;">
            <span class="icon">⏳</span> Record voice
          </div>
          <div class="req-item" data-req="time">
            <span class="icon">⏳</span> Minimum read time: <span class="time-remaining">--</span>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = progressHTML;
    this.updateProgressBar();
  }

  /**
   * Update progress bar visuals
   */
  updateProgressBar() {
    const status = this.getStatus();
    if (!status) return;

    // Update progress bar
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
      progressFill.style.width = `${status.progress.percentage}%`;
    }

    // Update requirement icons
    Object.keys(status.requirements).forEach(req => {
      const reqItem = document.querySelector(`[data-req="${req}"]`);
      if (reqItem) {
        const icon = reqItem.querySelector('.icon');
        if (status.requirements[req]) {
          icon.textContent = '✅';
          reqItem.style.color = '#00ff88';
        } else {
          icon.textContent = '⏳';
          reqItem.style.color = '#888';
        }
      }
    });

    // Update time remaining
    const timeEl = document.querySelector('.time-remaining');
    if (timeEl && status.time.remaining > 0) {
      const seconds = Math.ceil(status.time.remaining / 1000);
      timeEl.textContent = `${seconds}s`;
    } else if (timeEl) {
      timeEl.textContent = '0s';
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Save progress to localStorage
   */
  saveProgress() {
    if (!this.currentSession) return;
    localStorage.setItem(this.progressKey, JSON.stringify(this.currentSession));
  }

  /**
   * Load progress from localStorage
   */
  loadProgress() {
    try {
      const data = localStorage.getItem(this.progressKey);
      if (data) {
        this.currentSession = JSON.parse(data);
        return this.currentSession;
      }
    } catch (e) {
      console.error('Failed to load progress:', e);
    }
    return null;
  }

  /**
   * Clear session
   */
  clearSession() {
    this.currentSession = null;
    localStorage.removeItem(this.progressKey);
  }
}

// Export singleton
const reasoningEngine = new ReasoningEngine();

// Browser export
if (typeof window !== 'undefined') {
  window.ReasoningEngine = reasoningEngine;
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = reasoningEngine;
}

console.log('[ReasoningEngine] Module loaded');
