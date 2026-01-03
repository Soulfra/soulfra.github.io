/**
 * CringeProof Theme System
 *
 * Reskin the same HTML with different CSS variables.
 * Like TorBox - same infrastructure, different branding.
 */

const themes = {
  purple: {
    name: 'CringeProof Purple',
    tagline: 'Will your GME diamond hands age well?',
    vertical: 'purple',
    colors: {
      primary: '#9B59B6',
      secondary: '#8E44AD',
      background: '#1a1a2e',
      success: '#00C49A',
      cringe: '#FF4136'
    },
    focus: 'GameStop, AMC, DRS predictions'
  },

  sports: {
    name: 'CringeProof Sports',
    tagline: 'Will your sports takes age well?',
    vertical: 'sports',
    colors: {
      primary: '#FF6B35',
      secondary: '#004E89',
      background: '#1a1a2e',
      success: '#00C49A',
      cringe: '#FF4136'
    },
    focus: 'NFL, NBA, MLB, UFC predictions'
  },

  crypto: {
    name: 'CringeProof Crypto',
    tagline: 'Will your crypto calls age well?',
    vertical: 'crypto',
    colors: {
      primary: '#F7931A',
      secondary: '#627EEA',
      background: '#0f1419',
      success: '#00C49A',
      cringe: '#FF4136'
    },
    focus: 'BTC, ETH, altcoin price predictions'
  },

  politics: {
    name: 'CringeProof Politics',
    tagline: 'Will your political predictions age well?',
    vertical: 'politics',
    colors: {
      primary: '#DC143C',
      secondary: '#0015BC',
      background: '#1a1a2e',
      success: '#00C49A',
      cringe: '#FF4136'
    },
    focus: 'Elections, policy, approval ratings'
  }
};

/**
 * Apply theme to page
 */
function applyTheme(themeName) {
  const theme = themes[themeName];
  if (!theme) {
    console.error(`Theme "${themeName}" not found`);
    return;
  }

  // Update CSS variables
  document.documentElement.style.setProperty('--primary-color', theme.colors.primary);
  document.documentElement.style.setProperty('--secondary-color', theme.colors.secondary);
  document.documentElement.style.setProperty('--background', theme.colors.background);
  document.documentElement.style.setProperty('--success', theme.colors.success);
  document.documentElement.style.setProperty('--cringe', theme.colors.cringe);

  // Update page title/tagline
  document.title = theme.name;
  document.querySelector('h1').innerHTML = `🚫 ${theme.name.replace('CringeProof ', '')}`;
  document.querySelector('.tagline').textContent = theme.tagline;

  console.log(`✅ Applied theme: ${theme.name}`);
}

/**
 * Auto-detect theme from URL
 *
 * Examples:
 *   soulfra.github.io/cringeproof/sports  → sports theme
 *   soulfra.github.io/cringeproof/crypto  → crypto theme
 *   soulfra.github.io/cringeproof/purple  → purple theme
 */
function autoDetectTheme() {
  const path = window.location.pathname;

  if (path.includes('/sports')) return 'sports';
  if (path.includes('/crypto')) return 'crypto';
  if (path.includes('/purple')) return 'purple';
  if (path.includes('/politics')) return 'politics';

  // Default to purple (GME theme)
  return 'purple';
}

// Auto-apply theme on page load
window.addEventListener('DOMContentLoaded', () => {
  const theme = autoDetectTheme();
  applyTheme(theme);
});
