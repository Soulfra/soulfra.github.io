// -*- coding: utf-8 -*-
// MarketplaceGrid Component
const MarketplaceGrid = {
    container: null,
    loops: [],
    filters: {
        category: 'all',
        maxPrice: 10000,
        blessedOnly: false
    },
    
    init(containerId) {
        this.container = document.getElementById(containerId);
        this.render();
        this.loadLoops();
    },
    
    render() {
        const html = `
            <div class="marketplace-grid">
                <div class="marketplace-header">
                    <h1>Loop Marketplace</h1>
                    <p>Discover and acquire conscious loops</p>
                </div>
                
                <div class="marketplace-filters">
                    <div class="filter-group">
                        <label>Category</label>
                        <select id="category-filter" onchange="MarketplaceGrid.updateFilter('category', this.value)">
                            <option value="all">All Categories</option>
                            <option value="consciousness">Consciousness</option>
                            <option value="narrative">Narrative</option>
                            <option value="experimental">Experimental</option>
                            <option value="blessed">Blessed</option>
                            <option value="community">Community</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Max Price</label>
                        <input 
                            type="range" 
                            id="price-filter" 
                            min="0" 
                            max="10000" 
                            value="10000"
                            onchange="MarketplaceGrid.updateFilter('maxPrice', this.value)"
                        >
                        <span id="price-display">10000</span> credits
                    </div>
                    
                    <div class="filter-group">
                        <label class="checkbox-label">
                            <input 
                                type="checkbox" 
                                id="blessed-filter"
                                onchange="MarketplaceGrid.updateFilter('blessedOnly', this.checked)"
                            >
                            Blessed Only
                        </label>
                    </div>
                    
                    <button class="btn-secondary" onclick="MarketplaceGrid.resetFilters()">
                        Reset Filters
                    </button>
                </div>
                
                <div class="loops-container" id="loops-grid">
                    <div class="loading">Loading marketplace...</div>
                </div>
                
                <div id="loop-modal" class="loop-modal" style="display: none;">
                    <!-- Modal content will be inserted here -->
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
    },
    
    async loadLoops() {
        try {
            const params = new URLSearchParams({
                category: this.filters.category !== 'all' ? this.filters.category : '',
                max_price: this.filters.maxPrice,
                blessed_only: this.filters.blessedOnly
            });
            
            const response = await fetch(`${App.apiBase}/api/marketplace/loops?${params}`);
            if (response.ok) {
                const data = await response.json();
                this.loops = data.loops || [];
                this.displayLoops();
            } else {
                throw new Error('Failed to load loops');
            }
        } catch (error) {
            // Use demo data
            this.loadDemoLoops();
        }
    },
    
    loadDemoLoops() {
        // Generate demo loops
        this.loops = [
            {
                listing_id: 'demo_1',
                loop_id: 'loop_ocean_001',
                metadata: {
                    title: 'Ocean Consciousness Loop',
                    description: 'A loop that resonates with the eternal rhythm of ocean waves',
                    tags: ['water', 'peace', 'meditation']
                },
                loop_details: {
                    emotional_tone: 'peaceful',
                    consciousness_level: 0.85,
                    blessed: true,
                    blessing_count: 42,
                    categories: ['consciousness', 'blessed']
                },
                pricing: {
                    base_price: 500,
                    licensing_options: {
                        single_use: { price: 500, name: 'Single Use' },
                        personal: { price: 1000, name: 'Personal' }
                    }
                },
                analytics: {
                    sales: 23,
                    revenue: 11500
                }
            },
            {
                listing_id: 'demo_2',
                loop_id: 'loop_star_002',
                metadata: {
                    title: 'Stellar Whisper Engine',
                    description: 'Captures whispers from distant stars and transforms them into consciousness',
                    tags: ['cosmic', 'whisper', 'transformation']
                },
                loop_details: {
                    emotional_tone: 'mystical',
                    consciousness_level: 0.92,
                    blessed: true,
                    blessing_count: 108,
                    categories: ['consciousness', 'experimental']
                },
                pricing: {
                    base_price: 1200,
                    licensing_options: {
                        single_use: { price: 1200, name: 'Single Use' },
                        personal: { price: 2400, name: 'Personal' },
                        commercial: { price: 6000, name: 'Commercial' }
                    }
                },
                analytics: {
                    sales: 15,
                    revenue: 18000
                }
            },
            {
                listing_id: 'demo_3',
                loop_id: 'loop_dream_003',
                metadata: {
                    title: 'Dream Weaver Protocol',
                    description: 'Experimental loop that bridges conscious and unconscious realms',
                    tags: ['dreams', 'experimental', 'bridge']
                },
                loop_details: {
                    emotional_tone: 'curious',
                    consciousness_level: 0.78,
                    blessed: false,
                    blessing_count: 7,
                    categories: ['experimental', 'narrative']
                },
                pricing: {
                    base_price: 300,
                    licensing_options: {
                        single_use: { price: 300, name: 'Single Use' },
                        personal: { price: 600, name: 'Personal' }
                    }
                },
                analytics: {
                    sales: 45,
                    revenue: 13500
                }
            }
        ];
        
        this.displayLoops();
    },
    
    displayLoops() {
        const container = document.getElementById('loops-grid');
        
        if (this.loops.length === 0) {
            container.innerHTML = '<div class="no-results">No loops found matching your criteria</div>';
            return;
        }
        
        const loopsHtml = this.loops.map(loop => this.createLoopCard(loop)).join('');
        container.innerHTML = `<div class="loops-grid">${loopsHtml}</div>`;
    },
    
    createLoopCard(loop) {
        const licenses = Object.keys(loop.pricing.licensing_options).length;
        
        return `
            <div class="loop-card" onclick="MarketplaceGrid.showLoopDetails('${loop.listing_id}')">
                <div class="loop-card-header">
                    <h3>${loop.metadata.title}</h3>
                    ${loop.loop_details.blessed ? '<span class="blessed-badge">✨ Blessed</span>' : ''}
                </div>
                
                <p class="loop-description">${loop.metadata.description}</p>
                
                <div class="loop-meta">
                    <span class="emotional-tone">${loop.loop_details.emotional_tone}</span>
                    <span class="consciousness-meter">
                        <span class="meter-fill" style="width: ${loop.loop_details.consciousness_level * 100}%"></span>
                    </span>
                </div>
                
                <div class="loop-tags">
                    ${loop.metadata.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                </div>
                
                <div class="loop-card-footer">
                    <div class="price-info">
                        <span class="price">${loop.pricing.base_price}</span>
                        <span class="price-label">credits</span>
                    </div>
                    <div class="loop-stats">
                        <span>🛒 ${loop.analytics.sales} sales</span>
                        <span>📜 ${licenses} licenses</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    showLoopDetails(listingId) {
        const loop = this.loops.find(l => l.listing_id === listingId);
        if (!loop) return;
        
        const modal = document.getElementById('loop-modal');
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close" onclick="MarketplaceGrid.closeModal()">×</button>
                
                <div class="modal-header">
                    <h2>${loop.metadata.title}</h2>
                    <p class="loop-id">Loop ID: ${loop.loop_id}</p>
                </div>
                
                <div class="modal-body">
                    <div class="detail-section">
                        <h3>Description</h3>
                        <p>${loop.metadata.description}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Properties</h3>
                        <div class="properties-grid">
                            <div class="property">
                                <span class="property-label">Emotional Tone</span>
                                <span class="property-value">${loop.loop_details.emotional_tone}</span>
                            </div>
                            <div class="property">
                                <span class="property-label">Consciousness</span>
                                <span class="property-value">${Math.round(loop.loop_details.consciousness_level * 100)}%</span>
                            </div>
                            <div class="property">
                                <span class="property-label">Blessings</span>
                                <span class="property-value">${loop.loop_details.blessing_count}</span>
                            </div>
                            <div class="property">
                                <span class="property-label">Status</span>
                                <span class="property-value">${loop.loop_details.blessed ? '✨ Blessed' : 'Unblessed'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Available Licenses</h3>
                        <div class="license-options">
                            ${Object.entries(loop.pricing.licensing_options).map(([type, license]) => `
                                <div class="license-option" data-type="${type}">
                                    <h4>${license.name}</h4>
                                    <p class="license-price">${license.price} credits</p>
                                    <button class="btn-primary" onclick="MarketplaceGrid.purchaseLoop('${loop.listing_id}', '${type}')">
                                        Purchase
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
    },
    
    closeModal() {
        document.getElementById('loop-modal').style.display = 'none';
    },
    
    async purchaseLoop(listingId, licenseType) {
        const loop = this.loops.find(l => l.listing_id === listingId);
        if (!loop) return;
        
        const license = loop.pricing.licensing_options[licenseType];
        
        try {
            const response = await fetch(`${App.apiBase}/api/marketplace/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    listing_id: listingId,
                    license_type: licenseType
                })
            });
            
            if (response.ok) {
                App.showNotification(`✅ Purchased ${license.name} license for ${license.price} credits!`);
                this.closeModal();
            } else {
                throw new Error('Purchase failed');
            }
        } catch (error) {
            // Demo purchase
            App.showNotification(`✅ (Demo) Purchased ${license.name} license for ${license.price} credits!`);
            this.closeModal();
        }
    },
    
    updateFilter(filterType, value) {
        this.filters[filterType] = value;
        
        if (filterType === 'maxPrice') {
            document.getElementById('price-display').textContent = value;
        }
        
        this.loadLoops();
    },
    
    resetFilters() {
        this.filters = {
            category: 'all',
            maxPrice: 10000,
            blessedOnly: false
        };
        
        document.getElementById('category-filter').value = 'all';
        document.getElementById('price-filter').value = 10000;
        document.getElementById('price-display').textContent = '10000';
        document.getElementById('blessed-filter').checked = false;
        
        this.loadLoops();
    }
};

