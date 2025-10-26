/**
 * CALOS Universal Router
 *
 * Client-side SPA router with support for:
 * - Path routing: /business, /lessons
 * - Hash routing: #business, #lessons
 * - Hashbang routing: #!/business, #!/lessons (deprecated but supported)
 * - Keyboard shortcuts: Cmd/Ctrl + Shift + {Key}
 * - Deep linking
 * - Browser history API
 *
 * Usage:
 * <script src="router.js"></script>
 * <div id="app"></div>
 *
 * The router auto-initializes and handles all navigation.
 *
 * @version 1.0.0
 * @license MIT
 */

class UniversalRouter {
  constructor(config = {}) {
    this.config = {
      appSelector: config.appSelector || '#app',
      baseUrl: config.baseUrl || '',
      enableHistory: config.enableHistory !== false,
      enableKeyboardShortcuts: config.enableKeyboardShortcuts !== false,
      enableHashRouting: config.enableHashRouting !== false,
      enable404: config.enable404 !== false,
      debug: config.debug || false,
      ...config
    };

    // Route definitions
    this.routes = {
      '/': {
        file: 'index.html',
        title: 'SoulFra - Home',
        shortcut: 'H'
      },
      '/business': {
        file: 'business/index.html',
        title: 'Business Dashboard',
        shortcut: 'B'
      },
      '/lessons': {
        file: 'lessons/index.html',
        title: 'Lessons',
        shortcut: 'L'
      },
      '/learn': {
        file: 'learn/index.html',
        title: 'Learn',
        shortcut: 'E'
      },
      '/agent-router': {
        file: 'agent-router/index.html',
        title: 'Agent Router',
        shortcut: 'A'
      },
      '/login': {
        file: 'login.html',
        title: 'Login',
        shortcut: null
      },
      '/signup': {
        file: 'signup.html',
        title: 'Sign Up',
        shortcut: null
      },
      '/dashboard': {
        file: 'dashboard.html',
        title: 'Dashboard',
        shortcut: 'D'
      }
    };

    // Hash to path mapping
    this.hashRoutes = {};
    Object.keys(this.routes).forEach(path => {
      this.hashRoutes[`#${path.slice(1)}`] = path;
      this.hashRoutes[`#!${path.slice(1)}`] = path; // Hashbang support
    });

    // Current route
    this.currentPath = null;

    // Platform detection
    this.platform = this.detectPlatform();

    // App container
    this.appContainer = null;

    // Loading state
    this.isLoading = false;

    this.log('Router initialized', { platform: this.platform, routes: Object.keys(this.routes).length });
  }

  /**
   * Initialize router
   */
  init() {
    // Get app container
    this.appContainer = document.querySelector(this.config.appSelector);

    if (!this.appContainer) {
      console.error(`[Router] App container not found: ${this.config.appSelector}`);
      return;
    }

    // Handle hash changes (for #business style URLs)
    if (this.config.enableHashRouting) {
      window.addEventListener('hashchange', () => this.handleHashChange());
    }

    // Handle popstate (browser back/forward)
    if (this.config.enableHistory) {
      window.addEventListener('popstate', (e) => this.handlePopState(e));
    }

    // Intercept link clicks
    this.interceptLinks();

    // Keyboard shortcuts
    if (this.config.enableKeyboardShortcuts) {
      this.initKeyboardShortcuts();
    }

    // Handle initial load
    this.handleInitialLoad();

    this.log('Router ready');
  }

  /**
   * Handle initial page load
   */
  handleInitialLoad() {
    const path = window.location.pathname;
    const hash = window.location.hash;

    if (hash && this.config.enableHashRouting) {
      // Has hash - convert to path and navigate
      const hashPath = this.hashRoutes[hash];
      if (hashPath) {
        this.navigate(hashPath, { replaceState: true });
      } else {
        // Unknown hash, load current path
        this.loadRoute(path);
      }
    } else {
      // No hash, just load the current path
      this.loadRoute(path);
    }
  }

  /**
   * Handle hash change event
   */
  handleHashChange() {
    const hash = window.location.hash;
    const path = this.hashRoutes[hash];

    if (path) {
      this.log('Hash changed', { hash, path });
      this.navigate(path, { replaceState: true, skipHashUpdate: true });
    }
  }

  /**
   * Handle popstate (browser back/forward)
   */
  handlePopState(event) {
    const path = window.location.pathname;
    this.log('Popstate', { path, state: event.state });
    this.loadRoute(path);
  }

