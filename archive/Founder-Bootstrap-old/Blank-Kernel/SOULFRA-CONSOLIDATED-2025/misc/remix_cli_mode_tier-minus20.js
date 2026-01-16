#!/usr/bin/env node

/**
 * 🖌️ Soulfra Remix CLI Mode
 * Interactive theme editor for real-time CLI customization
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import chalk from 'chalk';
import boxen from 'boxen';
import { EventEmitter } from 'events';

class RemixCLIMode extends EventEmitter {
    constructor(cliEngine) {
        super();
        
        this.cliEngine = cliEngine;
        this.originalTheme = JSON.parse(JSON.stringify(cliEngine.theme));
        this.workingTheme = JSON.parse(JSON.stringify(cliEngine.theme));
        
        this.state = {
            currentMenu: 'main',
            selectedCategory: null,
            selectedProperty: null,
            isPreviewMode: false,
            hasUnsavedChanges: false,
            previewTimer: null
        };
        
        // Menu structure
        this.menus = {
            main: {
                title: "🎨 Soulfra Theme Remix Studio",
                options: [
                    { key: '1', label: 'Colors', action: () => this.enterColorMenu() },
                    { key: '2', label: 'Layout Elements', action: () => this.enterLayoutMenu() },
                    { key: '3', label: 'Visual Effects', action: () => this.enterEffectsMenu() },
                    { key: '4', label: 'Agent Avatars', action: () => this.enterAvatarMenu() },
                    { key: '5', label: 'Quick Presets', action: () => this.enterPresetsMenu() },
                    { key: 'p', label: 'Preview Changes', action: () => this.togglePreview() },
                    { key: 's', label: 'Save Theme', action: () => this.saveTheme() },
                    { key: 'r', label: 'Reset to Original', action: () => this.resetTheme() },
                    { key: 'q', label: 'Quit Remix Mode', action: () => this.exitRemixMode() }
                ]
            },
            
            colors: {
                title: "🌈 Color Customization",
                options: [
                    { key: '1', label: 'Primary Text', prop: 'colors.primary', action: (val) => this.setColor('colors.primary', val) },
                    { key: '2', label: 'Secondary Text', prop: 'colors.secondary', action: (val) => this.setColor('colors.secondary', val) },
                    { key: '3', label: 'Accent Color', prop: 'colors.accent', action: (val) => this.setColor('colors.accent', val) },
                    { key: '4', label: 'Trust Score', prop: 'colors.trust', action: (val) => this.setColor('colors.trust', val) },
                    { key: '5', label: 'Warning Color', prop: 'colors.warning', action: (val) => this.setColor('colors.warning', val) },
                    { key: '6', label: 'Error Color', prop: 'colors.error', action: (val) => this.setColor('colors.error', val) },
                    { key: '7', label: 'Mystic Color', prop: 'colors.mystic', action: (val) => this.setColor('colors.mystic', val) },
                    { key: '8', label: 'Agent Color', prop: 'colors.agent', action: (val) => this.setColor('colors.agent', val) },
                    { key: 'c', label: 'Color Schemes', action: () => this.showColorSchemes() },
                    { key: 'b', label: 'Back to Main', action: () => this.returnToMain() }
                ]
            },
            
            layout: {
                title: "📐 Layout Elements",
                options: [
                    { key: '1', label: 'Border Divider', prop: 'layout.divider', action: (val) => this.setLayout('divider', val) },
                    { key: '2', label: 'Corner Character', prop: 'layout.corner', action: (val) => this.setLayout('corner', val) },
                    { key: '3', label: 'Vertical Border', prop: 'layout.vertical', action: (val) => this.setLayout('vertical', val) },
                    { key: '4', label: 'Shrine Border', prop: 'layout.shrine_border', action: (val) => this.setLayout('shrine_border', val) },
                    { key: '5', label: 'Trust Symbol', prop: 'layout.trust_symbol', action: (val) => this.setLayout('trust_symbol', val) },
                    { key: '6', label: 'Vault Symbol', prop: 'layout.vault_symbol', action: (val) => this.setLayout('vault_symbol', val) },
                    { key: '7', label: 'Agent Symbol', prop: 'layout.agent_symbol', action: (val) => this.setLayout('agent_symbol', val) },
                    { key: 's', label: 'Style Presets', action: () => this.showLayoutPresets() },
                    { key: 'b', label: 'Back to Main', action: () => this.returnToMain() }
                ]
            },
            
            effects: {
                title: "✨ Visual Effects",
                options: [
                    { key: '1', label: 'Whisper Effect', prop: 'effects.whisper_fx', action: (val) => this.setEffect('whisper_fx', val) },
                    { key: '2', label: 'Agent Entrance', prop: 'effects.agent_entrance', action: (val) => this.setEffect('agent_entrance', val) },
                    { key: '3', label: 'Trust Pulse', prop: 'effects.trust_pulse', action: (val) => this.toggleEffect('trust_pulse') },
                    { key: '4', label: 'Mood Colors', prop: 'effects.mood_colors', action: (val) => this.toggleEffect('mood_colors') },
                    { key: '5', label: 'Animation Speed', prop: 'effects.animation_speed', action: (val) => this.setEffect('animation_speed', val) },
                    { key: 't', label: 'Test Effects', action: () => this.testEffects() },
                    { key: 'b', label: 'Back to Main', action: () => this.returnToMain() }
                ]
            },
            
            presets: {
                title: "🎯 Quick Theme Presets",
                options: [
                    { key: '1', label: 'Sacred Shrine (Default)', action: () => this.loadPreset('shrine') },
                    { key: '2', label: 'Neon Cyberpunk', action: () => this.loadPreset('cyberpunk') },
                    { key: '3', label: 'Clean Minimal', action: () => this.loadPreset('minimal') },
                    { key: '4', label: 'Echo Storm', action: () => this.loadPreset('storm') },
                    { key: '5', label: 'Builder\'s Console', action: () => this.loadPreset('builders') },
                    { key: '6', label: 'Mystic Observatory', action: () => this.loadPreset('mystics') },
                    { key: '7', label: 'Guardian Protocol', action: () => this.loadPreset('guardians') },
                    { key: '8', label: 'Wanderer\'s Path', action: () => this.loadPreset('wanderers') },
                    { key: 'c', label: 'Create Custom Preset', action: () => this.createCustomPreset() },
                    { key: 'b', label: 'Back to Main', action: () => this.returnToMain() }
                ]
            }
        };
        
        // Preset definitions (loaded from theme builder)
        this.presets = this.loadPresetDefinitions();
        
        this.setupInterface();
    }

    setupInterface() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        // Clear screen and show welcome
        this.clearScreen();
        this.showWelcome();
    }

    showWelcome() {
        const welcome = boxen(
            `🎨 Welcome to Soulfra Theme Remix Studio\n\n` +
            `This is your creative sanctuary for crafting\n` +
            `the perfect shrine aesthetic. Every change\n` +
            `shapes how your digital presence manifests.\n\n` +
            `🪞 Your voice. Your vision. Your shrine.`,
            {
                padding: 1,
                margin: 1,
                borderStyle: 'double',
                borderColor: 'cyan',
                backgroundColor: 'black'
            }
        );
        
        console.log(welcome);
        console.log(chalk.yellow('\nPress any key to enter the remix studio...'));
        
        this.rl.once('line', () => {
            this.showCurrentMenu();
        });
    }

    showCurrentMenu() {
        this.clearScreen();
        
        const menu = this.menus[this.state.currentMenu];
        if (!menu) return;
        
        // Show theme status
        this.showThemeStatus();
        
        // Show menu title
        console.log(chalk.bold.cyan(`\n${menu.title}`));
        console.log(chalk.gray('═'.repeat(menu.title.length + 4)));
        
        // Show current values for relevant properties
        if (this.state.currentMenu !== 'main') {
            this.showCurrentValues();
        }
        
        // Show menu options
        console.log();
        menu.options.forEach(option => {
            const key = chalk.bold.yellow(`[${option.key}]`);
            const label = option.label;
            const current = option.prop ? this.getThemeProperty(option.prop) : '';
            const currentDisplay = current ? chalk.dim(` (${current})`) : '';
            
            console.log(`${key} ${label}${currentDisplay}`);
        });
        
        console.log();
        this.promptForInput();
    }

    showThemeStatus() {
        const statusColor = this.state.hasUnsavedChanges ? 'yellow' : 'green';
        const statusText = this.state.hasUnsavedChanges ? 'Modified' : 'Saved';
        const previewText = this.state.isPreviewMode ? ' [PREVIEW MODE]' : '';
        
        console.log(
            chalk[statusColor](`Theme Status: ${statusText}`) + 
            chalk.magenta(previewText)
        );
    }

    showCurrentValues() {
        const menu = this.menus[this.state.currentMenu];
        const relevantOptions = menu.options.filter(opt => opt.prop);
        
        if (relevantOptions.length > 0) {
            console.log(chalk.bold('\nCurrent Values:'));
            relevantOptions.forEach(option => {
                const value = this.getThemeProperty(option.prop);
                const displayValue = typeof value === 'string' ? value : JSON.stringify(value);
                console.log(chalk.dim(`  ${option.label}: ${displayValue}`));
            });
        }
    }

    promptForInput() {
        const prompt = this.state.isPreviewMode ? 
            chalk.magenta('remix-preview> ') : 
            chalk.cyan('remix> ');
        
        this.rl.question(prompt, (input) => {
            this.handleInput(input.trim().toLowerCase());
        });
    }

    handleInput(input) {
        const menu = this.menus[this.state.currentMenu];
        const option = menu.options.find(opt => opt.key === input);
        
        if (option) {
            if (option.action) {
                option.action();
            } else if (option.prop) {
                this.promptForPropertyValue(option);
            }
        } else {
            console.log(chalk.red(`Unknown option: ${input}`));
            setTimeout(() => this.showCurrentMenu(), 1000);
        }
    }

    promptForPropertyValue(option) {
        console.log(chalk.yellow(`\nEnter new value for ${option.label}:`));
        
        if (option.prop.includes('colors')) {
            console.log(chalk.dim('Examples: #ff0000, #00ff00, rgb(255,0,0), red, blue'));
        } else if (option.prop.includes('layout')) {
            console.log(chalk.dim('Examples: ═, ─, ▓, 🪞, ⬡'));
        }
        
        const currentValue = this.getThemeProperty(option.prop);
        console.log(chalk.dim(`Current: ${currentValue}`));
        
        this.rl.question('New value> ', (value) => {
            if (value.trim()) {
                option.action(value.trim());
                this.state.hasUnsavedChanges = true;
                
                if (this.state.isPreviewMode) {
                    this.applyPreview();
                }
            }
            setTimeout(() => this.showCurrentMenu(), 500);
        });
    }

    // Theme manipulation methods
    setColor(colorPath, value) {
        this.setThemeProperty(colorPath, value);
        console.log(chalk.green(`✓ Color updated: ${colorPath} = ${value}`));
    }

    setLayout(layoutProperty, value) {
        this.setThemeProperty(`layout.${layoutProperty}`, value);
        console.log(chalk.green(`✓ Layout updated: ${layoutProperty} = ${value}`));
    }

    setEffect(effectProperty, value) {
        this.setThemeProperty(`effects.${effectProperty}`, value);
        console.log(chalk.green(`✓ Effect updated: ${effectProperty} = ${value}`));
    }

    toggleEffect(effectProperty) {
        const currentValue = this.getThemeProperty(`effects.${effectProperty}`);
        const newValue = !currentValue;
        this.setThemeProperty(`effects.${effectProperty}`, newValue);
        console.log(chalk.green(`✓ Effect toggled: ${effectProperty} = ${newValue}`));
    }

    // Menu navigation
    enterColorMenu() {
        this.state.currentMenu = 'colors';
        this.showCurrentMenu();
    }

    enterLayoutMenu() {
        this.state.currentMenu = 'layout';
        this.showCurrentMenu();
    }

    enterEffectsMenu() {
        this.state.currentMenu = 'effects';
        this.showCurrentMenu();
    }

    enterAvatarMenu() {
        console.log(chalk.yellow('Agent avatar customization coming soon...'));
        setTimeout(() => this.showCurrentMenu(), 1500);
    }

    enterPresetsMenu() {
        this.state.currentMenu = 'presets';
        this.showCurrentMenu();
    }

    returnToMain() {
        this.state.currentMenu = 'main';
        this.showCurrentMenu();
    }

    // Preview functionality
    togglePreview() {
        this.state.isPreviewMode = !this.state.isPreviewMode;
        
        if (this.state.isPreviewMode) {
            console.log(chalk.magenta('🔍 Preview mode activated - changes are live!'));
            this.applyPreview();
        } else {
            console.log(chalk.cyan('📝 Preview mode deactivated - changes saved for later'));
            this.revertPreview();
        }
        
        setTimeout(() => this.showCurrentMenu(), 1500);
    }

    applyPreview() {
        // Apply working theme to CLI engine
        this.cliEngine.theme = JSON.parse(JSON.stringify(this.workingTheme));
        this.cliEngine.renderShrine();
        
        // Auto-refresh preview
        if (this.state.previewTimer) {
            clearTimeout(this.state.previewTimer);
        }
        
        this.state.previewTimer = setTimeout(() => {
            if (this.state.isPreviewMode) {
                this.cliEngine.renderShrine();
            }
        }, 2000);
    }

    revertPreview() {
        // Revert to original theme
        this.cliEngine.theme = JSON.parse(JSON.stringify(this.originalTheme));
        this.cliEngine.renderShrine();
    }

    // Preset management
    loadPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) {
            console.log(chalk.red(`Preset '${presetName}' not found`));
            return;
        }
        
        this.workingTheme = JSON.parse(JSON.stringify(preset));
        this.state.hasUnsavedChanges = true;
        
        console.log(chalk.green(`✓ Preset loaded: ${preset.name}`));
        console.log(chalk.dim(preset.description));
        
        if (this.state.isPreviewMode) {
            this.applyPreview();
        }
        
        setTimeout(() => this.showCurrentMenu(), 2000);
    }

    createCustomPreset() {
        console.log(chalk.yellow('\nCreate Custom Preset'));
        
        this.rl.question('Preset name> ', (name) => {
            if (!name.trim()) {
                console.log(chalk.red('Name required'));
                setTimeout(() => this.showCurrentMenu(), 1000);
                return;
            }
            
            this.rl.question('Description> ', (description) => {
                const customPreset = {
                    name: name.trim(),
                    description: description.trim() || 'Custom theme preset',
                    ...JSON.parse(JSON.stringify(this.workingTheme))
                };
                
                this.saveCustomPreset(name.trim(), customPreset);
                console.log(chalk.green(`✓ Custom preset '${name}' created`));
                
                setTimeout(() => this.showCurrentMenu(), 2000);
            });
        });
    }

    // Color scheme helpers
    showColorSchemes() {
        console.log(chalk.bold('\n🌈 Available Color Schemes:'));
        console.log('1. Solarized Dark');
        console.log('2. Dracula'); 
        console.log('3. Monokai');
        console.log('4. Nord');
        console.log('5. Gruvbox');
        console.log('c. Custom RGB Input');
        
        this.rl.question('\nSelect scheme> ', (choice) => {
            this.applyColorScheme(choice);
            setTimeout(() => this.showCurrentMenu(), 1000);
        });
    }

    applyColorScheme(choice) {
        const schemes = {
            '1': { // Solarized Dark
                primary: '#839496', secondary: '#586e75', accent: '#268bd2',
                background: '#002b36', trust: '#859900'
            },
            '2': { // Dracula
                primary: '#f8f8f2', secondary: '#6272a4', accent: '#bd93f9',
                background: '#282a36', trust: '#50fa7b'
            },
            '3': { // Monokai
                primary: '#f8f8f2', secondary: '#75715e', accent: '#a6e22e',
                background: '#272822', trust: '#66d9ef'
            }
        };
        
        const scheme = schemes[choice];
        if (scheme) {
            Object.assign(this.workingTheme.colors, scheme);
            this.state.hasUnsavedChanges = true;
            console.log(chalk.green('✓ Color scheme applied'));
        }
    }

    // Layout presets
    showLayoutPresets() {
        console.log(chalk.bold('\n📐 Layout Style Presets:'));
        console.log('1. Classic (═ ╬ ║)');
        console.log('2. Modern (─ ┼ │)');
        console.log('3. ASCII (- + |)');
        console.log('4. Mystical (∿ ⚡ ∣)');
        console.log('5. Tech (▓ █ ▌)');
        
        this.rl.question('\nSelect style> ', (choice) => {
            this.applyLayoutPreset(choice);
            setTimeout(() => this.showCurrentMenu(), 1000);
        });
    }

    applyLayoutPreset(choice) {
        const presets = {
            '1': { divider: '═', corner: '╬', vertical: '║' },
            '2': { divider: '─', corner: '┼', vertical: '│' },
            '3': { divider: '-', corner: '+', vertical: '|' },
            '4': { divider: '∿', corner: '⚡', vertical: '∣' },
            '5': { divider: '▓', corner: '█', vertical: '▌' }
        };
        
        const preset = presets[choice];
        if (preset) {
            Object.assign(this.workingTheme.layout, preset);
            this.state.hasUnsavedChanges = true;
            console.log(chalk.green('✓ Layout preset applied'));
        }
    }

    // Effect testing
    testEffects() {
        console.log(chalk.yellow('\n✨ Testing visual effects...'));
        
        // Simulate whisper for effect testing
        if (this.cliEngine.whisperReactor) {
            this.cliEngine.whisperReactor.processTextWhisper('Testing effects!');
        }
        
        console.log(chalk.green('Effect test complete'));
        setTimeout(() => this.showCurrentMenu(), 2000);
    }

    // Save/Load functionality
    saveTheme() {
        console.log(chalk.yellow('\nSave Theme'));
        
        this.rl.question('Theme name (or press enter for default)> ', (name) => {
            const themeName = name.trim() || 'custom-theme';
            const themeFile = `./cli/themes/${themeName}.json`;
            
            try {
                // Ensure directory exists
                const themeDir = path.dirname(themeFile);
                if (!fs.existsSync(themeDir)) {
                    fs.mkdirSync(themeDir, { recursive: true });
                }
                
                // Add metadata
                const themeWithMetadata = {
                    ...this.workingTheme,
                    metadata: {
                        name: themeName,
                        created: new Date().toISOString(),
                        version: '1.0.0',
                        author: 'Soulfra Remix Studio'
                    }
                };
                
                fs.writeFileSync(themeFile, JSON.stringify(themeWithMetadata, null, 2));
                
                // Update CLI engine with saved theme
                this.cliEngine.theme = JSON.parse(JSON.stringify(this.workingTheme));
                this.originalTheme = JSON.parse(JSON.stringify(this.workingTheme));
                this.state.hasUnsavedChanges = false;
                
                console.log(chalk.green(`✓ Theme saved as '${themeName}'`));
                console.log(chalk.dim(`Location: ${themeFile}`));
                
            } catch (error) {
                console.log(chalk.red(`✗ Save failed: ${error.message}`));
            }
            
            setTimeout(() => this.showCurrentMenu(), 2000);
        });
    }

    resetTheme() {
        console.log(chalk.yellow('\nReset to original theme? This will lose all changes.'));
        this.rl.question('Confirm (y/N)> ', (confirm) => {
            if (confirm.toLowerCase() === 'y') {
                this.workingTheme = JSON.parse(JSON.stringify(this.originalTheme));
                this.state.hasUnsavedChanges = false;
                
                if (this.state.isPreviewMode) {
                    this.applyPreview();
                }
                
                console.log(chalk.green('✓ Theme reset to original'));
            }
            
            setTimeout(() => this.showCurrentMenu(), 1500);
        });
    }

    // Theme property utilities
    getThemeProperty(path) {
        const parts = path.split('.');
        let obj = this.workingTheme;
        
        for (const part of parts) {
            if (obj && typeof obj === 'object' && part in obj) {
                obj = obj[part];
            } else {
                return undefined;
            }
        }
        
        return obj;
    }

    setThemeProperty(path, value) {
        const parts = path.split('.');
        let obj = this.workingTheme;
        
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!(part in obj)) {
                obj[part] = {};
            }
            obj = obj[part];
        }
        
        obj[parts[parts.length - 1]] = value;
    }

    // Load preset definitions
    loadPresetDefinitions() {
        // This would normally load from the cli-theme-builder.json
        // For now, return basic presets
        return {
            shrine: {
                name: "Sacred Shrine",
                description: "The original Soulfra aesthetic",
                colors: {
                    primary: "#fdf6e3", secondary: "#839496", accent: "#b58900",
                    trust: "#859900", mystic: "#6c71c4", agent: "#2aa198"
                },
                layout: {
                    divider: "═", corner: "╬", vertical: "║",
                    shrine_border: "🪞", trust_symbol: "⬡"
                },
                effects: {
                    whisper_fx: "fade+glow", trust_pulse: true
                }
            },
            cyberpunk: {
                name: "Neon Terminal",
                description: "High-tech, low-life aesthetic",
                colors: {
                    primary: "#00ff00", secondary: "#ff0080", accent: "#00ffff",
                    trust: "#39ff14", mystic: "#bf00ff", agent: "#00bfff"
                },
                layout: {
                    divider: "▓", corner: "█", vertical: "▌",
                    shrine_border: "🌐", trust_symbol: "◆"
                },
                effects: {
                    whisper_fx: "pulse", trust_pulse: true
                }
            },
            minimal: {
                name: "Clean Essence", 
                description: "Stripped-down elegance",
                colors: {
                    primary: "#ffffff", secondary: "#cccccc", accent: "#666666",
                    trust: "#4caf50", mystic: "#9c27b0", agent: "#2196f3"
                },
                layout: {
                    divider: "─", corner: "┼", vertical: "│",
                    shrine_border: "◦", trust_symbol: "●"
                },
                effects: {
                    whisper_fx: "ripple", trust_pulse: false
                }
            }
        };
    }

    saveCustomPreset(name, preset) {
        const presetsFile = './cli/themes/custom-presets.json';
        
        try {
            let customPresets = {};
            if (fs.existsSync(presetsFile)) {
                customPresets = JSON.parse(fs.readFileSync(presetsFile, 'utf8'));
            }
            
            customPresets[name] = preset;
            
            const presetsDir = path.dirname(presetsFile);
            if (!fs.existsSync(presetsDir)) {
                fs.mkdirSync(presetsDir, { recursive: true });
            }
            
            fs.writeFileSync(presetsFile, JSON.stringify(customPresets, null, 2));
            this.presets[name] = preset;
            
        } catch (error) {
            console.log(chalk.red(`Failed to save preset: ${error.message}`));
        }
    }

    // Utility methods
    clearScreen() {
        process.stdout.write('\x1b[2J\x1b[0f');
    }

    exitRemixMode() {
        if (this.state.hasUnsavedChanges) {
            console.log(chalk.yellow('\nYou have unsaved changes.'));
            this.rl.question('Save before exiting? (Y/n)> ', (save) => {
                if (save.toLowerCase() !== 'n') {
                    this.saveTheme();
                }
                this.doExit();
            });
        } else {
            this.doExit();
        }
    }

    doExit() {
        console.log(chalk.cyan('\n🎨 Theme remix complete. Your shrine reflects your vision.'));
        
        // Apply final theme
        this.cliEngine.theme = JSON.parse(JSON.stringify(this.workingTheme));
        this.cliEngine.renderShrine();
        
        this.rl.close();
        this.emit('remix-complete', {
            theme: this.workingTheme,
            hasChanges: this.state.hasUnsavedChanges
        });
    }
}

export default RemixCLIMode;