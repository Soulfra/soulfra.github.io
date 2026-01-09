/**
 * Soulfra Component Loader
 *
 * Dynamically loads and injects HTML components into pages.
 * Supports Header, Footer, and Breadcrumb navigation.
 *
 * Usage:
 *   <div data-component="header"></div>
 *   <div data-component="footer"></div>
 *   <div data-component="breadcrumb"></div>
 *
 * Or programmatically:
 *   SoulframponentLoader.load('header', '#header-container');
 */

class SoulfraComponentLoader {
  constructor() {
    this.baseUrl = this.detectBaseUrl();
    this.components = {
      header: `${this.baseUrl}/components/Header.html`,
      footer: `${this.baseUrl}/components/Footer.html`,
      breadcrumb: `${this.baseUrl}/components/Breadcrumb.html`
    };
    this.cache = new Map();
    this.loaded = new Set();
  }

  /**
   * Auto-detect base URL based on current location
   */
  detectBaseUrl() {
    const hostname = window.location.hostname;

    // GitHub Pages detection
    if (hostname.includes('github.io')) {
      const path = window.location.pathname;
      // If we're in a subdomain folder (e.g., /calriven/), go up one level
      if (path.match(/^\/(calriven|cringeproof|deathtodata|soulfra)\//)) {
        return '..';
      }
      return '.';
    }

    // Production domains
    if (hostname.match(/\.(calriven|cringeproof|deathtodata|soulfra)\.com$/)) {
      return '';
    }

    // Local development
    return '.';
  }

  /**
   * Load a component by name
   * @param {string} name - Component name (header, footer, breadcrumb)
   * @param {string|HTMLElement} target - Target selector or element
   * @param {object} options - Optional configuration
   */
  async load(name, target, options = {}) {
    const componentUrl = this.components[name];
    if (!componentUrl) {
      console.error(`Component "${name}" not found`);
      return false;
    }

    // Get target element
    const targetEl = typeof target === 'string'
      ? document.querySelector(target)
      : target;

    if (!targetEl) {
      console.error(`Target element not found: ${target}`);
      return false;
    }

    try {
      // Check cache first
      let html;
      if (this.cache.has(name) && !options.noCache) {
        html = this.cache.get(name);
      } else {
        const response = await fetch(componentUrl);
        if (!response.ok) {
          throw new Error(`Failed to load component: ${response.statusText}`);
        }
        html = await response.text();
        this.cache.set(name, html);
      }

      // Inject HTML
      targetEl.innerHTML = html;
      this.loaded.add(name);

      // Execute scripts in the component
      this.executeScripts(targetEl);

      // Emit custom event
      window.dispatchEvent(new CustomEvent('soulfra:component:loaded', {
        detail: { name, target: targetEl }
      }));

      return true;
    } catch (error) {
      console.error(`Error loading component "${name}":`, error);
      return false;
    }
  }

  /**
   * Execute scripts found in injected HTML
   * @param {HTMLElement} container - Container element
   */
  executeScripts(container) {
    const scripts = container.querySelectorAll('script');
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }

  /**
   * Load all components with data-component attribute
   */
  async loadAll() {
    const components = document.querySelectorAll('[data-component]');
    const promises = [];

    components.forEach(el => {
      const componentName = el.getAttribute('data-component');
      const promise = this.load(componentName, el);
      promises.push(promise);
    });

    await Promise.all(promises);
    console.log('✅ All Soulfra components loaded');
  }

  /**
   * Preload components for faster subsequent loads
   * @param {string[]} names - Component names to preload
   */
  async preload(names = ['header', 'footer']) {
    const promises = names.map(async name => {
      const url = this.components[name];
      if (!url) return;

      try {
        const response = await fetch(url);
        const html = await response.text();
        this.cache.set(name, html);
      } catch (error) {
        console.warn(`Failed to preload component "${name}":`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Check if a component is loaded
   * @param {string} name - Component name
   */
  isLoaded(name) {
    return this.loaded.has(name);
  }

  /**
   * Clear cache for a component
   * @param {string} name - Component name (or 'all')
   */
  clearCache(name = 'all') {
    if (name === 'all') {
      this.cache.clear();
    } else {
      this.cache.delete(name);
    }
  }
}

// Create global instance
window.SoulfraComponents = new SoulfraComponentLoader();

// Auto-load components when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.SoulfraComponents.loadAll();
  });
} else {
  window.SoulfraComponents.loadAll();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoulfraComponentLoader;
}
