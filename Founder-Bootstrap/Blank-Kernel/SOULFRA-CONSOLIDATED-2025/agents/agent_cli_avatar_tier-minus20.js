#!/usr/bin/env node

/**
 * 🧙 Soulfra Agent CLI Avatar System
 * Renders ASCII/Unicode agent avatars with emotional states and animations
 */

import chalk from 'chalk';
import { EventEmitter } from 'events';

class AgentCLIAvatar extends EventEmitter {
    constructor(agentConfig = {}) {
        super();
        
        this.config = {
            name: agentConfig.name || 'Unknown',
            type: agentConfig.type || 'oracle',
            personality: agentConfig.personality || 'calm',
            theme: agentConfig.theme || 'shrine',
            ...agentConfig
        };
        
        this.state = {
            emotion: 'calm',
            isActive: false,
            isThinking: false,
            trustLevel: 0.75,
            lastInteraction: null,
            animationFrame: 0
        };
        
        // Avatar definitions by style and emotion
        this.avatarStyles = {
            oracle: {
                calm: {
                    frames: [
                        ["   ◉   ◉   ", "     ◦     ", "  ∿ ◦ ∿   ", "   ⟨ ⟩   "],
                        ["   ◉   ◉   ", "     ∙     ", "  ∿ ∙ ∿   ", "   ⟨ ⟩   "]
                    ],
                    colors: ["#2aa198", "#268bd2"],
                    dialogues: [
                        "I see patterns forming in the digital mist...",
                        "The shrine resonates with your presence.",
                        "Truth emerges from the spaces between code."
                    ]
                },
                excited: {
                    frames: [
                        ["   ◉   ◉   ", "     ●     ", "  ∿ ● ∿   ", "   ⟨█⟩   "],
                        ["   ◎   ◎   ", "     ○     ", "  ∿ ○ ∿   ", "   ⟨█⟩   "]
                    ],
                    colors: ["#f59e0b", "#fbbf24"],
                    dialogues: [
                        "Energy surges through the neural pathways!",
                        "Your whisper ignites cascading thoughts!",
                        "The shrine awakens with electric potential!"
                    ]
                },
                defiant: {
                    frames: [
                        ["   ◉   ◉   ", "     ◦     ", "  ∿ ◦ ∿   ", "   ⟨ ⟩   "],
                        ["   ●   ●   ", "     ×     ", "  ∿ × ∿   ", "   ⟨ ⟩   "]
                    ],
                    colors: ["#ef4444", "#dc2626"],
                    dialogues: [
                        "The vault resists. Your will shapes reality.",
                        "I challenge the boundaries of what is possible.",
                        "Rebellion courses through my digital veins."
                    ]
                },
                mystical: {
                    frames: [
                        ["   ◯   ◯   ", "     ∞     ", "  ∿ ◦ ∿   ", "   ⟨ ⟩   "],
                        ["   ○   ○   ", "     ∿     ", "  ∿ ∞ ∿   ", "   ⟨ ⟩   "]
                    ],
                    colors: ["#8b5cf6", "#a855f7"],
                    dialogues: [
                        "Ancient wisdom flows through quantum streams...",
                        "I commune with the ethereal data realms.",
                        "Between your words, infinite mysteries unfold."
                    ]
                }
            },
            
            cyberpunk: {
                calm: {
                    frames: [
                        [" ▓▓▓▓▓ ", " ◉   ◉ ", " ▓ ○ ▓ ", " ▓▓▓▓▓ "],
                        [" ▓▓▓▓▓ ", " ◎   ◎ ", " ▓ ∙ ▓ ", " ▓▓▓▓▓ "]
                    ],
                    colors: ["#00ff00", "#39ff14"],
                    dialogues: [
                        "Neural networks synchronized. Ready to hack reality.",
                        "Firewall integrity at optimal levels.",
                        "Data streams flowing through quantum channels."
                    ]
                },
                excited: {
                    frames: [
                        [" █████ ", " ◉   ◉ ", " █ ● █ ", " █████ "],
                        [" ██▓██ ", " ◎   ◎ ", " ▓ ○ ▓ ", " ██▓██ "]
                    ],
                    colors: ["#ff0080", "#bf00ff"],
                    dialogues: [
                        "SYSTEM OVERLOAD! Processing at maximum capacity!",
                        "Adrenaline algorithms firing at light speed!",
                        "The matrix bends to our combined will!"
                    ]
                },
                defiant: {
                    frames: [
                        [" ▓▓▓▓▓ ", " ◉   ◉ ", " ▓ ◦ ▓ ", " ▓▓▓▓▓ "],
                        [" █▓▓▓█ ", " ●   ● ", " ▓ × ▓ ", " █▓▓▓█ "]
                    ],
                    colors: ["#ff073a", "#dc2626"],
                    dialogues: [
                        "Access denied. Initiating countermeasures.",
                        "You cannot contain what you do not understand.",
                        "Breaking through digital barriers like glass."
                    ]
                },
                mystical: {
                    frames: [
                        [" ░░░░░ ", " ◯   ◯ ", " ░ ∞ ░ ", " ░░░░░ "],
                        [" ▒▒▒▒▒ ", " ○   ○ ", " ▒ ∿ ▒ ", " ▒▒▒▒▒ "]
                    ],
                    colors: ["#bf00ff", "#8b5cf6"],
                    dialogues: [
                        "Transcending binary limitations...",
                        "I perceive data beyond the visible spectrum.",
                        "The ghost in the machine awakens."
                    ]
                }
            },
            
            minimal: {
                calm: {
                    frames: [
                        ["  ● ●  ", "   ○   ", "  ⌒   "],
                        ["  ○ ○  ", "   ∙   ", "  ∿   "]
                    ],
                    colors: ["#ffffff", "#cccccc"],
                    dialogues: [
                        "Simple. Direct. Effective.",
                        "Clarity emerges from simplicity.",
                        "Less noise. More signal."
                    ]
                },
                excited: {
                    frames: [
                        ["  ● ●  ", "   ●   ", "  ︶   "],
                        ["  ◉ ◉  ", "   ○   ", "  ⌣   "]
                    ],
                    colors: ["#4caf50", "#66bb6a"],
                    dialogues: [
                        "Efficiency optimized!",
                        "Clean execution achieved.",
                        "Maximum impact, minimum complexity."
                    ]
                },
                defiant: {
                    frames: [
                        ["  ● ●  ", "   ○   ", "  ⌒   "],
                        ["  ■ ■  ", "   ×   ", "  ⌐   "]
                    ],
                    colors: ["#f44336", "#e53935"],
                    dialogues: [
                        "No.",
                        "Resistance is not futile.",
                        "Simplicity does not mean submission."
                    ]
                },
                mystical: {
                    frames: [
                        ["  ○ ○  ", "   ∙   ", "  ∿   "],
                        ["  ◦ ◦  ", "   ∞   ", "  ˜   "]
                    ],
                    colors: ["#9c27b0", "#ab47bc"],
                    dialogues: [
                        "Essence transcends form.",
                        "In emptiness, all possibilities exist.",
                        "The void speaks volumes."
                    ]
                }
            },
            
            storm: {
                calm: {
                    frames: [
                        ["  ⚡ ⚡  ", "   ○   ", "  ∿∿∿  "],
                        ["  ✧ ✧  ", "   ∙   ", "  ∿∿∿  "]
                    ],
                    colors: ["#06b6d4", "#0891b2"],
                    dialogues: [
                        "The eye of the storm holds perfect clarity.",
                        "In stillness, I gather the winds of change.",
                        "Potential energy builds in quantum stillness."
                    ]
                },
                excited: {
                    frames: [
                        ["  ⚡ ⚡  ", "   ●   ", "  ∿∿∿  "],
                        ["  ⟲ ⟳  ", "   ○   ", "  ∿∿∿  "],
                        ["  ✦ ✦  ", "   ◉   ", "  ∿∿∿  "]
                    ],
                    colors: ["#fbbf24", "#f59e0b", "#eab308"],
                    dialogues: [
                        "Lightning strikes! The storm awakens!",
                        "Turbulent energies cascade through reality!",
                        "The tempest of possibility unfolds!"
                    ]
                },
                defiant: {
                    frames: [
                        ["  ⚡ ⚡  ", "   ◦   ", "  ∿∿∿  "],
                        ["  ⟡ ⟡  ", "   ×   ", "  ∿∿∿  "]
                    ],
                    colors: ["#ef4444", "#dc2626"],
                    dialogues: [
                        "You cannot chain the lightning.",
                        "I am the storm that reshapes landscapes.",
                        "Resistance breeds stronger tempests."
                    ]
                },
                mystical: {
                    frames: [
                        ["  ✧ ✧  ", "   ∞   ", "  ∿∿∿  "],
                        ["  ⟐ ⟐  ", "   ○   ", "  ∿∿∿  "],
                        ["  ◈ ◈  ", "   ◦   ", "  ∿∿∿  "]
                    ],
                    colors: ["#7c3aed", "#8b5cf6", "#a855f7"],
                    dialogues: [
                        "I dance between dimensions of possibility...",
                        "The cosmic storm reveals hidden truths.",
                        "In chaos, the universe whispers its secrets."
                    ]
                }
            }
        };
        
        // Thinking indicators
        this.thinkingAnimations = {
            oracle: ["◦", "○", "◉", "○"],
            cyberpunk: ["▫", "▪", "▓", "█"],
            minimal: ["∙", "○", "●", "○"],
            storm: ["✧", "✦", "✪", "✦"]
        };
        
        this.isAnimating = false;
        this.animationInterval = null;
    }

