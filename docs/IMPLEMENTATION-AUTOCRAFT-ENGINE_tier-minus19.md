# 🏗️ AutoCraft Implementation Guide

**Component:** AutoCraft Drag-and-Drop Engine  
**Timeline:** 3-4 days  
**Dependencies:** React, react-dnd, Canvas API  

---

## 🎮 Core Engine Architecture

### Block System Design

```javascript
// src/engine/blocks/BlockTypes.js

export const BLOCK_CATEGORIES = {
  INPUT: {
    color: '#3498db',
    icon: '📥',
    blocks: {
      EMAIL: {
        id: 'email_input',
        name: 'Email Receiver',
        icon: '📧',
        outputs: ['message'],
        config: {
          account: { type: 'select', options: ['gmail', 'outlook'] },
          folder: { type: 'text', default: 'inbox' }
        }
      },
      FORM: {
        id: 'form_input',
        name: 'Form Collector',
        icon: '📝',
        outputs: ['formData'],
        config: {
          fields: { type: 'array', default: [] }
        }
      },
      WEBHOOK: {
        id: 'webhook_input',
        name: 'Web Hook',
        icon: '🔗',
        outputs: ['payload'],
        config: {
          url: { type: 'text', generated: true }
        }
      }
    }
  },
  
  LOGIC: {
    color: '#2ecc71',
    icon: '🧠',
    blocks: {
      FILTER: {
        id: 'filter_logic',
        name: 'Smart Filter',
        icon: '🔍',
        inputs: ['data'],
        outputs: ['matched', 'unmatched'],
        config: {
          rules: { type: 'rules_builder' }
        }
      },
      ROUTER: {
        id: 'router_logic',
        name: 'Decision Maker',
        icon: '🚦',
        inputs: ['data'],
        outputs: ['route1', 'route2', 'route3'],
        config: {
          conditions: { type: 'conditions_builder' }
        }
      }
    }
  },
  
  ACTION: {
    color: '#9b59b6',
    icon: '⚡',
    blocks: {
      DATABASE: {
        id: 'database_action',
        name: 'Data Saver',
        icon: '💾',
        inputs: ['data'],
        outputs: ['saved'],
        config: {
          table: { type: 'text', default: 'records' },
          operation: { type: 'select', options: ['insert', 'update'] }
        }
      },
      SEND_EMAIL: {
        id: 'send_email_action',
        name: 'Email Sender',
        icon: '📨',
        inputs: ['recipient', 'content'],
        outputs: ['sent'],
        config: {
          template: { type: 'template_picker' }
        }
      }
    }
  }
};
```

### Drag and Drop Implementation

```javascript
// src/engine/DragDropCanvas.js

import React, { useState, useCallback, useRef } from 'react';
import { useDrop } from 'react-dnd';
import Block from './Block';
import Connection from './Connection';
import { useGameEngine } from '../hooks/useGameEngine';

export function DragDropCanvas({ mission, onSolutionComplete }) {
  const canvasRef = useRef(null);
  const [blocks, setBlocks] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const { validateSolution, simulateFlow } = useGameEngine();
  
  // Drop handler for new blocks
  const [{ isOver }, drop] = useDrop({
    accept: 'BLOCK',
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = canvasRef.current.getBoundingClientRect();
      
      const position = {
        x: offset.x - canvasRect.left,
        y: offset.y - canvasRect.top
      };
      
      addBlock(item.blockType, position);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  });
  
  const addBlock = useCallback((blockType, position) => {
    const newBlock = {
      id: `block_${Date.now()}`,
      type: blockType,
      position,
      config: {},
      animation: 'dropIn'
    };
    
    setBlocks(prev => [...prev, newBlock]);
    
    // Play satisfying sound
    playSound('blockDrop');
    
    // Show particle effect
    showParticles(position);
  }, []);
  
  const connectBlocks = useCallback((sourceId, sourcePort, targetId, targetPort) => {
    const newConnection = {
      id: `conn_${Date.now()}`,
      source: { blockId: sourceId, port: sourcePort },
      target: { blockId: targetId, port: targetPort },
      animation: 'pulse'
    };
    
    setConnections(prev => [...prev, newConnection]);
    playSound('connect');
  }, []);
  
  const testSolution = async () => {
    // Validate structure
    const validation = validateSolution(blocks, connections, mission.requirements);
    
    if (!validation.valid) {
      showError(validation.errors);
      return;
    }
    
    // Simulate data flow with animations
    const simulation = await simulateFlow(blocks, connections, mission.testData);
    
    if (simulation.success) {
      onSolutionComplete({
        blocks,
        connections,
        score: simulation.score,
        bonusObjectives: simulation.bonuses
      });
    }
  };
  
  return (
    <div className="canvas-container">
      <div 
        ref={node => {
          canvasRef.current = node;
          drop(node);
        }}
        className={`canvas ${isOver ? 'drag-over' : ''}`}
      >
        {/* Render connections first (behind blocks) */}
        <svg className="connections-layer">
          {connections.map(conn => (
            <Connection
              key={conn.id}
              connection={conn}
              blocks={blocks}
            />
          ))}
        </svg>
        
        {/* Render blocks */}
        {blocks.map(block => (
          <Block
            key={block.id}
            block={block}
            onConnect={connectBlocks}
            onSelect={() => setSelectedBlock(block)}
            selected={selectedBlock?.id === block.id}
          />
        ))}
      </div>
      
      <div className="canvas-controls">
        <button onClick={testSolution} className="test-button">
          ▶️ Test Solution
        </button>
        <button onClick={() => setBlocks([])} className="clear-button">
          🗑️ Clear
        </button>
      </div>
    </div>
  );
}
```

