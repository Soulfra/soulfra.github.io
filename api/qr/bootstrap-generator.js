/**
 * Calriven Bootstrap QR Code Generator
 *
 * Generates the "master" QR code that bootstraps the entire
 * Calriven development system.
 *
 * Scanning this QR code opens the Calriven Build Studio where
 * you can use the ensemble to iteratively build calriven.com features.
 *
 * Features:
 * - Master bootstrap QR (starts the system)
 * - Feature-specific QRs (install individual features)
 * - Tracking IDs for analytics
 * - Viral distribution metrics
 *
 * Usage:
 *   const generator = new CalrivenBootstrapQR();
 *   const qr = await generator.generateBootstrapQR();
 *   // Returns QR code data URL
 */

class CalrivenBootstrapQR {
  constructor(options = {}) {
    this.baseURL = options.baseURL || 'https://soulfra.github.io';
    this.trackingEnabled = options.trackingEnabled !== false;

    // QR code types
    this.qrTypes = {
      bootstrap: {
        name: 'Calriven Bootstrap',
        description: 'Start building Calriven features with ensemble AI',
        targetURL: '/pages/build/calriven-studio.html',
        icon: '🚀',
        color: '#667eea'
      },
      feature: {
        name: 'Feature Installer',
        description: 'Install a specific Calriven feature',
        targetURL: '/calriven/install/',
        icon: '⚡',
        color: '#764ba2'
      },
      demo: {
        name: 'Ensemble Demo',
        description: 'Try the AI ensemble',
        targetURL: '/pages/chat/chatbox.html?domain=calriven&mode=ensemble',
        icon: '🎭',
        color: '#61dafb'
      },
      share: {
        name: 'Share Build',
        description: 'Share your Calriven build with others',
        targetURL: '/calriven/share/',
        icon: '🔗',
        color: '#667eea'
      }
    };

    // Track generated QR codes
    this.generatedQRs = [];
  }

  /**
   * Generate master bootstrap QR code
   */
  async generateBootstrapQR(options = {}) {
    const {
      domain = 'calriven',
      tracking = true,
      customMessage = null
    } = options;

    const trackingID = tracking ? this.generateTrackingID('bootstrap') : null;

    const qrData = {
      type: 'bootstrap',
      url: this.buildURL('bootstrap', { domain, trackingID }),
      metadata: {
        timestamp: Date.now(),
        domain,
        trackingID,
        version: '1.0.0',
        message: customMessage || 'Scan to start building Calriven with AI ensemble'
      }
    };

    console.log('🚀 Generated bootstrap QR code:', qrData.url);

    // Save to tracking
    if (tracking) {
      this.saveQRTracking(qrData);
    }

    return qrData;
  }

  /**
   * Generate feature installation QR code
   */
  async generateFeatureQR(featureName, options = {}) {
    const {
      featurePath = null,
      tracking = true,
      description = null
    } = options;

    const trackingID = tracking ? this.generateTrackingID('feature', featureName) : null;

    const qrData = {
      type: 'feature',
      feature: featureName,
      url: this.buildURL('feature', {
        feature: featurePath || featureName,
        trackingID
      }),
      metadata: {
        timestamp: Date.now(),
        featureName,
        featurePath: featurePath || `/calriven/${featureName}.html`,
        trackingID,
        description: description || `Install ${featureName} feature`,
        version: '1.0.0'
      }
    };

    console.log(`⚡ Generated feature QR for ${featureName}:`, qrData.url);

    // Save to tracking
    if (tracking) {
      this.saveQRTracking(qrData);
    }

    return qrData;
  }

  /**
   * Generate demo QR code
   */
  async generateDemoQR(options = {}) {
    const {
      mode = 'ensemble',
      domain = 'calriven',
      tracking = true
    } = options;

    const trackingID = tracking ? this.generateTrackingID('demo') : null;

    const qrData = {
      type: 'demo',
      url: this.buildURL('demo', { mode, domain, trackingID }),
      metadata: {
        timestamp: Date.now(),
        mode,
        domain,
        trackingID,
        description: `Try Calriven AI ensemble in ${mode} mode`,
        version: '1.0.0'
      }
    };

    console.log('🎭 Generated demo QR code:', qrData.url);

    // Save to tracking
    if (tracking) {
      this.saveQRTracking(qrData);
    }

    return qrData;
  }

