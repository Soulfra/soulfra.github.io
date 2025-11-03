# Module: mirror-ui-shell.html (Soft Mode Interface)
**Purpose**: Grandma-friendly HTML/CSS/JS interface for voice-first reflection  
**Dependencies**: Web Speech API, ConfigManager, modern browser  
**Success Criteria**: Non-technical user completes voice reflection → export flow independently  

---

## Implementation Requirements

### HTML Structure Template
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Mirror - Simple Reflection</title>
    <!-- TODO: Add meta tags for PWA support -->
    <meta name="description" content="Your personal reflection space">
    <meta name="theme-color" content="#667eea">
    
    <!-- TODO: Add favicon and app icons -->
    <link rel="icon" href="/assets/favicon.ico">
    <link rel="apple-touch-icon" href="/assets/icon-192.png">
    
    <style>
        /* TODO: Implement accessibility-first CSS (see styling section) */
    </style>
</head>
<body class="soft-mode">
    <!-- TODO: Implement HTML structure (see components section) -->
    
    <script>
        // TODO: Implement JavaScript functionality (see interaction section)
    </script>
</body>
</html>
```

---

## Component Structure

### 1. Header Section
```html
<!-- TODO: Create welcoming header -->
<header class="mirror-header">
    <div class="greeting-container">
        <h1 class="greeting-text" id="greetingText">Good morning! 🌅</h1>
        <p class="welcome-message">What would you like to reflect on today?</p>
    </div>
    
    <!-- Mode indicator (subtle) -->
    <div class="mode-indicator">
        <span class="mode-badge">Simple Mode 🌸</span>
    </div>
</header>
```

### 2. Cal Orb Interface (Primary Interaction)
```html
<!-- TODO: Create animated Cal orb for voice interaction -->
<main class="reflection-space">
    <div class="cal-orb-container">
        <div class="cal-orb" id="calOrb" tabindex="0" role="button" aria-label="Tap to start reflecting">
            <div class="orb-core"></div>
            <div class="orb-ring"></div>
            <div class="orb-pulse"></div>
            
            <!-- Voice status indicator -->
            <div class="voice-status" id="voiceStatus">
                <span class="status-text">Tap to speak</span>
                <div class="voice-waves hidden" id="voiceWaves">
                    <span class="wave"></span>
                    <span class="wave"></span>
                    <span class="wave"></span>
                </div>
            </div>
        </div>
        
        <!-- Voice prompt suggestions -->
        <div class="voice-prompts" id="voicePrompts">
            <p class="prompt-hint">Try saying:</p>
            <div class="prompt-examples">
                <button class="prompt-btn">"I want to reflect on my day"</button>
                <button class="prompt-btn">"I'm feeling grateful for..."</button>
                <button class="prompt-btn">"Help me process my emotions"</button>
            </div>
        </div>
    </div>
</main>
```

### 3. Folder Navigation (Three Folders Only)
```html
<!-- TODO: Implement simple three-folder structure -->
<section class="folders-section">
    <h2 class="section-title">Your Reflections</h2>
    
    <div class="folders-grid">
        <a href="/vault/reflections" class="folder-card" id="reflectionsFolder">
            <div class="folder-icon">💭</div>
            <h3 class="folder-title">Reflections</h3>
            <p class="folder-description">Your thoughts and insights</p>
            <span class="folder-count" id="reflectionsCount">0 reflections</span>
        </a>
        
        <a href="/vault/saved" class="folder-card" id="savedFolder">
            <div class="folder-icon">💝</div>
            <h3 class="folder-title">Saved</h3>
            <p class="folder-description">Important moments you've kept</p>
            <span class="folder-count" id="savedCount">0 saved</span>
        </a>
        
        <a href="/vault/shared" class="folder-card" id="sharedFolder">
            <div class="folder-icon">🌟</div>
            <h3 class="folder-title">What You Shared</h3>
            <p class="folder-description">Reflections you've shared with others</p>
            <span class="folder-count" id="sharedCount">0 shared</span>
        </a>
    </div>