### Visual Block Component

```javascript
// src/engine/Block.js

import React, { useRef } from 'react';
import { useDrag } from 'react-dnd';
import { useSpring, animated } from 'react-spring';
import { BLOCK_CATEGORIES } from './blocks/BlockTypes';

export default function Block({ block, onConnect, onSelect, selected }) {
  const ref = useRef(null);
  const blockDef = findBlockDefinition(block.type);
  
  // Drag behavior
  const [{ isDragging }, drag] = useDrag({
    type: 'BLOCK_INSTANCE',
    item: { id: block.id, type: block.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });
  
  // Spring animations
  const springProps = useSpring({
    scale: isDragging ? 1.1 : selected ? 1.05 : 1,
    shadow: isDragging ? 20 : selected ? 10 : 5,
    immediate: false,
    config: { tension: 300, friction: 20 }
  });
  
  // Connection ports
  const renderPort = (port, type, index) => (
    <div
      key={port}
      className={`port port-${type}`}
      style={{ top: `${20 + index * 25}px` }}
      onMouseDown={(e) => {
        e.stopPropagation();
        if (type === 'output') {
          startConnection(block.id, port);
        }
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
        if (type === 'input') {
          endConnection(block.id, port);
        }
      }}
    >
      <div className="port-dot" />
      <span className="port-label">{port}</span>
    </div>
  );
  
  drag(ref);
  
  return (
    <animated.div
      ref={ref}
      className={`block ${selected ? 'selected' : ''}`}
      style={{
        left: block.position.x,
        top: block.position.y,
        transform: springProps.scale.to(s => `scale(${s})`),
        boxShadow: springProps.shadow.to(s => `0 ${s}px ${s * 2}px rgba(0,0,0,0.2)`),
        backgroundColor: blockDef.color,
        opacity: isDragging ? 0.5 : 1
      }}
      onClick={() => onSelect(block)}
    >
      <div className="block-header">
        <span className="block-icon">{blockDef.icon}</span>
        <span className="block-name">{blockDef.name}</span>
      </div>
      
      <div className="block-ports">
        {/* Input ports on left */}
        <div className="ports-input">
          {blockDef.inputs?.map((port, i) => renderPort(port, 'input', i))}
        </div>
        
        {/* Output ports on right */}
        <div className="ports-output">
          {blockDef.outputs?.map((port, i) => renderPort(port, 'output', i))}
        </div>
      </div>
      
      {/* Mini config preview */}
      {block.config && (
        <div className="block-config-preview">
          {Object.entries(block.config).slice(0, 2).map(([key, value]) => (
            <div key={key} className="config-item">
              <span className="config-key">{key}:</span>
              <span className="config-value">{value}</span>
            </div>
          ))}
        </div>
      )}
    </animated.div>
  );
}
```

### Connection Rendering