  /**
   * Build full URL with parameters
   */
  buildURL(qrType, params = {}) {
    const typeConfig = this.qrTypes[qrType];
    if (!typeConfig) {
      throw new Error(`Unknown QR type: ${qrType}`);
    }

    let url = this.baseURL + typeConfig.targetURL;

    // Add query parameters
    const queryParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined) {
        queryParams.append(key, value);
      }
    }

    const queryString = queryParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }

    return url;
  }

  /**
   * Generate unique tracking ID
   */
  generateTrackingID(type, identifier = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const prefix = type.substring(0, 3).toUpperCase();
    const suffix = identifier ? `-${identifier.substring(0, 6)}` : '';

    return `${prefix}-${timestamp}-${random}${suffix}`;
  }

  /**
   * Save QR code to tracking database
   */
  saveQRTracking(qrData) {
    this.generatedQRs.push({
      ...qrData,
      stats: {
        scans: 0,
        installs: 0,
        shares: 0,
        lastScan: null
      },
      createdAt: new Date().toISOString()
    });

    // Save to localStorage for browser-side tracking
    if (typeof localStorage !== 'undefined') {
      const existing = JSON.parse(localStorage.getItem('calriven_qr_tracking') || '[]');
      existing.push(qrData);
      localStorage.setItem('calriven_qr_tracking', JSON.stringify(existing));
    }

    console.log(`💾 Saved QR tracking for ${qrData.type}:`, qrData.metadata.trackingID);
  }

  /**
   * Get QR code statistics
   */
  getQRStats(trackingID = null) {
    if (trackingID) {
      const qr = this.generatedQRs.find(q => q.metadata.trackingID === trackingID);
      return qr ? qr.stats : null;
    }

    // Return all stats
    return {
      total: this.generatedQRs.length,
      byType: this.generatedQRs.reduce((acc, qr) => {
        acc[qr.type] = (acc[qr.type] || 0) + 1;
        return acc;
      }, {}),
      totalScans: this.generatedQRs.reduce((sum, qr) => sum + qr.stats.scans, 0),
      totalInstalls: this.generatedQRs.reduce((sum, qr) => sum + qr.stats.installs, 0)
    };
  }

  /**
   * Record QR code scan
   */
  recordScan(trackingID) {
    const qr = this.generatedQRs.find(q => q.metadata.trackingID === trackingID);
    if (qr) {
      qr.stats.scans++;
      qr.stats.lastScan = new Date().toISOString();
      console.log(`📊 Scan recorded for ${trackingID}: ${qr.stats.scans} total scans`);
      return true;
    }
    return false;
  }

  /**
   * Record feature installation
   */
  recordInstall(trackingID) {
    const qr = this.generatedQRs.find(q => q.metadata.trackingID === trackingID);
    if (qr) {
      qr.stats.installs++;
      console.log(`📊 Install recorded for ${trackingID}: ${qr.stats.installs} total installs`);
      return true;
    }
    return false;
  }

  /**
   * Generate QR code as data URL (browser-compatible)
   */
  async generateQRDataURL(qrData, options = {}) {
    const {
      size = 256,
      errorCorrectionLevel = 'M',
      margin = 4,
      darkColor = '#000000',
      lightColor = '#FFFFFF'
    } = options;

    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      console.warn('⚠️ QR code generation requires browser environment or QR library');
      return qrData.url;
    }

    // Use QRCode.js library if available
    if (typeof window.QRCode !== 'undefined') {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const qrcode = new window.QRCode(canvas, {
          text: qrData.url,
          width: size,
          height: size,
          colorDark: darkColor,
          colorLight: lightColor,
          correctLevel: window.QRCode.CorrectLevel[errorCorrectionLevel]
        });

        // Convert canvas to data URL
        setTimeout(() => {
          resolve(canvas.toDataURL('image/png'));
        }, 100);
      });
    }

    // Fallback: return text URL
    return qrData.url;
  }

  /**
   * Export all QR codes as JSON
   */
  exportQRCodes() {
    return {
      version: '1.0.0',
      exported: new Date().toISOString(),
      qrCodes: this.generatedQRs,
      stats: this.getQRStats()
    };
  }

  /**
   * Import QR codes from JSON
   */
  importQRCodes(json) {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json;
      this.generatedQRs = data.qrCodes || [];
      console.log(`📥 Imported ${this.generatedQRs.length} QR codes`);
      return true;
    } catch (error) {
      console.error('❌ Failed to import QR codes:', error);
      return false;
    }
  }
}

// Browser export
if (typeof window !== 'undefined') {
  window.CalrivenBootstrapQR = CalrivenBootstrapQR;
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CalrivenBootstrapQR;
}