</section>
```

### 4. Quick Actions Bar
```html
<!-- TODO: Implement one-tap action buttons -->
<section class="actions-section">
    <div class="quick-actions">
        <button class="action-btn primary" id="startReflectionBtn">
            <span class="btn-icon">✨</span>
            <span class="btn-text">Start Reflecting</span>
        </button>
        
        <button class="action-btn secondary" id="shareReflectionBtn">
            <span class="btn-icon">🔗</span>
            <span class="btn-text">Share a Thought</span>
        </button>
        
        <button class="action-btn secondary" id="viewHistoryBtn">
            <span class="btn-icon">📚</span>
            <span class="btn-text">View History</span>
        </button>
    </div>
</section>
```

### 5. Export Interface (Simple Pricing)
```html
<!-- TODO: Create simple export interface -->
<section class="export-section hidden" id="exportSection">
    <div class="export-card">
        <h3 class="export-title">Share Your Reflection</h3>
        <p class="export-description">Export your thoughts to keep or share with others</p>
        
        <div class="pricing-simple">
            <div class="price-display">
                <span class="price-amount">$1.00</span>
                <span class="price-description">per export</span>
            </div>
            <p class="price-note">All processing happens on your device</p>
        </div>
        
        <button class="export-btn" id="exportBtn">
            <span class="btn-icon">💰</span>
            <span class="btn-text">Export for $1.00</span>
        </button>
        
        <button class="cancel-btn" id="cancelExportBtn">Cancel</button>
    </div>
</section>
```

---

## CSS Styling (Accessibility-First)

### Core Styling Framework
```css
/* TODO: Implement accessibility-first CSS */

/* CSS Variables for easy theming */
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --success-color: #4ecdc4;
    --warning-color: #f7b731;
    --error-color: #ff6b6b;
    
    --text-primary: #2c3e50;
    --text-secondary: #7f8c8d;
    --text-light: #bdc3c7;
    
    --bg-primary: #ffffff;
    --bg-secondary: #f8f9fa;
    --bg-glass: rgba(255, 255, 255, 0.1);
    
    --font-size-large: 18px;
    --font-size-normal: 16px;
    --font-size-small: 14px;
    
    --spacing-xs: 0.5rem;
    --spacing-sm: 1rem;
    --spacing-md: 1.5rem;
    --spacing-lg: 2rem;
    --spacing-xl: 3rem;
    
    --border-radius: 16px;
    --border-radius-sm: 8px;
    --shadow-soft: 0 8px 32px rgba(0, 0, 0, 0.1);
    --shadow-hover: 0 12px 48px rgba(0, 0, 0, 0.15);
}

/* Base styles for accessibility */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    font-size: var(--font-size-large);
    line-height: 1.6;
    color: var(--text-primary);
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    min-height: 100vh;
    overflow-x: hidden;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
    :root {
        --primary-color: #000080;
        --text-primary: #000000;
        --bg-primary: #ffffff;
    }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

### Cal Orb Styling
```css
/* TODO: Implement animated Cal orb */
.cal-orb-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    min-height: 400px;
}

.cal-orb {
    position: relative;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: linear-gradient(45deg, var(--success-color), var(--primary-color));
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-soft);
}

.cal-orb:hover,
.cal-orb:focus {
    transform: scale(1.05);
    box-shadow: var(--shadow-hover);
    outline: 3px solid var(--primary-color);
    outline-offset: 4px;
}

.cal-orb.listening {
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

.orb-core {
    width: 60%;
    height: 60%;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
}

.voice-waves {
    display: flex;
    gap: 4px;
    align-items: center;
}

.wave {
    width: 4px;
    height: 20px;
    background: var(--bg-primary);
    border-radius: 2px;
    animation: wave 1s infinite ease-in-out;
}

.wave:nth-child(2) { animation-delay: 0.1s; }
.wave:nth-child(3) { animation-delay: 0.2s; }

@keyframes wave {
    0%, 40%, 100% { transform: scaleY(0.4); }
    20% { transform: scaleY(1); }
}
```

