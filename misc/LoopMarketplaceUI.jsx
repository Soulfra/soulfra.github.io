import React, { useState, useEffect } from 'react';
import './LoopMarketplaceUI.css';

/**
 * Loop Marketplace UI Component
 * Frontend for the Loop Marketplace Daemon
 */
const LoopMarketplaceUI = () => {
    const [loops, setLoops] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedLicense, setSelectedLicense] = useState('all');
    const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
    const [loading, setLoading] = useState(false);
    const [selectedLoop, setSelectedLoop] = useState(null);
    const [userBalance, setUserBalance] = useState(1000); // Mock balance

    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:7777/api';

    // Fetch loops on component mount
    useEffect(() => {
        fetchLoops();
    }, [selectedCategory, priceRange]);

    const fetchLoops = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                category: selectedCategory !== 'all' ? selectedCategory : '',
                min_price: priceRange.min,
                max_price: priceRange.max
            });

            const response = await fetch(`${API_BASE}/marketplace/loops?${params}`);
            const data = await response.json();
            setLoops(data.loops || []);
        } catch (error) {
            console.error('Error fetching loops:', error);
        }
        setLoading(false);
    };

    const searchLoops = async () => {
        if (!searchQuery.trim()) {
            fetchLoops();
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/marketplace/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            setLoops(data.results || []);
        } catch (error) {
            console.error('Error searching loops:', error);
        }
        setLoading(false);
    };

    const purchaseLoop = async (listingId, licenseType) => {
        try {
            const response = await fetch(`${API_BASE}/marketplace/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({
                    listing_id: listingId,
                    license_type: licenseType
                })
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Purchase successful! License ID: ${result.license.license_id}`);
                setUserBalance(userBalance - result.transaction.price);
                setSelectedLoop(null);
            } else {
                const error = await response.json();
                alert(`Purchase failed: ${error.message}`);
            }
        } catch (error) {
            console.error('Error purchasing loop:', error);
            alert('Purchase failed. Please try again.');
        }
    };

    const LoopCard = ({ loop }) => (
        <div className="loop-card" onClick={() => setSelectedLoop(loop)}>
            <div className="loop-header">
                <h3>{loop.metadata.title}</h3>
                {loop.loop_details.blessed && <span className="blessed-badge">✨ Blessed</span>}
            </div>
            <p className="loop-description">{loop.metadata.description}</p>
            <div className="loop-stats">
                <span className="emotional-tone">{loop.loop_details.emotional_tone}</span>
                <span className="consciousness-level">
                    Consciousness: {(loop.loop_details.consciousness_level * 100).toFixed(0)}%
                </span>
            </div>
            <div className="loop-pricing">
                <span className="base-price">{loop.pricing.base_price} credits</span>
                <span className="license-count">
                    {Object.keys(loop.pricing.licensing_options).length} licenses
                </span>
            </div>
            <div className="loop-footer">
                <span className="sales-count">🛒 {loop.analytics.sales} sales</span>
                <span className="revenue">💰 {loop.analytics.revenue} credits</span>
            </div>
        </div>
    );

    const LoopDetailModal = ({ loop, onClose }) => {
        const [selectedLicense, setSelectedLicense] = useState('single_use');

        if (!loop) return null;

        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <button className="close-button" onClick={onClose}>×</button>
                    
                    <h2>{loop.metadata.title}</h2>
                    <p className="loop-uri">URI: {loop.loop_uri}</p>
                    
                    <div className="detail-section">
                        <h3>Description</h3>
                        <p>{loop.metadata.description}</p>
                    </div>

                    <div className="detail-section">
                        <h3>Loop Properties</h3>
                        <div className="properties-grid">
                            <div>Emotional Tone: {loop.loop_details.emotional_tone}</div>
                            <div>Consciousness: {(loop.loop_details.consciousness_level * 100).toFixed(0)}%</div>
                            <div>Blessing Count: {loop.loop_details.blessing_count}</div>
                            <div>Fork Depth: {loop.loop_details.fork_depth}</div>
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3>Available Licenses</h3>
                        <div className="license-options">
                            {Object.entries(loop.pricing.licensing_options).map(([type, license]) => (
                                <div 
                                    key={type}
                                    className={`license-option ${selectedLicense === type ? 'selected' : ''}`}
                                    onClick={() => setSelectedLicense(type)}
                                >
                                    <h4>{license.name}</h4>
                                    <p className="license-price">{license.price} credits</p>
                                    <ul className="license-features">
                                        <li>Modification: {license.allows_modification ? '✅' : '❌'}</li>
                                        <li>Redistribution: {license.allows_redistribution ? '✅' : '❌'}</li>
                                        {license.allows_sublicensing && <li>Sublicensing: ✅</li>}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="purchase-section">
                        <div className="price-summary">
                            <span>Total: {loop.pricing.licensing_options[selectedLicense]?.price} credits</span>
                            <span>Your balance: {userBalance} credits</span>
                        </div>
                        <button 
                            className="purchase-button"
                            onClick={() => purchaseLoop(loop.listing_id, selectedLicense)}
                            disabled={userBalance < loop.pricing.licensing_options[selectedLicense]?.price}
                        >
                            Purchase {loop.pricing.licensing_options[selectedLicense]?.name}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="loop-marketplace">
            <header className="marketplace-header">
                <h1>Loop Marketplace</h1>
                <div className="user-info">
                    <span className="balance">💳 {userBalance} credits</span>
                </div>
            </header>

            <div className="marketplace-controls">
                <div className="search-section">
                    <input
                        type="text"
                        placeholder="Search loops..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchLoops()}
                    />
                    <button onClick={searchLoops}>Search</button>
                </div>

                <div className="filter-section">
                    <select 
                        value={selectedCategory} 
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        <option value="consciousness">Consciousness</option>
                        <option value="narrative">Narrative</option>
                        <option value="experimental">Experimental</option>
                        <option value="blessed">Blessed</option>
                        <option value="community">Community</option>
                    </select>

                    <div className="price-filter">
                        <label>Max Price:</label>
                        <input
                            type="range"
                            min="0"
                            max="10000"
                            value={priceRange.max}
                            onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                        />
                        <span>{priceRange.max} credits</span>
                    </div>
                </div>
            </div>

            <div className="marketplace-stats">
                <div className="stat">
                    <span className="stat-value">{loops.length}</span>
                    <span className="stat-label">Available Loops</span>
                </div>
                <div className="stat">
                    <span className="stat-value">{loops.filter(l => l.loop_details.blessed).length}</span>
                    <span className="stat-label">Blessed Loops</span>
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading loops...</div>
            ) : (
                <div className="loops-grid">
                    {loops.map(loop => (
                        <LoopCard key={loop.listing_id} loop={loop} />
                    ))}
                </div>
            )}

            {selectedLoop && (
                <LoopDetailModal 
                    loop={selectedLoop} 
                    onClose={() => setSelectedLoop(null)} 
                />
            )}
        </div>
    );
};

export default LoopMarketplaceUI;