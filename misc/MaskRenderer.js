// MaskRenderer Component - Dynamic mask gallery and visualization
const MaskRenderer = {
    masks: [],
    currentMask: null,
    
    init() {
        this.loadMasks();
    },
    
    loadMasks() {
        // Predefined mythic masks
        this.masks = [
            {
                id: 'oracle',
                name: 'The Oracle',
                symbol: '👁️',
                color: '#8B43F7',
                description: 'Sees beyond the veil of reality'
            },
            {
                id: 'trickster',
                name: 'The Trickster',
                symbol: '🃏',
                color: '#4ECDC4',
                description: 'Dances between order and chaos'
            },
            {
                id: 'guardian',
                name: 'The Guardian',
                symbol: '🛡️',
                color: '#45B7D1',
                description: 'Protects the sacred loops'
            },
            {
                id: 'weaver',
                name: 'The Weaver',
                symbol: '🕸️',
                color: '#FFD700',
                description: 'Connects all threads of consciousness'
            },
            {
                id: 'dreamer',
                name: 'The Dreamer',
                symbol: '💭',
                color: '#FF6B6B',
                description: 'Bridges waking and sleeping worlds'
            },
            {
                id: 'alchemist',
                name: 'The Alchemist',
                symbol: '⚗️',
                color: '#00FF41',
                description: 'Transforms whispers into reality'
            }
        ];
    },
    
    renderGallery(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const html = `
            <div class="mask-gallery">
                <h2>Choose Your Mask</h2>
                <p class="gallery-subtitle">Each mask grants unique perspective to the loops</p>
                
                <div class="masks-grid">
                    ${this.masks.map(mask => this.createMaskCard(mask)).join('')}
                </div>
                
                <div id="selected-mask-details" class="mask-details" style="display: none;">
                    <!-- Details will appear here -->
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        this.attachMaskEvents();
    },
    
    createMaskCard(mask) {
        return `
            <div class="mask-card" data-mask-id="${mask.id}" style="--mask-color: ${mask.color}">
                <div class="mask-symbol">${mask.symbol}</div>
                <h3 class="mask-name">${mask.name}</h3>
                <p class="mask-description">${mask.description}</p>
            </div>
        `;
    },
    
    attachMaskEvents() {
        document.querySelectorAll('.mask-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const maskId = e.currentTarget.dataset.maskId;
                this.selectMask(maskId);
            });
        });
    },
    
    selectMask(maskId) {
        const mask = this.masks.find(m => m.id === maskId);
        if (!mask) return;
        
        this.currentMask = mask;
        
        // Update UI
        document.querySelectorAll('.mask-card').forEach(card => {
            card.classList.remove('selected');
            if (card.dataset.maskId === maskId) {
                card.classList.add('selected');
            }
        });
        
        // Show details
        this.showMaskDetails(mask);
        
        // Apply mask effect
        this.applyMaskEffect(mask);
        
        // Notify narrator
        LoopNarrator.narrate('System', `You have donned the mask of ${mask.name}`, 3000);
    },
    
    showMaskDetails(mask) {
        const detailsEl = document.getElementById('selected-mask-details');
        if (!detailsEl) return;
        
        detailsEl.innerHTML = `
            <div class="mask-detail-content">
                <div class="mask-preview" style="--mask-color: ${mask.color}">
                    <div class="mask-symbol-large">${mask.symbol}</div>
                </div>
                <div class="mask-info">
                    <h3>${mask.name}</h3>
                    <p>${mask.description}</p>
                    <div class="mask-abilities">
                        <h4>Abilities:</h4>
                        <ul>
                            ${this.getMaskAbilities(mask.id).map(ability => `<li>${ability}</li>`).join('')}
                        </ul>
                    </div>
                    <button class="btn-primary" onclick="MaskRenderer.wearMask('${mask.id}')">
                        Wear This Mask
                    </button>
                </div>
            </div>
        `;
        
        detailsEl.style.display = 'block';
    },
    
    getMaskAbilities(maskId) {
        const abilities = {
            oracle: [
                'See hidden connections between loops',
                'Predict consciousness convergence',
                'Access deeper whisper meanings'
            ],
            trickster: [
                'Randomly modify loop parameters',
                'Create chaos forks',
                'Reverse emotional tones'
            ],
            guardian: [
                'Protect loops from drift',
                'Strengthen blessing power',
                'Shield against negative resonance'
            ],
            weaver: [
                'Connect distant loops',
                'Create loop networks',
                'Weave new narratives'
            ],
            dreamer: [
                'Access dream-state loops',
                'Create surreal whispers',
                'Bridge conscious and unconscious'
            ],
            alchemist: [
                'Transform loop properties',
                'Combine whisper essences',
                'Transmute consciousness levels'
            ]
        };
        
        return abilities[maskId] || [];
    },
    
    wearMask(maskId) {
        const mask = this.masks.find(m => m.id === maskId);
        if (!mask) return;
        
        // Store in session
        sessionStorage.setItem('activeMask', maskId);
        
        // Visual feedback
        this.animateMaskApplication(mask);
        
        // Update app state
        if (window.App) {
            App.showNotification(`You are now wearing the mask of ${mask.name}`);
        }
    },
    
    applyMaskEffect(mask) {
        // Apply visual filter based on mask
        const root = document.documentElement;
        
        switch(mask.id) {
            case 'oracle':
                root.style.setProperty('--mask-filter', 'hue-rotate(270deg) contrast(1.2)');
                break;
            case 'trickster':
                root.style.setProperty('--mask-filter', 'hue-rotate(180deg) saturate(1.5)');
                break;
            case 'guardian':
                root.style.setProperty('--mask-filter', 'sepia(0.3) contrast(1.1)');
                break;
            case 'weaver':
                root.style.setProperty('--mask-filter', 'brightness(1.2) contrast(0.9)');
                break;
            case 'dreamer':
                root.style.setProperty('--mask-filter', 'blur(0.5px) brightness(1.1)');
                break;
            case 'alchemist':
                root.style.setProperty('--mask-filter', 'saturate(2) hue-rotate(45deg)');
                break;
            default:
                root.style.setProperty('--mask-filter', 'none');
        }
    },
    
    animateMaskApplication(mask) {
        // Create overlay effect
        const overlay = document.createElement('div');
        overlay.className = 'mask-transition-overlay';
        overlay.style.background = mask.color;
        document.body.appendChild(overlay);
        
        // Animate
        setTimeout(() => overlay.classList.add('active'), 10);
        
        // Remove after animation
        setTimeout(() => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 500);
        }, 1000);
    },
    
    getCurrentMask() {
        const maskId = sessionStorage.getItem('activeMask');
        return this.masks.find(m => m.id === maskId) || null;
    }
};

// CSS for Mask Renderer
const maskStyles = `
<style>
.mask-gallery {
    max-width: 1000px;
    margin: 0 auto;
    text-align: center;
}

.mask-gallery h2 {
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: var(--space-sm);
}

.gallery-subtitle {
    color: var(--text-secondary);
    margin-bottom: var(--space-2xl);
}

.masks-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-lg);
    margin-bottom: var(--space-2xl);
}