### Folder Grid Styling
```css
/* TODO: Style folder navigation */
.folders-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-md);
    margin-top: var(--spacing-lg);
}

.folder-card {
    background: var(--bg-glass);
    backdrop-filter: blur(10px);
    border-radius: var(--border-radius);
    padding: var(--spacing-lg);
    text-decoration: none;
    color: inherit;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.2);
    display: block;
}

.folder-card:hover,
.folder-card:focus {
    transform: translateY(-8px);
    background: rgba(255, 255, 255, 0.2);
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
}

.folder-icon {
    font-size: 3rem;
    margin-bottom: var(--spacing-sm);
    display: block;
}

.folder-title {
    font-size: 1.3rem;
    font-weight: 600;
    margin-bottom: var(--spacing-xs);
    color: var(--bg-primary);
}

.folder-description {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.95rem;
    margin-bottom: var(--spacing-sm);
}

.folder-count {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
    font-style: italic;
}
```

### Button Styling
```css
/* TODO: Implement accessible button styles */
.action-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-md) var(--spacing-lg);
    border: none;
    border-radius: var(--border-radius-sm);
    font-size: var(--font-size-normal);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    min-height: 48px; /* Accessibility: minimum touch target */
}

.action-btn.primary {
    background: linear-gradient(45deg, var(--success-color), var(--primary-color));
    color: white;
}

.action-btn.secondary {
    background: var(--bg-glass);
    backdrop-filter: blur(10px);
    color: var(--bg-primary);
    border: 1px solid rgba(255, 255, 255, 0.3);
}

.action-btn:hover,
.action-btn:focus {
    transform: translateY(-2px);
    box-shadow: var(--shadow-hover);
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
}

.action-btn:active {
    transform: translateY(0);
}

.btn-icon {
    font-size: 1.2rem;
}

.btn-text {
    font-weight: 600;
}
```

---

## JavaScript Functionality