  /**
   * Intercept link clicks for SPA navigation
   */
  interceptLinks() {
    document.addEventListener('click', (e) => {
      // Check if clicked element is a link
      const link = e.target.closest('a');

      if (!link) return;

      const href = link.getAttribute('href');

      // Ignore external links, downloads, and special protocols
      if (!href ||
          href.startsWith('http') ||
          href.startsWith('mailto:') ||
          href.startsWith('tel:') ||
          link.hasAttribute('download') ||
          link.getAttribute('target') === '_blank') {
        return;
      }

      // Handle internal navigation
      if (href.startsWith('/') || href.startsWith('#')) {
        e.preventDefault();

        if (href.startsWith('#')) {
          // Hash link - convert to path if it's a route
          const path = this.hashRoutes[href];
          if (path) {
            this.navigate(path);
          } else {
            // Regular anchor link (e.g., #section)
            document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
          }
        } else {
          // Path link
          this.navigate(href);
        }
      }
    });
  }

  /**
   * Initialize keyboard shortcuts
   */
  initKeyboardShortcuts() {
    const isMac = this.platform === 'mac';

    document.addEventListener('keydown', (e) => {
      // Check for modifier key (Cmd on Mac, Ctrl on Windows/Linux)
      const modifierKey = isMac ? e.metaKey : e.ctrlKey;

      // Require Shift + Modifier
      if (!modifierKey || !e.shiftKey) return;

      // Find route with matching shortcut
      for (const [path, route] of Object.entries(this.routes)) {
        if (route.shortcut && e.key.toUpperCase() === route.shortcut.toUpperCase()) {
          e.preventDefault();
          this.navigate(path);
          this.log('Keyboard shortcut', { key: route.shortcut, path });
          break;
        }
      }
    });

    this.log('Keyboard shortcuts enabled', { platform: this.platform, modifier: isMac ? 'Cmd' : 'Ctrl' });
  }

