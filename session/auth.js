/**
 * Simple UUID-Based Session System
 *
 * No backend, no database, no OAuth.
 * Just localStorage and UUIDs for YOUR devices.
 */

class SimpleSession {
    constructor() {
        this.sessionKey = 'soulfra_session_id';
        this.userKey = 'soulfra_user_data';
    }

    /**
     * Generate a UUID
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Create a new session
     */
    createSession(userData = {}) {
        const sessionId = this.generateUUID();
        const session = {
            id: sessionId,
            created: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            user: {
                deviceType: this.detectDevice(),
                userAgent: navigator.userAgent,
                ...userData
            }
        };

        localStorage.setItem(this.sessionKey, sessionId);
        localStorage.setItem(this.userKey, JSON.stringify(session));

        console.log('✅ Session created:', sessionId);
        return session;
    }

    /**
     * Get existing session or create new one
     */
    getOrCreateSession() {
        const sessionId = localStorage.getItem(this.sessionKey);

        if (sessionId) {
            // Session exists - update last active
            const session = this.getSession();
            if (session) {
                session.lastActive = new Date().toISOString();
                localStorage.setItem(this.userKey, JSON.stringify(session));
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
     * Check if session exists
     */
    hasSession() {
        return !!localStorage.getItem(this.sessionKey);
    }

    /**
     * Get session ID
     */
    getSessionId() {
        return localStorage.getItem(this.sessionKey);
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
        console.log('✅ Session cleared');
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
     * Generate QR login URL
     * @param {string} baseUrl - Base URL (e.g., http://192.168.1.100:8000)
     * @param {object} params - Additional URL params
     */
    generateQRLoginUrl(baseUrl, params = {}) {
        const sessionId = this.getSessionId() || this.generateUUID();
        const url = new URL('/qr/', baseUrl);
        url.searchParams.set('session', sessionId);

        // Add additional params
        Object.keys(params).forEach(key => {
            url.searchParams.set(key, params[key]);
        });

        return url.toString();
    }

    /**
     * Handle QR scan (parse session from URL)
     */
    handleQRScan() {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session');

        if (sessionId) {
            // Set session from QR code
            localStorage.setItem(this.sessionKey, sessionId);

            // Create session object
            const session = {
                id: sessionId,
                created: new Date().toISOString(),
                lastActive: new Date().toISOString(),
                user: {
                    deviceType: this.detectDevice(),
                    userAgent: navigator.userAgent
                },
                scannedFromQR: true
            };

            localStorage.setItem(this.userKey, JSON.stringify(session));

            console.log('✅ Session created from QR scan:', sessionId);

            // Get routing params
            const domain = urlParams.get('domain');
            const action = urlParams.get('action');
            const page = urlParams.get('page');

            return {
                session,
                routing: { domain, action, page }
            };
        }

        return null;
    }

    /**
     * Get session status
     */
    getStatus() {
        const session = this.getSession();
        return {
            hasSession: this.hasSession(),
            sessionId: this.getSessionId(),
            deviceType: session?.user?.deviceType,
            created: session?.created,
            lastActive: session?.lastActive,
            scannedFromQR: session?.scannedFromQR || false
        };
    }
}

// Export singleton
const sessionManager = new SimpleSession();

// Browser export
if (typeof window !== 'undefined') {
    window.SimpleSession = sessionManager;
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = sessionManager;
}