### Core Application Class
```javascript
// TODO: Implement main application logic
class MirrorSoftUI {
    constructor() {
        this.isListening = false;
        this.recognition = null;
        this.configManager = null;
        this.currentReflection = null;
        
        this.init();
    }

    async init() {
        // TODO: Initialize the application
        console.log('🌸 Initializing Soft Mode UI...');
        
        // Load configuration
        await this.loadConfig();
        
        // Setup voice recognition
        this.setupVoiceRecognition();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update UI based on current state
        this.updateUI();
        
        // Setup greeting based on time of day
        this.updateGreeting();
        
        console.log('✅ Soft Mode UI initialized');
    }

    async loadConfig() {
        // TODO: Load configuration from ConfigManager
        try {
            const configResponse = await fetch('/api/config');
            const config = await configResponse.json();
            this.config = config;
            
            // Apply theme settings
            this.applyThemeSettings();
        } catch (error) {
            console.error('Failed to load config:', error);
            // Use default settings
            this.config = { current: 'soft' };
        }
    }

    setupVoiceRecognition() {
        // TODO: Initialize Web Speech API
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            this.recognition.onstart = () => this.onVoiceStart();
            this.recognition.onresult = (event) => this.onVoiceResult(event);
            this.recognition.onend = () => this.onVoiceEnd();
            this.recognition.onerror = (event) => this.onVoiceError(event);
            
            console.log('✅ Voice recognition initialized');
        } else {
            console.warn('⚠️ Voice recognition not supported');
            this.showVoiceNotSupported();
        }
    }

    setupEventListeners() {
        // TODO: Setup all event listeners
        
        // Cal orb interaction
        const calOrb = document.getElementById('calOrb');
        calOrb.addEventListener('click', () => this.toggleVoiceRecognition());
        calOrb.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleVoiceRecognition();
            }
        });

        // Quick action buttons
        document.getElementById('startReflectionBtn').addEventListener('click', () => this.startReflection());
        document.getElementById('shareReflectionBtn').addEventListener('click', () => this.shareReflection());
        document.getElementById('viewHistoryBtn').addEventListener('click', () => this.viewHistory());

        // Voice prompt suggestions
        document.querySelectorAll('.prompt-btn').forEach(btn => {
            btn.addEventListener('click', () => this.usePromptSuggestion(btn.textContent));
        });

        // Export functionality
        document.getElementById('exportBtn').addEventListener('click', () => this.handleExport());
        document.getElementById('cancelExportBtn').addEventListener('click', () => this.cancelExport());

        // Folder navigation
        document.querySelectorAll('.folder-card').forEach(folder => {
            folder.addEventListener('click', (e) => this.navigateToFolder(e));
        });
    }

    toggleVoiceRecognition() {
        // TODO: Toggle voice recognition on/off
        if (!this.recognition) {
            this.showVoiceNotSupported();
            return;
        }

        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    onVoiceStart() {
        // TODO: Handle voice recognition start
        this.isListening = true;
        
        const calOrb = document.getElementById('calOrb');
        const voiceStatus = document.getElementById('voiceStatus');
        const voiceWaves = document.getElementById('voiceWaves');
        
        calOrb.classList.add('listening');
        voiceStatus.querySelector('.status-text').textContent = 'Listening...';
        voiceWaves.classList.remove('hidden');
        
        console.log('🎤 Voice recognition started');
    }

    onVoiceResult(event) {
        // TODO: Handle voice recognition result
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        
        console.log(`🎤 Voice result: "${transcript}" (confidence: ${confidence})`);
        
        // Process the reflection
        this.processVoiceReflection(transcript, confidence);
    }

    onVoiceEnd() {
        // TODO: Handle voice recognition end
        this.isListening = false;
        
        const calOrb = document.getElementById('calOrb');
        const voiceStatus = document.getElementById('voiceStatus');
        const voiceWaves = document.getElementById('voiceWaves');
        
        calOrb.classList.remove('listening');
        voiceStatus.querySelector('.status-text').textContent = 'Tap to speak';
        voiceWaves.classList.add('hidden');
        
        console.log('🎤 Voice recognition ended');
    }

    onVoiceError(event) {
        // TODO: Handle voice recognition errors
        console.error('🎤 Voice recognition error:', event.error);
        
        this.isListening = false;
        this.onVoiceEnd();
        
        // Show user-friendly error message
        this.showMessage('Voice recognition failed. Please try again.', 'error');
    }

    async processVoiceReflection(transcript, confidence) {
        // TODO: Process voice input and create reflection
        try {
            // Show processing indicator
            this.showMessage('Processing your reflection...', 'info');
            
            // Send to backend for analysis
            const response = await fetch('/api/voice-reflection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcript: transcript,
                    confidence: confidence,
                    timestamp: new Date().toISOString()
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.currentReflection = result.reflection;
                this.showReflectionResult(result.reflection);
                
                // Check if agent should be spawned
                if (result.shouldSpawnAgent) {
                    this.handleAgentSpawning(result.agent);
                }
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('Failed to process reflection:', error);
            this.showMessage('Failed to process your reflection. Please try again.', 'error');
        }
    }

    showReflectionResult(reflection) {
        // TODO: Display reflection processing results
        const message = `
            <div class="reflection-result">
                <h3>Your Reflection</h3>
                <p>"${reflection.originalText}"</p>
                <div class="insights">
                    <p>Emotion detected: ${reflection.emotion}</p>
                    <p>Theme: ${reflection.theme}</p>
                </div>
                <button onclick="mirrorUI.showExportInterface()">Export for $1.00</button>
            </div>
        `;
        
        this.showMessage(message, 'success', 0); // Don't auto-hide
    }

    showExportInterface() {
        // TODO: Show export interface
        const exportSection = document.getElementById('exportSection');
        exportSection.classList.remove('hidden');
        exportSection.scrollIntoView({ behavior: 'smooth' });
    }

    async handleExport() {
        // TODO: Handle export functionality
        if (!this.currentReflection) {
            this.showMessage('No reflection to export', 'error');
            return;
        }

        try {
            // Show Stripe payment interface
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reflectionId: this.currentReflection.id,
                    amount: 100 // $1.00 in cents
                })
            });

            const { clientSecret } = await response.json();
            
            // TODO: Integrate with Stripe Elements
            this.showStripePayment(clientSecret);
            
        } catch (error) {
            console.error('Export failed:', error);
            this.showMessage('Export failed. Please try again.', 'error');
        }
    }

    updateGreeting() {
        // TODO: Update greeting based on time of day
        const hour = new Date().getHours();
        const greetingText = document.getElementById('greetingText');
        
        let greeting, emoji;
        if (hour < 12) {
            greeting = 'Good morning!';
            emoji = '🌅';
        } else if (hour < 17) {
            greeting = 'Good afternoon!';
            emoji = '☀️';
        } else {
            greeting = 'Good evening!';
            emoji = '🌙';
        }
        
        greetingText.textContent = `${greeting} ${emoji}`;
    }

    showMessage(message, type = 'info', duration = 5000) {
        // TODO: Show user feedback messages
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.innerHTML = message;
        
        document.body.appendChild(messageElement);
        
        if (duration > 0) {
            setTimeout(() => {
                messageElement.remove();
            }, duration);
        }
    }

    showVoiceNotSupported() {
        // TODO: Show fallback for browsers without voice support
        this.showMessage(
            'Voice input is not supported in this browser. Please use Chrome, Safari, or Firefox.',
            'warning'
        );
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mirrorUI = new MirrorSoftUI();
});
```

