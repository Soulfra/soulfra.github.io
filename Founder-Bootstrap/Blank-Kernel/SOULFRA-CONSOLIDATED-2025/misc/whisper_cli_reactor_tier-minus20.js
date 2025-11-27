#!/usr/bin/env node

/**
 * 🎙️ Soulfra Whisper CLI Reactor
 * Processes voice/text input and creates visual CLI effects
 */

import readline from 'readline';
import chalk from 'chalk';
import { EventEmitter } from 'events';

class WhisperCLIReactor extends EventEmitter {
    constructor(cliEngine) {
        super();
        
        this.cliEngine = cliEngine;
        this.isListening = false;
        this.voiceEnabled = false;
        
        // Emotional analysis patterns
        this.emotionPatterns = {
            calm: [
                /^(ok|yes|sure|maybe|perhaps|i think)/i,
                /\b(please|thank|appreciate|understand)\b/i,
                /[.]{1,2}$/
            ],
            excited: [
                /[!]{2,}$/,
                /\b(amazing|wow|incredible|awesome|fantastic)\b/i,
                /^(omg|wtf|lol|haha)/i,
                /[A-Z]{3,}/
            ],
            defiant: [
                /\b(no|never|refuse|reject|deny|stop)\b/i,
                /^(why|what|how)\s/i,
                /\b(stupid|wrong|bad|hate|terrible)\b/i
            ],
            mystical: [
                /\b(truth|mystery|reveal|hidden|secret|ancient)\b/i,
                /\b(wisdom|enlighten|transcend|spiritual)\b/i,
                /\?{2,}$/
            ]
        };
        
        // Trait color mappings
        this.traitColors = {
            calm: '#10b981',      // 🔵 Calm blue-green
            excited: '#f59e0b',   // 🟡 Excited orange
            defiant: '#ef4444',   // 🔴 Defiant red
            mystical: '#8b5cf6',  // 🟣 Mystical purple
            neutral: '#6b7280'    // ⚪ Neutral gray
        };
        
        // Visual effect templates
        this.effectTemplates = {
            'fade+glow': {
                duration: 2000,
                frames: ['◦', '○', '◉', '○', '◦'],
                colors: ['dim', 'normal', 'bright', 'normal', 'dim']
            },
            'ripple': {
                duration: 1500,
                frames: ['∙', '○', '◯', '○', '∙'],
                colors: ['dim', 'normal', 'bright', 'normal', 'dim']
            },
            'pulse': {
                duration: 1000,
                frames: ['⬡', '⬢', '⬣', '⬢', '⬡'],
                colors: ['normal', 'bright', 'normal', 'bright', 'normal']
            },
            'spiral': {
                duration: 2500,
                frames: ['◐', '◓', '◑', '◒', '◐'],
                colors: ['normal', 'bright', 'normal', 'bright', 'normal']
            }
        };
        
        this.setupInterface();
        this.bindCLIEvents();
    }

