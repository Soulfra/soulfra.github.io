/**
 * CalOS Identity Tracker
 *
 * Loads on every page, creates device fingerprint, builds visitor profile
 * Privacy-first: All data stored locally, syncs only when authorized
 *
 * Usage:
 * <script src="identity-tracker.js"></script>
 *
 * Auto-initializes on load
 *
 * @version 1.0.0
 * @license MIT
 */

(async function() {
  'use strict';

  console.log('%c🔒 CalOS Identity Tracker Loading...', 'color: #667eea; font-weight: bold;');

  /**
   * Simple fingerprinting (browser-only version)
   */
  class SimpleFingerprint {
    async generate() {
      const components = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        canvas: await this.getCanvasFingerprint()
      };

      const str = JSON.stringify(components);
      const hash = await this.hash(str);

      return {
        id: hash.substring(0, 16),
        components
      };
    }

    async getCanvasFingerprint() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('CalOS', 2, 2);
      return canvas.toDataURL();
    }

    async hash(str) {
      const buffer = new TextEncoder().encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  }

  /**
   * Simple visitor profiling (browser-only version)
   */
  class SimpleProfile {
    constructor(id) {
      this.id = id;
      this.profile = this.load();
      this.startTime = Date.now();
      this.init();
    }

    load() {
      const stored = localStorage.getItem(`profile_${this.id}`);
      if (stored) return JSON.parse(stored);

      return {
        id: this.id,
        created: new Date().toISOString(),
        visits: 0,
        pages: [],
        interests: {},
        clicks: []
      };
    }

    save() {
      localStorage.setItem(`profile_${this.id}`, JSON.stringify(this.profile));
    }

    init() {
      // Track page visit
      this.profile.visits++;
      this.profile.pages.push({
        url: window.location.href,
        pathname: window.location.pathname,
        title: document.title,
        timestamp: new Date().toISOString()
      });

      // Extract interests
      this.extractInterests();

      // Track clicks
      document.addEventListener('click', (e) => this.trackClick(e));

      // Save on exit
      window.addEventListener('beforeunload', () => this.save());

      console.log('[Profile] Tracking visit #' + this.profile.visits);
    }

    extractInterests() {
      const page = (window.location.pathname + document.title).toLowerCase();

      const keywords = {
        'receipt-parsing': ['receipt', 'ocr'],
        'email': ['email', 'send'],
        'payment': ['payment', 'pos'],
        'privacy': ['privacy', 'secure'],
        'developer': ['sdk', 'api', 'demo']
      };

      for (const [interest, words] of Object.entries(keywords)) {
        if (words.some(w => page.includes(w))) {
          this.profile.interests[interest] = (this.profile.interests[interest] || 0) + 1;
        }
      }
    }

    trackClick(event) {
      const text = event.target.textContent?.substring(0, 50);
      if (text) {
        this.profile.clicks.push({
          text,
          timestamp: new Date().toISOString()
        });
      }
    }

    getResume() {
      const topInterests = Object.entries(this.profile.interests)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, score]) => ({ name, score }));

      return {
        id: this.id,
        visits: this.profile.visits,
        interests: topInterests,
        lastPage: this.profile.pages[this.profile.pages.length - 1]
      };
    }
  }

  // Initialize
  try {
    // Generate fingerprint
    const fingerprinter = new SimpleFingerprint();
    const fingerprint = await fingerprinter.generate();

    // Create/load profile
    const profile = new SimpleProfile(fingerprint.id);

    // Make globally available
    window.CalOSIdentity = {
      fingerprint: fingerprint.id,
      profile: profile,
      getResume: () => profile.getResume()
    };

    // Display in console
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #667eea;');
    console.log('%c🔒 CalOS Identity Tracker Active', 'color: #667eea; font-weight: bold;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #667eea;');
    console.log('%cFingerprint ID:', 'color: #888;', fingerprint.id);
    console.log('%cVisit #:', 'color: #888;', profile.profile.visits);
    console.log('%cTop Interests:', 'color: #888;', profile.getResume().interests);
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'color: #667eea;');

    // Display resume after 5 seconds
    setTimeout(() => {
      const resume = profile.getResume();
      console.log('%c📊 Your Profile Resume:', 'color: #2ecc71; font-weight: bold;');
      console.table(resume);
    }, 5000);

  } catch (error) {
    console.error('[CalOSIdentity] Failed to initialize:', error);
  }
})();
