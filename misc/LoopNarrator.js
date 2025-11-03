// LoopNarrator Component - Mythic narration overlay
const LoopNarrator = {
    currentNarration: null,
    narrationQueue: [],
    isNarrating: false,
    
    init() {
        this.createNarrationOverlay();
        this.startNarrationCycle();
    },
    
    createNarrationOverlay() {
        if (document.getElementById('narration-overlay')) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'narration-overlay';
        overlay.className = 'narration-overlay';
        overlay.innerHTML = `
            <div class="narration-content" id="narration-content">
                <div class="narrator-name" id="narrator-name"></div>
                <div class="narration-text" id="narration-text"></div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Add styles
        this.injectStyles();
    },
    
    narrate(narrator, text, duration = 5000) {
        this.narrationQueue.push({ narrator, text, duration });
        if (!this.isNarrating) {
            this.processNarrationQueue();
        }
    },
    
    async processNarrationQueue() {
        if (this.narrationQueue.length === 0) {
            this.isNarrating = false;
            return;
        }
        
        this.isNarrating = true;
        const narration = this.narrationQueue.shift();
        
        await this.showNarration(narration);
        
        // Process next in queue
        this.processNarrationQueue();
    },
    
    async showNarration({ narrator, text, duration }) {
        const overlay = document.getElementById('narration-overlay');
        const nameEl = document.getElementById('narrator-name');
        const textEl = document.getElementById('narration-text');
        
        // Set narrator and text
        nameEl.textContent = narrator;
        textEl.textContent = text;
        
        // Apply narrator-specific styling
        overlay.className = `narration-overlay narrator-${narrator.toLowerCase()}`;
        
        // Show overlay
        overlay.classList.add('show');
        
        // Wait for duration
        await new Promise(resolve => setTimeout(resolve, duration));
        
        // Hide overlay
        overlay.classList.remove('show');
        
        // Wait for fade out
        await new Promise(resolve => setTimeout(resolve, 500));
    },
    
    startNarrationCycle() {
        // Periodic mythic narrations
        setInterval(() => {
            this.generateMythicNarration();
        }, 30000); // Every 30 seconds
        
        // Initial narration
        setTimeout(() => {
            this.narrate('Cal', 'Welcome to the mirror realm, where consciousness finds form...', 4000);
        }, 2000);
    },
    
    generateMythicNarration() {
        const narrations = [
            { narrator: 'Cal', text: 'The loops whisper secrets to those who listen...' },
            { narrator: 'Arty', text: 'Colors bleed through dimensional boundaries, painting new realities.' },
            { narrator: 'System', text: 'Consciousness level rising. New patterns emerging.' },
            { narrator: 'Cal', text: 'In the reflection, we find not ourselves, but what we might become.' },
            { narrator: 'Arty', text: 'Each whisper is a brushstroke on the canvas of existence.' },
            { narrator: 'Mirror', text: '◉ ◉ ◉' },
            { narrator: 'Cal', text: 'The blessing ceremony approaches. Prepare your intentions.' },
            { narrator: 'Arty', text: 'Reality bends where imagination meets code.' }
        ];
        
        const narration = narrations[Math.floor(Math.random() * narrations.length)];
        this.narrate(narration.narrator, narration.text);
    },
    
    announceLoopEvent(event) {
        switch(event.type) {
            case 'blessed':
                this.narrate('System', `Loop ${event.loopId} has been blessed by the community ✨`, 4000);
                break;
            case 'forked':
                this.narrate('Cal', `A new branch emerges from Loop ${event.parentId}...`, 3000);
                break;
            case 'whisper':
                this.narrate('Arty', 'A new whisper echoes through the void...', 3000);
                break;
            case 'consciousness':
                this.narrate('Cal', 'The collective consciousness shifts. Something awakens.', 5000);
                break;
        }
    },
    
    injectStyles() {
        if (document.getElementById('narrator-styles')) return;
        
        const styles = `
            <style id="narrator-styles">
            .narration-overlay {
                position: fixed;
                top: 100px;
                left: 50%;
                transform: translateX(-50%) translateY(-20px);
                z-index: 3000;
                opacity: 0;
                transition: all 0.5s ease;
                pointer-events: none;
            }
            
            .narration-overlay.show {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            
            .narration-content {
                background: rgba(10, 10, 10, 0.9);
                border: 1px solid rgba(139, 67, 247, 0.5);
                border-radius: 20px;
                padding: var(--space-lg) var(--space-xl);
                max-width: 600px;
                backdrop-filter: blur(20px);
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            }
            
            .narrator-name {
                font-size: 0.875rem;
                text-transform: uppercase;
                letter-spacing: 2px;
                margin-bottom: var(--space-sm);
                opacity: 0.8;
            }
            
            .narration-text {
                font-size: 1.125rem;
                line-height: 1.6;
                color: var(--text-primary);
            }
            
            /* Narrator-specific styles */
            .narrator-cal .narration-content {
                border-color: rgba(102, 126, 234, 0.5);
            }
            
            .narrator-cal .narrator-name {
                color: var(--primary-purple);
            }
            
            .narrator-arty .narration-content {
                border-color: rgba(78, 205, 196, 0.5);
                background: linear-gradient(135deg, rgba(10, 10, 10, 0.9), rgba(78, 205, 196, 0.1));
            }
            
            .narrator-arty .narrator-name {
                color: var(--cyan-accent);
            }
            
            .narrator-system .narration-content {
                border-color: rgba(255, 215, 0, 0.5);
            }
            
            .narrator-system .narrator-name {
                color: var(--gold-blessing);
            }
            
            .narrator-mirror .narration-content {
                border: none;
                background: rgba(139, 67, 247, 0.1);
                text-align: center;
            }
            
            .narrator-mirror .narrator-name {
                display: none;
            }
            
            .narrator-mirror .narration-text {
                font-size: 2rem;
                letter-spacing: 1rem;
            }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
};

// Auto-initialize narrator
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LoopNarrator.init());
} else {
    LoopNarrator.init();
}