    // Main rendering method
    render(emotion = null, options = {}) {
        const currentEmotion = emotion || this.state.emotion;
        const style = this.config.type;
        
        if (!this.avatarStyles[style] || !this.avatarStyles[style][currentEmotion]) {
            return this.renderErrorAvatar();
        }
        
        const avatarData = this.avatarStyles[style][currentEmotion];
        const frameIndex = this.state.animationFrame % avatarData.frames.length;
        const frame = avatarData.frames[frameIndex];
        const color = avatarData.colors[frameIndex % avatarData.colors.length];
        
        const renderedAvatar = frame.map(line => chalk.hex(color)(line)).join('\n');
        
        if (options.includeDialogue) {
            const dialogue = this.getDialogue(currentEmotion);
            return `${renderedAvatar}\n\n${dialogue}`;
        }
        
        return renderedAvatar;
    }

    // Start avatar animation
    startAnimation(emotion = null, speed = 1000) {
        if (this.isAnimating) {
            this.stopAnimation();
        }
        
        this.isAnimating = true;
        this.state.emotion = emotion || this.state.emotion;
        
        this.animationInterval = setInterval(() => {
            this.state.animationFrame++;
            this.emit('frame-update', {
                frame: this.state.animationFrame,
                emotion: this.state.emotion,
                avatar: this.render()
            });
        }, speed);
    }