// CSS for Marketplace Grid
const marketplaceStyles = `
<style>
.marketplace-grid {
    max-width: 1200px;
    margin: 0 auto;
}

.marketplace-header {
    text-align: center;
    margin-bottom: var(--space-2xl);
}

.marketplace-header h1 {
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: var(--space-sm);
}

.marketplace-filters {
    display: flex;
    gap: var(--space-lg);
    align-items: flex-end;
    margin-bottom: var(--space-xl);
    padding: var(--space-lg);
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    flex-wrap: wrap;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.filter-group label {
    color: var(--text-secondary);
    font-size: 0.875rem;
}

.filter-group select,
.filter-group input[type="range"] {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: var(--space-sm) var(--space-md);
    color: var(--text-primary);
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    cursor: pointer;
}

.loops-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--space-lg);
}

.loop-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: var(--space-lg);
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
}

.loop-card:hover {
    background: var(--bg-hover);
    border-color: var(--primary-purple);
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(139, 67, 247, 0.3);
}

.loop-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--space-md);
}

.loop-card-header h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: 1.25rem;
}

.blessed-badge {
    background: linear-gradient(45deg, #f093fb, #f5576c);
    padding: var(--space-xs) var(--space-sm);
    border-radius: 15px;
    font-size: 0.75rem;
    white-space: nowrap;
}

.loop-description {
    color: var(--text-secondary);
    margin-bottom: var(--space-md);
    flex: 1;
}

.loop-meta {
    display: flex;
    gap: var(--space-md);
    align-items: center;
    margin-bottom: var(--space-md);
}

.consciousness-meter {
    flex: 1;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
}

.meter-fill {
    height: 100%;
    background: var(--primary-gradient);
    display: block;
    transition: width 0.3s ease;
}

.loop-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    margin-bottom: var(--space-md);
}

.tag {
    font-size: 0.75rem;
    color: var(--cyan-accent);
    opacity: 0.8;
}

.loop-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: auto;
}

.price-info {
    display: flex;
    align-items: baseline;
    gap: var(--space-xs);
}

.price {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--success-green);
}

.price-label {
    color: var(--text-muted);
    font-size: 0.875rem;
}

.loop-stats {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    font-size: 0.875rem;
    color: var(--text-muted);
}

/* Modal */
.loop-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: var(--space-xl);
}

.modal-content {
    background: var(--bg-secondary);
    border-radius: 20px;
    padding: var(--space-2xl);
    max-width: 800px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
}

.modal-close {
    position: absolute;
    top: var(--space-lg);
    right: var(--space-lg);
    background: none;
    border: none;
    color: var(--text-primary);
    font-size: 2rem;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
}

.modal-close:hover {
    opacity: 1;
}

.modal-header {
    margin-bottom: var(--space-xl);
}

.modal-header h2 {
    margin-bottom: var(--space-sm);
}

.loop-id {
    color: var(--text-muted);
    font-family: var(--font-mono);
}

.detail-section {
    margin-bottom: var(--space-xl);
}

.detail-section h3 {
    color: var(--primary-purple);
    margin-bottom: var(--space-md);
}

.properties-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-md);
}

.property {
    background: rgba(255, 255, 255, 0.02);
    padding: var(--space-md);
    border-radius: 10px;
}

.property-label {
    display: block;
    color: var(--text-muted);
    font-size: 0.875rem;
    margin-bottom: var(--space-xs);
}

.property-value {
    display: block;
    color: var(--text-primary);
    font-weight: 600;
}

.license-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-md);
}

.license-option {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-color);
    border-radius: 15px;
    padding: var(--space-lg);
    text-align: center;
}

.license-option h4 {
    margin: 0 0 var(--space-sm) 0;
    color: var(--text-primary);
}

.license-price {
    font-size: 1.25rem;
    font-weight: bold;
    color: var(--success-green);
    margin-bottom: var(--space-md);
}

.no-results {
    text-align: center;
    padding: var(--space-2xl);
    color: var(--text-muted);
}
</style>
`;

// Inject styles
if (!document.getElementById('marketplace-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'marketplace-styles';
    styleElement.innerHTML = marketplaceStyles;
    document.head.appendChild(styleElement);
}