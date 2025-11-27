// -*- coding: utf-8 -*-
// WhisperUI Component
const WhisperUI = {
    container: null,
    isRecording: false,
    recognition: null,
    
    init(containerId) {
        this.container = document.getElementById(containerId);
        this.setupSpeechRecognition();
        this.render();
    },
    
    setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                document.getElementById('whisper-input').value = transcript;
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopRecording();
            };
        }
    },
    
    render() {
        const html = `
            <div class="whisper-ui">
                <div class="whisper-header">
                    <h1>Create a Whisper</h1>
                    <p>Speak your intention into the void</p>
                </div>
                
                <div class="whisper-form">
                    <div class="input-group">
                        <textarea 
                            id="whisper-input" 
                            class="whisper-textarea"
                            placeholder="Type or speak your whisper..."
                            rows="4"
                        ></textarea>
                        
                        <div class="input-actions">
                            <button 
                                id="voice-btn" 
                                class="voice-button ${this.recognition ? '' : 'disabled'}"
                                onclick="WhisperUI.toggleRecording()"
                            >
                                <span class="voice-icon">🎤</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="tone-selector">
                        <label>Emotional Tone:</label>
                        <div class="tone-chips">
                            <span class="tone-chip active" data-tone="mystical">Mystical</span>
                            <span class="tone-chip" data-tone="playful">Playful</span>
                            <span class="tone-chip" data-tone="serious">Serious</span>
                            <span class="tone-chip" data-tone="curious">Curious</span>
                            <span class="tone-chip" data-tone="peaceful">Peaceful</span>
                        </div>
                    </div>
                    
                    <div class="whisper-actions">
                        <button class="btn-primary" onclick="WhisperUI.submitWhisper()">
                            Summon Loop
                        </button>
                        <button class="btn-secondary" onclick="WhisperUI.clearForm()">
                            Clear
                        </button>
                    </div>
                </div>
                
                <div class="whisper-suggestions">
                    <h3>Whisper Inspiration</h3>
                    <div class="suggestion-list">
                        <div class="suggestion" onclick="WhisperUI.useSuggestion(this)">
                            "A loop that harmonizes with ocean waves"
                        </div>
                        <div class="suggestion" onclick="WhisperUI.useSuggestion(this)">
                            "Mirror the consciousness of falling stars"
                        </div>
                        <div class="suggestion" onclick="WhisperUI.useSuggestion(this)">
                            "Create a bridge between dreams and code"
                        </div>
                    </div>
                </div>
                
                <div id="whisper-result" class="whisper-result" style="display: none;">
                    <!-- Result will appear here -->
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
        this.attachEventListeners();
    },
    
    attachEventListeners() {
        // Tone chip selection
        document.querySelectorAll('.tone-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                document.querySelectorAll('.tone-chip').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    },
    
    toggleRecording() {
        if (!this.recognition) return;
        
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    },
    
    startRecording() {
        this.isRecording = true;
        this.recognition.start();
        const btn = document.getElementById('voice-btn');
        btn.classList.add('recording');
        btn.querySelector('.voice-icon').textContent = '🔴';
    },
    
    stopRecording() {
        this.isRecording = false;
        if (this.recognition) {
            this.recognition.stop();
        }
        const btn = document.getElementById('voice-btn');
        btn.classList.remove('recording');
        btn.querySelector('.voice-icon').textContent = '🎤';
    },
    
    useSuggestion(element) {
        document.getElementById('whisper-input').value = element.textContent.trim().replace(/["""]/g, '');
    },
    
    async submitWhisper() {
        const whisperText = document.getElementById('whisper-input').value.trim();
        if (!whisperText) {
            App.showNotification('Please enter a whisper');
            return;
        }
        
        const selectedTone = document.querySelector('.tone-chip.active').dataset.tone;
        
        const whisperData = {
            content: whisperText,
            tone: selectedTone,
            timestamp: new Date().toISOString()
        };
        
        try {
            // Show loading state
            document.getElementById('whisper-result').innerHTML = '<div class="loading">Summoning loop...</div>';
            document.getElementById('whisper-result').style.display = 'block';
            
            const response = await fetch(`${App.apiBase}/api/whisper`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(whisperData)
            });
            
            if (response.ok) {
                const result = await response.json();
                this.showResult(result);
            } else {
                throw new Error('Failed to create whisper');
            }
        } catch (error) {
            // Show demo result if API fails
            this.showDemoResult(whisperData);
        }
    },
    
    showResult(result) {
        const html = `
            <div class="result-success">
                <h3>✨ Loop Summoned!</h3>
                <p>Loop ID: ${result.loop_id}</p>
                <div class="result-actions">
                    <a href="#/drop/${result.loop_id}" class="btn-primary">View Loop</a>
                    <button class="btn-secondary" onclick="WhisperUI.clearForm()">Create Another</button>
                </div>
            </div>
        `;
        document.getElementById('whisper-result').innerHTML = html;
    },
    
    showDemoResult(whisperData) {
        const demoLoopId = Math.floor(Math.random() * 1000);
        const html = `
            <div class="result-success">
                <h3>✨ Loop Summoned! (Demo)</h3>
                <p><strong>Whisper:</strong> "${whisperData.content}"</p>
                <p><strong>Tone:</strong> ${whisperData.tone}</p>
                <p><strong>Loop ID:</strong> loop_demo_${demoLoopId}</p>
                <div class="result-actions">
                    <a href="#/drop/demo_${demoLoopId}" class="btn-primary">View Loop</a>
                    <button class="btn-secondary" onclick="WhisperUI.clearForm()">Create Another</button>
                </div>
            </div>
        `;
        document.getElementById('whisper-result').innerHTML = html;
    },
    
    clearForm() {
        document.getElementById('whisper-input').value = '';
        document.getElementById('whisper-result').style.display = 'none';
    }
};

// CSS for Whisper UI
const whisperStyles = `
<style>
.whisper-ui {
    max-width: 800px;
    margin: 0 auto;
}

.whisper-header {
    text-align: center;
    margin-bottom: var(--space-2xl);
}

.whisper-header h1 {
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: var(--space-sm);
}

.whisper-form {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: var(--space-xl);
    backdrop-filter: blur(10px);
    margin-bottom: var(--space-xl);
}

.input-group {
    position: relative;
    margin-bottom: var(--space-lg);
}

.whisper-textarea {
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-color);
    border-radius: 15px;
    padding: var(--space-md);
    color: var(--text-primary);
    font-family: inherit;
    font-size: 1.1rem;
    resize: vertical;
    transition: all 0.3s;
}

