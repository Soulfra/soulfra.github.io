/**
 * Unified Session Manager
 *
 * Combines CringeProof onboarding → Soulfra login → Google OAuth
 * - CringeProof mystical questions
 * - SimpleSession UUID generation
 * - GoogleOAuth pairing
 * - Cookie shedding after login
 * - 30-day timeout
 * - Profile link generation
 *
 * @license AGPLv3
 * @version 1.0.0
 */

class SessionManager {
  constructor() {
    this.sessionKey = 'soulfra_session_id';
    this.userKey = 'soulfra_user_data';
    this.onboardingKey = 'cringeproof_onboarding';
    this.googleKey = 'soulfra_google_user';

    this.SESSION_TIMEOUT = 30 * 24 * 60 * 60 * 1000; // 30 days

    this.currentSession = null;
    this.currentUser = null;
  }

  /**
   * Check if user has completed CringeProof onboarding
   */
  hasCompletedOnboarding() {
    const onboarding = localStorage.getItem(this.onboardingKey);
    return !!onboarding;
  }

  /**
   * Get CringeProof onboarding answers
   */
  getOnboardingAnswers() {
    try {
      const data = localStorage.getItem(this.onboardingKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Save CringeProof onboarding answers
   */
  saveOnboardingAnswers(answers) {
    const onboarding = {
      answers: answers,
      completedAt: new Date().toISOString(),
      timestamp: Date.now()
    };

    localStorage.setItem(this.onboardingKey, JSON.stringify(onboarding));
    console.log('✅ CringeProof onboarding saved');

    return onboarding;
  }

  /**
   * Check if user has paired with Google
   */
  hasGooglePairing() {
    const google = localStorage.getItem(this.googleKey);
    return !!google;
  }

  /**
   * Get Google user data
   */
  getGoogleUser() {
    try {
      const data = localStorage.getItem(this.googleKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Pair Google account with Soulfra session
   */
  pairGoogleAccount(googleUser) {
    // Get or create session
    const session = this.getOrCreateSession();

    // Add Google data to session
    session.user.google = {
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
      googleId: googleUser.googleId,
      pairedAt: new Date().toISOString()
    };

    // Save updated session
    localStorage.setItem(this.userKey, JSON.stringify(session));
    localStorage.setItem(this.googleKey, JSON.stringify(googleUser));

    this.currentSession = session;
    this.currentUser = session.user;

    console.log('✅ Google account paired with Soulfra session');

    return session;
  }

  /**
   * Shed Google cookies (disconnect from Google but keep session)
   */
  shedGoogleCookies() {
    // We keep the Google user data for profile purposes
    // But we disconnect from live Google authentication
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.disableAutoSelect();
      console.log('✅ Google cookies shed - running on Soulfra session only');
    }

    // Mark session as independent
    const session = this.getSession();
    if (session) {
      session.googleIndependent = true;
      session.googleShedAt = new Date().toISOString();
      localStorage.setItem(this.userKey, JSON.stringify(session));
    }
  }

  /**
   * Generate UUID
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Generate user-friendly ID from email or UUID
   */
  generateUserId(email) {
    if (email) {
      // Hash email to create ID
      let hash = 0;
      for (let i = 0; i < email.length; i++) {
        const char = email.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return 'user_' + Math.abs(hash).toString(36);
    } else {
      // Use wordlist pattern (like pipeline IDs)
      const words = ['soul', 'frail', 'coral', 'body', 'draw', 'void', 'echo', 'mirror', 'light', 'dark'];
      const id = `${words[Math.floor(Math.random() * words.length)]}-${words[Math.floor(Math.random() * words.length)]}-${words[Math.floor(Math.random() * words.length)]}-${Math.floor(Math.random() * 1000)}`;
      return id;
    }
  }

  /**
   * Create new Soulfra session
   */
  createSession(userData = {}) {
    const sessionId = this.generateUUID();
    const onboarding = this.getOnboardingAnswers();
    const google = this.getGoogleUser();

    const session = {
      id: sessionId,
      userId: userData.userId || this.generateUserId(google?.email),
      created: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      user: {
        deviceType: this.detectDevice(),
        userAgent: navigator.userAgent,
        onboarding: onboarding,
        google: google,
        ...userData
      },
      googleIndependent: false
    };

    localStorage.setItem(this.sessionKey, sessionId);
    localStorage.setItem(this.userKey, JSON.stringify(session));

    this.currentSession = session;
    this.currentUser = session.user;

    console.log('✅ Soulfra session created:', session.userId);
    return session;
  }

  /**
   * Get existing session or create new one
   */
  getOrCreateSession() {
    const sessionId = localStorage.getItem(this.sessionKey);

    if (sessionId) {
      const session = this.getSession();
      if (session) {
        // Check timeout
        const lastActive = new Date(session.lastActive).getTime();
        const now = Date.now();

        if (now - lastActive > this.SESSION_TIMEOUT) {
          // Session expired
          console.log('⚠️ Session expired');
          this.clearSession();
          return this.createSession();
        }

        // Update last active
        session.lastActive = new Date().toISOString();
        localStorage.setItem(this.userKey, JSON.stringify(session));

        this.currentSession = session;
        this.currentUser = session.user;

        return session;
      }
    }

    // No session - create new one
    return this.createSession();
  }

  /**
   * Get current session
   */
  getSession() {
    try {
      const sessionData = localStorage.getItem(this.userKey);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (e) {
      console.error('Error reading session:', e);
      return null;
    }
  }

  /**
   * Get current user
   */
  getUser() {
    const session = this.getSession();
    return session ? session.user : null;
  }

  /**
   * Get user ID
   */
  getUserId() {
    const session = this.getSession();
    return session ? session.userId : null;
  }

  /**
   * Get profile URL
   */
  getProfileUrl() {
    const userId = this.getUserId();
    if (!userId) return null;

    const origin = window.location.origin;
    return `${origin}/profiles/${userId}.html`;
  }

  /**
   * Update session data
   */
  updateSession(updates) {
    const session = this.getSession();
    if (session) {
      Object.assign(session.user, updates);
      session.lastActive = new Date().toISOString();
      localStorage.setItem(this.userKey, JSON.stringify(session));

      this.currentSession = session;
      this.currentUser = session.user;

      return session;
    }
    return null;
  }

  /**
   * Clear session (logout)
   */
  clearSession() {
    localStorage.removeItem(this.sessionKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.googleKey);
    localStorage.removeItem(this.onboardingKey);

    this.currentSession = null;
    this.currentUser = null;

    console.log('✅ Session cleared');
  }

  /**
   * Check if fully authenticated
   * (Has onboarding + session + Google pairing)
   */
  isFullyAuthenticated() {
    return this.hasCompletedOnboarding() &&
           this.hasGooglePairing() &&
           !!this.getSession();
  }

  /**
   * Get authentication status
   */
  getAuthStatus() {
    const session = this.getSession();
    const hasOnboarding = this.hasCompletedOnboarding();
    const hasGoogle = this.hasGooglePairing();

    return {
      hasSession: !!session,
      hasOnboarding: hasOnboarding,
      hasGoogle: hasGoogle,
      fullyAuthenticated: hasOnboarding && hasGoogle && !!session,
      sessionId: session?.id,
      userId: session?.userId,
      profileUrl: this.getProfileUrl(),
      googleIndependent: session?.googleIndependent || false,
      created: session?.created,
      lastActive: session?.lastActive
    };
  }

  /**
   * Detect device type
   */
  detectDevice() {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
    if (/Android/.test(ua)) return 'Android';
    if (/Macintosh/.test(ua)) return 'Mac';
    if (/Windows/.test(ua)) return 'Windows';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Unknown';
  }

  /**
   * Get next step in authentication flow
   */
  getNextAuthStep() {
    const status = this.getAuthStatus();

    if (!status.hasOnboarding) {
      return {
        step: 'onboarding',
        url: '/onboarding/cringeproof-questions.html',
        message: 'Complete CringeProof onboarding'
      };
    }

    if (!status.hasGoogle) {
      return {
        step: 'google',
        url: '/auth/google-login.html',
        message: 'Pair with Google account'
      };
    }

    if (!status.hasSession) {
      return {
        step: 'session',
        url: null,
        message: 'Create Soulfra session',
        action: () => this.createSession()
      };
    }

    return {
      step: 'complete',
      url: this.getProfileUrl(),
      message: 'Fully authenticated'
    };
  }
}

// Export singleton
const sessionManager = new SessionManager();

// Browser export
if (typeof window !== 'undefined') {
  window.SessionManager = sessionManager;
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = sessionManager;
}

console.log('[SessionManager] Module loaded');
