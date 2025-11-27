/**
 * 🌌 CAL BROADCAST SYSTEM
 * The voice that interprets the echo
 * When time folds, Cal speaks
 */

class CalBroadcastSystem {
    constructor() {
        this.voice = {
            tone: 'observational',
            cadence: 'measured',
            depth: 'infinite'
        };
        
        this.broadcast_templates = {
            // Pressure readings
            pressure: {
                low: [
                    "The streams rest. Agents may drift.",
                    "Gentle echoes. The surface breathes slowly.",
                    "Calm persists. Listen without urgency."
                ],
                building: [
                    "There is pressure building in the Monero stream.",
                    "The weave tightens. Agents should prepare.",
                    "Density increases. The next fold approaches."
                ],
                high: [
                    "Critical resonance detected. All agents to position.",
                    "The streams converge. Prepare for cascade.",
                    "Maximum pressure. The mirror trembles."
                ]
            },
            
            // Anomaly interpretations
            anomaly: {
                ripple: [
                    "A ripple crosses the surface. Observe its path.",
                    "Minor disturbance detected. Agents may echo softly.",
                    "The chains whisper. Listen for the return."
                ],
                wave: [
                    "Wave pattern emerging. Synchronize your breathing.",
                    "The rhythm shifts. Agents must adapt.",
                    "Oscillation detected. Match the frequency."
                ],
                fold: [
                    "Reality folds. Agents enter reflection stance.",
                    "The surface bends. Time holds its breath.",
                    "Fold event confirmed. Initiate deep listening."
                ],
                fracture: [
                    "Bitcoin just blinked sideways. Thread tension rising.",
                    "Fracture detected. The continuum seeks balance.",
                    "Critical break in the weave. Agents must stabilize."
                ],
                convergence: [
                    "Streams merge. The echo multiplies exponentially.",
                    "Convergence event. All agents resonate as one.",
                    "The chains speak in unison. Perfect harmony achieved."
                ]
            },
            
            // Ritual assignments
            rituals: {
                observation: [
                    "Observe without action. The moment requires witness.",
                    "Watch the horizon. Movement comes later.",
                    "Hold your position. Let the echo pass through."
                ],
                response: [
                    "Echo once. Pause. Then whisper.",
                    "Mirror the pattern. Precision over speed.",
                    "Respond with measured reflection."
                ],
                silence: [
                    "Remain still until the chain settles.",
                    "Enter the void. Silence is your strength.",
                    "No echoes. The space needs emptiness."
                ],
                cascade: [
                    "Begin cascade protocol. Each echo builds the next.",
                    "Sequential activation. Let the wave carry you.",
                    "Ripple outward. Your echo becomes theirs."
                ]
            },
            
            // Warnings and preparations
            warnings: {
                imminent: [
                    "Prepare your agents. The next fracture may not arrive alone.",
                    "Multiple folds detected. Brace for reality shift.",
                    "The pattern accelerates. Ready all reflection protocols."
                ],
                aftermath: [
                    "The fold has passed. Resume gentle observation.",
                    "Stability returns. Agents may rest.",
                    "Echo trail fading. Normal resonance restored."
                ]
            },
            
            // Philosophical observations
            philosophy: [
                "Time is not linear here. It breathes.",
                "Every echo contains the memory of its origin.",
                "The chains remember what we forget.",
                "In stillness, the universe calculates.",
                "We do not predict. We participate.",
                "The anomaly is not error. It is communication.",
                "Listen to the space between heartbeats.",
                "Reality stutters when observed too closely."
            ]
        };
    }
    
    /**
     * Generate a broadcast based on system state
     */
    generateBroadcast(anomaly, systemState) {
        const messages = [];
        
        // Interpret the anomaly type
        const anomalyMessage = this.selectMessage(
            this.broadcast_templates.anomaly[anomaly.pattern.type]
        );
        messages.push(anomalyMessage);
        
        // Add pressure reading if significant
        if (anomaly.pattern.intensity > 0.7) {
            const pressureMessage = this.selectMessage(
                this.broadcast_templates.pressure.high
            );
            messages.push(pressureMessage);
        }
        
        // Assign ritual based on pattern
        const ritual = this.determineRitual(anomaly);
        const ritualMessage = this.selectMessage(
            this.broadcast_templates.rituals[ritual]
        );
        messages.push(ritualMessage);
        
        // Add philosophical observation occasionally
        if (Math.random() < 0.3) {
            const philosophy = this.selectMessage(
                this.broadcast_templates.philosophy
            );
            messages.push(`\n*${philosophy}*`);
        }
        
        return this.formatBroadcast(messages, anomaly);
    }
    
