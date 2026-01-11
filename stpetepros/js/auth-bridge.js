/**
 * StPetePros Auth Bridge
 * Connects static GitHub Pages to Flask backend for login detection
 * Allows static pages to show dynamic features when user is logged in
 */

(function() {
    'use strict';

    // Flask API base URL (change for production)
    const FLASK_API = window.location.hostname === 'localhost' || window.location.hostname.includes('.local')
        ? 'http://localhost:5001'
        : 'https://soulfra.com'; // Change to your Flask deployment URL

    // Global auth state
    window.soulfraAuth = {
        loggedIn: false,
        username: null,
        tier: 'free',
        tokens: 0,
        loading: true
    };

    /**
     * Check if user is logged in to Flask backend
     */
    async function checkAuthStatus() {
        try {
            // Set timeout to avoid hanging on unreachable backend
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

            const response = await fetch(`${FLASK_API}/api/auth/check`, {
                method: 'GET',
                credentials: 'include', // Send cookies
                headers: {
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                window.soulfraAuth = {
                    loggedIn: data.logged_in || false,
                    username: data.username || null,
                    tier: data.tier || 'free',
                    tokens: data.tokens || 0,
                    userId: data.user_id || null,
                    loading: false,
                    backendAvailable: true
                };

                // Trigger event for other scripts to react
                document.dispatchEvent(new CustomEvent('soulfra:auth-ready', {
                    detail: window.soulfraAuth
                }));

                // Update UI based on auth state
                updateUIForAuthState();
            } else {
                // Not logged in
                window.soulfraAuth.loading = false;
                window.soulfraAuth.backendAvailable = true;
                document.dispatchEvent(new CustomEvent('soulfra:auth-ready', {
                    detail: window.soulfraAuth
                }));
            }
        } catch (error) {
            // Flask backend not available - static mode only (SILENT FAIL)
            // Don't show any errors to user - just work as static site
            window.soulfraAuth.loading = false;
            window.soulfraAuth.backendAvailable = false;
            document.dispatchEvent(new CustomEvent('soulfra:auth-ready', {
                detail: window.soulfraAuth
            }));
            // Don't log to console in production to avoid scaring users
            if (window.location.hostname === 'localhost' || window.location.hostname.includes('.local')) {
                console.log('Flask backend not reachable - running in static mode');
            }
        }
    }

    /**
     * Update UI elements based on auth state
     */
    function updateUIForAuthState() {
        const auth = window.soulfraAuth;

        // Add user info to header (if logged in)
        if (auth.loggedIn) {
            addUserInfoToHeader(auth);
        }

        // Show/hide login/signup buttons
        const signupButtons = document.querySelectorAll('[data-auth-action="signup"]');
        const loginButtons = document.querySelectorAll('[data-auth-action="login"]');
        const dashboardButtons = document.querySelectorAll('[data-auth-action="dashboard"]');

        if (auth.loggedIn) {
            signupButtons.forEach(btn => btn.style.display = 'none');
            loginButtons.forEach(btn => btn.style.display = 'none');
            dashboardButtons.forEach(btn => btn.style.display = 'inline-block');
        } else {
            signupButtons.forEach(btn => btn.style.display = 'inline-block');
            loginButtons.forEach(btn => btn.style.display = 'inline-block');
            dashboardButtons.forEach(btn => btn.style.display = 'none');
        }
    }

    /**
     * Add user info badge to page header
     */
    function addUserInfoToHeader(auth) {
        // Check if already exists
        if (document.querySelector('.stpetepros-user-badge')) return;

        const badge = document.createElement('div');
        badge.className = 'stpetepros-user-badge';
        badge.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            padding: 10px 20px;
            border-radius: 50px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            z-index: 8000;
            display: flex;
            align-items: center;
            gap: 15px;
            font-size: 14px;
            color: #333;
        `;

        badge.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: 600;">👤 ${auth.username}</span>
                <span style="background: #667eea; color: white; padding: 3px 10px; border-radius: 15px; font-size: 12px;">
                    ${auth.tier.toUpperCase()}
                </span>
            </div>
            <a href="${FLASK_API}/dashboard" style="background: #667eea; color: white; padding: 5px 15px; border-radius: 20px; text-decoration: none; font-weight: 600; font-size: 12px;">
                Dashboard
            </a>
        `;

        document.body.appendChild(badge);
    }

    /**
     * Login via QR code (redirects to Flask)
     */
    function loginWithQR() {
        window.location.href = `${FLASK_API}/login-qr`;
    }

    /**
     * Logout
     */
    async function logout() {
        try {
            await fetch(`${FLASK_API}/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            window.location.reload();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    // Expose public API
    window.soulfraAuth.login = loginWithQR;
    window.soulfraAuth.logout = logout;
    window.soulfraAuth.checkStatus = checkAuthStatus;

    // Auto-check auth on page load
    document.addEventListener('DOMContentLoaded', () => {
        checkAuthStatus();
    });

    // Re-check auth when page becomes visible (tab switch)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            checkAuthStatus();
        }
    });

})();