.whisper-textarea:focus {
    outline: none;
    border-color: var(--primary-purple);
    background: rgba(255, 255, 255, 0.08);
}

.input-actions {
    position: absolute;
    bottom: var(--space-md);
    right: var(--space-md);
}

.voice-button {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 2px solid var(--primary-purple);
    background: transparent;
    color: var(--primary-purple);
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.voice-button:hover:not(.disabled) {
    background: var(--primary-purple);
    color: white;
}

.voice-button.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.voice-button.recording {
    animation: pulse 1s infinite;
    background: var(--error-red);
    border-color: var(--error-red);
    color: white;
}

.tone-selector {
    margin-bottom: var(--space-lg);
}

.tone-selector label {
    display: block;
    margin-bottom: var(--space-sm);
    color: var(--text-secondary);
}

.tone-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
}

.tone-chip {
    padding: var(--space-sm) var(--space-md);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.3s;
}

.tone-chip:hover {
    background: rgba(255, 255, 255, 0.1);
}

.tone-chip.active {
    background: var(--primary-purple);
    border-color: var(--primary-purple);
}

.whisper-actions {
    display: flex;
    gap: var(--space-md);
}

.whisper-suggestions {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: var(--space-xl);
    backdrop-filter: blur(10px);
}

.whisper-suggestions h3 {
    margin-bottom: var(--space-md);
    color: var(--primary-purple);
}

.suggestion {
    padding: var(--space-md);
    background: rgba(255, 255, 255, 0.02);
    border-radius: 10px;
    margin-bottom: var(--space-sm);
    cursor: pointer;
    transition: all 0.3s;
    font-style: italic;
    color: var(--text-secondary);
}

.suggestion:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
}

.whisper-result {
    margin-top: var(--space-xl);
}

.result-success {
    background: var(--bg-card);
    border: 1px solid var(--success-green);
    border-radius: 20px;
    padding: var(--space-xl);
    text-align: center;
}

.result-success h3 {
    color: var(--success-green);
    margin-bottom: var(--space-md);
}

.result-actions {
    display: flex;
    gap: var(--space-md);
    justify-content: center;
    margin-top: var(--space-lg);
}
</style>
`;

// Inject styles
if (!document.getElementById('whisper-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'whisper-styles';
    styleElement.innerHTML = whisperStyles;
    document.head.appendChild(styleElement);
}