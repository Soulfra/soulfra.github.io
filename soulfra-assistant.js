/**
 * Soulfra Assistant Loader
 *
 * Embeddable AI assistant widget that auto-detects domain
 * and provides context-aware help using local Ollama.
 *
 * Usage:
 * <script src="/soulfra-assistant.js" data-api-url="http://localhost:5050"></script>
 *
 * Or with custom config:
 * <script src="/soulfra-assistant.js"
 *   data-api-url="http://localhost:5050"
 *   data-domain="soulfra"
 *   data-position="bottom-right"></script>
 */

(function() {
  'use strict';

  // Get script tag and config
  const scriptTag = document.currentScript;
  const config = {
    apiUrl: scriptTag.getAttribute('data-api-url') || 'http://localhost:5050',
    domain: scriptTag.getAttribute('data-domain') || null, // Auto-detect if not specified
    position: scriptTag.getAttribute('data-position') || 'bottom-right',
    theme: scriptTag.getAttribute('data-theme') || 'dark'
  };

  // Auto-detect domain if not specified
  if (!config.domain) {
    const hostname = window.location.hostname;
    const domainMap = {
      'soulfra.com': 'soulfra',
      'www.soulfra.com': 'soulfra',
      'localhost': 'soulfra',
      'calriven.com': 'calriven',
      'www.calriven.com': 'calriven',
      'deathtodata.com': 'deathtodata',
      'www.deathtodata.com': 'deathtodata',
      'cringeproof.com': 'cringeproof',
      'www.cringeproof.com': 'cringeproof'
    };

    // Try exact match first
    config.domain = domainMap[hostname];

    // If not found, try extracting base domain
    if (!config.domain) {
      const baseDomain = hostname.split('.').slice(-2).join('.');
      config.domain = domainMap[baseDomain] || 'soulfra';
    }
  }

  // Create iframe container
  const container = document.createElement('div');
  container.id = 'soulfra-assistant-container';
  container.style.cssText = `
    position: fixed;
    ${config.position.includes('bottom') ? 'bottom: 0;' : 'top: 0;'}
    ${config.position.includes('right') ? 'right: 0;' : 'left: 0;'}
    z-index: 99999;
    pointer-events: none;
  `;

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'soulfra-assistant-iframe';
  iframe.src = '/soulfra-assistant.html';
  iframe.style.cssText = `
    border: none;
    width: 100vw;
    height: 100vh;
    pointer-events: auto;
    background: transparent;
  `;

  // Allow iframe to be transparent and clickable
  iframe.setAttribute('scrolling', 'no');
  iframe.setAttribute('frameborder', '0');

  container.appendChild(iframe);

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(container);
    });
  } else {
    document.body.appendChild(container);
  }

  // Expose config to iframe via postMessage
  iframe.addEventListener('load', () => {
    iframe.contentWindow.postMessage({
      type: 'SOULFRA_CONFIG',
      config: config
    }, '*');
  });

  // Listen for messages from iframe (e.g., resize requests)
  window.addEventListener('message', (event) => {
    if (event.data.type === 'SOULFRA_RESIZE') {
      // Handle resize if needed
    }
  });

  // Log initialization
  console.log('🤖 Soulfra Assistant loaded:', config);

  // Expose global API for programmatic control
  window.SoulframAssistant = {
    open: () => {
      iframe.contentWindow.postMessage({ type: 'SOULFRA_OPEN' }, '*');
    },
    close: () => {
      iframe.contentWindow.postMessage({ type: 'SOULFRA_CLOSE' }, '*');
    },
    sendMessage: (message) => {
      iframe.contentWindow.postMessage({
        type: 'SOULFRA_SEND_MESSAGE',
        message: message
      }, '*');
    },
    getConfig: () => config
  };
})();
