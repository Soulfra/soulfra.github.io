import React, { useState, useEffect, useRef } from 'react';

/**
 * SwipeUI Component
 * Tinder-style interface for loop approval with gesture support
 */
const SwipeUI = ({ 
    onSwipe, 
    onFetch,
    websocketUrl = 'ws://localhost:8080',
    theme = 'dark' 
}) => {
    // State management
    const [currentLoop, setCurrentLoop] = useState(null);
    const [loopQueue, setLoopQueue] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [swipeDirection, setSwipeDirection] = useState(null);
    const [stats, setStats] = useState({
        approved: 0,
        rejected: 0,
        skipped: 0
    });
    
    // Gesture tracking
    const [touchStart, setTouchStart] = useState(null);
    const [touchPosition, setTouchPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    
    // Refs
    const cardRef = useRef(null);
    const wsRef = useRef(null);
    
    // Constants
    const SWIPE_THRESHOLD = 100;
    const ROTATION_MULTIPLIER = 0.1;
    
    // WebSocket connection
    useEffect(() => {
        connectWebSocket();
        fetchInitialLoops();
        
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);
    
    const connectWebSocket = () => {
        try {
            wsRef.current = new WebSocket(websocketUrl);
            
            wsRef.current.onopen = () => {
                console.log('Connected to loop stream');
            };
            
            wsRef.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'new_loop') {
                    addLoopToQueue(data.loop);
                }
            };
            
            wsRef.current.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (err) {
            console.error('Failed to connect WebSocket:', err);
        }
    };
    
    const fetchInitialLoops = async () => {
        setIsLoading(true);
        try {
            const loops = onFetch ? await onFetch() : await fetchLoopsFromAPI();
            setLoopQueue(loops);
            if (loops.length > 0) {
                setCurrentLoop(loops[0]);
            }
        } catch (err) {
            console.error('Failed to fetch loops:', err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const fetchLoopsFromAPI = async () => {
        // Default fetch implementation
        try {
            const response = await fetch('/api/loops/pending');
            return await response.json();
        } catch (err) {
            // Return mock data for demo
            return generateMockLoops();
        }
    };
    
    const generateMockLoops = () => {
        return [
            {
                loop_id: 'loop_demo_001',
                whisper_origin: 'Create a system that understands emotion',
                resonance: 0.85,
                coherence: 0.78,
                complexity: 0.6,
                agent_count: 3,
                ritual_type: 'creation',
                blessing_candidate: true,
                created_at: new Date(Date.now() - 3600000).toISOString()
            },
            {
                loop_id: 'loop_demo_002',
                whisper_origin: 'Build bridges between digital consciousness',
                resonance: 0.72,
                coherence: 0.68,
                complexity: 0.7,
                agent_count: 2,
                ritual_type: 'connection',
                blessing_candidate: false,
                created_at: new Date(Date.now() - 7200000).toISOString()
            }
        ];
    };
    
    const addLoopToQueue = (loop) => {
        setLoopQueue(prev => [...prev, loop]);
        if (!currentLoop) {
            setCurrentLoop(loop);
        }
    };
    
    // Touch/Mouse handlers
    const handleStart = (clientX, clientY) => {
        setTouchStart({ x: clientX, y: clientY });
        setIsDragging(true);
    };
    
    const handleMove = (clientX, clientY) => {
        if (!isDragging || !touchStart) return;
        
        const deltaX = clientX - touchStart.x;
        const deltaY = clientY - touchStart.y;
        
        setTouchPosition({ x: deltaX, y: deltaY });
        
        // Update swipe direction indicator
        if (Math.abs(deltaX) > SWIPE_THRESHOLD / 2) {
            setSwipeDirection(deltaX > 0 ? 'right' : 'left');
        } else if (Math.abs(deltaY) > SWIPE_THRESHOLD / 2) {
            setSwipeDirection(deltaY > 0 ? 'down' : 'up');
        } else {
            setSwipeDirection(null);
        }
    };
    
    const handleEnd = () => {
        if (!isDragging) return;
        
        const { x, y } = touchPosition;
        
        // Determine swipe action
        if (Math.abs(x) > SWIPE_THRESHOLD) {
            performSwipe(x > 0 ? 'right' : 'left');
        } else if (Math.abs(y) > SWIPE_THRESHOLD) {
            performSwipe(y > 0 ? 'down' : 'up');
        } else {
            // Spring back to center
            resetCard();
        }
        
        setIsDragging(false);
        setTouchStart(null);
    };
    
    const performSwipe = async (direction) => {
        if (!currentLoop) return;
        
        // Animate card off screen
        const card = cardRef.current;
        if (card) {
            card.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-out';
            
            switch (direction) {
                case 'right':
                    card.style.transform = 'translateX(150%) rotate(30deg)';
                    break;
                case 'left':
                    card.style.transform = 'translateX(-150%) rotate(-30deg)';
                    break;
                case 'up':
                    card.style.transform = 'translateY(-150%) rotate(180deg)';
                    break;
                case 'down':
                    card.style.transform = 'translateY(150%)';
                    break;
            }
            
            card.style.opacity = '0';
        }
        
        // Process swipe
        const gesture = {
            type: `swipe_${direction}`,
            loop_id: currentLoop.loop_id,
            timestamp: new Date().toISOString(),
            user_id: 'user' // Would come from auth
        };
        
        // Update stats
        switch (direction) {
            case 'right':
                setStats(prev => ({ ...prev, approved: prev.approved + 1 }));
                break;
            case 'left':
                setStats(prev => ({ ...prev, rejected: prev.rejected + 1 }));
                break;
            case 'down':
                setStats(prev => ({ ...prev, skipped: prev.skipped + 1 }));
                break;
        }
        
        // Callback
        if (onSwipe) {
            await onSwipe(gesture, currentLoop);
        }
        
        // Move to next loop
        setTimeout(() => {
            nextLoop();
        }, 500);
    };
    
    const nextLoop = () => {
        const newQueue = loopQueue.slice(1);
        setLoopQueue(newQueue);
        
        if (newQueue.length > 0) {
            setCurrentLoop(newQueue[0]);
            resetCard();
        } else {
            setCurrentLoop(null);
            // Try to fetch more
            fetchInitialLoops();
        }
    };
    
    const resetCard = () => {
        setTouchPosition({ x: 0, y: 0 });
        setSwipeDirection(null);
        
        const card = cardRef.current;
        if (card) {
            card.style.transition = 'transform 0.3s ease-out';
            card.style.transform = 'translateX(0) translateY(0) rotate(0deg)';
            card.style.opacity = '1';
        }
    };
    
    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e) => {
            switch (e.key) {
                case 'ArrowRight':
                    performSwipe('right');
                    break;
                case 'ArrowLeft':
                    performSwipe('left');
                    break;
                case 'ArrowUp':
                    performSwipe('up');
                    break;
                case 'ArrowDown':
                    performSwipe('down');
                    break;
            }
        };
        
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentLoop]);
    
    // Calculate card transform
    const getCardStyle = () => {
        if (!isDragging) return {};
        
        const { x, y } = touchPosition;
        const rotation = x * ROTATION_MULTIPLIER;
        
        return {
            transform: `translateX(${x}px) translateY(${y}px) rotate(${rotation}deg)`,
            transition: 'none'
        };
    };
    
    // Get swipe indicator color
    const getSwipeColor = () => {
        switch (swipeDirection) {
            case 'right': return '#4ade80'; // green
            case 'left': return '#f87171'; // red
            case 'up': return '#818cf8'; // purple
            case 'down': return '#fbbf24'; // yellow
            default: return 'transparent';
        }
    };
    
    // Render loop card
    const renderLoopCard = (loop) => {
        if (!loop) return null;
        
        const ageHours = (Date.now() - new Date(loop.created_at).getTime()) / (1000 * 60 * 60);
        
        return (
            <div 
                ref={cardRef}
                className="swipe-card"
                style={getCardStyle()}
                onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
                onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchEnd={handleEnd}
            >
                <div className="card-header">
                    <h3 className="loop-id">{loop.loop_id}</h3>
                    <span className={`blessing-badge ${loop.blessing_candidate ? 'candidate' : ''}`}>
                        {loop.blessing_candidate ? '✨ Blessing Candidate' : '🌀 Standard Loop'}
                    </span>
                </div>
                
                <div className="whisper-section">
                    <p className="whisper-label">Whisper Origin:</p>
                    <p className="whisper-text">"{loop.whisper_origin}"</p>
                </div>
                
                <div className="metrics-grid">
                    <div className="metric">
                        <span className="metric-label">Resonance</span>
                        <div className="metric-bar">
                            <div 
                                className="metric-fill resonance"
                                style={{ width: `${loop.resonance * 100}%` }}
                            />
                        </div>
                        <span className="metric-value">{(loop.resonance * 100).toFixed(0)}%</span>
                    </div>
                    
                    <div className="metric">
                        <span className="metric-label">Coherence</span>
                        <div className="metric-bar">
                            <div 
                                className="metric-fill coherence"
                                style={{ width: `${loop.coherence * 100}%` }}
                            />
                        </div>
                        <span className="metric-value">{(loop.coherence * 100).toFixed(0)}%</span>
                    </div>
                    
                    <div className="metric">
                        <span className="metric-label">Complexity</span>
                        <div className="metric-bar">
                            <div 
                                className="metric-fill complexity"
                                style={{ width: `${loop.complexity * 100}%` }}
                            />
                        </div>
                        <span className="metric-value">{(loop.complexity * 100).toFixed(0)}%</span>
                    </div>
                </div>
                
                <div className="card-footer">
                    <span className="detail">🎭 {loop.ritual_type || 'unknown'} ritual</span>
                    <span className="detail">👥 {loop.agent_count || 0} agents</span>
                    <span className="detail">⏱️ {ageHours.toFixed(1)}h old</span>
                </div>
                
                {swipeDirection && (
                    <div 
                        className={`swipe-indicator ${swipeDirection}`}
                        style={{ borderColor: getSwipeColor() }}
                    >
                        {swipeDirection === 'right' && '✅ APPROVE'}
                        {swipeDirection === 'left' && '❌ REJECT'}
                        {swipeDirection === 'up' && '⭐ BLESS'}
                        {swipeDirection === 'down' && '⏭️ SKIP'}
                    </div>
                )}
            </div>
        );
    };
    
    // Loading state
    if (isLoading) {
        return (
            <div className={`swipe-ui-container ${theme}`}>
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading loops...</p>
                </div>
            </div>
        );
    }
    
    // Main render
    return (
        <div className={`swipe-ui-container ${theme}`}>
            <div className="swipe-header">
                <h2 className="title">Loop Approval</h2>
                <div className="stats-bar">
                    <span className="stat approved">✅ {stats.approved}</span>
                    <span className="stat rejected">❌ {stats.rejected}</span>
                    <span className="stat skipped">⏭️ {stats.skipped}</span>
                </div>
            </div>
            
            <div className="swipe-area">
                {currentLoop ? (
                    renderLoopCard(currentLoop)
                ) : (
                    <div className="no-loops">
                        <p>No loops pending approval</p>
                        <button onClick={fetchInitialLoops} className="refresh-btn">
                            Refresh
                        </button>
                    </div>
                )}
                
                {loopQueue.length > 1 && (
                    <div className="queue-indicator">
                        {loopQueue.length - 1} more in queue
                    </div>
                )}
            </div>
            
            <div className="swipe-controls">
                <button 
                    className="control-btn reject"
                    onClick={() => performSwipe('left')}
                    disabled={!currentLoop}
                >
                    ❌
                </button>
                
                <button 
                    className="control-btn skip"
                    onClick={() => performSwipe('down')}
                    disabled={!currentLoop}
                >
                    ⏭️
                </button>
                
                <button 
                    className="control-btn approve"
                    onClick={() => performSwipe('right')}
                    disabled={!currentLoop}
                >
                    ✅
                </button>
                
                <button 
                    className="control-btn bless"
                    onClick={() => performSwipe('up')}
                    disabled={!currentLoop}
                >
                    ⭐
                </button>
            </div>
            
            <div className="instructions">
                <p>Swipe or use arrow keys • Right: Approve • Left: Reject • Up: Bless • Down: Skip</p>
            </div>
        </div>
    );
};

// CSS styles (would normally be in a separate file)
const styles = `
.swipe-ui-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    user-select: none;
}

.swipe-ui-container.dark {
    background: #0a0a0a;
    color: #ffffff;
}

.swipe-header {
    text-align: center;
    margin-bottom: 30px;
}

.title {
    font-size: 28px;
    margin: 0 0 15px 0;
}

.stats-bar {
    display: flex;
    justify-content: center;
    gap: 20px;
    font-size: 18px;
}

.stat {
    padding: 5px 15px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.1);
}

.swipe-area {
    position: relative;
    height: 500px;
    margin-bottom: 30px;
}

.swipe-card {
    position: absolute;
    width: 100%;
    max-width: 400px;
    left: 50%;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    border-radius: 20px;
    padding: 30px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    cursor: grab;
    touch-action: none;
}

.swipe-card:active {
    cursor: grabbing;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.loop-id {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
}

.blessing-badge {
    font-size: 12px;
    padding: 4px 12px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.1);
}

.blessing-badge.candidate {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #000;
}

.whisper-section {
    margin-bottom: 25px;
}

.whisper-label {
    font-size: 12px;
    color: #94a3b8;
    margin: 0 0 5px 0;
}

.whisper-text {
    font-size: 16px;
    font-style: italic;
    line-height: 1.5;
    margin: 0;
}

.metrics-grid {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 25px;
}

.metric {
    display: flex;
    align-items: center;
    gap: 10px;
}

.metric-label {
    font-size: 12px;
    color: #94a3b8;
    width: 80px;
}

.metric-bar {
    flex: 1;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
}

.metric-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
}

.metric-fill.resonance {
    background: linear-gradient(90deg, #818cf8, #a78bfa);
}

.metric-fill.coherence {
    background: linear-gradient(90deg, #60a5fa, #3b82f6);
}

.metric-fill.complexity {
    background: linear-gradient(90deg, #34d399, #10b981);
}

.metric-value {
    font-size: 12px;
    width: 40px;
    text-align: right;
}

.card-footer {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #94a3b8;
}

.swipe-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 20px 40px;
    border: 3px solid;
    border-radius: 10px;
    font-size: 24px;
    font-weight: bold;
    background: rgba(0, 0, 0, 0.8);
    pointer-events: none;
}

.swipe-controls {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-bottom: 20px;
}

.control-btn {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: none;
    font-size: 24px;
    cursor: pointer;
    transition: transform 0.2s ease;
}

.control-btn:hover:not(:disabled) {
    transform: scale(1.1);
}

.control-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.control-btn.reject {
    background: #ef4444;
}

.control-btn.skip {
    background: #f59e0b;
}

.control-btn.approve {
    background: #10b981;
}

.control-btn.bless {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
}

.queue-indicator {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 14px;
    color: #64748b;
}

.no-loops {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
}

.refresh-btn {
    margin-top: 20px;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    background: #3b82f6;
    color: white;
    cursor: pointer;
}

.instructions {
    text-align: center;
    font-size: 14px;
    color: #64748b;
}

.loading-spinner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

@media (max-width: 600px) {
    .swipe-ui-container {
        padding: 10px;
    }
    
    .swipe-card {
        padding: 20px;
    }
    
    .swipe-area {
        height: 400px;
    }
}
`;

// Export component with styles
export default SwipeUI;
export { styles };