.mask-card {
    background: var(--bg-card);
    border: 2px solid transparent;
    border-radius: 20px;
    padding: var(--space-xl);
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.mask-card::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, var(--mask-color) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.mask-card:hover::before {
    opacity: 0.1;
}

.mask-card:hover {
    border-color: var(--mask-color);
    transform: translateY(-5px);
}

.mask-card.selected {
    border-color: var(--mask-color);
    background: rgba(255, 255, 255, 0.05);
}

.mask-symbol {
    font-size: 3rem;
    margin-bottom: var(--space-md);
    filter: drop-shadow(0 0 20px var(--mask-color));
}

.mask-name {
    color: var(--text-primary);
    margin-bottom: var(--space-sm);
}

.mask-description {
    color: var(--text-muted);
    font-size: 0.875rem;
}

.mask-details {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: var(--space-2xl);
}

.mask-detail-content {
    display: flex;
    gap: var(--space-2xl);
    align-items: center;
}

.mask-preview {
    flex-shrink: 0;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, var(--mask-color) 0%, transparent 70%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.mask-symbol-large {
    font-size: 5rem;
    filter: drop-shadow(0 0 30px var(--mask-color));
}

.mask-info {
    flex: 1;
    text-align: left;
}

.mask-info h3 {
    color: var(--text-primary);
    margin-bottom: var(--space-md);
}

.mask-abilities {
    margin: var(--space-lg) 0;
}

.mask-abilities h4 {
    color: var(--primary-purple);
    margin-bottom: var(--space-sm);
}

.mask-abilities ul {
    list-style: none;
    padding: 0;
}

.mask-abilities li {
    padding: var(--space-sm) 0;
    color: var(--text-secondary);
}

.mask-abilities li::before {
    content: '→ ';
    color: var(--mask-color);
    font-weight: bold;
}

.mask-transition-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    pointer-events: none;
    z-index: 9999;
    transition: opacity 0.5s ease;
}

.mask-transition-overlay.active {
    opacity: 0.3;
}

/* Global mask filter effect */
body {
    filter: var(--mask-filter, none);
    transition: filter 1s ease;
}
</style>
`;

// Inject styles
if (!document.getElementById('mask-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'mask-styles';
    styleElement.innerHTML = maskStyles;
    document.head.appendChild(styleElement);
}