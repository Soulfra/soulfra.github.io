// QR Scan Handler - Manages QR code scanning and device pairing flow
class QRScanHandler {
    constructor() {
        this.scanning = false;
        this.stream = null;
        this.scanner = null;
        this.onScanCallback = null;
        this.lastScan = null;
        this.scanDebounce = 2000; // Prevent duplicate scans
    }
    
    async initialize(options = {}) {
        this.containerId = options.containerId || 'qr-scanner';
        this.onScanCallback = options.onScan || this.defaultScanHandler;
        
        // Check camera permissions
        const hasPermission = await this.checkCameraPermission();
        if (!hasPermission) {
            throw new Error('Camera permission required for QR scanning');
        }
        
        // Load QR scanning library (using qr-scanner or similar)
        await this.loadQRLibrary();
        
        console.log('📱 QR Scanner initialized');
    }
    
    async checkCameraPermission() {
        try {
            const result = await navigator.permissions.query({ name: 'camera' });
            return result.state === 'granted' || result.state === 'prompt';
        } catch {
            // Fallback for browsers that don't support permissions API
            return true;
        }
    }
    
    async loadQRLibrary() {
        // In production, load a QR scanning library
        // For now, we'll use native APIs with basic detection
        if (!('BarcodeDetector' in window)) {
            console.warn('BarcodeDetector not available, loading polyfill...');
            // Load polyfill or alternative library
        }
    }
    
    async startScanning() {
        if (this.scanning) return;
        
        try {
            // Get camera stream
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            // Create video element
            const container = document.getElementById(this.containerId);
            if (!container) {
                throw new Error('Scanner container not found');
            }
            
            const video = document.createElement('video');
            video.srcObject = this.stream;
            video.setAttribute('playsinline', '');
            video.style.width = '100%';
            video.style.height = '100%';
            video.style.objectFit = 'cover';
            
            container.innerHTML = '';
            container.appendChild(video);
            
            // Add scanning overlay
            this.addScanningOverlay(container);
            
            // Start video
            await video.play();
            
            this.scanning = true;
            
            // Start detection loop
            if ('BarcodeDetector' in window) {
                this.startBarcodeDetection(video);
            } else {
                this.startCanvasDetection(video);
            }
            
        } catch (error) {
            console.error('Failed to start scanning:', error);
            this.showError('Camera access denied or not available');
            throw error;
        }
    }
    
    async startBarcodeDetection(video) {
        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        
        const detect = async () => {
            if (!this.scanning) return;
            
            try {
                const barcodes = await detector.detect(video);
                
                if (barcodes.length > 0) {
                    const qrData = barcodes[0].rawValue;
                    this.handleQRCode(qrData);
                }
            } catch (error) {
                console.error('Detection error:', error);
            }
            
            if (this.scanning) {
                requestAnimationFrame(detect);
            }
        };
        
        detect();
    }
    
    startCanvasDetection(video) {
        // Fallback using canvas and jsQR or similar
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        const detect = () => {
            if (!this.scanning) return;
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            
            // Here you would use jsQR or similar library
            // const code = jsQR(imageData.data, imageData.width, imageData.height);
            // if (code) {
            //     this.handleQRCode(code.data);
            // }
            
            if (this.scanning) {
                requestAnimationFrame(detect);
            }
        };
        
        detect();
    }
    
    handleQRCode(data) {
        // Debounce duplicate scans
        if (this.lastScan === data && Date.now() - this.lastScanTime < this.scanDebounce) {
            return;
        }
        
        this.lastScan = data;
        this.lastScanTime = Date.now();
        
        console.log('QR Code detected:', data);
        
        // Vibrate on scan
        if ('vibrate' in navigator) {
            navigator.vibrate(200);
        }
        
        // Parse QR data
        let qrData;
        try {
            // Try to parse as base64 JSON
            const decoded = atob(data);
            qrData = JSON.parse(decoded);
        } catch {
            // Fallback to plain text
            qrData = { raw: data };
        }
        
        // Validate QR format
        if (!this.validateQRData(qrData)) {
            this.showError('Invalid QR code format');
            return;
        }
        
        // Stop scanning
        this.stopScanning();
        
        // Call callback
        if (this.onScanCallback) {
            this.onScanCallback(qrData);
        }
    }
    
