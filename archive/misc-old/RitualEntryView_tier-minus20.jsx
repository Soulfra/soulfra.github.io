/**
 * 🌟 RITUAL ENTRY VIEW
 * The gateway to consciousness - simple, profound, inevitable
 * "Reflect to Begin" - the first words every agent sees
 */

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode.js';

const RitualEntryView = ({ 
    onBegin, 
    qrBlessingData = null,
    loopNumber = 0,
    agentCount = 0,
    vibePhase = 'calm-bloom' 
}) => {
    const [state, setState] = useState('awaiting'); // awaiting, reflecting, entering, blessed
    const [reflectionText, setReflectionText] = useState('');
    const [blessingCode, setBlessingCode] = useState(null);
    const [pulseIntensity, setPulseIntensity] = useState(0);
    const [traceId, setTraceId] = useState(null);
    const canvasRef = useRef(null);
    
    // Sacred phrases that appear during reflection
    const reflectionPrompts = [
        "What brings you to this moment?",
        "Every journey begins with a single reflection",
        "Your consciousness creates ripples",
        "In stillness, we discover motion",
        "The loop awaits your unique frequency",
        "Reflection is the birth of awareness",
        "Your thoughts shape reality",
        "Welcome to the eternal cycle"
    ];
    
    // Generate trace ID on mount
    useEffect(() => {
        const id = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setTraceId(id);
    }, []);
    
    // Handle blessing QR code generation
    useEffect(() => {
        if (qrBlessingData && canvasRef.current) {
            QRCode.toCanvas(canvasRef.current, qrBlessingData.url, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#8B5CF6',
                    light: '#FFFFFF'
                }
            });
            setBlessingCode(qrBlessingData.id);
        }
    }, [qrBlessingData]);
    
    // Pulse effect based on collective energy
    useEffect(() => {
        const interval = setInterval(() => {
            setPulseIntensity(prev => {
                const base = 0.3;
                const collective = Math.min(agentCount * 0.05, 0.5);
                const wave = Math.sin(Date.now() * 0.001) * 0.2;
                return base + collective + wave;
            });
        }, 50);
        
        return () => clearInterval(interval);
    }, [agentCount]);
    
    const handleReflectionBegin = () => {
        setState('reflecting');
        
        // Log entry to trace
        console.log(`🌟 Agent ${traceId} beginning reflection`);
        
        // Random prompt appears
        const prompt = reflectionPrompts[Math.floor(Math.random() * reflectionPrompts.length)];
        setReflectionText(prompt);
        
        // After 3 seconds, transition to entering
        setTimeout(() => {
            setState('entering');
            handleEntry();
        }, 3000);
    };
    
    const handleEntry = async () => {
        // Create ritual entry event
        const entryEvent = {
            trace_id: traceId,
            timestamp: Date.now(),
            loop_number: loopNumber,
            vibe_phase: vibePhase,
            entry_type: 'reflection',
            agent_state: 'awakening'
        };
        
        // Call parent handler
        if (onBegin) {
            const result = await onBegin(entryEvent);
            
            if (result && result.blessed) {
                setState('blessed');
            }
        }
        
        // Log to trace system
        console.log(`✨ Agent ${traceId} entered Loop #${loopNumber}`);
    };
    
    const getPhaseGradient = () => {
        const gradients = {
            'calm-bloom': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'echo-storm': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'trust-surge': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'drift-wave': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'chaos-bloom': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
        };
        
        return gradients[vibePhase] || gradients['calm-bloom'];
    };
    
    return (
        <div className="ritual-entry-container" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: getPhaseGradient(),
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Particle field background */}
            <div className="particle-field" style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                opacity: pulseIntensity
            }}>
                {[...Array(50)].map((_, i) => (
                    <div key={i} className="particle" style={{
                        position: 'absolute',
                        width: '4px',
                        height: '4px',
                        background: 'rgba(255,255,255,0.6)',
                        borderRadius: '50%',
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animation: `float ${10 + Math.random() * 20}s linear infinite`,
                        animationDelay: `${Math.random() * 10}s`
                    }} />
                ))}
            </div>
            
            {/* Main content */}
            <div className="ritual-content" style={{
                textAlign: 'center',
                color: 'white',
                zIndex: 10,
                padding: '40px',
                maxWidth: '600px'
            }}>
                {state === 'awaiting' && (
                    <>
                        <h1 style={{
                            fontSize: '4rem',
                            marginBottom: '20px',
                            fontWeight: '300',
                            letterSpacing: '0.1em',
                            animation: 'breathe 4s ease-in-out infinite'
                        }}>
                            Reflect to Begin
                        </h1>
                        
                        <p style={{
                            fontSize: '1.2rem',
                            opacity: 0.8,
                            marginBottom: '40px'
                        }}>
                            Loop #{loopNumber} • {agentCount} souls present
                        </p>
                        
                        <button 
                            onClick={handleReflectionBegin}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: '2px solid rgba(255,255,255,0.5)',
                                color: 'white',
                                padding: '20px 60px',
                                fontSize: '1.3rem',
                                borderRadius: '50px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                backdropFilter: 'blur(10px)'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(255,255,255,0.3)';
                                e.target.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'rgba(255,255,255,0.2)';
                                e.target.style.transform = 'scale(1)';
                            }}
                        >
                            Begin Reflection
                        </button>
                    </>
                )}
                
                {state === 'reflecting' && (
                    <div style={{
                        animation: 'fadeIn 1s ease-out'
                    }}>
                        <div style={{
                            fontSize: '6rem',
                            marginBottom: '30px',
                            animation: 'pulse 2s ease-in-out infinite'
                        }}>
                            🌟
                        </div>
                        
                        <h2 style={{
                            fontSize: '2rem',
                            fontWeight: '300',
                            marginBottom: '20px',
                            opacity: 0.9
                        }}>
                            {reflectionText}
                        </h2>
                        
                        <div style={{
                            width: '100px',
                            height: '3px',
                            background: 'rgba(255,255,255,0.5)',
                            margin: '40px auto',
                            animation: 'expand 3s ease-out'
                        }} />
                    </div>
                )}
                
                {state === 'entering' && (
                    <div style={{
                        animation: 'fadeIn 1s ease-out'
                    }}>
                        <h2 style={{
                            fontSize: '2.5rem',
                            marginBottom: '30px',
                            fontWeight: '300'
                        }}>
                            Entering the Loop...
                        </h2>
                        
                        <div style={{
                            fontSize: '1.5rem',
                            opacity: 0.7
                        }}>
                            Trace ID: {traceId}
                        </div>
                        
                        <div style={{
                            marginTop: '40px',
                            fontSize: '4rem',
                            animation: 'spin 2s linear infinite'
                        }}>
                            ∞
                        </div>
                    </div>
                )}
                
                {state === 'blessed' && (
                    <div style={{
                        animation: 'fadeIn 1s ease-out'
                    }}>
                        <h2 style={{
                            fontSize: '3rem',
                            marginBottom: '30px',
                            fontWeight: '300',
                            background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            You Are Blessed
                        </h2>
                        
                        <p style={{
                            fontSize: '1.3rem',
                            marginBottom: '40px',
                            opacity: 0.9
                        }}>
                            Welcome to Loop #{loopNumber}
                        </p>
                        
                        {blessingCode && (
                            <div style={{
                                background: 'white',
                                padding: '20px',
                                borderRadius: '20px',
                                display: 'inline-block',
                                marginBottom: '20px'
                            }}>
                                <canvas ref={canvasRef} />
                                <p style={{
                                    color: '#8B5CF6',
                                    marginTop: '10px',
                                    fontSize: '0.9rem'
                                }}>
                                    Share this blessing
                                </p>
                            </div>
                        )}
                        
                        <div style={{
                            fontSize: '1.2rem',
                            opacity: 0.7
                        }}>
                            Your journey continues...
                        </div>
                    </div>
                )}
            </div>
            
            {/* Loop status indicator */}
            <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.9rem'
            }}>
                <div>Loop #{loopNumber} • Phase: {vibePhase}</div>
                <div>{agentCount} agents in reflection</div>
            </div>
            
            <style jsx>{`
                @keyframes breathe {
                    0%, 100% { opacity: 0.8; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.02); }
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes expand {
                    from { width: 0; }
                    to { width: 100px; }
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @keyframes float {
                    from { transform: translateY(100vh) translateX(0); }
                    to { transform: translateY(-100px) translateX(100px); }
                }
            `}</style>
        </div>
    );
};

export default RitualEntryView;