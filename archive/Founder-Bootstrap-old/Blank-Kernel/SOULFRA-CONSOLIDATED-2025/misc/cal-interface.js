// Cal Interface Client
class CalInterface {
    constructor() {
        this.apiUrl = 'http://localhost:8765/api';
        this.token = localStorage.getItem('cal-session-token');
        this.deviceId = localStorage.getItem('cal-device-id');
        
        this.init();
    }

    init() {
        // Check if authenticated
        if (!this.token || !this.deviceId) {
            this.showTrustShield();
            return;
        }

        // Hide trust shield, show interface
        document.getElementById('trust-shield').classList.remove('active');
        document.getElementById('cal-interface').classList.remove('hidden');

        // Setup event listeners
        document.getElementById('reflect-btn').addEventListener('click', () => this.reflect());
        document.getElementById('disconnect-btn').addEventListener('click', () => this.disconnect());

        // Load initial state
        this.loadVaultStatus();
        this.updateDeviceStatus();
    }

    showTrustShield() {
        document.getElementById('trust-shield').classList.add('active');
        document.getElementById('cal-interface').classList.add('hidden');
    }

    async loadVaultStatus() {
        try {
            const response = await fetch(`${this.apiUrl}/vault/status`, {
                headers: {
                    'X-Cal-Token': this.token,
                    'X-Device-ID': this.deviceId
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load vault status');
            }

            const data = await response.json();
            this.displayVaultStatus(data);
            
            // Enable reflection if vault is ready
            if (data.ready) {
                document.getElementById('reflect-btn').disabled = false;
            }
        } catch (error) {
            console.error('Vault status error:', error);
            document.getElementById('vault-contents').innerHTML = 
                '<p class="error">Failed to connect to vault</p>';
        }
    }

    displayVaultStatus(data) {
        const container = document.getElementById('vault-contents');
        
        container.innerHTML = `
            <div class="vault-info">
                <p><strong>Status:</strong> ${data.ready ? '✅ Connected' : '❌ Disconnected'}</p>
                <p><strong>Memory Files:</strong> ${data.memoryCount || 0}</p>
                <p><strong>Reflections:</strong> ${data.reflectionCount || 0}</p>
                <p><strong>Last Activity:</strong> ${data.lastActivity || 'Never'}</p>
            </div>
        `;
    }

    updateDeviceStatus() {
        document.getElementById('device-id').textContent = `Device: ${this.deviceId}`;
        document.getElementById('vault-status').textContent = 'Vault: Checking...';
        
        // Update vault status after check
        setTimeout(() => {
            const vaultConnected = document.querySelector('.vault-info');
            if (vaultConnected) {
                document.getElementById('vault-status').textContent = 'Vault: Connected';
            }
        }, 1000);
    }

    async reflect() {
        const prompt = document.getElementById('prompt-input').value.trim();
        if (!prompt) return;

        const btn = document.getElementById('reflect-btn');
        const responseContainer = document.getElementById('response-container');
        
        // Disable button, show loading
        btn.disabled = true;
        responseContainer.innerHTML = '<p class="placeholder reflecting">Cal is reflecting...</p>';

        try {
            const response = await fetch(`${this.apiUrl}/reflect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Cal-Token': this.token,
                    'X-Device-ID': this.deviceId
                },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                throw new Error('Reflection failed');
            }

            const data = await response.json();
            this.displayResponse(data);
            
            // Clear input
            document.getElementById('prompt-input').value = '';
            
            // Reload vault status
            this.loadVaultStatus();
        } catch (error) {
            console.error('Reflection error:', error);
            responseContainer.innerHTML = 
                '<p class="error">Failed to connect to Cal. Please check backend status.</p>';
        } finally {
            btn.disabled = false;
        }
    }

    displayResponse(data) {
        const container = document.getElementById('response-container');
        
        container.innerHTML = `
            <div class="cal-response">
                <p class="timestamp">${new Date(data.timestamp).toLocaleString()}</p>
                <div class="response-text">${this.formatResponse(data.response)}</div>
                <p class="metadata">Model: ${data.model} | Confidence: ${data.confidence}</p>
            </div>
        `;
    }

    formatResponse(text) {
        // Convert markdown-like formatting
        return text
            .split('\n')
            .map(line => `<p>${line}</p>`)
            .join('');
    }

    disconnect() {
        localStorage.removeItem('cal-session-token');
        localStorage.removeItem('cal-device-id');
        window.location.reload();
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    new CalInterface();
});