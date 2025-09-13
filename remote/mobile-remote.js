// Mobile Remote Control

class MobileRemote {
    constructor() {
        this.sessionId = this.getSessionFromURL();
        this.ws = null;
        this.isConnected = false;
        this.currentChannel = 1;
        this.aiActive = false;
        
        this.init();
    }
    
    init() {
        console.log('📱 Mobile remote initializing...');
        
        this.setupEventListeners();
        this.connectToTV();
        
        // Update session display
        document.getElementById('session-display').textContent = 
            this.sessionId ? this.sessionId.substring(0, 8) + '...' : 'None';
            
        // Enable PWA features
        this.setupPWA();
    }
    
    getSessionFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('session');
    }
    
    connectToTV() {
        console.log('📡 Connecting to TV...');
        
        // Simulate connection for demo
        setTimeout(() => {
            this.onConnected();
        }, 1000);
    }
    
    onConnected() {
        this.isConnected = true;
        
        const statusEl = document.getElementById('connection-status');
        statusEl.textContent = 'Connected to TV';
        statusEl.classList.add('connected');
        
        // Vibrate for feedback
        this.vibrate(200);
        
        console.log('✅ Connected to TV');
    }
    
    setupEventListeners() {
        // Power button
        document.getElementById('power-btn').addEventListener('click', () => {
            this.sendCommand('power');
            this.vibrate(50);
        });
        
        // Navigation pad
        document.getElementById('nav-up').addEventListener('click', () => {
            this.sendCommand('channel_up');
            this.channelUp();
        });
        
        document.getElementById('nav-down').addEventListener('click', () => {
            this.sendCommand('channel_down');
            this.channelDown();
        });
        
        document.getElementById('nav-left').addEventListener('click', () => {
            this.sendCommand('channel_prev');
        });
        
        document.getElementById('nav-right').addEventListener('click', () => {
            this.sendCommand('channel_next');
        });
        
        document.getElementById('nav-center').addEventListener('click', () => {
            this.sendCommand('select');
            this.vibrate(100);
        });
        
        // Channel controls
        document.getElementById('ch-up').addEventListener('click', () => {
            this.sendCommand('channel_up');
            this.channelUp();
        });
        
        document.getElementById('ch-down').addEventListener('click', () => {
            this.sendCommand('channel_down');
            this.channelDown();
        });
        
        // AI toggle
        document.getElementById('ai-toggle').addEventListener('click', () => {
            this.toggleAI();
        });
        
        // Quick actions
        document.getElementById('screen-capture').addEventListener('click', () => {
            this.sendCommand('screen_capture');
            this.vibrate(50);
        });
        
        document.getElementById('workflow-save').addEventListener('click', () => {
            this.sendCommand('workflow_save');
            this.vibrate(50);
        });
        
        document.getElementById('node-sync').addEventListener('click', () => {
            this.sendCommand('node_sync');
            this.vibrate(50);
        });
        
        // Gesture area
        this.setupGestures();
        
        // Add button press feedback
        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('touchstart', () => {
                this.vibrate(10);
            });
        });
    }
    
    setupGestures() {
        const gestureArea = document.getElementById('gesture-area');
        let startX = 0;
        let startY = 0;
        
        gestureArea.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        gestureArea.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            // Detect swipe direction
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 50) {
                    this.sendCommand('swipe_right');
                    gestureArea.textContent = 'Swiped Right →';
                } else if (deltaX < -50) {
                    this.sendCommand('swipe_left');
                    gestureArea.textContent = 'Swiped Left ←';
                }
            } else {
                if (deltaY > 50) {
                    this.sendCommand('swipe_down');
                    gestureArea.textContent = 'Swiped Down ↓';
                } else if (deltaY < -50) {
                    this.sendCommand('swipe_up');
                    gestureArea.textContent = 'Swiped Up ↑';
                }
            }
            
            setTimeout(() => {
                gestureArea.textContent = 'Swipe here for gestures';
            }, 1000);
        });
    }
    
    channelUp() {
        this.currentChannel++;
        document.getElementById('current-channel').textContent = this.currentChannel;
        this.vibrate(20);
    }
    
    channelDown() {
        if (this.currentChannel > 1) {
            this.currentChannel--;
            document.getElementById('current-channel').textContent = this.currentChannel;
            this.vibrate(20);
        }
    }
    
    toggleAI() {
        this.aiActive = !this.aiActive;
        
        const toggleBtn = document.getElementById('ai-toggle');
        const statusEl = document.getElementById('ai-status');
        
        if (this.aiActive) {
            toggleBtn.classList.add('active');
            statusEl.classList.add('active');
            statusEl.textContent = 'ON';
            this.sendCommand('ai_agent_toggle', { state: 'on' });
            this.vibrate(200);
        } else {
            toggleBtn.classList.remove('active');
            statusEl.classList.remove('active');
            statusEl.textContent = 'OFF';
            this.sendCommand('ai_agent_toggle', { state: 'off' });
            this.vibrate(100);
        }
    }
    
    sendCommand(type, data = {}) {
        if (!this.isConnected) {
            console.warn('Not connected to TV');
            return;
        }
        
        const command = {
            type,
            sessionId: this.sessionId,
            timestamp: Date.now(),
            ...data
        };
        
        console.log('📤 Sending command:', command);
        
        // In production, send via WebSocket
        // this.ws.send(JSON.stringify(command));
        
        // For demo, post message to parent
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'remote_command',
                command
            }, '*');
        }
    }
    
    vibrate(duration) {
        if ('vibrate' in navigator) {
            navigator.vibrate(duration);
        }
    }
    
    setupPWA() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('PWA service worker registered'))
                .catch(err => console.error('PWA registration failed:', err));
        }
        
        // Handle install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            console.log('PWA install available');
        });
    }
}

// Initialize mobile remote
const mobileRemote = new MobileRemote();

// Keep screen awake
if ('wakeLock' in navigator) {
    navigator.wakeLock.request('screen')
        .then(() => console.log('Screen wake lock active'))
        .catch(err => console.error('Wake lock failed:', err));
}