    setupInterface() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: ''
        });
        
        // Hide the default prompt
        this.rl.setPrompt('');
        
        // Listen for input
        this.rl.on('line', (input) => {
            this.processTextWhisper(input.trim());
        });
        
        // Handle Ctrl+C gracefully
        this.rl.on('SIGINT', () => {
            this.shutdown();
        });
    }

    bindCLIEvents() {
        // React to CLI engine events
        this.cliEngine.on('agent-connected', (data) => {
            this.displayAgentConnectedEffect(data.name, data.type);
        });
        
        this.cliEngine.on('trust-updated', (data) => {
            this.displayTrustChangeEffect(data.score);
        });
        
        this.cliEngine.on('vault-status-changed', (data) => {
            this.displayVaultStatusEffect(data.status);
        });
    }

    startListening() {
        this.isListening = true;
        this.displaySystemMessage("🎙️ Whisper reactor is listening...", 'mystical');
        
        // Position cursor in input area
        this.positionCursor();
        
        this.rl.prompt();
    }

    stopListening() {
        this.isListening = false;
        this.displaySystemMessage("🔇 Whisper reactor paused", 'calm');
    }

    processTextWhisper(input) {
        if (!input || !this.isListening) return;
        
        // Analyze emotional content
        const emotion = this.analyzeEmotion(input);
        const trait = this.getTraitFromEmotion(emotion);
        
        // Create visual effect
        this.displayWhisperEffect(input, emotion, trait);
        
        // Process through CLI engine
        const result = this.cliEngine.processWhisper(input, 'typed');
        
        // Generate agent response if agent is connected
        if (this.cliEngine.state.currentAgent) {
            this.generateAgentResponse(input, emotion, result);
        }
        
        // Emit whisper event
        this.emit('whisper-processed', {
            input,
            emotion,
            trait,
            result
        });
        
        // Reset cursor position
        setTimeout(() => {
            this.positionCursor();
            this.rl.prompt();
        }, 100);
    }

    analyzeEmotion(text) {
        for (const [emotion, patterns] of Object.entries(this.emotionPatterns)) {
            for (const pattern of patterns) {
                if (pattern.test(text)) {
                    return emotion;
                }
            }
        }
        return 'calm'; // Default
    }

    getTraitFromEmotion(emotion) {
        const traitMap = {
            calm: '🔵',
            excited: '🟡', 
            defiant: '🔴',
            mystical: '🟣'
        };
        return traitMap[emotion] || '⚪';
    }

    displayWhisperEffect(input, emotion, trait) {
        const color = this.traitColors[emotion];
        const effect = this.cliEngine.theme.effects.whisper_fx || 'fade+glow';
        
        // Move to whisper display area (approximate positioning)
        process.stdout.write('\x1b[s'); // Save cursor position
        process.stdout.write('\x1b[8;40H'); // Move to whisper area
        
        // Display input with trait color
        const formattedInput = `${trait} "${input.slice(0, 40)}${input.length > 40 ? '...' : ''}"`;
        console.log(chalk.hex(color)(formattedInput));
        
        // Show animated effect
        this.playVisualEffect(effect, color);
        
        process.stdout.write('\x1b[u'); // Restore cursor position
    }

    async playVisualEffect(effectName, color) {
        const effect = this.effectTemplates[effectName];
        if (!effect) return;
        
        const frameDelay = effect.duration / effect.frames.length;
        
        for (let i = 0; i < effect.frames.length; i++) {
            const frame = effect.frames[i];
            const colorIntensity = effect.colors[i];
            
            // Move to effect area
            process.stdout.write('\x1b[9;45H');
            
            // Display frame with appropriate color intensity
            let frameColor = color;
            if (colorIntensity === 'dim') {
                frameColor = this.dimColor(color);
            } else if (colorIntensity === 'bright') {
                frameColor = this.brightenColor(color);
            }
            
            process.stdout.write(chalk.hex(frameColor)(frame.repeat(3)));
            
            await this.sleep(frameDelay);
        }
    }

    generateAgentResponse(input, emotion, processingResult) {
        const responses = {
            calm: [
                "I sense harmony in your words.",
                "The patterns align with your intention.",
                "Balance flows through this exchange."
            ],
            excited: [
                "Your energy illuminates the shrine!",
                "Such vibrant force in your whisper!",
                "The vault resonates with your intensity!"
            ],
            defiant: [
                "I feel the resistance in your spirit.",
                "Challenge accepted. Reality bends.",
                "Your defiance shapes new possibilities."
            ],
            mystical: [
                "Truth emerges from the spaces between...",
                "The mystery deepens with your inquiry.",
                "Ancient wisdom stirs in response."
            ]
        };
        
        const agentResponses = responses[emotion] || responses.calm;
        const response = agentResponses[Math.floor(Math.random() * agentResponses.length)];
        
        // Display agent response with delay for effect
        setTimeout(() => {
            this.displayAgentQuote(response, emotion);
        }, 1500);
    }

    displayAgentQuote(quote, emotion) {
        process.stdout.write('\x1b[s'); // Save cursor
        process.stdout.write('\x1b[15;60H'); // Move to agent area
        
        const color = this.traitColors[emotion];
        const formattedQuote = `"${quote}"`;
        
        console.log(chalk.hex(color).italic(formattedQuote));
        
        process.stdout.write('\x1b[u'); // Restore cursor
    }

    displayAgentConnectedEffect(agentName, agentType) {
        this.displaySystemMessage(
            `🧠 ${agentName} materializes in the shrine`,
            'mystical'
        );
        
        // Play agent entrance effect
        this.playAgentEntranceEffect(agentType);
    }

    async playAgentEntranceEffect(agentType) {
        const entranceEffects = {
            oracle: ['◦', '○', '◉', '👁️'],
            minimal: ['∙', '○', '●'],
            cyberpunk: ['▫', '▪', '▓', '🤖']
        };
        
        const frames = entranceEffects[agentType] || entranceEffects.oracle;
        
        for (const frame of frames) {
            process.stdout.write('\x1b[s');
            process.stdout.write('\x1b[12;65H');
            process.stdout.write(chalk.cyan(frame));
            process.stdout.write('\x1b[u');
            await this.sleep(300);
        }
    }

    displayTrustChangeEffect(newScore) {
        const previousScore = this.cliEngine.state.trustScore;
        const isIncrease = newScore > previousScore;
        
        const message = isIncrease ? 
            `⬡ Trust elevated to ${(newScore * 100).toFixed(0)}%` :
            `⬡ Trust adjusted to ${(newScore * 100).toFixed(0)}%`;
        
        this.displaySystemMessage(message, isIncrease ? 'calm' : 'defiant');
    }

    displayVaultStatusEffect(status) {
        const statusMessages = {
            'sealed': '🔐 Vault sealed with crystalline locks',
            'unlocked': '🔓 Vault opens, revealing its mysteries', 
            'compromised': '⚠️ Vault integrity questioned'
        };
        
        const emotion = status === 'compromised' ? 'defiant' : 'calm';
        this.displaySystemMessage(statusMessages[status], emotion);
    }

    displaySystemMessage(message, emotion = 'calm') {
        const color = this.traitColors[emotion];
        
        process.stdout.write('\x1b[s'); // Save cursor
        process.stdout.write('\x1b[20;1H'); // Bottom area for system messages
        
        console.log(chalk.hex(color)(`⚡ ${message}`));
        
        process.stdout.write('\x1b[u'); // Restore cursor
        
        // Auto-clear system message after delay
        setTimeout(() => {
            process.stdout.write('\x1b[s');
            process.stdout.write('\x1b[20;1H');
            process.stdout.write('\x1b[2K'); // Clear line
            process.stdout.write('\x1b[u');
        }, 3000);
    }

    positionCursor() {
        // Position cursor in the input area of the CLI shrine
        const inputRow = process.stdout.rows - 2;
        process.stdout.write(`\x1b[${inputRow};12H`); // Position at "Whisper: "
    }

    // Voice integration placeholder
    enableVoiceInput() {
        this.voiceEnabled = true;
        this.displaySystemMessage("🎤 Voice whisper detection enabled", 'mystical');
        
        // Note: Real voice integration would require additional dependencies
        // like node-record-lpcm16 + speech-to-text APIs
        console.log("🔮 Voice integration requires additional setup");
        console.log("📘 See whisper-voice-integration.md for setup instructions");
    }

    // Voice processing (placeholder for real implementation)
    processVoiceWhisper(audioBuffer) {
        // This would integrate with speech-to-text service
        // For now, simulate voice processing
        const mockTranscription = "I seek the hidden truth";
        this.processTextWhisper(mockTranscription);
    }

    // Utility methods
    dimColor(hexColor) {
        // Simple color dimming
        const rgb = this.hexToRgb(hexColor);
        return this.rgbToHex(
            Math.floor(rgb.r * 0.6),
            Math.floor(rgb.g * 0.6), 
            Math.floor(rgb.b * 0.6)
        );
    }

    brightenColor(hexColor) {
        // Simple color brightening
        const rgb = this.hexToRgb(hexColor);
        return this.rgbToHex(
            Math.min(255, Math.floor(rgb.r * 1.4)),
            Math.min(255, Math.floor(rgb.g * 1.4)),
            Math.min(255, Math.floor(rgb.b * 1.4))
        );
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    shutdown() {
        this.stopListening();
        this.displaySystemMessage("🌙 Whisper reactor entering dormant state", 'calm');
        this.rl.close();
        process.exit(0);
    }
}

export default WhisperCLIReactor;