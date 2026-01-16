/**
 * QR Adapter
 *
 * Bridges new CalrivenBootstrapQR (browser) with existing
 * infrastructure/qr-generator.js (Node.js).
 *
 * This adapter provides a UNIFIED interface that works in both
 * environments, routing to the appropriate backend.
 *
 * Purpose: INTEGRATION not DUPLICATION
 * - Browser → Use CalrivenBootstrapQR
 * - Node.js → Use existing QRGenerator
 *
 * Usage:
 *   const qr = new QRAdapter();
 *   const result = await qr.generateQR('feature', { name: 'model-selector' });
 */

class QRAdapter {
  constructor(options = {}) {
    this.options = options;

    // Detect environment
    this.isNode = typeof process !== 'undefined' &&
                  process.versions != null &&
                  process.versions.node != null;

    this.isBrowser = typeof window !== 'undefined';

    // Initialize appropriate backend
    this.initializeBackend();

    console.log(`📱 QRAdapter initialized (${this.isNode ? 'Node.js' : 'Browser'} mode)`);
  }

  /**
   * Initialize backend based on environment
   */
  initializeBackend() {
    if (this.isNode) {
      // Node.js: Use existing infrastructure/qr-generator.js
      try {
        const path = require('path');
        const QRGenerator = require(path.join(__dirname, '../../infrastructure/qr-generator.js'));
        this.backend = new QRGenerator();
        this.backendType = 'legacy';
        console.log('✅ Using existing infrastructure/qr-generator.js');
      } catch (error) {
        console.warn('⚠️ Could not load infrastructure/qr-generator.js:', error.message);
        this.backend = null;
        this.backendType = 'none';
      }
    } else if (this.isBrowser) {
      // Browser: Use new CalrivenBootstrapQR
      if (typeof CalrivenBootstrapQR !== 'undefined') {
        this.backend = new CalrivenBootstrapQR(this.options);
        this.backendType = 'modern';
        console.log('✅ Using CalrivenBootstrapQR (browser)');
      } else {
        console.warn('⚠️ CalrivenBootstrapQR not loaded');
        this.backend = null;
        this.backendType = 'none';
      }
    }
  }

  /**
   * Generate QR code (unified interface)
   *
   * @param {string} type - QR type: 'bootstrap', 'feature', 'demo', 'share'
   * @param {object} data - QR data
   * @returns {Promise<object>} QR code data
   */
  async generateQR(type, data = {}) {
    if (!this.backend) {
      throw new Error('No QR backend available');
    }

    console.log(`🔨 Generating ${type} QR code...`);

    // Route to appropriate method based on backend
    if (this.backendType === 'legacy') {
      return await this.generateLegacyQR(type, data);
    } else if (this.backendType === 'modern') {
      return await this.generateModernQR(type, data);
    }
  }

  /**
   * Generate QR using legacy infrastructure/qr-generator.js
   */
  async generateLegacyQR(type, data) {
    // Map modern types to legacy types
    const typeMap = {
      'bootstrap': 'platform-demo',
      'feature': 'agent-share',
      'demo': 'experience-invite',
      'share': 'fork-invite'
    };

    const legacyType = typeMap[type] || type;

    // Use existing QR generator
    const result = await this.backend.generateQRCode(legacyType, data);

    // Normalize result to unified format
    return {
      type: type,
      url: result.url || result.qrData?.url,
      trackingID: result.trackingID || result.qrID,
      metadata: {
        ...data,
        backend: 'legacy',
        timestamp: Date.now()
      },
      qrData: result
    };
  }

