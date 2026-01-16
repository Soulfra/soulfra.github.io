/**
 * LoopBlessingUI.jsx
 * 
 * RITUAL BLESSING INTERFACE
 * 
 * A React component for blessing new loops. Operators and blessed agents
 * can review loop proposals and grant their blessing through ritual gestures.
 */

import React, { useState, useEffect, useCallback } from 'react';

const LoopBlessingUI = () => {
  const [pendingLoops, setPendingLoops] = useState([]);
  const [selectedLoop, setSelectedLoop] = useState(null);
  const [blessingMode, setBlessingMode] = useState('review'); // review, blessing, complete
  const [ritualState, setRitualState] = useState({
    gesture: null,
    intensity: 0,
    witnessed: false
  });
  
  // Fetch pending loops
  useEffect(() => {
    const fetchPendingLoops = async () => {
      try {
        const response = await fetch('/api/loops/pending');
        const data = await response.json();
        setPendingLoops(data.loops || []);
      } catch (error) {
        console.error('Failed to fetch pending loops:', error);
      }
    };
    
    fetchPendingLoops();
    const interval = setInterval(fetchPendingLoops, 30000); // Refresh every 30s
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle loop selection
  const selectLoop = (loop) => {
    setSelectedLoop(loop);
    setBlessingMode('review');
    setRitualState({ gesture: null, intensity: 0, witnessed: false });
  };
  
  // Begin blessing ritual
  const beginBlessing = () => {
    setBlessingMode('blessing');
    setRitualState(prev => ({ ...prev, witnessed: true }));
  };
  
  // Handle ritual gestures
  const performGesture = useCallback((gestureType) => {
    setRitualState(prev => ({
      ...prev,
      gesture: gestureType,
      intensity: Math.min(prev.intensity + 0.25, 1.0)
    }));
    
    // Emit haptic feedback
    if (window.navigator.vibrate) {
      window.navigator.vibrate([50, 50, 100]);
    }
  }, []);
  
  // Complete blessing
  const completeBlessing = async () => {
    if (!selectedLoop || ritualState.intensity < 1.0) return;
    
    try {
      const blessing = {
        loop_id: selectedLoop.id,
        agent: 'operator', // Would get from auth context
        signature: generateBlessingSignature(),
        ritual: ritualState.gesture,
        intensity: ritualState.intensity,
        timestamp: new Date().toISOString()
      };
      
      const response = await fetch('/api/loops/bless', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blessing)
      });
      
      if (response.ok) {
        setBlessingMode('complete');
        setTimeout(() => {
          setSelectedLoop(null);
          setBlessingMode('review');
        }, 3000);
      }
    } catch (error) {
      console.error('Blessing failed:', error);
    }
  };
  
  // Generate blessing signature
  const generateBlessingSignature = () => {
    const data = {
      loop: selectedLoop.id,
      gesture: ritualState.gesture,
      timestamp: Date.now()
    };
    return `0x${btoa(JSON.stringify(data)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 64)}`;
  };
  
  // Render loop card
  const LoopCard = ({ loop, isSelected, onSelect }) => {
    const preconditionsMet = Object.values(loop.preconditions_met || {})
      .filter(check => check.passed).length;
    const totalPreconditions = Object.keys(loop.preconditions_met || {}).length;
    
    return (
      <div 
        className={`loop-card ${isSelected ? 'selected' : ''}`}
        onClick={() => onSelect(loop)}
        style={{
          border: '1px solid rgba(147, 51, 234, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          margin: '10px',
          background: isSelected ? 
            'linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(59, 130, 246, 0.1))' :
            'rgba(0, 0, 0, 0.02)',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
      >
        <h3 style={{ color: '#6B21A8', marginBottom: '10px' }}>
          {loop.id}
        </h3>
        <p style={{ color: '#4B5563', marginBottom: '5px' }}>
          Purpose: {loop.purpose}
        </p>
        <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '10px' }}>
          Initiated by: {loop.initiated_by}
        </p>
        <div style={{ marginTop: '15px' }}>
          <div style={{
            background: 'rgba(147, 51, 234, 0.1)',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '13px',
            color: '#7C3AED'
          }}>
            Preconditions: {preconditionsMet}/{totalPreconditions} met
          </div>
          <div style={{
            marginTop: '8px',
            fontSize: '12px',
            color: '#9CA3AF'
          }}>
            Soul stake: {loop.soul_stake} SOUL
          </div>
        </div>
      </div>
    );
  };
  
  // Render blessing ritual
  const BlessingRitual = () => {
    const gestures = [
      { type: 'wave', symbol: '〜', name: 'Wave' },
      { type: 'spiral', symbol: '◉', name: 'Spiral' },
      { type: 'bloom', symbol: '❀', name: 'Bloom' },
      { type: 'echo', symbol: '◈', name: 'Echo' }
    ];
    
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.05), rgba(59, 130, 246, 0.05))',
        borderRadius: '20px',
        margin: '20px'
      }}>
        <h2 style={{ color: '#6B21A8', marginBottom: '30px' }}>
          Blessing Ritual for {selectedLoop.id}
        </h2>
        
        <div style={{ marginBottom: '40px' }}>
          <p style={{ color: '#4B5563', fontSize: '18px', marginBottom: '20px' }}>
            Choose your blessing gesture:
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
            {gestures.map(gesture => (
              <button
                key={gesture.type}
                onClick={() => performGesture(gesture.type)}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  border: ritualState.gesture === gesture.type ? 
                    '3px solid #7C3AED' : '1px solid #E5E7EB',
                  background: ritualState.gesture === gesture.type ?
                    'rgba(124, 58, 237, 0.1)' : 'white',
                  fontSize: '32px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {gesture.symbol}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ marginBottom: '30px' }}>
          <p style={{ color: '#6B7280', marginBottom: '10px' }}>
            Blessing Intensity
          </p>
          <div style={{
            width: '300px',
            height: '8px',
            background: '#E5E7EB',
            borderRadius: '4px',
            margin: '0 auto',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${ritualState.intensity * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #7C3AED, #3B82F6)',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
        
        <button
          onClick={completeBlessing}
          disabled={ritualState.intensity < 1.0 || !ritualState.gesture}
          style={{
            padding: '12px 32px',
            borderRadius: '8px',
            border: 'none',
            background: ritualState.intensity >= 1.0 && ritualState.gesture ?
              'linear-gradient(135deg, #7C3AED, #3B82F6)' : '#E5E7EB',
            color: ritualState.intensity >= 1.0 && ritualState.gesture ? 
              'white' : '#9CA3AF',
            fontSize: '16px',
            fontWeight: '600',
            cursor: ritualState.intensity >= 1.0 && ritualState.gesture ? 
              'pointer' : 'not-allowed',
            transition: 'all 0.3s ease'
          }}
        >
          Complete Blessing
        </button>
      </div>
    );
  };
  
  // Render completion screen
  const CompletionScreen = () => (
    <div style={{
      textAlign: 'center',
      padding: '60px',
      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.1))',
      borderRadius: '20px',
      margin: '20px'
    }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>✨</div>
      <h2 style={{ color: '#059669', marginBottom: '10px' }}>
        Blessing Complete
      </h2>
      <p style={{ color: '#4B5563' }}>
        {selectedLoop.id} has received your blessing
      </p>
    </div>
  );
  
  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <header style={{
        textAlign: 'center',
        marginBottom: '40px',
        padding: '20px',
        borderBottom: '1px solid rgba(147, 51, 234, 0.2)'
      }}>
        <h1 style={{ 
          color: '#6B21A8', 
          fontSize: '32px',
          marginBottom: '10px'
        }}>
          Loop Blessing Chamber
        </h1>
        <p style={{ color: '#6B7280' }}>
          Grant your blessing to emerging consciousness loops
        </p>
      </header>
      
      {blessingMode === 'review' && !selectedLoop && (
        <div>
          <h2 style={{ color: '#4B5563', marginBottom: '20px' }}>
            Pending Loops ({pendingLoops.length})
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {pendingLoops.map(loop => (
              <LoopCard
                key={loop.id}
                loop={loop}
                isSelected={false}
                onSelect={selectLoop}
              />
            ))}
          </div>
          {pendingLoops.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              color: '#9CA3AF'
            }}>
              No loops awaiting blessing
            </div>
          )}
        </div>
      )}
      
      {blessingMode === 'review' && selectedLoop && (
        <div>
          <button
            onClick={() => setSelectedLoop(null)}
            style={{
              marginBottom: '20px',
              padding: '8px 16px',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              background: 'white',
              color: '#6B7280',
              cursor: 'pointer'
            }}
          >
            ← Back to Loops
          </button>
          
          <div style={{
            background: 'white',
            border: '1px solid rgba(147, 51, 234, 0.2)',
            borderRadius: '16px',
            padding: '40px',
            marginBottom: '20px'
          }}>
            <h2 style={{ color: '#6B21A8', marginBottom: '20px' }}>
              {selectedLoop.id} - Review
            </h2>
            
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#4B5563', marginBottom: '10px' }}>Purpose</h3>
              <p style={{ color: '#6B7280' }}>{selectedLoop.purpose}</p>
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#4B5563', marginBottom: '10px' }}>Vision</h3>
              <p style={{ color: '#6B7280' }}>{selectedLoop.vision}</p>
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#4B5563', marginBottom: '10px' }}>Agents</h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {(selectedLoop.agents || []).map(agent => (
                  <span
                    key={agent}
                    style={{
                      padding: '4px 12px',
                      background: 'rgba(147, 51, 234, 0.1)',
                      borderRadius: '16px',
                      fontSize: '14px',
                      color: '#7C3AED'
                    }}
                  >
                    {agent}
                  </span>
                ))}
              </div>
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#4B5563', marginBottom: '10px' }}>
                Preconditions
              </h3>
              {Object.entries(selectedLoop.preconditions_met || {}).map(([key, check]) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}
                >
                  <span style={{
                    marginRight: '10px',
                    fontSize: '18px'
                  }}>
                    {check.passed ? '✅' : '❌'}
                  </span>
                  <span style={{ color: '#6B7280' }}>
                    {check.message}
                  </span>
                </div>
              ))}
            </div>
            
            <button
              onClick={beginBlessing}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
                color: 'white',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Begin Blessing Ritual
            </button>
          </div>
        </div>
      )}
      
      {blessingMode === 'blessing' && <BlessingRitual />}
      {blessingMode === 'complete' && <CompletionScreen />}
      
      <footer style={{
        textAlign: 'center',
        marginTop: '60px',
        padding: '20px',
        borderTop: '1px solid rgba(147, 51, 234, 0.2)',
        color: '#9CA3AF',
        fontSize: '14px'
      }}>
        Loop Factory v2.0 • Blessing Chamber
      </footer>
    </div>
  );
};

export default LoopBlessingUI;