/**
 * API Configuration
 *
 * Auto-detects environment and provides correct API base URL.
 * Include this in your HTML files to fix hardcoded endpoints.
 *
 * Usage in HTML:
 *   <script src="/api/config.js"></script>
 *   <script>
 *     fetch(`${API_CONFIG.baseURL}/api/health`)
 *   </script>
 */

(function() {
  'use strict';

  // Detect environment
  const hostname = window.location.hostname;
  const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';
  const isGitHubPages = hostname.includes('github.io');

  // Determine API base URL
  let apiBaseURL;
  let ollamaURL;

  if (isDevelopment) {
    // Local development: use unified backend
    apiBaseURL = 'http://localhost:5050';
    ollamaURL = 'http://localhost:11434';
  } else if (isGitHubPages) {
    // GitHub Pages: use production backend (if you have one)
    // For now, fallback to local (requires CORS)
    apiBaseURL = 'https://api.soulfra.com'; // Change this to your production API
    ollamaURL = null; // Ollama not available in production
  } else {
    // Unknown environment: assume local
    apiBaseURL = 'http://localhost:5050';
    ollamaURL = 'http://localhost:11434';
  }

  // Global configuration object
  window.API_CONFIG = {
    // Environment detection
    isDevelopment,
    isProduction: !isDevelopment,
    isGitHubPages,
    hostname,

    // API URLs
    baseURL: apiBaseURL,
    ollamaURL,

    // Legacy compatibility (for pages using ${API_BASE})
    API_BASE: apiBaseURL,

    // Convenience methods
    getEndpoint: function(path) {
      return `${this.baseURL}${path}`;
    },

    // Check if Ollama is available
    isOllamaAvailable: function() {
      return this.ollamaURL !== null;
    },

    // Fetch with proper error handling
    fetch: async function(endpoint, options = {}) {
      const url = endpoint.startsWith('http') ? endpoint : this.getEndpoint(endpoint);

      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`API request failed: ${url}`, error);
        throw error;
      }
    }
  };

  // Log configuration on load
  console.log('🔧 API Configuration loaded:', {
    environment: isDevelopment ? 'development' : 'production',
    apiBaseURL,
    ollamaURL: ollamaURL || 'not available'
  });

  // Expose to global scope for legacy compatibility
  window.API_BASE = apiBaseURL;

})();