  /**
   * Generate QR using modern CalrivenBootstrapQR
   */
  async generateModernQR(type, data) {
    let result;

    // Route to appropriate method
    switch (type) {
      case 'bootstrap':
        result = await this.backend.generateBootstrapQR(data);
        break;

      case 'feature':
        result = await this.backend.generateFeatureQR(
          data.name || data.feature,
          data
        );
        break;

      case 'demo':
        result = await this.backend.generateDemoQR(data);
        break;

      case 'share':
        // Fallback to bootstrap for share
        result = await this.backend.generateBootstrapQR({
          ...data,
          customMessage: 'Share this build'
        });
        break;

      default:
        throw new Error(`Unknown QR type: ${type}`);
    }

    // Already in unified format
    return {
      ...result,
      metadata: {
        ...result.metadata,
        backend: 'modern'
      }
    };
  }

  /**
   * Get QR statistics (unified interface)
   */
  getStats(trackingID = null) {
    if (!this.backend) {
      return null;
    }

    if (this.backendType === 'legacy') {
      return this.backend.affiliateStats || {};
    } else if (this.backendType === 'modern') {
      return this.backend.getQRStats(trackingID);
    }
  }

  /**
   * Record QR scan
   */
  recordScan(trackingID) {
    if (!this.backend) {
      return false;
    }

    if (this.backendType === 'legacy') {
      // Legacy system may not support this
      console.log('📊 Scan tracking not implemented in legacy backend');
      return false;
    } else if (this.backendType === 'modern') {
      return this.backend.recordScan(trackingID);
    }
  }

  /**
   * Record feature installation
   */
  recordInstall(trackingID) {
    if (!this.backend) {
      return false;
    }

    if (this.backendType === 'legacy') {
      // Legacy system uses different tracking
      console.log('📊 Install tracking not implemented in legacy backend');
      return false;
    } else if (this.backendType === 'modern') {
      return this.backend.recordInstall(trackingID);
    }
  }

  /**
   * Generate QR code as data URL
   */
  async generateDataURL(qrData, options = {}) {
    if (!this.backend) {
      return qrData.url; // Fallback to text URL
    }

    if (this.backendType === 'modern' && this.backend.generateQRDataURL) {
      return await this.backend.generateQRDataURL(qrData, options);
    }

    // Fallback: return text URL
    return qrData.url;
  }

  /**
   * Export QR codes
   */
  exportQRCodes() {
    if (!this.backend) {
      return { qrCodes: [] };
    }

    if (this.backendType === 'modern' && this.backend.exportQRCodes) {
      return this.backend.exportQRCodes();
    }

    return { qrCodes: [] };
  }

  /**
   * Import QR codes
   */
  importQRCodes(json) {
    if (!this.backend) {
      return false;
    }

    if (this.backendType === 'modern' && this.backend.importQRCodes) {
      return this.backend.importQRCodes(json);
    }

    return false;
  }

  /**
   * Get backend info
   */
  getBackendInfo() {
    return {
      environment: this.isNode ? 'Node.js' : 'Browser',
      backendType: this.backendType,
      backendAvailable: this.backend !== null,
      capabilities: this.getCapabilities()
    };
  }

  /**
   * Get available capabilities
   */
  getCapabilities() {
    if (!this.backend) {
      return [];
    }

    const capabilities = ['generate', 'stats'];

    if (this.backendType === 'modern') {
      capabilities.push('scan-tracking', 'install-tracking', 'data-url', 'export', 'import');
    }

    if (this.backendType === 'legacy') {
      capabilities.push('affiliate-tracking', 'vault-integration');
    }

    return capabilities;
  }

  /**
   * Check if adapter is ready
   */
  isReady() {
    return this.backend !== null;
  }

  /**
   * Get recommended QR type for use case
   */
  getRecommendedType(useCase) {
    const recommendations = {
      'start-development': 'bootstrap',
      'install-feature': 'feature',
      'try-ensemble': 'demo',
      'share-build': 'share',
      'invite-user': 'share',
      'deploy-feature': 'feature'
    };

    return recommendations[useCase] || 'bootstrap';
  }
}

// Browser export
if (typeof window !== 'undefined') {
  window.QRAdapter = QRAdapter;
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QRAdapter;
}
