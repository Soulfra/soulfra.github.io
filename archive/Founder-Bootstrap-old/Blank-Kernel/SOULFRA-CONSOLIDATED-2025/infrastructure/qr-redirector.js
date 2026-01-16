// QR Redirector - Handles tier navigation after UUID confirmation
(function() {
    // Get the relative path to tier-minus11
    function getTier11Path() {
        // Calculate relative path based on current location
        // We're in tier-minus12, need to go up to tier-minus11
        return '../../qr-login.html';
    }
    
    // Redirect to Tier -11 with UUID
    window.redirectToTier11 = function(uuid) {
        if (!uuid) {
            console.error('No UUID provided for redirect');
            return;
        }
        
        const tier11Path = getTier11Path();
        const redirectUrl = `${tier11Path}?uuid=${uuid}`;
        
        console.log('Redirecting to Tier -11:', redirectUrl);
        
        // Update UI before redirect
        const indicator = document.getElementById('binding-status');
        if (indicator) {
            indicator.textContent = 'Entering mirror...';
            indicator.style.color = '#4caf50';
        }
        
        // Perform redirect
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 500);
    };
    
    // Initialize vault (client-side simulation)
    window.initializeVault = async function(payload) {
        // In a real implementation, this would be server-side
        // Here we simulate vault creation by storing metadata
        const vaultMeta = {
            uuid: payload.uuid,
            created: payload.timestamp,
            deviceHash: payload.deviceHash,
            origin: payload.origin,
            tier: payload.tier,
            vaultPath: `/vaults/user-${payload.uuid}/`
        };
        
        // Store vault metadata
        localStorage.setItem(`vault-${payload.uuid}`, JSON.stringify(vaultMeta));
        
        // Simulate vault structure creation
        console.log('Vault initialized:', vaultMeta);
        
        // Create default vault contents
        const vaultContents = {
            memory: [],
            blamechain: {
                entries: [],
                created: payload.timestamp
            },
            pulseStatus: {
                status: 'active',
                lastPulse: payload.timestamp,
                tier: -12
            },
            trustLog: [{
                event: 'vault_created',
                timestamp: payload.timestamp,
                uuid: payload.uuid,
                deviceHash: payload.deviceHash
            }]
        };
        
        // Store vault contents
        localStorage.setItem(`vault-contents-${payload.uuid}`, JSON.stringify(vaultContents));
        
        return vaultMeta;
    };
    
    // Check URL params on load (for direct access)
    document.addEventListener('DOMContentLoaded', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const directUUID = urlParams.get('uuid');
        
        if (directUUID) {
            console.log('Direct UUID access:', directUUID);
            // Auto-redirect if UUID provided
            setTimeout(() => redirectToTier11(directUUID), 1000);
        }
    });
})();