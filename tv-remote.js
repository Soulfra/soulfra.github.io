// TV Remote Portfolio JavaScript

class TVRemotePortfolio {
    constructor() {
        this.currentChannel = 0;
        this.channels = [];
        this.isOn = true;
        this.channelInput = '';
        this.channelInputTimeout = null;
        
        this.init();
    }
    
    async init() {
        console.log('📺 TV Remote Portfolio initializing...');
        
        await this.loadChannels();
        this.setupEventListeners();
        this.showWelcomeScreen();
        
        console.log(`✅ TV Remote ready with ${this.channels.length} channels`);
    }
    
    async loadChannels() {
        try {
            // Load repository data
            const response = await fetch('./channels.json');
            const data = await response.json();
            this.channels = data.channels;
            
            console.log(`📡 Loaded ${this.channels.length} channels`);
            
        } catch (error) {
            console.error('❌ Failed to load channels:', error);
            
            // Fallback channels
            this.channels = [
                {
                    number: 1,
                    name: 'Welcome Channel',
                    title: 'Soulfra Portfolio',
                    description: 'Professional developer portfolio',
                    type: 'welcome',
                    url: 'https://github.com/Soulfra'
                }
            ];
        }
    }
    
    setupEventListeners() {
        // Power button
        document.getElementById('power-btn').addEventListener('click', () => {
            this.togglePower();
        });
        
        // Channel controls
        document.getElementById('ch-up').addEventListener('click', () => {
            this.channelUp();
        });
        
        document.getElementById('ch-down').addEventListener('click', () => {
            this.channelDown();
        });
        
        // Navigation pad
        document.getElementById('nav-center').addEventListener('click', () => {
            this.selectChannel();
        });
        
        document.getElementById('nav-up').addEventListener('click', () => {
            this.channelUp();
        });
        
        document.getElementById('nav-down').addEventListener('click', () => {
            this.channelDown();
        });
        
        document.getElementById('nav-left').addEventListener('click', () => {
            this.previousChannel();
        });
        
        document.getElementById('nav-right').addEventListener('click', () => {
            this.nextChannel();
        });
        
        // Number pad
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.numberPressed(btn.dataset.number);
            });
        });
        
        // Function buttons
        document.getElementById('guide-btn').addEventListener('click', () => {
            this.showChannelGuide();
        });
        
        document.getElementById('info-btn').addEventListener('click', () => {
            this.showChannelInfo();
        });
        
        document.getElementById('menu-btn').addEventListener('click', () => {
            this.showMenu();
        });
        
        // Color buttons (filters)
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.applyFilter(btn.dataset.filter);
            });
        });
        
        // Channel guide
        document.getElementById('close-guide').addEventListener('click', () => {
            this.hideChannelGuide();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
    }
    
    togglePower() {
        this.isOn = !this.isOn;
        
        const screenContent = document.getElementById('screen-content');
        const powerBtn = document.getElementById('power-btn');
        
        if (this.isOn) {
            screenContent.style.display = 'block';
            powerBtn.style.background = 'linear-gradient(145deg, #ff4757, #ff3742)';
            this.showWelcomeScreen();
            console.log('📺 TV turned ON');
        } else {
            screenContent.style.display = 'none';
            powerBtn.style.background = 'linear-gradient(145deg, #666, #555)';
            this.updateChannelDisplay('--', 'TV OFF');
            console.log('📺 TV turned OFF');
        }
    }
    
    channelUp() {
        if (!this.isOn) return;
        
        this.currentChannel = (this.currentChannel + 1) % this.channels.length;
        this.changeChannel();
    }
    
    channelDown() {
        if (!this.isOn) return;
        
        this.currentChannel = this.currentChannel === 0 
            ? this.channels.length - 1 
            : this.currentChannel - 1;
        this.changeChannel();
    }
    
    nextChannel() {
        this.channelUp();
    }
    
    previousChannel() {
        this.channelDown();
    }
    
    numberPressed(number) {
        if (!this.isOn) return;
        
        this.channelInput += number;
        
        // Clear previous timeout
        if (this.channelInputTimeout) {
            clearTimeout(this.channelInputTimeout);
        }
        
        // Set timeout to process input
        this.channelInputTimeout = setTimeout(() => {
            this.goToChannel(parseInt(this.channelInput));
            this.channelInput = '';
        }, 1000);
        
        // Update display with input
        this.updateChannelDisplay(this.channelInput, 'Entering channel...');
    }
    
    goToChannel(channelNumber) {
        const channelIndex = this.channels.findIndex(ch => ch.number === channelNumber);
        
        if (channelIndex !== -1) {
            this.currentChannel = channelIndex;
            this.changeChannel();
        } else {
            this.showNoSignal();
        }
    }
    
    changeChannel() {
        if (!this.isOn || this.channels.length === 0) return;
        
        const channel = this.channels[this.currentChannel];
        
        // Add channel change animation
        const screenContent = document.getElementById('screen-content');
        screenContent.classList.add('channel-change');
        
        setTimeout(() => {
            this.showChannelContent(channel);
            screenContent.classList.remove('channel-change');
        }, 150);
        
        this.updateChannelDisplay(channel.number, channel.name);
        this.updateSignalStrength(4);
        
        console.log(`📺 Changed to channel ${channel.number}: ${channel.name}`);
    }
    
    selectChannel() {
        if (!this.isOn) return;
        
        const channel = this.channels[this.currentChannel];
        if (channel && channel.url) {
            window.open(channel.url, '_blank');
        }
    }
    
    showWelcomeScreen() {
        const screenContent = document.getElementById('screen-content');
        screenContent.innerHTML = `
            <div class="welcome-screen fade-in">
                <div class="logo">
                    <i class="fas fa-tv"></i>
                    <h1>Soulfra TV</h1>
                </div>
                <p>Professional Developer Portfolio</p>
                <div class="stats">
                    <div class="stat">
                        <span class="number">${this.channels.length}</span>
                        <span class="label">Channels</span>
                    </div>
                    <div class="stat">
                        <span class="number">${this.getLanguageCount()}</span>
                        <span class="label">Languages</span>
                    </div>
                </div>
                <p class="instruction">Use the remote to browse channels →</p>
                <div style="margin-top: 30px;">
                    <button class="repo-link primary" onclick="tvPortfolio.showChannelGuide()">
                        <i class="fas fa-list"></i> View Channel Guide
                    </button>
                </div>
            </div>
        `;
        
        this.updateChannelDisplay('--', 'Welcome');
        this.updateSignalStrength(4);
    }
    
    showChannelContent(channel) {
        const screenContent = document.getElementById('screen-content');
        
        if (channel.type === 'welcome') {
            this.showWelcomeScreen();
            return;
        }
        
        // Determine preview type and content
        const previewContent = this.generatePreviewContent(channel);
        
        screenContent.innerHTML = `
            <div class="repo-preview fade-in">
                <div class="repo-header">
                    <div class="repo-icon" style="background: ${this.getLanguageColor(channel.language)}">
                        <i class="${this.getLanguageIcon(channel.language)}"></i>
                    </div>
                    <div>
                        <div class="repo-title">${channel.title}</div>
                        <div class="repo-meta">
                            <span><i class="fas fa-code"></i> ${channel.language || 'Multiple'}</span>
                            <span><i class="fas fa-calendar"></i> ${this.formatDate(channel.created)}</span>
                            ${channel.stars ? `<span><i class="fas fa-star"></i> ${channel.stars}</span>` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="repo-description">
                    ${channel.description || 'Professional software project with modern architecture and best practices.'}
                </div>
                
                ${channel.topics && channel.topics.length > 0 ? `
                    <div class="repo-topics">
                        ${channel.topics.map(topic => 
                            `<span class="topic-tag">${topic}</span>`
                        ).join('')}
                    </div>
                ` : ''}
                
                <div class="repo-links">
                    <a href="${channel.url}" class="repo-link primary" target="_blank">
                        <i class="fab fa-github"></i> View Repository
                    </a>
                    ${this.shouldShowDemo(channel) ? `
                        <a href="${this.generateDemoUrl(channel)}" class="repo-link secondary" target="_blank">
                            <i class="fas fa-external-link-alt"></i> Live Preview
                        </a>
                    ` : ''}
                </div>
                
                ${previewContent}
            </div>
        `;
    }
    
    generatePreviewContent(channel) {
        // Generate preview based on repository type
        const name = channel.name.toLowerCase();
        const type = this.determineProjectType(channel);
        
        switch (type) {
            case 'web':
                return `
                    <div style="margin-top: 30px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                        <h4 style="color: #00c9ff; margin-bottom: 15px;">
                            <i class="fas fa-globe"></i> Web Application Preview
                        </h4>
                        <p style="color: #aaa;">
                            This web application features modern responsive design, interactive components, 
                            and optimized performance. Click "Live Preview" to see it in action.
                        </p>
                    </div>
                `;
                
            case 'api':
                return `
                    <div style="margin-top: 30px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                        <h4 style="color: #00c9ff; margin-bottom: 15px;">
                            <i class="fas fa-server"></i> API Service
                        </h4>
                        <p style="color: #aaa;">
                            RESTful API service with comprehensive documentation, authentication, 
                            and rate limiting. Built for scalability and performance.
                        </p>
                    </div>
                `;
                
            case 'ai':
                return `
                    <div style="margin-top: 30px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                        <h4 style="color: #00c9ff; margin-bottom: 15px;">
                            <i class="fas fa-robot"></i> AI/ML Project
                        </h4>
                        <p style="color: #aaa;">
                            Artificial intelligence project featuring machine learning algorithms, 
                            data processing, and intelligent automation capabilities.
                        </p>
                    </div>
                `;
                
            default:
                return `
                    <div style="margin-top: 30px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                        <h4 style="color: #00c9ff; margin-bottom: 15px;">
                            <i class="fas fa-code"></i> Software Project
                        </h4>
                        <p style="color: #aaa;">
                            Professional software project built with modern development practices, 
                            comprehensive testing, and clean architecture patterns.
                        </p>
                    </div>
                `;
        }
    }
    
    showNoSignal() {
        const screenContent = document.getElementById('screen-content');
        screenContent.innerHTML = `
            <div class="fade-in" style="text-align: center; padding: 100px 20px; color: #666;">
                <i class="fas fa-tv" style="font-size: 4rem; margin-bottom: 20px;"></i>
                <h3>No Signal</h3>
                <p>Channel not found</p>
            </div>
        `;
        
        this.updateChannelDisplay('--', 'No Signal');
        this.updateSignalStrength(0);
    }
    
    showChannelGuide() {
        const guide = document.getElementById('channel-guide');
        const channelList = document.getElementById('channel-list');
        
        // Populate channel list
        channelList.innerHTML = this.channels.map(channel => `
            <div class="channel-item" onclick="tvPortfolio.goToChannelFromGuide(${channel.number})">
                <div class="channel-number" style="
                    background: ${this.getLanguageColor(channel.language)};
                    color: white;
                    padding: 5px 10px;
                    border-radius: 4px;
                    font-weight: bold;
                    min-width: 40px;
                    text-align: center;
                ">
                    ${channel.number}
                </div>
                <div class="channel-info">
                    <div class="channel-title">${channel.title}</div>
                    <div class="channel-description">${channel.description}</div>
                </div>
                <div class="channel-meta">
                    <div>${channel.language || 'Mixed'}</div>
                    <div>${this.formatDate(channel.created)}</div>
                </div>
            </div>
        `).join('');
        
        guide.classList.add('active');
    }
    
    hideChannelGuide() {
        document.getElementById('channel-guide').classList.remove('active');
    }
    
    goToChannelFromGuide(channelNumber) {
        this.hideChannelGuide();
        this.goToChannel(channelNumber);
    }
    
    showChannelInfo() {
        if (!this.isOn || this.channels.length === 0) return;
        
        const channel = this.channels[this.currentChannel];
        alert(`Channel ${channel.number}: ${channel.title}\n${channel.description}`);
    }
    
    showMenu() {
        alert('TV Menu:\n• Press GUIDE for channel guide\n• Press INFO for channel info\n• Use number pad for direct channel selection\n• Use color buttons to filter channels');
    }
    
    applyFilter(filter) {
        // Filter channels based on type
        console.log(`🎨 Applying filter: ${filter}`);
        
        // This could filter the channels array and refresh the display
        // For now, just show a message
        this.showFilterMessage(filter);
    }
    
    showFilterMessage(filter) {
        const filterNames = {
            web: 'Web Projects',
            ai: 'AI/ML Projects', 
            tools: 'Developer Tools',
            libs: 'Libraries'
        };
        
        const screenContent = document.getElementById('screen-content');
        screenContent.innerHTML = `
            <div class="fade-in" style="text-align: center; padding: 100px 20px; color: #fff;">
                <i class="fas fa-filter" style="font-size: 3rem; color: #00c9ff; margin-bottom: 20px;"></i>
                <h3>Filter Applied</h3>
                <p>Showing: ${filterNames[filter] || filter}</p>
                <p style="color: #666; margin-top: 20px;">Use channel up/down to browse filtered results</p>
            </div>
        `;
        
        this.updateChannelDisplay('F', `Filter: ${filterNames[filter]}`);
    }
    
    updateChannelDisplay(number, name) {
        document.getElementById('channel-number').textContent = number;
        document.getElementById('channel-name').textContent = name;
    }
    
    updateSignalStrength(strength) {
        const bars = document.querySelectorAll('.signal-bar');
        bars.forEach((bar, index) => {
            if (index < strength) {
                bar.classList.add('active');
            } else {
                bar.classList.remove('active');
            }
        });
    }
    
    handleKeyboard(e) {
        if (!this.isOn) return;
        
        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.channelUp();
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.channelDown();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.previousChannel();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextChannel();
                break;
            case 'Enter':
                e.preventDefault();
                this.selectChannel();
                break;
            case 'g':
            case 'G':
                this.showChannelGuide();
                break;
            case 'i':
            case 'I':
                this.showChannelInfo();
                break;
            case ' ':
                e.preventDefault();
                this.togglePower();
                break;
            default:
                if (e.key >= '0' && e.key <= '9') {
                    this.numberPressed(e.key);
                }
        }
    }
    
    // Utility methods
    getLanguageCount() {
        const languages = new Set();
        this.channels.forEach(channel => {
            if (channel.language) {
                languages.add(channel.language);
            }
        });
        return languages.size;
    }
    
    getLanguageColor(language) {
        const colors = {
            JavaScript: '#f1e05a',
            TypeScript: '#2b7489',
            Python: '#3572A5',
            Rust: '#dea584',
            Go: '#00ADD8',
            Java: '#b07219',
            'C++': '#f34b7d',
            HTML: '#e34c26',
            CSS: '#563d7c',
            Vue: '#4FC08D',
            React: '#61DAFB',
            PHP: '#777bb4'
        };
        return colors[language] || '#666';
    }
    
    getLanguageIcon(language) {
        const icons = {
            JavaScript: 'fab fa-js',
            TypeScript: 'fab fa-js',
            Python: 'fab fa-python',
            Rust: 'fab fa-rust',
            Go: 'fab fa-golang',
            Java: 'fab fa-java',
            HTML: 'fab fa-html5',
            CSS: 'fab fa-css3-alt',
            Vue: 'fab fa-vuejs',
            React: 'fab fa-react',
            PHP: 'fab fa-php'
        };
        return icons[language] || 'fas fa-code';
    }
    
    determineProjectType(channel) {
        const name = channel.name.toLowerCase();
        const desc = (channel.description || '').toLowerCase();
        const topics = (channel.topics || []).join(' ').toLowerCase();
        
        if (name.includes('web') || desc.includes('web') || topics.includes('web')) return 'web';
        if (name.includes('api') || desc.includes('api') || topics.includes('api')) return 'api';
        if (name.includes('ai') || name.includes('ml') || topics.includes('ai')) return 'ai';
        if (name.includes('tool') || topics.includes('tool')) return 'tool';
        
        return 'project';
    }
    
    shouldShowDemo(channel) {
        const name = channel.name.toLowerCase();
        const type = this.determineProjectType(channel);
        
        return type === 'web' || name.includes('demo') || channel.language === 'HTML';
    }
    
    generateDemoUrl(channel) {
        return `https://soulfra.github.io/${channel.name}`;
    }
    
    formatDate(dateString) {
        if (!dateString) return 'Recently';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short' 
        });
    }
}

// Initialize TV Remote Portfolio
let tvPortfolio;
document.addEventListener('DOMContentLoaded', () => {
    tvPortfolio = new TVRemotePortfolio();
});

// Console welcome message
console.log('📺 TV Remote Portfolio loaded!');
console.log('🎮 Keyboard shortcuts:');
console.log('  ↑↓ - Change channels');
console.log('  ←→ - Previous/Next');
console.log('  Enter - Select channel');
console.log('  G - Channel Guide');
console.log('  I - Channel Info');
console.log('  Space - Power toggle');