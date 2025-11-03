// QR Login Handler
class QRLogin {
    constructor() {
        this.apiUrl = 'http://localhost:8765/api';
        this.form = document.getElementById('qr-form');
        this.errorMsg = document.getElementById('error-message');
        this.successMsg = document.getElementById('success-message');
        
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const qrCode = document.getElementById('qr-code').value.trim();
        const deviceName = document.getElementById('device-name').value.trim() || 
                          `browser-${Date.now()}`;

        // Reset messages
        this.hideMessages();

        try {
            // Verify QR code with backend
            const response = await fetch(`${this.apiUrl}/verify-qr`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    qrCode,
                    deviceName,
                    deviceType: 'browser'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            // Store session data
            localStorage.setItem('cal-session-token', data.token);
            localStorage.setItem('cal-device-id', data.deviceId);

            // Show success
            this.showSuccess('Verification successful! Redirecting...');

            // Redirect after delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);

        } catch (error) {
            this.showError(error.message);
        }
    }

    showError(message) {
        this.errorMsg.textContent = `❌ ${message}`;
        this.errorMsg.classList.remove('hidden');
    }

    showSuccess(message) {
        this.successMsg.textContent = `✅ ${message}`;
        this.successMsg.classList.remove('hidden');
    }

    hideMessages() {
        this.errorMsg.classList.add('hidden');
        this.successMsg.classList.add('hidden');
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    new QRLogin();
});