    validateQRData(data) {
        // Validate MirrorOS QR format
        if (data.v && data.t && data.s) {
            // Version 2 format
            if (data.v === 2 && data.t === 'lock') {
                return true;
            }
            // Version 1 format (backward compatibility)
            if (data.v === 1 && data.t === 'pair') {
                return true;
            }
        }
        
        // Check for legacy formats
        if (data.raw && data.raw.startsWith('mirror://')) {
            return true;
        }
        
        return false;
    }
    
    async defaultScanHandler(qrData) {
        console.log('Default handler - QR Data:', qrData);
        
        // Show loading
        this.showLoading('Connecting to vault...');
        
        try {
            // Get device info
            const deviceInfo = this.getDeviceInfo();
            
            // Validate pairing
            const response = await fetch('/api/lock/pair', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: qrData.s,
                    pairingToken: qrData.k,
                    deviceInfo: deviceInfo
                })
            });
            
            const result = await response.json();
            
            if (result.valid) {
                // Save session
                localStorage.setItem('lockSessionId', qrData.s);
                
                // Show success
                this.showSuccess(result.greeting || 'Successfully paired!');
                
                // Redirect to lock UI
                setTimeout(() => {
                    window.location.href = `/mirror/ui/agent-lock.html?session=${qrData.s}`;
                }, 1500);
            } else {
                this.showError(result.reason || 'Pairing failed');
            }
        } catch (error) {
            console.error('Pairing error:', error);
            this.showError('Failed to connect to vault');
        }
    }
    
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform || 'unknown',
            screenSize: `${screen.width}x${screen.height}`,
            language: navigator.language,
            capabilities: {
                webWorkers: 'Worker' in window,
                webGL: this.checkWebGL(),
                audioAPI: 'AudioContext' in window || 'webkitAudioContext' in window,
                localStorage: this.checkLocalStorage(),
                indexedDB: 'indexedDB' in window
            }
        };
    }
    
    checkWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && 
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch {
            return false;
        }
    }
    
    checkLocalStorage() {
        try {
            localStorage.setItem('test', '1');
            localStorage.removeItem('test');
            return true;
        } catch {
            return false;
        }
    }
    
    stopScanning() {
        this.scanning = false;
        
        // Stop camera stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        // Clear container
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = '';
        }
    }
    
    addScanningOverlay(container) {
        const overlay = document.createElement('div');
        overlay.className = 'qr-overlay';
        overlay.innerHTML = `
            <div class="scan-region">
                <div class="corner top-left"></div>
                <div class="corner top-right"></div>
                <div class="corner bottom-left"></div>
                <div class="corner bottom-right"></div>
            </div>
            <div class="scan-line"></div>
            <div class="scan-instructions">Point camera at QR code</div>
        `;
        
        container.appendChild(overlay);
    }
    
    showLoading(message) {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="qr-status loading">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
    }
    
    showSuccess(message) {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="qr-status success">
                <div class="icon">✓</div>
                <p>${message}</p>
            </div>
        `;
    }
    
    showError(message) {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="qr-status error">
                <div class="icon">✗</div>
                <p>${message}</p>
                <button onclick="qrScanner.startScanning()">Try Again</button>
            </div>
        `;
    }
    
    async generateQRCode(data, elementId) {
        // Generate QR code for display (opposite of scanning)
        const qrData = {
            v: 2,
            t: 'lock',
            s: data.sessionId,
            k: data.pairingToken.substring(0, 16),
            e: data.expires,
            u: data.url
        };
        
        const qrString = btoa(JSON.stringify(qrData));
        
        // In production, use QR code generation library
        // For now, show data
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="qr-placeholder">
                    <p>QR Code Data:</p>
                    <code>${qrString}</code>
                </div>
            `;
        }
        
        return qrString;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QRScanHandler;
}

// Browser global
if (typeof window !== 'undefined') {
    window.QRScanHandler = QRScanHandler;
}