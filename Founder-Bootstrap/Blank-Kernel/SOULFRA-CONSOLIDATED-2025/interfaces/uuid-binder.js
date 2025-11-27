// UUID Binder - Device fingerprinting and vault initialization
(function() {
    // Generate device fingerprint
    function generateDeviceHash() {
        const nav = window.navigator;
        const screen = window.screen;
        const fingerprint = [
            nav.userAgent,
            nav.language,
            screen.width + 'x' + screen.height,
            screen.colorDepth,
            new Date().getTimezoneOffset(),
            nav.hardwareConcurrency || 'unknown',
            nav.platform
        ].join('|');
        
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        return Math.abs(hash).toString(16);
    }
    
    // Generate UUID v4
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    // Main binding function
    window.bindDevice = async function() {
        const uuid = generateUUID();
        const deviceHash = generateDeviceHash();
        const timestamp = new Date().toISOString();
        
        // Store in localStorage
        localStorage.setItem('infinity-uuid', uuid);
        localStorage.setItem('device-hash', deviceHash);
        localStorage.setItem('bind-timestamp', timestamp);
        
        // Prepare payload
        const payload = {
            uuid: uuid,
            origin: 'qr-fake-test',
            deviceHash: deviceHash,
            timestamp: timestamp,
            tier: -12
        };
        
        console.log('Device binding payload:', payload);
        
        // Update UI
        const indicator = document.getElementById('binding-status');
        if (indicator) {
            indicator.textContent = `UUID: ${uuid.substring(0, 8)}...`;
        }
        
        // POST to Infinity Router (simulated here since we're client-side)
        try {
            // In a real implementation, this would POST to the backend
            // For now, we'll simulate by calling the router directly
            if (typeof initializeVault === 'function') {
                await initializeVault(payload);
            }
            
            // Trigger redirect after short delay
            setTimeout(() => {
                if (typeof redirectToTier11 === 'function') {
                    redirectToTier11(uuid);
                }
            }, 1500);
        } catch (error) {
            console.error('Binding failed:', error);
            if (indicator) {
                indicator.textContent = 'Binding failed';
                indicator.style.color = '#f44336';
            }
        }
    };
    
    // Check if already bound
    window.checkExistingBinding = function() {
        const existingUUID = localStorage.getItem('infinity-uuid');
        if (existingUUID) {
            console.log('Existing UUID found:', existingUUID);
            return {
                uuid: existingUUID,
                deviceHash: localStorage.getItem('device-hash'),
                timestamp: localStorage.getItem('bind-timestamp')
            };
        }
        return null;
    };
    
    // Auto-check on load
    document.addEventListener('DOMContentLoaded', () => {
        const existing = checkExistingBinding();
        if (existing) {
            console.log('Device already bound:', existing);
            // Optionally auto-redirect
            // redirectToTier11(existing.uuid);
        }
    });
})();