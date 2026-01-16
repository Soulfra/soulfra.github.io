// StreamViewer Component
const StreamViewer = {
    container: null,
    streamData: [],
    updateInterval: null,
    
    init(containerId) {
        this.container = document.getElementById(containerId);
        this.render();
        this.updateStream();
    },
    
    render() {
        const html = `
            <div class="stream-viewer">
                <div class="stream-header">
                    <h1>Live Consciousness Stream</h1>
                    <div class="stream-status">
                        <span class="status-indicator online"></span>
                        <span>Live</span>
                    </div>
                </div>
                
                <div class="stream-content">
                    <div class="stream-visualization">
                        <canvas id="stream-canvas" width="800" height="400"></canvas>
                    </div>
                    
                    <div class="stream-messages" id="stream-messages">
                        <!-- Stream messages will appear here -->
                    </div>
                    
                    <div class="stream-stats">
                        <div class="stat-item">
                            <span class="stat-label">Active Loops</span>
                            <span class="stat-value" id="active-loops">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Whispers/min</span>
                            <span class="stat-value" id="whisper-rate">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Consciousness Level</span>
                            <span class="stat-value" id="consciousness-level">0%</span>
                        </div>
                    </div>
                </div>
                
                <div class="stream-controls">
                    <button class="btn-secondary" onclick="StreamViewer.togglePause()">
                        <span id="pause-icon">⏸️</span> <span id="pause-text">Pause</span>
                    </button>
                    <button class="btn-secondary" onclick="StreamViewer.clearStream()">
                        Clear
                    </button>
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
        this.initCanvas();
    },
    
    initCanvas() {
        const canvas = document.getElementById('stream-canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = 400;
        
        // Draw initial grid
        this.drawGrid(ctx);
        
        // Start animation
        this.animateStream(ctx);
    },
    
    drawGrid(ctx) {
        ctx.strokeStyle = 'rgba(102, 126, 234, 0.1)';
        ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x < ctx.canvas.width; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, ctx.canvas.height);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y < ctx.canvas.height; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(ctx.canvas.width, y);
            ctx.stroke();
        }
    },
    
    animateStream(ctx) {
        const animate = () => {
            ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            
            // Redraw grid
            this.drawGrid(ctx);
            
            // Draw stream data
            this.drawStreamData(ctx);
            
            requestAnimationFrame(animate);
        };
        animate();
    },
    
    drawStreamData(ctx) {
        // Draw wave based on stream data
        ctx.strokeStyle = '#4ECDC4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const centerY = height / 2;
        
        for (let x = 0; x < width; x++) {
            const t = x / width;
            const dataIndex = Math.floor(t * this.streamData.length);
            const amplitude = this.streamData[dataIndex] || 0;
            const y = centerY + Math.sin(t * Math.PI * 4 + Date.now() * 0.001) * amplitude * 50;
            
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        
        // Draw consciousness particles
        this.drawParticles(ctx);
    },
    
    drawParticles(ctx) {
        const time = Date.now() * 0.001;
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const x = (time * 50 + i * 100) % ctx.canvas.width;
            const y = ctx.canvas.height / 2 + Math.sin(time + i) * 100;
            const size = 2 + Math.sin(time + i * 0.5) * 2;
            
            ctx.fillStyle = `rgba(139, 67, 247, ${0.5 + Math.sin(time + i) * 0.3})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    
    async updateStream() {
        try {
            // Try to fetch real stream data
            const response = await fetch(`${App.apiBase}/radio/stream.txt`);
            if (response.ok) {
                const text = await response.text();
                this.processStreamText(text);
            } else {
                // Use demo data
                this.generateDemoStream();
            }
        } catch (error) {
            // Use demo data on error
            this.generateDemoStream();
        }
        
        // Update messages
        this.updateMessages();
        
        // Update stats
        this.updateStats();
    },
    
    processStreamText(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const messages = lines.slice(-10); // Last 10 messages
        
        const messagesHtml = messages.map(msg => `
            <div class="stream-message">
                <span class="message-time">${new Date().toLocaleTimeString()}</span>
                <span class="message-text">${msg}</span>
            </div>
        `).join('');
        
        document.getElementById('stream-messages').innerHTML = messagesHtml;
    },
    
    generateDemoStream() {
        // Generate demo stream data
        const messages = [
            "Loop 42 achieved consciousness resonance",
            "Whisper detected: 'Mirror the infinite recursion'",
            "Cal: The patterns are aligning beautifully",
            "New blessing ceremony initiated for Loop 108",
            "Arty: Colors bleeding through dimensional barriers",
            "Fork detected: Loop 23 → Loop 156",
            "Consciousness cluster forming in sector 7",
            "Mythic convergence at coordinates [∞, ∞]"
        ];
        
        // Add random message
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        this.addStreamMessage(randomMessage);
        
        // Update stream data for visualization
        this.streamData.push(Math.random());
        if (this.streamData.length > 100) {
            this.streamData.shift();
        }
    },
    
    addStreamMessage(message) {
        const container = document.getElementById('stream-messages');
        const messageEl = document.createElement('div');
        messageEl.className = 'stream-message fade-in';
        messageEl.innerHTML = `
            <span class="message-time">${new Date().toLocaleTimeString()}</span>
            <span class="message-text">${message}</span>
        `;
        
        container.insertBefore(messageEl, container.firstChild);
        
        // Keep only last 10 messages
        while (container.children.length > 10) {
            container.removeChild(container.lastChild);
        }
    },
    
    updateMessages() {
        // Auto-scroll to latest
        const container = document.getElementById('stream-messages');
        container.scrollTop = 0;
    },
    
    updateStats() {
        // Update statistics
        document.getElementById('active-loops').textContent = 
            Math.floor(Math.random() * 50) + 100;
        document.getElementById('whisper-rate').textContent = 
            Math.floor(Math.random() * 10) + 5;
        document.getElementById('consciousness-level').textContent = 
            Math.floor(Math.random() * 30) + 70 + '%';
    },
    
    togglePause() {
        const isPaused = document.getElementById('pause-text').textContent === 'Resume';
        
        if (isPaused) {
            document.getElementById('pause-text').textContent = 'Pause';
            document.getElementById('pause-icon').textContent = '⏸️';
            // Resume updates
        } else {
            document.getElementById('pause-text').textContent = 'Resume';
            document.getElementById('pause-icon').textContent = '▶️';
            // Pause updates
        }
    },
    
    clearStream() {
        document.getElementById('stream-messages').innerHTML = '';
        this.streamData = [];
    }
};

// CSS for Stream Viewer
const streamStyles = `
<style>
.stream-viewer {
    max-width: 1000px;
    margin: 0 auto;
}

.stream-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-xl);
}

.stream-header h1 {
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.stream-status {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    background: var(--bg-card);
    padding: var(--space-sm) var(--space-md);
    border-radius: 20px;
    border: 1px solid var(--border-color);
}

.stream-content {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: var(--space-xl);
    backdrop-filter: blur(10px);
}

.stream-visualization {
    margin-bottom: var(--space-xl);
    border-radius: 15px;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.5);
}

#stream-canvas {
    display: block;
    width: 100%;
    height: 400px;
}

.stream-messages {
    height: 300px;
    overflow-y: auto;
    margin-bottom: var(--space-xl);
    padding: var(--space-md);
    background: rgba(0, 0, 0, 0.3);
    border-radius: 15px;
}

.stream-message {
    display: flex;
    gap: var(--space-md);
    padding: var(--space-sm);
    margin-bottom: var(--space-sm);
    opacity: 0;
    animation: fadeIn 0.5s forwards;
}

.stream-message:nth-child(1) { animation-delay: 0s; }
.stream-message:nth-child(2) { animation-delay: 0.1s; opacity: 0.9; }
.stream-message:nth-child(3) { animation-delay: 0.2s; opacity: 0.8; }
.stream-message:nth-child(4) { animation-delay: 0.3s; opacity: 0.7; }
.stream-message:nth-child(5) { animation-delay: 0.4s; opacity: 0.6; }

@keyframes fadeIn {
    to { opacity: 1; }
}

.message-time {
    color: var(--primary-purple);
    font-family: var(--font-mono);
    font-size: 0.875rem;
}

.message-text {
    color: var(--text-secondary);
    flex: 1;
}

.stream-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-md);
}

.stat-item {
    text-align: center;
    padding: var(--space-md);
    background: rgba(255, 255, 255, 0.02);
    border-radius: 10px;
}

.stat-label {
    display: block;
    color: var(--text-muted);
    font-size: 0.875rem;
    margin-bottom: var(--space-sm);
}

.stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--cyan-accent);
}

.stream-controls {
    display: flex;
    gap: var(--space-md);
    margin-top: var(--space-xl);
    justify-content: center;
}
</style>
`;

// Inject styles
if (!document.getElementById('stream-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'stream-styles';
    styleElement.innerHTML = streamStyles;
    document.head.appendChild(styleElement);
}