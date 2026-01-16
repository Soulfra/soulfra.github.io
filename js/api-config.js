// 🌐 Soulfra API Configuration
// This file configures the connection between your frontend and backend

// 🌐 Auto-detect API URL based on how the site is accessed
function getApiUrl() {
    const hostname = window.location.hostname;

    // If accessing via GitHub Pages or soulfra.com
    if (hostname === 'soulfra.com' || hostname === 'soulfra.github.io') {
        return 'http://localhost:5050'; // Call localhost from browser
    }

    // If accessing via local IP (e.g., 192.168.1.87)
    if (hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')) {
        return `http://${hostname}:5050`; // Call same IP on port 5050
    }

    // If accessing via localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5050';
    }

    // Default fallback
    return 'http://localhost:5050';
}

const API_CONFIG = {
    // Auto-detects based on hostname:
    // - soulfra.com → localhost:5050 (browser-to-localhost)
    // - 192.168.1.87:8000 → 192.168.1.87:5050 (local network)
    // - localhost:8000 → localhost:5050 (local dev)
    BASE_URL: getApiUrl(),

    // API endpoint paths
    ENDPOINTS: {
        // Health & System
        health: '/api/health',

        // Authentication & Users
        authQR: '/api/auth/qr/generate',
        authVerify: '/api/auth/verify',
        userBalance: '/api/user/balance',
        users: '/api/users',

        // QR Code Generation
        qrGenerate: '/api/qr/generate',

        // Email & Comments
        emailCapture: '/api/email-capture',
        comments: '/api/comments',

        // AI & Chat
        chat: '/api/chat',
        agentBuild: '/api/agent/build',

        // Domain & Content
        domainPortfolio: '/api/domain-portfolio/summary',
        deployedSites: '/api/deployed-sites',

        // Voice & Uploads
        voiceUpload: '/api/voice/upload',
        voiceProcess: '/api/voice/process',

        // Avatar Generation
        avatarAnalyze: '/api/avatar/analyze',
        avatarExtractColors: '/api/avatar/extract-colors',
        avatarDepthMap: '/api/avatar/depth-map'
    }
};

/**
 * Helper function to make API calls
 * @param {string} endpoint - The endpoint path from API_CONFIG.ENDPOINTS
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<any>} - JSON response from API
 */
async function apiCall(endpoint, options = {}) {
    const url = API_CONFIG.BASE_URL + endpoint;

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        ...options
    };

    // Merge headers if provided in options
    if (options.headers) {
        defaultOptions.headers = {
            ...defaultOptions.headers,
            ...options.headers
        };
    }

    try {
        console.log(`🔵 API Call: ${options.method || 'GET'} ${url}`);

        const response = await fetch(url, defaultOptions);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log(`✅ API Response:`, data);

        return data;
    } catch (error) {
        console.error('❌ API call failed:', error);
        throw error;
    }
}

/**
 * Check if backend is available
 * @returns {Promise<boolean>}
 */
async function checkBackendHealth() {
    try {
        const health = await apiCall(API_CONFIG.ENDPOINTS.health);
        console.log('✅ Backend is healthy:', health);
        return true;
    } catch (error) {
        console.warn('⚠️ Backend not available:', error.message);
        return false;
    }
}

/**
 * Generate QR code for authentication
 * @param {string} username - Username to authenticate
 * @param {string} redirect - URL to redirect after auth
 * @returns {Promise<{qrCodeURL: string, authURL: string}>}
 */
async function generateAuthQR(username, redirect = window.location.href) {
    return await apiCall(API_CONFIG.ENDPOINTS.authQR, {
        method: 'POST',
        body: JSON.stringify({ username, redirect })
    });
}

/**
 * Generate QR code for any URL
 * @param {string} url - URL to encode
 * @param {number} size - QR code size in pixels
 * @returns {Promise<{qrCodeURL: string}>}
 */
async function generateQR(url, size = 300) {
    return await apiCall(API_CONFIG.ENDPOINTS.qrGenerate, {
        method: 'POST',
        body: JSON.stringify({ url, size })
    });
}

/**
 * Send chat message to AI
 * @param {string} message - Message to send
 * @param {string} provider - AI provider ('ollama', 'openai', 'claude')
 * @returns {Promise<{response: string}>}
 */
async function sendChatMessage(message, provider = 'ollama') {
    return await apiCall(API_CONFIG.ENDPOINTS.chat, {
        method: 'POST',
        body: JSON.stringify({ message, provider })
    });
}

/**
 * Capture email for waitlist
 * @param {string} email - Email address
 * @param {string} brand - Brand name
 * @returns {Promise<{success: boolean}>}
 */
async function captureEmail(email, brand = 'soulfra') {
    return await apiCall(API_CONFIG.ENDPOINTS.emailCapture, {
        method: 'POST',
        body: JSON.stringify({ email, brand })
    });
}

/**
 * Get user token balance
 * @returns {Promise<{tokens: number}>}
 */
async function getUserBalance() {
    return await apiCall(API_CONFIG.ENDPOINTS.userBalance);
}

/**
 * Get domain portfolio summary
 * @returns {Promise<{totalDomains: number, domains: Array}>}
 */
async function getDomainPortfolio() {
    return await apiCall(API_CONFIG.ENDPOINTS.domainPortfolio);
}

/**
 * Get deployed sites list
 * @returns {Promise<Array<string>>}
 */
async function getDeployedSites() {
    return await apiCall(API_CONFIG.ENDPOINTS.deployedSites);
}

/**
 * Get all users
 * @returns {Promise<Object>}
 */
async function getUsers() {
    return await apiCall(API_CONFIG.ENDPOINTS.users);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_CONFIG,
        apiCall,
        checkBackendHealth,
        generateAuthQR,
        generateQR,
        sendChatMessage,
        captureEmail,
        getUserBalance,
        getDomainPortfolio,
        getDeployedSites,
        getUsers
    };
}

// Auto-check backend health on load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        checkBackendHealth();
    });
}