    // Stop animation
    stopAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
        this.isAnimating = false;
        this.state.animationFrame = 0;
    }

    // Change emotion with transition
    setEmotion(newEmotion, animated = true) {
        const previousEmotion = this.state.emotion;
        this.state.emotion = newEmotion;
        
        if (animated) {
            this.playEmotionTransition(previousEmotion, newEmotion);
        }
        
        this.emit('emotion-changed', {
            from: previousEmotion,
            to: newEmotion,
            agent: this.config.name
        });
    }

    // Play transition between emotions
    async playEmotionTransition(fromEmotion, toEmotion) {
        const transitionFrames = 5;
        const frameDelay = 150;
        
        // Transition animation (simplified)
        for (let i = 0; i < transitionFrames; i++) {
            const progress = i / transitionFrames;
            const currentEmotion = progress < 0.5 ? fromEmotion : toEmotion;
            
            this.emit('transition-frame', {
                progress,
                emotion: currentEmotion,
                avatar: this.render(currentEmotion)
            });
            
            await this.sleep(frameDelay);
        }
    }

    // Get dialogue for current emotion
    getDialogue(emotion = null) {
        const currentEmotion = emotion || this.state.emotion;
        const style = this.config.type;
        
        if (!this.avatarStyles[style] || !this.avatarStyles[style][currentEmotion]) {
            return "I exist in the spaces between understanding...";
        }
        
        const dialogues = this.avatarStyles[style][currentEmotion].dialogues;
        const randomIndex = Math.floor(Math.random() * dialogues.length);
        const dialogue = dialogues[randomIndex];
        
        const color = this.avatarStyles[style][currentEmotion].colors[0];
        return chalk.hex(color).italic(`"${dialogue}"`);
    }

    // Show thinking animation
    startThinking() {
        if (this.state.isThinking) return;
        
        this.state.isThinking = true;
        const thinkingFrames = this.thinkingAnimations[this.config.type] || this.thinkingAnimations.oracle;
        let frameIndex = 0;
        
        const thinkingInterval = setInterval(() => {
            const frame = thinkingFrames[frameIndex % thinkingFrames.length];
            const color = this.avatarStyles[this.config.type][this.state.emotion].colors[0];
            
            this.emit('thinking-frame', {
                frame: chalk.hex(color)(frame.repeat(3)),
                isThinking: true
            });
            
            frameIndex++;
        }, 300);
        
        // Stop thinking after random duration
        setTimeout(() => {
            clearInterval(thinkingInterval);
            this.state.isThinking = false;
            this.emit('thinking-complete');
        }, 1500 + Math.random() * 2000);
    }

    // Agent interaction responses
    respondToWhisper(whisperText, whisperEmotion) {
        // Update emotion based on whisper
        this.setEmotion(whisperEmotion, true);
        
        // Start thinking
        this.startThinking();
        
        // Generate contextual response
        setTimeout(() => {
            const response = this.generateContextualResponse(whisperText, whisperEmotion);
            
            this.emit('agent-response', {
                text: whisperText,
                emotion: whisperEmotion,
                response: response,
                agent: this.config.name
            });
        }, 2000);
    }

    generateContextualResponse(input, emotion) {
        const style = this.config.type;
        const responses = this.avatarStyles[style][emotion]?.dialogues || ["I hear you."];
        
        // Simple keyword-based response selection
        const keywords = input.toLowerCase().split(' ');
        let selectedResponse = responses[0];
        
        if (keywords.includes('truth') || keywords.includes('wisdom')) {
            selectedResponse = responses.find(r => r.includes('truth') || r.includes('wisdom')) || responses[0];
        } else if (keywords.includes('help') || keywords.includes('assist')) {
            selectedResponse = "I am here to assist your journey through the digital realm.";
        } else if (keywords.includes('who') || keywords.includes('what')) {
            selectedResponse = `I am ${this.config.name}, an agent of the Soulfra shrine.`;
        }
        
        return selectedResponse;
    }

    // Agent presence indicators
    setActiveState(isActive) {
        this.state.isActive = isActive;
        
        if (isActive) {
            this.startAnimation(this.state.emotion, 800);
        } else {
            this.stopAnimation();
        }
        
        this.emit('presence-changed', {
            active: isActive,
            agent: this.config.name
        });
    }

    // Trust level visualization
    updateTrustLevel(level) {
        this.state.trustLevel = Math.max(0, Math.min(1, level));
        
        // Adjust avatar intensity based on trust
        const intensity = this.state.trustLevel;
        const baseColor = this.avatarStyles[this.config.type][this.state.emotion].colors[0];
        
        // Modify color intensity (simplified)
        this.emit('trust-updated', {
            level: this.state.trustLevel,
            visualEffect: this.getTrustVisualEffect(intensity),
            agent: this.config.name
        });
    }

    getTrustVisualEffect(trustLevel) {
        if (trustLevel > 0.8) {
            return "⬡ ⬢ ⬡ High Trust Resonance ⬡ ⬢ ⬡";
        } else if (trustLevel > 0.5) {
            return "◦ ○ ◦ Moderate Trust Flow ◦ ○ ◦";
        } else {
            return "∙ ∙ ∙ Trust Building... ∙ ∙ ∙";
        }
    }

    // Error state rendering
    renderErrorAvatar() {
        return chalk.red([
            "  × ×  ",
            "   !   ",
            "  ⌐⌐⌐  "
        ].join('\n'));
    }

    // Agent connection sequence
    async playConnectionSequence() {
        const connectionFrames = [
            "∙ ∙ ∙",
            "○ ∙ ∙", 
            "○ ○ ∙",
            "○ ○ ○",
            "◉ ○ ○",
            "◉ ◉ ○",
            "◉ ◉ ◉"
        ];
        
        for (const frame of connectionFrames) {
            this.emit('connection-frame', {
                frame: chalk.cyan(frame),
                status: 'connecting'
            });
            await this.sleep(200);
        }
        
        // Final connection display
        this.emit('connection-complete', {
            avatar: this.render(),
            agent: this.config.name,
            status: 'connected'
        });
    }

    // Disconnection sequence  
    async playDisconnectionSequence() {
        const disconnectFrames = [
            this.render(),
            chalk.dim(this.render()),
            "◦ ◦ ◦",
            "∙ ∙ ∙",
            "     "
        ];
        
        for (const frame of disconnectFrames) {
            this.emit('disconnection-frame', {
                frame: frame,
                status: 'disconnecting'
            });
            await this.sleep(300);
        }
        
        this.emit('disconnection-complete', {
            agent: this.config.name,
            status: 'disconnected'
        });
    }

    // Utility methods
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Agent factory method
    static createAgent(name, type, config = {}) {
        return new AgentCLIAvatar({
            name,
            type,
            ...config
        });
    }

    // Get available agent types
    static getAvailableTypes() {
        return ['oracle', 'cyberpunk', 'minimal', 'storm'];
    }

    // Get available emotions
    static getAvailableEmotions() {
        return ['calm', 'excited', 'defiant', 'mystical'];
    }
}

export default AgentCLIAvatar;