---

## Accessibility Features

### Keyboard Navigation
```javascript
// TODO: Implement full keyboard navigation
document.addEventListener('keydown', (e) => {
    // Space bar activates Cal orb
    if (e.code === 'Space' && e.target === document.getElementById('calOrb')) {
        e.preventDefault();
        mirrorUI.toggleVoiceRecognition();
    }
    
    // ESC cancels voice recognition
    if (e.code === 'Escape' && mirrorUI.isListening) {
        mirrorUI.recognition.stop();
    }
    
    // Enter activates buttons
    if (e.code === 'Enter' && e.target.classList.contains('action-btn')) {
        e.target.click();
    }
});
```

### Screen Reader Support
```html
<!-- TODO: Add ARIA labels and roles -->
<div class="cal-orb" 
     role="button" 
     tabindex="0"
     aria-label="Voice reflection button. Press to start speaking your thoughts"
     aria-describedby="voice-instructions">
</div>

<div id="voice-instructions" class="sr-only">
    Press and hold to record your reflection. Speak naturally about what's on your mind.
</div>

<!-- Live region for status updates -->
<div aria-live="polite" aria-atomic="true" class="sr-only" id="status-announcements"></div>
```

### Focus Management
```javascript
// TODO: Implement proper focus management
function manageFocus() {
    // Trap focus within modal dialogs
    // Return focus to trigger element after closing
    // Announce status changes to screen readers
}
```

---

## Integration Points

### API Endpoints Used
- `GET /api/config` → Load current mode configuration
- `POST /api/voice-reflection` → Process voice input
- `POST /api/create-payment-intent` → Create Stripe payment
- `GET /api/reflections/count` → Get folder counts
- `POST /api/export` → Export reflection

### Local Storage Usage
```javascript
// TODO: Store user preferences locally
localStorage.setItem('mirror_user_name', userName);
localStorage.setItem('mirror_voice_enabled', 'true');
localStorage.setItem('mirror_last_reflection', JSON.stringify(reflection));
```

### Event System
```javascript
// TODO: Custom events for module communication
window.dispatchEvent(new CustomEvent('mirror:reflection-created', {
    detail: { reflection: this.currentReflection }
}));

window.dispatchEvent(new CustomEvent('mirror:export-completed', {
    detail: { exportId: result.exportId }
}));
```

**Implementation Priority**: Start with basic HTML structure and CSS, add voice recognition, implement reflection processing, then add export functionality and accessibility features.