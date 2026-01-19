/**
 * DeathToData - Shared JavaScript
 * Matrix animation, VIBES tracking, PWA registration
 */

// API URL configuration (always use localhost for local development)
const API_URL = 'http://localhost:5051';

// VIBES Management
let vibesBalance = parseFloat(localStorage.getItem('vibes') || '0');

function updateVibesDisplay() {
  const balanceEl = document.getElementById('vibesBalance');
  const usdEl = document.getElementById('usdValue');

  if (balanceEl) {
    balanceEl.textContent = vibesBalance.toFixed(1);
  }

  if (usdEl) {
    usdEl.textContent = (vibesBalance * 0.15).toFixed(2);
  }
}

function awardVibes(amount) {
  vibesBalance += amount;
  localStorage.setItem('vibes', vibesBalance.toFixed(1));
  updateVibesDisplay();

  // Show notification if element exists
  const notification = document.getElementById('vibesNotification');
  if (notification) {
    notification.classList.add('show');
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }
}

// Initialize VIBES display on page load
document.addEventListener('DOMContentLoaded', () => {
  updateVibesDisplay();
});

// Matrix Binary Rain Animation
function initMatrixRain() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return; // Skip if no canvas element

  const ctx = canvas.getContext('2d');
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;

  const letters = '01';
  const fontSize = 14;
  const columns = canvas.width / fontSize;
  const drops = Array(Math.floor(columns)).fill(1);

  function draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(251, 0, 68, 0.3)';
    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
      const text = letters.charAt(Math.floor(Math.random() * letters.length));
      const x = i * fontSize;
      const y = drops[i] * fontSize;
      ctx.fillText(text, x, y);

      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i] += 0.7;
    }
  }

  setInterval(draw, 33);

  // Resize canvas on window resize
  window.addEventListener('resize', () => {
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
  });
}

// Initialize Matrix animation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initMatrixRain();
});

// PWA Service Worker Registration
// Disabled on localhost for development (prevents aggressive caching)
if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('✅ DeathToData PWA: Service Worker registered'))
      .catch(err => console.error('❌ Service Worker failed:', err));
  });
} else if (window.location.hostname === 'localhost') {
  console.log('🚫 Service Worker disabled on localhost (development mode)');
  // Unregister any existing service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let registration of registrations) {
        registration.unregister();
        console.log('🗑️ Unregistered old service worker');
      }
    });
  }
}

// Utility: HTML escaping for user-generated content
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    API_URL,
    updateVibesDisplay,
    awardVibes,
    initMatrixRain,
    escapeHtml
  };
}