  /**
   * Navigate to a path
   * @param {string} path - Path to navigate to
   * @param {object} options - Navigation options
   */
  navigate(path, options = {}) {
    const {
      replaceState = false,
      skipHashUpdate = false
    } = options;

    // Extract query params and anchor from original path
    const originalPath = path;
    const queryMatch = originalPath.match(/\?(.+?)(?:#|$)/);
    const anchorMatch = originalPath.match(/#([^?]+)$/);
    const queryString = queryMatch ? `?${queryMatch[1]}` : '';
    const anchor = anchorMatch ? `#${anchorMatch[1]}` : '';

    // Normalize path (removes query params and anchors)
    path = this.normalizePath(originalPath);

    // Don't reload if already on this path
    if (path === this.currentPath && !options.force && !queryString && !anchor) {
      this.log('Already on path', { path });
      return;
    }

    // Update browser history
    if (this.config.enableHistory) {
      const url = `${this.config.baseUrl}${path}${queryString}`;

      if (replaceState) {
        window.history.replaceState({ path, query: queryString }, '', url);
      } else {
        window.history.pushState({ path, query: queryString }, '', url);
      }
    }

    // Update hash if hash routing enabled (but not if we have an anchor)
    if (this.config.enableHashRouting && !skipHashUpdate && !anchor) {
      const hash = path === '/' ? '' : `#${path.slice(1)}`;
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
    }

    // Load the route
    this.loadRoute(path, { anchor, queryString });
  }

  /**
   * Load a route
   * @param {string} path - Path to load
   * @param {object} options - Load options
   */
  async loadRoute(path, options = {}) {
    const { anchor = '', queryString = '' } = options;

    // Normalize path
    path = this.normalizePath(path);

    const route = this.routes[path];

    if (!route) {
      this.log('Route not found', { path }, 'warn');
      if (this.config.enable404) {
        this.show404(path);
      }
      return;
    }

    // Set loading state
    this.setLoading(true);

    // Update current path
    this.currentPath = path;

    // Update document title
    document.title = route.title;

    this.log('Loading route', { path, file: route.file, anchor, queryString });

    try {
      // Fetch content
      const response = await fetch(route.file);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Extract body content if it's a full HTML document
      const content = this.extractContent(html);

      // Update app container
      this.appContainer.innerHTML = content;

      // Execute scripts in the loaded content
      this.executeScripts(this.appContainer);

      // Handle anchor scrolling
      if (anchor) {
        setTimeout(() => {
          const element = document.querySelector(anchor);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        // Scroll to top
        window.scrollTo(0, 0);
      }

      this.log('Route loaded', { path });

      // Emit route change event with query params
      this.emit('route:change', { path, route, queryString });

    } catch (error) {
      console.error('[Router] Failed to load route:', error);
      this.showError(error);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Extract content from HTML
   * If it's a full HTML document, extract body content
   * Otherwise, return as-is
   */
  extractContent(html) {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);

    if (bodyMatch) {
      return bodyMatch[1];
    }

    return html;
  }

  /**
   * Execute scripts in loaded content
   */
  executeScripts(container) {
    const scripts = container.querySelectorAll('script');

    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');

      // Copy attributes
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });

      // Copy content
      newScript.textContent = oldScript.textContent;

      // Replace old script with new one (to execute it)
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }

  /**
   * Set loading state
   */
  setLoading(isLoading) {
    this.isLoading = isLoading;

    if (isLoading) {
      this.appContainer.classList.add('loading');
      this.appContainer.setAttribute('aria-busy', 'true');
    } else {
      this.appContainer.classList.remove('loading');
      this.appContainer.setAttribute('aria-busy', 'false');
    }
  }

  /**
   * Show 404 page
   */
  show404(path) {
    this.appContainer.innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <h1 style="font-size: 72px; margin: 0;">404</h1>
        <p style="font-size: 24px; margin: 20px 0;">Page not found</p>
        <p style="color: #666;">The page <code>${path}</code> does not exist.</p>
        <a href="/" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px;">
          Go Home
        </a>
      </div>
    `;
  }

  /**
   * Show error page
   */
  showError(error) {
    this.appContainer.innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <h1 style="font-size: 48px; margin: 0; color: #e74c3c;">Error</h1>
        <p style="font-size: 18px; margin: 20px 0;">Failed to load page</p>
        <p style="color: #666;">${error.message}</p>
        <button onclick="location.reload()" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
          Reload Page
        </button>
      </div>
    `;
  }

  /**
   * Normalize path
   */
  normalizePath(path) {
    // Remove query params and anchors for route matching
    const urlParts = path.split(/[?#]/);
    path = urlParts[0];

    // Remove file extensions (.html, .htm)
    path = path.replace(/\.(html?|php)$/i, '');

    // Case normalization (convert to lowercase)
    path = path.toLowerCase();

    // Remove trailing slash
    if (path !== '/' && path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    // Ensure leading slash
    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    // Handle fallback routes (e.g., /business/anything → /business)
    const pathSegments = path.split('/').filter(Boolean);
    if (pathSegments.length > 1) {
      // Check if first segment is a valid route
      const potentialRoute = '/' + pathSegments[0];
      if (this.routes[potentialRoute] && !this.routes[path]) {
        path = potentialRoute;
      }
    }

    return path;
  }

  /**
   * Detect platform
   */
  detectPlatform() {
    const ua = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();

    if (platform.includes('mac')) {
      return 'mac';
    } else if (platform.includes('win')) {
      return 'windows';
    } else if (platform.includes('linux')) {
      return 'linux';
    } else if (ua.includes('iphone') || ua.includes('ipad')) {
      return 'ios';
    } else if (ua.includes('android')) {
      return 'android';
    } else {
      return 'unknown';
    }
  }

  /**
   * Emit custom event
   */
  emit(eventName, data) {
    const event = new CustomEvent(eventName, { detail: data });
    window.dispatchEvent(event);
  }

  /**
   * Log (only in debug mode)
   */
  log(message, data = null, level = 'info') {
    if (!this.config.debug) return;

    const prefix = '[Router]';

    if (level === 'warn') {
      console.warn(prefix, message, data);
    } else if (level === 'error') {
      console.error(prefix, message, data);
    } else {
      console.log(prefix, message, data);
    }
  }

  /**
   * Get current route
   */
  getCurrentRoute() {
    return {
      path: this.currentPath,
      route: this.routes[this.currentPath]
    };
  }

  /**
   * Get all routes
   */
  getRoutes() {
    return { ...this.routes };
  }

  /**
   * Add route dynamically
   */
  addRoute(path, route) {
    this.routes[path] = route;

    // Add hash route mapping
    if (path !== '/') {
      this.hashRoutes[`#${path.slice(1)}`] = path;
      this.hashRoutes[`#!${path.slice(1)}`] = path;
    }

    this.log('Route added', { path, route });
  }

  /**
   * Remove route
   */
  removeRoute(path) {
    delete this.routes[path];

    if (path !== '/') {
      delete this.hashRoutes[`#${path.slice(1)}`];
      delete this.hashRoutes[`#!${path.slice(1)}`];
    }

    this.log('Route removed', { path });
  }

  /**
   * Get query parameters from current URL
   * @returns {Object} Query parameters as key-value pairs
   */
  getQueryParams() {
    const params = {};
    const queryString = window.location.search.substring(1);

    if (!queryString) return params;

    const pairs = queryString.split('&');
    pairs.forEach(pair => {
      const [key, value] = pair.split('=');
      if (key) {
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      }
    });

    return params;
  }

  /**
   * Get specific query parameter
   * @param {string} key - Parameter key
   * @param {*} defaultValue - Default value if not found
   * @returns {string} Parameter value
   */
  getQueryParam(key, defaultValue = null) {
    const params = this.getQueryParams();
    return params[key] !== undefined ? params[key] : defaultValue;
  }
}

// Auto-initialize router when DOM is ready
if (typeof window !== 'undefined') {
  let router;

  function initRouter() {
    router = new UniversalRouter({
      debug: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    });
    router.init();

    // Make router globally accessible
    window.CALOS = window.CALOS || {};
    window.CALOS.router = router;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRouter);
  } else {
    initRouter();
  }
}

// Export for use as module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UniversalRouter;
}
