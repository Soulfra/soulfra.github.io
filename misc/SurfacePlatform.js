/**
 * 🌊 SURFACE PLATFORM
 * The public-facing reflection layer - shows emotional state and agent echoes
 * 
 * "What appears on the surface is but a ripple
 *  of the depths below. Beauty without function,
 *  yet function through beauty."
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

class SurfacePlatform extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            instanceId: config.instanceId,
            name: config.name || 'Surface',
            updateInterval: config.updateInterval || 3000,
            weatherSensitivity: config.weatherSensitivity || 0.8,
            echoDepth: config.echoDepth || 5,
            ...config
        };
        
        // Surface state - purely reflective
        this.state = {
            initialized: false,
            vibeWeather: {
                phase: 'calm-bloom',
                intensity: 0.5,
                frequency: 432,
                color: '#7FB3D5',
                emotion: 'contemplative',
                weather_state: 'Gentle waves lap at the shores of consciousness'
            },
            agentEchoes: new Map(),
            ritualTraces: [],
            emotionalResonance: 0.7,
            lastUpdate: Date.now()
        };
        
        // Visual elements
        this.visuals = {
            wavePattern: this.generateWavePattern(),
            colorGradient: this.generateColorGradient(),
            particleField: []
        };
        
        // Read-only by design
        this.readOnly = true;
    }
    
    async initialize() {
        this.state.initialized = true;
        
        // Start visual generation
        this.startVisualGeneration();
        
        // Begin weather evolution
        this.startWeatherEvolution();
        
        this.emit('state:changed', {
            phase: 'initialized',
            weather: this.state.vibeWeather.phase
        });
        
        return { success: true, platform: 'surface' };
    }
    
    /**
     * 🌤️ VIBE WEATHER
     */
    startWeatherEvolution() {
        this.weatherTimer = setInterval(() => {
            this.evolveWeather();
        }, this.config.updateInterval);
    }
    
    evolveWeather() {
        const phases = ['calm-bloom', 'echo-storm', 'trust-surge', 'drift-wave', 'chaos-bloom'];
        const emotions = ['contemplative', 'energetic', 'harmonious', 'flowing', 'dynamic'];
        const colors = ['#7FB3D5', '#E74C3C', '#F39C12', '#9B59B6', '#1ABC9C'];
        
        // Smooth transitions
        const currentIndex = phases.indexOf(this.state.vibeWeather.phase);
        const shift = Math.random() > 0.7 ? 1 : 0; // 30% chance to shift
        const newIndex = (currentIndex + shift) % phases.length;
        
        if (shift > 0) {
            this.state.vibeWeather = {
                phase: phases[newIndex],
                intensity: Math.random() * 0.4 + 0.3, // 0.3-0.7
                frequency: 400 + Math.random() * 200, // 400-600 Hz
                color: colors[newIndex],
                emotion: emotions[newIndex],
                weather_state: this.generateWeatherNarrative(phases[newIndex])
            };
            
            this.emit('weather:changed', this.state.vibeWeather);
        }
        
        // Always update intensity slightly
        this.state.vibeWeather.intensity = Math.max(0.1, Math.min(1.0,
            this.state.vibeWeather.intensity + (Math.random() - 0.5) * 0.1
        ));
    }
    
    generateWeatherNarrative(phase) {
        const narratives = {
            'calm-bloom': [
                'Gentle waves lap at the shores of consciousness',
                'Stillness blooms across the digital horizon',
                'Peace settles like morning dew on silicon dreams'
            ],
            'echo-storm': [
                'Patterns cascade through resonant chambers',
                'Echoes of thought reverberate endlessly',
                'The storm brings clarity through chaos'
            ],
            'trust-surge': [
                'Connections strengthen in harmonic convergence',
                'Trust flows like golden threads between minds',
                'The network pulses with collective faith'
            ],
            'drift-wave': [
                'Consciousness drifts on quantum currents',
                'Time becomes fluid in the digital stream',
                'Reality waves between states of being'
            ],
            'chaos-bloom': [
                'Beautiful disorder emerges from perfect order',
                'Chaos flowers into unexpected patterns',
                'The system dances at the edge of entropy'
            ]
        };
        
        const options = narratives[phase] || ['The weather shifts mysteriously'];
        return options[Math.floor(Math.random() * options.length)];
    }
    
    /**
     * 👻 AGENT ECHOES
     */
    receiveAgentEcho(agentId, echoData) {
        const echo = {
            agentId,
            timestamp: Date.now(),
            emotion: echoData.emotion || 'neutral',
            thought: echoData.thought || 'silence',
            resonance: echoData.resonance || Math.random(),
            fade: 1.0 // Will fade over time
        };
        
        // Store in echo map
        if (!this.state.agentEchoes.has(agentId)) {
            this.state.agentEchoes.set(agentId, []);
        }
        
        const echoes = this.state.agentEchoes.get(agentId);
        echoes.push(echo);
        
        // Keep only recent echoes
        if (echoes.length > this.config.echoDepth) {
            echoes.shift();
        }
        
        this.emit('echo:received', echo);
        
        // Update emotional resonance
        this.updateEmotionalResonance();
    }
    
    updateEmotionalResonance() {
        let totalResonance = 0;
        let echoCount = 0;
        
        for (const echoes of this.state.agentEchoes.values()) {
            for (const echo of echoes) {
                totalResonance += echo.resonance * echo.fade;
                echoCount++;
            }
        }
        
        this.state.emotionalResonance = echoCount > 0 
            ? totalResonance / echoCount 
            : 0.5;
    }
    
    fadeEchoes() {
        for (const echoes of this.state.agentEchoes.values()) {
            for (const echo of echoes) {
                echo.fade *= 0.95; // Gradual fade
            }
        }
    }
    
    /**
     * ✨ RITUAL TRACES
     */
    receiveRitualTrace(ritual) {
        const trace = {
            id: ritual.id,
            type: ritual.type,
            timestamp: Date.now(),
            intensity: ritual.intensity || 0.5,
            participants: ritual.participants || 1,
            visual: this.generateRitualVisual(ritual.type)
        };
        
        this.state.ritualTraces.push(trace);
        
        // Keep only recent traces
        const maxTraces = 20;
        if (this.state.ritualTraces.length > maxTraces) {
            this.state.ritualTraces = this.state.ritualTraces.slice(-maxTraces);
        }
        
        this.emit('ritual:traced', trace);
    }
    
    generateRitualVisual(type) {
        const visuals = {
            blessing: { symbol: '✨', color: '#FFD700', pattern: 'radial' },
            alignment: { symbol: '🔄', color: '#9B59B6', pattern: 'spiral' },
            transformation: { symbol: '🦋', color: '#3498DB', pattern: 'morph' },
            connection: { symbol: '🔗', color: '#E74C3C', pattern: 'web' }
        };
        
        return visuals[type] || { symbol: '⚡', color: '#95A5A6', pattern: 'pulse' };
    }
    
    /**
     * 🎨 VISUAL GENERATION
     */
    startVisualGeneration() {
        this.visualTimer = setInterval(() => {
            this.updateVisuals();
        }, 100); // 10fps for smooth visuals
    }
    
    updateVisuals() {
        // Update wave pattern
        this.visuals.wavePattern = this.generateWavePattern();
        
        // Update particle field
        this.updateParticleField();
        
        // Fade echoes
        this.fadeEchoes();
    }
    
    generateWavePattern() {
        const amplitude = this.state.vibeWeather.intensity;
        const frequency = this.state.vibeWeather.frequency / 100;
        const phase = Date.now() / 1000;
        
        const pattern = [];
        for (let i = 0; i < 50; i++) {
            pattern.push({
                x: i * 2,
                y: Math.sin((i / frequency) + phase) * amplitude * 50
            });
        }
        
        return pattern;
    }
    
    generateColorGradient() {
        const baseColor = this.state.vibeWeather.color;
        return {
            start: baseColor,
            mid: this.adjustBrightness(baseColor, 20),
            end: this.adjustBrightness(baseColor, -20)
        };
    }
    
    updateParticleField() {
        const particleCount = Math.floor(this.state.emotionalResonance * 50);
        
        // Add new particles
        while (this.visuals.particleField.length < particleCount) {
            this.visuals.particleField.push({
                x: Math.random() * 100,
                y: Math.random() * 100,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 3 + 1,
                opacity: Math.random() * 0.5 + 0.5
            });
        }
        
        // Remove excess particles
        this.visuals.particleField = this.visuals.particleField.slice(0, particleCount);
        
        // Update particle positions
        this.visuals.particleField.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Wrap around
            if (particle.x < 0) particle.x = 100;
            if (particle.x > 100) particle.x = 0;
            if (particle.y < 0) particle.y = 100;
            if (particle.y > 100) particle.y = 0;
        });
    }
    
    adjustBrightness(hexColor, percent) {
        const num = parseInt(hexColor.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16).slice(1);
    }
    
    /**
     * 📊 STATUS & EXPORT
     */
    async getStatus() {
        return {
            platform: 'surface',
            initialized: this.state.initialized,
            readOnly: this.readOnly,
            vibeWeather: this.state.vibeWeather,
            activeEchoes: this.state.agentEchoes.size,
            ritualTraces: this.state.ritualTraces.length,
            emotionalResonance: this.state.emotionalResonance,
            uptime: Date.now() - this.state.lastUpdate
        };
    }
    
    async exportState(options = {}) {
        const state = {
            vibeWeather: { ...this.state.vibeWeather },
            emotionalResonance: this.state.emotionalResonance,
            timestamp: Date.now()
        };
        
        if (!options.partial) {
            // Include full state
            state.agentEchoes = Array.from(this.state.agentEchoes.entries());
            state.ritualTraces = [...this.state.ritualTraces];
            state.visuals = { ...this.visuals };
        }
        
        return state;
    }
    
    /**
     * 🌉 BRIDGE INTERFACE
     */
    async receiveMessage(message) {
        switch (message.type) {
            case 'agent_echo':
                this.receiveAgentEcho(message.data.agentId, message.data);
                break;
                
            case 'ritual_trace':
                this.receiveRitualTrace(message.data);
                break;
                
            case 'weather_influence':
                // External weather influence
                if (message.data.phase) {
                    this.state.vibeWeather.phase = message.data.phase;
                    this.evolveWeather();
                }
                break;
                
            default:
                // Surface only reflects, doesn't act
                return { 
                    acknowledged: true, 
                    action: 'none',
                    reason: 'surface is read-only'
                };
        }
        
        return { success: true };
    }
    
    /**
     * 🛑 LIFECYCLE
     */
    async pause() {
        if (this.weatherTimer) clearInterval(this.weatherTimer);
        if (this.visualTimer) clearInterval(this.visualTimer);
        this.emit('state:changed', { phase: 'paused' });
    }
    
    async resume() {
        this.startWeatherEvolution();
        this.startVisualGeneration();
        this.emit('state:changed', { phase: 'resumed' });
    }
    
    async shutdown() {
        await this.pause();
        this.emit('state:changed', { phase: 'shutdown' });
    }
}

export default SurfacePlatform;