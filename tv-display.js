// TV Display System

class TVDisplay {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.ws = null;
        this.isConnected = false;
        this.currentChannel = 1;
        this.repositories = [];
        
        this.init();
    }
    
    init() {
        console.log('📺 TV Display initializing...');
        
        // Generate QR code
        this.generateQRCode();
        
        // Connect to WebSocket
        this.connectWebSocket();
        
        // Update session ID display
        document.getElementById('session-id').textContent = this.sessionId;
        
        console.log(`✅ TV ready with session: ${this.sessionId}`);
    }
    
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    generateQRCode() {
        const remoteUrl = `${window.location.origin}/remote?session=${this.sessionId}`;
        
        QRCode.toCanvas(document.getElementById('qr-code'), remoteUrl, {
            width: 256,
            margin: 0,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        }, (error) => {
            if (error) console.error('QR generation error:', error);
            else console.log('✅ QR code generated:', remoteUrl);
        });
    }
    
    connectWebSocket() {
        // For demo, using a mock connection
        // In production, use: wss://your-websocket-server.com
        console.log('🔌 Connecting to WebSocket...');
        
        // Simulate WebSocket events
        this.simulateConnection();
    }
    
    simulateConnection() {
        // Simulate remote connection after 5 seconds
        setTimeout(() => {
            this.onRemoteConnected({
                deviceId: 'iPhone-' + Math.random().toString(36).substr(2, 6),
                deviceType: 'iOS',
                timestamp: Date.now()
            });
        }, 5000);
    }
    
    onRemoteConnected(device) {
        console.log('📱 Remote connected:', device);
        
        this.isConnected = true;
        
        // Update UI
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        statusDot.classList.add('connected');
        statusText.textContent = 'Remote connected!';
        
        // Switch to content display after 2 seconds
        setTimeout(() => {
            document.getElementById('pairing-screen').style.display = 'none';
            document.getElementById('content-display').style.display = 'flex';
            document.getElementById('connected-device').textContent = `📱 ${device.deviceId}`;
            
            this.showChannel(this.currentChannel);
        }, 2000);
    }
    
    onRemoteCommand(command) {
        console.log('🎮 Remote command:', command);
        
        switch (command.type) {
            case 'channel_up':
                this.changeChannel(this.currentChannel + 1);
                break;
            case 'channel_down':
                this.changeChannel(this.currentChannel - 1);
                break;
            case 'select':
                this.selectCurrentChannel();
                break;
            case 'ai_agent_toggle':
                this.toggleAIAgent();
                break;
            case 'screen_capture':
                this.startScreenCapture();
                break;
        }
    }
    
    changeChannel(channelNumber) {
        this.currentChannel = channelNumber;
        this.showChannel(channelNumber);
    }
    
    showChannel(number) {
        const contentArea = document.getElementById('content-area');
        
        // Demo content
        const channels = [
            {
                number: 1,
                name: 'Welcome',
                content: `
                    <h1>Welcome to Soulfra TV</h1>
                    <p>Your mobile device is now the remote control!</p>
                    <p>Try changing channels or enabling the AI agent.</p>
                `
            },
            {
                number: 2,
                name: 'Projects',
                content: `
                    <h1>Project Portfolio</h1>
                    <p>Browse through software projects using your mobile remote.</p>
                `
            },
            {
                number: 3,
                name: 'AI Agent',
                content: `
                    <h1>AI Screen Watcher</h1>
                    <p>Enable the AI agent to watch your screen and learn workflows.</p>
                `
            }
        ];
        
        const channel = channels[number - 1] || channels[0];
        
        document.getElementById('current-channel').textContent = channel.number;
        document.getElementById('current-name').textContent = channel.name;
        contentArea.innerHTML = `<div class="channel-content fade-in">${channel.content}</div>`;
    }
    
    toggleAIAgent() {
        const agentState = document.getElementById('agent-state');
        const isActive = agentState.classList.contains('active');
        
        if (isActive) {
            agentState.classList.remove('active');
            agentState.textContent = 'Inactive';
            console.log('🤖 AI Agent deactivated');
        } else {
            agentState.classList.add('active');
            agentState.textContent = 'Watching';
            console.log('🤖 AI Agent activated - watching screen');
            this.startScreenCapture();
        }
    }
    
    async startScreenCapture() {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false
            });
            
            console.log('📹 Screen capture started');
            
            // Here you would send the stream to your AI agent
            // For demo, just log it
            
            stream.getVideoTracks()[0].addEventListener('ended', () => {
                console.log('📹 Screen capture ended');
            });
            
        } catch (error) {
            console.error('Screen capture error:', error);
        }
    }
}

// Initialize TV Display
const tvDisplay = new TVDisplay();

// Handle incoming messages (in production, from WebSocket)
window.addEventListener('message', (event) => {
    if (event.data.type === 'remote_command') {
        tvDisplay.onRemoteCommand(event.data.command);
    }
});

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
.fade-in {
    animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.channel-content {
    padding: 40px;
    max-width: 800px;
}

.channel-content h1 {
    font-size: 2.5rem;
    margin-bottom: 20px;
    color: #00c9ff;
}

.channel-content p {
    font-size: 1.2rem;
    line-height: 1.6;
    color: #ddd;
    margin-bottom: 15px;
}
`;
document.head.appendChild(style);