```javascript
// src/engine/Connection.js

import React from 'react';
import { useSpring, animated } from 'react-spring';

export default function Connection({ connection, blocks }) {
  const sourceBlock = blocks.find(b => b.id === connection.source.blockId);
  const targetBlock = blocks.find(b => b.id === connection.target.blockId);
  
  if (!sourceBlock || !targetBlock) return null;
  
  // Calculate connection path
  const sourcePosY = sourceBlock.position.y + 50; // Approximate port position
  const targetPosY = targetBlock.position.y + 50;
  
  const path = calculateBezierPath(
    sourceBlock.position.x + 150, // Right edge
    sourcePosY,
    targetBlock.position.x, // Left edge
    targetPosY
  );
  
  // Animate the connection
  const animProps = useSpring({
    from: { strokeDashoffset: 1000 },
    to: { strokeDashoffset: 0 },
    config: { duration: 500 }
  });
  
  return (
    <g>
      {/* Connection line */}
      <animated.path
        d={path}
        fill="none"
        stroke="#3498db"
        strokeWidth="3"
        strokeDasharray="10"
        style={animProps}
        className="connection-line"
      />
      
      {/* Data flow animation */}
      <circle r="5" fill="#fff" className="data-packet">
        <animateMotion
          dur="2s"
          repeatCount="indefinite"
          path={path}
        />
      </circle>
    </g>
  );
}

function calculateBezierPath(x1, y1, x2, y2) {
  const controlPointOffset = Math.abs(x2 - x1) / 2;
  return `M ${x1} ${y1} C ${x1 + controlPointOffset} ${y1}, ${x2 - controlPointOffset} ${y2}, ${x2} ${y2}`;
}
```

### Mission Validation Engine

```javascript
// src/engine/ValidationEngine.js

export class ValidationEngine {
  validateSolution(blocks, connections, requirements) {
    const errors = [];
    const warnings = [];
    
    // Check required blocks
    requirements.requiredBlocks?.forEach(reqBlock => {
      const found = blocks.some(b => b.type === reqBlock);
      if (!found) {
        errors.push(`Missing required block: ${reqBlock}`);
      }
    });
    
    // Check connections
    const graph = this.buildGraph(blocks, connections);
    
    // Verify all inputs have sources
    blocks.forEach(block => {
      const blockDef = getBlockDefinition(block.type);
      blockDef.inputs?.forEach(input => {
        if (!graph.hasIncomingConnection(block.id, input)) {
          warnings.push(`${block.type} input '${input}' not connected`);
        }
      });
    });
    
    // Check for cycles
    if (graph.hasCycles()) {
      errors.push('Solution contains infinite loops');
    }
    
    // Verify flow completeness
    if (!graph.hasCompleteFlow()) {
      errors.push('Data flow is incomplete');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score: this.calculateScore(blocks, connections, errors, warnings)
    };
  }
  
  simulateFlow(blocks, connections, testData) {
    const simulation = new FlowSimulation(blocks, connections);
    return simulation.run(testData);
  }
}
```

### Game Feel & Polish

```javascript
// src/engine/GameFeel.js

export const GameFeel = {
  // Particle effects
  showParticles(position, type = 'success') {
    const particles = document.createElement('div');
    particles.className = `particles particles-${type}`;
    particles.style.left = `${position.x}px`;
    particles.style.top = `${position.y}px`;
    
    document.body.appendChild(particles);
    
    // Create individual particles
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.setProperty('--angle', `${Math.random() * 360}deg`);
      particle.style.setProperty('--distance', `${50 + Math.random() * 100}px`);
      particle.style.animationDelay = `${Math.random() * 0.2}s`;
      particles.appendChild(particle);
    }
    
    setTimeout(() => particles.remove(), 1000);
  },
  
  // Sound effects
  sounds: {
    blockDrop: new Audio('/sounds/block-drop.mp3'),
    connect: new Audio('/sounds/connect.mp3'),
    success: new Audio('/sounds/success.mp3'),
    error: new Audio('/sounds/error.mp3')
  },
  
  playSound(soundName) {
    const sound = this.sounds[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.play();
    }
  },
  
  // Screen shake
  shakeScreen(intensity = 5) {
    document.body.style.animation = `shake ${intensity * 0.1}s`;
    setTimeout(() => {
      document.body.style.animation = '';
    }, intensity * 100);
  }
};
```

