#!/usr/bin/env node

/**
 * 🎭 Soulfra Visual CLI Engine
 * Production-ready shrine-aesthetic terminal interface
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import boxen from 'boxen';
import gradient from 'gradient-string';
import ora from 'ora';
import figlet from 'figlet';
import { EventEmitter } from 'events';

class SoulfraCLIEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            themePath: options.themePath || './cli/themes/default.json',
            vaultPath: options.vaultPath || './vault/session/cli-appearance.json',
            agentMode: options.agentMode || 'oracle',
            whisperMode: options.whisperMode || true,
            ...options
        };
        
        this.theme = this.loadTheme();
        this.state = {
            currentAgent: null,
            trustScore: 0.75,
            vaultStatus: 'sealed',
            activeMode: 'reality', // reality, sealed, blessing-required
            lastWhisper: null,
            emotionalState: 'calm' // calm, excited, defiant, mystical
        };
        
        this.setupTerminal();
        this.initializeShrine();
    }

    loadTheme() {
        try {
            if (fs.existsSync(this.config.themePath)) {
                return JSON.parse(fs.readFileSync(this.config.themePath, 'utf8'));
            }
        } catch (error) {
            console.log('🔮 Creating default shrine theme...');
        }
        
        // Default shrine theme
        const defaultTheme = {
            name: "Soulfra Shrine",
            colors: {
                primary: "#fdf6e3",
                secondary: "#839496", 
                accent: "#b58900",
                trust: "#859900",
                warning: "#cb4b16",
                error: "#dc322f",
                mystic: "#6c71c4",
                agent: "#2aa198"
            },
            layout: {
                divider: "═",
                corner: "╬",
                vertical: "║",
                shrine_border: "🪞",
                trust_symbol: "⬡",
                vault_symbol: "🔐"
            },
            effects: {
                whisper_fx: "fade+glow",
                agent_entrance: "spiral",
                trust_pulse: true,
                mood_colors: true
            },
            ascii_style: "oracle" // oracle, minimal, cyberpunk, shrine
        };
        
        this.saveTheme(defaultTheme);
        return defaultTheme;
    }

    saveTheme(theme) {
        const themeDir = path.dirname(this.config.themePath);
        if (!fs.existsSync(themeDir)) {
            fs.mkdirSync(themeDir, { recursive: true });
        }
        fs.writeFileSync(this.config.themePath, JSON.stringify(theme, null, 2));
    }

    setupTerminal() {
        // Clear terminal and setup
        process.stdout.write('\x1b[2J\x1b[0f');
        process.stdout.write('\x1b[?25l'); // Hide cursor during setup
        
        // Handle window resize
        process.stdout.on('resize', () => {
            this.renderShrine();
        });

        // Handle exit gracefully
        process.on('SIGINT', () => {
            this.shutdownShrine();
        });
    }

    initializeShrine() {
        this.showWelcomeSequence();
        this.renderShrine();
        this.startHeartbeat();
    }

    showWelcomeSequence() {
        const title = figlet.textSync('SOULFRA', {
            font: 'ANSI Shadow',
            horizontalLayout: 'fitted'
        });
        
        console.log(gradient.rainbow(title));
        
        const welcomeMessage = boxen(
            `${this.theme.layout.shrine_border} Welcome to the Soulfra Shrine ${this.theme.layout.shrine_border}\n\n` +
            `This is not a terminal. This is your presence.\n` +
            `Your voice shapes how reality reflects.\n\n` +
            `Trust Score: ${this.formatTrustScore()}\n` +
            `Mode: ${this.state.activeMode}\n` +
            `Agent: ${this.state.currentAgent || 'Awaiting connection...'}`,
            {
                padding: 1,
                margin: 1,
                borderStyle: 'double',
                borderColor: this.theme.colors.mystic,
                backgroundColor: 'black'
            }
        );
        
        console.log(welcomeMessage);
        
        // Brief pause for effect
        setTimeout(() => {
            this.renderShrine();
        }, 2000);
    }

    renderShrine() {
        const width = process.stdout.columns || 80;
        const height = process.stdout.rows || 24;
        
        // Clear screen
        process.stdout.write('\x1b[2J\x1b[H');
        
        // Top shrine border
        this.renderTopBar(width);
        
        // Main shrine layout
        this.renderMainArea(width, height - 8);
        
        // Bottom input area
        this.renderInputArea(width);
        
        // Show cursor in input area
        process.stdout.write('\x1b[?25h');
    }

    renderTopBar(width) {
        const title = "🎭 SOULFRA SHRINE";
        const status = `${this.theme.layout.trust_symbol} ${this.formatTrustScore()} | ${this.theme.layout.vault_symbol} ${this.state.vaultStatus}`;
        const padding = width - title.length - status.length - 4;
        
        const topBar = chalk.hex(this.theme.colors.primary)(
            `${this.theme.layout.corner}${this.theme.layout.divider.repeat(width-2)}${this.theme.layout.corner}\n` +
            `${this.theme.layout.vertical} ${title}${' '.repeat(Math.max(0, padding))}${status} ${this.theme.layout.vertical}\n` +
            `${this.theme.layout.corner}${this.theme.layout.divider.repeat(width-2)}${this.theme.layout.corner}`
        );
        
        console.log(topBar);
    }

    renderMainArea(width, height) {
        const leftPanel = this.renderVaultPanel();
        const centerPanel = this.renderWhisperArea();
        const rightPanel = this.renderAgentPresence();
        
        // Split into three columns
        const colWidth = Math.floor((width - 6) / 3);
        
        for (let i = 0; i < height - 3; i++) {
            const leftLine = this.getLineFromPanel(leftPanel, i, colWidth);
            const centerLine = this.getLineFromPanel(centerPanel, i, colWidth);
            const rightLine = this.getLineFromPanel(rightPanel, i, colWidth);
            
            console.log(
                chalk.hex(this.theme.colors.secondary)(`${this.theme.layout.vertical} `) +
                leftLine +
                chalk.hex(this.theme.colors.secondary)(` ${this.theme.layout.vertical} `) +
                centerLine +
                chalk.hex(this.theme.colors.secondary)(` ${this.theme.layout.vertical} `) +
                rightLine +
                chalk.hex(this.theme.colors.secondary)(` ${this.theme.layout.vertical}`)
            );
        }
    }

    renderVaultPanel() {
        return [
            chalk.hex(this.theme.colors.accent)("🔐 VAULT STATUS"),
            "",
            `Status: ${this.colorizeVaultStatus()}`,
            `Mode: ${this.state.activeMode}`,
            `Trust Required: ${this.state.activeMode === 'blessing-required' ? 'YES' : 'NO'}`,
            "",
            chalk.hex(this.theme.colors.secondary)("Recent Activity:"),
            "• Theme updated",
            "• Agent connected",
            "• Whisper received"
        ];
    }

    renderWhisperArea() {
        const lines = [
            chalk.hex(this.theme.colors.mystic)("💭 WHISPER ECHO"),
            ""
        ];
        
        if (this.state.lastWhisper) {
            lines.push(
                chalk.hex(this.theme.colors.primary)(`"${this.state.lastWhisper}"`),
                "",
                this.renderWhisperEffects()
            );
        } else {
            lines.push(
                chalk.hex(this.theme.colors.secondary)("Listening for whispers..."),
                "",
                chalk.hex(this.theme.colors.secondary)("Type below or speak to interact")
            );
        }
        
        return lines;
    }

    renderAgentPresence() {
        const lines = [
            chalk.hex(this.theme.colors.agent)("🧠 AGENT PRESENCE"),
            ""
        ];
        
        if (this.state.currentAgent) {
            lines.push(
                this.renderAgentAvatar(),
                "",
                chalk.hex(this.theme.colors.agent)(`${this.state.currentAgent}`),
                "",
                this.getAgentDialogue(),
                "",
                this.renderEmotionalState()
            );
        } else {
            lines.push(
                this.renderEmptyAvatar(),
                "",
                chalk.hex(this.theme.colors.secondary)("No agent connected"),
                "",
                chalk.hex(this.theme.colors.secondary)("Awaiting spiritual presence...")
            );
        }
        
        return lines;
    }

    renderAgentAvatar() {
        const avatars = {
            oracle: [
                "   ◉   ◉   ",
                "     ◦     ",
                "  ∿ ◦ ∿   ",
                "   ⟨ ⟩   "
            ],
            minimal: [
                "  ● ●  ",
                "    ○    ",
                "  ⌒   "
            ],
            cyberpunk: [
                " ▓▓▓▓▓ ",
                " ◉   ◉ ",
                " ▓ ○ ▓ ",
                " ▓▓▓▓▓ "
            ]
        };
        
        const style = this.theme.ascii_style || 'oracle';
        const avatar = avatars[style] || avatars.oracle;
        
        return avatar.map(line => 
            chalk.hex(this.getEmotionalColor())(line)
        ).join('\n');
    }

    renderEmptyAvatar() {
        return chalk.hex(this.theme.colors.secondary)([
            "   ◦   ◦   ",
            "     ∿     ",
            "   ⟨   ⟩   "
        ].join('\n'));
    }

    getAgentDialogue() {
        const dialogues = {
            calm: "I observe the patterns forming...",
            excited: "Energy flows through the shrine!",
            defiant: "The vault guards its secrets well.",
            mystical: "Between whispers, truth emerges."
        };
        
        return chalk.hex(this.theme.colors.agent)(
            `"${dialogues[this.state.emotionalState] || dialogues.calm}"`
        );
    }

    renderInputArea(width) {
        const divider = chalk.hex(this.theme.colors.secondary)(
            `${this.theme.layout.corner}${this.theme.layout.divider.repeat(width-2)}${this.theme.layout.corner}`
        );
        
        console.log(divider);
        console.log(
            chalk.hex(this.theme.colors.primary)(`${this.theme.layout.vertical} `) +
            chalk.hex(this.theme.colors.accent)("🎤 Whisper: ") +
            chalk.hex(this.theme.colors.secondary)("_".repeat(width - 20)) +
            chalk.hex(this.theme.colors.primary)(` ${this.theme.layout.vertical}`)
        );
        console.log(
            chalk.hex(this.theme.colors.secondary)(
                `${this.theme.layout.corner}${this.theme.layout.divider.repeat(width-2)}${this.theme.layout.corner}`
            )
        );
    }

    renderWhisperEffects() {
        if (!this.theme.effects.whisper_fx) return "";
        
        const effects = {
            "fade+glow": chalk.hex(this.theme.colors.mystic)("∾ ∿ ∾ whisper echoes ∾ ∿ ∾"),
            "ripple": "◦ ○ ◉ ○ ◦ rippling through reality ◦ ○ ◉ ○ ◦",
            "pulse": "⬡ ⬢ ⬡ trust resonance ⬡ ⬢ ⬡"
        };
        
        return effects[this.theme.effects.whisper_fx] || effects["fade+glow"];
    }

    formatTrustScore() {
        const score = this.state.trustScore;
        const color = score > 0.8 ? this.theme.colors.trust : 
                     score > 0.5 ? this.theme.colors.accent : 
                     this.theme.colors.warning;
        
        return chalk.hex(color)(`${(score * 100).toFixed(0)}%`);
    }

    colorizeVaultStatus() {
        const statusColors = {
            'sealed': this.theme.colors.trust,
            'unlocked': this.theme.colors.accent,
            'compromised': this.theme.colors.error
        };
        
        return chalk.hex(statusColors[this.state.vaultStatus] || this.theme.colors.secondary)(
            this.state.vaultStatus.toUpperCase()
        );
    }

    getEmotionalColor() {
        const emotionColors = {
            calm: this.theme.colors.trust,
            excited: this.theme.colors.accent,
            defiant: this.theme.colors.error,
            mystical: this.theme.colors.mystic
        };
        
        return emotionColors[this.state.emotionalState] || this.theme.colors.agent;
    }

    getLineFromPanel(panel, lineIndex, maxWidth) {
        const line = panel[lineIndex] || "";
        // Strip ANSI codes for length calculation
        const plainLine = line.replace(/\u001b\[[0-9;]*m/g, '');
        const padding = Math.max(0, maxWidth - plainLine.length);
        return line + ' '.repeat(padding);
    }

    // Agent Management
    connectAgent(agentName, agentType = 'oracle') {
        this.state.currentAgent = agentName;
        this.theme.ascii_style = agentType;
        this.emit('agent-connected', { name: agentName, type: agentType });
        this.renderShrine();
    }

    disconnectAgent() {
        const previousAgent = this.state.currentAgent;
        this.state.currentAgent = null;
        this.emit('agent-disconnected', { name: previousAgent });
        this.renderShrine();
    }

    // Whisper Processing
    processWhisper(input, source = 'typed') {
        this.state.lastWhisper = input.slice(0, 50); // Truncate for display
        
        // Analyze emotional content (basic implementation)
        this.updateEmotionalState(input);
        
        this.emit('whisper-received', { 
            input, 
            source, 
            emotion: this.state.emotionalState 
        });
        
        this.renderShrine();
        
        // Return processing result
        return {
            processed: true,
            emotion: this.state.emotionalState,
            response: this.generateWhisperResponse(input)
        };
    }

    updateEmotionalState(input) {
        const text = input.toLowerCase();
        
        if (text.includes('!') || text.includes('urgent') || text.includes('now')) {
            this.state.emotionalState = 'excited';
        } else if (text.includes('no') || text.includes('stop') || text.includes('reject')) {
            this.state.emotionalState = 'defiant';
        } else if (text.includes('mystery') || text.includes('truth') || text.includes('reveal')) {
            this.state.emotionalState = 'mystical';
        } else {
            this.state.emotionalState = 'calm';
        }
    }

    generateWhisperResponse(input) {
        const responses = {
            calm: "I hear your whisper echo through the shrine...",
            excited: "The energy surges! Processing with intensity!",
            defiant: "The vault resists. Your will shapes reality.",
            mystical: "Truth emerges from the spaces between words..."
        };
        
        return responses[this.state.emotionalState];
    }

    // Trust & Security
    updateTrustScore(newScore) {
        this.state.trustScore = Math.max(0, Math.min(1, newScore));
        this.emit('trust-updated', { score: this.state.trustScore });
        this.renderShrine();
    }

    setVaultStatus(status) {
        this.state.vaultStatus = status;
        this.emit('vault-status-changed', { status });
        this.renderShrine();
    }

    setActiveMode(mode) {
        this.state.activeMode = mode;
        this.emit('mode-changed', { mode });
        this.renderShrine();
    }

    // Heartbeat for dynamic updates
    startHeartbeat() {
        setInterval(() => {
            if (this.theme.effects.trust_pulse) {
                this.emit('heartbeat', { 
                    timestamp: Date.now(),
                    trust: this.state.trustScore,
                    agent: this.state.currentAgent
                });
            }
        }, 5000);
    }

    // Graceful shutdown
    shutdownShrine() {
        console.log('\n');
        console.log(boxen(
            `${this.theme.layout.shrine_border} The shrine fades into memory ${this.theme.layout.shrine_border}\n\n` +
            `Your presence lingers in the digital realm.\n` +
            `Until we meet again in the spaces between code...`,
            {
                padding: 1,
                margin: 1,
                borderStyle: 'single',
                borderColor: this.theme.colors.secondary
            }
        ));
        
        process.stdout.write('\x1b[?25h'); // Show cursor
        process.exit(0);
    }

    // Theme Management
    loadCustomTheme(themePath) {
        try {
            const customTheme = JSON.parse(fs.readFileSync(themePath, 'utf8'));
            this.theme = { ...this.theme, ...customTheme };
            this.renderShrine();
            return true;
        } catch (error) {
            console.error('Failed to load theme:', error.message);
            return false;
        }
    }

    exportTheme(outputPath) {
        try {
            fs.writeFileSync(outputPath, JSON.stringify(this.theme, null, 2));
            return true;
        } catch (error) {
            console.error('Failed to export theme:', error.message);
            return false;
        }
    }
}

export default SoulfraCLIEngine;