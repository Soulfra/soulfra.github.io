/**
 * Theme Switcher (Browser Version)
 *
 * Client-side theme management for GitHub Pages
 * Supports multi-brand themes with localStorage persistence
 *
 * Usage:
 * const themeSwitcher = new ThemeSwitcher();
 * themeSwitcher.init(); // Loads saved theme or default
 * themeSwitcher.switchTheme('soulfra'); // Switch to specific theme
 */

class ThemeSwitcher {
  constructor(options = {}) {
    this.currentTheme = null;
    this.storageKey = options.storageKey || 'soulfra_theme';
    this.themesDir = options.themesDir || './themes';

    // Available brand themes
    this.themes = {
      soulfra: {
        name: 'soulfra',
        label: 'Soulfra (High Contrast)',
        css: 'soulfra.css',
        tagline: 'Universal Identity Without KYC',
        colors: {
          primary: '#3498db',
          secondary: '#2ecc71',
          accent: '#e74c3c'
        }
      },
      calriven: {
        name: 'calriven',
        label: 'Calriven (Dark)',
        css: 'calriven.css',
        tagline: 'AI-Powered Growth',
        colors: {
          primary: '#9b59b6',
          secondary: '#3498db',
          accent: '#1abc9c'
        }
      },
      calos: {
        name: 'calos',
        label: 'CALOS (Minimal)',
        css: 'calos.css',
        tagline: 'Community-Driven AI',
        colors: {
          primary: '#34495e',
          secondary: '#95a5a6',
          accent: '#2c3e50'
        }
      }
    };

    console.log('[ThemeSwitcher] Initialized with', Object.keys(this.themes).length, 'themes');
  }

  /**
   * Initialize theme system
   * Loads saved theme or defaults to first available
   */
  init() {
    // Try to load saved theme
    const savedTheme = this.getSavedTheme();

    if (savedTheme && this.themes[savedTheme]) {
      this.loadTheme(savedTheme);
    } else {
      // Default to first theme (soulfra)
      const defaultTheme = Object.keys(this.themes)[0];
      this.loadTheme(defaultTheme);
    }

    // Add theme switcher UI if container exists
    this.renderSwitcherUI();

    console.log('[ThemeSwitcher] Initialized with theme:', this.currentTheme);
  }

  /**
   * Get saved theme from localStorage
   */
  getSavedTheme() {
    try {
      return localStorage.getItem(this.storageKey);
    } catch (error) {
      console.warn('[ThemeSwitcher] localStorage not available:', error);
      return null;
    }
  }

  /**
   * Save theme to localStorage
   */
  saveTheme(themeName) {
    try {
      localStorage.setItem(this.storageKey, themeName);
    } catch (error) {
      console.warn('[ThemeSwitcher] Could not save theme:', error);
    }
  }

  /**
   * Load theme CSS file
   */
  loadTheme(themeName) {
    if (!this.themes[themeName]) {
      console.error('[ThemeSwitcher] Unknown theme:', themeName);
      return false;
    }

    const theme = this.themes[themeName];

    // Remove old theme link if exists
    const oldLink = document.getElementById('theme-css');
    if (oldLink) {
      oldLink.remove();
    }

    // Create new theme link
    const link = document.createElement('link');
    link.id = 'theme-css';
    link.rel = 'stylesheet';
    link.href = `${this.themesDir}/${theme.css}`;

    document.head.appendChild(link);

    this.currentTheme = themeName;
    this.saveTheme(themeName);

    // Update body data attribute for CSS targeting
    document.body.setAttribute('data-theme', themeName);

    // Dispatch theme change event
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: { theme: themeName, colors: theme.colors }
    }));

    console.log('[ThemeSwitcher] Loaded theme:', themeName);

    return true;
  }

  /**
   * Switch to a specific theme
   */
  switchTheme(themeName) {
    return this.loadTheme(themeName);
  }

  /**
   * Get current theme info
   */
  getCurrentTheme() {
    if (!this.currentTheme) {
      return null;
    }

    return {
      ...this.themes[this.currentTheme],
      current: true
    };
  }

  /**
   * Get all available themes
   */
  getAvailableThemes() {
    return Object.values(this.themes).map(theme => ({
      name: theme.name,
      label: theme.label,
      tagline: theme.tagline,
      colors: theme.colors,
      current: theme.name === this.currentTheme
    }));
  }

  /**
   * Render theme switcher UI
   */
  renderSwitcherUI() {
    // Check if theme-switcher container exists
    const container = document.getElementById('theme-switcher');
    if (!container) {
      return;
    }

    // Create select dropdown
    const select = document.createElement('select');
    select.id = 'theme-select';
    select.className = 'theme-select';

    // Add options
    Object.values(this.themes).forEach(theme => {
      const option = document.createElement('option');
      option.value = theme.name;
      option.textContent = theme.label;
      option.selected = theme.name === this.currentTheme;
      select.appendChild(option);
    });

    // Add change listener
    select.addEventListener('change', (e) => {
      this.switchTheme(e.target.value);
    });

    // Clear container and add select
    container.innerHTML = '<label for="theme-select">Theme:</label>';
    container.appendChild(select);
  }

  /**
   * Auto-detect theme from hostname
   */
  detectThemeFromHostname() {
    const hostname = window.location.hostname;

    // Check if hostname matches a brand
    for (const [themeName, theme] of Object.entries(this.themes)) {
      if (hostname.includes(themeName)) {
        return themeName;
      }
    }

    // Default to soulfra
    return 'soulfra';
  }

  /**
   * Apply theme based on current hostname
   */
  applyThemeByHostname() {
    const themeName = this.detectThemeFromHostname();
    return this.loadTheme(themeName);
  }

  /**
   * Get theme colors (for dynamic styling)
   */
  getThemeColors() {
    if (!this.currentTheme) {
      return null;
    }

    return this.themes[this.currentTheme].colors;
  }

  /**
   * Update CSS custom properties with theme colors
   */
  updateCSSVariables() {
    const colors = this.getThemeColors();
    if (!colors) {
      return;
    }

    const root = document.documentElement;
    root.style.setProperty('--theme-primary', colors.primary);
    root.style.setProperty('--theme-secondary', colors.secondary);
    root.style.setProperty('--theme-accent', colors.accent);
  }
}

// Auto-initialize if DOMContentLoaded
if (typeof window !== 'undefined') {
  window.ThemeSwitcher = ThemeSwitcher;

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!window.themeSwitcher) {
        window.themeSwitcher = new ThemeSwitcher();
        window.themeSwitcher.init();
      }
    });
  } else {
    // DOM already loaded
    if (!window.themeSwitcher) {
      window.themeSwitcher = new ThemeSwitcher();
      window.themeSwitcher.init();
    }
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeSwitcher;
}