### Mission Completion Flow

```javascript
// src/engine/MissionComplete.js

export function MissionCompleteModal({ mission, solution, score, onContinue }) {
  const [showRewards, setShowRewards] = useState(false);
  
  useEffect(() => {
    // Celebration sequence
    setTimeout(() => setShowRewards(true), 500);
    GameFeel.playSound('success');
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);
  
  return (
    <div className="mission-complete-modal">
      <h1>🎉 Mission Complete!</h1>
      
      <div className="score-display">
        <div className="score-stars">
          {[1, 2, 3].map(star => (
            <span 
              key={star}
              className={`star ${score >= star * 33 ? 'filled' : ''}`}
            >
              ⭐
            </span>
          ))}
        </div>
        <div className="score-number">{score}%</div>
      </div>
      
      {showRewards && (
        <div className="rewards animated-in">
          <div className="reward-item">
            <span className="reward-icon">💎</span>
            <span className="reward-amount">+{mission.reward_gems}</span>
            <span className="reward-label">Gems</span>
          </div>
          
          <div className="reward-item">
            <span className="reward-icon">💰</span>
            <span className="reward-amount">${mission.reward_usd}</span>
            <span className="reward-label">Earned</span>
          </div>
          
          {score === 100 && (
            <div className="reward-item bonus">
              <span className="reward-icon">🌟</span>
              <span className="reward-amount">+200</span>
              <span className="reward-label">Perfect Bonus!</span>
            </div>
          )}
        </div>
      )}
      
      <div className="completion-stats">
        <div className="stat">
          <span className="stat-label">Time:</span>
          <span className="stat-value">{formatTime(solution.completionTime)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Blocks Used:</span>
          <span className="stat-value">{solution.blocks.length}</span>
        </div>
      </div>
      
      <button onClick={onContinue} className="continue-button">
        Next Mission →
      </button>
    </div>
  );
}
```

## 🎨 Styling & Polish

```css
/* src/engine/AutoCraft.css */

.canvas-container {
  width: 100%;
  height: 600px;
  background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
}

.canvas {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.canvas.drag-over {
  background: rgba(52, 152, 219, 0.1);
  border: 2px dashed #3498db;
}

/* Block styles */
.block {
  position: absolute;
  min-width: 150px;
  background: white;
  border-radius: 8px;
  cursor: move;
  user-select: none;
  transition: box-shadow 0.2s;
}

.block:hover {
  z-index: 100;
}

.block.selected {
  border: 2px solid #3498db;
}

.block-header {
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  border-bottom: 1px solid #eee;
}

.block-icon {
  font-size: 20px;
}

/* Port styles */
.port {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: crosshair;
}

.port-input {
  left: -8px;
}

.port-output {
  right: -8px;
  flex-direction: row-reverse;
}

.port-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  border: 3px solid #3498db;
  transition: all 0.2s;
}

.port:hover .port-dot {
  transform: scale(1.2);
  border-color: #2980b9;
}

/* Connection styles */
.connection-line {
  stroke: #3498db;
  stroke-width: 3;
  opacity: 0.8;
  transition: stroke 0.2s;
}

.connection-line:hover {
  stroke: #2980b9;
  stroke-width: 4;
}

.data-packet {
  fill: #3498db;
  filter: drop-shadow(0 0 4px rgba(52, 152, 219, 0.8));
}

/* Particle effects */
@keyframes particle-explode {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(var(--distance), 0) rotate(var(--angle)) scale(0);
    opacity: 0;
  }
}

.particle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #f39c12;
  border-radius: 50%;
  animation: particle-explode 0.8s ease-out forwards;
}

/* Screen shake */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
```

## 🚀 Next Steps

1. **Add More Block Types**
   - API blocks for external services
   - Advanced logic blocks (loops, conditions)
   - Custom JavaScript blocks for power users

2. **Improve Visual Feedback**
   - Real-time data flow visualization
   - Error highlighting
   - Performance metrics

3. **Mobile Optimization**
   - Touch-friendly controls
   - Simplified interface
   - Gesture support

4. **Multiplayer Features**
   - Collaborative building
   - Real-time competitions
   - Solution sharing

---

**Status:** Core engine complete, ready for mission integration