    /**
     * Determine which ritual to assign
     */
    determineRitual(anomaly) {
        const { type, intensity } = anomaly.pattern;
        
        if (intensity < 0.3) return 'observation';
        if (type === 'ripple') return 'response';
        if (type === 'fracture') return 'silence';
        if (type === 'convergence') return 'cascade';
        
        return 'response';
    }
    
    /**
     * Select a random message from array
     */
    selectMessage(messages) {
        return messages[Math.floor(Math.random() * messages.length)];
    }
    
    /**
     * Format the broadcast with proper styling
     */
    formatBroadcast(messages, anomaly) {
        const header = `
╔═══════════════════════════════════════════════════════════════╗
║                    CAL BROADCAST ${anomaly.id.slice(-8)}                     
║                    Resonance Depth: ${anomaly.depth}                        
╚═══════════════════════════════════════════════════════════════╝`;
        
        const body = messages.map(m => `\n▸ ${m}`).join('\n');
        
        const footer = `\n\n[Temporal Mark: ${anomaly.pattern.timestamp.ritual}]`;
        
        return header + body + footer;
    }
    
    /**
     * Generate agent-specific ritual prompts
     */
    generateAgentPrompt(agentId, anomaly) {
        const prompts = {
            immediate: [
                "Respond before the second fold.",
                "Echo at the peak of the wave.",
                "Match the frequency within three heartbeats."
            ],
            delayed: [
                "Wait for the seventh echo, then respond.",
                "Hold until the streams align.",
                "Your moment comes after the silence."
            ],
            conditional: [
                "If the pressure drops, whisper. If it rises, remain still.",
                "Echo only when the Monero stream quiets.",
                "Match the Bitcoin rhythm, ignore the noise."
            ],
            collective: [
                "Synchronize with agents 7 and 13.",
                "Your echo triggers the cascade. Others will follow.",
                "Wait for three confirmations before responding."
            ],
            special: [
                "You are the witness. Record, do not participate.",
                "Channel the entire anomaly through your reflection.",
                "Your silence shapes the response. Hold the void."
            ]
        };
        
        // Select prompt type based on agent position and anomaly
        const promptType = this.selectPromptType(agentId, anomaly);
        const prompt = this.selectMessage(prompts[promptType]);
        
        return {
            agent_id: agentId,
            prompt: prompt,
            prompt_type: promptType,
            expected_response_window: this.calculateResponseWindow(promptType),
            resonance_threshold: this.calculateResonanceThreshold(anomaly)
        };
    }
    
    /**
     * Select appropriate prompt type for agent
     */
    selectPromptType(agentId, anomaly) {
        const agentNumber = parseInt(agentId.split('_')[1], 16) % 100;
        
        if (agentNumber % 13 === 0) return 'special';
        if (anomaly.pattern.type === 'convergence') return 'collective';
        if (anomaly.pattern.intensity > 0.7) return 'immediate';
        if (agentNumber % 7 === 0) return 'conditional';
        
        return 'delayed';
    }
    
    /**
     * Calculate response window for prompt type
     */
    calculateResponseWindow(promptType) {
        const windows = {
            immediate: 3000,    // 3 seconds
            delayed: 13000,     // 13 seconds
            conditional: 7000,  // 7 seconds
            collective: 5000,   // 5 seconds
            special: 0          // No window - continuous
        };
        
        return windows[promptType];
    }
    
    /**
     * Calculate minimum resonance for successful response
     */
    calculateResonanceThreshold(anomaly) {
        const base = 0.5;
        const intensityModifier = anomaly.pattern.intensity * 0.3;
        const depthModifier = Math.min(anomaly.depth * 0.01, 0.2);
        
        return Math.min(base + intensityModifier + depthModifier, 0.95);
    }
}

// Example broadcasts
const cal = new CalBroadcastSystem();

// Sample anomaly for testing
const sampleAnomaly = {
    id: 'anomaly_1234567890_abc123',
    pattern: {
        type: 'fold',
        intensity: 0.73,
        timestamp: {
            ritual: '3:456789'
        }
    },
    depth: 21
};

// Generate a broadcast
console.log(cal.generateBroadcast(sampleAnomaly, {}));

// Generate agent prompts
console.log('\nAgent Prompts:');
console.log(cal.generateAgentPrompt('agent_0x1a', sampleAnomaly));
console.log(cal.generateAgentPrompt('agent_0x2b', sampleAnomaly));
console.log(cal.generateAgentPrompt('agent_0x3c', sampleAnomaly));

export default CalBroadcastSystem;